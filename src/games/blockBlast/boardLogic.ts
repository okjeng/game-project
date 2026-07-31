import type { Piece } from "./shapes";

export const BOARD_SIZE = 8;

/** 스테이지가 올라갈 때 자동으로 채워지는 방해 블록 표시값 (색이 아니라 이 상수로 구분) */
export const OBSTACLE = "OBSTACLE";

export type BoardCell = string | null; // null = 빈 칸, OBSTACLE = 방해블록, 그 외 문자열 = 색(CSS 값)
export type Board = BoardCell[][];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<BoardCell>(BOARD_SIZE).fill(null));
}

export function canPlace(board: Board, piece: Piece, atRow: number, atCol: number): boolean {
  for (const [dr, dc] of piece.shape.cells) {
    const r = atRow + dr;
    const c = atCol + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== null) return false;
  }
  return true;
}

export function placePiece(board: Board, piece: Piece, atRow: number, atCol: number): Board {
  const next = board.map((row) => row.slice());
  for (const [dr, dc] of piece.shape.cells) {
    next[atRow + dr][atCol + dc] = piece.color;
  }
  return next;
}

export function findFullLines(board: Board): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) rows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => row[c] !== null)) cols.push(c);
  }
  return { rows, cols };
}

export function clearLines(board: Board, rows: number[], cols: number[]): Board {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  return board.map((row, r) =>
    row.map((cell, c) => (rowSet.has(r) || colSet.has(c) ? null : cell))
  );
}

export function hasAnyValidMove(board: Board, pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(board, piece, r, c)) return true;
      }
    }
  }
  return false;
}

/** 배치 점수 + 라인 클리어 점수(콤보 보너스 포함) */
export function scoreForMove(cellsPlaced: number, linesCleared: number): number {
  if (linesCleared === 0) return cellsPlaced;
  const lineScore = linesCleared * BOARD_SIZE * 10;
  const comboBonus = linesCleared > 1 ? linesCleared * 50 : 0;
  return cellsPlaced + lineScore + comboBonus;
}

// ─── 스테이지 / 방해 블록 ────────────────────────────────────────────
// 라인을 일정 개수 지울 때마다 스테이지가 올라가고, 그때마다 빈 칸 일부가
// 자동으로 방해 블록(OBSTACLE)으로 채워진다. 없애는 방법은 똑같이
// 그 칸이 속한 가로/세로 줄을 완성해서 클리어하는 것 — 별도 조작 없음.
export const LINES_PER_STAGE = 3;

export function stageForLines(totalLinesCleared: number): number {
  return 1 + Math.floor(totalLinesCleared / LINES_PER_STAGE);
}

export function obstacleCountForStage(stage: number): number {
  return Math.min(2 + stage, 10);
}

/** 줄을 즉시 완성시키지 않는 빈 칸만 골라 방해 블록을 놓는다 */
export function addObstacles(board: Board, count: number): { board: Board; placed: number } {
  const empties: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) empties.push([r, c]);
    }
  }
  for (let i = empties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empties[i], empties[j]] = [empties[j], empties[i]];
  }

  let next = board.map((row) => row.slice());
  let placed = 0;
  for (const [r, c] of empties) {
    if (placed >= count) break;
    const candidate = next.map((row) => row.slice());
    candidate[r][c] = OBSTACLE;
    const { rows, cols } = findFullLines(candidate);
    if (rows.length > 0 || cols.length > 0) continue; // 즉시 클리어되는 칸은 방해블록 자리로 부적합
    next = candidate;
    placed += 1;
  }
  return { board: next, placed };
}
