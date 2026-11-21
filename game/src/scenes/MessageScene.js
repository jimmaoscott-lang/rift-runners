// A message box over the current screen. Stays open until the student closes it (no timer).
class MessageScene extends Phaser.Scene {
  constructor() { super('Message'); }

  create(data) {
    this.add.rectangle(RF.W / 2, RF.H / 2, RF.W, RF.H, 0x000000, 0.55).setInteractive();
    const cx = RF.W / 2;
    const cy = RF.H / 2;
    const line = RF.ui.readLine(this, 0, 0, data.textId, 34, { wrap: 760 });
    const ok = RF.ui.button(this, 0, 0, 'common.ok', () => this.close(), { minWidth: 260 });
    const w = Math.min(RF.W - 60, Math.max(line.width, ok.width) + 100);
    const h = line.height + ok.height + 120;
    const panel = RF.ui.panel(this, cx, cy, w, h);
    line.setPosition(cx, cy - h / 2 + 50 + line.height / 2);
    ok.container.setPosition(cx, cy + h / 2 - 40 - ok.height / 2);
    this.children.bringToTop(line);
    this.children.bringToTop(ok.container);
    RF.sfx('open');
    RF.speak(data.textId);
    this.from = data.from;
    this.onEscape = () => this.close();
    this.focus = RF.ui.focus(this, [{ target: ok.container, activate: ok.activate, speak: ok.speak }]);
    if (!RF.settings.reducedMotion) {
      [panel, line, ok.container].forEach((o) => { o.setScale(0.9); });
      this.tweens.add({ targets: [panel, line, ok.container], scale: 1, duration: 160, ease: 'Back.easeOut' });
    }
  }

  close() {
    RF.stopSpeaking();
    this.scene.stop();
    if (this.from) this.scene.resume(this.from);
  }
}
