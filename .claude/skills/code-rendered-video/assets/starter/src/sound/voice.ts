// A voice-over as data: the phrases the lead writes, the times of their words, and the grouping of
// those words into captions.
//
// data/voice.json      written by the lead: each phrase's text and where it starts, in bars and beats
// data/voice-words.json written by the voice step (for example scripts/voice-sapi.ps1): one WAV per
//                      phrase and the time of every word inside it
// data/lyrics.json     written by scripts/make-score.ts: the caption groups with the time of every
//                      word in song time, in the shape src/engine/lyrics.ts reads, so a scene or the
//                      overlay finds the caption of a moment with `ctx.lyrics.lineAt(t)`
//
// In the text of a phrase, `|` ends a caption group and `/` breaks a line inside one; the voice
// never sees them. A phrase without `|` is grouped by the rules of `groupCaptions`.
//
// No DOM and no Node imports.

/** A place in the film, counted from zero as shots.json counts: bar 2, beat 1 is the second beat of the third bar. */
/** Or `{ t }`, seconds of song time: only for cues that come from the picture, such as the events of a simulation. */
export type Position = { bar: number; beat?: number } | { shot: string; beat?: number } | { t: number };

export interface VoicePhrase {
  id: string;
  text: string;
  /** Where the first word lands. */
  at: Position;
  /** Decibels on this phrase alone. */
  gain?: number;
}

export interface CaptionRules {
  /** Most words in one caption group. */
  maxWords: number;
  /** Most characters in one caption group, spaces included. */
  maxChars: number;
  /** A silence at least this long between two words (seconds) ends a group. */
  gap: number;
  /** A group appears this many seconds before its first word. */
  lead: number;
  /** A group stays this long after its last word, unless the next group comes sooner. */
  hold: number;
  /** A group is shown at least this long, unless the next group comes sooner. */
  min: number;
}

export const CAPTION_DEFAULTS: CaptionRules = { maxWords: 5, maxChars: 26, gap: 0.3, lead: 0.05, hold: 0.5, min: 0.7 };

export interface VoiceScript {
  comment?: string;
  voice?: { engine?: string; name?: string; rate?: number };
  captions?: Partial<CaptionRules>;
  phrases: VoicePhrase[];
}

export interface TimedWord { w: string; start: number; end: number }

export interface PhraseTiming {
  id: string;
  file: string;
  duration: number;
  /** `engine`: the voice engine reported the word times; `estimated`: spread over the speech by syllables. */
  timing: 'engine' | 'estimated';
  words: TimedWord[];
}

/** A word of the script: what the caption shows, and whether a group or a line ends after it. */
export interface ScriptToken { w: string; group: boolean; line: boolean }

/** The words of a phrase as the captions show them, with the breaks the lead wrote. */
export function scriptTokens(text: string): ScriptToken[] {
  const out: ScriptToken[] = [];
  for (const part of text.split(/\s+/).filter(Boolean)) {
    if (part === '|' || part === '/') {
      const last = out[out.length - 1];
      if (last) { if (part === '|') last.group = true; else last.line = true; }
      continue;
    }
    out.push({ w: part, group: false, line: false });
  }
  if (out.length) out[out.length - 1]!.group = true;
  return out;
}

/** The text the voice speaks: the phrase without the caption marks. */
export const spokenText = (text: string) => text.replace(/\s*[|/]\s*/g, ' ').replace(/\s+/g, ' ').trim();

const letters = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '');

/** Speech activity per millisecond: true where the level is above `thr`. */
export function activity(pcm: Float32Array, rate: number, thr = 0.02): Uint8Array {
  const blk = Math.max(1, Math.round(rate / 1000));
  const on = new Uint8Array(Math.ceil(pcm.length / blk));
  for (let b = 0; b < on.length; b++) {
    let m = 0;
    for (let i = b * blk; i < Math.min(pcm.length, (b + 1) * blk); i++) m = Math.max(m, Math.abs(pcm[i]!));
    on[b] = m > thr ? 1 : 0;
  }
  return on;
}

/**
 * Word times for a phrase. When the engine reported one time for each word of the script, they are
 * used, and each word's end is pulled back to where its sound stops (engines give a start only, so a
 * word would otherwise run on through the pause after it). Otherwise the times are estimated: the
 * speech between the first and last sound is shared out by the number of syllables of each word, a
 * little more after a comma or a full stop. Estimated times are good enough for groups of a few
 * words, not for lighting up one word at a time.
 */
export function wordTimes(tokens: ScriptToken[], reported: TimedWord[] | undefined, pcm: Float32Array, rate: number): { words: TimedWord[]; timing: 'engine' | 'estimated' } {
  const on = activity(pcm, rate);
  const ms = (t: number) => Math.max(0, Math.min(on.length - 1, Math.round(t * 1000)));
  const lastSound = (a: number, b: number) => { for (let i = ms(b); i >= ms(a); i--) if (on[i]) return (i + 1) / 1000; return a + 0.05; };
  if (reported && reported.length === tokens.length && reported.every((r, i) => letters(r.w) === letters(tokens[i]!.w) || letters(r.w) === '' || letters(tokens[i]!.w) === '')) {
    const words = tokens.map((tk, i) => {
      const r = reported[i]!;
      const next = reported[i + 1]?.start ?? pcm.length / rate;
      return { w: tk.w, start: r.start, end: Math.max(r.start + 0.05, Math.min(next, lastSound(r.start, next) + 0.03)) };
    });
    return { words, timing: 'engine' };
  }
  let first = 0, last = on.length - 1;
  while (first < on.length && !on[first]) first++;
  while (last > first && !on[last]) last--;
  const t0 = first / 1000, t1 = (last + 1) / 1000;
  // vowel groups of the word with its marks taken off: one a syllable in English, one a word in Vietnamese
  const syl = (w: string) => Math.max(1, (w.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[aeiouy]+/g) ?? []).length);
  const weight = tokens.map((tk) => syl(tk.w) + (/[,;:]$/.test(tk.w) ? 0.8 : /[.!?]$/.test(tk.w) ? 1.2 : 0));
  const total = weight.reduce((a, b) => a + b, 0);
  let acc = 0;
  const words = tokens.map((tk, i) => {
    const s = t0 + ((t1 - t0) * acc) / total;
    acc += weight[i]!;
    const e = t0 + ((t1 - t0) * (acc - (weight[i]! - syl(tk.w)))) / total;
    return { w: tk.w, start: s, end: Math.max(s + 0.05, e) };
  });
  return { words, timing: 'estimated' };
}

export interface CaptionGroup {
  /** Shown from `start` until `end`, in song time. */
  start: number;
  end: number;
  text: string;
  /** The lines of the caption, as the lead broke them with `/`; one line when there is no mark. */
  rows: string[];
  phrase: string;
  words: TimedWord[];
}

/**
 * Words of the whole film (in song time, in order) grouped into captions. Where the lead marked
 * groups with `|` in a phrase, those marks decide for that phrase. Elsewhere a group ends after
 * punctuation, before a silence of `gap` seconds, or when it would pass `maxWords` or `maxChars`.
 */
export function groupCaptions(phrases: { id: string; tokens: ScriptToken[]; words: TimedWord[]; marked: boolean }[], rules: CaptionRules): CaptionGroup[] {
  const groups: { phrase: string; words: TimedWord[]; lineAfter: Set<number> }[] = [];
  for (const p of phrases) {
    let cur: TimedWord[] = [];
    let lines = new Set<number>();
    const close = () => { if (cur.length) groups.push({ phrase: p.id, words: cur, lineAfter: lines }); cur = []; lines = new Set(); };
    p.words.forEach((w, i) => {
      const tk = p.tokens[i]!;
      const next = p.words[i + 1];
      const chars = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
      if (!p.marked && cur.length && (cur.length >= rules.maxWords || chars > rules.maxChars)) close();
      cur.push(w);
      if (tk.line) lines.add(cur.length - 1);
      const end = p.marked ? tk.group : tk.group || /[.,;:!?]$/.test(tk.w) || (next !== undefined && next.start - w.end >= rules.gap);
      if (end) close();
    });
    close();
  }
  return groups.map((g, i) => {
    const first = g.words[0]!, last = g.words[g.words.length - 1]!;
    const next = groups[i + 1];
    const start = Math.max(0, first.start - rules.lead);
    const nextStart = next ? next.words[0]!.start - rules.lead : Infinity;
    const end = Math.min(nextStart, Math.max(last.end + rules.hold, start + rules.min));
    const rows: string[] = [];
    let row: string[] = [];
    g.words.forEach((w, k) => { row.push(w.w); if (g.lineAfter.has(k) && k < g.words.length - 1) { rows.push(row.join(' ')); row = []; } });
    rows.push(row.join(' '));
    return { start, end, text: g.words.map((w) => w.w).join(' '), rows, phrase: g.phrase, words: g.words };
  });
}
