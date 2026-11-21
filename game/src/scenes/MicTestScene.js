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
    this.startMeter();
    const rec = new Rec();
    this.rec = rec;
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 3;
    // What happened, step by step. Used to explain a miss in plain words.
    const seen = { audio: false, sound: false, speech: false, error: null };
    let done = false;
    rec.onaudiostart = () => { seen.audio = true; };
    rec.onsoundstart = () => { seen.sound = true; };
    rec.onspeechstart = () => { seen.speech = true; };
    rec.onresult = (ev) => {
      let words = '';
      for (let i = 0; i < ev.results.length; i++) words += ev.results[i][0].transcript;
      words = words.trim();
      if (!words) return;
      this.heardWords = words;
      this.heard.setText(RF.t('mic.heard') + ' "' + words + '"');
      const isFinal = ev.results[ev.results.length - 1].isFinal;
      if (isFinal && !done) { done = true; this.finish('mic.ok'); }
    };
    rec.onerror = (ev) => {
      seen.error = ev.error;
      console.warn('Mic test error:', ev.error);
    };
    rec.onend = () => {
      console.info('Mic test steps:', JSON.stringify(seen), 'loudest level:', this.peak.toFixed(3));
      const yn = (v) => (v ? 'yes' : 'no');
      if (this.diag) {
        this.diag.setText('Mic on: ' + yn(seen.audio) + '   Sound: ' + yn(seen.sound) + '   Speech: ' + yn(seen.speech) +
          '   Level: ' + Math.round(this.peak * 1000) + '   Error: ' + (seen.error || 'none') + '   ' + RF.VERSION);
      }
      if (done) return;
      done = true;
      if (this.heardWords) { this.finish('mic.ok'); return; }
      const e = seen.error;
      if (e === 'not-allowed' || e === 'service-not-allowed' || e === 'audio-capture') this.finish('mic.blocked');
      else if (e === 'network') this.finish('mic.offline');
      else if (!seen.audio && !this.meterOn) this.finish('mic.notOn');
      else if (this.peak < 0.02) this.finish('mic.silent');
      else this.finish('mic.nothing');
    };
    try {
      rec.start();
      this.setStatusSilent('mic.listening');
    } catch (e) {
      console.warn('Mic test could not start:', e);
      this.finish('mic.blocked');
    }
  }

  finish(id) {
    this.stopMeter();
    this.setStatus(id);
  }

  // Live sound meter, so you can see whether the microphone hears anything at all.
  startMeter() {
    this.stopMeter();
    this.peak = 0;
    this.meterOn = false;
    if (!this.meterBar) {
      const y = this.heard.y + 70;
      this.add.rectangle(RF.W / 2, y, 604, 34, 0x05070f).setStrokeStyle(3, RF.ui.COLORS.chipEdge);
      this.meterBar = this.add.rectangle(RF.W / 2 - 300, y, 0, 26, 0x9cf2c0).setOrigin(0, 0.5);
      this.diag = this.add.text(RF.W / 2, y + 40, '', { fontFamily: 'Lexend, sans-serif', fontSize: '20px', color: '#c8cdf0', resolution: 2 }).setOrigin(0.5);
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    const token = this.meterToken = (this.meterToken || 0) + 1;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (token !== this.meterToken || !this.scene.isActive()) {
        // The test already ended before the microphone opened.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      this.meterOn = true;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.meterCtx = new Ctx();
      const src = this.meterCtx.createMediaStreamSource(stream);
      const an = this.meterCtx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      this.meterTick = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const level = Math.sqrt(sum / buf.length);
        this.peak = Math.max(this.peak, level);
        this.meterBar.width = Math.min(600, level * 3000);
      };
      this.events.on('update', this.meterTick);
    }).catch((err) => {
      console.warn('Sound meter could not start:', err && err.name);
    });
  }

  stopMeter() {
    this.meterToken = (this.meterToken || 0) + 1;
    if (this.meterTick) { this.events.off('update', this.meterTick); this.meterTick = null; }
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    if (this.meterCtx) { this.meterCtx.close(); this.meterCtx = null; }
    if (this.meterBar) this.meterBar.width = 0;
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
    this.stopMeter();
    RF.stopSpeaking();
    RF.sfx('back');
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
