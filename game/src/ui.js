// Reusable on-screen pieces: backdrop, buttons with speakers, option chips, panels and keyboard focus.
window.RF = window.RF || {};
(function (RF) {
  const ui = {};
  RF.ui = ui;

  const COLORS = {
    panel: 0x141a33, panelEdge: 0x6c7bd9,
    button: 0x2a3470, buttonHover: 0x3a47a0, buttonEdge: 0xaab6ff,
    chip: 0x1d2550, chipOn: 0xffc94a, chipEdge: 0x7d89d8,
    shadow: 0x05070f, focus: 0xffe066
  };
  ui.COLORS = COLORS;

  // ---------- Textures made in code (pixel style) ----------
  ui.makeTextures = function (scene) {
    if (scene.textures.exists('speaker')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Speaker icon, drawn on an 16x16 grid then scaled up by 4 for a chunky pixel look.
    const px = 4;
    const pixels = [
      '................',
      '.......#........',
      '......##.....#..',
      '.....###..#...#.',
      '....####...#..#.',
      '#######.#..#...#',
      '#######.#..#...#',
      '#######.#..#...#',
      '#######.#..#...#',
      '#######.#..#...#',
      '....####...#..#.',
      '.....###..#...#.',
      '......##.....#..',
      '.......#........',
      '................',
      '................'
    ];
    g.fillStyle(0xffffff, 1);
    pixels.forEach(function (row, y) {
      for (let x = 0; x < row.length; x++) if (row[x] === '#') g.fillRect(x * px, y * px, px, px);
    });
    g.generateTexture('speaker', 16 * px, 16 * px);
    g.clear();
    // One star pixel.
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('star', 4, 4);
    g.clear();
    // Mountain layers that tile left to right for the scrolling backdrop.
    const layers = [
      { key: 'mtn-far', color: 0x26305e, base: 430, amp: 120, step: 16, seed: 3 },
      { key: 'mtn-mid', color: 0x1b2148, base: 520, amp: 90, step: 12, seed: 7 },
      { key: 'mtn-near', color: 0x0f1330, base: 610, amp: 60, step: 8, seed: 11 }
    ];
    layers.forEach(function (L) {
      g.clear();
      g.fillStyle(L.color, 1);
      for (let x = 0; x < RF.W; x += L.step) {
        const a = (x / RF.W) * Math.PI * 2;
        const h = Math.sin(a * 2 + L.seed) * 0.5 + Math.sin(a * 5 + L.seed * 2) * 0.3 + Math.sin(a * 9 + L.seed) * 0.2;
        const top = Math.round((L.base - h * L.amp) / L.step) * L.step;
        g.fillRect(x, top, L.step, RF.H - top);
      }
      g.generateTexture(L.key, RF.W, RF.H);
    });
    g.destroy();
  };

  // ---------- Backdrop: night sky, stars, scrolling mountains ----------
  ui.backdrop = function (scene) {
    const sky = scene.add.graphics();
    sky.fillGradientStyle(0x0b0e24, 0x0b0e24, 0x3b2a6b, 0x3b2a6b, 1);
    sky.fillRect(0, 0, RF.W, RF.H);
    const rnd = new Phaser.Math.RandomDataGenerator(['riftrunners']);
    for (let i = 0; i < 70; i++) {
      const s = scene.add.image(rnd.between(0, RF.W), rnd.between(0, 380), 'star').setAlpha(rnd.realInRange(0.3, 1));
      if (rnd.frac() < 0.5) s.setScale(0.5);
      if (!RF.settings.reducedMotion && rnd.frac() < 0.4) {
        scene.tweens.add({ targets: s, alpha: 0.15, duration: rnd.between(900, 2200), yoyo: true, repeat: -1, delay: rnd.between(0, 2000) });
      }
    }
    const layers = ['mtn-far', 'mtn-mid', 'mtn-near'].map(function (key) {
      return scene.add.tileSprite(0, 0, RF.W, RF.H, key).setOrigin(0, 0);
    });
    if (!RF.settings.reducedMotion) {
      const speeds = [0.06, 0.14, 0.28];
      const scroll = function (time, delta) {
        layers.forEach(function (l, i) { l.tilePositionX += speeds[i] * delta * 0.1; });
      };
      scene.events.on('update', scroll);
      scene.events.once('shutdown', function () { scene.events.off('update', scroll); });
    }
  };

  // ---------- Speaker button: tap to hear ----------
  ui.speaker = function (scene, x, y, onSpeak, size) {
    const s = size || Math.round(52 * Math.min(RF.textScale(), 1.15));
    const c = scene.add.container(x, y);
    const shadow = scene.add.rectangle(4, 4, s, s, COLORS.shadow);
    const bg = scene.add.rectangle(0, 0, s, s, COLORS.chip).setStrokeStyle(3, COLORS.chipEdge);
    const icon = scene.add.image(0, 0, 'speaker').setDisplaySize(s * 0.62, s * 0.62).setTint(0xffe9a8);
    c.add([shadow, bg, icon]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', function () { bg.setFillStyle(COLORS.buttonHover); });
    bg.on('pointerout', function () { bg.setFillStyle(COLORS.chip); });
    bg.on('pointerup', function () { onSpeak(); });
    c.size = s;
    return c;
  };

  // ---------- Big button with its own speaker on the left ----------
  // opts: { minWidth, fontPx, speak (default true), lang }
  ui.button = function (scene, x, y, textId, onActivate, opts) {
    opts = opts || {};
    const c = scene.add.container(x, y);
    const label = scene.add.text(0, 0, RF.t(textId, opts.lang), RF.textStyle(opts.fontPx || 34, { fontStyle: '700' })).setOrigin(0.5);
    const w = Math.max(opts.minWidth || 0, label.width + 64);
    const h = label.height + 30;
    const shadow = scene.add.rectangle(6, 6, w, h, COLORS.shadow);
    const bg = scene.add.rectangle(0, 0, w, h, COLORS.button).setStrokeStyle(4, COLORS.buttonEdge);
    c.add([shadow, bg, label]);
    const activate = function () { RF.sfx('select'); onActivate(); };
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', function () { bg.setFillStyle(COLORS.buttonHover); });
    bg.on('pointerout', function () { bg.setFillStyle(COLORS.button); });
    bg.on('pointerup', activate);
    let total = w;
    if (opts.speak !== false) {
      const gap = 14;
      const sp = ui.speaker(scene, 0, 0, function () { RF.speak(textId, opts.lang); }, Math.min(h, 72));
      sp.x = -w / 2 - gap - sp.size / 2;
      c.add(sp);
      total = w + gap + sp.size;
      // Shift everything so the whole group (speaker + button) stays centered on x.
      c.each(function (child) { child.x += (gap + sp.size) / 2; });
    }
    c.setSize(total, h);
    return { container: c, bg: bg, width: total, height: h, activate: activate, speak: function () { RF.speak(textId, opts.lang); } };
  };

  // ---------- A line of text with a speaker on the left ----------
  ui.readLine = function (scene, x, y, textId, basePx, opts) {
    opts = opts || {};
    const c = scene.add.container(x, y);
    const text = scene.add.text(0, 0, RF.t(textId, opts.lang), RF.textStyle(basePx, Object.assign({
      wordWrap: { width: opts.wrap || 900, useAdvancedWrap: true }
    }, opts.style || {}))).setOrigin(opts.align === 'left' ? 0 : 0.5, 0.5);
    const sp = ui.speaker(scene, 0, 0, function () { RF.speak(textId, opts.lang); });
    const gap = 16;
    c.add([sp, text]);
    if (opts.align === 'left') {
      sp.x = sp.size / 2;
      text.x = sp.size + gap;
      c.setSize(sp.size + gap + text.width, Math.max(sp.size, text.height));
    } else {
      const total = sp.size + gap + text.width;
      sp.x = -total / 2 + sp.size / 2;
      text.x = -total / 2 + sp.size + gap + text.width / 2;
      c.setSize(total, Math.max(sp.size, text.height));
    }
    c.textObj = text;
    c.speak = function () { RF.speak(textId, opts.lang); };
    return c;
  };

  // ---------- Row of option chips (pick one) ----------
  // options: [{ value, textId }]. Picking a chip reads it aloud.
  ui.chips = function (scene, x, y, options, current, onPick) {
    const c = scene.add.container(x, y);
    const gap = 14;
    let cx = 0;
    const chips = [];
    options.forEach(function (opt) {
      const label = scene.add.text(0, 0, RF.t(opt.textId, opt.lang), RF.textStyle(28, { fontStyle: '700' })).setOrigin(0.5);
      const w = label.width + 44;
      const h = label.height + 16;
      const shadow = scene.add.rectangle(cx + w / 2 + 4, 4, w, h, COLORS.shadow);
      const bg = scene.add.rectangle(cx + w / 2, 0, w, h, COLORS.chip).setStrokeStyle(3, COLORS.chipEdge);
      label.x = cx + w / 2;
      c.add([shadow, bg, label]);
      const chip = { opt: opt, bg: bg, label: label };
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerup', function () { pick(opt.value, true); });
      chips.push(chip);
      cx += w + gap;
    });
    let value = current;
    function paint() {
      chips.forEach(function (ch) {
        const on = ch.opt.value === value;
        ch.bg.setFillStyle(on ? COLORS.chipOn : COLORS.chip);
        ch.bg.setStrokeStyle(3, on ? 0xffffff : COLORS.chipEdge);
        ch.label.setColor(on ? '#1a1300' : '#ffffff');
      });
    }
    function pick(v, speakIt) {
      const ch = chips.find(function (k) { return k.opt.value === v; });
      if (!ch) return;
      value = v;
      paint();
      RF.sfx('select');
      if (speakIt) RF.speak(ch.opt.textId, ch.opt.lang);
      onPick(v);
    }
    paint();
    const h = chips.length ? chips[0].bg.height : 0;
    c.setSize(cx - gap, h);
    function step(dir) {
      const i = chips.findIndex(function (k) { return k.opt.value === value; });
      const next = chips[Math.max(0, Math.min(chips.length - 1, i + dir))];
      if (next && next.opt.value !== value) pick(next.opt.value, true);
    }
    return { container: c, width: cx - gap, height: h, left: function () { step(-1); }, right: function () { step(1); }, activate: function () {
      const i = chips.findIndex(function (k) { return k.opt.value === value; });
      pick(chips[(i + 1) % chips.length].opt.value, true);
    } };
  };

  // ---------- Panel (dark box with a bright pixel edge) ----------
  ui.panel = function (scene, x, y, w, h) {
    const c = scene.add.container(x, y);
    c.add(scene.add.rectangle(8, 8, w, h, COLORS.shadow, 0.9));
    c.add(scene.add.rectangle(0, 0, w, h, COLORS.panel, 0.96).setStrokeStyle(6, COLORS.panelEdge));
    return c;
  };

  // ---------- Keyboard focus (arrows, Tab, Enter, Space) ----------
  // items: [{ target (game object with getBounds), activate, left, right, speak }]
  ui.focus = function (scene, items, startIndex) {
    let index = startIndex || 0;
    let showing = false;
    const ring = scene.add.graphics().setDepth(1000);
    function draw() {
      ring.clear();
      if (!showing || !items[index]) return;
      const b = items[index].target.getBounds();
      ring.lineStyle(5, COLORS.focus, 1);
      ring.strokeRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20);
    }
    function move(dir) {
      showing = true;
      index = (index + dir + items.length) % items.length;
      RF.sfx('move');
      draw();
      if (items[index].speak) items[index].speak();
    }
    const kb = scene.input.keyboard;
    if (kb) {
      const onKey = function (ev) {
        const it = items[index];
        switch (ev.code) {
          case 'ArrowDown': move(1); break;
          case 'ArrowUp': move(-1); break;
          case 'Tab': ev.preventDefault(); move(ev.shiftKey ? -1 : 1); break;
          case 'ArrowLeft': if (it && it.left) { showing = true; it.left(); draw(); } break;
          case 'ArrowRight': if (it && it.right) { showing = true; it.right(); draw(); } break;
          case 'Enter': case 'Space': case 'NumpadEnter':
            if (showing && it && it.activate) it.activate(); else { showing = true; draw(); }
            break;
          case 'Escape': if (scene.onEscape) scene.onEscape(); break;
          default: break;
        }
      };
      kb.on('keydown', onKey);
      scene.events.once('shutdown', function () { kb.off('keydown', onKey); });
    }
    showing = !!(scene.sys.settings.data && scene.sys.settings.data.keyboard);
    draw();
    return { index: function () { return index; }, showing: function () { return showing; } };
  };

  // ---------- Fit a container inside a box by shrinking it if needed ----------
  ui.fit = function (container, maxW, maxH) {
    const b = container.getBounds();
    const s = Math.min(1, maxW / b.width, maxH ? maxH / b.height : 1);
    if (s < 1) container.setScale(s);
    return s;
  };
})(window.RF);
