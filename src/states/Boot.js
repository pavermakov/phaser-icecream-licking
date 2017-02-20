import Phaser from 'phaser';

export default class extends Phaser.State {
  init() {
    this.stage.backgroundColor = '#fff';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    if(!Phaser.Device.desktop) {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    }

    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVeritcally = true;
    this.game.renderer.renderSession.roundPixels = true;
    this.forceSingleUpdate = true;
    this.stage.disableVisibilityChange = false;
  }

  preload() {
    this.load.image('bar', 'assets/images/preloader-bar.png');
  }

  create() {
    this.game.state.start('Preload');
  }
}
