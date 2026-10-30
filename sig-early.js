/* RIXU FX — head: page-wipe arrival + feature gate. Tiny, sync. */
(function(){var R=document.documentElement,m=window.matchMedia;
if(m&&m("(prefers-reduced-motion: reduce)").matches)return;
R.classList.add("sig");
try{if(sessionStorage.getItem("sig_wipe")==="1"){sessionStorage.removeItem("sig_wipe");R.classList.add("sig-arrive");setTimeout(function(){R.classList.remove("sig-arrive")},900)}}catch(e){}
var n=navigator,low=(n.connection&&n.connection.saveData)||((n.deviceMemory||4)<=2&&(n.hardwareConcurrency||4)<=4);if(low)R.classList.add("sig-low");})();
