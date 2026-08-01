import { audioNow, playTone } from "../../../lib/sound";
import { RUNNER_BEAT_SEC, RUNNER_HOP_COUNT } from "./track";

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5 D5 E5 G5 A5 — 펜타토닉이라 어떤 순서로 쳐도 듣기 좋다

export function scheduleRunnerBassPulses(songStartTime: number): void {
  const now = audioNow();
  for (let b = 0; b < RUNNER_HOP_COUNT; b++) {
    const t = songStartTime + b * RUNNER_BEAT_SEC;
    const delay = t - now;
    if (delay < 0) continue;
    playTone(110, 0.1, { type: "triangle", volume: 0.22, delaySec: delay });
  }
}

export function playRunnerHopSfx(combo: number): void {
  const freq = SCALE[combo % SCALE.length];
  playTone(freq, 0.13, { type: "sine", volume: 0.4 });
  playTone(freq * 2, 0.08, { type: "sine", volume: 0.15, delaySec: 0.01 });
}
