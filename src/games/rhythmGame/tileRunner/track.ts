export const RUNNER_BPM = 124;
export const RUNNER_BEAT_SEC = 60 / RUNNER_BPM;
export const RUNNER_HOP_COUNT = 90;

// 좌우로 완만하게 굽이치는 외길 경로 — 실제 좌우 조작과는 무관한 순수 시각 연출
export function hopOffset(index: number): number {
  return Math.sin(index * 0.45) * 1 + Math.sin(index * 0.13) * 0.4;
}

export function hopColorIndex(index: number): number {
  return Math.floor(index / 8) % 3; // 8박마다 초록/주황/보라로 구간 색이 바뀐다
}
