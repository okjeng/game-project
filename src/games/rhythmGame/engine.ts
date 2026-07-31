import { GAME_CONFIG } from "./config";
import { BEAT_SEC, SONG_LENGTH_BEATS, SONG_NOTES, type NoteEvent } from "./song";

export type Judgment = "perfect" | "good" | "miss";

export interface Note {
  id: number;
  beat: number;
  lane: number;
  freq: number;
  targetTime: number;
  judged: Judgment | null;
}

export interface RhythmState {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  status: "playing" | "finished";
}

export type RhythmEvent =
  | { type: "hit"; judgment: "perfect" | "good"; lane: number; freq: number }
  | { type: "miss"; lane: number }
  | { type: "finished" };

export function createInitialState(songStartTime: number): RhythmState {
  const notes: Note[] = SONG_NOTES.map((n: NoteEvent, i: number) => ({
    id: i,
    beat: n.beat,
    lane: n.lane,
    freq: n.freq,
    targetTime: songStartTime + n.beat * BEAT_SEC,
    judged: null,
  }));
  return {
    notes,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    status: "playing",
  };
}

const songEndTime = (songStartTime: number) =>
  songStartTime + SONG_LENGTH_BEATS * BEAT_SEC + GAME_CONFIG.tailSec;

/** 시간 경과만 반영 — 판정 못 받고 지나간 노트를 miss 처리하고, 곡이 끝났는지 확인한다 */
export function tick(state: RhythmState, nowSec: number, songStartTime: number): { state: RhythmState; events: RhythmEvent[] } {
  if (state.status === "finished") return { state, events: [] };

  const events: RhythmEvent[] = [];
  let combo = state.combo;
  let missCount = state.missCount;
  const notes = state.notes.map((n) => {
    if (n.judged !== null) return n;
    if (nowSec > n.targetTime + GAME_CONFIG.goodWindowSec) {
      combo = 0;
      missCount += 1;
      events.push({ type: "miss", lane: n.lane });
      return { ...n, judged: "miss" as const };
    }
    return n;
  });

  let status: RhythmState["status"] = state.status;
  if (nowSec > songEndTime(songStartTime)) {
    status = "finished";
    events.push({ type: "finished" });
  }

  return { state: { ...state, notes, combo, missCount, status }, events };
}

/** lane에 입력이 들어왔을 때 판정선 근처(good 판정 범위 이내)의 가장 가까운 미판정 노트를 채점한다 */
export function hitLane(state: RhythmState, lane: number, nowSec: number): { state: RhythmState; event: RhythmEvent | null } {
  if (state.status === "finished") return { state, event: null };

  let best: Note | null = null;
  let bestDiff = Infinity;
  for (const n of state.notes) {
    if (n.judged !== null || n.lane !== lane) continue;
    const diff = Math.abs(n.targetTime - nowSec);
    if (diff <= GAME_CONFIG.goodWindowSec && diff < bestDiff) {
      best = n;
      bestDiff = diff;
    }
  }

  if (!best) return { state, event: null };

  const judgment: "perfect" | "good" = bestDiff <= GAME_CONFIG.perfectWindowSec ? "perfect" : "good";
  const gained = judgment === "perfect" ? GAME_CONFIG.scorePerfect : GAME_CONFIG.scoreGood;
  const combo = state.combo + 1;

  const notes = state.notes.map((n) => (n.id === best!.id ? { ...n, judged: judgment } : n));

  return {
    state: {
      ...state,
      notes,
      score: state.score + gained + combo * 2,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      perfectCount: state.perfectCount + (judgment === "perfect" ? 1 : 0),
      goodCount: state.goodCount + (judgment === "good" ? 1 : 0),
    },
    event: { type: "hit", judgment, lane, freq: best.freq },
  };
}
