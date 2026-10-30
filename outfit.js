/* RIXU Outfit Banao 👕 — Look Board (v20261030g). Pick a model, a top and a bottom from RIXU's real Meesho picks and see them
   together as a Pinterest-style board made of the products' REAL Meesho photos + live colour match. Vanilla JS, no libraries.
   Garment colour = dominant colour read from the product photo (outfit-data.js). Prices + affiliate links always come from products.js. */
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
    ITEMS.push({ p: p, key: keyOf(p.img), role: r[1], g: r[2], type: r[3], hex: r[4], lab: r[5], src: r[6], print: !!r[7] });
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

  ORDER.forEach(function (k) { MODELS[k].ico = { boy: "👦", girl: "👧", men: "👨", women: "👩", kids: "🧒" }[k]; });
  var LS = (function () { try { var t = "__rx"; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch (e) { return null; } })();
  function lsGet(k, def) { try { var v = LS && LS.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { LS && LS.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p || 8); } catch (e) {} }
  function trending(p) { return (p.rating || 0) >= 4.2 && (p.rc || 0) >= 1000; } // real Meesho numbers from products.js

  /* ---------- photos per product (real Meesho photos; RX_SPIN = cleaned gallery.js list, no size charts) ---------- */
  var SPIN = typeof RX_SPIN !== "undefined" ? RX_SPIN : {};
  function photos(p) { var g = SPIN[p.img]; return g && g.length ? g : [p.img]; }

  /* ---------- optional 3rd slot: shoes / accessories (only what the catalogue has) ---------- */
  var EXTRA_G = { m: ["p50", "p41", "p38", "p39", "p43", "p40", "p42", "p44", "p45", "p47", "p75", "p81", "p80", "p82", "p83", "p84", "p25", "p26", "p27"], f: ["p75", "p81", "p83"] };
  var EXTRAS = {}; PRODUCTS.forEach(function (p) { if ((p.cat === "shoes" || p.cat === "acc") && p.link) { var k = keyOf(p.img); EXTRAS[k] = { p: p, key: k, role: "s", acc: p.cat === "acc" }; } });
  function extraPool(mk) { var g = MODELS[mk || S.m].g; return (EXTRA_G[g] || []).map(function (k) { return EXTRAS[k]; }).filter(Boolean); }
  function xLabel(x) { var n = x.p.name; return x.acc ? (/watch/i.test(n) ? "Watch" : /cap/i.test(n) ? "Cap" : /chain/i.test(n) ? "Chain" : "Bracelet") : /sneaker/i.test(n) ? "Sneakers" : /boot/i.test(n) ? "Boots" : /loafer/i.test(n) ? "Loafers" : /sandal|clog/i.test(n) ? "Sandals" : /slipper|flop/i.test(n) ? "Slippers" : /flat/i.test(n) ? "Flats" : "Shoes"; }
  function findAny(k) { return byKey[k] || EXTRAS[k] || null; }

  /* ---------- state ---------- */
  var q = new URLSearchParams(location.search);
  var S = { m: MODELS[q.get("m")] ? q.get("m") : "boy", top: null, bot: null, sh: undefined, gt: "All", gb: "All", gs: "Shoes", auto: lsGet("rx_auto", true) !== false };
  function pool(role, mk) { var g = MODELS[mk || S.m].g; return ITEMS.filter(function (it) { return it.role === role && it.g === g; }); }
  function score(it) { return (it.p.rating || 3.8) * Math.log(1 + (it.p.rc || 1)) + Math.min(photos(it.p).length, 4) * 1.5; }
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
    if (!S.top || S.top.g !== MODELS[S.m].g) S.top = (MODELS[S.m].g === "m" && byKey.p190) ? byKey.p190 : tops.slice().sort(function (a, b) { return score(b) - score(a); })[0];
    if (!S.bot || S.bot.g !== MODELS[S.m].g) { var bb = bestBottomsFor(S.top); S.bot = bb.length ? bb[0].it : null; }
    if (S.sh === undefined || (S.sh && extraPool().indexOf(S.sh) < 0)) S.sh = MODELS[S.m].g === "m" && EXTRAS.p50 ? EXTRAS.p50 : null;
  }
  (function fromURL() {
    var t = byKey[q.get("top") || ""], b = byKey[q.get("bottom") || ""], one = byKey[q.get("p") || ""], s = q.get("s");
    if (one) { if (one.role === "t") t = one; else if (one.role === "b") b = one; if (!q.get("m")) S.m = one.g === "f" ? "women" : one.g === "k" ? "kids" : "boy"; }
    if (t && t.role === "t") S.top = t; if (b && b.role === "b") S.bot = b;
    if (S.top && MODELS[S.m].g !== S.top.g) S.m = S.top.g === "f" ? "women" : "boy";
    if (s === "0") S.sh = null; else if (s && EXTRAS[s]) S.sh = EXTRAS[s];
  })();
  /* a fresh, well-matched combo (Surprise look / swipe-left "agla look") */
  var seenTops = [];
  function nextCombo() {
    var tops = pool("t").filter(function (t) { return t !== S.top && seenTops.indexOf(t) < 0; });
    if (!tops.length) { seenTops = []; tops = pool("t").filter(function (t) { return t !== S.top; }); }
    if (!tops.length) return false;
    var cands = tops.map(function (t) { var bb = bestBottomsFor(t); return { t: t, b: bb.length ? bb[0] : null, r: Math.random() * 6 + score(t) * .25 + (bb.length ? bb[0].v.k * 3 : 0) }; })
      .filter(function (c) { return !pool("b").length || (c.b && c.b.v.k === 3); }).sort(function (a, b) { return b.r - a.r; });
    var c = cands[0] || { t: tops[Math.floor(Math.random() * tops.length)], b: null };
    S.top = c.t; seenTops.push(c.t); if (seenTops.length > 30) seenTops.shift();
    if (c.b) { var bb = bestBottomsFor(c.t), pick = bb.filter(function (x) { return x.v.k === 3; }); S.bot = (pick.length ? pick : bb)[Math.floor(Math.random() * Math.min(2, (pick.length ? pick : bb).length))].it; }
    var xs = extraPool().filter(function (x) { return !x.acc; }); if (xs.length && S.sh) S.sh = xs[Math.floor(Math.random() * xs.length)];
    return true;
  }

  /* ---------- ❤️ Meri Looks (saved on this phone only) ---------- */
  function lookKey(l) { return [l.m, l.t || "", l.b || "", l.s || ""].join("|"); }
  function curLook() { return S.m === "kids" ? null : { m: S.m, t: S.top && S.top.key, b: S.bot && S.bot.key, s: S.sh ? S.sh.key : "" }; }
  function looks() { return lsGet("rx_looks", []).filter(function (l) { return l && byKey[l.t]; }); }
  function isSaved() { var c = curLook(); if (!c || !c.t) return false; var k = lookKey(c); return looks().some(function (l) { return lookKey(l) === k; }); }
  function saveCur() {
    var c = curLook(); if (!c || !c.t) { toast("Pehle top chuno 👕"); return false; }
    var L = looks(), k = lookKey(c); if (L.some(function (l) { return lookKey(l) === k; })) { toast("❤️ Ye look pehle se Meri Looks me hai"); return false; }
    c.ts = Date.now(); L.unshift(c); lsSet("rx_looks", L.slice(0, 30)); vib([10, 30, 10]);
    toast(LS ? "❤️ Meri Looks me save ho gaya (" + Math.min(L.length, 30) + ")" : "😕 Is browser me save nahi ho sakta"); mine(); gbar(); return true;
  }
  function lookTotal(l) { return [l.t, l.b, l.s].reduce(function (a, k) { var it = k && findAny(k); return a + (it ? it.p.price : 0); }, 0); }
  function mine() {
    var el = $("#ob-mine"); if (!el) return; var L = looks();
    if (!L.length) { el.innerHTML = '<h2 class="sec ob-h2">❤️ Meri Looks</h2><p class="ob-sub">Look card ko <b>right swipe 👉</b> karo ya ❤️ dabao — yaha save hoga (sirf tumhare phone pe).</p>'; return; }
    el.innerHTML = '<h2 class="sec ob-h2">❤️ Meri Looks <small>' + L.length + "</small></h2>" + '<div class="ob-rail ob-mrail" role="list">' + L.map(function (l, i) {
      var t = findAny(l.t), b = l.b && findAny(l.b), v = t && b ? match(t, b) : null;
      return '<div class="ob-ml" role="listitem"><button type="button" class="ob-mlb" data-load="' + i + '" aria-label="Look kholo: ' + H(t.p.name) + '"><span class="ob-mli"><img src="' + t.p.img + '" alt="" loading="lazy" width="70" height="88">' + (b ? '<img src="' + b.p.img + '" alt="" loading="lazy" width="58" height="72">' : "") + "</span><b>" + money(lookTotal(l)) + "</b>" + (v ? "<em>" + BADGE[v.k][1].split(" ")[0] + "</em>" : "") + '</button><button type="button" class="ob-mlx" data-del="' + i + '" aria-label="Hatao">✕</button></div>'; }).join("") + "</div>";
  }

  /* ---------- render ---------- */
  var root = $("#ob"); if (!root) return;
  function stars(p) { return p.rating ? '<span class="ob-rt">' + p.rating.toFixed(1) + "★</span>" : ""; }
  function kset() { return ITEMS.filter(function (it) { return it.g === "k"; })[0] || null; }
  function verdictHTML() {
    if (S.m === "kids") return "";
    if (!S.top || !S.bot) return '<div class="ob-vd ob-v0"><b>' + (S.top ? "Bottom" : "Top") + " chuno</b><span>Dono chunne pe colour match dikhega.</span></div>";
    var v = match(S.top, S.bot), B = BADGE[v.k];
    return '<div class="ob-vd ob-v' + v.k + '" aria-live="polite"><b>' + B[1] + '</b><span>' + H(v.why) + '</span><span class="ob-sw"><i style="background:' + S.top.hex + '"></i><i style="background:' + S.bot.hex + '"></i></span></div>';
  }
  function kidsHTML() {
    var k = kset();
    return '<div class="ob-note">🧒 Kids ke liye abhi alag <b>tops</b> aur <b>bottoms</b> RIXU Picks pe nahi hain — jaldi aayenge 🙏 Abhi ' + (k ? "sirf ek Kurta Pajama set hai (top + bottom saath aata hai) — board pe dikh raha hai, neeche se Meesho pe le sakte ho." : "kuch nahi hai.") + "</div>";
  }
  function row(it, slot) {
    if (!it) return "";
    var p = it.p, ty = slot === "t" ? "Upar · " + label(it) : slot === "s" ? "Set · " + label(it) : slot === "x" ? (it.acc ? "Extra · " : "Shoes · ") + xLabel(it) : "Niche · " + label(it);
    return '<div class="ob-row"><img src="' + p.img + '" alt="" width="56" height="70" loading="lazy" decoding="async"><div class="ob-ri"><span class="ob-ty">' + H(ty) + (trending(p) ? ' <u class="ob-tr">🔥 Trending</u>' : "") + '</span><b>' + H(p.name) + '</b><span class="ob-mt">' + (it.hex ? '<i class="ob-dot" style="background:' + it.hex + '"></i>' + cname(it) + " · " : "") + '<span class="ob-pr">' + money(p.price) + (p.mrp && p.mrp > p.price ? " <s>" + money(p.mrp) + "</s>" : "") + "</span> " + stars(p) + '</span></div><a class="ob-buy" href="' + H(p.link) + '" target="_blank" rel="noopener sponsored">Buy on Meesho</a></div>';
  }

  /* ---------- Look Board ---------- */
  var SLOTS = { t: "UPAR", b: "NICHE", x: "SHOES", s: "SET" };
  function frameHTML(it, slot) {
    var ph = photos(it.p), tag = slot === "x" && it.acc ? "EXTRA" : SLOTS[slot];
    return '<div class="lb-in" data-gi="0" data-n="' + ph.length + '"><div class="lb-gal"><div class="lb-trk">' + ph.map(function (src, i) {
        return '<img ' + (i ? "data-src" : "src") + '="' + src + '" alt="' + (i ? "" : H(it.p.name)) + '" width="600" height="750" decoding="async" draggable="false">'; }).join("") + "</div></div>" +
      '<button type="button" class="lb-zoom" data-zoom="' + slot + '" aria-label="Photo bada karo: ' + H(it.p.name) + '"></button>' +
      '<span class="lb-tag">' + tag + (trending(it.p) ? " · 🔥" : "") + "</span>" +
      (ph.length > 1 ? '<span class="lb-pill"><button type="button" class="lb-ar" data-gstep="-1" aria-label="Pichli photo">‹</button><i>1/' + ph.length + '</i><button type="button" class="lb-ar" data-gstep="1" aria-label="Agli photo (peeche / side)">›</button></span>' : "") +
      '<span class="lb-chip">' + money(it.p.price) + "</span></div>";
  }
  function galGo(f, step) {
    var n = +f.dataset.n, i = (+f.dataset.gi + step + n) % n; f.dataset.gi = i;
    f.querySelectorAll("img[data-src]").forEach(function (im) { im.src = im.dataset.src; im.removeAttribute("data-src"); });
    f.querySelector(".lb-trk").style.transform = "translate3d(" + (-100 * i) + "%,0,0)";
    f.querySelector(".lb-pill i").textContent = (i + 1) + "/" + n; vib(5);
  }
  var shown = { t: null, b: null, x: null, s: null };
  function cur() { var kids = S.m === "kids"; return kids ? { s: kset() } : { t: S.top, b: S.bot, x: S.sh }; }
  function curTotal() { var c = cur(), t = 0; ["t", "b", "x", "s"].forEach(function (s) { if (c[s]) t += c[s].p.price; }); return t; }
  /* animated rupee counter */
  function countTo(el, to) {
    if (!el) return; var from = +(el.dataset.v || 0); el.dataset.v = to;
    if (REDUCE || from === to || !from) { el.textContent = money(to); return; }
    var t0 = performance.now(), dur = 420; cancelAnimationFrame(el._r);
    (function step(now) { var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = money(Math.round(from + (to - from) * e)); if (k < 1) el._r = requestAnimationFrame(step); })(t0);
  }
  function board() {
    var bd = $("#ob-stage"), c = cur(), kids = S.m === "kids";
    if (!bd.querySelector(".lb")) {
      bd.innerHTML = '<div class="lb" tabindex="-1"><div class="lb-head"><span class="lb-brand">RIXU <i>Picks</i><small>Look Board</small></span><span class="lb-sum"><b class="lb-total" data-v="0"></b><span class="lb-vm"></span></span></div>' +
        '<div class="lb-f lb-t" hidden></div><div class="lb-f lb-b" hidden></div><div class="lb-f lb-x" hidden></div><div class="lb-f lb-s" hidden></div><p class="lb-empty"></p>' +
        '<span class="lb-stamp lb-like">❤️ SAVE</span><span class="lb-stamp lb-skip">AGLA ➜</span></div><p class="lb-hint"><span>👈 swipe = agla look</span><span>swipe 👉 = save ❤️</span></p>';
      swipeInit(bd.querySelector(".lb"));
    }
    var lb = bd.querySelector(".lb");
    lb.className = "lb" + (kids ? " lb-kids" : "") + (c.x ? " has-x" : "") + (!kids && !c.b ? " no-b" : "") + (lb.classList.contains("lb-shuf") ? " lb-shuf" : "");
    ["t", "b", "x", "s"].forEach(function (slot) {
      var it = c[slot] || null, f = lb.querySelector(".lb-" + slot);
      if (shown[slot] === it) return;
      shown[slot] = it;
      if (!it) { f.innerHTML = ""; f.hidden = true; return; }
      f.hidden = false;
      var tmp = d.createElement("div"); tmp.innerHTML = frameHTML(it, slot);
      var nu = tmp.firstChild, im = nu.querySelector("img"), done = false;
      var swap = function () { if (done || shown[slot] !== it) return; done = true; f.innerHTML = ""; f.appendChild(nu); if (!REDUCE) { f.classList.remove("lb-pop"); void f.offsetWidth; f.classList.add("lb-pop"); } };
      if (im.decode && f.firstChild) { im.decode().then(swap, swap); setTimeout(swap, 900); } else swap();
    });
    countTo(lb.querySelector(".lb-total"), curTotal());
    var vm = ""; if (!kids && S.top && S.bot) vm = BADGE[match(S.top, S.bot).k][1];
    lb.querySelector(".lb-vm").textContent = vm || (kids ? "Kurta Pajama set" : "");
    lb.querySelector(".lb-empty").textContent = !kids && !c.t ? "Top chuno 👇" : kids && !c.s ? "Kids ke liye abhi kuch nahi 🙏" : "";
    bd.querySelector(".lb-hint").hidden = kids;
  }
  /* glass price bar (fixed at the bottom) */
  function gbar() {
    var g = $("#ob-gbar"); if (!g) return; var c = cur(), kids = S.m === "kids";
    if (!g.firstChild) g.innerHTML = '<button type="button" class="gb-th" data-up aria-label="Look Board dekho"></button><div class="gb-tx"><small>Total</small><b class="gb-total" data-v="0"></b></div><span class="gb-vm"></span><button type="button" class="gb-btn gb-heart" data-like aria-label="Meri Looks me save karo">♡</button><button type="button" class="gb-btn gb-cam" data-save aria-label="Look ki photo save karo">📸</button>';
    g.querySelector(".gb-th").innerHTML = ["t", "b", "x", "s"].filter(function (s) { return c[s]; }).map(function (s) { return '<img src="' + c[s].p.img + '" alt="" width="34" height="42" data-gs="' + s + '">'; }).join("");
    countTo(g.querySelector(".gb-total"), curTotal());
    g.querySelector(".gb-vm").textContent = !kids && S.top && S.bot ? BADGE[match(S.top, S.bot).k][1].split(" ")[0] : "";
    var h = g.querySelector(".gb-heart"), sv = isSaved(); h.textContent = sv ? "❤️" : "♡"; h.classList.toggle("on", sv); h.hidden = kids;
  }
  /* shared-element: the tapped thumbnail flies into its board frame (or the glass bar) */
  function fly(img, slot) {
    if (REDUCE || !img || !img.animate) return;
    var a = img.getBoundingClientRect(), f = $("#ob-stage .lb-" + slot), b = f && f.getBoundingClientRect();
    if (!b || !b.width || b.bottom < 60 || b.top > innerHeight - 40) { var gt = $('#ob-gbar img[data-gs="' + slot + '"]') || $("#ob-gbar .gb-th"); b = gt && gt.getBoundingClientRect(); }
    if (!b || !a.width) return;
    var cl = img.cloneNode(); cl.className = "ob-fly"; cl.removeAttribute("loading"); cl.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px";
    d.body.appendChild(cl);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), s = Math.max(.25, Math.min(3, b.width / a.width));
    var an = cl.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ")", opacity: .15 }], { duration: 420, easing: "cubic-bezier(.3,.7,.2,1)" });
    an.onfinish = an.oncancel = function () { cl.remove(); };
  }

  /* ---------- Tinder-style swipe on the look card ---------- */
  var dragged = 0;
  function swipeInit(lb) {
    var sx = 0, sy = 0, dx = 0, id = null, mode = 0, like = lb.querySelector(".lb-like"), skip = lb.querySelector(".lb-skip");
    function set(x) { lb.style.transform = "translate3d(" + x + "px,0,0) rotate(" + (x / 22) + "deg)"; like.style.opacity = Math.max(0, Math.min(1, x / 90)); skip.style.opacity = Math.max(0, Math.min(1, -x / 90)); }
    function reset(anim) { lb.style.transition = anim ? "transform .32s cubic-bezier(.3,1.4,.5,1)" : ""; set(0); setTimeout(function () { lb.style.transition = ""; lb.style.transform = ""; }, anim ? 330 : 0); }
    lb.addEventListener("pointerdown", function (e) { if (S.m === "kids" || (e.pointerType === "mouse" && e.button !== 0) || e.target.closest(".lb-pill")) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; mode = 0; });
    lb.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return; var x = e.clientX - sx, y = e.clientY - sy;
      if (!mode) { if (Math.abs(y) > 12 && Math.abs(y) > Math.abs(x)) { id = null; return; } if (Math.abs(x) > 12) { mode = 1; try { lb.setPointerCapture(id); } catch (er) {} lb.classList.add("lb-drag"); } }
      if (mode) { dx = x; set(dx); e.preventDefault(); }
    });
    function end(e) {
      if (e.pointerId !== id) return; id = null; if (!mode) return; lb.classList.remove("lb-drag"); dragged = Date.now();
      if (dx > 90 && !REDUCE) { lb.style.transition = "transform .28s ease-in"; set(innerWidth); setTimeout(function () { saveCur(); lb.style.transition = "none"; set(0); lb.style.transform = ""; lb.style.transition = ""; like.style.opacity = 0; pop(lb); }, 280); }
      else if (dx > 90) { saveCur(); reset(false); }
      else if (dx < -90) { vib(10); lb.style.transition = "transform .26s ease-in"; set(-innerWidth); setTimeout(function () { nextCombo(); stage(); picker(); lb.style.transition = "none"; set(innerWidth * .6); void lb.offsetWidth; skip.style.opacity = 0; reset(true); }, 260); }
      else reset(true);
    }
    lb.addEventListener("pointerup", end); lb.addEventListener("pointercancel", function (e) { if (e.pointerId === id) { id = null; if (mode) { lb.classList.remove("lb-drag"); reset(true); } } });
  }
  function pop(el) { if (REDUCE) return; el.classList.remove("lb-shuf"); void el.offsetWidth; el.classList.add("lb-shuf"); setTimeout(function () { el.classList.remove("lb-shuf"); }, 720); }
  function surprise() { var lb = $("#ob-stage .lb"); vib([8, 40, 8]); if (lb) pop(lb); setTimeout(function () { if (nextCombo()) { stage(); picker(); } }, REDUCE ? 0 : 260); }

  /* ---------- full-screen viewer: swipe angles, pinch / double-tap zoom ---------- */
  var LBX = null;
  function zoomOpen(slot) {
    var it = cur()[slot]; if (!it) return; var f = $("#ob-stage .lb-" + slot + " .lb-in"), gi = f ? +f.dataset.gi : 0, ph = photos(it.p);
    if (!LBX) { LBX = d.createElement("div"); LBX.className = "zx"; LBX.setAttribute("role", "dialog"); LBX.setAttribute("aria-modal", "true"); d.body.appendChild(LBX);
      LBX.addEventListener("click", function (e) { if (e.target.closest("[data-zx]") || e.target === LBX) zoomClose(); });
      LBX.addEventListener("scroll", function (e) { var t = e.target; if (!t.classList || !t.classList.contains("zx-trk")) return; var i = Math.round(t.scrollLeft / t.clientWidth), ds = LBX.querySelectorAll(".zx-dots i"); for (var j = 0; j < ds.length; j++) ds[j].className = j === i ? "on" : ""; var n = LBX.querySelector(".zx-n"); if (n) n.textContent = (i + 1) + " / " + ds.length; }, true); }
    LBX.setAttribute("aria-label", it.p.name);
    LBX.innerHTML = '<div class="zx-top"><span class="zx-n">' + (gi + 1) + " / " + ph.length + '</span><button type="button" class="zx-x" data-zx aria-label="Band karo">✕</button></div><div class="zx-trk">' + ph.map(function (src) { return '<div class="zx-p"><img src="' + src + '" alt="" draggable="false"></div>'; }).join("") + "</div>" +
      (ph.length > 1 ? '<div class="zx-dots">' + ph.map(function (s, i) { return "<i" + (i === gi ? ' class="on"' : "") + "></i>"; }).join("") + "</div>" : "") +
      '<div class="zx-bot"><div><b>' + H(it.p.name) + "</b><span>" + money(it.p.price) + (it.p.mrp && it.p.mrp > it.p.price ? " <s>" + money(it.p.mrp) + "</s>" : "") + " " + stars(it.p) + (trending(it.p) ? ' <u class="ob-tr">🔥 Trending</u>' : "") + '</span><small>Pinch ya double-tap = zoom · swipe = doosri photo</small></div><a class="ob-buy" href="' + H(it.p.link) + '" target="_blank" rel="noopener sponsored">Buy on Meesho</a></div>';
    d.documentElement.classList.add("zx-open"); LBX.classList.add("on");
    var trk = LBX.querySelector(".zx-trk"); trk.scrollLeft = gi * trk.clientWidth;
    LBX.querySelectorAll(".zx-p").forEach(pinchInit);
    // shared-element open: grow from the board photo
    var src = f && f.querySelectorAll(".lb-trk img")[gi], dst = LBX.querySelectorAll(".zx-p img")[gi];
    if (!REDUCE && src && dst && dst.animate) { var a = src.getBoundingClientRect(), b = dst.getBoundingClientRect(); if (b.width) dst.animate([{ transform: "translate(" + (a.left + a.width / 2 - b.left - b.width / 2) + "px," + (a.top + a.height / 2 - b.top - b.height / 2) + "px) scale(" + (a.width / b.width) + ")", borderRadius: "18px" }, { transform: "none", borderRadius: "0" }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }); }
    try { history.pushState({ zx: 1 }, ""); } catch (e) {}
    LBX.querySelector(".zx-x").focus({ preventScroll: true });
  }
  function zoomClose(fromPop) { if (!LBX || !LBX.classList.contains("on")) return; LBX.classList.remove("on"); d.documentElement.classList.remove("zx-open"); if (!fromPop && history.state && history.state.zx) try { history.back(); } catch (e) {} }
  addEventListener("popstate", function () { zoomClose(true); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") zoomClose(); });
  function pinchInit(box) {
    var img = box.firstChild, P = {}, s = 1, tx = 0, ty = 0, st = null, last = 0, trk = box.parentNode;
    function apply(an) { img.style.transition = an ? "transform .25s ease" : ""; img.style.transform = s > 1 ? "translate3d(" + tx + "px," + ty + "px,0) scale(" + s + ")" : ""; box.classList.toggle("z", s > 1); trk.classList.toggle("lock", s > 1); }
    function clamp() { var w = box.clientWidth * (s - 1) / 2, h = box.clientHeight * (s - 1) / 2; tx = Math.max(-w, Math.min(w, tx)); ty = Math.max(-h, Math.min(h, ty)); }
    box.addEventListener("pointerdown", function (e) { P[e.pointerId] = [e.clientX, e.clientY]; var k = Object.keys(P);
      if (k.length === 2) { var a = P[k[0]], b = P[k[1]]; st = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: s }; try { box.setPointerCapture(e.pointerId); } catch (er) {} }
      else if (k.length === 1) { var now = Date.now(); if (now - last < 300) { s = s > 1 ? 1 : 2.5; tx = ty = 0; apply(true); last = 0; } else last = now; st = s > 1 ? { px: e.clientX - tx, py: e.clientY - ty } : null; } });
    box.addEventListener("pointermove", function (e) { if (!P[e.pointerId]) return; P[e.pointerId] = [e.clientX, e.clientY]; var k = Object.keys(P);
      if (k.length === 2 && st && st.d) { var a = P[k[0]], b = P[k[1]]; s = Math.max(1, Math.min(4, st.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / st.d)); clamp(); apply(); e.preventDefault(); }
      else if (k.length === 1 && s > 1 && st && st.px !== undefined) { tx = e.clientX - st.px; ty = e.clientY - st.py; clamp(); apply(); e.preventDefault(); } });
    function up(e) { delete P[e.pointerId]; if (Object.keys(P).length < 2 && st && st.d) { st = null; if (s < 1.08) { s = 1; tx = ty = 0; apply(true); } } }
    box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
  }

  function stage() {
    var kids = S.m === "kids", k = kids ? kset() : null;
    board(); gbar();
    $("#ob-fit").innerHTML = kids ? (k ? row(k, "s") : "") : row(S.top, "t") + row(S.bot, "b") + row(S.sh, "x");
    $("#ob-verdict").innerHTML = verdictHTML();
    try { var u = new URL(location.href); u.searchParams.set("m", S.m); if (S.top && !kids) u.searchParams.set("top", S.top.key); else u.searchParams.delete("top"); if (S.bot && !kids) u.searchParams.set("bottom", S.bot.key); else u.searchParams.delete("bottom");
      if (!kids && extraPool().length) u.searchParams.set("s", S.sh ? S.sh.key : "0"); else u.searchParams.delete("s"); u.searchParams.delete("p"); history.replaceState(history.state, "", u.pathname + u.search); } catch (e) {}
  }
  function models() {
    $("#ob-models").innerHTML = ORDER.map(function (k) { var m = MODELS[k]; return '<button type="button" class="ob-mb' + (S.m === k ? " on" : "") + '" data-m="' + k + '" aria-pressed="' + (S.m === k) + '"><em aria-hidden="true">' + m.ico + "</em><span>" + m.name + "</span></button>"; }).join("");
  }
  function thumb(it, on, v, lab) {
    return '<button type="button" role="listitem" class="ob-th' + (on ? " on" : "") + '" data-pick="' + it.key + '" aria-pressed="' + on + '" aria-label="' + H(it.p.name) + " " + money(it.p.price) + (v ? " — " + BADGE[v.k][1] : "") + (trending(it.p) ? " — Trending" : "") + '"><img data-src="' + it.p.img + '" alt="" decoding="async" width="84" height="104">' +
      (v ? '<em class="ob-mk ob-k' + v.k + '">' + BADGE[v.k][1].split(" ")[0] + "</em>" : "") + (trending(it.p) ? '<u class="ob-hot" title="Meesho pe 4.2★+ aur 1000+ ratings">🔥</u>' : "") + (it.hex ? '<i class="ob-dot" style="background:' + it.hex + '"></i>' : "") + "<span>" + H(lab) + "</span><b>" + money(it.p.price) + "</b></button>";
  }
  function keepScroll(box, key, html) {
    var old = box.querySelector(".ob-rail"), sl = old ? old.scrollLeft : 0, same = box.dataset.k === key;
    box.innerHTML = html; box.dataset.k = key;
    var rail = box.querySelector(".ob-rail");
    if (same && sl) rail.scrollLeft = sl;
    lazyRail(rail);
  }
  /* rails load thumbnails only near the visible part (cheap phones / slow data) */
  function lazyRail(rail) {
    if (!rail) return; var ims = rail.querySelectorAll("img[data-src]"), first = Math.ceil((rail.scrollLeft + (rail.clientWidth || 360)) / 92) + 2;
    var put = function (im) { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); } };
    if (!("IntersectionObserver" in window)) { ims.forEach(put); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { put(e.target); io.unobserve(e.target); } }); }, { root: rail, rootMargin: "0px 300px" });
    ims.forEach(function (im, i) { if (i < first) put(im); else io.observe(im); });
  }
  function strip(role) {
    var box = $(role === "t" ? "#ob-pt" : "#ob-pb"); if (!box) return;
    if (S.m === "kids") { box.innerHTML = role === "t" ? kidsHTML() : ""; box.dataset.k = ""; return; }
    var gk = role === "t" ? "gt" : "gb", list = pool(role), GR = role === "t" ? TOPGRP : BOTGRP, groups = ["All"], other = role === "t" ? S.bot : S.top, mine = role === "t" ? S.top : S.bot;
    list.forEach(function (it) { var g = GR[it.type]; if (g && groups.indexOf(g) < 0) groups.push(g); });
    if (list.some(function (it) { return trending(it.p); })) groups.splice(1, 0, "🔥 Trending");
    if (groups.indexOf(S[gk]) < 0) S[gk] = "All";
    var sh = list.filter(function (it) { return S[gk] === "All" || (S[gk] === "🔥 Trending" ? trending(it.p) : GR[it.type] === S[gk]); }).map(function (it) { return { it: it, v: other ? (role === "t" ? match(it, other) : match(other, it)) : null }; });
    if (role === "b" && other) sh.sort(function (a, b) { return (b.v.k * 10 + b.v.sc) - (a.v.k * 10 + a.v.sc); });
    var miss = "";
    if (role === "b") { var have = {}; list.forEach(function (it) { have[BOTGRP[it.type]] = 1; }); var need = ["Jeans", "Baggy Jeans", "Cargo", "Full Pant"].filter(function (g) { return !have[g]; });
      if (need.length) miss = '<p class="ob-miss">ℹ️ ' + MODELS[S.m].name + " ke liye abhi " + need.join(", ") + " collection me nahi " + (need.length > 1 ? "hain" : "hai") + " — jaldi add karenge.</p>"; }
    var auto = role === "t" && pool("b").length ? '<button type="button" class="ob-auto' + (S.auto ? " on" : "") + '" data-auto aria-pressed="' + S.auto + '"><i></i>✨ Complete the look</button>' : "";
    keepScroll(box, S.m + role + S[gk], '<div class="ob-sh"><b>' + (role === "t" ? "👕 Upar chuno" : "👖 Niche chuno") + "</b><span>" + list.length + " " + (role === "t" ? "tops" : "bottoms") + (other ? " · badge = match" : "") + "</span></div>" + auto +
      '<div class="ob-grp">' + groups.map(function (g) { return '<button type="button" data-grp="' + H(g) + '" data-role="' + role + '" class="' + (S[gk] === g ? "on" : "") + '">' + H(g) + "</button>"; }).join("") + "</div>" + miss +
      '<div class="ob-rail" role="list">' + sh.map(function (x) { return thumb(x.it, mine === x.it, x.v, label(x.it)); }).join("") + "</div>");
  }
  function stripX() {
    var box = $("#ob-px"); if (!box) return;
    var list = extraPool();
    if (S.m === "kids" || !list.length) { box.innerHTML = ""; box.dataset.k = ""; return; }
    var hasAcc = list.some(function (x) { return x.acc; }), hasSh = list.some(function (x) { return !x.acc; });
    if (S.gs === "Extra" && !hasAcc) S.gs = "Shoes";
    var sh = list.filter(function (x) { return S.gs === "Extra" ? x.acc : !x.acc; }), g = MODELS[S.m].g;
    keepScroll(box, S.m + "x" + S.gs, '<div class="ob-sh"><b>👟 Shoes / extra <small>(optional)</small></b><span>' + list.length + " items" + (g === "f" ? " · unisex" : "") + "</span></div>" +
      '<div class="ob-grp">' + (hasSh ? '<button type="button" data-xg="Shoes" class="' + (S.gs === "Shoes" ? "on" : "") + '">Shoes</button>' : "") + (hasAcc ? '<button type="button" data-xg="Extra" class="' + (S.gs === "Extra" ? "on" : "") + '">Watch · Cap · Chain</button>' : "") + "</div>" +
      (g === "f" ? '<p class="ob-miss">ℹ️ Girls/Women ke liye alag footwear abhi collection me nahi — ye unisex chappal/flats hain.</p>' : "") +
      '<div class="ob-rail" role="list"><button type="button" role="listitem" class="ob-th ob-none' + (!S.sh ? " on" : "") + '" data-nox aria-pressed="' + !S.sh + '"><span class="ob-nx">✕</span><span>Koi nahi</span><b>—</b></button>' +
      sh.map(function (x) { return thumb(x, S.sh === x, null, xLabel(x)); }).join("") + "</div>");
  }
  function picker() { strip("t"); strip("b"); stripX(); sug(); }
  function sug() {
    var el = $("#ob-sug"); if (S.m === "kids" || !S.top) { el.innerHTML = ""; return; }
    var best = bestBottomsFor(S.top), all = pool("b"), have = {}; all.forEach(function (it) { have[BOTGRP[it.type]] = 1; });
    var miss = ["Jeans", "Baggy Jeans", "Cargo", "Full Pant"].filter(function (g) { return !have[g]; });
    el.innerHTML = '<h2 class="sec ob-h2">Is top ke saath kya pehne? 🤔</h2><p class="ob-sub">' + H(S.top.p.name) + " (" + cname(S.top) + ") ke saath RIXU ke 3 best bottoms:</p>" +
      (best.length ? '<div class="ob-sgl">' + best.map(function (x, i) { var b = x.it, B = BADGE[x.v.k];
        return '<div class="ob-sg"><span class="ob-n">' + (i + 1) + '</span><button type="button" class="ob-sgi" data-wear="' + b.key + '" aria-label="Board pe lagao: ' + H(b.p.name) + '"><img src="' + b.p.img + '" alt="" loading="lazy" decoding="async" width="84" height="105"></button><div class="ob-sgt"><span class="ob-ty">' + H(botLabel(b)) + (trending(b.p) ? ' <u class="ob-tr">🔥 Trending</u>' : "") + '</span><b>' + H(b.p.name) + '</b><span class="ob-vb ob-v' + x.v.k + '">' + B[1] + "</span><small>" + H(x.v.why) + '</small><span class="ob-pr">' + money(b.p.price) + " " + stars(b.p) + '</span><div class="ob-act"><button type="button" class="ob-wear" data-wear="' + b.key + '">' + (S.bot === b ? "✓ Board pe hai" : "Board pe lagao") + '</button><a class="ob-buy sm" href="' + H(b.p.link) + '" target="_blank" rel="noopener sponsored">Buy on Meesho</a></div></div></div>'; }).join("") + "</div>" : '<p class="ob-miss">Is model ke liye abhi koi bottom collection me nahi hai 🙏</p>') +
      (miss.length && best.length ? '<p class="ob-miss">ℹ️ ' + miss.join(", ") + " abhi " + MODELS[S.m].name + " collection me nahi — isliye wo suggestion nahi aaya.</p>" : "");
  }
  function all() { defaults(); models(); stage(); picker(); mine(); }
  function toBoard() { var st = $("#ob-stage"), r = st.getBoundingClientRect(); if (r.top < 50 || r.bottom > innerHeight - 70) window.scrollTo({ top: Math.max(0, r.top + scrollY - 64), behavior: REDUCE ? "auto" : "smooth" }); }
  function toast(html, ms) { var t = $("#ob-toast"); if (!t) { t = d.createElement("div"); t.id = "ob-toast"; t.className = "ob-toast"; t.setAttribute("role", "status"); d.body.appendChild(t); } t.innerHTML = html; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, ms || 2600); return t; }

  /* ---------- 📸 save the look as an image (canvas, same-origin photos) ---------- */
  function loadImg(src) { return new Promise(function (res) { if (!src) return res(null); var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function curSrc(slot) { var f = $("#ob-stage .lb-" + slot + " .lb-in"); if (!f) return null; var ims = f.querySelectorAll(".lb-trk img"); var im = ims[+f.dataset.gi] || ims[0]; return im.getAttribute("src") || im.dataset.src; }
  function drawLook(c0) {
    var slots = ["t", "b", "x", "s"].filter(function (s) { return c0[s]; });
    var W = 1080, Hh = 1350, cv = d.createElement("canvas"); cv.width = W; cv.height = Hh; var c = cv.getContext("2d");
    var fontP = d.fonts && d.fonts.load ? d.fonts.load('80px "RixuD"').catch(function () {}) : Promise.resolve();
    return Promise.all([fontP].concat(slots.map(function (s) { return loadImg(curSrc(s)); }))).then(function (r) {
      var imgs = {}; slots.forEach(function (s, i) { imgs[s] = r[i + 1]; });
      var g = c.createRadialGradient(W, 0, 40, W, 0, W * 1.15); g.addColorStop(0, "#27310f"); g.addColorStop(1, "#0a0a0b"); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
      var D = '"RixuD", Impact, "Arial Narrow Bold", sans-serif';
      c.fillStyle = "#f4f4f5"; c.font = "76px " + D; c.fillText("RIXU", 64, 126); var wR = c.measureText("RIXU ").width; c.fillStyle = "#c8ff2e"; c.fillText("PICKS", 64 + wR, 126);
      c.fillStyle = "#9a9aa2"; c.font = "600 30px system-ui, sans-serif"; c.fillText("Outfit Banao · Look Board", 66, 172);
      var kids = !!c0.s, noB = !kids && !c0.b;
      var L = kids ? { s: [210, 230, 660, 825, 0] } : noB ? { t: [180, 230, 720, 900, -1.5], x: [660, 900, 320, 320, 3] } : { t: [64, 224, 600, 750, -2.2], b: [470, 520, 546, 682, 2.2], x: [96, 940, 300, 300, -3] };
      ["t", "b", "x", "s"].forEach(function (s) {
        var a = L[s], im = imgs[s], it = c0[s]; if (!a || !it) return; var x = a[0], y = a[1], w = a[2], h = a[3];
        c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(a[4] * Math.PI / 180); c.translate(-w / 2, -h / 2);
        c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 44; c.shadowOffsetY = 18; c.fillStyle = "#f3eee3"; rr(c, -8, -8, w + 16, h + 16, 34); c.fill(); c.shadowColor = "transparent";
        c.save(); rr(c, 0, 0, w, h, 26); c.clip(); c.fillStyle = "#1b1b1e"; c.fillRect(0, 0, w, h);
        if (im) { var sc = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * sc, ih = im.naturalHeight * sc; c.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); }
        c.restore();
        var tag = s === "x" && it.acc ? "EXTRA" : SLOTS[s]; c.font = "800 24px system-ui, sans-serif"; var tw = c.measureText(tag).width + 28; c.fillStyle = "#c8ff2e"; rr(c, 18, 18, tw, 42, 21); c.fill(); c.fillStyle = "#111"; c.fillText(tag, 32, 48);
        var pr = money(it.p.price); c.font = "900 36px system-ui, sans-serif"; var pw = c.measureText(pr).width + 36, top = s === "t" && !noB, px = top ? w - 18 - pw : 18, py = top ? 18 : h - 72; c.fillStyle = "rgba(10,10,12,.88)"; rr(c, px, py, pw, 54, 27); c.fill(); c.fillStyle = "#fff"; c.fillText(pr, px + 18, py + 40);
        c.restore();
      });
      var tot = slots.reduce(function (a, s) { return a + c0[s].p.price; }, 0);
      c.textAlign = "right"; c.fillStyle = "#c8ff2e"; c.font = "64px " + D; c.fillText(money(tot), W - 64, 120); c.fillStyle = "#9a9aa2"; c.font = "600 26px system-ui, sans-serif"; c.fillText("TOTAL · " + slots.length + " items", W - 66, 162);
      if (!kids && c0.t && c0.b) { var v = match(c0.t, c0.b); c.fillStyle = v.k === 3 ? "#c8ff2e" : v.k === 2 ? "#ffd166" : "#ff7a5c"; c.font = "800 32px system-ui, sans-serif"; c.fillText(BADGE[v.k][1], W - 64, 214); }
      c.textAlign = "left"; c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(0, Hh - 92, W, 92);
      c.fillStyle = "#f4f4f5"; c.font = "700 28px system-ui, sans-serif"; c.fillText("Sab Meesho pe · rixupicks.sites.tab.bot/outfit", 64, Hh - 36);
      c.textAlign = "right"; c.fillStyle = "#c8ff2e"; c.fillText("@rixupicks", W - 64, Hh - 36); c.textAlign = "left";
      return cv;
    });
  }
  var busy = false;
  function saveLook() {
    var c0 = cur(); if (!["t", "b", "x", "s"].some(function (s) { return c0[s]; }) || busy) return; busy = true; vib();
    var btns = d.querySelectorAll("[data-save]"); btns.forEach(function (b) { b.classList.add("busy"); });
    toast("⏳ Look ki photo ban rahi hai…", 4000);
    drawLook(c0).then(function (cv) {
      cv.toBlob(function (blob) {
        busy = false; btns.forEach(function (b) { b.classList.remove("busy"); });
        if (!blob) { toast("😕 Image nahi ban payi, dobara try karo"); return; }
        var name = "rixu-look-" + (c0.t ? c0.t.key : "set") + (c0.b ? "-" + c0.b.key : "") + ".jpg", url = URL.createObjectURL(blob), a = d.createElement("a");
        a.href = url; a.download = name; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
        var file = null; try { file = new File([blob], name, { type: "image/jpeg" }); } catch (e) {}
        var canShare = false; try { canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
        var t = toast("✅ Look save ho gaya — Gallery/Downloads me dekho" + (canShare ? ' <button type="button" class="ob-tsh">Share ↗</button>' : ""), 6000);
        if (canShare) t.querySelector(".ob-tsh").onclick = function () { navigator.share({ files: [file], title: "RIXU Picks Look", text: "Mera fit 🔥 @rixupicks" }).catch(function () {}); };
      }, "image/jpeg", .9);
    }).catch(function () { busy = false; btns.forEach(function (b) { b.classList.remove("busy"); }); toast("😕 Image nahi ban payi, dobara try karo"); });
  }
  window.RixuLook = { draw: function () { return drawLook(cur()); } };

  /* ---------- events ---------- */
  function onClick(e) {
    var t = e.target.closest("[data-m],[data-grp],[data-xg],[data-nox],[data-pick],[data-wear],[data-shuffle],[data-share],[data-save],[data-like],[data-zoom],[data-gstep],[data-auto],[data-load],[data-del],[data-up]"); if (!t) return;
    if (t.dataset.zoom) { if (Date.now() - dragged < 350) return; zoomOpen(t.dataset.zoom); return; }
    if (t.dataset.gstep) { galGo(t.closest(".lb-in"), +t.dataset.gstep); return; }
    if (t.dataset.m) { if (S.m === t.dataset.m) return; vib(); var g0 = MODELS[S.m].g; S.m = t.dataset.m; if (MODELS[S.m].g !== g0) { S.top = null; S.bot = null; S.sh = undefined; S.gt = S.gb = "All"; S.gs = "Shoes"; seenTops = []; } all(); return; }
    if (t.dataset.grp) { S[t.dataset.role === "t" ? "gt" : "gb"] = t.dataset.grp; strip(t.dataset.role); return; }
    if (t.dataset.xg) { S.gs = t.dataset.xg; stripX(); return; }
    if (t.hasAttribute("data-auto")) { S.auto = !S.auto; lsSet("rx_auto", S.auto); vib(); toast(S.auto ? "✨ Complete the look ON — top chuno, best matching bottom khud lagega" : "Complete the look OFF — bottom tum khud chuno"); strip("t"); return; }
    if (t.hasAttribute("data-nox")) { vib(); S.sh = null; stage(); stripX(); return; }
    if (t.dataset.pick) { var it = findAny(t.dataset.pick); if (!it) return; vib(); var img = t.querySelector("img"), autoB = false;
      if (it.role === "t") { S.top = it; if (S.auto) { var bb = bestBottomsFor(it); if (bb.length && bb[0].it !== S.bot) { S.bot = bb[0].it; autoB = true; } } } else if (it.role === "b") S.bot = it; else S.sh = it;
      var slot = it.role === "t" ? "t" : it.role === "b" ? "b" : "x"; stage(); picker(); fly(img, slot);
      if (autoB) toast("✨ Complete the look: " + H(botLabel(S.bot)) + " lagaya (" + BADGE[match(S.top, S.bot).k][1] + ")", 2200); return; }
    if (t.dataset.wear) { var b = byKey[t.dataset.wear]; if (!b) return; vib(); S.bot = b; stage(); picker(); toBoard(); return; }
    if (t.hasAttribute("data-shuffle")) { surprise(); toBoard(); return; }
    if (t.hasAttribute("data-like")) { if (isSaved()) { toast("❤️ Ye look pehle se Meri Looks me hai"); return; } saveCur(); return; }
    if (t.dataset.load) { var l = looks()[+t.dataset.load]; if (!l) return; vib(); S.m = l.m; S.top = byKey[l.t] || null; S.bot = byKey[l.b] || null; S.sh = l.s ? EXTRAS[l.s] || null : null; all(); toBoard(); return; }
    if (t.dataset.del) { var L = looks(); L.splice(+t.dataset.del, 1); lsSet("rx_looks", L); mine(); gbar(); return; }
    if (t.hasAttribute("data-up")) { toBoard(); return; }
    if (t.hasAttribute("data-save")) { saveLook(); return; }
    if (t.hasAttribute("data-share")) {
      var url = location.href, txt = "Ye fit dekho 👕 RIXU Picks Outfit Banao: " + (S.top ? S.top.p.name : "") + (S.bot ? " + " + S.bot.p.name : "") + (S.sh ? " + " + S.sh.p.name : "");
      if (navigator.share) navigator.share({ title: "RIXU Picks — Outfit Banao", text: txt, url: url }).catch(function () {}); else window.open("https://wa.me/?text=" + encodeURIComponent(txt + " " + url), "_blank", "noopener");
    }
  }
  root.addEventListener("click", onClick);
  var gb = $("#ob-gbar"); if (gb) gb.addEventListener("click", onClick);
  window.RixuOutfit = { match: match, items: ITEMS, fam: fam };
  all();
})();
