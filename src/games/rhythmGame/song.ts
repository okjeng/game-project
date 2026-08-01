export interface NoteEvent {
  beat: number; // 곡 시작부터 몇 번째 박자인지(소수 가능 — 0.5 = 8분음표)
  lane: 0 | 1 | 2 | 3;
  freq: number;
}

// 노트 패턴은 박자(beat) 단위라 템포(BPM)와 무관하다 — 실제 초 단위 간격은 선택한 곡의 BPM에 맞춰 재생 시점에 계산한다
// C major 펜타토닉 — 어떻게 섞어도 불협화음이 안 나서 절차적으로 만들어도 듣기 좋다
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5 D5 E5 G5 A5

/** 4마디짜리 프레이즈를 살짝 변주해 4번 반복 — 완전 무작위보다 "곡처럼" 들리게 */
function buildNotes(): NoteEvent[] {
  const phraseLanes: (0 | 1 | 2 | 3)[] = [0, 1, 2, 1, 3, 2, 1, 0, 2, 3, 2, 1, 0, 1, 2, 3];
  const phraseScaleIdx = [0, 1, 2, 1, 3, 2, 4, 3, 2, 1, 0, 1, 2, 3, 2, 1];
  const notes: NoteEvent[] = [];
  for (let rep = 0; rep < 4; rep++) {
    for (let i = 0; i < phraseLanes.length; i++) {
      const beat = rep * 8 + i * 0.5; // 8분음표 간격으로 한 마디(8박)당 16개 노트
      const lane = phraseLanes[i];
      const scaleIdx = (phraseScaleIdx[i] + rep) % SCALE.length;
      notes.push({ beat, lane, freq: SCALE[scaleIdx] });
    }
  }
  return notes;
}

export const SONG_NOTES: NoteEvent[] = buildNotes();
export const SONG_LENGTH_BEATS = 8 * 4; // 4마디 x 4반복
export const BASS_FREQ = 130.81; // C3 — 매 박자 울리는 베이스 펄스
