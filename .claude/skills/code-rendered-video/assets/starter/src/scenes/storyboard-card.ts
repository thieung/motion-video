// The storyboard card: plays every shot that has not been built yet. It shows what the storyboard
// says the shot will be, and beats with the music, so the rhythm of the cut can be judged before
// any picture exists. One module serves all such shots; the shot is found from the entry's id.
// The describing blocks are laid out once, in one column or two (two in a landscape frame, or when
// one column does not fit), at the largest size that fits between the title and the beat squares,
// measured at the size they are drawn at. The card may set its text below the kit's MIN_TYPE,
// down to 22 units, before it cuts a block short: it is a working card read in the studio, not a
// picture of the film.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, clearRT, W, H } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { shotOf, TRANSITIONS, type Shot } from '../film';
import { frameClock, groove, rectW, SAFE, sceneClock, STAGE, UNIT } from './parts/kit-frame';
import { postFor } from './parts/kit-post';
import { display, machine, MIN_TYPE, roundRect, wrap } from './parts/kit-type';

/**
 * The bars a shot covers. Whole bars are named first to last ("BARS 2 TO 3" is bars 2 and 3). A
 * shot that starts or ends inside a bar is named by its start and length ("FROM BAR 3.25, 1.75
 * BARS"), which cannot be read as ending at a bar it only enters.
 */
const barsLabel = (bar: number, bars: number) => {
  if (Number.isInteger(bar) && Number.isInteger(bars)) return bars === 1 ? `BAR ${bar}` : `BARS ${bar} TO ${bar + bars - 1}`;
  return `FROM BAR ${+bar.toFixed(3)}, ${+bars.toFixed(3)} BAR${bars === 1 ? '' : 'S'}`;
};

/** Line height of the text as a share of its size; the gap between two columns; the smallest text size the card uses. */
const LEAD = 48 / 36, COL_GAP = 48 * UNIT, FLOOR = 22 * UNIT;

interface Block { label: string; lines: string[] }
/** The blocks laid out: text size, label size, the blocks of each column, and whether all of it fits. */
interface Layout { size: number; label: number; colW: number; columns: Block[][]; fits: boolean }

export default class StoryboardCard extends Scene {
  private layer = new Layer2D();
  private shot!: Shot;
  private layout!: Layout;

  override init() {
    this.shot = shotOf(this.ctx.id);
    const s = this.shot;
    const raw: [string, string][] = [['ON SCREEN', s.see], ['WITH THE MUSIC', s.move], ['CAMERA', s.camera]];
    if (s.in) raw.push(['COMES IN BY', TRANSITIONS[s.in.kind]?.label ?? s.in.kind]);
    raw.push(['LOOK', s.look]);
    const w = rectW(SAFE) - 64 * UNIT;
    const room = this.squaresTop() - 30 * UNIT - this.textTop();
    // one column first in a tall frame, two in a wide one; the kit's smallest size before a smaller one
    const cols = W > H ? [2] : [1, 2];
    const tries: [number, number][] = [];
    for (const [hi, lo] of [[36 * UNIT, MIN_TYPE], [MIN_TYPE - UNIT, FLOOR]] as const)
      for (const n of cols) for (let size = hi; size >= lo - 1e-6; size -= UNIT) tries.push([n, size]);
    let last: Layout | null = null;
    for (const [n, size] of tries) {
      last = this.lay(raw, n, size, w, room);
      if (last.fits) break;
    }
    this.layout = last!;
  }

  /** Where the first label stands (its baseline). */
  private textTop() { return STAGE.y0 + 106 * UNIT; }

  /** The blocks at one size in n columns, split where the taller column is lowest. */
  private lay(raw: [string, string][], n: number, size: number, w: number, room: number): Layout {
    const label = 28 * UNIT; // (the machine voice is never set below the kit's MIN_TYPE)
    const colW = (w - (n - 1) * COL_GAP) / n;
    const blocks: Block[] = raw.map(([l, text]) => ({ label: l, lines: wrap(text, F.caption(500), size, colW) }));
    const h = blocks.map((b) => this.blockHeight(b, size, label));
    let columns: Block[][] = [blocks], tallest = h.reduce((a, b) => a + b, 0);
    if (n === 2) {
      tallest = Infinity;
      for (let k = 1; k < blocks.length; k++) {
        const a = h.slice(0, k).reduce((x, y) => x + y, 0), b = h.slice(k).reduce((x, y) => x + y, 0);
        if (Math.max(a, b) < tallest) { tallest = Math.max(a, b); columns = [blocks.slice(0, k), blocks.slice(k)]; }
      }
    }
    // (the gap after the last block of a column is not needed to fit)
    return { size, label, colW, columns, fits: tallest - size * 0.6 <= room };
  }

  private blockHeight(b: Block, size: number, label: number) {
    return label * 1.7 + b.lines.length * size * LEAD + size * 0.6;
  }

  /** Where the rows of beat squares begin: one square per beat, sixteen to a row. */
  private squaresTop() {
    const n = Math.round(this.ctx.audio.beatAt(this.ctx.end) - this.ctx.audio.beatAt(this.ctx.start));
    return STAGE.y1 - 30 * UNIT - Math.ceil(Math.max(1, n) / 16) * (22 * UNIT + 12 * UNIT);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio } = this.ctx;
    const s = this.shot;
    const dark = s.tone === 'dark';
    const fg = dark ? 'paper' : 'ink', dim = dark ? 'ash' : 'graphite';
    const k = sceneClock(audio, f), kf = frameClock(audio, f);
    clearRT(renderer, out, dark ? LIN.ink : LIN.paper);

    const c = this.layer.ctx;
    this.layer.clear();
    const x = SAFE.x0, w = rectW(SAFE) - 64 * UNIT;

    // the card is a placeholder, and says so: dashed border, no picture
    c.save();
    c.strokeStyle = rgba(dim, 0.5);
    c.lineWidth = 3 * UNIT;
    c.setLineDash([18 * UNIT, 14 * UNIT]);
    const bx = SAFE.x0 - 36 * UNIT, by = STAGE.y0 - 140 * UNIT;
    roundRect(c, bx, by, SAFE.x1 + 36 * UNIT - bx, STAGE.y1 + 20 * UNIT - by, 28 * UNIT);
    c.stroke();
    c.restore();

    let y = STAGE.y0 - 70 * UNIT;
    // the header line keeps to the safe width: a long id or a span in fractions of a bar sets it
    // smaller, down to FLOOR (set directly, since machine() never goes below MIN_TYPE)
    const head = `CARD  ·  ${s.id}  ·  ${barsLabel(s.bar, s.bars)}`.toUpperCase();
    const headW = measure(head, F.machine(700), 28 * UNIT, 28 * UNIT * 0.04);
    const headSize = Math.max(FLOOR, Math.min(28 * UNIT, (28 * UNIT * rectW(SAFE)) / headW));
    if (headSize >= 28 * UNIT) machine(c, head, x, y, { size: headSize, colour: dim, weight: 700 });
    else {
      c.font = font(F.machine(700), headSize);
      c.fillStyle = rgba(dim);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.letterSpacing = `${headSize * 0.04}px`;
      c.fillText(head, x, y);
    }
    y += 92 * UNIT;
    // the title gives on every beat
    const bump = 1 + 0.035 * groove(k.beats, 1, 0, 0.2);
    c.save();
    c.translate(x, y);
    c.scale(bump, bump);
    const titleSize = Math.min(84 * UNIT, (84 * UNIT * w) / Math.max(w, measure(s.title, F.display(900), 84 * UNIT)));
    display(c, s.title, 0, 0, { size: titleSize, colour: fg, weight: 900 });
    c.restore();
    y += 84 * UNIT;

    // the describing blocks, column by column; text set directly at the laid-out size (see the top)
    const L = this.layout, bottom = this.squaresTop() - 30 * UNIT;
    L.columns.forEach((col, ci) => {
      const cx = x + ci * (L.colW + COL_GAP);
      let cy = this.textTop();
      for (const b of col) {
        if (cy > bottom) break;
        machine(c, b.label, cx, cy, { size: L.label, colour: 'signal', weight: 700, tracking: 2.4 * UNIT });
        cy += L.label * 1.7;
        c.font = font(F.caption(500), L.size);
        c.fillStyle = rgba(fg);
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.letterSpacing = '0px';
        for (let i = 0; i < b.lines.length; i++) {
          // a block that does not fit even at the smallest size is cut short, and says so
          const more = i + 1 < b.lines.length || col.indexOf(b) + 1 < col.length;
          const last = !L.fits && cy + L.size * LEAD > bottom && more;
          c.fillText(last ? `${b.lines[i]} …` : b.lines[i]!, cx, cy);
          cy += L.size * LEAD;
          if (last) { cy = Infinity; break; }
        }
        cy += L.size * 0.6;
      }
    });

    // the beats of the shot, four to a bar; the one playing is lit
    const n = k.length, perRow = 16, sq = 22 * UNIT, gap = 12 * UNIT;
    const top = this.squaresTop();
    for (let i = 0; i < n; i++) {
      const qx = x + (i % perRow) * (sq + gap) + Math.floor((i % perRow) / 4) * gap * 1.5;
      const qy = top + Math.floor(i / perRow) * (sq + gap);
      const now = i === Math.floor(kf.beats + 1e-6);
      c.fillStyle = now ? rgba('signal') : i < kf.beats ? rgba(fg, 0.7) : rgba(dim, 0.35);
      roundRect(c, qx, qy, sq, sq, 5 * UNIT);
      c.fill();
    }
    comp.draw(renderer, this.layer.upload(), out);
    return postFor(s.tone);
  }

  override dispose() {
    this.layer.texture.dispose();
  }
}
