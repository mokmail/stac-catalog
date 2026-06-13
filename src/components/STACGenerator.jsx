import React, { useState } from 'react'

const STACGenerator = ({ onGenerate }) => {
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    await onGenerate(count)
    setGenerating(false)
  }

  return (
    <div className="panel mb-4">
      <div className="panel-body">
        <h2 className="section-title">Generate STAC Items</h2>

        <div className="generator">
          <div className="generator-field">
            <label htmlFor="item-count">Number of items</label>
            <input
              id="item-count"
              type="number"
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max="100"
              className="input"
              style={{ width: '100px' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-success"
          >
            {generating && <span className="spinner" />}
            {generating ? 'Generating…' : 'Generate Sample Items'}
          </button>
        </div>

        <p className="generator-help">
          Generates {count} STAC 1.0.0 compliant items with geo-positioned assets including imagery, DEM, vector, labels, and analytics data.
        </p>
      </div>
    </div>
  )
}

export default STACGenerator
