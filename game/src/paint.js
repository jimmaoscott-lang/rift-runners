// The painted battlefield (DESIGN.md 13.1): one painted map on a flat canvas, painted creatures and
// defenders that bob, lean, squash and flash, shots and sparks, and free placement with a ghost
// preview. This file only draws and reads taps. The rules live in battle.js and field.js.
window.RF = window.RF || {};
(function (RF) {
  const D = RF.dom;
  const V = { kind: 'paint' };
  RF.paint = V;
  const B = function () { return RF.battle; };

  const LIFT = 0.8;           // how far one unit of height moves a thing up the screen
  const TIER = 0.08;          // each upgrade draws a defender a little larger
  const COLOR = { purple: '190,80,255', cyan: '80,230,255', orange: '255,140,40', yellow: '255,225,80', ice: '170,225,255', white: '255,255,255' };
  const REASON = { road: 'hud.place.road', offroad: 'hud.place.offroad', close: 'hud.place.close', blocked: 'hud.place.blocked' };

  let world = null, cv = null, g = null, bg = null, bgKey = '';
  let W = 0, H = 0, dpr = 1, k = 14, ox = 0, oy = 0, sizeKey = '';
  let t = 0;                  // animation clock (stops when the battle is paused)
  let parts = [], effects = [], ghosts = [];
  let ghost = null;           // the place under the finger or mouse: { x, z, touch }
  let cursorSpot = null;      // the spot picked with the arrow keys
  let ring = null;            // range ring of the open defender popup
  let glow = null, glowKey = '';
  let box = null, boxKey = '';
  let lastPointer = 'mouse';
  let anchorHurt = 0, shakeX = 0, shakeY = 0;
  let fps = null;
  const glows = {};
  const calm = function () { return !!RF.settings.reducedMotion; };

  // ---------- Picture helpers ----------
  const X = function (x) { return ox + (x + RF.field.W / 2) * k; };
  const Y = function (z, h) { return oy + (z + RF.field.H / 2) * k - (h || 0) * k * LIFT; };
  const toMap = function (px, py) { return { x: (px - ox) / k - RF.field.W / 2, z: (py - oy) / k - RF.field.H / 2 }; };
  V.screenOf = function (x, y, z) { return { x: X(x), y: Y(z, y), behind: false }; };

  function glowImg(color) {
    if (!glows[color]) {
      const c = RF.art.canvas(64, 64), cg = c.getContext('2d');
      const gr = cg.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(' + COLOR[color] + ',.75)'); gr.addColorStop(1, 'rgba(' + COLOR[color] + ',0)');
      cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
      glows[color] = c;
    }
    return glows[color];
  }
  function light(px, py, r, color, alpha) {
    if (alpha <= 0 || r <= 0) return;
    g.globalAlpha = Math.min(1, alpha);
    g.drawImage(glowImg(color), px - r, py - r, r * 2, r * 2);
    g.globalAlpha = 1;
  }
  // A flat oval on the ground (shadows, rings). r is in map units.
  function oval(x, z, r, fill, stroke, width, squash) {
    g.beginPath();
    g.ellipse(X(x), Y(z), r * k, r * k * (squash || 1), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width || 2; g.stroke(); }
  }
  // Draw a sized picture with its feet at screen point (px, py).
  function stamp(pic, px, py, o) {
    o = o || {};
    g.save();
    g.translate(px, py);
    if (o.rot) g.rotate(o.rot);
    g.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.drawImage(pic.c, -pic.w / 2, -pic.h * pic.e.foot, pic.w, pic.h);
    g.restore();
  }
  const pic = function (set, id, variant, frame) { return RF.art.get(set, id, k, dpr, variant, frame); };

  // ---------- Start, size, stop ----------
  V.icons = function () {
    RF.icons = {};
    Object.keys(RF.data.art.defenders).forEach(function (id) { RF.icons[id] = RF.art.iconURL(id); });
    return RF.icons;
  };
  V.start = function (levelIndex) {
    const L = RF.data.levels.levels[levelIndex];
    RF.art.preload(L.map);
    world = RF.field.build(L);
    world.pads = world.spots;
    parts = []; effects = []; ghosts = []; ghost = null; cursorSpot = null; ring = null; glow = null; glowKey = '';
    t = 0; anchorHurt = 0; shakeX = 0; shakeY = 0; sizeKey = ''; bgKey = ''; box = null; boxKey = '';
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'paint';
      cv.style.cssText = 'position:absolute;left:0;top:0;touch-action:none';
      document.getElementById('view').appendChild(cv);
      g = cv.getContext('2d');
    }
    cv.style.display = '';
    RF.app.renderer.domElement.style.display = 'none';
    layout();
    return world;
  };
  V.stop = function () {
    if (cv) { cv.style.display = 'none'; cv.onclick = cv.onpointermove = cv.onpointerdown = cv.onpointerleave = null; }
    if (RF.app.renderer) RF.app.renderer.domElement.style.display = '';
    if (fps) { fps.el.remove(); fps = null; }
    parts = []; effects = []; ghosts = []; ghost = null; box = null;
  };
  // The map sits in the open space left of the Rune Forge, above the build bar and under the top bar.
  function layout() {
    const s = D.scale;
    const vw = window.innerWidth, vh = window.innerHeight;
    const sharp = Math.min(RF.lowPower ? 1 : 1.5, window.devicePixelRatio || 1);
    const key = vw + 'x' + vh + ':' + s + ':' + sharp;
    if (key === sizeKey) return;
    sizeKey = key; W = vw; H = vh; dpr = sharp;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const aw = W - 374 * s, top = 70 * s, bottom = H - 139 * s;
    k = Math.max(4, Math.min(aw / RF.field.W, (bottom - top) / RF.field.H));
    ox = (aw - RF.field.W * k) / 2;
    oy = bottom - RF.field.H * k;
    RF.art.resized();
    glowKey = ''; bgKey = '';
  }
  // The map is drawn once to a hidden layer; each frame copies it in one step.
  function background() {
    const im = RF.art.image(RF.data.art.maps[world.L.map]);
    const loaded = im.complete && im.naturalWidth > 0;
    const key = sizeKey + ':' + loaded;
    if (key === bgKey) return;
    bgKey = key;
    bg = RF.art.canvas(W * dpr, H * dpr);
    const c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, H);
    if (!loaded) return;
    c.imageSmoothingQuality = 'high';
    // A dim copy of the map fills the screen behind the panels.
    const cover = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.1;
    c.globalAlpha = 0.28;
    c.drawImage(im, (W - im.naturalWidth * cover) / 2, (H - im.naturalHeight * cover) / 2, im.naturalWidth * cover, im.naturalHeight * cover);
    c.globalAlpha = 1;
    c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = 18;
    c.drawImage(im, ox, oy, RF.field.W * k, RF.field.H * k);
  }

  // ---------- Build spots and placing ----------
  function taken() { return B().defenders.map(function (d) { return d.pad; }); }
  let padCount = 0;
  function check(kind, x, z) { return world.check(kind, x, z, taken()); }
  // True when one of our own screen panels or labels sits on that part of the map.
  function covered(x, z) {
    const bt = B(), px = X(x), py = Y(z);
    return [bt.powerBox, bt.locksBox, bt.anchorLabel && bt.anchorLabel.firstChild, bt.riftLabel && bt.riftLabel.firstChild].some(function (el) {
      if (!el || !el.offsetParent) return false;
      const r = el.getBoundingClientRect();
      return r.width && px > r.left - 4 && px < r.right + 4 && py > r.top - 4 && py < r.bottom + 4;
    });
  }
  function checkTap(kind, x, z) {
    const c = check(kind, x, z);
    if (c.ok && covered(c.x, c.z)) { c.ok = false; c.reason = 'blocked'; }
    return c;
  }
  function makePad(kind, c) { return { id: 'U' + (++padCount), kind: kind, x: c.x, z: c.z, s: c.s, rot: c.rot, def: null }; }
  V.canBuild = function (pad) { return check(pad.kind, pad.x, pad.z).ok; };
  V.releasePad = function () { glowKey = ''; };
  V.spots = function (kind) {
    return world.spots.filter(function (p) { return !p.def && p.kind === kind && check(kind, p.x, p.z).ok; });
  };
  // The two or three spots the tutorial points at (level data "hintSpots").
  V.tutSpots = function (kind) {
    const hints = (world.L.hintSpots || []).map(function (h) { return makePad(kind, check(kind, RF.field.toX(h[0]), RF.field.toZ(h[1]))); })
      .filter(function (p) { return V.canBuild(p) && !covered(p.x, p.z); });
    return hints.length ? hints : V.spots(kind);
  };
  V.spotLine = function (kind) { return kind === 'tower' ? 'hud.paintTower' : 'hud.paintTrail'; };
  V.updatePads = function () { glowKey = ''; ghost = null; cursorSpot = null; };
  V.animatePads = function (cand, cursor) { cursorSpot = cursor >= 0 ? cand[cursor] || null : null; };

  // The faint glow over open ground while a defender is picked.
  function openGlow(kind) {
    const key = kind + ':' + taken().length;
    if (key === glowKey) return glow;
    glowKey = key;
    if (kind === 'trail') {
      const segs = [];
      let run = [];
      for (let s = 0; s <= world.path.len; s += 0.5) {
        const p = world.path.at(s, 0);
        if (check('trail', p.x, p.z).ok) run.push({ x: p.x, z: p.z });
        else if (run.length) { segs.push(run); run = []; }
      }
      if (run.length) segs.push(run);
      glow = { road: segs };
    } else {
      const cw = 128, ch = 72;
      const c = RF.art.canvas(cw, ch), cg = c.getContext('2d');
      cg.fillStyle = '#b8ffd0';
      for (let i = 0; i < cw; i++) {
        for (let j = 0; j < ch; j++) {
          if (check('tower', (i + 0.5) / 2 - RF.field.W / 2, (j + 0.5) / 2 - RF.field.H / 2).ok) cg.fillRect(i, j, 1, 1);
        }
      }
      glow = { mask: c };
    }
    return glow;
  }

  // ---------- Pointer ----------
  // The defender under a screen point (its body, not the empty corners of its picture).
  function defenderAt(px, py) {
    let best = null, by = -1e9;
    B().defenders.forEach(function (d) {
      const p = pic('defenders', d.type);
      const sc = 1 + TIER * (Math.min(d.lv, 3) - 1);
      const h = p ? p.h * sc * p.e.foot : 3 * k;
      const w = p ? Math.min(p.w * sc, 3.2 * k) : 3 * k;
      const fx = X(d.pad.x), fy = Y(d.pad.z);
      if (px > fx - w / 2 && px < fx + w / 2 && py > fy - h * 0.85 && py < fy + 1.1 * k && d.pad.z > by) { best = d; by = d.pad.z; }
    });
    return best;
  }
  function onClick(ev) {
    const bt = B();
    if (!bt.active || bt.phase === 'done') return;
    const at = toMap(ev.clientX, ev.clientY);
    const onMap = Math.abs(at.x) <= RF.field.W / 2 && Math.abs(at.z) <= RF.field.H / 2;
    const touch = lastPointer !== 'mouse';
    const kind = bt.buildSel ? bt.U.defenders[bt.buildSel].kind : null;
    const hit = defenderAt(ev.clientX, ev.clientY);
    if (hit && !(kind && checkTap(kind, at.x, at.z).ok)) { bt.selectBuild(null); bt.showDefPopup(hit); return; }
    if (!onMap) { bt.selectBuild(null); bt.closePopup(); ghost = null; return; }
    if (bt.tut && !bt.tut.allowPads() && !bt.buildSel) return;
    if (kind) {
      const c = checkTap(kind, at.x, at.z);
      if (!c.ok) {
        ghost = { x: at.x, z: at.z, touch: touch };
        RF.sfx('soft');
        RF.speak(REASON[c.reason]);
        return;
      }
      // Touch: the first tap shows the ghost, a second tap near it (or Build) places it.
      if (touch && !(ghost && ghost.touch && Math.hypot(ghost.x - c.x, ghost.z - c.z) < 1.8 && checkTap(kind, ghost.x, ghost.z).ok)) {
        ghost = { x: c.x, z: c.z, touch: true };
        RF.sfx('select');
        return;
      }
      const spot = touch ? checkTap(kind, ghost.x, ghost.z) : c;
      if (bt.place(bt.buildSel, makePad(kind, spot))) ghost = null;
      return;
    }
    // Nothing picked: tapping away closes a popup. Tapping open ground offers what can be built there.
    if (bt.popup.style.display !== 'none') { bt.closePopup(); return; }
    let c = checkTap('trail', at.x, at.z), pad = c.ok ? makePad('trail', c) : null;
    if (!pad || world.path.nearest(at.x, at.z).d > 2) {
      c = checkTap('tower', at.x, at.z);
      if (c.ok) pad = makePad('tower', c);
    }
    if (pad) { bt.showPadMenu(pad); ring = { pad: pad, spot: true }; }
  }
  V.pointerOn = function () {
    cv.onclick = onClick;
    cv.onpointerdown = function (ev) { lastPointer = ev.pointerType || 'mouse'; };
    cv.onpointermove = function (ev) {
      if (!B().active) return;
      lastPointer = ev.pointerType || 'mouse';
      if (lastPointer !== 'mouse') return;
      if (B().buildSel) { ghost = toMap(ev.clientX, ev.clientY); cursorSpot = null; B().padCursor = -1; cv.style.cursor = 'pointer'; }
      else cv.style.cursor = defenderAt(ev.clientX, ev.clientY) ? 'pointer' : 'default';
    };
    cv.onpointerleave = function () { if (ghost && !ghost.touch) ghost = null; };
  };

  // The little box beside the ghost: a red reason (with a speaker), or the Build button for touch.
  function ghostBox(spot, c) {
    const bt = B();
    let want = '';
    if (spot && !c.ok) want = 'no:' + c.reason;
    else if (spot && spot.touch) want = 'yes';
    if (want !== boxKey || (box && !box.isConnected)) {
      if (box) box.remove();
      box = null; boxKey = want;
      if (want && bt.hud) {
        box = D.el('div', 'popup', null, bt.hud);
        box.style.cssText += ';pointer-events:auto;white-space:nowrap';
        if (want === 'yes') {
          const b = D.button('hud.build', function () {
            if (!ghost) return;
            const kd = bt.U.defenders[bt.buildSel].kind, now = checkTap(kd, ghost.x, ghost.z);
            if (now.ok && bt.place(bt.buildSel, makePad(kd, now))) ghost = null;
          }, 'go', box);
          b.row.style.cssText += ';background:rgba(14,16,40,.9);border-radius:12px;padding:5px 8px';
        } else {
          const row = D.line(REASON[c.reason], 'chip', box);
          row.style.cssText += ';border-color:#ff7a7a;color:#ffc9c9;padding:3px 10px';
          row.querySelector('.txt').style.fontSize = 'calc(16px * var(--ts))';
        }
      }
    }
    if (box) {
      const s = D.scale;
      const half = box.offsetWidth / 2 + 6;
      box.style.left = Math.min(Math.max(X(c.x) / s, half), (ox + RF.field.W * k) / s - half) + 'px';
      // The box sits below the spot, clear of the ghost picture above it (above near the bottom edge).
      const below = Y(c.z) + Math.max(1.6 * k, 62 * s);
      box.style.top = (below / s + box.offsetHeight > (H - 139 * s) / s ? Y(c.z, 7.5) / s : below / s + box.offsetHeight) + 'px';
    }
  }
  V.confirmEl = function () { return box && boxKey === 'yes' ? box : null; };

  // ---------- Creatures and defenders ----------
  V.relabel = function () {}; // health bars are drawn on the canvas
  V.addCreature = function (c) { c.fx = { born: t, hit: -9, big: -9, face: 1 }; };
  V.moveCreature = function (c, p) { if (p.dx > 0.25) c.fx.face = 1; else if (p.dx < -0.25) c.fx.face = -1; };
  V.removeCreature = function (c, defeated) {
    if (defeated) ghosts.push({ type: c.type, x: c.x, z: c.z, face: c.fx.face, t: 0 });
  };
  V.hitCreature = function (c, dmg) { c.fx.hit = t; if (dmg >= 40) c.fx.big = t; };
  V.breakShield = function (c) {
    effects.push({ type: 'ring', x: c.x, z: c.z, r0: 1.6, r1: 3.6, color: 'purple', t: 0, life: 0.4 });
  };
  V.addDefender = function (def) { def.fx = { pop: -9, recoil: -9, upgrade: -9, strike: -9, face: 1, dx: 0, dz: 0, active: false }; glowKey = ''; };
  V.removeDefender = function () { glowKey = ''; };
  V.frostRange = function () {};   // drawn each frame from the defender's numbers
  V.scaleDefender = function () {};
  V.popIn = function (def) { def.fx.pop = t; effects.push({ type: 'ring', x: def.pad.x, z: def.pad.z, r0: 0.6, r1: 3, color: 'cyan', t: 0, life: 0.4 }); };
  V.upgradeDefender = function (def) { def.fx.upgrade = t; effects.push({ type: 'ring', x: def.pad.x, z: def.pad.z, r0: 0.8, r1: 3.4, color: 'yellow', t: 0, life: 0.5 }); };
  V.defenderDown = function () {};  // drawn from def.down
  V.strike = function (def, target) {
    def.fx.strike = t;
    if (target) { def.fx.face = target.x >= def.pad.x ? 1 : -1; V.burst(target.x, 1, target.z, 'white', 3); }
  };
  V.spikeActive = function (def, any) { def.fx.active = any; };
  V.aim = function (def, tx, tz) {
    const d = Math.hypot(tx - def.pad.x, tz - def.pad.z) || 1;
    def.fx.dx = (tx - def.pad.x) / d; def.fx.dz = (tz - def.pad.z) / d;
    if (Math.abs(def.fx.dx) > 0.2) def.fx.face = def.fx.dx > 0 ? 1 : -1;
  };
  V.recoil = function (def) { def.fx.recoil = t; };
  V.defTop = function (def) { const e = RF.data.art.defenders[def.type]; return e.h * e.foot / LIFT; };
  // Heights for the two name labels. Below zero puts a label under its spot, clear of the top buttons.
  V.anchorY = -3.1;
  V.riftY = -4.4;
  V.anchorTextY = 5;
  V.showRange = function (def, r) { ring = { pad: def.pad, r: r }; };
  V.hideRange = function () { ring = null; };

  // ---------- Shots and effects ----------
  V.addShot = function () {};
  V.moveShot = function (sh, ty) {
    if (sh.shell) return;
    const dx = X(sh.tx) - X(sh.x), dy = Y(sh.tz, ty) - Y(sh.z, sh.y);
    if (dx || dy) sh.angle = Math.atan2(dy, dx);
  };
  V.removeShot = function () {};
  const cap = function () { return RF.lowPower ? 130 : 280; };
  V.burst = function (x, y, z, color, n) {
    if (calm()) n = Math.min(n, 2);
    for (let i = 0; i < n && parts.length < cap(); i++) {
      parts.push({ x: x, y: y, z: z, vx: (Math.random() - 0.5) * 5, vy: 1 + Math.random() * 3.5, vz: (Math.random() - 0.5) * 2.5, color: color, t: 0, life: 0.45 + Math.random() * 0.35 });
    }
  };
  V.zap = function (a, b) {
    if (effects.length > 80) return;
    effects.push({ type: 'zap', a: a, b: b, t: 0, life: 0.22 });
    V.burst(b.x, b.y, b.z, 'yellow', 2);
  };
  V.splashRing = function (x, z, radius) { effects.push({ type: 'ring', x: x, z: z, r0: radius * 0.4, r1: radius * 1.25, color: 'orange', fill: true, t: 0, life: 0.35 }); };
  V.burnAdd = function () {};
  V.burnTick = function () {};
  V.burnRemove = function () {};
  V.megaFlash = function () { effects.push({ type: 'flash', color: 'yellow', t: 0, life: 0.9 }); };
  V.freezeFlash = function () { effects.push({ type: 'flash', color: 'ice', t: 0, life: 0.8 }); };
  V.heroCast = function (color) {
    effects.push({ type: 'cast', color: color, t: 0, life: 0.8 });
    V.burst(world.camp.x + 3, 3, world.camp.z - 1, color, 10);
  };
  V.meteor = function (tx, tz, radius, time) { effects.push({ type: 'meteor', x: tx, z: tz, r: radius, t: 0, life: time }); };
  V.meteorHit = function (tx, tz, radius) {
    V.burst(tx, 1, tz, 'orange', 16); V.burst(tx, 1, tz, 'purple', 6);
    effects.push({ type: 'ring', x: tx, z: tz, r0: radius * 0.5, r1: radius * 1.8, color: 'orange', fill: true, t: 0, life: 0.45 });
  };
  V.anchorHurt = function () { anchorHurt = 0.6; };
  V.frame = function (realDt, shaking, ended) {
    const step = B().paused ? 0 : realDt;
    t += step;
    if (anchorHurt > 0) anchorHurt -= step;
    shakeX = shaking && !ended ? (Math.random() - 0.5) * 0.45 * k : 0;
    shakeY = shaking && !ended ? (Math.random() - 0.5) * 0.45 * k : 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += step; p.x += p.vx * step; p.y += p.vy * step; p.z += p.vz * step; p.vy -= 5 * step;
      if (p.t >= p.life) parts.splice(i, 1);
    }
    for (let i = effects.length - 1; i >= 0; i--) { effects[i].t += step; if (effects[i].t >= effects[i].life) effects.splice(i, 1); }
    for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].t += step; if (ghosts[i].t >= 0.35) ghosts.splice(i, 1); }
  };

  // ---------- Drawing ----------
  function drawRift() {
    const px = X(world.rift.x), py = Y(world.rift.z, 1.6);
    const spin = calm() ? 0.6 : t * 1.4;
    oval(world.rift.x, world.rift.z, 2.1, 'rgba(60,10,90,.55)', null, 0, 0.42);
    g.globalCompositeOperation = 'lighter';
    light(px, py, k * 3.4, 'purple', 0.55 + (calm() ? 0 : Math.sin(t * 2) * 0.15));
    g.globalCompositeOperation = 'source-over';
    g.save(); g.translate(px, py);
    g.beginPath(); g.ellipse(0, 0, k * 1.15, k * 1.7, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(24,4,44,.9)'; g.fill();
    g.lineWidth = k * 0.28; g.strokeStyle = '#c04dff'; g.stroke();
    g.lineWidth = Math.max(1.5, k * 0.12); g.strokeStyle = '#f0c8ff';
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.ellipse(0, 0, k * (0.3 + i * 0.28), k * (0.5 + i * 0.4), 0, spin * (i % 2 ? -1 : 1) + i * 2, spin * (i % 2 ? -1 : 1) + i * 2 + 2.4); g.stroke();
    }
    g.restore();
  }
  function crystal(px, py, w, h, a, b) {
    g.beginPath(); g.moveTo(px, py - h / 2); g.lineTo(px + w / 2, py - h * 0.12); g.lineTo(px, py + h / 2); g.lineTo(px - w / 2, py - h * 0.12); g.closePath();
    g.fillStyle = a; g.fill();
    g.lineWidth = 2; g.strokeStyle = '#06303a'; g.stroke();
    g.beginPath(); g.moveTo(px, py - h / 2); g.lineTo(px + w / 2, py - h * 0.12); g.lineTo(px, py + h / 2); g.closePath();
    g.fillStyle = b; g.fill();
  }
  function drawAnchor() {
    const bob = calm() ? 0 : Math.sin(t * 2) * 0.15;
    const hurt = anchorHurt > 0;
    oval(world.camp.x, world.camp.z, 1.3, 'rgba(0,0,0,.28)', null, 0, 0.4);
    const px = X(world.camp.x), py = Y(world.camp.z, 2.2 + bob);
    g.globalCompositeOperation = 'lighter';
    light(px, py, k * 2.8, hurt ? 'orange' : 'cyan', hurt ? 0.5 + Math.abs(Math.sin(t * 30)) * 0.5 : 0.6);
    g.globalCompositeOperation = 'source-over';
    crystal(px, py, k * 1.7, k * 3, hurt ? '#ff9a8a' : '#bff8ff', hurt ? '#e0503a' : '#35b8d8');
  }
  function drawHero() {
    const p = pic('hero', 'hero');
    const x = world.camp.x + 3.2, z = world.camp.z - 0.6;
    oval(x, z, 1.1, 'rgba(0,0,0,.3)', null, 0, 0.38);
    const cast = effects.find(function (e) { return e.type === 'cast'; });
    if (cast) { g.globalCompositeOperation = 'lighter'; light(X(x), Y(z, 2.5), k * (2 + Math.sin(cast.t / cast.life * Math.PI) * 3), cast.color, 0.8); g.globalCompositeOperation = 'source-over'; }
    if (p) stamp(p, X(x), Y(z), { flip: true, sy: calm() ? 1 : 1 + Math.sin(t * 2.2) * 0.015 });
  }

  const FLAT = function (d) { return !!RF.data.art.defenders[d.type].flat; };
  function drawDefender(d) {
    const e = RF.data.art.defenders[d.type];
    const fx = d.fx;
    const lv = Math.min(d.lv, 3);
    let sc = (1 + TIER * (lv - 1)) * (d.regrow > 0 ? 0.55 : 1);
    const age = t - fx.pop;
    if (!calm() && age < 0.35) sc *= 0.3 + 0.7 * (age / 0.35) + Math.sin(age / 0.35 * Math.PI) * 0.18;
    let x = d.pad.x, z = d.pad.z;
    const flat = e.flat;
    // Ring under the defender: silver at level 2, gold at level 3 and up.
    if (!flat) oval(x, z, 1.35, 'rgba(0,0,0,.28)', null, 0, 0.42);
    if (d.lv > 1) oval(x, z, flat ? 1.75 : 1.55, null, d.lv === 2 ? '#dfe8ff' : '#ffd76a', Math.max(2, k * 0.18), flat ? 0.55 : 0.42);
    if (d.down > 0) { // a fallen golem: rubble until it rebuilds
      [[-0.7, 0.1, 0.5], [0.5, -0.1, 0.65], [0.05, 0.35, 0.4]].forEach(function (r) { oval(x + r[0], z + r[1], r[2], '#7c8a99', '#232a33', 2, 0.65); });
      return;
    }
    let lift = 0, rot = 0, sx = 1, sy = 1, dx = 0, dy = 0;
    const flip = e.face ? fx.face * e.face < 0 : false;
    if (!calm()) {
      const rec = t - fx.recoil;
      if (rec < 0.16) {
        const f = 1 - rec / 0.16;
        if (d.type === 'ember' || d.type === 'ballista') { dx = -fx.dx * f * k * 0.45; dy = -fx.dz * f * k * 0.25; }
        sx = 1 + f * 0.06; sy = 1 - f * 0.07;
      }
      const hit = t - fx.strike;
      if (hit < 0.2) { const f = Math.sin(hit / 0.2 * Math.PI); dx += fx.dx * f * k + fx.face * f * k * 0.5; rot = fx.face * f * 0.16; }
      if (d.type === 'golem') sy *= 1 + Math.sin(t * 3 + x) * 0.02;
      if (d.type === 'spike' && fx.active) lift = Math.abs(Math.sin(t * 18)) * 0.18;
    }
    const p = pic('defenders', d.type);
    if (!p) return;
    if (t - fx.upgrade < 0.9) { g.globalCompositeOperation = 'lighter'; light(X(x), Y(z, e.h * 0.5), k * 3.2, 'yellow', 0.8 * (1 - (t - fx.upgrade) / 0.9)); g.globalCompositeOperation = 'source-over'; }
    stamp(p, X(x) + dx, Y(z, lift) + dy, { flip: flip, sx: sc * sx, sy: sc * sy, rot: rot });
    if (d.type === 'lightning' || d.type === 'frost' || d.type === 'shrine') {
      g.globalCompositeOperation = 'lighter';
      const flash = t - fx.recoil < 0.2 ? 0.6 : 0;
      light(X(x), Y(z) - p.h * sc * (e.foot - 0.14), k * 1.3, d.type === 'frost' ? 'ice' : 'cyan', 0.25 + flash + (calm() ? 0 : Math.sin(t * 3 + x) * 0.1));
      g.globalCompositeOperation = 'source-over';
    }
    if (d.spec) { // specialty gem: orange for the first choice, blue for the second
      const top = Y(z) - p.h * sc * e.foot - k * 0.7 + (calm() ? 0 : Math.sin(t * 3) * k * 0.12);
      g.globalCompositeOperation = 'lighter'; light(X(x), top, k * 1.1, d.spec === 'a' ? 'orange' : 'cyan', 0.8); g.globalCompositeOperation = 'source-over';
      crystal(X(x), top, k * 0.7, k * 1.05, d.spec === 'a' ? '#ffd09a' : '#c9fbff', d.spec === 'a' ? '#f07a24' : '#2fb0d8');
    }
  }

  // How a creature stands right now: used for its picture and for its health bar.
  function creaturePose(c) {
    const e = RF.data.art.creatures[c.type];
    const stopped = c.stun > 0 || c.rooted > 0 || !!c.held;
    const still = calm();
    let lift = e.fly || 0, rot = 0, sx = 1, sy = 1, dx = 0;
    if (!still) {
      if (e.fly) {
        lift += Math.sin(t * 3.2 + c.bob) * 0.25;
        rot = Math.sin(t * 1.9 + c.bob) * 0.08;
        if (c.type === 'bat' && c.stun <= 0) sy = 1 + Math.sin(t * 15 + c.bob) * 0.13;
        else sx = 1 + Math.sin(t * 9 + c.bob) * 0.05;
      } else if (!stopped) {
        // A bounce in step with how far it has walked, and a lean the way it is going.
        const step = c.s * (c.type === 'bramble' || c.type === 'splitling' ? 4.2 : 2.4) + c.bob;
        const hop = Math.abs(Math.sin(step));
        lift += hop * (c.type === 'brute' ? 0.16 : 0.28);
        sy = 0.95 + hop * 0.08; sx = 1.04 - hop * 0.06;
        rot = c.fx.face * 0.05 + Math.sin(step) * 0.04;
      } else if (c.held) {
        dx = Math.max(0, Math.sin(t * 8 + c.bob)) * 0.3 * c.fx.face; // pushing at what holds it
      }
      const hit = t - c.fx.hit;
      if (hit < 0.16) { const f = 1 - hit / 0.16; sx *= 1 + 0.16 * f; sy *= 1 - 0.16 * f; }
      if (t - c.fx.big < 0.25) dx += Math.sin(t * 90) * 0.18;
    }
    return { e: e, lift: lift, rot: rot, sx: sx, sy: sy, dx: dx };
  }
  function drawCreature(c) {
    const o = creaturePose(c);
    const p = pic('creatures', c.type, '', o.e.walk && !calm() ? Math.floor(c.s * 3) : null);
    const shadowR = (o.e.w || 3) * 0.3 * (o.e.fly ? 0.75 : 1);
    oval(c.x, c.z, shadowR, o.e.fly ? 'rgba(0,0,0,.22)' : 'rgba(0,0,0,.3)', null, 0, 0.4);
    if (!p) return;
    const age = t - c.fx.born;
    let grow = 1, spin = 0;
    if (!calm() && age < 0.45) { const f = age / 0.45; grow = 0.15 + 0.85 * f; spin = (1 - f) * 2.5; } // swirls out of the rift
    const flip = o.e.face ? c.fx.face * o.e.face < 0 : false;
    const px = X(c.x + o.dx), py = Y(c.z, o.lift);
    if (c.type === 'wisp') { g.globalCompositeOperation = 'lighter'; light(px, py, k * 1.8, 'purple', 0.4); g.globalCompositeOperation = 'source-over'; }
    stamp(p, px, py, { flip: flip, rot: o.rot + spin, sx: o.sx * grow, sy: o.sy * grow });
    const flash = 1 - (t - c.fx.hit) / 0.14;
    if (flash > 0) { const w = pic('creatures', c.type, 'white'); if (w) stamp(w, px, py, { flip: flip, rot: o.rot, sx: o.sx * grow, sy: o.sy * grow, alpha: flash * 0.75 }); }
    const midY = py - p.h * (o.e.foot - 0.5);
    if (c.shield) {
      g.beginPath(); g.ellipse(px, midY, p.w * 0.56, p.h * 0.56, 0, 0, Math.PI * 2);
      g.fillStyle = 'rgba(190,120,255,.13)'; g.fill();
      g.lineWidth = Math.max(2, k * 0.16); g.strokeStyle = 'rgba(222,184,255,.85)'; g.stroke();
    }
    if (c.stun > 0 && c.stunTag === 'tag.frozen') { g.globalCompositeOperation = 'lighter'; light(px, midY, p.w * 0.55, 'ice', 0.75); g.globalCompositeOperation = 'source-over'; }
    else if (c.slow < 1) oval(c.x, c.z, shadowR * 1.15, null, 'rgba(170,230,255,.85)', 2, 0.42);
    if (c.rooted > 0) {
      g.strokeStyle = '#6fe05a'; g.lineWidth = Math.max(2, k * 0.2);
      for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(px + i * k * 0.9, Y(c.z) + 2); g.quadraticCurveTo(px + i * k * 1.5, midY, px + i * k * 0.2, midY + k * 0.3); g.stroke(); }
    }
  }
  function drawDefeated(gh) {
    const e = RF.data.art.creatures[gh.type];
    const p = pic('creatures', gh.type);
    if (!p) return;
    const f = gh.t / 0.35;
    const flip = e.face ? gh.face * e.face < 0 : false;
    const grow = calm() ? 1 : 1 + f * 0.35;
    stamp(p, X(gh.x), Y(gh.z, (e.fly || 0) + f * 0.8), { flip: flip, sx: grow, sy: grow, alpha: 1 - f });
  }

  function healthBar(px, py, w, share, color) {
    g.fillStyle = '#120a10'; g.fillRect(px - w / 2 - 1.5, py - 1.5, w + 3, 8);
    g.fillStyle = color; g.fillRect(px - w / 2, py, w * Math.max(0, Math.min(1, share)), 5);
  }
  function tagText(text, px, py, color) {
    g.font = '700 ' + Math.max(12, Math.round(13 * D.scale)) + 'px Lexend, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.lineWidth = 3.5; g.strokeStyle = '#000'; g.lineJoin = 'round';
    g.strokeText(text, px, py); g.fillStyle = color; g.fillText(text, px, py);
  }
  function drawBars() {
    const bt = B();
    const words = [];
    const shown = []; // in a crowd, a tag is left off when the same word already shows right there
    // The creatures furthest along get their tags first.
    bt.creatures.slice().sort(function (a, b) { return b.s - a.s; }).forEach(function (c) {
      const o = creaturePose(c);
      const p = pic('creatures', c.type);
      const w = c.type === 'bramble' || c.type === 'splitling' ? 26 : c.type === 'brute' ? 52 : 42;
      const px = X(c.x), py = Math.max(8, Y(c.z, o.e.fly || 0) - (p ? p.h * o.e.foot : 2 * k) - 9);
      healthBar(px, py, w * Math.max(0.7, D.scale), c.hp / c.max, '#ff5d6c');
      const tag = bt.creatureTag(c);
      // One tag per patch of the screen keeps every word readable.
      if (tag && !shown.some(function (q) { return Math.abs(q.x - px) < 84 && Math.abs(q.y - py) < 18; })) {
        shown.push({ x: px, y: py });
        words.push([tag, px, py - 2, bt.tagColor(c)]);
      }
    });
    words.forEach(function (w) { tagText(w[0], w[1], w[2], w[3]); });
    bt.defenders.forEach(function (d) {
      if (d.type !== 'golem' && d.type !== 'barricade') return;
      const px = X(d.pad.x), py = Y(d.pad.z, V.defTop(d)) - 6;
      healthBar(px, py, 46, d.down > 0 ? 0 : d.hp / d.max, '#7dff9c');
      if (d.down > 0) tagText(RF.t('tag.rebuild'), px, py - 2, '#c9f6ff');
    });
  }

  function drawGround() {
    const bt = B();
    // Frost Totem cold, burning ground.
    bt.defenders.forEach(function (d) {
      if (d.type !== 'frost') return;
      const r = bt.stat(d).range;
      const gr = g.createRadialGradient(X(d.pad.x), Y(d.pad.z), 0, X(d.pad.x), Y(d.pad.z), r * k);
      gr.addColorStop(0, 'rgba(170,225,255,.04)'); gr.addColorStop(0.8, 'rgba(170,225,255,.14)'); gr.addColorStop(1, 'rgba(170,225,255,.03)');
      oval(d.pad.x, d.pad.z, r, gr, 'rgba(200,240,255,.5)', 1.5);
    });
    bt.burns.forEach(function (b) {
      const a = Math.min(1, b.life / 0.8);
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const an = i * 1.05, rr = i ? b.r * 0.6 : 0;
        light(X(b.x + Math.cos(an) * rr), Y(b.z + Math.sin(an) * rr * 0.8), k * (1.3 + (calm() ? 0 : Math.sin(t * 11 + i * 2) * 0.35)), 'orange', 0.6 * a);
      }
      g.globalCompositeOperation = 'source-over';
    });
  }
  function drawBuildHelp() {
    const bt = B();
    const kind = bt.buildSel ? bt.U.defenders[bt.buildSel].kind : null;
    if (ring && ring.r) {
      oval(ring.pad.x, ring.pad.z, ring.r, 'rgba(255,215,106,.1)', '#ffd76a', 2.5);
    } else if (ring && ring.spot && bt.popup.style.display !== 'none') {
      oval(ring.pad.x, ring.pad.z, 1.5, 'rgba(255,255,255,.2)', '#ffd76a', 3, 0.55);
    }
    if (!kind) { ghostBox(null); return; }
    const open = openGlow(kind);
    const pulse = calm() ? 0.5 : 0.5 + Math.sin(t * 3) * 0.12;
    if (open.mask) {
      g.globalAlpha = 0.36 * (pulse + 0.4);
      g.imageSmoothingEnabled = true;
      g.drawImage(open.mask, ox, oy, RF.field.W * k, RF.field.H * k);
      g.globalAlpha = 1;
    } else {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(184,255,208,' + (0.32 * (pulse + 0.4)) + ')'; g.lineWidth = k * 1.7;
      open.road.forEach(function (run) {
        g.beginPath(); run.forEach(function (p, i) { if (i) g.lineTo(X(p.x), Y(p.z)); else g.moveTo(X(p.x), Y(p.z)); }); g.stroke();
      });
    }
    // The tutorial's suggested spots glow brighter, so there is always an easy place to tap.
    if (bt.tut && bt.tut.allowPads() && bt.tut.step === 2) {
      V.tutSpots(kind).forEach(function (p) { oval(p.x, p.z, 1.45 + (calm() ? 0 : Math.sin(t * 5) * 0.15), 'rgba(125,255,156,.25)', '#7dff9c', 3, 0.55); });
    }
    const spot = cursorSpot ? { x: cursorSpot.x, z: cursorSpot.z, touch: false } : ghost;
    if (!spot) { ghostBox(null); return; }
    const c = checkTap(kind, spot.x, spot.z);
    const lv = bt.U.defenders[bt.buildSel].levels[0];
    const reach = lv.range || lv.radius;
    const main = c.ok ? '#7dff9c' : '#ff6a6a';
    if (reach) oval(c.x, c.z, reach, c.ok ? 'rgba(125,255,156,.12)' : 'rgba(255,106,106,.1)', main, 2.5);
    oval(c.x, c.z, 1.45, c.ok ? 'rgba(125,255,156,.35)' : 'rgba(255,90,90,.4)', main, 3, 0.55);
    const p = pic('defenders', bt.buildSel);
    if (p) stamp(p, X(c.x), Y(c.z), { alpha: c.ok ? 0.75 : 0.45 });
    ghostBox({ touch: spot.touch }, c);
  }

  function drawShots() {
    B().shots.forEach(function (sh) {
      const px = X(sh.x), py = Y(sh.z, sh.y);
      if (sh.shell) {
        oval(sh.x, sh.z, 0.5, 'rgba(0,0,0,.25)', null, 0, 0.45);
        g.globalCompositeOperation = 'lighter'; light(px, py, k * 1.3, 'orange', 0.95); g.globalCompositeOperation = 'source-over';
        g.beginPath(); g.arc(px, py, k * 0.35, 0, Math.PI * 2); g.fillStyle = '#ffd27a'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#5a1c00'; g.stroke();
        return;
      }
      const big = sh.kind === 'bolt' ? sh.size * 0.7 : sh.size || 1;
      const len = k * 0.9 * big;
      g.save(); g.translate(px, py); g.rotate(sh.angle || 0);
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(-len, 0); g.lineTo(0, 0);
      g.lineWidth = Math.max(3.5, k * 0.2 * big); g.strokeStyle = '#2a1805'; g.stroke();
      g.lineWidth = Math.max(1.8, k * 0.1 * big); g.strokeStyle = sh.kind === 'bolt' ? '#bff8ff' : '#ffe9a8'; g.stroke();
      g.beginPath(); g.moveTo(k * 0.28 * big, 0); g.lineTo(-k * 0.12 * big, -k * 0.2 * big); g.lineTo(-k * 0.12 * big, k * 0.2 * big); g.closePath();
      g.fillStyle = '#fff6d8'; g.fill();
      g.restore();
    });
  }
  function drawEffects() {
    g.globalCompositeOperation = 'lighter';
    parts.forEach(function (p) { const f = p.t / p.life; light(X(p.x), Y(p.z, Math.max(0, p.y)), k * (0.45 + f * 0.35), p.color, 1 - f); });
    g.globalCompositeOperation = 'source-over';
    effects.forEach(function (e) {
      const f = e.t / e.life;
      if (e.type === 'ring') {
        const r = e.r0 + (e.r1 - e.r0) * f;
        g.globalAlpha = 1 - f;
        oval(e.x, e.z, r, e.fill ? 'rgba(' + COLOR[e.color] + ',.3)' : null, 'rgb(' + COLOR[e.color] + ')', Math.max(2, k * 0.28 * (1 - f)), 0.75);
        g.globalAlpha = 1;
      } else if (e.type === 'zap') {
        const ax = X(e.a.x), ay = Y(e.a.z, e.a.y), bx = X(e.b.x), by = Y(e.b.z, e.b.y);
        const pts = [[ax, ay]];
        for (let i = 1; i < 7; i++) pts.push([ax + (bx - ax) * i / 7 + (Math.random() - 0.5) * k * 0.9, ay + (by - ay) * i / 7 + (Math.random() - 0.5) * k * 0.9]);
        pts.push([bx, by]);
        g.globalAlpha = 1 - f;
        [[Math.max(5, k * 0.4), 'rgba(255,230,90,.65)'], [Math.max(2, k * 0.14), '#ffffff']].forEach(function (w) {
          g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.lineWidth = w[0]; g.strokeStyle = w[1]; g.stroke();
        });
        g.globalAlpha = 1;
      } else if (e.type === 'meteor') {
        oval(e.x, e.z, e.r, 'rgba(255,140,40,' + (0.12 + f * 0.25) + ')', 'rgba(255,170,60,.9)', 2.5, 0.75);
        const px = X(e.x + 8 * (1 - f)), py = Y(e.z, 22 * (1 - f) + 0.5);
        g.globalCompositeOperation = 'lighter'; light(px, py, k * 3.2, 'orange', 0.95); g.globalCompositeOperation = 'source-over';
        g.beginPath(); g.arc(px, py, k * 0.9, 0, Math.PI * 2); g.fillStyle = '#8a3a14'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#ffb46a'; g.stroke();
      } else if (e.type === 'flash') {
        g.globalAlpha = (calm() ? 0.18 : 0.42) * (1 - f);
        g.fillStyle = 'rgb(' + COLOR[e.color] + ')'; g.fillRect(ox, oy, RF.field.W * k, RF.field.H * k);
        g.globalAlpha = 1;
      }
    });
  }

  // For checking the map data: add ?zones to the address to see where building is blocked.
  const showZones = typeof location !== 'undefined' && /[?&]zones\b/.test(location.search);
  function drawZones() {
    g.fillStyle = 'rgba(80,255,120,.35)';
    for (let x = -31.75; x < 32; x += 0.5) for (let z = -17.75; z < 18; z += 0.5) if (world.check('tower', x, z, []).ok) g.fillRect(X(x) - 2, Y(z) - 2, 4, 4);
    world.spots.forEach(function (p) { oval(p.x, p.z, 0.7, p.kind === 'tower' ? '#ffd76a' : '#ff6ad8', '#000', 1); tagText(p.id, X(p.x), Y(p.z) - 6, '#fff'); });
  }

  // The speed meter (add ?fps to the address).
  const showFps = typeof location !== 'undefined' && /[?&]fps\b/.test(location.search);
  function meter() {
    const now = performance.now();
    if (!fps) {
      fps = { el: D.el('div', null, '', document.body), n: 0, from: now };
      fps.el.style.cssText = 'position:fixed;left:8px;bottom:2px;z-index:70;font:700 13px Lexend,sans-serif;color:#7dff9c;background:rgba(0,0,0,.7);padding:2px 8px;border-radius:6px;pointer-events:none';
    }
    fps.n++;
    if (now - fps.from >= 1000) {
      const v = Math.round(fps.n * 1000 / (now - fps.from));
      fps.el.textContent = v + ' fps · ' + (v >= 50 ? 'Smooth' : v >= 30 ? 'Playable' : 'Choppy') + ' · ' + B().creatures.length + ' creatures';
      fps.n = 0; fps.from = now;
    }
  }

  V.afterRender = function () {
    if (!world) return;
    const bt = B();
    layout();
    background();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(bg, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, shakeX * dpr, shakeY * dpr);
    if (shakeX || shakeY) {
      const im = RF.art.image(RF.data.art.maps[world.L.map]);
      if (im.complete && im.naturalWidth) g.drawImage(im, ox, oy, RF.field.W * k, RF.field.H * k);
    }
    drawRift();
    drawGround();
    bt.defenders.forEach(function (d) { if (FLAT(d)) drawDefender(d); });
    drawBuildHelp();
    // Things nearer the bottom of the map are drawn last, so they stand in front.
    const actors = [{ z: world.camp.z, draw: drawAnchor }, { z: world.camp.z - 0.6, draw: drawHero }];
    bt.defenders.forEach(function (d) { if (!FLAT(d)) actors.push({ z: d.pad.z, draw: drawDefender, a: d }); });
    bt.creatures.forEach(function (c) { actors.push({ z: c.z, draw: drawCreature, a: c }); });
    ghosts.forEach(function (gh) { actors.push({ z: gh.z, draw: drawDefeated, a: gh }); });
    actors.sort(function (a, b) { return a.z - b.z; }).forEach(function (a) { a.draw(a.a); });
    drawShots();
    drawEffects();
    drawBars();
    if (showZones) drawZones();
    if (showFps) meter();
    const put = function (el, x, y, z) {
      const p = V.screenOf(x, y, z);
      el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-100%)';
    };
    put(bt.anchorLabel, world.camp.x, V.anchorY, world.camp.z);
    put(bt.riftLabel, world.rift.x, V.riftY, world.rift.z);
  };
})(window.RF);
