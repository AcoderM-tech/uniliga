import { useNavigate } from 'react-router-dom';
import { IconCalendar, IconPin, IconLiveDot } from './Icons';

const LIVE = ['live','half_time','second_half','extra_time'];

function Initials(name) {
  if (!name) return '?';
  const w = name.trim().split(/\s+/);
  return w.length === 1 ? w[0].slice(0,2).toUpperCase() : (w[0][0]+w[1][0]).toUpperCase();
}

/* ── Taktik dokqa ikonchasi ── */
const IcoBoard = () => (
  <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
    <path opacity=".3" d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Z"/>
    <path d="M216,32H40A24,24,0,0,0,16,56V200a24,24,0,0,0,24,24H216a24,24,0,0,0,24-24V56A24,24,0,0,0,216,32Zm8,168a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8ZM80,108A12,12,0,1,1,68,96,12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-96,48a12,12,0,1,1-12-12A12,12,0,0,1,80,156Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,156Zm-48-24a12,12,0,1,1-12-12A12,12,0,0,1,128,132Z"/>
  </svg>
);

export default function OyinKarta({ oyin }) {
  const navigate   = useNavigate();
  const isLive     = LIVE.includes(oyin.status);
  const isFinished = oyin.status === 'finished';
  const isUpcoming = oyin.status === 'upcoming';
  const min  = oyin.display_minute  ?? oyin.minute      ?? 0;
  const xtra = oyin.display_extra   ?? oyin.extra_minute ?? 0;

  const openCenter = (e) => {
    e.stopPropagation();
    navigate(`/oyinlar/${oyin.id}/center`);
  };

  return (
    <div
      onClick={() => navigate(`/oyinlar/${oyin.id}`)}
      style={{
        background:'var(--bg3)',
        border:`1px solid ${isLive ? 'rgba(239,68,68,.35)' : 'var(--border)'}`,
        borderRadius:'var(--r-lg)', overflow:'hidden', cursor:'pointer',
        transition:'border-color .25s, transform .25s, box-shadow .25s',
        boxShadow: isLive ? '0 0 0 1px rgba(239,68,68,.12), 0 8px 32px rgba(239,68,68,.08)' : 'none',
        position:'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,.6)' : 'var(--border-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.borderColor = isLive ? 'rgba(239,68,68,.35)' : 'var(--border)'; }}
    >
      {/* Top colour bar */}
      <div style={{ height:3, background: isLive ? 'var(--red)' : isFinished ? 'var(--green)' : 'var(--border)' }}/>

      {/* Status row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0' }}>
        <span style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--tx3)' }}>
          {oyin.week}-HAFTA
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {isLive && (
            <span style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', fontFamily:'var(--f-display)', fontSize:9, fontWeight:800, letterSpacing:'.12em', color:'var(--red)' }}>
              <IconLiveDot size={7} color="#ef4444"/>
              JONLI {min > 0 && oyin.status !== 'half_time' ? `${min}${xtra > 0 ? '+' + xtra : ''}'` : ''}
            </span>
          )}
          {isFinished && <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', fontFamily:'var(--f-display)', fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'var(--tx3)', textTransform:'uppercase' }}>Tugadi</span>}
          {isUpcoming && <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', fontFamily:'var(--f-display)', fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#f59e0b' }}>Kutilmoqda</span>}
          {oyin.status === 'half_time' && <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', fontFamily:'var(--f-display)', fontSize:9, fontWeight:700, letterSpacing:'.1em', color:'#f59e0b' }}>TANAFFUS</span>}
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{ padding:'16px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Home */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`${oyin.home_team_color||'#cc1a2e'}22`, border:`2px solid ${oyin.home_team_color||'#cc1a2e'}55`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              {oyin.home_team_logo
                ? <img src={oyin.home_team_logo} alt="" style={{ width:36, height:36, objectFit:'contain' }}/>
                : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:20, color:oyin.home_team_color||'#cc1a2e' }}>{Initials(oyin.home_team_short||oyin.home_team_name)}</span>
              }
            </div>
            <span style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:12, color:'var(--tx1)', lineHeight:1.2 }}>{oyin.home_team_short||oyin.home_team_name}</span>
          </div>

          {/* Score */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, minWidth:80 }}>
            {(isLive || isFinished) ? (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:32, letterSpacing:'-.03em', lineHeight:1, color:oyin.home_team_color||'var(--tx1)' }}>{oyin.home_score}</span>
                <span style={{ fontFamily:'var(--f-display)', fontWeight:300, fontSize:22, color:'var(--tx4)', lineHeight:1 }}>–</span>
                <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:32, letterSpacing:'-.03em', lineHeight:1, color:oyin.away_team_color||'var(--tx1)' }}>{oyin.away_score}</span>
              </div>
            ) : (
              <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:22, letterSpacing:'.04em', color:'#f59e0b', lineHeight:1 }}>{oyin.match_time?.slice(0,5)||'18:00'}</span>
            )}
            {oyin.status === 'half_time' && <span style={{ fontFamily:'var(--f-display)', fontSize:9, color:'#f59e0b', fontWeight:700, letterSpacing:'.08em' }}>TANAFFUS</span>}
          </div>

          {/* Away */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`${oyin.away_team_color||'#2979ff'}22`, border:`2px solid ${oyin.away_team_color||'#2979ff'}55`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              {oyin.away_team_logo
                ? <img src={oyin.away_team_logo} alt="" style={{ width:36, height:36, objectFit:'contain' }}/>
                : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:20, color:oyin.away_team_color||'#2979ff' }}>{Initials(oyin.away_team_short||oyin.away_team_name)}</span>
              }
            </div>
            <span style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:12, color:'var(--tx1)', lineHeight:1.2 }}>{oyin.away_team_short||oyin.away_team_name}</span>
          </div>
        </div>

        {/* Footer: meta + Match Center tugma */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', paddingBottom:12, gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)' }}>
              <IconCalendar size={11}/>{oyin.match_date}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)' }}>
              <IconPin size={11}/>{oyin.stadium}
            </span>
          </div>

          {/* ── Taktik Doska tugmasi ── */}
          <button
            onClick={openCenter}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              background: isLive ? 'var(--red-dim)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${isLive ? 'var(--red-glow)' : 'var(--border-2)'}`,
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--f-display)', fontSize: 9, fontWeight: 700,
              letterSpacing: '.1em', textTransform: 'uppercase',
              color: isLive ? 'var(--red-light)' : 'var(--tx3)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = isLive ? 'var(--red-light)' : 'var(--tx3)'; e.currentTarget.style.background = isLive ? 'var(--red-dim)' : 'rgba(255,255,255,.04)'; }}
          >
            <IcoBoard/>
            Doska
          </button>
        </div>
      </div>
    </div>
  );
}