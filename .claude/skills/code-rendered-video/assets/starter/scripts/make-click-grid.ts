#!/usr/bin/env bun
// Writes data/audio.json from a synthetic beat grid: a steady tempo, four beats to a bar, the first
// beat at time 0. It stands in for the analysis of a real track, so the studio and the storyboard
// can run before the music is chosen. Replace it with a measured grid once there is a track (see
// the skill's references/music-and-beat.md): real tracks drift, and a film cut on a synthetic grid
// drifts away from the music.
//
//   bun scripts/make-click-grid.ts --bpm 120 --bars 24 [--out data/audio.json]
//   bun run make-grid -- --bpm 120 --bars 24
//
// The file has the shape src/engine/audio.ts reads. `sections` (one per shot, in seconds) are taken
// from shots.json when it is there; scripts/build-shot-files.py writes them again after every change
// of the shot list. `onsets.kick` marks every beat (strength 1 on a downbeat), so a scene that
// reacts to the kick sees the click; the envelopes are left empty and read as 0.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const APP = path.resolve(import.meta.dir, '..');
const bpm = Number(opt('bpm', '120'));
const bars = Number(opt('bars', '24'));
const out = path.resolve(APP, opt('out', 'data/audio.json')!);
if (!(bpm > 0) || !(bars > 0) || !Number.isInteger(bars)) {
  console.error('usage: bun scripts/make-click-grid.ts --bpm <beats a minute> --bars <whole bars> [--out data/audio.json]');
  process.exit(1);
}

const spb = 60 / bpm;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const beats = Array.from({ length: bars * 4 }, (_, i) => r4(i * spb));
const downbeats = beats.filter((_, i) => i % 4 === 0);
const duration = r4(bars * 4 * spb);
/** Song time of a position in bars, from the beat grid (as the generator computes it). */
const tOf = (bar: number) => {
  const x = bar * 4, i = Math.min(Math.floor(x), beats.length - 2);
  return r4(beats[i]! + (beats[i + 1]! - beats[i]!) * (x - i));
};

let sections: { name: string; start: number; end: number }[] = [];
const shotsFile = path.join(APP, 'shots.json');
if (existsSync(shotsFile)) {
  try {
    const shots = JSON.parse(readFileSync(shotsFile, 'utf8')).shots as { id: string; bar: number; bars: number }[];
    sections = shots.map((s) => ({ name: s.id, start: tOf(s.bar), end: Math.min(tOf(s.bar + s.bars), duration) }));
  } catch (e) {
    console.error(`shots.json could not be read (${(e as Error).message}); sections left empty`);
  }
}

const data = {
  source: `synthetic click grid: ${bpm} BPM, ${bars} bars of 4/4 (scripts/make-click-grid.ts)`,
  duration,
  bpm,
  fps: 100,
  beats,
  downbeats,
  sections,
  features: {},
  onsets: { kick: beats.map((t, i) => [t, i % 4 === 0 ? 1 : 0.7]) },
};
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
console.log(`${bars} bars at ${bpm} BPM: ${beats.length} beats, ${duration} s, ${sections.length} sections`);
console.log('wrote', out);
if (!sections.length) console.log('next: bun run shots (scripts/build-shot-files.py writes the shot times into it)');
