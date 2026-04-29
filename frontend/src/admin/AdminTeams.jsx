import { useState, useEffect } from 'react';
import { Plus, FloppyDisk, X, Upload } from '@phosphor-icons/react';
import { getTeams, adminCreateTeam } from '../lib/api';
import api from '../lib/api';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ primary_color: '#cc1a2e', secondary_color: '#060810' });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const showFlash = (msg, type = 'success') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3000);
  };

  const reload = () => {
    getTeams({}).then(d => setTeams(d.results || d || []));
  };

  useEffect(() => {
    reload();
    api.get('/seasons/').then(r => setSeasons(r.data.results || r.data || []));
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.season) return;
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries({ ...form, short_name: form.short_name || form.name.slice(0,3).toUpperCase() })
        .forEach(([k, v]) => { if (v !== undefined && v !== null && k !== 'logo_file') payload.append(k, v); });
      if (form.logo_file) payload.append('logo', form.logo_file);

      await api.post('/teams/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      showFlash('Team created successfully');
      setCreating(false);
      setForm({ primary_color: '#cc1a2e', secondary_color: '#060810' });
      reload();
    } catch (e) {
      showFlash(e?.response?.data ? JSON.stringify(e.response.data) : 'Error creating team', 'error');
    }
    setSaving(false);
  };

  return (
    <div>
      {flash && (
        <div className={`flash flash-${flash.type}`}>{flash.msg}</div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:4 }}>Management</div>
          <h2 style={{ fontFamily:'var(--f-display)', fontWeight:800, fontSize:20, color:'var(--tx1)' }}>Teams ({teams.length})</h2>
        </div>
        <button className="btn btn-red btn-md" onClick={() => setCreating(v => !v)}>
          {creating ? <X size={14} /> : <Plus size={14} />}
          {creating ? 'Cancel' : 'New Team'}
          <span className="btn-shine" />
        </button>
      </div>

      {creating && (
        <div className="admin-form" style={{ marginBottom:24 }}>
          <div className="admin-form-title">Create New Team</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input className="form-input" placeholder="TATU Titans" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Short Code</label>
              <input className="form-input" placeholder="TTT" maxLength={5} value={form.short_name || ''} onChange={e => setForm(p => ({ ...p, short_name: e.target.value.toUpperCase() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Faculty</label>
              <input className="form-input" placeholder="Faculty of Information Technologies" value={form.faculty || ''} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="color" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                  style={{ width:44, height:36, border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', background:'var(--bg)', cursor:'pointer', padding:2 }} />
                <input className="form-input" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} style={{ fontFamily:'var(--f-mono)' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Season *</label>
              <select className="form-select" value={form.season || ''} onChange={e => setForm(p => ({ ...p, season: e.target.value }))}>
                <option value="">Select season...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team Logo</label>
              <label style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--bg)', border:'1px solid var(--border-2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--tx2)', fontSize:13, fontFamily:'var(--f-body)' }}>
                <Upload size={14} />
                {form.logo_file ? form.logo_file.name : 'Upload logo (PNG/SVG)'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => setForm(p => ({ ...p, logo_file: e.target.files[0] }))} />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn btn-red btn-sm" onClick={handleCreate} disabled={saving}>
              <FloppyDisk size={13} />{saving ? 'Saving...' : 'Create Team'}<span className="btn-shine" />
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width:44 }}>#</th>
              <th>Team</th>
              <th>Colors</th>
              <th>Faculty</th>
              <th>Season</th>
              <th>Logo</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px', color:'var(--tx4)' }}>No teams yet</td></tr>
            )}
            {teams.map((t, i) => (
              <tr key={t.id}>
                <td style={{ color:'var(--tx3)', fontFamily:'var(--f-mono)', fontSize:12 }}>{i+1}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:`${t.primary_color}22`, border:`2px solid ${t.primary_color}55`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {t.logo_url
                        ? <img src={t.logo_url} alt={t.short_name} style={{ width:24, height:24, objectFit:'contain' }} />
                        : <span style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:14, color:t.primary_color }}>{t.short_name?.[0]}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily:'var(--f-display)', fontWeight:700, fontSize:13, color:'var(--tx1)' }}>{t.name}</div>
                      <div style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--tx3)' }}>{t.short_name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <div style={{ width:22, height:22, borderRadius:4, background:t.primary_color, border:'1px solid rgba(255,255,255,.1)' }} title={t.primary_color} />
                  </div>
                </td>
                <td style={{ color:'var(--tx2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.faculty || '—'}</td>
                <td><span className="badge badge-blue" style={{ fontSize:9 }}>Season {t.season}</span></td>
                <td>{t.logo_url ? <span className="badge badge-green" style={{ fontSize:9 }}>✓ Logo</span> : <span style={{ color:'var(--tx4)', fontSize:12 }}>No logo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
