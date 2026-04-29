import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTopFutbolchi, fetchFaolMavsum, fetchMavsum } from '../lib/api';
import { IconTrophy, IconZap } from '../components/Icons';

function TeamInitials(name){
  if(!name)return'?';
  const w=name.trim().split(/\s+/);
  return w.length===1?w[0].slice(0,2).toUpperCase():(w[0][0]+w[1][0]).toUpperCase();
}
const RANK_COLORS={0:'#f59e0b',1:'rgba(200,200,210,.8)',2:'rgba(180,120,60,.9)'};

/* ── Mobile breakpoint helper ── */
const mobileStyles = `
  @media (max-width: 600px) {
    .player-card {
      flex-wrap: wrap !important;
      padding: 12px 14px !important;
      gap: 10px !important;
    }
    .player-card-top {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .player-card-stats {
      width: 100% !important;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 10px !important;
      margin-left: 0 !important;
      justify-content: space-around !important;
    }
    .player-stat-item {
      border-right: none !important;
      padding: 0 !important;
      flex: 1;
      text-align: center;
    }
    .player-stat-item:not(:last-child) {
      border-right: 1px solid var(--border) !important;
    }
    .player-stat-num {
      font-size: 20px !important;
    }
    .player-info-name {
      font-size: 14px !important;
    }
    .player-bar {
      display: none !important;
    }
  }
`;

export default function FutbolchilarSahifasi() {
  const [params]=useSearchParams();
  const mavsumId=params.get('mavsum');

  const mavsumQuery = useQuery({
    queryKey: ['mavsum', mavsumId || 'active'],
    queryFn: () => (mavsumId ? fetchMavsum(mavsumId) : fetchFaolMavsum()),
    placeholderData: (prev) => prev,
  });

  const topParams = useMemo(() => (mavsumId ? { mavsum: mavsumId } : {}), [mavsumId]);

  const futbolchilarQuery = useQuery({
    queryKey: ['topFutbolchilar', mavsumId || 'active'],
    queryFn: () => fetchTopFutbolchi(topParams),
    placeholderData: (prev) => prev,
  });

  const mavsum = mavsumQuery.data ?? null;
  const futbolchilar = futbolchilarQuery.data ?? [];
  const isInitialLoading = futbolchilarQuery.isLoading && !futbolchilarQuery.data;
  const status = futbolchilarQuery.error?.response?.status;
  const isRateLimited = status === 429;

  const maxBall=futbolchilar[0]?.ball||1;

  return(
    <div className="page-wrap">
      {/* Inject mobile styles */}
      <style>{mobileStyles}</style>

      <div className="page-header">
        <div className="page-header-inner">
          <div className="section-eyebrow" style={{marginBottom:8}}>{mavsum?.name?`Mavsum ${mavsum.name}`:'Mavsum 2024/25'}</div>
          <h1 className="page-title">Top Futbolchilar</h1>
          <p className="page-subtitle">Vaznli ball: Gol (×3) + Assist (×1) — Barcha turlar bo'yicha</p>
        </div>
      </div>

      <div className="container" style={{paddingBottom:80}}>
        {futbolchilarQuery.isError && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              background: 'rgba(204,26,46,.12)',
              border: '1px solid rgba(204,26,46,.35)',
              borderRadius: 14,
              padding: '12px 14px',
              color: 'var(--tx1)',
            }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                {isRateLimited ? "Ko'p so'rov yuborildi (429)" : "Ma'lumot yuklanmadi"}
              </div>
              <div style={{ opacity: 0.85, fontSize: 13, marginBottom: 10 }}>
                {isRateLimited
                  ? "Iltimos 20-30 soniya kuting va qayta urinib ko'ring."
                  : (futbolchilarQuery.error?.response?.data?.detail ?? futbolchilarQuery.error?.message ?? "Noma'lum xato")}
              </div>
              <button className="btn btn-red" onClick={() => futbolchilarQuery.refetch()}>Qayta urinish</button>
            </div>
          </div>
        )}

        {isInitialLoading?(
          <div className="loading-center"><div className="spinner"/><span>Yuklanmoqda...</span></div>
        ):futbolchilar.length===0?(
          <div className="empty-state">
            <div style={{marginBottom:16}}><IconTrophy size={48}/></div>
            <div className="empty-state-text">Hali futbolchi ma'lumoti yo'q</div>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {futbolchilar.map((f,i)=>{
              const rang=f.jamoa_rang||'#cc1a2e';
              const barW=maxBall>0?(f.ball/maxBall)*100:0;
              const rankColor=RANK_COLORS[i]||'var(--tx3)';
              const isTop3=i<3;
              return(
                <div
                  key={i}
                  className="player-card"
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:16,
                    padding:'16px 20px',
                    background:isTop3?`${rang}08`:'var(--bg3)',
                    border:`1px solid ${isTop3?rang+'25':'var(--border)'}`,
                    borderLeft:`3px solid ${isTop3?rang:'transparent'}`,
                    borderRadius:'var(--r-md)',
                    transition:'transform .2s',
                    cursor:'default',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateX(4px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='translateX(0)'}
                >
                  {/* Rank */}
                  <div style={{width:28,flexShrink:0,textAlign:'center',fontFamily:'var(--f-display)',fontWeight:900,fontSize:18,color:rankColor}}>
                    {i<3?<IconTrophy size={20} color={rankColor}/>:i+1}
                  </div>

                  {/* Avatar + Info — wrapped for mobile */}
                  <div className="player-card-top" style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
                    {/* Avatar */}
                    <div style={{width:48,height:48,borderRadius:'50%',flexShrink:0,background:`${rang}22`,border:`2px solid ${rang}55`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:isTop3?`0 4px 14px ${rang}44`:'none'}}>
                      {f.rasm
                        ?<img src={f.rasm} alt={f.futbolchi_ism} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                        :<span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:18,color:rang}}>{TeamInitials(f.futbolchi_ism)}</span>
                      }
                    </div>

                    {/* Name + Team + Bar */}
                    <div style={{flex:1,minWidth:0}}>
                      <div
                        className="player-info-name"
                        style={{fontFamily:'var(--f-display)',fontWeight:700,fontSize:15,color:'var(--tx1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}
                      >
                        {f.futbolchi_ism}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
                        <span style={{width:7,height:7,borderRadius:'50%',background:rang,display:'inline-block',flexShrink:0}}/>
                        <span style={{fontFamily:'var(--f-body)',fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.jamoa_ism}</span>
                      </div>
                      <div className="player-bar" style={{height:3,background:'rgba(255,255,255,.05)',borderRadius:2,overflow:'hidden',marginTop:7,maxWidth:240}}>
                        <div style={{height:'100%',width:`${barW}%`,background:`linear-gradient(90deg,${rang},${rang}88)`,borderRadius:2,transition:'width .8s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 6px ${rang}66`}}/>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="player-card-stats" style={{display:'flex',alignItems:'center',gap:0,flexShrink:0}}>
                    <div className="player-stat-item" style={{textAlign:'center',padding:'0 14px',borderRight:'1px solid var(--border)'}}>
                      <div className="player-stat-num" style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:20,lineHeight:1,color:'var(--tx1)'}}>{f.gollar}</div>
                      <div style={{fontFamily:'var(--f-display)',fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--tx3)',marginTop:3}}>Gol</div>
                    </div>
                    <div className="player-stat-item" style={{textAlign:'center',padding:'0 14px',borderRight:'1px solid var(--border)'}}>
                      <div className="player-stat-num" style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:20,lineHeight:1,color:'var(--tx2)'}}>{f.assistlar}</div>
                      <div style={{fontFamily:'var(--f-display)',fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--tx3)',marginTop:3}}>Assist</div>
                    </div>
                    <div className="player-stat-item" style={{textAlign:'center',padding:'0 14px'}}>
                      <div className="player-stat-num" style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:20,lineHeight:1,color:'#f59e0b'}}>{f.ball}</div>
                      <div style={{fontFamily:'var(--f-display)',fontSize:9,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--tx3)',marginTop:3}}>Ball</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop:40,padding:'18px 24px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontFamily:'var(--f-display)',fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--tx3)',display:'flex',alignItems:'center',gap:6}}>
            <IconZap size={13}/> Ball hisoblash tizimi
          </span>
          {[['Gol','3 ball'],['Assist','1 ball']].map(([nom,qiymat])=>(
            <div key={nom} style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontFamily:'var(--f-body)',fontSize:13,color:'var(--tx2)'}}>{nom==='Gol'?<span style={{display:'flex',alignItems:'center',gap:5}}><IconGoalMini/>Gol</span>:<span style={{display:'flex',alignItems:'center',gap:5}}><IconAssistMini/>Assist</span>}</span>
              <span className="badge badge-gold" style={{fontSize:10}}>{qiymat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconGoalMini(){
  return(
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1" stroke="#4ade80" strokeWidth="1.3"/>
      <path d="M1 6h14M1 9.5h14M5 3v10M8 3v10M11 3v10" stroke="#4ade80" strokeWidth=".7" opacity=".4"/>
      <path d="M5.5 8l1.5 1.5L11 6" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconAssistMini(){
  return(
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="#a78bfa" strokeWidth="1.3" strokeDasharray="3 2"/>
      <circle cx="8" cy="8" r="3.5" stroke="#a78bfa" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="1.2" fill="#a78bfa"/>
    </svg>
  );
}