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
      successPhrases:['good job!', 'well done!', 'you are natural!', 'terrific!', 'outstanding!'],
      gameVelocity: 150,
      arrowFrequency: 1300,
      nextIndex: 0,
      upcomingArrow: null,
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
    this.background.alpha = '0.5';

    // создаём мороженное
    this.icecream = this.add.sprite(this.world.centerX, this.world.height, 'icecream');
    this.icecream.anchor.setTo(0.5, 1);

    // путь движения стрелок
    this.path = this.add.graphics(0, 0);
    this.path.beginFill(0xffe9bb, 0.4);
    this.path.drawRect(0, 0, 70, this.world.height);
    this.path.endFill();
    this.path.alignTo(this.world.bounds, Phaser.TOP_CENTER, null, -this.world.height)

    // создаём стрелку-цель
    this.goalArrow = this.add.sprite(this.world.centerX, this.icecream.centerY - 30, 'goalArrow');
    this.physics.arcade.enable(this.goalArrow);
    this.goalArrow.anchor.setTo(0.5);
    this.goalArrow.scale.setTo(1.1);
    this.goalArrow.alpha = '0.65';

    // создаём вертикальные стрелки
    this.arrows = this.add.group();
    this.arrows.enableBody = true;
    this._createArrow();
    this._setUpcomingArrow();

    // стрелка-цель должна смотреть в ту же сторону, что и следующая стрелка
    this._setGoalArrowDirection();

    // задний фон для интерфейса
    this.foreground = this.add.tileSprite(0, this.world.height, this.world.width, Math.floor(this.world.width * 0.35), 'foreground');
    this.foreground.anchor.setTo(0, 1);

    // счетчик очков
    this.scoreCounter = this.add.text(50, this.foreground.centerY + 20, '0');
    this.scoreCounter.anchor.setTo(0.5);
    this.scoreCounter.setStyle({ font: '30px Arial', fill: '#1a9c97' });

    this.scoreText = this.add.bitmapText(this.scoreCounter.x, this.foreground.centerY - 15, 'gecko', 'Score:', 30);
    this.scoreText.anchor.setTo(0.5);
    this.scoreText.tint = 0x339999;

    // кнопка паузы
    this.pause = this.add.button(this.world.centerX - 35, this.foreground.centerY, 'buttons', this._togglePause, this);
    this.pause.scale.setTo(0.8);
    this.pause.anchor.setTo(0.5);
    this.pause.frame = 0;

    // кнопка управления звуком
    this.soundControl = this.add.button(this.world.centerX + 35, this.foreground.centerY, 'buttons', this._toggleSound, this);
    this.soundControl.scale.setTo(0.8);
    this.soundControl.anchor.setTo(0.5);
    this.soundControl.frame = this.game.sound.mute ? 2 : 1;

    // счётчик ошибок
    this.errorCounter = this.game.add.text(this.world.width - 60, this.foreground.centerY + 20, '0 / 3');
    this.errorCounter.anchor.setTo(0.5);
    this.errorCounter.setStyle({ font: '30px Arial', fill: '#CF0808' });

    this.errorText = this.game.add.bitmapText(this.errorCounter.x, this.foreground.centerY - 15, 'gecko', 'Errors:', 30);
    this.errorText.anchor.setTo(0.5);
    this.errorText.tint = 0xCF0808;

    // всплывающие сообщения
    this.screenMessages = this.add.group();

    // настраиваем свайпер
    this.input.onDown.add(this._startSwipe, this);
    this.input.onUp.add(this._getSwipeDirection, this);

    // экран паузы
    this.pauseOverlay = this._createOverlay('paused');
    this.stopOverlay = this._createOverlay('gameOver');
    this.stopOverlay.inputEnabled = true;

    // Звуки
    this.success = this.add.audio('success', 0.3, false);
    this.fail = this.add.audio('fail', 0.3, false);

    if(!this.backgroundSound || !this.backgroundSound.isPlaying){
      this.backgroundSound = this.add.audio('background', 0.5, true);
      this.backgroundSound.play();
    }

    // таймер, контролирующий появление стрелок
    this.arrowTimer = this.time.create(false);
    this.arrowTimer.loop(this.gameData.arrowFrequency, this._createArrow, this);
    this.arrowTimer.start();

    // таймер, контролирующий скорость игры
    this.gameTimer = this.time.create(false);
    this.gameTimer.loop(Phaser.Timer.SECOND * 3, this._levelUp, this);
    this.gameTimer.start();
  }

  update() {
    this.physics.arcade.overlap(this.goalArrow, this.arrows, this._handleOverlap, null, this);
  }

  _createArrow() {
    let arrow = this.arrows.getFirstExists(false);
    const direction = this.rnd.pick(this.gameData.directions);
    const y = -this.cache.getImage('arrow').height;

    if(!arrow) {
      arrow = this.arrows.create(this.world.centerX, y, 'arrow');
    } else {
      arrow.reset(this.world.centerX, y);
    }

    arrow.angle = direction;
    arrow.alpha = 1;
    arrow.anchor.setTo(0.5);
    arrow.checkWorldBounds = true;
    arrow.body.velocity.y = this.gameData.gameVelocity;
    arrow.events.onOutOfBounds.add(this._handleOutOfBounds, this);

    console.log(this.arrows.length)
  }

  _levelUp() {
    if(this.arrows.length < 5) {
      this.arrowTimer.events[0].delay *= 0.95;
      this.gameData.gameVelocity *= 1.05;
    } else {
      this.arrowTimer.events[0].delay *= 0.9;
    }

    this.arrows.setAll('body.velocity.y', this.gameData.gameVelocity);
  }

  _handleOverlap(goalArrow, arrow) {
    this.gameData.isOverlapping = true;

    if(arrow.centerY > goalArrow.bottom) {
      if(arrow === this.gameData.upcomingArrow) {
        this._handleError("Too Late!");
        this._proceedToNext();
      }
    }
  }

  _handleOutOfBounds(arrow) {
    if(arrow.y > this.game.height) {
      arrow.kill();
    }
  }

  _setGoalArrowDirection() {
    let target = this.gameData.upcomingArrow.angle;
    // опять пофиксить
    if(this.goalArrow.angle === -180 && target === 90) {
      // костыль :(
      this.goalArrow.angle = 179;
    } else if(this.goalArrow.angle === 90 && target === -180) {
      target = 179;
    }

    this.add.tween(this.goalArrow).to({angle: target}, 200, Phaser.Easing.Linear.None, true);
  }

  _setUpcomingArrow() {
    this.gameData.nextIndex = this.gameData.nextIndex + 1 === this.arrows.length ? 0 :  this.gameData.nextIndex + 1;
    this.gameData.upcomingArrow = this.arrows.getAt(this.gameData.nextIndex);
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

    if(!this.gameData.isOverlapping || this.gameData.upcomingArrow.centerY < this.goalArrow.top) {
      errorMessage = "Too early!";
    } else if(direction !== this.gameData.upcomingArrow.angle) {
      errorMessage = "Wrong direction!";
    }

    if(errorMessage) {
      this._handleError(errorMessage);
      if(!this.gameData.upcomingArrow.body.touching.none) {
        this._proceedToNext();
      }
    } else {
      this._handleSuccess();
      this._proceedToNext();
    }
  }

  _proceedToNext() {
    this.gameData.isOverlapping = false;
    this.add.tween(this.gameData.upcomingArrow).to({ alpha: 0 }, 500, Phaser.Easing.Linear.None, true);
    this._setUpcomingArrow();
    this._setGoalArrowDirection();
  }

  _handleError(msg) {
    this._shake(this.gameData.upcomingArrow);
    this._showMessage(true, msg);

    this.fail.play();
    if(this.gameData.errors === 3) {
      this.gameData.isGameOver = true;
      this._togglePause();
    } else {
      this.gameData.errors += 1;
      this.errorCounter.setText(`${this.gameData.errors} / 3`);
    }
  }

  _handleSuccess() {
    this.success.play();
    this._showMessage(false, this.rnd.pick(this.gameData.successPhrases));
    this.scoreCounter.text = this.gameData.score + 1;
  }

  _togglePause() {
    if(!this.arrowTimer.paused) {
      this.gameData.isPaused = true;
      this.arrowTimer.pause();
      this.arrows.setAll('body.enable', false);

      if(this.gameData.isGameOver) {
        this._disable(this.pause);
        this.gameTimer.stop();
        this._toggleOverlay(this.stopOverlay, 0, this._restart);
      } else {
        this._toggleOverlay(this.pauseOverlay, 0);
      }
    } else {
      this.gameData.isPaused = false;
      this.arrowTimer.resume();
      this._toggleOverlay(this.pauseOverlay, -this.foreground.top);
      this.arrows.setAll('body.enable', true);
    }
  }

  _toggleSound() {
    this.sound.mute = !this.sound.mute;
    this.soundControl.frame = this.sound.mute ? 2 : 1;
  }

  _createOverlay(key) {
    const bmd = this.add.bitmapData(this.world.width, this.foreground.top);
    bmd.fill(249, 234, 236, 0.92);

    const logo = this.make.sprite(this.world.centerX, Math.floor(this.foreground.top * 0.5), key);
    logo.scale.setTo(0.7);
    logo.anchor.setTo(0.5);

    bmd.draw(logo);

    return this.game.add.sprite(0, -this.foreground.top, bmd);
  }

  _toggleOverlay(target, destination, callback) {
    const slide = this.add.tween(target).to({ y: destination }, 300, Phaser.Easing.Linear.None);

    if(callback) {
      slide.onComplete.add(() => {
        target.events.onInputDown.addOnce(callback, this);
      }, this);
    }

    slide.start();
  }

  _disable(obj) {
    obj.inputEnabled = false;
    obj.alpha = '0.5';
  }

  _shake(obj) {
    const shakeStart = this.add.tween(obj).to({ x: '+5'}, 50, Phaser.Easing.Linear.None, true);
    const shakeMiddle = this.add.tween(obj).to({ x: '-10'}, 50, Phaser.Easing.Linear.None);
    const shakeEnd = this.add.tween(obj).to({ x: '+5'}, 50, Phaser.Easing.Linear.None);
    shakeStart.chain(shakeMiddle, shakeEnd);
  }

  _showMessage(isError, message) {
    const x = isError ? Math.floor(this.world.width * 0.75) : Math.floor(this.world.width * 0.25);
    const y = this.rnd.realInRange(this.world.centerY, 0);

    const msg = this.add.bitmapText(x, y, 'gecko', message, 20);
    msg.alpha = 0;
    msg.anchor.setTo(0.5);
    msg.tint = isError ? 0xCF0808 : 0x1a9c97;

    const fadeStart = this.add.tween(msg).to({ alpha: 1 }, 450, Phaser.Easing.Linear.None, true);
    const fadeEnd = this.add.tween(msg).to({ alpha: 0 }, 350, Phaser.Easing.Linear.None);
    fadeStart.chain(fadeEnd);
  }

  _restart() {
    this.state.start('Game');
  }
}
