import { GAME_CONFIG, PLATFORMS, enemyCountForRound, enemySpeedForRound, type Platform } from "./config";

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  invincible: number;
}

export type BubbleState = "flying" | "floating" | "trapped";

export interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: BubbleState;
  travelRemaining: number;
  trapRemaining: number;
  enemyId: number | null;
}

export type EnemyState = "walking" | "trapped";

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  platformIdx: number;
  state: EnemyState;
  bubbleId: number | null;
}

export interface BubblePopState {
  player: Player;
  bubbles: Bubble[];
  enemies: Enemy[];
  lives: number;
  score: number;
  round: number;
  roundClearTimer: number;
  bubbleCooldown: number;
  comboTimer: number;
  comboCount: number;
  nextId: number;
  status: "playing" | "gameover";
}

export interface Input {
  moveDir: -1 | 0 | 1;
  jumpPressed: boolean;
  shootPressed: boolean;
}

export type BubblePopEvent =
  | { type: "shoot" }
  | { type: "trap" }
  | { type: "pop"; combo: number }
  | { type: "escape" }
  | { type: "hurt" }
  | { type: "roundclear"; round: number }
  | { type: "gameover" };

const SPAWN_X = GAME_CONFIG.worldWidth / 2 - GAME_CONFIG.playerW / 2;
const SPAWN_Y = 400;

function resolvePlatforms(
  x: number,
  y: number,
  vy: number,
  w: number,
  h: number,
  dt: number,
  platforms: Platform[]
): { y: number; vy: number; onGround: boolean } {
  const prevBottom = y + h;
  let nextVy = Math.min(vy + GAME_CONFIG.gravity * dt, GAME_CONFIG.maxFallSpeed);
  let nextY = y + nextVy * dt;
  let onGround = false;

  if (nextVy >= 0) {
    for (const p of platforms) {
      const newBottom = nextY + h;
      const overlapsX = x + w > p.x && x < p.x + p.w;
      if (overlapsX && prevBottom <= p.y + 1 && newBottom >= p.y) {
        nextY = p.y - h;
        nextVy = 0;
        onGround = true;
        break;
      }
    }
  }
  if (nextY + h > GAME_CONFIG.worldHeight) {
    nextY = GAME_CONFIG.worldHeight - h;
    nextVy = 0;
    onGround = true;
  }
  return { y: nextY, vy: nextVy, onGround };
}

function platformFor(idx: number): Platform {
  return PLATFORMS[idx % PLATFORMS.length];
}

function spawnEnemies(round: number, startId: number): Enemy[] {
  const count = enemyCountForRound(round);
  const enemies: Enemy[] = [];
  // 바닥(0번)은 스폰에서 제외하고 공중 발판만 순환 사용
  const platformIndices = PLATFORMS.map((_, i) => i).filter((i) => i !== 0);
  for (let i = 0; i < count; i++) {
    const platformIdx = platformIndices[i % platformIndices.length];
    const platform = platformFor(platformIdx);
    enemies.push({
      id: startId + i,
      x: platform.x + platform.w / 2 - GAME_CONFIG.enemyW / 2,
      y: platform.y - GAME_CONFIG.enemyH,
      vx: i % 2 === 0 ? 1 : -1,
      platformIdx,
      state: "walking",
      bubbleId: null,
    });
  }
  return enemies;
}

export function createInitialState(): BubblePopState {
  return {
    player: { x: SPAWN_X, y: SPAWN_Y, vx: 0, vy: 0, onGround: false, facing: 1, invincible: 0 },
    bubbles: [],
    enemies: spawnEnemies(1, 1000),
    lives: GAME_CONFIG.startingLives,
    score: 0,
    round: 1,
    roundClearTimer: 0,
    bubbleCooldown: 0,
    comboTimer: 0,
    comboCount: 0,
    nextId: 2000,
    status: "playing",
  };
}

function circleBoxOverlap(cx: number, cy: number, r: number, bx: number, by: number, bw: number, bh: number): boolean {
  const closestX = Math.max(bx, Math.min(cx, bx + bw));
  const closestY = Math.max(by, Math.min(cy, by + bh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

function boxOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function step(state: BubblePopState, dtSec: number, input: Input): { state: BubblePopState; events: BubblePopEvent[] } {
  if (state.status === "gameover") return { state, events: [] };
  const events: BubblePopEvent[] = [];
  let nextId = state.nextId;

  // ── 플레이어 이동 ──
  let player = { ...state.player };
  player.facing = input.moveDir !== 0 ? (input.moveDir as 1 | -1) : player.facing;
  player.x += input.moveDir * GAME_CONFIG.moveSpeed * dtSec;
  if (player.x + GAME_CONFIG.playerW < 0) player.x = GAME_CONFIG.worldWidth;
  else if (player.x > GAME_CONFIG.worldWidth) player.x = -GAME_CONFIG.playerW;

  const resolved = resolvePlatforms(player.x, player.y, player.vy, GAME_CONFIG.playerW, GAME_CONFIG.playerH, dtSec, PLATFORMS);
  player.y = resolved.y;
  player.vy = resolved.vy;
  player.onGround = resolved.onGround;
  if (input.jumpPressed && player.onGround) {
    player.vy = GAME_CONFIG.jumpVelocity;
    player.onGround = false;
  }
  player.invincible = Math.max(0, player.invincible - dtSec);

  // ── 버블 발사 ──
  let bubbleCooldown = Math.max(0, state.bubbleCooldown - dtSec);
  let bubbles = state.bubbles;
  if (input.shootPressed && bubbleCooldown <= 0) {
    bubbleCooldown = GAME_CONFIG.bubbleCooldownSec;
    bubbles = [
      ...bubbles,
      {
        id: nextId++,
        x: player.x + GAME_CONFIG.playerW / 2,
        y: player.y + GAME_CONFIG.playerH / 2,
        vx: player.facing * GAME_CONFIG.bubbleSpeed,
        vy: 0,
        state: "flying",
        travelRemaining: GAME_CONFIG.bubbleTravelSec,
        trapRemaining: 0,
        enemyId: null,
      },
    ];
    events.push({ type: "shoot" });
  }

  // ── 적 이동(순찰) ──
  let enemies = state.enemies.map((e) => {
    if (e.state === "trapped") return e;
    const platform = platformFor(e.platformIdx);
    const speed = enemySpeedForRound(state.round);
    let x = e.x + e.vx * speed * dtSec;
    let vx = e.vx;
    const minX = platform.x + 2;
    const maxX = platform.x + platform.w - GAME_CONFIG.enemyW - 2;
    if (x < minX) {
      x = minX;
      vx = 1;
    } else if (x > maxX) {
      x = maxX;
      vx = -1;
    }
    return { ...e, x, vx, y: platform.y - GAME_CONFIG.enemyH };
  });

  // ── 버블 이동 + 포획 판정 ──
  const trapEvents: number[] = [];
  bubbles = bubbles.map((b) => {
    if (b.state === "flying") {
      const x = b.x + b.vx * dtSec;
      const travelRemaining = b.travelRemaining - dtSec;
      const hit = enemies.find(
        (e) => e.state === "walking" && circleBoxOverlap(x, b.y, GAME_CONFIG.bubbleRadiusMax, e.x, e.y, GAME_CONFIG.enemyW, GAME_CONFIG.enemyH)
      );
      if (hit) {
        trapEvents.push(hit.id);
        return { ...b, x, state: "trapped" as const, vx: 0, vy: GAME_CONFIG.bubbleFloatVy * 0.6, trapRemaining: GAME_CONFIG.bubbleTrapSec, enemyId: hit.id };
      }
      if (travelRemaining <= 0) {
        return { ...b, x, state: "floating" as const, vx: 0, vy: GAME_CONFIG.bubbleFloatVy, travelRemaining: 0 };
      }
      return { ...b, x, travelRemaining };
    }
    if (b.state === "floating") {
      const y = b.y + b.vy * dtSec;
      const hit = enemies.find(
        (e) => e.state === "walking" && circleBoxOverlap(b.x, y, GAME_CONFIG.bubbleRadiusMax, e.x, e.y, GAME_CONFIG.enemyW, GAME_CONFIG.enemyH)
      );
      if (hit) {
        trapEvents.push(hit.id);
        return { ...b, y, state: "trapped" as const, vx: 0, vy: GAME_CONFIG.bubbleFloatVy * 0.6, trapRemaining: GAME_CONFIG.bubbleTrapSec, enemyId: hit.id };
      }
      return { ...b, y };
    }
    // trapped
    const y = b.y + b.vy * dtSec;
    const trapRemaining = b.trapRemaining - dtSec;
    return { ...b, y, trapRemaining };
  });
  bubbles = bubbles.filter((b) => !(b.state === "floating" && b.y < -30));

  if (trapEvents.length > 0) {
    const trappedSet = new Set(trapEvents);
    enemies = enemies.map((e) => (trappedSet.has(e.id) ? { ...e, state: "trapped" as const } : e));
    events.push({ type: "trap" });
  }

  // 트랩된 적은 버블 위치를 따라간다 / 버블이 만료되면 탈출
  const escapedIds: number[] = [];
  bubbles = bubbles.filter((b) => {
    if (b.state !== "trapped") return true;
    if (b.trapRemaining <= 0 || b.y < 30) {
      if (b.enemyId !== null) escapedIds.push(b.enemyId);
      return false;
    }
    return true;
  });
  if (escapedIds.length > 0) {
    const escapedSet = new Set(escapedIds);
    enemies = enemies.map((e) => (escapedSet.has(e.id) ? { ...e, state: "walking" as const } : e));
    events.push({ type: "escape" });
  }
  for (const b of bubbles) {
    if (b.state === "trapped" && b.enemyId !== null) {
      enemies = enemies.map((e) => (e.id === b.enemyId ? { ...e, x: b.x - GAME_CONFIG.enemyW / 2, y: b.y - GAME_CONFIG.enemyH / 2 } : e));
    }
  }

  // ── 플레이어가 트랩된 버블을 건드리면 터뜨림 ──
  let score = state.score;
  let comboTimer = Math.max(0, state.comboTimer - dtSec);
  let comboCount = comboTimer > 0 ? state.comboCount : 0;
  const poppedBubbleIds: number[] = [];
  const poppedEnemyIds: number[] = [];
  for (const b of bubbles) {
    if (b.state !== "trapped") continue;
    if (boxOverlap(player.x, player.y, GAME_CONFIG.playerW, GAME_CONFIG.playerH, b.x - GAME_CONFIG.bubbleRadiusMax, b.y - GAME_CONFIG.bubbleRadiusMax, GAME_CONFIG.bubbleRadiusMax * 2, GAME_CONFIG.bubbleRadiusMax * 2)) {
      poppedBubbleIds.push(b.id);
      if (b.enemyId !== null) poppedEnemyIds.push(b.enemyId);
    }
  }
  if (poppedBubbleIds.length > 0) {
    comboCount += poppedBubbleIds.length;
    comboTimer = GAME_CONFIG.comboWindowSec;
    score += GAME_CONFIG.scorePop * comboCount;
    events.push({ type: "pop", combo: comboCount });
    const poppedBubbleSet = new Set(poppedBubbleIds);
    const poppedEnemySet = new Set(poppedEnemyIds);
    bubbles = bubbles.filter((b) => !poppedBubbleSet.has(b.id));
    enemies = enemies.filter((e) => !poppedEnemySet.has(e.id));
  }

  // ── 걸어다니는 적과 플레이어 접촉 ──
  let lives = state.lives;
  let status: BubblePopState["status"] = state.status;
  if (player.invincible <= 0) {
    const touched = enemies.some(
      (e) => e.state === "walking" && boxOverlap(player.x, player.y, GAME_CONFIG.playerW, GAME_CONFIG.playerH, e.x, e.y, GAME_CONFIG.enemyW, GAME_CONFIG.enemyH)
    );
    if (touched) {
      lives -= 1;
      player.invincible = GAME_CONFIG.invincibleSec;
      player.x = SPAWN_X;
      player.y = SPAWN_Y;
      player.vy = 0;
      events.push({ type: "hurt" });
      if (lives <= 0) {
        status = "gameover";
        events.push({ type: "gameover" });
      }
    }
  }

  // ── 라운드 클리어 판정 ──
  let round = state.round;
  let roundClearTimer = state.roundClearTimer;
  if (status === "playing") {
    if (enemies.length === 0 && roundClearTimer <= 0 && bubbles.every((b) => b.state !== "trapped")) {
      roundClearTimer = GAME_CONFIG.roundClearPauseSec;
      score += GAME_CONFIG.scoreRoundClear * round;
      events.push({ type: "roundclear", round });
    } else if (roundClearTimer > 0) {
      roundClearTimer -= dtSec;
      if (roundClearTimer <= 0) {
        round += 1;
        enemies = spawnEnemies(round, nextId);
        nextId += enemies.length;
        roundClearTimer = 0;
      }
    }
  }

  return {
    state: {
      player,
      bubbles,
      enemies,
      lives,
      score,
      round,
      roundClearTimer,
      bubbleCooldown,
      comboTimer,
      comboCount,
      nextId,
      status,
    },
    events,
  };
}
