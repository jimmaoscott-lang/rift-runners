// Speak mode listener (DESIGN.md section 6, item 2, and section 10).
// Two checkers:
//  1. Azure pronunciation check (the default, M5b). The game records the one word the student
//     reads, sends it to our small Cloudflare Worker (which holds the Azure key), and Azure scores
//     each sound. This can judge pin, pen, ten, win and made-up runes.
//  2. Chrome's built-in recognizer (the fallback). Used when the Worker cannot be reached, Azure is
//     out of free hours or busy, or the answer is slow. Chrome runs alongside every Azure try, so a
//     fallback never makes the student say the word again.
// Nothing is saved: the recording is thrown away after the check, and the game keeps only whether
// the word matched.
window.RF = window.RF || {};
(function (RF) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));
  const MIC = {
    supported: !!Rec || canRecord,
    // 'ok' until something proves the mic cannot work here. 'down' turns speak mode off
    // for this visit and every word shows its tap choices right away.
    state: (Rec || canRecord) ? 'ok' : 'down',
    reason: (Rec || canRecord) ? null : 'mic.unsupported',
    chrome: Rec ? 'ok' : 'down', // Chrome's recognizer
    busy: false
  };
  RF.mic = MIC;

  // ---- Azure checker state ----
  // 'checking' at start, 'ok' when the Worker answers, 'off' when it cannot be used this visit.
  const AZ = { state: 'off', why: 'not started', url: '', cfg: null, failures: 0, until: 0 };
  MIC.az = AZ;
  function cfg() { return (RF.data && RF.data.speech) || {}; }
  function azOK() { return AZ.state === 'ok' && canRecord && performance.now() >= AZ.until; }
  MIC.engine = function () { return azOK() ? 'azure' : 'chrome'; };

  // Start-up check: is the Worker online and is the key good? Runs once when the game loads.
  // ?speech=URL points at another checker (testing). ?chromeonly skips Azure.
  MIC.initAzure = function () {
    const q = new URLSearchParams(location.search);
    const c = cfg();
    AZ.url = (q.get('speech') || c.checkUrl || '').replace(/\/+$/, '');
    if (q.has('chromeonly') || !AZ.url || !canRecord) { AZ.state = 'off'; AZ.why = !canRecord ? 'cannot record' : 'turned off'; return Promise.resolve(false); }
    AZ.state = 'checking'; AZ.why = 'checking';
    const ctl = new AbortController();
    const t = setTimeout(function () { ctl.abort(); }, c.healthTimeoutMs || 3500);
    return fetch(AZ.url + '/health', { signal: ctl.signal, cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        clearTimeout(t);
        AZ.state = r.ok && j.ok ? 'ok' : 'off';
        AZ.why = AZ.state === 'ok' ? 'online' : 'checker error ' + r.status;
        return AZ.state === 'ok';
      });
    }).catch(function (e) {
      clearTimeout(t);
      AZ.state = 'off'; AZ.why = e && e.name === 'AbortError' ? 'no answer' : 'blocked or offline';
      return false;
    });
  };
  // After a failed check: a busy or out-of-hours answer pauses Azure for 2 minutes; anything else
  // (blocked, offline) twice in a row turns it off for this visit.
  function azFailed(kind) {
    AZ.failures++;
    if (kind === 'busy') { AZ.until = performance.now() + 120000; AZ.why = 'busy or out of free hours'; }
    else if (AZ.failures >= 2) { AZ.state = 'off'; AZ.why = kind; }
    else AZ.why = kind;
  }

  MIC.usable = function () { return MIC.state === 'ok' && (azOK() || MIC.chrome === 'ok'); };
  MIC.markDown = function (reasonId) { MIC.state = 'down'; MIC.reason = reasonId; };
  MIC.retry = function () {
    if (Rec) MIC.chrome = 'ok';
    if (MIC.supported) { MIC.state = 'ok'; MIC.reason = null; }
    if (AZ.state === 'off' && AZ.url) { AZ.failures = 0; MIC.initAzure(); }
  };

  // Can the checker that is up right now fairly judge this word?
  // Azure: every real word, and runes when spokenRunes is on in game/data/speech.json.
  // Chrome only: not runes, and not short i or short e before m or n (pin, pen, ten, win), which
  // Chrome hears but will not name (DESIGN.md 6, Speak mode word rule). Any word marked noSpeak
  // stays tap only with either checker.
  function chromeCan(w) { return w.kind !== 'rune' && !/[ie][mn]/.test(w.w); }
  MIC.canCheck = function (w) {
    if (!w || w.noSpeak) return false;
    // Runes can be spoken when spokenRunes is on (Mr. Scott's test, Session 11: all but "pid" worked).
    // A rune Azure reads as an abbreviation (pid as "P-I-D") is marked noSpeak in world1.json.
    if (azOK()) return w.kind !== 'rune' || !!cfg().spokenRunes || !!RF.settings.speakRunes;
    return MIC.chrome === 'ok' && chromeCan(w);
  };

  // ---- Chrome matching ----
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); }
  // Words that count as the target. Gulf Coast speech says short i and short e the same before
  // m or n (pin/pen, him/hem), so both spellings count there (DESIGN.md 6, Speak mode matching).
  // Chrome also writes some words with a different spelling for the same sound (when for win,
  // 10 for ten, son for sun). Those come from each word's "sayAlso" list in game/data/world1.json.
  MIC.accepts = function (target, also) {
    const t = String(target).toLowerCase();
    const out = [t].concat((also || []).map(function (a) { return String(a).toLowerCase(); }));
    for (let i = 0; i < t.length - 1; i++) {
      if ((t[i] === 'i' || t[i] === 'e') && (t[i + 1] === 'm' || t[i + 1] === 'n')) {
        out.push(t.slice(0, i) + (t[i] === 'i' ? 'e' : 'i') + t.slice(i + 1));
      }
    }
    return out;
  };
  MIC.matches = function (target, transcripts, also) {
    const ok = MIC.accepts(target, also);
    return transcripts.some(function (tx) { return norm(tx).some(function (w) { return ok.indexOf(w) >= 0; }); });
  };

  // ---- Azure scoring (reading rules decided by Claude, DESIGN.md 6, Azure scoring) ----
  // The skill being checked is the vowel. Consonants get a lenient check so an accent never
  // fails a correct read. Vowel sounds Azure may report (IPA):
  const VOWELS = ['æ', 'ɪ', 'ɛ', 'ɑ', 'ɔ', 'ʌ', 'ə', 'ʊ', 'i', 'u', 'eɪ', 'aɪ', 'aʊ', 'ɔɪ', 'oʊ', 'ɝ', 'ɚ', 'a', 'e', 'o'];
  // What counts as the short vowel the word asks for. ɪ/i and ʌ/ə are accent, not decoding;
  // ɑ/ɔ is the cot/caught merger. a/o and i/e stay apart (close pairs DESIGN 5 targets).
  const SAME = { 'æ': ['æ'], 'ɪ': ['ɪ', 'i'], 'ɛ': ['ɛ'], 'ɑ': ['ɑ', 'ɔ'], 'ɔ': ['ɔ', 'ɑ'], 'ʌ': ['ʌ', 'ə'] };
  const NASAL = ['m', 'n', 'ŋ'];
  // The short vowel a CVC word asks for, from its spelling. Azure guesses how a made-up rune is
  // said and sometimes guesses wrong (fim as "fime"), so the check uses the spelling (Session 16).
  const SHORT = { a: 'æ', e: 'ɛ', i: 'ɪ', o: 'ɑ', u: 'ʌ' };
  function shortVowel(w) {
    const m = /^[^aeiou]*([aeiou])[^aeiouy]*$/.exec(String(w || '').toLowerCase());
    return m ? SHORT[m[1]] : null;
  }
  MIC.score = function (res, target) {
    const s = cfg().score || {};
    const out = { outcome: 'nothing', note: '' };
    if (!res || res.status !== 'Success' || !res.word) {
      out.note = 'azure ' + (res && res.status);
      if (res && res.heard) out.outcome = 'miss';
      return out;
    }
    const w = res.word, ph = w.phonemes || [];
    if (w.error === 'Omission' || !ph.length) { out.outcome = res.heard ? 'miss' : 'nothing'; out.note = 'azure skipped the word'; return out; }
    const vi = ph.findIndex(function (p) { return VOWELS.indexOf(p.p) >= 0; });
    if (vi < 0) { out.outcome = (w.accuracy || 0) >= (s.wordMin || 45) ? 'match' : 'miss'; out.note = 'no vowel found, word ' + w.accuracy; return out; }
    const v = ph[vi];
    const nasal = ph[vi + 1] && NASAL.indexOf(ph[vi + 1].p) >= 0;
    // Judge against the vowel the spelling asks for. When Azure expected a different vowel
    // (its guess for a made-up word), its vowel score is about the wrong sound, so only
    // "what it sounded most like" counts.
    const want = shortVowel(target) || v.p;
    const offGuess = want !== v.p;
    let ok = (SAME[want] || [want]).slice();
    if (nasal && (want === 'ɪ' || want === 'ɛ')) ok = ok.concat(['ɪ', 'ɛ', 'i']); // pin/pen, Gulf Coast
    const top = v.best && v.best[0] ? v.best[0].p : null;
    const topOK = !!top && ok.indexOf(top) >= 0;
    const topOther = !!top && !topOK && VOWELS.indexOf(top) >= 0;
    const vs = v.score || 0;
    const vowelPass = offGuess ? topOK : (topOK && vs >= 25) || (vs >= (s.vowelMin || 60) && !(topOther && vs < (s.vowelClearMiss || 80)));
    const cons = ph.filter(function (p, k) { return k !== vi; }).map(function (p) { return p.score || 0; });
    const avg = cons.length ? cons.reduce(function (a, b) { return a + b; }, 0) / cons.length : 100;
    const consPass = avg >= (s.consonantAvgMin || 40) && cons.every(function (c) { return c >= (s.consonantEachMin || 15); });
    const wordPass = topOK || (w.accuracy || 0) >= (s.wordMin || 45);
    out.outcome = vowelPass && consPass && wordPass ? 'match' : 'miss';
    // Timing collapse (Session 22, bugs B2 and B5): when the start of a word is clipped, Azure
    // lines the sounds up wrong and scores the first sound and the vowel very low together
    // ("pin" read right: first sound 30, vowel 21; "dig": 29 and 58). A misread rarely looks like
    // that, because the student says the first sound clearly. The forge gives one free redo.
    const first = vi > 0 ? (ph[0].score || 0) : vs;
    if (out.outcome === 'miss' && first < (s.collapseFirstMax || 45) && vs < (s.collapseVowelMax || 60)) {
      out.collapse = true;
    }
    out.note = (out.collapse ? 'timing collapse; ' : '') + (offGuess ? 'azure expected ' + v.p + ', checked as ' + want + '; ' : '') + 'vowel ' + v.p + ' ' + Math.round(vs) + (top ? ' (sounded most like ' + top + ')' : '') +
      ', other sounds ' + cons.map(Math.round).join(' ') + ', word ' + Math.round(w.accuracy || 0);
    return out;
  };

  // ---- Recording ----
  function encodeWav(samples, rate) {
    // Even out the volume so a quiet student is heard, then pack as 16-bit WAV.
    let peak = 0; for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
    const gain = peak > 0.001 ? Math.min(8, 0.9 / peak) : 1;
    const buf = new ArrayBuffer(44 + samples.length * 2), dv = new DataView(buf);
    const str = function (o, t) { for (let i = 0; i < t.length; i++) dv.setUint8(o + i, t.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true);
    dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i] * gain)) * 0x7fff, true);
    return buf;
  }
  // Simple 3:1 downsample when Chrome will not open the mic at 16 kHz (48 kHz input).
  function to16k(chunks, rate) {
    let n = 0; chunks.forEach(function (c) { n += c.length; });
    const all = new Float32Array(n); let o = 0; chunks.forEach(function (c) { all.set(c, o); o += c.length; });
    if (Math.abs(rate - 16000) < 1) return all;
    const ratio = rate / 16000, out = new Float32Array(Math.floor(n / ratio));
    for (let i = 0; i < out.length; i++) {
      const a = Math.floor(i * ratio), b = Math.min(n, Math.floor((i + 1) * ratio));
      let sum = 0; for (let k = a; k < b; k++) sum += all[k];
      out[i] = sum / Math.max(1, b - a);
    }
    return out;
  }

  // ---- Warm mic (Session 22, bug B2) ----
  // Opening the mic takes about half a second, so a student who reads the instant Say it is
  // pressed lost the first sound, and Azure then misjudged the whole word. The mic now opens once
  // and stays open between words. While no one is reading, it keeps only the last few chunks (the
  // pre-roll, about a third of a second) and throws the rest away, so a word that starts right as
  // the button is pressed is kept whole. Nothing is recorded or sent until Say it is pressed.
  // It closes when the level ends, when the tab is hidden, and after warmIdleMs with no reading.
  const WARM = { stream: null, ctx: null, proc: null, rate: 16000, chunkMs: 128, ring: [], quiet: [], sink: null, opening: null, idle: 0 };
  MIC.warmState = function () { return WARM.proc ? 'warm' : WARM.opening ? 'opening' : 'cold'; };
  const PREROLL = 3;
  function warmOpen() {
    if (WARM.proc) { if (WARM.ctx.state === 'suspended') WARM.ctx.resume().catch(function () {}); return Promise.resolve(true); }
    if (WARM.opening) return WARM.opening;
    WARM.opening = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }).then(function (s) {
      WARM.opening = null;
      WARM.stream = s;
      const AC = window.AudioContext || window.webkitAudioContext;
      try { WARM.ctx = new AC({ sampleRate: 16000 }); } catch (e) { WARM.ctx = new AC(); }
      if (WARM.ctx.state === 'suspended') WARM.ctx.resume().catch(function () {});
      WARM.rate = WARM.ctx.sampleRate;
      const src = WARM.ctx.createMediaStreamSource(s);
      const size = WARM.rate > 20000 ? 4096 : 2048; // about 0.1 to 0.13 seconds per chunk
      WARM.chunkMs = size / WARM.rate * 1000;
      WARM.proc = WARM.ctx.createScriptProcessor(size, 1, 1);
      const mute = WARM.ctx.createGain(); mute.gain.value = 0;
      src.connect(WARM.proc); WARM.proc.connect(mute); mute.connect(WARM.ctx.destination);
      WARM.ring = []; WARM.quiet = [];
      WARM.proc.onaudioprocess = function (ev) {
        const d = new Float32Array(ev.inputBuffer.getChannelData(0));
        let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
        const rms = Math.sqrt(sum / d.length);
        if (WARM.sink) return WARM.sink(d, rms);
        WARM.ring.push(d); if (WARM.ring.length > PREROLL) WARM.ring.shift();
        // Room noise between words, for a fair loudness line when the student reads.
        WARM.quiet.push(rms); if (WARM.quiet.length > 24) WARM.quiet.shift();
      };
      s.getTracks().forEach(function (t) { t.onended = function () { MIC.cool(); }; });
      return false;
    }, function (e) { WARM.opening = null; throw e; });
    return WARM.opening;
  }
  function idleCool() {
    clearTimeout(WARM.idle);
    WARM.idle = setTimeout(function () { if (!WARM.sink) MIC.cool(); }, cfg().warmIdleMs || 90000);
  }
  // Open the mic ahead of time, only when the browser already has permission (no surprise prompt)
  // and the Azure check is the one in use. Otherwise it opens on the first Say it press.
  MIC.warm = function () {
    if (cfg().warmMic === false || !azOK() || MIC.state !== 'ok' || WARM.proc || WARM.opening) return;
    if (!navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: 'microphone' }).then(function (p) {
      if (p.state === 'granted' && !WARM.proc && !WARM.opening && document.visibilityState !== 'hidden') warmOpen().then(idleCool).catch(function () {});
    }).catch(function () {});
  };
  MIC.cool = function () {
    clearTimeout(WARM.idle);
    WARM.sink = null;
    if (WARM.proc) { WARM.proc.onaudioprocess = null; try { WARM.proc.disconnect(); } catch (e) { /* ignore */ } }
    if (WARM.stream) WARM.stream.getTracks().forEach(function (t) { t.onended = null; t.stop(); });
    if (WARM.ctx) WARM.ctx.close().catch(function () {});
    WARM.stream = WARM.ctx = WARM.proc = null; WARM.ring = []; WARM.quiet = [];
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && !WARM.sink) MIC.cool(); });

  let current = null; // the listen in progress: { stop() }
  MIC.stop = function () {
    const c = current; current = null; MIC.busy = false;
    if (c) c.stop();
  };

  // ---- Chrome listener (alone, or as the backup beside Azure) ----
  // onDone({ heard: [...], error, seen }) is called once when it ends.
  function chromeListen(target, also, opts, onMatch, onDone) {
    const rec = new Rec();
    rec.lang = 'en-US';
    // Same setup as the microphone test, which catches short single words: keep listening
    // through short pauses and report partial guesses as they come.
    rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 5;
    const st = { heard: [], error: null, seen: { audio: false, sound: false, speech: false }, ended: false };
    let settle = 0;
    const end = function () { if (st.ended) return; st.ended = true; clearTimeout(settle); try { rec.abort(); } catch (e) { /* ignore */ } onDone(st); };
    rec.onaudiostart = function () { st.seen.audio = true; if (opts.onAudio) { const f = opts.onAudio; opts.onAudio = null; f(); } };
    rec.onsoundstart = function () { st.seen.sound = true; };
    rec.onspeechstart = function () { st.seen.speech = true; };
    rec.onresult = function (ev) {
      let final = false;
      for (let i = ev.resultIndex || 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) final = true;
        for (let k = 0; k < r.length; k++) { const t = (r[k].transcript || '').trim(); if (t && st.heard.indexOf(t) < 0) st.heard.push(t); }
      }
      if (onMatch && MIC.matches(target, st.heard, also)) { onMatch(st); return; }
      // A finished guess that is not the word: wait a moment in case a better guess follows.
      if (final && onMatch) { clearTimeout(settle); settle = setTimeout(end, 900); }
    };
    rec.onerror = function (ev) { st.error = ev.error; };
    rec.onend = end;
    const timer = setTimeout(function () { try { rec.stop(); } catch (e) { /* ignore */ } }, opts.maxMs || 6000);
    try { rec.start(); } catch (e) { st.error = 'start-failed'; clearTimeout(timer); setTimeout(end, 0); }
    return {
      st: st,
      stop: function () { try { rec.stop(); } catch (e) { /* ignore */ } },
      abort: function () { clearTimeout(timer); rec.onresult = rec.onerror = rec.onend = null; st.ended = true; try { rec.abort(); } catch (e) { /* ignore */ } }
    };
  }
  function yn(v) { return v ? 'yes' : 'no'; }
  function chromeDiag(st) { return 'chrome: mic ' + yn(st.seen.audio) + ', sound ' + yn(st.seen.sound) + ', speech ' + yn(st.seen.speech) + (st.error ? ', ' + st.error : ''); }
  function chromeDown(err) {
    if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') return 'mic.blocked';
    if (err === 'network') return 'mic.offline';
    return null;
  }

  // Listen for one word. cb({ matched, heard, outcome, engine, diag }) where outcome is
  // 'match', 'miss' (heard something else), 'nothing' (heard no word), 'again' (the checker
  // stumbled; say it again, not a try), 'switch' (the checker went down and the one left cannot
  // judge this word; not a try) or 'down' (the mic cannot work).
  // word: { w, kind, sayAlso }
  MIC.listen = function (word, cb, opts) {
    opts = opts || {};
    if (typeof word === 'string') word = { w: word, kind: 'real' };
    if (!MIC.usable() || !MIC.canCheck(word)) { cb({ matched: false, heard: '', outcome: MIC.usable() ? 'switch' : 'down' }); return; }
    MIC.stop();
    MIC.busy = true;
    if (azOK()) listenAzure(word, cb, opts); else listenChrome(word, cb, opts);
  };

  function listenChrome(word, cb, opts) {
    let done = false;
    const finish = function (res) {
      if (done) return; done = true;
      if (current === me) current = null;
      MIC.busy = false;
      ch.abort();
      res.engine = 'chrome';
      cb(res);
    };
    const me = { stop: function () { done = true; ch.abort(); } };
    current = me;
    // Show Listening when Chrome's mic is really open (or after a second if that event never comes).
    let started = false;
    const go = function () { if (started || done) return; started = true; if (opts.onStart) opts.onStart(false); };
    const ch = chromeListen(word.w, word.sayAlso, { maxMs: opts.maxMs, onAudio: go },
      function (st) { finish({ matched: true, heard: st.heard[0] || '', outcome: 'match', diag: chromeDiag(st) }); },
      function (st) {
        const down = chromeDown(st.error);
        if (down) {
          MIC.chrome = 'down';
          if (!azOK()) MIC.markDown(down);
          return finish({ matched: false, heard: '', outcome: azOK() ? 'switch' : 'down', diag: chromeDiag(st) });
        }
        if (MIC.matches(word.w, st.heard, word.sayAlso)) return finish({ matched: true, heard: st.heard[0], outcome: 'match', diag: chromeDiag(st) });
        finish({ matched: false, heard: st.heard[0] || '', outcome: st.heard.length ? 'miss' : 'nothing', diag: chromeDiag(st) });
      });
    setTimeout(go, 1000);
  }

  function listenAzure(word, cb, opts) {
    const c = cfg();
    let done = false, ch = null, ctl = null, maxTimer = 0, listening = false;
    let chunks = [];
    const stopAudio = function () {
      clearTimeout(maxTimer);
      if (listening) { listening = false; WARM.sink = null; WARM.ring = []; idleCool(); }
    };
    const finish = function (res) {
      if (done) return; done = true;
      if (current === me) current = null;
      MIC.busy = false;
      stopAudio();
      if (ch) ch.abort();
      res.engine = res.engine || 'azure';
      cb(res);
    };
    const me = { stop: function () { done = true; stopAudio(); if (ch) ch.abort(); if (ctl) ctl.abort(); } };
    current = me;

    // Chrome listens alongside as the backup (never in charge while Azure answers).
    const chromeBackup = Rec && MIC.chrome === 'ok' && chromeCan(word);
    if (chromeBackup) ch = chromeListen(word.w, word.sayAlso, { maxMs: (c.maxListenMs || 5000) + 1500 }, null, function () {});

    // Azure failed or was slow: use what Chrome heard, so the student does not repeat the word.
    const fallBack = function (why) {
      azFailed(why);
      // No backup for this word: not the student's fault, so it is not counted as a try.
      if (!ch) return finish({ matched: false, heard: '', outcome: azOK() ? 'again' : 'switch', engine: 'azure', diag: 'azure ' + why + ', no backup for this word' });
      const decide = function () {
        const st = ch.st;
        const res = { heard: st.heard[0] || '', engine: 'chrome', diag: 'azure ' + why + '; ' + chromeDiag(st) };
        if (chromeDown(st.error)) { MIC.chrome = 'down'; res.outcome = 'switch'; }
        else if (MIC.matches(word.w, st.heard, word.sayAlso)) res.outcome = 'match';
        else res.outcome = st.heard.length ? 'miss' : 'nothing';
        res.matched = res.outcome === 'match';
        finish(res);
      };
      if (ch.st.ended || MIC.matches(word.w, ch.st.heard, word.sayAlso)) return decide();
      ch.stop();
      const t = setTimeout(decide, 1500);
      const prev = ch.st;
      (function wait() { if (done) return; if (prev.ended) { clearTimeout(t); decide(); } else setTimeout(wait, 100); })();
    };

    let startNote = '';
    const send = function (samples) {
      const wav = encodeWav(samples, 16000);
      ctl = new AbortController();
      const t = setTimeout(function () { ctl.abort(); }, c.checkTimeoutMs || 4000);
      fetch(AZ.url + '/check?ref=' + encodeURIComponent(word.w), { method: 'POST', body: wav, headers: { 'Content-Type': 'audio/wav' }, signal: ctl.signal, cache: 'no-store' })
        .then(function (r) {
          clearTimeout(t);
          if (r.status === 429) return fallBack('busy');
          if (!r.ok) return fallBack('checker error ' + r.status);
          return r.json().then(function (j) {
            if (done) return;
            if (!j.ok) return fallBack('checker error');
            AZ.failures = 0;
            const sc = MIC.score(j, word.w);
            // Azure scores sounds against the target word and never writes down what was said, so
            // the "heard" line in Test mode shows Chrome's guess instead (bug B5 readout).
            const heard = ch && ch.st.heard[0] ? ch.st.heard[0] : '';
            finish({ matched: sc.outcome === 'match', heard: heard, outcome: sc.outcome, collapse: !!sc.collapse, engine: 'azure',
              diag: 'azure: ' + sc.note + '; ' + startNote + (heard ? '' : '; azure does not write down words') });
          });
        })
        .catch(function (e) { clearTimeout(t); if (!done) fallBack(e && e.name === 'AbortError' ? 'slow answer' : 'blocked or offline'); });
    };

    // Open the mic (or use the one already open) with Chrome's audio cleanup off (DESIGN.md 10).
    warmOpen().then(function (wasWarm) {
      if (done) { idleCool(); return; }
      const rate = WARM.rate, chunkMs = WARM.chunkMs;
      // The pre-roll: the moment just before the press. Only used when the voice runs into it.
      const pre = wasWarm ? WARM.ring.splice(0) : [];
      chunks = pre.slice();
      const preN = pre.length;
      const quietNeeded = Math.ceil((c.endSilenceMs || 700) / chunkMs);
      // Room noise: the quiet between words when the mic was warm, else the first few chunks.
      const q = wasWarm ? WARM.quiet.slice().sort(function (x, y) { return x - y; }) : [];
      let floor = q.length >= 3 ? q[Math.floor(q.length * 0.25)] : 0;
      let seenChunks = q.length >= 3 ? 3 : 0;
      let speechAt = -1, lastLoud = -1, peak = 0;
      startNote = (wasWarm ? 'warm mic, pre-roll ' + Math.round(preN * chunkMs) + ' ms' : 'cold mic start');
      const wrap = function () {
        // Keep from a moment before the voice started (reaching into the pre-roll) to a moment after it stopped.
        const a = Math.max(0, speechAt - 3), b = Math.min(chunks.length, lastLoud + 3);
        if (speechAt === preN && !wasWarm) startNote += ', voice at first chunk (start may be clipped)';
        stopAudio();
        send(to16k(chunks.slice(a, b), rate));
      };
      listening = true;
      WARM.sink = function (d, rms) {
        if (done) return;
        chunks.push(d);
        peak = Math.max(peak, rms);
        // A student who starts talking right away must not raise the noise line, so it is the
        // quietest of the first few chunks, capped so a loud room still works.
        seenChunks++;
        if (seenChunks <= 3) floor = seenChunks === 1 ? rms : Math.min(floor, rms);
        const thr = Math.max(0.012, Math.min(floor, 0.05) * 2.5);
        const i = chunks.length - 1;
        if (rms > thr) { if (speechAt < 0) speechAt = i; lastLoud = i; }
        else if (speechAt >= 0 && i - lastLoud >= quietNeeded) wrap();
      };
      maxTimer = setTimeout(function () {
        if (done || !listening) return;
        if (speechAt < 0) {
          // Heard no voice at all. Count it as "nothing", unless Chrome caught the word.
          stopAudio();
          if (ch && MIC.matches(word.w, ch.st.heard, word.sayAlso)) return finish({ matched: true, heard: ch.st.heard[0], outcome: 'match', engine: 'chrome', diag: 'azure heard no voice (level ' + Math.round(peak * 1000) + '); chrome caught it' });
          return finish({ matched: false, heard: '', outcome: 'nothing', diag: 'azure: no voice heard, level ' + Math.round(peak * 1000) + '; ' + startNote });
        }
        wrap();
      }, c.maxListenMs || 5000);
      // The mic is really recording now: the forge shows the Listening signal.
      if (opts.onStart) opts.onStart(wasWarm);
    }).catch(function (e) {
      if (done) return;
      const name = e && e.name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'NotFoundError') {
        MIC.markDown('mic.blocked');
        return finish({ matched: false, heard: '', outcome: 'down', diag: 'mic ' + name });
      }
      AZ.state = 'off'; AZ.why = 'could not record';
      finish({ matched: false, heard: '', outcome: MIC.chrome === 'ok' && chromeCan(word) ? 'again' : 'switch', diag: 'mic ' + name });
    });
  }

  // ---- Read aloud: story cards and the Rift Seal (World 8, Session 14, DESIGN.md 7) ----
  // The student reads a passage out loud, one sentence at a time, with one mic stream for the whole
  // passage. Chrome's recognizer follows along to light up words and to tell when a sentence is done.
  // Each sentence's recording goes to the Azure checker, which marks every word right or missed.
  // If Azure cannot be used, Chrome's words are the score. Nothing is saved but right or missed.
  //
  // Scoring rules (decided by Claude, standard oral reading fluency practice):
  //  - A word is right when Azure says it was read (None), or read with an accent (Mispronunciation
  //    with a word score at or above passage.wordMin, 50 since Session 15). Repeats and extra words
  //    never count against the student. A word Azure calls skipped is a miss (Chrome rescue is off).
  //  - Reading time runs from the first voice to the last voice, pauses included (the usual way WCPM
  //    is timed). Words correct per minute = right words / minutes.
  MIC.canReadAloud = function () { return MIC.state === 'ok' && (azOK() || MIC.chrome === 'ok'); };

  function refTokens(sentence) {
    return sentence.split(/\s+/).map(function (t) { return t.toLowerCase().replace(/[^a-z0-9']/g, '').replace(/^'+|'+$/g, ''); }).filter(Boolean);
  }
  MIC.refTokens = refTokens;
  // Spoken-form matches Chrome might write for a word.
  const NUM = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', first: '1st', last: 'last' };
  function sameWord(ref, heard) {
    if (ref === heard) return true;
    if (NUM[ref] === heard) return true;
    if (ref.replace(/'/g, '') === heard.replace(/'/g, '')) return true;
    // Plural or tense endings swallowed by an accent (worlds/world, poured/pour) still count:
    // the story is past the decoding stage, and dropping a final s or d is a common EB pattern.
    if (ref.length > 3 && (ref === heard + 's' || ref === heard + 'es' || ref === heard + 'd' || ref === heard + 'ed')) return true;
    return false;
  }
  // Greedy follow-along: walk the heard words in order and match each to the next reference word
  // within a few words ahead (skipped words stay unmatched). Returns { hit: [bool], at: next index }.
  function follow(ref, heard, start) {
    const hit = ref.map(function () { return false; });
    let p = start || 0, hEnd = 0;
    heard.forEach(function (h, hi) {
      for (let k = p; k < Math.min(ref.length, p + 4); k++) {
        if (sameWord(ref[k], h)) { hit[k] = true; p = k + 1; hEnd = hi + 1; return; }
      }
    });
    return { hit: hit, at: p, hEnd: hEnd };
  }
  MIC.follow = follow;

  // Vowel check for passages (Session 15, Claude's reading call after Mr. Scott's test: "if" read
  // with a long i scored 94 as a word). Every vowel sound in the word is checked: it misses when Azure
  // says it sounded most like a different vowel (and its own score is under passage.vowelClearMiss),
  // or when its own score is under passage.vowelMin. Accent and normal speech are allowed: short i
  // and long e (Spanish speakers), unstressed vowels sliding to schwa, the cot/caught merger, Gulf
  // Coast long i as "ah" and pin/pen. Wrong vowels that change the word stay misses (long i for
  // short i, long e for long o).
  const PSAME = {
    'æ': ['æ', 'a'], 'ɪ': ['ɪ', 'i', 'ə'], 'ɛ': ['ɛ', 'e', 'eɪ'], 'ɑ': ['ɑ', 'ɔ', 'a'], 'ɔ': ['ɔ', 'ɑ', 'o', 'oʊ'],
    'ʌ': ['ʌ', 'ə', 'ɑ'], 'ə': ['ə', 'ʌ', 'ɪ', 'i', 'ʊ', 'ɚ', 'ɛ', 'ɑ'], 'ʊ': ['ʊ', 'u', 'ə'], 'i': ['i', 'ɪ'],
    'u': ['u', 'ʊ'], 'eɪ': ['eɪ', 'e', 'ɛ'], 'aɪ': ['aɪ', 'a', 'ɑ'], 'aʊ': ['aʊ', 'a', 'æ'], 'ɔɪ': ['ɔɪ', 'ɔ', 'o'],
    'oʊ': ['oʊ', 'o', 'ɔ'], 'ɝ': ['ɝ', 'ɚ', 'ə'], 'ɚ': ['ɚ', 'ɝ', 'ə']
  };
  function vowelMiss(aw) {
    const pc = cfg().passage || {};
    const ph = aw.phonemes || [];
    for (let k = 0; k < ph.length; k++) {
      const v = ph[k];
      if (VOWELS.indexOf(v.p) < 0) continue;
      let ok = (PSAME[v.p] || [v.p]).slice();
      if ((v.p === 'ɪ' || v.p === 'ɛ') && ph[k + 1] && NASAL.indexOf(ph[k + 1].p) >= 0) ok = ok.concat(['ɪ', 'ɛ', 'i']);
      const top = v.best && v.best[0] ? v.best[0].p : null;
      const vs = v.score || 0;
      const other = !!top && ok.indexOf(top) < 0 && VOWELS.indexOf(top) >= 0;
      if (other && vs < (pc.vowelClearMiss != null ? pc.vowelClearMiss : 80)) return v.p + '>' + top;
      if (vs < (pc.vowelMin != null ? pc.vowelMin : 35) && !(top && ok.indexOf(top) >= 0)) return v.p + ' ' + Math.round(vs);
    }
    return '';
  }
  function wordOK(aw) {
    const pc = cfg().passage || {};
    if (!aw) return false;
    let ok = false;
    if (aw.error === 'None') ok = true;
    else if (aw.error === 'Mispronunciation') ok = (aw.accuracy || 0) >= (pc.wordMin != null ? pc.wordMin : 50);
    if (ok && pc.vowelCheck !== false && vowelMiss(aw)) ok = false;
    return ok;
  }
  MIC.passageMark = function (aw) { return mark(aw); }; // for tests
  function mark(aw) {
    return { ok: wordOK(aw), skipped: aw.error === 'Omission', acc: aw.accuracy, err: aw.error, vmiss: aw.phonemes ? vowelMiss(aw) : '' };
  }
  // Line Azure's word list up with the sentence's reference words.
  function azureMarks(ref, words) {
    const ws = (words || []).map(function (w) { return { t: String(w.w || '').toLowerCase().replace(/[^a-z0-9']/g, ''), w: w }; });
    if (ws.length === ref.length) return ref.map(function (r, i) { return mark(ws[i].w); });
    const out = ref.map(function () { return { ok: false, skipped: true }; });
    let p = 0;
    ref.forEach(function (r, i) {
      for (let k = p; k < Math.min(ws.length, p + 3); k++) {
        if (ws[k].t === r) { out[i] = mark(ws[k].w); p = k + 1; return; }
      }
    });
    return out;
  }

  // sentences: array of strings. opts:
  //   onWord(si, wi)      Chrome heard reference word wi of sentence si (light it up)
  //   onSentence(si)      reading moved to sentence si
  //   onListening()       the mic is open
  //   onDone(result)      { ok, engine, sentences: [[{ w, ok }]], correct, total, ms, wcpm, diag }
  //                       ok false means the mic could not be used (result.why)
  // Returns { next(), stop() }: next() ends the current sentence (the student's Next button).
  MIC.readPassage = function (sentences, opts) {
    MIC.stop();
    MIC.cool(); // the passage reader opens its own mic stream
    const c = cfg(), pc = c.passage || {};
    const refs = sentences.map(refTokens);
    const useAz = azOK();
    const useChrome = !!Rec && MIC.chrome === 'ok';
    if (!useAz && !useChrome) { setTimeout(function () { opts.onDone({ ok: false, why: 'down' }); }, 0); return { next: function () {}, stop: function () {} }; }
    MIC.busy = true;
    let done = false, stream = null, ctx = null, proc = null, rate = 16000, chunkMs = 128;
    const chunks = [];
    let si = 0, segStart = 0, segVoice = -1, segLastLoud = -1, firstVoice = -1, lastVoice = -1, quietAt = 0;
    let floor = 0, seen = 0, segChunks = 0;
    const pending = [];            // Azure checks in flight
    const azRes = refs.map(function () { return null; });   // per sentence: marks from Azure, or null
    const azParts = refs.map(function () { return []; });   // per sentence: one marks list per clip
    let azWhy = '';
    // Chrome follow-along runs over the whole passage at once, so words Chrome reports late (after
    // the line has moved on) still land on the right sentence. Each heard word remembers which line
    // was lit when it arrived; it can match that line or the one before it, never further back.
    const starts = []; let flatN = 0;
    refs.forEach(function (r) { starts.push(flatN); flatN += r.length; });
    const flatRef = [].concat.apply([], refs);
    const finals = [];   // { t, s }
    let interim = [];    // { t, s }
    const flatHit = flatRef.map(function () { return false; });
    let rec = null, recWanted = useChrome, chromeErr = null;
    function where(k) { let s2 = 0; while (s2 + 1 < starts.length && starts[s2 + 1] <= k) s2++; return [s2, k - starts[s2]]; }
    function recountChrome() {
      let p = 0;
      finals.concat(interim).forEach(function (h) {
        const floor = starts[Math.max(0, h.s - 1)];
        if (p < floor) p = floor;
        for (let k = p; k < Math.min(flatN, p + 4); k++) {
          if (sameWord(flatRef[k], h.t)) {
            if (!flatHit[k]) { flatHit[k] = true; const w = where(k); if (opts.onWord) opts.onWord(w[0], w[1]); }
            p = k + 1; return;
          }
        }
      });
    }
    function chromeAt() {
      // Furthest word Chrome has matched in the lit sentence, plus one.
      let at = 0;
      for (let k = starts[si]; k < starts[si] + refs[si].length; k++) if (flatHit[k]) at = k - starts[si] + 1;
      return at;
    }
    function hitAt(s2, wi) { return flatHit[starts[s2] + wi]; }
    function startChrome() {
      if (!recWanted || done) return;
      try {
        rec = new Rec();
        rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
        rec.onresult = function (ev) {
          interim = [];
          for (let i = ev.resultIndex || 0; i < ev.results.length; i++) {
            const r = ev.results[i];
            const toks = norm(r[0] && r[0].transcript).map(function (t) { return { t: t, s: Math.min(si, refs.length - 1) }; });
            if (r.isFinal) Array.prototype.push.apply(finals, toks); else interim = interim.concat(toks);
          }
          recountChrome();
        };
        rec.onerror = function (ev) { chromeErr = ev.error; if (chromeDown(ev.error)) { recWanted = false; MIC.chrome = 'down'; } };
        rec.onend = function () { rec = null; if (interim.length) { Array.prototype.push.apply(finals, interim); interim = []; } if (!done && recWanted) setTimeout(startChrome, 50); };
        rec.start();
      } catch (e) { rec = null; }
    }
    function stopChrome() { recWanted = false; if (rec) { rec.onend = null; try { rec.abort(); } catch (e) { /* ignore */ } rec = null; } }

    function stopAudio() {
      if (proc) { proc.onaudioprocess = null; try { proc.disconnect(); } catch (e) { /* ignore */ } }
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ctx) ctx.close().catch(function () {});
      stream = ctx = proc = null;
    }

    function sendClip(sIdx, a, b) {
      if (!useAz || AZ.state !== 'ok') return;
      if (b - a < 2) return;
      const samples = to16k(chunks.slice(a, b), rate);
      const wav = encodeWav(samples, 16000);
      const ctl = new AbortController();
      const t = setTimeout(function () { ctl.abort(); }, pc.checkTimeoutMs || 9000);
      const pr = fetch(AZ.url + '/passage?ref=' + encodeURIComponent(sentences[sIdx].replace(/\s+/g, ' ').replace(/[^A-Za-z0-9 '.,!?;:"\-]/g, '').trim()), { method: 'POST', body: wav, headers: { 'Content-Type': 'audio/wav' }, signal: ctl.signal, cache: 'no-store' })
        .then(function (r) {
          clearTimeout(t);
          if (r.status === 429) { azFailed('busy'); azWhy = 'busy'; return; }
          // 404: the checker online is older than this game (no passage check yet). Chrome scores it,
          // and word checks stay on Azure.
          if (r.status === 404) { azWhy = 'no passage check on the server yet'; return; }
          if (!r.ok) { azFailed('checker error ' + r.status); azWhy = 'error ' + r.status; return; }
          return r.json().then(function (j) {
            if (!j.ok) { azWhy = 'checker error'; return; }
            AZ.failures = 0;
            azParts[sIdx].push(azureMarks(refs[sIdx], j.words));
          });
        })
        .catch(function (e) { clearTimeout(t); azWhy = e && e.name === 'AbortError' ? 'slow answer' : 'blocked or offline'; azFailed(azWhy); });
      pending.push(pr);
    }

    // End the current sentence: send its recording and move on (or finish after the last one).
    function endSentence() {
      if (done) return;
      const endChunk = chunks.length;
      const a = segVoice >= 0 ? Math.max(segStart, segVoice - 3) : segStart;
      if (segVoice >= 0) sendClip(si, a, Math.min(endChunk, segLastLoud + 4));
      si++;
      segStart = endChunk; segVoice = -1; segLastLoud = -1; segChunks = 0;
      if (si >= refs.length) return finish();
      if (opts.onSentence) opts.onSentence(si);
    }

    function finish() {
      if (done) return; done = true;
      if (current === me) current = null;
      stopAudio();
      if (opts.onChecking) opts.onChecking();
      // Chrome reports words a moment after they are said: give it a short grace before closing.
      const grace = new Promise(function (res) { setTimeout(function () { if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } } setTimeout(function () { stopChrome(); if (interim.length) { Array.prototype.push.apply(finals, interim); interim = []; } recountChrome(); res(); }, 700); }, useChrome ? 600 : 0); });
      pending.push(grace);
      const settle = Promise.all(pending.map(function (p) { return p.catch(function () {}); }));
      const cap = new Promise(function (res) { setTimeout(res, (pc.checkTimeoutMs || 9000) + 500); });
      Promise.race([settle, cap]).then(function () {
        MIC.busy = false;
        let correct = 0, total = 0, usedAz = 0;
        const low = []; // Test mode: Azure word scores under 75, to tune passage.wordMin
        const out = refs.map(function (ref, s) {
          const parts = azParts[s];
          return ref.map(function (w, wi) {
            total++;
            let ok, acc = -1, err = '', vm = '';
            if (parts.length) {
              usedAz++;
              // A long sentence may come in more than one clip: a word read right in any clip counts.
              ok = parts.some(function (m) { return m[wi] && m[wi].ok; });
              const skipped = parts.every(function (m) { return !m[wi] || m[wi].skipped; });
              // Off by default since Session 15: Chrome guesses words from the sentence around them,
              // so it "heard" mangled words and gave them back as right. Turn on with passage.chromeRescue.
              if (!ok && skipped && pc.chromeRescue && hitAt(s, wi)) ok = true;
              // Test mode shows each word's Azure score on the word (best clip if there were two).
              parts.forEach(function (x) { if (x[wi] && x[wi].acc != null && x[wi].acc > acc) { acc = x[wi].acc; err = x[wi].err || ''; vm = x[wi].vmiss || ''; } });
              if (acc < 0 && skipped) err = 'Omission';
              if (acc >= 0 && (acc < 75 || vm)) low.push(w + ' ' + Math.round(acc) + (vm ? ' (' + vm + ')' : ''));
            } else ok = hitAt(s, wi);
            if (ok) correct++;
            return { w: w, ok: !!ok, acc: acc >= 0 ? Math.round(acc) : null, err: err, vmiss: ok ? '' : vm, by: parts.length ? 'azure' : 'chrome' };
          });
        });
        const ms = firstVoice >= 0 ? Math.max(1000, (lastVoice - firstVoice + 1) * chunkMs) : 0;
        const engine = usedAz === total ? 'azure' : usedAz ? 'azure+chrome' : 'chrome';
        opts.onDone({
          ok: true, engine: engine, sentences: out, correct: correct, total: total, ms: Math.round(ms),
          wcpm: ms ? Math.round(correct / (ms / 60000)) : 0,
          diag: engine + (azWhy ? ', azure ' + azWhy : '') + (chromeErr ? ', chrome ' + chromeErr : '') + ', ' + Math.round(ms / 100) / 10 + ' s' + (low.length ? '; low: ' + low.slice(0, 12).join(', ') : '')
        });
      });
    }

    const me = {
      stop: function () { if (done) return; done = true; MIC.busy = false; stopAudio(); stopChrome(); },
      next: function () { endSentence(); }
    };
    current = me;
    if (RF.audio) RF.audio.duck(2);

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }).then(function (s) {
      if (done) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      const AC = window.AudioContext || window.webkitAudioContext;
      try { ctx = new AC({ sampleRate: 16000 }); } catch (e) { ctx = new AC(); }
      rate = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);
      const size = rate > 20000 ? 4096 : 2048;
      chunkMs = size / rate * 1000;
      proc = ctx.createScriptProcessor(size, 1, 1);
      const mute = ctx.createGain(); mute.gain.value = 0;
      src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      const endQuiet = Math.ceil((pc.endQuietMs || 350) / chunkMs);     // after the last word is heard
      const stuckQuiet = Math.ceil((useChrome ? (pc.stuckQuietMs || 5000) : (pc.lineQuietMs || 1800)) / chunkMs); // no Chrome: quiet ends the line
      const clipMax = Math.floor((pc.clipMaxMs || 28000) / chunkMs);
      const lineMax = Math.floor((pc.lineMaxMs || 60000) / chunkMs);
      proc.onaudioprocess = function (ev) {
        if (done) return;
        const d = new Float32Array(ev.inputBuffer.getChannelData(0));
        chunks.push(d);
        let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
        const rms = Math.sqrt(sum / d.length);
        seen++;
        if (seen <= 3) floor = seen === 1 ? rms : Math.min(floor, rms);
        const thr = Math.max(0.012, Math.min(floor, 0.05) * 2.5);
        const i = chunks.length - 1;
        segChunks++;
        if (rms > thr) {
          if (segVoice < 0) segVoice = i;
          segLastLoud = i;
          if (firstVoice < 0) firstVoice = i;
          lastVoice = i;
        }
        if (segVoice < 0) { if (segChunks > lineMax) endSentence(); return; }
        const quiet = i - segLastLoud;
        const reachedEnd = useChrome && chromeAt() >= refs[si].length - (refs[si].length > 5 ? 1 : 0);
        if ((reachedEnd && quiet >= endQuiet) || quiet >= stuckQuiet || segChunks > lineMax) { endSentence(); return; }
        // A very long sentence: send what is recorded so far and keep listening to the same sentence.
        if (i - Math.max(segStart, segVoice - 3) >= clipMax && quiet >= 2) {
          sendClip(si, Math.max(segStart, segVoice - 3), i + 1);
          segStart = i + 1; segVoice = -1;
        }
      };
      startChrome();
      if (opts.onListening) opts.onListening();
    }).catch(function (e) {
      if (done) return;
      done = true; MIC.busy = false; stopChrome();
      if (current === me) current = null;
      const name = e && e.name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'NotFoundError') MIC.markDown('mic.blocked');
      opts.onDone({ ok: false, why: 'mic ' + name });
    });
    return me;
  };
})(window.RF);
