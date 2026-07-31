import { GAME_CONFIG, PLATFORMS } from "./config";
import type { BubblePopState } from "./engine";

const COLORS = {
  bgTop: "#202024",
  bg: "#18181b",
  platform: "#3a3a42",
  player: "#f5b642",
  enemy: "#8e44ad",
  bubble: "rgba(51, 201, 220, 0.35)",
  bubbleStroke: "#33c9dc",
};

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, blinking: boolean) {
  const w = GAME_CONFIG.playerW;
  const h = GAME_CONFIG.playerH;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  if (blinking) ctx.globalAlpha = 0.45;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // 눈
  const eyeOffset = facing === 1 ? 4 : -4;
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  ctx.arc(cx - 5 + eyeOffset, cy - 4, 3, 0, Math.PI * 2);
  ctx.arc(cx + 5 + eyeOffset, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  // 작은 입 (버블 부는 느낌)
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  ctx.arc(cx + eyeOffset * 1.5, cy + 6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = GAME_CONFIG.enemyW;
  const h = GAME_CONFIG.enemyH;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.fillStyle = COLORS.enemy;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 1.4, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, trapped: boolean) {
  ctx.save();
  ctx.fillStyle = COLORS.bubble;
  ctx.strokeStyle = COLORS.bubbleStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  if (trapped) {
    drawEnemy(ctx, x - GAME_CONFIG.enemyW / 2, y - GAME_CONFIG.enemyH / 2);
  }
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, state: BubblePopState) {
  const w = GAME_CONFIG.worldWidth;
  const h = GAME_CONFIG.worldHeight;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const p of PLATFORMS) {
    ctx.fillStyle = COLORS.platform;
    roundedRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.fill();
  }

  for (const b of state.bubbles) {
    if (b.state === "trapped") continue; // 안에 든 적과 함께 나중에 그림(겹침 순서)
    drawBubble(ctx, b.x, b.y, GAME_CONFIG.bubbleRadiusMax, false);
  }

  for (const e of state.enemies) {
    if (e.state === "walking") drawEnemy(ctx, e.x, e.y);
  }

  for (const b of state.bubbles) {
    if (b.state === "trapped") drawBubble(ctx, b.x, b.y, GAME_CONFIG.bubbleRadiusMax, true);
  }

  const blinking = state.player.invincible > 0 && Math.floor(state.player.invincible * 10) % 2 === 0;
  drawPlayer(ctx, state.player.x, state.player.y, state.player.facing, blinking);
}
