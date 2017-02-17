/* globals __DEV__ */
import Phaser from 'phaser';

export default class extends Phaser.State {
  init() {
    this.gameData = {
      directions: [0, 90, 180, -90],
      swipe:{
        start: {
          x: null,
          y: null,
        },
        end: {
          x: null,
          y: null,
        },
        leeway: 40,
      },
      nextArrow: null,
      gameVelocity: -150,
      arrowFrequency: 1200,
      isOverlapping: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      errors: 0,
    };

    this.add.tween(this.world).to({ alpha: 1 }, 300, Phaser.Easing.Linear.None, true);
  }

  create() {
    // задний фон
    this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');

    // создаём мороженное
    this.icecream = this.add.sprite(this.world.centerX, 0, 'icecream');
    this.icecream.anchor.setTo(0.5, 0);
    this.icecream.scale.setTo(1.6);

    // создаём стрелку-цель
    this.goalArrow = this.add.sprite(this.world.centerX, this.icecream.top + 150, 'goalArrow');
    this.physics.arcade.enable(this.goalArrow);
    this.goalArrow.anchor.setTo(0.5);
    this.goalArrow.scale.setTo(1.1);
    this.goalArrow.alpha = '0.6';

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

    // задний фон для интерфейса
    this.foreground = this.add.tileSprite(0, this.world.height, this.world.width, this.world.width / 3.5, 'foreground');
    this.foreground.anchor.setTo(0, 1);

    // счетчик очков
    this.scoreCounter = this.add.text(50, this.foreground.centerY + 20, '0');
    this.scoreCounter.anchor.setTo(0.5);
    this.scoreCounter.setStyle({ font: '30px Arial', fill: '#1a9c97' });
    this.scoreText = this.add.text(this.scoreCounter.x, this.foreground.centerY - 15, 'Score:');
    this.scoreText.anchor.setTo(0.5);
    this.scoreText.setStyle({ font: '20px Arial', fill: '#1a9c97' });

    // кнопка паузы
    this.pause = this.add.button(this.world.centerX - 35, this.foreground.centerY, 'buttons', this._togglePause, this);
    this.pause.scale.setTo(0.8);
    this.pause.anchor.setTo(0.5);
    this.pause.frame = 0;

    // кнопка управления звуком
    this.soundControl = this.add.button(this.world.centerX + 35, this.foreground.centerY, 'buttons');
    this.soundControl.scale.setTo(0.8);
    this.soundControl.anchor.setTo(0.5);
    this.soundControl.frame = this.game.sound.mute ? 2 : 1;

    // счётчик ошибок
    this.errorCounter = this.game.add.text(this.world.width - 60, this.foreground.centerY + 20, '0 / 3');
    this.errorCounter.anchor.setTo(0.5);
    this.errorCounter.setStyle({ font: '30px Arial', fill: '#CF0808' });
    this.errorText = this.game.add.text(this.errorCounter.x, this.foreground.centerY - 15, 'Errors:');
    this.errorText.anchor.setTo(0.5);
    this.errorText.setStyle({ font: '20px Arial', fill: '#CF0808' });

    // экран паузы
    this.bmd = this.game.add.bitmapData(this.world.width, this.foreground.top);
    this.bmd.fill(249, 234, 236, 0.92);
    this.pausedLogo = this.make.sprite(this.world.centerX, this.foreground.top * 0.5, 'paused');
    this.pausedLogo.scale.setTo(0.7);
    this.pausedLogo.anchor.setTo(0.5);
    this.bmd.draw(this.pausedLogo);
    this.overlay = this.game.add.sprite(0, -this.foreground.top, this.bmd);

    // настраиваем свайпер
    this.input.onDown.add(this._startSwipe, this);
    this.input.onUp.add(this._getSwipeDirection, this);
  }

  update() {
    this.physics.arcade.overlap(this.goalArrow, this.arrows, this._handleArrowKill, this._checkOverlap, this);
  }

  _createArrow() {
    let arrow = this.arrows.getFirstExists(false);
    const direction = this.rnd.pick(this.gameData.directions);

    if(!arrow) {
      arrow = this.arrows.create(this.world.centerX, this.world.height + 20, 'arrow');
    } else {
      arrow.reset(this.world.centerX, this.world.height + 20);
    }

    arrow.angle = direction;
    arrow.anchor.setTo(0.5);
    arrow.scale.setTo(1.1);
    arrow.body.velocity.y = this.gameData.gameVelocity;
  }

  _checkOverlap(goalArrow, arrow) {
    this.gameData.isOverlapping = true;

    if(arrow.centerY < goalArrow.top) {
      this._handleSwipeError('Too late!');
      return true;
    }

    return false;
  }

  _handleArrowKill(goalArrow, arrow) {
    arrow.kill();
    this.gameData.isOverlapping = false;
    this._setNextArrow();
    this._setGoalArrowDirection();
  }

  _setGoalArrowDirection() {
    let target = this.gameData.nextArrow.angle;

    if(this.goalArrow.angle === -180 && target === 90) {
      // костыль :(
      this.goalArrow.angle = 179;
    } else if(this.goalArrow.angle === 90 && target === -180) {
      target = 180;
    }

    this.add.tween(this.goalArrow).to({angle: target}, 200, Phaser.Easing.Linear.None, true);
  }

  _setNextArrow() {
    this.gameData.nextArrow = this.arrows.getClosestTo(this.goalArrow);
  }

  _startSwipe(input) {
    if(input.y > this.foreground.top || this.gameData.isPaused) {
      return;
    }

    this.gameData.swipe.start.x = input.x;
    this.gameData.swipe.start.y = input.y;
  }

  _getSwipeDirection(input) {
    if(input.y > this.foreground.top || this.gameData.isPaused) {
      return;
    }

    this.gameData.swipe.end.x = input.x;
    this.gameData.swipe.end.y = input.y;

    const xDiff = Math.abs(this.gameData.swipe.end.x - this.gameData.swipe.start.x);
    const yDiff = Math.abs(this.gameData.swipe.end.y - this.gameData.swipe.start.y);
    const leeway = this.gameData.swipe.leeway;

    let swipeDirection;

    if(xDiff < leeway && yDiff < leeway) {
      return;
    }

    if(yDiff < xDiff) {
      if(this.gameData.swipe.end.x < this.gameData.swipe.start.x) {
        swipeDirection = -180;
      } else {
        swipeDirection = 0;
      }
    } else {
      if(this.gameData.swipe.end.y < this.gameData.swipe.start.y) {
        swipeDirection = -90;
      } else {
        swipeDirection = 90;
      }
    }

    this._handleSwipe(swipeDirection);
  }

  _handleSwipe(direction) {
    let errorMessage;

    if(!this.gameData.isOverlapping || this.gameData.nextArrow.centerY > this.goalArrow.bottom) {
      errorMessage = "Too early!";
    } else if(direction !== this.gameData.nextArrow.angle) {
      errorMessage = "Wrong direction!"
    }

    if(errorMessage) {
      this._handleSwipeError(errorMessage);
    } else {
      this._handleSwipeSuccess();
    }

    this._handleArrowKill(null, this.gameData.nextArrow);
  }

  _handleSwipeError(msg) {
    if(this.gameData.errors === 3) {
      // this._gameOver();
    } else {
      this.gameData.errors += 1;
      this.errorCounter.setText(`${this.gameData.errors} / 3`);
    }
  }

  _handleSwipeSuccess(){
    this.gameData.score += 1;
    this.scoreCounter.setText(this.gameData.score);
  }

  _togglePause() {
    if(!this.arrowTimer.paused) {
      this.gameData.isPaused = true;
      this.arrowTimer.pause();
      this._toggleOverlay(0);
      this.arrows.setAll('body.enable', false);
    } else {
      this.gameData.isPaused = false;
      this.arrowTimer.resume();
      this._toggleOverlay(-this.foreground.top);
      this.arrows.setAll('body.enable', true);
    }
  }

  _toggleOverlay(destination) {
    this.add.tween(this.overlay).to({ y: destination }, 300, Phaser.Easing.Linear.None, true);

  }

}
