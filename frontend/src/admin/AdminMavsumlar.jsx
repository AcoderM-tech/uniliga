import { useState, useEffect } from 'react';
import { Plus, FloppyDisk, X, Trash, CheckCircle, Archive, Lightning, PencilSimple } from '@phosphor-icons/react';
import { getMavsumlar, adminMavsumOchirish, adminMavsumFaollashtirish, adminMavsumArxivlash } from '../lib/api';
import api from '../lib/api';

export default function AdminMavsumlar() {
  const [mavsumlar, setMavsumlar]     = useState([]);
  const [yangi, setYangi]             = useState(false);
  const [forma, setForma]             = useState({ is_active: false });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [tahrirId, setTahrirId]       = useState(null);
  const [tahrirHafta, setTahrirHafta] = useState('');
  const [xabar, setXabar]             = useState(null);

  const flash = (matn, tur='muvaffaqiyat') => { setXabar({ matn, tur }); setTimeout(() => setXabar(null), 3500); };
  const qaytaYuklash = () => getMavsumlar().then(d => setMavsumlar(d.results || d || []));

  useEffect(() => { qaytaYuklash(); }, []);

  const mavsumYaratish = async () => {
    if (!forma.name || !forma.start_date || !forma.end_date) { flash("Barcha maydonlarni to'ldiring", 'xato'); return; }
    setSaqlanmoqda(true);
    try {
      await api.post('/mavsumlar/', forma);
      flash("Mavsum muvaffaqiyatli yaratildi");
      setYangi(false); setForma({ is_active: false }); qaytaYuklash();
    } catch (e) { flash(e?.response?.data ? JSON.stringify(e.response.data) : "Xatolik", 'xato'); }
    setSaqlanmoqda(false);
  };

  const mavsumOchirish = async (id, nom) => {
    if (!confirm(`"${nom}" mavsumini o'chirishni tasdiqlaysizmi?\nBarcha o'yinlar, jamoalar va postlar ham o'chib ketadi!`)) return;
    try { await adminMavsumOchirish(id); flash("Mavsum o'chirildi"); qaytaYuklash(); }
    catch { flash("Xatolik yuz berdi", 'xato'); }
  };

  const faollashtirish = async (id, nom) => {
    if (!confirm(`"${nom}" mavsumini faol qilasizmi?\nBoshqa faol mavsum arxivga o'tadi.`)) return;
    try { await adminMavsumFaollashtirish(id); flash("Mavsum faol qilindi"); qaytaYuklash(); }
    catch { flash("Xatolik", 'xato'); }
  };

  const arxivlash = async (id, nom) => {
    if (!confirm(`"${nom}" mavsumini arxivlashni tasdiqlaysizmi?\nMavsum faol bo'lmaydi, lekin ma'lumotlar saqlanadi.`)) return;
    try { await adminMavsumArxivlash(id); flash("Mavsum arxivlandi"); qaytaYuklash(); }
    catch { flash("Xatolik", 'xato'); }
  };

  const haftaSaqlash = async (m) => {
    const hafta = parseInt(tahrirHafta);
    if (!hafta || hafta < 1) { flash("To'g'ri hafta soni kiriting", 'xato'); return; }
    try {
      await api.patch(`/mavsumlar/${m.id}/`, { weeks_total: hafta });
      flash("Mavsum yangilandi"); setTahrirId(null); qaytaYuklash();
    } catch { flash("Xatolik", 'xato'); }
  };

  return (
    <div>
      {xabar && <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Mavsumlar ({mavsumlar.length})</h2>
        </div>
        <button className="btn btn-red btn-md" onClick={() => setYangi(v => !v)}>
          {yangi ? <X size={14} weight="bold"/> : <Plus size={14} weight="bold"/>}
          {yangi ? 'Bekor' : 'Yangi mavsum'}
          <span className="btn-shine"/>
        </button>
      </div>

      {yangi && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">Yangi mavsum yaratish</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Mavsum nomi *</label>
              <input className="form-input" placeholder="2024/25" value={forma.name||''} onChange={e => setForma(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Boshlanish sanasi *</label>
              <input type="date" className="form-input" value={forma.start_date||''} onChange={e => setForma(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tugash sanasi *</label>
              <input type="date" className="form-input" value={forma.end_date||''} onChange={e => setForma(p => ({ ...p, end_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Haftalar soni</label>
              <input type="number" className="form-input" min={1} value={forma.weeks_total||''} onChange={e => setForma(p => ({ ...p, weeks_total: e.target.value }))} />
            </div>
            <div className="form-group">
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--f-display)', fontSize:12, fontWeight:600, color:'var(--tx2)' }}>
                <input type="checkbox" checked={!!forma.is_active} onChange={e => setForma(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ accentColor:'var(--red)', width:14, height:14 }} />
                Darhol faol qilish
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setYangi(false)}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={mavsumYaratish} disabled={saqlanmoqda}>
              <FloppyDisk size={13} weight="duotone"/>{saqlanmoqda ? 'Saqlanmoqda...' : 'Yaratish'}<span className="btn-shine"/>
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {mavsumlar.map(m => (
          <div key={m.id} style={{
            background: 'var(--bg3)',
            border: `1px solid ${m.is_active ? 'var(--gold-glow)' : 'var(--border)'}`,
            borderRadius: 'var(--r-lg)',
            padding: '16px 20px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              {/* Status indikator */}
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: m.is_active ? '#f59e0b' : m.is_archived ? 'var(--tx4)' : 'var(--tx3)',
                boxShadow: m.is_active ? '0 0 8px #f59e0b' : 'none'
              }} />

              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:15, color:'var(--tx1)' }}>
                  {m.name}
                </div>
                <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx3)', marginTop:3 }}>
                  {m.start_date} — {m.end_date}
                  {m.weeks_total ? ` · ${m.weeks_total} hafta` : ''}
                </div>
              </div>

              {/* Holat badge */}
              {m.is_active && (
                <span className="badge badge-gold" style={{ fontSize:9 }}>
                  <Lightning size={9} weight="fill"/>FAOL
                </span>
              )}
              {m.is_archived && !m.is_active && (
                <span className="badge badge-gray" style={{ fontSize:9 }}>
                  <Archive size={9} weight="duotone"/>Arxiv
                </span>
              )}
              {!m.is_active && !m.is_archived && (
                <span className="badge" style={{ fontSize:9, background:'rgba(255,255,255,.04)', border:'1px solid var(--border-2)', color:'var(--tx3)' }}>
                  Nofaol
                </span>
              )}

              {/* Hafta tahrirlash */}
              {tahrirId === m.id ? (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <input type="number" className="form-input" style={{ width:70, fontFamily:'var(--f-mono)', fontSize:12 }}
                    value={tahrirHafta} onChange={e => setTahrirHafta(e.target.value)} placeholder="hafta" />
                  <button className="btn btn-red btn-xs" onClick={() => haftaSaqlash(m)}>
                    <FloppyDisk size={11} weight="duotone"/>
                  </button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setTahrirId(null)}>
                    <X size={11} weight="bold"/>
                  </button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-xs" onClick={() => { setTahrirId(m.id); setTahrirHafta(m.weeks_total ? String(m.weeks_total) : ''); }}>
                  <PencilSimple size={11} weight="duotone"/>Hafta
                </button>
              )}

              {/* Amallar */}
              {!m.is_active && (
                <button className="btn btn-gold btn-xs" onClick={() => faollashtirish(m.id, m.name)}>
                  <CheckCircle size={11} weight="duotone"/>Faollashtirish
                </button>
              )}
              {m.is_active && (
                <button className="btn btn-ghost btn-xs" onClick={() => arxivlash(m.id, m.name)}>
                  <Archive size={11} weight="duotone"/>Arxivlash
                </button>
              )}
              <button className="btn btn-ghost btn-xs" onClick={() => mavsumOchirish(m.id, m.name)} style={{ color:'var(--red-light)' }}>
                <Trash size={11} weight="duotone"/>
              </button>
            </div>
          </div>
        ))}
        {mavsumlar.length === 0 && (
          <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Hali mavsum yo'q</div></div>
        )}
      </div>
    </div>
  );
}
