import React, { useState } from 'react'
import EmptyCatalogState from './EmptyCatalogState'

const Catalog = ({ items, onSelectItem }) => {
  const [filter, setFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('date-desc')

  const filteredItems = items.filter(item =>
    item.properties.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.properties.description?.toLowerCase().includes(filter.toLowerCase()) ||
    item.properties.informationZumProdukt?.toLowerCase().includes(filter.toLowerCase())
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
      day: 'numeric'
    })
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

  const getThumbnailUrl = (item) => {
    return item.assets?.thumbnail?.href || null
  }

  const getAssetType = (item) => {
    const assetKeys = Object.keys(item.assets || {})
    if (assetKeys.length === 0) return 'Unknown'
    const key = assetKeys.find((k) => k !== 'thumbnail' && k !== 'cog_tiles') || assetKeys[0]
    return key.charAt(0).toUpperCase() + key.slice(1)
  }

  if (items.length === 0) {
    return <EmptyCatalogState />
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <div className="catalog-toolbar">
          <input
            type="text"
            placeholder="Search items by title or description..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input"
          />

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>

          <span className="badge-count">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon" style={{ fontSize: '1.75rem' }}>🔍</div>
            <h3>No matching items</h3>
            <p>Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {sortedItems.map((item) => {
              const thumbnailUrl = getThumbnailUrl(item)
              const [lat, lng] = getRepresentativePoint(item.geometry)

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="item-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectItem(item)}
                >
                  <div className="item-card-header">
                    <h3 className="item-card-title" title={item.properties.title}>{item.properties.title}</h3>
                    <span className="item-card-badge">{getAssetType(item)}</span>
                  </div>

                  {thumbnailUrl && (
                    <div className="item-card-thumbnail">
                      <img
                        src={thumbnailUrl}
                        alt={`Thumbnail for ${item.properties.title}`}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <p className="item-card-desc">
                    {item.properties.description || 'No description available'}
                  </p>

                  {item.properties.informationZumProdukt && (
                    <p className="item-card-info" title={item.properties.informationZumProdukt}>
                      {item.properties.informationZumProdukt}
                    </p>
                  )}

                  <div className="item-card-meta">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatDate(item.properties.datetime)}
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {lat != null && lng != null
                        ? `${lat.toFixed(2)}, ${lng.toFixed(2)}`
                        : item.geometry?.type || '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Catalog
