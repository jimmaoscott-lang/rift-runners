// Speak mode listener (DESIGN.md section 6, item 2). Uses Chrome's built-in speech recognizer.
// One listen = one try. Nothing is recorded or saved: Chrome turns the sound into text and we
// only keep whether the word matched.
window.RF = window.RF || {};
(function (RF) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const MIC = {
    supported: !!Rec,
    // 'ok' until something proves the mic cannot work here. 'down' turns speak mode off
    // for this visit and every word shows its tap choices right away.
    state: Rec ? 'ok' : 'down',
    reason: Rec ? null : 'mic.unsupported',
    busy: false
  };
  RF.mic = MIC;
  MIC.usable = function () { return MIC.supported && MIC.state === 'ok'; };
  MIC.markDown = function (reasonId) { MIC.state = 'down'; MIC.reason = reasonId; };
  MIC.retry = function () { if (MIC.supported) { MIC.state = 'ok'; MIC.reason = null; } };

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean); }

  // Words that count as the target. Gulf Coast speech says short i and short e the same before
  // m or n (pin/pen, him/hem), so Chrome may hear either one. That is dialect, not a decoding
  // error, so both spellings count there (DESIGN.md 6, Speak mode matching).
  MIC.accepts = function (target) {
    const t = String(target).toLowerCase();
    const out = [t];
    for (let i = 0; i < t.length - 1; i++) {
      if ((t[i] === 'i' || t[i] === 'e') && (t[i + 1] === 'm' || t[i + 1] === 'n')) {
        out.push(t.slice(0, i) + (t[i] === 'i' ? 'e' : 'i') + t.slice(i + 1));
      }
    }
    return out;
  };
  // Did any of Chrome's guesses contain the target word on its own?
  MIC.matches = function (target, transcripts) {
    const ok = MIC.accepts(target);
    return transcripts.some(function (tx) { return norm(tx).some(function (w) { return ok.indexOf(w) >= 0; }); });
  };

  let current = null;
  MIC.stop = function () {
    const r = current; current = null; MIC.busy = false;
    if (!r) return;
    r.onresult = r.onerror = r.onend = r.onsoundstart = null;
    try { r.abort(); } catch (e) { /* ignore */ }
  };

  // Listen for one word. cb({ matched, heard, outcome }) where outcome is
  // 'match', 'miss' (heard a different word), 'nothing' (heard no word) or 'down' (mic cannot work).
  MIC.listen = function (target, cb, opts) {
    opts = opts || {};
    if (!MIC.usable()) { cb({ matched: false, heard: '', outcome: 'down' }); return; }
    MIC.stop();
    const rec = new Rec();
    current = rec;
    MIC.busy = true;
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 5;
    const heard = [];
    let error = null, done = false;
    const finish = function (res) {
      if (done) return;
      done = true;
      if (current === rec) current = null;
      MIC.busy = false;
      clearTimeout(timer);
      try { rec.abort(); } catch (e) { /* ignore */ }
      cb(res);
    };
    rec.onresult = function (ev) {
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        for (let k = 0; k < r.length; k++) if (r[k].transcript) heard.push(r[k].transcript);
      }
      // Stop as soon as the word is caught, so the student does not wait.
      if (MIC.matches(target, heard)) finish({ matched: true, heard: heard[0] || '', outcome: 'match' });
    };
    rec.onerror = function (ev) { error = ev.error; };
    rec.onend = function () {
      if (done) return;
      if (error === 'not-allowed' || error === 'service-not-allowed' || error === 'audio-capture') {
        MIC.markDown('mic.blocked');
        return finish({ matched: false, heard: '', outcome: 'down' });
      }
      if (error === 'network') {
        MIC.markDown('mic.offline');
        return finish({ matched: false, heard: '', outcome: 'down' });
      }
      if (MIC.matches(target, heard)) return finish({ matched: true, heard: heard[0], outcome: 'match' });
      finish({ matched: false, heard: heard[0] || '', outcome: heard.length ? 'miss' : 'nothing' });
    };
    const timer = setTimeout(function () { try { rec.stop(); } catch (e) { /* ignore */ } }, opts.maxMs || 5000);
    try {
      rec.start();
      if (opts.onStart) opts.onStart();
    } catch (e) {
      MIC.markDown('mic.blocked');
      finish({ matched: false, heard: '', outcome: 'down' });
    }
  };
})(window.RF);
