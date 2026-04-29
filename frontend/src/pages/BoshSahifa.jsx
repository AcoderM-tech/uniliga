/**
 * pages/BoshSahifa.jsx  –  Bosh sahifa (Production-grade)
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useBoshSahifa, BOSH_SAHIFA_KEY } from '../hooks/useBoshSahifa';
import JonliOyinKarta  from '../components/JonliOyinKarta';
import OyinKarta       from '../components/OyinKarta';
import LigaJadvali     from '../components/LigaJadvali';
import NewsStrip       from '../components/NewsStrip';
import SoccerLoading   from '../components/SoccerLoading';
import { useVisibility } from '../hooks/useVisibility';

/* ─── SVG Icons ─────────────────────────────────────────────── */
const IcoArrow = memo(() => (
  <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
    <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
  </svg>
));

const IcoPlay = memo(() => (
  <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
    <path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"/>
  </svg>
));

/* Premium minimal SVG icons for stat cards */
const IcoTrophy = memo(({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3.5a2.5 2.5 0 0 0 0 5H6"/>
    <path d="M18 9h2.5a2.5 2.5 0 0 1 0 5H18"/>
    <path d="M6 2h12v10a6 6 0 0 1-12 0z"/>
    <path d="M9 21h6"/><path d="M12 18v3"/>
  </svg>
));

const IcoCalendar = memo(({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01"/>
  </svg>
));

const IcoBall = memo(({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2c0 0 3 4 3 10s-3 10-3 10"/>
    <path d="M12 2c0 0-3 4-3 10s3 10 3 10"/>
    <path d="M2 12h20"/>
  </svg>
));

const IcoGoal = memo(({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5l6 6-6 6"/>
    <path d="M17 12H3"/>
    <path d="M21 5v14"/>
  </svg>
));

/* ─── Slides Data ────────────────────────────────────────────── */
const FALLBACK_SLIDES = [
  {
    tag: 'Rasmiy Liga',
    h1a: 'UniLiga', h1b: 'Universitet', h1c: 'Futbol Ligasi',
    desc: "TATU fakultetlari o'rtasidagi rasmiy futbol chempionati. Jonli hisoblar, jadval va yangiliklar bir joyda.",
    btn1: { label: "O'yinlarni ko'rish", yol: '/oyinlar' },
    btn2: { label: 'Jadval', yol: '/jadval' },
    bg: null,
  },
  {
    tag: 'Mavsum 2025',
    h1a: 'Kurash', h1b: 'Chempionlik', h1c: 'Uchun',
    desc: "Eng kuchli jamoalar birinchilik uchun kurashmoqda. Kim chempion bo'lishga loyiq?",
    btn1: { label: "O'yinlarni ko'rish", yol: '/oyinlar' },
    btn2: { label: 'Jamoalar', yol: '/jamoalar' },
    bg: null,
  },
  {
    tag: 'Jamoalar',
    h1a: null, h1b: 'Jamoa', h1c: 'Raqobatda',
    desc: "Har bir fakultet sharaf uchun maydonga tushadi. Qaysi jamoa eng kuchli?",
    btn1: { label: "Jamoalarni ko'rish", yol: '/jamoalar' },
    btn2: { label: 'Jadval', yol: '/jadval' },
    bg: null,
  },
  {
    tag: 'Statistika',
    h1a: 'Top', h1b: 'Futbolchilar', h1c: 'Reytingi',
    desc: "Gollar, assistlar va ball bo'yicha eng yaxshi o'yinchilar. Har hafta yangilanadi.",
    btn1: { label: "Reytingni ko'rish", yol: '/futbolchilar' },
    btn2: { label: 'Futbolchilar', yol: '/futbolchilar' },
    bg: null,
  },
  {
    tag: 'Jadval',
    h1a: 'Haftalik', h1b: "O'yinlar", h1c: 'Jadvali',
    desc: "Barcha o'yinlar sanasi, vaqti va natijalari bir joyda. Birorta o'yinni o'tkazib yubormang.",
    btn1: { label: "Jadvalga o'tish", yol: '/oyinlar' },
    btn2: { label: 'Natijalar', yol: '/jadval' },
    bg: null,
  },
  {
    tag: 'Yangiliklar',
    h1a: "So'nggi", h1b: 'Xabarlar', h1c: 'Va Tahlillar',
    desc: "O'yin hisobotlari, transferlar va chempionat yangiliklari. Hammasidan xabardor bo'ling.",
    btn1: { label: "Yangiliklarni o'qish", yol: '/yangiliklar' },
    btn2: { label: 'Arxiv', yol: '/yangiliklar' },
    bg: null,
  },
];

const BUTTON_SETS = FALLBACK_SLIDES.map(s => ({ btn1: s.btn1, btn2: s.btn2 }));

/* ─── Animated Counter ──────────────────────────────────────── */
function useCountUp(target, duration = 1800, trigger = true) {
  const [count, setCount] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!trigger || done.current) return;
    const num = parseInt(String(target).replace(/\D/g, ''), 10);
    if (!num) return;
    done.current = true;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return count;
}

/* ─── Stat Card ─────────────────────────────────────────────── */
const StatCard = memo(function StatCard({ rawVal, label, Icon, color, delay, trigger }) {
  const hasPlus = String(rawVal).includes('+');
  const hasDash = String(rawVal) === '—';
  const count   = useCountUp(rawVal, 1800, trigger && !hasDash);
  const num     = parseInt(String(rawVal).replace(/\D/g, ''), 10);
  const display = hasDash ? '—' : (count === num && hasPlus ? `${count}+` : count);

  return (
    <div className="hsc-card" style={{ '--card-color': color, animationDelay: `${delay}s` }}>
      <div className="hsc-icon">
        <Icon size={18} color={color} />
      </div>
      <div className="hsc-value">{display}</div>
      <div className="hsc-label">{label}</div>
      <div className="hsc-glow" />
    </div>
  );
});

/* ─── Right Side Decoration — clean rings + logo only ───────── */
const HeroDeco = memo(function HeroDeco() {
  return (
    <div className="hs-football-deco" aria-hidden="true">
      <div className="hfd-ring hfd-ring--1" />
      <div className="hfd-ring hfd-ring--2" />
      <div className="hfd-ring hfd-ring--3" />
      <div className="hfd-dot hfd-dot--1" />
      <div className="hfd-dot hfd-dot--2" />
      <div className="hfd-dot hfd-dot--3" />
      <div className="hfd-logo">
        <img
          src="/static/uniliga_kubok.png"
          alt="Kubok"
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hfd-logo-fallback" style={{ display: 'none' }}>
          <IcoTrophy size={160} color="rgba(201,162,39,0.9)" />
        </div>
      </div>
      <div className="hfd-season">
        <span className="hfd-season-lbl">Mavsum</span>
        <span className="hfd-season-val">2025<span>/26</span></span>
        <span className="hfd-season-lbl">UniLiga</span>
      </div>
    </div>
  );
});

/* ─── Error Banner ──────────────────────────────────────────── */
const ErrorBanner = memo(({ message, onRetry }) => (
  <div style={{ maxWidth: 1100, margin: '12px auto 0', padding: '0 16px' }}>
    <div style={{
      background:'rgba(204,26,46,.12)', border:'1px solid rgba(204,26,46,.35)',
      borderRadius:14, padding:'12px 14px', color:'var(--tx1)',
    }}>
      <div style={{ fontWeight:900, marginBottom:6 }}>Ma'lumot yuklanmadi</div>
      <div style={{ opacity:.85, fontSize:13, marginBottom:10 }}>{message}</div>
      <button className="btn btn-red" onClick={onRetry}>Qayta urinish</button>
    </div>
  </div>
));

/* ─── Hero Slider ───────────────────────────────────────────── */
const HeroSlider = memo(function HeroSlider({ slides, stats, mavsum, jonliOyin }) {
  const navigate = useNavigate();
  const [cur, setCur]   = useState(0);
  const [prev, setPrev] = useState(null);
  const [out, setOut]   = useState(false);
  const [statsVis, setStatsVis] = useState(false);
  const statsRef  = useRef(null);
  const timerRef  = useRef(null);
  const prevTimer = useRef(null);

  const safeSlides   = (Array.isArray(slides) && slides.length) ? slides : FALLBACK_SLIDES;
  const slidesLength = safeSlides.length;

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setStatsVis(true);
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { if (cur >= slidesLength) setCur(0); }, [cur, slidesLength]);

  const goTo = useCallback((next) => {
    if (next === cur) return;
    clearTimeout(prevTimer.current);
    setPrev(cur); setOut(true);
    setTimeout(() => {
      setCur(next); setOut(false);
      prevTimer.current = setTimeout(() => setPrev(null), 1400);
    }, 350);
  }, [cur]);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (slidesLength <= 1) return;
    timerRef.current = setInterval(() => {
      setCur(c => {
        const next = (c + 1) % slidesLength;
        clearTimeout(prevTimer.current);
        setPrev(c); setOut(true);
        setTimeout(() => {
          setCur(next); setOut(false);
          prevTimer.current = setTimeout(() => setPrev(null), 1400);
        }, 350);
        return c;
      });
    }, 3000);
  }, [slidesLength]);

  useEffect(() => {
    startTimer();
    return () => { clearInterval(timerRef.current); clearTimeout(prevTimer.current); };
  }, [startTimer]);

  const s      = safeSlides[cur] ?? safeSlides[0];
  const btnSet = BUTTON_SETS[cur % BUTTON_SETS.length] ?? BUTTON_SETS[0];
  const btn1   = s?.btn1 ?? btnSet?.btn1;
  const btn2   = s?.btn2 ?? btnSet?.btn2;
  const dynamicH1a =
    (s?.h1a !== null && s?.h1a !== undefined && String(s?.h1a).trim() !== '') ? s.h1a
    : stats.jamoa && stats.jamoa !== '—' ? `${stats.jamoa} ta` : '— ta';

  const statCards = [
    { rawVal: stats.jamoa ?? '8',    label: 'Jamoa',  Icon: IcoTrophy,   color: 'var(--gold)', delay: 0.05 },
    { rawVal: stats.hafta ?? '12',   label: 'Hafta',  Icon: IcoCalendar, color: '#1a56db',     delay: 0.15 },
    { rawVal: stats.oyin  ?? '94',   label: "O'yin",  Icon: IcoBall,     color: 'var(--red)',  delay: 0.25 },
    { rawVal: stats.gol   ?? '312+', label: 'Gol',    Icon: IcoGoal,     color: '#1a8a4a',     delay: 0.35 },
  ];

  return (
    <section className="hs-root">
      {safeSlides.map((sl, i) => (
        <div
          key={i}
          className={`hs-bg${i === cur ? ' hs-bg--on' : ''}`}
          style={{
            zIndex: i === cur ? 2 : i === prev ? 1 : 0,
            ...(sl?.bg ? { backgroundImage: `url('${sl.bg}')` } : {}),
          }}
        />
      ))}

      <div className="hs-overlay"/>
      <div className="hs-grid"/>
      <div className="hs-accent"/>

      <HeroDeco />

      <div className="hs-container">
        <div className="hs-content">
          <div className={`hs-anim ${out ? 'hs-out' : 'hs-in'}`}>
            <div className="hs-tag">
              <span className="live-dot"/>
              {s.tag}{mavsum?.name ? ` · Mavsum ${mavsum.name}` : ''}
            </div>
            <h1 className="hs-h1">
              <span className="hs-h1-a">{dynamicH1a}</span>
              <span className="hs-h1-b">{s.h1b}</span>
              <span className="hs-h1-c">{s.h1c}</span>
            </h1>
            <p className="hs-desc">{s.desc}</p>
          </div>

          <div className="hs-fixed">
            <div className="hs-btns">
              <button className="btn btn-red btn-lg" onClick={() => btn1?.yol && navigate(btn1.yol)}>
                <IcoPlay/>{btn1?.label ?? "O'yinlar"}<span className="btn-shine"/>
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => btn2?.yol && navigate(btn2.yol)}>
                {btn2?.label ?? 'Batafsil'}
              </button>
              {jonliOyin && (
                <span className="badge badge-red">
                  <span className="live-dot"/>O'yin davom etmoqda
                </span>
              )}
            </div>

            <div className="hs-stat-cards" ref={statsRef}>
              {statCards.map((sc, i) => (
                <StatCard key={i} {...sc} trigger={statsVis} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hs-dots">
        {safeSlides.map((_, i) => (
          <button
            key={i}
            className={`hs-dot ${i === cur ? 'hs-dot--on' : ''}`}
            onClick={() => { clearInterval(timerRef.current); goTo(i); startTimer(); }}
          />
        ))}
      </div>
    </section>
  );
});

/* ─── Top Futbolchilar ─────────────────────────────────────── */
const TopFutbolchilar = memo(function TopFutbolchilar({ futbolchilar }) {
  if (!futbolchilar?.length)
    return <div className="empty-state"><div className="empty-state-text">Ma'lumot yo'q</div></div>;
  const topBall = futbolchilar[0]?.ball || 1;
  return (
    <div className="players-list">
      {futbolchilar.slice(0, 6).map((f, i) => (
        <div key={f.id ?? i} className="player-row">
          <span className={`player-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}`}>{i+1}</span>
          <div className="player-avatar" style={{
            background:`${f.jamoa_rang}22`, border:`1.5px solid ${f.jamoa_rang}55`, overflow:'hidden', padding:0,
          }}>
            {f.rasm
              ? <img src={f.rasm} alt={f.futbolchi_ism} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
              : <span style={{color:f.jamoa_rang,fontSize:18,fontFamily:'var(--f-display)',fontWeight:900}}>{f.futbolchi_ism?.[0]}</span>
            }
          </div>
          <div className="player-info">
            <div className="player-name">{f.futbolchi_ism}</div>
            <div className="player-club">{f.jamoa_ism}</div>
            <div className="player-bar-track">
              <div className="player-bar-fill" style={{width:`${(f.ball/topBall)*100}%`,background:f.jamoa_rang}}/>
            </div>
          </div>
          <div className="player-stats">
            <div className="player-stat-box">
              <span className="player-stat-val">{f.gollar}</span>
              <span className="player-stat-lbl">Gol</span>
            </div>
            <div className="player-stat-box">
              <span className="player-stat-val" style={{color:'var(--gold)',fontSize:15}}>{f.ball}</span>
              <span className="player-stat-lbl">Ball</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const MatchCardSkeleton = memo(() => (
  <div className="match-card" style={{minHeight:180, opacity:0.3}}>
    <div className="mc-status-bar"/>
  </div>
));

/* ─── Main Page ─────────────────────────────────────────────── */
export default function BoshSahifa() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data: malumot, error, isLoading, isError } = useBoshSahifa();

  const r1=useRef(), r2=useRef(), r3=useRef(), r4=useRef(), r5=useRef();
  const v1=useVisibility(r1), v2=useVisibility(r2), v3=useVisibility(r3);
  const v4=useVisibility(r4), v5=useVisibility(r5);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BOSH_SAHIFA_KEY });
  }, [queryClient]);

  const jonliOyin = malumot?.jonli_oyinlar?.[0] ?? null;
  const stats     = malumot?.stats ?? {};
  const slides    = (malumot?.slides && malumot.slides.length) ? malumot.slides : FALLBACK_SLIDES;

  return (
    <div>
      {isError && !malumot && (
        <ErrorBanner
          message={error?.response?.data?.detail ?? error?.message ?? "Noma'lum xato"}
          onRetry={handleRetry}
        />
      )}

      <HeroSlider slides={slides} stats={stats} mavsum={malumot?.mavsum} jonliOyin={jonliOyin}/>

      <section className="section" ref={r1} style={{background:'var(--bg2)'}}>
        <div className="container">
          <div className={`section-header ${v1?'fade-up':''}`}>
            <div><div className="section-eyebrow">Hozir</div><h2 className="section-title">Jonli o'yin</h2></div>
            {jonliOyin&&<span className="badge badge-red"><span className="live-dot"/>Davom etmoqda</span>}
          </div>
          {isLoading ? <SoccerLoading label="Yuklanmoqda..."/>
            : jonliOyin ? <JonliOyinKarta match={jonliOyin}/>
            : (
              <div style={{textAlign:'center',padding:'56px 24px',color:'var(--tx3)'}}>
                <div style={{fontSize:44,marginBottom:16,opacity:.2}}>📡</div>
                <div style={{fontFamily:'var(--f-display)',fontSize:13,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>
                  Hozirda jonli o'yin yo'q
                </div>
                <div style={{marginTop:8,fontFamily:'var(--f-body)',fontSize:13,color:'var(--tx4)'}}>
                  Keyingi o'yinlar jadvalini tekshiring
                </div>
              </div>
            )
          }
        </div>
      </section>

      <section className="section" ref={r2}>
        <div className="container">
          <div className={`section-header ${v2?'fade-up':''}`}>
            <div><div className="section-eyebrow">Jadval</div><h2 className="section-title">Kelgusi o'yinlar</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/oyinlar')}>Barchasi <IcoArrow/></button>
          </div>
          <div className={`matches-grid ${v2?'fade-up':''}`} style={{animationDelay:'.08s'}}>
            {isLoading
              ? [1,2,3].map(i=><MatchCardSkeleton key={i}/>)
              : (malumot?.kelgusi_oyinlar??[]).map(o=><OyinKarta key={o.id} oyin={o}/>)
            }
          </div>
          {malumot?.oxirgi_oyinlar?.length>0&&<>
            <div className={`section-header ${v2?'fade-up':''}`} style={{marginTop:56}}>
              <div><div className="section-eyebrow">Natijalar</div><h2 className="section-title">Oxirgi o'yinlar</h2></div>
            </div>
            <div className={`matches-grid ${v2?'fade-up':''}`} style={{animationDelay:'.2s'}}>
              {malumot.oxirgi_oyinlar.map(o=><OyinKarta key={o.id} oyin={o}/>)}
            </div>
          </>}
        </div>
      </section>

      <section className="section" ref={r3} style={{background:'var(--bg2)'}}>
        <div className="container">
          <div className={`section-header ${v3?'fade-up':''}`}>
            <div><div className="section-eyebrow">Turniir</div><h2 className="section-title">Liga jadvali</h2></div>
            <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
              <div className="table-legend">
                <span className="legend-dot champion">Chempion</span>
                <span className="legend-dot promotion">Top 3</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/jadval')}>To'liq jadval <IcoArrow/></button>
            </div>
          </div>
          {isLoading
            ? <SoccerLoading label="Yuklanmoqda..."/>
            : <LigaJadvali qatorlar={malumot?.jadval??[]}/>
          }
        </div>
      </section>

      <section className="section" ref={r4}>
        <div className="container">
          <div className={`section-header ${v4?'fade-up':''}`}>
            <div><div className="section-eyebrow">Reytinglar</div><h2 className="section-title">Top futbolchilar</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/futbolchilar')}>Barchasi <IcoArrow/></button>
          </div>
          <div className={v4?'fade-up':''} style={{animationDelay:'.08s'}}>
            {isLoading
              ? <SoccerLoading label="Yuklanmoqda..."/>
              : <TopFutbolchilar futbolchilar={malumot?.top_futbolchilar}/>
            }
          </div>
        </div>
      </section>

      <section className="section" ref={r5} style={{background:'var(--bg2)',paddingBottom:0}}>
        <div className="container">
          <div className={`section-header ${v5?'fade-up':''}`}>
            <div><div className="section-eyebrow">So'nggi</div><h2 className="section-title">Yangiliklar</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/yangiliklar')}>Barchasi <IcoArrow/></button>
          </div>
        </div>
        {malumot?.yangiliklar?.length>0&&<NewsStrip initialItems={malumot.yangiliklar} initialNext={null}/>}
      </section>
    </div>
  );
}