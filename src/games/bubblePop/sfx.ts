import { playNoiseBurst, playSequence, playTone, startMusic, stopMusic, unlockAudio, type MusicTrack } from "../../lib/sound";

/** 경쾌하고 통통 튀는 분위기 — 밝은 장조, 방울이 통통 떠다니는 듯한 스타카토 멜로디 */
const BGM: MusicTrack = {
  bpm: 118,
  bass: [
    { freq: 174.61, beats: 1 }, // F3
    { freq: 174.61, beats: 0.5 },
    { freq: 0, beats: 0.5 },
    { freq: 196.0, beats: 1 }, // G3
    { freq: 220.0, beats: 1 }, // A3
    { freq: 196.0, beats: 1 },
  ],
  lead: [
    { freq: 698.46, beats: 0.5 }, // F5
    { freq: 880.0, beats: 0.5 }, // A5
    { freq: 698.46, beats: 0.5 },
    { freq: 587.33, beats: 0.5 }, // D5
    { freq: 659.25, beats: 0.5 }, // E5
    { freq: 880.0, beats: 0.5 },
    { freq: 783.99, beats: 0.5 }, // G5
    { freq: 659.25, beats: 0.5 },
    { freq: 698.46, beats: 1 },
    { freq: 587.33, beats: 1 },
  ],
};

export function initBubblePopAudio(): void {
  unlockAudio();
}

export function playShootSfx(): void {
  playTone(320, 0.1, { type: "sine", volume: 0.2, slideTo: 520 });
}

export function playTrapSfx(): void {
  playTone(440, 0.12, { type: "triangle", volume: 0.3, slideTo: 700 });
}

export function playPopSfx(combo: number): void {
  const pitch = Math.min(1 + (combo - 1) * 0.12, 2);
  playSequence(
    [
      { freq: 880 * pitch, duration: 0.06, type: "square", volume: 0.35 },
      { freq: 1174.66 * pitch, duration: 0.1, type: "square", volume: 0.4 },
    ],
    0.01
  );
  playNoiseBurst(0.05, { volume: 0.12, filterFreq: 5000 });
}

export function playEscapeSfx(): void {
  playTone(300, 0.18, { type: "sawtooth", volume: 0.22, slideTo: 160 });
}

export function playHurtSfx(): void {
  playTone(200, 0.2, { type: "sawtooth", volume: 0.3, slideTo: 90 });
}

export function playRoundClearSfx(): void {
  playSequence(
    [
      { freq: 523.25, duration: 0.1, type: "square", volume: 0.38 },
      { freq: 659.25, duration: 0.1, type: "square", volume: 0.38 },
      { freq: 783.99, duration: 0.1, type: "square", volume: 0.38 },
      { freq: 1046.5, duration: 0.28, type: "square", volume: 0.45 },
    ],
    0.015
  );
}

export function playGameOverSfx(): void {
  playSequence(
    [
      { freq: 392.0, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 349.23, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 293.66, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 196.0, duration: 0.4, type: "square", volume: 0.4 },
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

export function startBubblePopMusic(): void {
  startMusic(BGM);
}

export function stopBubblePopMusic(): void {
  stopMusic();
}
