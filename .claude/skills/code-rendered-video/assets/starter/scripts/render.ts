#!/usr/bin/env bun
// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ../src/engine/LICENSE-pdoom-video.txt
// Changed for this project: video export is refused unless the owner asked for it; only one capture
// runs at a time (a lock at the repository root); output size, frame rate, audio file, studio port
// and default file names come from src/project-config.ts; the page must carry this film's marker;
// the graphics backend is chosen by platform; the reference video's `plates` mode was removed; stills
// can be addressed by frame number or beat index; a private dev server is used by default, as a single process
// that is always stopped; --format picks one of the film's formats; --page captures the single-file build
// from disk; stills and export frames wait for pictures that are loading (media.ts).
//
// Offline renderer. Drives the app in headless Chrome (?export=1) and either
//   stills:  bun scripts/render.ts stills --t 1.5,23,40.2 [--only id1,id2] [--out dir]
//            or --frames 109,110 (output frame numbers: t = n / fps, the times the export renders)
//            or --beats 8,8.5    (beat indices of the loaded beat grid, 0 = the first beat)
//   sheet:   bun scripts/render.ts sheet --from 20 --to 35 [--n 12] [--cols 4] [--only ids] [--out file.png]
//            or --times a,b,c | --frames 109,110 | --beats 8,8.5 | --cuts (4 frames round every cut)
//   --exact (stills, sheet): render every time as given. Without it a time given in seconds or beats
//            is moved to the nearest output frame, the only times the export renders (see stillTimes).
//   perf:    bun scripts/render.ts perf --from 20 --to 25 [--only ids] [--samples 1] [--shutter 0.5]   (avg ms per frame incl. GPU sync and the export's pixel readback)
//   video:   bun scripts/render.ts video [--from 0] [--to <duration>] [--crf 16] [--x264 aq-mode=3] [--samples 1] [--shutter 0.5] [--out out/<title>.mp4] [--noaudio]
//            (the frame rate is PROJECT.fps: scenes and the export must agree on it, so there is no --fps)
//            --samples N averages N sub-frames per frame over shutter×(1/fps): motion blur + temporal AA;
//            --samples auto picks the count per frame (4, 12, 36, 108 or 324, see Engine.render)
//   gpu:     bun scripts/render.ts gpu   (prints the WebGL renderer headless Chrome uses)
//   --format F (all modes): one of the formats of src/project-config.ts (9:16, 1:1, 16:9 ...); default
//            the master. Stills go to out/stills-<format>/ and a video to out/<title>-<format>.mp4.
//   --page P (all modes): capture this single-file build (bun run single) from disk instead of the
//            studio or a private server, e.g. --page out/single/starter-film.html
//   --scale N (all modes): render at N× the configured size (--scale 2 on 1920x1080 = true 3840x2160);
//            stills are then saved full-res from the pixel buffer, videos are encoded at the physical size.
//   --angle B (all modes): the graphics backend of Chrome: metal, d3d11, gl, vulkan, swiftshader or
//            default. Without it: metal on macOS, d3d11 on Windows, gl on Linux. Check with `gpu`.
// Starts a private server without live reload and stops it when done, so a file saved during a
// capture cannot change the picture. --url A (all modes) uses the server at A instead, for example
// the studio, only if this film is what answers there (the page marker names the film).
//
// Video export (mode `video`) is refused unless the environment variable OWNER_ASKED_FOR_VIDEO is
// `yes`, which the lead sets only when the owner asked for a video file in the current conversation.
import { chromium, type Page } from 'playwright-core';
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PROJECT, FRAME_DT, timeOfFrame, appMarker, formatSize, formatSlug } from '../src/project-config';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
/** A comma-separated list of numbers given with --k. */
const list = (k: string) => opt(k)!.split(',').map(Number);
/** The app folder: package.json, shots.json, copy.json, audio/, data/. */
const APP = path.resolve(import.meta.dir, '..');
const SCALE = Math.max(1, Math.round(+opt('scale', '1')!));
/** The format asked for (--format), or the master. An unknown name stops here, before any browser starts. */
const FORMAT = formatSize(opt('format'));
const MASTER = FORMAT.name === PROJECT.format;
const LW = FORMAT.width, LH = FORMAT.height; // logical size: the page viewport and the canvas on it
const OW = LW * SCALE, OH = LH * SCALE; // output size
/** Scratch and default output folder (ignored by git). */
const OUT = path.join(APP, 'out');
const slug = (PROJECT.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video') + (MASTER ? '' : `-${formatSlug(FORMAT.name)}`);
// --samples N (fixed) or --samples auto [--min-samples 4] [--max-samples 324] [--tol 3] (adaptive, see Engine.render)
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4')!, max: +opt('max-samples', '324')!, tol: +opt('tol', '3')! }
  : +opt('samples', '1')!;
const hist = (h: Record<string, number>) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');

// No video export unless the owner asked for one in the current conversation: it loads the machine
// heavily, and the film is delivered as the studio page.
if (mode === 'video' && process.env.OWNER_ASKED_FOR_VIDEO !== 'yes') {
  console.error('video export is refused: the film is delivered as the studio page. Set OWNER_ASKED_FOR_VIDEO=yes only when the owner asked for a video file in this conversation. Use stills or sheet to look at a moment.');
  process.exit(2);
}

/**
 * The folder that holds the lock: RENDER_LOCK_DIR when set; otherwise the nearest folder above the
 * app that holds `.git`; otherwise the nearest one that holds CLAUDE.md or AGENTS.md (the root of
 * a repository without git); otherwise the temporary folder of the machine. Every film under one
 * root shares the lock, wherever the film sits in the tree.
 */
function lockHome() {
  if (process.env.RENDER_LOCK_DIR) return path.resolve(process.env.RENDER_LOCK_DIR);
  const home = os.homedir();
  const up = (marks: string[]) => {
    for (let d = path.dirname(APP); d !== path.dirname(d) && d !== home; d = path.dirname(d))
      if (marks.some((m) => existsSync(path.join(d, m)))) return d;
    return null;
  };
  return up(['.git']) ?? up(['CLAUDE.md', 'AGENTS.md']) ?? os.tmpdir();
}

// One capture at a time for the whole repository, whoever starts it: a second run waits for the
// first. The lock is a folder holding the pid of its owner; a lock whose owner has gone is cleared.
const LOCK = path.join(lockHome(), '.render.lock');
function ownerAlive() {
  try { process.kill(+readFileSync(path.join(LOCK, 'pid'), 'utf8'), 0); return true; } catch { return false; }
}
async function acquireLock() {
  const t0 = Date.now();
  for (;;) {
    try {
      mkdirSync(LOCK);
      writeFileSync(path.join(LOCK, 'pid'), String(process.pid));
      return;
    } catch {
      // (the owner may be between mkdir and writing its pid: give it a moment before judging)
      if (!ownerAlive()) { await Bun.sleep(300); if (!ownerAlive()) rmSync(LOCK, { recursive: true, force: true }); continue; }
      if (Date.now() - t0 > 15 * 60_000) throw new Error(`waited 15 minutes for another capture to finish (lock ${LOCK}); giving up`);
      await Bun.sleep(500);
    }
  }
}
function releaseLock() {
  try { if (+readFileSync(path.join(LOCK, 'pid'), 'utf8') === process.pid) rmSync(LOCK, { recursive: true, force: true }); } catch { /* not ours, or gone */ }
}
process.on('exit', releaseLock);
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => { releaseLock(); process.exit(130); });
await acquireLock();

/** The marker of the page at `url` (the content of <meta name="render-app">), or null. */
async function markerAt(url: string) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return null;
    const tag = /<meta\b[^>]*\bname="render-app"[^>]*>/i.exec(await r.text());
    return tag ? /\bcontent="([^"]*)"/i.exec(tag[0])?.[1] ?? '' : null;
  } catch { return null; }
}
/** True when the server at `url` answers with this film's page, not another film's or anything else. */
const reachable = async (url: string) => (await markerAt(url)) === appMarker();

async function ensureServer(): Promise<{ url: string; stop: () => void }> {
  // the single-file build needs no server: it is opened from disk
  if (opt('page')) {
    const file = path.resolve(opt('page')!);
    if (!existsSync(file)) throw new Error(`--page ${file}: no such file (build it with bun run single)`);
    return { url: pathToFileURL(file).href, stop: () => {} };
  }
  // --url: a server the caller names, the studio for example; it has live reload on
  if (opt('url')) {
    const url = opt('url')!.replace(/\/+$/, '');
    if (await reachable(url)) return { url, stop: () => {} };
    const other = await markerAt(url);
    throw new Error(`--url ${url}: this film does not answer there${other === null ? '' : ` (the page there is '${decodeURIComponent(other.replace(/^code-rendered-video:/, ''))}', not '${PROJECT.title}')`}`);
  }
  const port = 5300 + Math.floor(Math.random() * 500);
  // no live reload: a file saved mid-render must not reload the page.
  // Vite is run as one node process (not through `bunx`, which would put it in a child that outlives a kill).
  const proc = Bun.spawn(['node', path.join(APP, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], { cwd: APP, stdout: 'ignore', stderr: 'ignore', env: { ...process.env, RENDER_NO_HMR: '1' } });
  const stop = () => { if (!proc.killed) proc.kill(); };
  // an interrupted render must not leave the server behind
  for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => { stop(); process.exit(130); });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 100 && !(await reachable(u)); i++) await Bun.sleep(100);
  if (!(await reachable(u))) { stop(); throw new Error(`the private dev server did not come up on ${u}`); }
  return { url: u, stop };
}

/** The graphics backend of Chrome: --angle, or the native one of this platform. */
function angleArgs() {
  const angle = opt('angle') ?? (process.platform === 'darwin' ? 'metal' : process.platform === 'win32' ? 'd3d11' : 'gl');
  // software rendering: every frame time measured there says nothing about playback
  return angle === 'swiftshader' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [`--use-angle=${angle}`];
}

async function openPage(url: string) {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !flag('headed'),
    args: [...angleArgs(), '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: LW, height: LH }, deviceScaleFactor: 1 });
    const logs: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    // (the console's "Failed to load resource" does not say which one)
    page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
    const only = opt('only');
    const query = `?export=1${only ? `&only=${only}` : ''}${SCALE !== 1 ? `&scale=${SCALE}` : ''}${MASTER ? '' : `&format=${encodeURIComponent(FORMAT.name)}`}`;
    await page.goto(opt('page') ? `${url}${query}` : `${url}/${query}`);
    await page.waitForFunction(() => (window as any).__render?.ready || (window as any).__render?.error, null, { timeout: 120000 });
    const err = await page.evaluate(() => (window as any).__render.error);
    if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
    const size: [number, number] = await page.evaluate(() => [(window as any).__render.width, (window as any).__render.height]);
    if (size[0] !== OW || size[1] !== OH) throw new Error(`app renders ${size[0]}x${size[1]}, expected ${OW}x${OH} (--scale ${SCALE}, --format ${FORMAT.name})`);
    const sceneErrors: string[] = await page.evaluate(() => (window as any).__render.errors);
    if (sceneErrors.length) console.error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
    return { browser, page, logs };
  } catch (e) {
    await browser.close();
    throw e;
  }
}

/**
 * The song times asked for: --t seconds, --frames output frame numbers, or --beats beat indices.
 * Every time is moved to the nearest output frame, because those are the only times the export
 * renders. A still between two frames has a shutter that straddles both, so with motion blur on,
 * text that steps on the frame (counters, labels) is drawn twice and looks broken when it is not.
 * Pass --exact to render the time as given. The sheet mode moves its times the same way.
 */
async function stillTimes(page: Page): Promise<number[]> {
  if (opt('frames')) return list('frames').map(timeOfFrame);
  const asked: number[] = opt('beats') ? await timesOfBeats(page, list('beats')) : (opt('t') ?? '0').split(',').map(Number);
  return onFrames(page, asked);
}

/** Song times of beat indices of the loaded beat grid. */
async function timesOfBeats(page: Page, beats: number[]): Promise<number[]> {
  return page.evaluate((bs) => bs.map((b) => (window as any).__render.timeOfBeat(b)), beats);
}

/** Each time moved to the nearest output frame (see stillTimes), or left as it is with --exact. */
async function onFrames(page: Page, asked: number[]): Promise<number[]> {
  if (flag('exact')) return asked;
  // A time is moved to the nearest frame. Asked for at the first beat of a shot, that frame may be the
  // last one of the shot before: then the first frame of the shot that was asked for is taken.
  const starts: number[] = (await page.evaluate(() => (window as any).__render.timeline)).map((e: { start: number }) => e.start);
  return asked.map((t) => {
    const f = Math.round(t / FRAME_DT);
    return timeOfFrame(starts.some((s) => s <= t && timeOfFrame(f) < s) ? f + 1 : f);
  });
}

async function stills(page: Page, times: number[], outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];
  for (const t of times) {
    const k: number = await page.evaluate(([t, s, sh]) => (window as any).__render.still(t, s, sh), [t, SAMPLES, +opt('shutter', '0.5')!] as const);
    const f = path.join(outDir, `f_${t.toFixed(3).padStart(8, '0')}.png`);
    if (typeof SAMPLES !== 'number') console.log(`t=${t}: ${k} sub-frames`);
    // at scale > 1 the canvas is shown downscaled on the page: save the full-res pixel buffer instead
    if (SCALE !== 1) await Bun.write(f, Buffer.from(await page.evaluate(() => (window as any).__render.png()), 'base64'));
    else await page.screenshot({ path: f, clip: { x: 0, y: 0, width: LW, height: LH } });
    files.push(f);
  }
  return files;
}

async function sheet(page: Page, times: number[], cols: number, out: string) {
  // thumbnails keep the output's aspect ratio, 480 px on the long side
  const k = 480 / Math.max(LW, LH);
  const cell = { cw: Math.round(LW * k), ch: Math.round(LH * k) };
  const dataUrl: string = await page.evaluate(async ({ times, cols, cw, ch }) => {
    // (each still waits for the pictures it shows, see media.ts)
    const P = (window as any).__render;
    const pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c') as HTMLCanvasElement;
    for (let i = 0; i < times.length; i++) {
      const t = times[i]!;
      await P.still(t);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 13);
    }
    return cv.toDataURL('image/png');
  }, { times, cols, ...cell });
  mkdirSync(path.dirname(out), { recursive: true });
  await Bun.write(out, Buffer.from(dataUrl.split(',')[1]!, 'base64'));
}

async function video(page: Page, from: number, to: number, out: string) {
  const fps = PROJECT.fps;
  if (OW % 2 || OH % 2) throw new Error(`H.264 (yuv420p) needs even dimensions, got ${OW}x${OH}`);
  mkdirSync(path.dirname(out), { recursive: true });
  const crf = opt('crf', '16')!;
  const audio = path.join(APP, PROJECT.audioFile);
  if (!flag('noaudio') && !existsSync(audio)) throw new Error(`audio file not found: ${audio} (set audioFile in src/project-config.ts, or pass --noaudio)`);
  const args = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
  // RGB is converted to YUV with the BT.709 matrix, and the file says so. Left to itself ffmpeg
  // converts with BT.601 and writes no tag, and players take untagged HD video to be BT.709: the
  // film's red (#FF3A2F) is then shown as #FF4B2A and its mint (#3CFFB0) as #2BE6AD.
  args.push('-vf', 'vflip,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', opt('preset', 'slow')!, '-crf', crf, '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-tune', 'grain', '-x264-params', opt('x264', 'aq-mode=3')!);
  // --threads N keeps the encoder to N threads, for a machine that is doing other work as well
  if (opt('threads')) args.push('-threads', String(Math.max(1, Math.round(+opt('threads')!))));
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = Bun.spawn(args, { stdin: 'pipe', stdout: 'inherit', stderr: 'inherit' });
  let frames = 0;
  const total = Math.round(to * fps) - Math.round(from * fps);
  const t0 = performance.now();
  // A page that stops sending frames (a lost GL context, a reload, a crash) would otherwise leave
  // this script waiting for ever with ffmpeg idle. The slowest frame, 324 sub-frames of a heavy
  // scene, takes a few seconds, so two minutes without a frame means the render is dead.
  const STALL_MS = 120_000;
  let lastFrameAt = performance.now();
  const stalled = () => performance.now() - lastFrameAt > STALL_MS;
  const stallError = () => new Error(`render stalled: no frame for ${STALL_MS / 1000} s after frame ${frames} of ${total} (t = ${(from + frames / fps).toFixed(2)} s)`);
  let watch: ReturnType<typeof setInterval> | undefined;
  const watchdog = new Promise<never>((_, reject) => { watch = setInterval(() => { if (stalled()) reject(stallError()); }, 1000); });
  /** Sub-frames per frame, as the page reports them when it has sent the last frame. */
  let used: Record<string, number> = {};
  const server = Bun.serve({
    port: 0,
    fetch(req, srv) { return srv.upgrade(req) ? undefined : new Response('ws only', { status: 400 }); },
    websocket: {
      maxPayloadLength: Math.max(64 * 1024 * 1024, OW * OH * 4 + 1024),
      async message(ws, msg) {
        // the one text message is the page's closing report, sent after the last frame
        if (typeof msg === 'string') { used = JSON.parse(msg).used ?? {}; return; }
        ff.stdin.write(msg as Uint8Array);
        await ff.stdin.flush();
        frames++;
        lastFrameAt = performance.now();
        ws.send(String(frames)); // ack: the page keeps at most a few frames ahead of ffmpeg (bounded memory at 4K)
        if (frames % 60 === 0 || frames === total) {
          const el = (performance.now() - t0) / 1000;
          process.stdout.write(`\r${frames}/${total} frames  ${(frames / el).toFixed(1)} fps  eta ${((total - frames) / (frames / el)).toFixed(0)}s   `);
        }
      },
    },
  });
  try {
    // Start the stream and do NOT wait for it to return. Playwright's debugging channel mirrors every
    // WebSocket frame the page sends (11 MB of base64 per 1080p frame), and the return value of a
    // call queues behind them all. Over a whole film that backlog takes many minutes to drain, long
    // after the last frame has arrived here. This script counts the frames itself, so it knows when
    // the render is complete without being told.
    let failed: Error | undefined;
    void page.evaluate((o) => { void (window as any).__render.stream(o); }, { from, to, fps, ws: `ws://localhost:${server.port}`, samples: SAMPLES, shutter: +opt('shutter', '0.5')!, inflight: 4 })
      .catch((e: Error) => { failed = e; });
    void watchdog.catch((e: Error) => { failed = e; });
    while (frames < total) {
      if (failed) throw failed;
      await Bun.sleep(20);
    }
    // the closing report follows the last frame at once; do not hold the file open for it
    for (let i = 0; i < 100 && !Object.keys(used).length; i++) await Bun.sleep(20);
    ff.stdin.end();
    const code = await ff.exited;
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
    const rendered = (performance.now() - t0) / 1000;
    console.log(`\nwrote ${out} (${frames} frames in ${rendered.toFixed(1)}s, ${(frames / rendered).toFixed(1)} fps, ${(rendered / (to - from)).toFixed(2)}x real time)`);
    console.log(`sub-frames per frame (count:frames): ${hist(used)}`);
  } finally {
    clearInterval(watch);
    server.stop(true);
    if (ff.exitCode === null) ff.kill();
  }
}

const { url, stop } = await ensureServer();
let browser: Awaited<ReturnType<typeof openPage>>['browser'] | undefined;
try {
  const opened = await openPage(url);
  browser = opened.browser;
  const { page, logs } = opened;
  if (mode === 'gpu') {
    console.log(await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')!;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }));
  } else if (mode === 'stills') {
    const files = await stills(page, await stillTimes(page), opt('out', path.join(OUT, MASTER ? 'stills' : `stills-${formatSlug(FORMAT.name)}`))!);
    console.log(files.join('\n'));
  } else if (mode === 'sheet') {
    const from = +opt('from', '0')!, to = +opt('to', '10')!, n = +opt('n', '12')!;
    let times = Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
    if (opt('times')) times = list('times');
    if (opt('beats')) times = await timesOfBeats(page, list('beats'));
    if (flag('cuts')) {
      // 4 frames around every timeline boundary: 2 frames before, 2 after
      const tl: { id: string; start: number }[] = await page.evaluate(() => (window as any).__render.timeline);
      times = tl.slice(1).flatMap((e) => [e.start - 0.1, e.start - FRAME_DT, e.start + FRAME_DT, e.start + 0.1]);
    }
    // output frame numbers are frame times already; every other time is moved onto a frame unless --exact
    times = opt('frames') ? list('frames').map(timeOfFrame) : await onFrames(page, times);
    const out = opt('out', path.join(OUT, `sheets/sheet_${from}-${to}${MASTER ? '' : `_${formatSlug(FORMAT.name)}`}.png`))!;
    await sheet(page, times, +opt('cols', '4')!, out);
    console.log(out);
  } else if (mode === 'perf') {
    const from = +opt('from', '0')!, to = +opt('to', '5')!;
    const r = await page.evaluate(async ({ from, to, dt, samples, shutter }) => {
      const P = (window as any).__render;
      const ms: number[] = [];
      const buf = new Uint8Array(P.width * P.height * 4);
      await P.still(from);
      const used: Record<number, number> = {};
      for (let t = from; t < to; t += dt) {
        const a = performance.now();
        const k = P.engine.render(t, dt, false, samples, shutter);
        used[k] = (used[k] ?? 0) + 1;
        await P.engine.readPixelsAsync(buf);
        ms.push(performance.now() - a);
      }
      if (!ms.length) return null;
      ms.sort((a, b) => a - b);
      return { n: ms.length, avg: ms.reduce((a, b) => a + b, 0) / ms.length, p50: ms[ms.length >> 1], p95: ms[Math.floor(ms.length * 0.95)], max: ms[ms.length - 1], used };
    }, { from, to, dt: FRAME_DT, samples: SAMPLES, shutter: +opt('shutter', '0.5')! });
    if (!r) throw new Error(`perf: no frame between ${from} s and ${to} s (--to must be later than --from)`);
    console.log(`frames ${r.n}  avg ${r.avg.toFixed(1)}ms  p50 ${r.p50.toFixed(1)}  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  sub-frames ${hist(r.used)}`);
  } else if (mode === 'video') {
    const dur: number = await page.evaluate(() => (window as any).__render.duration);
    await video(page, +opt('from', '0')!, +opt('to', String(dur))!, path.resolve(opt('out', path.join(OUT, `${slug}.mp4`))!));
  } else {
    throw new Error(`unknown mode '${mode}' (stills, sheet, perf, video, gpu)`);
  }
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  // Closing the browser is a request on the debugging channel, which after a long video render is
  // still busy with copies of the frames. The file is already written, so the browser gets a few
  // seconds to close politely and is otherwise ended together with this process.
  await Promise.race([browser?.close(), Bun.sleep(5000)]);
  stop();
}
process.exit(0);
