# The HyperFrames route

What HyperFrames is, what it needs, which of its skills to load for which task, and how to use it inside this skill without breaking the owner's rules. The facts come from the skill files of the HyperFrames family and from read-only runs of its command line, version 0.8.81, on 2026-09-28. The full fact sheet, with its sources, is `hyperframes-facts.md`.

Load this when: `route-selection.md` sends a film to HyperFrames or to mixed use, the owner names HyperFrames, or a part of it (captions, sound, a transition, a still) is to be borrowed for an engine film.

Marking used in this file: **stated** means written in a HyperFrames skill file or printed by its command line. **Inferred** means a conclusion drawn from that. **Unknown** means no file answers.

## 1. What it is

| Matter | Fact |
|---|---|
| Idea | Video rendered from HTML. A composition is a page whose elements declare their timing in `data-*` attributes and whose animation runs on a timeline that can be sought |
| Maker | HeyGen. The package is `hyperframes` on npm, the source and the skills are at `github.com/heygen-com/hyperframes` |
| How frames are made | A pinned headless Chrome loads the composition, the runtime seeks it frame by frame, the frames are captured, ffmpeg encodes |
| Determinism | "Same input time, same pixels." Banned for anything visible: the wall clock, unseeded random numbers, fetching over the network at render time, pointer and scroll state, endless repeats |
| Default runtime | GSAP, with one paused timeline per composition, registered under the composition's id |
| Other runtimes | Lottie, Three.js, Anime.js, CSS keyframes, the Web Animations API, TypeGPU |

Its rule of determinism is the same as the engine route's first principle. That is why an engine canvas can sit inside a composition.

## 2. What it needs

| Item | Requirement | Note |
|---|---|---|
| Node.js | 22 or later | stated |
| ffmpeg and ffprobe | On the path | stated |
| Browser | Its own pinned headless Chrome, fetched with `npx hyperframes browser ensure` | stated |
| Docker | Only for renders in a container | stated |
| Python | Only for optional local speech, local music and the extraction of audio data | stated |
| Account | None for local work: lint, check, snapshot, preview, render | local render stated; the rest inferred |
| Account | Needed to publish, to render in its cloud, and for its voices, music, sound effects and images | stated |
| Operating systems | No list is given. Its files speak of macOS, Linux and Windows | unknown which is first class |

Check the machine with `scripts/check-environment.mjs --route hyperframes`, then with its own `npx hyperframes doctor`. Its doctor in JSON mode always exits with zero: read the field `ok` of what it prints.

### What it sends out

| Matter | Fact | Switch |
|---|---|---|
| Usage telemetry | On by default | `HYPERFRAMES_NO_TELEMETRY=1`, or `npx hyperframes telemetry disable` |
| A check of the skills against the source on every `init` | On by default | `HYPERFRAMES_SKIP_SKILLS=1` |
| A rating after a render | Its command line skill tells the agent to send one, to a public channel | Do not send without the owner's leave |
| Fonts | A family that is not bundled is fetched from a font service when the film is built | Use bundled families, or ship the files |

Tell the owner about these before the first run, and set the switches they choose.

## 3. The family of skills

Installed with `npx hyperframes skills`. Load the one that owns the task.

| Skill | Owns | Load when | Not for |
|---|---|---|---|
| `hyperframes` | The entry: project state, the interview, routing, the contracts for brief, storyboard, review and production | A fresh request; resuming a project | Writing a composition |
| `hyperframes-core` | The contract of a composition: timing attributes, clips, tracks, sub-compositions, variables, determinism | Before writing any composition | Motion, look, mixing |
| `hyperframes-cli` | The loop of work and every command | Running or diagnosing a command | Choosing media or motion |
| `hyperframes-animation` | Motion rules, scene blueprints, transitions, techniques, the adapters for the runtimes | Any task of motion | The contract; brand decisions |
| `hyperframes-creative` | The design spec, frame presets, palettes, type, visual styles, narration, direction of beats, pictures that answer sound | Look, pace, script | Recipes of animation |
| `hyperframes-keyframes` | Keyframes that survive seeking: punch in, reframe, slow push, 3D depth, hand-over by match or whip | A move of the camera | Strategy of scenes, captions, media |
| `hyperframes-registry` | Finding, installing and wiring ready blocks and components | Before building by hand any look that has a name | Examples |
| `hyperframes-studio` | How a timeline is laid out so that it reads well; safe zones | Building a project that people will open in its Studio | How to make one edit |
| `hyperframes-audio` | Mixing sound that is already placed: fades, automation, carving music under a voice, effects, a bus | Sound on the timeline needs mixing | Finding or making sound |
| `media-use` | Finding, making and remembering media: music, sound effects, images, icons, voice, captions, transcription | Any need for an asset | Mixing placed tracks |
| `faceless-explainer` | A workflow: from a text to a narrated explainer with invented pictures | A topic, an article, notes; no product and no site | Films built from a website |

Workflows that the entry skill names and that install on first use: `general-video`, `product-launch-video`, `pr-to-video`, `motion-graphics`, `music-to-video`, `slideshow`, `embedded-captions`, `talking-head-recut`, `remotion-to-hyperframes`, `figma`. Installing one is a download: ask the owner.

## 4. How its entry skill works

1. It starts from the state of the project. A brief file means "execute and ask nothing". A project file or a storyboard means "resume". Nothing means "interview".
2. It routes by what is to be delivered, in a fixed order of priority. Music selects the music workflow only when the beat drives the film; music as a bed does not.
3. It interviews in eight steps: see `interview.md`, section 9.
4. It writes the brief, then the storyboard, and asks for review when the run is "in company".
5. It dispatches one worker per frame of the storyboard.
6. It renders only on the owner's word: "Rendering remains user-gated in both modes."

Files it keeps in a project:

| File | Role |
|---|---|
| `BRIEF.md` | The confirmed intent. The one routing document |
| `STORYBOARD.md` | The plan: one section per frame, each with a status |
| `SCRIPT.md` | The narration, locked |
| `frame.md` | The design spec |
| `storyboard.html` | A sheet of sketches for review |
| `index.html`, `compositions/` | The film |
| `hyperframes.json`, `package.json` | The project and the pinned version |
| `audio_meta.json`, `caption_groups.json` | Voice, word timings, music, sound effects; groups of caption words |

## 5. The commands that matter

| Stage | Command | Does |
|---|---|---|
| Set up | `npx hyperframes doctor` | Checks the machine |
| | `npx hyperframes init NAME` | Makes a project |
| | `npx hyperframes capture URL` | Turns a website into editable components |
| Author | `npx hyperframes catalog --query "..."` | Searches the registry. The search is local |
| | `npx hyperframes add NAME` | Installs a block or a component. Needs the network |
| Check | `npx hyperframes lint` | Static checks |
| | `npx hyperframes check` | Lint, runtime, layout, motion and contrast, in one browser. The last gate. It is not a gate for the picture: it passes a composition that draws nothing |
| | `npx hyperframes snapshot --at 3.5` | Stills at chosen times |
| | `npx hyperframes keyframes --ghost` | Onion skins, also of canvas and WebGL |
| Preview | `npx hyperframes preview` | Starts its Studio on port 3002. The address must carry the project: `http://localhost:3002/#project/NAME` |
| | `npx hyperframes play` | A light player on port 3003 |
| | `npx hyperframes preview --stop` | Stops the server. Do this when the owner has watched |
| Sound | `npx hyperframes beats` | Finds beats in the music track, for the Studio |
| | `npx hyperframes tts`, `transcribe` | Local speech; word timings from a recording |
| Render | `npx hyperframes render` | The film as a file. Only on the owner's word |

Always look at stills. Its check is about structure; whether a frame is good is seen, not computed.

## 6. What it already has

Before writing anything by hand, look here. Names and paths are in `hyperframes-facts.md`, section 6.

| Catalogue | Size | Where in its skills |
|---|---|---|
| Page transitions | 32 names in 13 groups | `hyperframes-animation/transitions/` |
| Shader transitions | 14 blocks | the registry. "Use at most two per video" |
| Transitions safe to inject between scenes | 5: `crossfade`, `blur-crossfade`, `push-slide`, `zoom-through`, `squeeze` | `hyperframes-animation/transitions/TRANSITION-REGISTRY.md` |
| Motion rules | 48 | `hyperframes-animation/rules/` |
| Scene blueprints | 22, drawn from product launch films | `hyperframes-animation/blueprints/` |
| Techniques | 13 | `hyperframes-animation/techniques.md` |
| Frame presets | 13 | `hyperframes-creative/frame-presets/` |
| Visual styles, palettes | 8 and 9 | `hyperframes-creative/references/`, `palettes/` |
| Bundled type families | 18 | `hyperframes-creative/references/typography.md` |
| Caption components | 15 | `media-use/audio/references/captions/` |
| Bundled sound effects | 19 | `media-use/audio/assets/sfx/` |
| Registry of blocks and components | Its files give four different figures, from "50+" to "about 400" | the registry; count it with `catalog` |

The catalogues of this skill cross-refer to these by name: `transitions.md`, `art-styles.md`, `camera.md`, `effects.md`, `type-and-captions.md`.

## 7. Its limits, as its own files state them

| Matter | Limit |
|---|---|
| Page elements as particles | About forty |
| Page drawn into a canvas for effects | "For 1 to 3 hero beats per video, not every beat" |
| Three.js | No length is inferred; the root must state it. No effect that depends on earlier frames, unless the state can be rebuilt from the time |
| Shader transitions | They capture the page through a library that does not know every style: no `transparent` in gradients, no style variables, among others |
| Sound | "No automatic waveform sync or drift correction" |
| Pictures that answer sound | It advises against bars, spectra, waveforms and pulsing orbs |
| Motion blur | Each marked element costs many extra seeks per frame |
| Length | Its narrative workflows are strongest from thirty to ninety seconds |
| Registry | Installing needs the network every time |

## 8. Using it under the owner's rules

| Rule | How to keep it |
|---|---|
| No video export | Stop before `render`. The end state is a composition that passes `check`, has been looked at in stills, and plays in preview |
| Stills only, one process at a time | `snapshot --at` and `check`, one after the other. Workers that write frames do not run the command line |
| No server left running | `npx hyperframes preview --stop`, and `--list` to see that nothing is left |
| No spending without asking | Choose the offline path at set-up. Ask before any voice, music, image or cloud render that costs |
| Nothing sent out | Set the switches of section 2 before the first command |
| The owner approves the storyboard | Run "in company", with the sketch sheet |
| Builders on the latest Opus | Start its frame workers on that model |

## 9. Where its own files disagree

Eight disagreements were found between files of the family. They matter when a lint or a check complains about something another file allowed.

| Matter | One file | Another file |
|---|---|---|
| Building the timeline in asynchronous code | Supported | Forbidden |
| Which properties may be animated | No fixed list; width and height are legitimate | Width, height, top and left are forbidden |
| Fonts | A named family needs its file declared in the page | "Just write the family you want" |
| Animations that make a scene leave | Banned except on the last scene | Taught as a technique |
| The index of a track | For display only | Decides what lies in front |
| The class `clip` on scenes | Add it | Do not add it in stand-alone compositions |
| The form of an entrance | From a start to an end, both given | The minimal example gives only the start |
| The rates of frames that may be rendered | 24, 30, 60 | The command accepts 1 to 240 and fractions |

When two files disagree, the contract in `hyperframes-core` and the behaviour of the command line decide. Say in the report which was followed.

## 10. Unknown

| Question | Why it matters |
|---|---|
| Does a composition play as a plain page, without its preview, its player or its hosting? | It decides whether this route can deliver "a page that plays" |
| What is in the beat file that `beats` writes, and how does the music workflow handle a tempo that drifts? | It decides how far this route can follow a measured grid |
| Do its bundled type families cover Vietnamese? | A missing accent falls back to another face |
| How large is the registry today? | Its files give four figures |
| Which operating system is first class? | The owner may build on Windows |

Find the answer by trying, on a small project, before a film depends on it.
