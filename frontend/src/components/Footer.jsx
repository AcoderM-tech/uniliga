import { useNavigate } from 'react-router-dom';
import {
  Flag,
  CalendarBlank,
  Users,
  Table,
  Newspaper,
  Code,
} from '@phosphor-icons/react';

const NAV_LINKS = [
  { label: "Mavsum o'yinlari", path: '/oyinlar',      icon: Flag         },
  { label: 'Jadval',           path: '/jadval',        icon: Table        },
  { label: 'Futbolchilar',     path: '/futbolchilar',  icon: Users        },
  { label: 'Mavsumlar',        path: '/mavsumlar',     icon: CalendarBlank},
  { label: 'Yangiliklar',      path: '/yangiliklar',   icon: Newspaper    },
  { label: 'Dasturchi',        path: '/dasturchi',     icon: Code         },
];

export default function Footer() {
  const navigate = useNavigate();
  const yil = new Date().getFullYear();

  return (
    <footer className="ft-root">
      <div className="ft-glow-line" />
      <div className="ft-container">

        <div className="ft-nav-grid">
          {NAV_LINKS.map(({ label, path, icon: Icon }) => (
            <button key={path} className="ft-nav-item" onClick={() => navigate(path)}>
              <Icon size={14} weight="bold" className="ft-nav-icon" />
              <span className="ft-nav-label">{label}</span>
            </button>
          ))}
        </div>

        <div className="ft-bottom">
          <span className="ft-copy">
            © {yil} UniLiga — Toshkent Axborot Texnologiyalari Universiteti
          </span>
          <div className="ft-bottom-right">
            <span className="ft-made">Yaratildi:</span>
            <button className="ft-acoder" onClick={() => navigate('/dasturchi')}>
              AcoderM
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}