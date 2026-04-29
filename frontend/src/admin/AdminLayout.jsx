import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  SquaresFour, Television, Users, Newspaper, Image,
  CalendarBlank, List, X, Lightning, UsersThree,
  CaretRight, SignOut, ShieldStar,
} from '@phosphor-icons/react';
import { adminMen, adminChiqish, setAccessToken, setRefreshFlag } from '../lib/api';
import AdminLogin from '../pages/AdminLogin';

const MENYULAR = [
  { nomi: 'Bosh sahifa',   Belgi: SquaresFour, yol: '/admin' },
  { nomi: 'Slaydlar',      Belgi: Image,       yol: '/admin/slaydlar' },
  { nomi: "O'yinlar",      Belgi: Television,  yol: '/admin/oyinlar' },
  { nomi: 'Jamoalar',      Belgi: ShieldStar,  yol: '/admin/jamoalar' },
  { nomi: 'Futbolchilar',  Belgi: UsersThree,  yol: '/admin/futbolchilar' },
  { nomi: 'Mavsumlar',     Belgi: CalendarBlank, yol: '/admin/mavsumlar' },
  { nomi: 'Yangiliklar',   Belgi: Newspaper,   yol: '/admin/yangiliklar' },
  { nomi: 'Match Center',  Belgi: Television,  yol: '/admin/match-center' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [ochiq, setOchiq] = useState(false);
  const [foydalanuvchi, setFoydalanuvchi] = useState(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);

  useEffect(() => {
    setYuklanmoqda(true);
    adminMen()
      .then(setFoydalanuvchi)
      .catch(() => setFoydalanuvchi(null))
      .finally(() => setYuklanmoqda(false));
  }, []);

  const handleChiqish = async () => {
    await adminChiqish();
    setAccessToken(null);
    setRefreshFlag(false);
    setFoydalanuvchi(null);
    navigate('/admin');
  };

  if (yuklanmoqda) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>Tekshirilmoqda...</span>
      </div>
    );
  }

  if (!foydalanuvchi) {
    return <AdminLogin onKirish={(u) => setFoydalanuvchi(u)} />;
  }

  const joriyBet = [...MENYULAR]
    .sort((a, b) => b.yol.length - a.yol.length)
    .find(i => pathname === i.yol || pathname.startsWith(`${i.yol}/`))?.nomi || 'Admin';

  return (
    <div className="admin-layout">
      {ochiq && (
        <div onClick={() => setOchiq(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.6)',
          zIndex: 199,
          backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* Yon panel */}
      <aside className={`admin-sidebar ${ochiq ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <div className="nav-logo" onClick={() => navigate('/')}>
            <div className="nav-logo-mark" style={{ width: 36, height: 36 }}>
              <ShieldStar size={18} weight="fill" color="#fff" />
            </div>
            <div className="nav-logo-text">
              <span className="nav-logo-main" style={{ fontSize: 15 }}>UniLiga</span>
              <span className="nav-logo-sub">Boshqaruv paneli</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="badge badge-red" style={{ fontSize: 9 }}>
              <Lightning size={9} weight="fill" />Admin tizimi
            </span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section">
            <span className="admin-nav-section-label">Boshqaruv</span>
            {MENYULAR.map(({ nomi, Belgi, yol }) => (
              <div
                key={yol}
                className={`admin-nav-item ${pathname === yol ? 'active' : ''}`}
                onClick={() => { navigate(yol); setOchiq(false); }}
              >
                <Belgi size={15} weight={pathname === yol ? 'fill' : 'duotone'} className="nav-link-icon" />
                {nomi}
                {pathname === yol && (
                  <CaretRight size={12} weight="bold" style={{ marginLeft: 'auto', color: 'var(--red-light)' }} />
                )}
              </div>
            ))}
          </div>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', marginBottom: 8,
            background: 'var(--surface-2)', borderRadius: 'var(--r-sm)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 14, color: '#fff',
            }}>
              {foydalanuvchi.full_name?.[0]?.toUpperCase() || foydalanuvchi.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 12, color: 'var(--tx1)' }}>
                {foydalanuvchi.full_name || foydalanuvchi.username}
              </div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: 10, color: 'var(--tx3)' }}>
                {foydalanuvchi.is_superuser ? 'Superuser' : 'Admin'}
              </div>
            </div>
          </div>
          <div className="admin-nav-item" onClick={() => navigate('/')}>
            <ShieldStar size={15} weight="duotone" className="nav-link-icon" />Saytga qaytish
          </div>
          <div className="admin-nav-item" onClick={handleChiqish} style={{ color: 'var(--red-light)' }}>
            <SignOut size={15} weight="duotone" className="nav-link-icon" />Chiqish
          </div>
        </div>
      </aside>

      {/* Asosiy kontent */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer', padding: 4 }}
              onClick={() => setOchiq(v => !v)}
            >
              {ochiq
                ? <X size={20} weight="bold" color="#fff" />
                : <List size={20} weight="bold" color="var(--tx2)" />}
            </button>
            <span className="admin-page-title">{joriyBet}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-red"><span className="live-dot" />Jonli tizim</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 28, height: 28, background: 'var(--red)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 13, color: '#fff',
              }}>
                {foydalanuvchi.full_name?.[0]?.toUpperCase() || foydalanuvchi.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>
                {foydalanuvchi.full_name || foydalanuvchi.username}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
