// World 1 map (DESIGN.md section 4.1): every level is a stone on a trail through the Thornwood.
// Beaten stones turn gold with their best stars, the next stone glows, later stones are chained.
// Tap a stone (or its name) to see its card on the right, then Play.
window.RF = window.RF || {};
(function (RF) {
  const MP = {};
  RF.map = MP;
  const D = RF.dom;
  const V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  const PANEL_W = 410; // space kept on the right for the level card

  // ---------- 3D scene (built once) ----------
  MP.build = function () {
    if (MP.scene) return;
    const G = RF.G;
    G.reseed(11);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1124);
    scene.fog = new THREE.Fog(0x0d1124, 95, 170);
    scene.add(new THREE.HemisphereLight(0xc8d8ff, 0x2a2140, 0.6));
    const sun = new THREE.DirectionalLight(0xffe2b8, 0.95);
    sun.position.set(-30, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(RF.lowPower ? 1024 : 2048, RF.lowPower ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 60, bottom: -60, near: 1, far: 200 });
    scene.add(sun);

    // Regions: the Thornwood is open; the Dunes (World 2) and Frostfang (World 3) wait in shadow and fog.
    const region = function (x, z) { return z < -12 ? 'ice' : x > 18 ? 'sand' : 'forest'; };
    G.terrain(170, 130, RF.lowPower ? 90 : 130, function (x, z) {
      const coast = Math.hypot(x / 1.25, z) - 58 + G.noise(x, z) * 4;
      let h = G.noise(x * 0.8, z * 0.8) * 0.35 + 1;
      if (region(x, z) === 'ice') h += 1.2 + Math.max(0, -z - 24) * 0.12 + Math.abs(G.noise(x * 2, z * 2)) * 1.2;
      if (region(x, z) === 'sand') h = 0.7 + Math.sin(x * 0.5) * 0.5 + Math.cos(z * 0.4 + x * 0.2) * 0.4;
      if (coast > 0) h = -2 - coast * 0.1;
      return h;
    }, function (x, z, y, col) {
      const r = region(x, z);
      if (y < -0.5) col.setHex(0x23507a);
      else if (y < 0.2) col.setHex(0xc9b58a);
      else if (r === 'forest') col.setHex([0x4f9a3f, 0x55a345, 0x4a9038][Math.floor(G.rnd() * 3)]);
      else if (r === 'sand') col.setHex([0xd9b36c, 0xcfa75e, 0xe0bd78][Math.floor(G.rnd() * 3)]);
      else col.setHex(y > 5 ? 0xf2f6ff : [0xc8d6e8, 0xb5c5da][Math.floor(G.rnd() * 2)]);
      if (r !== 'forest') col.lerp(new THREE.Color(0x1a1d33), 0.5);
    }, scene);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x1f4f80, roughness: 0.2, metalness: 0.3 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.9; scene.add(sea);

    const stones = RF.unlocks.stones();
    // Trail through the stones, plus a little way on toward World 2.
    const pts = stones.map(function (s) { return V3(s.x, 0.4, s.z); });
    const last = stones[stones.length - 1];
    pts.push(V3(last.x + 10, 0.4, last.z + 2), V3(last.x + 20, 0.4, last.z + 4));
    const trail = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
    const samples = trail.getSpacedPoints(300);

    // Scenery, merged for speed.
    const still = new THREE.Group();
    const nearStone = function (x, z) { return stones.some(function (s) { return Math.hypot(x - s.x, z - s.z) < 5; }); };
    const nearTrail = function (x, z) { return G.pathDistance(samples, x, z) < 2.6; };
    const want = RF.lowPower ? 170 : 260;
    for (let i = 0; i < want; i++) {
      const x = G.R(-60, 60), z = G.R(-45, 45);
      if (Math.hypot(x / 1.25, z) > 52) continue;
      const r = region(x, z);
      if (r === 'forest') {
        if (nearStone(x, z) || nearTrail(x, z) || G.rnd() > 0.9) continue;
        G.tree(x, z, still, G.R(1.1, 1.6), x < -30 && z < 0);
      } else if (r === 'ice' && G.rnd() < 0.5) {
        const t = G.tree(x, z, still, G.R(1.0, 1.4));
        t.traverse(function (o) { if (o.material === G.M.leaf1 || o.material === G.M.leaf2 || o.material === G.M.leaf3) o.material = G.M.stoneDark; });
        t.position.y = 1.5;
      } else if (r === 'sand' && G.rnd() < 0.3) G.rock(x, z, still, G.R(0.4, 1.2), 0.5);
    }
    scene.add(still);
    const merged = new THREE.Group();
    G.mergeStatic(still, merged);
    scene.remove(still);
    scene.add(merged);

    // Fog over the locked worlds, and a distant rift in each.
    for (let i = 0; i < 24; i++) {
      const x = G.R(18, 60), z = G.R(-10, 40);
      if (region(x, z) === 'sand') G.sprite(G.glowTex('rgba(60,60,90,0.9)', 'rgba(30,30,60,0.5)'), G.R(14, 22), x, 4, z, scene, 0.5);
    }
    for (let i = 0; i < 20; i++) G.sprite(G.glowTex('rgba(70,70,110,0.9)', 'rgba(30,30,60,0.5)'), G.R(14, 22), G.R(-50, 50), 6, G.R(-45, -14), scene, 0.45);
    G.riftGate(38, 8, scene).scale.setScalar(0.6);
    G.riftGate(-6, -34, scene).scale.setScalar(0.7);

    // Trail stones: one small stepping stone every few steps; gold once the stone behind it is beaten.
    const stepGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.15, 6);
    const steps = [];
    // Which map stone each step comes after (by distance along the trail).
    const stoneT = stones.map(function (s) {
      let best = 0, bd = 1e9;
      samples.forEach(function (p, i) { const d = Math.hypot(p.x - s.x, p.z - s.z); if (d < bd) { bd = d; best = i; } });
      return best;
    });
    samples.forEach(function (p, i) {
      if (i % 3 || nearStoneTight(p)) return;
      let after = -1;
      stoneT.forEach(function (t, k) { if (i > t) after = k; });
      const m = G.mesh(stepGeo, G.M.stoneDark, p.x, 1.45 + G.noise(p.x * 0.8, p.z * 0.8) * 0.35, p.z, scene);
      m.castShadow = false;
      steps.push({ mesh: m, after: after });
    });
    function nearStoneTight(p) { return stones.some(function (s) { return Math.hypot(p.x - s.x, p.z - s.z) < 3.4; }); }

    // Level stones. Each has parts for every state; refresh() shows the right ones.
    const chainMat = G.mat(0x555a66, { metalness: 0.6 });
    const stoneObjs = stones.map(function (s, i) {
      const g = G.group(s.x, 1.3, s.z, scene);
      g.scale.setScalar(s.boss ? 1.6 : 1.35);
      G.mesh(new THREE.CylinderGeometry(2.0, 2.4, 0.8, 8), G.M.stone, 0, 0, 0, g);
      const top = G.mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 8), G.M.stoneDark, 0, 0.5, 0, g);
      const open = G.group(0, 0, 0, g);
      G.sprite(G.TEX.cyan, 9, 0, 1.5, 0, open, 0.9);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x7ef3ff, transparent: true, opacity: 0.8 });
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.2, 40), ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; open.add(ring);
      const light = new THREE.PointLight(0x5ff0ff, 2.5, 14); light.position.y = 3; open.add(light);
      const done = G.group(0, 0, 0, g);
      G.sprite(G.TEX.yellow, 5, 0, 1.2, 0, done, 0.6);
      const locked = G.group(0, 0, 0, g);
      for (let k = 0; k < 2; k++) {
        const ch = G.mesh(new THREE.TorusGeometry(1.5, 0.12, 4, 12), chainMat, 0, 0.9, 0, locked);
        ch.rotation.set(Math.PI / 2 + (k ? 0.5 : -0.5), 0, 0);
      }
      if (s.boss) {
        G.thornback(0, 0, g, 1.5, 0.6).position.y = 0.6;
        G.sprite(G.TEX.purple, 8, 0, 2.5, 0, g, 0.7);
      }
      // Invisible, bigger target that is easy to tap.
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.5; hit.userData.stone = i; g.add(hit);
      return { g: g, top: top, open: open, ring: ring, done: done, locked: locked, hit: hit };
    });
    // The Rift Warden waits beside the first stone.
    const st0 = stones[0];
    MP.hero = G.hero(st0.x + 4, st0.z - 3, scene);
    MP.hero.scale.setScalar(2.0);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    MP.scene = scene; MP.camera = camera; MP.stoneObjs = stoneObjs; MP.steps = steps;
    MP.resize();
  };

  // Show each stone, trail step and the hero in its current state.
  MP.refresh = function () {
    const stones = RF.unlocks.stones();
    const G = RF.G;
    stones.forEach(function (s, i) {
      const o = MP.stoneObjs[i];
      const won = RF.unlocks.won(s.id), open = RF.unlocks.stoneOpen(i);
      o.state = won ? 'done' : open ? 'open' : 'locked';
      o.top.material = won ? G.M.gold : open ? G.M.anchor : G.M.stoneDark;
      o.open.visible = o.state === 'open';
      o.done.visible = o.state === 'done';
      o.locked.visible = o.state === 'locked';
    });
    MP.steps.forEach(function (st) {
      const ok = st.after >= 0 && RF.unlocks.won(stones[st.after].id);
      st.mesh.material = ok ? G.M.gold : G.M.stoneDark;
    });
    // Hero stands at the stone the student is up to.
    const cur = MP.defaultStone();
    const s = stones[cur];
    MP.hero.position.set(s.x + 3.6, 0.4, s.z + 2.6);
  };

  // The stone to start on: the first open stone not yet beaten, or the last open one.
  MP.defaultStone = function () {
    const stones = RF.unlocks.stones();
    let lastOpen = 0;
    for (let i = 0; i < stones.length; i++) {
      if (!RF.unlocks.stoneOpen(i)) break;
      lastOpen = i;
      if (!RF.unlocks.won(stones[i].id)) return i;
    }
    return lastOpen;
  };

  MP.resize = function () {
    if (!MP.camera) return;
    const W = window.innerWidth, H = window.innerHeight;
    const r = PANEL_W * D.scale;
    const fw = W + r;
    MP.camera.aspect = fw / H;
    MP.camera.setViewOffset(fw, H, r, 0, W, H);
    MP.camera.updateProjectionMatrix();
  };

  // Gentle drift so the map feels alive.
  MP.update = function (dt) {
    const t = RF.app.time || 0;
    const calm = RF.settings.reducedMotion;
    const cam = MP.camera;
    const sway = calm ? 0 : Math.sin(t * 0.15) * 1.5;
    cam.position.set(-13 + sway, 88, 74);
    cam.lookAt(-13 + sway * 0.5, 0, 12);
    MP.stoneObjs.forEach(function (o) {
      if (o.state === 'open') {
        const k = calm ? 1 : 1 + Math.sin(t * 3) * 0.08;
        o.ring.scale.set(k, k, 1);
      }
    });
    if (MP.hero && !calm) MP.hero.rotation.y = Math.sin(t * 0.7) * 0.6;
  };

  // Keep the stone name buttons over their stones.
  MP.afterRender = function () {
    if (!MP.labels) return;
    const W = window.innerWidth, H = window.innerHeight;
    const stones = RF.unlocks.stones();
    MP.labels.forEach(function (el, i) {
      const s = stones[i];
      const p = V3(s.x, s.boss ? 6.5 : 4.4, s.z).project(MP.camera);
      el.style.left = ((p.x + 1) / 2 * W / D.scale) + 'px';
      el.style.top = ((1 - p.y) / 2 * H / D.scale) + 'px';
    });
    (MP.farLabels || []).forEach(function (f) {
      const p = f.at.clone().project(MP.camera);
      f.el.style.left = ((p.x + 1) / 2 * W / D.scale) + 'px';
      f.el.style.top = ((1 - p.y) / 2 * H / D.scale) + 'px';
    });
  };

  // ---------- Screen ----------
  function stars(n, size) {
    return [1, 2, 3].map(function (k) { return '<span style="color:' + (k <= n ? '#ffd76a' : '#3a3f6e') + '">&#9733;</span>'; }).join('');
  }
  function lockIcon() { return '<svg width="22" height="22" viewBox="0 0 24 24" style="flex:none"><rect x="5" y="10" width="14" height="11" rx="2" fill="#c9a24a"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#c9a24a" stroke-width="2.5" fill="none"/></svg>'; }

  MP.show = function (selIndex) {
    if (RF.battle && RF.battle.active) RF.battle.cleanup();
    MP.build();
    MP.refresh();
    RF.app.mode = 'map';
    RF.screens.close();
    const box = D.el('div', 'screen', null, document.getElementById('ui'));
    box.style.cssText += ';display:block';
    RF.screens.cur = box;
    MP.box = box;
    const stones = RF.unlocks.stones();
    const lang = RF.lang();

    // Top left: world name and stars.
    const top = D.el('div', null, null, box);
    top.style.cssText = 'position:absolute;left:14px;top:12px;display:flex;gap:10px;align-items:center';
    const wname = (RF.data.world1.name || {})[lang] || (RF.data.world1.name || {}).en || '';
    const wc = D.el('div', 'chip', null, top);
    wc.style.cssText += ';gap:10px';
    wc.appendChild(D.speaker(function () { RF.speakSeq([{ id: 'map.world1' }, { text: wname, lang: lang }]); }, true));
    D.el('div', null, '<div class="gold" style="font-size:14px">' + D.esc(RF.t('map.world1')).toUpperCase() + '</div><div class="read" style="font-size:calc(22px * var(--ts))">' + D.esc(wname) + '</div>', wc).style.lineHeight = '1.2';
    const total = RF.unlocks.totalStars(), max = stones.length * 3;
    const sc = D.el('div', 'chip', null, top);
    sc.appendChild(D.speaker(function () { RF.speakSeq([{ id: 'map.stars' }, D.num(total), { id: 'res.of' }, D.num(max)]); }, true));
    D.el('div', null, '<span class="gold">&#9733; ' + total + '</span> / ' + max, sc).style.fontSize = '22px';
    if (RF.unlocks.testMode()) {
      const tm = D.el('div', 'chip', null, top);
      tm.style.cssText += ';border-color:#ff8a5a;color:#ffb89a';
      tm.appendChild(D.speaker(function () { RF.speak('map.testMode'); }, true));
      D.el('div', 'read', D.esc(RF.t('map.testMode')), tm).style.fontSize = '18px';
    }

    // Stone name buttons (they follow the stones).
    MP.labels = stones.map(function (s, i) {
      const o = MP.stoneObjs[i];
      const won = o.state === 'done', locked = o.state === 'locked';
      const b = D.el('button', 'chip', null, box);
      b.style.cssText += ';position:absolute;transform:translate(-50%,-100%);flex-direction:column;gap:0;padding:4px 12px;cursor:pointer;color:#fff;font-family:Lexend,sans-serif;' +
        'border-color:' + (s.boss ? '#c04dff' : won ? '#ffd76a' : locked ? '#4b4f9c' : '#7ef3ff') + (locked ? ';opacity:.8' : '');
      const head = locked ? lockIcon() : '<span style="font-size:20px">' + (s.boss ? '' : s.num) + '</span>';
      b.innerHTML = '<div style="display:flex;gap:6px;align-items:center;justify-content:center">' + head + '<span class="read" style="font-size:calc(15px * var(--ts))">' + (s.boss ? D.esc(RF.t('map.boss')) + ' &middot; ' : '') + D.esc(RF.t(s.name)) + '</span></div>' +
        (won ? '<div style="font-size:18px;line-height:1">' + stars(RF.unlocks.bestStars(s.id)) + '</div>' : '');
      b.addEventListener('click', function () { RF.sfx('move'); MP.select(i, true); });
      return b;
    });
    // Labels for the worlds still under fog.
    MP.farLabels = [['map.world2', V3(30, 5, 46)], ['map.world3', V3(-6, 8, -18)]].map(function (f) {
      const el = D.el('div', 'chip', null, box);
      el.style.cssText += ';position:absolute;transform:translate(-50%,-100%);font-size:15px;opacity:.85;padding:4px 10px;white-space:nowrap';
      el.appendChild(D.speaker(function () { RF.speak(f[0]); }, true));
      D.el('span', 'read', lockIcon() + ' ' + D.esc(RF.t(f[0])), el).style.cssText = 'display:flex;gap:6px;align-items:center';
      return { el: el, at: f[1] };
    });

    // Right: the level card.
    MP.card = D.el('div', 'panel', null, box);
    MP.card.style.cssText += ';position:absolute;right:14px;top:14px;width:' + (PANEL_W - 28) + 'px;max-height:calc(100% - 28px);overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:16px 18px';

    // Bottom left: settings and title.
    const bot = D.el('div', null, null, box);
    bot.style.cssText = 'position:absolute;left:14px;bottom:14px;display:flex;gap:12px';
    D.button('title.settings', function () { RF.sfx('open'); RF.screens.settings(function () { MP.show(MP.sel); }); }, '', bot);
    D.button('map.toTitle', function () { RF.sfx('back'); RF.screens.title(); }, '', bot);

    canvasOn();
    MP.select(selIndex == null ? MP.defaultStone() : selIndex, false);
    D.nav(box, function () { RF.screens.title(); });
    MP.afterRender();
  };

  MP.select = function (i, speakIt) {
    MP.sel = i;
    const stones = RF.unlocks.stones();
    const s = stones[i];
    const o = MP.stoneObjs[i];
    const p = MP.card;
    D.clear(p);
    MP.labels.forEach(function (b, k) { b.style.boxShadow = k === i ? '0 0 0 3px #fff, 0 4px 0 rgba(0,0,0,.45)' : ''; });
    const li = RF.unlocks.levelIndex(s.id);
    const L = li >= 0 ? RF.data.levels.levels[li] : null;
    const stateId = o.state === 'done' ? 'map.beaten' : o.state === 'open' ? (L ? 'level.open' : 'map.next') : 'map.locked';
    const numId = s.boss ? 'level.n6' : 'level.n' + s.num;
    const color = o.state === 'done' ? '#ffd76a' : o.state === 'open' ? '#7ef3ff' : '#aab6ff';
    p.style.borderColor = s.boss ? '#c04dff' : color === '#aab6ff' ? '#4b4f9c' : color;
    D.el('div', null, D.esc(RF.t(numId) + ' · ' + RF.t(stateId)).toUpperCase(), p).style.cssText = 'font-weight:700;font-size:15px;color:' + color + ';margin-bottom:-8px';
    const nm = D.line(s.name, '', p);
    nm.querySelector('.txt').style.cssText = 'font-size:calc(30px * var(--ts));font-weight:700;line-height:1.15';
    if (o.state === 'done') {
      const best = RF.unlocks.bestStars(s.id);
      D.el('div', null, stars(best), p).style.cssText = 'font-size:34px;letter-spacing:4px;line-height:1;margin-top:-4px';
    }
    if (L) {
      const grid = D.el('div', null, null, p);
      grid.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:10px 12px;align-items:start';
      [['level.card.waves', 'level.wavesUntil', '#fff'], ['level.card.enemies', L.enemies, '#d9a8ff'], ['level.card.words', L.words, '#fff'], ['level.card.reward', L.reward, '#ffd76a']].forEach(function (r) {
        const lab = D.el('div', 'line', null, grid);
        lab.appendChild(D.speaker(function () { RF.speakSeq([{ id: r[0] }, { id: r[1] }]); }, true));
        D.el('span', 'txt', D.esc(RF.t(r[0])), lab).style.cssText = 'color:#aab6ff;font-size:calc(15px * var(--ts))';
        D.el('div', 'read', D.esc(RF.t(r[1])), grid).style.cssText = 'font-size:calc(16px * var(--ts));line-height:1.35;padding-top:6px;color:' + r[2];
      });
    }
    if (o.state === 'locked') D.line('map.lockedHint', '', p).querySelector('.txt').style.color = '#c9c3ff';
    else if (!L) D.line('map.soon', '', p).querySelector('.txt').style.color = '#c9c3ff';
    else D.line('level.goal', '', p).querySelector('.txt').style.cssText = 'color:#9cf2c0;font-size:calc(15px * var(--ts))';
    if (L && o.state !== 'locked') {
      const pb = D.button(o.state === 'done' ? 'res.again' : 'title.play', function () { RF.sfx('open'); MP.hide(); RF.screens.close(); RF.startBattle(li); }, 'big go', p);
      pb.btn.style.flex = '1';
      pb.btn.dataset.first = '1';
      if (speakIt) setTimeout(function () { pb.btn.focus({ preventScroll: true }); }, 20);
    }
    if (speakIt) RF.speakSeq([{ id: numId }, { id: s.name }, { id: stateId }]);
  };

  MP.hide = function () {
    const c = RF.app.renderer.domElement;
    c.onclick = null; c.onpointermove = null; c.style.cursor = 'default';
    MP.labels = null; MP.farLabels = null;
    if (RF.app.mode === 'map') RF.app.mode = 'title';
  };

  function stoneAt(ev) {
    const c = RF.app.renderer.domElement;
    const r = c.getBoundingClientRect();
    const v = new THREE.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, MP.camera);
    const hits = ray.intersectObjects(MP.stoneObjs.map(function (o) { return o.hit; }));
    return hits.length ? hits[0].object.userData.stone : -1;
  }
  function canvasOn() {
    const c = RF.app.renderer.domElement;
    c.onclick = function (ev) { if (RF.app.mode !== 'map') return; const i = stoneAt(ev); if (i >= 0) { RF.sfx('move'); MP.select(i, true); } };
    c.onpointermove = function (ev) { if (RF.app.mode !== 'map') return; c.style.cursor = stoneAt(ev) >= 0 ? 'pointer' : 'default'; };
  }
})(window.RF);
