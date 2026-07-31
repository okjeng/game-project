export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GAME_CONFIG = {
  worldWidth: 400,
  worldHeight: 700,

  gravity: 1600,
  jumpVelocity: -560,
  moveSpeed: 210,
  maxFallSpeed: 900,

  playerW: 30,
  playerH: 34,
  enemyW: 28,
  enemyH: 26,

  bubbleTravelSec: 0.42,
  bubbleSpeed: 260,
  bubbleRadiusMax: 20,
  bubbleFloatVy: -46,
  bubbleTrapSec: 7,
  bubbleCooldownSec: 0.45,

  startingLives: 3,
  invincibleSec: 1.5,
  roundClearPauseSec: 1.6,

  scorePop: 100,
  scoreRoundClear: 200,
  comboWindowSec: 1,
} as const;

export const PLATFORMS: Platform[] = [
  { x: 0, y: 660, w: 400, h: 40 }, // 바닥
  { x: 20, y: 520, w: 140, h: 16 },
  { x: 240, y: 520, w: 140, h: 16 },
  { x: 130, y: 380, w: 140, h: 16 },
  { x: 20, y: 240, w: 140, h: 16 },
  { x: 240, y: 240, w: 140, h: 16 },
];

export function enemyCountForRound(round: number): number {
  return Math.min(2 + round, 8);
}

export function enemySpeedForRound(round: number): number {
  return 55 + Math.min(round * 6, 60);
}
