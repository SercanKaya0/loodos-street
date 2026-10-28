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

    "sound.on": "Sireni kapat", "sound.off": "Sireni aç",
    "event": "Özel gün",
    "hol.4-23": ["23 Nisan", "Ulusal Egemenlik ve Çocuk Bayramımız Kutlu Olsun"],
    "hol.5-19": ["19 Mayıs", "Atatürk'ü Anma, Gençlik ve Spor Bayramımız Kutlu Olsun"],
    "hol.8-30": ["30 Ağustos", "Zafer Bayramımız Kutlu Olsun"],
    "hol.10-29": ["29 Ekim", "Cumhuriyet Bayramımız Kutlu Olsun"],
    "hol.year": "{n}. yıl", "ny.line": "Mutlu Yıllar", "ny.small": "Loodos ailesinden",
    "ev.auto": "Tarihe göre", "ev.auto.d": "Bayramlarda bayrak ve havai fişek, yılbaşında ışıklar; şu an: {now}",
    "ev.none": "Yok", "ev.none.d": "Her zamanki sokak",
    "ev.national": "Ulusal bayram", "ev.national.d": "Direklerde Türk bayrakları, akşam havai fişek",
    "ev.newyear": "Yılbaşı", "ev.newyear.d": "Ağaçlarda ışıklar, meydanda yılbaşı ağacı, kar",
    "weather": "Hava",
    "wx.auto": "Mevsime göre", "wx.auto.d": "Aya göre yağmur ya da kar; şu an: {now}",
    "wx.clear": "Açık", "wx.clear.d": "Yağış yok",
    "wx.rain": "Yağmur", "wx.rain.d": "Kapalı gökyüzü, sağanakta şimşek",
    "wx.snow": "Kar", "wx.snow.d": "Çatılar ve ağaçlar beyazlar",
    "amb.side": "LOODOS · BUG AMBULANSI",
    "amb.kicker": "Loodos Hotfix · Bug ambulansı",
    "amb.tag.onsite": "Hata ayıklanıyor", "amb.tag.fixed": "✓ Çözüldü",
    "amb.st.enroute": "Olay yerine gidiyor", "amb.st.onsite": "Yerinde hata ayıklıyor · {n} sn", "amb.st.leaving": "Düzeltme yayında", "amb.st.idle": "Merkezde hazır bekliyor",
    "amb.idle.title": "Hotfix ekibi", "amb.idle.sub": "Yeni bir bug bildirimi bekleniyor", "amb.idle.next": "Sıradaki çağrı yaklaşık {n} sn sonra.",
    "amb.steps": ["Bildirildi", "Ekip yola çıktı", "Yerinde inceleme", "Düzeltme yayında"],
    "amb.shop": "Dükkân", "amb.project": "Proje", "amb.platform": "Platform", "amb.sev": "Öncelik", "amb.affected": "Etkilenen kullanıcı",
    "amb.eta": "Varış", "amb.resp": "Müdahale süresi", "amb.fix": "Çözüm süresi", "amb.elapsed": "Geçen süre", "amb.cf": "Crash-free oranı",
    "amb.team": "Ekip", "amb.roles": ["iOS", "Android", "Backend", "QA"],
    "amb.ledger": "Bug hesabı · bu oturum", "amb.opened": "Bildirilen", "amb.resolved": "Çözülen", "amb.open": "Açık",
    "amb.avgFix": "Ort. çözüm süresi", "amb.avgResp": "Ort. müdahale", "amb.rate": "Çözüm oranı",
    "amb.note": "Simülasyon: 1 sn = 1 dk. Rakamlar bu oturumda sokakta açılıp kapanan görevlerden hesaplanır.",
    "amb.openShop": "Dükkânı aç", "min": "dk",
    "sev.P1": "P1 · Kritik", "sev.P2": "P2 · Yüksek", "sev.P3": "P3 · Orta",
    "kpi.fixed": "Çözülen bug", "kpi.avgFix": "Ort. çözüm süresi", "kpi.openBugs": "Açık bug",
    "bug.titles": ["Ödeme adımında uygulama çöküyor", "Push bildirimine dokununca boş ekran açılıyor", "Sepet tutarı indirimden sonra yanlış hesaplanıyor",
      "Giriş sonrası oturum kendiliğinden düşüyor", "Android 15'te kamera izni döngüye giriyor", "Kampanya linki yanlış ekrana gidiyor",
      "Harita ekranında bellek sızıntısı", "Kart ekleme formunu klavye kapatıyor", "Sadakat puanı iki kez yükleniyor", "Karanlık modda buton metni görünmüyor"],
    "ev.dispatch": "{id} · Hotfix ekibi {shop} için yola çıktı",
    "amb.term.shipped": "{shop} · hotfix yayında",
    "lead.name": "Sizin dükkânınız", "lead.kicker": "Yakında", "lead.title": "Bu dükkân sizin olabilir",
    "lead.sub": "Sektörünüzü ve ilgilendiğiniz ürünleri seçin; bina sizin için yükselsin.",
    "lead.sector": "Sektörünüz", "lead.products": "İlgilendiğiniz Loodos ürünleri", "lead.refs": "Bu alanda birlikte çalıştığımız markalar",
    "lead.trucks": "{n} ürünün teslimat kamyonu parselinize yola çıktı; bina {f} kata yükseliyor.",
    "lead.cta": "Loodos ile iletişime geç", "lead.reset": "Seçimi temizle",
    "lead.sign1": "YAKINDA", "lead.sign2": "Sizin uygulamanız", "lead.sign3": "Tıklayın, birlikte inşa edelim",
    "impact.title": "ETKİ KULESİ", "impact.pin": "Etki kulesi", "impact.del": "Teslimat", "impact.rel": "Release duyurusu", "impact.bug": "Çözülen bug", "impact.fire": "Söndürülen yangın",
    "news.release": "Yeni release! {app} {v} yayında", "news.feed": "📰 Yeni release: {app} {v} yayında", "news.sub": "Gazeteci çocuk duyurdu",
    "chat.prod": ["{p} entegrasyonu bitti, testteyiz.", "{p} için yarın müşteri demosu var.", "{p} paneli çok iyi görünüyor.", "{p} yeni sürüm notlarını yazdım."],
    "chat.reply": ["Harika iş! 👏", "Demo ne zaman?", "Crash-free hâlâ %99,9 üstünde.", "Bunu playground'a ekleyelim.", "Sprint review'da gösterelim.", "Müşteri çok memnun kaldı.", "Kahve molasında anlat 😄", "Store puanı da yükseldi!", "Bir de Vendica'yı önerelim mi?", "Ekip gerçekten uçtu 🚀"],
    "ev.fire": "{id} · Prod yangını: {shop} · HOTFIX itfaiyesi yolda",
    "ev.fireOut": "{id} · {shop} yangını HOTFIX ekibince {m} dk'da söndürüldü",
    "fire.tag.spray": "Söndürülüyor", "fire.tag.out": "✓ Söndürüldü",
    "fire.titles": ["Ödeme servisi çöktü", "API 500 hatası veriyor", "Veritabanı bağlantı havuzu doldu", "Kampanya trafiği sunucuyu yaktı",
      "SSL sertifikasının süresi doldu", "Bellek sızıntısı sunucuyu kilitledi", "Kuyruk birikti, siparişler düşmüyor"],
    "ev.fixed": "{id} · {shop} hatası {m} dk'da çözüldü",
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

    "sound.on": "Mute siren", "sound.off": "Unmute siren",
    "event": "Special day",
    "hol.4-23": ["23 April", "Happy National Sovereignty and Children's Day"],
    "hol.5-19": ["19 May", "Happy Commemoration of Atatürk, Youth and Sports Day"],
    "hol.8-30": ["30 August", "Happy Victory Day"],
    "hol.10-29": ["29 October", "Happy Republic Day"],
    "hol.year": "{n} anniversary", "ny.line": "Happy New Year", "ny.small": "From the Loodos family",
    "ev.auto": "By date", "ev.auto.d": "Flags and fireworks on national days, lights at New Year; now: {now}",
    "ev.none": "None", "ev.none.d": "The usual street",
    "ev.national": "National holiday", "ev.national.d": "Turkish flags on the poles, fireworks in the evening",
    "ev.newyear": "New Year", "ev.newyear.d": "Lights on the trees, a New Year tree in the square, snow",
    "weather": "Weather",
    "wx.auto": "By season", "wx.auto.d": "Rain or snow by month; now: {now}",
    "wx.clear": "Clear", "wx.clear.d": "No precipitation",
    "wx.rain": "Rain", "wx.rain.d": "Overcast sky, lightning in downpours",
    "wx.snow": "Snow", "wx.snow.d": "Roofs and trees turn white",
    "amb.side": "LOODOS · BUG AMBULANCE",
    "amb.kicker": "Loodos Hotfix · Bug ambulance",
    "amb.tag.onsite": "Debugging", "amb.tag.fixed": "✓ Fixed",
    "amb.st.enroute": "Heading to the scene", "amb.st.onsite": "Debugging on site · {n} s", "amb.st.leaving": "Fix shipped", "amb.st.idle": "Standing by at HQ",
    "amb.idle.title": "Hotfix team", "amb.idle.sub": "Waiting for the next bug report", "amb.idle.next": "Next call in about {n} s.",
    "amb.steps": ["Reported", "Team dispatched", "On-site triage", "Fix shipped"],
    "amb.shop": "Shop", "amb.project": "Project", "amb.platform": "Platform", "amb.sev": "Priority", "amb.affected": "Affected users",
    "amb.eta": "Arrival", "amb.resp": "Response time", "amb.fix": "Resolution time", "amb.elapsed": "Elapsed", "amb.cf": "Crash-free rate",
    "amb.team": "Team", "amb.roles": ["iOS", "Android", "Backend", "QA"],
    "amb.ledger": "Bug ledger · this session", "amb.opened": "Reported", "amb.resolved": "Resolved", "amb.open": "Open",
    "amb.avgFix": "Avg. resolution", "amb.avgResp": "Avg. response", "amb.rate": "Resolution rate",
    "amb.note": "Simulation: 1 s = 1 min. Figures are calculated from the jobs opened and closed on the street in this session.",
    "amb.openShop": "Open shop", "min": "min",
    "sev.P1": "P1 · Critical", "sev.P2": "P2 · High", "sev.P3": "P3 · Medium",
    "kpi.fixed": "Bugs resolved", "kpi.avgFix": "Avg. resolution", "kpi.openBugs": "Open bugs",
    "bug.titles": ["App crashes at checkout", "Tapping a push notification opens a blank screen", "Basket total is wrong after a discount",
      "Session drops right after login", "Camera permission loops on Android 15", "Campaign link opens the wrong screen",
      "Memory leak on the map screen", "Keyboard covers the add-card form", "Loyalty points are credited twice", "Button label invisible in dark mode"],
    "ev.dispatch": "{id} · Hotfix team on its way to {shop}",
    "amb.term.shipped": "{shop} · hotfix shipped",
    "lead.name": "Your shop", "lead.kicker": "Coming soon", "lead.title": "This shop could be yours",
    "lead.sub": "Pick your sector and the products you're interested in; watch the building rise for you.",
    "lead.sector": "Your sector", "lead.products": "Loodos products you're interested in", "lead.refs": "Brands we've worked with here",
    "lead.trucks": "Delivery trucks for {n} products are heading to your lot; the building is rising to {f} floors.",
    "lead.cta": "Contact Loodos", "lead.reset": "Clear selection",
    "lead.sign1": "COMING SOON", "lead.sign2": "Your app", "lead.sign3": "Click to build it together",
    "impact.title": "IMPACT TOWER", "impact.pin": "Impact tower", "impact.del": "Deliveries", "impact.rel": "Release announcements", "impact.bug": "Bugs fixed", "impact.fire": "Fires put out",
    "news.release": "New release! {app} {v} is live", "news.feed": "📰 New release: {app} {v} is live", "news.sub": "Announced by the newsboy",
    "chat.prod": ["{p} integration is done, we're testing.", "Client demo for {p} tomorrow.", "The {p} dashboard looks great.", "I wrote the {p} release notes."],
    "chat.reply": ["Great job! 👏", "When's the demo?", "Crash-free still above 99.9%.", "Let's add this to the playground.", "Let's show it at sprint review.", "The client loved it.", "Tell me over coffee 😄", "Store rating went up too!", "Should we pitch Vendica too?", "The team really nailed it 🚀"],
    "ev.fire": "{id} · Prod fire: {shop} · HOTFIX fire crew on the way",
    "ev.fireOut": "{id} · {shop} fire put out by HOTFIX in {m} min",
    "fire.tag.spray": "Extinguishing", "fire.tag.out": "✓ Put out",
    "fire.titles": ["Payment service is down", "API returning 500s", "Database connection pool exhausted", "Campaign traffic melted the servers",
      "SSL certificate expired", "Memory leak froze the server", "Queue backed up, orders not landing"],
    "ev.fixed": "{id} · {shop} bug fixed in {m} min",
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
