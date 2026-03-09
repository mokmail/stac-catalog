#!/usr/bin/env python3
"""
BEV CSW Metadata Fetcher
Fetches and parses metadata from BEV CSW service
"""

import requests
import xml.etree.ElementTree as ET
import json
import urllib.parse

BASE_URL = "https://data.bev.gv.at/geonetwork/srv/eng/csw"

def get_record_by_id(record_id):
    """Fetch a single record by ID"""
    params = {
        'service': 'CSW',
        'request': 'GetRecordById',
        'version': '2.0.2',
        'outputSchema': 'http://www.isotc211.org/2005/gmd',
        'ElementSetName': 'full',
        'id': record_id
    }
    
    response = requests.get(BASE_URL, params=params)
    return response.text

def parse_metadata(xml_text):
    """Parse BEV metadata XML"""
    # Register namespaces
    ns = {
        'gmd': 'http://www.isotc211.org/2005/gmd',
        'gco': 'http://www.isotc211.org/2005/gco',
        'srv': 'http://www.isotc211.org/2005/srv',
        'gml': 'http://www.opengis.net/gml',
        'gmx': 'http://www.isotc211.org/2005/gmx',
        'xlink': 'http://www.w3.org/1999/xlink'
    }
    
    try:
        root = ET.fromstring(xml_text)
    except Exception as e:
        print(f"XML Parse Error: {e}")
        return None
    
    # Extract key information
    result = {
        'id': None,
        'title': None,
        'abstract': None,
        'date': None,
        'type': None,
        'crs': [],
        'bounds': None,
        'wms_url': None,
        'layers': [],
        'download_urls': [],
        'keywords': []
    }
    
    # Get file identifier
    file_id = root.find('.//gmd:fileIdentifier/gco:CharacterString', ns)
    if file_id is not None:
        result['id'] = file_id.text
    
    # Get title
    title = root.find('.//gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString', ns)
    if title is not None:
        result['title'] = title.text
    
    # Get title from service identification
    if result['title'] is None:
        title = root.find('.//srv:SV_ServiceIdentification/gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString', ns)
        if title is not None:
            result['title'] = title.text
    
    # Get abstract
    abstract = root.find('.//gmd:abstract/gco:CharacterString', ns)
    if abstract is not None:
        result['abstract'] = abstract.text
    
    # Get date
    date = root.find('.//gmd:citation/gmd:CI_Date/gmd:date/gco:DateTime', ns)
    if date is not None:
        result['date'] = date.text
    
    # Get CRS
    for code in root.findall('.//gmd:referenceSystemInfo/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier/gmd:RS_Identifier/gmd:code/gmx:Anchor', ns):
        if code is not None:
            href = code.get('{http://www.w3.org/1999/xlink}href', '')
            if 'EPSG' in href:
                result['crs'].append(href.split('/')[-1])
    
    # Get bounds
    bbox = root.find('.//srv:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicBoundingBox', ns)
    if bbox is not None:
        west = bbox.find('gmd:westBoundLongitude/gco:Decimal', ns)
        east = bbox.find('gmd:eastBoundLongitude/gco:Decimal', ns)
        south = bbox.find('gmd:southBoundLatitude/gco:Decimal', ns)
        north = bbox.find('gmd:northBoundLatitude/gco:Decimal', ns)
        
        if all([west, east, south, north]):
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
    
    # Get WMS/WFS URLs and layers
    for link in root.findall('.//gmd:transferOptions/gmd:MD_DigitalTransferOptions/gmd:onLine/gmd:CI_OnlineResource', ns):
        url = link.find('gmd:linkage/gmd:URL', ns)
        protocol = link.find('gmd:protocol/gco:CharacterString', ns)
        name = link.find('gmd:name/gco:CharacterString', ns)
        
        if url is not None:
            url_text = url.text
            if 'WMS' in (protocol.text if protocol is not None else ''):
                result['wms_url'] = url_text
                if name is not None:
                    result['layers'].append(name.text)
            elif 'download' in (protocol.text if protocol is not None else '').lower() or url_text.endswith(('.tif', '.zip', '.json')):
                result['download_urls'].append({
                    'url': url_text,
                    'name': name.text if name is not None else None,
                    'protocol': protocol.text if protocol is not None else None
                })
    
    # Get keywords
    for kw in root.findall('.//gmd:descriptiveKeywords/gmd:MD_Keywords/gmd:keyword', ns):
        if kw.text:
            result['keywords'].append(kw.text)
    
    return result

def search_by_bbox(bbox=None, keywords=None, max_records=50):
    """Search CSW by bounding box or keywords"""
    # Build filter
    filter_xml = ''
    if bbox:
        filter_xml = f'''
        <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:BBOX>
                <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                <gml:Envelope xmlns:gml="http://www.opengis.net/gml">
                    <gml:lowerCorner>{bbox['west']} {bbox['south']}</gml:lowerCorner>
                    <gml:upperCorner>{bbox['east']} {bbox['north']}</gml:upperCorner>
                </gml:Envelope>
            </ogc:BBOX>
        </ogc:Filter>
        '''
    
    # Use GetRecords request
    params = {
        'service': 'CSW',
        'request': 'GetRecords',
        'version': '2.0.2',
        'typeNames': 'csw:Record',
        'resultType': 'results',
        'maxRecords': str(max_records),
        'outputSchema': 'http://www.opengis.net/cat/csw/2.0.2'
    }
    
    response = requests.get(BASE_URL, params=params)
    return response.text

def get_all_formats():
    """Get all available data formats from BEV"""
    # Common BEV data types
    formats = [
        ('DOP', 'Digital Orthophotos'),
        ('KM', 'Cartographic Models'),
        ('LC', 'Land Cover'),
        ('DGM', 'Digital Terrain Model'),
        ('DLM', 'Digital Landscape Model'),
    ]
    
    results = {}
    
    for fmt, desc in formats:
        print(f"Searching for {fmt} ({desc})...")
        params = {
            'service': 'CSW',
            'request': 'GetRecords',
            'version': '2.0.2',
            'typeNames': 'csw:Record',
            'resultType': 'results',
            'maxRecords': '10',
            'q': fmt
        }
        
        try:
            response = requests.get(BASE_URL, params=params, timeout=30)
            # Just get count
            results[fmt] = {
                'description': desc,
                'status': 'available' if response.status_code == 200 else 'error'
            }
        except Exception as e:
            results[fmt] = {
                'description': desc,
                'status': f'error: {e}'
            }
    
    return results

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python bev_csw.py get <record_id>     - Get a specific record")
        print("  python bev_csw.py search <query>     - Search for records")
        print("  python bev_csw.py formats            - Check available formats")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'get':
        if len(sys.argv) < 3:
            print("Usage: python bev_csw.py get <record_id>")
            sys.exit(1)
        
        record_id = sys.argv[2]
        print(f"Fetching record: {record_id}")
        xml = get_record_by_id(record_id)
        
        # Parse and print
        data = parse_metadata(xml)
        if data:
            print("\n" + "="*60)
            print("METADATA")
            print("="*60)
            print(json.dumps(data, indent=2, ensure_ascii=False))
    
    elif command == 'search':
        query = sys.argv[2] if len(sys.argv) > 2 else 'GeoTIFF'
        print(f"Searching for: {query}")
        results = search_by_bbox(keywords=query)
        print(results[:500] if len(results) > 500 else results)
    
    elif command == 'formats':
        print("Checking available BEV data formats...")
        results = get_all_formats()
        print(json.dumps(results, indent=2))
    
    else:
        print(f"Unknown command: {command}")
