// Starts the game.
window.RF_GAME = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: RF.W,
  height: RF.H,
  backgroundColor: '#0b0e24',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
  scene: [BootScene, LanguageScene, TitleScene, SettingsScene, MessageScene, MicTestScene, BattleScene]
});
