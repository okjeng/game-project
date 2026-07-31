/** Web Audio API 기반 사운드 엔진 — 오디오 파일 없이 코드로 직접 합성한다.
 *  브라우저 자동재생 정책 때문에 반드시 사용자 클릭 등 제스처 안에서 unlockAudio()를 먼저 호출해야 한다. */

type Wave = OscillatorType;

const MUTE_KEY = "gameroom.muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;

function ensureCtx(): AudioContext {
  if (ctx && master && musicBus && sfxBus) return ctx;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AudioCtor();
  master = ctx.createGain();
  master.gain.value = isMuted() ? 0 : 1;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.22;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.4;
  sfxBus.connect(master);
  return ctx;
}

/** 사용자 제스처(클릭 등) 핸들러 안에서 호출 — 오디오 컨텍스트를 깨운다 */
export function unlockAudio(): void {
  const c = ensureCtx();
  if (c.state === "suspended") void c.resume();
}

/** 오디오 하드웨어 기준 시각(초) — 리듬게임처럼 소리와 화면을 정확히 맞춰야 할 때
 *  performance.now() 대신 이 시계를 기준으로 삼아야 밀리지 않는다 */
export function audioNow(): number {
  return ensureCtx().currentTime;
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

export function playTone(
  freq: number,
  durationSec: number,
  opts: { type?: Wave; volume?: number; delaySec?: number; slideTo?: number } = {}
): void {
  const c = ensureCtx();
  if (!sfxBus) return;
  const { type = "square", volume = 0.4, delaySec = 0, slideTo } = opts;
  const t0 = c.currentTime + delaySec;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + durationSec);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  osc.connect(gain);
  gain.connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.02);
}

export function playNoiseBurst(
  durationSec: number,
  opts: { volume?: number; delaySec?: number; filterFreq?: number } = {}
): void {
  const c = ensureCtx();
  if (!sfxBus) return;
  const { volume = 0.35, delaySec = 0, filterFreq = 1800 } = opts;
  const t0 = c.currentTime + delaySec;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * durationSec));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(sfxBus);
  src.start(t0);
  src.stop(t0 + durationSec + 0.02);
}

export interface Note {
  freq: number;
  duration: number;
  type?: Wave;
  volume?: number;
}

export function playSequence(notes: Note[], gap = 0.02): void {
  let t = 0;
  for (const n of notes) {
    playTone(n.freq, n.duration, { type: n.type, volume: n.volume, delaySec: t });
    t += n.duration + gap;
  }
}

// ─── 배경음악 루프 ───────────────────────────────────────────────────
export interface MusicTrack {
  bpm: number;
  bass: { freq: number; beats: number }[];
  lead: { freq: number; beats: number }[];
}

/** "A Tale of Two Clocks" 패턴 — 짧은 lookahead(0.15초)씩만 미리 예약해서,
 *  stopMusic()을 부르면 이미 울리고 있는 노트만 즉시 끄면 되고 몇 초씩 밀려서
 *  계속 들리는 일이 없게 한다. */
const SCHEDULE_AHEAD_SEC = 0.15;
const SCHEDULER_INTERVAL_MS = 60;

let musicTimer: number | null = null;
let activeMusicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

export function startMusic(track: MusicTrack): void {
  stopMusic();
  const c = ensureCtx();
  if (!musicBus) return;
  const bus = musicBus;
  const beatSec = 60 / track.bpm;

  let bassIdx = 0;
  let leadIdx = 0;
  let nextBassTime = c.currentTime + 0.05;
  let nextLeadTime = c.currentTime + 0.05;

  const scheduleNote = (freq: number, dur: number, type: Wave, volume: number, time: number) => {
    if (freq <= 0) return;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.9);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(time);
    osc.stop(time + dur);
    const entry = { osc, gain };
    activeMusicNodes.push(entry);
    osc.onended = () => {
      activeMusicNodes = activeMusicNodes.filter((n) => n !== entry);
    };
  };

  const tick = () => {
    const horizon = c.currentTime + SCHEDULE_AHEAD_SEC;
    while (nextBassTime < horizon) {
      const note = track.bass[bassIdx % track.bass.length];
      scheduleNote(note.freq, note.beats * beatSec, "triangle", 0.5, nextBassTime);
      nextBassTime += note.beats * beatSec;
      bassIdx++;
    }
    while (nextLeadTime < horizon) {
      const note = track.lead[leadIdx % track.lead.length];
      scheduleNote(note.freq, note.beats * beatSec, "square", 0.3, nextLeadTime);
      nextLeadTime += note.beats * beatSec;
      leadIdx++;
    }
  };
  tick();
  musicTimer = window.setInterval(tick, SCHEDULER_INTERVAL_MS);
}

export function stopMusic(): void {
  if (musicTimer != null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (ctx) {
    const now = ctx.currentTime;
    for (const { osc, gain } of activeMusicNodes) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.stop(now + 0.06);
      } catch {
        // 이미 정지된 노드일 수 있음 — 무시
      }
    }
  }
  activeMusicNodes = [];
}
