/* RIXU FX — particle intro: "RIXU PICKS" assembles from sparks (~1.2s, once per session, tap to skip). */
(function(){var d=document,R=d.documentElement,box=d.getElementById("rx-intro");
if(!box||!R.classList.contains("rx-introon")||!R.classList.contains("sig"))return;
var cv=d.createElement("canvas");if(!cv.getContext)return;var x=cv.getContext("2d");if(!x)return;
cv.className="sig-ic";cv.setAttribute("aria-hidden","true");box.insertBefore(cv,box.firstChild);R.classList.add("sig-pi");
var W=innerWidth,H=innerHeight,dpr=Math.min(window.devicePixelRatio||1,R.classList.contains("sig-low")?1:1.75);
cv.width=W*dpr|0;cv.height=H*dpr|0;cv.style.width=W+"px";cv.style.height=H+"px";x.scale(dpr,dpr);
var P=[],t0=0,dead=false,F='"RixuD","Impact","Arial Black",sans-serif';
function sample(){var o=d.createElement("canvas"),ow=W,oh=H;o.width=ow;o.height=oh;var g=o.getContext("2d");
 var big=Math.min(W*.30,200),sm=Math.max(13,big*.2),cy=H*.47;g.textAlign="center";g.textBaseline="middle";
 g.fillStyle="#f00";g.font="400 "+big+"px "+F;g.fillText("RIXU",W/2,cy);
 g.fillStyle="#00f";g.font="400 "+sm+"px "+F;var tx="P  I  C  K  S";g.fillText(tx,W/2,cy+big*.62);
 var data=g.getImageData(0,0,ow,oh).data,step=Math.max(3,Math.round(big/(R.classList.contains("sig-low")?26:38))),pts=[];
 for(var yy=0;yy<oh;yy+=step)for(var xx=0;xx<ow;xx+=step){var i=(yy*ow+xx)*4;if(data[i+3]>140)pts.push([xx,yy,data[i]>data[i+2]?0:1])}
 var cap=R.classList.contains("sig-low")?520:1100;while(pts.length>cap)pts.splice((Math.random()*pts.length)|0,1);
 var C=["#c8ff2e","#f3eee3"];pts.forEach(function(p,k){var a=Math.random()*6.283,r=Math.max(W,H)*(.45+Math.random()*.5);
  P.push({tx:p[0],ty:p[1],sx:W/2+Math.cos(a)*r,sy:H/2+Math.sin(a)*r,c:p[2],dl:Math.random()*260,sw:(Math.random()-.5)*120,s:step>3?2.2:1.8,ex:Math.cos(a),ey:Math.sin(a),ev:2+Math.random()*7})});
 P.cols=C;P.big=big;P.cy=cy;P.sm=sm}
function eo(k){return k>=1?1:1-Math.pow(2,-10*k)}
function frame(t){if(dead)return;if(!t0)t0=t;var e=t-t0;x.clearRect(0,0,W,H);
 var cols=P.cols,glow=e>780&&e<1250;
 for(var c=0;c<2;c++){x.fillStyle=cols[c];x.beginPath();
  for(var i=0;i<P.length;i++){var p=P[i];if(p.c!==c)continue;var px,py,k=(e-p.dl)/620;
   if(e<1050){k=k<0?0:k>1?1:k;var q=eo(k),sw=Math.sin(k*3.1416)*p.sw;px=p.sx+(p.tx-p.sx)*q+sw*p.ey;py=p.sy+(p.ty-p.sy)*q-sw*p.ex}
   else{var b=(e-1050)/1;px=p.tx+p.ex*p.ev*b*.06;py=p.ty+p.ey*p.ev*b*.06+b*b*.00012*H}
   x.rect(px,py,p.s,p.s)}x.fill()}
 if(glow){var a=Math.min(1,(e-780)/140)*(e>1050?Math.max(0,1-(e-1050)/200):1);x.globalAlpha=a;x.textAlign="center";x.textBaseline="middle";
  x.fillStyle="#c8ff2e";x.shadowColor="rgba(200,255,46,.7)";x.shadowBlur=24;x.font="400 "+P.big+"px "+F;x.fillText("RIXU",W/2,P.cy);x.shadowBlur=0;
  x.fillStyle="#f3eee3";x.font="400 "+P.sm+"px "+F;x.fillText("P  I  C  K  S",W/2,P.cy+P.big*.62);
  var sx=((e-780)/420)*(W+200)-100;var gr=x.createLinearGradient(sx-60,0,sx+60,0);gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(.5,"rgba(255,255,255,.85)");gr.addColorStop(1,"rgba(255,255,255,0)");
  x.globalCompositeOperation="source-atop";x.fillStyle=gr;x.fillRect(sx-60,P.cy-P.big*.6,120,P.big*1.5);x.globalCompositeOperation="source-over";x.globalAlpha=1}
 if(e<1500)requestAnimationFrame(frame)}
function go(){if(dead)return;sample();requestAnimationFrame(frame)}
function stop(){dead=true}
box.addEventListener("click",stop);
var started=false,st=function(){if(!started){started=true;go()}};
try{if(d.fonts&&d.fonts.load){d.fonts.load('400 100px "RixuD"').then(st,st);setTimeout(st,160)}else st()}catch(e){st()}
})();
