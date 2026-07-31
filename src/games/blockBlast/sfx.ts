import { playNoiseBurst, playSequence, playTone, startMusic, stopMusic, unlockAudio, type MusicTrack } from "../../lib/sound";

/** 테트리스풍 오리지널 8비트 루프 — 실제 코로베이니키 멜로디는 그대로 쓰지 않고,
 * 마이너키 + 빠른 템포 + 스퀘어웨이브로 "블록 퍼즐" 분위기만 가져왔다. */
const BGM: MusicTrack = {
  bpm: 148,
  bass: [
    { freq: 110.0, beats: 1 }, // A2
    { freq: 110.0, beats: 1 },
    { freq: 130.81, beats: 1 }, // C3
    { freq: 146.83, beats: 1 }, // D3
    { freq: 164.81, beats: 1 }, // E3
    { freq: 164.81, beats: 1 },
    { freq: 130.81, beats: 1 }, // C3
    { freq: 146.83, beats: 1 }, // D3
  ],
  lead: [
    { freq: 440.0, beats: 0.5 }, // A4
    { freq: 523.25, beats: 0.25 }, // C5
    { freq: 587.33, beats: 0.25 }, // D5
    { freq: 659.25, beats: 0.5 }, // E5
    { freq: 587.33, beats: 0.25 }, // D5
    { freq: 523.25, beats: 0.25 }, // C5
    { freq: 493.88, beats: 0.5 }, // B4
    { freq: 440.0, beats: 0.5 }, // A4
    { freq: 440.0, beats: 0.5 },
    { freq: 523.25, beats: 0.5 }, // C5
    { freq: 659.25, beats: 0.5 }, // E5
    { freq: 587.33, beats: 0.5 }, // D5
    { freq: 523.25, beats: 0.5 }, // C5
    { freq: 493.88, beats: 0.5 }, // B4
    { freq: 440.0, beats: 1 }, // A4
  ],
};

export function initBlockBlastAudio(): void {
  unlockAudio();
}

export function playGameStartSfx(): void {
  playSequence(
    [
      { freq: 440.0, duration: 0.08, type: "square", volume: 0.35 },
      { freq: 587.33, duration: 0.08, type: "square", volume: 0.35 },
      { freq: 880.0, duration: 0.16, type: "square", volume: 0.4 },
    ],
    0.015
  );
}

export function playPlaceSfx(): void {
  playTone(660, 0.045, { type: "square", volume: 0.16, slideTo: 440 });
}

export function playLineClearSfx(linesCleared: number): void {
  const base = [523.25, 659.25, 880.0, 1174.66];
  const notes = base.slice(0, Math.min(2 + linesCleared, base.length)).map((freq) => ({
    freq,
    duration: 0.09,
    type: "square" as const,
    volume: 0.4,
  }));
  playSequence(notes, 0.008);
  if (linesCleared > 1) {
    playNoiseBurst(0.1, { volume: 0.15, filterFreq: 4500 });
  }
}

export function playGameOverSfx(): void {
  playSequence(
    [
      { freq: 440.0, duration: 0.14, type: "square", volume: 0.32 },
      { freq: 392.0, duration: 0.14, type: "square", volume: 0.32 },
      { freq: 349.23, duration: 0.14, type: "square", volume: 0.32 },
      { freq: 293.66, duration: 0.14, type: "square", volume: 0.32 },
      { freq: 220.0, duration: 0.4, type: "square", volume: 0.4 },
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
