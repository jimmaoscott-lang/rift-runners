// Title screen: game name, tagline, Play and Settings.
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    RF.ui.backdrop(this);
    const cx = RF.W / 2;
    const motion = !RF.settings.reducedMotion;

    // Rune bars above and below the title (decoration only).
    const runes = this.add.graphics();
    runes.fillStyle(0xffc94a, 1);
    for (let i = -7; i <= 7; i++) {
      const w = i % 2 === 0 ? 24 : 12;
      runes.fillRect(cx + i * 40 - w / 2, 92, w, 8);
      runes.fillRect(cx + i * 40 - w / 2, 300, w, 8);
    }

    // Game title: decoration size, still in the reading font. Tap it to hear it.
    const titleSize = Math.min(120, Math.round(110 * RF.textScale()));
    const title = this.add.text(cx, 196, RF.t('title.name').toUpperCase(), {
      fontFamily: RF.fontFamily(), fontSize: titleSize + 'px', fontStyle: '700',
      color: '#ffd76a', stroke: '#2a1400', strokeThickness: 12, resolution: 2,
      shadow: { offsetX: 0, offsetY: 8, color: '#000000', blur: 0, fill: true, stroke: true }
    }).setOrigin(0.5);
    RF.ui.fit(title, 1200);
    title.setInteractive({ useHandCursor: true }).on('pointerup', () => RF.speak('title.name'));
    if (motion) {
      this.tweens.add({ targets: title, y: 188, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const tagline = RF.ui.readLine(this, cx, 370, 'title.tagline', 32, { style: { color: '#e6e9ff' } });
    RF.ui.fit(tagline, 1180);

    const play = RF.ui.button(this, cx, 0, 'title.play', () => {
      RF.stopSpeaking();
      this.scene.start('Battle', { keyboard: this.focus.showing() });
    }, { minWidth: 340, fontPx: 40 });
    const settings = RF.ui.button(this, cx, 0, 'title.settings', () => {
      this.scene.start('Settings', { keyboard: this.focus.showing() });
    }, { minWidth: 340, fontPx: 34 });
    // Stack the buttons under the tagline, leaving room for larger text sizes.
    const top = tagline.y + tagline.height / 2 + 30;
    play.container.y = top + play.height / 2;
    settings.container.y = play.container.y + play.height / 2 + 26 + settings.height / 2;
    const bottom = settings.container.y + settings.height / 2;
    if (bottom > RF.H - 20) {
      const shift = bottom - (RF.H - 20);
      play.container.y -= shift;
      settings.container.y -= shift;
    }

    if (motion) {
      this.tweens.add({ targets: play.container, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.focus = RF.ui.focus(this, [
      { target: play.container, activate: play.activate, speak: play.speak },
      { target: settings.container, activate: settings.activate, speak: settings.speak }
    ]);
  }
}
