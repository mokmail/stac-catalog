#!/usr/bin/env python3
"""
BEV Data Viewer - Using rasterio and shapely to analyze data.bev.gv.at COG files
"""

import sys
import argparse
from pathlib import Path

try:
    import rasterio
    from rasterio.warp import calculate_default_transform, reproject, Resampling
    import numpy as np
except ImportError:
    print("Error: rasterio not installed. Run: pip install rasterio numpy")
    sys.exit(1)

try:
    from shapely.geometry import shape, mapping, box, Point, Polygon
    from shapely.ops import transform
except ImportError:
    print("Error: shapely not installed. Run: pip install shapely")
    sys.exit(1)

import pyproj
from functools import partial


# BEV Land Cover Classification Legend
LAND_COVER_LEGEND = {
    1: ('High Vegetation', 'Wald / Hohe Vegetation', '#0C6400'),
    2: ('Soil Areas', 'Bodenflächen', '#CDAA66'),
    3: ('Medium Vegetation', 'Mittlere Vegetation', '#60C630'),
    4: ('Buildings', 'Gebäude', '#E60000'),
    5: ('Water Bodies', 'Gewässer', '#005CE6'),
    6: ('Low Vegetation', 'Niedrige Vegetation', '#D2F0BE'),
}


def get_crs_info(crs):
    """Get CRS information"""
    if crs is None:
        return "Unknown CRS"
    
    crs_str = str(crs)
    if '3416' in crs_str or 'EPSG:3416' in crs_str:
        return "EPSG:3416 - Austria Lambert (BEV custom)"
    elif '4326' in crs_str or 'EPSG:4326' in crs_str:
        return "EPSG:4326 - WGS84"
    elif '25832' in crs_str:
        return "EPSG:25832 - ETRS89 / UTM zone 32N"
    elif '25833' in crs_str:
        return "EPSG:25833 - ETRS89 / UTM zone 33N"
    return crs_str


def analyze_cog_metadata(filepath):
    """Analyze COG file metadata"""
    print(f"\n{'='*60}")
    print(f"COG Metadata Analysis: {Path(filepath).name}")
    print(f"{'='*60}\n")
    
    with rasterio.open(filepath) as src:
        # Basic Information
        print("📍 BASIC INFORMATION")
        print("-" * 40)
        print(f"  File: {filepath}")
        print(f"  Driver: {src.driver}")
        print(f"  Size: {src.width} x {src.height} pixels")
        print(f"  Bands: {src.count}")
        
        # CRS Information
        print("\n🗺️ COORDINATE REFERENCE SYSTEM")
        print("-" * 40)
        print(f"  CRS: {get_crs_info(src.crs)}")
        print(f"  Units: {src.crs.linear_units if src.crs else 'Unknown'}")
        
        # Bounds
        print("\n📐 SPATIAL EXTENT")
        print("-" * 40)
        bounds = src.bounds
        print(f"  Left:   {bounds.left:,.2f}")
        print(f"  Right:  {bounds.right:,.2f}")
        print(f"  Top:    {bounds.top:,.2f}")
        print(f"  Bottom: {bounds.bottom:,.2f}")
        
        # Create shapely geometry from bounds
        bounds_box = box(bounds.left, bounds.bottom, bounds.right, bounds.top)
        print(f"  Area:   {bounds_box.area:,.2f} sq units")
        
        # Transform to WGS84 for lat/lon
        if src.crs and src.crs != 'EPSG:4326':
            try:
                wgs84 = pyproj.CRS('EPSG:4326')
                transformer = pyproj.Transformer.from_crs(src.crs, wgs84, always_xy=True)
                min_lon, min_lat = transformer.transform(bounds.left, bounds.bottom)
                max_lon, max_lat = transformer.transform(bounds.right, bounds.top)
                print(f"\n  WGS84 Extent:")
                print(f"    Lon: {min_lon:.4f} to {max_lon:.4f}")
                print(f"    Lat: {min_lat:.4f} to {max_lat:.4f}")
            except Exception as e:
                print(f"    (Could not transform to WGS84: {e})")
        
        # Resolution
        print("\n📏 RESOLUTION")
        print("-" * 40)
        res = src.res
        print(f"  Pixel Size: {res[0]:.4f} x {res[1]:.4f}")
        if src.crs:
            unit = src.crs.linear_units or 'units'
            print(f"  Unit: {unit}")
        
        # Transform
        if src.transform:
            print(f"\n  Affine Transform:")
            print(f"    a: {src.transform.a}")
            print(f"    b: {src.transform.b}")
            print(f"    c: {src.transform.c}")
            print(f"    d: {src.transform.d}")
            print(f"    e: {src.transform.e}")
            print(f"    f: {src.transform.f}")
        
        # Data Types
        print("\n🔢 DATA TYPES")
        print("-" * 40)
        for i in range(1, src.count + 1):
            band = src.tags(i)
            dtype = src.dtypes[i-1]
            print(f"  Band {i}: {dtype}")
            if 'nodata' in band:
                print(f"         NoData: {band['nodata']}")
        
        # Color Interpolation
        print("\n🎨 COLOR INTERPRETATION")
        print("-" * 40)
        for i in range(1, src.count + 1):
            color = src.colorinterp[i-1]
            print(f"  Band {i}: {color}")
        
        # Overviews
        print("\n🔍 OVERVIEWS")
        print("-" * 40)
        if src.overviews:
            print(f"  Available levels: {list(src.overviews.keys())}")
            for level in src.overviews:
                print(f"    Level {level}: {src.overviews[level]} x {src.overviews[level]}")
        else:
            print("  No overviews available")
        
        # Check if it's cloud optimized
        print("\n☁️ CLOUD OPTIMIZATION")
        print("-" * 40)
        if src.driver == 'GTiff':
            tags = src.tags()
            if 'CLOUD_OPTIMIZED' in str(tags):
                print("  ✓ Cloud Optimized GeoTIFF")
            else:
                print("  ⚠ May not be optimized for cloud")
        
        print()


def analyze_land_cover(filepath, sample_size=10000):
    """Analyze land cover data classification"""
    print(f"\n{'='*60}")
    print("Land Cover Classification Analysis")
    print(f"{'='*60}\n")
    
    with rasterio.open(filepath) as src:
        # Read a sample of the data
        window = src.window(0, 0, src.width, src.height)
        data = src.read(window=window)
        
        if len(data.shape) == 3:
            data = data[0]  # Get first band
        
        # Count unique values
        unique, counts = np.unique(data, return_counts=True)
        
        print("📊 CLASSIFICATION DISTRIBUTION")
        print("-" * 40)
        total_pixels = counts.sum()
        
        for val, count in zip(unique, counts):
            val_int = int(val)
            if val_int in LAND_COVER_LEGEND:
                name_en, name_de, color = LAND_COVER_LEGEND[val_int]
                pct = (count / total_pixels) * 100
                print(f"  {val_int}: {name_en:20} ({name_de})")
                print(f"       {count:>12,} pixels ({pct:5.2f}%)")
            elif val == src.nodata or np.isnan(val):
                print(f"  NoData: {count:,} pixels")
            else:
                print(f"  {val_int}: Unknown class - {count:,} pixels ({count/total_pixels*100:.2f}%)")
        
        print()


def sample_raster_values(filepath, lon, lat):
    """Sample raster values at a given lat/lon coordinate"""
    print(f"\n{'='*60}")
    print(f"Sampling Raster at Location ({lon}, {lat})")
    print(f"{'='*60}\n")
    
    with rasterio.open(filepath) as src:
        # Transform WGS84 to source CRS
        if src.crs and src.crs != 'EPSG:4326':
            wgs84 = pyproj.CRS('EPSG:4326')
            transformer = pyproj.Transformer.from_crs(wgs84, src.crs, always_xy=True)
            x, y = transformer.transform(lon, lat)
        else:
            x, y = lon, lat
        
        # Check if point is within bounds
        bounds = src.bounds
        if not (bounds.left <= x <= bounds.right and bounds.bottom <= y <= bounds.top):
            print(f"⚠ Point ({x}, {y}) is outside raster bounds")
            return
        
        # Sample the point
        row, col = src.index(x, y)
        print(f"📍 Pixel Location: row={row}, col={col}")
        print(f"    Coordinates: x={x:.2f}, y={y:.2f}")
        
        # Read values at this location
        values = src.read(window=((row, row+1), (col, col+1)))
        
        print(f"\n📊 Band Values:")
        for i, val in enumerate(values):
            val_val = val[0, 0]
            if i+1 in LAND_COVER_LEGEND and int(val_val) in LAND_COVER_LEGEND:
                name_en, name_de, _ = LAND_COVER_LEGEND[int(val_val)]
                print(f"  Band {i+1}: {val_val} ({name_en})")
            else:
                print(f"  Band {i+1}: {val_val}")
        
        print()


def list_bev_datasets():
    """List available BEV datasets from data.bev.gv.at"""
    datasets = [
        {
            "id": "bev-km500-2025",
            "name": "Kartographisches Modell 1:500.000 Raster",
            "scale": "1:500,000",
            "crs": "EPSG:3416",
            "url": "https://data.bev.gv.at/...,/KM500_R_CRS3416_508dpi_Farbbild_COG_20251001.tif"
        },
        {
            "id": "bev-km250-utm32-2025",
            "name": "Kartographisches Modell 1:250.000 Raster UTM32",
            "scale": "1:250,000",
            "crs": "EPSG:25832",
            "url": "https://data.bev.gv.at/...,/KM250_R_CRS25832_508dpi_Farbbild_COG_20250902.tif"
        },
        {
            "id": "bev-km250-utm33-2025",
            "name": "Kartographisches Modell 1:250.000 Raster UTM33",
            "scale": "1:250,000",
            "crs": "EPSG:25833",
            "url": "https://data.bev.gv.at/...,/KM250_R_CRS25833_508dpi_Farbbild_COG_20250902.tif"
        },
        {
            "id": "bev-lc-mosaik-2023",
            "name": "Land Cover Mosaik Österreich 2023",
            "type": "Land Cover",
            "crs": "EPSG:3416",
            "url": "https://data.bev.gv.at/...,/2023450_Mosaik_LC.tif",
            "legend": LAND_COVER_LEGEND
        }
    ]
    
    print(f"\n{'='*60}")
    print("Available BEV Datasets (data.bev.gv.at)")
    print(f"{'='*60}\n")
    
    for ds in datasets:
        print(f"📦 {ds['name']}")
        print(f"   ID: {ds['id']}")
        if 'scale' in ds:
            print(f"   Scale: {ds['scale']}")
        if 'type' in ds:
            print(f"   Type: {ds['type']}")
        print(f"   CRS: {ds['crs']}")
        print(f"   URL: {ds['url']}")
        if 'legend' in ds:
            print(f"   Legend:")
            for code, (en, de, color) in ds['legend'].items():
                print(f"      {code}: {en} ({de})")
        print()


def create_footprint_geometry(filepath):
    """Create shapely geometry from raster footprint"""
    print(f"\n{'='*60}")
    print("Raster Footprint (Shapely Geometry)")
    print(f"{'='*60}\n")
    
    with rasterio.open(filepath) as src:
        bounds = src.bounds
        geom = box(bounds.left, bounds.bottom, bounds.right, bounds.top)
        
        print("📐 Original Bounds Geometry:")
        print(f"  Type: {geom.geom_type}")
        print(f"  Area: {geom.area:,.2f}")
        print(f"  Bounds: {geom.bounds}")
        
        # Export as GeoJSON
        geojson = mapping(geom)
        print(f"\n📄 GeoJSON:")
        import json
        print(json.dumps(geojson, indent=2))
        
        # Try to get actual data footprint if available
        if src.dataset_mask:
            print(f"\n📊 Data Mask Statistics:")
            mask = src.dataset_mask()
            valid_pixels = np.count_nonzero(mask)
            total_pixels = mask.size
            print(f"  Valid pixels: {valid_pixels:,} / {total_pixels:,} ({valid_pixels/total_pixels*100:.1f}%)")
        
        print()


def main():
    parser = argparse.ArgumentParser(
        description='BEV Data Viewer - Analyze COG files from data.bev.gv.at',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python bev_viewer.py --list-datasets
  python bev_viewer.py --metadata /path/to/raster.tif
  python bev_viewer.py --land-cover /path/to/landcover.tif
  python bev_viewer.py --sample /path/to/raster.tif --lon 13.5 --lat 47.5
  python bev_viewer.py --footprint /path/to/raster.tif
        """
    )
    
    parser.add_argument('--metadata', '-m', metavar='FILE', 
                        help='Show COG metadata')
    parser.add_argument('--land-cover', '-lc', metavar='FILE',
                        help='Analyze land cover classification')
    parser.add_argument('--sample', '-s', metavar='FILE',
                        help='Sample raster at coordinates')
    parser.add_argument('--lon', type=float, default=13.5,
                        help='Longitude for sampling (default: 13.5)')
    parser.add_argument('--lat', type=float, default=47.5,
                        help='Latitude for sampling (default: 47.5)')
    parser.add_argument('--footprint', '-f', metavar='FILE',
                        help='Show footprint geometry (Shapely)')
    parser.add_argument('--list-datasets', '-l', action='store_true',
                        help='List available BEV datasets')
    
    args = parser.parse_args()
    
    if args.list_datasets:
        list_bev_datasets()
    elif args.metadata:
        analyze_cog_metadata(args.metadata)
    elif args.land_cover:
        analyze_cog_metadata(args.land_cover)
        analyze_land_cover(args.land_cover)
    elif args.sample:
        analyze_cog_metadata(args.sample)
        sample_raster_values(args.sample, args.lon, args.lat)
    elif args.footprint:
        analyze_cog_metadata(args.footprint)
        create_footprint_geometry(args.footprint)
    else:
        parser.print_help()
        print("\n" + "="*60)
        print("Quick Start - List available BEV datasets:")
        print("  python bev_viewer.py --list-datasets")
        print("="*60)


if __name__ == '__main__':
    main()
