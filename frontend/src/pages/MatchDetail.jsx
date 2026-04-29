import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarBlank, Clock, SoccerBall, Square, ArrowsLeftRight, Radio, Lightning } from '@phosphor-icons/react';
import { getMatch } from '../lib/api';

const EVENT_META = {
  goal:     { icon: <SoccerBall size={15} color="#4ade80" />,  label: 'SoccerBall',         color: '#4ade80' },
  penalty:  { icon: <SoccerBall size={15} color="#4ade80" />,  label: 'Penalty',      color: '#4ade80' },
  own_goal: { icon: <SoccerBall size={15} color="#ef4444" />,  label: 'Own SoccerBall',     color: '#ef4444' },
  yellow:   { icon: <Square size={13} fill="#f59e0b" color="#f59e0b" />, label: 'Yellow Card', color: '#f59e0b' },
  red:      { icon: <Square size={13} fill="#ef4444" color="#ef4444" />, label: 'Red Card',    color: '#ef4444' },
  sub:      { icon: <ArrowsLeftRight size={13} color="#60a5fa" />, label: 'Substitution', color: '#60a5fa' },
};

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatch(id).then(d => { setMatch(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="match-detail">
      <div className="container">
        <div className="loading-center" style={{ minHeight: '60vh' }}>
          <div className="spinner" /><span>Loading match...</span>
        </div>
      </div>
    </div>
  );

  if (!match) return (
    <div className="match-detail">
      <div className="container">
        <div className="empty-state" style={{ minHeight: '60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div className="empty-state-icon">⚽</div>
          <div className="empty-state-text">Match not found</div>
        </div>
      </div>
    </div>
  );

  const pct = match.status === 'live'
    ? Math.min((match.minute / 90) * 100, 100)
    : match.status === 'finished' ? 100 : 0;

  const homeEvents = (match.events || []).filter(e => e.team_name === match.home_team_name);
  const awayEvents = (match.events || []).filter(e => e.team_name === match.away_team_name);

  return (
    <div className="match-detail">
      <div className="container">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />Back
        </button>

        {/* Header card */}
        <div className="md-header">
          {/* Topbar */}
          <div className="broadcast-topbar">
            <div className="bc-info">
              <span>UniLiga · Week {match.week}</span>
              <span style={{ color: 'var(--tx4)' }}>·</span>
              <span><MapPin size={11} style={{ display:'inline', marginRight:4 }} />{match.stadium}</span>
              <span style={{ color:'var(--tx4)' }}>·</span>
              <span><CalendarBlank size={11} style={{ display:'inline', marginRight:4 }} />{match.match_date}</span>
              <span><Clock size={11} style={{ display:'inline', marginRight:4 }} />{match.match_time?.slice(0,5)}</span>
            </div>
            <div>
              {match.status === 'live' && (
                <div className="bc-live-badge"><span className="live-dot" />LIVE {match.minute}'</div>
              )}
              {match.status === 'finished' && <span className="badge badge-green">Full Time</span>}
              {match.status === 'upcoming' && <span className="badge badge-blue">Upcoming</span>}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="scoreboard">
            <div className="sb-team">
              <div className="team-crest" style={{ borderColor: `${match.home_team_color}33`, width:100, height:100 }}>
                {match.home_team_logo
                  ? <img src={match.home_team_logo} alt={match.home_team_short} style={{ width:72, height:72 }} />
                  : <span className="team-crest-letter" style={{ color: match.home_team_color, fontSize:44 }}>
                      {match.home_team_short?.[0]}
                    </span>
                }
              </div>
              <div className="sb-team-name">{match.home_team_name}</div>
              <div className="sb-team-faculty">{match.home_team_short}</div>
            </div>

            <div className="sb-center">
              <div className="score-digits">
                <span className="score-digit" style={{ color: match.home_team_color }}>{match.home_score}</span>
                <span className="score-divider">–</span>
                <span className="score-digit" style={{ color: match.away_team_color }}>{match.away_score}</span>
              </div>
              {match.status === 'live' && (
                <div className="score-minute"><Radio size={10} />{match.minute}'</div>
              )}
              {match.status === 'upcoming' && (
                <div style={{ fontFamily:'var(--f-display)', fontSize:13, fontWeight:700, letterSpacing:'.06em', color:'var(--tx3)', textTransform:'uppercase' }}>
                  {match.match_time?.slice(0,5)}
                </div>
              )}
            </div>

            <div className="sb-team">
              <div className="team-crest" style={{ borderColor: `${match.away_team_color}33`, width:100, height:100 }}>
                {match.away_team_logo
                  ? <img src={match.away_team_logo} alt={match.away_team_short} style={{ width:72, height:72 }} />
                  : <span className="team-crest-letter" style={{ color: match.away_team_color, fontSize:44 }}>
                      {match.away_team_short?.[0]}
                    </span>
                }
              </div>
              <div className="sb-team-name">{match.away_team_name}</div>
              <div className="sb-team-faculty">{match.away_team_short}</div>
            </div>
          </div>

          {/* Progress bar */}
          {match.status !== 'upcoming' && (
            <div className="match-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="progress-labels"><span>KO</span><span>45'</span><span>90'</span></div>
            </div>
          )}
        </div>

        {/* SoccerBall scorers summary */}
        {match.events?.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {/* Home scorers */}
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'16px 20px' }}>
              <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:12 }}>
                {match.home_team_short} — Goals
              </div>
              {homeEvents.filter(e => ['goal','penalty'].includes(e.event_type)).map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  <SoccerBall size={12} color="#4ade80" />
                  <span style={{ fontFamily:'var(--f-display)', fontWeight:600, fontSize:13, color:'var(--tx1)', flex:1 }}>{e.player_name}</span>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--tx3)' }}>{e.minute}'</span>
                </div>
              ))}
              {homeEvents.filter(e => ['goal','penalty'].includes(e.event_type)).length === 0 && (
                <div style={{ color:'var(--tx4)', fontFamily:'var(--f-body)', fontSize:12 }}>No goals</div>
              )}
            </div>
            {/* Away scorers */}
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'16px 20px' }}>
              <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:12 }}>
                {match.away_team_short} — Goals
              </div>
              {awayEvents.filter(e => ['goal','penalty'].includes(e.event_type)).map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                  <SoccerBall size={12} color="#4ade80" />
                  <span style={{ fontFamily:'var(--f-display)', fontWeight:600, fontSize:13, color:'var(--tx1)', flex:1 }}>{e.player_name}</span>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--tx3)' }}>{e.minute}'</span>
                </div>
              ))}
              {awayEvents.filter(e => ['goal','penalty'].includes(e.event_type)).length === 0 && (
                <div style={{ color:'var(--tx4)', fontFamily:'var(--f-body)', fontSize:12 }}>No goals</div>
              )}
            </div>
          </div>
        )}

        {/* Full event timeline */}
        {match.events?.length > 0 && (
          <div className="timeline-wrap">
            <div className="timeline-heading">
              <Lightning size={13} />Match Timeline
            </div>
            <div className="timeline-items">
              {match.events.map(ev => {
                const isHome = ev.team_name === match.home_team_name;
                const meta = EVENT_META[ev.event_type] || EVENT_META.goal;
                return (
                  <div key={ev.id} className="tl-item">
                    {/* Home side */}
                    <div className="tl-home">
                      {isHome && (
                        <>
                          <div className="tl-player-name">{ev.player_name}</div>
                          <div className="tl-event-label">{meta.label}</div>
                        </>
                      )}
                    </div>
                    {/* Center */}
                    <div className="tl-mid">
                      <div className="tl-minute">{ev.minute}'</div>
                      <div className="tl-icon-bubble">{meta.icon}</div>
                    </div>
                    {/* Away side */}
                    <div className="tl-away">
                      {!isHome && (
                        <>
                          <div className="tl-player-name">{ev.player_name}</div>
                          <div className="tl-event-label">{meta.label}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
