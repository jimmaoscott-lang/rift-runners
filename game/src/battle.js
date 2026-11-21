// Hold the Rift battle (DESIGN.md sections 4.2, 6A, 6B). Rift creatures march down the trail toward
// the Rift Anchor. Crystals from the Rune Forge build defenders, and the defenders fight in real time.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;
  const B = { active: false };
  RF.battle = B;
  const V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  const tmp = {};
  const ray = new THREE.Raycaster();

  // ---------- Icons for the build bar (made once from the 3D models) ----------
  function icons() {
    if (RF.icons) return RF.icons;
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
    RF.icons = {};
    Object.keys(spec).forEach(function (k) {
      const sp = spec[k];
      RF.icons[k] = G.iconOf(sp[0], V3.apply(null, sp[1]), V3.apply(null, sp[2]));
    });
    return RF.icons;
  }

  // ---------- Start ----------
  RF.startBattle = function (levelIndex, restore) {
    if (B.active) B.cleanup();
    const app = RF.app;
    const world = app.world;
    const L = RF.data.levels.levels[levelIndex || 0];
    const U = RF.data.units;
    B.L = L; B.U = U; B.world = world; B.levelIndex = levelIndex || 0;
    B.active = true;
    B.phase = 'build';
    B.crystals = L.startCrystals;
    B.anchorMax = L.anchor; B.anchor = L.anchor;
    B.wave = 0; B.waveTime = 0; B.queue = [];
    B.creatures = []; B.defenders = []; B.shots = []; B.fx = [];
    B.paused = false; B.speed = 1; B.shake = 0;
    B.buildSel = null; B.selDef = null; B.padCursor = -1;
    B.kills = 0; B.shards = 0; B.started = Date.now();
    B.sealReady = false; B.finalWave = false; B.locksFull = {}; B.golemFalls = 0;
    world.pads.forEach(function (p) { p.def = null; p.marker.visible = true; });
    world.anchorFlash = 0;

    app.setView(374, 140);
    app.battleCam();
    B.buildHUD();
    B.refreshLocks(true);
    B.updatePads();
    canvasOn();
    B.toast('hud.buildStart', true);
  };

  // ---------- HUD ----------
  B.buildHUD = function (forgeRestore) {
    const ui = document.getElementById('ui');
    if (B.hud) B.hud.remove();
    const hud = D.el('div', null, null, ui);
    hud.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    B.hud = hud;
    const auto = function (e) { e.style.pointerEvents = 'auto'; return e; };

    // Top bar
    const top = auto(D.el('div', null, null, hud));
    top.style.cssText += ';position:absolute;left:12px;top:12px;display:flex;gap:8px;align-items:center;white-space:nowrap';
    B.crystalChip = D.el('div', 'chip', '', top);
    B.crystalChip.style.cssText += ';font-size:24px;padding:5px 12px';
    B.crystalChip.style.transition = 'transform .15s';
    B.waveChip = D.el('div', 'chip', '', top);
    B.waveChip.style.cssText += ';font-size:16px;cursor:pointer;padding:6px 12px';
    B.waveChip.addEventListener('click', function () { RF.speakSeq(B.finalWave ? [{ id: 'hud.finalWave' }] : [{ id: 'hud.wave' }, D.num(Math.max(1, B.wave))]); });
    const lv = D.el('div', 'chip', '', top);
    lv.style.cssText += ';font-size:14px;gap:8px;padding:4px 10px';
    lv.appendChild(D.speaker(function () { RF.speakSeq([{ id: 'level.world1short' }, { id: 'level.n' + B.L.num }, { id: B.L.name }]); }, true));
    D.el('div', null, '<span class="gold">' + D.esc(RF.t('level.world1short')) + ' · ' + D.esc(RF.t('level.n' + B.L.num)) + '</span><br>' + D.esc(RF.t(B.L.name)), lv).style.lineHeight = '1.2';
    const ctr = D.el('div', null, null, top);
    ctr.style.cssText = 'display:flex;gap:6px;margin-left:6px';
    B.startBtn = D.el('button', 'btn start pulse', '', ctr);
    B.startBtn.style.fontSize = '17px';
    B.startBtn.addEventListener('click', function () { B.startWave(); });
    B.pauseBtn = D.el('button', 'btn', '', ctr);
    B.pauseBtn.style.fontSize = '15px';
    B.pauseBtn.addEventListener('click', function () { B.setPaused(!B.paused); });
    B.speedBtn = D.el('button', 'btn', '', ctr);
    B.speedBtn.style.fontSize = '15px';
    B.speedBtn.addEventListener('click', function () { B.speed = B.speed === 1 ? 2 : 1; RF.sfx('tap'); B.renderTop(); });
    B.focusChip = D.el('div', 'chip', '', ctr);
    B.focusChip.style.cssText += ';font-size:14px;border-color:#7ef3ff';

    B.toastBox = auto(D.el('div', 'toast', null, hud));
    B.toastBox.style.left = 'calc((100% - 374px) / 2)';

    // Rune Forge
    const fhost = auto(D.el('div', null, null, hud));
    B.forge = new RF.Forge(fhost, {
      level: B.L,
      restore: forgeRestore,
      onPay: function (amount, fromEl) { B.pay(amount, fromEl); },
      onRead: function () { B.refreshLocks(false); },
      onMega: function () { B.megaBlast(); }
    });

    // Build bar
    const bar = auto(D.el('div', 'buildbar', null, hud));
    B.cards = {};
    const ic = icons();
    B.L.defenders.forEach(function (id) {
      const d = B.U.defenders[id];
      const c = D.el('button', 'card', '<img alt="" src="' + ic[id] + '"><div class="n">' + D.esc(RF.t(d.name)) + '</div><div class="c"></div>', bar);
      c.addEventListener('click', function () { B.selectBuild(B.buildSel === id ? null : id); });
      B.cards[id] = c;
    });
    B.U.locked.forEach(function (lk) {
      const c = D.el('button', 'card locked', '<img alt="" src="' + ic[lk.id] + '"><div class="n">' + D.esc(RF.t(lk.name)) + '</div><div class="c" style="color:#c9c3ff">&#128274; ' + D.esc(RF.t(lk.unlock)) + '</div>', bar);
      c.addEventListener('click', function () { RF.speakSeq([{ id: lk.name }, { id: 'hud.unlocksAt' }, { id: lk.unlock }]); });
    });
    B.locksBox = auto(D.el('div', 'panel', null, hud));
    B.locksBox.style.cssText += ';position:absolute;left:12px;bottom:146px;padding:8px 12px;border-color:#c04dff;display:flex;flex-direction:column;gap:6px;box-shadow:0 0 16px rgba(192,77,255,.35),0 4px 0 #05060f';
    B.info = auto(D.el('div', 'info', null, hud));
    B.info.style.display = 'none';
    B.popup = auto(D.el('div', 'popup', null, hud));
    B.popup.style.display = 'none';
    B.pausePanel = auto(D.el('div', null, null, hud));
    B.pausePanel.style.cssText += ';position:absolute;left:calc((100% - 374px) / 2);top:42%;transform:translate(-50%,-50%);display:none';

    // Labels on the battlefield (screen space)
    const labels = document.getElementById('labels');
    D.clear(labels);
    B.anchorLabel = D.el('div', 'label', '', labels);
    B.riftLabel = D.el('div', 'label', '', labels);
    B.creatures.forEach(function (c) { c.label = makeBar(false); labels.appendChild(c.label); });
    B.defenders.forEach(function (d) { if (d.type === 'golem') { d.label = makeBar(true); labels.appendChild(d.label); } });
    B.renderTop();
    B.renderCards();
    if (B.locks) B.renderLocks();
  };

  // ---------- Rift locks (mastery, DESIGN.md 5.1) ----------
  // One lock per vowel pattern in the level. A lock fills from the last reads of that pattern
  // (right on the first try, no help). When every lock is full, the final wave comes.
  B.refreshLocks = function (quiet) {
    const m = B.L.mastery;
    B.locks = B.L.vowels.map(function (v) {
      const pat = 'cvc-' + v;
      const recent = RF.metrics.patternRecent(pat, m.window);
      const first = recent.filter(Boolean).length;
      return { v: v, pat: pat, recent: recent, first: first, done: first >= m.need };
    });
    if (!B.locksBox) return;
    B.renderLocks();
    B.locks.forEach(function (k) {
      if (k.done && !B.locksFull[k.pat]) {
        B.locksFull[k.pat] = true;
        if (!quiet && !B.locks.every(function (x) { return x.done; })) { B.toast(null, true, [{ id: 'lock.oneFull' }, { id: 'pat.' + k.pat }]); RF.sfx('big'); }
      }
    });
    if (!B.sealReady && B.locks.every(function (x) { return x.done; })) {
      B.sealReady = true;
      if (!quiet) { B.toast('lock.allFull', true); RF.sfx('win'); }
    }
  };
  B.renderLocks = function () {
    const box = B.locksBox;
    const need = B.L.mastery.need;
    D.clear(box);
    const h = D.line('lock.title', '', box);
    h.querySelector('.txt').style.cssText = 'font-size:14px;font-weight:700;color:#f0c8ff;letter-spacing:.5px;font-family:Lexend,sans-serif';
    h.querySelector('.txt').textContent = RF.t('lock.title').toUpperCase();
    B.locks.forEach(function (k) {
      const row = D.el('div', null, null, box);
      row.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer';
      row.appendChild(D.speaker(function () { RF.speakSeq([{ id: 'pat.' + k.pat }, D.num(Math.min(k.first, need)), { id: 'res.of' }, D.num(need)]); }, true));
      const letter = D.el('div', 'read', D.esc(k.v), row);
      letter.style.cssText = 'font-size:calc(24px * var(--ts));font-weight:700;width:26px;text-align:center;color:' + (k.done ? '#ffd76a' : '#fff');
      const bar = D.el('div', null, null, row);
      bar.style.cssText = 'display:flex;gap:3px';
      for (let i = 0; i < need; i++) {
        const seg = D.el('div', null, null, bar);
        seg.style.cssText = 'width:12px;height:16px;border-radius:3px;background:' + (i < k.first ? (k.done ? '#ffd76a' : '#c04dff') : '#2a2a55');
      }
      D.el('div', null, k.done ? '&#128274;' : Math.min(k.first, need) + '/' + need, row).style.cssText = 'font-size:13px;color:#c9c3ff;min-width:30px';
    });
  };

  function makeBar(green) {
    const e = D.el('div', 'label', '<div class="tag"></div><div class="bar"><i style="width:100%' + (green ? ';background:#7dff9c' : '') + '"></i></div>');
    return e;
  }

  B.renderTop = function () {
    B.crystalChip.innerHTML = D.CRYSTAL(30) + ' <span class="cyan">' + B.crystals + '</span>';
    B.waveChip.innerHTML = B.finalWave ? '<span class="gold">' + D.esc(RF.t('hud.finalWave')) + '</span>' : D.esc(RF.t('hud.wave')) + ' <span class="gold" style="font-size:22px">' + Math.max(1, B.wave) + '</span>';
    const showStart = B.phase === 'build' || B.phase === 'between';
    B.startBtn.style.display = showStart ? '' : 'none';
    const nextFinal = B.sealReady && B.wave + 1 >= B.L.minWaves;
    B.startBtn.innerHTML = '&#9654; ' + (nextFinal ? D.esc(RF.t('hud.finalWave')) : D.esc(RF.t('hud.startWave')) + ' ' + (B.wave + 1));
    B.pauseBtn.innerHTML = B.paused ? '&#9654; ' + D.esc(RF.t('hud.resume')) : '&#10074;&#10074; ' + D.esc(RF.t('hud.pause'));
    B.speedBtn.innerHTML = '&#9654;&#9654; x' + B.speed;
    B.speedBtn.classList.toggle('on', B.speed === 2);
    B.focusChip.style.display = RF.settings.focus ? '' : 'none';
    B.focusChip.textContent = RF.t('settings.focus');
    B.riftLabel.innerHTML = '<div class="chip" style="padding:4px 12px;font-size:15px;border-color:#c04dff;color:#f0c8ff">' + D.esc(RF.t('hud.rift')) + ' · ' + D.esc(RF.t(B.phase === 'wave' ? 'hud.riftOpen' : 'hud.riftReady')) + '</div>';
    B.anchorLabel.innerHTML = '<div class="chip" style="padding:3px 10px;font-size:15px;border-color:#5ff0ff">' + D.CRYSTAL(16) + ' ' + D.esc(RF.t('hud.anchor')) + ' ' + Math.max(0, B.anchor) + '/' + B.anchorMax + '</div>';
  };
  B.renderCards = function () {
    Object.keys(B.cards).forEach(function (id) {
      const d = B.U.defenders[id];
      const c = B.cards[id];
      c.classList.toggle('sel', B.buildSel === id);
      const ok = B.crystals >= d.cost;
      c.querySelector('.c').innerHTML = D.CRYSTAL(13) + '<span style="color:' + (ok ? '#7ef3ff' : '#ff8a8a') + '">' + d.cost + '</span>';
    });
  };

  B.toast = function (id, speakIt, parts) {
    D.clear(B.toastBox);
    const p = parts || [{ id: id }];
    const row = D.lineParts(p, 'chip', B.toastBox);
    row.style.cssText += ';font-size:18px;padding:8px 14px;border-color:#ffd76a';
    row.querySelector('.txt').style.fontSize = 'calc(19px * var(--ts))';
    if (speakIt) RF.speakSeq(p);
    clearTimeout(B.toastTimer);
    B.toastTimer = setTimeout(function () { D.clear(B.toastBox); }, 6000);
  };

  // ---------- Crystals ----------
  B.pay = function (amount, fromEl) {
    const chip = B.crystalChip;
    const done = function () {
      B.crystals += amount;
      B.renderTop(); B.renderCards();
      if (B.buildSel) B.showInfo(B.buildSel);
      chip.style.transform = 'scale(1.12)';
      setTimeout(function () { chip.style.transform = ''; }, 150);
      const r = chip.getBoundingClientRect();
      B.floatText('+' + amount, r.left + r.width / 2, r.bottom + 6, '#7ef3ff', 24, true);
    };
    if (RF.settings.reducedMotion || !fromEl) return done();
    const a = fromEl.getBoundingClientRect(), b = chip.getBoundingClientRect();
    const fly = D.el('div', null, D.CRYSTAL(34), document.body);
    fly.style.cssText = 'position:fixed;left:' + (a.left + a.width / 2 - 17) + 'px;top:' + (a.top + a.height / 2 - 17) + 'px;z-index:50;pointer-events:none;transition:transform .55s cubic-bezier(.5,-0.3,.6,1),opacity .55s;filter:drop-shadow(0 0 10px #2fb8ff)';
    requestAnimationFrame(function () {
      fly.style.transform = 'translate(' + (b.left + 30 - a.left - a.width / 2) + 'px,' + (b.top + 20 - a.top - a.height / 2) + 'px) scale(.8)';
    });
    setTimeout(function () { fly.remove(); done(); }, 560);
  };
  B.floatText = function (text, x, y, color, size, crystal) {
    const e = D.el('div', 'float', (crystal ? '' : '') + D.esc(text) + (crystal ? ' ' + D.CRYSTAL(size * 0.8) : ''), document.getElementById('labels'));
    e.style.cssText += ';left:' + x + 'px;top:' + y + 'px;color:' + color + ';font-size:' + size + 'px;display:flex;align-items:center;gap:4px';
    setTimeout(function () { e.remove(); }, 1000);
  };
  function screenOf(x, y, z) {
    const p = V3(x, y, z).project(B.world.camera);
    return { x: (p.x + 1) / 2 * window.innerWidth, y: (1 - p.y) / 2 * window.innerHeight, behind: p.z > 1 };
  }

  // ---------- Waves ----------
  // Wave k (1, 2, 3...). The first ones come from the level file; after that they keep growing.
  B.waveDef = function (k) {
    const W = B.L.waves;
    if (k <= W.length) return W[k - 1];
    const base = W[W.length - 1], e = B.L.endless, x = k - W.length;
    return { hp: (base.hp || 1) * Math.pow(1 + e.hpStep, x), groups: base.groups.map(function (g) { return Object.assign({}, g, { count: Math.round(g.count * (1 + e.countStep * x)) }); }) };
  };
  B.startWave = function () {
    if (!(B.phase === 'build' || B.phase === 'between')) return;
    B.finalWave = B.sealReady && B.wave + 1 >= B.L.minWaves;
    let w = B.waveDef(B.wave + 1);
    if (B.finalWave) {
      const f = B.L.finalBoost;
      w = { hp: (w.hp || 1) * f, groups: w.groups.map(function (g) { return Object.assign({}, g, { count: Math.round(g.count * f) }); }) };
    }
    B.queue = [];
    w.groups.forEach(function (g) {
      for (let i = 0; i < g.count; i++) B.queue.push({ type: g.type, at: (g.delay || 0) + i * g.gap, hp: w.hp || 1 });
    });
    B.queue.sort(function (a, b) { return a.at - b.at; });
    B.wave++;
    B.waveTime = 0;
    B.phase = 'wave';
    RF.sfx('open');
    B.renderTop();
    B.toast(null, true, B.finalWave ? [{ id: 'hud.finalWave' }] : [{ id: 'hud.wave' }, D.num(B.wave)]);
  };

  function spawn(type, hpScale) {
    const G = RF.G;
    const cdef = B.U.creatures[type];
    const hp = Math.round(cdef.hp * (hpScale || 1));
    const c = { type: type, hp: hp, max: hp, s: 0, speed: cdef.speed * (0.92 + Math.random() * 0.16), lane: (Math.random() - 0.5) * (type === 'wisp' ? 1.8 : 1.0), slow: 1, held: null, alive: true, bob: Math.random() * 6 };
    if (type === 'thornback') c.obj = G.thornback(0, 0, B.world.dyn, 0.95);
    else c.obj = G.wisp(0, 1.4, 0, B.world.dyn);
    c.label = makeBar(false);
    document.getElementById('labels').appendChild(c.label);
    B.creatures.push(c);
    placeCreature(c);
  }
  function placeCreature(c) {
    const p = B.world.path.at(c.s, c.lane, tmp);
    c.x = p.x; c.z = p.z;
    c.obj.position.x = p.x; c.obj.position.z = p.z;
    if (c.type === 'wisp') {
      c.obj.position.y = 1.4 + (RF.settings.reducedMotion ? 0 : Math.sin(RF.app.time * 4 + c.bob) * 0.25);
    } else {
      c.obj.rotation.y = p.rot;
      if (!RF.settings.reducedMotion && !c.held) c.obj.rotation.z = Math.sin(RF.app.time * 7 + c.bob) * 0.06;
    }
  }

  // ---------- Defenders ----------
  function defModel(type, pad) {
    const G = RF.G;
    const y = pad.kind === 'tower' ? 0.45 : 0;
    let g;
    if (type === 'archer') g = G.archerTower(pad.x, pad.z, B.world.dyn);
    else if (type === 'frost') g = G.frostTotem(pad.x, pad.z, B.world.dyn);
    else if (type === 'spike') g = G.spikePit(pad.x, pad.z, B.world.dyn);
    else {
      g = G.golem(pad.x, pad.z, B.world.dyn, 0.8);
      g.rotation.y = pad.rot - Math.PI;
    }
    g.position.y = y;
    return g;
  }
  B.place = function (type, pad) {
    const d = B.U.defenders[type];
    if (pad.def || d.kind !== pad.kind) return false;
    if (B.crystals < d.cost) { B.toast('hud.need', true); RF.sfx('soft'); return false; }
    B.crystals -= d.cost;
    const def = { type: type, lv: 1, pad: pad, spent: d.cost, cd: 0.2, obj: defModel(type, pad) };
    if (type === 'golem') {
      def.hp = d.levels[0].hp; def.max = def.hp; def.down = 0; def.held = [];
      def.label = makeBar(true);
      document.getElementById('labels').appendChild(def.label);
    }
    if (type === 'frost') scaleFrost(def);
    pad.def = def;
    B.defenders.push(def);
    popIn(def.obj);
    RF.sfx('big');
    RF.metrics.support('build');
    B.selectBuild(null);
    B.renderTop(); B.renderCards();
    return true;
  };
  function scaleFrost(def) {
    const r = B.U.defenders.frost.levels[def.lv - 1].range;
    const kids = def.obj.children;
    [kids[kids.length - 1], kids[kids.length - 2]].forEach(function (m) { m.scale.set(r / 3.7, r / 3.7, 1); });
  }
  function popIn(obj) {
    if (RF.settings.reducedMotion) return;
    const target = obj.scale.x;
    obj.scale.setScalar(0.01);
    B.fx.push({ life: 0.35, t: 0, update: function (f) { obj.scale.setScalar(target * Math.min(1, 0.2 + f * 1.1)); }, end: function () { obj.scale.setScalar(target); } });
  }
  B.upgrade = function (def) {
    const d = B.U.defenders[def.type];
    if (def.lv >= 3) return;
    const cost = d.up[def.lv - 1];
    if (B.crystals < cost) { B.toast('hud.need', true); RF.sfx('soft'); return; }
    B.crystals -= cost;
    def.spent += cost;
    def.lv++;
    const s = 1 + 0.08 * (def.lv - 1);
    def.obj.scale.setScalar(def.type === 'golem' ? 0.8 * s : s);
    const ring = RF.G.mesh(new THREE.TorusGeometry(def.type === 'archer' ? 1.15 : 0.9, 0.07, 4, 16), RF.G.M.gold, 0, def.type === 'archer' ? 1.72 + (def.lv - 2) * 0.12 : 0.45 + (def.lv - 2) * 0.15, 0, def.obj);
    ring.rotation.x = Math.PI / 2;
    if (def.type === 'golem') { const nl = d.levels[def.lv - 1]; def.max = nl.hp; def.hp = nl.hp; }
    if (def.type === 'frost') scaleFrost(def);
    RF.sfx('win');
    RF.metrics.support('upgrade');
    B.renderTop(); B.renderCards();
    B.showDefPopup(def);
  };
  B.sell = function (def) {
    const refund = Math.round(def.spent * 0.6);
    B.crystals += refund;
    B.world.dyn.remove(def.obj);
    if (def.label) def.label.remove();
    if (def.held) def.held.forEach(function (c) { c.held = null; });
    def.pad.def = null;
    B.defenders.splice(B.defenders.indexOf(def), 1);
    RF.sfx('back');
    B.closePopup();
    B.renderTop(); B.renderCards(); B.updatePads();
  };

  // ---------- Picking build spots ----------
  B.selectBuild = function (id) {
    B.closePopup();
    B.buildSel = id;
    B.padCursor = -1;
    if (id) {
      RF.sfx('select');
      B.showInfo(id);
      const d = B.U.defenders[id];
      RF.speak(d.name);
    } else B.info.style.display = 'none';
    B.renderCards();
    B.updatePads();
  };
  B.showInfo = function (id) {
    const d = B.U.defenders[id];
    const box = B.info;
    D.clear(box);
    box.style.display = '';
    box.style.bottom = (146 + B.locksBox.offsetHeight + 8) + 'px';
    const p = D.el('div', 'panel', null, box);
    p.style.cssText += ';padding:12px 14px;display:flex;flex-direction:column;gap:8px;border-color:#ffd76a';
    const nm = D.line(d.name, '', p);
    nm.querySelector('.txt').style.cssText = 'font-size:calc(20px * var(--ts));font-weight:700;color:#ffd76a';
    nm.appendChild(D.el('span', 'chip', D.CRYSTAL(16) + d.cost)).style.cssText += ';margin-left:auto;padding:2px 10px';
    D.line(d.desc, '', p);
    D.line(d.kind === 'tower' ? 'hud.spotTower' : 'hud.spotTrail', '', p).querySelector('.txt').style.color = '#9cf2c0';
    if (B.crystals < d.cost) D.line('hud.need', '', p).querySelector('.txt').style.color = '#ff9a9a';
  };
  function candidates() {
    if (!B.buildSel) return [];
    const kind = B.U.defenders[B.buildSel].kind;
    return B.world.pads.filter(function (p) { return !p.def && p.kind === kind; });
  }
  B.updatePads = function () {
    const cand = candidates();
    B.world.pads.forEach(function (p) {
      p.marker.visible = !p.def;
      p.ringMat.color.setHex(p.kind === 'tower' ? 0x7ef3ff : 0xd9a8ff);
      p.ringMat.opacity = B.buildSel ? (cand.indexOf(p) >= 0 ? 0.9 : 0.08) : 0.35;
    });
  };
  function animatePads() {
    if (!B.buildSel) return;
    const cand = candidates();
    const t = RF.app.time;
    cand.forEach(function (p, i) {
      const on = i === B.padCursor;
      p.ringMat.color.setHex(on ? 0xffffff : 0xffd76a);
      p.ringMat.opacity = on ? 1 : RF.settings.reducedMotion ? 0.85 : 0.6 + Math.abs(Math.sin(t * 3)) * 0.4;
    });
  }

  // ---------- Pointer ----------
  function pickPad(ev) {
    const v = new THREE.Vector2(ev.clientX / window.innerWidth * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(v, B.world.camera);
    const hits = ray.intersectObjects(B.world.pads.map(function (p) { return p.hit; }));
    return hits.length ? hits[0].object.userData.pad : null;
  }
  function onClick(ev) {
    if (!B.active || B.phase === 'done') return;
    const pad = pickPad(ev);
    if (!pad) { B.selectBuild(null); B.closePopup(); return; }
    if (pad.def) { B.selectBuild(null); B.showDefPopup(pad.def); return; }
    if (B.buildSel) {
      if (B.U.defenders[B.buildSel].kind === pad.kind) B.place(B.buildSel, pad);
      else { B.toast(pad.kind === 'tower' ? 'hud.wrongTower' : 'hud.wrongTrail', true); RF.sfx('soft'); }
      return;
    }
    B.showPadMenu(pad);
  }
  function onMove(ev) {
    if (!B.active) return;
    const pad = pickPad(ev);
    RF.app.renderer.domElement.style.cursor = pad ? 'pointer' : 'default';
  }
  function canvasOn() {
    const c = RF.app.renderer.domElement;
    c.onclick = onClick;
    c.onpointermove = onMove;
  }

  // ---------- Popups on the battlefield ----------
  function popupAt(x, y, z) {
    const p = screenOf(x, y, z);
    const s = RF.dom.scale;
    B.popup.style.left = (p.x / s) + 'px';
    B.popup.style.top = (p.y / s) + 'px';
    B.popup.style.display = '';
  }
  B.closePopup = function () {
    B.popup.style.display = 'none';
    D.clear(B.popup);
    B.selDef = null;
    if (B.rangeRing) B.rangeRing.visible = false;
  };
  // Tap an empty spot: build right there.
  B.showPadMenu = function (pad) {
    B.closePopup();
    const box = D.el('div', 'panel', null, B.popup);
    box.style.cssText += ';padding:10px;display:flex;gap:8px;border-color:#ffd76a';
    const ic = icons();
    B.L.defenders.forEach(function (id) {
      const d = B.U.defenders[id];
      if (d.kind !== pad.kind) return;
      const ok = B.crystals >= d.cost;
      const c = D.el('button', 'card', '<img alt="" src="' + ic[id] + '"><div class="n">' + D.esc(RF.t(d.name)) + '</div><div class="c">' + D.CRYSTAL(13) + '<span style="color:' + (ok ? '#7ef3ff' : '#ff8a8a') + '">' + d.cost + '</span></div>', box);
      c.style.height = '108px';
      c.addEventListener('click', function () { RF.speak(d.name); if (B.place(id, pad)) B.closePopup(); else B.showPadMenu(pad); });
    });
    const x = D.el('button', 'btn', '&#10005;', box);
    x.setAttribute('aria-label', 'Close');
    x.style.alignSelf = 'flex-start';
    x.addEventListener('click', function () { B.closePopup(); });
    popupAt(pad.x, 2.2, pad.z);
    RF.sfx('open');
  };
  B.showDefPopup = function (def) {
    B.closePopup();
    B.selDef = def;
    const d = B.U.defenders[def.type];
    const box = D.el('div', 'panel', null, B.popup);
    box.style.cssText += ';padding:10px 12px;display:flex;flex-direction:column;gap:8px;border-color:#ffd76a;min-width:240px';
    const nm = D.lineParts([{ id: d.name }, { id: 'hud.lv' }, { id: 'num.' + def.lv }], '', box, D.esc(RF.t(d.name)) + ' · ' + D.esc(RF.t('hud.lv')) + ' ' + def.lv);
    nm.querySelector('.txt').style.cssText = 'font-weight:700;color:#ffd76a;font-size:calc(17px * var(--ts))';
    const row = D.el('div', null, null, box);
    row.style.cssText = 'display:flex;gap:8px';
    if (def.lv < 3) {
      const cost = d.up[def.lv - 1];
      const ub = D.el('button', 'btn go', '&#11014; ' + D.esc(RF.t('hud.upgrade')) + ' ' + D.CRYSTAL(16) + '<span style="color:' + (B.crystals >= cost ? '#fff' : '#ffb0b0') + '">' + cost + '</span>', row);
      ub.addEventListener('click', function () { B.upgrade(def); });
      ub.focus({ preventScroll: true });
    } else D.line('hud.maxed', '', row);
    const sb = D.el('button', 'btn', D.esc(RF.t('hud.sell')) + ' +' + Math.round(def.spent * 0.6), row);
    sb.addEventListener('click', function () { B.sell(def); });
    const x = D.el('button', 'btn', '&#10005;', row);
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', function () { B.closePopup(); });
    popupAt(def.pad.x, def.type === 'archer' ? 5.2 : 3.4, def.pad.z);
    // Show its reach.
    const lvl = d.levels[def.lv - 1];
    const r = lvl.range || lvl.radius || 1.6;
    if (!B.rangeRing) {
      B.rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.9, depthWrite: false }));
      B.rangeRing.rotation.x = -Math.PI / 2;
      B.world.scene.add(B.rangeRing);
    }
    B.rangeRing.scale.set(r, r, 1);
    B.rangeRing.position.set(def.pad.x, 0.15, def.pad.z);
    B.rangeRing.visible = def.type !== 'golem';
    RF.speakSeq([{ id: d.name }, { id: 'hud.lv' }, { id: 'num.' + def.lv }]);
  };

  // ---------- Pause ----------
  B.setPaused = function (on) {
    if (B.phase === 'done') return;
    B.paused = on;
    RF.sfx(on ? 'back' : 'select');
    B.renderTop();
    const box = B.pausePanel;
    D.clear(box);
    box.style.display = on ? '' : 'none';
    if (!on) { RF.dom.navOff(box); return; }
    const p = D.el('div', 'panel', null, box);
    p.style.cssText += ';display:flex;flex-direction:column;gap:14px;align-items:center;min-width:420px';
    D.line('hud.paused', '', p).querySelector('.txt').style.fontSize = 'calc(22px * var(--ts))';
    D.button('hud.resume', function () { B.setPaused(false); }, 'big go', p).btn.dataset.first = '1';
    D.button('title.settings', function () { RF.screens.settings(function () { B.afterSettings(); }); }, '', p);
    D.button('hud.quit', function () { B.cleanup(); RF.screens.title(); }, '', p);
    RF.speak('hud.paused');
    RF.dom.nav(box, function () { B.setPaused(false); });
  };
  B.afterSettings = function () {
    RF.dom.applySettings();
    const st = B.forge ? B.forge.state() : null;
    B.forge.destroy();
    B.buildHUD(st);
    B.updatePads();
    B.setPaused(true);
  };

  // ---------- Mega Forge ----------
  B.megaBlast = function () {
    const G = RF.G;
    const flash = G.sprite(G.TEX.yellow, 70, -6, 12, 0, B.world.dyn, 0.95);
    B.fx.push({ life: 1.0, t: 0, update: function (f) { flash.material.opacity = 0.95 * (1 - f); flash.scale.setScalar(70 + f * 20); }, end: function () { B.world.dyn.remove(flash); } });
    const dmg = B.U.forge.megaBlast;
    B.creatures.slice().forEach(function (c) { hurt(c, dmg); burst(c.x, 1.2, c.z, G.TEX.yellow, 4); });
    if (!RF.settings.reducedMotion) B.shake = 0.4;
  };

  // ---------- Effects ----------
  function burst(x, y, z, tex, n) {
    const G = RF.G;
    if (RF.settings.reducedMotion) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const s = G.sprite(tex, 0.6, x, y, z, B.world.dyn, 0.9);
      const vx = (Math.random() - 0.5) * 4, vy = 1 + Math.random() * 3, vz = (Math.random() - 0.5) * 4;
      B.fx.push({ life: 0.5 + Math.random() * 0.3, t: 0, update: function (f, dt) { s.position.x += vx * dt; s.position.y += vy * dt; s.position.z += vz * dt; s.material.opacity = 0.9 * (1 - f); s.scale.setScalar(0.6 + f * 1.2); }, end: function () { B.world.dyn.remove(s); } });
    }
  }
  function hurt(c, dmg, showNum) {
    if (!c.alive) return;
    c.hp -= dmg;
    if (showNum) {
      const p = screenOf(c.x, 2.4, c.z);
      B.floatText('-' + Math.round(dmg), p.x, p.y, '#ffd76a', 20);
    }
    if (c.hp <= 0) kill(c, true);
  }
  function kill(c, byDefense) {
    c.alive = false;
    B.world.dyn.remove(c.obj);
    c.label.remove();
    if (c.held) { const h = c.held.held; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); c.held = null; }
    B.creatures.splice(B.creatures.indexOf(c), 1);
    if (byDefense) {
      const cd = B.U.creatures[c.type];
      B.kills++;
      B.shards += cd.shards;
      B.crystals += cd.shards;
      B.renderTop(); B.renderCards();
      burst(c.x, 1.0, c.z, RF.G.TEX.purple, c.type === 'wisp' ? 4 : 7);
      const p = screenOf(c.x, 2.0, c.z);
      B.floatText('+' + cd.shards, p.x, p.y, '#7ef3ff', 16, true);
    }
  }

  // ---------- Frame update ----------
  B.update = function (realDt) {
    const world = B.world;
    animatePads();
    let dt = B.paused || B.phase === 'done' ? 0 : realDt * B.speed * (RF.settings.focus ? 0.5 : 1);
    // Effects run on real time so menus still feel alive.
    for (let i = B.fx.length - 1; i >= 0; i--) {
      const e = B.fx[i];
      e.t += realDt * (B.paused ? 0 : 1);
      const f = Math.min(1, e.t / e.life);
      e.update(f, realDt);
      if (f >= 1) { if (e.end) e.end(); B.fx.splice(i, 1); }
    }
    // Camera shake
    const cam = world.camera;
    if (B.shake > 0) {
      B.shake -= realDt;
      RF.app.battleCam();
      cam.position.x += (Math.random() - 0.5) * 0.5;
      cam.position.y += (Math.random() - 0.5) * 0.5;
      if (B.shake <= 0) RF.app.battleCam();
    }
    if (!dt) return;

    // Spawns
    if (B.phase === 'wave') {
      B.waveTime += dt;
      while (B.queue.length && B.queue[0].at <= B.waveTime) { const q = B.queue.shift(); spawn(q.type, q.hp); }
    }
    const U = B.U;
    // Frost slows
    B.creatures.forEach(function (c) { c.slow = 1; c.tag = ''; });
    B.defenders.forEach(function (d) {
      if (d.type !== 'frost') return;
      const lv = U.defenders.frost.levels[d.lv - 1];
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range) { c.slow = Math.min(c.slow, lv.slow); c.tag = 'tag.slowed'; }
      });
    });
    // Golems hold creatures in place
    B.defenders.forEach(function (d) {
      if (d.type !== 'golem') return;
      const lv = U.defenders.golem.levels[d.lv - 1];
      if (d.down > 0) {
        d.down -= dt;
        if (d.down <= 0) { d.obj.visible = true; d.hp = d.max; popIn(d.obj); }
        return;
      }
      B.creatures.forEach(function (c) {
        if (c.held || d.held.length >= lv.hold) return;
        if (c.s >= d.pad.s - 1.6 && c.s <= d.pad.s - 0.4) { c.held = d; d.held.push(c); }
      });
      // Held creatures hit the golem; the golem hits back.
      let incoming = 0;
      d.held.forEach(function (c) { incoming += U.creatures[c.type].hit; });
      d.hp -= incoming * dt;
      if (!d.held.length) d.hp = Math.min(d.max, d.hp + U.defenders.golem.regen * dt);
      d.cd -= dt;
      if (d.cd <= 0 && d.held.length) {
        d.cd = 1 / lv.rate;
        hurt(d.held[0], lv.dmg, true);
        if (!RF.settings.reducedMotion) { d.obj.rotation.x = -0.25; setTimeout(function () { d.obj.rotation.x = 0; }, 160); }
      }
      if (d.hp <= 0) {
        d.down = U.defenders.golem.respawn;
        B.golemFalls++;
        d.obj.visible = false;
        burst(d.pad.x, 1.2, d.pad.z, RF.G.TEX.cyan, 6);
        d.held.forEach(function (c) { c.held = null; });
        d.held = [];
        RF.sfx('soft');
      }
    });
    // Spike pits
    B.defenders.forEach(function (d) {
      if (d.type !== 'spike') return;
      const lv = U.defenders.spike.levels[d.lv - 1];
      let any = false;
      B.creatures.slice().forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.radius) { hurt(c, lv.dps * dt); any = true; }
      });
      if (!RF.settings.reducedMotion) d.obj.position.y = any ? Math.abs(Math.sin(RF.app.time * 18)) * 0.15 : 0;
    });
    // Creatures move
    B.creatures.slice().forEach(function (c) {
      if (!c.alive || B.phase === 'done') return;
      if (c.held) {
        c.tag = 'tag.held';
        c.s = Math.min(c.s, c.held.pad.s - 0.9 - c.held.held.indexOf(c) * 0.5);
      } else c.s += c.speed * c.slow * dt;
      placeCreature(c);
      if (c.s >= world.path.len) {
        const cd = U.creatures[c.type];
        B.anchor -= cd.anchor;
        world.anchorFlash = 0.6;
        if (!RF.settings.reducedMotion) B.shake = 0.25;
        RF.sfx('back');
        kill(c, false);
        B.renderTop();
        if (B.anchor <= 0) return B.finish(false);
      }
    });
    if (B.phase === 'done') return;
    // Archer towers
    B.defenders.forEach(function (d) {
      if (d.type !== 'archer') return;
      const lv = U.defenders.archer.levels[d.lv - 1];
      d.cd -= dt;
      if (d.cd > 0) return;
      let best = null;
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range && (!best || c.s > best.s)) best = c;
      });
      if (!best) return;
      d.cd = 1 / lv.rate;
      const a = RF.G.arrow(d.pad.x, 3.2, d.pad.z, world.dyn);
      B.shots.push({ obj: a, target: best, dmg: lv.dmg, speed: 26, tx: best.x, tz: best.z });
    });
    // Arrows fly
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const sh = B.shots[i];
      if (sh.target.alive) { sh.tx = sh.target.x; sh.tz = sh.target.z; }
      const ty = sh.target.type === 'wisp' ? 1.4 : 1.0;
      const p = sh.obj.position;
      const dx = sh.tx - p.x, dy = ty - p.y, dz = sh.tz - p.z;
      const dist = Math.hypot(dx, dy, dz);
      const step = sh.speed * dt;
      if (dist <= step) {
        if (sh.target.alive) { hurt(sh.target, sh.dmg, true); burst(sh.tx, ty, sh.tz, RF.G.TEX.yellow, 2); }
        world.dyn.remove(sh.obj);
        B.shots.splice(i, 1);
      } else {
        p.x += dx / dist * step; p.y += dy / dist * step; p.z += dz / dist * step;
        sh.obj.lookAt(sh.tx, ty, sh.tz);
        sh.obj.rotateY(Math.PI);
      }
    }
    // Wave over?
    if (B.phase === 'wave' && !B.queue.length && !B.creatures.length) {
      if (B.finalWave) return B.finish(true);
      B.phase = 'between';
      B.renderTop();
      RF.sfx('win');
      B.toast('hud.waveCleared', true);
    }
  };

  // Move labels to follow things on the battlefield.
  B.afterRender = function () {
    const put = function (el, x, y, z) {
      const p = screenOf(x, y, z);
      el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-100%)';
    };
    put(B.anchorLabel, B.world.camp.x, 6.4, B.world.camp.z);
    put(B.riftLabel, B.world.rift.x, 4.5, B.world.rift.z);
    B.creatures.forEach(function (c) {
      put(c.label, c.x, c.type === 'wisp' ? 2.3 : 2.5, c.z);
      c.label.lastChild.firstChild.style.width = Math.max(0, c.hp / c.max * 100) + '%';
      const t = c.tag ? RF.t(c.tag) : '';
      if (c.label.firstChild.textContent !== t) {
        c.label.firstChild.textContent = t;
        c.label.firstChild.style.color = c.tag === 'tag.slowed' ? '#bff3ff' : '#ffd76a';
      }
    });
    B.defenders.forEach(function (d) {
      if (!d.label) return;
      put(d.label, d.pad.x, 3.2, d.pad.z);
      d.label.lastChild.firstChild.style.width = (d.down > 0 ? 0 : Math.max(0, d.hp / d.max * 100)) + '%';
      const t = d.down > 0 ? RF.t('tag.rebuild') : '';
      if (d.label.firstChild.textContent !== t) d.label.firstChild.textContent = t;
    });
    if (B.selDef && B.popup.style.display !== 'none') {
      const p = screenOf(B.selDef.pad.x, B.selDef.type === 'archer' ? 5.2 : 3.4, B.selDef.pad.z);
      B.popup.style.left = (p.x / RF.dom.scale) + 'px';
      B.popup.style.top = (p.y / RF.dom.scale) + 'px';
    }
  };

  // ---------- Keys ----------
  window.addEventListener('keydown', function (ev) {
    if (!B.active || B.phase === 'done' || document.querySelector('#ui .screen')) return;
    if (B.paused && B.pausePanel.style.display !== 'none' && (ev.key === 'Escape' || ev.key.indexOf('Arrow') === 0)) return;
    if (ev.key === 'Escape') {
      if (B.buildSel) B.selectBuild(null);
      else if (B.popup.style.display !== 'none') B.closePopup();
      else B.setPaused(!B.paused);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'p' || ev.key === 'P') { B.setPaused(!B.paused); return; }
    if (ev.key === 's' || ev.key === 'S') { B.startWave(); return; }
    if (B.buildSel) {
      const cand = candidates();
      if (cand.length && (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' || ev.key === 'ArrowUp')) {
        const step = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ? 1 : -1;
        B.padCursor = (B.padCursor + step + cand.length) % cand.length;
        ev.preventDefault();
        return;
      }
      if (ev.key === 'Enter' && B.padCursor >= 0 && cand[B.padCursor]) { B.place(B.buildSel, cand[B.padCursor]); ev.preventDefault(); return; }
    }
    if (B.forge && B.forge.key(ev)) ev.preventDefault();
  });

  // ---------- End ----------
  B.finish = function (win) {
    if (B.phase === 'done') return;
    B.phase = 'done';
    B.closePopup();
    B.selectBuild(null);
    const stars = !win ? 0 : B.anchor >= B.anchorMax ? 3 : B.anchor > B.anchorMax / 2 ? 2 : 1;
    const fs = B.forge.stats;
    const prev = RF.metrics.lastBattle(B.L.id);
    B.refreshLocks(true);
    RF.metrics.battleDone({
      id: B.L.id, result: win ? 'win' : 'lose', stars: stars, waves: B.wave, anchor: Math.max(0, B.anchor),
      words: fs.forged, firstTry: fs.firstTry, misses: fs.misses, help: fs.help, forgeCrystals: fs.crystals,
      patterns: fs.byPat, runes: fs.runes, runeFirst: fs.runeFirst, locks: B.locks.map(function (k) { return { pat: k.pat, first: k.first, done: k.done }; }),
      ms: Date.now() - B.started
    });
    RF.sfx(win ? 'win' : 'soft');
    setTimeout(function () {
      RF.screens.results({ win: win, stars: stars, stats: fs, L: B.L, levelIndex: B.levelIndex, locks: B.locks, waves: win ? B.wave : Math.max(0, B.wave - 1), prev: prev });
    }, win ? 700 : 900);
  };
  B.cleanup = function () {
    B.active = false;
    RF.stopSpeaking();
    clearTimeout(B.toastTimer);
    if (B.hud) { B.hud.remove(); B.hud = null; }
    D.clear(document.getElementById('labels'));
    const dyn = B.world.dyn;
    while (dyn.children.length) dyn.remove(dyn.children[0]);
    if (B.rangeRing) B.rangeRing.visible = false;
    B.world.pads.forEach(function (p) { p.def = null; p.marker.visible = true; p.ringMat.opacity = 0.35; p.ringMat.color.setHex(p.kind === 'tower' ? 0x7ef3ff : 0xd9a8ff); });
    const c = RF.app.renderer.domElement;
    c.onclick = null; c.onpointermove = null; c.style.cursor = 'default';
    RF.app.setView(0, 0);
  };

  // For testing: RF.battle.cheat(500) adds crystals.
  B.cheat = function (n) { B.crystals += n; B.renderTop(); B.renderCards(); };
})(window.RF);
