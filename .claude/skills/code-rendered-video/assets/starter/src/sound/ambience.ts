// Beds of ambience: wind, rain, room tone, a river, crickets. Each is noise shaped by filters and
// by slow seeded randomness, stereo, quiet by default, faded in and out over `fade` seconds. A bed
// lasts as long as its event: a cue with `beats`, or a step held with `-` in a pattern.
//
// No DOM and no Node imports.
import { rng, SVF, TAU } from './dsp';
import { fadeEdges, len, num, type NoteEvent, type Params, type Rendered } from './event';

/** A smooth random curve from 0 to 1, changing about `hz` times a second (seeded value noise). */
function drift(seed: number, hz: number) {
  const R = rng(seed);
  const pts: number[] = [];
  return (t: number) => {
    const x = t * hz, i = Math.floor(x), f = x - i;
    while (pts.length <= i + 1) pts.push(R());
    const u = (1 - Math.cos(Math.PI * f)) / 2;
    return pts[i]! * (1 - u) + pts[i + 1]! * u;
  };
}

export function renderAmbience(type: string, p: Params, ev: NoteEvent, rate: number): Rendered | undefined {
  if (!AMBIENCE_TYPES.includes(type)) return undefined;
  const n = len(Math.max(0.5, ev.dur), rate);
  const out = [new Float32Array(n), new Float32Array(n)];
  const v = ev.vel * 0.5;
  for (let ch = 0; ch < 2; ch++) {
    const R = rng(ev.seed + 7919 * ch);
    const noise = () => R() * 2 - 1;
    const o = out[ch]!;
    switch (type) {
      case 'wind': {
        const centre = drift(ev.seed + ch, num(p, 'speed')), gust = drift(ev.seed + 11 + ch, num(p, 'speed') * 0.7);
        const f1 = new SVF(), f2 = new SVF();
        const lo = num(p, 'low'), hi = num(p, 'high');
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const x = f1.run(noise(), 900, 0.5, rate).lp;
          const hz = lo * Math.pow(hi / lo, centre(t));
          o[i] = v * 2.2 * f2.run(x, hz, num(p, 'q'), rate).bp * (0.25 + 0.75 * gust(t) ** 2);
        }
        break;
      }
      case 'rain': {
        const hiss = new SVF(), air = new SVF();
        const perSample = num(p, 'density') / rate;
        let drop = { t0: -1, hz: 0, d: 0, a: 0 };
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          if (R() < perSample) drop = { t0: t, hz: 1800 + 4500 * R(), d: 0.002 + 0.006 * R(), a: 0.2 + 0.8 * R() };
          const dt = t - drop.t0;
          const ping = drop.t0 >= 0 && dt < drop.d * 6 ? drop.a * Math.sin(TAU * drop.hz * dt) * Math.exp(-dt / drop.d) : 0;
          const bed = air.run(hiss.run(noise(), 1200, 0.7, rate).hp, 9000, 0.7, rate).lp;
          o[i] = v * (0.35 * bed * num(p, 'hiss') + 0.5 * ping);
        }
        break;
      }
      case 'room': {
        const f = new SVF(), a = new SVF();
        let brown = 0;
        const hum = num(p, 'hum');
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          brown = 0.995 * brown + 0.05 * noise();
          const x = f.run(brown, 220, 0.7, rate).lp + 0.08 * a.run(noise(), 5000, 0.7, rate).hp;
          const h = hum ? 0.02 * (Math.sin(TAU * hum * t) + 0.5 * Math.sin(TAU * 2 * hum * t)) : 0;
          o[i] = v * 0.6 * (x + h);
        }
        break;
      }
      case 'river': {
        const bands = [220, 520, 1300, 3000].map((hz, k) => ({ hz, f: new SVF(), m: drift(ev.seed + 31 * k + ch, 7 + 3 * k) }));
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const x = noise();
          let y = 0;
          for (const b of bands) y += b.f.run(x, b.hz * (0.8 + 0.4 * b.m(t)), 3, rate).bp * b.m(t) ** 3;
          o[i] = v * 1.4 * y;
        }
        break;
      }
      case 'crickets': {
        // two or three insects, each a pitch of its own, chirping in groups of three pulses
        const bugs = [0, 1, 2].slice(0, num(p, 'count')).map((k) => ({ hz: 4200 + 500 * k + 150 * R(), every: 0.55 + 0.25 * R(), off: R(), pan: k === ch % 3 ? 1 : 0.35 }));
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          let y = 0;
          for (const b of bugs) {
            const u = ((t / b.every + b.off) % 1) * b.every;
            if (u < 0.1) {
              const pulse = Math.sin(Math.PI * ((u / 0.1) * 3 % 1)) ** 2;
              y += b.pan * pulse * Math.sin(TAU * b.hz * t);
            }
          }
          o[i] = v * 0.5 * y;
        }
        break;
      }
    }
    fadeEdges(o, rate, num(p, 'fade'));
  }
  return { l: out[0]!, r: out[1]!, hit: 0 };
}

export const AMBIENCE_DEFAULTS: Record<string, Params> = {
  wind: { speed: 0.25, low: 250, high: 1400, q: 2.2, fade: 1 },
  rain: { density: 80, hiss: 1, fade: 1 },
  room: { hum: 0, fade: 1 },
  river: { fade: 1 },
  crickets: { count: 3, fade: 1 },
};
export const AMBIENCE_TYPES = Object.keys(AMBIENCE_DEFAULTS);
