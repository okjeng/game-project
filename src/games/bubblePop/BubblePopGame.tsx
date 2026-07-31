import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "./config";
import { createInitialState, step, type BubblePopState, type Input } from "./engine";
import { draw } from "./draw";
import { isMuted, toggleMuted } from "../../lib/sound";
import {
  initBubblePopAudio,
  playEscapeSfx,
  playGameOverSfx,
  playHurtSfx,
  playNewRecordSfx,
  playPopSfx,
  playRoundClearSfx,
  playShootSfx,
  playTrapSfx,
  startBubblePopMusic,
  stopBubblePopMusic,
} from "./sfx";
import { fetchFamilyRanking, getFamilyRanking, getMyBestScore, submitScore, type RankingEntry } from "../../lib/storage";
import "./BubblePopGame.css";

type Phase = "start" | "playing" | "gameover";

export default function BubblePopGame({ playerName, onExit }: { playerName: string; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState<number>(GAME_CONFIG.startingLives);
  const [round, setRound] = useState(1);
  const [roundClearShown, setRoundClearShown] = useState(false);
  const [best, setBest] = useState(() => getMyBestScore("bubble-pop"));
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getFamilyRanking("bubble-pop"));
  const [showRanking, setShowRanking] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [finalStats, setFinalStats] = useState<{ score: number; round: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BubblePopState>(createInitialState());
  const scoreRef = useRef(0);
  const livesRef = useRef<number>(GAME_CONFIG.startingLives);
  const roundRef = useRef(1);
  const heldRef = useRef({ left: false, right: false, jump: false, shoot: false });

  const refreshRanking = () => {
    fetchFamilyRanking("bubble-pop").then((server) => {
      setRanking(server);
      setBest((prev) => Math.max(prev, getMyBestScore("bubble-pop")));
    });
  };

  useEffect(() => {
    refreshRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMuteToggle = () => {
    initBubblePopAudio();
    setMutedState(toggleMuted());
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GAME_CONFIG.worldWidth * dpr;
    canvas.height = GAME_CONFIG.worldHeight * dpr;
    ctx.scale(dpr, dpr);

    stateRef.current = createInitialState();
    scoreRef.current = 0;
    livesRef.current = GAME_CONFIG.startingLives;
    roundRef.current = 1;
    setScore(0);
    setLives(GAME_CONFIG.startingLives);
    setRound(1);
    setRoundClearShown(false);

    let raf = 0;
    let last = performance.now();
    let stopped = false;
    let jumpConsumed = false;
    let shootConsumed = false;

    const loop = (now: number) => {
      if (stopped) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const held = heldRef.current;
      const moveDir: Input["moveDir"] = held.left && !held.right ? -1 : held.right && !held.left ? 1 : 0;
      const jumpPressed = held.jump && !jumpConsumed;
      jumpConsumed = held.jump;
      const shootPressed = held.shoot && !shootConsumed;
      shootConsumed = held.shoot;

      const { state: next, events } = step(stateRef.current, dt, {
        moveDir,
        jumpPressed,
        shootPressed,
      });
      stateRef.current = next;

      for (const ev of events) {
        if (ev.type === "shoot") playShootSfx();
        else if (ev.type === "trap") playTrapSfx();
        else if (ev.type === "pop") playPopSfx(ev.combo);
        else if (ev.type === "escape") playEscapeSfx();
        else if (ev.type === "hurt") playHurtSfx();
        else if (ev.type === "roundclear") {
          playRoundClearSfx();
          setRoundClearShown(true);
          window.setTimeout(() => setRoundClearShown(false), GAME_CONFIG.roundClearPauseSec * 1000 - 100);
        } else if (ev.type === "gameover") {
          stopped = true;
          stopBubblePopMusic();
          playGameOverSfx();
          const isRecord = submitScore("bubble-pop", playerName, next.score);
          if (isRecord) {
            setBest(next.score);
            window.setTimeout(playNewRecordSfx, 550);
          }
          setFinalStats({ score: next.score, round: next.round });
          setPhase("gameover");
          refreshRanking();
        }
      }

      if (next.score !== scoreRef.current) {
        scoreRef.current = next.score;
        setScore(next.score);
      }
      if (next.lives !== livesRef.current) {
        livesRef.current = next.lives;
        setLives(next.lives);
      }
      if (next.round !== roundRef.current) {
        roundRef.current = next.round;
        setRound(next.round);
      }

      draw(ctx, next);

      if (next.status !== "gameover") raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") heldRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") heldRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") heldRef.current.jump = true;
      if (e.key === "z" || e.key === "Z" || e.key === "Enter") heldRef.current.shoot = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") heldRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") heldRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") heldRef.current.jump = false;
      if (e.key === "z" || e.key === "Z" || e.key === "Enter") heldRef.current.shoot = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stopBubblePopMusic();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      heldRef.current = { left: false, right: false, jump: false, shoot: false };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerName]);

  const startGame = () => {
    initBubblePopAudio();
    startBubblePopMusic();
    setFinalStats(null);
    setPhase("playing");
  };

  const isNewRecord = finalStats != null && finalStats.score > 0 && finalStats.score >= best;

  const bindHold = (key: keyof typeof heldRef.current) => ({
    onPointerDown: () => {
      heldRef.current[key] = true;
    },
    onPointerUp: () => {
      heldRef.current[key] = false;
    },
    onPointerLeave: () => {
      heldRef.current[key] = false;
    },
    onPointerCancel: () => {
      heldRef.current[key] = false;
    },
  });

  return (
    <div className="bp-page">
      <div className="bp-topbar container">
        <button className="bp-back" onClick={onExit}>
          ← 나가기
        </button>
        <div className="bp-hud">
          {phase === "playing" && (
            <>
              <span className="bp-hud-item">
                {"❤️".repeat(Math.max(lives, 0))}
                {"🖤".repeat(Math.max(GAME_CONFIG.startingLives - lives, 0))}
              </span>
              <span className="bp-hud-item">ROUND {round}</span>
            </>
          )}
          <button className="bp-mute-btn" onClick={handleMuteToggle} aria-label="소리 켜기/끄기">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {phase === "playing" && (
        <div className="bp-hero-score">
          <div className="bp-hero-score-value">{score.toLocaleString()}</div>
        </div>
      )}

      <div className="bp-stage-wrap">
        <div className="bp-stage" style={{ display: phase === "playing" ? "block" : "none" }}>
          <canvas ref={canvasRef} className="bp-canvas" />
          {roundClearShown && (
            <div className="bp-round-clear">
              <p>ROUND CLEAR!</p>
            </div>
          )}
        </div>

        {phase === "start" && (
          <div className="bp-panel">
            <p className="bp-panel-emoji">🫧</p>
            <h1 className="bp-panel-title">방울팡!</h1>
            <p className="bp-panel-tagline">거품으로 몬스터를 가두고 톡! 터뜨리세요!</p>
            <button className="bp-btn bp-btn-primary" onClick={startGame}>
              ▶ 게임 시작
            </button>
            <button className="bp-btn bp-btn-ghost" onClick={() => setShowRanking((v) => !v)}>
              🏆 최고 기록 {best > 0 ? `(${best.toLocaleString()})` : ""}
            </button>
            {showRanking && (
              <div className="bp-ranking">
                {ranking.length === 0 ? (
                  <p className="bp-ranking-empty">아직 기록이 없어요</p>
                ) : (
                  ranking.slice(0, 5).map((r, i) => (
                    <div key={r.name} className="bp-ranking-row">
                      <span>
                        {["🥇", "🥈", "🥉"][i] ?? `${i + 1}위`} {r.name}
                      </span>
                      <span>{r.score.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="bp-panel-hint">PC: ← → 이동 · ↑/스페이스 점프 · Z 버블 발사</p>
          </div>
        )}

        {phase === "gameover" && finalStats && (
          <div className="bp-panel">
            {isNewRecord && <p className="bp-record-badge">🎉 신기록!</p>}
            <h1 className="bp-panel-title">GAME OVER</h1>
            <p className="bp-final-score">{finalStats.score.toLocaleString()}</p>
            <p className="bp-final-sub">
              {playerName}님 · ROUND {finalStats.round}까지 도달 · 최고 기록 {best.toLocaleString()}
            </p>
            <div className="bp-overlay-actions">
              <button className="bp-btn bp-btn-primary" onClick={startGame}>
                다시 플레이
              </button>
              <button className="bp-btn bp-btn-ghost" onClick={onExit}>
                메인으로
              </button>
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && (
        <div className="bp-controls container">
          <div className="bp-dpad">
            <button className="bp-ctrl-btn" {...bindHold("left")} aria-label="왼쪽">
              ◀
            </button>
            <button className="bp-ctrl-btn" {...bindHold("right")} aria-label="오른쪽">
              ▶
            </button>
          </div>
          <div className="bp-action-buttons">
            <button className="bp-ctrl-btn bp-ctrl-shoot" {...bindHold("shoot")} aria-label="버블 발사">
              🫧
            </button>
            <button className="bp-ctrl-btn bp-ctrl-jump" {...bindHold("jump")} aria-label="점프">
              ⤴
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
