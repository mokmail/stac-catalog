import { getEncodedColormap } from './landCoverColormap.js'

const BEV_SEARCH_URL = '/api/bev/geonetwork/srv/api/search/records/_search'

function getLocalized(obj, lang = 'en') {
  if (!obj) return undefined
  if (typeof obj === 'string') return obj
  if (obj.default) return obj.default
  if (obj[`lang${lang}`]) return obj[`lang${lang}`]
  const first = Object.values(obj).find((v) => typeof v === 'string')
  return first
}

export async function fetchBevCatalogDatasets({
  theme = 'http://inspire.ec.europa.eu/theme/lc',
  resourceType = 'dataset',
  from = 0,
  size = 50,
  signal,
  withThumbnails = false
} = {}) {
  const _sourceIncludes = [
    'uuid',
    'resourceTitleObject',
    'resourceAbstractObject',
    'resourceTemporalDateRange',
    'geom',
    'link',
    'crsDetails',
    'licenseObject',
    'contact',
    'resourceIdentifier',
    'dateStamp',
    'owner',
    'groupOwner',
    'overview',
    'INFORMATION_ZUM_PRODUKT'
  ]
  if (withThumbnails) {
    _sourceIncludes.push('overview')
  }

  const query = {
    query: {
      bool: {
        must: [
          { term: { resourceType } },
          { term: { isTemplate: 'n' } },
          { term: { 'th_httpinspireeceuropaeutheme-theme_tree.key': theme } }
        ]
      }
    },
    from,
    size,
    _source: {
      includes: _sourceIncludes
    },
    sort: [{ _score: 'desc' }]
  }

  const response = await fetch(BEV_SEARCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query),
    signal
  })

  if (!response.ok) {
    throw new Error(`BEV catalog search failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function normalizeBevRecord(record) {
  const src = record._source || record
  const title = getLocalized(src.resourceTitleObject) || 'Untitled dataset'
  const description = getLocalized(src.resourceAbstractObject) || ''
  const informationZumProdukt = getLocalized(src.INFORMATION_ZUM_PRODUKT) || ''
  const geom = (src.geom && src.geom[0]) || null

  const bbox = geom ? extractBbox(geom) : null
  const temporal = (src.resourceTemporalDateRange || []).map((range) => range.gte)
  const date = temporal[0] || src.dateStamp || new Date().toISOString()

  const assets = {}
  const links = []
  ;(src.link || []).forEach((link, idx) => {
    const url = getLocalized(link.urlObject)
    const name = getLocalized(link.nameObject) || link.protocol || `Link ${idx + 1}`
    const linkDescription = getLocalized(link.descriptionObject) || ''

    if (!url) return

    const roles = []
    if (link.function === 'download') roles.push('data')
    if (link.function === 'information') roles.push('overview')
    if (link.protocol === 'WWW:LINK-1.0-http--link') roles.push('info')
    if (link.protocol === 'WWW:DOWNLOAD-1.0-http--download') roles.push('download')
    if (link.protocol === 'DOI') roles.push('doi')

    const assetKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `asset_${idx + 1}`

    assets[assetKey] = {
      href: url,
      title: name,
      type: link.mimeType || guessMimeType(url),
      description: linkDescription,
      roles: roles.length ? roles : undefined
    }

    links.push({
      rel: roles.includes('data') || roles.includes('download') ? 'item' : 'related',
      href: url,
      title: name,
      type: link.protocol
    })
  })

  // Attach a TiTiler tile layer URL for any GeoTIFF/COG asset
  const titilerEndpoint = '/titiler'
  const cogAsset = Object.values(assets).find((a) => {
    const lower = (a.href || '').toLowerCase()
    return lower.endsWith('.tif') || lower.endsWith('.tiff') || lower.endsWith('.cog')
  })

  // Extract a thumbnail image from the BEV record if present
  const thumbnailUrl = extractThumbnailUrl(src)

  if (thumbnailUrl) {
    assets.thumbnail = {
      href: thumbnailUrl,
      title: 'Preview thumbnail',
      type: 'image/png',
      description: 'Browse graphic overview image from the BEV catalog.',
      roles: ['thumbnail']
    }
  }

  if (cogAsset) {
    const encodedUrl = encodeURIComponent(cogAsset.href)
    const encodedColormap = getEncodedColormap()
    assets.cog_tiles = {
      href: `${titilerEndpoint}/cog/WebMercatorQuad/tilejson.json?url=${encodedUrl}`,
      title: 'COG tiles (WebMercatorQuad)',
      type: 'application/json',
      description: 'TiTiler-generated XYZ tiles for the GeoTIFF/COG.',
      roles: ['tiles', 'overview'],
      tileUrlTemplate: `${titilerEndpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodedUrl}&colormap=${encodedColormap}`
    }
  }

  const crs = (src.crsDetails || []).map((c) => c.code)
  const license = (src.licenseObject || []).map((l) => getLocalized(l)).join('; ') || 'CC-BY-4.0'
  const providers = (src.contact || []).map((c) => getLocalized(c.organisationObject)).filter(Boolean)

  return {
    type: 'Feature',
    stac_version: '1.0.0',
    id: src.uuid || `bev-${Date.now()}`,
    collection: 'bev-inspire-land-cover',
    geometry: geom || { type: 'Point', coordinates: [13.3333, 47.5167] },
    bbox,
    properties: {
      datetime: date,
      title,
      description,
      informationZumProdukt,
      license,
      providers,
      themes: src.th_httpinspireeceuropaeutheme_tree?.default || ['Land cover'],
      crs,
      keywords: ['BEV', 'Austria', 'INSPIRE', 'Land cover'],
      originalUuid: src.uuid,
      sourceCatalog: 'data.bev.gv.at / INSPIRE'
    },
    assets,
    links: [
      {
        rel: 'self',
        href: `https://data.bev.gv.at/geonetwork/srv/api/records/${src.uuid}`
      },
      {
        rel: 'collection',
        href: 'https://data.bev.gv.at/geonetwork/srv/eng/catalog.search'
      },
      ...links
    ]
  }
}

function extractBbox(geom) {
  if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
    const ring = geom.coordinates[0]
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of ring) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    return [minX, minY, maxX, maxY]
  }
  return null
}

function extractThumbnailUrl(src) {
  const overviews = src.overview
  if (!overviews || !Array.isArray(overviews) || overviews.length === 0) return null

  for (const overview of overviews) {
    if (overview.url) return overview.url
    if (overview.data && typeof overview.data === 'string' && overview.data.startsWith('data:')) {
      return overview.data
    }
  }
  return null
}

function guessMimeType(url) {
  const lower = (url || '').toLowerCase()
  if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'image/tiff; application=geotiff'
  if (lower.endsWith('.cog')) return 'image/tiff; application=geotiff; profile=cloud-optimized'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.zip')) return 'application/zip'
  if (lower.endsWith('.shp') || lower.endsWith('.shp.zip')) return 'application/vnd.shp'
  if (lower.endsWith('.geojson') || lower.endsWith('.json')) return 'application/geo+json'
  if (lower.includes('atom')) return 'application/atom+xml'
  return 'application/octet-stream'
}
