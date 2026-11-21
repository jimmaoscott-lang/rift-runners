// Builds the 3D world for one level: terrain, trail, forest, rift, camp, build pads, lights, camera.
// Layout comes from game/data/levels-w*.json. Still scenery is merged into a few meshes for speed.
window.RF = window.RF || {};
(function (RF) {
  const V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };

  RF.buildLevel = function (L) {
    const G = RF.G;
    G.reseed(7);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141a2e);
    scene.fog = new THREE.Fog(0x141a2e, 70, 130);

    scene.add(new THREE.HemisphereLight(0xb8c8ff, 0x302545, 0.55));
    scene.add(new THREE.AmbientLight(0x404060, 0.25));
    const sun = new THREE.DirectionalLight(0xffe2b8, 0.95);
    sun.position.set(-20, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(RF.lowPower ? 1024 : 2048, RF.lowPower ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 35, bottom: -35, near: 1, far: 120 });
    scene.add(sun);

    // ---- Trail ----
    const curve = new THREE.CatmullRomCurve3(L.path.map(function (p) { return V3(p[0], 0, p[1]); }), false, 'catmullrom', 0.4);
    const N = 600;
    const samples = curve.getSpacedPoints(N - 1);
    const len = curve.getLength();
    const path = {
      curve: curve, len: len, samples: samples,
      // Point on the trail at distance s from the rift; lane shifts it sideways.
      at: function (s, lane, out) {
        const u = Math.max(0, Math.min(1, s / len)) * (N - 1);
        const i = Math.min(N - 2, Math.floor(u));
        const f = u - i;
        const a = samples[i], b = samples[i + 1];
        const tx = b.x - a.x, tz = b.z - a.z;
        const tl = Math.hypot(tx, tz) || 1;
        out = out || {};
        out.x = a.x + tx * f + (lane || 0) * (tz / tl);
        out.z = a.z + tz * f - (lane || 0) * (tx / tl);
        out.rot = Math.atan2(tx, tz) + Math.PI;
        return out;
      }
    };
    // The river comes from the level file (optional "river": {"x": 22, "amp": 3}) so layouts can move it.
    const rv0 = Object.assign({ x: 22, amp: 3 }, L.river || {});
    const riverX = function (z) { return rv0.x + Math.sin(z * 0.2) * rv0.amp; };
    // Optional "hill": [x, z] puts the big hill somewhere else (default is the old spot).
    const hill = L.hill || [-8, -18];
    const camp = { x: L.camp[0], z: L.camp[1] };
    const rift = { x: L.rift[0], z: L.rift[1] };

    // ---- Build pads ----
    const pads = [];
    L.towerPads.forEach(function (tp, i) {
      const a = path.at(tp.t * len);
      let best = null;
      for (let d = 3.4; d <= 6; d += 0.3) {
        for (const side of [tp.side, -tp.side]) {
          const p = path.at(tp.t * len, side * d);
          if (G.pathDistance(samples, p.x, p.z) >= 3.0 && Math.hypot(p.x - camp.x, p.z - camp.z) > 6) { best = p; break; }
        }
        if (best) break;
      }
      if (!best) { console.warn('Tower pad', i, 'has no room'); best = a; }
      pads.push({ id: 'T' + i, kind: 'tower', x: best.x, z: best.z, def: null });
    });
    L.trailPads.forEach(function (t, i) {
      const a = path.at(t * len);
      pads.push({ id: 'P' + i, kind: 'trail', x: a.x, z: a.z, s: t * len, rot: a.rot, def: null });
    });

    // ---- Terrain ----
    G.terrain(110, 80, RF.lowPower ? 80 : 110, function (x, z) {
      const dp = G.pathDistance(samples, x, z);
      let h = G.noise(x, z) * 0.9 + 0.6;
      if (dp < 2.6) h *= dp / 2.6 * 0.6;
      const rv = Math.abs(x - riverX(z));
      if (rv < 3.2) h = -1.2 + rv * 0.15;
      if (Math.hypot(x - hill[0], z - hill[1]) < 7) h += (7 - Math.hypot(x - hill[0], z - hill[1])) * 0.7;
      pads.forEach(function (p) { if (p.kind === 'tower') { const d = Math.hypot(x - p.x, z - p.z); if (d < 2.2) h = Math.min(h, 0.15 + d * 0.1); } });
      if (Math.hypot(x - camp.x, z - camp.z) < 5) h = Math.min(h, 0.2);
      return h;
    }, function (x, z, y, col) {
      const dp = G.pathDistance(samples, x, z);
      const rv = Math.abs(x - riverX(z));
      const riftNear = Math.max(0, 1 - Math.hypot(x - rift.x, z - rift.z) / 14);
      if (rv < 2.6) col.setHex(0x3a6f8f);
      else if (rv < 3.4) col.setHex(0xb59f74);
      else if (dp < 1.9) col.setHex(G.rnd() < 0.5 ? 0x9b7a50 : 0x8d6d45);
      else if (dp < 2.5) col.setHex(0x7a8a45);
      else if (y > 2.6) col.setHex(G.rnd() < 0.5 ? 0x6f7f5a : 0x7d8b66);
      else col.setHex([0x4f9a3f, 0x55a345, 0x4a9038, 0x5aa84a][Math.floor(G.rnd() * 4)]);
      if (riftNear > 0) col.lerp(new THREE.Color(0x3a2a55), riftNear * 0.85);
    }, scene);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(8, 90, 1, 1), new THREE.MeshStandardMaterial({ color: 0x3fa9d6, transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0.2 }));
    water.rotation.x = -Math.PI / 2; water.position.set(rv0.x, -0.55, 0); scene.add(water);

    // ---- Still scenery (merged) ----
    const still = new THREE.Group();
    for (let i = 0; i < 70; i++) {
      const p = samples[Math.floor(G.rnd() * samples.length)];
      G.mesh(new THREE.CylinderGeometry(G.R(0.15, 0.35), G.R(0.2, 0.4), 0.1, 6), G.M.stone, p.x + G.R(-1.3, 1.3), 0.03, p.z + G.R(-1.3, 1.3), still);
    }
    const nearPad = function (x, z) { return pads.some(function (p) { return Math.hypot(x - p.x, z - p.z) < (p.kind === 'tower' ? 2.6 : 0); }); };
    const free = function (x, z, r) {
      return G.pathDistance(samples, x, z) > (r || 3.4) && Math.abs(x - riverX(z)) > 4.2 && Math.hypot(x - camp.x, z - camp.z) > 6.5 && !nearPad(x, z);
    };
    let placed = 0;
    const want = RF.lowPower ? 150 : 230;
    for (let i = 0; i < 1000 && placed < want; i++) {
      const x = G.R(-52, 52), z = G.R(-38, 30);
      if (!free(x, z)) continue;
      if (Math.hypot(x - rift.x, z - rift.z) < 5) continue;
      const tainted = Math.hypot(x - rift.x, z - rift.z) < 13;
      if (G.rnd() < 0.75) G.tree(x, z, still, G.R(0.8, 1.35), tainted); else G.roundTree(x, z, still, G.R(0.8, 1.2));
      placed++;
    }
    for (let i = 0; i < 40; i++) { const x = G.R(-45, 45), z = G.R(-30, 25); if (free(x, z, 2.6)) G.rock(x, z, still, G.R(0.3, 0.9)); }

    // Camp: the Rift Anchor crystal stays separate so it can pulse and flash.
    const campG = G.camp(camp.x, camp.z, still);
    let anchorCrystal = null;
    campG.children.forEach(function (c) { if (c.isMesh && c.scale.y > 1.8 && c.geometry.type === 'OctahedronGeometry' && !anchorCrystal) anchorCrystal = c; });
    scene.add(still);
    still.updateMatrixWorld(true);
    if (anchorCrystal) scene.attach(anchorCrystal);
    // Tower pads: stone platforms (part of the still scenery).
    pads.forEach(function (p) {
      if (p.kind !== 'tower') return;
      G.mesh(new THREE.CylinderGeometry(1.35, 1.55, 0.4, 6), G.M.stoneDark, p.x, 0.2, p.z, still);
      G.mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.12, 6), G.M.stone, p.x, 0.45, p.z, still);
    });
    scene.remove(still);
    const merged = new THREE.Group();
    G.mergeStatic(still, merged);
    scene.add(merged);

    // ---- Rift (kept live so it can pulse) ----
    const riftG = G.riftGate(rift.x, rift.z, scene);
    riftG.rotation.y = 0.6;

    // ---- Pad markers (live: they glow while you pick a spot) ----
    pads.forEach(function (p) {
      const g = new THREE.Group();
      g.position.set(p.x, p.kind === 'tower' ? 0.53 : 0.08, p.z);
      const ringMat = new THREE.MeshBasicMaterial({ color: p.kind === 'tower' ? 0x7ef3ff : 0xd9a8ff, transparent: true, opacity: 0.35, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(p.kind === 'tower' ? 0.75 : 1.05, p.kind === 'tower' ? 0.95 : 1.3, 6), ringMat);
      ring.rotation.x = -Math.PI / 2;
      g.add(ring);
      if (p.kind === 'trail') {
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2;
          const d = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.5), ringMat);
          d.position.set(Math.cos(a) * 1.65, 0, Math.sin(a) * 1.65); d.rotation.y = -a;
          g.add(d);
        }
      }
      // Invisible, bigger target that is easy to tap.
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3.5, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.4;
      hit.userData.pad = p;
      g.add(hit);
      scene.add(g);
      p.marker = g; p.ringMat = ringMat; p.hit = hit;
    });

    const dyn = new THREE.Group();
    scene.add(dyn);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    return {
      L: L, scene: scene, camera: camera, sun: sun, path: path, pads: pads, dyn: dyn,
      camp: camp, rift: rift, riftG: riftG, anchorCrystal: anchorCrystal
    };
  };
})(window.RF);
