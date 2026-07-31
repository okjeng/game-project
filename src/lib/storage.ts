/** 로컬 저장 — 백엔드 없이 브라우저(localStorage)에 가족 이름/점수를 저장한다.
 *  기기를 같이 쓰는 가족을 기준으로 하므로, 플레이 시작 시 이름만 물어보고
 *  이후에는 그 이름으로 최고 점수/가족 기록을 계속 누적한다. */

const KEYS = {
  playerName: "gameroom.playerName",
  scores: (gameId: string) => `gameroom.scores.${gameId}`,
} as const;

export type FamilyScores = Record<string, number>;

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

export function getFamilyScores(gameId: string): FamilyScores {
  return readScores(gameId);
}

export function getMyBestScore(gameId: string): number {
  const name = getPlayerName();
  if (!name) return 0;
  return readScores(gameId)[name] ?? 0;
}

/** 점수를 기록하고, 그 사람의 최고 기록을 새로 세웠으면 true를 반환한다 */
export function recordScore(gameId: string, playerName: string, score: number): boolean {
  const scores = readScores(gameId);
  const prev = scores[playerName] ?? 0;
  if (score <= prev) return false;
  scores[playerName] = score;
  localStorage.setItem(KEYS.scores(gameId), JSON.stringify(scores));
  return true;
}

export function getFamilyRanking(gameId: string): { name: string; score: number }[] {
  const scores = readScores(gameId);
  return Object.entries(scores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);
}
