// Page helpers for menus and the battle screen: elements, speaker buttons, read-aloud lines,
// settings styles, screen scaling and arrow-key movement between buttons.
window.RF = window.RF || {};
(function (RF) {
  const D = {};
  RF.dom = D;

  D.SPK = '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" stroke="#ffe9a8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  D.MIC = '<svg viewBox="0 0 24 24" width="26" height="26" style="flex:none"><rect x="8.5" y="2" width="7" height="12" rx="3.5" fill="#ffe9a8"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" stroke="#ffe9a8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  D.CRYSTAL = function (s) {
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" style="flex:none"><path d="M12 1l7 7-7 15L5 8z" fill="#7ef3ff"/><path d="M12 1l7 7h-14z" fill="#d9fbff"/><path d="M12 23L5 8h14z" fill="#3fc6e0" opacity=".7"/></svg>';
  };

  D.el = function (tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  D.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // A speaker button. onTap runs when it is pressed.
  D.speaker = function (onTap, small) {
    const b = D.el('button', 'spk' + (small ? ' sm' : ''), D.SPK);
    b.setAttribute('aria-label', 'Listen');
    b.addEventListener('click', function (ev) { ev.stopPropagation(); RF.sfx('tap'); onTap(); });
    return b;
  };
  // A line of text from strings.json with its own speaker.
  D.line = function (id, cls, parent) {
    const row = D.el('div', 'line ' + (cls || ''), null, parent);
    row.appendChild(D.speaker(function () { RF.speak(id); }, true));
    D.el('span', 'txt read', D.esc(RF.t(id)), row);
    return row;
  };
  // A line made of several pieces read in a row, like "Wave" + "3". parts: [{id}|{text}]
  D.lineParts = function (parts, cls, parent, html) {
    const row = D.el('div', 'line ' + (cls || ''), null, parent);
    row.appendChild(D.speaker(function () { RF.speakSeq(parts.filter(function (p) { return p.id || p.word || p.text != null; })); }, true));
    D.el('span', 'txt read', html || parts.map(function (p) { return D.esc(p.id ? RF.t(p.id) : p.word || p.text); }).join(' '), row);
    return row;
  };
  // A button with a speaker beside it. Returns { row, btn }.
  D.button = function (id, onClick, cls, parent, opts) {
    opts = opts || {};
    const row = D.el('div', 'line', null, parent);
    if (!opts.noSpeaker) row.appendChild(D.speaker(function () { RF.speak(id); }));
    const b = D.el('button', 'btn ' + (cls || ''), (opts.icon || '') + D.esc(RF.t(id)), row);
    b.addEventListener('click', function () { onClick(b); });
    return { row: row, btn: b };
  };

  // Settings that change how text looks: reading font, text size, reduced motion.
  D.applySettings = function () {
    const root = document.documentElement;
    root.style.setProperty('--rf', RF.settings.font === 'dyslexic' ? 'OpenDyslexic, Lexend, sans-serif' : 'Lexend, sans-serif');
    root.style.setProperty('--ts', String(RF.textScale()));
    document.body.classList.toggle('reduced', !!RF.settings.reducedMotion);
    document.documentElement.lang = RF.lang();
  };

  // The menus and battle panels are laid out for 1366 x 768 and shrink on smaller screens.
  D.scale = 1;
  D.fit = function () {
    const W = window.innerWidth, H = window.innerHeight;
    const s = Math.min(1, W / 1366, H / 768);
    D.scale = s;
    const ui = document.getElementById('ui');
    ui.style.width = (W / s) + 'px';
    ui.style.height = (H / s) + 'px';
    ui.style.transform = 'scale(' + s + ')';
  };

  // Arrow keys move between the buttons inside a box; Esc runs onEscape.
  let navBox = null, navEsc = null;
  D.nav = function (box, onEscape) {
    navBox = box; navEsc = onEscape || null;
    setTimeout(function () {
      const first = box && box.querySelector('[data-first]') || (box && box.querySelector('button.btn'));
      if (first) first.focus({ preventScroll: true });
    }, 30);
  };
  D.navOff = function (box) { if (!box || box === navBox) { navBox = null; navEsc = null; } };
  window.addEventListener('keydown', function (ev) {
    if (!navBox || !document.body.contains(navBox)) return;
    if (ev.key === 'Escape' && navEsc) { ev.preventDefault(); navEsc(); return; }
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(ev.key) < 0) return;
    const list = Array.prototype.filter.call(navBox.querySelectorAll('button'), function (b) { return !b.disabled && b.offsetParent; });
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    const step = (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') ? 1 : -1;
    const n = i < 0 ? 0 : (i + step + list.length) % list.length;
    list[n].focus();
    ev.preventDefault();
  });

  // A number to read aloud: a voiced file for 0 to 30, the backup voice above that.
  D.num = function (n) { return n >= 0 && n <= 30 && n === Math.round(n) ? { id: 'num.' + n } : { text: String(n) }; };
  D.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };
})(window.RF);
