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
  
  ------------------------
  Color Themes I'm Liking:
  ------------------------
    - Mintchoc
    - Soup
    - Joker
    - Heroku
    - Friction
    - Absent
*/

const simon = {

  audioCtx: new(window.AudioContext || window.webkitAudioContext)(),
  frequencies: [165, 220, 277, 330, 100],
  pattern: [],
  playerInput: [],
  currentPad: null,

  init: function() {
    this.note = new Sound(this.audioCtx);
    this.cacheDom();
    this.events.bind.onSwitch.call(this);
    console.log('Game Loaded!');
    console.log('You can switch it on.');
  },

  cacheDom: function() {
    this.dom = document;
    this.center = this.dom.querySelector('.center');
    this.pads = this.dom.querySelectorAll('.pad');
    this.displayCount = this.dom.querySelector('#led > h1');
    this.onSwitch = this.dom.querySelector('.on-switch');
    this.switch = this.dom.querySelector('.switch');
    this.startButton = this.dom.querySelector('#start > .button');
    this.strictButton = this.dom.querySelector('#strict > .button');
  },

  renderCount: function() {
    if (this.pattern.length > 0) {
      this.displayCount.textContent = this.pattern.length;
    } else {
      this.displayCount.textContent = '--';
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

      // Correct pad choice
      if (this.playerInput[this.playerInput.length - 1] === this.pattern[this.playerInput.length - 1]) {
        console.log('good choice!');
        this.play(padNum);

        // Cancle repeat timetout and start it again on mousedown
        this.stopRepeat();
        this.afkRepeatPattern();

        // Wrong pad choice
      } else {
        console.log('you messed up the pattern! >:(');
        this.play(4);

        // Turn off pad clicks
        this.takePadControl();

        this.failMessage();
        setTimeout(this.stop.bind(this), 1000);
        setTimeout(this.padLightOff.bind(this, padNum), 1000);
        return;
      }
    }

    // This codeblock needs to be cleaned up / refactored a little
    if (event.type === 'mouseup') {

      // This might be a little sloppy/hacky way to do this
      // The conditional is to prevent error that happens
      // when mouseup event occurs but this.currentPad remains null
      // i.e. when game is started then turned off but user never clicks a pad
      if (this.currentPad !== null) {
        console.log('pad light off');
        this.padLightOff(this.currentPad);
      }

      if (this.note.gainNode) {
        this.stop();
      }

      if (this.playerInput.length === this.pattern.length) {
        console.log('pattern complete!');

        // Turn off pad clicks - Think I need to add take button control here
        this.takePadControl();

        // Plays the pattern and true makes it add to end of the pattern
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
      this.padLightOn(randomPad);
      setTimeout(() => {
        this.stop();
        this.padLightOff(randomPad);

        // Gives user control to click pads
        this.givePadControl();

        this.afkRepeatPattern();
      }, 300);
    }

    // Plays current pattern then adds a new pad input, calls add()
    function playPattern() {

      let i = 0;
      this.playerInput = [];

      this.playPatternInterval = setInterval(() => {
        this.play(this.pattern[i]);
        this.padLightOn(this.pattern[i]);

        // When I click start button at the same time as last pad in pattern
        // the start button function runs before this, it tries to clear addTimeout too early so it still plays
        this.endPatternTimeout = setTimeout(() => {
          this.stop();
          this.padLightOff(this.pattern[i]);

          if (i === this.pattern.length - 1) {
            clearInterval(this.playPatternInterval);
            if (appendToPattern === true) {
              console.log(this.currentPad);
              this.addTimeout = setTimeout(add, 200);
            } else {
              // Gives user control to click pads (Might need to refactor into a function so I'm not repeating myself)              
              this.givePadControl();              
              this.afkRepeatPattern();
            }
          } else {
            i++;
          }
        }, 300);

      }, 500);
    }

    // I could just use the call method instead of binding here
    // Which I think will be a little bit less confusing

    let add = addRandom.bind(this);
    let pattern = playPattern.bind(this);

    if (this.pattern.length === 0) {
      add();
    } else {
      pattern();
    }
  },

  reset: function() {

    // Kills timeouts and intervals
    this.stopRepeat();
    this.stopPlayPattern();    

    // This cuts off sound and turns off lights immediately
    this.stop();
    for (let i = 0; i < this.pads.length; i++) {
      this.padLightOff(i);      
    }

    // this.padLightOff(this.pattern[i]);
    // this.currentPad = null;
    // this.pattern = [];
    // this.playerInput = [];
    // this.events.unbind.pads.call(this);
    // this.pads.forEach(el => el.classList.remove('can-click'));
    // this.renderCount();
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
      this.takePadControl();
      this.events.unbind.buttons.call(this);
      this.switch.style.float = '';
      this.displayCount.style.color = '';
      this.startButton.classList.remove('can-click');
      this.strictButton.classList.remove('can-click');
      this.reset();
    }
  },

  startGame: function() {

    this.reset();
    this.takePadControl();
    // this.pattern = [];
    // this.playerInput = [];
    // this.renderCount();


    let reinit = function() {
      // console.log(this);
      // this.currentPad = null;
      this.pattern = [];
      this.playerInput = [];
      this.renderCount();
      this.makePattern();
    };

    // this.makePattern();
    setTimeout(reinit.bind(this), 500);
  },

  toggleStrict: function() {
    console.log('i\'ll be strict someday');
  },

  failMessage: function() {

    function endBlink() {
      this.displayCount.classList.remove('blink');
      this.renderCount();
    }

    console.log('You have chosen, poorly.');
    this.displayCount.classList.add('blink');
    this.displayCount.textContent = '☠';
    setTimeout(endBlink.bind(this), 2000);
  },

  // If no or incomplete user input, this will run
  afkRepeatPattern: function() {

    function playOnAFK() {
      this.pads.forEach(el => el.classList.remove('can-click'));
      this.events.unbind.pads.call(this);
      this.makePattern();
    }

    if (this.pattern.length !== this.playerInput.length) {
      this.afkTimer = setTimeout(playOnAFK.bind(this), 3000);
    }
  },

  stopPlayPattern: function() {
    clearInterval(this.playPatternInterval);
    clearTimeout(this.endPatternTimeout);
    clearTimeout(this.addTimeout);
  },

  stopRepeat: function() {
    clearTimeout(this.afkTimer);
  },

  givePadControl: function() {
    this.pads.forEach(el => el.classList.add('can-click'));
    this.events.bind.pads.call(this);
  },

  takePadControl: function() {
    this.pads.forEach(el => el.classList.remove('can-click'));
    this.events.unbind.pads.call(this);
  }
};

window.onload = function() {
  if (this.document.readyState === 'complete') {
    simon.init();
  }
};

// I may be able to stop the game on tabchange and restart it on focus
// to get rid of that bug where the game does not stop the first note 
// played when tab is not focused.
document.onvisibilitychange = function() {
  console.log(document.visibilityState);
  if (document.hidden) {
    console.log('Changed tabs at: ' + new Date().toLocaleTimeString());
  } else {
    console.log('Tab selected at: ' + new Date().toLocaleTimeString());
  }
};
