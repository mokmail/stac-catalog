import React, { useState } from 'react'

const STACGenerator = ({ onGenerate }) => {
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    onGenerate(count)
    setGenerating(false)
  }

  return (
    <div style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>Generate STAC Items</h2>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '10px', color: '#555' }}>Count:</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            min="1"
            max="100"
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '80px'
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '10px 20px',
            background: generating ? '#3498db' : '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {generating ? 'Generating...' : 'Generate Sample Items'}
        </button>
      </div>

      <p style={{ color: '#7f8c8d', marginTop: '10px', fontSize: '14px' }}>
        Generates {count} STAC 1.0.0 compliant items with geo-positioned assets including imagery, DEM, vector, and analytics data
      </p>
    </div>
  )
}

export default STACGenerator
