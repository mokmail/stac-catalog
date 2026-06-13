import React, { useState } from 'react'
import Catalog from './components/Catalog'
import STACViewer from './components/STACViewer'
import STACGenerator from './components/STACGenerator'
import BevImporter from './components/BevImporter'
import HeroHeader from './components/HeroHeader'
import { fetchLocationName } from './utils/reverseGeocode'

function App() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const handleGenerateItems = async (count) => {
    const assetTypes = ['imagery', 'dem', 'vector', 'labels', 'analytics']

    // Austria bounding box roughly:
    // longitude 9.5 to 17.2 E, latitude 46.4 to 49.0 N
    const austriaBounds = {
      minLng: 9.5,
      maxLng: 17.2,
      minLat: 46.4,
      maxLat: 49.0
    }

    const generatedItems = []

    for (let i = 0; i < count; i++) {
      const lat = austriaBounds.minLat + Math.random() * (austriaBounds.maxLat - austriaBounds.minLat)
      const lng = austriaBounds.minLng + Math.random() * (austriaBounds.maxLng - austriaBounds.minLng)
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]

      const locationName = await fetchLocationName(lat, lng)
      const displayLocation = locationName || 'Austria'

      generatedItems.push({
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
          title: `${displayLocation} ${assetType.charAt(0).toUpperCase() + assetType.slice(1)} Sample`,
          description: `Generated STAC item with ${assetType} data near ${displayLocation}, Austria`,
          locationName: displayLocation,
          license: 'CC-BY-4.0',
          creators: ['Test Creator']
        },
        assets: {
          data: {
            href: `https://example.com/assets/${i + 1}/data${assetType}.tif`,
            title: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} data for ${displayLocation}`,
            type: 'image/tiff',
            description: `GeoTIFF ${assetType} data captured near ${displayLocation}`
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

    setItems(generatedItems)
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleBackToCatalog = () => {
    setSelectedItem(null)
    setViewMode('list')
  }

  const handleImportBev = (bevRecords) => {
    setItems(bevRecords)
  }

  return (
    <div className="app">
      <HeroHeader />

      <main className="app-main">
        {viewMode === 'list' && (
          <>
            <BevImporter onImport={handleImportBev} />
            <STACGenerator onGenerate={handleGenerateItems} />
            <Catalog items={items} onSelectItem={handleSelectItem} />
          </>
        )}

        {viewMode === 'detail' && selectedItem && (
          <STACViewer
            item={selectedItem}
            onBack={handleBackToCatalog}
          />
        )}
      </main>
    </div>
  )
}

export default App
