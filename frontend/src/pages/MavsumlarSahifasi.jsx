import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarBlank, Trophy, ArrowRight, SoccerBall, Users, Television, CaretLeft, Archive, Lightning, Star } from '@phosphor-icons/react';
import { getMavsumlar, getMavsumArhiv, getJadval, getOyinlar } from '../lib/api';
import OyinKarta from '../components/OyinKarta';
import LigaJadvali from '../components/LigaJadvali';

// Arxivlangan mavsum to'liq ko'rinishi
function MavsumArhivKorinish({ mavsumId, onOrqaga }) {
  const [malumot, setMalumot] = useState(null);
  const [yuklanyapti, setYuklanyapti] = useState(true);
  const [faolTab, setFaolTab] = useState('jadval');

  useEffect(() => {
    setYuklanyapti(true);
    getMavsumArhiv(mavsumId)
      .then(setMalumot)
      .finally(() => setYuklanyapti(false));
  }, [mavsumId]);

  if (yuklanyapti) return (
    <div className="loading-center" style={{ minHeight: 300 }}>
      <div className="spinner" /><span>Yuklanmoqda...</span>
    </div>
  );
  if (!malumot) return (
    <div className="empty-state"><div className="empty-state-icon">❌</div><div className="empty-state-text">Ma'lumot topilmadi</div></div>
  );

  const { mavsum, oyinlar, jadval, top_futbolchilar, yangiliklar, jamoalar = [], stats } = malumot;

  return (
    <div>
      {/* Orqaga + sarlavha */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onOrqaga}>
          <CaretLeft size={14}/>Orqaga
        </button>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)' }}>Arxiv</div>
          <div style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:20, color:'var(--tx1)' }}>{mavsum.name}</div>
        </div>
        <span className="badge badge-gray" style={{ marginLeft:'auto' }}>
          <Archive size={10}/>Arxivlangan mavsum
        </span>
      </div>

      {/* Statistika */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { v: stats.jami_oyinlar,    n: "Jami o'yinlar",  icon: Television,    c:'#1a56db' },
          { v: stats.tugagan_oyinlar, n: 'Tugagan',         icon: Trophy, c:'#1a8a4a' },
          { v: stats.jami_gollar,     n: 'Jami gollar',     icon: SoccerBall,   c:'#c9a227' },
          { v: stats.jami_jamoalar,   n: 'Jamoalar',        icon: Users,  c:'#7c3aed' },
        ].map(({ v, n, icon: Icon, c }) => (
          <div key={n} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'var(--r-sm)', background:`${c}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={15} color={c}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:18, color:'var(--tx1)' }}>{v}</div>
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)' }}>{n}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablar */}
      <div className="filter-tabs" style={{ marginBottom:20 }}>
        {[['jadval','Liga jadvali'],['oyinlar',"O'yinlar"],['jamoalar','Jamoalar'],['top','Top futbolchilar'],['yangiliklar','Yangiliklar']].map(([k,n]) => (
          <button key={k} className={`filter-tab ${faolTab===k?'active':''}`} onClick={() => setFaolTab(k)}>{n}</button>
        ))}
      </div>

      {faolTab === 'jadval' && (
        jadval.length
          ? <LigaJadvali qatorlar={jadval}/>
          : <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">Jadval yo'q</div></div>
      )}

      {faolTab === 'oyinlar' && (
        oyinlar.length
          ? <div className="matches-grid">{oyinlar.map(o => <OyinKarta key={o.id} oyin={o}/>)}</div>
          : <div className="empty-state"><div className="empty-state-icon">⚽</div><div className="empty-state-text">O'yin yo'q</div></div>
      )}

      {faolTab === 'jamoalar' && (
        jamoalar.length ? (
          <div className="jk-grid">
            {jamoalar.map((j, i) => {
              const color = j.primary_color || '#cc1a2e';
              const abbr  = j.name.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3);
              return (
                <div key={j.id} className="jk-card" style={{'--jk-color': color}}>
                  <div className="jk-bar"/>
                  <div className="jk-shield">
                    {j.logo_url
                      ? <img src={j.logo_url} alt={j.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:8}} onError={e=>e.target.style.display='none'}/>
                      : <svg viewBox="0 0 80 90" width="100%" height="100%">
                          <defs><linearGradient id={`ag${i}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity=".9"/><stop offset="100%" stopColor={color} stopOpacity=".5"/></linearGradient></defs>
                          <path d="M40 4 L74 18 L74 46 C74 66 58 80 40 86 C22 80 6 66 6 46 L6 18 Z" fill={`url(#ag${i})`} stroke={color} strokeWidth="2" strokeOpacity=".5"/>
                          <path d="M40 12 L68 24 L68 46 C68 62 54 74 40 80 C26 74 12 62 12 46 L12 24 Z" fill="rgba(0,0,0,0.22)"/>
                          <text x="40" y={abbr.length>2?"50":"53"} textAnchor="middle" dominantBaseline="middle" fontSize={abbr.length>2?"17":"22"} fontWeight="900" fontFamily="Montserrat,sans-serif" fill="white" letterSpacing="1">{abbr}</text>
                        </svg>
                    }
                  </div>
                  <div className="jk-name">{j.name}</div>
                  {j.short_name && <div className="jk-abbr">{j.short_name}</div>}
                  {j.faculty    && <div className="jk-faculty">{j.faculty}</div>}
                  <div className="jk-glow"/>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <div className="empty-state-text">Jamoa yo'q</div>
          </div>
        )
      )}

      {faolTab === 'top' && (
        top_futbolchilar.length ? (
          <div className="players-list">
            {top_futbolchilar.map((f, i) => (
              <div key={i} className="player-row">
                <span className={`player-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}`}>{i+1}</span>
                <div className="player-avatar" style={{ background:`${f.jamoa_rang}22`, border:`1.5px solid ${f.jamoa_rang}44` }}>
                  <span style={{ color:f.jamoa_rang, fontSize:16, fontFamily:'var(--f-display)', fontWeight:900 }}>{f.futbolchi_ism?.[0]}</span>
                </div>
                <div className="player-info">
                  <div className="player-name">{f.futbolchi_ism}</div>
                  <div className="player-club">{f.jamoa_ism}</div>
                </div>
                <div className="player-stats">
                  <div className="player-stat-box">
                    <span className="player-stat-val">{f.gollar}</span>
                    <span className="player-stat-lbl">Gol</span>
                  </div>
                  <div className="player-stat-box">
                    <span className="player-stat-val" style={{ color:'var(--gold)' }}>{f.ball}</span>
                    <span className="player-stat-lbl">Ball</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><div className="empty-state-icon">🏅</div><div className="empty-state-text">Ma'lumot yo'q</div></div>
      )}

      {faolTab === 'yangiliklar' && (
        yangiliklar.length ? (
          <div className="posts-grid">
            {yangiliklar.map(y => (
              <div key={y.id} className="post-card" style={{ cursor:'default' }}>
                {y.cover_image_url && <div className="post-image"><img src={y.cover_image_url} alt={y.title} loading="lazy"/></div>}
                <div className="post-body">
                  <h3 className="post-title">{y.title}</h3>
                  <p className="post-excerpt">{y.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><div className="empty-state-icon">📰</div><div className="empty-state-text">Yangilik yo'q</div></div>
      )}
    </div>
  );
}

// Asosiy sahifa — barcha mavsumlar ro'yxati
export default function MavsumlarSahifasi() {
  const navigate = useNavigate();
  const [mavsumlar, setMavsumlar]     = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [tanlanganId, setTanlanganId] = useState(null);

  useEffect(() => {
    setYuklanmoqda(true);
    getMavsumlar()
      .then(d => setMavsumlar(d.results || d || []))
      .finally(() => setYuklanmoqda(false));
  }, []);

  if (tanlanganId) {
    return (
      <div className="page-wrap">
        <div className="container" style={{ paddingTop:32, paddingBottom:80 }}>
          <MavsumArhivKorinish mavsumId={tanlanganId} onOrqaga={() => setTanlanganId(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom:8 }}>UniLiga</div>
          <h1 className="page-title">Mavsumlar tarixi</h1>
          <p className="page-subtitle">Barcha o'tgan mavsumlar arxivi — jadval, o'yinlar, statistika</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:80 }}>
        {yuklanmoqda ? (
          <div className="loading-center"><div className="spinner"/><span>Yuklanmoqda...</span></div>
        ) : mavsumlar.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Mavsum topilmadi</div></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:16 }}>
            {mavsumlar.map(m => (
              <div key={m.id} style={{
                background: 'var(--bg3)',
                border: `1px solid ${m.is_active ? 'var(--gold-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {/* Sarlavha */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:17, color:'var(--tx1)' }}>
                    {m.name}
                  </div>
                  {m.is_active && (
                    <span className="badge badge-gold" style={{ fontSize:9 }}>
                      <Lightning size={9}/>FAOL
                    </span>
                  )}
                  {m.is_archived && !m.is_active && (
                    <span className="badge badge-gray" style={{ fontSize:9 }}>
                      <Archive size={9}/>Arxiv
                    </span>
                  )}
                </div>

                {/* Sana */}
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--tx3)', fontSize:12 }}>
                  <CalendarBlank size={12}/>
                  <span>{m.start_date} — {m.end_date}</span>
                  {m.weeks_total ? <span style={{ color:'var(--tx4)' }}>· {m.weeks_total} hafta</span> : null}
                </div>

                {/* Tugmalar */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                  {m.is_active ? (
                    <>
                      <button className="btn btn-red btn-sm" onClick={() => navigate(`/oyinlar`)}>
                        O'yinlar <ArrowRight size={12}/>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/jadval`)}>
                        Jadval
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setTanlanganId(m.id)}>
                      <Archive size={12}/>Arxivni ko'rish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
