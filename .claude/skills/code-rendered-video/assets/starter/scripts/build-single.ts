#!/usr/bin/env bun
// Builds the film as ONE self-contained HTML file that plays offline when opened from disk: the
// studio page with its script (three.js and every scene module inside it), fonts, data, pictures
// and music packed in. Written for this project (not part of pdoom-video). No packages beyond
// the starter's own: Vite builds the script, this file packs the rest.
//
//   bun run single                                  # out/single/<title>.html, with the first music file of studioAudio that exists
//   bun run single -- --audio all                   # every music file of studioAudio that exists (the music switch keeps them all)
//   bun run single -- --audio none                  # no music file: the click track and silence only
//   bun run single -- --audio audio/track.mp3       # this file only (it must be listed in studioAudio or be audioFile)
//   bun run single -- --format 1:1                  # opens in that format (the page's Format button still switches)
//   bun run single -- --out some/where/film.html
//
// What the page does differently from the studio: fetch() of a file of the film folder is answered
// from the packed files (a file that was not packed answers 404, never the disk), and the music
// plays from a blob URL made from the packed bytes (window.__filmFileUrl). Everything else is the
// same code. Hot swap is absent (there is no server). `?export=1` works too, so the capture tool
// can check the file itself: bun scripts/render.ts stills --page out/single/<title>.html --t 5
//
// Size: the script is about 0.9 MB, the fonts of the starter about 1.0 MB; every packed file grows
// by a third (base64). A compressed music file of three minutes (4 to 6 MB) is fine; a WAV master
// (30 MB for three minutes) makes a page of 40 MB that is slow to open: pack a compressed copy.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT, formatSize, formatSlug } from '../src/project-config';

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const APP = path.resolve(import.meta.dir, '..');
const BUILD = path.join(APP, 'out', 'single-build');
const format = opt('format') ? formatSize(opt('format')) : null; // an unknown name stops here
const slug = (PROJECT.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'film') + (format && format.name !== PROJECT.format ? `-${formatSlug(format.name)}` : '');
const OUT = path.resolve(opt('out', path.join(APP, 'out', 'single', `${slug}.html`))!);

const TYPES: Record<string, string> = {
  '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.aac': 'audio/aac', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
};
const typeOf = (f: string) => TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream';
const mb = (n: number) => `${(n / 1e6).toFixed(2)} MB`;

/** Every file under `dir`, as paths relative to `dir` with forward slashes. */
function walk(dir: string, rel = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return [];
    const r = rel ? `${rel}/${e.name}` : e.name;
    return e.isDirectory() ? walk(path.join(dir, e.name), r) : [r];
  });
}

// ---- 1. the script, built by Vite as one file ---------------------------------------------------
rmSync(BUILD, { recursive: true, force: true });
const vite = Bun.spawnSync(['node', path.join(APP, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', BUILD, '--emptyOutDir', '--logLevel', 'warn'], {
  cwd: APP, env: { ...process.env, SINGLE_FILE: '1' }, stdout: 'inherit', stderr: 'inherit',
});
if (vite.exitCode !== 0) { console.error('vite build failed'); process.exit(1); }
let html = readFileSync(path.join(BUILD, 'index.html'), 'utf8');
const scripts = walk(path.join(BUILD, 'assets')).filter((f) => f.endsWith('.js'));
if (scripts.length !== 1) throw new Error(`expected one script from the build, got ${scripts.length}: ${scripts.join(', ')}`);
const others = walk(path.join(BUILD, 'assets')).filter((f) => !f.endsWith('.js'));
if (others.length) throw new Error(`the build wrote files this script does not pack: ${others.join(', ')}`);
const code = readFileSync(path.join(BUILD, 'assets', scripts[0]!), 'utf8');

// ---- 2. the files the page fetches -----------------------------------------------------------------
/** Packed files: the path the page asks for (relative to the page), and the file on disk. */
const files: { key: string; file: string; kind: string }[] = [];
for (const f of walk(path.join(APP, 'public'))) files.push({ key: f, file: path.join(APP, 'public', f), kind: f.startsWith('fonts/') ? 'fonts' : 'public' });
for (const f of walk(path.join(APP, 'data')).filter((f) => f.endsWith('.json'))) files.push({ key: `data/${f}`, file: path.join(APP, 'data', f), kind: 'data' });
for (const f of walk(path.join(APP, 'media'))) files.push({ key: `media/${f}`, file: path.join(APP, 'media', f), kind: 'media' });

const audioArg = opt('audio', 'first')!;
const listed = PROJECT.studioAudio.map((a) => a.file).filter((f) => existsSync(path.join(APP, f)));
let music: string[];
if (audioArg === 'none') music = [];
else if (audioArg === 'all') music = listed;
else if (audioArg === 'first') music = listed.slice(0, 1);
else {
  const f = audioArg.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!existsSync(path.join(APP, f))) throw new Error(`--audio ${f}: no such file`);
  if (!PROJECT.studioAudio.some((a) => a.file === f) && PROJECT.audioFile !== f) throw new Error(`--audio ${f}: the page plays only files listed in studioAudio (src/project-config.ts)`);
  music = [f];
}
for (const f of music) files.push({ key: f, file: path.join(APP, f), kind: 'music' });
if (!listed.length && audioArg !== 'none') console.log('no music file of studioAudio exists: the page plays the click track and silence');
if (music.some((f) => f.toLowerCase().endsWith('.wav'))) console.log('note: a WAV is packed. A compressed copy with the same timing (m4a, mp3, opus) makes a much smaller page');

// ---- 3. the page -------------------------------------------------------------------------------------
const packed: Record<string, [string, string]> = {};
const sizes: Record<string, number> = {};
for (const { key, file, kind } of files) {
  const buf = readFileSync(file);
  packed[key] = [typeOf(file), buf.toString('base64')];
  sizes[kind] = (sizes[kind] ?? 0) + buf.length;
}

/**
 * Runs before the app: answers fetch() for the packed files and makes blob URLs for the music. A
 * path under the page's folder that was not packed answers 404 (204 when the app marks it as
 * optional), so the page never reads the disk and plays the same wherever it is opened.
 */
const shim = `(function () {
  var F = ${JSON.stringify(packed)};
  ${format ? `window.__filmFormat = ${JSON.stringify(format.name)};` : ''}
  var bytesOf = {}, urls = {};
  function bytes(k) {
    if (bytesOf[k]) return bytesOf[k];
    var s = F[k][1];
    var b = Uint8Array.fromBase64 ? Uint8Array.fromBase64(s) : Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
    return (bytesOf[k] = b);
  }
  var base = new URL('.', location.href).href;
  function key(u) {
    var a;
    try { a = new URL(u, location.href); } catch (e) { return null; }
    if (a.href.indexOf(base) !== 0) return null;
    return decodeURIComponent(a.href.slice(base.length).split(/[?#]/)[0]);
  }
  window.__filmFileUrl = function (p) {
    var k = key(p);
    if (k === null || !F[k]) return null;
    return urls[k] || (urls[k] = URL.createObjectURL(new Blob([bytes(k)], { type: F[k][0] })));
  };
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    var k = key(u);
    if (k === null) return realFetch(input, init);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var h = new Headers((init && init.headers) || (input && input.headers) || undefined);
    if (!F[k]) return Promise.resolve(new Response(null, { status: h.has('x-optional-file') ? 204 : 404 }));
    var b = bytes(k);
    return Promise.resolve(new Response(method === 'HEAD' ? null : b, { status: 200, headers: { 'content-type': F[k][0], 'content-length': String(b.length) } }));
  };
})();`;

// inline scripts end at the first "</script": write it so that the parser does not see one
const inline = (s: string) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

const kb = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} kB` : mb(n));
const listing = files.map((f) => `  ${f.key} (${kb(statSync(f.file).size)})`).join('\n');
const notice = `<!--
  ${PROJECT.title}: one self-contained page, built by scripts/build-single.ts. Open it in a browser; it
  needs no server and no network. Packed files:
${listing}
  Licences: the engine is derived from pdoom-video by Giacomo Magnanini (MIT); three.js (MIT) and
  opentype.js (MIT) are inside the script; the fonts are under the SIL Open Font License, whose texts
  are packed with them (fonts/*/OFL.txt), and the stroke font carries its own licence
  (fonts/stroke/LICENSE-hershey-fonts.txt).
-->`;

html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
const tag = /<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/;
if (!tag.test(html)) throw new Error('the built page has no module script tag to replace');
// (a function as the replacement, so that "$" in the code is not read as a pattern)
html = html.replace(tag, () => `<script>${inline(shim)}</script>\n<script type="module">${inline(code)}</script>`);
html = html.replace(/<!doctype html>/i, (m) => `${m}\n${notice}`);

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
rmSync(BUILD, { recursive: true, force: true });

const total = statSync(OUT).size;
console.log(`wrote ${path.relative(APP, OUT)}: ${mb(total)}`);
console.log(`  script ${mb(code.length)}; packed before base64: ${Object.entries(sizes).map(([k, v]) => `${k} ${mb(v)}`).join(', ') || 'nothing'}`);
if (total > 50e6) console.log('  over 50 MB: slow to open and to send. Pack a compressed copy of the music, or fewer or smaller pictures.');
