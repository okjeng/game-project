import { RUNNER_CONFIG, RUNNER_LANE_HEX } from "./config";
import type { RunnerState } from "./engine";

export interface JudgeText {
  id: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

function laneCenterX(lane: number): number {
  const laneWidth = RUNNER_CONFIG.worldWidth / RUNNER_CONFIG.laneCount;
  return laneWidth * lane + laneWidth / 2;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: RunnerState,
  nowSec: number,
  beatSec: number,
  judgeTexts: JudgeText[]
) {
  const w = RUNNER_CONFIG.worldWidth;
  const h = RUNNER_CONFIG.worldHeight;
  const laneWidth = w / RUNNER_CONFIG.laneCount;

  // 8박마다 배경 색조를 은은하게 전환 — 음악에 맞춰 화면이 살아있는 느낌을 준다
  const phrase = Math.floor(nowSec / (beatSec * 8)) % 2;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (phrase === 0) {
    grad.addColorStop(0, "#1f2a24");
    grad.addColorStop(1, "#18181b");
  } else {
    grad.addColorStop(0, "#241f2a");
    grad.addColorStop(1, "#18181b");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 1; i < RUNNER_CONFIG.laneCount; i++) {
    ctx.strokeStyle = "#2f2f36";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i * laneWidth, 0);
    ctx.lineTo(i * laneWidth, h);
    ctx.stroke();
  }

  // 판정선
  ctx.strokeStyle = "#f4f4f5";
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, RUNNER_CONFIG.judgmentY);
  ctx.lineTo(w, RUNNER_CONFIG.judgmentY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 다가오는 타일 — 정답 레인에만 타일을 그리고 나머지는 빈 구멍으로 남긴다
  for (const row of state.rows) {
    if (row.judged !== null) continue;
    const t = (row.targetTime - nowSec) / RUNNER_CONFIG.travelSec;
    if (t > 1 || t < -0.1) continue;
    const y = RUNNER_CONFIG.judgmentY - t * RUNNER_CONFIG.judgmentY;
    const x = row.lane * laneWidth;
    ctx.save();
    ctx.shadowColor = RUNNER_LANE_HEX[row.lane];
    ctx.shadowBlur = 12;
    ctx.fillStyle = RUNNER_LANE_HEX[row.lane];
    ctx.fillRect(x + 4, y - RUNNER_CONFIG.tileHalfHeight, laneWidth - 8, RUNNER_CONFIG.tileHalfHeight * 2);
    ctx.restore();
  }

  // 플레이어 캐릭터 — 판정선 위, 현재 레인에 고정
  const px = laneCenterX(state.currentLane);
  const bob = Math.sin(nowSec * 10) * 3;
  ctx.save();
  ctx.shadowColor = RUNNER_LANE_HEX[state.currentLane];
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ede6ff";
  ctx.beginPath();
  ctx.arc(px, RUNNER_CONFIG.judgmentY - 34 + bob, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8e44ad";
  ctx.beginPath();
  ctx.arc(px - 10, RUNNER_CONFIG.judgmentY - 44 + bob, 4, 0, Math.PI * 2);
  ctx.arc(px + 10, RUNNER_CONFIG.judgmentY - 44 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const t of judgeTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = "900 26px PretendardVariable, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.text, w / 2, RUNNER_CONFIG.judgmentY - 140 - (1 - alpha) * 20);
    ctx.restore();
  }
}
