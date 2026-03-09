import React, { useState } from 'react'
import api from '../services/api'

const BEVMetadataFetcher = ({ onClose }) => {
  const [recordId, setRecordId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)

  const handleFetch = async () => {
    if (!recordId.trim()) {
      setError('Please enter a record ID')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getBEVMetadata(recordId.trim())
      
      if (data.error) {
        setError(data.error)
      } else {
        setMetadata(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>BEV Metadata Fetcher</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d'
            }}
          >×</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="Enter BEV record ID (e.g., 4ea1af9a-d2f3-4019-a1b9-bdd5c3def221)"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            borderRadius: '8px',
            color: '#c00',
            marginBottom: '16px'
          }}>
            Error: {error}
          </div>
        )}

        {metadata && (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <div style={cardStyle}>
              <h4 style={cardTitle}>📋 Basic Information</h4>
              <div style={gridStyle}>
                <div><strong>ID:</strong> {metadata.id}</div>
                <div><strong>Type:</strong> {metadata.type || 'N/A'}</div>
                <div><strong>Date:</strong> {metadata.date || 'N/A'}</div>
              </div>
            </div>

            {metadata.title && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>📝 Title</h4>
                <div>{metadata.title}</div>
              </div>
            )}

            {metadata.abstract && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>📄 Description</h4>
                <div style={{ fontSize: '13px', color: '#666' }}>{metadata.abstract}</div>
              </div>
            )}

            {metadata.bounds && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>📐 Geographic Bounds</h4>
                <div style={gridStyle}>
                  <div><strong>West:</strong> {metadata.bounds.west?.toFixed(4)}</div>
                  <div><strong>East:</strong> {metadata.bounds.east?.toFixed(4)}</div>
                  <div><strong>South:</strong> {metadata.bounds.south?.toFixed(4)}</div>
                  <div><strong>North:</strong> {metadata.bounds.north?.toFixed(4)}</div>
                </div>
              </div>
            )}

            {metadata.crs && metadata.crs.length > 0 && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>🗺️ Coordinate Systems (CRS)</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {metadata.crs.map((crs, i) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      background: '#3498db',
                      color: 'white',
                      borderRadius: '100px',
                      fontSize: '12px'
                    }}>
                      EPSG:{crs}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {metadata.wms_url && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>🌐 WMS Service</h4>
                <div style={{ fontSize: '12px', wordBreak: 'break-all', color: '#666' }}>
                  {metadata.wms_url}
                </div>
                {metadata.layers && metadata.layers.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Available Layers:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
                      {metadata.layers.slice(0, 10).map((layer, i) => (
                        <li key={i}>{layer}</li>
                      ))}
                      {metadata.layers.length > 10 && <li>...and {metadata.layers.length - 10} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {metadata.wfs_url && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>🔗 WFS Service</h4>
                <div style={{ fontSize: '12px', wordBreak: 'break-all', color: '#666' }}>
                  {metadata.wfs_url}
                </div>
              </div>
            )}

            {metadata.download_urls && metadata.download_urls.length > 0 && (
              <div style={cardStyle}>
                <h4 style={cardTitle}>📥 Download URLs</h4>
                {metadata.download_urls.map((dl, i) => (
                  <div key={i} style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <a href={dl.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>
                      {dl.name || dl.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
          <strong>Tip:</strong> You can find record IDs in the BEV data catalog URLs or CSW responses.
          <br />
          Example: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>4ea1af9a-d2f3-4019-a1b9-bdd5c3def221</code>
        </div>
      </div>
    </div>
  )
}

const cardStyle = {
  background: '#f8f9fa',
  padding: '16px',
  borderRadius: '12px',
  marginBottom: '12px'
}

const cardTitle = {
  margin: '0 0 12px 0',
  fontSize: '14px',
  color: '#2c3e50'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px',
  fontSize: '13px',
  color: '#666'
}

export default BEVMetadataFetcher
