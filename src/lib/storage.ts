/** 점수 저장 — localStorage(즉시·오프라인 캐시) + /api/scores(가족 공용 서버 DB) 하이브리드.
 *  로컬 캐시 덕분에 화면은 항상 즉시 뜨고, 서버 동기화는 백그라운드로 이루어져
 *  다른 기기/브라우저를 쓰는 가족끼리도 같은 순위표를 보게 된다. */

const KEYS = {
  playerName: "gameroom.playerName",
  scores: (gameId: string) => `gameroom.scores.${gameId}`,
} as const;

const API_BASE = "/api/scores";

export type FamilyScores = Record<string, number>;
export type RankingEntry = { name: string; score: number };

export function getPlayerName(): string | null {
  return localStorage.getItem(KEYS.playerName);
}

export function setPlayerName(name: string): void {
  localStorage.setItem(KEYS.playerName, name.trim().slice(0, 12));
}

function readScores(gameId: string): FamilyScores {
  try {
    const raw = localStorage.getItem(KEYS.scores(gameId));
    return raw ? (JSON.parse(raw) as FamilyScores) : {};
  } catch {
    return {};
  }
}

function writeScores(gameId: string, scores: FamilyScores): void {
  localStorage.setItem(KEYS.scores(gameId), JSON.stringify(scores));
}

/** 로컬 캐시 즉시 조회 — 네트워크를 기다리지 않는 첫 화면용 */
export function getFamilyScores(gameId: string): FamilyScores {
  return readScores(gameId);
}

export function getMyBestScore(gameId: string): number {
  const name = getPlayerName();
  if (!name) return 0;
  return readScores(gameId)[name] ?? 0;
}

/** 로컬 캐시에 즉시 반영하고, 그 사람의 최고 기록을 새로 세웠으면 true를 반환한다 */
export function recordScore(gameId: string, playerName: string, score: number): boolean {
  const scores = readScores(gameId);
  const prev = scores[playerName] ?? 0;
  if (score <= prev) return false;
  scores[playerName] = score;
  writeScores(gameId, scores);
  return true;
}

export function getFamilyRanking(gameId: string): RankingEntry[] {
  const scores = readScores(gameId);
  return Object.entries(scores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);
}

/** 서버(D1)에서 최신 가족 순위를 가져와 로컬 캐시도 함께 갱신한다.
 *  네트워크 실패 시 조용히 로컬 캐시 값을 반환한다(오프라인에서도 화면은 뜨게). */
export async function fetchFamilyRanking(gameId: string): Promise<RankingEntry[]> {
  try {
    const res = await fetch(`${API_BASE}?game=${encodeURIComponent(gameId)}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { scores: RankingEntry[] };
    const scores: FamilyScores = {};
    for (const row of data.scores) scores[row.name] = row.score;
    writeScores(gameId, scores);
    return data.scores.slice().sort((a, b) => b.score - a.score);
  } catch {
    return getFamilyRanking(gameId);
  }
}

/** 로컬에 즉시 기록하고, 서버(D1)에도 백그라운드로 동기화한다.
 *  반환값은 로컬 기준 신기록 여부(게임오버 화면 등 즉시 UI에 사용) — 서버 동기화는 결과를 기다리지 않는다. */
export function submitScore(gameId: string, playerName: string, score: number): boolean {
  const isLocalRecord = recordScore(gameId, playerName, score);
  void fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: gameId, name: playerName, score }),
  }).catch(() => {
    // 네트워크 실패해도 로컬엔 이미 저장돼 있음 — 다음 fetchFamilyRanking 호출 때 서버 값으로 재동기화됨
  });
  return isLocalRecord;
}
