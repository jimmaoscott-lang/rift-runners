// Microphone test. Checks whether speak mode can work on this device and in this version
// of the game (website, offline file or Apps Script). Tap mode never needs the microphone.
class MicTestScene extends Phaser.Scene {
  constructor() { super('MicTest'); }

  create(data) {
    this.from = data.from;
    this.add.rectangle(RF.W / 2, RF.H / 2, RF.W, RF.H, 0x000000, 0.6).setInteractive();
    const cx = RF.W / 2;
    const w = 1000;
    const h = 560;
    RF.ui.panel(this, cx, RF.H / 2, w, h);
    const top = RF.H / 2 - h / 2;

    const title = RF.ui.readLine(this, cx, top + 60, 'mic.title', 40, { style: { fontStyle: '700', color: '#ffd76a' } });
    RF.ui.fit(title, w - 60);
    this.status = RF.ui.readLine(this, cx, top + 170, 'mic.prompt', 30, { wrap: 780 });
    RF.ui.fit(this.status, w - 60);
    this.heard = this.add.text(cx, top + 290, '', RF.textStyle(34, { fontStyle: '700', color: '#9cf2c0', wordWrap: { width: 800 } })).setOrigin(0.5);
    this.heard.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (this.heardWords) RF.speakText(this.heardWords, 'en');
    });

    const start = RF.ui.button(this, cx - 180, top + h - 80, 'mic.start', () => this.listen(), { minWidth: 220, fontPx: 30 });
    const back = RF.ui.button(this, cx + 200, top + h - 80, 'settings.back', () => this.close(), { minWidth: 220, fontPx: 30 });
    [start, back].forEach((b) => RF.ui.fit(b.container, 440));

    this.onEscape = () => this.close();
    this.focus = RF.ui.focus(this, [
      { target: start.container, activate: start.activate, speak: start.speak },
      { target: back.container, activate: back.activate, speak: back.speak }
    ]);
    RF.sfx('open');
  }

  setStatus(id) {
    const x = this.status.x;
    const y = this.status.y;
    this.status.destroy();
    this.status = RF.ui.readLine(this, x, y, id, 30, { wrap: 780 });
    RF.ui.fit(this.status, 940);
    RF.speak(id);
  }

  listen() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.heard.setText('');
    this.heardWords = '';
    if (!Rec) { this.setStatus('mic.unsupported'); return; }
    if (this.rec) { try { this.rec.abort(); } catch (e) { /* ignore */ } }
    RF.stopSpeaking();
    const rec = new Rec();
    this.rec = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let gotResult = false;
    rec.onresult = (ev) => {
      gotResult = true;
      const words = ev.results[0][0].transcript;
      this.heardWords = words;
      this.heard.setText(RF.t('mic.heard') + ' "' + words + '"');
      this.setStatus('mic.ok');
      console.info('Mic test heard:', words);
    };
    rec.onerror = (ev) => {
      gotResult = true;
      console.warn('Mic test error:', ev.error);
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed' || ev.error === 'audio-capture') this.setStatus('mic.blocked');
      else if (ev.error === 'network') this.setStatus('mic.offline');
      else if (ev.error === 'no-speech') this.setStatus('mic.nothing');
      else { this.setStatus('mic.blocked'); this.heard.setText('(' + ev.error + ')'); }
    };
    rec.onend = () => { if (!gotResult) this.setStatus('mic.nothing'); };
    try {
      rec.start();
      this.setStatusSilent('mic.listening');
    } catch (e) {
      console.warn('Mic test could not start:', e);
      this.setStatus('mic.blocked');
    }
  }

  setStatusSilent(id) {
    const x = this.status.x;
    const y = this.status.y;
    this.status.destroy();
    this.status = RF.ui.readLine(this, x, y, id, 30, { wrap: 780 });
    RF.ui.fit(this.status, 940);
  }

  close() {
    if (this.rec) { try { this.rec.abort(); } catch (e) { /* ignore */ } }
    RF.stopSpeaking();
    RF.sfx('back');
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
