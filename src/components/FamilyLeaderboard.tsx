import "./FamilyLeaderboard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function FamilyLeaderboard({
  ranking,
}: {
  ranking: { name: string; score: number }[];
}) {
  return (
    <section id="family-record" className="family container">
      <h2 className="family-heading">👨‍👩‍👧‍👦 가족 최고 기록</h2>

      {ranking.length === 0 ? (
        <p className="family-empty">아직 기록이 없어요 — 지금 플레이하고 1등에 도전해보세요!</p>
      ) : (
        <div className="family-list">
          {ranking.slice(0, 5).map((entry, i) => (
            <div key={entry.name} className="family-row">
              <span className="family-medal">{MEDALS[i] ?? `${i + 1}위`}</span>
              <span className="family-name">{entry.name}</span>
              <span className="family-score">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
