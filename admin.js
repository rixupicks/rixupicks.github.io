/* RIXU Picks — owner panel. No backend, no login: every action builds a WhatsApp message to Tab (wa.me),
   and Tab applies it to the site. Stats are computed from products.js (the same list the site uses). */
(function () {
  "use strict";
  var WA = "12512765320", AFF = "239146129";
  var CATS = { trend: "🔥 Trending", gadgets: "Gadgets", korean: "Korean Finds", gifts: "Gifts", decor: "Room Decor", wint: "Winter Collection ❄️", tees: "T-Shirts", shirts: "Shirts", hoodies: "Hoodies & Sweatshirts", jackets: "Jackets", winter: "High Necks & Sweaters", jeans: "Jeans", cargo: "Cargo & Joggers", shorts: "Shorts", track: "Track Pants / Lowers", shoes: "Shoes & Slippers", kurta: "Kurtas", acc: "Caps & Accessories", girls: "Girls' Picks", kurti: "Kurtis", wtops: "Women's Tops", ksets: "Kurta Sets & Co-ords", saree: "Sarees" };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var P = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  var idOf = function (p) { return p.img.replace(/^img\//, "").replace(/\.\w+$/, ""); };
  var codeOf = function (p) { var l = p.link || "", m = /external_product_id=([a-z0-9]+)/i.exec(l) || /%2Fp%2F([a-z0-9]+)/i.exec(l) || /\/p\/([a-z0-9]+)/i.exec(l); return m ? m[1] : ""; };
  var linkState = function (p) { if (!p.link) return "no"; return p.link.indexOf(AFF) >= 0 ? "aff" : "raw"; };
  var inCatA = function (p, c) { return p.cat === c || (p.also || []).indexOf(c) >= 0; };
  var waLink = function (msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); };
  var rs = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };

  /* ---------- stats ---------- */
  var catKeys = Object.keys(CATS).filter(function (c) { return P.some(function (p) { return inCatA(p, c); }); });
  var aff = P.filter(function (p) { return linkState(p) === "aff"; }).length;
  var withLink = P.filter(function (p) { return !!p.link; }).length;
  var picks = P.filter(function (p) { return p.rixu; }).length;
  var stats = [[P.length, "products on site"], [catKeys.length, "categories"], [aff, "carry your affiliate ID (" + AFF + ")"], [withLink - aff, "Meesho link without affiliate ID"], [P.length - withLink, "without any link"], [picks, "⭐ RIXU Pick badge"]];
  $("#stats").innerHTML = stats.map(function (s) { return '<div class="st"><b>' + s[0] + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("");
  $("#catchips").innerHTML = catKeys.map(function (c) { return '<button type="button" data-c="' + c + '">' + esc(CATS[c]) + "<b>" + P.filter(function (p) { return inCatA(p, c); }).length + "</b></button>"; }).join("");

  var opts = Object.keys(CATS).map(function (c) { return '<option value="' + c + '">' + esc(CATS[c]) + "</option>"; }).join("");
  $("#a-cat").innerHTML = opts; $("#e-cat").innerHTML = opts; $("#fcat").innerHTML += opts;

  /* ---------- add form ---------- */
  var addMsg = function () {
    var link = $("#a-link").value.trim(), name = $("#a-name").value.trim(), price = $("#a-price").value.trim(), c = $("#a-cat").value, notes = $("#a-notes").value.trim();
    var hint = "";
    if (!link) hint = "Meesho link daalo."; else if (!/meesho/i.test(link)) hint = "Ye Meesho link nahi lag raha — check kar lo.";
    else if (!name) hint = "Product ka naam likho."; else if (!(+price > 0)) hint = "Price likho (sirf number).";
    var dupe = link && P.filter(function (p) { var cd = codeOf(p); return cd && link.indexOf(cd) >= 0; })[0];
    if (dupe) hint = "Dhyaan do: ye product shayad pehle se site pe hai (" + idOf(dupe) + " · " + dupe.name + ").";
    var msg = "RIXU ADMIN: ADD\nName: " + (name || "…") + "\nPrice: " + (+price > 0 ? rs(price) : "…") + "\nCategory: " + c + " (" + CATS[c] + ")\nLink: " + (link || "…") + (notes ? "\nNotes: " + notes : "");
    $("#a-hint").textContent = hint; $("#a-pv").textContent = msg;
    var ok = link && name && +price > 0; var a = $("#a-wa");
    a.href = waLink(msg); a.classList.toggle("off", !ok); a.setAttribute("aria-disabled", ok ? "false" : "true");
  };
  ["#a-link", "#a-name", "#a-price", "#a-cat", "#a-notes"].forEach(function (s) { $(s).addEventListener("input", addMsg); $(s).addEventListener("change", addMsg); });
  addMsg();

  /* ---------- product list ---------- */
  var list = $("#list");
  list.innerHTML = P.map(function (p, i) {
    var st = linkState(p), lbl = st === "aff" ? "✅ Affiliate link" : st === "raw" ? "🔗 Link (no aff ID)" : "❌ No link";
    var cats = [p.cat].concat(p.also || []).map(function (c) { return CATS[c] || c; }).join(", ");
    return '<li class="it" data-i="' + i + '" data-s="' + esc((p.name + " " + idOf(p) + " " + codeOf(p) + " " + p.cat + " " + (p.also || []).join(" ")).toLowerCase()) + '" data-c="' + esc([p.cat].concat(p.also || []).join(" ")) + '">' +
      '<img src="' + esc(p.img) + '" alt="" loading="lazy" width="56" height="70"><div><h3>' + esc(p.name) + "</h3>" +
      '<p class="meta"><b>' + rs(p.price) + "</b><span>" + esc(cats) + '</span><span class="lk ' + st + '">' + lbl + "</span><span>id " + idOf(p) + (codeOf(p) ? " · Meesho " + codeOf(p) : "") + "</span></p>" +
      '<div class="acts"><button type="button" data-act="edit">✏️ Edit request</button><button type="button" class="rm" data-act="remove">🗑️ Remove request</button></div></div></li>';
  }).join("");
  var items = [].slice.call(list.children);
  var filt = function () {
    var q = $("#q").value.trim().toLowerCase(), c = $("#fcat").value, n = 0;
    items.forEach(function (li) { var ok = (!q || li.dataset.s.indexOf(q) >= 0) && (!c || li.dataset.c.split(" ").indexOf(c) >= 0); li.hidden = !ok; if (ok) n++; });
    $("#ls-n").textContent = "(" + n + " of " + P.length + ")";
  };
  $("#q").addEventListener("input", filt); $("#fcat").addEventListener("change", filt); filt();
  $("#catchips").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (!b) return; $("#fcat").value = b.dataset.c; filt(); $("#ls-h").scrollIntoView({ behavior: "smooth" }); });

  /* ---------- edit / remove dialog ---------- */
  var dlg = $("#dlg"), cur = null, mode = "edit";
  var dMsg = function () {
    if (!cur) return;
    var p = cur, head = idOf(p) + " (" + p.name + (codeOf(p) ? ", Meesho " + codeOf(p) : "") + ")", notes = $("#e-notes").value.trim(), msg;
    if (mode === "remove") msg = "RIXU ADMIN: REMOVE id " + head + (notes ? "\nReason: " + notes : "");
    else {
      var ch = [], nm = $("#e-name").value.trim(), pr = $("#e-price").value.trim(), c = $("#e-cat").value, lk = $("#e-link").value.trim();
      if (nm && nm !== p.name) ch.push("Name: " + p.name + " → " + nm);
      if (+pr > 0 && +pr !== p.price) ch.push("Price: " + rs(p.price) + " → " + rs(pr));
      if (c && c !== p.cat) ch.push("Category: " + p.cat + " → " + c + " (" + CATS[c] + ")");
      if (lk) ch.push("Link → " + lk);
      if (notes) ch.push("Notes: " + notes);
      msg = "RIXU ADMIN: EDIT id " + head + "\n" + (ch.length ? ch.join("\n") : "(kya badalna hai, upar likho)");
    }
    $("#e-pv").textContent = msg; $("#e-wa").href = waLink(msg);
  };
  var open = function (i, m) {
    cur = P[i]; mode = m;
    $("#dlg-t").textContent = (m === "remove" ? "🗑️ Remove request: " : "✏️ Edit request: ") + cur.name + " (" + rs(cur.price) + ")";
    $("#dlg-edit").hidden = m === "remove";
    $("#e-name").value = cur.name; $("#e-price").value = cur.price; $("#e-cat").value = cur.cat; $("#e-link").value = ""; $("#e-notes").value = "";
    $("#e-notes").placeholder = m === "remove" ? "optional: kyu hatana hai" : "optional: kuch aur badalna ho toh";
    dMsg(); dlg.hidden = false; $("#dlg-x").focus();
  };
  var close = function () { dlg.hidden = true; cur = null; };
  list.addEventListener("click", function (e) { var b = e.target.closest("[data-act]"); if (!b) return; open(+b.closest(".it").dataset.i, b.dataset.act); });
  ["#e-name", "#e-price", "#e-cat", "#e-link", "#e-notes"].forEach(function (s) { $(s).addEventListener("input", dMsg); $(s).addEventListener("change", dMsg); });
  $("#dlg-x").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !dlg.hidden) close(); });
})();
