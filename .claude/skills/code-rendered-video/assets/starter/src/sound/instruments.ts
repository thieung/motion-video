// The instruments of a score written in code: a few drums, a bass, a pad, a pluck, and the sound
// effects that mark events of the picture. Each one turns one event into samples.
//
// An event has a hit point: the moment that belongs on the beat or on the event of the picture.
// For a drum, a pluck or an impact it is the first sample. A whoosh peaks in its middle, and a riser
// ends on it, so it climbs into the event. The mixer places every sound so that its hit point, not
// its first sample, lands on the time the score gives.
//
// This file holds the first set (drums, bass, pad, pluck, riser, impact, whoosh, click) and the
// list of every type. The instruments for "in the manner of" requests are in orchestra.ts, the
// beds of ambience in ambience.ts, recorded files and the effect presets in effects.ts.
// Every sound is a function of its parameters and a seed; each is kept small, clean and cheap.
import { adsr, hzOf, Osc, rng, SVF, TAU } from './dsp';
import { fadeTail, fall, num, pitchAt, str, type NoteEvent, type Params, type Rendered } from './event';
import { AMBIENCE_DEFAULTS, AMBIENCE_TYPES, renderAmbience } from './ambience';
import { EFFECT_DEFAULTS, EFFECT_TYPES, renderEffect } from './effects';
import { ORCHESTRA_DEFAULTS, ORCHESTRA_TYPES, renderOrchestra } from './orchestra';

export type { NoteEvent, Params, Rendered } from './event';

/** The instruments of the first set, rendered in this file. */
const CORE_DEFAULTS: Record<string, Params> = {
  kick: { start: 150, end: 48, sweep: 0.04, decay: 0.45, click: 0.25, drive: 1.4 },
  snare: { tone: 190, decay: 0.2, noise: 0.75, low: 1400, high: 9000 },
  clap: { centre: 1300, decay: 0.2, spread: 0.011 },
  hat: { decay: 0.045, tone: 7500 },
  bass: { shape: 'saw', cutoff: 260, env: 900, fdecay: 0.12, q: 0.8, sub: 0.6, attack: 0.003, release: 0.05, glide: 0 },
  pad: { shape: 'saw', detune: 11, cutoff: 1600, q: 0.7, attack: 0.35, release: 0.8, width: 0.7 },
  pluck: { model: 'synth', shape: 'square', cutoff: 900, env: 3500, fdecay: 0.09, decay: 0.35, damp: 0.5, ring: 1.2, glide: 0 },
  riser: { from: 300, to: 7000, q: 1.6, tone: 0.25 },
  impact: { start: 75, end: 32, decay: 1.4, noise: 0.5, cutoff: 900 },
  whoosh: { from: 350, peak: 3200, q: 1.2 },
  click: { pitch: 2600, decay: 0.012, noise: 0.3 },
};

/** Every instrument type and its defaults. A parameter the score names overrides one of these. */
export const DEFAULTS: Record<string, Params> = { ...CORE_DEFAULTS, ...ORCHESTRA_DEFAULTS, ...AMBIENCE_DEFAULTS, ...EFFECT_DEFAULTS };
export const INSTRUMENT_TYPES = Object.keys(DEFAULTS);
export type InstrumentType = string;
/** Types written as notes in a pattern (the others are written as steps). */
export const PITCHED_TYPES = new Set(['bass', 'pad', 'pluck', ...ORCHESTRA_TYPES]);
/** Types that last as long as their event: a bed or an effect with a length. */
export const LASTING_TYPES = new Set(['riser', 'whoosh', 'siren', 'engine', ...AMBIENCE_TYPES]);
void EFFECT_TYPES;


export function renderEvent(type: InstrumentType, p: Params, ev: NoteEvent, rate: number): Rendered {
  const other = renderOrchestra(type, p, ev, rate) ?? renderAmbience(type, p, ev, rate) ?? renderEffect(type, p, ev, rate);
  if (other) return other;
  const R = rng(ev.seed);
  const noise = () => R() * 2 - 1;
  const len = (secs: number) => Math.max(1, Math.round(secs * rate));
  const v = ev.vel;
  switch (type) {
    case 'kick': {
      const n = len(num(p, 'decay') + 0.02);
      const l = new Float32Array(n);
      const hp = new SVF();
      let ph = 0;
      const drive = num(p, 'drive'), norm = Math.tanh(drive);
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const hz = num(p, 'end') + (num(p, 'start') - num(p, 'end')) * Math.exp(-t / num(p, 'sweep'));
        ph += hz / rate;
        const body = Math.tanh(drive * Math.sin(TAU * ph)) / norm;
        const click = t < 0.006 ? hp.run(noise(), 3000, 0.7, rate).hp * (1 - t / 0.006) * num(p, 'click') : 0;
        l[i] = v * (body * Math.min(1, t / 0.0015) * fall(t, num(p, 'decay')) + click);
      }
      fadeTail(l, rate);
      return { l, hit: 0 };
    }
    case 'snare': {
      const n = len(num(p, 'decay') + 0.02);
      const l = new Float32Array(n);
      const f = new SVF(), g = new SVF();
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        ph += (num(p, 'tone') * (1 + 0.5 * Math.exp(-t / 0.01))) / rate;
        const tone = Math.sin(TAU * ph) * fall(t, num(p, 'decay') * 0.5);
        const nz = g.run(f.run(noise(), num(p, 'low'), 0.7, rate).hp, num(p, 'high'), 0.7, rate).lp;
        l[i] = v * ((1 - num(p, 'noise')) * tone + num(p, 'noise') * 1.6 * nz * fall(t, num(p, 'decay'))) * Math.min(1, t / 0.001);
      }
      fadeTail(l, rate);
      return { l, hit: 0 };
    }
    case 'clap': {
      const n = len(num(p, 'decay') + 3 * num(p, 'spread') + 0.02);
      const l = new Float32Array(n);
      const f = new SVF();
      const sp = num(p, 'spread');
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        // three short bursts, then the tail of the last
        let a = 0;
        for (let k = 0; k < 3; k++) { const u = t - k * sp; if (u >= 0) a = Math.max(a, k < 2 ? fall(u, 0.012) : fall(u, num(p, 'decay'))); }
        l[i] = v * 2.2 * f.run(noise(), num(p, 'centre'), 1.1, rate).bp * a;
      }
      fadeTail(l, rate);
      return { l, hit: 0 };
    }
    case 'hat': {
      const n = len(num(p, 'decay') + 0.01);
      const l = new Float32Array(n);
      const f = new SVF(), g = new SVF();
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const x = g.run(f.run(noise(), num(p, 'tone'), 0.8, rate).hp, 14000, 0.7, rate).lp;
        l[i] = v * 0.9 * x * fall(t, num(p, 'decay')) * Math.min(1, t / 0.0005);
      }
      fadeTail(l, rate);
      return { l, hit: 0 };
    }
    case 'bass': {
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.01);
      const l = new Float32Array(n);
      for (const note of ev.notes) {
        const o = new Osc(str(p, 'shape') as 'saw', R()), s = new Osc('sine');
        const f = new SVF();
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const hz = pitchAt(note, ev, t, num(p, 'glide'));
          const cut = num(p, 'cutoff') + num(p, 'env') * Math.exp(-t / num(p, 'fdecay'));
          const x = f.run(o.next(hz, rate), cut, num(p, 'q'), rate).lp + num(p, 'sub') * s.next(hz, rate);
          l[i]! += v * 0.7 * x * adsr(t, ev.dur, num(p, 'attack'), 0.08, 0.85, rel);
        }
      }
      return { l, hit: 0 };
    }
    case 'pad': {
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.01);
      const l = new Float32Array(n), r = new Float32Array(n);
      const w = num(p, 'width');
      const scale = 0.32 / Math.sqrt(Math.max(1, ev.notes.length));
      for (const note of ev.notes) {
        const cents = [-num(p, 'detune'), 0, num(p, 'detune')];
        const oscs = cents.map(() => new Osc(str(p, 'shape') as 'saw', R()));
        const fl = new SVF(), fr = new SVF();
        const hz = cents.map((c) => hzOf(note + c / 100));
        const att = num(p, 'attack'), cut = num(p, 'cutoff'), q = num(p, 'q');
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const a = oscs[0]!.next(hz[0]!, rate), b = oscs[1]!.next(hz[1]!, rate), c = oscs[2]!.next(hz[2]!, rate);
          const env = adsr(t, ev.dur, att, 0.4, 0.85, rel) * v * scale;
          const left = b + (1 + w) * 0.5 * a + (1 - w) * 0.5 * c;
          const right = b + (1 - w) * 0.5 * a + (1 + w) * 0.5 * c;
          l[i]! += env * fl.run(left, cut, q, rate).lp;
          r[i]! += env * fr.run(right, cut, q, rate).lp;
        }
      }
      return { l, r, hit: 0 };
    }
    case 'pluck': {
      const ring = num(p, 'ring');
      const n = len(Math.min(ev.dur, ring) + ring);
      const l = new Float32Array(n);
      for (const note of ev.notes) {
        const hz = hzOf(note);
        if (str(p, 'model') === 'string') {
          // Karplus-Strong: a burst of seeded noise in a delay line one period long, averaged on every pass
          const period = rate / hz;
          const size = Math.ceil(period) + 2;
          const line = new Float32Array(size);
          const pre = new SVF();
          for (let i = 0; i < size; i++) line[i] = pre.run(noise(), 2000 + 6000 * (1 - num(p, 'damp')), 0.7, rate).lp;
          let w = 0, prev = 0;
          const keep = Math.pow(0.001, 1 / (hz * ring)); // -60 dB after `ring` seconds
          for (let i = 0; i < n; i++) {
            let rp = w - period;
            while (rp < 0) rp += size;
            const i0 = Math.floor(rp), fr = rp - i0;
            const y = line[i0 % size]! * (1 - fr) + line[(i0 + 1) % size]! * fr;
            const out = keep * (0.5 * (y + prev));
            prev = y;
            line[w % size] = out;
            w = (w + 1) % size;
            l[i]! += v * 0.8 * y;
          }
        } else {
          const o = new Osc(str(p, 'shape') as 'square', R());
          const f = new SVF();
          for (let i = 0; i < n; i++) {
            const t = i / rate;
            const hz = pitchAt(note, ev, t, num(p, 'glide'));
            const cut = num(p, 'cutoff') + num(p, 'env') * Math.exp(-t / num(p, 'fdecay'));
            l[i]! += v * 0.4 * f.run(o.next(hz, rate), cut, 0.9, rate).lp * Math.min(1, t / 0.002) * fall(t, num(p, 'decay') * 3);
          }
        }
      }
      fadeTail(l, rate, 0.03);
      return { l, hit: 0 };
    }
    case 'riser': {
      const n = len(Math.max(0.1, ev.dur));
      const l = new Float32Array(n);
      const f = new SVF();
      const o = new Osc('sine');
      const from = num(p, 'from'), to = num(p, 'to');
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const hz = from * Math.pow(to / from, u);
        const x = f.run(noise(), hz, num(p, 'q'), rate).bp * 1.5 + num(p, 'tone') * o.next(hz * 0.25, rate);
        l[i] = v * x * u * u;
      }
      fadeTail(l, rate, 0.004);
      return { l, hit: n - 1 };
    }
    case 'impact': {
      const n = len(num(p, 'decay') + 0.02);
      const l = new Float32Array(n);
      const f = new SVF();
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        ph += (num(p, 'end') + (num(p, 'start') - num(p, 'end')) * Math.exp(-t / 0.12)) / rate;
        const boom = Math.tanh(1.8 * Math.sin(TAU * ph)) * fall(t, num(p, 'decay'));
        const nz = f.run(noise(), num(p, 'cutoff'), 0.7, rate).lp * fall(t, num(p, 'decay') * 0.35) * num(p, 'noise') * 2;
        l[i] = v * (boom + nz) * Math.min(1, t / 0.001);
      }
      fadeTail(l, rate, 0.05);
      return { l, hit: 0 };
    }
    case 'whoosh': {
      const n = len(Math.max(0.1, ev.dur || 0.5));
      const l = new Float32Array(n);
      const f = new SVF();
      const from = num(p, 'from'), peak = num(p, 'peak');
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const bell = Math.sin(Math.PI * u) ** 2;
        const hz = from * Math.pow(peak / from, Math.sin(Math.PI * u));
        l[i] = v * 1.8 * f.run(noise(), hz, num(p, 'q'), rate).bp * bell;
      }
      return { l, hit: Math.floor(n / 2) };
    }
    case 'click': {
      const n = len(num(p, 'decay') * 4 + 0.005);
      const l = new Float32Array(n);
      const f = new SVF();
      const hz = ev.notes.length ? hzOf(ev.notes[0]!) : num(p, 'pitch');
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const x = Math.sin(TAU * hz * t) * fall(t, num(p, 'decay') * 4) + num(p, 'noise') * f.run(noise(), 4000, 0.7, rate).hp * fall(t, 0.004);
        l[i] = v * 0.6 * x;
      }
      fadeTail(l, rate, 0.002);
      return { l, hit: 0 };
    }
  }
  throw new Error(`unknown instrument type: ${type}`);
}
