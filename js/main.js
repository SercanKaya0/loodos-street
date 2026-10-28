/* Loodos Street arayüzü: üst bar, KPI kartları, detay paneli, ürün yolculuğu, canlı akış, tema ve sunum modu.
   Sahne js/scene.js'te; veri js/data.js + js/data.en.js, metinler js/i18n.js. */
import { createStreet, esc, initials } from "./scene.js";
import { t, lang, setLang, localData, locale, prefs, translateDom } from "./i18n.js";
import { createSiren } from "./siren.js";

const D = localData();
const $ = s => document.querySelector(s);
const app = $("#app");
const bySector = id => D.sectors.find(s => s.id === id);
const byCompany = id => D.companies.find(c => c.id === id);
const productById = id => D.products.find(p => p.id === id);
const STAGES = t("stages");
const RAW_LOGO = new Set(["vodafone"]);
const usersOf = pid => D.companies.filter(c => c.projects.some(p => p.prods.some(x => x.id === pid))).map(c => c.id);
const productsOf = c => [...new Set(c.projects.flatMap(p => p.prods.map(x => x.id)))];
const driveUrl = id => `https://drive.google.com/file/d/${id}/view`;
// Paylaşılabilir adres: #a101, #mahalle/ret, #merkez, #sunum. Sunum sürerken adres #sunum'da kalır.
const setHash = h => { if (!presenter.on) history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); };

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
  bug: '<svg viewBox="0 0 24 24"><path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0z"/><path d="M12 9v9M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2M10 5 9 3M14 5l1-2"/></svg>',
  auto: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  rain: '<svg viewBox="0 0 24 24"><path d="M7 15a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 8a3.5 3.5 0 0 1 .5 7z"/><path d="m8 18-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
  snow: '<svg viewBox="0 0 24 24"><path d="M12 2v20M4 7l16 10M20 7 4 17"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13"/><path d="M12 7c-2-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3-2-5 1z"/></svg>',
  season: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/></svg>',
  cycle: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg>',
  ext: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
};

// Sahne kurulamazsa (WebGL yok, GPU kara listede) arayüz bu boş sahneyle liste görünümünde çalışır.
const NO_STREET = { select() {}, highlight() {}, focusSector() {}, home() {}, zoomBy() {}, rotateBy() {}, intro() {}, setNight() {}, setWeather() {}, setClock() {}, setEvent() {}, setLead() {}, vehicleInfo: () => null, ambulanceInfo: () => null };
const siren = createSiren(prefs.get("ls.sound") !== "off");
let street = NO_STREET;
let ctx = { kind: "all" };        // KPI ve panel bağlamı
let activeProduct = null;
let vehicleTimer = null;
const feed = [];
const presenter = { on: false, paused: false, i: 0, items: [], elapsed: 0, last: 0, timer: null, wake: null };

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
    if (cards.length < 3) cards.push(kpi("box", t("kpi.projects"), String(c.projects.length)));
    if (cards.length < 3) cards.push(kpi("spark", t("kpi.tech"), String(new Set(c.projects.flatMap(p => p.tech)).size)));
    el.innerHTML = cards.join("");
  } else if (ctx.kind === "sector") {
    const s = bySector(ctx.id), cs = D.companies.filter(c => c.sector === s.id);
    const projects = cs.reduce((n, c) => n + c.projects.length, 0);
    const top = cs.flatMap(c => c.projects.flatMap(p => p.metrics.map(m => [m[0], `${c.name} · ${m[1]}`])))[0];
    el.innerHTML = kpi("store", t("kpi.shops", { s: s.name }), String(cs.length)) + kpi("box", t("kpi.project"), String(projects))
      + (top ? kpi("chart", top[1], top[0]) : "");
  } else if (ctx.kind === "ambulance") {
    const a = street.ambulanceInfo();
    el.innerHTML = a ? kpi("shield", t("kpi.fixed"), `${a.stats.resolved}/${a.stats.opened}`) + kpi("clock", t("kpi.avgFix"), a.stats.avgFix == null ? "—" : `${a.stats.avgFix} ${t("min")}`)
      + kpi("bug", t("kpi.openBugs"), String(a.stats.open)) : "";
  } else if (ctx.kind === "vehicle") {
    const v = street.vehicleInfo(ctx.id);
    el.innerHTML = v ? kpi("truck", t("kpi.vehicle"), v.id) + (v.prod ? kpi("box", t("kpi.cargo"), v.prod.name) : "")
      + kpi("clock", t("kpi.eta"), v.etaSec == null ? "—" : v.etaSec ? `${v.etaSec} ${t("sec")}` : t("now"))
      + (v.prod ? "" : kpi("chart", t("kpi.speed"), `${v.speedKmh} ${t("kmh")}`)) : "";
  } else {
    el.innerHTML = kpi("users", k[0][1], k[0][0], t("kpi.live")) + kpi("box", k[1][1], k[1][0]) + kpi("shield", k[5][1], k[5][0]);
  }
}

/* ---------- Mahalle seçici ---------- */
const total = D.companies.reduce((n, c) => n + c.projects.length, 0);
function setDistrictButton(id) {
  const s = id && bySector(id);
  const chip = $("#districtChip");
  chip.style.setProperty("--c", s ? s.color : "var(--mono-bg)");
  chip.textContent = s ? s.id.toUpperCase().slice(0, 3) : "ALL";
  $("#districtName").textContent = s ? s.name : t("all");
  const cs = s ? D.companies.filter(c => c.sector === s.id) : D.companies;
  $("#districtSub").textContent = t("dist.sub", { n: cs.length, m: cs.reduce((n, c) => n + c.projects.length, 0) });
}
function renderDistrictMenu() {
  const cur = ctx.kind === "sector" ? ctx.id : null;
  const rows = [`<button data-sector="" class="${cur ? "" : "on"}"><span class="chip-sq" style="--c:var(--mono-bg)">ALL</span><b>${esc(t("all"))}</b><span class="pct">${D.companies.length}</span><small>${esc(t("dist.all", { a: D.sectors.length, b: total }))}</small></button>`];
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
  for (const m of ["#districtMenu", "#feed", "#results", "#themeMenu"]) $(m).hidden = true;
  for (const b of ["#districtBtn", "#bell", "#themeBtn"]) $(b).setAttribute("aria-expanded", "false");
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
    ? `<span class="p-logo"><img src="${c.logo}" alt="${esc(t("p.logo", { name: c.name }))}" style="${RAW_LOGO.has(c.id) ? "" : "filter:brightness(0)"}"></span>`
    : `<span class="p-logo txt" style="--c:${s.color}">${esc(initials(c.name))}</span>`;
}
function head(logo, kicker, title, sub) {
  return `<div class="p-head">${logo}<div class="p-title"><div class="p-kicker">${kicker}</div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
    <div class="p-actions"><button class="icon-btn" data-action="refocus" aria-label="${esc(t("p.focus"))}">${ICON.target}</button><button class="icon-btn" data-action="close" aria-label="${esc(t("p.close"))}">${ICON.close}</button></div></div>`;
}

function showCompany(id, tab = 0) {
  const c = byCompany(id), s = bySector(c.sector);
  ctx = { kind: "company", id };
  const p = c.projects[tab];
  setHash(id);
  const status = p.when ? `<span class="pill ${/devam|ongoing|progress/i.test(p.when) ? "warn" : "ok"}">${esc(p.when)}</span>` : `<span class="pill ok">${esc(t("p.live"))}</span>`;
  const tabs = c.projects.length > 1
    ? `<div class="tabs" role="tablist">${c.projects.map((x, i) => `<button role="tab" data-tab="${i}" class="${i === tab ? "on" : ""}" aria-selected="${i === tab}">${esc(x.app || c.name)}</button>`).join("")}</div>` : "";
  const prods = p.prods.length
    ? p.prods.map(x => { const pr = productById(x.id); return `<div class="prod"><div class="prod-h"><span class="mono">${esc(pr.mono)}</span>${esc(t("p.prodBuilt", { name: pr.name }))}</div>
        <ul>${x.built.map(b => `<li>${esc(b)}</li>`).join("")}</ul>${x.mods.length ? `<div class="tech">${x.mods.map(m => `<span>${esc(m)}</span>`).join("")}</div>` : ""}</div>`; }).join("")
    : `<p class="custom">${esc(t("p.custom"))}</p>`;
  openPanel(`${head(logoBox(c, s), `<span style="color:${s.color}">●</span> ${esc(s.name)}`, esc(c.name) + (p.app ? ` <span style="color:var(--muted);font-weight:500">${esc(p.app)}</span>` : ""), esc(p.sub || ""))}
    <div class="p-body">
      <div class="pills">${status}<span class="pill" style="--c:${s.color}"><i></i>${esc(s.name)}</span>${p.prods.map(x => `<span class="pill vio">${esc(productById(x.id).name)}</span>`).join("")}</div>
      ${tabs}
      ${p.d ? `<p class="lead">${esc(p.d)}</p>` : ""}
      ${p.img ? `<figure class="shot"><img src="${p.img}" alt="${esc(t("p.shots", { c: c.name, app: p.app }))}" loading="lazy" onerror="this.parentNode.remove()"></figure>` : ""}
      ${p.metrics.length ? `<div class="metrics">${p.metrics.map(m => `<div class="metric"><b>${esc(m[0])}</b><small>${esc(m[1])}</small></div>`).join("")}</div>` : ""}
      ${p.ctx ? `<div class="sec"><h3>${t("p.ctx")}</h3><p>${esc(p.ctx)}</p></div>` : ""}
      ${p.need ? `<div class="sec"><h3>${t("p.need")}</h3><p>${esc(p.need)}</p></div>` : ""}
      ${p.approach ? `<div class="sec"><h3>${t("p.approach")}</h3><p>${esc(p.approach)}</p></div>` : ""}
      ${p.features.length ? `<div class="sec"><h3>${t("p.features")}</h3><ul class="feat">${p.features.map(f => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join("")}</ul></div>` : ""}
      <div class="sec"><h3>${t("p.products")}</h3>${prods}</div>
      ${p.tech.length ? `<div class="sec"><h3>${t("p.tech")}</h3><div class="tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join("")}</div></div>` : ""}
      ${p.pdf ? `<a class="cta" href="${driveUrl(p.pdf)}" target="_blank" rel="noopener">${t("p.pdf")} ${ICON.ext}</a>` : ""}
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
    const st = v.state === "unloading" ? `<span class="pill warn">${esc(t("v.unloading", { n: v.unloadLeft }))}</span>`
      : v.dest ? `<span class="pill ok">${esc(t("v.onway"))}</span>` : `<span class="pill">${esc(t("v.return"))}</span>`;
    const body = v.delivers ? `
      ${v.prod ? `<div class="prod" style="margin-top:14px"><div class="prod-h"><span class="mono">${esc(v.prod.mono)}</span>${esc(v.prod.name)}</div><p style="margin:6px 0 0;font-size:13px;color:var(--violet-text)">${esc(t("v.carries", { p: v.prod.name }))}</p></div>` : ""}
      <div class="prog"><div class="prog-top"><span>${v.dest ? esc(v.dest.name) : esc(t("v.noDelivery"))}</span><span>%${Math.round(Math.min(1, Math.max(0, v.progress)) * 100)}</span></div><div class="bar"><i style="width:${Math.min(1, Math.max(0, v.progress)) * 100}%"></i></div></div>
      <dl class="rows">
        <div><dt>${t("v.ship")}</dt><dd>${esc(v.ship || "—")}</dd></div>
        <div><dt>${t("v.to")}</dt><dd>${v.dest ? esc(v.dest.name) : "—"}</dd></div>
        <div><dt>${t("v.sector")}</dt><dd>${v.sector ? esc(v.sector.name) : "—"}</dd></div>
        <div><dt>${t("v.eta")}</dt><dd>${v.etaSec == null ? "—" : v.etaSec ? `${v.etaSec} ${t("sec")}` : t("v.delivering")}</dd></div>
        <div><dt>${t("v.speed")}</dt><dd>${v.speedKmh} ${t("kmh")}</dd></div>
        <div><dt>${t("v.cargo")}</dt><dd>${esc(v.cargo || "—")}</dd></div>
      </dl>
      ${v.dest ? `<button class="cta" data-goto="${v.dest.id}">${esc(t("v.openShop"))}</button>` : ""}${v.prod ? `<button class="cta ghost" data-prod="${v.prod.id}">${esc(t("v.showProduct"))}</button>` : ""}`
      : `<dl class="rows"><div><dt>${t("v.type")}</dt><dd>${esc(v.type)}</dd></div><div><dt>${t("v.speed")}</dt><dd>${v.speedKmh} ${t("kmh")}</dd></div></dl>
         <p class="custom" style="margin-top:14px">${esc(t("v.resident"))}</p>`;
    const html = `${head(`<span class="p-logo txt" style="--c:var(--teal)">${ICON.truck.replace("<svg", '<svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2"')}</span>`,
      esc(t("v.kicker", { type: v.type })), esc(v.id), v.dest ? esc(t("v.delivery", { shop: v.dest.name })) : "")}<div class="p-body"><div class="pills">${st}<span class="pill"><i></i>${esc(t("v.track"))}</span></div>${body}</div>`;
    if (panel.hidden || panel.dataset.v !== id) { openPanel(html); panel.dataset.v = id; setHash(""); }
    else panel.innerHTML = html;
    panel.querySelector("[data-goto]")?.addEventListener("click", e => openCompany(e.currentTarget.dataset.goto));
    panel.querySelector("[data-prod]")?.addEventListener("click", e => toggleProduct(e.currentTarget.dataset.prod));
    renderKpis();
  };
  clearInterval(vehicleTimer);
  panel.dataset.v = "";
  draw();
  vehicleTimer = setInterval(() => { if (ctx.kind === "vehicle" && ctx.id === id) draw(); else clearInterval(vehicleTimer); }, 400);
}

// Bug ambulansı: görev kartı, ilerleme adımları ve oturum boyunca tutulan bug hesabı (400 ms'de bir canlı güncellenir).
function showAmbulance() {
  ctx = { kind: "ambulance", id: "hotfix" };
  setJourneyFor(null);
  const draw = () => {
    const a = street.ambulanceInfo();
    if (!a) return closePanel();
    const m = a.active ? a.mission : null, s = a.stats;
    const stepAt = !m ? -1 : a.state === "enroute" ? 1 : a.state === "onsite" ? 2 : 4;
    const status = a.state === "onsite" ? `<span class="pill warn">${esc(t("amb.st.onsite", { n: m.onsiteLeft }))}</span>`
      : a.state === "leaving" ? `<span class="pill ok">${esc(t("amb.st.leaving"))}</span>`
        : a.state === "enroute" ? `<span class="pill bug">${esc(t("amb.st.enroute"))}</span>` : `<span class="pill">${esc(t("amb.st.idle"))}</span>`;
    const ledger = `<div class="sec"><h3>${t("amb.ledger")}</h3><div class="metrics">
        <div class="metric"><b>${s.opened}</b><small>${t("amb.opened")}</small></div>
        <div class="metric"><b>${s.resolved}</b><small>${t("amb.resolved")}</small></div>
        <div class="metric"><b>${s.open}</b><small>${t("amb.open")}</small></div>
        <div class="metric"><b>${s.opened ? Math.round(s.resolved / s.opened * 100) : 0}%</b><small>${t("amb.rate")}</small></div>
        <div class="metric"><b>${s.avgResp == null ? "—" : s.avgResp + " " + t("min")}</b><small>${t("amb.avgResp")}</small></div>
        <div class="metric"><b>${s.avgFix == null ? "—" : s.avgFix + " " + t("min")}</b><small>${t("amb.avgFix")}</small></div>
      </div><p class="custom" style="margin-top:8px">${esc(t("amb.note"))}</p></div>`;
    const body = m ? `
      <div class="steps">${t("amb.steps").map((x, i) => `<span class="${i < stepAt ? "done" : i === stepAt ? "now" : ""}"><i></i>${esc(x)}</span>`).join("")}</div>
      ${a.state === "enroute" ? `<div class="prog"><div class="prog-top"><span>${esc(m.company.name)}</span><span>%${Math.round(Math.min(1, Math.max(0, m.progress)) * 100)}</span></div><div class="bar"><i style="width:${Math.min(1, Math.max(0, m.progress)) * 100}%;background:#e5484d"></i></div></div>` : ""}
      <dl class="rows">
        <div><dt>${t("amb.shop")}</dt><dd>${esc(m.company.name)}</dd></div>
        <div><dt>${t("amb.project")}</dt><dd>${esc(m.project || "—")}</dd></div>
        <div><dt>${t("amb.platform")}</dt><dd>${esc(m.platform)}</dd></div>
        <div><dt>${t("amb.sev")}</dt><dd>${esc(t("sev." + m.sev))}</dd></div>
        <div><dt>${t("amb.affected")}</dt><dd>%${m.affected.toLocaleString(locale)}</dd></div>
        <div><dt>${a.state === "enroute" ? t("amb.eta") : t("amb.resp")}</dt><dd>${a.state === "enroute" ? `${m.etaMin} ${t("min")}` : `${m.respMin} ${t("min")}`}</dd></div>
        <div><dt>${t(a.state === "leaving" ? "amb.fix" : "amb.elapsed")}</dt><dd>${m.fixMin} ${t("min")}</dd></div>
        <div><dt>${t("amb.cf")}</dt><dd>%${m.cf0.toLocaleString(locale)} ${a.state === "leaving" ? `→ <span style="color:var(--ok-ink)">%${m.cf1.toLocaleString(locale)}</span>` : ""}</dd></div>
      </dl>
      <div class="sec"><h3>${t("amb.team")}</h3><div class="tech">${t("amb.roles").map(r => `<span>${esc(r)}</span>`).join("")}</div></div>
      ${ledger}
      <button class="cta" data-goto="${m.company.id}">${esc(t("amb.openShop"))}</button>`
      : `<p class="custom" style="margin-top:14px">${esc(t("amb.idle.next", { n: a.nextIn }))}</p>${ledger}`;
    const html = `${head(`<span class="p-logo txt" style="--c:#e5484d">${ICON.bug.replace("<svg", '<svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"')}</span>`,
      esc(t("amb.kicker")), m ? esc(m.id) : esc(t("amb.idle.title")), m ? esc(m.title) : esc(t("amb.idle.sub")))}<div class="p-body"><div class="pills">${status}${m ? `<span class="pill sev-${m.sev}">${esc(t("sev." + m.sev))}</span>` : ""}</div>${body}</div>`;
    const keep = panel.querySelector(".p-body")?.scrollTop || 0;
    if (panel.hidden || panel.dataset.v !== "hotfix") { openPanel(html); panel.dataset.v = "hotfix"; setHash(""); }
    else { panel.innerHTML = html; panel.querySelector(".p-body").scrollTop = keep; }
    panel.querySelector("[data-goto]")?.addEventListener("click", e => openCompany(e.currentTarget.dataset.goto));
    renderKpis();
  };
  clearInterval(vehicleTimer);
  panel.dataset.v = "";
  draw();
  vehicleTimer = setInterval(() => { if (ctx.kind === "ambulance") draw(); else clearInterval(vehicleTimer); }, 400);
}

/* ---------- "Bu dükkân sizin olabilir" ---------- */
// Ziyaretçinin seçimi yalnız kendi tarayıcısında saklanır; bina ve kamyonlar bu seçime göre davranır.
let lead = (() => { try { const v = JSON.parse(prefs.get("ls.lead") || "{}"); return { sector: v.sector || null, prods: Array.isArray(v.prods) ? v.prods.filter(productById) : [] }; } catch { return { sector: null, prods: [] }; } })();
function saveLead() {
  prefs.set("ls.lead", JSON.stringify(lead));
  street.setLead(lead.prods);
}
function showLead() {
  ctx = { kind: "lead" };
  setJourneyFor(null);
  setHash("yeni-dukkan");
  const refs = [...new Set([
    ...D.companies.filter(c => c.sector === lead.sector).map(c => c.id),
    ...lead.prods.flatMap(usersOf),
  ])].map(byCompany).slice(0, 8);
  const keep = panel.querySelector(".p-body")?.scrollTop || 0;
  const html = `${head('<span class="p-logo txt" style="--c:var(--teal)">＋</span>', esc(t("lead.kicker")), esc(t("lead.title")), esc(t("lead.sub")))}
    <div class="p-body">
      <div class="sec"><h3>${t("lead.sector")}</h3><div class="choice">${D.sectors.map(s => `<button data-sec="${s.id}" class="${lead.sector === s.id ? "on" : ""}" style="--c:${s.color}"><i></i>${esc(s.name)}</button>`).join("")}</div></div>
      <div class="sec"><h3>${t("lead.products")}</h3><div class="choice">${D.products.map(p => `<button data-lp="${p.id}" class="${lead.prods.includes(p.id) ? "on" : ""}" title="${esc(p.cat)}"><span class="mono">${esc(p.mono)}</span>${esc(p.name)}</button>`).join("")}</div></div>
      ${lead.prods.length ? `<p class="custom" style="margin-top:12px">${esc(t("lead.trucks", { n: lead.prods.length, f: Math.min(10, lead.prods.length + 1) }))}</p>` : ""}
      ${refs.length ? `<div class="sec"><h3>${t("lead.refs")}</h3><div class="prod-list">${refs.map(c => `<button data-goto="${c.id}">${logoBox(c, bySector(c.sector))}<span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span></button>`).join("")}</div></div>` : ""}
      <a class="cta" href="https://loodos.com/contact" target="_blank" rel="noopener">${esc(t("lead.cta"))} ${ICON.ext}</a>${lead.sector || lead.prods.length ? `<button class="cta ghost" data-lead-reset>${esc(t("lead.reset"))}</button>` : ""}
    </div>`;
  if (panel.hidden || panel.dataset.v !== "lead") { openPanel(html); panel.dataset.v = "lead"; }
  else { panel.innerHTML = html; panel.querySelector(".p-body").scrollTop = keep; }
  panel.querySelectorAll(".prod-list .p-logo").forEach(l => { l.style.width = "40px"; l.style.height = "40px"; l.style.borderRadius = "11px"; });
  panel.querySelectorAll("[data-sec]").forEach(b => b.addEventListener("click", () => { lead.sector = lead.sector === b.dataset.sec ? null : b.dataset.sec; saveLead(); showLead(); }));
  panel.querySelectorAll("[data-lp]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.lp;
    lead.prods = lead.prods.includes(id) ? lead.prods.filter(x => x !== id) : [...lead.prods, id];
    saveLead(); showLead();
  }));
  panel.querySelector("[data-lead-reset]")?.addEventListener("click", () => { lead = { sector: null, prods: [] }; saveLead(); showLead(); });
  panel.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => openCompany(b.dataset.goto)));
  renderKpis();
}

function showHQ() {
  ctx = { kind: "all" };
  setJourneyFor(null);
  setHash("merkez");
  openPanel(`${head('<span class="p-logo txt" style="--c:#0a0a0a">L</span>', esc(t("hq.kicker")), "Loodos", "Pioneering Technology, Perfecting the Art of Experience")}
    <div class="p-body">
      <div class="metrics">${D.kpis.map(k => `<div class="metric"><b>${esc(k[0])}</b><small>${esc(k[1])}</small></div>`).join("")}</div>
      <div class="sec"><h3>${t("hq.roadmap")}</h3><ul class="tl">${D.timeline.map(t => `<li><b>${esc(t[0])}</b>${esc(t[1])}</li>`).join("")}</ul></div>
      <div class="sec"><h3>${t("hq.products")}</h3><div class="prod-list">${D.products.map(p => `<button data-prod="${p.id}"><span class="mono">${esc(p.mono)}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></span></button>`).join("")}</div></div>
      <div class="sec"><h3>${t("hq.street")}</h3><p>${esc(t("hq.summary", { a: D.companies.length, b: total, c: D.sectors.length }))}</p></div>
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
  openPanel(`${head(`<span class="p-logo txt" style="--c:${s.color}">${s.id.toUpperCase().slice(0, 3)}</span>`, esc(t("sector")), esc(s.name), esc(t("sector.shops", { n: cs.length })))}
    <div class="p-body"><p class="lead">${esc(s.intro)}</p>
      <div class="sec"><h3>${t("sector.list")}</h3><div class="prod-list">${cs.map(c => `<button data-goto="${c.id}">${logoBox(c, s)}<span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span></button>`).join("")}</div></div>
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
    ? (used.length ? `${c.name}: ${used.map(id => productById(id).name).join(", ")}` : t("journey.custom", { c: c.name }))
    : activeProduct ? `${productById(activeProduct).name}: ${productById(activeProduct).promise}`
      : t("journey.hint");
}
function toggleProduct(pid) {
  activeProduct = activeProduct === pid ? null : pid;
  if (!activeProduct) { street.highlight(null); setJourneyFor(null); return; }
  const ids = usersOf(pid);
  street.select(null);
  street.highlight(ids.length ? ids : [], pid);
  closePanel();
  ctx = { kind: "all" };
  renderKpis();
  setJourneyFor(null);
  if (!ids.length) $("#journeySub").textContent = t("journey.none", { p: productById(pid).name, promise: productById(pid).promise });
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
  if (cs.length) html += `<div class="grp">${t("res.shops")}</div>` + cs.map(c => { const s = bySector(c.sector); return btn(c, `<span class="chip-sq" style="--c:${s.color};width:26px;height:26px;border-radius:8px;font-size:9px">${esc(initials(c.name))}</span><span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span>`); }).join("");
  if (ps.length) html += `<div class="grp">${t("res.products")}</div>` + ps.map(p => btn(p, `<span class="mono">${esc(p.mono)}</span><span><b>${esc(p.name)}</b><small>${esc(p.cat)}</small></span>`)).join("");
  if (ss.length) html += `<div class="grp">${t("res.sectors")}</div>` + ss.map(s => btn(s, `<span class="chip-sq" style="--c:${s.color};width:26px;height:26px;border-radius:8px;font-size:9px">${s.id.toUpperCase().slice(0, 3)}</span><b>${esc(s.name)}</b>`)).join("");
  box.innerHTML = html || `<div class="empty">${esc(t("res.none", { q }))}</div>`;
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
function openCompany(id, tab = 0) {
  if (id === "lead") { street.select("lead", "lead"); return showLead(); }
  activeProduct = null;
  street.highlight(null);
  street.select("company", id);
  showCompany(id, tab);
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
  const time = d => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("#feed").innerHTML = `<h4>${t("feed")}</h4>` + (feed.length
    ? feed.map((e, i) => `<button data-ev="${i}"><span class="ev-ico">${ICON.truck.replace("<svg", '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"')}</span><span>${esc(e.text)}<small>${esc(e.sub)} · ${time(e.at)}</small></span></button>`).join("")
    : `<p class="empty">${esc(t("feed.empty"))}</p>`);
  $("#feed").querySelectorAll("[data-ev]").forEach(b => b.addEventListener("click", () => { closeMenus(); openCompany(feed[+b.dataset.ev].company); }));
}

/* ---------- Liste görünümü (WebGL yoksa) ---------- */
function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
function renderFallback(reason) {
  app.classList.add("flat");
  $("#stage").innerHTML = `<div class="fallback"><p class="fb-note">${esc(reason)} ${esc(t("fb.list"))}</p>${D.sectors.map(s => {
    const cs = D.companies.filter(c => c.sector === s.id);
    return `<section><h3 style="--c:${s.color}"><i></i>${esc(s.name)}</h3><div class="fb-grid">${cs.map(c => `<button data-goto="${c.id}">${logoBox(c, s)}<span><b>${esc(c.name)}</b><small>${c.projects.map(p => esc(p.app || p.sub)).join(" · ")}</small></span></button>`).join("")}</div></section>`;
  }).join("")}</div>`;
  $("#stage").querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => openCompany(b.dataset.goto)));
}

/* ---------- Gündüz / gece ---------- */
const THEMES = ["auto", "light", "dark", "cycle"];
let themeMode = THEMES.includes(prefs.get("ls.theme")) ? prefs.get("ls.theme") : "auto";
const CYCLE_SEC = 120;                 // "Gün döngüsü": 24 saat 2 dakikada
let cycleStart = performance.now(), cycleFrom = 0;
const ramp = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
// 0 gündüz, 1 gece; şafak 05:30–07:30, akşam 18:00–20:00 arasında yumuşak geçiş (index.html'deki ilk tahminle uyumlu).
const nightAt = h => (h < 12 ? 1 - ramp(5.5, 7.5, h) : ramp(18, 20, h));
const hoursNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };
const simHours = () => (themeMode === "cycle" ? (cycleFrom + (performance.now() - cycleStart) / 1000 / CYCLE_SEC * 24) % 24 : hoursNow());
const nightNow = () => (themeMode === "light" ? 0 : themeMode === "dark" ? 1 : nightAt(simHours()));

function applyTheme(instant = false) {
  const n = nightNow();
  document.documentElement.dataset.theme = n > .5 ? "dark" : "light";
  street.setNight(n, instant);
  street.setClock(simHours());
  const h = simHours(), d = new Date();
  if (themeMode === "cycle") d.setHours(Math.floor(h), Math.floor((h % 1) * 60));
  $("#clock").textContent = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  $(".live").classList.toggle("sim", themeMode === "cycle");
}
/* ---------- Hava: yağmur ve kar ---------- */
const WEATHERS = ["auto", "clear", "rain", "snow"];
let weatherMode = WEATHERS.includes(prefs.get("ls.weather")) ? prefs.get("ls.weather") : "auto";
// Mevsim algoritması: her ay için [kar, yağmur] olasılığı (İstanbul iklimine yakın).
const SEASON = [[.35, .3], [.3, .3], [.1, .35], [0, .3], [0, .25], [0, .12], [0, .08], [0, .08], [0, .2], [0, .35], [.05, .4], [.3, .3]];
// Gün 3 saatlik dilimlere bölünür; her dilime tarihten türetilen sabit bir sayı düşer.
// Böylece aynı dilimde herkes aynı havayı görür, dilim değişince hava da değişebilir.
function seasonalWeather(d = new Date()) {
  let h = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) * 8 + Math.floor(d.getHours() / 3);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  const r = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  const [snow, rain] = SEASON[d.getMonth()];
  return r < snow ? "snow" : r < snow + rain ? "rain" : "clear";
}
// Yılbaşı haftasında "mevsime göre" hava kar yağdırır
const weatherNow = () => (weatherMode === "auto" ? (eventNow() === "newyear" ? "snow" : seasonalWeather()) : weatherMode);

/* ---------- Özel günler ---------- */
const EVENTS = ["auto", "none", "national", "newyear"];
let eventMode = EVENTS.includes(prefs.get("ls.event")) ? prefs.get("ls.event") : "auto";
// Ulusal bayramlar arifeden başlar: 22–23 Nisan, 18–19 Mayıs, 29–30 Ağustos, 28–29 Ekim; yılbaşı 20 Aralık – 2 Ocak
const NATIONAL = [[4, 23], [5, 19], [8, 30], [10, 29]];
const FOUNDED = { "4-23": 1920, "5-19": 1919, "8-30": 1922, "10-29": 1923 };
// Giydirme metni: hangi bayram (bugün ya da yarın), kaçıncı yıl; elle seçilince 29 Ekim
function eventInfo(kind, d = new Date()) {
  if (kind === "newyear") {
    const year = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
    return { big: String(year), line: t("ny.line"), small: t("ny.small") };
  }
  if (kind !== "national") return null;
  let key = "10-29";
  for (const day of [d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)]) {
    const k = `${day.getMonth() + 1}-${day.getDate()}`;
    if (FOUNDED[k]) { key = k; break; }
  }
  const [big, line] = t("hol." + key);
  const n = d.getFullYear() - FOUNDED[key];
  // İngilizce sıra eki: 101st, 102nd, 103rd, 111th
  const ord = lang === "en" ? n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th") : n;
  return { big, line, small: t("hol.year", { n: ord }) };
}
function datedEvent(d = new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  const next = new Date(d.getFullYear(), d.getMonth(), day + 1);
  const isDay = (mm, dd) => NATIONAL.some(([a, b]) => a === mm && b === dd);
  if (isDay(m, day) || isDay(next.getMonth() + 1, next.getDate())) return "national";
  if ((m === 12 && day >= 20) || (m === 1 && day <= 2)) return "newyear";
  return "none";
}
function eventNow() { return eventMode === "auto" ? datedEvent() : eventMode; }
let shownEvent = null;
function applyEvent() {
  const e = eventNow();
  if (e === shownEvent) return;
  shownEvent = e;
  street.setEvent(e, eventInfo(e));
}
function setEventMode(mode) {
  eventMode = mode;
  prefs.set("ls.event", mode);
  applyEvent();
  applyWeather();
  renderThemeMenu();
}
let shownWeather = null;
function applyWeather(instant = false) {
  const w = weatherNow();
  $("#wx").innerHTML = w === "clear" ? "" : ICON[w];
  $("#wx").title = t("wx." + w);
  if (w === shownWeather && !instant) return;
  shownWeather = w;
  street.setWeather(w, instant);
}
function setWeatherMode(mode) {
  weatherMode = mode;
  prefs.set("ls.weather", mode);
  applyWeather();
  renderThemeMenu();
}

function setTheme(mode) {
  themeMode = mode;
  prefs.set("ls.theme", mode);
  if (mode === "cycle") { cycleStart = performance.now(); cycleFrom = hoursNow(); }
  applyTheme();
  renderThemeMenu();
}
function renderThemeMenu() {
  const icon = { auto: ICON.auto, light: ICON.sun, dark: ICON.moon, cycle: ICON.cycle };
  const eIcon = { auto: ICON.season, none: ICON.close, national: ICON.flag, newyear: ICON.gift };
  const wIcon = { auto: ICON.season, clear: ICON.sun, rain: ICON.rain, snow: ICON.snow };
  $("#themeMenu").innerHTML = `<h4>${t("theme")}</h4>` + THEMES.map(m => `<button role="menuitemradio" aria-checked="${m === themeMode}" data-theme="${m}" class="${m === themeMode ? "on" : ""}">
    <span class="t-ico">${icon[m]}</span><span><b>${esc(t("theme." + m))}</b><small>${esc(t("theme." + m + ".d"))}</small></span></button>`).join("")
    + `<h4 class="sep-h">${t("event")}</h4>` + EVENTS.map(m => `<button role="menuitemradio" aria-checked="${m === eventMode}" data-event="${m}" class="${m === eventMode ? "on" : ""}">
    <span class="t-ico">${eIcon[m]}</span><span><b>${esc(t("ev." + m))}</b><small>${esc(t("ev." + m + ".d", { now: t("ev." + datedEvent()) }))}</small></span></button>`).join("")
    + `<h4 class="sep-h">${t("weather")}</h4>` + WEATHERS.map(m => `<button role="menuitemradio" aria-checked="${m === weatherMode}" data-weather="${m}" class="${m === weatherMode ? "on" : ""}">
    <span class="t-ico">${wIcon[m]}</span><span><b>${esc(t("wx." + m))}</b><small>${esc(t("wx." + m + ".d", { now: t("wx." + seasonalWeather()) }))}</small></span></button>`).join("");
}

/* ---------- Sunum modu ---------- */
// Merkez → her mahalle → mahallenin dükkânları (her projesi ayrı slayt); sonra başa döner. Ofis ekranında kendi kendine akar.
const SLIDE_MS = { hq: 9000, sector: 6500, company: 11000 };
function slides() {
  const items = [{ kind: "hq" }];
  for (const s of D.sectors) {
    const cs = D.companies.filter(c => c.sector === s.id);
    if (!cs.length) continue;
    items.push({ kind: "sector", id: s.id });
    for (const c of cs) c.projects.forEach((_, tab) => items.push({ kind: "company", id: c.id, tab }));
  }
  return items;
}
// Ürün barı dar ekranda iki satıra taşabilir; sunum çubuğu her zaman onun hemen üstünde durur.
function placePresenter() {
  $("#presenter").style.bottom = innerWidth > 860 ? $(".journey").offsetHeight + 26 + "px" : "";
}
function startPresentation() {
  closeMenus();
  Object.assign(presenter, { on: true, paused: false, items: slides() });
  history.replaceState(null, "", "#sunum");
  app.classList.add("presenting");
  $("#presenter").hidden = false;
  $("#presenter").classList.remove("paused");
  placePresenter();
  $('[data-action="present"]').classList.add("on");
  // Ekran kararmasın; desteklenmiyorsa ya da reddedilirse sunum yine sürer.
  try { navigator.wakeLock?.request("screen").then(l => { presenter.wake = l; }, () => {}); } catch { /* yok say */ }
  showSlide(0);
  clearInterval(presenter.timer);
  presenter.timer = setInterval(presentTick, 100);
}
function stopPresentation() {
  if (!presenter.on) return;
  presenter.on = false;
  clearInterval(presenter.timer);
  app.classList.remove("presenting");
  $("#presenter").hidden = true;
  $('[data-action="present"]').classList.remove("on");
  presenter.wake?.release?.().catch(() => {});
  presenter.wake = null;
  setHash(ctx.kind === "company" ? ctx.id : ctx.kind === "sector" ? "mahalle/" + ctx.id : panel.hidden ? "" : "merkez");
}
function showSlide(i) {
  const n = presenter.items.length;
  presenter.i = (i + n) % n;
  presenter.elapsed = 0;
  presenter.last = performance.now();
  const it = presenter.items[presenter.i];
  let title;
  if (it.kind === "hq") {
    activeProduct = null;
    street.highlight(null);
    street.select("hq", "loodos");
    setDistrictButton(null);
    showHQ();
    title = t("pr.hq");
  } else if (it.kind === "sector") {
    focusSector(it.id);
    title = bySector(it.id).name;
  } else {
    const c = byCompany(it.id), appName = c.projects[it.tab].app;
    if (ctx.kind === "company" && ctx.id === it.id) showCompany(it.id, it.tab); else openCompany(it.id, it.tab);
    title = c.name + (appName ? " · " + appName : "");
  }
  $("#prTitle").textContent = title;
  $("#prCount").textContent = `${presenter.i + 1}/${n}`;
}
function presentTick() {
  const now = performance.now();
  if (!presenter.paused && !document.hidden) presenter.elapsed += now - presenter.last;
  presenter.last = now;
  const dur = SLIDE_MS[presenter.items[presenter.i].kind];
  $("#prBar").style.width = Math.min(100, presenter.elapsed / dur * 100) + "%";
  // Panel içeriği slayt boyunca yavaşça aşağı kayar; uzun vakalar da baştan sona görünür.
  const body = panel.querySelector(".p-body");
  const max = body ? body.scrollHeight - body.clientHeight : 0;
  if (max > 0) body.scrollTop = max * ramp(2500, dur - 1500, presenter.elapsed);
  if (presenter.elapsed >= dur) showSlide(presenter.i + 1);
}
function togglePause() {
  presenter.paused = !presenter.paused;
  $("#presenter").classList.toggle("paused", presenter.paused);
  $("#prToggle").setAttribute("aria-label", t(presenter.paused ? "pr.play" : "pr.pause"));
}

function syncSound() {
  const b = $('[data-action="sound"]');
  b.classList.toggle("muted", !siren.enabled);
  b.setAttribute("aria-label", t(siren.enabled ? "sound.on" : "sound.off"));
  b.title = b.getAttribute("aria-label");
}

/* ---------- Başlat ---------- */
addEventListener("unhandledrejection", e => { console.error(e.reason); e.preventDefault(); });

async function boot() {
  translateDom();
  $("#prToggle").setAttribute("aria-label", t("pr.pause"));
  renderJourney();
  $("#journeySub").textContent = t("journey.hint");
  setDistrictButton(null);
  renderDistrictMenu();
  renderKpis();
  wireUi();

  if (!hasWebGL()) { renderFallback(t("fb.nogl")); return finishBoot(false); }
  try {
    street = await createStreet({
      el: $("#stage"),
      data: D,
      night: nightNow(),
      weather: weatherNow(),
      siren,
      onSelect(sel) {
        closeMenus();
        if (!sel) return;
        activeProduct = null;
        street.highlight(null);
        if (sel.kind === "company") { showCompany(sel.id); setDistrictButton(byCompany(sel.id).sector); }
        else if (sel.kind === "vehicle") showVehicle(sel.id);
        else if (sel.kind === "ambulance") showAmbulance();
        else if (sel.kind === "lead") showLead();
        else if (sel.kind === "hq") showHQ();
        else if (sel.kind === "sector") showSector(sel.id);
      },
      onEvent: pushEvent,
    });
  } catch (err) {
    console.error(err);
    street = NO_STREET;
    renderFallback(t("fb.fail"));
    return finishBoot(false);
  }
  applyEvent();
  street.setClock(simHours());
  street.setLead(lead.prods);
  finishBoot(true);
}

function wireUi() {
  if (themeMode === "cycle") cycleFrom = hoursNow();
  applyTheme(true);
  let beat = 0;
  // Döngü modunda akıcı geçiş için sık, diğer modlarda dakikada birkaç kez güncellenir.
  setInterval(() => { if (themeMode === "cycle" || ++beat % 40 === 0) { applyTheme(); applyWeather(); applyEvent(); } }, 250);
  applyWeather(true);
  renderThemeMenu();
  $("#themeBtn").addEventListener("click", e => { e.stopPropagation(); renderThemeMenu(); toggleMenu($("#themeMenu"), $("#themeBtn")); });
  $("#themeMenu").addEventListener("click", e => {
    const b = e.target.closest("[data-theme], [data-weather], [data-event]");
    if (b?.dataset.theme) setTheme(b.dataset.theme);
    else if (b?.dataset.event) setEventMode(b.dataset.event);
    else if (b) setWeatherMode(b.dataset.weather);
  });
  $("#langBtn").addEventListener("click", () => setLang(lang === "tr" ? "en" : "tr"));
  syncSound();

  // Sunum: kontrol çubuğu dışındaki her dokunuş, tekerlek ya da Esc sunumu bitirir ve kontrolü kullanıcıya verir.
  $("#presenter").addEventListener("click", e => {
    const b = e.target.closest("[data-pr]");
    if (!b) return;
    const a = b.dataset.pr;
    if (a === "prev") showSlide(presenter.i - 1);
    else if (a === "next") showSlide(presenter.i + 1);
    else if (a === "toggle") togglePause();
    else stopPresentation();
  });
  document.addEventListener("pointerdown", e => {
    if (presenter.on && !e.target.closest("#presenter, [data-action='present']")) stopPresentation();
  }, true);
  $("#stage").addEventListener("wheel", () => stopPresentation(), { passive: true });
  addEventListener("resize", () => { if (presenter.on) placePresenter(); });

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
  document.addEventListener("click", e => { if (!e.target.closest(".menu, .search, .district, .bell-wrap, .theme-wrap")) closeMenus(); });
  document.addEventListener("keydown", e => {
    if (presenter.on && document.activeElement !== $("#q")) {
      if (e.key === "Escape") { stopPresentation(); return; }
      if (e.key === "ArrowRight") { showSlide(presenter.i + 1); return; }
      if (e.key === "ArrowLeft") { showSlide(presenter.i - 1); return; }
      if (e.key === " ") { e.preventDefault(); togglePause(); return; }
    }
    if (e.key === "/" && document.activeElement !== $("#q")) { e.preventDefault(); $("#q").focus(); }
    if (e.key === "Escape" && document.activeElement !== $("#q")) { closeMenus(); if (!panel.hidden) { closePanel(); street.select(null); ctx = { kind: "all" }; setJourneyFor(null); renderKpis(); } }
  });
  app.addEventListener("click", e => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    e.preventDefault();
    const act = a.dataset.action;
    if (act === "present") presenter.on ? stopPresentation() : startPresentation();
    else if (act === "sound") { siren.setEnabled(!siren.enabled); prefs.set("ls.sound", siren.enabled ? "on" : "off"); syncSound(); }
    else if (act === "home") goHome();
    else if (act === "zoom-in") street.zoomBy(1.4);
    else if (act === "zoom-out") street.zoomBy(1 / 1.4);
    else if (act === "rotate-l") street.rotateBy(Math.PI / 8);
    else if (act === "rotate-r") street.rotateBy(-Math.PI / 8);
    else if (act === "close") { closePanel(); street.select(null); ctx = { kind: "all" }; setJourneyFor(null); setDistrictButton(null); renderKpis(); }
    else if (act === "refocus") {
      if (ctx.kind === "company") street.select("company", ctx.id);
      else if (ctx.kind === "vehicle") street.select("vehicle", ctx.id);
      else if (ctx.kind === "ambulance") street.select("ambulance", "hotfix");
      else if (ctx.kind === "lead") street.select("lead", "lead");
      else if (ctx.kind === "sector") street.focusSector(ctx.id);
      else street.select("hq", "loodos");
    }
  });
}

function finishBoot(is3d) {
  $("#loader").classList.add("done");
  const h = decodeURIComponent(location.hash.slice(1));
  if (h === "sunum" || h === "present") startPresentation();
  else if (h === "yeni-dukkan" && is3d) { street.select("lead", "lead"); showLead(); }
  else if (byCompany(h)) openCompany(h);
  else if (h.startsWith("mahalle/") && bySector(h.slice(8))) focusSector(h.slice(8));
  else if (h === "merkez") { street.select("hq", "loodos"); showHQ(); }
  else if (is3d) setTimeout(() => street.intro(), 300);
  setTimeout(() => $(".hint").classList.add("gone"), 9000);
}

boot().catch(err => {
  console.error(err);
  renderFallback(t("fb.err"));
  finishBoot(false);
});
