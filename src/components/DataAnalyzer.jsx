import React, { useState, useEffect } from 'react'
import api from '../services/api'

const DataAnalyzer = ({ item, onBack }) => {
  const [activeTab, setActiveTab] = useState('metadata')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [landCover, setLandCover] = useState(null)
  const [histogram, setHistogram] = useState(null)
  const [samplePoint, setSamplePoint] = useState({ lon: 13.5, lat: 47.5 })
  const [sampleResult, setSampleResult] = useState(null)
  const [sampleLoading, setSampleLoading] = useState(false)

  const getAssetUrl = () => {
    if (item.assets?.data?.href) return item.assets.data.href
    const keys = Object.keys(item.assets || {})
    for (const key of keys) {
      const asset = item.assets[key]
      if (asset.href) return asset.href
    }
    return null
  }

  const fetchMetadata = async () => {
    const url = getAssetUrl()
    if (!url) {
      setError('No data asset found')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMetadata(url)
      setMetadata(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLandCover = async () => {
    const url = getAssetUrl()
    if (!url) {
      setError('No data asset found')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.analyzeLandCover(url)
      setLandCover(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistogram = async () => {
    const url = getAssetUrl()
    if (!url) {
      setError('No data asset found')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHistogram(url, 128)
      setHistogram(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sampleRaster = async () => {
    const url = getAssetUrl()
    if (!url) {
      setError('No data asset found')
      return
    }
    setSampleLoading(true)
    setError(null)
    try {
      const data = await api.sampleRaster(url, samplePoint.lon, samplePoint.lat)
      setSampleResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSampleLoading(false)
    }
  }

  const LAND_COVER_CLASSES = {
    1: { name: 'Hohe Vegetation', color: '#0C6400' },
    2: { name: 'Mittlere Vegetation', color: '#60C630' },
    3: { name: 'Niedrige Vegetation', color: '#CDAA66' },
    4: { name: 'Gebaeude', color: '#E60000' },
    5: { name: 'Bodenflaechen', color: '#D2F0BE' },
    6: { name: 'Gewaesser', color: '#005CE6' }
  }

  const renderHistogram = (histData) => {
    const band1 = histData?.band_1
    if (!band1) return null

    const max = Math.max(...band1.histogram)
    const width = 100 / band1.histogram.length
    const isSampled = histData?.band_1?.sampled

    return (
      <div>
        {isSampled && (
          <div style={{ padding: '8px 12px', background: '#fff3cd', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#856404' }}>
            ⚠️ Data was sampled for performance (original: {band1.sample_size?.toLocaleString()} pixels)
          </div>
        )}
        
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1px', marginTop: '20px' }}>
          {band1.histogram.slice(0, 64).map((val, i) => {
            // Try to determine class from bin value
            const binValue = band1.bins?.[i] || i
            const cls = Math.round(binValue)
            const clsInfo = LAND_COVER_CLASSES[cls]
            
            return (
              <div
                key={i}
                title={`Value: ${binValue.toFixed(2)}, Count: ${val.toLocaleString()}${clsInfo ? ', Class: ' + clsInfo.name : ''}`}
                style={{
                  width: `${width}%`,
                  height: `${(val / max) * 100}%`,
                  background: clsInfo?.color || '#3498db',
                  minHeight: '2px',
                  opacity: 0.85
                }}
              />
            )
          })}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
          {Object.entries(LAND_COVER_CLASSES).map(([cls, info]) => (
            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <div style={{ width: '12px', height: '12px', background: info.color, borderRadius: '2px' }} />
              <span>{cls}: {info.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
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
          fontSize: '0.9rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <span>←</span> Back to STAC Viewer
      </button>

      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #eef2f6'
      }}>
        <div style={{
          padding: '30px 40px',
          background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
          color: '#fff'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            Data Analysis: {item.properties.title}
          </h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.7 }}>
            Advanced raster analysis powered by rasterio & shapely
          </p>
        </div>

        <div style={{
          display: 'flex',
          background: '#f8f9fa',
          padding: '0 20px',
          borderBottom: '1px solid #eef2f6'
        }}>
          {['metadata', 'land-cover', 'histogram', 'sample', 'datasets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '20px 25px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #3498db' : '3px solid transparent',
                color: activeTab === tab ? '#3498db' : '#7f8c8d',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div style={{ padding: '40px' }}>
          {error && (
            <div style={{
              padding: '16px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00',
              marginBottom: '20px'
            }}>
              Error: {error}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={fetchMetadata}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Loading...' : 'Fetch Metadata'}
                </button>
              </div>

              {metadata && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={cardStyle}>
                    <h3 style={cardTitle}>📍 Basic Information</h3>
                    <div style={gridStyle}>
                      <div><strong>Driver:</strong> {metadata.driver}</div>
                      <div><strong>Dimensions:</strong> {metadata.width} x {metadata.height}</div>
                      <div><strong>Bands:</strong> {metadata.bands}</div>
                      <div><strong>Data Types:</strong> {metadata.dtypes?.join(', ')}</div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitle}>🗺️ Coordinate Reference System</h3>
                    <div style={gridStyle}>
                      <div><strong>CRS:</strong> {metadata.crs}</div>
                      <div><strong>Info:</strong> {metadata.crs_info}</div>
                      <div><strong>Resolution:</strong> {metadata.resolution?.x} x {metadata.resolution?.y} {metadata.resolution?.unit}</div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitle}>📐 Spatial Extent</h3>
                    <div style={gridStyle}>
                      <div><strong>Left:</strong> {metadata.bounds?.left?.toFixed(2)}</div>
                      <div><strong>Right:</strong> {metadata.bounds?.right?.toFixed(2)}</div>
                      <div><strong>Top:</strong> {metadata.bounds?.top?.toFixed(2)}</div>
                      <div><strong>Bottom:</strong> {metadata.bounds?.bottom?.toFixed(2)}</div>
                    </div>
                    {metadata.bounds_wgs84 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                        <strong>WGS84:</strong> {metadata.bounds_wgs84.south?.toFixed(4)}° to {metadata.bounds_wgs84.north?.toFixed(4)}° lat, {metadata.bounds_wgs84.west?.toFixed(4)}° to {metadata.bounds_wgs84.east?.toFixed(4)}° lon
                      </div>
                    )}
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitle}>🔍 Overviews</h3>
                    {metadata.overviews && Object.keys(metadata.overviews).length > 0 ? (
                      <div>
                        {Object.entries(metadata.overviews).map(([level, size]) => (
                          <div key={level}>Level {level}: {size[0]} x {size[1]}</div>
                        ))}
                      </div>
                    ) : (
                      <div>No overviews available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'land-cover' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={fetchLandCover}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Land Cover'}
                </button>
              </div>

              {landCover && (
                <div>
                  <div style={cardStyle}>
                    <h3 style={cardTitle}>📊 Classification Summary</h3>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Total Pixels: {landCover.total_pixels?.toLocaleString()}
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitle}>🎨 Classification Distribution</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {landCover.distribution?.map((cls, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: cls.color || '#ccc',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600' }}>{cls.name_en}</span>
                              <span style={{ color: '#666' }}>{cls.percentage}%</span>
                            </div>
                            <div style={{
                              height: '8px',
                              background: '#eee',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${cls.percentage}%`,
                                background: cls.color || '#3498db',
                                borderRadius: '4px'
                              }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>
                              {cls.pixels?.toLocaleString()} pixels • {cls.name_de}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'histogram' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={fetchHistogram}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#9b59b6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Computing...' : 'Compute Histogram'}
                </button>
              </div>

              {histogram && (
                <div style={cardStyle}>
                  <h3 style={cardTitle}>📈 Value Distribution</h3>
                  {renderHistogram(histogram)}
                  
                  {histogram.band_1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
                      <div><strong>Min:</strong> {histogram.band_1.min?.toFixed(2)}</div>
                      <div><strong>Max:</strong> {histogram.band_1.max?.toFixed(2)}</div>
                      <div><strong>Mean:</strong> {histogram.band_1.mean?.toFixed(2)}</div>
                      <div><strong>Std Dev:</strong> {histogram.band_1.std?.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sample' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.01"
                    value={samplePoint.lon}
                    onChange={(e) => setSamplePoint(p => ({ ...p, lon: parseFloat(e.target.value) }))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '120px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.01"
                    value={samplePoint.lat}
                    onChange={(e) => setSamplePoint(p => ({ ...p, lat: parseFloat(e.target.value) }))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '120px' }}
                  />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button
                    onClick={sampleRaster}
                    disabled={sampleLoading}
                    style={{
                      padding: '10px 24px',
                      background: '#e67e22',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: sampleLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {sampleLoading ? 'Sampling...' : 'Sample Point'}
                  </button>
                </div>
              </div>

              {sampleResult && !sampleResult.error && (
                <div style={cardStyle}>
                  <h3 style={cardTitle}>🎯 Sample Results</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div><strong>Location (WGS84):</strong> {sampleResult.location?.lon?.toFixed(5)}, {sampleResult.location?.lat?.toFixed(5)}</div>
                    <div><strong>Pixel (raster):</strong> row {sampleResult.pixel?.row}, col {sampleResult.pixel?.col}</div>
                    <div><strong>Coordinates (CRS):</strong> {sampleResult.pixel?.x}, {sampleResult.pixel?.y}</div>
                    
                    <div style={{ marginTop: '16px' }}>
                      <strong>Band Values:</strong>
                    </div>
                    {sampleResult.values?.map((val, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Band {val.band} ({val.dtype})</span>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                          {val.value?.toFixed(4)}
                          {val.classification && (
                            <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: val.classification.color }}>
                              {val.classification.en}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sampleResult?.error && (
                <div style={{ padding: '16px', background: '#fee', borderRadius: '8px', color: '#c00' }}>
                  {sampleResult.error}
                </div>
              )}
            </div>
          )}

          {activeTab === 'datasets' && (
            <div>
              <BEVDatasets />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BEVDatasets = () => {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getDatasets()
      .then(setDatasets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading datasets...</div>

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {datasets.map(ds => (
        <div key={ds.id} style={{
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #eef2f6'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{ds.name}</h3>
          <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '0.9rem' }}>{ds.description}</p>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#888' }}>
            <span>📏 Scale: {ds.scale || ds.type}</span>
            <span>🗺️ CRS: {ds.crs}</span>
          </div>
          {ds.legend && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(ds.legend).map(([code, info]) => (
                <span key={code} style={{
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  background: info.color,
                  color: '#fff'
                }}>
                  {code}: {info.en}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const cardStyle = {
  background: '#f8f9fa',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #eef2f6'
}

const cardTitle = {
  margin: '0 0 16px 0',
  fontSize: '1rem',
  color: '#2c3e50'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  fontSize: '0.9rem',
  color: '#5d6d7e'
}

export default DataAnalyzer
