"use strict";
const $=s=>document.querySelector(s);
const NS="http://www.w3.org/2000/svg";
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=String(x);return e};
const S=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const btn=(t,c,fn)=>{const b=el("button",c,t);b.type="button";b.onclick=fn;return b};
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rnd=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296};
const clean=s=>String(s||"").replace(/[^A-Za-z0-9 _-]/g,"").trim().slice(0,12)||"Cadet";
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* icons: simple line glyphs, built with the DOM (no innerHTML) */
const IC={power:"M13 2 5 14h6l-1 8 8-12h-6z",air:"M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8",food:"M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19 13 11",shield:"M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",sci:"M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3",rad:"M12 12V3a9 9 0 0 1 7.8 4.5zM12 12l7.8 4.5A9 9 0 0 1 12 21zM12 12l-7.8 4.5A9 9 0 0 1 4.2 7.5z",astro:"M12 3a5 5 0 0 0-5 5v3h10V8a5 5 0 0 0-5-5zM8 14h8l1 7H7z"};
function icon(n,s=22){const v=S("svg",{viewBox:"0 0 24 24",width:s,height:s,fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true"});v.append(S("path",{d:IC[n]}));return v}
const STOPS=[[255,77,94],[255,179,71],[59,157,255]];
function col(t){t=clamp(t,0,1)*2;const i=Math.min(1,Math.floor(t)),f=t-i,a=STOPS[i],b=STOPS[i+1];return "rgb("+a.map((v,j)=>Math.round(v+(b[j]-v)*f)).join(",")+")"}

/* sound */
let ac=null,mute=true;
function tone(f,d=.12,t="sine"){if(mute||!ac)return;try{const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=.05;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}

/* data */
const DAYS=15,H=8,KEY="outpost.best.v4";
const SITES=Object.freeze({
  moon:{n:"Moon",rad:7,sun:1,delay:"1.3 s",pal:{sky:["#040c2c","#123a8f"],far:"#0f2c78",near:"#143a96",gnd:"#1b4bb5"}},
  mars:{n:"Mars",rad:5.5,sun:.6,delay:"4 to 24 min",pal:{sky:["#26123f","#8a4a44"],far:"#4a2340",near:"#6b2f3a",gnd:"#93503f"}}});
const TASKS=Object.freeze([
  {k:"solar",i:"power",n:"Power",tip:"Solar panels charge the base"},
  {k:"life",i:"air",n:"Air",tip:"Makes oxygen and water"},
  {k:"farm",i:"food",n:"Food",tip:"Greenhouse crops"},
  {k:"shield",i:"shield",n:"Shield",tip:"Blocks radiation"},
  {k:"sci",i:"sci",n:"Science",tip:"Earns points, costs hours",rev:1}]);
const STATS=Object.freeze([
  {k:"power",i:"power",n:"Power",c:"#ffc857"},{k:"o2",i:"air",n:"Air",c:"#6fd3ff"},
  {k:"food",i:"food",n:"Food",c:"#4ade80"},{k:"shield",i:"shield",n:"Shield",c:"#b69cff"},
  {k:"rad",i:"rad",n:"Radiation",c:"#ff4d5e",bad:1}]);
const EVI=Object.freeze({storm:"rad",dust:"power",rock:"shield",blight:"food",leak:"air",batt:"power",ship:"food",ice:"air"});
const EV=Object.freeze([
  {k:"storm",n:"Solar storm!",p:"Add shield hours.",l:"Shields block space radiation."},
  {k:"dust",n:"Dust storm",t:"Dusty panels. Power drops.",p:"Bank extra power.",l:"Dust blocks sunlight.",f:r=>{r.power-=14}},
  {k:"rock",n:"Space rock!",t:"Shield and air damaged.",p:"Add shield hours.",l:"Tiny rocks fly super fast.",f:r=>{r.shield-=12;r.o2-=8}},
  {k:"blight",n:"Sick plants",t:"Food drops.",p:"Grow extra food.",l:"Farms can fail. Keep spare food.",f:r=>{r.food-=12}},
  {k:"leak",n:"Air leak!",t:"Air drops.",p:"Build an air reserve.",l:"Spare parts save lives.",f:r=>{r.o2-=16}},
  {k:"batt",n:"Battery broke",t:"Power drops.",p:"Charge the batteries.",l:"Pick what gets power first.",f:r=>{r.power-=18}},
  {k:"ship",n:"Cargo ship late",t:"No new food.",p:"Stock up on food.",l:"Supplies take months to travel.",f:r=>{r.food-=9}},
  {k:"ice",n:"Found ice!",t:"Free air and water!",l:"Use what is nearby.",g:1,f:r=>{r.o2+=10}}]);
const FACTS=Object.freeze([
  "Moon gravity is 16.6% of Earth’s.","Mars gravity is 38% of Earth’s.",
  "A Mars day lasts about 24.6 hours.","A Moon day lasts about 29.5 Earth days.",
  "Radio reaches the Moon in about 1.3 seconds.","Radio takes 4 to 24 minutes to reach Mars.",
  "NASA’s DONKI tracks solar storms.","NASA’s Artemis aims for a lasting presence on the Moon.",
  "The ISS has had crew since November 2000.","More power for science means less for other jobs."]);

/* story: cast and chapters (keyed by mission day) */
const TKEY="outpost.theme.v1";
const CAST=Object.freeze({
  cap:["Rivera","Mission Control, Earth"],mei:["Dr. Mei","Science officer"],
  imani:["Imani","Flight engineer"],lucas:["Lucas","Botanist"]});
const NIGHT=["Power down the lab","+15 power",g=>{g.res.power+=15}],LAB=["Keep experiments running","+30 science, −8 power",g=>{g.sci+=30;g.res.power-=8}];
const STORY=Object.freeze({
  1:{t:"Touchdown",who:"cap",go:"Begin mission",x:(s,n)=>"Touchdown confirmed, Commander "+n+". The "+s+" outpost is yours. Four crew. Fifteen days. Split 8 crew hours each day and bring everyone home."},
  3:{t:"The Cave",who:"mei",x:()=>"I found a lava tube near the base. It could be full of science. Or it could be a safe shelter for us. Your call.",
    a:["Explore it","+40 science, −10 power",g=>{g.sci+=40;g.res.power-=10}],b:["Make it a shelter","+12 shield",g=>{g.res.shield+=12}]},
  6:{moon:{t:"The Long Night",who:"imani",x:()=>"The Sun is setting, Commander. Lunar night lasts five days here. Our panels will make far less power.",a:NIGHT,b:LAB},
      mars:{t:"Dust Season",who:"imani",x:()=>"Dust is in the air, Commander. Sunlight is already weak on Mars. Every panel hour counts now.",a:NIGHT,b:LAB}},
  8:{t:"Halfway Home",who:"cap",x:()=>"Halfway there! Schools on Earth want to talk to your crew. But the air system is due a check. You have time for one.",
    a:["Call the schools","+30 science",g=>{g.sci+=30}],b:["Check every seal","+12 air",g=>{g.res.o2+=12}]},
  11:{moon:{t:"Sunrise",who:"imani",x:()=>"Sunlight is back on the panels. The long night is over. We made it, Commander."}},
  12:{t:"The Lost Drone",who:"lucas",x:()=>"A cargo drone landed off course. It carries fresh seeds. But the walk is outside our shield.",
    a:["Go and get it","+16 food, +6 radiation",g=>{g.res.food+=16;g.res.rad+=6}],b:["Stay inside","+6 shield",g=>{g.res.shield+=6}]},
  14:{t:"Final Stretch",who:"imani",x:()=>"Our ride home is two days out. Do we pack rock samples for Earth, or tune up the base?",
    a:["Pack the samples","+40 science, −8 food",g=>{g.sci+=40;g.res.food-=8}],b:["Tune up the base","+8 power, +8 air",g=>{g.res.power+=8;g.res.o2+=8}]}});

function loadBest(){try{const o=JSON.parse(localStorage.getItem(KEY));if(o&&Number.isInteger(o.s)&&o.s>=0&&o.s<100000&&typeof o.n==="string")return{s:o.s,n:clean(o.n)}}catch(e){}return null}
function saveBest(s,n){try{localStorage.setItem(KEY,JSON.stringify({s,n}))}catch(e){}}

let G=null,site="moon",lvl="easy";
const UI={g:{},sl:{},seg:[]};
const used=()=>Object.values(G.alloc).reduce((a,b)=>a+b,0);
const sunAt=d=>{let s=SITES[G.site].sun;if(G.site==="moon"&&d>=6&&d<=10)s=.3;return s};
function project(){
  const r=G.res,a=G.alloc,p={};
  p.power=clamp(r.power+a.solar*6*sunAt(G.day)-12)-r.power;
  const eff=clamp(r.power+p.power)<15?.5:1;
  p.o2=clamp(r.o2+a.life*5*eff-8)-r.o2;
  p.food=clamp(r.food+a.farm*5*eff-7)-r.food;
  p.shield=clamp(r.shield+a.shield*4-2)-r.shield;
  p.rad=SITES[G.site].rad*(1-r.shield/110);
  return p;
}

/* screens + modal */
const show=id=>["menu","cine","game","over"].forEach(x=>{$("#"+x).hidden=x!==id});
function modal(...n){const b=$("#mbody");b.textContent="";b.append(...n);$("#modal").hidden=false;const f=b.querySelector("button");if(f)f.focus()}
const closeModal=()=>{$("#modal").hidden=true};

/* build HUD once per mission */
function build(){
  const gb=$("#gauges");gb.textContent="";
  for(const s of STATS){
    const box=el("div","gauge"),rw=el("div","rw"),svg=S("svg",{viewBox:"0 0 64 64","class":"ring","aria-hidden":"true"});
    svg.append(S("circle",{cx:32,cy:32,r:27,fill:"none","class":"trk","stroke-width":6}));
    const c=S("circle",{cx:32,cy:32,r:27,fill:"none","stroke-width":6,"stroke-linecap":"round","stroke-dasharray":169.6,transform:"rotate(-90 32 32)"});svg.append(c);
    const ic=el("span","gi");ic.append(icon(s.i,20));rw.append(svg,ic);
    const vl=el("b"),ar=el("span","ar"),row=el("div");row.append(vl,ar);
    box.append(rw,el("small",null,s.n),row);gb.append(box);UI.g[s.k]={box,c,ic,vl,ar};
  }
  const sb=$("#sliders");sb.textContent="";
  for(const k of TASKS){
    const row=el("div","sl"),h=el("div","slh"),nm=el("span","sn"),v=el("b","sv");
    nm.append(icon(k.i,20),el("b",null,k.n),el("small",null,k.tip));h.append(nm,v);
    const inp=document.createElement("input");inp.type="range";inp.min=0;inp.max=H;inp.step=1;inp.className=k.rev?"rev":"";inp.setAttribute("aria-label",k.n+" crew hours");
    inp.oninput=()=>{let n=+inp.value;const room=H-used()+G.alloc[k.k];if(n>room)n=room;G.alloc[k.k]=n;tone(300+n*60,.06);render()};
    const sc=el("div","scale");for(let i=0;i<=H;i++)sc.append(el("span",null,i));
    row.append(h,inp,sc);sb.append(row);UI.sl[k.k]={inp,v,sc};
  }
  const sg=$("#segs");sg.textContent="";UI.seg=[];for(let i=0;i<H;i++){const s=el("i");sg.append(s);UI.seg.push(s)}
}
function render(){
  const p=project(),left=H-used(),S0=SITES[G.site],sn=sunAt(G.day);
  $("#where").textContent=S0.n+" outpost";$("#day").textContent="Day "+G.day+" / "+DAYS;
  $("#sunl").textContent=(sn<.5?"Lunar night ":"Sunlight ")+Math.round(sn*100)+"%";
  $("#delay").textContent="Radio delay "+S0.delay;$("#chap").textContent=G.chap;$("#progf").style.width=((G.day-1)/DAYS*100)+"%";
  for(const s of STATS){
    const u=UI.g[s.k],v=Math.round(G.res[s.k]),d=p[s.k],cl=col(s.bad?1-v/100:v/100),tiny=Math.abs(d)<.5;
    u.c.setAttribute("stroke",cl);u.c.setAttribute("stroke-dashoffset",169.6*(1-clamp(v)/100));u.ic.style.color=cl;
    u.vl.textContent=v+"%";u.ar.textContent=tiny?"–":d>0?"▲":"▼";
    u.ar.className="ar "+(tiny?"flat":((d>0)!==!!s.bad?"pos":"neg"));u.box.classList.toggle("low",s.bad?v>70:v<25);
  }
  for(const k of TASKS){const u=UI.sl[k.k],n=G.alloc[k.k];u.inp.value=n;u.inp.disabled=G.busy;u.v.textContent=n+" h";[...u.sc.children].forEach((c,i)=>c.classList.toggle("on",i===n))}
  UI.seg.forEach((s,i)=>{s.className=i<left?"on":""});$("#hl").textContent=left+" left";
  const ne=G.next,al=$("#alert"),w=ne&&G.warn&&!ne.g;al.hidden=!w;
  if(w){al.textContent="";al.append(icon(EVI[ne.k],20),el("span",null,ne.n.replace("!","")+" expected. "+ne.p))}
  const r=G.res,m=[["power","Power"],["o2","Air"],["food","Food"]].find(a=>r[a[0]]<35);
  $("#mc").textContent="Earth"+(G.site==="mars"?" (sent 12 min ago)":"")+": "+(r.rad>60?"Radiation is high. Add shield hours.":m?m[1]+" is low. Give it more hours.":"All systems healthy. Keep a reserve.");
  $("#end").disabled=left>0||!!G.busy;
}

/* animated world (parallax terrain, base, patrolling astronaut) */
const Wc=$("#world"),wx=Wc.getContext("2d");let wt=0,boost=0,dust=0,meteors=[],last=0;
function layer(sp,y0,amp,c){wx.fillStyle=c;wx.beginPath();wx.moveTo(0,Wc.height);for(let x=0;x<=Wc.width;x+=15){const u=x+wt*sp;wx.lineTo(x,y0-amp*Math.sin(u/70)-amp*.5*Math.sin(u/23))}wx.lineTo(Wc.width,Wc.height);wx.fill()}
function drawWorld(ts){
  requestAnimationFrame(drawWorld);
  const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(!G||$("#game").hidden)return;
  const w=Wc.width,h=Wc.height,P=SITES[G.site].pal,sn=sunAt(G.day),r=G.res,gy=h*.8,bx=w*.55;
  boost=Math.max(0,boost-dt*1.2);dust=Math.max(0,dust-dt);if(!calm)wt+=dt*(50+boost*420);
  const g=wx.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(1,P.sky[1]);wx.fillStyle=g;wx.fillRect(0,0,w,h);
  const ph=(G.day-1)/DAYS,sx=70+ph*(w-140),sy=95-Math.sin(ph*Math.PI)*55;
  wx.shadowColor="#ffd76a";wx.shadowBlur=sn<.5?0:30;wx.fillStyle=sn<.5?"#3b4f95":"#ffd76a";wx.beginPath();wx.arc(sx,sy,18,0,6.283);wx.fill();wx.shadowBlur=0;
  if(G.site==="moon"){wx.fillStyle="#2f7bff";wx.beginPath();wx.arc(w*.88,60,20,0,6.283);wx.fill();wx.fillStyle="#3fbf7f";wx.beginPath();wx.arc(w*.88-6,56,8,0,6.283);wx.fill()}
  layer(.1,h*.6,30,P.far);layer(.3,h*.7,18,P.near);
  wx.fillStyle=P.gnd;wx.fillRect(0,gy,w,h-gy);
  wx.fillStyle="#0003";for(let i=0;i<7;i++){const x=((i*170-wt)%(w+170)+(w+170))%(w+170)-85;wx.beginPath();wx.ellipse(x,gy+22+(i%3)*8,30+i*3,5,0,0,6.283);wx.fill()}
  /* base: shield mound, dome, panels, greenhouse, antenna */
  wx.fillStyle="#2a56d0";wx.beginPath();wx.ellipse(bx,gy,70+r.shield*.7,8+r.shield*.28,0,Math.PI,0);wx.fill();
  wx.fillStyle="#4a6fe055";wx.beginPath();wx.arc(bx,gy,56,Math.PI,0);wx.closePath();wx.fill();
  wx.strokeStyle=col(1-r.rad/100);wx.lineWidth=3;wx.stroke();
  wx.fillStyle=r.power>15?"#ffe9a0":"#27325a";for(let i=-1;i<=1;i++)wx.fillRect(bx+i*20-5,gy-30,10,14);
  wx.fillStyle="rgba(90,170,255,"+(.4+sn*.6)+")";for(const dx of[-190,-140]){wx.beginPath();wx.moveTo(bx+dx,gy-34);wx.lineTo(bx+dx+40,gy-42);wx.lineTo(bx+dx+40,gy-28);wx.lineTo(bx+dx,gy-20);wx.fill();wx.fillRect(bx+dx+19,gy-30,3,30)}
  wx.fillStyle="rgba(60,220,140,"+(.3+r.food/150)+")";wx.beginPath();wx.arc(bx+110,gy,28,Math.PI,0);wx.fill();
  wx.strokeStyle="#9db8ff";wx.lineWidth=2;wx.beginPath();wx.moveTo(bx+175,gy);wx.lineTo(bx+175,gy-52);wx.stroke();wx.fillStyle="#5ad7ff";wx.beginPath();wx.arc(bx+175,gy-54,4,0,6.283);wx.fill();
  /* patrolling astronaut */
  const x=(wt*1.6)%(w+100)-50,a=Math.sin(wt*.12)*.7;
  wx.save();wx.translate(x,gy+6);wx.strokeStyle="#fff";wx.lineWidth=5;wx.lineCap="round";
  wx.beginPath();wx.moveTo(0,-14);wx.lineTo(a*12,0);wx.moveTo(0,-14);wx.lineTo(-a*12,0);wx.stroke();
  wx.fillStyle="#cfd8ff";wx.fillRect(-12,-34,6,16);wx.fillStyle="#fff";wx.fillRect(-7,-34,14,20);
  wx.beginPath();wx.arc(0,-41,9,0,6.283);wx.fill();wx.fillStyle="#5ad7ff";wx.beginPath();wx.arc(3,-41,5,0,6.283);wx.fill();wx.restore();
  /* weather and hazards */
  if(dust>0){wx.fillStyle="rgba(210,150,90,"+.28*Math.min(1,dust)+")";wx.fillRect(0,0,w,h);wx.strokeStyle="#e0b080";wx.lineWidth=1;for(let i=0;i<30;i++){const dx=(i*97+wt*4)%w,dy=(i*53)%h;wx.beginPath();wx.moveTo(dx,dy);wx.lineTo(dx-12,dy+3);wx.stroke()}}
  meteors=meteors.filter(m=>m.y<gy);for(const m of meteors){m.x+=m.vx;m.y+=m.vy;wx.strokeStyle="#fff";wx.lineWidth=3;wx.beginPath();wx.moveTo(m.x,m.y);wx.lineTo(m.x-m.vx*6,m.y-m.vy*6);wx.stroke()}
  if(sn<.5){wx.fillStyle="rgba(0,5,30,.35)";wx.fillRect(0,0,w,h)}
}
requestAnimationFrame(drawWorld);
function hit(k){
  const wd=$("#world"),f=$("#flashov"),c=k==="storm"?f:wd,cl=k==="storm"?"go":"shake";
  if(k==="dust")dust=4;
  if(k==="rock")for(let i=0;i<4;i++)meteors.push({x:80+rnd()*w0(),y:-20-i*40,vx:2,vy:8+rnd()*4});
  c.classList.add(cl);setTimeout(()=>c.classList.remove(cl),900);
}
const w0=()=>Wc.width*.7;
function floats(p){
  const f=$("#floats");f.textContent="";let i=0;
  for(const s of STATS){const d=p[s.k];if(Math.abs(d)<1)continue;
    const t=el("span","fl "+((d>0)!==!!s.bad?"pos":"neg"),s.n+" "+(d>0?"+":"")+Math.round(d));
    t.style.left=(6+i*18)+"%";f.append(t);i++;setTimeout(()=>t.remove(),1500)}
}

/* story chapters: a crew member speaks, the player decides */
let twI=0;
function type(p,t){clearInterval(twI);if(calm){p.textContent=t;return}let i=0;p.textContent="";twI=setInterval(()=>{i+=2;p.textContent=t.slice(0,i);if(i>=t.length)clearInterval(twI)},24)}
function story(){
  let c=STORY[G.day];if(c&&!c.t)c=c[G.site];if(!c)return;
  G.chn++;G.chap="Chapter "+G.chn+" · "+c.t;render();tone(440,.2);
  const cast=CAST[c.who],who=el("div","who"),id=el("div"),say=el("p","say");
  id.append(el("b",null,cast[0]),el("small",null,cast[1]));who.append(el("span","av",cast[0].split(" ").pop()[0]),id);
  const n=[el("div","kick","Chapter "+G.chn),el("h2",null,c.t),who,say];
  const pick=o=>()=>{o[2](G);const r=G.res;for(const k of ["power","o2","food","shield"])r[k]=clamp(r[k],1);r.rad=Math.min(99,r.rad);clearInterval(twI);closeModal();tone(660);render()};
  if(c.a)for(const o of [c.a,c.b]){const b=btn("","choice",pick(o));b.append(el("b",null,o[0]),el("small",null,o[1]));n.push(b)}
  else n.push(btn(c.go||"Continue","go",()=>{clearInterval(twI);closeModal()}));
  modal(...n);type(say,c.x(SITES[G.site].n,G.name));
}

/* rocket cinematic: lands at mission start, launches at mission end */
let cineRun=null;
function rocket(x,cx,by,thr){
  if(thr>0){const L=(50+thr*70)*(.8+Math.random()*.4),g=x.createLinearGradient(0,by-10,0,by+L);
    g.addColorStop(0,"#fff");g.addColorStop(.3,"#ffd76a");g.addColorStop(1,"rgba(255,90,40,0)");
    x.fillStyle=g;x.beginPath();x.moveTo(cx-13,by-12);x.quadraticCurveTo(cx,by+L*1.4,cx+13,by-12);x.fill()}
  x.strokeStyle="#9db8ff";x.lineWidth=4;x.lineCap="round";x.beginPath();x.moveTo(cx-14,by-28);x.lineTo(cx-32,by);x.moveTo(cx+14,by-28);x.lineTo(cx+32,by);x.stroke();
  x.fillStyle="#2f6df0";for(const d of [-1,1]){x.beginPath();x.moveTo(cx+d*17,by-56);x.lineTo(cx+d*36,by-16);x.lineTo(cx+d*17,by-24);x.fill()}
  x.fillStyle="#f4f7ff";x.beginPath();x.moveTo(cx,by-146);x.bezierCurveTo(cx+24,by-116,cx+20,by-60,cx+18,by-12);x.lineTo(cx-18,by-12);x.bezierCurveTo(cx-20,by-60,cx-24,by-116,cx,by-146);x.fill();
  x.fillStyle="#2f6df0";x.fillRect(cx-19,by-52,38,6);
  x.fillStyle="#0a1a44";x.beginPath();x.arc(cx,by-90,10,0,6.283);x.fill();x.fillStyle="#5ad7ff";x.beginPath();x.arc(cx,by-90,6.5,0,6.283);x.fill();
}
function cinema(mode,cap,done){
  if(calm){done();return}
  const c=$("#cv"),x=c.getContext("2d"),w=c.width,h=c.height,P=SITES[G.site].pal,gy=h*.82,cx=w/2,T=4200,run={};
  const st=Array.from({length:90},()=>[Math.random()*w,Math.random()*gy*.75,Math.random()*1.4+.4]);
  let t0=0;cineRun=run;
  const fin=()=>{if(cineRun!==run)return;cineRun=null;done()};
  show("cine");$("#cap").textContent=cap;$("#skip").onclick=fin;$("#skip").focus();tone(70,3.5,"sawtooth");
  requestAnimationFrame(function fr(ts){
    if(cineRun!==run)return;
    if(!t0)t0=ts;
    const p=Math.min(1,(ts-t0)/T);let by,thr;
    if(mode==="land"){const q=Math.min(1,p/.8),e=1-Math.pow(1-q,3);by=-20+(gy+20)*e;thr=q<1?1-.6*e:0}
    else{const q=Math.max(0,(p-.3)/.7);by=gy-(gy+200)*q*q;thr=p<.3?.3+p:1}
    const near=Math.max(0,1-(gy-by)/170),sh=thr*near*5;
    x.save();x.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);
    const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(1,P.sky[1]);x.fillStyle=g;x.fillRect(-10,-10,w+20,h+20);
    x.fillStyle="#fff";for(const s of st){x.globalAlpha=.4+.6*Math.abs(Math.sin(ts/900+s[0]));x.beginPath();x.arc(s[0],s[1],s[2],0,6.283);x.fill()}x.globalAlpha=1;
    for(const [y0,amp,col2,k] of [[h*.62,34,P.far,90],[h*.72,20,P.near,55]]){x.fillStyle=col2;x.beginPath();x.moveTo(-10,h+10);for(let i=-10;i<=w+10;i+=15)x.lineTo(i,y0-amp*Math.sin(i/k)-amp*.4*Math.sin(i/21));x.lineTo(w+10,h+10);x.fill()}
    x.fillStyle=P.gnd;x.fillRect(-10,gy,w+20,h-gy+10);
    x.fillStyle="#0004";x.beginPath();x.ellipse(cx,gy+8,70,9,0,0,6.283);x.fill();
    rocket(x,cx,by,thr);
    if(thr>0&&near>0){for(let i=0;i<6;i++)for(const d of [-1,1]){x.fillStyle="rgba(225,232,255,"+(.3*near*(1-i/7))+")";x.beginPath();x.ellipse(cx+d*(36+i*30+Math.random()*10),gy+2-near*6,20+i*5,8+near*10,0,0,6.283);x.fill()}}
    x.restore();
    if(p<1)requestAnimationFrame(fr);else setTimeout(fin,700);
  });
}

/* day loop */
function go(){
  if(!G||G.busy||used()!==H)return;
  G.busy=true;boost=1;tone(520,.25);render();
  const g=G;setTimeout(()=>{if(G!==g)return;G.busy=false;endDay()},800);
}
function endDay(){
  const p=project(),r=G.res;
  for(const s of ["power","o2","food","shield"])r[s]=clamp(r[s]+p[s]);
  floats(p);r.rad+=p.rad;G.sci+=G.alloc.sci*10;for(const q in G.alloc)G.hrs[q]+=G.alloc[q];
  G.hist.push([r.power,r.o2,r.food,r.shield,r.rad].map(Math.round));
  const e=G.next,w=G.warn;G.next=null;G.warn=false;
  if(e)playEvent(e,w,after);else after();
}
function playEvent(e,w,done){
  tone(200,.3,"square");hit(e.k);
  const late=!w&&!e.g&&G.site==="mars"?el("p","neg","Earth’s warning came too late."):el("span"),ic=el("div","mi");ic.append(icon(EVI[e.k],48));
  if(e.k==="storm")return storm(done,late,ic);
  e.f(G.res);for(const s of ["power","o2","food","shield"])G.res[s]=clamp(G.res[s]);
  modal(ic,el("h2",null,e.n),el("p",null,e.t),el("p","dim",e.l),late,btn("Continue","go",()=>{closeModal();done()}));
}
function storm(done,late,ic){
  let saved=0,t=0,over=false,iv=0;
  const arena=el("div","arena"),bar=el("div","bar"),f=el("i"),crew=[];bar.append(f);
  const place=b=>{b.style.left=(rnd()*80)+"%";b.style.top=(rnd()*65)+"%"};
  for(let i=0;i<4;i++){const b=el("button","crew");b.type="button";b.setAttribute("aria-label","Shelter astronaut");b.append(icon("astro",34));
    b.onclick=()=>{if(b.disabled)return;b.disabled=true;b.textContent="Safe";saved++;tone(740,.1);if(saved===4)end()};place(b);arena.append(b);crew.push(b)}
  function end(){
    if(over)return;over=true;clearInterval(iv);const r=G.res;
    r.rad+=(3+18*(1-r.shield/100))*(1-saved*.15);
    modal(ic,el("h2",null,saved===4?"Everyone is safe":"Sheltered "+saved+" of 4"),el("p","dim","Shields block space radiation."),late,btn("Continue","go",()=>{closeModal();done()}));
  }
  modal(ic,el("h2",null,"Solar storm! Tap the crew to shelter"),arena,bar);
  iv=setInterval(()=>{t+=100;f.style.width=(100-t/50)+"%";if(!calm&&t%800===0)crew.forEach(b=>{if(!b.disabled)place(b)});if(t>=5000)end()},100);
}
function roll(){
  const ch=G.day<2?0:Math.min(.6,.2+G.day*.03)*(G.lvl==="easy"?.7:1);
  if(rnd()<ch){G.next=EV[Math.floor(rnd()*EV.length)];G.warn=G.site==="moon"||rnd()<.4}
}
function after(){
  const r=G.res;let why=null;
  if(r.power<=0)why=["power","Blackout","Everything needs power."];
  else if(r.o2<=0)why=["air","Out of air","Make air every day."];
  else if(r.food<=0)why=["food","Out of food","Plants take time to grow."];
  else if(r.rad>=100)why=["rad","Radiation limit reached","Shield every day."];
  if(why)return finish(false,why);
  if(G.day>=DAYS)return finish(true,["shield","Mission success","You balanced every trade-off."]);
  roll();G.day++;$("#fact").textContent="Fact: "+FACTS[G.day%FACTS.length];render();story();
}
function finish(win,w){
  const r=G.res;
  const score=Math.round(G.sci+(win?r.power+r.o2+r.food+r.shield+(100-Math.min(100,r.rad))+DAYS*10:G.day*10));
  const oe=$("#oe");oe.textContent="";oe.append(icon(w[0],56));
  $("#ot").textContent=w[1];$("#ol").textContent=w[2];$("#os").textContent=score+" pts";
  const st=1+(score>=450)+(score>=600);$("#ostars").textContent=win?"★".repeat(st)+"☆".repeat(3-st):"";
  $("#ol").textContent=w[2]+(win?" Rank: "+["Cadet","Flight Engineer","Mission Commander"][st-1]:" The crew launched early and is safe. Try a new plan.");
  const tot=Object.values(G.hrs).reduce((a,b)=>a+b,0)||1,d=$("#od");d.textContent="";
  for(const k of TASKS)d.append(el("span","dim",k.n+" "+Math.round(100*G.hrs[k.k]/tot)+"%"));
  const b=loadBest();if(!b||score>b.s){saveBest(score,G.name);bestLine()}
  cinema("launch",win?"Mission complete. Heading home.":"Emergency launch. Crew is safe.",()=>{show("over");chart();tone(win?880:160,.5)});
}
function chart(){
  const c=$("#chart"),x=c.getContext("2d"),W=c.width,Ht=c.height;x.clearRect(0,0,W,Ht);
  x.strokeStyle="#23459f";x.lineWidth=1;x.strokeRect(.5,.5,W-1,Ht-1);
  STATS.forEach((s,j)=>{x.strokeStyle=s.c;x.lineWidth=3;x.beginPath();
    G.hist.forEach((h,i)=>{const px=10+i*(W-20)/Math.max(1,G.hist.length-1),py=Ht-8-(clamp(h[j])/100)*(Ht-16);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()});
  $("#leg").textContent="Power (gold), Air (cyan), Food (green), Shield (purple), Radiation (red). Days 1 to "+G.hist.length+".";
}
function bestLine(){const b=loadBest();$("#best").textContent=b?"Best score: "+b.s+" by "+b.n:"No best score yet"}
function start(){
  G={site,lvl,name:clean($("#cs").value),day:1,sci:0,busy:false,chap:"",chn:0,
     res:lvl==="easy"?{power:75,o2:85,food:85,shield:45,rad:0}:{power:60,o2:70,food:70,shield:30,rad:0},
     alloc:{solar:3,life:2,farm:1,shield:1,sci:1},hrs:{solar:0,life:0,farm:0,shield:0,sci:0},next:null,warn:false,hist:[]};
  wt=0;boost=0;dust=0;meteors=[];build();
  $("#fact").textContent="Fact: "+FACTS[0];
  cinema("land","Landing on "+(G.site==="moon"?"the Moon":"Mars"),()=>{show("game");render();story()});
}

/* wiring */
function pickGroup(sel,key,set){document.querySelectorAll(sel).forEach(b=>b.onclick=()=>{set(b.dataset[key]);document.querySelectorAll(sel).forEach(x=>x.setAttribute("aria-pressed",String(x===b)))})}
pickGroup(".pick","site",v=>{site=v});pickGroup(".lvl","lvl",v=>{lvl=v});
$("#start").onclick=start;$("#end").onclick=go;
const home=()=>{G=null;show("menu");bestLine()};$("#quit").onclick=home;$("#again").onclick=home;
/* theme (dark or light) and the How to play guide */
function setTheme(t,save){document.documentElement.dataset.theme=t;$("#thm").textContent="Theme: "+(t==="light"?"Light":"Dark");if(save)try{localStorage.setItem(TKEY,t)}catch(e){}}
let th="dark";try{if(localStorage.getItem(TKEY)==="light")th="light"}catch(e){}
setTheme(th);
$("#thm").onclick=()=>setTheme(document.documentElement.dataset.theme==="light"?"dark":"light",1);
$("#howb").onclick=()=>{$("#help").hidden=false;$("#helpx").focus()};
$("#helpx").onclick=()=>{$("#help").hidden=true;$("#howb").focus()};
addEventListener("keydown",e=>{if(e.key==="Escape")$("#help").hidden=true});
$("#snd").onclick=()=>{if(!ac){try{ac=new AudioContext()}catch(e){return}}mute=!mute;$("#snd").textContent=mute?"Sound off":"Sound on";$("#snd").setAttribute("aria-pressed",String(!mute));tone(660)};
addEventListener("keydown",e=>{
  if(!G||$("#game").hidden||!$("#modal").hidden||!$("#help").hidden||G.busy||e.target.tagName==="INPUT")return;
  const m=/^Digit([1-5])$/.exec(e.code);
  if(m){const k=TASKS[m[1]-1].k;if(e.shiftKey?G.alloc[k]>0:used()<H){G.alloc[k]+=e.shiftKey?-1:1;tone(e.shiftKey?420:660);render()}}
  else if(e.code==="KeyE")go();
});
bestLine();

/* page starfield + shooting stars */
(function(){
  const c=$("#sky"),x=c.getContext("2d");let W,Hh,stars=[],ms=[];
  function size(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;Hh=innerHeight;c.width=W*d;c.height=Hh*d;x.setTransform(d,0,0,d,0,0);
    stars=Array.from({length:Math.round(W*Hh/5500)},()=>({x:Math.random()*W,y:Math.random()*Hh,r:Math.random()*1.4+.3,p:Math.random()*6.28,s:Math.random()*1.5+.4}))}
  function frame(t){
    x.clearRect(0,0,W,Hh);
    for(const s of stars){x.globalAlpha=calm?.7:.35+.65*Math.abs(Math.sin(t/1000*s.s+s.p));x.fillStyle="#fff";x.beginPath();x.arc(s.x,s.y,s.r,0,6.283);x.fill()}
    if(!calm){
      if(Math.random()<.012&&ms.length<4){const a=Math.PI/5+Math.random()*.3,v=8+Math.random()*6;ms.push({x:Math.random()*W*1.2,y:-20,vx:-Math.cos(a)*v,vy:Math.sin(a)*v,l:1})}
      ms=ms.filter(m=>m.l>0&&m.y<Hh+60&&m.x>-80);
      for(const m of ms){const tx=m.x-m.vx*7,ty=m.y-m.vy*7,g=x.createLinearGradient(m.x,m.y,tx,ty);
        g.addColorStop(0,"rgba(255,255,255,"+m.l+")");g.addColorStop(1,"rgba(120,160,255,0)");
        x.globalAlpha=1;x.strokeStyle=g;x.lineWidth=2;x.beginPath();x.moveTo(m.x,m.y);x.lineTo(tx,ty);x.stroke();m.x+=m.vx;m.y+=m.vy;m.l-=.004}
      if(!document.hidden)requestAnimationFrame(frame)
    }
  }
  addEventListener("resize",()=>{size();if(calm)frame(0)});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!calm)requestAnimationFrame(frame)});
  size();requestAnimationFrame(frame);
})();
