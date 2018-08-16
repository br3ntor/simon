/* global Sound */
/* 
  ************************
  ** Simon Game for FCC **
  ************************
  To Do:
    - Add function to repeat pattern if error is made
    - Add strict functionality
    - Add functionality for pattern speed as game progresses
    - Make button act like a button, shadows and move on click
    - Add css class to lighten color on click event instead of hover
    - Final touches to CSS
  ************************
*/

const simon = {

  audioCtx: new(window.AudioContext || window.webkitAudioContext)(),
  frequencies: [165, 220, 277, 330, 100],
  pattern: [],
  playerInput: [],
  gameOver: false,
  currentPad: null,

  init: function() {
    this.note = new Sound(this.audioCtx);
    this.cacheDom();
    this.events.bind.onSwitch.call(this);
  },

  cacheDom: function() {
    this.dom = document;
    this.center = this.dom.querySelector('.center');
    this.pads = this.dom.querySelectorAll('.pad');
    this.displayCount = this.dom.querySelector('#led');
    this.onSwitch = this.dom.querySelector('.on-switch');
    this.switch = this.dom.querySelector('.switch');
    this.startButton = this.dom.querySelector('#start > .button');
    this.strictButton = this.dom.querySelector('#strict > .button');
  },

  renderCount: function() {
    if (this.pattern.length > 0) {
      this.displayCount.innerHTML = this.pattern.length;
    } else {
      this.displayCount.innerHTML = '--';
    }
  },

  events: {
    bind: {
      onSwitch: function() {
        this.onSwitch.addEventListener('click', this.toggleOnOff.bind(this));
      },
      buttons: function() {
        this.events.startBind = this.startGame.bind(this);
        this.startButton.addEventListener('click', this.events.startBind);
      },
      pads: function() {
        this.events.padsBind = this.padClickEvent.bind(this);
        this.dom.addEventListener('mouseup', this.events.padsBind);
        this.pads.forEach(element => {
          element.addEventListener('mousedown', this.events.padsBind);
        });
      }
    },
    unbind: {
      buttons: function() {
        this.startButton.removeEventListener('click', this.events.startBind);
      },
      pads: function() {
        this.dom.removeEventListener('mouseup', this.events.padsBind);
        this.pads.forEach(element => {
          element.removeEventListener('mousedown', this.events.padsBind);
        });
      }
    }
  },

  padClickEvent: function(event) {

    const re = /\d/;

    if (event.type === 'mousedown') {

      const padNum = Number(event.target.classList[1].match(re)) - 1;
      this.currentPad = padNum;
      this.playerInput.push(padNum);
      this.padLightOn(padNum);

      if (this.playerInput[this.playerInput.length - 1] === this.pattern[this.playerInput.length - 1]) {
        console.log('good choice!');
        this.play(padNum);
      } else {
        console.log('you messed up the pattern! >:(');
        this.gameOver = true;
        this.play(4);

        // Turn off pad clicks
        this.pads.forEach(el => el.classList.remove('can-click'));
        this.events.unbind.pads.call(this);

        setTimeout(this.stop.bind(this), 1000);
        setTimeout(this.padLightOff.bind(this, padNum), 1000);
      }
    }

    // This codeblock needs to be cleaned up / refactored a little
    if (event.type === 'mouseup' && this.gameOver === false) {

      console.log(this.currentPad);
      this.padLightOff(this.currentPad);

      if (this.note.gainNode) {
        this.stop();
      }

      if (this.playerInput.length === this.pattern.length) {
        console.log('pattern complete!');

        // Turn off pad clicks
        this.pads.forEach(el => el.classList.remove('can-click'));
        this.events.unbind.pads.call(this);

        setTimeout(this.makePattern.bind(this, true), 500);
      }
    }
  },

  randomInt: function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  play: function(padNum) {
    const now = this.audioCtx.currentTime;
    this.note.play(this.frequencies[padNum], now);
  },

  stop: function() {
    this.note.stop(this.audioCtx.currentTime);
  },

  padLightOn: function(pad) {
    this.pads[pad].classList.add(`p-${pad + 1}-active`);
  },

  padLightOff: function(pad) {
    this.pads[pad].classList.remove(`p-${pad + 1}-active`);
  },

  // Because I can't get the audioapi working right.
  introSong: function() {
    const lightsOff = this.padLightOff.bind(this);
    let count = 0;

    function playTone() {
      this.padLightOn(count);
      this.play(count);
      this.stop();
      setTimeout(lightsOff, 200, count);
      count++;
      if (count < 4) {
        setTimeout(playBind, 200);
      }
    }
    let playBind = playTone.bind(this);
    playBind();
  },

  makePattern: function(appendToPattern) {

    function addRandom() {
      let randomPad = this.randomInt(0, 3);
      this.pattern.push(randomPad);
      this.renderCount();
      this.play(randomPad);
      this.pads[randomPad].classList.add(`p-${randomPad + 1}-active`);
      setTimeout(() => {
        this.stop();
        this.pads[randomPad].classList.remove(`p-${randomPad + 1}-active`);

        // Gives user control to click pads
        this.pads.forEach(el => el.classList.add('can-click'));
        this.events.bind.pads.call(this);
        this.noInputRepeat();
      }, 300);
    }

    // Plays current pattern then adds a new pad input, calls add()
    function playPattern() {
      let i = 0;
      this.playerInput = [];
      let interval = setInterval(() => {
        this.play(this.pattern[i]);
        this.padLightOn(this.pattern[i]);

        setTimeout(() => {
          this.stop();
          this.padLightOff(this.pattern[i]);

          if (i === this.pattern.length - 1) {
            clearInterval(interval);
            if (appendToPattern === true) {
              setTimeout(add, 200);
            } else {
              // Gives user control to click pads (Might need to refactor into a function so I'm not repeating myself)
              this.pads.forEach(el => el.classList.add('can-click'));
              this.events.bind.pads.call(this);
            }
          } else {
            i++;
          }
        }, 300);

      }, 500);
    }

    // I could just use the call method instead of binding here
    let add = addRandom.bind(this);
    let pattern = playPattern.bind(this);

    if (this.pattern.length === 0) {
      add();
    } else {
      pattern();
    }

    // This works here but I don't know if I want it here
    // this.pads.forEach(el => el.classList.add('can-click'));
    // this.events.bind.pads.call(this);

  },

  reset: function() {
    this.pattern = [];
    this.playerInput = [];
    this.gameOver = false;
    this.renderCount();
  },

  toggleOnOff: function() {

    function addShine() {
      this.center.classList.add('shine');
    }

    function removeShine() {
      this.center.classList.remove('shine');
    }

    // On: Moves switch, and makes buttons clickable
    // Off: Turns off everything and resets game
    if (this.switch.style.float === '') {
      this.switch.style.float = 'right';
      this.displayCount.style.color = 'red';
      this.startButton.classList.add('can-click');
      this.strictButton.classList.add('can-click');
      this.events.bind.buttons.call(this);
      this.introSong();
      setTimeout(addShine.bind(this), 700);
      // The 1200 is a guess, could be lowered, look in css to find out
      setTimeout(removeShine.bind(this), 1200);
    } else {
      this.events.unbind.buttons.call(this);
      this.events.unbind.pads.call(this);
      this.pads.forEach(el => el.classList.remove('can-click'));
      this.switch.style.float = '';
      this.displayCount.style.color = '';
      this.startButton.classList.remove('can-click');
      this.strictButton.classList.remove('can-click');
      this.reset();
    }
  },

  startGame: function() {
    this.makePattern();
    // this.pads.forEach(el => el.classList.add('can-click'));
    // this.events.bind.pads.call(this);
  },

  toggleStrict: function() {
    console.log('i\'ll be strict someday');
  },

  noInputRepeat: function() {
    function playOnAFK() {
      if (this.playerInput.length === 0) {
        console.log('Player input: ' + this.playerInput);
        // Turn off pad clicks
        this.pads.forEach(el => el.classList.remove('can-click'));
        this.events.unbind.pads.call(this);
        this.makePattern();
      }
    }
    setTimeout(playOnAFK.bind(this), 2000);
  }
};

simon.init();

// Max and Min are inclusive
// function randomInt(min, max) {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1) + min);
// }

// function sameAsPattern(padClicked) {
//   return padClicked === simon.pattern[simon.pattern.length - 1];
// }

// Make pads clickable.
// this.pads.forEach(el => el.classList.add('can-click'));
