// A score written as data (data/score.json), turned into a stereo mix and into the beat grid the
// engine reads. scripts/make-score.ts reads the files and writes the results; this module does the
// work and touches no file.
//
// Time in a score is counted in bars and beats from zero, as in shots.json. On its own, a score
// keeps one tempo, so its grid is known exactly: beat i is at i * 60 / tempo seconds, and bar 0
// starts at time 0. A score laid over a track (`track`) takes the track's measured grid from
// data/audio.json instead, so its cues and patterns follow the track's beats where they drift.
//
// No DOM and no Node imports.
import { dbToGain, midiOf, panGains, seedOf } from './dsp';
import { DEFAULTS, INSTRUMENT_TYPES, LASTING_TYPES, PITCHED_TYPES, renderEvent, type InstrumentType, type Params } from './instruments';
import { delay, duckGain, limit, loudness, peak, reverb, stereo, type Stereo } from './mix';
import type { Position } from './voice';

export interface BusSpec {
  /** Decibels. */
  gain?: number;
  /** Send to the shared reverb, 0 to 1. */
  reverb?: number;
  /** Send to the shared delay, 0 to 1. */
  delay?: number;
  /** Decibels this bus goes down while a key bus sounds. */
  duck?: number;
  /** This bus is a key: the buses with `duck` go down under it. The voice bus is one by default. */
  key?: boolean;
}

export interface InstrumentSpec {
  type: InstrumentType;
  bus?: string;
  /** Decibels. */
  gain?: number;
  /** -1 left to 1 right. */
  pan?: number;
  [param: string]: string | number | undefined;
}

export interface PatternSpec {
  /** Length of the pattern in bars. It repeats to fill a section. */
  bars?: number;
  /** One line per instrument. See `parseTrack`. */
  tracks: Record<string, string>;
}

export interface SectionSpec {
  name: string;
  bars: number;
  /** Patterns that play through the section, by name, or with a gain in decibels. */
  play?: (string | { pattern: string; gain?: number })[];
}

export interface CueSpec {
  /** Where the hit point of the sound lands: `{ bar, beat }`, or `{ shot, beat }` with the beat counted from the shot's start. */
  at: Position;
  /** An instrument of the score, or an instrument type with its default settings on the `sfx` bus. */
  sound: string;
  /** Decibels. */
  gain?: number;
  /** Length in beats, for a riser (it ends on `at`) or a whoosh (it peaks on `at`). */
  beats?: number;
  /** A note for a pitched sound, such as `E5`. */
  note?: string;
  /** Strength, 0 to 1 (1 by default): how hard a drum or a sample is struck. */
  vel?: number;
  pan?: number;
  /** Why the sound is there: which event of the picture it marks. Not used by the renderer. */
  why?: string;
}

export interface ScoreSpec {
  comment?: string;
  /** Beats a minute. The whole score keeps it. Not used with `track`, whose grid is measured. */
  tempo: number;
  /**
   * A finished track to lay the score over: a file the owner supplied or bought, whose beat grid
   * was measured into data/audio.json. The track is mixed on its own bus (`track` by default),
   * which may be ducked; the grid file is then read and never written.
   */
  track?: { file: string; gain?: number; bus?: string };
  /**
   * Modules that make cues, relative to the film folder, for sound that comes from the picture:
   * each exports `cues(ctx)` and returns a list of cues (see `CueContext`).
   */
  cueModules?: string[];
  seed?: number;
  sampleRate?: number;
  /** The WAV the score is written to, relative to the film folder. */
  out?: string;
  /** Seconds of sound after the last bar, where reverb and releases ring out. */
  tail?: number;
  master?: { gain?: number; lufs?: number; ceiling?: number };
  buses?: Record<string, BusSpec>;
  duck?: { attack?: number; release?: number; hold?: number };
  reverb?: { size?: number; damp?: number };
  delay?: { beats?: number; feedback?: number };
  instruments: Record<string, InstrumentSpec>;
  patterns: Record<string, PatternSpec>;
  sections: SectionSpec[];
  cues?: CueSpec[];
  /** The voice-over, a file like data/voice.json. Optional. */
  voice?: string;
}

/** A shot of shots.json, as far as positions need it. */
export interface ShotRef { id: string; bar: number; bars: number }

/** One sound to render: which instrument, where its hit point lands (seconds), its notes and length. */
export interface ScoreEvent { inst: string; t: number; dur: number; notes: number[]; to?: number; vel: number; gain: number; pan?: number; spb: number }

/** Where beats are in time: exact for a score on its own, measured for a score over a track. */
export interface TimeGrid {
  /** Time in seconds of beat i, counted from zero at bar 0 (fractions allowed, extrapolated past the ends). */
  timeOfBeat(i: number): number;
  /** Whole bars the grid holds. */
  bars: number;
  /** Seconds. */
  duration: number;
  measured: boolean;
}

/** The exact grid of one tempo, bar 0 at time 0. */
export function evenGrid(tempo: number, bars: number): TimeGrid {
  const spb = 60 / tempo;
  return { timeOfBeat: (i) => i * spb, bars, duration: bars * 4 * spb, measured: false };
}

/**
 * The grid of a measured track (the `beats` and `downbeats` of data/audio.json). Beat 0 is its
 * first downbeat; beats before it are a pickup, as in scripts/build-shot-files.py.
 */
export function measuredGrid(j: { beats: number[]; downbeats?: number[]; duration: number }): TimeGrid {
  const b = j.beats;
  const d0 = j.downbeats?.[0];
  let off = 0;
  if (d0 !== undefined) { let best = Infinity; b.forEach((t, i) => { if (Math.abs(t - d0) < best) { best = Math.abs(t - d0); off = i; } }); }
  const n = b.length;
  const timeOfBeat = (i: number) => {
    const x = i + off;
    if (x <= 0) return b[0]! + x * (b[1]! - b[0]!);
    if (x >= n - 1) return b[n - 1]! + (x - (n - 1)) * (b[n - 1]! - b[n - 2]!);
    const k = Math.floor(x);
    return b[k]! + (b[k + 1]! - b[k]!) * (x - k);
  };
  return { timeOfBeat, bars: Math.floor((n - off) / 4), duration: j.duration, measured: true };
}

const VEL: Record<string, number> = { X: 1, x: 0.75, o: 0.45 };

/**
 * One line of a pattern, for one instrument, cut into equal steps across the pattern's bars.
 * A note may glide to another over its length: `A1>C2`.
 * Drums and effects are written as characters: `X` a hit at full strength, `x` a normal hit, `o` a
 * soft one, `.` a rest, `-` holds the step before (it lengthens a riser or a whoosh). Spaces are
 * ignored, so `x... x... x... x...` is a bar of sixteen steps with a hit on every beat.
 * Bass, pad and pluck are written as words separated by spaces: a note (`A1`), a chord (`A3+C4+E4`),
 * `.` a rest, `-` holds the note before; `A1:0.6` gives a strength.
 */
export function parseTrack(type: InstrumentType, line: string): { steps: number; hits: { step: number; len: number; notes: number[]; to?: number; vel: number }[] } | { error: string } {
  const out: { step: number; len: number; notes: number[]; to?: number; vel: number }[] = [];
  const PITCHED = PITCHED_TYPES as Set<string>;
  const tokens = PITCHED.has(type) ? line.trim().split(/\s+/) : [...line.replace(/\s+/g, '')];
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i]!;
    if (tk === '.') continue;
    if (tk === '-') { const last = out[out.length - 1]; if (last && last.step + last.len === i) last.len++; continue; }
    if (PITCHED.has(type)) {
      const [names, v] = tk.split(':');
      const [from, to] = names!.split('>');
      try {
        out.push({ step: i, len: 1, notes: from!.split('+').map(midiOf), to: to ? midiOf(to) : undefined, vel: v === undefined ? 0.8 : Number(v) });
      } catch (e) { return { error: (e as Error).message }; }
    } else {
      if (!(tk in VEL)) return { error: `"${tk}" is not a step (use X, x, o, . or -)` };
      out.push({ step: i, len: 1, notes: [], vel: VEL[tk]! });
    }
  }
  return { steps: tokens.length, hits: out };
}

/** Beat index (from zero) of a position; a position in seconds has none. */
export function beatOf(pos: Position, shots: ShotRef[]): number | string {
  if ('t' in pos) return 'a position in seconds has no beat';
  const beat = pos.beat ?? 0;
  if (typeof beat !== 'number' || !(beat >= 0)) return `beat must be a number, 0 or more`;
  if ('shot' in pos) {
    const s = shots.find((x) => x.id === pos.shot);
    if (!s) return `no shot "${pos.shot}" in shots.json`;
    return s.bar * 4 + beat;
  }
  if (typeof pos.bar !== 'number' || !(pos.bar >= 0)) return `bar must be a number, 0 or more`;
  return pos.bar * 4 + beat;
}

/**
 * Song time of a position, through the grid. `{ t }` is a time in seconds: it is for sound that
 * comes from the picture (a simulation's events), never for music.
 */
export function timeOf(pos: Position, shots: ShotRef[], grid: TimeGrid): number | string {
  if ('t' in pos) return typeof pos.t === 'number' && pos.t >= 0 ? pos.t : 't must be a number of seconds, 0 or more';
  const b = beatOf(pos, shots);
  return typeof b === 'string' ? b : grid.timeOfBeat(b);
}

/** Instrument settings with the defaults of its type filled in; a cue may name a bare type. */
export function instrumentOf(score: ScoreSpec, name: string): { type: InstrumentType; bus?: string; gain?: number; pan?: number; params: Params } | undefined {
  const spec = score.instruments[name] ?? ((INSTRUMENT_TYPES as readonly string[]).includes(name) ? { type: name as InstrumentType, bus: 'sfx' } : undefined);
  if (!spec) return undefined;
  const params: Params = { ...DEFAULTS[spec.type] };
  for (const [k, v] of Object.entries(spec)) if (!['type', 'bus', 'gain', 'pan'].includes(k)) params[k] = v;
  return { type: spec.type, bus: spec.bus, gain: spec.gain, pan: spec.pan, params };
}

/** Checks the score and lists every sound it plays. Faults come back as plain sentences. */
export function scoreEvents(score: ScoreSpec, shots: ShotRef[], grid?: TimeGrid): { events: ScoreEvent[]; bars: number; errors: string[] } {
  const errors: string[] = [];
  const events: ScoreEvent[] = [];
  if (!grid?.measured && !(score.tempo > 0)) errors.push('`tempo` must be a number of beats a minute');
  const secBars = (score.sections ?? []).reduce((a, s) => a + (Number.isInteger(s.bars) ? s.bars : 0), 0);
  const g = grid ?? evenGrid(score.tempo || 120, secBars);
  const at = (b: number) => g.timeOfBeat(b);
  for (const [name, inst] of Object.entries(score.instruments ?? {})) {
    if (!(INSTRUMENT_TYPES as readonly string[]).includes(inst.type)) errors.push(`instrument "${name}": type "${inst.type}" is not one of ${INSTRUMENT_TYPES.join(', ')}`);
  }
  let bar = 0;
  for (const [si, sec] of (score.sections ?? []).entries()) {
    const where = `section ${si + 1} ("${sec.name}")`;
    if (!Number.isInteger(sec.bars) || sec.bars < 1) { errors.push(`${where}: \`bars\` must be a whole number, 1 or more`); continue; }
    for (const entry of sec.play ?? []) {
      const pname = typeof entry === 'string' ? entry : entry.pattern;
      const pgain = typeof entry === 'string' ? 0 : entry.gain ?? 0;
      const pat = score.patterns?.[pname];
      if (!pat) { errors.push(`${where}: no pattern "${pname}"`); continue; }
      const pbars = pat.bars ?? 1;
      for (const [iname, line] of Object.entries(pat.tracks)) {
        const inst = score.instruments?.[iname];
        if (!inst) { errors.push(`pattern "${pname}": no instrument "${iname}"`); continue; }
        const parsed = parseTrack(inst.type, line);
        if ('error' in parsed) { errors.push(`pattern "${pname}", ${iname}: ${parsed.error}`); continue; }
        const stepBeats = (pbars * 4) / parsed.steps;
        for (let rep = 0; rep * pbars < sec.bars; rep++) {
          for (const n of parsed.hits) {
            const b = (bar + rep * pbars) * 4 + n.step * stepBeats;
            if (b >= (bar + sec.bars) * 4 - 1e-9) continue;
            events.push({ inst: iname, t: at(b), dur: at(b + n.len * stepBeats) - at(b), notes: n.notes, to: n.to, vel: n.vel, gain: pgain, spb: at(b + 1) - at(b) });
          }
        }
      }
    }
    bar += sec.bars;
  }
  if (g.measured && bar > g.bars) errors.push(`the sections run to bar ${bar}, past the ${g.bars} bars of the track's grid`);
  if (g.measured) bar = g.bars;
  for (const [ci, cue] of (score.cues ?? []).entries()) {
    const where = `cue ${ci + 1} (${cue.sound})`;
    const inst = instrumentOf(score, cue.sound);
    if (!inst) { errors.push(`${where}: no instrument or type "${cue.sound}"`); continue; }
    const t = timeOf(cue.at, shots, g);
    if (typeof t === 'string') { errors.push(`${where}: ${t}`); continue; }
    if (t > at(bar * 4) + 1e-6) errors.push(`${where}: lands at ${t.toFixed(2)} s, after the last bar of the score (${bar})`);
    let notes: number[] = [];
    try { notes = cue.note ? [midiOf(cue.note)] : []; } catch (e) { errors.push(`${where}: ${(e as Error).message}`); }
    // a length in beats is measured on the grid from the hit point: forwards, or backwards for a riser
    const beats = cue.beats ?? (inst.type === 'riser' ? 4 : LASTING_TYPES.has(inst.type) ? 2 : 1);
    const b0 = 't' in cue.at ? beatNear(g, t) : (beatOf(cue.at, shots) as number);
    const dur = inst.type === 'riser' ? t - at(b0 - beats) : at(b0 + beats) - t;
    events.push({ inst: cue.sound, t, dur, notes, vel: cue.vel ?? 1, gain: cue.gain ?? 0, pan: cue.pan, spb: at(b0 + 1) - at(b0) });
  }
  return { events, bars: bar, errors: [...new Set(errors)] };
}

/** The fractional beat index at a time, found on the grid (for a cue given in seconds). */
function beatNear(g: TimeGrid, t: number) {
  let lo = -64, hi = g.bars * 4 + 64;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (g.timeOfBeat(m) <= t) lo = m; else hi = m; }
  return lo;
}

/** A voice phrase ready to mix: its samples at the score's rate and where its first sample goes. */
export interface PlacedVoice { id: string; pcm: Float32Array; start: number; gain: number }

export interface Mixed {
  mix: Stereo;
  rate: number;
  duration: number;
  /** Mono sums of the dry sounds by band, for the envelopes of the grid file. */
  bands: Record<'low' | 'mid' | 'high' | 'vocal', Float32Array>;
  report: { lufs: number; peakDb: number; limitedDb: number; limitedAt: number; gainDb: number };
}

const LOW = new Set(['kick', 'bass', 'impact', 'wobble', 'engine']);
const HIGH = new Set(['hat', 'click', 'riser', 'key', 'toggle', 'rain', 'crickets']);
/** The band an instrument counts in for the envelopes of the grid file. */
const bandOf = (t: InstrumentType): 'low' | 'mid' | 'high' => (LOW.has(t) ? 'low' : HIGH.has(t) ? 'high' : 'mid');

const AMBIENCE = new Set(['wind', 'rain', 'room', 'river', 'crickets']);
/** The bus of an instrument that names none. */
export const defaultBus = (t: InstrumentType) =>
  t === 'kick' || t === 'snare' || t === 'clap' || t === 'hat' ? 'drums'
    : t === 'bass' || t === 'wobble' ? 'bass'
    : PITCHED_TYPES.has(t) ? 'music'
    : AMBIENCE.has(t) ? 'bed'
    : 'sfx';

/** What the mix needs besides the events: the decoded sample files and the track, at the score's rate. */
export interface MixInputs {
  voices: PlacedVoice[];
  /** Decoded files of `sample` instruments, by the path the instrument names. */
  samples?: Map<string, Stereo>;
  /** The decoded track of `track`. */
  track?: Stereo;
}

/** Renders every event and voice phrase, mixes the buses, ducks, adds the returns, limits. */
export function renderScore(score: ScoreSpec, events: ScoreEvent[], grid: TimeGrid, inputs: MixInputs): Mixed {
  const { voices, samples, track } = inputs;
  const rate = score.sampleRate ?? 48000;
  const spb = (grid.timeOfBeat(4) - grid.timeOfBeat(0)) / 4;
  // a score on its own rings out for `tail` seconds; over a track, the track decides the length
  const duration = track ? Math.max(track.l.length / rate, grid.duration) : grid.duration + (score.tail ?? 1.5);
  const n = Math.ceil(duration * rate);
  const busSpec = (name: string): BusSpec => score.buses?.[name] ?? (name === 'voice' ? { key: true } : {});
  const buses = new Map<string, Stereo>();
  const bus = (name: string) => { let b = buses.get(name); if (!b) { b = stereo(n); buses.set(name, b); } return b; };
  const bands = { low: new Float32Array(n), mid: new Float32Array(n), high: new Float32Array(n), vocal: new Float32Array(n) };
  const seed = score.seed ?? 1;

  events.forEach((ev, k) => {
    const inst = instrumentOf(score, ev.inst)!;
    const sample = inst.type === 'sample' ? samples?.get(String(inst.params.file)) : undefined;
    const r = renderEvent(inst.type, inst.params, { notes: ev.notes, to: ev.to, vel: ev.vel, dur: ev.dur, seed: seedOf(seed, ev.inst, k), spb: ev.spb, sample }, rate);
    const g = dbToGain((inst.gain ?? 0) + ev.gain);
    const [pl, pr] = panGains(ev.pan ?? inst.pan ?? 0);
    const busName = inst.bus ?? defaultBus(inst.type);
    const b = bus(busName);
    const band = bands[bandOf(inst.type)];
    const bg = dbToGain(busSpec(busName).gain ?? 0);
    const s0 = Math.round(ev.t * rate) - r.hit;
    for (let i = 0; i < r.l.length; i++) {
      const j = s0 + i;
      if (j < 0 || j >= n) continue;
      const L = r.l[i]! * g, R = (r.r ? r.r[i]! : r.l[i]!) * g;
      b.l[j]! += r.r ? L : L * pl * Math.SQRT2;
      b.r[j]! += r.r ? R : R * pr * Math.SQRT2;
      band[j]! += 0.5 * (L + R) * bg;
    }
  });
  if (track) {
    const name = score.track?.bus ?? 'track';
    const b = bus(name);
    const g = dbToGain(score.track?.gain ?? 0);
    for (let i = 0; i < Math.min(n, track.l.length); i++) { b.l[i] = track.l[i]! * g; b.r[i] = track.r[i]! * g; }
  }
  for (const v of voices) {
    const b = bus('voice');
    const g = dbToGain(v.gain);
    for (let i = 0; i < v.pcm.length; i++) {
      const j = v.start + i;
      if (j < 0 || j >= n) continue;
      b.l[j]! += v.pcm[i]! * g; b.r[j]! += v.pcm[i]! * g;
      bands.vocal[j]! += v.pcm[i]! * g;
    }
  }

  // bus gains, then the key and the ducking
  for (const [name, b] of buses) {
    const g = dbToGain(busSpec(name).gain ?? 0);
    if (g !== 1) for (let i = 0; i < n; i++) { b.l[i]! *= g; b.r[i]! *= g; }
  }
  const keys = [...buses].filter(([name]) => busSpec(name).key);
  if (keys.length) {
    const key = new Float32Array(n);
    for (const [, b] of keys) for (let i = 0; i < n; i++) key[i]! += 0.5 * (b.l[i]! + b.r[i]!);
    const shape = { attack: score.duck?.attack ?? 0.12, release: score.duck?.release ?? 0.45, hold: score.duck?.hold ?? 0.35 };
    for (const [name, b] of buses) {
      const depth = busSpec(name).duck ?? 0;
      if (!depth || busSpec(name).key) continue;
      const g = duckGain(key, rate, { ...shape, depth });
      for (let i = 0; i < n; i++) { b.l[i]! *= g[i]!; b.r[i]! *= g[i]!; }
    }
  }

  // sum, with the sends to the shared reverb and delay
  const mix = stereo(n);
  const rsend = stereo(n), dsend = stereo(n);
  let anyR = false, anyD = false;
  for (const [name, b] of buses) {
    const s = busSpec(name);
    for (let i = 0; i < n; i++) {
      mix.l[i]! += b.l[i]!; mix.r[i]! += b.r[i]!;
      if (s.reverb) { rsend.l[i]! += b.l[i]! * s.reverb; rsend.r[i]! += b.r[i]! * s.reverb; }
      if (s.delay) { dsend.l[i]! += b.l[i]! * s.delay; dsend.r[i]! += b.r[i]! * s.delay; }
    }
    anyR ||= !!s.reverb; anyD ||= !!s.delay;
  }
  if (anyD) {
    const d = delay(dsend, rate, (score.delay?.beats ?? 0.75) * spb, score.delay?.feedback ?? 0.35);
    for (let i = 0; i < n; i++) { mix.l[i]! += d.l[i]!; mix.r[i]! += d.r[i]!; rsend.l[i]! += d.l[i]! * 0.3; rsend.r[i]! += d.r[i]! * 0.3; }
  }
  if (anyR) {
    const r = reverb(rsend, rate, score.reverb?.size ?? 0.8, score.reverb?.damp ?? 0.35);
    for (let i = 0; i < n; i++) { mix.l[i]! += r.l[i]!; mix.r[i]! += r.r[i]!; }
  }

  // master: gain, loudness target, limiter, and a fade over the tail
  let gainDb = score.master?.gain ?? 0;
  const target = score.master?.lufs;
  if (typeof target === 'number') {
    const before = loudness(mix, rate);
    if (Number.isFinite(before)) gainDb += target - before;
  }
  const mg = dbToGain(gainDb);
  const fade = track ? Math.round(0.01 * rate) : Math.round(Math.min(1, (score.tail ?? 1.5) * 0.8) * rate);
  for (let i = 0; i < n; i++) {
    const f = i >= n - fade ? (n - i) / fade : 1;
    mix.l[i]! *= mg * f; mix.r[i]! *= mg * f;
  }
  const lim = limit(mix, rate, dbToGain(score.master?.ceiling ?? -1));
  return { mix, rate, duration, bands, report: { lufs: loudness(mix, rate), peakDb: 20 * Math.log10(peak(mix) || 1e-9), limitedDb: lim.db, limitedAt: lim.at, gainDb } };
}

/** Envelopes at 100 values a second, each scaled from 0 to 1, as the analysis of a track writes them. */
export function envelope(x: Float32Array, rate: number): number[] {
  const hop = rate / 100, win = Math.round(rate / 50);
  const frames = Math.floor(x.length / hop);
  const out = new Array<number>(frames);
  let max = 0;
  for (let f = 0; f < frames; f++) {
    const c = Math.round(f * hop);
    let s = 0;
    const h = Math.floor(win / 2);
    for (let i = Math.max(0, c - h); i < Math.min(x.length, c + h); i++) s += x[i]! * x[i]!;
    out[f] = Math.sqrt(s / win);
    max = Math.max(max, out[f]!);
  }
  return out.map((v) => (max > 0 ? Math.round((v / max) * 1000) / 1000 : 0));
}

/**
 * What a cue module receives (`cueModules` in the score). It returns a list of cues; a cue that
 * comes from a simulation usually gives its time in seconds, `at: { t }`.
 */
export interface CueContext {
  shots: ShotRef[];
  /** Song time of beat i of the grid, counted from zero at bar 0. */
  timeOfBeat(i: number): number;
  bars: number;
  duration: number;
}
