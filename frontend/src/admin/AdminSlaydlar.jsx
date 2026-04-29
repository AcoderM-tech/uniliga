import { useEffect, useState } from 'react';
import { Plus, FloppyDisk, X, Upload, Trash, PencilSimple } from '@phosphor-icons/react';
import {
  getHomeSlides,
  adminHomeSlideCreate,
  adminHomeSlideUpdate,
  adminHomeSlideDelete,
} from '../lib/api';

const emptyForm = {
  tag: '',
  h1a: '',
  h1b: '',
  h1c: '',
  desc: '',
  order: 0,
  is_active: true,
  rasm_fayl: null,
};

export default function AdminSlaydlar() {
  const [slides, setSlides] = useState([]);
  const [yangi, setYangi] = useState(false);
  const [tahrir, setTahrir] = useState(null);
  const [forma, setForma] = useState(emptyForm);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xabar, setXabar] = useState(null);

  const flash = (matn, tur='muvaffaqiyat') => {
    setXabar({ matn, tur });
    setTimeout(() => setXabar(null), 3500);
  };

  const qaytaYuklash = () =>
    getHomeSlides()
      .then(d => setSlides(d.results || d || []))
      .catch(() => setSlides([]));

  useEffect(() => { qaytaYuklash(); }, []);

  const yangiOchish = () => {
    setTahrir(null);
    setForma(emptyForm);
    setYangi(true);
  };

  const tahrirOchish = (s) => {
    setTahrir(s);
    setForma({
      tag: s.tag || '',
      h1a: s.h1a || '',
      h1b: s.h1b || '',
      h1c: s.h1c || '',
      desc: s.desc || '',
      order: s.order || 0,
      is_active: !!s.is_active,
      rasm_fayl: null,
    });
    setYangi(true);
  };

  const slaydSaqlash = async () => {
    if (!forma.tag || !forma.h1b || !forma.h1c) {
      flash("Tag, H1B va H1C majburiy", 'xato');
      return;
    }
    if (!tahrir && !forma.rasm_fayl) {
      flash("Rasm yuklash majburiy", 'xato');
      return;
    }

    setSaqlanmoqda(true);
    try {
      const fd = new FormData();
      fd.append('tag', forma.tag);
      fd.append('h1a', forma.h1a || '');
      fd.append('h1b', forma.h1b);
      fd.append('h1c', forma.h1c);
      fd.append('desc', forma.desc || '');
      fd.append('order', String(forma.order ?? 0));
      fd.append('is_active', forma.is_active ? 'true' : 'false');
      if (forma.rasm_fayl) fd.append('image', forma.rasm_fayl);

      if (tahrir) {
        await adminHomeSlideUpdate(tahrir.id, fd);
        flash("Slayd yangilandi");
      } else {
        await adminHomeSlideCreate(fd);
        flash("Slayd yaratildi");
      }

      setYangi(false);
      setTahrir(null);
      setForma(emptyForm);
      qaytaYuklash();
    } catch (e) {
      flash(e?.response?.data ? JSON.stringify(e.response.data) : "Xatolik yuz berdi", 'xato');
    }
    setSaqlanmoqda(false);
  };

  const slaydOchirish = async (id, tag) => {
    if (!confirm(`"${tag}" slaydini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminHomeSlideDelete(id);
      flash("Slayd o'chirildi");
      qaytaYuklash();
    } catch {
      flash("Xatolik yuz berdi", 'xato');
    }
  };

  return (
    <div>
      {xabar && <div className={`flash flash-${xabar.tur === 'xato' ? 'error' : 'success'}`}>{xabar.matn}</div>}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Boshqaruv</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Bosh sahifa slaydlari ({slides.length})</h2>
        </div>
        <button className="btn btn-red btn-md" onClick={() => (yangi ? setYangi(false) : yangiOchish())}>
          {yangi ? <X size={14} /> : <Plus size={14} />}
          {yangi ? 'Bekor qilish' : 'Yangi slayd'}
          <span className="btn-shine" />
        </button>
      </div>

      {yangi && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">{tahrir ? "Slaydni tahrirlash" : "Yangi slayd"}</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Tag *</label>
              <input className="form-input" placeholder="Rasmiy Liga"
                value={forma.tag} onChange={e => setForma(p => ({ ...p, tag: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">H1A (ixtiyoriy)</label>
              <input className="form-input" placeholder="UniLiga"
                value={forma.h1a} onChange={e => setForma(p => ({ ...p, h1a: e.target.value }))} />
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx4)', marginTop:4 }}>
                Bo'sh qoldirilsa, statistikadan dinamik qiymat chiqadi
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">H1B *</label>
              <input className="form-input" placeholder="Universitet"
                value={forma.h1b} onChange={e => setForma(p => ({ ...p, h1b: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">H1C *</label>
              <input className="form-input" placeholder="Futbol Ligasi"
                value={forma.h1c} onChange={e => setForma(p => ({ ...p, h1c: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label className="form-label">Kichik matn</label>
              <textarea className="form-input" rows={3} placeholder="Slayd tavsifi"
                value={forma.desc} onChange={e => setForma(p => ({ ...p, desc: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tartib</label>
              <input className="form-input" type="number" min="0"
                value={forma.order} onChange={e => setForma(p => ({ ...p, order: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Faol</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, height:36 }}>
                <input type="checkbox" checked={!!forma.is_active}
                  onChange={e => setForma(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ accentColor:'var(--red)', width:14, height:14 }} />
                Faol slayd
              </label>
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label className="form-label">Rasm {tahrir ? '(ixtiyoriy)' : '*'}</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13 }}>
                <Upload size={14} />
                {forma.rasm_fayl ? forma.rasm_fayl.name : 'Rasm yuklash (JPG/PNG/WebP)'}
                <input type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => setForma(p => ({ ...p, rasm_fayl: e.target.files[0] }))} />
              </label>
              {tahrir?.image_url && !forma.rasm_fayl && (
                <div style={{ marginTop:10 }}>
                  <img src={tahrir.image_url} alt={tahrir.tag}
                    style={{ width:180, height:90, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setYangi(false)}>Bekor</button>
            <button className="btn btn-red btn-sm" onClick={slaydSaqlash} disabled={saqlanmoqda}>
              <FloppyDisk size={13} />{saqlanmoqda ? 'Saqlanmoqda...' : 'Saqlash'}<span className="btn-shine" />
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Rasm</th><th>Matn</th><th>Faol</th><th>Tartib</th><th></th></tr>
          </thead>
          <tbody>
            {slides.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--tx4)' }}>Hali slayd yo'q</td></tr>
            )}
            {slides.map((s, i) => (
              <tr key={s.id}>
                <td style={{ color:'var(--tx3)', fontFamily:'var(--f-mono)', fontSize:12 }}>{i+1}</td>
                <td>
                  {s.image_url
                    ? <img src={s.image_url} alt={s.tag} style={{ width:110, height:56, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />
                    : <span style={{ color:'var(--tx4)', fontSize:11 }}>Rasm yo'q</span>
                  }
                </td>
                <td>
                  <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:12, color:'var(--tx1)' }}>{s.tag}</div>
                  <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--tx3)' }}>
                    {(s.h1a ? `${s.h1a} ` : '')}{s.h1b} {s.h1c}
                  </div>
                </td>
                <td>{s.is_active ? <span className="badge badge-green" style={{ fontSize:9 }}>Faol</span> : <span className="badge" style={{ fontSize:9 }}>Nofaol</span>}</td>
                <td style={{ fontFamily:'var(--f-mono)', fontSize:12 }}>{s.order ?? 0}</td>
                <td style={{ display:'flex', gap:6 }}>
                  <button onClick={() => tahrirOchish(s)} style={{ background:'none', border:'none', color:'var(--tx2)', cursor:'pointer', padding:4 }}>
                    <PencilSimple size={14} />
                  </button>
                  <button onClick={() => slaydOchirish(s.id, s.tag)} style={{ background:'none', border:'none', color:'var(--red-light)', cursor:'pointer', padding:4 }}>
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
