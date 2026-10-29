/* RIXU Picks — motion layer: skeletons, card states, fly-to-cart, product page + filter transitions, hero counter.
   Vanilla, no deps. Only transforms/opacity animate; everything waits for IntersectionObserver and stops for reduced motion. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in window;
  if (RM) return;                       // reduced motion: the site stays exactly as it is, static
  root.classList.add("mo");

  /* ---------- image skeleton → fade-in (cards, cart, product page) ---------- */
  function done(img) { var w = img.closest(".ph,.mo-sk"); if (w) w.classList.add("ld"); }
  function watchImgs(scope) {
    (scope || d).querySelectorAll(".ph img").forEach(function (img) {
      if (img.complete) { done(img); return; }
      img.addEventListener("load", function () { done(img); }, { once: true });
      img.addEventListener("error", function () { done(img); }, { once: true });
    });
  }
  watchImgs();
  // safety net: never leave a photo hidden
  setTimeout(function () { d.querySelectorAll(".ph img").forEach(function (i) { if (i.complete) done(i); }); }, 6000);

  /* ---------- cards: in-view flag (loops only run on screen) ---------- */
  var grid = d.getElementById("grid");
  if (IO && grid) {
    var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("iv", e.isIntersecting); }); }, { rootMargin: "40px 0px" });
    grid.querySelectorAll(".card").forEach(function (c) { vio.observe(c); });
  }

  /* ---------- one-shot reveal helper ---------- */
  function onceVisible(el, fn, margin) {
    if (!el) return;
    if (!IO) { fn(el); return; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { o.disconnect(); fn(el); } }); }, { rootMargin: margin || "0px 0px -8% 0px" });
    o.observe(el);
  }
  function stagger(box) { if (!box) return; Array.prototype.forEach.call(box.children, function (c, i) { c.style.setProperty("--i", Math.min(i, 10)); }); }

  // chips + category circles cascade in when they first come on screen
  ["chips", "circles"].forEach(function (id) { var b = d.getElementById(id); stagger(b); onceVisible(b, function (el) { el.classList.add("go"); setTimeout(function () { el.classList.remove("go"); }, 1400); }, "0px"); });

  // sections that are still below the fold slide up as you reach them
  d.querySelectorAll(".hrow, footer, .qf, h2.sec, .why, .faq").forEach(function (el) {
    if (el.classList.contains("rv") || el.closest(".pd")) return;
    var r = el.getBoundingClientRect(); if (r.top < innerHeight) return;
    el.classList.add("mo-rv");
    onceVisible(el, function (x) { x.classList.add("vis"); });
  });

  /* ---------- hero counter: counts up to the real product count ---------- */
  var hc = d.getElementById("hxcount");
  if (hc && typeof PRODUCTS !== "undefined") {
    var N = PRODUCTS.length, t0 = 0, dur = 1400;
    hc.textContent = "0";
    var step = function (t) {
      if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      hc.textContent = Math.round(N * e);
      if (k < 1) requestAnimationFrame(step); else { hc.textContent = N; hc.classList.add("tick"); }
    };
    setTimeout(function () { requestAnimationFrame(step); }, 350);
  }

  /* ---------- fly to cart ---------- */
  function findImg(btn) {
    var n = btn, img = null;
    for (var k = 0; k < 6 && n && !img; k++) { n = n.parentElement; if (n) img = n.querySelector("img"); }
    return img;
  }
  function bump(el) { if (!el) return; el.classList.remove("mo-bump"); void el.offsetWidth; el.classList.add("mo-bump"); setTimeout(function () { el.classList.remove("mo-bump"); }, 600); }
  function cartTarget() {
    var pd = d.querySelector(".pd.open .pd-cart"); if (pd) return pd;
    return d.querySelector(".bar .cartbtn");
  }
  function fly(img, target) {
    if (!img || !target || !img.animate) { bump(target); return; }
    var r = img.getBoundingClientRect(), t = target.getBoundingClientRect();
    if (!r.width || !t.width || r.bottom < 0 || r.top > innerHeight) { bump(target); return; }
    var f = d.createElement("img"); f.className = "mo-fly"; f.alt = ""; f.src = img.currentSrc || img.src;
    var sx = r.left + r.width / 2 - 32, sy = r.top + r.height / 2 - 40;
    f.style.left = sx + "px"; f.style.top = sy + "px";
    d.body.appendChild(f);
    var dx = t.left + t.width / 2 - 32 - sx, dy = t.top + t.height / 2 - 40 - sy;
    var a = f.animate([
      { transform: "translate3d(0,0,0) scale(1.15) rotate(0)", opacity: 1 },
      { transform: "translate3d(" + dx * 0.35 + "px," + (dy * 0.35 - 70) + "px,0) scale(.85) rotate(-10deg)", opacity: 1, offset: 0.45 },
      { transform: "translate3d(" + dx + "px," + dy + "px,0) scale(.18) rotate(8deg)", opacity: 0.4 }
    ], { duration: 720, easing: "cubic-bezier(.45,.05,.55,.95)" });
    var end = function () { if (f.parentNode) f.parentNode.removeChild(f); bump(target); };
    a.onfinish = end; setTimeout(end, 1000);
  }
  // capture phase: we read the button state before the cart code toggles it
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".addcart, .pd-add, .rs-cart, [data-cart-id]");
    if (!b || b.classList.contains("on")) return;
    var img = b.classList.contains("pd-add") ? (d.querySelector(".pd.open .pd-sl.act img") || d.querySelector(".pd.open .pd-sl img")) : findImg(b);
    var target = cartTarget();
    requestAnimationFrame(function () { fly(img, target); });
  }, true);
  // "add all" in the Outfit Helper: just bump the cart
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".rs-allcart")) setTimeout(function () { bump(cartTarget()); }, 120); }, true);

  /* ---------- filter: cards re-enter with a stagger ---------- */
  if (typeof window.applyFilter === "function" && grid) {
    var _af = window.applyFilter, fT = 0;
    var wrapped = function () {
      var r = _af.apply(this, arguments);
      clearTimeout(fT);
      var n = 0;
      grid.querySelectorAll(".card.re").forEach(function (c) { c.classList.remove("re"); });
      void grid.offsetWidth;
      grid.querySelectorAll(".card:not([hidden])").forEach(function (c) {
        if (n >= 10) return; var rc = c.getBoundingClientRect();
        if (rc.top > innerHeight * 2.2) return;
        c.style.setProperty("--rd", (n++ * 45) + "ms"); c.classList.add("re", "vis");
      });
      fT = setTimeout(function () { grid.querySelectorAll(".card.re").forEach(function (c) { c.classList.remove("re"); c.style.removeProperty("--rd"); }); }, 1200);
      return r;
    };
    try { window.applyFilter = wrapped; applyFilter = wrapped; } catch (er) {}
  }

  /* ---------- cart sheet: items stagger in on open ---------- */
  var cs = d.querySelector(".csheet");
  if (cs && "MutationObserver" in window) {
    var wasOpen = false;
    new MutationObserver(function () {
      var o = cs.classList.contains("open");
      if (o && !wasOpen) { cs.classList.add("mo-in"); setTimeout(function () { cs.classList.remove("mo-in"); }, 900); }
      wasOpen = o;
    }).observe(cs, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- product page: entrance, gallery focus, colour chips ---------- */
  var pd = d.querySelector(".pd");
  if (pd && "MutationObserver" in window) {
    var gio = null, cio = null;
    var setup = function () {
      if (!pd.classList.contains("open")) return;
      pd.classList.remove("mo-enter"); void pd.offsetWidth; pd.classList.add("mo-enter");
      setTimeout(function () { pd.classList.remove("mo-enter"); }, 1100);
      stagger(pd.querySelector(".pd-thumbs"));
      var sl = pd.querySelector(".pd-slides");
      if (gio) gio.disconnect(); if (cio) cio.disconnect();
      if (sl && IO && sl.children.length > 1) {
        sl.classList.add("mo-g");
        if (sl.firstElementChild) sl.firstElementChild.classList.add("act");
        gio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("act", e.intersectionRatio >= 0.6); }); }, { root: sl, threshold: [0, 0.6, 1] });
        Array.prototype.forEach.call(sl.children, function (s) { gio.observe(s); });
      }
      var boxes = pd.querySelectorAll(".mdc, .mdc-more");
      boxes.forEach(stagger);
      if (IO) {
        cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); e.target.classList.add("go"); } }); }, { threshold: 0.1 });
        boxes.forEach(function (b) { cio.observe(b); });
      }
    };
    var lastHTML = null;
    new MutationObserver(function () {
      var first = pd.firstElementChild; if (first === lastHTML) return; lastHTML = first;
      requestAnimationFrame(setup);
    }).observe(pd, { childList: true });
  }

})();
