import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CalendarBlank, Users, Trophy, CaretRight, Clock, ArrowRight, Lightning } from '@phosphor-icons/react';
import { getHomepage } from '../lib/api';
import LiveMatchCard from '../components/LiveMatchCard';
import MatchCard from '../components/MatchCard';
import LeagueTableComp from '../components/LeagueTableComp';

function useInView(ref, threshold = 0.1) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}

const CAT_COLORS = { report:'#cc1a2e', transfer:'#1a56db', highlight:'#1a8a4a', news:'#c9a227', award:'#7c3aed' };

function TopPlayers({ players }) {
  if (!players?.length) return (
    <div className="empty-state"><div className="empty-state-icon">🏅</div><div className="empty-state-text">No player data yet</div></div>
  );
  const max = players[0]?.score || 1;
  return (
    <div className="players-list">
      {players.map((p, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return (
          <div key={i} className="player-row">
            <span className={`player-rank ${rankClass}`}>{i + 1}</span>
            <div className="player-avatar" style={{ background: `${p.team_color}22`, border: `1.5px solid ${p.team_color}44` }}>
              <span style={{ color: p.team_color, fontSize: 18, fontFamily: 'var(--f-display)', fontWeight: 900 }}>
                {p.player_name?.[0]}
              </span>
            </div>
            <div className="player-info">
              <div className="player-name">{p.player_name}</div>
              <div className="player-club">{p.team_name}</div>
              <div className="player-bar-track">
                <div className="player-bar-fill" style={{ width: `${(p.score / max) * 100}%`, background: p.team_color }} />
              </div>
            </div>
            <div className="player-stats">
              <div className="player-stat-box">
                <span className="player-stat-val">{p.goals}</span>
                <span className="player-stat-lbl">Goals</span>
              </div>
              <div className="player-stat-box" style={{ opacity: p.assists !== undefined ? 1 : 0 }}>
                <span className="player-stat-val">{p.assists ?? 0}</span>
                <span className="player-stat-lbl">Ast</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  const liveRef    = useRef(null);
  const matchRef   = useRef(null);
  const tableRef   = useRef(null);
  const playerRef  = useRef(null);
  const newsRef    = useRef(null);
  const liveVis    = useInView(liveRef);
  const matchVis   = useInView(matchRef);
  const tableVis   = useInView(tableRef);
  const playerVis  = useInView(playerRef);
  const newsVis    = useInView(newsRef);

  useEffect(() => {
    let ignore = false;
    getHomepage()
      .then(d => {
        if (ignore) return;
        setData(d);
        setTimeout(() => setReady(true), 80);
      })
      .catch(() => {
        if (ignore) return;
        setData(null);
        setReady(true);
      });
    return () => { ignore = true; };
  }, []);

  // Compute top players from top_scorers with weighted score
  const topPlayers = (data?.top_scorers || []).map(s => ({
    ...s,
    assists: 0,
    score: s.goals * 3,
  })).sort((a, b) => b.score - a.score).slice(0, 8);

  const liveMatch = data?.live_matches?.[0] || null;

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-grid-lines" />
        <div className="hero-accent-line" />

        <div className="hero-content">
          {/* University badge */}
          <div className={`hero-kicker ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '0s' }}>
            <div className="hero-kicker-logo">
              <img src="/static/tatu-logo.png" alt="TUIT"
                onError={e => e.target.style.display = 'none'} />
            </div>
            <div className="hero-kicker-text">
              <span className="hero-kicker-uni">Tashkent University of Information Technologies</span>
              <span className="hero-kicker-sub">Official University Football League</span>
            </div>
          </div>

          {/* Season tag */}
          <div className={`hero-season-tag ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '.1s' }}>
            <span className="live-dot" />
            Season 2024/25 · Now Live
          </div>

          {/* Headline */}
          <h1 className={`hero-h1 ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '.2s' }}>
            <span className="hero-h1-outline">UniLiga</span>
            <span className="hero-h1-solid">University</span>
            <span className="hero-h1-red">Football League</span>
          </h1>

          <p className={`hero-subtitle ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '.33s' }}>
            The official competitive football championship for TUIT faculties.
            Track live scores, standings, top players, and match reports.
          </p>

          <div className={`hero-ctas ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '.46s' }}>
            <button className="btn btn-red btn-lg" onClick={() => navigate('/matches')}>
              <Play size={15} fill="currentColor" />View Matches<span className="btn-shine" />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/table')}>
              <Trophy size={15} />Standings
            </button>
            {liveMatch && (
              <span className="badge badge-red" style={{ animation: 'none' }}>
                <span className="live-dot" />Match in Progress
              </span>
            )}
          </div>

          <div className={`hero-stats ${ready ? 'animate-in' : ''}`} style={{ animationDelay: '.58s' }}>
            {[
              { v: '8', l: 'Teams' },
              { v: '12', l: 'Match Weeks' },
              { v: '94', l: 'Fixtures' },
              { v: '312+', l: 'Goals' },
            ].map(({ v, l }, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-val">{v}</span>
                <span className="hero-stat-lbl">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MATCH ──────────────────────────────────── */}
      <section className="section" ref={liveRef} style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div className={`section-header ${liveVis ? 'fade-up' : ''}`}>
            <div>
              <div className="section-eyebrow">Live Now</div>
              <h2 className="section-title">Live Match</h2>
            </div>
            {liveMatch && (
              <span className="badge badge-red">
                <span className="live-dot" />In Progress
              </span>
            )}
          </div>
          {data ? (
            liveMatch
              ? <LiveMatchCard match={liveMatch} />
              : (
                <div style={{ textAlign:'center', padding:'56px 24px', color:'var(--tx3)' }}>
                  <div style={{ fontSize:48, marginBottom:16, opacity:.3 }}>📡</div>
                  <div style={{ fontFamily:'var(--f-display)', fontSize:13, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>
                    No live match at the moment
                  </div>
                  <div style={{ marginTop:8, fontFamily:'var(--f-body)', fontSize:13, color:'var(--tx4)' }}>
                    Check the schedule for upcoming fixtures
                  </div>
                </div>
              )
          ) : (
            <div className="loading-center"><div className="spinner" /><span>Loading...</span></div>
          )}
        </div>
      </section>

      {/* ── UPCOMING / RECENT ───────────────────────────── */}
      <section className="section" ref={matchRef}>
        <div className="container">
          <div className={`section-header ${matchVis ? 'fade-up' : ''}`}>
            <div>
              <div className="section-eyebrow">Schedule</div>
              <h2 className="section-title">Upcoming Fixtures</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>
              All Matches <ArrowRight size={13} />
            </button>
          </div>
          <div className={`matches-grid ${matchVis ? 'fade-up' : ''}`} style={{ animationDelay: '.08s' }}>
            {(data?.upcoming_matches || []).map(m => <MatchCard key={m.id} match={m} />)}
            {!data && [1,2,3,4].map(i => (
              <div key={i} className="match-card" style={{ minHeight: 180, opacity: .35, animationDelay: `${i*.1}s` }}>
                <div className="mc-status-bar" />
              </div>
            ))}
          </div>

          {data?.recent_matches?.length > 0 && (
            <>
              <div className={`section-header ${matchVis ? 'fade-up' : ''}`} style={{ marginTop: 56, animationDelay: '.15s' }}>
                <div>
                  <div className="section-eyebrow">Results</div>
                  <h2 className="section-title">Recent Matches</h2>
                </div>
              </div>
              <div className={`matches-grid ${matchVis ? 'fade-up' : ''}`} style={{ animationDelay: '.22s' }}>
                {data.recent_matches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── LEAGUE TABLE ────────────────────────────────── */}
      <section className="section" ref={tableRef} style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div className={`section-header ${tableVis ? 'fade-up' : ''}`}>
            <div>
              <div className="section-eyebrow">Standings</div>
              <h2 className="section-title">League Table</h2>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <div className="table-legend">
                <span className="legend-dot champion">Champion</span>
                <span className="legend-dot promotion">Top 3</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/table')}>
                Full Table <ArrowRight size={13} />
              </button>
            </div>
          </div>
          {data
            ? <LeagueTableComp rows={data.table || []} />
            : <div className="loading-center"><div className="spinner" /></div>
          }
        </div>
      </section>

      {/* ── TOP PLAYERS ─────────────────────────────────── */}
      <section className="section" ref={playerRef}>
        <div className="container">
          <div className={`section-header ${playerVis ? 'fade-up' : ''}`}>
            <div>
              <div className="section-eyebrow">Rankings</div>
              <h2 className="section-title">Top Players</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/players')}>
              Full Rankings <ArrowRight size={13} />
            </button>
          </div>
          <div className={playerVis ? 'fade-up' : ''} style={{ animationDelay: '.08s' }}>
            <TopPlayers players={topPlayers} />
          </div>
        </div>
      </section>

      {/* ── NEWS ────────────────────────────────────────── */}
      <section className="section" ref={newsRef} style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div className={`section-header ${newsVis ? 'fade-up' : ''}`}>
            <div>
              <div className="section-eyebrow">Latest</div>
              <h2 className="section-title">News &amp; Reports</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/news')}>
              All News <ArrowRight size={13} />
            </button>
          </div>
          <div className={`posts-grid ${newsVis ? 'fade-up' : ''}`} style={{ animationDelay: '.08s' }}>
            {(data?.posts || []).map((p, i) => {
              const catColor = CAT_COLORS[p.category] || '#cc1a2e';
              const d = p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '';
              return (
                <div key={p.id} className={`post-card${i === 0 ? ' featured' : ''}`}
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
                    <div className="post-meta">
                      <Clock size={11} />{d}
                    </div>
                    <h3 className="post-title">{p.title}</h3>
                    <p className="post-excerpt">{p.excerpt}</p>
                    <div className="post-read-more">
                      Read More <CaretRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
