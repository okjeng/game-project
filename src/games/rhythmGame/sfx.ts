import { audioNow, playSequence, playTone, unlockAudio } from "../../lib/sound";
import { BASS_FREQ, BEAT_SEC, SONG_LENGTH_BEATS } from "./song";

export function initRhythmAudio(): void {
  unlockAudio();
}

/** 곡 전체의 베이스 펄스를 시작 시점 기준으로 한 번에 예약한다 — 정확히 박자에 맞춰 울린다 */
export function scheduleBassPulses(songStartTime: number): void {
  const now = audioNow();
  const totalBeats = Math.ceil(SONG_LENGTH_BEATS);
  for (let b = 0; b < totalBeats; b++) {
    const t = songStartTime + b * BEAT_SEC;
    const delay = t - now;
    if (delay < 0) continue;
    playTone(BASS_FREQ, 0.12, { type: "triangle", volume: 0.3, delaySec: delay });
  }
}

export function playCountdownBeep(final: boolean): void {
  playTone(final ? 880 : 523.25, final ? 0.2 : 0.1, { type: "square", volume: 0.35 });
}

export function playPerfectSfx(freq: number): void {
  playTone(freq, 0.16, { type: "sine", volume: 0.4 });
  playTone(freq * 2, 0.1, { type: "sine", volume: 0.15, delaySec: 0.01 });
}

export function playGoodSfx(freq: number): void {
  playTone(freq, 0.13, { type: "triangle", volume: 0.32 });
}

export function playMissSfx(): void {
  playTone(140, 0.14, { type: "sawtooth", volume: 0.2, slideTo: 80 });
}

export function playFinishedSfx(): void {
  playSequence(
    [
      { freq: 523.25, duration: 0.12, type: "square", volume: 0.35 },
      { freq: 659.25, duration: 0.12, type: "square", volume: 0.35 },
      { freq: 783.99, duration: 0.12, type: "square", volume: 0.35 },
      { freq: 1046.5, duration: 0.3, type: "square", volume: 0.42 },
    ],
    0.015
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
