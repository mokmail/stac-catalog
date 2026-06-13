const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const PORT = process.env.PORT || 3000
const TITILER_URL = process.env.TITILER_URL || 'http://titiler:8000'
const BEV_URL = process.env.BEV_URL || 'https://data.bev.gv.at'

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', titilerUrl: TITILER_URL, bevUrl: BEV_URL })
})

// Proxy requests to the Austrian BEV GeoNetwork catalog.
// Frontend uses /api/bev/* to avoid CORS in production.
app.all('/api/bev/*', async (req, res) => {
  const targetPath = req.path.replace(/^\/api\/bev/, '')
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const targetUrl = `${BEV_URL}${targetPath}${query}`

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Accept: req.headers['accept'] || 'application/json'
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/json'
      if (req.body) {
        fetchOptions.body = JSON.stringify(req.body)
      }
    }

    const response = await fetch(targetUrl, fetchOptions)

    res.status(response.status)
    response.headers.forEach((value, key) => {
      // Skip hop-by-hop headers that confuse Express
      if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) return
      res.setHeader(key, value)
    })

    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('BEV proxy error:', err.message)
    res.status(502).json({ error: 'BEV proxy error', message: err.message })
  }
})

// Proxy requests to TiTiler.
app.use(
  '/titiler',
  createProxyMiddleware({
    target: TITILER_URL,
    changeOrigin: true,
    pathRewrite: { '^/titiler': '' },
    secure: false,
    onError: (err, req, res) => {
      console.error('TiTiler proxy error:', err.message)
      res.status(502).json({ error: 'TiTiler proxy error', message: err.message })
    }
  })
)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`STAC backend listening on port ${PORT}`)
  console.log(`TiTiler proxy -> ${TITILER_URL}`)
  console.log(`BEV proxy      -> ${BEV_URL}`)
})
