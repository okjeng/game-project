import { GAME_CONFIG } from "./config";
import type { GameState } from "./engine";

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  big?: boolean;
}

const COLORS = {
  bg: "#18181b",
  bgTop: "#202024",
  green: "#2ecc71",
  violet: "#8e44ad",
  coral: "#ff6b6b",
  amber: "#f5b642",
  cyan: "#33c9dc",
  text: "#f4f4f5",
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

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  const r = GAME_CONFIG.playerRadius * scale;
  ctx.save();
  ctx.translate(x, y);
  // 몸
  ctx.fillStyle = color;
  roundedRect(ctx, -r * 0.55, r * 0.15, r * 1.1, r * 0.9, r * 0.35);
  ctx.fill();
  // 머리
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // 눈
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.22, -r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // 장난감 총
  ctx.fillStyle = COLORS.amber;
  roundedRect(ctx, -r * 0.15, -r * 0.05, r * 0.9, r * 0.28, r * 0.1);
  ctx.fill();
  ctx.restore();
}

function drawMonster(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const r = GAME_CONFIG.monsterRadius;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.violet;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.1, r * 0.22, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.1, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0b";
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.arc(x, y, GAME_CONFIG.bulletRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGate(ctx: CanvasRenderingContext2D, y: number, leftValue: number, rightValue: number) {
  const w = GAME_CONFIG.worldWidth;
  const h = GAME_CONFIG.gateHeight;
  const half = w / 2;

  ctx.save();
  ctx.globalAlpha = 0.92;

  ctx.fillStyle = leftValue > 0 ? "rgba(46,204,113,0.28)" : "rgba(255,107,107,0.28)";
  roundedRect(ctx, 8, y, half - 14, h, 14);
  ctx.fill();
  ctx.strokeStyle = leftValue > 0 ? COLORS.green : COLORS.coral;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = rightValue > 0 ? "rgba(46,204,113,0.28)" : "rgba(255,107,107,0.28)";
  roundedRect(ctx, half + 6, y, half - 14, h, 14);
  ctx.fill();
  ctx.strokeStyle = rightValue > 0 ? COLORS.green : COLORS.coral;
  ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.font = "800 26px PretendardVariable, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${leftValue > 0 ? "+" : ""}${leftValue}`, half / 2, y + h / 2);
  ctx.fillText(`${rightValue > 0 ? "+" : ""}${rightValue}`, half + half / 2, y + h / 2);
  ctx.restore();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  floatingTexts: FloatingText[]
) {
  const w = GAME_CONFIG.worldWidth;
  const h = GAME_CONFIG.worldHeight;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const g of state.gates) drawGate(ctx, g.y, g.leftValue, g.rightValue);
  for (const m of state.monsters) drawMonster(ctx, m.x, m.y);
  for (const b of state.bullets) drawBullet(ctx, b.x, b.y);

  // 캐릭터 무리 (뒤로 갈수록 작게, 최대 표시 개수 제한)
  const visible = Math.min(state.characters, GAME_CONFIG.maxVisibleCharacters);
  for (let i = visible - 1; i >= 1; i--) {
    const back = i;
    const jitter = ((back * 37) % 7) - 3;
    drawCharacter(
      ctx,
      state.playerX + jitter * 2,
      GAME_CONFIG.playerY + back * 10,
      Math.max(0.55, 1 - back * 0.06),
      COLORS.green
    );
  }
  if (state.characters > 0) {
    drawCharacter(ctx, state.playerX, GAME_CONFIG.playerY, 1, COLORS.green);
  }
  if (state.characters > GAME_CONFIG.maxVisibleCharacters) {
    ctx.fillStyle = COLORS.amber;
    ctx.font = "700 15px PretendardVariable, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`+${state.characters - GAME_CONFIG.maxVisibleCharacters}명`, state.playerX, GAME_CONFIG.playerY + 46);
  }

  for (const t of floatingTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = `900 ${t.big ? 30 : 18}px PretendardVariable, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}
