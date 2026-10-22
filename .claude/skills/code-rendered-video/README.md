# code-rendered-video: the skill folder

This folder is an agent skill. `SKILL.md` is its entry; the rest is loaded on demand. It was written from two films (the "reference films") and holds everything a new film needs: nothing in it points outside the folder.

## What is here

| Path | Lines | Holds |
|---|---|---|
| `LICENSE` | 27 | MIT |
| `SKILL.md` | 149 | Entry: terms, ten rules, the eleven phases with their gates, the short lane and the autonomous mode, which reference to load when |
| `references/environment.md` | 247 | Tools per route, install commands for macOS, Windows, Linux, system differences, the owner's browser |
| `references/interview.md` | 217 | How to ask; rounds of questions in English and Vietnamese, including short pieces and real material; the brief page |
| `references/route-selection.md` | 135 | Engine, HyperFrames or mixed; named tools; requests that are not films of this method |
| `references/hyperframes-route.md` | 186 | The HyperFrames family of skills and how to use it under the owner's rules |
| `references/hyperframes-facts.md` | 772 | The fact sheet behind the two HyperFrames chapters, read at CLI 0.8.81 |
| `references/thinking-and-brainstorm.md` | 269 | Research of the real thing and its sources; from a subject to pictures; comparisons; directions |
| `references/music-and-beat.md` | 365 | Music, beat grid, music map, clock |
| `references/storyboard.md` | 476 | The storyboard as data |
| `references/transitions.md` | 333 | Catalogue of transitions and the rules for spending them |
| `references/camera.md` | 268 | Catalogue of camera positions and moves |
| `references/art-styles.md` | 412 | Catalogue of looks, recipes by kind of film, colour |
| `references/effects.md` | 509 | Catalogue of effects inside a shot and on the finished frame |
| `references/type-and-captions.md` | 267 | Words on screen |
| `references/engine-architecture.md` | 574 | The engine route's engine |
| `references/studio-viewer.md` | 381 | The studio page |
| `references/orchestration.md` | 406 | Lead, story writers, builders, review loop, models |
| `references/quality-gates.md` | 391 | Gates, checklists, pitfalls, "done" |
| `references/short-pieces.md` | 411 | The short lane for pieces of 5 to 40 seconds, the autonomous mode, recipes (showreel, UI piece, launch, reward reveal, kinetic words, sting, lyric video, game trailer, fast edit, meme piece), loops, several formats, pieces that play on a click |
| `references/sound-and-voice.md` | 459 | Score and sound effects written in code, voice-over and word timings, caption groups, ducking and loudness |
| `references/characters-and-story.md` | 307 | Designing, rigging and acting characters in code, cycles, several characters, the cast file, characters in 3D, stories told without words, faults in stills |
| `scripts/check-environment.mjs` | 359 | Checks a machine for a route; prints install commands |
| `scripts/check-environment.sh`, `.ps1` | 65 | Start the checker without a known runtime |
| `assets/starter/` |  | A generic engine, studio, capture tool, storyboard generator and music analysis, with a tiny example film. Its `README.md` is the manual of a film folder |

## Installing it as a skill

A skill is a folder whose name equals the `name` in its `SKILL.md`. Copy this folder, under that name, into the skills folder of the assistant.

```sh
# Claude Code, for one user (macOS, Linux)
cp -R code-rendered-video ~/.claude/skills/code-rendered-video
# for one project
mkdir -p .claude/skills && cp -R code-rendered-video .claude/skills/code-rendered-video
```

```powershell
# Claude Code, for one user (Windows)
Copy-Item -Recurse code-rendered-video "$env:USERPROFILE\.claude\skills\code-rendered-video"
```

Copy it clean: no `node_modules/`, `out/` or `analysis/python-env/` inside `assets/starter/`. `sh assets/starter/scripts/clean.sh` removes them. A film is made in a copy of `assets/starter/`, never inside the skill folder.

## First run on a new machine

1. `node scripts/check-environment.mjs` (or the `.sh`, `.ps1` launcher when Node.js may be missing). Add `--with audio` for the music analysis.
2. Copy `assets/starter/` to a scratch folder and follow its README: `bun install`, `bun run make-grid -- --bpm 120 --bars 24`, `bun run shots`, `bun run typecheck`, `bun run studio`.
3. Make the Python environment in that folder as its README says, and run `analysis/analyze-beat-grid.py` on any track.
4. One still: `bun scripts/render.ts stills --t 5`, and `bun scripts/render.ts gpu` to see which graphics backend Chrome uses.

## What was tried and what was not

| Part | State |
|---|---|
| The method | Used on two films, one horizontal of 135 seconds, one vertical of 172 seconds with 54 shots |
| The environment checker | Run on macOS 26 on Apple silicon under Node.js 24 and Bun 1.3. On Windows 11 under Node.js 24, 2026-09-28, every line matched the machine after two fixes: winget, an app alias that `stat` cannot follow, was not found; the Python command named the newest Python (3.14) instead of the newest from 3.10 to 3.13. Not yet run on Linux |
| The starter | On macOS: install, type check, the generator, a sheet of captures and the studio page passed. On 2026-09-28 the music analysis ran from the starter on a real 172-second track, and the generator was fixed to count bar 0 from the first downbeat |
| The sRGB upload fix in the starter | Written from a description of the fix made on the owner's Windows machine, not from its code. On Windows 11 its stills match the macOS reference, and its code does what the design patterns engine does (rows below) |
| The Python pins | `analysis/requirements.txt` was resolved on macOS. On Windows 11 with Python 3.13, 2026-09-28, every pin installed. Not yet on Linux |
| The music analysis on Windows | On Windows 11, 2026-09-28, on the 172-second track of the second reference film: the kick analysis counted one beat too many in the drop where the bass hides the kick, as `music-and-beat.md`, section 5, describes; the phase-lock script then gave 375 beats equal to the grid measured on macOS, to the millisecond |
| Frame time on Windows | Windows 11, Chrome on Direct3D 11, RTX 4090, 2026-09-28: `perf --from 16 --to 21` over storyboard cards gave a median of 14.7 ms and a 95th percentile of 19.6 ms, readback included; the first frame took 1.06 s. No figure of the same range on macOS to compare with |
| The HyperFrames chapters | Written from its skill files and read-only runs of CLI 0.8.81. No film has been made on that route |
| The chapters added on 2026-09-28 for short pieces, sound and voice, characters and story, the research of a real product, and the boundaries of the method | Written from the method and from a collection of about four hundred prompts for such pieces. Not yet tried on a film. The shot data of a short piece (one `title` group, shots of one bar entering by `cut`, no captions) was run through the generator in a copy of the starter on Windows |
| Sound written in code | `bun run score` (the score and sound effects) and the local Windows voice (`bun run voice:sapi`) ran on Windows 11 on 2026-09-28. Three runs gave the same output; the grid equals the shipped synthetic grid. Not yet listened to |
| The character rig (`src/scenes/parts/kit-rig.ts`) | The lead looked at three stills of a demo scene on Windows 11 on 2026-09-28: feet planted on the ground line, a walk pose, a hop. In the hop the legs were hidden by a caption plate, so they were not judged |
| The pixel kit (`src/scenes/parts/kit-pixel.ts`) and `scaleCam` | Type checked only |
| Formats, pictures and the single file | On Windows 11 in Chrome, 2026-09-28: the format switch in four formats, the image layer and the image sequence, and the single-file build, whose still captured from disk equals the studio's byte for byte. The export settings and the checks of an exported file are written, not run. The storyboard card fitted to all four formats, seen in stills |
| Sound, round 2 | On Windows 11, 2026-09-28: the orchestra, the ambience beds, the effect presets, recorded files placed by their peak, a score over a measured track, and the voice's captions drawn at the foot, the last seen in stills. Deterministic. Not listened to; the demo WAVs are in a playground |
| Effects, round 2 | On Windows 11 in Chrome, 2026-09-28: particles, devices, cards in space, type in motion, the looks of the post chain, eight new transition kinds. Stills only: no playback, no frame-time measurement, no Safari |
| Looks, round 2 | On Windows 11 in Chrome, 2026-09-28: the sky kit, the pixel layer at 8x, a journey across scales through four worlds, the rig's hop and walk. Seen in stills |
| The capture tool's own server by default, `--url` for the studio, `timeOfFrame` | On Windows 11, 2026-09-28: a still by `--frames 300` through the private server lands on 5.000 s; `--url` to a studio that is not running stops with its error; typecheck passes. The generator now writes LF, and its outputs on Windows equal the shipped files byte for byte |
| The sRGB upload on Windows, by its code | Compared on 2026-09-28 with the design patterns engine, known to work on this machine: same plain RGBA8 upload, same decode into linear light, same sRGB target. The starter flips the rows in the shader instead of on upload. Chrome there uses Direct3D 11 on the graphics card |
| The picture on Windows against macOS | On Windows 11 in Chrome, 2026-09-28, the lead captured the example film at 5 s and 18.2 s: brightness, orientation and edges match the macOS reference stills. The card's line breaks differ, because the card was changed since |
| Three trial films, with the skill installed | On Windows 11, 2026-09-28, three prompts from the collection, each built by one Opus builder and watched by the owner in the studio (no video export). A kinetic type piece in the short lane: accepted after the owner found a line of text that showed for one frame at 9.9 s, caused by a drawing chosen from the frame's time while drawn at the studio's time. A 45-second machine whose every note is a collision, 16:9, on a score written in code by the lead: accepted after one round; 22 of 332 strikes were out of frame on the first check; its frame time was not measured. A 60-second vertical film on recursion in the eleven phases: built to its sample section, then stopped by the owner, having shown what it had to show; its pull-out transition was broken and was fixed in the engine |
| What the trials changed | The engine: the pull-out portal, the zoom-in fringing, post `tone` and `dither` switches. The starter: `bun run shots` on every system, data files imported by scenes, `sheet` with `--frames` and `--exact`, repeated transitions and camera moves as warnings with `"repeat": true`, card labels for spans inside a bar, `settle` and more easings, `screenPoint` and `inFrame`. Each checked by typecheck and stills in a copy of the starter; the example film's still at 5 s is byte-identical before and after. The chapters: the motion check (`quality-gates.md`), what may read the frame's time (`engine-architecture.md`, section 1), the picture from the score (`sound-and-voice.md`, section 5.4), shared kit objects and engine fixes during a film (`orchestration.md`) |
| The skill as a whole | Run from the interview to the studio on the trial films above. Not yet on a film on a real product with the research step, or on the HyperFrames route |

## Still open

1. Run the checker and the starter on Linux and fix what differs (the steps above).
2. Make one film on a real product with the research step, and one on the HyperFrames route, and correct those chapters from what the runs show.
3. The generated `STORYBOARD.md` still names a span inside a bar the old way ("2.25 to 3"), while the card now reads "FROM BAR 2.25, 0.75 BARS"; changing it changes the example's document.


## Licence

MIT, in `LICENSE`. The engine in the starter is derived from pdoom-video by Giacomo Magnanini, also MIT; keep its notice (`assets/starter/src/engine/LICENSE-pdoom-video.txt`). The fonts are under the SIL Open Font License, with their texts beside them.

## Where it came from

The method was first written up in Vietnamese, as a playbook, in the repository of the reference films. This folder supersedes it for agents.
