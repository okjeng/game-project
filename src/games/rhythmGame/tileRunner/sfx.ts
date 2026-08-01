import { audioNow, playTone } from "../../../lib/sound";
import { RUNNER_BEAT_SEC, RUNNER_LENGTH_BEATS } from "./track";

const HIT_FREQ = [523.25, 659.25, 783.99]; // C5 D5 G5 — 레인별 다른 음

export function scheduleRunnerBassPulses(songStartTime: number): void {
  const now = audioNow();
  for (let b = 0; b < Math.ceil(RUNNER_LENGTH_BEATS); b++) {
    const t = songStartTime + b * RUNNER_BEAT_SEC;
    const delay = t - now;
    if (delay < 0) continue;
    playTone(110, 0.1, { type: "triangle", volume: 0.25, delaySec: delay });
  }
}

export function playRunnerHitSfx(lane: number): void {
  const freq = HIT_FREQ[lane] ?? HIT_FREQ[0];
  playTone(freq, 0.14, { type: "sine", volume: 0.38 });
  playTone(freq * 2, 0.08, { type: "sine", volume: 0.14, delaySec: 0.01 });
}
