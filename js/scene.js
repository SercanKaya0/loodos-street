/* Loodos Street 3D sahnesi: izometrik sokak, sektör mahalleleri, müşteri dükkânları, hareketli araçlar.
   Dış dünyaya createStreet() döner; UI yalnız bu API'yi kullanır. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

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
const CARGO = {
  ret: ["Kapıda siparişi · 14 koli", "Mağaza ikmali · 6 palet", "Kampanya ürünleri · 9 koli"],
  tel: ["Cihaz sevkiyatı · 40 kutu", "SIM kart kiti · 3 koli"],
  avi: ["Kabin ikram ekipmanı · 2 palet", "Ekip kiti · 12 çanta"],
  fin: ["Kart basımı · 4 koli", "POS cihazı · 18 adet"],
  fnb: ["Hazır Al çekirdek kahve · 8 çuval", "Süt ve şurup · 2 palet", "Çikolata · 5 koli"],
  ind: ["Yedek parça · 3 palet", "Vardiya ekipmanı · 7 koli"],
  life: ["Festival malzemesi · 5 koli", "Etkinlik ekipmanı · 2 palet"],
  mob: ["E-scooter · 6 adet", "Batarya modülü · 12 adet"],
};

const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export async function createStreet({ el, data, onSelect, onEvent }) {
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
  scene.background = new THREE.Color(0xeef3f4);

  const VIEW = 64;
  let fly = null, follow = null, selected = null, hovered = null;
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d8dc, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
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
    glass: mat(C.glass, { roughness: .18, metalness: .15 }), glassDark: mat(C.glassDark, { roughness: .25, metalness: .2 }),
    teal: mat(C.teal), tealInk: mat(C.tealInk), white: mat(0xffffff), wheel: mat(0x2a3136, { roughness: .9 }),
    trunk: mat(C.trunk), pallet: mat(C.pallet), amber: mat(C.amber), walk: mat(C.walk), curb: mat(C.curb), road: mat(C.road, { roughness: .95 }),
  };
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
  const inst = { win: [], trunk: [], crown: [], lamp: [], bulb: [], dash: [], zebra: [] };
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const local = (group, x, y, z, sx, sy, sz, ry = 0) => ({ group, x, y, z, sx, sy, sz, ry });
  function windows(g, w, h, d, { rows, cols, y0 = 1.2, gapY = 1.9, size = [1, 1.1], sides = true }) {
    const usable = w - 1.6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -usable / 2 + usable * (c + .5) / cols, y = y0 + r * gapY;
        if (y + size[1] > h - .4) continue;
        inst.win.push(local(g, x, y, d / 2 + .03, size[0], size[1], .08));
        inst.win.push(local(g, x, y, -d / 2 - .03, size[0], size[1], .08));
      }
    }
    if (!sides) return;
    const sideCols = Math.max(1, Math.round((d - 2) / 2.2));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < sideCols; c++) {
        const z = -(d - 2) / 2 + (d - 2) * (c + .5) / sideCols, y = y0 + r * gapY;
        if (y + size[1] > h - .4) continue;
        inst.win.push(local(g, w / 2 + .03, y, z, .08, size[1], size[0]));
        inst.win.push(local(g, -w / 2 - .03, y, z, .08, size[1], size[0]));
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
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: .6 });
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
  plane(world, LEN + 400, 400, mat(C.ground, { roughness: 1 }), 0, 0, 0);
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
    plane(world, 8, 70, M.road, cx, .015, 0);
    for (let i = -3; i <= 3; i++) {
      for (const zc of [-6.3, 6.3]) inst.zebra.push(local(world, cx + i * 1.05, .035, zc, .55, .02, 3));
      for (const xc of [-5.2, 5.2]) inst.zebra.push(local(world, cx + xc, .035, i * 1.2, .9, .02, .6));
    }
    for (let z = 9; z < 34; z += 4.5) { inst.dash.push(local(world, cx, .03, z, .22, .02, 2.2)); inst.dash.push(local(world, cx, .03, -z, .22, .02, 2.2)); }
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
      for (let i = 0; i < 3; i++) box(g, 1, .5, .9, i % 2 ? M.pallet : M.teal, -3.4 + i * 1.15, 0, D / 2 + 3.6);
      box(g, 1, .5, .9, M.pallet, -3.4, .5, D / 2 + 3.6);
      forklift(g, D / 2 + 2, 2.6);
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
      for (const sx of [-2.6, -1.6, -.6]) scooterMesh(g, sx, D / 2 + 2, Math.PI / 2);
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
    companies.set(c.id, { lot, group: g, wallMat, height: pinY, pin: pin.element.firstChild, sector: s });
  }

  function makePin(c, s, y) {
    const wrap = document.createElement("div");
    wrap.className = "lbl";
    const b = document.createElement("button");
    b.className = "pin";
    b.style.setProperty("--c", s.color);
    b.setAttribute("aria-label", `${c.name} dükkânını aç`);
    const logo = c.logo
      ? `<span class="pin-logo"><img src="${c.logo}" alt="" class="${RAW_LOGO.has(c.id) ? "raw" : ""}"></span>`
      : `<span class="pin-logo txt">${esc(c.name)}</span>`;
    const n = c.projects.length;
    b.innerHTML = `<span class="pin-card">${logo}<span class="pin-name">${esc(c.name)}${n > 1 ? `<small>${n} proje</small>` : ""}</span>${!c.logo && n > 1 ? `<small class="pin-n">${n}</small>` : ""}</span><span class="pin-stem"></span>`;
    b.addEventListener("click", e => { e.stopPropagation(); select("company", c.id, true); });
    wrap.appendChild(b);
    return new CSS2DObject(wrap);
  }

  /* ---------- Loodos meydanı ---------- */
  const hq = new THREE.Group();
  {
    const W = 13, D = 10, H = 22;
    plane(hq, 15, 12, M.walk, 0, .05, 0);
    box(hq, 17, 4, 11.5, M.wall, 0, 0, 0);
    box(hq, 15.5, 2.6, .12, M.glass, 0, .3, 5.77);
    box(hq, W, H, D, M.wall);
    windows(hq, W, H, D, { rows: 11, cols: 5, y0: 5.2, gapY: 1.55, size: [1.5, 1.0] });
    for (const x of [-W / 2 + .1, W / 2 - .1]) box(hq, .3, H - 4, D + .1, M.teal, x, 4, 0);
    box(hq, W + .4, 1.4, D + .4, M.teal, 0, H, 0);
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
    b.innerHTML = `<span class="pin-card"><span class="pin-logo txt" style="background:#0a0a0a">L</span><span class="pin-name">Loodos Merkez<small>2004'ten beri</small></span></span><span class="pin-stem"></span>`;
    b.addEventListener("click", e => { e.stopPropagation(); select("hq", "loodos", true); });
    wrap.appendChild(b);
    const o = new CSS2DObject(wrap);
    o.position.set(0, 30, 0);
    hq.add(o);
  }
  // Meydan: çeşme halkası ve banklar
  const plaza = new THREE.Group();
  plane(plaza, 22, 13, M.walk, 0, .06, 0);
  cyl(plaza, 3.4, 3.6, .5, M.wall2, 0, 0, 0, 40);
  cyl(plaza, 2.9, 2.9, .42, mat(0x9fe0e6, { roughness: .2 }), 0, .12, 0, 40);
  cyl(plaza, .5, .7, 1.4, M.teal, 0, .3, 0, 20);
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

  /* ---------- Araçlar ve yayalar ---------- */
  function wheels(g, xs, z, r = .42) {
    for (const x of xs) for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 14), M.wheel);
      w.rotation.x = Math.PI / 2; w.position.set(x, r, s * z); w.castShadow = true;
      g.add(w);
    }
  }
  const truckTex = wordTexture("loodos", { color: "#1ab0ba", sub: "LOJİSTİK · STREET", h: 220, w: 640 });
  function truckMesh() {
    const g = new THREE.Group();
    box(g, 1.9, 1.9, 2.1, M.teal, 2.6, .55, 0);
    box(g, .1, .8, 1.7, M.glassDark, 3.56, 1.45, 0);
    box(g, 5, 2.6, 2.3, M.white, -.9, .6, 0);
    const side = new THREE.MeshStandardMaterial({ map: truckTex, roughness: .6 });
    const panel = new THREE.Mesh(BOX, [M.white, M.white, M.white, M.white, side, side]);
    panel.scale.set(4.4, 1.6, 2.34); panel.position.set(-.9, 2, 0);
    g.add(panel);
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
  function scooterMesh(parent, x, z, ry) {
    const g = new THREE.Group();
    box(g, 1.3, .12, .32, M.ink, 0, .22, 0);
    cyl(g, .05, .05, 1.3, M.ink, .55, .25, 0, 6);
    box(g, .08, .08, .7, M.ink, .55, 1.5, 0);
    for (const wx of [-.55, .55]) { const w = cyl(g, .2, .2, .1, M.wheel, wx, 0, 0, 10); w.rotation.x = Math.PI / 2; w.position.y = .2; }
    g.position.set(x, 0, z); g.rotation.y = ry;
    parent?.add(g);
    return g;
  }
  function riderScooter() {
    const g = scooterMesh(null, 0, 0, 0);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .7, 4, 8), mat(pick([0x5446fc, 0x1ab0ba, 0xd6457a])));
    body.position.set(.1, 1.05, 0); body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(0xe8c4a0));
    head.position.set(.1, 1.65, 0); g.add(head);
    return g;
  }

  const vehicles = [];
  const typeName = { truck: "Kamyon", van: "Panelvan", car: "Otomobil", scooter: "Brific e-scooter" };
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
      newDest(v);
    }
    vehicles.push(v);
    return v;
  }
  // Doğuya giden şerit (z>0) güney dükkânlarına, batıya giden şerit kuzey dükkânlarına teslim eder.
  function newDest(v) {
    const side = v.dir > 0 ? 1 : -1;
    const ahead = lots.filter(l => l.side === side && (l.x - v.x) * v.dir > 8);
    v.dest = ahead.length ? pick(ahead.slice(0, 5)) : null;
    v.from = v.x;
    if (v.dest) {
      v.cargo = pick(CARGO[v.dest.s.id]);
      v.ship = "#SHP-" + (70000 + Math.floor(Math.random() * 29999));
    }
    updateTag(v);
  }
  function updateTag(v) {
    if (!v.tag) return;
    const st = v.state === "unloading" ? "Boşaltıyor" : v.dest ? "→ " + v.dest.c.name : "Depoya dönüyor";
    v.tag.className = "veh-tag" + (v.state === "unloading" ? " unload" : "") + (selected?.kind === "vehicle" && selected.id === v.id ? " on" : "");
    v.tag.innerHTML = `<b>${v.id}</b>${esc(st)}`;
  }
  const span = X_MAX - X_MIN;
  [["truck", 1], ["truck", -1], ["van", 1], ["truck", 1], ["van", -1], ["car", 1], ["car", -1], ["truck", -1], ["scooter", 1],
   ["car", 1], ["van", 1], ["scooter", -1], ["car", -1], ["truck", 1], ["van", -1], ["car", -1]].forEach(([t, d], i) => {
    addVehicle(t, d, X_MIN + ((i * 37) % 16) / 16 * span + rand(-4, 4));
  });

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
  flush(inst.trunk, new THREE.CylinderGeometry(.5, .6, 1, 6), M.trunk);
  flush(inst.crown, new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: true }), { colors: true });
  flush(inst.lamp, BOX, M.ink);
  flush(inst.bulb, BOX, mat(0xffffff, { emissive: 0xfff4d6, emissiveIntensity: .6 }), { cast: false });
  flush(inst.dash, BOX, mat(C.line, { roughness: 1 }), { cast: false });
  flush(inst.zebra, BOX, mat(C.line, { roughness: 1 }), { cast: false });

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
    } else if (kind === "vehicle") {
      const v = vehicles.find(v => v.id === id);
      const zoom = zoomFor(2, 3);
      flyTo(framed(v.mesh.position.clone().setY(0), zoom), zoom, 800);
      follow = v;
    }
    vehicles.forEach(updateTag);
    if (fromScene) onSelect?.(selected);
  }
  function highlight(ids) {
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
    if (p) select(p.kind, p.id, true);
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
  controls.addEventListener("start", () => { fly = null; follow = null; el.classList.add("grabbing"); });
  controls.addEventListener("end", () => el.classList.remove("grabbing"));

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
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -40, 40);
    controls.target.y = 0;
    controls.update();
    el.classList.toggle("far", camera.zoom < 1.05);
    el.classList.toggle("near", camera.zoom > 2.2);

    // Araçlar: şeritte sıra, teslimat durakları, uçtan uca dönüş
    for (const v of vehicles) {
      let gap = Infinity, lead = null;
      for (const o of vehicles) {
        if (o === v || o.dir !== v.dir) continue;
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
          onEvent?.({ kind: "delivery", vehicle: v.id, company: v.dest.c.id, text: `${v.id} · ${v.dest.c.name} teslimatı tamamlandı`, sub: v.cargo, at: new Date() });
          v.state = "driving";
          newDest(v);
        }
      }
      v.x += v.dir * v.speed * dt;
      if (v.x > X_MAX + 16 || v.x < X_MIN - 16) {
        v.x = v.dir > 0 ? X_MIN - 14 : X_MAX + 14;
        if (v.delivers) newDest(v);
      }
      v.mesh.position.x = v.x;
    }
    if (selected?.kind === "vehicle") {
      const v = vehicles.find(v => v.id === selected.id);
      if (v?.dest) { destRing.visible = true; destRing.position.set(v.dest.x, .13, v.dest.side * LOT_Z); destRing.material.opacity = .55 + .35 * Math.sin(t * 5); }
      else destRing.visible = false;
    }
    for (const w of walkers) {
      w.x += w.dir * w.speed * dt;
      if (w.x > w.b - .5 || w.x < w.a + .5) w.dir *= -1;
      w.g.position.x = w.x;
      w.g.position.y = .18 + Math.abs(Math.sin(t * 7 * w.speed + w.ph)) * .08;
      w.g.rotation.y = w.dir > 0 ? 0 : Math.PI;
    }
    for (const f of forklifts) {
      f.t += dt;
      const ph = (f.t % 8) / 8;
      const k = ph < .5 ? ease(ph * 2) : 1 - ease((ph - .5) * 2);
      f.f.position.x = -f.span + k * f.span * 2;
      f.f.rotation.y = ph < .5 ? 0 : Math.PI;
      f.load.visible = ph < .5;
    }
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
    select, highlight, focusSector, home,
    clearSelection() { select(null); highlight(null); },
    zoomBy(f) { follow = null; flyTo(controls.target.clone(), THREE.MathUtils.clamp(camera.zoom * f, controls.minZoom, controls.maxZoom), 350); },
    rotateBy(a) {
      const off = new THREE.Vector3().subVectors(camera.position, controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      camera.position.copy(controls.target).add(off);
    },
    intro() { flyTo(groundOf(new THREE.Vector3(hqX + 48, 6, -2)), fitZoom(125), 2200); },
    vehicleInfo(id) {
      const v = vehicles.find(v => v.id === id);
      if (!v) return null;
      const rem = v.dest ? Math.max(0, (v.dest.x - v.x) * v.dir) : null;
      const total = v.dest ? Math.max(1, (v.dest.x - v.from) * v.dir) : 1;
      return {
        id: v.id, type: typeName[v.type], delivers: v.delivers, state: v.state, dest: v.dest?.c, sector: v.dest?.s,
        speedKmh: Math.round(v.speed * 6.2), etaSec: rem == null ? null : v.state === "unloading" ? 0 : Math.round(rem / Math.max(v.base, .1) + 1.5),
        progress: v.dest ? 1 - rem / total : 0, cargo: v.cargo, ship: v.ship, unloadLeft: v.state === "unloading" ? Math.ceil(v.timer) : 0,
      };
    },
  };
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
export const initials = name => name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9& ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
