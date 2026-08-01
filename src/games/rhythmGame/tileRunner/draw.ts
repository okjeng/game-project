import { RUNNER_CONFIG, RUNNER_SECTION_COLORS } from "./config";
import { hopColorIndex, hopOffset } from "./track";
import type { RunnerState } from "./engine";

export interface JudgeText {
  id: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

function scaleAt(t: number): number {
  return 0.22 + t * 0.98;
}

function yAt(t: number): number {
  return RUNNER_CONFIG.horizonY + t * (RUNNER_CONFIG.judgmentY - RUNNER_CONFIG.horizonY);
}

function xAt(index: number, scale: number): number {
  return RUNNER_CONFIG.worldWidth / 2 + hopOffset(index) * 68 * scale;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: RunnerState,
  nowSec: number,
  judgeTexts: JudgeText[],
  particles: Particle[]
) {
  const w = RUNNER_CONFIG.worldWidth;
  const h = RUNNER_CONFIG.worldHeight;
  const section = RUNNER_SECTION_COLORS[hopColorIndex(state.standingIndex + 1)];

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, section.bg[0]);
  grad.addColorStop(0.55, section.bg[1]);
  grad.addColorStop(1, "#111114");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 지평선 은은한 빛
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = section.tile;
  ctx.beginPath();
  ctx.ellipse(w / 2, RUNNER_CONFIG.horizonY, 90, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 다가오는 타일들 — 먼 곳(작게)에서 판정 지점(크게)까지
  for (const hop of state.hops) {
    if (hop.judged !== null) continue;
    const raw = 1 - (hop.targetTime - nowSec) / RUNNER_CONFIG.travelSec;
    if (raw < -0.08 || raw > 1.05) continue;
    const t = Math.max(0, Math.min(1, raw));
    const scale = scaleAt(t);
    const x = xAt(hop.index, scale);
    const y = yAt(t);
    const tileW = 92 * scale;
    const tileH = 30 * scale;
    const color = RUNNER_SECTION_COLORS[hopColorIndex(hop.index)].tile;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.35 + t * 0.65);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * scale;
    ctx.fillStyle = color;
    const r = 6 * scale;
    ctx.beginPath();
    ctx.roundRect(x - tileW / 2, y - tileH / 2, tileW, tileH, r);
    ctx.fill();
    ctx.restore();
  }

  // 판정 지점 표시
  ctx.save();
  ctx.strokeStyle = "#f4f4f5";
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 110, RUNNER_CONFIG.judgmentY + 20);
  ctx.lineTo(w / 2 + 110, RUNNER_CONFIG.judgmentY + 20);
  ctx.stroke();
  ctx.restore();

  // 파티클(타일이 부서지는 파편)
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    ctx.restore();
  }

  // 캐릭터 — 마지막으로 착지한 타일 위, 판정 지점 근처에 고정
  const standScale = scaleAt(1);
  const px = state.standingIndex >= 0 ? xAt(state.standingIndex, standScale) : w / 2;
  const bob = Math.abs(Math.sin(nowSec * 9)) * 5;
  const py = RUNNER_CONFIG.judgmentY - 24 - bob;
  ctx.save();
  ctx.shadowColor = section.tile;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ede6ff";
  ctx.beginPath();
  ctx.arc(px, py, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8e44ad";
  ctx.beginPath();
  ctx.arc(px - 9, py - 10, 3.6, 0, Math.PI * 2);
  ctx.arc(px + 9, py - 10, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const t of judgeTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = "900 26px PretendardVariable, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.text, w / 2, RUNNER_CONFIG.judgmentY - 120 - (1 - alpha) * 20);
    ctx.restore();
  }
}
