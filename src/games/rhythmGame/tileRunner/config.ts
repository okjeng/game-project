export const RUNNER_CONFIG = {
  worldWidth: 400,
  worldHeight: 700,
  horizonY: 130,
  judgmentY: 560,
  travelSec: 1.7, // 타일이 지평선에서 판정 지점까지 다가오는 시간
  hitWindowSec: 0.22, // 넉넉한 판정 — 실패 시 즉시 게임오버라 타이밍 창은 관대하게
  leadInSec: 2,
  tailSec: 1.2,
  scorePerHit: 120,
} as const;

export const RUNNER_SECTION_COLORS = [
  { bg: ["#1f2a24", "#18181b"], tile: "#2ecc71" },
  { bg: ["#2a2420", "#18181b"], tile: "#f5b642" },
  { bg: ["#241f2a", "#18181b"], tile: "#8e44ad" },
] as const;
