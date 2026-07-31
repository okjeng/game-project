import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "./config";
import { createInitialState, step, type GameState } from "./engine";
import { draw, type FloatingText } from "./draw";
import {
  fetchFamilyRanking,
  getFamilyRanking,
  getMyBestScore,
  submitScore,
  type RankingEntry,
} from "../../lib/storage";
import { isMuted, toggleMuted } from "../../lib/sound";
import {
  initGateShooterAudio,
  playGameOverSfx,
  playGateNegativeSfx,
  playGatePositiveSfx,
  playHitSfx,
  playNewRecordSfx,
  playShootSfx,
  playStartSfx,
  startGateShooterMusic,
  stopGateShooterMusic,
} from "./sfx";
import "./GateShooterGame.css";

type Phase = "start" | "playing" | "gameover";

let floatingTextSeq = 0;

export default function GateShooterGame({
  playerName,
  onExit,
}: {
  playerName: string;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [characters, setCharacters] = useState<number>(GAME_CONFIG.startingCharacters);
  const [best, setBest] = useState(() => getMyBestScore("gate-shooter"));
  const [finalStats, setFinalStats] = useState<{ score: number; monstersDefeated: number } | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getFamilyRanking("gate-shooter"));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const targetXRef = useRef(GAME_CONFIG.worldWidth / 2);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const charactersRef = useRef<number>(GAME_CONFIG.startingCharacters);

  const refreshRanking = () => {
    fetchFamilyRanking("gate-shooter").then((server) => {
      setRanking(server);
      setBest((prev) => Math.max(prev, getMyBestScore("gate-shooter")));
    });
  };

  useEffect(() => {
    refreshRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    targetXRef.current = GAME_CONFIG.worldWidth / 2;
    floatingTextsRef.current = [];
    scoreRef.current = 0;
    charactersRef.current = GAME_CONFIG.startingCharacters;
    setScore(0);
    setCharacters(GAME_CONFIG.startingCharacters);

    let raf = 0;
    let last = performance.now();
    let stopped = false;

    const loop = (now: number) => {
      if (stopped) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (keysRef.current.has("left")) targetXRef.current -= GAME_CONFIG.playerKeyboardSpeed * dt;
      if (keysRef.current.has("right")) targetXRef.current += GAME_CONFIG.playerKeyboardSpeed * dt;
      targetXRef.current = Math.max(0, Math.min(GAME_CONFIG.worldWidth, targetXRef.current));

      const { state: next, events } = step(stateRef.current, dt, targetXRef.current);
      stateRef.current = next;

      for (const ev of events) {
        if (ev.type === "kill") {
          floatingTextsRef.current.push({
            id: floatingTextSeq++,
            x: ev.x,
            y: ev.y,
            text: `+${GAME_CONFIG.scorePerKill}`,
            color: "#2ecc71",
            life: 650,
            maxLife: 650,
          });
          playHitSfx();
        } else if (ev.type === "gate") {
          floatingTextsRef.current.push({
            id: floatingTextSeq++,
            x: ev.x,
            y: ev.y - 20,
            text: `${ev.value > 0 ? "+" : ""}${ev.value}`,
            color: ev.value > 0 ? "#2ecc71" : "#ff6b6b",
            life: 900,
            maxLife: 900,
            big: true,
          });
          if (ev.value > 0) playGatePositiveSfx();
          else playGateNegativeSfx();
        } else if (ev.type === "shoot") {
          playShootSfx();
        }
      }
      floatingTextsRef.current = floatingTextsRef.current
        .map((t) => ({ ...t, life: t.life - dt * 1000, y: t.y - dt * 40 }))
        .filter((t) => t.life > 0);

      if (next.score !== scoreRef.current) {
        scoreRef.current = next.score;
        setScore(next.score);
      }
      if (next.characters !== charactersRef.current) {
        charactersRef.current = next.characters;
        setCharacters(next.characters);
      }

      draw(ctx, next, floatingTextsRef.current);

      if (next.status === "gameover") {
        stopped = true;
        stopGateShooterMusic();
        playGameOverSfx();
        const isRecord = submitScore("gate-shooter", playerName, next.score);
        if (isRecord) {
          setBest(next.score);
          window.setTimeout(playNewRecordSfx, 550);
        }
        refreshRanking();
        setFinalStats({ score: next.score, monstersDefeated: next.monstersDefeated });
        setPhase("gameover");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const handlePointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      targetXRef.current = relX * GAME_CONFIG.worldWidth;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.add("left");
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.add("right");
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.delete("left");
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.delete("right");
    };

    canvas.addEventListener("pointermove", handlePointer);
    canvas.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stopGateShooterMusic();
      canvas.removeEventListener("pointermove", handlePointer);
      canvas.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keysRef.current.clear();
    };
  }, [phase, playerName]);

  const startGame = () => {
    initGateShooterAudio();
    playStartSfx();
    startGateShooterMusic();
    setFinalStats(null);
    setPhase("playing");
  };

  const handleMuteToggle = () => {
    initGateShooterAudio();
    setMutedState(toggleMuted());
  };

  const isNewRecord = finalStats != null && finalStats.score > 0 && finalStats.score >= best;

  return (
    <div className="gs-page">
      <div className="gs-topbar container">
        <button className="gs-back" onClick={onExit}>
          ← 나가기
        </button>
        <div className="gs-hud">
          {phase === "playing" && <span className="gs-hud-item">👥 {characters}</span>}
          <button className="gs-mute-btn" onClick={handleMuteToggle} aria-label="소리 켜기/끄기">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {phase === "playing" && (
        <div className="gs-hero-score">
          <div className="gs-hero-score-value">{score.toLocaleString()}</div>
        </div>
      )}

      <div className="gs-stage-wrap">
        <div className="gs-stage" style={{ display: phase === "playing" ? "block" : "none" }}>
          <canvas ref={canvasRef} className="gs-canvas" />
        </div>

        {phase === "start" && (
          <div className="gs-panel">
            <p className="gs-panel-emoji">🔫</p>
            <h1 className="gs-panel-title">GATE SHOOTER</h1>
            <p className="gs-panel-tagline">게이트를 선택하고 몬스터를 물리쳐라!</p>
            <button className="gs-btn gs-btn-primary" onClick={startGame}>
              ▶ 게임 시작
            </button>
            <button className="gs-btn gs-btn-ghost" onClick={() => setShowRanking((v) => !v)}>
              🏆 최고 기록 {best > 0 ? `(${best.toLocaleString()})` : ""}
            </button>
            {showRanking && (
              <div className="gs-ranking">
                {ranking.length === 0 ? (
                  <p className="gs-ranking-empty">아직 기록이 없어요</p>
                ) : (
                  ranking.slice(0, 5).map((r, i) => (
                    <div key={r.name} className="gs-ranking-row">
                      <span>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}위`} {r.name}</span>
                      <span>{r.score.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="gs-panel-hint">← → 이동 · 좋은 게이트를 선택하세요!</p>
          </div>
        )}

        {phase === "gameover" && finalStats && (
          <div className="gs-panel">
            {isNewRecord && <p className="gs-record-badge">🎉 신기록!</p>}
            <h1 className="gs-panel-title">GAME OVER</h1>
            <p className="gs-final-score">{finalStats.score.toLocaleString()}</p>
            <div className="gs-final-stats">
              <div>
                <span className="gs-final-stat-label">처치한 몬스터</span>
                <span className="gs-final-stat-value">{finalStats.monstersDefeated}</span>
              </div>
              <div>
                <span className="gs-final-stat-label">최고 기록</span>
                <span className="gs-final-stat-value">{best.toLocaleString()}</span>
              </div>
            </div>
            <div className="gs-overlay-actions">
              <button className="gs-btn gs-btn-primary" onClick={startGame}>
                다시 플레이
              </button>
              <button className="gs-btn gs-btn-ghost" onClick={onExit}>
                메인으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
