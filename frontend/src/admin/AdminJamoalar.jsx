import { useState, useEffect } from 'react';
import { Plus, FloppyDisk, X, Upload, Trash } from '@phosphor-icons/react';
import { getJamoalar, getMavsumlar, adminJamoaOchirish } from '../lib/api';
import api from '../lib/api';

export default function AdminJamoalar() {
  const [jamoalar, setJamoalar] = useState([]);
  const [mavsumlar, setMavsumlar] = useState([]);
  const [yangi, setYangi] = useState(false);
  const [forma, setForma] = useState({ primary_color: '#cc1a2e', secondary_color: '#060810' });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xabar, setXabar] = useState(null);

  const [qidiruv, setQidiruv] = useState('');
  const [sahifa, setSahifa] = useState(1);
  const SAHIFADA = 15;

  const flash = (matn, tur='muvaffaqiyat') => { setXabar({ matn, tur }); setTimeout(() => setXabar(null), 3500); };
  // Backend faqat faol mavsum jamoalarini qaytaradi
  const qaytaYuklash = () => getJamoalar({}).then(d => setJamoalar(d.results || d || []));

  const filtrlangan = jamoalar.filter(j =>
    !qidiruv || j.name?.toLowerCase().includes(qidiruv.toLowerCase()) ||
    j.short_name?.toLowerCase().includes(qidiruv.toLowerCase()) ||
    j.faculty?.toLowerCase().includes(qidiruv.toLowerCase())
  );
  const jami = filtrlangan.length;
  const satr = filtrlangan.slice((sahifa - 1) * SAHIFADA, sahifa * SAHIFADA);
  const sarifalar = Math.ceil(jami / SAHIFADA);

  useEffect(() => {
    qaytaYuklash();
    getMavsumlar().then(d => setMavsumlar(d.results || d || []));
  }, []);

  const jamoaYaratish = async () => {
    if (!forma.name || !forma.season) { flash("Jamoa nomi va mavsum kiritilishi shart", 'xato'); return; }
    setSaqlanmoqda(true);
    try {
      const fd = new FormData();
      Object.entries({ ...forma, short_name: forma.short_name || forma.name.slice(0,3).toUpperCase() })
        .forEach(([k, v]) => { if (k !== 'logo_fayl' && v !== undefined && v !== null) fd.append(k, v); });
      if (forma.logo_fayl) fd.append('logo', forma.logo_fayl);
      await api.post('/jamoalar/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash("Jamoa muvaffaqiyatli yaratildi");
      setYangi(false);
      setForma({ primary_color: '#cc1a2e', secondary_color: '#060810' });
      qaytaYuklash();
    } catch (e) { flash(e?.response?.data ? JSON.stringify(e.response.data) : "Xatolik yuz berdi", 'xato'); }
    setSaqlanmoqda(false);
  };

  const jamoaOchirish = async (id, nom) => {
    if (!confirm(`"${nom}" jamoasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminJamoaOchirish(id);
      flash("Jamoa o'chirildi");
      qaytaYuklash();
    } catch { flash("Xatolik yuz berdi", 'xato'); }
  };

  return (
    <div>
      {xabar && <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Jamoalar ({jami})</h2>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input
            className="form-input"
            placeholder="🔍 Jamoa qidirish..."
            value={qidiruv}
            onChange={e => { setQidiruv(e.target.value); setSahifa(1); }}
            style={{ width:220 }}
          />
          <button className="btn btn-red btn-md" onClick={() => setYangi(v => !v)}>
          {yangi ? <X size={14} /> : <Plus size={14} />}
          {yangi ? 'Bekor qilish' : 'Yangi jamoa'}
          <span className="btn-shine" />
        </button>
        </div>
      </div>

      {yangi && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">Yangi jamoa yaratish</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Jamoa nomi *</label>
              <input className="form-input" placeholder="TATU Titans" value={forma.name || ''} onChange={e => setForma(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Qisqa nomi</label>
              <input className="form-input" placeholder="TTT" maxLength={5} value={forma.short_name || ''} onChange={e => setForma(p => ({ ...p, short_name: e.target.value.toUpperCase() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Fakultet</label>
              <input className="form-input" placeholder="Axborot texnologiyalari" value={forma.faculty || ''} onChange={e => setForma(p => ({ ...p, faculty: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Asosiy rang</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="color" value={forma.primary_color} onChange={e => setForma(p => ({ ...p, primary_color: e.target.value }))}
                  style={{ width:44, height:36, border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', background:'var(--bg)', cursor:'pointer', padding:2 }} />
                <input className="form-input" value={forma.primary_color} onChange={e => setForma(p => ({ ...p, primary_color: e.target.value }))} style={{ fontFamily:'var(--f-mono)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mavsum *</label>
              <select className="form-select" value={forma.season || ''} onChange={e => setForma(p => ({ ...p, season: e.target.value }))}>
                <option value="">Tanlang...</option>
                {mavsumlar.filter(m => !m.is_archived).map(m => <option key={m.id} value={m.id}>{m.name}{m.is_active ? " ✓" : ""}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Logotip</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13 }}>
                <Upload size={14} />
                {forma.logo_fayl ? forma.logo_fayl.name : 'Rasm yuklash (PNG/SVG)'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => setForma(p => ({ ...p, logo_fayl: e.target.files[0] }))} />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setYangi(false)}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={jamoaYaratish} disabled={saqlanmoqda}>
              <FloppyDisk size={13} />{saqlanmoqda ? 'Saqlanmoqda...' : 'Jamoa yaratish'}<span className="btn-shine" />
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Jamoa</th><th>Rang</th><th>Fakultet</th><th>Mavsum</th><th>Logotip</th><th></th></tr>
          </thead>
          <tbody>
            {jamoalar.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--tx4)' }}>Hali jamoa yo'q</td></tr>
            )}
            {satr.map((j, i) => (
              <tr key={j.id}>
                <td style={{ color:'var(--tx3)', fontFamily:'var(--f-mono)', fontSize:12 }}>{(sahifa-1)*SAHIFADA + i + 1}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:`${j.primary_color}22`, border:`2px solid ${j.primary_color}55`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {j.logo_url
                        ? <img src={j.logo_url} alt={j.short_name} style={{ width:24, height:24, objectFit:'contain' }} />
                        : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:14, color:j.primary_color }}>{j.short_name?.[0]}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:13, color:'var(--tx1)' }}>{j.name}</div>
                      <div style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--tx3)' }}>{j.short_name}</div>
                    </div>
                  </div>
                </td>
                <td><div style={{ width:22, height:22, borderRadius:4, background:j.primary_color, border:'1px solid rgba(255,255,255,.1)' }} /></td>
                <td style={{ color:'var(--tx2)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{j.faculty || '—'}</td>
                <td><span className="badge badge-blue" style={{ fontSize:9 }}>Mavsum {j.season}</span></td>
                <td>{j.logo_url ? <span className="badge badge-green" style={{ fontSize:9 }}>✓ Bor</span> : <span style={{ color:'var(--tx4)', fontSize:11 }}>Yo'q</span>}</td>
                <td>
                  <button onClick={() => jamoaOchirish(j.id, j.name)} style={{ background:'none', border:'none', color:'var(--red-light)', cursor:'pointer', padding:4 }}>
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sarifalar > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.max(1, p-1))} disabled={sahifa === 1}>‹ Oldingi</button>
          {Array.from({ length: sarifalar }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-xs ${p === sahifa ? 'btn-red' : 'btn-ghost'}`} onClick={() => setSahifa(p)} style={{ minWidth:32 }}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-xs" onClick={() => setSahifa(p => Math.min(sarifalar, p+1))} disabled={sahifa === sarifalar}>Keyingi ›</button>
          <span style={{ color:'var(--tx3)', fontSize:11, marginLeft:8 }}>{jami} ta jamoa</span>
        </div>
      )}
    </div>
  );
}