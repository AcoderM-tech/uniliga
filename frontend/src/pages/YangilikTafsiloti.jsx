import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, YoutubeLogo, ArrowSquareOut, SoccerBall } from '@phosphor-icons/react';
import { getYangilik } from '../lib/api';

function youtubeEmbed(url) {
  if (!url) return null;
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;
  const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

const CAT_COLORS = {
  report:'#cc1a2e', transfer:'#1a56db', highlight:'#1a8a4a',
  news:'#c9a227', award:'#7c3aed'
};

const CAT_NOMI = {
  news:"Yangilik", report:"O'yin hisoboti", highlight:'Taqdimot',
  transfer:'Transfer', award:'Mukofot'
};

/* ── Lightbox ── */
function Lightbox({ rasmlar, boshlangich, yop }) {
  const [joriy, setJoriy] = useState(boshlangich);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') yop();
      if (e.key === 'ArrowRight') setJoriy(j => (j + 1) % rasmlar.length);
      if (e.key === 'ArrowLeft')  setJoriy(j => (j - 1 + rasmlar.length) % rasmlar.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rasmlar.length, yop]);

  return (
    <div
      onClick={yop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Close */}
      <button onClick={yop} style={{ position:'absolute', top:16, right:20, background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', padding:'6px 10px', fontSize:20, lineHeight:1 }}>✕</button>

      {/* Prev */}
      {rasmlar.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setJoriy(j => (j - 1 + rasmlar.length) % rasmlar.length); }}
          style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', padding:'10px 14px', fontSize:20 }}>‹</button>
      )}

      {/* Image */}
      <img
        src={rasmlar[joriy]}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth:'90vw', maxHeight:'88vh', objectFit:'contain', borderRadius:8, boxShadow:'0 24px 80px rgba(0,0,0,.8)' }}
      />

      {/* Next */}
      {rasmlar.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setJoriy(j => (j + 1) % rasmlar.length); }}
          style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', padding:'10px 14px', fontSize:20 }}>›</button>
      )}

      {/* Counter */}
      {rasmlar.length > 1 && (
        <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
          {rasmlar.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setJoriy(i); }}
              style={{ width: i === joriy ? 20 : 7, height:7, borderRadius:99, background: i === joriy ? '#fff' : 'rgba(255,255,255,.35)', cursor:'pointer', transition:'all .2s' }}/>
          ))}
        </div>
      )}
    </div>
  );
}

export default function YangilikTafsiloti() {
  const [lightbox, setLightbox] = useState(null); // null | index
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost]       = useState(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [xato, setXato]       = useState('');

  useEffect(() => {
    if (!id) return;
    setYuklanmoqda(true);
    setXato('');
    getYangilik(id)
      .then(d => setPost(d))
      .catch(() => setXato('Post topilmadi'))
      .finally(() => setYuklanmoqda(false));
  }, [id]);

  const sana = useMemo(() => (
    post?.created_at
      ? new Date(post.created_at).toLocaleDateString('uz-UZ', { day:'numeric', month:'long', year:'numeric' })
      : ''
  ), [post?.created_at]);

  const embedUrl = useMemo(() => youtubeEmbed(post?.video_url), [post?.video_url]);
  const rasmlar  = post?.images || [];
  const catColor = CAT_COLORS[post?.category] || '#cc1a2e';

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop:28, paddingBottom:80, maxWidth:980 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom:18 }}>
          <ArrowLeft size={13}/>Orqaga
        </button>

        {yuklanmoqda ? (
          <div className="loading-center" style={{ minHeight:220 }}>
            <div className="spinner"/><span>Yuklanmoqda...</span>
          </div>
        ) : xato ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <div className="empty-state-text">{xato}</div>
          </div>
        ) : (
          <>
            {/* Linked match card */}
            {post.match_info && (
              <div
                onClick={() => navigate(`/oyinlar/${post.match_info.id}`)}
                style={{
                  display:'flex', alignItems:'center', gap:14,
                  background:'var(--bg3)', border:'1px solid var(--border-2)',
                  borderRadius:'var(--r-md)', padding:'12px 16px',
                  marginBottom:20, cursor:'pointer', transition:'border-color .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--red-glow)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-2)'}
              >
                <SoccerBall size={16} color="var(--red-light)" style={{ flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:3 }}>
                    Bog'liq o'yin
                  </div>
                  <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:14, color:'var(--tx1)' }}>
                    {post.match_info.home_team} {post.match_info.home_score} – {post.match_info.away_score} {post.match_info.away_team}
                  </div>
                  <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)', marginTop:2 }}>
                    {post.match_info.match_date} · {post.match_info.status === 'finished' ? 'Tugagan' : post.match_info.status}
                  </div>
                </div>
                <ArrowSquareOut size={14} color="var(--tx3)"/>
              </div>
            )}

            {/* Meta + title */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
                <span className="badge" style={{ background:`${catColor}22`, border:`1px solid ${catColor}44`, color:catColor, fontSize:10 }}>
                  {CAT_NOMI[post.category] || post.category}
                </span>
                <span style={{ display:'inline-flex', gap:6, alignItems:'center', color:'var(--tx3)', fontSize:12 }}>
                  <Clock size={12}/>{sana}
                </span>
                {(post.video_file_url || embedUrl) && (
                  <span className="badge badge-red" style={{ fontSize:10 }}>
                    <YoutubeLogo size={10}/>Video
                  </span>
                )}
              </div>
              <h1 className="page-title" style={{ fontSize:'clamp(24px,4vw,42px)', marginBottom:0 }}>
                {post.title}
              </h1>
              {/*{post.excerpt && (*/}
              {/*  <p style={{ fontFamily:'var(--f-body)', fontSize:16, color:'var(--tx2)', lineHeight:1.7, marginTop:12, borderLeft:'3px solid var(--red)', paddingLeft:16 }}>*/}
              {/*    {post.excerpt}*/}
              {/*  </p>*/}
              {/*)}*/}
            </div>

            {/* Media */}
            <div className="post-detail-media">
              {embedUrl ? (
                <div className="post-detail-video">
                  <iframe src={embedUrl} title={post.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ width:'100%', height:'100%', border:'none' }}/>
                </div>
              ) : post.video_file_url ? (
                <div className="post-detail-video">
                  <video src={post.video_file_url} controls style={{ width:'100%', height:'100%', display:'block', background:'#000' }}/>
                </div>
              ) : rasmlar.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: rasmlar.length === 1
                    ? '1fr'
                    : rasmlar.length === 2
                    ? 'repeat(2, 1fr)'
                    : rasmlar.length === 3
                    ? 'repeat(3, 1fr)'
                    : 'repeat(2, 1fr)',
                  gap: 4,
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  maxHeight: rasmlar.length === 1 ? 480 : 400,
                }}>
                  {rasmlar.slice(0, 4).map((url, idx) => (
                    <div
                      key={url + idx}
                      onClick={() => setLightbox(idx)}
                      style={{
                        display: 'block', overflow: 'hidden',
                        position: 'relative', cursor: 'zoom-in',
                        gridColumn: rasmlar.length === 3 && idx === 0 ? 'span 3' : undefined,
                        aspectRatio: rasmlar.length === 1 ? '16/9'
                          : rasmlar.length === 3 && idx === 0 ? '21/7'
                          : '1/1',
                        background: 'var(--bg4)',
                      }}
                    >
                      <img
                        src={url}
                        alt={`${post.title} ${idx + 1}`}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .35s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {rasmlar.length > 4 && idx === 3 && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--f-display)', fontWeight:900, fontSize:28 }}>
                          +{rasmlar.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Full content */}
            <div className="post-detail-content">
              {(post.content || '').split('\n').filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </>
        )}
        {lightbox !== null && (
          <Lightbox rasmlar={rasmlar} boshlangich={lightbox} yop={() => setLightbox(null)} />
        )}
      </div>
    </div>
  );
}
