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
];

export const COMING_SOON_COUNT = 2;
