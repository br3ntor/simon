/* global Sound */
// Simon game refactor

// Audio Setup
const frequencies = [165, 220, 277, 330, 100];
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
const note = new Sound(audioCtx);

// Cache dom
const dom = document;
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
dom.addEventListener('mouseup', onPadClick);
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

  // I want to try and replace this with css pointer-events
  // events.bind.pads.call(this);
}

function takePadControl() {
  this.pads.forEach(el => el.classList.remove('can-click'));
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
  clearTimeout(simonGame.afkTimeout);
}

function repeatIfAFK() {

  function playOnAFK() {
    pads.forEach(el => el.classList.remove('can-click'));
    // this.events.unbind.pads.call(this);
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
    let begin_ms = 500;
    let end_ms = 300;
    let i = 0;

    // Not sure why this is here, I'm sure I will find out
    simonGame.playerInput = [];

    simonGame.playPatternInterval = setInterval(() => {
      playNote(simonGame.pattern[i]);
      padLightOn(simonGame.pattern[i]);

      simonGame.endPatternTimeout = setTimeout(() => {
        stopNote();
        padLightOff(simonGame.pattern[i]);

        if (i === simonGame.pattern.length -1) {
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
    if (simonGame.playerInput[simonGame.playerInput.length -1] === simonGame.pattern[simonGame.playerInput.length - 1]) {
      console.log('Good choice!');
      playNote(padNum);
      
      // Cancle repeat timetout and start it again on mousedown
      clearTimeout(simonGame.afkTimeout);
    
    } else {
      console.log('Bad choice >:(');
      
      takePadControl();
      playNote(4);
      failMessage();

      setTimeout(stopNote, 1000);
      setTimeout(padLightOff, 1000, padNum);
      return;
    }
  }

  if (event.type === 'mouseup') {
    
    if (simonGame.currentPad !== null) {
      console.log('pad light ' + simonGame.currentPad  +  ' off');
      padLightOff(simonGame.currentPad);
    }
    
    if (note.gainNode) {
      stopNote();
    }
    
    if (simonGame.playerInput.length === simonGame.pattern.length) {
      console.log('pattern complete!');
      
      // Turn off pad clicks - Think I need to add take button control here
      takePadControl();
      
      // Plays the pattern and true makes it add to end of the pattern
      setTimeout(makePattern, 500, true);
    }

    repeatIfAFK();
  }


}

function toggleStrict() {}

function toggleOnOff() {}

function startGame() {

}

window.onload = function() {
  if (this.document.readyState === 'complete') {
    simonGame.init();
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
