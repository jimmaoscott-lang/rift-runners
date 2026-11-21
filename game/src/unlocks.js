// What the student has opened: levels, stars and defenders. Worked out from the progress
// record on this device (RF.metrics), so nothing extra is saved. DESIGN.md sections 4.1 and 6A.
window.RF = window.RF || {};
(function (RF) {
  const UN = {};
  RF.unlocks = UN;

  function battles() { return RF.metrics.data().battles || []; }

  // True if this level id has ever been won on this device.
  UN.won = function (levelId) {
    return battles().some(function (b) { return b.id === levelId && b.result === 'win'; });
  };
  // Best stars ever earned on a level (0 if never won).
  UN.bestStars = function (levelId) {
    return battles().reduce(function (m, b) { return b.id === levelId && b.result === 'win' ? Math.max(m, b.stars || 0) : m; }, 0);
  };
  // The map stones for this world, in order (levels-w1.json "map.stones").
  UN.stones = function () { return (RF.data.levels.map || {}).stones || []; };
  // A stone is open when it is the first one or the stone before it has been won.
  // Test mode (teacher settings): every level and defender is open, for trying any level.
  UN.testMode = function () { return !!RF.settings.testAll; };
  UN.stoneOpen = function (i) {
    if (UN.testMode()) return i < UN.stones().length;
    const st = UN.stones();
    return i === 0 || (i > 0 && !!st[i - 1] && UN.won(st[i - 1].id));
  };
  // Index into levels-w1.json "levels" for a stone, or -1 if that level is not built yet.
  UN.levelIndex = function (levelId) {
    return RF.data.levels.levels.findIndex(function (L) { return L.id === levelId; });
  };
  UN.totalStars = function () {
    return UN.stones().reduce(function (s, st) { return s + UN.bestStars(st.id); }, 0);
  };
  // A defender is ready to build when it has no unlock level, or that level has been won.
  // units.json: defenders[id].unlockBy = null or a level id like "w1-l1".
  UN.defenderOpen = function (id) {
    const d = RF.data.units.defenders[id];
    if (UN.testMode()) return !!d;
    return !!d && (!d.unlockBy || UN.won(d.unlockBy));
  };
  // What a first win of this level opens: the next stone and any defenders.
  UN.rewardsFor = function (levelId) {
    const out = { stone: null, defenders: [] };
    const st = UN.stones();
    const i = st.findIndex(function (s) { return s.id === levelId; });
    if (i >= 0 && st[i + 1]) out.stone = st[i + 1];
    const U = RF.data.units;
    Object.keys(U.defenders).forEach(function (id) { if (U.defenders[id].unlockBy === levelId) out.defenders.push(id); });
    return out;
  };
})(window.RF);
