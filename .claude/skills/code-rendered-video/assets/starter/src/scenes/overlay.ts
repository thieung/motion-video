// The overlay: the counter and the captions, drawn over every shot. It is an overlay entry of the
// timeline (see engine.ts), so `out` holds the finished picture of the shot and must not be cleared.
//
// What is shown when is data: the captions and the bar at which each section's name is revealed
// come from shots.json, the words from copy.json (both through film.ts). Only numbered sections
// (groups of kind `section`) carry a counter and captions; the title, the recap and the end card
// set their own words.
//
// Voice captions are the other kind of words the overlay sets: the caption groups of a voice-over,
// which scripts/make-score.ts writes into data/lyrics.json, each with the id of its phrase. They are
// told apart from sung lyrics by that id (`phrase`), and from the plates by their look: a plain
// pill centred at the foot of the frame, with no label and no bar, over every shot of the film,
// the words not yet spoken a little dimmer. Burned-in captions at the foot are the normal choice for
// a film led by a voice and watched with the sound off; a plate at the bottom would sit on them, and
// bun run score warns when one does. Sung lyrics are not drawn here: a lyric film sets them in its shots.
import type * as THREE from 'three';
import { Scene, type Frame } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import { CAPTIONS, COPY, GROUPS, SECTION_COUNT, SECTIONS, SHOTS, type Caption } from '../film';
import type { Line } from '../engine/lyrics';
import { measure, F } from '../engine/type';
import { rgba } from '../engine/palette';
import { clamp } from '../engine/util';
import { CAPTION, UNIT, frameTime } from './parts/kit-frame';
import { TYPE_TINT } from './parts/kit-post';
import { caption, counter, fitLines, roundRect, sentence } from './parts/kit-type';

/** The label over a plate that stands in, over a card, for words the finished shot sets itself or does without. */
const GHOST_LABEL = { shot: 'THE SHOT SETS THESE WORDS', none: 'NO WORDS: THE PICTURE SAYS IT' } as const;

/** How voice captions look. `dim` is the opacity of the words not yet spoken (1 shows them all alike). */
const VOICE = { max: 58, min: 40, dim: 0.5 } as const;

/**
 * A caption group of the voice-over: a pill centred on the caption zone, standing on its foot. The
 * rows are those the lead wrote; every word is set as it will be spoken, and the words not yet
 * spoken are dimmer. `tf` is the frame's own time (which words are spoken steps), `t` the sample's
 * time (the fade moves).
 */
function voiceCaption(c: CanvasRenderingContext2D, line: Line, tf: number, t: number) {
  const family = F.caption(700);
  const rows = line.rows?.length ? line.rows : [line.text];
  const padX = 34 * UNIT, padY = 20 * UNIT;
  const room = CAPTION.x1 - CAPTION.x0 - 2 * padX;
  const size = fitLines(rows, family, room, VOICE.max * UNIT, VOICE.min * UNIT);
  const lead = size * 1.24;
  const w = Math.max(...rows.map((r) => measure(r, family, size))) + 2 * padX;
  const h = rows.length * lead + 2 * padY - (lead - size * 1.02);
  const cx = (CAPTION.x0 + CAPTION.x1) / 2;
  const x = cx - w / 2, y = CAPTION.y1 - h;
  c.save();
  c.globalAlpha = clamp((t - line.start) / 0.06) * clamp((line.end - t) / 0.06);
  roundRect(c, x, y, w, h, Math.min(h / 2, 30 * UNIT));
  // opaque: a see-through plate turns grey over a light ground in linear light
  c.fillStyle = rgba('ink');
  c.fill();
  // a faint edge, so the pill still has a shape over a dark ground
  c.lineWidth = 2 * UNIT;
  c.strokeStyle = rgba('paper', 0.16);
  c.stroke();
  // the words, row by row, each as bright as whether it has been spoken
  let k = 0;
  const space = measure(' ', family, size);
  rows.forEach((row, ri) => {
    const words = row.split(/\s+/);
    let wx = cx - measure(row, family, size) / 2;
    const base = y + padY + ri * lead + size * 0.92;
    for (const word of words) {
      const spoken = line.words[k];
      const on = !spoken || tf >= spoken.start;
      sentence(c, word, wx, base, { size, colour: 'paper', weight: 700, alpha: on ? 1 : VOICE.dim });
      wx += measure(word, family, size) + space;
      k++;
    }
  });
  c.restore();
}

export default class Overlay extends Scene {
  private layer = new Layer2D();
  /** Song time of bar b (fractions allowed). */
  private tBar = (bar: number) => this.ctx.audio.timeOfBeat(bar * 4);

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, audio } = this.ctx;
    const c = this.layer.ctx;
    this.layer.clear();
    // what is on (which section, whether its name is out, which caption) steps, so it is read at
    // the frame's own time; how the plates move is read at the sample's time
    const tf = frameTime(f.t);
    const bar = audio.beatAt(tf) / 4;
    const shot = SHOTS.find((s) => bar >= s.bar && bar < s.bar + s.bars) ?? SHOTS[SHOTS.length - 1]!;
    const group = GROUPS.find((g) => g.id === shot.group);
    // a caption group of the voice-over (a line of data/lyrics.json with a phrase id), over any shot
    const spoken = this.ctx.lyrics.lineAt(tf);
    const voice = spoken?.phrase !== undefined ? spoken : null;
    if (group?.kind !== 'section') {
      if (!voice) return;
      voiceCaption(c, voice, tf, f.t);
      comp.draw(renderer, this.layer.upload(), out, { tint: TYPE_TINT });
      return;
    }

    const first = SHOTS.find((s) => s.group === group.id)!;
    const reveal = group.reveal ?? first.bar;
    counter(c, {
      n: group.n ?? 0, total: SECTION_COUNT, name: bar >= reveal ? group.name ?? group.id : null,
      sinceStart: f.t - this.tBar(first.bar), sinceReveal: f.t - this.tBar(reveal),
      beatPhase: f.beatPhase,
    });
    const cap: Caption | undefined = CAPTIONS.find((x) => x.group === group.id && bar >= x.bar && bar < x.bar + x.bars);
    // A plate is the overlay's to set. Words that a shot sets itself, or does without, are shown
    // only while the shot is still a storyboard card, marked as such.
    const card = (this.ctx.params.cards as string[] | undefined)?.includes(shot.id) ?? false;
    const lines = cap ? SECTIONS.find((p) => p.group === group.id)?.lines[cap.kind] : undefined;
    if (cap && lines && (cap.how === 'plate' || card)) {
      const note = cap.how === 'plate' ? undefined : GHOST_LABEL[cap.how];
      caption(c, {
        lines, label: note ?? COPY.labels?.[cap.kind], accent: note ? 'ash' : COPY.accents?.[cap.kind] ?? 'signal',
        beats: (bar - cap.bar) * 4, since: f.t - this.tBar(cap.bar),
        // the foot belongs to the voice while it speaks: a plate placed there stands at the top meanwhile
        // (bun run score warns about such a plate, so that the storyboard can be put right)
        place: voice && (cap.place ?? 'bottom') === 'bottom' ? 'top' : cap.place ?? 'bottom', ghost: !!note,
      });
    }
    if (voice) voiceCaption(c, voice, tf, f.t);
    // the tint keeps paper-coloured type under the bloom threshold of a dark shot
    comp.draw(renderer, this.layer.upload(), out, { tint: TYPE_TINT });
  }

  override dispose() {
    this.layer.texture.dispose();
  }
}
