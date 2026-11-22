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
      totals: { wordsRead: 0, firstTry: 0 },
      cards: {},      // story card id -> { seen, firstTry, misses, last } (World 8 story mode)
      cardLog: [],    // one per answered story card: { id, type, first, t }, newest last
      seal: { done: 0, firstTry: 0, last: null },
      fluency: []     // one per passage read aloud: { t, battle, passage, correct, total, ms, wcpm, engine }
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
    if (rec.mode === 'speak') data.support.speakMode++;
    M.save();
    return entry;
  };

  // Story cards (World 8). rec: { battle, id, type, tries, help }. first = right on the first try with no help.
  // Kept apart from words so story reading never changes which words come up in word levels.
  M.storyCard = function (rec) {
    M.touch();
    const first = rec.tries === 1 && !rec.help;
    const t = new Date().toISOString();
    const c = data.cards[rec.id] || { seen: 0, firstTry: 0, misses: 0, last: null };
    c.seen++;
    if (first) c.firstTry++;
    c.misses += rec.tries - 1;
    c.last = t;
    data.cards[rec.id] = c;
    data.cardLog.push({ id: rec.id, type: rec.type, first: first, help: !!rec.help, t: t });
    if (data.cardLog.length > 500) data.cardLog.splice(0, data.cardLog.length - 500);
    M.save();
  };
  // The last n story cards, oldest first: true = right on the first try with no help. Counts every visit.
  M.storyRecent = function (n) {
    return data.cardLog.slice(-n).map(function (x) { return !!x.first; });
  };
  M.sealDone = function (rec) {
    M.touch();
    data.seal.done++;
    data.seal.firstTry += rec.firstTry || 0;
    data.seal.last = new Date().toISOString();
    M.save();
  };

  // Read aloud (World 8 cards and the Rift Seal, Session 14). passage is a card id or 'seal'.
  // The fluency line in teacher reports (M10) reads these. Words correct per minute only, no audio.
  M.fluency = function (rec) {
    M.touch();
    data.fluency = data.fluency || [];
    // Save how the read was scored with it, so the teacher report can say so (DESIGN.md 12.2).
    const pc = (RF.data && RF.data.speech && RF.data.speech.passage) || {};
    const how = { scoring: { wordMin: pc.wordMin != null ? pc.wordMin : 50, chromeRescue: !!pc.chromeRescue, rules: 'v2' } };
    data.fluency.push(Object.assign({ t: new Date().toISOString() }, how, rec));
    if (data.fluency.length > 1000) data.fluency.splice(0, data.fluency.length - 1000);
    M.save();
  };
  // Highest words correct per minute ever on this passage (0 if never read aloud).
  M.fluencyBest = function (passage) {
    return (data.fluency || []).reduce(function (b, f) { return f.passage === passage ? Math.max(b, f.wcpm || 0) : b; }, 0);
  };
  // Every read of this passage, oldest first.
  M.fluencyAll = function (passage) {
    return (data.fluency || []).filter(function (f) { return f.passage === passage; });
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

  // The last n reads of one pattern (like 'cvc-a'), oldest first: true = right on the first try with no help.
  // Used for rift locks (mastery). Counts every level and every visit, so progress carries over.
  M.patternRecent = function (pattern, n) {
    const out = [];
    for (let i = data.attempts.length - 1; i >= 0 && out.length < n; i--) {
      const a = data.attempts[i];
      if (a.pattern === pattern) out.unshift(!!a.firstTry);
    }
    return out;
  };
  // The first n reads ever of one pattern, oldest first (same true/false as patternRecent).
  // Used for the "Then and now" growth graph on the Level Clear screen.
  M.patternFirst = function (pattern, n) {
    const out = [];
    for (let i = 0; i < data.attempts.length && out.length < n; i++) {
      const a = data.attempts[i];
      if (a.pattern === pattern) out.push(!!a.firstTry);
    }
    return out;
  };
  M.patternCount = function (pattern) {
    return data.attempts.reduce(function (n, a) { return n + (a.pattern === pattern ? 1 : 0); }, 0);
  };

  // The most recent finished level record for this level id, if any.
  M.lastBattle = function (id) {
    for (let i = data.battles.length - 1; i >= 0; i--) if (data.battles[i].id === id) return data.battles[i];
    return null;
  };

  // For testing in the browser console: RF.metrics.data()
})(window.RF);
