// Instruments for scores "in the manner of" a kind of music: strings, brass, piano, electric
// piano, a flute made by a physical model, bells, a plucked zither, a wobble bass and an 8-bit
// pulse voice. Each is a sketch of its family, clean and cheap, not an imitation of a recording.
//
// No DOM and no Node imports.
import { adsr, hzOf, Osc, rng, SVF, TAU } from './dsp';
import { fadeTail, fall, len, num, pitchAt, str, type NoteEvent, type Params, type Rendered } from './event';

/** A naive-free sawtooth step (polyBLEP), for the pulse voice. */
function blep(t: number, dt: number) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}

export function renderOrchestra(type: string, p: Params, ev: NoteEvent, rate: number): Rendered | undefined {
  const R = rng(ev.seed);
  const noise = () => R() * 2 - 1;
  const v = ev.vel;
  const vib = (d: number) => ({ depth: d, rate: num(p, 'vibrato') || 5.2, delay: 0.3 });
  switch (type) {
    case 'strings': {
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.02, rate);
      const l = new Float32Array(n), r = new Float32Array(n);
      const cents = [-9, -4, 0, 4, 9].map((c) => (c * num(p, 'detune')) / 9);
      const scale = 0.22 / Math.sqrt(Math.max(1, ev.notes.length));
      const cut = num(p, 'cutoff'), att = num(p, 'attack'), depth = num(p, 'depth');
      for (const note of ev.notes) {
        const oscs = cents.map(() => new Osc('saw', R()));
        const fl = new SVF(), fr = new SVF(), hl = new SVF(), hr = new SVF();
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const env = adsr(t, ev.dur, att, 0.3, 0.9, rel) * v * scale;
          let a = 0, b = 0;
          for (let k = 0; k < 5; k++) {
            // each player's vibrato runs at its own speed, so the section does not wobble as one
            const hz = pitchAt(note, ev, t, num(p, 'glide'), { depth, rate: 4.8 + 0.3 * k, delay: 0.3 }, cents[k]! / 100);
            const s = oscs[k]!.next(hz, rate);
            if (k < 2) a += s; else if (k > 2) b += s; else { a += 0.5 * s; b += 0.5 * s; }
          }
          l[i]! += env * hl.run(fl.run(a, cut, 0.6, rate).lp, 180, 0.7, rate).hp;
          r[i]! += env * hr.run(fr.run(b, cut, 0.6, rate).lp, 180, 0.7, rate).hp;
        }
      }
      return { l, r, hit: 0 };
    }
    case 'brass': {
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.02, rate);
      const l = new Float32Array(n);
      const bright = num(p, 'bright') * (0.5 + 0.5 * v);
      for (const note of ev.notes) {
        const o1 = new Osc('saw', R()), o2 = new Osc('saw', R());
        const f = new SVF();
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          // the lip scoops up into the note, and the tone opens as the note speaks
          const scoop = -0.35 * Math.exp(-t / 0.03);
          const hz = pitchAt(note, ev, t, num(p, 'glide'), vib(num(p, 'depth')), scoop);
          const open = Math.min(1, t / num(p, 'attack'));
          const cut = 200 + bright * (0.65 + 0.35 * open * Math.exp(-t / 0.25)) * open;
          const x = o1.next(hz * 1.003, rate) + o2.next(hz * 0.997, rate);
          l[i]! += v * 0.28 * f.run(x, cut, 0.8, rate).lp * adsr(t, ev.dur, num(p, 'attack') * 0.6, 0.2, 0.8, rel);
        }
      }
      return { l, hit: 0 };
    }
    case 'piano': {
      const n = len(ev.dur + num(p, 'release') + 0.05, rate);
      const l = new Float32Array(n);
      const B = num(p, 'inharmonic');
      const hf = new SVF();
      for (const note of ev.notes) {
        const f0 = hzOf(note);
        const t60 = num(p, 'decay') * Math.sqrt(261.6 / f0);
        const parts: { hz: number; amp: number; t60: number }[] = [];
        for (let k = 1; k <= 12; k++) {
          const hz = k * f0 * Math.sqrt(1 + B * k * k);
          if (hz > rate * 0.45) break;
          parts.push({ hz, amp: Math.pow(k, -1.2) * (k === 1 ? 1 : 0.35 + 0.65 * v), t60: t60 / (1 + 0.45 * (k - 1)) });
        }
        const norm = 0.3 / parts.reduce((s, q) => s + q.amp, 0);
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          let x = 0;
          for (const q of parts) x += q.amp * Math.sin(TAU * q.hz * t) * (0.65 * fall(t, q.t60 * 0.3) + 0.35 * fall(t, q.t60));
          // a second string a little sharp gives the slow beating of a real unison
          x += parts[0]!.amp * 0.5 * Math.sin(TAU * parts[0]!.hz * 1.0007 * t) * fall(t, parts[0]!.t60 * 0.5);
          const damper = t > ev.dur ? fall(t - ev.dur, num(p, 'release')) : 1;
          const hammer = t < 0.006 ? hf.run(noise(), 2500, 0.7, rate).lp * (1 - t / 0.006) * 0.4 : 0;
          l[i]! += v * (norm * x * damper + hammer) * Math.min(1, t / 0.001);
        }
      }
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'epiano': {
      const n = len(ev.dur + num(p, 'release') + 0.05, rate);
      const l = new Float32Array(n);
      for (const note of ev.notes) {
        const f0 = hzOf(note);
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          // two-operator FM: the index falls as the note sounds, so the bark of the attack mellows
          const index = num(p, 'bark') * v * fall(t, 1.2) + 0.25;
          let x = Math.sin(TAU * f0 * t + index * Math.sin(TAU * f0 * t));
          if (14 * f0 < rate * 0.45) x += 0.12 * v * Math.sin(TAU * 14 * f0 * t) * fall(t, 0.06);
          const damper = t > ev.dur ? fall(t - ev.dur, num(p, 'release')) : 1;
          l[i]! += 0.3 * v * x * fall(t, num(p, 'decay')) * damper * Math.min(1, t / 0.002);
        }
      }
      fadeTail(l, rate, 0.02);
      return { l, hit: 0 };
    }
    case 'flute': {
      // A waveguide flute after the model in Perry Cook's Synthesis ToolKit: a jet delay feeding a
      // cubic non-linearity into a bore delay, with breath noise. The bore is one period long.
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.05, rate);
      const l = new Float32Array(n);
      const note = ev.notes[0];
      if (note === undefined) return { l, hit: 0 };
      const size = Math.ceil(rate / hzOf(note - 13)) + 4;
      const bore = new Float32Array(size), jet = new Float32Array(size);
      let bw = 0, jw = 0, lp = 0, dcx = 0, dcy = 0, out = 0;
      const read = (buf: Float32Array, w: number, d: number) => {
        let rp = w - d; while (rp < 0) rp += size;
        const i0 = Math.floor(rp), fr = rp - i0;
        return buf[i0 % size]! * (1 - fr) + buf[(i0 + 1) % size]! * fr;
      };
      const pole = 0.7 - 0.1 * 22050 / rate;
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const hz = pitchAt(note, ev, t, num(p, 'glide'), vib(num(p, 'depth')));
        // the loop runs through the jet delay (0.32 of the bore) and the bore, so the bore is shortened to match
        const jr = num(p, 'jet');
        const boreLen = (rate / hz + 0.5) / (1 + jr);
        // the model speaks only in a narrow range of breath, so the strength sets the loudness, not the breath
        const breath = num(p, 'breath') * adsr(t, ev.dur, num(p, 'attack'), 0.1, 0.95, rel);
        const temp0 = read(bore, bw, boreLen);
        lp = (1 - pole) * -temp0 + pole * lp;
        const dc = lp - dcx + 0.995 * dcy; dcx = lp; dcy = dc;
        const pd = breath * (1 + num(p, 'noise') * noise()) - 0.5 * dc;
        jet[jw] = pd; jw = (jw + 1) % size;
        let x = read(jet, jw, boreLen * jr);
        x = Math.max(-1, Math.min(1, x * (x * x - 1)));
        bore[bw] = x + 0.5 * dc; bw = (bw + 1) % size;
        out = 0.3 * bore[(bw + size - 1) % size]!;
        l[i] = out * 1.5 * (0.3 + 0.7 * v);
      }
      fadeTail(l, rate, 0.03);
      return { l, hit: 0 };
    }
    case 'bell': {
      // `bar`: a tuned metal bar (glockenspiel, celesta), its overtones at 2.76, 5.40 and 8.93 of the note.
      // `church`: the partials of a cast bell, hum, prime, tierce, quint, with the nominal on the note.
      const ring = num(p, 'ring');
      const church = str(p, 'model') === 'church';
      const ratios = church ? [0.25, 0.5, 0.6, 0.75, 1, 1.5, 2] : [1, 2.756, 5.404, 8.933];
      const amps = church ? [0.45, 0.55, 0.45, 0.25, 1, 0.35, 0.2] : [1, 0.35, 0.12, 0.05];
      const durs = church ? [1, 0.8, 0.6, 0.5, 0.45, 0.3, 0.2] : [1, 0.35, 0.15, 0.08];
      const n = len(ring + 0.05, rate);
      const l = new Float32Array(n);
      const total = amps.reduce((a, b) => a + b, 0);
      for (const note of ev.notes) {
        const f0 = hzOf(note);
        for (let k = 0; k < ratios.length; k++) {
          const hz = ratios[k]! * f0 * (church && k === 1 ? 1.002 : 1);
          if (hz > rate * 0.45) continue;
          const a = (amps[k]! / total) * 0.8 * v, d = durs[k]! * ring;
          for (let i = 0; i < n; i++) { const t = i / rate; l[i]! += a * Math.sin(TAU * hz * t) * fall(t, d) * Math.min(1, t / 0.0015); }
        }
      }
      fadeTail(l, rate, 0.05);
      return { l, hit: 0 };
    }
    case 'zither': {
      // A plucked string (Karplus-Strong) whose delay follows the pitch, so the player can press a
      // note up after the pluck (`A4>B4`) and add the slow vibrato of a guzheng
      const ring = num(p, 'ring');
      const n = len(Math.min(ev.dur, ring) + ring, rate);
      const l = new Float32Array(n);
      for (const note of ev.notes) {
        const size = Math.ceil(rate / hzOf(note - 3)) + 4;
        const line = new Float32Array(size);
        const period0 = rate / hzOf(note);
        const pos = Math.max(2, Math.round(period0 * num(p, 'position')));
        const pre = new SVF();
        const burst = Array.from({ length: size }, () => noise());
        for (let i = 0; i < size; i++) {
          // plucking away from the end takes out the harmonics that have a node at that point
          const x = burst[i]! - (i >= pos ? burst[i - pos]! : 0);
          line[i] = pre.run(x, 1500 + 7000 * num(p, 'bright'), 0.7, rate).lp * 0.6;
        }
        const b1 = new SVF(), b2 = new SVF();
        let w = 0, prev = 0;
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const hz = pitchAt(note, ev, t, num(p, 'glide') || 0.18, { depth: num(p, 'depth'), rate: 5, delay: 0.35 });
          // the averaging of each pass delays by half a sample, so the line is that much shorter
          const period = rate / hz - 0.5;
          const keep = Math.pow(0.001, 1 / (hz * ring));
          let rp = w - period; while (rp < 0) rp += size;
          const i0 = Math.floor(rp), fr = rp - i0;
          const y = line[i0 % size]! * (1 - fr) + line[(i0 + 1) % size]! * fr;
          line[w] = keep * (0.5 * (y + prev));
          prev = y;
          w = (w + 1) % size;
          // a light body: two soft resonances of a wooden box
          const body = b1.run(y, 260, 1.5, rate).bp + b2.run(y, 620, 1.5, rate).bp;
          l[i]! += v * 1.2 * (y + 0.35 * body);
        }
      }
      fadeTail(l, rate, 0.03);
      return { l, hit: 0 };
    }
    case 'wobble': {
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.01, rate);
      const l = new Float32Array(n);
      const period = num(p, 'beats') * ev.spb;
      const lo = num(p, 'low'), hi = num(p, 'high');
      for (const note of ev.notes) {
        const o = new Osc('saw', R()), s = new Osc('square', R());
        const f = new SVF();
        for (let i = 0; i < n; i++) {
          const t = i / rate;
          const hz = pitchAt(note, ev, t, num(p, 'glide'));
          const lfo = 0.5 - 0.5 * Math.cos((TAU * t) / period);
          const cut = lo * Math.pow(hi / lo, lfo);
          const x = f.run(o.next(hz, rate) + 0.6 * s.next(hz * 0.5, rate), cut, num(p, 'q'), rate).lp;
          l[i]! += v * 0.5 * Math.tanh(1.6 * x) * adsr(t, ev.dur, 0.004, 0.05, 0.9, rel);
        }
      }
      return { l, hit: 0 };
    }
    case 'chip': {
      // An 8-bit pulse voice: a pulse of a chosen width, a volume that steps in sixteen levels,
      // and a chord played as a fast arpeggio, as a sound chip with one voice would
      const rel = num(p, 'release');
      const n = len(ev.dur + rel + 0.005, rate);
      const l = new Float32Array(n);
      const duty = num(p, 'duty'), step = num(p, 'arp');
      let ph = R();
      for (let i = 0; i < n; i++) {
        const t = i / rate;
        const note = ev.notes.length > 1 ? ev.notes[Math.floor(t / step) % ev.notes.length]! : ev.notes[0] ?? 69;
        const hz = pitchAt(note, { ...ev, notes: [note] }, t, num(p, 'glide'));
        const dt = hz / rate;
        let x = 2 * ph - 1 - blep(ph, dt);
        const q = (ph + 1 - duty) % 1;
        x -= 2 * q - 1 - blep(q, dt);
        ph += dt; if (ph >= 1) ph -= 1;
        const env = Math.round(adsr(t, ev.dur, 0.002, num(p, 'decay'), num(p, 'sustain'), rel) * 15) / 15;
        l[i] = v * 0.25 * x * env;
      }
      fadeTail(l, rate, 0.003);
      return { l, hit: 0 };
    }
  }
  return undefined;
}

export const ORCHESTRA_DEFAULTS: Record<string, Params> = {
  strings: { detune: 9, cutoff: 2800, attack: 0.25, release: 0.5, depth: 0.08, glide: 0 },
  brass: { bright: 2600, attack: 0.07, release: 0.15, depth: 0.05, glide: 0 },
  piano: { decay: 5, release: 0.3, inharmonic: 0.0004 },
  epiano: { bark: 2.2, decay: 3, release: 0.25 },
  flute: { breath: 0.9, jet: 0.5, noise: 0.08, attack: 0.08, release: 0.12, depth: 0.12, glide: 0 },
  bell: { model: 'bar', ring: 2.5 },
  zither: { ring: 3, bright: 0.7, position: 0.13, depth: 0.12, glide: 0.18 },
  wobble: { beats: 0.5, low: 110, high: 2400, q: 3, release: 0.05, glide: 0 },
  chip: { duty: 0.25, arp: 0.033, decay: 0.12, sustain: 0.6, release: 0.03, glide: 0 },
};
export const ORCHESTRA_TYPES = Object.keys(ORCHESTRA_DEFAULTS);
