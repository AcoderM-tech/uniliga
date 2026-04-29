import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOyin } from '../lib/api';
import TacticalBoard from '../components/TacticalBoard';
import { makeWsUrl } from '../lib/ws';
import { getMatchClock, isMatchClockRunning } from '../lib/matchClock';
import {
  IconArrowLeft, IconCalendar, IconPin, IconClock,
  IconGoal, IconYellowCard, IconRedCard, IconSub, IconAssist,
  IconZap, IconUsers, IconLiveDot,
} from '../components/Icons';

const EVENT_META = {
  goal:     { Icon: IconGoal,       label:'Gol',           color:'#4ade80' },
  penalty:  { Icon: IconGoal,       label:'Penalti',       color:'#4ade80' },
  own_goal: { Icon: ()=><IconGoal color="#ef4444"/>, label:"O'z goli", color:'#ef4444' },
  yellow:   { Icon: IconYellowCard, label:'Sariq karta',   color:'#f59e0b' },
  red:      { Icon: IconRedCard,    label:'Qizil karta',   color:'#ef4444' },
  sub:      { Icon: IconSub,        label:'Almashtirish',  color:'#60a5fa' },
  assist:   { Icon: IconAssist,     label:'Assist',        color:'#a78bfa' },
};

const PHASE_DISPLAY = {
  not_started:{ badge:'KUTILMOQDA', color:'var(--tx3)',  dot:false },
  first_half: { badge:'JONLI',      color:'#22c55e',     dot:true  },
  half_time:  { badge:'TANAFFUS',   color:'#f59e0b',     dot:false },
  second_half:{ badge:'2-YARIM',    color:'#22c55e',     dot:true  },
  extra_time: { badge:"QO'SH.VAQT",color:'#f97316',     dot:true  },
  finished:   { badge:'YAKUNLANDI', color:'var(--tx3)',  dot:false },
};

function fmt(m, e){ return e>0?`${m}+${e}'`:`${m}'`; }
function fmtClock(m, e, s){
  const ss = String(Math.max(0, Number(s || 0))).padStart(2, '0');
  return e>0?`${m}+${e}:${ss}`:`${m}:${ss}`;
}

export default function OyinTafsiloti() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [newEvents, setNewEvents] = useState([]);
  const [nowMs, setNowMs] = useState(Date.now());
  const eventsEndRef = useRef(null);

  useEffect(()=>{
    getOyin(id).then(d=>{setMatch(d);setLoading(false);}).catch(()=>setLoading(false));
  },[id]);

  useEffect(()=>{
    if(!match?.id)return;
    const isLive=['live','first_half','second_half','extra_time','half_time'].includes(match.status)||
                  ['first_half','second_half','extra_time','half_time'].includes(match.phase);
    if(!isLive)return;
    const ws=new WebSocket(makeWsUrl(`/ws/oyin/${match.id}/`));
    ws.onmessage=(ev)=>{
      try{
        const msg=JSON.parse(ev.data);
        if(msg.type==='match_update'){
          setMatch(prev=>{
            const prevIds=new Set((prev?.events||[]).map(e=>e.id));
            const fresh=(msg.data.events||[]).filter(e=>!prevIds.has(e.id));
            if(fresh.length)setNewEvents(ids=>[...new Set([...ids,...fresh.map(e=>e.id)])]);
            return msg.data;
          });
          eventsEndRef.current?.scrollIntoView({behavior:'smooth'});
        }
      }catch{}
    };
    return()=>ws.close();
  },[match?.id,match?.status]);

  useEffect(() => {
    if (!isMatchClockRunning(match)) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [
    match?.phase,
    match?.phase_started_at,
    match?.first_half_duration,
    match?.first_half_extra,
    match?.second_half_duration,
    match?.second_half_extra,
  ]);

  if(loading)return(
    <div className="match-detail"><div className="container">
      <div className="loading-center" style={{minHeight:'60vh'}}><div className="spinner"/><span>Yuklanmoqda...</span></div>
    </div></div>
  );
  if(!match)return(
    <div className="match-detail"><div className="container">
      <div className="empty-state" style={{minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{marginBottom:16}}><IconGoal size={48}/></div>
        <div className="empty-state-text">O'yin topilmadi</div>
      </div>
    </div></div>
  );

  const phase      = match.phase||'not_started';
  const phaseInfo  = PHASE_DISPLAY[phase]||PHASE_DISPLAY.not_started;
  const isLive     = ['first_half','second_half','extra_time'].includes(phase);
  const isFinished = phase==='finished';
  const isUpcoming = phase==='not_started';
  const clock = getMatchClock(match, nowMs);
  const displayMin   = clock.minute;
  const displayExtra = clock.extra;
  const displaySec   = clock.second;
  const totalDur   = (match.first_half_duration??45)+(match.second_half_duration??45);
  const htPct      = ((match.first_half_duration??45)/totalDur)*100;
  const pct        = isFinished?100:isUpcoming?0:Math.min((displayMin/totalDur)*100,100);
  const homeColor  = match.home_team_color||'#2979ff';
  const awayColor  = match.away_team_color||'#cc1a2e';
  const homeGoals  = (match.events||[]).filter(e=>['goal','penalty'].includes(e.event_type)&&e.team_name===match.home_team_name);
  const awayGoals  = (match.events||[]).filter(e=>['goal','penalty'].includes(e.event_type)&&e.team_name===match.away_team_name);
  const totalGols  = (match.home_score??0)+(match.away_score??0)||1;

  return (
    <div className="match-detail">
      <div className="container">

        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{marginBottom:24}} onClick={()=>navigate(-1)}>
          <IconArrowLeft size={15}/> Orqaga
        </button>

        {/* ══ MAIN CARD ══ */}
        <div style={{background:'var(--bg3)',border:`1px solid ${isLive?'rgba(239,68,68,.3)':'var(--border)'}`,borderRadius:'var(--r-lg)',overflow:'hidden',marginBottom:20,boxShadow:isLive?'0 0 0 1px rgba(239,68,68,.1),0 16px 48px rgba(239,68,68,.06)':'none'}}>

          {/* Meta bar */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',borderBottom:'1px solid var(--border)',background:'rgba(0,0,0,.15)',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',gap:14,alignItems:'center',fontFamily:'var(--f-display)',fontSize:11,color:'var(--tx3)',flexWrap:'wrap'}}>
              <span style={{color:'var(--red)',fontWeight:700}}>UNILIGA</span>
              <span>· {match.week}-HAFTA</span>
              <span className="hide-mobile" style={{display:'flex',alignItems:'center',gap:4}}><IconPin size={11}/>{match.stadium}</span>
              <span className="hide-mobile" style={{display:'flex',alignItems:'center',gap:4}}><IconCalendar size={11}/>{match.match_date}</span>
              <span style={{display:'flex',alignItems:'center',gap:4}}><IconClock size={11}/>{match.match_time?.slice(0,5)}</span>
            </div>
            <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 14px',borderRadius:20,background:isLive?'rgba(239,68,68,.15)':isFinished?'rgba(255,255,255,.05)':'rgba(245,158,11,.1)',border:`1px solid ${isLive?'rgba(239,68,68,.35)':isFinished?'var(--border)':'rgba(245,158,11,.25)'}`,fontFamily:'var(--f-display)',fontSize:10,fontWeight:800,letterSpacing:'.12em',color:isLive?'#ef4444':isFinished?'var(--tx3)':'#f59e0b'}}>
              {isLive&&<IconLiveDot size={8} color="#ef4444"/>}
              {phaseInfo.badge}
              {isLive&&<span style={{fontFamily:'var(--f-mono)'}}> {fmtClock(displayMin,displayExtra,displaySec)}</span>}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="scoreboard-main" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'40px 48px',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(204,26,46,.04),transparent)',pointerEvents:'none'}}/>

            {/* Home */}
            <div className="team-side" style={{textAlign:'center',flex:1}}>
              <div className="team-logo" style={{width:100,height:100,borderRadius:'50%',background:`${homeColor}18`,border:`2px solid ${homeColor}33`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',overflow:'hidden'}}>
                {match.home_team_logo
                  ?<img src={match.home_team_logo} alt="" style={{width:72,height:72,objectFit:'contain'}}/>
                  :<span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:44,color:homeColor}}>{match.home_team_short?.[0]}</span>
                }
              </div>
              <div className="team-name" style={{fontFamily:'var(--f-display)',fontWeight:700,fontSize:18,color:'var(--tx1)'}}>{match.home_team_name}</div>
              <div className="team-short" style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--tx3)',marginTop:3}}>{match.home_team_short}</div>
              {homeGoals.length>0&&(
                <div className="goals-list" style={{marginTop:12,fontSize:11,color:'var(--tx3)',fontFamily:'var(--f-mono)',lineHeight:1.9}}>
                  {homeGoals.map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                      <IconGoal size={12}/>{e.player_name}<span style={{color:'#f59e0b'}}>{fmt(e.minute,e.extra_minute)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score */}
            <div className="score-box" style={{textAlign:'center',padding:'0 32px',position:'relative',zIndex:1}}>
              {isUpcoming?(
                <div className="upcoming-time" style={{fontFamily:'var(--f-display)',fontSize:36,fontWeight:700,color:'#f59e0b',letterSpacing:4}}>{match.match_time?.slice(0,5)}</div>
              ):(
                <div className="score-numbers" style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:72,letterSpacing:'-.04em',lineHeight:1,color:homeColor}}>{match.home_score}</span>
                  <span className="sep" style={{fontFamily:'var(--f-display)',fontWeight:300,fontSize:48,color:'var(--tx4)',lineHeight:1}}>:</span>
                  <span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:72,letterSpacing:'-.04em',lineHeight:1,color:awayColor}}>{match.away_score}</span>
                </div>
              )}
              <div style={{marginTop:10,fontFamily:'var(--f-display)',fontSize:11,fontWeight:700,letterSpacing:'.12em',color:phaseInfo.color}}>
                {phase==='half_time'?'TANAFFUS':isFinished?'YAKUNLANDI':isUpcoming?match.match_date:fmtClock(displayMin,displayExtra,displaySec)}
              </div>
            </div>

            {/* Away */}
            <div className="team-side" style={{textAlign:'center',flex:1}}>
              <div className="team-logo" style={{width:100,height:100,borderRadius:'50%',background:`${awayColor}18`,border:`2px solid ${awayColor}33`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',overflow:'hidden'}}>
                {match.away_team_logo
                  ?<img src={match.away_team_logo} alt="" style={{width:72,height:72,objectFit:'contain'}}/>
                  :<span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:44,color:awayColor}}>{match.away_team_short?.[0]}</span>
                }
              </div>
              <div className="team-name" style={{fontFamily:'var(--f-display)',fontWeight:700,fontSize:18,color:'var(--tx1)'}}>{match.away_team_name}</div>
              <div className="team-short" style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--tx3)',marginTop:3}}>{match.away_team_short}</div>
              {awayGoals.length>0&&(
                <div className="goals-list" style={{marginTop:12,fontSize:11,color:'var(--tx3)',fontFamily:'var(--f-mono)',lineHeight:1.9}}>
                  {awayGoals.map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
                      <IconGoal size={12}/>{e.player_name}<span style={{color:'#f59e0b'}}>{fmt(e.minute,e.extra_minute)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!isUpcoming&&(
            <div style={{padding:'0 32px 24px'}}>
              <div style={{height:4,background:'rgba(255,255,255,.07)',borderRadius:2,position:'relative',overflow:'visible'}}>
                <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${homeColor},${awayColor})`,borderRadius:2,transition:'width 1.5s ease',boxShadow:isLive?`0 0 8px ${homeColor}66`:'none'}}/>
                {(match.events||[]).filter(e=>['goal','penalty'].includes(e.event_type)).map((e,i)=>{
                  const mp=Math.min((e.minute/totalDur)*100,100);
                  const isH=e.team_name===match.home_team_name;
                  return <div key={i} style={{position:'absolute',left:`${mp}%`,top:'50%',transform:'translate(-50%,-50%)',width:10,height:10,borderRadius:'50%',background:isH?homeColor:awayColor,border:'2px solid rgba(255,255,255,.35)',boxShadow:`0 0 6px ${isH?homeColor:awayColor}`,zIndex:2}}/>;
                })}
                <div style={{position:'absolute',left:`${htPct}%`,top:'50%',transform:'translate(-50%,-50%)',width:2,height:12,background:'rgba(255,255,255,.2)',borderRadius:1}}/>
                {isLive&&<div style={{position:'absolute',left:`${pct}%`,top:'50%',transform:'translate(-50%,-50%)',width:12,height:12,borderRadius:'50%',background:'#ef4444',border:'2.5px solid #fff',boxShadow:'0 0 12px #ef4444,0 0 24px rgba(239,68,68,.4)',zIndex:3,animation:'icon-blink 1.2s infinite'}}/>}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontFamily:'var(--f-mono)',fontSize:10,color:'var(--tx4)'}}>
                <span>{match.first_half_duration??45}'</span><span>HT</span><span>{totalDur}'</span>
              </div>
            </div>
          )}
        </div>

        {/* ══ TIMELINE ══ */}
        {match.events?.length>0&&(
          <div className="timeline-wrap" style={{marginBottom:16}}>
            <div className="timeline-heading">
              <IconZap size={14} color="var(--red)"/> O'yin vaqti jadvali
              <span style={{marginLeft:'auto',fontFamily:'var(--f-mono)',fontSize:10,color:'var(--tx3)'}}>{match.events.length} hodisa</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',marginBottom:12,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
              <span style={{fontFamily:'var(--f-display)',fontSize:11,fontWeight:700,color:homeColor}}>{match.home_team_name}</span>
              <span/>
              <span style={{fontFamily:'var(--f-display)',fontSize:11,fontWeight:700,color:awayColor,textAlign:'right'}}>{match.away_team_name}</span>
            </div>
            <div className="timeline-items">
              {match.events.map(ev=>{
                const isHome=ev.team_name===match.home_team_name;
                const meta=EVENT_META[ev.event_type]||EVENT_META.goal;
                const isNew=newEvents.includes(ev.id);
                const isGoal=['goal','penalty','own_goal'].includes(ev.event_type);
                const sideColor=isHome?homeColor:awayColor;
                const minStr=ev.extra_minute>0?`${ev.minute}+${ev.extra_minute}'`:`${ev.minute}'`;
                const EventIcon=meta.Icon;
                return(
                  <div key={ev.id} className="tl-item" style={{animation:isNew?'slideIn .4s ease':'none',marginBottom:8}}>
                    <div className="tl-home">
                      {isHome&&(
                        <div style={{display:'inline-flex',alignItems:'center',gap:10,background:isGoal?`${sideColor}14`:'rgba(255,255,255,.03)',border:`1px solid ${isGoal?sideColor+'30':'var(--border)'}`,borderRadius:10,padding:isGoal?'8px 14px':'6px 12px',float:'right'}}>
                          <div style={{textAlign:'right'}}>
                            <div className="tl-player-name">{ev.player_name}</div>
                            {ev.assist_player&&<div style={{fontSize:11,color:'#a78bfa',marginTop:1,display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}><IconAssist size={10}/>{ev.assist_player}</div>}
                            {ev.player_out&&<div style={{fontSize:11,color:'var(--tx4)',marginTop:1}}>→ {ev.player_out}</div>}
                          </div>
                          <EventIcon size={16}/>
                        </div>
                      )}
                    </div>
                    <div className="tl-mid">
                      <span style={{fontFamily:'var(--f-mono)',fontSize:11,fontWeight:700,color:isGoal?'#f59e0b':'var(--tx3)',background:isGoal?'rgba(245,158,11,.08)':'transparent',padding:'2px 8px',borderRadius:10}}>{minStr}</span>
                      <div className="tl-icon-bubble"><EventIcon size={13}/></div>
                    </div>
                    <div className="tl-away">
                      {!isHome&&(
                        <div style={{display:'inline-flex',alignItems:'center',gap:10,background:isGoal?`${sideColor}14`:'rgba(255,255,255,.03)',border:`1px solid ${isGoal?sideColor+'30':'var(--border)'}`,borderRadius:10,padding:isGoal?'8px 14px':'6px 12px'}}>
                          <EventIcon size={16}/>
                          <div>
                            <div className="tl-player-name">{ev.player_name}</div>
                            {ev.assist_player&&<div style={{fontSize:11,color:'#a78bfa',marginTop:1,display:'flex',alignItems:'center',gap:4}}><IconAssist size={10}/>{ev.assist_player}</div>}
                            {ev.player_out&&<div style={{fontSize:11,color:'var(--tx4)',marginTop:1}}>→ {ev.player_out}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={eventsEndRef}/>
          </div>
        )}

        {/* ══ STATS ══ */}
        {!isUpcoming&&(
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px 24px',marginBottom:20}}>
            <div style={{fontFamily:'var(--f-display)',fontWeight:700,fontSize:11,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--tx3)',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              <IconZap size={13} color="var(--red)"/> O'YIN STATISTIKASI
            </div>
            {[
              {label:'Gollar',   home:match.home_score??0, away:match.away_score??0},
              {label:'Burchak topi',home:homeGoals.length,   away:awayGoals.length},
            ].map((stat,i)=>{
              const tot=stat.home+stat.away||1;
              return(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:16,marginBottom:i===0?16:0}}>
                  <div style={{textAlign:'right'}}>
                    <span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:22,color:stat.home>=stat.away?homeColor:'var(--tx3)'}}>{stat.home}</span>
                    <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:3,marginTop:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(stat.home/tot)*100}%`,background:homeColor,borderRadius:3,marginLeft:'auto',transition:'width .8s ease'}}/>
                    </div>
                  </div>
                  <div style={{fontFamily:'var(--f-display)',fontSize:10,fontWeight:700,letterSpacing:'.1em',color:'var(--tx3)',textTransform:'uppercase',textAlign:'center',width:90}}>{stat.label}</div>
                  <div>
                    <span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:22,color:stat.away>=stat.home?awayColor:'var(--tx3)'}}>{stat.away}</span>
                    <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:3,marginTop:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(stat.away/tot)*100}%`,background:awayColor,borderRadius:3,transition:'width .8s ease'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {match.posts?.length>0&&(
          <div style={{marginTop:24}}>
            <div style={{fontFamily:'var(--f-display)',fontSize:10,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--tx3)',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
              <IconUsers size={13}/> Bu o'yin haqida materiallar
            </div>
            <div className="posts-grid">
              {match.posts.map(p=>(
                <div key={p.id} className="post-card" onClick={()=>navigate(`/yangiliklar/${p.id}`)}>
                  {p.cover_image_url&&<div className="post-image"><img src={p.cover_image_url} alt={p.title} loading="lazy"/></div>}
                  <div className="post-body"><h3 className="post-title">{p.title}</h3><p className="post-excerpt">{p.excerpt}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}} 
        @keyframes icon-blink{0%,100%{opacity:1}50%{opacity:.15}}

        @media (max-width: 768px) {
          .scoreboard-main { padding: 30px 16px !important; gap: 8px; }
          .team-logo { width: 60px !important; height: 60px !important; margin-bottom: 8px !important; }
          .team-logo img { width: 44px !important; height: 44px !important; }
          .team-logo span { font-size: 26px !important; }
          .team-name { font-size: 13px !important; }
          .team-short { font-size: 9px !important; }
          .score-box { padding: 0 10px !important; }
          .score-numbers { gap: 6px !important; }
          .score-numbers span:nth-child(odd) { font-size: 40px !important; }
          .score-numbers span.sep { font-size: 28px !important; }
          .upcoming-time { font-size: 24px !important; }
          .goals-list { font-size: 9px !important; line-height: 1.6 !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}