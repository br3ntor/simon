/* global Sound */

// Refactor of simon.js

//   Color Themes I like: Lichen, Abscent, MintChoc

// To Do:
//   - Tune up css, border size of buttons, background color of strict button
//   - add key bindings
//   - When I hit start after afk error the first tone is cut short, line 153
//   - I want to make the pad starting color darker I think
//   - Add mobile touch ability
//   - Make it responsive if possible
// Currently working on:
//            * Adding speed as game pattern length increases.  *

// Audio Setup
const frequencies = [164.81, 220, 277.18, 329.63, 98];
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
const note = new Sound(audioCtx);

// Cache dom
const dom = document;
const body = dom.querySelector('body');
const center = dom.querySelector('.center');
const pads = dom.querySelectorAll('.pad');
const displayCount = dom.querySelector('#led > h1');
const strictLED = dom.querySelector('.strict-led');
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

simonGame.strictOn = false;

simonGame.init = function() {

  // Properites
  this.pattern = [];
  this.playerInput = [];
  this.currentPad = null;
  this.gameSpeed = null;

  // Timers - This is mostly to keep track of them
  this.playPatternInterval = null;
  this.endPatternTimeout = null;
  this.addTimeout = null;
  this.afkTimeout = null;
  this.wrongChoiceTimeout = null;
  this.startTimeout = null;
  this.afkPatternTimeout = null;
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

function padLightOffAll() {
  for (let i = 0; i < pads.length; i++) padLightOff(i);
}

function givePadControl() {
  pads.forEach(el => el.classList.add('can-click'));
  body.classList.add('pe');
}

function takePadControl() {
  pads.forEach(el => el.classList.remove('can-click'));
  body.classList.remove('pe');
}

function renderCount() {
  if (simonGame.pattern.length > 0) {
    displayCount.textContent = simonGame.pattern.length;
  } else {
    displayCount.textContent = '--';
  }
}

function killTimers() {
  clearInterval(simonGame.playPatternInterval);
  clearTimeout(simonGame.endPatternTimeout);
  clearTimeout(simonGame.addTimeout);
  clearTimeout(simonGame.afkTimeout);
  clearTimeout(simonGame.wrongChoiceTimeout);
  clearTimeout(simonGame.startTimeout);
  clearTimeout(simonGame.afkPatternTimeout);
  console.log('killTimers called');
}

function failMessage() {

  function endBlink() {
    displayCount.classList.remove('blink');
    renderCount();
  }

  console.log('Wrong choice or AFK.');
  displayCount.classList.add('blink');
  displayCount.textContent = '☠';
  setTimeout(endBlink, 2000);
}

function repeatIfAFK() {

  function playOnAFK() {

    takePadControl();
    playNote(4);
    failMessage();

    // After afk runs, if start is pressed, this still runs and stop the starting note early
    // Will probably just define in gamestate and clearTimeouts
    setTimeout(stopNote, 1000);

    if (simonGame.strictOn === true) {
      simonGame.pattern = [];
    }
    console.log('this is running');
    // Try adding this to the list
    // setTimeout(makePattern, 2000);
    simonGame.afkPatternTimeout = setTimeout(makePattern, 2000);
  }

  if (simonGame.pattern.length !== simonGame.playerInput.length) {
    simonGame.afkTimeout = setTimeout(playOnAFK, 3000);
  }
}

function makePattern(appendToPattern) {
  const speed = [0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  const patternLength = simonGame.pattern.length;
  
  // Incrementally select from speed array every X tones.
  if (patternLength % 4 === 0) {
    simonGame.gameSpeed = patternLength / 4;
  } 

  const noteStart = 1000 * speed[simonGame.gameSpeed];
  const noteLength = 600 * speed[simonGame.gameSpeed];
  const restLength = noteStart - noteLength;

  // Reset player input array
  simonGame.playerInput = [];

  function addRandom() {
    let randomPad = Math.floor(Math.random() * Math.floor(4));

    simonGame.pattern.push(randomPad);

    renderCount();
    playNote(randomPad);
    padLightOn(randomPad);

    // Anonymous timeout here!
    // I might have to add this to simonState so I can kill it
    setTimeout(() => {
      stopNote();
      padLightOff(randomPad);
      givePadControl();
      repeatIfAFK();
    }, noteLength);
  }

  function playPattern() {
    let i = 0;

    simonGame.playPatternInterval = setInterval(() => {
      playNote(simonGame.pattern[i]);
      padLightOn(simonGame.pattern[i]);

      simonGame.endPatternTimeout = setTimeout(() => {
        stopNote();
        padLightOff(simonGame.pattern[i]);

        // If iterator is equal to length of game pattern
        if (i === simonGame.pattern.length - 1) {
          clearInterval(simonGame.playPatternInterval);

          if (appendToPattern === true) {
            simonGame.addTimeout = setTimeout(addRandom, restLength);
          } else {
            givePadControl();
            repeatIfAFK();
          }
        } else {
          i++;
        }
      }, noteLength);

    }, noteStart);
  }

  if (simonGame.pattern.length === 0) addRandom();
  else playPattern();
}

function onPadClick(event) {

  if (event.type === 'mousedown') {
    const re = /\d/;
    const padNum = Number(event.target.classList[1].match(re)) - 1;
    simonGame.currentPad = padNum;

    // Cancle repeat timetout if a pad clicked, and start it again on mouseup
    clearTimeout(simonGame.afkTimeout);
    padLightOn(padNum);
    simonGame.playerInput.push(padNum);

    // Correct pad choice, else incorrect
    if (simonGame.playerInput[simonGame.playerInput.length - 1] === simonGame.pattern[simonGame.playerInput.length - 1]) {
      console.log('Good choice!');
      playNote(padNum);

    } else {
      console.log('Bad choice >:(');

      simonGame.currentPad = null;
      takePadControl();
      playNote(4);
      failMessage();

      setTimeout(stopNote, 1000);
      setTimeout(padLightOff, 1000, padNum);

      if (simonGame.strictOn === true) {
        simonGame.pattern = [];
      }

      simonGame.wrongChoiceTimeout = setTimeout(makePattern, 2000);
    }
  }

  // I check if currentPad is a number so this only passes if a pad has been pressed
  // It then reset currentPad to null so this won't pass unless a pad is clicked first
  if (event.type === 'mouseup' && Number.isInteger(simonGame.currentPad)) {

    // This if statement may not be needed since the isInteger serves as such a strong gatekeeper
    if (note.gainNode.gain.value > 0.3) {
      console.log('noteOff');
      padLightOff(simonGame.currentPad);
      simonGame.currentPad = null;
      stopNote();
      repeatIfAFK();
    }

    if (simonGame.playerInput.length === simonGame.pattern.length && simonGame.pattern.length > 0) {
      console.log('pattern complete!');
      takePadControl();

      // Plays the pattern and true makes it add to end of the pattern
      setTimeout(makePattern, 500, true);
    }
  }
}

function toggleStrict() {
  if (simonGame.strictOn === false) {
    simonGame.strictOn = true;
    strictLED.style.background = '#e50000';

  } else {
    simonGame.strictOn = false;
    strictLED.style.background = '';
  }
}

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

    // If I wanted to allow pads to be played for fun I will need givePadControl
    // givePadControl();
    introSong();

    // The 1200 is a guess, could be lowered, look in css to find out
    setTimeout(addShine, 700);
    setTimeout(removeShine, 1200);
  }

  // I think I need to add simonGame.init or a simonGame.pattern = 0 here
  function flipOff() {
    switchButton.style.float = '';
    displayCount.style.color = '';
    displayCount.textContent = '--';
    startButton.classList.remove('can-click');
    strictButton.classList.remove('can-click');
    simonGame.strictOn = false;
    strictLED.style.background = '';
    simonGame.pattern = [];

    stopNote();
    killTimers();
    takePadControl();
    padLightOffAll();
  }

  if (switchButton.style.float === '') flipOn();
  else flipOff();
}

function startGame() {
  stopNote();
  padLightOffAll();
  killTimers();
  takePadControl();
  simonGame.init();
  renderCount();

  simonGame.startTimeout = setTimeout(makePattern, 500);
}

window.onload = function() {
  console.log('Game is ready and initialized!');
  
  // If I initialize it here it prevents errors in onvisibilitychange when triggered before starting game
  simonGame.init();
};

// Stop game on tab change or minimize and restart on focus
document.onvisibilitychange = function() {
  if (document.hidden) {
    console.log('Changed tabs at: ' + new Date().toLocaleTimeString());

    if (note.gainNode) stopNote();

    killTimers();
    takePadControl();
    padLightOffAll();

  } else {
    console.log('Tab selected at: ' + new Date().toLocaleTimeString());
    if (simonGame.pattern.length > 0) makePattern();
  }
};
