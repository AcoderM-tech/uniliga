import { useState, useEffect } from 'react';
import { Plus, FloppyDisk, X, Upload, Trash, User } from '@phosphor-icons/react';
import { getFutbolchilar, getJamoalar, adminFutbolchiOchirish } from '../lib/api';
import api from '../lib/api';

export default function AdminFutbolchilar() {
  const [futbolchilar, setFutbolchilar] = useState([]);
  const [jamoalar, setJamoalar] = useState([]);
  const [yangi, setYangi] = useState(false);
  const [forma, setForma] = useState({ is_active: true });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xabar, setXabar] = useState(null);

  const [qidiruv, setQidiruv] = useState('');
  const [sahifa, setSahifa] = useState(1);
  const SAHIFADA = 15;

  const flash = (matn, tur='muvaffaqiyat') => { setXabar({ matn, tur }); setTimeout(() => setXabar(null), 3500); };
  const qaytaYuklash = () => getFutbolchilar({}).then(d => setFutbolchilar(d.results || d || []));

  const filtrlangan = futbolchilar.filter(f =>
    !qidiruv || f.name?.toLowerCase().includes(qidiruv.toLowerCase()) ||
    f.team_name?.toLowerCase().includes(qidiruv.toLowerCase()) ||
    f.position?.toLowerCase().includes(qidiruv.toLowerCase())
  );
  const jami = filtrlangan.length;
  const satr = filtrlangan.slice((sahifa - 1) * SAHIFADA, sahifa * SAHIFADA);
  const sarifalar = Math.ceil(jami / SAHIFADA);

  useEffect(() => {
    qaytaYuklash();
    getJamoalar({}).then(d => setJamoalar(d.results || d || []));
  }, []);

  const futbolchiYaratish = async () => {
    if (!forma.name || !forma.team) { flash("Ism va jamoa kiritilishi shart", 'xato'); return; }
    setSaqlanmoqda(true);
    try {
      const fd = new FormData();
      Object.entries(forma).forEach(([k, v]) => {
        if (k !== 'rasm_fayl' && v !== undefined && v !== null) fd.append(k, v);
      });
      if (forma.rasm_fayl) fd.append('photo', forma.rasm_fayl);
      await api.post('/futbolchilar/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash("Futbolchi muvaffaqiyatli qo'shildi");
      setYangi(false);
      setForma({ is_active: true });
      qaytaYuklash();
    } catch (e) { flash(e?.response?.data ? JSON.stringify(e.response.data) : "Xatolik yuz berdi", 'xato'); }
    setSaqlanmoqda(false);
  };

  const futbolchiOchirish = async (id, nom) => {
    if (!confirm(`"${nom}" futbolchisini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminFutbolchiOchirish(id);
      flash("Futbolchi o'chirildi");
      qaytaYuklash();
    } catch { flash("Xatolik yuz berdi", 'xato'); }
  };

  return (
    <div>
      {xabar && <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Futbolchilar ({futbolchilar.length})</h2>
        </div>
      </div>
      {/* Search box */}
      <div style={{ marginBottom:16 }}>
        <input
          className="form-input"
          placeholder="🔍 Ism, jamoa yoki mavqe bo'yicha qidirish..."
          value={qidiruv}
          onChange={e => { setQidiruv(e.target.value); setSahifa(1); }}
          style={{ maxWidth:380 }}
        />
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div />
        <button className="btn btn-red btn-md" onClick={() => setYangi(v => !v)}>
          {yangi ? <X size={14} /> : <Plus size={14} />}
          {yangi ? 'Bekor qilish' : "Futbolchi qo'shish"}
          <span className="btn-shine" />
        </button>
      </div>

      {yangi && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">Yangi futbolchi qo'shish</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ism Familiya *</label>
              <input className="form-input" placeholder="Amir Karimov" value={forma.name || ''} onChange={e => setForma(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Jamoa *</label>
              <select className="form-select" value={forma.team || ''} onChange={e => setForma(p => ({ ...p, team: e.target.value }))}>
                <option value="">Tanlang...</option>
                {jamoalar.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Raqam</label>
              <input type="number" className="form-input" placeholder="10" value={forma.number || ''} onChange={e => setForma(p => ({ ...p, number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Mavqe</label>
              <input className="form-input" placeholder="Hujumchi" value={forma.position || ''} onChange={e => setForma(p => ({ ...p, position: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label className="form-label">Futbolchi rasmi</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13 }}>
                <Upload size={14} />
                {forma.rasm_fayl ? forma.rasm_fayl.name : "Rasm yuklash (JPG/PNG) — top futbolchilar jadvalida ko'rinadi"}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => setForma(p => ({ ...p, rasm_fayl: e.target.files[0] }))} />
              </label>
              {forma.rasm_fayl && (
                <div style={{ marginTop:8 }}>
                  <img src={URL.createObjectURL(forma.rasm_fayl)} alt="Ko'rinish" style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--border-2)' }} />
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setYangi(false)}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={futbolchiYaratish} disabled={saqlanmoqda}>
              <FloppyDisk size={13} />{saqlanmoqda ? 'Saqlanmoqda...' : "Qo'shish"}<span className="btn-shine" />
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Futbolchi</th><th>Jamoa</th><th>Raqam</th><th>Mavqe</th><th>Rasm</th><th></th></tr>
          </thead>
          <tbody>
            {futbolchilar.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--tx4)' }}>
                Hali futbolchi yo'q. Gol urgan futbolchilarning rasmlari "Top futbolchilar" jadvalida ko'rinadi.
              </td></tr>
            )}
            {satr.map((f, i) => (
              <tr key={f.id}>
                <td style={{ color:'var(--tx3)', fontFamily:'var(--f-mono)', fontSize:12 }}>{(sahifa-1)*SAHIFADA + i + 1}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', background:'var(--bg)', border:'1px solid var(--border-2)', flexShrink:0 }}>
                      {f.photo_url
                        ? <img src={f.photo_url} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><User size={16} color="var(--tx3)" /></div>
                      }
                    </div>
                    <span style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:13, color:'var(--tx1)' }}>{f.name}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx2)' }}>{f.team_name}</span>
                </td>
                <td style={{ fontFamily:'var(--f-mono)', fontSize:12, color:'var(--tx2)' }}>#{f.number || '—'}</td>
                <td style={{ color:'var(--tx2)', fontSize:12 }}>{f.position || '—'}</td>
                <td>{f.photo_url ? <span className="badge badge-green" style={{ fontSize:9 }}>✓ Bor</span> : <span style={{ color:'var(--tx4)', fontSize:11 }}>Yo'q</span>}</td>
                <td>
                  <button onClick={() => futbolchiOchirish(f.id, f.name)} style={{ background:'none', border:'none', color:'var(--red-light)', cursor:'pointer', padding:4 }}>
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sarifalar > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.max(1, p-1))} disabled={sahifa === 1}>‹ Oldingi</button>
          {Array.from({ length: sarifalar }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-xs ${p === sahifa ? 'btn-red' : 'btn-ghost'}`} onClick={() => setSahifa(p)} style={{ minWidth:32 }}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.min(sarifalar, p+1))} disabled={sahifa === sarifalar}>Keyingi ›</button>
          <span style={{ color:'var(--tx3)', fontSize:11, marginLeft:8 }}>{jami} ta futbolchi</span>
        </div>
      )}
    </div>
  );
}