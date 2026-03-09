import React, { useState } from 'react'

const Catalog = ({ items, onSelectItem }) => {
  const [filter, setFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('date-desc')

  const filteredItems = items.filter(item =>
    item.properties.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.properties.description?.toLowerCase().includes(filter.toLowerCase())
  )

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === 'date-desc') {
      return new Date(b.properties.datetime) - new Date(a.properties.datetime)
    } else if (sortOrder === 'date-asc') {
      return new Date(a.properties.datetime) - new Date(b.properties.datetime)
    }
    return 0
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAssetType = (item) => {
    const assetKeys = Object.keys(item.assets || {})
    if (assetKeys.length === 0) return 'Unknown'
    return assetKeys[0].charAt(0).toUpperCase() + assetKeys[0].slice(1)
  }

  return (
    <div style={{ marginTop: '20px' }} className="fade-in">
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search catalog items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '12px 18px',
              border: '1px solid #e1e8ed',
              borderRadius: '12px',
              width: '100%',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          />
        </div>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: '12px 18px',
            border: '1px solid #e1e8ed',
            borderRadius: '12px',
            background: '#fff',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>

        <span style={{
          padding: '10px 20px',
          background: 'rgba(52, 152, 219, 0.1)',
          borderRadius: '12px',
          color: '#3498db',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          {filteredItems.length} Records Found
        </span>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel" style={{
          textAlign: 'center',
          padding: '80px 40px',
          color: '#7f8c8d'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50', marginBottom: '10px' }}>Your Data Catalog is Empty</h3>
          <p style={{ fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Generate new items using the provider tool above to see the STAC implementation in action.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          color: '#95a5a6'
        }}>
          <p style={{ fontSize: '1.2rem' }}>No records match your current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="stac-card"
              onClick={() => onSelectItem(item)}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                border: '1px solid #eef2f6',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{
                  background: 'rgba(46, 204, 113, 0.15)',
                  color: '#27ae60',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {getAssetType(item)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#95a5a6', fontWeight: '500' }}>
                  v{item.stac_version}
                </span>
              </div>

              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                lineHeight: '1.4',
                color: '#1a252f',
                marginBottom: '10px',
                flex: '0 0 auto'
              }}>
                {item.properties.title}
              </h3>

              <p style={{
                color: '#5d6d7e',
                fontSize: '0.925rem',
                marginBottom: '20px',
                lineHeight: '1.6',
                display: '-webkit-box',
                WebkitLineClamp: '3',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: '1'
              }}>
                {item.properties.description || 'Access and manage your spatial data metadata through this STAC compliant item.'}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid #f2f5f8',
                fontSize: '0.8rem',
                color: '#7f8c8d'
              }}>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  📅 {formatDate(item.properties.datetime)}
                </span>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center', fontWeight: '600', color: '#34495e' }}>
                  📍 {(() => {
                    const coords = item.geometry.type === 'Point'
                      ? item.geometry.coordinates
                      : item.geometry.coordinates[0][0];
                    return `${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}`;
                  })()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Catalog
