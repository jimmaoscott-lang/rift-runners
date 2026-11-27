// Hold the Rift battle (DESIGN.md sections 4.2, 6A, 6B). Rift creatures march down the trail toward
// the Rift Anchor. Crystals from the Rune Forge build defenders, and the defenders fight in real time.
// This file holds the rules only. B.view draws the battle: paint.js (painted map) or view3d.js (3D).
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;
  const B = { active: false };
  RF.battle = B;
  const tmp = {};
  function icons() { return B.view.icons(); }

  // ---------- Start ----------
  RF.startBattle = function (levelIndex, restore) {
    if (B.active) B.cleanup();
    const app = RF.app;
    const L = RF.data.levels.levels[levelIndex || 0];
    // Levels marked "painted" use the painted battlefield; ?3d keeps the old one for comparison.
    B.view = RF.paint && L.painted && !RF.use3d ? RF.paint : RF.view3d;
    const world = B.view.start(levelIndex || 0);
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
    B.paused = false; B.speed = RF.settings.speed === 2 ? 2 : 1; B.shake = 0; // 2x stays on between levels (bug B1)
    B.buildSel = null; B.selDef = null; B.padCursor = -1;
    B.kills = 0; B.shards = 0; B.started = Date.now();
    B.sealReady = false; B.sealDone = false; B.sealOpened = false; B.finalWave = false; B.locksFull = {}; B.golemFalls = 0; B.barricadeFalls = 0; B.seenFoes = {};
    // Rift Warden (DESIGN.md 6A): three powers charged only by reading.
    B.power = { rally: 0, meteor: 0, freeze: 0 }; B.rallyT = 0; B.freezeT = 0; B.powersUsed = 0;

    B.buildHUD();
    B.refreshLocks(true);
    B.updatePads();
    B.view.pointerOn();
    B.tut = null; B.tutHold = false; B.tutWave = null; B.waveOffset = 0;
    RF.audio.music('calm');
    // First time in Level 1 (or Replay tutorial): the tutorial takes over the opening (DESIGN.md 4.3).
    if (RF.tutorial && RF.tutorial.shouldRun(B.levelIndex)) { RF.tutorial.start(B); return; }
    // Locks can already be full from earlier play: say when the final wave will be.
    const bs = [{ id: L.story ? 'hud.buildStartCards' : 'hud.buildStart' }];
    B.toast(null, true, B.sealReady ? bs.concat(B.allFullParts()) : bs);
  };

  // ---------- Sound sliders ----------
  B.toggleVolume = function (force) {
    const open = force != null ? force : !B.volPanel;
    if (B.volPanel) { B.volPanel.remove(); B.volPanel = null; document.removeEventListener('pointerdown', B.volAway, true); }
    B.volBtn.classList.toggle('on', open);
    B.volBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) return;
    RF.sfx('tap');
    const st = RF.settings;
    const p = D.el('div', 'volPanel', null, B.volBtn.parentNode.parentNode);
    B.volPanel = p;
    p.addEventListener('click', function (ev) { ev.stopPropagation(); });
    [['settings.volume', 'volume', 8], ['settings.music', 'music', 6], ['settings.effects', 'effects', 8]].forEach(function (vr) {
      const key = vr[1];
      if (st[key] == null) st[key] = vr[2];
      const row = D.el('div', 'volRow', null, p);
      row.appendChild(D.speaker(function () { RF.speak(vr[0]); }, true));
      D.el('span', 'volName', D.esc(RF.t(vr[0])), row);
      const r = D.el('input', null, null, row);
      r.type = 'range'; r.min = '0'; r.max = '10'; r.step = '1'; r.value = String(st[key]);
      r.setAttribute('aria-label', RF.t(vr[0]));
      const val = D.el('span', 'volVal', String(st[key]), row);
      r.addEventListener('input', function () {
        st[key] = Number(r.value);
        val.textContent = r.value;
        if (RF.audio) RF.audio.applyVolumes();
        if (key === 'music' && B.active && !B.paused && st.music > 0 && RF.audio && !RF.audio.mood()) RF.audio.music(B.phase === 'wave' ? 'attack' : 'calm');
      });
      // When the student lets go: save, and give a sample of the new level.
      r.addEventListener('change', function () {
        RF.saveSettings();
        if (key === 'effects') RF.audio.fx('arrowHit');
        else if (key === 'volume') RF.speak(vr[0]);
      });
    });
    // Line the panel's right edge up with the button, so it stays clear of the Rune Forge.
    p.style.left = Math.max(0, B.volBtn.offsetLeft + B.volBtn.offsetWidth - p.offsetWidth) + 'px';
    // Tapping anywhere else closes the sliders.
    B.volAway = function (ev) { if (!p.contains(ev.target) && !B.volBtn.contains(ev.target)) B.toggleVolume(false); };
    document.addEventListener('pointerdown', B.volAway, true);
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
    B.speedBtn.addEventListener('click', function () { B.speed = B.speed === 1 ? 2 : 1; RF.settings.speed = B.speed; RF.saveSettings(); RF.sfx('tap'); B.renderTop(); });
    // Sound button: one tap opens Voice, Music and Effects sliders right on the battle screen
    // (November 22 plan, item 1). The battle keeps running; tap the button again or anywhere else to close.
    B.volBtn = D.el('button', 'btn', D.SPK, ctr);
    B.volBtn.classList.add('volBtn');
    B.volBtn.title = RF.t('hud.sound');
    B.volBtn.setAttribute('aria-label', B.volBtn.title);
    B.volBtn.setAttribute('aria-expanded', 'false');
    B.volBtn.addEventListener('click', function (ev) { ev.stopPropagation(); B.toggleVolume(); });
    B.focusChip = D.el('div', 'chip', '', ctr);
    B.focusChip.style.cssText += ';font-size:14px;border-color:#7ef3ff';

    B.toastBox = auto(D.el('div', 'toast', null, hud));
    B.toastBox.style.left = 'calc((100% - 374px) / 2)';
    // Battle messages sit small beside the power buttons, out of the fight (Mr. Scott, Session 17).
    // With Battle captions off (the default) the narrator only says them.
    B.toastBox.style.cssText += ';top:76px;left:368px;right:396px;transform:none;display:flex;justify-content:flex-start';

    // Rune Forge
    const fhost = auto(D.el('div', null, null, hud));
    B.forge = new RF.Forge(fhost, {
      level: B.L,
      restore: forgeRestore,
      onPay: function (amount, fromEl) { B.pay(amount, fromEl); },
      onRead: function () { B.refreshLocks(false); B.readTick(); if (B.tut) B.tut.on('read'); },
      noRunes: function () { return !!(B.tut && B.tut.noRunes()); },
      onMega: function () { B.megaBlast(); },
      onSeal: function () { B.sealComplete(); },
      // Reading the Rift Seal aloud: the battle holds still so the reading is fair (DESIGN.md 7).
      onHold: function (on, quiet) {
        if (!!B.readHold === !!on) return;
        B.readHold = !!on;
        if (on && !quiet) B.toast('read.hold', false);
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
      c.addEventListener('click', function () { B.selectBuild(B.buildSel === id && !(B.tut && B.tut.step === 2) ? null : id); });
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
    B.powerBox = auto(D.el('div', null, null, hud));
    B.powerBox.style.cssText += ';position:absolute;left:12px;top:74px;display:flex;gap:8px;align-items:stretch';
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
    B.view.relabel();
    B.renderTop();
    B.renderCards();
    B.renderPowers();
    if (B.locks) B.renderLocks();
    if (B.tut) B.tut.rebuilt();
  };

  // ---------- Rift Warden powers ----------
  // Every finished word (or story card) charges all three powers. Called from readTick.
  B.chargePowers = function () {
    const H = B.U.hero;
    const add = B.L.story ? H.storyCharge : 1;
    Object.keys(B.power).forEach(function (k) {
      const need = H.powers[k].charge;
      const was = B.power[k];
      B.power[k] = Math.min(need, was + add);
      if (was < need && B.power[k] >= need) { RF.sfx('big'); B.flashPower = k; }
    });
    B.renderPowers();
  };
  B.renderPowers = function () {
    const box = B.powerBox;
    if (!box) return;
    const H = B.U.hero;
    D.clear(box);
    const live = B.phase === 'wave';
    Object.keys(H.powers).forEach(function (k) {
      const pw = H.powers[k];
      const have = B.power[k], ready = have >= pw.charge;
      const col = { rally: '#ffd76a', meteor: '#ffb46a', freeze: '#7ef3ff' }[k];
      const ic = { rally: '&#9876;', meteor: '&#9732;', freeze: '&#10052;' }[k];
      const b = D.el('button', 'btn' + (ready && live ? ' go' : ''), null, box);
      b.style.cssText += ';display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 10px;min-width:96px;font-size:14px;border-color:' + col + (ready ? '' : ';opacity:.85');
      b.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:20px;color:' + col + '">' + ic + '</span><span class="read" style="font-weight:700">' + D.esc(RF.t(pw.name)) + '</span></div>' +
        '<div style="width:100%;height:7px;border-radius:4px;background:#2a2a55;overflow:hidden"><i style="display:block;height:100%;width:' + Math.round(have / pw.charge * 100) + '%;background:' + col + '"></i></div>' +
        '<div style="font-size:12px;color:#d9c8ff">' + (ready ? D.esc(RF.t('hero.ready')) : have + '/' + pw.charge) + '</div>';
      b.title = RF.t(pw.desc);
      b.addEventListener('click', function () { B.usePower(k); });
    });
  };
  B.usePower = function (k) {
    const H = B.U.hero, pw = H.powers[k];
    if (B.phase === 'done') return;
    // Not ready or no wave: say what it does and how to charge it (every button can be heard).
    if (B.power[k] < pw.charge) { RF.speakSeq([{ id: pw.name }, { id: pw.desc }, D.num(pw.charge - B.power[k]), { id: 'hero.needWords' }]); return; }
    if (B.phase !== 'wave' || !B.creatures.length) { RF.speakSeq([{ id: pw.name }, { id: 'hero.waitWave' }]); RF.sfx('soft'); return; }
    B.power[k] = 0;
    B.powersUsed++;
    RF.speak(pw.name);
    wardenCast(k);
    if (k === 'rally') { B.rallyT = pw.time; RF.audio.fx('upgrade'); }
    else if (k === 'freeze') {
      B.freezeT = pw.time;
      B.creatures.forEach(function (c) { c.stun = Math.max(c.stun, pw.time); c.stunTag = 'tag.frozen'; burst(c.x, heightOf(c), c.z, 'ice', 2); });
      RF.audio.fx('frost');
      B.view.freezeFlash();
    } else meteor(pw);
    B.renderPowers();
  };
  function wardenCast(k) {
    B.view.heroCast({ rally: 'yellow', meteor: 'orange', freeze: 'ice' }[k]);
  }
  // Meteor falls on the biggest group (most creatures within its blast, tougher ones count more).
  function meteor(pw) {
    let best = null, bestV = -1;
    B.creatures.forEach(function (c) {
      let v = 0;
      B.creatures.forEach(function (o) { if (Math.hypot(o.x - c.x, o.z - c.z) <= pw.radius) v += 1 + o.hp / 100; });
      if (v > bestV) { bestV = v; best = c; }
    });
    if (!best) return;
    const tx = best.x, tz = best.z;
    B.view.meteor(tx, tz, pw.radius, 0.7);
    B.fx.push({ life: 0.7, t: 0, update: function () {},
      end: function () {
        if (B.phase === 'done') return;
        B.creatures.slice().forEach(function (c) { if (Math.hypot(c.x - tx, c.z - tz) <= pw.radius) hurt(c, pw.dmg, true, 'break'); });
        B.view.meteorHit(tx, tz, pw.radius);
        if (!RF.settings.reducedMotion) B.shake = 0.35;
        RF.audio.fx('emberBoom'); RF.audio.fx('mega');
      } });
  }

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

  B.renderTop = function () {
    B.crystalChip.innerHTML = D.CRYSTAL(30) + ' <span class="cyan">' + B.crystals + '</span>';
    // Once every lock is full, the chip counts down to the final wave: "Wave 1 of 3".
    B.waveChip.innerHTML = B.finalWave ? '<span class="gold">' + D.esc(RF.t('hud.finalWave')) + '</span>' : D.esc(RF.t('hud.wave')) + ' <span class="gold" style="font-size:22px">' + Math.max(1, B.wave) + '</span>' +
      (B.sealReady ? ' ' + D.esc(RF.t('res.of')) + ' <span class="gold" style="font-size:22px">' + B.finalWaveNum() + '</span>' : '');
    // Start wave is an early call: it shows between waves while no wave is already on its way.
    const showStart = (B.phase === 'build' || B.phase === 'between') && !B.wavesDue && (!B.tut || B.tut.allowStart());
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
    const p = parts || [{ id: id }];
    if (speakIt) RF.speakSeq(p);
    // Captions off: spoken lines are voice only. Lines that are never spoken still show.
    if (speakIt && !RF.settings.captions) return;
    D.clear(B.toastBox);
    const row = D.lineParts(p, 'chip', B.toastBox);
    row.style.cssText += ';font-size:15px;padding:5px 12px;border-color:#ffd76a;background:rgba(14,16,40,.82)';
    row.querySelector('.txt').style.fontSize = 'calc(15px * var(--ts))';
    clearTimeout(B.toastTimer);
    B.toastTimer = setTimeout(function () { D.clear(B.toastBox); }, 4500);
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
    // A soft cap keeps big waves smooth: damage and shard numbers are skipped when many are up.
    if (!crystal && document.getElementById('labels').childElementCount > 30) return;
    const e = D.el('div', 'float', (crystal ? '' : '') + D.esc(text) + (crystal ? ' ' + D.CRYSTAL(size * 0.8) : ''), document.getElementById('labels'));
    e.style.cssText += ';left:' + x + 'px;top:' + y + 'px;color:' + color + ';font-size:' + size + 'px;display:flex;align-items:center;gap:4px';
    setTimeout(function () { e.remove(); }, 1000);
  };
  B.screenOf = function (x, y, z) { return screenOf(x, y, z); };
  function screenOf(x, y, z) { return B.view.screenOf(x, y, z); }

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
    if (B.phase !== 'done') B.chargePowers();
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
    if (B.tut && !B.tut.allowStart()) return;
    // The tutorial's small first wave stands in for wave 1, so real wave 1 comes next.
    if (B.tut) { B.tutWave = B.tut.wave; B.waveOffset = 1; }
    if (B.wavesDue) B.wavesDue--; else B.readCount = 0;
    B.startWave();
  };
  B.startWave = function () {
    if (!(B.phase === 'build' || B.phase === 'between')) return;
    B.dueT = 0;
    B.finalWave = B.sealReady && B.wave + 1 >= B.L.minWaves;
    let w = B.tutWave || B.waveDef(Math.max(1, B.wave + 1 - B.waveOffset));
    B.tutWave = null;
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
    B.renderTop(); B.renderPowers();
    if (B.tut) B.tut.on('wave');
    else B.toast(null, true, B.finalWave ? [{ id: 'hud.finalWave' }] : [{ id: 'hud.wave' }, D.num(B.wave)]);    if (B.L.story) B.checkSeal(false);
  };

  // Fliers (Rift Bats, "air" in units.json) pass over Spike Pits, Tar Pits, Golems, Barricades,
  // Vine Snares and burning ground, and Ember Cannons cannot aim at them. Wisps only skip the
  // snares, tar and fire, as before.
  function isAir(c) { return !!B.U.creatures[c.type].air; }
  function onGround(c) { return c.type !== 'wisp' && !isAir(c); }
  function addShot(sh) { B.view.addShot(sh); B.shots.push(sh); }
  function spawn(type, hpScale, at) {
    const cdef = B.U.creatures[type];
    const hp = Math.round(cdef.hp * (hpScale || 1));
    const wide = type === 'wisp' ? 1.8 : type === 'bat' ? 2.2 : 1.0;
    // A shorter painted trail slows creatures so the walk takes as long as before (DESIGN.md 13.1).
    const pace = B.view.kind === 'paint' ? B.L.trailTime || 1 : 1;
    const c = { type: type, hp: hp, max: hp, hpScale: hpScale || 1, s: at ? at.s : 0, speed: cdef.speed * pace * (0.92 + Math.random() * 0.16), lane: at ? at.lane : (Math.random() - 0.5) * wide, slow: 1, held: null, alive: true, bob: Math.random() * 6, shield: false, stun: 0 };
    if (type === 'brute') { c.shield = true; c.lane = (Math.random() - 0.5) * 0.5; }
    B.view.addCreature(c);
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
    B.view.moveCreature(c, p);
  }
  // How high a creature's middle is, for aiming and bolts.
  function heightOf(c) { return c.type === 'wisp' ? 1.4 : c.type === 'bat' ? 2.4 : c.type === 'bramble' || c.type === 'splitling' ? 0.5 : c.type === 'brute' ? 1.3 : 1.0; }

  // ---------- Defenders ----------
  B.place = function (type, pad) {
    const d = B.U.defenders[type];
    if (pad.def || d.kind !== pad.kind || !RF.unlocks.defenderOpen(type)) return false;
    if (!B.view.canBuild(pad)) return false;
    if (B.tut && !B.tut.allowBuild(type)) { RF.sfx('soft'); return false; }
    if (B.crystals < d.cost) { B.toast('hud.need', true); RF.sfx('soft'); return false; }
    B.crystals -= d.cost;
    const def = { type: type, lv: 1, pad: pad, spent: d.cost, cd: 0.2 };
    if (type === 'golem') { def.hp = d.levels[0].hp; def.max = def.hp; def.down = 0; def.held = []; }
    if (type === 'barricade') { def.hp = d.levels[0].hp; def.max = def.hp; def.held = []; }
    if (type === 'vine') { def.held = []; def.regrow = 0; }
    if (type === 'shrine') def.anchorT = 0;
    pad.def = def;
    B.view.addDefender(def);
    if (type === 'frost') scaleFrost(def);
    B.defenders.push(def);
    B.view.popIn(def);
    RF.audio.fx('build');
    RF.metrics.support('build');
    B.selectBuild(null);
    B.renderTop(); B.renderCards();
    if (B.tut) B.tut.on('build', type);
    return true;
  };
  function scaleFrost(def) { B.view.frostRange(def, stat(def).range); }
  // A defender's numbers right now: its level, or its tier 3 specialty (DESIGN.md 6A).
  function stat(def) {
    const d = B.U.defenders[def.type];
    if (!def.spec) return d.levels[def.lv - 1];
    if (!def.st) def.st = Object.assign({}, d.levels[2], d.spec[def.spec]);
    return def.st;
  }
  B.stat = stat;
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
    B.view.upgradeDefender(def);
    if (def.type === 'golem' || def.type === 'barricade') { const nl = stat(def); def.max = nl.hp; def.hp = nl.hp; }
    if (def.type === 'frost') scaleFrost(def);
    RF.audio.fx(def.spec ? 'mega' : 'upgrade');
    if (def.spec) { B.toast(d.spec[pick].name, true); burst(def.pad.x, 2.5, def.pad.z, def.spec === 'a' ? 'orange' : 'cyan', 10); }
    RF.metrics.support('upgrade');
    B.renderTop(); B.renderCards();
    B.showDefPopup(def);
  };
  B.sell = function (def) {
    const refund = Math.round(def.spent * 0.6);
    B.crystals += refund;
    B.view.removeDefender(def);
    if (def.held) def.held.forEach(function (c) { c.held = null; c.rooted = 0; c.rootedBy = null; });
    def.held = [];
    def.pad.def = null;
    B.view.releasePad(def.pad);
    if (B.selDef === def) B.selDef = null;
    B.defenders.splice(B.defenders.indexOf(def), 1);
    RF.sfx('back');
    B.closePopup();
    B.renderTop(); B.renderCards(); B.updatePads();
  };

  // ---------- Picking build spots ----------
  B.selectBuild = function (id) {
    if (id && B.tut && !B.tut.allowBuild(id)) { RF.sfx('soft'); return; }
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
    if (B.tut) B.tut.on('select', id);
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
    D.line(B.view.spotLine(d.kind), '', p).querySelector('.txt').style.color = '#9cf2c0';
    if (B.crystals < d.cost) D.line('hud.need', '', p).querySelector('.txt').style.color = '#ff9a9a';
  };
  // Open places for the picked defender: stone pads (3D) or suggested spots (painted map).
  // The arrow keys step through them, and the balance simulator builds on them.
  function candidates() {
    if (!B.buildSel) return [];
    return B.view.spots(B.U.defenders[B.buildSel].kind);
  }
  B.candidates = candidates;
  B.updatePads = function () { B.view.updatePads(candidates()); };
  function animatePads() {
    if (!B.buildSel) return;
    B.view.animatePads(candidates(), B.padCursor);
  }

  // ---------- Popups on the battlefield ----------
  function popupAt(x, y, z, idleSecs) {
    B.popup.style.display = '';
    placePopup(screenOf(x, y, z));
    // Popups close on their own after a while with no touch (Mr. Scott, Nov 22), so the battle
    // is never left covered. A pointer resting on the popup holds it open.
    clearTimeout(B.popTimer);
    const secs = idleSecs || 8;
    const arm = function () { clearTimeout(B.popTimer); B.popTimer = setTimeout(function () { if (!B.popup.matches(':hover')) B.closePopup(); else arm(); }, secs * 1000); };
    B.popup.onpointerdown = arm;
    arm();
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
    clearTimeout(B.popTimer);
    B.popup.style.display = 'none';
    D.clear(B.popup);
    B.selDef = null;
    if (B.view) B.view.hideRange();
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
    // Nothing left to buy: just a quick look, so it goes away sooner.
    popupAt(def.pad.x, B.view.defTop(def), def.pad.z, def.lv >= 4 ? 3 : 8);
    // Show its reach.
    const lvl = stat(def);
    const r = lvl.range || lvl.radius || 1.6;
    if (def.type !== 'golem' && def.type !== 'barricade') B.view.showRange(def, r);
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
    B.view.megaFlash();
    const dmg = B.U.forge.megaBlast;
    B.creatures.slice().forEach(function (c) { hurt(c, dmg, false, 'break'); burst(c.x, 1.2, c.z, 'yellow', 4); });
    if (!RF.settings.reducedMotion) B.shake = 0.4;
    RF.audio.fx('mega');
  };

  // ---------- Effects ----------
  function burst(x, y, z, color, n) { B.view.burst(x, y, z, color, n); }
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
      B.view.hitCreature(c, dmg);
      const p = screenOf(c.x, 2.4, c.z);
      B.floatText('-' + Math.round(dmg), p.x, p.y, '#ffd76a', 20);
    }
    if (c.hp <= 0) kill(c, true);
  }
  function breakShield(c) {
    if (!c.shield) return;
    c.shield = false;
    B.view.breakShield(c);
    burst(c.x, 1.4, c.z, 'purple', 8);
    burst(c.x, 1.4, c.z, 'cyan', 4);
    RF.audio.fx('shieldBreak');
    if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.12);
  }
  // Ember shell lands: hurt everything in the radius, pop shields, show an orange burst.
  function splash(x, z, lv) {
    B.creatures.slice().forEach(function (c) {
      if (!isAir(c) && Math.hypot(c.x - x, c.z - z) <= lv.radius) hurt(c, lv.dmg, c.max > 20, 'break');
    });
    burst(x, 0.8, z, 'orange', 8);
    if (lv.burnDps) {
      const b = { x: x, z: z, r: lv.burnRadius, dps: lv.burnDps, life: lv.burnLife };
      B.view.burnAdd(b);
      B.burns.push(b);
    }
    B.view.splashRing(x, z, lv.radius);
    if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.08);
    RF.audio.fx('emberBoom');
  }
  function kill(c, byDefense) {
    c.alive = false;
    B.view.removeCreature(c, byDefense);
    if (c.held) { const h = c.held.held; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); c.held = null; }
    if (c.rootedBy) { const h = c.rootedBy.held; const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); c.rootedBy = null; c.rooted = 0; }
    B.creatures.splice(B.creatures.indexOf(c), 1);
    if (byDefense) {
      const cd = B.U.creatures[c.type];
      B.kills++;
      // Kills never pay spendable crystals: reading is the only income during a level (Session 16).
      // Shards go to a bank for the Armory between levels (M6 part 4).
      B.shards += cd.shards;
      const small = c.type === 'wisp' || c.type === 'bramble' || c.type === 'bat' || c.type === 'splitling';
      burst(c.x, heightOf(c), c.z, 'purple', small ? 3 : 7);
      RF.audio.fx(c.type === 'wisp' || c.type === 'bat' ? 'wispDie' : c.type === 'bramble' || c.type === 'splitling' ? 'brambleDie' : 'thornDie');
      const p = screenOf(c.x, 2.0, c.z);
      B.floatText('+' + cd.shards, p.x, p.y, '#e3b8ff', 15);
      // Splitters break into Splitlings that keep running from the same spot.
      if (cd.split && B.phase !== 'done') {
        for (let i = 0; i < cd.split.count; i++) {
          const off = (i - (cd.split.count - 1) / 2);
          spawn(cd.split.into, c.hpScale, { s: Math.max(0, c.s + off * 0.5), lane: Math.max(-0.6, Math.min(0.6, c.lane + off * 0.7)) });
        }
        burst(c.x, 1.0, c.z, 'cyan', 5);
      }
    }
  }

  // ---------- Frame update ----------
  B.update = function (realDt) {
    const world = B.world;
    animatePads();
    let dt = B.paused || B.readHold || B.tutHold || B.phase === 'done' ? 0 : realDt * B.speed * (RF.settings.focus ? 0.5 : 1);
    // Effects run on real time so menus still feel alive.
    for (let i = B.fx.length - 1; i >= 0; i--) {
      const e = B.fx[i];
      e.t += realDt * (B.paused ? 0 : 1);
      const f = Math.min(1, e.t / e.life);
      e.update(f, realDt);
      if (f >= 1) { if (e.end) e.end(); B.fx.splice(i, 1); }
    }
    // Screen shake counts down here; the view draws it.
    const shaking = B.shake > 0;
    if (shaking) B.shake -= realDt;
    B.view.frame(realDt, shaking, shaking && B.shake <= 0);
    if (!dt) return;

    // A wave earned by reading comes after a short breath (game time, so Pause and Focus slow it too).
    if ((B.phase === 'build' || B.phase === 'between') && B.wavesDue > 0) {
      B.dueT += dt;
      if (B.dueT >= (B.phase === 'build' ? 1.5 : 3)) { B.wavesDue--; B.startWave(); }
    }

    // Spawns
    if (B.freezeT > 0) B.freezeT -= dt;
    if (B.phase === 'wave' && !(B.freezeT > 0)) {
      B.waveTime += dt;
      while (B.queue.length && B.queue[0].at <= B.waveTime) { const q = B.queue.shift(); spawn(q.type, q.hp); }
    }
    const U = B.U;
    // Shrine auras (tier 3): a War Shrine makes defenders in its ring fire faster; a Life Shrine
    // rebuilds fallen golems in its ring faster.
    // Rally (hero power): every defender fires faster for a short time.
    if (B.rallyT > 0) B.rallyT -= dt;
    const rally = B.rallyT > 0 ? B.U.hero.powers.rally.haste : 1;
    B.defenders.forEach(function (d) { d.haste = rally; d.rebuild = 1; });
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
        if (onGround(c) && Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.radius) { c.slow = Math.min(c.slow, lv.slow); c.tag = 'tag.slowed'; }
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
            burst(c.x, heightOf(c), c.z, 'ice', 2);
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
        if (d.down <= 0) { B.view.defenderDown(d, false); d.hp = d.max; B.view.popIn(d); }
        return;
      }
      B.creatures.forEach(function (c) {
        if (c.held || c.rooted > 0 || d.held.length >= lv.hold || isAir(c)) return;
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
        if (lv.quake) { d.held.slice().forEach(function (c) { hurt(c, lv.dmg, true); }); burst(d.pad.x, 0.4, d.pad.z, 'orange', 4); if (!RF.settings.reducedMotion) B.shake = Math.max(B.shake, 0.06); }
        else hurt(d.held[0], lv.dmg, true);
        B.view.strike(d, d.held[0]);
      }
      if (d.hp <= 0) {
        d.down = lv.respawn || U.defenders.golem.respawn;
        B.golemFalls++;
        B.view.defenderDown(d, true);
        burst(d.pad.x, 1.2, d.pad.z, 'cyan', 6);
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
        if (c.held || c.rooted > 0 || d.held.length >= lv.hold || isAir(c)) return;
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
        burst(d.pad.x, 1.0, d.pad.z, 'orange', 6);
        B.view.removeDefender(d);
        if (B.selDef === d) B.closePopup();
        d.pad.def = null;
        B.view.releasePad(d.pad);
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
        if (d.regrow <= 0) { d.regrow = 0; B.view.scaleDefender(d); }
        return;
      }
      if (!d.held.length) {
        B.creatures.forEach(function (c) {
          if (d.held.length >= lv.hold || !onGround(c) || c.held || c.rooted > 0) return;
          if (Math.hypot(c.x - d.pad.x, c.z - d.pad.z) > lv.radius) return;
          c.rooted = lv.root / (c.type === 'brute' ? spec.bruteBreak : 1);
          c.rootedBy = d;
          d.held.push(c);
          burst(c.x, 0.6, c.z, 'cyan', 2);
        });
        if (d.held.length) RF.audio.fxEvery('spike', d.pad.id, 0.7);
        return;
      }
      d.held.slice().forEach(function (c) {
        c.rooted -= dt;
        hurt(c, lv.dps * dt); // a kill takes it off d.held
        if (c.alive && c.rooted <= 0) { c.rooted = 0; c.rootedBy = null; d.held.splice(d.held.indexOf(c), 1); }
      });
      if (!d.held.length) { d.regrow = lv.regrow; B.view.scaleDefender(d); }
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
        if (d.fxT <= 0) burst(o.pad.x, 1.4, o.pad.z, 'cyan', 2);
      });
      if (d.fxT <= 0) d.fxT = 0.8;
      if (B.phase === 'wave') {
        d.anchorT += dt;
        if (d.anchorT >= lv.anchorEvery) {
          d.anchorT = 0;
          if (B.anchor < B.anchorMax) {
            B.anchor++;
            B.renderTop();
            const p = screenOf(B.world.camp.x, B.view.anchorTextY, B.world.camp.z);
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
        if (!isAir(c) && Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.radius) { hurt(c, lv.dps * dt); any = true; }
      });
      if (any) RF.audio.fxEvery('spike', d.pad.id, 0.7);
      B.view.spikeActive(d, any);
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
        B.view.anchorHurt();
        if (!RF.settings.reducedMotion) B.shake = 0.25;
        RF.audio.fx('anchorHit');
        if (B.tut) B.tut.on('anchorHit');
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
        B.view.aim(d, best.x, best.z);
        addShot({ kind: 'arrow', x: d.pad.x, y: 3.2 * sc, z: d.pad.z, size: d.spec === 'a' ? 1.6 : 0, target: best, dmg: lv.dmg, speed: 26, tx: best.x, tz: best.z });
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
      B.view.aim(d, best.x, best.z);
      B.view.recoil(d);
      RF.audio.fxEvery('archer', d.pad.id, 0.3);
      addShot({ kind: 'bolt', x: d.pad.x, y: 1.9 * (1 + 0.08 * (d.lv - 1)), z: d.pad.z, size: d.spec === 'a' ? 3.2 : 2.2, target: best, dmg: lv.dmg * (spec.big.indexOf(best.type) >= 0 ? (lv.bigBonus || spec.bigBonus) : 1), speed: spec.boltSpeed, tx: best.x, tz: best.z, src: lv.breaks ? 'break' : null });
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
        if (!isAir(c) && Math.hypot(c.x - d.pad.x, c.z - d.pad.z) <= lv.range && (!best || c.s > best.s)) best = c;
      });
      if (!best) return;
      d.cd = 1 / lv.rate;
      const sh = U.defenders.ember.shell;
      const from = Math.hypot(best.x - d.pad.x, best.z - d.pad.z);
      const T = Math.max(0.6, from / sh.speed);
      // Aim where it will be, unless it is held.
      let tx = best.x, tz = best.z;
      if (!best.held) { const p = world.path.at(Math.min(world.path.len, best.s + best.speed * best.slow * T), best.lane, tmp); tx = p.x; tz = p.z; }
      const ang = Math.atan2(-(tx - d.pad.x), -(tz - d.pad.z));
      B.view.aim(d, tx, tz);
      const sx = d.pad.x - Math.sin(ang) * 1.1 * sc, sz = d.pad.z - Math.cos(ang) * 1.1 * sc, sy = 2.1 * sc;
      addShot({ shell: true, x: sx, y: sy, z: sz, fx: sx, fy: sy, fz: sz, tx: tx, tz: tz, T: T, t: 0, lv: lv, arc: sh.arc, def: d });
      B.view.recoil(d);
      burst(sx, sy, sz, 'orange', 2);
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
      let prev = { x: d.pad.x, y: 0.45 + 4.1 * sc, z: d.pad.z };
      B.view.recoil(d);
      const hit = [best];
      let cur = best, dmg = lv.dmg;
      for (let j = 0; j <= lv.chain && cur; j++) {
        const pt = { x: cur.x, y: heightOf(cur), z: cur.z };
        B.view.zap(prev, pt);
        if (lv.stun) B.view.zap(prev, pt); // Thunder Spire: one fat bolt
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
      sh.x = sh.fx + (sh.tx - sh.fx) * f; sh.y = sh.fy + (0.4 - sh.fy) * f + Math.sin(f * Math.PI) * sh.arc; sh.z = sh.fz + (sh.tz - sh.fz) * f;
      B.view.moveShot(sh);
      if (f >= 1) {
        splash(sh.tx, sh.tz, sh.lv);
        B.view.removeShot(sh);
        B.shots.splice(i, 1);
      }
    }
    // Burning ground from Inferno Cannon shells hurts creatures that walk through it (fliers pass over).
    for (let i = B.burns.length - 1; i >= 0; i--) {
      const b = B.burns[i];
      b.life -= dt;
      B.creatures.slice().forEach(function (c) {
        if (onGround(c) && Math.hypot(c.x - b.x, c.z - b.z) <= b.r) hurt(c, b.dps * dt);
      });
      B.view.burnTick(b);
      if (b.life <= 0) { B.view.burnRemove(b); B.burns.splice(i, 1); }
    }
    // Arrows fly
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const sh = B.shots[i];
      if (sh.shell) continue;
      if (sh.target.alive) { sh.tx = sh.target.x; sh.tz = sh.target.z; }
      const ty = heightOf(sh.target);
      const dx = sh.tx - sh.x, dy = ty - sh.y, dz = sh.tz - sh.z;
      const dist = Math.hypot(dx, dy, dz);
      const step = sh.speed * dt;
      if (dist <= step) {
        if (sh.target.alive) { RF.audio.fxEvery('arrowHit', 'arrowHit', 0.09); hurt(sh.target, sh.dmg, true, sh.src); burst(sh.tx, ty, sh.tz, 'yellow', 2); }
        B.view.removeShot(sh);
        B.shots.splice(i, 1);
      } else {
        sh.x += dx / dist * step; sh.y += dy / dist * step; sh.z += dz / dist * step;
        B.view.moveShot(sh, ty);
      }
    }
    // Wave over?
    if (B.phase === 'wave' && !B.queue.length && !B.creatures.length) {
      if (B.finalWave) return B.finish(true);
      B.phase = 'between';
      B.rallyT = 0;
      B.renderTop(); B.renderPowers();
      RF.audio.fx('waveClear');
      RF.audio.music('calm');
      B.toast('hud.waveCleared', true);
      if (B.tut) B.tut.on('waveClear');
    }
  };

  // What a creature's health bar says. The shield tag always shows while the shield is up;
  // slowed or held is added beside it.
  B.creatureTag = function (c) { return c.shield ? RF.t('tag.shield') + (c.tag ? ' · ' + RF.t(c.tag) : '') : c.tag ? RF.t(c.tag) : ''; };
  B.tagColor = function (c) { return c.shield ? '#e3b8ff' : c.tag === 'tag.slowed' || c.tag === 'tag.frozen' ? '#bff3ff' : c.tag === 'tag.rooted' ? '#9cf2c0' : '#ffd76a'; };

  // Draw health bars and keep an open popup beside its defender.
  B.afterRender = function () {
    B.view.afterRender();
    if (B.selDef && B.popup.style.display !== 'none') {
      placePopup(screenOf(B.selDef.pad.x, B.view.defTop(B.selDef), B.selDef.pad.z));
    }
  };

  // ---------- Keys ----------
  window.addEventListener('keydown', function (ev) {
    if (!B.active || B.phase === 'done' || document.querySelector('#ui .screen')) return;
    // The sound rule card is up: only its own keys work (no pause menu, no wave call).
    if (B.forge && B.forge.ruleUp) { B.forge.key(ev); ev.preventDefault(); return; }
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
    // Tutorial: no Forge keys while it points at the build bar or the locks.
    if (B.tut && !B.tut.allowForge() && !(B.buildSel && ev.key === 'Enter') && ['1', '2', '3', 'f', 'F', 'm', 'M', 'h', 'H', 'Enter'].indexOf(ev.key) >= 0) return;
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
      story: B.L.story ? { cards: fs.cards, cardsFirst: fs.cardsFirst, cardsHelp: fs.cardsHelp, byType: fs.byType, sealDone: !!fs.sealDone, sealFirstTry: fs.sealFirstTry || 0, aloud: fs.aloud || 0, aloudWords: fs.aloudWords || 0, aloudRight: fs.aloudRight || 0, aloudMs: fs.aloudMs || 0, sealRead: fs.sealRead ? { tries: fs.sealRead.tries, firstWcpm: fs.sealRead.first.wcpm, bestWcpm: fs.sealRead.best.wcpm } : null } : undefined, locks: B.locks.map(function (k) { return { pat: k.pat, first: k.first, done: k.done }; }), shards: B.shards, kills: B.kills, powers: B.powersUsed,
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
    if (B.tut) B.tut.stop();
    B.tutHold = false;
    RF.audio.music(null);
    RF.stopSpeaking();
    clearTimeout(B.toastTimer);
    if (B.volPanel) B.toggleVolume(false);
    if (B.hud) { B.hud.remove(); B.hud = null; }
    D.clear(document.getElementById('labels'));
    B.view.stop();
  };

  // For testing: RF.battle.cheat(500) adds crystals.
  B.cheat = function (n) { B.crystals += n; B.renderTop(); B.renderCards(); };
})(window.RF);
