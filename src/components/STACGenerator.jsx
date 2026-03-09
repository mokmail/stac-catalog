import React, { useState, useRef } from 'react'
import api from '../services/api'

const STACGenerator = ({ onGenerate }) => {
  const [urlInput, setUrlInput] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)
  const fileInputRef = useRef(null)

  const handleLoadBEV = () => {
    const sampleDatasets = [
      {
        id: 'naip-sample',
        title: 'NAIP Aerial Imagery Sample',
        description: 'USDA NAIP aerial imagery sample',
        href: 'https://elevation-tiles-prod.s3.amazonaws.com/skadi/N46/N46E007.hgt.gz',
        type: 'image/tiff',
        bounds: [[-125, 25], [-65, 25], [-65, 50], [-125, 50], [-125, 25]]
      },
      {
        id: 'srtm-sample',
        title: 'SRTM Elevation Sample',
        description: 'SRTM elevation data sample',
        href: 'https://elevation-tiles-prod.s3.amazonaws.com/skadi/N45/N45E006.hgt.gz',
        type: 'image/tiff',
        bounds: [[6, 45], [7, 45], [7, 46], [6, 46], [6, 45]]
      }
    ]
    
    onGenerate(sampleDatasets.map(ds => ({
      type: 'Feature',
      stac_version: '1.0.0',
      id: ds.id,
      collection: 'Sample_Data',
      geometry: {
        type: 'Polygon',
        coordinates: [ds.bounds]
      },
      properties: {
        datetime: '2024-01-01T00:00:00Z',
        title: ds.title,
        description: ds.description,
        license: 'CC-BY-4.0',
        creators: ['Sample Data Provider']
      },
      assets: {
        data: {
          href: ds.href,
          title: ds.title,
          type: ds.type
        }
      },
      links: [
        {
          rel: 'source',
          href: ds.href,
          title: 'Source Data'
        }
      ]
    })))
  }

  const handleLoadFromUrl = async () => {
    if (!urlInput.trim()) return
    
    const input = urlInput.trim()
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
    
    if (input.toLowerCase() === 'bev') {
      handleLoadBEV()
      setUrlInput('')
      return
    }
    
    if (isUUID) {
      setLoadingUrl(true)
      try {
        const data = await api.getBEVMetadata(input)
        
        if (data.error) {
          alert(data.error)
          setLoadingUrl(false)
          return
        }
        
        // Create STAC item with all available data variants
        const bounds = data.bounds || { west: 9.53, east: 17.17, south: 46.37, north: 49.02 }
        
        const item = {
          type: 'Feature',
          stac_version: '1.0.0',
          id: input,
          collection: 'BEV_Data_Catalog',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [bounds.west, bounds.south],
              [bounds.east, bounds.south],
              [bounds.east, bounds.north],
              [bounds.west, bounds.north],
              [bounds.west, bounds.south]
            ]]
          },
          properties: {
            datetime: data.date || '2024-01-01T00:00:00Z',
            title: data.title || 'BEV Dataset',
            description: data.abstract || data.description || 'BEV Data from CSW',
            license: 'CC-BY-4.0',
            creators: ['Bundesamt für Eich- und Vermessungswesen (BEV)'],
            'bev:type': data.type || 'unknown',
            'bev:crs': data.crs || [],
            'bev:layers': data.layers || []
          },
          assets: {},
          links: [
            {
              rel: 'source',
              href: `https://data.bev.gv.at/geonetwork/srv/eng/csw?service=CSW&request=GetRecordById&id=${input}`,
              title: 'BEV Metadata'
            }
          ]
        }
        
        // Add WMS asset if available
        if (data.wms_url) {
          item.assets.wms = {
            href: data.wms_url,
            title: 'WMS Service',
            type: 'image/png',
            roles: ['visual']
          }
        }
        
        // Add WFS asset if available
        if (data.wfs_url) {
          item.assets.wfs = {
            href: data.wfs_url,
            title: 'WFS Service',
            type: 'application/json',
            roles: ['data']
          }
        }
        
        // Add download URLs as assets
        if (data.download_urls && data.download_urls.length > 0) {
          data.download_urls.forEach((dl, idx) => {
            const isTiff = dl.url?.toLowerCase().includes('.tif')
            item.assets[`download_${idx}`] = {
              href: dl.url,
              title: dl.name || `Download ${idx + 1}`,
              type: isTiff ? 'image/tiff' : 'application/octet-stream',
              roles: ['data']
            }
          })
        }
        
        // Add COG as primary data asset if we have a direct download URL
        const cogUrl = data.download_urls?.find(d => 
          d.url?.toLowerCase().includes('.tif') || 
          d.url?.toLowerCase().includes('.tiff') ||
          d.url?.toLowerCase().includes('cog')
        )
        
        if (cogUrl) {
          item.assets.data = {
            href: cogUrl.url,
            title: 'COG/Raster Data',
            type: 'image/tiff; profile=cloud-optimized',
            roles: ['data']
          }
        } else if (data.wms_url) {
          // Use WMS as primary if no direct download
          item.assets.data = {
            href: data.wms_url,
            title: 'WMS Visualization',
            type: 'image/png',
            roles: ['visual']
          }
        }
        
        onGenerate([item])
        setUrlInput('')
        
      } catch (err) {
        alert('Failed to fetch BEV metadata: ' + err.message)
      } finally {
        setLoadingUrl(false)
      }
      return
    }
    
    await loadUrlAsItem(input)
  }

  const loadUrlAsItem = async (url) => {
    const filename = url.split('/').pop() || 'data'
    const isTiff = url.match(/\.(tif|tiff)$/i)
    const isLandCover = url.toLowerCase().includes('lc') || url.toLowerCase().includes('landcover')
    
    setLoadingUrl(true)
    
    let bounds = null
    let actualTitle = filename
    
    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      
      if (response.ok) {
        const metadata = await response.json()
        if (!metadata.error && metadata.bounds_wgs84) {
          const b = metadata.bounds_wgs84
          bounds = [
            [b.west, b.south],
            [b.east, b.south],
            [b.east, b.north],
            [b.west, b.north],
            [b.west, b.south]
          ]
          if (metadata.width && metadata.height) {
            actualTitle = `${filename} (${metadata.width}x${metadata.height})`
          }
        }
      }
    } catch (e) {
      console.log('Could not fetch metadata:', e.message)
    }
    
    if (!bounds) {
      bounds = [
        [9.53, 46.37],
        [17.17, 46.37],
        [17.17, 49.02],
        [9.53, 49.02],
        [9.53, 46.37]
      ]
    }
    
    const item = {
      type: 'Feature',
      stac_version: '1.0.0',
      id: filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-'),
      collection: isLandCover ? 'land-cover' : 'raster',
      geometry: {
        type: 'Polygon',
        coordinates: [bounds]
      },
      properties: {
        datetime: '2024-01-01T00:00:00Z',
        title: actualTitle,
        description: isLandCover ? 'Land Cover Classification Data' : 'Raster Data',
        license: 'CC-BY-4.0',
        creators: ['BEV']
      },
      assets: {
        data: {
          href: url,
          title: actualTitle,
          type: isTiff ? 'image/tiff' : 'application/octet-stream'
        }
      },
      links: [
        {
          rel: 'source',
          href: url,
          title: 'Source Data'
        }
      ]
    }
    
    if (isLandCover) {
      item.properties["bev:type"] = 'land-cover'
    }
    
    onGenerate([item])
    setUrlInput('')
    setLoadingUrl(false)
  }

  return (
    <div style={{
      background: '#fff',
      padding: '30px',
      borderRadius: '16px',
      marginBottom: '30px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid #eef2f6'
    }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a252f', margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Load STAC Data</h2>
        <span style={{ fontSize: '0.8rem', color: '#95a5a6', fontWeight: '500' }}>v1.0.0</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter BEV UUID (e.g., 4ea1af9a-...) or URL..."
            style={{
              padding: '12px 16px',
              border: '1px solid #e1e8ed',
              borderRadius: '10px',
              flex: 1,
              fontSize: '0.9rem',
              outline: 'none'
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadFromUrl()}
          />
          <button
            onClick={handleLoadFromUrl}
            disabled={loadingUrl || !urlInput.trim()}
            style={{
              padding: '12px 24px',
              background: loadingUrl ? '#95a5a6' : 'linear-gradient(135deg, #3498db, #2980b9)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: loadingUrl ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            {loadingUrl ? 'Loading...' : 'Load'}
          </button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(142, 68, 173, 0.2)'
          }}
        >
          Load JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            
            try {
              const text = await file.text()
              const data = JSON.parse(text)
              
              let items = []
              if (Array.isArray(data)) {
                items = data
              } else if (data.type === 'Feature') {
                items = [data]
              } else if (data.type === 'FeatureCollection') {
                items = data.features || []
              } else if (data.links) {
                alert('Catalog file loaded. Note: Nested catalogs require fetching individual items.')
              }
              
              if (items.length > 0) {
                onGenerate(items)
                alert(`Loaded ${items.length} items from catalog`)
              }
            } catch (err) {
              alert('Failed to parse JSON: ' + err.message)
            }
            
            e.target.value = ''
          }}
        />
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px 18px',
        background: '#f8f9fa',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
          <strong>Enter a BEV UUID</strong> to fetch metadata and view WMS/COG variants. 
          Example UUID: <code style={{ background: '#e8e8e8', padding: '2px 6px', borderRadius: '4px' }}>4ea1af9a-d2f3-4019-a1b9-bdd5c3def221</code>
        </p>
      </div>
    </div>
  )
}

export default STACGenerator
