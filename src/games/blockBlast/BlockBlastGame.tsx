import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOARD_SIZE,
  canPlace,
  clearLines,
  createEmptyBoard,
  findFullLines,
  hasAnyValidMove,
  placePiece,
  scoreForMove,
  type Board,
} from "./boardLogic";
import { randomPiece, shapeBounds, type Piece } from "./shapes";
import { fetchFamilyRanking, getMyBestScore, submitScore } from "../../lib/storage";
import { isMuted, toggleMuted } from "../../lib/sound";
import {
  initBlockBlastAudio,
  playGameOverSfx,
  playGameStartSfx,
  playLineClearSfx,
  playNewRecordSfx,
  playPlaceSfx,
  startBlockBlastMusic,
  stopBlockBlastMusic,
} from "./sfx";
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
  const [muted, setMutedState] = useState(() => isMuted());

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragRafRef = useRef<number | null>(null);

  useEffect(() => {
    initBlockBlastAudio();
    playGameStartSfx();
    startBlockBlastMusic();
    return () => {
      stopBlockBlastMusic();
      if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFamilyRanking("block-blast").then(() => {
      if (cancelled) return;
      const serverBest = getMyBestScore("block-blast");
      setBest((prev) => Math.max(prev, serverBest));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMuteToggle = () => {
    initBlockBlastAudio();
    setMutedState(toggleMuted());
  };

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

  const flushDrag = () => {
    dragRafRef.current = null;
    setDrag(dragRef.current);
  };

  const scheduleDragFlush = () => {
    if (dragRafRef.current != null) return;
    dragRafRef.current = requestAnimationFrame(flushDrag);
  };

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    if (gameOver) return;
    const piece = tray[index];
    if (!piece) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { row, col } = computeAnchor(piece, e.clientX, e.clientY);
    const next: DragState = {
      trayIndex: index,
      piece,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      anchorRow: row,
      anchorCol: col,
      valid: canPlace(board, piece, row, col),
    };
    dragRef.current = next;
    setDrag(next);
  };

  // 포인터 이동은 화면 주사율보다 훨씬 빠르게(특히 터치) 들어올 수 있어서,
  // 매번 setState로 보드 64칸을 다시 그리면 순간순간 끊기는 느낌이 난다.
  // 최신 위치는 ref에만 쌓아두고, 실제 렌더는 requestAnimationFrame으로 프레임당 1번만 반영한다.
  const handlePointerMove = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointerId) return;
    const { row, col } = computeAnchor(current.piece, e.clientX, e.clientY);
    dragRef.current = {
      ...current,
      x: e.clientX,
      y: e.clientY,
      anchorRow: row,
      anchorCol: col,
      valid: canPlace(board, current.piece, row, col),
    };
    scheduleDragFlush();
  };

  const finishDrag = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointerId) return;
    const { piece, trayIndex, anchorRow, anchorCol, valid } = current;
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    dragRef.current = null;
    setDrag(null);
    if (!valid) return;

    playPlaceSfx();

    const placed = placePiece(board, piece, anchorRow, anchorCol);
    const { rows, cols } = findFullLines(placed);
    const totalLines = rows.length + cols.length;
    let nextBoard = totalLines > 0 ? clearLines(placed, rows, cols) : placed;
    const gained = scoreForMove(piece.shape.cells.length, totalLines);
    if (totalLines > 0) playLineClearSfx(totalLines);

    let nextTray: Tray = [...tray] as Tray;
    nextTray[trayIndex] = null;
    if (nextTray.every((p) => p === null)) nextTray = freshTray();

    const newScore = score + gained;
    setScore(newScore);
    setBoard(nextBoard);
    setTray(nextTray);

    const isRecord = submitScore("block-blast", playerName, newScore);
    if (isRecord) {
      setBest(newScore);
    }

    if (totalLines > 0) {
      setClearingFlash({ rows, cols });
      window.setTimeout(() => setClearingFlash(null), 260);
    }

    if (!hasAnyValidMove(nextBoard, nextTray)) {
      setGameOver(true);
      stopBlockBlastMusic();
      playGameOverSfx();
      if (isRecord) window.setTimeout(playNewRecordSfx, 550);
    }
  };

  const restart = () => {
    setBoard(createEmptyBoard());
    setTray(freshTray());
    setScore(0);
    setGameOver(false);
    dragRef.current = null;
    setDrag(null);
    startBlockBlastMusic();
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
        <div className="bb-topbar-right">
          <button className="bb-mute-btn" onClick={handleMuteToggle} aria-label="소리 켜기/끄기">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
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
              return (
                <div
                  key={key}
                  className={
                    "bb-cell" +
                    (cell ? " bb-cell-filled" : "") +
                    (isPreview ? (drag?.valid ? " bb-cell-preview-ok" : " bb-cell-preview-bad") : "") +
                    (isFlashing ? " bb-cell-flash" : "")
                  }
                  style={cell ? { background: cell } : undefined}
                />
              );
            })
          )}
        </div>

        <div className="bb-tray">
          {tray.map((piece, i) => (
            <div
              key={piece?.uid ?? `empty-${i}`}
              className="bb-tray-slot"
              style={{ touchAction: "none" }}
              onPointerDown={piece ? handlePointerDown(i) : undefined}
              onPointerMove={piece ? handlePointerMove : undefined}
              onPointerUp={piece ? finishDrag : undefined}
              onPointerCancel={piece ? finishDrag : undefined}
            >
              {piece && <PieceView piece={piece} dimmed={drag?.trayIndex === i} />}
            </div>
          ))}
        </div>
      </div>

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

function PieceView({ piece, dimmed }: { piece: Piece; dimmed: boolean }) {
  return (
    <div className={"bb-piece" + (dimmed ? " bb-piece-dragging" : "")}>
      <PieceShape shape={piece.shape} color={piece.color} cellSize={20} gap={2} />
    </div>
  );
}
