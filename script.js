// RIXU Picks — app logic. Product list lives in products.js (loaded before this file).
// ===================================

const CATS = { all: "All", wint: "Winter Collection ❄️", tees: "T-Shirts", shirts: "Shirts", hoodies: "Hoodies & Sweatshirts", jackets: "Jackets", winter: "High Necks & Sweaters", jeans: "Jeans", cargo: "Cargo & Joggers", shorts: "Shorts", track: "Track Pants / Lowers", shoes: "Shoes & Slippers", kurta: "Kurtas", acc: "Caps & Accessories", girls: "Girls' Picks", kurti: "Kurtis", wtops: "Women's Tops", ksets: "Kurta Sets & Co-ords", saree: "Sarees", wish: "❤️ Wishlist" };
const $ = s => document.querySelector(s);
const grid = $("#grid");
const fmt = n => "₹" + n.toLocaleString("en-IN");
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const buyBtn = p => `<a class="buy" href="${p.link}" target="_blank" rel="noopener sponsored">Buy Now</a>`;


/* ---------- categories: drawer list + chips row, both from CATS ---------- */
(function buildCats() {
  const n = c => c === "all" ? PRODUCTS.length : PRODUCTS.filter(p => inCat(p, c)).length;
  const keys = Object.keys(CATS).filter(k => k !== "wish" && n(k) > 0);
  $("#dcats").innerHTML = keys.map(k => `<button class="dlink" data-filter="${k}">${esc(CATS[k])} <span class="ccount">${n(k)}</span></button>`).join("");
  const SHORT = { all: "All", wint: "Winter ❄️", tees: "T-Shirts", shirts: "Shirts", hoodies: "Hoodies", jackets: "Jackets", jeans: "Jeans", cargo: "Cargo", shorts: "Shorts", track: "Lowers", shoes: "Shoes", kurta: "Kurtas", acc: "Caps & Chains", girls: "Girls", winter: "High Neck", kurti: "Kurtis", wtops: "Tops", ksets: "Kurta Sets", saree: "Sarees" };
  const pic = c => (PRODUCTS.find(p => p.cat === c && !p.rixu) || PRODUCTS.find(p => p.cat === c) || PRODUCTS.find(p => inCat(p, c)) || PRODUCTS[0]).img;
  $("#circles").innerHTML = keys.map(k => `<button class="circ" data-filter="${k}" type="button"><span class="ring">${k === "all" ? '<span class="allc">RIXU</span>' : `<img src="${pic(k)}" alt="" loading="lazy">`}</span><span class="cl">${esc(SHORT[k] || CATS[k])}</span></button>`).join("");
  $("#chips").innerHTML = keys.map(k => `<button class="chip" data-filter="${k}" type="button">${esc(CATS[k])}</button>`).join("");
})();

/* ---------- wishlist (sirf is phone/browser me, localStorage) ---------- */
const WKEY = "rixu_wishlist";
let wish = new Set();
try { wish = new Set(JSON.parse(localStorage.getItem(WKEY) || "[]")); } catch (e) {}
const saveWish = () => { try { localStorage.setItem(WKEY, JSON.stringify([...wish])); } catch (e) {} };
const pid = p => p.img; // stable id (link badalne pe bhi wishlist rahe)

PRODUCTS.forEach((p, i) => {
  const a = document.createElement("article");
  a.className = "card";
  a.dataset.cat = [p.cat, ...(p.also || [])].join(" ");
  a.dataset.name = p.name.toLowerCase();
  a.dataset.id = pid(p);
  a.style.animationDelay = (i * 60) + "ms";
  a.dataset.price = p.price; a.dataset.rating = p.rating || 0; a.dataset.i = i;
  const k = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : n;
  a.innerHTML = `
    <div class="ph"><a href="${p.link}" target="_blank" rel="noopener sponsored" tabindex="-1"><img src="${p.img}" alt="${esc(p.name)}" loading="${i < 4 ? "eager" : "lazy"}" width="360" height="450"></a>${p.rixu ? '<span class="rp">⭐ RIXU Pick</span>' : ""}${p.isNew ? '<span class="new">NEW</span>' : ""}<button class="heart" type="button" aria-pressed="false" aria-label="Add to Wishlist">♡</button></div>
    <div class="info">
      <h3>${esc(p.name)}</h3>
      <p class="price"><b>${fmt(p.price)}</b>${p.mrp ? ` <s>${fmt(p.mrp)}</s> <em>${p.off}% off</em>` : ""}</p>
      ${p.freeDel ? '<span class="fd">Free Delivery</span>' : ""}
      ${p.rating ? `<p class="rate"><span class="pill">${p.rating.toFixed(1)} ★</span><span class="rc">(${k(p.rc)})</span></p>` : ""}
      ${buyBtn(p)}
    </div>`;
  grid.appendChild(a);
});
$("#count").textContent = PRODUCTS.length;

function paintHearts() {
  grid.querySelectorAll(".card").forEach(c => {
    const on = wish.has(c.dataset.id), b = c.querySelector(".heart");
    b.classList.toggle("on", on); b.textContent = on ? "❤️" : "♡";
    b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Remove from Wishlist" : "Add to Wishlist");
  });
  $("#wcount").textContent = wish.size;
  const wd = $("#wdot"); wd.textContent = wish.size; wd.hidden = !wish.size;
}
grid.addEventListener("click", e => {
  const b = e.target.closest(".heart"); if (!b) return;
  const id = b.closest(".card").dataset.id;
  if (wish.has(id)) { wish.delete(id); toast("Removed from Wishlist"); } else { wish.add(id); toast("❤️ Added to Wishlist"); }
  saveWish(); paintHearts(); if (curCat === "wish") applyFilter();
});
paintHearts();

/* ---------- filter + search ---------- */
let curCat = "all", curQ = "", curMax = 0;
function applyFilter() {
  let shown = 0;
  grid.querySelectorAll(".card").forEach(c => {
    const ok = (curCat === "all" || c.dataset.cat.split(" ").includes(curCat) || (curCat === "wish" && wish.has(c.dataset.id))) && (!curQ || c.dataset.name.includes(curQ)) && (!curMax || +c.dataset.price <= curMax);
    c.hidden = !ok; if (ok) { c.style.animationDelay = Math.min(shown, 6) * 40 + "ms"; shown++; }
  });
  $("#empty").hidden = shown > 0;
  $("#empty").textContent = curCat === "wish" && !curQ ? "Your Wishlist is empty 🕸️ — tap ♡ on any product." : "No products found 🕸️ — try another name.";
  const bits = [];
  if (curCat !== "all") bits.push(CATS[curCat]);
  if (curQ) bits.push(`“${curQ}”`);
  if (curMax) bits.push(`Under ${fmt(curMax)}`);
  $("#filterbar").hidden = !bits.length;
  $("#filterlabel").textContent = bits.join(" · ") + ` — ${shown} pick${shown === 1 ? "" : "s"}`;
  document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("on", b.dataset.filter === curCat));
  $("#bn-home").classList.toggle("on", curCat !== "wish");
  const oc = document.querySelector(".chip.on"), row = $("#chips"); if (oc && row) row.scrollTo({ left: oc.offsetLeft - (row.clientWidth - oc.offsetWidth) / 2, behavior: "smooth" });
}
function setCat(c) { curCat = c; curMax = 0; applyFilter(); }
const searchInput = $("#q");
searchInput.addEventListener("input", () => { curQ = searchInput.value.trim().toLowerCase(); applyFilter(); });
$("#searchform").addEventListener("submit", e => { e.preventDefault(); closeDrawer(); scrollToGrid(); });
$("#clearfilter").addEventListener("click", () => { curCat = "all"; curQ = ""; curMax = 0; searchInput.value = ""; applyFilter(); });
const navH = () => Math.round(document.querySelector(".bar").getBoundingClientRect().height);
const setNavH = () => document.documentElement.style.setProperty("--navh", navH() + "px");
setNavH(); addEventListener("resize", setNavH);
// grid ki shuruaat (chips row) ko header ke theek neeche laao — chips hamesha dikhte rahen
const scrollToGrid = () => { const y = $("main").getBoundingClientRect().top + scrollY - navH(); if (scrollY > y || y - scrollY > 40) window.scrollTo({ top: y, behavior: "smooth" }); };

/* ---------- drawer ---------- */
const drawer = $("#drawer"), scrim = $("#scrim"), menuBtn = $("#menubtn");
function openDrawer() {
  drawer.classList.add("open"); scrim.classList.add("open"); document.body.classList.add("lock");
  drawer.setAttribute("aria-hidden", "false"); menuBtn.setAttribute("aria-expanded", "true");
  setTimeout(() => $("#drawerclose").focus({ preventScroll: true }), 50);
}
function closeDrawer() {
  drawer.classList.remove("open"); scrim.classList.remove("open"); document.body.classList.remove("lock");
  drawer.setAttribute("aria-hidden", "true"); menuBtn.setAttribute("aria-expanded", "false");
}
menuBtn.addEventListener("click", openDrawer);
$("#drawerclose").addEventListener("click", closeDrawer);
scrim.addEventListener("click", () => { closeDrawer(); closeSheet(); closeInfo(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeDrawer(); closeSheet(); closeInfo(); } });
$("#navhome").addEventListener("click", e => { e.preventDefault(); setCat("all"); curQ = ""; searchInput.value = ""; applyFilter(); closeDrawer(); window.scrollTo({ top: 0, behavior: "smooth" }); });
document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { setCat(b.dataset.filter); closeDrawer(); scrollToGrid(); }));

/* ---------- photo search ---------- */
const sheet = $("#sheet"), fileIn = $("#photo"), status = $("#pstatus"), results = $("#presults");
function openSheet() { closeDrawer(); sheet.classList.add("open"); scrim.classList.add("open"); document.body.classList.add("lock"); sheet.setAttribute("aria-hidden", "false"); warmUp(); }
function closeSheet() { if (!sheet.classList.contains("open")) return; sheet.classList.remove("open"); scrim.classList.remove("open"); document.body.classList.remove("lock"); sheet.setAttribute("aria-hidden", "true"); }
document.querySelectorAll("[data-photo]").forEach(b => b.addEventListener("click", openSheet));
$("#sheetclose").addEventListener("click", closeSheet);

const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

// Draw an image into a square canvas (centre crop) — shared by both matchers.
function square(im, size) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, s = Math.min(w, h);
  c.getContext("2d").drawImage(im, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c;
}

// Fallback: colour histogram (4x4x4 RGB bins) + histogram intersection.
function colorHist(im) {
  const d = square(im, 64).getContext("2d").getImageData(0, 0, 64, 64).data, h = new Float32Array(64);
  for (let i = 0; i < d.length; i += 4) h[(d[i] >> 6) * 16 + (d[i + 1] >> 6) * 4 + (d[i + 2] >> 6)]++;
  const n = d.length / 4; for (let i = 0; i < 64; i++) h[i] /= n; return h;
}
const histSim = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i]); return s; };

// Main: MobileNet image features (loaded only when this feature opens) + cosine similarity.
let engine = null, warming = null;
async function loadModel() {
  if (!window.tf) {
    try { await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"); }
    catch (e) { await loadScript("https://unpkg.com/@tensorflow/tfjs@4.22.0/dist/tf.min.js"); }
  }
  const base = await tf.loadLayersModel("https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json");
  const feat = tf.model({ inputs: base.inputs, outputs: base.getLayer("global_average_pooling2d_1").output });
  const embed = im => tf.tidy(() => {
    const x = tf.browser.fromPixels(square(im, 224)).toFloat().div(127.5).sub(1).expandDims(0);
    const v = feat.predict(x).flatten();
    return v.div(v.norm()).dataSync().slice();
  });
  return { kind: "ai", embed, sim: (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; } };
}
function warmUp() {
  if (warming) return warming;
  warming = (async () => {
    let eng;
    try { eng = await loadModel(); }
    catch (e) { console.warn("model failed, using colour match", e); eng = { kind: "color", embed: colorHist, sim: histSim }; }
    const imgs = await Promise.all(PRODUCTS.map(p => loadImg(p.img)));
    eng.vecs = imgs.map(im => eng.embed(im));
    engine = eng; return eng;
  })();
  return warming;
}

fileIn.addEventListener("change", async () => {
  const f = fileIn.files && fileIn.files[0]; if (!f) return;
  const url = URL.createObjectURL(f);
  $("#preview").src = url; $("#previewwrap").hidden = false;
  results.innerHTML = ""; $("#pafter").hidden = true;
  status.innerHTML = `<span class="spin">🕷️</span> Dhundh rahe hain…`; status.hidden = false;
  try {
    const [eng, im] = await Promise.all([warmUp(), loadImg(url)]);
    const q = eng.embed(im);
    const ranked = PRODUCTS.map((p, i) => ({ p, s: eng.sim(q, eng.vecs[i]) })).sort((a, b) => b.s - a.s).slice(0, 5);
    status.innerHTML = `Hamari list me se sabse milte-julte 👇${eng.kind === "color" ? ' <span class="note">(rang ke hisaab se)</span>' : ""}`;
    results.innerHTML = ranked.map((r, k) => `
      <div class="res">
        <img src="${r.p.img}" alt="">
        <div class="rinfo">
          <p class="rname">${k === 0 ? "🖤 " : ""}${esc(r.p.name)}</p>
          <p class="rmeta">${fmt(r.p.price)} · <b>${Math.max(1, Math.min(99, Math.round(r.s * 100)))}% match</b></p>
          ${buyBtn(r.p)}
        </div>
      </div>`).join("");
    $("#pafter").hidden = false;
  } catch (e) {
    console.error(e);
    status.textContent = "Ye photo padh nahi paaye 😕 Dusri photo try karo.";
  }
  fileIn.value = "";
});

/* ---------- info sheets: help, about, disclaimer, privacy, share ---------- */
const info = $("#info");
function openInfo(key) {
  const t = document.getElementById("t-" + key); if (!t) return;
  closeDrawer(); closeSheet();
  $("#infotitle").textContent = t.dataset.title;
  $("#infobody").replaceChildren(t.content.cloneNode(true));
  info.scrollTop = 0;
  info.classList.add("open"); scrim.classList.add("open"); document.body.classList.add("lock"); info.setAttribute("aria-hidden", "false");
  if (key === "share") wireShare();
  setTimeout(() => $("#infoclose").focus({ preventScroll: true }), 50);
}
function closeInfo() { if (!info.classList.contains("open")) return; info.classList.remove("open"); scrim.classList.remove("open"); document.body.classList.remove("lock"); info.setAttribute("aria-hidden", "true"); }
$("#infoclose").addEventListener("click", closeInfo);
document.querySelectorAll("[data-info]").forEach(b => b.addEventListener("click", () => openInfo(b.dataset.info)));

/* share: phone ka share menu, warna WhatsApp + copy link */
const SITE = "https://rixupicks.sites.tab.bot/";
const SHARE_TEXT = "RIXU Picks 🖤 — sasta, dark, aesthetic fits ₹500 ke andar";
document.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share({ title: "RIXU Picks", text: SHARE_TEXT, url: SITE }); closeDrawer(); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  openInfo("share");
}));
function wireShare() {
  $("#washare").href = "https://wa.me/?text=" + encodeURIComponent(SHARE_TEXT + " " + SITE);
  $("#copylink").addEventListener("click", async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(SITE); ok = true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = SITE; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); try { ok = document.execCommand("copy"); } catch (e2) {} ta.remove();
    }
    $("#copied").textContent = ok ? "✅ Link copy ho gaya" : SITE;
  });
}

/* toast */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1600); }

/* back to top */
const topBtn = $("#totop");
window.addEventListener("scroll", () => { topBtn.hidden = window.scrollY < 600; }, { passive: true });
topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));


/* ---------- Meesho-style: sort, banners, bottom nav ---------- */
const sortSel = $("#sort");
sortSel.addEventListener("change", () => {
  const v = sortSel.value, cards = [...grid.querySelectorAll(".card")];
  const f = { rel: (a, b) => a.dataset.i - b.dataset.i, low: (a, b) => a.dataset.price - b.dataset.price, high: (a, b) => b.dataset.price - a.dataset.price,
    rate: (a, b) => (b.dataset.rating - a.dataset.rating) || (a.dataset.i - b.dataset.i) }[v];
  cards.sort(f).forEach(c => grid.appendChild(c));
  scrollToGrid();
});
const goHome = e => { if (e) e.preventDefault(); closeDrawer(); closeInfo(); closeSheet(); curCat = "all"; curQ = ""; curMax = 0; searchInput.value = ""; if (sortSel.value !== "rel") { sortSel.value = "rel"; [...grid.querySelectorAll(".card")].sort((a, b) => a.dataset.i - b.dataset.i).forEach(c => grid.appendChild(c)); } applyFilter(); window.scrollTo({ top: 0, behavior: "smooth" }); };
$("#logohome").addEventListener("click", goHome);
$("#bn-home").addEventListener("click", goHome);
$("#bn-cats").addEventListener("click", openDrawer);

const banners = $("#banners"), dots = [...document.querySelectorAll("#bdots i")];
let bIdx = 0, bTimer = null;
const bGo = i => { bIdx = (i + dots.length) % dots.length; banners.scrollTo({ left: bIdx * banners.clientWidth, behavior: "smooth" }); };
banners.addEventListener("scroll", () => { const i = Math.round(banners.scrollLeft / banners.clientWidth); if (i !== bIdx) bIdx = i; dots.forEach((d, j) => d.classList.toggle("on", j === i)); }, { passive: true });
const bStart = () => { clearInterval(bTimer); bTimer = setInterval(() => { if (!document.hidden) bGo(bIdx + 1); }, 3500); };
banners.addEventListener("touchstart", () => clearInterval(bTimer), { passive: true });
banners.addEventListener("touchend", bStart, { passive: true });
bStart();
banners.querySelectorAll("[data-banner]").forEach(b => b.addEventListener("click", () => {
  const v = b.dataset.banner; curQ = ""; searchInput.value = "";
  if (v === "u299") { curCat = "all"; curMax = 299; sortSel.value = "low"; sortSel.dispatchEvent(new Event("change")); applyFilter(); }
  else { setCat(v); scrollToGrid(); }
}));
