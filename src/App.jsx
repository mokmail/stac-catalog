import React, { useState } from 'react'
import Catalog from './components/Catalog'
import STACViewer from './components/STACViewer'
import STACGenerator from './components/STACGenerator'

function App() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const handleGenerateItems = (count) => {
    const newItems = []
    const assetTypes = [' imagery', 'dem', 'vector', 'labels', 'analytics']
    
    for (let i = 0; i < count; i++) {
      const lat = 34 + Math.random() * 10
      const lng = -120 + Math.random() * 10
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
      
      newItems.push({
        type: 'Feature',
        stac_version: '1.0.0',
        id: `item-${i + 1}-${Date.now()}`,
        collection: 'samples',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          datetime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          title: `Sample Asset ${i + 1}`,
          description: `Generated STAC item with ${assetType} data`,
          license: 'CC-BY-4.0',
          creators: ['Test Creator']
        },
        assets: {
          data: {
            href: `https://example.com/assets/${i + 1}/data${assetType.replace(' ', '')}.tif`,
            title: `Data File ${i + 1}`,
            type: 'image/tiff',
            description: `GeoTIFF ${assetType} data`
          },
          thumbnail: {
            href: `https://example.com/assets/${i + 1}/thumb.jpg`,
            title: 'Thumbnail',
            type: 'image/jpeg',
            roles: ['thumbnail']
          }
        },
        links: [
          {
            rel: 'self',
            href: `https://example.com/stac/items/${i + 1}`
          },
          {
            rel: 'collection',
            href: 'https://example.com/stac/collections/samples'
          }
        ]
      })
    }
    setItems(newItems)
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleBackToCatalog = () => {
    setSelectedItem(null)
    setViewMode('list')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#2c3e50' }}>STAC Catalog Viewer</h1>
        <p style={{ color: '#7f8c8d' }}>Space-Time Asset Catalog Generator and Explorer</p>
      </header>

      {viewMode === 'list' && (
        <div>
          <STACGenerator onGenerate={handleGenerateItems} />
          <Catalog items={items} onSelectItem={handleSelectItem} />
        </div>
      )}

      {viewMode === 'detail' && selectedItem && (
        <STACViewer 
          item={selectedItem} 
          onBack={handleBackToCatalog} 
        />
      )}
    </div>
  )
}

export default App
