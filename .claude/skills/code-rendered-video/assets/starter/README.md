# Starter: engine and studio for a code-rendered film

This folder is the starting point of one film on the engine route of the `code-rendered-video` skill. It holds a WebGL2 engine that draws every frame as a function of song time, a transition pass and a post chain, a shared kit for scenes, the studio page where the film is watched with its music, and a capture tool for stills.

Copy the whole folder to the film's own place, for example `films/<name>/`. Then add the music, the beat grid and the shot list. Every shot plays in the studio as a storyboard card from the first day. Builders then replace the cards with scene modules, one at a time.

It comes with a tiny example film: a title, two sections of three shots each, a recap and an end card, over 24 bars on a synthetic grid at 120 BPM. There is no music file. The studio plays a click made from the beat grid, or plays silently. It also comes with a score written in code for that film (`data/score.json`) and a short voice-over (`data/voice.json`); `bun run score` renders them (see "Sound written in code" below).

The method is in the skill's references: `engine-architecture.md`, `studio-viewer.md`, `storyboard.md`, `music-and-beat.md`, `sound-and-voice.md`, `transitions.md`.

## Commands

Run every command from this folder. You need bun, Node.js 20 or later, Python 3 (`python3` on macOS and Linux; `python` or `py -3` on Windows), and Google Chrome for captures. The music analysis also needs Python (3.12 or 3.13 is the safe choice) with the packages in `analysis/requirements.txt` (see "The music analysis" below).

```sh
bun install                                   # packages
bun run make-grid -- --bpm 120 --bars 24      # a synthetic beat grid in data/audio.json
bun run shots                                 # check the storyboard; write STORYBOARD.md and the shot times
bun run studio                                # the studio at http://localhost:5180 (Ctrl+C stops it)
bun run typecheck
```

`bun run shots` runs `scripts/build-shot-files.py` with the first Python 3 it finds: `python3`, then `python`, then `py -3` (`scripts/python.ts`; set `PYTHON` to choose one). The script can also be run directly: `python3 scripts/build-shot-files.py` on macOS and Linux, `python scripts/build-shot-files.py` or `py -3 scripts/build-shot-files.py` on Windows, where `python3` is often only a stub that opens the Microsoft Store.

To hand the film over as one file that plays by double click, with no server:

```sh
bun run single                                # out/single/<title>.html: the page, its script, fonts, data, media/ and the first music file of studioAudio
bun run single -- --audio all                 # every music file of studioAudio; --audio none for none; --audio <file> for one
bun run single -- --format 1:1                # a page that opens in that format
```

Captures run one at a time for the whole repository. The capture tool starts and stops its own private server, so the studio does not have to be running.

```sh
bun scripts/render.ts stills --t 5,18.2                          # full-size stills in out/stills/
bun scripts/render.ts stills --beats 36,36.5 --only steep-leaves-drop
bun scripts/render.ts sheet --times 5,13.9,18.2,30 --cols 4 --out out/check.png
bun scripts/render.ts sheet --cuts --cols 4                      # frames round every cut
bun scripts/render.ts sheet --frames 300,301,302 --cols 3        # output frame numbers (t = n / fps)
bun scripts/render.ts perf --from 20 --to 25                     # frame time
bun scripts/render.ts gpu                                        # which graphics backend Chrome uses
bun scripts/render.ts stills --format 16:9 --t 5                 # another format of the film: out/stills-16x9/
bun scripts/render.ts stills --page out/single/starter-film.html --t 5   # a still of the single file, from disk
```

- Add `--angle` to choose Chrome's graphics backend: `metal`, `d3d11`, `gl`, `vulkan`, `swiftshader` or `default`. Without it the tool uses `metal` on macOS, `d3d11` on Windows and `gl` on Linux. A `gpu` answer that contains SwiftShader means software rendering, and frame times measured there mean nothing.
- `--format <name>` works in every mode: one of the formats in `src/project-config.ts` (9:16, 1:1, 4:5, 16:9 in the starter). Without it, the master.
- Stills and sheets take their times as seconds (`--t`, sheet `--times`, `--from`/`--to`), output frame numbers (`--frames`) or beat indices (`--beats`). A time in seconds or beats is moved to the nearest output frame, the only times an export renders; `--exact` renders it as given.
- Stills and sheets wait for photos and clip frames that are still loading (`src/engine/media.ts`), so a still never shows a frame that had not arrived.
- `video` mode exists but is refused (exit code 2) unless `OWNER_ASKED_FOR_VIDEO=yes` is set. Set it only when the owner asked for a video file in the current conversation. Its encoder settings, how to reach a size such as "under 30 MB" or 720p, and the checks of the file are in the skill's `references/engine-architecture.md`, section 8.
- The tool always starts its own server, without live reload, so a file saved during a capture cannot change the picture. `--url http://localhost:5180` makes it use the running studio instead, and only when the page's marker names this film (`title` in `src/project-config.ts`); do not save files while such a capture runs.
- The lock is `.render.lock` in the nearest folder above this one that holds `.git`. Without one, it is the nearest folder that holds `CLAUDE.md` or `AGENTS.md`, and after that the system's temporary folder. Set `RENDER_LOCK_DIR` to choose the folder yourself.
- `sh scripts/clean.sh` removes the installed packages, `out/`, the build caches and `analysis/python-env` before the folder is copied or shipped.

## Setting up a new film

1. Set `src/project-config.ts`: the title, the music files, the frame rate, the master format (`width`, `height`, `format`), the other formats the film may be looked at in (`formats`), and the studio port. Give each film on one machine its own port.
2. Put the track in `audio/`: the master as `audio/track.wav`, plus compressed copies with the same timing for the studio (`studioAudio`, for example `audio/track.m4a`). A file that is listed but missing is skipped. The music switch always ends with `click` and `silent`.
3. Replace the synthetic grid with a measured one. Real tracks drift in tempo, and a film cut on a steady grid slides off the music. The scripts in `analysis/` write `data/audio.json` from the track (below, and the method in the skill's `references/music-and-beat.md`). Pass `--sections data/film-sections.json` so the shot boundaries are kept. Then run `bun run shots` again. It must run last, because the analysis rewrites the file. A score composed in code (`bun run score`, below) writes its own grid instead, exactly, with nothing to measure.
4. Write `shots.json` and `copy.json` (the schema is below and in `storyboard.md`). Run the generator after every change.
5. Set the look: the colours in `src/engine/palette.ts` (keep the keys), the fonts in `src/engine/type.ts` and `public/fonts/`, the zones of each format in `src/scenes/parts/kit-frame.ts` (`ZONE_TABLES`), the grounds and the sky (`Sky`), type voices and post presets in `kit-ground.ts`, `kit-type.ts` and `kit-post.ts`; a film with characters or pixel art also uses `kit-rig.ts` and `kit-pixel.ts`; particles are in `kit-particles.ts`, and devices and cards in space in `kit-devices.ts`.
6. Put the photos, logos, screenshots and clip frames the film shows in `media/` (below, "Pictures and clips").
7. Open the studio and show the owner the animatic. Nobody builds a shot before the owner has approved it.

### The music analysis

The four scripts in `analysis/` need librosa and its company. Make the environment once per machine, inside this folder; an environment made on one machine does not run on another.

```sh
python3 -m venv analysis/python-env                                        # Windows: py -3.13 -m venv analysis\python-env
analysis/python-env/bin/python -m pip install -r analysis/requirements.txt  # Windows: analysis\python-env\Scripts\python.exe
```

`requirements.txt` holds the versions the reference films were measured with, on macOS. If a pinned version has no wheel for another system or Python, install the unpinned set instead: `librosa soundfile numpy scipy matplotlib`.

```sh
P=analysis/python-env/bin/python
$P analysis/analyze-beat-grid.py audio/track.wav data/audio.json --sections data/film-sections.json
$P analysis/plot-beat-grid-qa.py audio/track.wav data/audio.json out/grid-qa     # images to look at
bun run shots                                                                    # always last
```

| Script | Does |
|---|---|
| `analysis/analyze-beat-grid.py` | Beats by following the kicks, bars, energy features; writes the file the app reads |
| `analysis/track-beats-by-phase-lock.py` | A grid for a track whose kick cannot be followed all the way; its output goes back in with `--beats-from` |
| `analysis/plot-beat-grid-qa.py` | Energy per bar and zoomed waveforms with the grid on top, for checking by eye |
| `analysis/edit-track-by-bars.py` | Cuts the track to a list of bar ranges and carries the grid across |

### Sound written in code

Instead of a track, the music can be a score written as data, with sound effects on the events of the picture and a voice-over with captions. The method is in the skill's `references/sound-and-voice.md`.

```sh
bun run voice:sapi            # Windows only: speak data/voice.json with a local voice; audio/voice/*.wav, data/voice-words.json
bun run score -- --check      # check data/score.json (and the voice) without writing
bun run score                 # audio/score.wav, the exact grid in data/audio.json, captions in data/lyrics.json
bun run shots
```

| File | Holds |
|---|---|
| `data/score.json` | Tempo, buses, instruments, patterns, sections in bars, cues of sound effects, and the voice file. Edited by the lead |
| `data/voice.json` | The phrases of the voice-over, each with the bar and beat its first word lands on; `\|` and `/` in the text break the captions. Edited by the lead |
| `data/voice-words.json` | Written by the voice step: the time of every word inside each phrase file |
| `data/lyrics.json` | Written by `bun run score`: the caption groups in song time, read by the app as `ctx.lyrics` |

The instruments go beyond a drum kit and a synth: strings, brass, piano, electric piano, flute, bells, a guzheng-like zither, a wobble bass, an 8-bit voice, beds of wind, rain, room, river and crickets, and effect presets for games and interfaces (coin, fanfare, level-up, siren, engine, crunch, pop, boing, toggle, success, error, notify, key). A `sample` instrument plays a WAV the owner names, placed by its measured peak. A score with `track` lays effects, a bed or a voice over a finished track whose grid was measured into `data/audio.json`, ducks the track and sets the whole mix to a loudness target; it leaves the grid as it is. `cueModules` turns the events of a simulation into cues. The overlay draws the voice's caption groups at the foot of the frame.

The studio's music switch offers `score` once `audio/score.wav` exists. When the score is the film's music, set `audioFile` in `src/project-config.ts` to it. `--no-grid` writes the WAV alone and leaves the grid and the captions as they are. Two runs of the same files give the same bytes. A voice that is not local (edge-tts, paid voices) sends the script away or costs money: ask the owner first.

### The two data files

| File | Holds |
|---|---|
| `shots.json` | `transitions` (kind to label and description, and every kind must exist in `src/engine/transition.ts`), `groups` (sections of the film: `title`, `section`, `recap`, `end`), `shots` (id, group, bar, bars, tone, title, `in`, see, move, camera, look, and optionally `repeat`), `captions` (group, kind, bar, bars, how, place, why) |
| `copy.json` | `labels` and `accents` for each caption kind, the words of the `title` and `closing` cards, and `sections`: one entry per section group, joined on `group`, with `n` and `name` equal to the group's and a `lines` object holding one sentence per caption kind, one string per line on screen |

The generator checks both files before it writes anything. If a check fails, it prints one line per fault and writes nothing. Some findings are warnings, printed without stopping the run: two shots in a row that come in by the same transition (other than `cut`, `travel` and `match`), or whose `camera` is the same text, and a shot list longer than the audio. Repetition is usually a slip, but it can be the form of a film (a nested doll opening the same way at each level): `"repeat": true` on a shot declares its repetition of the shot before it intended, and silences those two warnings for that pair. It writes three files:

- `STORYBOARD.md`
- `data/film-sections.json`, the shot boundaries in bars
- the `sections` of `data/audio.json`, the shot times in seconds that the app reads

Never edit a generated file. The counter shows `NN/TT`, and the total comes from the number of section groups.

### Pictures and clips

`media/` holds the pictures a film shows. The studio serves it at `/media/`, and `bun run single` packs it. `src/engine/media.ts` loads them; every load is tracked, so stills and exports wait for them.

| Helper | For |
|---|---|
| `ImageTexture` | A photo, logo or screenshot as a texture: `await this.logo.load('media/logo.png')` in `init()` |
| `drawPicture(renderer, texture, [w, h], out, rect, { fit, zoom, focus, radius, opacity })` | Draws that texture into a rectangle: `cover`, `contain` or `stretch`, a slow push, rounded corners |
| `loadBitmap(path)`, `drawImageFit(ctx, picture, rect, { fit })` | The same on a canvas layer, where it can be clipped and mixed with type |
| `ImageSequence({ pattern: 'media/run/%04d.jpg', count, fps })` | A clip as numbered pictures: `frameAt(seconds)` for a canvas, `textureAt(seconds)` for the GPU |

A clip is extracted from a video once, with ffmpeg, only with the owner's word (it is a heavy run). The command is in the skill's `references/engine-architecture.md`, section 4.

## Adding a scene module

A shot is built as `src/scenes/<shot id>.ts`, and the file name must be exactly the id from `shots.json`. Its default export is a class that extends `Scene`. When the file exists, the studio plays it instead of the card. Load the page again after the first save, because built or card is decided when the page loads. After that, saves are swapped in without a reload.

```ts
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D } from '../engine/gl';
import { Ground } from './parts/kit-ground';
import { sceneClock, frameClock } from './parts/kit-frame';
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
    // ... draw in logical px, from k and kf only
    comp.draw(renderer, this.layer.upload(), out, { tint: TYPE_TINT });
    return POST_DARK;
  }

  override dispose() { this.ground.dispose(); this.layer.dispose(); }
}
```

A film of exact flat colours: the example above lifts and dims colours on purpose. `Ground` lays a paper texture on the light grounds, `TYPE_TINT` darkens the layer to 86%, and `POST_DARK` adds bloom, halation, colour fringes, grain and a vignette over the tone shoulder. For colours that come out exactly as `src/engine/palette.ts` gives them, fill the whole layer yourself (the ground colour first), composite it with `comp.draw(renderer, this.layer.upload(), out, { mode: 'replace' })` and no tint, and return from `render()`:

```ts
return { tone: 0, dither: 0, grain: 0, bloom: 0, halation: 0, ca: 0, vignette: 0 };
```

Each of these is on in the defaults of `src/engine/post.ts` (`DEFAULT_POST`), which a scene's overrides are laid over, so each must be set to 0. `exposure` stays 1; the looks that are off by default (`hue`, `kaleido`, `fisheye`, `bulge`, `mosaic`, `glitch`, `crt`, `invert`, `fade`, `flash`) stay off. A transition may still set some of them for its own frames, and the overlay still draws the counter and the caption plates over the shot. Checked on Windows: signal, paper and ink come out as `#FF2E74`, `#F3EBDD` and `#100E14`.

A scene reads a data file of the film (`data/*.json`) in either of two ways. Import it, and it is part of the scene's code, in the studio and in the single-file build: `import score from '../../data/score.json';`. Or fetch it in `init()`, when it is large or optional: `const r = await fetch('data/strikes.json'); this.strikes = await r.json();`. The studio serves `data/` at `/data/`, and `bun run single` packs every `data/*.json` and answers the fetch from the packed copy. An imported file is swapped in when it is saved, like the scene; a fetched one is read again only when the page loads.

Rules for scenes:

- No `Date`, no `performance.now`, no `Math.random`. Use the seeded helpers in `src/engine/util.ts`.
- Beats come from the grid, never from a tempo number.
- Shared helpers go in `src/scenes/parts/`. A helper placed directly in `src/scenes/` reloads the whole studio when it is saved.
- Do not use canvas `ctx.filter`, because Safari lacks it. Do not rely on `letterSpacing` to make a layout fit.

## Studio keys

| Key | Action |
|---|---|
| Space, or a click on the picture | Play or pause |
| `[` and `]` | The shot before, the next shot |
| Arrows | One second back or forward. Shift makes it five seconds |
| `,` and `.` | One frame back or forward |
| `L` | Loop the shot |
| `M` | The next music source |
| `F`, or the Format button | The page again in the next format, at the same time |

The page parameters are `?t=<seconds>`, `?only=<ids>`, `?scale=<1..4>` and `?format=<name>`. The page publishes `window.seek(t)`: it draws the frame of song time `t` (paused there) and resolves when every picture of it has loaded; `window.duration` is the length of the film.

Errors from the browser are forwarded to the studio's terminal (`server.forwardConsole`). A scene that fails shows a dark red frame, and the rest of the film keeps playing.

## What differs from the reference app

| Change | Why |
|---|---|
| `Layer2D` uploads its canvas as plain RGBA8, and a small pass copies it into an sRGB texture in linear light. The API is the same | The sRGB canvas upload takes a slow path in Chrome on Windows (Direct3D 11) |
| The canvas `filter` is patched and reset only where the browser has it | Safari has no canvas filters |
| `audio/` and `data/` are served by middleware in `vite.config.ts`, with byte ranges, and a missing file returns 404. Requests that Vite marks as modules (`?import`, `?raw`, `?url`) pass through to Vite, so a scene can import a data file. There are no symbolic links | Links are lost on exFAT, in zip files and on Windows. Before, a missing link served the page itself as data |
| The page title and the `render-app` marker come from the project config, and the marker names the film | The capture tool never attaches to another film's studio |
| The studio port lives in the project config; the capture tool uses the studio only when `--url` names it | One address per film, and captures that a saved file cannot disturb |
| The Chrome backend is chosen by platform (`--angle` overrides it). The lock is found by walking up to the repository root | The tool runs on macOS, Windows and Linux, and wherever the film folder sits |
| `groups[].kind` `section` replaces `pattern`, `copy.sections[].lines` replaces `patterns[]` with fixed sentence keys, and `labels` and `accents` replace `problemLabel` and `whenLabel` | Neutral terms and caption kinds of any name |
| The generator joins copy to groups by `group`, checks every field with a plain message, and writes only after every check has passed | These were faults found in review of the reference generator |
| Music keys ignore case, and the scrub bar gives the focus back after a seek | These were pitfalls of the reference app: with Caps Lock on the keys did nothing, and after a seek the arrow keys moved the scrub bar |

## File map

```
README.md                  this file
package.json  bun.lock     packages; scripts studio, typecheck, render, single, make-grid, shots, score, voice:sapi
vite.config.ts             studio server: scene hot swap, page title and marker, audio/, data/ and media/ middleware; the single-file build's settings
tsconfig.json              the app;  tsconfig.scripts.json: scripts/ and vite.config.ts
index.html                 the studio page (no film named in it)
shots.json  copy.json      the storyboard as data (edited by the lead)
STORYBOARD.md              generated
audio/                     the music (none in the starter)
media/                     photos, logos, screenshots, clips as numbered pictures (none in the starter)
data/audio.json            beat grid and shot times (synthetic in the starter)
data/film-sections.json    generated: shot boundaries in bars
data/score.json            the score written in code: instruments, patterns, sections, cues (edited by the lead)
data/voice.json            the voice-over as phrases placed on the grid (edited by the lead)
public/fonts/              fonts and their licences (OFL; Hershey stroke font)
scripts/render.ts          capture tool: stills, sheet, perf, gpu (video refused without the owner's word); --format, --page
scripts/build-single.ts    the film as one HTML file that plays from disk (bun run single)
scripts/make-click-grid.ts synthetic beat grid
scripts/make-score.ts      renders data/score.json to a WAV and writes its exact grid and the voice's captions
scripts/voice-sapi.ps1     Windows: speaks data/voice.json with a local voice and writes the word times
scripts/build-shot-files.py  checks the storyboard and writes the generated files
scripts/python.ts          runs a Python script with the first Python 3 found (bun run shots)
scripts/clean.sh           removes installed packages, out/, build caches and analysis/python-env
analysis/                  music analysis in Python: beat grid, phase-lock grid, grid images, cutting by bars
analysis/requirements.txt  the analysis packages, as pinned on macOS
src/project-config.ts      title, music, fps, the master format and the other formats, studio port, page marker
src/film.ts                types of the shot list and the copy, lookups
src/timeline.ts            shots to timeline entries; card for a shot without a module; overlay entry
src/main.ts                studio player, format switch, window.seek, export hook (window.__render)
src/click-track.ts         the click of the beat grid, for a film without a music file
src/engine/                engine, transition pass, post chain, layers, pictures and clips (media.ts), type, audio data, word timings, util
src/sound/                 the score: instruments (instruments, orchestra, ambience, effects), mix (reverb, delay, ducking, limiter, loudness, WAV), grids, voice and captions, an example of cues from a simulation
src/engine/LICENSE-pdoom-video.txt   MIT licence of the engine this one is derived from
src/scenes/storyboard-card.ts        plays every shot that has no module
src/scenes/overlay.ts                counter and captions over every shot
src/scenes/parts/kit-*.ts            shared kit: frame and clocks, camera, ground, type and type in motion, post presets and passes on layers, particles, devices, rig, pixel
src/scenes/<shot id>.ts              scene modules, written by builders
out/                       captures and the single-file build (not kept)
```

## Licence

Several files are derived from [pdoom-video](https://github.com/mexicat/pdoom-video) by Giacomo Magnanini, under the MIT License. Each of those files says so in its header, and the licence text is in `src/engine/LICENSE-pdoom-video.txt`. Keep both when you copy the folder. The fonts are under the SIL Open Font License, and their licence texts sit next to them in `public/fonts/`.
