import React from 'react'

function EmptyCatalogState() {
  return (
    <div className="panel">
      <div className="empty-state empty-state-hero">
        <div className="empty-state-illustration" aria-hidden="true">
          <svg viewBox="0 0 520 320" className="empty-state-svg">
            <defs>
              <radialGradient id="emptyEarth" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="emptyBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              <filter id="emptyGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Earth */}
            <g className="empty-earth">
              <circle cx="260" cy="180" r="85" fill="url(#emptyEarth)" />
              <circle cx="260" cy="180" r="85" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" />

              {/* Grid lines */}
              <g stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.15" fill="none">
                <ellipse cx="260" cy="180" rx="85" ry="20" />
                <ellipse cx="260" cy="180" rx="85" ry="42" />
                <ellipse cx="260" cy="180" rx="85" ry="62" />
                <line x1="175" y1="180" x2="345" y2="180" />
                <line x1="260" y1="95" x2="260" y2="265" />
              </g>

              {/* Austria outline - stylized but recognizable */}
              <g className="empty-austria" fill="#22d3ee" fillOpacity="0.45" stroke="#67e8f9" strokeWidth="1">
                <path d="M230 158 L238 153 L245 156 L255 150 L265 155 L272 152 L282 160 L290 170 L295 185 L290 200 L280 210 L268 218 L255 225 L245 230 L235 235 L225 230 L220 218 L225 205 L232 195 L238 185 L235 175 L230 168 Z" />
              </g>
            </g>

            {/* Orbiting satellites */}
            <g className="empty-satellite" transform="translate(260,180)">
              <rect x="-5" y="-3" width="10" height="6" rx="1" fill="#e0e7ff" />
              <rect x="-12" y="-2" width="5" height="4" rx="0.5" fill="#818cf8" />
              <rect x="7" y="-2" width="5" height="4" rx="0.5" fill="#818cf8" />
              <line x1="0" y1="0" x2="0" y2="-14" stroke="#94a3b8" strokeWidth="0.6" />
              <circle cx="0" cy="-16" r="2" fill="#f59e0b" filter="url(#emptyGlow)" />
            </g>

            {/* Scanning beam */}
            <path d="M260 180 L260 95 A85 85 0 0 1 330 133 Z" fill="url(#emptyBeam)" className="empty-beam" transform="translate(260,180) translate(-260,-180)" />

            {/* Floating data tiles */}
            <g className="empty-tiles">
              <rect x="80" y="90" width="42" height="42" rx="8" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.35)" strokeWidth="1" />
              <rect x="90" y="100" width="22" height="22" rx="4" fill="rgba(99,102,241,0.2)" />

              <rect x="400" y="70" width="50" height="50" rx="10" fill="rgba(14,165,233,0.1)" stroke="rgba(14,165,233,0.3)" strokeWidth="1" />
              <rect x="415" y="85" width="20" height="20" rx="4" fill="rgba(14,165,233,0.2)" />

              <rect x="420" y="220" width="44" height="44" rx="8" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
              <rect x="432" y="232" width="20" height="20" rx="4" fill="rgba(34,211,238,0.2)" />

              <rect x="60" y="210" width="48" height="48" rx="10" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.25)" strokeWidth="1" />
              <rect x="74" y="224" width="20" height="20" rx="4" fill="rgba(99,102,241,0.15)" />
            </g>

            {/* Data points around the globe */}
            <g fill="#67e8f9" className="empty-data-points">
              <circle cx="170" cy="140" r="2.5" />
              <circle cx="360" cy="110" r="2" />
              <circle cx="390" cy="260" r="2.5" />
              <circle cx="150" cy="250" r="2" />
              <circle cx="330" cy="285" r="2" />
            </g>

            {/* Connection lines */}
            <g stroke="#67e8f9" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 4" fill="none" className="empty-connections">
              <path d="M170 140 Q215 160 230 165" />
              <path d="M360 110 Q315 140 285 155" />
              <path d="M390 260 Q340 235 295 215" />
              <path d="M150 250 Q195 230 230 215" />
              <path d="M330 285 Q295 255 270 235" />
            </g>
          </svg>
        </div>

        <div className="empty-state-text">
          <h3>The geospatial layer is quiet</h3>
          <p>
            No STAC items are loaded yet. Launch synthetic Austrian samples or import real-world BEV / INSPIRE datasets to bring the map to life.
          </p>
          <div className="empty-state-hint">
            <span className="hint-dot" />
            Try “Generate 5 samples” or “Import BEV Land Cover” above
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyCatalogState
