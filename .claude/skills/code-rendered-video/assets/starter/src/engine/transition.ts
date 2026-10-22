// Transitions: what happens to the picture around a cut. New in this project (not part of the
// pdoom-video engine).
//
// A transition belongs to the shot it leads INTO. It has a lead (beats before the cut, played
// over the outgoing shot) and a tail (beats after it, played over the incoming one). Most cuts in
// the film are plain or nearly so; the ones into a drop are built in three parts:
//
//   build   the lead: tension rises on an accelerating curve
//   breath  the last quarter beat before the cut: almost everything is taken away
//   impact  the tail: the new shot arrives with a flash, a shock wave and a shake
//
// There are two families. The first works on finished pictures and is played by the engine
// alone: it treats a built shot and a storyboard card alike. The second happens INSIDE the world
// of a shot, and the shot has to take part:
//
//   travel    two shots are two places in one world; the camera goes from one to the other
//   zoom-in   the next shot is held in a detail of this one; the camera goes into the detail
//   pull-out  the shot before was a detail of this one; the camera comes back out of it
//   match     the last picture of one shot and the first of the next share a shape
//   shatter   something in the shot comes at the lens; where it hits, the frame breaks
//   through   a letter stands in the way; the camera goes through the hole in it
//
// The kinds added after the first films (iris, aperture, dip, wipe, cover, flood, fold, glitch) are
// screen-space: the engine plays them alone. Dip, cover and flood fill the frame with a colour, the
// palette key in `colour`.
//
// For zoom-in and pull-out the engine hands the shot the picture of its neighbour (Frame.portal)
// if the scene sets `handlesPortal`; otherwise, and for any shot that is still a storyboard
// card, the engine plays a stand-in of its own.
//
// Everything is a function of the time and the cut: no state is kept between frames.
import * as THREE from 'three';
import { FSPass, Layer2D, makeRT, W, H } from './gl';
import type { PostOverrides } from './scene';
import { F, textPathCommands } from './type';
import { clamp, ease, hash } from './util';
import { LIN, type PaletteKey } from './palette';

export const TRANSITION_KINDS = [
  'cut', 'punch', 'invert', 'flash', 'whip', 'push', 'caret', 'tiles', 'crt', 'rewind',
  'implode', 'stutter', 'tunnel', 'breath', 'stretch',
  'zoom-in', 'through', 'shatter', 'slices', 'spin', 'stepzoom', 'pull-out', 'travel', 'match',
  'iris', 'aperture', 'dip', 'wipe', 'cover', 'flood', 'fold', 'glitch',
] as const;
export type TransitionKind = (typeof TRANSITION_KINDS)[number];

/** The kinds that lead into a drop: build, breath, impact. */
export const DROP_KINDS: TransitionKind[] = ['implode', 'stutter', 'tunnel', 'breath', 'stretch'];
/** The kinds a shot takes part in. The engine plays a stand-in where the shot cannot yet. */
export const SHOT_KINDS: TransitionKind[] = ['travel', 'zoom-in', 'pull-out', 'match'];
/** The kinds that show both shots at once, the outgoing one frozen after the cut and the incoming one frozen before it. */
const BOTH: TransitionKind[] = ['push', 'caret', 'tiles', 'zoom-in', 'pull-out', 'through', 'shatter', 'slices', 'iris', 'wipe', 'glitch'];
/** The kinds that are nothing but a change to the post settings of the incoming shot. */
const POST_ONLY: TransitionKind[] = ['cut', 'punch', 'invert', 'flash'];

/**
 * The kind the engine plays for a transition. A travel between two built shots is theirs alone
 * and the engine does nothing; while either is a card a whip stands in for it. A match is a plain
 * cut that the shots have lined up; on a card it gets a small punch, so that the cut can be felt.
 */
export function played(kind: TransitionKind, standIn: boolean): TransitionKind {
  if (kind === 'travel') return standIn ? 'whip' : 'cut';
  if (kind === 'match') return standIn ? 'punch' : 'cut';
  return kind;
}

/** The last part of a drop's lead, in beats, is the breath. */
export const BREATH = 0.25;

export interface Transition {
  kind: TransitionKind;
  /** Song time (s) of the start of the lead, of the cut, and of the end of the tail. */
  tLead: number;
  tCut: number;
  tTail: number;
  /** Length of the lead and of the tail in beats. */
  lead: number;
  tail: number;
  /** The point the transition turns on, in logical px (y down). */
  focus: [number, number];
  /** Direction of travel for whip, push, slices and spin: a unit vector in screen space (y down). */
  dir: [number, number];
  /** For `through`: the letters that stand in the way. The camera goes through their largest hole. */
  text?: string;
  /** For `through`: the size of the letters (px) when they first stand in the way. */
  size?: number;
  /** For `through`: whether the letters are light or dark. Set against the shot they stand in front of. */
  slab: 'paper' | 'ink';
  /** For `dip`, `cover` and `flood`: the palette key of the colour that fills the frame. Defaults: ink for a dip, signal for cover and flood. */
  colour?: PaletteKey;
  /** True while either shot is still a storyboard card: the engine plays the stand-in for a kind a shot should take part in. */
  standIn: boolean;
}

/** Where a time is within a transition. */
export interface TransitionState {
  /** True after the cut. */
  after: boolean;
  /** Beats from the cut: negative before it. */
  rel: number;
  /** 0..1 through the lead (1 from the cut on), and 0..1 through the tail (0 before the cut). */
  pre: number;
  post: number;
  /** 0..1 through the whole window. */
  k: number;
}

export function stateAt(tr: Transition, t: number, beatAt: (t: number) => number): TransitionState {
  const rel = beatAt(t) - beatAt(tr.tCut);
  const after = t >= tr.tCut;
  const pre = tr.lead > 0 ? clamp(1 + rel / tr.lead) : after ? 1 : 0;
  const post = tr.tail > 0 ? clamp(rel / tr.tail) : after ? 1 : 0;
  const span = tr.lead + tr.tail;
  return { after, rel, pre, post, k: span > 0 ? clamp((rel + tr.lead) / span) : after ? 1 : 0 };
}

export const needsBoth = (kind: TransitionKind) => BOTH.includes(kind);
export const postOnly = (kind: TransitionKind) => POST_ONLY.includes(kind);

/**
 * The stutter: through its lead the outgoing shot does not play on, it repeats its own first
 * moments in slices that halve each beat, the way a beat repeat does to sound. Returns the
 * position to show, in beats from the cut, and the number of the slice (for stepping the zoom).
 */
export function stutter(rel: number, lead: number): { rel: number; slice: number } {
  const x = rel + lead; // beats since the lead began
  if (x < 1 || rel >= 0) return { rel, slice: 0 };
  if (rel >= -BREATH) return { rel: -lead, slice: 99 }; // the breath: frozen on the first frame of the lead
  const seg = Math.floor(x); // 1, 2, 3 ...
  const len = Math.pow(0.5, seg); // slices of 1/2, 1/4, 1/8 beat
  const into = x - seg;
  const n = Math.floor(into / len + 1e-6);
  let slice = n + 1;
  for (let s = 1; s < seg; s++) slice += Math.round(1 / Math.pow(0.5, s));
  return { rel: -lead + (into - n * len), slice };
}

const FRAG = /* glsl */ `
  uniform sampler2D texA; uniform sampler2D texB; uniform sampler2D texM;
  uniform int kind; uniform float after, rel, pre, post, k, frame, slice, breath;
  uniform vec2 res; uniform vec2 focus; uniform vec2 dir; uniform vec3 slab; uniform vec3 fill;

  float inside(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }
  vec3 A(vec2 uv) { return texture(texA, uv).rgb * inside(uv); }
  vec3 B(vec2 uv) { return texture(texB, uv).rgb * inside(uv); }
  /** The shot that is playing: the outgoing one before the cut, the incoming one after. */
  vec3 S(vec2 uv) { return after < 0.5 ? texture(texA, clamp(uv, 0.0, 1.0)).rgb : texture(texB, clamp(uv, 0.0, 1.0)).rgb; }
  vec3 Sin(vec2 uv) { return after < 0.5 ? A(uv) : B(uv); }
  float outExpo(float x) { return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x); }

  /** A ring that leaves the focus and crosses the frame: displaces the picture outwards and lights it. */
  vec3 shock(vec2 uv, vec2 c, float t, vec3 tint, float power) {
    vec2 asp = vec2(res.x / res.y, 1.0);
    vec2 d = (uv - c) * asp;
    float r = length(d), R = t * 1.35, w = 0.05 + 0.10 * t;
    float p = exp(-pow((r - R) / w, 2.0)) * (1.0 - t) * power;
    vec2 n = r > 1e-4 ? d / r : vec2(0.0);
    vec3 col = S(uv - n * p * 0.07 / asp);
    return col * (1.0 + 1.6 * p) + tint * p * 1.4;
  }

  /** The farthest corner of the frame from a point in uv, in px: a shape of this radius round the point covers the frame. */
  float farCorner(vec2 c) {
    vec2 a = c * res, b = (1.0 - c) * res;
    return length(max(a, b));
  }
  float easeIO(float x) { x = clamp(x, 0.0, 1.0); return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }
  /** Colours mixed as the screen shows them, so that a fade does not seem to hang and then drop. */
  vec3 mixShown(vec3 a, vec3 b, float k) { return toLinear(mix(toSRGB(sat(a)), toSRGB(sat(b)), k)); }

  /**
   * One panel of the folded map: a cell of the frame (min corner cmin, size L, in uv) hinged on the
   * side that h points to, turned by phi about the hinge (0 flat, PI folded over onto its neighbour).
   * If it covers p: where p shows in the frame's own picture, whether that is its front, and its light.
   */
  bool panel(vec2 p, vec2 cmin, vec2 L, vec2 h, float phi, out vec2 src, out bool front, out float shade) {
    bool horiz = h.x != 0.0;
    float sgn = horiz ? h.x : h.y;
    float q = horiz ? p.x : p.y, len = horiz ? L.x : L.y;
    float centreA = (horiz ? cmin.x : cmin.y) + 0.5 * len;
    float hinge = centreA + 0.5 * len * sgn;
    float own = (hinge - q) * sgn;                   // distance from the hinge into the panel's own cell
    float cs = cos(phi);
    float w = len * abs(cs);
    float along = cs >= 0.0 ? own / max(w, 1e-5) : -own / max(w, 1e-5);
    if (along < 0.0 || along > 1.0) return false;
    // the far edge comes towards the eye as the panel lifts: a little larger
    float persp = 1.0 + 0.06 * sin(phi) * along;
    float perpC = (horiz ? cmin.y + 0.5 * L.y : cmin.x + 0.5 * L.x);
    float pp = (horiz ? p.y : p.x) - perpC, half_ = 0.5 * (horiz ? L.y : L.x) * persp;
    if (abs(pp) > half_) return false;
    float a = hinge - sgn * along * len, b = perpC + pp / persp;
    src = horiz ? vec2(a, b) : vec2(b, a);
    front = cs >= 0.0;
    shade = 0.45 + 0.55 * abs(cs);
    return true;
  }

  void main() {
    vec2 asp = vec2(res.x / res.y, 1.0);
    vec2 c = vec2(focus.x / res.x, 1.0 - focus.y / res.y);
    vec2 d2 = vec2(dir.x, -dir.y);                 // screen direction, y up
    vec3 col = S(vUv);

    if (kind == 4) {
      // whip: the picture streaks along the direction of travel, hardest at the cut
      float a = after < 0.5 ? pow(pre, 3.0) : pow(1.0 - post, 3.0);
      vec2 slide = d2 * (after < 0.5 ? a : -a) * 0.45;
      vec3 sum = vec3(0.0);
      for (int i = 0; i < 20; i++) {
        float u = (float(i) + hash12(gl_FragCoord.xy + frame * 1.7)) / 20.0 - 0.5;
        sum += S(vUv + slide + d2 * a * 0.5 * u);
      }
      col = sum / 20.0;
    } else if (kind == 5) {
      // push: the incoming shot pushes the outgoing one off, a dark seam between them
      vec2 ua = vUv - d2 * k, ub = vUv - d2 * (k - 1.0);
      float onA = inside(ua);
      float speed = sin(PI * k);
      vec3 sa = vec3(0.0), sb = vec3(0.0);
      for (int i = 0; i < 8; i++) {
        float u = (float(i) + 0.5) / 8.0 - 0.5;
        sa += A(ua + d2 * speed * 0.035 * u);
        sb += B(ub + d2 * speed * 0.035 * u);
      }
      col = onA > 0.5 ? sa / 8.0 : sb / 8.0;
      float seam = abs(dot(vUv - d2 * k - (0.5 - 0.5 * d2), d2));
      col *= smoothstep(0.0, 0.012, seam);
    } else if (kind == 6) {
      // caret: the cursor of the film sweeps the frame; behind it is the next shot
      float x = mix(-0.08, 1.08, k);
      col = vUv.x < x ? B(vUv) : A(vUv);
      float dx = abs(vUv.x - x) * res.x;
      col = mix(col, C_SIGNAL * 3.2, 1.0 - smoothstep(14.0, 16.0, dx));
      col += C_SIGNAL * 0.7 * exp(-dx / 30.0) * step(16.0, dx);
    } else if (kind == 7) {
      // tiles: the frame is a wall of panels that turn over, in a wave from one corner
      vec2 n = vec2(6.0, 10.0);
      vec2 g = vUv * n, id = floor(g), f = fract(g) - 0.5;
      float order = (id.x + (n.y - 1.0 - id.y)) / (n.x + n.y - 2.0);
      float lp = clamp((k - order * 0.55) / 0.45, 0.0, 1.0);
      float ang = lp * PI, cs = abs(cos(ang));
      // panels turn about an upright axis or a level one, turn and turn about like a chessboard,
      // and stand a little apart while the wall is turning, so that each reads as a panel
      bool upright = mod(id.x + id.y, 2.0) < 0.5;
      float gap = 1.0 - 0.07 * sin(PI * clamp(k * 1.15, 0.0, 1.0));
      vec2 l = f / gap;
      if (upright) l.x /= max(cs, 1e-3); else l.y /= max(cs, 1e-3);
      vec2 uv = (id + 0.5 + l) / n;
      vec3 face = lp < 0.5 ? A(uv) : B(uv);
      float on = step(abs(l.x), 0.5) * step(abs(l.y), 0.5);
      col = face * on * (0.4 + 0.6 * cs);
      // the edge of a turning panel catches the light
      float edge = max(abs(l.x), abs(l.y));
      col += C_SIGNAL * 1.4 * on * smoothstep(0.44, 0.5, edge) * sin(ang);
    } else if (kind == 8) {
      // crt: the picture collapses to a line and then to a point, as a television does when it is switched off
      vec2 s = vec2(1.0);
      float lit = 1.0;
      if (after < 0.5) {
        s.y = mix(1.0, 0.004, pow(clamp(pre / 0.62, 0.0, 1.0), 2.4));
        s.x = mix(1.0, 0.002, pow(clamp((pre - 0.62) / 0.26, 0.0, 1.0), 2.0));
        lit = (1.0 + 5.0 * pre) * (1.0 - smoothstep(0.9, 0.97, pre));
      } else {
        s.y = mix(0.004, 1.0, outExpo(post / 0.4));
        lit = 1.0 + 2.5 * (1.0 - outExpo(post / 0.5));
      }
      vec2 uv = c + (vUv - c) / s;
      col = Sin(uv) * lit;
      float line = sin(vUv.y * res.y * 1.6 + frame * 2.1);
      col *= 1.0 + 0.18 * line * (after < 0.5 ? pre : 1.0 - post);
    } else if (kind == 9) {
      // rewind: a tape run backwards. Bands of the picture tear sideways, the colours part, the frame rolls
      float a = after < 0.5 ? pre : 1.0 - post;
      float band = floor(vUv.y * 28.0 + frame * 0.9);
      float tear = (hash12(vec2(band, floor(frame / 2.0))) - 0.5) * 0.22 * a * step(0.55, hash12(vec2(band, 7.0 + floor(frame / 3.0))));
      vec2 uv = vec2(vUv.x + tear, fract(vUv.y + a * a * 0.6 * frame * 0.021));
      col.r = S(uv + vec2(0.012 * a, 0.0)).r;
      col.g = S(uv).g;
      col.b = S(uv - vec2(0.012 * a, 0.0)).b;
      float streak = step(0.986, hash12(vec2(floor(vUv.y * res.y / 3.0), frame)));
      col += vec3(0.9) * streak * a;
      col = mix(col, vec3(luma(col)), 0.35 * a);
    } else if (kind == 10) {
      // implode: the picture is drawn into a point, turning as it goes
      if (after < 0.5) {
        float e = pow(pre, 2.2);
        vec2 d = (vUv - c) * asp;
        float r = length(d);
        float tw = 3.2 * e * e * (1.0 - smoothstep(0.0, 1.1, r));
        float sc = 1.0 + 14.0 * e * e * e + 0.6 * e;
        vec2 q = rot2(tw) * d * sc;
        for (int i = 0; i < 3; i++) {
          float ch = 1.0 + (float(i) - 1.0) * 0.05 * e;
          vec2 uv = c + q * ch / asp;
          col[i] = A(uv)[i];
        }
        // what is left of the frame gathers light at its rim
        col += C_SIGNAL * 1.3 * e * e * exp(-pow((r * sc - 0.66) / 0.07, 2.0)) * (1.0 - inside(c + q / asp));
        if (rel > -breath) {
          // the breath: nothing but the point
          float pulse = 0.75 + 0.25 * sin(rel * 50.0);
          col = C_SIGNAL * 5.0 * exp(-r * r * 2600.0) * pulse + C_SIGNAL * 0.5 * exp(-r * 14.0);
        }
      } else {
        col = shock(vUv, c, post, C_SIGNAL, 1.0);
      }
    } else if (kind == 11) {
      // stutter: the shot repeats itself in shorter and shorter slices while the frame closes to a slit
      float half_h;
      if (after < 0.5) {
        half_h = mix(0.5, 0.0035, pow(pre, 1.5));
        if (rel > -breath) half_h = 0.0026;
        float z = 1.0 + 0.035 * min(slice, 40.0);
        vec2 uv = c + (vUv - c) / z;
        col = A(uv);
        if (rel > -breath) col = vec3(2.4);
      } else {
        half_h = mix(0.0035, 0.62, outExpo(post * 1.8));
        col = shock(vUv, c, post, vec3(1.0), 0.8);
      }
      float band = abs(vUv.y - c.y);
      float edge = (band - half_h) * res.y;
      col *= 1.0 - smoothstep(-1.0, 1.0, edge);
      // the lips of the slit are lit
      col += C_FG * 1.3 * (1.0 - smoothstep(0.0, 3.0, abs(edge))) * (after < 0.5 ? pre : 1.0 - post);
    } else if (kind == 12) {
      // tunnel: the frame holds a smaller copy of itself, which holds another, and the camera flies in
      if (after < 0.5) {
        float e = pow(pre, 1.6);
        float s = 1.0 + 1.15 * e;                   // each copy is this much smaller than the one around it
        float th = 0.42 * e;                        // and turned by this much
        float fly = fract(pre * pre * 9.0);         // how far the camera is between one copy and the next
        vec2 d = (vUv - c) * asp;
        col = vec3(0.0);
        float depth = 0.0;
        for (int n = 7; n >= 0; n--) {
          float fn = float(n) - fly;
          vec2 q = rot2(th * fn) * d * pow(s, fn);
          vec2 uv = c + q / asp;
          if (inside(uv) > 0.5) { col = A(uv); depth = max(fn, 0.0); break; }
        }
        col *= pow(0.86, depth);
        // the breath: the far end of the tunnel is light, and the light takes the frame
        col = mix(col, vec3(3.0), smoothstep(-breath * 1.6, -breath * 0.2, rel));
      } else {
        col = shock(vUv, c, post, vec3(1.0), 1.0);
      }
    } else if (kind == 13) {
      // breath: before the burst the picture loses its colour and light, and closes round the focus
      if (after < 0.5) {
        vec2 uv = c + (vUv - c) / (1.0 + 0.06 * pre);
        col = A(uv);
        col = mix(col, vec3(luma(col)), 0.9 * pre);
        float r = length((vUv - c) * asp);
        col *= mix(1.0, 0.3, pre) * (1.0 - 0.85 * pre * smoothstep(0.15, 0.75, r));
      } else {
        // three rings, one behind the other
        vec2 d = (vUv - c) * asp;
        float r = length(d);
        vec2 n = r > 1e-4 ? d / r : vec2(0.0);
        float p = 0.0;
        for (int i = 0; i < 3; i++) {
          float ti = post * 1.25 - float(i) * 0.11;
          if (ti < 0.0) continue;
          p += exp(-pow((r - ti * 1.5) / (0.035 + 0.05 * ti), 2.0)) * (1.0 - clamp(ti, 0.0, 1.0));
        }
        col = B(vUv - n * p * 0.04 / asp) * (1.0 + 1.1 * p) + C_SIGNAL * p * 1.1;
      }
    } else if (kind == 14) {
      // stretch: column by column the picture is pulled upwards into streaks
      float colId = floor(vUv.x * res.x / 9.0);
      float h = hash11(colId * 1.31 + 3.0);
      if (after < 0.5) {
        float rise = clamp(pow(pre, 1.7) * (0.55 + 1.1 * h), 0.0, 1.0);
        float yT = 1.0 - rise;
        col = vUv.y > yT ? A(vec2(vUv.x, yT)) * (1.0 + 0.9 * (vUv.y - yT)) : A(vUv);
        // (the breath holds the streaks still: nothing to add, the time itself is frozen)
      } else {
        float fall = outExpo(post * 2.4) * (0.7 + 0.6 * h);
        float yT = clamp(fall, 0.0, 1.0);
        vec3 base = vUv.y > yT ? B(vec2(vUv.x, yT)) * (1.0 + 0.9 * (vUv.y - yT)) : B(vUv);
        // two rings, the second on the next half beat
        vec2 d = (vUv - c) * asp;
        float r = length(d);
        float p = exp(-pow((r - post * 1.4) / (0.05 + 0.1 * post), 2.0)) * (1.0 - post);
        float t2 = post - 0.25;
        if (t2 > 0.0) p += 0.7 * exp(-pow((r - t2 * 1.4) / (0.05 + 0.1 * t2), 2.0)) * (1.0 - t2);
        col = base * (1.0 + 1.5 * p) + C_SIGNAL * p * 1.3;
      }
    }
    if (kind == 15 || kind == 21) {
      // portal: one shot lives in a detail of the other. Going in, the detail grows until it is the
      // frame; coming out, the frame shrinks until it is the detail. The zoom runs evenly in scale.
      const float R0 = 0.085;                          // the detail is this share of the frame
      bool goingIn = kind == 15;
      // 0: the big shot fills the frame; 1: the detail does. Going in, the camera gathers speed into the
      // cut. Coming out, it leaves the cut gently and settles (smoothstep): a curve that is fastest at the
      // cut shrank the old picture by a fifth in the first frame after it, which read as a broken frame
      float g = goingIn ? pow(pre, 2.2) : 1.0 - post * post * (3.0 - 2.0 * post);
      float z = exp(g * log(1.0 / R0));                // magnification of the big shot
      float sz = R0 * z;                                // share of the frame the detail takes up
      vec2 pc = mix(c, vec2(0.5), (sz - R0) / (1.0 - R0));
      vec2 uBig = c + (vUv - pc) / z;
      vec2 uSmall = (vUv - pc) / sz + 0.5;
      float speed = goingIn ? pre : 4.0 * post * (1.0 - post);
      // the big shot streaks towards the detail as the camera gathers speed
      vec3 big = vec3(0.0);
      for (int i = 0; i < 10; i++) {
        float u = (float(i) + hash12(gl_FragCoord.xy + frame)) / 10.0;
        vec2 q = c + (uBig - c) * (1.0 - 0.22 * speed * speed * u);
        big += goingIn ? A(q) : B(q);
      }
      big /= 10.0;
      vec3 small = goingIn ? B(uSmall) : A(uSmall);
      float on = inside(uSmall);
      vec2 e = (abs(uSmall - 0.5) - 0.5) * sz * res;   // px to the edge of the detail, negative inside
      float border = 1.0 - smoothstep(0.0, 5.0, abs(max(e.x, e.y)));
      // coming out, the small old picture fades into the new shot over the last quarter, instead of
      // vanishing on the frame the transition ends
      float keep = goingIn ? 1.0 : 1.0 - smoothstep(0.75, 1.0, post);
      on *= keep;
      border *= keep;
      col = mix(big, small, on);
      col = mix(col, C_FG * 1.2, border * (1.0 - smoothstep(0.75, 1.0, sz)));
    } else if (kind == 16) {
      // through: letters stand before the camera; what is seen through their holes is the next shot
      vec4 m = texture(texM, vUv);
      float body = m.r, hole = m.g * (1.0 - m.r);
      vec3 a = A(c + (vUv - c) / (1.0 + 0.3 * k));
      vec3 b = B(c + (vUv - c) / (1.0 + 0.45 * (1.0 - k) * (1.0 - k)));
      // round the letter is the shot the camera is leaving, until the cut: from then on the
      // letter is all that is left of it
      col = mix(after < 0.5 ? a : b, b, hole);
      // the face of the letter, lit from above, with an edge that catches the light
      float edge = clamp(length(vec2(dFdx(m.r), dFdy(m.r))) * 3.0, 0.0, 1.0);
      vec3 face = slab * (0.82 + 0.18 * vUv.y);
      col = mix(col, face, body);
      col = mix(col, C_SIGNAL * 2.6, edge);
    } else if (kind == 17) {
      // shatter: the frame is a pane. It breaks where it was hit, and the pieces fall
      if (after < 0.5) {
        col = A(vUv);
      } else {
        const vec2 N = vec2(6.0, 10.0);
        float tau = post * 1.5;
        vec3 behind = B(c + (vUv - c) / (1.0 + 0.16 * (1.0 - outExpo(post * 1.6))));
        col = behind;
        float top = -1.0;
        vec2 cell = floor(vUv * N);
        for (int j = 0; j <= 6; j++) for (int i = -1; i <= 1; i++) {
          vec2 id = cell + vec2(float(i), float(j));       // pieces come from their own place and from above
          if (id.x < 0.0 || id.y < 0.0 || id.x >= N.x || id.y >= N.y) continue;
          vec2 sd = (id + 0.5 + (hash22(id + 3.1) - 0.5) * 0.8) / N;
          float far = length((sd - c) * asp);
          float tl = max(0.0, tau - far * 0.22);              // the break spreads from where the pane was hit
          vec2 away = far > 1e-4 ? normalize((sd - c) * asp) : vec2(0.0, 1.0);
          vec2 off = away * 0.10 * tl / asp + vec2(0.0, -1.7 * tl * tl);
          float th = (hash12(id + 9.7) - 0.5) * 3.4 * tl;
          float sc = 1.0 + 0.3 * tl;
          vec2 x = sd + (rot2(-th) * ((vUv - off - sd) * asp)) / asp / sc;
          if (inside(x) < 0.5) continue;
          // is x in this piece? it is, if this piece's seed is the nearest to it
          vec2 xc = floor(x * N);
          float best = 1e9, second = 1e9; vec2 bid = vec2(-1.0);
          for (int b = -1; b <= 1; b++) for (int a = -1; a <= 1; a++) {
            vec2 nid = xc + vec2(float(a), float(b));
            vec2 ns = (nid + 0.5 + (hash22(nid + 3.1) - 0.5) * 0.8) / N;
            float dd = length((x - ns) * asp);
            if (dd < best) { second = best; best = dd; bid = nid; } else if (dd < second) second = dd;
          }
          if (bid != id) continue;
          float z = hash12(id + 1.3);
          if (z < top) continue;
          top = z;
          float crack = 1.0 - smoothstep(0.0, 0.006, second - best);
          vec3 piece = A(x) * (0.72 + 0.28 * cos(th * 1.7));
          piece += vec3(1.6) * crack * (0.35 + 0.65 * exp(-tau * 5.0));
          col = piece;
        }
      }
    } else if (kind == 18) {
      // slices: the frame is cut into strips, which leave by turns to either side
      const float n = 7.0;
      bool level = abs(dir.x) > abs(dir.y);              // strips run along the direction of travel
      float along = level ? vUv.y : vUv.x;
      float i = floor(along * n);
      float kk = clamp((k * 1.35 - (i / n) * 0.35), 0.0, 1.0);
      float off = (mod(i, 2.0) < 0.5 ? 1.0 : -1.0) * pow(kk, 3.0) * 1.15;
      vec2 ua = vUv - (level ? vec2(off, 0.0) : vec2(0.0, off));
      vec3 a = vec3(0.0);
      for (int t = 0; t < 6; t++) {
        float u = (float(t) + 0.5) / 6.0 - 0.5;
        a += A(ua + (level ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) * kk * kk * 0.08 * u);
      }
      a /= 6.0;
      col = inside(ua) > 0.5 ? a : B(vUv);
      float gap = abs(fract(along * n) - 0.5) * 2.0;
      col *= 1.0 - 0.9 * smoothstep(0.965, 1.0, gap) * sin(PI * k);
    } else if (kind == 19) {
      // spin: the frame turns about the focus and the next shot arrives still turning
      float a = after < 0.5 ? pow(pre, 3.0) : -pow(1.0 - post, 3.0);
      float ang = a * 1.75 * (dir.x < 0.0 ? -1.0 : 1.0);
      float zm = 1.0 + 0.7 * abs(a);
      vec3 sum = vec3(0.0);
      for (int i = 0; i < 16; i++) {
        float u = (float(i) + hash12(gl_FragCoord.xy + frame * 3.1)) / 16.0 - 0.5;
        vec2 q = rot2(ang * (1.0 + 0.35 * u)) * ((vUv - c) * asp) / zm;
        sum += S(c + q / asp);
      }
      col = sum / 16.0;
    } else if (kind == 20) {
      // stepzoom: three hard steps in on the last sixteenths, and the next shot steps back out
      float st = after < 0.5 ? floor(clamp(pre, 0.0, 0.999) * 3.0) + 1.0 : max(0.0, 2.0 - floor(post * 4.0));
      float zm = after < 0.5 ? pow(1.42, st) : pow(1.22, st);
      float tw = (mod(st, 2.0) < 0.5 ? 1.0 : -1.0) * 0.045 * st * (after < 0.5 ? 1.0 : 0.5);
      vec2 q = rot2(tw) * ((vUv - c) * asp) / zm;
      float split = 0.006 * st;
      col.r = S(c + q * (1.0 + split) / asp).r;
      col.g = S(c + q / asp).g;
      col.b = S(c + q * (1.0 - split) / asp).b;
    }
    if (kind == 24) {
      // iris: the next shot is seen through a circle that opens from the focus until it clears the frame
      float r = length((vUv - c) * res), R = farCorner(c) * 1.03 * k;
      float inB = 1.0 - smoothstep(R - 1.5, R + 1.5, r);
      col = mix(A(vUv), B(vUv), inB);
      col = mix(col, slab, exp(-pow((r - R) / 2.2, 2.0)) * sin(PI * k) * 0.9);
    } else if (kind == 25) {
      // aperture: six blades close over the shot to a point, and open again on the next one
      float open = after < 0.5 ? 1.0 - easeIO(pre) : easeIO(post);
      float Ra = farCorner(c) * 1.02 * open;              // the apothem of the hexagonal opening
      float th = (1.0 - open) * 1.2 + 0.25;
      vec2 p = (vUv - c) * res;
      float sd[6]; bool inside = true;
      for (int i = 0; i < 6; i++) {
        float a = th + float(i) * TAU / 6.0;
        sd[i] = dot(p, vec2(cos(a), sin(a))) - Ra;
        if (sd[i] > 0.0) inside = false;
      }
      if (inside) {
        col = Sin(vUv);
        // the edge of the opening throws a little shadow inwards
        float e = 0.0; for (int i = 0; i < 6; i++) e = max(e, sd[i]);
        col *= 1.0 - 0.35 * exp(e / 10.0);
      } else {
        // the blade is the last of the run of edges this pixel is outside of; its seam is the next edge's line
        int bl = 0;
        for (int i = 0; i < 6; i++) if (sd[i] > 0.0 && sd[(i + 1) % 6] <= 0.0) bl = i;
        float seam = -sd[(bl + 1) % 6], lip = sd[bl];
        float tone = 0.8 + 0.2 * sin(float(bl) * 2.4 + 1.0);
        // brushed metal: a sheen that runs across each blade, facing the light at the top left
        float ang = th + float(bl) * TAU / 6.0;
        float sheen = 0.5 + 0.5 * cos(ang - 2.2);
        vec3 metal = mix(C_BG, C_FG, 0.10 + 0.10 * sheen) * tone;
        metal *= 1.0 - 0.55 * exp(-seam / 3.0);            // the shadow of the blade above, along the seam
        metal += C_FG * 0.35 * exp(-pow(lip / 1.6, 2.0));   // the lip of the opening catches the light
        col = metal;
      }
    } else if (kind == 26) {
      // dip: the shot fades to a colour and the next one rises from it
      float a = after < 0.5 ? smoothstep(0.0, 1.0, pre) : 1.0 - smoothstep(0.0, 1.0, post);
      col = mixShown(S(vUv), fill, a);
    } else if (kind == 27) {
      // wipe: a straight edge sweeps across in the direction of travel; behind it is the next shot
      vec2 d = normalize(d2 * asp);
      float L = 0.5 * (abs(d.x) * asp.x + abs(d.y));
      float x = (dot((vUv - 0.5) * asp, d) + L) / (2.0 * L);        // 0 where the edge starts, 1 where it ends
      float e = mix(-0.01, 1.01, k);
      float px = (x - e) * 2.0 * L * res.y;                        // px ahead of the edge
      col = mix(B(vUv), A(vUv), smoothstep(-1.0, 1.0, px));
      col *= 1.0 - 0.3 * exp(px / 18.0) * step(px, 0.0) * sin(PI * k);   // the edge throws a soft shadow on the new shot
      col = mix(col, slab, exp(-pow(px / 1.4, 2.0)) * sin(PI * k));
    } else if (kind == 28) {
      // cover: three flat panels of colour sweep in one behind the other and cover the frame at the
      // cut, then sweep on out in the same direction, the last one in the first one out
      vec2 d = normalize(d2 * asp);
      float L = 0.5 * (abs(d.x) * asp.x + abs(d.y));
      float x = (dot((vUv - 0.5) * asp, d) + L) / (2.0 * L);
      vec3 pc[3]; pc[0] = mix(fill, C_FG, 0.55); pc[1] = fill; pc[2] = slab;
      col = Sin(vUv);
      float lastEdge = 1e9;
      for (int j = 0; j < 3; j++) {
        float fj = float(j);
        bool on;
        float edgePx;
        if (after < 0.5) {
          float e = 1.0 - pow(1.0 - clamp((pre - fj * 0.16) / 0.68, 0.0, 1.0), 3.0);
          on = x < e * 1.02;
          edgePx = (e * 1.02 - x) * 2.0 * L * res.y;
        } else {
          float e = pow(clamp((post - (2.0 - fj) * 0.16) / 0.68, 0.0, 1.0), 3.0);
          on = x > e * 1.02 - 0.01;
          edgePx = (x - e * 1.02) * 2.0 * L * res.y;
        }
        if (on) { col = pc[j]; lastEdge = edgePx; }
        else if (edgePx > -14.0 && edgePx < 0.0) col *= 1.0 - 0.25 * (1.0 + edgePx / 14.0);   // shadow of the panel above
      }
    } else if (kind == 29) {
      // flood: a colour swells from the focus past every corner; after the cut it shrinks back into
      // the focus and leaves the next shot
      float far = farCorner(c) * 1.12;
      float R = after < 0.5 ? far * pow(pre, 1.6) : far * (1.0 - easeIO(post));
      float r = length((vUv - c) * res);
      float inF = 1.0 - smoothstep(R - 1.5, R + 1.5, r);
      col = mix(Sin(vUv), fill, inF);
      col *= 1.0 - 0.3 * exp(-(r - R) / 16.0) * step(R, r) * step(0.5, R);   // its edge throws a shadow
    } else if (kind == 30) {
      // fold: the frame is a paper map of 3 x 3 panels. The shot folds up (corners onto the sides,
      // the sides onto the middle), the packet turns over at the cut, and the next shot unfolds
      // (the middle, then the four sides, then the corners)
      float phiC, phiP, psi;
      if (after < 0.5) {
        phiC = PI * easeIO(pre / 0.4); phiP = PI * easeIO((pre - 0.35) / 0.4); psi = 0.5 * PI * easeIO((pre - 0.75) / 0.25);
      } else {
        psi = 0.5 * PI * (1.0 - easeIO(post / 0.25)); phiP = PI * (1.0 - easeIO((post - 0.2) / 0.4)); phiC = PI * (1.0 - easeIO((post - 0.55) / 0.45));
      }
      vec2 L = vec2(1.0 / 3.0);
      vec3 table = C_BG * 0.55;
      vec3 back = mix(C_FG, C_BG, 0.25);
      col = table;
      if (psi > 0.001) {
        // the folded packet turns about its upright axis
        float w = abs(cos(psi));
        vec2 q = vUv - 0.5;
        if (abs(q.x) <= L.x * 0.5 * w && abs(q.y) <= L.y * 0.5 * (1.0 + 0.12 * sin(2.0 * psi))) col = back * (0.5 + 0.5 * w);
      } else {
        vec2 src; bool front; float sh;
        // the middle lies flat
        if (vUv.x >= L.x && vUv.x < 2.0 * L.x && vUv.y >= L.y && vUv.y < 2.0 * L.y) col = Sin(vUv);
        // the four sides, hinged on the middle
        vec2 cells[4]; vec2 hs[4];
        cells[0] = vec2(1.0, 0.0); hs[0] = vec2(0.0, 1.0);
        cells[1] = vec2(1.0, 2.0); hs[1] = vec2(0.0, -1.0);
        cells[2] = vec2(0.0, 1.0); hs[2] = vec2(1.0, 0.0);
        cells[3] = vec2(2.0, 1.0); hs[3] = vec2(-1.0, 0.0);
        for (int i = 0; i < 4; i++) {
          if (panel(vUv, cells[i] * L, L, hs[i], phiP, src, front, sh)) {
            // a side that carries its folded corners shows their backs
            bool covered = i >= 2 && phiC > PI - 0.01;
            col = (front && !covered ? Sin(src) : back) * sh;
          }
        }
        // the corners, hinged on the left and right sides; hidden while those are folding
        if (phiP < 0.001) {
          vec2 cc[4]; vec2 ch[4];
          cc[0] = vec2(0.0, 0.0); ch[0] = vec2(0.0, 1.0);
          cc[1] = vec2(0.0, 2.0); ch[1] = vec2(0.0, -1.0);
          cc[2] = vec2(2.0, 0.0); ch[2] = vec2(0.0, 1.0);
          cc[3] = vec2(2.0, 2.0); ch[3] = vec2(0.0, -1.0);
          for (int i = 0; i < 4; i++)
            if (panel(vUv, cc[i] * L, L, ch[i], phiC, src, front, sh)) col = (front ? Sin(src) : back) * sh;
        }
      }
    } else if (kind == 31) {
      // glitch: around the cut the frame breaks into bands that tear sideways, split their colours
      // and show one shot or the other, more of the next as the window goes on
      float a = after < 0.5 ? pre * pre : (1.0 - post) * (1.0 - post);
      float st = floor(frame / 2.0);
      float band = floor(vUv.y * (18.0 + 30.0 * hash11(st)) );
      float h = hash12(vec2(band, st));
      bool torn = h > 1.0 - 0.7 * a;
      vec2 uv = vUv;
      if (torn) uv.x += (hash12(vec2(band, st + 5.3)) - 0.5) * 0.25 * a;
      vec2 blk = floor(vUv * vec2(8.0, 14.0));
      if (hash12(blk + st * 1.3) > 1.0 - 0.18 * a) uv = fract(uv + (hash22(blk + st) - 0.5) * 0.3);
      bool useB = hash12(vec2(band + 11.0, st)) < k;
      float sp = (4.0 + 20.0 * a * (torn ? 1.0 : 0.3)) / res.x;
      vec3 x = useB ? vec3(B(uv + vec2(sp, 0.0)).r, B(uv).g, B(uv - vec2(sp, 0.0)).b) : vec3(A(uv + vec2(sp, 0.0)).r, A(uv).g, A(uv - vec2(sp, 0.0)).b);
      // a few bands lose their picture to one flat colour of the signal
      if (torn && hash12(vec2(band, st + 9.1)) > 0.8) x = mix(x, C_SIGNAL * 1.5, 0.7);
      col = x;
    }
    fragColor = vec4(col, 1.0);
  }`;

/** The letters of a `through` transition, as an outline at a size of 1000 px, and the hole the camera goes through. */
interface Letters { body: Path2D; hole: { x: number; y: number; w: number; h: number } }
const letters = new Map<string, Letters>();

/**
 * The outline of the letters and their largest hole. The hole is found on a small drawing of the
 * letters, not from their contours: a face may build a letter from contours that overlap, and
 * then no contour is the hole. Whatever is neither letter nor reachable from the edge is a hole.
 */
function lettersOf(text: string): Letters {
  const known = letters.get(text);
  if (known) return known;
  const cmds = textPathCommands(text, F.display(900), 1000, 0, 0);
  const d = cmds.map((c) => {
    if (c.type === 'M' || c.type === 'L') return `${c.type}${c.x} ${c.y}`;
    if (c.type === 'Q') return `Q${c.x1} ${c.y1} ${c.x} ${c.y}`;
    if (c.type === 'C') return `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
    return 'Z';
  }).join('');
  const body = new Path2D(d);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cmds) if (c.type !== 'Z') { x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); }
  // a drawing a fifth of the size, with a margin all round for the flood to run in
  const K = 0.2, M = 4;
  const w = Math.ceil((x1 - x0) * K) + 2 * M, h = Math.ceil((y1 - y0) * K) + 2 * M;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d', { willReadFrequently: true })!;
  c2.setTransform(K, 0, 0, K, M - x0 * K, M - y0 * K);
  c2.fillStyle = '#fff';
  c2.fill(body, 'nonzero');
  const px = c2.getImageData(0, 0, w, h).data;
  // 0 = not visited, 1 = letter, 2 = outside, 3.. = holes
  const mark = new Uint16Array(w * h);
  for (let i = 0; i < w * h; i++) if (px[i * 4 + 3]! > 127) mark[i] = 1;
  const flood = (start: number, label: number) => {
    const stack = [start];
    let n = 0, bx0 = w, by0 = h, bx1 = 0, by1 = 0;
    mark[start] = label;
    while (stack.length) {
      const i = stack.pop()!, x = i % w, y = (i / w) | 0;
      n++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && mark[j] === 0) { mark[j] = label; stack.push(j); }
      }
    }
    return { n, bx0, by0, bx1, by1 };
  };
  flood(0, 2);
  let best = { n: 0, bx0: 0, by0: 0, bx1: 0, by1: 0 }, label = 3;
  for (let i = 0; i < w * h; i++) if (mark[i] === 0) { const f = flood(i, label++); if (f.n > best.n) best = f; }
  if (!best.n) console.warn(`transition 'through': no letter of "${text}" has a hole`);
  const toLetters = (v: number, o: number) => (v - M) / K + o;
  const hole = best.n
    ? { x: toLetters((best.bx0 + best.bx1 + 1) / 2, x0), y: toLetters((best.by0 + best.by1 + 1) / 2, y0), w: (best.bx1 - best.bx0 + 1) / K, h: (best.by1 - best.by0 + 1) / K }
    : { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: 200, h: 300 };
  const made = { body, hole };
  letters.set(text, made);
  return made;
}

/** The size of the letters of a `through` (px) when nothing else is asked for: a word that can be read. */
export const THROUGH_SIZE = 160;

/**
 * Where the letters of a `through` stand at a point k (0..1) of its window: a point of the letters
 * set at 1000 px (y down, origin at the left end of the baseline) is drawn at
 * (x + gx * scale, y + gy * scale). At k = 0 this is where they first appear, so a shot that shows
 * the same letters can set its own exactly there and hand them over.
 */
export function throughLetters(tr: Pick<Transition, 'text' | 'size' | 'focus'>, k = 0) {
  const L = lettersOf(tr.text ?? '0');
  // from letters that can be read to a hole wider than the frame, evenly in scale, gathering speed
  const s0 = (tr.size ?? THROUGH_SIZE) / 1000, s1 = 2.8 * Math.max(W / L.hole.w, H / L.hole.h);
  const scale = s0 * Math.pow(s1 / s0, Math.pow(k, 1.35));
  return { scale, x: tr.focus[0] - L.hole.x * scale, y: tr.focus[1] - L.hole.y * scale, body: L.body, hole: L.hole };
}

const KIND_INDEX: Record<TransitionKind, number> = Object.fromEntries(TRANSITION_KINDS.map((k, i) => [k, i])) as Record<TransitionKind, number>;

export class TransitionPass {
  /** Where the outgoing and the incoming shot are drawn, and the finished frame. */
  readonly a = makeRT();
  readonly b = makeRT();
  readonly out = makeRT(W, H, { depthBuffer: false });
  /** The letters of a `through`: red where a letter is, green over the box round the hole the camera goes through. */
  private mask = new Layer2D();
  private pass = new FSPass(FRAG, {
    texA: { value: null }, texB: { value: null }, texM: { value: null }, slab: { value: new THREE.Vector3(1, 1, 1) }, fill: { value: new THREE.Vector3(0, 0, 0) }, kind: { value: 0 },
    after: { value: 0 }, rel: { value: 0 }, pre: { value: 0 }, post: { value: 0 }, k: { value: 0 },
    frame: { value: 0 }, slice: { value: 0 }, breath: { value: BREATH },
    res: { value: new THREE.Vector2(W, H) }, focus: { value: new THREE.Vector2(W / 2, H / 2) }, dir: { value: new THREE.Vector2(1, 0) },
  });

  /** Draws the letters of a `through` where the camera sees them at this point of the transition. */
  private drawLetters(tr: Transition, s: TransitionState) {
    const { scale, x, y, ...L } = throughLetters(tr, s.k);
    const c = this.mask.ctx;
    this.mask.clear('#000');
    c.setTransform(scale, 0, 0, scale, x, y);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = '#f00';
    c.fill(L.body, 'nonzero');
    // the box round the hole, a little large: inside it, whatever is not letter is the hole
    c.fillStyle = '#0f0';
    c.fillRect(L.hole.x - L.hole.w * 0.52, L.hole.y - L.hole.h * 0.52, L.hole.w * 1.04, L.hole.h * 1.04);
    c.globalCompositeOperation = 'source-over';
    return this.mask.upload();
  }

  /** Draws the transition from the pictures in `a` and `b` into `out`. `kind` is the kind to play (see `played`). */
  render(renderer: THREE.WebGLRenderer, tr: Transition, kind: TransitionKind, s: TransitionState, frame: number, slice: number, slab: [number, number, number]) {
    const u = this.pass.u;
    const both = needsBoth(kind);
    u.texM!.value = kind === 'through' ? this.drawLetters(tr, s) : this.mask.texture;
    (u.slab!.value as THREE.Vector3).set(...slab);
    // (a key the palette does not have falls back to the default rather than stopping the film)
    (u.fill!.value as THREE.Vector3).set(...(LIN[tr.colour ?? (kind === 'dip' ? 'ink' : 'signal')] ?? LIN[kind === 'dip' ? 'ink' : 'signal']));
    // a shot that was not drawn for this frame stands in for itself: the pass never reads it
    u.texA!.value = both || !s.after ? this.a.texture : this.b.texture;
    u.texB!.value = both || s.after ? this.b.texture : this.a.texture;
    u.kind!.value = KIND_INDEX[kind];
    u.after!.value = s.after ? 1 : 0;
    u.rel!.value = s.rel;
    u.pre!.value = s.pre;
    u.post!.value = s.post;
    // push, caret and tiles run once through the whole window, slow at both ends
    u.k!.value = kind === 'push' ? ease.inOutExpo(s.k) : kind === 'caret' || kind === 'slices' || kind === 'iris' || kind === 'wipe' ? ease.inOutCubic(s.k) : s.k;
    u.frame!.value = frame;
    u.slice!.value = slice;
    (u.focus!.value as THREE.Vector2).set(...tr.focus);
    (u.dir!.value as THREE.Vector2).set(...tr.dir);
    this.pass.render(renderer, this.out);
  }
}

const decay = (beats: number, halfLife: number) => (beats < 0 ? 0 : Math.pow(0.5, beats / halfLife));
/** A shake that dies away, the same for every sample of a frame. */
function shakeOf(amp: number, frame: number, seed: number): [number, number] {
  return amp < 0.4 ? [0, 0] : [amp * (hash(frame, seed, 1) - 0.5) * 2, amp * (hash(frame, seed, 2) - 0.5) * 2];
}

/**
 * What a transition does to the post settings of the frame, on top of what the shot asked for.
 * `base` is the shot's own request; zoom is multiplied and shake added, the rest replaces.
 */
export function transitionPost(tr: Transition, kind: TransitionKind, s: TransitionState, frame: number, framesSinceCut: number, base: PostOverrides): PostOverrides {
  const out: PostOverrides = {};
  const zoom0 = base.zoom ?? 1, shake0 = base.shake ?? [0, 0];
  const r = s.rel;
  let zoom = 1, shakeAmp = 0, flash = 0, ca = 0, invert = 0;
  // how far a build has come, and the sixteenth it is in (for anything that steps with the roll)
  const e = Math.pow(s.pre, 2);
  const sixteenth = Math.floor((r + 64) * 4);
  // a build does not only swell, it kicks: a punch on every half beat of the lead, each harder than the last
  const half = (r + 64) * 2, kick = Math.pow(0.5, (half - Math.floor(half)) / 2 / 0.12);
  const build = !s.after && r <= -BREATH ? 1 + 0.085 * (0.35 + 0.65 * s.pre) * kick : 1;
  // the first two frames of a drop are printed in negative: the eye takes the cut as a blow
  const blow = s.after && framesSinceCut < 2 ? 1 : 0;
  switch (kind) {
    case 'cut': break;
    case 'punch': zoom = 1 + 0.1 * decay(r, 0.22) * Math.cos(r * 7); break;
    case 'invert': invert = s.after && framesSinceCut < 2 ? 1 : 0; zoom = 1 + 0.05 * decay(r, 0.18); shakeAmp = 10 * decay(r, 0.15); break;
    case 'flash': flash = 0.85 * decay(r, 0.12); zoom = 1 + 0.04 * decay(r, 0.2); break;
    case 'whip': ca = 7 * (s.after ? Math.pow(1 - s.post, 3) : Math.pow(s.pre, 3)); break;
    case 'push': case 'caret': case 'tiles': break;
    case 'slices': ca = 4 * Math.sin(Math.PI * s.k); shakeAmp = s.after ? 8 * decay(r, 0.12) : 0; break;
    case 'spin': ca = 8 * (s.after ? Math.pow(1 - s.post, 2) : Math.pow(s.pre, 2)); zoom = 1 + 0.05 * decay(r, 0.2); break;
    case 'stepzoom': shakeAmp = s.after ? 16 * decay(r, 0.15) : 9 * s.pre; ca = 3; flash = 0.5 * decay(r, 0.08); break;
    case 'zoom-in': ca = 9 * (s.after ? Math.pow(1 - s.post, 3) : Math.pow(s.pre, 3)); break;   // (after the cut the fringe dies away over the tail; it used to hold at full and stop in one frame)
    case 'pull-out': ca = 9 * Math.pow(1 - s.post, 3); zoom = 1 + 0.03 * decay(r, 0.2); break;
    case 'through': ca = 5 * Math.sin(Math.PI * s.k); shakeAmp = s.after ? 12 * decay(r, 0.15) : 0; flash = 0.3 * decay(r, 0.08); break;
    case 'shatter':
      if (!s.after) { zoom = build; ca = 6 * s.pre; }
      else { invert = blow; flash = blow ? 0 : 0.7 * decay(r, 0.09); shakeAmp = 38 * decay(r, 0.2); ca = 12 * decay(r, 0.25); zoom = 1 + 0.06 * decay(r, 0.2); }
      break;
    case 'travel': case 'match': break;
    case 'crt': flash = s.after ? 0.35 * decay(r, 0.1) : 0; break;
    case 'iris': case 'dip': case 'wipe': case 'cover': case 'flood': case 'fold': break;
    case 'aperture': shakeAmp = s.after ? 7 * decay(r, 0.12) : 0; break;
    case 'glitch': { const g = s.after ? Math.pow(1 - s.post, 2) : Math.pow(s.pre, 2); ca = 9 * g; shakeAmp = 5 * g; break; }
    case 'rewind': ca = 3 * (s.after ? 1 - s.post : s.pre); shakeAmp = 6 * (s.after ? 1 - s.post : s.pre); break;
    case 'implode':
      if (!s.after) { ca = 12 * e; shakeAmp = r > -BREATH ? 0 : 14 * e; zoom = build; }
      else { invert = blow; flash = blow ? 0 : 1.0 * decay(r, 0.1); zoom = 1 + 0.2 * decay(r, 0.22) * Math.cos(r * 6); shakeAmp = 34 * decay(r, 0.2); ca = 10 * decay(r, 0.3); }
      break;
    case 'stutter':
      if (!s.after) { shakeAmp = r > -BREATH ? 0 : 16 * e; ca = 6 * e; }
      else { invert = blow; flash = blow ? 0 : 0.9 * decay(r, 0.1); zoom = 1 + 0.2 * decay(r, 0.22) * Math.cos(r * 6); shakeAmp = 36 * decay(r, 0.2); ca = 8 * decay(r, 0.3); }
      break;
    case 'tunnel':
      if (!s.after) { ca = 14 * e; shakeAmp = 12 * e; zoom = build; }
      else { flash = 1.5 * decay(r, 0.14); shakeAmp = 32 * decay(r, 0.2); ca = 9 * decay(r, 0.3); zoom = 1 + 0.16 * decay(r, 0.22) * Math.cos(r * 6); }
      break;
    case 'breath':
      if (s.after) { invert = blow; flash = blow ? 0 : 0.6 * decay(r, 0.1); zoom = 1 + 0.16 * decay(r, 0.22) * Math.cos(r * 6); shakeAmp = 22 * decay(r, 0.2); ca = 7 * decay(r, 0.3); }
      break;
    case 'stretch':
      if (!s.after) {
        ca = 10 * e;
        zoom = build;
        // in the last beat the frame turns negative on every other sixteenth, along with the roll
        invert = r > -1 && r <= -BREATH && sixteenth % 2 === 0 ? 1 : 0;
        shakeAmp = r > -BREATH ? 0 : 16 * e;
      } else { flash = 1.3 * decay(r, 0.1); zoom = 1 + 0.22 * decay(r, 0.22) * Math.cos(r * 6); shakeAmp = 40 * decay(r, 0.2); ca = 12 * decay(r, 0.3); }
      break;
  }
  if (zoom !== 1) out.zoom = zoom0 * zoom;
  if (shakeAmp > 0) { const sh = shakeOf(shakeAmp, frame, sixteenth); out.shake = [shake0[0] + sh[0], shake0[1] + sh[1]]; }
  if (flash > 0) out.flash = Math.max(base.flash ?? 0, flash);
  if (ca > 0) out.ca = (base.ca ?? 0) + ca;
  if (invert > 0) out.invert = invert;
  return out;
}
