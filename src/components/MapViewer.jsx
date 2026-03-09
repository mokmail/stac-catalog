import React, { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MapViewer = ({ item }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [item.geometry.coordinates[1], item.geometry.coordinates[0]],
      13
    )

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Create icon for the point
    const icon = L.icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
      `),
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    // Add marker
    L.marker(
      [item.geometry.coordinates[1], item.geometry.coordinates[0]],
      { icon }
    ).addTo(map)
      .bindPopup(`
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3 style="margin: 0 0 8px 0; color: #2c3e50;">${item.properties.title}</h3>
          <p style="margin: 0; color: #666; font-size: 13px;">${item.geometry.type}</p>
          <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">
            Date: ${new Date(item.properties.datetime).toLocaleDateString()}
          </p>
        </div>
      `)

    // Add attribution
    map.attributionControl.setPrefix('')

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [item])

  useEffect(() => {
    if (mapInstanceRef.current && item) {
      mapInstanceRef.current.setView(
        [item.geometry.coordinates[1], item.geometry.coordinates[0]],
        13
      )
    }
  }, [item])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default MapViewer
