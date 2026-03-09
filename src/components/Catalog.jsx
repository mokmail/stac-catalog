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
    <div style={{ marginTop: '20px' }}>
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search items..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            flex: '1',
            minWidth: '200px'
          }}
        />

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '6px'
          }}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>

        <span style={{
          padding: '10px 15px',
          background: '#ecf0f1',
          borderRadius: '6px',
          color: '#555'
        }}>
          {filteredItems.length} items
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#7f8c8d'
        }}>
          <p style={{ fontSize: '18px' }}>No STAC items yet</p>
          <p>Use the generator above to create sample items</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#95a5a6'
        }}>
          <p>No matching items found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
          {sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid #e8e8e8'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <h3 style={{
                  color: '#2c3e50',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {item.properties.title}
                </h3>
                <span style={{
                  background: '#3498db',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getAssetType(item)}
                </span>
              </div>

              <p style={{
                color: '#7f8c8d',
                fontSize: '14px',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {item.properties.description || 'No description available'}
              </p>

              <div style={{
                display: 'flex',
                gap: '10px',
                fontSize: '13px',
                color: '#95a5a6'
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  📅 {formatDate(item.properties.datetime)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  📍 {item.geometry.coordinates[1].toFixed(2)}, {item.geometry.coordinates[0].toFixed(2)}
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
