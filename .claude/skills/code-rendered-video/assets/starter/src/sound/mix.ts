// The mix of a score written in code: sends to a reverb and a delay, the ducking of the bed under
// the voice, a limiter, a loudness meter, and reading and writing WAV files.
//
// All of it runs offline over whole buffers, so the ducking and the limiter can look ahead without
// adding delay: the music starts to dip just before the voice speaks, and the limiter turns the
// gain down before a peak instead of after it. Nothing here reads a clock or an unseeded random.
import { rng } from './dsp';

export interface Stereo { l: Float32Array; r: Float32Array }
export const stereo = (n: number): Stereo => ({ l: new Float32Array(n), r: new Float32Array(n) });

// ------------------------------------------------------------------ reverb and delay

/** A small plate-like reverb (four combs and two all-passes a side, after Schroeder and Freeverb). */
export function reverb(input: Stereo, rate: number, size = 0.8, damp = 0.35): Stereo {
  const n = input.l.length;
  const out = stereo(n);
  const k = rate / 44100;
  const combs = [1116, 1188, 1277, 1356], alls = [556, 441];
  const side = (x: Float32Array, y: Float32Array, spread: number) => {
    const cs = combs.map((c) => ({ buf: new Float32Array(Math.round((c + spread) * k)), i: 0, lp: 0 }));
    const as = alls.map((a) => ({ buf: new Float32Array(Math.round((a + spread) * k)), i: 0 }));
    const fb = 0.7 + 0.28 * Math.max(0, Math.min(1, size));
    for (let s = 0; s < n; s++) {
      const inp = x[s]! * 0.03;
      let acc = 0;
      for (const c of cs) {
        const o = c.buf[c.i]!;
        c.lp = o * (1 - damp) + c.lp * damp;
        c.buf[c.i] = inp + c.lp * fb;
        c.i = (c.i + 1) % c.buf.length;
        acc += o;
      }
      for (const a of as) {
        const b = a.buf[a.i]!;
        const o = -acc + b;
        a.buf[a.i] = acc + b * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        acc = o;
      }
      y[s] = acc;
    }
  };
  side(input.l, out.l, 0);
  side(input.r, out.r, 23);
  return out;
}

/** A ping-pong delay: left, then right, then left, each repeat quieter and darker. */
export function delay(input: Stereo, rate: number, secs: number, feedback = 0.35): Stereo {
  const n = input.l.length;
  const out = stereo(n);
  const d = Math.max(1, Math.round(secs * rate));
  let lpL = 0, lpR = 0;
  for (let i = 0; i < n; i++) {
    const fromR = i >= d ? out.r[i - d]! : 0;
    const fromL = i >= d ? out.l[i - d]! : 0;
    lpL = lpL * 0.5 + 0.5 * ((input.l[i - d] ?? 0) + (input.r[i - d] ?? 0) * 0.5 + fromR * feedback);
    lpR = lpR * 0.5 + 0.5 * (fromL * feedback);
    out.l[i] = lpL;
    out.r[i] = lpR;
  }
  return out;
}

// ------------------------------------------------------------------ ducking

export interface DuckShape {
  /** Reduction in decibels while the key sounds. */
  depth: number;
  /** Seconds over which the bed goes down, before the key starts (look-ahead). */
  attack: number;
  /** Seconds over which the bed comes back after the key stops. */
  release: number;
  /** Gaps in the key shorter than this keep the bed down, so it does not pump between words. */
  hold: number;
}

/**
 * The gain, per sample, that ducks a bed under a key (the voice, or the sound effects). The key
 * is on wherever its level is above -40 dBFS in any millisecond.
 */
export function duckGain(key: Float32Array, rate: number, s: DuckShape): Float32Array {
  const blk = Math.max(1, Math.round(rate / 1000));
  const nb = Math.ceil(key.length / blk);
  const on = new Uint8Array(nb);
  const thr = 0.01;
  for (let b = 0; b < nb; b++) {
    let m = 0;
    for (let i = b * blk; i < Math.min(key.length, (b + 1) * blk); i++) m = Math.max(m, Math.abs(key[i]!));
    on[b] = m > thr ? 1 : 0;
  }
  // bridge short gaps
  const hold = Math.round(s.hold * 1000);
  let last = -1e9;
  for (let b = 0; b < nb; b++) {
    if (on[b]) { if (b - last > 1 && b - last <= hold) for (let j = last + 1; j < b; j++) on[j] = 1; last = b; }
  }
  const red = new Float32Array(nb);
  const rel = Math.exp(-1 / Math.max(1, s.release * 1000 / 4));
  const att = Math.exp(-1 / Math.max(1, s.attack * 1000 / 4));
  for (let b = 0; b < nb; b++) red[b] = Math.max(on[b] ? s.depth : 0, b ? red[b - 1]! * rel : 0);
  for (let b = nb - 2; b >= 0; b--) red[b] = Math.max(red[b]!, red[b + 1]! * att);
  const g = new Float32Array(key.length);
  for (let i = 0; i < key.length; i++) g[i] = Math.pow(10, -red[Math.floor(i / blk)]! / 20);
  return g;
}

// ------------------------------------------------------------------ limiter

/**
 * A look-ahead peak limiter: no sample leaves above `ceiling` (linear), and the gain moves smoothly.
 * Returns the largest reduction it made, in decibels, and the time of it in seconds.
 */
export function limit(x: Stereo, rate: number, ceiling: number, lookahead = 0.005, release = 0.12): { db: number; at: number } {
  const n = x.l.length;
  const L = Math.max(1, Math.round(lookahead * rate));
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(x.l[i]!), Math.abs(x.r[i]!));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  // the smallest gain needed over the next L samples (a monotonic queue keeps this linear in time)
  const fut = new Float32Array(n);
  const q = new Int32Array(n);
  let h = 0, t = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (t > h && need[q[t - 1]!]! >= need[i]!) t--;
    q[t++] = i;
    while (q[h]! > i + L - 1) h++;
    fut[i] = need[q[h]!]!;
  }
  // an average over the last L of those is never above the gain any sample in its reach needs
  let sum = 0, g = 1, worst = 1, worstAt = 0;
  const rel = 1 - Math.exp(-1 / (release * rate));
  for (let i = 0; i < n; i++) {
    sum += fut[i]!;
    if (i >= L) sum -= fut[i - L]!;
    const avg = i >= L - 1 ? sum / L : Math.min(sum / (i + 1), fut[i]!);
    g = Math.min(avg, g + (1 - g) * rel);
    if (g < worst) { worst = g; worstAt = i; }
    x.l[i]! *= g;
    x.r[i]! *= g;
  }
  return { db: -20 * Math.log10(worst), at: worstAt / rate };
}

// ------------------------------------------------------------------ loudness (ITU-R BS.1770)

function biquad(x: Float32Array, b0: number, b1: number, b2: number, a1: number, a2: number) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i]! + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]!; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

/** The K weighting of BS.1770: a high shelf of +4 dB round 1.5 kHz, then a high pass round 38 Hz. */
function kWeight(x: Float32Array, rate: number) {
  let K = Math.tan(Math.PI * 1681.974450955533 / rate);
  const Vh = Math.pow(10, 3.999843853973347 / 20), Vb = Math.pow(Vh, 0.4996667741545416), Q = 0.7071752369554196;
  let a0 = 1 + K / Q + K * K;
  const s = biquad(x, (Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
  K = Math.tan(Math.PI * 38.13547087602444 / rate);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  return biquad(s, 1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Q2 + K * K) / a0);
}

/** Integrated loudness in LUFS, with the absolute gate at -70 LUFS and the relative gate at -10 LU. */
export function loudness(x: Stereo, rate: number): number {
  const l = kWeight(x.l, rate), r = kWeight(x.r, rate);
  const blk = Math.round(0.4 * rate), hop = Math.round(0.1 * rate);
  const ms: number[] = [];
  for (let s = 0; s + blk <= l.length; s += hop) {
    let a = 0;
    for (let i = s; i < s + blk; i++) a += l[i]! * l[i]! + r[i]! * r[i]!;
    ms.push(a / blk);
  }
  const lufs = (m: number) => -0.691 + 10 * Math.log10(m);
  const abs = ms.filter((m) => lufs(m) > -70);
  if (!abs.length) return -Infinity;
  const mean = (a: number[]) => a.reduce((p, c) => p + c, 0) / a.length;
  const rel = lufs(mean(abs)) - 10;
  const gated = abs.filter((m) => lufs(m) > rel);
  return lufs(mean(gated.length ? gated : abs));
}

export function peak(x: Stereo) {
  let m = 0;
  for (let i = 0; i < x.l.length; i++) m = Math.max(m, Math.abs(x.l[i]!), Math.abs(x.r[i]!));
  return m;
}

// ------------------------------------------------------------------ WAV

/** A 16-bit stereo PCM WAV, with seeded triangular dither, as bytes. */
export function encodeWav(x: Stereo, rate: number, seed = 1): Uint8Array {
  const n = x.l.length;
  const buf = new ArrayBuffer(44 + n * 4);
  const dv = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * 4, true);
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const v = (c ? x.r : x.l)[i]! * 32767 + (R() - R());
      dv.setInt16(44 + i * 4 + c * 2, Math.max(-32768, Math.min(32767, Math.round(v))), true);
    }
  }
  return new Uint8Array(buf);
}

/** Reads a PCM WAV (16 or 24-bit integer, or 32-bit float; mono or stereo) into floats. */
export function decodeWav(bytes: Uint8Array): { rate: number; channels: Float32Array[] } {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number) => String.fromCharCode(bytes[o]!, bytes[o + 1]!, bytes[o + 2]!, bytes[o + 3]!);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let o = 12, fmt = 0, ch = 0, rate = 0, bits = 0;
  while (o + 8 <= bytes.length) {
    const id = tag(o), size = dv.getUint32(o + 4, true);
    if (id === 'fmt ') { fmt = dv.getUint16(o + 8, true); ch = dv.getUint16(o + 10, true); rate = dv.getUint32(o + 12, true); bits = dv.getUint16(o + 22, true); }
    if (id === 'data') {
      const bps = bits / 8, frames = Math.floor(Math.min(size, bytes.length - o - 8) / (bps * ch));
      const chans = Array.from({ length: ch }, () => new Float32Array(frames));
      const float = fmt === 3 || (fmt === 0xfffe && bits === 32);
      for (let i = 0; i < frames; i++) {
        for (let c = 0; c < ch; c++) {
          const p = o + 8 + (i * ch + c) * bps;
          chans[c]![i] = float ? dv.getFloat32(p, true)
            : bits === 16 ? dv.getInt16(p, true) / 32768
            : bits === 24 ? (((bytes[p + 2]! << 24) | (bytes[p + 1]! << 16) | (bytes[p]! << 8)) >> 8) / 8388608
            : NaN;
        }
      }
      if (!float && bits !== 16 && bits !== 24) throw new Error(`unsupported WAV sample size: ${bits} bits`);
      return { rate, channels: chans };
    }
    o += 8 + size + (size & 1);
  }
  throw new Error('WAV file has no data chunk');
}

/** Mono at `rate`, from any decoded WAV (channels averaged, rate changed with cubic interpolation). */
export function toMono(w: { rate: number; channels: Float32Array[] }, rate: number): Float32Array {
  const src = w.channels.length === 1 ? w.channels[0]! : w.channels[0]!.map((v, i) => w.channels.reduce((s, c) => s + c[i]!, 0) / w.channels.length);
  if (w.rate === rate) return src;
  const n = Math.floor((src.length * rate) / w.rate);
  const out = new Float32Array(n);
  const at = (i: number) => src[Math.max(0, Math.min(src.length - 1, i))]!;
  for (let i = 0; i < n; i++) {
    const x = (i * w.rate) / rate, k = Math.floor(x), f = x - k;
    const y0 = at(k - 1), y1 = at(k), y2 = at(k + 1), y3 = at(k + 2);
    out[i] = y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
  }
  return out;
}

/**
 * Stereo at `rate`, from any decoded WAV. A mono file comes back with the same array in both
 * channels, so a caller can tell it is mono (`l === r`) and pan it.
 */
export function toStereo(w: { rate: number; channels: Float32Array[] }, rate: number): Stereo {
  const one = (c: Float32Array) => toMono({ rate: w.rate, channels: [c] }, rate);
  if (w.channels.length === 1) { const m = one(w.channels[0]!); return { l: m, r: m }; }
  return { l: one(w.channels[0]!), r: one(w.channels[1]!) };
}
