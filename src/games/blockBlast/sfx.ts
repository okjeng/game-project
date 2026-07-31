import { playNoiseBurst, playSequence, playTone, startMusic, stopMusic, unlockAudio, type MusicTrack } from "../../lib/sound";

/** 퍼즐 게임에 맞는 차분한 루프 — 게이트 슈터보다 느리고 부드럽게 */
const BGM: MusicTrack = {
  bpm: 96,
  bass: [
    { freq: 130.81, beats: 2 }, // C3
    { freq: 164.81, beats: 2 }, // E3
    { freq: 196.0, beats: 2 }, // G3
    { freq: 174.61, beats: 2 }, // F3
  ],
  lead: [
    { freq: 523.25, beats: 1 }, // C5
    { freq: 587.33, beats: 1 }, // D5
    { freq: 659.25, beats: 1 }, // E5
    { freq: 523.25, beats: 1 },
    { freq: 587.33, beats: 1 }, // D5
    { freq: 659.25, beats: 1 },
    { freq: 698.46, beats: 1 }, // F5
    { freq: 659.25, beats: 1 },
  ],
};

export function initBlockBlastAudio(): void {
  unlockAudio();
}

export function playGameStartSfx(): void {
  playSequence(
    [
      { freq: 523.25, duration: 0.1, type: "sine", volume: 0.35 },
      { freq: 659.25, duration: 0.14, type: "sine", volume: 0.4 },
    ],
    0.02
  );
}

export function playPlaceSfx(): void {
  playTone(360, 0.05, { type: "triangle", volume: 0.16, slideTo: 260 });
}

export function playLineClearSfx(linesCleared: number): void {
  const base = [523.25, 659.25, 783.99, 1046.5];
  const notes = base.slice(0, Math.min(2 + linesCleared, base.length)).map((freq) => ({
    freq,
    duration: 0.11,
    type: "triangle" as const,
    volume: 0.4,
  }));
  playSequence(notes, 0.01);
  if (linesCleared > 1) {
    playNoiseBurst(0.12, { volume: 0.15, filterFreq: 4000 });
  }
}

export function playObstacleWarnSfx(): void {
  playSequence(
    [
      { freq: 233.08, duration: 0.09, type: "sawtooth", volume: 0.28 },
      { freq: 233.08, duration: 0.09, type: "sawtooth", volume: 0.28 },
    ],
    0.06
  );
}

export function playGameOverSfx(): void {
  playSequence(
    [
      { freq: 392.0, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 349.23, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 293.66, duration: 0.16, type: "square", volume: 0.32 },
      { freq: 261.63, duration: 0.4, type: "square", volume: 0.38 },
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

export function startBlockBlastMusic(): void {
  startMusic(BGM);
}

export function stopBlockBlastMusic(): void {
  stopMusic();
}
