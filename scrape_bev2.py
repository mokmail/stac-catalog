#!/usr/bin/env python3
"""
Scrape BEV data catalog with proper API usage
"""

import requests
import json
import urllib.parse

session = requests.Session()

# The user's search URL decoded:
# https://data.bev.gv.at/geonetwork/srv/eng/catalog.search#/search
# ?isTemplate=n
# &resourceTemporalDateRange={"range":{"resourceTemporalDateRange":{"gte":null,"lte":null,"relation":"intersects"}}}
# &sortBy=relevance&sortOrder=desc
# &query_string={"resourceType":{"dataset":true},"cl_topic.key":{"imageryBaseMapsEarthCover":true},"format":{"GeoTIFF":true}}
# &from=1&to=50

BASE_URL = "https://data.bev.gv.at/geonetwork/srv/eng"

def get_csrf():
    """Get CSRF token from the main page"""
    resp = session.get(f"{BASE_URL}/catalog.search")
    # Try to extract CSRF from cookies or meta tags
    csrf = session.cookies.get('_csrf') or session.cookies.get('CSRFTOKEN')
    return csrf

def api_search_v2():
    """Try the v2 API format"""
    # First get the signin page to establish session
    session.get(f"{BASE_URL}/catalog.signin")
    
    # Build the query
    query = {
        "resourceType": {"dataset": True},
        "cl_topic.key": {"imageryBaseMapsEarthCover": True},
        "format": {"GeoTIFF": True}
    }
    
    params = {
        "isTemplate": "n",
        "resourceTemporalDateRange": json.dumps({"range": {"resourceTemporalDateRange": {"gte": None, "lte": None, "relation": "intersects"}}}),
        "sortBy": "relevance",
        "sortOrder": "desc",
        "query_string": json.dumps(query),
        "from": 1,
        "to": 50
    }
    
    # Try the internal API
    urls_to_try = [
        f"{BASE_URL}/api/search",
        f"{BASE_URL}/api/records/_search",
        f"{BASE_URL}/api/search/record",
    ]
    
    for url in urls_to_try:
        try:
            print(f"Trying: {url}")
            resp = session.get(url, params=params, timeout=30)
            print(f"  Status: {resp.status_code}")
            print(f"  Content-Type: {resp.headers.get('Content-Type')}")
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    print(f"  Keys: {list(data.keys()) if isinstance(data, dict) else 'list'}")
                    return data
                except:
                    print(f"  Raw: {resp.text[:200]}")
        except Exception as e:
            print(f"  Error: {e}")
    return None

def api_paginate():
    """Try pagination API"""
    # Try the internal search endpoint
    url = f"{BASE_URL}/api/internal/search"
    
    payload = {
        "query": {
            "query_string": {
                "query": "format:GeoTIFF"
            }
        },
        "from": 0,
        "size": 50
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        print(f"Trying: {url}")
        resp = session.post(url, json=payload, headers=headers, timeout=30)
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"  Error: {e}")
    
    return None

def get_json_ajax():
    """Try to find the JSON AJAX endpoint by looking at the page source"""
    # Get the main page and look for API patterns
    resp = session.get(f"{BASE_URL}/catalog.search")
    
    import re
    
    # Look for API URLs in the JS
    api_urls = re.findall(r'(?:api|ajax|url)[^\'"]*[\'"]([^\'"]+)[\'"]', resp.text, re.IGNORECASE)
    print(f"Found {len(api_urls)} potential API URLs")
    
    # Look for specific patterns
    search_patterns = [
        r'catalog\.search.*?api',
        r'/api/\w+',
        r'url.*?search'
    ]
    
    for pattern in search_patterns:
        matches = re.findall(pattern, resp.text, re.IGNORECASE)
        if matches:
            print(f"Pattern '{pattern}': {matches[:3]}")
    
    return api_urls

def try_gn_save_api():
    """Try the GeoNetwork save API"""
    # This is often used for internal operations
    url = f"{BASE_URL}/api/status"
    
    try:
        resp = session.get(url, timeout=10)
        print(f"Status API: {resp.status_code}")
        if resp.status_code == 200:
            print(f"  Response: {resp.text[:200]}")
    except Exception as e:
        print(f"Status error: {e}")

def try_es_search():
    """Try Elasticsearch directly (GeoNetwork uses ES)"""
    url = f"{BASE_URL}/api/search/select"
    
    params = {
        "q": "format:GeoTIFF",
        "from": 0,
        "to": 50
    }
    
    try:
        print(f"Trying: {url}")
        resp = session.get(url, params=params, timeout=30)
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            try:
                data = resp.json()
                print(f"  Total: {data.get('total', 'N/A')}")
                return data
            except:
                print(f"  Raw: {resp.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")
    
    return None

if __name__ == '__main__':
    print("=" * 60)
    print("BEV API Investigation")
    print("=" * 60)
    
    print("\n1. Getting CSRF...")
    csrf = get_csrf()
    print(f"   CSRF: {csrf}")
    
    print("\n2. Trying ES select API...")
    try_es_search()
    
    print("\n3. Trying v2 search API...")
    api_search_v2()
    
    print("\n4. Trying pagination API...")
    api_paginate()
    
    print("\n5. Looking for JSON AJAX patterns...")
    get_json_ajax()
