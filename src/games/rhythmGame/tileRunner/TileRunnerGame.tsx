import { useEffect, useRef, useState } from "react";
import { RUNNER_CONFIG } from "./config";
import { createInitialState, setLane, tick, type Lane, type RunnerState } from "./engine";
import { draw, type JudgeText } from "./draw";
import { RUNNER_BEAT_SEC } from "./track";
import { audioNow, isMuted, toggleMuted } from "../../../lib/sound";
import { initRhythmAudio, playCountdownBeep, playFinishedSfx, playMissSfx, playNewRecordSfx } from "../sfx";
import { playRunnerHitSfx, scheduleRunnerBassPulses } from "./sfx";
import { fetchFamilyRanking, getFamilyRanking, getMyBestScore, submitScore, type RankingEntry } from "../../../lib/storage";
import "../RhythmGame.css";
import "./TileRunnerGame.css";

const SCORE_ID = "rhythm-tile-runner";
type Phase = "start" | "playing" | "finished";

let judgeTextSeq = 0;

export default function TileRunnerGame({ playerName, onExit }: { playerName: string; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState<number>(RUNNER_CONFIG.lives);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [best, setBest] = useState(() => getMyBestScore(SCORE_ID));
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getFamilyRanking(SCORE_ID));
  const [showRanking, setShowRanking] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [finalStats, setFinalStats] = useState<{
    score: number;
    hit: number;
    miss: number;
    maxCombo: number;
    cleared: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<RunnerState | null>(null);
  const songStartRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const judgeTextsRef = useRef<JudgeText[]>([]);

  const refreshRanking = () => {
    fetchFamilyRanking(SCORE_ID).then((server) => {
      setRanking(server);
      setBest((prev) => Math.max(prev, getMyBestScore(SCORE_ID)));
    });
  };

  useEffect(() => {
    refreshRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMuteToggle = () => {
    initRhythmAudio();
    setMutedState(toggleMuted());
  };

  const moveTo = (lane: Lane) => {
    if (!stateRef.current || phase !== "playing") return;
    stateRef.current = setLane(stateRef.current, lane);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = RUNNER_CONFIG.worldWidth * dpr;
    canvas.height = RUNNER_CONFIG.worldHeight * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let stopped = false;

    const loop = () => {
      if (stopped || !stateRef.current) return;
      const now = audioNow();

      const remain = songStartRef.current - now;
      const nextLabel = remain > 1.4 ? "3" : remain > 0.7 ? "2" : remain > 0 ? "1" : null;
      setCountdownLabel(nextLabel);

      const { state: next, events } = tick(stateRef.current, now, songStartRef.current);
      stateRef.current = next;

      for (const ev of events) {
        if (ev.type === "hit") {
          judgeTextsRef.current.push({
            id: judgeTextSeq++,
            text: "GREAT",
            color: "#2ecc71",
            life: 450,
            maxLife: 450,
          });
          playRunnerHitSfx(ev.lane);
          if (next.score !== scoreRef.current) {
            scoreRef.current = next.score;
            setScore(next.score);
          }
          if (next.combo !== comboRef.current) {
            comboRef.current = next.combo;
            setCombo(next.combo);
          }
        } else if (ev.type === "miss") {
          judgeTextsRef.current.push({
            id: judgeTextSeq++,
            text: "MISS",
            color: "#ff6b6b",
            life: 450,
            maxLife: 450,
          });
          playMissSfx();
          comboRef.current = 0;
          setCombo(0);
          setLives(next.lives);
        } else if (ev.type === "gameover" || ev.type === "cleared") {
          stopped = true;
          playFinishedSfx();
          const isRecord = submitScore(SCORE_ID, playerName, next.score);
          if (isRecord) {
            setBest(next.score);
            window.setTimeout(playNewRecordSfx, 550);
          }
          setFinalStats({
            score: next.score,
            hit: next.hitCount,
            miss: next.missCount,
            maxCombo: next.maxCombo,
            cleared: ev.type === "cleared",
          });
          setPhase("finished");
          refreshRanking();
          return;
        }
      }

      judgeTextsRef.current = judgeTextsRef.current
        .map((t) => ({ ...t, life: t.life - 16 }))
        .filter((t) => t.life > 0);

      draw(ctx, next, now, RUNNER_BEAT_SEC, judgeTextsRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") moveTo(Math.max(0, stateRef.current.currentLane - 1) as Lane);
      else if (key === "arrowright" || key === "d") moveTo(Math.min(2, stateRef.current.currentLane + 1) as Lane);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = () => {
    initRhythmAudio();
    const start = audioNow() + RUNNER_CONFIG.leadInSec;
    songStartRef.current = start;
    stateRef.current = createInitialState(start);
    scoreRef.current = 0;
    comboRef.current = 0;
    judgeTextsRef.current = [];
    setScore(0);
    setCombo(0);
    setLives(RUNNER_CONFIG.lives);
    setFinalStats(null);
    scheduleRunnerBassPulses(start);

    const leadMs = RUNNER_CONFIG.leadInSec * 1000;
    window.setTimeout(() => playCountdownBeep(false), Math.max(0, leadMs - 2000));
    window.setTimeout(() => playCountdownBeep(false), Math.max(0, leadMs - 1000));
    window.setTimeout(() => playCountdownBeep(true), Math.max(0, leadMs));

    setPhase("playing");
  };

  const isNewRecord = finalStats != null && finalStats.score > 0 && finalStats.score >= best;

  return (
    <div className="rg-page">
      <div className="rg-topbar container">
        <button className="rg-back" onClick={onExit}>
          ← 나가기
        </button>
        <div className="rg-hud">
          {phase === "playing" && (
            <>
              <span className="tr-lives">{"❤️".repeat(Math.max(0, lives))}</span>
              <span className="rg-combo">COMBO {combo}</span>
            </>
          )}
          <button className="rg-mute-btn" onClick={handleMuteToggle} aria-label="소리 켜기/끄기">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {phase === "playing" && (
        <div className="rg-hero-score">
          <div className="rg-hero-score-value">{score.toLocaleString()}</div>
        </div>
      )}

      <div className="rg-stage-wrap">
        <div className="rg-stage" style={{ display: phase === "playing" ? "block" : "none" }}>
          <canvas ref={canvasRef} className="rg-canvas" />
          {phase === "playing" && (
            <div className="tr-touch-lanes">
              {[0, 1, 2].map((i) => (
                <button key={i} className="rg-touch-lane" onPointerDown={() => moveTo(i as Lane)} />
              ))}
            </div>
          )}
          {countdownLabel && <div className="rg-countdown">{countdownLabel}</div>}
        </div>

        {phase === "start" && (
          <div className="rg-panel">
            <p className="rg-panel-emoji">🏃</p>
            <h1 className="rg-panel-title">TILE RUNNER</h1>
            <p className="rg-panel-tagline">박자에 맞춰 타일 위로 이동하세요! 놓치면 하트가 줄어요.</p>
            <button className="rg-btn rg-btn-primary" onClick={startGame}>
              ▶ 게임 시작
            </button>
            <button className="rg-btn rg-btn-ghost" onClick={() => setShowRanking((v) => !v)}>
              🏆 최고 기록 {best > 0 ? `(${best.toLocaleString()})` : ""}
            </button>
            {showRanking && (
              <div className="rg-ranking">
                {ranking.length === 0 ? (
                  <p className="rg-ranking-empty">아직 기록이 없어요</p>
                ) : (
                  ranking.slice(0, 5).map((r, i) => (
                    <div key={r.name} className="rg-ranking-row">
                      <span>
                        {["🥇", "🥈", "🥉"][i] ?? `${i + 1}위`} {r.name}
                      </span>
                      <span>{r.score.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="rg-panel-hint">PC: ← → 방향키 &nbsp;·&nbsp; 모바일: 화면 3칸 탭</p>
          </div>
        )}

        {phase === "finished" && finalStats && (
          <div className="rg-panel">
            {isNewRecord && <p className="rg-record-badge">🎉 신기록!</p>}
            <h1 className="rg-panel-title">{finalStats.cleared ? "CLEAR!" : "GAME OVER"}</h1>
            <p className="rg-final-score">{finalStats.score.toLocaleString()}</p>
            <div className="rg-final-stats">
              <div>
                <span className="rg-final-stat-label">HIT</span>
                <span className="rg-final-stat-value rg-perfect">{finalStats.hit}</span>
              </div>
              <div>
                <span className="rg-final-stat-label">MISS</span>
                <span className="rg-final-stat-value rg-miss">{finalStats.miss}</span>
              </div>
              <div>
                <span className="rg-final-stat-label">MAX COMBO</span>
                <span className="rg-final-stat-value">{finalStats.maxCombo}</span>
              </div>
            </div>
            <div className="rg-overlay-actions">
              <button className="rg-btn rg-btn-primary" onClick={startGame}>
                다시 플레이
              </button>
              <button className="rg-btn rg-btn-ghost" onClick={onExit}>
                메인으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
