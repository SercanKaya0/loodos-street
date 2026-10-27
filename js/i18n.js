/* Dil seçimi ve arayüz metinleri. Katalog içeriği js/data.js (TR) ve js/data.en.js (EN) dosyalarından gelir. */

// Gizli sekme ya da engellenmiş site verisi localStorage'ı patlatabilir; tercih kaydı hiçbir zaman sayfayı düşürmez.
export const prefs = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* tercih bu oturumla sınırlı kalır */ } },
};

const LANGS = ["tr", "en"];
export const lang = (() => {
  const q = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(q)) return q;
  const saved = prefs.get("ls.lang");
  if (LANGS.includes(saved)) return saved;
  return (navigator.language || "tr").toLowerCase().startsWith("tr") ? "tr" : "en";
})();
document.documentElement.lang = lang;

export function setLang(l) {
  prefs.set("ls.lang", l);
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  location.replace(url.href);
}

// İngilizce veri logoları taşımaz; aynı sıradaki Türkçe şirketten alınır. EN dosyası yüklenemezse Türkçeyle devam edilir.
export function localData() {
  const tr = window.STREET, en = window.STREET_EN;
  if (lang !== "en" || !en || en.companies?.length !== tr.companies.length) return tr;
  en.companies.forEach((c, i) => { c.logo = tr.companies[i].logo; });
  return en;
}

export const locale = lang === "en" ? "en-GB" : "tr-TR";

const T = {
  tr: {
    "stage.aria": "Loodos Street 3D sokak haritası",
    "brand.aria": "Loodos Street, genel görünüm",
    "search.ph": "Dükkân, proje, ürün ya da sektör ara…",
    "search.aria": "Ara",
    "live": "Canlı",
    "live.title": "Sokaktaki araçlar canlı simüle ediliyor",
    "feed": "Canlı akış",
    "feed.empty": "Henüz teslimat yok; kamyonlar yolda.",
    "zoom.in": "Yakınlaştır", "zoom.out": "Uzaklaştır", "rot.l": "Sola döndür", "rot.r": "Sağa döndür", "home": "Genel görünüm",
    "journey": "Loodos ürün yolculuğu",
    "journey.hint": "Bir ürüne dokun, onu kullanan dükkânlar parlasın.",
    "journey.custom": "{c}: müşteriye özel geliştirme",
    "journey.none": "{p}: sokakta henüz bu ürünle açılmış bir dükkân yok. {promise}",
    "hint": "Sürükle: kaydır · Sağ tık: döndür · Tekerlek: yakınlaştır · Dükkâna ya da araca tıkla",
    "loading": "Sokak kuruluyor…",
    "stages": ["Yönetişim", "Edinim", "Etkileşim", "Aktivasyon", "Ticaret", "İçgörü", "Güven", "Karar"],

    "kpi.live": "↑ canlı", "kpi.projects": "Bu dükkândaki proje", "kpi.tech": "Kullanılan teknoloji", "kpi.shops": "{s} · dükkân",
    "kpi.project": "Proje", "kpi.vehicle": "Araç", "kpi.eta": "Varış", "kpi.speed": "Hız", "kpi.cargo": "Taşıdığı ürün",
    "sec": "sn", "now": "Şimdi", "kmh": "km/s",

    "all": "Sokak genel görünüm",
    "dist.sub": "{n} dükkân · {m} proje",
    "dist.all": "{a} mahalle · {b} proje",

    "p.focus": "Haritada göster", "p.close": "Kapat", "p.live": "Canlıda",
    "p.prodBuilt": "{name} ile ne yaptık",
    "p.custom": "Bu proje hazır bir Loodos ürünü kullanmadan, müşteriye özel geliştirildi.",
    "p.shots": "{c} {app} ekranları", "p.logo": "{name} logosu",
    "p.ctx": "Bağlam", "p.need": "İhtiyaç", "p.approach": "Yaklaşım", "p.features": "Neler yaptık", "p.products": "Loodos ürünleri", "p.tech": "Teknolojiler",
    "p.pdf": "Vaka çalışması PDF",

    "v.unloading": "Boşaltıyor · {n} sn", "v.onway": "Yolda", "v.return": "Depoya dönüyor", "v.noDelivery": "Teslimat yok",
    "v.ship": "Gönderi", "v.to": "Alıcı", "v.sector": "Mahalle", "v.eta": "Varış", "v.speed": "Hız", "v.cargo": "Yük", "v.product": "Ürün",
    "v.delivering": "Teslim ediliyor", "v.openShop": "Alıcı dükkânı aç", "v.showProduct": "Bu ürünün dükkânları",
    "v.type": "Tür", "v.resident": "Sokağın sakinlerinden biri; teslimat taşımıyor.",
    "v.kicker": "Loodos Lojistik · {type}", "v.delivery": "{shop} teslimatı", "v.track": "Canlı takip",
    "v.carries": "{p} taşıyor: yalnızca bu ürünü kullanan dükkânlara uğrar.",
    "veh.truck": "Kamyon", "veh.van": "Panelvan", "veh.car": "Otomobil", "veh.scooter": "Brific e-scooter",
    "tag.unloading": "Boşaltıyor", "tag.return": "Depoya dönüyor",
    "cargo": ["sürüm güncellemesi", "yeni modül kurulumu", "entegrasyon paketi", "bakım ve destek paketi"],
    "ev.delivered": "{id} · {shop} dükkânına {p} teslim edildi",

    "hq.kicker": "Loodos Merkez · İstanbul", "hq.pin": "Loodos Merkez", "hq.since": "2004'ten beri",
    "hq.roadmap": "Yol haritası", "hq.products": "Ürünler", "hq.street": "Sokakta",
    "hq.summary": "{a} dükkân, {b} proje, {c} mahalle. Bir dükkâna dokun, projenin hikâyesini aç.",
    "sector": "Mahalle", "sector.shops": "{n} dükkân", "sector.list": "Dükkânlar",
    "pin.open": "{name} dükkânını aç", "pin.projects": "{n} proje",

    "res.shops": "Dükkânlar", "res.products": "Ürünler", "res.sectors": "Mahalleler", "res.none": "“{q}” için sonuç yok.",

    "fb.nogl": "Bu tarayıcıda 3D (WebGL) kapalı.", "fb.fail": "3D sahne bu cihazda açılamadı.", "fb.err": "Bir şeyler ters gitti.",
    "fb.list": "Dükkânları liste olarak gösteriyoruz.",

    "lang.btn": "EN", "lang.aria": "Switch to English",
    "theme": "Görünüm",
    "theme.auto": "Otomatik", "theme.auto.d": "Saate göre gündüz ya da gece",
    "theme.light": "Gündüz", "theme.light.d": "Her zaman aydınlık",
    "theme.dark": "Gece", "theme.dark.d": "Sokak lambaları ve vitrinler yanar",
    "theme.cycle": "Gün döngüsü", "theme.cycle.d": "24 saat 2 dakikada geçer",

    "pr.start": "Sunum modu", "pr.title": "Sunum", "pr.prev": "Önceki", "pr.next": "Sonraki",
    "pr.pause": "Duraklat", "pr.play": "Devam et", "pr.stop": "Sunumu bitir",
    "pr.hq": "Loodos Merkez",
  },
  en: {
    "stage.aria": "Loodos Street 3D street map",
    "brand.aria": "Loodos Street, overview",
    "search.ph": "Search shops, projects, products or sectors…",
    "search.aria": "Search",
    "live": "Live",
    "live.title": "Vehicles on the street are simulated live",
    "feed": "Live feed",
    "feed.empty": "No deliveries yet; the trucks are on their way.",
    "zoom.in": "Zoom in", "zoom.out": "Zoom out", "rot.l": "Rotate left", "rot.r": "Rotate right", "home": "Overview",
    "journey": "Loodos product journey",
    "journey.hint": "Tap a product to light up the shops that use it.",
    "journey.custom": "{c}: custom-built for the client",
    "journey.none": "{p}: no shop on the street uses this product yet. {promise}",
    "hint": "Drag: pan · Right-click: rotate · Wheel: zoom · Click a shop or vehicle",
    "loading": "Building the street…",
    "stages": ["Governance", "Acquisition", "Engagement", "Activation", "Commerce", "Insight", "Trust", "Decision"],

    "kpi.live": "↑ live", "kpi.projects": "Projects in this shop", "kpi.tech": "Technologies used", "kpi.shops": "{s} · shops",
    "kpi.project": "Projects", "kpi.vehicle": "Vehicle", "kpi.eta": "Arrival", "kpi.speed": "Speed", "kpi.cargo": "Carrying",
    "sec": "s", "now": "Now", "kmh": "km/h",

    "all": "Street overview",
    "dist.sub": "{n} shops · {m} projects",
    "dist.all": "{a} districts · {b} projects",

    "p.focus": "Show on map", "p.close": "Close", "p.live": "Live",
    "p.prodBuilt": "What we built with {name}",
    "p.custom": "This project was custom-built for the client without a ready-made Loodos product.",
    "p.shots": "{c} {app} screens", "p.logo": "{name} logo",
    "p.ctx": "Context", "p.need": "Need", "p.approach": "Approach", "p.features": "What we built", "p.products": "Loodos products", "p.tech": "Technologies",
    "p.pdf": "Case study PDF",

    "v.unloading": "Unloading · {n} s", "v.onway": "On the way", "v.return": "Returning to depot", "v.noDelivery": "No delivery",
    "v.ship": "Shipment", "v.to": "Recipient", "v.sector": "District", "v.eta": "Arrival", "v.speed": "Speed", "v.cargo": "Cargo", "v.product": "Product",
    "v.delivering": "Delivering", "v.openShop": "Open recipient shop", "v.showProduct": "Shops using this product",
    "v.type": "Type", "v.resident": "One of the street's residents; not carrying a delivery.",
    "v.kicker": "Loodos Logistics · {type}", "v.delivery": "Delivery to {shop}", "v.track": "Live tracking",
    "v.carries": "Carrying {p}: it only stops at shops that use this product.",
    "veh.truck": "Truck", "veh.van": "Van", "veh.car": "Car", "veh.scooter": "Brific e-scooter",
    "tag.unloading": "Unloading", "tag.return": "Back to depot",
    "cargo": ["release update", "new module rollout", "integration package", "maintenance & support"],
    "ev.delivered": "{id} · {p} delivered to {shop}",

    "hq.kicker": "Loodos HQ · Istanbul", "hq.pin": "Loodos HQ", "hq.since": "Since 2004",
    "hq.roadmap": "Roadmap", "hq.products": "Products", "hq.street": "On the street",
    "hq.summary": "{a} shops, {b} projects, {c} districts. Tap a shop to open the story of its project.",
    "sector": "District", "sector.shops": "{n} shops", "sector.list": "Shops",
    "pin.open": "Open {name}", "pin.projects": "{n} projects",

    "res.shops": "Shops", "res.products": "Products", "res.sectors": "Districts", "res.none": "No results for “{q}”.",

    "fb.nogl": "3D (WebGL) is turned off in this browser.", "fb.fail": "The 3D scene couldn't start on this device.", "fb.err": "Something went wrong.",
    "fb.list": "Showing the shops as a list instead.",

    "lang.btn": "TR", "lang.aria": "Türkçeye geç",
    "theme": "Appearance",
    "theme.auto": "Automatic", "theme.auto.d": "Day or night by the clock",
    "theme.light": "Day", "theme.light.d": "Always light",
    "theme.dark": "Night", "theme.dark.d": "Street lamps and shop windows light up",
    "theme.cycle": "Day cycle", "theme.cycle.d": "24 hours in 2 minutes",

    "pr.start": "Presentation mode", "pr.title": "Presentation", "pr.prev": "Previous", "pr.next": "Next",
    "pr.pause": "Pause", "pr.play": "Resume", "pr.stop": "End presentation",
    "pr.hq": "Loodos HQ",
  },
};

const dict = T[lang];
export function t(key, vars) {
  const s = dict[key] ?? T.tr[key] ?? key;
  return vars && typeof s === "string" ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

// index.html'deki sabit metinler: data-i18n (metin), data-i18n-aria, data-i18n-ph, data-i18n-title
export function translateDom(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  root.querySelectorAll("[data-i18n-ph]").forEach(el => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
  root.querySelectorAll("[data-i18n-title]").forEach(el => el.setAttribute("title", t(el.dataset.i18nTitle)));
}
