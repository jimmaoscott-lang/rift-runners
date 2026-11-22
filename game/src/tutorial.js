// Level 1 tutorial (DESIGN.md 4.3). Runs the first time a student opens Level 1, and again from
// Settings > Replay tutorial. Five steps: read to earn, build, reading brings waves, first wave,
// rift locks. The battle holds still during each step until the student does the action (no timers).
// Each step has a narrator line, a short text line on a card (shown even with Battle captions off)
// and a glowing spotlight with an arrow on the right spot.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;
  const T = {};
  RF.tutorial = T;
  T.replay = false; // set by Settings > Replay tutorial; the next Level 1 start runs it with Skip

  // A small first wave: enough to see the tower fire and see one or two creatures reach the Anchor.
  T.wave = { hp: 0.8, groups: [{ type: 'wisp', count: 6, gap: 1.1 }, { type: 'thornback', count: 1, gap: 1, delay: 5 }] };
  const READS_IN_STEP3 = 2;

  T.done = function () {
    const m = RF.metrics.data();
    // A student who already played a battle before the tutorial existed does not need it.
    return !!(m.tutorial && m.tutorial.done) || (m.battles || []).length > 0;
  };
  T.shouldRun = function (levelIndex) {
    if (levelIndex !== 0) return false;
    return T.replay || !T.done();
  };

  // ---------- Start and end ----------
  T.start = function (B) {
    T.B = B;
    T.isReplay = T.replay || T.done();
    T.replay = false;
    T.step = 0;
    T.reads = 0;
    T.hit = false;
    B.tut = T;
    B.tutHold = true;
    // The first word should be a real word, not a rune.
    if (B.forge && B.forge.cur && B.forge.cur.kind === 'rune') B.forge.next();
    T.glows = [];
    T.holes = [];
    // The grey shade: covers the whole screen except windows around the parts used in this step.
    // Taps on the grey part do nothing; taps in a window reach the game.
    T.shade = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    T.shade.setAttribute('class', 'tutShade');
    T.shadePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    T.shadePath.setAttribute('fill-rule', 'evenodd');
    T.shade.appendChild(T.shadePath);
    T.shadePath.addEventListener('click', function (ev) { ev.stopPropagation(); RF.sfx('soft'); });
    document.body.appendChild(T.shade);
    T.arrow = D.el('div', 'tutArrow', '&#9660;', document.body);
    T.arrow.style.display = 'none';
    B.renderTop(); // hides Start wave until step 3
    T.loop();
    step1();
  };
  // Settings can rebuild the battle screen mid-tutorial; put the card back on the new screen.
  T.rebuilt = function () {
    if (!T.B || T.B.tut !== T) return;
    const s = T.step;
    T.step = 0;
    [null, step1, step2, step3, step4, step5][s] && [null, step1, step2, step3, step4, step5][s](true);
  };
  T.finish = function (skipped) {
    const B = T.B;
    if (!B || B.tut !== T) return;
    if (!skipped || !T.isReplay) {
      const m = RF.metrics.data();
      m.tutorial = { done: new Date().toISOString() };
      RF.metrics.save();
    }
    T.stop();
    B.tutHold = false;
    if (B.tutWave) B.tutWave = null;
    B.renderTop();
    if (B.phase !== 'done') B.toast(null, true, [{ id: skipped ? 'hud.buildStart' : 'tut.done' }].concat(B.nextParts()));
  };
  T.stop = function () {
    if (T.B) { T.B.tut = null; }
    cancelAnimationFrame(T.raf);
    clearTimeout(T.later);
    if (T.card) { T.card.remove(); T.card = null; }
    if (T.arrow) { T.arrow.remove(); T.arrow = null; }
    if (T.shade) { T.shade.remove(); T.shade = null; }
    (T.glows || []).forEach(function (g) { g.el.remove(); });
    T.glows = [];
  };

  // ---------- What the student may do in each step ----------
  // Step 2 builds only the Archer Tower. From the first wave on, every defender can be built.
  T.allowBuild = function (id) { return T.step === 2 ? id === 'archer' : T.step >= 4 && T.step < 5; };
  T.allowPads = function () { return T.step === 2 || (T.step >= 4 && T.step < 5); };
  T.allowForge = function () { return T.step !== 2 && T.step !== 5; };
  T.allowStart = function () { return T.step === 3 || T.step === 3.5; };
  T.noRunes = function () { return T.step < 4; };

  // Events from the battle: 'read', 'select', 'build', 'wave', 'anchorHit', 'waveClear'.
  T.on = function (ev, arg) {
    const B = T.B;
    if (!B || B.tut !== T) return;
    if (T.step === 1 && ev === 'read') {
      T.step = 1.5; // wait for the crystals to land, then step 2
      T.later = setTimeout(step2, 900);
    } else if (T.step === 2 && ev === 'select') {
      step2b(arg === 'archer');
    } else if (T.step === 2 && ev === 'build') {
      T.later = setTimeout(step3, 700);
      T.step = 2.5;
    } else if (T.step === 3 && ev === 'read') {
      T.reads++;
      renderCount();
      if (T.reads >= READS_IN_STEP3) { T.step = 3.5; T.later = setTimeout(function () { B.callWave(); }, 900); }
    } else if ((T.step === 3 || T.step === 3.5) && ev === 'wave') {
      clearTimeout(T.later);
      step4();
    } else if (T.step === 4 && ev === 'anchorHit' && !T.hit) {
      T.hit = true;
      clearTimeout(T.later);
      RF.speak('tut.s4b');
      lit(T.lines[1]);
    } else if (T.step === 4 && ev === 'waveClear') {
      T.step = 4.5;
      clearTimeout(T.later);
      T.later = setTimeout(step5, 1500);
    }
  };

  // ---------- Steps ----------
  function step1(again) {
    const B = T.B;
    T.step = 1;
    const F = B.forge;
    const hidden = F.choicesHidden && F.choicesHidden();
    const micOK = RF.mic && RF.mic.usable() && F.els.mic.style.display !== 'none';
    const lines = hidden ? ['tut.s1say'] : micOK ? ['tut.s1', 'tut.s1mic'] : ['tut.s1'];
    card(1, lines);
    spot([function () { return hidden ? F.els.mic : F.els.opts; }, function () { return hidden ? null : F.els.forge; }],
      function () { return hidden ? F.els.mic : F.els.opts; }, 'right', [function () { return B.forge.root; }]);
    if (!again) RF.speakSeq(lines.map(function (id) { return { id: id }; }));
  }
  function step2(again) {
    const B = T.B;
    T.step = 2;
    B.tutHold = true;
    card(2, ['tut.s2a', 'tut.s2b']);
    lit(T.lines[0]);
    spot([function () { return B.cards.archer; }], function () { return B.cards.archer; }, 'down', [function () { return B.crystalChip; }]);
    if (!again) RF.speak('tut.s2a');
    if (B.buildSel === 'archer') step2b(true);
  }
  function step2b(on) {
    const B = T.B;
    lit(T.lines[on ? 1 : 0]);
    // Once the tower is picked, the first line goes away so the change is easy to see.
    T.lines[0].style.display = on ? 'none' : '';
    if (on) {
      RF.sfx('select');
      // Every open tower pad gets its own round window; the arrow points at the best one.
      spot([], padPoint, 'down', padHoles().concat([function () { return B.cards.archer; }, function () { return B.info; }]));
      RF.speak('tut.s2b');
    } else {
      spot([function () { return B.cards.archer; }], function () { return B.cards.archer; }, 'down', [function () { return B.crystalChip; }]);
    }
  }
  function step3(again) {
    const B = T.B;
    T.step = 3;
    B.tutHold = true;
    if (!again) T.reads = 0;
    card(3, ['tut.s3a', 'tut.s3b', 'tut.s3c']);
    T.count = D.el('div', 'tutCount', '', T.card);
    renderCount();
    B.renderTop();
    spot([function () { return B.nextChip; }, function () { return B.startBtn; }], function () { return B.nextChip; }, 'up', [function () { return B.forge.root; }]);
    if (!again) RF.speakSeq([{ id: 'tut.s3a' }, { id: 'tut.s3b' }, { id: 'tut.s3c' }]);
  }
  function renderCount() {
    if (!T.count) return;
    T.count.textContent = Math.min(T.reads, READS_IN_STEP3) + ' / ' + READS_IN_STEP3;
  }
  function step4(again) {
    const B = T.B;
    T.step = 4;
    B.tutHold = false;
    card(4, ['tut.s4a', 'tut.s4b']);
    // During the wave the card shrinks to a strip at the top, and building is open again.
    T.card.classList.add('mini');
    lit(T.lines[0]);
    if (T.hit) lit(T.lines[1]);
    spot([function () { return B.anchorLabel; }], function () { return B.anchorLabel; }, 'down', null);
    B.renderTop();
    if (!again) {
      RF.speak('tut.s4a');
      // If no creature has reached the Anchor after a while, say the Anchor line anyway.
      T.later = setTimeout(function () { if (T.step === 4 && !T.hit) { RF.speak('tut.s4b'); lit(T.lines[1]); } }, 9000);
    }
  }
  function step5(again) {
    const B = T.B;
    if (B.phase === 'done') return T.stop();
    T.step = 5;
    B.tutHold = true;
    card(5, ['tut.s5']);
    spot([function () { return B.locksBox; }], function () { return B.locksBox; }, 'down', []);
    const go = D.el('button', 'btn big go', D.esc(RF.t('tut.go')), T.foot);
    go.addEventListener('click', function () { RF.sfx('select'); T.finish(false); });
    go.focus({ preventScroll: true });
    if (!again) RF.speak('tut.s5');
  }

  // ---------- The card ----------
  function card(n, lines) {
    const B = T.B;
    if (T.card) T.card.remove();
    const c = D.el('div', 'panel tutCard', null, B.hud);
    T.card = c;
    const head = D.el('div', 'tutHead', D.esc(RF.t('tut.title')).toUpperCase() + ' &middot; ' + n + ' / 5', c);
    head.setAttribute('aria-live', 'polite');
    T.lines = lines.map(function (id) { return D.line(id, 'tutLine', c); });
    T.foot = D.el('div', 'tutFoot', null, c);
    if (T.isReplay) {
      const sk = D.el('button', 'btn', D.esc(RF.t('tut.skip')), T.foot);
      sk.addEventListener('click', function () { RF.sfx('back'); T.finish(true); });
    }
  }
  function lit(row) {
    if (!T.lines || !row) return;
    T.lines.forEach(function (r) { r.classList.toggle('cur', r === row); });
  }


  // ---------- Spotlight and arrow ----------
  // targets: functions that return an element or a screen point {x, y}. arrowAt: same, for the arrow.
  // holes: more windows in the grey shade (no glow). holes = null turns the shade off (the wave step).
  // The glowing targets and the card always get windows too.
  function spot(targets, arrowAt, dir, holes) {
    (T.glows || []).forEach(function (g) { g.el.remove(); });
    T.glows = targets.map(function (f) { return { f: f, el: D.el('div', 'tutGlow', null, document.body) }; });
    T.arrowAt = arrowAt;
    T.arrowDir = dir || 'down';
    T.holes = holes === null ? null : targets.concat(holes || []);
  }
  function padHoles() {
    const B = T.B;
    return B.world.pads.filter(function (p) { return !p.def && p.kind === 'tower'; }).map(function (p) {
      return function () { return p.def ? null : B.screenOf(p.x, 0.3, p.z); };
    });
  }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return 'M' + (x + r) + ',' + y + 'h' + (w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r +
      'h' + (2 * r - w) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + (-r) + 'v' + (2 * r - h) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) + 'z';
  }
  function drawShade() {
    const B = T.B;
    // No shade during the wave, while paused, or under a menu (the menus sit below it).
    const off = !T.holes || B.paused || document.querySelector('#ui .screen');
    T.shade.style.display = off ? 'none' : '';
    if (off) return;
    const W = window.innerWidth, H = window.innerHeight;
    let d = 'M0,0H' + W + 'V' + H + 'H0z';
    T.holes.concat([function () { return T.card; }]).forEach(function (f) {
      const t = f();
      const r = rectOf(t);
      if (!r) return;
      const round = t && !t.getBoundingClientRect; // a spot on the battlefield gets a circle
      const pad = round ? 18 : 8;
      d += roundRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, round ? 99 : 16);
    });
    T.shade.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    T.shadePath.setAttribute('d', d);
  }
  function rectOf(t) {
    if (!t) return null;
    if (t.getBoundingClientRect) {
      if (!t.isConnected || t.offsetParent === null) return null;
      const r = t.getBoundingClientRect();
      return r.width ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
    }
    return { x: t.x - 24, y: t.y - 24, w: 48, h: 48 };
  }
  // The empty tower pad to build on: the open one nearest the middle of the battlefield view
  // that the card and the panels do not cover.
  function padPoint() {
    const B = T.B;
    const s = RF.dom.scale;
    const cx = (window.innerWidth - 374 * s) / 2, cy = (window.innerHeight - 140 * s) / 2;
    const covers = [T.card, B.info, B.locksBox, B.powerBox].filter(Boolean).map(function (e) { return e.getBoundingClientRect(); });
    let best = null, bd = 1e9;
    B.world.pads.forEach(function (p) {
      if (p.def || p.kind !== 'tower') return;
      const q = B.screenOf(p.x, 0.3, p.z);
      if (q.x > window.innerWidth - 380 * s || q.y > window.innerHeight - 150 * s) return;
      if (covers.some(function (r) { return r.width && q.x > r.left - 30 && q.x < r.right + 30 && q.y > r.top - 70 && q.y < r.bottom + 90; })) return;
      const d = Math.hypot(q.x - cx, q.y - cy);
      if (d < bd) { bd = d; best = q; }
    });
    return best;
  }
  T.loop = function () {
    T.raf = requestAnimationFrame(T.loop);
    if (!T.arrow) return;
    drawShade();
    const hide = T.B.paused || !!document.querySelector('#ui .screen');
    T.glows.forEach(function (g) { g.el.style.visibility = hide ? 'hidden' : ''; });
    T.arrow.style.visibility = hide ? 'hidden' : '';
    T.glows.forEach(function (g) {
      const r = rectOf(g.f());
      if (!r) { g.el.style.display = 'none'; return; }
      g.el.style.display = '';
      g.el.style.left = (r.x - 6) + 'px'; g.el.style.top = (r.y - 6) + 'px';
      g.el.style.width = (r.w + 12) + 'px'; g.el.style.height = (r.h + 12) + 'px';
    });
    const a = T.arrowAt ? rectOf(T.arrowAt()) : null;
    if (!a) { T.arrow.style.display = 'none'; return; }
    T.arrow.style.display = '';
    const dir = T.arrowDir;
    if (T.arrow.dataset.dir !== dir) {
      T.arrow.dataset.dir = dir;
      T.arrow.innerHTML = dir === 'up' ? '&#9650;' : dir === 'right' ? '&#9654;' : '&#9660;';
      T.arrow.className = 'tutArrow ' + dir;
    }
    if (dir === 'right') { T.arrow.style.left = (a.x - 12) + 'px'; T.arrow.style.top = (a.y + a.h / 2) + 'px'; }
    else { T.arrow.style.left = (a.x + a.w / 2) + 'px'; T.arrow.style.top = (dir === 'up' ? a.y + a.h + 10 : a.y - 10) + 'px'; }
  };
})(window.RF);
