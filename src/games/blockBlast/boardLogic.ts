import type { Piece } from "./shapes";

export const BOARD_SIZE = 8;

export type BoardCell = string | null; // null = 빈 칸, 그 외 문자열 = 색(CSS 값)
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
