// Shared kit: a 2D rig for characters. A character is a tree of parts, each turning about its own
// pivot; a pose is data (a turn, an offset and a scale per part, and free channels such as a blink
// or a mouth); the pose at a moment is worked out from keyed poses, the same way the camera's is
// (kit-camera.ts). Read-only for scene authors; the character's own file adds the parts and poses.
//
// Everything is a pure function of its arguments: the same time always gives the same pose. Time
// is whatever the keys are written in, beats of the scene clock unless a helper says otherwise.
// Conventions: y down, angles in radians, a positive turn is clockwise on screen, and a limb at
// rest hangs straight down from its pivot.
import { clamp, hash, lerp, mod, noise1, springStep } from '../../engine/util';
import { poseAt, type Key } from './kit-camera';

type Ctx = CanvasRenderingContext2D;
type Ease = (t: number) => number;

// ---- poses ----------------------------------------------------------------------------------------

/** How one part sits: turn about its pivot, offset of the pivot (px of the parent), scale. A field left out is at rest. */
export interface PartPose { r?: number; x?: number; y?: number; sx?: number; sy?: number }

/** A whole pose: parts by id, and free channels (blink, mouth, brow, look) as numbers. */
export interface Pose { parts?: Record<string, PartPose>; ch?: Record<string, number> }

const REST: Required<PartPose> = { r: 0, x: 0, y: 0, sx: 1, sy: 1 };
const full = (p?: PartPose): Required<PartPose> => ({ ...REST, ...p });

/**
 * Between two poses. A part or a channel that `b` leaves out stays as `a` has it, so a key may name
 * only what it changes. `k` may pass 1 (a spring or a back ease overshoots): every field follows it.
 */
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const parts: Record<string, PartPose> = {};
  for (const id of new Set([...Object.keys(a.parts ?? {}), ...Object.keys(b.parts ?? {})])) {
    const p = full(a.parts?.[id]), q = full({ ...a.parts?.[id], ...b.parts?.[id] });
    parts[id] = { r: lerp(p.r, q.r, k), x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), sx: lerp(p.sx, q.sx, k), sy: lerp(p.sy, q.sy, k) };
  }
  const ch: Record<string, number> = {};
  for (const id of new Set([...Object.keys(a.ch ?? {}), ...Object.keys(b.ch ?? {})])) {
    const v = a.ch?.[id] ?? 0;
    ch[id] = lerp(v, b.ch?.[id] ?? v, k);
  }
  return { parts, ch };
}

/**
 * Layers added on top of a pose: turns, offsets and channels add up, scales multiply. For the life
 * that runs under the acting: breathing, a sway, a look, a blink.
 */
export function addPose(base: Pose, ...layers: Pose[]): Pose {
  const parts: Record<string, PartPose> = {};
  for (const [id, p] of Object.entries(base.parts ?? {})) parts[id] = full(p);
  const ch: Record<string, number> = { ...(base.ch ?? {}) };
  for (const l of layers) {
    for (const [id, d] of Object.entries(l.parts ?? {})) {
      const p = full(parts[id]);
      parts[id] = { r: p.r + (d.r ?? 0), x: p.x + (d.x ?? 0), y: p.y + (d.y ?? 0), sx: p.sx * (d.sx ?? 1), sy: p.sy * (d.sy ?? 1) };
    }
    for (const [id, v] of Object.entries(l.ch ?? {})) ch[id] = (ch[id] ?? 0) + v;
  }
  return { parts, ch };
}

/** A key of a performance: the pose to reach, the beat the move starts on, how long it takes, its ease. */
export type PoseKey = Key<Pose>;

/**
 * The pose at `t`, from keys in order. Each key is a move from wherever the body is to the key's
 * pose; `over: 0` snaps. The default ease leaves at once and settles (outExpo), as the camera does.
 * A key held for a while is simply the next key starting later: the hold is the gap between them.
 */
export const rigAt = (t: number, keys: PoseKey[]): Pose => poseAt(t, keys, mixPose);

/**
 * A spring as the ease of a key: overshoots and settles, like a body with weight arriving.
 * `over` must be the key's own `over`; `freq` is in swings per unit of time of the keys (per beat).
 */
export const springEase = (over: number, freq = 2.5, damping = 0.45): Ease => (u) => springStep(u * over, freq, damping);

/**
 * A cycle: the keys cover one loop from 0 to `period` and are played round and round. For a
 * seamless loop the last key's pose must equal the first. Walks, runs, idles, a flag, a flame.
 */
export const loopAt = (t: number, period: number, keys: PoseKey[]): Pose => rigAt(mod(t, period), keys);

// ---- life under the acting -----------------------------------------------------------------------

/** Squash (amount < 0) or stretch (amount > 0) along y that keeps the area: sx * sy = 1. */
export const squash = (amount: number): PartPose => ({ sy: 1 + amount, sx: 1 / (1 + amount) });

/** Seeded drift in -amount..amount, `rate` wanders per unit of time. Idle life: a sway, a look, a breath. */
export const wander = (t: number, amount: number, rate = 0.5, seed = 0) => amount * noise1(t * rate, seed);

/**
 * How closed the eyes are, 0 to 1, from a seeded schedule: one blink somewhere in each slot of
 * `every`, lasting `dur`. Pass seconds (f.t) with every 3.2 and dur 0.16 for eyes that blink off the
 * beat, as eyes do; pass beats to blink on the music. Give each character its own seed.
 */
export function blink(t: number, seed = 0, every = 3.2, dur = 0.16) {
  const slot = Math.floor(t / every);
  const start = slot * every + hash(slot, seed, 5) * (every - dur);
  const u = (t - start) / dur;
  return u < 0 || u > 1 ? 0 : 1 - Math.abs(2 * u - 1);
}

// ---- the rig -------------------------------------------------------------------------------------

export interface Part {
  id: string;
  /** The part this one hangs from. Parents come before their children in the list. */
  parent?: string;
  /** The pivot at rest, in the parent's space (for a root, in the character's space). */
  at: [number, number];
  /** Drawing order: larger is in front. Default: the order of the list. */
  z?: number;
  /**
   * Beats this part trails the body by: overlap and follow-through (hair, ears, a tail, a scarf).
   * The part takes its own keyed pose from that much earlier, and, when it has a `tip`, also turns
   * to trail behind the way its pivot moved over that time.
   */
  lag?: number;
  /** The point of the part that trails (its free end), in its own space. With `lag`, it swings. */
  tip?: [number, number];
  /** How strongly the tip swings back against the motion. Default 1. */
  drag?: number;
  /** Draws the part in its own space: pivot at (0, 0), y down, rest pose. */
  draw?: (c: Ctx, s: PartState) => void;
}

/** What a part's drawing may read: its own pose, the pose's channels, and the time asked for. */
export interface PartState { pose: Required<PartPose>; ch: Record<string, number>; t: number }

/** An affine transform as a Canvas2D takes it: x' = a x + c y + e, y' = b x + d y + f. */
export type Mat = [number, number, number, number, number, number];
const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const ID: Mat = [1, 0, 0, 1, 0, 0];

/** Where and how large a character stands on the layer. `flip` mirrors it to face the other way. */
export interface Place { x: number; y: number; scale?: number; flip?: boolean }

export class Rig {
  private order: Part[];
  private byId = new Map<string, Part>();

  constructor(public parts: Part[]) {
    parts.forEach((p) => {
      if (p.parent && !this.byId.has(p.parent)) throw new Error(`rig: part '${p.id}' comes before its parent '${p.parent}'`);
      this.byId.set(p.id, p);
    });
    this.order = parts.map((p, i) => ({ p, z: p.z ?? i, i })).sort((a, b) => a.z - b.z || a.i - b.i).map((e) => e.p);
  }

  /**
   * The pose at `t`, from keys or from a function of time (a walk worked out by hand, keys mixed
   * with a cycle). Each part with a `lag` takes its own pose from that much earlier, so that what
   * hangs arrives after the body; one with a `tip` also swings back against the motion of its
   * pivot over the lag. Channels are taken at `t`.
   */
  pose(t: number, src: PoseKey[] | ((t: number) => Pose)): Pose {
    const at = typeof src === 'function' ? src : (u: number) => rigAt(u, src);
    const now = at(t);
    const parts: Record<string, PartPose> = { ...(now.parts ?? {}) };
    let solvedNow: Map<string, Mat> | null = null;
    for (const p of this.parts) {
      if (!p.lag) continue;
      const before = at(t - p.lag);
      const q = before.parts?.[p.id];
      if (q) parts[p.id] = q; else delete parts[p.id];
      if (!p.tip) continue;
      // where the pivot is now and where it was, in the character's space
      solvedNow ??= this.solve(now);
      const pivot = (m: Map<string, Mat>) => this.pivotOf(p, m);
      const [ax, ay] = pivot(solvedNow), [bx, by] = pivot(this.solve(before));
      const m = solvedNow.get(p.id)!;
      const dx = m[0] * p.tip[0] + m[2] * p.tip[1], dy = m[1] * p.tip[0] + m[3] * p.tip[1];
      const L2 = dx * dx + dy * dy || 1;
      const swing = clamp(((p.drag ?? 1) * (dy * (ax - bx) - dx * (ay - by))) / L2, -1.2, 1.2);
      parts[p.id] = { ...parts[p.id], r: (parts[p.id]?.r ?? 0) + swing };
    }
    return { parts, ch: now.ch ?? {} };
  }

  private pivotOf(p: Part, m: Map<string, Mat>): [number, number] {
    const pm = p.parent ? m.get(p.parent)! : ID;
    return [pm[0] * p.at[0] + pm[2] * p.at[1] + pm[4], pm[1] * p.at[0] + pm[3] * p.at[1] + pm[5]];
  }

  /** The transform of every part, in the character's space. */
  solve(pose: Pose): Map<string, Mat> {
    const out = new Map<string, Mat>();
    for (const p of this.parts) {
      const q = full(pose.parts?.[p.id]);
      const cs = Math.cos(q.r), sn = Math.sin(q.r);
      const local: Mat = [cs * q.sx, sn * q.sx, -sn * q.sy, cs * q.sy, p.at[0] + q.x, p.at[1] + q.y];
      out.set(p.id, mul(p.parent ? out.get(p.parent)! : ID, local));
    }
    return out;
  }

  /** A point given in a part's own space, in the character's space: to plant a foot, hold a prop, aim the eyes. */
  point(pose: Pose, id: string, x = 0, y = 0, solved = this.solve(pose)): [number, number] {
    const m = solved.get(id);
    if (!m) throw new Error(`rig: no part '${id}'`);
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  /**
   * How far to move the character down (positive) or up so that the lowest of the given points
   * touches `groundY` (in the character's space). Pass the soles: [part, x, y] in each foot's space.
   * Feet that float or sink are the most common fault of a drawn character; this removes it.
   */
  plant(pose: Pose, soles: [string, number, number][], groundY = 0): number {
    const solved = this.solve(pose);
    const lowest = Math.max(...soles.map(([id, x, y]) => this.point(pose, id, x, y, solved)[1]));
    return groundY - lowest;
  }

  /** Draws the character onto a 2D context, parts in their z order. The context's own transform (a camera) is kept. */
  draw(c: Ctx, pose: Pose, place: Place, t = 0) {
    const solved = this.solve(pose);
    const s = place.scale ?? 1;
    c.save();
    c.translate(place.x, place.y);
    c.scale(place.flip ? -s : s, s);
    for (const p of this.order) {
      if (!p.draw) continue;
      const m = solved.get(p.id)!;
      c.save();
      c.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      p.draw(c, { pose: full(pose.parts?.[p.id]), ch: pose.ch ?? {}, t });
      c.restore();
    }
    c.restore();
  }
}

// ---- reaching --------------------------------------------------------------------------------------

/**
 * Two bones reaching for a point: a leg to a foot planted on the ground, an arm to a handle.
 * From the pivot of the upper bone (ax, ay) to the target (tx, ty), both in one space, with bone
 * lengths l1 and l2. Returns `upper`, the turn of the upper bone from hanging straight down, and
 * `lower`, the turn of the lower bone relative to the upper. `bend` picks the side the joint points
 * to: with the target below the pivot, 1 puts it on the left (-x) and -1 on the right, so the knees
 * of a character facing right take -1. A target out of reach is met by the straight limb pointing
 * at it. Subtract the parent's own turn from `upper` when the limb hangs from a turned body.
 */
export function reach(ax: number, ay: number, tx: number, ty: number, l1: number, l2: number, bend = 1) {
  const dx = tx - ax, dy = ty - ay;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-6, l1 + l2 - 1e-6);
  const base = Math.atan2(-dx, dy);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const B = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  return { upper: base + bend * A, lower: -bend * (Math.PI - B) };
}
