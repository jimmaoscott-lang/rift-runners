// The Rune Forge: where the reading happens (DESIGN.md section 6). Speak mode and tap mode.
// Speak mode: press the mic and read the word out loud (real words only; runes stay tap).
// A word appears. Three speaker buttons each say a word: the real one and two with a different vowel.
// The student picks the one that matches and presses Forge. Every forge pays crystals right away.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // opts: { level, onPay(amount, fromEl), onMega(), onRead(), onSeal(), restore }
  RF.Forge = function (parent, opts) {
    const F = this;
    const cfg = RF.data.units.forge;
    const W1 = RF.data.world1;
    const L = opts.level;
    F.stats = { forged: 0, firstTry: 0, crystals: 0, help: 0, misses: 0, runes: 0, runeFirst: 0, byPat: {}, practice: [] };
    F.streak = 0;
    F.recent = [];
    F.recentWords = [];
    F.guesses = [];
    F.overheats = 0;
    F.heatUntil = 0;

    const vowelOK = function (w) { return L.vowels.indexOf(w.w[1]) >= 0; };
    const real = W1.words.filter(vowelOK).map(function (w) { return Object.assign({ kind: 'real' }, w); });
    const runes = W1.runes.filter(vowelOK).map(function (w) { return Object.assign({ kind: 'rune' }, w); });

    // ---- Panel ----
    const root = D.el('div', 'forge', null, parent);
    F.root = root;
    const head = D.el('div', null, null, root);
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px';
    const title = D.el('div', 'line', null, head);
    title.appendChild(D.speaker(function () { RF.speak('forge.title'); }, true));
    D.el('div', null, D.esc(RF.t('forge.title')).toUpperCase(), title).style.cssText = 'font-size:19px;font-weight:700;color:#f0c8ff;letter-spacing:.5px;white-space:nowrap';
    const streakChip = D.el('div', 'chip', '', head);
    streakChip.style.cssText = 'padding:4px 10px;font-size:16px;border-color:#ffd76a';
    const pips = D.el('div', null, null, root);
    pips.style.cssText = 'display:flex;gap:6px';
    const pipEls = [];
    for (let i = 0; i < cfg.megaPips; i++) { const p = D.el('div', null, null, pips); p.style.cssText = 'flex:1;height:10px;border-radius:5px;background:#2a2a55;transition:background .2s'; pipEls.push(p); }
    const megaHint = D.el('div', null, null, root);
    megaHint.style.cssText = 'margin-top:-4px';

    const wordBox = D.el('div', 'word', null, root);
    const runeTag = D.el('div', null, '', wordBox);
    runeTag.style.cssText = 'position:absolute;left:12px;top:8px;font-size:14px;font-weight:700;color:#ffd76a';
    const hear = D.speaker(function () { F.hearWord(); });
    hear.style.cssText += ';position:absolute;right:10px;top:10px';
    hear.title = RF.t('forge.hearTip');
    wordBox.appendChild(hear);
    const wordEl = D.el('div', 'w', '', wordBox);

    const prompt = D.el('div', null, null, root);
    const micBtn = D.el('button', 'btn micBtn', '', root);
    micBtn.addEventListener('click', function () { F.listen(); });
    const optsRow = D.el('div', 'opts', null, root);
    const optEls = [0, 1, 2].map(function (i) {
      const b = D.el('button', 'opt', D.SPK + '<div>' + (i + 1) + '</div>', optsRow);
      b.setAttribute('aria-label', RF.t('forge.sound') + ' ' + (i + 1));
      b.addEventListener('click', function () { F.pick(i); });
      return b;
    });
    const forgeBtn = D.el('button', 'btn forgeBtn', '', root);
    forgeBtn.addEventListener('click', function () { F.forge(); });
    const msg = D.el('div', 'msg', null, root);
    const recent = D.el('div', 'recent', null, root);
    const heat = D.el('div', 'heat', null, root);

    function renderStreak() {
      streakChip.innerHTML = '<span style="font-size:18px">&#128293;</span> <span class="gold">x' + F.streak + '</span>';
      pipEls.forEach(function (p, i) { p.style.background = i < F.streak ? '#ffd76a' : '#2a2a55'; });
      D.clear(megaHint);
      const left = cfg.megaPips - F.streak;
      const row = D.lineParts([{ id: 'num.' + left }, { id: 'forge.megaHint' }], '', megaHint);
      row.querySelector('.txt').style.cssText = 'font-size:13px;color:#c9c3ff;font-family:Lexend,sans-serif';
    }
    // Speak first (DESIGN.md 6, item 2): a real word hides its tap choices until the student has
    // made this many voice tries. Off when the mic cannot work, so tap mode always works.
    function speakFirst() { return Math.max(0, Math.min(3, +RF.settings.speakFirst || 0)); }
    // Which words can be spoken depends on the checker that is up (DESIGN.md 6, Speak mode word
    // rule): with the Azure check every real word can (and runes when turned on); with Chrome only,
    // short i or short e before m or n (pin, pen, ten, win) and runes stay tap only. See speech.js.
    function micOn() { return F.cur && RF.mic && RF.mic.usable() && RF.mic.canCheck(F.cur); }
    function choicesHidden() { return F.cur.kind === 'real' && micOn() && !F.revealed && F.speakTries < speakFirst(); }
    function renderMode() {
      const hide = choicesHidden();
      optsRow.style.display = hide ? 'none' : '';
      forgeBtn.style.display = hide ? 'none' : '';
      micBtn.style.display = micOn() ? '' : 'none';
      D.clear(prompt);
      const id = hide ? 'forge.sayIt' : micOn() ? 'forge.whichOrSay' : F.cur.kind === 'rune' ? 'forge.whichRune' : 'forge.which';
      D.line(id, '', prompt);
      if (hide && F.speakTries > 0) {
        const left = speakFirst() - F.speakTries;
        D.lineParts([{ id: 'forge.choicesIn' }, { id: 'num.' + left }], '', prompt).querySelector('.txt').style.cssText = 'font-size:calc(13px * var(--ts));color:#aab6ff';
      }
      renderMic();
    }
    function renderMic(listening) {
      micBtn.classList.toggle('listening', !!listening);
      micBtn.innerHTML = D.MIC + '<span>' + D.esc(RF.t(listening ? 'forge.listening' : 'forge.say')).toUpperCase() + '</span>' +
        (listening ? '' : ' ' + D.CRYSTAL(20) + ' +' + payout('speak'));
    }
    function payout(mode) {
      const base = F.cur.kind === 'rune' ? cfg.rune : mode === 'speak' ? cfg.speak : cfg.real;
      if (F.revealed) return cfg.shown;
      if (F.tries > 0 || F.help) return Math.round((F.cur.kind === 'rune' ? cfg.rune : cfg.real) * cfg.helpShare);
      return base;
    }
    function renderForgeBtn() {
      forgeBtn.innerHTML = D.esc(RF.t('forge.button')).toUpperCase() + ' ' + D.CRYSTAL(22) + ' +' + payout();
    }
    function setMsg(html) { D.clear(msg); if (html) msg.appendChild(html); }
    function say(id, speakIt, extraNode) {
      const box = D.el('div');
      box.style.cssText = 'display:flex;flex-direction:column;gap:6px';
      D.line(id, '', box);
      if (extraNode) box.appendChild(extraNode);
      setMsg(box);
      if (speakIt) RF.speak(id);
    }
    function renderRecent() {
      recent.innerHTML = F.recent.slice(0, 3).map(function (r, i) {
        return '<div><b data-i="' + i + '">' + D.esc(r.w) + '</b> &nbsp;' + D.esc(RF.t(r.how)) + ' &nbsp;<span class="cyan">+' + r.amount + '</span></div>';
      }).join('') || '<div style="opacity:.7">' + D.esc(RF.t('forge.recentEmpty')) + '</div>';
      recent.querySelectorAll('b').forEach(function (b) {
        b.addEventListener('click', function () { RF.speakWord(F.recent[+b.dataset.i].w); });
      });
    }

    // ---- Words ----
    function pickWord() {
      const pool = Math.random() < L.runeRate && runes.length ? runes : real;
      const fresh = pool.filter(function (w) { return F.recentWords.indexOf(w.w) < 0; });
      const list = fresh.length ? fresh : pool;
      let total = 0;
      const ws = list.map(function (w) { const x = RF.metrics.weight(w.w); total += x; return x; });
      let r = Math.random() * total;
      for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
      return list[list.length - 1];
    }

    F.next = function () {
      const w = pickWord();
      F.cur = w;
      F.recentWords = [w.w].concat(F.recentWords).slice(0, 5);
      F.choices = shuffle([{ w: w.w, ok: true }, { w: w.options[0], ok: false }, { w: w.options[1], ok: false }]);
      F.sel = -1; F.tries = 0; F.speakTries = 0; F.matchNote = null; F.help = false; F.revealed = false;
      if (RF.mic) RF.mic.stop();
      F.shownAt = F.lastAction = performance.now();
      wordBox.classList.toggle('rune', w.kind === 'rune');
      runeTag.textContent = w.kind === 'rune' ? RF.t('forge.rune').toUpperCase() + ' · x2' : '';
      wordEl.className = 'w';
      wordEl.textContent = w.w;
      wordEl.onclick = function () { F.hearWord(); };
      optEls.forEach(function (b) { b.className = 'opt'; b.disabled = false; });
      renderForgeBtn();
      renderMode();
    };

    F.hearWord = function () {
      RF.speakWord(F.cur.w);
      if (!F.help) { F.help = true; RF.metrics.support('hearWord'); renderForgeBtn(); renderMic(); }
    };

    // ---- Speak mode ----
    function testHeard(text, diag) {
      const n = D.el('div', null, D.esc(RF.t('mic.heard')) + ' "' + D.esc(text || '') + '"' + (diag ? '<br>' + D.esc(diag) : ''));
      n.style.cssText = 'font-size:14px;color:#ffb89a';
      return n;
    }
    // ---- Sound rule card (DESIGN.md 6, item 6) ----
    // After the first miss on a word, a card explains the sound and blends the word. The battle
    // holds still and the card cannot be closed until the voice finishes. The first miss of each
    // vowel in a level gets the full card (rule + vowel + blend); later misses of that vowel get the
    // short card (vowel + blend).
    F.ruleSeen = {};
    F.ruleUp = false;
    function ruleFor(w) {
      const R = W1.rules;
      if (!R || !/^[a-z][aeiou][a-z]$/.test(w.w)) return null;
      return { rule: R, v: w.w[1], key: R.vowels[w.w[1]] };
    }
    function showRule(after) {
      const w = F.cur, info = ruleFor(w);
      if (!info || !info.key) return after();
      const full = !F.ruleSeen[info.v];
      F.ruleSeen[info.v] = true;
      F.ruleUp = true;
      F.stats.rules = (F.stats.rules || 0) + 1;
      RF.metrics.support('rule-' + info.v);
      if (opts.onHold) opts.onHold(true, true);
      if (RF.mic) RF.mic.stop();
      const shade = D.el('div', 'ruleShade', null, document.body);
      // Taps outside the card do nothing (the card has to be finished first).
      shade.addEventListener('click', function (ev) { ev.stopPropagation(); });
      const card = D.el('div', 'ruleCard', null, shade);
      D.el('div', 'ruleHead', D.esc(RF.t('rule.title')).toUpperCase(), card);
      let ruleRow = null;
      if (full) ruleRow = D.el('div', 'ruleLine read', D.esc(RF.t(info.rule.line)), card);
      const vRow = D.el('div', 'ruleVowel read', null, card);
      vRow.innerHTML = '<span class="rv">' + D.esc(info.v) + '</span><span class="rs">' + D.esc(RF.t('rule.says')) + '</span>' +
        '<span class="rsnd">' + D.esc(info.key.show) + '</span><span class="rs">' + D.esc(RF.t('rule.like')) + '</span><span class="rkey">' + D.esc(info.key.word) + '</span>';
      const tiles = D.el('div', 'ruleTiles read', null, card);
      const tileEls = w.w.split('').map(function (ch, k) { return D.el('span', k === 1 ? 'v' : '', D.esc(ch), tiles); });
      const whole = D.el('div', 'ruleWhole read', D.esc(w.w), card);
      const foot = D.el('div', 'ruleFoot', null, card);
      const again = D.el('button', 'btn', D.SPK + ' ' + D.esc(RF.t('rule.replay')), foot);
      const go = D.el('button', 'btn big go', D.esc(RF.t('rule.gotIt')), foot);
      again.style.visibility = go.style.visibility = 'hidden';
      function lit(el) { return function () { [ruleRow, vRow, whole].concat(tileEls).forEach(function (e) { if (e) e.classList.remove('lit'); }); if (el) el.classList.add('lit'); }; }
      function seq(withRule) {
        const items = [];
        if (withRule && ruleRow) items.push({ id: info.rule.line, on: lit(ruleRow) }, { pause: 300 });
        items.push({ id: 'rule.v.' + info.v, on: lit(vRow) }, { snd: info.v }, { pause: 200 }, { id: 'rule.like' }, { word: info.key.word }, { pause: 400 });
        w.w.split('').forEach(function (ch, k) { items.push({ snd: ch, on: lit(tileEls[k]) }, { pause: 250 }); });
        items.push({ word: w.w, on: function () { lit(whole)(); tileEls.forEach(function (e) { e.classList.add('lit'); }); } });
        return items;
      }
      let done = false;
      function ready() {
        if (done || !shade.parentNode) return;
        done = true;
        again.style.visibility = go.style.visibility = 'visible';
        go.focus();
      }
      function play(withRule) {
        // The Got it button waits for the voice, with a safety limit in case audio never ends.
        const limit = setTimeout(ready, withRule ? 16000 : 12000);
        RF.speakSeq(seq(withRule)).then(function () { clearTimeout(limit); setTimeout(ready, 300); });
      }
      again.addEventListener('click', function (ev) { ev.stopPropagation(); RF.sfx('tap'); play(false); });
      go.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (!done) return;
        RF.stopSpeaking();
        RF.sfx('select');
        shade.remove();
        F.ruleUp = false;
        F.closeRule = null;
        if (opts.onHold) opts.onHold(false, true);
        F.lastAction = performance.now();
        after();
      });
      // Every word can be heard: once the card has finished, tap a letter, the key word or the word.
      function tapHear(el, item) { el.style.cursor = 'pointer'; el.addEventListener('click', function (ev) { ev.stopPropagation(); if (done) RF.speakSeq([item]); }); }
      tileEls.forEach(function (e, k) { tapHear(e, { snd: w.w[k] }); });
      tapHear(vRow.querySelector('.rkey'), { word: info.key.word });
      tapHear(vRow.querySelector('.rsnd'), { snd: info.v });
      tapHear(whole, { word: w.w });
      if (ruleRow) tapHear(ruleRow, { id: info.rule.line });
      F.closeRule = function () { if (done) go.click(); };
      play(true);
    }
    function showTiles() {
      wordEl.className = 'tiles';
      wordEl.innerHTML = F.cur.w.split('').map(function (ch, k) { return '<span class="' + (k === 1 ? 'v' : '') + '">' + D.esc(ch) + '</span>'; }).join('');
    }
    F.listen = function () {
      if (performance.now() < F.heatUntil || !micOn() || RF.mic.busy) return;
      const w = F.cur;
      RF.stopSpeaking();
      if (RF.audio) RF.audio.duck(2); // keep game sound out of the mic
      renderMic(true);
      RF.sfx('tap');
      RF.mic.listen(w, function (res) {
        if (RF.audio) RF.audio.duck(0);
        if (F.cur !== w || !root.parentNode) return;
        renderMic(false);
        if (res.outcome === 'match') { F.engine = res.engine; if (RF.unlocks.testMode()) F.matchNote = testHeard(res.heard, res.engine + ' / ' + res.diag); return F.success(performance.now(), 'speak'); }
        if (res.outcome === 'down') {
          // The mic cannot work here: show the choices now and say why. Not counted as a try.
          renderMode();
          say(RF.mic.reason || 'mic.blocked', true);
          return;
        }
        // The checker stumbled (not the student): say it again, or use the choices for this word.
        // Neither one counts as a try.
        if (res.outcome === 'again' || res.outcome === 'switch') {
          renderMode();
          say(res.outcome === 'again' ? 'forge.checkAgain' : 'forge.checkSwitch', true, RF.unlocks.testMode() ? testHeard(res.heard, res.engine + ' / ' + res.diag) : null);
          return;
        }
        // Any real try counts, even if no word was caught (DESIGN.md 6, item 2).
        F.tries++; F.speakTries++;
        F.stats.misses++;
        F.lastAction = performance.now();
        RF.sfx('soft');
        // Test mode only: show what Chrome heard, so misses can be reported and fixed.
        const heardNote = RF.unlocks.testMode() ? testHeard(res.heard, res.engine + ' / ' + res.diag) : null;
        if (F.tries === 1) {
          showTiles();
          // A real misread gets the sound rule card; "the mic heard nothing" is not a reading error.
          if (res.outcome !== 'nothing' && ruleFor(w)) showRule(function () { say('rule.sayIt', true, heardNote); });
          else say(res.outcome === 'nothing' ? 'forge.heardNothing' : 'forge.sayAgain', true, heardNote);
        } else if (!F.revealed) {
          F.revealed = true;
          optEls.forEach(function (o, k) { if (F.choices[k].ok) o.classList.add('glow'); });
          say('forge.revealSay', false, heardNote);
          RF.speakSeq([{ id: 'forge.revealSay' }, { word: w.w }]);
        } else {
          say('forge.revealSay', false, heardNote);
          RF.speakSeq([{ id: 'forge.revealSay' }, { word: w.w }]);
        }
        renderForgeBtn();
        renderMode();
      }, { also: w.sayAlso, onStart: function () { RF.metrics.support('micPress'); } });
    };

    F.pick = function (i) {
      if (performance.now() < F.heatUntil || choicesHidden()) return;
      const b = optEls[i];
      if (b.disabled) return;
      F.sel = i;
      optEls.forEach(function (o, k) { o.classList.toggle('sel', k === i); });
      RF.speakWord(F.choices[i].w);
    };

    F.forge = function () {
      if (performance.now() < F.heatUntil || choicesHidden()) return;
      if (F.sel < 0) { say('battle.pickFirst', true); RF.sfx('soft'); return; }
      const now = performance.now();
      const choice = F.choices[F.sel];
      if (choice.ok) return F.success(now);
      // Missed: no lost crystals. Break it up, then show it.
      F.tries++;
      F.stats.misses++;
      const fast = now - F.lastAction < cfg.fastGuessMs;
      F.guesses.push({ fast: fast, idx: F.sel });
      F.lastAction = now;
      optEls[F.sel].classList.remove('sel');
      optEls[F.sel].classList.add('out');
      optEls[F.sel].disabled = true;
      F.sel = -1;
      RF.sfx('soft');
      const g3 = F.guesses.slice(-3);
      if (g3.length === 3 && (g3.every(function (g) { return g.fast; }) || g3.every(function (g) { return g.idx === g3[0].idx; }))) {
        F.overheat();
      }
      if (F.tries === 1) {
        showTiles();
        if (F.heatShowing) { /* overheating: no card, the cooldown message stays */ }
        else if (ruleFor(F.cur)) showRule(function () { say('rule.tryAgain', true); });
        else say('battle.breakUp', true);
      } else {
        F.revealed = true;
        optEls.forEach(function (o, k) { if (F.choices[k].ok) o.classList.add('glow'); });
        if (!F.heatShowing) say('forge.reveal', true);
      }
      renderForgeBtn();
      renderMic();
    };

    F.success = function (now, mode) {
      mode = mode || 'tap';
      if (RF.mic) RF.mic.stop();
      const w = F.cur;
      const first = F.tries === 0 && !F.help && !F.revealed;
      let amount = payout(mode);
      let mega = false;
      F.guesses = [];
      F.streak = first ? F.streak + 1 : 0;
      if (F.streak >= cfg.megaPips) { mega = true; amount += cfg.mega; F.streak = 0; }
      RF.metrics.attempt({
        battle: L.id, w: w.w, kind: w.kind, pattern: 'cvc-' + w.w[1], mode: mode,
        tries: F.tries + 1, help: F.help, revealed: F.revealed, ms: Math.round(now - F.shownAt), check: mode === 'speak' ? F.engine : undefined
      });
      F.stats.forged++;
      if (first) F.stats.firstTry++;
      if (F.help) F.stats.help++;
      if (w.kind === 'rune') { F.stats.runes++; if (first) F.stats.runeFirst++; }
      const pat = 'cvc-' + w.w[1];
      const bp = F.stats.byPat[pat] = F.stats.byPat[pat] || { n: 0, first: 0 };
      bp.n++; if (first) bp.first++;
      if (!first && F.stats.practice.indexOf(w.w) < 0) F.stats.practice.push(w.w);
      if (opts.onRead) opts.onRead();
      F.stats.crystals += amount;
      const how = F.revealed ? 'forge.r.shown' : F.tries > 0 ? 'forge.r.second' : F.help ? 'forge.r.heard' : w.kind === 'rune' ? 'forge.r.rune' : mode === 'speak' ? 'forge.r.said' : 'forge.r.first';
      F.recent.unshift({ w: w.w, how: how, amount: amount });
      renderRecent();
      if (!mega) RF.sfx(first ? 'hit' : 'select');
      opts.onPay(amount, forgeBtn);

      // Spanish meaning and cognate, for real words with Spanish on.
      let extra = null;
      if (RF.lang() === 'es' && w.kind === 'real' && w.es) {
        extra = D.el('div', 'line');
        extra.appendChild(D.speaker(function () { RF.speakSeq([{ word: w.w }, { es: w.es }]); }, true));
        D.el('span', 'txt', '<b class="gold read">' + D.esc(w.w) + '</b> &rarr; ' + D.esc(w.es), extra);
        if (w.cognate) {
          const c = D.el('div');
          c.appendChild(extra);
          D.line('battle.cognate', '', c).querySelector('.txt').style.color = '#9cf2c0';
          extra = c;
        }
        RF.metrics.support('glossary');
      }
      let id, speakIt = false;
      if (mega) { id = 'forge.mega'; speakIt = true; }
      else if (F.revealed) id = 'forge.shown';
      else if (F.tries > 0) id = 'forge.second';
      else if (F.help) id = 'forge.help';
      else if (F.streak === 3) { id = 'battle.streak3'; speakIt = true; }
      else if (F.streak === 5) { id = 'battle.streak5'; speakIt = true; }
      else if (w.kind === 'rune') id = 'battle.runeHit';
      else id = 'forge.good' + (1 + Math.floor(Math.random() * 4));
      // Test mode: show what the checker heard on a match too.
      const note = extra || F.matchNote;
      F.matchNote = null;
      say(id, speakIt && !extra, note);
      if (extra && !mega) RF.speakSeq([{ word: w.w }, { es: w.es }]);
      if (mega && opts.onMega) opts.onMega();
      renderStreak();
      F.next();
    };

    // Guessing guard (same rule as Mr. Scott's other games): 3 wrong in a row that are all very fast,
    // or all on the same button. The forge cools down for a few seconds. Correct answers are never flagged.
    F.overheat = function () {
      F.overheats++;
      F.guesses = [];
      const secs = F.overheats === 1 ? cfg.cooldownFirst : cfg.cooldownLater;
      F.heatUntil = performance.now() + secs * 1000;
      F.heatShowing = true;
      D.clear(heat);
      heat.classList.add('show');
      D.line('forge.overheat', '', heat).querySelector('.txt').style.fontSize = 'calc(22px * var(--ts))';
      const hb = D.el('div', 'hb', '<i></i>', heat);
      RF.speak('forge.overheat');
      RF.metrics.support('overheat');
      const start = performance.now();
      const tick = setInterval(function () {
        const f = Math.min(1, (performance.now() - start) / (secs * 1000));
        hb.firstChild.style.width = (100 - f * 100) + '%';
        if (f >= 1) { clearInterval(tick); heat.classList.remove('show'); F.heatShowing = false; F.lastAction = performance.now(); }
      }, 100);
    };

    F.key = function (ev) {
      if (F.ruleUp) {
        if ((ev.key === 'Enter' || ev.key === ' ') && F.closeRule) F.closeRule();
        return true;
      }
      if (ev.key === '1' || ev.key === '2' || ev.key === '3') { F.pick(+ev.key - 1); return true; }
      if (ev.key === 'f' || ev.key === 'F') { F.forge(); return true; }
      if (ev.key === 'm' || ev.key === 'M') { F.listen(); return true; }
      if (ev.key === 'h' || ev.key === 'H') { F.hearWord(); return true; }
      if (ev.key === 'Enter') {
        const a = document.activeElement;
        if (a && a.tagName === 'BUTTON' && !a.classList.contains('opt')) return false;
        F.forge(); return true;
      }
      return false;
    };
    F.state = function () { return { stats: F.stats, streak: F.streak, recent: F.recent, overheats: F.overheats }; };
    F.destroy = function () { document.querySelectorAll('.ruleShade').forEach(function (e) { e.remove(); }); F.ruleUp = false; if (RF.mic) RF.mic.stop(); if (RF.audio) RF.audio.duck(0); if (opts.onHold) opts.onHold(false); if (root.parentNode) root.parentNode.removeChild(root); };

    // ---- Story mode (World 8, DESIGN.md section 7 "Final level preview") ----
    // A story card to read (every word can be tapped), then a question with three answers.
    // Right on the first try with no help pays more. Wrong answers never cost crystals. When the
    // battle tells the Forge, the Rift Seal passage and its two questions replace the cards until
    // they are answered. Tap mode only for now.
    function storyMode() {
      const W8 = RF.data.world8 || {};
      const cards = W8.cards || [];
      const seal = W8.seal;
      const R = opts.restore;
      F.stats = (R && R.stats && R.stats.byType) ? R.stats : { forged: 0, firstTry: 0, crystals: 0, help: 0, misses: 0, runes: 0, runeFirst: 0, byPat: {}, practice: [], cards: 0, cardsFirst: 0, cardsHelp: 0, byType: {}, sealDone: false, sealFirstTry: 0, sealMisses: 0, aloud: 0, aloudWords: 0, aloudRight: 0, aloudMs: 0, aloudCrystals: 0, sealRead: null, aloudMissed: [] };
      if (F.stats.aloud == null) Object.assign(F.stats, { aloud: 0, aloudWords: 0, aloudRight: 0, aloudMs: 0, aloudCrystals: 0, sealRead: null, aloudMissed: [] });
      F.idx = 0; F.view = 'card'; F.sealPending = false; F.sealQ = 0; F.sealHelp = false; F.sealFirst = 0;
      F.tries = 0; F.sealTries = 0; F.help = false; F.out = {}; F.glow = false;
      F.read = null; F.reading = null; F.sealReads = [];
      if (R && R.story) { F.idx = R.story.idx; F.view = R.story.view; F.sealPending = R.story.sealPending; F.sealQ = R.story.sealQ; F.sealHelp = R.story.sealHelp; F.sealFirst = R.story.sealFirst; F.read = R.story.read || null; F.sealReads = R.story.sealReads || []; }
      F.showEs = RF.lang() === 'es';
      F.busy = false;
      [wordBox, prompt, micBtn, optsRow, forgeBtn, recent].forEach(function (e) { e.style.display = 'none'; });
      const sbox = D.el('div', null, null, root);
      F.sbox = sbox;
      sbox.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      root.insertBefore(sbox, msg);
      let payEl = null;

      function strip(tok) {
        const m = /^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/.exec(tok);
        return { lead: m[1], core: m[2], trail: m[3] };
      }
      // Fill host with the text, each word a tappable span (punctuation stripped for the lookup).
      function words(text, host, onHear, collect) {
        text.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { host.appendChild(document.createTextNode(' ')); return; }
          const p = strip(tok);
          if (!p.core) { host.appendChild(document.createTextNode(tok)); return; }
          if (p.lead) host.appendChild(document.createTextNode(p.lead));
          const sp = D.el('span', 'sw', D.esc(p.core), host);
          if (collect) collect.push(sp);
          sp.addEventListener('click', function (ev) {
            ev.stopPropagation();
            RF.speakWord(p.core.toLowerCase());
            sp.classList.add('on');
            setTimeout(function () { sp.classList.remove('on'); }, 600);
            onHear();
          });
          if (p.trail) host.appendChild(document.createTextNode(p.trail));
        });
      }
      function spk(parent, fn) { const b = D.speaker(fn, true); parent.appendChild(b); return b; }
      function esSpeak(text) { RF.speakSeq([{ es: text }]); }

      function isSeal() { return F.view === 'seal'; }
      function curCard() { return cards[F.idx % cards.length]; }
      function curQ() { return isSeal() ? seal.questions[F.sealQ] : curCard(); }
      function helped() { return isSeal() ? F.sealHelp : F.help; }
      function triesNow() { return isSeal() ? F.sealTries : F.tries; }
      function markHelp() {
        if (helped()) return;
        if (isSeal()) F.sealHelp = true; else F.help = true;
        RF.metrics.support('hearWord');
        updatePay();
      }
      function payNow() { return (F.tries > 0 || F.help) ? cfg.storyHelp : cfg.storyRight; }
      function updatePay() {
        if (!payEl || isSeal()) return;
        payEl.innerHTML = D.CRYSTAL(18) + ' +' + payNow();
      }

      function draw() {
        D.clear(sbox);
        const seal_ = isSeal();
        const text = seal_ ? seal.text : curCard().text;
        const es = seal_ ? seal.es : curCard().es;
        const q = curQ();
        const sc = D.el('div', 'scard' + (seal_ ? ' seal' : ''), null, sbox);
        const bar = D.el('div', 'sbar', null, sc);
        spk(bar, function () { markHelp(); RF.speakWord(text); }).title = RF.t('story.hearCard');
        D.el('div', 'lbl', D.esc(seal_ ? RF.t('seal.title').toUpperCase() : RF.t('story.card') + ' ' + ((F.idx % cards.length) + 1) + '/' + cards.length), bar);
        payEl = null;
        if (!seal_) { payEl = D.el('div', 'pay', null, bar); updatePay(); }
        const esBtn = D.el('button', 'btn', D.esc(RF.t(F.showEs ? 'story.english' : 'story.spanish')), bar);
        esBtn.style.cssText = 'font-size:calc(14px * var(--ts));padding:4px 10px';
        esBtn.addEventListener('click', function () { F.showEs = !F.showEs; RF.metrics.support('glossary'); RF.sfx('tap'); draw(); });
        const t2 = D.el('div', 'txt2', null, sc);
        t2.title = RF.t('story.tapWords');
        F.sentSpans = splitSentences(text).map(function (sen, k) {
          const box = D.el('span', 'sen', null, t2);
          if (k) t2.insertBefore(document.createTextNode(' '), box);
          const arr = []; words(sen, box, markHelp, arr); return arr;
        });
        F.readBox = D.el('div', 'aloud', null, sc);
        drawRead();
        const esBox = D.el('div', 'es' + (F.showEs ? ' show' : ''), null, sc);
        if (es) {
          spk(esBox, function () { esSpeak(es); });
          D.el('span', null, ' ' + D.esc(es), esBox);
        }

        // Question
        const qr = D.el('div', 'sq', null, sbox);
        spk(qr, function () { markHelp(); RF.speakWord(q.q); }).title = RF.t('story.hearQuestion');
        const qt = D.el('div', 'qt', null, qr);
        words(q.q, qt, markHelp);
        if (F.showEs && q.qEs) {
          const qe = D.el('div', null, D.esc(q.qEs), sbox);
          qe.style.cssText = 'font-family:var(--rf);font-size:calc(16px * var(--ts));color:#9cf2c0;margin-top:-4px';
        }
        if (seal_ && F.sealQ > 0) setTimeout(function () { qr.scrollIntoView({ block: 'nearest' }); }, 0);
        // Answers
        F.ansEls = q.choices.map(function (ch, i) {
          const row = D.el('div', 'sa', null, sbox);
          spk(row, function () { markHelp(); RF.speakWord(ch); }).title = RF.t('story.hearAnswer');
          const b = D.el('button', 'sopt' + (F.out[i] ? ' out' : '') + (F.glow && i === q.a ? ' glow' : ''), D.esc(ch), row);
          b.dataset.i = String(i);
          if (F.out[i] || F.reading) b.disabled = true;
          if (F.showEs && q.choicesEs && q.choicesEs[i]) {
            const e2 = D.el('div', null, D.esc(q.choicesEs[i]), b);
            e2.style.cssText = 'font-size:calc(14px * var(--ts));color:#9cf2c0;font-weight:400;margin-top:2px';
          }
          b.addEventListener('click', function () { F.answer(i, b); });
          return b;
        });
        markSpans();
        lightLine();
      }

      // ---- Read aloud (Session 14, DESIGN.md 7) ----
      // Optional: the student reads the card or the Seal out loud, one sentence at a time. Every word
      // is marked read right or missed (missed words turn gold and can be tapped to hear). A card read
      // aloud pays a bonus by accuracy; time never lowers a reward. The Seal read aloud gives words
      // correct per minute, and the rift holds still while it is read. The Seal can be read again.
      function splitSentences(text) {
        const m = String(text).match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [text];
        return m.map(function (x) { return x.trim(); }).filter(Boolean);
      }
      const PC = function () { return (RF.data.speech && RF.data.speech.passage) || {}; };
      function canAloud() { return RF.mic && RF.mic.canReadAloud && RF.mic.canReadAloud(); }
      function markSpans() {
        // Show the last result on the words: right words plain, missed words gold and underlined.
        if (!F.read || !F.sentSpans) return;
        F.read.sentences.forEach(function (sen, si) {
          sen.forEach(function (w, wi) {
            const sp = F.sentSpans[si] && F.sentSpans[si][wi];
            if (!sp) return;
            sp.classList.add(w.ok ? 'rok' : 'rmiss');
            // Test mode only: the score each word got, right on the word (Mr. Scott, Session 15).
            // A number is Azure's 0 to 100 score, "skip" means Azure heard no word there,
            // "C" means Chrome scored it (Azure was not used). Students never see this.
            if (!RF.unlocks.testMode()) return;
            const old = sp.querySelector('.tscore'); if (old) old.remove();
            const tag = (w.acc != null ? String(w.acc) : w.err === 'Omission' ? 'skip' : w.by === 'chrome' ? 'C' : '?') + (w.vmiss ? ' ' + w.vmiss : '');
            const b = D.el('span', 'tscore', D.esc(tag), sp);
            b.title = (w.err || '') + (w.acc != null ? ' ' + w.acc : '');
            b.style.cssText = 'font-family:Lexend,sans-serif;font-size:11px;font-weight:700;letter-spacing:0;vertical-align:super;margin-left:2px;padding:0 3px;border-radius:4px;color:#10101e;background:' + (w.ok ? '#7dff9c' : '#ff8a8a');
          });
        });
      }
      function drawRead() {
        const box = F.readBox; if (!box) return;
        D.clear(box);
        const seal_ = isSeal();
        if (F.reading) {
          const row = D.el('div', 'arow', null, box);
          const lis = D.el('div', 'alis', D.MIC + '<span>' + D.esc(RF.t('read.listening')) + '</span>', row);
          lis.title = RF.t('read.listening');
          const nx = D.el('button', 'btn anext', D.esc(RF.t(F.readLine >= F.sentSpans.length - 1 ? 'read.done' : 'read.next')), row);
          nx.addEventListener('click', function () { if (F.reading) F.reading.next(); });
          const stop = D.el('button', 'btn astop', '&#10005;', row);
          stop.title = RF.t('read.stop');
          stop.addEventListener('click', function () { cancelRead(); });
          return;
        }
        if (F.checking) { D.line('read.checking', '', box); return; }
        if (F.read) {
          const r = F.read;
          const row = D.el('div', 'arow', null, box);
          const parts = [D.num(r.correct), { id: 'res.of' }, D.num(r.total), { id: 'read.wordsRight' }];
          if (seal_) parts.push({ id: 'read.wcpm' }, D.num(r.wcpm));
          const html = '<b class="cyan">' + r.correct + '</b> ' + D.esc(RF.t('res.of')) + ' ' + r.total + ' ' + D.esc(RF.t('read.wordsRight')) +
            (seal_ ? ' &nbsp; <b class="gold" style="font-size:calc(22px * var(--ts))">' + r.wcpm + '</b> ' + D.esc(RF.t('read.wcpm')) : '') +
            (!seal_ && r.bonus ? ' &nbsp; ' + D.CRYSTAL(16) + ' <span class="cyan">+' + r.bonus + '</span>' : '');
          D.lineParts(parts, '', row, html).querySelector('.txt').style.cssText = 'font-size:calc(15px * var(--ts));color:#e6e9ff';
          if (seal_ && r.best) D.line('read.best', '', box).querySelector('.txt').style.cssText = 'color:#ffd76a;font-weight:700;font-size:calc(15px * var(--ts))';
          else if (seal_ && r.bestWcpm) D.lineParts([{ id: 'read.bestWas' }, D.num(r.bestWcpm)], '', box, D.esc(RF.t('read.bestWas')) + ': <b class="gold">' + r.bestWcpm + '</b>').querySelector('.txt').style.cssText = 'color:#c9c3ff;font-size:calc(14px * var(--ts))';
          if (r.correct < r.total) D.line('read.tapGold', '', box).querySelector('.txt').style.cssText = 'color:#ffd76a;font-size:calc(13px * var(--ts))';
          if (RF.unlocks.testMode() && r.diag) D.el('div', null, D.esc(r.diag) + '<br>' + D.esc('Test mode: each word shows its score. Green counted right, red missed. A word Azure flags needs ' + (((RF.data.speech || {}).passage || {}).wordMin || 50) + ' or more, and every vowel must sound right (ɪ>aɪ means a short i sounded like a long i); skip = no word heard, C = scored by Chrome.'), box).style.cssText = 'font-size:12px;color:#ffb060';
          if (seal_ && canAloud()) {
            const again = D.el('button', 'btn abtn', D.MIC + '<span>' + D.esc(RF.t('read.again')) + '</span>', box);
            again.addEventListener('click', function () { startRead(); });
          }
          return;
        }
        if (!canAloud()) return;
        const b = D.el('button', 'btn abtn', D.MIC + '<span>' + D.esc(RF.t(seal_ ? 'read.sealBtn' : 'read.btn')) + '</span>' +
          (seal_ ? '' : ' ' + D.CRYSTAL(18) + ' +' + (PC().bonusFull || 15)), box);
        b.addEventListener('click', function () { startRead(); });
      }
      function cancelRead() {
        if (!F.reading && !F.checking) return;
        const r = F.reading; F.reading = null; F.checking = false;
        if (r) r.stop();
        if (RF.audio) RF.audio.duck(0);
        if (isSeal() && opts.onHold) opts.onHold(false);
        draw();
      }
      function startRead() {
        if (F.reading || F.checking) return;
        const seal_ = isSeal();
        const text = seal_ ? seal.text : curCard().text;
        const sents = splitSentences(text);
        F.read = null;
        F.readLine = 0;
        RF.stopSpeaking && RF.stopSpeaking();
        RF.sfx('tap');
        if (seal_ && opts.onHold) opts.onHold(true);
        F.reading = RF.mic.readPassage(sents, {
          onListening: function () {},
          onSentence: function (si) { F.readLine = si; lightLine(); drawRead(); },
          onWord: function (si, wi) { const sp = F.sentSpans[si] && F.sentSpans[si][wi]; if (sp) sp.classList.add('heard'); },
          onChecking: function () { if (!F.reading) return; F.reading = null; F.checking = true; lightLine(); drawRead(); },
          onDone: function (res) { readDone(res, seal_); }
        });
        draw();
        lightLine();
        say(seal_ ? 'read.sealGo' : 'read.go', false);
      }
      function lightLine() {
        if (!F.sentSpans) return;
        const lines = F.sbox ? F.sbox.querySelectorAll('.sen') : [];
        lines.forEach(function (el, k) { el.classList.toggle('cur', !!F.reading && k === F.readLine); el.classList.toggle('dim', !!F.reading && k !== F.readLine); });
      }
      function readDone(res, seal_) {
        if (!F.reading && !F.checking) return; // cancelled
        F.reading = null; F.checking = false;
        if (RF.audio) RF.audio.duck(0);
        if (!res.ok) {
          F.checking = false;
          if (seal_ && opts.onHold) opts.onHold(false);
          draw();
          say('read.micDown', true);
          return;
        }
        const st = F.stats, pc = PC();
        const pct = res.total ? res.correct / res.total * 100 : 0;
        const missed = [];
        res.sentences.forEach(function (sen) { sen.forEach(function (w) { if (!w.ok && missed.indexOf(w.w) < 0) missed.push(w.w); }); });
        st.aloudMissed = (st.aloudMissed || []).concat(missed.filter(function (w) { return st.aloudMissed.indexOf(w) < 0; })).slice(0, 30);
        RF.metrics.support('speakMode');
        if (seal_) {
          const prevBest = RF.metrics.fluencyBest('seal');
          RF.metrics.fluency({ battle: L.id, passage: 'seal', correct: res.correct, total: res.total, ms: res.ms, wcpm: res.wcpm, engine: res.engine });
          F.read = Object.assign({}, res, { best: res.wcpm > prevBest && res.correct > 0, bestWcpm: Math.max(prevBest, res.wcpm) });
          F.sealReads.push({ wcpm: res.wcpm, correct: res.correct, total: res.total, ms: res.ms });
          const best = F.sealReads.reduce(function (a, b) { return !a || b.wcpm > a.wcpm ? b : a; }, null);
          st.sealRead = { tries: F.sealReads.length, first: F.sealReads[0], best: best, last: res, allBest: F.read.bestWcpm };
          if (opts.onHold) opts.onHold(false);
          draw(); markSpans();
          if (pct >= (pc.fullPct || 90) && F.sealReads.length === 1 && opts.onMega) opts.onMega();
          say(F.read.best ? 'read.best' : pct >= (pc.fullPct || 90) ? 'read.great' : 'read.sealAfter', true);
          return;
        }
        const bonus = pct >= (pc.fullPct || 90) ? (pc.bonusFull || 15) : pct >= (pc.partPct || 75) ? (pc.bonusPart || 8) : 0;
        st.aloud++; st.aloudWords += res.total; st.aloudRight += res.correct; st.aloudMs += res.ms; st.aloudCrystals += bonus;
        RF.metrics.fluency({ battle: L.id, passage: curCard().id, correct: res.correct, total: res.total, ms: res.ms, wcpm: res.wcpm, engine: res.engine });
        F.read = Object.assign({}, res, { bonus: bonus });
        draw(); markSpans();
        if (bonus) { st.crystals += bonus; opts.onPay(bonus, F.readBox); RF.sfx('hit'); }
        say(bonus === (pc.bonusFull || 15) ? 'read.great' : bonus ? 'read.good' : 'read.try', false);
      }

      function resetQ() { F.tries = 0; F.sealTries = 0; F.out = {}; F.glow = false; F.shownAt = performance.now(); }
      function showCard() {
        F.view = 'card';
        F.cur = curCard();
        F.help = false;
        F.read = null;
        resetQ();
        draw();
      }
      function showSeal(fresh) {
        F.view = 'seal';
        F.sealPending = false;
        if (fresh) { F.sealQ = 0; F.sealHelp = false; F.sealFirst = 0; F.read = null; }
        resetQ();
        draw();
        if (fresh) say('seal.start', true);
      }
      F.next = function () {
        if (F.sealPending && !F.stats.sealDone && seal) return showSeal(true);
        showCard();
      };

      // The battle calls this once the Story lock is full and enough waves have started.
      F.startSeal = function () {
        if (F.stats.sealDone || !seal || F.view === 'seal' || F.sealPending) return;
        F.sealPending = true;
        const idle = F.tries === 0 && !F.help;
        if (!F.busy && idle) showSeal(true);
      };

      F.answer = function (i, btn) {
        const q = curQ();
        if (F.out[i] || F.reading) return;
        if (i === q.a) return isSeal() ? sealRight() : cardRight(btn);
        // Missed: no lost crystals. Mark it, shake it, keep the card.
        if (isSeal()) { F.sealTries++; F.stats.sealMisses++; } else { F.tries++; F.stats.misses++; }
        F.out[i] = true;
        btn.classList.add('out', 'shake');
        btn.disabled = true;
        RF.sfx('soft');
        if (triesNow() >= 2) { F.glow = true; F.ansEls[q.a].classList.add('glow'); }
        if (!isSeal()) updatePay();
        say(isSeal() ? 'seal.miss' : 'story.miss', true);
      };

      function cardRight(btn) {
        const c = curCard();
        const first = F.tries === 0 && !F.help;
        let amount = first ? cfg.storyRight : cfg.storyHelp;
        let mega = false;
        F.busy = true;
        F.streak = first ? F.streak + 1 : 0;
        if (F.streak >= cfg.megaPips) { mega = true; amount += cfg.mega; F.streak = 0; }
        RF.metrics.storyCard({ battle: L.id, id: c.id, type: c.type, tries: F.tries + 1, help: F.help });
        const st = F.stats;
        st.cards++; st.forged++;
        if (first) { st.cardsFirst++; st.firstTry++; }
        if (F.help) { st.cardsHelp++; st.help++; }
        const bt = st.byType[c.type] = st.byType[c.type] || { n: 0, first: 0 };
        bt.n++; if (first) bt.first++;
        st.crystals += amount;
        if (opts.onRead) opts.onRead();
        if (!mega) RF.sfx(first ? 'hit' : 'select');
        opts.onPay(amount, btn);
        let id, speakIt = false;
        if (mega) { id = 'forge.mega'; speakIt = true; }
        else if (F.tries > 0) id = 'story.second';
        else if (F.help) id = 'story.help';
        else if (F.streak === 3) { id = 'battle.streak3'; speakIt = true; }
        else if (F.streak === 5) { id = 'battle.streak5'; speakIt = true; }
        else id = 'forge.good' + (1 + Math.floor(Math.random() * 4));
        say(id, speakIt);
        if (mega && opts.onMega) opts.onMega();
        renderStreak();
        F.idx++;
        F.busy = false;
        F.next();
      }

      function sealRight() {
        if (F.sealTries === 0 && !F.sealHelp) F.sealFirst++;
        RF.sfx('select');
        F.sealQ++;
        if (F.sealQ < seal.questions.length) { resetQ(); draw(); say('seal.next', true); return; }
        F.stats.sealDone = true;
        F.stats.sealFirstTry = F.sealFirst;
        RF.metrics.sealDone({ battle: L.id, firstTry: F.sealFirst });
        F.sealPending = false;
        if (opts.onSeal) opts.onSeal();
        F.next();
        say('seal.doneFx', false);
      }

      F.key = function (ev) {
        if (ev.key === '1' || ev.key === '2' || ev.key === '3') {
          const b = F.ansEls && F.ansEls[+ev.key - 1];
          if (b && !b.disabled) F.answer(+ev.key - 1, b);
          return true;
        }
        if ((ev.key === 'r' || ev.key === 'R' || ev.key === 'm' || ev.key === 'M') && !F.reading && canAloud() && (!F.read || isSeal())) { startRead(); return true; }
        if ((ev.key === 'n' || ev.key === 'N' || ev.key === 'Enter') && F.reading) { F.reading.next(); return true; }
        if (ev.key === 'Escape' && F.reading) { cancelRead(); return true; }
        if (ev.key === 'h' || ev.key === 'H') { markHelp(); RF.speakWord(isSeal() ? seal.text : curCard().text); return true; }
        return false;
      };
      F.state = function () {
        return { stats: F.stats, streak: F.streak, recent: F.recent, overheats: F.overheats,
          story: { idx: F.idx, view: F.view, sealPending: F.sealPending, sealQ: F.sealQ, sealHelp: F.sealHelp, sealFirst: F.sealFirst, read: F.read, sealReads: F.sealReads } };
      };

      if (R) { F.streak = R.streak; F.recent = R.recent; F.overheats = R.overheats; }
      renderStreak();
      if (R && R.story && R.story.view === 'seal' && !F.stats.sealDone && seal) { showSeal(false); }
      else F.next();
      say(canAloud() ? 'story.startSpeak' : 'story.start', false);
    }
    if (L.story) { storyMode(); return; }

    if (opts.restore) {
      F.stats = opts.restore.stats; F.streak = opts.restore.streak; F.recent = opts.restore.recent; F.overheats = opts.restore.overheats;
    }
    renderStreak();
    renderRecent();
    F.next();
    say(!micOn() ? 'forge.start' : speakFirst() > 0 ? 'forge.startSpeakFirst' : 'forge.startSpeak', false);
  };
})(window.RF);
