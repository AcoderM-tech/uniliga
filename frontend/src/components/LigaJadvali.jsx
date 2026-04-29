import { useState, useEffect } from 'react';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

/* ── Mobil: har bir qator — chiroyli karta ── */
function MobilJadvalQator({ q, i }) {
  const o      = q.position || i + 1;
  const oClass = o === 1 ? 'champion' : o <= 3 ? 'promotion' : '';
  const color  = q.team_color || '#cc1a2e';
  const gd     = q.goal_diff;
  const formArr = (q.form || '').split('').slice(-5);

  const posColor =
    o === 1 ? 'var(--gold)' :
    o <= 3  ? 'var(--red-light)' :
              'var(--tx3)';

  return (
    <div className="mjq-row" style={{ animationDelay: `${i * 0.04}s` }}>
      {/* Chap: raqam + belgi */}
      <div className="mjq-left">
        <span className="mjq-pos" style={{ color: posColor }}>{o}</span>
        <div className="mjq-crest" style={{ borderColor: color + '44' }}>
          {q.team_logo
            ? <img src={q.team_logo} alt={q.team_short} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            : <span className="mjq-crest-letter" style={{ color }}>{q.team_short?.[0]}</span>
          }
        </div>
        <div className="mjq-info">
          <div className="mjq-name">{q.team_name}</div>
          <div className="mjq-short">{q.team_short}</div>
        </div>
      </div>

      {/* O'rta: statistika pill-lar */}
      <div className="mjq-stats">
        <div className="mjq-stat">
          <span className="mjq-stat-v">{q.played}</span>
          <span className="mjq-stat-l">O</span>
        </div>
        <div className="mjq-stat">
          <span className="mjq-stat-v" style={{ color: '#4ade80' }}>{q.won}</span>
          <span className="mjq-stat-l">G</span>
        </div>
        <div className="mjq-stat">
          <span className="mjq-stat-v" style={{ color: 'var(--gold)' }}>{q.drawn}</span>
          <span className="mjq-stat-l">D</span>
        </div>
        <div className="mjq-stat">
          <span className="mjq-stat-v" style={{ color: 'var(--red-light)' }}>{q.lost}</span>
          <span className="mjq-stat-l">Y</span>
        </div>
        <div className="mjq-stat">
          <span className="mjq-stat-v" style={{ color: gd > 0 ? '#4ade80' : gd < 0 ? 'var(--red-light)' : 'var(--tx3)' }}>
            {gd > 0 ? '+' : ''}{gd}
          </span>
          <span className="mjq-stat-l">GF</span>
        </div>
      </div>

      {/* O'ng: ball + shakl */}
      <div className="mjq-right">
        <span className="mjq-pts" style={{ background: o === 1 ? 'rgba(245,158,11,.15)' : o <= 3 ? 'rgba(204,26,46,.12)' : 'rgba(255,255,255,.06)', color: posColor }}>
          {q.points}
        </span>
        {formArr.length > 0 && (
          <div className="mjq-form">
            {formArr.map((f, fi) => (
              <span key={fi} className={`mjq-pip mjq-pip-${f}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Desktop: klassik jadval ── */
function DesktopJadval({ qatorlar }) {
  return (
    <div className="table-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th style={{ width: 44 }}>#</th>
            <th>Jamoa</th>
            <th title="O'yinlar soni">O</th>
            <th title="G'alabalar">G'</th>
            <th title="Duranglar">D</th>
            <th title="Mag'lubiyatlar">Mag</th>
            <th title="Gol urildi">GU</th>
            <th title="Gol o'tkazildi">GO</th>
            <th title="Gol farqi">GF</th>
            <th title="Yig'ilgan ball" style={{ color: 'var(--tx1)' }}>Ball</th>
            <th title="So'nggi 5 o'yin natijalari">Natija</th>
          </tr>
        </thead>
        <tbody>
          {qatorlar.map((q, i) => {
            const o = q.position || i + 1;
            const oClass = o === 1 ? 'champion' : o <= 3 ? 'promotion' : '';
            return (
              <tr key={q.id} style={{ animationDelay: `${i * .04}s` }}>
                <td><span className={`lt-pos ${oClass}`}>{o}</span></td>
                <td>
                  <div className="lt-team">
                    <div className="lt-crest">
                      {q.team_logo
                        ? <img src={q.team_logo} alt={q.team_short} />
                        : <span className="lt-crest-letter" style={{ color: q.team_color }}>{q.team_short?.[0]}</span>
                      }
                    </div>
                    <span className="lt-name">{q.team_name}</span>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--tx3)' }}>{q.team_short}</span>
                  </div>
                </td>
                <td>{q.played}</td>
                <td style={{ color: '#4ade80' }}>{q.won}</td>
                <td style={{ color: 'var(--gold)' }}>{q.drawn}</td>
                <td style={{ color: 'var(--red-light)' }}>{q.lost}</td>
                <td>{q.goals_for}</td>
                <td>{q.goals_against}</td>
                <td style={{ color: q.goal_diff > 0 ? '#4ade80' : q.goal_diff < 0 ? 'var(--red-light)' : 'var(--tx3)' }}>
                  {q.goal_diff > 0 ? '+' : ''}{q.goal_diff}
                </td>
                <td><span className="lt-pts">{q.points}</span></td>
                <td>
                  <div className="form-pips">
                    {(q.form || '').split('').map((f, fi) => (
                      <span key={fi} className={`form-pip ${f}`}>{f}</span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Asosiy export ── */
export default function LigaJadvali({ qatorlar }) {
  const mobile = useIsMobile();

  if (!qatorlar?.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <div className="empty-state-text">Jadval ma'lumoti yo'q</div>
    </div>
  );

  if (mobile) {
    return (
      <div className="mjq-wrap">
        {/* Header */}
        <div className="mjq-header">
          <span className="mjq-h-pos">#</span>
          <span className="mjq-h-team">Jamoa</span>
          <div className="mjq-h-stats">
            <span>O</span><span>G</span><span>D</span><span>Y</span><span>GF</span>
          </div>
          <span className="mjq-h-ball">Ball</span>
        </div>
        {qatorlar.map((q, i) => (
          <MobilJadvalQator key={q.id || i} q={q} i={i} />
        ))}
      </div>
    );
  }

  return <DesktopJadval qatorlar={qatorlar} />;
}