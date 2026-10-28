/* Şehrin canlı detayları: müşterilere atıf yapan köşeler, özel günler (bayram, yılbaşı) ve şehir hayatı
   (gökkuşağı, kuşlar, bulut gölgeleri, dron teslimat, reklam panoları, Boğaz ve vapur).
   createStreet bir kez buildExtras(kit) çağırır; dönen nesnenin step / applyNight / setEvent'i sahneden sürülür. */
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = x => Math.min(1, Math.max(0, x));

export function buildExtras(k) {
  const { world, scene, camera, controls, VIEW, el, box, cyl, plane, mat, M, BOX, carMesh, companies, parks, districts,
    LEN, X_MIN, X_MAX, LOT_Z, hqX, hq, fountain, plazaPos, signMats, wordTexture, glowTex, flagMat, flagTex, crowns, data,
    pickables, LITE, rand, pick, tt, onEvent, laneBusy } = k;
  const anim = [];            // her karede (dt, t) ile çağrılır
  const nightFx = [];         // applyNight'ta (lit) ile çağrılır
  const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  const tagPick = (g, id) => g.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "company", id }; });
  // Dükkânın arka bahçesine bağlı grup: dükkânla birlikte döner, tıklanınca o dükkân açılır.
  function attach(id, dz) {
    const c = companies.get(id);
    if (!c) return null;
    const g = new THREE.Group();
    g.position.set(0, 0, dz);
    c.group.add(g);
    return g;
  }
  function emissiveFace(tex) {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    signMats.push(m);
    return m;
  }
  function totem(g, tex, color, x, z, h = 3.6) {
    box(g, .3, h, .3, M.ink, x, 0, z);
    const face = emissiveFace(tex);
    const m = new THREE.Mesh(BOX, [color, color, color, color, face, face]);
    m.scale.set(1.5, 1.5, .3);
    m.position.set(x, h + .75, z);
    m.castShadow = true;
    g.add(m);
  }
  function groundGlow(parent, w, d, x, z, color = 0xfff2d0, strength = .6) {
    const m = new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    m.visible = false;
    const o = new THREE.Mesh(flatGeo, m);
    o.scale.set(w, 1, d);
    o.position.set(x, .07, z);
    parent.add(o);
    nightFx.push(lit => { m.opacity = strength * lit; m.visible = lit > .01; });
  }
  function person(parent, x, y, z, seated = false) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, seated ? .3 : .6, 4, 8), mat(pick([0x1ab0ba, 0x5446fc, 0x15191d, 0xffffff, 0xd6457a, 0xf2b134, 0x7c8a99])));
    body.position.set(x, y + (seated ? .37 : .52), z);
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.19, 10, 8), mat(pick([0xe8c4a0, 0xc99a74, 0x8d5a3b, 0xf1d2b6])));
    head.position.set(x, y + (seated ? .95 : 1.25), z);
    parent.add(body, head);
    return [body, head];
  }

  /* ================= 1. Müşterilere atıf yapan detaylar ================= */

  // Petrol Ofisi: kanopili akaryakıt istasyonu; arabalar sırayla gelip yakıt alır.
  {
    const g = attach("petrol-ofisi", -11);
    if (g) {
      const red = mat(0xe2231a, { roughness: .5 });
      plane(g, 12, 7.6, mat(0xcfd6d9, { roughness: 1 }), 0, .045, 0);
      for (const [x, z] of [[-3.8, -1.8], [3.8, -1.8], [-3.8, 1.8], [3.8, 1.8]]) cyl(g, .16, .16, 4, M.white, x, 0, z, 10);
      box(g, 9.8, .5, 5.4, M.white, 0, 4, 0);
      box(g, 9.9, .26, 5.5, red, 0, 4.5, 0);
      const panel = mat(0xffffff, { emissive: 0xfff4dc, emissiveIntensity: 0 });
      box(g, 9.2, .05, 4.8, panel, 0, 3.96, 0, false);
      nightFx.push(lit => { panel.emissiveIntensity = 1.6 * lit; });
      for (const x of [-2, 2]) {
        box(g, .9, .2, 1.3, M.walk, x, 0, 0);
        box(g, .55, 1.4, .8, M.white, x, .2, 0);
        box(g, .57, .35, .82, red, x, 1.25, 0);
      }
      totem(g, wordTexture("PO", { bg: "#e2231a", color: "#ffffff", h: 200, w: 200 }), red, 5.3, 2.9);
      groundGlow(g, 11, 7, 0, 0);
      const colors = [0xffffff, 0x5446fc, 0x7c8a99, 0xd6457a, 0x15191d, 0x2f8fe0];
      // İki pompa şeridi: gir (3 sn), yakıt al (6 sn), çık (3 sn), kısa ara
      const lanes = [1.5, -1.5].map((z, i) => ({ car: carMesh(g, -5.2, z, 0, pick(colors)), t: i * 7 }));
      anim.push(dt => {
        for (const L of lanes) {
          L.t = (L.t + dt) % 14;
          const p = L.t;
          L.car.visible = p < 12;
          L.car.position.x = p < 3 ? -5.2 + 5.2 * (1 - (1 - p / 3) ** 2) : p < 9 ? 0 : 5.2 * ((p - 9) / 3) ** 2;
          if (p >= 12 && !L.recolored) { L.recolored = true; L.car.children[0].material = mat(pick(colors), { roughness: .45 }); }
          if (p < 12) L.recolored = false;
        }
      });
      tagPick(g, "petrol-ofisi");
    }
  }

  // Siyah Renault Mégane sedan (kullanıcının kendi arabası): yandan profil kesitinden çıkarılmış gövde, koyu camlar,
  // krom ızgara ve elmas logo, LED farlar, stop şeridi, koyu jantlar ve plaka.
  function meganeMesh() {
    const g = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: .22, metalness: .65 });
    const tint = new THREE.MeshStandardMaterial({ color: 0x1a2128, roughness: .08, metalness: .4 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd9dde0, roughness: .15, metalness: 1 });
    const rim = new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: .3, metalness: .8 });
    const profile = pts => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return s; };
    const extrude = (shape, depth, m) => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2 });
      geo.translate(0, 0, -depth / 2);
      const o = new THREE.Mesh(geo, m); o.castShadow = true; g.add(o); return o;
    };
    extrude(profile([[-2.05, .3], [-2.15, .72], [-1.95, .92], [-1.25, .98], [-.55, 1.42], [.55, 1.45], [1.25, 1], [2.05, .82], [2.15, .55], [2.05, .3]]), 1.7, paint);
    extrude(profile([[-1.12, 1], [-.52, 1.36], [.5, 1.38], [1.1, 1.02]]), 1.78, tint);
    for (const x of [-1.32, 1.36]) for (const z of [-.86, .86]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .24, 18), M.wheel);
      w.rotation.x = Math.PI / 2; w.position.set(x, .34, z); g.add(w);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .02, 10), rim);
      r.rotation.x = Math.PI / 2; r.position.set(x, .34, z + Math.sign(z) * .13); g.add(r);
    }
    box(g, .06, .1, 1, chrome, 2.17, .58, 0, false);
    const logo = box(g, .05, .16, .16, chrome, 2.2, .66, 0, false);
    logo.rotation.x = Math.PI / 4;
    const led = new THREE.MeshStandardMaterial({ color: 0xeaf4ff, emissive: 0xdff0ff, emissiveIntensity: .3 });
    const tail = new THREE.MeshStandardMaterial({ color: 0x5a1010, emissive: 0xff2a2a, emissiveIntensity: .2 });
    nightFx.push(l => { led.emissiveIntensity = .3 + 2.4 * l; tail.emissiveIntensity = .2 + 1.8 * l; });
    for (const z of [-.6, .6]) box(g, .08, .09, .42, led, 2.1, .8, z, false);
    box(g, .06, .08, 1.5, tail, -2.17, .84, 0, false);
    // Plaka: beyaz zemin, solda mavi TR şeridi
    const cv = document.createElement("canvas");
    cv.width = 260; cv.height = 56;
    const c = cv.getContext("2d");
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, 260, 56);
    c.fillStyle = "#1f4fbf"; c.fillRect(0, 0, 26, 56);
    c.fillStyle = "#ffffff"; c.font = "700 14px sans-serif"; c.textAlign = "center"; c.fillText("TR", 13, 48);
    c.fillStyle = "#111111"; c.font = "700 36px sans-serif"; c.fillText("06 DZZ 227", 143, 41);
    const plateTex = new THREE.CanvasTexture(cv);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: .5 });
    for (const [x, y, ry] of [[2.21, .44, Math.PI / 2], [-2.21, .5, -Math.PI / 2]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(.58, .125), plateMat);
      p.position.set(x, y, 0); p.rotation.y = ry; g.add(p);
    }
    return g;
  }

  // Oyak Renault: cam galeride sarı bir Renault, dönen platformda siyah Mégane.
  {
    const g = attach("oyak-renault", -11);
    if (g) {
      const yellow = mat(0xf6c400, { roughness: .45 });
      plane(g, 12, 7.6, M.walk, 0, .045, 0);
      box(g, 7.4, .25, 5, M.white, -1.8, 0, 0);
      box(g, 7.6, .3, 5.2, M.white, -1.8, 3.3, 0);
      box(g, 7.7, .16, 5.3, yellow, -1.8, 3.6, 0);
      for (const [x, z] of [[-5.4, -2.4], [1.8, -2.4], [-5.4, 2.4], [1.8, 2.4]]) box(g, .16, 3.05, .16, M.ink, x, .25, z);
      const glass = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0xa9dde3, roughness: .1, metalness: .2, transparent: true, opacity: .32, depthWrite: false }));
      glass.scale.set(7.3, 3.05, 4.9);
      glass.position.set(-1.8, .25 + 1.525, 0);
      g.add(glass);
      carMesh(g, -1.8, 0, .25, 0xf6c400).position.y = .25;
      const lamp = mat(0xffffff, { emissive: 0xfff1d6, emissiveIntensity: 0 });
      box(g, 7, .05, 4.6, lamp, -1.8, 3.28, 0, false);
      nightFx.push(lit => { lamp.emissiveIntensity = 1.4 * lit; });
      carMesh(g, 3.6, 0, .4, 0xf6c400);
      // Sokağa bakan döner vitrin: siyah Mégane
      const front = companies.get("oyak-renault").group;
      const podium = new THREE.Group();
      podium.position.set(-2.4, 0, 5.75);
      front.add(podium);
      cyl(podium, 2.25, 2.35, .22, M.white, 0, 0, 0, 36);
      cyl(podium, 2.37, 2.37, .06, yellow, 0, .2, 0, 36);
      const turntable = new THREE.Group();
      turntable.position.y = .26;
      podium.add(turntable);
      const meg = meganeMesh();
      meg.scale.setScalar(.98);
      turntable.add(meg);
      anim.push(dt => { turntable.rotation.y += dt * .4; });
      groundGlow(podium, 6, 6, 0, 0, 0xffffff, .5);
      tagPick(podium, "oyak-renault");
      totem(g, wordTexture("RENAULT", { bg: "#f6c400", color: "#111111", h: 160, w: 480 }), yellow, -5.6, 3.2);
      groundGlow(g, 9, 6, -1.8, 0);
      tagPick(g, "oyak-renault");
    }
  }

  // Bosch: konveyör bandı başında çalışan iki robot kol.
  {
    const g = attach("bosch", -10);
    if (g) {
      const red = mat(0xea0016, { roughness: .45 });
      plane(g, 11, 6.5, mat(0xd5dadc, { roughness: 1 }), 0, .045, 0);
      for (const z of [-3, 2.9]) box(g, 10.6, .03, .16, M.amber, 0, .05, z, false);
      box(g, 9, .7, 1.1, M.ink, 0, 0, 1.4);
      box(g, 9, .05, 1, mat(0x3b4247, { roughness: .8 }), 0, .7, 1.4, false);
      const crates = [0, 1, 2].map(i => box(g, .6, .5, .6, i % 2 ? M.pallet : M.teal, -4 + i * 3, .75, 1.4));
      anim.push(dt => { for (const c of crates) { c.position.x += dt * 1.1; if (c.position.x > 4.2) c.position.x -= 8.6; } });
      function robotArm(x, z, ph) {
        const base = new THREE.Group();
        base.position.set(x, 0, z);
        g.add(base);
        cyl(base, .55, .65, .45, M.ink, 0, 0, 0, 16);
        const turret = new THREE.Group(); turret.position.y = .45; base.add(turret);
        cyl(turret, .42, .42, .4, red, 0, 0, 0, 14);
        const shoulder = new THREE.Group(); shoulder.position.y = .4; turret.add(shoulder);
        box(shoulder, .34, 2.1, .34, red, 0, 0, 0);
        const elbow = new THREE.Group(); elbow.position.y = 2.1; shoulder.add(elbow);
        box(elbow, .4, .4, .4, M.ink, 0, -.2, 0);
        box(elbow, .26, 1.7, .26, red, 0, 0, 0);
        const hand = new THREE.Group(); hand.position.y = 1.7; elbow.add(hand);
        box(hand, .5, .16, .22, M.ink, 0, 0, 0);
        for (const fx of [-.2, .2]) box(hand, .08, .3, .2, M.ink, fx, .16, 0);
        anim.push((dt, t) => {
          turret.rotation.y = Math.sin(t * .7 + ph) * 1.3;
          shoulder.rotation.z = -.35 + Math.sin(t * 1.1 + ph) * .3;
          elbow.rotation.z = 1.25 + Math.sin(t * 1.3 + ph * 1.7) * .45;
          hand.rotation.z = -.6 + Math.sin(t * 2 + ph) * .3;
        });
      }
      robotArm(-2.2, -1, 0);
      robotArm(2.4, -1, 2.1);
      tagPick(g, "bosch");
    }
  }

  // Zorlu Enerji: iki rüzgâr türbini ve güneş paneli sırası; gece türbin tepesinde kırmızı ışık yanıp söner.
  {
    const g = attach("zorlu-enerji", -10);
    if (g) {
      const accent = mat(0x00a19a, { roughness: .5 });
      const solar = mat(0x1d3557, { roughness: .25, metalness: .4 });
      const beacon = new THREE.MeshStandardMaterial({ color: 0x7a2020, emissive: 0xff3b30, emissiveIntensity: 0 });
      let lit = 0;
      nightFx.push(l => { lit = l; });
      anim.push((dt, t) => { beacon.emissiveIntensity = lit * ((t % 1.6) < .5 ? 3 : .2); });
      function turbine(x, z, ph) {
        cyl(g, .2, .38, 12, M.white, x, 0, z, 12);
        box(g, .7, .6, 1.4, M.white, x, 12, z - .1);
        box(g, .2, .14, .2, beacon, x, 12.6, z - .4, false);
        const rotor = new THREE.Group();
        rotor.position.set(x, 12.3, z + .7);
        rotor.rotation.z = ph;
        g.add(rotor);
        const hub = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), M.white);
        rotor.add(hub);
        for (let i = 0; i < 3; i++) {
          const blade = new THREE.Group();
          blade.rotation.z = i * Math.PI * 2 / 3;
          rotor.add(blade);
          box(blade, .34, 3.8, .08, M.white, 0, .1, 0);
          box(blade, .35, .5, .09, accent, 0, 3.4, 0);
        }
        anim.push(dt => { rotor.rotation.z -= dt * 1.4; });
      }
      turbine(-3.4, -2, 0);
      turbine(3.6, 1.2, 1);
      for (const x of [-3.6, -1.2, 1.2]) {
        const p = box(g, 2.2, .08, 1.3, solar, x - 1, .7, 2.6);
        p.rotation.x = -.5;
        box(g, .1, .7, .1, M.ink, x - 1, 0, 2.6);
      }
      tagPick(g, "zorlu-enerji");
    }
  }

  // İKSV: konser sahnesi; seyirci zıplar, notalar yükselir, gece spot ışıkları süpürür.
  {
    const g = attach("iksv", -12);
    if (g) {
      const truss = mat(0x9aa3a6, { roughness: .4, metalness: .5 });
      plane(g, 11, 8, mat(0x3a4146, { roughness: 1 }), 0, .045, .4);
      box(g, 9, .8, 4, M.ink, 0, 0, -.9);
      for (const x of [-4.3, 4.3]) box(g, .25, 6, .25, truss, x, .8, -2.7);
      box(g, 8.9, .3, .3, truss, 0, 6.6, -2.7);
      box(g, 8.9, .3, .3, truss, 0, 6.6, .9);
      for (const x of [-4.3, 4.3]) box(g, .25, 5.8, .25, truss, x, .8, .9);
      const screen = emissiveFace(wordTexture("İKSV", { bg: "#14161a", color: "#ffffff", sub: "♪  ♫  ♪", h: 200 }));
      const scr = new THREE.Mesh(BOX, [M.ink, M.ink, M.ink, M.ink, screen, screen]);
      scr.scale.set(6, 3.2, .2);
      scr.position.set(0, 3.6, -2.7);
      g.add(scr);
      for (const x of [-3.9, 3.9]) box(g, .9, 1.8, .8, M.ink, x, .8, .4);
      const crowd = [];
      for (let i = 0; i < 12; i++) crowd.push({ parts: person(g, rand(-3.6, 3.6), 0, rand(2, 3.6)), ph: Math.random() * 6 });
      anim.push((dt, t) => {
        for (const c of crowd) {
          const hop = Math.max(0, Math.sin(t * 5 + c.ph)) * .18;
          c.parts[0].position.y = .52 + hop;
          c.parts[1].position.y = 1.25 + hop;
        }
      });
      // Spot ışıkları (yalnız gece)
      const spotColors = [0x5446fc, 0x1ab0ba, 0xd6457a];
      const spots = spotColors.map((col, i) => {
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        m.visible = false;
        const pivot = new THREE.Group();
        pivot.position.set(-3 + i * 3, 6.5, .9);
        g.add(pivot);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 20, 1, true), m);
        cone.position.y = -3;
        pivot.add(cone);
        nightFx.push(lit => { m.opacity = .22 * lit; m.visible = lit > .05; });
        return { pivot, ph: i * 1.7 };
      });
      anim.push((dt, t) => { for (const s of spots) { s.pivot.rotation.z = Math.sin(t * .9 + s.ph) * .5; s.pivot.rotation.x = -.35 + Math.sin(t * .6 + s.ph) * .15; } });
      // Yükselen notalar
      const noteTex = ["♪", "♫"].map(ch => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 64;
        const c = cv.getContext("2d");
        c.fillStyle = "#ffffff"; c.font = "700 54px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(ch, 32, 34);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      });
      const notes = [];
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex[i % 2], color: pick([0x5446fc, 0x1ab0ba, 0xd6457a, 0xf2b134]), transparent: true, depthWrite: false }));
        s.scale.set(1.3, 1.3, 1);
        g.add(s);
        notes.push({ s, p: i / 7, x: rand(-3, 3) });
      }
      anim.push((dt, t) => {
        for (const n of notes) {
          n.p += dt * .22;
          if (n.p > 1) { n.p -= 1; n.x = rand(-3, 3); }
          n.s.position.set(n.x + Math.sin(t * 2 + n.x) * .5, 2.6 + n.p * 7, -.5);
          n.s.material.opacity = Math.sin(Math.PI * n.p);
        }
      });
      tagPick(g, "iksv");
    }
  }

  // WeWALK: akıllı bastonla kaldırımda yürüyen yaya; bastonun ucundaki sensör halkası nabız gibi atar.
  {
    const c = companies.get("wewalk");
    if (c) {
      const d = districts.find(d => d.s.id === c.lot.s.id);
      const a = Math.max(d.x0 + 1, c.lot.x - 9), b = Math.min(d.x1 - 1, c.lot.x + 9);
      const g = new THREE.Group();
      const parts = person(g, 0, 0, 0);
      parts[0].material = mat(0x1d2a44);
      box(g, .26, .06, .3, M.ink, .14, 1.22, 0, false);   // gözlük
      const canePivot = new THREE.Group();
      canePivot.position.set(.22, .85, .18);
      g.add(canePivot);
      const dx = .78, dy = -.8, len = Math.hypot(dx, dy);
      const cane = cyl(canePivot, .05, .05, len, M.white, 0, 0, 0, 6);
      cane.rotation.z = Math.atan2(-dx, dy);
      cane.position.set(dx / 2, dy / 2 - len / 2 + len / 2, 0);
      box(canePivot, .1, .2, .1, M.ink, 0, -.05, 0);
      const ring = new THREE.Mesh(new THREE.RingGeometry(.14, .2, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1ab0ba, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      ring.position.set(dx, dy + .06, 0);
      canePivot.add(ring);
      g.position.set(a + 2, .18, c.lot.side * 6);
      g.scale.setScalar(1.3);
      world.add(g);
      tagPick(g, "wewalk");
      pickables.push(g);
      let dir = 1;
      anim.push((dt, t) => {
        g.position.x += dir * .9 * dt;
        if (g.position.x > b) dir = -1; else if (g.position.x < a) dir = 1;
        g.rotation.y = dir > 0 ? 0 : Math.PI;
        g.position.y = .18 + Math.abs(Math.sin(t * 6)) * .05;
        canePivot.rotation.y = Math.sin(t * 3) * .35;
        const p = (t * .8) % 1;
        ring.scale.setScalar(1 + p * 4);
        ring.material.opacity = 1 - p;
      });
    }
  }

  // Kafeler: masalarda oturan müşteriler ve bacadan tüten buhar.
  for (const id of ["kahve-dunyasi", "goa-cafe", "frink"]) {
    const c = companies.get(id);
    if (!c) continue;
    const g = c.group, D = 7.4, H = 4.6;
    for (const tx of [-2.6, 2.6]) for (const dx of [-.85, .85]) if (Math.random() < .8) person(g, tx + dx, .45, D / 2 + 2.6, true);
    box(g, .6, 1.2, .6, M.wall2, 2.6, H + .4, -1.6);
    const puffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: 1, depthWrite: false });
    const puffs = [];
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), puffMat);
      g.add(p);
      puffs.push({ p, k: i / 5 });
    }
    anim.push(dt => {
      for (const s of puffs) {
        s.k = (s.k + dt * .25) % 1;
        const fade = s.k > .7 ? (1 - s.k) / .3 : 1;
        s.p.position.set(2.6 + s.k * 1.3, H + 1.7 + s.k * 4, -1.6);
        s.p.scale.setScalar((.5 + s.k * 1.8) * fade);
      }
    });
  }

  /* ================= 2. Özel günler ================= */

  // Türk bayrağı: kırmızı zemin, ay ve yıldız (ölçüler bayrak kanunundaki oranlara yakın)
  const trFlagTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 190;
    const c = cv.getContext("2d");
    c.fillStyle = "#e30a17"; c.fillRect(0, 0, 320, 190);
    const G = 190;
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(G * .5, 95, G * .25, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e30a17"; c.beginPath(); c.arc(G * .5625, 95, G * .2, 0, Math.PI * 2); c.fill();
    const sx = G * .5 + G * .333 + G * .0625 - G * .0625, r = G * .125;
    c.fillStyle = "#ffffff"; c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + i * Math.PI / 5, rr = i % 2 ? r * .382 : r;
      c.lineTo(sx + rr * Math.cos(a), 95 + rr * Math.sin(a));
    }
    c.closePath(); c.fill();
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  // Merkez binasının cephesine asılan büyük bayrak
  const hqFlag = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.4), new THREE.MeshStandardMaterial({ map: trFlagTex, side: THREE.DoubleSide, roughness: .8, emissive: 0xffffff, emissiveMap: trFlagTex, emissiveIntensity: 0 }));
  hqFlag.position.set(0, 13, 5.08);
  hqFlag.visible = false;
  hq.add(hqFlag);
  nightFx.push(lit => { hqFlag.material.emissiveIntensity = .35 * lit; });

  // Havai fişek: roket yükselir, renkli kıvılcımlara patlar; yalnız akşam ve gece.
  const FW = LITE ? 900 : 1800;
  const fwPos = new Float32Array(FW * 3), fwCol = new Float32Array(FW * 3), fwBase = new Float32Array(FW * 3);
  const fwVel = new Float32Array(FW * 3), fwLife = new Float32Array(FW);
  const fwGeo = new THREE.BufferGeometry();
  fwGeo.setAttribute("position", new THREE.BufferAttribute(fwPos, 3));
  fwGeo.setAttribute("color", new THREE.BufferAttribute(fwCol, 3));
  const fwPts = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, vertexColors: true, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  fwPts.frustumCulled = false;
  fwPts.visible = false;
  scene.add(fwPts);
  const rockets = [];
  let fwCursor = 0, fwNext = 1, fwAlive = 0;
  const PALETTE = { national: [0xe30a17, 0xffffff, 0xe30a17, 0xffd36b], newyear: [0x1ab0ba, 0xffd36b, 0x5446fc, 0xff5a8a, 0x9dff7a, 0xffffff] };
  function burst(x, y, z, color) {
    const col = new THREE.Color(color), n = LITE ? 45 : 75;
    for (let i = 0; i < n; i++) {
      const j = fwCursor; fwCursor = (fwCursor + 1) % FW;
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), sp = rand(9, 14);
      fwPos.set([x, y, z], j * 3);
      fwVel.set([s * Math.cos(a) * sp, u * sp, s * Math.sin(a) * sp], j * 3);
      fwBase.set([col.r, col.g, col.b], j * 3);
      fwLife[j] = rand(1.4, 2.1);
    }
  }

  // Yılbaşı: ağaçlarda yanıp sönen ışıklar ve meydanda yılbaşı ağacı
  world.updateMatrixWorld(true);
  const twinkle = [];
  const lightPos = [], lightCol = [];
  const BULBS = [0xffd36b, 0xff5a5a, 0x5ad1ff, 0x9dff7a, 0xffffff];
  const v3 = new THREE.Vector3();
  for (const cr of crowns) {
    v3.set(cr.x, cr.y + cr.sy / 2, cr.z).applyMatrix4(cr.group.matrixWorld);
    for (let j = 0; j < (LITE ? 4 : 6); j++) {
      const a = j / 6 * Math.PI * 2 + Math.random(), r = cr.sx * .95;
      lightPos.push(v3.x + Math.cos(a) * r, v3.y + rand(-.6, .6) * cr.sy, v3.z + Math.sin(a) * r);
      const c = new THREE.Color(pick(BULBS));
      lightCol.push(c.r, c.g, c.b);
      twinkle.push(c);
    }
  }
  const treeGeo = new THREE.BufferGeometry();
  treeGeo.setAttribute("position", new THREE.Float32BufferAttribute(lightPos, 3));
  treeGeo.setAttribute("color", new THREE.Float32BufferAttribute(lightCol, 3));
  const treeLights = new THREE.Points(treeGeo, new THREE.PointsMaterial({ size: 4.5, sizeAttenuation: false, vertexColors: true, map: glowTex, transparent: true, depthWrite: false }));
  treeLights.visible = false;
  scene.add(treeLights);
  let twinkleT = 0;

  const xmas = new THREE.Group();
  {
    const green = mat(0x2f8f5b, { roughness: .8, flatShading: true });
    cyl(xmas, .35, .45, 1.2, M.trunk, 0, 0, 0, 8);
    [[3.4, 4, 1.2], [2.7, 3.4, 3.6], [1.9, 2.8, 5.8]].forEach(([r, h, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), green);
      cone.position.y = y + h / 2; cone.castShadow = true; xmas.add(cone);
    });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.55), new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffc23a, emissiveIntensity: 1.5 }));
    star.position.y = 9.1; xmas.add(star);
    const baubleMats = BULBS.map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .8 }));
    for (let i = 0; i < 22; i++) {
      const y = rand(1.6, 8), r = (9 - y) / 9 * 3.2 * .92, a = Math.random() * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), pick(baubleMats));
      b.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      xmas.add(b);
    }
    anim.push((dt, t) => { star.rotation.y = t; });
  }
  xmas.position.set(plazaPos.x, .5, plazaPos.z);
  xmas.visible = false;
  world.add(xmas);

  let event = "none";
  function setEvent(kind) {
    event = kind;
    const national = kind === "national", newyear = kind === "newyear";
    flagMat.map = flagMat.emissiveMap = national ? trFlagTex : flagTex;
    hqFlag.visible = national;
    treeLights.visible = newyear;
    xmas.visible = newyear;
    for (const f of fountain) f.visible = !newyear;
  }

  /* ================= 3. Şehir hayatı ================= */

  // Gökkuşağı: sağanak bittikten sonra gündüz 45 sn görünür; ekrana sabit, şehrin üstünde yarı saydam.
  if (!camera.parent) scene.add(camera);
  const rainbow = new THREE.Group();
  const RB = [0xff4b4b, 0xff9f3a, 0xffe14d, 0x5fd16b, 0x3fa9f5, 0x5446fc, 0x9b59d0];
  const rbMats = RB.map((c, i) => {
    const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(30 - i * .9 - .9, 30 - i * .9, 96, 1, 0, Math.PI), m);
    ring.renderOrder = 999;
    rainbow.add(ring);
    return m;
  });
  rainbow.visible = false;
  camera.add(rainbow);
  let rainSeen = false, rainbowT = 0;

  // Kuş sürüsü: V düzeninde şehrin üstünde dolaşır.
  const flock = new THREE.Group();
  const birdMat = mat(0x2a3136, { roughness: .8 });
  const birds = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Group();
    box(b, .5, .16, .18, birdMat, 0, -.08, 0, false);
    const wings = [-1, 1].map(s => {
      const pivot = new THREE.Group();
      pivot.position.z = s * .09;
      b.add(pivot);
      box(pivot, .32, .04, .85, birdMat, 0, 0, s * .42, false);
      return { pivot, s };
    });
    const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
    b.position.set(-row * 1.5, rand(-.4, .4), i ? side * row * 1.1 : 0);
    b.scale.setScalar(1.4);
    flock.add(b);
    birds.push({ wings, ph: Math.random() * 6 });
  }
  world.add(flock);
  let flockA = 0;

  // Bulut gölgeleri: yere düşen yumuşak koyu lekeler rüzgârla kayar.
  const shadowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0x0e2a33, transparent: true, opacity: 0, depthWrite: false });
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const o = new THREE.Mesh(flatGeo, shadowMat);
    o.scale.set(rand(45, 80), 1, rand(28, 46));
    o.position.set(rand(X_MIN - 60, X_MAX + 60), .22, rand(-60, 40));
    world.add(o);
    clouds.push(o);
  }

  // Dron teslimat: A101 Kapıda dronları çatıdaki pistten kalkıp başka dükkânların çatısına paket bırakır.
  const drones = [];
  {
    const a = companies.get("a101");
    if (a) {
      const roofPoint = c => c.group.localToWorld(new THREE.Vector3(0, c.roof, -2.6));
      const pad = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), mat(0x1ab0ba, { roughness: .6 }));
      pad.position.set(0, a.roof + .03, -2.6);
      a.group.add(pad);
      const targets = [...companies.entries()].filter(([id]) => id !== "a101").map(([, c]) => c);
      const droneMat = mat(0xffffff, { roughness: .4 });
      const rotorMat = new THREE.MeshBasicMaterial({ color: 0x15191d, transparent: true, opacity: .55, depthWrite: false });
      for (let n = 0; n < 2; n++) {
        const g = new THREE.Group();
        box(g, .9, .25, .9, droneMat, 0, 0, 0);
        box(g, .92, .08, .92, M.teal, 0, .1, 0, false);
        const rotors = [];
        for (const [x, z] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) {
          box(g, .1, .08, .1, M.ink, x, .2, z, false);
          const r = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .02, 16), rotorMat);
          r.position.set(x, .3, z);
          g.add(r);
          rotors.push(r);
        }
        const parcel = box(g, .5, .4, .5, M.pallet, 0, -.5, 0);
        g.scale.setScalar(1.25);
        g.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "company", id: "a101" }; });
        world.add(g);
        pickables.push(g);
        const drop = box(world, .5, .4, .5, M.pallet, 0, 0, 0);
        drop.visible = false;
        const home = roofPoint(a);
        g.position.copy(home).add(new THREE.Vector3(n ? 1.2 : -1.2, .3, 0));
        drones.push({ g, rotors, parcel, drop, home: g.position.clone(), phase: "wait", t: n ? 5 : 1.5, to: null, dropT: 0 });
      }
      const CRUISE = 17, step = (cur, goal, sp, dt) => {   // sabit hızla hedefe yaklaştırır; vardıysa true
        const d = goal.clone().sub(cur), len = d.length();
        if (len <= sp * dt) { cur.copy(goal); return true; }
        cur.addScaledVector(d, sp * dt / len);
        return false;
      };
      anim.push((dt, t) => {
        for (const d of drones) {
          for (const r of d.rotors) r.rotation.y += dt * 40;
          const p = d.g.position;
          if (d.phase === "wait") {
            if ((d.t -= dt) <= 0) {
              const c = pick(targets);
              d.to = roofPoint(c).add(new THREE.Vector3(0, 2, 0));
              d.parcel.visible = true;
              d.phase = "up";
            }
          } else if (d.phase === "up") {
            if (step(p, new THREE.Vector3(p.x, CRUISE, p.z), 5, dt)) d.phase = "go";
          } else if (d.phase === "go") {
            if (step(p, new THREE.Vector3(d.to.x, CRUISE, d.to.z), 10, dt)) d.phase = "down";
          } else if (d.phase === "down") {
            if (step(p, d.to, 4, dt)) {
              d.phase = "drop"; d.t = 1.5;
              d.parcel.visible = false;
              d.drop.position.set(d.to.x, d.to.y - 2 + .02, d.to.z);
              d.drop.visible = true; d.dropT = 7;
            }
          } else if (d.phase === "drop") {
            if ((d.t -= dt) <= 0) d.phase = "climb";
          } else if (d.phase === "climb") {
            if (step(p, new THREE.Vector3(p.x, CRUISE, p.z), 5, dt)) d.phase = "back";
          } else if (d.phase === "back") {
            if (step(p, new THREE.Vector3(d.home.x, CRUISE, d.home.z), 10, dt)) d.phase = "land";
          } else if (d.phase === "land") {
            if (step(p, d.home, 4, dt)) { d.phase = "wait"; d.t = rand(4, 9); }
          }
          if (d.dropT > 0 && (d.dropT -= dt) <= 0) d.drop.visible = false;
          // Yatay giderken burnu hafif öne eğik
          const moving = d.phase === "go" || d.phase === "back";
          d.g.rotation.z += ((moving ? -.18 : 0) - d.g.rotation.z) * Math.min(1, dt * 3);
          if (moving) { const goal = d.phase === "go" ? d.to : d.home; d.g.rotation.y = Math.atan2(-(goal.z - p.z), goal.x - p.x); }
          d.g.position.y += Math.sin(t * 3 + d.home.x) * .002;
        }
      });
    }
  }

  // Dijital reklam panoları: vaka rakamları ve Loodos KPI'ları 6 sn'de bir döner.
  const ads = [];
  {
    const msgs = [
      ...data.kpis.map(kp => ({ big: kp[0], small: kp[1] })),
      ...data.companies.flatMap(c => c.projects.flatMap(p => p.metrics.map(m => ({ big: m[0], small: `${c.name} · ${m[1]}` })))),
    ];
    function drawAd(ctx, m) {
      ctx.fillStyle = "#0a0f12"; ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "#1ab0ba"; ctx.fillRect(0, 0, 10, 256);
      ctx.font = `700 26px "Red Hat Display"`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.fillText("loodos", 34, 50);
      let size = 96;
      ctx.font = `800 ${size}px "Red Hat Display"`;
      while (ctx.measureText(m.big).width > 450 && size > 40) { size -= 4; ctx.font = `800 ${size}px "Red Hat Display"`; }
      ctx.fillStyle = "#ffffff"; ctx.fillText(m.big, 34, 160);
      let s2 = 28;
      ctx.font = `600 ${s2}px "Red Hat Display"`;
      while (ctx.measureText(m.small).width > 450 && s2 > 16) { s2 -= 2; ctx.font = `600 ${s2}px "Red Hat Display"`; }
      ctx.fillStyle = "#bfeff2"; ctx.fillText(m.small, 34, 212);
    }
    const spots = parks.length
      ? parks.filter((_, i) => i % Math.max(1, Math.floor(parks.length / 4)) === 0).slice(0, 4).map(p => ({ x: p.x + 3, z: p.side * (LOT_Z + 4.6) }))
      : [{ x: hqX + 11, z: LOT_Z + 3 }];
    if (msgs.length) spots.forEach((sp, i) => {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 256;
      const ctx = cv.getContext("2d");
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .85, roughness: .5 });
      const g = new THREE.Group();
      for (const x of [-2.6, 2.6]) box(g, .3, 5, .3, M.ink, x, 0, 0);
      const scr = new THREE.Mesh(BOX, [M.ink, M.ink, M.ink, M.ink, face, face]);
      scr.scale.set(7, 3.5, .4);
      scr.position.set(0, 6.7, 0);
      scr.castShadow = true;
      g.add(scr);
      g.position.set(sp.x, 0, sp.z);
      world.add(g);
      const ad = { ctx, tex, i: (i * 5) % msgs.length, t: i * 1.5 };
      drawAd(ctx, msgs[ad.i]);
      tex.needsUpdate = true;
      ads.push(ad);
      anim.push(dt => {
        if ((ad.t += dt) < 6) return;
        ad.t = 0;
        ad.i = (ad.i + 1) % msgs.length;
        drawAd(ad.ctx, msgs[ad.i]);
        ad.tex.needsUpdate = true;
      });
    });
  }

  // Boğaz: havalimanının ötesinde deniz, karşı yakada evler; iki vapur iskeleler arasında gidip gelir.
  const SHORE = -76, FAR = -142;
  {
    const x0 = X_MIN - 160, x1 = X_MAX + 160, cx = (x0 + x1) / 2;
    box(world, x1 - x0, .35, 2.5, M.wall2, cx, 0, SHORE - 1.25, false);
    plane(world, x1 - x0, SHORE - 2.5 - FAR, mat(0x6fb8d6, { roughness: .25, metalness: .1 }), cx, .05, (SHORE - 2.5 + FAR) / 2);
    box(world, x1 - x0, .35, 2, M.wall2, cx, 0, FAR - 1, false);
    // Karşı yaka: pastel evler (tek InstancedMesh)
    const houses = [];
    for (let x = x0 + 8; x < x1 - 8; x += rand(4.6, 6.4)) houses.push({ x, z: FAR - 6 - rand(0, 4), w: rand(3.4, 4.6), d: rand(3.4, 4.6), h: rand(3, 8) });
    const hm = new THREE.InstancedMesh(BOX, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), houses.length);
    const PAST = [0xf3d9c2, 0xe8c8c8, 0xd8e4ec, 0xf6efd9, 0xd9ead7, 0xe9dcef, 0xf1f1f1];
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion();
    houses.forEach((h, i) => {
      hm.setMatrixAt(i, mtx.compose(new THREE.Vector3(h.x, h.h / 2, h.z), q, new THREE.Vector3(h.w, h.h, h.d)));
      hm.setColorAt(i, new THREE.Color(pick(PAST)));
    });
    hm.castShadow = true; hm.receiveShadow = true;
    scene.add(hm);
    // Karşı yakada taş kule
    const tw = new THREE.Group();
    cyl(tw, 2.2, 2.6, 16, mat(0xcfc2ad, { roughness: .9 }), 0, 0, 0, 20);
    cyl(tw, 2.6, 2.6, .8, M.wall2, 0, 16, 0, 20);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5, 20), mat(0x5a6670, { roughness: .7 }));
    roof.position.y = 19.3; tw.add(roof);
    tw.position.set(hqX + 60, 0, FAR - 9);
    world.add(tw);
  }
  const ferries = [];
  {
    const navy = mat(0x12305e, { roughness: .5 }), funnel = mat(0xf2c200, { roughness: .5 });
    const wakeMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: .5, depthWrite: false });
    const xs = [hqX + 28, Math.min(X_MAX - 40, hqX + LEN * .55)];
    xs.forEach((x, i) => {
      box(world, 3, .6, 6, M.wall2, x - 4, 0, SHORE - 5.5);
      box(world, 3, .6, 6, M.wall2, x - 4, 0, FAR + 3.5);
      const g = new THREE.Group();
      box(g, 3.4, 1.2, 10, M.white, 0, -.3, 0);
      box(g, 3.46, .35, 10.06, navy, 0, -.3, 0);
      box(g, 2.9, 1.2, 7.2, M.white, 0, .9, 0);
      box(g, 2.95, .45, 6.8, M.glass, 0, 1.3, 0);
      box(g, 2.2, .9, 3.6, M.white, 0, 2.1, 0);
      cyl(g, .35, .4, 1.3, funnel, 0, 3, 0, 14);
      cyl(g, .37, .37, .3, M.ink, 0, 4.3, 0, 14);
      const wake = new THREE.Mesh(flatGeo, wakeMat);
      wake.scale.set(3.6, 1, 9);
      wake.position.y = -.15;
      g.add(wake);
      g.position.set(x, 0, SHORE - 7);
      world.add(g);
      ferries.push({ g, wake, t: i * 17 });
    });
    const near = SHORE - 7, far = FAR + 7;
    anim.push((dt, t) => {
      for (const f of ferries) {
        f.t = (f.t + dt) % 40;
        const p = f.t;   // 0-6 iskelede, 6-20 karşıya, 20-26 karşıda, 26-40 dönüş
        const z = p < 6 ? near : p < 20 ? near + (far - near) * ease((p - 6) / 14) : p < 26 ? far : far + (near - far) * ease((p - 26) / 14);
        const moving = (p > 6 && p < 20) || p > 26;
        f.g.position.z = z;
        f.g.position.y = Math.sin(t * 1.5 + f.g.position.x) * .08;
        f.wake.visible = moving;
        f.wake.position.z = p < 20 ? 6 : -6;
      }
    });
  }

  /* ================= Prod yangını ve HOTFIX itfaiyesi ================= */
  // Ara sıra bir dükkânın çatısında "prod yangını" çıkar; HOTFIX itfaiyesi sirenle gelir, iki itfaiyeci
  // hortumla su sıkar, yangın söner, araç sokaktan ayrılır. Süreler simülasyon: 1 sn = 1 dk.
  const fire = { state: "idle", timer: 60, x: 0, dir: 1, speed: 0, target: null, inc: null, level: 0, seq: 3100 + Math.floor(Math.random() * 400), t0: 0, sound: 0 };
  const fireRed = mat(0xc62a2f, { roughness: .45 });
  const flashA = new THREE.MeshStandardMaterial({ color: 0xff2d2d, emissive: 0xff2d2d, emissiveIntensity: .2 });
  const flashB = new THREE.MeshStandardMaterial({ color: 0x2d6bff, emissive: 0x2d6bff, emissiveIntensity: .2 });
  const truck = new THREE.Group();
  {
    box(truck, 4.6, 2.1, 2.2, fireRed, -.6, .55, 0);
    box(truck, 1.5, 1.9, 2.2, fireRed, 2.4, .55, 0);
    box(truck, .1, .8, 1.9, M.glassDark, 3.16, 1.4, 0, false);
    box(truck, 6.2, .22, 2.24, M.white, 0, 1.15, 0, false);
    const tex = wordTexture("HOTFIX", { bg: "#c62a2f", color: "#ffffff", sub: "LOODOS · INCIDENT", h: 160, w: 640 });
    const face = emissiveFace(tex);
    const side = new THREE.Mesh(BOX, [fireRed, fireRed, fireRed, fireRed, face, face]);
    side.scale.set(3.6, .8, 2.24); side.position.set(-.8, 2.05, 0);
    truck.add(side);
    // Çatıdaki merdiven
    for (const z of [-.45, .45]) box(truck, 5.4, .12, .1, M.white, -.7, 2.75, z, false);
    for (let x = -3.2; x <= 1.8; x += .6) box(truck, .08, .1, .9, M.white, x, 2.75, 0, false);
    box(truck, .5, .26, .7, flashA, 2.4, 2.45, -.45, false);
    box(truck, .5, .26, .7, flashB, 2.4, 2.45, .45, false);
    for (const x of [2.4, -.6, -2.6]) for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .3, 14), M.wheel);
      w.rotation.x = Math.PI / 2; w.position.set(x, .45, s * 1.1); truck.add(w);
    }
    truck.traverse(o => { if (o.isMesh) o.castShadow = true; });
    truck.visible = false;
    world.add(truck);
    pickables.push(truck);
  }
  const fireWrap = document.createElement("div");
  fireWrap.className = "lbl";
  const fireTag = document.createElement("button");
  fireTag.className = "veh-tag amb";
  fireWrap.appendChild(fireTag);
  const fireLabel = new CSS2DObject(fireWrap);
  fireLabel.position.set(0, 4.2, 0);
  fireLabel.visible = false;
  truck.add(fireLabel);
  const escHtml = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function fireTagText() {
    if (!fire.inc) return;
    const st = fire.state === "enroute" ? "→ " + fire.inc.company.name : fire.state === "spray" ? tt("fire.tag.spray") : tt("fire.tag.out");
    fireTag.innerHTML = `<b>${escHtml(fire.inc.id)}</b>${escHtml(st)}`;
  }
  // Alevler ve duman: sprite havuzu, çatının üstünde yükselip söner
  const flameMats = [0xff6a1a, 0xffa21a, 0xffd23a].map(c => new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, depthWrite: false }));
  const smokeMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x4d5459, transparent: true, opacity: .55, depthWrite: false });
  const flames = [], smoke = [];
  for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(flameMats[i % 3]); s.visible = false; world.add(s); flames.push({ s, p: Math.random(), dx: 0, dz: 0 }); }
  for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(smokeMat); s.visible = false; world.add(s); smoke.push({ s, p: Math.random(), dx: 0, dz: 0 }); }
  const fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  fireGlow.visible = false;
  world.add(fireGlow);
  // İtfaiyeciler ve su
  const crew = [0, 1].map(() => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .6, 4, 8), mat(0x2b2f36, { roughness: .8 }));
    body.position.y = .55; body.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .08, 12), mat(0xf2d33a, { emissive: 0xf2d33a, emissiveIntensity: .3 }));
    band.position.y = .55;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(0xe8c4a0));
    head.position.y = 1.2;
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), fireRed);
    helmet.position.y = 1.26;
    g.add(body, band, head, helmet);
    g.visible = false;
    world.add(g);
    return g;
  });
  const WATER = LITE ? 60 : 110;
  const waterPos = new Float32Array(WATER * 2 * 3), waterK = Float32Array.from({ length: WATER * 2 }, () => Math.random());
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute("position", new THREE.BufferAttribute(waterPos, 3));
  const water = new THREE.Points(waterGeo, new THREE.PointsMaterial({ color: 0x6cc4ff, size: 5.5, sizeAttenuation: false, map: glowTex, transparent: true, depthWrite: false }));
  water.frustumCulled = false;
  water.visible = false;
  world.add(water);
  const roofPt = new THREE.Vector3(), nozzles = [new THREE.Vector3(), new THREE.Vector3()];

  function igniteFire() {
    const ids = [...companies.keys()];
    const id = pick(ids), c = companies.get(id);
    fire.seq += 3 + Math.floor(Math.random() * 30);
    fire.target = c;
    fire.inc = { id: "INC-" + fire.seq, title: pick(tt("fire.titles")), company: { id, name: data.companies.find(x => x.id === id)?.name || id } };
    c.group.updateMatrixWorld(true);
    roofPt.copy(c.group.localToWorld(new THREE.Vector3(0, c.roof, -1.5)));
    fire.dir = Math.random() < .5 ? 1 : -1;
    fire.x = fire.dir > 0 ? X_MIN - 14 : X_MAX + 14;
    fire.speed = 15;
    fire.level = 0;
    fire.t0 = 0;
    fire.state = "enroute";
    truck.position.set(fire.x, 0, 0);
    truck.rotation.y = fire.dir > 0 ? 0 : Math.PI;
    truck.visible = true;
    fireLabel.visible = true;
    truck.traverse(o => { if (o.isMesh) o.userData.pick = { kind: "company", id }; });
    for (const f of [...flames, ...smoke]) { f.dx = rand(-2, 2); f.dz = rand(-2, 2); f.s.userData.pick = { kind: "company", id }; }
    fireTagText();
    onEvent?.({ kind: "fire", company: id, text: tt("ev.fire", { id: fire.inc.id, shop: fire.inc.company.name }), sub: fire.inc.title, at: new Date() });
  }
  function stepFire(dt, t) {
    fire.sound = 0;
    if (fire.state === "idle") {
      if ((fire.timer -= dt) <= 0) { if (laneBusy()) fire.timer = 12; else igniteFire(); }
    } else {
      fire.t0 += dt;
      const L = fire.target.lot;
      let want = 15;
      if (fire.state === "enroute") {
        fire.level = Math.min(1, fire.level + dt * .4);
        const rem = (L.x - fire.x) * fire.dir;
        if (rem < 14) want = Math.max(1.5, 15 * rem / 14);
        if (rem <= .3) {
          fire.state = "spray"; fire.speed = 0; want = 0; fire.timer = 9; fireTagText();
          const curb = L.side * 4.2;
          crew[0].position.set(L.x - 1.6, .18, curb);
          crew[1].position.set(L.x + 1.6, .18, curb);
          for (const c of crew) { c.visible = true; c.rotation.y = L.side > 0 ? -Math.PI / 2 : Math.PI / 2; }
        }
      } else if (fire.state === "spray") {
        want = 0;
        fire.level = Math.max(0, fire.level - dt / 7);
        if ((fire.timer -= dt) <= 0) {
          fire.state = "leaving"; fire.level = 0; fireTagText();
          for (const c of crew) c.visible = false;
          onEvent?.({ kind: "fire", company: fire.inc.company.id, text: tt("ev.fireOut", { id: fire.inc.id, shop: fire.inc.company.name, m: Math.round(fire.t0) }), sub: fire.inc.title, at: new Date() });
        }
      }
      fire.speed += (want - fire.speed) * Math.min(1, dt * 3);
      fire.x += fire.dir * fire.speed * dt;
      truck.position.x = fire.x;
      const flip = Math.floor(t * 6) % 2;
      flashA.emissiveIntensity = flip ? 3.2 : .15;
      flashB.emissiveIntensity = flip ? .15 : 3.2;
      if (fire.state !== "spray") {
        const half = VIEW * el.clientWidth / el.clientHeight / 2 / camera.zoom;
        fire.sound = Math.min(1, Math.max(0, 1.2 - Math.abs(fire.x - controls.target.x) / half));
      }
      if (fire.state === "leaving" && (fire.x > X_MAX + 16 || fire.x < X_MIN - 16)) {
        fire.state = "idle"; fire.timer = rand(80, 140);
        truck.visible = false; fireLabel.visible = false;
      }
    }
    // Alev ve duman
    const lv = fire.level, burning = lv > .01;
    for (const f of flames) {
      f.s.visible = burning;
      if (!burning) continue;
      f.p += dt * (1.2 + (f.dx + 2) * .1);
      if (f.p > 1) { f.p -= 1; f.dx = rand(-2, 2) * lv; f.dz = rand(-2, 2) * lv; }
      const size = (1.6 + (1 - f.p) * 1.8) * lv;
      f.s.position.set(roofPt.x + f.dx * (1 - f.p * .5), roofPt.y + .3 + f.p * 3.2 * lv, roofPt.z + f.dz * (1 - f.p * .5));
      f.s.scale.set(size, size * 1.3, 1);
      f.s.material.opacity = .9;
    }
    const smoky = burning || (fire.state === "spray") || (fire.state === "leaving" && fire.t0 < 999 && smoke[0].s.visible);
    for (const sm of smoke) {
      sm.s.visible = smoky && (burning || sm.p < .98);
      if (!sm.s.visible) continue;
      sm.p += dt * .22;
      if (sm.p > 1) { if (!burning) { sm.s.visible = false; continue; } sm.p -= 1; sm.dx = rand(-1.5, 1.5); }
      const size = 2 + sm.p * 6;
      sm.s.position.set(roofPt.x + sm.dx + sm.p * 3, roofPt.y + 2.5 + sm.p * 12, roofPt.z + sm.dz);
      sm.s.scale.set(size, size, 1);
    }
    smokeMat.opacity = .5 * Math.max(lv, fire.state === "spray" ? .6 : 0);
    fireGlow.visible = burning && lit > .1;
    if (fireGlow.visible) { fireGlow.position.copy(roofPt).y += 1.5; fireGlow.scale.setScalar(14 * lv); fireGlow.material.opacity = .8 * lit * lv; }
    // Su: iki itfaiyecinin elinden çatıya kavisli huzme
    water.visible = fire.state === "spray";
    if (water.visible) {
      crew.forEach((c, i) => nozzles[i].set(c.position.x, 1.1, c.position.z));
      for (let i = 0; i < WATER * 2; i++) {
        const n = nozzles[i < WATER ? 0 : 1];
        waterK[i] = (waterK[i] + dt * 1.4) % 1;
        const s = waterK[i];
        waterPos[i * 3] = n.x + (roofPt.x - n.x) * s + Math.sin(i) * .15;
        waterPos[i * 3 + 1] = n.y + (roofPt.y + 1 - n.y) * s + Math.sin(Math.PI * s) * 4;
        waterPos[i * 3 + 2] = n.z + (roofPt.z - n.z) * s + Math.cos(i) * .15;
      }
      waterGeo.attributes.position.needsUpdate = true;
    }
  }

  /* ================= Kare ve gece ================= */
  let lit = 0;
  function applyNight(l) {
    lit = l;
    for (const fn of nightFx) fn(l);
    // Gündüz eklemeli karışım beyaz zeminde görünmez; ışıklar gündüz normal, gece parlayan karışımla çizilir
    const blend = l > .3 ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (treeLights.material.blending !== blend) { treeLights.material.blending = blend; treeLights.material.needsUpdate = true; }
  }
  const tmp = new THREE.Color();
  function step(dt, t, { night, wx }) {
    for (const fn of anim) fn(dt, t);
    stepFire(dt, t);

    // Havai fişek (bayram ve yılbaşı, alacakaranlıktan itibaren)
    const fwOn = (event === "national" || event === "newyear") && lit > .3;
    if (fwOn && (fwNext -= dt) <= 0) {
      fwNext = rand(.6, 1.6);
      const half = VIEW * el.clientWidth / el.clientHeight / 2 / camera.zoom;
      // Patlama yüksekliği görünen alana göre: yakın planda da ekranın içinde kalır
      const halfH = VIEW / 2 / camera.zoom;
      rockets.push({ x: controls.target.x + rand(-half, half) * .8, y: 0, z: controls.target.z + rand(-10, 10), top: THREE.MathUtils.clamp(halfH * rand(.45, .85), 9, 42), color: pick(PALETTE[event]) });
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += 30 * dt;
      if (r.y >= r.top) { burst(r.x, r.y, r.z, r.color); rockets.splice(i, 1); continue; }
      const j = fwCursor; fwCursor = (fwCursor + 1) % FW;   // roketin izi: kısa ömürlü sarı nokta
      fwPos.set([r.x + rand(-.1, .1), r.y, r.z], j * 3);
      fwVel.set([0, -2, 0], j * 3);
      fwBase.set([1, .85, .5], j * 3);
      fwLife[j] = .35;
    }
    fwAlive = 0;
    for (let i = 0; i < FW; i++) {
      if (fwLife[i] <= 0) continue;
      fwLife[i] -= dt;
      const j = i * 3;
      if (fwLife[i] <= 0) { fwCol[j] = fwCol[j + 1] = fwCol[j + 2] = 0; fwPos[j + 1] = -999; continue; }
      fwAlive++;
      fwVel[j + 1] -= 6 * dt;
      const drag = 1 - dt * .9;
      fwVel[j] *= drag; fwVel[j + 1] *= drag; fwVel[j + 2] *= drag;
      fwPos[j] += fwVel[j] * dt; fwPos[j + 1] += fwVel[j + 1] * dt; fwPos[j + 2] += fwVel[j + 2] * dt;
      const f = Math.min(1, fwLife[i] / .8);
      fwCol[j] = fwBase[j] * f; fwCol[j + 1] = fwBase[j + 1] * f; fwCol[j + 2] = fwBase[j + 2] * f;
    }
    fwPts.visible = fwAlive > 0;
    if (fwAlive) { fwGeo.attributes.position.needsUpdate = true; fwGeo.attributes.color.needsUpdate = true; }

    // Yılbaşı ışıkları göz kırpar
    if (treeLights.visible && (twinkleT -= dt) <= 0) {
      twinkleT = .25;
      const col = treeGeo.attributes.color.array;
      for (let i = 0; i < twinkle.length; i++) {
        if (Math.random() > .25) continue;
        tmp.copy(twinkle[i]).multiplyScalar(Math.random() < .5 ? .25 : 1);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      treeGeo.attributes.color.needsUpdate = true;
    }

    // Gökkuşağı: yağmur durduktan sonra, gündüz
    if (wx.rain > .6) rainSeen = true;
    if (rainSeen && wx.rainT === 0 && wx.rain < .05) { rainSeen = false; rainbowT = 45; }
    if (rainbowT > 0) {
      rainbowT -= dt;
      const fade = Math.min(1, (45 - rainbowT) / 4, rainbowT / 6) * (1 - night);
      rainbow.visible = fade > .01;
      for (const m of rbMats) m.opacity = .3 * fade;
      const halfH = VIEW / 2 / camera.zoom;
      rainbow.position.set(0, -halfH * .55, -350);
      rainbow.scale.setScalar(1 / camera.zoom);
    } else rainbow.visible = false;

    // Kuşlar (gece yuvada, yağışta uçmaz)
    flock.visible = night < .6 && wx.cloud < .5;
    if (flock.visible) {
      flockA += dt * .045;
      const rx = LEN / 2 + 20, rz = 55;
      const x = rx * Math.cos(flockA), z = rz * Math.sin(flockA) - 5;
      flock.position.set(x, 26 + Math.sin(flockA * 3) * 2, z);
      flock.rotation.y = Math.atan2(-(rz * Math.cos(flockA)), -rx * Math.sin(flockA));
      birds.forEach((b, i) => { const s = Math.sin(t * 9 + b.ph) * .7; for (const w of b.wings) w.pivot.rotation.x = -w.s * s; });
    }

    // Bulut gölgeleri gündüz ve açık havada belirgin
    shadowMat.opacity = .12 * (1 - night) * (1 - wx.cloud * .85);
    for (const c of clouds) {
      c.position.x += dt * 2.5;
      if (c.position.x > X_MAX + 90) { c.position.x = X_MIN - 90; c.position.z = rand(-60, 40); }
    }
  }

  return { step, applyNight, setEvent, seaZ: FAR, busy: () => fire.state !== "idle", siren: () => fire.sound };
}
