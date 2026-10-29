/* RIXU v3 — runs in <head>: decide once per visit whether the RIXU intro plays (≤1s, skippable). */
(function(){var R=document.documentElement,skip=false;
try{skip=sessionStorage.getItem("rx_intro")==="1";sessionStorage.setItem("rx_intro","1")}catch(e){}
if(/^#p-/.test(location.hash)||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))skip=true;
R.classList.add(skip?"rx-nointro":"rx-introon");})();
