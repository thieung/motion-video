# HyperFrames facts

What the HyperFrames skill family and its command line say about themselves, read on 2026-09-28 from the skill files and from read-only runs of CLI 0.8.81 on macOS. `route-selection.md` and `hyperframes-route.md` decide with these facts; this file only records them.

Load this when: you need a name, a command, a catalogue entry or a stated limit of HyperFrames, or another chapter cites a section of this file.

HyperFrames changes quickly. Before relying on a fact here, compare `npx hyperframes --version` with 0.8.81 and read the installed skill file named in the row. Where they disagree, the installed files win.

`SK` below is the folder the assistant's skills are installed in, for example `~/.claude/skills`.

## How this was established

| Source | What |
| --- | --- |
| Skill files | Every `SKILL.md` of the 13 named skills read in full; reference indexes read; large catalogues counted by script |
| CLI, live | `npx --yes hyperframes --version`, `--help`, `doctor`, and `--help` of 40 sub-commands. Run from the session scratch folder with `HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1` |
| Not run | `render`, `preview`, `play`, `present`, `init`, `add`, `catalog`, `capture`, `publish`, `auth`, `cloud`, `lambda`, `cloudrun`, `skills check/update`, `telemetry status`, `lint`, `check`, `snapshot`, `beats`, `tts`, `transcribe` |

Side effect to know about: the CLI itself refreshed `lastUpdateCheck` in `~/.hyperframes/config.json` when `doctor` ran.

Marking used in this file: **[stated]** = written in a skill file or printed by the CLI. **[inferred]** = my conclusion from that evidence.

---

## 1. What HyperFrames is

- "HyperFrames renders video from HTML": a composition is an HTML file whose DOM declares timing with `data-*` attributes, whose animation runtime is seekable, and whose media playback is owned by the framework. [stated, `SK/hyperframes/SKILL.md`, `SK/hyperframes-core/SKILL.md`]
- npm package `hyperframes`, by HeyGen. Registry and skills live at `github.com/heygen-com/hyperframes`. CLI tagline: "Create and render HTML video compositions". [stated]

Authoring model [stated, `SK/hyperframes-core/references/data-attributes.md`, `minimal-composition.md`, `tracks-and-clips.md`]:

| Piece | Rule |
| --- | --- |
| Root | One element with `data-composition-id`, `data-width`, `data-height`; `data-duration` is render length in seconds, read once at compile time; `data-fps` optional |
| Clip | Any element with `data-start` is a clip. `data-duration` required on `div` and sub-composition hosts. Visibility window is half-open `[start, start+duration)` |
| `class="clip"` | Convention only. Runtime never reads it; gives the full-frame box, Studio edit hint, lint warns without it |
| `data-track-index` | Studio display lane only. Render never reads it. Layering is CSS `z-index` |
| Relative timing | `data-start="intro + 2"` means 2 s after clip `intro` ends. Spaces around the operator required. Unresolved reference silently resolves to 0 |
| Timeline | Exactly one `gsap.timeline({ paused: true })` per composition, registered at `window.__timelines["<id>"]`, key = root `data-composition-id` |
| Sub-composition | Separate file loaded by `data-composition-src`, root wrapped in `<template>`, `<style>` and `<script>` inside the template. Runtime auto-nests child timelines |
| Media | `<video>` / `<audio>` found by flat document query, seeked and decoded by the framework. `<audio>` needs an `id` or it is never mixed. `data-media-start`, `data-volume`, `data-playback-rate` (0.1..10), `data-automation` lanes |
| Variables | `data-composition-variables` on `<html>`, read with `window.__hyperframes.getVariables()`, overridden by `render --variables` |

How frames are produced [stated, `SK/hyperframes-cli/references/preview-render.md`, `doctor-browser.md`, `render --help`]:
- Headless Chrome (pinned `chrome-headless-shell`) loads the composition; the runtime seeks it frame by frame; frames are captured, then FFmpeg encodes.
- Capture paths: `beginframe`, `screenshot`, and `--experimental-fast-capture` (Chrome `drawElementImage`, "default on where it can engage (macOS + hardware-GPU browser)").
- `--workers auto`: "Each worker launches a separate Chrome process (~256 MB RAM)".
- Audio effects run in an `OfflineAudioContext` inside the same headless browser; preview and render share one Web Audio graph implementation. [`SK/hyperframes-audio/SKILL.md`]
- Chrome is pinned "because pixel output drifts across Chrome versions". `render --docker` is the reproducible path.

Determinism rules [stated, `SK/hyperframes-core/references/determinism-rules.md`]:
- "same input time → same pixels".
- Banned for visual state: `Date.now()`, `performance.now()`, unseeded `Math.random()`, render-time network fetches, hover/scroll/pointer/focus state, `repeat: -1` (use a finite count with `floor`).
- Never tween `display`, `visibility` or `autoAlpha` on a clip element. Lint code `gsap_animates_clip_element`.
- No CSS `transition` on animated elements.
- No fixed allowlist of animatable properties; lint enforces a denylist.

---

## 2. Requirements

### What the skill files and CLI state

| Item | Requirement | Source |
| --- | --- | --- |
| Node.js | 22 or newer | `SK/hyperframes-cli/SKILL.md` |
| FFmpeg, FFprobe | Required, on PATH | same |
| Browser | Bundled pinned Chrome, fetched by `npx hyperframes browser ensure`, cached under `~/.cache/puppeteer/` | `doctor-browser.md`, live `doctor` |
| Docker | Only for `render --docker` | `doctor-browser.md` |
| WebGPU + html-in-canvas blocks | Brave or Chrome canary via `PRODUCER_HEADLESS_SHELL_PATH` | `SK/hyperframes-animation/adapters/typegpu.md` |
| Python | Only for optional local Kokoro TTS, MusicGen, `extract-audio-data.py` | `SK/media-use/audio/references/requirements.md` |
| `@hyperframes/core` in the project | Needed by `carve.mjs` (`npm i -D @hyperframes/core`) | `SK/hyperframes-audio/SKILL.md` |

Install and invoke: `npx hyperframes <command>`. A scaffolded project pins `hyperframes@<version>` in its `package.json` scripts; check with `npx hyperframes@latest upgrade --project . --check`. Skills: `npx hyperframes skills`, or without the CLI `npx skills add heygen-com/hyperframes --all`.

### OS support

No skill file gives a support matrix. Evidence found:
- macOS: `brew install ffmpeg`; fast capture default on macOS; VideoToolbox named for `--gpu`.
- Linux: "`screenshot` + `software gpu` on Linux is the slow path"; VAAPI named; `/dev/shm` check inside containers.
- Windows: `render --frames-cache-dir` help text names "Windows C: exhaustion during long renders"; NVENC and QSV named; telemetry detects `wsl`.
- [inferred] All three are targeted. Nothing in the files says which is first class.

### `doctor` on the machine the facts were read on (live output, CLI 0.8.81)

| Check | Result |
| --- | --- |
| Version | 0.8.81 (latest) |
| Node.js | v24.13.1 (darwin arm64) |
| CPU / Memory / Disk | 16 cores Apple M4 Max / 48 GB total / 593 GB free |
| Frames cache, Archive extractor, Settings lock, Environment | ok |
| FFmpeg / FFprobe | 8.1.2 at `/opt/homebrew/bin/` |
| Chrome | `chrome-headless-shell` mac_arm 154.0.8037.57 |
| Docker / Docker running | 29.4.0, running |
| onnxruntime-node, @google/genai | not installed, "installs on first use" |
| whisper-cpp | **not found** (optional, transcription) |
| TTS (Kokoro) | **not installed** (optional, local voice) |
| BGM (MusicGen) | **not installed** (optional, local music) |

Disagreement: `SK/hyperframes-cli/references/doctor-browser.md` lists ten checks and omits Frames cache, Archive extractor, Settings lock, whisper-cpp, Kokoro, MusicGen, onnxruntime-node, @google/genai. The live CLI prints them. The skill says `doctor --json` always exits zero; gate on the payload field `ok`.

### Account, login, paid services

| Action | Account needed? | Source |
| --- | --- | --- |
| Local `render` | No [stated] | `SK/ak-hyperframes/SKILL.md`: HeyGen key is optional, "local rendering works without it" |
| `lint`, `check`, `snapshot`, `preview`, `play` | No [inferred] | The nine-step dev loop in `SK/hyperframes-cli/SKILL.md` has no auth step; `auth` is only named for cloud, publish and HeyGen media |
| `catalog --query` | No. "Search is entirely local: there is no hosted tier, no account, and the query text is never sent anywhere" | `SK/hyperframes-cli/SKILL.md` |
| `add <item>` | No account, but needs network every time | `SK/hyperframes-registry/SKILL.md` |
| `publish` | Yes. Signed-out publish returns an "authentication-required claim URL". Hosted at hyperframes.dev | `preview-render.md` |
| `cloud render` | HeyGen credential; "you pay per credit"; 200 MB upload limit | `SK/hyperframes-cli/references/cloud.md` |
| `lambda`, `cloudrun` | Own AWS / GCP account | `lambda.md`, `cloudrun.md` |
| HeyGen voice, BGM, SFX, image, icon | `heygen` CLI >= v0.3.0 with `heygen auth login --oauth`. Free allowance for HeyGen TTS stated as 10 min/month | `SK/media-use/references/setup-providers.md`, `requirements.md` |
| Offline fallbacks | Kokoro TTS, MusicGen BGM, bundled SFX library | `requirements.md`, `sfx.md` |
| `figma` | `FIGMA_TOKEN` | `SK/hyperframes-cli/SKILL.md` |
| `snapshot --describe` | `GEMINI_API_KEY`, runs by default when the key is set | `snapshot --help` |

Workflow behaviour to know: workflows run `npx hyperframes auth status` in Setup and, in collaborative mode, wait for the user to sign in or choose offline. [`SK/faceless-explainer/SKILL.md` Step 0]

### Telemetry and outbound calls

- Anonymous usage telemetry, **on by default**. On the machine checked, `~/.hyperframes/config.json` had `telemetryEnabled: true`.
- Off switches: `npx hyperframes telemetry disable`, `HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`.
- Events carry `sandbox_runtime` and `agent_runtime` (detects `claude_code` by env var existence). [`upgrade-info-misc.md`]
- `media-use` sends events to PostHog; when signed in to HeyGen "usage is linked to your account email". [`SK/media-use/references/meta.md`]
- The CLI skill tells the agent to send `npx hyperframes feedback --rating <0-10>` after every verified render, to "a public channel". [`SK/hyperframes-cli/SKILL.md`]
- `init` checks skills against GitHub on every run; `--skip-skills` is "temporarily ignored"; opt out with `HYPERFRAMES_SKIP_SKILLS=1`.
- Default font path: a non-bundled Google font is fetched from Google Fonts at build time. [`SK/hyperframes-creative/references/typography.md`]

---

## 3. CLI map

All from live `--help`, CLI 0.8.81, unless marked.

### Set up
| Command | Does |
| --- | --- |
| `init [NAME]` | Scaffold a project. Flags: `--example`, `--resolution`, `--video`, `--audio`, `--tailwind`, `--non-interactive`, `--skill` |
| `capture [URL]` | Capture a website as editable HyperFrames components; screenshots, tokens, assets |
| `skills check` / `skills update [names]` / bare `skills` | Check, refresh, or install the skill pack |
| `doctor` | Check system dependencies and environment |
| `browser ensure\|path\|clear` | Manage the Chrome used for rendering |
| `upgrade [--check] [--project]` | Check CLI version; bump a project's pinned scripts |
| `auth login\|status\|logout\|refresh` | HeyGen credentials |
| `telemetry enable\|disable\|status` | Manage anonymous telemetry |
| `docs [TOPIC]` | Inline docs: `data-attributes`, `examples`, `rendering`, `gsap`, `troubleshooting`, `compositions` |
| `figma asset\|tokens\|component` | Import from Figma over REST |

### Author
| Command | Does |
| --- | --- |
| `catalog [--query] [--type] [--tag] [--on-device]` | Search or browse registry blocks and components |
| `add <NAME>` | Install a block, a component, or every block with a tag |
| `timeline [DIR]` | Print tracks and clips. Sub-commands `move`, `trim`, `split`, `delete`, `set`, `duplicate`, `ids`, `apply`, `undo` |
| `history show\|undo\|restore\|peek\|pin\|begin\|end` | The project's recorded changes |
| `compositions` | List every composition in a project |
| `info` | Project metadata |
| `media-treatment` | Discover, apply, clear deterministic looks on one `<img>` or `<video>` |
| `media-use resolve\|doctor\|stats\|adopt\|candidates\|reuse\|from\|params\|analyze` | Resolve and operate on project media |

### Check
| Command | Does |
| --- | --- |
| `lint` | Static validation of `index.html` and `compositions/` |
| `check` | Lint, runtime, layout, motion, WCAG contrast in one browser session. The final gate. Default 9 samples |
| `snapshot [--at] [--frames] [--zoom] [--angle] [--against]` | Still PNGs at chosen times; default 5 frames; writes `snapshots/` |
| `keyframes [--shot] [--ghost] [--angle]` | Keyframe listing and onion-skin diagnostics |
| `compare <paths>` | Variants at one timestamp on one labelled sheet, max 16 |
| `grade-compare --for` | Candidate colour grades on one reference frame |
| `validate`, `inspect`, `layout` | Deprecated aliases of parts of `check` [stated in skill] |

### Preview
| Command | Does |
| --- | --- |
| `preview [--background] [--port 3002]` | Start Studio. Also `--status`, `--stop`, `--list`, `--kill-all`, `--selection`, `--context` |
| `play [--port 3003]` | Lightweight browser player, no editor |
| `present [--port 3004]` | Slideshow deck in presenter mode with audience sync |

### Audio and media preprocessing
| Command | Does |
| --- | --- |
| `beats [DIR]` | Detect beats in the music track (headless Chrome), write `beats/<audio>.json` |
| `tts [INPUT]` | Local speech with Kokoro-82M only |
| `transcribe <INPUT>` | Word-level timestamps; engines `parakeet`, `whisper`; imports `.json`, `.srt`, `.vtt` |
| `normalize-audio --reference --target` | Match one clip's loudness to another by integrated LUFS |
| `remove-background [INPUT]` | Transparent WebM, ProRes 4444 or PNG via local model |

### Render
| Command | Does |
| --- | --- |
| `render` | Formats `mp4`, `webm`, `mov`, `gif`, `png-sequence`, `hls`. Quality `draft`, `looks` (default, CRF 16), `delivery`. `--batch`, `--variables`, `--docker`, `--workers`, `--low-memory-mode`, `--resume` |
| `benchmark` | Render with 5 preset configs, compare speed and size |
| `cloud render\|list\|get\|delete` | HeyGen-hosted render |
| `lambda ...`, `cloudrun ...` | Self-managed distributed render on AWS or GCP |

### Publish and report
| Command | Does |
| --- | --- |
| `publish [--public] [--update] [--space]` | Upload source to a stable hosted URL, private by default |
| `feedback --rating` | Anonymous feedback; `--search-miss` reports a catalogue gap; `--file-issue` publishes a repro |
| `events` | Skill-usage telemetry event. Skill says agents should not call it by hand |

Disagreements between skill text and live CLI:
- `render --fps`: skill table says `24, 30, 60`; CLI accepts 1 to 240 and rationals such as `30000/1001`.
- `timeline`: skill describes a read-only printer; CLI has edit sub-commands.
- `history`: exists in CLI, not described in any installed skill.
- `play`, `figma`, `events`, `media-use` respond to `--help` but are absent from the top-level `--help` list.
- `SK/faceless-explainer/SKILL.md` renders with `--quality high`; the CLI skill calls `high` a legacy name for `delivery`.
- `SK/hyperframes-cli/references/init-and-scaffold.md` lists the skill pack as including `-media`; the current skill is named `media-use`.

---

## 4. Skill family map

### Installed with the family

| Skill | Owns | Load when | Must not be used for |
| --- | --- | --- | --- |
| `hyperframes` (26 files) | Entry point: project state, intent interview, routing, brief / storyboard / review / production / dispatch / frame-worker contracts | Any fresh video request; resuming a project | Writing composition HTML; it never owns execution |
| `hyperframes-core` (11) | Composition contract: `data-*`, clips, tracks, sub-compositions, variables, determinism, creator editing recipes | Before writing any composition HTML; cut, trim, reorder | Motion craft, creative direction, mixing |
| `hyperframes-cli` (11) | The dev loop and every command contract | Running or diagnosing any command | Choosing media or motion |
| `hyperframes-animation` (122) | Rules, blueprints, transitions, techniques, runtime adapters, animation map script | Any motion task | Composition contract; brand decisions |
| `hyperframes-creative` (79) | Design spec, frame presets, palettes, typography, visual styles, narration, beat direction, audio-reactive, storyboard recipe | Look, pacing, script | Animation recipes; must not override core rules |
| `hyperframes-keyframes` (3) | Seek-safe keyframes, camera moves, `hyperframes keyframes` diagnostics | Punch-in, Ken Burns, reframe, 3D depth, match or whip handoff | "broad scene strategy, brand design, media sourcing, captions, or general video planning"; source cuts |
| `hyperframes-registry` (12) | Search, install, wire blocks and components; contributing new items | Before hand-building any named look | Examples (`init --example` instead) |
| `hyperframes-studio` (1) | Timeline layout conventions and safe zones | Building a project people open in Studio | How to perform an individual edit |
| `hyperframes-audio` (7) | Mixing placed audio: fades, automation, carve, effect chain, submix bus | Audio already on the timeline needs mixing | Sourcing or generating audio; clip timing |
| `media-use` (90) | Resolve, generate, operate, remember media: BGM, SFX, image, icon, logo, voice, grade, LUT; TTS, transcription, captions; media treatments | Any asset, sound, voice, caption or footage-look need | Placed-track mixing; playback |
| `faceless-explainer` (24) | Workflow: text to narrated explainer with invented visuals | Topic, article or notes, no product and no site | Videos built from a website; anything unclear goes back to `/hyperframes` |

### Named by the entry skill, **not installed by default**

On the machine checked these were absent.

| Skill | Route trigger (from `SK/hyperframes/references/routes/<name>.md`) |
| --- | --- |
| `general-video` | Any custom video; also executes every `flow: companion` brief |
| `product-launch-video` | Promo, launch, site tour from a URL; uses `capture` |
| `pr-to-video` | Explain a GitHub PR, read through `gh` |
| `motion-graphics` | Short unnarrated unit, typically under 10 s; MP4 or alpha WebM/MOV |
| `music-to-video` | Beat-synced video driven by `audiomap.json` |
| `slideshow` | Navigable deck with `SlideshowController`; "not an MP4" |
| `embedded-captions` | Captions on existing footage, caption identity catalogue |
| `talking-head-recut` | Designed overlay cards on existing footage |
| `remotion-to-hyperframes` | Port existing Remotion source |
| `figma` | Import assets, tokens, components, storyboard frames |
| `animate-text` (external, `pixel-point/animate-text`) | 24 named text effects; deliberately not vendored |

They install lazily with `npx hyperframes skills update <name>`. That command was not run, so their contents are unknown.

---

## 5. The entry skill's own flow

Source: `SK/hyperframes/SKILL.md` and `SK/hyperframes/references/`.

### Step 1: start from project state (first match wins)

| State | Action |
| --- | --- |
| Explicit Remotion port | Route directly, skip intent layer |
| Specific operation on an existing project | Do only that, load `/hyperframes-cli` |
| Specific edit | Make the edit; use `npx hyperframes timeline --json` instead of reading HTML |
| `BRIEF.md` exists | Read `workflow` and `flow`, execute, ask nothing |
| `hyperframes.json` or `STORYBOARD.md` exists | Resume; at most one routing question |
| Fresh creation | Run the intent layer, then route once |

### Step 2: route table, by requested deliverable (priority order)

`remotion-to-hyperframes` → `slideshow` → `embedded-captions` → `talking-head-recut` → `music-to-video` → `motion-graphics` → `pr-to-video` → `product-launch-video` → `faceless-explainer` → `general-video`.

Rules worth carrying over:
- "A music file selects `/music-to-video` only when its beat grid drives the piece. Music used as a bed does not override the subject-matched route."
- "Specialized narrative workflows support up to about 3 minutes and are strongest around 30–90s."

### The intent layer: eight steps (`references/intent-interview.md`)

1. Memory before questions: `prefs.mjs get` and `recipe.mjs list` from `media-use`.
2. Triage the input: formed or unformed request.
3. Pick the route, read `routes/<workflow>.md`.
4. Pitch round, unformed requests only: five concepts on five paths, at least two with estimated probability below 0.10 (`references/pitch-round.md`).
5. Route must-haves: one question per field, recommended option first.
6. Two run-shape questions, kept separate: storyboard yes/no, and automation or companion.
7. Optional capability offer from `references/capability-menu.md`; design spec is a three-state ask.
8. Hand off: one integration check, stated and inferred fields shown apart, "Revision is not confirmation".

### What it asks the user

| Field | Policy (`references/brief-contract.md` § 2) |
| --- | --- |
| `message` | Derived and echoed as one sentence |
| `destination` | Asked only when unknown and it changes aspect |
| `aspect` | Derived: feed `1080x1080`, TikTok/Reels/Shorts `1080x1920`, YouTube/web `1920x1080` |
| `length`, `angle` | Recommended with a reason |
| `language`, `audience` | Inferred, stated |
| `narration` | Per route |
| `storyboard`, `flow` | Asked last |

Mode is derived, never asked: `companion` or `automation + storyboard: yes` → collaborative; `automation + storyboard: no` → autonomous. "Rendering remains user-gated in both modes."

### State files kept in a project

| File | Role | Defined in |
| --- | --- | --- |
| `hyperframes.json` | Project config: registry URL, install paths, owning skill, `media.autoProxy` | `SK/hyperframes-registry/references/install-locations.md` |
| `package.json` | Pinned `hyperframes@<version>` scripts | `SK/hyperframes/SKILL.md` |
| `BRIEF.md` | Confirmed intent; the only routing artifact; written right after `init` | `references/brief-format.md` |
| `STORYBOARD.md` | Plan: frontmatter plus `## Frame N` sections, status `outline` → `built` → `animated` | `references/storyboard-format.md` |
| `SCRIPT.md` | Locked narration, optional | `references/script-format.md` |
| `frame.md` | Design spec, always lowercase | `SK/hyperframes-creative/references/design-spec.md` |
| `storyboard.html` | Static sketch sheet the user reviews; cells `id="frame-NN"` | `SK/hyperframes-creative/references/storyboard-recipe.md` |
| `index.html`, `compositions/frames/NN-*.html` | The film | `references/production-loop.md` |
| `audio_meta.json`, `caption_groups.json` | Voice, word timings, BGM, SFX; caption groups | `SK/media-use/references/audio.md`, `SK/faceless-explainer/SKILL.md` |
| `.hyperframes/frame-packets/`, `.hyperframes/caption-skin.html`, `.hyperframes/anim-map` | Worker packets, caption skin, animation map | `references/frame-worker-core.md` |
| `.media/manifest.jsonl`, `.media/preferences.json`, `.media/recipes/` | Media ledger, remembered preferences, frozen recipes | `SK/media-use/references/memory.md` |
| `capture/`, `snapshots/`, `renders/`, `beats/` | Capture output, stills, renders, beat files | CLI references |

Personal-tier files outside projects: `~/.hyperframes/`, `~/.media/`, `~/.heygen/credentials`, `~/.cache/hyperframes/`, `~/.cache/puppeteer/`.

---

## 6. Catalogues it already has

### 6.1 Scene transitions

Files: `SK/hyperframes-animation/transitions/overview.md` (selection), `catalog.md` (hard rules, routing), `css-*.md` (code), `TRANSITION-REGISTRY.md` (machine subset).

CSS transitions, 32 names in 13 files (counted):

| Category file | Names |
| --- | --- |
| `css-push.md` | Push Slide, Vertical Push, Elastic Push, Squeeze |
| `css-radial.md` | Circle Iris, Diamond Iris, Diagonal Split |
| `css-3d.md` | 3D Card Flip |
| `css-scale.md` | Zoom Through, Zoom Out |
| `css-dissolve.md` | Crossfade, Blur Crossfade, Focus Pull, Color Dip |
| `css-cover.md` | Staggered Color Blocks, Horizontal Blinds, Vertical Blinds |
| `css-light.md` | Light Leak, Overexposure Burn, Film Burn |
| `css-distortion.md` | Glitch, Chromatic Aberration, Ripple, VHS Tape |
| `css-mechanical.md` | Shutter, Clock Wipe |
| `css-grid.md` | Grid Dissolve |
| `css-other.md` | Gravity Drop, Morph Circle |
| `css-blur.md` | Blur Through, Directional Blur |
| `css-destruction.md` | Page Burn |

Declared not to work in CSS: star iris, tilt-shift, lens flare, hinge/door.

Shader transitions (WebGL, package `@hyperframes/shader-transitions`, API `HyperShader.init`). Registry blocks, 14, from `SK/hyperframes-registry/references/discovery.md`:

| Block | Meaning |
| --- | --- |
| `chromatic-radial-split` | Chromatic aberration radial split |
| `cinematic-zoom` | Dramatic zoom blur |
| `cross-warp-morph` | Cross-warped morphing |
| `domain-warp-dissolve` | Fractal noise domain warping |
| `flash-through-white` | White flash crossfade |
| `glitch` | Digital glitch artifacts |
| `gravitational-lens` | Gravitational lensing distortion |
| `light-leak` | Cinematic light leak |
| `ridged-burn` | Ridged turbulence burn |
| `ripple-waves` | Concentric ripple distortion |
| `sdf-iris` | Signed-distance-field iris reveal |
| `swirl-vortex` | Swirling vortex distortion |
| `thermal-distortion` | Heat-haze distortion |
| `whip-pan` | Fast camera whip-pan |

"Use ≤2 per video." Block name is not the shader name.

Selection aids in `overview.md`: Energy → primary (calm, medium, high), Mood → type (9 moods), Narrative position (6), blur intensity, presets `snappy`, `smooth`, `gentle`, `dramatic`, `instant`, `luxe`.

Injector registry, 5 names valid as `transition_in`: `crossfade`, `blur-crossfade`, `push-slide` (LEFT/RIGHT/UP/DOWN), `zoom-through`, `squeeze`. Defaults: high energy `zoom-through`, calm `blur-crossfade`, max 2.0 s. Same five in `SK/faceless-explainer/scripts/lib/transitions.json`.

Within-frame cuts, built by workers, not valid `transition_in` values (`SK/faceless-explainer/references/cut-catalog.md`): Zoom-Through, Inverse Zoom-Through, Cut the Curve, Waterfall Cut.

Minor disagreement: `overview.md` puts 3D flip under Scale/zoom and Shutter and Clock Wipe under Reveal/mask; `catalog.md` gives them their own categories.

### 6.2 Motion rules

Index: `SK/hyperframes-animation/rules-index.md`. Bodies: `SK/hyperframes-animation/rules/<name>.md`. 48 files, 49 index entries (one rule listed twice), all GSAP based.

| Category | Rule | Meaning |
| --- | --- | --- |
| Text | `hacker-flip-3d` | Per-character 3D flip with deterministic glyph substitution |
| | `vertical-spring-ticker` | Slot-machine vertical scroll in a masked column |
| | `counting-dynamic-scale` | Count-up whose scale grows with the value (also under Data) |
| | `discrete-text-sequence` | Whole text states swapped at time thresholds |
| | `asr-keyword-glow` | Keyword glow synced to word timestamps |
| | `3d-text-depth-layers` | Offset text layers as fake extrusion |
| | `context-sensitive-cursor` | Typing cursor that changes colour per segment |
| | `dynamic-content-sequencing` | Phrase windows computed from a script |
| | `kinetic-beat-slam` | Phrases slam in on one shared beat array |
| | `gradient-text-sweep` | Gradient tweened through letterforms |
| | `chromatic-glitch` | RGB split or slice glitch on hashed quantised time |
| Data | `stat-bars-and-fills` | Growth bars, progress fill or ring, star-rating wipe |
| | `chart-scrub-readout` | Playhead scrubs a drawn chart, tooltip steps through data |
| Camera | `coordinate-target-zoom` | Zoom to an off-centre element, nested wrappers, `T = -offset` |
| | `camera-cursor-tracking` | Viewport locked to a moving typing cursor |
| | `multi-phase-camera` | Pull-back, focus, push phases plus micro-drift |
| | `viewport-change` | Single `.world` wrapper camera, `T = -offset × S` |
| | `3d-camera-flight` | Perspective flight through a 3D-laid-out DOM world |
| | `depth-of-field-blur` | Rack focus by tweened `filter: blur()` |
| Layout | `avatar-cloud-network` | Avatars on a ring with SVG lines to a centre |
| | `3d-page-scroll` | Webpage as tilted 3D card that scrolls |
| | `center-outward-expansion` | Cluster at centre expands to final positions |
| | `split-tilt-cards` | Two cards with opposing `rotationY` |
| | `orbit-3d-entry` | Flip in from 3D then settle into an orbit |
| | `ai-tracking-box` | Detection bracket box following a target |
| | `depth-scatter-assemble` | Elements scatter into or assemble from a 3D cloud |
| | `anchored-layout-expand` | Edge-pinned container grows along one axis, transform only |
| SVG | `svg-icon-enrichment` | Animate inner SVG parts of an icon |
| | `svg-path-draw` | Stroke draws itself by dash offset |
| Ambient | `sine-wave-loop` | Finite breathing loop |
| | `ambient-glow-bloom` | Soft radial glow behind a hero, peak opacity ≤ ~0.45 |
| Transition and motion | `reactive-displacement` | Entering element shoves the exiting one |
| | `press-release-spring` | Button press and spring recovery |
| | `physics-press-reaction` | Click compression on target and cursor together |
| | `cursor-click-ripple` | Cursor travel, press, expanding ripple |
| | `cursor-drag` | Grab, travel with ghost, drop-snap |
| | `multi-cursor-choreography` | 2 to 4 labelled cursors on one canvas |
| | `control-target-sync` | Control and bound target change in the same beat |
| | `scale-swap-transition` | Morph between two elements at one centre |
| | `card-morph-anchor` | Container morphs size, radius, surface between shots |
| | `theme-crossfade-morph` | Whole theme re-skins under a fixed anchor |
| | `spring-pop-entrance` | Canonical entrance pop, `back.out` |
| | `motion-blur-streak` | Fake directional velocity blur |
| | `waterfall-entry` | Staggered arrival cascade |
| | `particle-burst` | Deterministic confetti or dot burst, **cap ~40 particles** |
| | `nudge-curve` | Slow-fast-slow group slide |
| Recipes | `gsap-effects` | Drop-in patterns: typewriter, audio visualizer |
| | `css-marker-patterns` | Marker modes: highlight, circle, burst, scribble, sketchout |

### 6.3 Scene blueprints

Index: `SK/hyperframes-animation/blueprints-index.md`. Bodies: `blueprints/<id>.md`. 22, "reverse-engineered from 178 golden product-launch clips". Roles: Hook, Problem, Product_Intro, Key_Feature, Benefits, Social_Proof, CTA, Brand_Outro.

| Blueprint | Duration | Meaning |
| --- | --- | --- |
| `kinetic-type-beats` | 3.0–12.9 s | Bold type, the motion is the words changing; workhorse, 6 roles |
| `typewriter-reveal` | 3.6–7 s | A caret types and edits a line, then brand payoff |
| `spatial-pan-stations` | 7–10 s | Stations on one oversized canvas, one camera pans between them |
| `camera-journey` | 5.6–11.1 s | Multi-leg camera trip; sub-shape A action roundtrip, B cursorless 3D flight |
| `zoom-out-workspace-reveal` | 6.8–11 s | Tight detail, one decelerating zoom-out reveals the whole |
| `constellation-hub` | 5–8 s | Nodes ring a centre, then resolve on the core |
| `grid-card-assemble` | 3.0–10.5 s | Items self-assemble into a grid or list |
| `logo-assemble-lockup` | 4.4–11 s | A mark comes to exist and resolves to a lockup |
| `cursor-ui-demo` | 4.0–12.9 s | Cursor drives a reconstructed UI |
| `device-surface-showcase` | 5–11.3 s | Device mockup held as hero while screens cycle |
| `prompt-type-submit-generate` | 5.2–12 s | Prompt types in, the machine answers |
| `agent-progress-theater` | 4.2–11.6 s | Loaders and status, then a checklist that checks off |
| `panel-edit-live-sync` | 5.3–11.9 s | Inspector control and bound surface update together |
| `transcript-scroll-artifact-reveal` | 5–11.8 s | Long surface traversed, then artifact reveal |
| `dataviz-countup` | 4–12 s | Count-up, chart, stat grid as hero |
| `titlecard-reveal` | 3–5 s | One calm title with one restrained move |
| `comparison-split` | 4–6 s | Two items with mirrored book-open tilts |
| `overwhelm-surround` | 6–9 s | Accumulation until surrounded |
| `ticker-takeover` | 5–7 s | Cycling word replaced by a hero crashing in |
| `fixed-anchor-cycle` | 6.6–11.1 s | One pinned element, surroundings cycle |
| `video-text-pivot` | 6–8 s | Video slides aside for a stat, then kinetic text |
| `cta-morph-press` | 4–6 s | Mark condenses into CTA, cursor clicks |

13 runnable examples: `SK/hyperframes-animation/examples/*.html`.

### 6.4 Techniques

File: `SK/hyperframes-animation/techniques.md`. 13:

1. SVG Path Drawing. 2. Canvas 2D Procedural Art. 3. CSS 3D Transforms. 4. Per-Word Kinetic Typography. 5. Lottie Animation. 6. Video Compositing. 7. Character-by-Character Typing. 8. Variable Font Axis Animation. 9. GSAP MotionPathPlugin. 10. Velocity-Matched Transitions. 11. Audio-Reactive Animation. 12. Clip-Path Reveal Masks. 13. WebGL Fragment Shader Art.

Plus `SK/hyperframes-animation/references/motion-blur.md` and the 24 external `animate-text` effect ids listed in `adapters/animate-text.md`.

### 6.5 Runtime adapters

Folder: `SK/hyperframes-animation/adapters/`. The skill counts seven runtimes.

| Runtime | File | Hook | Note |
| --- | --- | --- | --- |
| GSAP | `gsap.md`, `gsap-easing-and-stagger.md`, `gsap-timeline-and-labels.md`, `gsap-transforms-and-perf.md` | `window.__timelines` | "default for 95% of motion work" |
| Lottie / dotLottie | `lottie.md` | `window.__hfLottie` | `autoplay: false` |
| Three.js / WebGL | `three.md` | `hf-seek` event, `window.__hfThreeTime` | No duration auto-inference; root `data-duration` required |
| Anime.js v4 | `animejs.md` | `window.__hfAnime` | No auto-discovery on v4 |
| CSS keyframes | `css-animations.md` | computed `animation-name` | Finite duration and count |
| WAAPI | `waapi.md` | `document.getAnimations()` | `fill: "both"` |
| TypeGPU / WebGPU | `typegpu.md` | `hf-seek` with `waitUntil`, `window.__hfTypegpuTime` | `data-requires-webgpu` |
| (pattern) HTML-in-canvas | `html-in-canvas-patterns.md` | `drawElementImage` | 10 effects; "1-3 hero beats per video" |
| (external) animate-text | `animate-text.md` | separate skill | 24 effect ids |

HTML-in-canvas effects named: 3D Rotation with Bloom, Magnetic Cursor Distortion, Shatter, Liquid Surface, Portal, Noise Dissolve, Holographic, Scan Lines + CRT, Frosted Glass Blur, Pixel Sort.

### 6.6 Registry

Files: `SK/hyperframes-registry/SKILL.md`, `references/discovery.md`. Two item kinds: blocks (sub-compositions with own size, duration, timeline) and components (snippets pasted into a host).

Counts claimed, three different numbers:

| Claim | Where |
| --- | --- |
| "roughly 400 hosted items" | `SK/hyperframes-registry/SKILL.md` description |
| "~400 blocks and components" | `SK/faceless-explainer/SKILL.md` Step 4 |
| "97 of the registry's 180 blocks" | `SK/hyperframes-registry/references/discovery.md` |
| "50+ installable scene compositions" | `SK/hyperframes/references/capability-menu.md` |

Live count not taken; see Open questions.

Block categories in `discovery.md` (heading count, rows actually listed):

| Category | Heading count | Listed | Examples |
| --- | --- | --- | --- |
| Shader transitions | 14 | 14 | see 6.1 |
| Transition galleries | 13 | 13 | `transitions-push`, `transitions-dissolve`; reference only |
| Liquid Glass | 7 | 5 | `ios26-liquid-glass`, `macos-tahoe-liquid-glass`, `vfx-liquid-glass` |
| VFX | 6 | 6 | `vfx-iphone-device`, `vfx-liquid-background`, `vfx-magnetic`, `vfx-portal`, `vfx-shatter`, `vfx-text-cursor` |
| Showcases | 6 | 6 | `app-showcase`, `apple-money-count`, `nyc-paris-flight` |
| Maps + data viz | 8 | 9 names | `us-map`, `world-map`, `data-chart`, `flowchart` |
| Social overlays | 7 | 7 | `x-post`, `yt-lower-third`, `macos-notification` |
| Branding + 3D UI | 2 | 2 | `logo-outro`, `ui-3d-reveal` |
| Code snippets | 24 | 1 | `code-snippet-apple-terminal-pro`; second chrome family not named |
| Code animations | 9 | 8 | `code-typing`, `code-diff`, `code-morph`, `code-3d-extrude`, `code-particle-assemble` |

Components listed: `grain-overlay`, `shimmer-sweep`, `morph-text`, `grid-pixelate-wipe`, `parallax-zoom`, `parallax-unzoom`. Also named elsewhere: `motion-blur`, `shutter-slam`.

Init examples (closed set, `init-and-scaffold.md`): `blank`, `warm-grain`, `play-mode`, `swiss-grid`, `vignelli`, `decision-tree`, `kinetic-type`, `product-promo`, `nyt-graph`.

Search: query in English only. Default tier ranks on shared words; `--on-device` ranks by meaning after a consented ~33 MB download.

### 6.7 Design systems, palettes, typography

| Catalogue | Count | Path | Names |
| --- | --- | --- | --- |
| Frame presets | 13 | `SK/hyperframes-creative/frame-presets/<name>/FRAME.md` plus `frame-showcase.html`, `caption-skin.html` | `biennale-yellow`, `blockframe`, `blue-professional`, `bold-poster`, `broadside`, `capsule`, `cartesian`, `cobalt-grid`, `code-editorial`, `coral`, `creative-mode`, `daisy-days`, `editorial-forest` |
| Visual styles | 8 | `SK/hyperframes-creative/references/visual-styles.md` | Swiss Pulse, Velvet Standard, Deconstructed, Maximalist Type, Data Drift, Soft Signal, Folk Frequency, Shadow Cut |
| Palettes | 9 files, 8 rows each | `SK/hyperframes-creative/palettes/*.md` | `bold-energetic`, `clean-corporate`, `dark-premium`, `jewel-rich`, `monochrome`, `nature-earth`, `neon-electric`, `pastel-soft`, `warm-editorial` |
| Bundled fonts | 18 families | `SK/hyperframes-creative/references/typography.md` | Inter, Roboto, Open Sans, Lato, Nunito, Montserrat, Poppins, Outfit, Oswald, League Gothic, Archivo Black, Playfair Display, EB Garamond, Space Mono, IBM Plex Mono, JetBrains Mono, Source Code Pro, Noto Sans JP |
| Other guidance | | `references/house-style.md`, `video-composition.md`, `motion-principles.md`, `beat-direction.md`, `narration.md`, `story-spine.md`, `data-in-motion.md`, `design-picker.md` | |

Every frame preset says "Motion out of scope" and documents 1920×1080 primary with 9:16 and 1:1.

Typography facts: video sizes are body ≥ 20 px, headline ≥ 60 px full screen; in-feed body ≥ 32 px, headline ≥ 90 px. A "Banned" list of 19 overused fonts overlaps the bundled set. Bundled and not banned: Montserrat, Oswald, League Gothic, Archivo Black, Space Mono, IBM Plex Mono, JetBrains Mono, Source Code Pro, Noto Sans JP. **No Vietnamese coverage statement found** for any bundled family.

Narration: "2.5 words per second"; 60 s ≈ 150 words.

### 6.8 Caption styles

File: `SK/media-use/audio/references/captions/authoring.md`, `motion.md`. 15 registry caption components, tag `caption-style`:

| Component | Best for |
| --- | --- |
| `caption-highlight` | TikTok-style highlight |
| `caption-pill-karaoke` | Karaoke pill, lyric videos |
| `caption-editorial-emphasis` | Documentary, storytelling |
| `caption-glitch-rgb` | Tech, gaming |
| `caption-kinetic-slam` | Full-screen slam |
| `caption-neon-glow` | Neon |
| `caption-neon-accent` | Multi-colour neon |
| `caption-clip-wipe` | Wipe reveal |
| `caption-gradient-fill` | Gradient fill |
| `caption-matrix-decode` | Sci-fi decode |
| `caption-emoji-pop` | Social, casual |
| `caption-parallax-layers` | Depth |
| `caption-particle-burst` | Celebration |
| `caption-texture` | Lava texture |
| `caption-weight-shift` | Typographic |

Related: `caption-blend-difference`. Tone table: Hype, Corporate, Tutorial, Storytelling, Social. Word grouping 2–3, 3–5, 4–6 words by energy. Karaoke highlight is the baseline at every energy level.

### 6.9 Audio features

| Feature | How | Path |
| --- | --- | --- |
| Beat detection for Studio | `npx hyperframes beats` writes `beats/<audio>.json`; needs `<audio data-timeline-role="music">` | `SK/hyperframes-cli/references/beats.md` |
| Beat and energy map for a film | `/music-to-video` → `scripts/analyze-beatgrid.py` → `audiomap.json`. **Not installed** | `SK/hyperframes/references/capability-menu.md` |
| Audio-reactive motion | Pre-extract bands with `extract-audio-data.py --fps 30 --bands 16`, sample per frame with `tl.call()` | `SK/hyperframes-creative/references/audio-reactive.md`, `scripts/extract-audio-data.py` |
| TTS | HeyGen Starfish (word timestamps) → ElevenLabs → Kokoro-82M local. `hyperframes tts` is Kokoro only | `SK/media-use/audio/references/tts.md` |
| Transcribe | Parakeet default, whisper.cpp fallback; always pass `--model` | `SK/media-use/audio/references/transcribe.md` |
| BGM | HeyGen catalogue retrieval; fallback Lyria then MusicGen | `SK/media-use/audio/references/bgm.md` |
| SFX | HeyGen retrieval, or bundled library | `SK/media-use/audio/references/sfx.md`, `audio/assets/sfx/manifest.json` |
| One-shot audio pass | `audio.mjs --request audio_request.json` → `audio_meta.json` | `SK/media-use/references/audio.md` |
| Mixing | `data-fx-chain`, `data-automation`, `data-fx-carve`, `<hf-audio-group>` bus | `SK/hyperframes-audio/SKILL.md`, `references/attributes.md` |
| Effects | gain, highpass, lowpass, peaking, lowshelf, highshelf, compressor, limiter, gate, saturate, bitcrush, delay, reverb, chorus, phaser | `references/fx-registry.md` |
| Presets | Voice: `voice-clean`, `voice-broadcast`, `voice-warm`. Repair: `rumble-cut`, `room-gate`, `boom-tame`, `harsh-tame`. Character: `telephone`, `radio-am`, `megaphone`, `lofi-tape`, `pa-system`, `intercom`, `doofus-worble`. Space: `room-tight`, `room-natural`, `hall`, `slap-echo`, `dub-throw` | `references/presets.md` |
| Voiceover carve | `node <SKILL_DIR>/scripts/carve.mjs --comp index.html`, default strength 0.8; "required whenever music plays under a voice" | `SK/hyperframes-audio/SKILL.md` |
| Loudness match | `npx hyperframes normalize-audio` | `references/diagnosis.md` |

Bundled SFX, 19 keys: chime, click-soft, click, error, glitch-1, glitch-2, glitch-3, impact-bass-1, impact-bass-2, key-press, notification, ping, pop, riser, sparkle, typing, whoosh-cinematic, whoosh-short, whoosh.
Disagreement: `SK/media-use/SKILL.md` says "19-file library", `sfx.md` says "21-file library". The folder holds 19 mp3 plus `manifest.json` and `CREDITS.md`.

Stated limits: "HyperFrames does not provide automatic waveform sync or drift correction." Audio data is pre-extracted: "no Web Audio API, no runtime analysis". `compressor`, `limiter`, `gate`, `bitcrush` parameters cannot be automated.

---

## 7. Camera and keyframes

Source: `SK/hyperframes-keyframes/SKILL.md`, `references/keyframe-patterns.md`, `SK/hyperframes-core/references/creator-editing-recipes.md`, camera rules in `SK/hyperframes-animation/rules/`.

| Move | Mechanism | Limit stated |
| --- | --- | --- |
| Punch-in / punch-out | Keyframe `scale` with `x`/`y` on a non-timed wrapper inside the clip: `tl.to("#clip .inner", { scale: 1.35, xPercent: -8, duration: 0.18 }, 1)` | Target the inner wrapper, never the timed clip |
| Multi-state zoom or reframe | One wrapper kept alive, a pose ladder with per-segment easing | |
| Ken Burns / pan | `tl.fromTo("#clip .inner", { scale: 1.05, xPercent: 0 }, { scale: 1.2, xPercent: -12, duration: 4, ease: "none" }, 0)` | "authored geometry, not automatic face tracking" |
| Crop / mask reframe | Interpolate `clip-path` on the inner wrapper | Not a temporal trim |
| Zoom to off-centre target | `coordinate-target-zoom`: outer scales, inner translates, `T = -offset` | Measure once after `fonts.ready`, never per frame |
| Virtual camera | `viewport-change`: one `.world`, state `cam {scale,x,y}`, `T = -offset × S` | The two formulas are not interchangeable |
| Phased camera with drift | `multi-phase-camera`: phase scale plus sine drift, frequency ratio ≈ 1.3 | Background on `.scene`, not on the camera |
| 3D depth, DOM | `3d-camera-flight`: static `perspective` stage, `preserve-3d` world, state `cam {x,y,z,rx,ry}`, one writer `applyCamera()`, order `translate3d` then `rotateX` then `rotateY` | "A `filter` on a `preserve-3d` element flattens it"; poses authored by eye, "don't hand-derive 3D projections" |
| Rack focus | `depth-of-field-blur`: `--dof` variable on non-focal layers | |
| 3D depth, canvas | Three.js camera, target, object transform from a GSAP proxy or `hf-seek` | Verify with `keyframes --ghost` |
| Whip pan | Registry shader block `whip-pan`; or `nudge-curve` plus `motion-blur-streak` on one window | Search the registry before hand-authoring |
| Match cut | Animation skill owns the handoff, registry supplies primitives | "There is no automatic matching-frame discovery" |
| Speed ramp | `rate` lane in `data-automation`, log interpolation | |
| Freeze | Visual pose or final frame can hold | "Arbitrary mid-source freeze is not supported" |

Ease law for camera (`blueprints/camera-journey.md`): `power4.out` on dives and landings, `power2.inOut` on repositioning; spring easing on a camera "feels wrong".

Proof tools: `keyframes --shot` (onion skin), `--layout strip`, `--ghost` (canvas and WebGL), `--angle front|iso|top|side|rear-iso`, `snapshot --at`, `snapshot --angle`.

Motion blur (`references/motion-blur.md`): two routes. The `motion-blur` registry component, attribute `data-hf-motion-blur`, defaults `shutterAngle` 720, `samplesPerFrame` 16, costs N+1 subtree copies and N+1 seeks per frame; "Three marked elements is fine. Thirty is a different render." The engine's `motionBlur` render option smears the whole frame, final render only.

---

## 8. Studio

Source: `SK/hyperframes-studio/SKILL.md`, `SK/hyperframes-cli/references/preview-render.md`.

What it is: `npx hyperframes preview` starts a local server, default port 3002, and opens Studio in the browser: "the full timeline editor, where the user can play the video and edit anything by hand before rendering. This is the review surface, not just a viewer." Hot-reloads on file changes.

How a project is previewed:
- URL to hand over: `http://localhost:<port>/#project/<project-name>`. Without the hash, Studio loads with no project.
- `preview --background` keeps it alive; stop with `npx hyperframes preview --stop`; `--list`, `--kill-all` exist.
- `play`: lightweight player on port 3003 through the embeddable `<hyperframes-player>` web component, plain `http://localhost:<port>`. Player `playback-rate` clamped to `[0.1, 5]`.
- `present`: deck with presenter and audience sync, port 3004.
- `publish`: hosted URL that "renders in the browser".

What a viewer sees, as far as the files say:
- One timeline row per top-level element; track kinds `video`, `graphics`, `captions`, `audio`.
- Eye icon toggles `data-hidden`; fader writes `data-volume`; effect rack with a Voiceover carve module; automation lanes; preview safe-margin toggle; element selection readable by the agent through `preview --context --json`.
- Studio uses Tailwind v3; `init --tailwind` scaffolds Tailwind v4.

Timeline conventions:
1. Every scene is a sub-composition; root holds only timed hosts, media, audio.
2. One caption track, one host marked `data-track-kind="captions"`.
3. One element kind per track.
4. No guide elements inside the composition.

Safe zones:

| Box | Share of frame | Inset each edge |
| --- | --- | --- |
| Action-safe | 90% | 5% |
| Title-safe | 80% | 10% |

Both framings, wide and vertical, use the same two boxes.

Disagreement on where captions and content may sit:

| File | Rule |
| --- | --- |
| `SK/hyperframes-studio/SKILL.md` | Captions and key content inside title-safe, 80% |
| `SK/hyperframes/references/frame-worker-core.md` | Caption pill owns the bottom ~17%; content above `0.83 × height` |
| `check --caption-zone` default | band from `y0=.82` |
| `SK/media-use/audio/references/captions/authoring.md` | Landscape bottom 80–120 px; portrait ~600–700 px from bottom |

None of these is a platform UI safe area for TikTok, Reels or Shorts.

---

## 9. Fit and limits

### 9.1 Where HyperFrames is strong

| Kind of video | Evidence [stated] |
| --- | --- |
| Narrated explainer with captions | `faceless-explainer` pipeline: TTS with word timings → duration sync → frames → captions → transitions. Sweet spot 30–90 s, cap about 3 min |
| Promo from a website | `capture` plus `product-launch-video` route; 22 blueprints mined from launch clips |
| Slides and decks | `slideshow` route, `present` command |
| DOM and SVG graphics | 48 GSAP rules; `check` audits layout, overlap, contrast on DOM boxes |
| Voice-over led pieces | `SCRIPT.md`, carve, reveals paced to `voiceover` |
| Captions on existing footage, overlays | `embedded-captions`, `talking-head-recut` routes |
| Short motion graphics, alpha overlays | `motion-graphics`; `render --format webm\|mov` with transparency |
| Data-driven batches | `render --batch rows.json`, composition variables |
| UI demos with cursor | Rules `cursor-click-ripple`, `cursor-drag`, `multi-cursor-choreography`, `control-target-sync`; blueprints `cursor-ui-demo`, `panel-edit-live-sync`, `prompt-type-submit-generate`, `agent-progress-theater` |
| Code walkthroughs | Registry headings "Code Animations (9)" and "Code snippets (24)" |

General claim in the files: "the framework renders anything a browser can run" (`transitions/catalog.md`).

### 9.2 Limits the files state

| Topic | Statement | File |
| --- | --- | --- |
| DOM particles | "cap ~40 — per-frame style writes; past that, seek perf and register degrade" | `rules/particle-burst.md` |
| HTML-in-canvas | "a separate, heavier capability"; "Use it for 1–3 hero beats per video, not every beat" | `techniques.md` |
| 3D hand plus bloom | "One genuine out-of-scope special remains ... needs R3F/Three.js + WebGL — a heavier capability than the rule library" | `blueprints-index.md` |
| Three.js | No duration inference. Avoid "Post-processing passes that depend on previous frame history unless you can reconstruct state from time". No `requestAnimationFrame` as source of truth. Pin renderer size and pixel ratio | `adapters/three.md` |
| WebGPU with DOM capture | Bundled headless shell does not support WebGPU plus `drawElementImage` together | `adapters/typegpu.md` |
| Video as GPU texture | "headless Chrome may fail `copyExternalImageToTexture` for video elements" | `adapters/typegpu.md` |
| Shader transitions | Capture DOM through html2canvas; six CSS restrictions (no `transparent` in gradients, no `var()`, and so on); composition roots forced transparent on that path | `transitions/overview.md`, `hyperframes-core/SKILL.md` |
| Software GL | "Heavy compositions can stall on software GL" | `preview-render.md` |
| Render cost | Each worker is a Chrome of ~256 MB; "60fps doubles render time" | `preview-render.md` |
| Motion blur | N+1 copies and N+1 seeks per target per frame | `references/motion-blur.md` |
| Gradients | Full-screen linear gradients on dark "band visibly under H.264 compression" | `video-composition.md` |
| `check` | "is not a visual gate. It passes compositions that render nothing" | `component-quality-bar.md` |
| Canvas diagnostics | "Use `--ghost` because marker boxes cannot see internal canvas motion" | `hyperframes-keyframes/SKILL.md` |
| Audio sync | No automatic waveform sync or drift correction | `hyperframes-audio/SKILL.md` |
| Audio mix | "Almost no static gate covers the mix"; verified by rendering and listening | same |
| Audio-reactive looks | "Never add: equalizer bars, spectrum analyzers, waveform displays ... generic particle systems ... abstract pulsing orbs" | `audio-reactive.md` |
| Captured live pages | "No iframes for captured content" | `motion-principles.md` |
| Registry offline | `add` needs the network every time | `hyperframes-registry/SKILL.md` |
| Length | Narrative workflows strongest 30–90 s; longer goes to `general-video` | `hyperframes/SKILL.md` |
| Sandboxed macOS agents | Chrome can die at startup in seatbelt sandboxes; "Do not build a substitute rasterizer" | `doctor-browser.md` |

### 9.3 Where a hand-written WebGL2 engine is the better tool

Each row: what the files give, then my conclusion.

| Need | What the files give [stated] | Conclusion [inferred] |
| --- | --- | --- |
| Full-frame shader as the picture | Technique 13 (one fullscreen quad driven by a GSAP proxy); `three` and `typegpu` adapters forward time only: "The adapter does not own your scene" | Possible, but HyperFrames adds a seek clock and an encoder, little else. Rules, blueprints, frame presets, `check` layout and contrast audits are all DOM-based and do not see inside a canvas. Hand-written engine is the better tool when the shader is the film |
| Tens of thousands of instanced lines or particles | DOM cap ~40. `keyframe-patterns.md` has one row "Instanced system — Three InstancedMesh". One block `code-particle-assemble` ("Thousands of GPU points") | No rule, blueprint or recipe teaches it. Hand-written engine |
| Flight camera through a 3D world | `3d-camera-flight` is CSS 3D on DOM cards and grids, poses tuned by eye. True 3D only through the Three.js adapter | Good for UI cards in depth. For a modelled world with a travelling camera, hand-written engine or plain Three.js |
| Per-frame pure-function rendering | `hf-seek` delivers `time`; `renderAt(time)` is the documented Three.js pattern; determinism rules match this model | The model fits. HyperFrames can host such a canvas as one layer |
| Sync to a measured beat grid | `kinetic-beat-slam` uses an even `PULSE` grid ("keep spacing even"). `beats` writes a Studio file whose format is not described. `audiomap.json` belongs to a skill not installed | Nothing found on tempo drift or on kick-following grids. For a drifting track, keep the project's own measured grid; hand-written engine |
| Post chain: bloom, grain | Bloom only as Three.js `UnrealBloomPass` inside HTML-in-canvas. Grain as `grain-overlay` DOM component, or `media-treatment` on a single `<img>`/`<video>`. History-based passes discouraged | No first-class post chain over the whole frame. Hand-written engine |
| Music visualizer look | Route text lists "music visualizer" as an output, while `audio-reactive.md` bans spectrum and waveform looks | The two files disagree. The taste rules steer away from this kind of film |

### 9.4 Mixed use [inferred]

- A WebGL canvas can sit as one layer under DOM titles and captions, driven by `hf-seek`. Both adapters are written for that.
- Useful parts to borrow without adopting the pipeline: caption components and grouping rules, the five-transition injector vocabulary, the voiceover carve, `snapshot --at` for single stills, the bundled SFX set, frame presets as look references.

### 9.5 Against the owner's rules [inferred]

The rules are those the reference films were made under; rule 10 of `SKILL.md` holds the general ones.

| Project rule | HyperFrames default | Consequence |
| --- | --- | --- |
| No video export | Every narrative workflow ends in `render` → MP4; the gate text says `renders/video.mp4` must exist | Stop before Deliver. A checked composition plus preview is the end state |
| Deliver HTML that plays, one viewer page | Playback needs `preview`, `play`, or `publish`. No file says `index.html` plays from `file://` | A HyperFrames project does not by itself meet the viewer-page deliverable. See Open questions |
| Stills only, one process at a time | `snapshot` and `check` each start headless Chrome; `render --workers auto` starts several | `snapshot --at` and `check` fit if run one at a time. Frame workers must not run the CLI, which `frame-worker-core.md` already forbids |
| No server left running | `preview --background` persists by design | Must call `npx hyperframes preview --stop` |
| No motion-blur sampling runs | `motion-blur` component seeks N+1 times per frame in the page; engine option samples sub-frames | Both fall under the rule |
| Scenes built by Opus sub-agents, lead reviews | One worker per frame, packets in `.hyperframes/frame-packets/`, sketch sheet reviewed first | Compatible in shape |
| Confirm storyboard before building | `storyboard: yes` review loop with `storyboard.html` | Compatible |
| No paid generation without asking | Cost rule: agent confirms before an agent-initiated paid call | Compatible; still, HeyGen sign-in is pushed at Setup |
| Instrumental bed, no vocals, above 130 BPM | BGM prompt table in `SK/media-use/audio/references/bgm.md` has base tempos 92 to 115 BPM, plus 10 for one archetype; Lyria `--bpm` guidance ends at 130 | Music sourcing here does not match the brief |

### 9.6 Rules that disagree inside the family

| Topic | File A | File B |
| --- | --- | --- |
| Building the timeline in async code | `hyperframes-core/references/determinism-rules.md`: "Building inside an async callback is supported" | `hyperframes-animation/SKILL.md`: "no timeline construction inside `async` / `setTimeout` / `Promise`"; `hyperframes-keyframes/SKILL.md`: never "async-created timelines" |
| Animatable properties | core: "no fixed allowlist"; `width`, `height` are "legitimate targets" | `rules-index.md`: "`width`/`height`/`top`/`left` tweens are forbidden"; animation SKILL cites "Core's allowlist" |
| `window.__timelines = window.__timelines \|\| {}` | core: not needed | `transitions/catalog.md` and `hyperframes-keyframes/SKILL.md` still write it |
| Fonts | core: a named family needs an in-file `@font-face` to a shipped file | `transitions/catalog.md`: "Just write the `font-family` you want"; `typography.md`: 18 bundled families need nothing, others are fetched from Google at build time |
| Exit animations | `transitions/overview.md`: "Exit animations are BANNED except on the final scene" | `techniques.md` #10 and `beat-direction.md` teach an accelerating exit tween in the outgoing composition |
| `data-track-index` | core: display only | `hyperframes-registry/SKILL.md`: "layer ordering (higher = in front)" |
| `class="clip"` on scenes | core: add it to timed visual clips | `transitions/catalog.md`: "No `class=\"clip\"` on scene divs in standalone compositions" |
| Entrance tween form | `transitions/overview.md`: use `fromTo`, not `from` | `minimal-composition.md` skeleton uses `tl.from` |

---

## 10. Open questions

1. Live registry size. Claims range from "50+" to "~400". `npx hyperframes catalog --json` would settle it; not run.
2. Whether a composition plays as plain HTML without `preview` or `play`, and how `<hyperframes-player>` is embedded in a page of one's own. No installed file answers. This decides if HyperFrames can meet the viewer-page deliverable.
3. Contents of the ten workflow skills that are not installed, above all `music-to-video`: `analyze-beatgrid.py`, the `audiomap.json` shape, and any handling of tempo drift.
4. Format and method of `beats/<audio>.json` from `hyperframes beats`. Not described.
5. How the engine `motionBlur` render option is switched on. No such flag in `render --help`.
6. OS support matrix. Not stated anywhere.
7. Live telemetry state as the CLI reports it. `telemetry status` not run; the config file says enabled.
8. `history` and the `timeline` edit sub-commands: no installed skill documents them.
9. Vietnamese glyph coverage of the 18 bundled fonts. Not stated.
10. Cloud render pricing per credit. Not stated.
11. The caption "identity" catalogue of `embedded-captions`. Not installed.
