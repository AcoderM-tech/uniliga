import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TacticalBoard from '../components/TacticalBoard';
import { getOyinlar } from '../lib/api';

export default function AdminMatchCenter() {
  const navigate = useNavigate();
  const [oyinlar,   setOyinlar]   = useState([]);
  const [tanlanganId, setTanlanganId] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getOyinlar({})
      .then(d => setOyinlar(d.results || d || []))
      .finally(() => setLoading(false));
  }, []);

  if (tanlanganId) {
    return (
      <div>
        <div style={{ marginBottom:20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setTanlanganId(null)}>
            ← Orqaga
          </button>
        </div>
        <TacticalBoard matchId={tanlanganId} isAdmin={true}/>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Match Center</h2>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"/></div>
      ) : oyinlar.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">O'yin yo'q</div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {oyinlar.map(o => {
            const isLive = ['live','half_time','second_half','extra_time'].includes(o.status);
            return (
              <div key={o.id} style={{
                background:'var(--bg3)', border:`1px solid ${isLive ? 'var(--red-glow)' : 'var(--border)'}`,
                borderRadius:'var(--r-lg)', padding:'14px 18px',
                display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
                transition:'border-color .2s',
              }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:14, color:'var(--tx1)' }}>
                    {o.home_team_name} <span style={{ color:'var(--tx3)', fontWeight:400 }}>vs</span> {o.away_team_name}
                  </div>
                  <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)', marginTop:2 }}>
                    {o.match_date} · Hafta {o.week}
                  </div>
                </div>
                <div style={{
                  fontFamily:'var(--f-display)', fontWeight:900, fontSize:18, color:'var(--tx1)',
                  letterSpacing:'-.02em', minWidth:50, textAlign:'center',
                }}>
                  {o.home_score} — {o.away_score}
                </div>
                {isLive ? (
                  <span className="badge badge-red"><span className="live-dot"/>JONLI</span>
                ) : (
                  <span className="badge badge-gray" style={{ fontSize:9 }}>{o.status}</span>
                )}
                <button className="btn btn-red btn-sm" onClick={() => setTanlanganId(o.id)}>
                   Taktik doska<span className="btn-shine"/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
