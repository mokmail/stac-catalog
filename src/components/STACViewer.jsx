import React, { useState } from 'react'
import MapViewer from './MapViewer'

const STACViewer = ({ item, onBack, onAnalyze }) => {
  const [activeTab, setActiveTab] = useState('map')

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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#2c3e50',
            border: '1px solid #e1e8ed',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <span>←</span> Back
        </button>
        
        <button
          onClick={() => setActiveTab('map')}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          🗺️ View on Map
        </button>
        
        <button
          onClick={() => onAnalyze && onAnalyze(item)}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          📊 Analyze Data
        </button>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #eef2f6'
      }}>
        {/* Header */}
        <div style={{
          padding: '40px',
          background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
          color: '#fff',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{
                  background: 'rgba(39, 174, 96, 0.2)',
                  color: '#2ecc71',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  border: '1px solid rgba(46, 204, 113, 0.3)'
                }}>
                  STAC v1.0.0
                </span>
                <span style={{
                  background: 'rgba(231, 76, 60, 0.2)',
                  color: '#e74c3c',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  border: '1px solid rgba(231, 76, 60, 0.3)'
                }}>
                  {item.collection.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: '800', margin: 0, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                {item.properties.title}
              </h1>
              <p style={{ color: '#95a5a6', lineHeight: '1.6', fontSize: '1.1rem', maxWidth: '800px' }}>
                {item.properties.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#f8f9fa',
          padding: '0 20px',
          borderBottom: '1px solid #eef2f6'
        }}>
          {['overview', 'map', 'metadata', 'assets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '20px 30px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #3498db' : '3px solid transparent',
                color: activeTab === tab ? '#3498db' : '#7f8c8d',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '40px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                  System Properties
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#5d6d7e', lineHeight: '2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8f9fa', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Identifier</span>
                    <span style={{ color: '#95a5a6', fontSize: '0.8rem' }}>{item.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8f9fa', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Collection</span>
                    <span>{item.collection}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8f9fa', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Acquisition Date</span>
                    <span>{formatDate(item.properties.datetime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>License</span>
                    <span style={{ color: '#3498db', fontWeight: '600' }}>{item.properties.license || 'Proprietary'}</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                  Spatial Footprint
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#5d6d7e', lineHeight: '2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8f9fa', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Coordinates</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {(() => {
                        const coords = item.geometry.type === 'Point'
                          ? item.geometry.coordinates
                          : item.geometry.coordinates[0][0];
                        return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
                      })()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>Geometry Type</span>
                    <span style={{
                      background: '#f1f4f6',
                      padding: '2px 10px',
                      borderRadius: '100px',
                      fontSize: '0.75rem'
                    }}>{item.geometry.type}</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                  Service Actions
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <button
                    onClick={downloadJSON}
                    style={{
                      padding: '12px',
                      background: '#3498db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(52, 152, 219, 0.2)'
                    }}
                  >
                    Download STAC JSON
                  </button>
                  <button
                    onClick={downloadGeoJSON}
                    style={{
                      padding: '12px',
                      background: '#27ae60',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(39, 174, 96, 0.2)'
                    }}
                  >
                    Download GeoJSON
                  </button>
                </div>
              </div>

              {item.properties["bev:type"] === 'land-cover' && (
                <div style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid #eef2f6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  gridColumn: '1 / -1'
                }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                    Land Cover Classification Legend (Bodenbedeckung)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {[
                      { code: 1, color: '#0C6400', name: 'High Vegetation (Wald / Hohe Vegetation)', en: 'High Vegetation' },
                      { code: 2, color: '#CDAA66', name: 'Soil Areas (Bodenflächen)', en: 'Soil Areas' },
                      { code: 3, codeHex: '#60C630', color: '#60C630', name: 'Medium Vegetation (Mittlere Vegetation)', en: 'Medium Vegetation' },
                      { code: 4, color: '#E60000', name: 'Buildings (Gebäude)', en: 'Buildings' },
                      { code: 5, color: '#005CE6', name: 'Water Bodies (Gewässer)', en: 'Water Bodies' },
                      { code: 6, color: '#D2F0BE', name: 'Low Vegetation (Niedrige Vegetation)', en: 'Low Vegetation' }
                    ].map(cls => (
                      <div key={cls.code} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cls.color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '0.9rem' }}>{cls.en}</div>
                          <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>{cls.name.includes('(') ? cls.name.split('(')[1].split(')')[0] : cls.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div style={{
              height: '600px',
              background: '#f8f9fa',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid #eef2f6'
            }}>
              <MapViewer item={item} />
            </div>
          )}

          {activeTab === 'metadata' && (
            <div style={{
              background: '#1e272e',
              padding: '30px',
              borderRadius: '20px',
              fontFamily: '"Fira Code", monospace',
              fontSize: '0.85rem',
              overflow: 'auto',
              maxHeight: '600px',
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.2)',
              color: '#d2dae2'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'assets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              {Object.entries(item.assets || {}).map(([key, asset]) => (
                <div
                  key={key}
                  style={{
                    background: '#fff',
                    border: '1px solid #eef2f6',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ color: '#2c3e50', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                      {asset.title || key}
                    </h4>
                    <span style={{
                      background: '#f0f4f7',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      fontSize: '0.7rem',
                      color: '#7f8c8d',
                      fontWeight: '700'
                    }}>
                      {asset.type.split(';')[0]}
                    </span>
                  </div>

                  {asset.description && (
                    <p style={{ color: '#5d6d7e', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', flex: '1' }}>
                      {asset.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid #f8f9fa'
                  }}>
                    <a
                      href={asset.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        padding: '10px 20px',
                        background: '#3498db',
                        color: '#fff',
                        borderRadius: '100px',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}
                    >
                      Retrieve Data
                    </a>

                    {asset.roles && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {asset.roles.map(role => (
                          <span key={role} style={{
                            fontSize: '0.7rem',
                            color: '#95a5a6',
                            background: '#f8f9fa',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {role}
                          </span>
                        ))}
                      </div>
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
