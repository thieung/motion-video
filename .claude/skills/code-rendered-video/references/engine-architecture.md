# Engine architecture

The engine route draws every frame of the film in a browser with WebGL2, as a function of song time, and joins the shots on one page that plays them with the music. This file describes the engine of the starter the skill ships in `assets/starter/`: its contract, its layers, its tools, what it costs to run, and what changes when it moves to another machine.

Load this when: the film takes the engine route and you are setting up a film folder, writing the shared kit or a builder brief, checking how a shot uses the engine, diagnosing a blank, slow or wrong capture, or moving the film to another operating system.

A film folder is a copy of the starter. Paths are relative to it: the one folder holds `package.json`, `shots.json`, `copy.json`, `audio/`, `data/`, `src/`, `scripts/` and `analysis/`. The starter was made from the app of the reference films, which this file calls "the reference app"; the starter's README lists what it changed. The engine is derived from an open source engine under the MIT License; `src/engine/LICENSE-pdoom-video.txt` travels with every copy.

## 1. The contract

Every frame is a pure function of song time. Asked for the same time twice, a shot draws the same picture twice, whatever was drawn before.

| Rule | In practice |
|---|---|
| No wall clock | No `Date`, no `performance.now`, no timers inside a scene. Time comes from the frame object only |
| No unseeded random | No `Math.random`. Use `hash`, `mulberry32`, `noise1`, `noise2`, `noise3`, `fbm1`, `fbm2` (`src/engine/util.ts`), and the hashes of `src/engine/glsl/common.ts` in shaders |
| No state carried between frames | The picture at a time must not depend on which frames were drawn before it. A simulation is integrated once in `init()` into an array and looked up by time |
| State only with a preroll | A scene that has to integrate sets `stateful = true` and implements `reset()`. After a seek the engine resets it and simulates again from at most `prerollMax` seconds earlier. State that needs more history than that is not allowed |
| Musical time comes from data | Beats and bars are read from the beat grid of the audio data, never worked out from seconds or from a tempo figure |
| What steps is read at the frame, and only that | A value that steps and is drawn as it is (a counter, a word, a label) is worked out from the time of the output frame (`frameIdx` in `src/engine/util.ts`, `frameTime` and `frameClock` in `src/scenes/parts/kit-frame.ts`), so that the sub-frames of a motion-blurred export agree on it and it does not ghost. What moves is worked out from `f.t`. A decision that selects what is drawn (which phase, open or closed, which branch of the code) uses the same time as the drawing it selects. Between frames, in the studio, the rounded time runs ahead of `f.t` by up to half a frame; a branch chosen from it while its picture is drawn at `f.t` draws the wrong branch for an instant. From practice: a sunk line of words came back for one instant at 9.995 seconds this way, visible in playback and in no capture at a frame |

| What the rules buy | Why |
|---|---|
| A still stands for the film | A capture of one moment is that moment of the film, so review by stills means something |
| Seeking works | The studio can jump to any shot, loop it and step frame by frame |
| Captures equal playback | The capture tool and the studio run the same modules at the same times |
| Transitions can bend time | The engine may hold a shot on one frame, freeze it or replay a slice of it (section 6) |
| Hot swap is safe | A module replaced while the studio is open shows the right picture at once |
| Sub-frame sampling is possible | An export may render the sub-frames of one frame out of time order |

The wall clock appears in one place, the playback loop of the studio, where it smooths the coarse clock of the audio element into a song time. Scenes never see it.

From practice: on the first film the same frame rendered in separate runs gave files that were equal byte for byte, and a search of the scenes folder for clock and random calls found none. Run both checks on a new film before any real shot is built.

## 2. The layers

| Layer | Owns | File in the starter |
|---|---|---|
| Project configuration | Title, music file, the compressed music the studio plays, frame rate, the size of the master format and of the other named formats, the frame step, the studio port, the page marker | `src/project-config.ts` |
| Audio data | Duration, beat times, downbeat times, shot boundaries in seconds, envelopes, drum onsets | `data/audio.json`, read by `src/engine/audio.ts`; musical positions in `src/engine/beat-cues.ts`. Written by the analysis of a track, by `scripts/make-click-grid.ts`, or by `scripts/make-score.ts` with a score composed in code |
| Sound written in code | The score, the sound effects of the picture (synthesised or recorded files placed by their peak), the voice-over and the mix, rendered offline to a WAV, on the score's own grid or over a measured track | `data/score.json`, `data/voice.json`, `src/sound/`, `scripts/make-score.ts`, `scripts/voice-sapi.ps1` (`sound-and-voice.md`) |
| Word timings | The words of a song or of a voice-over, with their times; the caption groups of a voice | `data/lyrics.json`, read by `src/engine/lyrics.ts` into `ctx.lyrics`. Optional |
| Shot data | The shot list in bars, the sections, the transition into each shot, the captions, every word | `shots.json` and `copy.json`, typed by `src/film.ts` |
| Timeline | One entry per shot and one overlay entry; which module plays each; transitions placed on the beat grid | `src/timeline.ts` |
| Scene modules | The picture of one shot | `src/scenes/<shot id>.ts`, private parts in `src/scenes/parts/` |
| Pictures from files | Photos, logos and screenshots as textures, clips as numbered image sequences, and the loads that a still waits for | `src/engine/media.ts`, the files in `media/` (section 4) |
| Storyboard card | The picture of every shot that has no module yet | `src/scenes/storyboard-card.ts` |
| Shared kit | Text zones, cameras, clocks in beats, grounds (sky, water, haze), type voices, type in motion, post presets, particles, devices and cards in space, passes on layers (blur, goo, liquid glass, difference), character rig, pixel layer | `src/scenes/parts/kit-frame.ts`, `kit-camera.ts`, `kit-ground.ts`, `kit-type.ts`, `kit-post.ts`, `kit-particles.ts`, `kit-devices.ts`, `kit-rig.ts`, `kit-pixel.ts` |
| Engine core | The renderer, loading, the frame object, preroll, compositing, sub-frame sampling, pixel readback | `src/engine/engine.ts`, `scene.ts`, `gl.ts`, `lines.ts`, `util.ts`, `palette.ts`, `type.ts`, `scale.ts`, `glsl/common.ts` |
| Post chain | The look of the finished frame | `src/engine/post.ts` |
| Transition pass | What happens to the picture around a cut | `src/engine/transition.ts` |
| Overlay | Type that belongs to no single shot, drawn over the finished picture; also the caption groups of a voice-over, at the foot of the frame | `src/scenes/overlay.ts` |
| Capture tool | Stills, contact sheets, frame time, the graphics probe, export, in any format of the film | `scripts/render.ts` |
| Studio page | Playback with the music, the shot list, seeking, hot swap, the click track of a film without music, the format switch, `window.seek` | `index.html`, `src/main.ts`, `src/click-track.ts`, `vite.config.ts` |
| Single-file build | The studio page as one HTML file that plays from disk, with its script, fonts, data, pictures and music packed in | `scripts/build-single.ts` (`bun run single`); `studio-viewer.md`, section 11 |

Two names in the starter differ from the terms of this skill. The `sections` list of the audio data holds one item per shot, and the shot data calls a section of the film a `group`; a numbered section is a group of kind `section`. The studio is started with `bun run studio`.

## 3. The scene contract

A shot is built as a scene module: a file whose default export is a class that extends `Scene` (`src/engine/scene.ts`).

```ts
export abstract class Scene {
  stateful = false;
  prerollMax = 6;
  handlesTransition = false;
  handlesPortal = false;
  constructor(protected ctx: SceneCtx) {}
  init(): Promise<void> | void {}
  reset(): void {}
  abstract render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides | void;
  dispose(): void {}
}
```

| Step | Called | Duty |
|---|---|---|
| Constructor and field initialisers | Once, when the entry is loaded | Create passes, layers and batches. The renderer already exists |
| `init()` | Once, before the first render. May be asynchronous | Load resources, integrate simulations into arrays, build caches that would otherwise cause a slow first frame |
| `render(f, out)` | For every frame, and for every sub-frame and preroll step | Overwrite or clear the whole of `out`, a half float target in linear light. Return the post settings the moment needs, or nothing. An overlay does the opposite: it draws over `out` and must not clear it |
| `reset()` | On a seek, for a stateful scene, before the preroll | Put the state back to that of the shot's start |
| `dispose()` | When the module is replaced by hot swap | Free textures, targets, materials and line batches |

A scene that throws in `init()` is listed in the engine's errors, and its entry is drawn as a dark red frame. A scene that throws in `render()` is logged to the console and draws the same dark red frame.

| Flag | Default | Effect |
|---|---|---|
| `stateful` | `false` | After a seek the engine calls `reset()`, then `render()` with `preroll: true` at every frame step from `max(start, t - prerollMax)` up to the time asked for |
| `prerollMax` | 6 | The longest history the engine simulates again, in seconds |
| `handlesTransition` | `false` | When timeline entries overlap, the engine does not crossfade; the scene composites `f.under` itself |
| `handlesPortal` | `false` | The scene plays its own part in a `zoom-in` or a `pull-out` and receives `f.portal`; the engine's stand-in is not played |

The context, `this.ctx`, holds what does not change from frame to frame: `renderer`, `audio` (the audio data), `lyrics` (word timings, empty when the film has none; with a voice-over, its caption groups), `comp` (the compositor), `W` and `H` (the logical size), `id` and `params` of the timeline entry, and its `start` and `end` in seconds.

The frame object, `f`:

| Field | Meaning | Unit |
|---|---|---|
| `t` | Song time of this render call | seconds |
| `dt` | The nominal step since the call before: the frame step in the studio and in captures, the spacing of sub-frames under sub-frame sampling, 0 after a seek and on a held frame. It is never measured from a clock | seconds |
| `lt` | Time since the start of the shot | seconds |
| `p` | Progress through the shot's window | 0 to 1 |
| `start`, `end` | The window of the entry | seconds of song time |
| `seeked` | True when time jumped. For a stateful scene it is false on the visible render, because the preroll has rebuilt the state | boolean |
| `preroll` | True while the engine fast-forwards a stateful scene. Skip work that only serves the picture | boolean |
| `beat` | Continuous beat index of the whole track, 0 at the first beat | beats |
| `bar` | Continuous bar index of the whole track, 0 at the first downbeat | bars |
| `beatPhase`, `barPhase` | The fractional parts of `beat` and `bar` | 0 to 1 |
| `a` | Audio features at `t`. Envelopes `rms`, `low`, `mid`, `high`, `vocal`, `drums`, `bass`, `other`; an envelope the data does not hold reads 0. Decaying pulses `kick`, `snare`, `hat`, `vonset`, 1 at a hit of full strength | 0 to 1 |
| `under` | While the entry overlaps the one before it: the picture of that entry. For an overlay: the finished picture, which is the target it draws into, so it must not be sampled while drawing. Otherwise null | texture |
| `tin` | Progress through the overlap with the entry before. 1 when there is none | 0 to 1 |
| `tout` | Progress through the overlap with the entry after. 0 when there is none | 0 to 1 |
| `portal` | For a scene with `handlesPortal`, during a `zoom-in` that leads out of it or a `pull-out` that leads into it: the picture of its neighbour, held still. Otherwise null | texture |
| `portalK` | Progress through that transition. Going in, the detail must fill the frame exactly at 1. Coming out, it fills the frame at 0 | 0 to 1 |

`beat` and `bar` count from the start of the track. A shot wants beats since its own start: the kit provides that clock (`sceneClock` for what moves, `frameClock` for what steps, in `src/scenes/parts/kit-frame.ts`).

The shape of a shot in the starter, `src/scenes/<shot id>.ts`, as its README gives it, with the 2D camera of the kit added:

```ts
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import { Ground } from './parts/kit-ground';
import { sceneClock, frameClock } from './parts/kit-frame';
import { camAt, applyCam } from './parts/kit-camera';
import { POST_DARK, TYPE_TINT } from './parts/kit-post';

export default class WaterColdKettle extends Scene {
  private ground = new Ground();
  private layer = new Layer2D();

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio } = this.ctx;
    const k = sceneClock(audio, f);   // beats since the shot began: for everything that moves
    const kf = frameClock(audio, f);  // the same at the output frame: for everything that steps
    this.ground.render(renderer, out, { colour: 'ink' });   // overwrites the whole target
    const c = this.layer.ctx;
    this.layer.clear();
    c.save();
    applyCam(c, camAt(k.beats, [/* { at, pose } keys */]));
    // ... draw in world coordinates, from k and kf only
    c.restore();
    comp.draw(renderer, this.layer.upload(), out, { tint: TYPE_TINT });
    return POST_DARK;
  }

  override dispose() { this.ground.dispose(); this.layer.dispose(); }
}
```

The file name must be exactly the shot id in `shots.json`, and the class name is free. `Layer2D.dispose()` frees the layer's upload and its sRGB copy together.

From practice: in the second film no scene set `stateful` or `handlesTransition`, and none read `f.a`. Every simulation was integrated in `init()`, every event was placed by the beat clock, and four scenes set `handlesPortal`. Treat the stateful path and the overlap path as less proven than the rest.

## 4. Drawing surfaces

Scenes lay out in logical pixels, `W` by `H`, origin at the top left, y down. `W` and `H` are the size of the format the page shows: the master format of the project configuration, or another named format chosen by the page parameter `format` (below, "Formats"). The page parameter `scale` multiplies the physical size of every target; layers, line batches and the shared shader code keep drawing in logical pixels.

| Surface | Made with | Use it for | What to know |
|---|---|---|---|
| 2D canvas layer | `Layer2D` (`src/engine/gl.ts`) | Type, flat drawings, interfaces, anything Canvas2D draws well | Call `clear()`, draw, then `upload()` once per frame. The upload sends the canvas as plain 8-bit bytes, and a small pass copies it into an 8-bit sRGB texture, which is decoded to linear light when sampled (section 11). A layer may be smaller than the frame, or have a lower backing scale for a soft glow. Every upload copies the whole canvas to the graphics card and runs that pass. `dispose()` frees both textures |
| GPU line batch | `LineBatch` (`src/engine/lines.ts`) | Thousands of anti-aliased segments a frame: line fields, hatching, wireframes, sparks, in pixels or in space with any camera | Capacity is fixed at creation and a segment past it is dropped without a message. Colour is linear and may exceed 1 to glow. Blend is `add`, `max` or `normal`. Width is in pixels, or in world units with `worldWidth`. `render()` does not clear the target |
| Full-screen shader pass | `FSPass` (`src/engine/gl.ts`) | Grounds, fields, spaces met by rays, print effects, anything worked out per pixel | The fragment is GLSL ES 3.0, reads `vUv`, writes `fragColor`. Noise, hashes, distance functions, hatching, the palette as `C_<NAME>` constants and `FRAG_PX` are prepended. It overwrites the target unless a blend is asked for |
| three.js scene | A target of the scene's own, `makeRT(W, H, { samples: 4 })` | Real models, lights and materials | The target handed to `render()` has no anti-aliasing. Clear the own target to alpha 0, render into it, then composite it with `premult: false`. Set colours in linear light from the palette |
| Compositor | `this.ctx.comp.draw(renderer, texture, target, options)` | Putting any texture over a target | Options are `mode`, `opacity`, `tint`, `scale`, `offset` and `premult` |
| Picture as a texture | `ImageTexture` and `drawPicture` (`src/engine/media.ts`) | A photo, a logo, a screenshot: on the GPU, in a rectangle, in a shader or on a three.js material | Load it in `init()`. It reaches the GPU by the same path as a canvas layer, with mipmaps. `drawPicture` fits it into a rectangle, with rounded corners and a slow push (below) |
| Picture on a canvas layer | `loadBitmap` and `drawImageFit` (`src/engine/media.ts`) on a `Layer2D` | A picture that is masked, clipped, rotated or mixed with drawn type | The canvas does the drawing; the layer's upload does the rest |
| Passes of the kit | `Blur`, `Liquid`, `Difference` (`src/scenes/parts/kit-post.ts`) | A soft copy of a layer, goo, liquid glass over the shot's picture, a difference blend | Each is one or more full-screen passes into targets of its own; `Liquid.glass` and `Difference` write the whole of their output, which must not be the target they read (`effects.md`, section 15) |
| Clip | `ImageSequence` (`src/engine/media.ts`) | Real footage, screen recordings, keyed characters, as numbered pictures, one file per frame | Frames load as they are needed. A still or an export frame waits for its frame; the studio shows the nearest loaded frame until the right one arrives |

| Blend mode | What reaches the target |
|---|---|
| `normal` | The source over what is there: source plus target times one minus source alpha |
| `add` | Source plus target. The alpha of the target is kept |
| `screen` | Source plus target times one minus source colour |
| `multiply` | Target times source colour. Give it a picture on a white ground; `premult` is off for this mode unless asked for |
| `max` | The larger of source and target, channel by channel. Overlapping strokes do not get brighter |
| `replace` | The source, with no blending |

Difference is not a blend mode of the compositor, because WebGL blending cannot take an absolute value. `Difference` of the kit does it as a pass.

three.js draws solid objects first and see-through objects afterwards, whatever order they were added in. A solid object inside a see-through one is hidden unless the inner object is marked see-through as well and `renderOrder` is set.

Two more three.js traps, from a trial film: `PMREMGenerator.fromScene(scene, sigma, near, far)` clips at a far plane of 100 units by default, so a larger environment room comes out black and metals are lit by point lights alone (pass a far plane that holds the room). And the kit's blur and depth of field (`Blur` in `kit-post.ts`) work on flat layers; a three.js scene that wants depth of field writes its own pass from the depth buffer, as the builder of that film did.

### Formats

One film folder can be looked at in several formats: 9:16, 1:1, 4:5 and 16:9 in the starter. The master format is `width`, `height` and `format` of `src/project-config.ts`; the others are named in `formats`. The master is the one the film is made and approved in; the others are views of the same shots at another size.

| Where | How a format is chosen |
|---|---|
| Studio | The page parameter `format`, for example `?format=16:9`. The Format button and the key `F` load the page again with the next format at the same time. Without the parameter the master is shown |
| Capture tool | `--format 16:9` in every mode. Stills go to `out/stills-16x9/`, a sheet gets `_16x9` in its name, an export `-16x9` |
| Single-file build | `bun run single -- --format 1:1` makes a page that opens in that format; its Format button still switches |
| Code | `OUTPUT` of `src/project-config.ts` is the format of the page (name, width, height); `W` and `H` of `src/engine/gl.ts` follow it. `FORMATS` lists them all and `formatSize(name)` gives one |

The format is decided when the page loads, because every render target takes its size then. What follows the format by itself: the canvas, the targets, the studio's picture, the headless viewport, `UNIT` (one pixel of a 1080-pixel short side), `camForRect`, and the zones of `src/scenes/parts/kit-frame.ts`. Each format has its own zone table there (`ZONE_TABLES`), written in pixels of its own reference frame; a format without a table takes the one whose shape is closest. `FORMAT` and `LANDSCAPE` in the kit tell a scene which format it is drawing.

What does not follow by itself: where a scene puts things. A scene laid out from the zones, `W`, `H`, `UNIT` and `camForRect` keeps working, but a composition made for a tall frame is rarely right in a wide one: in 9:16 the words sit under the subject, in 16:9 beside it. That layout is the builder's work, per format, with a still of each key moment in each format. Positions in the shot data are written in pixels of the master: the timeline carries a transition's `focus` over to the format shown in proportion to the frame (a point a third of the way across stays a third of the way across), and its letter `size` in proportion to the short side, as `UNIT` does (`src/timeline.ts`). A focus on a detail that a scene moves in another format has to be moved by the scene, which plays its own part with `handlesPortal`.

Formats are looked at one at a time, like every capture. There is no parallel export of several formats.

### Blending happens in linear light

Every target holds linear values, and layers are decoded to linear before they are blended. Blending therefore does not behave as it does in a drawing program, which blends the encoded values.

| Case | What happens | What to do |
|---|---|---|
| A nearly opaque dark plate over a light ground | The few percent of the ground that come through are a few percent of its light, which is a clearly visible grey once encoded for the screen | Make the plate fully opaque |
| Light added into a target that is composited afterwards | If the alpha of overlapping additive strokes adds up past 1, a `normal` composite of that target darkens what is under it | Keep the alpha of the target within 0 to 1. The line batch does this in `add` mode. Do the same in a material of your own |
| Additive strokes that cross | Brightness doubles at every crossing and passes the bloom threshold where no single stroke does | Use `max`, or put what must not glow in a batch of its own |
| A target that already holds colour times coverage | Multiplying by alpha a second time darkens every soft edge | Composite with `premult: false` |

### Pictures from files

Photos, logos, screenshots and clips live in `media/` of the film folder. The studio server serves that folder at `/media/` as it serves `audio/` and `data/`, and the single-file build packs it. A path in a scene is written relative to the film folder, for example `media/logo.png`.

| Part | What it does |
|---|---|
| `loadBitmap(path, maxSize)` | Fetches the file and decodes it once into an `ImageBitmap`, converted to sRGB by the browser whatever colour profile the file carries. `maxSize` (4096 by default) scales a larger picture down with high quality, so a camera photo does not fill the graphics memory |
| `ImageTexture` | `await this.logo.load('media/logo.png')` in `init()`, which the engine awaits. `texture` is an 8-bit sRGB texture with mipmaps, the top of the picture at v = 1; `width`, `height` and `aspect` are its size in pixels. `set(picture)` uploads a picture that is already decoded, such as a clip frame |
| `drawPicture(renderer, texture, [w, h], out, rect, style)` | Draws the texture into a rectangle of logical pixels, over what is in `out`. `fit` is `cover` (the default: it fills the rectangle and the overflow is cut off), `contain` or `stretch`; `align` places it; `zoom` with `focus` pushes in on a point of the picture; `radius` rounds the corners; `opacity` and `tint` work as for the compositor. The edge is soft by one physical pixel |
| `drawImageFit(ctx, picture, rect, placement)` | The same fitting on a canvas context. Clip the context first for any mask |
| `placePicture(w, h, rect, placement)` | The arithmetic both use: where the picture lands and which part of it shows |
| `ImageSequence({ pattern, count, fps })` | A clip as numbered files: `media/run/%04d.jpg` reads `0001.jpg` onwards. `frameAt(s)` gives the picture of the frame at `s` seconds into the clip, holding the first frame before it and the last after it; `textureAt(s)` gives it as a texture, uploaded only when the frame changes. Frames ahead are loaded early (`ahead`, 12 by default) and frames far away are released (`keep`, 48). `index(s)` is the frame number, for a label that says which frame is showing |
| `track`, `mediaPending`, `mediaSettled` | Every load is tracked. `Engine.renderSettled(t)` draws the frame, waits while a load is pending, and draws the same time again as a seek. `window.__render.still`, `window.seek` and the export stream go through it, so a still or an exported frame shows the clip frame of its own time, never one that was still loading |

The sRGB handling is that of the 2D layers: the picture is uploaded as plain 8-bit bytes (`plainTexture`) and copied into an 8-bit sRGB target in linear light by `copyToSRGB` in `src/engine/gl.ts`, the pass that `Layer2D` uses. A picture is never uploaded straight into an sRGB texture, the slow path of Chrome on Windows (section 11). Alpha stays straight, as for layers, so a logo with a soft edge has no dark fringe when it is composited.

Where a clip starts is the scene's choice: `this.clip.frameAt(f.t - f.start)` starts it with the shot; a clip that should land on a beat starts at `sceneTime(audio, f, beats)`. A clip at 30 frames a second in a film at 60 shows each of its frames for two output frames. Under sub-frame sampling a shutter that straddles two clip frames blends them, as a camera would.

**Extracting the frames of a video.** A clip is turned into numbered pictures once, with ffmpeg. Decoding a video is a heavy run: run it only with the owner's word, like an export, and keep the span short. The commands, from the film folder:

```sh
# 3 seconds from 12.0 s of the source, 30 frames a second, 1280 px wide, JPEG of good quality
ffmpeg -ss 12.0 -t 3.0 -i source.mp4 -vf "fps=30,scale=1280:-2:flags=lanczos:in_color_matrix=bt709" -q:v 3 media/run/%04d.jpg
# with transparency (a keyed character from a ProRes 4444 or a WebM with alpha): PNG
ffmpeg -i character.mov -vf "fps=30,scale=720:-2:flags=lanczos" media/char/%04d.png
```

The count of the sequence is the number of files written. `in_color_matrix=bt709` converts the colours of HD video to RGB with the matrix of HD video; left to itself ffmpeg may use the older matrix and shift reds and greens a little. JPEG at `-q:v 3` costs roughly 100 to 200 kilobytes a frame at 1280 pixels, so three seconds at 30 frames are 10 to 20 megabytes. Keep clips short and small, all the more for the single-file build, which packs every file of `media/`. None of these commands has been run for the skill.

**A video element decoded on seek (not built).** The other way to show a clip is a `<video>` element: for each frame, set `currentTime` to the middle of the clip frame wanted, wait for its `seeked` event and for `requestVideoFrameCallback`, then upload the element as a texture. It needs no extraction and keeps the files small, but it is not exact. A seek lands on the frame the decoder chooses, which can differ between browsers and between hardware and software decoding; a file with sparse keyframes is decoded from the last keyframe on every seek, which is slow; Safari is stricter about seeking in a file it has not fully loaded. Encoding the clip with every frame a keyframe (`-g 1`) brings it closer to exact and makes it much larger. It was not built, because the image sequence is simple and exact and every frame it shows can be checked with a still. Build it only when the clips are too long to extract, and check it with stills at the times of clip-frame boundaries.

## 5. The timeline

`makeTimeline` (`src/timeline.ts`) is called once, after the audio data has loaded, and returns the entries the engine plays.

1. The shot list is written in bars. A build script checks it and writes each shot's start and end in seconds into the audio data, using the beat grid (`scripts/build-shot-files.py`, also `bun run shots`). Shots follow each other without a gap or an overlap.
2. Each item of that list becomes one entry. Its id is the shot id in lower case. The first entry is stretched back to time 0 and the last forward to the end of the track.
3. Scene modules are found by file name: `src/scenes/<shot id>.ts`. When the file exists the entry plays it. When it does not, the entry plays the storyboard card, which reads the shot's description from the shot data by the entry's id, prints it, and marks the beats of the shot as they pass. The whole film can be played with the music before any shot is built.
4. The transition into the shot, if the shot data names one, is placed on the beat grid and stored on the entry (section 6).
5. One overlay entry is added that runs the whole length of the film.

| Entry field | Meaning |
|---|---|
| `id` | The shot id. Also what `--only` of the capture tool names |
| `file` | The module that plays the entry. Several entries may share one module; hot swap finds them by this field |
| `load` | The lazy loader of the module. A missing or broken module never breaks the build |
| `start`, `end` | The window, in seconds of song time |
| `post` | Post settings for the entry. The scene's own returned settings win over them |
| `params` | Free values handed to the scene as `ctx.params` |
| `maxSamples` | A cap on adaptive sub-frame sampling while the entry is on screen. Export only |
| `overlay` | Marks an overlay entry |
| `into` | The transition that leads into the entry |

An overlay entry is drawn after every other entry and after the transition pass, over the finished picture. It takes no part in transitions: the pass never bends it. The post chain runs after it, so shake, zoom, flash, inversion and colour fringing reach overlay type along with the rest of the frame. An overlay may return post settings; they are applied last.

When two entries that are not overlays overlap in time, the engine crossfades from the earlier to the later over the overlap, unless the later scene sets `handlesTransition`. The starter's timeline makes no overlapping entries: its cuts are hard cuts on a beat, and everything around a cut is the work of the transition pass.

Only files directly in `src/scenes/` are scene modules. Files that scenes share or are split into live in `src/scenes/parts/`. A helper placed directly in `src/scenes/` counts as imported by the timeline, and saving it reloads the whole studio page.

## 6. The transition pass

This section is the mechanism. The kinds, and when to use each, are in `transitions.md`.

A transition belongs to the shot it leads into. The shot data gives its kind, a lead and a tail in beats, and optionally a focus point in logical pixels of the master format (carried over to another format in proportion, section 4, "Formats"), a direction, a fill colour (`colour`, a palette key, for `dip`, `cover` and `flood`), and the letters and size for the kind that goes through a letter. The timeline turns that into three song times: the cut is the start of the shot, the lead begins `lead` beats before the cut, the tail ends `tail` beats after it, all read from the beat grid.

| Part | How it works |
|---|---|
| The window | For any time from the start of the lead to the end of the tail, with both shots loaded, the engine takes the transition path instead of the normal one |
| The two pictures | The outgoing shot is drawn into one target and the incoming shot into another. Kinds that show both shots draw both on every frame of the window; the other kinds draw only the shot that is playing |
| The held frame | After the cut the outgoing shot is held on its last frame, one frame step before the cut. Before the cut the incoming shot is held on its first frame. A scene is only ever asked for a time inside its own window |
| Progress | The pass receives beats from the cut, progress through the lead, through the tail and through the whole window, whether the cut has passed, the frame number, the focus and the direction |
| Time warps | A shot is a function of time, so the engine may ask the outgoing shot for any time of its own. One kind replays the first moments of the lead in slices that halve with each beat. The kinds that lead into a drop freeze the outgoing shot for the last quarter beat before the cut |
| The pass | One full-screen shader reads the two pictures and writes the finished frame. It keeps no state between frames |
| Fill colour | `dip`, `cover` and `flood` fill the frame with the palette colour of `colour` in the shot data (default ink for a dip, signal for the others). The timeline passes it on; an unknown key falls back to the default |
| Post settings | On top of what the playing shot asked for, the transition multiplies the zoom, adds to the shake and to the colour fringing, takes the larger flash, and sets the inversion. Four kinds are nothing but such a change and do not run the pass |
| The portal | For a `zoom-in`, during the lead, an outgoing scene with `handlesPortal` receives the first frame of the next shot as `f.portal`. For a `pull-out`, during the tail, an incoming scene with `handlesPortal` receives the last frame of the shot before. `f.portalK` runs from 0 to 1. The scene shows the texture on the detail and drives its camera; its picture is the frame and the pass is not run |
| Stand-ins | Until a scene sets `handlesPortal`, the pass zooms between the two finished pictures. A transition is marked as a stand-in while either shot is still a storyboard card. Then a camera journey between two shots is played as a whip, and a match of shapes as a small punch. Between two built shots the engine does nothing for those two kinds: the cut is theirs |

How a Canvas2D shot shows the portal, as one builder did it on a trial film: the neighbour's frame is a texture of the whole frame, so map it so that the detail of the neighbour lands on the detail of this shot. With `s` the ratio of the two sizes of the detail on screen and `(tx, ty)` the shift, first clear the target to the ground colour, then `comp.draw(renderer, f.portal, out, { mode: 'replace', scale: [1 / s, 1 / s], offset: [-(vx - 0.5) / s, -(vy - 0.5) / s], premult: false })`, where `(vx, vy)` is the mapped frame's centre in texture coordinates (y up). Then draw this shot's own layer over it with a hole where the portal shows. At the cut the map is the identity, so the hand-over is exact.

Three consequences for the lead:

- A held frame is not cached. The held shot is drawn again on every frame of the window, with `dt` 0 and `seeked` true, so a transition that shows both shots costs two shots for as long as it lasts. A stateful scene would be reset and prerolled on each of those frames.
- A builder must know the lead of the next shot's transition and the tail of their own. The last beats of a shot play under the lead, and the first beats arrive under the tail. What matters in the shot has to fit between them.
- A capture plays a transition only when the shots on both sides of the cut are loaded. With `--only` naming one of them, the cut is shown plain.

## 7. The post chain

The post chain (`src/engine/post.ts`) takes the composited frame in linear light and writes the 8-bit frame that is shown. The settings are rebuilt on every frame, so nothing carries over from the frame before.

| Setting | What it does | Engine default | Dark ground | Light ground |
|---|---|---|---|---|
| `exposure` | Multiplies the frame before the tone shoulder | 1 | | |
| `bloom` | Strength of the glow round bright values | 0.55 | 0.7 | 0 |
| `bloomThreshold` | Linear brightness round which bloom sets in | 0.85 | 1.0 | 4 |
| `bloomKnee` | Softness of that start: bloom begins at the threshold minus the knee | 0.5 | 0.2 | 0.2 |
| `bloomRadius` | Spread of the glow, 0 to 1 | 0.75 | 0.75 | 0.75 |
| `halation` | Red-orange halo round highlights, as on film | 0.25 | 0.25 | 0 |
| `ca` | Colour fringing, in pixels at the edge of the frame | 1.2 | 0.4 | 0.25 |
| `grain` | Film grain, strongest in the mid tones | 0.055 | 0.045 | 0.05 |
| `vignette` | Darkening towards the corners, 0 to 1 | 0.35 | 0.4 | 0.18 |
| `fade` | Fade to black, 0 to 1 | 0 | | |
| `flash` | Adds the palette colour `fg` to the whole frame | 0 | | |
| `shake` | Moves the frame, in pixels | `[0, 0]` | | |
| `zoom` | Magnifies the frame about its centre | 1 | | |
| `invert` | Turns dark into light and light into dark, 0 to 1 | 0 | | |
| `hue` | Turns every colour round the colour wheel, in radians; grey stays grey | 0 | | |
| `kaleido` | Number of mirrored sectors round the centre, 0 off; `kaleidoTurn` turns them | 0 | | |
| `fisheye` | -1 to 0.9: above 0 the middle of the frame swells, below 0 it pinches | 0 | | |
| `bulge` | -1 to 0.9: a lens inside `bulgeRadius` round `bulgeAt` (defaults 240 px and the frame centre) | 0 | | |
| `mosaic` | Cell size in pixels, 0 off | 0 | | |
| `glitch` | 0 to 1: bands of the frame torn sideways, changing every other frame | 0 | | |
| `crt` | 0 to 1: curved glass, scanlines, a phosphor mask, dark corners | 0 | | |
| `tone` | 1: the tone shoulder; 0: off, so flat colours come out exactly as the palette gives them (the shoulder darkens a light paper by a few levels) | 1 | | |
| `dither` | 1: a dither of one level that changes every frame, against banding; 0: off. With `grain` 0 and `dither` 0, two held frames are identical | 1 | | |

A flat colour that must come out exactly as the palette gives it (a brand colour, a piece matched to a design): composite the layer with `mode: 'replace'` and no tint, and return `{ tone: 0, dither: 0, grain: 0, bloom: 0, halation: 0, ca: 0, vignette: 0 }`, the seven settings that are on by default (the starter README, Adding a scene module). This is a tool for when the piece wants it, not a default: most films want the finish.

The two presets are `POST_DARK` and `POST_LIGHT` in `src/scenes/parts/kit-post.ts`. An empty cell means the preset leaves the engine default. Pixel art returns `POST_PIXEL` from `src/scenes/parts/kit-pixel.ts`, which turns the finish off.

The order inside the chain is fixed: zoom and shake, kaleidoscope, fisheye, bulge, CRT curvature, mosaic and glitch tearing (these move where a pixel looks, and bloom moves with them), colour fringing with the glitch's split, bloom and halation added, exposure, hue rotation, the tone shoulder, inversion, flash, vignette, fade, the CRT's scanlines, mask and corners, encoding for the screen, grain, dither. The tone shoulder leaves values below 0.72 as they are, bends brighter values towards 1, and pulls very bright values towards white.

Settings are merged in this order, later ones winning: the engine defaults, the `post` of the timeline entry, what the scene returned from `render()`, the change a transition makes, what an overlay returned. A scene overrides per frame by returning an object with only the settings its moment needs:

```ts
return { ...POST_DARK, bloom: 0.85, shake: [shx, shy], zoom: 1 + 0.03 * hit(k.beats, NAME, 0.3) };
```

### Type stays under the bloom threshold

Bloom measures a pixel by its largest channel and begins at `bloomThreshold` minus `bloomKnee`, which is 0.8 with the dark preset. Type and outlines must stay below that value. Only what is meant to glow is drawn above 1 in linear light. A light type colour can sit above 0.8 by itself, so the kit gives a tint, `TYPE_TINT`, to composite type layers with over a dark ground. On a light ground the preset puts the threshold at 4 and the strength at 0: nothing glows.

From practice: on the first film light type came out with an orange glow in the first stills. The fix was a threshold of 1.0 and a tint that lowers the type layer. Both went into the kit, not into each shot.

## 8. The capture tool

`scripts/render.ts` drives the app in a headless browser through its export page (`?export=1`) and the interface that page publishes as `window.__render`. It is run with `bun`, from the film folder.

```sh
bun scripts/render.ts stills --t 1.5,23,40.2 [--only id1,id2] [--out dir]
bun scripts/render.ts stills --beats 116,117.5,119 --only <shot id>
bun scripts/render.ts sheet --from 20 --to 35 [--n 12] [--cols 4] [--only ids] [--out file.png]
bun scripts/render.ts sheet --cuts --cols 4
bun scripts/render.ts perf --from 20 --to 25 [--only ids]
bun scripts/render.ts gpu
bun scripts/render.ts stills --format 16:9 --t 5,18.2                      # another format of the film
bun scripts/render.ts stills --page out/single/<title>.html --t 5         # the single-file build, from disk
```

| Mode | Gives |
|---|---|
| `stills` | One image per time asked for, at full size, named by its time |
| `sheet` | A contact sheet: thumbnails of 480 pixels on the long side, each labelled with its time. Times are spread evenly between `--from` and `--to`, or listed with `--times`, or taken round every cut with `--cuts` (two frames before each cut and two after) |
| `perf` | The frame time over a span: number of frames, average, median, 95th percentile, maximum |
| `gpu` | The name of the graphics renderer the headless browser uses |
| `video` | An export to a video file. Refused unless the owner asked (see below) |

| Option | Modes | Meaning |
|---|---|---|
| `--t` | stills | Times in seconds, separated by commas |
| `--frames` | stills, sheet | Output frame numbers. Frame n is at n divided by the frame rate |
| `--beats` | stills, sheet | Beat indices of the whole track, 0 at the first beat. Fractions are allowed |
| `--exact` | stills, sheet | Render the time as given, without moving it to a frame |
| `--only` | all | Ids of the shots to load. The overlay is always loaded. A shot that is not loaded is drawn dark red |
| `--out` | stills, sheet, video | Folder for stills, file for a sheet or a video. The default is inside `out/` |
| `--from`, `--to` | sheet, perf, video | The span, in seconds |
| `--n`, `--cols` | sheet | Number of thumbnails, and thumbnails in a row |
| `--scale` | all | Render at a whole multiple of the configured size |
| `--format` | all | One of the formats of `src/project-config.ts`; the master when left out. An unknown name stops the tool before a browser starts |
| `--page` | all | Capture this single-file build from disk instead of a server. The page is opened as a file; no server is started |
| `--url` | all | Use the server at this address, for example the studio, instead of a private server. It is an error if this film does not answer there |
| `--angle` | all | The graphics backend of Chrome: `metal`, `d3d11`, `gl`, `vulkan`, `swiftshader` or `default`. Without it the tool picks one by system (section 11) |
| `--headed` | all | Show the browser window |
| `--samples`, `--shutter`, `--min-samples`, `--max-samples`, `--tol` | stills, perf, video | Sub-frame sampling: each frame is the average of several sub-frames spread over a share of the frame step, which multiplies the load by their number. `--samples auto` picks 4, 12, 36, 108 or 324 per frame and cannot run a stateful scene |

**Video export.** The mode exists: frames are streamed to an encoder, and the music is added. The tool exits with code 2 unless the environment variable `OWNER_ASKED_FOR_VIDEO` is `yes`. The lead sets that variable only when the owner has asked for a video file in the current conversation. The tool does not refuse sub-frame sampling in the other modes; treat it as part of export and leave it at one sample for review.

**Pictures are waited for.** `still` and the export stream draw each frame through `renderSettled`, which waits for photos and clip frames that are still loading and draws the frame again (section 4). `sheet` waits the same way. `perf` does not: it measures drawing, and a clip frame that is not loaded yet is drawn from the nearest one.

**The lock.** Captures run one at a time for the whole repository, whoever starts them. The lock is a folder, `.render.lock`, that holds the process id of its owner. A second run waits and tries again every half second. A lock whose owner is no longer running is cleared. A run that has waited 15 minutes gives up. The lock is released when the run ends or is interrupted. The tool finds the folder for the lock by walking up from the film folder (`lockHome` in `scripts/render.ts`): the folder named by the environment variable `RENDER_LOCK_DIR` when it is set, or else the nearest folder above that holds `.git`, or else the nearest that holds `CLAUDE.md` or `AGENTS.md`, or else the temporary folder of the system. Every film under one repository shares the lock, however deep its folder sits.

**The server.** By default the tool starts a private development server on a port chosen between 5300 and 5799, as one `node` process running Vite, with live reload switched off (`RENDER_NO_HMR=1`) so that a file saved during a capture cannot reload the page, and stops it when the run ends or is interrupted. The browser is closed in the same step. With `--url` it uses the server at that address instead, the studio for example, only if the page carries this film's marker: a `meta` element named `render-app` whose value is `appMarker()` of `src/project-config.ts`, which holds the film's title. If this film does not answer there, the tool stops with an error that names the film that does. The studio has live reload on, so do not save files while a capture runs on it.

**Times snap to frames.** In `stills`, every time is moved to the nearest output frame, because those are the only times the film is ever played at in an export, and a time between two frames can print a stepped value twice. When the time asked for is the first beat of a shot and the nearest frame falls in the shot before, the next frame is taken. `--frames` is exact by definition. `sheet` snaps its times the same way. With `--exact` both render the times as given: the studio plays between frames, so a fault that shows only off the grid is found this way (`quality-gates.md`, the motion check). `sheet` always renders one sample.

**What the frame time includes.** `perf` measures, for every frame of the span, the render of the frame, the wait for the graphics card to finish, and the read of the finished pixels back into memory, as an export would do. It does not include drawing to the screen. The read costs several milliseconds by itself, so the figure is an upper bound on what the studio pays. Measure an almost empty shot on the same machine to learn the fixed part.

The tool prints scene errors and the browser's console errors, page errors and failed requests after every run. Read them before looking at the image.

### Export settings, sizes, and checks of a video file

Nothing in this part has been run for the skill: the owner's rule forbids exports unless the owner asks for a video file in the current conversation. It describes what `video` does and what to run once the owner has asked.

| Setting of `video` | Value | Flag to change it |
|---|---|---|
| Frames | Raw RGBA from the page, `PROJECT.fps`, the size of the format times `--scale`, flipped upright by the encoder | `--format`, `--scale`, `--from`, `--to` |
| Encoder | H.264 (`libx264`), `-preset slow`, `-crf 16`, `-tune grain`, `-x264-params aq-mode=3`, `yuv420p` | `--crf`, `--preset`, `--x264`, `--threads` |
| Colour | Converted with the BT.709 matrix to limited range, and tagged as BT.709 (`-colorspace`, `-color_primaries`, `-color_trc`, `-color_range tv`) | none |
| Sound | `audioFile` of the project configuration from `--from` for the length of the span, AAC at 320 kbit/s, `-shortest` | `--noaudio` |
| File | `-movflags +faststart`, `out/<title>.mp4` (`-<format>` added for a format other than the master) | `--out` |
| Motion blur | Sub-frames averaged in the page before encoding | `--samples`, `--shutter` |

CRF 16 with the grain tuning is a master: close to transparent and large, often 20 to 60 megabytes a minute at 1080 by 1920 and 60 frames a second, much more for a grainy, busy film. A prompt that asks for "under 30 MB", for 720p, or for a size a platform accepts is met by a second encode from that master, not by rendering again:

```sh
# a size target: bitrate = size in bits / duration, less the sound, with a few per cent of margin
#   30 MB over 45 s with 128 kbit/s of sound: 30*8*1000/45 * 0.96 - 128 = about 4990 kbit/s
ffmpeg -y -i out/film.mp4 -c:v libx264 -preset slow -b:v 4990k -pass 1 -an -f null NUL      # /dev/null on macOS and Linux
ffmpeg -y -i out/film.mp4 -c:v libx264 -preset slow -b:v 4990k -pass 2 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 128k -movflags +faststart out/film-30mb.mp4
# 720p from a 1080p master (1280 x 720 for 16:9, 720 x 1280 for 9:16), by quality instead of size
ffmpeg -y -i out/film.mp4 -vf "scale=1280:720:flags=lanczos" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 160k -movflags +faststart out/film-720p.mp4
```

Two passes hit a size within a few per cent; one pass with `-b:v` alone can miss it. A size that forces a low bitrate shows first on grain and on fine lines: lower `grain` in the post settings for that version rather than let the encoder smear it. Every encode is a heavy run and needs the owner's word like the export itself.

Checks on an exported file. Each reads the whole file, so run them once, after the export, one at a time:

| Check | Command | Pass |
|---|---|---|
| Frame count and rate | `ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,r_frame_rate,avg_frame_rate,width,height -of default=nw=1 out/film.mp4` | `nb_read_frames` equals `round(to * fps) - round(from * fps)`; both rates are the film's `fps`; the size is the format's times `--scale` |
| Exact duration, picture and sound | `ffprobe -v error -show_entries stream=codec_type,duration:format=duration -of default=nw=1 out/film.mp4` | The video stream lasts frames divided by `fps`. The sound is no longer than the picture (the tool passes `-shortest`) and no more than one frame shorter |
| Even timestamps | `ffprobe -v error -select_streams v:0 -show_entries packet=pts_time -of csv=p=0 out/film.mp4 \| sort -n \| awk 'NR>1{d=$1-p; if (d<0.99/F \|\| d>1.01/F) n++} {p=$1} END{print n+0}' F=60` | Prints 0: every step between two frames is one frame. Replace 60 by the film's `fps` |
| Single-frame pops | `ffmpeg -i out/film.mp4 -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=out/diff.txt" -an -f null -` | In `out/diff.txt`, a frame whose difference to the frame before is more than three times that of both its neighbours, on a frame that is not a cut, is a pop: one frame drawn from the wrong state. Take a still of it and of the frames on either side |

A pop found this way is fixed in the scene, then checked with stills of those three frames, not with another export.

## 9. The studio page

| Feature | How |
|---|---|
| Playback | The page plays the compressed music and asks the engine for the frame at the song time of the audio element |
| Shot list | Every shot in order, grouped by section, with its start time and whether it is built or still a card. A click jumps to the shot. The page counts the built shots |
| Keys | Space plays and stops. `[` and `]` step between shots. The arrow keys move one second, five with shift. `,` and `.` move one frame. `L` loops the shot. `M` switches between versions of the music, then the click of the beat grid, then silence |
| Readout | Song time, bar, beat, and the frame rate while playing |
| Page parameters | `t` starts at a time in seconds. `only` loads the named shots. `scale` multiplies the output size. `format` shows another format of the film (section 4, "Formats"). `export` turns the page into the export page |
| Format switch | The Format button and the key `F` load the page again in the next format, at the same time |
| `window.seek(t)` | Draws the frame of song time `t` and resolves when it is on the canvas with every picture loaded. In the studio it also pauses the player there. On the export page it is `window.__render.still(t)` without a return value. `window.duration` is the length of the film. This is the function that prompts asking for "a `seek(t)` function" mean; the capture tool uses `window.__render`, which has more members |
| Hot swap | A saved scene module is imported again and every entry that plays it is rebuilt from it. The page keeps its position. A saved file in `src/scenes/parts/` reaches the scenes that import it |
| Errors | Scenes that failed to load are listed at the top of the page |

A paused page draws nothing until the time changes, or until a picture it was waiting for has arrived. The studio needs the development server (`bun run studio`, on `studioPort` of `src/project-config.ts`, 5180 in the starter). Stop the server when the viewing is over. The single-file build (`bun run single`) is the same page without a server, for handing the film over (`studio-viewer.md`, section 11).

## 10. Performance budget

The studio plays in real time, so the frame step is the ceiling: 16.7 milliseconds at 60 frames a second, for the shot, the overlay, the post chain and the browser together. The target given to builders is 8 milliseconds or less, as `perf` reports it.

From practice: on the machine the films were made on (Apple M4 Max, Chrome, 1080 by 1920, one sample) shots measured 7.3 to 12 milliseconds on average. An almost empty shot measured about 7.3, most of it the read of the pixels, so a shot's own cost was the difference: from a fraction of a millisecond to a few milliseconds. The frame rate of real playback in the studio was not measured on the owner's machines.

| What costs most | Measured or seen | Remedy |
|---|---|---|
| Canvas2D `shadowBlur` and canvas blur | One shot went from 13.1 to 9.4 milliseconds when the shadow was removed | Draw the soft shape once, or in a shader |
| Still parts drawn again on every frame | One shot measured 11.8 milliseconds before its still parts were cached | Draw them once into a canvas of their own and copy that |
| Large type moving under the camera on a full frame layer | The shots above the target had this in common | Cache lines of type as bitmaps |
| Locale formatting of numbers, several times a frame | One shot rose to 11 milliseconds | A plain formatter |
| A heavy shader at full resolution | One field of waves cost 3.5 milliseconds at full resolution and looked the same at half | A smaller target, composited up |
| Resources built on first use | First frames of 48, 90 and 178 milliseconds | Build them in `init()` |
| A transition that shows both shots | Two shots are drawn for every frame of the window | Keep leads and tails short |
| A layer upload on a slow path | See section 11, Windows | Measure on that machine |
| Sub-frame sampling and output scale | The load is multiplied by the number of sub-frames, or by the square of the scale | Export only |

The studio has no motion blur. A thing that should smear is drawn as a smear by the shot.

## 11. Portability

| Operating system | Graphics backend of the browser | Launch flag |
|---|---|---|
| macOS | Metal | `--use-angle=metal` |
| Windows | Direct3D 11 | `--use-angle=d3d11` |
| Linux | OpenGL, or Vulkan | `--use-angle=gl`, `--use-angle=vulkan` |
| Any, with no graphics card | Software rendering | `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` |
| Any | The first backend that starts | `--use-angle=default` |

The capture tool picks the flag by system (`angleArgs` in `scripts/render.ts`): `metal` on macOS, `d3d11` on Windows, `gl` on Linux. `--angle` names another backend, and `--angle swiftshader` passes the three flags of software rendering. The reference app passed `--use-angle=metal` on every system. On a new machine run the `gpu` mode first and read the name it prints. A name that contains SwiftShader means software rendering, and every frame time measured there is meaningless for playback. Under the Windows Subsystem for Linux, assume software rendering until the probe says otherwise. The tool launches the installed Google Chrome (`channel: 'chrome'`), which must be present.

| Gap | Effect | Rule |
|---|---|---|
| The capture tool uses Chrome; the owner may watch in Safari | A shot can be right in every capture and blank for the owner | Ask which browser the owner watches in before the first shot is built |
| Canvas `filter` is missing in the Safari the owner used | Setting it does nothing. The engine patches the property only where it exists | Scenes do not use `ctx.filter` |
| Canvas `letterSpacing` arrived in Safari 18.4 | Without it type is set tighter, with no error | A layout must not depend on it to fit |
| The WebKit that the browser automation installs is not Safari | It is closest to Safari on macOS, and differs most in media playback | Checking the film on WebKit does not replace the owner's look |
| Full float targets are not available everywhere | The engine uses them only for sub-frame sampling. Shot targets are half float | Keep a shot's own targets half float, which is what `makeRT` gives |

From practice: a shot was reported blank twice while captures were fine. The cause was the missing canvas `filter`: the engine patched the property without checking that it existed, and every layer with a scale other than 1 threw on `clear()`. The error was in the output of the development server all along, with the id of the scene. A stack with `@[native code]` frames is WebKit.

**The slow canvas upload on Windows.** The reference app uploaded each `Layer2D` canvas straight into an sRGB texture on every frame. In Chrome on Windows that upload can take a slow path; the browser's issue tracker ties it to the Direct3D 11 backend. The starter uploads the canvas as plain 8-bit bytes, with no colour conversion and no flip, and a small pass (`LAYER_COPY_FRAG` in `src/engine/gl.ts`) reads it texel for texel, turns the values into linear light, flips the rows and writes an 8-bit sRGB target that scenes sample as before. The interface of `Layer2D` did not change. A slow frame on one machine is no evidence about another, so measure on the machine in question, and compare against another backend before changing code.

From practice: on macOS with Metal the sRGB upload of a full frame measured 0.5 milliseconds, the same as a plain upload. On the owner's Windows machine it was slow, and a fix of the same idea was made there. The starter's copy pass was written from that description; it was not taken from the Windows machine, and it has not yet been compared with it or measured on Windows. Until it has, check it on the first Windows run: compare a still of the same moment on macOS and on Windows. The copy must turn the values into linear light or every layer comes out too bright, the picture must not be upside down, and soft edges on a see-through layer must have no fringe. Then measure the frame time of a shot with a full frame layer on both.

**The music and the data folders.** The reference app reached `audio/` and `data/` through symbolic links in `public/`. Links are lost by a copy through a disk formatted as exFAT or FAT and by an archive that holds no links, need Developer Mode or an elevated shell to be made on Windows, and may be checked out by git as small text files; a lost link made the server answer the request for the data with the page itself. The starter has no links. The plugin `filmFolders` in `vite.config.ts` serves the two folders of the film folder at `/audio/` and `/data/`, answers byte ranges so that the audio element can seek, and answers 404 for a missing file (204 for a file the page asks for as optional, such as lyrics). The app stops with `no audio analysis data found` only when `data/audio.json` really is missing.

## 12. Starting a new film on this engine

Each film has its own folder with its own copy of the engine. A delivered film stays frozen with the engine that drew it.

| Do | What | Notes |
|---|---|---|
| Copy | The whole of `assets/starter/`, to the film's own place | Run `sh scripts/clean.sh` in a film folder before it is copied or shipped: it removes the installed packages, `out/`, the build caches and `analysis/python-env`. Then `bun install` in the new place |
| Leave unchanged | `src/engine/` with its licence file, `vite.config.ts`, `package.json`, both `tsconfig` files, `public/fonts/stroke/`, `src/scenes/parts/kit-camera.ts`, `src/click-track.ts`, `scripts/make-click-grid.ts`, `scripts/build-single.ts` | The engine loads the stroke font at start, so the file must be there. `vite.config.ts` carries the scene hot swap, the page marker, the serving of `audio/`, `data/` and `media/`, `server.forwardConsole`, and the settings of the single-file build |
| Check | `scripts/render.ts` | Nothing in it names a film, a folder depth or a system: the lock is found by walking up, the graphics backend is chosen by system, and the port and the marker come from the project configuration. Check only that the refusal of video export is still in place |
| Configure | `src/project-config.ts` | `title`, `audioFile`, `studioAudio`, `fps`, `width`, `height` and `format` (the master format), `formats` (the other formats the film may be looked at in), `studioPort`. Nothing else in the app states a size or a rate. The title names the film in the page marker. Give each film on one machine its own port |
| Configure | `src/engine/palette.ts` | The engine itself reads `bg`, `fg`, `ink`, `paper`, `signal` and `blush`. Keep those keys and change their colours. The kit reads more |
| Configure | The font list at the top of `src/engine/type.ts`, and `public/fonts/` | Static font files with their licences. The transition through a letter uses the display voice. Check that every face holds the characters of the film's language |
| Configure | `src/scenes/parts/kit-frame.ts` | The text zones of each format, in `ZONE_TABLES`, each in pixels of its own reference frame and scaled to the size of the format. Tune them to the platform the film is shown on. The clocks assume four beats to a bar |
| Gather | `media/` | Photos, logos, screenshots and clip frames that the film shows (section 4). Record where each came from and under what licence |
| Configure | `src/scenes/parts/kit-post.ts`, `kit-ground.ts`, `kit-type.ts` | The two post presets, the grounds, the type voices: the treatment turned into code |
| Produce | `data/audio.json` | A synthetic grid first (`bun run make-grid -- --bpm 120 --bars 24`), then a measured one from the music with the scripts in `analysis/`, or the exact grid of a score composed in code (`bun run score`, `sound-and-voice.md`). Shot boundaries are written from the shot list by the build script, which runs last because the analysis and the score rewrite the file |
| Write | `shots.json`, `copy.json` | The shot list and the words. `bun run shots` checks both, and only when every check passes writes `STORYBOARD.md`, `data/film-sections.json` and the shot times in `data/audio.json`. The types in `src/film.ts` change only when the schema changes |
| Adapt when needed | `src/timeline.ts`, `src/scenes/storyboard-card.ts`, `src/scenes/overlay.ts`, `src/main.ts`, `index.html` | All five read the shot data or the project configuration, and none names a film. The labels of the studio are in English; translate them for an owner who reads another language |
| Write | `src/scenes/<shot id>.ts` | The shots, by builders. The lead does not write them |

```
<film folder>/            a copy of assets/starter/
  package.json  bun.lock  vite.config.ts  tsconfig.json  tsconfig.scripts.json  index.html
  shots.json              the shot list, in bars
  copy.json               every word on screen
  STORYBOARD.md           generated from shots.json and copy.json
  audio/                  the music, and compressed copies for the studio; audio/score.wav and audio/voice/ when the sound is written in code
  media/                  photos, logos, screenshots, clips as numbered pictures (optional)
  data/audio.json         beat grid, shot boundaries, onsets
  data/score.json  data/voice.json   the score and the voice-over as data (optional)
  data/film-sections.json generated: shot boundaries in bars, for a new analysis of the music
  analysis/               the music analysis in Python; analysis/python-env/ is made on each machine
  scripts/render.ts  build-single.ts  make-click-grid.ts  build-shot-files.py  clean.sh  make-score.ts  voice-sapi.ps1
  public/fonts/
  src/project-config.ts  film.ts  timeline.ts  main.ts  click-track.ts
  src/engine/
  src/sound/              the score, the instruments, the mix, the voice (sound-and-voice.md)
  src/scenes/<shot id>.ts  storyboard-card.ts  overlay.ts
  src/scenes/parts/kit-*.ts
  out/                    captures and the single-file build; not kept, not copied
```

Prove the path before any real shot is built: the same frame twice gives the same file, a shape blinks on the beat at the start and at the end of the track, a sentence with every accent of the language renders in every voice, the size and rate change in one place, the studio plays the whole film as cards, and, when the film will be handed over as one file, `bun run single` builds and a still taken from that file with `--page` equals the same still taken from the studio.

## 13. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| A dark red frame | The shot was not loaded (`--only` named others), or its scene threw | Read the scene errors the tool prints. Name the shot in `--only` |
| A built shot is still played as a card | The file name is not the shot id, the file sits in `parts/`, or it has no default class | Name the file exactly as the id in the shot data |
| A capture shows a plain cut where a transition is due | Only one side of the cut was loaded | Name both shots in `--only` |
| A counter prints two values at once | The time lies between two frames, or a stepped value was read from the sample time | Let stills snap to frames. Read stepped values from the frame clock |
| Type glows | Its brightest channel is above the start of bloom | Composite type with the kit's tint. Keep the dark preset's threshold |
| A thing glows where strokes cross, and nowhere else | Additive blending adds up | `max` blend, or a batch of its own |
| A dark plate looks grey on a light ground | The plate lets some of the ground through, and blending is in linear light | A fully opaque plate |
| A layer darkens the picture under it | The alpha of its target is above 1 | Keep alpha within 0 to 1 when adding light |
| Part of the picture is missing in the densest frame | The line batch is full; segments past its capacity are dropped silently | Size the capacity for the densest frame and capture that frame |
| A model has jagged edges | It was rendered into the target handed to `render()` | A target of its own with `samples: 4` |
| The first frame of a shot stutters | A shader, a texture or a canvas is built on first use | Build it in `init()` |
| Events drift late towards the end of the film | Time was worked out from a tempo figure | Read beat times from the beat grid |
| The owner sees a blank shot, captures are fine | A canvas feature that the owner's browser lacks | Read the output of the development server. Avoid the feature |
| Saving a helper file reloads the whole studio | The helper sits directly in `src/scenes/` | Move it to `src/scenes/parts/` |
| The app stops with `no audio analysis data found` | `data/audio.json` does not exist yet | Make a grid, or measure one, then run `scripts/build-shot-files.py` |
| The app stops with `data/audio.json has no sections` | The grid was made or measured again after the shot times were written | Run `scripts/build-shot-files.py` |
| A capture takes long to start | Another capture holds the lock | Wait. Never start a second browser to get round it |
| The tool stops and says that this film does not answer at `--url` | The address serves another film, or nothing. The tool accepts only a page whose marker names this film | Leave `--url` out, so the tool starts its own server, or give the address of this film's studio |
| A capture fails part way while files are being saved | The capture was given `--url` and ran on this film's studio, which has live reload on | Leave `--url` out, or do not save files during the capture |
| Layers look too bright, upside down or fringed on one machine only | The copy pass of `Layer2D` behaves differently on that graphics backend. It has not been checked on Windows | Compare a still of the same moment with one from another machine (section 11). Try another `--angle` |
| Frames are slow on one machine only | Software rendering, or a slow canvas upload | Run `gpu`. Measure an almost empty shot and a shot with a full frame layer there |
| `adaptive sampling needs stateless scenes` | A stateful scene under `--samples auto` | A fixed number of samples, or no state |
| The tool exits with code 2 | Video export was asked for without the owner's word | Deliver the studio page. Ask the owner |
| A photo or a clip frame is missing from a still, or a clip shows the wrong frame | The picture was drawn from a surface of its own that the engine does not know is loading, or loaded with an `Image` element instead of the helpers of `src/engine/media.ts` | Load through `loadBitmap`, `ImageTexture` or `ImageSequence`, whose loads are tracked |
| A photo shimmers when it is drawn much smaller than its size | No mipmaps | `ImageTexture` makes them; on a canvas layer, set `maxSize` near the size it is drawn at |
| A picture looks washed out or too dark next to the same file in a viewer | It was uploaded as an sRGB texture by hand, or its linear values were converted twice | Use `ImageTexture` or a canvas layer; both take the one path of `copyToSRGB` |
| Words fall off the frame or under a platform's buttons in one format only | The zones of that format are not tuned, or the scene placed words at fixed pixel positions | Tune `ZONE_TABLES` for the format; lay words out from the zones |
| The studio shows the master when a format was asked for | The name in `?format=` is not one of `FORMATS`; the console says which names exist | Use a listed name, or add the format to `formats` |
| The single-file page is blank when opened | The script failed before the page was ready: read the browser's console. A file the page asks for that was not packed answers 404 | Build again after adding files; open the page once through the capture tool with `--page` to see its errors |
