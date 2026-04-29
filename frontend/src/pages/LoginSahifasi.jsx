import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, User, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { adminKirish, setAccessToken } from '../lib/api';

export default function LoginSahifasi({ onKirish }) {
  const navigate = useNavigate();
  const [forma, setForma] = useState({ login: '', parol: '' });
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const [xato, setXato] = useState('');
  const [parolKorsatish, setParolKorsatish] = useState(false);

  const handleKirish = async (e) => {
    e.preventDefault();
    if (!forma.login || !forma.parol) {
      setXato("Login va parol kiritilishi shart");
      return;
    }
    setYuklanyapti(true);
    setXato('');
    try {
      const javob = await adminKirish({ username: forma.login, password: forma.parol });
      if (javob?.access) {
        setAccessToken(javob.access);
        onKirish && onKirish(javob?.user?.full_name || javob?.user?.username || forma.login);
        navigate('/admin');
      }
    } catch (err) {
      const xatoMatn = err?.response?.data?.detail || err?.response?.data?.xato || "Login yoki parol noto'g'ri";
      setXato(xatoMatn);
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
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fon bezagi */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(204,26,46,.06), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Login kartasi */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        animation: 'fadeUp .5s var(--ease) both',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(145deg, var(--red), #8b0018)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px var(--red-glow)',
          }}>
            <Trophy size={32} color="#fff" />
          </div>
          <h1 style={{
            fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: 24,
            letterSpacing: '-.02em', color: 'var(--tx1)', marginBottom: 6,
          }}>UniLiga</h1>
          <p style={{
            fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
            letterSpacing: '.14em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>ADMIN PANELI</p>
        </div>

        {/* Xato xabari */}
        {xato && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: 'var(--red-dim)', border: '1px solid var(--red-glow)',
            borderRadius: 'var(--r-sm)', marginBottom: 20,
            fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--red-light)',
          }}>
            <WarningCircle size={14} style={{ flexShrink: 0 }} />
            {xato}
          </div>
        )}

        {/* Forma */}
        <form onSubmit={handleKirish} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Login maydoni */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
              letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--tx3)',
            }}>Foydalanuvchi nomi</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--tx3)',
              }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="admin"
                value={forma.login}
                onChange={e => setForma(p => ({ ...p, login: e.target.value }))}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Parol maydoni */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700,
              letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--tx3)',
            }}>Parol</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--tx3)',
              }} />
              <input
                type={parolKorsatish ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                placeholder="••••••••"
                value={forma.parol}
                onChange={e => setForma(p => ({ ...p, parol: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setParolKorsatish(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--tx3)', padding: 2, display: 'flex',
                }}
              >
                {parolKorsatish ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Kirish tugmasi */}
          <button
            type="submit"
            className="btn btn-red btn-lg"
            disabled={yuklanyapti}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {yuklanyapti ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Tekshirilmoqda...
              </>
            ) : (
              <>
                <Lock size={14} />
                Kirish
                <span className="btn-shine" />
              </>
            )}
          </button>
        </form>

        <p style={{
          marginTop: 24, textAlign: 'center',
          fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--tx4)',
          lineHeight: 1.6,
        }}>
          Kirish uchun superuser tomonidan berilgan<br />
          login va paroldan foydalaning
        </p>
      </div>
    </div>
  );
}
