/* RIXU cart — sirf is phone/browser me (localStorage). Checkout Meesho pe hota hai, har item ke Buy Now se. */
(function () {
  "use strict";
  if (typeof PRODUCTS === "undefined") return;
  const KEY = "rixu_cart";
  const idOf = p => p.img;
  const byId = new Map(PRODUCTS.map(p => [idOf(p), p]));
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // storage: localStorage na chale (in-app browser / private mode) to memory me chalega
  let store = null;
  try { const s = window.localStorage; const k = "__rixu_t"; s.setItem(k, "1"); s.removeItem(k); store = s; } catch (e) { store = null; }
  let items = [];
  try { if (store) items = JSON.parse(store.getItem(KEY) || "[]"); } catch (e) { items = []; }
  if (!Array.isArray(items)) items = [];
  items = items.filter(id => byId.has(id));
  const save = () => { if (!store) return; try { store.setItem(KEY, JSON.stringify(items)); } catch (e) { store = null; } };
  // apna toast (tap karo → cart khulega)
  const ct = document.createElement("button"); ct.type = "button"; ct.className = "ctoast"; ct.setAttribute("aria-live", "polite");
  let ctT = 0;
  function say(m, withOpen) {
    ct.innerHTML = escH(m) + (withOpen ? ' <u>View Cart</u>' : ""); ct.classList.add("show"); ct.dataset.open = withOpen ? "1" : "";
    clearTimeout(ctT); ctT = setTimeout(() => ct.classList.remove("show"), 2600);
  }

  // ---- top bar cart icon ----
  const row = document.querySelector(".bar .barrow");
  const cbtn = document.createElement("button");
  cbtn.className = "iconbtn tb cartbtn"; cbtn.type = "button"; cbtn.setAttribute("aria-label", "Cart");
  cbtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1"/><circle cx="9.5" cy="19.3" r="1.3"/><circle cx="17" cy="19.3" r="1.3"/></svg><span class="cdot" hidden>0</span>';
  if (row) row.appendChild(cbtn);
  const dot = cbtn.querySelector(".cdot");

  // ---- sheet ----
  const scrim = document.createElement("div"); scrim.className = "cscrim";
  const sheet = document.createElement("section"); sheet.className = "csheet"; sheet.setAttribute("aria-hidden", "true"); sheet.setAttribute("aria-label", "Cart");
  sheet.innerHTML = '<div class="chead"><b>🛒 Cart <span class="ccnt"></span></b><button class="cx" type="button" aria-label="Close">✕</button></div>' +
    '<div class="clist"></div><div class="cfoot"><div class="ctotal"></div>' +
    '<p class="cnote">Orders are placed on Meesho — tap Buy Now on each item.</p></div>';
  document.body.appendChild(ct); ct.addEventListener("click", () => { ct.classList.remove("show"); if (ct.dataset.open) open(); });
  document.body.appendChild(scrim); document.body.appendChild(sheet);
  const list = sheet.querySelector(".clist"), totalEl = sheet.querySelector(".ctotal"), cnt = sheet.querySelector(".ccnt");

  function render() {
    const ps = items.map(id => byId.get(id)).filter(Boolean);
    dot.hidden = !ps.length; dot.textContent = ps.length;
    cnt.textContent = ps.length ? "(" + ps.length + ")" : "";
    if (!ps.length) {
      list.innerHTML = '<p class="cempty">Your cart is empty 🕸️<br><small>Tap "Add to Cart" on any product.</small></p>';
      totalEl.innerHTML = "";
    } else {
      list.innerHTML = ps.map(p => '<div class="citem" data-id="' + escH(idOf(p)) + '"><img src="' + escH(p.img) + '" alt="" loading="lazy"><div class="cinfo"><div class="cname">' + escH(p.name) + '</div><div class="cprice">' + money(p.price) + '</div></div>' +
        '<a class="cbuy" href="' + escH(p.link) + '" target="_blank" rel="noopener sponsored">Buy Now</a><button class="crm" type="button" aria-label="Remove from cart">Remove</button></div>').join("");
      totalEl.innerHTML = '<span>Total (' + ps.length + ' item' + (ps.length > 1 ? "s" : "") + ')</span><b>' + money(ps.reduce((a, p) => a + p.price, 0)) + "</b>";
    }
    document.querySelectorAll(".card").forEach(c => {
      const b = c.querySelector(".addcart"); if (!b) return;
      const on = items.includes(c.dataset.id);
      b.classList.toggle("on", on); b.textContent = on ? "✓ Added to Cart" : "+ Add to Cart"; b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.querySelectorAll("[data-cart-id]").forEach(b => {
      const on = items.includes(b.dataset.cartId);
      b.classList.toggle("on", on); b.textContent = on ? "✓ Cart" : "+ Cart";
    });
  }
  function add(p, quiet) { const id = idOf(p); if (!byId.has(id)) return false; if (!items.includes(id)) { items.push(id); save(); render(); if (!quiet) say("Added to Cart ✓", true); return true; } return false; }
  function remove(id, quiet) { items = items.filter(x => x !== id); save(); render(); if (!quiet) say("Removed from Cart"); }
  function toggle(p) { const id = idOf(p); if (items.includes(id)) remove(id); else add(p); }
  function addMany(ps) { let n = 0; ps.forEach(p => { if (add(p, true)) n++; }); say(n ? n + " item" + (n > 1 ? "s" : "") + " added to Cart ✓" : "Already in your Cart", true); render(); }
  function open() { render(); sheet.classList.add("open"); scrim.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); document.documentElement.classList.add("c-lock"); }
  function close() { sheet.classList.remove("open"); scrim.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); document.documentElement.classList.remove("c-lock"); }
  cbtn.addEventListener("click", open);
  scrim.addEventListener("click", close);
  sheet.querySelector(".cx").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheet.classList.contains("open")) close(); });
  list.addEventListener("click", e => { const b = e.target.closest(".crm"); if (b) remove(b.closest(".citem").dataset.id); });

  // ---- Add to Cart on every product card ----
  document.querySelectorAll(".card").forEach(c => {
    const p = byId.get(c.dataset.id); const buy = c.querySelector(".info .buy");
    if (!p || !buy) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "addcart"; b.textContent = "+ Add to Cart";
    b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(p); });
    buy.insertAdjacentElement("afterend", b);
  });
  render();
  window.RixuCart = { add, addMany, remove, toggle, open, close, has: p => items.includes(idOf(p)), count: () => items.length, refresh: render, idOf };
})();
