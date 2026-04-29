import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../lib/api';
import { Clock, ChevronRight } from '@phosphor-icons/react';

const CAT_COLORS = { report:'#cc1a2e', transfer:'#1a56db', highlight:'#1a8a4a', news:'#c9a227', award:'#7c3aed' };
const CATS = [
  { key: '',          label: 'All' },
  { key: 'news',      label: 'News' },
  { key: 'report',    label: 'Match Reports' },
  { key: 'highlight', label: 'Highlights' },
  { key: 'transfer',  label: 'Transfers' },
  { key: 'award',     label: 'Awards' },
];

export default function NewsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('');

  useEffect(() => {
    setLoading(true);
    const p = cat ? { category: cat } : {};
    getPosts(p)
      .then(d => { setPosts(d.results || d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cat]);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>UniLiga Media</div>
          <h1 className="page-title">News &amp; Reports</h1>
          <p className="page-subtitle">Match reports, transfer news, highlights and league updates</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="filter-tabs">
            {CATS.map(c => (
              <button key={c.key} className={`filter-tab ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading news...</span></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <div className="empty-state-text">No posts found</div>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((p, i) => {
              const catColor = CAT_COLORS[p.category] || '#cc1a2e';
              const d = p.created_at
                ? new Date(p.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                : '';
              return (
                <div key={p.id} className={`post-card${i === 0 && !cat ? ' featured' : ''}`}
                  onClick={() => navigate(`/news/${p.id}`)}>
                  <div className="post-image">
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt={p.title} loading="lazy" />
                      : <div className="post-image-placeholder">📰</div>
                    }
                    <div className="post-image-overlay" />
                    <div className="post-cat-badge">
                      <span className="badge" style={{ background:`${catColor}22`, border:`1px solid ${catColor}66`, color:catColor }}>
                        {p.category}
                      </span>
                    </div>
                  </div>
                  <div className="post-body">
                    <div className="post-meta"><Clock size={11} />{d}</div>
                    <h3 className="post-title">{p.title}</h3>
                    <p className="post-excerpt">{p.excerpt}</p>
                    <div className="post-read-more">Read More <CaretRight size={12} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
