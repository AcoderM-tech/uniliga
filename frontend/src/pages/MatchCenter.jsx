import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TacticalBoard from '../components/TacticalBoard';
import { getOyin } from '../lib/api';

export default function MatchCenter() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOyin(id)
      .then(setMatch)
      .catch(() => navigate('/oyinlar'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ paddingTop:68 }}>
      <div className="loading-center" style={{ minHeight:'60vh' }}>
        <div className="spinner"/><span>Yuklanmoqda...</span>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop:68 }}>
      <div style={{
        background:'linear-gradient(180deg,var(--bg2) 0%,var(--bg) 100%)',
        padding:'40px 0 32px', borderBottom:'1px solid var(--border)', marginBottom:32,
      }}>
        <div className="container">
          <div className="section-eyebrow" style={{ marginBottom:8 }}>Match Center</div>
          <h1 style={{
            fontFamily:'var(--f-display)', fontWeight:900,
            fontSize:'clamp(22px,4vw,36px)', color:'var(--tx1)',
            letterSpacing:'-.02em', lineHeight:1, marginBottom:8,
          }}>
            {match?.home_team_name} <span style={{ color:'var(--tx4)' }}>vs</span> {match?.away_team_name}
          </h1>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--tx3)' }}>
              {match?.match_date} · {match?.match_time?.slice(0,5)} · {match?.stadium}
            </span>
            {match?.status === 'live' && (
              <span className="badge badge-red"><span className="live-dot"/>JONLI</span>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:80, maxWidth:780 }}>
        <TacticalBoard matchId={Number(id)} isAdmin={false}/>
      </div>
    </div>
  );
}
