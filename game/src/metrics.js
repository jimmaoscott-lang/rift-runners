// Progress record, saved only on this device (DESIGN.md sections 11 and 12.2).
// Nothing here is sent anywhere yet. Teacher reports (M9) will read this record.
// No names: the record holds game data only.
window.RF = window.RF || {};
(function (RF) {
  const KEY = 'riftrunners.metrics.v1';
  const SESSION_GAP_MS = 30 * 60 * 1000; // a new play session starts after 30 minutes away
  const MAX_ATTEMPTS = 3000;

  function blank() {
    return {
      version: 1,
      firstPlayed: null,
      sessions: [],   // { start, end }
      attempts: [],   // one per battle word, see attempt()
      words: {},      // word -> { seen, firstTry, misses, last }
      battles: [],    // one per finished battle
      support: { hearWord: 0, glossary: 0, spanishOn: 0, tapMode: 0, speakMode: 0 },
      totals: { wordsRead: 0, firstTry: 0 }
    };
  }

  let data = blank();
  const M = {};
  RF.metrics = M;

  M.load = function () {
    try {
      const saved = JSON.parse(RF.store.get(KEY) || 'null');
      data = saved && saved.version === 1 ? Object.assign(blank(), saved) : blank();
    } catch (e) {
      data = blank();
    }
    return data;
  };
  M.save = function () {
    try { RF.store.set(KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
  };
  M.data = function () { return data; };

  // Call once when the game opens, and again as play goes on.
  M.touch = function () {
    const now = Date.now();
    if (!data.firstPlayed) data.firstPlayed = new Date(now).toISOString();
    const last = data.sessions[data.sessions.length - 1];
    if (!last || now - Date.parse(last.end) > SESSION_GAP_MS) {
      data.sessions.push({ start: new Date(now).toISOString(), end: new Date(now).toISOString() });
    } else {
      last.end = new Date(now).toISOString();
    }
  };

  M.support = function (kind) {
    data.support[kind] = (data.support[kind] || 0) + 1;
    M.save();
  };

  // rec: { battle, w, kind ('real' or 'rune'), pattern, mode, tries, help, revealed, ms }
  M.attempt = function (rec) {
    M.touch();
    const firstTry = rec.tries === 1 && !rec.help;
    const entry = Object.assign({ t: new Date().toISOString(), firstTry: firstTry }, rec);
    data.attempts.push(entry);
    if (data.attempts.length > MAX_ATTEMPTS) data.attempts.splice(0, data.attempts.length - MAX_ATTEMPTS);
    const ws = data.words[rec.w] || { seen: 0, firstTry: 0, misses: 0, last: null, recent: [] };
    ws.seen++;
    if (firstTry) ws.firstTry++;
    ws.misses += rec.tries - 1;
    ws.last = entry.t;
    ws.recent = (ws.recent || []).concat(firstTry ? 1 : 0).slice(-5);
    data.words[rec.w] = ws;
    data.totals.wordsRead++;
    if (firstTry) data.totals.firstTry++;
    if (rec.mode === 'tap') data.support.tapMode++;
    M.save();
    return entry;
  };

  // rec: { id, words, firstTry, misses, help, ms }
  M.battleDone = function (rec) {
    M.touch();
    const replay = data.battles.filter(function (b) { return b.id === rec.id; }).length;
    data.battles.push(Object.assign({ t: new Date().toISOString(), replay: replay }, rec));
    M.save();
  };

  // How much a word should be picked next: new and missed words come up more,
  // words read cleanly several times still appear now and then (DESIGN.md 5.1).
  M.weight = function (word) {
    const ws = data.words[word];
    if (!ws) return 3;
    const recent = ws.recent || [];
    const recentMiss = recent.length ? recent.filter(function (x) { return x === 0; }).length / recent.length : 0;
    const mastered = recent.length >= 3 && recentMiss === 0;
    return mastered ? 0.6 : 1 + recentMiss * 4;
  };

  // For testing in the browser console: RF.metrics.data()
})(window.RF);
