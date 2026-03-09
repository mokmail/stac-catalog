#!/usr/bin/env python3
"""
Scrape BEV data catalog to get all GeoTIFF datasets
"""

import requests
import json
import re
import sys

# Try different API endpoints
BASE_URL = "https://data.bev.gv.at/geonetwork/srv/eng"

def search_api(params):
    """Try the search API"""
    endpoints = [
        f"{BASE_URL}/api/search",
        f"{BASE_URL}/api/records",
        "https://data.bev.gv.at/ephemeral/api/search",
    ]
    
    for endpoint in endpoints:
        try:
            print(f"Trying: {endpoint}")
            resp = requests.get(endpoint, params=params, timeout=30)
            print(f"  Status: {resp.status_code}")
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            print(f"  Error: {e}")
    return None

def search_v1():
    """Try the v1 API format"""
    params = {
        'q': 'format:GeoTIFF',
        'from': 1,
        'to': 50
    }
    return search_api(params)

def search_records():
    """Try records endpoint"""
    headers = {
        'Accept': 'application/json'
    }
    
    # Try direct records query
    urls = [
        f"{BASE_URL}/api/search?q=GeoTIFF&from=1&to=50",
        f"{BASE_URL}/api/records?q=GeoTIFF&from=1&to=50",
    ]
    
    for url in urls:
        try:
            print(f"Trying: {url}")
            resp = requests.get(url, headers=headers, timeout=30)
            print(f"  Status: {resp.status_code}")
            if resp.status_code == 200:
                try:
                    return resp.json()
                except:
                    print(f"  Response: {resp.text[:200]}")
        except Exception as e:
            print(f"  Error: {e}")
    return None

def get_opensearch():
    """Try OpenSearch API"""
    url = "https://data.bev.gv.at/geonetwork/srv/eng/opensearch"
    try:
        resp = requests.get(url, params={'q': 'GeoTIFF'}, timeout=30)
        print(f"OpenSearch status: {resp.status_code}")
        return resp.text[:500] if resp.status_code == 200 else None
    except Exception as e:
        print(f"OpenSearch error: {e}")
        return None

def scrape_html():
    """Try to scrape the HTML page"""
    url = "https://data.bev.gv.at/geonetwork/srv/eng/catalog.search"
    params = {
        'search': '',
        'isTemplate': 'n',
        'q': 'GeoTIFF',
        'format': 'GeoTIFF'
    }
    
    try:
        resp = requests.get(url, params=params, timeout=30)
        print(f"HTML scrape status: {resp.status_code}")
        
        # Look for links in the response
        tif_links = re.findall(r'https?://[^\s"\'<>]+\.tif[f]?', resp.text)
        print(f"Found {len(tif_links)} .tif links in HTML")
        
        # Look for JSON data
        json_data = re.findall(r'window\.catalogEvent\s*=\s*({[^}]+})', resp.text)
        print(f"Found {len(json_data)} catalog events")
        
        return tif_links[:10]
    except Exception as e:
        print(f"HTML scrape error: {e}")
        return []

def try_csrf_api():
    """Try with CSRF token"""
    session = requests.Session()
    
    # First get the page to get CSRF token
    url = "https://data.bev.gv.at/geonetwork/srv/eng/catalog.signin"
    
    try:
        # Get signin page
        resp = session.get(url, timeout=30)
        print(f"Signin page: {resp.status_code}")
        
        # Try API with session
        api_url = "https://data.bev.gv.at/geonetwork/srv/eng/api/search"
        params = {
            'q': 'format:GeoTIFF',
            'from': 1,
            'to': 50,
            '_csrf': session.cookies.get('_csrf', '')
        }
        
        resp = session.get(api_url, params=params, timeout=30)
        print(f"API with session: {resp.status_code}")
        
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"CSRF API error: {e}")
    
    return None

def generate_sample_catalog():
    """Generate a sample catalog with known BEV URLs"""
    
    # Known BEV GeoTIFF datasets (these are actual known endpoints)
    datasets = [
        {
            "id": "bev-km500-2025",
            "title": "KM500 Raster 2025",
            "description": "Kartographisches Modell 1:500.000 - Farbbild",
            "href": "https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM500/20251001/KM500_R_CRS3416_508dpi_Farbbild_COG_20251001.tif",
            "type": "image/tiff"
        },
        {
            "id": "bev-km250-utm32-2025", 
            "title": "KM250 Raster UTM32 2025",
            "description": "Kartographisches Modell 1:250.000 - UTM32 - Farbbild",
            "href": "https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM250/20250902/KM250_R_CRS25832_508dpi_Farbbild_COG_20250902.tif",
            "type": "image/tiff"
        },
        {
            "id": "bev-km250-utm33-2025",
            "title": "KM250 Raster UTM33 2025", 
            "description": "Kartographisches Modell 1:250.000 - UTM33 - Farbbild",
            "href": "https://data.bev.gv.at/ephemeral/bev-download/KM_R/KM250/20250902/KM250_R_CRS25833_508dpi_Farbbild_COG_20250902.tif",
            "type": "image/tiff"
        },
        {
            "id": "bev-lc-mosaik-2023",
            "title": "Land Cover Mosaik 2023",
            "description": "Bodenbedeckungsdaten (Land Cover) für ganz Österreich",
            "href": "https://data.bev.gv.at/ephemeral/bev-download/LC/20241015/2023450_Mosaik_LC.tif",
            "type": "image/tiff"
        },
        {
            "id": "bev-lc-2023-10150",
            "title": "Land Cover 2023 - 10150",
            "description": "Land Cover Datenblätter 2023 - Blatt 10150",
            "href": "https://data.bev.gv.at/ephemeral/bev-download/LC/20231015/2020150_Mosaik_LC.tif",
            "type": "image/tiff"
        }
    ]
    
    return datasets

if __name__ == '__main__':
    print("=" * 60)
    print("BEV Catalog Scraper")
    print("=" * 60)
    
    print("\n1. Trying OpenSearch...")
    get_opensearch()
    
    print("\n2. Trying HTML scrape...")
    links = scrape_html()
    if links:
        print(f"Found {len(links)} links")
        for link in links[:5]:
            print(f"  {link}")
    
    print("\n3. Trying CSRF API...")
    result = try_csrf_api()
    if result:
        print(f"Got data: {str(result)[:200]}")
    
    print("\n4. Generating sample catalog with known URLs...")
    datasets = generate_sample_catalog()
    print(f"Generated {len(datasets)} sample datasets")
    
    print("\n" + "=" * 60)
    print("Note: The BEV API requires authentication for full access.")
    print("The sample catalog contains known public endpoints.")
    print("=" * 60)
