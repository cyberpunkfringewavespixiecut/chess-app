/* sound.js — all sound logic */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration = 0.12, volume = 0.15) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.05);
}

function playMoveSound() { playTone(420, 0.12, 0.12); }
function playCaptureSound() { playTone(540, 0.16, 0.16); }
function playCheckSound() { playTone(680, 0.18, 0.18); }
function playCheckmateSound() { playTone(820, 0.22, 0.2); }

function playMoveSounds(resultType) {
  if (resultType === "checkmate") {
    playCheckmateSound();
  } else if (resultType === "check") {
    playCheckSound();
  } else if (resultType === "capture") {
    playCaptureSound();
  } else {
    playMoveSound();
  }
}
