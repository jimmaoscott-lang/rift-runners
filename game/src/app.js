// Starts the game: loads data, sets up the 3D view, and runs the frame loop.
window.RF = window.RF || {};
(function (RF) {
  const app = {};
  RF.app = app;

  function guessLowPower() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    return cores <= 4 || mem <= 4;
  }

  app.boot = async function () {
    RF.loadSettings();
    RF.metrics.load();
    RF.metrics.touch();
    RF.metrics.save();
    RF.dom.applySettings();
    RF.dom.fit();
    const q = new URLSearchParams(location.search);
    RF.lowPower = q.has('low') ? true : q.has('high') ? false : guessLowPower();

    const [strings, ui, words, world1, units, levels, speech] = await Promise.all([
      RF.loadJSON('data/strings.json'),
      RF.loadJSON('../assets/audio/ui/manifest.json').catch(function () { return { en: {}, es: {} }; }),
      RF.loadJSON('../assets/audio/words/manifest.json').catch(function () { return { en: {}, es: {} }; }),
      RF.loadJSON('data/world1.json'),
      RF.loadJSON('data/units.json'),
      RF.loadJSON('data/levels-w1.json'),
      RF.loadJSON('data/speech.json').catch(function () { return {}; })
    ]);
    RF.strings = strings;
    RF.voiceManifest = ui;
    RF.wordManifest = words;
    RF.data = { world1: world1, units: units, levels: levels, speech: speech };
    // Speak mode: see if the Azure pronunciation check is online (falls back to Chrome if not).
    if (RF.mic) RF.mic.initAzure();

    const renderer = new THREE.WebGLRenderer({ antialias: !RF.lowPower, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(RF.lowPower ? 1 : 1.5, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = RF.lowPower ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    document.getElementById('view').appendChild(renderer.domElement);
    app.renderer = renderer;

    app.world = RF.buildLevel(levels.levels[0]);
    app.resize();
    window.addEventListener('resize', app.resize);

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      app.time = (app.time || 0) + dt;
      if (app.mode === 'map' && RF.map.scene && !(RF.battle && RF.battle.active)) {
        RF.map.update(dt);
        renderer.render(RF.map.scene, RF.map.camera);
        RF.map.afterRender();
      } else {
        if (RF.battle && RF.battle.active) RF.battle.update(dt);
        else app.titleCam(dt);
        app.animateWorld(dt);
        renderer.render(app.world.scene, app.world.camera);
        if (RF.battle && RF.battle.active) RF.battle.afterRender();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.RF_READY = true;

    if (!RF.settings.lang) RF.screens.language();
    else RF.screens.title();
  };

  // Swap in the 3D world for another level (each level has its own trail and layout).
  app.useLevel = function (i) {
    const L = RF.data.levels.levels[i];
    if (app.world && app.world.L === L) return;
    if (app.world) app.world.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    app.world = RF.buildLevel(L);
    app.resize();
  };

  // Shift the picture so the trail sits in the open space left of the Rune Forge and above the build bar.
  app.view = { right: 0, bottom: 0 };
  app.setView = function (right, bottom) { app.view = { right: right, bottom: bottom }; app.resize(); };
  app.resize = function () {
    RF.dom.fit();
    const W = window.innerWidth, H = window.innerHeight;
    if (!app.renderer) return;
    app.renderer.setSize(W, H);
    const cam = app.world.camera;
    const s = RF.dom.scale;
    const r = app.view.right * s, b = app.view.bottom * s;
    if (r || b) {
      const fw = W + r, fh = H + b;
      cam.aspect = fw / fh;
      cam.setViewOffset(fw, fh, r, b, W, H);
    } else {
      cam.aspect = W / H;
      cam.clearViewOffset();
    }
    cam.updateProjectionMatrix();
    if (RF.map) RF.map.resize();
  };

  // Slow circle around the Thornwood behind the title and menus.
  app.titleCam = function (dt) {
    const cam = app.world.camera;
    const t = (app.time || 0) * (RF.settings.reducedMotion ? 0.01 : 0.04);
    cam.fov = 42;
    cam.position.set(-6 + Math.sin(t) * 46, 34, -1 + Math.cos(t) * 46);
    cam.lookAt(-6, 0, -1);
    cam.updateProjectionMatrix();
  };
  app.battleCam = function () {
    const cam = app.world.camera;
    cam.fov = 45;
    cam.position.set(-11.5, 58, 39);
    cam.lookAt(-11.5, 0, -6);
    cam.updateProjectionMatrix();
  };

  // Things that move all the time: the rift glows, the Anchor turns.
  app.animateWorld = function (dt) {
    const w = app.world;
    const t = app.time || 0;
    const calm = RF.settings.reducedMotion;
    if (w.anchorCrystal) {
      w.anchorCrystal.rotation.y += dt * (calm ? 0.2 : 0.8);
      const hurt = w.anchorFlash > 0 ? (w.anchorFlash -= dt) : 0;
      w.anchorCrystal.material.emissiveIntensity = hurt > 0 ? 0.4 + Math.abs(Math.sin(t * 30)) : 1.8;
    }
    if (w.riftG && !calm) {
      w.riftG.children.forEach(function (c, i) {
        if (c.isSprite && i % 3 === 0) c.material.opacity = 0.6 + Math.sin(t * 2 + i) * 0.3;
      });
    }
  };

  window.addEventListener('DOMContentLoaded', function () {
    app.boot().catch(function (e) {
      console.error(e);
      document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:20px Lexend,sans-serif;color:#fff;padding:40px;text-align:center">The game could not start. Please reload the page. (' + String(e.message || e) + ')</div>');
    });
  });
})(window.RF);
