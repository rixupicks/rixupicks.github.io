/* RIXU Outfit Banao 👕 — pick a model, a top and a bottom from RIXU's real Meesho picks, see them together + colour match.
   Vanilla JS, no server. Figures are hand-drawn flat SVG (no AI people). Garment colour = dominant colour read from the product photo
   (precomputed in outfit-data.js). Prices + affiliate links always come from products.js. */
(function () {
  "use strict";
  if (typeof PRODUCTS === "undefined" || typeof RX_OUTFIT === "undefined") return;
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); };
  var H = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var keyOf = function (img) { return img.replace(/^img\//, "").replace(/\.\w+$/, ""); };
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- data ---------- */
  var byImg = {}; PRODUCTS.forEach(function (p) { byImg[p.img] = p; });
  var ITEMS = [];
  RX_OUTFIT.items.forEach(function (r) {
    var p = byImg[r[0]]; if (!p || !p.link) return;
    ITEMS.push({ p: p, key: keyOf(p.img), role: r[1], g: r[2], type: r[3], hex: r[4], lab: r[5], src: r[6], print: !!r[7], cut: (typeof RX_CUT !== "undefined" && RX_CUT[r[0]]) || null });
  });
  var byKey = {}; ITEMS.forEach(function (it) { byKey[it.key] = it; });

  /* ---------- colour science (tiny) ---------- */
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function hsl(h) {
    var c = rgb(h).map(function (v) { return v / 255; }), mx = Math.max.apply(0, c), mn = Math.min.apply(0, c), l = (mx + mn) / 2, s = 0, hu = 0, dd = mx - mn;
    if (dd) { s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      hu = mx === c[0] ? ((c[1] - c[2]) / dd + (c[1] < c[2] ? 6 : 0)) : mx === c[1] ? ((c[2] - c[0]) / dd + 2) : ((c[0] - c[1]) / dd + 4); hu *= 60; }
    return { h: hu, s: s, l: l };
  }
  var NAMES = [["Black", "#141414"], ["Charcoal", "#3a3c40"], ["Grey", "#8c8c8c"], ["Light Grey", "#c4c4c4"], ["White", "#f2f2f0"], ["Off-White", "#ece6d8"], ["Cream", "#efe4cc"], ["Beige", "#d6c3a0"], ["Khaki", "#b5a77a"],
    ["Brown", "#6b4428"], ["Coffee", "#4a2f20"], ["Tan", "#b08055"], ["Olive", "#6b6b2e"], ["Sage", "#9caf88"], ["Green", "#2f7d4a"], ["Mint", "#a6e3c4"], ["Navy", "#1f2c55"], ["Blue", "#3c64b4"], ["Denim Blue", "#4f74a8"],
    ["Light Blue", "#8fb3d9"], ["Teal", "#1f8a8a"], ["Red", "#c62828"], ["Maroon", "#6e1c2a"], ["Pink", "#ef8fb2"], ["Peach", "#f3b59b"], ["Orange", "#ee7b22"], ["Mustard", "#cfa021"], ["Yellow", "#e8c22e"], ["Purple", "#7b3fb8"], ["Lavender", "#b9a3e3"]];
  function nearestName(h) { var c = rgb(h), best = "", bd = 1e9; NAMES.forEach(function (n) { var q = rgb(n[1]), dd = (c[0] - q[0]) * (c[0] - q[0]) * 2 + (c[1] - q[1]) * (c[1] - q[1]) * 4 + (c[2] - q[2]) * (c[2] - q[2]) * 3; if (dd < bd) { bd = dd; best = n[0]; } }); return best; }
  function cname(it) { if (it.lab) return it.lab.replace(/(^|\s|-)\w/g, function (m) { return m.toUpperCase(); }); return nearestName(it.hex); }
  /* family: neutral | denim | earth | colour */
  var NEUTRAL_N = { Black: 1, Charcoal: 1, Grey: 1, "Grey Melange": 1, "Light Grey": 1, White: 1, "Off-White": 1, Navy: 1, "Navy Blue": 1 }, EARTH_N = { Cream: 1, Beige: 1, Khaki: 1, Brown: 1, Coffee: 1, "Coffee Brown": 1, Tan: 1, Camel: 1 };
  function fam(it) {
    if (it._f) return it._f;
    var n = cname(it); if (NEUTRAL_N[n]) return (it._f = "neutral"); if (EARTH_N[n] && !(it.role === "b" && /jeans|baggy/.test(it.type) && false)) return (it._f = "earth");
    return (it._f = fam0(it));
  }
  function fam0(it) {
    var c = hsl(it.hex), isDenim = it.role === "b" && (it.type === "jeans" || it.type === "baggy") && c.h >= 195 && c.h <= 235 && c.s < .62;
    if (isDenim) return "denim";
    if (c.s < .16 || c.l < .15 || c.l > .9) return "neutral";
    if (c.h >= 15 && c.h <= 55 && c.s < .55 && c.l < .78) return "earth";
    if (c.h >= 200 && c.h <= 235 && c.l < .28) return "neutral"; // navy works like a neutral
    return "colour";
  }
  function hueGap(a, b) { var x = Math.abs(a - b) % 360; return x > 180 ? 360 - x : x; }
  /* verdict: {k:3 perfect | 2 theek | 1 clash, why, sc (fine score)} */
  function match(t, b) {
    var ft = fam(t), fb = fam(b), ct = hsl(t.hex), cb = hsl(b.hex), dl = Math.abs(ct.l - cb.l), k, why, sc = 0;
    var NT = cname(t), NB = cname(b);
    var calm = { neutral: 1, denim: 1, earth: 1 };
    if (calm[ft] && calm[fb]) {
      if (ft === "neutral" && fb === "neutral" && ct.l < .22 && cb.l < .22) { k = 3; why = "All-black fit — hamesha fire 🖤"; sc = 9; }
      else if (dl < .1 && ct.l > .62 && cb.l > .62) { k = 2; why = "Dono halke " + NT.toLowerCase() + " — ek dark piece se contrast aur achha lagega"; sc = 5; }
      else if (dl < .08 && ft === "earth" && fb === "earth") { k = 2; why = "Same earthy shade upar-niche — thoda flat, alag shade try karo"; sc = 5; }
      else if (fb === "denim") { k = 3; why = "Denim har " + NT.toLowerCase() + " top ke saath chalta hai — classic 👌"; sc = 8 + dl * 2; }
      else if (ft === "earth" || fb === "earth") { k = 3; why = NT + " + " + NB + " — earthy, old-money vibe"; sc = 7.5 + dl * 2; }
      else { k = 3; why = NT + " + " + NB + " — neutral combo, clean aur safe"; sc = 7 + dl * 3; }
    } else if (fb === "denim" && hueGap(ct.h, cb.h) < 22) {
      if (dl > .25) { k = 3; why = "Blue on blue, alag shade — denim ke saath tone-on-tone 👌"; sc = 6.5; } else { k = 2; why = "Upar bhi blue, niche bhi blue — thoda zyada blue, chal jayega"; sc = 4.5; }
    } else if (calm[ft] || calm[fb]) {
      var col = calm[ft] ? NB : NT, neu = calm[ft] ? NT : NB;
      k = 3; why = neu + " har colour ke saath chalta hai — " + col.toLowerCase() + " pop karega"; sc = 7.5 + dl * 2;
    } else {
      var g = hueGap(ct.h, cb.h), loud = ct.s > .55 && cb.s > .55 && ct.l > .3 && ct.l < .75 && cb.l > .3 && cb.l < .75;
      if (g < 25) { if (dl > .2) { k = 3; why = "Same colour family, alag shade — tone-on-tone 🔥"; sc = 7; } else { k = 2; why = "Upar-niche ek hi colour — thoda flat, chal jayega"; sc = 4.5; } }
      else if (g < 60) { k = 2; why = NT + " + " + NB + " — paas-paas ke colours, soft combo"; sc = 5.5; }
      else if (g >= 150) { if (loud) { k = 1; why = "Dono bright aur ulte colours — bahut loud, ek neutral rakho"; sc = 2.5; } else { k = 3; why = NT + " + " + NB + " — complementary, balanced contrast"; sc = 6.5; } }
      else { if (loud) { k = 1; why = NT + " aur " + NB + " dono bright — takra rahe hain"; sc = 2; } else { k = 2; why = "Chal jayega — ek ko halka/dark rakho toh aur achha"; sc = 4; } }
    }
    if (t.print && b.print && !/stripe/i.test(b.p.name)) { k = 1; why = "Upar-niche dono pe print — busy lagega, ek plain rakho"; sc -= 2.5; }
    else if (t.print && k === 3 && !b.print) { why += " · print top + plain bottom 👌"; sc += .3; }
    return { k: k, why: why, sc: sc };
  }
  var BADGE = { 3: ["ok", "✅ Perfect match"], 2: ["mid", "👍 Theek hai"], 1: ["bad", "⚠️ Clash"] };

  /* ---------- groups / labels ---------- */
  var TOPLBL = { tee: "Tee", teeFull: "Full-sleeve Tee", polo: "Polo", shirt: "Shirt", hoodie: "Hoodie", ziphoodie: "Zip Hoodie", sweatshirt: "Sweatshirt", sweater: "Sweater", jacket: "Jacket", puffer: "Puffer", crop: "Crop Top", top: "Top", kurti: "Kurti", shrug: "Shrug", set: "Kurta Pajama Set" };
  var TOPGRP = { tee: "Tees", teeFull: "Tees", polo: "Tees", shirt: "Shirts", hoodie: "Hoodies", ziphoodie: "Hoodies", sweatshirt: "Sweaters", sweater: "Sweaters", jacket: "Jackets", puffer: "Jackets", crop: "Tops", top: "Tops", kurti: "Kurti", shrug: "Sweaters" };
  var BOTGRP = { jeans: "Jeans", baggy: "Baggy Jeans", cargo: "Cargo", pant: "Full Pant", jogger: "Full Pant", shorts: "Shorts" };
  function botLabel(it) { if (it.type === "jeans" || it.type === "baggy") { var c = hsl(it.hex); var blue = c.h >= 195 && c.h <= 235 && c.s > .15; return (it.type === "baggy" ? "Baggy " : "") + (blue ? "Blue Jeans" : "Jeans"); }
    return { cargo: "Cargo", pant: /track|lower/i.test(it.p.name) ? "Track Pant" : "Full Pant", jogger: "Jogger", shorts: "Shorts" }[it.type] || "Bottom"; }
  function label(it) { return it.role === "b" ? botLabel(it) : (TOPLBL[it.type] || "Top"); }

  /* ---------- models ---------- */
  var MODELS = {
    boy: { name: "Boy", g: "m", h: 392, r: 18.5, sw: 37, ww: 27, hw: 29, skin: "#c08560", hair: "#1a1310", hs: "fluffy", shoe: "#ecebe6" },
    girl: { name: "Girl", g: "f", h: 384, r: 18, sw: 31, ww: 22, hw: 30, skin: "#cf9670", hair: "#2a1a12", hs: "pony", shoe: "#f1efe9" },
    men: { name: "Men", g: "m", h: 428, r: 19, sw: 43, ww: 30, hw: 33, skin: "#b0744d", hair: "#17110d", hs: "short", shoe: "#ecebe6" },
    women: { name: "Women", g: "f", h: 418, r: 18, sw: 34, ww: 24, hw: 35, skin: "#c58b63", hair: "#22150f", hs: "long", shoe: "#1d1d1f" },
    kids: { name: "Kids", g: "k", h: 300, r: 21, sw: 28, ww: 24, hw: 25, skin: "#c98d66", hair: "#1d1511", hs: "kid", shoe: "#ecebe6" }
  };
  var ORDER = ["boy", "girl", "men", "women", "kids"];

  /* ---------- SVG figure ---------- */
  function shade(h, k) { var c = rgb(h).map(function (v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }); return "rgb(" + c.join(",") + ")"; }
  function pt(x, y) { return x.toFixed(1) + " " + y.toFixed(1); }
  function geo(m) {
    var cx = 100, sole = 450, t0 = sole - m.h, hy = t0 + m.r, sY = t0 + 2 * m.r + m.h * .04, L = sole - sY;
    return { cx: cx, sole: sole, t0: t0, hy: hy, sY: sY, L: L, chY: sY + L * .13, wY: sY + L * .33, hipY: sY + L * .4, crY: sY + L * .45, kY: sY + L * .71, aY: sY + L * .955,
      aw: m.sw * .3, sh: function (s) { return [cx + s * (m.sw - m.sw * .16), sY + 5]; }, el: function (s) { return [cx + s * (m.sw + 4), sY + L * .25]; }, wr: function (s) { return [cx + s * (m.sw + 8), sY + L * .44]; } };
  }
  function torsoPath(m, G, pad, hemY, hemHalf) {
    var cx = G.cx, s = m.sw + pad, hh = hemHalf == null ? m.hw + pad : hemHalf, w = m.ww + pad + 1;
    var midY = Math.min(G.wY, hemY - 2), midHalf = hemY < G.wY ? (m.sw - (m.sw - m.ww) * ((hemY - G.sY) / (G.wY - G.sY))) + pad : w;
    var p = "M" + pt(cx - s + 7, G.sY - 1) + " Q" + pt(cx - s, G.sY) + " " + pt(cx - s, G.sY + 11) + " L" + pt(cx - s + 2, G.chY + 6) + " L" + pt(cx - midHalf, midY);
    if (hemY > G.wY) p += " L" + pt(cx - hh, hemY);
    else p += " L" + pt(cx - midHalf, hemY);
    p += " L" + pt(cx + (hemY > G.wY ? hh : midHalf), hemY);
    if (hemY > G.wY) p += " L" + pt(cx + midHalf, midY);
    p += " L" + pt(cx + s - 2, G.chY + 6) + " L" + pt(cx + s, G.sY + 11) + " Q" + pt(cx + s, G.sY) + " " + pt(cx + s - 7, G.sY - 1) + " Z";
    return p;
  }
  function limb(a, b, c) { return "M" + pt(a[0], a[1]) + (c ? " Q" + pt(b[0], b[1]) + " " + pt(c[0], c[1]) : " L" + pt(b[0], b[1])); }
  function along(G, s, t) { var a = G.sh(s), e = G.el(s), w = G.wr(s); if (t <= .5) { var k = t / .5; return [a[0] + (e[0] - a[0]) * k, a[1] + (e[1] - a[1]) * k]; } k = (t - .5) / .5; return [e[0] + (w[0] - e[0]) * k, e[1] + (w[1] - e[1]) * k]; }
  function sleeve(G, s, t, wdt, col) {
    var a = G.sh(s), o = '<path d="' + (t <= .5 ? limb(a, along(G, s, t)) : "M" + pt(a[0], a[1]) + " L" + pt(G.el(s)[0], G.el(s)[1]) + " L" + pt(along(G, s, t)[0], along(G, s, t)[1])) + '" stroke="' + col + '" stroke-width="' + wdt.toFixed(1) + '" fill="none" stroke-linejoin="round" stroke-linecap="butt"/>';
    return o + '<circle cx="' + a[0].toFixed(1) + '" cy="' + (a[1] + 1).toFixed(1) + '" r="' + (wdt / 2 + .5).toFixed(1) + '" fill="' + col + '"/>';
  }
  function legs(m, G, kind) { // returns path for 2 legs as one shape: kind sets widths
    var hw = m.hw, cx = G.cx, W = {
      skin: [.5, .5, .27, .46, .19, .43], slim: [.53, .5, .32, .47, .25, .45], straight: [.56, .52, .38, .5, .35, .5],
      baggy: [.6, .56, .5, .58, .55, .62], cargo: [.6, .55, .46, .55, .4, .52], jogger: [.58, .53, .42, .5, .25, .45]
    }[kind];
    var hemY = kind === "skin" ? G.aY : (kind === "baggy" ? G.sole - 4 : kind === "jogger" ? G.aY - 2 : G.aY + 3);
    var top = kind === "skin" ? G.hipY - 6 : G.wY - 2, tw = W[0] * hw, tc = W[1] * hw, kw = W[2] * hw, kc = W[3] * hw, aw = W[4] * hw, ac = W[5] * hw;
    var ww = kind === "skin" ? m.hw - 2 : m.ww + 3;
    var p = "M" + pt(cx - ww, top) + " L" + pt(cx - tc - tw, G.hipY) + " L" + pt(cx - kc - kw, G.kY) + " L" + pt(cx - ac - aw, hemY) + " L" + pt(cx - ac + aw, hemY) + " L" + pt(cx - kc + kw, G.kY) + " L" + pt(cx - 1, G.crY) +
      " L" + pt(cx + 1, G.crY) + " L" + pt(cx + kc - kw, G.kY) + " L" + pt(cx + ac - aw, hemY) + " L" + pt(cx + ac + aw, hemY) + " L" + pt(cx + kc + kw, G.kY) + " L" + pt(cx + tc + tw, G.hipY) + " L" + pt(cx + ww, top) + " Z";
    return { d: p, hemY: hemY, W: W };
  }
  function hair(m, G, back) {
    var x = G.cx, y = G.hy, r = m.r, c = m.hair;
    if (back) {
      if (m.hs === "long") return '<path d="M' + pt(x - r - 3, y - 2) + " C" + pt(x - r - 5, y - r * 1.5) + " " + pt(x + r + 5, y - r * 1.5) + " " + pt(x + r + 3, y - 2) + " L" + pt(x + r + 6, y + r * 2.7) + " Q" + pt(x, y + r * 3.1) + " " + pt(x - r - 6, y + r * 2.7) + ' Z" fill="' + c + '"/>';
      if (m.hs === "pony") return '<ellipse cx="' + (x + r * .95) + '" cy="' + (y + r * .55) + '" rx="' + (r * .42) + '" ry="' + (r * 1.15) + '" transform="rotate(-18 ' + (x + r * .95) + " " + (y + r * .55) + ')" fill="' + c + '"/>';
      return "";
    }
    var cap = "M" + pt(x - r - 1, y + 3) + " C" + pt(x - r - 2.5, y - r * 1.45) + " " + pt(x + r + 2.5, y - r * 1.45) + " " + pt(x + r + 1, y + 3) + " C" + pt(x + r * .55, y - r * .5) + " " + pt(x - r * .35, y - r * .62) + " " + pt(x - r - 1, y + 3) + " Z";
    var o = '<path d="' + cap + '" fill="' + c + '"/>';
    if (m.hs === "fluffy" || m.hs === "kid") o += '<circle cx="' + (x - r * .45) + '" cy="' + (y - r * .78) + '" r="' + (r * .42) + '" fill="' + c + '"/><circle cx="' + (x + r * .15) + '" cy="' + (y - r * .92) + '" r="' + (r * .45) + '" fill="' + c + '"/><circle cx="' + (x + r * .62) + '" cy="' + (y - r * .7) + '" r="' + (r * .36) + '" fill="' + c + '"/>';
    if (m.hs === "pony") o += '<rect x="' + (x + r * .62) + '" y="' + (y - r * .35) + '" width="5" height="7" rx="2" fill="#c8ff2e" transform="rotate(-18 ' + (x + r * .62) + " " + (y - r * .35) + ')"/>';
    if (m.hs === "long") o += '<path d="M' + pt(x - r * .1, y - r * .95) + " Q" + pt(x - r * .9, y - r * .3) + " " + pt(x - r - 1, y + r * .9) + '" stroke="' + shade(c.length === 7 ? c : "#222222", .12) + '" stroke-width="1.2" fill="none"/>';
    return o;
  }
  function bottomSVG(m, G, it, col) {
    var kind = { jeans: "slim", baggy: "baggy", cargo: "cargo", pant: "straight", jogger: "jogger", shorts: "shorts", set: "straight" }[it.type] || "straight";
    var o = "", sd = shade(col, -.25), hl = "rgba(255,255,255,.16)", ln = "rgba(0,0,0,.28)";
    if (kind === "shorts") {
      var L = legs(m, G, "straight"), sy = G.hipY + (G.kY - G.hipY) * .78, hw = m.hw, cx = G.cx;
      var p = "M" + pt(cx - m.ww - 3, G.wY - 2) + " L" + pt(cx - hw * 1.1, G.hipY) + " L" + pt(cx - hw * 1.08, sy) + " L" + pt(cx - 2, sy) + " L" + pt(cx - 1, G.crY) + " L" + pt(cx + 1, G.crY) + " L" + pt(cx + 2, sy) + " L" + pt(cx + hw * 1.08, sy) + " L" + pt(cx + hw * 1.1, G.hipY) + " L" + pt(cx + m.ww + 3, G.wY - 2) + " Z";
      return '<path class="gm" d="' + p + '" style="fill:' + col + '"/><path d="' + p + '" fill="url(#rxShade)"/><rect x="' + (cx - m.ww - 3) + '" y="' + (G.wY - 3) + '" width="' + (2 * m.ww + 6) + '" height="6" rx="2" style="fill:' + sd + '"/><path d="M' + pt(cx, G.wY + 3) + " L" + pt(cx, G.crY - 4) + '" stroke="' + ln + '" stroke-width="1"/>';
    }
    var Lg = legs(m, G, kind);
    o += '<path class="gm" d="' + Lg.d + '" style="fill:' + col + '"/><path d="' + Lg.d + '" fill="url(#rxShade)"/>';
    o += '<rect x="' + (G.cx - m.ww - 3) + '" y="' + (G.wY - 3) + '" width="' + (2 * m.ww + 6) + '" height="7" rx="2" style="fill:' + sd + '"/>';
    o += '<path d="M' + pt(G.cx, G.wY + 4) + " Q" + pt(G.cx + 2, G.crY - 10) + " " + pt(G.cx, G.crY - 3) + '" stroke="' + ln + '" stroke-width="1.1" fill="none"/>';
    var hw = m.hw, W = Lg.W;
    [-1, 1].forEach(function (s) {
      var kx = G.cx + s * W[3] * hw, ax = G.cx + s * W[5] * hw, hx = G.cx + s * W[1] * hw;
      if (kind === "slim" || kind === "baggy") { // denim: pocket curve + centre seam
        o += '<path d="M' + pt(G.cx + s * (m.ww - 2), G.wY + 5) + " Q" + pt(G.cx + s * (m.ww - 6), G.wY + 14) + " " + pt(G.cx + s * (m.ww - 14), G.wY + 15) + '" stroke="' + hl + '" stroke-width="1.2" fill="none"/>';
        o += '<path d="M' + pt(hx, G.hipY + 6) + " L" + pt(kx, G.kY) + " L" + pt(ax, Lg.hemY - 3) + '" stroke="' + hl + '" stroke-width="1" fill="none" stroke-dasharray="3 3"/>';
      }
      if (kind === "cargo") { // side cargo pocket with flap
        var px = G.cx + s * (W[1] + W[0] * .55) * hw, py = G.hipY + (G.kY - G.hipY) * .38, pw = hw * .42, ph = (G.kY - G.hipY) * .42;
        o += '<rect x="' + (px - pw / 2).toFixed(1) + '" y="' + py.toFixed(1) + '" width="' + pw.toFixed(1) + '" height="' + ph.toFixed(1) + '" rx="2" style="fill:' + sd + '"/><rect x="' + (px - pw / 2 - .5).toFixed(1) + '" y="' + py.toFixed(1) + '" width="' + (pw + 1).toFixed(1) + '" height="5" rx="1.5" style="fill:' + shade(col, -.38) + '"/>';
      }
      if (kind === "jogger") o += '<rect x="' + (ax - W[4] * hw - .5).toFixed(1) + '" y="' + (Lg.hemY - 7).toFixed(1) + '" width="' + (2 * W[4] * hw + 1).toFixed(1) + '" height="7" rx="2" style="fill:' + sd + '"/>';
      if (/stripe/i.test(it.p.name)) o += '<path d="M' + pt(G.cx + s * (W[1] + W[0]) * hw - s * 2.5, G.hipY) + " L" + pt(kx + s * W[2] * hw - s * 2.5, G.kY) + " L" + pt(ax + s * W[4] * hw - s * 2.5, Lg.hemY - 2) + '" stroke="rgba(255,255,255,.85)" stroke-width="2.4" fill="none"/>';
    });
    if (kind === "jogger" || kind === "straight" && /track|lower|jogger/i.test(it.p.name)) o += '<path d="M' + pt(G.cx - 3, G.wY + 3) + " l-2 12 M" + pt(G.cx + 3, G.wY + 3) + ' l2 12" stroke="rgba(255,255,255,.7)" stroke-width="1.2" stroke-linecap="round"/>';
    return o;
  }
  function topSVG(m, G, it, col) {
    var t = it.type, o = "", sd = shade(col, -.22), ln = "rgba(0,0,0,.25)", aw = G.aw, cx = G.cx;
    var long = /hoodie|ziphoodie|sweatshirt|sweater|jacket|puffer|teeFull|shrug/.test(t) || (/full/i.test(it.p.name) && t !== "crop"), sleeveT = long ? 1 : (t === "kurti" ? .78 : .3);
    if (t === "crop" && /tube|halter|off shoulder/i.test(it.p.name)) sleeveT = 0;
    var pad = /puffer/.test(t) ? 5 : /hoodie|sweatshirt|jacket/.test(t) ? 3.5 : /tee|polo/.test(t) && /oversize|drop/i.test(it.p.name) ? 4 : 2;
    var hem = t === "crop" ? G.wY - G.L * .05 : t === "kurti" || t === "set" ? G.kY - 4 : t === "shrug" ? G.kY - 18 : /puffer|jacket/.test(t) ? G.hipY + 4 : G.hipY + (pad > 3 ? 12 : 7);
    var hemHalf = t === "kurti" || t === "set" ? m.hw + 12 : t === "shrug" ? m.hw + 8 : null;
    if (t === "shrug") { // inner plain tee + open long shrug
      var inner = torsoPath(m, G, 1, G.hipY + 4); o += '<path d="' + inner + '" fill="#efe9dc"/>';
      [-1, 1].forEach(function (s) { o += sleeve(G, s, 1, aw + 6, col); });
      var tp = torsoPath(m, G, pad, hem, hemHalf);
      o += '<path class="gm" d="' + tp + '" style="fill:' + col + '"/><path d="' + tp + '" fill="url(#rxShade)"/>';
      o += '<path d="M' + pt(cx - m.r * .5, G.sY - 1) + " L" + pt(cx - 6, hem) + " L" + pt(cx + 6, hem) + " L" + pt(cx + m.r * .5, G.sY - 1) + ' Z" fill="#efe9dc"/>';
      return o;
    }
    if (sleeveT > 0) [-1, 1].forEach(function (s) { o += sleeve(G, s, sleeveT, aw + (long ? 5 : 7), col); if (long && t !== "kurti") { var w = G.wr(s); o += '<circle cx="' + w[0].toFixed(1) + '" cy="' + (w[1] - 1).toFixed(1) + '" r="' + ((aw + 5) / 2).toFixed(1) + '" style="fill:' + sd + '"/>'; } });
    var tp2 = torsoPath(m, G, pad, hem, hemHalf);
    if (t === "crop" && sleeveT === 0) tp2 = torsoPath(m, G, pad, hem, null).replace(/Q[^L]+L/, "L"); // strap-less shape
    o += '<path class="gm" d="' + tp2 + '" style="fill:' + col + '"/><path d="' + tp2 + '" fill="url(#rxShade)"/>';
    if (t === "crop" && sleeveT === 0) { o += '<path d="M' + pt(cx - m.sw + 3, G.sY + 8) + " L" + pt(cx - m.sw * .25, G.sY - 3) + " M" + pt(cx + m.sw - 3, G.sY + 8) + " L" + pt(cx + m.sw * .25, G.sY - 3) + '" stroke="' + col + '" stroke-width="3" stroke-linecap="round"/>'; }
    if (/sweatshirt|hoodie|ziphoodie|sweater/.test(t)) o += '<rect x="' + (cx - m.hw - pad).toFixed(1) + '" y="' + (hem - 6).toFixed(1) + '" width="' + (2 * (m.hw + pad)).toFixed(1) + '" height="6" rx="2" style="fill:' + sd + '"/>';
    if (/puffer/.test(t)) for (var q = 1; q < 5; q++) { var yy = G.sY + (hem - G.sY) * q / 5; o += '<path d="M' + pt(cx - m.sw - pad + 3, yy) + " Q" + pt(cx, yy + 4) + " " + pt(cx + m.sw + pad - 3, yy) + '" stroke="' + ln + '" stroke-width="1.3" fill="none"/>'; }
    // necklines
    var nr = m.r * .5;
    if (t === "hoodie" || t === "ziphoodie") {
      o += '<path d="M' + pt(cx - nr - 9, G.sY + 2) + " Q" + pt(cx - nr - 6, G.sY - 15) + " " + pt(cx, G.sY - 13) + " Q" + pt(cx + nr + 6, G.sY - 15) + " " + pt(cx + nr + 9, G.sY + 2) + " Q" + pt(cx, G.sY + 16) + " " + pt(cx - nr - 9, G.sY + 2) + ' Z" style="fill:' + sd + '"/>';
      o += '<path d="M' + pt(cx - 4, G.sY + 8) + " l-1 20 M" + pt(cx + 4, G.sY + 8) + ' l1 20" stroke="rgba(255,255,255,.75)" stroke-width="1.3" stroke-linecap="round"/>';
      if (t === "hoodie") o += '<path d="M' + pt(cx - m.ww + 3, hem - 9) + " L" + pt(cx - m.ww + 9, G.wY - 4) + " L" + pt(cx + m.ww - 9, G.wY - 4) + " L" + pt(cx + m.ww - 3, hem - 9) + ' Z" style="fill:' + sd + '" opacity=".75"/>';
      else o += '<path d="M' + pt(cx, G.sY + 10) + " L" + pt(cx, hem) + '" stroke="' + shade(col, -.45) + '" stroke-width="1.6"/>';
    } else if (t === "shirt" || t === "polo" || (t === "jacket" && /denim|biker|leather/i.test(it.p.name))) {
      o += '<path d="M' + pt(cx - nr - 3, G.sY - 4) + " L" + pt(cx, G.sY + 9) + " L" + pt(cx - nr - 8, G.sY + 8) + ' Z" style="fill:' + shade(col, .12) + '" stroke="' + ln + '" stroke-width=".8"/><path d="M' + pt(cx + nr + 3, G.sY - 4) + " L" + pt(cx, G.sY + 9) + " L" + pt(cx + nr + 8, G.sY + 8) + ' Z" style="fill:' + shade(col, .12) + '" stroke="' + ln + '" stroke-width=".8"/>';
      var bEnd = t === "polo" ? G.sY + 26 : hem - 4; o += '<path d="M' + pt(cx, G.sY + 9) + " L" + pt(cx, bEnd) + '" stroke="' + ln + '" stroke-width="1"/>';
      for (var b = G.sY + 16; b < bEnd; b += t === "polo" ? 8 : 16) o += '<circle cx="' + cx + '" cy="' + b.toFixed(1) + '" r="1.3" fill="rgba(255,255,255,.7)"/>';
    } else if (/jacket|puffer/.test(t)) {
      o += '<path d="M' + pt(cx - nr - 2, G.sY - 5) + " Q" + pt(cx, G.sY - 9) + " " + pt(cx + nr + 2, G.sY - 5) + " L" + pt(cx + nr + 2, G.sY + 3) + " Q" + pt(cx, G.sY) + " " + pt(cx - nr - 2, G.sY + 3) + ' Z" style="fill:' + sd + '"/><path d="M' + pt(cx, G.sY + 2) + " L" + pt(cx, hem) + '" stroke="' + shade(col, -.5) + '" stroke-width="1.6"/>';
    } else if (t === "sweater" && /high neck|highneck/i.test(it.p.name + " " + (it.p.tag || ""))) {
      o += '<rect x="' + (cx - nr - 1).toFixed(1) + '" y="' + (G.sY - 13).toFixed(1) + '" width="' + (2 * nr + 2).toFixed(1) + '" height="15" rx="4" style="fill:' + shade(col, -.08) + '"/>';
    } else if (t === "kurti" || t === "set" || /v-neck|v neck/i.test(it.p.name)) {
      o += '<path d="M' + pt(cx - nr, G.sY - 2) + " L" + pt(cx, G.sY + 16) + " L" + pt(cx + nr, G.sY - 2) + ' Z" fill="' + m.skin + '"/><path d="M' + pt(cx - nr - 1, G.sY - 2) + " L" + pt(cx, G.sY + 17) + " L" + pt(cx + nr + 1, G.sY - 2) + '" stroke="' + sd + '" stroke-width="2" fill="none"/>';
      if (t === "kurti" || t === "set") o += '<path d="M' + pt(cx - m.hw - 5, G.hipY + 14) + " L" + pt(cx - m.hw - 10, hem - 2) + " M" + pt(cx + m.hw + 5, G.hipY + 14) + " L" + pt(cx + m.hw + 10, hem - 2) + '" stroke="' + ln + '" stroke-width="1"/>';
    } else if (sleeveT > 0) {
      o += '<path d="M' + pt(cx - nr, G.sY - 2) + " Q" + pt(cx, G.sY + 9) + " " + pt(cx + nr, G.sY - 2) + '" stroke="' + sd + '" stroke-width="3" fill="' + m.skin + '"/>';
    }
    return o;
  }
  function figure(mk, top, bot) {
    var m = MODELS[mk], G = geo(m), o = '<svg viewBox="0 0 200 462" class="ob-fig" role="img" aria-label="' + m.name + ' model wearing the chosen outfit (colour preview)"><defs><linearGradient id="rxShade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient><radialGradient id="rxFloor"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>';
    o += '<ellipse cx="100" cy="' + (G.sole + 1) + '" rx="' + (m.hw * 1.9) + '" ry="7" fill="url(#rxFloor)"/>';
    o += hair(m, G, true);
    // body (skin)
    [-1, 1].forEach(function (s) { o += '<path d="' + limb(G.sh(s), G.el(s)) + " L" + pt(G.wr(s)[0], G.wr(s)[1]) + '" stroke="' + m.skin + '" stroke-width="' + G.aw.toFixed(1) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + (G.wr(s)[0] + s * .5).toFixed(1) + '" cy="' + (G.wr(s)[1] + G.aw * .55).toFixed(1) + '" r="' + (G.aw * .58).toFixed(1) + '" fill="' + m.skin + '"/>'; });
    o += '<path d="' + legs(m, G, "skin").d + '" fill="' + m.skin + '"/>';
    o += '<path d="' + torsoPath(m, G, 0, G.crY + 2) + '" fill="' + m.skin + '"/>';
    o += '<rect x="' + (100 - m.r * .42).toFixed(1) + '" y="' + (G.hy + m.r * .5).toFixed(1) + '" width="' + (m.r * .84).toFixed(1) + '" height="' + (G.sY - G.hy - m.r * .5 + 4).toFixed(1) + '" fill="' + shade(m.skin, -.08) + '"/>';
    o += '<circle cx="100" cy="' + G.hy.toFixed(1) + '" r="' + m.r + '" fill="' + m.skin + '"/>';
    o += '<ellipse cx="' + (100 - m.r + 1) + '" cy="' + (G.hy + 2) + '" rx="2.6" ry="4.2" fill="' + shade(m.skin, -.06) + '"/><ellipse cx="' + (100 + m.r - 1) + '" cy="' + (G.hy + 2) + '" rx="2.6" ry="4.2" fill="' + shade(m.skin, -.06) + '"/>';
    o += hair(m, G, false);
    // shoes
    [-1, 1].forEach(function (s) { var x = 100 + s * m.hw * .45, w = m.hw * .62; o += '<path d="M' + pt(x - w / 2 + (s > 0 ? 0 : -3), G.sole) + " L" + pt(x - w / 2 + (s > 0 ? 0 : -3), G.sole - 9) + " Q" + pt(x, G.sole - 15) + " " + pt(x + w / 2 + (s > 0 ? 3 : 0), G.sole - 7) + " L" + pt(x + w / 2 + (s > 0 ? 3 : 0), G.sole) + ' Z" fill="' + m.shoe + '"/><rect x="' + (x - w / 2 - 3).toFixed(1) + '" y="' + (G.sole - 2.5) + '" width="' + (w + 6).toFixed(1) + '" height="2.5" rx="1" fill="' + (m.shoe === "#1d1d1f" ? "#444" : "#bdbab2") + '"/>'; });
    o += '<g class="ob-gb">' + (bot ? bottomSVG(m, G, bot, bot.hex) : '<path d="' + legs(m, G, "straight").d + '" class="ob-ghost"/>') + "</g>";
    o += '<g class="ob-gt">' + (top ? topSVG(m, G, top, top.hex) : '<path d="' + torsoPath(m, G, 2, G.hipY + 6) + '" class="ob-ghost"/>') + "</g>";
    if (m.hs === "long") { var hx = 100, hy2 = G.hy, rr = m.r; [-1, 1].forEach(function (s) { o += '<path d="M' + pt(hx + s * (rr - 1), hy2 - 4) + " C" + pt(hx + s * (rr + 7), hy2 + rr) + " " + pt(hx + s * (rr + 4), G.sY + 4) + " " + pt(hx + s * (rr * .95 + 6), G.chY + 10) + " L" + pt(hx + s * (rr * .95 - 2), G.chY + 8) + " C" + pt(hx + s * (rr * .6), G.sY) + " " + pt(hx + s * (rr * .7), hy2 + rr * .6) + " " + pt(hx + s * (rr - 6), hy2 - 2) + ' Z" fill="' + m.hair + '"/>'; }); }
    // re-draw head + hair on top of hoods/collars
    if (top && /hoodie|ziphoodie|sweater|jacket|puffer/.test(top.type)) { o += '<circle cx="100" cy="' + G.hy.toFixed(1) + '" r="' + m.r + '" fill="' + m.skin + '"/>' + hair(m, G, false); }
    return o + "</svg>";
  }

  /* ---------- state ---------- */
  var q = new URLSearchParams(location.search);
  var S = { m: MODELS[q.get("m")] ? q.get("m") : "boy", top: null, bot: null, gt: "All", gb: "All" };
  function pool(role, mk) { var g = MODELS[mk || S.m].g; return ITEMS.filter(function (it) { return it.role === role && it.g === g; }); }
  function bestBottomsFor(top, mk) {
    var bs = pool("b", mk); if (!top || !bs.length) return [];
    var scored = bs.map(function (b) { var v = match(top, b); return { it: b, v: v, s: v.k * 10 + v.sc + (b.p.rating || 3.8) * .4 }; }).sort(function (a, b) { return b.s - a.s; });
    var seen = {}, pick = [];
    scored.forEach(function (x) { var g = BOTGRP[x.it.type]; if (g === "Shorts" || seen[g] || pick.length >= 3) return; seen[g] = 1; pick.push(x); });
    if (pick.length < 3) scored.forEach(function (x) { if (pick.length < 3 && pick.indexOf(x) < 0 && BOTGRP[x.it.type] !== "Shorts") pick.push(x); });
    return pick.slice(0, 3);
  }
  function defaults() {
    var tops = pool("t"); if (!tops.length) { S.top = null; S.bot = null; return; }
    if (!S.top || S.top.g !== MODELS[S.m].g) S.top = (MODELS[S.m].g === "m" && byKey.p190 && byKey.p190.cut) ? byKey.p190 : tops.slice().sort(function (a, b) { return (b.cut ? 9 : 0) - (a.cut ? 9 : 0) + (b.p.rating || 0) * Math.log(1 + (b.p.rc || 1)) - (a.p.rating || 0) * Math.log(1 + (a.p.rc || 1)); })[0];
    if (!S.bot || S.bot.g !== MODELS[S.m].g) { var bb = bestBottomsFor(S.top), bc = bb.filter(function (x) { return x.it.cut && x.v.k >= 1; }); S.bot = bc.length ? bc[0].it : bb.length ? bb[0].it : null; }
  }
  (function fromURL() {
    var t = byKey[q.get("top") || ""], b = byKey[q.get("bottom") || ""], one = byKey[q.get("p") || ""];
    if (one) { if (one.role === "t") t = one; else if (one.role === "b") b = one; if (!q.get("m")) S.m = one.g === "f" ? "women" : one.g === "k" ? "kids" : "boy"; }
    if (t && t.role === "t") S.top = t; if (b && b.role === "b") S.bot = b;
    if (S.top && MODELS[S.m].g !== S.top.g) S.m = S.top.g === "f" ? "women" : "boy";
  })();

  /* ---------- render ---------- */
  var root = $("#ob"); if (!root) return;
  function stars(p) { return p.rating ? '<span class="ob-rt">' + p.rating.toFixed(1) + "★</span>" : ""; }
  function verdictHTML() {
    if (S.m === "kids") return "";
    if (!S.top || !S.bot) return '<div class="ob-vd ob-v0"><b>' + (S.top ? "Bottom" : "Top") + " chuno</b><span>Dono chunne pe colour match dikhega.</span></div>";
    var v = match(S.top, S.bot), B = BADGE[v.k];
    return '<div class="ob-vd ob-v' + v.k + '" aria-live="polite"><b>' + B[1] + '</b><span>' + H(v.why) + '</span><span class="ob-sw"><i style="background:' + S.top.hex + '"></i><i style="background:' + S.bot.hex + '"></i></span></div>';
  }
  function kidsHTML() {
    var sets = ITEMS.filter(function (it) { return it.g === "k"; });
    var h = '<div class="ob-note">🧒 Kids ke liye abhi alag <b>tops</b> aur <b>bottoms</b> RIXU Picks pe nahi hain — jaldi aayenge 🙏 Abhi ' + (sets.length ? "sirf ek Kurta Pajama set hai (top + bottom saath aata hai) — model pe dikh raha hai, neeche se Meesho pe le sakte ho." : "kuch nahi hai.") + "</div>";
    return h;
  }
  function pin(it, slot, yPct) {
    if (!it) return '<div class="ob-pin ob-pe" style="top:' + yPct + '%"><span>' + (slot === "t" ? "Top" : "Bottom") + "<br>chuno 👇</span></div>";
    return '<button type="button" class="ob-pin" data-pdp="' + it.key + '" style="top:' + yPct + '%" aria-label="' + H(it.p.name) + '"><span class="ob-tag">' + (slot === "t" ? "UPAR" : slot === "s" ? "SET" : "NICHE") + '</span><img src="' + it.p.img + '" alt="" width="104" height="130" decoding="async"><i class="ob-dot" style="background:' + it.hex + '"></i></button>';
  }
  function row(it, slot) {
    if (!it) return "";
    var p = it.p;
    return '<div class="ob-row"><img src="' + p.img + '" alt="" width="56" height="70" loading="lazy" decoding="async"><div class="ob-ri"><span class="ob-ty">' + (slot === "t" ? "Upar · " : slot === "s" ? "Set · " : "Niche · ") + H(label(it)) + '</span><b>' + H(p.name) + '</b><span class="ob-mt"><i class="ob-dot" style="background:' + it.hex + '"></i>' + cname(it) + ' · <span class="ob-pr">' + money(p.price) + (p.mrp && p.mrp > p.price ? " <s>" + money(p.mrp) + "</s>" : "") + "</span> " + stars(p) + '</span></div><a class="ob-buy" href="' + H(p.link) + '" target="_blank" rel="noopener sponsored">Buy on Meesho</a></div>';
  }
  var CV = null;
  function stage() {
    var kids = S.m === "kids", kset = kids ? ITEMS.filter(function (it) { return it.g === "k"; })[0] : null;
    var top = kids ? kset : S.top, bot = kids ? (kset ? { type: "pant", hex: "#efe7d4", p: { name: "pajama" }, role: "b", cut: null } : null) : S.bot;
    var st = $("#ob-stage");
    if (!st.querySelector(".ob-figw")) st.innerHTML = '<div class="ob-figw"></div><div class="ob-pins"></div><span class="ob-cap"></span>';
    if (!CV && window.RXC) CV = new RXC.Stage(st.querySelector(".ob-figw"));
    if (CV) CV.render(S.m, top, bot);
    st.querySelector(".ob-pins").innerHTML = kids ? (kset ? pin(kset, "s", 30) : "") : pin(S.top, "t", 28) + pin(S.bot, "b", 68);
    var asCard = [top, bot].filter(function (it) { return it && it.p && it.p.img && !it.cut; }).length;
    st.querySelector(".ob-cap").textContent = MODELS[S.m].name + (asCard ? " · kuch item ka sirf rang (photo saaf nahi kati)" : " · asli Meesho photo ka kapda") + " · ↔ ghumao";
    $("#ob-fit").innerHTML = kids ? (kset ? row(kset, "s") : "") : row(S.top, "t") + row(S.bot, "b");
    $("#ob-verdict").innerHTML = verdictHTML();
    try { var u = new URL(location.href); u.searchParams.set("m", S.m); if (S.top && !kids) u.searchParams.set("top", S.top.key); else u.searchParams.delete("top"); if (S.bot && !kids) u.searchParams.set("bottom", S.bot.key); else u.searchParams.delete("bottom"); u.searchParams.delete("p"); history.replaceState(null, "", u.pathname + u.search); } catch (e) {}
  }
  function models() {
    $("#ob-models").innerHTML = ORDER.map(function (k) { var m = MODELS[k]; return '<button type="button" class="ob-mb' + (S.m === k ? " on" : "") + '" data-m="' + k + '" aria-pressed="' + (S.m === k) + '">' + mini(k) + "<span>" + m.name + "</span></button>"; }).join("");
  }
  function mini(k) { if (!window.RXC) return ""; var m = RXC.MODELS[k], s = 436 / m.H, top = 452 - m.H * s, hgt = (m.hr * 2 + 16) * s; return '<svg viewBox="' + (100 - hgt * .62).toFixed(1) + " " + (top - 3).toFixed(1) + " " + (hgt * 1.24).toFixed(1) + " " + (hgt + 3).toFixed(1) + '" aria-hidden="true">' + RXC.svgChar(k, "f", "under") + RXC.svgChar(k, "f", "over") + "</svg>"; }
  function strip(role) {
    var box = $(role === "t" ? "#ob-pt" : "#ob-pb"); if (!box) return;
    if (S.m === "kids") { box.innerHTML = role === "t" ? kidsHTML() : ""; return; }
    var gk = role === "t" ? "gt" : "gb", list = pool(role), GR = role === "t" ? TOPGRP : BOTGRP, groups = ["All"], other = role === "t" ? S.bot : S.top, mine = role === "t" ? S.top : S.bot;
    list.forEach(function (it) { var g = GR[it.type]; if (g && groups.indexOf(g) < 0) groups.push(g); });
    if (groups.indexOf(S[gk]) < 0) S[gk] = "All";
    var shown = list.filter(function (it) { return S[gk] === "All" || GR[it.type] === S[gk]; }).map(function (it) { return { it: it, v: other ? (role === "t" ? match(it, other) : match(other, it)) : null }; });
    if (role === "b" && other) shown.sort(function (a, b) { return (b.v.k * 10 + b.v.sc) - (a.v.k * 10 + a.v.sc); });
    else shown.sort(function (a, b) { return (b.it.cut ? 1 : 0) - (a.it.cut ? 1 : 0); });
    var miss = "";
    if (role === "b") { var have = {}; list.forEach(function (it) { have[BOTGRP[it.type]] = 1; }); var need = ["Jeans", "Baggy Jeans", "Cargo", "Full Pant"].filter(function (g) { return !have[g]; });
      if (need.length) miss = '<p class="ob-miss">ℹ️ ' + MODELS[S.m].name + " ke liye abhi " + need.join(", ") + " collection me nahi " + (need.length > 1 ? "hain" : "hai") + " — jaldi add karenge.</p>"; }
    var old = box.querySelector(".ob-rail"), sl = old ? old.scrollLeft : 0, same = box.dataset.k === S.m + role + S[gk];
    box.innerHTML = '<div class="ob-sh"><b>' + (role === "t" ? "👕 Upar chuno" : "👖 Niche chuno") + "</b><span>" + list.length + " " + (role === "t" ? "tops" : "bottoms") + (other ? " · badge = match" : "") + "</span></div>" +
      '<div class="ob-grp">' + groups.map(function (g) { return '<button type="button" data-grp="' + H(g) + '" data-role="' + role + '" class="' + (S[gk] === g ? "on" : "") + '">' + H(g) + "</button>"; }).join("") + "</div>" + miss +
      '<div class="ob-rail" role="list">' + shown.map(function (x) { var it = x.it, on = mine === it;
        return '<button type="button" role="listitem" class="ob-th' + (on ? " on" : "") + '" data-pick="' + it.key + '" aria-pressed="' + on + '" aria-label="' + H(it.p.name) + " " + money(it.p.price) + (x.v ? " — " + BADGE[x.v.k][1] : "") + '"><img src="' + it.p.img + '" alt="" loading="lazy" decoding="async" width="84" height="104">' +
          (x.v ? '<em class="ob-mk ob-k' + x.v.k + '">' + BADGE[x.v.k][1].split(" ")[0] + "</em>" : "") + (it.cut ? '<u class="ob-real" title="Asli kapda model pe">📸</u>' : "") + '<i class="ob-dot" style="background:' + it.hex + '"></i><span>' + H(label(it)) + "</span><b>" + money(it.p.price) + "</b></button>"; }).join("") + "</div>";
    box.dataset.k = S.m + role + S[gk];
    if (same && sl) box.querySelector(".ob-rail").scrollLeft = sl;
  }
  function picker() { strip("t"); strip("b"); sug(); }
  function sug() {
    var el = $("#ob-sug"); if (S.m === "kids" || !S.top) { el.innerHTML = ""; return; }
    var best = bestBottomsFor(S.top), all = pool("b"), have = {}; all.forEach(function (it) { have[BOTGRP[it.type]] = 1; });
    var miss = ["Jeans", "Baggy Jeans", "Cargo", "Full Pant"].filter(function (g) { return !have[g]; });
    el.innerHTML = '<h2 class="sec ob-h2">Is top ke saath kya pehne? 🤔</h2><p class="ob-sub">' + H(S.top.p.name) + " (" + cname(S.top) + ") ke saath RIXU ke 3 best bottoms:</p>" +
      (best.length ? '<div class="ob-sgl">' + best.map(function (x, i) { var b = x.it, B = BADGE[x.v.k];
        return '<div class="ob-sg"><span class="ob-n">' + (i + 1) + '</span><button type="button" class="ob-sgi" data-wear="' + b.key + '" aria-label="Model pe pehnao: ' + H(b.p.name) + '"><img src="' + b.p.img + '" alt="" loading="lazy" decoding="async" width="84" height="105"></button><div class="ob-sgt"><span class="ob-ty">' + H(botLabel(b)) + '</span><b>' + H(b.p.name) + '</b><span class="ob-vb ob-v' + x.v.k + '">' + B[1] + "</span><small>" + H(x.v.why) + '</small><span class="ob-pr">' + money(b.p.price) + " " + stars(b.p) + '</span><div class="ob-act"><button type="button" class="ob-wear" data-wear="' + b.key + '">' + (S.bot === b ? "✓ Pehna hai" : "Pehna ke dekho") + '</button><a class="ob-buy sm" href="' + H(b.p.link) + '" target="_blank" rel="noopener sponsored">Buy on Meesho</a></div></div></div>'; }).join("") + "</div>" : '<p class="ob-miss">Is model ke liye abhi koi bottom collection me nahi hai 🙏</p>') +
      (miss.length && best.length ? '<p class="ob-miss">ℹ️ ' + miss.join(", ") + " abhi " + MODELS[S.m].name + " collection me nahi — isliye wo suggestion nahi aaya.</p>" : "");
  }
  function all() { defaults(); models(); stage(); picker(); }

  /* ---------- events ---------- */
  root.addEventListener("click", function (e) {
    var t = e.target.closest("[data-m],[data-grp],[data-pick],[data-wear],[data-shuffle],[data-pdp],[data-share]"); if (!t) return;
    if (t.dataset.m) { if (S.m === t.dataset.m) return; var g0 = MODELS[S.m].g; S.m = t.dataset.m; if (MODELS[S.m].g !== g0) { S.top = null; S.bot = null; S.gt = S.gb = "All"; } all(); return; }
    if (t.dataset.grp) { S[t.dataset.role === "t" ? "gt" : "gb"] = t.dataset.grp; strip(t.dataset.role); return; }
    if (t.dataset.pick) { var it = byKey[t.dataset.pick]; if (!it) return; if (it.role === "t") S.top = it; else S.bot = it; stage(); picker(); return; }
    if (t.dataset.wear) { var b = byKey[t.dataset.wear]; if (!b) return; S.bot = b; stage(); picker(); var st = $("#ob-stage"); if (st.getBoundingClientRect().top < 40 || st.getBoundingClientRect().bottom > innerHeight) window.scrollTo({ top: Math.max(0, $("#ob-models").getBoundingClientRect().top + scrollY - 60), behavior: REDUCE ? "auto" : "smooth" }); return; }
    if (t.hasAttribute("data-shuffle")) { var tops = pool("t"); if (!tops.length) return; S.top = tops[Math.floor(Math.random() * tops.length)]; var bb = bestBottomsFor(S.top); S.bot = bb.length ? bb[Math.floor(Math.random() * bb.length)].it : null; stage(); picker(); return; }
    if (t.dataset.pdp) { location.href = "index.html#p-" + t.dataset.pdp; return; }
    if (t.hasAttribute("data-share")) {
      var url = location.href, txt = "Ye fit dekho 👕 RIXU Picks Outfit Banao: " + (S.top ? S.top.p.name : "") + (S.bot ? " + " + S.bot.p.name : "");
      if (navigator.share) navigator.share({ title: "RIXU Picks — Outfit Banao", text: txt, url: url }).catch(function () {}); else window.open("https://wa.me/?text=" + encodeURIComponent(txt + " " + url), "_blank", "noopener");
    }
  });
  function bump(el) { if (!el) return; el.classList.remove("ob-flash"); void el.offsetWidth; el.classList.add("ob-flash"); }
  window.RixuOutfit = { match: match, items: ITEMS, fam: fam };
  all();
})();
