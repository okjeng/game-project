import { isMuted } from "../../lib/sound";

/** 실제 오디오 파일 재생을 시도하고, 로드에 실패하면(아직 파일이 없거나 네트워크 문제) 콜백으로 대체 사운드를 재생하게 한다 */
export function playSongTrack(url: string, onFallback: () => void): HTMLAudioElement {
  const audio = new Audio(url);
  audio.volume = 0.35;
  audio.muted = isMuted();
  let settled = false;
  const fallback = () => {
    if (settled) return;
    settled = true;
    onFallback();
  };
  audio.addEventListener("error", fallback);
  audio.play().then(
    () => {
      settled = true;
    },
    () => fallback()
  );
  return audio;
}

export function stopSongTrack(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
