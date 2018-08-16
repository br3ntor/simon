// This approach creates the oscillator each time play is called

class Sound {

  constructor(context) {
    this.context = context;
  }

  init() {
    // Create source and effects nodes
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    // Connect source -> effect nodes -> destination
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = 'triangle';
  }

  play(value, time) {
    this.init();
    this.oscillator.frequency.value = value;
    this.gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
    this.oscillator.start(time);
  }

  stop(time) {
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    this.oscillator.stop(time + 0.5);
  }
}