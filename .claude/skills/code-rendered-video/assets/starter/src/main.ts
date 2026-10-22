// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./engine/LICENSE-pdoom-video.txt
// Changed for this project: title, audio file, frame rate and canvas size come from
// project-config.ts; the export API is published as window.__render; the scene hot swap was
// rebuilt (it never ran: a saved scene reloaded the whole page); the preview player became the
// studio page, with the shot list, a switch between versions of the music, and a click track made
// from the beat grid when the film has no music file; the format switch (?format=); `window.seek(t)`;
// frames wait for pictures that are loading (media.ts); the single-file build is served its music
// from the page itself.
//
// Entry: the studio page (default) or export mode (?export=1, driven by scripts/render.ts). The
// same code runs in the studio (dev server) and in the single-file build (scripts/build-single.ts).
import { Engine, type AdaptiveSampling } from './engine/engine';
import type { SceneClass } from './engine/scene';
import { W, H, PW, PH, SCALE } from './engine/gl';
import { makeTimeline, CARD } from './timeline';
import { GROUPS, SHOTS, groupHeading } from './film';
import { clickTrackUrl } from './click-track';
import { PROJECT, FRAME_DT, FORMATS, OUTPUT } from './project-config';
import { mediaPending } from './engine/media';

const params = new URLSearchParams(location.search);
const EXPORT = params.has('export');
const ONLY = params.get('only'); // comma-separated scene ids to load (faster stills)
const FROM = params.get('t') ? parseFloat(params.get('t')!) : null;
/**
 * The single-file build (scripts/build-single.ts) packs the film's files into the page and answers
 * fetch() from them; an audio element needs a URL, which this gives (a blob URL of the packed file,
 * or the path itself in the studio).
 */
const fileUrl = (path: string): string => (window as any).__filmFileUrl?.(path) ?? path;
const SINGLE = !!(window as any).__filmFileUrl;

// the page follows the configured output size (index.html reads these custom properties)
document.title = PROJECT.title;
document.getElementById('film-title')!.textContent = PROJECT.title;
if (OUTPUT.name !== PROJECT.format) document.title = `${PROJECT.title} (${OUTPUT.name})`;
const rootStyle = document.documentElement.style;
rootStyle.setProperty('--out-w', `${W}px`);
rootStyle.setProperty('--out-h', `${H}px`);
rootStyle.setProperty('--out-aspect', `${W} / ${H}`);

const canvas = document.getElementById('c') as HTMLCanvasElement;
// physical size: the configured size times ?scale= (the page CSS keeps showing it at the logical size)
canvas.width = PW;
canvas.height = PH;

const engine = new Engine(canvas, makeTimeline);

declare global {
  interface Window {
    __render: any;
    /**
     * Draws the frame of song time t and resolves when it is on the canvas with every picture
     * loaded. The name many prompts ask for; in the studio it also moves the player there (paused).
     */
    seek: (t: number) => Promise<void>;
    /** Length of the film in seconds (set when the page has loaded). */
    duration: number;
  }
}

let TIMELINE: typeof engine.timeline = [];

async function boot() {
  const onlySet = ONLY ? new Set(ONLY.split(',')) : null;
  // the overlay belongs to every shot, so it is loaded whichever shots were asked for
  await engine.init(onlySet ? (e) => !!e.overlay || onlySet.has(e.id) : undefined);
  TIMELINE = engine.timeline;
  window.duration = engine.duration;
  if (EXPORT) setupExport();
  else await setupPlayer();
}

// ------------------------------------------------------------------ export API
function setupExport() {
  document.body.classList.add('export');
  window.__render = {
    engine,
    duration: engine.duration,
    errors: engine.errors,
    /** Output size in px (the configured size times scale); stream() sends frames of width*height*4 bytes. */
    scale: SCALE,
    width: PW,
    height: PH,
    /** Logical (scale 1) size and frame rate, as configured; the name of the format (`?format=`). */
    logicalWidth: W,
    logicalHeight: H,
    format: OUTPUT.name,
    fps: PROJECT.fps,
    timeline: TIMELINE.filter((e) => !e.overlay).map(({ id, start, end }) => ({ id, start, end })),
    /** Song time (s) of a (fractional) beat index of the loaded beat grid. */
    timeOfBeat(i: number) { return engine.audio.timeOfBeat(i); },
    /**
     * Render a single frame at t (seeks as needed) and resolve when it is drawn with every picture
     * that it shows loaded. Resolves to the number of sub-frames used.
     */
    still(t: number, samples: number | AdaptiveSampling = 1, shutter = 0.5) { return engine.renderSettled(t, FRAME_DT, true, samples, shutter); },
    /** The last rendered frame as a full-resolution (PW x PH) PNG, base64 (for stills at scale > 1). */
    async png() {
      const px = await engine.readPixelsAsync(), row = PW * 4;
      const img = new ImageData(PW, PH);
      for (let y = 0; y < PH; y++) img.data.set(px.subarray((PH - 1 - y) * row, (PH - y) * row), y * row); // bottom-up -> top-down
      const oc = new OffscreenCanvas(PW, PH);
      oc.getContext('2d')!.putImageData(img, 0, 0);
      const b = new Uint8Array(await (await oc.convertToBlob({ type: 'image/png' })).arrayBuffer());
      let s = '';
      for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
      return btoa(s);
    },
    /**
     * Render [from, to) at fps and stream raw RGBA frames (bottom-up) over a WebSocket.
     * Returns when all frames were sent, with a histogram of sub-frames per frame. With `inflight`, the
     * receiver acknowledges each frame it has handed on (a text message with its running count) and at
     * most `inflight` frames are unacknowledged:
     * backpressure from the encoder, so a slow encode (4K) cannot pile frames up in the receiver's memory.
     */
    async stream(opts: { from: number; to: number; fps: number; ws: string; samples?: number | AdaptiveSampling; shutter?: number; inflight?: number }) {
      const ws = new WebSocket(opts.ws);
      ws.binaryType = 'arraybuffer';
      let acked = 0;
      ws.onmessage = (e) => { if (typeof e.data === 'string') acked = Math.max(acked, +e.data || 0); };
      await new Promise<void>((res, rej) => { ws.onopen = () => res(); ws.onerror = (e) => rej(e); });
      const dt = 1 / opts.fps;
      const n0 = Math.round(opts.from * opts.fps), n1 = Math.round(opts.to * opts.fps);
      const buf = new Uint8Array(PW * PH * 4);
      // warm-up: render one frame before the range so the first frame is sequential for stateful scenes
      const S = opts.samples ?? 1, SH = opts.shutter ?? 0.5;
      // (adaptive sampling only runs stateless scenes: one sample is enough for the warm-up)
      if (n0 > 0) await engine.renderSettled((n0 - 1) * dt, dt, false, typeof S === 'number' ? S : 1, SH);
      const used: Record<number, number> = {}; // sub-frames per frame -> frames
      for (let n = n0; n < n1; n++) {
        const k = await engine.renderSettled(n * dt, dt, false, S, SH);
        used[k] = (used[k] ?? 0) + 1;
        await engine.readPixelsAsync(buf);
        if (opts.inflight) while (n - n0 - acked >= opts.inflight) await new Promise((r) => setTimeout(r, 2));
        while (ws.bufferedAmount > 64 * 1024 * 1024) await new Promise((r) => setTimeout(r, 2));
        ws.send(buf);
        if (n % 30 === 0) await new Promise((r) => setTimeout(r, 0)); // let the socket flush
      }
      // The histogram goes to the receiver over the socket, after the last frame. The receiver must
      // not wait for this call to return: the browser's debugging channel carries a copy of every
      // frame sent, and the return value queues behind all of them, minutes behind on a full film.
      ws.send(JSON.stringify({ used }));
      while (ws.bufferedAmount > 0) await new Promise((r) => setTimeout(r, 5));
      ws.close();
      return used;
    },
  };
  window.seek = async (t: number) => { await engine.renderSettled(t, FRAME_DT, true); };
  window.__render.ready = true;
}

// ------------------------------------------------------------------ studio
/** One thing the music switch can play: a file of the film, or the click track, heard or muted. */
interface Source { label: string; url: string; muted?: boolean }

/**
 * True when the studio server has this audio file (asked as optional: a missing one answers an empty
 * 204). In the single-file build the page answers the same question from the files packed into it.
 */
async function hasAudio(file: string) {
  try {
    const r = await fetch(file, { method: 'HEAD', headers: { 'x-optional-file': '1' } });
    return r.ok && (r.headers.get('content-type') ?? '').startsWith('audio');
  } catch { return false; }
}

// The page the film is watched on: every shot in order, with the music. A shot that has no
// module yet is played by the storyboard card, so the whole film can be played from the first day.
async function setupPlayer() {
  // the film's own tracks that exist, then the click track of the beat grid, heard and muted
  const sources: Source[] = [];
  for (const a of PROJECT.studioAudio) if (await hasAudio(a.file)) sources.push({ label: a.label, url: fileUrl(a.file) });
  const click = clickTrackUrl(engine.audio);
  sources.push({ label: 'click', url: click }, { label: 'silent', url: click, muted: true });
  let source = 0;
  const audio = new Audio();
  audio.preload = 'auto';
  const $ = (id: string) => document.getElementById(id)!;
  const scrub = $('scrub') as HTMLInputElement;
  const info = $('info'), errs = $('errs'), list = $('shots'), playBtn = $('play'), musicBtn = $('music'), now = $('now'), formatBtn = $('format');
  scrub.max = String(engine.duration);
  scrub.step = '0.001';
  if (engine.errors.length) { errs.textContent = engine.errors.join('\n\n'); errs.style.display = 'block'; }

  let t = FROM ?? 0;
  let playing = false;
  let loop: [number, number] | null = null;
  let lastAudioT = 0, lastPerf = 0;
  const seek = (x: number) => { t = Math.max(0, Math.min(engine.duration - 0.001, x)); audio.currentTime = t; };
  const entries = TIMELINE.filter((e) => !e.overlay);
  const entryAt = (x: number) => entries.find((e) => x >= e.start && x < e.end);

  // the shot list, grouped as the storyboard groups it
  const rows = new Map<string, HTMLElement>();
  let lastGroup = '';
  for (const e of entries) {
    const shot = SHOTS.find((s) => s.id === e.id);
    const group = shot ? GROUPS.find((g) => g.id === shot.group) : undefined;
    if (group && group.id !== lastGroup) {
      lastGroup = group.id;
      const h = document.createElement('div');
      h.className = 'group';
      h.textContent = groupHeading(group);
      list.appendChild(h);
    }
    const r = document.createElement('div');
    r.className = `shot${e.file === CARD ? ' card' : ''}`;
    const cell = (cls: string, text: string) => {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = text;
      r.appendChild(s);
    };
    cell('t', `${Math.floor(e.start / 60)}:${(e.start % 60).toFixed(1).padStart(4, '0')}`);
    cell('n', shot?.title ?? e.id);
    cell('s', e.file === CARD ? 'card' : 'built');
    r.title = e.id;
    r.onclick = () => seek(e.start + 1e-3);
    list.appendChild(r);
    rows.set(e.id, r);
  }
  const built = entries.filter((e) => e.file !== CARD).length;
  $('count').textContent = `${built} of ${entries.length} shots built`;

  const setPlaying = (on: boolean) => {
    playing = on;
    if (on) { audio.currentTime = t; void audio.play(); } else audio.pause();
    playBtn.textContent = on ? 'Pause' : 'Play';
  };
  const toggle = () => setPlaying(!playing);
  const setMusic = (i: number) => {
    source = i % sources.length;
    const src = sources[source]!;
    const was = playing;
    audio.pause();
    if (audio.src !== new URL(src.url, location.href).href) audio.src = src.url;
    audio.muted = !!src.muted;
    audio.currentTime = t;
    musicBtn.textContent = `Music: ${src.label}`;
    if (was) void audio.play();
  };
  setMusic(0);
  seek(t);
  canvas.onclick = toggle;
  playBtn.onclick = toggle;
  musicBtn.onclick = () => setMusic(source + 1);
  // The format is decided when the page loads (every target has its size then): the switch loads
  // the page again with the next format and the same time. Hidden when the film has one format.
  const formats = Object.keys(FORMATS);
  const nextFormat = () => {
    const u = new URL(location.href);
    const next = formats[(formats.indexOf(OUTPUT.name) + 1) % formats.length]!;
    if (next === PROJECT.format) u.searchParams.delete('format'); else u.searchParams.set('format', next);
    u.searchParams.set('t', t.toFixed(3));
    location.href = u.href;
  };
  formatBtn.textContent = `Format: ${OUTPUT.name}`;
  if (formats.length > 1) formatBtn.onclick = nextFormat; else formatBtn.style.display = 'none';
  window.seek = async (x: number) => {
    setPlaying(false);
    seek(x);
    await engine.renderSettled(Math.min(t, engine.duration - 1e-3), FRAME_DT);
    drawn = t;
  };
  scrub.oninput = () => seek(parseFloat(scrub.value));
  // the scrub bar gives the focus back at once, so the arrow keys keep their own step
  scrub.onchange = () => scrub.blur();
  window.addEventListener('keydown', (ev) => {
    if (ev.target instanceof HTMLInputElement && ev.target !== scrub) return;
    const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (key === ' ') { ev.preventDefault(); toggle(); }
    if (key === 'ArrowRight') { ev.preventDefault(); seek(t + (ev.shiftKey ? 5 : 1)); }
    if (key === 'ArrowLeft') { ev.preventDefault(); seek(t - (ev.shiftKey ? 5 : 1)); }
    if (key === '.') seek(t + FRAME_DT);
    if (key === ',') seek(t - FRAME_DT);
    if (key === 'm') setMusic(source + 1);
    if (key === 'f' && formats.length > 1) nextFormat();
    if (key === 'l') { const e = entryAt(t); loop = loop ? null : e ? [e.start, e.end] : null; }
    if (key === ']') { const e = entries.find((x) => x.start > t + 0.01); if (e) seek(e.start + 1e-3); }
    if (key === '[') { const es = entries.filter((x) => x.start < t - 0.3); const e = es[es.length - 1]; if (e) seek(e.start + 1e-3); }
  });

  let frames = 0, fpsT = performance.now(), fps = 0, shown = '';
  // A paused page draws nothing: the picture on screen is already the picture of this time.
  // `drawn` is the time last drawn; a scene that was swapped in sets it back, so that it is drawn.
  let drawn = -1;
  // a picture that arrives after its frame was drawn (media.ts) is drawn once it is there
  let wasLoading = false;
  const tick = () => {
    const loading = mediaPending();
    if (wasLoading && !loading) drawn = -1;
    wasLoading = loading;
    if (playing) {
      // smooth the coarse audio clock with performance.now()
      const nowT = performance.now();
      if (audio.currentTime !== lastAudioT) { lastAudioT = audio.currentTime; lastPerf = nowT; }
      t = lastAudioT + (audio.paused ? 0 : (nowT - lastPerf) / 1000);
      if (loop && t >= loop[1]) seek(loop[0]);
      if (audio.ended) setPlaying(false);
    }
    if (playing || t !== drawn) {
      engine.render(Math.min(t, engine.duration - 1e-3), FRAME_DT);
      drawn = t;
      frames++;
    }
    scrub.value = String(t);
    const p = performance.now();
    if (p - fpsT > 500) { fps = (frames * 1000) / (p - fpsT); frames = 0; fpsT = p; }
    const e = entryAt(t);
    if (e && e.id !== shown) {
      rows.get(shown)?.classList.remove('on');
      const r = rows.get(e.id);
      r?.classList.add('on');
      r?.scrollIntoView({ block: 'nearest' });
      shown = e.id;
      now.textContent = SHOTS.find((s) => s.id === e.id)?.title ?? e.id;
    }
    // the bar counts from zero, the beat within the bar from one (four beats to a bar)
    info.textContent = `${OUTPUT.name}${SINGLE ? ' single file' : ''}   ${t.toFixed(2)} s   bar ${Math.floor(engine.audio.barAt(t))}   beat ${(Math.floor(engine.audio.beatAt(t)) % 4) + 1}   ${playing ? `${fps.toFixed(0)} fps` : 'paused'}${loop ? '   LOOP' : ''}`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Hot swap: when a scene module was re-imported (see the scene-hot-swap plugin in vite.config.ts),
  // rebuild every timeline entry that plays it from the new module. The player keeps its position.
  window.addEventListener('scene-module-updated', async (ev) => {
    const { file, module } = (ev as CustomEvent<{ file: string; module: { default: SceneClass } }>).detail;
    for (const e of TIMELINE) if (e.file === file) await engine.reload(e.id, module);
    drawn = -1;
    errs.textContent = engine.errors.join('\n\n');
    errs.style.display = engine.errors.length ? 'block' : 'none';
  });
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f55;position:fixed;top:0;left:0">${String(e?.stack ?? e)}</pre>`);
  window.__render = { error: String(e?.stack ?? e) };
});
