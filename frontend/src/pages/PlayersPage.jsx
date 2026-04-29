import { useState, useEffect } from 'react';
import { getTopFutbolchi } from '../lib/api';

export default function PlayersPage() {
  const [futbolchilar, setFutbolchilar] = useState([]);
  const [yuklanyapti, setYuklanyapti]   = useState(true);

  useEffect(() => {
    getTopFutbolchi()
      .then(data => {
        const tartiblangan = (data || [])
          .map(f => ({ ...f, ball: (f.gollar || 0) * 3 + (f.assistlar || 0) * 1.5 }))
          .sort((a, b) => b.ball - a.ball);
        setFutbolchilar(tartiblangan);
        setYuklanyapti(false);
      })
      .catch(() => setYuklanyapti(false));
  }, []);

  const eng = futbolchilar[0]?.ball || 1;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom:8 }}>Mavsum 2024/25</div>
          <h1 className="page-title">Top O'yinchilar</h1>
          <p className="page-subtitle">
            Vaznli ball tizimi: Gol (×3) + Assist (×1.5) asosida tartib
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:80 }}>
        {yuklanyapti ? (
          <div className="loading-center"><div className="spinner" /><span>Yuklanmoqda...</span></div>
        ) : futbolchilar.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏅</div>
            <div className="empty-state-text">Ma'lumot mavjud emas</div>
          </div>
        ) : (
          <div className="players-list">
            {futbolchilar.map((f, i) => {
              const darajaClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
              return (
                <div key={i} className="player-row">
                  <span className={`player-rank ${darajaClass}`}>{i + 1}</span>

                  {/* Rasm yoki harf */}
                  <div className="player-avatar" style={{ background:`${f.jamoa_rang}22`, border:`1.5px solid ${f.jamoa_rang}55` }}>
                    {f.rasm
                      ? <img src={f.rasm} alt={f.futbolchi_ism} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                      : <span style={{ color:f.jamoa_rang, fontSize:18, fontFamily:'var(--f-display)', fontWeight:900 }}>
                          {f.futbolchi_ism?.[0]}
                        </span>
                    }
                  </div>

                  <div className="player-info">
                    <div className="player-name">{f.futbolchi_ism}</div>
                    <div className="player-club">{f.jamoa_ism}</div>
                    <div className="player-bar-track">
                      <div className="player-bar-fill"
                        style={{ width:`${(f.ball / eng) * 100}%`, background:f.jamoa_rang, transition:'width .8s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>

                  <div className="player-stats">
                    <div className="player-stat-box">
                      <span className="player-stat-val">{f.gollar}</span>
                      <span className="player-stat-lbl">Gol</span>
                    </div>
                    <div className="player-stat-box">
                      <span className="player-stat-val">{f.assistlar}</span>
                      <span className="player-stat-lbl">Assist</span>
                    </div>
                    <div className="player-stat-box" style={{ borderLeft:'1px solid var(--border)', paddingLeft:12 }}>
                      <span className="player-stat-val" style={{ color:'var(--gold)', fontSize:15 }}>
                        {f.ball.toFixed(0)}
                      </span>
                      <span className="player-stat-lbl">Ball</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ball tizimi tushuntirish */}
        <div style={{ marginTop:40, padding:'18px 22px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--tx3)' }}>Ball tizimi</span>
          {[['⚽ Har bir gol', '3 ball'], ['🎯 Har bir assist', '1.5 ball']].map(([label, val]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--tx2)' }}>{label}</span>
              <span className="badge badge-gold" style={{ fontSize:10 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
