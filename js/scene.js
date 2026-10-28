/* Loodos Street 3D sahnesi: izometrik sokak, sektör mahalleleri, müşteri dükkânları, hareketli araçlar.
   Dış dünyaya createStreet() döner; UI yalnız bu API'yi kullanır. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { t as tt } from "./i18n.js";
import { buildExtras } from "./extras.js";

const C = {
  ground: 0xe6eef0, road: 0xd3dde0, walk: 0xf7fafb, curb: 0xc9d4d7, line: 0xffffff,
  wall: 0xf8fafb, wall2: 0xeaf0f2, roof: 0xdbe3e6, glass: 0x8fd3da, glassDark: 0x24434c,
  teal: 0x1ab0ba, tealInk: 0x0b7c83, ink: 0x15191d, violet: 0x5446fc, mint: 0xc4ebe1,
  trees: [0x7fcfb4, 0x95d9bf, 0x63c1a6, 0xa6e0cb], trunk: 0xc2ad92, amber: 0xf2b134, pallet: 0xc9a77c,
};
const LOT = 12;            // bir dükkân parselinin sokak boyunca genişliği
const GAP = 12;            // mahalleler arasındaki ara sokak
const HQ_LEN = 34;         // sokağın başındaki Loodos meydanı
const LOT_Z = 15;          // parsel merkezinin yola uzaklığı
const LANE_Z = 2.2;        // şeritlerin yol eksenine uzaklığı
const TYPE = { ret: "store", tel: "tower", avi: "terminal", fin: "bank", fnb: "cafe", ind: "factory", life: "venue", mob: "mobility" };
// Gündüz ve gece aydınlatması; setNight() aradaki değeri yumuşakça karıştırır.
const DAY = { bg: 0xeef3f4, sky: 0xffffff, ground: 0xc9d8dc, hemi: 1.9, sun: 0xffffff, sunI: 2.1 };
const NIGHT = { bg: 0x0b1319, sky: 0x4a5f8c, ground: 0x10161e, hemi: .55, sun: 0x9fb4ff, sunI: .4 };
const DUSK = 0xff9a62;

const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const usesProduct = (c, pid) => c.projects.some(p => p.prods.some(x => x.id === pid));

// Yere düşen yumuşak ışık lekesi (sokak lambası havuzu, far huzmesi); additive karıştırılır.
function glowTexture(stretch = 1) {
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 128;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function createStreet({ el, data, night: initialNight = 0, weather: initialWeather = "clear", siren, onSelect, onEvent }) {
  /* ---------- Renderer, kamera, kontroller ---------- */
  // Dokunmatik/dar ekranda GPU belleğini koru: düşük piksel oranı, küçük gölge haritası, daha az yaya
  const LITE = matchMedia("(pointer: coarse)").matches || innerWidth < 860;
  const renderer = new THREE.WebGLRenderer({ antialias: !LITE, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  // GPU bağlantısı koparsa (arka plana atılan sekme, sürücü sıfırlaması) bekle; geri gelince temiz kurulum yap.
  let lost = false;
  renderer.domElement.addEventListener("webglcontextlost", e => { e.preventDefault(); lost = true; });
  renderer.domElement.addEventListener("webglcontextrestored", () => location.reload());

  const labels = new CSS2DRenderer();
  labels.setSize(el.clientWidth, el.clientHeight);
  Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(DAY.bg);

  const VIEW = 64;
  let fly = null, follow = null, selected = null, hovered = null, labelsAll = false;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 1000);
  const OFFSET = new THREE.Vector3(70, 92, 118);
  camera.position.copy(OFFSET);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.screenSpacePanning = false;
  controls.minZoom = .32;
  controls.maxZoom = 5;
  controls.minPolarAngle = .45;
  controls.maxPolarAngle = 1.12;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.zoomToCursor = true;
  controls.zoomSpeed = 1.6;   // tekerlek ve iki parmak (dokunmatik) zoom daha çevik

  function resize() {
    const w = el.clientWidth, h = el.clientHeight, a = w / h;
    camera.left = -VIEW * a / 2; camera.right = VIEW * a / 2; camera.top = VIEW / 2; camera.bottom = -VIEW / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labels.setSize(w, h);
  }
  resize();
  addEventListener("resize", resize);

  /* ---------- Işık ---------- */
  const hemi = new THREE.HemisphereLight(DAY.sky, DAY.ground, DAY.hemi);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(DAY.sun, DAY.sunI);
  sun.position.set(-60, 110, 70);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LITE ? 2048 : 4096, LITE ? 2048 : 4096);
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .04;
  scene.add(sun, sun.target);

  /* ---------- Malzemeler ve yardımcılar ---------- */
  const matCache = new Map();
  const mat = (color, o = {}) => {
    const k = color + JSON.stringify(o);
    if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, ...o }));
    return matCache.get(k);
  };
  const M = {
    wall: mat(C.wall), wall2: mat(C.wall2), roof: mat(C.roof), ink: mat(C.ink, { roughness: .6 }),
    glass: mat(C.glass, { roughness: .18, metalness: .15, emissive: 0xffd9a0, emissiveIntensity: 0 }), glassDark: mat(C.glassDark, { roughness: .25, metalness: .2 }),
    teal: mat(C.teal), tealInk: mat(C.tealInk), white: mat(0xffffff), wheel: mat(0x2a3136, { roughness: .9 }),
    trunk: mat(C.trunk), pallet: mat(C.pallet), amber: mat(C.amber), walk: mat(C.walk), curb: mat(C.curb), road: mat(C.road, { roughness: .95 }),
  };
  // Farlar ve stop lambaları gece yanar (applyNight); scooter'lar binalarla birlikte kurulduğu için burada tanımlı.
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xfff1c9, emissiveIntensity: 0 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x7a2020, emissive: 0xff3b30, emissiveIntensity: 0 });
  const BRIFIC = [   // brific.com renkleri
    { name: "Crimson", body: 0xd8322a, accent: 0x9e1f19 },
    { name: "Bianco", body: 0xeef1f5, accent: 0x8f9bb3 },
    { name: "Marine", body: 0x2f63e8, accent: 0x1d3fa8 },
  ];
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, w, h, d, material, x = 0, y = 0, z = 0, shadow = true) {
    const m = new THREE.Mesh(BOX, material);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cyl(parent, rt, rb, h, material, x = 0, y = 0, z = 0, seg = 16) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function plane(parent, w, d, material, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Pencere, ağaç, lamba gibi tekrar eden parçalar tek InstancedMesh'te toplanır.
  const inst = { win: [], winLit: [], trunk: [], crown: [], lamp: [], bulb: [], pool: [], dash: [], zebra: [], ballast: [], sleeper: [], rail: [], pole: [], arm: [] };
  const signMats = [];   // gece hafifçe kendi ışığıyla parlayan tabelalar
  // Gece pencerelerin çoğu yanar; hangilerinin yanacağı kurulumda bir kez seçilir.
  const winList = (lit = .62) => (Math.random() < lit ? inst.winLit : inst.win);
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const local = (group, x, y, z, sx, sy, sz, ry = 0) => ({ group, x, y, z, sx, sy, sz, ry });
  function windows(g, w, h, d, { rows, cols, y0 = 1.2, gapY = 1.9, size = [1, 1.1], sides = true }) {
    const usable = w - 1.6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -usable / 2 + usable * (c + .5) / cols, y = y0 + r * gapY;
        if (y + size[1] > h - .4) continue;
        winList().push(local(g, x, y, d / 2 + .03, size[0], size[1], .08));
        winList().push(local(g, x, y, -d / 2 - .03, size[0], size[1], .08));
      }
    }
    if (!sides) return;
    const sideCols = Math.max(1, Math.round((d - 2) / 2.2));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < sideCols; c++) {
        const z = -(d - 2) / 2 + (d - 2) * (c + .5) / sideCols, y = y0 + r * gapY;
        if (y + size[1] > h - .4) continue;
        winList().push(local(g, w / 2 + .03, y, z, .08, size[1], size[0]));
        winList().push(local(g, -w / 2 - .03, y, z, .08, size[1], size[0]));
      }
    }
  }

  /* ---------- Logo ve tabela dokuları ---------- */
  await document.fonts.ready;
  const images = new Map();
  await Promise.all(data.companies.filter(c => c.logo).map(c => new Promise(res => {
    const img = new Image();
    img.onload = () => { images.set(c.id, img); res(); };
    img.onerror = res;
    img.src = c.logo;
  })));
  const sectorOf = id => data.sectors.find(s => s.id === id);
  const RAW_LOGO = new Set(["vodafone"]); // çok renkli logo; tek renge boyanmaz

  function drawLogo(ctx, c, x, y, w, h, color) {
    const img = images.get(c.id);
    if (!img) {
      let size = h * .78;
      ctx.font = `800 ${size}px "Red Hat Display"`;
      while (ctx.measureText(c.name).width > w && size > 10) { size -= 2; ctx.font = `800 ${size}px "Red Hat Display"`; }
      ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(c.name, x + w / 2, y + h / 2 + size * .04);
      return;
    }
    const iw = img.naturalWidth || 300, ih = img.naturalHeight || 100;
    const s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
    const off = document.createElement("canvas");
    off.width = Math.ceil(dw); off.height = Math.ceil(dh);
    const o = off.getContext("2d");
    o.drawImage(img, 0, 0, dw, dh);
    if (!RAW_LOGO.has(c.id)) { o.globalCompositeOperation = "source-in"; o.fillStyle = color; o.fillRect(0, 0, dw, dh); }
    ctx.drawImage(off, x + (w - dw) / 2, y + (h - dh) / 2);
  }
  function signTexture(c, accent, { w = 640, h = 200, bg = "#ffffff", ink = "#0a0a0a" } = {}) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent; ctx.fillRect(0, h - 14, w, 14);
    drawLogo(ctx, c, 40, 26, w - 80, h - 70, ink);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function wordTexture(text, { w = 640, h = 160, bg = "#ffffff", color = "#0a0a0a", weight = 800, sub = "" } = {}) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `${weight} ${h * (sub ? .46 : .6)}px "Red Hat Display"`;
    ctx.fillText(text, w / 2, h * (sub ? .4 : .52));
    if (sub) { ctx.font = `600 ${h * .17}px "Red Hat Display"`; ctx.globalAlpha = .75; ctx.fillText(sub, w / 2, h * .78); }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function signBoard(g, tex, w, h, y, z, depth = .25) {
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    signMats.push(face);
    const m = new THREE.Mesh(BOX, [M.wall2, M.wall2, M.wall2, M.wall2, face, face]);
    m.scale.set(w, h, depth);
    m.position.set(0, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  }
  function roofBillboard(g, tex, w, top, accentMat) {
    const bw = Math.min(w - 1, 7.2), bh = bw * 200 / 640 * 1.05;
    cyl(g, .12, .12, 1.1, M.ink, -bw / 2 + .6, top, 0, 8);
    cyl(g, .12, .12, 1.1, M.ink, bw / 2 - .6, top, 0, 8);
    box(g, bw + .25, bh + .25, .2, accentMat, 0, top + 1.1 - .12, 0);
    signBoard(g, tex, bw, bh, top + 1.1 + bh / 2, 0, .32);
  }

  /* ---------- Yerleşim: mahalleler ve parseller ---------- */
  const lots = [], parks = [], districts = [];
  let cursor = HQ_LEN;
  for (const s of data.sectors) {
    const list = data.companies.filter(c => c.sector === s.id);
    const north = list.filter((_, i) => i % 2 === 0), south = list.filter((_, i) => i % 2 === 1);
    const n = Math.max(north.length, south.length, 1);
    const x0 = cursor;
    north.forEach((c, i) => lots.push({ c, s, x: x0 + LOT * (i + .5), side: -1 }));
    south.forEach((c, i) => lots.push({ c, s, x: x0 + LOT * (i + .5), side: 1 }));
    for (let i = north.length; i < n; i++) parks.push({ x: x0 + LOT * (i + .5), side: -1, s });
    for (let i = south.length; i < n; i++) parks.push({ x: x0 + LOT * (i + .5), side: 1, s });
    districts.push({ s, x0, x1: x0 + n * LOT, count: list.length });
    cursor += n * LOT + GAP;
  }
  const LEN = cursor - GAP + 10;
  const SHIFT = -LEN / 2;
  for (const l of lots) l.x += SHIFT;
  for (const p of parks) p.x += SHIFT;
  for (const d of districts) { d.x0 += SHIFT; d.x1 += SHIFT; d.cx = (d.x0 + d.x1) / 2; }
  const X_MIN = SHIFT - 14, X_MAX = SHIFT + LEN + 14;
  const hqX = SHIFT + HQ_LEN / 2 - 2;

  sun.shadow.camera.left = -LEN / 2 - 30; sun.shadow.camera.right = LEN / 2 + 30;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.far = 400;
  sun.target.position.set(0, 0, 0);
  sun.position.set(-60, 110, 70);
  sun.shadow.camera.updateProjectionMatrix();

  /* ---------- Zemin, yollar, kaldırımlar ---------- */
  const world = new THREE.Group();
  scene.add(world);
  const groundMat = mat(C.ground, { roughness: 1 });   // kar yağınca beyazlar (applyNight)
  plane(world, LEN + 400, 400, groundMat, 0, 0, 0);
  plane(world, X_MAX - X_MIN + 40, 9, M.road, (X_MIN + X_MAX) / 2, .02, 0);
  for (let x = X_MIN - 18; x < X_MAX + 18; x += 4.5) inst.dash.push(local(world, x, .04, 0, 2.2, .02, .22));

  const walkSegments = [[SHIFT - 16, SHIFT + HQ_LEN - GAP / 2 + 2]];
  for (const d of districts) walkSegments.push([d.x0 - 1, d.x1 + 1]);
  for (const [a, b] of walkSegments) {
    for (const side of [-1, 1]) {
      box(world, b - a, .18, 3.6, M.walk, (a + b) / 2, 0, side * 6.3, false);
      box(world, b - a, .22, .3, M.curb, (a + b) / 2, 0, side * 4.55, false);
    }
  }
  // Ara sokaklar ve yaya geçitleri
  const crossXs = districts.map(d => d.x0 - GAP / 2);
  for (const cx of crossXs) {
    plane(world, 8, 56, M.road, cx, .015, 0);
    for (let i = -3; i <= 3; i++) {
      for (const zc of [-6.3, 6.3]) inst.zebra.push(local(world, cx + i * 1.05, .035, zc, .55, .02, 3));
      for (const xc of [-5.2, 5.2]) inst.zebra.push(local(world, cx + xc, .035, i * 1.2, .9, .02, .6));
    }
    for (let z = 9; z < 27; z += 4.5) { inst.dash.push(local(world, cx, .03, z, .22, .02, 2.2)); inst.dash.push(local(world, cx, .03, -z, .22, .02, 2.2)); }
  }
  // Mahalle zemin tonları ve kaldırım bordürü sektör renginde
  for (const d of districts) {
    const tint = new THREE.MeshStandardMaterial({ color: d.s.color, transparent: true, opacity: .11, roughness: 1, depthWrite: false });
    for (const side of [-1, 1]) plane(world, d.x1 - d.x0 + 1, 13, tint, d.cx, .03, side * 15);
    for (const side of [-1, 1]) box(world, d.x1 - d.x0 + 2, .24, .32, mat(new THREE.Color(d.s.color).getHex()), d.cx, 0, side * 8.15, false);
  }

  // Ağaçlar ve sokak lambaları
  function tree(x, z, s = 1) {
    inst.trunk.push(local(world, x, 0, z, .22 * s, 1.3 * s, .22 * s));
    inst.crown.push({ ...local(world, x, 1.3 * s + .9 * s, z, 1.2 * s, 1.35 * s, 1.2 * s, Math.random() * 3), color: pick(C.trees) });
  }
  for (const [a, b] of walkSegments) {
    for (let x = a + 3; x < b - 2; x += 6) for (const side of [-1, 1]) tree(x, side * 7.4, rand(.85, 1.1));
    for (let x = a + 6; x < b - 2; x += 12) for (const side of [-1, 1]) {
      inst.lamp.push(local(world, x, 0, side * 5.05, .1, 3.4, .1));
      inst.bulb.push(local(world, x, 3.4, side * 5.05 - side * .3, .5, .16, .9));
      inst.pool.push(local(world, x, .06, side * 4.4, 9, .001, 9));
    }
  }

  /* ---------- Binalar ---------- */
  const pickables = [];
  const companies = new Map();   // id -> { lot, group, wallMat, height, pin }
  const accentMats = new Map();
  const accentMat = hex => { if (!accentMats.has(hex)) accentMats.set(hex, mat(new THREE.Color(hex).getHex())); return accentMats.get(hex); };
  const forklifts = [];

  function forklift(g, z, span) {
    const f = new THREE.Group();
    box(f, 1.1, .7, .8, M.amber, 0, .25, 0);
    box(f, .5, .7, .8, M.amber, -.3, .95, 0);
    box(f, .08, 1.6, .7, M.ink, .62, .2, 0);
    box(f, .7, .06, .5, M.ink, 1.0, .25, 0);
    for (const [wx, wz] of [[-.35, .42], [.35, .42], [-.35, -.42], [.35, -.42]]) {
      const w = cyl(f, .22, .22, .18, M.wheel, wx, .03, wz, 12);
      w.rotation.x = Math.PI / 2; w.position.y = .22;
    }
    const load = box(f, .9, .5, .8, M.pallet, 1.05, .3, 0);
    f.position.set(-span, 0, z);
    g.add(f);
    forklifts.push({ f, load, span, t: Math.random() * 10 });
  }

  function building(lot) {
    const { c, s } = lot;
    const g = new THREE.Group();
    const wallMat = M.wall.clone();
    const acc = accentMat(s.color);
    const tex = signTexture(c, s.color);
    const type = TYPE[s.id];
    let W = 9.4, D = 8, H = 5.4, top;
    plane(g, 11, 11.4, M.walk, 0, .05, .3);

    if (type === "store") {
      box(g, W, H, D, wallMat);
      box(g, W - 1, 2.6, .12, M.glass, 0, .25, D / 2 + .02);
      box(g, 1.4, 2.4, .14, M.glassDark, 0, .25, D / 2 + .05);
      const aw = box(g, W - .4, .3, 1.7, acc, 0, 3.05, D / 2 + .75);
      aw.rotation.x = .22;
      box(g, W + .2, .45, D + .2, M.roof, 0, H, 0);
      box(g, 1.4, .8, 1.2, M.wall2, -2.5, H + .45, -2);
      box(g, 1, .6, 1, M.wall2, 2.8, H + .45, -2.2);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 4.35, D / 2 + .14);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.6, -D / 2 - .14);
      windows(g, W, H, D, { rows: 1, cols: 0, sides: true, y0: 2.1 });
      top = H + .45;
      if (c.id === "b-m-stores" || c.id === "altinmarka") forklift(g, D / 2 + 2.3, 3);
    } else if (type === "tower") {
      W = 8.4; D = 7.4; H = 17;
      box(g, W, H, D, wallMat);
      box(g, W - 1, 2.6, .12, M.glass, 0, .2, D / 2 + .02);
      windows(g, W, H, D, { rows: 8, cols: 4, y0: 3.4, gapY: 1.7, size: [1.25, 1.1] });
      box(g, W + .3, 1.1, D + .3, acc, 0, H, 0);
      cyl(g, .08, .12, 3.2, M.ink, 1.8, H + 1.1, -1, 6);
      signBoard(g, tex, W * .72, W * .72 * 200 / 640, 2.9 + 1.0, D / 2 + .14);
      signBoard(g, tex, W * .72, W * .72 * 200 / 640, H - 1.3, -D / 2 - .14);
      signBoard(g, tex, W * .72, W * .72 * 200 / 640, H - 1.3, D / 2 + .14);
      top = H + 1.1;
    } else if (type === "terminal") {
      W = 10.4; D = 8; H = 4.8;
      box(g, W, H, D, wallMat);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(D / 2 + .2, D / 2 + .2, W + .4, 28, 1, false, 0, Math.PI), acc);
      roof.rotation.set(0, 0, Math.PI / 2);
      roof.scale.set(.38, 1, 1);
      roof.position.set(0, H, 0);
      roof.castShadow = true;
      g.add(roof);
      box(g, W - 1, 2.8, .12, M.glass, 0, .3, D / 2 + .02);
      cyl(g, .7, .9, 8.5, M.wall2, W / 2 - 1.4, 0, -D / 2 + 1.6);
      cyl(g, 1.5, 1.2, 1.4, M.glassDark, W / 2 - 1.4, 8.5, -D / 2 + 1.6);
      cyl(g, 1.7, 1.7, .3, acc, W / 2 - 1.4, 9.9, -D / 2 + 1.6);
      signBoard(g, tex, W * .55, W * .55 * 200 / 640, 3.9, D / 2 + .14);
      signBoard(g, tex, W * .55, W * .55 * 200 / 640, 3.9, -D / 2 - .14);
      windows(g, W, H, D, { rows: 1, cols: 0, sides: true, y0: 2 });
      top = H + 1.6;
    } else if (type === "bank") {
      W = 9.2; D = 7.6; H = 6;
      box(g, W + .8, .5, D + 2.6, M.wall2, 0, 0, .9);
      box(g, W, H, D, wallMat, 0, .5);
      for (let i = 0; i < 5; i++) cyl(g, .3, .34, 4.3, M.white, -W / 2 + .9 + i * (W - 1.8) / 4, .5, D / 2 + 1.5, 14);
      box(g, W + .4, .6, 2.6, M.wall2, 0, 4.8, D / 2 + 1);
      const shape = new THREE.Shape();
      shape.moveTo(-W / 2 - .2, 0); shape.lineTo(W / 2 + .2, 0); shape.lineTo(0, 1.3); shape.closePath();
      const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false }), acc);
      ped.position.set(0, 5.4, D / 2 - .2);
      ped.castShadow = true;
      g.add(ped);
      box(g, 1.5, 3, .14, M.glassDark, 0, .5, D / 2 + .05);
      box(g, W + .2, .4, D + .2, M.roof, 0, H + .5, 0);
      signBoard(g, tex, W * .58, W * .58 * 200 / 640, 3.9, D / 2 + .14);
      signBoard(g, tex, W * .58, W * .58 * 200 / 640, 4.4, -D / 2 - .14);
      windows(g, W, H, D, { rows: 2, cols: 0, sides: true, y0: 1.6, gapY: 2.2 });
      top = H + .9;
    } else if (type === "cafe") {
      W = 8.8; D = 7.4; H = 4.6;
      box(g, W, H, D, wallMat);
      box(g, W - 1, 2.5, .12, M.glass, 0, .25, D / 2 + .02);
      const n = 7, sw = (W - .4) / n;
      for (let i = 0; i < n; i++) {
        const st = box(g, sw, .25, 1.8, i % 2 ? M.white : acc, -W / 2 + .2 + sw * (i + .5), 2.95, D / 2 + .8);
        st.rotation.x = .3;
      }
      box(g, W + .2, .4, D + .2, M.roof, 0, H, 0);
      for (const tx of [-2.6, 2.6]) {
        cyl(g, .55, .55, .08, M.white, tx, .75, D / 2 + 2.6, 16);
        cyl(g, .06, .06, .75, M.ink, tx, 0, D / 2 + 2.6, 6);
        cyl(g, .05, .05, 2.2, M.ink, tx, .8, D / 2 + 2.6, 6);
        const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, .6, 8), acc);
        um.position.set(tx, 3.2, D / 2 + 2.6); um.castShadow = true; g.add(um);
        for (const dx of [-.85, .85]) box(g, .45, .5, .45, M.tealInk, tx + dx, 0, D / 2 + 2.6);
      }
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.75 + .2, D / 2 + .14);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.4, -D / 2 - .14);
      top = H + .4;
    } else if (type === "factory") {
      W = 10.6; D = 8.2; H = 4.8;
      box(g, W, H, D, wallMat);
      const tw = W / 3, shape = new THREE.Shape();
      shape.moveTo(0, 0); shape.lineTo(tw, 0); shape.lineTo(tw, 1.7); shape.closePath();
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false }), i === 1 ? acc : M.roof);
        t.position.set(-W / 2 + i * tw, H, -D / 2);
        t.castShadow = true;
        g.add(t);
        box(g, .08, 1.5, D - .4, M.glass, -W / 2 + (i + 1) * tw - .05, H, 0, false);
      }
      cyl(g, .55, .7, 6.5, M.wall2, -W / 2 + 1.3, H, -D / 2 + 1.4, 14);
      cyl(g, .58, .58, .6, acc, -W / 2 + 1.3, H + 5, -D / 2 + 1.4, 14);
      box(g, 3.2, 3.2, .14, M.ink, 1.8, 0, D / 2 + .05);
      box(g, 3.6, .3, .2, acc, 1.8, 3.2, D / 2 + .1);
      signBoard(g, tex, W * .42, W * .42 * 200 / 640, 3.8, D / 2 + .14).position.x = -2.6;
      signBoard(g, tex, W * .5, W * .5 * 200 / 640, 3.6, -D / 2 - .14);
      if (c.id !== "oyak-renault") {   // Oyak'ın önü Mégane vitrinine ayrıldı (js/extras.js)
        for (let i = 0; i < 3; i++) box(g, 1, .5, .9, i % 2 ? M.pallet : M.teal, -3.4 + i * 1.15, 0, D / 2 + 3.6);
        box(g, 1, .5, .9, M.pallet, -3.4, .5, D / 2 + 3.6);
        forklift(g, D / 2 + 2, 2.6);
      }
      top = H + 1.7;
    } else if (type === "venue") {
      W = 9.2; D = 8; H = 5;
      box(g, W, H, D, wallMat);
      box(g, W - 1, 2.6, .12, M.glass, 0, .25, D / 2 + .02);
      cyl(g, 3.5, 3.5, .5, acc, 0, H, 0, 32);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(3.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.white);
      dome.position.set(0, H + .5, 0); dome.castShadow = true; g.add(dome);
      box(g, W + .2, .3, D + .2, M.roof, 0, H - .1, 0);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 4, D / 2 + .14);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.8, -D / 2 - .14);
      windows(g, W, H, D, { rows: 1, cols: 0, sides: true, y0: 2 });
      top = H + 3.8;
    } else {
      W = 8.8; D = 7.4; H = 4.6;
      box(g, W, H, D, wallMat);
      box(g, W - .8, 3, .12, M.glass, 0, .2, D / 2 + .02);
      box(g, W + .2, .4, D + .2, M.roof, 0, H, 0);
      box(g, W + .3, .25, D + .3, acc, 0, H - .25, 0);
      box(g, .6, 1.5, .5, acc, W / 2 - .6, 0, D / 2 + 2.2);
      box(g, .4, .4, .08, M.glassDark, W / 2 - .6, 1, D / 2 + 2.47);
      if (c.id === "brific") BRIFIC.forEach((m, i) => scooterMesh(g, -3 + i * 1.3, D / 2 + 2, Math.PI / 2, m).scale.setScalar(1.25));
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.75 + .1, D / 2 + .14);
      signBoard(g, tex, W * .6, W * .6 * 200 / 640, 3.4, -D / 2 - .14);
      top = H + .4;
    }
    if (type !== "tower") roofBillboard(g, tex, W, top, acc);

    g.position.set(lot.x, 0, lot.side * LOT_Z);
    if (lot.side > 0) g.rotation.y = Math.PI;
    g.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "company", id: c.id }; });
    world.add(g);
    pickables.push(g);

    const pinY = type === "tower" ? H + 4.5 : top + 5.2;
    const pin = makePin(c, s, pinY);
    pin.position.set(0, pinY, 0);
    g.add(pin);
    companies.set(c.id, { lot, group: g, wallMat, height: pinY, roof: top, pin: pin.element.firstChild, sector: s });
  }

  function makePin(c, s, y) {
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    const b = document.createElement("button");
    b.className = "pin";
    b.style.setProperty("--c", s.color);
    b.setAttribute("aria-label", tt("pin.open", { name: c.name }));
    const logo = c.logo
      ? `<span class="pin-logo"><img src="${c.logo}" alt="" class="${RAW_LOGO.has(c.id) ? "raw" : ""}"></span>`
      : `<span class="pin-logo txt">${esc(c.name)}</span>`;
    const n = c.projects.length;
    b.innerHTML = `<span class="pin-card">${logo}<span class="pin-name">${esc(c.name)}${n > 1 ? `<small>${tt("pin.projects", { n })}</small>` : ""}</span>${!c.logo && n > 1 ? `<small class="pin-n">${n}</small>` : ""}</span><span class="pin-stem"></span>`;
    b.addEventListener("click", e => { e.stopPropagation(); select("company", c.id, true); });
    wrap.appendChild(b);
    return new CSS2DObject(wrap);
  }

  /* ---------- Loodos meydanı ---------- */
  const hq = new THREE.Group();
  const hqTeal = M.teal.clone();   // gece merkezin turkuaz bantları parlar
  hqTeal.emissive = new THREE.Color(C.teal);
  hqTeal.emissiveIntensity = 0;
  {
    const W = 13, D = 10, H = 22;
    plane(hq, 15, 12, M.walk, 0, .05, 0);
    box(hq, 17, 4, 11.5, M.wall, 0, 0, 0);
    box(hq, 15.5, 2.6, .12, M.glass, 0, .3, 5.77);
    box(hq, W, H, D, M.wall);
    windows(hq, W, H, D, { rows: 11, cols: 5, y0: 5.2, gapY: 1.55, size: [1.5, 1.0] });
    for (const x of [-W / 2 + .1, W / 2 - .1]) box(hq, .3, H - 4, D + .1, hqTeal, x, 4, 0);
    box(hq, W + .4, 1.4, D + .4, hqTeal, 0, H, 0);
    const word = wordTexture("loodos", { color: "#1ab0ba", sub: "STREET", h: 200 });
    signBoard(hq, word, 10, 3.1, H + 1.4 + 1.6 + .4, 0, .4);
    box(hq, 10.3, .3, .5, M.ink, 0, H + 1.4, 0);
    const logoTex = wordTexture("loodos", { color: "#0a0a0a", h: 160 });
    signBoard(hq, logoTex, 7, 1.75, 4.9, 5.85);
  }
  hq.position.set(hqX, 0, -LOT_Z - 1);
  hq.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "hq", id: "loodos" }; });
  world.add(hq);
  pickables.push(hq);
  {
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    const b = document.createElement("button");
    b.className = "pin";
    b.style.setProperty("--c", "#1ab0ba");
    b.innerHTML = `<span class="pin-card"><span class="pin-logo txt" style="background:#0a0a0a">L</span><span class="pin-name">${tt("hq.pin")}<small>${tt("hq.since")}</small></span></span><span class="pin-stem"></span>`;
    b.addEventListener("click", e => { e.stopPropagation(); select("hq", "loodos", true); });
    wrap.appendChild(b);
    const o = new CSS2DObject(wrap);
    o.position.set(0, 30, 0);
    hq.add(o);
  }
  // Meydan: çeşme halkası ve banklar
  const plaza = new THREE.Group();
  plane(plaza, 22, 13, M.walk, 0, .06, 0);
  const fountain = [cyl(plaza, 3.4, 3.6, .5, M.wall2, 0, 0, 0, 40)];   // yılbaşında yerini ağaca bırakır
  const water = mat(0x9fe0e6, { roughness: .2, emissive: 0x2fc7d1, emissiveIntensity: 0 });
  fountain.push(cyl(plaza, 2.9, 2.9, .42, water, 0, .12, 0, 40), cyl(plaza, .5, .7, 1.4, M.teal, 0, .3, 0, 20));
  for (const a of [0, 1, 2, 3]) {
    const bx = Math.cos(a * Math.PI / 2 + .78) * 6.2, bz = Math.sin(a * Math.PI / 2 + .78) * 4.4;
    box(plaza, 1.8, .45, .6, M.tealInk, bx, 0, bz);
  }
  plaza.position.set(hqX, 0, LOT_Z);
  world.add(plaza);
  tree(hqX - 8.5, LOT_Z - 3); tree(hqX + 8.5, LOT_Z - 3); tree(hqX - 8.5, LOT_Z + 4); tree(hqX + 8.5, LOT_Z + 4);

  for (const lot of lots) building(lot);

  // Boş parseller: park ya da otopark
  parks.forEach((p, i) => {
    const g = new THREE.Group();
    if (i % 2 === 0) {
      plane(g, 10.5, 10.5, mat(0xcdebdc, { roughness: 1 }), 0, .05, 0);
      for (const [tx, tz] of [[-3, -3], [3, -2.5], [-2.5, 3], [3.2, 3.2], [0, 0]]) {
        inst.trunk.push(local(g, tx, 0, tz, .22, 1.3, .22));
        inst.crown.push({ ...local(g, tx, 2.2, tz, 1.25, 1.4, 1.25, Math.random() * 3), color: pick(C.trees) });
      }
      box(g, 2, .45, .6, M.tealInk, 0, 0, 3.8);
    } else {
      plane(g, 10.5, 10.5, mat(0xdde5e7, { roughness: 1 }), 0, .05, 0);
      for (let k = 0; k < 4; k++) box(g, .12, .02, 4, M.white, -4.5 + k * 3, .05, 0, false);
      carMesh(g, -3, 0, Math.PI / 2, pick([0x5446fc, 0xffffff, 0x1ab0ba]));
      carMesh(g, 3, 0, Math.PI / 2, pick([0xd6457a, 0x7c8a99, 0xffffff]));
    }
    g.position.set(p.x, 0, p.side * LOT_Z);
    world.add(g);
  });

  // Mahalle etiketleri
  for (const d of districts) {
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    const b = document.createElement("button");
    b.className = "dist-lbl";
    b.style.setProperty("--c", d.s.color);
    b.innerHTML = `<i></i>${esc(d.s.name)}`;
    b.addEventListener("click", e => { e.stopPropagation(); focusSector(d.s.id); onSelect?.({ kind: "sector", id: d.s.id }); });
    wrap.appendChild(b);
    const o = new CSS2DObject(wrap);
    o.position.set(d.x0 - GAP / 2, .3, -26);
    world.add(o);
  }

  // "Bu dükkân sizin olabilir": sokağın doğu ucundaki boş parsel. Ziyaretçinin seçtiği ürünlerin kamyonları buraya da uğrar.
  const lastD = districts[districts.length - 1];
  const leadLot = { c: { id: "lead", name: tt("lead.name"), projects: [{ prods: [] }] }, s: { id: "lead", name: tt("lead.kicker"), color: "#1ab0ba" }, x: lastD.x1 + 12, side: -1 };
  lots.push(leadLot);
  // Olaylar etki kulesinin sayaçlarından geçip arayüze gider (extras sahne kurulduktan sonra bağlanır)
  let extrasRef = null;
  const notify = ev => { extrasRef?.note(ev); onEvent?.(ev); };

  /* ---------- Araçlar ve yayalar ---------- */
  function wheels(g, xs, z, r = .42) {
    for (const x of xs) for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 14), M.wheel);
      w.rotation.x = Math.PI / 2; w.position.set(x, r, s * z); w.castShadow = true;
      g.add(w);
    }
  }
  // Kamyon ve panelvanın yan paneli taşıdığı Loodos ürününü yazar; doku ürün başına bir kez çizilir.
  const prodTex = new Map();
  function productTexture(p, kind) {
    const k = (p?.id || "-") + kind;
    if (!prodTex.has(k)) prodTex.set(k, kind === "truck"
      ? wordTexture("loodos", { color: "#1ab0ba", sub: p ? p.name.toLocaleUpperCase("en") : "STREET", h: 220, w: 640 })
      : wordTexture(p ? p.name : "loodos", { color: "#0b7c83", h: 140, w: 640, weight: 700 }));
    return prodTex.get(k);
  }
  function sidePanel(g, kind, w, h, d, x, y) {
    const tex = productTexture(null, kind);
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    signMats.push(side);
    const panel = new THREE.Mesh(BOX, [M.white, M.white, M.white, M.white, side, side]);
    panel.scale.set(w, h, d); panel.position.set(x, y, 0);
    g.add(panel);
    g.userData.panel = side;
  }
  function truckMesh() {
    const g = new THREE.Group();
    box(g, 1.9, 1.9, 2.1, M.teal, 2.6, .55, 0);
    box(g, .1, .8, 1.7, M.glassDark, 3.56, 1.45, 0);
    box(g, 5, 2.6, 2.3, M.white, -.9, .6, 0);
    sidePanel(g, "truck", 4.4, 1.6, 2.34, -.9, 2);
    box(g, 5, .14, 2.32, M.teal, -.9, .55, 0);
    wheels(g, [2.5, -.4, -2.6], 1.12);
    return g;
  }
  function vanMesh() {
    const g = new THREE.Group();
    box(g, 4.2, 2, 2, M.white, 0, .5, 0);
    box(g, 1, 1.2, 2, M.white, 2.4, .5, 0);
    box(g, .1, .7, 1.7, M.glassDark, 2.95, 1.1, 0);
    box(g, 4.25, .35, 2.04, M.teal, 0, 1.3, 0);
    sidePanel(g, "van", 3.3, .7, 2.04, -.35, 2.05);
    wheels(g, [1.9, -1.4], 1.02, .38);
    return g;
  }
  function carMesh(parent, x, z, ry, color) {
    const g = new THREE.Group();
    box(g, 3.6, .8, 1.7, mat(color, { roughness: .45 }), 0, .4, 0);
    box(g, 2, .7, 1.5, M.glassDark, -.2, 1.2, 0);
    wheels(g, [1.15, -1.15], .86, .34);
    g.position.set(x, 0, z); g.rotation.y = ry;
    parent?.add(g);
    return g;
  }
  // Brific e-scooter (brific.com): renkli V gövde, siyah uzun gidon, kalın lastikler ve çamurluklar, önde dikey far.
  function scooterMesh(parent, x, z, ry, model = pick(BRIFIC)) {
    const g = new THREE.Group();
    const body = mat(model.body, { roughness: .35, metalness: .1 }), accent = mat(model.accent, { roughness: .4 });
    for (const wx of [-.62, .62]) { const w = cyl(g, .3, .3, .16, M.wheel, wx, 0, 0, 14); w.rotation.x = Math.PI / 2; w.position.y = .3; }
    box(g, .5, .06, .2, M.ink, -.64, .6, 0);                    // arka çamurluk
    box(g, .38, .06, .2, M.ink, .64, .6, 0);                    // ön çamurluk
    box(g, 1, .1, .3, M.ink, -.08, .26, 0);                     // basamak
    box(g, .95, .2, .32, body, .08, .36, 0);                    // gövdenin alt kolu
    const arm = box(g, .2, .8, .32, body, .36, .4, 0);          // V'nin yükselen kolu
    arm.rotation.z = -.5;
    box(g, .26, .2, .33, accent, .2, .36, 0);
    const seat = box(g, .6, .12, .28, M.ink, -.4, .58, 0);      // arka kapak
    seat.rotation.z = .12;
    const stem = cyl(g, .045, .045, 1.35, M.ink, .55, .5, 0, 8);
    stem.rotation.z = .1;
    box(g, .08, .06, .8, M.ink, .46, 1.82, 0);                  // gidon
    box(g, .04, .26, .1, headMat, .62, .78, 0, false);          // dikey far
    g.userData.model = model.name;
    g.position.set(x, 0, z); g.rotation.y = ry;
    parent?.add(g);
    return g;
  }
  function riderScooter() {
    const g = scooterMesh(null, 0, 0, 0);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .7, 4, 8), mat(pick([0x5446fc, 0x1ab0ba, 0xd6457a])));
    body.position.set(0, 1.0, 0); body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(0xe8c4a0));
    head.position.set(0, 1.6, 0); g.add(head);
    return g;
  }

  // Yola düşen far huzmesi; gece yanar (applyNight).
  const glowTex = glowTexture();
  const beamMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffe2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  beamMat.visible = false;
  const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const LIGHTS = { truck: [3.58, -3.42, .8, .7], van: [2.93, -2.13, .72, .75], car: [1.82, -1.82, .58, .5], scooter: [.66, null, 0, .78] };
  function vehicleLights(g, type) {
    const [fx, bx, hw, y] = LIGHTS[type];
    for (const z of hw ? [-hw, hw] : [0]) {
      box(g, .08, .22, .34, headMat, fx, y, z, false);
      if (bx != null) box(g, .08, .2, .3, tailMat, bx, y, z, false);
    }
    const beam = new THREE.Mesh(flatGeo, beamMat);
    const len = type === "scooter" ? 3.5 : 7;
    beam.scale.set(len, 1, type === "scooter" ? 1.4 : 3.2);
    beam.position.set(fx + len / 2 - .2, .06, 0);
    g.add(beam);
  }

  const vehicles = [];
  const typeName = type => tt("veh." + type);
  // Her teslimat aracı bir Loodos ürünü taşır ve yalnızca o ürünü kullanan dükkânlara uğrar.
  // Ziyaretçi parseli için ürün seçtikçe teslim edilebilir ürünler değişir; her seferinde yeniden hesaplanır
  const deliverableNow = () => data.products.filter(p => lots.some(l => usesProduct(l.c, p.id)));
  const lotsFor = pid => lots.filter(l => usesProduct(l.c, pid));
  let glowProd = null;
  let seq = 1040;
  function addVehicle(type, dir, x) {
    const mesh = type === "truck" ? truckMesh() : type === "van" ? vanMesh() : type === "scooter" ? riderScooter()
      : carMesh(null, 0, 0, 0, pick([0xffffff, 0x5446fc, 0x7c8a99, 0xd6457a, 0x15191d, 0x2f8fe0]));
    const delivers = type === "truck" || type === "van";
    const id = (type === "truck" ? "LDS-" : type === "van" ? "LDV-" : type === "scooter" ? "BRF-" : "CAR-") + (seq += 7 + Math.floor(Math.random() * 40));
    const base = type === "truck" ? rand(6.5, 8) : type === "van" ? rand(8, 9.5) : type === "scooter" ? rand(4.5, 5.5) : rand(9, 11);
    const v = { id, type, mesh, dir, x, speed: base, base, delivers, state: "driving", timer: 0, dest: null, from: x, cargo: "", ship: "" };
    mesh.position.set(x, 0, dir > 0 ? LANE_Z : -LANE_Z);
    mesh.rotation.y = dir > 0 ? 0 : Math.PI;
    mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.pick = { kind: "vehicle", id }; } });
    vehicleLights(mesh, type);
    world.add(mesh);
    if (delivers) {
      const wrap = document.createElement("div");
      wrap.className = "lbl";
      const tag = document.createElement("button");
      tag.className = "veh-tag";
      tag.addEventListener("click", e => { e.stopPropagation(); select("vehicle", id, true); });
      wrap.appendChild(tag);
      const o = new CSS2DObject(wrap);
      o.position.set(0, type === "truck" ? 4.4 : 3.6, 0);
      mesh.add(o);
      v.tag = tag;
      v.panel = mesh.userData.panel;
      newDest(v, true);
    }
    vehicles.push(v);
    return v;
  }
  // Araç, yolun iki yakasındaki alıcılara da uğrar (ürün kullanan dükkânlar her iki sırada az sayıda).
  // reload: depodan yeni yük alır (ilk çıkış ve sokağın sonundan dönüş); yoksa aynı ürünle sıradaki alıcıya gider.
  function newDest(v, reload = false) {
    const ahead = pid => lotsFor(pid).filter(l => (l.x - v.x) * v.dir > 8).sort((a, b) => (a.x - b.x) * v.dir);
    if (reload || !v.prod) {
      const deliverable = deliverableNow();
      const reachable = deliverable.filter(p => ahead(p.id).length);
      const pool = reachable.length ? reachable : deliverable;
      // En az aracın taşıdığı ürün seçilir; böylece sokakta her ürünün kamyonu dolaşır.
      const load = p => vehicles.filter(o => o !== v && o.prod?.id === p.id).length;
      const least = Math.min(...pool.map(load));
      v.prod = pick(pool.filter(p => load(p) === least)) || null;
      if (v.panel) v.panel.map = v.panel.emissiveMap = productTexture(v.prod, v.type);
    }
    v.dest = v.prod ? ahead(v.prod.id)[0] || null : null;
    v.from = v.x;
    if (v.dest) {
      v.cargo = `${v.prod.name} v${2 + Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 10)} · ${pick(tt("cargo"))}`;
      v.ship = "#SHP-" + (70000 + Math.floor(Math.random() * 29999));
    }
    updateTag(v);
  }
  function updateTag(v) {
    if (!v.tag) return;
    const st = v.state === "unloading" ? tt("tag.unloading") : v.dest ? "→ " + v.dest.c.name : tt("tag.return");
    v.tag.className = "veh-tag" + (v.state === "unloading" ? " unload" : "") + (selected?.kind === "vehicle" && selected.id === v.id ? " on" : "")
      + (glowProd && v.prod?.id === glowProd ? " glow" : "");
    v.tag.innerHTML = `<b>${v.id}</b>${v.prod ? `<span class="vt-p" title="${esc(v.prod.name)}">${esc(v.prod.mono)}</span>` : ""}${esc(st)}`;
  }
  const span = X_MAX - X_MIN;
  [["truck", 1], ["truck", -1], ["van", 1], ["truck", 1], ["van", -1], ["car", 1], ["car", -1], ["truck", -1], ["scooter", 1],
   ["car", 1], ["van", 1], ["scooter", -1], ["car", -1], ["truck", 1], ["van", -1], ["car", -1], ["scooter", 1], ["scooter", -1]].forEach(([t, d], i) => {
    addVehicle(t, d, X_MIN + ((i * 37) % 16) / 16 * span + rand(-4, 4));
  });
  // Saate göre trafik: otomobiller yoğun saatte (08:30, 18:15 civarı) hepsi yolda, gece birkaçı kalır.
  for (let i = 0; i < 8; i++) addVehicle("car", i % 2 ? 1 : -1, X_MIN + rand(0, span));
  const peak = (h, c, w) => Math.exp(-((h - c) ** 2) / (2 * w * w));
  const trafficAt = h => THREE.MathUtils.clamp(.15 + (h > 6.5 && h < 22.5 ? .3 : 0) + .6 * Math.max(peak(h, 8.5, 1), peak(h, 18.25, 1.2)), .1, 1);
  let traffic = trafficAt(new Date().getHours() + new Date().getMinutes() / 60);
  function setClock(h) { traffic = trafficAt(((Number(h) % 24) + 24) % 24); }
  for (const v of vehicles) if (v.type === "car" && Math.random() > traffic) { v.off = true; v.mesh.visible = false; }

  const walkers = [];
  for (let i = 0; i < (LITE ? 26 : 46); i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .62, 4, 8), mat(pick([0x1ab0ba, 0x5446fc, 0x15191d, 0xffffff, 0xd6457a, 0xf2b134, 0x7c8a99])));
    body.position.y = .62; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.21, 10, 8), mat(pick([0xe8c4a0, 0xc99a74, 0x8d5a3b, 0xf1d2b6])));
    head.position.y = 1.32; head.castShadow = true;
    g.add(body, head);
    const side = Math.random() < .5 ? -1 : 1, dir = Math.random() < .5 ? -1 : 1;
    const segs = walkSegments;
    const [a, b] = pick(segs);
    const w = { g, side, dir, a, b, x: rand(a + 1, b - 1), z: side * rand(5.4, 6.9), speed: rand(1, 1.6), ph: Math.random() * 6 };
    g.position.set(w.x, .18, w.z);
    world.add(g);
    walkers.push(w);
  }

  /* ---------- Elektrik direkleri ve Loodos bayrakları ---------- */
  // Kaldırım arkasında tel çekili direkler; tepelerinde dalgalanan Loodos bayrakları gece kendi ışığıyla yanar.
  const flagTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 190;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#1ab0ba"; ctx.fillRect(0, 0, 320, 190);
    ctx.fillStyle = "#0b7c83"; ctx.fillRect(0, 0, 18, 190);
    const hx = 78, hy = 95, r = 40;   // marka altıgeni
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; ctx.lineTo(hx + r * Math.cos(a), hy + r * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx, hy - r); ctx.lineTo(hx + r * .87, hy - r / 2); ctx.lineTo(hx, hy); ctx.lineTo(hx - r * .87, hy - r / 2); ctx.closePath();
    ctx.fillStyle = "#bdeef1"; ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = `800 54px "Red Hat Display"`; ctx.textBaseline = "middle";
    ctx.fillText("loodos", 128, 98);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  })();
  const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: .75, emissive: 0xffffff, emissiveMap: flagTex, emissiveIntensity: 0 });
  signMats.push(flagMat);
  const flagGeo = new THREE.PlaneGeometry(2.4, 1.42).translate(1.2, 0, 0);
  const flags = [];
  const wirePts = [];
  const POLE_H = 8.4;
  for (const [a, b] of walkSegments) {
    for (const side of [-1, 1]) {
      const z = side * 8.75;
      let prev = null;
      for (let x = a + 12; x < b - 3; x += 24) {
        inst.pole.push(local(world, x, 0, z, .26, POLE_H, .26));
        inst.arm.push(local(world, x, POLE_H - .9, z, .16, .16, 2.2));
        inst.bulb.push(local(world, x, POLE_H, z, .34, .22, .34));
        inst.pole.push(local(world, x, POLE_H, z, .08, 2.1, .08));   // bayrak gönderi
        const f = new THREE.Mesh(flagGeo, flagMat);
        f.position.set(x + .04, POLE_H + 1.4, z);
        f.castShadow = true;
        world.add(f);
        flags.push({ f, ph: Math.random() * 6 });
        if (prev != null) {
          // İki tel, ortada hafifçe sarkar
          for (const dz of [-.95, .95]) {
            const y0 = POLE_H - .78, N = 10;
            for (let i = 0; i < N; i++) {
              const k0 = i / N, k1 = (i + 1) / N, sag = k => Math.sin(Math.PI * k) * .55;
              wirePts.push(prev + (x - prev) * k0, y0 - sag(k0), z + dz, prev + (x - prev) * k1, y0 - sag(k1), z + dz);
            }
          }
        }
        prev = x;
      }
    }
  }
  if (wirePts.length) {
    const wg = new THREE.BufferGeometry();
    wg.setAttribute("position", new THREE.Float32BufferAttribute(wirePts, 3));
    world.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a3438, transparent: true, opacity: .55 })));
  }

  /* ---------- Şehri çevreleyen demiryolu ve Loodos Express ---------- */
  // Köşeleri yuvarlatılmış halka; ana yolun ve ara sokakların bittiği yerin dışından geçer, hiçbir yolu kesmez.
  const RAIL = { x0: X_MIN - 30, x1: X_MAX + 30, z0: -31, z1: 31, r: 12 };   // genel görünümde ekranın içinde kalır
  const track = new THREE.Path();
  track.moveTo(RAIL.x0 + RAIL.r, RAIL.z0);
  track.lineTo(RAIL.x1 - RAIL.r, RAIL.z0);
  track.absarc(RAIL.x1 - RAIL.r, RAIL.z0 + RAIL.r, RAIL.r, -Math.PI / 2, 0, false);
  track.lineTo(RAIL.x1, RAIL.z1 - RAIL.r);
  track.absarc(RAIL.x1 - RAIL.r, RAIL.z1 - RAIL.r, RAIL.r, 0, Math.PI / 2, false);
  track.lineTo(RAIL.x0 + RAIL.r, RAIL.z1);
  track.absarc(RAIL.x0 + RAIL.r, RAIL.z1 - RAIL.r, RAIL.r, Math.PI / 2, Math.PI, false);
  track.lineTo(RAIL.x0, RAIL.z0 + RAIL.r);
  track.absarc(RAIL.x0 + RAIL.r, RAIL.z0 + RAIL.r, RAIL.r, Math.PI, Math.PI * 1.5, false);
  const TRACK_LEN = track.getLength();
  const trackAt = (sArc, out = {}) => {
    const u = (((sArc % TRACK_LEN) + TRACK_LEN) % TRACK_LEN) / TRACK_LEN;
    const p = track.getPointAt(u), d = track.getTangentAt(u);
    out.x = p.x; out.z = p.y; out.yaw = Math.atan2(-d.y, d.x);
    return out;
  };
  {
    const step = 1.1, tp = {};
    for (let sArc = 0; sArc < TRACK_LEN; sArc += step) {
      trackAt(sArc, tp);
      const nx = Math.sin(tp.yaw), nz = Math.cos(tp.yaw);   // raya dik yön
      inst.ballast.push(local(world, tp.x, 0, tp.z, step + .05, .22, 3.2, tp.yaw));
      inst.sleeper.push(local(world, tp.x, .22, tp.z, .32, .1, 2.5, tp.yaw));
      for (const k of [-.62, .62]) inst.rail.push(local(world, tp.x + nx * k, .32, tp.z + nz * k, step + .06, .12, .12, tp.yaw));
    }
  }
  // İstasyon: kuzey hattında, Loodos merkezinin arkasında; tren her turda burada kısa bir mola verir.
  const stationS = hqX - (RAIL.x0 + RAIL.r) + 11;   // tren peronun ortasında durur
  {
    const st = new THREE.Group();
    box(st, 22, .7, 3.4, M.walk, 0, 0, 0);
    box(st, 22, .12, .25, M.amber, 0, .7, -1.55, false);
    for (const x of [-9, -3, 3, 9]) cyl(st, .12, .12, 3.4, M.ink, x, .7, .9, 8);
    box(st, 23, .3, 3.2, M.teal, 0, 4.1, .4);
    const stTex = wordTexture("loodos", { color: "#1ab0ba", sub: "EXPRESS", h: 200 });
    signBoard(st, stTex, 6, 1.9, 5.4, .4, .3);
    for (const x of [-6, 6]) box(st, 1.8, .45, .6, M.tealInk, x, .7, 1);
    st.position.set(hqX, 0, RAIL.z0 + 3.4);
    world.add(st);
  }

  // İki tren aynı yönde, halkanın iki yarısında; ikisi de istasyonda durur, aradaki mesafe korunur.
  const trains = [];
  const locoTex = wordTexture("loodos", { bg: "#1ab0ba", color: "#ffffff", sub: "EXPRESS", h: 200 });
  const locoSide = new THREE.MeshStandardMaterial({ map: locoTex, roughness: .6, emissive: 0xffffff, emissiveMap: locoTex, emissiveIntensity: 0 });
  signMats.push(locoSide);
  function makeTrain(startS) {
    const train = { cars: [], s: startS, speed: 0, max: 11, state: "run", wait: 0, served: false };
    const LEN_CAR = [7.2, 6.4, 6.4, 6.4, 6.4];
    LEN_CAR.forEach((L, i) => {
      const g = new THREE.Group();
      for (const x of [-L / 2 + 1.3, L / 2 - 1.3]) box(g, 1.6, .45, 1.9, M.ink, x, .38, 0);
      if (i === 0) {
        box(g, L - 1.6, 2.2, 2.3, M.teal, -.8, .8, 0);
        const side = new THREE.Mesh(BOX, [M.teal, M.teal, M.teal, M.teal, locoSide, locoSide]);
        side.scale.set(3.6, 1.1, 2.34); side.position.set(-1.4, 1.95, 0);
        g.add(side);
        box(g, 1.6, 1.6, 2.3, M.white, L / 2 - .8, .8, 0);
        box(g, .1, .7, 1.9, M.glassDark, L / 2, 1.75, 0, false);
        box(g, L - .4, .25, 2.1, M.ink, 0, 3, 0);
        for (const z of [-.7, .7]) box(g, .08, .22, .34, headMat, L / 2 + .02, 1.05, z, false);
      } else {
        box(g, L, 2.2, 2.3, M.white, 0, .8, 0);
        box(g, L + .02, .32, 2.34, M.teal, 0, 1.25, 0);
        box(g, L - .9, .55, 2.34, M.glass, 0, 1.9, 0);
        box(g, L - .2, .22, 2.1, M.roof, 0, 3, 0);
      }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      world.add(g);
      train.cars.push({ g, back: LEN_CAR.slice(0, i).reduce((a, b) => a + b + .7, 0) + (L - LEN_CAR[0]) / 2 });
    });
    trains.push(train);
  }
  makeTrain(stationS - 60);
  makeTrain(stationS - 60 - TRACK_LEN / 2);
  const tpos = {};
  function stepTrain(dt) {
    for (const train of trains) {
      // İstasyona yaklaşırken yavaşlar, 5 sn bekler, sonra yeniden hızlanır.
      const ahead = ((stationS - train.s) % TRACK_LEN + TRACK_LEN) % TRACK_LEN;
      let want = train.max;
      if (train.state === "wait") {
        want = 0;
        train.wait -= dt;
        if (train.wait <= 0) { train.state = "run"; train.served = true; }
      } else if (!train.served && ahead < 30) {
        want = Math.max(.6, train.max * ahead / 30);
        if (ahead < .25) { train.state = "wait"; train.wait = 5; train.speed = 0; want = 0; }
      }
      if (train.served && ahead > 40 && ahead < TRACK_LEN - 40) train.served = false;
      train.speed += (want - train.speed) * Math.min(1, dt * (want < train.speed ? 3 : .6));
      train.s = (train.s + train.speed * dt) % TRACK_LEN;
      for (const c of train.cars) {
        trackAt(train.s - c.back, tpos);
        c.g.position.set(tpos.x, 0, tpos.z);
        c.g.rotation.y = tpos.yaw;
      }
    }
  }

  /* ---------- Havalimanı ve SunExpress uçakları ---------- */
  // SunExpress vakasına selam: Havacılık mahallesinin arkasındaki piste inip kalkan SunExpress uçakları.
  // Tıklanınca SunExpress dükkânı açılır.
  const sunex = data.companies.find(c => c.id === "sunexpress");
  const avi = districts.find(d => d.s.id === "avi");
  const RWY = { x: avi ? avi.cx : 0, z: -52, len: 150 };
  const GEAR_Y = 1.95;   // pistteyken gövde merkezinin yerden yüksekliği (uçak ölçeği dahil)
  const planes = [];
  const navRed = new THREE.MeshStandardMaterial({ color: 0x7a2020, emissive: 0xff3b30, emissiveIntensity: 0 });
  const navGreen = new THREE.MeshStandardMaterial({ color: 0x1f5a2c, emissive: 0x2bff6a, emissiveIntensity: 0 });
  const strobe = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 });
  {
    const ap = new THREE.Group();
    ap.position.set(RWY.x, 0, RWY.z);
    world.add(ap);
    plane(ap, RWY.len + 10, 9, mat(0x8f9aa1, { roughness: .95 }), 0, .03, 0);
    plane(ap, 46, 15, mat(0xb9c2c6, { roughness: 1 }), -18, .03, -13);
    plane(ap, 5, 6, mat(0xb9c2c6, { roughness: 1 }), -18, .031, -4.5);
    for (let x = -RWY.len / 2 + 12; x < RWY.len / 2 - 10; x += 8) inst.dash.push(local(ap, x, .05, 0, 4, .02, .3));
    for (const end of [-1, 1]) for (let k = -3; k <= 3; k++) inst.zebra.push(local(ap, end * (RWY.len / 2 - 2.5), .05, k * 1.1, 3.5, .02, .5));
    for (let x = -RWY.len / 2; x <= RWY.len / 2; x += 10) for (const z of [-4.7, 4.7]) inst.bulb.push(local(ap, x, .05, z, .3, .2, .3));
    cyl(ap, .9, 1.2, 10, M.wall2, 14, 0, -14);
    cyl(ap, 2, 1.6, 1.8, M.glassDark, 14, 10, -14);
    cyl(ap, 2.2, 2.2, .3, M.teal, 14, 11.8, -14);
  }
  if (sunex) {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 96;
    drawLogo(cv.getContext("2d"), sunex, 14, 10, 484, 76, "#12305e");
    const logoTex = new THREE.CanvasTexture(cv);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const logoMat = new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: .5, depthWrite: false, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0 });
    signMats.push(logoMat);
    const fuse = mat(0xffffff, { roughness: .4 });
    const finMat = mat(0xff8a1c, { roughness: .5 });
    const sunMat = mat(0xffd23f, { roughness: .5, emissive: 0xffb000, emissiveIntensity: .25 });
    const belly = mat(0x12305e, { roughness: .5 });
    const part = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const finShape = new THREE.Shape();
    finShape.moveTo(-5.3, 0); finShape.lineTo(-3.3, 0); finShape.lineTo(-4.6, 2.5); finShape.lineTo(-5.6, 2.5); finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: .16, bevelEnabled: false }).translate(0, .45, -.08);
    function planeMesh() {
      const g = new THREE.Group();
      part(g, new THREE.CylinderGeometry(.62, .62, 7.6, 18).rotateZ(Math.PI / 2), fuse, 0, 0, 0);
      part(g, new THREE.SphereGeometry(.62, 18, 12), fuse, 3.8, 0, 0).scale.set(1.7, 1, 1);
      part(g, new THREE.ConeGeometry(.62, 1.9, 18).rotateZ(Math.PI / 2), fuse, -4.75, .12, 0).scale.set(1, .8, 1);
      part(g, new THREE.BoxGeometry(6.6, .14, .9), belly, -.3, -.56, 0);
      part(g, new THREE.BoxGeometry(.5, .32, .9), M.glassDark, 4.25, .25, 0);
      part(g, new THREE.BoxGeometry(2.1, .14, 10), fuse, .3, -.2, 0);
      for (const z of [-2.3, 2.3]) part(g, new THREE.CylinderGeometry(.32, .3, 1.5, 14).rotateZ(Math.PI / 2), belly, .9, -.55, z);
      part(g, new THREE.BoxGeometry(1.1, .1, 3.6), fuse, -4.7, .25, 0);
      part(g, finGeo, finMat, 0, 0, 0);
      for (const [gx, gz] of [[2.6, 0], [-.2, -.85], [-.2, .85]]) part(g, new THREE.BoxGeometry(.18, .5, .18), M.ink, gx, -.83, gz);
      for (const z of [-.09, .09]) {
        const disc = part(g, new THREE.CircleGeometry(.5, 24), sunMat, -4.75, 1.85, z);
        disc.rotation.y = z < 0 ? Math.PI : 0;
        disc.castShadow = false;
        const decal = part(g, new THREE.PlaneGeometry(4.4, .8), logoMat, .5, .1, z < 0 ? -.63 : .63);
        decal.rotation.y = z < 0 ? Math.PI : 0;
        decal.castShadow = false;
      }
      // Yukarıdan bakışta okunsun diye logo kanatların üstünde de var
      for (const z of [-2.9, 2.9]) {
        const wing = part(g, new THREE.PlaneGeometry(4.2, .82), logoMat, .3, -.115, z);
        wing.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
        wing.castShadow = false;
      }
      part(g, new THREE.BoxGeometry(.3, .16, .2), navRed, .3, -.2, -5.05);
      part(g, new THREE.BoxGeometry(.3, .16, .2), navGreen, .3, -.2, 5.05);
      part(g, new THREE.BoxGeometry(.2, .12, .2), strobe, -5.6, .4, 0);
      g.rotation.order = "YXZ";
      g.scale.setScalar(1.8);   // izometrik görünümde uzaktan seçilebilsin
      g.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "company", id: "sunexpress" }; });
      world.add(g);
      pickables.push(g);
      return g;
    }
    // Apronda bekleyen uçak
    const parked = planeMesh();
    parked.position.set(RWY.x - 22, GEAR_Y, RWY.z - 13);
    parked.rotation.set(0, .5, 0);

    // Trafik paterni: batıdan alçalıp piste iner, pistin ortasında durur, kalan pistte hızlanıp kalkar,
    // şehrin etrafında güneyden dolaşıp yeniden son yaklaşmaya girer. Noktalar pist yönüne (doğu) göre.
    const X = RWY.x, Z = RWY.z;
    const west = Math.min(X_MIN - 40, X - 330), east = Math.max(X_MAX + 40, X + 260);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const pts = [
      V(X - 230, 32, Z), V(X - 160, 18, Z), V(X - 108, 6, Z),
      V(X - 64, 0, Z), V(X - 25, 0, Z), V(X + 8, 0, Z), V(X + 42, 0, Z),
      V(X + 74, 2, Z), V(X + 130, 15, Z), V(X + 195, 30, Z + 18),
      V(east, 42, 22), V(east - 40, 46, 88), V(0, 48, 108), V(west + 40, 46, 88),
      V(west, 42, 25), V(west + 20, 38, Z - 22), V(X - 290, 35, Z - 3),
    ];
    const route = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    route.arcLengthDivisions = 3000;
    const ROUTE_LEN = route.getLength();
    const sOf = target => {   // rotadaki en yakın noktanın yay uzunluğu
      let best = 0, bd = Infinity;
      for (let i = 0; i < 3000; i++) { const d = route.getPointAt(i / 3000).distanceToSquared(target); if (d < bd) { bd = d; best = i / 3000; } }
      return best * ROUTE_LEN;
    };
    const touchS = sOf(pts[3]), stopS = sOf(V(X + 2, 0, Z)), liftS = sOf(pts[7]);
    const rel = s => ((s - touchS) % ROUTE_LEN + ROUTE_LEN) % ROUTE_LEN;
    const STOP_REL = rel(stopS), LIFT_REL = rel(liftS);
    const flight = { route, ROUTE_LEN, rel, STOP_REL, LIFT_REL };
    for (const s0 of [ROUTE_LEN * .45, ROUTE_LEN * .95]) {
      planes.push({ g: planeMesh(), s: s0, speed: 22, wait: 0, served: false, yaw: null, roll: 0, flight });
    }
  }
  const pp = new THREE.Vector3(), pt = new THREE.Vector3();
  function stepPlanes(dt) {
    strobe.emissiveIntensity = (t % 1.3) < .1 ? 3 : 0;
    for (const p of planes) {
      const { route, ROUTE_LEN, rel, STOP_REL, LIFT_REL } = p.flight;
      const r = rel(p.s);
      let want = 22;
      if (p.wait > 0) { want = 0; p.wait -= dt; if (p.wait <= 0) p.served = true; }
      else if (r > ROUTE_LEN - 130) want = 15;                                   // son yaklaşma
      else if (r < STOP_REL && !p.served) {                                       // iniş koşusu
        want = Math.max(1.2, 15 * (STOP_REL - r) / STOP_REL);
        if (STOP_REL - r < .3) { p.wait = 6; p.speed = 0; want = 0; }
      } else if (r < LIFT_REL) want = 4 + 22 * (r - STOP_REL) / Math.max(1, LIFT_REL - STOP_REL);   // kalkış koşusu
      if (p.served && r > LIFT_REL && r < ROUTE_LEN - 140) p.served = false;
      p.speed += (want - p.speed) * Math.min(1, dt * (want < p.speed ? 2.2 : 1));
      if (p.wait > 0) p.speed = 0;
      p.s = (p.s + p.speed * dt) % ROUTE_LEN;
      const u = p.s / ROUTE_LEN;
      route.getPointAt(u, pp);
      route.getTangentAt(u, pt);
      const yaw = Math.atan2(-pt.z, pt.x);
      const turn = p.yaw == null ? 0 : Math.atan2(Math.sin(yaw - p.yaw), Math.cos(yaw - p.yaw)) / Math.max(dt, 1e-3);
      p.yaw = yaw;
      const alt = Math.max(0, pp.y);
      // Dönüşte iç kanat aşağı; yerde yatış yok
      p.roll += (THREE.MathUtils.clamp(-turn * .9, -.45, .45) * Math.min(1, alt / 8) - p.roll) * Math.min(1, dt * 2);
      p.g.position.set(pp.x, GEAR_Y + alt, pp.z);
      p.g.rotation.set(p.roll, yaw, alt > .2 ? Math.asin(THREE.MathUtils.clamp(pt.y, -.5, .5)) : 0);
    }
  }

  /* ---------- Bug ambulansı (Loodos Hotfix) ---------- */
  // Ara sıra merkezden çıkar, iki şeridin ortasından sirenle geçer, bir dükkânın hatasını yerinde çözer ve sokaktan ayrılır.
  // Süreler simülasyondur: 1 sn = 1 dk. Bug kaydı bu oturumda açılan ve çözülen görevlerden hesaplanır.
  const ambRed = mat(0xe5484d, { roughness: .5 });
  const flashR = new THREE.MeshStandardMaterial({ color: 0xff2d2d, emissive: 0xff2d2d, emissiveIntensity: .2 });
  const flashB = new THREE.MeshStandardMaterial({ color: 0x2d6bff, emissive: 0x2d6bff, emissiveIntensity: .2 });
  const amb = { id: "hotfix", mesh: new THREE.Group(), state: "idle", timer: 45, x: 0, dir: 1, speed: 0, target: null, mission: null,
    stats: { opened: 0, resolved: 0, fixMin: 0, respMin: 0 }, seq: 4800 + Math.floor(Math.random() * 300) };
  {
    const g = amb.mesh;
    box(g, 4.2, 2, 2, M.white, 0, .5, 0);
    box(g, 1, 1.2, 2, M.white, 2.4, .5, 0);
    box(g, .1, .7, 1.7, M.glassDark, 2.95, 1.1, 0);
    box(g, 4.25, .34, 2.04, ambRed, 0, 1.3, 0);
    const tex = wordTexture("HOTFIX", { color: "#e5484d", sub: tt("amb.side"), h: 150, w: 640 });
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    signMats.push(side);
    const panelM = new THREE.Mesh(BOX, [M.white, M.white, M.white, M.white, side, side]);
    panelM.scale.set(3.3, .72, 2.04); panelM.position.set(-.35, 2.05, 0);
    g.add(panelM);
    box(g, .55, .28, .7, flashR, .9, 2.5, -.45, false);
    box(g, .55, .28, .7, flashB, .9, 2.5, .45, false);
    box(g, 1.5, .06, .42, ambRed, -1, 2.5, 0, false);
    box(g, .42, .06, 1.5, ambRed, -1, 2.5, 0, false);
    wheels(g, [1.9, -1.4], 1.02, .38);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.pick = { kind: "ambulance", id: amb.id }; } });
    vehicleLights(g, "van");
    g.visible = false;
    world.add(g);
    pickables.push(g);
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    amb.tag = document.createElement("button");
    amb.tag.className = "veh-tag amb";
    amb.tag.addEventListener("click", e => { e.stopPropagation(); select("ambulance", amb.id, true); });
    wrap.appendChild(amb.tag);
    amb.label = new CSS2DObject(wrap);
    amb.label.position.set(0, 3.8, 0);
    amb.label.visible = false;
    g.add(amb.label);
  }
  // Olay yerinde kurulan masa: iki kişilik Hotfix ekibi, MacBook ve tepede akan terminal
  const desk = new THREE.Group();
  const deskCrew = [];
  const furniture = new THREE.Group();   // masa ve MacBook; kurulurken yerden yükselir
  desk.add(furniture);
  let lid, screenMat, termEl, termLines = [], termShown = -1;
  {
    box(furniture, 1.7, .08, .9, M.white, 0, .78, 0);
    for (const [x, z] of [[-.75, -.38], [.75, -.38], [-.75, .38], [.75, .38]]) box(furniture, .06, .78, .06, M.ink, x, 0, z);
    const alu = mat(0xc9ced3, { roughness: .3, metalness: .7 });
    box(furniture, .62, .03, .42, alu, 0, .86, -.05);            // MacBook gövdesi
    lid = new THREE.Group();
    lid.position.set(0, .89, .16);                                // menteşe ön kenarda; ekran ekibe bakar
    furniture.add(lid);
    box(lid, .62, .4, .02, alu, 0, 0, 0);
    screenMat = new THREE.MeshStandardMaterial({ color: 0x0b1016, emissive: 0x1ab0ba, emissiveIntensity: .25 });
    const scr = box(lid, .56, .34, .005, screenMat, 0, .03, -.012, false);
    scr.userData.screen = true;
    const coat = mat(0xffffff, { roughness: .7 }), band = mat(0xe5484d, { roughness: .5 });
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .62, 4, 8), coat);
      body.position.y = .6; body.castShadow = true;
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.255, .255, .1, 12), band);
      stripe.position.y = .78;
      const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(i ? 0xc99a74 : 0xe8c4a0));
      head.position.y = 1.28;
      p.add(body, stripe, head);
      desk.add(p);
      deskCrew.push(p);
    }
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    termEl = document.createElement("div");
    termEl.className = "term";
    wrap.appendChild(termEl);
    const term = new CSS2DObject(wrap);
    term.position.set(0, 2.5, 0);
    desk.add(term);
    desk.userData.term = term;
    desk.visible = false;
    term.visible = false;
    world.add(desk);
  }
  // Hata ayıklama senaryosu: platforma göre komutlar, hatanın başlığıyla commit
  function hotfixScript(m) {
    const branch = "hotfix/" + m.id.toLowerCase();
    const p = /android|kotlin/i.test(m.platform) ? "android" : /ios|swift/i.test(m.platform) ? "ios" : "web";
    const file = { ios: "Checkout/CartTotal.swift", android: "checkout/CartTotal.kt", web: "src/checkout/cartTotal.ts" }[p];
    const test = { ios: ["$ xcodebuild test -scheme App", "✓ 214 tests passed"], android: ["$ ./gradlew testRelease", "✓ BUILD SUCCESSFUL"], web: ["$ npm test", "✓ 162 passed"] }[p];
    return [
      ["cmd", `$ git checkout -b ${branch}`],
      ["cmd", `$ grep -rn "total" ${file.split("/")[0]}/`],
      ["", `${file}:42`],
      ["del", "- let total = items.sum() - discount"],
      ["add", "+ let total = max(0, items.sum() - discount)"],
      ["cmd", test[0]], ["ok", test[1]],
      ["cmd", `$ git commit -am "fix: ${m.title.toLocaleLowerCase(document.documentElement.lang)}"`],
      ["cmd", `$ git push origin ${branch}`],
      ["ok", "🚀 " + tt("amb.term.shipped", { shop: m.company.name })],
    ];
  }
  const ONSITE = 13;   // varış: 0–1.4 kurulum, 1.4–2.2 kapak açılır, 2.2–11 kod, 11–13 toplanır
  function stepDesk() {
    const m = amb.mission;
    if (amb.state !== "onsite" || !m) {
      if (desk.visible) { desk.visible = false; desk.userData.term.visible = false; }
      return;
    }
    const e = ONSITE - amb.timer, side = amb.target.side;
    if (!desk.visible) {
      desk.visible = true;
      desk.position.set(amb.target.x, .18, side * 5.7);
      desk.rotation.y = side > 0 ? Math.PI : 0;   // yerel +z yola bakar
      termLines = hotfixScript(m);
      termShown = -1;
    }
    const setup = THREE.MathUtils.clamp(e / 1.4, 0, 1), pack = THREE.MathUtils.clamp((e - 11) / 2, 0, 1);
    const k = setup * (1 - pack);
    // Ekip ambulanstan (yerel z ≈ +5.7) masanın arkasına yürür, sonra geri döner
    deskCrew.forEach((p, i) => {
      p.position.set(i ? .55 : -.55, 0, THREE.MathUtils.lerp(5.4, -.75, k));
      p.rotation.y = 0;
      p.position.y = Math.abs(Math.sin(e * (k < 1 && k > 0 ? 9 : 0))) * .05 + (i === 0 && e > 2.2 && e < 11 ? Math.abs(Math.sin(e * 14)) * .02 : 0);
    });
    furniture.scale.set(1, Math.max(.001, k), 1);
    lid.visible = k > .9;
    lid.rotation.x = -THREE.MathUtils.clamp((e - 1.4) / .8, 0, 1) * (1 - THREE.MathUtils.clamp((e - 10.6) / .5, 0, 1)) * 1.85;
    screenMat.emissiveIntensity = lid.rotation.x < -1 ? 1.2 : .1;
    const coding = e > 2.2 && e < 11.4;
    desk.userData.term.visible = coding;
    if (coding) {
      const n = Math.min(termLines.length, Math.floor((e - 2.2) / 8.6 * termLines.length) + 1);
      if (n !== termShown) {
        termShown = n;
        const shown = termLines.slice(Math.max(0, n - 7), n);
        termEl.innerHTML = shown.map(([c, s], i) => `<div class="ln ${c}">${esc(s)}${i === shown.length - 1 && n < termLines.length ? '<i class="cur"></i>' : ""}</div>`).join("");
      }
    }
  }
  function ambTag() {
    const m = amb.mission;
    const st = !m ? "" : amb.state === "enroute" ? "→ " + m.company.name : amb.state === "onsite" ? tt("amb.tag.onsite") : tt("amb.tag.fixed");
    amb.tag.className = "veh-tag amb" + (selected?.kind === "ambulance" ? " on" : "");
    amb.tag.innerHTML = `<b>${m ? esc(m.id) : "HOTFIX"}</b>${esc(st)}`;
  }
  function dispatch() {
    if (extras.busy()) { amb.timer = 15; return; }   // itfaiye sahadayken bekler
    const lot = pick(lots.filter(l => l.c.id !== "lead"));
    if (!lot) { amb.timer = 60; return; }
    const proj = pick(lot.c.projects);
    const platforms = proj.tech.filter(x => /ios|android|huawei|web|react|flutter|kotlin|swift/i.test(x));
    amb.seq += 3 + Math.floor(Math.random() * 40);
    amb.dir = Math.random() < .5 ? 1 : -1;
    amb.x = amb.dir > 0 ? X_MIN - 14 : X_MAX + 14;
    amb.speed = 15;
    amb.target = lot;
    amb.state = "enroute";
    const titles = tt("bug.titles");
    amb.mission = {
      id: "BUG-" + amb.seq, title: pick(titles), sev: pick(["P1", "P2", "P2", "P3"]), company: lot.c, sector: lot.s,
      project: proj.app || proj.sub || "", platform: platforms.length ? pick(platforms) : pick(["iOS", "Android"]),
      affected: +(0.3 + Math.random() * 3.7).toFixed(1), cf0: +(98.9 + Math.random() * .6).toFixed(2), cf1: +(99.82 + Math.random() * .16).toFixed(2),
      t0: t, tArrive: null, tFixed: null, from: amb.x,
    };
    amb.stats.opened++;
    amb.mesh.position.set(amb.x, 0, 0);
    amb.mesh.rotation.y = amb.dir > 0 ? 0 : Math.PI;
    amb.mesh.visible = true;
    amb.label.visible = true;
    ambTag();
    notify({ kind: "bug", company: lot.c.id, text: tt("ev.dispatch", { id: amb.mission.id, shop: lot.c.name }), sub: amb.mission.title, at: new Date() });
  }
  function stepAmbulance(dt) {
    let sound = 0;
    if (amb.state === "idle") {
      amb.timer -= dt;
      if (amb.timer <= 0) dispatch();
    } else {
      const m = amb.mission;
      let want = 15;
      if (amb.state === "enroute") {
        const rem = (amb.target.x - amb.x) * amb.dir;
        if (rem < 14) want = Math.max(1.5, 15 * rem / 14);
        if (rem <= .3) { amb.state = "onsite"; amb.timer = ONSITE; amb.speed = 0; want = 0; m.tArrive = t; ambTag(); }
      } else if (amb.state === "onsite") {
        want = 0;
        amb.timer -= dt;
        if (amb.timer <= 0) {
          amb.state = "leaving";
          m.tFixed = t;
          amb.stats.resolved++;
          amb.stats.fixMin += m.tFixed - m.t0;
          amb.stats.respMin += m.tArrive - m.t0;
          ambTag();
          notify({ kind: "bug", resolved: true, company: m.company.id, text: tt("ev.fixed", { id: m.id, shop: m.company.name, m: Math.round(m.tFixed - m.t0) }), sub: m.title, at: new Date() });
        }
      }
      amb.speed += (want - amb.speed) * Math.min(1, dt * 3);
      amb.x += amb.dir * amb.speed * dt;
      amb.mesh.position.x = amb.x;
      const flip = Math.floor(t * 6) % 2;
      flashR.emissiveIntensity = flip ? 3.2 : .15;
      flashB.emissiveIntensity = flip ? .15 : 3.2;
      if (amb.state !== "onsite") {
        // Siren yalnız yoldayken ve ambulans ekrana yakınken duyulur
        const half = VIEW * el.clientWidth / el.clientHeight / 2 / camera.zoom;
        sound = THREE.MathUtils.clamp(1.2 - Math.abs(amb.x - controls.target.x) / half, 0, 1);
      }
      if (amb.state === "leaving" && (amb.x > X_MAX + 16 || amb.x < X_MIN - 16)) {
        amb.state = "idle";
        amb.timer = rand(100, 160);
        amb.mesh.visible = false;
        amb.label.visible = false;
        if (follow === amb) follow = null;
      }
    }
    return sound;
  }

  /* ---------- Müşteri detayları, özel günler, şehir hayatı (js/extras.js) ---------- */
  const extras = buildExtras({
    world, scene, camera, controls, VIEW, el, box, cyl, plane, mat, M, BOX, carMesh, companies, parks, districts,
    LEN, X_MIN, X_MAX, LOT_Z, hqX, hq, fountain, walkSegments, plazaPos: plaza.position, signMats, wordTexture, glowTex, flagMat, flagTex,
    crowns: inst.crown, data, pickables, LITE, rand, pick, tt, onEvent: notify, leadX: leadLot.x,
    selectLead: () => select("lead", "lead", true),
    selectHQ: () => select("hq", "loodos", true),
    laneBusy: () => amb.state !== "idle",   // ambulans ve itfaiye aynı orta şeridi kullanır, sırayla çıkar
    selectCompany: id => select("company", id, true),
  });

  extrasRef = extras;

  /* ---------- Instanced parçaları oluştur ---------- */
  scene.updateMatrixWorld(true);
  function flush(list, geo, material, { cast = true, colors = false } = {}) {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach((p, i) => {
      tmpP.set(p.x, p.y + p.sy / 2, p.z);
      tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry || 0);
      tmpS.set(p.sx, p.sy, p.sz);
      tmpM.compose(tmpP, tmpQ, tmpS).premultiply(p.group.matrixWorld);
      im.setMatrixAt(i, tmpM);
      if (colors) im.setColorAt(i, new THREE.Color(p.color));
    });
    im.castShadow = cast; im.receiveShadow = true;
    scene.add(im);
  }
  flush(inst.win, BOX, mat(0x7fc6cf, { roughness: .2, metalness: .1 }), { cast: false });
  const winLitMat = mat(0x7fc6cf, { roughness: .2, metalness: .1, emissive: 0xffcf7a, emissiveIntensity: 0 });
  flush(inst.winLit, BOX, winLitMat, { cast: false });
  flush(inst.trunk, new THREE.CylinderGeometry(.5, .6, 1, 6), M.trunk);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0 });
  flush(inst.crown, new THREE.IcosahedronGeometry(1, 0), crownMat, { colors: true });
  flush(inst.lamp, BOX, M.ink);
  const bulbMat = mat(0xffffff, { emissive: 0xfff4d6, emissiveIntensity: .6 });
  flush(inst.bulb, BOX, bulbMat, { cast: false });
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffcf87, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  poolMat.visible = false;
  flush(inst.pool, flatGeo, poolMat, { cast: false });
  flush(inst.dash, BOX, mat(C.line, { roughness: 1 }), { cast: false });
  flush(inst.zebra, BOX, mat(C.line, { roughness: 1 }), { cast: false });
  flush(inst.ballast, BOX, mat(0xc4c9c6, { roughness: 1 }), { cast: false });
  flush(inst.pole, BOX, mat(0x8d979b, { roughness: .8 }));
  flush(inst.arm, BOX, M.ink);
  flush(inst.sleeper, BOX, mat(0x8a7560, { roughness: .95 }), { cast: false });
  flush(inst.rail, BOX, mat(0x6f7c84, { roughness: .4, metalness: .6 }));

  /* ---------- Seçim halkaları ---------- */
  const ringGeo = new THREE.RingGeometry(6.3, 6.8, 64);
  const selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: .9, depthWrite: false }));
  selRing.rotation.x = -Math.PI / 2; selRing.position.y = .12; selRing.visible = false;
  scene.add(selRing);
  const glowRings = [];
  const glowMat = new THREE.MeshBasicMaterial({ color: C.violet, transparent: true, opacity: .7, depthWrite: false });
  const destRing = new THREE.Mesh(new THREE.RingGeometry(5.6, 6, 48), new THREE.MeshBasicMaterial({ color: 0xf2b134, transparent: true, opacity: .9, depthWrite: false }));
  destRing.rotation.x = -Math.PI / 2; destRing.position.y = .13; destRing.visible = false;
  scene.add(destRing);

  /* ---------- Kamera uçuşları ---------- */
  function flyTo(target, zoom, dur = 1100) {
    fly = { t0: performance.now(), dur, from: controls.target.clone(), to: target.clone(), z0: camera.zoom, z1: zoom };
  }
  const fitZoom = width => Math.min(controls.maxZoom, Math.max(controls.minZoom, (VIEW * el.clientWidth / el.clientHeight) / width));
  function home() { follow = null; flyTo(new THREE.Vector3(0, 0, 0), fitZoom(LEN * .92)); }
  function focusSector(id) {
    follow = null;
    const d = districts.find(d => d.s.id === id);
    if (!d) return home();
    const zoom = fitZoom(Math.max(d.x1 - d.x0 + 90, 110));
    flyTo(framed(groundOf(new THREE.Vector3(d.cx, 5, 0)), zoom), zoom);
    for (const [, v] of companies) v.pin.classList.toggle("dim", v.sector.id !== id);
  }
  // Panel sağda açıkken seçilen şeyi ekranın sol-orta kısmına getirir.
  function framed(p, zoom) {
    const panelOpen = el.clientWidth > 860;
    if (!panelOpen) return p;
    const worldPerPx = (VIEW / el.clientHeight) / zoom;
    const shiftPx = 200;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
    return p.clone().addScaledVector(right, shiftPx * worldPerPx);
  }

  // Yüksekteki bir noktanın ekranda göründüğü yere denk gelen zemin noktası; binayı dikeyde ortalar.
  function groundOf(p) {
    const d = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    return p.clone().addScaledVector(d, -p.y / d.y).setY(0);
  }
  const zoomFor = (lo, hi) => Math.min(Math.max(camera.zoom, lo), hi);

  function select(kind, id, fromScene = false) {
    selected = kind ? { kind, id } : null;
    follow = null;
    for (const [, v] of companies) v.pin.classList.remove("on", "dim");
    selRing.visible = false;
    destRing.visible = false;
    if (kind === "company") {
      const c = companies.get(id);
      c.pin.classList.add("on");
      selRing.position.set(c.lot.x, .12, c.lot.side * LOT_Z);
      selRing.visible = true;
      const zoom = zoomFor(1.55, 2.4);
      flyTo(framed(groundOf(new THREE.Vector3(c.lot.x, c.height * .42, c.lot.side * LOT_Z * .8)), zoom), zoom);
    } else if (kind === "hq") {
      selRing.position.set(hqX, .12, -LOT_Z - 1);
      selRing.visible = true;
      const zoom = zoomFor(.95, 1.6);
      flyTo(framed(groundOf(new THREE.Vector3(hqX, 13, -12)), zoom), zoom);
    } else if (kind === "lead") {
      selRing.position.set(leadLot.x, .12, -LOT_Z);
      selRing.visible = true;
      const zoom = zoomFor(1.4, 2.2);
      flyTo(framed(groundOf(new THREE.Vector3(leadLot.x, 5, -LOT_Z * .8)), zoom), zoom);
    } else if (kind === "ambulance") {
      const zoom = zoomFor(2, 3);
      if (amb.mesh.visible) { flyTo(framed(amb.mesh.position.clone().setY(0), zoom), zoom, 800); follow = amb; }
    } else if (kind === "vehicle") {
      const v = vehicles.find(v => v.id === id);
      const zoom = zoomFor(2, 3);
      flyTo(framed(v.mesh.position.clone().setY(0), zoom), zoom, 800);
      follow = v;
    }
    vehicles.forEach(updateTag);
    ambTag();
    if (fromScene) onSelect?.(selected);
  }
  function highlight(ids, pid = null) {
    glowProd = ids ? pid : null;
    vehicles.forEach(updateTag);
    glowRings.forEach(r => r.removeFromParent());
    glowRings.length = 0;
    for (const [cid, v] of companies) {
      const on = ids?.includes(cid);
      v.pin.classList.toggle("glow", !!on);
      v.pin.classList.toggle("dim", !!ids && !on);
      if (on) {
        const r = new THREE.Mesh(ringGeo, glowMat);
        r.rotation.x = -Math.PI / 2; r.position.set(v.lot.x, .11, v.lot.side * LOT_Z);
        scene.add(r); glowRings.push(r);
      }
    }
    if (ids?.length) {
      const xs = ids.map(i => companies.get(i).lot.x);
      const a = Math.min(...xs), b = Math.max(...xs);
      flyTo(new THREE.Vector3((a + b) / 2, 0, 0), fitZoom(Math.max(b - a + 40, 70)));
    }
  }

  /* ---------- Tıklama ve hover ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = null;
  function hit(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const objs = [...pickables, ...vehicles.map(v => v.mesh)];
    const h = ray.intersectObjects(objs, true).find(i => i.object.userData.pick);
    return h?.object.userData.pick || null;
  }
  renderer.domElement.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const p = hit(e);
    if (p?.kind === "loot") extras.rollD20();   // manga & D&D dükkânı: tıklayınca dev zar atılır
    else if (p) select(p.kind, p.id, true);
  });
  let hoverQueued = false, lastMove = null;
  renderer.domElement.addEventListener("pointermove", e => {
    lastMove = e;
    if (hoverQueued || e.buttons) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const p = hit(lastMove);
      const key = p && p.kind === "company" ? p.id : null;
      if (key !== hovered) {
        if (hovered) companies.get(hovered).wallMat.emissive.setHex(0x000000);
        hovered = key;
        if (hovered) companies.get(hovered).wallMat.emissive.setHex(0x0f3d40);
      }
      el.classList.toggle("pointing", !!p);
    });
  });
  // Trackpad'de iki parmakla zoom tarayıcıdan ctrlKey'li, çok küçük tekerlek adımlarıyla gelir; adımı büyütüp yeniden gönderilir.
  el.addEventListener("wheel", e => {
    if (!e.ctrlKey || e.boosted) return;
    e.preventDefault();
    e.stopPropagation();
    const boosted = new WheelEvent("wheel", { deltaY: e.deltaY * 7, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true });
    boosted.boosted = true;
    renderer.domElement.dispatchEvent(boosted);
  }, { capture: true, passive: false });
  // Safari (macOS) trackpad zoom'u tekerlek yerine gesture olaylarıyla verir. Dokunmatikte OrbitControls zaten yakalar.
  if (!matchMedia("(pointer: coarse)").matches) {
    let z0 = null;
    el.addEventListener("gesturestart", e => { e.preventDefault(); z0 = camera.zoom; fly = null; });
    el.addEventListener("gesturechange", e => {
      e.preventDefault();
      if (z0 == null) return;
      camera.zoom = THREE.MathUtils.clamp(z0 * Math.pow(e.scale, 1.6), controls.minZoom, controls.maxZoom);
      camera.updateProjectionMatrix();
    });
    el.addEventListener("gestureend", e => { e.preventDefault(); z0 = null; });
  }
  controls.addEventListener("start", () => { fly = null; follow = null; el.classList.add("grabbing"); });
  controls.addEventListener("end", () => el.classList.remove("grabbing"));

  /* ---------- Hava: yağmur ve kar ---------- */
  // Parçacıklar kameranın baktığı yerin çevresinde, görünen alana göre ölçeklenen bir kutuda yağar;
  // konumlar 0–1 arası tutulduğundan yakınlaştırınca da yoğunluk aynı kalır.
  const PRECIP = LITE ? 2600 : 6000;
  const precipField = () => { const a = new Float32Array(PRECIP * 3); for (let i = 0; i < a.length; i++) a[i] = Math.random(); return a; };
  const rainN = precipField(), snowN = precipField();
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PRECIP * 6), 3));
  const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x6f8794, transparent: true, opacity: .7, depthWrite: false }));
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PRECIP * 3), 3));
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, map: glowTex, size: LITE ? 4 : 5, sizeAttenuation: false, transparent: true, depthWrite: false }));
  for (const o of [rainLines, snowPts]) { o.frustumCulled = false; o.visible = false; scene.add(o); }
  const wx = { rainT: 0, snowT: 0, rain: 0, snow: 0, cover: 0, cloud: 0, flash: 0, nextFlash: 8 };
  function setWeather(kind, instant = false) {
    wx.rainT = kind === "rain" ? 1 : 0;
    wx.snowT = kind === "snow" ? 1 : 0;
    if (instant) { wx.rain = wx.rainT; wx.snow = wx.snowT; wx.cover = wx.snowT * .85; wx.cloud = Math.max(wx.rain, wx.snow * .8); }
  }
  function stepWeather(dt) {
    const before = wx.cloud + wx.cover + wx.flash;
    wx.rain += THREE.MathUtils.clamp(wx.rainT - wx.rain, -dt * .4, dt * .4);
    wx.snow += THREE.MathUtils.clamp(wx.snowT - wx.snow, -dt * .4, dt * .4);
    // Kar yağdıkça örtü birikir, durunca yavaşça erir
    wx.cover = THREE.MathUtils.clamp(wx.cover + (wx.snow > .3 ? dt * .03 : -dt * .02), 0, .85);
    wx.cloud = Math.max(wx.rain, wx.snow * .8);
    // Sağanakta ara sıra şimşek
    if (wx.rain > .8 && (wx.nextFlash -= dt) <= 0) { wx.flash = .18; wx.nextFlash = rand(14, 32); }
    wx.flash = Math.max(0, wx.flash - dt);
    const dirty = Math.abs(wx.cloud + wx.cover + wx.flash - before) > 1e-4;

    const half = VIEW * el.clientWidth / el.clientHeight / 2 / camera.zoom;
    const W = half * 2.8, H = Math.max(25, half * 1.2), cx = controls.target.x, cz = controls.target.z;
    const nRain = Math.floor(PRECIP * wx.rain), nSnow = Math.floor(PRECIP * wx.snow);
    rainLines.visible = nRain > 0;
    snowPts.visible = nSnow > 0;
    if (nRain) {
      const p = rainGeo.attributes.position.array, dw = 55 * dt / H, len = 2.6;
      for (let i = 0; i < nRain; i++) {
        const k = i * 3;
        if ((rainN[k + 2] -= dw) < 0) { rainN[k + 2] += 1; rainN[k] = Math.random(); rainN[k + 1] = Math.random(); }
        const x = cx + (rainN[k] - .5) * W, y = rainN[k + 2] * H, z = cz + (rainN[k + 1] - .5) * W, j = i * 6;
        p[j] = x; p[j + 1] = y; p[j + 2] = z;
        p[j + 3] = x - len * .22; p[j + 4] = y + len; p[j + 5] = z - len * .1;
      }
      rainGeo.attributes.position.needsUpdate = true;
      rainGeo.setDrawRange(0, nRain * 2);
    }
    if (nSnow) {
      const p = snowGeo.attributes.position.array, dw = 5 * dt / H;
      for (let i = 0; i < nSnow; i++) {
        const k = i * 3;
        if ((snowN[k + 2] -= dw * (.7 + (i % 5) * .12)) < 0) { snowN[k + 2] += 1; snowN[k] = Math.random(); snowN[k + 1] = Math.random(); }
        p[k] = cx + (snowN[k] - .5) * W + Math.sin(t * 1.1 + i * 1.7) * .8;
        p[k + 1] = snowN[k + 2] * H;
        p[k + 2] = cz + (snowN[k + 1] - .5) * W + Math.cos(t * .9 + i) * .5;
      }
      snowGeo.attributes.position.needsUpdate = true;
      snowGeo.setDrawRange(0, nSnow);
    }
    return dirty;
  }

  /* ---------- Gündüz / gece ---------- */
  let night = 0, nightTarget = 0;
  const tmpC = new THREE.Color();
  const mix = (out, a, b, k) => out.setHex(a).lerp(tmpC.setHex(b), k);
  function applyNight(n) {
    const lit = smooth(.25, .75, n);            // lambalar alacakaranlıkta yanar
    const dusk = Math.sin(Math.PI * n) * .55;   // geçişte güneş turuncuya döner
    const { cloud, cover, flash } = wx;   // bulut güneşi kısar ve gökyüzünü griye çeker
    mix(scene.background, DAY.bg, NIGHT.bg, n).lerp(tmpC.setHex(n > .5 ? 0x121a20 : 0xb7c2c7), cloud * .55);
    mix(hemi.color, DAY.sky, NIGHT.sky, n);
    mix(hemi.groundColor, DAY.ground, NIGHT.ground, n);
    hemi.intensity = (DAY.hemi + (NIGHT.hemi - DAY.hemi) * n) * (1 - .18 * cloud) + (flash > 0 ? 2.6 : 0);
    mix(sun.color, DAY.sun, NIGHT.sun, n).lerp(tmpC.setHex(DUSK), dusk * (1 - cloud));
    sun.intensity = (DAY.sunI + (NIGHT.sunI - DAY.sunI) * n) * (1 - .55 * cloud);
    // Kar örtüsü: zemin, çatılar, kaldırımlar beyazlar; ağaç tepeleri soluklaşır
    mix(groundMat.color, C.ground, 0xffffff, cover);
    mix(M.roof.color, C.roof, 0xffffff, cover);
    mix(M.walk.color, C.walk, 0xffffff, cover);
    mix(M.road.color, C.road, 0xe4eaed, cover * .6);
    crownMat.emissiveIntensity = cover * .45;
    mix(rainLines.material.color, 0x6f8794, 0xa9c4d0, n);   // gündüz koyu, gece açık damla
    winLitMat.emissiveIntensity = 1.15 * lit;
    M.glass.emissiveIntensity = .75 * lit;
    bulbMat.emissiveIntensity = .6 + 2.6 * lit;
    poolMat.opacity = .55 * lit; poolMat.visible = lit > .01;
    beamMat.opacity = .4 * lit; beamMat.visible = lit > .01;
    headMat.emissiveIntensity = 2.4 * lit;
    tailMat.emissiveIntensity = 1.8 * lit;
    for (const m of signMats) m.emissiveIntensity = .5 * lit;
    extras.applyNight(lit);
    hqTeal.emissiveIntensity = .9 * lit;
    water.emissiveIntensity = .3 * lit;
    navRed.emissiveIntensity = 2.2 * lit;
    navGreen.emissiveIntensity = 2.2 * lit;
  }
  function setNight(n, instant = false) {
    nightTarget = THREE.MathUtils.clamp(Number(n) || 0, 0, 1);
    if (instant) { night = nightTarget; applyNight(night); }
  }
  setWeather(initialWeather, true);
  setNight(initialNight, true);

  /* ---------- Döngü ---------- */
  const clock = new THREE.Clock();
  let t = 0;
  let frameErrors = 0;
  function tick() {
    // Döngü her koşulda sürer: bir karedeki hata animasyonu durdurmaz.
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05);
    if (lost) return;
    try { step(dt); } catch (err) { if (frameErrors++ < 3) console.error("Kare atlandı:", err); }
  }
  function step(dt) {
    t += dt;

    if (fly) {
      const k = Math.min((performance.now() - fly.t0) / fly.dur, 1), e = ease(k);
      const off = new THREE.Vector3().subVectors(camera.position, controls.target);
      controls.target.lerpVectors(fly.from, fly.to, e);
      camera.position.copy(controls.target).add(off);
      camera.zoom = fly.z0 + (fly.z1 - fly.z0) * e;
      camera.updateProjectionMatrix();
      if (k >= 1) fly = null;
    } else if (follow) {
      const want = framed(follow.mesh.position.clone().setY(0), camera.zoom);
      const off = new THREE.Vector3().subVectors(camera.position, controls.target);
      controls.target.lerp(want, 1 - Math.pow(.02, dt));
      camera.position.copy(controls.target).add(off);
    }
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, X_MIN, X_MAX);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -110, 45);   // kuzeyde Boğaz'a kadar
    controls.target.y = 0;
    controls.update();
    // "Tüm etiketleri göster" açıkken her zoom'da yakın görünüm davranışı: isimler, balonlar, terminal, araç etiketleri
    el.classList.toggle("far", !labelsAll && camera.zoom < 1.05);
    el.classList.toggle("near", labelsAll || camera.zoom > 2.2);

    // Araçlar: şeritte sıra, teslimat durakları, uçtan uca dönüş
    for (const v of vehicles) {
      if (v.off) {
        // Park halindeki araç trafik yoğunlaştıkça sokağın başından yeniden yola çıkar
        if (Math.random() < dt * .12 * traffic) { v.off = false; v.x = v.dir > 0 ? X_MIN - 14 : X_MAX + 14; v.speed = v.base; v.mesh.visible = true; }
        else continue;
      }
      let gap = Infinity, lead = null;
      for (const o of vehicles) {
        if (o === v || o.dir !== v.dir || o.off) continue;
        const dx = (o.x - v.x) * v.dir;
        if (dx > 0 && dx < gap) { gap = dx; lead = o; }
      }
      let want = v.base;
      if (v.state === "unloading") want = 0;
      else if (v.dest) {
        const rem = (v.dest.x - v.x) * v.dir;
        if (rem < 9) want = Math.max(1.2, v.base * rem / 9);
        if (rem <= .3) {
          v.state = "unloading"; v.timer = rand(4, 6.5); want = 0; v.speed = 0; updateTag(v);
        }
      }
      if (gap < 6.5) want = 0;
      else if (gap < 12 && lead) want = Math.min(want, lead.speed);
      v.speed += (want - v.speed) * Math.min(1, dt * 2.5);
      if (v.state === "unloading") {
        v.timer -= dt;
        if (v.timer <= 0) {
          notify({ kind: "delivery", vehicle: v.id, company: v.dest.c.id, text: tt("ev.delivered", { id: v.id, shop: v.dest.c.name, p: v.prod?.name || "" }), sub: v.cargo, at: new Date() });
          v.state = "driving";
          newDest(v);
        }
      }
      v.x += v.dir * v.speed * dt;
      if (v.x > X_MAX + 16 || v.x < X_MIN - 16) {
        v.x = v.dir > 0 ? X_MIN - 14 : X_MAX + 14;
        if (v.delivers) newDest(v, true);
        else if (v.type === "car" && Math.random() > traffic) { v.off = true; v.mesh.visible = false; }
      }
      v.mesh.position.x = v.x;
    }
    if (selected?.kind === "vehicle") {
      const v = vehicles.find(v => v.id === selected.id);
      if (v?.dest) { destRing.visible = true; destRing.position.set(v.dest.x, .13, v.dest.side * LOT_Z); destRing.material.opacity = .55 + .35 * Math.sin(t * 5); }
      else destRing.visible = false;
    } else if (selected?.kind === "ambulance") {
      destRing.visible = amb.state === "enroute" || amb.state === "onsite";
      if (destRing.visible) { destRing.position.set(amb.target.x, .13, amb.target.side * LOT_Z); destRing.material.opacity = .55 + .35 * Math.sin(t * 5); }
    }
    for (const w of walkers) {
      w.x += w.dir * w.speed * dt;
      if (w.x > w.b - .5 || w.x < w.a + .5) w.dir *= -1;
      w.g.position.x = w.x;
      w.g.position.y = .18 + Math.abs(Math.sin(t * 7 * w.speed + w.ph)) * .08;
      w.g.rotation.y = w.dir > 0 ? 0 : Math.PI;
    }
    stepTrain(dt);
    const ambSound = stepAmbulance(dt);
    stepDesk();
    extras.step(dt, t, { night, wx });
    siren?.set(Math.max(ambSound, extras.siren()));
    for (const fl of flags) fl.f.rotation.y = Math.sin(t * 1.7 + fl.ph) * .28;
    stepPlanes(dt);
    for (const f of forklifts) {
      f.t += dt;
      const ph = (f.t % 8) / 8;
      const k = ph < .5 ? ease(ph * 2) : 1 - ease((ph - .5) * 2);
      f.f.position.x = -f.span + k * f.span * 2;
      f.f.rotation.y = ph < .5 ? 0 : Math.PI;
      f.load.visible = ph < .5;
    }
    let envDirty = stepWeather(dt);
    if (night !== nightTarget) {
      night += (nightTarget - night) * Math.min(1, dt * 1.8);
      if (Math.abs(nightTarget - night) < .002) night = nightTarget;
      envDirty = true;
    }
    if (envDirty) applyNight(night);
    if (selRing.visible) { const s = 1 + Math.sin(t * 3) * .03; selRing.scale.set(s, s, 1); }
    glowMat.opacity = .45 + .3 * Math.sin(t * 4);

    renderer.render(scene, camera);
    labels.render(scene, camera);
  }
  // İlk açılış: sokağın tamamı, sonra Loodos meydanına süzülerek iner
  camera.zoom = fitZoom(LEN * .92);
  camera.updateProjectionMatrix();
  requestAnimationFrame(tick);

  return {
    districts, vehicles, hqX,
    select, highlight, focusSector, home, setNight, setWeather, setClock,
    setEvent: (kind, info) => extras.setEvent(kind, info),
    setLabelsAll(on) { labelsAll = !!on; },
    // Ziyaretçinin seçtiği ürünler: parsel o ürünlerin müşterisi olur, bina kat kat yükselir, boştaki kamyonlar yola çıkar
    setLead(ids) {
      leadLot.c.projects[0].prods = ids.map(id => ({ id }));
      extras.setLead(ids.length);
      vehicles.filter(v => v.delivers && !v.dest).forEach(v => newDest(v, true));
    },
    clearSelection() { select(null); highlight(null); },
    zoomBy(f) { follow = null; flyTo(controls.target.clone(), THREE.MathUtils.clamp(camera.zoom * f, controls.minZoom, controls.maxZoom), 350); },
    rotateBy(a) {
      const off = new THREE.Vector3().subVectors(camera.position, controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      camera.position.copy(controls.target).add(off);
    },
    intro() { flyTo(groundOf(new THREE.Vector3(hqX + 48, 6, -2)), fitZoom(125), 2200); },
    ambulanceInfo() {
      const m = amb.mission, s = amb.stats;
      const rem = m && amb.state === "enroute" ? Math.max(0, (amb.target.x - amb.x) * amb.dir) : 0;
      return {
        state: amb.state, active: amb.state !== "idle",
        mission: m && { ...m, company: m.company, sector: m.sector,
          etaMin: amb.state === "enroute" ? Math.round(rem / 15 + 1) : 0,
          respMin: m.tArrive != null ? Math.round(m.tArrive - m.t0) : null,
          fixMin: m.tFixed != null ? Math.round(m.tFixed - m.t0) : Math.round(t - m.t0),
          onsiteLeft: amb.state === "onsite" ? Math.ceil(amb.timer) : 0,
          progress: amb.state === "enroute" ? 1 - rem / Math.max(1, (amb.target.x - m.from) * amb.dir) : 1 },
        nextIn: amb.state === "idle" ? Math.ceil(amb.timer) : 0,
        stats: { opened: s.opened, resolved: s.resolved, open: s.opened - s.resolved,
          avgFix: s.resolved ? Math.round(s.fixMin / s.resolved) : null, avgResp: s.resolved ? Math.round(s.respMin / s.resolved) : null },
      };
    },
    vehicleInfo(id) {
      const v = vehicles.find(v => v.id === id);
      if (!v) return null;
      const rem = v.dest ? Math.max(0, (v.dest.x - v.x) * v.dir) : null;
      const total = v.dest ? Math.max(1, (v.dest.x - v.from) * v.dir) : 1;
      return {
        id: v.id, type: typeName(v.type) + (v.mesh.userData.model ? " · " + v.mesh.userData.model : ""), delivers: v.delivers, prod: v.prod ? { id: v.prod.id, name: v.prod.name, mono: v.prod.mono } : null, state: v.state, dest: v.dest?.c, sector: v.dest?.s,
        speedKmh: Math.round(v.speed * 6.2), etaSec: rem == null ? null : v.state === "unloading" ? 0 : Math.round(rem / Math.max(v.base, .1) + 1.5),
        progress: v.dest ? 1 - rem / total : 0, cargo: v.cargo, ship: v.ship, unloadLeft: v.state === "unloading" ? Math.ceil(v.timer) : 0,
      };
    },
  };
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
export const initials = name => name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9& ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
