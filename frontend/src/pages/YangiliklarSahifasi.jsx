import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchYangiliklar } from '../lib/api';
import { Newspaper } from '@phosphor-icons/react';
import NewsStrip from '../components/NewsStrip';

const KATEGORIYALAR = [
  { key: '', label: 'Barchasi' },
  { key: 'news', label: 'Yangiliklar' },
  { key: 'report', label: 'Hisobotlar' },
  { key: 'highlight', label: 'Taqdimotlar' },
  { key: 'transfer', label: 'Transferlar' },
];

export default function YangiliklarSahifasi() {
  const [activeKat, setActiveKat] = useState('');

  const params = activeKat ? { kategoriya: activeKat } : {};

  const yangiliklarQuery = useQuery({
    queryKey: ['yangiliklar', activeKat || 'all'],
    queryFn: () => fetchYangiliklar(params),
    placeholderData: (prev) => prev,
  });

  const items = yangiliklarQuery.data?.results ?? yangiliklarQuery.data ?? [];
  const nextUrl = yangiliklarQuery.data?.next ?? null;
  const loading = yangiliklarQuery.isLoading && !yangiliklarQuery.data;
  const status = yangiliklarQuery.error?.response?.status;
  const isRateLimited = status === 429;

  return (
    <div className="yng-wrap">
      {/* Header */}
      <div className="yng-hdr">
        <div className="container">
          <div className="yng-hdr-row">
            <div>
              <span className="yng-eyebrow"><Newspaper size={12} />Media markaz</span>
              <h1 className="yng-h1">Yangiliklar</h1>
            </div>
            <div className="yng-cats">
              {KATEGORIYALAR.map(k => (
                <button
                  key={k.key}
                  className={`yng-cat-btn ${activeKat === k.key ? 'yng-cat-active' : ''}`}
                  onClick={() => setActiveKat(k.key)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 80 }}>
        {yangiliklarQuery.isError && (
          <div className="container" style={{ paddingTop: 22 }}>
            <div style={{
              background: 'rgba(204,26,46,.12)',
              border: '1px solid rgba(204,26,46,.35)',
              borderRadius: 14,
              padding: '12px 14px',
              color: 'var(--tx1)',
            }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                {isRateLimited ? "Ko'p so'rov yuborildi (429)" : "Ma'lumot yuklanmadi"}
              </div>
              <div style={{ opacity: 0.85, fontSize: 13, marginBottom: 10 }}>
                {isRateLimited
                  ? "Iltimos 20-30 soniya kuting va qayta urinib ko'ring."
                  : (yangiliklarQuery.error?.response?.data?.detail ?? yangiliklarQuery.error?.message ?? "Noma'lum xato")}
              </div>
              <button className="btn btn-red" onClick={() => yangiliklarQuery.refetch()}>Qayta urinish</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="container" style={{ paddingTop: 60 }}>
            <div className="yng-skel-row">
              {[1,2,3,4,5].map(i => <div key={i} className="yng-skel-card" />)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="container yng-empty">
            <Newspaper size={52} opacity={0.1} />
            <p>Bu ruknda hozircha yangiliklar yo'q</p>
          </div>
        ) : (
          <NewsStrip
            key={activeKat}
            initialItems={items}
            initialNext={nextUrl}
            activeKat={activeKat}
          />
        )}
      </div>

      <style>{`
        .yng-wrap { min-height: 100vh; padding-top: 68px; }
        .yng-hdr { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 40px 0 28px; }
        .yng-hdr-row { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; }
        .yng-eyebrow { display:inline-flex; align-items:center; gap:6px; font-family:var(--f-display); font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--gold-light); margin-bottom:8px; }
        .yng-h1 { font-family:var(--f-display); font-size:36px; font-weight:900; color:var(--tx1); letter-spacing:-.025em; }
        .yng-cats { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .yng-cat-btn { padding:7px 18px; border-radius:99px; border:1px solid var(--border-2); background:transparent; color:var(--tx3); font-family:var(--f-display); font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; transition:all .2s; white-space:nowrap; }
        .yng-cat-btn:hover { color:var(--tx1); border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.04); }
        .yng-cat-active { background:var(--tx1)!important; color:var(--bg)!important; border-color:var(--tx1)!important; }
        .yng-skel-row { display:flex; gap:18px; overflow:hidden; padding:40px 0; }
        .yng-skel-card { flex-shrink:0; width:280px; height:380px; background:var(--bg2); border-radius:18px; animation:pulse 1.5s infinite; }
        .yng-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:80px 24px; color:var(--tx3); font-family:var(--f-display); font-size:13px; font-weight:600; }
        @media(max-width:768px){ .yng-h1{font-size:26px;} .yng-hdr-row{flex-direction:column;align-items:flex-start;} }
      `}</style>
    </div>
  );
}
