// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./LICENSE-pdoom-video.txt
// Global post-processing: bloom + halation, chromatic aberration, tone shoulder,
// film grain, vignette, fades/flash. Operates on the composited HDR (linear) frame.
// Changed for this project: the HUD layer and the parameters that drove it (hud, frame, pdoom,
// paper, pdoomText, hudCorruption) were removed; the flash colour is the palette's `fg`; looks a
// shot may ask for were added, each off by default: hue rotation, kaleidoscope, fisheye, a local
// bulge, mosaic, glitch tearing and a CRT screen.
import * as THREE from 'three';
import { FSPass, makeRT, W, H, SCALE } from './gl';
import { PROJECT } from '../project-config';

/** The tone shoulder (linear HDR -> 0..1 linear), shared with the engine's sampling error estimate. */
export const SHOULDER_GLSL = /* glsl */ `
vec3 shoulder(vec3 x) {
  // identity below k, smooth exponential shoulder above; very bright values desaturate toward white
  const float k = 0.72;
  vec3 y = mix(x, k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k))), step(k, x));
  float over = max(max(x.r, x.g), x.b);
  return mix(y, vec3(1.0), smoothstep(2.0, 12.0, over) * 0.85);
}`;

export interface PostParams {
  exposure: number;
  bloom: number; // bloom strength
  bloomThreshold: number; // linear luminance where bloom starts
  bloomKnee: number; // soft knee width
  bloomRadius: number; // 0..1 upsample spread
  halation: number; // red-orange film halation around highlights
  ca: number; // chromatic aberration in px at the frame edge
  grain: number; // grain amplitude (sRGB units), ~0.04-0.1
  vignette: number; // 0..1
  fade: number; // fade to black 0..1
  flash: number; // additive flash in the palette's `fg` colour, 0..1+
  shake: [number, number]; // frame offset in px
  zoom: number; // frame zoom (1 = none), for punch-ins on hits
  invert: number; // 0..1 invert (dark <-> light), applied before grain
  // ---- looks a shot asks for; each is off at its default and then costs nothing ----
  hue: number; // hue rotation of the whole frame, radians (grey stays grey)
  kaleido: number; // number of mirrored sectors round the centre, 0 = off (6 to 12 reads as a kaleidoscope)
  kaleidoTurn: number; // turn of the sectors, radians
  fisheye: number; // -1..0.9: above 0 the middle of the frame swells (1 / (1 - fisheye) times at the centre), below 0 it pinches; the edges stay
  bulge: number; // -1..0.9: a lens over one spot, the same law inside `bulgeRadius` round `bulgeAt`
  bulgeAt: [number, number]; // centre of the bulge, logical px (y down)
  bulgeRadius: number; // px
  mosaic: number; // cell size in logical px, 0 = off
  glitch: number; // 0..1: bands of the frame torn sideways with their colours split, changing every other frame
  crt: number; // 0..1: a cathode-ray screen: curved glass, scanlines, a phosphor mask, dark rounded corners
  tone: number; // 1 = the tone shoulder on (default), 0 = off: flat colours come out exactly as the palette gives them
  dither: number; // 1 = the 1/255 dither that changes every frame (default), 0 = off: held frames are then identical when grain is 0
}

export const DEFAULT_POST: PostParams = {
  exposure: 1,
  bloom: 0.55,
  bloomThreshold: 0.85,
  bloomKnee: 0.5,
  bloomRadius: 0.75,
  halation: 0.25,
  ca: 1.2,
  grain: 0.055,
  vignette: 0.35,
  fade: 0,
  flash: 0,
  shake: [0, 0],
  zoom: 1,
  invert: 0,
  hue: 0,
  kaleido: 0,
  kaleidoTurn: 0,
  fisheye: 0,
  bulge: 0,
  bulgeAt: [W / 2, H / 2],
  bulgeRadius: 240,
  mosaic: 0,
  glitch: 0,
  crt: 0,
  tone: 1,
  dither: 1,
};

const MIPS = 7;

export class Post {
  private prefilter: FSPass;
  private down: FSPass;
  private up: FSPass;
  private final: FSPass;
  private mips: THREE.WebGLRenderTarget[] = [];
  private ups: THREE.WebGLRenderTarget[] = [];

  constructor() {
    // the bloom pyramid stays at the logical resolution at every output scale (same radii, same look)
    let w = W >> 1, h = H >> 1;
    for (let i = 0; i < MIPS; i++) {
      this.mips.push(makeRT(Math.max(2, w), Math.max(2, h), { depthBuffer: false, pxScale: 1 }));
      this.ups.push(makeRT(Math.max(2, w), Math.max(2, h), { depthBuffer: false, pxScale: 1 }));
      w >>= 1; h >>= 1;
    }
    this.prefilter = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform vec2 texel; uniform float threshold, knee;
      void main() {
        // 4-tap box downsample + soft threshold on luminance
        vec3 c = vec3(0.0);
${SCALE === 1 ? `        c += texture(src, vUv + texel * vec2(-1, -1)).rgb; c += texture(src, vUv + texel * vec2(1, -1)).rgb;
        c += texture(src, vUv + texel * vec2(-1, 1)).rgb;  c += texture(src, vUv + texel * vec2(1, 1)).rgb;
        c *= 0.25;` : `        // output scale > 1: the same 4x4-logical-px box from a SCALE x larger source, as 2x2-texel bilinear taps
        const int N = ${SCALE * 2};
        for (int j = 0; j < N; j++) for (int i = 0; i < N; i++)
          c += texture(src, vUv + texel * (vec2(float(i), float(j)) * 2.0 - float(N - 1)) / PX_SCALE).rgb;
        c /= float(N * N);`}
        c = min(c, vec3(40.0));
        float l = max(c.r, max(c.g, c.b));
        float rq = clamp(l - threshold + knee, 0.0, 2.0 * knee);
        rq = rq * rq / (4.0 * knee + 1e-5);
        float w = max(rq, l - threshold) / max(l, 1e-5);
        fragColor = vec4(c * w, 1.0);
      }`, { src: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 1 }, knee: { value: 0.5 } });
    this.down = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform vec2 texel;
      void main() {
        // 13-tap downsample (Jimenez 2014)
        vec3 a = texture(src, vUv + texel * vec2(-2, -2)).rgb, b = texture(src, vUv + texel * vec2(0, -2)).rgb, c = texture(src, vUv + texel * vec2(2, -2)).rgb;
        vec3 d = texture(src, vUv + texel * vec2(-1, -1)).rgb, e = texture(src, vUv + texel * vec2(1, -1)).rgb;
        vec3 f = texture(src, vUv + texel * vec2(-2, 0)).rgb, g = texture(src, vUv).rgb, h = texture(src, vUv + texel * vec2(2, 0)).rgb;
        vec3 i = texture(src, vUv + texel * vec2(-1, 1)).rgb, j = texture(src, vUv + texel * vec2(1, 1)).rgb;
        vec3 k = texture(src, vUv + texel * vec2(-2, 2)).rgb, l = texture(src, vUv + texel * vec2(0, 2)).rgb, m = texture(src, vUv + texel * vec2(2, 2)).rgb;
        vec3 o = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
        fragColor = vec4(o, 1.0);
      }`, { src: { value: null }, texel: { value: new THREE.Vector2() } });
    this.up = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform sampler2D prev; uniform vec2 texel; uniform float radius;
      void main() {
        // 9-tap tent upsample of the smaller level, added to this level
        vec2 o = texel * radius;
        vec3 s = texture(src, vUv - o).rgb + 2.0 * texture(src, vUv + vec2(0, -o.y)).rgb + texture(src, vUv + vec2(o.x, -o.y)).rgb
          + 2.0 * texture(src, vUv + vec2(-o.x, 0)).rgb + 4.0 * texture(src, vUv).rgb + 2.0 * texture(src, vUv + vec2(o.x, 0)).rgb
          + texture(src, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture(src, vUv + vec2(0, o.y)).rgb + texture(src, vUv + o).rgb;
        fragColor = vec4(texture(prev, vUv).rgb + s / 16.0, 1.0);
      }`, { src: { value: null }, prev: { value: null }, texel: { value: new THREE.Vector2() }, radius: { value: 1 } });
    this.final = new FSPass(/* glsl */ `
      uniform sampler2D src; uniform sampler2D bloomTex; uniform sampler2D haloTex;
      uniform float exposure, bloom, halation, ca, grain, vignette, fade, flash, time, zoom, invert;
      uniform float hue, kaleido, kaleidoTurn, fisheye, bulge, bulgeRadius, mosaic, glitch, crt, fps, tone, dither;
      uniform vec2 shake; uniform vec2 res; uniform vec2 bulgeAt;
      ${SHOULDER_GLSL}
      void main() {
        vec2 uv = (vUv - 0.5) / zoom + 0.5 - shake / res;
        vec2 asp = vec2(res.x / res.y, 1.0);
        // ---- where each pixel looks: kaleidoscope, lenses, cells, glass, tearing (all off by default) ----
        if (kaleido >= 1.0) {
          vec2 p = (uv - 0.5) * asp;
          float seg = TAU / floor(kaleido), a = mod(atan(p.y, p.x) - kaleidoTurn, seg);
          a = abs(a - 0.5 * seg);   // each sector is the mirror of its neighbours
          uv = 0.5 + vec2(cos(a + kaleidoTurn), sin(a + kaleidoTurn)) * length(p) / asp;
        }
        if (fisheye != 0.0) {
          vec2 p = (uv - 0.5) * asp;
          float rm = dot(0.5 * asp, 0.5 * asp);
          uv = 0.5 + p * (1.0 - fisheye + fisheye * dot(p, p) / rm) / asp;
        }
        if (bulge != 0.0) {
          vec2 c = vec2(bulgeAt.x / res.x, 1.0 - bulgeAt.y / res.y);
          vec2 d = (uv - c) * res;
          float r = length(d) / bulgeRadius;
          if (r < 1.0) uv = c + d * mix(1.0, smoothstep(0.0, 1.0, r), bulge) / res;
        }
        if (crt > 0.0) {
          vec2 p = uv - 0.5;
          uv = 0.5 + p * (1.0 + crt * 0.12 * dot(p, p) * 4.0) * (1.0 - crt * 0.03);
        }
        if (mosaic >= 1.0) uv = (floor(uv * res / mosaic) + 0.5) * mosaic / res;
        vec2 split = vec2(0.0);
        if (glitch > 0.0) {
          float step2 = floor(time * fps / 2.0 + 0.5);
          float band = floor(uv.y * 34.0 + 7.0 * hash11(step2));
          float h = hash12(vec2(band, step2));
          float torn = step(1.0 - 0.55 * glitch, h);
          uv.x += torn * (hash12(vec2(band, step2 + 3.1)) - 0.5) * 0.18 * glitch;
          split = vec2((6.0 + 16.0 * torn) * glitch / res.x, 0.0);
          // a few blocks jump to another place
          vec2 blk = floor(uv * vec2(9.0, 16.0));
          if (hash12(blk + step2 * 1.7) > 1.0 - 0.12 * glitch) uv += (hash22(blk + step2) - 0.5) * 0.08 * glitch;
        }
        vec2 dc = uv - 0.5;
        float r2 = dot(dc * asp, dc * asp);
        vec2 off = dc * r2 * ca / res.x * 4.0;
        vec3 col;
        col.r = texture(src, uv + off + split).r;
        col.g = texture(src, uv).g;
        col.b = texture(src, uv - off - split).b;
        vec3 bl = texture(bloomTex, uv).rgb;
        vec3 ha = texture(haloTex, uv).rgb;
        col += bl * bloom;
        col += vec3(1.0, 0.18, 0.04) * luma(ha) * halation;
        col *= exposure;
        if (hue != 0.0) col = max(hueRotate(col, hue), 0.0);
        col = mix(col, shoulder(col), tone);
        col = mix(col, vec3(0.8515) - col * 0.84, invert); // dark<->light in linear-ish space (constants as tuned by the reference)
        col += C_FG * flash;
        // vignette
        float v = smoothstep(0.95, 0.25, length(dc * vec2(1.0, 0.8)));
        col *= mix(1.0, v, vignette);
        col *= (1.0 - fade);
        if (crt > 0.0) {
          // scanlines every 3 px, a mask of red, green and blue stripes, and the dark corners of the tube
          float line = 0.5 + 0.5 * cos(FRAG_PX.y * TAU / 3.0);
          col *= 1.0 - crt * 0.38 * line;
          float m = mod(floor(FRAG_PX.x), 3.0);
          col *= mix(vec3(1.0), m < 1.0 ? vec3(1.15, 0.9, 0.9) : m < 2.0 ? vec3(0.9, 1.15, 0.9) : vec3(0.9, 0.9, 1.15), crt * 0.5);
          vec2 q = abs(uv - 0.5) * 2.0;
          float corner = length(max(q - vec2(1.0 - 0.09 * crt), 0.0)) / (0.09 * crt + 1e-4);
          col *= (1.0 - smoothstep(0.7, 1.0, corner)) * step(q.x, 1.0) * step(q.y, 1.0);
        }
        vec3 s = toSRGB(sat(col));
        // film grain: two scales, stronger in mid-tones
${SCALE === 1 ? `        float g1 = hash12(gl_FragCoord.xy + fract(time * 13.37) * 1000.0) - 0.5;
        float g2 = hash12(floor(gl_FragCoord.xy / 2.0) + fract(time * 7.13) * 1000.0) - 0.5;` : `        // output scale > 1: the fine grain is per physical px with its amplitude raised by PX_SCALE so its
        // power per logical px (what survives a downscale) matches 1x; the coarse grain keeps 2x2-logical-px cells
        float g1 = (hash12(gl_FragCoord.xy + fract(time * 13.37) * 1000.0) - 0.5) * PX_SCALE;
        float g2 = hash12(floor(FRAG_PX / 2.0) + fract(time * 7.13) * 1000.0) - 0.5;`}
        float lm = luma(s);
        float amt = grain * (0.55 + 1.2 * lm * (1.0 - lm));
        s += (g1 * 0.6 + g2 * 0.4) * amt;
        s += dither * (hash12(gl_FragCoord.xy * 1.37 + time) - 0.5) / 255.0; // dither
        fragColor = vec4(sat(s), 1.0);
      }`, {
      src: { value: null }, bloomTex: { value: null }, haloTex: { value: null },
      exposure: { value: 1 }, bloom: { value: 0.5 }, halation: { value: 0.2 }, ca: { value: 1 }, grain: { value: 0.05 },
      vignette: { value: 0.3 }, fade: { value: 0 }, flash: { value: 0 }, time: { value: 0 },
      zoom: { value: 1 }, invert: { value: 0 }, shake: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) },
      hue: { value: 0 }, kaleido: { value: 0 }, kaleidoTurn: { value: 0 }, fisheye: { value: 0 }, bulge: { value: 0 },
      bulgeAt: { value: new THREE.Vector2(W / 2, H / 2) }, bulgeRadius: { value: 240 }, mosaic: { value: 0 }, glitch: { value: 0 },
      crt: { value: 0 }, fps: { value: PROJECT.fps }, tone: { value: 1 }, dither: { value: 1 },
    });
  }

  /** Apply the chain: src (HDR linear) -> out (sRGB 8-bit target or screen). */
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, out: THREE.WebGLRenderTarget | null, p: PostParams, time: number) {
    // bloom pyramid
    this.prefilter.u.src!.value = src;
    (this.prefilter.u.texel!.value as THREE.Vector2).set(1 / W, 1 / H);
    this.prefilter.u.threshold!.value = p.bloomThreshold;
    this.prefilter.u.knee!.value = p.bloomKnee;
    this.prefilter.render(renderer, this.mips[0]!);
    for (let i = 1; i < MIPS; i++) {
      const s = this.mips[i - 1]!;
      this.down.u.src!.value = s.texture;
      (this.down.u.texel!.value as THREE.Vector2).set(1 / s.width, 1 / s.height);
      this.down.render(renderer, this.mips[i]!);
    }
    // upsample: ups[i] = mips[i] + up(ups[i+1])
    let prevTex = this.mips[MIPS - 1]!.texture;
    for (let i = MIPS - 2; i >= 0; i--) {
      const small = i === MIPS - 2 ? this.mips[MIPS - 1]! : this.ups[i + 1]!;
      this.up.u.src!.value = prevTex;
      this.up.u.prev!.value = this.mips[i]!.texture;
      (this.up.u.texel!.value as THREE.Vector2).set(1 / small.width, 1 / small.height);
      this.up.u.radius!.value = 0.5 + p.bloomRadius;
      this.up.render(renderer, this.ups[i]!);
      prevTex = this.ups[i]!.texture;
    }
    const f = this.final.u;
    f.src!.value = src;
    f.bloomTex!.value = this.ups[0]!.texture;
    f.haloTex!.value = this.ups[3]!.texture;
    f.exposure!.value = p.exposure;
    f.bloom!.value = p.bloom / 3; // pyramid sums ~MIPS levels; normalize
    f.halation!.value = p.halation;
    f.ca!.value = p.ca;
    f.grain!.value = p.grain;
    f.vignette!.value = p.vignette;
    f.fade!.value = p.fade;
    f.flash!.value = p.flash;
    f.time!.value = time;
    f.zoom!.value = p.zoom;
    f.invert!.value = p.invert;
    (f.shake!.value as THREE.Vector2).set(p.shake[0], p.shake[1]);
    f.hue!.value = p.hue;
    f.kaleido!.value = p.kaleido;
    f.kaleidoTurn!.value = p.kaleidoTurn;
    f.fisheye!.value = Math.min(0.9, Math.max(-1, p.fisheye));
    f.bulge!.value = Math.min(0.9, Math.max(-1, p.bulge));
    (f.bulgeAt!.value as THREE.Vector2).set(p.bulgeAt[0], p.bulgeAt[1]);
    f.bulgeRadius!.value = Math.max(1, p.bulgeRadius);
    f.mosaic!.value = p.mosaic;
    f.glitch!.value = p.glitch;
    f.crt!.value = p.crt;
    f.tone!.value = p.tone;
    f.dither!.value = p.dither;
    this.final.render(renderer, out);
  }
}
