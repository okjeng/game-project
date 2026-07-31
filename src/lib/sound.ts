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

let musicTimer: number | null = null;

export function startMusic(track: MusicTrack): void {
  stopMusic();
  const c = ensureCtx();
  if (!musicBus) return;
  const bus = musicBus;
  const beatSec = 60 / track.bpm;
  const loopLen = track.bass.reduce((s, n) => s + n.beats, 0) * beatSec;
  const scheduleAheadSec = loopLen * 2;

  const scheduleLine = (line: { freq: number; beats: number }[], startAt: number, type: Wave, volume: number) => {
    let t = startAt;
    for (const n of line) {
      const dur = n.beats * beatSec;
      if (n.freq > 0) {
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.value = n.freq;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(t);
        osc.stop(t + dur);
      }
      t += dur;
    }
  };

  let cursor = c.currentTime + 0.1;
  const tick = () => {
    while (cursor < c.currentTime + scheduleAheadSec) {
      scheduleLine(track.bass, cursor, "triangle", 0.5);
      scheduleLine(track.lead, cursor, "square", 0.3);
      cursor += loopLen;
    }
  };
  tick();
  musicTimer = window.setInterval(tick, Math.max(200, loopLen * 500));
}

export function stopMusic(): void {
  if (musicTimer != null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
