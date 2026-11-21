// Loads settings, text, the voice list and fonts, then opens the first screen.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const loading = this.add.text(RF.W / 2, RF.H / 2, 'Loading...', {
      fontFamily: 'sans-serif', fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5);
    RF.ui.makeTextures(this);
    this.loadAll().then(() => {
      loading.destroy();
      this.scene.start(RF.settings.lang ? 'Title' : 'Language');
    }).catch((err) => {
      console.error(err);
      loading.setText('Something went wrong loading the game.\nRefresh the page to try again.');
    });
  }

  async loadAll() {
    RF.loadSettings();
    RF.strings = await RF.loadJSON('data/strings.json');
    RF.content = { world1: await RF.loadJSON('data/world1.json') };
    RF.metrics.load();
    RF.metrics.touch();
    RF.metrics.save();
    try {
      RF.wordManifest = await RF.loadJSON('../assets/audio/words/manifest.json');
    } catch (e) {
      RF.wordManifest = { en: {}, es: {} };
    }
    try {
      RF.voiceManifest = await RF.loadJSON('../assets/audio/ui/manifest.json');
    } catch (e) {
      // No voice files yet: the built-in Chromebook voice is used instead.
      RF.voiceManifest = { en: {}, es: {} };
    }
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('400 32px Lexend'),
        document.fonts.load('700 32px Lexend'),
        document.fonts.load('400 32px OpenDyslexic'),
        document.fonts.load('700 32px OpenDyslexic')
      ]);
    }
  }
}
