/* WorkCity 3D dünyası: Loodos Hub'ın tasarım dili (koyu, noktalı zemin, net ışıklı "node" binalar),
   çalışanın adını taşıyan cadde, Jira mavisi kule, grafit GitHub binası + Actions fabrikası (bant),
   yeşil yanan ofis, inceleme kutusu, kanban meydanı, release panosu ve sertifika uyarı fenerı.
   Veri bilmez; app.js ne gösterileceğini setItems/setReviews/setCI/setStats ile söyler. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Sky } from "three/addons/objects/Sky.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const LANES = ["todo", "doing", "review", "done"];
const LANE_X = { todo: -19.5, doing: -6.5, review: 6.5, done: 19.5 };
const LANE_COLOR = { todo: "#9aa7ad", doing: "#1ab0ba", review: "#8b7dff", done: "#3fbf7f" };
const PRIO_COLOR = { highest: "#d9363e", high: "#e8742a", medium: "#1d9fb0", low: "#6f8088" };
const SPOTS = {
  jira: { x: -34, z: -24, roof: 53 },
  office: { x: 0, z: -22 },
  github: { x: 31, z: -24, roof: 25 },
  factory: { x: 52, z: -22 },
  mailbox: { x: 8.5, z: -9.2 },
  plaza: { x: 0, z: 25 },
};
const FLOOR_H = 3.6, LOBBY_H = 4.6, BASE_FLOORS = 3, MAX_FLOORS = 18;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const redraw = (tex, draw) => { const c = tex.image; const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height); draw(g, c.width, c.height); tex.needsUpdate = true; };

function fitText(g, text, maxW, size, weight = 700, family = "Urbanist, Red Hat Display, Segoe UI, sans-serif") {
  let s = size;
  do { g.font = `${weight} ${s}px ${family}`; s -= 2; } while (g.measureText(text).width > maxW && s > 10);
}

/* Cephe dokusu: 8×8 pencere ızgarası; map gündüz görüntüsü, emi gece yanan pencereler */
function facade({ wall, glass, frame, style, seed, warm = .55, lit: litColor = null }) {
  const R = rng(seed), N = 8, S = 64;
  const lit = [];
  for (let i = 0; i < N * N; i++) lit.push(R() < warm ? .55 + R() * .45 : 0);
  const map = canvasTex(N * S, N * S, g => {
    g.fillStyle = wall; g.fillRect(0, 0, N * S, N * S);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = c * S, y = r * S;
      const [ix, iy, iw, ih] = style === "glass" ? [2, 3, S - 4, S - 8] : style === "brick" ? [16, 14, 32, 38] : [10, 12, 44, 40];
      const gr = g.createLinearGradient(0, y + iy, 0, y + iy + ih);
      gr.addColorStop(0, glass[0]); gr.addColorStop(1, glass[1]);
      g.fillStyle = gr; g.fillRect(x + ix, y + iy, iw, ih);
      g.fillStyle = frame;
      if (style === "glass") { g.fillRect(x, y, S, 3); g.fillRect(x, y, 2, S); }
      else { g.fillRect(x + ix - 2, y + iy + ih, iw + 4, 4); g.fillRect(x + ix + iw / 2 - 1, y + iy, 2, ih); }
    }
    if (style === "brick") {
      g.globalAlpha = .18; g.strokeStyle = "#000";
      for (let y = 0; y < N * S; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(N * S, y); g.stroke(); }
      g.globalAlpha = 1;
    }
  });
  const emi = canvasTex(N * S, N * S, g => {
    g.fillStyle = "#000"; g.fillRect(0, 0, N * S, N * S);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = lit[r * N + c]; if (!v) continue;
      const x = c * S, y = r * S;
      const [ix, iy, iw, ih] = style === "glass" ? [3, 4, S - 6, S - 10] : style === "brick" ? [16, 14, 32, 38] : [10, 12, 44, 40];
      const cool = (r * 7 + c * 3) % 9 === 0;
      // lit: binanın kendi ışık rengi (Jira mavisi, ofis yeşili…); yoksa soğuk beyaz, yer yer sıcak
      g.fillStyle = litColor ? `rgba(${litColor},${v})` : cool ? `rgba(255,214,160,${v * .8})` : `rgba(190,215,235,${v * .75})`;
      g.fillRect(x + ix, y + iy, iw, ih);
    }
  });
  for (const t of [map, emi]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return { map, emi };
}

/* Kutu UV'lerini dünya ölçüsüne çevirir: aynı malzeme her boyutta binada doğru pencere sıklığı verir */
function worldBox(w, h, d, tileW = 3.2 * 8, tileH = FLOOR_H * 8) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [fu, fv] = dims[f];
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * fu / tileW, uv.getY(k) * fv / tileH);
    }
  }
  geo.translate(0, h / 2, 0);
  return geo;
}

export function createWorld(el, { onPick = () => {}, onHover = () => {} } = {}) {
  /* ---------- çekirdek ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .6;
  el.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = "labels";
  el.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07090b, 160, 520);
  const camera = new THREE.PerspectiveCamera(38, 1, .5, 3200);
  camera.position.set(-14, 78, 128);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(6, 16, -8);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.minDistance = 14;
  controls.maxDistance = 230;
  controls.minPolarAngle = .18;
  controls.maxPolarAngle = 1.32; // kamera hiç yerin altına inmez
  controls.zoomSpeed = 1.15;
  controls.rotateSpeed = .7;
  controls.panSpeed = .9;
  controls.zoomToCursor = true; // tekerlek/pinch imlecin baktığı yere yakınlaşır
  controls.screenSpacePanning = false;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .25, .55, .86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- gökyüzü, güneş, ortam yansıması ---------- */
  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(80);
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5b5148, .9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 1, far: 520 });
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .04;
  scene.add(sun, sun.target);

  const stars = (() => {
    const R = rng(7), n = 1400, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = R() * Math.PI * 2, ph = Math.acos(R() * .95);
      p.set([Math.sin(ph) * Math.cos(th) * 1900, Math.cos(ph) * 1900, Math.sin(ph) * Math.sin(th) * 1900], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const s = new THREE.Points(g, m);
    scene.add(s);
    return s;
  })();

  /* ---------- paylaşılan malzemeler ---------- */
  const M = {
    // Hub'daki noktalı koyu zemin: net noktalar, kumlanma yok
    ground: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: .95,
      map: canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = "#0b0d0f"; g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.arc(w / 2, h / 2, 2.2, 0, 7); g.fill();
      }),
    }),
    asphalt: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: .92,
      map: canvasTex(512, 512, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, "#15181b"); gr.addColorStop(.5, "#191c20"); gr.addColorStop(1, "#15181b");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }),
    }),
    sidewalk: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: .95,
      map: canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = "#24282c"; g.fillRect(0, 0, w, h);
        g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 2;
        for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
      }),
    }),
    curb: new THREE.MeshStandardMaterial({ color: 0x3a4046, roughness: .9 }),
    paint: new THREE.MeshStandardMaterial({ color: 0xdfe6e8, roughness: .7, emissive: 0x9fb4ba, emissiveIntensity: .15 }),
    plaza: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: .85,
      map: canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = "#101315"; g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,255,255,.12)";
        for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
      }),
    }),
    roof: new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: .9 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2b3135, roughness: .45, metalness: .7 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xe8fbff, emissive: 0xbfeff2, emissiveIntensity: 0 }),
    pool: new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      map: canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(200,230,235,.9)"); r.addColorStop(1, "rgba(200,230,235,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); }),
    }),
  };
  M.ground.map.wrapS = M.ground.map.wrapT = THREE.RepeatWrapping;
  M.ground.map.repeat.set(1600 / 3, 1600 / 3);
  M.asphalt.map.wrapS = M.asphalt.map.wrapT = THREE.RepeatWrapping;
  M.asphalt.map.repeat.set(24, 1.5);
  M.sidewalk.map.wrapS = M.sidewalk.map.wrapT = THREE.RepeatWrapping;
  M.sidewalk.map.repeat.set(70, 1);
  M.plaza.map.wrapS = M.plaza.map.wrapT = THREE.RepeatWrapping;
  M.plaza.map.repeat.set(58 / 4, 30 / 4);

  /* Bina cepheleri: gece pencereleri yanar */
  const windowMats = [];
  // glow: gecelik pencere parlaklığı; arka plan binaları düşük kalır, ışıklı binalar öne çıkar
  function facadeMat(opts, extra = {}, glow = 1) {
    const { map, emi } = facade(opts);
    const m = new THREE.MeshStandardMaterial({ map, emissiveMap: emi, emissive: 0xffffff, emissiveIntensity: 0, roughness: opts.style === "glass" ? .12 : .85, metalness: opts.style === "glass" ? .6 : 0, ...extra });
    m.userData.glow = glow;
    windowMats.push(m);
    return m;
  }
  const FACADES = [
    // arka plan: koyu cam ve beton; geceleri seyrek yanan pencereler, ön plandaki ışıklı binalar öne çıksın
    facadeMat({ wall: "#1c2024", glass: ["#2b333a", "#14181c"], frame: "#15191c", style: "punched", seed: 1, warm: .28 }, {}, .35),
    facadeMat({ wall: "#22272c", glass: ["#2f3940", "#161a1e"], frame: "#1a1e22", style: "punched", seed: 2, warm: .22 }, {}, .35),
    facadeMat({ wall: "#14191d", glass: ["#2a3a46", "#10161b"], frame: "#0f1316", style: "glass", seed: 3, warm: .25 }, {}, .35),
    facadeMat({ wall: "#1f2226", glass: ["#2c3238", "#14171a"], frame: "#17191c", style: "brick", seed: 4, warm: .3 }, {}, .35),
    facadeMat({ wall: "#262b30", glass: ["#2f383f", "#15191d"], frame: "#1d2125", style: "punched", seed: 5, warm: .25 }, {}, .35),
    facadeMat({ wall: "#151b20", glass: ["#2d4250", "#111820"], frame: "#10161a", style: "glass", seed: 6, warm: .2 }, {}, .35),
  ];

  const pickables = [];
  const tweens = [];
  const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });
  const add = (mesh, { cast = true, receive = true } = {}) => { mesh.castShadow = cast; mesh.receiveShadow = receive; scene.add(mesh); return mesh; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m); };
  const pickTag = (obj, pick) => obj.traverse(o => { if (o.isMesh) { o.userData.pick = pick; pickables.push(o); } });

  function badge(key, x, y, z) {
    const div = document.createElement("button");
    div.type = "button";
    div.className = `badge badge-${key}`;
    div.innerHTML = `<b></b><span></span>`;
    div.addEventListener("click", e => { e.stopPropagation(); onPick({ type: key }); });
    const o = new CSS2DObject(div);
    o.position.set(x, y, z);
    scene.add(o);
    return o;
  }
  const badges = {};

  /* ---------- zemin, cadde, kaldırımlar ---------- */
  add(new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), M.ground), { cast: false });
  const road = add(new THREE.Mesh(new THREE.BoxGeometry(320, .06, 12), M.asphalt), { cast: false });
  road.position.y = .03;
  for (const s of [-1, 1]) {
    add(at(new THREE.Mesh(new THREE.BoxGeometry(320, .2, 3.4), M.sidewalk), 0, .1, s * 7.7), { cast: false });
    add(at(new THREE.Mesh(new THREE.BoxGeometry(320, .24, .3), M.curb), 0, .12, s * 6.05), { cast: false });
    const edge = add(new THREE.Mesh(new THREE.BoxGeometry(320, .01, .15), M.paint), { cast: false });
    edge.position.set(0, .065, s * 5.4);
  }
  {
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, .01, .16), M.paint, 54);
    const o = new THREE.Object3D();
    for (let i = 0; i < 54; i++) { o.position.set(-159 + i * 6, .065, 0); o.updateMatrix(); dash.setMatrixAt(i, o.matrix); }
    dash.receiveShadow = true;
    scene.add(dash);
    const zebra = new THREE.InstancedMesh(new THREE.BoxGeometry(.6, .012, 10.4), M.paint, 24);
    let k = 0;
    for (const cx of [-14, 14]) for (let i = 0; i < 12; i++) { o.position.set(cx - 6 + i * 1.1, .066, 0); o.updateMatrix(); zebra.setMatrixAt(k++, o.matrix); }
    zebra.receiveShadow = true;
    scene.add(zebra);
  }
  // Yola boyanmış cadde adı ve İstanbul tipi mavi sokak tabelaları
  const roadNameTex = canvasTex(2048, 256, () => {});
  const roadName = add(new THREE.Mesh(new THREE.PlaneGeometry(34, 4.25).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: roadNameTex, transparent: true, roughness: .8, depthWrite: false })), { cast: false });
  roadName.position.set(0, .07, 2.7);
  const signTex = canvasTex(512, 128, () => {});
  for (const [x, z, ry] of [[-11, 9.2, 0], [11, -9.2, Math.PI], [-58, -9.2, Math.PI], [58, 9.2, 0]]) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.4), M.metal);
    pole.position.y = 1.7;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.6, .65, .05), [M.metal, M.metal, M.metal, M.metal,
      new THREE.MeshStandardMaterial({ map: signTex, roughness: .5 }), new THREE.MeshStandardMaterial({ map: signTex, roughness: .5 })]);
    plate.position.set(1.2, 3.2, 0);
    g.add(pole, plate);
    g.position.set(x, .2, z);
    g.rotation.y = ry;
    g.traverse(m => { m.castShadow = true; });
    scene.add(g);
  }

  /* ---------- sokak lambaları ve sonbahar ağaçları ---------- */
  const lampGeo = { pole: new THREE.CylinderGeometry(.09, .13, 6.6), arm: new THREE.BoxGeometry(1.6, .1, .1), head: new THREE.BoxGeometry(.9, .14, .38) };
  const poolGeo = new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2);
  function lamp(x, z, side) {
    const pole = add(new THREE.Mesh(lampGeo.pole, M.metal)); pole.position.set(x, 3.3, z);
    const arm = add(new THREE.Mesh(lampGeo.arm, M.metal)); arm.position.set(x, 6.5, z - side * .7); arm.rotation.y = Math.PI / 2;
    const head = add(new THREE.Mesh(lampGeo.head, M.lamp)); head.position.set(x, 6.42, z - side * 1.4); head.rotation.y = Math.PI / 2;
    const pool = new THREE.Mesh(poolGeo, M.pool); pool.position.set(x, .23, z - side * 1.6); pool.renderOrder = 2; scene.add(pool);
  }
  // koyu, gece yeşili ağaçlar (Hub'ın yeşil vurgusuyla aynı aile)
  const autumn = ["#1f4d34", "#275c3c", "#1d4430", "#2f6a45", "#1a3d2c", "#2a5a3e"].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const trunkGeo = new THREE.CylinderGeometry(.16, .24, 2.6);
  const treeR = rng(21);
  function tree(x, z, s = 1) {
    const t = add(new THREE.Mesh(trunkGeo, M.trunk)); t.position.set(x, 1.3 * s, z); t.scale.setScalar(s);
    const mat = autumn[treeR() * autumn.length | 0];
    for (let i = 0; i < 3; i++) {
      const c = add(new THREE.Mesh(crownGeo, mat));
      c.position.set(x + (treeR() - .5) * 1.2 * s, (2.9 + treeR() * 1.1) * s, z + (treeR() - .5) * 1.2 * s);
      c.scale.setScalar((1.15 + treeR() * .5) * s);
      c.rotation.set(treeR() * 3, treeR() * 3, 0);
    }
  }
  for (let x = -140; x <= 140; x += 16) {
    lamp(x, 6.7, 1);
    lamp(x + 8, -6.7, -1);
    if (Math.abs(x + 4) > 6) tree(x + 4, 8.4, .9 + treeR() * .25);
    if (Math.abs(x - 4) > 3 && Math.abs(x - 4 - SPOTS.mailbox.x) > 3) tree(x - 4, -8.4, .9 + treeR() * .25);
  }

  /* ---------- tabela yardımcıları ---------- */
  const signMats = [];
  function signMesh(w, h, draw, { glow = true } = {}) {
    const tex = canvasTex(Math.round(w * 64), Math.round(h * 64), draw);
    const m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: glow ? tex : null, emissive: glow ? 0xffffff : 0, emissiveIntensity: .5, roughness: .4 });
    if (glow) signMats.push(m);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    return { mesh, tex };
  }

  /* ---------- Jira kulesi: Jira mavisi cam kule, köşelerde yanan mavi kenarlar, tepede Jira logosu ---------- */
  const jiraGlass = facadeMat({ wall: "#0d3c8f", glass: ["#5aa2ff", "#1550c0"], frame: "#0a2e72", style: "glass", seed: 31, warm: .6, lit: "120,180,255" },
    { metalness: .55, roughness: .1, envMapIntensity: 1.2, color: 0xbfd8ff });
  const jiraEdge = new THREE.MeshStandardMaterial({ color: 0x9cc4ff, emissive: 0x2684ff, emissiveIntensity: 2.4, toneMapped: false });
  // Jira'nın üç katlı "ok" işareti, beyaz
  const drawJiraMark = (g, cx, cy, s) => {
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * s * .42;
      g.beginPath();
      g.moveTo(cx - s * .5 + o, cy - s * .5 + o); g.lineTo(cx + s * .05 + o, cy - s * .5 + o);
      g.lineTo(cx + s * .05 + o, cy + s * .05 + o); g.closePath(); g.fill();
    }
  };
  const jira = new THREE.Group();
  {
    const { x, z } = SPOTS.jira;
    const lobby = new THREE.Mesh(worldBox(16, 5, 16), facadeMat({ wall: "#071c44", glass: ["#9cc4ff", "#2f74e6"], frame: "#071c44", style: "glass", seed: 32, warm: 1, lit: "170,205,255" }));
    const body = new THREE.Mesh(worldBox(14, 44, 14), [jiraGlass, jiraGlass, M.roof, M.roof, jiraGlass, jiraGlass]);
    body.position.y = 5;
    const crown = new THREE.Mesh(worldBox(11, 4, 11), [jiraGlass, jiraGlass, M.roof, M.roof, jiraGlass, jiraGlass]);
    crown.position.y = 49;
    jira.add(lobby, body, crown);
    // köşelerde ve kat aralarında yanan Jira mavisi şeritler: binanın "node" çerçevesi
    for (const fx of [-7.05, 7.05]) for (const fz of [-7.05, 7.05]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(.32, 44, .32), jiraEdge); fin.position.set(fx, 27, fz); jira.add(fin);
    }
    for (const y of [5, 16, 27, 38, 49]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(14.5, .22, 14.5), jiraEdge); band.position.y = y; jira.add(band);
    }
    const crownRing = new THREE.Mesh(new THREE.BoxGeometry(11.5, .3, 11.5), jiraEdge); crownRing.position.y = 53; jira.add(crownRing);
    // helipad = drone istasyonu
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, .15, 40), new THREE.MeshStandardMaterial({ color: 0x0e1a2c, roughness: .8 }));
    pad.position.y = 53.1;
    const H = signMesh(5, 5, (g, w, h) => { g.strokeStyle = "#5aa2ff"; g.lineWidth = 14; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 14, 0, 7); g.stroke(); g.fillStyle = "#e8f1ff"; g.font = "700 200px Urbanist, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H", w / 2, h / 2 + 10); });
    H.mesh.material.transparent = true;
    H.mesh.rotation.x = -Math.PI / 2; H.mesh.position.y = 53.2;
    jira.add(pad, H.mesh);
    const sign = signMesh(9, 2.6, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, "#2f74e6"); gr.addColorStop(.55, "#1f58c2"); gr.addColorStop(1, "#0a1f4d");
      g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
      drawJiraMark(g, h * .62, h / 2, h * .5);
      g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "middle"; fitText(g, "Jira", w - h * 1.4, 112, 500); g.fillText("Jira", h * 1.15, h / 2 + 4);
    });
    sign.mesh.position.set(0, 50.8, 5.56);
    const sign2 = sign.mesh.clone(); sign2.rotation.y = Math.PI / 2; sign2.position.set(5.56, 50.8, 0);
    jira.add(sign.mesh, sign2);
    jira.position.set(x, 0, z);
    jira.traverse(o => { if (o.isMesh && o.material !== jiraEdge) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(jira);
    pickTag(jira, { type: "jira" });
    badges.jira = badge("jira", x, 58, z);
  }
  const ledMat = { on: new THREE.MeshStandardMaterial({ color: 0x9cc4ff, emissive: 0x2f86ff, emissiveIntensity: 2.2 }), off: new THREE.MeshStandardMaterial({ color: 0x1b2633, roughness: .4 }) };
  const leds = [];
  for (let i = 0; i < 12; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(.5, 2.6, .5), ledMat.off);
    l.position.set(SPOTS.jira.x + 7.25, 7 + i * 3.6, SPOTS.jira.z + 7.25);
    scene.add(l); leds.push(l);
  }

  /* ---------- çalışanın ofisi: biten işlerle kat atar, tepesinde adı yazar ---------- */
  // Hub'daki "lit-node" yeşili: koyu yeşil cam, yanan yeşil pencereler
  const officeFacade = facadeMat({ wall: "#12301a", glass: ["#7bdc7b", "#2b6a2e"], frame: "#0c2312", style: "glass", seed: 41, warm: .75, lit: "150,240,150" }, { color: 0xc9f2c9, metalness: .35, roughness: .2 });
  const officeWood = new THREE.MeshStandardMaterial({ color: 0x1d2a20, roughness: .7 });
  const officeEdge = new THREE.MeshStandardMaterial({ color: 0xb6f5b0, emissive: 0x3fbf5f, emissiveIntensity: 2.2, toneMapped: false });
  const office = new THREE.Group();
  const floors = new THREE.Group();
  const officeCrown = new THREE.Group();
  const floorGeo = worldBox(13, FLOOR_H, 13);
  const officeBandGeo = new THREE.BoxGeometry(13.3, .14, 13.3);
  const nameTex = canvasTex(1024, 160, () => {});
  {
    const { x, z } = SPOTS.office;
    const lobby = new THREE.Mesh(worldBox(13, LOBBY_H, 13), facadeMat({ wall: "#0b1f10", glass: ["#bff5b8", "#4fae52"], frame: "#0b1f10", style: "glass", seed: 42, warm: 1, lit: "190,250,185" }));
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(7, .25, 2.4), officeWood);
    canopy.position.set(0, 3.4, 7.6);
    office.add(lobby, canopy, floors, officeCrown);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.3, 13.4), officeWood);
    parapet.position.y = .65;
    const nameSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.875), new THREE.MeshStandardMaterial({ map: nameTex, emissiveMap: nameTex, emissive: 0xffffff, emissiveIntensity: .5, transparent: true }));
    signMats.push(nameSign.material);
    nameSign.position.set(0, 2.45, 6.72);
    const roofBox = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 3), M.roof); roofBox.position.set(-3, 2.1, -3);
    const roofBox2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), M.metal); roofBox2.position.set(3.4, 1.9, -3.4);
    officeCrown.add(parapet, nameSign, roofBox, roofBox2);
    office.position.set(x, 0, z);
    scene.add(office);
    badges.office = badge("office", x, 30, z);
  }
  let floorCount = 0;
  function setFloors(n, animate = true) {
    n = clamp(n, BASE_FLOORS, MAX_FLOORS);
    while (floorCount < n) {
      const f = new THREE.Mesh(floorGeo, [officeFacade, officeFacade, M.roof, M.roof, officeFacade, officeFacade]);
      f.castShadow = f.receiveShadow = true;
      // her katın altında ince yeşil ışık bandı
      const band = new THREE.Mesh(officeBandGeo, officeEdge); band.position.y = .06; f.add(band);
      f.position.y = LOBBY_H + floorCount * FLOOR_H;
      floors.add(f);
      pickTag(f, { type: "office" });
      if (animate) { f.scale.y = .001; tween(1.1, k => { f.scale.y = Math.max(.001, k); }); }
      floorCount++;
    }
    while (floorCount > n) {
      const f = floors.children.at(-1); floors.remove(f);
      f.traverse(o => { const k = pickables.indexOf(o); if (k >= 0) pickables.splice(k, 1); });
      floorCount--;
    }
    const top = LOBBY_H + floorCount * FLOOR_H;
    const from = officeCrown.position.y;
    if (animate) tween(1.1, k => { officeCrown.position.y = lerp(from, top, ease(k)); }); else officeCrown.position.y = top;
    badges.office.position.y = top + 6;
  }
  pickTag(office, { type: "office" });
  setFloors(BASE_FLOORS, false);

  /* ---------- inceleme kutusu: review istekleri zarf olarak üstünde süzülür ---------- */
  const mailbox = new THREE.Group();
  const envelopes = [];
  {
    const amber = new THREE.MeshStandardMaterial({ color: 0xf5b23a, roughness: .4, metalness: .2, emissive: 0x7a4a00, emissiveIntensity: .35 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.7, .9, 3, .12), amber);
    body.position.y = .85 + .2;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .9, 24, 1, false, 0, Math.PI), amber);
    top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.position.y = 1.9;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(.7, .07, .02), M.metal); slot.position.set(0, 1.45, .46);
    mailbox.add(body, top, slot);
    const envMat = new THREE.MeshStandardMaterial({ color: 0xf2fbfb, emissive: 0x1ab0ba, emissiveIntensity: .7, roughness: .6 });
    for (let i = 0; i < 8; i++) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(.95, .05, .62), envMat);
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .06, 12), new THREE.MeshStandardMaterial({ color: 0xf5b23a, emissive: 0xf5b23a, emissiveIntensity: .8 }));
      seal.position.y = .03; e.add(seal);
      e.visible = false; mailbox.add(e); envelopes.push(e);
    }
    mailbox.position.set(SPOTS.mailbox.x, .2, SPOTS.mailbox.z);
    mailbox.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(mailbox);
    pickTag(mailbox, { type: "mailbox" });
    badges.mailbox = badge("mailbox", SPOTS.mailbox.x, 5.6, SPOTS.mailbox.z);
  }

  /* ---------- GitHub binası + Actions fabrikası: grafit, beyaz GitHub amblemi, CI dumanı ve Actions bandı ---------- */
  const GH_MARK = new Path2D("M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z");
  const drawGhMark = (g, cx, cy, size) => { g.save(); g.translate(cx - size / 2, cy - size / 2); g.scale(size / 16, size / 16); g.fillStyle = "#ffffff"; g.fill(GH_MARK); g.restore(); };
  const graphiteSign = (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, "#4a525e"); gr.addColorStop(.4, "#353b44"); gr.addColorStop(1, "#0f1114");
    g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, h, Math.min(26, h / 4)); g.fill();
  };
  const ghEdge = new THREE.MeshStandardMaterial({ color: 0xd0d6dc, emissive: 0xc9d1d9, emissiveIntensity: .9, toneMapped: false });
  const github = new THREE.Group();
  {
    const { x, z } = SPOTS.github;
    const graphite = facadeMat({ wall: "#2a2f36", glass: ["#6b7684", "#1a1e23"], frame: "#14171b", style: "glass", seed: 51, warm: .45, lit: "190,200,212" }, { metalness: .5, roughness: .25 }, .5);
    const body = new THREE.Mesh(worldBox(18, 24, 14), [graphite, graphite, M.roof, M.roof, graphite, graphite]);
    github.add(body);
    for (const fx of [-9.05, 9.05]) for (const fz of [-7.05, 7.05]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(.22, 24, .22), ghEdge); fin.position.set(fx, 12, fz); github.add(fin);
    }
    const roofLine = new THREE.Mesh(new THREE.BoxGeometry(18.3, .18, 14.3), ghEdge); roofLine.position.y = 24; github.add(roofLine);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(13, 3.2, .4), M.metal); frame.position.set(0, 26.4, 0);
    const legs = [-5, 5].map(lx => { const l = new THREE.Mesh(new THREE.BoxGeometry(.3, 2, .3), M.metal); l.position.set(lx, 24.9, 0); return l; });
    const sign = signMesh(12.4, 2.8, (g, w, h) => {
      graphiteSign(g, w, h);
      drawGhMark(g, h * .62, h / 2, h * .62);
      g.fillStyle = "#f0f6fc"; g.textAlign = "left"; g.textBaseline = "middle"; fitText(g, "GitHub", w - h * 1.5, 118, 500); g.fillText("GitHub", h * 1.2, h / 2 + 4);
    });
    sign.mesh.position.set(0, 26.4, .22);
    github.add(frame, ...legs, sign.mesh);
    // cephede dev beyaz amblem
    const emblem = signMesh(7, 7, (g, w, h) => drawGhMark(g, w / 2, h / 2, w * .86));
    emblem.mesh.material.transparent = true;
    emblem.mesh.position.set(0, 15, 7.06);
    github.add(emblem.mesh);
    const door = new THREE.Mesh(new THREE.BoxGeometry(5, 3.6, .2), new THREE.MeshStandardMaterial({ color: 0x1a1f24, emissive: 0xc9d1d9, emissiveIntensity: .35 }));
    door.position.set(0, 1.8, 7.05);
    github.add(door);
    github.position.set(x, 0, z);
    github.traverse(o => { if (o.isMesh && o.material !== ghEdge) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(github);
    pickTag(github, { type: "github" });
    badges.github = badge("github", x, 32, z);
  }
  const factory = new THREE.Group();
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3fbf7f, emissiveIntensity: 1.5 });
  const CHIMNEY_TOP = new THREE.Vector3(SPOTS.factory.x + 4, 20.5, SPOTS.factory.z - 3);
  // Actions bandı: setRuns(n) > 0 iken kayar, kutular fabrikaya taşınır, şerit ışıkları yanar
  const belt = { boxes: [], speed: 0, target: 0, lights: null };
  {
    const { x, z } = SPOTS.factory;
    const shedMat = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: .55, metalness: .45 });
    const shed = new THREE.Mesh(new THREE.BoxGeometry(15, 6, 12), shedMat); shed.position.y = 3;
    factory.add(shed);
    for (let i = 0; i < 4; i++) { // testere dişi çatı, ışık alan cam yüzleriyle
      const tooth = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 12, 3, 1), shedMat);
      tooth.rotation.x = Math.PI / 2; tooth.rotation.y = Math.PI / 2;
      tooth.position.set(-5.6 + i * 3.75, 6.9, 0); factory.add(tooth);
    }
    const shedEdge = new THREE.Mesh(new THREE.BoxGeometry(15.2, .16, 12.2), ghEdge); shedEdge.position.y = 6.02; factory.add(shedEdge);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.3, 20, 20), new THREE.MeshStandardMaterial({ color: 0x353b44, roughness: .6, metalness: .3 }));
    chimney.position.set(4, 10, -3);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .12, 8, 24), M.metal); ring.rotation.x = Math.PI / 2; ring.position.set(4, 19.6, -3);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 12), beaconMat); beacon.position.set(4, 20.4, -3);
    factory.add(chimney, ring, beacon);
    const sign = signMesh(8, 1.6, (g, w, h) => {
      graphiteSign(g, w, h);
      drawGhMark(g, h * .55, h / 2, h * .56);
      g.fillStyle = "#f0f6fc"; g.textAlign = "left"; g.textBaseline = "middle"; fitText(g, "Actions · CI", w - h * 1.3, 62, 600); g.fillText("Actions · CI", h * 1.05, h / 2 + 3);
    });
    sign.mesh.position.set(0, 4.6, 6.03);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, .1), new THREE.MeshStandardMaterial({ color: 0x14171b, emissive: 0x1ab0ba, emissiveIntensity: .25, roughness: .5, metalness: .5 }));
    gate.position.set(-2, 1.7, 6.02);
    factory.add(sign.mesh, gate);
    // bant: kapıdan dışarı, cadde yönüne uzanan taşıyıcı
    const beltBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, .5, 9), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .5, metalness: .6 }));
    beltBase.position.set(-2, .45, 10.6);
    const beltTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, .06, 9), new THREE.MeshStandardMaterial({ color: 0x0b0d0f, roughness: .9 }));
    beltTop.position.set(-2, .73, 10.6);
    factory.add(beltBase, beltTop);
    belt.lights = new THREE.MeshStandardMaterial({ color: 0x9be7ea, emissive: 0x1ab0ba, emissiveIntensity: .15, toneMapped: false });
    for (const sx of [-1.18, 1.18]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 9), belt.lights); l.position.set(-2 + sx, .74, 10.6); factory.add(l); }
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: .5, emissive: 0x1ab0ba, emissiveIntensity: .25 });
    const boxGeo = new RoundedBoxGeometry(1.1, .7, 1.1, 2, .08);
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(boxGeo, boxMat); b.position.set(-2, 1.12, 6.4 + i * 1.8); b.visible = false; b.castShadow = true;
      factory.add(b); belt.boxes.push(b);
    }
    factory.position.set(x, 0, z);
    factory.traverse(o => { if (o.isMesh && o.material !== ghEdge && o.material !== belt.lights) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(factory);
    pickTag(factory, { type: "factory" });
    badges.factory = badge("factory", x + 4, 25, z - 3);
  }
  let runCount = 0;
  function setRuns(n) {
    runCount = Math.max(0, n | 0);
    belt.target = runCount ? 1.6 + Math.min(runCount, 4) * .4 : 0;
    belt.boxes.forEach((b, i) => { b.visible = i < Math.min(runCount + 1, belt.boxes.length) && runCount > 0; });
    belt.lights.emissiveIntensity = runCount ? 2.2 : .15;
  }

  /* ---------- release panosu: caddenin karşısında dijital pano, yeni release'te yanar ---------- */
  const releaseTex = canvasTex(1024, 384, () => {});
  const releaseMat = new THREE.MeshStandardMaterial({ map: releaseTex, emissiveMap: releaseTex, emissive: 0xffffff, emissiveIntensity: .6, roughness: .4 });
  signMats.push(releaseMat);
  const releaseBoard = new THREE.Group();
  {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: .4, metalness: .6 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(12.4, 4.8, .4), frameMat); panel.position.y = 7;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.5), releaseMat); screen.position.set(0, 7, .21);
    const post = new THREE.Mesh(new THREE.BoxGeometry(.5, 5, .5), frameMat); post.position.y = 2.5;
    releaseBoard.add(panel, screen, post);
    releaseBoard.position.set(-16, .2, 10.4);
    releaseBoard.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(releaseBoard);
    pickTag(releaseBoard, { type: "github" });
  }
  let releaseCount = -1;
  function drawRelease(n) {
    redraw(releaseTex, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, n ? "#1f6e33" : "#2a2f36"); gr.addColorStop(1, n ? "#0a220d" : "#0f1114");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,.08)";
      for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,255,255,.7)"; g.font = "500 40px Urbanist, sans-serif"; g.textBaseline = "top"; g.fillText("RELEASE'LER · BU HAFTA", 48, 44);
      g.fillStyle = "#ffffff"; g.font = "200 190px Urbanist, sans-serif"; g.textBaseline = "alphabetic";
      const numW = g.measureText(String(n)).width;
      g.fillText(String(n), 44, h - 52);
      g.font = "400 48px Urbanist, sans-serif"; g.fillStyle = n ? "#9cf39a" : "rgba(255,255,255,.55)";
      g.fillText(n ? "yeni sürüm yayında" : "sessiz bir hafta", 44 + numW + 28, h - 66);
    });
  }
  function setReleases(n) {
    n = Math.max(0, n | 0);
    if (n === releaseCount) return;
    const grew = releaseCount >= 0 && n > releaseCount;
    releaseCount = n;
    drawRelease(n);
    if (grew) {
      const p = releaseBoard.position;
      for (let i = 0; i < 3; i++) setTimeout(() => burst(new THREE.Vector3(p.x + (i - 1) * 4, 13 + Math.random() * 3, p.z), [0x3fbf7f, 0xffffff, 0x1ab0ba][i]), i * 300);
    }
  }

  drawRelease(0);
  document.fonts?.ready.then(() => drawRelease(Math.max(releaseCount, 0)));

  /* ---------- sertifika uyarı feneri: GitHub binasının çatısında dönen amber ışık ---------- */
  const certBeacon = new THREE.Group();
  const certMat = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xf5b23a, emissiveIntensity: 0, toneMapped: false });
  const certBeam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xf5b23a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.7, .9, .8, 16), M.metal);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.6, 16, 12), certMat); lamp.position.y = .8;
    certBeam.rotation.z = Math.PI / 2; certBeam.position.set(4.5, .8, 0);
    certBeacon.add(base, lamp, certBeam);
    certBeacon.position.set(SPOTS.github.x + 6, 24.4, SPOTS.github.z - 4);
    certBeacon.visible = false;
    scene.add(certBeacon);
  }
  let certOn = false;
  function setCertWarning(on) { certOn = !!on; certBeacon.visible = certOn; certMat.emissiveIntensity = certOn ? 3 : 0; certBeam.material.opacity = certOn ? .22 : 0; }

  const smokeTex = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.6, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const smoke = [];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, color: 0xdddddd }));
    s.userData = { age: i / 22 * 6, life: 6 };
    scene.add(s); smoke.push(s);
  }
  const smokeColor = new THREE.Color(0xdddddd), smokeTarget = new THREE.Color(0xdddddd);
  let ciState = "success";

  /* ---------- kanban meydanı ---------- */
  {
    const { x, z } = SPOTS.plaza;
    add(at(new THREE.Mesh(new THREE.BoxGeometry(58, .3, 30), M.plaza), x, .15, z), { cast: false });
    const LANE_TR = { todo: "YAPILACAK", doing: "SÜRÜYOR", review: "İNCELEMEDE", done: "TAMAMLANDI" };
    for (const lane of LANES) {
      const lx = LANE_X[lane];
      // şerit: koyu, içe gömük zemin, rengi Hub çiplerinden; kenarları ince ışıkla çizili
      const pad = add(new THREE.Mesh(new THREE.BoxGeometry(11.6, .08, 24.5), new THREE.MeshStandardMaterial({ color: new THREE.Color("#0d1012").lerp(new THREE.Color(LANE_COLOR[lane]), .12), roughness: .85 })), { cast: false });
      for (const sx of [-5.8, 5.8]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, 24.5), new THREE.MeshStandardMaterial({ color: LANE_COLOR[lane], emissive: LANE_COLOR[lane], emissiveIntensity: .35, toneMapped: false }));
        side.position.set(lx + sx, .39, z + 1.2); signMats.push(side.material); scene.add(side);
      }
      pad.position.set(lx, .34, z + 1.2);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(11.6, .1, .3), new THREE.MeshStandardMaterial({ color: LANE_COLOR[lane], emissive: LANE_COLOR[lane], emissiveIntensity: .6 }));
      strip.position.set(lx, .38, z - 11.2);
      signMats.push(strip.material);
      scene.add(strip);
      const lbl = signMesh(10.4, 1.6, (g, w, h) => {
        g.fillStyle = LANE_COLOR[lane]; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, LANE_TR[lane], w - 40, 70); g.fillText(LANE_TR[lane], w / 2, h / 2 + 4);
      }, { glow: false });
      lbl.mesh.material.transparent = true;
      lbl.mesh.rotation.x = -Math.PI / 2;
      lbl.mesh.position.set(lx, .39, z + 12.6);
      scene.add(lbl.mesh);
    }
    // meydan köşelerinde saksı ağaçları ve banklar
    const planter = new THREE.MeshStandardMaterial({ color: 0x1d2125, roughness: .9 });
    for (const [px, pz] of [[-27, 12], [27, 12], [-27, 38], [27, 38], [0, 39]]) {
      const p = add(new THREE.Mesh(new THREE.BoxGeometry(2.6, .8, 2.6), planter)); p.position.set(px, .7, pz);
      tree(px, pz, .8);
    }
    for (const bx of [-13, 0, 13]) {
      const seat = add(new THREE.Mesh(new THREE.BoxGeometry(3.4, .14, .7), officeWood)); seat.position.set(bx, .82, 39);
      for (const s of [-1.4, 1.4]) { const leg = add(new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .6), M.metal)); leg.position.set(bx + s, .55, 39); }
    }
  }

  /* ---------- şehir dokusu: arka plandaki bloklar ---------- */
  {
    const R = rng(77);
    const rooftop = new THREE.BoxGeometry(1, 1, 1);
    const plinthGeo = new THREE.BoxGeometry(1, .2, 1);
    const ROOFS = [0x16191c, 0x1c1f22, 0x121417, 0x1f2326].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9 }));
    // meydanın arkasında sonbahar parkı: kameranın önü açık kalır, şehir nefes alır
    const grass = new THREE.MeshStandardMaterial({ color: 0x122016, roughness: 1 });
    add(at(new THREE.Mesh(new THREE.BoxGeometry(200, .12, 88), grass), 5, .06, 85), { cast: false });
    const path = new THREE.MeshStandardMaterial({ color: 0x23282c, roughness: 1 });
    add(at(new THREE.Mesh(new THREE.BoxGeometry(4, .14, 88), path), 0, .08, 85), { cast: false });
    add(at(new THREE.Mesh(new THREE.BoxGeometry(200, .14, 4), path), 5, .08, 74), { cast: false });
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, .1, 48), new THREE.MeshStandardMaterial({ color: 0x0c2a33, roughness: .05, metalness: .4, emissive: 0x0a3a40, emissiveIntensity: .3 }));
    pond.scale.z = .6; add(at(pond, 42, .14, 96), { cast: false });
    for (let i = 0; i < 90; i++) {
      const tx = -92 + R() * 196, tz = 46 + R() * 80;
      if (Math.abs(tx) < 4 || Math.abs(tz - 74) < 4 || Math.hypot((tx - 42) / 15, (tz - 96) / 9.5) < 1) continue;
      tree(tx, tz, .9 + R() * .7);
    }
    for (let gx = -150; gx <= 150; gx += 22) for (let gz = -140; gz <= 140; gz += 22) {
      if (Math.abs(gz) < 16) continue;
      if (gx > -50 && gx < 66 && gz > -40 && gz < 46) continue;
      if (gx > -100 && gx < 110 && gz > 40 && gz < 130) continue; // park
      if (R() < .14) continue;
      const w = 11 + R() * 7, d = 11 + R() * 7;
      const far = Math.hypot(gx, gz);
      const h = gz > 0 && gz < 60 ? 6 + R() * 8 : clamp(8 + R() * (far < 90 ? 26 : 48) + (R() < .1 ? 30 : 0), 8, 80);
      const fm = FACADES[R() * FACADES.length | 0];
      const b = new THREE.Mesh(worldBox(w, h, d), [fm, fm, ROOFS[R() * ROOFS.length | 0], M.roof, fm, fm]);
      b.position.set(gx + (R() - .5) * 4, 0, gz + (R() - .5) * 4);
      add(b);
      add(at(new THREE.Mesh(plinthGeo, M.sidewalk), b.position.x, .1, b.position.z), { cast: false }).scale.set(w + 3, 1, d + 3);
      if (R() < .7) { const u = add(new THREE.Mesh(rooftop, M.roof)); u.scale.set(2 + R() * 3, 1 + R() * 1.5, 2 + R() * 3); u.position.set(b.position.x + (R() - .5) * w * .5, h + u.scale.y / 2, b.position.z + (R() - .5) * d * .5); }
    }
  }

  /* ---------- kasalar (işler) ---------- */
  const crateGeo = new RoundedBoxGeometry(2.3, 1.45, 2.3, 3, .14);
  const labelGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const crates = new Map();
  const crateGroup = new THREE.Group();
  scene.add(crateGroup);

  function drawCrateLabel(g, w, h, it) {
    const done = it.status === "done";
    // kasa etiketi: Hub kartı gibi koyu cam, üstte önceliğin rengiyle ince şerit
    const accent = it.kind === "pr" ? "#8b7dff" : done ? "#3fbf7f" : it.src === "jira" ? "#4c9aff" : PRIO_COLOR[it.prio] || PRIO_COLOR.medium;
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1f2329"); bg.addColorStop(1, "#0e1013");
    g.fillStyle = bg; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 26); g.fill();
    g.strokeStyle = accent; g.lineWidth = 6; g.beginPath(); g.roundRect(9, 9, w - 18, h - 18, 24); g.stroke();
    g.fillStyle = PRIO_COLOR[it.prio] || accent; g.beginPath(); g.roundRect(30, 22, w - 60, 8, 4); g.fill();
    g.fillStyle = "rgba(255,255,255,.9)"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "600 28px Urbanist, Red Hat Text, sans-serif";
    g.fillText(it.kind === "pr" ? "PR" : it.src === "gh" ? "GITHUB" : (it.type || "İŞ").toLocaleUpperCase("tr"), w / 2, 50);
    g.fillStyle = "#fff";
    fitText(g, (done ? "✓ " : "") + it.key, w - 36, 62);
    g.fillText((done ? "✓ " : "") + it.key, w / 2, h / 2 + 6);
    g.fillStyle = "rgba(255,255,255,.75)";
    g.font = "500 24px Urbanist, Red Hat Text, sans-serif";
    g.fillText((it.project || it.repo || "").slice(0, 18), w / 2, h - 46);
  }
  function crateColor(it) {
    if (it.kind === "pr" || it.src === "gh") return 0x2a2f36;
    if (it.src === "jira") return it.status === "done" ? 0x1f4a2a : 0x173a6e;
    return it.status === "done" ? 0x1f4a2a : 0x23282d;
  }
  function makeCrate(it) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: crateColor(it), roughness: .45, metalness: .25, emissive: 0xffffff, emissiveIntensity: 0 });
    const body = new THREE.Mesh(crateGeo, mat);
    body.position.y = .725;
    body.castShadow = body.receiveShadow = true;
    const tex = canvasTex(256, 256, (gg, w, h) => drawCrateLabel(gg, w, h, it));
    const lab = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .6, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .55 }));
    lab.position.y = 1.456;
    // tahta çıtalar: kasa hissi
    for (const s of [-1, 1]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.34, .14, .18), new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: .18 }));
      band.position.set(0, .72, s * .68); g.add(band);
    }
    g.add(body, lab);
    g.userData = { id: it.id, it, mat, tex, labMat: lab.material, sig: "" };
    pickTag(g, { type: "item", id: it.id });
    crateGroup.add(g);
    return g;
  }
  function slotOf(lane, i) {
    const col = i % 4, row = i / 4 | 0;
    return new THREE.Vector3(LANE_X[lane] + (col - 1.5) * 2.75, .38, SPOTS.plaza.z - 8.4 + row * 2.9);
  }
  function removeCrate(c) {
    c.traverse(o => { if (o.isMesh) { const k = pickables.indexOf(o); if (k >= 0) pickables.splice(k, 1); } });
    tween(.4, k => c.scale.setScalar(1 - k), () => { crateGroup.remove(c); c.userData.tex.dispose(); });
  }
  const prioRank = { highest: 0, high: 1, medium: 2, low: 3 };
  function setItems(items, arrivals = new Set()) {
    const byLane = { todo: [], doing: [], review: [], done: [] };
    for (const it of items) (byLane[it.status] || byLane.todo).push(it);
    byLane.done.sort((a, b) => b.updated - a.updated);
    byLane.done.length = Math.min(byLane.done.length, 16);
    for (const l of ["todo", "doing", "review"]) byLane[l].sort((a, b) => (prioRank[a.prio] ?? 2) - (prioRank[b.prio] ?? 2) || b.updated - a.updated).splice(32);
    const keep = new Set();
    for (const lane of LANES) byLane[lane].forEach((it, i) => {
      keep.add(it.id);
      let c = crates.get(it.id);
      const target = slotOf(lane, i);
      const sig = `${it.status}|${it.key}|${it.prio}|${it.title}`;
      if (!c) {
        c = makeCrate(it);
        c.userData.sig = sig;
        crates.set(it.id, c);
        c.position.copy(target);
        if (arrivals.has(it.id)) { c.visible = false; deliver(c, it.src === "gh" ? "github" : "jira", target); }
        else { c.scale.setScalar(.001); tween(.5, k => c.scale.setScalar(Math.max(.001, ease(k)))); }
        return;
      }
      c.userData.it = it;
      if (c.userData.sig !== sig) {
        c.userData.sig = sig;
        redraw(c.userData.tex, (g, w, h) => drawCrateLabel(g, w, h, it));
        c.userData.mat.color.set(crateColor(it));
      }
      if (c.userData.busy) { c.userData.dest = target; return; }
      if (c.position.distanceTo(target) > .05) hop(c, target);
    });
    for (const [id, c] of crates) if (!keep.has(id)) { crates.delete(id); removeCrate(c); }
  }
  function hop(c, target) {
    const from = c.position.clone();
    const far = from.distanceTo(target);
    const hgt = far > 6 ? 3.2 : .8;
    c.userData.busy = true;
    tween(far > 6 ? 1.2 : .5, k => {
      const e = ease(k);
      c.position.lerpVectors(from, target, e);
      c.position.y = target.y + Math.sin(Math.PI * k) * hgt;
      c.rotation.y = far > 6 ? Math.sin(Math.PI * k) * .5 : 0;
    }, () => { c.userData.busy = false; if (c.userData.dest) { const d = c.userData.dest; c.userData.dest = null; hop(c, d); } });
  }

  /* Seçili kasanın üstünde dönen ok ve zeminde halka */
  const marker = new THREE.Group();
  {
    const mm = new THREE.MeshStandardMaterial({ color: 0x4fd0d8, emissive: 0x1ab0ba, emissiveIntensity: 1.6 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, .07, 8, 48), mm); ring.rotation.x = Math.PI / 2; ring.position.y = .06;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(.42, .9, 4), mm); arrow.rotation.x = Math.PI; arrow.name = "arrow";
    marker.add(ring, arrow);
    marker.visible = false;
    signMats.push(mm);
    scene.add(marker);
  }
  let selected = null;
  function select(id) { selected = id && crates.has(id) ? id : null; marker.visible = !!selected; }

  /* ---------- teslimat dronları ---------- */
  const droneParts = {
    body: new RoundedBoxGeometry(1.4, .38, 1.4, 2, .1),
    arm: new THREE.BoxGeometry(2.6, .08, .14),
    rotor: new THREE.CylinderGeometry(.62, .62, .02, 20),
    mat: new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: .4, metalness: .5 }),
    rot: new THREE.MeshStandardMaterial({ color: 0x9fb3bf, transparent: true, opacity: .45 }),
    red: new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 2 }),
    green: new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22ff66, emissiveIntensity: 2 }),
  };
  const drones = [];
  function makeDrone() {
    const d = new THREE.Group();
    d.add(new THREE.Mesh(droneParts.body, droneParts.mat));
    const rotors = [];
    for (const r of [Math.PI / 4, -Math.PI / 4]) { const a = new THREE.Mesh(droneParts.arm, droneParts.mat); a.rotation.y = r; d.add(a); }
    for (const [x, z] of [[.92, .92], [-.92, .92], [.92, -.92], [-.92, -.92]]) {
      const ro = new THREE.Mesh(droneParts.rotor, droneParts.rot); ro.position.set(x, .2, z); d.add(ro); rotors.push(ro);
      const nav = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), x > 0 ? droneParts.green : droneParts.red); nav.position.set(x, .05, z); d.add(nav);
    }
    d.userData.rotors = rotors;
    d.scale.setScalar(2);
    d.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(d);
    return d;
  }
  function deliver(crate, from, target) {
    const d = makeDrone();
    const s = SPOTS[from];
    const A = new THREE.Vector3(s.x, (s.roof || 25) + 1.5, s.z);
    const cruise = Math.max(A.y + 4, 24);
    const T = target.clone();
    crate.userData.busy = true;
    d.add(crate); crate.visible = true; crate.position.set(0, -1.2, 0); crate.rotation.set(0, 0, 0); crate.scale.setScalar(.5);
    const legs = [
      [1.0, k => d.position.set(A.x, lerp(A.y, cruise, ease(k)), A.z)],
      [2.6, k => { const e = ease(k); d.position.set(lerp(A.x, T.x, e), cruise + Math.sin(Math.PI * k) * 3, lerp(A.z, T.z, e)); d.rotation.z = Math.sin(Math.PI * k) * -.12 * Math.sign(T.x - A.x); }],
      [1.1, k => d.position.set(T.x, lerp(cruise, T.y + 2.4, ease(k)), T.z)],
    ];
    d.position.copy(A);
    d.userData.flight = { legs, i: 0, t: 0, onDrop: () => {
      d.remove(crate); crateGroup.add(crate); crate.scale.setScalar(1);
      crate.position.copy(T); crate.userData.busy = false;
      tween(.25, k => { crate.scale.y = 1 - Math.sin(Math.PI * k) * .12; });
      if (crate.userData.dest) { const dd = crate.userData.dest; crate.userData.dest = null; hop(crate, dd); }
      d.userData.flight = { legs: [
        [1.0, k => d.position.y = lerp(T.y + 2.4, cruise, ease(k))],
        [2.4, k => { const e = ease(k); d.position.set(lerp(T.x, A.x, e), cruise, lerp(T.z, A.z, e)); }],
        [1.0, k => d.position.y = lerp(cruise, A.y, ease(k))],
      ], i: 0, t: 0, onDrop: () => { scene.remove(d); drones.splice(drones.indexOf(d), 1); } };
    } };
    drones.push(d);
  }
  // Jira kulesinin çatısında bekleyen iki dron (sahneye canlılık)
  const parked = [-1.9, 1.9].map(o => { const d = makeDrone(); d.position.set(SPOTS.jira.x + o, 53.6, SPOTS.jira.z + .5); return d; });

  /* ---------- havai fişek ---------- */
  const bursts = [];
  function burst(pos, color) {
    const n = 110, p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) {
      p.set([pos.x, pos.y, pos.z], i * 3);
      const dir = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(7 + Math.random() * 5);
      v.push(dir);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: .55, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    pts.material.color.multiplyScalar(3);
    scene.add(pts);
    bursts.push({ pts, v, t: 0 });
  }
  function celebrate(where) {
    const s = typeof where === "string" ? SPOTS[where] : where;
    const base = new THREE.Vector3(s.x, (where === "office" ? LOBBY_H + floorCount * FLOOR_H : s.roof || 20) + 10, s.z);
    const colors = [0x1ab0ba, 0x7a6cff, 0xf5c542, 0x3fbf7f, 0xff6b6b];
    for (let i = 0; i < 4; i++) setTimeout(() => burst(base.clone().add(new THREE.Vector3((Math.random() - .5) * 14, Math.random() * 6, (Math.random() - .5) * 8)), colors[(Math.random() * colors.length) | 0]), i * 380);
  }

  /* ---------- gün ışığı: gerçek saate göre güneş, akşam, gece ---------- */
  let timeMode = "auto", focusOn = false, lastEnvElev = 999, lastSunUpdate = 0;
  const sunDir = new THREE.Vector3();
  function sunAt(date) {
    const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 864e5);
    const c = Math.cos(2 * Math.PI * (doy - 172) / 365);
    const sr = 6.45 - .95 * c, ss = 18.67 + 2.0 * c, maxEl = 49 + 23.4 * c;
    const h = date.getHours() + date.getMinutes() / 60;
    if (h >= sr && h <= ss) { const f = (h - sr) / (ss - sr); return { elev: maxEl * Math.sin(Math.PI * f), az: lerp(70, -70, f) }; }
    const nightLen = 24 - (ss - sr), f = ((h - ss + 24) % 24) / nightLen;
    return { elev: -16 * Math.sin(Math.PI * f), az: lerp(-70, -110, f) };
  }
  const FOG = { day: new THREE.Color(0x9fb3c2), dusk: new THREE.Color(0x6e5a63), night: new THREE.Color(0x141a22) };
  function applySun() {
    // "Oto": Hub'ın koyu dili. Güneşin gerçek konumunu izler ama gün içinde de mavi saatte kalır;
    // gündüz/akşam istenirse üstteki düğmelerden seçilir.
    let { elev, az } = timeMode === "day" ? { elev: 36, az: 25 } : timeMode === "dusk" ? { elev: 4, az: -62 } : timeMode === "night" ? { elev: -14, az: -80 } : sunAt(new Date());
    if (timeMode === "auto") elev = clamp(elev, -14, -5);
    if (focusOn) elev = Math.min(elev, 2.5);
    const day = clamp(elev / 18, 0, 1), night = clamp((3 - elev) / 11, 0, 1), golden = clamp(1 - Math.abs(elev - 5) / 9, 0, 1);
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Math.max(elev, -4)), THREE.MathUtils.degToRad(az));
    const u = sky.material.uniforms;
    u.sunPosition.value.copy(sunDir);
    u.turbidity.value = lerp(4, 9, golden);
    u.rayleigh.value = lerp(1.2, 2.6, golden) * (1 - night * .6);
    u.mieCoefficient.value = .004;
    u.mieDirectionalG.value = .82;
    envSky.material.uniforms.sunPosition.value.copy(sunDir);
    for (const k of ["turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG"]) envSky.material.uniforms[k].value = u[k].value;

    // gece: ışık aydan gelir, soğuk ve zayıf
    if (elev > -1) {
      sun.position.copy(sunDir).multiplyScalar(260);
      sun.intensity = 3.2 * Math.pow(clamp(elev / 14, .05, 1), .6);
      sun.color.setHSL(.09 + .04 * day, lerp(.85, .35, day), lerp(.62, .93, day));
    } else {
      sun.position.set(-120, 200, 140);
      // Bright moonlight: the city reads clearly at night, like a lit dashboard.
      sun.intensity = .9;
      sun.color.set(0xaec2ff);
    }
    hemi.intensity = lerp(.75, 1.05, day) + golden * .1;
    hemi.color.set(night > .5 ? 0x5a6e96 : 0xcfe2ff).lerp(new THREE.Color(0xffc49a), golden * .5);
    hemi.groundColor.set(night > .5 ? 0x1c2128 : 0x3a3a3a);
    const fog = FOG.day.clone().lerp(FOG.dusk, golden * (1 - night * .5)).lerp(FOG.night, night);
    scene.fog.color.copy(fog);
    renderer.toneMappingExposure = lerp(.62, .5, golden) * (night > .5 ? 1.45 : 1);
    stars.material.opacity = night * .9;
    for (const m of windowMats) m.emissiveIntensity = (.02 + night * .8 + golden * .15) * m.userData.glow;
    if (focusOn) officeFacade.emissiveIntensity = 1.6;
    M.lamp.emissiveIntensity = night * 5;
    M.pool.opacity = night * .22;
    for (const m of signMats) m.emissiveIntensity = .35 + night * 1.6;
    bloom.strength = .16 + night * .62;
    bloom.threshold = lerp(.9, .72, night);
    if (Math.abs(elev - lastEnvElev) > 1.5) {
      lastEnvElev = elev;
      envRT?.dispose();
      envRT = pmrem.fromScene(envScene, 0, .1, 200);
      scene.environment = envRT.texture;
      scene.environmentIntensity = night > .5 ? .55 : 1;
    }
    return { elev, night };
  }

  /* ---------- etkileşim: hover, tıklama, kameranın uçuşu ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null, downAt = null, lastMove = null;
  const pickAt = (cx, cy) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit?.object.userData.pick || null;
  };
  function setHover(p, x, y) {
    const id = p?.type === "item" ? p.id : null;
    if (hovered && hovered !== id) { const c = crates.get(hovered); if (c) c.userData.mat.emissiveIntensity = 0; }
    hovered = id;
    if (id) { const c = crates.get(id); if (c) c.userData.mat.emissiveIntensity = .18; }
    renderer.domElement.style.cursor = p ? "pointer" : "";
    onHover(id ? crates.get(id)?.userData.it : p ? { type: p.type } : null, x, y);
  }
  renderer.domElement.addEventListener("pointermove", e => { lastMove = e; });
  renderer.domElement.addEventListener("pointerleave", () => { lastMove = null; setHover(null); });
  renderer.domElement.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; stopAuto(); });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const p = pickAt(e.clientX, e.clientY);
    onPick(p ? (p.type === "item" ? { type: "item", item: crates.get(p.id)?.userData.it } : p) : null);
  });
  renderer.domElement.addEventListener("wheel", () => stopAuto(), { passive: true });
  // çift tıklama: binaya ya da kasaya yaklaş
  renderer.domElement.addEventListener("dblclick", e => {
    const p = pickAt(e.clientX, e.clientY);
    if (!p) return;
    stopAuto();
    flyTo(p.type === "item" ? p.id : p.type);
  });

  function flyTo(where, dist) {
    let tgt, d = dist;
    if (typeof where === "string" && SPOTS[where]) {
      const s = SPOTS[where];
      const y = where === "jira" ? 24 : where === "github" ? 12 : where === "factory" ? 8 : where === "office" ? (LOBBY_H + floorCount * FLOOR_H) / 2 : where === "mailbox" ? 2 : 1;
      tgt = new THREE.Vector3(s.x, y, s.z);
      d ??= { jira: 95, github: 60, factory: 50, office: 60, mailbox: 22, plaza: 70 }[where];
    } else {
      const c = crates.get(where);
      if (!c) return;
      tgt = c.getWorldPosition(new THREE.Vector3()); tgt.y = 1;
      d ??= 24;
    }
    const fromT = controls.target.clone(), fromP = camera.position.clone();
    // her yere güneyden, park tarafından ve yüksekten bakılır: arada bina kalmaz
    const dir = new THREE.Vector3(.18, .62, 1).normalize();
    const toP = tgt.clone().add(dir.multiplyScalar(d));
    tween(1.3, k => { const e = ease(k); controls.target.lerpVectors(fromT, tgt, e); camera.position.lerpVectors(fromP, toP, e); });
  }
  let auto = false;
  const stopAuto = () => { auto = false; controls.autoRotate = false; };
  function intro() {
    const fromP = new THREE.Vector3(-150, 120, 190), toP = new THREE.Vector3(-14, 78, 128);
    camera.position.copy(fromP);
    tween(3.2, k => camera.position.lerpVectors(fromP, toP, ease(k)));
  }
  function attract(on) { auto = on; controls.autoRotate = on; controls.autoRotateSpeed = .35; }

  /* ---------- dışa açık ayarlayıcılar ---------- */
  function setName(name) {
    const up = (name || "WorkCity").toLocaleUpperCase("tr");
    redraw(roadNameTex, (g, w, h) => {
      g.fillStyle = "rgba(242,242,236,.82)"; g.textAlign = "center"; g.textBaseline = "middle";
      fitText(g, `${up} CADDESİ`, w - 120, 190, 600);
      g.fillText(`${up} CADDESİ`, w / 2, h / 2 + 10);
    });
    redraw(signTex, (g, w, h) => {
      g.fillStyle = "#1f4fa3"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#fff"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      fitText(g, `${up} CD.`, w - 60, 58, 800);
      g.fillText(`${up} CD.`, w / 2, h / 2 - 8);
      g.font = "600 22px Urbanist, Red Hat Text, sans-serif"; g.fillText("WORKCITY · LOODOS", w / 2, h - 26);
    });
    redraw(nameTex, (g, w, h) => {
      g.fillStyle = "#e9ffe6"; g.textAlign = "center"; g.textBaseline = "middle";
      fitText(g, up, w - 40, 120, 500);
      g.fillText(up, w / 2, h / 2 + 8);
    });
  }
  function setReviews(n) {
    envelopes.forEach((e, i) => { e.visible = i < Math.min(n, envelopes.length); });
  }
  function setCI(state) {
    ciState = state || "none";
    smokeTarget.set({ success: 0xe4e6e8, failure: 0x6b2a2a, running: 0xd9b26a, none: 0xb8bcc0 }[ciState] || 0xb8bcc0);
    beaconMat.emissive.set({ success: 0x3fbf7f, failure: 0xff3b3b, running: 0xffb020, none: 0x556066 }[ciState] || 0x556066);
  }
  function setOpen(n) { leds.forEach((l, i) => { l.material = i < n ? ledMat.on : ledMat.off; }); }
  function setBadge(key, title, line, tone = "") {
    const b = badges[key]; if (!b) return;
    b.element.querySelector("b").textContent = title;
    b.element.querySelector("span").textContent = line;
    b.element.dataset.tone = tone;
  }
  function setBadgesVisible(on) { for (const b of Object.values(badges)) b.element.hidden = !on; }
  function setTimeMode(m) { timeMode = m; lastEnvElev = 999; return applySun(); }
  function setFocus(on) { focusOn = on; officeFacade.emissiveIntensity = 0; lastEnvElev = 999; applySun(); if (on) flyTo("office", 55); }

  /* ---------- döngü ---------- */
  function resize() {
    const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 50 : 38;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el);
  resize();
  applySun();

  const clock = new THREE.Clock();
  let tick = 0;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    tick += dt;
    try {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        tw.fn(k, k);
        if (k >= 1) { tweens.splice(i, 1); tw.done?.(); }
      }
      for (const d of [...drones, ...parked]) for (const r of d.userData.rotors) r.rotation.y += dt * 40;
      parked.forEach((d, i) => { d.position.y = 53.6 + Math.sin(tick * 2 + i) * .03; });
      for (const d of [...drones]) {
        const f = d.userData.flight; if (!f) continue;
        f.t += dt;
        const [dur, fn] = f.legs[f.i];
        fn(Math.min(1, f.t / dur));
        if (f.t >= dur) { f.i++; f.t = 0; if (f.i >= f.legs.length) f.onDrop(); }
      }
      // duman
      smokeColor.lerp(smokeTarget, dt * 1.5);
      for (const s of smoke) {
        const u = s.userData; u.age += dt;
        if (u.age > u.life) u.age -= u.life;
        const k = u.age / u.life;
        s.position.set(CHIMNEY_TOP.x + k * 6 + Math.sin(u.age * 1.3 + u.life) * .4, CHIMNEY_TOP.y + k * 12, CHIMNEY_TOP.z + k * 2);
        s.scale.setScalar(1.2 + k * 5);
        s.material.opacity = (ciState === "none" ? .25 : .6) * Math.sin(Math.PI * k);
        s.material.color.copy(smokeColor);
      }
      beaconMat.emissiveIntensity = ciState === "failure" ? (Math.sin(tick * 8) > 0 ? 4 : .3) : ciState === "running" ? 1.5 + Math.sin(tick * 4) * 1.2 : 1.2;
      // Actions bandı: hız yumuşakça hedefe gelir, kutular kapıya doğru akar
      belt.speed = lerp(belt.speed, belt.target, Math.min(1, dt * 2));
      if (belt.speed > .01) for (const b of belt.boxes) { if (!b.visible) continue; b.position.z -= belt.speed * dt; if (b.position.z < 6.4) b.position.z += 9; b.scale.setScalar(clamp((b.position.z - 6.4) * 1.5, .01, 1)); }
      if (runCount) belt.lights.emissiveIntensity = 1.6 + Math.sin(tick * 5) * .6;
      if (certOn) { certBeacon.rotation.y += dt * 2.4; certMat.emissiveIntensity = 2.2 + Math.sin(tick * 6) * 1; }
      envelopes.forEach((e, i) => { if (!e.visible) return; const a = tick * .6 + i * (Math.PI * 2 / 8); e.position.set(Math.cos(a) * 1.4, 3 + Math.sin(tick * 2 + i) * .25, Math.sin(a) * 1.4); e.rotation.y = -a; });
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]; b.t += dt;
        const pos = b.pts.geometry.attributes.position;
        b.v.forEach((v, j) => { v.y -= 6 * dt; v.multiplyScalar(1 - dt * .9); pos.setXYZ(j, pos.getX(j) + v.x * dt, pos.getY(j) + v.y * dt, pos.getZ(j) + v.z * dt); });
        pos.needsUpdate = true;
        b.pts.material.opacity = 1 - b.t / 1.8;
        if (b.t > 1.8) { scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i, 1); }
      }
      if (timeMode === "auto" && tick - lastSunUpdate > 30) { lastSunUpdate = tick; applySun(); }
      if (selected) {
        const c = crates.get(selected);
        if (!c) select(null);
        else { const p = c.getWorldPosition(new THREE.Vector3()); marker.position.set(p.x, c.parent === crateGroup ? .38 : p.y, p.z); marker.getObjectByName("arrow").position.y = 3 + Math.sin(tick * 3) * .25; marker.rotation.y += dt; }
      }
      if (lastMove) { const e = lastMove; lastMove = null; const p = pickAt(e.clientX, e.clientY); setHover(p, e.clientX, e.clientY); }
      controls.target.x = clamp(controls.target.x, -80, 80);
      controls.target.z = clamp(controls.target.z, -50, 50);
      controls.target.y = clamp(controls.target.y, 0, 30);
      controls.update();
      composer.render();
      labels.render(scene, camera);
    } catch (err) { console.error(err); }
  }
  frame();

  return { select, setName, setItems, setReviews, setCI, setOpen, setFloors, setBadge, setBadgesVisible, setTimeMode, setFocus, celebrate, flyTo, intro, attract, setRuns, setReleases, setCertWarning, crateIds: () => [...crates.keys()] };
}
