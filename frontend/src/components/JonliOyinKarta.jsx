import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, SoccerBall, Square, ArrowsLeftRight, ArrowSquareOut, Lightning } from '@phosphor-icons/react';
import { makeWsUrl } from '../lib/ws';
import { getMatchClock, isMatchClockRunning } from '../lib/matchClock';
import api from '../lib/api';

const EVENT_ICON = {
  goal:     { icon: <SoccerBall size={13} color="#4ade80" />,  label:'Gol' },
  penalty:  { icon: <SoccerBall size={13} color="#4ade80" />,  label:'Penalti' },
  own_goal: { icon: <SoccerBall size={13} color="#ef4444" />,  label:"O'z goli" },
  yellow:   { icon: <Square size={12} fill="#f59e0b" color="#f59e0b" />, label:'Sariq karta' },
  red:      { icon: <Square size={12} fill="#ef4444" color="#ef4444" />, label:'Qizil karta' },
  sub:      { icon: <ArrowsLeftRight size={12} color="#60a5fa" />, label:'Almashtirish' },
  assist:   { icon: <Lightning size={12} color="#a78bfa" />, label:'Assist' },
};

const PHASE_DISPLAY = {
  not_started: { label: 'KO',   badge: 'KUTILMOQDA',   color: 'var(--tx3)',  bkg: 'rgba(255,255,255,.06)' },
  first_half:  { label: null,   badge: 'JONLI',        color: '#22c55e',    bkg: 'rgba(34,197,94,.12)',  dot: true },
  half_time:   { label: 'HT',   badge: 'TANAFFUS',    color: '#f59e0b',    bkg: 'rgba(245,158,11,.12)' },
  second_half: { label: null,   badge: '2-YARIM',      color: '#22c55e',    bkg: 'rgba(34,197,94,.12)',  dot: true },
  extra_time:  { label: null,   badge: "QO'SHIMCHA",   color: '#f97316',    bkg: 'rgba(249,115,22,.12)', dot: true },
  finished:    { label: 'FT',   badge: 'TUGAGAN',      color: 'var(--tx3)', bkg: 'rgba(255,255,255,.06)' },
};

function formatClock(minute, extra, second) {
  const ss = String(Math.max(0, Number(second || 0))).padStart(2, '0');
  if (Number(extra || 0) > 0) return `${minute}+${extra}:${ss}`;
  return `${minute}:${ss}`;
}

function useMatchClock(match) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!isMatchClockRunning(match)) return;
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [
    match?.phase,
    match?.phase_started_at,
    match?.first_half_duration,
    match?.first_half_extra,
    match?.second_half_duration,
    match?.second_half_extra,
  ]);

  return getMatchClock(match, nowMs);
}

export default function JonliOyinKarta({ match: initialMatch }) {
  const navigate = useNavigate();
  const [match, setMatch] = useState(initialMatch);
  const [pulse, setPulse] = useState(true);
  const { minute: min, extra, second } = useMatchClock(match);

  useEffect(() => setMatch(initialMatch), [initialMatch]);

  // WebSocket real-time sync
  useEffect(() => {
    if (!match?.id) return;
    const ws = new WebSocket(makeWsUrl(`/ws/oyin/${match.id}/`));
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'match_update') setMatch(msg.data);
      } catch {}
    };
    return () => ws.close();
  }, [match?.id]);

  // Pulse dot
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  if (!match) return null;

  const phase     = match.phase || 'not_started';
  const phaseInfo = PHASE_DISPLAY[phase] || PHASE_DISPLAY.not_started;
  const isLive    = ['first_half','second_half','extra_time'].includes(phase);
  const isHT      = phase === 'half_time';
  const isFT      = phase === 'finished';

  // Progress bar
  const totalDuration = (match.first_half_duration ?? 45) + (match.second_half_duration ?? 45);
  const pct = isFT ? 100 : phase === 'not_started' ? 0 : Math.min((min / totalDuration) * 100, 100);

  const visibleEvents = (match.events || [])
    .filter(e => e.event_type !== 'assist')
    .slice(-5)
    .reverse();

  const clockStr = isHT ? 'TANAFFUS' : isFT ? 'FT' : phase === 'not_started' ? 'KO' : formatClock(min, extra, second);

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      maxWidth: 860,
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 40% at 50% 0%,rgba(204,26,46,.06),transparent)', pointerEvents:'none' }}/>

      {/* ── Header strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,.02)', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', minWidth:0 }}>
          <span style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx4)' }}>
            UniLiga · {match.week}-hafta
          </span>
          <span style={{ color:'var(--border)', fontSize:12 }}>|</span>
          <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--f-display)', fontSize:10, fontWeight:600, color:'var(--tx3)', letterSpacing:'.06em' }}>
            <MapPin size={10}/>{match.stadium}
          </span>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'4px 10px', borderRadius:99,
          background: phaseInfo.bkg, border:`1px solid ${phaseInfo.color}55`,
          fontFamily:'var(--f-display)', fontSize:10, fontWeight:800, letterSpacing:'.1em', color: phaseInfo.color,
          flexShrink:0,
        }}>
          {phaseInfo.dot && <span className="live-dot" style={{ opacity: pulse?1:0.3, background: phaseInfo.color, width:6, height:6 }}/>}
          {phaseInfo.badge}
        </div>
      </div>

      {/* ── Main scoreboard ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '28px 20px 20px',
        gap: 12,
      }}>
        {/* Home team */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: `${match.home_team_color}15`,
            border: `2px solid ${match.home_team_color}40`,
            display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0,
          }}>
            {match.home_team_logo
              ? <img src={match.home_team_logo} alt={match.home_team_short} style={{width:48,height:48,objectFit:'contain'}}/>
              : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:28, color: match.home_team_color }}>{match.home_team_short?.[0]}</span>
            }
          </div>
          <span style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, textAlign:'center', color:'var(--tx1)', lineHeight:1.3, wordBreak:'break-word' }}>
            {match.home_team_name}
          </span>
        </div>

        {/* Center: score + clock */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:120 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:'clamp(44px,10vw,72px)', letterSpacing:'-.04em', lineHeight:1, color: match.home_team_color }}>
              {match.home_score}
            </span>
            <span style={{ fontFamily:'var(--f-display)', fontWeight:200, fontSize:'clamp(28px,6vw,48px)', color:'var(--tx4)', lineHeight:1 }}>:</span>
            <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:'clamp(44px,10vw,72px)', letterSpacing:'-.04em', lineHeight:1, color: match.away_team_color }}>
              {match.away_score}
            </span>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:5, padding:'4px 12px',
            background: `${phaseInfo.color}18`, border:`1px solid ${phaseInfo.color}44`,
            borderRadius:99, fontFamily:'var(--f-mono)', fontSize:12, fontWeight:700, color: phaseInfo.color,
          }}>
            {isLive && <span className="live-dot" style={{ opacity: pulse?1:0.3, background:phaseInfo.color, width:6, height:6 }}/>}
            {clockStr}
          </div>
          {isHT && match.half_time_started_at && (
            <HalfTimeCountdown startedAt={match.half_time_started_at} duration={match.half_time_duration ?? 15} />
          )}
        </div>

        {/* Away team */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: `${match.away_team_color}15`,
            border: `2px solid ${match.away_team_color}40`,
            display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0,
          }}>
            {match.away_team_logo
              ? <img src={match.away_team_logo} alt={match.away_team_short} style={{width:48,height:48,objectFit:'contain'}}/>
              : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:28, color: match.away_team_color }}>{match.away_team_short?.[0]}</span>
            }
          </div>
          <span style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, textAlign:'center', color:'var(--tx1)', lineHeight:1.3, wordBreak:'break-word' }}>
            {match.away_team_name}
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding:'0 20px 20px' }}>
        <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2, position:'relative', marginBottom:6 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:phaseInfo.color, borderRadius:2, transition:'width 1s linear', position:'relative' }}>
            <div style={{ position:'absolute', right:-4, top:'50%', transform:'translateY(-50%)', width:8, height:8, background:phaseInfo.color, borderRadius:'50%', boxShadow:`0 0 8px ${phaseInfo.color}` }}/>
          </div>
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'rgba(255,255,255,.12)', transform:'translateX(-50%)' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--f-mono)', fontSize:9, color:'var(--tx4)', letterSpacing:'.06em' }}>
          <span>KO</span>
          <span style={{ color: isHT ? '#f59e0b' : undefined }}>{match.first_half_duration ?? 45}' HT</span>
          <span>{totalDuration}'</span>
        </div>
      </div>

      {/* ── Events ── */}
      {visibleEvents.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'14px 16px' }}>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx4)', marginBottom:10 }}>
            O'yin hodisalari
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {visibleEvents.map(ev => {
              const meta = EVENT_ICON[ev.event_type] || EVENT_ICON.goal;
              return (
                <div key={ev.id} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                  background:'rgba(255,255,255,.02)', borderRadius:8, border:'1px solid var(--border)',
                }}>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:10, fontWeight:600, color:'var(--tx4)', minWidth:26, flexShrink:0 }}>
                    {ev.extra_minute > 0 ? `${ev.minute}+${ev.extra_minute}'` : `${ev.minute}'`}
                  </span>
                  <span style={{ flexShrink:0, display:'flex' }}>{meta.icon}</span>
                  <span style={{ fontFamily:'var(--f-display)', fontWeight:600, fontSize:12, color:'var(--tx1)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {ev.player_name}
                    {ev.assist_player && <span style={{ color:'var(--tx4)', fontSize:10 }}> · {ev.assist_player}</span>}
                  </span>
                  <span style={{ fontFamily:'var(--f-display)', fontSize:9, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 6px', borderRadius:99, background:'rgba(255,255,255,.05)', color:'var(--tx4)', flexShrink:0, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {ev.team_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{
        display:'flex', gap:10, padding:'14px 16px',
        borderTop:'1px solid var(--border)', flexWrap:'wrap',
      }}>
        <button className="btn btn-red btn-md" style={{ flex:1, minWidth:120, justifyContent:'center' }} onClick={() => navigate(`/oyinlar/${match.id}`)}>
          <ArrowSquareOut size={14}/>To'liq tafsilot<span className="btn-shine"/>
        </button>
        <button className="btn btn-ghost btn-md" style={{ flex:1, minWidth:100, justifyContent:'center' }} onClick={() => navigate(`/oyinlar/${match.id}/center`)}>
          Taktik Doska
        </button>
      </div>
    </div>
  );
}

// Half-time countdown
function HalfTimeCountdown({ startedAt, duration }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const tick = () => {
      const end = new Date(startedAt).getTime() + duration * 60000;
      const rem = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(rem);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startedAt, duration]);

  if (remaining === null) return null;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <div style={{ fontFamily:'var(--f-mono)', fontSize:12, color:'#f59e0b', marginTop:4 }}>
      {remaining > 0 ? `${m}:${String(s).padStart(2,'0')} qoldi` : '2-yarim boshlashga tayyor'}
    </div>
  );
}