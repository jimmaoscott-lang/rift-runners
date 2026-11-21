// The Rune Forge: where the reading happens (DESIGN.md section 6). Tap mode.
// A word appears. Three speaker buttons each say a word: the real one and two with a different vowel.
// The student picks the one that matches and presses Forge. Every forge pays crystals right away.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // opts: { level, onPay(amount, fromEl), onMega() }
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
    function payout() {
      const base = F.cur.kind === 'rune' ? cfg.rune : cfg.real;
      if (F.revealed) return cfg.shown;
      if (F.tries > 0 || F.help) return Math.round(base * cfg.helpShare);
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
      F.sel = -1; F.tries = 0; F.help = false; F.revealed = false;
      F.shownAt = F.lastAction = performance.now();
      wordBox.classList.toggle('rune', w.kind === 'rune');
      runeTag.textContent = w.kind === 'rune' ? RF.t('forge.rune').toUpperCase() + ' · x2' : '';
      wordEl.className = 'w';
      wordEl.textContent = w.w;
      wordEl.onclick = function () { F.hearWord(); };
      D.clear(prompt);
      D.line(w.kind === 'rune' ? 'forge.whichRune' : 'forge.which', '', prompt);
      optEls.forEach(function (b) { b.className = 'opt'; b.disabled = false; });
      renderForgeBtn();
    };

    F.hearWord = function () {
      RF.speakWord(F.cur.w);
      if (!F.help) { F.help = true; RF.metrics.support('hearWord'); renderForgeBtn(); }
    };

    F.pick = function (i) {
      if (performance.now() < F.heatUntil) return;
      const b = optEls[i];
      if (b.disabled) return;
      F.sel = i;
      optEls.forEach(function (o, k) { o.classList.toggle('sel', k === i); });
      RF.speakWord(F.choices[i].w);
    };

    F.forge = function () {
      if (performance.now() < F.heatUntil) return;
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
        wordEl.className = 'tiles';
        wordEl.innerHTML = F.cur.w.split('').map(function (ch, k) { return '<span class="' + (k === 1 ? 'v' : '') + '">' + D.esc(ch) + '</span>'; }).join('');
        if (!F.heatShowing) say('battle.breakUp', true);
      } else {
        F.revealed = true;
        optEls.forEach(function (o, k) { if (F.choices[k].ok) o.classList.add('glow'); });
        if (!F.heatShowing) say('forge.reveal', true);
      }
      renderForgeBtn();
    };

    F.success = function (now) {
      const w = F.cur;
      const first = F.tries === 0 && !F.help && !F.revealed;
      let amount = payout();
      let mega = false;
      F.guesses = [];
      F.streak = first ? F.streak + 1 : 0;
      if (F.streak >= cfg.megaPips) { mega = true; amount += cfg.mega; F.streak = 0; }
      RF.metrics.attempt({
        battle: L.id, w: w.w, kind: w.kind, pattern: 'cvc-' + w.w[1], mode: 'tap',
        tries: F.tries + 1, help: F.help, revealed: F.revealed, ms: Math.round(now - F.shownAt)
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
      const how = F.revealed ? 'forge.r.shown' : F.tries > 0 ? 'forge.r.second' : F.help ? 'forge.r.heard' : w.kind === 'rune' ? 'forge.r.rune' : 'forge.r.first';
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
      say(id, speakIt && !extra, extra);
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
      if (ev.key === '1' || ev.key === '2' || ev.key === '3') { F.pick(+ev.key - 1); return true; }
      if (ev.key === 'f' || ev.key === 'F') { F.forge(); return true; }
      if (ev.key === 'h' || ev.key === 'H') { F.hearWord(); return true; }
      if (ev.key === 'Enter') {
        const a = document.activeElement;
        if (a && a.tagName === 'BUTTON' && !a.classList.contains('opt')) return false;
        F.forge(); return true;
      }
      return false;
    };
    F.state = function () { return { stats: F.stats, streak: F.streak, recent: F.recent, overheats: F.overheats }; };
    F.destroy = function () { if (root.parentNode) root.parentNode.removeChild(root); };

    if (opts.restore) {
      F.stats = opts.restore.stats; F.streak = opts.restore.streak; F.recent = opts.restore.recent; F.overheats = opts.restore.overheats;
    }
    renderStreak();
    renderRecent();
    F.next();
    say('forge.start', false);
  };
})(window.RF);
