// Menu screens on top of the 3D world: language pick, title, settings, microphone test,
// level card and the end-of-level screen. Every line and button has a speaker.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;
  const S = {};
  RF.screens = S;

  function open(dim) {
    S.close();
    const box = D.el('div', 'screen' + (dim ? ' dim' : ''), null, document.getElementById('ui'));
    S.cur = box;
    return box;
  }
  S.close = function () {
    if (S.cur) { D.navOff(S.cur); S.cur.remove(); S.cur = null; }
  };
  function panel(box, w, color) {
    const p = D.el('div', 'panel', null, box);
    p.style.cssText += ';width:' + w + 'px;max-width:94%;display:flex;flex-direction:column;gap:16px;' + (color ? 'border-color:' + color : '');
    return p;
  }

  // ---------- First launch: language ----------
  S.language = function () {
    const box = open(true);
    const p = panel(box, 560);
    p.style.alignItems = 'center';
    D.line('lang.prompt', '', p).querySelector('.txt').style.fontSize = 'calc(28px * var(--ts))';
    const row = D.el('div', null, null, p);
    row.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center';
    ['en', 'es'].forEach(function (l, i) {
      const b = D.el('div', 'line', null, row);
      b.appendChild(D.speaker(function () { RF.speak(l === 'en' ? 'lang.english' : 'lang.spanish', l); }));
      const btn = D.el('button', 'btn big', D.esc(RF.t(l === 'en' ? 'lang.english' : 'lang.spanish', l)), b);
      if (i === 0) btn.dataset.first = '1';
      btn.addEventListener('click', function () {
        RF.settings.lang = l;
        if (l === 'es') RF.metrics.support('spanishOn');
        RF.saveSettings();
        RF.dom.applySettings();
        RF.sfx('select');
        S.title();
      });
    });
    D.nav(box);
  };

  // ---------- Title ----------
  S.title = function () {
    if (RF.battle && RF.battle.active) RF.battle.cleanup();
    const box = open(false);
    box.style.background = 'radial-gradient(ellipse at center, rgba(5,6,15,.15), rgba(5,6,15,.7))';
    const col = D.el('div', null, null, box);
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center';
    const logo = D.el('div', null, D.esc(RF.t('title.name')).toUpperCase(), col);
    logo.style.cssText = 'font-size:92px;font-weight:700;letter-spacing:4px;line-height:1;background:linear-gradient(#fff6c8,#ffd76a 45%,#c04dff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 0 #05060f) drop-shadow(0 0 24px rgba(192,77,255,.6))';
    const tag = D.line('title.tagline', 'chip', col);
    tag.querySelector('.txt').style.fontSize = 'calc(22px * var(--ts))';
    const btns = D.el('div', null, null, col);
    btns.style.cssText = 'display:flex;flex-direction:column;gap:12px;align-items:center;margin-top:12px';
    D.button('title.play', function () { RF.sfx('select'); S.levelCard(0); }, 'big go', btns).btn.dataset.first = '1';
    D.button('title.settings', function () { RF.sfx('open'); S.settings(function () { S.title(); }); }, '', btns);
    const ver = D.el('div', null, RF.VERSION, box);
    ver.style.cssText = 'position:absolute;right:14px;bottom:10px;font-size:13px;color:#8890c8';
    D.nav(box);
  };

  // ---------- Level card (the World 1 map comes in M4) ----------
  S.levelCard = function (i) {
    const L = RF.data.levels.levels[i];
    const box = open(true);
    const p = panel(box, 560);
    D.el('div', 'cyan', D.esc(RF.t('level.n' + L.num) + ' · ' + RF.t('level.open')).toUpperCase(), p).style.cssText = 'font-weight:700;font-size:16px;margin-bottom:-10px';
    const nm = D.line(L.name, '', p);
    nm.querySelector('.txt').style.cssText = 'font-size:calc(34px * var(--ts));font-weight:700';
    const rows = [
      ['level.card.waves', 'level.wavesUntil', null, null, '#fff'],
      ['level.card.enemies', L.enemies, null, null, '#d9a8ff'],
      ['level.card.words', L.words, null, null, '#fff'],
      ['level.card.reward', L.reward, null, null, '#ffd76a']
    ];
    const grid = D.el('div', null, null, p);
    grid.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:10px 16px;align-items:center';
    rows.forEach(function (r) {
      const parts = [{ id: r[0] }, r[1] ? { id: r[1] } : r[2]];
      const lab = D.el('div', 'line', null, grid);
      lab.appendChild(D.speaker(function () { RF.speakSeq(parts); }, true));
      D.el('span', 'txt', D.esc(RF.t(r[0])), lab).style.color = '#aab6ff';
      D.el('div', 'read', D.esc(r[1] ? RF.t(r[1]) : r[3]), grid).style.cssText = 'font-size:calc(18px * var(--ts));color:' + r[4];
    });
    D.line('level.goal', '', p).querySelector('.txt').style.color = '#9cf2c0';
    const row = D.el('div', null, null, p);
    row.style.cssText = 'display:flex;gap:14px;align-items:center;flex-wrap:wrap';
    D.button('title.play', function () { S.close(); RF.sfx('open'); RF.startBattle(i); }, 'big go', row).btn.dataset.first = '1';
    D.button('settings.back', function () { RF.sfx('back'); S.title(); }, '', row);
    RF.speakSeq([{ id: 'level.n' + L.num }, { id: L.name }]);
    D.nav(box, function () { S.title(); });
  };

  // ---------- Settings ----------
  S.settings = function (onBack) {
    const box = open(true);
    const p = panel(box, 760);
    p.style.gap = '12px';
    p.style.maxHeight = '96%';
    p.style.overflowY = 'auto';
    const h = D.line('settings.title', '', p);
    h.querySelector('.txt').style.cssText = 'font-size:calc(30px * var(--ts));font-weight:700;color:#ffd76a';
    D.line('settings.hint', '', p).querySelector('.txt').style.color = '#aab6ff';
    const grid = D.el('div', null, null, p);
    grid.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:12px 18px;align-items:center';
    function row(labelId, options, getter, setter, fontFor) {
      D.line(labelId, '', grid);
      const opts = D.el('div', null, null, grid);
      opts.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
      options.forEach(function (o) {
        const b = D.el('button', 'btn' + (getter() === o.v ? ' on' : ''), D.esc(RF.t(o.id, o.lang)), opts);
        if (fontFor) b.style.fontFamily = fontFor(o.v);
        b.addEventListener('click', function () {
          setter(o.v);
          RF.saveSettings();
          RF.dom.applySettings();
          RF.sfx('select');
          const focusIdx = Array.prototype.indexOf.call(box.querySelectorAll('button'), b);
          S.settings(onBack);
          const again = S.cur.querySelectorAll('button')[focusIdx];
          if (again) setTimeout(function () { again.focus(); }, 40);
          RF.speak(o.id, o.lang);
        });
      });
    }
    const st = RF.settings;
    row('settings.language', [{ v: 'en', id: 'lang.english', lang: 'en' }, { v: 'es', id: 'lang.spanish', lang: 'es' }], function () { return RF.lang(); }, function (v) { st.lang = v; if (v === 'es') RF.metrics.support('spanishOn'); });
    row('settings.textSize', [{ v: 'normal', id: 'settings.size.normal' }, { v: 'large', id: 'settings.size.large' }, { v: 'xlarge', id: 'settings.size.xlarge' }], function () { return st.textSize; }, function (v) { st.textSize = v; });
    row('settings.font', [{ v: 'lexend', id: 'settings.font.lexend' }, { v: 'dyslexic', id: 'settings.font.dyslexic' }], function () { return st.font; }, function (v) { st.font = v; }, function (v) { return v === 'dyslexic' ? 'OpenDyslexic' : 'Lexend'; });
    // Volume
    D.line('settings.volume', '', grid);
    const vol = D.el('div', null, null, grid);
    vol.style.cssText = 'display:flex;gap:10px;align-items:center';
    const minus = D.el('button', 'btn', '&minus;', vol);
    const val = D.el('div', 'chip', String(st.volume), vol);
    val.style.minWidth = '60px'; val.style.justifyContent = 'center';
    const plus = D.el('button', 'btn', '+', vol);
    [[minus, -1], [plus, 1]].forEach(function (pair) {
      pair[0].setAttribute('aria-label', pair[1] < 0 ? 'Quieter' : 'Louder');
      pair[0].addEventListener('click', function () {
        st.volume = Math.max(0, Math.min(10, st.volume + pair[1]));
        val.textContent = String(st.volume);
        RF.saveSettings();
        RF.sfx('select');
        RF.speak('num.' + st.volume);
      });
    });
    row('settings.motion', [{ v: false, id: 'settings.motion.full' }, { v: true, id: 'settings.motion.reduced' }], function () { return !!st.reducedMotion; }, function (v) { st.reducedMotion = v; });
    row('settings.focus', [{ v: false, id: 'settings.off' }, { v: true, id: 'settings.on' }], function () { return !!st.focus; }, function (v) { st.focus = v; if (v) RF.metrics.support('focusOn'); });
    D.el('div', null, null, grid);
    D.line('settings.focusHint', '', grid).querySelector('.txt').style.cssText = 'font-size:calc(15px * var(--ts));color:#aab6ff';
    const bottom = D.el('div', null, null, p);
    bottom.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;margin-top:6px';
    D.button('settings.mic', function () { RF.sfx('open'); S.micTest(function () { S.settings(onBack); }); }, '', bottom);
    D.button('settings.back', function () { RF.sfx('back'); S.close(); onBack(); }, 'go', bottom).btn.dataset.first = '1';
    D.nav(box, function () { S.close(); onBack(); });
  };

  // ---------- Microphone test (speak mode arrives in M5) ----------
  S.micTest = function (onBack) {
    const box = open(true);
    const p = panel(box, 760);
    p.style.alignItems = 'center';
    D.line('mic.title', '', p).querySelector('.txt').style.cssText = 'font-size:calc(30px * var(--ts));font-weight:700;color:#ffd76a';
    const status = D.el('div', null, null, p);
    const heard = D.el('div', 'read', '', p);
    heard.style.cssText = 'font-size:calc(28px * var(--ts));font-weight:700;color:#9cf2c0;min-height:40px;cursor:pointer';
    const meter = D.el('div', null, '<i style="display:block;height:100%;width:0;background:#9cf2c0"></i>', p);
    meter.style.cssText = 'width:600px;max-width:100%;height:26px;background:#05070f;border:3px solid #7d89d8;border-radius:6px;overflow:hidden';
    const diag = D.el('div', null, '', p);
    diag.style.cssText = 'font-size:14px;color:#c8cdf0;min-height:18px';
    const row = D.el('div', null, null, p);
    row.style.cssText = 'display:flex;gap:14px';
    const st = { rec: null, stream: null, ctx: null, raf: 0, peak: 0, meterOn: false, words: '' };
    function setStatus(id, speakIt) { D.clear(status); D.line(id, '', status).querySelector('.txt').style.fontSize = 'calc(22px * var(--ts))'; if (speakIt) RF.speak(id); }
    heard.addEventListener('click', function () { if (st.words) RF.speakText(st.words, 'en'); });
    function stopMeter() {
      cancelAnimationFrame(st.raf);
      if (st.stream) st.stream.getTracks().forEach(function (t) { t.stop(); });
      if (st.ctx) st.ctx.close();
      st.stream = st.ctx = null;
      meter.firstChild.style.width = '0';
    }
    function startMeter() {
      stopMeter();
      st.peak = 0; st.meterOn = false;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      // Rule from the mic tests: anything else using the mic turns off Chrome's audio cleanup.
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
        if (!document.body.contains(box)) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        st.stream = stream; st.meterOn = true;
        st.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const an = st.ctx.createAnalyser(); an.fftSize = 1024;
        st.ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Float32Array(an.fftSize);
        (function tick() {
          an.getFloatTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const level = Math.sqrt(sum / buf.length);
          st.peak = Math.max(st.peak, level);
          meter.firstChild.style.width = Math.min(100, level * 500) + '%';
          st.raf = requestAnimationFrame(tick);
        })();
      }).catch(function (e) { console.warn('Sound meter could not start:', e && e.name); });
    }
    function dropRec() {
      const r = st.rec; st.rec = null;
      if (!r) return;
      r.onresult = r.onerror = r.onend = r.onaudiostart = r.onsoundstart = r.onspeechstart = null;
      try { r.abort(); } catch (e) { /* ignore */ }
    }
    function finish(id) { stopMeter(); setStatus(id, true); }
    function listen() {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      heard.textContent = ''; st.words = '';
      if (!Rec) return setStatus('mic.unsupported', true);
      dropRec(); RF.stopSpeaking(); startMeter();
      const rec = new Rec();
      st.rec = rec;
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 3;
      const seen = { audio: false, sound: false, speech: false, error: null };
      let done = false;
      rec.onaudiostart = function () { seen.audio = true; };
      rec.onsoundstart = function () { seen.sound = true; };
      rec.onspeechstart = function () { seen.speech = true; };
      rec.onresult = function (ev) {
        let words = '';
        for (let i = 0; i < ev.results.length; i++) words += ev.results[i][0].transcript;
        words = words.trim();
        if (!words) return;
        st.words = words;
        heard.textContent = RF.t('mic.heard') + ' "' + words + '"';
        if (ev.results[ev.results.length - 1].isFinal && !done) { done = true; finish('mic.ok'); try { rec.stop(); } catch (e) { /* ignore */ } }
      };
      rec.onerror = function (ev) { seen.error = ev.error; };
      rec.onend = function () {
        const yn = function (v) { return v ? 'yes' : 'no'; };
        diag.textContent = 'Mic on: ' + yn(seen.audio) + '   Sound: ' + yn(seen.sound) + '   Speech: ' + yn(seen.speech) + '   Level: ' + Math.round(st.peak * 1000) + '   Error: ' + (seen.error || 'none') + '   ' + RF.VERSION;
        if (done) return;
        done = true;
        if (st.words) return finish('mic.ok');
        const e = seen.error;
        if (e === 'not-allowed' || e === 'service-not-allowed' || e === 'audio-capture') finish('mic.blocked');
        else if (e === 'network') finish('mic.offline');
        else if (!seen.audio && !st.meterOn) finish('mic.notOn');
        else if (st.peak < 0.02) finish('mic.silent');
        else finish('mic.nothing');
      };
      try {
        rec.start();
        setStatus('mic.listening', false);
        setTimeout(function () { if (st.rec === rec) { try { rec.stop(); } catch (e) { /* ignore */ } } }, 7000);
      } catch (e) { finish('mic.blocked'); }
    }
    setStatus('mic.prompt', false);
    D.button('mic.start', listen, 'go', row).btn.dataset.first = '1';
    const back = function () { dropRec(); stopMeter(); RF.stopSpeaking(); RF.sfx('back'); onBack(); };
    D.button('settings.back', back, '', row);
    D.nav(box, back);
  };

  // ---------- End of level: what happened, and the mastery summary (win or lose) ----------
  S.results = function (r) {
    const box = open(true);
    const p = panel(box, 820, r.win ? '#ffd76a' : '#ff8a8a');
    p.style.cssText += ';max-height:96%;overflow-y:auto;gap:12px;padding:18px 22px';
    const top = D.el('div', null, null, p);
    top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap';
    const head = D.line(r.win ? 'res.win' : 'res.lose', '', top);
    head.querySelector('.txt').style.cssText = 'font-size:calc(30px * var(--ts));font-weight:700;color:' + (r.win ? '#ffd76a' : '#ffb0b0');
    if (r.win) {
      D.el('div', null, [1, 2, 3].map(function (i) { return '<span style="color:' + (i <= r.stars ? '#ffd76a' : '#3a3f6e') + ';text-shadow:0 0 ' + (i <= r.stars ? 14 : 0) + 'px #ffb000">&#9733;</span>'; }).join(''), top).style.cssText = 'font-size:48px;letter-spacing:6px;line-height:1';
      D.line('res.stars' + r.stars, '', p).querySelector('.txt').style.color = '#e6e9ff';
    } else {
      D.line('res.loseTip', '', p).querySelector('.txt').style.color = '#e6e9ff';
    }

    // Rift locks: one row per pattern, plus runes.
    const sec = D.el('div', null, null, p);
    sec.style.cssText = 'background:#0b0d20;border:2px solid #4b4f9c;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px';
    const lt = D.line('res.locksTitle', '', sec);
    lt.querySelector('.txt').style.cssText = 'font-weight:700;color:#f0c8ff;font-size:calc(17px * var(--ts))';
    const st = r.stats;
    const need = r.L.mastery.need, win10 = r.L.mastery.window;
    r.locks.forEach(function (k) {
      const bp = st.byPat[k.pat] || { n: 0, first: 0 };
      const row = D.el('div', null, null, sec);
      row.style.cssText = 'display:grid;grid-template-columns:auto 110px auto 1fr auto;gap:10px;align-items:center';
      const parts = [{ id: 'pat.' + k.pat }, { id: 'res.thisTry' }, D.num(bp.first), { id: 'res.of' }, D.num(bp.n), { id: 'res.ofFirst' }, { id: k.done ? 'res.lockDone' : 'res.lockWorking' }];
      row.appendChild(D.speaker(function () { RF.speakSeq(parts); }, true));
      D.el('div', 'read', D.esc(RF.t('pat.' + k.pat)), row).style.cssText = 'font-size:calc(18px * var(--ts));font-weight:700';
      const bar = D.el('div', null, null, row);
      bar.title = RF.t('res.lastTen');
      bar.style.cssText = 'display:flex;gap:3px';
      for (let i = 0; i < win10; i++) {
        const v = k.recent[i];
        D.el('div', null, null, bar).style.cssText = 'width:13px;height:18px;border-radius:3px;background:' + (v === undefined ? '#22264a' : v ? (k.done ? '#ffd76a' : '#9cf2c0') : '#5a3a6e');
      }
      D.el('div', null, D.esc(RF.t('res.thisTry')) + ' <b class="cyan">' + bp.first + '</b> ' + D.esc(RF.t('res.of')) + ' ' + bp.n + ' ' + D.esc(RF.t('res.ofFirst')), row).style.cssText = 'font-size:calc(14px * var(--ts));color:#c9c3ff';
      const chip = D.el('div', 'chip', (k.done ? '&#128274; ' : '') + D.esc(RF.t(k.done ? 'res.lockDone' : 'res.lockWorking')) + (k.done ? '' : ' ' + Math.min(k.first, need) + '/' + need), row);
      chip.style.cssText += ';font-size:14px;padding:3px 10px;border-color:' + (k.done ? '#ffd76a' : '#7d89d8') + ';color:' + (k.done ? '#ffd76a' : '#fff');
    });
    const rr = D.el('div', null, null, sec);
    rr.style.cssText = 'display:flex;gap:10px;align-items:center';
    const rparts = [{ id: 'res.runes' }, { id: 'res.thisTry' }, D.num(st.runeFirst || 0), { id: 'res.of' }, D.num(st.runes), { id: 'res.ofFirst' }];
    rr.appendChild(D.speaker(function () { RF.speakSeq(rparts); }, true));
    D.el('div', null, D.esc(RF.t('res.runes')) + ' &nbsp; <span style="color:#c9c3ff;font-weight:400">' + D.esc(RF.t('res.thisTry')) + ' <b class="cyan">' + (st.runeFirst || 0) + '</b> ' + D.esc(RF.t('res.of')) + ' ' + st.runes + ' ' + D.esc(RF.t('res.ofFirst')) + '</span>', rr).style.cssText = 'font-size:calc(15px * var(--ts));font-weight:700;color:#ffe9a8';
    if (!r.win || !r.locks.every(function (k) { return k.done; })) D.line('res.carry', '', sec).querySelector('.txt').style.cssText = 'color:#9cf2c0;font-size:calc(14px * var(--ts))';

    // Words to practice (tap to hear).
    const pr = D.el('div', null, null, p);
    pr.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    D.line('res.practice', '', pr).querySelector('.txt').style.cssText = 'font-weight:700;color:#aab6ff;font-size:calc(15px * var(--ts))';
    if (st.practice.length) {
      st.practice.slice(0, 10).forEach(function (w) {
        const b = D.el('button', 'btn read', D.esc(w), pr);
        b.style.cssText += ';font-family:var(--rf);font-size:calc(20px * var(--ts));padding:4px 12px;color:#ffd76a';
        b.addEventListener('click', function () { RF.speakWord(w); });
      });
    } else {
      D.el('span', null, D.esc(RF.t('res.practiceNone')), pr).style.cssText = 'color:#9cf2c0;font-size:calc(15px * var(--ts))';
    }

    // Numbers, and how this try compares with the last one.
    const pct = st.forged ? Math.round(st.firstTry / st.forged * 100) : 0;
    const grid = D.el('div', null, null, p);
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;width:100%';
    [['res.words', st.forged, D.num(st.forged)], ['res.firstRate', pct + '%', { text: pct + '%' }], ['res.waves', r.waves, D.num(r.waves)]].forEach(function (s2) {
      const c = D.el('div', 'chip', null, grid);
      c.style.cssText += ';flex-direction:column;gap:2px;padding:8px';
      D.el('div', null, String(s2[1]), c).style.cssText = 'font-size:32px;color:#7ef3ff;line-height:1';
      D.lineParts([{ id: s2[0] }, s2[2]], '', c, D.esc(RF.t(s2[0]))).querySelector('.txt').style.cssText = 'font-size:calc(13px * var(--ts));font-weight:400;color:#c9c3ff';
    });
    if (r.prev && r.prev.words) {
      const before = Math.round(r.prev.firstTry / r.prev.words * 100);
      const up = pct >= before;
      const parts = [{ id: 'res.firstRate' }, { text: pct + '%' }, { id: 'res.vsLast' }, { text: before + '%' }];
      const l = D.lineParts(parts, '', p, D.esc(RF.t('res.firstRate')) + ': <b class="cyan">' + pct + '%</b> ' + (up && pct > before ? '<span style="color:#7dff9c">&#9650;</span>' : '') + ' &nbsp; ' + D.esc(RF.t('res.vsLast')) + ': ' + before + '%');
      l.querySelector('.txt').style.color = '#e6e9ff';
    }

    const row = D.el('div', null, null, p);
    row.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:4px';
    D.button(r.win ? 'res.again' : 'res.tryAgain', function () { S.close(); RF.startBattle(r.levelIndex); }, 'big go', row).btn.dataset.first = '1';
    D.button('battle.toTitle', function () { S.title(); }, '', row);
    RF.speak(r.win ? 'res.win' : 'res.lose');
    D.nav(box);
  };
})(window.RF);
