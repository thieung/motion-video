// Shared kit: devices and interfaces. The frames a product film shows its screens in (a browser
// window, a phone, a terminal), the cursor that drives them, soft shadows under cards, and cards
// standing in space (a carousel, a wall, a tilted arrival, a reflecting floor). Read-only for
// scene authors.
//
// The flat parts draw on a Canvas2D context (a Layer2D) in px of the frame and return the
// rectangle of the screen inside the frame, so the shot draws its interface there with a clip.
// The cards in space are three.js (CardStage): true perspective, which Canvas2D cannot give an
// image, and a floor that reflects them.
//
// Everything is a pure function of its arguments. A cursor's path is a sum of springs to its
// targets (springPath), and a thing let go after a drag springs back from where it was, at the
// speed it had (released), so any moment can be asked for.
import * as THREE from 'three';
import { makeRT, W, H } from '../../engine/gl';
import { rgba } from '../../engine/palette';
import { F } from '../../engine/type';
import { clamp, ease, springRelease, springReleaseVel, TAU } from '../../engine/util';
import { setThreeCamera, type Cam3 } from './kit-camera';
import { roundRect } from './kit-type';

type Ctx = CanvasRenderingContext2D;
export interface Box { x: number; y: number; w: number; h: number }
/** The screen inside a device: its rectangle and the radius of its corners. Clip to it with `clipTo`. */
export interface Screen extends Box { r: number }

/** Clips the context to a screen (call inside save()/restore()). */
export function clipTo(c: Ctx, s: Screen) {
  roundRect(c, s.x, s.y, s.w, s.h, s.r);
  c.clip();
}

// ---- soft shadows ---------------------------------------------------------------------------------

/**
 * The shadow of a card lifted `elevation` px off the page: a tight dark contact shadow and a wide
 * soft one below it, as light from above gives. Draws the card's rounded rectangle filled with
 * `fill` (default white), shadow and all; draw the card's content over it. Uses the context's
 * shadow, which every browser has (unlike the canvas `filter`).
 * `darkness` 0..1: about 0.18 on a light ground, 0.5 on a dark one.
 */
export function softShadow(c: Ctx, b: Box, r: number, elevation = 24, darkness = 0.18, fill = '#FFFFFF') {
  c.save();
  c.fillStyle = fill;
  // the wide, soft one
  c.shadowColor = `rgba(20,16,30,${darkness})`;
  c.shadowBlur = elevation * 2.2;
  c.shadowOffsetY = elevation * 0.9;
  roundRect(c, b.x, b.y, b.w, b.h, r); c.fill();
  // the contact one
  c.shadowColor = `rgba(20,16,30,${darkness * 1.1})`;
  c.shadowBlur = Math.max(2, elevation * 0.25);
  c.shadowOffsetY = Math.max(1, elevation * 0.12);
  roundRect(c, b.x, b.y, b.w, b.h, r); c.fill();
  c.restore();
}

// ---- a browser window -----------------------------------------------------------------------------

export interface WindowStyle {
  /** Text in the address bar. */
  url?: string;
  /** A light window (white chrome) or a dark one. */
  tone?: 'light' | 'dark';
  /** Corner radius and the height of the chrome (px). */
  radius?: number;
  bar?: number;
  /** Lift off the page for its shadow (px); 0 for none. */
  elevation?: number;
  /** Tabs across the top: their labels and which is chosen. */
  tabs?: string[];
  active?: number;
}

/**
 * A browser window: its shadow, the chrome with the three lights at the left and the address bar,
 * and an empty page. Returns the page's rectangle: draw the site inside it with `clipTo`.
 */
export function browserWindow(c: Ctx, b: Box, s: WindowStyle = {}): Screen {
  const dark = s.tone === 'dark', r = s.radius ?? 18, bar = s.bar ?? 58;
  const chrome = dark ? '#26222E' : '#F4F2F7', page = dark ? '#16131C' : '#FFFFFF', line = dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,30,0.08)';
  if ((s.elevation ?? 30) > 0) softShadow(c, b, r, s.elevation ?? 30, dark ? 0.5 : 0.16, page);
  c.save();
  roundRect(c, b.x, b.y, b.w, b.h, r); c.clip();
  c.fillStyle = page; c.fillRect(b.x, b.y, b.w, b.h);
  c.fillStyle = chrome; c.fillRect(b.x, b.y, b.w, bar);
  c.fillStyle = line; c.fillRect(b.x, b.y + bar - 1, b.w, 1);
  // the three lights
  const ly = b.y + bar / 2, lr = bar * 0.11;
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(b.x + bar * 0.45 + i * lr * 3.2, ly, lr, 0, TAU); c.fill(); });
  // the address bar, in the middle
  const aw = Math.min(b.w * 0.5, 620), ah = bar * 0.56, ax = b.x + b.w / 2 - aw / 2, ay = ly - ah / 2;
  c.fillStyle = dark ? '#1B1822' : '#E6E3EC';
  roundRect(c, ax, ay, aw, ah, ah / 2); c.fill();
  if (s.url) {
    c.font = `${Math.round(ah * 0.5)}px "${F.machine(400)}"`;
    c.fillStyle = dark ? 'rgba(243,235,221,0.7)' : 'rgba(40,34,52,0.65)';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(s.url, ax + aw / 2, ly + 1);
  }
  if (s.tabs?.length) {
    c.font = `${Math.round(bar * 0.26)}px "${F.caption(500)}"`;
    c.textBaseline = 'middle'; c.textAlign = 'left';
    let tx = b.x + bar * 2.2;
    s.tabs.forEach((t, i) => {
      if (tx > ax - 20) return;
      const on = i === (s.active ?? 0);
      c.fillStyle = on ? (dark ? 'rgba(243,235,221,0.9)' : 'rgba(20,16,30,0.85)') : (dark ? 'rgba(243,235,221,0.45)' : 'rgba(20,16,30,0.4)');
      c.fillText(t, tx, ly + 1);
      tx += c.measureText(t).width + bar * 0.6;
    });
  }
  c.restore();
  c.save();
  c.strokeStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,16,30,0.10)';
  c.lineWidth = 1;
  roundRect(c, b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, r); c.stroke();
  c.restore();
  return { x: b.x, y: b.y + bar, w: b.w, h: b.h - bar, r: 0 };
}

// ---- a phone --------------------------------------------------------------------------------------

export interface PhoneStyle {
  /** Colour of the frame round the glass. */
  frame?: string;
  /** Lift off the page for its shadow (px). */
  elevation?: number;
  /** Draw the island at the top of the screen. Default true. */
  island?: boolean;
}

/**
 * A phone standing upright, centred on (cx, cy), `h` px tall (19.5 : 9): a metal frame, a black
 * bezel, the island. Returns the screen: draw the app inside it with `clipTo`, then call
 * `phoneGlass` to lay the island (and a faint reflection) over what was drawn.
 */
export function phone(c: Ctx, cx: number, cy: number, h: number, s: PhoneStyle = {}): Screen {
  const w = h * 0.49, x = cx - w / 2, y = cy - h / 2, r = w * 0.17, bez = w * 0.035;
  if ((s.elevation ?? 40) > 0) softShadow(c, { x, y, w, h }, r, s.elevation ?? 40, 0.3, '#111');
  c.save();
  // the frame: a metal edge, lit from the top left
  const g = c.createLinearGradient(x, y, x + w, y + h);
  const fr = s.frame ?? '#C9C4D2';
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.25, fr); g.addColorStop(0.7, fr); g.addColorStop(1, '#6D6878');
  c.fillStyle = g;
  roundRect(c, x, y, w, h, r); c.fill();
  // side buttons
  c.fillStyle = fr;
  c.fillRect(x - w * 0.012, y + h * 0.2, w * 0.014, h * 0.06);
  c.fillRect(x - w * 0.012, y + h * 0.29, w * 0.014, h * 0.1);
  c.fillRect(x + w - w * 0.002, y + h * 0.26, w * 0.014, h * 0.12);
  // the black bezel
  c.fillStyle = '#050407';
  roundRect(c, x + w * 0.012, y + w * 0.012, w - w * 0.024, h - w * 0.024, r * 0.93); c.fill();
  c.restore();
  return { x: x + bez, y: y + bez, w: w - 2 * bez, h: h - 2 * bez, r: r * 0.82 };
}

/** The island and a faint sheen on the glass, over a screen that `phone` returned. `island` 0..1 widens it (for a live activity). */
export function phoneGlass(c: Ctx, sc: Screen, island = 0) {
  c.save();
  const iw = sc.w * (0.33 + 0.35 * clamp(island)), ih = sc.w * 0.1, ix = sc.x + sc.w / 2 - iw / 2, iy = sc.y + sc.w * 0.035;
  c.fillStyle = '#000';
  roundRect(c, ix, iy, iw, ih, ih / 2); c.fill();
  clipTo(c, sc);
  const g = c.createLinearGradient(sc.x, sc.y, sc.x + sc.w, sc.y + sc.h * 0.6);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.35, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(sc.x, sc.y, sc.w, sc.h);
  c.restore();
}

// ---- a terminal -----------------------------------------------------------------------------------

export interface TerminalStyle {
  title?: string;
  /** Size of the text (px). */
  size?: number;
  /** How many characters of the lines have been typed so far (all of them if omitted). */
  typed?: number;
  /** Whether the block caret shows (blink it on the beat: `beatPhase < 0.5`). */
  caret?: boolean;
  /** Colour of the prompt sign and of lines that start with "!" (an error). */
  accent?: string;
  error?: string;
  elevation?: number;
}

/**
 * A dark terminal window with the three lights, a title, and lines of text. A line that starts
 * with "$ " or "> " gets its sign in the accent colour; a line that starts with "! " is an error.
 * `typed` counts characters across the lines, so the text types itself as it grows. Returns the
 * rectangle of the text area.
 */
export function terminal(c: Ctx, b: Box, lines: string[], s: TerminalStyle = {}): Screen {
  const r = 18, bar = 52, size = s.size ?? 30, lead = size * 1.45, pad = size * 0.9;
  if ((s.elevation ?? 30) > 0) softShadow(c, b, r, s.elevation ?? 30, 0.45, '#16131C');
  c.save();
  roundRect(c, b.x, b.y, b.w, b.h, r); c.clip();
  c.fillStyle = '#16131C'; c.fillRect(b.x, b.y, b.w, b.h);
  const ly = b.y + bar / 2, lr = bar * 0.11;
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(b.x + bar * 0.5 + i * lr * 3.2, ly, lr, 0, TAU); c.fill(); });
  if (s.title) {
    c.font = `${Math.round(bar * 0.34)}px "${F.machine(400)}"`;
    c.fillStyle = 'rgba(243,235,221,0.5)'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(s.title, b.x + b.w / 2, ly + 1);
  }
  c.font = `${size}px "${F.machine(400)}"`;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let left = s.typed ?? Infinity, cx = b.x + pad, cy = b.y + bar + pad + size;
  const acc = s.accent ?? '#FF2E74', err = s.error ?? '#FF5F57';
  for (const full of lines) {
    if (left <= 0) break;
    const shown = full.slice(0, Math.max(0, Math.floor(left)));
    left -= full.length;
    const sign = /^(\$|>) /.test(full) ? 2 : /^! /.test(full) ? 2 : 0;
    const isErr = full.startsWith('! ');
    c.fillStyle = isErr ? err : acc;
    c.fillText(shown.slice(0, sign), b.x + pad, cy);
    const w0 = c.measureText(shown.slice(0, sign)).width;
    c.fillStyle = isErr ? err : 'rgba(243,235,221,0.92)';
    c.fillText(shown.slice(sign), b.x + pad + w0, cy);
    cx = b.x + pad + c.measureText(shown).width;
    if (left > 0) cy += lead;
  }
  if (s.caret !== false) { c.fillStyle = 'rgba(243,235,221,0.9)'; c.fillRect(cx + 2, cy - size * 0.8, size * 0.55, size * 0.95); }
  c.restore();
  return { x: b.x, y: b.y + bar, w: b.w, h: b.h - bar, r: 0 };
}

// ---- the cursor -----------------------------------------------------------------------------------

/**
 * A pointer with its tip at (x, y): white with a dark edge and a small shadow, `size` px tall.
 * `press` 0..1 squeezes it a little, as a click does. Draw it last, over everything it points at.
 */
export function cursor(c: Ctx, x: number, y: number, size = 44, press = 0, alpha = 1) {
  const s = size / 24 * (1 - 0.12 * clamp(press));
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(s, s);
  c.beginPath();
  c.moveTo(0, 0); c.lineTo(0, 17.5); c.lineTo(4.2, 13.6); c.lineTo(7.2, 20.4); c.lineTo(10.2, 19.1); c.lineTo(7.3, 12.5); c.lineTo(12.8, 12.5); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 4 * s; c.shadowOffsetY = 1.5 * s;
  c.fillStyle = '#FFFFFF'; c.fill();
  c.shadowColor = 'transparent';
  c.lineJoin = 'round'; c.lineWidth = 1.4; c.strokeStyle = '#111016'; c.stroke();
  c.restore();
}

/** The ring that runs out from a click `since` seconds after it (nothing before it or after half a second). */
export function clickRipple(c: Ctx, x: number, y: number, since: number, colour = 'signal', radius = 46) {
  if (since < 0 || since > 0.5) return;
  const k = since / 0.5;
  c.save();
  c.strokeStyle = rgba(colour, 0.9 * (1 - k));
  c.lineWidth = 4 * (1 - k) + 1;
  c.beginPath(); c.arc(x, y, radius * ease.outCubic(k), 0, TAU); c.stroke();
  c.fillStyle = rgba(colour, 0.25 * (1 - k));
  c.beginPath(); c.arc(x, y, radius * 0.5 * ease.outCubic(k), 0, TAU); c.fill();
  c.restore();
}

/** A target of a path: from `at` seconds on, the point goes to (x, y). */
export interface PathKey { at: number; x: number; y: number }

/**
 * Where a point is that springs from target to target: the first key's place, plus one spring per
 * later key that starts at rest and carries it the rest of the way. A pure function of `t`; the
 * velocity comes with it (px/s), for a drag let go, a smear or a loop seam. `damping` near 0.8
 * gives the tiny overshoot of a hand that knows where it is going.
 */
export function springPath(t: number, keys: PathKey[], freq = 2.2, damping = 0.82) {
  let x = keys[0]!.x, y = keys[0]!.y, vx = 0, vy = 0;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]!, p = keys[i - 1]!, a = t - k.at;
    if (a <= 0) break;
    const dx = k.x - p.x, dy = k.y - p.y;
    // a step from rest: 1 + springRelease(a, -1, 0)
    const s = 1 + springRelease(a, -1, 0, freq, damping), v = springReleaseVel(a, -1, 0, freq, damping);
    x += dx * s; y += dy * s; vx += dx * v; vy += dy * v;
  }
  return { x, y, vx, vy };
}

/**
 * A thing let go: it was at (x, y) moving at (vx, vy) when released `since` seconds ago, and it
 * springs back to `rest`, keeping the speed it had. Before the release it is where it was.
 */
export function released(since: number, x: number, y: number, vx: number, vy: number, rest: [number, number], freq = 2.6, damping = 0.45) {
  return {
    x: rest[0] + springRelease(since, x - rest[0], vx, freq, damping),
    y: rest[1] + springRelease(since, y - rest[1], vy, freq, damping),
  };
}

/**
 * A trail of cursors: the same pointer drawn where it was 1, 2, ... `count` steps of `every`
 * seconds ago, each fainter. `at(t)` is the path (for example springPath). Draws the ghosts only;
 * draw the cursor itself after it.
 */
export function cursorTrail(c: Ctx, at: (t: number) => { x: number; y: number }, t: number, count = 4, every = 0.035, size = 44) {
  for (let i = count; i >= 1; i--) {
    const p = at(t - i * every);
    cursor(c, p.x, p.y, size, 0, 0.5 * (1 - i / (count + 1)));
  }
}

// ---- cards in space -------------------------------------------------------------------------------

/** Where a card stands: position (world units, y up), turn about the upright axis and the level one (radians), scale, opacity. */
export interface CardPose { x: number; y: number; z: number; ry?: number; rx?: number; rz?: number; scale?: number; opacity?: number }

/**
 * Card `i` of `n` on a ring of radius `r` seen from its front, the ring turned by `turn` radians.
 * The card at the front stands at z = 0 facing the camera; the others turn away round the ring.
 */
export function carouselPose(i: number, n: number, turn: number, r: number, y = 0): CardPose {
  const a = (i / n) * TAU + turn;
  return { x: Math.sin(a) * r, y, z: Math.cos(a) * r - r, ry: a };
}

/**
 * Card (col, row) of a wall of cols x rows, `gap` apart (world units between centres), the whole
 * wall turned by `ry` about the upright axis and `rx` about the level one, round its middle.
 */
export function wallPose(col: number, row: number, cols: number, rows: number, gap: [number, number], ry = -0.45, rx = 0.12): CardPose {
  const lx = (col - (cols - 1) / 2) * gap[0], ly = ((rows - 1) / 2 - row) * gap[1];
  // turn the point (lx, ly, 0) by rx, then by ry
  const y1 = ly * Math.cos(rx), z1 = -ly * Math.sin(rx);
  const x2 = lx * Math.cos(ry) + z1 * Math.sin(ry), z2 = -lx * Math.sin(ry) + z1 * Math.cos(ry);
  return { x: x2, y: y1, z: z2, ry, rx };
}

/**
 * A card arriving in perspective: from `from` (tilted back, lower, further away) to `to` (usually
 * flat on), carried by a spring from rest. `since` seconds after it set off.
 */
export function tiltIn(since: number, from: CardPose, to: CardPose, freq = 1.6, damping = 0.78): CardPose {
  const k = 1 + springRelease(since, -1, 0, freq, damping);
  const m = (a = 0, b = 0) => a + (b - a) * k;
  return {
    x: m(from.x, to.x), y: m(from.y, to.y), z: m(from.z, to.z), ry: m(from.ry, to.ry), rx: m(from.rx, to.rx), rz: m(from.rz, to.rz),
    scale: m(from.scale ?? 1, to.scale ?? 1), opacity: clamp(since * 6) * (to.opacity ?? 1),
  };
}

const CARD_VERT = /* glsl */ `
  varying vec2 vUv; varying float vWorldY;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorldY = w.y;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const CARD_FRAG = /* glsl */ `
  uniform sampler2D map; uniform vec3 back; uniform bool hasBack; uniform bool mirror;
  uniform float floorY, fadeLen, strength, opacity, shade;
  varying vec2 vUv; varying float vWorldY;
  void main() {
    vec4 c = texture2D(map, vUv);
    // the back of a card is plain; without a back colour it shows its face, mirrored
    if (!gl_FrontFacing && hasBack) c.rgb = back;
    float a = c.a * opacity;
    if (mirror) a *= strength * (1.0 - smoothstep(0.0, fadeLen, floorY - vWorldY));
    gl_FragColor = vec4(c.rgb * shade * a, a);
  }`;

export interface CardStageOptions {
  /** Size of every card (world units: at the default camera one unit is one px at z = 0). */
  width: number;
  height: number;
  /** The level of the floor (world y); omit for no floor and no reflections. */
  floor?: number;
  /** Linear colour of the backs of the cards; null shows the face mirrored. Default a light grey. */
  back?: [number, number, number] | null;
  /** Multiplies the faces: 0.86 (the default) keeps a white card under the bloom threshold of the dark preset. */
  shade?: number;
  /** Strength of the reflection (0..1) and the height over which it fades (world units). */
  reflect?: number;
  fade?: number;
}

/**
 * Cards standing in space, with three.js: each card a plane that shows a texture (draw its face on
 * a Layer2D of the card's size, upload once, pass `layer.texture`) and a plain back, placed by a
 * CardPose each frame; under a floor level every card is drawn again, mirrored, fading downwards,
 * as a glossy floor reflects (a copy per card, not a rendered reflection: exact for cards standing
 * on the floor, cheap, and it never shows anything but the cards). Rendered into a target of its own with 4x anti-aliasing; composite it with
 * `premult: false`. The default camera sees one world unit as one px at z = 0, looking at the
 * origin; pass a Cam3 (kit-camera.ts) to move it.
 */
export class CardStage {
  readonly rt = makeRT(W, H, { samples: 4 });
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, W / H, 1, 50000);
  private cards: THREE.Mesh[] = [];
  private mirrors: THREE.Mesh[] = [];
  private geo: THREE.PlaneGeometry;
  constructor(private o: CardStageOptions) {
    this.geo = new THREE.PlaneGeometry(o.width, o.height);
  }

  /** The default camera: at the distance where one unit at z = 0 is one px. */
  static defaultCam(fov = 30): Cam3 {
    return { pos: [0, 0, H / 2 / Math.tan((fov * Math.PI) / 360)], target: [0, 0, 0], fov };
  }

  /** Gives card i its face. Cards are made as they are first named. */
  setFace(i: number, tex: THREE.Texture) {
    while (this.cards.length <= i) {
      const make = (mirror: boolean) => new THREE.Mesh(this.geo, new THREE.ShaderMaterial({
        vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        uniforms: {
          map: { value: null }, back: { value: new THREE.Vector3(...(this.o.back ?? [0.62, 0.6, 0.66])) }, hasBack: { value: this.o.back !== null },
          mirror: { value: mirror }, floorY: { value: this.o.floor ?? 0 }, fadeLen: { value: this.o.fade ?? this.o.height * 0.6 },
          strength: { value: this.o.reflect ?? 0.35 }, opacity: { value: 1 }, shade: { value: this.o.shade ?? 0.86 },
        },
      }));
      const m = make(false);
      this.scene.add(m); this.cards.push(m);
      if (this.o.floor !== undefined) { const mm = make(true); this.scene.add(mm); this.mirrors.push(mm); }
    }
    (this.cards[i]!.material as THREE.ShaderMaterial).uniforms.map!.value = tex;
    if (this.mirrors[i]) (this.mirrors[i]!.material as THREE.ShaderMaterial).uniforms.map!.value = tex;
  }

  /** Places card i. A card that is not placed in a frame keeps its last pose: place every card every frame. */
  place(i: number, p: CardPose) {
    const m = this.cards[i];
    if (!m) return;
    const set = (o: THREE.Object3D, y: number, sy: number) => {
      o.position.set(p.x, y, p.z);
      o.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0, 'YXZ');
      o.scale.set(p.scale ?? 1, (p.scale ?? 1) * sy, 1);
      o.visible = (p.opacity ?? 1) > 0.001;
    };
    set(m, p.y, 1);
    (m.material as THREE.ShaderMaterial).uniforms.opacity!.value = p.opacity ?? 1;
    const mm = this.mirrors[i];
    if (mm && this.o.floor !== undefined) {
      // the mirror image: reflected in the plane of the floor
      set(mm, 2 * this.o.floor - p.y, -1);
      mm.rotation.set(-(p.rx ?? 0), p.ry ?? 0, -(p.rz ?? 0), 'YXZ');
      (mm.material as THREE.ShaderMaterial).uniforms.opacity!.value = p.opacity ?? 1;
    }
  }

  /** Renders the cards (and their reflections) into `rt`, cleared to transparent, and returns its texture. */
  render(renderer: THREE.WebGLRenderer, cam: Cam3 = CardStage.defaultCam()) {
    setThreeCamera(this.cam, cam);
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    renderer.render(this.scene, this.cam);
    return this.rt.texture;
  }

  dispose() {
    this.geo.dispose();
    for (const m of [...this.cards, ...this.mirrors]) (m.material as THREE.Material).dispose();
    this.rt.dispose();
  }
}
