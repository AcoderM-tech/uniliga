import { useState, useEffect } from 'react';
import { getJamoalar, getJadval, getFutbolchilar } from '../lib/api';

/* ── Shield SVG logo ── */
function ShieldLogo({ name='', color='#cc1a2e', logo=null }) {
  const abbr = name.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3)||'?';
  if (logo) return (
    <img src={logo} alt={name}
      style={{width:'100%',height:'100%',objectFit:'contain',padding:8}}
      onError={e=>{ e.target.style.display='none'; }}
    />
  );
  return (
    <svg viewBox="0 0 80 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g${abbr}${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity=".9"/>
          <stop offset="100%" stopColor={color} stopOpacity=".5"/>
        </linearGradient>
      </defs>
      <path d="M40 4 L74 18 L74 46 C74 66 58 80 40 86 C22 80 6 66 6 46 L6 18 Z"
        fill={`url(#g${abbr}${color.replace('#','')})`} stroke={color} strokeWidth="2" strokeOpacity=".5"/>
      <path d="M40 12 L68 24 L68 46 C68 62 54 74 40 80 C26 74 12 62 12 46 L12 24 Z" fill="rgba(0,0,0,0.22)"/>
      <text x="40" y={abbr.length>2?"50":"53"} textAnchor="middle" dominantBaseline="middle"
        fontSize={abbr.length>2?"17":"22"} fontWeight="900" fontFamily="Montserrat,sans-serif"
        fill="white" letterSpacing="1">{abbr}</text>
    </svg>
  );
}

/* ── Statistika Modal ── */
function StatModal({ jamoa, stat, futbolchilar, onClose }) {
  const color = jamoa.primary_color || '#cc1a2e';
  const name  = jamoa.name || '';

  // form STRING ni array ga o'tkazish: "WWDL" -> ['W','W','D','L']
  const formArr = stat?.form ? Array.from(String(stat.form)) : [];
  const gd = stat ? (stat.goals_for||0) - (stat.goals_against||0) : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const fn = e => e.key==='Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => { document.body.style.overflow=''; window.removeEventListener('keydown', fn); };
  }, []);

  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div className="sm-box" onClick={e=>e.stopPropagation()} style={{'--sm-color':color}}>

        {/* Header */}
        <div className="sm-head">
          <div className="sm-shield">
            <ShieldLogo name={name} color={color} logo={jamoa.logo_url||null}/>
          </div>
          <div className="sm-head-info">
            <div className="sm-name">{name}</div>
            {jamoa.short_name && <div className="sm-short">{jamoa.short_name}</div>}
            {jamoa.faculty    && <div className="sm-faculty">{jamoa.faculty}</div>}
          </div>
          <button className="sm-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <StatTabs stat={stat} gd={gd} formArr={formArr} futbolchilar={futbolchilar} color={color}/>
      </div>
    </div>
  );
}

function StatTabs({ stat, gd, formArr, futbolchilar, color }) {
  const [tab, setTab] = useState('stat');
  const [bigPhoto, setBigPhoto] = useState(null);

  return (
    <>
      {/* Rasm kattalashtirish lightbox */}
      {bigPhoto && (
        <div
          onClick={() => setBigPhoto(null)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.92)',
            zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'zoom-out', padding:16,
          }}
        >
          <img
            src={bigPhoto} alt=""
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth:'90vw', maxHeight:'90vh',
              objectFit:'contain', borderRadius:14,
              boxShadow:'0 24px 80px rgba(0,0,0,.9)',
              cursor:'default',
            }}
          />
          <button
            onClick={() => setBigPhoto(null)}
            style={{
              position:'absolute', top:16, right:16,
              background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,.2)', borderRadius:'50%',
              width:40, height:40, cursor:'pointer',
              color:'#fff', fontSize:20, display:'flex',
              alignItems:'center', justifyContent:'center', lineHeight:1,
            }}
          >✕</button>
        </div>
      )}

      {/* Tab header */}
      <div className="sm-tabs">
        <button className={`sm-tab ${tab==='stat'?'sm-tab--on':''}`} onClick={()=>setTab('stat')}>Statistika</button>
        <button className={`sm-tab ${tab==='players'?'sm-tab--on':''}`} onClick={()=>setTab('players')}>
          Futbolchilar {futbolchilar.length>0&&<span className="sm-tab-count">{futbolchilar.length}</span>}
        </button>
      </div>

      {/* Statistika tab */}
      {tab==='stat' && (
        stat ? (
          <>
            <div className="sm-grid">
              {[
                { v:stat.played||0,       l:"O'yinlar",     hi:false },
                { v:stat.won||0,          l:"G'alabalar",   hi:true  },
                { v:stat.drawn||0,        l:'Duranglar',    hi:false },
                { v:stat.lost||0,         l:"Mag'lubiyat",  hi:false },
                { v:stat.goals_for||0,    l:'Gollar',       hi:true  },
                { v:stat.goals_against||0,l:"O'tkazilgan",  hi:false },
                { v:gd!=null?(gd>=0?`+${gd}`:gd):'—', l:'Gol farqi', hi:gd>0 },
                { v:stat.points||0,       l:'Ball',         hi:true  },
              ].map(({v,l,hi},i)=>(
                <div key={i} className={`sm-stat ${hi?'sm-stat--hi':''}`}>
                  <span className="sm-stat-v">{v}</span>
                  <span className="sm-stat-l">{l}</span>
                </div>
              ))}
            </div>

            {formArr.length>0 && (
              <div className="sm-form">
                <div className="sm-form-label">So'nggi o'yinlar</div>
                <div className="sm-form-row">
                  {formArr.slice(-5).map((r,i)=>(
                    <span key={i} className={`sm-form-badge sm-form-${r}`}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {stat.played>0 && (
              <div className="sm-bar-section">
                <div className="sm-bar">
                  <div className="sm-bar-w" style={{width:`${(stat.won/stat.played)*100}%`}}/>
                  <div className="sm-bar-d" style={{width:`${(stat.drawn/stat.played)*100}%`}}/>
                  <div className="sm-bar-l" style={{width:`${(stat.lost/stat.played)*100}%`}}/>
                </div>
                <div className="sm-bar-legend">
                  <span className="sm-bl-w">G'alaba {stat.won}</span>
                  <span className="sm-bl-d">Durang {stat.drawn}</span>
                  <span className="sm-bl-l">Mag'lub {stat.lost}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{textAlign:'center',padding:'32px 0',color:'var(--tx3)'}}>
            <div style={{fontSize:32,marginBottom:8,opacity:.3}}>📊</div>
            <div style={{fontFamily:'var(--f-display)',fontSize:12,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>Statistika mavjud emas</div>
          </div>
        )
      )}

      {/* Futbolchilar tab */}
      {tab==='players' && (
        <div className="sm-players">
          {futbolchilar.length===0 ? (
            <div style={{textAlign:'center',padding:'28px 0',color:'var(--tx3)'}}>
              <div style={{fontSize:28,marginBottom:8,opacity:.3}}>👤</div>
              <div style={{fontFamily:'var(--f-display)',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>Futbolchi yo'q</div>
            </div>
          ) : futbolchilar.map((p,i)=>{
            const photoSrc = p.photo_url || p.photo || null;
            return (
              <div key={p.id||i} className="sm-player">
                <div className="sm-player-num" style={{color}}>{p.number||'—'}</div>
                <div
                  className="sm-player-avatar"
                  onClick={() => photoSrc && setBigPhoto(photoSrc)}
                  style={{ cursor: photoSrc ? 'zoom-in' : 'default', position:'relative' }}
                >
                  {photoSrc
                    ? <>
                        <img
                          src={photoSrc} alt={p.name}
                          style={{
                            width:'100%', height:'100%',
                            objectFit:'cover', objectPosition:'top center',
                            borderRadius:'50%',
                          }}
                        />
                        {/* kichik kattalashtirish belgisi */}
                        <div style={{
                          position:'absolute', inset:0, borderRadius:'50%',
                          background:'rgba(0,0,0,0)', display:'flex',
                          alignItems:'center', justifyContent:'center',
                          transition:'background .18s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,.35)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0)'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" opacity="0"
                            style={{transition:'opacity .18s'}}
                            ref={el => {
                              if (!el) return;
                              const parent = el.parentElement;
                              parent.onmouseenter = () => { el.style.opacity=1; parent.style.background='rgba(0,0,0,.35)'; };
                              parent.onmouseleave = () => { el.style.opacity=0; parent.style.background='rgba(0,0,0,0)'; };
                            }}
                          >
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                          </svg>
                        </div>
                      </>
                    : <span style={{color,fontFamily:'var(--f-display)',fontWeight:900,fontSize:14}}>{(p.name||'?')[0]}</span>
                  }
                </div>
                <div className="sm-player-info">
                  <div className="sm-player-name">{p.name}</div>
                  {p.position && <div className="sm-player-pos">{p.position}</div>}
                </div>
                {p.goals_count!==undefined && (
                  <div className="sm-player-goals">
                    <span>{p.goals_count}</span>
                    <span style={{fontSize:9,color:'var(--tx3)'}}>GOL</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Jamoa karta ── */
function JamoaKarta({ jamoa, index, onSelect }) {
  const COLORS = ['#cc1a2e','#1a56db','#1a8a4a','#9333ea','#f59e0b','#ec4899','#0ea5e9','#10b981'];
  const color = jamoa.primary_color || COLORS[index%COLORS.length];
  const name  = jamoa.name || '';

  return (
    <div className="jk-card" style={{'--jk-color':color}} onClick={()=>onSelect(jamoa)}>
      <div className="jk-bar"/>
      <div className="jk-shield">
        <ShieldLogo name={name} color={color} logo={jamoa.logo_url||null}/>
      </div>
      <div className="jk-name">{name}</div>
      {jamoa.short_name && <div className="jk-abbr">{jamoa.short_name}</div>}
      {jamoa.faculty    && <div className="jk-faculty">{jamoa.faculty}</div>}
      <div className="jk-click-hint">
        <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor" opacity=".45">
          <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
        </svg>
        <span>Statistika</span>
      </div>
      <div className="jk-glow"/>
    </div>
  );
}

/* ── Asosiy sahifa ── */
export default function JamoalarSahifasi() {
  const [jamoalar,    setJamoalar]    = useState([]);
  const [jadval,      setJadval]      = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [qidiruv,     setQidiruv]     = useState('');
  const [tanlangan,   setTanlangan]   = useState(null);
  const [tanlanganFutbolchilar, setTanlanganFutbolchilar] = useState([]);

  useEffect(()=>{
    Promise.all([
      getJamoalar().then(d=>Array.isArray(d)?d:d?.results||[]),
      getJadval().then(d=>Array.isArray(d)?d:d?.results||[]),
    ]).then(([j,t])=>{ setJamoalar(j); setJadval(t); }).finally(()=>setYuklanmoqda(false));
  },[]);

  const handleSelect = (jamoa) => {
    setTanlangan(jamoa);
    setTanlanganFutbolchilar([]);
    // Jamoaga tegishli futbolchilarni yuklash
    getFutbolchilar({ jamoa: jamoa.id })
      .then(d => {
        const list = Array.isArray(d) ? d : d?.results || [];
        setTanlanganFutbolchilar(list);
      })
      .catch(() => setTanlanganFutbolchilar([]));
  };

  const getStatByTeam = (jamoa) =>
    jadval.find(t => t.team===jamoa.id || t.team_name===jamoa.name);

  const filtered = jamoalar.filter(j => {
    const q = qidiruv.toLowerCase();
    return (j.name||'').toLowerCase().includes(q) || (j.faculty||'').toLowerCase().includes(q);
  });

  return (
    <div style={{paddingTop:68, minHeight:'100vh'}}>

      {/* Header */}
      <div className="jk-hero">
        <div className="jk-hero-glow"/>
        <div className="container" style={{position:'relative',zIndex:2}}>
          <div className="section-eyebrow" style={{marginBottom:10}}>Liga</div>
          <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'clamp(30px,5vw,48px)',color:'var(--tx1)',letterSpacing:'-.03em',lineHeight:1,marginBottom:10}}>
            Jamoalar
          </h1>
          <p style={{fontFamily:'var(--f-body)',fontSize:13,color:'var(--tx3)',marginBottom:24}}>
            Ligada ishtirok etayotgan barcha jamoalar{jamoalar.length>0?` — ${jamoalar.length} ta`:''}
          </p>
          <div className="jk-search">
            <svg width="14" height="14" viewBox="0 0 256 256" fill="var(--tx3)" style={{flexShrink:0}}>
              <path d="M229.66,218.34l-50.07-50.07a88,88,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.31ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
            </svg>
            <input type="text" placeholder="Jamoa qidirish..." value={qidiruv}
              onChange={e=>setQidiruv(e.target.value)} className="jk-search-input"/>
            {qidiruv && (
              <button onClick={()=>setQidiruv('')}
                style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',color:'var(--tx3)'}}>
                <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container" style={{padding:'40px 28px 80px'}}>
        {yuklanmoqda ? (
          <div style={{display:'flex',justifyContent:'center',padding:'80px 0'}}>
            <div style={{textAlign:'center',color:'var(--tx3)'}}>
              <div className="spinner" style={{margin:'0 auto 16px',width:30,height:30,borderWidth:3}}/>
              <div style={{fontFamily:'var(--f-display)',fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase'}}>Yuklanmoqda...</div>
            </div>
          </div>
        ) : filtered.length===0 ? (
          <div className="empty-state" style={{padding:'80px 0'}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.2}}>🛡️</div>
            <div className="empty-state-text">{qidiruv?`"${qidiruv}" topilmadi`:"Hali jamoa yo'q"}</div>
          </div>
        ) : (
          <div className="jk-grid">
            {filtered.map((j,i)=>(
              <div key={j.id||i} className="fade-up" style={{animationDelay:`${i*.05}s`}}>
                <JamoaKarta jamoa={j} index={i} onSelect={handleSelect}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {tanlangan && (
        <StatModal
          jamoa={tanlangan}
          stat={getStatByTeam(tanlangan)}
          futbolchilar={tanlanganFutbolchilar}
          onClose={()=>setTanlangan(null)}
        />
      )}
    </div>
  );
}