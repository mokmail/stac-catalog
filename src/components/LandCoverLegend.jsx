import React from 'react'
import { LAND_COVER_COLORMAP, LAND_COVER_LABELS } from '../utils/landCoverColormap'

const LandCoverLegend = () => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
        border: '1px solid #e2e8f0',
        fontSize: '0.8125rem',
        color: '#0f172a',
        maxWidth: '220px'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
        Land Cover Classes
      </div>
      {Object.entries(LAND_COVER_LABELS).map(([value, label]) => {
        const [r, g, b] = LAND_COVER_COLORMAP[value]
        return (
          <div
            key={value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: `rgb(${r}, ${g}, ${b})`,
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            />
            <span style={{ color: '#475569' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default LandCoverLegend
