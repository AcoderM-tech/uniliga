// src/pages/NotFound.jsx
// ─────────────────────────────────────────────────────────────
//  Universal 404 sahifasi.
//  index.html dagi "NOT FOUND" animatsiyasini React komponentiga
//  ko'chirish. Har qanday catch-all yoki data-driven 404 uchun
//  ishlatiladi.
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function NotFound() {
  const navigate = useNavigate();
  const lettersRef = useRef(null);

  // "NOT FOUND" harflarini birin-ketin chiqarish
  useEffect(() => {
    const el = lettersRef.current;
    if (!el) return;

    'NOT FOUND'.split('').forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      const delay = 0.3 + i * 0.07;
      span.style.setProperty('--bd', delay + 's');
      span.style.animationDelay = delay + 's';
      el.appendChild(span);
    });

    return () => { el.innerHTML = ''; };
  }, []);

  return (
    <>
      <style>{`
        .nf-wrapper {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          font-family: system-ui, -apple-system, sans-serif;
          background: transparent;
          gap: 0;
        }

        .nf-number {
          font-size: clamp(88px, 18vw, 160px);
          font-weight: 800;
          letter-spacing: -6px;
          line-height: 1;
          user-select: none;
          opacity: 0;
          animation: nfFadeUp .7s cubic-bezier(.22,1,.36,1) .2s forwards;
        }
        .nf-number .w { color: #ffffff; }
        .nf-number .r { color: #cc1a2e; }

        .nf-letters {
          display: flex;
          gap: 2px;
          margin-top: 12px;
          margin-bottom: 32px;
        }
        .nf-letters span {
          font-size: clamp(10px, 1.4vw, 12px);
          font-weight: 700;
          letter-spacing: .22em;
          display: inline-block;
          opacity: 0;
          animation:
            nfFadeUp .5s ease forwards,
            nfBounce 1.5s ease-in-out var(--bd) infinite;
        }
        .nf-letters span:nth-child(odd)  { color: #ffffff; }
        .nf-letters span:nth-child(even) { color: #cc1a2e; }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 22px;
          height: 38px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .07em;
          text-decoration: none;
          color: rgba(255,255,255,.75);
          border: 1px solid rgba(204,26,46,.35);
          background: rgba(204,26,46,.08);
          cursor: pointer;
          transition: background .2s, border-color .2s, color .2s, transform .18s;
          opacity: 0;
          animation: nfFadeUp .5s ease .8s forwards;
          position: relative;
          overflow: hidden;
        }
        .nf-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.1) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform .45s ease;
        }
        .nf-btn:hover::after { transform: translateX(120%); }
        .nf-btn:hover {
          background: rgba(204,26,46,.18);
          border-color: rgba(204,26,46,.7);
          color: #fff;
          transform: translateY(-2px);
        }
        .nf-btn svg {
          width: 13px; height: 13px;
          stroke: currentColor; fill: none;
          stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
          flex-shrink: 0;
        }

        @keyframes nfFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nfBounce {
          0%, 100% { transform: translateY(0);   opacity: 1; }
          45%      { transform: translateY(-7px); opacity: .3; }
        }
      `}</style>

      <div className="nf-wrapper">
        <div className="nf-number">
          <span className="w">4</span>
          <span className="r">0</span>
          <span className="w">4</span>
        </div>

        <div className="nf-letters" ref={lettersRef} />

        <button className="nf-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Bosh sahifaga qaytish
        </button>
      </div>
    </>
  );
}