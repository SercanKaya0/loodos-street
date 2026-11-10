/* WorkCity veri katmanı. Üç kaynak aynı biçime çevrilir:
   item   = { id, src: "jira"|"gh", kind: "issue"|"pr", key, title, status: todo|doing|review|done, prio, type, project, repo, url, updated }
   review = { id, key, title, repo, by, url, updated }
   ci     = { state: success|failure|running|none, name, repo, url }
   Loodos Hub içinde gerçek veri Hub'dan gelir (window.loodosHub); dışarıda demo kaynağı canlı akışı taklit eder.
   Her yenilemede eski/yeni karşılaştırılır, farklar "event" olarak yayınlanır, ardından tam durum "state" olarak gider. */

const DAY = 864e5;
const now = () => Date.now();

export function createFeed(emit) {
  const items = new Map(), reviews = new Map();
  const src = { demo: { mode: "off" }, hub: { mode: "off" } };
  let ci = { state: "none" };
  const timers = [];
  let stopped = false;

  const publish = () => emit("state", { items: [...items.values()], reviews: [...reviews.values()], ci, src: structuredClone(src), extra: structuredClone(extra ?? {}) });
  const event = e => emit("event", { at: now(), ...e });

  /* Bir kaynağın yeni listesini eskisiyle karşılaştırır; ilk yüklemede olay üretmez */
  function merge(map, prefix, list, first, on) {
    const seen = new Set();
    for (const it of list) {
      seen.add(it.id);
      const old = map.get(it.id);
      map.set(it.id, it);
      if (first) continue;
      if (!old) on.added?.(it);
      else if (old.status !== it.status) on.moved?.(it, old.status);
    }
    for (const [id, old] of [...map]) if (id.startsWith(prefix) && !seen.has(id)) { map.delete(id); if (!first) on.removed?.(old); }
  }

  /* ---------------- DEMO ---------------- */
  const TEAM = ["Ayşe", "Mert", "Elif", "Burak", "Zeynep", "Can", "Deniz"];
  const PICK = a => a[Math.random() * a.length | 0];
  const demoIssue = (key, title, status, prio, type, project, ageH = 4) =>
    ({ id: `jira:${key}`, src: "jira", kind: "issue", key, title, status, prio, type, project, url: "", updated: now() - ageH * 36e5, demo: true });
  const demoPR = (repo, n, title, status, ageH = 3) =>
    ({ id: `gh:${repo}#${n}`, src: "gh", kind: "pr", key: `#${n}`, title, status, prio: "medium", type: "PR", repo, project: repo.split("/")[1], url: "", updated: now() - ageH * 36e5, demo: true });
  const POOL = [
    ["AHD-431", "Kampanya detayında deeplink açılmıyor", "high", "Bug", "A101 Hadi"],
    ["KDW-221", "Sipariş takibinde canlı kurye konumu", "medium", "Story", "Kahve Dünyası"],
    ["SXP-1107", "Biniş kartı Wallet'a eklenince saat dilimi kayıyor", "highest", "Bug", "SunExpress"],
    ["VFY-92", "Fatura ekranında erişilebilirlik etiketleri", "low", "Task", "Vodafone Yanımda"],
    ["BRF-340", "Sürüş sonu fotoğrafında kamera izni akışı", "high", "Bug", "Brific"],
    ["LCW-518", "Kazanıyorum puan geçmişi için boş durum tasarımı", "medium", "Story", "LCW"],
    ["AHD-437", "Sepet özetinde kargo bedava eşiği yanlış", "high", "Bug", "A101 Hadi"],
    ["ZRL-64", "Şarj istasyonu haritasında kümeleme", "medium", "Task", "Zorlu Enerji"],
    ["IKS-155", "Bilet QR kodu karanlık modda okunmuyor", "highest", "Bug", "İKSV"],
    ["WWK-48", "Sesli yönlendirme metinlerinin güncellenmesi", "low", "Task", "WeWALK"],
  ];
  const REVIEW_POOL = [
    ["loodos/sunexpress-ios", 778, "Koltuk haritası SwiftUI'a taşındı"],
    ["loodos/brific-ios", 102, "BLE yeniden bağlanma stratejisi"],
    ["loodos/a101-hadi-ios", 491, "Kupon servisinin async/await geçişi"],
    ["loodos/kd-android", 233, "Sipariş ekranı Compose refactor"],
    ["loodos/vodafone-yanimda", 88, "Snapshot testleri eklendi"],
    ["loodos/zorlu-enerji-ios", 57, "Harita kümelemesi için MKClusterAnnotation"],
  ];
  let poolI = 0, reviewI = 2, seq = 900;

  function startDemo() {
    src.demo = { mode: "live", label: "Demo" };
    const seed = [
      demoIssue("AHD-412", "Sepette kupon tekrar uygulanınca toplam yanlış hesaplanıyor", "doing", "high", "Bug", "A101 Hadi", 2),
      demoIssue("SXP-1093", "Check-in akışında koltuk seçimi analitik eventleri", "todo", "medium", "Task", "SunExpress", 20),
      demoIssue("KDW-208", "Ödeme sonrası push bildirimi iki kez geliyor", "todo", "highest", "Bug", "Kahve Dünyası", 6),
      demoIssue("VFY-77", "Ana sayfa açılış süresi ölçümü", "todo", "low", "Task", "Vodafone Yanımda", 40),
      demoIssue("BRF-331", "Kilit açma ekranında BLE zaman aşımı", "doing", "high", "Bug", "Brific", 5),
      demoIssue("LCW-502", "Sadakat puanı ekranı için skeleton loading", "todo", "medium", "Story", "LCW", 30),
      demoIssue("AHD-405", "Siparişlerim listesinde sayfalama", "review", "medium", "Story", "A101 Hadi", 9),
      demoIssue("IKS-149", "Etkinlik takviminde filtre durumu korunmuyor", "done", "medium", "Bug", "İKSV", 26),
      demoIssue("ZRL-58", "Dark mode renk token'larının güncellenmesi", "done", "low", "Task", "Zorlu Enerji", 50),
      demoIssue("SXP-1088", "Uçuş durumu widget'ında kırpılan başlık", "done", "high", "Bug", "SunExpress", 3),
      demoPR("loodos/a101-hadi-ios", 482, "Kupon hesaplama düzeltmesi", "review", 1),
      demoPR("loodos/kd-ios", 219, "Push tekrarını engelleyen idempotency anahtarı", "doing", 2),
      demoPR("loodos/brific-ios", 98, "Kilit açma zaman aşımı 8 sn → 15 sn", "done", 30),
    ];
    for (const it of seed) items.set(it.id, it);
    for (const [repo, n, title] of REVIEW_POOL.slice(0, 2)) reviews.set(`ghr:${repo}#${n}`, { id: `ghr:${repo}#${n}`, key: `#${n}`, title, repo, by: PICK(TEAM), url: "", updated: now() - 36e5, demo: true });
    ci = { state: "success", name: "iOS · build & test", repo: "loodos/a101-hadi-ios", url: "" };
    publish();
    event({ type: "connected", src: "demo", count: items.size });
    const next = first => { if (!stopped) timers.push(setTimeout(() => { demoTick(); next(); }, first ? 7000 : 16000 + Math.random() * 18000)); };
    next(true);
  }

  let ticks = 0;
  function demoTick() {
    const r = ticks++ === 0 ? 0 : Math.random(); // ilk olay hep yeni atama: dron hemen görünsün
    const open = [...items.values()];
    if (r < .38) {
      const p = POOL[poolI++ % POOL.length];
      const key = poolI > POOL.length ? `${p[0].split("-")[0]}-${++seq}` : p[0];
      const it = demoIssue(key, p[1], "todo", p[2], p[3], p[4], 0);
      items.set(it.id, it);
      event({ type: "assigned", item: it, by: PICK(TEAM) });
    } else if (r < .56) {
      const p = REVIEW_POOL[reviewI++ % REVIEW_POOL.length];
      const n = reviewI > REVIEW_POOL.length ? p[1] + reviewI : p[1];
      const rv = { id: `ghr:${p[0]}#${n}`, key: `#${n}`, title: p[2], repo: p[0], by: PICK(TEAM), url: "", updated: now(), demo: true };
      if (reviews.has(rv.id)) return demoTick();
      reviews.set(rv.id, rv);
      event({ type: "review", review: rv });
    } else if (r < .76) {
      ci = { ...ci, state: "running", repo: PICK(["loodos/a101-hadi-ios", "loodos/kd-ios", "loodos/brific-ios"]) };
      event({ type: "ci", ci });
      timers.push(setTimeout(() => {
        ci = { ...ci, state: Math.random() < .78 ? "success" : "failure" };
        event({ type: "ci", ci });
        publish();
      }, 9000));
    } else if (r < .88) {
      const pr = open.find(i => i.kind === "pr" && i.status === "review");
      if (!pr) { const d = open.find(i => i.kind === "pr" && i.status === "doing"); if (d) { d.status = "review"; d.updated = now(); event({ type: "moved", item: d, from: "doing", by: "sen" }); } else return; }
      else { pr.status = "done"; pr.updated = now(); event({ type: "merged", item: pr, by: PICK(TEAM) }); }
    } else {
      const it = PICK(open.filter(i => i.status !== "done"));
      if (!it) return;
      event({ type: "mention", item: it, by: PICK(TEAM) });
    }
    publish();
  }

  /* ---------------- LOODOS HUB ----------------
     Hub (Electron) bu sayfayı kendi içinde açar ve window.loodosHub köprüsünü verir: Jira, GitHub,
     Actions, release ve sertifika verisi Hub'da okunur, buraya yalnızca özet gelir; token hiç gelmez.
     loodosHub.onState(cb) → { me, items, reviews, ci, runs, releases, certWarning }
     loodosHub.move(key, to) · loodosHub.open(url) · loodosHub.refresh() */
  const hub = window.loodosHub;
  let hubFirst = true;
  const extra = { me: null, runs: 0, releases: 0, certWarning: false };

  function onHubState(next) {
    const list = next.items ?? [];
    merge(items, "", list, hubFirst, {
      added: it => event({ type: it.kind === "pr" ? (it.status === "done" ? "merged" : "pr") : it.status === "done" ? "moved" : "assigned", item: it }),
      moved: (it, from) => event({ type: it.kind === "pr" && it.status === "done" ? "merged" : "moved", item: it, from }),
    });
    merge(reviews, "", next.reviews ?? [], hubFirst, { added: rv => event({ type: "review", review: rv }), removed: rv => event({ type: "reviewDone", review: rv }) });
    const nextCi = next.ci ?? { state: "none" };
    if (!hubFirst && nextCi.state !== ci.state) event({ type: "ci", ci: nextCi });
    ci = nextCi;
    if (!hubFirst && (next.releases ?? 0) > extra.releases) event({ type: "release", count: next.releases - extra.releases, latest: next.latestRelease });
    if (!hubFirst && (next.runs ?? 0) > extra.runs) event({ type: "run", count: next.runs });
    Object.assign(extra, { me: next.me ?? null, runs: next.runs ?? 0, releases: next.releases ?? 0, certWarning: !!next.certWarning, latestRelease: next.latestRelease });
    for (const e of next.events ?? []) event(e);
    if (hubFirst) event({ type: "connected", src: "hub", count: list.length, who: next.me?.name });
    hubFirst = false;
    src.hub = { mode: "live", label: "Loodos Hub", at: now() };
    publish();
  }

  /* ---------------- dışa açık ---------------- */
  function start() {
    if (!hub) return startDemo();
    src.hub = { mode: "wait", label: "Loodos Hub" };
    publish();
    hub.onState(onHubState);
  }
  function refresh() { hub?.refresh?.(); }
  function stop() { stopped = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); }

  /* Durum değişikliği: demo'da yerel, Hub'da Jira'ya gerçek geçiş (transition) */
  async function move(id, to) {
    const it = items.get(id);
    if (!it || it.status === to) return;
    if (!hub) {
      const from = it.status;
      Object.assign(it, { status: to, updated: now() });
      event({ type: "moved", item: it, from, by: "sen" });
      publish();
      return;
    }
    if (it.src !== "jira") throw new Error("Bu iş yalnızca GitHub üzerinden değişebilir.");
    await hub.move(it.key, to);
  }

  return { start, stop, refresh, move, isDemo: () => !hub, extra: () => extra, isHub: () => !!hub };
}
