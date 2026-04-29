import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchJadval, fetchFaolMavsum, fetchMavsum } from '../lib/api';
import LigaJadvali from '../components/LigaJadvali';

export default function JadvalSahifasi() {
  const [params] = useSearchParams();
  const mavsumId = params.get('mavsum');

  const mavsumQuery = useQuery({
    queryKey: ['mavsum', mavsumId || 'active'],
    queryFn: () => (mavsumId ? fetchMavsum(mavsumId) : fetchFaolMavsum()),
    placeholderData: (prev) => prev,
  });

  const jadvalParams = useMemo(() => (mavsumId ? { mavsum: mavsumId } : {}), [mavsumId]);

  const jadvalQuery = useQuery({
    queryKey: ['jadval', mavsumId || 'active'],
    queryFn: () => fetchJadval(jadvalParams),
    placeholderData: (prev) => prev,
  });

  const mavsum = mavsumQuery.data ?? null;
  const qatorlar = jadvalQuery.data ?? [];
  const isInitialLoading = jadvalQuery.isLoading && !jadvalQuery.data;
  const status = jadvalQuery.error?.response?.status;
  const isRateLimited = status === 429;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom:8 }}>{mavsum?.name ? `Mavsum ${mavsum.name}` : 'Mavsum'}</div>
          <h1 className="page-title">Liga jadvali</h1>
          <p className="page-subtitle">Joriy turnir jadvali — ball, gol farqi va shakl</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:80 }}>
        {jadvalQuery.isError && (
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
                  : (jadvalQuery.error?.response?.data?.detail ?? jadvalQuery.error?.message ?? "Noma'lum xato")}
              </div>
              <button className="btn btn-red" onClick={() => jadvalQuery.refetch()}>Qayta urinish</button>
            </div>
          </div>
        )}

        <div style={{ marginBottom:20, display:'flex', gap:16, alignItems:'center' }}>
          <div className="table-legend">
            <span className="legend-dot champion">Chempion</span>
            <span className="legend-dot promotion">Top 3</span>
          </div>
        </div>
        {isInitialLoading ? <div className="loading-center"><div className="spinner" /></div> : <LigaJadvali qatorlar={qatorlar} />}
      </div>
    </div>
  );
}
