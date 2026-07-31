export const GAME_CONFIG = {
  worldWidth: 400,
  worldHeight: 700,

  startingCharacters: 1,
  maxVisibleCharacters: 10,

  gateValues: [10, 20, -10, -20] as const,
  gateSpawnIntervalMs: 3400,
  gateSpeed: 72,
  gateHeight: 64,

  monsterSpawnIntervalMs: 900,
  monsterMinSpawnIntervalMs: 380,
  monsterSpeed: 90,
  monsterRadius: 22,

  playerY: 610,
  playerRadius: 24,
  playerKeyboardSpeed: 420,

  bulletSpeed: 560,
  bulletRadius: 6,
  fireIntervalMs: 260,

  scorePerKill: 10,
  difficultyRampSec: 90,
  monsterSpeedRamp: 70,
  monsterSpawnRampMs: 500,
} as const;

export function bulletsPerVolley(characters: number): number {
  if (characters <= 0) return 0;
  return Math.min(Math.max(1, Math.floor(Math.sqrt(characters))), 6);
}
