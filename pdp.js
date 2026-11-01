/* RIXU Picks — Meesho-style shop features (client-side only):
   product page (gallery + zoom, size guide, details, reviews from Meesho, similar products, share, sticky Buy Now),
   filters + extra sort, recently viewed, Top Rated / Under ₹299 rows, search suggestions.
   Orders always happen on Meesho via Buy Now (affiliate links untouched). */
(function () {
  "use strict";
  const SITE = "https://rixupicks.sites.tab.bot/";
  const G = typeof GALLERY !== "undefined" ? GALLERY : {}, RV = typeof REVIEWS !== "undefined" ? REVIEWS : {};
  const keyOf = p => p.img.replace(/^img\//, "").replace(/\.\w+$/, "");          // "p31"
  const byKey = new Map(PRODUCTS.map((p, i) => [keyOf(p), i]));
  const kfmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
  const H = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cardOf = i => grid.querySelector('.card[data-i="' + i + '"]');

  /* ---------- tiny storage with memory fallback ---------- */
  let store = null;
  try { const t = window.localStorage, k = "__rx_t"; t.setItem(k, "1"); t.removeItem(k); store = t; } catch (e) { store = null; }
  const mem = {};
  const sget = (k, d) => { try { const v = store ? store.getItem(k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const sset = (k, v) => { const s = JSON.stringify(v); mem[k] = s; if (store) try { store.setItem(k, s); } catch (e) { store = null; } };

  /* ---------- product facts derived only from the name / category ---------- */
  const COLORS = ["black", "white", "red", "blue", "navy", "grey", "gray", "beige", "green", "olive", "pink", "maroon", "brown", "cream", "yellow", "purple", "orange", "lavender", "peach", "mustard", "wine", "khaki", "silver", "gold"];
  const FABRICS = ["cotton", "fleece", "denim", "rayon", "satin", "polyester", "georgette", "organza", "corduroy", "linen", "wool", "woollen", "silk", "chiffon", "crepe", "velvet", "leather", "lycra", "popcorn", "knit", "acid wash"];
  const FITS = ["oversized", "baggy", "wide-leg", "wide leg", "slim", "regular", "relaxed", "straight", "loose", "cropped", "full-sleeve", "full sleeve", "half sleeve", "high neck", "zip", "printed", "graphic", "plain", "embroidered"];
  const cap = s => s.replace(/(^|[\s-])\w/g, m => m.toUpperCase());
  const found = (name, list) => { const n = name.toLowerCase(); return list.filter(w => n.includes(w)); };
  const TOPS = ["tees", "shirts", "hoodies", "jackets", "winter", "kurta", "kurti", "wtops", "girls"], BOTTOMS = ["jeans", "cargo", "shorts", "track"];

  function sizeGuide(p) {
    const n = p.name.toLowerCase();
    if (["acc", "saree", "gadgets", "korean", "gifts", "decor"].includes(p.cat)) return "";
    if (p.cat === "shoes") return table(["UK size", "6", "7", "8", "9", "10"], [["Foot length (in)", "9.6", "9.9", "10.2", "10.6", "10.9"]]);
    const bottom = BOTTOMS.includes(p.cat) || (p.also || []).some(c => BOTTOMS.includes(c)) || ((p.cat === "girls" || p.cat === "wint") && /cargo|jeans|pant|trouser|jogger/.test(n));
    if (bottom) return table(["Size", "28", "30", "32", "34", "36"], [["Waist (in)", "28", "30", "32", "34", "36"], ["Hip (in)", "36", "38", "40", "42", "44"]]);
    return table(["Size", "S", "M", "L", "XL", "XXL"], [["Chest (in)", "36", "38", "40", "42", "44"], ["Length (in)", "26", "27", "28", "29", "30"]]);
    function table(head, rows) {
      return '<table class="pd-size"><tr>' + head.map(h => "<th>" + h + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map((c, i) => (i ? "<td>" : "<th>") + c + (i ? "</td>" : "</th>")).join("") + "</tr>").join("") + "</table>";
    }
  }
  /* ---------- real Meesho data (details.js, from Meesho's own product page) ---------- */
  const MD = typeof MDETAILS !== "undefined" ? MDETAILS : {};
  const extOf = p => { const m = /external_product_id=([a-z0-9]+)/i.exec(p.link || "") || /%2Fp%2F([a-z0-9]+)/i.exec(p.link || "") || /\/p\/([a-z0-9]+)/i.exec(p.link || ""); return m ? m[1] : ""; };
  const byExt = new Map(PRODUCTS.map((p, i) => [extOf(p), i]));
  const mdOf = p => MD[extOf(p)] || null;
  const CSSCOL = { black: "#111", white: "#f5f5f5", red: "#d11a1a", blue: "#2c5fd6", navy: "#1c2a52", "navy blue": "#1c2a52", grey: "#8a8a8a", gray: "#8a8a8a", beige: "#d9c3a0", green: "#2f8f4e", olive: "#6b6b2a", pink: "#f08cb4", maroon: "#6d1a2a", brown: "#6b4226", cream: "#f3e9d2", yellow: "#f2c230", purple: "#7d3cc0", orange: "#f07a1f", lavender: "#b9a3e3", peach: "#f5b99a", mustard: "#d4a017", wine: "#6a1b35", khaki: "#b8a878", silver: "#c0c0c0", gold: "#d4af37", "off white": "#efe9dc", charcoal: "#36383c", "sky blue": "#79b8ec", teal: "#1f8a8a", rust: "#a8471f", coffee: "#5a3b26", magenta: "#c2207a", violet: "#7f3fbf", camel: "#c19a6b", tan: "#c8a27a", rose: "#e5839a", mint: "#9fe0c0" };
  const swatch = name => { const n = String(name || "").toLowerCase().trim(); const c = CSSCOL[n] || CSSCOL[n.split(/\s+/).pop()]; return c ? '<i class="mdc-dot" style="background:' + c + '"></i>' : '<i class="mdc-dot mdc-multi"></i>'; };
  function colours(p) {
    const d = mdOf(p); if (!d) return "";
    const more = (d.more || []);
    let h = '<details class="pd-sec" open><summary>🎨 Colours <small>(from Meesho)</small></summary><div class="mdc">';
    if (d.col) h += '<span class="mdc-chip on">' + swatch(d.col) + H(d.col) + ' <small>· this one</small></span>';
    h += "</div>";
    if (more.length) {
      h += '<p class="mdc-h">' + (more.length) + ' more colour / design option' + (more.length > 1 ? "s" : "") + ' in this Meesho catalogue:</p><div class="mdc-more">' +
        more.map(m => {
          const j = byExt.has(m.x) ? byExt.get(m.x) : -1;
          const inner = '<img src="' + H(m.i) + '" alt="" loading="lazy" width="64" height="64"><span>' + (m.c ? H(m.c) : (m.p ? "₹" + m.p : "Option")) + "</span>" + (j >= 0 ? "<em>on RIXU</em>" : "");
          return j >= 0 ? '<button type="button" class="mdc-op" data-open="' + j + '">' + inner + "</button>" : '<span class="mdc-op">' + inner + "</span>";
        }).join("") + "</div>";
    } else if (d.col) h += '<p class="mdc-h">No other colours in this Meesho catalogue.</p>';
    if (d.sizes && d.sizes.length) h += '<p class="mdc-h">Sizes on Meesho:</p><div class="mdc">' + d.sizes.map(s => '<span class="mdc-sz">' + H(s) + "</span>").join("") + "</div>";
    h += '<p class="pd-muted">👉 Choose colour &amp; size on Meesho after tapping <b>Buy Now</b>' + (more.length ? " — other colours are separate Meesho listings" : "") + ".</p></details>";
    return h;
  }
  function sellerChart(p) {
    const d = mdOf(p); if (!d || !d.chart || !d.chart.length) return "";
    return '<details class="pd-sec" open><summary>📏 Size Chart <small>(seller’s, from Meesho)</small></summary><ul class="md-chart">' + d.chart.map(l => "<li>" + H(l) + "</li>").join("") + '</ul><p class="pd-muted">Measurements as the seller lists them on Meesho.</p></details>';
  }
  function details(p) {
    const d = mdOf(p);
    if (d && d.rows && d.rows.length) {
      return '<dl class="pd-dl">' + d.rows.map(r => "<dt>" + H(r[0]) + "</dt><dd>" + H(r[1]) + "</dd>").join("") + "</dl>" +
        '<p class="pd-muted">✅ Exactly as listed in Meesho’s Product Details for this product.</p>';
    }
    const c = found(p.name, COLORS), f = found(p.name, FABRICS), fit = found(p.name, FITS);
    const rows = [["Category", CATS[p.cat] || "—"]];
    if (c.length) rows.push(["Colour", c.map(cap).join(", ")]);
    if (f.length) rows.push(["Fabric", f.map(cap).join(", ")]);
    if (fit.length) rows.push(["Style", fit.map(cap).join(", ")]);
    rows.push(["Sold by", "Meesho sellers"]);
    return '<dl class="pd-dl">' + rows.map(r => "<dt>" + H(r[0]) + "</dt><dd>" + H(r[1]) + "</dd>").join("") + "</dl>" +
      '<p class="pd-muted">Details above come from the product name. Exact fabric, sizes, colours and seller info are on the Meesho page.</p>';
  }

  /* ---------- recently viewed ---------- */
  let recent = sget("rixu_recent", []).filter(k => byKey.has(k));
  const pushRecent = k => { recent = [k, ...recent.filter(x => x !== k)].slice(0, 12); sset("rixu_recent", recent); paintRecent(); };

  /* ---------- mini card (rows) ---------- */
  const mini = i => {
    const p = PRODUCTS[i];
    return '<button class="mc" type="button" data-open="' + i + '"><span class="mc-im"><img src="' + p.img + '" alt="" loading="lazy" width="120" height="150"></span>' +
      '<span class="mc-n">' + H(p.name) + '</span><span class="mc-p"><b>' + fmt(p.price) + "</b>" + (p.mrp ? " <s>" + fmt(p.mrp) + "</s>" : "") + "</span>" +
      (p.rating ? '<span class="mc-r">' + p.rating.toFixed(1) + " ★</span>" : "") + "</button>";
  };
  const row = (id, title, idxs, more) => '<section class="hrow" id="' + id + '"><div class="hrow-h"><h2>' + title + "</h2>" + (more ? '<button type="button" class="hrow-more" data-more="' + more + '">View all</button>' : "") + '</div><div class="hrow-s">' + idxs.map(mini).join("") + "</div></section>";

  const main = document.querySelector("main"), sec = main.querySelector("h2.sec");
  const homeRows = document.createElement("div"); homeRows.id = "homerows"; main.insertBefore(homeRows, sec);
  const allIdx = PRODUCTS.map((p, i) => i);
  const topRated = allIdx.filter(i => (PRODUCTS[i].rating || 0) >= 4.1 && (PRODUCTS[i].rc || 0) >= 200).sort((a, b) => (PRODUCTS[b].rating - PRODUCTS[a].rating) || (PRODUCTS[b].rc - PRODUCTS[a].rc)).slice(0, 12);
  const under299 = allIdx.filter(i => PRODUCTS[i].price <= 299).sort((a, b) => (PRODUCTS[b].rating || 0) - (PRODUCTS[a].rating || 0)).slice(0, 12);
  function paintRecent() {
    const old = document.getElementById("rv-row"); if (old) old.remove();
    if (!recent.length) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = row("rv-row", "Recently Viewed", recent.map(k => byKey.get(k)));
    homeRows.insertBefore(wrap.firstChild, homeRows.firstChild);
  }
  homeRows.insertAdjacentHTML("beforeend", row("tr-row", "Top Rated ⭐ <small>4.1★+ on Meesho</small>", topRated, "top") + row("u2-row", "Under ₹299 🕷️", under299, "u299"));
  paintRecent();
  homeRows.addEventListener("click", e => {
    const m = e.target.closest("[data-more]"); if (!m) return;
    resetExtra(); curCat = "all"; curQ = ""; searchInput.value = "";
    if (m.dataset.more === "u299") { F.max = 299; } else { F.rate = 4; sortSel.value = "rate"; doSort(); }
    applyFilter(); scrollToGrid();
  });
  const showRows = () => { homeRows.hidden = !(curCat === "all" && !curQ && !curMax && !extraActive()); };

  /* ---------- filters (price, rating, discount, category) + extra sort ---------- */
  const F = { min: 0, max: 0, rate: 0, disc: 0 };
  const extraActive = () => !!(F.min || F.max || F.rate || F.disc);
  const resetExtra = () => { F.min = F.max = F.rate = F.disc = 0; };
  const stick = main.querySelector(".stick");
  const qf = document.createElement("div"); qf.className = "qf";
  qf.innerHTML = '<button type="button" class="qfb" data-qf="open">⚙ Filters <span class="qfn" hidden></span></button>' +
    '<button type="button" class="qfb" data-qf="rate">4★ &amp; above</button><button type="button" class="qfb" data-qf="u299">Under ₹299</button>' +
    '<button type="button" class="qfb" data-qf="disc">10% off &amp; more</button><button type="button" class="qfb" data-qf="wish">❤️ Wishlist</button>';
  stick.insertAdjacentElement("afterend", qf);
  // sort: add Discount
  sortSel.insertAdjacentHTML("beforeend", '<option value="disc">Discount</option>');
  const offOf = p => p.mrp && p.mrp > p.price ? (p.off || Math.round((1 - p.price / p.mrp) * 100)) : 0;
  function doSort() {
    const v = sortSel.value; if (v !== "disc") return;
    [...grid.querySelectorAll(".card")].sort((a, b) => (offOf(PRODUCTS[b.dataset.i]) - offOf(PRODUCTS[a.dataset.i])) || (a.dataset.i - b.dataset.i)).forEach(c => grid.appendChild(c));
  }
  sortSel.addEventListener("change", doSort);
  if (sortSel.value === "rel") sortSel.closest(".sortbox").querySelector("span").textContent = "⇅ Sort";
  const sortLbl = () => { const o = sortSel.options[sortSel.selectedIndex]; sortSel.closest(".sortbox").querySelector("span").textContent = sortSel.value === "rel" ? "⇅ Sort" : "⇅ " + o.text.replace("Price: ", ""); };
  sortSel.addEventListener("change", sortLbl);

  qf.addEventListener("click", e => {
    const b = e.target.closest("[data-qf]"); if (!b) return; const v = b.dataset.qf;
    if (v === "open") return openFilters();
    if (v === "rate") F.rate = F.rate ? 0 : 4;
    if (v === "u299") { if (F.max === 299 && !F.min) F.max = 0; else { F.min = 0; F.max = 299; } curMax = 0; }
    if (v === "disc") F.disc = F.disc ? 0 : 10;
    if (v === "wish") { curCat = curCat === "wish" ? "all" : "wish"; }
    applyFilter(); scrollToGrid();
  });

  // filter sheet
  const fs = document.createElement("section"); fs.className = "sheet fsheet"; fs.setAttribute("aria-hidden", "true"); fs.setAttribute("aria-label", "Filters");
  const PR = [["Any", 0, 0], ["Under ₹299", 0, 299], ["₹300 – ₹499", 300, 499], ["₹500 – ₹799", 500, 799], ["₹800 & above", 800, 0]];
  const cats = Object.keys(CATS).filter(k => k !== "wish" && (k === "all" || PRODUCTS.some(p => inCat(p, k))));
  fs.innerHTML = '<div class="dhead"><span class="dbrand">⚙ Filters</span><button class="iconbtn x" type="button" data-fx="close" aria-label="Close">✕</button></div>' +
    '<h4 class="fh">Price</h4><div class="fopts" data-g="price">' + PR.map((r, i) => '<button type="button" class="fo" data-v="' + i + '">' + r[0] + "</button>").join("") + "</div>" +
    '<h4 class="fh">Rating</h4><div class="fopts" data-g="rate"><button type="button" class="fo" data-v="0">Any</button><button type="button" class="fo" data-v="4">4.0★ &amp; above</button><button type="button" class="fo" data-v="3.5">3.5★ &amp; above</button></div>' +
    '<h4 class="fh">Discount <small>(only where Meesho shows an MRP)</small></h4><div class="fopts" data-g="disc"><button type="button" class="fo" data-v="0">Any</button><button type="button" class="fo" data-v="5">5% off &amp; more</button><button type="button" class="fo" data-v="10">10% off &amp; more</button><button type="button" class="fo" data-v="20">20% off &amp; more</button></div>' +
    '<h4 class="fh">Category</h4><div class="fopts" data-g="cat">' + cats.map(k => '<button type="button" class="fo" data-v="' + k + '">' + H(CATS[k]) + "</button>").join("") + "</div>" +
    '<div class="fbar"><button type="button" class="fclear" data-fx="clear">Clear All</button><button type="button" class="fapply" data-fx="apply">Show <b class="fcount"></b> products</button></div>';
  document.body.appendChild(fs);
  let draft = null;
  const matches = (p, c, f, i) => {
    const card = cardOf(i);
    return (c === "all" || inCat(p, c) || (c === "wish" && card && wish.has(card.dataset.id))) && (!curQ || p.name.toLowerCase().includes(curQ)) &&
      (!curMax || p.price <= curMax) && (!f.min || p.price >= f.min) && (!f.max || p.price <= f.max) && (!f.rate || (p.rating || 0) >= f.rate) && (!f.disc || offOf(p) >= f.disc);
  };
  function paintDraft() {
    const pi = PR.findIndex(r => r[1] === draft.min && r[2] === draft.max);
    fs.querySelectorAll('[data-g="price"] .fo').forEach(b => b.classList.toggle("on", +b.dataset.v === pi));
    fs.querySelectorAll('[data-g="rate"] .fo').forEach(b => b.classList.toggle("on", +b.dataset.v === draft.rate));
    fs.querySelectorAll('[data-g="disc"] .fo').forEach(b => b.classList.toggle("on", +b.dataset.v === draft.disc));
    fs.querySelectorAll('[data-g="cat"] .fo').forEach(b => b.classList.toggle("on", b.dataset.v === draft.cat));
    fs.querySelector(".fcount").textContent = PRODUCTS.filter((p, i) => matches(p, draft.cat, draft, i)).length;
  }
  function openFilters() {
    draft = { min: F.min, max: F.max, rate: F.rate, disc: F.disc, cat: curCat === "wish" ? "all" : curCat };
    if (curMax && !F.max) draft.max = curMax;
    paintDraft(); fs.classList.add("open"); scrim.classList.add("open"); document.body.classList.add("lock"); fs.setAttribute("aria-hidden", "false");
  }
  function closeFilters() { if (!fs.classList.contains("open")) return; fs.classList.remove("open"); scrim.classList.remove("open"); document.body.classList.remove("lock"); fs.setAttribute("aria-hidden", "true"); }
  scrim.addEventListener("click", closeFilters);
  fs.addEventListener("click", e => {
    const o = e.target.closest(".fo");
    if (o) {
      const g = o.parentElement.dataset.g, v = o.dataset.v;
      if (g === "price") { draft.min = PR[+v][1]; draft.max = PR[+v][2]; }
      if (g === "rate") draft.rate = +v; if (g === "disc") draft.disc = +v; if (g === "cat") draft.cat = v;
      return paintDraft();
    }
    const x = e.target.closest("[data-fx]"); if (!x) return;
    if (x.dataset.fx === "close") return closeFilters();
    if (x.dataset.fx === "clear") { draft = { min: 0, max: 0, rate: 0, disc: 0, cat: "all" }; return paintDraft(); }
    if (x.dataset.fx === "apply") { F.min = draft.min; F.max = draft.max; F.rate = draft.rate; F.disc = draft.disc; curMax = 0; curCat = draft.cat; closeFilters(); applyFilter(); scrollToGrid(); }
  });

  // replace applyFilter so everything (chips, banners, search, wishlist) goes through the extra filters too
  window.applyFilter = applyFilter = function () {
    let shown = 0;
    grid.querySelectorAll(".card").forEach(c => {
      const i = +c.dataset.i, ok = matches(PRODUCTS[i], curCat, F, i);
      c.hidden = !ok; if (ok) { c.style.animationDelay = Math.min(shown, 6) * 40 + "ms"; shown++; }
    });
    const empty = $("#empty"); empty.hidden = shown > 0;
    empty.textContent = curCat === "wish" && !curQ && !extraActive() ? "Your Wishlist is empty 🕸️ — tap ♡ on any product." : "No products found 🕸️ — try another filter or name.";
    const bits = [];
    if (curCat !== "all") bits.push(CATS[curCat]);
    if (curQ) bits.push("“" + curQ + "”");
    const mx = curMax || F.max;
    if (F.min && mx) bits.push(fmt(F.min) + "–" + fmt(mx)); else if (F.min) bits.push(fmt(F.min) + "+"); else if (mx) bits.push("Under " + fmt(mx));
    if (F.rate) bits.push(F.rate + "★+"); if (F.disc) bits.push(F.disc + "%+ off");
    $("#filterbar").hidden = !bits.length;
    $("#filterlabel").textContent = bits.join(" · ") + " — " + shown + " product" + (shown === 1 ? "" : "s");
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("on", b.dataset.filter === curCat));
    $("#bn-home").classList.toggle("on", curCat !== "wish");
    const oc = document.querySelector(".chip.on"), rw = $("#chips"); if (oc && rw) rw.scrollTo({ left: oc.offsetLeft - (rw.clientWidth - oc.offsetWidth) / 2, behavior: "smooth" });
    qf.querySelector('[data-qf="rate"]').classList.toggle("on", F.rate === 4);
    qf.querySelector('[data-qf="u299"]').classList.toggle("on", (F.max === 299 && !F.min) || curMax === 299);
    qf.querySelector('[data-qf="disc"]').classList.toggle("on", F.disc === 10);
    qf.querySelector('[data-qf="wish"]').classList.toggle("on", curCat === "wish");
    const n = (F.min || F.max ? 1 : 0) + (F.rate ? 1 : 0) + (F.disc ? 1 : 0) + (curCat !== "all" && curCat !== "wish" ? 1 : 0), qn = qf.querySelector(".qfn");
    qn.hidden = !n; qn.textContent = n; qf.querySelector('[data-qf="open"]').classList.toggle("on", !!n);
    showRows();
  };
  document.getElementById("clearfilter").addEventListener("click", () => { resetExtra(); applyFilter(); });
  [document.getElementById("logohome"), document.getElementById("bn-home")].forEach(el => el.addEventListener("click", () => { resetExtra(); applyFilter(); }));
  const _setCat = setCat; window.setCat = setCat = function (c) { _setCat(c); };

  /* ---------- search suggestions ---------- */
  const sform = document.getElementById("searchform");
  const sug = document.createElement("div"); sug.className = "sug"; sug.hidden = true; sug.setAttribute("role", "listbox");
  sform.appendChild(sug);
  const POP = ["hoodie", "oversized tee", "cargo", "baggy jeans", "kurti", "saree", "shoes", "track pants", "shirt", "co-ord"];
  function paintSug() {
    const q = searchInput.value.trim().toLowerCase();
    let html = "";
    if (!q) {
      html = '<p class="sug-h">Popular searches</p><div class="sug-pop">' + POP.map(w => '<button type="button" data-q="' + H(w) + '">🔍 ' + H(w) + "</button>").join("") + "</div>";
      if (recent.length) html += '<p class="sug-h">Recently viewed</p>' + recent.slice(0, 3).map(k => sugItem(byKey.get(k))).join("");
    } else {
      const words = q.split(/\s+/);
      const cm = Object.keys(CATS).filter(k => k !== "all" && k !== "wish" && PRODUCTS.some(p => inCat(p, k)) && words.some(w => CATS[k].toLowerCase().includes(w))).slice(0, 3);
      const pm = allIdx.filter(i => { const n = PRODUCTS[i].name.toLowerCase(); return words.every(w => n.includes(w)); }).slice(0, 6);
      html = cm.map(k => '<button type="button" class="sug-c" data-cat="' + k + '">📂 ' + H(CATS[k]) + " <small>in Categories</small></button>").join("") + pm.map(sugItem).join("");
      if (!html) html = '<p class="sug-h">No matches — try “hoodie”, “cargo”, “kurti”</p>';
    }
    sug.innerHTML = html; sug.hidden = false;
  }
  const sugItem = i => { const p = PRODUCTS[i]; return '<button type="button" class="sug-p" data-open="' + i + '"><img src="' + p.img + '" alt="" width="34" height="42" loading="lazy"><span>' + H(p.name) + "</span><b>" + fmt(p.price) + "</b></button>"; };
  searchInput.addEventListener("focus", paintSug);
  searchInput.addEventListener("input", paintSug);
  document.addEventListener("click", e => { if (!sform.contains(e.target)) sug.hidden = true; });
  sform.addEventListener("submit", () => { sug.hidden = true; searchInput.blur(); });
  sug.addEventListener("click", e => {
    const q = e.target.closest("[data-q]"), c = e.target.closest("[data-cat]"), o = e.target.closest("[data-open]");
    if (q) { searchInput.value = q.dataset.q; curQ = q.dataset.q.toLowerCase(); applyFilter(); sug.hidden = true; searchInput.blur(); scrollToGrid(); }
    else if (c) { searchInput.value = ""; curQ = ""; sug.hidden = true; searchInput.blur(); setCat(c.dataset.cat); scrollToGrid(); }
    else if (o) { sug.hidden = true; searchInput.blur(); openPD(+o.dataset.open); }
  });

  /* ---------- product page ---------- */
  const pd = document.createElement("section"); pd.className = "pd"; pd.setAttribute("aria-hidden", "true"); pd.setAttribute("role", "dialog"); pd.setAttribute("aria-label", "Product details");
  document.body.appendChild(pd);
  const zoom = document.createElement("div"); zoom.className = "pz"; zoom.hidden = true; document.body.appendChild(zoom);
  let curI = -1;
  function openPD(i, fromHash) {
    const p = PRODUCTS[i]; if (!p) return; curI = i;
    const k = keyOf(p), imgs = G[p.img] && G[p.img].length ? G[p.img] : [p.img];
    const card = cardOf(i), wid = card ? card.dataset.id : p.img, wOn = wish.has(wid), inCart = window.RixuCart && RixuCart.has(p);
    const sim = allIdx.filter(j => j !== i && PRODUCTS[j].cat === p.cat).sort((a, b) => (PRODUCTS[b].link.includes("239146129") - PRODUCTS[a].link.includes("239146129")) || ((PRODUCTS[b].rating || 0) - (PRODUCTS[a].rating || 0))).slice(0, 10);
    const rv = RV[p.img] || [], sg = sizeGuide(p), off = offOf(p);
    pd.innerHTML =
      '<header class="pd-top"><button type="button" class="pd-ic" data-pd="back" aria-label="Back">←</button><b class="pd-tt">' + H(p.name) + '</b>' +
      '<button type="button" class="pd-ic" data-pd="share" aria-label="Share">⤴</button><button type="button" class="pd-ic pd-cart" data-pd="cart" aria-label="Cart">🛒<i class="pd-cn"' + (RixuCart && RixuCart.count() ? "" : " hidden") + ">" + (window.RixuCart ? RixuCart.count() : "") + "</i></button></header>" +
      '<div class="pd-body">' +
      '<div class="pd-gal"><div class="pd-slides">' + imgs.map((src, n) => '<button type="button" class="pd-sl" data-zoom="' + n + '"><img src="' + src + '" alt="' + H(p.name) + " photo " + (n + 1) + '" ' + (n ? 'loading="lazy"' : "") + "></button>").join("") + "</div>" +
      (imgs.length > 1 ? '<span class="pd-cnt">1/' + imgs.length + '</span><div class="pd-dots">' + imgs.map((s, n) => "<i" + (n ? "" : ' class="on"') + "></i>").join("") + "</div>" : "") +
      '<button type="button" class="pd-heart' + (wOn ? " on" : "") + '" data-pd="wish" aria-pressed="' + wOn + '" aria-label="' + (wOn ? "Remove from Wishlist" : "Add to Wishlist") + '">' + (wOn ? "❤️" : "♡") + "</button>" +
      (p.rixu ? '<span class="pd-rp">⭐ RIXU Pick</span>' : "") + '<span class="pd-zh">Tap photo to zoom</span></div>' +
      (imgs.length > 1 ? '<div class="pd-thumbs">' + imgs.map((src, n) => '<button type="button" data-th="' + n + '"' + (n ? "" : ' class="on"') + '><img src="' + src + '" alt="" loading="lazy"></button>').join("") + "</div>" : "") +
      '<div class="pd-box"><h1 class="pd-name">' + H(p.name) + '</h1><p class="pd-price"><b>' + fmt(p.price) + "</b>" + (p.mrp && off ? " <s>" + fmt(p.mrp) + "</s> <em>" + off + "% off</em>" : "") + "</p>" +
      (p.rating ? '<p class="pd-rate"><span class="pill">' + p.rating.toFixed(1) + " ★</span>" + (p.rc ? " <span>" + kfmt(p.rc) + " ratings on Meesho</span>" : "") + "</p>" : "") +
      '<p class="pd-muted">Price as seen on Meesho — final price, offers &amp; delivery are shown on Meesho.</p></div>' +
      colours(p) + (sellerChart(p) || (sg ? '<details class="pd-sec"' + (mdOf(p) ? "" : " open") + '><summary>📏 Size Guide <small>(generic)</small></summary>' + sg + '<p class="pd-muted">General guide only. Every seller is different — check the exact Size Chart on the Meesho page before ordering.</p></details>' : "")) +
      '<details class="pd-sec" open><summary>📋 Product Details</summary>' + details(p) + "</details>" +
      (rv.length ? '<details class="pd-sec"><summary>💬 Reviews from Meesho buyers</summary>' + rv.map(r => '<div class="pd-rv"><span class="pill">' + (r.r || "") + ' ★</span><p>' + H(r.t) + "</p></div>").join("") + '<p class="pd-muted">A few real reviews from the Meesho listing. Read all reviews on Meesho.</p></details>' : "") +
      '<details class="pd-sec"><summary>🚚 Orders, Delivery &amp; Returns</summary><p class="pd-muted" style="margin-top:6px">Tap <b>Buy Now</b> → the product opens on Meesho → pick size → order there. Payment, delivery, COD and returns follow Meesho\'s rules for that product.</p></details>' +
      (sim.length ? '<section class="hrow pd-sim"><div class="hrow-h"><h2>Similar Products</h2></div><div class="hrow-s">' + sim.map(mini).join("") + "</div></section>" : "") +
      '<button type="button" class="pd-help" data-pd="helper">👕 Ask Outfit Helper what goes with this</button>' +
      "</div>" +
      '<div class="pd-bar"><button type="button" class="pd-add' + (inCart ? " on" : "") + '" data-pd="add">' + (inCart ? "✓ Added to Cart" : "🛒 Add to Cart") + '</button><a class="pd-buy" href="' + H(p.link) + '" target="_blank" rel="noopener sponsored">Buy Now</a></div>';
    pd.classList.add("open"); pd.setAttribute("aria-hidden", "false"); document.body.classList.add("lock", "pd-on"); pd.scrollTop = 0;
    pd.querySelector(".pd-body").scrollTop = 0;
    const slides = pd.querySelector(".pd-slides");
    slides.addEventListener("scroll", () => {
      const n = Math.round(slides.scrollLeft / slides.clientWidth);
      pd.querySelectorAll(".pd-dots i").forEach((d, j) => d.classList.toggle("on", j === n));
      pd.querySelectorAll(".pd-thumbs button").forEach((d, j) => d.classList.toggle("on", j === n));
      const c = pd.querySelector(".pd-cnt"); if (c) c.textContent = (n + 1) + "/" + imgs.length;
    }, { passive: true });
    pushRecent(k);
    const h = "#p-" + k;
    if (!fromHash && location.hash !== h) { try { history.pushState({ pd: k }, "", h); } catch (e) {} }
  }
  function closePD(fromPop) {
    if (!pd.classList.contains("open")) return;
    pd.classList.remove("open"); pd.setAttribute("aria-hidden", "true"); document.body.classList.remove("pd-on");
    if (!document.querySelector(".sheet.open,.drawer.open,.csheet.open")) document.body.classList.remove("lock");
    closeZoom(); curI = -1;
    if (!fromPop && /^#p-/.test(location.hash)) { try { history.back(); } catch (e) {} }
  }
  function openZoom(n) {
    const imgs = G[PRODUCTS[curI].img] && G[PRODUCTS[curI].img].length ? G[PRODUCTS[curI].img] : [PRODUCTS[curI].img];
    zoom.innerHTML = '<button type="button" class="pz-x" aria-label="Close zoom">✕</button><div class="pz-s">' + imgs.map(s => '<div class="pz-f"><img src="' + s + '" alt=""></div>').join("") + '</div><p class="pz-h">Double-tap / pinch to zoom · swipe for more</p>';
    zoom.hidden = false;
    const sc = zoom.querySelector(".pz-s"); sc.scrollLeft = n * sc.clientWidth;
    zoom.querySelectorAll(".pz-f").forEach(f => {
      let last = 0;
      f.addEventListener("click", e => {
        const now = Date.now(); const img = f.querySelector("img");
        if (now - last < 350 || e.detail === 2) {
          const z = !f.classList.contains("z"); const r = img.getBoundingClientRect();
          const ox = (e.clientX - r.left) / r.width, oy = (e.clientY - r.top) / r.height;
          f.classList.toggle("z", z);
          if (z) requestAnimationFrame(() => { f.scrollLeft = ox * f.scrollWidth - f.clientWidth / 2; f.scrollTop = oy * f.scrollHeight - f.clientHeight / 2; });
        }
        last = now;
      });
    });
  }
  function closeZoom() { zoom.hidden = true; zoom.innerHTML = ""; }
  zoom.addEventListener("click", e => { if (e.target.closest(".pz-x")) closeZoom(); });

  pd.addEventListener("click", async e => {
    const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); return openPD(+o.dataset.open, false); }
    const z = e.target.closest("[data-zoom]"); if (z) return openZoom(+z.dataset.zoom);
    const t = e.target.closest("[data-th]"); if (t) { const sl = pd.querySelector(".pd-slides"); sl.scrollTo({ left: +t.dataset.th * sl.clientWidth, behavior: "smooth" }); return; }
    const b = e.target.closest("[data-pd]"); if (!b) return;
    const p = PRODUCTS[curI], act = b.dataset.pd;
    if (act === "back") closePD();
    if (act === "wish") {
      const card = cardOf(curI), id = card ? card.dataset.id : p.img;
      if (wish.has(id)) { wish.delete(id); toast("Removed from Wishlist"); } else { wish.add(id); toast("❤️ Added to Wishlist"); }
      saveWish(); paintHearts(); const on = wish.has(id);
      b.classList.toggle("on", on); b.textContent = on ? "❤️" : "♡"; b.setAttribute("aria-pressed", on);
      if (curCat === "wish") applyFilter();
    }
    if (act === "add" && window.RixuCart) { if (!RixuCart.has(p)) RixuCart.add(p); paintPdCart(); }
    if (act === "cart" && window.RixuCart) RixuCart.open();
    if (act === "helper") { closePD(); if (window.RixuHelper) setTimeout(() => RixuHelper.open(), 250); }
    if (act === "share") {
      const url = SITE + "#p-" + keyOf(p), text = p.name + " — " + fmt(p.price) + " | RIXU Picks 🕷️";
      if (navigator.share) { try { await navigator.share({ title: p.name, text, url }); } catch (err) {} }
      else window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
    }
  });
  function paintPdCart() {
    if (curI < 0 || !window.RixuCart) return; const p = PRODUCTS[curI], on = RixuCart.has(p);
    const a = pd.querySelector(".pd-add"); if (a) { a.classList.toggle("on", on); a.textContent = on ? "✓ Added to Cart" : "🛒 Add to Cart"; }
    const cn = pd.querySelector(".pd-cn"); if (cn) { cn.textContent = RixuCart.count(); cn.hidden = !RixuCart.count(); }
  }
  // keep product page in sync when cart changes elsewhere (e.g. removed inside cart sheet)
  if (window.RixuCart && RixuCart.refresh) { const r0 = RixuCart.refresh; RixuCart.refresh = function () { r0.apply(this, arguments); paintPdCart(); }; }
  document.addEventListener("click", () => setTimeout(paintPdCart, 0), true);

  // cards open the product page (photo + name); Buy Now / Add to Cart / ♡ keep working as before
  grid.addEventListener("click", e => {
    if (e.target.closest(".heart,.addcart,.buy")) return;
    const ph = e.target.closest(".ph a, .info h3, .info .price, .info .rate"); if (!ph) return;
    e.preventDefault(); openPD(+ph.closest(".card").dataset.i);
  });
  grid.querySelectorAll(".info h3").forEach(h => { h.style.cursor = "pointer"; });
  homeRows.addEventListener("click", e => { const o = e.target.closest("[data-open]"); if (o) openPD(+o.dataset.open); });

  window.addEventListener("popstate", () => { const m = location.hash.match(/^#p-(\w+)/); if (m && byKey.has(m[1])) openPD(byKey.get(m[1]), true); else { closeZoom(); closePD(true); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!zoom.hidden) closeZoom(); else if (pd.classList.contains("open")) closePD(); closeFilters(); } });
  const m0 = location.hash.match(/^#p-(\w+)/); if (m0 && byKey.has(m0[1])) openPD(byKey.get(m0[1]), true);

  window.RixuShop = { openPD, closePD, openFilters, F };
  applyFilter();
})();
