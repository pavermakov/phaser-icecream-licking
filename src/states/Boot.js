import Phaser from 'phaser';

export default class extends Phaser.State {
  init() {
    this.stage.backgroundColor = '#fff';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.renderer.renderSession.roundPixels = true;

    // если возникают какие-то баги с физикой / накладыванием одних объектов на другие,
    // то ВОЗМОЖНО вина в этой строчке
    this.forceSingleUpdate = true;

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
