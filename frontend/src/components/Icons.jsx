// ═══════════════════════════════════════════════════════
//  UniLiga — Premium SVG Icon Library
//  Barcha oddiy emoji/icon → animatsiyali premium SVG
// ═══════════════════════════════════════════════════════

const BASE = { display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }

// ── Animatsiya keyframe-lari (bir marta inject qilinadi) ──
const KEYFRAMES = `
  @keyframes icon-pulse   { 0%,100%{opacity:.6;transform:scale(.95)} 50%{opacity:1;transform:scale(1)} }
  @keyframes icon-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes icon-blink   { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes icon-bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes icon-glow-r  { 0%,100%{filter:drop-shadow(0 0 3px #ef4444)} 50%{filter:drop-shadow(0 0 8px #ef4444)} }
  @keyframes icon-glow-g  { 0%,100%{filter:drop-shadow(0 0 3px #22c55e)} 50%{filter:drop-shadow(0 0 8px #22c55e)} }
  @keyframes icon-glow-b  { 0%,100%{filter:drop-shadow(0 0 3px #3b82f6)} 50%{filter:drop-shadow(0 0 8px #3b82f6)} }
  @keyframes icon-glow-y  { 0%,100%{filter:drop-shadow(0 0 3px #f59e0b)} 50%{filter:drop-shadow(0 0 8px #f59e0b)} }
  @keyframes radar-wave   { 0%{opacity:.9;transform:scale(.85)} 50%{opacity:.4;transform:scale(1)} 100%{opacity:.1;transform:scale(1.15)} }
  @keyframes goal-pop     { 0%{transform:scale(1)} 30%{transform:scale(1.3) rotate(-8deg)} 60%{transform:scale(.95) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes flag-wave    { 0%,100%{transform:skewX(0)} 50%{transform:skewX(-4deg)} }
  @keyframes location-bob { 0%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-3px) scale(1.08)} }
  @keyframes card-flash   { 0%,100%{opacity:1} 40%{opacity:.3} }
  @keyframes sub-slide    { 0%{transform:translateX(-4px)} 100%{transform:translateX(4px)} }
  @keyframes trophy-shine { 0%,100%{filter:drop-shadow(0 0 4px #f59e0b)} 50%{filter:drop-shadow(0 0 14px #f59e0b) drop-shadow(0 0 28px rgba(245,158,11,.5))} }
  @keyframes news-scan    { 0%{transform:translateY(0)} 100%{transform:translateY(6px)} }
  @keyframes live-ring    { 0%{r:4;opacity:.8} 100%{r:10;opacity:0} }
`

let _injected = false
function injectKeyframes() {
  if (_injected || typeof document === 'undefined') return
  _injected = true
  const s = document.createElement('style')
  s.textContent = KEYFRAMES
  document.head.appendChild(s)
}

// ──────────────────────────────────────────────────────
// 1. RADAR / LIVE SIGNAL  (📡 o'rniga)
// ──────────────────────────────────────────────────────
export function IconRadar({ size = 22, color = '#3b82f6' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2.2" fill={color} style={{ animation:'icon-glow-b 1.8s ease-in-out infinite' }}/>
        <g style={{ animation:'radar-wave 2s ease-in-out infinite', transformOrigin:'12px 12px', animationDelay:'0s' }}>
          <path d="M16.2 7.8C18.5 10.1 18.5 13.9 16.2 16.2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7.8 16.2C5.5 13.9 5.5 10.1 7.8 7.8"   stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
        <g style={{ animation:'radar-wave 2s ease-in-out infinite', transformOrigin:'12px 12px', animationDelay:'.55s', opacity:.6 }}>
          <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"    stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 2. FOOTBALL  (⚽ o'rniga)
// ──────────────────────────────────────────────────────
export function IconBall({ size = 18, animate = false }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        style={animate ? { animation:'goal-pop .6s ease forwards' } : undefined}>
        <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="1.5" fill="#1f2937"/>
        <path d="M12 2c0 0-3 4-3 10s3 10 3 10" stroke="#9ca3af" strokeWidth="1"/>
        <path d="M2 12h20" stroke="#9ca3af" strokeWidth="1"/>
        <path d="M4 7l4 2M20 7l-4 2M4 17l4-2M20 17l-4-2" stroke="#6b7280" strokeWidth="1"/>
        <polygon points="12,5 9.5,8 11,11 13,11 14.5,8" fill="rgba(255,255,255,.12)" stroke="#6b7280" strokeWidth=".8"/>
        <polygon points="5,9.5 8,9.5 9.5,7" fill="rgba(255,255,255,.08)" stroke="#6b7280" strokeWidth=".8"/>
        <polygon points="19,9.5 16,9.5 14.5,7" fill="rgba(255,255,255,.08)" stroke="#6b7280" strokeWidth=".8"/>
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 3. CALENDAR  (📅 o'rniga)
// ──────────────────────────────────────────────────────
export function IconCalendar({ size = 14, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke={color} strokeWidth="1.3"/>
        <path d="M5 1.5v2M11 1.5v2" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M1.5 6.5h13" stroke={color} strokeWidth="1.3"/>
        <rect x="4" y="9" width="2" height="2" rx=".5" fill={color} opacity=".7"/>
        <rect x="7" y="9" width="2" height="2" rx=".5" fill={color} opacity=".5"/>
        <rect x="10" y="9" width="2" height="2" rx=".5" fill={color} opacity=".4"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 4. LOCATION PIN  (📍 o'rniga)
// ──────────────────────────────────────────────────────
export function IconPin({ size = 14, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'location-bob 2.5s ease-in-out infinite' }}>
        <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.5-2-4.5-4.5-4.5z"
          stroke={color} strokeWidth="1.3" fill={color} fillOpacity=".15"/>
        <circle cx="8" cy="6" r="1.5" fill={color}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 5. CLOCK  (🕐 o'rniga)
// ──────────────────────────────────────────────────────
export function IconClock({ size = 14, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3"/>
        <path d="M8 4.5V8l2.5 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation:'icon-spin 8s linear infinite', transformOrigin:'8px 8px' }}/>
        <circle cx="8" cy="8" r=".8" fill={color}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 6. ARROW LEFT  (← o'rniga)
// ──────────────────────────────────────────────────────
export function IconArrowLeft({ size = 16, color = 'currentColor' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 7. GOAL / NET  (⚽ gol hodisasi uchun)
// ──────────────────────────────────────────────────────
export function IconGoal({ size = 16, color = '#4ade80' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'icon-glow-g 2s ease-in-out infinite' }}>
        <rect x="1" y="3" width="14" height="10" rx="1" stroke={color} strokeWidth="1.3" fill="none"/>
        <path d="M1 5h14M1 8h14M1 11h14M4 3v10M8 3v10M12 3v10" stroke={color} strokeWidth=".7" opacity=".4"/>
        <circle cx="8" cy="8" r="2" fill={color} fillOpacity=".25"/>
        <path d="M5.5 8l1.5 1.5L11 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 8. YELLOW CARD  (🟨 o'rniga)
// ──────────────────────────────────────────────────────
export function IconYellowCard({ size = 16 }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'card-flash 2.5s ease-in-out infinite' }}>
        <rect x="4" y="2" width="8" height="12" rx="1.5"
          fill="#f59e0b" stroke="rgba(245,158,11,.4)" strokeWidth="1"
          style={{ filter:'drop-shadow(0 0 5px rgba(245,158,11,.6))' }}/>
        <rect x="5.5" y="3.5" width="5" height="9" rx=".8" fill="rgba(255,255,255,.12)"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 9. RED CARD  (🟥 o'rniga)
// ──────────────────────────────────────────────────────
export function IconRedCard({ size = 16 }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'icon-glow-r 1.8s ease-in-out infinite' }}>
        <rect x="4" y="2" width="8" height="12" rx="1.5"
          fill="#ef4444" stroke="rgba(239,68,68,.4)" strokeWidth="1"
          style={{ filter:'drop-shadow(0 0 6px rgba(239,68,68,.7))' }}/>
        <rect x="5.5" y="3.5" width="5" height="9" rx=".8" fill="rgba(255,255,255,.15)"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 10. SUBSTITUTION  (🔄 o'rniga)
// ──────────────────────────────────────────────────────
export function IconSub({ size = 16, color = '#60a5fa' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M2 5h9M8 2l3 3-3 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation:'icon-glow-g 2s ease-in-out infinite' }}/>
        <path d="M14 11H5M8 14l-3-3 3-3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation:'icon-glow-r 2s ease-in-out infinite', animationDelay:'.4s' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 11. ASSIST  (🎯 o'rniga)
// ──────────────────────────────────────────────────────
export function IconAssist({ size = 16, color = '#a78bfa' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'icon-glow-b 2s ease-in-out infinite' }}>
        <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.3" strokeDasharray="3 2"/>
        <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1.3"/>
        <circle cx="8" cy="8" r="1.2" fill={color}
          style={{ animation:'icon-pulse 1.5s ease-in-out infinite' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 12. TROPHY  (🏆 o'rniga)
// ──────────────────────────────────────────────────────
export function IconTrophy({ size = 20, color = '#f59e0b' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
        style={{ animation:'trophy-shine 2.5s ease-in-out infinite' }}>
        <path d="M6 2h8v7a4 4 0 01-8 0V2z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity=".15"/>
        <path d="M6 5H3a2 2 0 002 2H6M14 5h3a2 2 0 01-2 2h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 13v3M7 18h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 9.5V11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 13. LIVE DOT  (● jonli indikator)
// ──────────────────────────────────────────────────────
export function IconLiveDot({ size = 10, color = '#ef4444' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size, position:'relative' }}>
      <svg width={size} height={size} viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="4" fill={color} fillOpacity=".2"
          style={{ animation:'icon-pulse 1.5s ease-in-out infinite' }}/>
        <circle cx="5" cy="5" r="2.5" fill={color}
          style={{ animation:'icon-blink 1.2s ease-in-out infinite' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 14. STATS / ZAP  (⚡ o'rniga)
// ──────────────────────────────────────────────────────
export function IconZap({ size = 14, color = '#f59e0b' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'icon-glow-y 2s ease-in-out infinite' }}>
        <path d="M9.5 2L4 9h5.5L6.5 14l7.5-8H8.5L9.5 2z"
          stroke={color} strokeWidth="1.3" strokeLinejoin="round"
          fill={color} fillOpacity=".2"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 15. USERS / TEAM  (👥 o'rniga)
// ──────────────────────────────────────────────────────
export function IconUsers({ size = 14, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="5" r="2.5" stroke={color} strokeWidth="1.3"/>
        <path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="11.5" cy="5.5" r="2" stroke={color} strokeWidth="1.2" opacity=".7"/>
        <path d="M14.5 14c0-2-1.5-3.5-3-3.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity=".7"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 16. STADIUM / HOME  (🏟️ o'rniga)
// ──────────────────────────────────────────────────────
export function IconStadium({ size = 18, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <ellipse cx="9" cy="9" rx="7.5" ry="5" stroke={color} strokeWidth="1.3"/>
        <ellipse cx="9" cy="9" rx="4.5" ry="3" stroke={color} strokeWidth="1.3" opacity=".5"/>
        <rect x="7" y="6.5" width="4" height="5" rx=".5" stroke={color} strokeWidth="1.2" opacity=".8"/>
        <path d="M1.5 9v4M16.5 9v4M1.5 13c0 1.5 3 2.5 7.5 2.5S16.5 14.5 16.5 13"
          stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 17. NEWS / ARTICLE  (📰 o'rniga)
// ──────────────────────────────────────────────────────
export function IconNews({ size = 16, color = 'var(--tx3)' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke={color} strokeWidth="1.3"/>
        <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke={color} strokeWidth="1.2" strokeLinecap="round"
          style={{ animation:'news-scan 1.5s ease-in-out infinite alternate' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 18. TRANSFER ARROWS  (↔ o'rniga)
// ──────────────────────────────────────────────────────
export function IconTransfer({ size = 16 }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M2 5.5h10M9 2.5l3 3-3 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation:'icon-glow-g 2s ease-in-out infinite' }}/>
        <path d="M14 10.5H4M7 7.5l-3 3 3 3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation:'icon-glow-r 2s ease-in-out infinite', animationDelay:'.3s' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 19. AWARD / MEDAL  (🏅 o'rniga)
// ──────────────────────────────────────────────────────
export function IconAward({ size = 16, color = '#f59e0b' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        style={{ animation:'icon-glow-y 2.5s ease-in-out infinite' }}>
        <circle cx="8" cy="9" r="5" stroke={color} strokeWidth="1.3" fill={color} fillOpacity=".1"/>
        <path d="M5.5 2.5l1 2.5h3l1-2.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 6.5v2.5M6.5 9.5l1.5.8 1.5-.8" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 20. CHEVRON RIGHT  (→ o'rniga)
// ──────────────────────────────────────────────────────
export function IconChevronRight({ size = 14, color = 'currentColor' }) {
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
        <path d="M5 3l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 21. SEASON / CALENDAR WITH STAR
// ──────────────────────────────────────────────────────
export function IconSeason({ size = 16, color = '#f59e0b' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke={color} strokeWidth="1.3" opacity=".7"/>
        <path d="M5 1.5v2M11 1.5v2M1.5 6.5h13" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M8 8.5l.8 1.7 1.7.2-1.25 1.2.3 1.7L8 12.4l-1.55.9.3-1.7-1.25-1.2 1.7-.2z"
          fill={color} stroke={color} strokeWidth=".5" strokeLinejoin="round"
          style={{ animation:'icon-glow-y 2s ease-in-out infinite' }}/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 22. SCORE DASH  (– o'rniga, score orasida)
// ──────────────────────────────────────────────────────
export function IconScoreDash({ color = 'var(--tx4)' }) {
  return (
    <span style={{ ...BASE, width: 20, height: 20 }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 10h10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 23. EMPTY STATE BALL  (bo'sh holat uchun katta)
// ──────────────────────────────────────────────────────
export function IconEmptyBall({ size = 56 }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none"
        style={{ animation:'icon-bounce 2.5s ease-in-out infinite' }}>
        <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,.1)" strokeWidth="2" fill="rgba(255,255,255,.04)"/>
        <circle cx="28" cy="28" r="18" stroke="rgba(255,255,255,.08)" strokeWidth="1.5"/>
        <polygon points="28,13 22,21 26,28 30,28 34,21" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
        <polygon points="13,22 20,22 22,18" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
        <polygon points="43,22 36,22 34,18" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
        <path d="M28 13c0 0-7 9-7 15s7 15 7 15" stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
        <path d="M4 28h48" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
      </svg>
    </span>
  )
}

// ──────────────────────────────────────────────────────
// 24. LIVE PULSE RING  (jonli o'yin uchun katta)
// ──────────────────────────────────────────────────────
export function IconLivePulse({ size = 64, color = '#ef4444' }) {
  injectKeyframes()
  return (
    <span style={{ ...BASE, width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="1" opacity=".15"
          style={{ animation:'icon-pulse 2s ease-in-out infinite' }}/>
        <circle cx="32" cy="32" r="20" stroke={color} strokeWidth="1.5" opacity=".25"
          style={{ animation:'icon-pulse 2s ease-in-out infinite', animationDelay:'.4s' }}/>
        <circle cx="32" cy="32" r="12" stroke={color} strokeWidth="2" opacity=".4"
          style={{ animation:'icon-pulse 2s ease-in-out infinite', animationDelay:'.8s' }}/>
        <circle cx="32" cy="32" r="5" fill={color}
          style={{ animation:'icon-glow-r 1.5s ease-in-out infinite' }}/>
      </svg>
    </span>
  )
}

export default {
  IconRadar, IconBall, IconCalendar, IconPin, IconClock,
  IconArrowLeft, IconGoal, IconYellowCard, IconRedCard,
  IconSub, IconAssist, IconTrophy, IconLiveDot, IconZap,
  IconUsers, IconStadium, IconNews, IconTransfer, IconAward,
  IconChevronRight, IconSeason, IconScoreDash, IconEmptyBall, IconLivePulse,
}