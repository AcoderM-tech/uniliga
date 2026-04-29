import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY  = window.scrollY;
      const docH     = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > 300);
      setProgress(docH > 0 ? Math.min(scrollY / docH, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* SVG circle progress */
  const R   = 20;
  const C   = 2 * Math.PI * R;
  const dash = C * progress;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Tepaga qaytish"
      style={{
        position:      'fixed',
        bottom:        28,
        right:         24,
        width:         52,
        height:        52,
        borderRadius:  '50%',
        background:    'var(--bg3, #0e1222)',
        border:        '1px solid rgba(255,255,255,.1)',
        cursor:        'pointer',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        zIndex:        999,
        padding:       0,
        opacity:        visible ? 1 : 0,
        transform:      visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.7)',
        pointerEvents:  visible ? 'auto' : 'none',
        transition:    'opacity .35s, transform .35s cubic-bezier(.34,1.56,.64,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background    = 'rgba(232,34,58,.15)';
        e.currentTarget.style.borderColor   = 'rgba(232,34,58,.5)';
        e.currentTarget.style.transform     = 'translateY(-3px) scale(1.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background    = 'var(--bg3, #0e1222)';
        e.currentTarget.style.borderColor   = 'rgba(255,255,255,.1)';
        e.currentTarget.style.transform     = visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.7)';
      }}
    >
      {/* Progress ring */}
      <svg
        width={52}
        height={52}
        viewBox="0 0 52 52"
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle cx={26} cy={26} r={R} fill="none"
          stroke="rgba(255,255,255,.07)" strokeWidth={2.5} />
        {/* Fill */}
        <circle cx={26} cy={26} r={R} fill="none"
          stroke="#e8223a" strokeWidth={2.5}
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .2s linear' }}
        />
      </svg>

      {/* Arrow icon */}
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke="#f0f2f8" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'relative', zIndex: 1 }}>
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  );
}