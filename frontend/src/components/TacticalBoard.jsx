import { useState, useEffect, useRef, useCallback } from 'react';
import { makeWsUrl } from '../lib/ws';
import {
  getAccessToken, onAccessTokenChange,
  getMatchLineup, addPlayerToMatch, updatePlayerPos,
  addPlayerEvent, applyFormation, deleteMatchPlayer
} from '../lib/api';

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const IcoGoal   = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"/><circle cx="128" cy="128" r="24"/></svg>;
const IcoYellow = () => <svg width="12" height="14" viewBox="0 0 192 256" fill="#f59e0b"><rect x="16" y="8" width="160" height="240" rx="16"/></svg>;
const IcoRed    = () => <svg width="12" height="14" viewBox="0 0 192 256" fill="#ef4444"><rect x="16" y="8" width="160" height="240" rx="16"/></svg>;
const IcoSub    = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm40,112H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32a8,8,0,0,1,0,16Z"/></svg>;
const IcoClose  = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>;
const IcoDrag   = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" opacity=".6"><path d="M108,60a16,16,0,1,1-16-16A16,16,0,0,1,108,60Zm56,0a16,16,0,1,1-16-16A16,16,0,0,1,164,60ZM92,128a16,16,0,1,0,16,16A16,16,0,0,0,92,128Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,128ZM92,196a16,16,0,1,0,16,16A16,16,0,0,0,92,196Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,196Z"/></svg>;
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16Z"/></svg>;
const IcoAssist = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M234.29,69.34l-160,168A8,8,0,0,1,62.58,240,8.07,8.07,0,0,1,56,232V160H24a8,8,0,0,1-5.66-13.66l160-168a8,8,0,0,1,11.19.39A8.07,8.07,0,0,1,192,8V80h32a8,8,0,0,1,5.66,13.66Z" opacity=".3"/><path d="M234.29,69.34l-160,168A8,8,0,0,1,62.58,240,8.07,8.07,0,0,1,56,232V160H24a8,8,0,0,1-5.66-13.66l160-168A8,8,0,0,1,192,8V80h32a8,8,0,0,1,5.66,13.66Z"/></svg>;

const FORMATIONS = {
  '4-4-2': '4-4-2',
  '4-3-3': '4-3-3',
  '3-5-2': '3-5-2',
  '4-2-3-1': '4-2-3-1',
  '5-3-2': '5-3-2',
};

// Status styles
const STATUS_STYLE = {
  active:  {},
  yellow:  { outline: '2px solid #f59e0b', outlineOffset: 1 },
  red:     { filter: 'grayscale(1) brightness(.5)', opacity: .6 },
  sub_out: { opacity: .45, filter: 'grayscale(.6)' },
  injured: { filter: 'sepia(1) brightness(.6)' },
};

// ── Football Field SVG ────────────────────────────────────────────────────────
function Field({ children }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: '75%',
      background: 'linear-gradient(180deg, #1a4a2e 0%, #1e5c35 8%, #1a4a2e 16%, #1e5c35 24%, #1a4a2e 32%, #1e5c35 40%, #1a4a2e 48%, #1e5c35 56%, #1a4a2e 64%, #1e5c35 72%, #1a4a2e 80%, #1e5c35 88%, #1a4a2e 100%)',
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 0 0 2px rgba(255,255,255,.12), inset 0 0 40px rgba(0,0,0,.3)',
      userSelect: 'none',
    }}>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 130"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outline */}
        <rect x="2" y="2" width="96" height="126" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".6"/>
        {/* Center line */}
        <line x1="2" y1="65" x2="98" y2="65" stroke="rgba(255,255,255,.5)" strokeWidth=".5"/>
        {/* Center circle */}
        <circle cx="50" cy="65" r="9" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth=".5"/>
        <circle cx="50" cy="65" r=".8" fill="rgba(255,255,255,.5)"/>
        {/* Top penalty box */}
        <rect x="21" y="2" width="58" height="18" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".5"/>
        {/* Top goal box */}
        <rect x="35" y="2" width="30" height="7" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".5"/>
        {/* Top goal */}
        <rect x="42" y="1" width="16" height="2.5" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.5)" strokeWidth=".4"/>
        {/* Top penalty spot */}
        <circle cx="50" cy="14" r=".8" fill="rgba(255,255,255,.5)"/>
        {/* Top penalty arc */}
        <path d="M38,20 A12,12 0 0,1 62,20" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".5"/>
        {/* Bottom penalty box */}
        <rect x="21" y="110" width="58" height="18" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".5"/>
        {/* Bottom goal box */}
        <rect x="35" y="121" width="30" height="7" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".5"/>
        {/* Bottom goal */}
        <rect x="42" y="126.5" width="16" height="2.5" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.5)" strokeWidth=".4"/>
        {/* Bottom penalty spot */}
        <circle cx="50" cy="116" r=".8" fill="rgba(255,255,255,.5)"/>
        {/* Bottom penalty arc */}
        <path d="M38,110 A12,12 0 0,0 62,110" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth=".5"/>
        {/* Corner arcs */}
        <path d="M2,2 A3,3 0 0,1 5,2" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".4"/>
        <path d="M95,2 A3,3 0 0,0 98,5" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".4"/>
        <path d="M2,128 A3,3 0 0,0 5,128" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".4"/>
        <path d="M98,125 A3,3 0 0,1 95,128" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".4"/>
      </svg>
      {children}
    </div>
  );
}

// ── Player Avatar (Draggable) ─────────────────────────────────────────────────
function PlayerAvatar({ mp, fieldRef, onMove, onMenu, isAdmin }) {
  const avatarRef = useRef(null);
  const dragState = useRef(null);
  const [pos, setPos]     = useState({ x: mp.position_x, y: mp.position_y });
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    setPos({ x: mp.position_x, y: mp.position_y });
  }, [mp.position_x, mp.position_y]);

  const startDrag = useCallback((clientX, clientY) => {
    if (!isAdmin || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    dragState.current = { startX: clientX, startY: clientY, rect };
    setMoving(true);
  }, [isAdmin, fieldRef]);

  const doDrag = useCallback((clientX, clientY) => {
    if (!dragState.current) return;
    const { rect } = dragState.current;
    const x = Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width)  * 100));
    const y = Math.max(3, Math.min(97, ((clientY - rect.top)  / rect.height) * 100));
    setPos({ x, y });
  }, []);

  const endDrag = useCallback((clientX, clientY) => {
    if (!dragState.current) return;
    const { rect } = dragState.current;
    const x = Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width)  * 100));
    const y = Math.max(3, Math.min(97, ((clientY - rect.top)  / rect.height) * 100));
    dragState.current = null;
    setMoving(false);
    setPos({ x, y });
    onMove(mp.id, x, y);
  }, [mp.id, onMove]);

  useEffect(() => {
    const onMove  = (e) => dragState.current && doDrag(e.clientX, e.clientY);
    const onUp    = (e) => dragState.current && endDrag(e.clientX, e.clientY);
    const onTMove = (e) => dragState.current && doDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onTEnd  = (e) => dragState.current && endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onTMove, { passive: true });
    window.addEventListener('touchend',  onTEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend',  onTEnd);
    };
  }, [doDrag, endDrag]);

  const color = mp.team_color || '#cc1a2e';
  const num   = mp.shirt_number || mp.player_number || '?';
  const name  = mp.player_name || '';
  const short = name.split(' ').slice(-1)[0] || name;
  const style = STATUS_STYLE[mp.status] || {};

  return (
    <div
      ref={avatarRef}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top:  `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: moving ? 100 : 10,
        cursor: isAdmin ? (moving ? 'grabbing' : 'grab') : 'default',
        transition: moving ? 'none' : 'left .35s cubic-bezier(.34,1.56,.64,1), top .35s cubic-bezier(.34,1.56,.64,1)',
        ...style,
      }}
      onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
      onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onContextMenu={e => { e.preventDefault(); isAdmin && onMenu(e, mp); }}
    >
      {/* Player circle */}
      <div style={{
        width: 30, height: 30,
        borderRadius: '50%',
        background: `linear-gradient(145deg, ${color}, ${color}88)`,
        border: `2px solid ${color}`,
        boxShadow: moving
          ? `0 0 20px ${color}99, 0 4px 16px rgba(0,0,0,.5)`
          : `0 0 8px ${color}55, 0 2px 8px rgba(0,0,0,.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        transition: 'box-shadow .2s',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {mp.player_photo ? (
          <img src={mp.player_photo} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            onError={e => e.target.style.display='none'}
          />
        ) : (
          <span style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
            fontSize: 11, color: '#fff', lineHeight: 1,
          }}>{num}</span>
        )}
        {/* Status icons */}
        {mp.status === 'yellow' && (
          <span style={{ position:'absolute', top:-4, right:-4 }}><IcoYellow/></span>
        )}
        {mp.status === 'red' && (
          <span style={{ position:'absolute', top:-4, right:-4 }}><IcoRed/></span>
        )}
        {mp.status === 'sub_out' && (
          <span style={{
            position:'absolute', bottom:-2, right:-2,
            background:'#3b82f6', borderRadius:'50%',
            width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, color:'#fff', fontWeight:900,
          }}>↓</span>
        )}
      </div>
      {/* Name label */}
      <div style={{
        marginTop: 3, textAlign: 'center', pointerEvents: 'none',
        fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
        fontSize: 8, color: '#fff', lineHeight: 1.1,
        textShadow: '0 1px 4px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.8)',
        whiteSpace: 'nowrap', maxWidth: 56, overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {short}
      </div>
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ mp, x, y, onAction, onClose }) {
  const items = [
    { key:'GOAL',     label:'⚽ Gol',         color:'#4ade80' },
    { key:'ASSIST',   label:'🎯 Assist',       color:'#60a5fa' },
    { key:'YELLOW',   label:'🟨 Sariq karta',  color:'#f59e0b' },
    { key:'RED',      label:'🟥 Qizil karta',  color:'#ef4444' },
    { key:'SUB',      label:'🔄 Almashtirish', color:'#a78bfa' },
    { key:'OWN_GOAL', label:"😬 O'z goli",     color:'#f97316' },
    { key:'DELETE',   label:'🗑️ Olib tashlash', color:'#ff6b6b' },
  ];
  return (
    <div
      style={{
        position: 'fixed', left: x, top: y, zIndex: 9999,
        background: 'rgba(10,13,24,.97)', border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 10, padding: '6px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,.7)',
        minWidth: 170,
        animation: 'smFade .15s ease',
      }}
      onMouseLeave={onClose}
    >
      <div style={{
        padding:'6px 14px 8px', borderBottom:'1px solid rgba(255,255,255,.07)',
        fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700,
        letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.4)',
      }}>
        {mp.player_name}
      </div>
      {items.map(({ key, label, color }) => (
        <div key={key}
          style={{
            padding:'8px 14px', cursor:'pointer', fontSize:13,
            fontFamily:'Montserrat,sans-serif', fontWeight:600, color,
            transition:'background .15s',
          }}
          onMouseEnter={e => e.target.style.background='rgba(255,255,255,.05)'}
          onMouseLeave={e => e.target.style.background='transparent'}
          onClick={() => onAction(key)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

// ── Add Player Panel ──────────────────────────────────────────────────────────
function AddPlayerPanel({ matchId, homeTeam, awayTeam, homePlayers, awayPlayers, onAdded, onClose }) {
  const [teamId, setTeamId] = useState(homeTeam.id);
  const [playerId, setPlayerId] = useState('');
  const [isStarter, setIsStarter] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const available = teamId === homeTeam.id ? homePlayers : awayPlayers;

  const submit = async () => {
    if (!playerId) { setErr("Futbolchi tanlang"); return; }
    setLoading(true); setErr('');
    try {
      const mp = await addPlayerToMatch(matchId, {
        player_id: playerId, team_id: teamId, is_starter: isStarter,
        position_x: 50, position_y: isStarter ? (teamId===homeTeam.id ? 75 : 25) : 50,
      });
      onAdded(mp);
    } catch (e) {
      setErr(e?.response?.data?.error || "Xatolik yuz berdi");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background:'var(--bg3)', border:'1px solid var(--border-2)',
      borderRadius:'var(--r-lg)', padding:20, marginBottom:16,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:14, color:'var(--tx1)' }}>
          Futbolchi qo'shish
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)' }}>
          <IcoClose/>
        </button>
      </div>
      {err && <div style={{ background:'var(--red-dim)', border:'1px solid var(--red-glow)', color:'var(--red-light)', padding:'8px 12px', borderRadius:'var(--r-sm)', fontSize:12, marginBottom:12 }}>{err}</div>}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <select className="form-select" style={{ flex:1, minWidth:120 }} value={teamId} onChange={e=>setTeamId(Number(e.target.value))}>
          <option value={homeTeam.id}>{homeTeam.name}</option>
          <option value={awayTeam.id}>{awayTeam.name}</option>
        </select>
        <select className="form-select" style={{ flex:2, minWidth:160 }} value={playerId} onChange={e=>setPlayerId(e.target.value)}>
          <option value="">— Futbolchi tanlang —</option>
          {available.map(p => (
            <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
          ))}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--f-display)', fontSize:12, fontWeight:600, color:'var(--tx2)', whiteSpace:'nowrap' }}>
          <input type="checkbox" checked={isStarter} onChange={e=>setIsStarter(e.target.checked)}
            style={{ accentColor:'var(--red)', width:14, height:14 }}/>
          Asosiy
        </label>
        <button className="btn btn-red btn-sm" onClick={submit} disabled={loading}>
          {loading ? '...' : '+ Qo\'shish'}<span className="btn-shine"/>
        </button>
      </div>
    </div>
  );
}

// ── Goal Banner ───────────────────────────────────────────────────────────────
function GoalBanner({ event, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  const isGoal = event.event === 'GOAL' || event.event === 'OWN_GOAL';
  return (
    <div style={{
      position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)',
      zIndex:9998, textAlign:'center', pointerEvents:'none',
      animation:'smUp .4s cubic-bezier(.22,1,.36,1)',
    }}>
      <div style={{
        background: isGoal ? 'linear-gradient(135deg,#1a4a2e,#0d2d1a)' : 'linear-gradient(135deg,#4a1a1a,#2d0d0d)',
        border: `2px solid ${isGoal ? '#4ade80' : '#ef4444'}`,
        borderRadius: 16, padding:'20px 40px',
        boxShadow: `0 0 60px ${isGoal ? 'rgba(74,222,128,.5)' : 'rgba(239,68,68,.5)'}`,
      }}>
        <div style={{
          fontFamily:'Montserrat,sans-serif', fontWeight:900,
          fontSize:'clamp(28px,5vw,52px)', color: isGoal ? '#4ade80' : '#ef4444',
          letterSpacing:'-.02em', textTransform:'uppercase', lineHeight:1,
        }}>
          {isGoal ? '⚽ GOL!' : '🟥 ' + event.event.replace('_',' ')}
        </div>
        <div style={{
          fontFamily:'Montserrat,sans-serif', fontWeight:700,
          fontSize:16, color:'rgba(255,255,255,.8)', marginTop:8,
        }}>
          {event.player_name} {event.minute ? `${event.minute}'` : ''}
        </div>
        {(event.home_score !== undefined) && (
          <div style={{
            fontFamily:'Montserrat,sans-serif', fontWeight:900,
            fontSize:28, color:'#fff', marginTop:6,
          }}>
            {event.home_score} — {event.away_score}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN TACTICAL BOARD ───────────────────────────────────────────────────────
export default function TacticalBoard({ matchId, isAdmin = false }) {
  const [lineup,   setLineup]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [menu,     setMenu]     = useState(null);  // { mp, x, y }
  const [banner,   setBanner]   = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [formation,setFormation]= useState('4-4-2');
  const [applying, setApplying] = useState(false);
  const [view,     setView]     = useState('all'); // 'all' | 'home' | 'away'
  const [token,    setToken]    = useState(() => getAccessToken());
  const fieldRef = useRef(null);
  const wsRef    = useRef(null);

  useEffect(() => onAccessTokenChange(setToken), []);

  // ── Load lineup ──
  const loadLineup = useCallback(async () => {
    try {
      const data = await getMatchLineup(matchId);
      setLineup(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { loadLineup(); }, [loadLineup]);

  // ── WebSocket ──
  useEffect(() => {
    if (!isAdmin) return;
    if (!token) return;

    const base = makeWsUrl(`/ws/taktika/${matchId}/`);
    const ws = new WebSocket(`${base}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    ws.onmessage = ev => {
      try {
        const msg  = JSON.parse(ev.data);
        const data = msg.data || msg;
        if (!data.event) return;

        if (data.event === 'POSITION') {
          setLineup(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              match_players: prev.match_players.map(mp =>
                mp.id === data.player_id
                  ? { ...mp, position_x: data.position_x, position_y: data.position_y }
                  : mp
              )
            };
          });
        } else if (data.event === 'FORMATION') {
          setLineup(prev => {
            if (!prev) return prev;
            const posMap = {};
            (data.positions || []).forEach(p => { posMap[p.id] = p; });
            return {
              ...prev,
              match_players: prev.match_players.map(mp =>
                posMap[mp.id] ? { ...mp, position_x: posMap[mp.id].position_x, position_y: posMap[mp.id].position_y } : mp
              )
            };
          });
        } else if (['GOAL','OWN_GOAL','RED','YELLOW','SUB'].includes(data.event)) {
          if (['GOAL','OWN_GOAL','RED'].includes(data.event)) setBanner(data);
          setLineup(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              home_score: data.home_score ?? prev.home_score,
              away_score: data.away_score ?? prev.away_score,
              match_players: prev.match_players.map(mp => {
                if (mp.id !== data.player_id) return mp;
                if (data.event === 'RED') return { ...mp, status: 'red' };
                if (data.event === 'YELLOW') return { ...mp, status: mp.status === 'yellow' ? 'red' : 'yellow' };
                if (data.event === 'SUB') return { ...mp, status: 'sub_out' };
                return mp;
              })
            };
          });
        } else if (data.event === 'PLAYER_ADDED') {
          setLineup(prev => prev ? {
            ...prev,
            match_players: [...prev.match_players, data.player]
          } : prev);
        }
      } catch {}
    };
    return () => {
      try { ws.close(); } catch {}
    };
  }, [matchId, isAdmin, token]);

  // ── Drag end → update position ──
  const handleMove = useCallback(async (mpId, x, y) => {
    try { await updatePlayerPos(mpId, { position_x: x, position_y: y }); }
    catch {}
  }, []);

  // ── Context menu action ──
  const handleAction = useCallback(async (key) => {
    if (!menu) return;
    const mp = menu.mp;
    setMenu(null);
    if (key === 'DELETE') {
      try {
        await deleteMatchPlayer(mp.id);
        setLineup(prev => prev ? {
          ...prev,
          match_players: prev.match_players.filter(p => p.id !== mp.id)
        } : prev);
      } catch {}
      return;
    }
    try { await addPlayerEvent(mp.id, { type: key, minute: lineup?.minute || 0 }); }
    catch {}
  }, [menu, lineup]);

  // ── Apply formation ──
  const handleFormation = useCallback(async (teamId) => {
    setApplying(true);
    try { await applyFormation(matchId, { team_id: teamId, formation }); }
    catch {}
    finally { setApplying(false); }
  }, [matchId, formation]);

  // ── Player added ──
  const handleAdded = useCallback((mp) => {
    setLineup(prev => prev ? {
      ...prev,
      match_players: [...prev.match_players, mp]
    } : prev);
    setShowAdd(false);
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <div className="spinner" style={{ width:32, height:32 }}/>
    </div>
  );
  if (!lineup) return (
    <div className="empty-state"><div className="empty-state-text">O'yin topilmadi</div></div>
  );

  const allPlayers = lineup.match_players || [];
  const starters   = allPlayers.filter(p => p.is_starter);
  const bench      = allPlayers.filter(p => !p.is_starter);
  const visible    = starters.filter(p =>
    view === 'all'  ? true :
    view === 'home' ? p.team === lineup.home_team :
                      p.team === lineup.away_team
  );

  return (
    <div style={{ fontFamily:'var(--f-display)' }}>

      {/* ── SCOREBOARD ── */}
      <div style={{
        background:'var(--bg3)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', padding:'16px 20px', marginBottom:16,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:10, height:10, borderRadius:'50%',
            background: lineup.status==='live' ? 'var(--red-light)' : 'var(--tx4)',
            boxShadow: lineup.status==='live' ? '0 0 8px var(--red-glow)' : 'none',
            animation: lineup.status==='live' ? 'pulse 1.5s infinite' : 'none',
          }}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)' }}>
            {lineup.status === 'live' ? "JONLI" : lineup.status?.toUpperCase()}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:900, fontSize:15, color:'var(--tx1)' }}>{lineup.home_team_name}</div>
            <div style={{ fontSize:9, color:lineup.home_team_color||'var(--red)', fontWeight:700, letterSpacing:'.1em' }}>{lineup.home_team_short}</div>
          </div>
          <div style={{
            fontWeight:900, fontSize:28, color:'var(--tx1)',
            letterSpacing:'-.03em', lineHeight:1, minWidth:60, textAlign:'center',
            padding:'4px 16px', background:'var(--bg4)', borderRadius:'var(--r-md)',
            border:'1px solid var(--border)',
          }}>
            {lineup.home_score} — {lineup.away_score}
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:15, color:'var(--tx1)' }}>{lineup.away_team_name}</div>
            <div style={{ fontSize:9, color:lineup.away_team_color||'var(--blue)', fontWeight:700, letterSpacing:'.1em' }}>{lineup.away_team_short}</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--tx3)', fontWeight:600 }}>
          {lineup.match_date} · {lineup.stadium}
        </div>
      </div>

      {/* ── CONTROLS ── */}
      {isAdmin && (
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          <select className="form-select" style={{ width:'auto', fontSize:12 }}
            value={formation} onChange={e=>setFormation(e.target.value)}>
            {Object.entries(FORMATIONS).map(([k,v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm"
            onClick={() => handleFormation(lineup.home_team)} disabled={applying}
            style={{ borderColor: lineup.home_team_color||'var(--red)', color: lineup.home_team_color||'var(--red)' }}>
            {applying ? '...' : `${lineup.home_team_short||'Uy'} formatsiya`}
          </button>
          <button className="btn btn-ghost btn-sm"
            onClick={() => handleFormation(lineup.away_team)} disabled={applying}
            style={{ borderColor: lineup.away_team_color||'var(--blue)', color: lineup.away_team_color||'var(--blue)' }}>
            {applying ? '...' : `${lineup.away_team_short||'Mehmon'} formatsiya`}
          </button>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button className="btn btn-red btn-sm" onClick={() => setShowAdd(v => !v)}>
              {showAdd ? '✕' : '+ Futbolchi'}<span className="btn-shine"/>
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW FILTER ── */}
      <div className="filter-tabs" style={{ marginBottom:12 }}>
        {[['all','Barchasi'],['home','Uy jamoasi'],['away','Mehmon']].map(([k,n]) => (
          <button key={k} className={`filter-tab ${view===k?'active':''}`} onClick={() => setView(k)}>{n}</button>
        ))}
      </div>

      {/* ── ADD PLAYER PANEL ── */}
      {showAdd && isAdmin && (
        <AddPlayerPanel
          matchId={matchId}
          homeTeam={{ id: lineup.home_team, name: lineup.home_team_name }}
          awayTeam={{ id: lineup.away_team, name: lineup.away_team_name }}
          homePlayers={lineup.home_available || []}
          awayPlayers={lineup.away_available || []}
          onAdded={handleAdded}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* ── FIELD ── */}
      <div ref={fieldRef} style={{ position:'relative' }}>
        <Field>
          {/* Team labels */}
          <div style={{
            position:'absolute', top:6, left:'50%', transform:'translateX(-50%)',
            display:'flex', gap:20, zIndex:5, pointerEvents:'none',
          }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:800, letterSpacing:'.15em', textTransform:'uppercase', color:lineup.home_team_color||'#fff', textShadow:'0 1px 4px rgba(0,0,0,.8)', opacity:.85 }}>
              ▲ {lineup.home_team_short}
            </span>
          </div>
          <div style={{
            position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)',
            zIndex:5, pointerEvents:'none',
          }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:800, letterSpacing:'.15em', textTransform:'uppercase', color:lineup.away_team_color||'#60a5fa', textShadow:'0 1px 4px rgba(0,0,0,.8)', opacity:.85 }}>
              ▼ {lineup.away_team_short}
            </span>
          </div>

          {/* Players */}
          {visible.map(mp => (
            <PlayerAvatar
              key={mp.id}
              mp={mp}
              fieldRef={fieldRef}
              onMove={isAdmin ? handleMove : () => {}}
              onMenu={(e, mp) => setMenu({ mp, x: e.clientX, y: e.clientY })}
              isAdmin={isAdmin}
            />
          ))}
        </Field>
      </div>

      {/* ── BENCH ── */}
      {bench.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:8 }}>
            Zaxira ({bench.length})
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {bench.map(mp => {
              const color = mp.team_color || '#cc1a2e';
              return (
                <div key={mp.id}
                  onContextMenu={e => { e.preventDefault(); isAdmin && setMenu({ mp, x: e.clientX, y: e.clientY }); }}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    background:'var(--bg3)', border:`1px solid ${color}33`,
                    borderRadius:'var(--r-sm)', padding:'6px 10px', cursor: isAdmin ? 'context-menu' : 'default',
                    ...STATUS_STYLE[mp.status],
                  }}>
                  <div style={{
                    width:24, height:24, borderRadius:'50%',
                    background:`linear-gradient(145deg,${color},${color}88)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, color:'#fff', flexShrink:0,
                  }}>
                    {mp.shirt_number||mp.player_number||'?'}
                  </div>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:11, fontWeight:700, color:'var(--tx2)' }}>
                    {mp.player_name}
                  </span>
                  {mp.status==='sub_out' && <span style={{ fontSize:9, color:'#3b82f6' }}>↓</span>}
                  {mp.status==='yellow'  && <IcoYellow/>}
                  {mp.status==='red'     && <IcoRed/>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CONTEXT MENU ── */}
      {menu && (
        <ContextMenu
          mp={menu.mp}
          x={menu.x}
          y={menu.y}
          onAction={handleAction}
          onClose={() => setMenu(null)}
        />
      )}

      {/* ── GOAL BANNER ── */}
      {banner && (
        <GoalBanner event={banner} onDone={() => setBanner(null)}/>
      )}
    </div>
  );
}
