import { RUNNER_CONFIG } from "./config";
import { RUNNER_BEAT_SEC, RUNNER_LANES, RUNNER_LENGTH_BEATS } from "./track";

export type Lane = 0 | 1 | 2;

export interface Row {
  index: number;
  lane: Lane;
  targetTime: number;
  judged: "hit" | "miss" | null;
}

export interface RunnerState {
  rows: Row[];
  currentLane: Lane;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  hitCount: number;
  missCount: number;
  status: "playing" | "finished";
}

export type RunnerEvent =
  | { type: "hit"; lane: Lane }
  | { type: "miss"; lane: Lane }
  | { type: "gameover" }
  | { type: "cleared" };

export function createInitialState(songStartTime: number): RunnerState {
  const rows: Row[] = RUNNER_LANES.map((lane, i) => ({
    index: i,
    lane,
    targetTime: songStartTime + i * RUNNER_BEAT_SEC,
    judged: null,
  }));
  return {
    rows,
    currentLane: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: RUNNER_CONFIG.lives,
    hitCount: 0,
    missCount: 0,
    status: "playing",
  };
}

const songEndTime = (songStartTime: number) =>
  songStartTime + RUNNER_LENGTH_BEATS * RUNNER_BEAT_SEC + RUNNER_CONFIG.tailSec;

export function setLane(state: RunnerState, lane: Lane): RunnerState {
  if (state.status !== "playing") return state;
  return { ...state, currentLane: lane };
}

/** 매 프레임 호출 — 판정 시각이 지난 행을 현재 레인과 비교해 자동으로 성공/실패 판정한다 */
export function tick(
  state: RunnerState,
  nowSec: number,
  songStartTime: number
): { state: RunnerState; events: RunnerEvent[] } {
  if (state.status === "finished") return { state, events: [] };

  const events: RunnerEvent[] = [];
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let score = state.score;
  let lives = state.lives;
  let hitCount = state.hitCount;
  let missCount = state.missCount;

  const rows = state.rows.map((row) => {
    if (row.judged !== null || nowSec < row.targetTime) return row;
    if (row.lane === state.currentLane) {
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      score += RUNNER_CONFIG.scorePerHit + combo * 2;
      hitCount += 1;
      events.push({ type: "hit", lane: row.lane });
      return { ...row, judged: "hit" as const };
    }
    combo = 0;
    lives -= 1;
    missCount += 1;
    events.push({ type: "miss", lane: row.lane });
    return { ...row, judged: "miss" as const };
  });

  let status: RunnerState["status"] = state.status;
  if (lives <= 0) {
    status = "finished";
    events.push({ type: "gameover" });
  } else if (nowSec > songEndTime(songStartTime)) {
    status = "finished";
    events.push({ type: "cleared" });
  }

  return { state: { ...state, rows, combo, maxCombo, score, lives, hitCount, missCount, status }, events };
}
