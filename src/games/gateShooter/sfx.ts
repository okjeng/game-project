import { playNoiseBurst, playSequence, playTone, startMusic, stopMusic, unlockAudio, type MusicTrack } from "../../lib/sound";

const BGM: MusicTrack = {
  bpm: 132,
  bass: [
    { freq: 130.81, beats: 1 }, // C3
    { freq: 130.81, beats: 1 },
    { freq: 196.0, beats: 1 }, // G3
    { freq: 196.0, beats: 1 },
    { freq: 174.61, beats: 1 }, // F3
    { freq: 174.61, beats: 1 },
    { freq: 196.0, beats: 1 }, // G3
    { freq: 196.0, beats: 1 },
  ],
  lead: [
    { freq: 523.25, beats: 0.5 }, // C5
    { freq: 659.25, beats: 0.5 }, // E5
    { freq: 783.99, beats: 0.5 }, // G5
    { freq: 659.25, beats: 0.5 },
    { freq: 587.33, beats: 0.5 }, // D5
    { freq: 523.25, beats: 0.5 },
    { freq: 493.88, beats: 0.5 }, // B4
    { freq: 440.0, beats: 0.5 }, // A4
    { freq: 392.0, beats: 0.5 }, // G4
    { freq: 440.0, beats: 0.5 },
    { freq: 523.25, beats: 0.5 },
    { freq: 587.33, beats: 0.5 },
    { freq: 659.25, beats: 0.5 },
    { freq: 523.25, beats: 0.5 },
    { freq: 440.0, beats: 0.5 },
    { freq: 392.0, beats: 0.5 },
  ],
};

export function initGateShooterAudio(): void {
  unlockAudio();
}

export function playStartSfx(): void {
  playSequence([
    { freq: 523.25, duration: 0.09, type: "square", volume: 0.4 },
    { freq: 659.25, duration: 0.09, type: "square", volume: 0.4 },
    { freq: 783.99, duration: 0.18, type: "square", volume: 0.45 },
  ]);
}

export function playShootSfx(): void {
  playTone(880, 0.05, { type: "square", volume: 0.1, slideTo: 1400 });
}

export function playHitSfx(): void {
  playNoiseBurst(0.08, { volume: 0.22, filterFreq: 2200 });
  playTone(300, 0.07, { type: "triangle", volume: 0.18, slideTo: 140, delaySec: 0.01 });
}

export function playGatePositiveSfx(): void {
  playSequence(
    [
      { freq: 523.25, duration: 0.08, type: "triangle", volume: 0.4 },
      { freq: 659.25, duration: 0.08, type: "triangle", volume: 0.4 },
      { freq: 880.0, duration: 0.15, type: "triangle", volume: 0.45 },
    ],
    0.01
  );
}

export function playGateNegativeSfx(): void {
  playTone(220, 0.22, { type: "sawtooth", volume: 0.28, slideTo: 100 });
}

export function playGameOverSfx(): void {
  playSequence(
    [
      { freq: 392.0, duration: 0.16, type: "square", volume: 0.35 },
      { freq: 349.23, duration: 0.16, type: "square", volume: 0.35 },
      { freq: 293.66, duration: 0.16, type: "square", volume: 0.35 },
      { freq: 261.63, duration: 0.4, type: "square", volume: 0.4 },
    ],
    0.02
  );
}

export function playNewRecordSfx(): void {
  playSequence(
    [
      { freq: 659.25, duration: 0.1, type: "square", volume: 0.4 },
      { freq: 783.99, duration: 0.1, type: "square", volume: 0.4 },
      { freq: 1046.5, duration: 0.24, type: "square", volume: 0.5 },
    ],
    0.015
  );
}

export function startGateShooterMusic(): void {
  startMusic(BGM);
}

export function stopGateShooterMusic(): void {
  stopMusic();
}
