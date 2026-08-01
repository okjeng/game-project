import { GAME_CONFIG } from "./config";
import type { RhythmState } from "./engine";

const LANE_HEX = ["#2ecc71", "#33c9dc", "#8e44ad", "#ff6b6b"];

export interface JudgeText {
  id: number;
  lane: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

function laneCenterX(lane: number): number {
  const laneWidth = GAME_CONFIG.worldWidth / GAME_CONFIG.laneCount;
  return laneWidth * lane + laneWidth / 2;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: RhythmState,
  nowSec: number,
  activeLane: number | null,
  judgeTexts: JudgeText[]
) {
  const w = GAME_CONFIG.worldWidth;
  const h = GAME_CONFIG.worldHeight;
  const laneWidth = w / GAME_CONFIG.laneCount;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#202024");
  grad.addColorStop(1, "#18181b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 레인 구분선 + 활성 레인 하이라이트
  for (let i = 0; i < GAME_CONFIG.laneCount; i++) {
    if (activeLane === i) {
      ctx.fillStyle = `${LANE_HEX[i]}22`;
      ctx.fillRect(i * laneWidth, 0, laneWidth, h);
    }
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
  ctx.moveTo(0, GAME_CONFIG.judgmentY);
  ctx.lineTo(w, GAME_CONFIG.judgmentY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 노트 — 피아노 타일처럼 레인 폭 대부분을 채우는 세로로 긴 타일
  const tileW = laneWidth - 14;
  const tileH = 62;
  for (const note of state.notes) {
    if (note.judged !== null && note.judged !== "miss") continue; // 성공 판정된 노트는 사라짐
    if (note.judged === "miss") continue;
    const t = (note.targetTime - nowSec) / GAME_CONFIG.travelSec; // 1(스폰) -> 0(판정선)
    if (t > 1 || t < -0.15) continue;
    const y = GAME_CONFIG.judgmentY - t * GAME_CONFIG.judgmentY;
    const x = laneCenterX(note.lane);
    ctx.save();
    ctx.shadowColor = LANE_HEX[note.lane];
    ctx.shadowBlur = 14;
    ctx.fillStyle = LANE_HEX[note.lane];
    ctx.beginPath();
    ctx.roundRect(x - tileW / 2, y - tileH / 2, tileW, tileH, 8);
    ctx.fill();
    ctx.restore();
  }

  // 판정 텍스트
  for (const t of judgeTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = "900 24px PretendardVariable, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.text, laneCenterX(t.lane), GAME_CONFIG.judgmentY - 60 - (1 - alpha) * 20);
    ctx.restore();
  }
}
