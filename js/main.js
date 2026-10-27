/* Loodos Street arayüzü: üst bar, KPI kartları, detay paneli, ürün yolculuğu ve canlı akış.
   Sahne js/scene.js'te; veri js/data.js (window.STREET). */
import { createStreet, esc, initials } from "./scene.js";

const D = window.STREET;
const $ = s => document.querySelector(s);
const app = $("#app");
const bySector = id => D.sectors.find(s => s.id === id);
const byCompany = id => D.companies.find(c => c.id === id);
const productById = id => D.products.find(p => p.id === id);
const STAGES = ["Yönetişim", "Edinim", "Etkileşim", "Aktivasyon", "Ticaret", "İçgörü", "Güven", "Karar"];
const RAW_LOGO = new Set(["vodafone"]);
const usersOf = pid => D.companies.filter(c => c.projects.some(p => p.prods.some(x => x.id === pid))).map(c => c.id);
const productsOf = c => [...new Set(c.projects.flatMap(p => p.prods.map(x => x.id)))];
const driveUrl = id => `https://drive.google.com/file/d/${id}/view`;
// Paylaşılabilir adres: #a101, #mahalle/ret, #merkez
const setHash = h => history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);

const ICON = {
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  store: '<svg viewBox="0 0 24 24"><path d="M3 9 4.5 4h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  truck: '<svg viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg>',
  ext: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
};

// Sahne kurulamazsa (WebGL yok, GPU kara listede) arayüz bu boş sahneyle liste görünümünde çalışır.
const NO_STREET = { select() {}, highlight() {}, focusSector() {}, home() {}, zoomBy() {}, rotateBy() {}, intro() {}, vehicleInfo: () => null };
let street = NO_STREET;
let ctx = { kind: "all" };        // KPI ve panel bağlamı
let activeProduct = null;
let vehicleTimer = null;
const feed = [];

/* ---------- KPI kartları ---------- */
function kpi(icon, label, value, extra = "") {
  return `<div class="kpi"><span class="kpi-ico">${ICON[icon]}</span><div><small>${esc(label)}</small><b>${esc(value)}</b>${extra ? `<em>${esc(extra)}</em>` : ""}</div></div>`;
}
function renderKpis() {
  const el = $("#kpis");
  const k = D.kpis;
  // Aynı bağlamda yeniden çizimde (canlı araç verisi) giriş animasyonu tekrar oynamasın
  const key = ctx.kind + ":" + (ctx.id || "");
  queueMicrotask(() => { if (el.dataset.k === key) el.querySelectorAll(".kpi").forEach(c => { c.style.animation = "none"; }); el.dataset.k = key; });
  if (ctx.kind === "company") {
    const c = byCompany(ctx.id);
    const ms = c.projects.flatMap(p => p.metrics);
    const cards = ms.slice(0, 3).map((m, i) => kpi(["users", "chart", "shield"][i], m[1], m[0]));
    if (cards.length < 3) cards.push(kpi("box", "Bu dükkândaki proje", String(c.projects.length)));
    if (cards.length < 3) cards.push(kpi("spark", "Kullanılan teknoloji", String(new Set(c.projects.flatMap(p => p.tech)).size)));
    el.innerHTML = cards.join("");
  } else if (ctx.kind === "sector") {
    const s = bySector(ctx.id), cs = D.companies.filter(c => c.sector === s.id);
    const projects = cs.reduce((n, c) => n + c.projects.length, 0);
    const top = cs.flatMap(c => c.projects.flatMap(p => p.metrics.map(m => [m[0], `${c.name} · ${m[1]}`])))[0];
    el.innerHTML = kpi("store", `${s.name} · dükkân`, String(cs.length)) + kpi("box", "Proje", String(projects))
      + (top ? kpi("chart", top[1], top[0]) : "");
  } else if (ctx.kind === "vehicle") {
    const v = street.vehicleInfo(ctx.id);
    el.innerHTML = v ? kpi("truck", "Araç", v.id) + kpi("clock", "Varış", v.etaSec == null ? "—" : v.etaSec ? `${v.etaSec} sn` : "Şimdi")
      + kpi("chart", "Hız", `${v.speedKmh} km/s`) : "";
  } else {
    el.innerHTML = kpi("users", k[0][1], k[0][0], "↑ canlı") + kpi("box", k[1][1], k[1][0]) + kpi("shield", k[5][1], k[5][0]);
  }
}

/* ---------- Mahalle seçici ---------- */
const total = D.companies.reduce((n, c) => n + c.projects.length, 0);
function setDistrictButton(id) {
  const s = id && bySector(id);
  const chip = $("#districtChip");
  chip.style.setProperty("--c", s ? s.color : "#0a0a0a");
  chip.textContent = s ? s.id.toUpperCase().slice(0, 3) : "ALL";
  $("#districtName").textContent = s ? s.name : "Sokak genel görünüm";
  const cs = s ? D.companies.filter(c => c.sector === s.id) : D.companies;
  $("#districtSub").textContent = `${cs.length} dükkân · ${cs.reduce((n, c) => n + c.projects.length, 0)} proje`;
}
function renderDistrictMenu() {
  const cur = ctx.kind === "sector" ? ctx.id : null;
  const rows = [`<button data-sector="" class="${cur ? "" : "on"}"><span class="chip-sq" style="--c:#0a0a0a">ALL</span><b>Sokak genel görünüm</b><span class="pct">${D.companies.length}</span><small>${D.sectors.length} mahalle · ${total} proje</small></button>`];
  for (const s of D.sectors) {
    const cs = D.companies.filter(c => c.sector === s.id);
    const n = cs.reduce((a, c) => a + c.projects.length, 0);
    rows.push(`<button data-sector="${s.id}" class="${cur === s.id ? "on" : ""}" style="--c:${s.color}">
      <span class="chip-sq">${s.id.toUpperCase().slice(0, 3)}</span><b>${esc(s.name)}</b><span class="pct">%${Math.round(n / total * 100)}</span>
      <small>${cs.map(c => esc(c.name)).join(", ")}</small><span class="bar"><i style="width:${Math.max(6, n / total * 100 * 2.6)}%"></i></span></button>`);
  }
  $("#districtMenu").innerHTML = rows.join("");
}
function toggleMenu(menu, btn, open) {
  const show = open ?? menu.hidden;
  closeMenus();
  menu.hidden = !show;
  btn?.setAttribute("aria-expanded", String(show));
}
function closeMenus() {
  for (const m of ["#districtMenu", "#feed", "#results"]) $(m).hidden = true;
  $("#districtBtn").setAttribute("aria-expanded", "false");
  $("#bell").setAttribute("aria-expanded", "false");
}

/* ---------- Panel ---------- */
const panel = $("#panel");
function openPanel(html) {
  panel.innerHTML = html;
  panel.hidden = false;
  panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "";
  app.classList.add("has-panel");
}
function closePanel() {
  setHash("");
  panel.hidden = true;
  app.classList.remove("has-panel");
  clearInterval(vehicleTimer);
}
function logoBox(c, s) {
  return c.logo
    ? `<span class="p-logo"><img src="${c.logo}" alt="${esc(c.name)} logosu" style="${RAW_LOGO.has(c.id) ? "" : "filter:brightness(0)"}"></span>`
    : `<span class="p-logo txt" style="--c:${s.color}">${esc(initials(c.name))}</span>`;
}
function head(logo, kicker, title, sub) {
  return `<div class="p-head">${logo}<div class="p-title"><div class="p-kicker">${kicker}</div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
    <div class="p-actions"><button class="icon-btn" data-action="refocus" aria-label="Haritada göster">${ICON.target}</button><button class="icon-btn" data-action="close" aria-label="Kapat">${ICON.close}</button></div></div>`;
}

function showCompany(id, tab = 0) {
  const c = byCompany(id), s = bySector(c.sector);
  ctx = { kind: "company", id };
  const p = c.projects[tab];
  setHash(id);
  const status = p.when ? `<span class="pill ${/devam/i.test(p.when) ? "warn" : "ok"}">${esc(p.when)}</span>` : `<span class="pill ok">Canlıda</span>`;
  const tabs = c.projects.length > 1
    ? `<div class="tabs" role="tablist">${c.projects.map((x, i) => `<button role="tab" data-tab="${i}" class="${i === tab ? "on" : ""}" aria-selected="${i === tab}">${esc(x.app || c.name)}</button>`).join("")}</div>` : "";
  const prods = p.prods.length
    ? p.prods.map(x => { const pr = productById(x.id); return `<div class="prod"><div class="prod-h"><span class="mono">${esc(pr.mono)}</span>${esc(pr.name)} ile ne yaptık</div>
        <ul>${x.built.map(b => `<li>${esc(b)}</li>`).join("")}</ul>${x.mods.length ? `<div class="tech">${x.mods.map(m => `<span>${esc(m)}</span>`).join("")}</div>` : ""}</div>`; }).join("")
    : `<p class="custom">Bu proje hazır bir Loodos ürünü kullanmadan, müşteriye özel geliştirildi.</p>`;
  openPanel(`${head(logoBox(c, s), `<span style="color:${s.color}">●</span> ${esc(s.name)}`, esc(c.name) + (p.app ? ` <span style="color:var(--muted);font-weight:500">${esc(p.app)}</span>` : ""), esc(p.sub || ""))}
    <div class="p-body">
      <div class="pills">${status}<span class="pill" style="--c:${s.color}"><i></i>${esc(s.name)}</span>${p.prods.map(x => `<span class="pill vio">${esc(productById(x.id).name)}</span>`).join("")}</div>
      ${tabs}
      ${p.d ? `<p class="lead">${esc(p.d)}</p>` : ""}
      ${p.img ? `<figure class="shot"><img src="${p.img}" alt="${esc(c.name)} ${esc(p.app)} ekranları" loading="lazy" onerror="this.parentNode.remove()"></figure>` : ""}
      ${p.metrics.length ? `<div class="metrics">${p.metrics.map(m => `<div class="metric"><b>${esc(m[0])}</b><small>${esc(m[1])}</small></div>`).join("")}</div>` : ""}
      ${p.ctx ? `<div class="sec"><h3>Bağlam</h3><p>${esc(p.ctx)}</p></div>` : ""}
      ${p.need ? `<div class="sec"><h3>İhtiyaç</h3><p>${esc(p.need)}</p></div>` : ""}
      ${p.approach ? `<div class="sec"><h3>Yaklaşım</h3><p>${esc(p.approach)}</p></div>` : ""}
      ${p.features.length ? `<div class="sec"><h3>Neler yaptık</h3><ul class="feat">${p.features.map(f => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join("")}</ul></div>` : ""}
      <div class="sec"><h3>Loodos ürünleri</h3>${prods}</div>
      ${p.tech.length ? `<div class="sec"><h3>Teknolojiler</h3><div class="tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join("")}</div></div>` : ""}
      ${p.pdf ? `<a class="cta" href="${driveUrl(p.pdf)}" target="_blank" rel="noopener">Vaka çalışması PDF ${ICON.ext}</a>` : ""}
    </div>`);
  panel.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showCompany(id, +b.dataset.tab)));
  setJourneyFor(c);
  renderKpis();
}

function showVehicle(id) {
  ctx = { kind: "vehicle", id };
  setJourneyFor(null);
  const draw = () => {
    const v = street.vehicleInfo(id);
    if (!v) return closePanel();
    const st = v.state === "unloading" ? `<span class="pill warn">Boşaltıyor · ${v.unloadLeft} sn</span>`
      : v.dest ? `<span class="pill ok">Yolda</span>` : `<span class="pill">Depoya dönüyor</span>`;
    const body = v.delivers ? `
      <div class="prog"><div class="prog-top"><span>${v.dest ? esc(v.dest.name) : "Teslimat yok"}</span><span>%${Math.round(Math.min(1, Math.max(0, v.progress)) * 100)}</span></div><div class="bar"><i style="width:${Math.min(1, Math.max(0, v.progress)) * 100}%"></i></div></div>
      <dl class="rows">
        <div><dt>Gönderi</dt><dd>${esc(v.ship || "—")}</dd></div>
        <div><dt>Alıcı</dt><dd>${v.dest ? esc(v.dest.name) : "—"}</dd></div>
        <div><dt>Mahalle</dt><dd>${v.sector ? esc(v.sector.name) : "—"}</dd></div>
        <div><dt>Varış</dt><dd>${v.etaSec == null ? "—" : v.etaSec ? `${v.etaSec} sn` : "Teslim ediliyor"}</dd></div>
        <div><dt>Hız</dt><dd>${v.speedKmh} km/s</dd></div>
        <div><dt>Kargo</dt><dd>${esc(v.cargo || "—")}</dd></div>
      </dl>
      ${v.dest ? `<button class="cta" data-goto="${v.dest.id}">Alıcı dükkânı aç</button>` : ""}`
      : `<dl class="rows"><div><dt>Tür</dt><dd>${esc(v.type)}</dd></div><div><dt>Hız</dt><dd>${v.speedKmh} km/s</dd></div></dl>
         <p class="custom" style="margin-top:14px">Sokağın sakinlerinden biri; teslimat taşımıyor.</p>`;
    const html = `${head(`<span class="p-logo txt" style="--c:var(--teal)">${ICON.truck.replace("<svg", '<svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2"')}</span>`,
      `Loodos Lojistik · ${esc(v.type)}`, esc(v.id), v.dest ? `${esc(v.dest.name)} teslimatı` : "")}<div class="p-body"><div class="pills">${st}<span class="pill"><i></i>Canlı takip</span></div>${body}</div>`;
    if (panel.hidden || panel.dataset.v !== id) { openPanel(html); panel.dataset.v = id; setHash(""); }
    else panel.innerHTML = html;
    panel.querySelector("[data-goto]")?.addEventListener("click", e => { street.select("company", e.currentTarget.dataset.goto); showCompany(e.currentTarget.dataset.goto); });
    renderKpis();
  };
  clearInterval(vehicleTimer);
  panel.dataset.v = "";
  draw();
  vehicleTimer = setInterval(() => { if (ctx.kind === "vehicle" && ctx.id === id) draw(); else clearInterval(vehicleTimer); }, 400);
}

function showHQ() {
  ctx = { kind: "all" };
  setJourneyFor(null);
  setHash("merkez");
  openPanel(`${head('<span class="p-logo txt" style="--c:#0a0a0a">L</span>', "Loodos Merkez · İstanbul", "Loodos", "Pioneering Technology, Perfecting the Art of Experience")}
    <div class="p-body">
      <div class="metrics">${D.kpis.map(k => `<div class="metric"><b>${esc(k[0])}</b><small>${esc(k[1])}</small></div>`).join("")}</div>
      <div class="sec"><h3>Yol haritası</h3><ul class="tl">${D.timeline.map(t => `<li><b>${esc(t[0])}</b>${esc(t[1])}</li>`).join("")}</ul></div>
      <div class="sec"><h3>Ürünler</h3><div class="prod-list">${D.products.map(p => `<button data-prod="${p.id}"><span class="mono">${esc(p.mono)}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></span></button>`).join("")}</div></div>
      <div class="sec"><h3>Sokakta</h3><p>${D.companies.length} dükkân, ${total} proje, ${D.sectors.length} mahalle. Bir dükkâna dokun, projenin hikâyesini aç.</p></div>
    </div>`);
  panel.querySelectorAll("[data-prod]").forEach(b => b.addEventListener("click", () => toggleProduct(b.dataset.prod)));
  renderKpis();
}

function showSector(id) {
  const s = bySector(id), cs = D.companies.filter(c => c.sector === id);
  ctx = { kind: "sector", id };
  setJourneyFor(null);
  setDistrictButton(id);
  setHash("mahalle/" + id);
  openPanel(`${head(`<span class="p-logo txt" style="--c:${s.color}">${s.id.toUpperCase().slice(0, 3)}</span>`, "Mahalle", esc(s.name), `${cs.length} dükkân`)}
    <div class="p-body"><p class="lead">${esc(s.intro)}</p>
      <div class="sec"><h3>Dükkânlar</h3><div class="prod-list">${cs.map(c => `<button data-goto="${c.id}">${logoBox(c, s)}<span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span></button>`).join("")}</div></div>
    </div>`);
  panel.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => openCompany(b.dataset.goto)));
  panel.querySelectorAll(".prod-list .p-logo").forEach(l => { l.style.width = "40px"; l.style.height = "40px"; l.style.borderRadius = "11px"; });
  renderKpis();
}

/* ---------- Ürün yolculuğu ---------- */
function renderJourney() {
  const cols = STAGES.map((name, i) => {
    const ps = D.products.filter(p => p.stage === i);
    return `<li class="stage-col" data-stage="${i}"><span class="stage-dot">${i}</span><span class="stage-name">${name}</span>
      <span class="stage-prods">${ps.map(p => `<button class="pchip" data-prod="${p.id}" title="${esc(p.cat)}"><span class="mono">${esc(p.mono)}</span>${esc(p.name)}<sup>${usersOf(p.id).length || ""}</sup></button>`).join("")}</span></li>`;
  });
  $("#journey").innerHTML = cols.join("");
  $("#journey").querySelectorAll(".pchip").forEach(b => b.addEventListener("click", () => toggleProduct(b.dataset.prod)));
}
function setJourneyFor(c) {
  const used = c ? productsOf(c) : [];
  const j = $(".journey");
  j.classList.toggle("focus", !!c || !!activeProduct);
  j.querySelectorAll(".pchip").forEach(b => { b.classList.toggle("used", used.includes(b.dataset.prod)); b.classList.toggle("on", b.dataset.prod === activeProduct); });
  j.querySelectorAll(".stage-col").forEach(col => {
    const ids = [...col.querySelectorAll(".pchip")].map(b => b.dataset.prod);
    col.classList.toggle("lit", ids.some(id => used.includes(id) || id === activeProduct));
  });
  $("#journeySub").textContent = c
    ? (used.length ? `${c.name}: ${used.map(id => productById(id).name).join(", ")}` : `${c.name}: müşteriye özel geliştirme`)
    : activeProduct ? `${productById(activeProduct).name}: ${productById(activeProduct).promise}`
      : "Bir ürüne dokun, onu kullanan dükkânlar parlasın.";
}
function toggleProduct(pid) {
  activeProduct = activeProduct === pid ? null : pid;
  if (!activeProduct) { street.highlight(null); setJourneyFor(null); return; }
  const ids = usersOf(pid);
  street.select(null);
  street.highlight(ids.length ? ids : []);
  closePanel();
  ctx = { kind: "all" };
  renderKpis();
  setJourneyFor(null);
  if (!ids.length) $("#journeySub").textContent = `${productById(pid).name}: sokakta henüz bu ürünle açılmış bir dükkân yok. ${productById(pid).promise}`;
}

/* ---------- Arama ---------- */
const norm = s => (s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
let resultItems = [], resultIdx = 0;
function search(q) {
  const box = $("#results");
  const n = norm(q.trim());
  if (!n) { box.hidden = true; return; }
  const cs = D.companies.filter(c => norm(c.name).includes(n) || c.projects.some(p => norm([p.app, p.sub, p.d, p.tech.join(" ")].join(" ")).includes(n)));
  const ps = D.products.filter(p => norm(p.name + " " + p.cat).includes(n));
  const ss = D.sectors.filter(s => norm(s.name).includes(n));
  resultItems = [...cs.map(c => ({ kind: "company", id: c.id })), ...ps.map(p => ({ kind: "product", id: p.id })), ...ss.map(s => ({ kind: "sector", id: s.id }))];
  resultIdx = 0;
  let i = 0;
  const btn = (item, html) => `<button role="option" data-i="${i}" class="${i++ === 0 ? "on" : ""}">${html}</button>`;
  let html = "";
  if (cs.length) html += `<div class="grp">Dükkânlar</div>` + cs.map(c => { const s = bySector(c.sector); return btn(c, `<span class="chip-sq" style="--c:${s.color};width:26px;height:26px;border-radius:8px;font-size:9px">${esc(initials(c.name))}</span><span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span>`); }).join("");
  if (ps.length) html += `<div class="grp">Ürünler</div>` + ps.map(p => btn(p, `<span class="mono">${esc(p.mono)}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></span>`)).join("");
  if (ss.length) html += `<div class="grp">Mahalleler</div>` + ss.map(s => btn(s, `<span class="chip-sq" style="--c:${s.color};width:26px;height:26px;border-radius:8px;font-size:9px">${s.id.toUpperCase().slice(0, 3)}</span><b>${esc(s.name)}</b>`)).join("");
  box.innerHTML = html || `<div class="empty">“${esc(q)}” için sonuç yok.</div>`;
  box.hidden = false;
  box.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => chooseResult(+b.dataset.i)));
}
function chooseResult(i) {
  const r = resultItems[i];
  if (!r) return;
  $("#q").value = "";
  $("#q").blur();
  closeMenus();
  if (r.kind === "company") openCompany(r.id);
  else if (r.kind === "product") toggleProduct(r.id);
  else focusSector(r.id);
}

/* ---------- Geçişler ---------- */
function openCompany(id) {
  activeProduct = null;
  street.highlight(null);
  street.select("company", id);
  showCompany(id);
  setDistrictButton(byCompany(id).sector);
}
function focusSector(id) {
  activeProduct = null;
  street.select(null);
  street.highlight(null);
  if (!id) { ctx = { kind: "all" }; setDistrictButton(null); closePanel(); setJourneyFor(null); street.home(); renderKpis(); return; }
  street.focusSector(id);
  showSector(id);
}
function goHome() {
  activeProduct = null;
  street.select(null);
  street.highlight(null);
  closePanel();
  ctx = { kind: "all" };
  setDistrictButton(null);
  setJourneyFor(null);
  renderKpis();
  street.home();
}

/* ---------- Canlı akış ---------- */
function pushEvent(ev) {
  feed.unshift(ev);
  feed.length = Math.min(feed.length, 30);
  $("#bellDot").hidden = !$("#feed").hidden;
  if (!$("#feed").hidden) renderFeed();
}
function renderFeed() {
  const t = d => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("#feed").innerHTML = `<h4>Canlı akış</h4>` + (feed.length
    ? feed.map((e, i) => `<button data-ev="${i}"><span class="ev-ico">${ICON.truck.replace("<svg", '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"')}</span><span>${esc(e.text)}<small>${esc(e.sub)} · ${t(e.at)}</small></span></button>`).join("")
    : `<p class="empty">Henüz teslimat yok; kamyonlar yolda.</p>`);
  $("#feed").querySelectorAll("[data-ev]").forEach(b => b.addEventListener("click", () => { closeMenus(); openCompany(feed[+b.dataset.ev].company); }));
}

/* ---------- Liste görünümü (WebGL yoksa) ---------- */
function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
function renderFallback(reason) {
  app.classList.add("flat");
  $("#stage").innerHTML = `<div class="fallback"><p class="fb-note">${esc(reason)} Dükkânları liste olarak gösteriyoruz.</p>${D.sectors.map(s => {
    const cs = D.companies.filter(c => c.sector === s.id);
    return `<section><h3 style="--c:${s.color}"><i></i>${esc(s.name)}</h3><div class="fb-grid">${cs.map(c => `<button data-goto="${c.id}">${logoBox(c, s)}<span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span></button>`).join("")}</div></section>`;
  }).join("")}</div>`;
  $("#stage").querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => openCompany(b.dataset.goto)));
}

/* ---------- Başlat ---------- */
addEventListener("unhandledrejection", e => { console.error(e.reason); e.preventDefault(); });

async function boot() {
  renderJourney();
  setDistrictButton(null);
  renderDistrictMenu();
  renderKpis();
  wireUi();

  if (!hasWebGL()) { renderFallback("Bu tarayıcıda 3D (WebGL) kapalı."); return finishBoot(false); }
  try {
    street = await createStreet({
      el: $("#stage"),
      data: D,
      onSelect(sel) {
        closeMenus();
        if (!sel) return;
        activeProduct = null;
        street.highlight(null);
        if (sel.kind === "company") { showCompany(sel.id); setDistrictButton(byCompany(sel.id).sector); }
        else if (sel.kind === "vehicle") showVehicle(sel.id);
        else if (sel.kind === "hq") showHQ();
        else if (sel.kind === "sector") showSector(sel.id);
      },
      onEvent: pushEvent,
    });
  } catch (err) {
    console.error(err);
    street = NO_STREET;
    renderFallback("3D sahne bu cihazda açılamadı.");
    return finishBoot(false);
  }
  finishBoot(true);
}

function wireUi() {
  const tickClock = () => { $("#clock").textContent = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); };
  tickClock();
  setInterval(tickClock, 10000);

  $("#districtBtn").addEventListener("click", e => { e.stopPropagation(); renderDistrictMenu(); toggleMenu($("#districtMenu"), $("#districtBtn")); });
  $("#districtMenu").addEventListener("click", e => {
    const b = e.target.closest("[data-sector]");
    if (!b) return;
    closeMenus();
    focusSector(b.dataset.sector || null);
  });
  $("#bell").addEventListener("click", e => { e.stopPropagation(); renderFeed(); toggleMenu($("#feed"), $("#bell")); $("#bellDot").hidden = true; });
  $("#q").addEventListener("input", e => search(e.target.value));
  $("#q").addEventListener("focus", e => e.target.value && search(e.target.value));
  $("#q").addEventListener("keydown", e => {
    const opts = [...$("#results").querySelectorAll("[data-i]")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!opts.length) return;
      resultIdx = (resultIdx + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.classList.toggle("on", i === resultIdx));
      opts[resultIdx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") { e.preventDefault(); chooseResult(resultIdx); }
    else if (e.key === "Escape") { e.target.value = ""; closeMenus(); e.target.blur(); }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".menu, .search, .district, .bell-wrap")) closeMenus(); });
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== $("#q")) { e.preventDefault(); $("#q").focus(); }
    if (e.key === "Escape" && document.activeElement !== $("#q")) { closeMenus(); if (!panel.hidden) { closePanel(); street.select(null); ctx = { kind: "all" }; setJourneyFor(null); renderKpis(); } }
  });
  app.addEventListener("click", e => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    e.preventDefault();
    const act = a.dataset.action;
    if (act === "home") goHome();
    else if (act === "zoom-in") street.zoomBy(1.4);
    else if (act === "zoom-out") street.zoomBy(1 / 1.4);
    else if (act === "rotate-l") street.rotateBy(Math.PI / 8);
    else if (act === "rotate-r") street.rotateBy(-Math.PI / 8);
    else if (act === "close") { closePanel(); street.select(null); ctx = { kind: "all" }; setJourneyFor(null); setDistrictButton(null); renderKpis(); }
    else if (act === "refocus") {
      if (ctx.kind === "company") street.select("company", ctx.id);
      else if (ctx.kind === "vehicle") street.select("vehicle", ctx.id);
      else if (ctx.kind === "sector") street.focusSector(ctx.id);
      else street.select("hq", "loodos");
    }
  });
}

function finishBoot(is3d) {
  $("#loader").classList.add("done");
  const h = decodeURIComponent(location.hash.slice(1));
  if (byCompany(h)) openCompany(h);
  else if (h.startsWith("mahalle/") && bySector(h.slice(8))) focusSector(h.slice(8));
  else if (h === "merkez") { street.select("hq", "loodos"); showHQ(); }
  else if (is3d) setTimeout(() => street.intro(), 300);
  setTimeout(() => $(".hint").classList.add("gone"), 9000);
}

boot().catch(err => {
  console.error(err);
  renderFallback("Bir şeyler ters gitti.");
  finishBoot(false);
});
