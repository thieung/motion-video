// Pictures from files: photos, logos and screenshots (`ImageTexture`, `loadBitmap`), and clips as
// numbered image sequences (`ImageSequence`). Written for this project (not part of pdoom-video).
//
// Where the files live: `media/` of the film folder, served by the studio server at /media/ and
// packed into the single-file build (scripts/build-single.ts). Paths are written relative to the
// film folder, for example 'media/logo.png' or 'media/clip/%04d.jpg'.
//
// How a picture reaches the GPU: decoded once into an ImageBitmap (converted to sRGB by the
// browser, whatever colour profile the file carries), uploaded as plain RGBA8 bytes and copied
// into an 8-bit sRGB texture in linear light by `copyToSRGB` (gl.ts), the same path as a canvas
// layer. Never an sRGB upload: that is the slow path of Chrome on Windows.
//
// Why captures wait: every load goes through `track`, and the engine's `renderSettled` draws a frame,
// waits while any load is pending, and draws it again. A still or an export frame therefore shows
// the clip frame of its own time, never one that was still loading. The studio, which plays in real
// time, shows the nearest frame already loaded while the right one loads, and draws again when it
// has arrived.
import * as THREE from 'three';
import { FSPass, H, SCALE, W, copyToSRGB, getLayerRenderer, plainTexture, srgbTarget } from './gl';

// ---- loads the engine waits for ------------------------------------------------------------------

const pending = new Set<Promise<unknown>>();

/** Registers a load, so that a still or an export frame waits for it (see Engine.renderSettled). */
export function track<T>(p: Promise<T>): Promise<T> {
  pending.add(p);
  const done = () => { pending.delete(p); };
  p.then(done, done);
  return p;
}

/** True while any picture is loading. */
export const mediaPending = () => pending.size > 0;

/** Resolves when no picture is loading any more (failed loads count as finished). */
export async function mediaSettled() {
  while (pending.size) await Promise.allSettled([...pending]);
}

// ---- files ---------------------------------------------------------------------------------------

/**
 * A file of the film folder as a Blob. Uses fetch, which the single-file build answers from the
 * files packed into the page, so the same code runs in the studio and from disk.
 */
export async function fetchFile(path: string): Promise<Blob> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status === 404 ? 'not found' : `HTTP ${r.status}`} (pictures live in media/ of the film folder)`);
  return r.blob();
}

const bitmaps = new Map<string, Promise<ImageBitmap>>();

/**
 * A picture file decoded into an ImageBitmap, in sRGB, once per path and size. `maxSize` limits
 * the longer side (the picture is scaled down with high quality when it is larger), which keeps
 * a 6000 px photo from filling the graphics memory. Draw it on a canvas layer with `drawImageFit`,
 * or hand it to an ImageTexture.
 */
export function loadBitmap(path: string, maxSize = 4096): Promise<ImageBitmap> {
  const key = `${path}@${maxSize}`;
  let p = bitmaps.get(key);
  if (!p) {
    p = track((async () => {
      const blob = await fetchFile(path);
      const full = await createImageBitmap(blob, { colorSpaceConversion: 'default' });
      const k = Math.min(1, maxSize / Math.max(full.width, full.height));
      if (k >= 1) return full;
      const w = Math.max(1, Math.round(full.width * k)), h = Math.max(1, Math.round(full.height * k));
      full.close();
      return createImageBitmap(blob, { colorSpaceConversion: 'default', resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    })());
    bitmaps.set(key, p);
    // a failed load may be tried again later (the file may be added while the studio runs)
    p.catch(() => bitmaps.delete(key));
  }
  return p;
}

// ---- placing a picture in a rectangle --------------------------------------------------------------

/** A rectangle in logical px, origin top left (the same shape as `Rect` of kit-frame.ts). */
export interface Box { x0: number; y0: number; x1: number; y1: number }

/** How a picture fills its rectangle. */
export type Fit = 'cover' | 'contain' | 'stretch';

export interface Placement {
  /** How the picture fills the rectangle. Default 'cover': it fills it, and what overflows is cut off. */
  fit?: Fit;
  /** Where the picture sits when it does not fit exactly: 0 left or top, 0.5 centre, 1 right or bottom. */
  align?: [number, number];
  /** Magnification inside the rectangle (1 = as fitted). With `focus`, a slow push on a photo. */
  zoom?: number;
  /** The point of the picture that stays put under `zoom`, 0..1 of its width and height. Default the centre. */
  focus?: [number, number];
}

/**
 * Where a picture of `pw` x `ph` lands in `box`: the rectangle it is drawn into (`dst`) and the part of
 * the picture shown there (`src`, 0..1 of the picture, top-left origin). Pure arithmetic, shared by
 * the canvas helper and the GPU pass.
 */
export function placePicture(pw: number, ph: number, box: Box, o: Placement = {}) {
  const fit = o.fit ?? 'cover', [ax, ay] = o.align ?? [0.5, 0.5];
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
  let dst: Box = { ...box };
  let src: Box = { x0: 0, y0: 0, x1: 1, y1: 1 };
  if (fit === 'contain') {
    const k = Math.min(bw / pw, bh / ph), w = pw * k, h = ph * k;
    dst = { x0: box.x0 + (bw - w) * ax, y0: box.y0 + (bh - h) * ay, x1: 0, y1: 0 };
    dst.x1 = dst.x0 + w; dst.y1 = dst.y0 + h;
  } else if (fit === 'cover') {
    const k = Math.max(bw / pw, bh / ph), sw = bw / (pw * k), sh = bh / (ph * k);
    src = { x0: (1 - sw) * ax, y0: (1 - sh) * ay, x1: 0, y1: 0 };
    src.x1 = src.x0 + sw; src.y1 = src.y0 + sh;
  }
  const z = Math.max(1e-3, o.zoom ?? 1);
  if (z !== 1) {
    const [fx, fy] = o.focus ?? [(src.x0 + src.x1) / 2, (src.y0 + src.y1) / 2];
    const sw = (src.x1 - src.x0) / z, sh = (src.y1 - src.y0) / z;
    // the focus keeps its place in the rectangle; the window is kept inside the picture when it can be
    const u = (fx - src.x0) / (src.x1 - src.x0), v = (fy - src.y0) / (src.y1 - src.y0);
    let x0 = fx - u * sw, y0 = fy - v * sh;
    if (z > 1) { x0 = Math.min(Math.max(x0, 0), 1 - sw); y0 = Math.min(Math.max(y0, 0), 1 - sh); }
    src = { x0, y0, x1: x0 + sw, y1: y0 + sh };
  }
  return { dst, src };
}

/**
 * Draws a picture (an ImageBitmap, a canvas, an image element) into a rectangle of a canvas layer,
 * fitted as asked. Clip the context first for rounded corners or any other mask. Nothing is drawn
 * for a null picture, so a clip frame that has not loaded leaves the rectangle empty.
 */
export function drawImageFit(c: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number } | null, box: Box, o: Placement = {}) {
  if (!img || !img.width || !img.height) return;
  const { dst, src } = placePicture(img.width, img.height, box, o);
  c.drawImage(img, src.x0 * img.width, src.y0 * img.height, (src.x1 - src.x0) * img.width, (src.y1 - src.y0) * img.height,
    dst.x0, dst.y0, dst.x1 - dst.x0, dst.y1 - dst.y0);
}

// ---- a picture as a texture ------------------------------------------------------------------------

/**
 * A photo, logo or screenshot as a texture in linear light, for shaders, three.js materials and
 * `drawPicture`. Load it in the scene's `init()`, which the engine awaits:
 *
 *   private logo = new ImageTexture();
 *   override async init() { await this.logo.load('media/logo.png'); }
 *
 * `texture` is an 8-bit sRGB texture with mipmaps, top of the picture at v = 1. `width` and
 * `height` are the picture's px after `maxSize`.
 */
export class ImageTexture {
  private source = plainTexture();
  private target: THREE.WebGLRenderTarget | null = null;
  width = 0;
  height = 0;
  constructor(private mipmaps = true) {}

  get texture(): THREE.Texture {
    if (!this.target) throw new Error('ImageTexture: nothing loaded yet (await load() in init())');
    return this.target.texture;
  }
  get loaded() { return !!this.target; }
  get aspect() { return this.height ? this.width / this.height : 1; }

  /** Loads and uploads a picture file. `maxSize` limits its longer side, in px. */
  async load(path: string, maxSize = 4096) {
    this.set(await loadBitmap(path, maxSize));
    return this;
  }

  /** Uploads a picture already decoded (a clip frame, a canvas). The target is remade when the size changes. */
  set(image: ImageBitmap | HTMLCanvasElement | HTMLImageElement, renderer: THREE.WebGLRenderer | null = getLayerRenderer()) {
    if (!renderer) throw new Error('ImageTexture.set: no renderer yet (call it from init() or render())');
    const w = image.width, h = image.height;
    if (!this.target || this.target.width !== w || this.target.height !== h) {
      this.target?.dispose();
      this.target = srgbTarget(w, h, this.mipmaps);
      this.source.dispose();
      this.source = plainTexture();
    }
    this.source.image = image;
    this.width = w;
    this.height = h;
    copyToSRGB(renderer, this.source, this.target);
  }

  dispose() { this.source.dispose(); this.target?.dispose(); this.target = null; }
}

const PICTURE_FRAG = /* glsl */ `
  uniform sampler2D tex; uniform vec4 dst; uniform vec4 src; uniform vec2 res; uniform float radius;
  uniform float px; uniform float opacity; uniform vec3 tint;
  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * res;                 // logical px, y down
    vec2 c = 0.5 * (dst.xy + dst.zw), hs = 0.5 * (dst.zw - dst.xy);
    vec2 q = abs(p - c) - hs + radius;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    float cover = clamp(0.5 - d * px, 0.0, 1.0);             // one physical px of soft edge
    if (cover <= 0.0) discard;
    vec2 k = (p - dst.xy) / max(dst.zw - dst.xy, vec2(1e-6));
    vec2 s = mix(src.xy, src.zw, k);                          // 0..1 of the picture, y down
    vec4 t = texture(tex, vec2(s.x, 1.0 - s.y));
    float a = t.a * cover * opacity;
    fragColor = vec4(t.rgb * tint * a, a);
  }`;
let picturePass: FSPass | null = null;

export interface PictureStyle extends Placement {
  /** Corner radius in logical px. */
  radius?: number;
  opacity?: number;
  /** Multiplies the colour, in linear light. */
  tint?: [number, number, number];
}

/**
 * Draws a texture (an ImageTexture's, or any texture with the top at v = 1) into a rectangle of `out`,
 * fitted as asked, with rounded corners and an edge that is soft by one physical px, over what is
 * there (premultiplied `normal` blending). `size` is the picture's own width and height, which the
 * fit needs.
 */
export function drawPicture(renderer: THREE.WebGLRenderer, tex: THREE.Texture, size: [number, number], out: THREE.WebGLRenderTarget | null, box: Box, o: PictureStyle = {}) {
  const { dst, src } = placePicture(size[0], size[1], box, o);
  if (!picturePass) {
    picturePass = new FSPass(PICTURE_FRAG, {
      tex: { value: null }, dst: { value: new THREE.Vector4() }, src: { value: new THREE.Vector4() }, res: { value: new THREE.Vector2(W, H) },
      radius: { value: 0 }, px: { value: SCALE }, opacity: { value: 1 }, tint: { value: new THREE.Vector3(1, 1, 1) },
    }, { blending: THREE.CustomBlending, transparent: true });
    const m = picturePass.mat;
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
    m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  }
  const u = picturePass.u;
  u.tex!.value = tex;
  (u.dst!.value as THREE.Vector4).set(dst.x0, dst.y0, dst.x1, dst.y1);
  (u.src!.value as THREE.Vector4).set(src.x0, src.y0, src.x1, src.y1);
  u.radius!.value = Math.max(0, Math.min(o.radius ?? 0, (dst.x1 - dst.x0) / 2, (dst.y1 - dst.y0) / 2));
  u.opacity!.value = o.opacity ?? 1;
  (u.tint!.value as THREE.Vector3).set(...(o.tint ?? [1, 1, 1]));
  picturePass.render(renderer, out);
}

// ---- a clip as a numbered image sequence --------------------------------------------------------------

export interface SequenceOptions {
  /**
   * The file of each frame, with a printf-style number: 'media/clip/%04d.jpg' reads
   * media/clip/0001.jpg, 0002.jpg, ... (the numbering ffmpeg writes by default).
   */
  pattern: string;
  /** Number of frames. */
  count: number;
  /** Frames per second of the sequence (the rate it was extracted at, not the film's). */
  fps: number;
  /** The number of the first file. Default 1. */
  first?: number;
  /** Frames loaded ahead of the one asked for, so playback finds them ready. Default 12. */
  ahead?: number;
  /** Frames kept in memory around the one asked for; the rest are released. Default 48. */
  keep?: number;
  /** Longer side of each frame in px, scaled down when larger. Default 2048. */
  maxSize?: number;
}

/**
 * A clip as numbered pictures, one file per frame, loaded as they are needed. Time inside the clip
 * is in seconds from its first frame; the scene decides where the clip starts in the shot:
 *
 *   private clip = new ImageSequence({ pattern: 'media/run/%04d.jpg', count: 90, fps: 30 });
 *   ...
 *   drawImageFit(c, this.clip.frameAt(f.t - f.start), box);
 *
 * Before its first frame and after its last the clip holds that frame. Every load is tracked, so a
 * still or an export frame shows exactly the frame of its time (see the top of this file).
 */
export class ImageSequence {
  private frames = new Map<number, ImageBitmap>();
  private loading = new Map<number, Promise<void>>();
  private failed = new Set<number>();
  private tex: ImageTexture | null = null;
  private texIndex = -1;
  readonly count: number;
  readonly fps: number;
  constructor(private o: SequenceOptions) {
    this.count = Math.max(1, Math.floor(o.count));
    this.fps = o.fps;
  }

  /** Length of the clip in seconds. */
  get duration() { return this.count / this.fps; }

  /** The file of frame i (0-based). */
  path(i: number) {
    const n = (this.o.first ?? 1) + i;
    return this.o.pattern.replace(/%(0?)(\d*)d/, (_, z: string, w: string) => String(n).padStart(z ? +w || 0 : 0, '0'));
  }

  /** The frame shown at `s` seconds into the clip (clamped to the clip). */
  index(s: number) {
    return Math.min(this.count - 1, Math.max(0, Math.floor(s * this.fps + 1e-6)));
  }

  /** Starts loading frame i unless it is loaded, loading or missing. */
  request(i: number) {
    if (i < 0 || i >= this.count || this.frames.has(i) || this.loading.has(i) || this.failed.has(i)) return;
    const path = this.path(i);
    const p = track((async () => {
      try {
        const blob = await fetchFile(path);
        const max = this.o.maxSize ?? 2048;
        let bmp = await createImageBitmap(blob, { colorSpaceConversion: 'default' });
        const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
        if (k < 1) {
          const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
          bmp.close();
          bmp = await createImageBitmap(blob, { colorSpaceConversion: 'default', resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
        }
        this.frames.set(i, bmp);
      } catch (e) {
        this.failed.add(i);
        console.error(`image sequence: ${String((e as Error)?.message ?? e)}`);
      } finally {
        this.loading.delete(i);
      }
    })());
    this.loading.set(i, p);
  }

  /**
   * The picture of the frame at `s` seconds into the clip. When that frame is not loaded yet, it is
   * asked for and the nearest loaded frame before it is returned (the next after it when there is
   * none before), or null when nothing is loaded. The frames after it are asked for as well, and
   * frames far from it are released.
   */
  frameAt(s: number): ImageBitmap | null {
    const i = this.index(s);
    const ahead = this.o.ahead ?? 12;
    for (let k = 0; k <= ahead; k++) this.request(i + k);
    this.release(i);
    const hit = this.frames.get(i);
    if (hit) return hit;
    let best: ImageBitmap | null = null, bestD = Infinity;
    for (const [j, b] of this.frames) {
      const d = j <= i ? i - j : (j - i) + this.count; // earlier frames first
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  /** The frame at `s` as a texture (see ImageTexture), uploaded only when the frame changes. Null until a frame is loaded. */
  textureAt(s: number): ImageTexture | null {
    const img = this.frameAt(s);
    if (!img) return null;
    const i = [...this.frames].find(([, b]) => b === img)![0];
    this.tex ??= new ImageTexture(false);
    if (i !== this.texIndex) { this.tex.set(img); this.texIndex = i; }
    return this.tex;
  }

  /** Resolves when the frame at `s` is loaded (or has failed). */
  async ready(s: number) {
    const i = this.index(s);
    this.request(i);
    await this.loading.get(i);
  }

  private release(i: number) {
    const keep = this.o.keep ?? 48, before = Math.floor(keep / 4);
    for (const [j, b] of this.frames) if (j < i - before || j > i + keep) { b.close(); this.frames.delete(j); if (j === this.texIndex) this.texIndex = -1; }
  }

  dispose() {
    for (const b of this.frames.values()) b.close();
    this.frames.clear();
    this.tex?.dispose();
    this.tex = null;
  }
}
