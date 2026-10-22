#!/usr/bin/env bun
// Renders the score written in data/score.json to a WAV file, with its sound effects and, when the
// score names one, its voice-over.
//
//   bun scripts/make-score.ts [--score data/score.json] [--check] [--no-grid]
//   bun run score
//
// Two cases:
//   A score on its own (no `track`): its grid is known by construction (one tempo, bar 0 at time
//   0), so the script writes it into data/audio.json, exactly, with nothing to measure.
//   A score over a track (`track` names a WAV the owner supplied or bought): the track's grid was
//   measured into data/audio.json by the analysis; the script reads it, places every cue and
//   pattern on those measured beats, mixes the track in on its own bus, and never writes the grid.
//
// --check    checks the score and the voice, prints what would be made, and writes nothing
// --no-grid  writes the WAV only and leaves data/audio.json and data/lyrics.json alone (for a test)
//
// Writes, relative to the film folder:
//   the WAV named by `out` in the score (audio/score.wav by default), 16-bit stereo
//   data/audio.json   (a score on its own) beats, downbeats, the shot times from shots.json,
//                     envelopes and onsets of the score's instruments, `notes` with the loudness
//   data/lyrics.json  the caption groups of the voice-over, with every word in song time, when the
//                     score has a voice; a copy of it written earlier by this script is removed when
//                     it has none
// Then run bun run shots (scripts/build-shot-files.py), as after any new grid.
//
// Nothing here reads a clock or an unseeded random: the same files give the same bytes.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  envelope, evenGrid, measuredGrid, renderScore, scoreEvents, timeOf,
  type CueContext, type CueSpec, type PlacedVoice, type ScoreSpec, type ShotRef, type TimeGrid,
} from '../src/sound/score';
import { decodeWav, encodeWav, toMono, toStereo, type Stereo } from '../src/sound/mix';
import { CAPTION_DEFAULTS, groupCaptions, scriptTokens, wordTimes, type PhraseTiming, type ScriptToken, type TimedWord, type VoiceScript } from '../src/sound/voice';
import { PROJECT } from '../src/project-config';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const APP = path.resolve(import.meta.dir, '..');
const at = (p: string) => path.resolve(APP, p);
const rel = (p: string) => path.relative(APP, p).replace(/\\/g, '/');
const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, '')) as T;
const MADE_BY = 'scripts/make-score.ts';
const r6 = (x: number) => Math.round(x * 1e6) / 1e6;

const scoreFile = at(opt('score', 'data/score.json')!);
if (!existsSync(scoreFile)) { console.error(`${rel(scoreFile)} not found. Write the score first (see the skill's references/sound-and-voice.md).`); process.exit(1); }
const score = readJson<ScoreSpec>(scoreFile);
const shotData = existsSync(at('shots.json')) ? readJson<{ shots: ShotRef[]; captions?: { group: string; bar: number; bars: number; how?: string; place?: string }[] }>(at('shots.json')) : { shots: [] };
const shots = shotData.shots;
const rate = score.sampleRate ?? 48000;
const errors: string[] = [];
const warnings: string[] = [];

// ---- the grid: measured with a track, exact without
let grid: TimeGrid;
if (score.track) {
  const gf = at('data/audio.json');
  const j = existsSync(gf) ? readJson<{ beats: number[]; downbeats?: number[]; duration: number; notes?: { grid_source?: string } }>(gf) : undefined;
  if (!j || !Array.isArray(j.beats) || j.beats.length < 2) {
    console.error(`the score lays itself over ${score.track.file}, which needs its measured grid in data/audio.json; measure it first (music-and-beat.md, section 4)`);
    process.exit(1);
  }
  if (j.notes?.grid_source === 'composed') errors.push('data/audio.json holds the grid of a composed score, not of the track: measure the track');
  grid = measuredGrid(j);
} else {
  grid = evenGrid(score.tempo || 120, (score.sections ?? []).reduce((a, s) => a + (Number.isInteger(s.bars) ? s.bars : 0), 0));
}

// ---- cues that come from the picture
for (const m of score.cueModules ?? []) {
  const file = at(m);
  if (!existsSync(file)) { errors.push(`the cue module ${m} does not exist`); continue; }
  const mod = (await import(pathToFileURL(file).href)) as { cues?: (ctx: CueContext) => CueSpec[] };
  if (typeof mod.cues !== 'function') { errors.push(`${m} does not export a function cues(ctx)`); continue; }
  const made = mod.cues({ shots, timeOfBeat: grid.timeOfBeat, bars: grid.bars, duration: grid.duration });
  score.cues = [...(score.cues ?? []), ...made];
  console.log(`${m}: ${made.length} cues`);
}

const ev = scoreEvents(score, shots, grid);
const { events, bars } = ev;
errors.push(...ev.errors);

// ---- files: the samples and the track
const load = (file: string): Stereo | undefined => {
  const f = at(file);
  if (!existsSync(f)) return undefined;
  if (!/\.wav$/i.test(f)) { errors.push(`${file}: only WAV files are read; convert it to WAV first`); return undefined; }
  try { return toStereo(decodeWav(new Uint8Array(readFileSync(f))), rate); } catch (e) { errors.push(`${file}: ${(e as Error).message}`); return undefined; }
};
const samples = new Map<string, Stereo>();
for (const [name, inst] of Object.entries(score.instruments ?? {})) {
  if (inst.type !== 'sample') continue;
  const file = String(inst.file ?? '');
  if (!file) { errors.push(`instrument "${name}": a sample needs a \`file\``); continue; }
  const s = load(file);
  if (s) samples.set(file, s); else if (!errors.some((e) => e.startsWith(file))) errors.push(`instrument "${name}": ${file} does not exist`);
}
let track: Stereo | undefined;
if (score.track) {
  track = load(score.track.file);
  if (!track && !errors.some((e) => e.startsWith(score.track!.file))) errors.push(`the track ${score.track.file} does not exist`);
}

// ---- the voice-over
const voices: PlacedVoice[] = [];
const spoken: { id: string; tokens: ScriptToken[]; words: TimedWord[]; marked: boolean; timing: string }[] = [];
let captionRules = CAPTION_DEFAULTS;
if (score.voice) {
  const vf = at(score.voice);
  if (!existsSync(vf)) errors.push(`the score names the voice ${score.voice}, which does not exist`);
  else {
    const script = readJson<VoiceScript>(vf);
    captionRules = { ...CAPTION_DEFAULTS, ...script.captions };
    const wordsFile = at('data/voice-words.json');
    const timings = existsSync(wordsFile) ? readJson<{ phrases: PhraseTiming[] }>(wordsFile).phrases : [];
    const missing: string[] = [];
    for (const p of script.phrases ?? []) {
      const t = timeOf(p.at, shots, grid);
      if (typeof t === 'string') { errors.push(`voice phrase ${p.id}: ${t}`); continue; }
      const timing = timings.find((x) => x.id === p.id);
      const file = at(timing?.file ?? `audio/voice/${p.id}.wav`);
      if (!existsSync(file)) { missing.push(p.id); continue; }
      const pcm = toMono(decodeWav(new Uint8Array(readFileSync(file))), rate);
      const tokens = scriptTokens(p.text);
      const { words, timing: how } = wordTimes(tokens, timing?.words, pcm, rate);
      if (timing && how === 'estimated') warnings.push(`voice phrase ${p.id}: the words the engine reported do not match the text; word times were estimated`);
      // the first word, not the first sample of the file, lands on the position
      const offset = t - words[0]!.start;
      voices.push({ id: p.id, pcm, start: Math.round(offset * rate), gain: p.gain ?? 0 });
      spoken.push({ id: p.id, tokens, marked: /(^|\s)\|(\s|$)/.test(p.text), timing: how, words: words.map((w) => ({ w: w.w, start: r6(w.start + offset), end: r6(w.end + offset) })) });
    }
    if (missing.length) warnings.push(`voice: no audio yet for ${missing.join(', ')}; the score is made without ${missing.length === 1 ? 'it' : 'them'} (run the voice step, for example bun run voice:sapi)`);
    spoken.sort((a, b) => a.words[0]!.start - b.words[0]!.start);
    for (let i = 1; i < spoken.length; i++) {
      const prev = spoken[i - 1]!, cur = spoken[i]!;
      const end = prev.words[prev.words.length - 1]!.end;
      if (end > cur.words[0]!.start) warnings.push(`voice phrase ${cur.id} starts at ${cur.words[0]!.start.toFixed(2)} s, before ${prev.id} has ended (${end.toFixed(2)} s): move it later`);
    }
  }
}
const groups = spoken.length ? groupCaptions(spoken, captionRules) : [];
// voice captions stand at the foot of the frame: a plate placed there at the same moment would sit on them
for (const c of shotData.captions ?? []) {
  if ((c.how ?? 'plate') !== 'plate' || (c.place ?? 'bottom') !== 'bottom') continue;
  const t0 = grid.timeOfBeat(c.bar * 4), t1 = grid.timeOfBeat((c.bar + c.bars) * 4);
  const hit = groups.find((g) => g.start < t1 && g.end > t0);
  if (hit) warnings.push(`the ${c.group} plate at bar ${c.bar} stands at the bottom while the voice caption "${hit.text}" is on (${hit.start.toFixed(2)} s): place the plate at the top or in the middle`);
}

const shotBars = shots.reduce((m, s) => Math.max(m, s.bar + s.bars), 0);
if (shots.length && shotBars !== bars) warnings.push(`the score has ${bars} bars and the shot list ${shotBars}: make them equal`);

if (errors.length) {
  const list = [...new Set(errors)];
  console.error(`${rel(scoreFile)}: ${list.length} fault${list.length > 1 ? 's' : ''}; nothing was written`);
  for (const e of list) console.error(`  ${e}`);
  process.exit(1);
}
for (const w of warnings) console.log(`note: ${w}`);
const outFile = at(score.out ?? 'audio/score.wav');
console.log(`${bars} bars ${grid.measured ? `on the measured grid of ${score.track!.file}` : `at ${score.tempo} BPM`}, ${events.length} sounds, ${samples.size} sample files, ${voices.length} voice phrases -> ${rel(outFile)}`);
if (flag('check')) process.exit(0);

// ---- render and write
const t0 = performance.now();
const m = renderScore(score, events, grid, { voices, samples, track });
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, encodeWav(m.mix, m.rate, score.seed ?? 1));
const secs = ((performance.now() - t0) / 1000).toFixed(1);
console.log(`wrote ${rel(outFile)}: ${m.duration.toFixed(2)} s, ${m.report.lufs.toFixed(1)} LUFS, sample peak ${m.report.peakDb.toFixed(1)} dBFS, limiter ${m.report.limitedDb.toFixed(1)} dB at most, at ${m.report.limitedAt.toFixed(2)} s (${secs} s to render)`);
if (m.report.limitedDb > 6) console.log('note: the limiter took more than 6 dB off the loudest moment; lower the loudest bus or the loudness target');

if (flag('no-grid')) process.exit(0);
if (grid.measured) {
  console.log('data/audio.json was left as it is: it holds the measured grid of the track');
} else {
  const beats = Array.from({ length: bars * 4 }, (_, i) => r6(grid.timeOfBeat(i)));
  const downbeats = beats.filter((_, i) => i % 4 === 0);
  const tOf = (bar: number) => r6(grid.timeOfBeat(bar * 4));
  const sections = shots.map((s) => ({ name: s.id, start: tOf(s.bar), end: Math.min(tOf(s.bar + s.bars), r6(m.duration)) }));
  // onsets: every instrument by its name, and the drums also under kick, snare and hat as the analysis names them
  const onsets: Record<string, [number, number][]> = {};
  const add = (k: string, t: number, v: number) => (onsets[k] ??= []).push([r6(t), Math.round(v * 1000) / 1000]);
  for (const e of events) {
    add(e.inst, e.t, e.vel);
    const type = score.instruments[e.inst]?.type ?? e.inst;
    if (type === 'kick' && e.inst !== 'kick') add('kick', e.t, e.vel);
    if ((type === 'snare' || type === 'clap') && e.inst !== 'snare') add('snare', e.t, e.vel);
    if (type === 'hat' && e.inst !== 'hat') add('hat', e.t, e.vel);
  }
  for (const p of spoken) for (const w of p.words) add('vocal', w.start, 1);
  for (const k of Object.keys(onsets)) onsets[k]!.sort((a, b) => a[0] - b[0]);
  const mono = new Float32Array(m.mix.l.length);
  for (let i = 0; i < mono.length; i++) mono[i] = 0.5 * (m.mix.l[i]! + m.mix.r[i]!);
  const data = {
    source: `${rel(outFile)}, composed by ${MADE_BY} from ${rel(scoreFile)}`,
    duration: r6(m.duration),
    bpm: score.tempo,
    fps: 100,
    beats,
    downbeats,
    sections,
    features: {
      rms: envelope(mono, m.rate), low: envelope(m.bands.low, m.rate), mid: envelope(m.bands.mid, m.rate),
      high: envelope(m.bands.high, m.rate), ...(voices.length ? { vocal: envelope(m.bands.vocal, m.rate) } : {}),
    },
    onsets,
    notes: {
      grid_source: 'composed', tempo: score.tempo, bars, seed: score.seed ?? 1,
      lufs: Math.round(m.report.lufs * 10) / 10, sample_peak_db: Math.round(m.report.peakDb * 10) / 10,
      limiter_db: Math.round(m.report.limitedDb * 10) / 10, voice_phrases: spoken.map((p) => ({ id: p.id, timing: p.timing })),
      stems: 'none; the bands low, mid, high and vocal are sums of the score\'s own instruments before the mix',
    },
  };
  mkdirSync(at('data'), { recursive: true });
  writeFileSync(at('data/audio.json'), JSON.stringify(data));
  console.log(`wrote data/audio.json: ${beats.length} beats, ${sections.length} shot times; next: bun run shots`);
}

const lyricsFile = at('data/lyrics.json');
if (groups.length) {
  const lines = groups.map((g) => ({ text: g.text, start: r6(g.start), end: r6(g.end), rows: g.rows, phrase: g.phrase, words: g.words }));
  writeFileSync(lyricsFile, JSON.stringify({ source: MADE_BY, comment: 'Caption groups of the voice-over in song time, generated from data/voice.json. Do not edit by hand.', lines }, null, 1));
  console.log(`wrote data/lyrics.json: ${groups.length} caption groups from ${spoken.length} phrases (${spoken.map((p) => `${p.id} ${p.timing}`).join(', ')})`);
} else if (existsSync(lyricsFile)) {
  try { if (readJson<{ source?: string }>(lyricsFile).source === MADE_BY) { rmSync(lyricsFile); console.log('removed data/lyrics.json: the score has no voice now'); } } catch { /* not ours */ }
}
if (PROJECT.audioFile !== rel(outFile) && !PROJECT.studioAudio.some((a) => a.file === rel(outFile))) {
  console.log(`note: src/project-config.ts does not list ${rel(outFile)}; add it to studioAudio to hear it in the studio, and make it audioFile when it is the film's music`);
}
