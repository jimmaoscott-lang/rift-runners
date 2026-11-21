// First launch: the student picks English or Spanish. Changeable anytime in Settings.
class LanguageScene extends Phaser.Scene {
  constructor() { super('Language'); }

  create() {
    RF.ui.backdrop(this);
    const cx = RF.W / 2;
    const p1 = RF.ui.readLine(this, cx, 170, 'lang.prompt', 40, { lang: 'en', style: { fontStyle: '700' } });
    const p2 = RF.ui.readLine(this, cx, 250, 'lang.prompt', 40, { lang: 'es', style: { fontStyle: '700', color: '#ffe9a8' } });
    RF.ui.fit(p1, 1180);
    RF.ui.fit(p2, 1180);

    const choose = (lang) => {
      RF.settings.lang = lang;
      RF.saveSettings();
      this.scene.start('Title');
    };
    const en = RF.ui.button(this, cx, 400, 'lang.english', () => choose('en'), { lang: 'en', minWidth: 360, fontPx: 40 });
    const es = RF.ui.button(this, cx, 400 + en.height + 40, 'lang.spanish', () => choose('es'), { lang: 'es', minWidth: 360, fontPx: 40 });
    this.focus = RF.ui.focus(this, [
      { target: en.container, activate: en.activate, speak: en.speak },
      { target: es.container, activate: es.activate, speak: es.speak }
    ]);
  }
}
