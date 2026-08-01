import "./ModeSelect.css";

export default function ModeSelect({
  onSelectNote,
  onSelectRunner,
  onBack,
}: {
  onSelectNote: () => void;
  onSelectRunner: () => void;
  onBack: () => void;
}) {
  return (
    <div className="rg-panel ms-panel">
      <button className="rg-btn rg-btn-ghost rg-btn-back" onClick={onBack}>
        ← 로비
      </button>
      <h1 className="rg-panel-title">모드를 골라주세요</h1>
      <p className="rg-panel-tagline">같은 음악, 다른 방식으로 즐겨보세요!</p>

      <button className="ms-card" onClick={onSelectNote}>
        <span className="ms-card-emoji">🎯</span>
        <span className="ms-card-title">노트 매치</span>
        <span className="ms-card-desc">내려오는 노트를 박자에 맞춰 탭!</span>
      </button>

      <button className="ms-card" onClick={onSelectRunner}>
        <span className="ms-card-emoji">🏃</span>
        <span className="ms-card-title">타일 러너</span>
        <span className="ms-card-desc">박자에 맞춰 타일 위로 이동!</span>
      </button>
    </div>
  );
}
