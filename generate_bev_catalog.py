#!/usr/bin/env python3
"""
BEV Catalog Generator - Generate all known BEV GeoTIFF URLs
These URLs go through the Vite proxy which adds /bev-download prefix
"""

import json

def generate_bev_catalog():
    """Generate catalog based on known BEV data patterns"""
    
    datasets = []
    
    # KM500 Raster - the main Austria map
    datasets.append({
        "id": "bev-km500-20251001",
        "title": "KM500 Austria 2025-10-01",
        "description": "Kartographisches Modell 1:500.000 Raster - digitales Kartenbild ganz Österreich",
        "href": "/bev-download/download/KM_R/KM500/20251001/KM500_R_CRS3416_508dpi_Farbbild_COG_20251001.tif",
        "type": "image/tiff",
        "collection": "KM500"
    })
    
    # KM250 Raster - UTM32 zone
    datasets.append({
        "id": "bev-km250-utm32-20250902",
        "title": "KM250 UTM32 2025-09-02",
        "description": "Kartographisches Modell 1:250.000 Raster - UTM Zone 32",
        "href": "/bev-download/download/KM_R/KM250/20250902/KM250_R_CRS25832_508dpi_Farbbild_COG_20250902.tif",
        "type": "image/tiff",
        "collection": "KM250_UTM32"
    })
    
    # KM250 Raster - UTM33 zone
    datasets.append({
        "id": "bev-km250-utm33-20250902",
        "title": "KM250 UTM33 2025-09-02",
        "description": "Kartographisches Modell 1:250.000 Raster - UTM Zone 33",
        "href": "/bev-download/download/KM_R/KM250/20250902/KM250_R_CRS25833_508dpi_Farbbild_COG_20250902.tif",
        "type": "image/tiff",
        "collection": "KM250_UTM33"
    })
    
    # Land Cover Mosaik (full Austria)
    datasets.append({
        "id": "bev-lc-mosaik-2024",
        "title": "Land Cover Mosaik 2024",
        "description": "Bodenbedeckungsdaten (Land Cover) - Jahresmosaik 2024",
        "href": "/bev-download/download/LC/20241015/2023450_Mosaik_LC.tif",
        "type": "image/tiff",
        "collection": "LandCover"
    })
    
    # Land Cover individual sheets (2023)
    lc_sheets = [
        ("10150", "Blatt Nordwest"),
        ("10160", "Blatt West"),
        ("10170", "Blatt Südwest"),
        ("10250", "Blatt Nord"),
        ("10260", "Blatt Mitte"),
        ("10270", "Blatt Süd"),
        ("10350", "Blatt Nordost"),
        ("10360", "Blatt Ost"),
        ("10370", "Blatt Südost"),
    ]
    
    for sheet, desc in lc_sheets:
        datasets.append({
            "id": f"bev-lc-2023-{sheet}",
            "title": f"Land Cover 2023 - {desc}",
            "description": f"Bodenbedeckungsdaten (Land Cover) - {desc} - 2023",
            "href": "/bev-download/download/LC/20231015/2020{sheet}_Mosaik_LC.tif",
            "type": "image/tiff",
            "collection": "LandCover_2023"
        })
    
    # Add more KM250 sheets if available
    km250_sheets = list(range(1, 25))  # KM250 has 24 sheets
    
    return datasets

def create_stac_items(datasets):
    """Convert datasets to STAC items"""
    items = []
    
    for ds in datasets:
        # Determine geometry based on collection
        if "KM500" in ds.get("collection", ""):
            # Austria full extent
            coords = [[
                [9.53, 46.37],
                [17.17, 46.37],
                [17.17, 49.02],
                [9.53, 49.02],
                [9.53, 46.37]
            ]]
        elif "UTM32" in ds.get("collection", ""):
            # UTM32 zone extent
            coords = [[
                [9.5, 46.5],
                [12.0, 46.5],
                [12.0, 49.0],
                [9.5, 49.0],
                [9.5, 46.5]
            ]]
        elif "UTM33" in ds.get("collection", ""):
            # U("collection", ""TM33 zone extent
            coords = [[
                [12.0, 46.5],
                [17.17, 46.5],
                [17.17, 49.0],
                [12.0, 49.0],
                [12.0, 46.5]
            ]]
        elif "LandCover" in ds.get("collection", ""):
            # Land cover is a subset
            coords = [[
                [12.0, 47.0],
                [17.0, 47.0],
                [17.0, 49.0],
                [12.0, 49.0],
                [12.0, 47.0]
            ]]
        else:
            # Default Austria
            coords = [[
                [9.53, 46.37],
                [17.17, 46.37],
                [17.17, 49.02],
                [9.53, 49.02],
                [9.53, 46.37]
            ]]
        
        item = {
            "type": "Feature",
            "stac_version": "1.0.0",
            "id": ds["id"],
            "collection": ds.get("collection", "BEV_Data"),
            "geometry": {
                "type": "Polygon",
                "coordinates": coords
            },
            "properties": {
                "datetime": "2024-01-01T00:00:00Z",
                "title": ds["title"],
                "description": ds["description"],
                "license": "CC-BY-4.0",
                "creators": ["Bundesamt für Eich- und Vermessungswesen (BEV)"],
                "bev:type": "raster" if "LC" not in ds.get("collection", "") else "land-cover"
            },
            "assets": {
                "data": {
                    "href": ds["href"],
                    "title": ds["title"],
                    "type": ds["type"],
                    "roles": ["data"]
                }
            },
            "links": [
                {
                    "rel": "source",
                    "href": "https://data.bev.gv.at/geonetwork/srv/eng/catalog.search",
                    "title": "BEV Metadata Catalog"
                }
            ]
        }
        items.append(item)
    
    return items

if __name__ == '__main__':
    print("Generating BEV catalog...")
    
    datasets = generate_bev_catalog()
    items = create_stac_items(datasets)
    
    # Create STAC catalog
    catalog = {
        "type": "Catalog",
        "stac_version": "1.0.0",
        "id": "bev-full-catalog",
        "title": "BEV Complete Data Catalog",
        "description": "Complete Austrian Federal Office of Meteorology and Surveying - Spatial Data Catalog (GeoTIFF format)",
        "stac_extensions": [],
        "links": [
            {
                "rel": "self",
                "href": "catalog.json"
            },
            {
                "rel": "root",
                "href": "catalog.json"
            }
        ]
    }
    
    # Create STAC collection
    collection = {
        "type": "Collection",
        "stac_version": "1.0.0",
        "id": "bev-geotiff-collection",
        "title": "BEV GeoTIFF Collection",
        "description": "Collection of all GeoTIFF datasets from BEV data catalog",
        "extent": {
            "spatial": {
                "bbox": [[9.53, 46.37, 17.17, 49.02]]
            },
            "temporal": {
                "interval": [["2020-01-01T00:00:00Z", "2025-12-31T00:00:00Z"]]
            }
        },
        "license": "CC-BY-4.0",
        "links": [
            {"rel": "self", "href": "collection.json"},
            {"rel": "root", "href": "catalog.json"}
        ]
    }
    
    # Create FeatureCollection with all items
    feature_collection = {
        "type": "FeatureCollection",
        "stac_version": "1.0.0",
        "features": items
    }
    
    # Save outputs
    with open('bev-catalog.json', 'w') as f:
        json.dump(catalog, f, indent=2)
    
    with open('bev-collection.json', 'w') as f:
        json.dump(collection, f, indent=2)
    
    with open('bev-items.json', 'w') as f:
        json.dump(feature_collection, f, indent=2)
    
    print(f"\nGenerated:")
    print(f"  - bev-catalog.json (STAC catalog)")
    print(f"  - bev-collection.json (STAC collection)")
    print(f"  - bev-items.json ({len(items)} STAC items)")
    print(f"\nTotal datasets: {len(datasets)}")
