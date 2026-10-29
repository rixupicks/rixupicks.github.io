/* Outfit Helper 🕷️ — free, rule-based outfit helper (no AI, no server). Reads PRODUCTS from script.js */
(function () {
  "use strict";
  if (typeof PRODUCTS === "undefined" || !Array.isArray(PRODUCTS)) return;
  const AFF = "239146129";
  const IG = "https://www.instagram.com/rixupicks/";
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rate = p => (typeof p.rating === "number" ? p.rating : 3.8);
  const isAff = p => String(p.link || "").indexOf(AFF) !== -1;
  const nm = p => (p.name + " " + (p.tag || "")).toLowerCase();
  const ALL = PRODUCTS.filter(p => p && p.link && p.price > 0);

  // ---------- roles ----------
  const GIRL_CATS = ["kurti", "wtops", "ksets", "saree", "girls"];
  function role(p, g) {
    const c = p.cat, n = nm(p);
    if (/kids|10 yrs|pajama/.test(n)) return null;
    if (g === "boys") {
      if (GIRL_CATS.includes(c)) return null;
      if (["tees", "shirts", "hoodies", "jackets", "winter", "kurta"].includes(c)) return "top";
      if (["jeans", "cargo", "track", "shorts"].includes(c)) return "bottom";
      if (c === "shoes") return "shoes";
      if (c === "acc") return "acc";
      return null;
    }
    // girls
    if (["kurti", "wtops"].includes(c)) return "top";
    if (c === "girls") return /cargo|pant|jeans/.test(n) ? "bottom" : "top";
    if (c === "winter") return "top";
    if (["ksets", "saree"].includes(c)) return "full";
    if (c === "jeans" && /wide|straight|relaxed/.test(n)) return "bottom";
    if (c === "shoes" && /flat|clog|flip|slipper/.test(n)) return "shoes";
    if (c === "acc" && /watch/.test(n)) return "acc";
    return null;
  }

  // ---------- style fit (0 = no, 1 = ok, 2 = great) ----------
  const DARK = /black|dark|skull|spider|bat|evil|samurai|pirate|itachi|gojo|vegeta|bad boys|kill my vibe|night/;
  function styleFit(p, style) {
    const n = nm(p), c = p.cat;
    if (style === "dark") return DARK.test(n) ? 2 : (/white|cream|yellow|pink|sage|floral|light blue|olive|tan|neon|navy|maroon/.test(n) ? 0 : 1);
    if (style === "street") {
      if (/oversized|anime|graphic|baggy|cargo|hoodie|sweatshirt|sneaker|high-top|wide|jogger|print/.test(n)) return 2;
      if (["kurta", "kurti", "ksets", "saree"].includes(c) || /party|office|loafer|formal/.test(n)) return 0;
      return 1;
    }
    if (style === "ethnic") {
      if (["kurta", "kurti", "ksets", "saree"].includes(c)) return 2;
      if (["track"].includes(c) || /sandal|flip|slipper|clog|flat|loafer|watch|white|cream|straight/.test(n)) return 1;
      return 0;
    }
    if (style === "casual") {
      if (/polo|shirt|tee|top|straight|jeans|track|trouser|loafer|sandal|flat|sneaker|high neck|pullover|sweater/.test(n)) return 2;
      if (["ksets", "saree"].includes(c) || /party/.test(n)) return 0;
      return 1;
    }
    return 1;
  }

  // ---------- outfit builder ----------
  function buildCombos(budget, g, style) {
    const tryPool = pool => {
      const by = { top: [], bottom: [], full: [], shoes: [], acc: [] };
      pool.forEach(p => { const r = role(p, g); if (r) by[r].push(p); });
      const sc = p => rate(p) + (isAff(p) ? 0.6 : 0) + styleFit(p, style) * 1.0;
      const ok = p => styleFit(p, style) > 0;
      const great = p => styleFit(p, style) === 2;
      let tops = by.top.filter(great), bots = by.bottom.filter(great), fulls = by.full.filter(ok);
      if (tops.length < 3 && style !== "ethnic") tops = by.top.filter(ok);
      if (!tops.length) tops = by.top.filter(ok);
      bots = by.bottom.filter(ok);
      if (!tops.length) tops = by.top; if (!bots.length) bots = by.bottom;
      if (style !== "ethnic" && g === "girls") fulls = fulls.filter(p => styleFit(p, style) === 2 || style === "casual" ? true : false);
      const bases = [];
      tops.forEach(t => bots.forEach(b => bases.push([t, b])));
      // girls ethnic: kurti alone is a full outfit; kurta sets / sarees too
      if (g === "girls") fulls.forEach(f => bases.push([f]));
      if (g === "girls" && style === "ethnic") tops.forEach(t => { if (t.cat === "kurti") bases.push([t]); });
      return { bases, by, sc };
    };
    let r = tryPool(ALL.filter(isAff));
    let fits = r.bases.filter(c => sum(c) <= budget);
    if (fits.length < 3) { const r2 = tryPool(ALL); const f2 = r2.bases.filter(c => sum(c) <= budget); if (f2.length > fits.length) { r = r2; fits = f2; } }
    const { by, sc } = r;
    const avg = c => c.reduce((a, p) => a + sc(p), 0) / c.length;
    if (!fits.length) {
      const cheapest = tryPool(ALL).bases.slice().sort((a, b) => sum(a) - sum(b))[0];
      return { fits: [], cheapest: cheapest || null };
    }
    fits.sort((a, b) => (avg(b) - avg(a)) || (sum(b) - sum(a)));
    // diversity: don't repeat the same top/base item back-to-back
    const seenTop = new Set(), seenBot = new Set(), out = [], rest = [];
    fits.forEach(c => {
      const k0 = c[0].img, k1 = c[1] ? c[1].img : "";
      if (!seenTop.has(k0) && (!k1 || !seenBot.has(k1) || seenBot.size >= by.bottom.length)) { seenTop.add(k0); if (k1) seenBot.add(k1); out.push(c); }
      else rest.push(c);
      if (seenBot.size >= Math.max(1, by.bottom.length)) seenBot.clear();
    });
    const ordered = out.concat(rest).slice(0, 60);
    // add shoes / accessory if money left
    const shoes = by.shoes.filter(p => styleFit(p, style) > 0).sort((a, b) => sc(b) - sc(a));
    const accs = by.acc.slice().sort((a, b) => sc(b) - sc(a));
    const final = ordered.map((c, i) => {
      const combo = c.slice();
      let left = budget - sum(combo);
      const sfit = shoes.filter(s => s.price <= left);
      if (sfit.length) { const s = sfit[i % Math.min(sfit.length, 4)]; combo.push(s); left -= s.price; }
      const afit = accs.filter(a => a.price <= left);
      if (afit.length) combo.push(afit[i % Math.min(afit.length, 3)]);
      return combo;
    });
    return { fits: final, cheapest: null };
  }
  const sum = c => c.reduce((a, p) => a + p.price, 0);

  // ---------- UI ----------
  const fab = document.createElement("button");
  fab.className = "rs-fab hide"; fab.type = "button"; fab.setAttribute("aria-label", "Outfit Helper");
  fab.innerHTML = '<span class="rs-fab-ic">🕷️</span><span class="rs-fab-tx">Outfit Helper</span>';
  const panel = document.createElement("section");
  panel.className = "rs-panel"; panel.setAttribute("aria-hidden", "true"); panel.setAttribute("aria-label", "Outfit Helper chat");
  panel.innerHTML =
    '<header class="rs-head"><div class="rs-av">🕷️</div><div class="rs-ttl"><b>Outfit Helper 🕷️</b><small>Darzi + dukaandaar wala dimaag · budget me fit</small></div>' +
    '<button class="rs-x" type="button" aria-label="Band karo">✕</button></header>' +
    '<div class="rs-msgs" role="log" aria-live="polite"></div>' +
    '<div class="rs-chips"></div>' +
    '<form class="rs-form" autocomplete="off"><input class="rs-in" type="text" inputmode="text" placeholder="Kuch bhi pucho… (800, shaadi look, size)" aria-label="Message" maxlength="120">' +
    '<button class="rs-send" type="submit" aria-label="Bhejo">➤</button></form>' +
    '<p class="rs-note">Free helper (rule-based), asli AI nahi · Prices Meesho pe badal sakte hain</p>';
  document.body.appendChild(panel);
  const msgs = panel.querySelector(".rs-msgs"), chips = panel.querySelector(".rs-chips"), form = panel.querySelector(".rs-form"), inp = panel.querySelector(".rs-in");

  const st = { budget: 0, g: "", style: "", combos: [], idx: 0, started: false, awaitingCustom: false };
  const scrollDown = () => { msgs.scrollTop = msgs.scrollHeight; };
  function bot(html) { const d = document.createElement("div"); d.className = "rs-m rs-bot"; d.innerHTML = html; msgs.appendChild(d); scrollDown(); return d; }
  function me(text) { const d = document.createElement("div"); d.className = "rs-m rs-me"; d.textContent = text; msgs.appendChild(d); scrollDown(); }
  function setChips(list) {
    chips.innerHTML = "";
    list.forEach(([label, fn]) => { const b = document.createElement("button"); b.type = "button"; b.className = "rs-chip"; b.textContent = label; b.addEventListener("click", () => { me(label); fn(); }); chips.appendChild(b); });
  }
  const card = p => '<div class="rs-card"><img src="' + escH(p.img) + '" alt="" loading="lazy"><div class="rs-ci"><div class="rs-cn">' + escH(p.name) + '</div><div class="rs-cp">' + money(p.price) + '</div></div>' +
    '<a class="rs-buy" href="' + escH(p.link) + '" target="_blank" rel="noopener sponsored">Buy Now</a>' +
    (window.RixuCart ? '<button type="button" class="rs-cart" data-cart-id="' + escH(p.img) + '">+ Cart</button>' : "") + '</div>';

  const STYLE_NAMES = { dark: "Dark/Black 🖤", street: "Streetwear 🔥", ethnic: "Ethnic/Kurta 🪔", casual: "Casual 😎" };
  function askBudget() {
    bot("Budget kitna hai? 💸");
    setChips([["₹500", () => setBudget(500)], ["₹800", () => setBudget(800)], ["₹1000", () => setBudget(1000)], ["₹1500", () => setBudget(1500)], ["Custom ✍️", () => { st.awaitingCustom = true; bot("Apna budget number me likho (jaise 650) 👇"); setChips([]); inp.focus(); }], ["📏 Size kaise chunu?", () => bot(SIZE_GUIDE)]]);
  }
  function askG() { bot("Kiske liye? 👕"); setChips([["Boys 👦", () => setG("boys")], ["Girls 👧", () => setG("girls")]]); }
  function askStyle() { bot("Kaunsa style? 🕷️"); setChips(Object.keys(STYLE_NAMES).map(k => [STYLE_NAMES[k], () => setStyle(k)])); }
  function next() { if (!st.budget) return askBudget(); if (!st.g) return askG(); if (!st.style) return askStyle(); build(); }
  function setBudget(n) { st.budget = n; st.awaitingCustom = false; next(); }
  function setG(g) { st.g = g; next(); }
  function setStyle(s) { st.style = s; next(); }


  // ---------- styling notes (rule-based, sirf product naam/category se) ----------
  const COLS = [
    [/light blue/, "light blue"], [/sage/, "sage green"], [/olive/, "olive"], [/navy/, "navy"], [/maroon/, "maroon"],
    [/coffee/, "coffee"], [/\btan\b/, "tan"], [/\bgold/, "gold"], [/neon/, "neon"], [/cream/, "cream"], [/beige/, "beige"],
    [/\bgr[ae]y\b/, "grey"], [/\bred\b/, "red"], [/\bpink\b/, "pink"], [/yellow/, "yellow"], [/\bwhite\b/, "white"],
    [/\bblack\b/, "black"], [/\bgreen\b/, "green"], [/\bblue\b/, "blue"], [/\bbrown\b/, "brown"]
  ];
  const NEUTRAL = ["black", "white", "cream", "beige", "grey"];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function colours(p) {
    const n = p.name.toLowerCase(), base = [], acc = [];
    let rest = n;
    COLS.forEach(([re, c]) => {
      const m = rest.match(re);
      if (!m) return;
      const after = rest.slice(m.index + m[0].length).trim();
      (/^(print\b|aura|stripes?\b|flame|logo|horn|\))/.test(after) || /\(\s*$/.test(rest.slice(0, m.index)) ? acc : base).push(c);
      rest = rest.replace(re, " ");
    });
    if (base.includes("black") && acc.length === 0 && base.length > 1 && !/&|and/.test(n)) { acc.push(...base.filter(c => c !== "black")); base.splice(0, base.length, "black"); }
    return { base, acc, two: /2nd colou?r/.test(n) };
  }
  function noun(p) {
    const n = p.name.toLowerCase(), c = p.cat;
    if (c === "shoes") return /slipper|flip/.test(n) ? "slipper" : /sandal|clog/.test(n) ? "sandal" : /loafer/.test(n) ? "loafer" : /flat/.test(n) ? "flats" : "shoes";
    if (/hoodie/.test(n)) return "hoodie"; if (/sweatshirt/.test(n)) return "sweatshirt"; if (/pullover/.test(n)) return "pullover";
    if (/high neck|sweater/.test(n)) return "high neck"; if (/jacket|bomber|windcheater/.test(n)) return "jacket";
    if (c === "ksets") return "kurta set"; if (c === "saree") return "saree"; if (/kurti/.test(n)) return "kurti"; if (/kurta/.test(n)) return "kurta";
    if (/jeans/.test(n)) return "jeans"; if (/cargo/.test(n)) return "cargo"; if (/shorts/.test(n)) return "shorts";
    if (/track|trouser|pant/.test(n)) return "track pant"; if (/shirt/.test(n) && !/t-?shirt/.test(n)) return "shirt";
    if (/tee|t-shirt/.test(n)) return "tee"; if (/top/.test(n)) return "top";
    if (c === "acc") return /watch/.test(n) ? "watch" : /cap/.test(n) ? "cap" : /chain/.test(n) ? "chain" : "bracelet";
    return "item";
  }
  const PAIR = {
    black: "white/grey/blue — sab ke saath chalta hai", white: "black ya blue denim ke saath clean lagta hai", cream: "black/brown/olive ke saath",
    beige: "black/brown ke saath", grey: "black/white/navy ke saath", red: "black ke saath attitude look 🔥", maroon: "black/cream ke saath rich look",
    navy: "white/cream/grey ke saath", blue: "white ya black ke saath", "light blue": "white/black top ke saath fresh look", green: "black/white/cream ke saath",
    "sage green": "white/cream/beige ke saath soft look", olive: "black/white ke saath streetwear vibe", yellow: "white/cream ke saath festive vibe",
    pink: "white/cream ke saath soft look", tan: "white/black/denim ke saath", coffee: "cream/white/blue denim ke saath", brown: "cream/white/denim ke saath",
    gold: "maroon/black ke saath festive", neon: "baaki sab plain black rakho"
  };
  const has2 = (a, b, x, y) => (a === x && b === y) || (a === y && b === x);
  function pairWhy(a, b) {
    if (a === b) return a === "black" ? "Full black 🖤 — dark, slim aur attitude wala look" : cap(a) + " + " + a + " — monochrome look, shoes alag colour ke rakho";
    for (const n of ["white", "cream", "beige"]) if (has2(a, b, "black", n)) return "Black + " + n + " = classic contrast, kabhi galat nahi";
    for (const r of ["red", "maroon"]) if (has2(a, b, "black", r)) return "Black + " + r + " = attitude combo 🔥";
    for (const n of ["white", "cream", "grey"]) if (has2(a, b, "navy", n)) return "Navy + " + n + " = clean, smart look";
    for (const g of ["olive", "green", "sage green"]) if (has2(a, b, "black", g)) return "Black + " + g + " = streetwear/army vibe";
    for (const bl of ["blue", "light blue"]) { if (has2(a, b, bl, "white")) return cap(bl) + " + white = fresh, clean look"; if (has2(a, b, bl, "black")) return "Black + " + bl + " = safe daily combo"; }
    if (NEUTRAL.includes(a) && NEUTRAL.includes(b)) return cap(a) + " + " + b + " — dono neutral, safe aur classy";
    if (NEUTRAL.includes(a) || NEUTRAL.includes(b)) { const nn = NEUTRAL.includes(a) ? a : b, o = nn === a ? b : a; return cap(nn) + " neutral hai — " + o + " ke saath easily match"; }
    return cap(a) + " + " + b + " dono colourful — shoes/accessory black ya white rakho";
  }
  function pickFor(partner, style) {
    if (style === "dark") return "black";
    if (!partner) return "black/white/grey (neutral)";
    if (partner === "black") return "white/grey ya black";
    if (["white", "cream", "beige"].includes(partner)) return "black/navy";
    if (NEUTRAL.includes(partner)) return "black/white";
    return "black/white (neutral)";
  }
  const FAB = [
    [/fleece/, "fleece — andar se soft aur garam, sardi ke liye 🔥"], [/cotton/, "cotton — halka, roz pehnne me comfortable"],
    [/rayon/, "rayon — smooth aur flowy, garmi me aaram"], [/georgette/, "georgette — halki, flowy, party look"],
    [/organza/, "organza — crisp aur shiny, party/shaadi ke liye"], [/satin/, "satin — chamakdaar, party/raat ke liye"],
    [/corduroy/, "corduroy — texture wala, thand me badhiya"], [/chikankari/, "chikankari kaam — elegant, din ke function ke liye"],
    [/embroider/, "embroidery — festive feel"], [/mirror work|stone work|diamond work/, "work wala design — function me chamkega"],
    [/ribbed/, "ribbed — stretchy, body pe fit baithta hai"], [/popcorn|textured/, "textured kapda — plain se premium dikhta hai"],
    [/acid wash|mud-wash/, "wash finish — rugged street look"], [/puffer/, "puffer — padded, sardi me garam"],
    [/windcheater/, "windcheater — hawa se bachata hai"], [/leather/, "leather look — rough attitude"]
  ];
  const FIT = [
    [/oversized/, "oversized — loose, street look"], [/super baggy|baggy/, "baggy — loose aur comfy"], [/wide-? ?leg/, "wide-leg — neeche se khula, trendy"],
    [/relaxed/, "relaxed fit — aaramdayak"], [/straight/, "straight fit — na tight na loose"], [/slim/, "slim fit — body ke shape me"],
    [/crop/, "crop — high-waist bottom ke saath"], [/bell sleeve/, "bell sleeves — stylish, khule sleeves"], [/half-zip|quarter-zip/, "zip neck — layer karke bhi pehno"],
    [/jogger/, "jogger — neeche elastic, sporty"], [/cargo|6-pocket/, "jebon wali, utility/street look"], [/full sleeve|full-sleeve/, "full sleeve — halki thand me bhi"],
    [/high neck|sweater|pullover/, "sardi ke liye"], [/hoodie|sweatshirt/, "thandi shaam/sardi ke liye"], [/jeans/, "denim — mazboot, roz chalegi"]
  ];
  function feel(p) {
    const n = p.name.toLowerCase(), out = [];
    for (const [re, t] of FAB) if (re.test(n)) { out.push(t); break; }
    for (const [re, t] of FIT) if (re.test(n) && out.length < 2) { out.push(t); break; }
    return out;
  }
  const short = p => noun(p) === "item" ? escH(p.name) : cap(noun(p));
  const tl = (p, why) => '<a class="rs-tl" href="' + escH(p.link) + '" target="_blank" rel="noopener sponsored">' + escH(p.name) + " · " + money(p.price) + " → Buy Now</a>" + (why ? " — " + why : "");
  function suggest(c, rl) {
    const inC = new Set(c.map(p => p.img));
    const l = ALL.filter(p => !inC.has(p.img) && role(p, st.g) === rl && styleFit(p, st.style) > 0)
      .sort((a, b) => (styleFit(b, st.style) - styleFit(a, st.style)) || (isAff(b) - isAff(a)) || (rate(b) - rate(a)) || (a.price - b.price));
    return l[0] || null;
  }
  function shoeWhy(s, mainCol) {
    const sc = colours(s).base;
    if (sc.includes("white")) return mainCol === "black" ? "white se contrast milega" : "white sab ke saath fresh lagta hai";
    if (sc.includes("black")) return mainCol === "black" ? "full dark look poora 🖤" : "black shoes safe choice";
    return "outfit ke saath comfy pair";
  }
  const CARE = [[/fleece/, "fleece: halki dhulai, dryer nahi"], [/cotton/, "cotton: ulta karke dhoyo"], [/satin/, "satin: haath se dhoyo"],
    [/rayon/, "rayon: thande paani me haath se"], [/georgette|organza/, "georgette/organza: haath se halka ya dry clean"],
    [/corduroy/, "corduroy: ulta karke dhoyo"], [/jeans|denim/, "jeans: ulta karke, kam dhulai = colour tikega"]];
  function care(c) {
    const n = c.map(p => p.name.toLowerCase()).join(" ");
    for (const [re, t] of CARE) if (re.test(n)) return t;
    return "";
  }
  function bodyTip(c, ta, ba, all) {
    if (st.style === "ethnic" && c.some(p => ["kurti", "ksets", "kurta"].includes(p.cat))) return "Chhota kad ho to straight kurti + same colour bottom lambai dikhata hai.";
    if (/oversized|baggy|wide/.test(all)) return "Lambe/patle ho to ye loose fit best jachega; chubby ho to dark colour me lo.";
    if (ta && ta === ba) return "Same colour top+bottom chhote kad pe lambai dikhata hai ✅";
    if (ta === "black" || ba === "black") return "Dark solid colour slim dikhata hai — chubby body pe bhi badhiya.";
    return "Chubby ho to straight fit + dark colour, patle ho to layered/loose fit.";
  }
  function comboNote(c) {
    const top = c.find(p => ["top", "full"].includes(role(p, st.g))) || c[0];
    const bot = c.find(p => role(p, st.g) === "bottom");
    const shoe = c.find(p => p.cat === "shoes"), acc = c.find(p => p.cat === "acc");
    const tc = colours(top), bc = bot ? colours(bot) : null;
    const ta = tc.base[0] || "", ba = bc ? bc.base[0] || "" : "";
    const L = [];
    // 1. colour
    let col;
    if (bot) {
      if (ta && ba) col = pairWhy(ta, ba) + ".";
      else if (ta && !ba) col = cap(ta) + " " + noun(top) + " ke saath " + noun(bot) + " ka colour Meesho pe <b>" + pickFor(ta, st.style) + "</b> chuno — perfect match.";
      else if (!ta && ba) col = cap(noun(top)) + " ka colour Meesho pe <b>" + pickFor(ba, st.style) + "</b> lo — " + ba + " " + noun(bot) + " ke saath jachega.";
      else col = "Dono ka colour Meesho pe chuno — <b>" + (st.style === "dark" ? "black + black" : "ek neutral (black/white/grey)") + "</b> rakho, safe combo.";
    } else {
      col = ta ? cap(ta) + " " + noun(top) + " — " + PAIR[ta] + "." : cap(noun(top)) + " ka colour naam me nahi — Meesho pe options dekh ke <b>" + (st.style === "dark" ? "black/maroon" : "jo skin pe jache (maroon, pink, blue safe)") + "</b> lo.";
    }
    if (!ta && tc.acc.length) col += " (" + noun(top) + " pe " + tc.acc[0] + " print hai" + (st.style === "dark" ? " — black base pe zyada ubhrega)" : ")");
    if (tc.two || (bot && bc.two)) col += " Iska 2nd colour option bhi hai — upar wala rule follow karo.";
    L.push("🎨 <b>Colour:</b> " + col);
    // 2. kapda / fit
    const f = [];
    feel(top).slice(0, 2).forEach(t => f.push(cap(noun(top)) + ": " + t));
    if (bot) feel(bot).slice(0, 1).forEach(t => f.push(cap(noun(bot)) + ": " + t));
    const known = /fleece|cotton|rayon|georgette|organza|satin|corduroy|jeans|leather|denim/.test(c.map(p => p.name.toLowerCase()).join(" "));
    const cr = care(c);
    L.push("🧵 <b>Kapda/fit:</b> " + (f.length ? f.slice(0, 2).join(" · ") + (known ? "" : ". Kapda Meesho page pe check karo") : "Kapda/size details Meesho product page pe check karo") + "." + (cr ? " 🧼 " + cr : ""));
    // 3. occasion
    const all = c.map(p => p.name.toLowerCase()).join(" ");
    let occ;
    if (st.style === "ethnic") occ = /party|georgette|organza|diamond|stone|anarkali/.test(all) ? "shaadi, party, function 🎉" : "festival, puja, family function 🪔";
    else if (/satin|party/.test(all)) occ = "party, raat ki outing 🌙";
    else if (st.style === "dark") occ = "college, hangout, raat ki outing 🌙";
    else if (st.style === "street") occ = "college, friends ke saath bahar, reels/photos 📸";
    else occ = /office/.test(all) ? "office/college 💼" : "roz college/tuition, shopping, outing 😎";
    const occLine = "📍 <b>Kab pehne:</b> " + occ;
    // 4. styling tip (site ke products se)
    const mc = ta || ba;
    let tip = "";
    if (shoe) tip = "👟 " + short(shoe) + ": " + shoeWhy(shoe, mc) + ".";
    else { const s = suggest(c, "shoes"); if (s) tip = "Saath me " + tl(s, shoeWhy(s, mc)); }
    if (!tip || shoe) {
      if (!acc) { const a = suggest(c, "acc"); if (a) tip += (tip ? " " : "") + "Add karo: " + tl(a, /watch/i.test(a.name) ? "classy touch" : "attitude badhega"); }
    }
    if (!tip) tip = st.g === "girls" ? (st.style === "ethnic" ? "Jhumke/earrings + juttis se look complete ✨" : "Simple earrings + sling bag se look complete ✨") : "Simple watch/chain se look complete ✨";
    L.push(occLine + " · ✨ " + tip);
    // 5. size
    let sz;
    if (c.some(p => p.cat === "saree")) sz = "Saree ka blouse/size Meesho page pe dekho" + (/no blouse/.test(all) ? " (naam me likha hai — blouse saath nahi aata)." : ".");
    else if (/oversized|baggy/.test(all)) sz = "Chest naap ke Meesho size chart se milao; oversized/baggy wala normal size me hi lo (wo already loose hai).";
    else if (c.some(p => ["kurti", "ksets", "wtops"].includes(p.cat))) sz = "Bust/length naap ke size chart se milao, beech me ho to 1 size bada lo.";
    else sz = "Chest/waist naap ke Meesho size chart se milao; oversized look chahiye to 1 size bada.";
    const bt = bodyTip(c, ta, ba, all);
    L.push("📏 <b>Darzi tip:</b> " + sz + (bt ? " " + bt : ""));
    const who = st.g === "girls" ? "Didi" : "Bhaiya";
    const rs = c.filter(p => typeof p.rating === "number").map(p => p.rating);
    const good = rs.length && Math.min.apply(null, rs) >= 4;
    const head = who + ", " + (st.budget && sum(c) <= st.budget ? money(st.budget) + " me ye best combo hai 👌" : "ye combo dekho 👌") +
      (rs.length ? " Rating " + rs.map(r => "⭐" + r.toFixed(1)).join(", ") + (good ? " — log pasand kar rahe hain." : "") : "");
    return '<div class="rs-sn"><div class="rs-snh">🕷️ ' + head + "</div>" + L.join("<br>") + "</div>";
  }
  function productNote(p) {
    const k = colours(p), a = k.base[0];
    let t = a ? "🎨 " + cap(a) + " — " + PAIR[a] + "." : (k.acc.length ? "🎨 " + cap(k.acc[0]) + " print — base colour Meesho pe dekho, black/white safe." : "🎨 Colour Meesho pe chuno — black/white/grey sab ke saath match.");
    if (k.two) t += " 2nd colour option bhi hai.";
    const f = feel(p);
    t += "<br>🧵 " + (f.length ? cap(f[0]) + (f[1] ? " · " + f[1] : "") + "." : "Kapda/size details Meesho page pe check karo.");
    return '<div class="rs-pn">' + t + "</div>";
  }

  function build() {
    const r = buildCombos(st.budget, st.g, st.style);
    st.combos = r.fits; st.idx = 0;
    if (!r.fits.length) {
      if (r.cheapest) {
        bot("😅 " + money(st.budget) + " me poora outfit nahi ban raha. Sabse sasta combo ye hai:");
        showCombo(r.cheapest, "Sabse sasta combo");
      } else bot("Is style me abhi outfit nahi mil raha 😅 Dusra style try karo.");
      endChips();
      return;
    }
    bot("Ye lo tumhara " + STYLE_NAMES[st.style] + " outfit, " + money(st.budget) + " ke andar 👇");
    showCombo(r.fits[0]);
    endChips();
  }
  function showCombo(c, title) {
    const t = sum(c);
    bot('<div class="rs-combo">' + (title ? '<div class="rs-ct">' + escH(title) + "</div>" : "") + c.map(card).join("") +
      '<div class="rs-total">Total: <b>' + money(t) + "</b>" + (st.budget && t <= st.budget ? ' <span class="rs-ok">✓ budget me</span>' : "") + "</div>" +
      (window.RixuCart ? '<button type="button" class="rs-allcart" data-all="' + escH(c.map(p => p.img).join("|")) + '">🛒 Sab cart me daalo</button>' : "") + "</div>");
    bot(comboNote(c));
    if (window.RixuCart) window.RixuCart.refresh();
  }
  function more() {
    if (!st.combos.length) return build();
    st.idx = (st.idx + 1) % st.combos.length;
    if (st.idx === 0) bot("Saare combos dikha diye, phir se shuru 🔁");
    showCombo(st.combos[st.idx]); endChips();
  }
  function endChips() {
    setChips([["Aur dikhao 🔄", more], ["Budget badlo 💸", () => { st.budget = 0; askBudget(); }], ["Style badlo 🎨", () => { st.style = ""; askStyle(); }], [st.g === "girls" ? "Boys ke liye 👦" : "Girls ke liye 👧", () => setG(st.g === "girls" ? "boys" : "girls")], ["📏 Size kaise chunu?", () => bot(SIZE_GUIDE)]]);
  }

  // ---------- typed questions ----------
  const CAT_WORDS = [
    [/kurta set|kurti set|co-?ord|coord/, "ksets", "Kurta Sets"],
    [/kurti|kurtis/, "kurti", "Kurtis"],
    [/kurta/, "kurta", "Kurtas"],
    [/saree|sari\b|sadi|saari/, "saree", "Sarees"],
    [/hoodie|hoody|sweatshirt/, "hoodies", "Hoodies"],
    [/t-?shirt|tshirt|\btee/, "tees", "T-Shirts"],
    [/shirt/, "shirts", "Shirts"],
    [/jacket|bomber|windcheater|puffer/, "jackets", "Jackets"],
    [/high ?neck|sweater|pullover/, "winter", "High Necks & Sweaters"],
    [/jeans|denim/, "jeans", "Jeans"],
    [/cargo|jogger/, "cargo", "Cargo & Joggers"],
    [/shorts|nikar/, "shorts", "Shorts"],
    [/track|lower|pajama|trouser|pant/, "track", "Track Pants / Lowers"],
    [/shoe|sneaker|joota|juta|jute|chappal|slipper|sandal|loafer|boot|footwear|flip/, "shoes", "Shoes & Slippers"],
    [/\btops?\b/, "wtops", "Women's Tops"],
    [/\bcap\b|chain|bracelet|watch|ghadi|accessor/, "acc", "Caps & Accessories"]
  ];
  const FAQ = /deliver|cod\b|cash on|return|refund|exchange|replace|size|payment|\bpay\b|upi|shipping|kab aay|kab aaega|kab ayega|track order|order kaise|kaise order|order/;
  const MEESHO_ANS = "Order Meesho pe hota hai — delivery, COD, return aur size Meesho ke rules ke hisab se. Buy Now dabake product page pe details dekho.";
  function showList(list, intro) {
    bot(escH(intro) + '<div class="rs-combo">' + list.map(p => card(p) + productNote(p)).join("") + "</div>");
    if (window.RixuCart) window.RixuCart.refresh();
  }
  function cheapestIn(cat) {
    const l = ALL.filter(p => p.cat === cat);
    const aff = l.filter(isAff), base = aff.length >= 4 ? aff : l;
    return base.slice().sort((a, b) => a.price - b.price || rate(b) - rate(a)).slice(0, 4);
  }
  // ---------- bada intent table (kuch bhi pucho) ----------
  const SIZE_GUIDE = "📏 <b>Darzi wala size guide:</b><br>1️⃣ Inch tape se <b>chest</b> naapo (bagal ke neeche, poori chhati ke around), bottom ke liye <b>kamar (waist)</b> jahan pant pehente ho.<br>2️⃣ Product kholo → Meesho pe <b>size chart</b> dekho, apna naap milao.<br>3️⃣ Beech me ho to bada size lo. <b>Oversized look</b> chahiye to normal se 1 size bada; jo pehle se 'Oversized' likha hai wo normal size me.<br>4️⃣ Kurti me bust + length dono milao. Return/exchange Meesho ke rules ke hisab se.";
  const top4 = (f, n, max) => ALL.filter(p => f(p) && (!max || p.price <= max)).sort((a, b) => (isAff(b) - isAff(a)) || (rate(b) - rate(a)) || (a.price - b.price)).slice(0, n || 4);
  const isG = p => GIRL_CATS.includes(p.cat) || (p.cat === "girls");
  const isB = p => !isG(p) && !/kids|10 yrs|pajama/.test(nm(p));
  const gf = g => g === "girls" ? isG : g === "boys" ? isB : () => true;
  function picks(list, intro) { if (list.length) showList(list, intro); else bot(intro + "<br>Abhi is me site pe kuch nahi mila 😅"); }
  function genderOf(t) {
    if (/\b(bhai|brother|bro|papa|dad|father|pita|bf|boyfriend|husband|pati|beta|chacha|mama ji|boy|boys|ladka|ladke|men|mens|gents)\b/.test(t)) return "boys";
    if (/\b(behen|behan|bahan|sister|sis|didi|mummy|mumma|mom|maa|mother|gf|girlfriend|wife|biwi|patni|beti|girl|girls|ladki|women|womens|ladies)\b/.test(t)) return "girls";
    return "";
  }
  const COLOR_Q = /colou?r|rang|match|kiske saath|kis ke saath|ke saath kya|saath me kya|combination/;
  function handle(text) {
    const t = " " + text.toLowerCase().replace(/[₹,?!.]/g, " ") + " ";
    const numM = t.match(/(\d{3,5})/), num = numM ? parseInt(numM[1], 10) : 0, max = num >= 100 && num <= 20000 ? num : 0;
    const g = genderOf(t) || st.g;
    // size / naap
    if (/size|naap|measure|kaunsa size|konsa size|fitting|chhota pad|tight|loose ho/.test(t) && !/plus size/.test(t)) { bot(SIZE_GUIDE); return; }
    // kapda care
    if (/dho|wash|dhul|iron|press|care|saaf|sukha|dry clean|rang nikal|colour nikal/.test(t)) {
      const m = CARE.find(([re]) => re.test(t));
      bot("🧼 <b>Kapde ki care (darzi tip):</b><br>" + (m && /jeans|corduroy/.test(m[1]) ? "• " + cap(m[1]) + "<br>" : "") +
        "• Pehli 2 dhulai alag aur thande paani me — dark colour ka rang nahi nikalta<br>• Print/graphic wale ulta karke dhoyo, print pe direct press mat karo<br>• Cotton: ulta karke, halki dhoop me sukhao · Fleece/hoodie: halki dhulai, dryer nahi<br>• Satin/georgette/rayon: haath se, nichodo mat<br>• Label pe care likha ho to wahi follow karo");
      return;
    }
    // body type
    if (/mota|moti|motu|chubby|fat|heavy|healthy|plus size|weight zyada|pet nikla/.test(t)) {
      bot("Koi tension nahi 🙂 Darzi tip: <b>dark solid colours</b> (black/navy/maroon), <b>straight fit</b>, aur vertical lines slim dikhate hain. Bahut tight ya bahut baggy dono avoid karo; V-neck/collar accha lagta hai.");
      picks(top4(p => gf(g)(p) && /black|navy|maroon|straight|plus size/.test(nm(p)) && !/oversized|baggy|crop/.test(nm(p)) && !["shoes", "acc"].includes(p.cat), 4, max), "Tumhare liye ye accha rahega 👇"); return;
    }
    if (/patla|patli|dubla|dubli|thin|skinny|weak body/.test(t)) {
      bot("Darzi tip: patle ho to <b>oversized/baggy</b>, layering (tee ke upar shirt/jacket) aur hoodies body ko bhara hua dikhate hain. Light colours bhi chalte hain.");
      picks(top4(p => gf(g)(p) && /oversized|baggy|hoodie|sweatshirt|wide|jacket|high neck/.test(nm(p)), 4, max), "Ye try karo 👇"); return;
    }
    if (/lamba|lambi|tall|height zyada/.test(t)) { bot("Lambe ho to <b>baggy/wide-leg</b> bottom aur oversized top best jachte hain; long kurti bhi mast lagegi 👌"); picks(top4(p => gf(g)(p) && /baggy|wide|oversized|cargo/.test(nm(p)), 4, max), "Ye dekho 👇"); return; }
    if (/chhota kad|chota kad|height kam|short height|nata|naata|kad chhota|kad chota/.test(t)) { bot("Chhota kad ho to <b>same colour top+bottom</b> (jaise full black), straight/slim fit aur short kurti lambai dikhate hain. Bahut baggy avoid karo."); picks(top4(p => gf(g)(p) && /straight|black|short kurti|slim/.test(nm(p)) && !/baggy|wide/.test(nm(p)) && !["shoes", "acc"].includes(p.cat), 4, max), "Ye accha rahega 👇"); return; }
    // gift
    if (/gift|tohfa|tofa|present|birthday|bday|surprise/.test(t)) {
      const l = top4(p => gf(g)(p) && !/kids|10 yrs/.test(nm(p)), 4, max);
      bot("🎁 Gift ke liye safe choice: hoodie/tee/kurti — size ka darr kam ho to <b>oversized</b> ya accessory lo." + (g ? "" : " (Kiske liye hai — bhai/behen/dost? likh do to aur sahi chunu)") + (max ? " Budget " + money(max) + " ke andar 👇" : ""));
      picks(l, "Top rated gift picks 👇"); return;
    }
    // gym
    if (/\bgym\b|workout|exercise|running|jogging|daud|sports|yoga/.test(t)) {
      bot("💪 Sach bataun — site pe abhi proper gym wear kam hai. Track pant/jogger + cotton tee/shorts + comfy shoes se kaam ho jayega.");
      const gymF = p => (["track", "shorts"].includes(p.cat) || /jogger|cotton tee|sneaker|track/.test(nm(p)));
      let gl = top4(p => gf(g)(p) && gymF(p), 4, max); if (!gl.length) gl = top4(gymF, 4, max);
      picks(gl, "Gym/running ke liye 👇" + (g === "girls" ? " (ye unisex jaise pehen sakte ho — size chart dekh lena)" : "")); return;
    }
    // occasions → tip + outfit flow
    const occ = [
      [/shaadi|shadi|wedding|marriage|reception|sangeet|mehendi|haldi|function|engagement/, "ethnic", "💍 Shaadi/function: boys ke liye kurta, girls ke liye saree/kurta set/anarkali best. Rang: maroon, yellow, gold, pink chalte hain; black bhi party me chalta hai."],
      [/diwali|deepawali|navratri|dussehra|eid|holi|raksha|rakhi|puja|pooja|festival|tyohar|karwa/, "ethnic", "🪔 Festival look: yellow/maroon/pink kurta ya kurti, mirror/embroidery wala kaam chamakta hai. Holi ho to white purana wala 😄"],
      [/party|club|night out|raat ki/, "dark", "🎉 Party: black satin/party shirt ya black outfit + shiny shoes; girls ke liye georgette saree/party kurti."],
      [/\bdate\b|date pe|gf ke saath|bf ke saath|milne ja/, "casual", "❤️ Date look: clean rakho — shirt/polo + jeans, ya kurti/top + jeans. Zyada loud print avoid, perfume mat bhoolna 😉"],
      [/office|interview|job|formal/, "casual", "💼 Office/interview: plain shirt + straight trouser/jeans, loafers. Girls ke liye office wear kurti. Colour: white, black, sage, navy."],
      [/college|school|tuition|coaching|class/, "casual", "🎒 College: comfy + cool — oversized tee/hoodie + cargo/jeans + sneakers."]
    ];
    for (const [re, sty, tip] of occ) if (re.test(t)) {
      bot(tip); st.style = sty; if (max) st.budget = max; const gg = genderOf(t); if (gg) st.g = gg; next(); return;
    }
    // season
    if (/winter|sardi|sardiyo|thand|thandi|cold/.test(t)) { bot("🥶 Sardi ke liye: fleece hoodie, high neck sweater, puffer/bomber jacket. Layer karo — tee ke upar hoodie/jacket."); picks(top4(p => gf(g)(p) && ["hoodies", "winter", "jackets"].includes(p.cat), 4, max), "Sardi picks 👇"); return; }
    if (/summer|garmi|garam|heat|dhoop/.test(t)) { bot("☀️ Garmi me: cotton/rayon, halke colours (white, cream, light blue), loose fit. Black dhoop me garam lagta hai."); picks(top4(p => gf(g)(p) && /cotton|rayon|white|cream|light blue|shorts|polo/.test(nm(p)), 4, max), "Garmi picks 👇"); return; }
    // colour matching
    if (COLOR_Q.test(t)) {
      const c = COLS.find(([re]) => re.test(t));
      if (c) {
        bot("🎨 " + cap(c[1]) + " — " + PAIR[c[1]] + ". Safe rule: ek colourful + ek neutral (black/white/grey/cream) kabhi galat nahi.");
        const want = { black: /white|grey|blue|cream|red/, white: /black|blue|navy/, cream: /black|brown|olive/, beige: /black|brown/, grey: /black|white|navy/, red: /black/, maroon: /black|cream/, navy: /white|cream|grey/, blue: /white|black/, "light blue": /white|black/, olive: /black|white/, green: /black|white|cream/, "sage green": /white|cream|beige/, yellow: /white|cream/, pink: /white|cream/ }[c[1]] || /black|white/;
        picks(top4(p => gf(g)(p) && want.test(p.name.toLowerCase()) && p.cat !== "acc", 4, max), "Iske saath match hone wale 👇");
      } else bot("🎨 <b>Colour matching rules:</b><br>• Black + kuch bhi chalta hai (white, red, olive, blue)<br>• Navy + white/cream = smart<br>• Ek colourful + ek neutral = safe<br>• Full black = attitude, chhote kad pe bhi lamba dikhata hai<br>• Dono loud colours ek saath avoid karo<br>Kisi colour ka naam likho (jaise 'olive ke saath kya') 🙂");
      return;
    }
    // fabric
    if (/fabric|kapda|kapra|material|cotton|fleece|rayon|georgette|satin|organza|polyester|denim|corduroy/.test(t) && !/kapde dikhao/.test(t)) {
      bot("🧵 <b>Kapde ki samajh:</b><br>• Cotton — halka, roz ke liye<br>• Fleece — andar se soft, sardi me garam<br>• Rayon — smooth, garmi me aaram<br>• Georgette/organza — party wali flowy/shiny<br>• Satin — chamakdaar, party<br>• Denim (jeans) — mazboot<br>Har product ka kapda Meesho page pe 'Product details' me likha hota hai — wahi final hai."); return;
    }
    // trending
    if (/trend|trending|viral|latest|naya|new|fashion|in style|famous|popular/.test(t)) {
      bot("🔥 Abhi chal raha hai: oversized/anime hoodies, baggy cargo/wide-leg jeans, full black look; girls me short kurti + jeans aur co-ord sets. Ye site ke ⭐RIXU Picks hain:");
      picks(top4(p => p.rixu && gf(g)(p), 4, max), "Top RIXU Picks 👇"); return;
    }
    // discount — sirf data ka MRP vs price
    if (/discount|offer|sale|\boff\b|coupon|deal|chhoot|chut/.test(t)) {
      const l = ALL.filter(p => p.mrp && p.mrp > p.price && gf(g)(p)).sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp).slice(0, 4);
      bot("Koi alag coupon mere paas nahi hai 🙏 Meesho pe jo MRP dikha tha uske hisab se sabse zyada off wale ye hain (price Meesho pe badal sakta hai):"); picks(l, "Sabse zyada off 👇"); return;
    }
    // quality
    if (/quality|original|accha hai|achha hai|sahi hai|fake|bekar|durable|tikega/.test(t)) { bot("Sach bataun: quality ke liye <b>rating</b> dekho — ⭐4.0+ wale safe hote hain, aur Meesho pe photos wale reviews padh lo. Neeche top rated 👇"); picks(top4(p => gf(g)(p) && rate(p) >= 4.1, 4, max), "High rating picks"); return; }
    // about site
    if (/rixu|ye site|website|kaun ho|who are you|kisne banaya|owner|tum kaun|kya hai ye|about/.test(t)) { bot('RIXU Picks <a href="' + IG + '" target="_blank" rel="noopener">@rixupicks</a> ki chuni hui Meesho kapdon ki list hai 🕷️ Buy Now dabao → Meesho app/site pe order hota hai. Kuch links affiliate hain. Main yahan ka free Outfit Helper hu (asli AI nahi).'); return; }
    // order / delivery / cod / return
    if (/deliver|cod\b|cash on|return|refund|exchange|replace|payment|\bpay\b|upi|shipping|kab aay|kab aaega|kab ayega|track order|order kaise|kaise order|kaise kharid|kaise le|\border\b|kharid/.test(t)) {
      bot(MEESHO_ANS + "<br><b>Order kaise:</b> product pe Buy Now → Meesho khulega → size chuno → Buy/Add to cart → address + payment Meesho pe."); return;
    }
    // ---- purana flow: budget / gender / style ----
    let used = false;
    if (max) { st.budget = max; st.awaitingCustom = false; used = true; }
    if (/\b(boy|boys|ladka|ladke|ladko|men|mens|male|gents|bhai)\b/.test(t)) { st.g = "boys"; used = true; }
    else if (/\b(girl|girls|ladki|ladkiyo|women|womens|female|ladies|didi)\b/.test(t)) { st.g = "girls"; used = true; }
    if (/dark|black|kala|kaala/.test(t)) { st.style = "dark"; used = true; }
    else if (/street|baggy|oversize/.test(t)) { st.style = "street"; used = true; }
    else if (/ethnic|traditional|desi|festive/.test(t)) { st.style = "ethnic"; used = true; }
    else if (/casual|simple|daily/.test(t)) { st.style = "casual"; used = true; }
    if (used) { next(); return; }
    if (st.awaitingCustom) { bot("Number me budget likho na (jaise 650) 🙂"); return; }
    if (/sasta|saste|sasti|cheap|kam price|kam daam|lowest|budget friendly/.test(t)) {
      const l = ALL.filter(p => p.price < 299).sort((a, b) => (isAff(b) - isAff(a)) || (rate(b) - rate(a)) || (a.price - b.price)).slice(0, 6);
      showList(l, "₹299 se kam ke best picks 🔥"); return;
    }
    if (/\bbest\b|sabse accha|top rated|recommend/.test(t)) { picks(top4(p => gf(g)(p), 4, max), "Sabse high rating wale 👇"); return; }
    for (const [re, cat, label] of CAT_WORDS) {
      if (re.test(t)) { const l = cheapestIn(cat); if (l.length) { showList(l, label + " — sabse saste 4 👇"); return; } }
    }
    if (/\b(hi|hii+|hello|hey|namaste|hlo|helo)\b/.test(t)) { bot("Hi! 👋 Budget batao, outfit bana deta hu."); next(); return; }
    if (/outfit|combo|kapde|dress|look|fit\b|kya pehnu|suggest/.test(t)) { next(); return; }
    if (/thank|thanks|shukriya|dhanyawad|thx|tq/.test(t)) { bot("Welcome 🖤 Aur kuch chahiye to batao!"); return; }
    if (/bye|alvida|tata|chalta/.test(t)) { bot("Bye 🕷️ Phir aana — naye picks aate rahenge!"); return; }
    bot('Hmm, ye exact mujhe nahi pata 😅 Par ek style tip: <b>ek colourful + ek neutral</b> (black/white) aur sahi size — look hamesha clean lagega. Ye top picks dekho 👇');
    picks(top4(p => gf(g)(p) && p.rixu, 3), "⭐ RIXU Picks");
    bot('Aur sawaal ho to Insta pe DM karo <a href="' + IG + '" target="_blank" rel="noopener">@rixupicks</a>');
  }
  const byImg = new Map(ALL.map(p => [p.img, p]));
  msgs.addEventListener("click", e => {
    if (!window.RixuCart) return;
    const one = e.target.closest(".rs-cart");
    if (one) { const p = byImg.get(one.dataset.cartId); if (p) window.RixuCart.toggle(p); return; }
    const all = e.target.closest(".rs-allcart");
    if (all) { const ps = all.dataset.all.split("|").map(id => byImg.get(id)).filter(Boolean); window.RixuCart.addMany(ps); all.textContent = "✓ Outfit cart me hai — upar 🛒 se dekho"; }
  });
  form.addEventListener("submit", e => {
    e.preventDefault(); const v = inp.value.trim(); if (!v) return;
    inp.value = ""; me(v); handle(v);
  });

  function open() {
    panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); document.documentElement.classList.add("rs-lock");
    if (!st.started) { st.started = true; bot("Hi! Main Outfit Helper hu 🕷️ Budget batao, main tumhare liye outfit bana dunga. Size, colour, kapda, shaadi/party look — kuch bhi pucho!"); askBudget(); }
  }
  function close() { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); document.documentElement.classList.remove("rs-lock"); }
  document.querySelectorAll("[data-helper]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); open(); }));
  panel.querySelector(".rs-x").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("open")) close(); });
  window.RixuStylist = window.RixuHelper = { open, close, buildCombos };
})();
