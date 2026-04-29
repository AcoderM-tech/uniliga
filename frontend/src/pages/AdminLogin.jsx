import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, User, Eye, EyeSlash, SignIn } from '@phosphor-icons/react';
import { adminKirish, setAccessToken, setRefreshFlag } from '../lib/api';

export default function AdminLogin({ onKirish }) {
  const navigate = useNavigate();
  const [forma, setForma] = useState({ login: '', parol: '' });
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [xato, setXato] = useState('');
  const [parolKorinsin, setParolKorinsin] = useState(false);

  const handleKirish = async (e) => {
    e.preventDefault();
    if (!forma.login || !forma.parol) {
      setXato('Login va parolni kiriting');
      return;
    }
    setYuklanyapti(true);
    setXato('');
    try {
      const natija = await adminKirish({ username: forma.login, password: forma.parol });
      if (natija?.access) {
        setAccessToken(natija.access);
        setRefreshFlag(true);
      }
      onKirish?.(natija?.user || null);
      navigate('/admin');
    } catch (err) {
      setXato(err?.response?.data?.detail || err?.response?.data?.xato || "Login yoki parol noto'g'ri");
    }
    setYuklanyapti(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fon bezaklari */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204,26,46,.08), transparent)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'20%', left:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(201,162,39,.04), transparent)', pointerEvents:'none' }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(145deg, var(--red), #8b0018)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Trophy size={30} color="#fff" />
          </div>
          <div style={{ fontFamily:'var(--f-display)', fontWeight:900, fontSize:22, color:'var(--tx1)', letterSpacing:'-.02em' }}>
            UniLiga
          </div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:11, fontWeight:600, letterSpacing:'.12em', color:'var(--gold)', textTransform:'uppercase', marginTop:4 }}>
            Boshqaruv Paneli
          </div>
          <div style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--tx3)', marginTop:12, lineHeight:1.5 }}>
            Kirish uchun superuser tomonidan<br />berilgan login va parolni kiriting
          </div>
        </div>

        {/* Xato xabari */}
        {xato && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--red-dim)',
            border: '1px solid var(--red-glow)',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--f-body)',
            fontSize: 13,
            color: 'var(--red-light)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⚠️ {xato}
          </div>
        )}

        {/* Forma */}
        <form onSubmit={handleKirish}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', display:'block', marginBottom:6 }}>
              Login (username)
            </label>
            <div style={{ position:'relative' }}>
              <User size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--tx3)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="admin"
                value={forma.login}
                onChange={e => setForma(p => ({ ...p, login: e.target.value }))}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily:'var(--f-display)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--tx3)', display:'block', marginBottom:6 }}>
              Parol
            </label>
            <div style={{ position:'relative' }}>
              <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--tx3)' }} />
              <input
                type={parolKorinsin ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 42 }}
                placeholder="••••••••"
                value={forma.parol}
                onChange={e => setForma(p => ({ ...p, parol: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setParolKorinsin(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--tx3)', cursor:'pointer', padding:2 }}
              >
                {parolKorinsin ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-red btn-lg"
            style={{ width:'100%', justifyContent:'center' }}
            disabled={yuklanyapti}
          >
            <SignIn size={15} />
            {yuklanyapti ? 'Kirilmoqda...' : 'Kirish'}
            <span className="btn-shine" />
          </button>
        </form>

        <div style={{ marginTop:24, textAlign:'center', fontFamily:'var(--f-body)', fontSize:12, color:'var(--tx4)' }}>
          Faqat tizim ma'muri kira oladi
        </div>
      </div>
    </div>
  );
}
