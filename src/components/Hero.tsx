import type { GameMeta } from "../data/games";
import "./Hero.css";

export default function Hero({
  game,
  bestScore,
  onPlay,
}: {
  game: GameMeta;
  bestScore: number;
  onPlay: () => void;
}) {
  return (
    <section className="hero container">
      <div className="hero-card glow-green">
        <p className="hero-eyebrow">오늘 뭐 할까?</p>
        <h1 className="hero-title">
          <span className="hero-emoji">{game.emoji}</span> {game.name}
        </h1>
        <p className="hero-tagline">{game.tagline}</p>
        <button className="hero-play-btn" onClick={onPlay}>
          ▶ 지금 플레이
        </button>
        <p className="hero-best">
          🏆 내 최고 점수 <strong>{bestScore.toLocaleString()}</strong>
        </p>
      </div>
    </section>
  );
}
