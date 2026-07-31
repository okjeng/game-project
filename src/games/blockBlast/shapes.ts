export type Cell = readonly [row: number, col: number];
export type Shape = { readonly id: string; readonly cells: readonly Cell[] };

/** 좌표는 (row, col), 원점 기준 — 회전은 없음(클래식 블록 퍼즐 방식: 미리 정해진 형태만 등장) */
const RAW_SHAPES: Shape[] = [
  { id: "1", cells: [[0, 0]] },

  { id: "2h", cells: [[0, 0], [0, 1]] },
  { id: "2v", cells: [[0, 0], [1, 0]] },

  { id: "3h", cells: [[0, 0], [0, 1], [0, 2]] },
  { id: "3v", cells: [[0, 0], [1, 0], [2, 0]] },

  { id: "4h", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: "4v", cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },

  { id: "5h", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: "5v", cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },

  { id: "sq2", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: "sq3", cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },

  // L-트로미노(3칸 코너) x4
  { id: "l3a", cells: [[0, 0], [1, 0], [1, 1]] },
  { id: "l3b", cells: [[0, 0], [0, 1], [1, 0]] },
  { id: "l3c", cells: [[0, 0], [0, 1], [1, 1]] },
  { id: "l3d", cells: [[1, 0], [1, 1], [0, 1]] },

  // L-테트로미노 x4
  { id: "l4a", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: "l4b", cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: "l4c", cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "l4d", cells: [[1, 0], [1, 1], [1, 2], [0, 2]] },

  // J-테트로미노(L 좌우반전) x4
  { id: "j4a", cells: [[0, 1], [1, 1], [2, 1], [2, 0]] },
  { id: "j4b", cells: [[1, 0], [0, 0], [0, 1], [0, 2]] },
  { id: "j4c", cells: [[0, 0], [1, 0], [2, 0], [0, 1]] },
  { id: "j4d", cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },

  // T-테트로미노 x4
  { id: "t4a", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: "t4b", cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { id: "t4c", cells: [[1, 0], [1, 1], [1, 2], [0, 1]] },
  { id: "t4d", cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },

  // S/Z 테트로미노
  { id: "s4a", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: "z4a", cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { id: "s4b", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { id: "z4b", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
];

/** 작은 조각이 더 자주 나오도록 가중치를 둔 뽑기 풀 */
const WEIGHTED_POOL: Shape[] = [
  ...RAW_SHAPES.filter((s) => s.cells.length <= 2),
  ...RAW_SHAPES.filter((s) => s.cells.length <= 2),
  ...RAW_SHAPES.filter((s) => s.cells.length === 3),
  ...RAW_SHAPES.filter((s) => s.cells.length === 3),
  ...RAW_SHAPES.filter((s) => s.cells.length === 4),
  ...RAW_SHAPES.filter((s) => s.cells.length >= 5),
];

export const PIECE_COLORS = [
  "var(--neon-green)",
  "var(--neon-violet)",
  "var(--neon-coral)",
  "var(--neon-amber)",
  "var(--neon-cyan)",
] as const;

export type Piece = {
  readonly uid: string;
  readonly shape: Shape;
  readonly color: string;
};

let uidSeq = 0;

export function randomPiece(): Piece {
  const shape = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
  const color = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  uidSeq += 1;
  return { uid: `p${uidSeq}`, shape, color };
}

export function shapeBounds(shape: Shape): { rows: number; cols: number } {
  let maxRow = 0;
  let maxCol = 0;
  for (const [r, c] of shape.cells) {
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }
  return { rows: maxRow + 1, cols: maxCol + 1 };
}
