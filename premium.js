/* RIXU Picks — premium layer: hero, reveal, tilt, light particles. Vanilla, no deps. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || "")));
  if (lowEnd) root.classList.add("lite");

  // live product count in the hero badge (from the real list)
  try { var c = d.getElementById("hxcount"); if (c && typeof PRODUCTS !== "undefined") c.textContent = PRODUCTS.length; var mn = d.getElementById("hxmin"); if (mn && typeof PRODUCTS !== "undefined") mn.textContent = "₹" + Math.min.apply(null, PRODUCTS.map(function (p) { return p.price; })); } catch (e) {}

  // Shop Now → product grid (same scroll the site already uses)
  var shop = d.getElementById("hxshop");
  if (shop) shop.addEventListener("click", function (e) {
    e.preventDefault();
    try { if (typeof scrollToGrid === "function") { scrollToGrid(); return; } } catch (er) {}
    var m = d.querySelector("main"); if (m) window.scrollTo({ top: m.getBoundingClientRect().top + scrollY - 60, behavior: RM ? "auto" : "smooth" });
  });

  // navbar state on scroll
  var bar = d.querySelector(".bar"), ticking = false;
  function onScroll() { ticking = false; if (bar) bar.classList.toggle("scrolled", scrollY > 12); }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // scroll reveal (cards + sections). Without IntersectionObserver nothing is hidden.
  if (!RM && "IntersectionObserver" in window) {
    var cards = d.querySelectorAll("#grid .card"), batch = 0, bt = null;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        if (el.classList.contains("card")) {
          el.style.setProperty("--d", (Math.min(batch++, 5) * 70) + "ms");
          clearTimeout(bt); bt = setTimeout(function () { batch = 0; }, 120);
          setTimeout(function () { el.style.removeProperty("--d"); }, 1200);
        }
        el.classList.add("vis");
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    root.classList.add("rv-on");
    cards.forEach(function (el) { io.observe(el); });
    d.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
    // safety net: anything still hidden after 4 s (odd browsers) just shows
    setTimeout(function () {
      cards.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("vis"); });
    }, 4000);
  } else {
    d.querySelectorAll("#grid .card").forEach(function (el) { el.classList.add("vis"); });
  }

  // 3D tilt + cursor glow (mouse/trackpad only); a light press-lift on touch
  var grid = d.getElementById("grid");
  if (grid && !RM) {
    if (FINE) {
      var cur = null, raf = 0, lx = 0, ly = 0;
      var paint = function () {
        raf = 0; if (!cur) return;
        var r = cur.getBoundingClientRect(), px = (lx - r.left) / r.width, py = (ly - r.top) / r.height;
        cur.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
        cur.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
        cur.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        cur.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      };
      grid.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var c = e.target.closest(".card");
        if (c !== cur) { if (cur) cur.classList.remove("tilt"); cur = c; if (cur) cur.classList.add("tilt"); }
        lx = e.clientX; ly = e.clientY; if (!raf) raf = requestAnimationFrame(paint);
      });
      grid.addEventListener("pointerleave", function () { if (cur) { cur.classList.remove("tilt"); cur.style.removeProperty("--rx"); cur.style.removeProperty("--ry"); } cur = null; });
    } else {
      var pc = null;
      var up = function () { if (pc) { var x = pc; setTimeout(function () { x.classList.remove("press"); }, 160); } pc = null; };
      grid.addEventListener("touchstart", function (e) {
        var c = e.target.closest(".card"); if (!c) return; pc = c;
        var t = e.touches[0], r = c.getBoundingClientRect();
        c.style.setProperty("--mx", ((t.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        c.style.setProperty("--my", ((t.clientY - r.top) / r.height * 100).toFixed(1) + "%");
        c.classList.add("press");
      }, { passive: true });
      grid.addEventListener("touchend", up, { passive: true });
      grid.addEventListener("touchcancel", up, { passive: true });
      grid.addEventListener("touchmove", up, { passive: true });
    }
  }

  // particles canvas: only on big, capable screens; phones keep the CSS stars
  var hx = d.querySelector(".hx"), cv = d.getElementById("hxfx");
  if (hx && cv && !RM && !lowEnd && innerWidth >= 900 && cv.getContext) {
    hx.classList.add("fx");
    var ctx = cv.getContext("2d"), W = 0, H = 0, P = [], on = true, DPR = Math.min(devicePixelRatio || 1, 1.5);
    var size = function () { var r = hx.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    size(); addEventListener("resize", size);
    for (var i = 0; i < 70; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: -(Math.random() * .3 + .05), r: Math.random() * 1.6 + .4, h: Math.random() < .25 });
    var tick = function () {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = p.h ? "rgba(255,90,90,.8)" : "rgba(255,255,255,.55)"; ctx.fill();
        for (var j = i + 1; j < P.length; j++) {
          var q = P[j], dx = p.x - q.x, dy = p.y - q.y, dd = dx * dx + dy * dy;
          if (dd < 9000) { ctx.strokeStyle = "rgba(255,80,80," + (0.12 * (1 - dd / 9000)).toFixed(3) + ")"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(function (e) { var was = on; on = e[0].isIntersecting; if (on && !was) requestAnimationFrame(tick); }).observe(hx);
    requestAnimationFrame(tick);
  }

  // pause hero CSS animations when hero is off-screen or tab hidden (saves battery on phones)
  if (hx && "IntersectionObserver" in window) {
    var setPause = function (p) { hx.style.setProperty("--ps", p ? "paused" : "running"); hx.classList.toggle("off", p); };
    new IntersectionObserver(function (e) { setPause(!e[0].isIntersecting); }).observe(hx);
  }
})();
