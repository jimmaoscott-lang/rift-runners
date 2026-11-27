"""Balance runs with simulated players (DESIGN.md 6, "Waves from reading").

Opens the real game in headless Chrome and plays levels with a simulated reader and a
simple builder. The game's own battle code runs (creatures, defenders, waves, locks); only
the reading is simulated: each finished word or card pays what the Forge pays and is
reported to the battle the same way the Forge reports it. Game time runs much faster than
real time, so a 15 minute level takes a few seconds.

Usage (from the repo root):
  python3 tools/sim_balance.py                 # every level, every reader, 6 runs each
  python3 tools/sim_balance.py --levels 0 3 --runs 10
  python3 tools/sim_balance.py --override tune.json   # try level numbers without editing files
  python3 tools/sim_balance.py --history 20         # student arrives with 20 past reads per earlier vowel

tune.json, if given, is merged into each level by id: {"w1-l1": {"startCrystals": 90}}.
Extra keys: "_hp": [1.0, 1.3, ...] sets wave hp values, "_count": 1.2 scales group sizes,
and a top level "_forge": {"helpShare": 0.3} changes Forge pay for every level.

Readers (seconds per item are averages; each item varies by +-30%):
  strong     95% first try, speak mode in World 1, fast
  typical    80% first try, tap mode
  struggling 50% first try, tap mode, slow
"""
import argparse
import functools
import http.server
import json
import os
import statistics
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

READERS = {
    #            first-try, World 1 secs/word, World 8 secs/card, World 1 mode, Seal read secs
    "strong": dict(p=0.95, word=4.0, card=9.0, mode="speak", seal=60),
    "typical": dict(p=0.80, word=6.0, card=13.0, mode="tap", seal=90),
    "struggling": dict(p=0.50, word=8.5, card=18.0, mode="tap", seal=140),
}

SIM_JS = r"""
async (args) => {
  const { levelIndex, reader, seed, override, maxMinutes, keep, noPowers, history } = args;
  // Seeded random so runs repeat.
  let s = seed >>> 0 || 1;
  Math.random = function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const B = RF.battle;
  if (!window.__realUpdate) { window.__realUpdate = B.update; B.update = function () {}; }
  const step = window.__realUpdate;
  // Quiet: no speech or sound effects in the sim.
  RF.speakSeq = function () {}; RF.speak = function () {}; RF.sfx = function () {}; RF.speakWord = function () {};
  RF.audio.fx = function () {}; RF.audio.fxEvery = function () {}; RF.audio.music = function () {};
  RF.settings.reducedMotion = true; RF.settings.testAll = false;
  if (!keep) { RF.store.set('riftrunners.metrics.v1', 'null'); RF.metrics.load(); }
  const L0 = JSON.parse(JSON.stringify(window.__orig = window.__orig || RF.data.levels.levels.map(function (x) { return JSON.parse(JSON.stringify(x)); })))[levelIndex];
  RF.data.levels.levels[levelIndex] = L0;
  if (!window.__origForge) window.__origForge = JSON.parse(JSON.stringify(RF.data.units.forge));
  RF.data.units.forge = Object.assign({}, window.__origForge, (override && override._forge) || {});
  if (override && override[L0.id]) {
    const o = override[L0.id];
    Object.keys(o).forEach(function (k) { if (k[0] !== '_') L0[k] = o[k]; });
    // "_hp": [1.0, 1.2, ...] sets each listed wave's hp; "_count": 1.3 scales every group size.
    if (o._hp) o._hp.forEach(function (h, i) { if (L0.waves[i]) L0.waves[i].hp = h; });
    if (o._count) L0.waves.forEach(function (w) { w.groups.forEach(function (g) { g.count = Math.round(g.count * o._count); }); });
  }
  // Open the defenders a student would have on this level: earlier levels count as won.
  const md = RF.metrics.data();
  md.tutorial = { done: 'sim' }; // the tutorial would hold the battle on Level 1
  md.battles = md.battles.filter(function (b) { return b.sim !== true; });
  RF.data.levels.levels.slice(0, levelIndex).forEach(function (L) { md.battles.push({ id: L.id, result: 'win', sim: true }); });
  // --history N: the student arrives with N earlier reads of each vowel taught in earlier levels,
  // read at this reader's first-try rate (a real student's record carries from level to level).
  if (history && !L0.story) {
    const prev = levelIndex > 0 ? (RF.data.levels.levels[levelIndex - 1].vowels || []) : [];
    prev.filter(function (v) { return L0.vowels.indexOf(v) >= 0; }).forEach(function (v) {
      for (let i = 0; i < history; i++) RF.metrics.attempt({ battle: 'sim-past', w: 'sim', kind: 'real', pattern: 'cvc-' + v, mode: reader.mode, tries: Math.random() < reader.p ? 1 : 2, help: false, revealed: false, ms: 5000 });
    });
  }
  if (L0.story) RF.settings.testAll = true; // the final level preview is played in Test mode
  RF.startBattle(levelIndex);
  B.update = function () {};
  const U = RF.data.units, cfg = U.forge, L = B.L;

  // ---- Builder: a sensible student. Alternate towers and trail defenders, then upgrade. ----
  const pads = B.world.pads;
  const samples = B.world.path.samples;
  pads.forEach(function (p) {
    p.cover = samples.filter(function (q) { return Math.hypot(q.x - p.x, q.z - p.z) < 7; }).length;
  });
  const open = function (id) { return RF.unlocks.defenderOpen(id); };
  const plan = ['archer', 'spike', 'archer', 'frost', 'golem', 'ember', 'archer', 'spike', 'lightning', 'ballista', 'vine', 'golem', 'ember', 'shrine', 'archer', 'lightning', 'frost', 'spike', 'ember', 'golem', 'barricade', 'ballista', 'lightning', 'vine']
    .filter(open);
  let pi = 0;
  function freePad(kind, type) {
    const list = pads.filter(function (p) { return p.kind === kind && !p.def; });
    if (!list.length) return null;
    if (kind === 'trail') {
      // Golems and barricades near the camp, pits and vines spread along the trail.
      list.sort(function (a, b) { return (type === 'golem' || type === 'barricade') ? b.s - a.s : a.s - b.s; });
      return type === 'golem' || type === 'barricade' ? list[0] : list[Math.floor(list.length / 2)];
    }
    list.sort(function (a, b) { return b.cover - a.cover; });
    return list[0];
  }
  function build() {
    for (let guard = 0; guard < 6; guard++) {
      while (pi < plan.length) {
        const type = plan[pi], d = U.defenders[type];
        const pad = freePad(d.kind, type);
        if (!pad) { pi++; continue; }
        if (B.crystals < d.cost) return;
        B.place(type, pad); pi++;
        break;
      }
      if (pi < plan.length) continue;
      // Every planned spot used: upgrade the lowest level damage dealer first.
      // Level 3 defenders then take a tier 3 specialty (a coin flip between the two).
      const ups = B.defenders.filter(function (x) { return x.lv < 4; })
        .sort(function (a, b) { return a.lv - b.lv || (a.type === 'golem') - (b.type === 'golem'); });
      if (!ups.length) return;
      const u = ups[0], ud = U.defenders[u.type];
      const pick = u.lv === 3 ? (Math.random() < 0.5 ? 'a' : 'b') : null;
      const cost = pick ? ud.spec[pick].cost : ud.up[u.lv - 1];
      if (B.crystals < cost) return;
      B.upgrade(u, pick); B.closePopup();
    }
  }

  // ---- Reader ----
  const R = reader;
  let streak = 0;
  const log = { items: 0, first: 0, crystalsRead: 0, waveAt: [], anchorLow: B.anchor, maxDue: 0 };
  function itemTime() { return (L.story ? R.card : R.word) * (0.7 + Math.random() * 0.6); }
  function readOne() {
    const first = Math.random() < R.p;
    let amount;
    if (L.story) {
      amount = first ? cfg.storyRight : cfg.storyHelp;
      RF.metrics.storyCard({ battle: L.id, id: 'sim' + log.items, type: 'detail', tries: first ? 1 : 2, help: false });
    } else {
      const rune = Math.random() < (L.runeRate || 0);
      const v = L.vowels[Math.floor(Math.random() * L.vowels.length)];
      const revealed = !first && Math.random() < 0.4;
      const base = rune ? cfg.rune : cfg.real;
      amount = first ? (rune ? cfg.rune : R.mode === 'speak' ? cfg.speak : cfg.real) : revealed ? cfg.shown : Math.round(base * cfg.helpShare);
      RF.metrics.attempt({ battle: L.id, w: 'sim', kind: rune ? 'rune' : 'real', pattern: 'cvc-' + v, mode: R.mode, tries: first ? 1 : revealed ? 3 : 2, help: false, revealed: revealed, ms: 5000 });
    }
    streak = first ? streak + 1 : 0;
    let mega = false;
    if (streak >= cfg.megaPips) { amount += cfg.mega; streak = 0; mega = true; }
    log.items++; if (first) log.first++; log.crystalsRead += amount;
    B.forge.stats.forged++; if (first) B.forge.stats.firstTry++;
    B.pay(amount, null);
    B.refreshLocks(false);
    B.readTick();
    if (mega) B.megaBlast();
    return first;
  }

  const dt = 0.05;
  let t = 0, next = itemTime(), lastWave = 0, sealDoneAt = -1;
  const limit = maxMinutes * 60;
  build();
  while (B.phase !== 'done' && t < limit) {
    step(dt);
    t += dt;
    if (B.wave !== lastWave) { log.waveAt.push(Math.round(t)); lastWave = B.wave; }
    log.maxDue = Math.max(log.maxDue, B.wavesDue);
    log.anchorLow = Math.min(log.anchorLow, B.anchor);
    // The Seal: the battle holds while it is read, then the next wave is the final one.
    if (L.story && B.sealOpened && !B.sealDone) {
      B.sealComplete();
      sealDoneAt = Math.round(t);
      next = t + itemTime();
      continue;
    }
    // Hero powers: a student fires each one as soon as it is charged and a wave has a crowd.
    if (B.phase === 'wave' && B.creatures.length >= 4 && !noPowers) Object.keys(U.hero.powers).forEach(function (k) {
      if (B.power[k] >= U.hero.powers[k].charge) B.usePower(k);
    });
    if (t >= next) {
      const first = readOne();
      next = t + itemTime() * (first ? 1 : 1.5);
    }
    build();
  }
  const out = {
    level: L.id, result: B.phase === 'done' ? (B.anchor > 0 ? 'win' : 'lose') : 'timeout',
    waves: B.wave, minutes: +(t / 60).toFixed(1), anchor: Math.max(0, B.anchor), anchorMax: B.anchorMax,
    items: log.items, firstPct: Math.round(log.first / Math.max(1, log.items) * 100),
    perWave: Math.round(log.crystalsRead / Math.max(1, log.items) * L.waveEvery),
    defenders: B.defenders.length, levels: B.defenders.reduce(function (a, d) { return a + d.lv; }, 0),
    locks: B.locks.map(function (k) { return k.done ? 1 : 0; }).join(''), maxDue: log.maxDue, sealAt: sealDoneAt
  };
  if (B.phase !== 'done') { B.finish(false); }
  return out;
}
"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    h = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--levels", type=int, nargs="*", default=None)
    ap.add_argument("--readers", nargs="*", default=list(READERS))
    ap.add_argument("--runs", type=int, default=6)
    ap.add_argument("--override", default=None)
    ap.add_argument("--old3d", action="store_true", help="play every level on the old 3D trails (?3d), to compare")
    ap.add_argument("--minutes", type=float, default=40)
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--no-powers", action="store_true", help="never use hero powers")
    ap.add_argument("--history", type=int, default=0, help="earlier reads of each vowel from past levels (0 = fresh device)")
    a = ap.parse_args()
    override = json.load(open(a.override)) if a.override else None
    levels = json.load(open(os.path.join(ROOT, "game", "data", "levels-w1.json")))["levels"]
    idx = a.levels if a.levels is not None else list(range(len(levels)))
    srv = serve()
    url = "http://127.0.0.1:%d/game/index.html?low%s" % (srv.server_address[1], "&3d" if a.old3d else "")
    with sync_playwright() as p:
        br = p.chromium.launch(channel="chrome", args=["--use-gl=swiftshader", "--autoplay-policy=no-user-gesture-required"])
        pg = br.new_page(viewport={"width": 1280, "height": 720})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url)
        pg.wait_for_function("window.RF && RF.data && RF.app && RF.app.world", timeout=60000)
        for li in idx:
            for rn in a.readers:
                rows = []
                for k in range(a.runs):
                    rows.append(pg.evaluate(SIM_JS, dict(levelIndex=li, reader=READERS[rn], seed=1000 + k * 7919 + li,
                                                         override=override, maxMinutes=a.minutes, keep=False, noPowers=a.no_powers, history=a.history)))
                    if a.verbose:
                        print("   ", rows[-1])
                wins = sum(r["result"] == "win" for r in rows)
                lost = [r["waves"] for r in rows if r["result"] == "lose"]
                won = [r for r in rows if r["result"] == "win"]
                print("%-9s %-10s wins %d/%d  lose at wave %-14s win waves %-12s win min %-14s anchor left %-14s crystals/wave %d" % (
                    levels[li]["id"], rn, wins, len(rows), lost or "-",
                    [r["waves"] for r in won] or "-", [r["minutes"] for r in won] or "-",
                    [r["anchor"] for r in won] or "-", statistics.mean(r["perWave"] for r in rows)))
        if errs:
            print("PAGE ERRORS:", errs[:5])
        br.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
