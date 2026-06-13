import React, { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import LandCoverLegend from './LandCoverLegend'
import { getEncodedColormap } from '../utils/landCoverColormap.js'

let GeoRasterLayer = null
let parseGeoraster = null

async function loadRasterLibs() {
  if (!GeoRasterLayer || !parseGeoraster) {
    const georaster = await import('georaster')
    const georasterLayer = await import('georaster-layer-for-leaflet')
    parseGeoraster = georaster.default || georaster
    GeoRasterLayer = georasterLayer.default || georasterLayer
  }
  return { GeoRasterLayer, parseGeoraster }
}

const MapViewer = ({ item }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlayLayerRef = useRef(null)

  const getGeometryCenter = (geometry) => {
    if (!geometry) return null

    if (geometry.type === 'Point') {
      return [geometry.coordinates[1], geometry.coordinates[0]]
    }

    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
      const ring = geometry.coordinates[0]
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [x, y] of ring) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      return [(minY + maxY) / 2, (minX + maxX) / 2]
    }

    return null
  }

  const getBounds = (geometry) => {
    if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]) {
      const ring = geometry.coordinates[0]
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [x, y] of ring) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      return [[minY, minX], [maxY, maxX]]
    }
    return null
  }

  const findRasterAsset = (assets) => {
    if (!assets) return null
    for (const [key, asset] of Object.entries(assets)) {
      const href = asset.href || ''
      const lower = href.toLowerCase()
      if (lower.endsWith('.tif') || lower.endsWith('.tiff') || lower.endsWith('.cog')) {
        return { key, asset, href }
      }
    }
    return null
  }

  const getTitilerTileUrl = (assets) => {
    const cogAssets = Object.values(assets || {}).filter((a) => {
      const lower = (a.href || '').toLowerCase()
      return lower.endsWith('.tif') || lower.endsWith('.tiff') || lower.endsWith('.cog')
    })

    // Prefer an asset that already has a pre-built TiTiler tile template
    const tileAsset = cogAssets.find((a) => a.tileUrlTemplate)
    if (tileAsset) return tileAsset.tileUrlTemplate

    // Fallback: build a proxy URL using the first COG
    const cog = cogAssets[0]
    if (!cog) return null
    const encodedUrl = encodeURIComponent(cog.href)
    const encodedColormap = getEncodedColormap()
    return `/titiler/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodedUrl}&colormap=${encodedColormap}`
  }

  const addBaseGeometry = (map) => {
    if (item.geometry?.type === 'Polygon' && item.geometry.coordinates?.[0]) {
      const ring = item.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
      L.polygon(ring, { color: '#4f46e5', fillOpacity: 0.05, weight: 2 }).addTo(map)
    }

    if (item.geometry?.type === 'Point') {
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="#4f46e5"></circle>
          </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -36]
      })
      L.marker(
        [item.geometry.coordinates[1], item.geometry.coordinates[0]],
        { icon }
      ).addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${item.properties.title}</h3>
            <p style="margin: 0; color: #475569; font-size: 13px;">${item.geometry.type}</p>
          </div>
        `)
        .openPopup()
    }
  }

  useEffect(() => {
    if (!mapRef.current) return

    const initialCenter = getGeometryCenter(item.geometry) || [47.5162, 13.3765]
    const initialZoom = item.geometry?.type === 'Point' ? 13 : 7

    const map = L.map(mapRef.current).setView(initialCenter, initialZoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    addBaseGeometry(map)

    map.attributionControl.setPrefix('')
    mapInstanceRef.current = map

    const tileUrl = getTitilerTileUrl(item.assets)

    // 1) Try a tiled TiTiler overlay first (best for large COGs)
    if (tileUrl) {
      const bounds = item.bbox ? [[item.bbox[1], item.bbox[0]], [item.bbox[3], item.bbox[2]]] : getBounds(item.geometry)
      const tileLayer = L.tileLayer(tileUrl, {
        opacity: 0.75,
        maxZoom: 19,
        attribution: 'Raster overlay via TiTiler',
        bounds: bounds || undefined,
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      }).addTo(map)
      overlayLayerRef.current = tileLayer

      if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
    }
    // 2) Fallback: direct client-side GeoTIFF overlay for small files
    else {
      const raster = findRasterAsset(item.assets)
      if (raster) {
        loadRasterLibs().then(({ GeoRasterLayer, parseGeoraster }) => {
          fetch(raster.href)
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              return response.arrayBuffer()
            })
            .then((arrayBuffer) => parseGeoraster(arrayBuffer))
            .then((georaster) => {
              const layer = new GeoRasterLayer({
                georaster,
                opacity: 0.75,
                resolution: 64
              })
              layer.addTo(map)
              overlayLayerRef.current = layer
              if (layer.getBounds) {
                map.fitBounds(layer.getBounds(), { padding: [40, 40] })
              }
            })
            .catch((err) => {
              console.warn('Could not overlay raster:', err)
              const bounds = getBounds(item.geometry)
              if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
            })
        })
      } else {
        const bounds = getBounds(item.geometry)
        if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        overlayLayerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !item) return

    const map = mapInstanceRef.current

    // Clear everything except the base tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer) || (overlayLayerRef.current && layer === overlayLayerRef.current)) {
        map.removeLayer(layer)
      }
    })
    overlayLayerRef.current = null

    addBaseGeometry(map)

    const tileUrl = getTitilerTileUrl(item.assets)

    if (tileUrl) {
      const bounds = item.bbox ? [[item.bbox[1], item.bbox[0]], [item.bbox[3], item.bbox[2]]] : getBounds(item.geometry)
      const tileLayer = L.tileLayer(tileUrl, {
        opacity: 0.75,
        maxZoom: 19,
        attribution: 'Raster overlay via TiTiler',
        bounds: bounds || undefined,
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      }).addTo(map)
      overlayLayerRef.current = tileLayer

      if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
    } else {
      const raster = findRasterAsset(item.assets)
      if (raster) {
        loadRasterLibs().then(({ GeoRasterLayer, parseGeoraster }) => {
          fetch(raster.href)
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              return response.arrayBuffer()
            })
            .then((arrayBuffer) => parseGeoraster(arrayBuffer))
            .then((georaster) => {
              const layer = new GeoRasterLayer({
                georaster,
                opacity: 0.75,
                resolution: 64
              })
              layer.addTo(map)
              overlayLayerRef.current = layer
              if (layer.getBounds) {
                map.fitBounds(layer.getBounds(), { padding: [40, 40] })
              }
            })
            .catch((err) => {
              console.warn('Could not overlay raster:', err)
              const bounds = getBounds(item.geometry)
              if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
            })
        })
      } else {
        const center = getGeometryCenter(item.geometry)
        const bounds = getBounds(item.geometry)
        if (bounds) {
          map.fitBounds(bounds, { padding: [40, 40] })
        } else if (center) {
          map.setView(center, item.geometry?.type === 'Point' ? 13 : 7)
        }
      }
    }
  }, [item])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
      />
      <LandCoverLegend />
    </div>
  )
}

export default MapViewer
