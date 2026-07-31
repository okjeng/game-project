import { GAME_CONFIG, bulletsPerVolley } from "./config";

export interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export interface Gate {
  id: number;
  y: number;
  leftValue: number;
  rightValue: number;
  resolved: boolean;
}

export type GameStatus = "playing" | "gameover";

export interface GameState {
  playerX: number;
  characters: number;
  score: number;
  monstersDefeated: number;
  monsters: Monster[];
  bullets: Bullet[];
  gates: Gate[];
  elapsedSec: number;
  monsterSpawnTimer: number;
  gateSpawnTimer: number;
  fireTimer: number;
  nextId: number;
  status: GameStatus;
}

export type GameEvent =
  | { type: "kill"; x: number; y: number }
  | { type: "gate"; value: number; x: number; y: number }
  | { type: "gameover" };

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickTwoDistinct(pool: readonly number[]): [number, number] {
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  for (let guard = 0; b === a && guard < 10; guard++) {
    b = pool[Math.floor(Math.random() * pool.length)];
  }
  return [a, b];
}

export function createInitialState(): GameState {
  return {
    playerX: GAME_CONFIG.worldWidth / 2,
    characters: GAME_CONFIG.startingCharacters,
    score: 0,
    monstersDefeated: 0,
    monsters: [],
    bullets: [],
    gates: [],
    elapsedSec: 0,
    monsterSpawnTimer: GAME_CONFIG.monsterSpawnIntervalMs,
    gateSpawnTimer: GAME_CONFIG.gateSpawnIntervalMs,
    fireTimer: GAME_CONFIG.fireIntervalMs,
    nextId: 1,
    status: "playing",
  };
}

/** 순수 시뮬레이션 스텝 — 렌더링과 완전히 분리, dt(초)만큼 시간을 진행시킨다 */
export function step(
  state: GameState,
  dtSec: number,
  playerTargetX: number
): { state: GameState; events: GameEvent[] } {
  if (state.status === "gameover") return { state, events: [] };

  const events: GameEvent[] = [];
  const dtMs = dtSec * 1000;
  let nextId = state.nextId;

  const playerX = clamp(playerTargetX, GAME_CONFIG.playerRadius, GAME_CONFIG.worldWidth - GAME_CONFIG.playerRadius);
  const elapsedSec = state.elapsedSec + dtSec;
  const difficultyT = Math.min(elapsedSec / GAME_CONFIG.difficultyRampSec, 1);
  const monsterSpeed = GAME_CONFIG.monsterSpeed + difficultyT * GAME_CONFIG.monsterSpeedRamp;
  const monsterSpawnInterval = Math.max(
    GAME_CONFIG.monsterMinSpawnIntervalMs,
    GAME_CONFIG.monsterSpawnIntervalMs - difficultyT * GAME_CONFIG.monsterSpawnRampMs
  );

  // 몬스터 스폰
  let monsterSpawnTimer = state.monsterSpawnTimer - dtMs;
  let monsters = state.monsters;
  if (monsterSpawnTimer <= 0) {
    monsterSpawnTimer += monsterSpawnInterval;
    monsters = [
      ...monsters,
      {
        id: nextId++,
        x: randRange(GAME_CONFIG.monsterRadius, GAME_CONFIG.worldWidth - GAME_CONFIG.monsterRadius),
        y: -GAME_CONFIG.monsterRadius,
        hp: 1,
      },
    ];
  }

  // 게이트 스폰
  let gateSpawnTimer = state.gateSpawnTimer - dtMs;
  let gates = state.gates;
  if (gateSpawnTimer <= 0) {
    gateSpawnTimer += GAME_CONFIG.gateSpawnIntervalMs;
    const [a, b] = pickTwoDistinct(GAME_CONFIG.gateValues);
    gates = [...gates, { id: nextId++, y: -GAME_CONFIG.gateHeight, leftValue: a, rightValue: b, resolved: false }];
  }

  // 자동 사격
  let fireTimer = state.fireTimer - dtMs;
  let bullets = state.bullets;
  if (fireTimer <= 0) {
    fireTimer += GAME_CONFIG.fireIntervalMs;
    const count = bulletsPerVolley(state.characters);
    const spread = count === 1 ? 0 : Math.min(count * 10, 60);
    const fresh: Bullet[] = [];
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : -spread / 2 + (spread / (count - 1)) * i;
      fresh.push({ id: nextId++, x: playerX + offset, y: GAME_CONFIG.playerY - GAME_CONFIG.playerRadius });
    }
    bullets = [...bullets, ...fresh];
  }

  // 이동
  monsters = monsters
    .map((m) => ({ ...m, y: m.y + monsterSpeed * dtSec }))
    .filter((m) => m.y < GAME_CONFIG.worldHeight + GAME_CONFIG.monsterRadius);

  bullets = bullets
    .map((b) => ({ ...b, y: b.y - GAME_CONFIG.bulletSpeed * dtSec }))
    .filter((b) => b.y > -GAME_CONFIG.bulletRadius);

  gates = gates
    .map((g) => ({ ...g, y: g.y + GAME_CONFIG.gateSpeed * dtSec }))
    .filter((g) => g.y < GAME_CONFIG.worldHeight + GAME_CONFIG.gateHeight);

  // 충돌: 총알 vs 몬스터
  const deadMonsterIds = new Set<number>();
  const deadBulletIds = new Set<number>();
  const hitRadius = (GAME_CONFIG.monsterRadius + GAME_CONFIG.bulletRadius) ** 2;
  for (const b of bullets) {
    if (deadBulletIds.has(b.id)) continue;
    for (const m of monsters) {
      if (deadMonsterIds.has(m.id)) continue;
      const dx = b.x - m.x;
      const dy = b.y - m.y;
      if (dx * dx + dy * dy <= hitRadius) {
        deadMonsterIds.add(m.id);
        deadBulletIds.add(b.id);
        events.push({ type: "kill", x: m.x, y: m.y });
        break;
      }
    }
  }

  let score = state.score;
  let monstersDefeated = state.monstersDefeated;
  if (deadMonsterIds.size > 0) {
    score += deadMonsterIds.size * GAME_CONFIG.scorePerKill;
    monstersDefeated += deadMonsterIds.size;
    monsters = monsters.filter((m) => !deadMonsterIds.has(m.id));
    bullets = bullets.filter((b) => !deadBulletIds.has(b.id));
  }

  // 게이트 통과 판정
  let characters = state.characters;
  let becameGameOver = false;
  gates = gates.map((g) => {
    if (g.resolved || g.y < GAME_CONFIG.playerY) return g;
    const side = playerX < GAME_CONFIG.worldWidth / 2 ? "left" : "right";
    const value = side === "left" ? g.leftValue : g.rightValue;
    characters = Math.max(0, characters + value);
    if (value > 0) score += value;
    events.push({ type: "gate", value, x: playerX, y: GAME_CONFIG.playerY });
    if (characters <= 0) becameGameOver = true;
    return { ...g, resolved: true };
  });

  const status: GameStatus = becameGameOver ? "gameover" : "playing";
  if (becameGameOver) events.push({ type: "gameover" });

  return {
    state: {
      playerX,
      characters,
      score,
      monstersDefeated,
      monsters,
      bullets,
      gates,
      elapsedSec,
      monsterSpawnTimer,
      gateSpawnTimer,
      fireTimer,
      nextId,
      status,
    },
    events,
  };
}
