// Sound effects: recorded files placed by their measured peak, and presets for games, reward
// reveals, cartoons and interfaces, each built from a few oscillators and filters.
//
// A preset's hit point is the moment that belongs on the event: the first sound of a coin or a
// click, the arrival chord of a fanfare or a level-up. A recorded file's hit point is its loudest
// moment, measured, unless the instrument says otherwise.
//
// No DOM and no Node imports.
import { hzOf, midiOf, Osc, rng, SVF, TAU } from './dsp';
import { fadeTail, fall, len, num, str, type NoteEvent, type Params, type Rendered } from './event';
import { renderOrchestra, ORCHESTRA_DEFAULTS } from './orchestra';

/**
 * The loudest moment of a sound, in samples: the peak of its level over 5 ms windows, so that one
 * sharp sample of noise does not count as the peak of a whoosh.
 */
export function measuredPeak(l: Float32Array, r: Float32Array, rate: number): number {
  const w = Math.max(1, Math.round(0.005 * rate));
  let sum = 0, best = -1, at = 0;
  const e = (i: number) => (l[i]! * l[i]! + r[i]! * r[i]!) / 2;
  for (let i = 0; i < l.length; i++) {
    sum += e(i);
    if (i >= w) sum -= e(i - w);
    if (sum > best) { best = sum; at = i - Math.floor(w / 2); }
  }
  // the start of the window's loudest sample, so a click lands on its attack, not after it
  let m = 0, mi = Math.max(0, at);
  for (let i = Math.max(0, at - w); i < Math.min(l.length, at + w); i++) { const a = Math.abs(l[i]!) + Math.abs(r[i]!); if (a > m) { m = a; mi = i; } }
  return mi;
}

export function renderEffect(type: string, p: Params, ev: NoteEvent, rate: number): Rendered | undefined {
  const R = rng(ev.seed);
  const noise = () => R() * 2 - 1;
  const v = ev.vel;
  /** A note of the preset moved by the cue's note, which names the new root. */
  const root = (name: string) => midiOf(str(p, 'root') === 'undefined' ? name : str(p, 'root')) + (ev.notes.length ? ev.notes[0]! - midiOf(name) : 0);
  const tone = (l: Float32Array, at: number, midi: number, secs: number, shape: 'sine' | 'square' | 'triangle', gain: number, t60: number, cut = 0) => {
    const o = new Osc(shape), f = new SVF();
    const i0 = Math.round(at * rate), hz = hzOf(midi);
    for (let i = 0; i < Math.round(secs * rate) && i0 + i < l.length; i++) {
      const t = i / rate;
      let x = o.next(hz, rate);
      if (cut) x = f.run(x, cut, 0.7, rate).lp;
      l[i0 + i]! += gain * v * x * fall(t, t60) * Math.min(1, t / 0.002);
    }
  };
  switch (type) {
    case 'sample': {
      const s = ev.sample;
      if (!s) return { l: new Float32Array(1), hit: 0 };
      let l = s.l, r = s.r;
      const mono = s.r === s.l;
      // a cue's note plays the file higher or lower, taking the instrument's `root` as the note it was recorded at
      if (ev.notes.length && str(p, 'root') !== 'undefined') {
        const ratio = Math.pow(2, (ev.notes[0]! - midiOf(str(p, 'root'))) / 12);
        const n = Math.floor(l.length / ratio);
        const nl = new Float32Array(n), nr = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const x = i * ratio, k = Math.floor(x), f = x - k;
          nl[i] = l[k]! * (1 - f) + (l[k + 1] ?? 0) * f; nr[i] = r[k]! * (1 - f) + (r[k + 1] ?? 0) * f;
        }
        l = nl; r = nr;
      }
      const h = str(p, 'hit');
      const hit = h === 'start' ? 0 : h === 'peak' || h === 'undefined' ? measuredPeak(l, r, rate) : Math.round(Number(h) * rate);
      // a mono file is kept mono, so the instrument's pan still places it
      return mono ? { l: l.map((x) => x * v), hit } : { l: l.map((x) => x * v), r: r.map((x) => x * v), hit };
    }
    case 'coin': {
      const l = new Float32Array(len(0.5, rate));
      const n1 = root('B5');
      tone(l, 0, n1, 0.08, 'square', 0.22, 0.4, 6000);
      tone(l, 0.075, n1 + 5, 0.42, 'square', 0.22, 0.4, 6000);
      fadeTail(l, rate);
      return { l, hit: 0 };
    }
    case 'fanfare': {
      // three quick pick-up notes, then the chord that lands on the event
      const c = root('C5');
      const beat = num(p, 'step');
      const n = len(3 * beat + num(p, 'hold') + 0.3, rate);
      const l = new Float32Array(n);
      const brass = ORCHESTRA_DEFAULTS.brass!;
      const put = (at: number, notes: number[], dur: number, vel: number) => {
        const x = renderOrchestra('brass', brass, { ...ev, notes, dur, vel: v * vel * 0.6 }, rate)!;
        const i0 = Math.round(at * rate);
        for (let i = 0; i < x.l.length && i0 + i < n; i++) l[i0 + i]! += x.l[i]!;
      };
      put(0, [c - 5], beat * 0.8, 0.7);
      put(beat, [c - 5], beat * 0.8, 0.7);
      put(2 * beat, [c - 5], beat * 0.8, 0.8);
      put(3 * beat, [c - 12, c - 8, c - 5, c], num(p, 'hold'), 1);
      fadeTail(l, rate, 0.05);
      return { l, hit: Math.round(3 * beat * rate) };
    }
    case 'levelup': {
      const c = root('C5');
      const step = num(p, 'step');
      const run = [0, 4, 7, 12, 16, 19];
      const n = len(run.length * step + 1.4, rate);
      const l = new Float32Array(n);
      run.forEach((k, i) => tone(l, i * step, c - 12 + k, 0.2, 'square', 0.12, 0.25, 5000));
      const land = run.length * step;
      for (const k of [0, 4, 7, 12]) tone(l, land, c + k, 1.3, 'triangle', 0.22, 1.2);
      // a little shimmer over the chord
      for (let i = Math.round(land * rate); i < n; i++) { const t = i / rate - land; l[i]! += v * 0.05 * Math.sin(TAU * hzOf(c + 24) * t) * Math.sin(TAU * 7 * t) * fall(t, 1); }
      fadeTail(l, rate, 0.05);
      return { l, hit: Math.round(land * rate) };
    }
    case 'siren': {
      const n = len(Math.max(0.3, ev.dur), rate);
      const l = new Float32Array(n);
      const o = new Osc('triangle'), f = new SVF();
      const lo = num(p, 'low'), hi = num(p, 'high'), per = num(p, 'period'), mode = str(p, 'mode');
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const u = mode === 'hilo' ? (Math.floor(t / (per / 2)) % 2) : 0.5 - 0.5 * Math.cos((TAU * t) / per);
        const hz = lo * Math.pow(hi / lo, u);
        l[i] = v * 0.35 * f.run(o.next(hz, rate), 3000, 0.7, rate).lp * Math.min(1, t / 0.05);
      }
      fadeTail(l, rate, 0.08);
      return { l, hit: 0 };
    }
    case 'engine': {
      // firing pulses at the rate the revs give, ringing two resonances of the exhaust
      const n = len(Math.max(0.3, ev.dur), rate);
      const l = new Float32Array(n);
      const a = new SVF(), b = new SVF(), c = new SVF();
      const from = num(p, 'from'), to = num(p, 'to'), cyl = num(p, 'cylinders');
      let ph = 0, pulse = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate, u = t / Math.max(0.3, ev.dur);
        const rpm = from + (to - from) * (u * u * (3 - 2 * u));
        ph += (rpm / 60) * (cyl / 2) / rate;
        if (ph >= 1) { ph -= 1; pulse = 1; }
        const x = pulse + 0.15 * noise();
        pulse *= 0.9;
        const y = a.run(x, 110, 4, rate).bp + 0.6 * b.run(x, 420, 3, rate).bp + 0.2 * c.run(x, 1500, 1, rate).bp;
        l[i] = v * 0.5 * Math.tanh(1.5 * y) * Math.min(1, t / 0.1);
      }
      fadeTail(l, rate, 0.1);
      return { l, hit: 0 };
    }
    case 'crunch': {
      // metal: a dozen ringing modes struck by a burst of crackles, and a thud under them
      const n = len(num(p, 'decay') + 0.1, rate);
      const l = new Float32Array(n);
      const modes = Array.from({ length: 12 }, () => ({ f: new SVF(), hz: 600 + 5400 * R() ** 1.5 }));
      const grains = Array.from({ length: 18 }, () => ({ t: 0.25 * R() ** 2, a: 0.3 + 0.7 * R() }));
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        let ex = 0;
        for (const g of grains) { const d = t - g.t; if (d >= 0 && d < 0.004) ex += g.a * noise() * (1 - d / 0.004); }
        let y = 0;
        for (const m of modes) y += m.f.run(ex, m.hz, 25, rate).bp;
        ph += (40 + 60 * Math.exp(-t / 0.05)) / rate;
        const thud = Math.sin(TAU * ph) * fall(t, 0.35);
        l[i] = v * (0.15 * y * fall(t, num(p, 'decay')) + 0.45 * thud);
      }
      fadeTail(l, rate, 0.05);
      return { l, hit: 0 };
    }
    case 'pop': {
      const l = new Float32Array(len(0.12, rate));
      let ph = 0;
      for (let i = 0; i < l.length; i++) {
        const t = i / rate;
        ph += (num(p, 'from') + (num(p, 'to') - num(p, 'from')) * Math.min(1, t / 0.025)) / rate;
        l[i] = v * 0.5 * Math.sin(TAU * ph) * fall(t, 0.08) * Math.min(1, t / 0.001);
      }
      fadeTail(l, rate, 0.005);
      return { l, hit: 0 };
    }
    case 'boing': {
      const l = new Float32Array(len(num(p, 'decay') + 0.05, rate));
      const o = new Osc('triangle');
      const base = hzOf(root('A3'));
      for (let i = 0; i < l.length; i++) {
        const t = i / rate;
        const hz = base * (1 + 0.5 * Math.exp(-t / 0.3) * Math.sin(TAU * 9 * t)) * (1 + 0.15 * Math.min(1, t / 0.4));
        l[i] = v * 0.45 * o.next(hz, rate) * fall(t, num(p, 'decay')) * Math.min(1, t / 0.002);
      }
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'toggle': {
      const l = new Float32Array(len(0.12, rate));
      tone(l, 0, midiOf('A6'), 0.03, 'sine', 0.6, 0.02);
      tone(l, 0.045, midiOf('E7'), 0.03, 'sine', 0.5, 0.02);
      return { l, hit: 0 };
    }
    case 'success': {
      const l = new Float32Array(len(0.7, rate));
      const c = root('E5');
      tone(l, 0, c, 0.4, 'sine', 0.3, 0.35);
      tone(l, 0.09, c + 7, 0.6, 'sine', 0.3, 0.5);
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'error': {
      const l = new Float32Array(len(0.35, rate));
      const c = root('A3');
      tone(l, 0, c, 0.13, 'square', 0.3, 0.2, 1400);
      tone(l, 0.14, c - 4, 0.2, 'square', 0.3, 0.25, 1400);
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'notify': {
      const l = new Float32Array(len(0.9, rate));
      const c = root('C6');
      [0, 4, 7].forEach((k, i) => { tone(l, i * 0.07, c + k, 0.7, 'sine', 0.22, 0.6); tone(l, i * 0.07, c + k + 12 * Math.log2(2.76), 0.2, 'sine', 0.05, 0.08); });
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'key': {
      // one key of a keyboard: a click and the short thock of the key's body, a little different every time
      const l = new Float32Array(len(0.06, rate));
      const f = new SVF();
      const body = 170 + 110 * R();
      for (let i = 0; i < l.length; i++) {
        const t = i / rate;
        l[i] = v * (0.4 * f.run(noise(), 2500, 0.7, rate).hp * fall(t, 0.006) + 0.35 * Math.sin(TAU * body * t) * fall(t, 0.03));
      }
      fadeTail(l, rate, 0.003);
      return { l, hit: 0 };
    }
  }
  return undefined;
}

export const EFFECT_DEFAULTS: Record<string, Params> = {
  sample: { file: undefined, hit: 'peak', root: undefined },
  coin: { root: undefined },
  fanfare: { root: undefined, step: 0.11, hold: 0.9 },
  levelup: { root: undefined, step: 0.055 },
  siren: { low: 650, high: 1350, period: 1.4, mode: 'wail' },
  engine: { from: 900, to: 4200, cylinders: 4 },
  crunch: { decay: 0.7 },
  pop: { from: 350, to: 1200 },
  boing: { root: undefined, decay: 0.7 },
  toggle: {},
  success: { root: undefined },
  error: { root: undefined },
  notify: { root: undefined },
  key: {},
};
export const EFFECT_TYPES = Object.keys(EFFECT_DEFAULTS);
