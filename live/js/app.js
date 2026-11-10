/* WorkCity arayüz katmanı: giriş, HUD, canlı akış, detay çekmecesi, odak modu ve ses.
   Dünya (world.js) ve veri (feed.js) birbirini tanımaz; ikisini burası bağlar. */
import { createWorld } from "./world.js";
import { createFeed } from "./feed.js";

/* Loodos Hub içinde: veri Hub'dan gelir, giriş ve bağlantı ekranları yok (live.css body.embed). */
const hub = window.loodosHub;
if (hub) document.body.classList.add("embed");

const $ = s => document.querySelector(s);
const store = {
  get(k, d = null) { try { const v = localStorage.getItem("wc." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("wc." + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("wc." + k); } catch {} },
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LANE_TR = { todo: "Yapılacak", doing: "Sürüyor", review: "İncelemede", done: "Tamamlandı" };
const PRIO_TR = { highest: "En yüksek", high: "Yüksek", medium: "Orta", low: "Düşük" };
const SRC_TR = { jira: "Jira", gh: "GitHub", demo: "Demo", hub: "Loodos Hub" };
const GOAL = 3;
const today = () => new Date().toLocaleDateString("sv");
const ago = t => {
  const s = (Date.now() - t) / 1000;
  if (s < 45) return "şimdi";
  if (s < 3600) return `${Math.round(s / 60)} dk`;
  if (s < 86400) return `${Math.round(s / 3600)} sa`;
  return `${Math.round(s / 86400)} g`;
};

/* ---------- ses: kısa, yumuşak bildirim tınısı (Web Audio, dosya yok) ---------- */
let audio = null, soundOn = store.get("sound", true);
function chime(kind = "in") {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const notes = { in: [660, 990], done: [523, 659, 784], bad: [330, 262], soft: [880] }[kind] || [660];
    notes.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = audio.currentTime + i * .11;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + .55);
    });
  } catch {}
}
const syncSound = () => { $("#soundBtn").setAttribute("aria-pressed", soundOn); $("#soundBtn").classList.toggle("off", !soundOn); };
$("#soundBtn").addEventListener("click", () => { soundOn = !soundOn; store.set("sound", soundOn); syncSound(); chime("soft"); });
syncSound();

/* ---------- dünya ---------- */
const tip = $("#tip");
const world = createWorld($("#stage"), {
  onPick: p => { if (!p) return closeDrawer(); open(p); },
  onHover: (it, x, y) => {
    if (!it || !it.id) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.innerHTML = `<b>${esc(it.key)}</b> ${esc(it.title)}<small>${esc(LANE_TR[it.status])} · ${esc(it.project || it.repo || "")}</small>`;
    tip.style.transform = `translate(${Math.min(x + 14, innerWidth - 300)}px, ${y + 16}px)`;
  },
});

/* ---------- durum ---------- */
let state = { items: [], reviews: [], ci: { state: "none" }, src: {}, extra: {} };
let feed = null, pendingArrivals = new Set(), drawerView = null;
const log = [];

function doneDays() { return store.get("days", {}); }
function bumpDone() { const d = doneDays(); d[today()] = (d[today()] || 0) + 1; store.set("days", d); }
function streak() {
  const d = doneDays(); let n = 0; const day = new Date();
  if (!d[today()]) day.setDate(day.getDate() - 1);
  while (d[day.toLocaleDateString("sv")]) { n++; day.setDate(day.getDate() - 1); }
  return n;
}

function render() {
  const { items, reviews, ci } = state;
  const count = s => items.filter(i => i.status === s).length;
  world.setItems(items, pendingArrivals);
  pendingArrivals = new Set();
  world.setReviews(reviews.length);
  world.setCI(ci.state);
  const jiraOpen = items.filter(i => i.src === "jira" && i.status !== "done").length;
  const doneWeek = items.filter(i => i.status === "done").length;
  world.setOpen(jiraOpen);
  world.setFloors(3 + doneWeek);
  world.setBadge("jira", "Jira", `${jiraOpen} açık iş`);
  const prs = items.filter(i => i.kind === "pr" && i.status !== "done").length;
  world.setBadge("github", "GitHub", `${prs} açık PR`);
  world.setBadge("factory", "CI", { success: "Yeşil ✓", failure: "Kırık ✕", running: "Çalışıyor…", none: "Bekliyor" }[ci.state] || "—", ci.state);
  world.setBadge("office", "Ofisin", `${3 + Math.min(doneWeek, 15)} kat · bu hafta ${doneWeek} iş`);
  world.setBadge("mailbox", "İnceleme", reviews.length ? `${reviews.length} istek` : "boş", reviews.length ? "review" : "");
  const extra = state.extra ?? {};
  world.setRuns?.(extra.runs ?? 0);
  world.setReleases?.(extra.releases ?? 0);
  world.setCertWarning?.(!!extra.certWarning);
  if (extra.me?.name && !entered) enter(extra.me.name);

  const btns = $("#stats").children;
  [count("todo"), count("doing"), count("review"), reviews.length].forEach((n, i) => { btns[i].querySelector("b").textContent = n; });
  const dt = doneDays()[today()] || 0;
  $("#goalNum").textContent = `${Math.min(dt, 99)}/${GOAL}`;
  $("#goalRing").style.setProperty("--p", Math.min(1, dt / GOAL));
  $("#goalRing").classList.toggle("hit", dt >= GOAL);
  const st = streak();
  $("#streak").textContent = `🔥 ${st} gün`;
  $("#streak").classList.toggle("cold", !st);

  $("#sources").innerHTML = Object.entries(state.src).filter(([, s]) => s.mode !== "off")
    .map(([k, s]) => `<span class="chip ${s.mode}" title="${esc(s.error || s.label)}"><i></i>${esc(SRC_TR[k])}</span>`).join("");
  if (drawerView) open(drawerView, true);
}

/* ---------- canlı akış + bildirim ---------- */
const focus = { on: false, end: 0, queue: [], timer: 0 };
function describe(e) {
  const it = e.item, rv = e.review;
  switch (e.type) {
    case "assigned": return { icon: "📦", tone: "jira", text: `<b>${esc(it.key)}</b> sana atandı${e.by ? ` · ${esc(e.by)}` : ""}`, sub: it.title, fly: it.id };
    case "pr": return { icon: "⤴", tone: "gh", text: `PR açtın <b>${esc(it.key)}</b>`, sub: it.title, fly: it.id };
    case "moved": return { icon: it.status === "done" ? "✅" : "➜", tone: it.status, text: `<b>${esc(it.key)}</b> → ${LANE_TR[it.status]}${e.by === "sen" ? "" : ""}`, sub: it.title, fly: it.id };
    case "merged": return { icon: "🎉", tone: "done", text: `<b>${esc(it.key)}</b> merge edildi${e.by ? ` · ${esc(e.by)} onayladı` : ""}`, sub: it.title, fly: it.id };
    case "review": return { icon: "✉", tone: "review", text: `<b>${esc(rv.by || "Bir ekip arkadaşın")}</b> review istedi · ${esc(rv.key)}`, sub: rv.title, fly: "mailbox" };
    case "reviewDone": return { icon: "✓", tone: "", text: `Review isteği kapandı · ${esc(rv.key)}`, sub: rv.title, fly: "mailbox" };
    case "ci": return { icon: { success: "🟢", failure: "🔴", running: "🟡" }[e.ci.state] || "⚪", tone: e.ci.state, text: `CI ${{ success: "yeşil", failure: "kırıldı", running: "çalışıyor" }[e.ci.state] || e.ci.state}`, sub: e.ci.repo, fly: "factory" };
    case "release": return { icon: "📰", tone: "done", text: `Yeni release${e.latest ? ` · <b>${esc(e.latest)}</b>` : ""}`, sub: "Gazeteci çocuk duyurdu", fly: "github" };
    case "run": return { icon: "⚙", tone: "running", text: `${e.count} workflow çalışıyor`, sub: "Actions bandı döndü", fly: "factory", quiet: true };
    case "mention": return { icon: "@", tone: "", text: `<b>${esc(e.by)}</b> ${esc(it.key)} içinde senden bahsetti`, sub: it.title, fly: it.id };
    case "connected": return { icon: "⚡", tone: "", text: `${SRC_TR[e.src]} bağlandı${e.who ? ` · ${esc(e.who)}` : ""}`, sub: `${e.count} kayıt şehre yerleşti`, quiet: true };
    case "error": return { icon: "⚠", tone: "failure", text: `${SRC_TR[e.src]} okunamadı`, sub: e.text, quiet: true };
  }
  return null;
}
function onEvent(e) {
  const d = describe(e);
  if (!d) return;
  if (e.type === "assigned" || e.type === "pr") pendingArrivals.add(e.item.id);
  const isDone = (e.type === "moved" && e.item.status === "done") || e.type === "merged";
  if (isDone && (e.by === "sen" || e.type === "merged" || !e.item.demo)) bumpDone();
  if (e.type === "merged") world.celebrate("github");
  if (isDone) setTimeout(() => world.celebrate("office"), 900);
  for (const l of log) l.fresh = false;
  log.unshift({ ...d, at: e.at, fresh: true });
  log.length = Math.min(log.length, 50);
  renderLog();
  if (d.quiet && e.type !== "error") return;
  if (focus.on) { focus.queue.push(d); $("#focusQueue").textContent = `${focus.queue.length} bildirim bekliyor`; return; }
  toast(d);
  chime(isDone ? "done" : e.type === "error" || e.ci?.state === "failure" ? "bad" : "in");
}
function renderLog() {
  $("#feedList").innerHTML = log.map((d, i) => `<li data-i="${i}" class="t-${d.tone || ""}${d.fresh ? " fresh" : ""}"><span class="ic">${d.icon}</span><div><p>${d.text}</p><small>${esc(d.sub || "")}</small></div><time>${ago(d.at)}</time></li>`).join("");
}
$("#feedList").addEventListener("click", e => { const li = e.target.closest("li"); if (li) goTo(log[li.dataset.i]?.fly); });
$("#feedToggle").addEventListener("click", () => { const c = $("#feed").classList.toggle("collapsed"); $("#feedToggle").textContent = c ? "+" : "–"; });
setInterval(renderLog, 30e3);

function toast(d) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `toast t-${d.tone || ""}`;
  el.innerHTML = `<span class="ic">${d.icon}</span><div><p>${d.text}</p><small>${esc(d.sub || "")}</small></div>`;
  el.addEventListener("click", () => { goTo(d.fly); el.remove(); });
  $("#toasts").prepend(el);
  while ($("#toasts").children.length > 3) $("#toasts").lastChild.remove();
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 6500);
}
function goTo(fly) {
  if (!fly) return;
  if (fly.includes(":")) { const it = state.items.find(i => i.id === fly); world.flyTo(fly); if (it) open({ type: "item", item: it }); }
  else { world.flyTo(fly); open({ type: fly }); }
}

/* ---------- detay çekmecesi ---------- */
const itemRow = it => `<li><button type="button" data-item="${esc(it.id)}"><span class="pr p-${it.kind === "pr" ? "pr" : it.prio}"></span><b>${esc(it.key)}</b><span class="tt">${esc(it.title)}</span><em class="st s-${it.status}">${LANE_TR[it.status]}</em></button></li>`;
const ext = (url, label) => url ? `<a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">${label} ↗</a>` : `<span class="btn ghost disabled" title="Demo verisi">${label} ↗</span>`;
function open(p, quiet = false) {
  if (!p) return;
  if (p.type === "item" && p.item) p = { type: "item", item: state.items.find(i => i.id === p.item.id) || p.item };
  drawerView = p;
  world.select(p.type === "item" ? p.item.id : null);
  let h = "";
  const { items, reviews, ci } = state;
  if (p.type === "item") {
    const it = p.item;
    const canMove = it.src === "jira" || it.demo;
    h = `<p class="eyebrow ${it.src}">${it.src === "jira" ? "Jira" : "GitHub"} · ${esc(it.type || "")}</p>
      <h2><span class="key">${esc(it.key)}</span> ${esc(it.title)}</h2>
      <dl class="meta"><div><dt>Durum</dt><dd><em class="st s-${it.status}">${LANE_TR[it.status]}</em>${it.statusName ? ` <small>${esc(it.statusName)}</small>` : ""}</dd></div>
      <div><dt>Öncelik</dt><dd><span class="pr p-${it.kind === "pr" ? "pr" : it.prio}"></span>${PRIO_TR[it.prio] || "—"}</dd></div>
      <div><dt>Proje</dt><dd>${esc(it.project || it.repo || "—")}</dd></div>
      <div><dt>Güncellendi</dt><dd>${ago(it.updated)} önce</dd></div></dl>
      ${canMove ? `<p class="label">Kasayı taşı</p><div class="moves">${["todo", "doing", "review", "done"].map(s => `<button type="button" data-move="${s}" class="mv s-${s}" ${s === it.status ? "disabled" : ""}>${LANE_TR[s]}</button>`).join("")}</div><p class="err" id="moveErr" hidden></p>` : `<p class="hint">GitHub işleri GitHub'da ilerledikçe şehirde kendiliğinden yer değiştirir.</p>`}
      <div class="acts">${ext(it.url, it.src === "jira" ? "Jira'da aç" : "GitHub'da aç")}</div>`;
  } else if (p.type === "jira") {
    const mine = items.filter(i => i.src === "jira");
    h = `<p class="eyebrow jira">Jira Kulesi</p><h2>Sana atanan işler</h2>
      <p class="lead">Kulenin köşesindeki mavi ışıklar açık işlerini sayar. Yeni bir iş atandığında çatıdaki dron kasayı meydana indirir.</p>
      ${["todo", "doing", "review", "done"].map(s => { const l = mine.filter(i => i.status === s); return l.length ? `<p class="label">${LANE_TR[s]} · ${l.length}</p><ul class="rows">${l.map(itemRow).join("")}</ul>` : ""; }).join("") || `<p class="hint">Jira bağlı değil ya da üzerinde açık iş yok.</p>`}`;
  } else if (p.type === "github") {
    const mine = items.filter(i => i.src === "gh");
    h = `<p class="eyebrow gh">GitHub</p><h2>PR'ların ve issue'ların</h2>
      ${mine.length ? `<ul class="rows">${mine.map(itemRow).join("")}</ul>` : `<p class="hint">GitHub bağlı değil ya da açık PR yok.</p>`}
      <p class="label">CI</p><p>${ciLine(ci)}</p>`;
  } else if (p.type === "factory") {
    h = `<p class="eyebrow gh">Actions fabrikası</p><h2>CI durumu</h2>
      <p class="lead">Bacadaki duman son PR'ının kontrol sonuçlarını gösterir: beyaz yeşil, sarı çalışıyor, kızıl kırık.</p>
      <p class="ci-big ci-${ci.state}">${ciLine(ci)}</p><div class="acts">${ext(ci.url, "Kontrolleri aç")}</div>`;
  } else if (p.type === "mailbox") {
    h = `<p class="eyebrow review">İnceleme kutusu</p><h2>${reviews.length ? `${reviews.length} review seni bekliyor` : "Kutun boş"}</h2>
      <p class="lead">Ekip arkadaşların review istediğinde kutunun üstünde bir zarf belirir.</p>
      <ul class="rows">${reviews.map(r => `<li><a href="${esc(r.url || "#")}" ${r.url ? 'target="_blank" rel="noopener"' : ""}><span class="pr p-pr"></span><b>${esc(r.key)}</b><span class="tt">${esc(r.title)}</span><em class="st">${esc(r.by || "")}</em></a></li>`).join("")}</ul>`;
  } else if (p.type === "office") {
    const done = items.filter(i => i.status === "done");
    const dt = doneDays()[today()] || 0;
    h = `<p class="eyebrow">Ofisin</p><h2>${esc(store.get("name", ""))}</h2>
      <p class="lead">Son 7 günde bitirdiğin her iş binana bir kat ekler. Hedef: günde ${GOAL} iş.</p>
      <dl class="meta"><div><dt>Bu hafta</dt><dd>${done.length} iş</dd></div><div><dt>Bugün</dt><dd>${dt}/${GOAL}</dd></div><div><dt>Seri</dt><dd>${streak()} gün</dd></div><div><dt>Kat</dt><dd>${3 + Math.min(done.length, 15)}</dd></div></dl>
      ${done.length ? `<p class="label">Son bitenler</p><ul class="rows">${done.sort((a, b) => b.updated - a.updated).slice(0, 8).map(itemRow).join("")}</ul>` : ""}`;
  } else if (p.type === "plaza") {
    h = `<p class="eyebrow">Kanban meydanı</p><h2>Tüm işlerin</h2>
      <p class="lead">Her kasa bir iş. Kasaya tıklayıp şeridini değiştirebilirsin; Jira'ya da aynı anda işlenir.</p>
      ${["todo", "doing", "review", "done"].map(s => { const l = items.filter(i => i.status === s); return l.length ? `<p class="label">${LANE_TR[s]} · ${l.length}</p><ul class="rows">${l.map(itemRow).join("")}</ul>` : ""; }).join("")}`;
  } else if (["todo", "doing", "review", "done"].includes(p.type)) {
    const l = items.filter(i => i.status === p.type);
    h = `<p class="eyebrow">Kanban meydanı</p><h2>${LANE_TR[p.type]} · ${l.length}</h2><ul class="rows">${l.map(itemRow).join("")}</ul>`;
  } else return;
  $("#drawerBody").innerHTML = h;
  const dr = $("#drawer");
  if (dr.hidden) { dr.hidden = false; requestAnimationFrame(() => dr.classList.add("in")); }
  if (!quiet) dr.scrollTop = 0;
}
const ciLine = ci => `${{ success: "🟢 Tüm kontroller geçti", failure: "🔴 Kontroller kırık", running: "🟡 Kontroller çalışıyor", none: "⚪ Henüz kontrol yok" }[ci.state] || "—"}${ci.repo ? ` · <code>${esc(ci.repo)}</code>` : ""}`;
function closeDrawer() { drawerView = null; world.select(null); const dr = $("#drawer"); dr.classList.remove("in"); setTimeout(() => { if (!drawerView) dr.hidden = true; }, 250); }
$("#drawerClose").addEventListener("click", closeDrawer);
$("#drawerBody").addEventListener("click", async e => {
  const row = e.target.closest("[data-item]");
  if (row) { const it = state.items.find(i => i.id === row.dataset.item); if (it) { world.flyTo(it.id); open({ type: "item", item: it }); } return; }
  const mv = e.target.closest("[data-move]");
  if (mv && drawerView?.type === "item") {
    const err = $("#moveErr");
    mv.classList.add("busy");
    try { await feed.move(drawerView.item.id, mv.dataset.move); }
    catch (x) { if (err) { err.hidden = false; err.textContent = x.message; } }
    mv.classList.remove("busy");
  }
});
addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
for (const b of document.querySelectorAll("[data-fly]")) b.addEventListener("click", () => {
  const f = b.dataset.fly;
  if (["todo", "doing", "review"].includes(f)) { world.flyTo("plaza"); open({ type: f }); }
  else { world.flyTo(f); open({ type: f }); }
});

/* ---------- gün saati ---------- */
const syncTime = m => { for (const b of $("#timeSeg").children) b.setAttribute("aria-checked", b.dataset.time === m); };
$("#timeSeg").addEventListener("click", e => { const b = e.target.closest("[data-time]"); if (!b) return; store.set("time", b.dataset.time); world.setTimeMode(b.dataset.time); syncTime(b.dataset.time); });
const tm = store.get("time", "auto");
world.setTimeMode(tm); syncTime(tm);

/* ---------- odak modu: 25 dk, bildirimler bekletilir ---------- */
function setFocus(on) {
  focus.on = on;
  document.body.classList.toggle("focusing", on);
  $("#focusBar").hidden = !on;
  world.setFocus(on);
  clearInterval(focus.timer);
  if (on) {
    focus.end = Date.now() + 25 * 60e3; focus.queue = []; $("#focusQueue").textContent = "";
    const tick = () => { const s = Math.max(0, (focus.end - Date.now()) / 1000 | 0); $("#focusTime").textContent = `${String(s / 60 | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; if (!s) setFocus(false); };
    tick(); focus.timer = setInterval(tick, 1000);
  } else {
    const q = focus.queue.length;
    chime("done");
    toast({ icon: "☕", tone: "done", text: `<b>Odak bitti</b>`, sub: q ? `Sen odaktayken ${q} bildirim geldi; akışta seni bekliyor.` : "Bu arada hiçbir şey kaçırmadın." });
    focus.queue = [];
  }
}
$("#focusBtn").addEventListener("click", () => setFocus(!focus.on));
$("#focusStop").addEventListener("click", () => setFocus(false));

/* ---------- veri ---------- */
function restartFeed() {
  feed?.stop();
  log.length = 0; renderLog();
  state = { items: [], reviews: [], ci: { state: "none" }, src: {}, extra: {} };
  render();
  feed = createFeed((type, payload) => {
    if (type === "event") onEvent(payload);
    else { state = payload; render(); }
  });
  feed.start();
}
addEventListener("focus", () => feed?.refresh());

/* ---------- giriş ---------- */
let entered = false;
function enter(name) {
  entered = true;
  store.set("name", name);
  $("#street").textContent = `📍 ${name} Caddesi`;
  document.title = `${name} · Loodos WorkCity`;
  world.setName(name);
  world.attract(false);
  $("#login").classList.add("gone");
  document.body.classList.add("in");
  if (!hub) restartFeed();
}
$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("#loginName").value.trim().replace(/\s+/g, " ");
  if (!n) return;
  enter(n);
  world.intro();
});

const saved = store.get("name") || (() => { try { return localStorage.getItem("ls.name"); } catch { return null; } })();
world.setName(saved || "WorkCity");
if (hub) {
  // The name comes with the first state from the Hub (the Google account); the city starts at once.
  $("#login").classList.add("gone");
  document.body.classList.add("in");
  restartFeed();
  world.intro();
} else if (store.get("name")) enter(store.get("name"));
else { $("#loginName").value = saved || ""; world.attract(true); setTimeout(() => $("#loginName").focus(), 300); }
requestAnimationFrame(() => setTimeout(() => $("#loader").classList.add("done"), 400));
