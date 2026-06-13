import React from 'react'

function HeroHeader() {
  return (
    <header className="app-header">
      <div className="app-header-bg" aria-hidden="true">
        <div className="stars" />
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
      </div>

      <div className="app-header-inner">
        <div className="app-header-content">
          <div className="app-header-badge">
            <span className="app-header-dot" />
            Spatio Temporal Assets Catalog
          </div>
          <h1>Explore Earth Observation Data</h1>
          <p>
            Generate, import, and visualize geospatial STAC datasets with interactive maps and real-world Austrian INSPIRE metadata.
          </p>

          <div className="app-header-stats">
            <div className="stat-item">
              <span className="stat-value">STAC 1.0</span>
              <span className="stat-label">Standard Compliant</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">COG</span>
              <span className="stat-label">Cloud Optimized</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">TiTiler</span>
              <span className="stat-label">Dynamic Tiles</span>
            </div>
          </div>
        </div>

        <div className="app-header-visual">
          <svg className="geo-illustration" viewBox="0 0 520 360" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="earthGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <g className="bg-grid" stroke="#334155" strokeWidth="0.4" strokeOpacity="0.15" fill="none">
              <line x1="40" y1="40" x2="480" y2="40" />
              <line x1="40" y1="100" x2="480" y2="100" />
              <line x1="40" y1="160" x2="480" y2="160" />
              <line x1="40" y1="220" x2="480" y2="220" />
              <line x1="40" y1="280" x2="480" y2="280" />
              <line x1="40" y1="340" x2="480" y2="340" />
              <line x1="40" y1="40" x2="40" y2="340" />
              <line x1="100" y1="40" x2="100" y2="340" />
              <line x1="160" y1="40" x2="160" y2="340" />
              <line x1="220" y1="40" x2="220" y2="340" />
              <line x1="280" y1="40" x2="280" y2="340" />
              <line x1="340" y1="40" x2="340" y2="340" />
              <line x1="400" y1="40" x2="400" y2="340" />
              <line x1="460" y1="40" x2="460" y2="340" />
            </g>

            {/* Earth */}
            <g className="earth-group">
              <circle cx="260" cy="190" r="95" fill="url(#earthGradient)" />
              <circle cx="260" cy="190" r="95" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" />

              {/* Grid lines */}
              <g stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.22" fill="none">
                <ellipse cx="260" cy="190" rx="95" ry="24" />
                <ellipse cx="260" cy="190" rx="95" ry="48" />
                <ellipse cx="260" cy="190" rx="95" ry="70" />
                <line x1="165" y1="190" x2="355" y2="190" />
                <line x1="260" y1="95" x2="260" y2="285" />
                <path d="M200 135 Q260 190 320 135" />
                <path d="M200 245 Q260 190 320 245" />
              </g>

              {/* Austria outline - real coordinates projected to SVG viewBox */}
              <g className="austria-outline" fill="#22d3ee" fillOpacity="0.4" stroke="#67e8f9" strokeWidth="1">
                <path d="M289.2,167.4 L292.8,168.4 L299.6,169.7 L305.1,171.2 L308.4,170.5 L313.9,171.5 L317.5,171.1 L322.7,176.1 L320.9,181.2 L324.3,183.1 L326.5,185.2 L325.4,189.7 L316.6,190.9 L315.6,194.6 L313.5,196.8 L315.6,199.7 L308.5,204.3 L307.1,205.3 L304.1,208.3 L293.3,209.4 L281.8,211.1 L275.3,212.6 L265.9,210.9 L265.0,210.3 L251.7,208.1 L244.3,207.8 L238.3,207.9 L239.3,202.5 L237.5,200.3 L240.7,197.8 L244.1,194.5 L246.5,191.5 L241.5,191.0 L238.4,192.1 L234.5,193.3 L229.3,195.1 L224.9,194.8 L220.6,195.8 L217.0,193.7 L210.6,193.3 L204.5,197.0 L200.1,196.4 L197.3,193.4 L193.5,197.9 L194.8,201.7 L200.2,204.1 L205.6,205.2 L210.2,204.9 L211.3,203.1 L221.5,204.0 L227.1,202.6 L235.8,202.5 L241.8,201.3 L249.7,199.2 L253.7,194.4 L251.8,190.9 L254.8,188.8 L254.2,184.0 L258.3,181.0 L261.5,180.1 L267.8,174.7 L269.4,171.9 L276.5,174.4 L282.8,175.0 L289.2,167.4 Z" />
              </g>

              {/* Vienna marker - 16.37,48.21 */}
              <g className="vienna-marker">
                <circle cx="312.7" cy="181.5" r="4" fill="#f59e0b" filter="url(#glow)" />
                <circle cx="312.7" cy="181.5" r="8" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" className="marker-ring" />
              </g>
            </g>

            {/* Orbit rings */}
            <ellipse cx="260" cy="190" rx="180" ry="55" fill="none" stroke="url(#orbitGradient)" strokeWidth="1.5" strokeDasharray="12 8" className="orbit-ring orbit-1" />
            <ellipse cx="260" cy="190" rx="235" ry="70" fill="none" stroke="#a5b4fc" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="8 12" className="orbit-ring orbit-2" />

            {/* Satellites */}
            <g className="satellite satellite-1">
              <rect x="-6" y="-3" width="12" height="6" rx="1" fill="#e0e7ff" />
              <rect x="-14" y="-2" width="6" height="4" rx="0.5" fill="#818cf8" />
              <rect x="8" y="-2" width="6" height="4" rx="0.5" fill="#818cf8" />
              <line x1="0" y1="0" x2="0" y2="-18" stroke="#94a3b8" strokeWidth="0.6" />
              <circle cx="0" cy="-20" r="2.5" fill="#f59e0b" filter="url(#glow)" />
            </g>

            <g className="satellite satellite-2">
              <rect x="-5" y="-4" width="10" height="8" rx="1" fill="#e0e7ff" />
              <line x1="0" y1="0" x2="0" y2="16" stroke="#94a3b8" strokeWidth="0.6" />
              <circle cx="0" cy="18" r="2" fill="#22c55e" filter="url(#glow)" />
            </g>

            {/* Radar sweep */}
            <path d="M260 190 L260 95 A95 95 0 0 1 327 123 Z" fill="url(#beamGradient)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" className="radar-sweep" />

            {/* Data points */}
            <g className="data-points" fill="#67e8f9">
              <circle cx="90" cy="120" r="2" className="data-point" />
              <circle cx="430" cy="140" r="2" className="data-point" />
              <circle cx="450" cy="250" r="2" className="data-point" />
              <circle cx="80" cy="270" r="2" className="data-point" />
              <circle cx="390" cy="80" r="2" className="data-point" />
            </g>

            {/* Floating data tiles */}
            <g className="data-tiles">
              <rect x="60" y="70" width="40" height="40" rx="8" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
              <rect x="70" y="80" width="20" height="20" rx="4" fill="rgba(99,102,241,0.18)" />

              <rect x="420" y="60" width="46" height="46" rx="10" fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.25)" strokeWidth="1" />
              <rect x="433" y="73" width="20" height="20" rx="4" fill="rgba(14,165,233,0.16)" />

              <rect x="410" y="260" width="44" height="44" rx="8" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
              <rect x="422" y="272" width="20" height="20" rx="4" fill="rgba(34,211,238,0.15)" />
            </g>
          </svg>
        </div>
      </div>
    </header>
  )
}

export default HeroHeader
