import React, { useState } from 'react'
import MapViewer from './MapViewer'

const STACViewer = ({ item, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview')

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [item]
    }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.id}.geojson`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRepresentativePoint = (geometry) => {
    if (!geometry) return [null, null]

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

    return [null, null]
  }

  const renderLocationInfo = () => {
    const [lat, lng] = getRepresentativePoint(item.geometry)

    if (item.geometry?.type === 'Polygon' && item.bbox) {
      return (
        <>
          <p><strong>BBox:</strong> {item.bbox.map((c) => c.toFixed(4)).join(', ')}</p>
          <p><strong>Center:</strong> {lat?.toFixed(4)}, {lng?.toFixed(4)}</p>
          <p><strong>Geometry Type:</strong> {item.geometry.type}</p>
        </>
      )
    }

    return (
      <>
        <p><strong>Coordinates:</strong> {lat?.toFixed(4)}, {lng?.toFixed(4)}</p>
        <p><strong>Geometry Type:</strong> {item.geometry.type}</p>
      </>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'metadata', label: 'Metadata', icon: '📄' },
    { id: 'assets', label: 'Assets', icon: '📦' }
  ]

  return (
    <div className="panel">
      <button
        onClick={onBack}
        className="btn btn-ghost"
        style={{ margin: '20px 0 16px' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Catalog
      </button>

      <div className="viewer-header">
        <div className="viewer-header-badges">
          <span className="badge badge-success">STAC {item.stac_version}</span>
          <span className="badge badge-danger">{item.collection}</span>
        </div>
        <h1>{item.properties.title}</h1>
        <p>{item.properties.description}</p>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="info-grid">
            <div className="info-card">
              <h3>Basic Information</h3>
              <div className="info-list">
                <p><strong>ID:</strong> {item.id}</p>
                <p><strong>Collection:</strong> {item.collection}</p>
                <p><strong>Date:</strong> {formatDate(item.properties.datetime)}</p>
                <p><strong>License:</strong> {item.properties.license || 'Unknown'}</p>
              </div>
            </div>

            <div className="info-card">
              <h3>Location</h3>
              <div className="info-list">
                {renderLocationInfo()}
              </div>
            </div>

            <div className="info-card">
              <h3>Actions</h3>
              <div className="info-actions">
                <button onClick={downloadJSON} className="btn btn-primary">
                  Download JSON
                </button>
                <button onClick={downloadGeoJSON} className="btn btn-success">
                  Download GeoJSON
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-container">
            <MapViewer item={item} />
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="code-block">
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="asset-list">
            {Object.entries(item.assets || {}).map(([key, asset]) => (
              <div key={key} className="asset-card">
                <div className="asset-card-header">
                  <h4 className="asset-card-title">{asset.title || key}</h4>
                  <span className="asset-card-type">{asset.type}</span>
                </div>

                {asset.description && (
                  <p className="asset-card-desc">{asset.description}</p>
                )}

                <div className="asset-card-actions">
                  <a
                    href={asset.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Access Asset
                  </a>

                  {asset.roles && (
                    <span className="asset-card-roles">
                      Roles: {asset.roles.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default STACViewer
