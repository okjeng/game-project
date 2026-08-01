export type SongId = "slow" | "medium" | "fast";

export interface SongMeta {
  id: SongId;
  name: string;
  emoji: string;
  speedLabel: string;
  bpm: number;
  audioUrl: string;
}

export const SONGS: SongMeta[] = [
  { id: "slow", name: "Lullaby Breeze", emoji: "🐢", speedLabel: "느림", bpm: 85, audioUrl: "/audio/song-slow.mp3" },
  { id: "medium", name: "Sunny Pop", emoji: "🚶", speedLabel: "보통", bpm: 120, audioUrl: "/audio/song-medium.mp3" },
  { id: "fast", name: "Turbo Beat", emoji: "⚡", speedLabel: "빠름", bpm: 155, audioUrl: "/audio/song-fast.mp3" },
];

export const DEFAULT_SONG = SONGS[1];
