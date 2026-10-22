---
name: code-rendered-video
description: Direct and build a film whose pictures are drawn by code in the browser and cut to music or to a voice, from the first idea to a studio page the owner presses play on. Covers the interview, research of a real product or real figures, music and beat grid, sound written in code, voice-over with captions, a storyboard kept as data with an animatic, look, camera, transitions, effects, characters and wordless stories, builder agents, review by stills; a light lane for short pieces, with an autonomous mode. Chooses between a hand-written WebGL engine and HyperFrames. Use for explainers, data explainers, music visuals, lyric films, kinetic type, title sequences, showreels, logo stings, launch teasers, UI motion pieces, social ads, seamless loops, several formats, click-to-play reveals, pixel art, collage and powers-of-ten zooms, made without footage, also when a request names Manim, Remotion or Blender. Not for games, explorable worlds or editing footage.
license: MIT
metadata:
  version: "0.4"
  origin: "Written from two films made in the opus-videos repository, 2026-09"
---

# Code-rendered video

A film here is a program. Every frame is a function of the time of the music, so a still stands for the film, any moment can be sought, and what the owner sees in the studio is what a file would hold. The work is done by one **lead** (this session), which decides and reviews, and by **builder** agents, which build the shots.

## Terms

| Term | Meaning |
|---|---|
| Owner | The person who asked for the film. Decides subject, taste, money, and approves |
| Lead | This session. Decides the route, writes the storyboard and the rules, builds the shared layers, reviews |
| Builder | A sub-agent that builds the shots of one section |
| Story writer | A sub-agent that thinks a section or the film through and drafts shots and sentences for the lead |
| Section | A chapter of the film: a group of shots |
| Shot | One scene module, a few bars long |
| Beat, bar | Measured from the track, never computed from a tempo |
| Studio | The page on which the film plays, from storyboard cards to the finished film |
| Animatic | The studio playing storyboard cards with the music |
| Capture | A single still, or a sheet of stills, made for review |
| Reference films | The two films the method was written from: one horizontal of 135 seconds, one vertical of 172 seconds with 54 shots. Their code is not part of the skill; the starter is its generic copy. The "From practice" notes in the references tell what happened on them |

## Rules that hold on every film

1. **A frame is a function of time.** No wall clock, no unseeded random numbers, no state that cannot be rebuilt from the time.
2. **Look at the result.** Code that runs says nothing about whether the picture is good. Capture, look, judge, fix, capture again.
3. **The owner approves on paper, then on the animatic, then on a sample, before the film is built.** An approved table of contents is not leave to build. A short piece has two gates, and in the autonomous mode the gates become written decisions (see below).
4. **The lead does not build shots**, not even a sample, not even in a short piece. It builds the engine, the kit, the transitions, the overlay and the studio, and it reviews.
5. **On Claude, sub-agents that think the storyboard through and sub-agents that build shots run on the latest Opus model.** Name the model when starting the agent. The lead keeps its own model and owns the result. On another assistant, use its strongest model for long, careful work.
6. **Time is measured in beats read from the track.** Events land on beats. Never on seconds, never from a tempo number.
7. **One source of truth.** Shots, bars, transitions and every sentence live in two data files. The storyboard document, the shot times and the cards are generated from them.
8. **Taste belongs to the owner's ear and eye.** Measure what has a right answer. Do not argue taste with measurements.
9. **A shot must not be the picture of a neighbouring idea.** Write, per section, what it must show and what it must never show, and hold every shot against both.
10. **Nothing that costs money, loads the machine heavily, or leaves the machine happens without the owner's word.** No video export unless asked in this conversation. Captures one at a time. No server left running. Nothing of the owner's is uploaded. "Decide yourself" does not lift this rule.

## The phases

| # | Phase | Output | Gate | Load |
|---|---|---|---|---|
| 0 | Environment | The checker's report; what is missing and how to install it | Owner allows installs | `references/environment.md`, `scripts/check-environment.mjs` |
| 1 | Brief | One page: takeaway, audience, parts, frame, length, sound, look, deliverable, machine, money | **Owner confirms the brief** | `references/interview.md` |
| 2 | Route | Engine, HyperFrames, or mixed, with the reason | Stated to the owner | `references/route-selection.md`, `references/hyperframes-route.md`, `references/hyperframes-facts.md` |
| 3 | Thinking and concept | Per part: idea, problem, comparison, the thing, where met, must show, must never show. Three directions | **Owner picks a direction and approves the comparisons** | `references/thinking-and-brainstorm.md` |
| 4 | Music | Candidates; the owner's choice; a measured, checked beat grid; a map of the track in bars | **Owner picks the track by ear** | `references/music-and-beat.md`, `assets/starter/analysis/` |
| 5 | Storyboard | Shot list and sentences as data; generated document; the animatic in the studio | **Owner approves the storyboard and the sentences on the animatic** | `references/storyboard.md`, `references/transitions.md`, `references/camera.md`, `references/type-and-captions.md`, `references/art-styles.md` |
| 6 | Foundation | Engine, kit, overlay, studio, capture tool; a test that a capture equals playback | Lead's own check | `references/engine-architecture.md`, `references/studio-viewer.md`, `assets/starter/` |
| 7 | Sample section | One section built by one builder, reviewed, polished | **Owner approves the look on the sample** | `references/orchestration.md`, `references/effects.md` |
| 8 | Sections | Every section built by its builder; content round, then craft, then polish | Lead accepts each section | `references/orchestration.md`, `references/quality-gates.md` |
| 9 | Whole film | Cuts between sections, recap, title, end card, transition strength, performance | **Owner watches the finished film** | `references/quality-gates.md` |
| 10 | Hand-over | Studio running for the owner, or stopped with instructions; README; state written down | Owner accepts | `references/studio-viewer.md` |

Phases may overlap where they feed each other: the shape of the music decides the lengths in the storyboard. Gates do not overlap: at a gate the work stops and waits for the owner.

### Short pieces and the autonomous mode

A piece of about 5 to 40 seconds with one idea (a showreel, a sting, a teaser, a UI piece, an ad) takes the **short lane**: a few stated assumptions instead of the brief, a beat table in the shot data instead of the full storyboard, one builder for the whole piece, and two gates: the beat table with a few stills, and the finished piece. When the owner says "do not ask me, decide yourself", the gates become **written decisions** shown at the end; money, export, machine load, sending anything out and the roles still hold. Both are in `references/short-pieces.md`, with recipes, the seamless loop, several formats and pieces that play on a click.

## Phase notes

### 0. Environment

Run `node scripts/check-environment.mjs` with the route and the extras that apply. Show what is missing with the install commands; install only with the owner's word. Ask which browser the owner watches in.

### 1. Brief

Restate the request in three lines, list what is stated and what is inferred, then ask in rounds of at most four questions, each with options and the recommended one first. Write the brief page and show it. Keep the owner's own words in the project's state file. A film about a real product, brand or figures starts with the research of `thinking-and-brainstorm.md`, section 2: real screens, logo, copy, colours and figures, each with its source and its rights, nothing uploaded.

### 2. Route

The engine route for pictures that are shaders, fields of lines or particles, flights through a world, a measured beat with drops, a full-frame finish, and delivery as a page. The HyperFrames route for a recorded voice that must be transcribed, films made of a website's own components or of footage, decks, alpha overlays and data-driven batches; a voice-over written for the film works on either route. Mixed use when both are needed. Check the route's defaults against the owner's rules (`route-selection.md`, section 6) before starting. A game, a world to walk through or an edit of footage is not a film of this method; a request that names Manim, Remotion or Blender is answered from `route-selection.md`, section 5.

### 3. Thinking and concept

Answer the five questions of `thinking-and-brainstorm.md` in writing first. Then fill the table of parts, find comparisons from the viewer's own life that share the structure of each idea, and give each part an idiom from the world of its comparison. Start a **story writer on the latest Opus** to draft the table and three directions; check its draft against the boundaries yourself. Put the directions to the owner.

### 4. Music

Offer sources; ask before any paid generation. Hand candidates over and let the owner choose by ear. Measure beats, bars and sections with the scripts in the starter's `analysis/`: copy `assets/starter/` into the film's folder now (on the HyperFrames route, its `analysis/` folder is enough), and make the Python environment as its README says; check the grid by eye, by count and by ear; repair drift and miscounts. Or compose the score in code (`references/sound-and-voice.md`); its grid needs no measuring, and its sections must add up to the shot list, so draft the music map and the storyboard together and put both to the owner, the music by ear first. Name the parts of the track in bars and show the map to the owner with the storyboard. Sound effects and a voice-over with captions are in `references/sound-and-voice.md`.

### 5. Storyboard

Write the two data files. Give every shot a picture, a movement on the music, a camera move, a look, and the transition that leads into it; give every sentence a way to reach the viewer. Break the template between sections, unless repeating it is the idea. A film with characters writes the story beat and the feeling in `see`, and the shot size the face needs (`references/characters-and-story.md`). Run the generator; it checks the data and writes the document, the shot times and the cards. Open the studio: every shot plays as a card with the music. The owner approves here. A **story writer on the latest Opus** may draft sections; the lead merges, checks and owns the data.

### 6. Foundation

On the engine route, copy `assets/starter/` into the project, if phase 4 has not done so, and follow its README; then fit the kit to the film (palette, typefaces, safe area, overlay, and the formats the film is shown in). In a film with characters, the lead writes the cast file and has the owner approve a still of the line-up before the sample. On the HyperFrames route, use its entry skill and set its switches for telemetry and sign-in first. Prove that a capture equals playback on a test shot before any real shot.

### 7 and 8. Building

Write the authoring guide once. Brief one **builder on the latest Opus** per section, with its bars, shots, transitions to leave room for or take part in, words, content boundaries, practical rules, and the report it must write. Build the sample section first. Review every section by contact sheets and cut sheets, in this order: content, then layout and craft, then polish. Send points back to the same builder with times, reasons and decisions. When a shot the owner has seen is reworked, name the pictures that must survive.

### 9. Whole film

Look at every cut between sections, the title's hand-over, the recap and the end card; tune transitions on real pictures; measure frame time; run the owner's browser if it differs from the capture browser. Then tell the owner the film is ready and what to look at.

### 10. Hand-over

Start the studio for the owner, or tell them how. When the owner wants a file to open or send without a server, make the single-file build of the finished film (`references/studio-viewer.md`). Say what is open. Write the state down: in the project's README, in its log of decisions, and in the assistant's memory. Stop every server and agent that is no longer needed.

## References

| File | Holds |
|---|---|
| `references/environment.md` | Tools per route, install commands per system, differences between systems, copying a project, the owner's browser |
| `references/interview.md` | Rules of asking, whose decision, rounds of questions in English and Vietnamese (including short pieces and real material), the brief page |
| `references/route-selection.md` | Engine against HyperFrames against mixed; named tools; requests outside the method; conflicts with the owner's rules |
| `references/hyperframes-route.md` | The HyperFrames family of skills, its commands, catalogues, limits, and how to keep the owner's rules with it |
| `references/hyperframes-facts.md` | The fact sheet behind the two HyperFrames chapters: requirements, commands, skill map, catalogues, studio, stated limits, with sources and the CLI version they were read at |
| `references/thinking-and-brainstorm.md` | Research of the real thing and its sources; from a subject to pictures; comparisons; shape in time; directions; the sample |
| `references/music-and-beat.md` | Sources, requests, choosing, the analysis pipeline, checking the grid, the music map, the clock of a shot |
| `references/storyboard.md` | The shot list and the sentences as data, their schema, checks, what is generated, shot ids, the animatic |
| `references/transitions.md` | The model, the three parts of a drop, choosing, spending, a catalogue of about a hundred kinds |
| `references/camera.md` | Size, angle, lens, moves, patterns inside a shot, rules, planning a section |
| `references/art-styles.md` | Looks by origin, recipes by kind of film, colour roles, finish, holding a film of many looks together |
| `references/effects.md` | Jobs of an effect, motion, keeping time, arrivals, drawing, type in motion, particles and the particle kit, light, post chain and its looks, devices and cards in space, goo and liquid glass, cost |
| `references/type-and-captions.md` | Three ways for a sentence, writing and breaking lines, voices, safe area, sizes, time to read, captions at the foot for a voice, CJK and vertical setting, variable fonts |
| `references/engine-architecture.md` | The engine's contract, layers, scene interface, drawing surfaces, transition pass, post chain, capture tool |
| `references/studio-viewer.md` | The studio page: requirements, controls, card, overlay, clock, export hook, browsers, delivery |
| `references/orchestration.md` | Roles, file ownership, the authoring guide, the builder brief template, review loop, rounds, models |
| `references/quality-gates.md` | Gates, checklists per phase, content, look, reading, sync, browser and performance checks, pitfalls, "done" |
| `references/short-pieces.md` | The short lane, the autonomous mode, recipes for showreels, UI pieces, launches, reward reveals, kinetic words, stings; loops, formats, pieces that play on a click |
| `references/sound-and-voice.md` | Score and sound effects written in code, voice-over and word timings, caption groups, ducking and loudness |
| `references/characters-and-story.md` | Designing, rigging and acting characters in code, cycles, several characters, the cast file shared by builders, characters in 3D, stories told without words, faults in stills |

## Scripts and assets

| Path | Does |
|---|---|
| `scripts/check-environment.mjs` | Checks the system and the tools for a route; prints install commands; installs nothing |
| `scripts/check-environment.sh`, `.ps1` | Start the checker when no JavaScript runtime is known to be present |
| `assets/starter/` | A generic engine, kit, overlay, storyboard card, studio page, capture tool, generator and music analysis, with a tiny example film |

## When the owner corrects you

| The owner says | Do |
|---|---|
| "Wait", "I have not settled that" | Stop at once. Ask what is settled |
| "Add ..." | Add. Do not replace. If unsure: in addition, or instead? |
| "It is ugly", "out of design" | Compare with the best shot of its section; rebuild in that idiom |
| "It could be taken for ..." | Content fault. Rewrite the storyboard for that shot; tell the builder the fault was in the storyboard |
| "I cannot see it" | Read the errors of the owner's browser before answering |
| "The one before was better" | Find what was lost; bring it back; next time name it in the brief |
