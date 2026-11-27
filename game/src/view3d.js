// The old 3D battlefield (three.js). Since the painted rebuild (DESIGN.md 13.1, Step 3c) this file
// only draws: the rules live in battle.js, and paint.js draws the same battle on a painted map.
// Levels not moved to the painted battlefield yet use this one, and so does ?3d. Removed in Step 3f.
window.RF = window.RF || {};
(function (RF) {
  const V = { kind: '3d' };
  RF.view3d = V;
  const V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  const ray = new THREE.Raycaster();
  const COLORS = function () { return RF.G.TEX; };
  const B = function () { return RF.battle; };
  let world = null, warden = null, rangeRing = null, cache = null;
  const burns = [];

  // ---------- Icons for the build bar (made once from the 3D models) ----------
  V.icons = function () {
    if (cache) { RF.icons = cache; return cache; }
    const G = RF.G;
    const spec = {
      archer: [function (s) { G.archerTower(0, 0, s); }, [5, 5, 7], [0, 1.9, 0]],
      spike: [function (s) { G.spikePit(0, 0, s); }, [3, 3.4, 3], [0, 0.2, 0]],
      golem: [function (s) { G.golem(0, 0, s); }, [4, 3.5, -5], [0, 1.5, 0]],
      frost: [function (s) { const g = G.frostTotem(0, 0, s); g.children.slice(-2).forEach(function (c) { c.visible = false; }); }, [4, 4, 5], [0, 1.7, 0]],
      ember: [function (s) { G.emberCannon(0, 0, s); }, [3.5, 3.5, 4], [0, 0.9, 0]],
      lightning: [function (s) { G.lightningSpire(0, 0, s); }, [5, 4, 6], [0, 2.2, 0]],
      vine: [function (s) { G.vineSnare(0, 0, s); }, [3, 3, 3.5], [0, 0.9, 0]],
      ballista: [function (s) { G.ballista(0, 0, s); }, [3.5, 3, 3.5], [0, 0.7, 0]],
      shrine: [function (s) { G.healShrine(0, 0, s); }, [3.5, 3, 4], [0, 1.0, 0]],
      barricade: [function (s) { G.barricade(0, 0, s); }, [2.5, 2, 3], [0, 0.8, 0]]
    };
    cache = {};
    Object.keys(spec).forEach(function (k) {
      const sp = spec[k];
      cache[k] = G.iconOf(sp[0], V3.apply(null, sp[1]), V3.apply(null, sp[2]));
    });
    RF.icons = cache;
    return cache;
  };

  function wardenModel(world) {
    const G = RF.G;
    const g = new THREE.Group();
    g.position.set(world.camp.x + 2.6, 0, world.camp.z - 1.2);
    world.dyn.add(g);
    G.mesh(new THREE.ConeGeometry(0.75, 2.0, 7), G.M.roof, 0, 1.0, 0, g); // long coat
    G.mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.7, 7), G.M.stoneDark, 0, 2.05, 0, g); // shoulders
    G.mesh(new THREE.SphereGeometry(0.3, 8, 6), G.M.cloth, 0, 2.6, 0, g); // head
    const hood = G.mesh(new THREE.ConeGeometry(0.42, 0.8, 7), G.M.roof, 0, 2.85, -0.05, g);
    hood.rotation.x = -0.15;
    const staff = G.mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 5), G.M.woodDark, 0.6, 1.5, 0.1, g);
    staff.rotation.z = -0.08;
    const gem = G.mesh(new THREE.OctahedronGeometry(0.26, 0), G.M.anchor, 0.72, 3.15, 0.1, g);
    const glow = G.sprite(G.TEX.cyan, 1.4, 0.72, 3.15, 0.1, g, 0.8);
    g.rotation.y = Math.PI * 0.75;
    return { obj: g, gem: gem, glow: glow };
  }

  // ---------- Start and stop ----------
  V.start = function (levelIndex) {
    const app = RF.app;
    app.useLevel(levelIndex); // builds this level's 3D world if another one is showing
    world = app.world;
    burns.length = 0;
    world.anchorFlash = 0;
    world.pads.forEach(function (p) { p.def = null; p.marker.visible = true; });
    warden = wardenModel(world);
    app.setView(374, 140);
    app.battleCam();
    return world;
  };
  V.stop = function () {
    if (!world) return;
    const dyn = world.dyn;
    while (dyn.children.length) dyn.remove(dyn.children[0]);
    if (rangeRing) rangeRing.visible = false;
    world.pads.forEach(function (p) { p.def = null; p.marker.visible = true; p.ringMat.opacity = 0.35; p.ringMat.color.setHex(p.kind === 'tower' ? 0x7ef3ff : 0xd9a8ff); });
    const c = RF.app.renderer.domElement;
    c.onclick = null; c.onpointermove = null; c.style.cursor = 'default';
    RF.app.setView(0, 0);
  };
  V.screenOf = function (x, y, z) {
    const p = V3(x, y, z).project(world.camera);
    return { x: (p.x + 1) / 2 * window.innerWidth, y: (1 - p.y) / 2 * window.innerHeight, behind: p.z > 1 };
  };
  V.anchorY = 6.4;
  V.riftY = 4.5;
  V.anchorTextY = 5.4;

  // ---------- Build spots (fixed stone pads and trail spots) ----------
  V.spots = function (kind) { return world.pads.filter(function (p) { return !p.def && p.kind === kind; }); };
  V.releasePad = function () {};
  V.canBuild = function () { return true; };
  V.spotLine = function (kind) { return kind === 'tower' ? 'hud.spotTower' : 'hud.spotTrail'; };
  V.updatePads = function (cand) {
    world.pads.forEach(function (p) {
      p.marker.visible = !p.def;
      p.ringMat.color.setHex(p.kind === 'tower' ? 0x7ef3ff : 0xd9a8ff);
      p.ringMat.opacity = B().buildSel ? (cand.indexOf(p) >= 0 ? 0.9 : 0.08) : 0.35;
    });
  };
  V.animatePads = function (cand, cursor) {
    const t = RF.app.time;
    cand.forEach(function (p, i) {
      const on = i === cursor;
      p.ringMat.color.setHex(on ? 0xffffff : 0xffd76a);
      p.ringMat.opacity = on ? 1 : RF.settings.reducedMotion ? 0.85 : 0.6 + Math.abs(Math.sin(t * 3)) * 0.4;
    });
  };

  // ---------- Pointer ----------
  function pickPad(ev) {
    const v = new THREE.Vector2(ev.clientX / window.innerWidth * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(v, world.camera);
    const hits = ray.intersectObjects(world.pads.map(function (p) { return p.hit; }));
    return hits.length ? hits[0].object.userData.pad : null;
  }
  function onClick(ev) {
    const bt = B();
    if (!bt.active || bt.phase === 'done') return;
    const pad = pickPad(ev);
    if (!pad) { bt.selectBuild(null); bt.closePopup(); return; }
    if (pad.def) { bt.selectBuild(null); bt.showDefPopup(pad.def); return; }
    if (bt.tut && !bt.tut.allowPads() && !bt.buildSel && !pad.def) return;
    if (bt.buildSel) {
      if (bt.U.defenders[bt.buildSel].kind === pad.kind) bt.place(bt.buildSel, pad);
      else { bt.toast(pad.kind === 'tower' ? 'hud.wrongTower' : 'hud.wrongTrail', true); RF.sfx('soft'); }
      return;
    }
    bt.showPadMenu(pad);
  }
  function onMove(ev) {
    if (!B().active) return;
    RF.app.renderer.domElement.style.cursor = pickPad(ev) ? 'pointer' : 'default';
  }
  V.pointerOn = function () {
    const c = RF.app.renderer.domElement;
    c.onclick = onClick;
    c.onpointermove = onMove;
  };

  // ---------- Health bars (page labels that follow the models) ----------
  function makeBar(green) {
    return RF.dom.el('div', 'label', '<div class="tag"></div><div class="bar"><i style="width:100%' + (green ? ';background:#7dff9c' : '') + '"></i></div>');
  }
  function addBar(o, green, small) {
    o.label = makeBar(green);
    if (small) o.label.lastChild.style.width = '26px'; // tiny bar for tiny creatures
    document.getElementById('labels').appendChild(o.label);
  }
  V.relabel = function () {
    B().creatures.forEach(function (c) { addBar(c, false, c.type === 'bramble' || c.type === 'splitling'); });
    B().defenders.forEach(function (d) { if (d.type === 'golem' || d.type === 'barricade') addBar(d, true); });
  };

  // ---------- Creatures ----------
  V.addCreature = function (c) {
    const G = RF.G, type = c.type;
    if (type === 'thornback') c.obj = G.thornback(0, 0, world.dyn, 0.95);
    else if (type === 'bramble') c.obj = G.bramble(0, 0, world.dyn, 1.0);
    else if (type === 'brute') { c.obj = G.shieldBrute(0, 0, world.dyn); c.obj.scale.setScalar(1.15); }
    else if (type === 'bat') { c.obj = G.riftBat(0, 2.4, 0, world.dyn); c.obj.scale.setScalar(1.5); }
    else if (type === 'splitter') { c.obj = G.splitter(0, 0, world.dyn); c.obj.scale.setScalar(1.05); }
    else if (type === 'splitling') c.obj = G.splitling(0, 0, world.dyn);
    else c.obj = G.wisp(0, 1.4, 0, world.dyn);
    addBar(c, false, type === 'bramble' || type === 'splitling');
  };
  V.moveCreature = function (c, p) {
    c.obj.position.x = p.x; c.obj.position.z = p.z;
    if (c.type === 'wisp') {
      c.obj.position.y = 1.4 + (RF.settings.reducedMotion ? 0 : Math.sin(RF.app.time * 4 + c.bob) * 0.25);
    } else if (c.type === 'bat') {
      const still = RF.settings.reducedMotion;
      c.obj.position.y = 2.4 + (still ? 0 : Math.sin(RF.app.time * 3 + c.bob) * 0.3);
      c.obj.rotation.y = p.rot;
      const f = still ? 0.2 : Math.sin(RF.app.time * (c.stun > 0 ? 0 : 16) + c.bob) * 0.6;
      const w = c.obj.userData.wings;
      if (w) { w[0].rotation.y = f; w[1].rotation.y = -f; }
    } else {
      c.obj.rotation.y = p.rot;
      if (!RF.settings.reducedMotion && !c.held) c.obj.rotation.z = Math.sin(RF.app.time * 7 + c.bob) * 0.06;
      if (c.type === 'bramble') c.obj.position.y = RF.settings.reducedMotion ? 0 : Math.abs(Math.sin(RF.app.time * 9 + c.bob)) * 0.18; // little hops
    }
  };
  V.removeCreature = function (c) { world.dyn.remove(c.obj); if (c.label) c.label.remove(); };
  V.hitCreature = function () {};
  V.breakShield = function (c) { (c.obj.userData.shield || []).forEach(function (m) { m.visible = false; }); };

  // ---------- Defenders ----------
  function defModel(type, pad) {
    const G = RF.G;
    const y = pad.kind === 'tower' ? 0.45 : 0;
    let g;
    if (type === 'archer') g = G.archerTower(pad.x, pad.z, world.dyn);
    else if (type === 'frost') g = G.frostTotem(pad.x, pad.z, world.dyn);
    else if (type === 'spike') g = G.spikePit(pad.x, pad.z, world.dyn);
    else if (type === 'ember') g = G.emberCannon(pad.x, pad.z, world.dyn);
    else if (type === 'lightning') g = G.lightningSpire(pad.x, pad.z, world.dyn);
    else if (type === 'vine') g = G.vineSnare(pad.x, pad.z, world.dyn);
    else if (type === 'ballista') {
      g = G.ballista(pad.x, pad.z, world.dyn);
      g.children[1].rotation.order = 'YXZ'; // turn first, then tilt up, so it can aim any way
    }
    else if (type === 'shrine') g = G.healShrine(pad.x, pad.z, world.dyn);
    else if (type === 'barricade') g = G.barricade(pad.x, pad.z, world.dyn, pad.rot); // wall faces across the trail
    else {
      g = G.golem(pad.x, pad.z, world.dyn, 0.8);
      g.rotation.y = pad.rot - Math.PI;
    }
    g.position.y = y;
    return g;
  }
  V.addDefender = function (def) {
    def.obj = defModel(def.type, def.pad);
    if (def.type === 'frost') def.rings = def.obj.children.slice(-2); // the two range circles, kept so upgrade rings never get mixed up with them
    if (def.type === 'golem' || def.type === 'barricade') addBar(def, true);
  };
  V.removeDefender = function (def) { world.dyn.remove(def.obj); if (def.label) def.label.remove(); };
  V.frostRange = function (def, r) {
    // The circles sit inside the totem, which grows with each level, so undo that growth here.
    const g = def.obj.scale.x || 1;
    def.rings.forEach(function (m) { m.scale.set(r / 3.7 / g, r / 3.7 / g, 1); });
  };
  // A defender's size: grows a little with each level. A vine shrinks while it regrows.
  V.scaleDefender = function (def) {
    const base = (def.type === 'golem' ? 0.8 : 1) * (1 + 0.08 * (def.lv - 1));
    def.obj.scale.setScalar(base * (def.regrow > 0 ? 0.55 : 1));
  };
  V.popIn = function (def) {
    if (RF.settings.reducedMotion) return;
    const obj = def.obj;
    const target = obj.scale.x;
    obj.scale.setScalar(0.01);
    B().fx.push({ life: 0.35, t: 0, update: function (f) { obj.scale.setScalar(target * Math.min(1, 0.2 + f * 1.1)); }, end: function () { obj.scale.setScalar(target); } });
  };
  V.upgradeDefender = function (def) {
    V.scaleDefender(def);
    const RR = { archer: [1.15, 1.72, 0.12], ember: [1.3, 0.12, 0.15], lightning: [1.05, 0.2, 0.15], vine: [1.05, 0.15, 0.12], ballista: [1.3, 0.3, 0.15], shrine: [1.2, 0.2, 0.15], barricade: [1.15, 0.12, 0.1] };
    const rr = RR[def.type] || [0.9, 0.45, 0.15];
    const ring = RF.G.mesh(new THREE.TorusGeometry(rr[0], 0.07, 4, 16), RF.G.M.gold, 0, rr[1] + (def.lv - 2) * rr[2], 0, def.obj);
    ring.rotation.x = Math.PI / 2;
    if (def.spec) specCrown(def);
  };
  // A specialty gets a glowing gem above the defender: orange for the first choice, blue for the second,
  // so a student can tell at a glance which one each defender took.
  function specCrown(def) {
    const o = def.obj, sc = o.scale.x || 1;
    o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o);
    const top = (box.max.y - o.position.y) / sc + 0.5;
    const a = def.spec === 'a';
    const gem = RF.G.mesh(new THREE.OctahedronGeometry(0.34, 0), a ? RF.G.M.ember : RF.G.M.anchor, 0, top, 0, o);
    gem.scale.y = 1.4;
    RF.G.sprite(a ? RF.G.TEX.orange : RF.G.TEX.cyan, 1.6, 0, top, 0, o, 0.85);
    def.gem = gem;
  }
  V.defenderDown = function (def, down) { def.obj.visible = !down; };
  V.strike = function (def) {
    if (RF.settings.reducedMotion) return;
    def.obj.rotation.x = -0.25; setTimeout(function () { def.obj.rotation.x = 0; }, 160);
  };
  V.spikeActive = function (def, any) { if (!RF.settings.reducedMotion) def.obj.position.y = any ? Math.abs(Math.sin(RF.app.time * 18)) * 0.15 : 0; };
  V.aim = function (def, tx, tz) {
    if (def.type !== 'ember' && def.type !== 'ballista') return;
    const ang = Math.atan2(-(tx - def.pad.x), -(tz - def.pad.z));
    if (def.type === 'ballista') def.obj.children[1].rotation.set(0.2, ang, 0);
    else def.obj.children[1].rotation.y = ang;
  };
  V.recoil = function (def) {
    if (RF.settings.reducedMotion || def.type !== 'ember') return;
    const yoke = def.obj.children[1];
    yoke.position.z = 0.25; setTimeout(function () { yoke.position.z = 0; }, 120);
  };
  V.defTop = function (def) { return def.type === 'archer' ? 5.2 : 3.4; };
  V.showRange = function (def, r) {
    if (!rangeRing || rangeRing.parent !== world.scene) {
      rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.9, depthWrite: false }));
      rangeRing.rotation.x = -Math.PI / 2;
      world.scene.add(rangeRing);
    }
    rangeRing.scale.set(r, r, 1);
    rangeRing.position.set(def.pad.x, 0.15, def.pad.z);
    rangeRing.visible = true;
  };
  V.hideRange = function () { if (rangeRing) rangeRing.visible = false; };

  // ---------- Shots ----------
  V.addShot = function (sh) {
    if (sh.shell) {
      sh.obj = RF.G.mesh(new THREE.SphereGeometry(0.26, 8, 6), RF.G.M.ember, sh.x, sh.y, sh.z, world.dyn);
      RF.G.sprite(RF.G.TEX.orange, 1.3, 0, 0, 0, sh.obj, 0.9);
    } else {
      sh.obj = RF.G.arrow(sh.x, sh.y, sh.z, world.dyn);
      if (sh.size) sh.obj.scale.setScalar(sh.size);
    }
  };
  V.moveShot = function (sh, ty) {
    sh.obj.position.set(sh.x, sh.y, sh.z);
    if (!sh.shell) { sh.obj.lookAt(sh.tx, ty, sh.tz); sh.obj.rotateY(Math.PI); }
  };
  V.removeShot = function (sh) { if (sh.shell) sh.obj.geometry.dispose(); world.dyn.remove(sh.obj); };

  // ---------- Effects ----------
  V.burst = function (x, y, z, color, n) {
    const G = RF.G, tex = G.TEX[color];
    if (RF.settings.reducedMotion) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const s = G.sprite(tex, 0.6, x, y, z, world.dyn, 0.9);
      const vx = (Math.random() - 0.5) * 4, vy = 1 + Math.random() * 3, vz = (Math.random() - 0.5) * 4;
      B().fx.push({ life: 0.5 + Math.random() * 0.3, t: 0, update: function (f, dt) { s.position.x += vx * dt; s.position.y += vy * dt; s.position.z += vz * dt; s.material.opacity = 0.9 * (1 - f); s.scale.setScalar(0.6 + f * 1.2); }, end: function () { world.dyn.remove(s); } });
    }
  };
  // A bolt that fades out fast.
  V.zap = function (from, to) {
    const a = V3(from.x, from.y, from.z), b = V3(to.x, to.y, to.z);
    const grp = new THREE.Group();
    world.dyn.add(grp);
    RF.G.boltLine(a, b, grp, 0xfff7b0);
    RF.G.boltLine(a, b, grp, 0xffffff); // second jagged line makes the bolt thicker
    RF.G.sprite(RF.G.TEX.yellow, 2.4, b.x, b.y, b.z, grp, 0.9);
    const mats = [];
    grp.traverse(function (o) { if (o.material) { o.material.transparent = true; mats.push([o.material, o.material.opacity]); } });
    B().fx.push({ life: 0.22, t: 0, update: function (f) { mats.forEach(function (m) { m[0].opacity = m[1] * (1 - f); }); }, end: function () {
      grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      world.dyn.remove(grp);
    } });
    V.burst(b.x, b.y, b.z, 'yellow', 2);
  };
  V.splashRing = function (x, z, radius) {
    const ring = RF.G.sprite(RF.G.TEX.orange, radius * 1.2, x, 0.6, z, world.dyn, 0.9);
    B().fx.push({ life: 0.35, t: 0, update: function (f) { ring.material.opacity = 0.9 * (1 - f); ring.scale.setScalar(radius * (1.2 + f * 1.6)); }, end: function () { world.dyn.remove(ring); } });
  };
  V.burnAdd = function (b) { b.spr = RF.G.sprite(RF.G.TEX.orange, b.r * 2, b.x, 0.3, b.z, world.dyn, 0.7); };
  V.burnTick = function (b) { b.spr.material.opacity = 0.7 * Math.min(1, b.life / 0.8); };
  V.burnRemove = function (b) { world.dyn.remove(b.spr); };
  V.megaFlash = function () {
    const flash = RF.G.sprite(RF.G.TEX.yellow, 70, -6, 12, 0, world.dyn, 0.95);
    B().fx.push({ life: 1.0, t: 0, update: function (f) { flash.material.opacity = 0.95 * (1 - f); flash.scale.setScalar(70 + f * 20); }, end: function () { world.dyn.remove(flash); } });
  };
  V.freezeFlash = function () {
    const fl = RF.G.sprite(RF.G.TEX.ice, 70, world.camp.x * 0.5, 10, world.camp.z * 0.5, world.dyn, 0.6);
    B().fx.push({ life: 0.8, t: 0, update: function (f) { fl.material.opacity = 0.6 * (1 - f); }, end: function () { world.dyn.remove(fl); } });
  };
  V.heroCast = function (color) {
    const w = warden;
    if (!w) return;
    const p = w.obj.position;
    V.burst(p.x, 3.4, p.z, color, 8);
    w.glow.material.map = RF.G.TEX[color];
    B().fx.push({ life: 0.8, t: 0, update: function (f) { w.glow.scale.setScalar(1.4 + Math.sin(f * Math.PI) * 3); }, end: function () { w.glow.scale.setScalar(1.4); w.glow.material.map = RF.G.TEX.cyan; } });
  };
  // A falling meteor; battle.js deals the damage when 'time' is up, then calls meteorHit.
  V.meteor = function (tx, tz, radius, time) {
    const G = RF.G;
    const rock = G.mesh(new THREE.DodecahedronGeometry(0.9, 0), G.M.ember, tx + 6, 22, tz - 4, world.dyn);
    G.sprite(G.TEX.orange, 4, 0, 0, 0, rock, 0.9);
    const mark = G.sprite(G.TEX.orange, radius * 2, tx, 0.3, tz, world.dyn, 0.5);
    B().fx.push({ life: time, t: 0, update: function (f) { rock.position.set(tx + 6 * (1 - f), 22 * (1 - f) + 0.5, tz - 4 * (1 - f)); rock.rotation.x += 0.3; mark.material.opacity = 0.3 + f * 0.5; },
      end: function () { world.dyn.remove(rock); world.dyn.remove(mark); rock.geometry.dispose(); } });
  };
  V.meteorHit = function (tx, tz, radius) {
    V.burst(tx, 1, tz, 'orange', 14); V.burst(tx, 1, tz, 'purple', 6);
    const ring = RF.G.sprite(RF.G.TEX.orange, radius * 2, tx, 0.6, tz, world.dyn, 1);
    B().fx.push({ life: 0.45, t: 0, update: function (f) { ring.material.opacity = 1 - f; ring.scale.setScalar(radius * (2 + f * 2)); }, end: function () { world.dyn.remove(ring); } });
  };
  V.anchorHurt = function () { world.anchorFlash = 0.6; };

  // Camera shake (battle.js counts B.shake down).
  V.frame = function (realDt, shaking, shakeEnded) {
    if (!shaking) return;
    const cam = world.camera;
    RF.app.battleCam();
    if (shakeEnded) return;
    cam.position.x += (Math.random() - 0.5) * 0.5;
    cam.position.y += (Math.random() - 0.5) * 0.5;
  };

  // Move the health bars to follow things on the battlefield.
  V.afterRender = function () {
    const bt = B();
    const put = function (el, x, y, z) {
      const p = V.screenOf(x, y, z);
      el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-100%)';
    };
    put(bt.anchorLabel, world.camp.x, V.anchorY, world.camp.z);
    put(bt.riftLabel, world.rift.x, V.riftY, world.rift.z);
    bt.creatures.forEach(function (c) {
      put(c.label, c.x, c.type === 'wisp' ? 2.3 : c.type === 'bat' ? 3.4 : c.type === 'bramble' || c.type === 'splitling' ? 1.5 : c.type === 'brute' ? 3.5 : 2.5, c.z);
      c.label.lastChild.firstChild.style.width = Math.max(0, c.hp / c.max * 100) + '%';
      const t = bt.creatureTag(c);
      if (c.label.firstChild.textContent !== t) {
        c.label.firstChild.textContent = t;
        c.label.firstChild.style.color = bt.tagColor(c);
      }
    });
    bt.defenders.forEach(function (d) {
      if (!d.label) return;
      put(d.label, d.pad.x, 3.2, d.pad.z);
      d.label.lastChild.firstChild.style.width = (d.down > 0 ? 0 : Math.max(0, d.hp / d.max * 100)) + '%';
      const t = d.down > 0 ? RF.t('tag.rebuild') : '';
      if (d.label.firstChild.textContent !== t) d.label.firstChild.textContent = t;
    });
  };
})(window.RF);
