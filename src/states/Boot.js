import Phaser from 'phaser';

export default class extends Phaser.State {
  init() {
    this.stage.backgroundColor = 'black';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.setBoundsToWorld();
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    // игра не остановится когда canvas потеряет фокус
    this.stage.disableVisibilityChange = false;
  }

  preload() {
    // подгрузи ассеты для загрузочного экрана тут
    this.load.image('bar', 'assets/images/preloader-bar.png');
  }

  create() {
    this.game.state.start('Preload');
  }
}
