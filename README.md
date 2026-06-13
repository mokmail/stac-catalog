# Spatio Temporal Assets Catalog Viewer

A modern React frontend for exploring Spatio Temporal Assets Catalog (STAC) items. It can generate synthetic Austrian samples, import real Austrian INSPIRE Land Cover datasets from the BEV catalog, preview footprints on a map, and overlay the actual GeoTIFF/COG raster via a TiTiler tile service.

## Quick start (local development)

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Full stack with Docker (frontend + backend + TiTiler)

The repository includes a root `docker-compose.yml` that builds and starts everything:

- `frontend` — Nginx serving the built React app on http://localhost:80
- `backend` — Node/Express API proxy on http://localhost:3000
- `titiler` — Dynamic COG tile server on http://localhost:8000

Run the full stack:

```bash
docker compose up --build
```

Wait for all services to become healthy, then open http://localhost.

Traffic flow in Docker:

```
Browser ──▶ frontend:80
            ├── /titiler/*  ──▶ backend:3000/titiler/* ──▶ titiler:8000
            └── /api/bev/*  ──▶ backend:3000/api/bev/* ──▶ data.bev.gv.at
```

This avoids CORS issues and keeps all external API calls on the server side.

## Development with the local tile server

If you prefer to run only TiTiler and the Vite dev server:

```bash
cd titiler
docker compose up --build
```

Then in another terminal:

```bash
npm run dev:local-titiler
```

This proxies `/titiler/*` to `http://localhost:8000`. BEV catalog requests still go through `/api/bev/*`, which Vite proxies directly to `data.bev.gv.at`.

## Features

- Generate synthetic STAC samples located in Austria with real location names from reverse geocoding.
- Import real BEV/INSPIRE Land Cover dataset metadata.
- View item details, metadata JSON, assets, and downloadable links.
- Interactive map with polygon footprints, a categorical land-cover legend, and TiTiler raster overlays.
- Download items as STAC JSON or GeoJSON.

## Production build

```bash
npm run build
npm run preview
```

## Notes

- The public `https://titiler.xyz` demo endpoint is used only as a fallback during development when the local TiTiler is not running.
- For production, host your own TiTiler instance and adjust the tile URL templates if needed.
