/* RIXU Picks — category page motion: reveal, image skeletons, counter. Off for reduced motion. */
(function(){"use strict";var d=document,R=d.documentElement;
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var IO="IntersectionObserver" in window;if(!IO)return;R.classList.add("mo");
d.querySelectorAll(".ph img").forEach(function(i){var w=i.parentNode;var ok=function(){w.classList.add("ld")};if(i.complete)ok();else{i.addEventListener("load",ok,{once:true});i.addEventListener("error",ok,{once:true})}});
setTimeout(function(){d.querySelectorAll(".ph img").forEach(function(i){if(i.complete)i.parentNode.classList.add("ld")})},6000);
var b=0,bt=0,cards=d.querySelectorAll(".card");
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var c=e.target;io.unobserve(c);c.style.setProperty("--d",Math.min(b++,5)*70+"ms");clearTimeout(bt);bt=setTimeout(function(){b=0},120);c.classList.add("vis")})},{rootMargin:"0px 0px -6% 0px",threshold:.08});
var vio=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("iv",e.isIntersecting)})});
cards.forEach(function(c){io.observe(c);vio.observe(c)});
setTimeout(function(){cards.forEach(function(c){var r=c.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)c.classList.add("vis")})},4000);
d.querySelectorAll(".chips .chip").forEach(function(c,i){c.style.setProperty("--i",Math.min(i,12))});
var on=d.querySelector(".chips .chip.on");if(on){var row=on.parentNode;row.scrollLeft=on.offsetLeft-(row.clientWidth-on.offsetWidth)/2}
var n=d.getElementById("cnum");if(n){var N=+n.textContent,t0=0;n.textContent="0";var st=function(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1100),e=1-Math.pow(1-k,3);n.textContent=Math.round(N*e);if(k<1)requestAnimationFrame(st)};setTimeout(function(){requestAnimationFrame(st)},300)}
})();
