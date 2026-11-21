// Core helpers shared by every scene: data loading, settings, text, read-aloud and sound effects.
// RF_INLINE is set only in the all-in-one build (offline file and Apps Script). It holds the
// JSON data and audio files packed inside the page, so nothing has to be fetched.
window.RF = window.RF || {};
(function (RF) {
  const INLINE = window.RF_INLINE || null;
  RF.isInline = !!INLINE;
  RF.VERSION = 'v0.1.2';
  RF.W = 1280;
  RF.H = 720;

  // ---------- Data ----------
  RF.loadJSON = async function (path) {
    if (INLINE) {
      // All-in-one build: everything is packed in the page. Never reach out to the network.
      if (INLINE.json && INLINE.json[path]) return INLINE.json[path];
      throw new Error('Not packed in this build: ' + path);
    }
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load ' + path + ' (' + res.status + ')');
    return res.json();
  };
  RF.assetURL = function (path) {
    if (INLINE && INLINE.files && INLINE.files[path]) return INLINE.files[path];
    return path;
  };

  // ---------- Storage (device only; works even if the browser blocks storage) ----------
  const memory = {};
  RF.store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (e) { return key in memory ? memory[key] : null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { memory[key] = value; }
    }
  };

  // ---------- Settings ----------
  const SETTINGS_KEY = 'riftrunners.settings.v1';
  const prefersReduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const DEFAULTS = { lang: null, textSize: 'normal', font: 'lexend', volume: 8, reducedMotion: prefersReduced };
  RF.settings = Object.assign({}, DEFAULTS);
  RF.loadSettings = function () {
    try {
      const saved = JSON.parse(RF.store.get(SETTINGS_KEY) || '{}');
      RF.settings = Object.assign({}, DEFAULTS, saved);
    } catch (e) {
      RF.settings = Object.assign({}, DEFAULTS);
    }
  };
  RF.saveSettings = function () {
    RF.store.set(SETTINGS_KEY, JSON.stringify(RF.settings));
  };

  // ---------- Text ----------
  RF.strings = { en: {}, es: {} };
  RF.lang = function () { return RF.settings.lang || 'en'; };
  RF.t = function (id, lang) {
    const l = lang || RF.lang();
    const table = RF.strings[l] || {};
    if (id in table) return table[id];
    if (id in RF.strings.en) return RF.strings.en[id];
    return id;
  };
  RF.TEXT_SCALES = { normal: 1, large: 1.2, xlarge: 1.4 };
  RF.textScale = function () { return RF.TEXT_SCALES[RF.settings.textSize] || 1; };
  RF.fontFamily = function () {
    return RF.settings.font === 'dyslexic' ? 'OpenDyslexic, Lexend, sans-serif' : 'Lexend, sans-serif';
  };
  // Style for any text a student reads: reading font, large, high contrast.
  RF.textStyle = function (basePx, extra) {
    const px = Math.round(basePx * RF.textScale());
    return Object.assign({
      fontFamily: RF.fontFamily(),
      fontSize: px + 'px',
      color: '#ffffff',
      align: 'center',
      resolution: 2
    }, extra || {});
  };

  // ---------- Read-aloud ----------
  // Plays the pre-made voice file for a line. If the file does not exist yet,
  // falls back to the Chromebook's built-in voice.
  RF.voiceManifest = { en: {}, es: {} };
  let currentAudio = null;
  RF.stopSpeaking = function () {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };
  RF.speak = function (id, lang) {
    const l = lang || RF.lang();
    const file = (RF.voiceManifest[l] || {})[id];
    const text = RF.t(id, l);
    RF.stopSpeaking();
    if (file) {
      const audio = new Audio(RF.assetURL('../assets/audio/ui/' + file));
      audio.volume = RF.settings.volume / 10;
      currentAudio = audio;
      audio.play().catch(function () { RF.speakText(text, l); });
      return;
    }
    RF.speakText(text, l);
  };
  RF.speakText = function (text, lang) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (lang || RF.lang()) === 'es' ? 'es-MX' : 'en-US';
    u.volume = RF.settings.volume / 10;
    u.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(function (v) { return v.lang && v.lang.replace('_', '-').indexOf(u.lang.slice(0, 2)) === 0; });
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  };

  // ---------- Sound effects (made in code, chiptune style, no files) ----------
  let actx = null;
  RF.sfx = function (kind) {
    const vol = RF.settings.volume / 10;
    if (vol <= 0) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const notes = {
        move: [[660, 0.05]],
        select: [[523, 0.06], [784, 0.09]],
        back: [[523, 0.06], [392, 0.09]],
        open: [[392, 0.05], [523, 0.05], [784, 0.12]]
      }[kind] || [[600, 0.05]];
      let t = actx.currentTime;
      notes.forEach(function (n) {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'square';
        osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0.08 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
        osc.connect(gain).connect(actx.destination);
        osc.start(t);
        osc.stop(t + n[1] + 0.02);
        t += n[1];
      });
    } catch (e) { /* sound is optional */ }
  };
})(window.RF);
