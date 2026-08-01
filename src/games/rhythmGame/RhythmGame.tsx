import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG, LANE_COLORS, LANE_KEYS } from "./config";
import { createInitialState, hitLane, tick, type RhythmState } from "./engine";
import { draw, type JudgeText } from "./draw";
import { audioNow, isMuted, toggleMuted } from "../../lib/sound";
import {
  initRhythmAudio,
  playCountdownBeep,
  playFinishedSfx,
  playGoodSfx,
  playMissSfx,
  playNewRecordSfx,
  playPerfectSfx,
  scheduleBassPulses,
} from "./sfx";
import { fetchFamilyRanking, getFamilyRanking, getMyBestScore, submitScore, type RankingEntry } from "../../lib/storage";
import RhythmLobby from "./RhythmLobby";
import RhythmStub, { type StubKind } from "./RhythmStub";
import ModeSelect from "./ModeSelect";
import SongSelect from "./SongSelect";
import TileRunnerGame from "./tileRunner/TileRunnerGame";
import { DEFAULT_SONG, type SongMeta } from "./songs";
import { playSongTrack, stopSongTrack } from "./musicTrack";
import "./RhythmGame.css";

type Phase = "lobby" | "stub" | "modeSelect" | "songSelect" | "start" | "playing" | "finished" | "runner";

let judgeTextSeq = 0;

export default function RhythmGame({ playerName, onExit }: { playerName: string; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [stubKind, setStubKind] = useState<StubKind>("song");
  const [selectedSong, setSelectedSong] = useState<SongMeta>(DEFAULT_SONG);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  const [best, setBest] = useState(() => getMyBestScore("rhythm-game"));
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getFamilyRanking("rhythm-game"));
  const [showRanking, setShowRanking] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [finalStats, setFinalStats] = useState<{
    score: number;
    perfect: number;
    good: number;
    miss: number;
    maxCombo: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<RhythmState | null>(null);
  const songStartRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const judgeTextsRef = useRef<JudgeText[]>([]);
  const activeLaneRef = useRef<number | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const refreshRanking = () => {
    fetchFamilyRanking("rhythm-game").then((server) => {
      setRanking(server);
      setBest((prev) => Math.max(prev, getMyBestScore("rhythm-game")));
    });
  };

  useEffect(() => {
    refreshRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMuteToggle = () => {
    initRhythmAudio();
    const nowMuted = toggleMuted();
    setMutedState(nowMuted);
    if (musicRef.current) musicRef.current.muted = nowMuted;
  };

  const handleHit = (lane: number) => {
    if (!stateRef.current || phase !== "playing") return;
    const now = audioNow();
    const { state: next, event } = hitLane(stateRef.current, lane, now);
    stateRef.current = next;
    activeLaneRef.current = lane;
    window.setTimeout(() => {
      if (activeLaneRef.current === lane) activeLaneRef.current = null;
    }, 120);

    if (event?.type === "hit") {
      judgeTextsRef.current.push({
        id: judgeTextSeq++,
        lane,
        text: event.judgment === "perfect" ? "PERFECT" : "GOOD",
        color: event.judgment === "perfect" ? "#2ecc71" : "#f5b642",
        life: 500,
        maxLife: 500,
      });
      if (event.judgment === "perfect") playPerfectSfx(event.freq);
      else playGoodSfx(event.freq);
      if (next.score !== scoreRef.current) {
        scoreRef.current = next.score;
        setScore(next.score);
      }
      if (next.combo !== comboRef.current) {
        comboRef.current = next.combo;
        setCombo(next.combo);
      }
    }
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

    let raf = 0;
    let stopped = false;

    const loop = () => {
      if (stopped || !stateRef.current) return;
      const now = audioNow();

      // countdownLabel(state)을 클로저에서 직접 읽지 않고 매 프레임 계산값을 그대로 반영한다
      // — 이 루프는 phase가 바뀔 때만 재생성되므로, 이전 값을 읽으면 항상 처음 값(stale)만 보게 된다
      const remain = songStartRef.current - now;
      const nextLabel = remain > 1.4 ? "3" : remain > 0.7 ? "2" : remain > 0 ? "1" : null;
      setCountdownLabel(nextLabel);

      const { state: next, events } = tick(stateRef.current, now);
      stateRef.current = next;

      for (const ev of events) {
        if (ev.type === "miss") {
          judgeTextsRef.current.push({
            id: judgeTextSeq++,
            lane: ev.lane,
            text: "MISS",
            color: "#ff6b6b",
            life: 500,
            maxLife: 500,
          });
          playMissSfx();
          comboRef.current = 0;
          setCombo(0);
        } else if (ev.type === "finished") {
          stopped = true;
          stopSongTrack(musicRef.current);
          playFinishedSfx();
          const isRecord = submitScore("rhythm-game", playerName, next.score);
          if (isRecord) {
            setBest(next.score);
            window.setTimeout(playNewRecordSfx, 550);
          }
          setFinalStats({
            score: next.score,
            perfect: next.perfectCount,
            good: next.goodCount,
            miss: next.missCount,
            maxCombo: next.maxCombo,
          });
          setPhase("finished");
          refreshRanking();
          return;
        }
      }

      judgeTextsRef.current = judgeTextsRef.current
        .map((t) => ({ ...t, life: t.life - 16 }))
        .filter((t) => t.life > 0);

      draw(ctx, next, now, activeLaneRef.current, judgeTextsRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key.toLowerCase() as (typeof LANE_KEYS)[number]);
      if (idx >= 0) handleHit(idx);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
      stopSongTrack(musicRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = () => {
    initRhythmAudio();
    stopSongTrack(musicRef.current);
    const start = audioNow() + GAME_CONFIG.leadInSec;
    songStartRef.current = start;
    stateRef.current = createInitialState(start, selectedSong.bpm);
    scoreRef.current = 0;
    comboRef.current = 0;
    judgeTextsRef.current = [];
    setScore(0);
    setCombo(0);
    setFinalStats(null);
    window.setTimeout(() => {
      musicRef.current = playSongTrack(selectedSong.audioUrl, () => scheduleBassPulses(start, selectedSong.bpm));
    }, Math.max(0, (GAME_CONFIG.leadInSec - 0.05) * 1000));

    const leadMs = GAME_CONFIG.leadInSec * 1000;
    window.setTimeout(() => playCountdownBeep(false), Math.max(0, leadMs - 2000));
    window.setTimeout(() => playCountdownBeep(false), Math.max(0, leadMs - 1000));
    window.setTimeout(() => playCountdownBeep(true), Math.max(0, leadMs));

    setPhase("playing");
  };

  const isNewRecord = finalStats != null && finalStats.score > 0 && finalStats.score >= best;

  const openStub = (kind: StubKind) => {
    setStubKind(kind);
    setPhase("stub");
  };

  if (phase === "runner") {
    return <TileRunnerGame playerName={playerName} onExit={() => setPhase("lobby")} />;
  }

  return (
    <div className="rg-page">
      <div className="rg-topbar container">
        <button className="rg-back" onClick={onExit}>
          ← 나가기
        </button>
        <div className="rg-hud">
          {phase === "playing" && <span className="rg-combo">COMBO {combo}</span>}
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
            <div className="rg-touch-lanes">
              {LANE_COLORS.map((_, i) => (
                <button key={i} className="rg-touch-lane" onPointerDown={() => handleHit(i)} />
              ))}
            </div>
          )}
          {countdownLabel && <div className="rg-countdown">{countdownLabel}</div>}
        </div>

        {phase === "lobby" && (
          <RhythmLobby
            best={best}
            onPlay={() => setPhase("modeSelect")}
            onSongSelect={() => setPhase("songSelect")}
            onCharacter={() => openStub("character")}
            onCollection={() => openStub("collection")}
            onSettings={() => openStub("settings")}
          />
        )}

        {phase === "stub" && <RhythmStub kind={stubKind} onBack={() => setPhase("lobby")} />}

        {phase === "modeSelect" && (
          <ModeSelect
            onSelectNote={() => setPhase("songSelect")}
            onSelectRunner={() => setPhase("runner")}
            onBack={() => setPhase("lobby")}
          />
        )}

        {phase === "songSelect" && (
          <SongSelect
            selected={selectedSong}
            onSelect={(song) => {
              setSelectedSong(song);
              setPhase("start");
            }}
            onBack={() => setPhase("modeSelect")}
          />
        )}

        {phase === "start" && (
          <div className="rg-panel">
            <button className="rg-btn rg-btn-ghost rg-btn-back" onClick={() => setPhase("songSelect")}>
              ← 곡 선택
            </button>
            <p className="rg-panel-emoji">{selectedSong.emoji}</p>
            <h1 className="rg-panel-title">{selectedSong.name}</h1>
            <p className="rg-panel-tagline">
              {selectedSong.speedLabel} · BPM {selectedSong.bpm} — 내려오는 노트를 박자에 맞춰 눌러보세요!
            </p>
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
            <p className="rg-panel-hint">PC: D F J K &nbsp;·&nbsp; 모바일: 화면 4칸 탭</p>
          </div>
        )}

        {phase === "finished" && finalStats && (
          <div className="rg-panel">
            {isNewRecord && <p className="rg-record-badge">🎉 신기록!</p>}
            <h1 className="rg-panel-title">SONG CLEAR!</h1>
            <p className="rg-final-score">{finalStats.score.toLocaleString()}</p>
            <div className="rg-final-stats">
              <div>
                <span className="rg-final-stat-label">PERFECT</span>
                <span className="rg-final-stat-value rg-perfect">{finalStats.perfect}</span>
              </div>
              <div>
                <span className="rg-final-stat-label">GOOD</span>
                <span className="rg-final-stat-value rg-good">{finalStats.good}</span>
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
              <button className="rg-btn rg-btn-ghost" onClick={() => setPhase("songSelect")}>
                곡 선택
              </button>
              <button className="rg-btn rg-btn-ghost" onClick={() => setPhase("lobby")}>
                메인으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
