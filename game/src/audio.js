// Sound for Hold the Rift: defender, creature and big-moment sounds, plus battle music with a
// calm mood (building, between waves) and an attack mood (waves). Everything is made in code with
// the Web Audio API, so there are no sound files (DESIGN.md section 10). Music and effects drop
// low while a word or line is read aloud, so the vowel is easy to hear. Volumes come from Settings.
// The sample page sound-samples.html plays the same sounds.
window.RF = window.RF || {};
(function (RF) {
  const A = {};
  RF.audio = A;
  // While speaking, music and effects drop: a little for menu and story lines, a lot for words to decode.
  const DUCK = [[1, 1], [0.45, 0.6], [0.15, 0.25]];
  const musicLevel = function () { return (RF.settings.music == null ? 6 : RF.settings.music) / 10 * 1.4 * DUCK[ducked][0]; };
  const fxLevel = function () { return (RF.settings.effects == null ? 8 : RF.settings.effects) / 10 * DUCK[ducked][1]; };
  let ducked = 0;

  let ctx = null, master, musicBus, fxBus, comp;
  function ac() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
    master = ctx.createGain(); master.gain.value = 0.9;
    musicBus = ctx.createGain(); musicBus.gain.value = musicLevel();
    fxBus = ctx.createGain(); fxBus.gain.value = fxLevel();
    musicBus.connect(comp); fxBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    return ctx;
  }
  // White noise, made once and reused.
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.loopStart = Math.random(); return s;
  }
  // Envelope helper: quick attack, exponential fall.
  function env(g, t, peak, a, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f0, f1, t, dur, peak, out, a) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak, a || 0.003, dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function burst(t, dur, peak, type, f0, f1, out, q, a) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 0.8;
    env(g, t, peak, a || 0.002, dur);
    n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + dur + 0.05);
  }

  // ---------- Sound effects ----------
  // Cap on sounds at once, so a busy wave stays clear.
  let live = 0; const MAX_LIVE = 7;
  function fx(name) {
    if (fxLevel() <= 0) return;
    try { ac(); } catch (e) { return; }
    if (live >= MAX_LIVE) return;
    live++;
    const t = ctx.currentTime + 0.01;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(fxBus);
    const len = (FX[name] || FX.archer)(t, out) || 0.5;
    setTimeout(function () { live--; out.disconnect(); }, len * 1000 + 120);
  }
  const FX = {
    archer: function (t, o) { // bow twang, then the arrow hiss
      osc('triangle', 520, 180, t, 0.12, 0.5, o);
      osc('square', 1040, 300, t, 0.05, 0.08, o);
      burst(t + 0.02, 0.18, 0.18, 'bandpass', 3000, 6000, o, 1.2, 0.04);
      return 0.25;
    },
    arrowHit: function (t, o) { // thwack into a creature
      burst(t, 0.07, 0.6, 'lowpass', 2500, 400, o, 1);
      osc('sine', 220, 90, t, 0.08, 0.35, o);
      return 0.12;
    },
    ember: function (t, o) { // cannon thump, then a whistle as the shell flies
      osc('sine', 140, 38, t, 0.35, 1.0, o);
      burst(t, 0.22, 0.7, 'lowpass', 1800, 120, o, 0.7);
      osc('sine', 1500, 600, t + 0.12, 0.5, 0.05, o, 0.08);
      return 0.65;
    },
    emberBoom: function (t, o) { // shell lands: boom and crackle
      osc('sine', 90, 28, t, 0.7, 1.0, o);
      burst(t, 0.6, 0.9, 'lowpass', 3500, 90, o, 0.6);
      for (let i = 0; i < 6; i++) burst(t + 0.08 + Math.random() * 0.35, 0.03, 0.25, 'highpass', 2500, 0, o, 0.5);
      return 0.8;
    },
    lightning: function (t, o) { // crackling zap that jumps
      for (let k = 0; k < 3; k++) {
        const s = t + k * 0.07;
        osc('sawtooth', 1800 - k * 300, 220, s, 0.09, 0.22, o);
        burst(s, 0.08, 0.45, 'highpass', 1500, 0, o, 0.7);
      }
      const b = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      b.type = 'sawtooth'; b.frequency.value = 110; lfo.frequency.value = 55; lg.gain.value = 80;
      lfo.connect(lg).connect(b.frequency); env(g, t, 0.18, 0.005, 0.3);
      b.connect(g).connect(o); b.start(t); lfo.start(t); b.stop(t + 0.35); lfo.stop(t + 0.35);
      return 0.4;
    },
    spike: function (t, o) { // spikes punch up: crunch
      for (let k = 0; k < 3; k++) burst(t + k * 0.03, 0.06, 0.45, 'bandpass', 1400 + k * 500, 0, o, 3);
      osc('square', 160, 70, t, 0.1, 0.18, o);
      return 0.2;
    },
    golem: function (t, o) { // stone slam
      osc('sine', 75, 30, t, 0.45, 1.0, o);
      burst(t, 0.35, 0.6, 'lowpass', 600, 80, o, 0.9);
      burst(t + 0.02, 0.12, 0.3, 'bandpass', 900, 300, o, 2);
      return 0.5;
    },
    frost: function (t, o) { // icy shimmer as the ring pulses
      [1318, 1760, 2093, 2637].forEach(function (f, i) { osc('sine', f, f * 0.98, t + i * 0.04, 0.9, 0.09, o, 0.02); });
      burst(t, 0.6, 0.08, 'highpass', 6000, 0, o, 0.5, 0.15);
      return 1.0;
    },
    build: function (t, o) { // place a defender: thunk and a chime
      osc('sine', 180, 70, t, 0.18, 0.7, o);
      burst(t, 0.08, 0.35, 'lowpass', 1200, 200, o);
      osc('triangle', 784, 0, t + 0.1, 0.25, 0.2, o);
      osc('triangle', 1175, 0, t + 0.16, 0.35, 0.18, o);
      return 0.5;
    },
    upgrade: function (t, o) { // power up
      [523, 659, 784, 1047].forEach(function (f, i) { osc('square', f, 0, t + i * 0.06, 0.12, 0.12, o); });
      osc('triangle', 1568, 0, t + 0.26, 0.4, 0.2, o);
      return 0.7;
    },
    // Creatures
    thornDie: function (t, o) { // heavy creature breaks apart
      osc('square', 260, 60, t, 0.25, 0.3, o);
      burst(t, 0.3, 0.5, 'lowpass', 2000, 150, o);
      osc('sine', 880, 1760, t + 0.12, 0.15, 0.12, o);
      return 0.45;
    },
    wispDie: function (t, o) { // a wisp pops into sparkles
      osc('sine', 900, 2400, t, 0.12, 0.3, o);
      osc('triangle', 1800, 0, t + 0.06, 0.2, 0.12, o);
      return 0.3;
    },
    brambleDie: function (t, o) { // tiny pop
      osc('square', 500, 1200, t, 0.05, 0.18, o);
      burst(t, 0.04, 0.2, 'highpass', 3000, 0, o);
      return 0.1;
    },
    shieldBreak: function (t, o) { // glass shatter
      for (let i = 0; i < 9; i++) osc('sine', 1800 + Math.random() * 3200, 0, t + Math.random() * 0.08, 0.25 + Math.random() * 0.3, 0.08, o);
      burst(t, 0.4, 0.5, 'highpass', 3500, 0, o, 0.6);
      osc('sine', 120, 50, t, 0.2, 0.4, o);
      return 0.7;
    },
    anchorHit: function (t, o) { // something got through: low warning
      osc('square', 110, 0, t, 0.4, 0.22, o);
      osc('square', 117, 0, t, 0.4, 0.22, o);
      osc('sine', 60, 40, t, 0.4, 0.6, o);
      return 0.5;
    },
    // Big moments
    waveStart: function (t, o) { // war horn
      [146.8, 220, 293.7].forEach(function (f) {
        const s = ctx.createOscillator(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
        s.type = 'sawtooth'; s.frequency.value = f;
        f2.type = 'lowpass'; f2.frequency.setValueAtTime(300, t); f2.frequency.linearRampToValueAtTime(2200, t + 0.5); f2.frequency.linearRampToValueAtTime(700, t + 1.4);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.25); g.gain.setValueAtTime(0.16, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        s.connect(f2).connect(g).connect(o); s.start(t); s.stop(t + 1.6);
      });
      osc('sine', 73, 50, t, 1.0, 0.5, o, 0.2);
      return 1.6;
    },
    waveClear: function (t, o) {
      [587, 740, 880, 1175].forEach(function (f, i) { osc('triangle', f, 0, t + i * 0.09, 0.5, 0.22, o); });
      return 0.9;
    },
    mega: function (t, o) { // Mega Forge: rising charge, then a blast of light
      const s = ctx.createOscillator(), g = ctx.createGain();
      s.type = 'sawtooth'; s.frequency.setValueAtTime(120, t); s.frequency.exponentialRampToValueAtTime(1800, t + 0.7);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      s.connect(g).connect(o); s.start(t); s.stop(t + 0.8);
      osc('sine', 100, 25, t + 0.72, 1.0, 1.0, o);
      burst(t + 0.72, 1.0, 0.9, 'lowpass', 6000, 100, o, 0.5);
      [1047, 1319, 1568, 2093].forEach(function (f) { osc('sine', f, 0, t + 0.75, 1.2, 0.08, o, 0.02); });
      return 2.0;
    },
    win: function (t, o) { // rift closed
      [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.56], [1047, 0.68]].forEach(function (n) { osc('square', n[0], 0, t + n[1], 0.3, 0.13, o); osc('triangle', n[0] / 2, 0, t + n[1], 0.3, 0.2, o); });
      osc('triangle', 1568, 0, t + 0.9, 1.0, 0.2, o);
      return 2.0;
    }
  };


  // ---------- Music ----------
  // D minor, 112 beats a minute. Chords: Dm, Bb, F, C (two bars each).
  const BPM = 112, STEP = 60 / BPM / 4; // sixteenth notes
  const N = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  const CHORDS = [[62, 65, 69], [58, 62, 65], [65, 69, 72], [60, 64, 67]]; // Dm Bb F C
  const ROOTS = [38, 34, 41, 36];
  // Lead line (one note per 8th, 0 = rest), 4 bars per chord pair.
  const LEAD = [74, 0, 72, 74, 77, 0, 76, 74, 74, 0, 0, 0, 72, 70, 69, 0,
                70, 0, 69, 70, 74, 0, 72, 70, 69, 0, 0, 0, 0, 0, 65, 67,
                69, 0, 72, 0, 77, 0, 76, 72, 72, 0, 0, 0, 74, 72, 69, 0,
                67, 0, 69, 72, 76, 0, 74, 72, 72, 0, 0, 0, 0, 0, 0, 0];
  let music = null;
  let target = 0; // 0 calm, 1 attack
  function startMusic() {
    ac();
    if (music) return;
    const layers = {};
    ['pad', 'arp', 'bass', 'drums', 'lead'].forEach(function (k) { layers[k] = ctx.createGain(); layers[k].connect(musicBus); });
    layers.pad.gain.value = 0.55; layers.arp.gain.value = 0.35;
    layers.bass.gain.value = 0; layers.drums.gain.value = 0; layers.lead.gain.value = 0;
    // A little echo on the arp and lead.
    const dl = ctx.createDelay(1); dl.delayTime.value = STEP * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    dl.connect(fb).connect(dl); dl.connect(wet).connect(musicBus);
    music = { layers: layers, step: 0, next: ctx.currentTime + 0.08, delay: dl, timer: null, level: 0 };
    music.timer = setInterval(schedule, 25);
    setMood(target, true);
  }
  function stopMusic() {
    if (!music) return;
    clearInterval(music.timer);
    const m = music; music = null;
    Object.keys(m.layers).forEach(function (k) { const g = m.layers[k].gain; g.cancelScheduledValues(ctx.currentTime); g.setTargetAtTime(0, ctx.currentTime, 0.2); });
    setTimeout(function () { Object.keys(m.layers).forEach(function (k) { m.layers[k].disconnect(); }); }, 1500);
  }
  function setMood(v, now) {
    target = v;
    if (!music) return;
    const L = music.layers, t = ctx.currentTime, k = now ? 0.05 : 1.2;
    L.bass.gain.setTargetAtTime(v ? 0.55 : 0, t, k);
    L.drums.gain.setTargetAtTime(v ? 0.8 : 0, t, k * 0.6);
    L.lead.gain.setTargetAtTime(v ? 0.28 : 0, t, k);
    L.arp.gain.setTargetAtTime(v ? 0.25 : 0.35, t, k);
    L.pad.gain.setTargetAtTime(v ? 0.4 : 0.55, t, k);
  }
  function note(type, freq, t, dur, peak, out, cutoff, a) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    let node = o;
    if (cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + (a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function schedule() {
    while (music && music.next < ctx.currentTime + 0.12) { playStep(music.step, music.next); music.next += STEP; music.step++; }
  }
  function playStep(s, t) {
    const L = music.layers;
    const bar = Math.floor(s / 16), chord = Math.floor(bar / 2) % 4, in16 = s % 16;
    const ch = CHORDS[chord];
    // Pad: a long detuned chord at the start of each two bars.
    if (s % 32 === 0) ch.forEach(function (m) { [-6, 6].forEach(function (dt) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = N(m - 12); o.detune.value = dt;
      f.type = 'lowpass'; f.frequency.value = 900;
      const len = STEP * 32;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.6); g.gain.setValueAtTime(0.05, t + len - 0.5); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.2);
      o.connect(f).connect(g).connect(L.pad); o.start(t); o.stop(t + len + 0.3);
    }); });
    // Arp: chord tones up and down, every 16th.
    const arpNotes = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1]];
    const an = arpNotes[s % arpNotes.length] + 12;
    const og = ctx.createGain(); og.gain.value = 1; og.connect(L.arp); og.connect(music.delay);
    note('triangle', N(an), t, STEP * 1.6, 0.12, og);
    // Bass: driving 8th notes on the root, octave jump on the off beats.
    if (s % 2 === 0) note('sawtooth', N(ROOTS[chord] + (in16 % 8 === 6 ? 12 : 0)), t, STEP * 1.8, 0.22, L.bass, 600);
    // Drums: kick on 1 and 3 (plus a push), snare on 2 and 4, hats on 8ths.
    if (in16 === 0 || in16 === 8 || in16 === 10) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g).connect(L.drums); o.start(t); o.stop(t + 0.32); }
    if (in16 === 4 || in16 === 12) { burstTo(L.drums, t, 0.18, 0.5, 'bandpass', 1800); note('triangle', 190, t, 0.1, 0.25, L.drums); }
    if (in16 % 2 === 0) burstTo(L.drums, t, in16 % 4 === 2 ? 0.07 : 0.04, 0.16, 'highpass', 7000);
    if (bar % 8 === 7 && in16 >= 12) burstTo(L.drums, t, 0.1, 0.35, 'bandpass', 1200 + in16 * 80);
    // Lead: one note per 8th from the line above.
    if (s % 2 === 0) {
      const ln = LEAD[(s / 2) % LEAD.length];
      if (ln) { const lg = ctx.createGain(); lg.connect(L.lead); lg.connect(music.delay); note('square', N(ln), t, STEP * 3.2, 0.09, lg, 2600, 0.01); }
    }
  }
  function burstTo(out, t, dur, peak, type, f0) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.value = f0;
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + dur + 0.02);
  }


  // ---------- What the game calls ----------
  A.fx = function (name) { fx(name); };
  // Same sound, but at most once every 'gap' seconds per key (for towers that fire fast).
  const lastAt = {};
  A.fxEvery = function (name, key, gap) {
    const now = performance.now() / 1000;
    if (lastAt[key] && now - lastAt[key] < gap) return;
    lastAt[key] = now;
    fx(name);
  };
  // mood: 'calm', 'attack', or null to fade the music out.
  A.music = function (mood) {
    if ((RF.settings.music == null ? 6 : RF.settings.music) <= 0 && mood) { stopMusic(); return; }
    try { ac(); } catch (e) { return; }
    if (!mood) { stopMusic(); return; }
    const was = !!music;
    startMusic();
    setMood(mood === 'attack' ? 1 : 0, !was);
  };
  A.mood = function () { return music ? (target ? 'attack' : 'calm') : null; };
  // Duck while speaking. Called by the read-aloud code in core.js. level: 0 off, 1 a line, 2 a word.
  A.duck = function (level) {
    level = level === true ? 2 : level || 0;
    if (ducked === level) return;
    const on = level > ducked;
    ducked = level;
    if (!ctx) return;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t); fxBus.gain.cancelScheduledValues(t);
    musicBus.gain.setTargetAtTime(musicLevel(), t, on ? 0.05 : 0.25);
    fxBus.gain.setTargetAtTime(fxLevel(), t, on ? 0.05 : 0.25);
  };
  // After the Music or Effects setting changes.
  A.applyVolumes = function () {
    if (!ctx) return;
    musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.05);
    fxBus.gain.setTargetAtTime(fxLevel(), ctx.currentTime, 0.05);
    if ((RF.settings.music == null ? 6 : RF.settings.music) <= 0) stopMusic();
  };
  // The menu beeps in core.js (RF.sfx) play through the effects volume too.
  A.context = function () { try { return ac(); } catch (e) { return null; } };
  A.fxOut = function () { return fxBus; };
})(window.RF);
