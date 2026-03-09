import React, { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import parseGeoraster from 'georaster'
import GeoRasterLayer from 'georaster-layer-for-leaflet'
import shp from 'shpjs'
import proj4 from 'proj4'

// Add Austrian coordinate systems
proj4.defs("EPSG:3416", "+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs +type=crs");
proj4.defs("EPSG:31255", "+proj=tmerc +lat_0=0 +lon_0=13.3333333333333 +k=1 +x_0=450000 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs");
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:31287", "+proj=tmerc +lat_0=0 +lon_0=13.3333333333333 +k=1 +x_0=450000 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs");
proj4.defs("EPSG:5778", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

if (typeof window !== 'undefined') {
  window.proj4 = proj4;
}

const LAND_COVER_COLORS = {
  1: '#0C6400',
  2: '#CDAA66',
  3: '#60C630',
  4: '#E60000',
  5: '#005CE6',
  6: '#D2F0BE'
}

const getBoundsFromGeometry = (geometry) => {
  if (!geometry) return null
  
  if (geometry.type === 'Point') {
    return {
      south: geometry.coordinates[1],
      north: geometry.coordinates[1],
      west: geometry.coordinates[0],
      east: geometry.coordinates[0]
    }
  }
  
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]
    let minLng = Infinity, maxLng = -Infinity
    let minLat = Infinity, maxLat = -Infinity
    
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
    
    return { south: minLat, north: maxLat, west: minLng, east: maxLng }
  }
  
  return null
}

const MapViewer = ({ item }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({})
  const isMountedRef = useRef(true)
  const [layers, setLayers] = useState({
    footprint: true,
    cog: true,
    wms: false
  })
  const [mapOpacity, setMapOpacity] = useState(100)
  const [rasterOpacity, setRasterOpacity] = useState(80)
  const [baseLayer, setBaseLayer] = useState('OpenStreetMap')
  const [wmsUrl, setWmsUrl] = useState('')
  const [detectedWmsUrl, setDetectedWmsUrl] = useState('')
  const [detectedCogUrl, setDetectedCogUrl] = useState('')
  const [detectedShpUrl, setDetectedShpUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [shpLoading, setShpLoading] = useState(false)
  const [error, setError] = useState(null)

  // Map layer options
  const mapLayers = {
    OpenStreetMap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: 'OpenStreetMap'
    },
    Satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      name: 'Satellite'
    },
    Terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap',
      name: 'Terrain'
    },
    CartoDB: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© CartoDB',
      name: 'CartoDB Light'
    },
    CartoDBDark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CartoDB',
      name: 'CartoDB Dark'
    },
    ESRI: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      name: 'ESRI Topo'
    }
  }

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Get bounds from geometry
    const boundsFromGeom = getBoundsFromGeometry(item.geometry)
    
    // Calculate center
    let lat = 47.5, lng = 13.5
    if (boundsFromGeom) {
      lat = (boundsFromGeom.south + boundsFromGeom.north) / 2
      lng = (boundsFromGeom.west + boundsFromGeom.east) / 2
    } else if (item.geometry.type === 'Point') {
      lat = item.geometry.coordinates[1]
      lng = item.geometry.coordinates[0]
    }

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], 8)

    // Add multiple tile layers for better visualization
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add satellite layer
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19
    })
    
    // Base layers
    const baseLayers = {
      'OpenStreetMap': osmLayer,
      'Satellite': satelliteLayer
    }

    // Add footprint layer
    if (boundsFromGeom) {
      const footprintLayer = L.geoJSON(item.geometry, {
        style: {
          fillColor: '#3498db',
          fillOpacity: 0.15,
          color: '#3498db',
          weight: 3,
          dashArray: '8, 4'
        }
      }).addTo(map)
      layersRef.current.footprint = footprintLayer
      
      // Fit map to footprint
      map.fitBounds(footprintLayer.getBounds(), { padding: [50, 50] })
    }

    // Try to find COG asset
    const findAsset = (types, extensions) => {
      for (const key in item.assets) {
        const asset = item.assets[key]
        const href = asset.href
        
        // Skip WMS/WFS URLs - they are not COGs
        if (href?.includes('wms') || href?.includes('wfs') || href?.includes('SERVICE=')) {
          continue
        }
        
        const matchesType = types.some(t => asset.type?.includes(t))
        const matchesExt = extensions.some(ext => href?.toLowerCase().endsWith(ext))
        if (matchesType || matchesExt) return href
      }
      return null
    }

    // Convert URL to proxy URL if needed
    const getProxyUrl = (url) => {
      if (!url) return url
      
      // If URL already starts with /bev-download, convert to absolute URL
      if (url.startsWith('/bev-download')) {
        return window.location.origin + url
      }
      
      // If URL is from data.bev.gv.at, convert to proxy URL
      if (url.includes('data.bev.gv.at')) {
        // Extract the path after the domain
        const path = url.replace('https://data.bev.gv.at', '')
        return window.location.origin + '/bev-download' + path
      }
      
      return url
    }

    const cogUrl = findAsset(
      ['tiff', 'geotiff', 'image/tiff'],
      ['.tif', '.tiff', '.TIF', '.TIFF']
    )
    
    // Store detected URLs for UI
    setDetectedCogUrl(cogUrl)
    
    // Try to find WMS asset
    const findWmsAsset = () => {
      for (const key in item.assets) {
        const asset = item.assets[key]
        const href = asset.href
        
        // Look for WMS URLs
        if (href?.includes('wms') || href?.includes('SERVICE=WMS') || 
            asset.roles?.includes('visual') || asset.type?.includes('png')) {
          return href
        }
      }
      return null
    }
    
    const wmsAssetUrl = findWmsAsset()
    setDetectedWmsUrl(wmsAssetUrl || '')

    // Try to find Shapefile/GeoJSON asset
    const findShpAsset = () => {
      for (const key in item.assets) {
        const asset = item.assets[key]
        const href = asset.href
        const type = asset.type || ''
        
        // Look for shapefile, geojson, or kml
        if (href?.includes('.shp') || href?.includes('.geojson') || 
            href?.includes('.json') || type.includes('geojson') ||
            href?.includes('.kml') || type.includes('kml')) {
          return href
        }
      }
      return null
    }
    
    const shpAssetUrl = findShpAsset()
    setDetectedShpUrl(shpAssetUrl || '')
    
    // Auto-load shapefile if found
    if (shpAssetUrl) {
      loadShapefileLayer(shpAssetUrl)
    }

    // Use proxy URL for COG
    const proxyCogUrl = getProxyUrl(cogUrl)

    if (proxyCogUrl) {
      setLoading(true)
      setError(null)
      
      console.log("Loading COG from:", proxyCogUrl)
      
      // Clean up existing COG layer before adding new one
      if (layersRef.current.cog && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(layersRef.current.cog)
        } catch (e) {
          // Layer might already be removed
        }
        layersRef.current.cog = null
      }
       
      parseGeoraster(proxyCogUrl).then(georaster => {
        // Check if still mounted and map is valid
        if (!isMountedRef.current || !mapInstanceRef.current || !mapRef.current) {
          console.log("Component unmounted, skipping layer addition")
          setLoading(false)
          return
        }
        
        console.log("GeoRaster loaded:", georaster)
        console.log("CRS:", georaster.crs)
        
        // Get CRS from metadata or item properties
        const crs = georaster.crs || item.properties?.['bev:crs']?.[0] || 'EPSG:31255'
        console.log("Using CRS:", crs)
        
        const layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: rasterOpacity / 100,
          resolution: 256,
          updateWhenIdle: false,
          keepBuffer: 2
        })
        
        // Use try-catch for layer addition
        try {
          // Double check map is valid
          if (mapInstanceRef.current && mapRef.current) {
            // Ensure overlay pane exists and is on top
            const overlayPane = mapInstanceRef.current.getPanes().overlayPane
            if (overlayPane) {
              overlayPane.style.zIndex = '650'
            }
            
            layer.addTo(mapInstanceRef.current)
            layersRef.current.cog = layer
            
            // Set opacity after adding to map
            layer.setOpacity(rasterOpacity / 100)
            
            // Force layer to bring to front
            layer.bringToFront()
            
            console.log("Layer added successfully, opacity:", rasterOpacity / 100)
            
            // Fit bounds to raster
            try {
              const rasterBounds = layer.getBounds()
              if (rasterBounds && rasterBounds.isValid()) {
                mapInstanceRef.current.fitBounds(rasterBounds, { padding: [50, 50], maxZoom: 12 })
                console.log("Fitted to raster bounds:", rasterBounds)
              }
            } catch (e) {
              console.log("Could not fit to raster bounds:", e)
            }
          }
        } catch (layerError) {
          console.error("Error adding layer to map:", layerError)
          setError(layerError.message)
        }
        
        setLoading(false)
      }).catch(err => {
        console.error("Error loading COG:", err)
        setError(err.message)
        setLoading(false)
      })
    } else {
      console.log("No COG URL found in assets")
    }

    map.attributionControl.setPrefix('')
    mapInstanceRef.current = map
    layersRef.current.baseLayers = baseLayers

    return () => {
      isMountedRef.current = false
      // Clean up all layers
      if (mapInstanceRef.current) {
        // Remove COG layer if exists
        if (layersRef.current.cog) {
          try {
            mapInstanceRef.current.removeLayer(layersRef.current.cog)
          } catch (e) {}
          layersRef.current.cog = null
        }
        // Remove footprint layer if exists
        if (layersRef.current.footprint) {
          try {
            mapInstanceRef.current.removeLayer(layersRef.current.footprint)
          } catch (e) {}
          layersRef.current.footprint = null
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [item])

  useEffect(() => {
    if (layersRef.current.cog) {
      layersRef.current.cog.setOpacity(layers.cog ? rasterOpacity / 100 : 0)
    }
  }, [rasterOpacity, layers.cog])

  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current.footprint) return
    
    if (layers.footprint) {
      layersRef.current.footprint.addTo(mapInstanceRef.current)
    } else {
      mapInstanceRef.current.removeLayer(layersRef.current.footprint)
    }
  }, [layers.footprint])

  const toggleWmsLayer = () => {
    const map = mapInstanceRef.current
    if (!map) return

    // Use detected WMS URL, or fall back to manual input
    const urlToUse = detectedWmsUrl || wmsUrl
    if (!urlToUse) {
      setError('No WMS URL available')
      return
    }

    if (layers.wms && layersRef.current.wms) {
      map.removeLayer(layersRef.current.wms)
      layersRef.current.wms = null
      setLayers(l => ({ ...l, wms: false }))
    } else {
      // Parse WMS URL to get layers
      let wmsLayers = '0'
      try {
        const urlObj = new URL(urlToUse)
        if (urlObj.searchParams.get('layers')) {
          wmsLayers = urlObj.searchParams.get('layers')
        }
      } catch (e) {}
      
      const wmsLayer = L.tileLayer.wms(urlToUse, {
        layers: wmsLayers,
        format: 'image/png',
        transparent: true,
        opacity: rasterOpacity / 100
      })
      wmsLayer.addTo(map)
      layersRef.current.wms = wmsLayer
      setLayers(l => ({ ...l, wms: true }))
    }
  }

  const loadShapefileLayer = async (url) => {
    const map = mapInstanceRef.current
    if (!map) return
    
    // Convert URL if needed
    let fetchUrl = url
    if (url.includes('data.bev.gv.at')) {
      const path = url.replace('https://data.bev.gv.at', '')
      fetchUrl = window.location.origin + '/bev-download' + path
    }
    
    setShpLoading(true)
    console.log("Loading shapefile from:", fetchUrl)
    
    try {
      // Remove existing shapefile layer
      if (layersRef.current.shp) {
        map.removeLayer(layersRef.current.shp)
        layersRef.current.shp = null
      }
      
      // Fetch the shapefile/geojson
      const response = await fetch(fetchUrl)
      let geojson
      
      if (url.toLowerCase().endsWith('.shp')) {
        const arrayBuffer = await response.arrayBuffer()
        geojson = await shp(arrayBuffer)
      } else {
        geojson = await response.json()
      }
      
      if (!isMountedRef.current) return
      
      // Create and add layer
      const shpLayer = L.geoJSON(geojson, {
        style: {
          color: '#e74c3c',
          weight: 2,
          fillColor: '#e74c3c',
          fillOpacity: 0.3
        }
      })
      
      shpLayer.addTo(map)
      layersRef.current.shp = shpLayer
      
      // Fit bounds
      const bounds = shpLayer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
      
      console.log("Shapefile loaded successfully")
    } catch (err) {
      console.error("Error loading shapefile:", err)
      setError('Failed to load shapefile: ' + err.message)
    } finally {
      setShpLoading(false)
    }
  }

  const toggleShpLayer = () => {
    const map = mapInstanceRef.current
    if (!map) return
    
    if (layersRef.current.shp) {
      map.removeLayer(layersRef.current.shp)
      layersRef.current.shp = null
    } else if (detectedShpUrl) {
      loadShapefileLayer(detectedShpUrl)
    }
  }

  const switchBaseLayer = (layerName) => {
    const map = mapInstanceRef.current
    if (!map) return
    
    // Remove current base layer if exists
    if (layersRef.current.baseLayer) {
      try {
        map.removeLayer(layersRef.current.baseLayer)
      } catch (e) {}
    }
    
    // Add new base layer
    const layerConfig = mapLayers[layerName]
    if (layerConfig) {
      const newLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19,
        opacity: mapOpacity / 100
      })
      newLayer.addTo(map)
      layersRef.current.baseLayer = newLayer
      setBaseLayer(layerName)
    }
  }

  // Update base layer opacity
  useEffect(() => {
    if (layersRef.current.baseLayer) {
      layersRef.current.baseLayer.setOpacity(mapOpacity / 100)
    }
  }, [mapOpacity])

  // Update raster opacity
  useEffect(() => {
    if (layersRef.current.cog) {
      layersRef.current.cog.setOpacity(layers.cog ? rasterOpacity / 100 : 0)
    }
  }, [rasterOpacity, layers.cog])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Layer Controls */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '220px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: '0.85rem', fontWeight: '700' }}>
          Map Layers
        </h4>
        
        {/* Base Layer */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            BASE MAP
          </label>
          <select
            value={baseLayer}
            onChange={(e) => switchBaseLayer(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="OpenStreetMap">OpenStreetMap</option>
            <option value="Satellite">Satellite</option>
            <option value="Terrain">Terrain (Topo)</option>
            <option value="CartoDB">CartoDB Light</option>
            <option value="CartoDBDark">CartoDB Dark</option>
            <option value="ESRI">ESRI Topo</option>
          </select>
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={layers.footprint}
            onChange={(e) => setLayers(l => ({ ...l, footprint: e.target.checked }))}
            style={{ width: '18px', height: '18px', accentColor: '#3498db' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#5d6d7e' }}>Item Footprint</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={layers.cog}
            onChange={(e) => setLayers(l => ({ ...l, cog: e.target.checked }))}
            style={{ width: '18px', height: '18px', accentColor: '#3498db' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#5d6d7e' }}>Raster (COG) {detectedCogUrl ? '✓' : '✗'}</span>
        </label>

        {(detectedWmsUrl || detectedCogUrl) && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={layers.wms}
              onChange={toggleWmsLayer}
              style={{ width: '18px', height: '18px', accentColor: '#3498db' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#5d6d7e' }}>WMS Layer {detectedWmsUrl ? '✓' : '✗'}</span>
          </label>
        )}

        {detectedShpUrl && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!layersRef.current.shp}
              onChange={toggleShpLayer}
              style={{ width: '18px', height: '18px', accentColor: '#e74c3c' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#5d6d7e' }}>Shapefile {shpLoading ? '⏳' : '✓'}</span>
          </label>
        )}

        {/* Map Opacity */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eef2f6' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#7f8c8d' }}>
            <span>Base Map Opacity</span>
            <span>{mapOpacity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={mapOpacity}
            onChange={(e) => setMapOpacity(Number(e.target.value))}
            style={{ width: '100%', marginTop: '4px', accentColor: '#3498db' }}
          />
        </div>

        {/* Raster Opacity */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eef2f6' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#7f8c8d' }}>
            <span>Raster Opacity</span>
            <span>{rasterOpacity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={rasterOpacity}
            onChange={(e) => setRasterOpacity(Number(e.target.value))}
            style={{ width: '100%', marginTop: '4px', accentColor: '#9b59b6' }}
          />
        </div>

        {loading && (
          <div style={{ marginTop: '12px', textAlign: 'center', color: '#3498db', fontSize: '0.8rem', fontWeight: '600' }}>
            ⏳ Loading raster...
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: '12px', padding: '8px', background: '#fee', borderRadius: '6px', color: '#c00', fontSize: '0.75rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.9)',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ color: '#2c3e50', fontWeight: '600' }}>Loading raster data...</span>
        </div>
      )}

      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        background: 'white',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        fontSize: '0.75rem',
        color: '#7f8c8d'
      }}>
        {item.geometry.type === 'Polygon' ? '📐 Polygon' : '📍 Point'}
        {detectedCogUrl ? ' • 🖼️ COG' : ''}
        {detectedWmsUrl ? ' • 🗺️ WMS' : ''}
        {detectedShpUrl ? ' • 📍 SHP' : ''}
        {!detectedCogUrl && !detectedWmsUrl && !detectedShpUrl ? ' • No layers' : ''}
      </div>
    </div>
  )
}

export default MapViewer
