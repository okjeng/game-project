export const GAME_CONFIG = {
  worldWidth: 400,
  worldHeight: 700,
  laneCount: 4,
  judgmentY: 600,
  travelSec: 1.8, // 노트가 화면 위에서 판정선까지 내려오는 시간
  noteRadius: 24,
  perfectWindowSec: 0.07,
  goodWindowSec: 0.15,
  leadInSec: 2, // "3,2,1" 카운트다운 시간
  tailSec: 1.5, // 마지막 노트 이후 곡이 끝났다고 판단하기까지 여유 시간
  scorePerfect: 300,
  scoreGood: 100,
} as const;

export const LANE_COLORS = ["var(--neon-green)", "var(--neon-cyan)", "var(--neon-violet)", "var(--neon-coral)"] as const;
export const LANE_KEYS = ["d", "f", "j", "k"] as const;
