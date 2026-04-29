/**
 * NewsStrip — Paginated Linear Carousel
 *
 * Logika:
 *  - Har sahifada 15 ta post
 *  - active 0-14 gacha boradi, 14 da to'xtaydi
 *  - Foydalanuvchi > ni bossa → keyingi 15 ta yuklanadi, active=0 ga qaytadi
 *  - Barcha postlar tugaganda (next yo'q) > o'chiriladi
 *  - x = (index - active) * STEP — faqat x animatsiya, width/height o'zgarmaydi
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Newspaper, CalendarBlank, PlayCircle,
  CaretRight, CaretLeft, Pause, Play, ArrowUpRight, CircleNotch
} from '@phosphor-icons/react';
import { getYangiliklar } from '../lib/api';

const CARD_W  = 360;
const CARD_H  = 500;
const GAP     = 22;
const STEP    = CARD_W + GAP;
const AUTO_MS = 1200;

function getVisual(offset) {
  const a = Math.abs(offset);
  if (a === 0) return { scale: 1.00, opacity: 1.00, blur: 0,   z: 10 };
  if (a === 1) return { scale: 0.87, opacity: 0.58, blur: 1.5, z: 7  };
  if (a === 2) return { scale: 0.76, opacity: 0.28, blur: 3.0, z: 4  };
  return             { scale: 0.68, opacity: 0.00, blur: 4.5, z: 1  };
}

const KAT = {
  report:    { label: "O'yin hisoboti", color: '#ef4444', glow: 'rgba(239,68,68,.3)',   bg: 'rgba(239,68,68,.13)'   },
  transfer:  { label: 'Transfer',       color: '#3b82f6', glow: 'rgba(59,130,246,.3)',  bg: 'rgba(59,130,246,.13)'  },
  highlight: { label: 'Taqdimot',       color: '#22c55e', glow: 'rgba(34,197,94,.3)',   bg: 'rgba(34,197,94,.13)'   },
  news:      { label: 'Yangilik',       color: '#eab308', glow: 'rgba(234,179,8,.3)',   bg: 'rgba(234,179,8,.13)'   },
  award:     { label: 'Mukofot',        color: '#a78bfa', glow: 'rgba(167,139,250,.3)', bg: 'rgba(167,139,250,.13)' },
};

// ─── Bitta karta ──────────────────────────────────────────────────────────────
function Card({ item, index, active, total, pageInfo, onClick }) {
  const offset   = index - active;
  const v        = getVisual(offset);
  const kat      = KAT[item?.category] ?? KAT.news;
  const isCenter = offset === 0;

  const date = item?.created_at
    ? new Date(item.created_at).toLocaleDateString('uz-UZ', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '';

  return (
    <motion.div
      layoutId={`card-${item?.id ?? index}`}
      onClick={onClick}
      initial={false}
      animate={{
        x:       offset * STEP,
        scale:   v.scale,
        opacity: v.opacity,
        filter:  `blur(${v.blur}px)`,
        zIndex:  v.z,
      }}
      transition={{
        x:       { type: 'spring', stiffness: 240, damping: 28, mass: 1.0 },
        scale:   { type: 'spring', stiffness: 240, damping: 28, mass: 1.0 },
        opacity: { duration: 0.3, ease: 'easeOut' },
        filter:  { duration: 0.3, ease: 'easeOut' },
      }}
      style={{
        position:      'absolute',
        left:          '50%',
        top:           '50%',
        marginLeft:    -(CARD_W / 2),
        marginTop:     -(CARD_H / 2),
        width:         CARD_W,
        height:        CARD_H,
        borderRadius:  20,
        overflow:      'hidden',
        background:    'var(--bg3)',
        display:       'flex',
        flexDirection: 'column',
        cursor:        isCenter ? 'default' : (Math.abs(offset) <= 2 ? 'pointer' : 'default'),
        border:        isCenter
          ? '1px solid rgba(255,255,255,.18)'
          : '1px solid rgba(255,255,255,.05)',
        boxShadow: isCenter
          ? `0 28px 70px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.09), 0 0 60px ${kat.glow}`
          : '0 6px 24px rgba(0,0,0,.35)',
        willChange:    'transform, opacity',
        userSelect:    'none',
        pointerEvents: Math.abs(offset) <= 2 ? 'auto' : 'none',
      }}
    >
      {/* Rasm */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {item?.cover_image_url ? (
          <motion.img
            src={item.cover_image_url}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            whileHover={isCenter ? { scale: 1.05 } : {}}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(145deg, var(--bg4) 0%, var(--bg3) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Newspaper size={isCenter ? 44 : 28} color="rgba(255,255,255,.07)" />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(6,8,16,.95) 0%, rgba(6,8,16,.2) 55%, transparent 100%)',
        }} />

        {/* Rang glow */}
        {isCenter && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 25% 100%, ${kat.glow} 0%, transparent 55%)`,
          }} />
        )}

        {/* Sana */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 5,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 8,
          background: 'var(--red)', color: '#fff',
          fontFamily: 'var(--f-display)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          <CalendarBlank size={9} />{date}
        </div>

        {/* Kategoriya */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 5,
          padding: '5px 10px', borderRadius: 99,
          background: kat.bg, color: kat.color,
          border: `1px solid ${kat.color}45`,
          fontFamily: 'var(--f-display)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {kat.label}
        </div>

        {/* Video */}
        {(item?.video_file_url || item?.video_url) && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.18)',
          }}>
            <PlayCircle size={isCenter ? 40 : 24} color="rgba(255,255,255,.85)" />
          </div>
        )}

        {/* Markaz: sarlavha */}
        {isCenter && (
          <motion.div
            key={`title-${item?.id}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut', delay: 0.05 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '0 16px 14px', zIndex: 4,
            }}
          >
            <div style={{
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              background: 'rgba(6,8,16,.56)',
              border: '1px solid rgba(255,255,255,.09)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <p style={{
                fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: 14,
                color: '#fff', lineHeight: 1.35, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                textShadow: '0 2px 12px rgba(0,0,0,.5)',
              }}>
                {item?.title}
              </p>
              {item?.excerpt && (
                <p style={{
                  fontFamily: 'var(--f-body)', fontSize: 11,
                  color: 'rgba(255,255,255,.5)', lineHeight: 1.5,
                  margin: '5px 0 0',
                  display: '-webkit-box', WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {item.excerpt}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Kichik karta sarlavhasi */}
        {!isCenter && Math.abs(offset) <= 2 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 12px 10px', zIndex: 4,
          }}>
            <p style={{
              fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 11,
              color: 'rgba(255,255,255,.75)', lineHeight: 1.3, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {item?.title}
            </p>
          </div>
        )}
      </div>

      {/* Markaz: footer */}
      {isCenter && (
        <div style={{
          padding: '11px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,.07)',
          flexShrink: 0, background: 'var(--bg3)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 9,
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.1)',
            fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,.82)', letterSpacing: '.07em', textTransform: 'uppercase',
          }}>
            <span>Batafsil o'qish</span>
            <ArrowUpRight size={12} />
          </div>
          <span style={{
            fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--tx4)',
          }}>
            {pageInfo}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export default function NewsStrip({ initialItems, initialNext, activeKat }) {
  const navigate = useNavigate();

  const [items,    setItems]    = useState(initialItems || []);
  const [nextUrl,  setNextUrl]  = useState(initialNext  || null);
  const [active,   setActive]   = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  // pageOffset: nechta post ko'rildi (global counter)
  const [pageOffset, setPageOffset] = useState(0);

  const startRef  = useRef(null);
  const autoRef   = useRef(null);
  const touchRef  = useRef(null);

  const len    = items.length;
  const isLast = active === len - 1;
  const hasMore = !!nextUrl;

  // ── Keyingi sahifani yuklash ─────────────────────────────────────────────
  const loadNextPage = useCallback(async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      // nextUrl = '/api/yangiliklar/?page=2&...'
      // getYangiliklar bilan page param orqali yuklaymiz
      const pageNum = new URL(nextUrl, window.location.origin).searchParams.get('page') || 2;
      const params  = { page: pageNum };
      if (activeKat) params.kategoriya = activeKat;

      const data = await getYangiliklar(params);
      const newItems = data.results || data || [];
      const newNext  = data.next || null;

      setPageOffset(prev => prev + len);
      setItems(newItems);
      setNextUrl(newNext);
      setActive(0);
      setProgress(0);
      startRef.current = Date.now();
    } catch (e) {
      console.error('Load next page error:', e);
    }
    setLoading(false);
  }, [nextUrl, loading, len, activeKat]);

  // ── Navigatsiya ──────────────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    setActive(idx);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  const next = useCallback(() => {
    if (active < len - 1) {
      goTo(active + 1);
    } else if (hasMore) {
      loadNextPage();
    }
    // Agar oxirgi sahifa, oxirgi post — o'ng strelka disable bo'ladi
  }, [active, len, hasMore, goTo, loadNextPage]);

  const prev = useCallback(() => {
    if (active > 0) goTo(active - 1);
  }, [active, goTo]);

  // ── Autoplay ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Oxirgi postda autoplay to'xtaydi (foydalanuvchi o'zi bosadi)
    if (paused || isLast) {
      clearInterval(autoRef.current);
      return;
    }
    startRef.current = Date.now();
    autoRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min((elapsed / AUTO_MS) * 100, 100));
      if (elapsed >= AUTO_MS) next();
    }, 20);
    return () => clearInterval(autoRef.current);
  }, [paused, isLast, active, next]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev]);

  // ── Touch ────────────────────────────────────────────────────────────────
  const onTouchStart = (e) => { touchRef.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (!touchRef.current) return;
    const d = touchRef.current - e.changedTouches[0].clientX;
    if (Math.abs(d) > 44) d > 0 ? next() : prev();
    touchRef.current = null;
  };

  // ── Kategoriya o'zgarganda reset ─────────────────────────────────────────
  useEffect(() => {
    setItems(initialItems || []);
    setNextUrl(initialNext || null);
    setActive(0);
    setPageOffset(0);
    setProgress(0);
  }, [initialItems, initialNext]);

  if (!items.length) return null;

  const aktifKatCfg = KAT[items[active]?.category] ?? KAT.news;
  const canGoLeft  = active > 0;
  const canGoRight = active < len - 1 || (isLast && hasMore);

  return (
    <div
      style={{ position: 'relative', padding: '40px 0 68px', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Fon glow */}
      <motion.div
        animate={{
          background: `radial-gradient(ellipse at 50% 70%, ${aktifKatCfg.glow} 0%, transparent 52%)`,
        }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* Progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: 'rgba(255,255,255,.05)',
      }}>
        <motion.div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${aktifKatCfg.color}bb, ${aktifKatCfg.color})`,
            boxShadow: `0 0 8px ${aktifKatCfg.glow}`,
            transformOrigin: 'left center',
          }}
          animate={{ scaleX: isLast ? 1 : progress / 100 }}
          transition={{ duration: 0.02, ease: 'linear' }}
        />
      </div>

      {/* Karta sahnasi */}
      <div style={{
        position: 'relative',
        height: CARD_H + 40,
        width: '100%',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        maskImage:        'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}>
        {items.map((item, index) => (
          <Card
            key={`${item?.id ?? index}-${pageOffset}`}
            item={item}
            index={index}
            active={active}
            total={len}
            pageInfo={`${pageOffset + index + 1}`}
            onClick={() => {
              const offset = index - active;
              if (offset === 0) navigate(`/yangiliklar/${item?.id}`);
              else if (offset > 0) next();
              else prev();
            }}
          />
        ))}

        {/* Loading overlay — keyingi sahifa yuklanayotganda */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(6,8,16,.5)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            >
              <CircleNotch size={32} color="var(--gold-light)" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Chap strelka */}
      <motion.button
        whileHover={canGoLeft ? { scale: 1.12, background: 'rgba(204,26,46,.85)' } : {}}
        whileTap={canGoLeft ? { scale: 0.94 } : {}}
        onClick={prev}
        disabled={!canGoLeft}
        style={{
          position: 'absolute', left: 20, top: '50%', transform: 'translateY(-60%)',
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(14,18,34,.88)', backdropFilter: 'blur(10px)',
          border: `1px solid ${canGoLeft ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.04)'}`,
          color: canGoLeft ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.15)',
          cursor: canGoLeft ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30, boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          transition: 'border .2s, color .2s',
        }}
      >
        <CaretLeft size={19} />
      </motion.button>

      {/* O'ng strelka — oxirgi postda LOADING ko'rsatadi yoki DISABLED */}
      <motion.button
        whileHover={canGoRight ? { scale: 1.12, background: 'rgba(204,26,46,.85)' } : {}}
        whileTap={canGoRight ? { scale: 0.94 } : {}}
        onClick={next}
        disabled={!canGoRight || loading}
        style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-60%)',
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(14,18,34,.88)', backdropFilter: 'blur(10px)',
          border: `1px solid ${canGoRight ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.04)'}`,
          color: canGoRight ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.15)',
          cursor: canGoRight ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30, boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          transition: 'border .2s, color .2s',
        }}
      >
        {loading
          ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <CircleNotch size={17} />
            </motion.div>
          : <CaretRight size={19} />
        }
      </motion.button>

      {/* Pastki panel */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        {/* Chiziqli trek */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          background: 'rgba(14,18,34,.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 99, padding: '6px 14px',
        }}>
          {items.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => i <= active + 1 ? goTo(i) : null}
              animate={{
                width:      i === active ? 24 : 5,
                background: i < active
                  ? aktifKatCfg.color
                  : i === active
                    ? aktifKatCfg.color
                    : 'rgba(255,255,255,.18)',
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                height: 5, borderRadius: 99,
                border: 'none', padding: 0,
                cursor: i <= active + 1 ? 'pointer' : 'default',
                boxShadow: i === active ? `0 0 8px ${aktifKatCfg.glow}` : 'none',
              }}
            />
          ))}
          {/* Keyingi sahifa bor ekan ko'rsatuvchi 3 nuqta */}
          {hasMore && (
            <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: 'rgba(255,255,255,.3)',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Pauza */}
        <motion.button
          whileHover={{ color: '#fff' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPaused(p => !p)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(14,18,34,.88)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.1)',
            color: 'rgba(255,255,255,.5)',
            fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
            letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {paused ? <Play size={11} fill="currentColor" /> : <Pause size={11} />}
          <span>{paused ? 'Davom' : 'Pauza'}</span>
        </motion.button>
      </div>
    </div>
  );
}