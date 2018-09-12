/* global Sound */
// Simon game refactor

// Audio Setup
const frequencies = [165, 220, 277, 330, 100];
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
const note = new Sound(audioCtx);

// Cache dom
const dom = document;
const body = dom.querySelector('body');
const center = dom.querySelector('.center');
const pads = dom.querySelectorAll('.pad');
const displayCount = dom.querySelector('#led > h1');
const switchContainer = dom.querySelector('.on-switch');
const switchButton = dom.querySelector('.switch');
const startButton = dom.querySelector('#start > .button');
const strictButton = dom.querySelector('#strict > .button');

// Bind events to buttons, switch, pads, and dom
switchContainer.addEventListener('click', toggleOnOff);
startButton.addEventListener('click', startGame);
strictButton.addEventListener('click', toggleStrict);
body.addEventListener('mouseup', onPadClick);
pads.forEach(el => el.addEventListener('mousedown', onPadClick));

// Game state
const simonGame = {};

simonGame.init = function() {

  // Properites
  this.pattern = [];
  this.playerInput = [];
  this.currentPad = null;

  // Timers
  this.playPatternInterval = null;
  this.endPatternTimeout = null;
  this.addTimeout = null;
  this.afkTimeout = null;
};


function playNote(padNum) {
  const now = audioCtx.currentTime;
  note.play(frequencies[padNum], now);
}

function stopNote() {
  note.stop(audioCtx.currentTime);
}

function introSong() {
  let count = 0;

  function playTone() {
    padLightOn(count);
    playNote(count);
    stopNote();
    setTimeout(padLightOff, 200, count);
    count++;
    if (count < 4) {
      setTimeout(playTone, 200);
    }
  }
  playTone();
}

function padLightOn(pad) {
  pads[pad].classList.add(`p-${pad + 1}-active`);
}

function padLightOff(pad) {
  pads[pad].classList.remove(`p-${pad + 1}-active`);
}

function givePadControl() {
  pads.forEach(el => el.classList.add('can-click'));
  body.classList.add('can-click');
}

function takePadControl() {
  pads.forEach(el => el.classList.remove('can-click'));
  body.classList.remove('can-click');
}

function renderCount() {
  if (simonGame.pattern.length > 0) {
    displayCount.textContent = simonGame.pattern.length;
  } else {
    displayCount.textContent = '--';
  }
}

function failMessage() {

  function endBlink() {
    displayCount.classList.remove('blink');
    renderCount();
  }

  console.log('You have chosen, poorly.');
  displayCount.classList.add('blink');
  displayCount.textContent = '☠';
  setTimeout(endBlink, 2000);
}

function killTimers() {
  clearInterval(simonGame.playPatternInterval);
  clearTimeout(simonGame.endPatternTimeout);
  clearTimeout(simonGame.addTimeout);
  clearTimeout(simonGame.afkTimeout);
  console.log('killTimers called');
}

function repeatIfAFK() {

  function playOnAFK() {
    pads.forEach(el => el.classList.remove('can-click'));
    makePattern();
  }

  // should I change these names to gamePattern and playerPattern?
  if (simonGame.pattern.length !== simonGame.playerInput.length) {
    simonGame.afkTimeout = setTimeout(playOnAFK, 3000);
  }
}

function makePattern(appendToPattern) {

  function addRandom() {
    let randomPad = Math.floor(Math.random() * Math.floor(4));

    simonGame.pattern.push(randomPad);

    renderCount();
    playNote(randomPad);
    padLightOn(randomPad);

    setTimeout(() => {
      stopNote();
      padLightOff(randomPad);
      givePadControl();
      repeatIfAFK();
    }, 300);
  }

  function playPattern() {
    const begin_ms = 500;
    const end_ms = 300;
    let i = 0;

    // Not sure why this is here, I'm sure I will find out
    simonGame.playerInput = [];

    simonGame.playPatternInterval = setInterval(() => {
      playNote(simonGame.pattern[i]);
      padLightOn(simonGame.pattern[i]);

      simonGame.endPatternTimeout = setTimeout(() => {
        stopNote();
        padLightOff(simonGame.pattern[i]);

        if (i === simonGame.pattern.length - 1) {
          clearInterval(simonGame.playPatternInterval);

          if (appendToPattern === true) {
            simonGame.addTimeout = setTimeout(addRandom, 200);
          } else {
            givePadControl();
            repeatIfAFK();
          }
        } else {
          i++;
        }
      }, end_ms);

    }, begin_ms);
  }

  if (simonGame.pattern.length === 0) {
    addRandom();
  } else {
    playPattern();
  }
}

function onPadClick(event) {

  if (event.type === 'mousedown') {
    const re = /\d/;
    const padNum = Number(event.target.classList[1].match(re)) - 1;
    simonGame.currentPad = padNum;
    simonGame.playerInput.push(padNum);
    padLightOn(padNum);

    // Correct pad choice
    if (simonGame.playerInput[simonGame.playerInput.length - 1] === simonGame.pattern[simonGame.playerInput.length - 1]) {
      console.log('Good choice!');
      playNote(padNum);

      // Cancle repeat timetout and start it again
      clearTimeout(simonGame.afkTimeout);
      // repeatIfAFK();

    } else {
      console.log('Bad choice >:(');

      // I need this to take control of the mouseup event on the document
      takePadControl();
      playNote(4);
      failMessage();

      setTimeout(stopNote, 1000);
      setTimeout(padLightOff, 1000, padNum);
      return;
    }
  }

  // This is so you can let go even off the pad itself
  if (event.type === 'mouseup' && note.gainNode) {
    
    if (note.gainNode.gain.value > 0.3) {
      padLightOff(simonGame.currentPad);
      stopNote();
      repeatIfAFK();
    }

    if (simonGame.playerInput.length === simonGame.pattern.length && simonGame.pattern.length > 0) {
      console.log('pattern complete!');

      // Turn off pad clicks - Think I need to add take button control here
      takePadControl();

      // Plays the pattern and true makes it add to end of the pattern
      setTimeout(makePattern, 500, true);
    }
  }
}

function toggleStrict() {}

function toggleOnOff() {

  function addShine() {
    center.classList.add('shine');
  }

  function removeShine() {
    center.classList.remove('shine');
  }

  function flipOn() {
    switchButton.style.float = 'right';
    displayCount.style.color = 'red';
    startButton.classList.add('can-click');
    strictButton.classList.add('can-click');

    givePadControl();
    introSong();

    // The 1200 is a guess, could be lowered, look in css to find out
    setTimeout(addShine, 700);
    setTimeout(removeShine, 1200);
  }

  function flipOff() {
    switchButton.style.float = '';
    displayCount.style.color = '';
    displayCount.textContent = '--';
    startButton.classList.remove('can-click');
    strictButton.classList.remove('can-click');

    killTimers();
    takePadControl();    
  }

  if (switchButton.style.float === '') flipOn();
  else flipOff();
}

function startGame() {


  killTimers();
  takePadControl();

  simonGame.init();
  // renderCount();


  let freshStart = function() {
    // simonGame.currentPad = null;
    // simonGame.pattern = [];
    // simonGame.playerInput = [];
    // simonGame.init();
    // renderCount();
    makePattern();
  };

  setTimeout(freshStart, 500);
}

window.onload = function() {
  console.log('Game is ready and initialized!');
  simonGame.init();
};

// Stop game on tab change or minimize and restart on focus
document.onvisibilitychange = function() {
  if (document.hidden) {
    console.log('Changed tabs at: ' + new Date().toLocaleTimeString());
    stopNote();
    takePadControl();
    killTimers();
    for (let i = 0; i < pads.length; i++) padLightOff(i);
    
  } else {
    console.log('Tab selected at: ' + new Date().toLocaleTimeString());
    makePattern();
  }
};
