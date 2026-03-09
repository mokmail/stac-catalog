import React, { useState, useEffect } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

const LAND_COVER_COLORS = {
  1: '#0C6400',  // High Vegetation
  2: '#CDAA66',  // Soil
  3: '#60C630',  // Medium Vegetation
  4: '#E60000',  // Buildings
  5: '#005CE6',  // Water
  6: '#D2F0BE'   // Low Vegetation
}

const BEVDataViewer = ({ item, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [layers, setLayers] = useState({
    footprint: true,
    overlay: true,
    wms: false
  })
  const [overlayOpacity, setOverlayOpacity] = useState(80)
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const mapRef = React.useRef(null)
  const mapInstanceRef = React.useRef(null)
  const layersRef = React.useRef({})
  const isMountedRef = React.useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const getAssetUrl = () => {
    if (item.assets?.data?.href) return item.assets.data.href
    const keys = Object.keys(item.assets || {})
    for (const key of keys) {
      if (item.assets[key]?.href) return item.assets[key].href
    }
    return null
  }

  const fetchMetadata = async () => {
    const url = getAssetUrl()
    if (!url) {
      setError('No data URL found')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await api.getMetadata(url)
      setMetadata(data)
      
      // Auto-select first layer if available
      if (data.bounds_wgs84) {
        // Initialize map with bounds
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Calculate center from item geometry
    let lat = 47.5, lng = 13.5
    if (item.geometry?.type === 'Polygon' && item.geometry.coordinates?.[0]) {
      const coords = item.geometry.coordinates[0]
      lng = coords.reduce((a, b) => a + b[0], 0) / coords.length
      lat = coords.reduce((a, b) => a + b[1], 0) / coords.length
    } else if (item.geometry?.type === 'Point') {
      lng = item.geometry.coordinates[0]
      lat = item.geometry.coordinates[1]
    }

    const map = L.map(mapRef.current).setView([lat, lng], 8)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    // Add footprint
    if (item.geometry) {
      const footprint = L.geoJSON(item.geometry, {
        style: {
          fillColor: '#3498db',
          fillOpacity: 0.15,
          color: '#3498db',
          weight: 3,
          dashArray: '8, 4'
        }
      }).addTo(map)
      layersRef.current.footprint = footprint
      map.fitBounds(footprint.getBounds(), { padding: [50, 50] })
    }

    mapInstanceRef.current = map
    setMapLoaded(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Fetch metadata when map is ready
  useEffect(() => {
    if (mapLoaded) {
      fetchMetadata()
    }
  }, [mapLoaded])

  // Add WMS layer
  const addWmsLayer = (wmsUrl, layerName) => {
    if (!mapInstanceRef.current) return

    // Remove existing WMS layer
    if (layersRef.current.wms) {
      mapInstanceRef.current.removeLayer(layersRef.current.wms)
    }

    const wmsLayer = L.tileLayer.wms(wmsUrl, {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      opacity: overlayOpacity / 100
    })

    wmsLayer.addTo(mapInstanceRef.current)
    layersRef.current.wms = wmsLayer
    setSelectedLayer(layerName)
    setLayers(l => ({ ...l, wms: true }))
  }

  // Update opacity
  useEffect(() => {
    if (layersRef.current.wms) {
      layersRef.current.wms.setOpacity(overlayOpacity / 100)
    }
  }, [overlayOpacity])

  const renderTypeInfo = () => {
    if (!metadata) return null

    const info = []

    // WMS Info
    if (metadata.wms_url) {
      info.push({
        type: 'WMS',
        url: metadata.wms_url,
        layers: metadata.layers || []
      })
    }

    // WFS Info
    if (metadata.wfs_url) {
      info.push({
        type: 'WFS',
        url: metadata.wfs_url,
        layers: metadata.layers || []
      })
    }

    // Direct Download
    if (metadata.download_urls?.length > 0) {
      info.push({
        type: 'Download',
        urls: metadata.download_urls
      })
    }

    return info
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{
          padding: '12px 24px',
          background: '#fff',
          color: '#2c3e50',
          border: '1px solid #e1e8ed',
          borderRadius: '12px',
          cursor: 'pointer',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}
      >
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Map */}
        <div style={{
          height: '600px',
          background: '#f8f9fa',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid #eef2f6'
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Controls Panel */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          height: 'fit-content'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>
            {item.properties?.title || 'Data Viewer'}
          </h3>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              Loading metadata...
            </div>
          )}

          {error && (
            <div style={{
              padding: '16px',
              background: '#fee',
              borderRadius: '8px',
              color: '#c00',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {metadata && (
            <>
              {/* Data Type Info */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                  DATA SERVICE
                </h4>
                
                {metadata.wms_url && (
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      🌐 WMS Service
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', wordBreak: 'break-all' }}>
                      {metadata.wms_url}
                    </div>
                  </div>
                )}

                {metadata.wfs_url && (
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      🔗 WFS Service
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', wordBreak: 'break-all' }}>
                      {metadata.wfs_url}
                    </div>
                  </div>
                )}
              </div>

              {/* Available Layers */}
              {metadata.layers?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    AVAILABLE LAYERS ({metadata.layers.length})
                  </h4>
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {metadata.layers.map((layer, i) => (
                      <button
                        key={i}
                        onClick={() => metadata.wms_url && addWmsLayer(metadata.wms_url, layer)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 12px',
                          marginBottom: '4px',
                          background: selectedLayer === layer ? '#3498db' : '#f8f9fa',
                          color: selectedLayer === layer ? '#fff' : '#2c3e50',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.8rem'
                        }}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bounds */}
              {metadata.bounds_wgs84 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    GEOGRAPHIC EXTENT
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    <div>West: {metadata.bounds_wgs84.west?.toFixed(4)}°</div>
                    <div>East: {metadata.bounds_wgs84.east?.toFixed(4)}°</div>
                    <div>South: {metadata.bounds_wgs84.south?.toFixed(4)}°</div>
                    <div>North: {metadata.bounds_wgs84.north?.toFixed(4)}°</div>
                  </div>
                </div>
              )}

              {/* CRS */}
              {metadata.crs_info && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                    COORDINATE SYSTEM
                  </h4>
                  <div style={{
                    padding: '8px 12px',
                    background: '#e8f4fc',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#3498db'
                  }}>
                    {metadata.crs_info}
                  </div>
                </div>
              )}

              {/* Opacity Control */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                  OVERLAY OPACITY
                </h4>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#7f8c8d' }}>
                  {overlayOpacity}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BEVDataViewer
