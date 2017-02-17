import Phaser from 'phaser';

export default class extends Phaser.State {
  preload() {
    // индикатор загрузки
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'bar');
    this.preloadBar.anchor.setTo(0.5);
    this.load.setPreloadSprite(this.preloadBar);

    // подгрузи ассеты для всей игры здесь
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('action', 'assets/images/action.png');
    this.load.image('paused', 'assets/images/paused.png');
    this.load.image('gameOver', 'assets/images/gameOver.png');
    this.load.image('arrow', 'assets/images/arrow.png');
    this.load.image('goalArrow', 'assets/images/goalArrow.png');
    this.load.image('icecream', 'assets/images/icecream.png');
    this.load.image('foreground', 'assets/images/foreground.png');
    this.load.image('background', 'assets/images/background.png');

    this.load.spritesheet('buttons', 'assets/images/buttons.png', 70, 70);

    // по завершении загрузки ассетов, перейди в другой state
    this.load.onLoadComplete.add(() => {
      this.state.start('Menu');
    }, this);
  }
}
