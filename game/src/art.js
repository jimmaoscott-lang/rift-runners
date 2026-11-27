// Loads the painted pictures listed in data/art.json and keeps ready-to-draw copies of them.
// Each picture is shrunk once to the size it is drawn at, so a frame never shrinks a big picture.
// Defenders that have no painted picture yet get a simple one drawn here (our own art).
window.RF = window.RF || {};
(function (RF) {
  const A = {};
  RF.art = A;
  const images = {};
  let sized = {};

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }
  A.canvas = canvas;

  A.image = function (path) {
    if (!images[path]) {
      const im = new Image();
      im.onerror = function () { console.warn('Picture did not load:', path); };
      im.src = RF.assetURL(path);
      images[path] = im;
    }
    return images[path];
  };
  const ready = function (im) { return im.getContext || (im.complete && im.naturalWidth > 0); };

  // Start loading everything a level needs, so nothing pops in during the first wave.
  A.preload = function (mapName) {
    const D = RF.data.art;
    if (D.maps[mapName]) A.image(D.maps[mapName]);
    [D.creatures, D.defenders, { hero: D.hero }].forEach(function (set) {
      Object.keys(set).forEach(function (k) { if (set[k].file) A.image(set[k].file); });
    });
  };

  // ---------- Stand-in pictures (until Step 4 work orders bring painted ones) ----------
  const standIns = {};
  function standIn(id) {
    if (standIns[id]) return standIns[id];
    const c = canvas(256, 256), g = c.getContext('2d');
    g.lineJoin = 'round'; g.lineCap = 'round';
    const ink = '#1b1410';
    const shape = function (pts, fill) {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(function (p) { g.lineTo(p[0], p[1]); });
      g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = 5; g.strokeStyle = ink; g.stroke();
    };
    const oval = function (x, y, rx, ry, fill) {
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = 5; g.strokeStyle = ink; g.stroke();
    };
    const line = function (pts, w, col) {
      g.beginPath(); g.moveTo(pts[0], pts[1]); g.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
      g.lineWidth = w + 7; g.strokeStyle = ink; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke();
    };
    if (id === 'vine') {
      oval(128, 168, 108, 54, '#3f5a24'); oval(128, 164, 74, 34, '#2c3f1a');
      [[40, 172, 20, 70, 110, 60, 104, 108], [216, 172, 240, 80, 150, 54, 150, 106], [92, 190, 60, 120, 130, 110, 122, 66], [170, 190, 200, 130, 150, 100, 188, 78]].forEach(function (v) { line(v, 15, '#6fae3a'); });
      [[104, 108], [150, 106], [122, 66], [188, 78]].forEach(function (p) { oval(p[0], p[1], 15, 10, '#a6e05a'); });
    } else if (id === 'shrine') {
      shape([[48, 232], [64, 190], [192, 190], [208, 232]], '#8d8a80');
      shape([[72, 190], [82, 160], [174, 160], [184, 190]], '#a7a398');
      shape([[88, 160], [96, 96], [116, 96], [112, 160]], '#bdb8aa'); shape([[168, 160], [160, 96], [140, 96], [144, 160]], '#bdb8aa');
      shape([[78, 96], [128, 62], [178, 96]], '#2f8f6a');
      const gr = g.createRadialGradient(128, 128, 4, 128, 128, 52);
      gr.addColorStop(0, 'rgba(210,255,225,.95)'); gr.addColorStop(1, 'rgba(70,230,140,0)');
      g.fillStyle = gr; g.fillRect(70, 70, 116, 116);
      shape([[128, 100], [146, 128], [128, 156], [110, 128]], '#7dff9c');
      shape([[128, 18], [142, 40], [128, 62], [114, 40]], '#c9ffd8');
    } else { // barricade
      [48, 90, 132, 174].forEach(function (x, i) {
        const top = i % 2 ? 78 : 94;
        shape([[x, 220], [x, top + 26], [x + 17, top], [x + 34, top + 26], [x + 34, 220]], i % 2 ? '#9a6a3a' : '#855a30');
      });
      shape([[28, 134], [228, 120], [230, 146], [30, 160]], '#6b4524'); shape([[28, 182], [228, 172], [230, 196], [30, 208]], '#6b4524');
      [[54, 148], [200, 134], [54, 195], [200, 184]].forEach(function (p) { oval(p[0], p[1], 6, 6, '#c9c3b5'); });
    }
    standIns[id] = c;
    return c;
  }

  // The picture for the build bar and menus, as an address an <img> can show.
  const urls = {};
  A.iconURL = function (id) {
    const d = RF.data.art.defenders[id];
    if (!d) return '';
    if (d.file) return RF.assetURL(d.file);
    if (!urls[id]) urls[id] = standIn(id).toDataURL();
    return urls[id];
  };

  // A copy of an entry's picture at the size it is drawn: { c, w, h } in screen points.
  // 'k' is screen points per map unit, 'dpr' the screen sharpness. variant: '' or 'white' (hit flash).
  A.get = function (set, id, k, dpr, variant, frame) {
    const e = set === 'hero' ? RF.data.art.hero : RF.data.art[set][id];
    const file = e.walk && frame != null ? e.walk[frame % e.walk.length] : e.file;
    const im = file ? A.image(file) : standIn(id);
    if (!ready(im)) return null;
    const key = set + ':' + id + ':' + (variant || '') + ':' + (file || '') + ':' + Math.round(k * dpr * 10);
    if (sized[key]) return sized[key];
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const w = e.w ? e.w * k : e.h * k * iw / ih;
    const h = e.w ? e.w * k * ih / iw : e.h * k;
    const c = canvas(w * dpr, h * dpr), g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, 0, 0, c.width, c.height);
    const wash = variant === 'white' ? '#ffffff' : e.tint;
    if (wash) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = wash; g.fillRect(0, 0, c.width, c.height);
    }
    sized[key] = { c: c, w: w, h: h, e: e };
    return sized[key];
  };
  A.resized = function () { sized = {}; };
})(window.RF);
