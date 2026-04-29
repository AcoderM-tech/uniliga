export default function LeagueTableComp({ rows }) {
  if (!rows?.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <div className="empty-state-text">No standings yet</div>
    </div>
  );

  return (
    <div className="table-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th style={{ width: 44 }}>#</th>
            <th>Club</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th style={{ color: 'var(--tx1)' }}>Pts</th>
            <th>Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pos = row.position || i + 1;
            const posClass = pos === 1 ? 'champion' : pos <= 3 ? 'promotion' : '';
            return (
              <tr key={row.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <td>
                  <span className={`lt-pos ${posClass}`}>{pos}</span>
                </td>
                <td>
                  <div className="lt-team">
                    <div className="lt-crest">
                      {row.team_logo
                        ? <img src={row.team_logo} alt={row.team_short} />
                        : <span className="lt-crest-letter" style={{ color: row.team_color }}>
                            {row.team_short?.[0]}
                          </span>
                      }
                    </div>
                    <span className="lt-name">{row.team_name}</span>
                    {row.team_short && (
                      <span style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--tx3)', marginLeft:2 }}>
                        {row.team_short}
                      </span>
                    )}
                  </div>
                </td>
                <td>{row.played}</td>
                <td style={{ color: '#4ade80' }}>{row.won}</td>
                <td style={{ color: 'var(--gold)' }}>{row.drawn}</td>
                <td style={{ color: 'var(--red-light)' }}>{row.lost}</td>
                <td>{row.goals_for}</td>
                <td>{row.goals_against}</td>
                <td style={{ color: row.goal_diff > 0 ? '#4ade80' : row.goal_diff < 0 ? 'var(--red-light)' : 'var(--tx3)' }}>
                  {row.goal_diff > 0 ? '+' : ''}{row.goal_diff}
                </td>
                <td><span className="lt-pts">{row.points}</span></td>
                <td>
                  <div className="form-pips">
                    {(row.form || '').split('').map((f, fi) => (
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
