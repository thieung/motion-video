// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./LICENSE-pdoom-video.txt
// Small math / animation helpers shared by every scene. Everything must be a
// pure function of time (or seeded), so frames render identically on export.
// Changed for this project: frameIdx() reads the frame rate from project-config.ts (was a fixed 60);
// more easings (sine, circ, the rest of quint, inOutBack, outBounce); settle() and settleVel(), a move
// that comes fully to rest at a set time.
import { PROJECT } from '../project-config';

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => (a === b ? 0 : (x - a) / (b - a));
export const remap = (x: number, a: number, b: number, c: number, d: number, clampIt = true) => {
  const t = invLerp(a, b, x);
  return lerp(c, d, clampIt ? clamp(t) : t);
};
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const fract = (x: number) => x - Math.floor(x);
export const mod = (x: number, m: number) => ((x % m) + m) % m;
export const TAU = Math.PI * 2;

/** Window: 0 before a, ramps up over `fadeIn`, holds, ramps down over `fadeOut` ending at b. */
export const window01 = (x: number, a: number, b: number, fadeIn = 0.2, fadeOut = 0.2) =>
  Math.min(smoothstep(a, a + fadeIn, x), 1 - smoothstep(b - fadeOut, b, x));

// ---- easing (t in 0..1) ----
export const ease = {
  linear: (t: number) => t,
  inSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t: number) => t * t * t * t,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inQuint: (t: number) => t * t * t * t * t,
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inCirc: (t: number) => 1 - Math.sqrt(1 - Math.pow(clamp(t), 2)),
  outCirc: (t: number) => Math.sqrt(1 - Math.pow(clamp(t) - 1, 2)),
  inOutCirc: (t: number) => {
    const c = clamp(t);
    return c < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * c, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * c + 2, 2)) + 1) / 2;
  },
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t: number, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  inOutBack: (t: number, s = 1.70158) => {
    const c = s * 1.525;
    return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
  },
  outElastic: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  /** Falls onto 1 and bounces three times, each lower, ending exactly at 1. */
  outBounce: (t: number) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/** Clamped eased progress of x through [a, b]. */
export const prog = (x: number, a: number, b: number, fn: (t: number) => number = ease.linear) =>
  fn(clamp((x - a) / (b - a)));

/** Damped spring response to a step at time 0 (value goes 0 -> 1 with overshoot). */
export const springStep = (t: number, freq = 4, damping = 0.35) => {
  if (t <= 0) return 0;
  const w = TAU * freq;
  return 1 - Math.exp(-damping * w * t) * Math.cos(w * Math.sqrt(1 - damping * damping) * t);
};

/**
 * A damped spring let go at time 0: its displacement from rest after `t` seconds, having been
 * released at displacement `x0` with velocity `v0` (units per second). Before 0 it is held at x0.
 * Closed form, so a pure function of time: for a drag that is let go (x0 = where the finger left
 * the thing, v0 = how fast it was moving), and for a loop seam or a hand-over that must continue
 * at the speed it arrived with. `freq` in Hz, `damping` the ratio to critical: below 1 it
 * overshoots, 1 settles fastest without overshoot, above 1 creeps back. Any damping >= 0 works.
 * (`springStep` is a simpler curve that already moves at its start; the step from rest of a real
 * spring is 1 + springRelease(t, -1, 0).)
 */
export function springRelease(t: number, x0: number, v0 = 0, freq = 4, damping = 0.35): number {
  if (t <= 0) return x0;
  const w = TAU * freq, z = Math.max(0, damping);
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return Math.exp(-z * w * t) * (x0 * Math.cos(wd * t) + ((v0 + z * w * x0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return (x0 + (v0 + w * x0) * t) * Math.exp(-w * t);
  const s = w * Math.sqrt(z * z - 1), r1 = -z * w + s, r2 = -z * w - s;
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  return (x0 - c2) * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
}

/** The velocity (units per second) of `springRelease` at `t`. Before 0 the spring is held, so its velocity is 0. */
export function springReleaseVel(t: number, x0: number, v0 = 0, freq = 4, damping = 0.35): number {
  if (t <= 0) return 0;
  const w = TAU * freq, z = Math.max(0, damping);
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z), a = z * w, b = (v0 + a * x0) / wd;
    const e = Math.exp(-a * t), cs = Math.cos(wd * t), sn = Math.sin(wd * t);
    return e * (-a * (x0 * cs + b * sn) + wd * (-x0 * sn + b * cs));
  }
  if (z === 1) return ((v0 + w * x0) - w * (x0 + (v0 + w * x0) * t)) * Math.exp(-w * t);
  const s = w * Math.sqrt(z * z - 1), r1 = -z * w + s, r2 = -z * w - s;
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  return r1 * (x0 - c2) * Math.exp(r1 * t) + r2 * c2 * Math.exp(r2 * t);
}

/**
 * A move that comes to rest exactly at a set time: from `from` at t = 0 (moving at `v0` units per
 * second, 0 by default) to `to`, which it reaches at t = `duration` with zero speed, and where it
 * then stays, exactly. Before 0 it is at `from`. The shape is that of a critically damped spring
 * (a quick approach, a long soft landing, no overshoot unless `v0` carries it past), with time
 * compressed so that the tail ends at `duration` instead of never: every derivative is zero there,
 * so the piece is truly still. The kit's springs (springStep, springRelease) only come close to
 * rest; use this where a thing must stop dead, for a cut on a still frame, a loop seam, or a hand-over
 * to a held pose. `sharpness` says how early it gets close: at half the duration it has covered
 * about 80% of the way at 3, 91% at 4, 96% at 5; at 4 it is within a thousandth of the way from
 * about three quarters of the duration on. `settleVel` gives its speed, for a hand-over.
 */
export function settle(t: number, duration: number, from = 0, to = 1, v0 = 0, sharpness = 4): number {
  if (t <= 0) return from;
  if (duration <= 0 || t >= duration) return to;
  const u = t / duration, k = Math.max(1e-3, sharpness), tau = (k * u) / (1 - u);
  if (tau > 700) return to;
  // critically damped decay in warped time tau (tau = infinity at t = duration); v0 in tau units
  const x0 = from - to, b = (v0 * duration) / k + x0;
  return to + (x0 + b * tau) * Math.exp(-tau);
}

/** The velocity (units per second) of `settle` at `t`: `v0` at 0, 0 before 0 and from `duration` on. */
export function settleVel(t: number, duration: number, from = 0, to = 1, v0 = 0, sharpness = 4): number {
  if (t < 0 || duration <= 0 || t >= duration) return 0;
  const u = t / duration, k = Math.max(1e-3, sharpness), tau = (k * u) / (1 - u);
  if (tau > 700) return 0;
  const x0 = from - to, vt = (v0 * duration) / k, b = vt + x0;
  const dxdtau = (vt - b * tau) * Math.exp(-tau);
  return (dxdtau * k) / (duration * (1 - u) * (1 - u));
}

/** Exponential decay pulse after an event at time `t0` (1 at t0, fades with half-life `hl`). */
export const pulse = (t: number, t0: number, hl = 0.12) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));

// ---- deterministic randomness ----
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/**
 * Index of the output frame nearest t, for per-frame jitter/flicker. Constant over a frame's
 * whole motion-blur shutter, so each frame shows one state (Math.floor(t * fps) switches at the frame's
 * own time, blending two states in every frame).
 */
export const frameIdx = (t: number) => Math.round(t * PROJECT.fps);

/** Stateless hash of integers/floats to [0,1). */
export function hash(...xs: number[]) {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    h ^= Math.floor(x * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

// ---- value noise (1D/2D/3D), cheap & deterministic, for CPU-side motion ----
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, fade(f));
}
export function noise2(x: number, y: number, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy) * 2 - 1;
}
export function noise3(x: number, y: number, z: number, seed = 0) {
  const iz = Math.floor(z);
  const fz = fade(z - iz);
  return lerp(noise2(x + iz * 17.13, y - iz * 31.7, seed), noise2(x + (iz + 1) * 17.13, y - (iz + 1) * 31.7, seed), fz);
}
export function fbm1(x: number, oct = 4, seed = 0) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise1(x * f, seed + i * 7); f *= 2; a *= 0.5; }
  return s;
}
export function fbm2(x: number, y: number, oct = 4, seed = 0) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f, seed + i * 7); f *= 2; a *= 0.5; }
  return s;
}

// ---- keyframes ----
export type Key = [time: number, value: number, easeFn?: (t: number) => number];
/** Piecewise interpolation through keyframes; the ease on key i shapes the segment ending at key i. */
export function keys(t: number, ks: Key[]): number {
  if (ks.length === 0) return 0;
  if (t <= ks[0]![0]) return ks[0]![1];
  for (let i = 1; i < ks.length; i++) {
    const k = ks[i]!;
    if (t <= k[0]) {
      const p = ks[i - 1]!;
      const u = (t - p[0]) / (k[0] - p[0]);
      return lerp(p[1], k[1], (k[2] ?? ease.inOutCubic)(u));
    }
  }
  return ks[ks.length - 1]![1];
}

export const vec2 = (x = 0, y = 0) => ({ x, y });
export type V2 = { x: number; y: number };
export const dist = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.y - b.y);

/** Polyline helpers: cumulative arc lengths & point-at-length (used for text on paths, reveals). */
export function polylineLengths(pts: V2[]) {
  const L = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) L[i] = L[i - 1]! + dist(pts[i - 1]!, pts[i]!);
  return L;
}
export function pointAtLength(pts: V2[], L: Float32Array, s: number): { x: number; y: number; angle: number } {
  const n = pts.length;
  if (n === 0) return { x: 0, y: 0, angle: 0 };
  if (n === 1) return { x: pts[0]!.x, y: pts[0]!.y, angle: 0 };
  s = clamp(s, 0, L[n - 1]!);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid]! < s) lo = mid; else hi = mid; }
  const a = pts[lo]!, b = pts[hi]!;
  const seg = L[hi]! - L[lo]!;
  const u = seg > 0 ? (s - L[lo]!) / seg : 0;
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

/** Linear-space color from hex (for GL uniforms; applies sRGB->linear). */
export function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return c as [number, number, number];
}
