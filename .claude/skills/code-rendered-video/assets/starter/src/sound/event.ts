// What every instrument receives and returns, and the small helpers they share.
// No DOM and no Node imports.
import { hzOf } from './dsp';

/** Parameters of an instrument, as data/score.json gives them. Every one has a default. */
export type Params = Record<string, number | string | undefined>;

export interface NoteEvent {
  /** MIDI notes; empty for a drum or an effect that has no pitch. */
  notes: number[];
  /** A note to glide to over the event (written `A1>C2` in a pattern), in MIDI; the glide applies to the first note. */
  to?: number;
  /** 0 to 1. */
  vel: number;
  /** How long the note is held, or the length of a riser, a whoosh or a bed, in seconds. */
  dur: number;
  /** Seed of this event's noise. */
  seed: number;
  /** Seconds a beat lasts where the event sits, for what moves with the tempo (a wobble). */
  spb: number;
  /** For a `sample`: the decoded file at the score's rate. */
  sample?: { l: Float32Array; r: Float32Array };
}

export interface Rendered {
  l: Float32Array;
  /** The right channel of a sound that is stereo by itself; a mono sound has none. */
  r?: Float32Array;
  /** Sample index of the hit point. */
  hit: number;
}

export const num = (p: Params, k: string) => Number(p[k]);
export const str = (p: Params, k: string) => String(p[k]);
/** An exponential fall that reaches -60 dB after `t60` seconds. */
export const fall = (t: number, t60: number) => Math.exp((-6.9078 * t) / Math.max(t60, 1e-4));
export const len = (secs: number, rate: number) => Math.max(1, Math.round(secs * rate));

/** A short fade at the end of a buffer, so nothing stops on a step. */
export function fadeTail(b: Float32Array, rate: number, secs = 0.01) {
  const n = Math.min(b.length, Math.round(secs * rate));
  for (let i = 0; i < n; i++) b[b.length - 1 - i]! *= i / n;
}
/** A fade in and a fade out, for beds. */
export function fadeEdges(b: Float32Array, rate: number, secs: number) {
  const n = Math.min(Math.floor(b.length / 2), Math.round(secs * rate));
  for (let i = 0; i < n; i++) { const g = i / n; b[i]! *= g; b[b.length - 1 - i]! *= g; }
}

/**
 * The pitch in Hz of a note at time t of the event: the note itself, gliding to `ev.to` over
 * `glide` seconds (the whole held length when `glide` is 0), with vibrato of `depth` semitones at
 * `rate` Hz that fades in after `delay` seconds, moved by `offset` semitones (a detuned voice, a scoop).
 */
export function pitchAt(note: number, ev: NoteEvent, t: number, glide = 0, vib = { depth: 0, rate: 5.5, delay: 0.25 }, offset = 0) {
  let n = note + offset;
  if (ev.to !== undefined && note === ev.notes[0]) {
    const g = glide > 0 ? glide : Math.max(0.02, ev.dur);
    const u = Math.min(1, t / g);
    n += (ev.to - note) * (u * u * (3 - 2 * u));
  }
  if (vib.depth) {
    const on = Math.min(1, Math.max(0, (t - vib.delay) / 0.3));
    n += vib.depth * on * Math.sin(2 * Math.PI * vib.rate * t);
  }
  return hzOf(n);
}
