import { useState, useEffect, useRef } from 'react';
import { Plus, PencilSimple, FloppyDisk, X, Trash, Play, Pause, Square, Clock, ArrowsLeftRight, Warning } from '@phosphor-icons/react';
import {
  getOyinlar, getJamoalar, getMavsumlar,
  adminBoshlash, adminBirinchiYarimQoshimcha, adminTanaffus,
  adminIkkinchiYarim, adminIkkinchiYarimQoshimcha, adminTugatish,
  adminHisobYangilash, adminHodisaQoshish, adminHodisaOchirish,
  adminOyinYaratish, adminOyinOchirish,
  getMatchLineup
} from '../lib/api';
import { makeWsUrl } from '../lib/ws';
import { getMatchClock, isMatchClockRunning } from '../lib/matchClock';

const HODISA_TURLARI = ['goal', 'penalty', 'own_goal', 'yellow', 'red', 'sub'];
const HODISA_NOMI = {
  goal:'Gol', penalty:'Penalti', own_goal:"O'z goli",
  yellow:'Sariq karta', red:'Qizil karta', sub:'Almashtirish', assist:'Assist'
};

const PHASE_LABEL = {
  not_started: { t: 'Boshlanmagan',   c: 'var(--tx3)' },
  first_half:  { t: '1-Yarim',        c: '#22c55e' },
  half_time:   { t: 'TANAFFUS',       c: '#f59e0b' },
  second_half: { t: '2-Yarim',        c: '#22c55e' },
  extra_time:  { t: "Qo'shimcha vaqt",c: '#f97316' },
  finished:    { t: 'Tugagan',        c: 'var(--tx3)' },
};

const HOLATLAR = [
  { q:'upcoming',    n:'Kutilmoqda' },
  { q:'live',        n:'Jonli' },
  { q:'half_time',   n:'TANAFFUS' },
  { q:'second_half', n:'2-Yarim' },
  { q:'extra_time',  n:"Qo'shimcha" },
  { q:'finished',    n:'Tugagan' },
];

const holatRangi = {
  live:'#22c55e', half_time:'#f59e0b', second_half:'#22c55e',
  extra_time:'#f97316', finished:'var(--tx3)', upcoming:'var(--tx3)'
};

function formatClock(minute, extra, second) {
  const ss = String(Math.max(0, Number(second || 0))).padStart(2, '0');
  if (Number(extra || 0) > 0) return `${minute}+${extra}:${ss}`;
  return `${minute}:${ss}`;
}

// ─── Client-side elapsed timer (seconds since phase_started_at) ───────────────
function useElapsed(phaseStartedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!phaseStartedAt) { setElapsed(0); return; }
    const tick = () => {
      const diff = (Date.now() - new Date(phaseStartedAt).getTime()) / 1000;
      setElapsed(Math.max(0, diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phaseStartedAt]);
  return elapsed;
}

// ─── TANAFFUS countdown ───────────────────────────────────────────────────────
function TanaffusCountdown({ startedAt, duration }) {
  const [rem, setRem] = useState(null);
  useEffect(() => {
    const tick = () => {
      const end = new Date(startedAt).getTime() + duration * 60000;
      setRem(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startedAt, duration]);
  if (rem === null) return null;
  const m = Math.floor(rem / 60), s = rem % 60;
  return (
    <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'#f59e0b', marginLeft:8 }}>
      {rem > 0 ? `⏱ ${m}:${String(s).padStart(2,'0')} qoldi` : '✅ TANAFFUS tugadi'}
    </span>
  );
}

// ─── Lifecycle Panel ──────────────────────────────────────────────────────────
// Qat'iy oqim:
// not_started
//   → [O'yinni boshlash] → birinchi yarim davomiyligini so'rash → boshlash
// first_half (timer ishlayapti)
//   → vaqt TUGAGACH → [1-yarimni tugatish] tugmasi paydo bo'ladi
//   → 1-yarim qo'shimcha vaqtini so'rash (0 bo'lishi mumkin)
//   → TANAFFUS davomiyligini so'rash
//   → TANAFFUS boshlash
// half_time (countdown)
//   → TANAFFUS tugagach YOKI [2-yarimni boshlash] tugmasi
//   → 2-yarim davomiyligini so'rash → boshlash
// second_half (timer ishlayapti)
//   → vaqt TUGAGACH → [2-yarimni tugatish] paydo bo'ladi
//   → 2-yarim qo'shimcha vaqtini so'rash (0 bo'lishi mumkin)
//   → [O'yinni yakunlash?] tasdiqi
// extra_time → [O'yinni yakunlash] tasdiqi
// finished

function LifecyclePanel({ oyin, onUpdate, flash }) {
  const [modal, setModal]   = useState(null);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  // Elapsed seconds for timer-gated buttons
  const elapsed = useElapsed(oyin.phase_started_at);
  const firstHalfTotal  = ((oyin.first_half_duration  || 45) + (oyin.first_half_extra  || 0)) * 60;
  const secondHalfTotal = ((oyin.second_half_duration || 45) + (oyin.second_half_extra || 0)) * 60;

  // Vaqt tugadimi?
  const firstHalfDone  = oyin.phase === 'first_half'  && elapsed >= firstHalfTotal;
  const secondHalfDone = oyin.phase === 'second_half' && elapsed >= secondHalfTotal;

  const act = async (fn, payload = {}) => {
    setLoading(true);
    try {
      const updated = await fn(oyin.id, payload);
      onUpdate(updated);
      flash('Yangilandi');
      setModal(null);
      setInput('');
    } catch { flash('Xatolik', 'xato'); }
    setLoading(false);
  };

  const phase = oyin.phase || 'not_started';
  const liveClock = getMatchClock(oyin);

  return (
    <div style={{
      background:'rgba(0,0,0,.25)', border:'1px solid var(--border)',
      borderRadius:'var(--r-md)', padding:16, marginBottom:16
    }}>
      {/* Joriy faza */}
      <div style={{
        fontFamily:'var(--f-display)', fontSize:10, fontWeight:700,
        letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)',
        marginBottom:12, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'
      }}>
        <Clock size={11}/>Joriy faza:
        <span style={{ color: PHASE_LABEL[phase]?.c, fontWeight:900 }}>
          {PHASE_LABEL[phase]?.t}
        </span>

        {/* Jonli timer */}
        {['first_half','second_half'].includes(phase) && (
          <span className="badge badge-red">
            <span className="live-dot"/>
            {formatClock(liveClock.minute, liveClock.extra, liveClock.second)}
          </span>
        )}

        {/* TANAFFUS badge + countdown */}
        {phase === 'half_time' && (
          <>
            <span className="badge" style={{ background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.4)', color:'#f59e0b' }}>
              TANAFFUS
            </span>
            {oyin.half_time_started_at && (
              <TanaffusCountdown
                startedAt={oyin.half_time_started_at}
                duration={oyin.half_time_duration || 15}
              />
            )}
          </>
        )}

        {/* Extra time badge */}
        {phase === 'extra_time' && (
          <span className="badge" style={{ background:'rgba(249,115,22,.12)', border:'1px solid rgba(249,115,22,.4)', color:'#f97316' }}>
            QO'SHIMCHA VAQT В· {formatClock(liveClock.minute, liveClock.extra, liveClock.second)}
          </span>
        )}
      </div>

      {/* Tugmalar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>

        {/* NOT STARTED → Boshlash */}
        {phase === 'not_started' && (
          <button className="btn btn-red btn-sm" onClick={() => { setModal('boshlash'); setInput('45'); }}>
            <Play size={12} fill="currentColor"/>O'yinni boshlash<span className="btn-shine"/>
          </button>
        )}

        {/* FIRST HALF → tugma faqat vaqt tugaganda ko'rinadi */}
        {phase === 'first_half' && !firstHalfDone && (
          <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)', display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={11}/>
            1-yarim davom etmoqda... ({oyin.first_half_duration ?? 45} daqiqa)
          </div>
        )}
        {phase === 'first_half' && firstHalfDone && (
          <button className="btn btn-gold btn-sm" onClick={() => { setModal('birinchi_qoshimcha'); setInput('0'); }}>
            <Pause size={12}/>1-yarimni tugatish<span className="btn-shine"/>
          </button>
        )}

        {/* HALF TIME → 2-yarimni boshlash */}
        {phase === 'half_time' && (
          <button className="btn btn-red btn-sm" onClick={() => { setModal('ikkinchi_yarim'); setInput('45'); }}>
            <Play size={12} fill="currentColor"/>2-yarimni boshlash<span className="btn-shine"/>
          </button>
        )}

        {/* SECOND HALF → tugma faqat vaqt tugaganda */}
        {phase === 'second_half' && !secondHalfDone && (
          <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)', display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={11}/>
            2-yarim davom etmoqda... ({oyin.second_half_duration ?? 45} daqiqa)
          </div>
        )}
        {phase === 'second_half' && secondHalfDone && (
          <button className="btn btn-gold btn-sm" onClick={() => { setModal('ikkinchi_qoshimcha'); setInput('0'); }}>
            <Pause size={12}/>2-yarimni tugatish<span className="btn-shine"/>
          </button>
        )}

        {/* EXTRA TIME → yakunlash */}
        {phase === 'extra_time' && (
          <button className="btn btn-sm"
            style={{ background:'var(--red-dim)', border:'1px solid var(--red-glow)', color:'var(--red-light)' }}
            onClick={() => setModal('tugatish')}>
            <Square size={12}/>O'yinni yakunlash
          </button>
        )}
      </div>

      {/* Modal qutisi */}
      {modal && (
        <div style={{ marginTop:14, padding:16, background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)' }}>

          {/* O'yinni boshlash → 1-yarim davomiyligi */}
          {modal === 'boshlash' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, color:'var(--tx1)', marginBottom:6 }}>
                1-yarim davomiyligini kiriting (daqiqa)
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" className="form-input" style={{ width:90, fontFamily:'var(--f-mono)' }}
                  value={input} onChange={e => setInput(e.target.value)} min={1} max={60}/>
                <button className="btn btn-red btn-sm" disabled={loading}
                  onClick={() => act(adminBoshlash, { first_half_duration: parseInt(input || 45) })}>
                  <Play size={12}/>Boshlash<span className="btn-shine"/>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
              </div>
            </div>
          )}

          {/* 1-yarim qo'shimcha vaqti */}
          {modal === 'birinchi_qoshimcha' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, color:'var(--tx1)', marginBottom:4 }}>
                1-yarim qo'shimcha vaqti (daqiqa)
              </div>
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx4)', marginBottom:10 }}>
                Qo'shimcha vaqt yo'q bo'lsa 0 kiriting
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14 }}>
                <input type="number" className="form-input" style={{ width:90, fontFamily:'var(--f-mono)' }}
                  value={input} onChange={e => setInput(e.target.value)} min={0} max={15}/>
                <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)' }}>daqiqa</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-gold btn-sm" disabled={loading}
                  onClick={async () => {
                    const extra = parseInt(input || 0);
                    setLoading(true);
                    try {
                      await adminBirinchiYarimQoshimcha(oyin.id, { extra });
                      flash('Belgilandi');
                    } catch { flash('Xatolik', 'xato'); }
                    setLoading(false);
                    setInput('15');
                    setModal('tanaffus_davom');
                  }}>
                  Keyingi: TANAFFUS<span className="btn-shine"/>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
              </div>
            </div>
          )}

          {/* TANAFFUS davomiyligi */}
          {modal === 'tanaffus_davom' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, color:'#f59e0b', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                <Pause size={13}/>TANAFFUS davomiyligini kiriting (daqiqa)
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" className="form-input" style={{ width:90, fontFamily:'var(--f-mono)' }}
                  value={input} onChange={e => setInput(e.target.value)} min={1} max={30}/>
                <button className="btn btn-sm"
                  style={{ background:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.4)', color:'#f59e0b' }}
                  disabled={loading}
                  onClick={() => act(adminTanaffus, { half_time_duration: parseInt(input || 15) })}>
                  TANAFFUS boshlash
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
              </div>
            </div>
          )}

          {/* 2-yarim davomiyligi */}
          {modal === 'ikkinchi_yarim' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, color:'var(--tx1)', marginBottom:6 }}>
                2-yarim davomiyligini kiriting (daqiqa)
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" className="form-input" style={{ width:90, fontFamily:'var(--f-mono)' }}
                  value={input} onChange={e => setInput(e.target.value)} min={1} max={60}/>
                <button className="btn btn-red btn-sm" disabled={loading}
                  onClick={() => act(adminIkkinchiYarim, { second_half_duration: parseInt(input || 45) })}>
                  <Play size={12}/>Boshlash<span className="btn-shine"/>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
              </div>
            </div>
          )}

          {/* 2-yarim qo'shimcha vaqti */}
          {modal === 'ikkinchi_qoshimcha' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:13, color:'var(--tx1)', marginBottom:4 }}>
                2-yarim qo'shimcha vaqti (daqiqa)
              </div>
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx4)', marginBottom:10 }}>
                Qo'shimcha vaqt yo'q bo'lsa 0 kiriting — keyin o'yin yakunlanadi
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14 }}>
                <input type="number" className="form-input" style={{ width:90, fontFamily:'var(--f-mono)' }}
                  value={input} onChange={e => setInput(e.target.value)} min={0} max={15}/>
                <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)' }}>daqiqa</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-gold btn-sm" disabled={loading}
                  onClick={async () => {
                    const extra = parseInt(input || 0);
                    setLoading(true);
                    try {
                      if (extra > 0) {
                        await adminIkkinchiYarimQoshimcha(oyin.id, { extra });
                        flash("Qo'shimcha vaqt belgilandi");
                      }
                    } catch { flash('Xatolik', 'xato'); }
                    setLoading(false);
                    setModal('tugatish');
                  }}>
                  Keyingi: O'yinni yakunlash<span className="btn-shine"/>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
              </div>
            </div>
          )}

          {/* O'yinni yakunlash tasdiqi */}
          {modal === 'tugatish' && (
            <div>
              <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:14, color:'var(--tx1)', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                <Warning size={16} color="var(--red-light)"/>O'yinni yakunlashni tasdiqlaysizmi?
              </div>
              <div style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--tx3)', marginBottom:16, padding:'10px 14px', background:'rgba(255,255,255,.03)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
                {oyin.home_team_name}{' '}
                <strong style={{ color:'var(--tx1)', fontFamily:'var(--f-display)', fontSize:18 }}>
                  {oyin.home_score} – {oyin.away_score}
                </strong>{' '}
                {oyin.away_team_name}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Bekor</button>
                <button className="btn btn-sm"
                  style={{ background:'var(--red-dim)', border:'1px solid var(--red-glow)', color:'var(--red-light)' }}
                  disabled={loading} onClick={() => act(adminTugatish)}>
                  <Square size={12}/>Ha, yakunlash
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Smart Event Form ─────────────────────────────────────────────────────────
function HodisaForma({ oyin, onAdded, flash }) {
  const [forma, setForma] = useState({
    event_type:'', player_name:'', team:'', minute:'',
    extra_minute:0, assist_player:'', player_out:''
  });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [playersByTeam, setPlayersByTeam] = useState({});
  const [playersLoading, setPlayersLoading] = useState(false);

  const isGoal    = ['goal','penalty'].includes(forma.event_type);
  const isSub     = forma.event_type === 'sub';
  const teamPlayers = forma.team ? (playersByTeam[String(forma.team)] || []) : [];
  const showPlayerSelect = Boolean(forma.team) && (playersLoading || teamPlayers.length > 0);

  useEffect(() => {
    let ignore = false;
    setPlayersLoading(true);
    getMatchLineup(oyin.id)
      .then((data) => {
        if (ignore) return;
        const homeId = String(data.home_team || '');
        const awayId = String(data.away_team || '');

        const sortPlayers = (a, b) => {
          const an = Number(a.number || 0);
          const bn = Number(b.number || 0);
          if (an && bn) return an - bn;
          if (an) return -1;
          if (bn) return 1;
          return String(a.name || '').localeCompare(String(b.name || ''));
        };

        const mk = (id, name, number = 0) => ({
          id: (id === null || id === undefined) ? '' : String(id),
          name: String(name || '').trim(),
          number: Number(number || 0),
        });

        const addAll = (map, arr) => {
          for (const p of arr) {
            if (!p?.id || !p?.name) continue;
            map.set(String(p.id), p);
          }
        };

        const homeMap = new Map();
        const awayMap = new Map();

        const mps = Array.isArray(data.match_players) ? data.match_players : [];
        for (const mp of mps) {
          const t = String(mp.team || '');
          const pl = mk(mp.player, mp.player_name, mp.shirt_number || mp.player_number || 0);
          if (!pl.id || !pl.name) continue;
          if (t === homeId) homeMap.set(pl.id, pl);
          if (t === awayId) awayMap.set(pl.id, pl);
        }

        const homeAvail = (Array.isArray(data.home_available) ? data.home_available : [])
          .map(p => mk(p.id, p.name, p.number || 0));
        const awayAvail = (Array.isArray(data.away_available) ? data.away_available : [])
          .map(p => mk(p.id, p.name, p.number || 0));

        addAll(homeMap, homeAvail);
        addAll(awayMap, awayAvail);

        const byTeam = {};
        if (homeId) byTeam[homeId] = Array.from(homeMap.values()).sort(sortPlayers);
        if (awayId) byTeam[awayId] = Array.from(awayMap.values()).sort(sortPlayers);
        setPlayersByTeam(byTeam);
      })
      .catch(() => {
        if (ignore) return;
        setPlayersByTeam({});
      })
      .finally(() => {
        if (ignore) return;
        setPlayersLoading(false);
      });

    return () => { ignore = true; };
  }, [oyin.id]);

  const qoshish = async () => {
    if (!forma.player_name || !forma.event_type || !forma.team || !forma.minute) return;
    setSaqlanmoqda(true);
    try {
      await adminHodisaQoshish(oyin.id, {
        player_name:   forma.player_name,
        event_type:    forma.event_type,
        team:          parseInt(forma.team),
        minute:        parseInt(forma.minute),
        extra_minute:  parseInt(forma.extra_minute || 0),
        assist_player: forma.assist_player || '',
        player_out:    forma.player_out || '',
      });
      flash("Hodisa qo'shildi");
      setForma({ event_type:'', player_name:'', team:'', minute:'', extra_minute:0, assist_player:'', player_out:'' });
      onAdded();
    } catch { flash('Xatolik', 'xato'); }
    setSaqlanmoqda(false);
  };

  return (
    <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginTop:16 }}>
      <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:10 }}>
        Hodisa qo'shish
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:8, marginBottom:8 }}>
        <select className="form-select" value={forma.event_type}
          onChange={e => setForma(p => ({ ...p, event_type: e.target.value }))}>
          <option value="">Hodisa turi</option>
          {HODISA_TURLARI.map(t => <option key={t} value={t}>{HODISA_NOMI[t]}</option>)}
        </select>
        <select className="form-select" value={forma.team}
          onChange={e => setForma(p => ({ ...p, team: e.target.value, player_name:'', assist_player:'', player_out:'' }))}>
          <option value="">Jamoa</option>
          <option value={oyin.home_team}>{oyin.home_team_name}</option>
          <option value={oyin.away_team}>{oyin.away_team_name}</option>
        </select>
        {showPlayerSelect ? (
          <select className="form-select"
            value={forma.player_name}
            disabled={playersLoading || teamPlayers.length === 0}
            onChange={e => setForma(p => ({ ...p, player_name: e.target.value }))}>
            <option value="">
              {playersLoading
                ? "Futbolchilar yuklanmoqda..."
                : (isSub ? "Kiruvchi futbolchini tanlang" : "Futbolchini tanlang")}
            </option>
            {teamPlayers.map(p => (
              <option key={p.id} value={p.name}>
                {p.number ? `${p.number}. ${p.name}` : p.name}
              </option>
            ))}
          </select>
        ) : (
          <input className="form-input" placeholder={isSub ? "Kiruvchi futbolchi" : "Futbolchi ismi"}
            value={forma.player_name}
            onChange={e => setForma(p => ({ ...p, player_name: e.target.value }))} />
        )}
        <input type="number" className="form-input" placeholder="Daqiqa" min={1} max={120}
          value={forma.minute} onChange={e => setForma(p => ({ ...p, minute: e.target.value }))}
          style={{ fontFamily:'var(--f-mono)' }}/>
      </div>

      {/* Qo'shimcha maydonlar — hodisa turiga qarab */}
      {isGoal && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:4 }}>
              Assist (ixtiyoriy)
            </label>
            <input className="form-input" placeholder="Assist bergan futbolchi..."
              value={forma.assist_player}
              onChange={e => setForma(p => ({ ...p, assist_player: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:4 }}>
              Qo'shimcha daqiqa
            </label>
            <input type="number" className="form-input" min={0} max={10}
              value={forma.extra_minute}
              onChange={e => setForma(p => ({ ...p, extra_minute: e.target.value }))}
              style={{ fontFamily:'var(--f-mono)' }}/>
          </div>
        </div>
      )}

      {isSub && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:4 }}>
              Chiquvchi futbolchi
            </label>
            <input className="form-input" placeholder="Kimning o'rniga..."
              value={forma.player_out}
              onChange={e => setForma(p => ({ ...p, player_out: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:600, color:'var(--tx3)', display:'block', marginBottom:4 }}>
              Qo'shimcha daqiqa
            </label>
            <input type="number" className="form-input" min={0} max={10}
              value={forma.extra_minute}
              onChange={e => setForma(p => ({ ...p, extra_minute: e.target.value }))}
              style={{ fontFamily:'var(--f-mono)' }}/>
          </div>
        </div>
      )}

      <button className="btn btn-gold btn-sm" onClick={qoshish} disabled={saqlanmoqda}>
        <Plus size={12}/>Hodisa qo'shish<span className="btn-shine"/>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOyinlar() {
  const [oyinlar, setOyinlar]     = useState([]);
  const [qidiruv, setQidiruv]     = useState('');
  const [statusFilter, setStatusFilter] = useState('barchasi');
  const [sahifa, setSahifa]       = useState(1);
  const SAHIFADA = 15;
  const [jamoalar, setJamoalar]   = useState([]);
  const [mavsumlar, setMavsumlar] = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [tahrirlash, setTahrirlash]   = useState(null);
  const [tahrirlashMa, setTahrirlashMa] = useState({});
  const [yangiOyin, setYangiOyin] = useState(false);
  const [yangiForma, setYangiForma] = useState({ status:'upcoming', home_score:0, away_score:0, minute:0, week:1 });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xabar, setXabar]         = useState(null);
  const [nowMs, setNowMs]         = useState(Date.now());
  const hasRunningClock = oyinlar.some(isMatchClockRunning);

  useEffect(() => {
    if (!hasRunningClock) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasRunningClock]);

  const flash = (matn, tur='muvaffaqiyat') => {
    setXabar({ matn, tur }); setTimeout(() => setXabar(null), 3500);
  };

  const qaytaYuklash = () =>
    getOyinlar({}).then(d => { setOyinlar(d.results || d || []); return d; });

  useEffect(() => {
    Promise.all([
      getOyinlar({}).then(d => d.results || d || []),
      getJamoalar({}).then(d => d.results || d || []),
      getMavsumlar().then(d => d.results || d || []),
    ]).then(([oy, ja, ma]) => {
      setOyinlar(oy); setJamoalar(ja); setMavsumlar(ma); setYuklanmoqda(false);
    });
  }, []);

  // WS — jonli o'yinlarni real-time yangilash
  useEffect(() => {
    const live = oyinlar.filter(o => ['live','half_time','second_half','extra_time'].includes(o.status));
    if (!live.length) return;
    const sockets = live.map(o => {
      const ws = new WebSocket(makeWsUrl(`/ws/oyin/${o.id}/`));
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'match_update') {
            setOyinlar(prev => prev.map(m => m.id === msg.data.id ? { ...m, ...msg.data } : m));
          }
        } catch {}
      };
      return ws;
    });
    return () => sockets.forEach(ws => ws.close());
  }, [oyinlar.map(o=>o.id+o.status).join(',')]);

  const hisobSaqlash = async (oyin) => {
    setSaqlanmoqda(true);
    try {
      const yangi = await adminHisobYangilash(oyin.id, {
        home_score: parseInt(tahrirlashMa.home_score ?? oyin.home_score),
        away_score: parseInt(tahrirlashMa.away_score ?? oyin.away_score),
        minute:     parseInt(tahrirlashMa.minute ?? oyin.minute),
        status:     tahrirlashMa.status || oyin.status,
      });
      setOyinlar(oy => oy.map(o => o.id === oyin.id ? { ...o, ...yangi } : o));
      flash("Saqlandi");
    } catch { flash("Xatolik", 'xato'); }
    setSaqlanmoqda(false);
  };

  const hodisaOchirish = async (oyinId, hodisaId) => {
    if (!confirm("Bu hodisani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await adminHodisaOchirish(oyinId, { hodisa_id: hodisaId });
      flash("O'chirildi");
      qaytaYuklash();
    } catch { flash("Xatolik", 'xato'); }
  };

  const oyinYaratish = async () => {
    if (!yangiForma.home_team || !yangiForma.away_team || !yangiForma.match_date || !yangiForma.match_time || !yangiForma.season) {
      flash("Barcha majburiy maydonlarni to'ldiring", 'xato'); return;
    }
    setSaqlanmoqda(true);
    try {
      await adminOyinYaratish(yangiForma);
      flash("O'yin yaratildi");
      setYangiOyin(false);
      setYangiForma({ status:'upcoming', home_score:0, away_score:0, minute:0, week:1 });
      qaytaYuklash();
    } catch (e) {
      flash(e?.response?.data ? JSON.stringify(e.response.data) : "Xatolik", 'xato');
    }
    setSaqlanmoqda(false);
  };

  const oyinOchirish = async (id) => {
    if (!confirm("Bu o'yinni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await adminOyinOchirish(id);
      flash("O'chirildi");
      qaytaYuklash();
    } catch { flash("Xatolik", 'xato'); }
  };

  const filtrlangan = oyinlar.filter(o => {
    const qMatch = !qidiruv ||
      o.home_team_name?.toLowerCase().includes(qidiruv.toLowerCase()) ||
      o.away_team_name?.toLowerCase().includes(qidiruv.toLowerCase());
    const sMatch = statusFilter === 'barchasi' || o.status === statusFilter;
    return qMatch && sMatch;
  });
  const jami = filtrlangan.length;
  const satr = filtrlangan.slice((sahifa - 1) * SAHIFADA, sahifa * SAHIFADA);
  const sarifalar = Math.ceil(jami / SAHIFADA);

  if (yuklanmoqda) return <div className="loading-center"><div className="spinner"/></div>;

  return (
    <div>
      {xabar && (
        <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>O'yinlar ({jami})</h2>
        </div>
        <button className="btn btn-red btn-md" onClick={() => setYangiOyin(v => !v)}>
          {yangiOyin ? <X size={14}/> : <Plus size={14}/>}
          {yangiOyin ? 'Bekor' : "Yangi o'yin"}
          <span className="btn-shine"/>
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <input
          className="form-input"
          placeholder="🔍 Jamoa nomi bo'yicha qidirish..."
          value={qidiruv}
          onChange={e => { setQidiruv(e.target.value); setSahifa(1); }}
          style={{ flex:'1', minWidth:200, maxWidth:320 }}
        />
        <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSahifa(1); }} style={{ width:160 }}>
          <option value="barchasi">Barcha holatlar</option>
          <option value="upcoming">Kutilmoqda</option>
          <option value="live">Jonli</option>
          <option value="half_time">Tanaffus</option>
          <option value="second_half">2-Yarim</option>
          <option value="extra_time">Qo'shimcha vaqt</option>
          <option value="finished">Tugagan</option>
        </select>
        <span style={{ color:'var(--tx3)', fontSize:12, alignSelf:'center' }}>{jami} ta o'yin</span>
      </div>

      {/* Yangi o'yin formasi */}
      {yangiOyin && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">Yangi o'yin yaratish</div>
          <div className="form-grid">
            {[
              { nom:'Mavsum *', kalit:'season', tur:'select', opts: mavsumlar.filter(m => !m.is_archived).map(m => ({ v:m.id, n:m.name + (m.is_active ? ' ✓ Faol' : '') })) },
              { nom:'Uy jamoasi *', kalit:'home_team', tur:'select', opts: jamoalar.map(j => ({ v:j.id, n:j.name })) },
              { nom:'Mehmon jamoasi *', kalit:'away_team', tur:'select', opts: jamoalar.map(j => ({ v:j.id, n:j.name })) },
              { nom:'Sana *', kalit:'match_date', tur:'date' },
              { nom:'Vaqt *', kalit:'match_time', tur:'time' },
              { nom:'Hafta', kalit:'week', tur:'number' },
              { nom:'Stadium', kalit:'stadium', tur:'text', pl:'TATU Maydon' },
            ].map(({ nom, kalit, tur, opts, pl }) => (
              <div className="form-group" key={kalit}>
                <label className="form-label">{nom}</label>
                {tur === 'select' ? (
                  <select className="form-select" value={yangiForma[kalit]||''}
                    onChange={e => setYangiForma(p => ({ ...p, [kalit]: e.target.value }))}>
                    <option value="">Tanlang...</option>
                    {(opts||[]).map(o => <option key={o.v} value={o.v}>{o.n}</option>)}
                  </select>
                ) : (
                  <input type={tur} className="form-input" placeholder={pl}
                    value={yangiForma[kalit]||''}
                    onChange={e => setYangiForma(p => ({ ...p, [kalit]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setYangiOyin(false)}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={oyinYaratish} disabled={saqlanmoqda}>
              <FloppyDisk size={13}/>{saqlanmoqda ? 'Saqlanmoqda...' : "O'yin yaratish"}<span className="btn-shine"/>
            </button>
          </div>
        </div>
      )}

      {/* O'yinlar ro'yxati */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {satr.length === 0 && (
          <div className="empty-state"><div className="empty-state-icon">⚽</div><div className="empty-state-text">{qidiruv || statusFilter !== 'barchasi' ? "Qidiruv bo'yicha natija topilmadi" : "Hali o'yin yo'q"}</div></div>
        )}
        {satr.map(oyin => {
          const isLive = ['live','half_time','second_half','extra_time'].includes(oyin.status);
          const phaseInfo = PHASE_LABEL[oyin.phase || 'not_started'];
          const liveClock = getMatchClock(oyin, nowMs);
          return (
            <div key={oyin.id} style={{
              background:'var(--bg3)',
              border:`1px solid ${isLive ? 'var(--red-glow)' : 'var(--border)'}`,
              borderRadius:'var(--r-lg)', overflow:'hidden',
              transition:'border-color .2s'
            }}>
              {/* Sarlavha */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', flexWrap:'wrap' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background: holatRangi[oyin.status] || 'var(--tx4)',
                  boxShadow: isLive ? `0 0 8px ${holatRangi[oyin.status]}` : 'none'
                }}/>
                <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:14, color:'var(--tx1)', flex:1, minWidth:180 }}>
                  {oyin.home_team_name} <span style={{ color:'var(--tx3)' }}>vs</span> {oyin.away_team_name}
                </div>
                <div style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:20, color:'var(--tx1)', letterSpacing:'-.02em' }}>
                  {oyin.home_score} – {oyin.away_score}
                </div>
                {isLive && oyin.phase !== 'half_time' && (
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:12, color: phaseInfo.c, fontWeight:700 }}>
                    {formatClock(liveClock.minute, liveClock.extra, liveClock.second)}
                  </span>
                )}
                {oyin.phase === 'half_time' && (
                  <span style={{ fontFamily:'var(--f-display)', fontSize:11, fontWeight:800, color:'#f59e0b' }}>TANAFFUS</span>
                )}
                <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)' }}>
                  {oyin.week}-hafta · {oyin.match_date}
                </div>
                <span className="badge" style={{ fontSize:9, color: phaseInfo.c, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' }}>
                  {HOLATLAR.find(h => h.q === oyin.status)?.n || oyin.status}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-xs"
                    onClick={() => { setTahrirlash(tahrirlash === oyin.id ? null : oyin.id); setTahrirlashMa({}); }}>
                    {tahrirlash === oyin.id ? <X size={12}/> : <PencilSimple size={12}/>}
                    {tahrirlash === oyin.id ? 'Yopish' : 'Tahrirlash'}
                  </button>
                  <button className="btn btn-ghost btn-xs" onClick={() => oyinOchirish(oyin.id)} style={{ color:'var(--red-light)' }}>
                    <Trash size={12}/>
                  </button>
                </div>
              </div>

              {/* Tahrirlash paneli */}
              {tahrirlash === oyin.id && (
                <div style={{ borderTop:'1px solid var(--border)', padding:18, background:'rgba(255,255,255,.01)' }}>

                  {/* Lifecycle panel — faqat tugamagan o'yinlar uchun */}
                  {oyin.status !== 'finished' && (
                    <LifecyclePanel
                      oyin={oyin}
                      onUpdate={updated => setOyinlar(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))}
                      flash={flash}
                    />
                  )}

                  {/* Qo'lda hisob o'zgartirish */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:10 }}>
                      Hisobni qo'lda o'zgartirish
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <input type="number" className="form-input"
                        style={{ width:64, textAlign:'center', fontFamily:'var(--f-display)', fontWeight:900, fontSize:16 }}
                        min={0} defaultValue={oyin.home_score}
                        onChange={e => setTahrirlashMa(p => ({ ...p, home_score: e.target.value }))}/>
                      <span style={{ color:'var(--tx3)', fontFamily:'var(--f-display)', fontSize:18 }}>–</span>
                      <input type="number" className="form-input"
                        style={{ width:64, textAlign:'center', fontFamily:'var(--f-display)', fontWeight:900, fontSize:16 }}
                        min={0} defaultValue={oyin.away_score}
                        onChange={e => setTahrirlashMa(p => ({ ...p, away_score: e.target.value }))}/>
                      <button className="btn btn-ghost btn-sm" onClick={() => hisobSaqlash(oyin)} disabled={saqlanmoqda}>
                        <FloppyDisk size={12}/>Saqlash
                      </button>
                    </div>
                  </div>

                  {/* Hodisalar ro'yxati */}
                  {oyin.events?.length > 0 && (
                    <div style={{ marginBottom:16, padding:12, background:'rgba(0,0,0,.2)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
                      <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:8 }}>
                        Hodisalar
                      </div>
                      {oyin.events.map(h => (
                        <div key={h.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--tx3)', minWidth:32 }}>
                            {h.extra_minute > 0 ? `${h.minute}+${h.extra_minute}'` : `${h.minute}'`}
                          </span>
                          <span style={{ fontFamily:'var(--f-display)', fontWeight:600, fontSize:12, color:'var(--tx1)', flex:1 }}>
                            {h.player_name}
                            {h.assist_player && <span style={{ color:'var(--tx3)', fontSize:11 }}> (A: {h.assist_player})</span>}
                            {h.player_out && <span style={{ color:'var(--tx3)', fontSize:11 }}> → {h.player_out}</span>}
                          </span>
                          <span className="badge badge-gray" style={{ fontSize:9 }}>
                            {HODISA_NOMI[h.event_type] || h.event_type}
                          </span>
                          <button onClick={() => hodisaOchirish(oyin.id, h.id)}
                            style={{ background:'none', border:'none', color:'var(--red-light)', cursor:'pointer', padding:2 }}>
                            <Trash size={11}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hodisa qo'shish formasi */}
                  <HodisaForma oyin={oyin} onAdded={qaytaYuklash} flash={flash}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sarifalar > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.max(1, p-1))} disabled={sahifa === 1}>‹ Oldingi</button>
          {Array.from({ length: sarifalar }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-xs ${p === sahifa ? 'btn-red' : 'btn-ghost'}`} onClick={() => setSahifa(p)} style={{ minWidth:32 }}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.min(sarifalar, p+1))} disabled={sahifa === sarifalar}>Keyingi ›</button>
          <span style={{ color:'var(--tx3)', fontSize:11, marginLeft:8 }}>{jami} ta o'yin</span>
        </div>
      )}
    </div>
  );
}