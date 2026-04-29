import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOyinlar, fetchFaolMavsum, fetchMavsum } from '../lib/api';
import { makeWsUrl } from '../lib/ws';
import OyinKarta from '../components/OyinKarta';

const LIVE_STATUSES = new Set(['live', 'half_time', 'second_half', 'extra_time']);

const HOLAT_FILTRLAR = [
  { kalit: '',         nomi: 'Barchasi' },
  { kalit: 'live',     nomi: '🔴 Jonli' },
  { kalit: 'upcoming', nomi: 'Kutilmoqda' },
  { kalit: 'finished', nomi: 'Tugagan' },
];

export default function OyinlarSahifasi() {
  const [params, setParams] = useSearchParams();
  const mavsumId = params.get('mavsum');
  const holat    = params.get('holat') || '';
  const hafta    = params.get('hafta') || '';

  const queryClient = useQueryClient();

  const mavsumQuery = useQuery({
    queryKey: ['mavsum', mavsumId || 'active'],
    queryFn: () => (mavsumId ? fetchMavsum(mavsumId) : fetchFaolMavsum()),
    placeholderData: (prev) => prev,
  });

  const matchParams = useMemo(() => {
    const p = {};
    if (holat) p.holat = holat;
    if (hafta) p.hafta = hafta;
    if (mavsumId) p.mavsum = mavsumId;
    return p;
  }, [holat, hafta, mavsumId]);

  const matchesKey = useMemo(() => ['oyinlar', matchParams], [matchParams]);

  const oyinlarQuery = useQuery({
    queryKey: matchesKey,
    queryFn: () => fetchOyinlar(matchParams),
    placeholderData: (prev) => prev,
  });

  const mavsum = mavsumQuery.data ?? null;
  const oyinlar = oyinlarQuery.data?.results ?? oyinlarQuery.data ?? [];

  const holatRef = useRef(holat);
  useEffect(() => { holatRef.current = holat; }, [holat]);

  const keyRef = useRef(matchesKey);
  useEffect(() => { keyRef.current = matchesKey; }, [matchesKey]);

  // WebSocket — live feed updates scores & status in-place (no extra HTTP requests)
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let shouldReconnect = true;
    let attempt = 0;

    const connect = () => {
      ws = new WebSocket(makeWsUrl('/ws/jonli/'));

      ws.onopen = () => { attempt = 0; };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type !== 'live_update') return;

          const updated = msg.data;
          const currentHolat = holatRef.current;

          queryClient.setQueryData(keyRef.current, (prev) => {
            if (!prev) return prev;

            const isPaginated = Array.isArray(prev?.results);
            const list = isPaginated ? (prev.results || []) : (Array.isArray(prev) ? prev : []);

            const idx = list.findIndex((m) => m.id === updated.id);

            if (currentHolat === 'live' && idx >= 0 && !LIVE_STATUSES.has(updated.status)) {
              const nextList = list.filter((m) => m.id !== updated.id);
              return isPaginated ? { ...prev, results: nextList } : nextList;
            }

            if (idx < 0) {
              if (!currentHolat || currentHolat === 'live') {
                const nextList = [updated, ...list];
                return isPaginated ? { ...prev, results: nextList } : nextList;
              }
              return prev;
            }

            const nextList = [...list];
            nextList[idx] = { ...nextList[idx], ...updated };
            return isPaginated ? { ...prev, results: nextList } : nextList;
          });
        } catch {}
      };

      ws.onclose = () => {
        if (!shouldReconnect) return;
        const delay = Math.min(1000 * 2 ** attempt, 10_000);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [queryClient]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const haftaTabs = useMemo(() => {
    const total = parseInt(mavsum?.weeks_total || 0);
    if (!total) return [];
    return [
      { kalit: '', nomi: 'Barcha haftalar' },
      ...Array.from({ length: total }, (_, i) => ({ kalit: String(i + 1), nomi: `${i + 1}-hafta` })),
    ];
  }, [mavsum?.weeks_total]);

  // Count live matches for badge
  const liveCount = oyinlar.filter(o => LIVE_STATUSES.has(o.status)).length;

  const isInitialLoading = oyinlarQuery.isLoading && !oyinlarQuery.data;
  const status = oyinlarQuery.error?.response?.status;
  const isRateLimited = status === 429;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom:8 }}>
            {mavsum?.name ? `Mavsum ${mavsum.name}` : 'Mavsum'}
          </div>
          <h1 className="page-title">O'yinlar va natijalar</h1>
          <p className="page-subtitle">To'liq o'yinlar ro'yxati — jonli, kutilayotgan va tugagan</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:80 }}>
        {oyinlarQuery.isError && (
          <div style={{ marginBottom: 18 }}>
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
                  : (oyinlarQuery.error?.response?.data?.detail ?? oyinlarQuery.error?.message ?? "Noma'lum xato")}
              </div>
              <button className="btn btn-red" onClick={() => oyinlarQuery.refetch()}>Qayta urinish</button>
            </div>
          </div>
        )}

        {/* Week tabs */}
        {haftaTabs.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div className="filter-tabs-wrap">
              <div className="filter-tabs">
                {haftaTabs.map(h => (
                  <button key={h.kalit}
                    className={`filter-tab ${hafta === h.kalit ? 'active' : ''}`}
                    onClick={() => setParam('hafta', h.kalit)}>
                    {h.nomi}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status filter */}
        <div style={{ marginBottom:28 }}>
          <div className="filter-tabs-wrap">
            <div className="filter-tabs">
              {HOLAT_FILTRLAR.map(f => (
                <button key={f.kalit}
                  className={`filter-tab ${holat === f.kalit ? 'active' : ''}`}
                  onClick={() => setParam('holat', f.kalit)}
                  style={{ position:'relative' }}>
                  {f.nomi}
                  {f.kalit === 'live' && liveCount > 0 && (
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      marginLeft:6, minWidth:18, height:18, borderRadius:9,
                      background:'var(--red)', color:'#fff',
                      fontFamily:'var(--f-mono)', fontSize:10, fontWeight:700, padding:'0 4px',
                    }}>{liveCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isInitialLoading ? (
          <div className="loading-center"><div className="spinner"/><span>Yuklanmoqda...</span></div>
        ) : oyinlar.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">
              {holat === 'live' ? 'Hozir jonli o\'yin yo\'q' : 'O\'yin topilmadi'}
            </div>
          </div>
        ) : (
          <div className="matches-grid">
            {oyinlar.map(o => <OyinKarta key={o.id} oyin={o}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
