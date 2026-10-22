// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./engine/LICENSE-pdoom-video.txt
// Changed for this project: the edit is read from the sections of the audio data, which are the
// shots of shots.json; a shot that has no module yet is played by the storyboard card; one
// overlay entry runs the whole length of the film; a transition's focus and letter size, written
// in px of the master format, are carried over to the format shown.
//
// The edit: which scene plays when.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import type { Transition } from './engine/transition';
import { SHOTS } from './film';
import { STAGE, rectCx, rectCy } from './scenes/parts/kit-frame';
import { W, H } from './engine/gl';
import { PROJECT } from './project-config';

/**
 * shots.json gives positions in px of the master format (`width` x `height` of project-config.ts).
 * In another format (`?format=`, `--format`) a point keeps its place relative to the frame, and a
 * size follows the short side, as UNIT does.
 */
const toFormat = ([x, y]: [number, number]): [number, number] => [(x * W) / PROJECT.width, (y * H) / PROJECT.height];
const sizeToFormat = (s: number) => (s * Math.min(W, H)) / Math.min(PROJECT.width, PROJECT.height);

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
// Only files directly in scenes/ are scene modules. Files that scenes share or are split into go in
// scenes/parts/: listed here they would count as imported by the timeline, and saving one would
// reload the whole studio instead of hot-swapping the scenes that use it.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const has = (name: string) => `./scenes/${name}.ts` in modules;
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

/** The transition into a shot, as shots.json gives it, placed on the beat grid. */
function transitionInto(id: string, before: string, tCut: number, au: AudioData): Transition | undefined {
  const t = SHOTS.find((s) => s.id === id)?.in;
  if (!t) return undefined;
  const beat = au.beatAt(tCut);
  return {
    kind: t.kind, lead: t.lead, tail: t.tail,
    tLead: au.timeOfBeat(beat - t.lead), tCut, tTail: au.timeOfBeat(beat + t.tail),
    focus: t.focus ? toFormat(t.focus) : [rectCx(STAGE), rectCy(STAGE)],
    dir: t.dir ?? [1, 0],
    text: t.text,
    size: t.size === undefined ? undefined : sizeToFormat(t.size),
    colour: t.colour,
    // letters that stand before a dark shot are light, and the other way about
    slab: SHOTS.find((s) => s.id === before)?.tone === 'dark' ? 'paper' : 'ink',
    standIn: !has(id) || !has(before),
  };
}

/** The module that plays a shot which has not been built: a card with what the storyboard says. */
export const CARD = 'storyboard-card';
/** The module that draws the counter and the captions over every shot. */
export const OVERLAY = 'overlay';

/**
 * The film is cut on the music: every shot is one section of data/audio.json, which is written
 * from shots.json in bars by scripts/build-shot-files.py. A shot named `water-cold-kettle` is played
 * by scenes/water-cold-kettle.ts when that file exists, and by the storyboard card until then. All
 * cuts are hard cuts on a beat; what happens round a cut is the transition pass.
 *
 * The first section may start a few milliseconds into the file, and the last may end before the
 * audio does, so the first and last entries are stretched to cover the whole track.
 */
export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  if (!au.sections.length) throw new Error('data/audio.json has no sections: run `bun run shots` (scripts/build-shot-files.py)');
  const last = au.sections.length - 1;
  const shots: TimelineEntry[] = au.sections.map((s, i) => {
    const id = s.name.toLowerCase();
    const file = has(id) ? id : CARD;
    const before = i > 0 ? au.sections[i - 1]!.name.toLowerCase() : id;
    return { id, file, load: scene(file), start: i === 0 ? 0 : s.start, end: i === last ? au.duration : s.end, into: i === 0 ? undefined : transitionInto(id, before, s.start, au) };
  });
  // the overlay is told which shots are still cards: over those it shows every caption, so the words can be read
  const cards = shots.filter((e) => e.file === CARD).map((e) => e.id);
  return [...shots, { id: OVERLAY, file: OVERLAY, load: scene(OVERLAY), start: 0, end: au.duration, overlay: true, params: { cards } }];
}
