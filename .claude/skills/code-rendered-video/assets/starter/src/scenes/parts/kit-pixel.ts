// Shared kit: pixel art at an integer scale. A shot draws on a small canvas of its own logical
// resolution (128 x 96, 90 x 160, ...), every pixel from a small palette and on the grid, and the
// kit lays it on the frame with each of its pixels exactly `factor` by `factor` output pixels,
// with no smoothing. Read-only for scene authors.
//
// Pixel art wants the finish off: return POST_PIXEL from render(). Bloom, grain, colour fringing
// and a vignette put colours between the palette's colours and soften the edges the look is made of.
// Motion is stepped: work poses out from `stepTime(frameTime(f.t), 12)` (frameTime is in
// kit-frame.ts), 8 to 12 poses a second, while the studio still plays at the film's frame rate.
import * as THREE from 'three';
import { FSPass, Layer2D, W, H } from '../../engine/gl';
import type { PostOverrides } from '../../engine/scene';

type Ctx = CanvasRenderingContext2D;

/** The finish for pixel art: nothing glows, nothing is grained, fringed or darkened at the corners. */
export const POST_PIXEL = {
  bloom: 0,
  bloomThreshold: 4,
  halation: 0,
  ca: 0,
  grain: 0,
  vignette: 0,
} satisfies PostOverrides;

const FRAG = /* glsl */ `
  uniform sampler2D src; uniform vec2 low; uniform vec2 res; uniform vec2 origin; uniform float factor; uniform float pxScale;
  void main() {
    // this fragment in logical px of the frame, y down
    vec2 p = vec2(gl_FragCoord.x, res.y * pxScale - gl_FragCoord.y) / pxScale;
    vec2 q = floor((p - origin) / factor);
    if (q.x < 0.0 || q.y < 0.0 || q.x >= low.x || q.y >= low.y) discard;
    // the layer's texture holds the canvas top at the top (v = 1): turn the row round
    vec4 c = texelFetch(src, ivec2(int(q.x), int(low.y) - 1 - int(q.y)), 0);
    fragColor = vec4(c.rgb * c.a, c.a);
  }`;

export class PixelLayer {
  /** The small canvas. Draw on `ctx` in its own pixels, on whole numbers. */
  readonly layer: Layer2D;
  /** Output px per pixel of the art, in logical px of the frame. */
  readonly factor: number;
  /** Where the art's top left corner lands on the frame, in logical px (centred by default). */
  readonly origin: [number, number];
  private pass: FSPass;

  /**
   * `w` by `h` pixels of art. `factor` defaults to the largest whole number at which the art fits
   * the frame; the rest of the frame is left as it was (draw a ground under it first).
   */
  constructor(readonly w: number, readonly h: number, factor?: number, origin?: [number, number]) {
    this.factor = factor ?? Math.max(1, Math.floor(Math.min(W / w, H / h)));
    this.origin = origin ?? [Math.floor((W - w * this.factor) / 2), Math.floor((H - h * this.factor) / 2)];
    this.layer = new Layer2D(w, h, 1);
    this.layer.ctx.imageSmoothingEnabled = false;
    this.pass = new FSPass(FRAG, {
      src: { value: null }, low: { value: new THREE.Vector2(w, h) }, res: { value: new THREE.Vector2(W, H) },
      origin: { value: new THREE.Vector2(...this.origin) }, factor: { value: this.factor }, pxScale: { value: 1 },
    }, { blending: THREE.CustomBlending, transparent: true });
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
    m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  }

  get ctx(): Ctx { return this.layer.ctx; }

  /** Clears the small canvas, to a colour or to nothing. */
  clear(colour?: string) {
    this.layer.clear(colour);
    this.layer.ctx.imageSmoothingEnabled = false;
  }

  /** Uploads the art and lays it over `out`, each pixel a square of `factor` px, no smoothing. */
  draw(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget) {
    const u = this.pass.u;
    u.src!.value = this.layer.upload(renderer);
    u.pxScale!.value = out.width / W;
    this.pass.render(renderer, out);
  }

  dispose() { this.layer.dispose(); this.pass.mat.dispose(); }
}

/**
 * A time stepped to `rate` steps per unit: seconds for poses a second (pass `frameTime(f.t)`), or
 * the frame clock's beats for poses a beat. Work the pose out from the result.
 */
export const stepTime = (t: number, rate = 12) => Math.floor(t * rate + 1e-6) / rate;

/** One pixel. */
export function dot(c: Ctx, x: number, y: number, colour: string) {
  c.fillStyle = colour;
  c.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/** A line of whole pixels from one point to another (Bresenham), with no soft edge. */
export function pixelLine(c: Ctx, x0: number, y0: number, x1: number, y1: number, colour: string) {
  c.fillStyle = colour;
  let x = Math.round(x0), y = Math.round(y0);
  const xe = Math.round(x1), ye = Math.round(y1);
  const dx = Math.abs(xe - x), dy = -Math.abs(ye - y), sx = x < xe ? 1 : -1, sy = y < ye ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    c.fillRect(x, y, 1, 1);
    if (x === xe && y === ye) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

/**
 * A sprite written as rows of characters, one character a pixel, looked up in `palette`; a
 * character the palette does not have ('.' by habit) is left empty. Drawn with its top left at
 * (x, y), rounded to the grid; `flip` mirrors it.
 *
 *   sprite(c, ['.kk.', 'kyyk', '.kk.'], { k: '#1a1033', y: '#ffc42e' }, 10, 20)
 */
export function sprite(c: Ctx, rows: string[], palette: Record<string, string>, x: number, y: number, flip = false) {
  const x0 = Math.round(x), y0 = Math.round(y);
  rows.forEach((row, j) => {
    const n = row.length;
    for (let i = 0; i < n; i++) {
      const col = palette[row[i]!];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x0 + (flip ? n - 1 - i : i), y0 + j, 1, 1);
    }
  });
}

/**
 * Forces the pixels of the small canvas onto the palette: each to the nearest colour of `palette`
 * (by a weighted distance close to what the eye sees), alpha to 0 or 1. Run it after anything that
 * drew a soft edge (an arc, text, a rotated part). Give `rect` (x, y, w, h) and only the colours of
 * that shape (the moon and the sky behind it) to snap one shape without pulling its edge pixels
 * towards an unrelated colour. It reads and writes the canvas, so keep the art small.
 */
export function toPalette(p: PixelLayer, palette: string[], rect: [number, number, number, number] = [0, 0, p.w, p.h]) {
  const cols = palette.map((h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; });
  const c = p.ctx;
  const [rx, ry, rw, rh] = rect.map(Math.round) as [number, number, number, number];
  const img = c.getImageData(rx, ry, rw, rh);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3]! < 128) { d[i + 3] = 0; continue; }
    let best = 0, bestD = Infinity;
    for (let k = 0; k < cols.length; k++) {
      const q = cols[k]!, rm = (d[i]! + q[0]) / 2;
      const dr = d[i]! - q[0], dg = d[i + 1]! - q[1], db = d[i + 2]! - q[2];
      const e = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (e < bestD) { bestD = e; best = k; }
    }
    const q = cols[best]!;
    d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; d[i + 3] = 255;
  }
  c.putImageData(img, rx, ry);
}
