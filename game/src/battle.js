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
    app.useLevel(levelIndex || 0); // builds this level's 3D world if another one is showing
    const world = app.world;
    const L = RF.data.levels.levels[levelIndex || 0];
    const U = RF.data.units;
    B.L = L; B.U = U; B.world = world; B.levelIndex = levelIndex || 0;
    B.active = true;
    B.phase = 'build';
    B.crystals = L.startCrystals;
    B.anchorMax = L.anchor; B.anchor = L.anchor;
    B.wave = 0; B.waveTime = 0; B.queue = [];
    // Waves from reading (DESIGN.md 6): every waveEvery finished words or cards brings a wave.
    B.every = L.waveEvery || 10; B.readCount = 0; B.wavesDue = 0; B.dueT = 0;
    B.creatures = []; B.defenders = []; B.shots = []; B.fx = []; B.burns = [];
    B.paused = false; B.speed = 1; B.shake = 0;
    B.buildSel = null; B.selDef = null; B.padCursor = -1;
    B.kills = 0; B.shards = 0; B.started = Date.now();
    B.sealReady = false; B.sealDone = false; B.sealOpened = false; B.finalWave = false; B.locksFull = {}; B.golemFalls = 0; B.barricadeFalls = 0; B.seenFoes = {};
    world.pads.forEach(function (p) { p.def = null; p.marker.visible = true; });
    world.anchorFlash = 0;

    app.setView(374, 140);
    app.battleCam();
    B.buildHUD();
    B.refreshLocks(true);
    B.updatePads();
    canvasOn();
    // Locks can already be full from earlier play: say when the final wave will be.
    const bs = [{ id: L.story ? 'hud.buildStartCards' : 'hud.buildStart' }];
    B.toast(null, true, B.sealReady ? bs.concat(B.allFullParts()) : bs);
    RF.audio.music('calm');
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
    B.waveChip.addEventListener('click', function () {
      if (B.finalWave) return RF.speakSeq([{ id: 'hud.finalWave' }]);
      const parts = [{ id: 'hud.wave' }, D.num(Math.max(1, B.wave))];
      if (B.sealReady) parts.push({ id: 'res.of' }, D.num(B.finalWaveNum()));
      RF.speakSeq(parts);
    });
    const lv = D.el('div', 'chip', '', top);
    lv.style.cssText += ';font-size:14px;gap:8px;padding:4px 10px';
    // Story levels (World 8) show the world name only, since they have no level number in World 1.
    const wid = B.L.story ? 'level.world8short' : 'level.world1short';
    const tagParts = B.L.story ? [{ id: wid }] : [{ id: wid }, { id: 'level.n' + B.L.num }];
    lv.appendChild(D.speaker(function () { RF.speakSeq(tagParts.concat([{ id: B.L.name }])); }, true));
    D.el('div', null, '<span class="gold">' + tagParts.map(function (p) { return D.esc(RF.t(p.id)); }).join(' · ') + '</span><br>' + D.esc(RF.t(B.L.name)), lv).style.lineHeight = '1.2';
    const ctr = D.el('div', null, null, top);
    ctr.style.cssText = 'display:flex;gap:6px;margin-left:6px';
    // "Next wave in 7 words": waves come from reading, so the student always sees how close the next one is.
    B.nextChip = D.el('div', 'chip', '', ctr);
    B.nextChip.style.cssText += ';font-size:15px;padding:3px 10px;border-color:#c04dff;cursor:pointer';
    B.nextChip.addEventListener('click', function () { RF.speakSeq(B.nextParts()); });
    B.startBtn = D.el('button', 'btn start', '', ctr);
    B.startBtn.style.fontSize = '17px';
    B.startBtn.addEventListener('click', function () { B.callWave(); });
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
      onRead: function () { B.refreshLocks(false); B.readTick(); },
      onMega: function () { B.megaBlast(); },
      onSeal: function () { B.sealComplete(); },
      // Reading the Rift Seal aloud: the battle holds still so the reading is fair (DESIGN.md 7).
      onHold: function (on) {
        if (!!B.readHold === !!on) return;
        B.readHold = !!on;
        if (on) B.toast('read.hold', false);
      }
    });

    // Build bar
    const bar = auto(D.el('div', 'buildbar', null, hud));
    B.cards = {};
    const ic = icons();
    // Every built defender is on the bar. Ones the student has not unlocked yet show as locked cards.
    Object.keys(B.U.defenders).forEach(function (id) {
      const d = B.U.defenders[id];
      if (!RF.unlocks.defenderOpen(id)) {
        const c = D.el('button', 'card locked', '<img alt="" src="' + ic[id] + '"><div class="n">' + D.esc(RF.t(d.name)) + '</div><div class="c" style="color:#c9c3ff">&#128274; ' + D.esc(RF.t(d.unlock)) + '</div>', bar);
        c.addEventListener('click', function () { RF.speakSeq([{ id: d.name }, { id: 'hud.unlocksAt' }, { id: d.unlock }]); });
        return;
      }
      const c = D.el('button', 'card', '<img alt="" src="' + ic[id] + '"><div class="n">' + D.esc(RF.t(d.name)) + '</div><div class="c"></div>', bar);
      c.addEventListener('click', function () { B.selectBuild(B.buildSel === id ? null : id); });
      B.cards[id] = c;
    });
    // Not built yet: say when it opens, or "coming soon" once its level has been won.
    B.U.locked.forEach(function (lk) {
      const soon = RF.unlocks.won(lk.unlockBy);
      const label = soon ? 'hud.comingSoon' : lk.unlock;
      const c = D.el('button', 'card locked', '<img alt="" src="' + ic[lk.id] + '"><div class="n">' + D.esc(RF.t(lk.name)) + '</div><div class="c" style="color:#c9c3ff">&#128274; ' + D.esc(RF.t(label)) + '</div>', bar);
      c.addEventListener('click', function () { RF.speakSeq(soon ? [{ id: lk.name }, { id: label }] : [{ id: lk.name }, { id: 'hud.unlocksAt' }, { id: label }]); });
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
    B.defenders.forEach(function (d) { if (d.type === 'golem' || d.type === 'barricade') { d.label = makeBar(true); labels.appendChild(d.label); } });
    B.renderTop();
    B.renderCards();
    if (B.locks) B.renderLocks();
  };

  // ---------- Rift locks (mastery, DESIGN.md 5.1) ----------
  // One lock per vowel pattern in the level. A lock fills from the last reads of that pattern
  // (right on the first try, no help). When every lock is full, the final wave comes.
  B.refreshLocks = function (quiet) {
    const m = B.L.mastery;
    // Story levels have one lock, Story: 8 of the last 10 cards right on the first try with no help.
    B.locks = B.L.story ? (function () {
      const recent = RF.metrics.storyRecent(m.window);
      const first = recent.filter(Boolean).length;
      return [{ story: true, v: '', pat: 'story', recent: recent, first: first, done: first >= m.need || !!(B.locksFull && B.locksFull.story) }];
    })() : B.L.vowels.map(function (v) {
      const pat = 'cvc-' + v;
      const recent = RF.metrics.patternRecent(pat, m.window);
      const first = recent.filter(Boolean).length;
      // A lock that has filled stays full for the rest of this try (mastery was shown; DESIGN.md 5.1).
      return { v: v, pat: pat, recent: recent, first: first, done: first >= m.need || !!(B.locksFull && B.locksFull[pat]) };
    });
    if (!B.locksBox) return;
    B.renderLocks();
    B.locks.forEach(function (k) {
      if (k.done && !B.locksFull[k.pat]) {
        B.locksFull[k.pat] = true;
        const opening = B.L.story && !B.sealOpened && B.wave >= B.L.minWaves - 1;
        if (!quiet && !opening && (B.L.story || !B.locks.every(function (x) { return x.done; }))) { B.toast(null, true, [{ id: 'lock.oneFull' }, { id: 'pat.' + k.pat }]); RF.sfx('big'); }
      }
    });
    if (B.L.story) { B.checkSeal(quiet); return; }
    if (!B.sealReady && B.locks.every(function (x) { return x.done; })) {
      B.sealReady = true;
      if (!quiet) { B.toast(null, true, B.allFullParts()); RF.sfx('win'); }
      if (B.waveChip) B.renderTop();
    }
  };
  // Story levels: once the Story lock is full and enough waves have started, the Forge shows the Rift Seal.
  // Finishing the Seal makes the next wave the final one (sealReady). Locks alone never end the level.
  B.checkSeal = function (quiet) {
    if (!B.L.story || B.sealReady || B.sealOpened || !B.forge || !B.locks) return;
    if (!B.locks.every(function (x) { return x.done; })) return;
    if (B.wave < B.L.minWaves - 1) return;
    B.sealOpened = true;
    B.forge.startSeal();
    if (!quiet) { B.toast('seal.open', true); RF.sfx('big'); }
  };
  B.sealComplete = function () {
    B.sealDone = true;
    B.sealReady = true;
    // The Seal is the level's big read: the final wave comes right after it.
    if (!B.wavesDue) B.wavesDue = 1;
    B.readCount = 0;
    B.megaBlast();
    B.toast('seal.done', true);
    B.renderTop();
  };
  // The final wave comes once every lock is full, but never before the level's minimum wave.
  B.finalWaveNum = function () { return Math.max(B.L.minWaves, B.wave + 1); };
  // "All rift locks are full!" said the right way: the next wave is final, or which wave will be.
  B.allFullParts = function () {
    const n = B.finalWaveNum();
    return n === B.wave + 1 ? [{ id: 'lock.allFull' }] : [{ id: 'lock.allFullLater' }, D.num(n)];
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
      const letter = D.el('div', 'read', D.esc(k.story ? RF.t('pat.story') : k.v), row);
      letter.style.cssText = k.story ? 'font-size:calc(17px * var(--ts));font-weight:700;color:' + (k.done ? '#ffd76a' : '#fff') : 'font-size:calc(24px * var(--ts));font-weight:700;width:26px;text-align:center;color:' + (k.done ? '#ffd76a' : '#fff');
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
    // Once every lock is full, the chip counts down to the final wave: "Wave 1 of 3".
    B.waveChip.innerHTML = B.finalWave ? '<span class="gold">' + D.esc(RF.t('hud.finalWave')) + '</span>' : D.esc(RF.t('hud.wave')) + ' <span class="gold" style="font-size:22px">' + Math.max(1, B.wave) + '</span>' +
      (B.sealReady ? ' ' + D.esc(RF.t('res.of')) + ' <span class="gold" style="font-size:22px">' + B.finalWaveNum() + '</span>' : '');
    // Start wave is an early call: it shows between waves while no wave is already on its way.
    const showStart = (B.phase === 'build' || B.phase === 'between') && !B.wavesDue;
    B.startBtn.style.display = showStart ? '' : 'none';
    const nextFinal = B.sealReady && B.wave + 1 >= B.L.minWaves;
    B.startBtn.innerHTML = '&#9654; ' + (nextFinal ? D.esc(RF.t('hud.finalWave')) : D.esc(RF.t('hud.startWave')) + ' ' + (B.wave + 1));
    const left = B.every - B.readCount;
    // Two short lines so the top bar fits beside the Forge on a Chromebook screen.
    const small = function (t) { return '<span style="font-size:13px;color:#d9c8ff">' + D.esc(t) + '</span>'; };
    B.nextChip.innerHTML = '<div style="line-height:1.15;text-align:center">' + (B.wavesDue
      ? small(nextFinal ? RF.t('hud.finalWave') : RF.t('hud.wave') + ' ' + (B.wave + 1)) + '<br><span class="gold">' + D.esc(RF.t(B.phase === 'wave' ? 'hud.nextAfterShort' : 'hud.nextComing')) + '</span>'
      : small(RF.t('hud.nextIn')) + '<br><span class="gold" style="font-size:19px">' + left + '</span> ' + D.esc(RF.t(B.L.story ? (left === 1 ? 'hud.card' : 'hud.cards') : (left === 1 ? 'hud.word1' : 'hud.words')))) + '</div>';
    B.nextChip.style.display = B.finalWave ? 'none' : '';
    // Icon only, so the top bar fits beside the Forge (the pause panel says "Paused" out loud).
    B.pauseBtn.innerHTML = B.paused ? '&#9654;' : '&#10074;&#10074;';
    B.pauseBtn.title = RF.t(B.paused ? 'hud.resume' : 'hud.pause');
    B.pauseBtn.setAttribute('aria-label', B.pauseBtn.title);
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
  // A word or card was finished (right, after any number of tries). Tries never count, so guessing
  // does not bring waves faster. Reads during a wave count toward the next one.
  B.readTick = function () {
    if (B.phase === 'done' || B.finalWave) return;
    B.readCount++;
    if (B.readCount >= B.every) {
      B.readCount -= B.every;
      B.wavesDue++;
      if (B.phase !== 'wave') B.toast(null, true, B.nextParts());
    }
    if (B.waveChip) B.renderTop();
  };
  B.nextParts = function () {
    if (B.wavesDue) return [{ id: B.phase === 'wave' ? 'hud.nextAfter' : 'hud.nextComing' }];
    const left = B.every - B.readCount;
    return [{ id: 'hud.nextIn' }, D.num(left), { id: B.L.story ? (left === 1 ? 'hud.card' : 'hud.cards') : (left === 1 ? 'hud.word1' : 'hud.words') }];
  };
  // Start wave pressed: an early call. It brings the wave the student was reading toward,
  // so the count starts over. A wave already due just comes now.
  B.callWave = function () {
    if (!(B.phase === 'build' || B.phase === 'between')) return;
    if (B.wavesDue) B.wavesDue--; else B.readCount = 0;
    B.startWave();
  };
  B.startWave = function () {
    if (!(B.phase === 'build' || B.phase === 'between')) return;
    B.dueT = 0;
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
    RF.audio.fx('waveStart');
    if (!B.paused) RF.audio.music('attack');
    B.renderTop();
    B.toast(null, true, B.finalWave ? [{ id: 'hud.finalWave' }] : [{ id: 'hud.wave' }, D.num(B.wave)]);    if (B.L.story) B.checkSeal(false);
  };

  function spawn(type, hpScale) {
    const G = RF.G;
    const cdef = B.U.creatures[type];
    const hp = Math.round(cdef.hp * (hpScale || 1));
    const c = { type: type, hp: hp, max: hp, s: 0, speed: cdef.speed * (0.92 + Math.random() * 0.16), lane: (Math.random() - 0.5) * (type === 'wisp' ? 1.8 : 1.0), slow: 1, held: null, alive: true, bob: Math.random() * 6, shield: false, stun: 0 };
    if (type === 'thornback') c.obj = G.thornback(0, 0, B.world.dyn, 0.95);
    else if (type === 'bramble') c.obj = G.bramble(0, 0, B.world.dyn, 1.0);
    else if (type === 'brute') { c.obj = G.shieldBrute(0, 0, B.world.dyn); c.obj.scale.setScalar(1.15); c.shield = true; c.lane = (Math.random() - 0.5) * 0.5; }
    else c.obj = G.wisp(0, 1.4, 0, B.world.dyn);
    c.label = makeBar(false);
    if (type === 'bramble') c.label.lastChild.style.width = '26px'; // tiny bar for tiny creatures
    document.getElementById('labels').appendChild(c.label);
    B.creatures.push(c);
    placeCreature(c);
    // First time a newer creature shows up in a battle: say what it does and what beats it.
    if (!B.seenFoes[type]) {
      B.seenFoes[type] = true;
      if (RF.strings.en['hud.newFoe.' + type]) B.toast('hud.newFoe.' + type, true);
    }
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
      if (c.type === 'bramble') c.obj.position.y = RF.settings.reducedMotion ? 0 : Math.abs(Math.sin(RF.app.time * 9 + c.bob)) * 0.18; // little hops
    }
  }
  // How high a creature's middle is, for aiming and bolts.
  function heightOf(c) { return c.type === 'wisp' ? 1.4 : c.type === 'bramble' ? 0.5 : c.type === 'brute' ? 1.3 : 1.0; }

  // ---------- Defenders ----------
  function defModel(type, pad) {
    const G = RF.G;
    const y = pad.kind === 'tower' ? 0.45 : 0;
    let g;
    if (type === 'archer') g = G.archerTower(pad.x, pad.z, B.world.dyn);
    else if (type === 'frost') g = G.frostTotem(pad.x, pad.z, B.world.dyn);
    else if (type === 'spike') g = G.spikePit(pad.x, pad.z, B.world.dyn);
    else if (type === 'ember') g = G.emberCannon(pad.x, pad.z, B.world.dyn);
    else if (type === 'lightning') g = G.lightningSpire(pad.x, pad.z, B.world.dyn);
    else if (type === 'vine') g = G.vineSnare(pad.x, pad.z, B.world.dyn);
    else if (type === 'ballista') {
      g = G.ballista(pad.x, pad.z, B.world.dyn);
      g.children[1].rotation.order = 'YXZ'; // turn first, then tilt up, so it can aim any way
    }
    else if (type === 'shrine') g = G.healShrine(pad.x, pad.z, B.world.dyn);
    else if (type === 'barricade') g = G.barricade(pad.x, pad.z, B.world.dyn, pad.rot); // wall faces across the trail
    else {
      g = G.golem(pad.x, pad.z, B.world.dyn, 0.8);
      g.rotation.y = pad.rot - Math.PI;
    }
    g.position.y = y;
    return g;
  }
  B.place = function (type, pad) {
    const d = B.U.defenders[type];
    if (pad.def || d.kind !== pad.kind || !RF.unlocks.defenderOpen(type)) return false;
    if (B.crystals < d.cost) { B.toast('hud.need', true); RF.sfx('soft'); return false; }
    B.crystals -= d.cost;
    const def = { type: type, lv: 1, pad: pad, spent: d.cost, cd: 0.2, obj: defModel(type, pad) };
    if (type === 'frost') def.rings = def.obj.children.slice(-2); // the two range circles, kept so upgrade rings never get mixed up with them
    if (type === 'golem') {
      def.hp = d.levels[0].hp; def.max = def.hp; def.down = 0; def.held = [];
      def.label = makeBar(true);
      document.getElementById('labels').appendChild(def.label);
    }
    if (type === 'barricade') {
      def.hp = d.levels[0].hp; def.max = def.hp; def.held = [];
      def.label = makeBar(true);
      document.getElementById('labels').appendChild(def.label);
    }
    if (type === 'vine') { def.held = []; def.regrow = 0; }
    if (type === 'shrine') def.anchorT = 0;
    if (type === 'frost') scaleFrost(def);
    pad.def = def;
    B.defenders.push(def);
    popIn(def.obj);
    RF.audio.fx('build');
    RF.metrics.support('build');
    B.selectBuild(null);
    B.renderTop(); B.renderCards();
    return true;
  };
  function scaleFrost(def) {
    const r = stat(def).range;
    // The circles sit inside the totem, which grows with each level, so undo that growth here.
    const g = def.obj.scale.x || 1;
    def.rings.forEach(function (m) { m.scale.set(r / 3.7 / g, r / 3.7 / g, 1); });
  }
  // A defender's numbers right now: its level, or its tier 3 specialty (DESIGN.md 6A).
  function stat(def) {
    const d = B.U.defenders[def.type];
    if (!def.spec) return d.levels[def.lv - 1];
    if (!def.st) def.st = Object.assign({}, d.levels[2], d.spec[def.spec]);
    return def.st;
  }
  B.stat = stat;
  // A defender's size: grows a little with each level. A vine shrinks while it regrows.
  function applyScale(def) {
    const base = (def.type === 'golem' ? 0.8 : 1) * (1 + 0.08 * (def.lv - 1));
    def.obj.scale.setScalar(base * (def.regrow > 0 ? 0.55 : 1));
  }
  function popIn(obj) {
    if (RF.settings.reducedMotion) return;
    const target = obj.scale.x;
    obj.scale.setScalar(0.01);
    B.fx.push({ life: 0.35, t: 0, update: function (f) { obj.scale.setScalar(target * Math.min(1, 0.2 + f * 1.1)); }, end: function () { obj.scale.setScalar(target); } });
  }
  // The third upgrade (level 3 to 4) picks specialty 'a' or 'b'.
  B.upgrade = function (def, pick) {
    const d = B.U.defenders[def.type];
    if (def.lv >= 4 || (def.lv === 3 && !(d.spec && d.spec[pick]))) return;
    const cost = def.lv === 3 ? d.spec[pick].cost : d.up[def.lv - 1];
    if (B.crystals < cost) { B.toast('hud.need', true); RF.sfx('soft'); return; }
    B.crystals -= cost;
    def.spent += cost;
    def.lv++;
    if (def.lv === 4) { def.spec = pick; def.st = null; }
    applyScale(def);
    const RR = { archer: [1.15, 1.72, 0.12], ember: [1.3, 0.12, 0.15], lightning: [1.05, 0.2, 0.15], vine: [1.05, 0.15, 0.12], ballista: [1.3, 0.3, 0.15], shrine: [1.2, 0.2, 0.15], barricade: [1.15, 0.12, 0.1] };
    const rr = RR[def.type] || [0.9, 0.45, 0.15];
    const ring = RF.G.mesh(new THREE.TorusGeometry(rr[0], 0.07, 4, 16), RF.G.M.gold, 0, rr[1] + (def.lv - 2) * rr[2], 0, def.obj);
    ring.rotation.x = Math.PI / 2;
    if (def.spec) specCrown(def);
    if (def.type === 'golem' || def.type === 'barricade') { const nl = stat(def); def.max = nl.hp; def.hp = nl.hp; }
    if (def.type === 'frost') scaleFrost(def);
    RF.audio.fx(def.spec ? 'mega' : 'upgrade');
    if (def.spec) { B.toast(d.spec[pick].name, true); burst(def.pad.x, 2.5, def.pad.z, def.spec === 'a' ? RF.G.TEX.orange : RF.G.TEX.cyan, 10); }
    RF.metrics.support('upgrade');
    B.renderTop(); B.renderCards();
    B.showDefPopup(def);
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
  B.sell = function (def) {
    const refund = Math.round(def.spent * 0.6);
    B.crystals += refund;
    B.world.dyn.remove(def.obj);
    if (def.label) def.label.remove();
    if (def.held) def.held.forEach(function (c) { c.held = null; c.rooted = 0; c.rootedBy = null; });
    def.held = [];
    def.pad.def = null;
    if (B.selDef === def) B.selDef = null;
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
    B.popup.style.display = '';
    placePopup(screenOf(x, y, z));
  }
  // The popup sits above its defender, but never off the screen (the specialty choice is tall).
  function placePopup(p) {
    const s = RF.dom.scale, el = B.popup;
    const w = el.offsetWidth, h = el.offsetHeight;
    const vw = window.innerWidth / s, vh = window.innerHeight / s;
    el.style.left = Math.min(Math.max(p.x / s, w / 2 + 8), vw - w / 2 - 8) + 'px';
    el.style.top = Math.min(Math.max(p.y / s, h + 8), vh - 8) + 'px';
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
    Object.keys(B.U.defenders).forEach(function (id) {
      const d = B.U.defenders[id];
      if (d.kind !== pad.kind) return;
      if (!RF.unlocks.defenderOpen(id)) {
        const lc = D.el('button', 'card locked', '<img alt="" src="' + ic[id] + '"><div class="n">' + D.esc(RF.t(d.name)) + '</div><div class="c" style="color:#c9c3ff">&#128274; ' + D.esc(RF.t(d.unlock)) + '</div>', box);
        lc.style.height = '108px';
        lc.addEventListener('click', function () { RF.speakSeq([{ id: d.name }, { id: 'hud.unlocksAt' }, { id: d.unlock }]); });
        return;
      }
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
    // A specialty shows its own name in place of "Level 4".
    const head = def.spec ? [{ id: d.spec[def.spec].name }] : [{ id: d.name }, { id: 'hud.lv' }, { id: 'num.' + def.lv }];
    const nm = D.lineParts(head, '', box, def.spec ? D.esc(RF.t(d.spec[def.spec].name)) : D.esc(RF.t(d.name)) + ' · ' + D.esc(RF.t('hud.lv')) + ' ' + def.lv);
    nm.querySelector('.txt').style.cssText = 'font-weight:700;color:' + (def.spec === 'a' ? '#ffb46a' : def.spec === 'b' ? '#7ef3ff' : '#ffd76a') + ';font-size:calc(17px * var(--ts))';
    if (def.spec) D.line(d.spec[def.spec].desc, '', box).querySelector('.txt').style.cssText = 'font-size:calc(15px * var(--ts));max-width:320px;white-space:normal';
    // Level 3: the third upgrade is a choice of two specialties (DESIGN.md 6A).
    if (def.lv === 3 && d.spec) {
      box.style.minWidth = '360px';
      const ph = D.line('hud.pickSpec', '', box);
      ph.querySelector('.txt').style.cssText = 'font-size:calc(15px * var(--ts));color:#d9c8ff';
      let first = null;
      ['a', 'b'].forEach(function (k) {
        const sp = d.spec[k];
        const col = k === 'a' ? '#ffb46a' : '#7ef3ff';
        const opt = D.el('div', null, null, box);
        opt.style.cssText = 'display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;border:2px solid ' + col + ';background:rgba(10,12,30,.6)';
        opt.appendChild(D.speaker(function () { RF.speakSeq([{ id: sp.name }, { id: sp.desc }]); }, true));
        const txt = D.el('div', 'read', '<div style="font-weight:700;color:' + col + ';font-size:calc(16px * var(--ts))">' + D.esc(RF.t(sp.name)) + '</div><div style="font-size:calc(14px * var(--ts));line-height:1.3">' + D.esc(RF.t(sp.desc)) + '</div>', opt);
        txt.style.cssText += ';flex:1;max-width:270px;white-space:normal';
        const pb = D.el('button', 'btn go', D.esc(RF.t('hud.pick')) + ' ' + D.CRYSTAL(16) + '<span style="color:' + (B.crystals >= sp.cost ? '#fff' : '#ffb0b0') + '">' + sp.cost + '</span>', opt);
        pb.style.flex = 'none';
        pb.addEventListener('click', function () { B.upgrade(def, k); });
        if (!first) first = pb;
      });
      first.focus({ preventScroll: true });
    }
    const row = D.el('div', null, null, box);
    row.style.cssText = 'display:flex;gap:8px';
    if (def.lv < 3) {
      const cost = d.up[def.lv - 1];
      const ub = D.el('button', 'btn go', '&#11014; ' + D.esc(RF.t('hud.upgrade')) + ' ' + D.CRYSTAL(16) + '<span style="color:' + (B.crystals >= cost ? '#fff' : '#ffb0b0') + '">' + cost + '</span>', row);
      ub.addEventListener('click', function () { B.upgrade(def); });
      ub.focus({ preventScroll: true });
    } else if (def.lv >= 4) D.line('hud.maxed', '', row);
    const sb = D.el('button', 'btn', D.esc(RF.t('hud.sell')) + ' +' + Math.round(def.spent * 0.6), row);
    sb.addEventListener('click', function () { B.sell(def); });
    const x = D.el('button', 'btn', '&#10005;', row);
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', function () { B.closePopup(); });
    popupAt(def.pad.x, def.type === 'archer' ? 5.2 : 3.4, def.pad.z);
    // Show its reach.
    const lvl = stat(def);
    const r = lvl.range || lvl.radius || 1.6;
    if (!B.rangeRing) {
      B.rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.9, depthWrite: false }));
      B.rangeRing.rotation.x = -Math.PI / 2;
      B.world.scene.add(B.rangeRing);
    }
    B.rangeRing.scale.set(r, r, 1);
    B.rangeRing.position.set(def.pad.x, 0.15, def.pad.z);
    B.rangeRing.visible = def.type !== 'golem' && def.type !== 'barricade';
    RF.speakSeq(def.lv === 3 && d.spec ? head.concat([{ id: 'hud.specLast' }]) : head);
  };

  // ---------- Pause ----------
  B.setPaused = function (on) {
    if (B.phase === 'done') return;
    B.paused = on;
    RF.sfx(on ? 'back' : 'select');
    // Pause stops the music; it comes back in the right mood on Resume.
    RF.audio.music(on ? null : B.phase !== 'wave' ? 'calm' : 'attack');
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
    D.button('hud.quit', function () { const id = B.L.id; B.cleanup(); RF.map.show(RF.unlocks.stones().findIndex(function (st) { return st.id === id; })); }, '', p);
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
    B.creatures.slice().forEach(function (c) { hurt(c, dmg, false, 'break'); burst(c.x, 1.2, c.z, G.TEX.yellow, 4); });
    if (!RF.settings.reducedMotion) B.shake = 0.4;
    RF.audio.fx('mega');
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
  // src 'break' (ember splash, lightning, mega blast) pops a Shield Brute's shield first and then hits full.
  // Everything else (archers, spikes, golems) is cut while the shield is up.
  function hurt(c, dmg, showNum, src) {
    if (!c.alive) return;
    if (c.shield) {
      if (src === 'break') breakShield(c);
      else dmg *= 1 - (B.U.creatures[c.type].shieldCut || 0.8);
    }
    c.hp -= dmg;
    if (showNum) {
      const p = screenOf(c.x, 2.4, c.z);
      B.floatText('-' + Math.round(dmg), p.x, p.y, '#ffd76a', 20);
    }
    if (c.hp <= 0) kill(c, true);
  }
  function breakShield(c) {
    if (!c.shield) return;
    c.shield = false;
    (c.obj.userData.shield || []).forEach(function (m) { m.visible = false; });
    burst(c.x, 1.4, c.z, RF.G.TEX.purple, 8);
    burst(c.x, 1.4, c.z, RF.G.TEX.cyan, 4);
    RF.audio.fx('shieldBreak');
    if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.12);
  }
  // A bolt that fades out fast.
  function zap(a, b) {
    const grp = new THREE.Group();
    B.world.dyn.add(grp);
    RF.G.boltLine(a, b, grp, 0xfff7b0);
    RF.G.boltLine(a, b, grp, 0xffffff); // second jagged line makes the bolt thicker
    RF.G.sprite(RF.G.TEX.yellow, 2.4, b.x, b.y, b.z, grp, 0.9);
    const mats = [];
    grp.traverse(function (o) { if (o.material) { o.material.transparent = true; mats.push([o.material, o.material.opacity]); } });
    B.fx.push({ life: 0.22, t: 0, update: function (f) { mats.forEach(function (m) { m[0].opacity = m[1] * (1 - f); }); }, end: function () {
      grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      B.world.dyn.remove(grp);
    } });
    burst(b.x, b.y, b.z, RF.G.TEX.yellow, 2);
  }
  // Ember shell lands: hurt everything in the radius, pop shields, show an orange burst.
  function splash(x, z, lv) {
    const G = RF.G;
    B.creatures.slice().forEach(function (c) {
      if (Math.hypot(c.x - x, c.z - z) <= lv.radius) hurt(c, lv.dmg, c.max > 20, 'break');
    });
    burst(x, 0.8, z, G.TEX.orange, 8);
    if (lv.burnDps) {
      const spr = G.sprite(G.TEX.orange, lv.burnRadius * 2, x, 0.3, z, B.world.dyn, 0.7);
      B.burns.push({ x: x, z: z, r: lv.burnRadius, dps: lv.burnDps, life: lv.burnLife, spr: spr });
    }
    const ring = G.sprite(G.TEX.orange, lv.radius * 1.2, x, 0.6, z, B.world.dyn, 0.9);
    B.fx.push({ life: 0.35, t: 0, update: function (f) { ring.material.opacity = 0.9 * (1 - f); ring.scale.setScalar(lv.radius * (1.2 + f * 1.6)); }, end: function () { B.world.dyn.remove(ring); } });
    if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.08);
    RF.audio.fx('emberBoom');
  }
  function kill(c, byDefense) {
    c.alive = false;
    B.world.dyn.remove(c.obj);
    c.label.remove();
    if (c.held) { const h = c.held.held; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); c.held = null; }
    if (c.rootedBy) { const h = c.rootedBy.held; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); c.rootedBy = null; c.rooted = 0; }
    B.creatures.splice(B.creatures.indexOf(c), 1);
    if (byDefense) {
      const cd = B.U.creatures[c.type];
      B.kills++;
      // Kills never pay spendable crystals: reading is the only income during a level (Session 16).
      // Shards go to a bank for the Armory between levels (M6 part 4).
      B.shards += cd.shards;
      burst(c.x, 1.0, c.z, RF.G.TEX.purple, c.type === 'wisp' || c.type === 'bramble' ? 3 : 7);
      RF.audio.fx(c.type === 'wisp' ? 'wispDie' : c.type === 'bramble' ? 'brambleDie' : 'thornDie');
      const p = screenOf(c.x, 2.0, c.z);
      B.floatText('+' + cd.shards, p.x, p.y, '#e3b8ff', 15);
    }
  }

  // ---------- Frame update ----------
  B.update = function (realDt) {
    const world = B.world;
    animatePads();
    let dt = B.paused || B.readHold || B.phase === 'done' ? 0 : realDt * B.speed * (RF.settings.focus ? 0.5 : 1);
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

    // A wave earned by reading comes after a short breath (game time, so Pause and Focus slow it too).
    if ((B.phase === 'build' || B.phase === 'between') && B.wavesDue > 0) {
      B.dueT += dt;
      if (B.dueT >= (B.phase === 'build' ? 1.5 : 3)) { B.wavesDue--; B.startWave(); }
    }

    // Spawns
    if (B.phase === 'wave') {
      B.waveTime += dt;
      while (B.queue.length && B.queue[0].at <= B.waveTime) { const q = B.queue.shift(); spawn(q.type, q.hp); }
    }
    const U = B.U;
    // Shrine auras (tier 3): a War Shrine makes defenders in its ring fire faster; a Life Shrine
    // rebuilds fallen golems in its ring faster.
    B.defenders.forEach(function (d) { d.haste = 1; d.rebuild = 1; });
    B.defenders.forEach(function (d) {
      if (d.type !== 'shrine' || !d.spec) return;
      const lv = stat(d);
      B.defenders.forEach(function (o) {
        if (o === d || Math.hypot(o.pad.x - d.pad.x, o.pad.z - d.pad.z) > lv.range) return;
        if (lv.haste) o.haste = Math.max(o.haste, lv.haste);
        if (lv.rebuild) o.rebuild = Math.max(o.rebuild, lv.rebuild);
      });
    });
    // Frost slows (and Tar Pits slow what walks over them)
    B.creatures.forEach(function (c) { c.slow = 1; c.tag = ''; });
    B.defenders.forEach(function (d) {
      if (d.type !== 'spike') return;
      const lv = stat(d);
      if (!lv.slow) return;
      B.creatures.forEach(function (c) {
        if (c.type !== 'wisp' && Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.radius) { c.slow = Math.min(c.slow, lv.slow); c.tag = 'tag.slowed'; }
      });
    });
    B.defenders.forEach(function (d) {
      if (d.type !== 'frost') return;
      const lv = stat(d);
      let inRing = [];
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range) { c.slow = Math.min(c.slow, lv.slow); c.tag = 'tag.slowed'; d.chill = true; inRing.push(c); }
      });
      // Blizzard Totem: the cold hurts too.
      if (lv.dps) inRing.forEach(function (c) { hurt(c, lv.dps * dt); });
      // Glacier Totem: every few seconds, freeze everything in the ring (Shield Brutes thaw twice as fast).
      if (lv.freezeEvery) {
        d.frz = (d.frz || 0) + dt;
        if (d.frz >= lv.freezeEvery && inRing.length) {
          d.frz = 0;
          inRing.forEach(function (c) {
            if (!c.alive) return;
            c.stun = Math.max(c.stun, lv.freeze / (c.type === 'brute' ? 2 : 1)); c.stunTag = 'tag.frozen';
            burst(c.x, heightOf(c), c.z, RF.G.TEX.ice, 2);
          });
          RF.audio.fx('frost');
        }
      }
      if (d.chill) { RF.audio.fxEvery('frost', d.pad.id, 3.5); d.chill = false; }
    });
    // Golems hold creatures in place
    B.defenders.forEach(function (d) {
      if (d.type !== 'golem') return;
      const lv = stat(d);
      if (d.down > 0) {
        d.down -= dt * d.rebuild;
        if (d.down <= 0) { d.obj.visible = true; d.hp = d.max; popIn(d.obj); }
        return;
      }
      B.creatures.forEach(function (c) {
        if (c.held || c.rooted > 0 || d.held.length >= lv.hold) return;
        if (c.s >= d.pad.s - 1.6 && c.s <= d.pad.s - 0.4) { c.held = d; d.held.push(c); }
      });
      // Held creatures hit the golem; the golem hits back.
      let incoming = 0;
      d.held.forEach(function (c) { incoming += U.creatures[c.type].hit; });
      d.hp -= incoming * dt;
      if (!d.held.length) d.hp = Math.min(d.max, d.hp + U.defenders.golem.regen * dt);
      d.cd -= dt * d.haste;
      if (d.cd <= 0 && d.held.length) {
        d.cd = 1 / lv.rate;
        RF.audio.fxEvery('golem', d.pad.id, 0.5);
        // Quake Golem: every slam hits everything it holds.
        if (lv.quake) { d.held.slice().forEach(function (c) { hurt(c, lv.dmg, true); }); burst(d.pad.x, 0.4, d.pad.z, RF.G.TEX.orange, 4); if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.06); }
        else hurt(d.held[0], lv.dmg, true);
        if (!RF.settings.reducedMotion) { d.obj.rotation.x = -0.25; setTimeout(function () { d.obj.rotation.x = 0; }, 160); }
      }
      if (d.hp <= 0) {
        d.down = lv.respawn || U.defenders.golem.respawn;
        B.golemFalls++;
        d.obj.visible = false;
        burst(d.pad.x, 1.2, d.pad.z, RF.G.TEX.cyan, 6);
        d.held.forEach(function (c) { c.held = null; });
        d.held = [];
        RF.sfx('soft');
      }
    });
    // Barricades hold creatures like a golem, but never hit back, never heal and never come back.
    B.defenders.slice().forEach(function (d) {
      if (d.type !== 'barricade') return;
      const lv = stat(d);
      B.creatures.forEach(function (c) {
        if (c.held || c.rooted > 0 || d.held.length >= lv.hold) return;
        if (c.s >= d.pad.s - 1.6 && c.s <= d.pad.s - 0.4) { c.held = d; d.held.push(c); }
      });
      let incoming = 0;
      d.held.forEach(function (c) { incoming += U.creatures[c.type].hit; });
      d.hp -= incoming * dt;
      // Thorn Wall: thorns hurt everything it holds.
      if (lv.thorns) d.held.slice().forEach(function (c) { hurt(c, lv.thorns * dt); });
      if (d.hp <= 0) {
        d.held.forEach(function (c) { c.held = null; });
        d.held = [];
        burst(d.pad.x, 1.0, d.pad.z, RF.G.TEX.orange, 6);
        B.world.dyn.remove(d.obj);
        if (d.label) d.label.remove();
        if (B.selDef === d) B.closePopup();
        d.pad.def = null;
        B.defenders.splice(B.defenders.indexOf(d), 1);
        B.barricadeFalls++;
        RF.sfx('soft');
        B.updatePads();
      }
    });
    // Vine Snares root ground creatures that step into the ring, then regrow.
    B.defenders.forEach(function (d) {
      if (d.type !== 'vine') return;
      const spec = U.defenders.vine;
      const lv = stat(d);
      if (d.regrow > 0) {
        d.regrow -= dt;
        if (d.regrow <= 0) { d.regrow = 0; applyScale(d); }
        return;
      }
      if (!d.held.length) {
        B.creatures.forEach(function (c) {
          if (d.held.length >= lv.hold || c.type === 'wisp' || c.held || c.rooted > 0) return;
          if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) > lv.radius) return;
          c.rooted = lv.root / (c.type === 'brute' ? spec.bruteBreak : 1);
          c.rootedBy = d;
          d.held.push(c);
          burst(c.x, 0.6, c.z, RF.G.TEX.cyan, 2);
        });
        if (d.held.length) RF.audio.fxEvery('spike', d.pad.id, 0.7);
        return;
      }
      d.held.slice().forEach(function (c) {
        c.rooted -= dt;
        hurt(c, lv.dps * dt); // a kill takes it off d.held
        if (c.alive && c.rooted <= 0) { c.rooted = 0; c.rootedBy = null; d.held.splice(d.held.indexOf(c), 1); }
      });
      if (!d.held.length) { d.regrow = lv.regrow; applyScale(d); }
    });
    // Healing Shrines repair golems and barricades, and slowly mend the Rift Anchor during a wave.
    B.defenders.forEach(function (d) {
      if (d.type !== 'shrine') return;
      const lv = stat(d);
      d.fxT = (d.fxT || 0) - dt;
      B.defenders.forEach(function (o) {
        if ((o.type !== 'golem' && o.type !== 'barricade') || o.down > 0 || o.hp >= o.max) return;
        if (Math.hypot(o.pad.x - d.pad.x, o.pad.z - d.pad.z) > lv.range) return;
        o.hp = Math.min(o.max, o.hp + lv.heal * dt);
        if (d.fxT <= 0) burst(o.pad.x, 1.4, o.pad.z, RF.G.TEX.cyan, 2);
      });
      if (d.fxT <= 0) d.fxT = 0.8;
      if (B.phase === 'wave') {
        d.anchorT += dt;
        if (d.anchorT >= lv.anchorEvery) {
          d.anchorT = 0;
          if (B.anchor < B.anchorMax) {
            B.anchor++;
            B.renderTop();
            const p = screenOf(B.world.camp.x, 5.4, B.world.camp.z);
            B.floatText('+1', p.x, p.y, '#7dff9c', 24);
            RF.audio.fx('upgrade');
          }
        }
      }
    });
    // Spike pits
    B.defenders.forEach(function (d) {
      if (d.type !== 'spike') return;
      const lv = stat(d);
      let any = false;
      B.creatures.slice().forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.radius) { hurt(c, lv.dps * dt); any = true; }
      });
      if (any) RF.audio.fxEvery('spike', d.pad.id, 0.7);
      if (!RF.settings.reducedMotion) d.obj.position.y = any ? Math.abs(Math.sin(RF.app.time * 18)) * 0.15 : 0;
    });
    // Creatures move
    B.creatures.slice().forEach(function (c) {
      if (!c.alive || B.phase === 'done') return;
      if (c.held) {
        c.tag = 'tag.held';
        c.s = Math.min(c.s, c.held.pad.s - 0.9 - c.held.held.indexOf(c) * 0.5);
      } else if (c.rooted > 0) {
        c.tag = 'tag.rooted';
      } else if (c.stun > 0) {
        c.stun -= dt;
        c.tag = c.stunTag;
      } else c.s += c.speed * c.slow * dt;
      placeCreature(c);
      if (c.s >= world.path.len) {
        const cd = U.creatures[c.type];
        B.anchor -= cd.anchor;
        world.anchorFlash = 0.6;
        if (!RF.settings.reducedMotion) B.shake = 0.25;
        RF.audio.fx('anchorHit');
        kill(c, false);
        B.renderTop();
        if (B.anchor <= 0) return B.finish(false);
      }
    });
    if (B.phase === 'done') return;
    // Archer towers
    B.defenders.forEach(function (d) {
      if (d.type !== 'archer') return;
      const lv = stat(d);
      d.cd -= dt * d.haste;
      if (d.cd > 0) return;
      // Furthest along first. A Volley Tower shoots at the first few at once.
      const inR = B.creatures.filter(function (c) { return Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range; })
        .sort(function (a, b) { return b.s - a.s; }).slice(0, lv.multi || 1);
      if (!inR.length) return;
      d.cd = 1 / lv.rate;
      const sc = 1 + 0.08 * (d.lv - 1);
      inR.forEach(function (best) {
        const a = RF.G.arrow(d.pad.x, 3.2 * sc, d.pad.z, world.dyn);
        if (d.spec === 'a') a.scale.setScalar(1.6);
        B.shots.push({ obj: a, target: best, dmg: lv.dmg, speed: 26, tx: best.x, tz: best.z });
      });
      RF.audio.fxEvery('archer', d.pad.id, 0.3);
    });
    // Ballistas fire a heavy bolt at the toughest creature in range.
    B.defenders.forEach(function (d) {
      if (d.type !== 'ballista') return;
      const spec = U.defenders.ballista;
      const lv = stat(d);
      d.cd -= dt * d.haste;
      if (d.cd > 0) return;
      // Toughest first, but a shield soaks most of a bolt, so shielded ones count for less
      // (unless this is a Siege Ballista, whose bolts break shields).
      const worth = function (c) { return c.hp * (c.shield && !lv.breaks ? 1 - (U.creatures[c.type].shieldCut || 0.8) : 1); };
      let best = null;
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range && (!best || worth(c) > worth(best))) best = c;
      });
      if (!best) return;
      d.cd = 1 / lv.rate;
      const top = d.obj.children[1];
      top.rotation.set(0.2, Math.atan2(-(best.x - d.pad.x), -(best.z - d.pad.z)), 0);
      const a = RF.G.arrow(d.pad.x, 1.9 * (1 + 0.08 * (d.lv - 1)), d.pad.z, world.dyn);
      a.scale.setScalar(d.spec === 'a' ? 3.2 : 2.2);
      RF.audio.fxEvery('archer', d.pad.id, 0.3);
      B.shots.push({ obj: a, target: best, dmg: lv.dmg * (spec.big.indexOf(best.type) >= 0 ? (lv.bigBonus || spec.bigBonus) : 1), speed: spec.boltSpeed, tx: best.x, tz: best.z, src: lv.breaks ? 'break' : null });
    });
    // Ember Cannons lob a slow shell at the creature furthest along the trail.
    B.defenders.forEach(function (d) {
      if (d.type !== 'ember') return;
      const lv = stat(d);
      const sc = 1 + 0.08 * (d.lv - 1);
      d.cd -= dt * d.haste;
      if (d.cd > 0) return;
      let best = null;
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range && (!best || c.s > best.s)) best = c;
      });
      if (!best) return;
      d.cd = 1 / lv.rate;
      const sh = U.defenders.ember.shell;
      const from = Math.hypot(best.x - d.pad.x, best.z - d.pad.z);
      const T = Math.max(0.6, from / sh.speed);
      // Aim where it will be, unless it is held.
      let tx = best.x, tz = best.z;
      if (!best.held) { const p = world.path.at(Math.min(world.path.len, best.s + best.speed * best.slow * T), best.lane, tmp); tx = p.x; tz = p.z; }
      const yoke = d.obj.children[1];
      const ang = Math.atan2(-(tx - d.pad.x), -(tz - d.pad.z));
      yoke.rotation.y = ang;
      const sx = d.pad.x - Math.sin(ang) * 1.1 * sc, sz = d.pad.z - Math.cos(ang) * 1.1 * sc, sy = 2.1 * sc;
      const ball = RF.G.mesh(new THREE.SphereGeometry(0.26, 8, 6), RF.G.M.ember, sx, sy, sz, world.dyn);
      const glow = RF.G.sprite(RF.G.TEX.orange, 1.3, 0, 0, 0, ball, 0.9);
      B.shots.push({ shell: true, obj: ball, glow: glow, fx: sx, fy: sy, fz: sz, tx: tx, tz: tz, T: T, t: 0, lv: lv, arc: sh.arc, def: d });
      if (!RF.settings.reducedMotion) { yoke.position.z = 0.25; setTimeout(function () { yoke.position.z = 0; }, 120); }
      burst(sx, sy, sz, RF.G.TEX.orange, 2);
      RF.audio.fxEvery('ember', d.pad.id, 0.4);
    });
    // Lightning Spires zap the furthest creature, then jump to nearby ones.
    B.defenders.forEach(function (d) {
      if (d.type !== 'lightning') return;
      const spec = U.defenders.lightning;
      const lv = stat(d);
      d.cd -= dt * d.haste;
      if (d.cd > 0) return;
      let best = null;
      B.creatures.forEach(function (c) {
        if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range && (!best || c.s > best.s)) best = c;
      });
      if (!best) return;
      d.cd = 1 / lv.rate;
      const sc = 1 + 0.08 * (d.lv - 1);
      let prev = V3(d.pad.x, 0.45 + 4.1 * sc, d.pad.z);
      const hit = [best];
      let cur = best, dmg = lv.dmg;
      for (let j = 0; j <= lv.chain && cur; j++) {
        const pt = V3(cur.x, heightOf(cur), cur.z);
        zap(prev, pt);
        if (lv.stun) zap(prev, pt); // Thunder Spire: one fat bolt
        hurt(cur, dmg, true, 'break');
        if (lv.stun && cur.alive) { cur.stun = Math.max(cur.stun, lv.stun); cur.stunTag = 'tag.stunned'; }
        prev = pt;
        dmg *= lv.falloff || spec.falloff;
        let nxt = null, nd = spec.chainRange;
        B.creatures.forEach(function (c) {
          if (!c.alive || hit.indexOf(c) >= 0) return;
          const dd = Math.hypot(c.x - cur.x, c.z - cur.z);
          if (dd <= nd) { nd = dd; nxt = c; }
        });
        if (nxt) hit.push(nxt);
        cur = nxt;
      }
      RF.audio.fxEvery('lightning', d.pad.id, 0.4);
    });
    // Shells fly in an arc and splash where they land
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const sh = B.shots[i];
      if (!sh.shell) continue;
      sh.t += dt;
      const f = Math.min(1, sh.t / sh.T);
      sh.obj.position.set(sh.fx + (sh.tx - sh.fx) * f, sh.fy + (0.4 - sh.fy) * f + Math.sin(f * Math.PI) * sh.arc, sh.fz + (sh.tz - sh.fz) * f);
      if (f >= 1) {
        splash(sh.tx, sh.tz, sh.lv);
        sh.obj.geometry.dispose();
        world.dyn.remove(sh.obj);
        B.shots.splice(i, 1);
      }
    }
    // Burning ground from Inferno Cannon shells hurts creatures that walk through it (fliers pass over).
    for (let i = B.burns.length - 1; i >= 0; i--) {
      const b = B.burns[i];
      b.life -= dt;
      B.creatures.slice().forEach(function (c) {
        if (c.type !== 'wisp' && Math.hypot(c.x - b.x, c.z - b.z) <= b.r) hurt(c, b.dps * dt);
      });
      b.spr.material.opacity = 0.7 * Math.min(1, b.life / 0.8);
      if (b.life <= 0) { B.world.dyn.remove(b.spr); B.burns.splice(i, 1); }
    }
    // Arrows fly
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const sh = B.shots[i];
      if (sh.shell) continue;
      if (sh.target.alive) { sh.tx = sh.target.x; sh.tz = sh.target.z; }
      const ty = heightOf(sh.target);
      const p = sh.obj.position;
      const dx = sh.tx - p.x, dy = ty - p.y, dz = sh.tz - p.z;
      const dist = Math.hypot(dx, dy, dz);
      const step = sh.speed * dt;
      if (dist <= step) {
        if (sh.target.alive) { RF.audio.fxEvery('arrowHit', 'arrowHit', 0.09); hurt(sh.target, sh.dmg, true, sh.src); burst(sh.tx, ty, sh.tz, RF.G.TEX.yellow, 2); }
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
      RF.audio.fx('waveClear');
      RF.audio.music('calm');
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
      put(c.label, c.x, c.type === 'wisp' ? 2.3 : c.type === 'bramble' ? 1.5 : c.type === 'brute' ? 3.5 : 2.5, c.z);
      c.label.lastChild.firstChild.style.width = Math.max(0, c.hp / c.max * 100) + '%';
      // The shield tag always shows while the shield is up; slowed or held is added beside it.
      const t = c.shield ? RF.t('tag.shield') + (c.tag ? ' · ' + RF.t(c.tag) : '') : c.tag ? RF.t(c.tag) : '';
      if (c.label.firstChild.textContent !== t) {
        c.label.firstChild.textContent = t;
        c.label.firstChild.style.color = c.shield ? '#e3b8ff' : c.tag === 'tag.slowed' ? '#bff3ff' : c.tag === 'tag.rooted' ? '#9cf2c0' : c.tag === 'tag.frozen' ? '#bff3ff' : '#ffd76a';
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
      placePopup(screenOf(B.selDef.pad.x, B.selDef.type === 'archer' ? 5.2 : 3.4, B.selDef.pad.z));
    }
  };

  // ---------- Keys ----------
  window.addEventListener('keydown', function (ev) {
    if (!B.active || B.phase === 'done' || document.querySelector('#ui .screen')) return;
    if (B.paused && B.pausePanel.style.display !== 'none' && (ev.key === 'Escape' || ev.key.indexOf('Arrow') === 0)) return;
    if (ev.key === 'Escape' && B.forge && (B.forge.reading || B.forge.checking) && B.forge.key(ev)) { ev.preventDefault(); return; }
    if (ev.key === 'Escape') {
      if (B.buildSel) B.selectBuild(null);
      else if (B.popup.style.display !== 'none') B.closePopup();
      else B.setPaused(!B.paused);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'p' || ev.key === 'P') { B.setPaused(!B.paused); return; }
    if (ev.key === 's' || ev.key === 'S') { B.callWave(); return; }
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
      patterns: fs.byPat, runes: fs.runes, runeFirst: fs.runeFirst,
      story: B.L.story ? { cards: fs.cards, cardsFirst: fs.cardsFirst, cardsHelp: fs.cardsHelp, byType: fs.byType, sealDone: !!fs.sealDone, sealFirstTry: fs.sealFirstTry || 0, aloud: fs.aloud || 0, aloudWords: fs.aloudWords || 0, aloudRight: fs.aloudRight || 0, aloudMs: fs.aloudMs || 0, sealRead: fs.sealRead ? { tries: fs.sealRead.tries, firstWcpm: fs.sealRead.first.wcpm, bestWcpm: fs.sealRead.best.wcpm } : null } : undefined, locks: B.locks.map(function (k) { return { pat: k.pat, first: k.first, done: k.done }; }), shards: B.shards, kills: B.kills,
      ms: Date.now() - B.started
    });
    RF.audio.music(null);
    if (win) RF.audio.fx('win'); else RF.sfx('soft');
    setTimeout(function () {
      RF.screens.results({ win: win, stars: stars, stats: fs, L: B.L, levelIndex: B.levelIndex, locks: B.locks, waves: win ? B.wave : Math.max(0, B.wave - 1), prev: prev });
    }, win ? 700 : 900);
  };
  B.cleanup = function () {
    B.active = false;
    RF.audio.music(null);
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
