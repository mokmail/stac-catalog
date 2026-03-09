#!/usr/bin/env python3
"""
BEV STAC Backend Server - Flask API for raster analysis
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from shapely.geometry import shape, mapping, box, Point, Polygon
import pyproj
import numpy as np
import json
import os
from pathlib import Path
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__, static_folder='../dist')
CORS(app)

# BEV Land Cover Classification Legend
LAND_COVER_LEGEND = {
    1: {'en': 'High Vegetation', 'de': 'Wald / Hohe Vegetation', 'color': '#0C6400'},
    2: {'en': 'Soil Areas', 'de': 'Bodenflächen', 'color': '#CDAA66'},
    3: {'en': 'Medium Vegetation', 'de': 'Mittlere Vegetation', 'color': '#60C630'},
    4: {'en': 'Buildings', 'de': 'Gebäude', 'color': '#E60000'},
    5: {'en': 'Water Bodies', 'de': 'Gewässer', 'color': '#005CE6'},
    6: {'en': 'Low Vegetation', 'de': 'Niedrige Vegetation', 'color': '#D2F0BE'},
}


def get_crs_info(crs):
    """Get CRS information"""
    if crs is None:
        return "Unknown CRS"
    
    crs_str = str(crs)
    if '3416' in crs_str:
        return "EPSG:3416 - Austria Lambert (BEV custom)"
    elif '4326' in crs_str:
        return "EPSG:4326 - WGS84"
    elif '25832' in crs_str:
        return "EPSG:25832 - ETRS89 / UTM zone 32N"
    elif '25833' in crs_str:
        return "EPSG:25833 - ETRS89 / UTM zone 33N"
    return crs_str


def transform_bounds(bounds, src_crs, dst_crs='EPSG:4326'):
    """Transform bounds from one CRS to another"""
    if src_crs is None:
        return None
    
    src_crs_str = str(src_crs) if src_crs else ''
    dst_crs_str = dst_crs
    
    if src_crs_str == dst_crs_str or '4326' in src_crs_str:
        return bounds
    
    try:
        transformer = pyproj.Transformer.from_crs(src_crs, dst_crs, always_xy=True)
        min_lon, min_lat = transformer.transform(bounds[0], bounds[1])
        max_lon, max_lat = transformer.transform(bounds[2], bounds[3])
        return [min_lon, min_lat, max_lon, max_lat]
    except Exception as e:
        print(f"Transform error: {e}")
        return None


@app.route('/api/metadata', methods=['POST'])
def get_metadata():
    """Get COG metadata"""
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try:
        filepath = url
        
        # For HTTP/HTTPS URLs, use GDAL's virtual file system
        if url.startswith('http://') or url.startswith('https://'):
            # Use vsicurl for remote COG access
            filepath = f'/vsicurl/{url}'
        
        print(f"Opening: {filepath}")
        
        with rasterio.open(filepath) as src:
            bounds = src.bounds
            
            # Transform to WGS84
            wgs84_bounds = transform_bounds(
                [bounds.left, bounds.bottom, bounds.right, bounds.top],
                src.crs
            )
            
            # Safely get overviews
            overviews = {}
            try:
                if src.overviews:
                    overviews = {int(k): list(v) for k, v in src.overviews.items()} if hasattr(src.overviews, 'items') else {}
            except Exception:
                pass
            
            metadata = {
                'driver': src.driver,
                'width': src.width,
                'height': src.height,
                'bands': src.count,
                'crs': str(src.crs) if src.crs else None,
                'crs_info': get_crs_info(src.crs),
                'bounds': {
                    'left': bounds.left,
                    'right': bounds.right,
                    'top': bounds.top,
                    'bottom': bounds.bottom
                },
                'bounds_wgs84': {
                    'west': wgs84_bounds[0],
                    'east': wgs84_bounds[2],
                    'south': wgs84_bounds[1],
                    'north': wgs84_bounds[3]
                } if wgs84_bounds else None,
                'resolution': {
                    'x': src.res[0],
                    'y': src.res[1],
                    'unit': src.crs.linear_units if src.crs else 'unknown'
                },
                'nodata': src.nodata,
                'dtypes': src.dtypes,
                'colorinterp': [str(src.colorinterp[i]) for i in range(src.count)],
                'overviews': overviews,
                'is_cloud_optimized': src.driver == 'GTiff'
            }
            
            return jsonify(metadata)
    
    except Exception as e:
        import traceback
        print(f"Error opening {url}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500


@app.route('/api/land-cover', methods=['POST'])
def analyze_land_cover():
    """Analyze land cover classification"""
    data = request.json
    url = data.get('url')
    
    try:
        with rasterio.open(url) as src:
            # Read all data
            window = src.window(0, 0, src.width, src.height)
            data = src.read(window=window)
            
            if len(data.shape) == 3:
                data = data[0]
            
            unique, counts = np.unique(data, return_counts=True)
            total_pixels = counts.sum()
            
            distribution = []
            for val, count in zip(unique, counts):
                val_int = int(val)
                if val_int in LAND_COVER_LEGEND:
                    info = LAND_COVER_LEGEND[val_int]
                    distribution.append({
                        'class': val_int,
                        'name_en': info['en'],
                        'name_de': info['de'],
                        'color': info['color'],
                        'pixels': int(count),
                        'percentage': round((count / total_pixels) * 100, 2)
                    })
                elif val == src.nodata or (isinstance(val, float) and np.isnan(val)):
                    distribution.append({
                        'class': 'nodata',
                        'name_en': 'NoData',
                        'name_de': 'Keine Daten',
                        'pixels': int(count),
                        'percentage': round((count / total_pixels) * 2, 2)
                    })
            
            return jsonify({
                'total_pixels': int(total_pixels),
                'distribution': sorted(distribution, key=lambda x: x['class'] if isinstance(x['class'], int) else 0),
                'legend': LAND_COVER_LEGEND
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sample', methods=['POST'])
def sample_raster():
    """Sample raster values at coordinates"""
    data = request.json
    url = data.get('url')
    lon = data.get('lon', 13.5)
    lat = data.get('lat', 47.5)
    
    try:
        with rasterio.open(url) as src:
            # Transform to source CRS
            if src.crs and str(src.crs) != 'EPSG:4326':
                wgs84 = pyproj.CRS('EPSG:4326')
                transformer = pyproj.Transformer.from_crs(wgs84, src.crs, always_xy=True)
                x, y = transformer.transform(lon, lat)
            else:
                x, y = lon, lat
            
            # Check bounds
            bounds = src.bounds
            if not (bounds.left <= x <= bounds.right and bounds.bottom <= y <= bounds.top):
                return jsonify({
                    'error': 'Point outside raster bounds',
                    'point': {'x': x, 'y': y},
                    'bounds': {'left': bounds.left, 'right': bounds.right, 'top': bounds.top, 'bottom': bounds.bottom}
                }), 400
            
            row, col = src.index(x, y)
            values = src.read(window=((row, row+1), (col, col+1)))
            
            result = {
                'location': {'lon': lon, 'lat': lat},
                'pixel': {'row': int(row), 'col': int(col), 'x': round(x, 2), 'y': round(y, 2)},
                'values': []
            }
            
            for i in range(values.shape[0]):
                val = values[i, 0, 0]
                val_int = int(val) if not np.isnan(val) else None
                
                value_info = {
                    'band': i + 1,
                    'value': float(val) if not np.isnan(val) else None,
                    'dtype': src.dtypes[i]
                }
                
                if val_int in LAND_COVER_LEGEND:
                    value_info['classification'] = LAND_COVER_LEGEND[val_int]
                
                result['values'].append(value_info)
            
            return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/footprint', methods=['POST'])
def get_footprint():
    """Get footprint geometry"""
    data = request.json
    url = data.get('url')
    
    try:
        with rasterio.open(url) as src:
            bounds = src.bounds
            geom = box(bounds.left, bounds.bottom, bounds.right, bounds.top)
            
            # Transform to WGS84
            if src.crs and str(src.crs) != 'EPSG:4326':
                wgs84 = pyproj.CRS('EPSG:4326')
                transformer = pyproj.Transformer.from_crs(src.crs, wgs84, always_xy=True)
                geom_wgs84 = transform_geom(geom, transformer)
            else:
                geom_wgs84 = geom
            
            return jsonify({
                'crs': str(src.crs),
                'geometry': mapping(geom),
                'geometry_wgs84': mapping(geom_wgs84),
                'bounds': dict(zip(['left', 'bottom', 'right', 'top'], bounds)),
                'area': geom.area
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def transform_geom(geom, transformer):
    """Transform shapely geometry"""
    if geom.geom_type == 'Polygon':
        coords = []
        for ring in [geom.exterior] + list(geom.interiors):
            transformed = [transformer.transform(x, y) for x, y in ring.coords]
            coords.append(transformed)
        return Polygon(coords[0], coords[1:])
    return geom


@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """List available BEV datasets"""
    datasets = [
        {
            'id': 'bev-km500-2025',
            'name': 'Kartographisches Modell 1:500.000 Raster',
            'name_en': 'Cartographic Model 1:500,000 Raster',
            'scale': '1:500,000',
            'crs': 'EPSG:3416',
            'description': 'Das KM500-R ist die digitale Karte des gesamten österreichischen Staatsgebietes im Maßstab 1:500 000.',
            'url': 'https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM500/20251001/KM500_R_CRS3416_508dpi_Farbbild_COG_20251001.tif'
        },
        {
            'id': 'bev-km250-utm32-2025',
            'name': 'Kartographisches Modell 1:250.000 Raster UTM32',
            'name_en': 'Cartographic Model 1:250,000 Raster UTM32',
            'scale': '1:250,000',
            'crs': 'EPSG:25832',
            'description': 'Das KM250-R ist die digitale staatliche Karte Österreichs im Maßstab 1:250 000 (UTM32).',
            'url': 'https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM250/20250902/KM250_R_CRS25832_508dpi_Farbbild_COG_20250902.tif'
        },
        {
            'id': 'bev-km250-utm33-2025',
            'name': 'Kartographisches Modell 1:250.000 Raster UTM33',
            'name_en': 'Cartographic Model 1:250,000 Raster UTM33',
            'scale': '1:250,000',
            'crs': 'EPSG:25833',
            'description': 'Das KM250-R ist die digitale staatliche Karte Österreichs im Maßstab 1:250 000 (UTM33).',
            'url': 'https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM250/20250902/KM250_R_CRS25833_508dpi_Farbbild_COG_20250902.tif'
        },
        {
            'id': 'bev-lc-mosaik-2023',
            'name': 'Land Cover Mosaik Österreich 2023',
            'name_en': 'Land Cover Mosaic Austria 2023',
            'type': 'land-cover',
            'crs': 'EPSG:3416',
            'description': 'Bodenbedeckungsdaten (Land Cover) für ganz Österreich. Klassifiziert in 6 Kategorien.',
            'url': 'https://data.bev.gv.at/ephemeral/bev-download/LC/20241015/2023450_Mosaik_LC.tif',
            'legend': LAND_COVER_LEGEND
        }
    ]
    
    return jsonify(datasets)


@app.route('/api/histogram', methods=['POST'])
def get_histogram():
    """Get raster histogram"""
    data = request.json
    url = data.get('url')
    bins = data.get('bins', 256)
    
    try:
        with rasterio.open(url) as src:
            histogram = {}
            for i in range(1, src.count + 1):
                band_data = src.read(i)
                if src.nodata is not None:
                    band_data = band_data[band_data != src.nodata]
                
                hist, bin_edges = np.histogram(band_data, bins=bins)
                histogram[f'band_{i}'] = {
                    'histogram': hist.tolist(),
                    'bins': bin_edges.tolist(),
                    'min': float(band_data.min()),
                    'max': float(band_data.max()),
                    'mean': float(band_data.mean()),
                    'std': float(band_data.std())
                }
            
            return jsonify(histogram)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Serve React app for all other routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/bev-metadata', methods=['POST'])
def get_bev_metadata():
    """Fetch and parse BEV metadata from CSW"""
    import requests
    import xml.etree.ElementTree as ET
    
    data = request.json
    record_id = data.get('id')
    
    if not record_id:
        return jsonify({'error': 'No record ID provided'}), 400
    
    # Fetch from BEV CSW
    csw_url = "https://data.bev.gv.at/geonetwork/srv/eng/csw"
    params = {
        'service': 'CSW',
        'request': 'GetRecordById',
        'version': '2.0.2',
        'outputSchema': 'http://www.isotc211.org/2005/gmd',
        'ElementSetName': 'full',
        'id': record_id
    }
    
    try:
        response = requests.get(csw_url, params=params, timeout=30)
        xml_text = response.text
        
        # Parse XML
        ns = {
            'gmd': 'http://www.isotc211.org/2005/gmd',
            'gco': 'http://www.isotc211.org/2005/gco',
            'srv': 'http://www.isotc211.org/2005/srv',
            'gml': 'http://www.opengis.net/gml',
            'gmx': 'http://www.isotc211.org/2005/gmx',
            'xlink': 'http://www.w3.org/1999/xlink'
        }
        
        root = ET.fromstring(xml_text)
        
        result = {
            'id': None,
            'title': None,
            'abstract': None,
            'date': None,
            'type': None,
            'crs': [],
            'bounds': None,
            'wms_url': None,
            'wfs_url': None,
            'layers': [],
            'download_urls': []
        }
        
        # Get file identifier
        file_id = root.find('.//gmd:fileIdentifier/gco:CharacterString', ns)
        if file_id is not None:
            result['id'] = file_id.text
        
        # Get title
        title = root.find('.//srv:SV_ServiceIdentification/gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString', ns)
        if title is None:
            title = root.find('.//gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString', ns)
        if title is not None:
            result['title'] = title.text
        
        # Get abstract
        abstract = root.find('.//gmd:abstract/gco:CharacterString', ns)
        if abstract is not None:
            result['abstract'] = abstract.text
        
        # Get CRS
        for code in root.findall('.//gmd:referenceSystemInfo/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier/gmd:RS_Identifier/gmd:code/gmx:Anchor', ns):
            href = code.get('{http://www.w3.org/1999/xlink}href', '')
            if 'EPSG' in href:
                result['crs'].append(href.split('/')[-1])
        
        # Get bounds
        bbox = root.find('.//srv:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox', ns)
        if bbox is None:
            bbox = root.find('.//gmd:identificationInfo/gmd:MD_DataIdentification/gmd:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox', ns)
        
        if bbox is not None:
            west = bbox.find('gmd:westBoundLongitude/gco:Decimal', ns)
            east = bbox.find('gmd:eastBoundLongitude/gco:Decimal', ns)
            south = bbox.find('gmd:southBoundLatitude/gco:Decimal', ns)
            north = bbox.find('gmd:northBoundLatitude/gco:Decimal', ns)
            
            if all([west is not None, east is not None, south is not None, north is not None]):
                result['bounds'] = {
                    'west': float(west.text),
                    'east': float(east.text),
                    'south': float(south.text),
                    'north': float(north.text)
                }
        
        # Get service type
        service_type = root.find('.//srv:serviceType/gco:LocalName', ns)
        if service_type is not None:
            result['type'] = service_type.text
        
        # Get WMS/WFS URLs
        for link in root.findall('.//gmd:transferOptions/gmd:MD_DigitalTransferOptions/gmd:onLine/gmd:CI_OnlineResource', ns):
            url = link.find('gmd:linkage/gmd:URL', ns)
            protocol = link.find('gmd:protocol/gco:CharacterString', ns)
            name = link.find('gmd:name/gco:CharacterString', ns)
            
            if url is not None and protocol is not None:
                url_text = url.text
                protocol_text = protocol.text or ''
                
                if 'WMS' in protocol_text and result.get('wms_url') is None:
                    result['wms_url'] = url_text
                    if name is not None:
                        result['layers'].append(name.text)
                elif 'WFS' in protocol_text and result.get('wfs_url') is None:
                    result['wfs_url'] = url_text
                elif 'download' in protocol_text.lower() or url_text.endswith(('.tif', '.zip', '.json', '.tiff')):
                    result['download_urls'].append({
                        'url': url_text,
                        'name': name.text if name is not None else None
                    })
        
        return jsonify(result)
    
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
