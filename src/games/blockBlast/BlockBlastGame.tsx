import { useCallback, useMemo, useRef, useState } from "react";
import {
  BOARD_SIZE,
  OBSTACLE,
  addObstacles,
  canPlace,
  clearLines,
  createEmptyBoard,
  findFullLines,
  hasAnyValidMove,
  obstacleCountForStage,
  placePiece,
  scoreForMove,
  stageForLines,
  type Board,
} from "./boardLogic";
import { randomPiece, shapeBounds, type Piece } from "./shapes";
import { getMyBestScore, recordScore } from "../../lib/storage";
import "./BlockBlastGame.css";

const DRAG_LIFT_PX = 64;

type Tray = [Piece | null, Piece | null, Piece | null];

type DragState = {
  trayIndex: number;
  piece: Piece;
  pointerId: number;
  x: number;
  y: number;
  anchorRow: number;
  anchorCol: number;
  valid: boolean;
};

function freshTray(): Tray {
  return [randomPiece(), randomPiece(), randomPiece()];
}

export default function BlockBlastGame({
  playerName,
  onExit,
}: {
  playerName: string;
  onExit: () => void;
}) {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [tray, setTray] = useState<Tray>(() => freshTray());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => getMyBestScore("block-blast"));
  const [gameOver, setGameOver] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [clearingFlash, setClearingFlash] = useState<{ rows: number[]; cols: number[] } | null>(null);
  const [totalLinesCleared, setTotalLinesCleared] = useState(0);
  const [stage, setStage] = useState(1);
  const [stageBanner, setStageBanner] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);

  const isNewRecord = gameOver && score > 0 && score >= best;

  const computeAnchor = useCallback((piece: Piece, clientX: number, clientY: number) => {
    const el = boardRef.current;
    if (!el) return { row: -99, col: -99 };
    const rect = el.getBoundingClientRect();
    const cell = rect.width / BOARD_SIZE;
    const liftedY = clientY - DRAG_LIFT_PX;
    const bounds = shapeBounds(piece.shape);
    const centerCol = (clientX - rect.left) / cell;
    const centerRow = (liftedY - rect.top) / cell;
    const anchorCol = Math.round(centerCol - bounds.cols / 2);
    const anchorRow = Math.round(centerRow - bounds.rows / 2);
    return { row: anchorRow, col: anchorCol };
  }, []);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    if (gameOver) return;
    const piece = tray[index];
    if (!piece) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { row, col } = computeAnchor(piece, e.clientX, e.clientY);
    setDrag({
      trayIndex: index,
      piece,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      anchorRow: row,
      anchorCol: col,
      valid: canPlace(board, piece, row, col),
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { row, col } = computeAnchor(drag.piece, e.clientX, e.clientY);
    setDrag({
      ...drag,
      x: e.clientX,
      y: e.clientY,
      anchorRow: row,
      anchorCol: col,
      valid: canPlace(board, drag.piece, row, col),
    });
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { piece, trayIndex, anchorRow, anchorCol, valid } = drag;
    setDrag(null);
    if (!valid) return;

    const placed = placePiece(board, piece, anchorRow, anchorCol);
    const { rows, cols } = findFullLines(placed);
    const totalLines = rows.length + cols.length;
    let nextBoard = totalLines > 0 ? clearLines(placed, rows, cols) : placed;
    const gained = scoreForMove(piece.shape.cells.length, totalLines);

    // 스테이지 진행: 누적 라인 클리어 수에 따라 스테이지가 오르면 방해블록 등장
    const newTotalLines = totalLinesCleared + totalLines;
    const newStage = stageForLines(newTotalLines);
    if (newStage > stage) {
      const spawn = obstacleCountForStage(newStage);
      nextBoard = addObstacles(nextBoard, spawn).board;
      setStage(newStage);
      setStageBanner(newStage);
      window.setTimeout(() => setStageBanner(null), 1400);
    }
    setTotalLinesCleared(newTotalLines);

    let nextTray: Tray = [...tray] as Tray;
    nextTray[trayIndex] = null;
    if (nextTray.every((p) => p === null)) nextTray = freshTray();

    const newScore = score + gained;
    setScore(newScore);
    setBoard(nextBoard);
    setTray(nextTray);

    if (recordScore("block-blast", playerName, newScore)) {
      setBest(newScore);
    }

    if (totalLines > 0) {
      setClearingFlash({ rows, cols });
      window.setTimeout(() => setClearingFlash(null), 260);
    }

    if (!hasAnyValidMove(nextBoard, nextTray)) {
      setGameOver(true);
    }
  };

  const restart = () => {
    setBoard(createEmptyBoard());
    setTray(freshTray());
    setScore(0);
    setGameOver(false);
    setDrag(null);
    setTotalLinesCleared(0);
    setStage(1);
    setStageBanner(null);
  };

  const previewCells = useMemo(() => {
    if (!drag) return null;
    const set = new Set<string>();
    for (const [dr, dc] of drag.piece.shape.cells) {
      set.add(`${drag.anchorRow + dr},${drag.anchorCol + dc}`);
    }
    return set;
  }, [drag]);

  return (
    <div className="bb-page">
      <div className="bb-topbar container">
        <button className="bb-back" onClick={onExit}>
          ← 나가기
        </button>
        <div className="bb-stage-badge">STAGE {stage}</div>
      </div>

      <div className="bb-hero-score">
        <div className="bb-hero-score-value">{score.toLocaleString()}</div>
        <div className="bb-hero-score-best">🏆 최고 {best.toLocaleString()}</div>
      </div>

      <div className="bb-stage">
        <div className="bb-board" ref={boardRef}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const isPreview = previewCells?.has(key) ?? false;
              const isFlashing =
                clearingFlash != null &&
                (clearingFlash.rows.includes(r) || clearingFlash.cols.includes(c));
              const isObstacle = cell === OBSTACLE;
              return (
                <div
                  key={key}
                  className={
                    "bb-cell" +
                    (cell ? " bb-cell-filled" : "") +
                    (isObstacle ? " bb-cell-obstacle" : "") +
                    (isPreview ? (drag?.valid ? " bb-cell-preview-ok" : " bb-cell-preview-bad") : "") +
                    (isFlashing ? " bb-cell-flash" : "")
                  }
                  style={cell && !isObstacle ? { background: cell } : undefined}
                />
              );
            })
          )}
        </div>

        <div className="bb-tray">
          {tray.map((piece, i) => (
            <div key={piece?.uid ?? `empty-${i}`} className="bb-tray-slot">
              {piece && (
                <PieceView
                  piece={piece}
                  dimmed={drag?.trayIndex === i}
                  onPointerDown={handlePointerDown(i)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {stageBanner != null && (
        <div className="bb-stage-toast">
          <p className="bb-stage-toast-title">STAGE {stageBanner}</p>
          <p className="bb-stage-toast-sub">⚠ 방해 블록 등장!</p>
        </div>
      )}

      {drag && (
        <div
          className="bb-ghost"
          style={{ left: drag.x, top: drag.y - DRAG_LIFT_PX }}
        >
          <PieceShape shape={drag.piece.shape} color={drag.piece.color} cellSize={26} gap={3} />
        </div>
      )}

      {gameOver && (
        <div className="bb-overlay">
          <div className="bb-overlay-card">
            {isNewRecord && <p className="bb-record-badge">🎉 신기록!</p>}
            <h2>게임 종료</h2>
            <p className="bb-final-score">{score.toLocaleString()}점</p>
            <p className="bb-final-sub">{playerName}님의 최고 기록: {best.toLocaleString()}점</p>
            <div className="bb-overlay-actions">
              <button className="bb-btn bb-btn-primary" onClick={restart}>
                다시 하기
              </button>
              <button className="bb-btn" onClick={onExit}>
                메인으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PieceShape({
  shape,
  color,
  cellSize,
  gap,
}: {
  shape: Piece["shape"];
  color: string;
  cellSize: number;
  gap: number;
}) {
  const bounds = shapeBounds(shape);
  const cellSet = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
  return (
    <div
      className="bb-piece-grid"
      style={{
        gridTemplateRows: `repeat(${bounds.rows}, ${cellSize}px)`,
        gridTemplateColumns: `repeat(${bounds.cols}, ${cellSize}px)`,
        gap,
      }}
    >
      {Array.from({ length: bounds.rows }).map((_, r) =>
        Array.from({ length: bounds.cols }).map((_, c) => {
          const filled = cellSet.has(`${r},${c}`);
          return (
            <div
              key={`${r},${c}`}
              className={filled ? "bb-piece-cell" : "bb-piece-cell bb-piece-cell-empty"}
              style={filled ? { background: color } : undefined}
            />
          );
        })
      )}
    </div>
  );
}

function PieceView({
  piece,
  dimmed,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  piece: Piece;
  dimmed: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={"bb-piece" + (dimmed ? " bb-piece-dragging" : "")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: "none" }}
    >
      <PieceShape shape={piece.shape} color={piece.color} cellSize={20} gap={2} />
    </div>
  );
}
