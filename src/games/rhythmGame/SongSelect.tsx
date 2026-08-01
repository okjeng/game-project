import { SONGS, type SongMeta } from "./songs";
import "./SongSelect.css";

export default function SongSelect({
  selected,
  onSelect,
  onBack,
}: {
  selected: SongMeta;
  onSelect: (song: SongMeta) => void;
  onBack: () => void;
}) {
  return (
    <div className="rg-panel ss-panel">
      <button className="rg-btn rg-btn-ghost rg-btn-back" onClick={onBack}>
        ← 모드 선택
      </button>
      <h1 className="rg-panel-title">곡을 골라주세요</h1>
      <p className="rg-panel-tagline">속도가 다른 세 곡 중 하나를 선택하세요</p>

      {SONGS.map((song) => (
        <button
          key={song.id}
          className={"ss-card" + (song.id === selected.id ? " ss-card-selected" : "")}
          onClick={() => onSelect(song)}
        >
          <span className="ss-card-emoji">{song.emoji}</span>
          <span className="ss-card-info">
            <span className="ss-card-title">{song.name}</span>
            <span className="ss-card-sub">
              {song.speedLabel} · BPM {song.bpm}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
