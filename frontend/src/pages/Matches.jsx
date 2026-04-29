import { useState, useEffect } from 'react';
import { getMatches } from '../lib/api';
import MatchCard from '../components/MatchCard';

const FILTERS = [
  { key: '',         label: 'All' },
  { key: 'live',     label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
];

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? { status: filter } : {};
    setLoading(true);
    getMatches(params)
      .then(d => { setMatches(d.results || d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>UniLiga 2024/25</div>
          <h1 className="page-title">Fixtures &amp; Results</h1>
          <p className="page-subtitle">All matches across the season — live scores, upcoming fixtures &amp; results</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading fixtures...</span></div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">No matches found</div>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
