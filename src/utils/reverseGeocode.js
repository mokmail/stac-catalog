// Lightweight reverse-geocoding helper using OpenStreetMap Nominatim.
// Please respect Nominatim's Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
// We pace requests to stay well under the one-request-per-second guideline.

let lastRequestTime = 0
const MIN_INTERVAL_MS = 1100

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickLocationName(data) {
  if (!data || typeof data !== 'object') return null

  const address = data.address || {}

  const candidates = [
    data.name,
    address.city,
    address.town,
    address.village,
    address.locality,
    address.suburb,
    address.municipality,
    address.county,
    address.district,
    address.state,
    address.country
  ]

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

export async function fetchLocationName(lat, lng) {
  try {
    const now = Date.now()
    const elapsed = now - lastRequestTime
    if (elapsed < MIN_INTERVAL_MS) {
      await sleep(MIN_INTERVAL_MS - elapsed)
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('zoom', '10')
    url.searchParams.set('accept-language', 'en')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    lastRequestTime = Date.now()

    if (!response.ok) {
      console.warn(`Reverse geocoding failed: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()
    return pickLocationName(data)
  } catch (error) {
    console.warn('Reverse geocoding error:', error)
    return null
  }
}
