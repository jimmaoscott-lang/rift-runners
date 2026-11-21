// World 1 battle in tap mode (DESIGN.md section 6).
// Pick a move (each move is a word), then pick the sound that matches the word and cast.
// A miss never hurts the player: the word is broken up and the student tries again.
// Every word can be heard. Hearing a word before casting counts as help and does less damage.
class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  create(data) {
    data = data || {};
    this.world = RF.content.world1;
    this.battle = this.world.battles[0];
    this.keyboard = !!data.keyboard;
    this.hp = this.battle.hp;
    this.streak = 0;
    this.used = new Set();
    this.stats = { words: 0, firstTry: 0, misses: 0, help: 0, start: Date.now() };
    this.layer = null;
    this.focusCtl = null;
    this.msg = null;
    this.state = 'pick';

    this.drawForest();
    this.makeEnemy();
    this.drawHud();
    this.add.rectangle(RF.W / 2, 525, RF.W - 40, 370, 0x0b1020, 0.92).setStrokeStyle(5, RF.ui.COLORS.panelEdge);

    this.onEscape = () => { if (this.state === 'read') this.showPick(false); };
    RF.metrics.touch();
    this.showPick(true);
  }

  // ---------- Scenery ----------
  drawForest() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x08131f, 0x08131f, 0x1d3a2a, 0x1d3a2a, 1);
    g.fillRect(0, 0, RF.W, RF.H);
    // The rift: a jagged purple crack across the sky.
    g.lineStyle(6, 0xc04dff, 0.9);
    g.beginPath();
    const pts = [[720, 20], [760, 60], [740, 90], [800, 130], [780, 150], [840, 200]];
    g.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach((p) => g.lineTo(p[0], p[1]));
    g.strokePath();
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokePath();
    // Pixel pines in two layers.
    const pine = (x, base, h, color) => {
      g.fillStyle(color, 1);
      const step = 8;
      for (let y = 0; y < h; y += step) {
        const half = Math.round(((y / h) * h * 0.35) / step) * step + step;
        g.fillRect(x - half, base - h + y, half * 2, step);
      }
      g.fillRect(x - 6, base, 12, 24);
    };
    const rnd = new Phaser.Math.RandomDataGenerator(['thornwood']);
    for (let x = -20; x < RF.W + 40; x += 70) pine(x + rnd.between(-10, 10), 300, rnd.between(150, 230), 0x13291f);
    for (let x = 10; x < RF.W + 40; x += 110) pine(x + rnd.between(-15, 15), 340, rnd.between(120, 180), 0x0c1d16);
    g.fillStyle(0x0a1611, 1);
    g.fillRect(0, 300, RF.W, 60);
  }

  makeEnemy() {
    if (!this.textures.exists('thornback')) {
      // Original creature: a bramble beast with a rift crack glowing through its back.
      const map = [
        '........t...t...t.......',
        '.......tt..tt..tt..t....',
        '......tdd.tdd.tdd.tt....',
        '.....dddddddddddddddt...',
        '....ddgggggggggggggddt..',
        '...ddggglgggglggggggdd..',
        '..ddgggggggggpgggggggdd.',
        '.dkkggggggggpggggggggdd.',
        'dkpwkgggggggpgggggggggdd',
        'dkppkggggggpggggglggggdd',
        'dkkkkggggggpggggggggggd.',
        '.dddggggggpggggggggggdd.',
        '.dwdwggggggggggggggggdd.',
        '..dddddggggggggggggdd...',
        '...ddbbdddggggggggddd...',
        '...dbbd..ddddddddbbd....',
        '...dbbd.......dbbbd.....',
        '...dbbd.......dbbd......',
        '..dbbbd......dbbbd......',
        '..ddddd......ddddd......'
      ];
      const colors = { t: 0xd9c27a, d: 0x1f3d1f, g: 0x3f7a35, l: 0x8fd14f, b: 0x5a3a1e, p: 0xd36bff, w: 0xffffff, k: 0x0b0b12 };
      const px = 11;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      map.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const c = colors[row[x]];
          if (c !== undefined) { g.fillStyle(c, 1); g.fillRect(x * px, y * px, px, px); }
        }
      });
      g.generateTexture('thornback', 24 * px, map.length * px);
      g.destroy();
    }
    this.enemyHome = { x: 990, y: 172 };
    this.add.ellipse(this.enemyHome.x, 290, 260, 34, 0x000000, 0.45);
    this.enemy = this.add.image(this.enemyHome.x, this.enemyHome.y, 'thornback');
    if (!RF.settings.reducedMotion) {
      this.idle = this.tweens.add({ targets: this.enemy, y: this.enemyHome.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  drawHud() {
    const x = 40, y = 26, w = 540;
    this.add.rectangle(x + w / 2 + 6, y + 50, w, 92, 0x000000, 0.6);
    this.add.rectangle(x + w / 2, y + 44, w, 92, 0x141a33, 0.95).setStrokeStyle(4, RF.ui.COLORS.panelEdge);
    const name = this.add.text(x + 20, y + 22, this.battle.enemyName[RF.lang()] || this.battle.enemyName.en,
      RF.textStyle(30, { fontStyle: '700', align: 'left' })).setOrigin(0, 0.5);
    RF.ui.fit(name, 440, 46);
    name.setInteractive({ useHandCursor: true }).on('pointerup', () => RF.speakText(name.text, 'en'));
    this.add.rectangle(x + 20, y + 66, 500, 26, 0x05070f).setOrigin(0, 0.5).setStrokeStyle(3, 0xffffff);
    this.hpBar = this.add.rectangle(x + 23, y + 66, 494, 20, 0x5ee07a).setOrigin(0, 0.5);
    // Streak pips (game score, never required to win).
    this.streakText = this.add.text(x + w - 16, y + 22, '', RF.textStyle(24, { fontStyle: '700', color: '#ffd76a' })).setOrigin(1, 0.5);
  }

  updateHp() {
    const frac = Math.max(0, this.hp / this.battle.hp);
    const color = frac > 0.5 ? 0x5ee07a : frac > 0.2 ? 0xffc94a : 0xff6b6b;
    this.hpBar.setFillStyle(color);
    if (RF.settings.reducedMotion) this.hpBar.width = 494 * frac;
    else this.tweens.add({ targets: this.hpBar, width: 494 * frac, duration: 420, ease: 'Cubic.easeOut' });
    this.streakText.setText(this.streak >= 2 ? 'x' + this.streak : '');
  }

  // ---------- Message box (left of the creature) ----------
  setMessage(id, speakItems) {
    if (this.msg) this.msg.destroy();
    this.msg = RF.ui.readLine(this, 40, 220, id, 28, { align: 'left', wrap: 520, style: { align: 'left' } });
    RF.ui.fit(this.msg, 620, 150);
    if (speakItems !== false) {
      if (speakItems) RF.speakSeq(speakItems); else RF.speak(id);
    }
    this.msgId = id;
  }

  // ---------- Shared bits ----------
  clearLayer() {
    if (this.focusCtl) { this.keyboard = this.focusCtl.showing(); this.focusCtl.destroy(); this.focusCtl = null; }
    if (this.layer) this.layer.destroy();
    this.layer = this.add.container(0, 0);
  }

  setFocus(items, start) {
    const show = this.focusCtl ? this.focusCtl.showing() : this.keyboard;
    if (this.focusCtl) this.focusCtl.destroy();
    this.focusCtl = RF.ui.focus(this, items, start || 0, { horizontal: true, show: show });
  }

  pickWeighted(list, count) {
    const pool = list.filter((it) => !this.used.has(it.w));
    const source = pool.length >= count ? pool : list.slice();
    const out = [];
    while (out.length < count && source.length) {
      const total = source.reduce((s, it) => s + RF.metrics.weight(it.w), 0);
      let r = Math.random() * total;
      let i = 0;
      for (; i < source.length - 1; i++) { r -= RF.metrics.weight(source[i].w); if (r <= 0) break; }
      out.push(source.splice(i, 1)[0]);
    }
    return out;
  }

  // ---------- Step 1: pick a move ----------
  showPick(first) {
    this.state = 'pick';
    this.clearLayer();
    RF.stopSpeaking();
    if (first) this.setMessage('battle.intro');
    else this.setMessage('battle.pick');

    const moves = this.pickWeighted(this.world.words, 2).map((it) => ({ item: it, rune: false }))
      .concat(this.pickWeighted(this.world.runes, 1).map((it) => ({ item: it, rune: true })));
    Phaser.Utils.Array.Shuffle(moves);

    const cardW = 330, cardH = 250, gap = 40;
    const left = RF.W / 2 - (cardW * 3 + gap * 2) / 2 + cardW / 2;
    const items = moves.map((m, i) => {
      const card = this.moveCard(left + i * (cardW + gap), 535, cardW, cardH, m);
      return { target: card, activate: () => this.choose(m, false) };
    });
    this.setFocus(items);
  }

  moveCard(x, y, w, h, m) {
    const c = this.add.container(x, y);
    this.layer.add(c);
    const fill = m.rune ? 0x3a1d5c : RF.ui.COLORS.button;
    const edge = m.rune ? 0xffc94a : RF.ui.COLORS.buttonEdge;
    const shadow = this.add.rectangle(7, 7, w, h, RF.ui.COLORS.shadow);
    const bg = this.add.rectangle(0, 0, w, h, fill).setStrokeStyle(5, edge);
    c.add([shadow, bg]);
    if (m.rune) {
      const tag = this.add.text(-w / 2 + 18, -h / 2 + 22, RF.t('battle.rune'), RF.textStyle(24, { fontStyle: '700', color: '#ffd76a' })).setOrigin(0, 0.5);
      c.add(tag);
    }
    const word = this.add.text(0, -6, m.item.w, RF.textStyle(76, { fontStyle: '700', color: m.rune ? '#ffe9a8' : '#ffffff' })).setOrigin(0.5);
    RF.ui.fit(word, w - 40, h - 110);
    c.add(word);
    // Power pips: runes hit harder.
    const pips = m.rune ? 5 : 3;
    for (let i = 0; i < pips; i++) {
      c.add(this.add.rectangle(-((pips - 1) * 26) / 2 + i * 26, h / 2 - 32, 16, 16, m.rune ? 0xffc94a : 0x8fd1ff));
    }
    // Speaker: hear the word (help).
    const sp = RF.ui.speaker(this, w / 2 - 38, -h / 2 + 38, () => {
      m.heard = true;
      RF.metrics.support('hearWord');
      RF.speakWord(m.item.w);
    }, 52);
    c.add(sp);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(m.rune ? 0x4d2878 : RF.ui.COLORS.buttonHover));
    bg.on('pointerout', () => bg.setFillStyle(fill));
    bg.on('pointerup', () => this.choose(m, false));
    c.setSize(w, h);
    return c;
  }

  // ---------- Step 2: pick the matching sound, then cast ----------
  choose(m, keepState) {
    RF.sfx('select');
    this.state = 'read';
    this.move = m;
    if (!keepState) {
      m.tries = 0;
      m.help = !!m.heard;
      m.revealed = false;
      m.startMs = Date.now();
      m.wrong = new Set();
      m.order = Phaser.Utils.Array.Shuffle([m.item.w].concat(m.item.options));
    }
    m.pick = null;
    this.clearLayer();
    this.setMessage(m.rune ? 'battle.whichRune' : 'battle.which');

    // The word, big, with a speaker for help.
    const wordBox = this.add.container(300, 485);
    this.layer.add(wordBox);
    wordBox.add(this.add.rectangle(6, 6, 400, 190, RF.ui.COLORS.shadow));
    wordBox.add(this.add.rectangle(0, 0, 400, 190, m.rune ? 0x3a1d5c : 0x141a33).setStrokeStyle(5, m.rune ? 0xffc94a : RF.ui.COLORS.panelEdge));
    const big = this.add.text(30, 0, m.item.w, RF.textStyle(100, { fontStyle: '700', color: m.rune ? '#ffe9a8' : '#ffffff' })).setOrigin(0.5);
    RF.ui.fit(big, 290, 170);
    wordBox.add(big);
    const hear = () => {
      if (!m.help) { m.help = true; RF.metrics.support('hearWord'); }
      RF.speakWord(m.item.w);
    };
    const sp = RF.ui.speaker(this, -150, 0, hear, 60);
    wordBox.add(sp);
    wordBox.setSize(400, 190);
    this.tilesY = 628;
    if (m.tries >= 1) this.showTiles(m);

    // Three sound choices.
    this.optionCtl = m.order.map((w, i) => this.optionButton(700 + i * 175, 470, w, m));
    const cast = RF.ui.button(this, 875, 600, 'battle.cast', () => this.cast(), { minWidth: 260, fontPx: 34 });
    this.layer.add(cast.container);
    RF.ui.fit(cast.container, 560, 110);
    const change = RF.ui.button(this, 300, 668, 'battle.changeMove', () => this.showPick(false), { fontPx: 22, minWidth: 220 });
    this.layer.add(change.container);
    RF.ui.fit(change.container, 520, 64);
    if (m.tries >= 1) change.container.setVisible(false);
    this.castBtn = cast;

    const items = [{ target: wordBox, activate: hear }];
    this.optionCtl.forEach((o) => items.push({ target: o.container, activate: o.pick, speak: o.disabled() ? null : o.listen }));
    items.push({ target: cast.container, activate: cast.activate, speak: cast.speak });
    if (m.tries === 0) items.push({ target: change.container, activate: change.activate, speak: change.speak });
    this.setFocus(items, 1);
  }

  optionButton(x, y, word, m) {
    const c = this.add.container(x, y);
    this.layer.add(c);
    const size = 150;
    const shadow = this.add.rectangle(6, 6, size, size, RF.ui.COLORS.shadow);
    const bg = this.add.rectangle(0, 0, size, size, RF.ui.COLORS.chip).setStrokeStyle(4, RF.ui.COLORS.chipEdge);
    const icon = this.add.image(0, -8, 'speaker').setDisplaySize(84, 84).setTint(0xffe9a8);
    const num = this.add.text(0, 54, String(m.order.indexOf(word) + 1), RF.textStyle(26, { fontStyle: '700' })).setOrigin(0.5);
    c.add([shadow, bg, icon, num]);
    c.setSize(size, size);
    const disabled = () => m.wrong.has(word) || (m.revealed && word !== m.item.w);
    const paint = () => {
      const on = m.pick === word;
      const off = disabled();
      bg.setFillStyle(on ? RF.ui.COLORS.chipOn : RF.ui.COLORS.chip);
      bg.setStrokeStyle(on ? 6 : 4, on ? 0xffffff : (m.revealed && word === m.item.w ? 0x5ee07a : RF.ui.COLORS.chipEdge));
      icon.setTint(on ? 0x1a1300 : 0xffe9a8);
      num.setColor(on ? '#1a1300' : '#ffffff');
      c.setAlpha(off ? 0.3 : 1);
    };
    const listen = () => { RF.speakWord(word); };
    const pick = () => {
      if (disabled()) { RF.sfx('back'); return; }
      m.pick = word;
      RF.sfx('tap');
      this.optionCtl.forEach((o) => o.paint());
      listen();
    };
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerup', pick);
    paint();
    if (m.revealed && word === m.item.w && !RF.settings.reducedMotion) {
      this.tweens.add({ targets: c, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    return { container: c, paint: paint, pick: pick, listen: listen, disabled: disabled, word: word };
  }

  showTiles(m) {
    // The word broken into its sounds. The vowel is gold.
    const letters = m.item.w.split('');
    const size = 70, gap = 12;
    const total = letters.length * size + (letters.length - 1) * gap;
    letters.forEach((ch, i) => {
      const vowel = 'aeiou'.indexOf(ch) >= 0;
      const tx = 300 - total / 2 + size / 2 + i * (size + gap);
      const t = this.add.rectangle(tx, this.tilesY, size, size, vowel ? 0xffc94a : 0x2a3470).setStrokeStyle(3, 0xffffff);
      const l = this.add.text(tx, this.tilesY, ch, RF.textStyle(44, { fontStyle: '700', color: vowel ? '#1a1300' : '#ffffff' })).setOrigin(0.5);
      RF.ui.fit(l, size - 8, size - 8);
      this.layer.add([t, l]);
    });
  }

  cast() {
    const m = this.move;
    if (!m.pick) { this.setMessage('battle.pickFirst'); return; }
    m.tries++;
    if (m.pick === m.item.w) { this.landHit(m); return; }
    m.wrong.add(m.pick);
    this.stats.misses++;
    this.streak = 0;
    this.updateHp();
    RF.sfx('soft');
    if (m.tries === 1) {
      this.choose(m, true);
      this.setMessage('battle.breakUp', [{ id: 'battle.breakUp' }, { word: m.item.w }]);
    } else {
      m.revealed = true;
      this.choose(m, true);
      this.setMessage('battle.reveal', [{ id: 'battle.reveal' }, { word: m.item.w }]);
    }
  }

  // ---------- Step 3: the hit lands ----------
  landHit(m) {
    const firstTry = m.tries === 1 && !m.help;
    const base = m.rune ? 25 : 15;
    let dmg;
    if (firstTry) dmg = base + Math.min(this.streak, 3) * 2;
    else if (m.revealed) dmg = Math.round(base * 0.35);
    else dmg = Math.round(base * 0.55);
    this.streak = firstTry ? this.streak + 1 : 0;

    this.used.add(m.item.w);
    this.stats.words++;
    if (firstTry) this.stats.firstTry++;
    if (m.help) this.stats.help++;
    RF.metrics.attempt({
      battle: this.battle.id, w: m.item.w, kind: m.rune ? 'rune' : 'real',
      pattern: 'w1.short-' + m.item.w.split('').find((ch) => 'aeiou'.indexOf(ch) >= 0),
      mode: 'tap', tries: m.tries, help: m.help, revealed: m.revealed, ms: Date.now() - m.startMs
    });

    let line;
    if (firstTry) {
      if (this.streak === 5) line = 'battle.streak5';
      else if (this.streak === 3) line = 'battle.streak3';
      else if (m.rune) line = 'battle.runeHit';
      else line = 'battle.hit' + (1 + (this.stats.firstTry % 4));
    } else if (m.revealed) line = 'battle.revealHit';
    else if (m.tries === 2) line = 'battle.secondHit';
    else line = 'battle.helpHit';

    this.state = 'result';
    this.clearLayer();
    this.attackFx(dmg, m.rune || this.streak >= 3);
    this.hp = Math.max(0, this.hp - dmg);
    this.updateHp();

    // Show the word again (hearing it now is free), plus its meaning when Spanish is on.
    const es = RF.lang() === 'es' && m.item.es;
    const wordY = es ? 470 : 520;
    const word = this.add.text(RF.W / 2, wordY, m.item.w, RF.textStyle(96, { fontStyle: '700', color: '#ffe9a8' })).setOrigin(0.5);
    RF.ui.fit(word, 600, 130);
    const sp = RF.ui.speaker(this, RF.W / 2 - word.displayWidth / 2 - 60, wordY, () => RF.speakWord(m.item.w), 60);
    this.layer.add([word, sp]);
    const speakItems = [{ word: m.item.w }, { id: line }];
    if (es) {
      const meaning = this.add.text(RF.W / 2 + 30, 575, RF.t('battle.meaning') + ' ' + m.item.es, RF.textStyle(36, { color: '#bfe3ff' })).setOrigin(0.5);
      RF.ui.fit(meaning, 900, 60);
      const esSp = RF.ui.speaker(this, RF.W / 2 + 30 - meaning.displayWidth / 2 - 50, 575, () => { RF.metrics.support('glossary'); RF.speakWord(m.item.es, 'es'); }, 52);
      this.layer.add([meaning, esSp]);
      speakItems.push({ es: m.item.es });
      if (m.item.cognate) {
        const cog = this.add.text(RF.W / 2, 615, RF.t('battle.cognate'), RF.textStyle(24, { color: '#ffd76a' })).setOrigin(0.5);
        RF.ui.fit(cog, 1000, 40);
        cog.setInteractive({ useHandCursor: true }).on('pointerup', () => RF.speak('battle.cognate'));
        this.layer.add(cog);
      }
    }
    this.setMessage(line, speakItems);

    const done = this.hp <= 0;
    const next = RF.ui.button(this, RF.W / 2, 672, 'battle.next', () => (done ? this.win() : this.showPick(false)), { minWidth: 240, fontPx: 28 });
    RF.ui.fit(next.container, 600, 64);
    this.layer.add(next.container);
    this.setFocus([{ target: next.container, activate: next.activate, speak: next.speak }]);
  }

  attackFx(dmg, big) {
    RF.sfx(big ? 'big' : 'hit');
    const e = this.enemy;
    const motion = !RF.settings.reducedMotion;
    const flash = () => {
      e.setTintFill(0xffffff);
      this.time.delayedCall(110, () => e.clearTint());
      const n = this.add.text(e.x, e.y - 95, '-' + dmg, RF.textStyle(48, { fontStyle: '700', color: '#ffd76a', stroke: '#2a1400', strokeThickness: 8 })).setOrigin(0.5);
      if (motion) {
        this.tweens.add({ targets: n, y: n.y - 50, alpha: 0, duration: 900, onComplete: () => n.destroy() });
        this.tweens.add({ targets: e, x: e.x + 14, duration: 50, yoyo: true, repeat: 3, onComplete: () => { e.x = this.enemyHome.x; } });
        if (big) this.cameras.main.shake(180, 0.006);
      } else {
        this.time.delayedCall(800, () => n.destroy());
      }
    };
    if (motion) {
      const bolt = this.add.rectangle(260, 470, 26, 26, 0xffc94a).setStrokeStyle(3, 0xffffff).setAngle(45);
      this.tweens.add({ targets: bolt, x: e.x, y: e.y, angle: 405, duration: 260, ease: 'Quad.easeIn', onComplete: () => { bolt.destroy(); flash(); } });
    } else {
      flash();
    }
  }

  // ---------- Win ----------
  win() {
    this.state = 'win';
    this.clearLayer();
    if (this.msg) { this.msg.destroy(); this.msg = null; }
    RF.metrics.battleDone({
      id: this.battle.id, words: this.stats.words, firstTry: this.stats.firstTry,
      misses: this.stats.misses, help: this.stats.help, ms: Date.now() - this.stats.start
    });
    RF.sfx('win');
    if (this.idle) this.idle.stop();
    if (!RF.settings.reducedMotion) this.tweens.add({ targets: this.enemy, alpha: 0, y: this.enemy.y + 40, angle: -8, duration: 700 });
    else this.enemy.setAlpha(0);

    const cx = RF.W / 2, cy = RF.H / 2;
    this.layer.add(this.add.rectangle(cx, cy, RF.W, RF.H, 0x000000, 0.55).setInteractive());
    const panel = RF.ui.panel(this, cx, cy, 900, 560);
    this.layer.add(panel);
    const line = RF.ui.readLine(this, cx, cy - 210, 'battle.win', 36, { wrap: 760, style: { fontStyle: '700', color: '#ffd76a' } });
    RF.ui.fit(line, 840, 110);
    this.layer.add(line);

    const stat = (x, labelId, value) => {
      const n = Math.min(value, 30);
      const num = this.add.text(x, cy - 65, String(value), RF.textStyle(110, { fontStyle: '700' })).setOrigin(0.5);
      num.setInteractive({ useHandCursor: true }).on('pointerup', () => RF.speak('num.' + n));
      const label = RF.ui.readLine(this, x, cy + 35, labelId, 28);
      RF.ui.fit(label, 360, 70);
      this.layer.add([num, label]);
    };
    stat(cx - 200, 'battle.statWords', this.stats.words);
    stat(cx + 200, 'battle.statFirst', this.stats.firstTry);

    const again = RF.ui.button(this, cx, cy + 132, 'battle.again', () => {
      RF.stopSpeaking();
      this.scene.restart({ keyboard: this.focusCtl && this.focusCtl.showing() });
    }, { minWidth: 340, fontPx: 32 });
    const title = RF.ui.button(this, cx, cy + 228, 'battle.toTitle', () => {
      RF.stopSpeaking();
      this.scene.start('Title', { keyboard: this.focusCtl && this.focusCtl.showing() });
    }, { minWidth: 340, fontPx: 28 });
    RF.ui.fit(again.container, 840, 80);
    RF.ui.fit(title.container, 840, 70);
    this.layer.add([again.container, title.container]);
    RF.speakSeq([{ id: 'battle.win' }, { id: 'battle.statWords' }, { id: 'num.' + Math.min(this.stats.words, 30) },
      { id: 'battle.statFirst' }, { id: 'num.' + Math.min(this.stats.firstTry, 30) }]);
    this.setFocus([
      { target: again.container, activate: again.activate, speak: again.speak },
      { target: title.container, activate: title.activate, speak: title.speak }
    ]);
  }
}
