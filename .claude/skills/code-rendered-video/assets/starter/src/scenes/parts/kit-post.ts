// Shared kit: the look of the finished frame, and passes a shot runs on its own layers before the
// frame is finished. A shot returns one of the presets from render(), changing only what its moment
// needs. Read-only for scene authors.
//
//   POST_DARK, POST_LIGHT, TYPE_TINT   presets of the post chain (src/engine/post.ts)
//   Blur                               a soft copy of a texture: depth of field for flat layers, a window out of focus, frost
//   Liquid                             goo (shapes that melt together) and liquid glass (refraction of what is behind)
//   Difference                         a layer blended by difference over a picture
//
// The passes work in linear light on the GPU, the same on every browser (the canvas `filter`
// property, which Safari lacks, is never needed). Each costs one or more full-screen passes: see
// the notes on each.
import * as THREE from 'three';
import type { PostOverrides } from '../../engine/scene';
import { FSPass, makeRT, W, H } from '../../engine/gl';

/**
 * For a shot on a dark ground. Bloom starts above 1.0 in linear light: paper-coloured lines and
 * type are below that and do not glow; signal and the key hues are drawn at 2.0 and more and do.
 */
export const POST_DARK = {
  bloom: 0.7,
  bloomThreshold: 1.0,
  bloomKnee: 0.2,
  bloomRadius: 0.75,
  halation: 0.25,
  ca: 0.4,
  grain: 0.045,
  vignette: 0.4,
} satisfies PostOverrides;

/** For a shot on a light ground: nothing glows, the paper keeps its grain. */
export const POST_LIGHT = {
  bloom: 0,
  bloomThreshold: 4,
  bloomKnee: 0.2,
  bloomRadius: 0.75,
  halation: 0,
  ca: 0.25,
  grain: 0.05,
  vignette: 0.18,
} satisfies PostOverrides;

export const postFor = (tone: 'dark' | 'light') => (tone === 'dark' ? POST_DARK : POST_LIGHT);

/**
 * Tint for a layer of paper-coloured type when it is composited over a dark ground
 * (`comp.draw(..., { tint: TYPE_TINT })`): keeps the type safely under the bloom threshold.
 */
export const TYPE_TINT: [number, number, number] = [0.86, 0.86, 0.86];

// ---- blur -----------------------------------------------------------------------------------------

const BLUR_FRAG = /* glsl */ `
  uniform sampler2D src; uniform vec2 dir; uniform float sigma; uniform bool premultiply;
  void main() {
    // a Gaussian of 25 taps along one axis; the taps are spread so that they cover three sigma
    float stepPx = max(1.0, 3.0 * sigma / 12.0);
    vec4 sum = vec4(0.0); float wsum = 0.0;
    for (int i = -12; i <= 12; i++) {
      float x = float(i) * stepPx;
      float w = exp(-0.5 * x * x / max(sigma * sigma, 1e-4));
      vec4 c = texture(src, vUv + dir * x);
      if (premultiply) c.rgb *= c.a;
      sum += c * w; wsum += w;
    }
    fragColor = sum / wsum;
  }`;

/**
 * A soft copy of a texture, by a Gaussian blur in two passes (across, then down) on a target
 * `down` times smaller than the frame. `radius` is the blur's sigma in logical px of the frame.
 *
 * The result is premultiplied (colour times coverage), so that soft edges of a layer do not turn
 * dark: composite it with `premult: false`. Pass `premultiply: true` when the source is a Layer2D
 * (straight alpha), false when it is a render target (already premultiplied, or opaque).
 *
 * Cost: two passes over a quarter of the frame at `down` 2, about the price of one full-screen
 * pass. A radius above about 24 px at `down` 2 is better done at `down` 4.
 */
export class Blur {
  private a: THREE.WebGLRenderTarget;
  private b: THREE.WebGLRenderTarget;
  private pass = new FSPass(BLUR_FRAG, { src: { value: null }, dir: { value: new THREE.Vector2() }, sigma: { value: 1 }, premultiply: { value: false } });
  constructor(public w = W, public h = H, public down = 2) {
    this.a = makeRT(w / down, h / down, { depthBuffer: false, pxScale: 1 });
    this.b = makeRT(w / down, h / down, { depthBuffer: false, pxScale: 1 });
  }
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, radius: number, premultiply = true): THREE.Texture {
    const u = this.pass.u, s = radius / this.down;
    const tw = this.a.width, th = this.a.height;
    u.sigma!.value = s;
    u.src!.value = src; u.premultiply!.value = premultiply;
    (u.dir!.value as THREE.Vector2).set(1 / tw, 0);
    this.pass.render(renderer, this.a);
    u.src!.value = this.a.texture; u.premultiply!.value = false;
    (u.dir!.value as THREE.Vector2).set(0, 1 / th);
    this.pass.render(renderer, this.b);
    return this.b.texture;
  }
  dispose() { this.a.dispose(); this.b.dispose(); this.pass.mat.dispose(); }
}

/**
 * Depth of field for flat layers: the blur radius (px) of a layer at `depth` when the lens is
 * focused at `focus` (any unit, the same for both), `aperture` px of blur per unit away from focus,
 * no more than `max`. A layer in focus (radius under half a pixel) is composited as it is.
 */
export const dofRadius = (depth: number, focus: number, aperture = 12, max = 40) => Math.min(max, Math.abs(depth - focus) * aperture);

// ---- goo and liquid glass -------------------------------------------------------------------------

const LIQUID_FRAG = /* glsl */ `
  uniform sampler2D mask; uniform sampler2D field; uniform sampler2D behind; uniform sampler2D frosted;
  uniform int mode;               // 0 goo, 1 glass
  uniform bool gooShape;          // the shape is the blurred field cut at the threshold (goo); else the sharp mask
  uniform float threshold, refraction, chroma, frost, rim, shine, shadow, bevel;
  uniform vec3 colour, tint; uniform vec2 light, res, shadowOffset;

  float fieldAt(vec2 uv) { return texture(field, uv).a; }

  void main() {
    vec2 px = 1.0 / res;
    float f = fieldAt(vUv);
    // the slope of the field, taken 3 px apart (the field is stored at half size): it points into the shape
    vec2 e = 3.0 * px;
    vec2 g = vec2(fieldAt(vUv + vec2(e.x, 0.0)) - fieldAt(vUv - vec2(e.x, 0.0)), fieldAt(vUv + vec2(0.0, e.y)) - fieldAt(vUv - vec2(0.0, e.y)));
    float gl = length(g);
    vec2 n = gl > 1e-6 ? g / gl : vec2(0.0);
    // the light is given in the frame (y down); the field is sampled with y up
    vec2 L = normalize(vec2(light.x, -light.y));
    float cover;
    if (gooShape) { float aa = max(fwidth(f), 1e-4); cover = smoothstep(threshold - aa, threshold + aa, f); }
    else cover = texture(mask, vUv).a;
    // how far into the bevel: 1 at the rim, 0 on the flat top
    float depth = clamp((f - threshold) / max(1.0 - threshold, 1e-3), 0.0, 1.0);
    float edge = 1.0 - smoothstep(0.0, 0.85, depth);
    if (mode == 0) {
      // goo: a flat colour with a highlight on the side that faces the light
      float lit = max(dot(-n, L), 0.0);
      vec3 c = colour * (0.82 + 0.18 * (1.0 - edge)) + vec3(shine) * pow(lit * edge, 3.0);
      fragColor = vec4(c * cover, cover);
      return;
    }
    // glass: what is behind, bent at the rim, split into its colours there, frosted, lit at its edge
    vec2 off = -n * refraction * edge * edge * px;
    vec3 b;
    vec3 src0 = frost > 0.0 ? texture(frosted, vUv + off).rgb : texture(behind, vUv + off).rgb;
    if (chroma > 0.0) {
      b.r = (frost > 0.0 ? texture(frosted, vUv + off * (1.0 + chroma)).r : texture(behind, vUv + off * (1.0 + chroma)).r);
      b.g = src0.g;
      b.b = (frost > 0.0 ? texture(frosted, vUv + off * (1.0 - chroma)).b : texture(behind, vUv + off * (1.0 - chroma)).b);
    } else b = src0;
    b *= tint;
    // a thin bright line where the rim faces the light, a fainter one opposite, as a glass edge catches light twice
    float facing = dot(-n, L);
    float line = exp(-pow((depth - 0.06) / 0.07, 2.0)) * (depth > 0.0 ? 1.0 : 0.0);
    b += vec3(rim) * line * (0.35 + 0.65 * max(facing, 0.0)) + vec3(rim * 0.35) * line * max(-facing, 0.0);
    // the top of the glass is a touch brighter than what is behind it
    b += vec3(shine * 0.04) * (1.0 - edge);
    vec3 outside = texture(behind, vUv).rgb;
    // a soft shadow the glass throws on what is behind it
    float sh = shadow * texture(field, vUv - shadowOffset * px).a * (1.0 - cover);
    outside *= 1.0 - sh;
    fragColor = vec4(mix(outside, b, cover), 1.0);
  }`;

export interface GooStyle {
  /** How far apart shapes may be and still melt together (px): the blur that makes the field. */
  radius?: number;
  /** Linear colour of the goo. */
  colour?: [number, number, number];
  /** Strength of the highlight on the lit side, 0..2. */
  shine?: number;
  /** Direction the light comes from, in the frame (y down). */
  light?: [number, number];
}

export interface GlassStyle {
  /** Width of the rounded rim in which the glass bends the light (px). */
  bevel?: number;
  /** How far the picture is pulled at the rim (px). */
  refraction?: number;
  /** Colour split at the rim: 0 none, 0.15 visible. */
  chroma?: number;
  /** Blur of what is seen through the glass (px); 0 is clear glass. Costs a blur of `behind`. */
  frost?: number;
  /** Brightness of the edge light (linear; above 1 blooms), and of the top. */
  rim?: number;
  shine?: number;
  /** Linear tint of the glass. */
  tint?: [number, number, number];
  /** Direction the light comes from (y down). */
  light?: [number, number];
  /** A shadow under the glass: its darkness (0..1) and offset (px). */
  shadow?: number;
  shadowOffset?: [number, number];
  /** Melt the shapes together as goo does, with this radius (px); 0 keeps the mask's own edges. */
  goo?: number;
}

/**
 * Goo and liquid glass. Both start from a MASK: a Layer2D on which the shot draws the shapes in
 * white (circles, rounded rectangles, a word, anything), on a transparent ground. The mask is
 * blurred into a smooth field; the shapes are then read from that field.
 *
 * Goo (`goo`): the shape is where the field passes one half. Two circles near each other swell
 * towards each other and join with a neck, and a drop pulled away stretches and pinches off: the
 * blur-and-threshold method, done on the GPU. Drawn over `out`, flat coloured with a highlight.
 *
 * Glass (`glass`): what is BEHIND the glass (the shot's picture, rendered into a target of its own
 * first) is drawn through the shapes: bent at the rim, split into colours there, frosted if asked,
 * with a bright line where the rim meets the light and a soft shadow outside. It overwrites the
 * whole of `out` (outside the shapes it copies `behind`), so `behind` and `out` must be different
 * targets. With `goo` > 0 the glass shapes melt together too: a glass drop that stretches into a
 * toolbar.
 *
 * Cost: goo is one blur (see Blur) and one full-screen pass; glass adds a second blur when frosted.
 * Keep it to the shot that needs it.
 */
export class Liquid {
  private blur: Blur;
  private frostBlur: Blur | null = null;
  private pass = new FSPass(LIQUID_FRAG, {
    mask: { value: null }, field: { value: null }, behind: { value: null }, frosted: { value: null },
    mode: { value: 0 }, gooShape: { value: true }, threshold: { value: 0.5 }, refraction: { value: 30 }, chroma: { value: 0.12 },
    frost: { value: 0 }, rim: { value: 1.2 }, shine: { value: 1 }, shadow: { value: 0.25 }, bevel: { value: 20 },
    colour: { value: new THREE.Vector3(1, 1, 1) }, tint: { value: new THREE.Vector3(1, 1, 1) },
    light: { value: new THREE.Vector2(-0.6, -0.8) }, res: { value: new THREE.Vector2(W, H) }, shadowOffset: { value: new THREE.Vector2(0, 14) },
  }, { blending: THREE.CustomBlending, transparent: true });
  constructor(w = W, h = H) {
    this.blur = new Blur(w, h, 2);
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
    m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  }

  /** Goo from the shapes on `mask` (a Layer2D texture), drawn over `out`. */
  goo(renderer: THREE.WebGLRenderer, mask: THREE.Texture, out: THREE.WebGLRenderTarget, s: GooStyle = {}) {
    const u = this.pass.u;
    u.field!.value = this.blur.render(renderer, mask, s.radius ?? 18, true);
    u.mask!.value = mask;
    u.mode!.value = 0; u.gooShape!.value = true; u.threshold!.value = 0.5;
    (u.colour!.value as THREE.Vector3).set(...(s.colour ?? [1, 1, 1]));
    u.shine!.value = s.shine ?? 0.8;
    (u.light!.value as THREE.Vector2).set(...(s.light ?? [-0.6, -0.8]));
    this.pass.render(renderer, out);
  }

  /** Liquid glass: `behind` seen through the shapes on `mask`. Overwrites `out`. */
  glass(renderer: THREE.WebGLRenderer, mask: THREE.Texture, behind: THREE.Texture, out: THREE.WebGLRenderTarget, s: GlassStyle = {}) {
    const u = this.pass.u;
    const goo = s.goo ?? 0;
    u.field!.value = this.blur.render(renderer, mask, goo > 0 ? goo : (s.bevel ?? 16) * 0.5, true);
    u.mask!.value = mask;
    u.behind!.value = behind;
    if ((s.frost ?? 0) > 0) {
      this.frostBlur ??= new Blur(W, H, 2);
      u.frosted!.value = this.frostBlur.render(renderer, behind, s.frost!, false);
    } else u.frosted!.value = behind;
    u.mode!.value = 1; u.gooShape!.value = goo > 0;
    // with the mask's own edges, the field is 0.5 on them; the rim is the inner half of the blur
    u.threshold!.value = goo > 0 ? 0.5 : 0.5;
    u.refraction!.value = s.refraction ?? 36;
    u.chroma!.value = s.chroma ?? 0.12;
    u.frost!.value = s.frost ?? 0;
    u.rim!.value = s.rim ?? 1.1;
    u.shine!.value = s.shine ?? 1;
    u.shadow!.value = s.shadow ?? 0.22;
    (u.shadowOffset!.value as THREE.Vector2).set(...(s.shadowOffset ?? [0, 16]));
    (u.tint!.value as THREE.Vector3).set(...(s.tint ?? [1.02, 1.02, 1.04]));
    (u.light!.value as THREE.Vector2).set(...(s.light ?? [-0.6, -0.8]));
    // glass writes every pixel: no blending
    const m = this.pass.mat;
    const prev = m.blending;
    m.blending = THREE.NoBlending;
    this.pass.render(renderer, out);
    m.blending = prev;
  }

  dispose() { this.blur.dispose(); this.frostBlur?.dispose(); this.pass.mat.dispose(); }
}

// ---- difference -----------------------------------------------------------------------------------

/**
 * A layer blended by difference over a picture: where the layer is white the picture is inverted,
 * where it is black the picture is unchanged, as in a drawing program. Worked out on the values
 * encoded for the screen (so it looks as designers expect), then turned back to linear light;
 * values above 1 are clipped. Writes the whole of `out`, which must not be `base`.
 * Cost: one full-screen pass.
 */
export class Difference {
  private pass = new FSPass(/* glsl */ `
    uniform sampler2D src; uniform sampler2D base; uniform float opacity;
    void main() {
      vec4 s = texture(src, vUv);
      vec3 b = toSRGB(sat(texture(base, vUv).rgb));
      vec3 d = abs(b - toSRGB(sat(s.rgb)));
      fragColor = vec4(toLinear(mix(b, d, s.a * opacity)), 1.0);
    }`, { src: { value: null }, base: { value: null }, opacity: { value: 1 } });
  render(renderer: THREE.WebGLRenderer, layer: THREE.Texture, base: THREE.Texture, out: THREE.WebGLRenderTarget, opacity = 1) {
    this.pass.u.src!.value = layer;
    this.pass.u.base!.value = base;
    this.pass.u.opacity!.value = opacity;
    this.pass.render(renderer, out);
  }
  dispose() { this.pass.mat.dispose(); }
}
