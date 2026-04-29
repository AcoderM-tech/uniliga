import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,
  Environment,
  useProgress,
  Html,
} from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

const LAPTOP_MODEL_URL = '/models/laptop.glb';
const HDR_ENV_URL      = '/hdr/studio_small_03_1k.hdr';
const LAPTOP_SCALE     = 3;
const LAPTOP_POSITION  = [0, 0.4, 0];
const LAPTOP_ROTATION  = [0, Math.PI * 0.15, 0];

/* ── ICONS ── */
const IcoTelegram = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm4.962 7.224c.1-.002.328.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);
const IcoEmail = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor">
    <path opacity=".25" d="M224,56H32a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8H224a8,8,0,0,0,8-8V64A8,8,0,0,0,224,56Z"/>
    <path d="M224,48H32a16,16,0,0,0-16,16V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM98.71,128,32,181.81V74.19Zm11.84,10.85L128,153.07l17.45-14.22L216.16,192H39.84ZM157.29,128,224,74.19V181.81ZM128,138.93,39.53,64H216.47Z"/>
  </svg>
);
const IcoArrow = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor">
    <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
  </svg>
);
const IcoPin = ({ s = 13 }) => (
  <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor">
    <path opacity=".25" d="M200,104a72,72,0,1,1-72-72A72,72,0,0,1,200,104Z"/>
    <path d="M128,24a80,80,0,1,0,80,80A80.09,80.09,0,0,0,128,24Zm0,144a64,64,0,1,1,64-64A64.07,64.07,0,0,1,128,168Zm0-104a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Z"/>
  </svg>
);
const IcoPhone = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor">
    <path opacity="0.2" d="M216.32,168.12l-37.06-18.53a16,16,0,0,0-15,1L141.51,165.7c-21.73-11.41-39.81-29.49-51.22-51.22l15.11-22.75a16,16,0,0,0,1-15L87.88,39.68A16,16,0,0,0,70.16,30.34L35.82,39.11A16,16,0,0,0,24,54.8c0,95.51,77.69,173.2,173.2,173.2a16,16,0,0,0,15.69-11.82l8.77-34.34A16,16,0,0,0,216.32,168.12Z"/>
    <path d="M223.86,164.31l-37.06-18.53a24,24,0,0,0-22.56,1.48L148.92,158c-18.7-10.15-34.77-26.22-44.92-44.92l10.74-15.32a24,24,0,0,0,1.48-22.56L97.69,38.14a24,24,0,0,0-26.58-14l-34.34,8.77A24,24,0,0,0,16,54.8C16,156.92,99.08,240,201.2,240a24,24,0,0,0,21.9-20.78l8.77-34.34A24,24,0,0,0,223.86,164.31ZM201.2,224c-93.29,0-169.2-75.91-169.2-169.2a8,8,0,0,1,5.91-7.83l34.34-8.77a8,8,0,0,1,8.83,4.67L96.4,74.34a8,8,0,0,1-.5,7.52L80.79,104.61a8,8,0,0,0,0,8.78c12,22.82,30.59,41.41,53.41,53.41a8,8,0,0,0,8.78,0l22.75-15.11a8,8,0,0,1,7.52-.5l31.53,15.76a8,8,0,0,1,4.67,8.83l-8.77,34.34A8,8,0,0,1,201.2,224Z"/>
  </svg>
);
const IcoLinkedin = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor">
    <rect x="32" y="32" width="192" height="192" rx="40" opacity="0.2"/>
    <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm-8-32a12,12,0,1,1,12-12A12,12,0,0,1,88,80Zm96,96a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0v4.26a35.91,35.91,0,0,1,56,29.74Z"/>
  </svg>
);
const IcoGithub = ({ s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 98 96" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
  </svg>
);

/* ── TYPEWRITER ── */
const ROLES = ['Full-Stack Dasturchi','Bot Arxitektori','Backend Muhandis','Tizim Dizayneri','API Mutaxassisi'];
function TypeWriter() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  useEffect(() => {
    const cur = ROLES[idx];
    const spd = del ? 40 : 80;
    const t = setTimeout(() => {
      if (!del) {
        setText(cur.slice(0, text.length + 1));
        if (text.length + 1 === cur.length) setTimeout(() => setDel(true), 1800);
      } else {
        setText(cur.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDel(false); setIdx(i => (i + 1) % ROLES.length); }
      }
    }, spd);
    return () => clearTimeout(t);
  }, [text, del, idx]);
  return (
    <span className="typewriter-text" style={{ color: '#e8223a', fontWeight: 900 }}>
      {text}<span className="typewriter-cursor" style={{ borderRight: '2px solid #e8223a', marginLeft: 2, animation: 'blink 1s step-end infinite' }}/>
    </span>
  );
}

/* ── FLOATING CODE PARTICLES ── */
const PARTICLE_DATA = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  symbol: ['{  }','[  ]','...','//','=> ','</>', '0x','&&','||','#!/','npm','git','fn()','[][]','::','<T>'][i % 16],
  x: 5 + (i * 3.7) % 90,
  y: 5 + (i * 7.3) % 88,
  size: 11 + (i % 4) * 2,
  dur: 16 + (i % 5) * 5,
  delay: (i % 8) * 1.2,
  op: 0.22 + (i % 3) * 0.08,
}));

const STAR_DATA = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: (i * 1.81) % 100,
  y: (i * 2.37) % 100,
  big: i % 7 === 0,
  op: 0.2 + (i % 5) * 0.12,
  dur: 3 + (i % 5),
  delay: (i % 7) * 0.6,
}));

function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {PARTICLE_DATA.map(p => (
        <div key={p.id} className="float-particle" style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          fontFamily: "'JetBrains Mono',monospace", fontSize: p.size,
          color: `rgba(148,163,184,${p.op})`, fontWeight: 700,
          animation: `particleDrift ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
          userSelect: 'none', letterSpacing: '0.04em',
        }}>{p.symbol}</div>
      ))}
      {STAR_DATA.map(s => (
        <div key={`s${s.id}`} className="star-dot" style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.big ? 2 : 1, height: s.big ? 2 : 1,
          borderRadius: '50%',
          background: `rgba(255,255,255,${s.op})`,
          animation: `starPulse ${s.dur}s ${s.delay}s ease-in-out infinite alternate`,
        }}/>
      ))}
    </div>
  );
}

/* ── 3D ── */
function LoadingBar() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 12, color: '#e8223a', textAlign: 'center', userSelect: 'none' }}>
        <div style={{ width: 100, height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#e8223a', borderRadius: 99, transition: 'width .3s' }}/>
        </div>
        Yuklanmoqda {Math.round(progress)}%
      </div>
    </Html>
  );
}

function LaptopModel({ mousePos }) {
  const groupRef = useRef();
  const { scene } = useGLTF(LAPTOP_MODEL_URL);
  const centeredScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    return clone;
  }, [scene]);

  const currentRotY = useRef(0);
  const currentTiltX = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const targetTiltX = (mousePos.current.y - 0.5) * 0.4;
    currentTiltX.current += (targetTiltX - currentTiltX.current) * 0.04;
    currentRotY.current += 0.004;
    groupRef.current.rotation.x = currentTiltX.current;
    groupRef.current.rotation.y = currentRotY.current + (mousePos.current.x - 0.5) * 0.6;
    groupRef.current.position.y = Math.sin(t * 0.85) * 0.08;
  });

  return (
    <group ref={groupRef} scale={LAPTOP_SCALE} position={LAPTOP_POSITION} rotation={LAPTOP_ROTATION}>
      <primitive object={centeredScene}/>
    </group>
  );
}
useGLTF.preload(LAPTOP_MODEL_URL);

function LaptopScene({ mousePos }) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl, scene }) => { gl.setClearColor(0x000000, 0); scene.background = null; }}
      camera={{ position: [0, -0.3, 5.2], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, 2]}
    >
      <Suspense fallback={<LoadingBar/>}>
        <ambientLight intensity={0.4}/>
        <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow/>
        <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#b0c4ff"/>
        <directionalLight position={[0, 1, -5]} intensity={0.55}/>
        <pointLight position={[3, -2, 2]} intensity={0.9} color="#7c3aed" distance={9}/>
        <pointLight position={[-3, 2, -2]} intensity={0.6} color="#1a56db" distance={9}/>
        <LaptopModel mousePos={mousePos}/>
        <Environment files={HDR_ENV_URL} background={false}/>
      </Suspense>
    </Canvas>
  );
}

/* ── MAGNETIC RINGS ── */
function MagneticRings() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[1, 0.7, 0.44].map((sc, i) => (
        <div key={i} className="magnetic-ring" style={{
          position: 'absolute',
          width: `${sc * 86}%`, height: `${sc * 86}%`,
          borderRadius: '50%',
          border: `1px solid rgba(124,58,237,${0.1 - i * 0.025})`,
          animation: `ringPulse ${4 + i * 1.8}s ${i * 1.1}s ease-in-out infinite`,
          boxShadow: `inset 0 0 30px rgba(124,58,237,${0.04 - i * 0.01}), 0 0 30px rgba(26,86,219,${0.05 - i * 0.01})`,
        }}/>
      ))}
      <div className="magnetic-shadow" style={{
        position: 'absolute', bottom: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: '50%', height: 36, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,.4) 0%, rgba(26,86,219,.18) 45%, transparent 70%)',
        filter: 'blur(14px)',
      }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ── ANIMATED STAT CARD (overshoot → return loop)
   ══════════════════════════════════════════════ */
const STATS_CONFIG = [
  { target: 3,  overshoot: 7,  suffix: '+', lab: 'Yil tajriba',  upDur: 1200, downDur: 700, hold: 320, pause: 3200 },
  { target: 10, overshoot: 18, suffix: '+', lab: 'Loyiha',       upDur: 1200, downDur: 700, hold: 320, pause: 3200 },
  { target: 5,  overshoot: 11, suffix: '+', lab: 'Jonli tizim',  upDur: 1200, downDur: 700, hold: 320, pause: 3200 },
  { target: null, display: '24/7',           lab: 'Uptime' },
];

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t)  { return t * t * t; }

function useLoopCounter({ target, overshoot, suffix = '', upDur, downDur, hold, pause, display, startDelay }) {
  const [val, setVal] = useState(display || (target !== null ? '0' + suffix : display));
  const rafRef = useRef(null);
  const timerRef = useRef(null);

  const runCycle = useCallback(() => {
    if (target === null) return;

    // Phase 1: count up to overshoot
    const phase1Start = performance.now();
    const phase1 = (now) => {
      const t = Math.min((now - phase1Start) / upDur, 1);
      setVal(Math.round(easeOut(t) * overshoot) + suffix);
      if (t < 1) { rafRef.current = requestAnimationFrame(phase1); return; }
      setVal(overshoot + suffix);

      // Hold at overshoot
      timerRef.current = setTimeout(() => {
        // Phase 2: bounce back to target
        const phase2Start = performance.now();
        const phase2 = (now2) => {
          const t2 = Math.min((now2 - phase2Start) / downDur, 1);
          setVal(Math.round(overshoot - easeIn(t2) * (overshoot - target)) + suffix);
          if (t2 < 1) { rafRef.current = requestAnimationFrame(phase2); return; }
          setVal(target + suffix);

          // Wait then loop again
          timerRef.current = setTimeout(runCycle, pause);
        };
        rafRef.current = requestAnimationFrame(phase2);
      }, hold);
    };
    rafRef.current = requestAnimationFrame(phase1);
  }, [target, overshoot, suffix, upDur, downDur, hold, pause]);

  useEffect(() => {
    timerRef.current = setTimeout(runCycle, startDelay || 0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runCycle, startDelay]);

  return val;
}

function StatCard({ config, startDelay }) {
  const cardRef = useRef();
  const [visible, setVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="stat-card">
      {visible
        ? <StatCardInner config={config} startDelay={startDelay}/>
        : <StatCardInner config={config} startDelay={startDelay} frozen/>
      }
    </div>
  );
}

function StatCardInner({ config, startDelay, frozen }) {
  const effectiveDelay = frozen ? 9999999 : (startDelay || 0);
  const val = useLoopCounter({
    target: config.target,
    overshoot: config.overshoot,
    suffix: config.suffix || '',
    upDur: config.upDur,
    downDur: config.downDur,
    hold: config.hold,
    pause: config.pause,
    display: config.display,
    startDelay: effectiveDelay,
  });

  return (
    <>
      <div style={{
        fontFamily: 'Montserrat,sans-serif', fontWeight: 900,
        fontSize: 'clamp(26px,3.2vw,44px)', color: '#fff',
        letterSpacing: '-.04em', lineHeight: 1,
      }}>
        {config.display ? config.display : val}
      </div>
      <div style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 10,
        color: 'rgba(255,255,255,.3)', textTransform: 'uppercase',
        letterSpacing: '.1em', marginTop: 3,
      }}>
        {config.lab}
      </div>
    </>
  );
}

/* ── HERO ── */
function HeroSection() {
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const zoneRef = useRef();
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback((e) => {
    const r = zoneRef.current?.getBoundingClientRect();
    if (r) mousePos.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }, []);

  return (
    <section onMouseMove={onMove} style={{ position: 'relative', minHeight: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="hero-orb-1" style={{ position: 'absolute', top: '-20%', right: '-8%', width: 720, height: 720, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.22) 0%,rgba(26,86,219,.12) 42%,transparent 70%)', animation: 'float 9s ease-in-out infinite' }}/>
        <div className="hero-orb-2" style={{ position: 'absolute', bottom: '-10%', left: '-12%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,86,219,.2) 0%,rgba(124,58,237,.1) 42%,transparent 70%)', animation: 'float 12s ease-in-out infinite reverse' }}/>
        <div className="hero-orb-3" style={{ position: 'absolute', top: '35%', left: '35%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,34,58,.08) 0%,transparent 70%)' }}/>
        <div className="hero-grid-lines" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '72px 72px' }}/>
        <FloatingParticles/>
      </div>

      {/* MAIN ROW */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '52px clamp(24px,5vw,72px) 0', maxWidth: 1440, margin: '0 auto', width: '100%', boxSizing: 'border-box', position: 'relative', gap: 'clamp(20px,3vw,56px)' }}>

        {/* ── LEFT TEXT BLOCK ── */}
        <div style={{ flex: '0 0 auto', width: 'clamp(300px,46%,620px)', position: 'relative' }}>

          {/* Ghost watermark */}
          <div style={{
            position: 'absolute', top: -20, left: -16,
            fontFamily: 'Montserrat,sans-serif', fontWeight: 900,
            fontSize: 'clamp(72px,12vw,168px)',
            letterSpacing: '-.07em', lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(148,163,184,.06)',
            userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap', zIndex: 0,
            transform: 'rotate(-5deg)',
          }} className="ghost-watermark">BACKEND</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Location */}
            <div className="anim-1 location-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 99, marginBottom: 16 }}>
              <IcoPin s={11}/>
              <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.12em', color: 'rgba(255,255,255,.42)' }}>TOSHKENT, O'ZBEKISTON</span>
            </div>

            {/* Name subtitle */}
            <div className="anim-1 dev-name-sub" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(10px,1vw,13px)', letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)', marginBottom: 6 }}>
              ------------
            </div>

            {/* GIANT HEADING */}
            <h1 className="anim-2" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(68px,10vw,132px)', letterSpacing: '-.055em', lineHeight: .87, margin: '0 0 16px', whiteSpace: 'nowrap' }}>
              <span className="dev-h1-white" style={{ background: 'linear-gradient(150deg,#fff 0%,rgba(255,255,255,.68) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Acoder</span><span className="dev-h1-red" style={{ background: 'linear-gradient(135deg,#e8223a 0%,#ff5568 50%,#cc1a2e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>M</span>
            </h1>

            {/* Typewriter */}
            <div className="anim-2" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 'clamp(14px,1.7vw,20px)', marginBottom: 14, letterSpacing: '-.01em', minHeight: '1.5em' }}>
              <TypeWriter/>
            </div>

            {/* Divider */}
            <div className="anim-3 dev-divider" style={{ width: 42, height: 2, background: 'linear-gradient(90deg,#e8223a,rgba(232,34,58,0))', borderRadius: 99, marginBottom: 16 }}/>

            {/* Description */}
            <p className="anim-3 dev-desc" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(13px,1.05vw,15px)', lineHeight: 1.72, color: 'rgba(255,255,255,.46)', maxWidth: 390, marginBottom: 22 }}>
              Men shunchaki kod yozmayman —{' '}
              <span className="dev-desc-bold" style={{ color: 'rgba(255,255,255,.88)', fontWeight: 600 }}>ishlab chiqarish darajasidagi tizimlar</span>
              {' '}quraman.{' '}
              <span className="dev-desc-red" style={{ color: '#e8223a', fontWeight: 600 }}>Jonli futbol platformalari</span>
              {' '}dan{' '}
              <span className="dev-desc-blue" style={{ color: '#60a5fa', fontWeight: 600 }}>bot ekotizimlari</span>
              {' '}gacha — haqiqatan ishlaydigian narsalar yarataman.
            </p>

            {/* Tags */}
            <div className="anim-3" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 24 }}>
              {['Tez', 'Kengayadigan', 'Real-vaqt', 'Aqlli'].map((b, i) => (
                <span key={b} style={{
                  fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 10,
                  letterSpacing: '.14em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99,
                  background: ['rgba(232,34,58,.1)','rgba(26,86,219,.1)','rgba(124,58,237,.1)','rgba(26,138,74,.1)'][i],
                  border: `1px solid ${['rgba(232,34,58,.25)','rgba(26,86,219,.25)','rgba(124,58,237,.25)','rgba(26,138,74,.25)'][i]}`,
                  color: ['#e8223a','#60a5fa','#a78bfa','#4ade80'][i],
                }}>{b}</span>
              ))}
            </div>

            {/* CTAs */}
            <div className="anim-4 cta-row">
              <a href="https://------ target="_blank" rel="noopener noreferrer" className="cta-primary cta-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#e8223a,#cc1a2e)', borderRadius: 10, fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '.06em', color: '#fff', textDecoration: 'none', transition: 'all .25s' }}>
                <IcoTelegram s={16}/>Telegram
              </a>
              <button onClick={() => document.getElementById('aloqa')?.scrollIntoView({ behavior: 'smooth' })} className="cta-ghost cta-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '.06em', color: 'rgba(255,255,255,.5)', cursor: 'pointer', transition: 'all .25s' }}>
                Bog'lanish <IcoArrow s={13}/>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT 3D MODEL ── */}
        <div
          ref={zoneRef}
          className="anim-3 laptop-canvas-wrap"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => { setHovering(false); mousePos.current = { x: 0.5, y: 0.5 }; }}
          style={{ flex: 1, height: 'clamp(380px,55vw,700px)', cursor: hovering ? 'grab' : 'default', position: 'relative' }}
        >
          <MagneticRings/>
          <LaptopScene mousePos={mousePos}/>
        </div>

      </div>

      {/* ══════════════════════════════════════════
          ── STATS PANEL — responsive + animated
          ══════════════════════════════════════════ */}
      <div className="anim-5 stats-panel">
        {STATS_CONFIG.map((cfg, i) => (
          <StatCard key={i} config={cfg} startDelay={i * 180}/>
        ))}
      </div>

    </section>
  );
}

/* ── MAIN ── */
export default function DasturchiSahifasi() {
  const navigate = useNavigate();
  return (
    <div className="dev-root" style={{ background: '#060810', minHeight: '100vh', paddingTop: 68, color: '#f0f2f8', overflow: 'hidden' }}>
      <style>{`
        @keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes ringPulse    { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.05);opacity:1} }
        @keyframes particleDrift{ from{transform:translateY(0) rotate(0deg)} to{transform:translateY(-28px) rotate(9deg)} }
        @keyframes starPulse    { from{opacity:.04} to{opacity:.3} }

        /* ── LIGHT MODE: dev-root fon ── */
        body.light-mode .dev-root {
          background:
            radial-gradient(ellipse 70% 60% at 0% 0%,   rgba(199,210,254,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 100% 20%, rgba(196,181,253,0.40) 0%, transparent 60%),
            radial-gradient(ellipse 55% 55% at 10% 100%, rgba(167,243,208,0.30) 0%, transparent 65%),
            radial-gradient(ellipse 50% 50% at 90% 85%,  rgba(186,230,253,0.30) 0%, transparent 60%),
            #EEF2F7 !important;
          color: #1E1B4B !important;
        }

        /* ── LIGHT MODE: TypeWriter rang ── */
        body.light-mode .typewriter-text {
          color: #CF2035 !important;
        }
        body.light-mode .typewriter-cursor {
          border-right-color: #CF2035 !important;
        }

        /* ── LIGHT MODE: Hero BG orbitlar ── */
        body.light-mode .hero-orb-1 {
          background: radial-gradient(circle,rgba(99,102,241,.18) 0%,rgba(59,78,204,.10) 42%,transparent 70%) !important;
        }
        body.light-mode .hero-orb-2 {
          background: radial-gradient(circle,rgba(59,78,204,.16) 0%,rgba(99,102,241,.08) 42%,transparent 70%) !important;
        }
        body.light-mode .hero-orb-3 {
          background: radial-gradient(circle,rgba(207,32,53,.06) 0%,transparent 70%) !important;
        }
        body.light-mode .hero-grid-lines {
          background-image:
            linear-gradient(rgba(99,102,241,.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(99,102,241,.05) 1px,transparent 1px) !important;
        }

        /* ── LIGHT MODE: Floating particles ── */
        body.light-mode .float-particle {
          color: rgba(59,78,204,0.18) !important;
        }
        body.light-mode .star-dot {
          background: rgba(99,102,241,0.20) !important;
        }

        /* ── LIGHT MODE: Ghost watermark ── */
        body.light-mode .ghost-watermark {
          -webkit-text-stroke: 1px rgba(59,78,204,.05) !important;
        }

        /* ── LIGHT MODE: Location pill ── */
        body.light-mode .location-pill {
          background: rgba(255,255,255,0.55) !important;
          border: 1px solid rgba(255,255,255,0.80) !important;
          color: #7C83AD !important;
        }
        body.light-mode .location-pill svg { color: #7C83AD !important; }

        /* ── LIGHT MODE: Name subtitle ── */
        body.light-mode .dev-name-sub { color: rgba(30,27,75,0.35) !important; }

        /* ── LIGHT MODE: Giant heading ── */
        body.light-mode .dev-h1-white {
          background: linear-gradient(150deg,#1E1B4B 0%,#3D3980 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        body.light-mode .dev-h1-red {
          background: linear-gradient(135deg,#CF2035 0%,#E8223A 50%,#B01828 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        /* ── LIGHT MODE: Divider line ── */
        body.light-mode .dev-divider {
          background: linear-gradient(90deg,#CF2035,rgba(207,32,53,0)) !important;
        }

        /* ── LIGHT MODE: Description text ── */
        body.light-mode .dev-desc { color: rgba(30,27,75,0.55) !important; }
        body.light-mode .dev-desc-bold { color: rgba(30,27,75,0.88) !important; }
        body.light-mode .dev-desc-red { color: #CF2035 !important; }
        body.light-mode .dev-desc-blue { color: #3B4ECC !important; }

        /* ── LIGHT MODE: CTA ghost button ── */
        body.light-mode .cta-ghost {
          background: rgba(255,255,255,0.45) !important;
          border: 1px solid rgba(255,255,255,0.80) !important;
          color: #3D3980 !important;
          backdrop-filter: blur(8px) !important;
        }
        body.light-mode .cta-ghost:hover {
          background: rgba(255,255,255,0.72) !important;
          color: #1E1B4B !important;
        }

        /* ── LIGHT MODE: Magnetic rings ── */
        body.light-mode .magnetic-ring {
          border-color: rgba(59,78,204,.10) !important;
          box-shadow: inset 0 0 30px rgba(59,78,204,.04) !important;
        }
        body.light-mode .magnetic-shadow {
          background: radial-gradient(ellipse,rgba(99,102,241,.18) 0%,rgba(124,58,237,.08) 45%,transparent 70%) !important;
        }

        /* ── LIGHT MODE: Aloqa bo'limi ── */
        body.light-mode .aloqa-section {
          border-top: 1px solid rgba(200,210,240,0.35) !important;
        }
        body.light-mode .aloqa-eyebrow { color: #CF2035 !important; }
        body.light-mode .aloqa-title { color: #1E1B4B !important; }
        body.light-mode .aloqa-title-muted { color: rgba(30,27,75,.28) !important; }
        body.light-mode .aloqa-desc { color: rgba(30,27,75,.45) !important; }

        /* ── LIGHT MODE: Social pills ── */
        body.light-mode .social-pill {
          background: rgba(255,255,255,0.55) !important;
          border: 1px solid rgba(255,255,255,0.80) !important;
          color: #3D3980 !important;
          box-shadow: 0 2px 12px rgba(100,110,200,.10), inset 0 1px 0 rgba(255,255,255,.90) !important;
        }
        body.light-mode .pill-phone:hover { background:rgba(15,122,58,.10)!important; border-color:rgba(15,122,58,.35)!important; color:#0B6830!important; box-shadow:0 0 20px rgba(15,122,58,.15)!important; }
        body.light-mode .pill-email:hover { background:rgba(207,32,53,.10)!important; border-color:#CF2035!important; color:#CF2035!important; box-shadow:0 0 20px rgba(207,32,53,.15)!important; }
        body.light-mode .pill-tg:hover { background:rgba(0,136,204,.10)!important; border-color:#0088cc!important; color:#007AAD!important; box-shadow:0 0 20px rgba(0,136,204,.15)!important; }
        body.light-mode .pill-in:hover { background:rgba(0,119,181,.10)!important; border-color:#0077b5!important; color:#005F8F!important; box-shadow:0 0 20px rgba(0,119,181,.15)!important; }
        body.light-mode .pill-gh:hover { background:rgba(30,27,75,.10)!important; border-color:rgba(30,27,75,.30)!important; color:#1E1B4B!important; box-shadow:0 0 20px rgba(30,27,75,.10)!important; }

        /* ── LIGHT MODE: Dev footer ── */
        body.light-mode .dev-footer { border-top: 1px solid rgba(200,210,240,.30)!important; }
        body.light-mode .dev-footer-copy { color: rgba(30,27,75,.22) !important; }
        body.light-mode .dev-footer-back { color: rgba(30,27,75,.22) !important; }
        body.light-mode .dev-footer-back:hover { color: #3D3980 !important; }

        .anim-1{animation:fadeUp .65s .07s both}
        .anim-2{animation:fadeUp .65s .17s both}
        .anim-3{animation:fadeUp .65s .27s both}
        .anim-4{animation:fadeUp .65s .37s both}
        .anim-5{animation:fadeUp .65s .5s both}

        /* ── Stats Panel ── */
        .stats-panel {
          position: relative;
          z-index: 3;
          margin: 44px auto 0;
          padding: 0 clamp(24px,5vw,72px) 44px;
          max-width: 1440px;
          width: 100%;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        /* Tablet: 2×2 */
        @media (max-width: 700px) {
          .stats-panel {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 0 16px 32px;
            margin-top: 28px;
          }
        }

        /* Small phone: 2×2 tighter */
        @media (max-width: 380px) {
          .stats-panel {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            padding: 0 12px 24px;
          }
        }

        /* ── Stat Card ── */
        .stat-card {
          background: rgba(10,13,24,.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          padding: 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: 0 8px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.07);
          transition: transform .3s, box-shadow .3s;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #e8223a, rgba(232,34,58,0));
          opacity: 0;
          transition: opacity .3s;
        }
        .stat-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 18px 52px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1), 0 0 0 1px rgba(124,58,237,.22) !important;
        }
        .stat-card:hover::before { opacity: 1; }

        @media (max-width: 700px) {
          .stat-card { padding: 18px 18px; border-radius: 14px; }
        }

        /* ── CTA row: always one line, equal width on mobile ── */
        .cta-row{display:flex;gap:10px;flex-wrap:nowrap}
        .cta-btn{padding:13px 22px;flex:0 0 auto}
        @media(max-width:500px){
          .cta-row{width:100%}
          .cta-btn{flex:1 1 0;min-width:0;padding:13px 12px;font-size:12px}
        }
        .cta-primary:hover{box-shadow:0 8px 36px rgba(232,34,58,.55)!important;transform:translateY(-2px)}
        .cta-ghost:hover{background:rgba(255,255,255,.09)!important;transform:translateY(-2px);color:rgba(255,255,255,.8)!important}
        .social-btn:hover{transform:translateY(-2px);opacity:.85}
        @media(max-width:860px){.laptop-canvas-wrap{display:none!important}}

        /* ── Contact buttons (Telegram orqali / Email) ── */
        .contact-btn{padding:13px 28px;white-space:nowrap}
        @media(max-width:500px){
          .contact-btn{padding:13px 16px}
          .btn-label{display:none}
        }

        /* ── Pills row: always one line ── */
        .pills-row{display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:nowrap;margin-top:30px}
        .social-pill{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;color:rgba(255,255,255,.7);text-decoration:none;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;transition:all .3s cubic-bezier(.4,0,.2,1);white-space:nowrap;flex-shrink:0}
        .social-pill:hover{transform:translateY(-3px)}
        .pill-phone:hover{background:rgba(74,222,128,.1);border-color:#4ade80;color:#4ade80;box-shadow:0 0 20px rgba(74,222,128,.15)}
        .pill-email:hover{background:rgba(232,34,58,.1);border-color:#e8223a;color:#e8223a;box-shadow:0 0 20px rgba(232,34,58,.15)}
        .pill-tg:hover{background:rgba(0,136,204,.1);border-color:#0088cc;color:#0088cc;box-shadow:0 0 20px rgba(0,136,204,.15)}
        .pill-in:hover{background:rgba(0,119,181,.1);border-color:#0077b5;color:#0077b5;box-shadow:0 0 20px rgba(0,119,181,.15)}
        .pill-gh:hover{background:rgba(255,255,255,.1);border-color:#fff;color:#fff;box-shadow:0 0 20px rgba(255,255,255,.1)}
        @media(max-width:600px){
          .pill-label{display:none}
          .social-pill{padding:12px 16px;border-radius:12px;flex:1 1 0;min-width:0}
          .pills-row{gap:8px;width:100%}
        }
      `}</style>

      <HeroSection/>

      {/* ═══ ALOQA ═══ */}
      <section id="aloqa" className="aloqa-section" style={{ padding: '80px 0 100px', borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
          <div className="aloqa-eyebrow" style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e8223a', marginBottom: 16 }}>Bog'lanish</div>
          <h2 className="aloqa-title" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(28px,5vw,52px)', letterSpacing: '-.04em', lineHeight: 1, color: '#fff', marginBottom: 16 }}>
            Loyihangiz bormi?<br/><span className="aloqa-title-muted" style={{ color: 'rgba(255,255,255,.28)' }}>Gaplashaylik.</span>
          </h2>
          <p className="aloqa-desc" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 40 }}>
            Murakkab, real vaqtli, ishlab chiqarish darajasidagi loyihalarda ishlashni yaxshi ko'raman.<br/>
            Agar natija kerak bo'lsa — murojaat qiling.
          </p>
          <div className="pills-row">
            <a href="tel:+9981234567 className="social-pill pill-phone" title="--------">
              <IcoPhone s={20}/><span className="pill-label">+998 93 527 62 07</span>
            </a>
            <a href="https://t.me/-------" target="_blank" rel="noreferrer" className="social-pill pill-tg" title="Telegram">
              <IcoTelegram s={20}/><span className="pill-label">Telegram</span>
            </a>
            <a href="mailto:------------" className="social-pill pill-email" title="Email">
              <IcoEmail s={20}/><span className="pill-label">Email</span>
            </a>
            <a href="https://www.l-------------/" target="_blank" rel="noreferrer" className="social-pill pill-in" title="LinkedIn">
              <IcoLinkedin s={20}/><span className="pill-label">LinkedIn</span>
            </a>
            <a href="https://---------------" target="_blank" rel="noreferrer" className="social-pill pill-gh" title="GitHub">
              <IcoGithub s={20}/><span className="pill-label">GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="dev-footer" style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '20px clamp(24px,5vw,72px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, maxWidth: 1440, margin: '0 auto', textAlign: 'center' }}>
        <span className="dev-footer-copy" style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.18)' }}>© 2026 AcoderM — Barcha huquqlar himoyalangan</span>
        <button onClick={() => navigate('/')} className="dev-footer-back"
          style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.18)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.18)'}>
          ← UniLiga'ga qaytish
        </button>
      </div>
    </div>
  );
}