/* RIXU Outfit Banao — character stage. 2D SVG character (first paint + fallback) and lazy 3D (outfit3d.js).
   Garments are real cutouts of the Meesho product photos (img/cut/). Back = Meesho back photo if it exists, else plain garment colour. */
(function () {
  "use strict";
  var V = "20261030f";
  var MODELS = {
    boy:   { H: 163, hr: 14.3, sw: 18.5, cw: 15.5, ww: 13.2, hw: 14.8, skin: "#c98a62", hair: "#1c1410", hs: "fluffy", shoe: "#f0efea", base: "#d5d8de" },
    girl:  { H: 157, hr: 14.1, sw: 16.2, cw: 14.2, ww: 11.4, hw: 15.0, skin: "#d59c74", hair: "#2a1a12", hs: "pony",   shoe: "#f3f1ea", base: "#ded7da" },
    men:   { H: 176, hr: 14.4, sw: 21.5, cw: 17.8, ww: 15.4, hw: 16.2, skin: "#b57a52", hair: "#17110d", hs: "short",  shoe: "#ecebe6", base: "#d0d3d9" },
    women: { H: 168, hr: 14.0, sw: 17.6, cw: 15.2, ww: 12.3, hw: 17.0, skin: "#c88e66", hair: "#22150f", hs: "long",   shoe: "#232326", base: "#dcd5d8" },
    kids:  { H: 118, hr: 14.8, sw: 13.6, cw: 12.4, ww: 12.0, hw: 12.4, skin: "#cf926b", hair: "#1d1511", hs: "kid",    shoe: "#f0efea", base: "#d8dbe0" }
  };
  var LEG = "#3a3d46";
  function geo(m) {
    var H = m.H, neck = H * .028, hy = H - m.hr, sY = H - 2 * m.hr - neck + 1.5;
    return { H: H, hy: hy, sY: sY, chY: sY * .87, wY: sY * .735, hipY: sY * .63, crY: sY * .565, kY: sY * .3, aY: sY * .055, legX: m.hw * .5, armX: m.sw - 1.2, armLen: sY * .5, legR: m.hw * .47, armR: m.sw * .23 };
  }
  function torsoR(m, G, y) {
    var P = [[G.crY - 6, m.hw * .92], [G.crY, m.hw * .97], [G.hipY, m.hw], [G.wY, m.ww], [G.chY, m.cw], [G.sY - 4, m.sw * .93], [G.sY - 1, m.sw * .78], [G.sY + 1.5, m.sw * .46], [G.sY + 3, m.hr * .36]];
    if (y <= P[0][0]) return P[0][1];
    for (var i = 1; i < P.length; i++) if (y <= P[i][0]) { var t = (y - P[i - 1][0]) / (P[i][0] - P[i - 1][0]), s = t * t * (3 - 2 * t); return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * s; }
    return P[P.length - 1][1];
  }
  /* where the photo goes, in model cm (shared by 2D and 3D) */
  function placeTop(m, G, c) {
    var tw = Math.max(.25, c.tw / c.w), W = torsoR(m, G, G.chY) * 2.06 / tw;
    W = Math.min(Math.max(W, m.sw * 2.1), m.sw * 4.4);
    var Hh = W * c.h / c.w, yTop = G.sY + 2 + c.sh * Hh, off = (.5 - c.tc / c.w) * W;
    return { x0: -W / 2 + off, x1: W / 2 + off, y0: yTop - Hh, y1: yTop };
  }
  function placeBot(m, G, c, type) {
    var short = type === "shorts", yTop = G.wY + 1.5, yHem = short ? G.kY + (G.crY - G.kY) * .45 : G.aY + 1.5;
    var Hh = yTop - yHem, W = Hh * c.w / c.h, lo = m.hw * 2.0, hi = m.hw * (type === "baggy" || type === "cargo" ? 3.6 : 3.2);
    if (W < lo || W > hi) { W = Math.min(hi, Math.max(lo, W)); Hh = W * c.h / c.w; }
    return { x0: -W / 2, x1: W / 2, y0: yTop - Hh, y1: yTop, hem: yHem };
  }

  /* ---------- 2D SVG character ---------- */
  function f1(v) { return (Math.round(v * 10) / 10).toString(); }
  function svgChar(mk, view, layer) {
    var m = MODELS[mk], G = geo(m), s = 436 / m.H, X = function (x) { return f1(100 + x * s); }, Y = function (y) { return f1(452 - y * s); };
    var back = view === "b", o = "", R = m.hr * s, hx = 100, hy = 452 - G.hy * s;
    function torso(y0, y1, pad, k) { var L = [], Rr = [], y; for (y = y0; y <= y1 + .01; y += 2) { var r = torsoR(m, G, y) * (k || 1) + pad; L.push(X(-r) + " " + Y(y)); Rr.unshift(X(r) + " " + Y(y)); } return "M" + L.join(" L") + " L" + Rr.join(" L") + "Z"; }
    function arm(sg, fill, len0, len1, rr) { // segment of an arm from len0..len1 (fractions)
      var ax = sg * G.armX, ay = G.sY - G.armR * .9, a = sg * .1, L = G.armLen, r = (rr || G.armR);
      var p = function (t, side) { var dy = -L * t, x = ax + Math.sin(a) * -dy * 1 + side * r * Math.cos(a), yy = ay + dy * Math.cos(a) + side * r * Math.sin(a) * 0; return X(x) + " " + Y(yy); };
      return '<path d="M' + p(len0, -1) + " L" + p(len1, -1) + " L" + p(len1, 1) + " L" + p(len0, 1) + 'Z" fill="' + fill + '" stroke="' + fill + '" stroke-width="' + f1(r * s * .5) + '" stroke-linejoin="round"/>';
    }
    function handXY(sg) { var a = sg * .1, L = G.armLen * .97; return [100 + (sg * G.armX + Math.sin(a) * L) * s, 452 - (G.sY - G.armR * .9 - L * Math.cos(a)) * s]; }
    if (layer === "under") {
      o += '<ellipse cx="100" cy="453" rx="' + f1(m.hw * 2.6 * s) + '" ry="7" fill="url(#cvFloor)"/>';
      if (!back && m.hs === "long") o += '<path d="M' + f1(hx - R * 1.12) + " " + f1(hy) + " Q" + f1(hx - R * 1.3) + " " + f1(hy + R * 2.2) + " " + f1(hx - R * 1.05) + " " + f1(hy + R * 2.6) + " L" + f1(hx + R * 1.05) + " " + f1(hy + R * 2.6) + " Q" + f1(hx + R * 1.3) + " " + f1(hy + R * 2.2) + " " + f1(hx + R * 1.12) + " " + f1(hy) + 'Z" fill="' + m.hair + '"/>';
      [-1, 1].forEach(function (sg) {
        var lx = sg * G.legX, r = G.legR * .8, pts = [[G.crY + 2, r], [G.crY - 6, r], [G.kY + 4, r * .78], [G.kY - 4, r * .66], [G.aY + 3, r * .5], [G.aY, r * .5]];
        var Lp = pts.map(function (q) { return X(lx - q[1]) + " " + Y(q[0]); }), Rp = pts.map(function (q) { return X(lx + q[1]) + " " + Y(q[0]); }).reverse();
        o += '<path d="M' + Lp.join(" L") + " L" + Rp.join(" L") + 'Z" fill="' + LEG + '"/>';
        o += '<ellipse cx="' + X(lx + sg * .4) + '" cy="' + Y(G.aY * .55) + '" rx="' + f1(r * .72 * s) + '" ry="' + f1(r * .5 * s) + '" fill="' + m.shoe + '"/>';
      });
      [-1, 1].forEach(function (sg) { o += arm(sg, m.skin, .25, .9, G.armR * .82) + arm(sg, m.base, 0, .3); });
      o += '<path d="' + torso(G.crY - 6, G.hipY + 1, 0) + '" fill="' + LEG + '"/>';
      o += '<path d="' + torso(G.hipY, G.sY + 3, 0) + '" fill="' + m.base + '"/>';
      o += '<rect x="' + f1(100 - m.hr * .36 * s) + '" y="' + f1(hy + R * .6) + '" width="' + f1(m.hr * .72 * s) + '" height="' + f1(R * .9) + '" rx="3" fill="' + m.skin + '"/>';
      o += '<path d="M' + f1(100 - m.hr * .36 * s) + " " + f1(hy + R * 1.2) + " Q100 " + f1(hy + R * 1.45) + " " + f1(100 + m.hr * .36 * s) + " " + f1(hy + R * 1.2) + '" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>';
      return o;
    }
    // over: hands + head
    [-1, 1].forEach(function (sg) { var h = handXY(sg); o += '<ellipse cx="' + f1(h[0]) + '" cy="' + f1(h[1]) + '" rx="' + f1(G.armR * 1.0 * s) + '" ry="' + f1(G.armR * 1.3 * s) + '" fill="' + m.skin + '"/>'; });
    [-1, 1].forEach(function (sg) { o += '<ellipse cx="' + f1(hx + sg * R * .98) + '" cy="' + f1(hy + R * .02) + '" rx="' + f1(R * .16) + '" ry="' + f1(R * .22) + '" fill="' + m.skin + '"/>'; });
    if (back && m.hs === "long") o += '<path d="M' + f1(hx - R * 1.1) + " " + f1(hy) + " Q" + f1(hx - R * 1.25) + " " + f1(hy + R * 2.3) + " " + f1(hx - R * .95) + " " + f1(hy + R * 2.75) + " Q100 " + f1(hy + R * 2.95) + " " + f1(hx + R * .95) + " " + f1(hy + R * 2.75) + " Q" + f1(hx + R * 1.25) + " " + f1(hy + R * 2.3) + " " + f1(hx + R * 1.1) + " " + f1(hy) + 'Z" fill="' + m.hair + '"/>';
    o += '<ellipse cx="' + hx + '" cy="' + f1(hy) + '" rx="' + f1(R) + '" ry="' + f1(R * 1.03) + '" fill="' + m.skin + '"/>';
    if (back) {
      o += '<path d="M' + f1(hx - R * 1.06) + " " + f1(hy + R * .15) + " A" + f1(R * 1.06) + " " + f1(R * 1.09) + " 0 1 1 " + f1(hx + R * 1.06) + " " + f1(hy + R * .15) + " Q" + f1(hx + R * .9) + " " + f1(hy + R * .75) + " " + hx + " " + f1(hy + R * .82) + " Q" + f1(hx - R * .9) + " " + f1(hy + R * .75) + " " + f1(hx - R * 1.06) + " " + f1(hy + R * .15) + 'Z" fill="' + m.hair + '"/>';
      if (m.hs === "pony") o += '<circle cx="100" cy="' + f1(hy - R * .35) + '" r="' + f1(R * .2) + '" fill="#ff4f8b"/><path d="M' + f1(hx - R * .25) + " " + f1(hy - R * .2) + " Q" + f1(hx - R * .35) + " " + f1(hy + R * 1.3) + " " + hx + " " + f1(hy + R * 1.75) + " Q" + f1(hx + R * .35) + " " + f1(hy + R * 1.3) + " " + f1(hx + R * .25) + " " + f1(hy - R * .2) + 'Z" fill="' + m.hair + '"/>';
      if (m.hs === "fluffy" || m.hs === "kid") for (var i = 0; i < 6; i++) o += '<circle cx="' + f1(hx - R * .7 + i * R * .28) + '" cy="' + f1(hy - R * .9 + (i % 2) * R * .08) + '" r="' + f1(R * .3) + '" fill="' + m.hair + '"/>';
      return o;
    }
    // hair front: cap with forehead line
    var top = hy - R * 1.06, fl = hy - R * .48;
    o += '<path d="M' + f1(hx - R * 1.07) + " " + f1(hy + R * .05) + " A" + f1(R * 1.07) + " " + f1(R * 1.1) + " 0 0 1 " + f1(hx + R * 1.07) + " " + f1(hy + R * .05) + " L" + f1(hx + R * .9) + " " + f1(hy - R * .05) + " Q" + f1(hx + R * .7) + " " + f1(fl) + " " + f1(hx + R * .1) + " " + f1(fl - R * .02) + " Q" + f1(hx - R * .6) + " " + f1(fl - R * .04) + " " + f1(hx - R * .9) + " " + f1(hy - R * .05) + 'Z" fill="' + m.hair + '"/>';
    if (m.hs === "fluffy" || m.hs === "kid") for (var j = 0; j < 7; j++) o += '<circle cx="' + f1(hx - R * .75 + j * R * .25) + '" cy="' + f1(top + R * .3 + (j % 2) * R * .1) + '" r="' + f1(R * .28) + '" fill="' + m.hair + '"/>';
    if (m.hs === "long") [-1, 1].forEach(function (sg) { o += '<path d="M' + f1(hx + sg * R * .82) + " " + f1(hy - R * .3) + " Q" + f1(hx + sg * R * 1.15) + " " + f1(hy + R * .9) + " " + f1(hx + sg * R * 1.05) + " " + f1(hy + R * 1.95) + " L" + f1(hx + sg * R * 1.3) + " " + f1(hy + R * 1.8) + " Q" + f1(hx + sg * R * 1.35) + " " + f1(hy + R * .4) + " " + f1(hx + sg * R * 1.08) + " " + f1(hy - R * .2) + 'Z" fill="' + m.hair + '"/>'; });
    if (m.hs === "pony") o += '<circle cx="' + f1(hx + R * .78) + '" cy="' + f1(hy - R * .78) + '" r="' + f1(R * .17) + '" fill="#ff4f8b"/>';
    // face
    var ey = hy - R * .07;
    [-1, 1].forEach(function (sg) {
      var ex = hx + sg * R * .36;
      o += '<g class="cv-eye"><ellipse cx="' + f1(ex) + '" cy="' + f1(ey) + '" rx="' + f1(R * .15) + '" ry="' + f1(R * .19) + '" fill="#fff"/><ellipse cx="' + f1(ex) + '" cy="' + f1(ey + R * .02) + '" rx="' + f1(R * .1) + '" ry="' + f1(R * .12) + '" fill="#1b1210"/><circle cx="' + f1(ex + R * .04) + '" cy="' + f1(ey - R * .04) + '" r="' + f1(R * .035) + '" fill="#fff"/></g>';
      o += '<path d="M' + f1(ex - R * .14) + " " + f1(ey - R * .32) + " Q" + f1(ex) + " " + f1(ey - R * .41) + " " + f1(ex + R * .14) + " " + f1(ey - R * .32) + '" stroke="' + m.hair + '" stroke-width="' + f1(R * .07) + '" fill="none" stroke-linecap="round"/>';
      o += '<ellipse cx="' + f1(hx + sg * R * .55) + '" cy="' + f1(hy + R * .27) + '" rx="' + f1(R * .13) + '" ry="' + f1(R * .08) + '" fill="#f08a8a" opacity=".4"/>';
    });
    o += '<ellipse cx="' + hx + '" cy="' + f1(hy + R * .15) + '" rx="' + f1(R * .085) + '" ry="' + f1(R * .07) + '" fill="rgba(120,50,30,.22)"/>';
    o += '<path d="M' + f1(hx - R * .16) + " " + f1(hy + R * .4) + " Q" + hx + " " + f1(hy + R * .56) + " " + f1(hx + R * .16) + " " + f1(hy + R * .4) + '" stroke="#7a2a2a" stroke-width="' + f1(R * .065) + '" fill="none" stroke-linecap="round"/>';
    return o;
  }

  /* ---------- stage controller ---------- */
  var RXC_last = null;
  var d = document, REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {}, low = conn.saveData || (navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  function hasGL() { try { var c = d.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } }
  var pref = null; try { pref = localStorage.getItem("rxCv3d"); } catch (e) {}
  function want3D() { if (pref === "2d") return false; if (pref === "3d") return hasGL(); return !REDUCE && !low && hasGL(); }

  function Stage(host) {
    this.host = host; this.view = "f"; this.mode = "2d"; this.v3 = null; this.loading = false;
    host.innerHTML = '<div class="cv-box"><div class="cv-2d"><svg class="cv-u" viewBox="0 0 200 462" aria-hidden="true"></svg><div class="cv-g"></div><svg class="cv-o" viewBox="0 0 200 462" aria-hidden="true"></svg></div><div class="cv-3d" hidden></div></div>' +
      '<div class="cv-ctl"><button type="button" class="cv-b" data-cv="spin">⟲ 360°</button><button type="button" class="cv-b" data-cv="back">👀 Peeche</button><button type="button" class="cv-b cv-m" data-cv="mode">3D</button></div>' +
      '<p class="cv-note" hidden></p>';
    RXC_last = this; this.box = host.querySelector(".cv-box"); this.d2 = host.querySelector(".cv-2d"); this.d3 = host.querySelector(".cv-3d");
    var self = this;
    host.addEventListener("click", function (e) { var b = e.target.closest("[data-cv]"); if (!b) return; var a = b.getAttribute("data-cv");
      if (a === "spin") self.spin(); else if (a === "back") self.flip(); else if (a === "mode") self.toggle(); });
    // 2D swipe = turn front/back
    var sx = null;
    this.d2.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    this.d2.addEventListener("pointerup", function (e) { if (sx != null && Math.abs(e.clientX - sx) > 36) self.flip(); sx = null; });
    this.d2.style.touchAction = "pan-y";
    if (want3D()) this.load3D(true);
    this.modeBtn();
  }
  Stage.prototype.modeBtn = function () { var b = this.host.querySelector(".cv-m"); b.textContent = this.mode === "3d" ? "2D view" : "3D view"; b.hidden = !hasGL(); };
  Stage.prototype.toggle = function () {
    pref = this.mode === "3d" ? "2d" : "3d"; try { localStorage.setItem("rxCv3d", pref); } catch (e) {}
    if (this.mode === "3d") { this.mode = "2d"; this.d3.hidden = true; this.d2.hidden = false; this.view = "f"; this.draw2(); this.note(); }
    else this.load3D(false);
    this.modeBtn();
  };
  Stage.prototype.load3D = function (idle) {
    var self = this; if (this.v3) { this.mode = "3d"; this.d3.hidden = false; this.d2.hidden = true; this.v3.set(this.mk, this.t3(this.top, "t"), this.t3(this.bot, "b")); this.modeBtn(); return; }
    if (this.loading) return; this.loading = true;
    var go = function () {
      self.host.classList.add("cv-ld");
      import("./outfit3d.js?v=" + V).then(function (mod) {
        self.d3.hidden = false;
        try { self.v3 = mod.create(self.d3, { onYaw: function (y) { self.yaw = y; self.note(); } }); } catch (e) { self.d3.hidden = true; self.loading = false; self.host.classList.remove("cv-ld"); return; }
        self.mode = "3d"; self.d2.hidden = true; self.host.classList.remove("cv-ld"); self.host.classList.add("cv-is3d");
        self.modeBtn();
        try { if (self.mk) self.v3.set(self.mk, self.t3(self.top, "t"), self.t3(self.bot, "b")); } catch (e) { console.error(e); self.fail3D(); }
      }).catch(function (e) { console.warn("3D off:", e && e.message); self.loading = false; self.host.classList.remove("cv-ld"); });
    };
    if (idle) { var start = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(go, { timeout: 2500 }); }; if (d.readyState === "complete") start(); else window.addEventListener("load", start); }
    else go();
  };
  Stage.prototype.fail3D = function () { this.mode = "2d"; this.d3.hidden = true; this.d2.hidden = false; this.host.classList.remove("cv-is3d"); this.modeBtn(); };
  Stage.prototype.t3 = function (it, role) {
    if (!it) return null; var c = it.cut;
    return { type: it.type, hex: it.hex, cut: c ? { src: c.f, w: c.w, h: c.h, tw: c.tw, tc: c.tc, sh: c.sh, ww: c.ww, back: c.b ? { src: c.b, w: c.bw, h: c.bh, tw: c.btw, tc: c.btc, sh: c.bsh, ww: c.bww } : null } : null };
  };
  Stage.prototype.render = function (mk, top, bot) {
    this.mk = mk; this.top = top; this.bot = bot;
    if (this.mode === "3d" && this.v3) { try { this.v3.set(mk, this.t3(top, "t"), this.t3(bot, "b")); } catch (e) { console.error(e); this.fail3D(); } }
    this.draw2(); this.note();
    if (!REDUCE) { this.box.classList.remove("cv-pop"); void this.box.offsetWidth; this.box.classList.add("cv-pop"); }
  };
  Stage.prototype.garmentHTML = function (it, role, back) {
    if (!it) return "";
    var m = MODELS[this.mk], G = geo(m), s = 436 / m.H, c = it.cut;
    if (!c) { // no clean cutout: colour block + the real photo card stays in the pin
      var r = role === "t" ? placeTop(m, G, { w: 100, h: 110, tw: 62, tc: 50, sh: .08 }) : placeBot(m, G, { w: 100, h: 200, ww: 60 }, it.type);
      return '<i class="cv-blk cv-' + role + '" style="' + box(r, s) + ";background:" + it.hex + '"></i>';
    }
    var useBack = back && c.b, cc = useBack ? { w: c.bw, h: c.bh, tw: c.btw, tc: c.btc, sh: c.bsh, ww: c.bww } : c;
    var R = role === "t" ? placeTop(m, G, cc) : placeBot(m, G, cc, it.type);
    if (back && !useBack) return '<i class="cv-sil cv-' + role + '" style="' + box(R, s, true) + ";background-color:" + it.hex + ";-webkit-mask-image:url(" + c.f + ");mask-image:url(" + c.f + ')"></i>';
    var clip = "";
    if (role === "t" && (it.type === "kurti" || it.type === "set")) { var fr = (R.y1 - (G.kY - 2)) / (R.y1 - R.y0); if (fr < 1) clip = ";clip-path:inset(0 0 " + ((1 - fr) * 100).toFixed(1) + "% 0)"; }
    if (role === "b") { var fb = (R.y1 - (R.hem - 1.5)) / (R.y1 - R.y0); if (fb < 1) clip = ";clip-path:inset(0 0 " + ((1 - fb) * 100).toFixed(1) + "% 0)"; }
    return '<img class="cv-' + role + '" src="' + (useBack ? c.b : c.f) + '" alt="" decoding="async" style="' + box(R, s) + clip + '">';
    function box(R, s, mir) { var l = 100 + (mir ? -R.x1 : R.x0) * s, t = 452 - R.y1 * s; return "left:" + (l / 2).toFixed(2) + "%;top:" + (t / 4.62).toFixed(2) + "%;width:" + ((R.x1 - R.x0) * s / 2).toFixed(2) + "%;height:" + ((R.y1 - R.y0) * s / 4.62).toFixed(2) + "%"; }
  };
  Stage.prototype.draw2 = function () {
    if (!this.mk) return; var back = this.view === "b";
    this.d2.querySelector(".cv-u").innerHTML = '<defs><radialGradient id="cvFloor"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' + svgChar(this.mk, this.view, "under");
    this.d2.querySelector(".cv-g").innerHTML = this.garmentHTML(this.bot, "b", back) + this.garmentHTML(this.top, "t", back);
    this.d2.querySelector(".cv-o").innerHTML = svgChar(this.mk, this.view, "over");
    this.d2.classList.toggle("cv-back", back);
  };
  Stage.prototype.flip = function () {
    if (this.mode === "3d" && this.v3) { var y = this.v3.yaw, k = Math.round(y / Math.PI); this.v3.setYaw((k % 2 === 0 ? k + 1 : k + 1) * Math.PI - (Math.abs(Math.cos(y)) > .99 ? 0 : 0), true); return; }
    var self = this;
    if (REDUCE) { this.view = this.view === "f" ? "b" : "f"; this.draw2(); this.note(); return; }
    this.d2.classList.add("cv-turn1");
    setTimeout(function () { self.view = self.view === "f" ? "b" : "f"; self.draw2(); self.note(); self.d2.classList.remove("cv-turn1"); self.d2.classList.add("cv-turn2"); void self.d2.offsetWidth; self.d2.classList.remove("cv-turn2"); }, 190);
  };
  Stage.prototype.spin = function () {
    if (this.mode === "3d" && this.v3) { this.v3.spin(); return; }
    var self = this; this.flip(); setTimeout(function () { self.flip(); }, 900);
  };
  Stage.prototype.note = function () {
    var back = this.mode === "3d" ? Math.cos(this.yaw || 0) < -.25 : this.view === "b";
    var n = this.host.querySelector(".cv-note"), parts = [];
    if (back) [[this.top, "Upar"], [this.bot, "Niche"]].forEach(function (x) { var it = x[0]; if (!it || !it.p || !it.p.img) return;
      parts.push(x[1] + ": " + (it.cut && it.cut.b ? "asli peeche ki photo ✓" : it.cut && it.cut.bx ? "peeche ki saaf photo nahi, plain rang" : "peeche ki photo Meesho pe nahi, plain rang")); });
    n.hidden = !parts.length; if (parts.length) n.textContent = "🔙 " + parts.join(" · ");
  };
  window.RXC = { Stage: Stage, MODELS: MODELS, svgChar: svgChar, get last() { return RXC_last; } };
})();
