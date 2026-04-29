import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Television, Users, Trophy, SoccerBall, Radio, CalendarBlank, CaretRight, TrendUp, UsersThree, Bell, Play, X } from '@phosphor-icons/react';
import { getStatistika, getOyinlar, getBoshlanishXabari, adminBoshlash } from '../lib/api';

// O'yin vaqti yetganda chiqadigan xabar
function BoshlanishXabari({ oyinlar, onBoshlash, onYopish }) {
  if (!oyinlar.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(204,26,46,.15), rgba(204,26,46,.05))',
      border: '1px solid var(--red-glow)',
      borderRadius: 'var(--r-lg)',
      padding: '18px 20px',
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red-dim)', border: '1px solid var(--red-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell size={16} color="var(--red-light)" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 14, color: 'var(--red-light)' }}>
            O'yin vaqti yetdi!
          </div>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
            Quyidagi o'yin(lar)ni boshlashingiz mumkin
          </div>
        </div>
        <button onClick={onYopish} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', padding: 4 }}>
          <X size={14} />
        </button>
      </div>
      {oyinlar.map(oyin => (
        <div key={oyin.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 13, color: 'var(--tx1)', flex: 1 }}>
            {oyin.home_team_name} <span style={{ color: 'var(--tx3)' }}>vs</span> {oyin.away_team_name}
          </div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--tx3)' }}>
            {oyin.match_time?.slice(0, 5)}
          </span>
          <button className="btn btn-red btn-sm" onClick={() => onBoshlash(oyin)}>
            <Play size={11} fill="currentColor" />O'yinni boshlash<span className="btn-shine" />
          </button>
        </div>
      ))}
    </div>
  );
}

// 1-yarim davomiyligini so'rash modali
function BoshlashModali({ oyin, onTasdiqlash, onBekor }) {
  const [daqiqa, setDaqiqa] = useState('45');
  if (!oyin) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 32, maxWidth: 400, width: '90%' }}>
        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 16, color: 'var(--tx1)', marginBottom: 8 }}>
          O'yinni boshlash
        </div>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--tx3)', marginBottom: 20 }}>
          {oyin.home_team_name} vs {oyin.away_team_name}
        </div>
        <label style={{ fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--tx3)', display: 'block', marginBottom: 8 }}>
          1-yarim davomiyligi (daqiqa)
        </label>
        <input type="number" className="form-input" min={1} max={60}
          value={daqiqa} onChange={e => setDaqiqa(e.target.value)}
          style={{ fontFamily: 'var(--f-mono)', fontSize: 18, textAlign: 'center', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onBekor}>Bekor</button>
          <button className="btn btn-red btn-sm" style={{ flex: 2 }} onClick={() => onTasdiqlash(oyin, parseInt(daqiqa || 45))}>
            <Play size={12} fill="currentColor" />Boshlash<span className="btn-shine" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stat, setStat]               = useState(null);
  const [xabarOyinlar, setXabarOyinlar] = useState([]);
  const [xabarYopiq, setXabarYopiq]   = useState(false);
  const [modalOyin, setModalOyin]     = useState(null);
  const [boshlashXato, setBoshlashXato] = useState(null);

  useEffect(() => { getStatistika().then(setStat).catch(() => {}); }, []);

  // O'yin vaqti xabarini har 60 sekundda tekshir
  useEffect(() => {
    const tekshir = () => {
      getBoshlanishXabari().then(d => {
        if (d.length > 0) setXabarYopiq(false);
        setXabarOyinlar(d);
      }).catch(() => {});
    };
    tekshir();
    const t = setInterval(tekshir, 60000);
    return () => clearInterval(t);
  }, []);

  const handleBoshlash = (oyin) => {
    setModalOyin(oyin);
  };

  const handleTasdiqlash = async (oyin, daqiqa) => {
    try {
      await adminBoshlash(oyin.id, { first_half_duration: daqiqa });
      setModalOyin(null);
      setXabarOyinlar(prev => prev.filter(o => o.id !== oyin.id));
      navigate('/admin/oyinlar');
    } catch (e) {
      setBoshlashXato("Xatolik yuz berdi");
      setTimeout(() => setBoshlashXato(null), 3000);
    }
  };

  const kartalar = [
    { nom: "Jami o'yinlar",    qiymat: stat?.jami_oyinlar     ?? '—', belgi: Television,      rang: '#1a56db', fon: 'rgba(26,86,219,.1)' },
    { nom: "Jonli o'yinlar",   qiymat: stat?.jonli_oyinlar    ?? '—', belgi: Radio,    rang: '#cc1a2e', fon: 'rgba(204,26,46,.1)'  },
    { nom: "Tugagan o'yinlar", qiymat: stat?.tugagan_oyinlar  ?? '—', belgi: Trophy,   rang: '#1a8a4a', fon: 'rgba(26,138,74,.1)'  },
    { nom: 'Jami gollar',      qiymat: stat?.jami_gollar      ?? '—', belgi: SoccerBall,     rang: '#c9a227', fon: 'rgba(201,162,39,.1)' },
    { nom: 'Jamoalar',         qiymat: stat?.jami_jamoalar    ?? '—', belgi: Users,    rang: '#7c3aed', fon: 'rgba(124,58,237,.1)' },
    { nom: "Kutilgan o'yinlar",qiymat: stat?.kutilgan_oyinlar ?? '—', belgi: CalendarBlank, rang: '#0891b2', fon: 'rgba(8,145,178,.1)'  },
  ];

  const tezAmallar = [
    { nom: "O'yinlarni boshqarish", tavsif: "O'yin jarayonini boshqarish, hodisa qo'shish", yol: '/admin/oyinlar', belgi: Television, rang: 'var(--red)' },
    { nom: 'Jamoalarni boshqarish', tavsif: "Jamoa qo'shish, logotip yuklash",              yol: '/admin/jamoalar', belgi: Users, rang: '#1a56db' },
    { nom: 'Futbolchilar',          tavsif: "Futbolchi qo'shish, rasm yuklash",              yol: '/admin/futbolchilar', belgi: UsersThree, rang: '#7c3aed' },
    { nom: 'Mavsumlar',             tavsif: "Mavsum yaratish, arxivlash, faollashtirish",    yol: '/admin/mavsumlar', belgi: CalendarBlank, rang: '#1a8a4a' },
    { nom: 'Yangiliklar',           tavsif: "Post, video, rasm bilan yangiliklar",           yol: '/admin/yangiliklar', belgi: Trophy, rang: '#c9a227' },
  ];

  return (
    <div>
      {boshlashXato && (
        <div className="flash flash-error">{boshlashXato}</div>
      )}

      {/* O'yin vaqti xabari */}
      {!xabarYopiq && (
        <BoshlanishXabari
          oyinlar={xabarOyinlar}
          onBoshlash={handleBoshlash}
          onYopish={() => setXabarYopiq(true)}
        />
      )}

      {/* Boshlash modali */}
      <BoshlashModali
        oyin={modalOyin}
        onTasdiqlash={handleTasdiqlash}
        onBekor={() => setModalOyin(null)}
      />

      {/* Sarlavha */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx3)', marginBottom: 4 }}>
            Bosh sahifa
          </div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: 'var(--tx1)' }}>
            {stat?.faol_mavsum ? `Mavsum ${stat.faol_mavsum.name}` : 'Boshqaruv paneli'}
          </h2>
        </div>
        {stat?.faol_mavsum && (
          <span className="badge badge-green">
            <TrendUp size={10} />Faol mavsum
          </span>
        )}
      </div>

      {/* Statistika kartalari */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {kartalar.map(({ nom, qiymat, belgi: Belgi, rang, fon }) => (
          <div className="admin-stat-card" key={nom}>
            <div className="admin-stat-icon" style={{ background: fon }}>
              <Belgi size={18} color={rang} />
            </div>
            <div className="admin-stat-val">{qiymat}</div>
            <div className="admin-stat-label">{nom}</div>
          </div>
        ))}
      </div>

      {/* Tez amallar */}
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx3)', marginBottom: 14 }}>
        Tez amallar
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {tezAmallar.map(({ nom, tavsif, yol, belgi: Belgi, rang }) => (
          <div key={yol} onClick={() => navigate(yol)} className="admin-stat-card"
            style={{ cursor: 'pointer', flexDirection: 'row', alignItems: 'center', gap: 14 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: `${rang}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Belgi size={18} color={rang} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 13, color: 'var(--tx1)', marginBottom: 3 }}>{nom}</div>
              <div style={{ fontFamily: 'var(--f-body)', fontSize: 11, color: 'var(--tx3)', lineHeight: 1.4 }}>{tavsif}</div>
            </div>
            <CaretRight size={16} color="var(--tx3)" />
          </div>
        ))}
      </div>
    </div>
  );
}
