// 3D models for Hold the Rift, built from simple shapes in code (original art, no outside assets).
// Ported from mockups/hold-the-rift.html. Exposed as RF.G (geometry helpers and model builders).
window.RF = window.RF || {};
(function (RF) {
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);

const mat = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0.05, flatShading: true }, o || {}));
const glow = (color, k) => mat(color, { emissive: color, emissiveIntensity: k || 1.6, roughness: 0.4 });
function mesh(geo, m, x, y, z, parent) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x || 0, y || 0, z || 0);
  o.castShadow = true; o.receiveShadow = true;
  if (parent) parent.add(o);
  return o;
}
function group(x, y, z, parent) { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }

// Soft glow sprite texture (for magic light, particles, rift).
function glowTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}
const TEX = {
  purple: glowTex('rgba(255,230,255,1)', 'rgba(190,80,255,0.55)'),
  cyan: glowTex('rgba(230,255,255,1)', 'rgba(80,230,255,0.5)'),
  orange: glowTex('rgba(255,250,220,1)', 'rgba(255,140,40,0.55)'),
  yellow: glowTex('rgba(255,255,240,1)', 'rgba(255,230,80,0.6)'),
  ice: glowTex('rgba(240,255,255,1)', 'rgba(140,210,255,0.45)')
};
function sprite(tex, size, x, y, z, parent, opacity) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacity || 1 }));
  s.scale.set(size, size, 1); s.position.set(x, y, z); if (parent) parent.add(s); return s;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
const M = {
  bark: mat(0x5b3a22), barkDark: mat(0x3e2716), leaf1: mat(0x2f7d3a), leaf2: mat(0x3f9a45), leaf3: mat(0x25603a),
  stone: mat(0x8a8f9c), stoneDark: mat(0x5d6170), wood: mat(0x9a6a3c), woodDark: mat(0x6e4826), roof: mat(0x3a4d9a),
  cloth: mat(0xd9c9a3), red: mat(0xb8383f), metal: mat(0x9aa3b5, { metalness: 0.6, roughness: 0.35 }),
  thornBody: mat(0x3f7a35), thornDark: mat(0x22401f), thornSpike: mat(0xe0c983), rift: glow(0xc04dff, 2.2), riftCore: glow(0xff9cff, 3),
  eye: glow(0xff4dd2, 3), ice: glow(0x8fe3ff, 1.2), iceSolid: mat(0xbfefff, { roughness: 0.2, metalness: 0.1, emissive: 0x3aa8d8, emissiveIntensity: 0.5 }),
  ember: glow(0xff8a2a, 2.5), bolt: glow(0xfff27a, 3), anchor: glow(0x5ff0ff, 1.8), vine: mat(0x4caf50, { emissive: 0x1d5f22, emissiveIntensity: 0.6 }),
  gold: mat(0xe9b949, { metalness: 0.7, roughness: 0.3 }), crystalP: mat(0x2a1440, { emissive: 0x7a2ac0, emissiveIntensity: 0.7, roughness: 0.3 })
};

function tree(x, z, parent, s, tainted) {
  s = s || 1;
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 1.2 * s, 6), M.bark, 0, 0.6 * s, 0, g);
  const leaves = tainted ? [mat(0x3b2d52), mat(0x4a3666), mat(0x2d2342)] : [M.leaf1, M.leaf2, M.leaf3];
  const lv = Math.floor(R(0, 3));
  for (let i = 0; i < 3; i++) {
    const c = mesh(new THREE.ConeGeometry((1.25 - i * 0.3) * s, 1.5 * s, 7), leaves[(lv + i) % 3], 0, (1.5 + i * 0.75) * s, 0, g);
    c.rotation.y = R(0, 3);
  }
  if (tainted && rnd() < 0.6) sprite(TEX.purple, 1.2 * s, 0, 2.2 * s, 0, g, 0.5);
  g.rotation.y = R(0, 6);
  return g;
}
function roundTree(x, z, parent, s) {
  s = s || 1;
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 1.4 * s, 6), M.bark, 0, 0.7 * s, 0, g);
  mesh(new THREE.DodecahedronGeometry(1.0 * s, 0), [M.leaf2, M.leaf1][Math.floor(R(0, 2))], 0, 1.9 * s, 0, g);
  mesh(new THREE.DodecahedronGeometry(0.7 * s, 0), M.leaf2, 0.5 * s, 2.4 * s, 0.2 * s, g);
  return g;
}
function rock(x, z, parent, s, y) {
  const r = mesh(new THREE.DodecahedronGeometry(s || 0.6, 0), rnd() < 0.5 ? M.stone : M.stoneDark, x, (y || 0) + (s || 0.6) * 0.45, z, parent);
  r.rotation.set(R(0, 3), R(0, 3), R(0, 3)); r.scale.y = 0.7; return r;
}

// ---- Defenders ----
function archerTower(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(0.95, 1.15, 1.6, 8), M.stone, 0, 0.8, 0, g);
  mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.2, 8), M.stoneDark, 0, 1.65, 0, g);
  for (let i = 0; i < 4; i++) { const p = mesh(new THREE.BoxGeometry(0.15, 1.3, 0.15), M.woodDark, Math.cos(i * 1.57 + 0.78) * 0.75, 2.4, Math.sin(i * 1.57 + 0.78) * 0.75, g); }
  mesh(new THREE.BoxGeometry(1.7, 0.25, 1.7), M.wood, 0, 1.85, 0, g);
  mesh(new THREE.ConeGeometry(1.35, 1.1, 4), M.roof, 0, 3.55, 0, g).rotation.y = Math.PI / 4;
  // archer
  mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.6, 6), mat(0x2f6b3d), 0.2, 2.3, 0.1, g);
  mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xe0b48a), 0.2, 2.7, 0.1, g);
  const bow = mesh(new THREE.TorusGeometry(0.3, 0.03, 4, 10, Math.PI), M.woodDark, 0.45, 2.45, 0.2, g); bow.rotation.z = -Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), M.red, 0, 4.35, 0, g).position.x = 0.25;
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), M.woodDark, 0, 4.2, 0, g);
  return g;
}
function frostTotem(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 7), M.stoneDark, 0, 0.2, 0, g);
  mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.8, 6), M.stone, 0, 1.3, 0, g);
  const c = mesh(new THREE.OctahedronGeometry(0.6, 0), M.iceSolid, 0, 2.8, 0, g); c.scale.y = 1.6;
  for (let i = 0; i < 4; i++) { const s = mesh(new THREE.OctahedronGeometry(0.22, 0), M.ice, Math.cos(i * 1.57) * 0.75, 2.4, Math.sin(i * 1.57) * 0.75, g); s.scale.y = 1.8; }
  sprite(TEX.ice, 3.2, 0, 2.8, 0, g, 0.8);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.8, 48), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.55 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.6, 48), new THREE.MeshBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.12, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.05; g.add(disc);
  return g;
}
function lightningSpire(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.5, 6), M.stoneDark, 0, 0.25, 0, g);
  mesh(new THREE.CylinderGeometry(0.12, 0.5, 3.4, 6), M.metal, 0, 2.2, 0, g);
  for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.42 - i * 0.08, 0.05, 4, 12), M.gold, 0, 1.4 + i * 0.7, 0, g); r.rotation.x = Math.PI / 2; }
  mesh(new THREE.SphereGeometry(0.38, 12, 8), M.bolt, 0, 4.1, 0, g);
  sprite(TEX.yellow, 2.6, 0, 4.1, 0, g, 1);
  const l = new THREE.PointLight(0xfff27a, 1.6, 9); l.position.set(0, 4.1, 0); g.add(l);
  return g;
}
function emberCannon(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.9, 8), M.stone, 0, 0.45, 0, g);
  const yoke = group(0, 1.1, 0, g);
  mesh(new THREE.BoxGeometry(0.9, 0.5, 1.1), M.woodDark, 0, 0, 0, yoke);
  const barrel = mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.8, 10), mat(0x34363f, { metalness: 0.5, roughness: 0.4 }), 0, 0.35, -0.3, yoke);
  barrel.rotation.x = -1.15;
  mesh(new THREE.TorusGeometry(0.36, 0.07, 6, 12), M.gold, 0, 0.75, -1.05, yoke).rotation.x = -1.15 + Math.PI / 2;
  sprite(TEX.orange, 1.2, 0, 0.75, -1.1, yoke, 0.9);
  yoke.rotation.y = 0.9;
  return g;
}
function golem(x, z, parent, s) {
  s = s || 1;
  const g = group(x, 0, z, parent); g.scale.setScalar(s);
  const body = mat(0x7d8496); const moss = mat(0x4e8a3c);
  mesh(new THREE.BoxGeometry(0.55, 0.9, 0.55), body, -0.35, 0.45, 0, g);
  mesh(new THREE.BoxGeometry(0.55, 0.9, 0.55), body, 0.35, 0.45, 0, g);
  const torso = mesh(new THREE.DodecahedronGeometry(0.95, 0), body, 0, 1.7, 0, g); torso.scale.set(1.15, 1, 0.85);
  mesh(new THREE.DodecahedronGeometry(0.4, 0), moss, 0.3, 2.45, 0.1, g);
  mesh(new THREE.BoxGeometry(0.6, 0.5, 0.55), body, 0, 2.7, 0.1, g);
  mesh(new THREE.BoxGeometry(0.12, 0.07, 0.05), M.anchor, -0.14, 2.75, -0.19, g);
  mesh(new THREE.BoxGeometry(0.12, 0.07, 0.05), M.anchor, 0.14, 2.75, -0.19, g);
  const a1 = mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), body, -1.05, 1.55, -0.2, g); a1.rotation.z = 0.25; a1.rotation.x = -0.5;
  const a2 = mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), body, 1.05, 1.55, -0.2, g); a2.rotation.z = -0.25; a2.rotation.x = -0.7;
  mesh(new THREE.DodecahedronGeometry(0.38, 0), body, -1.2, 0.85, -0.55, g);
  mesh(new THREE.DodecahedronGeometry(0.38, 0), body, 1.25, 0.8, -0.65, g);
  // rune glowing on chest
  mesh(new THREE.BoxGeometry(0.4, 0.08, 0.05), M.anchor, 0, 1.9, -0.8, g);
  mesh(new THREE.BoxGeometry(0.08, 0.4, 0.05), M.anchor, 0, 1.9, -0.8, g);
  return g;
}
function spikePit(x, z, parent) {
  const g = group(x, 0, z, parent);
  const base = mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.12, 10), M.woodDark, 0, 0.06, 0, g);
  for (let i = 0; i < 14; i++) {
    const a = R(0, 6.28), r = R(0, 1.2);
    const s = mesh(new THREE.ConeGeometry(0.12, R(0.5, 0.9), 5), M.metal, Math.cos(a) * r, 0.35, Math.sin(a) * r, g);
    s.rotation.set(R(-0.3, 0.3), 0, R(-0.3, 0.3));
  }
  return g;
}
function vineSnare(x, z, parent) {
  const g = group(x, 0, z, parent);
  for (let i = 0; i < 5; i++) {
    const v = mesh(new THREE.TorusGeometry(0.8 + i * 0.05, 0.08, 5, 16, Math.PI * 1.3), M.vine, 0, 0.3 + i * 0.28, 0, g);
    v.rotation.set(Math.PI / 2 + R(-0.4, 0.4), R(0, 6), R(-0.3, 0.3));
  }
  for (let i = 0; i < 6; i++) { const l = mesh(new THREE.ConeGeometry(0.12, 0.35, 4), M.leaf2, Math.cos(i) * 0.9, R(0.4, 1.6), Math.sin(i) * 0.9, g); }
  return g;
}
function ballista(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.BoxGeometry(1.8, 0.6, 1.8), M.woodDark, 0, 0.3, 0, g);
  const top = group(0, 0.9, 0, g);
  mesh(new THREE.BoxGeometry(0.3, 0.3, 2.4), M.wood, 0, 0, 0, top);
  const arm = mesh(new THREE.TorusGeometry(1.1, 0.08, 4, 12, Math.PI), M.woodDark, 0, 0.1, -0.6, top);
  arm.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 5), M.metal, 0, 0.25, -0.1, top).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(0.12, 0.35, 5), M.metal, 0, 0.25, -1.2, top).rotation.x = -Math.PI / 2;
  top.rotation.x = -0.45; top.rotation.y = -0.6;
  return g;
}
function healShrine(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.3, 8), M.stone, 0, 0.15, 0, g);
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.3, 1.6, 0.3), M.stone, Math.cos(i * 1.57) * 0.75, 1.0, Math.sin(i * 1.57) * 0.75, g);
  mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 8), M.stoneDark, 0, 1.9, 0, g);
  mesh(new THREE.IcosahedronGeometry(0.35, 0), glow(0x7dff9c, 2), 0, 1.0, 0, g);
  sprite(glowTex('rgba(240,255,240,1)', 'rgba(110,255,140,0.5)'), 2.4, 0, 1.0, 0, g, 0.9);
  return g;
}
function barricade(x, z, parent, rot) {
  const g = group(x, 0, z, parent); g.rotation.y = rot || 0;
  for (let i = -2; i <= 2; i++) { const s = mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.5, 6), M.wood, i * 0.38, 0.75, 0, g); }
  for (let i = -1; i <= 1; i += 2) { const c = mesh(new THREE.BoxGeometry(2.1, 0.14, 0.14), M.woodDark, 0, 0.75 + i * 0.35, -0.16, g); c.rotation.z = i * 0.2; }
  for (let i = -2; i <= 2; i++) mesh(new THREE.ConeGeometry(0.16, 0.3, 6), M.wood, i * 0.38, 1.65, 0, g);
  return g;
}

// ---- Rift creatures ----
function thornback(x, z, parent, s, rot) {
  s = s || 1;
  const g = group(x, 0, z, parent); g.scale.setScalar(s); g.rotation.y = rot || 0;
  const b = mesh(new THREE.DodecahedronGeometry(0.85, 0), M.thornBody, 0, 0.95, 0, g); b.scale.set(1.35, 0.8, 0.9);
  mesh(new THREE.DodecahedronGeometry(0.45, 0), M.thornDark, 0, 0.85, -1.0, g);
  mesh(new THREE.SphereGeometry(0.09, 6, 4), M.eye, -0.18, 0.95, -1.38, g);
  mesh(new THREE.SphereGeometry(0.09, 6, 4), M.eye, 0.18, 0.95, -1.38, g);
  mesh(new THREE.ConeGeometry(0.06, 0.3, 4), M.thornSpike, -0.25, 0.6, -1.35, g).rotation.x = Math.PI;
  mesh(new THREE.ConeGeometry(0.06, 0.3, 4), M.thornSpike, 0.25, 0.6, -1.35, g).rotation.x = Math.PI;
  for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.ConeGeometry(0.13, 0.6, 4), M.thornSpike, R(-0.5, 0.5), 1.55, -0.6 + i * 0.25, g); sp.rotation.set(R(-0.4, 0.4), 0, R(-0.4, 0.4)); }
  mesh(new THREE.BoxGeometry(0.08, 0.06, 1.1), M.rift, 0.12, 1.42, 0.1, g).rotation.y = 0.3;
  for (const [lx, lz] of [[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.45], [0.5, 0.45]]) mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), M.thornDark, lx, 0.3, lz, g);
  return g;
}
function wisp(x, y, z, parent) {
  const g = group(x, y, z, parent);
  mesh(new THREE.IcosahedronGeometry(0.28, 0), glow(0xd36bff, 2.5), 0, 0, 0, g);
  sprite(TEX.purple, 1.8, 0, 0, 0, g, 0.9);
  for (let i = 1; i <= 4; i++) sprite(TEX.purple, 1.2 - i * 0.2, i * 0.35, -i * 0.05, i * 0.25, g, 0.5 - i * 0.1);
  return g;
}
function riftBat(x, y, z, parent, rot) {
  const g = group(x, y, z, parent); g.rotation.y = rot || 0;
  mesh(new THREE.DodecahedronGeometry(0.35, 0), mat(0x2a1f3d), 0, 0, 0, g);
  const wmat = mat(0x3d2c5c, { side: THREE.DoubleSide });
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.4, 0.4); shape.lineTo(1.1, -0.1); shape.lineTo(0.8, 0.05); shape.lineTo(0.5, -0.25); shape.lineTo(0, -0.1);
  const wg = new THREE.ShapeGeometry(shape);
  const w1 = mesh(wg, wmat, 0.2, 0.05, 0, g); w1.rotation.x = -Math.PI / 2 + 0.4;
  const w2 = mesh(wg, wmat, -0.2, 0.05, 0, g); w2.rotation.x = -Math.PI / 2 + 0.4; w2.scale.x = -1;
  mesh(new THREE.SphereGeometry(0.06, 6, 4), M.eye, -0.12, 0.08, -0.32, g);
  mesh(new THREE.SphereGeometry(0.06, 6, 4), M.eye, 0.12, 0.08, -0.32, g);
  return g;
}
function shieldBrute(x, z, parent, rot) {
  const g = group(x, 0, z, parent); g.rotation.y = rot || 0;
  const body = mat(0x463a5e);
  mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), body, -0.3, 0.4, 0, g);
  mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), body, 0.3, 0.4, 0, g);
  mesh(new THREE.DodecahedronGeometry(0.75, 0), body, 0, 1.45, 0, g);
  mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), body, 0, 2.25, -0.1, g);
  mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), M.eye, -0.12, 2.3, -0.36, g);
  mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), M.eye, 0.12, 2.3, -0.36, g);
  const sh = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 6), M.crystalP, -0.4, 1.4, -0.75, g); sh.rotation.x = Math.PI / 2;
  sprite(TEX.purple, 1.4, -0.4, 1.4, -0.85, g, 0.4);
  return g;
}
function hero(x, z, parent) {
  const g = group(x, 0, z, parent);
  mesh(new THREE.ConeGeometry(0.55, 1.6, 8), mat(0x1f6f8b), 0, 0.8, 0, g);
  const cape = mesh(new THREE.ConeGeometry(0.62, 1.4, 8, 1, true, Math.PI * 0.2, Math.PI * 1.2), mat(0xb8383f, { side: THREE.DoubleSide }), 0, 0.85, 0.05, g);
  mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0xc98d63), 0, 1.85, 0, g);
  mesh(new THREE.ConeGeometry(0.33, 0.45, 8), mat(0x173f5a), 0, 2.15, 0.03, g);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5), M.woodDark, 0.55, 1.2, -0.1, g);
  mesh(new THREE.OctahedronGeometry(0.2, 0), M.anchor, 0.55, 2.45, -0.1, g);
  sprite(TEX.cyan, 1.5, 0.55, 2.45, -0.1, g);
  const aura = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 32), new THREE.MeshBasicMaterial({ color: 0x7ef3ff, transparent: true, opacity: 0.8 }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.05; g.add(aura);
  return g;
}

// ---- Camp and rift ----
function camp(x, z, parent) {
  const g = group(x, 0, z, parent);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    if (a > 2.6 && a < 3.4) continue; // gate facing the path
    const p = mesh(new THREE.CylinderGeometry(0.2, 0.22, R(1.4, 1.8), 6), M.wood, Math.cos(a) * 4.2, 0.8, Math.sin(a) * 4.2, g);
    mesh(new THREE.ConeGeometry(0.2, 0.35, 6), M.wood, Math.cos(a) * 4.2, 1.75, Math.sin(a) * 4.2, g);
  }
  const tent = (tx, tz, c) => { const t = mesh(new THREE.ConeGeometry(1.1, 1.6, 4), mat(c), tx, 0.8, tz, g); t.rotation.y = R(0, 2); };
  tent(-1.8, 1.6, 0xd9c9a3); tent(1.9, 1.4, 0xb8383f); tent(1.6, -1.9, 0xd9c9a3);
  // fire
  for (let i = 0; i < 6; i++) { const l = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 5), M.woodDark, -1.6 + Math.cos(i) * 0.15, 0.12, -1.4 + Math.sin(i) * 0.15, g); l.rotation.set(Math.PI / 2, i, 0); }
  mesh(new THREE.ConeGeometry(0.28, 0.6, 6), M.ember, -1.6, 0.4, -1.4, g);
  sprite(TEX.orange, 2.4, -1.6, 0.6, -1.4, g);
  const fl = new THREE.PointLight(0xff9a3c, 2.2, 10); fl.position.set(-1.6, 1.2, -1.4); g.add(fl);
  // Rift Anchor: the crystal you defend
  mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.5, 6), M.stone, 0, 0.25, 0, g);
  const c = mesh(new THREE.OctahedronGeometry(0.85, 0), M.anchor, 0, 2.0, 0, g); c.scale.y = 1.9;
  for (let i = 0; i < 5; i++) { const s = mesh(new THREE.OctahedronGeometry(0.25, 0), M.anchor, Math.cos(i * 1.26) * 1.0, 0.7, Math.sin(i * 1.26) * 1.0, g); s.scale.y = 2; }
  sprite(TEX.cyan, 5.5, 0, 2.1, 0, g, 0.9);
  const cl = new THREE.PointLight(0x5ff0ff, 2.6, 14); cl.position.set(0, 2.6, 0); g.add(cl);
  // banner
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 5), M.woodDark, 2.8, 1.7, -2.8, g);
  const flag = mesh(new THREE.PlaneGeometry(1.1, 0.7), mat(0x2a3a9a, { side: THREE.DoubleSide }), 3.35, 3.0, -2.8, g);
  return g;
}
function riftGate(x, z, parent) {
  const g = group(x, 0, z, parent);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = R(2.3, 3.0);
    const c = mesh(new THREE.ConeGeometry(R(0.25, 0.5), R(1.5, 3.5), 5), M.crystalP, Math.cos(a) * r, 0.8, Math.sin(a) * r * 0.6, g);
    c.rotation.set(R(-0.4, 0.4), 0, Math.cos(a) * 0.4);
  }
  // the tear itself: a tall glowing jagged sheet
  const shape = new THREE.Shape();
  const pts = [[0, 0], [0.6, 1.2], [0.3, 2.2], [0.9, 3.4], [0.4, 4.6], [0, 5.4], [-0.5, 4.4], [-0.2, 3.3], [-0.8, 2.1], [-0.3, 1.1]];
  shape.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => shape.lineTo(p[0] * 1.8, p[1]));
  const tear = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xffb3ff, side: THREE.DoubleSide }));
  tear.position.set(0, 0.2, 0); g.add(tear);
  sprite(TEX.purple, 11, 0, 2.8, 0.2, g, 1);
  sprite(TEX.purple, 6, 0, 2.8, 0.4, g, 1);
  const l = new THREE.PointLight(0xc04dff, 4, 22); l.position.set(0, 3, 1.5); g.add(l);
  for (let i = 0; i < 40; i++) sprite(TEX.purple, R(0.2, 0.6), R(-3.5, 3.5), R(0.3, 6), R(-1.5, 2.5), g, R(0.4, 1));
  return g;
}

// ---- Effects ----
function boltLine(a, b, parent, color) {
  const pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t);
    if (i > 0 && i < n) p.add(new THREE.Vector3(R(-0.4, 0.4), R(-0.4, 0.4), R(-0.4, 0.4)));
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.07, 4), new THREE.MeshBasicMaterial({ color: color || 0xfff7b0 }));
  parent.add(tube);
  for (let i = 0; i < 6; i++) { const p = curve.getPoint(i / 5); sprite(TEX.yellow, 1.2, p.x, p.y, p.z, parent, 0.7); }
}
function arrow(x, y, z, parent, ry, rx) {
  const g = group(x, y, z, parent); g.rotation.set(rx || 0, ry || 0, 0);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), M.wood, 0, 0, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(0.07, 0.18, 4), M.metal, 0, 0, -0.5, g).rotation.x = -Math.PI / 2;
  sprite(TEX.yellow, 0.5, 0, 0, 0.45, g, 0.5);
  return g;
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------
function noise(x, z) {
  return Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17 + 0.7) * 0.9 + Math.sin(x * 0.53 + z * 0.41) * 0.35 + Math.cos(x * 0.11 - z * 0.23) * 0.6;
}
function terrain(w, d, seg, heightFn, colorFn, parent) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.round(seg * d / w));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = heightFn(x, z);
    pos.setY(i, y);
  }
  const g2 = geo.toNonIndexed();
  const p2 = g2.attributes.position;
  for (let i = 0; i < p2.count; i += 3) {
    const cx = (p2.getX(i) + p2.getX(i + 1) + p2.getX(i + 2)) / 3;
    const cz = (p2.getZ(i) + p2.getZ(i + 1) + p2.getZ(i + 2)) / 3;
    const cy = (p2.getY(i) + p2.getY(i + 1) + p2.getY(i + 2)) / 3;
    colorFn(cx, cz, cy, col);
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b);
  }
  g2.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g2.computeVertexNormals();
  const m = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function pathDistance(samples, x, z) {
  let best = 1e9;
  for (const p of samples) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) best = d; }
  return Math.sqrt(best);
}
const SPK = '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" stroke="#ffe9a8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const CRYSTAL = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 1l7 7-7 15L5 8z" fill="#7ef3ff"/><path d="M12 1l7 7h-14z" fill="#d9fbff"/><path d="M12 23L5 8h14z" fill="#3fc6e0" opacity=".7"/></svg>`;

  // Merge many still meshes into a few big ones (one per look), so low-end Chromebooks draw
  // the forest in a handful of calls. Sprites and lights inside keep working: they move to target.
  function mergeStatic(root, target) {
    root.updateMatrixWorld(true);
    const buckets = new Map();
    const loose = [];
    root.traverse(function (o) {
      if (o.isMesh) {
        const m = o.material;
        const key = [m.type, m.color && m.color.getHex(), m.emissive && m.emissive.getHex(), m.emissiveIntensity, m.transparent, m.opacity, m.side, m.metalness, m.roughness].join('|');
        let b = buckets.get(key);
        if (!b) { b = { mat: m, pos: [], nor: [] }; buckets.set(key, b); }
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        if (!g.attributes.normal) g.computeVertexNormals();
        b.pos.push(g.attributes.position.array);
        b.nor.push(g.attributes.normal.array);
        g.dispose();
      } else if (o.isSprite || o.isLight) loose.push(o);
    });
    loose.forEach(function (o) { target.attach(o); });
    buckets.forEach(function (b) {
      const n = b.pos.reduce(function (s, a) { return s + a.length; }, 0);
      const P = new Float32Array(n), N = new Float32Array(n);
      let off = 0;
      b.pos.forEach(function (a, i) { P.set(a, off); N.set(b.nor[i], off); off += a.length; });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      const mesh = new THREE.Mesh(geo, b.mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      target.add(mesh);
    });
  }

  // One small offscreen renderer that turns a model into a picture (build bar icons).
  let iconRenderer = null;
  function iconOf(factory, camPos, look) {
    if (!iconRenderer) {
      iconRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      iconRenderer.setSize(96, 96);
    }
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const d = new THREE.DirectionalLight(0xffffff, 1.0); d.position.set(3, 6, 4); s.add(d);
    factory(s);
    const c = new THREE.PerspectiveCamera(35, 1, 0.1, 100); c.position.copy(camPos); c.lookAt(look);
    iconRenderer.setClearColor(0x000000, 0);
    iconRenderer.render(s, c);
    const url = iconRenderer.domElement.toDataURL();
    s.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    return url;
  }
  function reseed(n) { seed = n; }

  RF.G = { rnd, R, mat, glow, mesh, group, glowTex, TEX, sprite, M, tree, roundTree, rock,
    archerTower, frostTotem, lightningSpire, emberCannon, golem, spikePit, vineSnare, ballista, healShrine, barricade,
    thornback, wisp, riftBat, shieldBrute, hero, camp, riftGate, boltLine, arrow, noise, terrain, pathDistance,
    SPK, CRYSTAL, mergeStatic, iconOf, reseed };
})(window.RF);
