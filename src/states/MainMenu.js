import Phaser from 'phaser'

export default class extends Phaser.State {

  create() {
    this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');
    this.background.alpha = '0.5';
    this.background.autoScroll(10, 40);

    this.logo = this.add.sprite(this.world.centerX, this.world.height * 0.25, 'logo');
    this.logo.anchor.setTo(0.5);

    this.action = this.add.sprite(this.world.centerX, this.world.height * 0.75, 'action');
    this.action.scale.setTo(0.7);
    this.action.anchor.setTo(0.5);

    this.add.tween(this.action.scale).to({x: 1.2, y: 1.2}, 600, Phaser.Easing.Linear.None, true, 0, null, true);

    this.input.onDown.add(this._applyTransition, this);
  }

  _applyTransition() {
    this.add.tween(this.world).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true).onComplete.add(() => {
      this.state.start('Game');
    }, this);
  }

}
