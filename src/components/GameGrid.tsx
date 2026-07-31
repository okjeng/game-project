import { useState } from "react";
import { COMING_SOON_COUNT, GAMES, type GameCategory } from "../data/games";
import "./GameGrid.css";

const TABS: (GameCategory | "전체")[] = ["전체", "퍼즐", "아케이드", "캐주얼"];

export default function GameGrid({
  query,
  onPlay,
}: {
  query: string;
  onPlay: (gameId: string) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("전체");

  const q = query.trim().toLowerCase();
  const visibleGames = GAMES.filter((g) => {
    const matchesTab = tab === "전체" || g.category === tab;
    const matchesQuery = q === "" || g.name.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  const showComingSoon = q === "";

  return (
    <section className="grid-section container">
      <h2 className="grid-heading">🔥 인기 게임</h2>

      <div className="grid-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={"grid-tab" + (tab === t ? " grid-tab-active" : "")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid-cards">
        {visibleGames.map((g) => (
          <button key={g.id} className="game-card" style={{ ["--card-color" as string]: g.color }} onClick={() => onPlay(g.id)}>
            <span className="game-card-emoji">{g.emoji}</span>
            <span className="game-card-name">{g.name}</span>
            <span className="game-card-play">▶ 플레이</span>
          </button>
        ))}

        {showComingSoon &&
          Array.from({ length: COMING_SOON_COUNT }).map((_, i) => (
            <div key={`soon-${i}`} className="game-card game-card-soon">
              <span className="game-card-emoji">🔒</span>
              <span className="game-card-name">준비중</span>
              <span className="game-card-sub">Coming Soon</span>
            </div>
          ))}

        {visibleGames.length === 0 && !showComingSoon && (
          <p className="grid-empty">"{query}"에 맞는 게임이 없어요</p>
        )}
      </div>
    </section>
  );
}
