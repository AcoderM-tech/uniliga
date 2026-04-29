import { useState, useEffect } from 'react';
import { getTable } from '../lib/api';
import LeagueTableComp from '../components/LeagueTableComp';

export default function TablePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTable().then(d => { setRows(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>Season 2024/25</div>
          <h1 className="page-title">League Standings</h1>
          <p className="page-subtitle">Current league table — points, goal difference and form</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 80 }}>
        <div style={{ marginBottom: 20, display:'flex', gap:16, alignItems:'center' }}>
          <div className="table-legend">
            <span className="legend-dot champion">Champions</span>
            <span className="legend-dot promotion">Top 3</span>
          </div>
        </div>
        {loading
          ? <div className="loading-center"><div className="spinner" /></div>
          : <LeagueTableComp rows={rows} />
        }
      </div>
    </div>
  );
}
