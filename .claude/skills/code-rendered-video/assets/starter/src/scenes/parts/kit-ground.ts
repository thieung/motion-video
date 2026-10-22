// Shared kit: the ground a shot stands on. Paper with its fibres and mottle, or ink with a little
// lift towards the middle, and over either an optional screen of halftone dots, the way a printed
// catalogue shades a flat colour. Read-only for scene authors.
//
// A shot creates one Ground and renders it first: it overwrites the whole target. For a drawn world
// outdoors, Sky (at the end of this file) does the same with a sky, a sun, clouds, and water or land.
import * as THREE from 'three';
import { FSPass, W, H } from '../../engine/gl';
import { LIN, type PaletteKey } from '../../engine/palette';
import { hexToLinear } from '../../engine/util';

const FRAG = /* glsl */ `
  uniform vec2 res; uniform vec3 base; uniform float paper;
  uniform vec3 dotColour; uniform float dotAmount, dotPitch, dotAngle, dotFall;
  uniform vec2 dotCentre; uniform vec2 drift;

  // short straight fibres, a few to a cell, lying every which way
  float fibres(vec2 p) {
    vec2 cell = floor(p / 46.0);
    float ink = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      vec2 h = hash22(c);
      vec2 a = (c + h) * 46.0;
      float ang = hash12(c + 7.3) * PI;
      vec2 b = a + vec2(cos(ang), sin(ang)) * (14.0 + 26.0 * h.x);
      ink = max(ink, (1.0 - smoothstep(0.4, 1.3, sdSegment(p, a, b))) * (0.35 + 0.65 * h.y));
    }
    return ink;
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * res;   // logical px, y down
    vec2 q = px + drift;                          // the sheet may slide under the camera
    vec3 col = base;
    if (paper > 0.5) {
      float mottle = fbm(q / 520.0, 4) * 0.035 + fbm(q / 90.0, 3) * 0.012;
      col *= 1.0 + mottle;
      col *= 1.0 - 0.05 * fibres(q);
      // a sheet is a little darker towards its edges
      vec2 e = (vUv - 0.5) * vec2(1.0, res.y / res.x);
      col *= 1.0 - 0.10 * smoothstep(0.35, 1.05, length(e));
    } else {
      float r = length((vUv - 0.5) * vec2(res.x / res.y, 1.0));
      col *= mix(1.9, 1.0, smoothstep(0.0, 0.9, r));
      col += 0.004 * fbm(q / 300.0, 3);
    }
    if (dotAmount > 0.0) {
      // dots on a turned grid; they grow towards dotCentre and shrink to nothing far from it
      vec2 g = rot2(dotAngle) * q / dotPitch;
      vec2 f = fract(g) - 0.5;
      float near = 1.0 - smoothstep(0.0, dotFall, length(px - dotCentre));
      float radius = 0.46 * sqrt(clamp(near * dotAmount, 0.0, 1.0));
      float w = 1.2 / dotPitch;
      float dotShape = 1.0 - smoothstep(radius - w, radius + w, length(f));
      col = mix(col, dotColour, dotShape * step(0.02, radius));
    }
    fragColor = vec4(col, 1.0);
  }`;

export interface GroundStyle {
  /** The colour of the ground: paper or paper2 for a sheet, ink or ink2 for the dark, or a key hue for a flat card. */
  colour?: PaletteKey;
  /** Whether it is a sheet of paper (fibres, mottle). Default: true for paper and paper2. */
  sheet?: boolean;
  /** Halftone dots: colour, strength 0..1 at the centre, pitch in px, angle in radians, the centre and how far they reach. */
  dots?: { colour: PaletteKey; amount: number; pitch?: number; angle?: number; centre?: [number, number]; reach?: number; level?: number };
  /** Slides the texture under the frame, in px: pass the camera's position so the sheet moves with the world. */
  drift?: [number, number];
}

export class Ground {
  private pass = new FSPass(FRAG, {
    res: { value: new THREE.Vector2(W, H) },
    base: { value: new THREE.Vector3() },
    paper: { value: 0 },
    dotColour: { value: new THREE.Vector3() },
    dotAmount: { value: 0 }, dotPitch: { value: 18 }, dotAngle: { value: 0.26 }, dotFall: { value: 1400 },
    dotCentre: { value: new THREE.Vector2(W / 2, H / 2) },
    drift: { value: new THREE.Vector2() },
  });

  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, style: GroundStyle = {}) {
    const { colour = 'ink', dots, drift = [0, 0] } = style;
    const sheet = style.sheet ?? (colour === 'paper' || colour === 'paper2');
    const u = this.pass.u;
    (u.base!.value as THREE.Vector3).set(...LIN[colour]);
    u.paper!.value = sheet ? 1 : 0;
    (u.drift!.value as THREE.Vector2).set(drift[0], drift[1]);
    u.dotAmount!.value = dots?.amount ?? 0;
    if (dots) {
      const k = dots.level ?? 1;
      (u.dotColour!.value as THREE.Vector3).set(LIN[dots.colour][0] * k, LIN[dots.colour][1] * k, LIN[dots.colour][2] * k);
      u.dotPitch!.value = dots.pitch ?? 18;
      u.dotAngle!.value = dots.angle ?? 0.26;
      u.dotFall!.value = dots.reach ?? 1400;
      (u.dotCentre!.value as THREE.Vector2).set(...(dots.centre ?? [W / 2, H / 2]));
    }
    this.pass.render(renderer, out);
  }

  dispose() { this.pass.mat.dispose(); }
}

// ---- a sky, with water or land below it ---------------------------------------------------------
//
// A stylised sky for a drawn world: a gradient from the zenith to the horizon, a haze that thickens
// towards the horizon, a sun with its glow, clouds from noise (soft, or in hard cel steps), and below
// the horizon either water that mirrors the sky with ripples and a glitter path under the sun, or
// land fading into the haze. Colours are hex strings of the scene's own sky, not palette keys: a sky
// changes with the time of day (skyAt). Draw hills, trees and figures over it on a layer, their
// colours hazed towards the horizon (hazed) and tinted by the light of the hour.

const SKY_FRAG = /* glsl */ `
  uniform vec2 res; uniform float horizon, t, haze;
  uniform vec3 zenith, low, sunCol, cloudCol, cloudShade, belowCol, farCol;
  uniform vec3 sun; // x, y in px, radius in px (0: no sun)
  uniform float cloudAmount, cloudScale, cloudSteps, cloudTop, cloudBottom, below, ripple, glow;
  uniform vec2 drift;

  vec3 skyAt(float y) {
    float k = pow(sat(y / horizon), 1.6);
    return mix(zenith, low, k);
  }
  // the density of the clouds: large soft shapes with a little detail on their edges
  float dens(vec2 p) {
    vec2 q = (p + drift) / vec2(cloudScale * 2.4, cloudScale);
    return fbm(q, 3) * 0.5 + 0.5 + 0.08 * fbm(q * 3.7 + 5.1, 2);
  }
  float cover(vec2 p, float d) {
    float band = smoothstep(cloudTop - cloudScale * 0.5, cloudTop, p.y) * (1.0 - smoothstep(cloudBottom, cloudBottom + cloudScale * 0.5, p.y));
    float th = 1.0 - cloudAmount * 0.6;
    float edge = cloudSteps > 0.5 ? 0.004 : 0.08;
    return smoothstep(th, th + edge, d) * band;
  }
  vec3 skyColour(vec2 px) {
    vec3 col = skyAt(px.y);
    if (sun.z > 0.0) col += sunCol * glow * exp(-length(px - sun.xy) / (sun.z * 6.0)) * 0.6;
    // haze: the air thickens towards the horizon
    col = mix(col, low, haze * pow(sat(px.y / horizon), 6.0));
    if (sun.z > 0.0) col = mix(col, sunCol * 1.4, 1.0 - smoothstep(sun.z - 1.5, sun.z + 1.5, length(px - sun.xy)));
    if (cloudAmount > 0.0) {
      float d = dens(px);
      float c = cover(px, d);
      if (c > 0.0) {
        // lit on the side towards the sun: compare the density a little way towards it
        vec2 toSun = sun.z > 0.0 ? normalize(sun.xy - px + vec2(0.0, 1e-3)) : vec2(0.0, -1.0);
        float lit = sat(0.5 + (d - dens(px + toSun * cloudScale * 0.22)) * 5.0);
        if (cloudSteps > 0.5) lit = floor(lit * cloudSteps) / max(cloudSteps - 1.0, 1.0);
        vec3 cc = mix(cloudShade, cloudCol, sat(lit));
        col = mix(col, cc, c * (1.0 - 0.6 * haze * pow(sat(px.y / horizon), 4.0)));
      }
    }
    return col;
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * res;   // logical px, y down
    vec3 col;
    if (px.y < horizon || below < 0.5) {
      col = skyColour(px);
    } else {
      float depth = (px.y - horizon) / max(res.y - horizon, 1.0);   // 0 at the horizon, 1 at the foot
      if (below < 1.5) {
        // water: the sky mirrored about the horizon, broken by ripples that grow towards the viewer
        float w = ripple * (2.0 + 26.0 * depth);
        float n = snoise(vec2(px.x / (60.0 + 400.0 * depth), px.y / (3.0 + 30.0 * depth) + t * 0.6));
        vec2 m = vec2(px.x + n * w, 2.0 * horizon - px.y + n * w * 0.5);
        col = mix(skyColour(m), belowCol, 0.45 + 0.35 * depth);
        if (sun.z > 0.0) {
          // the glitter path under the sun
          float path = exp(-pow((px.x - sun.x) / (sun.z * (0.8 + 2.5 * depth)), 2.0));
          float spark = step(0.62, snoise(vec2(px.x / (10.0 + 40.0 * depth), px.y / (1.5 + 6.0 * depth) - t * 1.3)));
          col += sunCol * path * spark;
        }
      } else {
        col = mix(belowCol, farCol, pow(1.0 - depth, 3.0));
      }
      col = mix(col, low, haze * pow(1.0 - depth, 8.0));
    }
    fragColor = vec4(col, 1.0);
  }`;

export interface SkyStyle {
  /** Colour at the top of the frame and at the horizon (hex). */
  zenith: string;
  horizon: string;
  /** y of the horizon, in px of the frame. Default: two thirds down. */
  horizonY?: number;
  /** How much the air thickens towards the horizon, 0..1. Default 0.5. */
  haze?: number;
  /** The sun (or the moon): centre and radius in px, colour; `glow` 0..2 (default 1). */
  sun?: { x: number; y: number; radius: number; colour: string; glow?: number };
  /**
   * Clouds: lit and shaded colours, cover 0..1, size in px, `steps` 0 for soft or 2..4 for hard cel
   * steps, the band of the sky they fill (top, bottom in px), and a drift in px (move it with time).
   */
  clouds?: { colour: string; shade: string; amount: number; scale?: number; steps?: number; top?: number; bottom?: number; drift?: [number, number] };
  /** Below the horizon: water that mirrors the sky, or land. `far` is the colour of land at the horizon. */
  below?: { kind: 'water' | 'land'; colour: string; far?: string; ripple?: number };
  /** Time in any unit, for the ripples and the glitter: pass beats or seconds. */
  t?: number;
}

const setLin = (v: THREE.Vector3, hex: string) => v.set(...hexToLinear(hex));

export class Sky {
  private pass = new FSPass(SKY_FRAG, {
    res: { value: new THREE.Vector2(W, H) }, horizon: { value: H * 0.66 }, t: { value: 0 }, haze: { value: 0.5 },
    zenith: { value: new THREE.Vector3() }, low: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Vector3() },
    cloudCol: { value: new THREE.Vector3() }, cloudShade: { value: new THREE.Vector3() }, belowCol: { value: new THREE.Vector3() }, farCol: { value: new THREE.Vector3() },
    sun: { value: new THREE.Vector3() }, glow: { value: 1 },
    cloudAmount: { value: 0 }, cloudScale: { value: 220 }, cloudSteps: { value: 0 }, cloudTop: { value: 0 }, cloudBottom: { value: H * 0.5 },
    below: { value: 0 }, ripple: { value: 1 }, drift: { value: new THREE.Vector2() },
  });

  /** Overwrites the whole target. */
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, s: SkyStyle) {
    const u = this.pass.u;
    const v3 = (k: string) => u[k]!.value as THREE.Vector3;
    const hz = s.horizonY ?? H * 0.66;
    u.horizon!.value = hz;
    u.t!.value = s.t ?? 0;
    u.haze!.value = s.haze ?? 0.5;
    setLin(v3('zenith'), s.zenith);
    setLin(v3('low'), s.horizon);
    if (s.sun) v3('sun').set(s.sun.x, s.sun.y, s.sun.radius); else v3('sun').set(0, 0, 0);
    setLin(v3('sunCol'), s.sun?.colour ?? '#ffffff');
    u.glow!.value = s.sun?.glow ?? 1;
    const c = s.clouds;
    u.cloudAmount!.value = c?.amount ?? 0;
    if (c) {
      setLin(v3('cloudCol'), c.colour);
      setLin(v3('cloudShade'), c.shade);
      u.cloudScale!.value = c.scale ?? 220;
      u.cloudSteps!.value = c.steps ?? 0;
      u.cloudTop!.value = c.top ?? 0;
      u.cloudBottom!.value = c.bottom ?? hz * 0.8;
      (u.drift!.value as THREE.Vector2).set(...(c.drift ?? [0, 0]));
    }
    u.below!.value = !s.below ? 0 : s.below.kind === 'water' ? 1 : 2;
    if (s.below) {
      setLin(v3('belowCol'), s.below.colour);
      setLin(v3('farCol'), s.below.far ?? s.horizon);
      u.ripple!.value = s.below.ripple ?? 1;
    }
    this.pass.render(renderer, out);
  }

  dispose() { this.pass.mat.dispose(); }
}

/** A hex colour between two, mixed in linear light (0 gives a, 1 gives b). */
export function mixHex(a: string, b: string, k: number): string {
  const la = hexToLinear(a), lb = hexToLinear(b);
  const enc = (v: number) => {
    const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255).toString(16).padStart(2, '0');
  };
  return '#' + [0, 1, 2].map((i) => enc(la[i]! + (lb[i]! - la[i]!) * k)).join('');
}

/** One moment of a day or a year: when it holds, the colours of the sky, the sun, and the light on the world. */
export interface SkyKey { at: number; zenith: string; horizon: string; sun: string; light: string }

/**
 * The sky at `at` (an hour, a beat, a season: any unit, keys in order), mixed between the two keys
 * around it. `light` is the colour to tint what stands in the world with, so that hills, figures and
 * sky change together.
 */
export function skyAt(at: number, keys: SkyKey[]): SkyKey {
  if (at <= keys[0]!.at) return keys[0]!;
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]!;
    if (at <= b.at) {
      const a = keys[i - 1]!, k = (at - a.at) / (b.at - a.at);
      return { at, zenith: mixHex(a.zenith, b.zenith, k), horizon: mixHex(a.horizon, b.horizon, k), sun: mixHex(a.sun, b.sun, k), light: mixHex(a.light, b.light, k) };
    }
  }
  return keys[keys.length - 1]!;
}

/**
 * Atmospheric perspective for a drawn world: the colour of a thing `depth` of the way to the horizon
 * (0 near, 1 at the horizon) seen through haze of strength `haze`. Far hills take the colour of the
 * horizon; this is what makes a flat drawing deep.
 */
export const hazed = (colour: string, horizon: string, depth: number, haze = 0.8) =>
  mixHex(colour, horizon, Math.min(1, Math.max(0, haze * Math.pow(depth, 1.3))));
