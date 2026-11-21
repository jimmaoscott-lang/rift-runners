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
  // Azure: every real word, and runes when spokenRunes is on (or in Test mode, for trying it).
  // Chrome only: not runes, and not short i or short e before m or n (pin, pen, ten, win), which
  // Chrome hears but will not name (DESIGN.md 6, Speak mode word rule). Any word marked noSpeak
  // stays tap only with either checker.
  function chromeCan(w) { return w.kind !== 'rune' && !/[ie][mn]/.test(w.w); }
  MIC.canCheck = function (w) {
    if (!w || w.noSpeak) return false;
    if (azOK()) return w.kind !== 'rune' || !!cfg().spokenRunes || !!(RF.unlocks && RF.unlocks.testMode());
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
  MIC.score = function (res) {
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
    let ok = (SAME[v.p] || [v.p]).slice();
    if (nasal && (v.p === 'ɪ' || v.p === 'ɛ')) ok = ok.concat(['ɪ', 'ɛ', 'i']); // pin/pen, Gulf Coast
    const top = v.best && v.best[0] ? v.best[0].p : null;
    const topOK = !!top && ok.indexOf(top) >= 0;
    const topOther = !!top && !topOK && VOWELS.indexOf(top) >= 0;
    const vs = v.score || 0;
    const vowelPass = (topOK && vs >= 25) || (vs >= (s.vowelMin || 60) && !(topOther && vs < (s.vowelClearMiss || 80)));
    const cons = ph.filter(function (p, k) { return k !== vi; }).map(function (p) { return p.score || 0; });
    const avg = cons.length ? cons.reduce(function (a, b) { return a + b; }, 0) / cons.length : 100;
    const consPass = avg >= (s.consonantAvgMin || 40) && cons.every(function (c) { return c >= (s.consonantEachMin || 15); });
    const wordPass = topOK || (w.accuracy || 0) >= (s.wordMin || 45);
    out.outcome = vowelPass && consPass && wordPass ? 'match' : 'miss';
    out.note = 'vowel ' + v.p + ' ' + Math.round(vs) + (top ? ' (sounded most like ' + top + ')' : '') +
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
    rec.onaudiostart = function () { st.seen.audio = true; };
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
    const ch = chromeListen(word.w, word.sayAlso, opts,
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
    if (opts.onStart) opts.onStart();
  }

  function listenAzure(word, cb, opts) {
    const c = cfg();
    let done = false, stream = null, ctx = null, proc = null, ch = null, ctl = null, maxTimer = 0;
    const chunks = [];
    const stopAudio = function () {
      clearTimeout(maxTimer);
      if (proc) { proc.onaudioprocess = null; try { proc.disconnect(); } catch (e) { /* ignore */ } }
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ctx) ctx.close().catch(function () {});
      stream = ctx = proc = null;
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
            const sc = MIC.score(j);
            finish({ matched: sc.outcome === 'match', heard: j.heard || '', outcome: sc.outcome, engine: 'azure', diag: 'azure: ' + sc.note });
          });
        })
        .catch(function (e) { clearTimeout(t); if (!done) fallBack(e && e.name === 'AbortError' ? 'slow answer' : 'blocked or offline'); });
    };

    // Open the mic with Chrome's audio cleanup off (DESIGN.md 10 rule), at 16 kHz if allowed.
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }).then(function (s) {
      if (done) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      const AC = window.AudioContext || window.webkitAudioContext;
      try { ctx = new AC({ sampleRate: 16000 }); } catch (e) { ctx = new AC(); }
      const rate = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);
      const size = rate > 20000 ? 4096 : 2048; // about 0.1 to 0.13 seconds per chunk
      proc = ctx.createScriptProcessor(size, 1, 1);
      const mute = ctx.createGain(); mute.gain.value = 0;
      src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      const chunkMs = size / rate * 1000;
      const quietNeeded = Math.ceil((c.endSilenceMs || 700) / chunkMs);
      let floor = 0, seenChunks = 0, speechAt = -1, lastLoud = -1, peak = 0;
      const wrap = function () {
        // Keep from a moment before the voice started to a moment after it stopped.
        const a = Math.max(0, speechAt - 3), b = Math.min(chunks.length, lastLoud + 3);
        stopAudio();
        send(to16k(chunks.slice(a, b), rate));
      };
      proc.onaudioprocess = function (ev) {
        if (done) return;
        const d = new Float32Array(ev.inputBuffer.getChannelData(0));
        chunks.push(d);
        let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
        const rms = Math.sqrt(sum / d.length);
        peak = Math.max(peak, rms);
        // Room noise level: the quietest of the first few chunks (a student who starts talking
        // right away must not raise it), capped so a loud room still works.
        seenChunks++;
        if (seenChunks <= 3) floor = seenChunks === 1 ? rms : Math.min(floor, rms);
        const thr = Math.max(0.012, Math.min(floor, 0.05) * 2.5);
        const i = chunks.length - 1;
        if (rms > thr) { if (speechAt < 0) speechAt = i; lastLoud = i; }
        else if (speechAt >= 0 && i - lastLoud >= quietNeeded) wrap();
      };
      maxTimer = setTimeout(function () {
        if (done || !proc) return;
        if (speechAt < 0) {
          // Heard no voice at all. Count it as "nothing", unless Chrome caught the word.
          stopAudio();
          if (ch && MIC.matches(word.w, ch.st.heard, word.sayAlso)) return finish({ matched: true, heard: ch.st.heard[0], outcome: 'match', engine: 'chrome', diag: 'azure heard no voice (level ' + Math.round(peak * 1000) + '); chrome caught it' });
          return finish({ matched: false, heard: '', outcome: 'nothing', diag: 'azure: no voice heard, level ' + Math.round(peak * 1000) });
        }
        wrap();
      }, c.maxListenMs || 5000);
      if (opts.onStart) opts.onStart();
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
})(window.RF);
