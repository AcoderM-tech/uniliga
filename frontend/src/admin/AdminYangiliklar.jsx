import { useEffect, useMemo, useState } from 'react';
import { Plus, FloppyDisk, Upload, Trash, X, YoutubeLogo, Link } from '@phosphor-icons/react';
import { adminYangilikOchirish, getLinkableMatches, getFaolMavsum } from '../lib/api';
import api from '../lib/api';

const KATEGORIYALAR = [
  { qiymat: 'news',      nomi: 'Yangilik' },
  { qiymat: 'report',    nomi: "O'yin hisoboti" },
  { qiymat: 'highlight', nomi: 'Taqdimot' },
  { qiymat: 'transfer',  nomi: 'Transfer' },
  { qiymat: 'award',     nomi: 'Mukofot' },
];

function youtubeEmbedUrl(url) {
  if (!url) return null;

  // Protocol-relative URLni to'g'irlash (//www.youtube.com/... yoki /www.youtube.com/...)
  let normalUrl = url.trim();
  if (normalUrl.startsWith('//')) {
    normalUrl = 'https:' + normalUrl;
  } else if (normalUrl.startsWith('/www.') || normalUrl.startsWith('/youtu')) {
    normalUrl = 'https:/' + normalUrl;
  } else if (!normalUrl.startsWith('http')) {
    normalUrl = 'https://' + normalUrl;
  }

  // Agar allaqachon embed formatida bo'lsa, shunday qoldiramiz
  if (normalUrl.includes('youtube.com/embed/') || normalUrl.includes('youtube-nocookie.com/embed/')) {
    return normalUrl;
  }

  // URL ob'ekti orqali parse qilish (eng ishonchli usul)
  try {
    const u = new URL(normalUrl);
    const host = u.hostname.replace('www.', '');

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const videoId = u.pathname.slice(1).split('/')[0];
      if (videoId && videoId.length === 11) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // youtube.com/watch?v=VIDEO_ID (playlist, index va boshqa parametrlar e'tiborga olinmaydi)
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = u.searchParams.get('v');
      if (videoId && videoId.length === 11) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (_) {
    // URL parse xatosi — regex bilan urinib ko'ramiz
  }

  // Zaxira: regex usuli
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/;
  const match = normalUrl.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return null;
}


// ─── Post card (ro'yxatda ko'rsatish) ────────────────────────────────────────
function YangilikKarta({ yangilik, ochirish }) {
  const embedUrl = youtubeEmbedUrl(yangilik.video_url);
  const imagesCount = (yangilik.images || []).length;
  const sana = yangilik.created_at
    ? new Date(yangilik.created_at).toLocaleDateString('uz-UZ')
    : '';

  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
      {/* Media preview */}
      {embedUrl ? (
        <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', background:'#000' }}>
          <iframe src={embedUrl} title={yangilik.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} />
        </div>
      ) : yangilik.video_file_url ? (
        <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', background:'#000' }}>
          <video src={yangilik.video_file_url} controls
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      ) : yangilik.cover_image_url ? (
        <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden' }}>
          <img src={yangilik.cover_image_url} alt={yangilik.title}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      ) : null}

      {/* Info */}
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
            <span className="badge badge-gray" style={{ fontSize:9 }}>
              {KATEGORIYALAR.find(k => k.qiymat === yangilik.category)?.nomi || yangilik.category}
            </span>
            {yangilik.is_featured && (
              <span className="badge badge-gold" style={{ fontSize:9 }}>Tanlangan</span>
            )}
            {!yangilik.is_published && (
              <span className="badge" style={{ fontSize:9, background:'rgba(255,255,255,.05)', color:'var(--tx3)' }}>Qoralama</span>
            )}
            {(yangilik.video_file_url || embedUrl) && (
              <span className="badge badge-red" style={{ fontSize:9 }}><YoutubeLogo weight="duotone" size={9} />Video</span>
            )}
            {imagesCount > 1 && (
              <span className="badge badge-gray" style={{ fontSize:9 }}>{imagesCount} rasm</span>
            )}
            {yangilik.match_info && (
              <span className="badge badge-blue" style={{ fontSize:9, display:'flex', alignItems:'center', gap:3 }}>
                <Link weight="duotone" size={9} />
                {yangilik.match_info.home_team} vs {yangilik.match_info.away_team}
              </span>
            )}
          </div>
          <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:14, color:'var(--tx1)', lineHeight:1.3, marginBottom:4 }}>
            {yangilik.title}
          </div>
          <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)' }}>{sana}</div>
        </div>
        <button onClick={() => ochirish(yangilik.id, yangilik.title)}
          style={{ background:'none', border:'none', color:'var(--red-light)', cursor:'pointer', padding:4, flexShrink:0 }}>
          <Trash weight="duotone" size={14} />
        </button>
      </div>

      {/*{sarifalar > 1 && (*/}
      {/*  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>*/}
      {/*    <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.max(1, p-1))} disabled={sahifa === 1}>‹ Oldingi</button>*/}
      {/*    {Array.from({ length: sarifalar }, (_, i) => i + 1).map(p => (*/}
      {/*      <button key={p} className={`btn btn-xs ${p === sahifa ? 'btn-red' : 'btn-ghost'}`} onClick={() => setSahifa(p)} style={{ minWidth:32 }}>{p}</button>*/}
      {/*    ))}*/}
      {/*    <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.min(sarifalar, p+1))} disabled={sahifa === sarifalar}>Keyingi ›</button>*/}
      {/*    <span style={{ color:'var(--tx3)', fontSize:11, marginLeft:8 }}>{jami} ta post</span>*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
}

// ─── O'yin biriktirish bloki — har ikkala formada ishlatiladi ─────────────────
function OyinBiriktirish({ forma, setForma }) {
  const [ochiq, setOchiq] = useState(false);
  const [oyinlar, setOyinlar] = useState([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  const toggle = () => {
    const yangi = !ochiq;
    setOchiq(yangi);
    if (yangi && oyinlar.length === 0) {
      setYuklanmoqda(true);
      getLinkableMatches()
        .then(d => setOyinlar(d || []))
        .catch(() => setOyinlar([]))
        .finally(() => setYuklanmoqda(false));
    }
    if (!yangi) setForma(p => ({ ...p, match: undefined }));
  };

  return (
    <div className="form-group" style={{ gridColumn:'span 2' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: ochiq ? 10 : 0 }}>
        <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer',
          fontFamily:'var(--f-display)', fontSize:12, fontWeight:600, color:'var(--tx2)' }}>
          <input type="checkbox" checked={ochiq} onChange={toggle}
            style={{ accentColor:'var(--red)', width:14, height:14 }} />
          <Link weight="duotone" size={12} />
          O'yin bilan bog'lash (ixtiyoriy)
        </label>
        {forma.match && (
          <span className="badge badge-blue" style={{ fontSize:9 }}>Bog'landi ✓</span>
        )}
      </div>

      {ochiq && (
        <div style={{ marginTop:8 }}>
          {yuklanmoqda ? (
            <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)', padding:'8px 0' }}>
              Yuklanmoqda...
            </div>
          ) : (
            <>
              <select className="form-select" value={forma.match || ''}
                onChange={e => setForma(p => ({ ...p, match: e.target.value || undefined }))}>
                <option value="">— O'yinni tanlang —</option>
                {oyinlar.length === 0 && (
                  <option disabled>Bog'lanadigan o'yin topilmadi</option>
                )}
                {oyinlar.map(m => {
                  const isLive = ['live','half_time','second_half','extra_time'].includes(m.status);
                  return (
                    <option key={m.id} value={m.id}>
                      {isLive ? '🔴 JONLI — ' : '✅ '}
                      {m.home_team_name} vs {m.away_team_name} ({m.match_date})
                      {' '}{m.home_score}–{m.away_score}
                    </option>
                  );
                })}
              </select>
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx4)', marginTop:5 }}>
                Jonli o'yinlar va hali postlanmagan tugagan o'yinlar ko'rsatilmoqda
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Umumiy maydonlar (sarlavha, kategoriya, tavsif, matn) ────────────────────
function UmumiyMaydonlar({ forma, setForma }) {
  return (
    <>
      <div className="form-group" style={{ gridColumn:'span 2' }}>
        <label className="form-label">Sarlavha *</label>
        <input className="form-input" placeholder="Post sarlavhasi"
          value={forma.title || ''} onChange={e => setForma(p => ({ ...p, title: e.target.value }))} />
      </div>

      <div className="form-group">
        <label className="form-label">Kategoriya</label>
        <select className="form-select" value={forma.category}
          onChange={e => setForma(p => ({ ...p, category: e.target.value }))}>
          {KATEGORIYALAR.map(k => (
            <option key={k.qiymat} value={k.qiymat}>{k.nomi}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Variantlar</label>
        <div style={{ display:'flex', gap:16, alignItems:'center', height:36 }}>
          {[['is_published','Chop etilsin'], ['is_featured','Tanlangan']].map(([k, n]) => (
            <label key={k} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer',
              fontFamily:'var(--f-display)', fontSize:12, fontWeight:600, color:'var(--tx2)' }}>
              <input type="checkbox" checked={!!forma[k]}
                onChange={e => setForma(p => ({ ...p, [k]: e.target.checked }))}
                style={{ accentColor:'var(--red)', width:14, height:14 }} />
              {n}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ gridColumn:'span 2' }}>
        <label className="form-label">Qisqa tavsif (ixtiyoriy)</label>
        <textarea className="form-textarea" style={{ minHeight:70 }} maxLength={300}
          placeholder="Kartada ko'rinadigan qisqa tavsif..."
          value={forma.excerpt || ''} onChange={e => setForma(p => ({ ...p, excerpt: e.target.value }))} />
      </div>

      <div className="form-group" style={{ gridColumn:'span 2' }}>
        <label className="form-label">Tavsif (matn) *</label>
        <textarea className="form-textarea" style={{ minHeight:160 }}
          placeholder="Post tavsifi..."
          value={forma.content || ''} onChange={e => setForma(p => ({ ...p, content: e.target.value }))} />
      </div>
    </>
  );
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export default function AdminYangiliklar() {
  const [yangiliklar, setYangiliklar] = useState([]);
  const [yangiTur, setYangiTur]       = useState(null); // 'rasm' | 'video' | null
  const [videoManba, setVideoManba]   = useState('file'); // 'file' | 'youtube'
  const [youtubeUrl, setYoutubeUrl]   = useState('');
  const [forma, setForma]             = useState({ category:'news', is_published:true, is_featured:false });
  const [rasmlar, setRasmlar]         = useState([]);
  const [videoFayl, setVideoFayl]     = useState(null);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xabar, setXabar]             = useState(null);

  const [qidiruv, setQidiruv] = useState('');
  const [kategoriyaFilter, setKategoriyaFilter] = useState('barchasi');
  const [sahifa, setSahifa] = useState(1);
  const SAHIFADA = 15;

  const flash = (matn, tur = 'muvaffaqiyat') => {
    setXabar({ matn, tur });
    setTimeout(() => setXabar(null), 3500);
  };

  const qaytaYuklash = () =>
    api.get('/yangiliklar/').then(r => setYangiliklar(r.data.results || r.data || []));

  const filtrlangan = yangiliklar.filter(y => {
    const qMatch = !qidiruv ||
      y.title?.toLowerCase().includes(qidiruv.toLowerCase()) ||
      y.content?.toLowerCase().includes(qidiruv.toLowerCase());
    const kMatch = kategoriyaFilter === 'barchasi' || y.category === kategoriyaFilter;
    return qMatch && kMatch;
  });
  const jami = filtrlangan.length;
  const satr = filtrlangan.slice((sahifa - 1) * SAHIFADA, sahifa * SAHIFADA);
  const sarifalar = Math.ceil(jami / SAHIFADA);

  const [faolMavsum, setFaolMavsum] = useState(undefined); // undefined=loading, null=none, obj=mavsum
  useEffect(() => { qaytaYuklash(); }, []);
  useEffect(() => { getFaolMavsum().then(setFaolMavsum).catch(() => setFaolMavsum(null)); }, []);

  // Slug yaratish
  const slugify = (s) =>
    (s || 'post').toLowerCase().replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  // Rasm preview-lari
  const imagePreviews = useMemo(
    () => rasmlar.map(f => ({ file: f, url: URL.createObjectURL(f) })),
    [rasmlar]
  );
  useEffect(() => () => { imagePreviews.forEach(p => URL.revokeObjectURL(p.url)); }, [imagePreviews]);

  // Video preview
  const videoPreview  = useMemo(() => (videoFayl ? URL.createObjectURL(videoFayl) : null), [videoFayl]);
  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview); }, [videoPreview]);

  const youtubePreview = useMemo(() => youtubeEmbedUrl(youtubeUrl), [youtubeUrl]);

  // Formani yopish
  const formaniYopish = () => {
    setYangiTur(null);
    setVideoManba('file');
    setYoutubeUrl('');
    setForma({ category:'news', is_published:true, is_featured:false });
    setRasmlar([]);
    setVideoFayl(null);
  };

  // Formani ochish (toggle)
  const formaniOchish = (tur) => {
    setYangiTur(old => old === tur ? null : tur);
    setVideoManba('file');
    setYoutubeUrl('');
    setRasmlar([]);
    setVideoFayl(null);
  };

  // Post saqlash
  const postYaratish = async () => {
    if (!yangiTur) return;
    if (!forma.title || !forma.content) {
      flash('Sarlavha va tavsif (matn) kiritilishi shart', 'xato'); return;
    }
    if (yangiTur === 'rasm' && rasmlar.length === 0) {
      flash('Kamida bitta rasm yuklang', 'xato'); return;
    }
    if (yangiTur === 'video') {
      if (videoManba === 'file' && !videoFayl) { flash('Video fayl yuklang', 'xato'); return; }
      if (videoManba === 'youtube' && !youtubeUrl.trim()) { flash('YouTube video URL kiriting', 'xato'); return; }
    }

    setSaqlanmoqda(true);
    try {
      const fd = new FormData();
      const malumot = {
        ...forma,
        slug: slugify(forma.title),
        excerpt: forma.excerpt || forma.content.slice(0, 280),
      };

      Object.entries(malumot).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (['cover_image_file','images_files','match'].includes(k)) return; // alohida qo'shiladi
        fd.append(k, typeof v === 'boolean' ? String(v) : v);
      });

      // Match biriktirish (ikkalasida ham ishlaydi)
      if (forma.match) fd.append('match', forma.match);

      // Media
      if (yangiTur === 'rasm') {
        rasmlar.forEach(f => fd.append('images', f));
      }
      if (yangiTur === 'video') {
        if (videoManba === 'file' && videoFayl) fd.append('video_file', videoFayl);
        if (videoManba === 'youtube') {
          const embed = youtubeEmbedUrl(youtubeUrl.trim()) || youtubeUrl.trim();
          fd.append('video_url', embed);
        }
      }

      await api.post('/yangiliklar/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash("Post muvaffaqiyatli qo'shildi");
      formaniYopish();
      qaytaYuklash();
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : 'Xatolik yuz berdi';
      flash(msg, 'xato');
    }
    setSaqlanmoqda(false);
  };

  const yangilikOchirish = async (id, sarlavha) => {
    if (!confirm(`"${sarlavha}" postini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminYangilikOchirish(id);
      flash("Post o'chirildi");
      qaytaYuklash();
    } catch (e) {
      flash(e?.response?.data ? JSON.stringify(e.response.data) : 'Xatolik yuz berdi', 'xato');
    }
  };

  return (
    <div>
      {xabar && (
        <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>
      )}

      {/* Arxiv ogohlantirish */}
      {faolMavsum === null && (
        <div className="flash flash-error" style={{ marginBottom: 16 }}>
          ⚠️ Hozirda faol mavsum yo'q. Yangi post qo'shish uchun avval mavsumni faollashtiring.
        </div>
      )}
      {faolMavsum && faolMavsum.is_archived && (
        <div className="flash flash-error" style={{ marginBottom: 16 }}>
          🔒 Joriy mavsum arxivlangan. Arxivlangan mavsumga yangi post qo'shib bo'lmaydi.
        </div>
      )}

      {/* Sarlavha + tugmalar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>
            Kontent
          </div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>
            Postlar ({jami})
          </h2>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            className={`btn ${yangiTur === 'rasm' ? 'btn-red' : 'btn-ghost'} btn-md`}
            onClick={() => formaniOchish('rasm')}
            disabled={!faolMavsum || faolMavsum.is_archived}
          >
            {yangiTur === 'rasm' ? <X weight="bold" size={14} /> : <Plus weight="bold" size={14} />}
            Rasm post
            <span className="btn-shine" />
          </button>
          <button
            className={`btn ${yangiTur === 'video' ? 'btn-red' : 'btn-ghost'} btn-md`}
            onClick={() => formaniOchish('video')}
            disabled={!faolMavsum || faolMavsum.is_archived}
          >
            {yangiTur === 'video' ? <X weight="bold" size={14} /> : <Plus weight="bold" size={14} />}
            Video post
            <span className="btn-shine" />
          </button>
        </div>
      </div>

      {/* ── FORMA ─────────────────────────────────────────── */}
      {yangiTur && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">
            {yangiTur === 'rasm' ? '📷 Yangi rasm post qo\'shish' : '🎬 Yangi video post qo\'shish'}
          </div>

          <div className="form-grid form-grid-2">
            {/* ── Umumiy maydonlar ── */}
            <UmumiyMaydonlar forma={forma} setForma={setForma} />

            {/* ── RASM TURI: ko'p rasm yuklash ── */}
            {yangiTur === 'rasm' && (
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Rasm(lar) *</label>
                <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13 }}>
                  <Upload weight="duotone" size={14} />
                  {rasmlar.length ? `${rasmlar.length}/4 ta rasm tanlandi` : 'Rasm yuklash — max 4 ta (JPG/PNG)'}
                  <input type="file" accept="image/*" multiple style={{ display:'none' }}
                    onChange={e => { const files = Array.from(e.target.files || []).slice(0, 4); setRasmlar(files); }} />
                </label>

                {imagePreviews.length > 0 && (
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:10 }}>
                    {imagePreviews.map(({ file, url }) => (
                      <div key={file.name + file.size} style={{ border:'1px solid var(--border)', borderRadius:'var(--r-md)', overflow:'hidden', background:'var(--bg)' }}>
                        <img src={url} alt={file.name} style={{ width:'100%', height:72, objectFit:'cover', display:'block' }} />
                        <div style={{ padding:'6px 8px', fontSize:10, color:'var(--tx3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEO TURI: fayl yoki YouTube ── */}
            {yangiTur === 'video' && (
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Video *</label>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                  <button type="button"
                    className={`btn ${videoManba === 'file' ? 'btn-red' : 'btn-ghost'} btn-sm`}
                    onClick={() => { setVideoManba('file'); setYoutubeUrl(''); }}>
                    Fayldan
                  </button>
                  <button type="button"
                    className={`btn ${videoManba === 'youtube' ? 'btn-red' : 'btn-ghost'} btn-sm`}
                    onClick={() => { setVideoManba('youtube'); setVideoFayl(null); }}>
                    YouTube URL
                  </button>
                </div>

                {videoManba === 'file' ? (
                  <>
                    <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13 }}>
                      <Upload weight="duotone" size={14} />
                      {videoFayl ? `${videoFayl.name} (${(videoFayl.size/1024/1024).toFixed(1)} MB)` : 'Video yuklash — max 50 MB (MP4/WebM)'}
                      <input type="file" accept="video/*" style={{ display:'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f && f.size > 50 * 1024 * 1024) {
                            flash('Video hajmi 50 MB dan oshmasligi kerak!', 'xato');
                            e.target.value = '';
                            return;
                          }
                          setVideoFayl(f || null);
                        }} />
                    </label>
                    {videoPreview && (
                      <div style={{ marginTop:10, borderRadius:'var(--r-md)', overflow:'hidden', aspectRatio:'16/9', maxWidth:520, border:'1px solid var(--border)' }}>
                        <video src={videoPreview} controls style={{ width:'100%', height:'100%', display:'block', background:'#000' }} />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input className="form-input"
                      placeholder="YouTube havola: https://www.youtube.com/watch?v=... yoki https://youtu.be/..."
                      value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                    {youtubePreview && (
                      <div style={{ marginTop:10, borderRadius:'var(--r-md)', overflow:'hidden', aspectRatio:'16/9', maxWidth:520, border:'1px solid var(--border)' }}>
                        <iframe src={youtubePreview} title="YouTube preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ width:'100%', height:'100%', border:'none', display:'block', background:'#000' }} />
                      </div>
                    )}
                    <div style={{ marginTop:8, fontSize:11, color:'var(--tx4)' }}>
                      Eslatma: oddiy YouTube link ham bo'ladi — tizim avtomat embed formatga o'giradi.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── O'YIN BIRIKTIRISH — ikkalasida ham ko'rinadi ── */}
            <OyinBiriktirish forma={forma} setForma={setForma} />
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={formaniYopish}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={postYaratish} disabled={saqlanmoqda}>
              <FloppyDisk weight="duotone" size={13} />
              {saqlanmoqda ? 'Saqlanmoqda...' : "Post qo'shish"}
              <span className="btn-shine" />
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <input
          className="form-input"
          placeholder="🔍 Sarlavha bo'yicha qidirish..."
          value={qidiruv}
          onChange={e => { setQidiruv(e.target.value); setSahifa(1); }}
          style={{ flex:'1', minWidth:200, maxWidth:320 }}
        />
        <select className="form-select" value={kategoriyaFilter} onChange={e => { setKategoriyaFilter(e.target.value); setSahifa(1); }} style={{ width:180 }}>
          <option value="barchasi">Barcha kategoriyalar</option>
          <option value="news">Yangilik</option>
          <option value="report">O'yin hisoboti</option>
          <option value="highlight">Taqdimot</option>
          <option value="transfer">Transfer</option>
          <option value="award">Mukofot</option>
        </select>
        <span style={{ color:'var(--tx3)', fontSize:12, alignSelf:'center' }}>{jami} ta post</span>
      </div>

      {/* ── RO'YXAT ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
        {satr.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'span 3' }}>
            <div className="empty-state-icon">📰</div>
            <div className="empty-state-text">{qidiruv || kategoriyaFilter !== 'barchasi' ? "Qidiruv bo'yicha natija topilmadi" : "Hali post yo'q"}</div>
          </div>
        )}
        {satr.map(y => (
          <YangilikKarta key={y.id} yangilik={y} ochirish={yangilikOchirish} />
        ))}
      </div>

      {sarifalar > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.max(1, p-1))} disabled={sahifa === 1}>‹ Oldingi</button>
          {Array.from({ length: sarifalar }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-xs ${p === sahifa ? 'btn-red' : 'btn-ghost'}`} onClick={() => setSahifa(p)} style={{ minWidth:32 }}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.min(sarifalar, p+1))} disabled={sahifa === sarifalar}>Keyingi ›</button>
          <span style={{ color:'var(--tx3)', fontSize:11, marginLeft:8 }}>{jami} ta post</span>
        </div>
      )}
    </div>
  );
}