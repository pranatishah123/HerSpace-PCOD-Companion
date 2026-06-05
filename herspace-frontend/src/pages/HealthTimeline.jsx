import React, { useState, useEffect, useRef } from "react";
import { apiUrl } from "../config/api";
import timelineBg from "../assets/timeline-bg.jpg";
import healthyZoneImg from "../assets/zones/Build Consistency.jpeg";
import mildZoneImg from "../assets/zones/maintain & optimize.jpeg";
import moderateZoneImg from "../assets/zones/stabilize & recover.jpeg";
import highZoneImg from "../assets/zones/Support Sensitivity.jpeg";

const TYPE_CONFIG = {
  zone:          { label:"Zone Assessment",  icon:"🎯", accent:"#6a9a52", category:"WELLNESS ZONE"   },
  miniCheckin:   { label:"Weekly Check-in",  icon:"📋", accent:"#8aad6e", category:"WEEKLY CHECK-IN" },
  riskEvent:     { label:"Risk Alert",       icon:"⚠️", accent:"#c45e8a", category:"RISK ALERT"      },
  actionPlan:    { label:"Action Plan",      icon:"💡", accent:"#5b8fa8", category:"ACTION PLAN"     },
  period:        { label:"Cycle Log",        icon:"🌙", accent:"#c45e8a", category:"CYCLE LOG"       },
  periodCheckin: { label:"Period Check-in",  icon:"📝", accent:"#b565a7", category:"CYCLE CHECK-IN"  },
  skin:          { label:"Skin Analysis",    icon:"✨", accent:"#b8912a", category:"SKIN JOURNAL"    },
};

const ZONE_COLOR = { healthy:"#5b9e8a", mild:"#4a7fc1", moderate:"#b565a7", high:"#c45e8a" };
const ZONE_VISUAL = {
  healthy:  { label:"Stabilize & Recover", image:healthyZoneImg },
  mild:     { label:"Support Sensitivity", image:mildZoneImg },
  moderate: { label:"Build Consistency", image:moderateZoneImg },
  high:     { label:"Maintain & Optimize", image:highZoneImg },
};

const FILTERS = [
  { key:"all",    label:"All Events", icon:"🌿" },
  { key:"zone",   label:"Zone",       icon:"🎯" },
  { key:"period", label:"Cycle",      icon:"🌙" },
  { key:"skin",   label:"Skin",       icon:"✨" },
  { key:"plan",   label:"Plans",      icon:"💡" },
];

function fDate(d)  { if(!d)return"—"; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}); }
function fShort(d) { if(!d)return"—"; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }
function fTime(d)  { if(!d)return"";  return new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); }
function fMonth(d) { if(!d)return"";  return new Date(d).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); }

function groupByMonth(events) {
  const g={};
  events.forEach(ev=>{const k=fMonth(ev.date);if(!g[k])g[k]=[];g[k].push(ev);});
  return g;
}
function matchesFilter(ev,f) {
  if(f==="all")    return true;
  if(f==="zone")   return ["zone","miniCheckin","riskEvent"].includes(ev.type);
  if(f==="period") return ["period","periodCheckin"].includes(ev.type);
  if(f==="skin")   return ev.type==="skin";
  if(f==="plan")   return ev.type==="actionPlan";
  return true;
}

// ── Insight generator ─────────────────────────────────────────────────────────
function buildInsights(events) {
  if(!events||!events.length) return [];
  const ins=[];
  const zones    = events.filter(e=>e.type==="zone");
  const skins    = events.filter(e=>e.type==="skin");
  const periods  = events.filter(e=>["period","periodCheckin"].includes(e.type));
  const plans    = events.filter(e=>e.type==="actionPlan");
  const checkins = events.filter(e=>e.type==="miniCheckin");

  if(skins.length>0&&periods.length>0){
    const close=skins.some(s=>periods.some(p=>Math.abs(new Date(s.date)-new Date(p.date))<15*864e5));
    if(close) ins.push({icon:"🌙",front:"Skin × Cycle Link",back:"Your skin changes and cycle entries appeared close together — hormones may be influencing your skin more than you realise.",tag:"Pattern Observed",accent:"#c45e8a"});
  }
  if(zones.length>=2){
    const zz=zones.map(e=>e.zone||"mild");
    const unique=[...new Set(zz)];
    if(unique.length===1){
      const lbl={healthy:"Healthy",mild:"Mild Risk",moderate:"Moderate Risk",high:"High Risk"}[unique[0]]||unique[0];
      ins.push({icon:"🌿",front:"Zone Stability",back:`All recent assessments landed in the ${lbl} zone. Consistency is a powerful hormonal signal.`,tag:"Zone Trend",accent:"#5b9e8a"});
    } else {
      const imp=["high","moderate","mild","healthy"].indexOf(zz[zz.length-1])>["high","moderate","mild","healthy"].indexOf(zz[0]);
      ins.push({icon:imp?"📈":"🌀",front:imp?"Positive Shift":"Attention Point",back:imp?"Your zone has improved across assessments — your daily habits are showing up in your wellness score.":"Your zone has shifted. Small adjustments to sleep and diet can restore balance.",tag:imp?"Zone Progress":"Zone Shift",accent:imp?"#5b9e8a":"#b565a7"});
    }
  }
  if(plans.length>=1&&checkins.length>=1) ins.push({icon:"💛",front:"Habit Loop Active",back:"Plans + weekly check-ins together — that's one of the strongest habit combinations for lasting hormonal balance.",tag:"Consistency",accent:"#b8912a"});
  if(skins.length>=3) ins.push({icon:"✨",front:"Skin Pattern Building",back:`${skins.length} skin entries logged — enough to start seeing cycle-phase patterns. Keep tracking to unlock more.`,tag:"Skin History",accent:"#b8912a"});
  if(periods.length>=2){
    const reg=periods.some(e=>(e.detail?.regularity||"").toLowerCase().includes("regular"));
    ins.push({icon:reg?"🌸":"🌊",front:reg?"Cycle Consistency":"Cycle Awareness",back:reg?"Recent logs show signs of regularity — a meaningful signal worth celebrating.":"Each cycle log gives your health story more depth and clarity.",tag:"Cycle Tracking",accent:"#c45e8a"});
  }
  if(ins.length<2) ins.push({icon:"🌱",front:"Your Story is Growing",back:"Every entry teaches your journal more about you. Keep logging to unlock deeper pattern insights.",tag:"Keep Tracking",accent:"#8aad6e"});
  return ins.slice(0,3);
}

// ── FIXED Insight Flip Card ───────────────────────────────────────────────────
// Fix: perspective on the direct flip-container parent, no bg/border on outer wrapper
function InsightFlipCard({ card, delay }) {
  const [flipped, setFlipped] = useState(false);

  return (
    // Outer: only sets height + perspective + animation — NO bg/border/overflow that fights the flip
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        height:"220px",
        perspective:"1100px",
        cursor:"pointer",
        animation:`fu .55s cubic-bezier(.22,1,.36,1) ${delay}s both`,
      }}
    >
      {/* Inner: the actual 3d flipper */}
      <div style={{
        position:"relative",
        width:"100%",
        height:"100%",
        transformStyle:"preserve-3d",
        transition:"transform 0.65s cubic-bezier(0.4,0.2,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>

        {/* ── FRONT FACE ── */}
        <div style={{
          position:"absolute", inset:0,
          backfaceVisibility:"hidden",
          WebkitBackfaceVisibility:"hidden",
          borderRadius:"22px",
          background:`linear-gradient(145deg,${card.accent}1a,${card.accent}0a)`,
          border:`1.5px solid ${card.accent}35`,
          boxShadow:`0 6px 28px ${card.accent}14`,
          padding:"26px",
          display:"flex",
          flexDirection:"column",
          justifyContent:"space-between",
          overflow:"hidden",
        }}>
          {/* shine overlay */}
          <div style={{position:"absolute",inset:0,borderRadius:"22px",background:"linear-gradient(135deg,rgba(255,255,255,0.38) 0%,transparent 55%,rgba(255,255,255,0.10) 100%)",pointerEvents:"none"}}/>

          <div>
            <div style={{fontSize:"32px",marginBottom:"10px",filter:`drop-shadow(0 3px 6px ${card.accent}55)`}}>{card.icon}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#1a2a08",lineHeight:1.25,letterSpacing:"-0.3px"}}>{card.front}</div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:"9px",fontWeight:"900",color:card.accent,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif"}}>{card.tag.toUpperCase()}</span>
            <span style={{fontSize:"10px",color:card.accent,fontWeight:"700",fontFamily:"'DM Sans',sans-serif",opacity:0.7}}>flip for insight →</span>
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div style={{
          position:"absolute", inset:0,
          backfaceVisibility:"hidden",
          WebkitBackfaceVisibility:"hidden",
          transform:"rotateY(180deg)",
          borderRadius:"22px",
          background:`linear-gradient(145deg,${card.accent}ee,${card.accent}bb)`,
          border:`1.5px solid ${card.accent}66`,
          boxShadow:`0 8px 36px ${card.accent}44`,
          padding:"26px",
          display:"flex",
          flexDirection:"column",
          justifyContent:"space-between",
          overflow:"hidden",
        }}>
          <div style={{position:"absolute",inset:0,borderRadius:"22px",background:"linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 60%)",pointerEvents:"none"}}/>

          <div style={{position:"relative"}}>
            <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(255,255,255,0.72)",letterSpacing:"2.5px",fontFamily:"'Nunito',sans-serif",marginBottom:"10px"}}>{card.tag.toUpperCase()}</div>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,0.96)",lineHeight:1.75,margin:0,fontWeight:"500",fontFamily:"'DM Sans',sans-serif"}}>{card.back}</p>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:"7px",position:"relative"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"rgba(255,255,255,0.85)",flexShrink:0}}/>
            <span style={{fontSize:"10px",fontWeight:"800",color:"rgba(255,255,255,0.8)",fontFamily:"'Nunito',sans-serif",letterSpacing:"1px"}}>CLICK TO FLIP BACK</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({label,color}){
  return <span style={{display:"inline-block",fontSize:"10.5px",fontWeight:"800",color,background:`${color}18`,border:`1px solid ${color}38`,borderRadius:"20px",padding:"3px 10px",fontFamily:"'Nunito',sans-serif"}}>{label}</span>;
}

// ── Detail expanded ───────────────────────────────────────────────────────────
function Detail({event}){
  const d=event.detail||{};
  const cfg=TYPE_CONFIG[event.type]||TYPE_CONFIG.zone;
  const ac=event.type==="zone"&&event.zone?ZONE_COLOR[event.zone]:cfg.accent;
  if(event.type==="zone")return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}><Chip label={`Score ${d.score??0}/120`} color={ac}/><Chip label={`${d.confidence??0}% confidence`} color="#6a8a4a"/></div>
      {d.symptoms?.length>0&&<div><p style={{fontSize:"10px",fontWeight:"900",color:ac,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",margin:"0 0 6px"}}>DETECTED SYMPTOMS</p><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{d.symptoms.map(s=><Chip key={s} label={s.replace(/([A-Z])/g," $1").trim()} color={ac}/>)}</div></div>}
    </div>
  );
  if(event.type==="miniCheckin")return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
      {[{k:"Energy",v:d.energy},{k:"Symptoms",v:d.symptoms},{k:"Skin",v:d.skin},{k:"Stress",v:d.stress},{k:"Overall",v:d.overall}].filter(i=>i.v).map(item=>(
        <div key={item.k} style={{background:"rgba(255,255,255,0.6)",borderRadius:"10px",padding:"8px 12px"}}>
          <p style={{fontSize:"9px",fontWeight:"900",color:cfg.accent,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",margin:0}}>{item.k.toUpperCase()}</p>
          <p style={{fontSize:"14px",fontWeight:"800",color:"#2d3d1a",margin:"2px 0 0",fontFamily:"'Nunito',sans-serif"}}>{item.v}</p>
        </div>
      ))}
    </div>
  );
  if(event.type==="actionPlan")return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {(d.insight||d.comparisonInsight)&&<p style={{fontSize:"13px",fontStyle:"italic",color:"#4a6e2a",margin:0,lineHeight:1.7,borderLeft:`3px solid ${cfg.accent}`,paddingLeft:"12px"}}>"{d.insight||d.comparisonInsight}"</p>}
      {[{l:"🥗 Diet",v:d.diet},{l:"🏃 Movement",v:d.movement},{l:"🧘 Self-Care",v:d.selfCare}].map(b=>b.v?.length>0&&<div key={b.l}><p style={{fontSize:"10px",fontWeight:"900",color:cfg.accent,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",margin:"0 0 4px"}}>{b.l}</p><p style={{fontSize:"12.5px",color:"#3d5020",lineHeight:1.65,margin:0}}>{b.v.slice(0,2).join("  ·  ")}</p></div>)}
    </div>
  );
  if(event.type==="period"||event.type==="periodCheckin")return(
    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {d.lastPeriod&&<Chip label={`Last: ${fShort(d.lastPeriod)}`} color={cfg.accent}/>}
        {d.regularity&&<Chip label={d.regularity} color="#b565a7"/>}
        {d.flow&&<Chip label={`${d.flow} flow`} color={cfg.accent}/>}
        {d.pain&&d.pain!=="None"&&<Chip label={`Pain: ${d.pain}`} color="#888"/>}
      </div>
      {d.conditions?.length>0&&<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{d.conditions.map(c=><Chip key={c} label={c} color="#b565a7"/>)}</div>}
    </div>
  );
  if(event.type==="skin")return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {d.condition&&<Chip label={d.condition} color={cfg.accent}/>}
        {d.severity&&<Chip label={`${d.severity} severity`} color={{Low:"#5b9e8a",Moderate:"#d4a843",High:"#c45e8a"}[d.severity]||"#888"}/>}
        {d.hormonalLink&&<Chip label="Hormonal link 🔗" color="#b565a7"/>}
        {d.cyclePhase&&<Chip label={d.cyclePhase} color="#8aad6e"/>}
      </div>
      {d.aiNote&&<p style={{fontSize:"12.5px",color:"#5a6a40",lineHeight:1.7,margin:0,fontStyle:"italic",borderLeft:`3px solid ${cfg.accent}`,paddingLeft:"12px"}}>{d.aiNote.slice(0,150)}{d.aiNote.length>150?"…":""}</p>}
      {d.careTips?.length>0&&<p style={{fontSize:"12px",color:"#4a6e2a",lineHeight:1.65,margin:0}}>💊 {d.careTips.slice(0,2).join("  ·  ")}</p>}
    </div>
  );
  if(event.type==="riskEvent")return(
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      <Chip label={`Level: ${d.level}`} color={d.level==="high"?"#c45e8a":"#5b9e8a"}/>
      {d.summary&&<p style={{fontSize:"12.5px",color:"#5a4040",margin:0,lineHeight:1.65}}>{d.summary}</p>}
    </div>
  );
  return null;
}

// ── Magazine Card ─────────────────────────────────────────────────────────────
function MagCard({event,num,wide,isExpanded,onToggle}){
  const [hov,setHov]=useState(false);
  const cfg=TYPE_CONFIG[event.type]||TYPE_CONFIG.zone;
  const hasDetail=event.detail&&Object.keys(event.detail).length>0;
  const ac=event.type==="zone"&&event.zone?ZONE_COLOR[event.zone]:cfg.accent;
  const D=new Date(event.date);
  const dd=D.getDate();
  const mm=D.toLocaleString("en-IN",{month:"short"}).toUpperCase();
  const yy=D.getFullYear();
  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={()=>hasDetail&&onToggle()}
      style={{
        gridColumn:wide?"span 2":"span 1",
        display:"flex",
        flexDirection:wide?"row":"column",
        borderRadius:"22px",
        overflow:"hidden",
        border:`1.5px solid ${hov||isExpanded?ac+"65":ac+"2a"}`,
        background:hov||isExpanded?"rgba(255,253,248,0.98)":"rgba(250,248,240,0.94)",
        backdropFilter:"blur(22px)",
        boxShadow:hov
          ?`0 22px 60px ${ac}28,0 0 0 1.5px ${ac}1a,inset 0 1px 0 rgba(255,255,255,0.9)`
          :isExpanded?`0 16px 48px ${ac}1e`:`0 3px 22px rgba(74,110,42,0.08)`,
        cursor:hasDetail?"pointer":"default",
        transition:"all 0.28s cubic-bezier(0.22,1,0.36,1)",
        transform:hov?"translateY(-5px)":"translateY(0)",
        minHeight:wide?"200px":"auto",
      }}
    >
      {/* SPINE */}
      <div style={{
        width:wide?"108px":"auto", minWidth:wide?"108px":"auto",
        padding:wide?"26px 0 26px":"16px 22px",
        display:"flex", flexDirection:wide?"column":"row",
        alignItems:"center", justifyContent:wide?"flex-start":"space-between",
        gap:"10px",
        background:`linear-gradient(${wide?"180deg":"90deg"},${ac}${hov?"2e":"1a"},${ac}08)`,
        borderRight:wide?`2px dashed ${ac}${hov?"50":"28"}`:  "none",
        borderBottom:!wide?`2px dashed ${ac}${hov?"40":"22"}`:"none",
        flexShrink:0,
        transition:"background 0.28s ease",
      }}>
        <div style={{
          width:"44px",height:"44px",borderRadius:"50%",flexShrink:0,
          background:`linear-gradient(135deg,${ac},${ac}aa)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"15px",fontWeight:"900",color:"#fff",
          fontFamily:"'Nunito',sans-serif",
          boxShadow:hov?`0 0 0 4px ${ac}28,0 6px 20px ${ac}55`:`0 4px 16px ${ac}50`,
          transition:"box-shadow 0.28s ease",
        }}>{num}</div>
        <div style={{display:"flex",flexDirection:wide?"column":"row",alignItems:"center",gap:wide?"1px":"7px"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:"900",color:ac,lineHeight:1,textShadow:hov?`0 0 18px ${ac}88`:"none",transition:"text-shadow 0.28s ease"}}>{dd}</span>
          <div style={{display:"flex",flexDirection:"column",alignItems:wide?"center":"flex-start"}}>
            <span style={{fontSize:"11px",fontWeight:"900",color:`${ac}cc`,letterSpacing:"1.5px",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>{mm}</span>
            <span style={{fontSize:"10px",fontWeight:"700",color:"rgba(45,61,26,0.4)",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>{yy}</span>
          </div>
        </div>
        <div style={{fontSize:"22px",filter:hov?`drop-shadow(0 0 8px ${ac}88)`:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))",transition:"filter 0.28s ease"}}>{cfg.icon}</div>
        {wide&&<div style={{marginTop:"auto",fontSize:"10px",color:`${ac}88`,fontWeight:"700",fontFamily:"'Nunito',sans-serif",textAlign:"center",letterSpacing:"0.5px"}}>{fTime(event.date)}</div>}
      </div>
      {/* CONTENT */}
      <div style={{flex:1,padding:"22px 26px",display:"flex",flexDirection:"column",gap:"10px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"22px",height:"2.5px",background:ac,borderRadius:"2px",boxShadow:hov?`0 0 8px ${ac}`:"none",transition:"box-shadow 0.28s ease"}}/>
            <span style={{fontSize:"10px",fontWeight:"900",color:ac,letterSpacing:"2.5px",fontFamily:"'Nunito',sans-serif",textShadow:hov?`0 0 12px ${ac}88`:"none",transition:"text-shadow 0.28s ease"}}>{cfg.category}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {!wide&&<span style={{fontSize:"10px",color:`${ac}88`,fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>{fTime(event.date)}</span>}
            {hasDetail&&<span style={{fontSize:"14px",color:ac,fontWeight:"900",display:"inline-block",transform:isExpanded?"rotate(180deg)":"rotate(0)",transition:"transform 0.25s ease",textShadow:hov?`0 0 10px ${ac}`:"none"}}>▾</span>}
          </div>
        </div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:wide?"24px":"19px",fontWeight:"900",color:"#1a2a08",margin:0,lineHeight:1.2,letterSpacing:"-0.3px",textShadow:hov?`0 0 22px ${ac}44`:"none",transition:"text-shadow 0.28s ease"}}>{event.title}</h3>
        <p style={{fontSize:"13.5px",color:hov?"#3a5a20":"#4e6230",margin:0,lineHeight:1.75,fontWeight:"500",transition:"color 0.25s ease"}}>{event.subtitle}</p>
        {event.tags?.length>0&&(
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {event.tags.slice(0,wide?5:3).map(t=>(
              <span key={t} style={{display:"inline-block",fontSize:"10.5px",fontWeight:"800",color:ac,background:hov?`${ac}24`:`${ac}18`,border:`1px solid ${hov?ac+"55":ac+"38"}`,borderRadius:"20px",padding:"3px 10px",fontFamily:"'Nunito',sans-serif",transition:"all 0.25s ease"}}>{t.replace(/([A-Z])/g," $1").trim()}</span>
            ))}
          </div>
        )}
        {event.type==="zone"&&event.detail?.score!==undefined&&(
          <div style={{display:"inline-flex",alignItems:"stretch",border:`2px solid ${hov?ac+"55":ac+"35"}`,borderRadius:"16px",overflow:"hidden",alignSelf:"flex-start",marginTop:"4px",boxShadow:hov?`0 6px 28px ${ac}30`:`0 4px 20px ${ac}18`,transition:"all 0.28s ease",minWidth:"180px"}}>
            <div style={{padding:"12px 20px",background:`${ac}14`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"36px",fontWeight:"900",color:ac,lineHeight:1,textShadow:hov?`0 0 20px ${ac}88`:"none",transition:"text-shadow 0.28s ease"}}>{event.detail.score}</span>
              <span style={{fontSize:"9px",fontWeight:"900",color:ac,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>SCORE / 120</span>
            </div>
            {event.detail.confidence!==undefined&&<>
              <div style={{width:"2px",background:`${ac}20`,flexShrink:0}}/>
              <div style={{padding:"12px 20px",background:`${ac}08`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,minWidth:"90px"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:"900",color:ac,lineHeight:1,textShadow:hov?`0 0 16px ${ac}88`:"none",transition:"text-shadow 0.28s ease"}}>{event.detail.confidence}%</span>
                <span style={{fontSize:"9px",fontWeight:"900",color:ac,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>CONFIDENCE</span>
              </div>
            </>}
          </div>
        )}
        {event.type==="skin"&&event.detail?.severity&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:"12px",border:`2px solid ${hov?`${ac}55`:`${ac}35`}`,borderRadius:"14px",padding:"10px 18px",background:`${ac}10`,alignSelf:"flex-start",marginTop:"4px",transition:"all 0.28s ease"}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:"900",color:{Low:"#5b9e8a",Moderate:"#b8912a",High:"#c45e8a"}[event.detail.severity]||ac,lineHeight:1}}>{event.detail.severity}</span>
            <div><p style={{fontSize:"9px",fontWeight:"900",color:ac,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",margin:0}}>SEVERITY</p>{event.detail.condition&&<p style={{fontSize:"11px",fontWeight:"700",color:`${ac}cc`,fontFamily:"'Nunito',sans-serif",margin:"2px 0 0"}}>{event.detail.condition}</p>}</div>
          </div>
        )}
        {event.type==="riskEvent"&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:"8px",border:`2px solid ${hov?"rgba(196,94,138,0.55)":"rgba(196,94,138,0.35)"}`,borderRadius:"14px",padding:"10px 18px",background:"rgba(196,94,138,0.09)",alignSelf:"flex-start",marginTop:"4px",transition:"all 0.28s ease"}}>
            <span style={{fontSize:"22px"}}>⚠️</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:"900",color:"#8b2a52"}}>{event.detail?.level?`${event.detail.level.charAt(0).toUpperCase()+event.detail.level.slice(1)} Risk`:"Risk Alert"}</span>
          </div>
        )}
        {hasDetail&&!isExpanded&&<p style={{fontSize:"11.5px",color:ac,fontWeight:"800",fontFamily:"'Nunito',sans-serif",margin:"auto 0 0",paddingTop:"4px"}}>Tap to read full details →</p>}
        {isExpanded&&(
          <div style={{marginTop:"16px",paddingTop:"16px",borderTop:`1.5px solid ${ac}22`,animation:"expandDown 0.25s ease both"}}>
            <Detail event={event}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FIXED: Newspaper month divider (full-bleed via negative margin matching parent padding) ──
function MonthBreak({month,count}){
  const [name,year]=month.split(" ");
  return(
    <div style={{
      margin:"56px calc(-1 * 28px) 28px",  /* bleed = parent padding */
      padding:"20px 28px",
      background:"rgba(246,244,234,0.97)",
      backdropFilter:"blur(16px)",
    }}>
      {/* thick-thin top rules */}
      <div style={{height:"3px",background:"linear-gradient(90deg,#2a3a12,#8aad6e,#2a3a12)",marginBottom:"2px"}}/>
      <div style={{height:"1px",background:"rgba(45,61,26,0.18)",marginBottom:"12px"}}/>

      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:"14px"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"36px",fontWeight:"900",color:"#1a2a08",letterSpacing:"-1px",lineHeight:1}}>{name}</span>
          <span style={{fontFamily:"'Nunito',sans-serif",fontSize:"15px",fontWeight:"900",color:"#8aad6e",letterSpacing:"3px"}}>{year}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"40px",height:"1px",background:"rgba(45,61,26,0.15)"}}/>
          <span style={{fontFamily:"'Nunito',sans-serif",fontSize:"10px",fontWeight:"900",color:"rgba(45,61,26,0.4)",letterSpacing:"2px"}}>{count} {count===1?"ENTRY":"ENTRIES"} THIS MONTH</span>
          <div style={{width:"40px",height:"1px",background:"rgba(45,61,26,0.15)"}}/>
        </div>
      </div>

      {/* thick-thin bottom rules */}
      <div style={{height:"1px",background:"rgba(45,61,26,0.18)",marginTop:"12px",marginBottom:"2px"}}/>
      <div style={{height:"3px",background:"linear-gradient(90deg,#2a3a12,#8aad6e,#2a3a12)"}}/>
    </div>
  );
}

// ── FIXED: Sliding filter — uses ref-measured positions, no gap math errors ──
function FilterBar({filter,onChange}){
  const btnRefs = useRef({});
  const barRef  = useRef(null);
  const [pill, setPill] = useState({left:0,width:0,ready:false});

  useEffect(()=>{
    const el  = btnRefs.current[filter];
    const bar = barRef.current;
    if(!el||!bar) return;
    const eR=el.getBoundingClientRect();
    const bR=bar.getBoundingClientRect();
    setPill({left:eR.left-bR.left, width:eR.width, ready:true});
  },[filter]);

  return(
    <div ref={barRef} style={{
      position:"relative",
      display:"inline-flex",
      gap:"0",
      background:"rgba(246,244,234,0.94)",
      backdropFilter:"blur(20px)",
      borderRadius:"18px",
      padding:"6px",
      border:"1.5px solid rgba(138,173,110,0.28)",
      boxShadow:"0 4px 22px rgba(74,110,42,0.09)",
      marginBottom:"32px",
    }}>
      {/* Sliding pill — only render once position is measured */}
      {pill.ready&&(
        <div style={{
          position:"absolute",
          top:"6px", bottom:"6px",
          left:`${pill.left}px`,
          width:`${pill.width}px`,
          background:"linear-gradient(135deg,rgba(138,173,110,0.30),rgba(106,154,82,0.22))",
          borderRadius:"13px",
          border:"1.5px solid rgba(138,173,110,0.42)",
          boxShadow:"0 3px 14px rgba(138,173,110,0.25)",
          transition:"left 0.28s cubic-bezier(0.22,1,0.36,1),width 0.28s cubic-bezier(0.22,1,0.36,1)",
          pointerEvents:"none",
          zIndex:0,
        }}/>
      )}
      {FILTERS.map(tab=>(
        <button
          key={tab.key}
          ref={el=>{ btnRefs.current[tab.key]=el; }}
          onClick={()=>onChange(tab.key)}
          style={{
            position:"relative", zIndex:1,
            padding:"10px 22px",
            borderRadius:"13px",
            cursor:"pointer",
            fontFamily:"'Nunito',sans-serif",
            fontSize:"13px",
            fontWeight:"800",
            border:"none",
            background:"transparent",
            color:filter===tab.key?"#2e4618":"#6a8a4a",
            transition:"color 0.25s ease",
            whiteSpace:"nowrap",
          }}
        >{tab.icon} {tab.label}</button>
      ))}
    </div>
  );
}

function Skeletons(){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
      {[240,175,175,175,175].map((h,i)=>(
        <div key={i} style={{height:`${h}px`,borderRadius:"22px",background:`rgba(138,173,110,${0.07+i*0.02})`,gridColumn:i===0?"span 2":"span 1",animation:"pulse 1.6s ease-in-out infinite",animationDelay:`${i*0.12}s`}}/>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
export default function HealthTimeline({onBack}){
  const [events,   setEvents]   = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch(apiUrl("/api/timeline/me"),{credentials:"include"});
        const data=await res.json();
        if(!res.ok) throw new Error(data.message||"Failed");
        setEvents(data.events||[]);
        setSummary({...data.summary,totalEvents:data.total});
      }catch(e){setError(e.message);}
      finally{setLoading(false);}
    })();
  },[]);

  const filtered = events.filter(ev=>matchesFilter(ev,filter));
  const grouped  = groupByMonth(filtered);
  const insights = buildInsights(events);
  const currentZone = summary?.currentZone;
  const zoneColor = currentZone ? (ZONE_COLOR[currentZone] || "#6a9a52") : "#6a9a52";
  const zoneVisual = currentZone ? (ZONE_VISUAL[currentZone] || ZONE_VISUAL.moderate) : null;
  const zoneLabel = summary?.currentZoneLabel || zoneVisual?.label || "Current Zone";
  let   idx      = 0;

  return(
    <div style={{minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      {/* BG */}
      <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${timelineBg})`,backgroundSize:"cover",backgroundPosition:"center",filter:"blur(18px) brightness(0.88) saturate(1.1)",transform:"scale(1.08)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,zIndex:1,background:"linear-gradient(160deg,rgba(232,240,224,0.84) 0%,rgba(245,240,228,0.80) 50%,rgba(224,236,216,0.82) 100%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:"5%",right:"3%",width:"420px",height:"420px",background:"rgba(138,173,110,0.12)",filter:"blur(100px)",borderRadius:"50%",zIndex:1,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"5%",left:"2%",width:"320px",height:"320px",background:"rgba(90,158,138,0.09)",filter:"blur(80px)",borderRadius:"50%",zIndex:1,pointerEvents:"none"}}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap');
        @keyframes fu        {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes expandDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse     {0%,100%{opacity:.4}50%{opacity:.82}}
        @keyframes bob       {0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes shimLine  {0%,100%{opacity:0.3;transform:scaleX(0.6)}60%{opacity:1;transform:scaleX(1)}}
        .fu {animation:fu .52s cubic-bezier(.22,1,.36,1) both}
        .d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}
        .d4{animation-delay:.28s}.d5{animation-delay:.35s}
        .back-btn:hover{background:rgba(138,173,110,.26)!important;transform:translateX(-2px)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(138,173,110,.4);border-radius:4px}
      `}</style>

      <div style={{position:"relative",zIndex:2,maxWidth:"1000px",margin:"0 auto",padding:"0 28px 100px"}}>

        {/* ══ SECTION 1: EDITORIAL COVER STRIP (no rounded top — true cover) ══ */}
        <div className="fu" style={{
          background:"rgba(246,244,234,0.95)",
          backdropFilter:"blur(28px)",
          /* rounded only at bottom — top bleeds to viewport edge */
          borderRadius:"0 0 32px 32px",
          border:"1.5px solid rgba(138,173,110,0.22)",
          borderTop:"none",
          boxShadow:"0 14px 60px rgba(74,110,42,0.13)",
          marginBottom:"20px",
          overflow:"hidden",
          position:"relative",
        }}>
          {/* Ambient blobs inside cover */}
          <div style={{position:"absolute",top:"-40px",right:"-50px",width:"280px",height:"280px",background:"rgba(184,145,42,0.10)",filter:"blur(65px)",borderRadius:"50%",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:0,left:"-30px",width:"200px",height:"200px",background:"rgba(138,173,110,0.11)",filter:"blur(55px)",borderRadius:"50%",pointerEvents:"none"}}/>

          {/* Nav bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 32px 0"}}>
            <button onClick={onBack} className="back-btn" style={{background:"rgba(138,173,110,0.16)",border:"1.5px solid rgba(138,173,110,0.35)",borderRadius:"12px",padding:"9px 20px",fontWeight:"800",cursor:"pointer",color:"#3a5a1e",fontFamily:"'Nunito',sans-serif",fontSize:"13px",transition:"all .2s ease"}}>← Back</button>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {[{e:"🎯",c:"rgba(106,154,82,0.18)"},{e:"🌙",c:"rgba(196,94,138,0.16)"},{e:"✨",c:"rgba(184,145,42,0.18)"}].map((d,i)=>(
                <div key={i} style={{width:"36px",height:"36px",borderRadius:"50%",background:d.c,border:"1px solid rgba(138,173,110,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",animation:`bob ${2+i*.35}s ease-in-out ${i*.2}s infinite`}}>{d.e}</div>
              ))}
              <div style={{marginLeft:"6px",fontSize:"12px",fontWeight:"900",color:"#3a5a1e",fontFamily:"'Nunito',sans-serif",background:"rgba(138,173,110,0.16)",border:"1.5px solid rgba(138,173,110,0.28)",borderRadius:"20px",padding:"7px 16px"}}>
                {loading?"Loading…":`${filtered.length} entries`}
              </div>
            </div>
          </div>

          {/* Masthead body */}
          <div style={{padding:"20px 32px 30px",position:"relative"}}>
            <div style={{display:"grid",gridTemplateColumns:!loading&&currentZone?"minmax(0,1fr) 260px":"1fr",alignItems:"stretch",gap:"18px"}}>
              <div style={{
                background:"rgba(255,253,248,0.64)",
                border:"1.5px solid rgba(138,173,110,0.18)",
                borderRadius:"20px",
                padding:"26px 28px",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,0.82)",
              }}>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(32px,3.8vw,46px)",fontWeight:"900",color:"#1a2a08",margin:"0 0 12px",lineHeight:1,letterSpacing:"-0.5px"}}>
                  Health<br/>
                  <em style={{color:"#6a9a52",fontStyle:"italic",letterSpacing:"0"}}>Timeline</em>
                </h1>
                <p style={{fontSize:"14px",color:"#506238",maxWidth:"430px",lineHeight:1.7,fontWeight:"500",margin:0}}>
                  Every zone check, cycle log &amp; skin entry —{" "}
                  <strong style={{color:"#5a8a38",fontWeight:"800"}}>your PCOD/PCOS health story</strong>, told chronologically.
                </p>
              </div>

              {!loading&&currentZone&&(
                <div style={{
                  background:`${zoneColor}12`,
                  border:`1.5px solid ${zoneColor}34`,
                  borderRadius:"20px",
                  padding:"10px",
                  display:"flex",
                  flexDirection:"column",
                  gap:"10px",
                  textAlign:"center",
                  boxShadow:`0 10px 28px ${zoneColor}12`,
                }}>
                  <div style={{
                    minHeight:"132px",
                    borderRadius:"16px",
                    backgroundImage:`linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.36)),url(${zoneVisual?.image})`,
                    backgroundSize:"cover",
                    backgroundPosition:"center",
                    border:`1px solid ${zoneColor}26`,
                  }}/>
                  <div style={{padding:"0 8px 6px"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",fontWeight:"900",color:zoneColor,lineHeight:1.15}}>{zoneLabel}</div>
                    <div style={{fontSize:"8.5px",fontWeight:"900",color:`${zoneColor}99`,letterSpacing:"1.8px",fontFamily:"'Nunito',sans-serif",marginTop:"4px"}}>CURRENT ZONE</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ SECTION 2: EDITORIAL STATS — typographic, no boxes ══ */}
        {!loading&&summary&&(
          <div className="fu d1" style={{
            display:"grid",gridTemplateColumns:"repeat(4,1fr)",
            background:"rgba(246,244,234,0.94)",
            backdropFilter:"blur(20px)",
            borderRadius:"16px",
            border:"1.5px solid rgba(138,173,110,0.20)",
            boxShadow:"0 4px 22px rgba(74,110,42,0.08)",
            marginBottom:"14px",
            overflow:"hidden",
          }}>
            {[
              {icon:"📖",label:"Entries",     value:summary.totalEvents||0,      color:"#4a6e2a"},
              {icon:"🎯",label:"Assessments", value:summary.totalAssessments||0, color:"#6a9a52"},
              {icon:"✨",label:"Skin Checks", value:summary.totalSkinChecks||0,  color:"#b8912a"},
              {icon:"⚠️",label:"Attention Points", value:summary.highRiskEvents||0,   color:"#c45e8a"},
            ].map((s,i)=>(
              <div key={s.label} style={{
                display:"flex",flexDirection:"column",alignItems:"center",
                padding:"18px 12px 16px",
                borderRight:i<3?"1px solid rgba(45,61,26,0.09)":"none",
                position:"relative",gap:"2px",
              }}>
                {/* Thin coloured top accent — the ONLY decoration */}
                <div style={{position:"absolute",top:0,left:"28%",right:"28%",height:"2px",background:`linear-gradient(90deg,transparent,${s.color},transparent)`,borderRadius:"0 0 3px 3px"}}/>
                <span style={{fontSize:"12px",marginBottom:"1px"}}>{s.icon}</span>
                {/* Compact typographic number */}
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:"38px",fontWeight:"900",color:s.color,lineHeight:1,letterSpacing:"-1px"}}>{s.value}</span>
                {/* Thin label below */}
                <span style={{fontSize:"8.5px",fontWeight:"900",color:`${s.color}88`,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>{s.label.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══ SECTION 3: DATA SOURCES + LAST PERIOD ══ */}
        {!loading&&summary&&(
          <div className="fu d2" style={{display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap",background:"rgba(246,244,234,0.92)",backdropFilter:"blur(20px)",borderRadius:"18px",padding:"18px 26px",border:"1.5px solid rgba(138,173,110,0.20)",boxShadow:"0 4px 22px rgba(74,110,42,0.08)",marginBottom:"20px"}}>
            <span style={{fontSize:"10px",fontWeight:"900",color:"rgba(45,61,26,0.32)",letterSpacing:"2.5px",fontFamily:"'Nunito',sans-serif",flexShrink:0}}>DATA SOURCES</span>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {[
                summary.hasZoneData   &&{label:"Zone",  color:"#6a9a52",icon:"🎯"},
                summary.hasPeriodData &&{label:"Cycle", color:"#c45e8a",icon:"🌙"},
                summary.hasSkinData   &&{label:"Skin",  color:"#b8912a",icon:"✨"},
              ].filter(Boolean).map(b=>(
                <span key={b.label} style={{fontSize:"11px",fontWeight:"800",color:b.color,background:`${b.color}14`,border:`1.5px solid ${b.color}35`,borderRadius:"20px",padding:"5px 14px",fontFamily:"'Nunito',sans-serif"}}>{b.icon} {b.label} ✓</span>
              ))}
            </div>
            {summary.lastPeriodDate&&<>
              <div style={{width:"1px",height:"22px",background:"rgba(45,61,26,0.12)",flexShrink:0,marginLeft:"auto"}}/>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"14px"}}>🌙</span>
                <div>
                  <span style={{fontSize:"9px",fontWeight:"900",color:"#c45e8a",letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",display:"block"}}>LAST PERIOD</span>
                  <span style={{fontSize:"13px",fontWeight:"800",color:"#7a3a5a",fontFamily:"'Nunito',sans-serif"}}>{fDate(summary.lastPeriodDate)}</span>
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ══ SECTION 4: FLIP INSIGHT CARDS ══ */}
        {!loading&&!error&&events.length>0&&insights.length>0&&(
          <div className="fu d3" style={{marginBottom:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",background:"rgba(246,244,234,0.92)",backdropFilter:"blur(20px)",borderRadius:"18px",padding:"16px 24px",border:"1.5px solid rgba(138,173,110,0.20)",boxShadow:"0 3px 16px rgba(74,110,42,0.07)",marginBottom:"14px"}}>
              <div style={{width:"42px",height:"42px",borderRadius:"14px",flexShrink:0,background:"linear-gradient(135deg,rgba(138,173,110,0.28),rgba(91,158,138,0.20))",border:"1.5px solid rgba(138,173,110,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"19px",boxShadow:"0 4px 16px rgba(138,173,110,0.20)"}}>💡</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"19px",fontWeight:"900",color:"#1a2a08",lineHeight:1.1}}>Personalised Insights</div>
                <div style={{fontSize:"12px",fontWeight:"600",color:"#6a8a50",fontFamily:"'DM Sans',sans-serif",marginTop:"2px"}}>Click any card to flip it and read your insight.</div>
              </div>
              <div style={{width:"48px",height:"2px",borderRadius:"2px",background:"linear-gradient(90deg,transparent,#8aad6e,transparent)",animation:"shimLine 2.4s ease-in-out infinite",flexShrink:0}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px"}}>
              {insights.map((card,i)=>(<InsightFlipCard key={i} card={card} delay={0.08+i*0.1}/>))}
            </div>
            <div style={{height:"1.5px",background:"linear-gradient(90deg,transparent,rgba(138,173,110,0.35),rgba(184,145,42,0.18),transparent)",marginTop:"24px"}}/>
          </div>
        )}

        {/* ══ SECTION 5: SLIDING FILTER BAR (ref-based, gap-safe) ══ */}
        {!loading&&events.length>0&&(
          <div className="fu d4">
            <FilterBar filter={filter} onChange={(k)=>{setFilter(k);setExpanded(null);}}/>
          </div>
        )}

        {/* Loading */}
        {loading&&(
          <div className="fu">
            <div style={{textAlign:"center",padding:"40px 0 28px"}}>
              <div style={{fontSize:"40px",marginBottom:"10px",display:"inline-block",animation:"bob 1.6s ease-in-out infinite"}}>🌿</div>
              <p style={{color:"#8aad6e",fontWeight:"700",fontFamily:"'Nunito',sans-serif",fontSize:"15px",margin:0}}>Turning your data into a story…</p>
            </div>
            <Skeletons/>
          </div>
        )}

        {/* Error */}
        {error&&!loading&&(
          <div style={{background:"rgba(196,94,138,.10)",border:"1px solid rgba(196,94,138,.3)",borderRadius:"16px",padding:"16px 20px",color:"#8b2a52",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>⚠️ {error}</div>
        )}

        {/* Empty */}
        {!loading&&!error&&filtered.length===0&&(
          <div style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{fontSize:"60px",marginBottom:"18px",opacity:.45}}>🌱</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:"900",color:"#2d3d1a",margin:"0 0 10px"}}>{filter==="all"?"Your journal is just beginning":`No ${filter} entries yet`}</h3>
            <p style={{fontSize:"14px",color:"#6a8a4a",lineHeight:1.8,maxWidth:"360px",margin:"0 auto"}}>Complete a RapidFire zone check, log your period, or try the skin analyzer.</p>
          </div>
        )}

        {/* ══ SECTION 6: MAGAZINE 2-COLUMN GRID ══ */}
        {!loading&&!error&&filtered.length>0&&(
          <div>
            {Object.entries(grouped).map(([month,evs])=>(
              <div key={month} className="fu d5">
                <MonthBreak month={month} count={evs.length}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  {evs.map(ev=>{
                    idx+=1;
                    const wide=(idx%5===1)||ev.type==="zone"||ev.type==="riskEvent";
                    return(
                      <MagCard key={ev.id} event={ev} num={idx} wide={wide}
                        isExpanded={expanded===ev.id}
                        onToggle={()=>setExpanded(expanded===ev.id?null:ev.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{textAlign:"center",marginTop:"72px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:"14px",padding:"14px 30px",background:"rgba(246,244,234,0.92)",borderRadius:"22px",border:"1.5px solid rgba(138,173,110,0.28)",boxShadow:"0 4px 20px rgba(74,110,42,0.08)"}}>
                <div style={{width:"36px",height:"1.5px",background:"rgba(138,173,110,0.55)",borderRadius:"2px"}}/>
                <span style={{fontSize:"13px",color:"#8aad6e",fontWeight:"900",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px"}}>🌱 YOUR STORY CONTINUES</span>
                <div style={{width:"36px",height:"1.5px",background:"rgba(138,173,110,0.55)",borderRadius:"2px"}}/>
              </div>
              <p style={{fontSize:"12.5px",color:"#8aad6e",marginTop:"12px",fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>{events.length} total entries across your health journey</p>
            </div>
          </div>
        )}

        <footer style={{marginTop:"28px",padding:"14px 18px",borderRadius:"14px",background:"rgba(246,244,234,0.78)",border:"1.5px solid rgba(138,173,110,0.18)",boxShadow:"0 4px 18px rgba(74,110,42,0.06)",color:"rgba(45,61,26,0.48)",fontSize:"11px",lineHeight:1.7,fontWeight:"600",textAlign:"center"}}>
          <div>HerSpace supports early awareness and consultation preparation. It does not diagnose or replace medical advice.</div>
          <div>Health data is used only to generate user-facing insights and consultation prep summaries.</div>
        </footer>

      </div>
    </div>
  );
}
