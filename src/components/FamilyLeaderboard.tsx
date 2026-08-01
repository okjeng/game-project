import type { GameMeta } from "../data/games";
import type { RankingEntry } from "../lib/storage";
import "./FamilyLeaderboard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function FamilyLeaderboard({
  games,
  rankingByGame,
}: {
  games: GameMeta[];
  rankingByGame: Record<string, RankingEntry[]>;
}) {
  const hasAnyRecord = games.some((g) => (rankingByGame[g.id]?.length ?? 0) > 0);

  return (
    <section id="family-record" className="family container">
      <h2 className="family-heading">👨‍👩‍👧‍👦 가족 최고 기록</h2>

      {!hasAnyRecord ? (
        <p className="family-empty">아직 기록이 없어요 — 지금 플레이하고 1등에 도전해보세요!</p>
      ) : (
        <div className="family-grid">
          {games.map((game) => {
            const ranking = rankingByGame[game.id] ?? [];
            return (
              <div key={game.id} className="family-game-card">
                <div className="family-game-heading">
                  <span>{game.emoji}</span>
                  <span>{game.name}</span>
                </div>
                {ranking.length === 0 ? (
                  <p className="family-empty family-empty-small">아직 기록이 없어요</p>
                ) : (
                  <div className="family-list">
                    {ranking.slice(0, 3).map((entry, i) => (
                      <div key={entry.name} className="family-row">
                        <span className="family-medal">{MEDALS[i] ?? `${i + 1}위`}</span>
                        <span className="family-name">{entry.name}</span>
                        <span className="family-score">{entry.score.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
