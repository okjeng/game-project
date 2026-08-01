export type StubKind = "song" | "character" | "collection" | "settings";

const STUB_INFO: Record<StubKind, { icon: string; title: string; desc: string }> = {
  song: { icon: "🎵", title: "SONG SELECT", desc: "여러 곡과 난이도(EASY~MASTER)를 고르는 화면을 준비 중이에요." },
  character: { icon: "🐾", title: "CHARACTER", desc: "고양이, 토끼, 펭귄 등 캐릭터를 모으고 고르는 화면을 준비 중이에요." },
  collection: { icon: "🎁", title: "COLLECTION", desc: "플레이 기록과 획득한 캐릭터·배경을 모아보는 화면을 준비 중이에요." },
  settings: { icon: "⚙️", title: "SETTINGS", desc: "음량, 노트 속도, 판정선 위치 등을 조절하는 화면을 준비 중이에요." },
};

export default function RhythmStub({ kind, onBack }: { kind: StubKind; onBack: () => void }) {
  const info = STUB_INFO[kind];
  return (
    <div className="rg-panel">
      <p className="rg-panel-emoji">{info.icon}</p>
      <h1 className="rg-panel-title">{info.title}</h1>
      <p className="rg-panel-tagline">{info.desc}</p>
      <p className="rg-panel-hint">🚧 다음 업데이트에서 만나요!</p>
      <button className="rg-btn rg-btn-primary" onClick={onBack}>
        ← 로비로
      </button>
    </div>
  );
}
