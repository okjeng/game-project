export const RUNNER_BPM = 124;
export const RUNNER_BEAT_SEC = 60 / RUNNER_BPM;

type Lane = 0 | 1 | 2;

// 8박짜리 프레이즈를 살짝 회전시켜 반복 — 완전 무작위보다 걷는 느낌의 리듬감이 생긴다
const PHRASE: Lane[] = [1, 0, 1, 2, 1, 0, 2, 1, 0, 2, 0, 1, 2, 0, 1, 2, 2, 1, 0, 1, 0, 2, 1, 0, 1, 2, 1, 0, 2, 1, 2, 0];

function buildLanes(): Lane[] {
  const lanes: Lane[] = [];
  for (let rep = 0; rep < 3; rep++) {
    for (const lane of PHRASE) {
      lanes.push(((lane + rep) % 3) as Lane);
    }
  }
  return lanes;
}

export const RUNNER_LANES: Lane[] = buildLanes();
export const RUNNER_LENGTH_BEATS = RUNNER_LANES.length;
