// The small pieces of signal processing the score is made of: a seeded random source, oscillators
// without aliasing, a state-variable filter, pitch names, decibels.
//
// Everything here is a pure function of its arguments and of a seed. There is no clock and no
// Math.random, so the same score renders to the same samples on every run. (Math.sin, Math.exp and
// Math.tan are not specified to the last bit across JavaScript engines, so a file made with another
// version of bun or on another system may differ in its lowest bits; two runs on one machine are
// byte-identical.)
//
// No DOM and no Node imports: this module runs under bun (scripts/make-score.ts) and could run in a page.

export const TAU = Math.PI * 2;

/** A seeded generator of numbers in [0, 1) (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed made from several numbers or strings, so that each note gets noise of its own. */
export function seedOf(...xs: (number | string)[]) {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    const s = String(x);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= 0x9e37; h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const dbToGain = (db: number) => Math.pow(10, db / 20);
export const gainToDb = (g: number) => (g <= 0 ? -Infinity : 20 * Math.log10(g));

/** MIDI note number of a name such as `A1`, `C#4`, `Eb3`. */
export function midiOf(name: string): number {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name.trim());
  if (!m) throw new Error(`not a note name: "${name}" (write it like A1, C#4 or Eb3)`);
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1]!.toLowerCase() as 'c']!;
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + base + acc;
}
export const hzOf = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** The correction that takes the step out of a naive sawtooth or square (polyBLEP). */
function blep(t: number, dt: number) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}

/** A band-limited oscillator. `next(hz)` returns one sample from -1 to 1. */
export class Osc {
  phase: number;
  constructor(public shape: 'sine' | 'saw' | 'square' | 'triangle', phase = 0) { this.phase = phase; }
  private tri = 0;
  next(hz: number, rate: number): number {
    const dt = hz / rate;
    const p = this.phase;
    let v: number;
    switch (this.shape) {
      case 'sine': v = Math.sin(TAU * p); break;
      case 'saw': v = 2 * p - 1 - blep(p, dt); break;
      case 'square':
      case 'triangle': {
        let sq = p < 0.5 ? 1 : -1;
        sq += blep(p, dt);
        sq -= blep((p + 0.5) % 1, dt);
        if (this.shape === 'square') { v = sq; break; }
        // a leaky integral of the square is a triangle without the corners that alias
        this.tri = dt * sq * 4 + (1 - dt * 0.05) * this.tri;
        v = this.tri;
        break;
      }
    }
    this.phase = p + dt;
    if (this.phase >= 1) this.phase -= Math.floor(this.phase);
    return v;
  }
}

/**
 * A state-variable filter (the topology-preserving form): low pass, band pass and high pass from
 * one state, stable when its cutoff moves every sample. `q` about 0.7 is flat; higher rings.
 */
export class SVF {
  private ic1 = 0;
  private ic2 = 0;
  lp = 0; bp = 0; hp = 0;
  private key = NaN; private kq = NaN; private k = 0; private a1 = 0; private a2 = 0; private a3 = 0;
  run(x: number, hz: number, q: number, rate: number) {
    // the coefficients are worked out again only when the cutoff or the resonance moves
    if (hz !== this.key || q !== this.kq) {
      const g = Math.tan(Math.PI * Math.min(hz, rate * 0.45) / rate);
      this.k = 1 / Math.max(0.05, q);
      this.a1 = 1 / (1 + g * (g + this.k)); this.a2 = g * this.a1; this.a3 = g * this.a2;
      this.key = hz; this.kq = q;
    }
    const { k, a1, a2, a3 } = this;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2; this.bp = v1; this.hp = x - k * v1 - v2;
    return this;
  }
}

/** Attack, decay, sustain, release, in seconds; `held` is how long the note is held. Returns 0..1. */
export function adsr(t: number, held: number, a: number, d: number, s: number, r: number): number {
  if (t < 0) return 0;
  const on = (u: number) => (u < a ? u / Math.max(a, 1e-4) : u < a + d ? 1 - (1 - s) * ((u - a) / Math.max(d, 1e-4)) : s);
  if (t < held) return on(t);
  const r0 = on(held);
  const u = t - held;
  return u >= r ? 0 : r0 * (1 - u / Math.max(r, 1e-4));
}

/** Equal-power pan: -1 left, 0 centre, 1 right. */
export function panGains(pan: number): [number, number] {
  const x = (Math.max(-1, Math.min(1, pan)) + 1) * 0.25 * Math.PI;
  return [Math.cos(x), Math.sin(x)];
}
