// Core helpers shared by every scene: data loading, settings, text, read-aloud and sound effects.
// RF_INLINE is set only in the all-in-one build (offline file and Apps Script). It holds the
// JSON data and audio files packed inside the page, so nothing has to be fetched.
window.RF = window.RF || {};
(function (RF) {
  const INLINE = window.RF_INLINE || null;
  RF.isInline = !!INLINE;
  RF.VERSION = 'v0.16.1';
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
  const DEFAULTS = { lang: null, textSize: 'normal', font: 'lexend', volume: 8, music: 6, effects: 8, reducedMotion: prefersReduced, focus: false, captions: false, speakFirst: 0, speakLock: false, pinHash: null, testAll: false, speed: 1 };
  RF.settings = Object.assign({}, DEFAULTS);
  RF.loadSettings = function () {
    try {
      const saved = JSON.parse(RF.store.get(SETTINGS_KEY) || '{}');
      RF.settings = Object.assign({}, DEFAULTS, saved);
    } catch (e) {
      RF.settings = Object.assign({}, DEFAULTS);
    }
  };
  // Teacher PIN: kept only on this device as a scrambled code. It keeps students from changing
  // a teacher setting; it is not a password for anything else.
  RF.pinHash = function (pin) {
    let h = 5381;
    const str = 'rift-runners:' + pin;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
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

  // ---------- Read-aloud ----------
  // Plays the pre-made voice file for a line. If the file does not exist yet,
  // falls back to the Chromebook's built-in voice. Every call returns a promise that
  // finishes when the speaking ends, so lines can be chained. A newer call cancels older ones.
  RF.voiceManifest = { en: {}, es: {} };
  RF.wordManifest = { en: {}, es: {} };
  let currentAudio = null;
  let speakToken = 0;
  RF.stopSpeaking = function () {
    speakToken++;
    // While the mic is listening, game sound stays low so it does not end up in the recording.
    if (RF.audio) RF.audio.duck(RF.mic && RF.mic.busy ? 2 : 0);
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };
  function playFile(url, fallbackText, lang, token) {
    return new Promise(function (resolve) {
      if (token !== speakToken) return resolve();
      const audio = new Audio(RF.assetURL(url));
      audio.volume = RF.settings.volume / 10;
      currentAudio = audio;
      audio.onended = function () { resolve(); };
      audio.onerror = function () { speakNow(fallbackText, lang, token).then(resolve); };
      audio.play().catch(function () { speakNow(fallbackText, lang, token).then(resolve); });
    });
  }
  function speakNow(text, lang, token) {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis || !text || token !== speakToken) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (lang || RF.lang()) === 'es' ? 'es-MX' : 'en-US';
      u.volume = RF.settings.volume / 10;
      u.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(function (v) { return v.lang && v.lang.replace('_', '-').indexOf(u.lang.slice(0, 2)) === 0; });
      if (match) u.voice = match;
      u.onend = function () { resolve(); };
      u.onerror = function () { resolve(); };
      window.speechSynthesis.speak(u);
      // Some browsers never fire onend. Do not wait forever.
      setTimeout(resolve, 600 + text.length * 120);
    });
  }
  // One menu or story line (id from strings.json).
  function lineJob(id, lang) {
    const l = lang || RF.lang();
    const file = (RF.voiceManifest[l] || {})[id];
    const text = RF.t(id, l);
    return function (token) {
      return file ? playFile('../assets/audio/ui/' + file, text, l, token) : speakNow(text, l, token);
    };
  }
  // One battle word (English) or Spanish meaning.
  function wordJob(word, lang) {
    const l = lang || 'en';
    const file = (RF.wordManifest[l] || {})[word];
    return function (token) {
      return file ? playFile('../assets/audio/words/' + file, word, l, token) : speakNow(word, l, token);
    };
  }
  function run(jobs, isWord) {
    // While the student is speaking into the mic, narrator lines wait until the mic is done, so they
    // do not cut into the recording or turn game sound back up mid-word (Mr. Scott, November 22).
    if (RF.mic && RF.mic.busy) {
      return new Promise(function (res) { (function wait() { if (RF.mic && RF.mic.busy) setTimeout(wait, 150); else res(); })(); })
        .then(function () { return run(jobs, isWord); });
    }
    RF.stopSpeaking();
    const token = speakToken;
    // Music and battle sounds drop while a line is read aloud, and drop low for a word to decode.
    if (RF.audio) RF.audio.duck(isWord ? 2 : 1);
    return jobs.reduce(function (p, job) {
      return p.then(function () { return token === speakToken ? job(token) : null; });
    }, Promise.resolve()).then(function () {
      if (token === speakToken && RF.audio) RF.audio.duck(0);
    });
  }
  RF.speak = function (id, lang) { return run([lineJob(id, lang)]); };
  RF.speakWord = function (word, lang) { return run([wordJob(word, lang)], true); };
  RF.speakText = function (text, lang) {
    return run([function (token) { return speakNow(text, lang, token); }], true);
  };
  // Several in a row: items are { id } for a line, { word } for a battle word, { es } for a Spanish meaning.
  // One letter sound, like /m/ or /a/ (voiced as a sound, never the letter name). If the file is
  // missing, nothing is said: the computer voice would say the letter's name, which teaches the wrong thing.
  function soundJob(letter) {
    const file = (RF.wordManifest.en || {})['snd:' + letter];
    return function (token) {
      return file ? playFile('../assets/audio/words/' + file, '', 'en', token) : new Promise(function (r) { setTimeout(r, 450); });
    };
  }
  // Several in a row: items are { id } for a line, { word } for a battle word, { es } for a Spanish
  // meaning, { snd } for one letter sound, { pause: ms } for a short gap. { on } runs just before
  // that item plays (used to light up letters as their sounds are said).
  RF.speakSeq = function (items) {
    return run(items.map(function (it) {
      let job;
      if (it.pause) job = function () { return new Promise(function (r) { setTimeout(r, it.pause); }); };
      else if (it.snd) job = soundJob(it.snd);
      else if (it.word) job = wordJob(it.word, 'en');
      else if (it.es) job = wordJob(it.es, 'es');
      else if (it.text != null) job = function (token) { return speakNow(String(it.text), it.lang || RF.lang(), token); };
      else job = lineJob(it.id, it.lang);
      if (!it.on) return job;
      return function (token) { it.on(); return job(token); };
    }), items.some(function (it) { return it.word || it.es || it.snd; }));
  };

  // ---------- Sound effects (made in code, chiptune style, no files) ----------
  // They play through the Effects volume (game/src/audio.js).
  RF.sfx = function (kind) {
    const vol = 1;
    if (!RF.audio || (RF.settings.effects == null ? 8 : RF.settings.effects) <= 0) return;
    try {
      const actx = RF.audio.context();
      if (!actx) return;
      const notes = {
        move: [[660, 0.05]],
        select: [[523, 0.06], [784, 0.09]],
        back: [[523, 0.06], [392, 0.09]],
        open: [[392, 0.05], [523, 0.05], [784, 0.12]],
        hit: [[196, 0.04], [880, 0.05], [1175, 0.1]],
        big: [[262, 0.05], [523, 0.05], [784, 0.05], [1047, 0.16]],
        soft: [[440, 0.08], [415, 0.12]],
        tap: [[740, 0.04]],
        win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]]
      }[kind] || [[600, 0.05]];
      let t = actx.currentTime;
      notes.forEach(function (n) {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'square';
        osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0.08 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
        osc.connect(gain).connect(RF.audio.fxOut());
        osc.start(t);
        osc.stop(t + n[1] + 0.02);
        t += n[1];
      });
    } catch (e) { /* sound is optional */ }
  };
})(window.RF);
