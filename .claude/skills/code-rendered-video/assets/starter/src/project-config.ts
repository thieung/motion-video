// Project configuration: the ONE place that defines what is rendered, at what size and rate, and
// where the studio serves it.
//
// Read by the browser app (src/main.ts, src/engine/*), by the studio server (vite.config.ts) and by
// the capture tool (scripts/render.ts, run with bun), so this module must stay free of DOM, Vite
// and Node imports.
//
// The canvas, the render targets, the page layout, the headless viewport and the export frame
// size all follow the output size: `width` and `height` (the master format), or another named
// format of `formats`, chosen by the page parameter `?format=` in the studio and by the flag
// `--format` of the capture tool. The zones of src/scenes/parts/kit-frame.ts follow the format too.

export interface ProjectConfig {
  /**
   * The name of the film. Shown as the page title and the heading of the studio, carried in the page
   * marker the capture tool looks for, and used (slugified) for the default export file name.
   */
  title: string;
  /**
   * The master of the music, as a path relative to the app folder (the folder of package.json).
   * The export muxes this file. The same string must work as a URL path and as a file path.
   * It may be missing: the studio then plays a click track made from the beat grid.
   */
  audioFile: string;
  /**
   * What the studio plays, in the order its music switch steps through them: compressed copies of
   * `audioFile` and of its alternatives, so the page loads quickly. They must have the same timing
   * as `audioFile`, so the one beat grid serves them all. A file that is missing is skipped. After
   * them the switch always offers the click track made from the beat grid, and silence.
   */
  studioAudio: { label: string; file: string }[];
  /** Output frames per second. Export frame n is rendered at song time n * (1 / fps). */
  fps: number;
  /**
   * Output width in px at scale 1, of the master format: the one the film is made and approved in.
   * Scenes lay out in these (logical) pixels. Must be even for H.264.
   */
  width: number;
  /** Output height in px at scale 1, of the master format. Must be even for H.264. */
  height: number;
  /** The name of the master format, for example '9:16'. Its size is `width` x `height`. */
  format: string;
  /**
   * Other formats the same film can be looked at in, by name, for example `'1:1': { width: 1080,
   * height: 1080 }`. Chosen by `?format=<name>` in the studio and `--format <name>` in the capture
   * tool; without it the master is used. The kit's zones follow the format (kit-frame.ts); where a
   * scene puts things in each format is the builder's work. Sizes must be even for H.264.
   */
  formats: Record<string, FormatSize>;
  /**
   * The port of the studio (`bun run studio`). Fixed: the server refuses to start when the port is
   * taken, so a studio that was left running shows itself instead of a second one starting. The
   * capture tool uses the studio only when asked (`--url http://localhost:<studioPort>`). Give each
   * film on one machine a port of its own.
   */
  studioPort: number;
}

/** The size of one format, in logical px (scale 1). */
export interface FormatSize { width: number; height: number }

export const PROJECT: ProjectConfig = {
  title: 'Starter Film',
  // Put the real track here (a WAV master) and its beat grid in data/audio.json; see README.md.
  audioFile: 'audio/track.wav',
  studioAudio: [
    { label: 'track', file: 'audio/track.m4a' },
    // the score written in code (data/score.json), once bun run score has made it
    { label: 'score', file: 'audio/score.wav' },
  ],
  fps: 60,
  // the master format: vertical, 9:16
  width: 1080,
  height: 1920,
  format: '9:16',
  // other formats of the same film, looked at with ?format=1:1 or --format 1:1
  formats: {
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
    '16:9': { width: 1920, height: 1080 },
  },
  studioPort: 5180,
};

/** Every format by name, the master first. */
export const FORMATS: Record<string, FormatSize> = { [PROJECT.format]: { width: PROJECT.width, height: PROJECT.height }, ...PROJECT.formats };

/** A format by name (the master when the name is empty). An unknown name is an error that lists the known ones. */
export function formatSize(name?: string | null): FormatSize & { name: string } {
  const key = name || PROJECT.format;
  const f = FORMATS[key];
  if (!f) throw new Error(`unknown format '${key}': the formats of this film are ${Object.keys(FORMATS).join(', ')} (src/project-config.ts)`);
  return { name: key, ...f };
}

/** A format name as a file-name part: '16:9' -> '16x9'. */
export const formatSlug = (name: string) => name.replace(/[^A-Za-z0-9]+/g, 'x');

/**
 * The format of this page: `?format=` of the page address in the browser (or the format a
 * single-file build was made in), the master everywhere
 * else (the capture tool reads its flag `--format` and calls formatSize itself). An unknown name in
 * the address is reported in the console and the master is used; the capture tool, which checks
 * the size of what the page renders, then stops with an error.
 */
export const OUTPUT: FormatSize & { name: string } = (() => {
  // (a single-file build made with --format opens in that format: it sets __filmFormat)
  const asked = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('format') ?? (globalThis as any).__filmFormat ?? null;
  try { return formatSize(asked); } catch (e) { console.error(String(e)); return formatSize(); }
})();

/** Seconds per output frame. */
export const FRAME_DT = 1 / PROJECT.fps;

/** Song time of output frame n: the exact expression the export uses, so stills can match video frames. */
export const timeOfFrame = (n: number) => n * FRAME_DT;

/**
 * The value of the page's `<meta name="render-app">` marker. It names the film, so the capture
 * tool never attaches to the studio of another film that happens to answer on the same port.
 */
export const appMarker = (title = PROJECT.title) => `code-rendered-video:${encodeURIComponent(title)}`;
