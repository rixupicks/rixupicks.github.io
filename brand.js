/* RIXU v3 — brand layer: intro skip, hero parallax, trending carousel (snap + auto-scroll), bento reveals,
   animated section headers, sticky CTA. Transforms/opacity only; nothing moves with prefers-reduced-motion. */
(function () {
  "use strict";
  var d = document, R = d.documentElement;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in window;
  var PR = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var keyOf = function (p) { return p.img.replace(/^img\//, "").replace(/\.\w+$/, ""); };
  var idxByKey = {}; PR.forEach(function (p, i) { idxByKey[keyOf(p)] = i; });
  var openP = function (i) { if (window.RixuShop && RixuShop.openPD) RixuShop.openPD(i); };
  var kfmt = function (n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n); };

  /* ---------- intro: tap / key skips; removed after it plays ---------- */
  var intro = d.getElementById("rx-intro");
  if (intro) {
    var kill = function () { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); intro = null; };
    if (!R.classList.contains("rx-introon")) kill();
    else {
      var skip = function () { if (!intro) return; intro.classList.add("done"); setTimeout(kill, 200); };
      intro.addEventListener("click", skip);
      d.addEventListener("keydown", skip, { once: true });
      setTimeout(kill, 1100);
    }
  }

  /* ---------- live numbers from the real list ---------- */
  try {
    var cats = {}; PR.forEach(function (p) { cats[p.cat] = 1; (p.also || []).forEach(function (c) { cats[c] = 1; }); });
    var rc = d.getElementById("rxcats"); if (rc) rc.textContent = Object.keys(cats).length;
    var sn = d.getElementById("rx-sn"); if (sn) sn.textContent = PR.length;
    d.querySelectorAll("[data-cc]").forEach(function (el) {
      var c = el.getAttribute("data-cc"), n = PR.filter(function (p) { return p.cat === c || (p.also || []).indexOf(c) >= 0; }).length;
      el.textContent = n; var rb = el.parentNode.querySelector(".rx-rev b"); if (rb) rb.textContent = n + " picks";
    });
  } catch (e) {}

  /* ---------- hero bento tiles open the product page ---------- */
  d.querySelectorAll(".rx-tile[data-key]").forEach(function (t) {
    t.addEventListener("click", function () { var i = idxByKey[t.getAttribute("data-key")]; if (i != null) openP(i); });
  });

  /* ---------- hero parallax (only while the hero is on screen) ---------- */
  var hero = d.querySelector(".rx-hero"), pars = [].slice.call(d.querySelectorAll(".rx-par")), word = d.querySelector(".rx-w");
  if (hero && !RM && pars.length) {
    var heroOn = true, ticking = false, speeds = [0.10, 0.18, 0.06, 0.13];
    var paint = function () {
      ticking = false; if (!heroOn) return;
      var y = Math.min(window.scrollY || 0, 900);
      pars.forEach(function (p, i) { p.style.transform = "translate3d(0," + (y * speeds[i % 4]).toFixed(1) + "px,0)"; });
      if (word) word.style.transform = "translate3d(0," + (y * -0.08).toFixed(1) + "px,0)";
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    if (IO) new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; }).observe(hero);
  }

  /* ---------- lime tape pauses off screen ---------- */
  var tape = d.querySelector(".rx-tape");
  if (tape && IO) new IntersectionObserver(function (e) { tape.classList.toggle("off", !e[0].isIntersecting); }).observe(tape);

  /* ---------- trending carousel: most-rated fits on Meesho (real rating counts) ---------- */
  var car = d.getElementById("rx-car");
  if (car && PR.length) {
    var list = PR.map(function (p, i) { return i; })
      .filter(function (i) { var p = PR[i]; return p.rc && p.cat !== "shoes" && p.cat !== "acc"; })
      .sort(function (a, b) { return PR[b].rc - PR[a].rc; }).slice(0, 12);
    car.innerHTML = list.map(function (i, r) {
      var p = PR[i];
      return '<button type="button" class="rx-tc" data-i="' + i + '" aria-label="' + esc(p.name) + ", " + fmt(p.price) + '"><span class="ph2"><img src="' + esc(p.img) + '" alt="" loading="lazy" decoding="async" width="360" height="450"><span class="rx-rank">#' + (r + 1) + "</span></span>" +
        '<span class="ti"><h3>' + esc(p.name) + '</h3><span class="tp"><b>' + fmt(p.price) + "</b>" + (p.off ? "<em>" + p.off + "% off</em>" : "") + (p.rating ? "<span>" + p.rating.toFixed(1) + " ★ (" + kfmt(p.rc) + ")</span>" : "") + '</span><span class="tn">Price as on Meesho — may change</span></span></button>';
    }).join("");
    var dots = d.createElement("div"); dots.className = "rx-dots"; dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = list.map(function () { return "<i></i>"; }).join(""); car.parentNode.appendChild(dots);
    var cards = [].slice.call(car.querySelectorAll(".rx-tc")), dl = [].slice.call(dots.children);
    cards.forEach(function (c) {
      var im = c.querySelector("img"), ph = c.querySelector(".ph2"), ok = function () { ph.classList.add("ld"); };
      if (im.complete && im.naturalWidth) ok(); else { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }
      c.addEventListener("click", function () { openP(+c.getAttribute("data-i")); });
    });
    var cur = 0;
    var mark = function (n) { cur = n; cards.forEach(function (c, j) { c.classList.toggle("on", j === n); }); dl.forEach(function (x, j) { x.classList.toggle("on", j === n); }); };
    mark(0);
    var onScroll = function () {
      var w = cards[0].getBoundingClientRect().width + 12, n = Math.max(0, Math.min(cards.length - 1, Math.round(car.scrollLeft / w)));
      if (n !== cur) mark(n);
    };
    car.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });
    // auto-scroll: pauses while touched, off screen, or with reduced motion
    if (!RM) {
      var visible = false, hold = 0, timer = null;
      var step = function () {
        if (!visible || Date.now() < hold || d.hidden || d.body.classList.contains("lock")) return;
        var w = cards[0].getBoundingClientRect().width + 12;
        var next = cur + 1 >= cards.length || car.scrollLeft + car.clientWidth >= car.scrollWidth - 4 ? 0 : cur + 1;
        car.scrollTo({ left: next * w, behavior: "smooth" });
      };
      var pause = function () { hold = Date.now() + 6000; };
      ["pointerdown", "touchstart", "wheel", "focusin"].forEach(function (ev) { car.addEventListener(ev, pause, { passive: true }); });
      if (IO) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.4 }).observe(car); else visible = true;
      timer = setInterval(step, 2800);
    }
  }

  /* ---------- reveal on scroll: section headers, bento tiles ---------- */
  if (IO && !RM) {
    R.classList.add("rx-anim");
    var once = function (els, fn, margin) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }); }, { rootMargin: margin || "0px 0px -10% 0px", threshold: 0.1 });
      els.forEach(function (el) { io.observe(el); });
    };
    once([].slice.call(d.querySelectorAll(".rx-h")), function (el) { el.classList.add("in"); });
    var heads = function () { once([].slice.call(d.querySelectorAll("h2.sec:not(.in), .hrow-h h2:not(.in)")), function (el) { el.classList.add("in"); }, "0px"); };
    heads(); setTimeout(heads, 1500);
    var bs = [].slice.call(d.querySelectorAll(".rx-b")), burst = 0, bt = 0, pk = 0;
    once(bs, function (el) {
      el.style.setProperty("--d", (Math.min(burst++, 8) * 0.06) + "s"); clearTimeout(bt); bt = setTimeout(function () { burst = 0; }, 150);
      el.classList.add("vis");
      // touch screens have no hover: each tile flashes its reveal once as it lands
      if (!(window.matchMedia && matchMedia("(hover: hover)").matches)) {
        var delay = 650 + (pk++ % 6) * 160;
        setTimeout(function () { el.classList.add("peek"); setTimeout(function () { el.classList.remove("peek"); }, 1300); }, delay);
      }
    }, "0px 0px -8% 0px");
    // safety: anything still hidden after 5 s just shows
    setTimeout(function () { bs.forEach(function (b) { var r = b.getBoundingClientRect(); if (r.top < innerHeight) b.classList.add("vis"); }); d.querySelectorAll(".rx-h").forEach(function (h) { if (h.getBoundingClientRect().top < innerHeight) h.classList.add("in"); }); }, 5000);
  }

  /* ---------- sticky animated CTA: shows between the hero and the product grid ---------- */
  var st = d.getElementById("rx-sticky"), go = d.getElementById("rx-sgo"), main = d.querySelector("main");
  if (st && go && hero && main) {
    go.addEventListener("click", function () { try { if (typeof scrollToGrid === "function") { scrollToGrid(); return; } } catch (e) {} main.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); });
    var stTick = false;
    var upd = function () {
      stTick = false;
      var hb = hero.getBoundingClientRect().bottom, mt = main.getBoundingClientRect().top;
      var show = hb < 0 && mt > innerHeight * 0.55;
      st.classList.toggle("show", show); st.setAttribute("aria-hidden", show ? "false" : "true");
      st.querySelectorAll("button").forEach(function (b) { b.tabIndex = show ? 0 : -1; });
    };
    window.addEventListener("scroll", function () { if (!stTick) { stTick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
