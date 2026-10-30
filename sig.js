/* RIXU FX — signature layer: spark trail, Meesho confetti, dealt cards, heading scramble, magnetic CTA, page wipe.
   One shared canvas, rAF only while something is alive. Never blocks a tap or a link. Off for reduced motion. */
(function(){"use strict";var d=document,R=d.documentElement,w=window;
if(!R.classList.contains("sig"))return;
var LOW=R.classList.contains("sig-low"),FINE=w.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches;

/* ---------- shared fx canvas ---------- */
var cv=null,x=null,W=0,H=0,dpr=1,P=[],run=false,MAX=LOW?90:220;
function ensure(){if(cv)return true;cv=d.createElement("canvas");if(!cv.getContext)return false;x=cv.getContext("2d");if(!x)return false;
 cv.className="sig-fx";cv.setAttribute("aria-hidden","true");d.body.appendChild(cv);size();w.addEventListener("resize",size,{passive:true});return true}
function size(){dpr=Math.min(w.devicePixelRatio||1,LOW?1:1.5);W=innerWidth;H=innerHeight;cv.width=W*dpr|0;cv.height=H*dpr|0;x.setTransform(dpr,0,0,dpr,0,0)}
function add(p){if(P.length>=MAX)P.shift();P.push(p);if(!run){run=true;requestAnimationFrame(tick)}}
var last=0;
function tick(t){var dt=last?Math.min(40,t-last):16;last=t;x.clearRect(0,0,W,H);
 for(var i=P.length-1;i>=0;i--){var p=P[i];p.l-=dt;if(p.l<=0){P.splice(i,1);continue}
  var k=p.l/p.L;p.vy+=p.g*dt;p.vx*=p.f;p.vy*=p.f;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
  x.globalAlpha=k<.3?k/.3:1;x.fillStyle=p.c;
  if(p.t===0){star(p.x,p.y,p.s*(.4+.6*k),p.r)}
  else if(p.t===1){x.save();x.translate(p.x,p.y);x.rotate(p.r);x.scale(1,Math.cos(p.r*1.7));x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()}
  else{x.beginPath();x.arc(p.x,p.y,p.s*(1.6-k),0,6.283);x.strokeStyle=p.c;x.lineWidth=1.6*k;x.stroke()}}
 x.globalAlpha=1;if(P.length)requestAnimationFrame(tick);else{run=false;last=0;x.clearRect(0,0,W,H)}}
function star(px,py,s,r){x.save();x.translate(px,py);x.rotate(r);x.beginPath();
 x.moveTo(0,-s);x.quadraticCurveTo(0,0,s,0);x.quadraticCurveTo(0,0,0,s);x.quadraticCurveTo(0,0,-s,0);x.quadraticCurveTo(0,0,0,-s);x.fill();x.restore()}
var SPK=["#c8ff2e","#e4ff8f","#ffffff","#ff4f8b"],CONF=["#c8ff2e","#ff5a36","#ff4f8b","#f3eee3","#ffffff","#7c5cff"];
function rnd(a,b){return a+Math.random()*(b-a)}

/* ---------- 1. spark trail (finger drag / cursor) ---------- */
if(!LOW){var lt=0,lx=-1,ly=-1;
 var trail=function(px,py){var n=performance.now();if(n-lt<(FINE?22:30))return;lt=n;
  if(lx>=0&&Math.abs(px-lx)+Math.abs(py-ly)<6)return;lx=px;ly=py;if(!ensure())return;
  add({t:0,x:px+rnd(-4,4),y:py+rnd(-4,4),vx:rnd(-.03,.03),vy:rnd(-.06,.01),g:.00012,f:.985,r:rnd(0,1.5),vr:rnd(-.004,.004),s:rnd(3,6.5),c:SPK[(Math.random()*SPK.length)|0],l:520,L:520})};
 if(FINE)d.addEventListener("pointermove",function(e){if(e.pointerType==="mouse")trail(e.clientX,e.clientY)},{passive:true});
 d.addEventListener("touchmove",function(e){var t=e.touches&&e.touches[0];if(t)trail(t.clientX,t.clientY)},{passive:true});
 d.addEventListener("pointerdown",function(e){if(!ensure())return;var cx=e.clientX,cy=e.clientY;
  add({t:2,x:cx,y:cy,vx:0,vy:0,g:0,f:1,r:0,vr:0,s:14,c:"rgba(200,255,46,.9)",l:380,L:380});
  for(var i=0;i<5;i++){var a=i/5*6.283+rnd(0,.6),v=rnd(.12,.22);add({t:0,x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,f:.93,r:a,vr:.01,s:rnd(3,5),c:SPK[i%4],l:420,L:420})}},{passive:true});
}

/* ---------- 2. confetti on Buy on Meesho (never blocks the link) ---------- */
function boom(el,ev){if(!ensure())return;var r=el.getBoundingClientRect(),cx=ev&&ev.clientX?ev.clientX:r.left+r.width/2,cy=ev&&ev.clientY?ev.clientY:r.top+r.height/2,n=LOW?26:56;
 for(var i=0;i<n;i++){var a=rnd(-Math.PI*.95,-Math.PI*.05),v=rnd(.35,.85);
  add({t:1,x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:.0016,f:.975,r:rnd(0,6),vr:rnd(-.02,.02),s:rnd(6,11),c:CONF[i%CONF.length],l:rnd(900,1400),L:1400})}
 for(var j=0;j<8;j++){var b=j/8*6.283;add({t:0,x:cx,y:cy,vx:Math.cos(b)*.3,vy:Math.sin(b)*.3,g:0,f:.9,r:b,vr:.02,s:7,c:"#ffffff",l:360,L:360})}
 if(navigator.vibrate)try{navigator.vibrate(12)}catch(e){}}
d.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href*="meesho"],.buy,.pd-buy,.cbuy');if(a)boom(a,e)},{capture:true,passive:true});

/* ---------- 3. cards dealt like a hand of cards ---------- */
var io=null;
function prep(c){if(c.__sig)return;c.__sig=1;var r=c.getBoundingClientRect(),left=(r.left+r.width/2)<innerWidth/2;
 c.style.setProperty("--sdx",(left?-1:1)*rnd(18,30)+"px");c.style.setProperty("--srz",(left?-1:1)*rnd(6,11)+"deg");c.style.setProperty("--sry",(left?-80:80)+"deg");
 if(io)io.observe(c)}
if("IntersectionObserver" in w){io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var c=e.target;io.unobserve(c);
  var dl=parseFloat(getComputedStyle(c).getPropertyValue("--d"))||0;setTimeout(function(){c.classList.add("sig-dn")},dl+1400)})},{threshold:.05});
 var scan=function(){d.querySelectorAll(".card").forEach(prep)};scan();
 var g=d.getElementById("grid")||d.querySelector(".grid");if(g&&w.MutationObserver)new MutationObserver(function(){scan()}).observe(g,{childList:true});}

/* ---------- 4. heading scramble (width locked: zero layout shift) ---------- */
var GL="RIXU#$%&@!*<>/\\=+01✦";
function scramble(h){if(h.__sc)return;h.__sc=1;var tn=null;for(var k=0;k<h.childNodes.length;k++){var n=h.childNodes[k];if(n.nodeType===3&&n.nodeValue.trim().length>2){tn=n;break}}
 if(!tn)return;var txt=tn.nodeValue,lh=parseFloat(getComputedStyle(h).lineHeight)||40;if(h.getBoundingClientRect().height>lh*1.7)return;
 var sp=d.createElement("span");sp.className="sig-sc";sp.textContent=txt;tn.parentNode.replaceChild(sp,tn);var wd=sp.getBoundingClientRect().width;sp.style.width=wd+"px";
 var chars=Array.from(txt),N=chars.length,t0=0,dur=Math.min(900,300+N*28);
 var f=function(t){if(!t0)t0=t;var k=(t-t0)/dur;if(k>=1){var tx=d.createTextNode(txt);sp.parentNode.replaceChild(tx,sp);return}
  var out="";for(var i=0;i<N;i++){var ch=chars[i];if(!/[A-Za-z0-9]/.test(ch)||i/N<k*1.15-.15){out+=ch.replace(/[&<]/g,function(m){return m==="&"?"&amp;":"&lt;"})}else{var gch=GL.charAt((Math.random()*GL.length)|0);out+='<span class="sig-g">'+(gch==="<"?"&lt;":gch==="&"?"&amp;":gch)+"</span>"}}
  sp.innerHTML=out;requestAnimationFrame(f)};requestAnimationFrame(f)}
if("IntersectionObserver" in w){var hio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){hio.unobserve(e.target);setTimeout(function(){scramble(e.target)},120)}})},{threshold:.6});
 var hs=function(){d.querySelectorAll("h2.rx-ht,h2.sec,.hrow-h h2,.hero h1,.rx-sec h2").forEach(function(h){if(!h.__hq){h.__hq=1;hio.observe(h)}})};hs();setTimeout(hs,1500);setTimeout(hs,4000)}

/* ---------- 5. magnetic Shop button ---------- */
d.querySelectorAll("#hxshop,.rx-btn").forEach(function(b){b.classList.add("sig-mag");
 if(FINE){b.addEventListener("pointermove",function(e){var r=b.getBoundingClientRect(),mx=e.clientX-r.left-r.width/2,my=e.clientY-r.top-r.height/2;b.classList.add("sig-pull");
   b.style.transform="translate("+mx*.28+"px,"+my*.38+"px)";var s=b.firstElementChild;if(s)s.style.transform="translate("+mx*.12+"px,"+my*.12+"px)"});
  b.addEventListener("pointerleave",function(){b.classList.remove("sig-pull");b.style.transform="";var s=b.firstElementChild;if(s)s.style.transform=""})}
 else{b.addEventListener("touchstart",function(e){var t=e.touches[0],r=b.getBoundingClientRect();b.classList.add("sig-pull");b.style.transform="translate("+(t.clientX-r.left-r.width/2)*.12+"px,"+(t.clientY-r.top-r.height/2)*.2+"px) scale(.96)"},{passive:true});
  var rel=function(){b.classList.remove("sig-pull");b.style.transform=""};b.addEventListener("touchend",rel,{passive:true});b.addEventListener("touchcancel",rel,{passive:true})}});

/* ---------- 6. page-transition wipe between home and category pages ---------- */
d.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a||a.target&&a.target!=="_self"||a.hasAttribute("download"))return;
 var u;try{u=new URL(a.getAttribute("href"),location.href)}catch(_){return}
 if(u.origin!==location.origin||/meesho/.test(u.href))return;
 if(u.pathname===location.pathname)return; /* same page / hash links stay instant */
 if(!/(\/|\.html)$/.test(u.pathname))return;
 e.preventDefault();var wp=d.createElement("div");wp.className="sig-wipe";wp.setAttribute("aria-hidden","true");wp.innerHTML="<i></i><i></i><b>RIXU<em>PICKS</em></b>";d.body.appendChild(wp);
 try{sessionStorage.setItem("sig_wipe","1")}catch(_){}
 var went=false,go=function(){if(went)return;went=true;location.href=u.href};setTimeout(go,520);});
w.addEventListener("pageshow",function(e){if(e.persisted){d.querySelectorAll(".sig-wipe").forEach(function(n){n.remove()});R.classList.remove("sig-arrive")}});
})();
