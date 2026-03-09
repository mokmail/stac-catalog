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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          background: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← Back to Catalog
      </button>

      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  background: '#27ae60',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  STAC 1.0.0
                </span>
                <span style={{
                  background: '#e74c3c',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {item.collection}
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0, marginBottom: '8px' }}>
                {item.properties.title}
              </h1>
              <p style={{ color: '#bdc3c7', lineHeight: '1.6' }}>
                {item.properties.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e8e8e8'
        }}>
          {['overview', 'map', 'metadata', 'assets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '15px 25px',
                background: activeTab === tab ? '#fff' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #3498db' : '3px solid transparent',
                color: activeTab === tab ? '#2c3e50' : '#7f8c8d',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Basic Information
                </h3>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                  <p><strong>ID:</strong> {item.id}</p>
                  <p><strong>Collection:</strong> {item.collection}</p>
                  <p><strong>Date:</strong> {formatDate(item.properties.datetime)}</p>
                  <p><strong>License:</strong> {item.properties.license || 'Unknown'}</p>
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Location
                </h3>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                  <p><strong>Coordinates:</strong> {item.geometry.coordinates[1].toFixed(4)}, {item.geometry.coordinates[0].toFixed(4)}</p>
                  <p><strong>Geometry Type:</strong> {item.geometry.type}</p>
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Actions
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={downloadJSON}
                    style={{
                      padding: '8px 16px',
                      background: '#3498db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={downloadGeoJSON}
                    style={{
                      padding: '8px 16px',
                      background: '#27ae60',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Download GeoJSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div style={{
              height: '500px',
              background: '#f8f9fa',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <MapViewer item={item} />
            </div>
          )}

          {activeTab === 'metadata' && (
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '13px',
              overflow: 'auto',
              maxHeight: '600px'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'assets' && (
            <div style={{ display: 'grid', gap: '15px' }}>
              {Object.entries(item.assets || {}).map(([key, asset]) => (
                <div
                  key={key}
                  style={{
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: '6px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#2c3e50', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {asset.title || key}
                    </h4>
                    <span style={{
                      background: '#ecf0f1',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#7f8c8d'
                    }}>
                      {asset.type}
                    </span>
                  </div>
                  
                  {asset.description && (
                    <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '12px' }}>
                      {asset.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    <a
                      href={asset.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        padding: '8px 16px',
                        background: '#3498db',
                        color: '#fff',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      Access Asset
                    </a>
                    
                    {asset.roles && (
                      <span style={{ color: '#95a5a6' }}>
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
    </div>
  )
}

export default STACViewer
