import { RUNNER_CONFIG } from "./config";
import { RUNNER_BEAT_SEC, RUNNER_HOP_COUNT } from "./track";

export interface Hop {
  index: number;
  targetTime: number;
  judged: "hit" | "miss" | null;
}

export interface RunnerState {
  hops: Hop[];
  standingIndex: number; // 마지막으로 착지에 성공한 타일 인덱스 (-1이면 출발 지점)
  score: number;
  combo: number;
  maxCombo: number;
  hitCount: number;
  status: "playing" | "finished";
  cleared: boolean;
}

export type RunnerEvent = { type: "hit"; index: number } | { type: "miss" } | { type: "cleared" };

export function createInitialState(songStartTime: number): RunnerState {
  const hops: Hop[] = Array.from({ length: RUNNER_HOP_COUNT }, (_, i) => ({
    index: i,
    targetTime: songStartTime + i * RUNNER_BEAT_SEC,
    judged: null,
  }));
  return {
    hops,
    standingIndex: -1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hitCount: 0,
    status: "playing",
    cleared: false,
  };
}

function nextHop(state: RunnerState): Hop | null {
  return state.hops[state.standingIndex + 1] ?? null;
}

/** 매 프레임 호출 — 다음 타일의 판정 창을 놓치고 지나갔으면 즉시 게임오버 처리한다 */
export function tick(state: RunnerState, nowSec: number): { state: RunnerState; events: RunnerEvent[] } {
  if (state.status === "finished") return { state, events: [] };

  const hop = nextHop(state);
  if (!hop) return { state, events: [] };

  if (nowSec > hop.targetTime + RUNNER_CONFIG.hitWindowSec) {
    const hops = state.hops.map((h) => (h.index === hop.index ? { ...h, judged: "miss" as const } : h));
    return {
      state: { ...state, hops, combo: 0, status: "finished", cleared: false },
      events: [{ type: "miss" }],
    };
  }

  return { state, events: [] };
}

/** 탭 입력 — 다음 타일의 판정 시각과 비교해 정확도를 확인한다 */
export function tap(state: RunnerState, nowSec: number): { state: RunnerState; events: RunnerEvent[] } {
  if (state.status !== "playing") return { state, events: [] };

  const hop = nextHop(state);
  if (!hop) return { state, events: [] };

  const diff = Math.abs(hop.targetTime - nowSec);
  if (diff > RUNNER_CONFIG.hitWindowSec) {
    const hops = state.hops.map((h) => (h.index === hop.index ? { ...h, judged: "miss" as const } : h));
    return {
      state: { ...state, hops, combo: 0, status: "finished", cleared: false },
      events: [{ type: "miss" }],
    };
  }

  const combo = state.combo + 1;
  const hops = state.hops.map((h) => (h.index === hop.index ? { ...h, judged: "hit" as const } : h));
  const isLast = hop.index === state.hops.length - 1;

  return {
    state: {
      ...state,
      hops,
      standingIndex: hop.index,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      score: state.score + RUNNER_CONFIG.scorePerHit + combo * 2,
      hitCount: state.hitCount + 1,
      status: isLast ? "finished" : "playing",
      cleared: isLast,
    },
    events: isLast ? [{ type: "hit", index: hop.index }, { type: "cleared" }] : [{ type: "hit", index: hop.index }],
  };
}
