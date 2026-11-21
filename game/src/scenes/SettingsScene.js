// Settings: language, text size, font, volume, motion and a microphone test.
// Every change saves right away on this device.
class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    data = data || {};
    RF.ui.backdrop(this);
    this.add.rectangle(RF.W / 2, RF.H / 2, RF.W, RF.H, 0x05070f, 0.55);

    const s = RF.settings;
    const set = (key, value, relayout) => {
      s[key] = value;
      RF.saveSettings();
      if (relayout) {
        // Redraw the screen so the new size, font or language shows everywhere.
        this.time.delayedCall(60, () => this.scene.restart({ keyboard: this.focus.showing(), focusIndex: this.focus.index() }));
      }
    };

    const rows = [
      { label: 'settings.language', control: () => RF.ui.chips(this, 0, 0, [
        { value: 'en', textId: 'lang.english', lang: 'en' },
        { value: 'es', textId: 'lang.spanish', lang: 'es' }
      ], s.lang, (v) => set('lang', v, true)) },
      { label: 'settings.textSize', control: () => RF.ui.chips(this, 0, 0, [
        { value: 'normal', textId: 'settings.size.normal' },
        { value: 'large', textId: 'settings.size.large' },
        { value: 'xlarge', textId: 'settings.size.xlarge' }
      ], s.textSize, (v) => set('textSize', v, true)) },
      { label: 'settings.font', control: () => RF.ui.chips(this, 0, 0, [
        { value: 'lexend', textId: 'settings.font.lexend' },
        { value: 'dyslexic', textId: 'settings.font.dyslexic' }
      ], s.font, (v) => set('font', v, true)) },
      { label: 'settings.volume', control: () => this.volumeControl((v) => set('volume', v, false)) },
      { label: 'settings.motion', control: () => RF.ui.chips(this, 0, 0, [
        { value: false, textId: 'settings.motion.full' },
        { value: true, textId: 'settings.motion.reduced' }
      ], s.reducedMotion, (v) => set('reducedMotion', v, true)) },
      { label: null, control: () => {
        const b = RF.ui.button(this, 0, 0, 'settings.mic', () => {
          this.scene.launch('MicTest', { from: 'Settings' });
          this.scene.pause();
        }, { fontPx: 28 });
        return Object.assign(b, { leftAlign: true });
      } }
    ];

    // Build every row inside one container, then shrink it to fit if the text is very large.
    const box = this.add.container(0, 0);
    const built = rows.map((r) => {
      const label = r.label ? RF.ui.readLine(this, 0, 0, r.label, 28, { align: 'left', style: { fontStyle: '700' } }) : null;
      const ctl = r.control();
      if (label) box.add(label);
      box.add(ctl.container);
      return { label: label, ctl: ctl };
    });
    const labelW = Math.max.apply(null, built.map((b) => (b.label ? b.label.width : 0)));
    const colX = labelW + 40;
    let y = 0;
    built.forEach((b) => {
      const h = Math.max(b.label ? b.label.height : 0, b.ctl.height);
      const midY = y + h / 2;
      if (b.label) b.label.setPosition(0, midY);
      // Chips are laid out from their left edge; buttons from their center.
      b.ctl.container.setPosition(b.ctl.leftAlign ? colX + b.ctl.width / 2 : colX, midY);
      y += h + 14;
    });

    const header = RF.ui.readLine(this, RF.W / 2, 0, 'settings.title', 40, { style: { fontStyle: '700', color: '#ffd76a' } });
    const back = RF.ui.button(this, RF.W / 2, 0, 'settings.back', () => this.goBack(), { minWidth: 240, fontPx: 28 });

    const top = 16 + header.height + 14;
    const bottomRoom = back.height + 30;
    const availH = RF.H - top - bottomRoom;
    const scale = RF.ui.fit(box, RF.W - 120, availH);
    const bw = box.getBounds().width;
    const bh = box.getBounds().height;
    box.setPosition((RF.W - bw) / 2, top + (availH - bh) / 2);
    header.y = 16 + header.height / 2;
    back.container.y = RF.H - 14 - back.height / 2;
    if (scale < 1) console.info('Settings rows scaled to fit:', scale.toFixed(2));

    this.onEscape = () => this.goBack();
    const items = built.map((b) => ({
      target: b.ctl.container,
      activate: b.ctl.activate,
      left: b.ctl.left,
      right: b.ctl.right,
      speak: b.label ? b.label.speak : b.ctl.speak
    }));
    items.push({ target: back.container, activate: back.activate, speak: back.speak });
    this.focus = RF.ui.focus(this, items, data.focusIndex || 0);
  }

  volumeControl(onChange) {
    const c = this.add.container(0, 0);
    const size = Math.round(52 * Math.min(RF.textScale(), 1.15));
    const segW = 22;
    const segH = size * 0.7;
    const gap = 6;
    const makeStep = (x, sign) => {
      const shadow = this.add.rectangle(x + 4, 4, size, size, RF.ui.COLORS.shadow);
      const bg = this.add.rectangle(x, 0, size, size, RF.ui.COLORS.chip).setStrokeStyle(3, RF.ui.COLORS.chipEdge);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(x - size * 0.25, -4, size * 0.5, 8);
      if (sign > 0) g.fillRect(x - 4, -size * 0.25, 8, size * 0.5);
      c.add([shadow, bg, g]);
      bg.setInteractive({ useHandCursor: true }).on('pointerup', () => change(sign));
    };
    makeStep(size / 2, -1);
    const barX = size + 16;
    const segs = [];
    for (let i = 0; i < 10; i++) {
      const r = this.add.rectangle(barX + i * (segW + gap) + segW / 2, 0, segW, segH, 0xffc94a).setStrokeStyle(2, 0xffffff);
      segs.push(r);
      c.add(r);
      r.setInteractive({ useHandCursor: true }).on('pointerup', () => { RF.settings.volume = i + 1; paint(); onChange(i + 1); RF.sfx('move'); });
    }
    const plusX = barX + 10 * (segW + gap) + 10 + size / 2;
    makeStep(plusX, 1);
    const paint = () => segs.forEach((r, i) => r.setFillStyle(i < RF.settings.volume ? 0xffc94a : 0x1d2550));
    const change = (dir) => {
      const v = Math.max(0, Math.min(10, RF.settings.volume + dir));
      RF.settings.volume = v;
      paint();
      onChange(v);
      RF.sfx('move');
    };
    paint();
    const width = plusX + size / 2;
    c.setSize(width, size);
    return { container: c, width: width, height: size, left: () => change(-1), right: () => change(1), activate: () => change(1) };
  }

  goBack() {
    RF.sfx('back');
    RF.stopSpeaking();
    this.scene.start('Title', { keyboard: this.focus.showing() });
  }
}
