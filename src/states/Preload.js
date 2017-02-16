import Phaser from 'phaser';

export default class extends Phaser.State {
  preload() {
    // индикатор загрузки
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'bar');
    this.preloadBar.anchor.setTo(0.5);
    this.load.setPreloadSprite(this.preloadBar);

    // подгрузи ассеты для всей игры здесь

    // по завершении загрузки ассетов, перейди в другой state
    this.load.onLoadComplete.add(() => {
      this.game.state.start('Menu');
    }, this);
  }
}
