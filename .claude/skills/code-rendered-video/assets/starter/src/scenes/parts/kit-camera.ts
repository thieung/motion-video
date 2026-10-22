// Shared kit: the camera. A camera here is data: a pose, worked out from the time and nothing
// else. A shot writes its poses down, names them, and blends between them with the moves below.
// Read-only for scene authors.
//
// Two kinds of camera:
//   Cam   (kit-frame.ts)  over a flat world: centre, zoom, roll. For drawings, type, interfaces.
//   Cam3  (this file)     in space: position, target, field of view, roll. For models, for line
//                         drawings in perspective, and for shaders that march rays.
//
// A move is a number, or a small change to a pose, that a shot adds to its own camera. Moves are
// timed in beats of the scene clock (kit-frame.ts), so they land on the music. Everything is a
// pure function of its arguments: the same beat always gives the same pose.
import * as THREE from 'three';
import { W, H } from '../../engine/gl';
import { clamp, ease, hash, lerp, springStep } from '../../engine/util';
import { camMix, toScreen, type Cam, type Rect } from './kit-frame';

type Ease = (t: number) => number;

// ---- poses in time -------------------------------------------------------------------------------

/** A pose to be at, and how to get there: the move starts at beat `at` and takes `over` beats. */
export interface Key<P> { at: number; pose: P; over?: number; ease?: Ease }

/**
 * The pose at `beats`, from a list of keys in order. Each key is a move from wherever the camera
 * is to the key's pose. `over: 0` is a cut. Moves ease out hard by default: the camera leaves at
 * once and settles, which reads as decided. A drift is a key with a long `over` and a linear ease.
 */
export function poseAt<P>(beats: number, keys: Key<P>[], mix: (a: P, b: P, k: number) => P): P {
  let pose = keys[0]!.pose;
  for (const k of keys) {
    if (beats < k.at) break;
    const over = k.over ?? 0;
    pose = over <= 0 ? k.pose : mix(pose, k.pose, (k.ease ?? ease.outExpo)(clamp((beats - k.at) / over)));
  }
  return pose;
}

/** poseAt for the flat camera. */
export const camAt = (beats: number, keys: Key<Cam>[]) => poseAt(beats, keys, camMix);

// ---- moves ---------------------------------------------------------------------------------------

/**
 * Punch in: the zoom jumps by `amount` on beat `at` and settles back with a bounce.
 * Multiply the camera's zoom by the result.
 */
export const punch = (beats: number, at: number, amount = 0.08, halfLife = 0.3) =>
  beats < at ? 1 : 1 + amount * Math.pow(0.5, (beats - at) / halfLife) * Math.cos((beats - at) * 5);

/**
 * A small push on every beat (or every `every` beats, from `offset`), for a camera that should
 * breathe with the kick. Multiply the zoom by the result. Keep `amount` under 0.03.
 */
export function pushOnBeat(beats: number, amount = 0.015, every = 1, offset = 0, halfLife = 0.22) {
  const x = (beats - offset) / every;
  return x < 0 ? 1 : 1 + amount * Math.pow(0.5, ((x - Math.floor(x)) * every) / halfLife);
}

/**
 * Step in: from 0 to 1 on beat `at`, overshooting and settling like something that has weight.
 * For a camera (or a thing) that takes up a new place on the beat.
 */
export const stepIn = (seconds: number, freq = 3.2, damping = 0.5) => springStep(seconds, freq, damping);

/**
 * Anticipation: before beat `at` the value leans `lean` of the way backwards, then the move
 * itself runs over `over` beats. Returns -lean..1. A move that winds up first hits harder.
 */
export function windUp(beats: number, at: number, over: number, lean = 0.08, lead = 0.5, fn: Ease = ease.outExpo) {
  if (beats < at - lead) return 0;
  if (beats < at) return -lean * ease.inOutQuad((beats - (at - lead)) / lead);
  return lerp(-lean, 1, fn(clamp((beats - at) / over)));
}

/**
 * A whip: 0 to 1 over `over` beats from `at`, slow at both ends and very fast in the middle.
 * `streak` is how fast it is moving, 0..1, for smearing what is on screen along the way.
 */
export function whip(beats: number, at: number, over = 0.75) {
  const u = clamp((beats - at) / over);
  return { k: ease.inOutExpo(u), streak: Math.pow(Math.sin(Math.PI * u), 3) };
}

/**
 * Roll in steps: the frame tilts to the next angle on each beat listed, caught by a spring.
 * `steps` are [beat, angle in radians], in order. Needs seconds per beat for the spring.
 */
export function rollSteps(beats: number, steps: [number, number][], secondsPerBeat: number, start = 0) {
  let angle = start;
  for (const [at, to] of steps) {
    if (beats < at) break;
    angle = lerp(angle, to, clamp(springStep((beats - at) * secondsPerBeat, 3.4, 0.45), 0, 1.25));
  }
  return angle;
}

/**
 * Shake after an impact on beat `at`: an offset in px that dies away. The same for every
 * motion-blur sample of a frame (pass the frame number), so the frame is displaced, not smeared.
 */
export function shake(beats: number, at: number, amp = 14, frame = 0, halfLife = 0.18, seed = 0): [number, number] {
  if (beats < at) return [0, 0];
  const a = amp * Math.pow(0.5, (beats - at) / halfLife);
  return a < 0.3 ? [0, 0] : [a * (hash(frame, seed, 1) - 0.5) * 2, a * (hash(frame, seed, 2) - 0.5) * 2];
}

/** Adds the shakes of several impacts. */
export function shakes(beats: number, hits: number[], amp = 14, frame = 0, halfLife = 0.18): [number, number] {
  let x = 0, y = 0;
  hits.forEach((at, i) => { const s = shake(beats, at, amp, frame, halfLife, i); x += s[0]; y += s[1]; });
  return [x, y];
}

/**
 * Follow: the camera trails a moving point. `at(beats)` says where the subject is; the camera is
 * where the subject was `lag` beats ago, which keeps the subject a little ahead of centre.
 */
export const follow = (beats: number, at: (b: number) => { x: number; y: number }, lag = 0.35) => at(Math.max(0, beats - lag));

// ---- the flat camera on a Canvas2D layer ---------------------------------------------------------

/**
 * Sets a 2D context to draw in the camera's world: after this, world coordinates land where the
 * camera sees them. Call inside save()/restore(). `offset` is a shake, in screen px.
 */
export function applyCam(c: CanvasRenderingContext2D, cam: Cam, offset: [number, number] = [0, 0]) {
  c.translate(W / 2 + offset[0], H / 2 + offset[1]);
  if (cam.roll) c.rotate(cam.roll);
  c.scale(cam.zoom, cam.zoom);
  c.translate(-cam.x, -cam.y);
}

// ---- a journey across scales ---------------------------------------------------------------------

/**
 * One world of a zoom across scales (desk, case, chip, ... atom), drawn in units of its own so that
 * its numbers stay near 1 whatever the scale. `size` is log10 of the metres one of its units is;
 * it is drawn while the view is between `from` and `to`, given as log10 of the metres the frame's
 * height covers, and fades in and out over `fade` of those decades at either end. Every world is
 * drawn with the point the journey travels towards at its origin.
 */
export interface ScaleWorld { size: number; from: number; to: number; fade?: number }

/**
 * The flat camera for one world at view `m` (log10 of the metres the frame's height covers), and
 * its opacity; null while the world is not drawn. Work `m` out from the beats with `keys` of
 * util.ts and a linear ease, so that each beat travels the same number of decades.
 */
export function scaleCam(m: number, w: ScaleWorld): { cam: Cam; alpha: number } | null {
  const lo = Math.min(w.from, w.to), hi = Math.max(w.from, w.to), fade = w.fade ?? 0.3;
  if (m < lo || m > hi) return null;
  const alpha = fade > 0 ? clamp(Math.min((m - lo) / fade, (hi - m) / fade)) : 1;
  // px per unit: the frame's height in px over its height in units of this world
  return { cam: { x: 0, y: 0, zoom: H * Math.pow(10, w.size - m) }, alpha };
}

// ---- the camera in space -------------------------------------------------------------------------

export type V3 = [number, number, number];
/** Position, the point looked at, vertical field of view in degrees, and roll in radians. */
export interface Cam3 { pos: V3; target: V3; fov: number; roll?: number }

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Between two cameras in space. The field of view is mixed by focal length, which is what the eye follows. */
export function cam3Mix(a: Cam3, b: Cam3, k: number): Cam3 {
  const f = (fov: number) => 1 / Math.tan((fov * Math.PI) / 360);
  const focal = lerp(f(a.fov), f(b.fov), k);
  return { pos: mix3(a.pos, b.pos, k), target: mix3(a.target, b.target, k), fov: (Math.atan(1 / focal) * 360) / Math.PI, roll: lerp(a.roll ?? 0, b.roll ?? 0, k) };
}

/** poseAt for the camera in space. */
export const cam3At = (beats: number, keys: Key<Cam3>[]) => poseAt(beats, keys, cam3Mix);

/**
 * An orbit: the camera on a circle round `target`, at `angle` (radians, 0 = in front, on +z),
 * `radius` away and `height` above it.
 */
export const orbit = (target: V3, angle: number, radius: number, height = 0, fov = 35, roll = 0): Cam3 =>
  ({ pos: [target[0] + Math.sin(angle) * radius, target[1] + height, target[2] + Math.cos(angle) * radius], target, fov, roll });

export interface View3 {
  pos: V3;
  /** Right, up and forward, each of length one. */
  R: V3; U: V3; F: V3;
  /** Focal length in px: a point one unit to the side, `z` units ahead, lands focal / z px from the centre. */
  focal: number;
  /** World point to screen px (y down). `z` is the distance ahead; a point with z <= 0 is behind the camera. */
  project(p: V3): { x: number; y: number; z: number };
}

/** The camera's axes and its projection, for drawing in perspective with lines or on a 2D layer. */
export function view3(c: Cam3): View3 {
  const F = norm(sub(c.target, c.pos));
  // (looking straight up or down leaves no horizon to stand on: fall back to +z)
  let R = norm(cross(F, Math.abs(F[1]) > 0.999 ? [0, 0, -1] : [0, 1, 0]));
  let U = cross(R, F);
  if (c.roll) {
    const cs = Math.cos(c.roll), sn = Math.sin(c.roll);
    [R, U] = [[R[0] * cs + U[0] * sn, R[1] * cs + U[1] * sn, R[2] * cs + U[2] * sn], [U[0] * cs - R[0] * sn, U[1] * cs - R[1] * sn, U[2] * cs - R[2] * sn]];
  }
  const focal = H / 2 / Math.tan((c.fov * Math.PI) / 360);
  return {
    pos: c.pos, R, U, F, focal,
    project(p) {
      const q = sub(p, c.pos), z = dot(q, F);
      const k = focal / Math.max(z, 1e-4);
      return { x: W / 2 + dot(q, R) * k, y: H / 2 - dot(q, U) * k, z };
    },
  };
}

/** Puts a three.js camera where the pose says. The camera's aspect must be W / H. */
export function setThreeCamera(cam: THREE.PerspectiveCamera, c: Cam3) {
  const v = view3(c);
  cam.fov = c.fov;
  cam.aspect = W / H;
  cam.position.set(...c.pos);
  cam.up.set(...v.U);
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

// ---- is it in the frame? -------------------------------------------------------------------------

const _v = new THREE.Vector3();

/**
 * Where a world point lands on the screen, in px (y down), through any of the three cameras: the
 * flat Cam (a point [x, y]), Cam3, or a three.js camera (whose matrices must be up to date, as
 * setThreeCamera leaves them). `visible` is false for a point behind the camera, or for a three.js
 * camera outside its near and far planes.
 */
export function screenPoint(cam: Cam | Cam3 | THREE.Camera, p: readonly number[]): { x: number; y: number; visible: boolean } {
  if ((cam as THREE.Camera).isCamera) {
    _v.set(p[0]!, p[1]!, p[2] ?? 0).project(cam as THREE.Camera);
    return { x: ((_v.x + 1) / 2) * W, y: ((1 - _v.y) / 2) * H, visible: _v.z >= -1 && _v.z <= 1 };
  }
  if ('pos' in cam) {
    const q = view3(cam).project([p[0]!, p[1]!, p[2] ?? 0]);
    return { x: q.x, y: q.y, visible: q.z > 0 };
  }
  return { ...toScreen(cam as Cam, p[0]!, p[1]!), visible: true };
}

/**
 * Whether a world point is inside the frame as the camera sees it. `margin` in px keeps the point
 * that far inside the edge (negative lets it sit outside); `within` tests against a screen
 * rectangle instead of the whole frame (SAFE, STAGE). For a check over time, work the camera out
 * at each time the way the shot does (camAt, cam3At) and test every point: for example that every
 * strike of a shot lands on screen, at the frame it lands.
 */
export function inFrame(cam: Cam | Cam3 | THREE.Camera, p: readonly number[], margin = 0, within?: Rect): boolean {
  const s = screenPoint(cam, p);
  const r = within ?? { x0: 0, y0: 0, x1: W, y1: H };
  return s.visible && s.x >= r.x0 + margin && s.x <= r.x1 - margin && s.y >= r.y0 + margin && s.y <= r.y1 - margin;
}

/**
 * Uniforms for a shader that marches rays, and the GLSL that turns a pixel into a ray.
 * In the shader: `vec3 ro = camPos; vec3 rd = camRay(FRAG_PX);`
 */
export const RAY_GLSL = /* glsl */ `
uniform vec3 camPos; uniform vec3 camR; uniform vec3 camU; uniform vec3 camF; uniform float camFocal; uniform vec2 camRes;
vec3 camRay(vec2 px) {
  vec2 p = px - 0.5 * camRes;
  return normalize(camR * p.x + camU * p.y + camF * camFocal);
}`;
export const rayUniforms = () => ({
  camPos: { value: new THREE.Vector3() }, camR: { value: new THREE.Vector3() }, camU: { value: new THREE.Vector3() },
  camF: { value: new THREE.Vector3() }, camFocal: { value: 1 }, camRes: { value: new THREE.Vector2(W, H) },
});
export function setRayUniforms(u: ReturnType<typeof rayUniforms>, c: Cam3) {
  const v = view3(c);
  u.camPos.value.set(...v.pos);
  u.camR.value.set(...v.R);
  u.camU.value.set(...v.U);
  u.camF.value.set(...v.F);
  u.camFocal.value = v.focal;
}
