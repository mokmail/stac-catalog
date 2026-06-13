import React, { useState, useEffect } from 'react'
import { fetchBevCatalogDatasets, normalizeBevRecord } from '../utils/bevCatalog'

const BevImporter = ({ onImport }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(null)
  const [records, setRecords] = useState([])

  const loadRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBevCatalogDatasets({ size: 50 })
      const normalized = data.hits.hits.map(normalizeBevRecord)
      setTotal(data.hits.total.value)
      setRecords(normalized)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!records.length) return
    onImport(records)
  }

  return (
    <div className="panel mb-4">
      <div className="panel-body">
        <h2 className="section-title">Import BEV / INSPIRE Land Cover Datasets</h2>
        <p className="generator-help" style={{ marginBottom: '16px' }}>
          Load real Land Cover (LC) dataset metadata from the Austrian Federal Office of Metrology and Surveying (BEV / INSPIRE catalog) directly into the STAC viewer.
        </p>

        <div className="generator">
          <button
            onClick={loadRecords}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner" />}
            {loading ? 'Loading…' : 'Load BEV Datasets'}
          </button>

          {records.length > 0 && (
            <button
              onClick={handleImport}
              className="btn btn-success"
              disabled={loading}
            >
              Import {records.length} Dataset{records.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {error && (
          <div className="panel" style={{ marginTop: '16px', borderLeft: '4px solid var(--color-danger)' }}>
            <div className="panel-body" style={{ color: 'var(--color-danger)' }}>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {total !== null && !error && (
          <p className="generator-help" style={{ marginTop: '16px', marginBottom: 0 }}>
            Found <strong>{total}</strong> matching records in the catalog. Preview loaded <strong>{records.length}</strong>.
          </p>
        )}
      </div>
    </div>
  )
}

export default BevImporter
