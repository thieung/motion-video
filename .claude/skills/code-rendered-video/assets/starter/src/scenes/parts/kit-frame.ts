// Shared kit, part 1: the frame. The layout zones, a 2D camera, and musical time inside a scene.
// Read-only for scene authors; the lead tunes the zones for the film's formats and platforms.
//
// Everything here is a pure function of its arguments.
import { W, H } from '../../engine/gl';
import type { AudioData } from '../../engine/audio';
import type { Frame } from '../../engine/scene';
import { clamp, frameIdx, lerp } from '../../engine/util';
import { PROJECT, OUTPUT } from '../../project-config';

// ---- layout ------------------------------------------------------------------------------------
// The zones of each format the film may be shown in. Each table is written in px of its own
// reference frame and scaled to the output size of that format; the table of the format this page
// shows (`?format=`, `--format`) is used. A format with no table of its own takes the table whose
// shape is closest and scales it. Pictures may fill the whole frame. Words may not: they stay
// inside the zones. Tune the zones to the platform the film is shown on.
//
// 9:16 is for apps that lay their own buttons and text over the picture (a band at the top, a larger
// one at the foot, buttons on the right). 1:1 and 4:5 are for feeds, which cover little. 16:9 is for
// a player: title-safe margins of about 5 %, captions low and narrower than the frame.

/** One unit = one px of a 1080 px short side. Sizes written as `n * UNIT` follow the output size. */
export const UNIT = Math.min(W, H) / 1080;

export interface Rect { x0: number; y0: number; x1: number; y1: number }
type Quad = [number, number, number, number];
/** The zones of one format, in px of `ref`, its reference frame. */
interface ZoneTable { ref: [number, number]; safe: Quad; plate: Quad; stage: Quad; caption: Quad }

export const ZONE_TABLES: Record<string, ZoneTable> = {
  '9:16': { ref: [1080, 1920], safe: [72, 200, 1008, 1560], plate: [72, 200, 1008, 450], stage: [0, 470, 1080, 1270], caption: [72, 1300, 944, 1560] },
  '4:5': { ref: [1080, 1350], safe: [64, 72, 1016, 1278], plate: [64, 72, 1016, 300], stage: [0, 310, 1080, 1010], caption: [64, 1020, 1016, 1278] },
  '1:1': { ref: [1080, 1080], safe: [64, 64, 1016, 1016], plate: [64, 64, 1016, 250], stage: [0, 250, 1080, 800], caption: [64, 810, 1016, 1016] },
  '16:9': { ref: [1920, 1080], safe: [96, 54, 1824, 1026], plate: [96, 54, 1824, 230], stage: [0, 230, 1920, 810], caption: [288, 820, 1632, 1026] },
};

/** The table for this page's format: its own, or the one whose shape is closest. */
function zoneTable(): ZoneTable {
  const own = ZONE_TABLES[OUTPUT.name];
  if (own) return own;
  const shape = (w: number, h: number) => Math.log(w / h);
  let best = ZONE_TABLES['9:16']!, d = Infinity;
  for (const z of Object.values(ZONE_TABLES)) {
    const e = Math.abs(shape(...z.ref) - shape(W, H));
    if (e < d) { d = e; best = z; }
  }
  return best;
}
const TABLE = zoneTable();
/** A zone given in px of the table's reference frame, scaled to the output frame. */
const zone = ([x0, y0, x1, y1]: Quad): Rect => {
  const [rw, rh] = TABLE.ref;
  return { x0: (x0 * W) / rw, y0: (y0 * H) / rh, x1: (x1 * W) / rw, y1: (y1 * H) / rh };
};

/** The name of the format this page shows, for a scene that places things differently per format. */
export const FORMAT = OUTPUT.name;
/** True when the frame is wider than it is tall. */
export const LANDSCAPE = W > H;

/** Everything that must be read sits inside this rectangle. Outside it an app may cover the picture. */
export const SAFE = zone(TABLE.safe);
/** The name plate: section number and section name. Drawn by the overlay, the same over every shot. */
export const PLATE = zone(TABLE.plate);
/** The stage: where the scene happens. The picture itself may run to every edge of the frame. */
export const STAGE = zone(TABLE.stage);
/** The caption block. In 9:16 narrower on the right, where apps put buttons. */
export const CAPTION = zone(TABLE.caption);

export const rectW = (r: Rect) => r.x1 - r.x0;
export const rectH = (r: Rect) => r.y1 - r.y0;
export const rectCx = (r: Rect) => (r.x0 + r.x1) / 2;
export const rectCy = (r: Rect) => (r.y0 + r.y1) / 2;

// ---- camera ------------------------------------------------------------------------------------

/** A view of a scene's own world: the world point at the centre of the screen, and the magnification. */
export interface Cam { x: number; y: number; zoom: number; roll?: number }

/** World point to screen px. */
export function toScreen(c: Cam, wx: number, wy: number) {
  let dx = (wx - c.x) * c.zoom, dy = (wy - c.y) * c.zoom;
  if (c.roll) { const cs = Math.cos(c.roll), sn = Math.sin(c.roll); [dx, dy] = [dx * cs - dy * sn, dx * sn + dy * cs]; }
  return { x: dx + W / 2, y: dy + H / 2 };
}

/** The camera that shows the whole of a world rectangle inside a screen rectangle (default: the stage). */
export function camForRect(r: Rect, into: Rect = STAGE, pad = 0): Cam {
  const zoom = Math.min((rectW(into) - 2 * pad) / rectW(r), (rectH(into) - 2 * pad) / rectH(r));
  // the world rectangle's centre lands on the centre of `into`, not of the screen
  return { x: rectCx(r) - (rectCx(into) - W / 2) / zoom, y: rectCy(r) - (rectCy(into) - H / 2) / zoom, zoom };
}

/**
 * Between two cameras. Zoom is mixed geometrically and the position follows the zoom, so a move
 * that changes the zoom a lot still looks even.
 */
export function camMix(a: Cam, b: Cam, k: number): Cam {
  k = clamp(k);
  const zoom = a.zoom * Math.pow(b.zoom / a.zoom, k);
  const kz = Math.abs(a.zoom - b.zoom) < 1e-6 ? k : (1 / a.zoom - 1 / zoom) / (1 / a.zoom - 1 / b.zoom);
  return { x: lerp(a.x, b.x, kz), y: lerp(a.y, b.y, kz), zoom, roll: lerp(a.roll ?? 0, b.roll ?? 0, k) };
}

// ---- stepped values and motion blur ------------------------------------------------------------

/**
 * The time of the output frame that song time t belongs to. With motion blur on, render() is
 * called many times per frame at slightly different times and the results are averaged. That is
 * right for anything that moves, and wrong for anything that steps: a word that appears part way
 * through the shutter is printed at part strength, a number that changes is printed as both.
 *
 * So: anything that is read as a value (a counter, a label that changes, which word of a sentence
 * is showing, which of two states a switch is in) is worked out from `frameTime(f.t)`. Anything
 * that travels (objects, the camera, a line being drawn) is worked out from `f.t`.
 */
export const frameTime = (t: number) => frameIdx(t) / PROJECT.fps;

// ---- musical time inside a scene ---------------------------------------------------------------

/**
 * Where a frame is in the music, counted from the start of its scene. Scenes start on a downbeat
 * and the clocks assume four beats to a bar, so beat 0 of bar 0 is the scene's first frame. All counts start at ZERO.
 */
export interface SceneClock {
  /** Continuous beats since the scene started (2.5 = half way through the third beat). */
  beats: number;
  /** Continuous bars since the scene started. */
  bars: number;
  /** Whole bar and whole beat within it (0..3), and how far through that beat (0..1). */
  bar: number;
  beat: number;
  phase: number;
  /** Length of the scene in beats. */
  length: number;
}

/** The clock at the time of this render call. Use it for everything that moves. */
export function sceneClock(au: AudioData, f: Frame): SceneClock {
  return clockAt(au, f, f.t);
}

/**
 * The clock of the output frame, the same for every motion-blur sample of that frame. Use it for
 * everything that steps: see frameTime.
 */
export function frameClock(au: AudioData, f: Frame): SceneClock {
  return clockAt(au, f, frameTime(f.t));
}

/**
 * The beat index the scene's clock counts from. A scene boundary is a stored beat time, but going
 * through beatAt can land a hair below an integer, hence the rounding. The first scene starts at
 * time 0, before the first downbeat when the track opens with a pickup: its clock still counts
 * from the first downbeat, like the bars of the shot list, and the pickup is held at beat 0.
 */
function startBeat(au: AudioData, f: Frame): number {
  const b0 = Math.round(au.beatAt(f.start));
  const d0 = au.downbeats.length ? Math.round(au.beatAt(au.downbeats[0]!)) : 0;
  return Math.max(b0, d0);
}

function clockAt(au: AudioData, f: Frame, t: number): SceneClock {
  const b0 = startBeat(au, f);
  const beats = Math.max(0, au.beatAt(t) - b0);
  const whole = Math.floor(beats + 1e-6);
  return { beats, bars: beats / 4, bar: Math.floor(whole / 4), beat: whole % 4, phase: clamp(beats - whole), length: Math.round(au.beatAt(f.end) - b0) };
}

/** Song time (s) of a position given in beats since the start of the scene. */
export const sceneTime = (au: AudioData, f: Frame, beats: number) => au.timeOfBeat(startBeat(au, f) + beats);

/** Seconds since a position given in beats since the start of the scene (negative before it). For springs and pulses. */
export const since = (au: AudioData, f: Frame, beats: number) => f.t - sceneTime(au, f, beats);

/** 0 before `at`, then 1 decaying by half every `halfLife` beats. For accents on a hit. */
export const hit = (beats: number, at: number, halfLife = 0.35) => (beats < at ? 0 : Math.pow(0.5, (beats - at) / halfLife));

/** Eased 0..1 over `dur` beats starting at `at`. For moves that begin on a beat. */
export const over = (beats: number, at: number, dur: number, fn: (t: number) => number = (t) => t) => fn(clamp((beats - at) / dur));

/** True from beat `at` until beat `until` (exclusive). */
export const during = (beats: number, at: number, until: number) => beats >= at && beats < until;

/** How many whole steps of `every` beats have passed since `at` (0 before the first). For counters and cuts that step on the beat. */
export const steps = (beats: number, at: number, every = 1) => (beats < at ? 0 : Math.floor((beats - at) / every + 1e-6) + 1);

/**
 * An accent that repeats: 1 on every `every` beats (offset by `offset`), decaying by half every
 * `halfLife` beats. `offset` 0.5 with `every` 1 is the off-beat, the "and", where funk puts its
 * answers; `offset` 1 with `every` 2 is the backbeat, beats two and four, where the claps are.
 */
export function groove(beats: number, every = 1, offset = 0, halfLife = 0.25) {
  const x = (beats - offset) / every;
  if (x < 0) return 0;
  return Math.pow(0.5, ((x - Math.floor(x)) * every) / halfLife);
}
