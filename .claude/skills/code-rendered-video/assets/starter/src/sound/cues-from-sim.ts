// Sound that comes from the picture: an example of a simulation whose events become cues.
//
// The simulation is one pure function, run the same way by the shot that draws it and by the score
// that sounds it, so every contact the viewer sees has its sound at the same moment. Here a ball
// is dropped and bounces; each contact becomes a bell whose strength follows the speed of the ball
// and whose note climbs a scale, as in "a machine where every note comes from a visible collision".
//
// A shot uses it like this (the simulation is integrated once, in init()):
//   private sim = simulateBall(START);                    // in the scene class
//   const y = ballAt(this.sim, f.t);                      // in render(): the height at song time
// The score names the module:  "cueModules": ["src/sound/cues-from-sim.ts"]
//
// No DOM and no Node imports, no clock, no unseeded random: the same inputs give the same contacts.
import type { CueContext, CueSpec } from './score';

/** Integration step, in seconds. A fixed step keeps the result the same at any frame rate. */
const STEP = 1 / 480;

export interface BallSim {
  /** Song time of the first sample, and one height (px above the floor) every STEP seconds. */
  t0: number;
  y: Float32Array;
  /** Song time and speed (px/s) of every contact with the floor. */
  contacts: { t: number; speed: number }[];
}

/** A ball dropped from `height` px at song time `t0`, falling under `gravity`, keeping `bounce` of its speed at each contact. */
export function simulateBall(t0: number, height = 900, gravity = 2600, bounce = 0.72, secs = 4): BallSim {
  const n = Math.ceil(secs / STEP);
  const y = new Float32Array(n);
  const contacts: BallSim['contacts'] = [];
  let pos = height, vel = 0;
  for (let i = 0; i < n; i++) {
    y[i] = pos;
    vel -= gravity * STEP;
    pos += vel * STEP;
    if (pos <= 0) {
      // the contact happened part way through the step: find when, so the sound lands on it exactly
      const back = pos / vel;
      const speed = Math.abs(vel);
      contacts.push({ t: t0 + (i + 1) * STEP - back, speed });
      pos = -pos * bounce;
      vel = speed * bounce;
      if (speed * bounce < 40) { vel = 0; pos = 0; }
    }
  }
  return { t0, y, contacts };
}

/** The ball's height at song time t, for the shot. */
export function ballAt(sim: BallSim, t: number): number {
  const x = (t - sim.t0) / STEP;
  if (x <= 0) return sim.y[0]!;
  const i = Math.floor(x);
  if (i >= sim.y.length - 1) return sim.y[sim.y.length - 1]!;
  return sim.y[i]! + (sim.y[i + 1]! - sim.y[i]!) * (x - i);
}

/** Where the example drops its ball: the downbeat of bar 2. */
export const START_BEAT = 8;
const SCALE = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];

/** The cues of the example: one bell for each contact, louder for a faster ball. */
export function cues(ctx: CueContext): CueSpec[] {
  const sim = simulateBall(ctx.timeOfBeat(START_BEAT));
  const top = sim.contacts[0]?.speed ?? 1;
  return sim.contacts.map((c, i) => ({
    at: { t: c.t },
    sound: 'bell',
    note: SCALE[Math.min(i, SCALE.length - 1)],
    vel: Math.max(0.15, c.speed / top),
    why: `contact ${i + 1} of the ball with the floor`,
  }));
}
