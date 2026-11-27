// The painted battlefield's ground rules (DESIGN.md 13.1): the trail traced on the painted map,
// where defenders may be placed, and good open spots to suggest. No drawing here.
// The 1600 x 900 painted map covers 64 x 36 map units, so ranges and speeds keep their numbers.
window.RF = window.RF || {};
(function (RF) {
  const F = {};
  RF.field = F;
  F.W = 64; F.H = 36;
  const PX = 25; // picture points in one map unit

  // Placement distances, in map units.
  F.ROAD = 3.0;       // towers stay at least this far from the middle of the road
  F.TOWER_GAP = 3.2;  // between two towers
  F.SNAP = 2.8;       // a tap this close to the road puts a trail defender on it
  F.TRAIL_GAP = 3.4;  // along the road, between two trail defenders
  F.END_GAP = 5;      // along the road, from the rift and from the anchor

  F.toX = function (u) { return u * F.W - F.W / 2; };
  F.toZ = function (v) { return v * F.H - F.H / 2; };

  // A smooth line through the traced points, cut into 600 even steps.
  function buildPath(uv) {
    const pts = uv.map(function (p) { return { x: F.toX(p[0]), z: F.toZ(p[1]) }; });
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < 24; k++) {
        const t = k / 24, t2 = t * t, t3 = t2 * t;
        const f = function (a, b, c, d) { return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3); };
        dense.push({ x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) });
      }
    }
    dense.push(pts[pts.length - 1]);
    const run = [0];
    for (let i = 1; i < dense.length; i++) run.push(run[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].z - dense[i - 1].z));
    const len = run[run.length - 1];
    const N = 600, samples = [];
    for (let i = 0, j = 0; i < N; i++) {
      const s = len * i / (N - 1);
      while (j < dense.length - 2 && run[j + 1] < s) j++;
      const f = (s - run[j]) / ((run[j + 1] - run[j]) || 1);
      samples.push({ x: dense[j].x + (dense[j + 1].x - dense[j].x) * f, z: dense[j].z + (dense[j + 1].z - dense[j].z) * f });
    }
    return {
      len: len, samples: samples,
      // Point on the trail at distance s from the rift; lane shifts it sideways. dx, dz is the way it heads.
      at: function (s, lane, out) {
        const u = Math.max(0, Math.min(1, s / len)) * (N - 1);
        const i = Math.min(N - 2, Math.floor(u));
        const f = u - i;
        const a = samples[i], b = samples[i + 1];
        const tx = b.x - a.x, tz = b.z - a.z;
        const tl = Math.hypot(tx, tz) || 1;
        out = out || {};
        out.x = a.x + tx * f + (lane || 0) * (tz / tl);
        out.z = a.z + tz * f - (lane || 0) * (tx / tl);
        out.dx = tx / tl; out.dz = tz / tl;
        out.rot = Math.atan2(tx, tz) + Math.PI;
        return out;
      },
      // The trail point closest to (x, z): how far away it is and how far along the trail.
      nearest: function (x, z) {
        let bd = 1e9, bi = 0;
        for (let i = 0; i < N; i++) {
          const d = (samples[i].x - x) * (samples[i].x - x) + (samples[i].z - z) * (samples[i].z - z);
          if (d < bd) { bd = d; bi = i; }
        }
        return { d: Math.sqrt(bd), s: len * bi / (N - 1), x: samples[bi].x, z: samples[bi].z };
      }
    };
  }

  function segDist(px, pz, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / ((dx * dx + dz * dz) || 1)));
    return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t);
  }
  function inPoly(px, pz, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > pz) !== (b[1] > pz) && px < (b[0] - a[0]) * (pz - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  F.build = function (L) {
    const path = buildPath(L.pathUv);
    const rift = { x: F.toX(L.riftUv[0]), z: F.toZ(L.riftUv[1]) };
    const camp = { x: F.toX(L.anchorUv[0]), z: F.toZ(L.anchorUv[1]) };
    const nb = L.noBuild || {};
    const px = function (p) { return [p[0] * 1600, p[1] * 900]; };
    const circles = (nb.circles || []).map(function (c) { return { x: c.u * 1600, y: c.v * 900, r: c.r * 1600 }; });
    const polys = (nb.polys || []).map(function (p) { return p.points.map(px); });
    const river = (nb.river || []).map(px);

    // Is this spot on something nothing can be built on (rock, forest, water, camp)?
    function terrainBlocked(x, z) {
      if (Math.abs(x) > F.W / 2 - 1.2 || z < -F.H / 2 + 2.6 || z > F.H / 2 - 0.8) return true;
      const X = (x + F.W / 2) * PX, Y = (z + F.H / 2) * PX;
      if (circles.some(function (c) { return Math.hypot(X - c.x, Y - c.y) < c.r + 12; })) return true;
      if (polys.some(function (p) {
        if (inPoly(X, Y, p)) return true;
        return p.some(function (a, i) { return segDist(X, Y, a, p[(i + 1) % p.length]) < 12; });
      })) return true;
      for (let i = 0; i < river.length - 1; i++) if (segDist(X, Y, river[i], river[i + 1]) < 46) return true;
      return false;
    }

    // Can a defender of this kind go at (x, z)? 'taken' lists the places already built on.
    // Returns { ok, reason, x, z, s, rot }. reason: 'road', 'offroad', 'close' or 'blocked'.
    function check(kind, x, z, taken) {
      if (kind === 'trail') {
        const n = path.nearest(x, z);
        const out = { ok: false, x: n.x, z: n.z, s: n.s, rot: path.at(n.s).rot };
        if (n.d > F.SNAP) { out.reason = 'offroad'; out.x = x; out.z = z; }
        else if (n.s < F.END_GAP || n.s > path.len - F.END_GAP) out.reason = 'blocked';
        else if (taken.some(function (p) { return p.kind === 'trail' && Math.abs(p.s - n.s) < F.TRAIL_GAP; })) out.reason = 'close';
        else out.ok = true;
        return out;
      }
      const out = { ok: false, x: x, z: z, s: 0, rot: 0 };
      if (path.nearest(x, z).d < F.ROAD) out.reason = 'road';
      else if (terrainBlocked(x, z) || Math.hypot(x - rift.x, z - rift.z) < 4 || Math.hypot(x - camp.x, z - camp.z) < 4.5) out.reason = 'blocked';
      else if (taken.some(function (p) { return p.kind === 'tower' && Math.hypot(p.x - x, p.z - z) < F.TOWER_GAP; })) out.reason = 'close';
      else out.ok = true;
      return out;
    }

    // Suggested spots, taken from the level's old pad positions along the trail. They guide the arrow
    // keys, the tutorial and the balance simulator. Students can build anywhere that check() allows.
    const spots = [];
    (L.towerPads || []).forEach(function (tp, i) {
      for (let slide = 0; slide <= 8; slide++) {
        const t = tp.t + (slide % 2 ? 1 : -1) * Math.ceil(slide / 2) * 0.025;
        for (let d = 3.5; d <= 5.6; d += 0.35) {
          for (const side of [tp.side, -tp.side]) {
            const p = path.at(t * path.len, side * d);
            const c = check('tower', p.x, p.z, spots);
            if (c.ok) { spots.push({ id: 'T' + i, kind: 'tower', x: p.x, z: p.z, s: 0, rot: 0, def: null }); return; }
          }
        }
      }
    });
    (L.trailPads || []).forEach(function (t, i) {
      const p = path.at(t * path.len);
      if (check('trail', p.x, p.z, spots).ok) spots.push({ id: 'P' + i, kind: 'trail', x: p.x, z: p.z, s: t * path.len, rot: p.rot, def: null });
    });

    return { L: L, path: path, rift: rift, camp: camp, spots: spots, check: check };
  };
})(window.RF);
