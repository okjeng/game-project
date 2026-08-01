export const RUNNER_CONFIG = {
  worldWidth: 400,
  worldHeight: 700,
  laneCount: 3,
  judgmentY: 600,
  travelSec: 1.6, // 타일이 화면 위에서 판정선까지 내려오는 시간
  tileHalfHeight: 26,
  lives: 3,
  leadInSec: 2,
  tailSec: 1.2,
  scorePerHit: 100,
} as const;

export const RUNNER_LANE_HEX = ["#2ecc71", "#33c9dc", "#ff6b6b"] as const;
