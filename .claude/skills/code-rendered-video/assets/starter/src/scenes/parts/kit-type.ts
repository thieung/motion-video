// Shared kit: type. The three type voices, set with Canvas2D into a Layer2D, the two pieces of
// type that are the same in every shot (the counter and the caption), and type in motion (letters
// that rise from a line, letters on springs with a smear, a marquee, a ticker, a slot reel, an
// odometer, a headline of mixed voices, outlines bent along a curve).
// Read-only for scene authors.
//
// All positions are screen px. `y` is always the baseline unless a function says otherwise.
// Times given to the moving type are seconds since its start (`since` of kit-frame.ts).
import { rgba, type PaletteKey } from '../../engine/palette';
import { F, font, layout, measure, textPathCommands } from '../../engine/type';
import { clamp, ease, springRelease, springReleaseVel, springStep } from '../../engine/util';
import { W, H } from '../../engine/gl';
import { CAPTION, PLATE, rectW, UNIT } from './kit-frame';

type Ctx = CanvasRenderingContext2D;
export type Align = 'left' | 'right' | 'center';

/** Nothing on screen is set smaller than this: the film is watched on a phone. */
export const MIN_TYPE = 28 * UNIT;

export interface TextStyle { size?: number; align?: Align; colour?: PaletteKey | string; alpha?: number; weight?: number; tracking?: number }

function set(c: Ctx, family: string, size: number, colour: string, alpha: number, align: Align, tracking = 0) {
  c.font = font(family, Math.max(size, MIN_TYPE));
  c.fillStyle = rgba(colour, alpha);
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.letterSpacing = `${tracking}px`;
}

/** Display voice: section names and big words. */
export function display(c: Ctx, text: string, x: number, y: number, style: TextStyle = {}) {
  const { size = 120 * UNIT, align = 'left', colour = 'paper', alpha = 1, weight = 900, tracking = 0 } = style;
  set(c, F.display(weight), size, colour, alpha, align, tracking);
  c.fillText(text, x, y);
}

/** Caption voice: sentences and labels inside a picture. */
export function sentence(c: Ctx, text: string, x: number, y: number, style: TextStyle = {}) {
  const { size = 44 * UNIT, align = 'left', colour = 'paper', alpha = 1, weight = 700, tracking = 0 } = style;
  set(c, F.caption(weight), size, colour, alpha, align, tracking);
  c.fillText(text, x, y);
}

/** Machine voice: counters, small capitals, anything a computer would print. */
export function machine(c: Ctx, text: string, x: number, y: number, style: TextStyle = {}) {
  const { size = 30 * UNIT, align = 'left', colour = 'ash', alpha = 1, weight = 400 } = style;
  set(c, F.machine(weight), size, colour, alpha, align, style.tracking ?? size * 0.04);
  c.fillText(text, x, y);
}

/** Largest size, no more than `max`, at which every line fits in `width`. */
export function fitLines(lines: string[], family: string, width: number, max: number, min = MIN_TYPE) {
  let size = max;
  for (const l of lines) size = Math.min(size, (100 * width) / Math.max(1, measure(l, family, 100)));
  return Math.max(min, size);
}

/** Breaks a text into lines no wider than `width`. */
export function wrap(text: string, family: string, size: number, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, family, size) > width) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

// ---- the counter ---------------------------------------------------------------------------------

export interface CounterState {
  /** The number of the section, from 1. */
  n: number;
  /** The number of sections: the total the counter shows after the slash. */
  total: number;
  /** The section's name, or null while it is still to be revealed. */
  name: string | null;
  /** Seconds since the section began, and since the name was revealed (negative before). */
  sinceStart: number;
  sinceReveal: number;
  /** 0..1 within the current beat, for the caret. */
  beatPhase: number;
}

/**
 * The counter, top left: which section of how many, and its name once it has been shown. It sits
 * on its own dark plate, so it reads the same over any picture.
 */
export function counter(c: Ctx, s: CounterState) {
  const h = 68 * UNIT, pad = 24 * UNIT, x = PLATE.x0, y = PLATE.y0;
  const digits = Math.max(2, String(s.total).length);
  const num = `${String(s.n).padStart(digits, '0')}/${String(s.total).padStart(digits, '0')}`;
  const label = s.name ?? '???';
  const numSize = 30 * UNIT, nameSize = 34 * UNIT;
  const numW = measure(num, F.machine(700), numSize, numSize * 0.04);
  const nameW = measure(label, s.name ? F.caption(800) : F.machine(700), nameSize);
  const gap = 18 * UNIT, caretW = 14 * UNIT;
  const w = pad + numW + gap + nameW + gap * 0.7 + caretW + pad;
  // the plate drops in when the section begins, and gives a little when the name lands
  const enter = clamp(springStep(s.sinceStart, 3.2, 0.5), 0, 1.2);
  const bump = s.sinceReveal >= 0 ? 0.06 * Math.exp(-s.sinceReveal * 9) : 0;
  c.save();
  c.translate(x, y + h / 2);
  c.scale(1 + bump, (0.6 + 0.4 * enter) * (1 + bump));
  c.globalAlpha = clamp(s.sinceStart * 12);
  roundRect(c, 0, -h / 2, w, h, h / 2);
  // opaque: layers are blended in linear light, where a plate that lets 8% of a paper ground through turns grey
  c.fillStyle = rgba('ink');
  c.fill();
  c.lineWidth = 2 * UNIT;
  c.strokeStyle = rgba('paper', 0.16);
  c.stroke();
  const base = numSize * 0.36;
  machine(c, num, pad, base, { size: numSize, colour: 'ash', weight: 700 });
  if (s.name) sentence(c, label, pad + numW + gap, nameSize * 0.36, { size: nameSize, colour: 'paper', weight: 800 });
  else machine(c, label, pad + numW + gap, base, { size: nameSize, colour: 'paper', weight: 700 });
  // the caret: on for the first half of every beat
  if (s.beatPhase < 0.5) {
    c.fillStyle = rgba('signal');
    c.fillRect(pad + numW + gap + nameW + gap * 0.7, -nameSize * 0.48, caretW, nameSize * 0.96);
  }
  c.restore();
}

// ---- the caption ---------------------------------------------------------------------------------

export interface CaptionState {
  lines: string[];
  /** Small capitals over the sentence, and the colour of the bar beside it. */
  label?: string;
  accent: PaletteKey;
  /** Beats since the caption began (the frame's own clock: lines step in). */
  beats: number;
  /** Seconds since the caption began (the sample's clock: the plate moves). */
  since: number;
  /** Largest type size. Long captions are set smaller so that they fit. */
  max?: number;
  /** Where the plate stands: on the bottom edge of the caption zone, under the counter, or across the middle. */
  place?: 'top' | 'middle' | 'bottom';
  /** A stand-in for words the finished shot will set itself, or do without: drawn faint, with a dashed edge. */
  ghost?: boolean;
}

/**
 * A caption: a sentence on a dark plate, a line at a time. At the bottom the plate stands on the
 * bottom edge of the caption zone and grows upwards; at the top it hangs under the counter and
 * grows downwards; in the middle it is centred on the frame, left to right and top to bottom.
 */
export function caption(c: Ctx, s: CaptionState) {
  const family = F.caption(700);
  const padX = 34 * UNIT, padY = 26 * UNIT, bar = 10 * UNIT, gapBar = 22 * UNIT;
  const room = rectW(CAPTION) - 2 * padX - bar - gapBar;
  const size = fitLines(s.lines, family, room, s.max ?? 54 * UNIT, 36 * UNIT);
  const lead = size * 1.26;
  const labelSize = 28 * UNIT;
  const labelH = s.label ? labelSize * 1.5 : 0;
  const textW = Math.max(...s.lines.map((l) => measure(l, family, size)), s.label ? measure(s.label, F.machine(700), labelSize, labelSize * 0.08) : 0);
  const w = padX + bar + gapBar + textW + padX;
  const h = padY + labelH + s.lines.length * lead + padY * 0.7;
  const place = s.place ?? 'bottom';
  const x = place === 'middle' ? W / 2 - w / 2 : CAPTION.x0;
  const y = place === 'bottom' ? CAPTION.y1 - h : place === 'top' ? PLATE.y0 + 100 * UNIT : H / 2 - h / 2;
  // the edge the plate grows from
  const anchor = place === 'bottom' ? y + h : place === 'top' ? y : y + h / 2;

  const pop = springStep(s.since, 3.4, 0.55);
  c.save();
  c.translate(x, anchor);
  c.scale(1, 0.75 + 0.25 * pop);
  c.translate(-x, -anchor);
  c.globalAlpha = clamp(s.since * 14);
  roundRect(c, x, y, w, h, 22 * UNIT);
  // opaque: layers are blended in linear light, where a plate that lets 8% of a paper ground through turns grey
  c.fillStyle = rgba(s.ghost ? 'ink2' : 'ink');
  c.fill();
  c.lineWidth = 2 * UNIT;
  c.strokeStyle = rgba('paper', s.ghost ? 0.55 : 0.16);
  if (s.ghost) c.setLineDash([14 * UNIT, 10 * UNIT]);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = rgba(s.accent);
  roundRect(c, x + padX, y + padY, bar, h - padY * 1.7, bar / 2);
  c.fill();
  const tx = x + padX + bar + gapBar;
  let ty = y + padY;
  if (s.label) {
    machine(c, s.label, tx, ty + labelSize * 0.86, { size: labelSize, colour: s.accent, weight: 700, tracking: labelSize * 0.08 });
    ty += labelH;
  }
  // one line every half beat, the first with the plate
  s.lines.forEach((l, i) => {
    if (s.beats < i * 0.5) return;
    sentence(c, l, tx, ty + i * lead + size * 0.92, { size, colour: 'paper', weight: 700 });
  });
  c.restore();
}

// ---- type in motion ------------------------------------------------------------------------------

/** How a moving word is set: its face (a family from F), size, colour, tracking and alignment. */
export interface MoveStyle { family: string; size: number; colour?: PaletteKey | string; tracking?: number; align?: Align }

const startX = (x: number, width: number, align: Align = 'left') => (align === 'center' ? x - width / 2 : align === 'right' ? x - width : x);
/** A spring from rest, 0 to 1, and its speed (per second): 1 + springRelease(t, -1, 0). */
const rise = (t: number, freq: number, damping: number) => ({ k: 1 + springRelease(t, -1, 0, freq, damping), v: springReleaseVel(t, -1, 0, freq, damping) });

export interface Motion {
  /** Seconds of the shutter: the smear is the distance the thing travels in this time. 0.03 blurs, 0.08 and more smears. */
  shutter?: number;
  /** Px between the copies that make the smear (smaller is smoother and costs more), and the most copies drawn. */
  spacing?: number;
  maxCopies?: number;
  /** The size of the thing along its motion (px): how many copies overlap on one pixel. For a letter, its size. */
  extent?: number;
  /** How dense the smear is right behind the thing, 0..1. */
  density?: number;
  /** Colour fringe: px of split per 1000 px/s of speed, and the two colours (drawn behind, one each side). */
  fringe?: number;
  fringeColours?: [string, string];
  /** Below this speed (px/s) nothing is smeared. */
  still?: number;
}

/**
 * Draws a moving thing with a drawn smear: `draw(dx, dy)` draws it offset by (dx, dy), with the
 * context's fill and stroke already set. The thing moves at (vx, vy) px/s. Behind it: two fringe
 * copies in the fringe colours, split along the motion, then copies back along its path over the
 * shutter, each faint enough that together they fade from `density` behind the thing to nothing;
 * on top, the thing itself. Live playback has no motion blur, so a fast thing that should streak
 * is drawn streaking. Costs one draw per copy: keep it to the letters that are moving fast.
 */
export function withMotion(c: Ctx, vx: number, vy: number, m: Motion, draw: (dx: number, dy: number) => void) {
  const speed = Math.hypot(vx, vy);
  if (speed > (m.still ?? 60)) {
    const len = speed * (m.shutter ?? 0.03);
    const n = Math.max(1, Math.min(m.maxCopies ?? 32, Math.ceil(len / (m.spacing ?? 3))));
    // how many copies lie over one pixel of the smear
    const over = Math.max(1, Math.min(n, ((m.extent ?? 100) * n) / Math.max(1, len)));
    const f = ((m.fringe ?? 0) * speed) / 1000;
    if (f > 0.3) {
      const ux = vx / speed, uy = vy / speed, [ca, cb] = m.fringeColours ?? ['#FF2BD6', '#00D8FF'];
      c.save();
      c.globalAlpha *= 0.8;
      c.fillStyle = rgba(ca); c.strokeStyle = rgba(ca); draw(-ux * f, -uy * f);
      c.fillStyle = rgba(cb); c.strokeStyle = rgba(cb); draw(ux * f, uy * f);
      c.restore();
    }
    const a0 = c.globalAlpha, dens = m.density ?? 0.7;
    for (let j = n; j >= 1; j--) {
      const u = j / n;
      // each copy's opacity, so that `over` of them together reach the density wanted at u
      c.globalAlpha = a0 * (1 - Math.pow(1 - dens * Math.pow(1 - u, 1.3), 1 / over));
      draw(-vx * (len / speed) * u, -vy * (len / speed) * u);
    }
    c.globalAlpha = a0;
  }
  draw(0, 0);
}

/**
 * A vertical blur drawn by copies: `draw(dy)` draws the thing offset by dy; it is drawn over a
 * span of `blur` px centred on its place, as a wheel or a reel turning fast looks through a
 * shutter. The copies are 3 px apart and faint enough to add up to about the thing's own opacity.
 */
export function blurY(c: Ctx, blur: number, draw: (dy: number) => void) {
  if (blur < 2) { draw(0); return; }
  const n = Math.min(24, Math.ceil(blur / 3));
  const a0 = c.globalAlpha, a = 1 - Math.pow(1 - 0.92, 1 / (n + 1));
  for (let j = 0; j <= n; j++) { c.globalAlpha = a0 * a; draw((j / n - 0.5) * blur); }
  c.globalAlpha = a0;
}

/**
 * Letters that rise out of a line: each letter comes up from under its own baseline, a spring per
 * letter, `stagger` seconds apart, and nothing shows below the mask line (a little under the
 * descenders). The word "arrives" without fading. `since` in seconds.
 */
export function riseFromLine(c: Ctx, text: string, x: number, y: number, s: MoveStyle, since: number, stagger = 0.045, freq = 2.4, damping = 0.8) {
  const lay = layout(text, s.family, s.size, s.tracking ?? 0);
  const x0 = startX(x, lay.width, s.align);
  c.save();
  c.beginPath();
  c.rect(x0 - s.size, y - s.size * 1.6, lay.width + 2 * s.size, s.size * 1.6 + s.size * 0.28);
  c.clip();
  c.font = font(s.family, s.size);
  c.fillStyle = rgba(s.colour ?? 'paper');
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  lay.glyphs.forEach((g, i) => {
    const a = since - i * stagger;
    if (a <= 0) return;
    const { k } = rise(a, freq, damping);
    c.fillText(g.ch, x0 + g.x, y + (1 - k) * s.size * 1.25);
  });
  c.restore();
}

export interface SpringLetterStyle extends MoveStyle, Motion {
  /** Where each letter comes from, as an offset from its place (px), and the scale it starts at. */
  from?: [number, number];
  scaleFrom?: number;
  /** Seconds between letters, and the spring. */
  stagger?: number;
  freq?: number;
  damping?: number;
  /** Letters (by index) set in another colour: the accent. */
  accent?: { colour: PaletteKey | string; letters: number[] };
}

/**
 * A spring per letter: each letter flies in from `from`, overshoots and settles, `stagger` seconds
 * after the one before, smeared along its motion while it is fast and split into two fringe colours
 * (withMotion). The speed comes from the spring itself, so the smear is exact at any time.
 */
export function springLetters(c: Ctx, text: string, x: number, y: number, s: SpringLetterStyle, since: number) {
  const lay = layout(text, s.family, s.size, s.tracking ?? 0);
  const x0 = startX(x, lay.width, s.align);
  const [fx, fy] = s.from ?? [0, s.size * 0.9], sc0 = s.scaleFrom ?? 1;
  c.save();
  c.font = font(s.family, s.size);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  lay.glyphs.forEach((g, i) => {
    const a = since - i * (s.stagger ?? 0.06);
    if (a <= 0) return;
    const { k, v } = rise(a, s.freq ?? 2.6, s.damping ?? 0.55);
    const cx = x0 + g.x + g.w / 2 + fx * (1 - k), cy = y + fy * (1 - k);
    const scale = sc0 + (1 - sc0) * k;
    const colour = s.accent?.letters.includes(i) ? s.accent.colour : s.colour ?? 'paper';
    c.save();
    c.globalAlpha = clamp(a * 10);
    c.fillStyle = rgba(colour);
    withMotion(c, -fx * v, -fy * v, { extent: s.size * 0.8, ...s }, (dx, dy) => {
      c.save();
      c.translate(cx + dx, cy + dy);
      if (scale !== 1) c.scale(scale, scale);
      c.fillText(g.ch, 0, 0);
      c.restore();
    });
    c.restore();
  });
  c.restore();
}

/**
 * A word set in outline or in fill. Outline traces the letters at `line` px, outside their shape:
 * the stroke is drawn twice as wide and the inside of the letters is then cut away, which also
 * removes the lines where a face's contours overlap inside a letter (the starter's display face
 * has such overlaps, and a plain strokeText shows them). The cut erases whatever the layer held
 * under the letters, so set outlined words on a layer of their own or before what lies under them.
 */
export function setWord(c: Ctx, text: string, x: number, y: number, outline: boolean, line: number) {
  if (!outline) { c.fillText(text, x, y); return; }
  c.lineWidth = line * 2; c.lineJoin = 'round';
  c.strokeText(text, x, y);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  c.fillText(text, x, y);
  c.restore();
}

export interface MarqueeStyle extends MoveStyle {
  /** The texts of the rows, repeated round. Each row repeats its text end to end. */
  rows: string[];
  /** Turn of the whole band (radians; about -0.15 for the usual tilt). */
  angle?: number;
  /** Distance between baselines (px). Default 1.1 times the size. */
  lead?: number;
  /** Between two repeats of a text. */
  sep?: string;
  /** Per row, in turn: fill or outline, and colours. */
  outline?: boolean[];
  colours?: (PaletteKey | string)[];
  /** Neighbouring rows run in opposite directions. Default true. */
  alternate?: boolean;
  /** The centre of the band (default the middle of the frame). */
  at?: [number, number];
}

/**
 * An endless tilted marquee: rows of words that run sideways for ever, filling the frame, turned
 * by `angle`. `offset` is how far the rows have run (px): speed times time, which may grow without
 * limit. Rows alternate direction, fill and outline.
 */
export function marquee(c: Ctx, s: MarqueeStyle, offset: number) {
  const lead = s.lead ?? s.size * 1.1, sep = s.sep ?? '  •  ', diag = Math.hypot(W, H);
  const [cx, cy] = s.at ?? [W / 2, H / 2];
  c.save();
  c.translate(cx, cy);
  c.rotate(s.angle ?? -0.15);
  c.font = font(s.family, s.size);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.letterSpacing = `${s.tracking ?? 0}px`;
  const rows = Math.ceil(diag / lead) + 2;
  for (let r = 0; r < rows; r++) {
    const ry = -diag / 2 + r * lead;
    const text = s.rows[r % s.rows.length]! + sep;
    const unit = measure(text, s.family, s.size, s.tracking ?? 0);
    const dir = (s.alternate ?? true) && r % 2 ? -1 : 1;
    const shift = (((offset * dir) % unit) + unit) % unit;
    const colour = s.colours?.[r % s.colours.length] ?? s.colour ?? 'paper';
    const outline = s.outline?.[r % s.outline.length] ?? false;
    c.fillStyle = rgba(colour); c.strokeStyle = rgba(colour);
    for (let x = -diag / 2 - unit + shift; x < diag / 2; x += unit) setWord(c, text, x, ry, outline, Math.max(1.5, s.size * 0.025));
  }
  c.restore();
}

/**
 * A ticker: one row of items running right to left inside a box, separated by a dot, fading out
 * at both ends, on an optional plate that fills the box. `offset` in px, as for the marquee. The
 * fade erases what the layer holds at the ends of the box, so the plate is laid in behind the
 * text afterwards; anything else the layer holds there is erased too.
 */
export function ticker(c: Ctx, items: string[], box: { x: number; y: number; w: number; h: number }, s: MoveStyle, offset: number, sep = '   ·   ', plate?: PaletteKey | string) {
  const text = items.join(sep) + sep;
  const unit = measure(text, s.family, s.size, s.tracking ?? 0);
  const base = box.y + box.h / 2 + s.size * 0.35;
  c.save();
  c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
  c.font = font(s.family, s.size);
  c.fillStyle = rgba(s.colour ?? 'paper');
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.letterSpacing = `${s.tracking ?? 0}px`;
  const shift = ((offset % unit) + unit) % unit;
  for (let x = box.x - shift; x < box.x + box.w; x += unit) c.fillText(text, x, base);
  // the ends fade out
  c.globalCompositeOperation = 'destination-out';
  const fw = Math.min(box.w * 0.12, 120);
  for (const [x0, x1] of [[box.x, box.x + fw], [box.x + box.w, box.x + box.w - fw]] as [number, number][]) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(Math.min(x0, x1), box.y, fw, box.h);
  }
  if (plate) { c.globalCompositeOperation = 'destination-over'; c.fillStyle = rgba(plate); c.fillRect(box.x, box.y, box.w, box.h); }
  c.restore();
}

/**
 * A slot-machine reel: `items` on a drum seen through a window (`box`), the item at position `pos`
 * (an index, fractions between) in the middle. Items further from the middle fade, as a drum turns
 * away; while the reel runs fast (`speed` in items per second) each item is smeared up and down.
 */
export function reel(c: Ctx, items: string[], box: { x: number; y: number; w: number; h: number }, s: MoveStyle, pos: number, speed = 0, shutter = 0.03) {
  const n = items.length, pitch = s.size * 1.25, mid = box.y + box.h / 2;
  const blur = Math.min(pitch * 0.9, Math.abs(speed) * pitch * shutter);
  c.save();
  c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
  c.font = font(s.family, s.size);
  c.fillStyle = rgba(s.colour ?? 'paper');
  c.textAlign = s.align ?? 'center'; c.textBaseline = 'middle';
  c.letterSpacing = `${s.tracking ?? 0}px`;
  const tx = s.align === 'left' ? box.x : s.align === 'right' ? box.x + box.w : box.x + box.w / 2;
  const reach = Math.ceil(box.h / pitch / 2) + 1;
  const base = Math.floor(pos);
  for (let j = base - reach; j <= base + reach + 1; j++) {
    const item = items[((j % n) + n) % n]!;
    const dy = (j - pos) * pitch;
    const y = mid + dy;
    // the drum turns away: squeezed and faded towards the edges of the window
    const off = clamp(Math.abs(dy) / (box.h / 2));
    const fade = 1 - off * off;
    if (fade <= 0) continue;
    c.save();
    c.translate(tx, y);
    c.scale(1, 0.55 + 0.45 * Math.cos(off * Math.PI / 2));
    c.globalAlpha = fade;
    blurY(c, blur, (d) => c.fillText(item, 0, d));
    c.restore();
  }
  c.restore();
}

/**
 * The run of a slot reel: from item `from` it spins `turns` whole rounds of `n` items and lands on
 * item `to`, over `dur` seconds: hard start, a fast run, a slow landing with a small clunk past
 * the item and back. Returns the position for `reel` and its speed in items per second.
 */
export function reelSpin(since: number, dur: number, from: number, to: number, n: number, turns = 3) {
  const total = ((((to - from) % n) + n) % n) + turns * n;
  const at = (t: number) => from + total * ease.outBack(clamp(t / dur), 0.9);
  const pos = at(since);
  const h = 1 / 240;
  return { pos, speed: (at(since + h) - at(since - h)) / (2 * h) };
}

export interface OdometerStyle extends MoveStyle {
  /** Digits shown (leading zeros are drawn faint). Default: as many as the value needs. */
  digits?: number;
  /** A comma (or the given mark) between groups of three. */
  group?: string;
  /** Seconds of shutter for the rolling blur. */
  shutter?: number;
}

/**
 * An odometer: each digit is a wheel. The ones wheel turns with the value; a higher wheel turns
 * only while every wheel below it rolls over from 9 to 0, as on a car's counter. `speed` is how
 * fast the value changes (per second): wheels that turn fast are blurred up and down. Set it in a
 * face with digits of equal width (the machine voice has them).
 */
export function odometer(c: Ctx, value: number, x: number, y: number, s: OdometerStyle, speed = 0) {
  const v = Math.max(0, value);
  const need = Math.max(1, Math.floor(v).toString().length);
  const digits = Math.max(s.digits ?? need, need);
  c.save();
  c.font = font(s.family, s.size);
  c.letterSpacing = '0px';
  const dw = Math.max(...'0123456789'.split('').map((d) => c.measureText(d).width)) + (s.tracking ?? 0);
  const gw = s.group ? c.measureText(s.group).width : 0;
  const groups = s.group ? Math.floor((digits - 1) / 3) : 0;
  const width = digits * dw + groups * gw;
  let cx = startX(x, width, s.align);
  const pitch = s.size * 1.1, sh = s.shutter ?? 0.03;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const col = s.colour ?? 'paper';
  for (let i = digits - 1; i >= 0; i--) {
    const p = Math.pow(10, i);
    // this wheel's position: its digit, plus the roll while every lower wheel passes 9
    const lower = v % p;
    const roll = i === 0 ? v % 1 : clamp(lower - (p - 1));
    const w = (Math.floor(v / p) % 10) + roll;
    const d = Math.floor(w), f = w - d;
    const lead = v < p && i > 0 && Math.floor(v / p) === 0 && roll === 0;
    // how fast this wheel turns (digits per second): the ones with the value, the others only while they roll
    const wheelSpeed = i === 0 ? Math.abs(speed) : roll > 0 && roll < 1 ? Math.abs(speed) : Math.abs(speed) / p;
    const blur = Math.min(pitch * 0.6, wheelSpeed * pitch * sh);
    c.save();
    c.beginPath(); c.rect(cx, y - s.size * 1.05, dw, s.size * 1.35); c.clip();
    c.fillStyle = rgba(col, lead ? 0.25 : 1);
    const cxm = cx + dw / 2;
    const draw = (digit: number, yy: number) => blurY(c, blur, (dy) => c.fillText(String(digit % 10), cxm, yy + dy));
    draw(d, y - f * pitch);
    if (f > 0) draw(d + 1, y + (1 - f) * pitch);
    c.restore();
    cx += dw;
    if (s.group && i > 0 && i % 3 === 0) {
      c.fillStyle = rgba(col, v >= p ? 1 : 0.25);
      c.textAlign = 'left';
      c.fillText(s.group, cx, y);
      c.textAlign = 'center';
      cx += gw;
    }
  }
  c.restore();
}

/** One run of a headline: its text, face and size, and optionally its colour and a slant. */
export interface Run { text: string; family: string; size: number; colour?: PaletteKey | string; tracking?: number; slant?: number }

/**
 * A line set in several voices on one baseline: a sans headline with one word in a serif, a word
 * in the accent colour, a slanted word. `slant` (radians, about 0.2) leans a run to the right:
 * the starter's faces have no italic, so a slant is an oblique made by the drawing, not a true
 * italic (which has other letter shapes); for a real italic add its font files. Returns the width.
 */
export function runs(c: Ctx, parts: Run[], x: number, y: number, align: Align = 'left') {
  const widths = parts.map((p) => measure(p.text, p.family, p.size, p.tracking ?? 0));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = startX(x, total, align);
  c.save();
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  parts.forEach((p, i) => {
    c.font = font(p.family, p.size);
    c.letterSpacing = `${p.tracking ?? 0}px`;
    c.fillStyle = rgba(p.colour ?? 'paper');
    if (p.slant) {
      c.save();
      c.translate(cx, y);
      c.transform(1, 0, -Math.tan(p.slant), 1, 0, 0);
      c.fillText(p.text, 0, 0);
      c.restore();
    } else c.fillText(p.text, cx, y);
    cx += widths[i]!;
  });
  c.restore();
  return total;
}

/**
 * The outline of a text as a Path2D, every point moved by `warp` (x, y in px of the text set at
 * (0, 0) on its baseline -> where that point goes). Curves are cut into short straight pieces
 * first (`step` px), so a warp bends them smoothly. For type on an arc, on a wave, squeezed into a
 * point, or used as a mask (`c.clip(path)`).
 */
export function bentText(text: string, family: string, size: number, warp: (x: number, y: number) => [number, number], step = 4, tracking = 0): Path2D {
  const cmds = textPathCommands(text, family, size, 0, 0, tracking);
  const p = new Path2D();
  let px = 0, py = 0, sx = 0, sy = 0;
  const to = (x: number, y: number) => { const [a, b] = warp(x, y); p.lineTo(a, b); };
  for (const cm of cmds) {
    if (cm.type === 'M') { const [a, b] = warp(cm.x, cm.y); p.moveTo(a, b); px = sx = cm.x; py = sy = cm.y; continue; }
    if (cm.type === 'Z') { p.closePath(); px = sx; py = sy; continue; }
    const n = Math.max(1, Math.ceil(Math.hypot(cm.x - px, cm.y - py) / step));
    for (let j = 1; j <= n; j++) {
      const t = j / n, u = 1 - t;
      if (cm.type === 'L') to(px + (cm.x - px) * t, py + (cm.y - py) * t);
      else if (cm.type === 'Q') to(u * u * px + 2 * u * t * cm.x1 + t * t * cm.x, u * u * py + 2 * u * t * cm.y1 + t * t * cm.y);
      else if (cm.type === 'C') to(u * u * u * px + 3 * u * u * t * cm.x1 + 3 * u * t * t * cm.x2 + t * t * t * cm.x, u * u * u * py + 3 * u * u * t * cm.y1 + 3 * u * t * t * cm.y2 + t * t * t * cm.y);
    }
    px = cm.x; py = cm.y;
  }
  return p;
}

/** A warp for bentText: the baseline bent onto a circle of radius `r` round (cx, cy), starting at angle `a0` (radians, clockwise from the right). */
export const onArc = (cx: number, cy: number, r: number, a0 = -Math.PI / 2) => (x: number, y: number): [number, number] => {
  const a = a0 + x / r, rr = r - y;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
};

/** A warp for bentText: the baseline as a wave of height `amp` and length `len` (px), moved along by `phase` (radians), set at (x0, y0). */
export const onWave = (x0: number, y0: number, amp: number, len: number, phase = 0) => (x: number, y: number): [number, number] =>
  [x0 + x, y0 + y + amp * Math.sin((x / len) * Math.PI * 2 + phase)];
