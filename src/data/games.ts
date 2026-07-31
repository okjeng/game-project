export type GameCategory = "퍼즐" | "아케이드" | "캐주얼";

export type GameMeta = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  category: GameCategory;
  color: string; // CSS 변수 이름
  status: "active" | "soon";
};

export const GAMES: GameMeta[] = [
  {
    id: "block-blast",
    name: "BLOCK BLAST",
    emoji: "🧱",
    tagline: "블록을 맞추고 최고 기록에 도전하세요!",
    category: "퍼즐",
    color: "var(--neon-green)",
    status: "active",
  },
  {
    id: "gate-shooter",
    name: "GATE SHOOTER",
    emoji: "🔫",
    tagline: "게이트를 선택하고 몬스터를 물리쳐라!",
    category: "아케이드",
    color: "var(--neon-violet)",
    status: "active",
  },
  {
    id: "rhythm-game",
    name: "BEAT MATCH",
    emoji: "🎵",
    tagline: "내려오는 노트를 박자에 맞춰 눌러보세요!",
    category: "캐주얼",
    color: "var(--neon-cyan)",
    status: "active",
  },
  {
    id: "bubble-pop",
    name: "방울팡!",
    emoji: "🫧",
    tagline: "거품으로 몬스터를 가두고 톡! 터뜨리세요!",
    category: "아케이드",
    color: "var(--neon-amber)",
    status: "active",
  },
];

export const COMING_SOON_COUNT = 1;
