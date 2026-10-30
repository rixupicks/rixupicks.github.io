/* RIXU 360° angle view — drag/swipe through the product's real Meesho photos with smooth crossfades.
   Honest: an angle view built from the seller's photos, not a 3D model. Only for products with 2+ real photos.
   Also adds "Outfit Banao" shortcut on product pages for tops/bottoms. Vanilla, rAF only while moving. */
(function () {
  "use strict";
  var d = document, pd = d.querySelector("section.pd");
  if (!pd || typeof PRODUCTS === "undefined") return;
  var SPIN = typeof RX_SPIN !== "undefined" ? RX_SPIN : {}, OUT = {};
  if (typeof RX_OUTFIT !== "undefined") RX_OUTFIT.items.forEach(function (r) { OUT[r[0]] = r[1]; });
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var keyOf = function (img) { return img.replace(/^img\//, "").replace(/\.\w+$/, ""); };
  var byKey = {}; PRODUCTS.forEach(function (p) { byKey[keyOf(p.img)] = p; });
  var cur = null;

  function product() { var m = /^#p-(.+)$/.exec(location.hash); return m ? byKey[decodeURIComponent(m[1])] : null; }
  function enhance() {
    var gal = pd.querySelector(".pd-gal"); if (!gal || gal.dataset.sp) return; gal.dataset.sp = "1";
    var p = product(); if (!p) return;
    var fr = SPIN[p.img];
    if (fr && fr.length > 1) {
      var b = d.createElement("button"); b.type = "button"; b.className = "sp-btn"; b.setAttribute("aria-label", "360 degree angle view: drag to rotate through " + fr.length + " photos");
      b.innerHTML = '<span class="sp-ic" aria-hidden="true">⟲</span>360° <span class="sp-ar" aria-hidden="true">↔</span> drag';
      b.addEventListener("click", function (e) { e.stopPropagation(); open(gal, fr, p); });
      gal.appendChild(b);
    }
    var role = OUT[p.img];
    if (role === "t" || role === "b") {
      var help = pd.querySelector(".pd-help");
      if (help && !pd.querySelector(".sp-ob")) { var a = d.createElement("a"); a.className = "pd-help sp-ob"; a.href = "outfit.html?p=" + encodeURIComponent(keyOf(p.img)); a.textContent = role === "t" ? "👕 Outfit Banao: is top ke saath kya pehne?" : "👖 Outfit Banao: is bottom ke saath kaunsa top?"; help.parentNode.insertBefore(a, help); }
    }
  }
  function open(gal, fr, p) {
    close();
    var v = d.createElement("div"); v.className = "sp-v"; v.setAttribute("role", "slider"); v.setAttribute("tabindex", "0");
    v.setAttribute("aria-label", "360° angle view of " + p.name + " — " + fr.length + " real photos"); v.setAttribute("aria-valuemin", "1"); v.setAttribute("aria-valuemax", String(fr.length));
    v.innerHTML = '<div class="sp-st">' + fr.map(function (s, i) { return '<img src="' + s + '" alt="" draggable="false" decoding="async"' + (i ? "" : ' class="a"') + ">"; }).join("") + "</div>" +
      '<div class="sp-top"><span class="sp-lb">360° angle view</span><button type="button" class="sp-x" aria-label="Close 360 view">✕</button></div>' +
      '<div class="sp-hint" aria-hidden="true"><span class="sp-hand">👆</span> ↔ drag karo</div>' +
      '<div class="sp-bot"><div class="sp-tr"><i></i></div><span class="sp-n">1/' + fr.length + '</span></div>' +
      '<p class="sp-hon">Meesho ki ' + fr.length + ' asli photos se bana angle view — 3D model nahi</p>';
    gal.appendChild(v); gal.classList.add("sp-on");
    var imgs = [].slice.call(v.querySelectorAll(".sp-st img")), n = imgs.length, bar = v.querySelector(".sp-tr i"), cnt = v.querySelector(".sp-n");
    var pos = 0, vel = 0, drag = false, sx = 0, sp = 0, lastX = 0, lastT = 0, raf = 0, auto = !REDUCE, touched = false, moved = 0, W = gal.clientWidth || 360, lockY = false, sy = 0;
    var perPx = n / (W * 1.15); // one full sweep across ~the width = one full turn
    function wrap(x) { return ((x % n) + n) % n; }
    function paint() {
      var x = wrap(pos), a = Math.floor(x), b = (a + 1) % n, f = x - a, e = f * f * (3 - 2 * f);
      for (var i = 0; i < n; i++) { var s = imgs[i].style;
        if (i === a) { s.opacity = 1; s.zIndex = 1; s.transform = "translate3d(" + (-e * 14).toFixed(1) + "px,0,0) scale(" + (1 - e * .03).toFixed(3) + ")"; }
        else if (i === b && f > .001) { s.opacity = e.toFixed(3); s.zIndex = 2; s.transform = "translate3d(" + ((1 - e) * 14).toFixed(1) + "px,0,0) scale(" + (.97 + e * .03).toFixed(3) + ")"; }
        else { s.opacity = 0; s.zIndex = 0; } }
      var k = Math.round(x) % n; bar.style.transform = "scaleX(" + ((x + 1) / n).toFixed(3) + ")"; cnt.textContent = (k + 1) + "/" + n; v.setAttribute("aria-valuenow", String(k + 1));
    }
    function loop() {
      raf = 0;
      if (!drag) {
        if (auto) { pos += .012; if (pos >= n) { pos = 0; auto = false; } }
        else if (Math.abs(vel) > .0004) { pos += vel * 16; vel *= .92; }
        else { var tgt = Math.round(pos), dd = tgt - pos; if (Math.abs(dd) > .002) pos += dd * .18; else { pos = tgt; paint(); return; } }
      }
      paint(); raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    function down(e) { if (e.button > 0) return; drag = true; auto = false; sx = lastX = e.clientX; sy = e.clientY; sp = pos; lastT = e.timeStamp; vel = 0; moved = 0; lockY = false; }
    function move(e) {
      if (!drag) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && !lockY && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { lockY = true; drag = false; return; }
      if (Math.abs(dx) > 4 && !moved) { moved = 1; try { v.setPointerCapture(e.pointerId); } catch (er) {} if (!touched) { touched = true; v.classList.add("sp-used"); } }
      pos = sp - dx * perPx; var dt = Math.max(1, e.timeStamp - lastT); vel = -(e.clientX - lastX) * perPx / dt; lastX = e.clientX; lastT = e.timeStamp; kick();
    }
    function up(e) { if (!drag) return; drag = false; if (!moved) { auto = false; vel = 0; pos = Math.round(pos) + 1; } kick(); }
    v.addEventListener("pointerdown", down); v.addEventListener("pointermove", move); v.addEventListener("pointerup", up); v.addEventListener("pointercancel", up);
    v.addEventListener("click", function (e) { e.stopPropagation(); });
    v.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { auto = false; pos = Math.round(pos) + 1; kick(); e.preventDefault(); } if (e.key === "ArrowLeft") { auto = false; pos = Math.round(pos) - 1; kick(); e.preventDefault(); } if (e.key === "Escape") close(); });
    v.querySelector(".sp-x").addEventListener("click", function (e) { e.stopPropagation(); close(); });
    paint();
    // start the gentle auto-turn once the next photo is decoded (no blank frames on slow data)
    var nx = imgs[1]; if (auto) { if (nx.complete) kick(); else { nx.addEventListener("load", kick, { once: true }); nx.addEventListener("error", kick, { once: true }); } }
    cur = { v: v, gal: gal, stop: function () { if (raf) cancelAnimationFrame(raf); raf = 0; } };
    setTimeout(function () { try { v.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }
  function close() { if (!cur) return; cur.stop(); cur.gal.classList.remove("sp-on"); if (cur.v.parentNode) cur.v.parentNode.removeChild(cur.v); cur = null; }
  new MutationObserver(function () { if (!pd.querySelector(".sp-v")) cur = null; enhance(); }).observe(pd, { childList: true });
  window.addEventListener("hashchange", function () { if (!/^#p-/.test(location.hash)) close(); });
  enhance();
})();
