import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOyinlar } from '../lib/api';

const IcoHome  = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M216,112v96a8,8,0,0,1-8,8H160V160H96v56H48a8,8,0,0,1-8-8V112l88-80Z"/><path d="M240,112a16,16,0,0,0-5.19-11.81l-96-88a16,16,0,0,0-21.62,0l-96,88A16,16,0,0,0,16,112V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16V112Z"/></svg>;
const IcoTv    = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M240,176a8,8,0,0,1-8,8H24a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8H232a8,8,0,0,1,8,8Z"/><path d="M232,56H183.13L205.66,33.46a8,8,0,0,0-11.32-11.32L168,48.44,141.66,22.14a8,8,0,0,0-11.32,11.32L152.87,56H24A16,16,0,0,0,8,72V176a16,16,0,0,0,16,16H96v16H80a8,8,0,0,0,0,16H176a8,8,0,0,0,0-16H160V192h72a16,16,0,0,0,16-16V72A16,16,0,0,0,232,56Zm0,120H24V72H232Z"/></svg>;
const IcoList  = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M224,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Zm-8,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0-120H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/><path d="M44,52H36V72a4,4,0,0,1-8,0V52a4,4,0,0,1,4-4H44a4,4,0,0,1,0,8Zm4,100a4,4,0,0,1-4,4H28a4,4,0,0,1-3.24-6.35l12.35-16H28a4,4,0,0,1,0-8H44a4,4,0,0,1,3.24,6.35L34.89,148H48A4,4,0,0,1,48,152ZM216,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM216,184H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>;
const IcoShirt = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M216,56l-40,24H80L40,56,16,88l40,24V200a8,8,0,0,0,8,8H192a8,8,0,0,0,8-8V112l40-24Z"/><path d="M247.42,60.69l-24-32A8,8,0,0,0,217,24l-41.19,24.71A16,16,0,0,0,168,48H88a16,16,0,0,0-7.81,2.71L39,24a8,8,0,0,0-6.42,4.69l-24,32A8,8,0,0,0,9.37,71.5L48,94v106a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V94l38.62-22.5A8,8,0,0,0,247.42,60.69ZM192,200H64V88.43L88,74.59V96a8,8,0,0,0,16,0V64h48V96a8,8,0,0,0,16,0V74.59L192,88.43Z"/></svg>;
const IcoUsers = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M96,120A40,40,0,1,1,56,80,40,40,0,0,1,96,120Zm104-40a40,40,0,1,0,40,40A40,40,0,0,0,200,80Z"/><path d="M244.33,199.43C230.19,177.4,208,164,184,160.29a72,72,0,1,0-112,0C47.95,164,25.8,177.4,11.67,199.43a8,8,0,0,0,13.33,8.82C39.28,187.75,62.64,176,88,176h80c25.36,0,48.72,11.75,63,32.25a8,8,0,0,0,13.33-8.82ZM72,112a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,112Z"/></svg>;
const IcoCal   = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M216,48H40a8,8,0,0,0-8,8V88H224V56A8,8,0,0,0,216,48Z"/><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V104H208v104Zm0-120H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z"/></svg>;
const IcoNews  = ({s=14}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path opacity=".25" d="M216,48H56a8,8,0,0,0-8,8V200l32-16,32,16,32-16,32,16,32-16,32,16V56A8,8,0,0,0,216,48Z"/><path d="M216,40H56A16,16,0,0,0,40,56V224a8,8,0,0,0,11.58,7.16L72,220.94l20.42,10.22a8,8,0,0,0,7.16,0L120,220.94l20.42,10.22a8,8,0,0,0,7.16,0L168,220.94l20.42,10.22a8,8,0,0,0,7.16,0L216,220.94l20.42,10.22A8,8,0,0,0,248,224V56A16,16,0,0,0,216,40Zm0,163.06-12.42-6.22a8,8,0,0,0-7.16,0L176,207.06l-20.42-10.22a8,8,0,0,0-7.16,0L128,207.06l-20.42-10.22a8,8,0,0,0-7.16,0L80,207.06,59.58,196.84A8,8,0,0,0,56,197V56H216ZM96,120H80a8,8,0,0,1,0-16H96a8,8,0,0,1,0,16Zm80,0H144a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Zm0-40H80a8,8,0,0,1,0-16H176a8,8,0,0,1,0,16Z"/></svg>;
const IcoMenu  = ({s=22}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>;
const IcoClose = ({s=22}) => <svg width={s} height={s} viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>;

const LINKS = [
  { nom: 'Bosh sahifa',      Ico: IcoHome,  yol: '/'             },
  { nom: "Mavsum o'yinlari", Ico: IcoTv,    yol: '/oyinlar'      },
  { nom: 'Jadval',           Ico: IcoList,  yol: '/jadval'       },
  { nom: 'Jamoalar',         Ico: IcoShirt, yol: '/jamoalar'     },
  { nom: 'Futbolchilar',     Ico: IcoUsers, yol: '/futbolchilar' },
  { nom: 'Mavsumlar',        Ico: IcoCal,   yol: '/mavsumlar'    },
  { nom: 'Yangiliklar',      Ico: IcoNews,  yol: '/yangiliklar'  },
];

export default function Navbar() {
  const [open,  setOpen]  = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const liveQuery = useQuery({
    queryKey: ['oyinlar', { holat: 'live' }],
    queryFn: () => fetchOyinlar({ holat: 'live' }),
    placeholderData: (prev) => prev,
  });
  const jonli = (liveQuery.data?.results ?? liveQuery.data ?? []).length > 0;

  const go = (yol) => { navigate(yol); setOpen(false); };

  return (
    <nav className="navbar">
      <div className="nb-inner">

        {/* ── Logo: NO inline styles — pure CSS controls shape ── */}
        <div className="nb-logo" onClick={() => go('/')}>
          <div className="nb-circle">
            <img
              src="/static/tatu-logo.png"
              alt="TATU"
              onError={e => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <span className="nb-circle-fb">T</span>
          </div>
          <div className="nb-logo-text">
            <span className="nb-uni-name">Toshkent Axborot Texnologiyalari Universiteti</span>
            <span className="nb-uni-sub">Rasmiy Futbol Ligasi · UniLiga</span>
          </div>
        </div>

        {/* ── Links ── */}
        <ul className="nb-links">
          {LINKS.map(({ nom, Ico, yol }) => (
            <li key={yol}>
              <div
                className={'nb-link' + (pathname === yol ? ' nb-link--on' : '')}
                onClick={() => go(yol)}
              >
                <Ico s={12} />
                <span>{nom}</span>
                <span className="nb-link-bar" />
              </div>
            </li>
          ))}
        </ul>

        {/* ── Right ── */}
        <div className="nb-right">
          {jonli && (
            <span className="badge badge-red nb-jonli-desktop">
              <span className="live-dot" />JONLI
            </span>
          )}
          <span className="nb-mobile-brand">
            Rasmiy <span>Futbol Ligasi</span>
          </span>
          <button className="nb-burger" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? <IcoClose s={20} /> : <IcoMenu s={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nb-mobile">
          {LINKS.map(({ nom, Ico, yol }) => (
            <div
              key={yol}
              className={'nb-mobile-link' + (pathname === yol ? ' nb-mobile-link--on' : '')}
              onClick={() => go(yol)}
            >
              <Ico s={16} />
              <span>{nom}</span>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}