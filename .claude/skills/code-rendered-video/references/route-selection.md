# Route selection

How to choose the way a film is built, from what the brief asks for. The skill knows two routes in depth, the engine route and the HyperFrames route, and names the others so that a request which belongs elsewhere is sent there.

Load this when: the brief is agreed and nothing has been set up yet, the owner names a tool, a request may not be a film at all (a game, a world to walk through, an edit of footage), or a film in progress turns out to need something its route cannot give.

## 1. The routes

| Route | What it is | The film is made of | It ends in |
|---|---|---|---|
| **Engine** | A small rendering engine written for the purpose, on WebGL2, with 2D canvas layers, line batches, shaders and 3D scenes. Every frame is a function of the time of the music | Shots written as code modules, one file each | A studio page that plays the film live. A video file only when asked for |
| **HyperFrames** | A framework that renders video from HTML. Timing is declared in the page, animation runs on a seekable timeline | HTML compositions, one per scene, with styles and a timeline | A video file, by way of its Studio for review |
| Mixed | The engine's canvas as one layer inside a HyperFrames composition, with titles, captions and sound from the framework | Both | A video file |

Tools installed on the machine are candidates. None is a requirement because it is there.

## 2. Decide by what the brief asks

Go down the table. The first row that fits decides, unless a later row contradicts it strongly.

| The brief asks for | Route | Why |
|---|---|---|
| A voice that reads a script, with captions that follow the words | Either | HyperFrames states speech with word timings, transcription, caption components and the music carved under the voice; none of it has been run here. The engine has a local voice or estimated word times, phrases placed on beats, ducking and caption groups (`references/sound-and-voice.md`). A Vietnamese voice needs edge-tts, which sends the text out, or a paid voice: ask |
| A film made from a website, a product's screens, or a pull request, with the site's own components kept as they are | HyperFrames | It captures a site into editable components and has scene blueprints drawn from launch films |
| A film made from a product's real screens, rebuilt so that they morph, on a beat | Engine | The research of `thinking-and-brainstorm.md`, section 2, then the screens rebuilt as shapes in a shot. See `short-pieces.md`, section 7.3 |
| Captions or overlay cards on existing footage | HyperFrames | It owns media playback and has workflows for both |
| A deck that is presented, not played | HyperFrames | It has a slideshow route with a presenter mode |
| An overlay with transparency, to be laid over other video | HyperFrames | It renders formats with an alpha channel |
| A short piece of 5 to 40 seconds: a showreel, a logo sting, a teaser, a UI piece, an ad | Engine, in the short lane | Drawn pictures on a beat, delivered as a page. `short-pieces.md` |
| Many versions of one film from a table of data | HyperFrames | Variables and batch rendering |
| Pictures that are shaders, or thousands of lines or particles | Engine | The framework's checks and recipes work on the page and do not see inside a canvas. Page elements used as particles are capped at about forty |
| A camera that travels through a modelled world | Engine | The framework's flight camera moves cards in depth, tuned by eye |
| Every event on the measured beat of a track, with drops | Engine | The engine reads a grid measured from the track, which may drift. The framework states that it corrects no drift |
| A finish over the whole frame: bloom, grain, halation, colour fringe | Engine | The framework has no chain of effects over the whole frame |
| A page that plays the film, and no video file | Engine | The framework's workflows end in a render. No file found says that a composition plays as a plain page without its server or its player. The engine's studio plays the film, and a single-file build of the finished film opens without a server (`studio-viewer.md`) |
| No load on the machine beyond single stills | Engine | The framework's render starts several browsers |
| Interfaces, text, charts, diagrams drawn as page elements | Either | Choose by what else the film needs |
| A captioned explainer of thirty to ninety seconds on a topic, with invented pictures | Either | With a voice, either: the engine when the pictures are drawn and the bed is composed; HyperFrames when a recorded voice must be transcribed. Cut to music with pictures that are drawn: engine |

From practice: two films were made on the engine route. Both were cut to a track made for them, with no voice; both used shaders, line batches and 3D; the second was delivered as a studio page because the owner forbade video export on that machine.

## 3. What each route is strong at

| | Engine | HyperFrames |
|---|---|---|
| Pictures | Anything that can be computed per pixel or per vertex | Anything a browser lays out: text, boxes, SVG, images, video |
| Sync | To a measured grid of beats, bars and sections; a voice's phrases placed on beats, its words at the voice's own times | To seconds; to word timings of a voice; to an even pulse |
| Camera | Free, flat or in space, per shot | Wrappers moved inside a clip; cards in depth |
| Transitions | Written for the film: see `transitions.md` | A catalogue of page transitions and shader blocks, at most two shader transitions a film |
| Words | Set by the overlay or by the shot | Page text; caption components |
| Sound | One finished track, the click of the grid, or a score, sound effects and a voice-over written in code and mixed with ducking and a limiter (`references/sound-and-voice.md`) | Tracks, mixing, effects, ducking, sound effects |
| Review | The studio page; stills and contact sheets | Its Studio, a timeline editor; snapshots; a check that audits layout, motion and contrast |
| Deliverable | A page. A file if asked | A file. A hosted page through its publish command |
| Cost of starting | Medium: the skill's starter (`assets/starter/`) brings the engine, the kit, the studio and the capture tool, and the film sets its own look: palette, fonts, zones, grounds, type voices, post presets | Low: a scaffold and a registry of ready parts |
| Cost per scene | A builder writes code and looks at stills | A worker writes a page from a recipe |
| Length it suits | Any; tried up to three minutes | Strongest between thirty and ninety seconds, to about three minutes |
| Who reads inside | Shaders and drawing code | HTML and CSS |

## 4. Mixed use

Three ways to take from both.

| Way | How | When |
|---|---|---|
| The engine's canvas inside a composition | The framework hands the time to a canvas through its seek event, and the canvas draws that time. The engine's rule that a frame is a function of time fits this exactly | A film that needs the engine's pictures and the framework's captions, voice and sound |
| Borrow parts, not the pipeline | Its caption grouping rules, its vocabulary of five safe transitions, its bundled sound effects, its frame presets as references for a look | An engine film that wants one of those |
| Stills from its tools | Its snapshot command makes single stills at chosen times | Review of a composition under a rule of "stills only" |

In mixed use, decide first which clock rules. With a measured grid the engine's clock rules and the framework is told the times. With a voice the word timings rule and the engine is told.

## 5. Named tools, and requests outside the method

### When a request names a tool

Tools named in a request are candidates, like tools installed on the machine. Say what the named tool would change, and what the skill offers instead, before choosing.

| Named tool | What it is | What the skill does |
|---|---|---|
| HyperFrames | A framework that renders video from HTML | The HyperFrames route of this skill: `hyperframes-route.md` |
| Remotion | A React-based framework that describes video as components and renders files | Not covered. Its usual end is a rendered file, which needs the owner's ask here; its licence is not a plain open-source one for every user, so read it before choosing. If the owner wants Remotion itself, say that this skill's starter, studio and checks do not apply, and keep the method's rules (a frame as a function of time, stills, no export unless asked). HyperFrames has a workflow that ports Remotion source |
| Manim, or another library for mathematical animation | Python libraries that render proofs, graphs and formulas to video files | Not covered. Its output is a rendered video file, which is an export under the owner's rules. Offer the engine route, which draws graphs, formulas and constructions in code and plays them as a page; or, if the owner wants that library, say that its render needs their ask |
| Blender | A 3D suite, scriptable in Python | Not a route of this skill. Its render is an export and loads the machine heavily. Models made there, as glTF, can be loaded into an engine shot by three.js. See `environment.md` for installing it |
| After Effects, "After Effects style" | A desktop compositing program | Read as a description of a look (layered, eased, composited motion), not as a tool to run. The engine route makes that look |
| GSAP | A JavaScript animation library with seekable timelines | Used by the HyperFrames route, one paused timeline per composition. The engine route does not use it: springs and eases are functions of time in the kit |
| Image or video generators (named models, paid services) | Sources of pictures or clips | Paid: ask the owner each time, with the price. Generated clips are footage (below) |
| Unity, Unreal, game engines | Engines for interactive games | Outside the method (below) |
| C or C++ with OpenGL, a native demo | A program that draws with the GPU outside the browser | Not covered. The engine route draws with WebGL2 in the browser, whose shaders are in nearly the same language, and plays as a page. A native program's film is a frame-by-frame render, which is an export under the owner's rules. Offer the engine route; if the owner wants native code, say that the starter and the studio do not apply |
| Python with ffmpeg | A script that draws frames and encodes them | Not covered: it is an export from the first frame. Offer the engine route and its studio. If the owner wants a file, the capture tool's `video` mode on the owner's ask |
| A tracker module (S3M, MOD, XM, IT) as the music | Music stored as patterns and samples, played by a tracker | The analysis reads audio files, so the module is first rendered to WAV by a module player, which is an install: ask. Its rows, speed and tempo give the beats exactly, so a grid can be written from them instead of measured. Untried |
| "No libraries", "one HTML file", "vanilla JavaScript" | A request for a single file without dependencies | The skill delivers the studio for work and a single-file build of the finished film (see `studio-viewer.md`), which carries three.js and the fonts inside it. Say so. If the owner means no library code at all, even bundled, the starter does not fit: tell the owner before starting; the method's rules still hold, and the builder writes plain WebGL2 or canvas code |
| Photoreal 3D, PBR, "as realistic as possible" | Physically based materials, light and lenses | The engine approaches it with three.js: environment light, physical materials, fog, depth of field, god rays. It costs frame time and builder rounds; say how close it will get. True photoreal (caustics, global illumination, realistic people) belongs to a 3D suite, whose render is an export and loads the machine: the owner's word |

### Requests that are not a film of this method

Some requests look like film requests and are not. Say so plainly, say what the skill can make instead, and let the owner choose. Do not build the other thing quietly under the name of a film.

| Request | What the skill does | What it does not do |
|---|---|---|
| A playable game, a game prototype, a game "in one HTML file" | A film about the game: a trailer, a reveal of a reward, a scripted run of play, drawn in code and cut to music. A piece that plays on a click (`short-pieces.md`, section 11) | The game itself: controls, rules, physics played live, levels, saving. That is software, outside this skill |
| An explorable 3D world: a house to walk through, a city, a planet to spin | A flight through that world as a film, on the engine route: the camera travels on the beat (`camera.md`) | Walking or orbit controls, a free camera, a world that the viewer steers |
| A web page effect: a header scrubbed by scrolling, a cursor that reveals a layer, a landing page | Nothing of the page. A film of the page's idea, if the owner wants a film | The component itself |
| A simulation as a toy: sand, fire, fluids, a physics sandbox | A film of a simulation, if it can be replayed exactly with a fixed step and seeded randomness: simulated once when the shot loads and looked up by time (`effects.md`, section 2), or a stateful scene that the engine simulates again after a seek from at most `prerollMax` seconds back (`engine-architecture.md`) | A toy the viewer plays with |
| An edit of camera footage: a talking head cut with subtitles, a demo recording edited, clips cut to music | Not this method. The engine can show pictures and short clips inside a drawn film, through its image layer and a sequence of frames extracted once (`engine-architecture.md`; the extraction with ffmpeg is a heavy run and needs the owner's word), but it does not cut footage. The HyperFrames route has workflows for captions on footage and for recutting a talking head (`hyperframes-route.md`); installing them is a download, so ask. Otherwise a video editor | Cutting footage on the engine route |
| A film made mostly of generated clips | Not this method. It is footage, and every generation is paid | Generating clips without the owner's word each time |
| A request that forbids skills, memories or connectors ("no skills, no MCP") | Honour it: do not use this skill's starter or chapters for that film, and say so at the start. The owner's standing rules in the project's rules file are not a skill and still hold: no export unless asked, no money, stills one at a time, nothing sent out. If it is unclear whether the ban means this skill or only outside services, ask; in the autonomous mode take the strict reading and write it down | Quietly using the starter anyway, or dropping the owner's rules along with the skill |

The owner may have skills of their own for a kind of film or for games. Ask before building what they already have.

## 6. Conflicts with the owner's rules

A route's defaults may run against what the owner has ruled. Check before starting.

| Owner's rule | Engine route | HyperFrames route |
|---|---|---|
| No video export | Meets it: the studio page is the film | Its workflows end in a render. Stop before that step; the end state is a composition that passes its checks, shown in preview |
| A page that plays, handed over | Meets it, with a development server | Needs its preview, its player or its hosting |
| Stills only, one process at a time | The capture tool holds a lock | Its snapshot and check each start a browser: run them one at a time. Never its render with several workers |
| No server left running | Stop the studio server when the owner has watched | Its preview in the background stays alive by design: stop it |
| No spending without asking | Music generation and cloud voices are the paid steps; a cloud voice also sends the script away | It offers paid voice, music, images and cloud rendering, and pushes a sign-in during set-up. Choose the offline path or ask |
| Nothing sent out | Nothing is | Telemetry is on by default. Switch it off: `HYPERFRAMES_NO_TELEMETRY=1`. Its skill asks the agent to send a rating after a render: do not, unless the owner agrees |
| Builders on a chosen model | One builder per section | One worker per frame, from packets: the same shape |
| Storyboard approved before building | The animatic in the studio | Its storyboard review with a sketch sheet |

## 7. Changing route in the middle

| Sign | Means | Do |
|---|---|---|
| A HyperFrames film needs a shot that is a shader or a field of particles | One shot outgrew the page | Put a canvas layer into that composition; keep the rest |
| An engine film gets a voice | Sync stays on beats: the voice's phrases are placed on beats, its words keep their own times | Keep the engine (`references/sound-and-voice.md`). Take speech and captions from the framework, in mixed use, only when a recorded voice must be transcribed |
| An engine film must become a file, on a machine that allows it | Delivery changed | The engine's capture tool has an export mode that is refused unless the owner asked. Ask, then use it |
| The owner wants to edit timing by hand | They want a timeline | The framework's Studio is a timeline editor. The engine's studio is a player |

## 8. Record the choice

Write into the project's state file: the route, the reason in two lines, the rows of section 6 that apply, and what was ruled out. The next session should not have to decide again.
