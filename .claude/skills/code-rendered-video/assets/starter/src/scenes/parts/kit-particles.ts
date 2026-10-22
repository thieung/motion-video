// Shared kit: particles. Bursts and streams of many small things, each one a pure function of the
// time since it was born: no list is kept from frame to frame, nothing is integrated, and the same
// time always gives the same picture. Read-only for scene authors.
//
// How it works. A particle is an index. Everything about it (where it is born, when, how fast, in
// which direction, how long it lives, its size, its spin, which colour) is drawn from hash(seed,
// index, k). Its path is a closed form: launched with a velocity, pulled by gravity, slowed by drag
// that is proportional to its speed. A burst releases `count` particles at once (or over `spread`
// seconds); a stream releases `rate` particles a second. At any time only the particles that are
// alive are returned. The capacity is known in advance: `count` for a burst, `streamCapacity(spec)`
// for a stream; size a LineBatch for it.
//
// Time is in SECONDS since the burst or since the stream began, because the physics is in px and
// seconds. Put the burst on a beat with `since(audio, f, beat)` of kit-frame.ts.
//
// Units: px of the frame (y down), seconds, radians (0 = to the right, PI / 2 = down).
//
// The recipes below draw on a Canvas2D context (a Layer2D) or into a LineBatch. Things that should
// glow are drawn on a layer of their own and composited with mode 'add' and a tint above 1, so that
// their cores cross the bloom threshold (`comp.draw(renderer, tex, out, { mode: 'add', tint: [1.3, 1.3, 1.3] })`).
import { clamp, ease, hash, lerp, noise2, TAU } from '../../engine/util';
import { rgba } from '../../engine/palette';
import type { LineBatch } from '../../engine/lines';
import { W, H } from '../../engine/gl';

type Ctx = CanvasRenderingContext2D;
/** A number, or a range [min, max] each particle draws its own value from. */
export type Range = number | [number, number];
const pick = (r: Range, u: number) => (typeof r === 'number' ? r : lerp(r[0], r[1], u));
const hi = (r: Range) => (typeof r === 'number' ? r : Math.max(r[0], r[1]));

// ---- one particle ---------------------------------------------------------------------------------

export interface Emit {
  seed: number;
  /** Where particles are born (px). */
  at: [number, number];
  /** Born anywhere in a disc of this radius round `at` (px). Default 0. */
  radius?: Range;
  /** Direction of launch (radians) and the half-width of the cone round it. Default: every direction. */
  angle?: number;
  cone?: number;
  /** Launch speed (px/s). */
  speed: Range;
  /** Life (s). */
  life: Range;
  /** Size (px): what it means is up to the drawing. Default 4. */
  size?: Range;
  /** Spin (rad/s), either way. Default 0. */
  spin?: Range;
  /** Constant acceleration (px/s²). [0, 900] falls, [0, -300] rises like heat. Default none. */
  gravity?: [number, number];
  /** Drag (1/s): the speed halves every ln 2 / drag seconds. Default 0. */
  drag?: number;
  /** Drift by value noise (px at the end of life) and its scale (px per noise cell). Default none. */
  turbulence?: number;
  turbScale?: number;
}

export interface Particle {
  /** Index within its burst or stream: the same particle has the same index on every frame. */
  i: number;
  x: number; y: number;
  /** Velocity (px/s). */
  vx: number; vy: number;
  /** Seconds since it was born, its life, and age / life (0..1). */
  age: number; life: number; k: number;
  size: number;
  /** Turned by this much (radians) since birth, plus a random start. */
  angle: number;
  /** Two random numbers of its own in [0, 1), for choosing a colour or a shape. */
  r1: number; r2: number;
}

/**
 * Where a thing launched from (x0, y0) with velocity (vx, vy) is after `a` seconds, under gravity
 * (gx, gy) and linear drag `k`. Closed form: v(a) = g/k + (v0 - g/k) e^(-ka).
 */
export function flightAt(x0: number, y0: number, vx: number, vy: number, gx: number, gy: number, k: number, a: number) {
  if (k < 1e-6) return { x: x0 + vx * a + 0.5 * gx * a * a, y: y0 + vy * a + 0.5 * gy * a * a, vx: vx + gx * a, vy: vy + gy * a };
  const e = Math.exp(-k * a), f = (1 - e) / k;
  const tx = gx / k, ty = gy / k; // terminal velocity
  return { x: x0 + tx * a + (vx - tx) * f, y: y0 + ty * a + (vy - ty) * f, vx: tx + (vx - tx) * e, vy: ty + (vy - ty) * e };
}

/** Particle `i` of an emitter, born at `born` seconds, seen at time `t` (same clock). Null when not alive. */
export function particleAt(e: Emit, i: number, born: number, t: number): Particle | null {
  const r = (k: number) => hash(e.seed, i, k);
  const life = pick(e.life, r(1));
  const age = t - born;
  if (age < 0 || age >= life) return null;
  const rad = e.radius !== undefined ? pick(e.radius, r(2)) * Math.sqrt(r(3)) : 0, ra = r(4) * TAU;
  const x0 = e.at[0] + Math.cos(ra) * rad, y0 = e.at[1] + Math.sin(ra) * rad;
  const dir = (e.angle ?? 0) + (e.cone ?? Math.PI) * (r(5) * 2 - 1);
  const sp = pick(e.speed, r(6));
  const g = e.gravity ?? [0, 0];
  const m = flightAt(x0, y0, Math.cos(dir) * sp, Math.sin(dir) * sp, g[0], g[1], e.drag ?? 0, age);
  if (e.turbulence) {
    const s = e.turbScale ?? 120, w = e.turbulence * (age / life);
    m.x += w * noise2(m.x / s + age * 0.7, i * 0.37, e.seed);
    m.y += w * noise2(i * 0.37, m.y / s + age * 0.7, e.seed + 1);
  }
  const spinSign = r(7) < 0.5 ? -1 : 1;
  return {
    i, x: m.x, y: m.y, vx: m.vx, vy: m.vy, age, life, k: age / life,
    size: pick(e.size ?? 4, r(8)), angle: r(9) * TAU + spinSign * pick(e.spin ?? 0, r(10)) * age,
    r1: r(11), r2: r(12),
  };
}

// ---- bursts and streams ---------------------------------------------------------------------------

export interface BurstSpec extends Emit {
  /** How many particles: the burst's capacity. */
  count: number;
  /** Released over this many seconds instead of all at once. Default 0. */
  spread?: number;
}

/** The particles of a burst that are alive `since` seconds after it (in order of index). */
export function burst(b: BurstSpec, since: number, out: Particle[] = []): Particle[] {
  out.length = 0;
  if (since < 0) return out;
  for (let i = 0; i < b.count; i++) {
    const born = (b.spread ?? 0) * hash(b.seed, i, 0);
    const p = particleAt(b, i, born, since);
    if (p) out.push(p);
  }
  return out;
}

export interface StreamSpec extends Emit {
  /** Particles born per second. */
  rate: number;
  /** The stream stops releasing after this many seconds (those alive live on). Default: never. */
  until?: number;
}

/** The most particles a stream has alive at once: rate times the longest life, rounded up. */
export const streamCapacity = (s: StreamSpec) => Math.ceil(s.rate * hi(s.life)) + 1;

/** The particles of a stream that are alive `since` seconds after it began. Particle i is born at i / rate. */
export function stream(s: StreamSpec, since: number, out: Particle[] = []): Particle[] {
  out.length = 0;
  if (since < 0) return out;
  const last = Math.floor(Math.min(since, s.until ?? Infinity) * s.rate);
  const first = Math.max(0, Math.floor((since - hi(s.life)) * s.rate));
  for (let i = first; i <= last; i++) {
    const p = particleAt(s, i, i / s.rate, since);
    if (p) out.push(p);
  }
  return out;
}

// ---- forces that are not physics ------------------------------------------------------------------

/**
 * Pull-in: from age share `from` on, the particle is drawn to (tx, ty) and arrives there at the end
 * of its life. For sparks sucked into a point, a charge gathering before a burst. Changes p in place.
 */
export function pullTo(p: Particle, tx: number, ty: number, from = 0.3, fn: (t: number) => number = ease.inCubic): Particle {
  const span = Math.max(1e-6, 1 - from), u = clamp((p.k - from) / span);
  const w = fn(u);
  // the velocity follows the blend, so that streaks point where the particle is really going
  const h = 1e-3, dw = u > 0 && u < 1 ? (fn(Math.min(1, u + h)) - fn(Math.max(0, u - h))) / (2 * h) / span / p.life : 0;
  p.vx = (1 - w) * p.vx + (tx - p.x) * dw;
  p.vy = (1 - w) * p.vy + (ty - p.y) * dw;
  p.x = lerp(p.x, tx, w);
  p.y = lerp(p.y, ty, w);
  return p;
}

/**
 * A curved flight from a to b: a quadratic curve bent sideways by `bend` times the distance
 * (positive bends to the left of the direction of travel). k in 0..1 along it. Returns the point
 * and the direction of travel.
 */
export function curveFlight(a: [number, number], b: [number, number], k: number, bend = 0.3) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const cx = mx + dy * bend, cy = my - dx * bend;
  const u = 1 - k;
  const x = u * u * a[0] + 2 * u * k * cx + k * k * b[0];
  const y = u * u * a[1] + 2 * u * k * cy + k * k * b[1];
  const tx = 2 * u * (cx - a[0]) + 2 * k * (b[0] - cx), ty = 2 * u * (cy - a[1]) + 2 * k * (b[1] - cy);
  return { x, y, angle: Math.atan2(ty, tx) };
}

/**
 * An orbit round (cx, cy): radius r, start angle a0, angular speed w (rad/s), after `age` seconds.
 * `tilt` squashes the circle into an ellipse seen from above (0 flat on, 1 edge on); `z` is -1 at
 * the back and 1 at the front, for drawing order and size.
 */
export function orbitAt(cx: number, cy: number, r: number, a0: number, w: number, age: number, tilt = 0.6) {
  const a = a0 + w * age;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * (1 - tilt), z: Math.sin(a) };
}

// ---- recipes: sparks ------------------------------------------------------------------------------

export interface SparkStyle {
  /** Linear colour of the hot head (may exceed 1 to glow) and of the cooled end. */
  hot?: [number, number, number];
  cool?: [number, number, number];
  /** Width in px. */
  width?: number;
  /** Length of the streak: the distance travelled in this many seconds. */
  streak?: number;
}

/**
 * Sparks as streaks in a LineBatch: each is drawn from where it was `streak` seconds ago to where it
 * is, cooling from `hot` to `cool` and thinning as it dies. The batch needs as many segments as
 * particles. Use blend 'add' for glowing sparks.
 */
export function drawSparks(lines: LineBatch, ps: Particle[], s: SparkStyle = {}) {
  const hot = s.hot ?? [4, 3.1, 1.6], cool = s.cool ?? [1.2, 0.25, 0.05], st = s.streak ?? 0.035, w = s.width ?? 2.2;
  for (const p of ps) {
    const fade = 1 - p.k;
    const c = [lerp(hot[0], cool[0], p.k), lerp(hot[1], cool[1], p.k), lerp(hot[2], cool[2], p.k)] as [number, number, number];
    lines.seg2(p.x - p.vx * st, p.y - p.vy * st, p.x, p.y, w * (0.4 + 0.6 * fade), c, fade);
  }
}

/** The same on a Canvas2D layer, for a film without line batches: streaks with round caps. */
export function drawSparks2D(c: Ctx, ps: Particle[], colour = '#FFD27A', width = 2.2, streak = 0.035) {
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = rgba(colour);
  for (const p of ps) {
    c.globalAlpha = 1 - p.k;
    c.lineWidth = width * (0.4 + 0.6 * (1 - p.k));
    c.beginPath();
    c.moveTo(p.x - p.vx * streak, p.y - p.vy * streak);
    c.lineTo(p.x, p.y);
    c.stroke();
  }
  c.restore();
}

// ---- recipes: confetti ----------------------------------------------------------------------------

export interface ConfettiSpec {
  seed: number;
  at: [number, number];
  count?: number;
  /** Colours (palette keys or hex), picked per flake. */
  colours: string[];
  /** Launch speed range (px/s) and direction (default up) with its cone. */
  speed?: Range;
  angle?: number;
  cone?: number;
  size?: Range;
  life?: Range;
}

/**
 * Confetti fired once: flakes launched in a cone, braked hard by the air, then falling and
 * fluttering. A flake is a small rectangle that turns over as it falls: its drawn height is its
 * width times the cosine of its turn, so it flashes thin and wide. `since` in seconds.
 */
export function confetti(c: Ctx, s: ConfettiSpec, since: number) {
  const ps = burst({
    seed: s.seed, at: s.at, count: s.count ?? 90, speed: s.speed ?? [900, 1900], angle: s.angle ?? -Math.PI / 2,
    cone: s.cone ?? 0.7, life: s.life ?? [2.2, 3.4], size: s.size ?? [12, 22], spin: [4, 11], gravity: [0, 1100], drag: 3.2,
  }, since);
  c.save();
  for (const p of ps) {
    // a flutter that grows as the flake slows down
    const sway = Math.sin(p.age * (5 + 4 * p.r1) + p.r2 * TAU) * 40 * clamp(p.age * 1.4);
    const turn = p.age * (6 + 8 * p.r2) + p.r1 * TAU;
    c.globalAlpha = 1 - ease.inQuad(p.k);
    c.fillStyle = rgba(s.colours[Math.floor(p.r1 * s.colours.length)] ?? s.colours[0]!);
    c.save();
    c.translate(p.x + sway, p.y);
    c.rotate(p.angle);
    const w = p.size, h = p.size * 0.55 * Math.max(0.08, Math.abs(Math.cos(turn)));
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
  }
  c.restore();
}

// ---- recipes: coins and gems into a counter --------------------------------------------------------

export interface CoinFlightSpec {
  seed: number;
  /** Where the coins burst from, and the counter they fly into (px). */
  from: [number, number];
  to: [number, number];
  count: number;
  /** Seconds between two coins leaving, and the time each takes to fly. */
  stagger?: number;
  dur?: number;
  /** How far they first scatter before they turn for the counter (px). */
  scatter?: number;
  size?: number;
  kind?: 'coin' | 'gem';
}

/**
 * Coins that burst out, hang for a moment, then fly on curves into a counter, one after another.
 * Each coin: a short scatter away from `from`, then a curved flight that speeds up into `to`.
 * Returns how many have landed and the seconds since the last landing, for the counter's value and
 * its bump (`1 + 0.12 * Math.exp(-sinceLast * 14)` is a good bump).
 */
export function coinsToCounter(c: Ctx, s: CoinFlightSpec, since: number) {
  const st = s.stagger ?? 0.06, dur = s.dur ?? 0.7, scatter = s.scatter ?? 160, size = s.size ?? 34;
  let landed = 0, lastLand = -Infinity;
  for (let i = 0; i < s.count; i++) {
    const r = (k: number) => hash(s.seed, i, k);
    const t0 = i * st, a = since - t0;
    if (a < 0) continue;
    const pop = 0.28; // seconds of the scatter
    const ang = r(1) * TAU, dist = scatter * (0.4 + 0.6 * r(2));
    const sx = s.from[0] + Math.cos(ang) * dist, sy = s.from[1] + Math.sin(ang) * dist * 0.7;
    const landAt = t0 + pop + dur;
    if (since >= landAt) { landed++; lastLand = Math.max(lastLand, landAt); continue; }
    let x: number, y: number, scale = 1;
    if (a < pop) {
      const k = ease.outCubic(a / pop);
      x = lerp(s.from[0], sx, k); y = lerp(s.from[1], sy, k); scale = 0.4 + 0.6 * k;
    } else {
      const k = ease.inCubic((a - pop) / dur);
      const p = curveFlight([sx, sy], s.to, k, (r(3) - 0.5) * 0.8);
      x = p.x; y = p.y; scale = lerp(1, 0.55, k);
    }
    drawCoin(c, x, y, size * scale, a * (9 + 5 * r(4)) + r(5) * TAU, s.kind ?? 'coin');
  }
  return { landed, sinceLast: since - lastLand };
}

/** One coin (a disc turning about its upright axis) or one gem (a cut stone), centred on (x, y). */
export function drawCoin(c: Ctx, x: number, y: number, size: number, turn: number, kind: 'coin' | 'gem' = 'coin') {
  const w = Math.max(0.12, Math.abs(Math.cos(turn)));
  c.save();
  c.translate(x, y);
  if (kind === 'coin') {
    const r = size / 2;
    // the rim shows as a thicker edge when the coin is turned
    c.fillStyle = '#9C5A00';
    c.beginPath(); c.ellipse(r * 0.12 * (1 - w), 0, r * w, r, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#FFF1A8'); g.addColorStop(0.45, '#FFC42E'); g.addColorStop(1, '#D9860B');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, 0, r * w, r, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(156,90,0,0.8)'; c.lineWidth = Math.max(1, size * 0.06);
    c.beginPath(); c.ellipse(0, 0, r * w * 0.72, r * 0.72, 0, 0, TAU); c.stroke();
  } else {
    const r = size / 2;
    const pts: [number, number][] = [[0, -r], [r * 0.8 * w, -r * 0.35], [r * 0.55 * w, r * 0.55], [0, r], [-r * 0.55 * w, r * 0.55], [-r * 0.8 * w, -r * 0.35]];
    c.fillStyle = '#19C2B0';
    c.beginPath(); pts.forEach(([px, py], j) => (j ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.8 * w, -r * 0.35); c.lineTo(0, -r * 0.1); c.lineTo(-r * 0.8 * w, -r * 0.35); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,40,40,0.35)';
    c.beginPath(); c.moveTo(0, -r * 0.1); c.lineTo(r * 0.55 * w, r * 0.55); c.lineTo(0, r); c.closePath(); c.fill();
  }
  c.restore();
}

// ---- recipes: fire and smoke ----------------------------------------------------------------------

/**
 * One soft puff: a disc of colour (sRGB 0..255) whose middle is even and whose edge fades from
 * `hard` of the radius outwards, stretched `stretch` times along the angle `angle` (radians).
 * Puffs with a firm middle overlap into billows; puffs that are all edge melt into one blob.
 */
export function puff(c: Ctx, x: number, y: number, r: number, rgb: number[], alpha: number, hard = 0.45, stretch = 1, angle = -Math.PI / 2) {
  if (alpha <= 0.002 || r <= 0.5) return;
  const [cr, cg, cb] = rgb.map((v) => v | 0) as [number, number, number];
  c.save();
  c.translate(x, y);
  if (stretch !== 1) { c.rotate(angle); c.scale(stretch, 1); }
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
  g.addColorStop(hard, `rgba(${cr},${cg},${cb},${alpha * 0.8})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  c.fillStyle = g;
  c.fillRect(-r, -r, 2 * r, 2 * r);
  c.restore();
}

export interface FireSpec {
  seed: number;
  /** The middle of the base of the flame, its width and its height (px). */
  at: [number, number];
  width?: number;
  height?: number;
  /** Tongues a second. More is denser and costs more. Default 110. */
  rate?: number;
  /** 0..1: how hard it burns. Scales height and brightness. */
  intensity?: number;
}

const FIRE_RAMP: [number, number, number, number][] = [
  // age share, r, g, b (sRGB 0..255)
  [0, 255, 246, 214], [0.15, 255, 206, 96], [0.4, 255, 122, 34], [0.7, 196, 44, 16], [1, 60, 14, 10],
];
function ramp(stops: [number, number, number, number][], k: number) {
  for (let j = 1; j < stops.length; j++) {
    const a = stops[j - 1]!, b = stops[j]!;
    if (k <= b[0]) { const u = (k - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; }
  }
  const l = stops[stops.length - 1]!;
  return [l[1], l[2], l[3]];
}

/**
 * A flame made of tongues: small hot puffs born along the base that race upwards, are drawn in
 * towards the axis, stretch along their flight, cool from white through yellow and orange to dark
 * red, shrink and die. Drawn with 'lighter', so that where tongues overlap the flame is hottest.
 * Draw it on a layer of its own and composite that with mode 'add' (a tint of about 1.3 lets the
 * core bloom). `since` in seconds; the flame needs about half a second to build up, so start it
 * before it is seen.
 */
export function fire(c: Ctx, s: FireSpec, since: number) {
  const W0 = s.width ?? 120, heat = 0.5 + 0.5 * (s.intensity ?? 1), H0 = (s.height ?? 260) * heat;
  const ps = stream({
    seed: s.seed, at: s.at, radius: [0, W0 * 0.45], angle: -Math.PI / 2, cone: 0.2,
    speed: [H0 * 1.1, H0 * 1.8], life: [0.35, 0.75], size: [W0 * 0.16, W0 * 0.3],
    gravity: [0, -H0 * 1.6], drag: 2.2, turbulence: W0 * 0.4, turbScale: W0 * 0.45, rate: s.rate ?? 110,
  }, since);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of ps) {
    // drawn in towards the axis as it rises: a flame narrows to its tip
    const x = lerp(p.x, s.at[0] + (p.x - s.at[0]) * 0.2, ease.outQuad(p.k));
    const r = p.size * (1 - 0.65 * p.k) * (0.7 + 0.3 * clamp(p.age * 12));
    const col = ramp(FIRE_RAMP, Math.min(1, p.k * 1.1 + (1 - heat) * 0.2));
    const stretch = 1 + Math.min(1.6, Math.hypot(p.vx, p.vy) / (H0 * 1.2));
    puff(c, x, p.y, r, col, 0.42 * (1 - p.k * p.k), 0.35, stretch, Math.atan2(p.vy, p.vx));
  }
  c.restore();
}

export interface SmokeSpec {
  seed: number;
  at: [number, number];
  /** Width of the source, and how far the smoke rises in its life (px). */
  width?: number;
  rise?: number;
  rate?: number;
  life?: Range;
  /** Colour (palette key or hex) and the densest opacity. */
  colour?: string;
  opacity?: number;
  /** Wind (px/s): smoke leans with it. */
  wind?: number;
}

/**
 * Smoke: puffs that rise slowly, swell to about two and a half times their size, drift on noise
 * and fade. Their middles are firm, so they overlap into billows. Drawn normally (not 'lighter'),
 * behind fire, on a layer composited normally. `since` in seconds.
 */
export function smoke(c: Ctx, s: SmokeSpec, since: number) {
  const W0 = s.width ?? 140, rise = s.rise ?? 520, life = s.life ?? [2.2, 3.4];
  const ps = stream({
    seed: s.seed, at: s.at, radius: [0, W0 * 0.3], angle: -Math.PI / 2, cone: 0.3,
    speed: [rise * 0.3, rise * 0.5], life, size: [W0 * 0.22, W0 * 0.36], gravity: [s.wind ?? 0, -rise * 0.04],
    drag: 0.35, turbulence: W0 * 0.9, turbScale: W0 * 1.4, rate: s.rate ?? 16,
  }, since);
  const rgb = hexRgb(s.colour ?? 'graphite');
  c.save();
  for (const p of ps) {
    const r = p.size * (1 + 1.6 * ease.outQuad(p.k));
    // each puff a little lighter or darker than the next: the billows read
    const shade = 0.8 + 0.4 * p.r1;
    const a = (s.opacity ?? 0.4) * Math.sin(Math.PI * Math.pow(p.k, 0.55)) * clamp(p.age * 3);
    puff(c, p.x, p.y, r, rgb.map((v) => Math.min(255, v * shade)), a, 0.5);
    // the side of each billow that faces the light (above, left) is lighter: the smoke has volume
    puff(c, p.x - r * 0.22, p.y - r * 0.28, r * 0.62, rgb.map((v) => Math.min(255, v * shade * 1.35 + 12)), a * 0.45, 0.4);
  }
  c.restore();
}

/** A palette key or a hex colour as sRGB 0..255. */
function hexRgb(colour: string): number[] {
  const m = /rgba?\((\d+),(\d+),(\d+)/.exec(rgba(colour));
  return m ? [+m[1]!, +m[2]!, +m[3]!] : [128, 128, 128];
}

// ---- recipes: an explosion ------------------------------------------------------------------------

export interface ExplosionSpec {
  seed: number;
  at: [number, number];
  /** Radius the fireball reaches (px). Everything else scales with it. */
  size?: number;
  /** Colour of the debris and of the smoke (palette keys or hex). */
  debris?: string;
  smoke?: string;
}

/**
 * An explosion that can be followed: a short white flash, a fireball of billows that swells, rises
 * and turns to dark smoke from its edge inwards, a ring of pressure, debris thrown on arcs that
 * fall, and sparks. `since` in seconds (nothing before 0).
 *
 * Two surfaces, because hot light adds and smoke covers: `hot` takes the fireball, flash, ring and
 * glowing debris edges (a layer composited with mode 'add'); `cool` takes the smoke and the debris
 * bodies (a layer composited normally, drawn first). Pass the same context for both to draw it all
 * on one normal layer. Sparks go into `lines` when one is given (60 segments), else onto `hot`.
 */
export function explosion(hot: Ctx, s: ExplosionSpec, since: number, cool: Ctx = hot, lines?: LineBatch) {
  if (since < 0) return;
  const R = s.size ?? 260, [x, y] = s.at;
  // one set of billows: hot while young, then smoke. Each billow is thrown out, braked hard, and rises
  const fb = burst({ seed: s.seed + 1, at: [x, y], count: 24, radius: [0, R * 0.25], speed: [R * 1.5, R * 6.5], life: [2.6, 3.8], size: [R * 0.26, R * 0.44], gravity: [0, -R * 0.55], drag: 5, turbulence: R * 0.35, turbScale: R * 0.8 }, since);
  const smokeRgb = hexRgb(s.smoke ?? '#3A343E');
  // smoke: the billows that have cooled, darkest where they are thickest
  cool.save();
  for (const p of fb) {
    const cold = clamp((p.age - 0.18) / 0.5);
    if (cold <= 0) continue;
    const r = p.size * (1.15 + 1.3 * ease.outQuad(p.k));
    const a = 0.75 * cold * (1 - ease.inQuad(p.k));
    const shade = 0.75 + 0.5 * p.r1;
    puff(cool, p.x, p.y, r, smokeRgb.map((v) => v * shade), a, 0.6);
    puff(cool, p.x - r * 0.2, p.y - r * 0.3, r * 0.6, smokeRgb.map((v) => Math.min(255, v * shade * 1.5 + 10)), a * 0.5, 0.45);
  }
  cool.restore();
  // debris bodies
  const db = burst({ seed: s.seed + 2, at: [x, y], count: 26, speed: [R * 2.2, R * 4.5], angle: -Math.PI / 2, cone: 1.5, life: [1.4, 2.2], size: [R * 0.03, R * 0.08], spin: [4, 12], gravity: [0, R * 5.5], drag: 0.6 }, since);
  const shape = (c: Ctx, p: Particle) => {
    const n = 3 + Math.floor(p.r1 * 3);
    c.beginPath();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU, rr = p.size * (0.6 + 0.6 * hash(s.seed, p.i, 20 + j));
      j ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
  };
  for (const p of db) {
    cool.save(); cool.translate(p.x, p.y); cool.rotate(p.angle);
    cool.globalAlpha = 1 - ease.inQuad(p.k);
    shape(cool, p); cool.fillStyle = rgba(s.debris ?? 'graphite'); cool.fill();
    cool.restore();
  }
  // the hot part
  hot.save();
  hot.globalCompositeOperation = 'lighter';
  for (const p of fb) {
    const glow = 1 - clamp(p.age / 0.7);
    if (glow <= 0) continue;
    const r = p.size * (0.9 + 1.0 * ease.outCubic(Math.min(1, p.age * 5)));
    // hotter in the middle of the ball and while young
    const col = ramp(FIRE_RAMP, clamp(p.age * 1.3 + p.r2 * 0.25));
    puff(hot, p.x, p.y, r * (0.75 + 0.25 * glow), col, 0.45 * glow * glow, 0.6);
  }
  const fl = Math.exp(-since * 30);
  if (fl > 0.01) puff(hot, x, y, R * (0.35 + since * 3), [255, 252, 240], fl, 0.3);
  for (const p of db) {
    const heat = clamp(1 - p.age * 2.5);
    if (heat <= 0) continue;
    hot.save(); hot.translate(p.x, p.y); hot.rotate(p.angle);
    shape(hot, p); hot.strokeStyle = `rgba(255,150,60,${heat})`; hot.lineWidth = 2; hot.stroke();
    hot.restore();
  }
  // the ring of pressure: a thin bright line that runs out and thins
  const rk = clamp(since / 0.4);
  if (rk < 1) {
    hot.strokeStyle = `rgba(255,236,210,${0.35 * (1 - rk)})`;
    hot.lineWidth = 1 + 3 * (1 - rk);
    hot.beginPath(); hot.arc(x, y, R * 2.6 * ease.outCubic(rk), 0, TAU); hot.stroke();
  }
  hot.restore();
  // sparks
  const sp = burst({ seed: s.seed + 3, at: [x, y], count: 60, speed: [R * 3, R * 7], life: [0.35, 0.9], gravity: [0, R * 3], drag: 2 }, since);
  if (lines) drawSparks(lines, sp, { streak: 0.03, width: 2.4 });
  else drawSparks2D(hot, sp, '#FFE3A0', 2.4, 0.03);
}

// ---- recipes: shatter -----------------------------------------------------------------------------

export interface ShatterSpec {
  seed: number;
  /** The rectangle that breaks (px), and where it was hit. */
  rect: { x: number; y: number; w: number; h: number };
  at: [number, number];
  /** Rays from the point of impact, and rings of breaks round it. Pieces = rays * (rings + 1). */
  rays?: number;
  rings?: number;
  /** How hard it was hit: the speed of the pieces near the impact (px/s). */
  force?: number;
  gravity?: number;
}

interface Shard { pts: [number, number][]; cx: number; cy: number; dist: number; r1: number; r2: number }
const shardCache = new Map<string, Shard[]>();

/** The pieces a rectangle breaks into: cut along rays from the impact and along jagged rings round it. Built once per spec. */
export function shardsOf(s: ShatterSpec): Shard[] {
  const key = JSON.stringify([s.seed, s.rect, s.at, s.rays, s.rings]);
  const known = shardCache.get(key);
  if (known) return known;
  const n = s.rays ?? 11, m = s.rings ?? 2, { x, y, w, h } = s.rect, [ix, iy] = s.at;
  // the distance from the impact to the edge of the rectangle along a direction
  const toEdge = (a: number) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    const tx = dx > 0 ? (x + w - ix) / dx : dx < 0 ? (x - ix) / dx : Infinity;
    const ty = dy > 0 ? (y + h - iy) / dy : dy < 0 ? (y - iy) / dy : Infinity;
    return Math.min(tx, ty);
  };
  const angles = Array.from({ length: n }, (_, j) => ((j + 0.5 * hash(s.seed, j, 1)) / n) * TAU);
  // ring points: along each ray, at jittered shares of the way to the edge; the last ring is the edge itself
  const ring = (j: number, q: number) => {
    const a = angles[((j % n) + n) % n]!;
    const e = toEdge(a);
    const f = q > m ? 1 : (q / (m + 1)) * (0.75 + 0.5 * hash(s.seed, j, 10 + q));
    return [ix + Math.cos(a) * e * f, iy + Math.sin(a) * e * f] as [number, number];
  };
  const out: Shard[] = [];
  for (let j = 0; j < n; j++) {
    for (let q = 0; q <= m; q++) {
      const inner = q === 0 ? [[ix, iy] as [number, number]] : [ring(j, q), ring(j + 1, q)];
      const outer = [ring(j + 1, q + 1), ring(j, q + 1)];
      const pts = [...inner, ...outer];
      // a piece whose outer edge spans a corner of the rectangle takes the corner in
      if (q === m) {
        const a0 = angles[j]!, a1 = angles[(j + 1) % n]! + (j + 1 === n ? TAU : 0);
        const corners: [number, number][] = [[x + w, y + h], [x, y + h], [x, y], [x + w, y]];
        const inside = corners.map((p) => {
          let a = Math.atan2(p[1] - iy, p[0] - ix); while (a < a0) a += TAU;
          return { p, a };
        }).filter((q2) => q2.a < a1).sort((u, v) => v.a - u.a);
        pts.splice(inner.length + 1, 0, ...inside.map((q2) => q2.p));
      }
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= pts.length; cy /= pts.length;
      out.push({ pts, cx, cy, dist: Math.hypot(cx - ix, cy - iy), r1: hash(s.seed, j, q, 3), r2: hash(s.seed, j, q, 4) });
    }
  }
  shardCache.set(key, out);
  return out;
}

/**
 * A rectangle that breaks where it was hit: the pieces fly away from the impact (the nearer, the
 * faster), turn, fall, and show the picture they carried. `source` is that picture: a canvas or
 * image drawn over the rectangle, or a function that draws it in frame coordinates. Before 0 the
 * rectangle is whole. `since` in seconds. Each piece redraws the source through a clip, so keep
 * the pieces to a few dozen.
 */
export function shatter(c: Ctx, s: ShatterSpec, since: number, source: CanvasImageSource | ((c: Ctx) => void)) {
  const draw = () => (typeof source === 'function' ? source(c) : c.drawImage(source, s.rect.x, s.rect.y, s.rect.w, s.rect.h));
  if (since <= 0) { c.save(); c.beginPath(); c.rect(s.rect.x, s.rect.y, s.rect.w, s.rect.h); c.clip(); draw(); c.restore(); return; }
  const F = s.force ?? 1400, g = s.gravity ?? 2200, diag = Math.hypot(s.rect.w, s.rect.h);
  for (const sh of shardsOf(s)) {
    const near = 1 - clamp(sh.dist / (diag * 0.8));
    // the break runs out from the impact: far pieces let go a moment later
    const a = since - (sh.dist / diag) * 0.08;
    if (a <= 0) {
      c.save(); c.beginPath(); sh.pts.forEach(([px, py], j) => (j ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.clip(); draw(); c.restore();
      continue;
    }
    const dir = Math.atan2(sh.cy - s.at[1], sh.cx - s.at[0]) + (sh.r1 - 0.5) * 0.5;
    const sp = F * (0.25 + 0.95 * near) * (0.7 + 0.6 * sh.r2);
    const m = flightAt(0, 0, Math.cos(dir) * sp, Math.sin(dir) * sp - F * 0.15, 0, g, 1.2, a);
    const turn = (sh.r1 - 0.5) * 7 * a;
    const tilt = Math.cos(a * (3 + 5 * sh.r2)); // a piece turning over shows narrower
    c.save();
    c.translate(sh.cx + m.x, sh.cy + m.y);
    c.rotate(turn);
    c.scale(1, 0.35 + 0.65 * Math.abs(tilt));
    c.translate(-sh.cx, -sh.cy);
    c.beginPath(); sh.pts.forEach(([px, py], j) => (j ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
    c.save(); c.clip(); draw();
    // the face darkens as it turns away from the light
    c.fillStyle = `rgba(0,0,0,${0.45 * (1 - Math.abs(tilt))})`; c.fill();
    c.restore();
    // a bright broken edge
    c.strokeStyle = `rgba(255,255,255,${0.75 * Math.exp(-a * 3)})`;
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();
  }
}

// ---- recipes: dust in a beam of light -------------------------------------------------------------

export interface BeamSpec {
  /** The source of the light (px), the direction it shines (radians), its half-angle and its reach (px). */
  from: [number, number];
  angle: number;
  spread: number;
  length: number;
}

let beamCanvas: HTMLCanvasElement | null = null;

/**
 * A soft cone of light (added with 'lighter'): brightest along its middle and near the source,
 * fading to its sides and along its length. Drawn once on a scratch canvas the size of the frame,
 * with a conic gradient across the beam and a radial one along it, then added to `c`: one layer,
 * so no bands. In px of the frame (the context's own transform is ignored); soft, so drawn at 1 px
 * per logical px whatever the output scale. Conic gradients need Safari 16.1 or later.
 */
export function lightBeam(c: Ctx, b: BeamSpec, colour = '#FFE9C2', strength = 0.22) {
  const w = W, h = H;
  beamCanvas ??= document.createElement('canvas');
  const bc = beamCanvas;
  if (bc.width !== Math.round(w) || bc.height !== Math.round(h)) { bc.width = Math.round(w); bc.height = Math.round(h); }
  const g2 = bc.getContext('2d')!;
  g2.setTransform(1, 0, 0, 1, 0, 0);
  g2.globalCompositeOperation = 'source-over';
  g2.clearRect(0, 0, bc.width, bc.height);
  const [r, g, bl] = hexRgb(colour);
  // across: a conic gradient round the source, full on the axis, nothing at the edges of the cone
  const cg = g2.createConicGradient(b.angle - b.spread * 1.2, b.from[0], b.from[1]);
  const span = (b.spread * 2.4) / TAU;
  for (let j = 0; j <= 12; j++) {
    const u = j / 12, prof = Math.pow(Math.sin(Math.PI * u), 1.6);
    cg.addColorStop(u * span, `rgba(${r},${g},${bl},${strength * prof})`);
  }
  cg.addColorStop(Math.min(1, span + 1e-4), `rgba(${r},${g},${bl},0)`);
  cg.addColorStop(1, `rgba(${r},${g},${bl},0)`);
  g2.fillStyle = cg;
  g2.fillRect(0, 0, bc.width, bc.height);
  // along: fades with the distance from the source
  g2.globalCompositeOperation = 'destination-in';
  const rg = g2.createRadialGradient(b.from[0], b.from[1], 0, b.from[0], b.from[1], b.length);
  rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.35, 'rgba(0,0,0,0.75)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g2.fillStyle = rg;
  g2.fillRect(0, 0, bc.width, bc.height);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'lighter';
  c.drawImage(bc, 0, 0, w, h);
  c.restore();
}

/**
 * Motes of dust drifting in a beam: a fixed set of `count` specks that float on noise through the
 * box round the beam (nothing is born or dies, so any time can be asked for), lit only while they
 * are inside the cone, and twinkling as they turn. `t` in seconds of any clock.
 */
export function dustInBeam(c: Ctx, b: BeamSpec, t: number, seed = 1, count = 160, colour = '#FFF4DC') {
  const cs = Math.cos(b.angle), sn = Math.sin(b.angle);
  const half = Math.tan(b.spread) * b.length;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = colour;
  for (let i = 0; i < count; i++) {
    const r = (k: number) => hash(seed, i, k);
    // position in the beam's own frame: u along it (0..length), v across it (-half..half), drifting and wrapping
    const u = ((r(1) * b.length + t * 14 * (r(2) - 0.3) + noise2(t * 0.15, i, seed) * 60) % b.length + b.length) % b.length;
    const v = (r(3) * 2 - 1) * half + noise2(i, t * 0.2, seed + 1) * 40 + Math.sin(t * 0.6 + i) * 8;
    const across = Math.abs(v) / Math.max(1, (u / b.length) * half);
    const lit = (1 - clamp(across)) * (1 - u / b.length) * clamp(u / 40);
    if (lit <= 0.01) continue;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + 3 * r(4)) + r(5) * TAU);
    const size = 0.8 + 2.2 * r(6) * r(6);
    c.globalAlpha = clamp(lit * tw * 1.4);
    c.beginPath();
    c.arc(b.from[0] + u * cs - v * sn, b.from[1] + u * sn + v * cs, size, 0, TAU);
    c.fill();
  }
  c.restore();
}
