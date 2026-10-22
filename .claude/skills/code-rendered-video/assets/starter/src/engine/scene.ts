// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./LICENSE-pdoom-video.txt
// Scene API. A scene owns a time window of the song and renders HDR linear colour
// into the render target it is given. Everything must be a deterministic function of
// time (plus internal state advanced only through render() calls, see `stateful`).
import type * as THREE from 'three';
import type { AudioData, AudioSample } from './audio';
import type { Lyrics } from './lyrics';
import type { Compositor } from './gl';
import type { PostParams } from './post';

export interface SceneCtx {
  renderer: THREE.WebGLRenderer;
  audio: AudioData;
  lyrics: Lyrics;
  comp: Compositor;
  W: number;
  H: number;
  /** Timeline entry id and its free-form params (lets one scene module serve several entries). */
  id: string;
  params: Record<string, any>;
  /** Entry window (song seconds). */
  start: number;
  end: number;
}

export interface Frame {
  /** Song time (s). */
  t: number;
  /** Time since the previous rendered frame (1/fps on export; 0 after a seek). */
  dt: number;
  /** Local time since this scene's start, and 0..1 progress through its window. */
  lt: number;
  p: number;
  start: number;
  end: number;
  /** True when time jumped (scrub/seek) — stateful scenes should reset. */
  seeked: boolean;
  /** True while the engine fast-forwards a stateful scene after a seek (skip non-essential work). */
  preroll: boolean;
  /** Continuous beat/bar indices from the analysed grid, and their fractional phases. */
  beat: number;
  bar: number;
  beatPhase: number;
  barPhase: number;
  /** Audio features at t (envelopes 0..1 and decaying hit pulses). */
  a: AudioSample;
  /**
   * When this scene overlaps the previous one (a transition), the previous scene's
   * output texture for this frame; otherwise null. Scenes that set
   * `handlesTransition = true` composite it themselves.
   */
  under: THREE.Texture | null;
  /** 0..1 progress through the overlap with the previous scene (1 when not overlapping). */
  tin: number;
  /** 0..1 progress through the overlap with the next scene (0 when not overlapping). */
  tout: number;
  /**
   * For a scene that sets `handlesPortal`, during a `zoom-in` that leads out of it or a `pull-out`
   * that leads into it: the picture of its neighbour, held still (the first frame of the next
   * shot, or the last of the one before). The scene shows it on the detail the camera goes into
   * or comes out of. Otherwise null.
   */
  portal: THREE.Texture | null;
  /**
   * 0..1 through that transition. Going in, the detail must fill the frame exactly at 1; coming
   * out, it fills the frame at 0.
   */
  portalK: number;
}

export type PostOverrides = Partial<PostParams>;

export abstract class Scene {
  /** If true, the engine fast-forwards (calls render with preroll=true) after seeks. */
  stateful = false;
  /** Max seconds of history the engine re-simulates when seeking into a stateful scene. */
  prerollMax = 6;
  /** If true, this scene composites `f.under` itself during its incoming transition. */
  handlesTransition = false;
  /**
   * If true, this scene plays its own part in a `zoom-in` or `pull-out` (see Frame.portal), and
   * the engine's stand-in is not played. Until a scene sets this the engine zooms between the two
   * finished pictures.
   */
  handlesPortal = false;

  constructor(protected ctx: SceneCtx) {}

  /** Load/create resources. Called once before first render. */
  init(): Promise<void> | void {}

  /** Reset internal state (called on seeks for stateful scenes). */
  reset(): void {}

  /** Render into `out` (HalfFloat, linear HDR). Must fully overwrite/clear it. Return post-processing overrides. */
  abstract render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides | void;

  dispose(): void {}
}

export type SceneClass = new (ctx: SceneCtx) => Scene;
