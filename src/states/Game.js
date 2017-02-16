/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init() {
    this.gameData = {
      arrowParams: [{
        direction: 'up',
        angle: -90,
      }, {
        direction: 'down',
        angle: 90,
      }, {
        direction: 'left',
        angle: 180,
      }, {
        direction: 'right',
        angle: 0,
      }],
      nextArrow: null,
      gameVelocity: -120,
      arrowFrequency: 1500,
    };
  }

  create() {
    // задний фон
    this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');

    // создаём мороженное
    this.icecream = this.add.sprite(this.world.centerX, this.world.centerY - 30, 'icecream');
    this.icecream.anchor.setTo(0.5);
    this.icecream.scale.setTo(1.5);

    // создаём стрелку-цель
    this.goalArrow = this.add.sprite(this.world.centerX, 50, 'goalArrow');
    this.physics.arcade.enable(this.goalArrow);
    this.goalArrow.anchor.setTo(0.5);
    this.goalArrow.alpha = '0.5';

    // создаём вертикальные стрелки
    this.arrows = this.add.group();
    this.arrows.enableBody = true;
    this._createArrow();
    this._setNextArrow();

    // стрелка-цель должна смотреть в ту же сторону, что и следующая стрелка
    this._setGoalArrowDirection();

    // таймер, контролирующий появление стрелок
    this.arrowTimer = this.time.create(false);
    this.arrowTimer.loop(this.gameData.arrowFrequency, this._createArrow, this);
    this.arrowTimer.start();
  }

  update() {
    this.physics.arcade.overlap(this.goalArrow, this.arrows, this._handleArrowKill, this._checkOverlap, this);
  }

  _createArrow() {
    let arrow = this.arrows.getFirstExists(false);
    const arrowParam = this.rnd.pick(this.gameData.arrowParams);

    if(!arrow) {
      arrow = this.arrows.create(this.world.centerX, this.world.height + 20, 'arrow');
    } else {
      arrow.reset(this.world.centerX, this.world.height + 20);
    }

    arrow.angle = arrowParam.angle;
    arrow.anchor.setTo(0.5);
    arrow.body.velocity.y = this.gameData.gameVelocity;

  }

  _checkOverlap(goalArrow, arrow) {
    return arrow.centerY < goalArrow.top;
  }

  _handleArrowKill(goalArrow, arrow) {
    arrow.kill();
    this._setNextArrow();
    this._setGoalArrowDirection();
  }

  _setGoalArrowDirection() {
    // пофиксить развороты стрелки-цели
    let target = this.gameData.nextArrow.angle;

    if(this.goalArrow.angle === 180 && this.gameData.nextArrow.direction === "up") {
      this.goalArrow.angle = -180;
    } else if(this.goalArrow.angle === -180 && this.gameData.nextArrow.direction === "down") {
      this.goalArrow.angle = 180;
    } 

    this.add.tween(this.goalArrow).to({angle: target}, 200, Phaser.Easing.Linear.None, true);
  }

  _setNextArrow() {
    this.gameData.nextArrow = this.arrows.getClosestTo(this.goalArrow);
  }

}
