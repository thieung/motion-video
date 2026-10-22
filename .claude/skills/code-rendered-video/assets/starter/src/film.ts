// The film as data: the shot list and the words, read from shots.json and copy.json in the app
// folder. Those files are the one source for the storyboard document as well
// (scripts/build-shot-files.py), so nothing about what a shot is, or what a caption says, is
// written anywhere in the app.
import shotsFile from '../shots.json';
import copyFile from '../copy.json';

import type { PaletteKey } from './engine/palette';
import type { TransitionKind } from './engine/transition';

export type Tone = 'dark' | 'light';

export interface Shot {
  /** Timeline id, and the name of the module in scenes/ that plays the shot once it is built. */
  id: string;
  group: string;
  /** Bars of the music, counted from zero. */
  bar: number;
  bars: number;
  /** The ground the shot stands on. The overlay sets its type against it. */
  tone: Tone;
  title: string;
  /** The transition that leads into the shot; the first shot has none. Lead and tail are in beats. */
  in?: { kind: TransitionKind; lead: number; tail: number; focus?: [number, number]; dir?: [number, number]; text?: string; size?: number; colour?: PaletteKey; note?: string };
  see: string;
  move: string;
  /** What the camera does. Two shots in a row that make the same move are warned about, unless `repeat` is set. */
  camera: string;
  look: string;
  /**
   * The repetition of this shot and the one before it is intended (a film whose form is repetition):
   * no warning when the two come in by the same transition or make the same camera move.
   */
  repeat?: boolean;
}

/** A group is a section of the film: the title, a numbered section with a name, the recap or the end card. */
export type GroupKind = 'title' | 'section' | 'recap' | 'end';

export interface Group {
  id: string;
  kind: GroupKind;
  /** The heading of a group that is not a numbered section. */
  label?: string;
  /** Numbered sections only: the number and the name the viewer sees. */
  n?: number;
  name?: string;
  /** Bar at which the section's name is first shown. Before it the counter shows ???. Default: at once. */
  reveal?: number;
  /** How the group is told: its arc, and what the music decides. */
  shape?: string;
}

/** How a sentence reaches the viewer: on a plate set by the overlay, as part of the shot's own picture, or not in words at all. */
export type CaptionHow = 'plate' | 'shot' | 'none';
export type CaptionPlace = 'top' | 'middle' | 'bottom';
/** `kind` names one sentence in the `lines` of the section's copy (copy.json). */
export interface Caption { group: string; kind: string; bar: number; bars: number; how: CaptionHow; place?: CaptionPlace; why?: string }

export interface SectionCopy {
  n: number;
  group: string;
  name: string;
  /** One sentence per caption kind, one string per line on screen. */
  lines: Record<string, string[]>;
}

export interface Copy {
  /** Small label over a plate of a caption kind. */
  labels?: Record<string, string>;
  /** Colour of the bar beside a plate of a caption kind. Default: signal. */
  accents?: Record<string, PaletteKey>;
  /** Words of the title card and of the end card; the keys are the film's own. */
  title?: Record<string, string[] | string>;
  closing?: Record<string, string[] | string>;
  sections: SectionCopy[];
}

export const SHOTS = shotsFile.shots as Shot[];
/** What each kind of transition is called, and what it does, for the storyboard. */
export const TRANSITIONS = shotsFile.transitions as Record<TransitionKind, { label: string; what: string }>;
export const GROUPS = shotsFile.groups as Group[];
export const CAPTIONS = shotsFile.captions as Caption[];
export const COPY = copyFile as unknown as Copy;
export const SECTIONS = COPY.sections;
/** The number of numbered sections: the total of the counter. */
export const SECTION_COUNT = GROUPS.filter((g) => g.kind === 'section').length;

export const shotOf = (id: string): Shot => {
  const s = SHOTS.find((x) => x.id === id);
  if (!s) throw new Error(`no shot '${id}' in shots.json`);
  return s;
};
export const groupOf = (id: string): Group => {
  const g = GROUPS.find((x) => x.id === id);
  if (!g) throw new Error(`no group '${id}' in shots.json`);
  return g;
};
/** The words of the numbered section a shot belongs to. Throws for the title, the recap and the end card. */
export const sectionOf = (shotId: string): SectionCopy => {
  const g = shotOf(shotId).group;
  const p = SECTIONS.find((x) => x.group === g);
  if (!p) throw new Error(`shot '${shotId}' belongs to no numbered section with copy`);
  return p;
};
/**
 * The sentence of one kind for the section a shot belongs to, and when it is due: for a shot that
 * sets the words itself (`how: 'shot'`). `bar` and `bars` are bars of the music.
 */
export function captionFor(shotId: string, kind: string): { lines: string[]; bar: number; bars: number; how: CaptionHow } {
  const copy = sectionOf(shotId);
  const c = CAPTIONS.find((x) => x.group === copy.group && x.kind === kind);
  if (!c) throw new Error(`section ${copy.name} has no caption of kind '${kind}'`);
  const lines = copy.lines[kind];
  if (!lines) throw new Error(`section ${copy.name} has no sentence '${kind}' in copy.json`);
  return { lines, bar: c.bar, bars: c.bars, how: c.how };
}

/** The shot playing at a position in bars (the last one past the end). */
export const shotAtBar = (bar: number): Shot => SHOTS.find((s) => bar >= s.bar && bar < s.bar + s.bars) ?? (bar < 0 ? SHOTS[0]! : SHOTS[SHOTS.length - 1]!);

/** How a group is headed in the studio's shot list and the document: `01  Name` for a numbered section. */
export const groupHeading = (g: Group) =>
  g.kind === 'section' ? `${String(g.n ?? 0).padStart(2, '0')}  ${g.name ?? g.id}` : g.label ?? g.id;
