import React, { useState } from 'react'
import Catalog from './components/Catalog'
import STACViewer from './components/STACViewer'
import STACGenerator from './components/STACGenerator'
import DataAnalyzer from './components/DataAnalyzer'

function App() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [analyzeItem, setAnalyzeItem] = useState(null)

  const handleGenerateItems = (countOrItems, isBEV = false) => {
    // Handle custom items array from URL loading or file upload
    if (Array.isArray(countOrItems)) {
      setItems(countOrItems)
      return
    }

    const count = countOrItems
    
    if (isBEV) {
      // This case is handled by STACGenerator now
      return
    }
    
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

  const handleAnalyze = (item) => {
    setAnalyzeItem(item)
    setViewMode('analyze')
  }

  const handleBackFromAnalyze = () => {
    setAnalyzeItem(null)
    setViewMode('detail')
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      maxWidth: '1440px',
      margin: '0 auto'
    }}>
      <header style={{
        marginBottom: '40px',
        textAlign: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
        borderRadius: '16px',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />

        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          margin: '0 0 10px 0',
          letterSpacing: '-1.5px',
          color: '#fff'
        }}>
          STAC Viewer
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: '0.9',
          margin: 0,
          fontWeight: '300'
        }}>
          BEV SpatioTemporal Asset Catalog Service
        </p>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {viewMode === 'list' && (
          <div className="fade-in">
            <STACGenerator onGenerate={handleGenerateItems} />
            <div style={{ marginTop: '30px' }}>
              <Catalog items={items} onSelectItem={handleSelectItem} />
            </div>
          </div>
        )}

        {viewMode === 'detail' && selectedItem && (
          <div className="fade-in">
            <STACViewer
              item={selectedItem}
              onBack={handleBackToCatalog}
              onAnalyze={handleAnalyze}
            />
          </div>
        )}

        {viewMode === 'analyze' && analyzeItem && (
          <div className="fade-in">
            <DataAnalyzer
              item={analyzeItem}
              onBack={handleBackFromAnalyze}
            />
          </div>
        )}
      </main>

      <footer style={{
        marginTop: '60px',
        paddingtop: '30px',
        borderTop: '1px solid #ddd',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '0.9rem'
      }}>
        <p>© 2026 BEV STAC Implementation Service Project</p>
      </footer>
    </div>
  )
}

export default App
