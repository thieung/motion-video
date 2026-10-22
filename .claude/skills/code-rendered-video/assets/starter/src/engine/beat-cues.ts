// Beat cues: on-screen events timed to a musical position (bar, beat, fraction) instead of seconds.
//
// The video has no lyrics, so text and graphics are placed on the music's grid. This module turns a
// musical position into song time using the loaded beat grid (data/audio.json), and answers, for a
// cue with a start and an end position, whether it is on at time t and how far through it is.
//
// Everything here is a pure function of its arguments (the beat grid, the cue and t): no state, no
// clocks, no randomness. The same call returns the same answer in the preview and in the export.
//
// New in this project (not part of the pdoom-video engine).

/**
 * The part of the music analysis this module needs. `AudioData` (audio.ts) satisfies it, so scenes
 * pass `this.ctx.audio`.
 */
export interface BeatGrid {
  /** Times (s) of the first beat of every bar, ascending. */
  downbeats: number[];
  /** Continuous beat index at time t (0 at the first beat). */
  beatAt(t: number): number;
  /** Time (s) of a (fractional) beat index. */
  timeOfBeat(i: number): number;
}

/**
 * A position in the music, counted the way a musician counts it: both numbers start at ONE.
 * `{ bar: 1 }` is the first downbeat of the grid; `{ bar: 3, beat: 2 }` is the second beat of the
 * third bar; `{ bar: 3, beat: 2, fraction: 0.5 }` is the off-beat after it. Bars 0, -1 ... are the
 * bars before the first analysed downbeat (a pickup), at the spacing of the first two downbeats.
 */
export interface MusicalPosition {
  /** Bar number, 1-based (an integer). */
  bar: number;
  /** Beat within the bar, 1-based (default 1: the downbeat). A beat past the end of the bar runs on into the next. */
  beat?: number;
  /** How far on towards the next beat, 0 <= fraction < 1 (default 0). */
  fraction?: number;
}

/** A cue is on from `start` (inclusive) until `end` (exclusive). */
export interface BeatCue {
  start: MusicalPosition;
  end: MusicalPosition;
}

export interface CueState {
  /** True while tStart <= t < tEnd. */
  active: boolean;
  /** 0 before the cue, 1 after it, linear in time between. */
  progress: number;
  /** Song time (s) of the cue's start and end. */
  tStart: number;
  tEnd: number;
  /** Seconds since the start (negative before it) and until the end (negative after it). */
  elapsed: number;
  remaining: number;
}

/** Bars assumed to hold this many beats when the grid has no usable downbeats. */
const FALLBACK_BEATS_PER_BAR = 4;

/**
 * Time (s) of the downbeat of 0-based bar index `i`. Past either end of the analysed downbeats the
 * grid continues at the spacing of the nearest two. With fewer than two downbeats, bars are taken
 * to be four beats long, counted from the first beat (the same fallback as AudioData.barAt).
 */
function timeOfBarIndex(grid: BeatGrid, i: number): number {
  const d = grid.downbeats;
  const n = d.length;
  if (n < 2) return grid.timeOfBeat(i * FALLBACK_BEATS_PER_BAR);
  if (i <= 0) return d[0]! + i * (d[1]! - d[0]!);
  if (i >= n - 1) return d[n - 1]! + (i - (n - 1)) * (d[n - 1]! - d[n - 2]!);
  return d[i]!;
}

/**
 * Song time (s) of a musical position. The bar's downbeat is looked up in the grid, the beat it
 * falls on is found, and the position's beat and fraction are counted on from there along the beat
 * grid, so a tempo that drifts is followed beat by beat.
 */
export function timeOfPosition(grid: BeatGrid, pos: MusicalPosition): number {
  const { bar, beat = 1, fraction = 0 } = pos;
  if (!Number.isInteger(bar)) throw new RangeError(`bar must be an integer, got ${bar}`);
  if (!Number.isInteger(beat) || beat < 1) throw new RangeError(`beat must be an integer >= 1, got ${beat}`);
  if (!(fraction >= 0 && fraction < 1)) throw new RangeError(`fraction must be in [0, 1), got ${fraction}`);
  // the downbeat itself is returned as stored: going through the beat grid and back could move it by a rounding error
  const tBar = timeOfBarIndex(grid, bar - 1);
  if (beat === 1 && fraction === 0) return tBar;
  const downbeatIndex = Math.round(grid.beatAt(tBar));
  return grid.timeOfBeat(downbeatIndex + (beat - 1) + fraction);
}

/** 0-based index of the bar that holds song time t (the inverse of timeOfBarIndex). */
function barIndexAt(grid: BeatGrid, t: number): number {
  const d = grid.downbeats;
  const n = d.length;
  if (n < 2) return Math.floor(grid.beatAt(t) / FALLBACK_BEATS_PER_BAR);
  if (t < d[0]!) return Math.floor((t - d[0]!) / (d[1]! - d[0]!));
  if (t >= d[n - 1]!) return n - 1 + Math.floor((t - d[n - 1]!) / (d[n - 1]! - d[n - 2]!));
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d[m]! <= t) lo = m; else hi = m; }
  return lo;
}

/**
 * The musical position of song time t: the inverse of timeOfPosition. A readout that shows
 * `bar` and `beat` from here counts exactly as cues are written.
 */
export function positionAt(grid: BeatGrid, t: number): Required<MusicalPosition> {
  const barIndex = barIndexAt(grid, t);
  const downbeatIndex = Math.round(grid.beatAt(timeOfBarIndex(grid, barIndex)));
  const beats = Math.max(0, grid.beatAt(t) - downbeatIndex); // beats since the bar's downbeat
  const whole = Math.floor(beats);
  return { bar: barIndex + 1, beat: whole + 1, fraction: beats - whole };
}

/** Whether a cue is on at song time t, and how far through it is. */
export function cueStateAt(grid: BeatGrid, cue: BeatCue, t: number): CueState {
  const tStart = timeOfPosition(grid, cue.start);
  const tEnd = timeOfPosition(grid, cue.end);
  if (!(tEnd > tStart)) throw new RangeError(`cue ends (${tEnd.toFixed(3)} s) at or before it starts (${tStart.toFixed(3)} s)`);
  const progress = t <= tStart ? 0 : t >= tEnd ? 1 : (t - tStart) / (tEnd - tStart);
  return { active: t >= tStart && t < tEnd, progress, tStart, tEnd, elapsed: t - tStart, remaining: tEnd - t };
}
