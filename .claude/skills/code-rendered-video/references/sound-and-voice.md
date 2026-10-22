# Sound and voice

How a film on the engine route gets sound that is written in code: a score, sound effects tied to the events of the picture (synthesised, or recorded files placed by their peak), a voice-over with captions that follow the words, and the mix that joins them, on the film's own composed grid or over a finished track whose grid was measured. The score is data, and a script renders it offline to a WAV file. A score on its own also writes its beat grid, which is exact because the score was built on it. The studio, the engine and the capture tool then treat the file like any other track.

Load this when: the owner wants music composed in code, sound effects on the events of the picture (made in code, or from files the owner names), a voice that reads a script, captions timed to speech, music ducked under a voice or under effects, a mix at a loudness target; or a request says "compose the soundtrack yourself", "synthesize the sound", "SFX on every hit", "place each sound by its measured peak", "loudnorm to -14 LUFS", "in the style of", "narration", "text to speech", "every note comes from a collision".

Paths are relative to a film folder, a copy of `assets/starter/`. Nothing in this chapter has been used on a film yet. What was run, and on which system, is said where it matters and listed in section 12.

## Rules in short

| Rule | Reason |
|---|---|
| The score is data (`data/score.json`), rendered by a script. No sound is made in the page while it plays | The file the studio plays is the file an export would carry, and a still of any moment has one sound under it |
| A score on its own keeps one tempo, and bar 0 starts at time 0. A score over a track (`track`) uses the track's measured grid | On its own the grid is known exactly and written, not measured. Over a track, every cue follows the track's real beats where they drift |
| Every sound has a hit point, and the hit point lands on the time the score gives | A riser ends on its event, a whoosh peaks on it, a drum starts on it, a recorded file lands on its measured peak |
| Events of the picture and their sounds are written in the same numbers: bar and beat, shot and beat, or, for a simulation, the same function | The picture and the sound cannot drift apart when both read one source |
| Rendering is deterministic: seeded noise, no clock | Two runs give the same bytes. Check it (section 8) |
| Clean over dense. Few parts, each with its own band | The owner of the reference films preferred clean tracks to cluttered ones |
| Taste is judged by ear. The loudness figures are for delivery, not for arguing about taste | `music-and-beat.md`, section 3 |
| The rights of a track or of a sound-effect file are the owner's question | The lead writes down the source and the licence as the owner gives them, and does not decide |
| "In the manner of" a named work takes its style, never its melody | Section 4.5 |
| A voice that leaves the machine, or costs money, needs the owner's yes, each time | Cloud voices send the text to a company. Paid voices cost money |
| Installing a voice engine, an aligner or a decoder needs the owner's yes | `environment.md` |

## 1. When to compose in code

| Situation | Composed in code | A finished track (`music-and-beat.md`) |
|---|---|---|
| The request asks for it ("compose the soundtrack yourself, fully synthesized, no samples") | Yes | |
| A short piece of 10 to 30 seconds with hits on every event | Yes: every hit is written where the picture needs it | Possible, if the track has the hits |
| Sound effects on the events of the picture, over a track the owner supplied or bought | The effects and the mix: a score with `track` (section 5.2) | The track, measured first |
| Recorded effects the owner names ("use my SFX folder", a royalty-free library) | Placed by their measured peak (section 5.1) | |
| A voice-over with a bed under it | The bed and the mix | The bed, if the owner brings one |
| A song with a rich arrangement, a genre the owner loves, a real instrument | | Yes. A few synthesised instruments do not replace it |
| "In the style of" a film score, a genre, an era | A sketch of the style (section 4.5) | When the owner wants the real thing |
| The owner wants to choose among candidates by ear | Two or three scores in different directions are cheap to make | Generation is paid; ask |
| A piece that plays live on a click, with sound on the first click | The sounds rendered here to short WAV files, which the page plays on click | Live synthesis in the page (Web Audio) is not built |

A score written in code cannot drift in tempo and never needs its grid repaired, because the grid is its skeleton. It sounds like what it is: clean, synthetic, electronic, or a clean sketch of an acoustic family. Say that to the owner before choosing it for a film that wants warmth or a real instrument.

## 2. The pipeline

| Step | Command | Reads | Writes |
|---|---|---|---|
| Voice (only with a voice-over) | `bun run voice:sapi`, or another voice step (section 9) | `data/voice.json` | `audio/voice/<id>.wav`, `data/voice-words.json` |
| Score | `bun run score` (`scripts/make-score.ts`) | `data/score.json`, `shots.json`; with a voice `data/voice.json`, `data/voice-words.json` and the phrase files; with a track the track and its measured `data/audio.json`; the sample files; the cue modules | The WAV named by `out` (`audio/score.wav`); `data/audio.json` for a score on its own; with a voice `data/lyrics.json` |
| Shot times | `bun run shots` | `shots.json`, `copy.json`, `data/audio.json` | The shot times in `data/audio.json`, `STORYBOARD.md`, `data/film-sections.json` |
| Listen | `bun run studio`, music switch on `score` | `audio/score.wav` | Nothing |

`bun run score -- --check` checks the score and the voice and prints what would be made, without writing anything. A fault is printed as one plain line per fault, and nothing is written. `--score <file>` renders another score file; `--no-grid` writes only the WAV (section 8).

The code lives in `src/sound/`. None of it imports anything of Node or of the page.

| File | Holds |
|---|---|
| `src/sound/dsp.ts` | Seeded random, oscillators without aliasing, the filter, pitch names, decibels |
| `src/sound/event.ts` | What an instrument receives and returns; glides and vibrato (`pitchAt`) |
| `src/sound/instruments.ts` | The first set (drums, bass, pad, pluck, riser, impact, whoosh, click), the list of every type and its defaults (`DEFAULTS`) |
| `src/sound/orchestra.ts` | Strings, brass, piano, electric piano, flute, bells, zither, wobble bass, 8-bit pulse |
| `src/sound/ambience.ts` | Wind, rain, room tone, river, crickets |
| `src/sound/effects.ts` | Recorded files (`sample`, with `measuredPeak`) and the effect presets |
| `src/sound/mix.ts` | Reverb, delay, ducking, limiter, loudness meter, WAV files |
| `src/sound/score.ts` | The score format, the grids (`evenGrid`, `measuredGrid`), the check and the render |
| `src/sound/voice.ts` | Phrases, word times, caption groups |
| `src/sound/cues-from-sim.ts` | An example of a simulation whose events become cues (section 5.3) |

The engine, the studio and the capture tool did not change for this. The grid file has the shape a measured grid has, the WAV is served from `audio/` like any track, and the video mode of the capture tool carries `audioFile` of `src/project-config.ts`, which is set to the score when the score is the film's music.

## 3. The score file

`data/score.json` holds the whole score. The starter ships a small example for its example film: 24 bars at 120 BPM in A minor, five sections that match the film's groups, and six cues.

| Key | Type | Meaning |
|---|---|---|
| `tempo` | number | Beats a minute, for the whole score. For an explainer, this owner has asked for more than 130. Not used with `track` |
| `track` | `{file, gain, bus}` | A finished track to lay the score over, a WAV whose grid was measured into `data/audio.json` (section 5.2). Optional |
| `seed` | number | Seed of every noise. Change it to hear other noise, keep it to get the same file |
| `sampleRate` | number | 48000 by default |
| `out` | path | The WAV, `audio/score.wav` by default |
| `tail` | seconds | Sound after the last bar, where reverb rings out; 1.5 by default. The last shot is stretched to it. With a track, the track decides the length |
| `master` | `{gain, lufs, ceiling}` | Gain in dB; a loudness target in LUFS (the mix is set to it before the limiter); the ceiling of the limiter in dBFS, -1 by default |
| `buses` | name to `{gain, reverb, delay, duck, key}` | See section 6 |
| `duck` | `{attack, release, hold}` | Shape of the ducking, in seconds |
| `reverb` | `{size, damp}` | The shared reverb |
| `delay` | `{beats, feedback}` | The shared delay; 0.75 beat (a dotted eighth) by default |
| `instruments` | name to `{type, bus, gain, pan, ...parameters}` | See section 4 |
| `patterns` | name to `{bars, tracks}` | Lines of steps or notes, one per instrument, that repeat |
| `sections` | list of `{name, bars, play}` | The parts of the score, in order. `play` lists patterns by name, or as `{pattern, gain}`. Over a track it may be empty |
| `cues` | list | The sound effects of the picture, section 5 |
| `cueModules` | list of paths | Modules that make cues from the picture, section 5.3 |
| `voice` | path | The voice-over, `data/voice.json`. Optional |

The total of the sections' bars must equal the length of the shot list; the script says so when they differ. Write the sections to the groups of `shots.json`, so that a change of section in the story is a change in the music.

### Writing patterns

A track of a pattern is one line for one instrument, cut into equal steps across the pattern's bars.

| Kind of instrument | Written as | Example |
|---|---|---|
| Drums, effects, beds, samples | Characters: `X` full, `x` normal, `o` soft, `.` rest, `-` holds the step before. Spaces are ignored | `"X...x...x...x..."`: sixteen steps, a kick on every beat |
| Pitched (`bass`, `pad`, `pluck` and every instrument of section 4.2) | Words separated by spaces: a note `A1`, a chord `A3+C4+E4`, a glide `A1>C2`, `.` rest, `-` holds the note before, `A1:0.6` a strength | `". A1 . A1 . A1 . A1"`: eight steps, the bass on the off-beats |

Sixteen steps to a bar are sixteenth notes; eight are eighths; twelve are triplets. A pattern of `bars: 4` with four chords holds each chord a bar. A glide `A1>C2` slides the first note of the step to the second over the note's length, or over `glide` seconds when the instrument sets it; a zither presses its string up in 0.18 seconds by default, as a guzheng player does after the pluck.

## 4. The instruments

Every parameter has a default (`DEFAULTS` in `src/sound/instruments.ts`); an instrument in the score names only what it changes. Every instrument renders a clean version of its family, cheaply: none of them is a recording, and none imitates a particular player or product.

### 4.1 The first set

| Type | What it is | Parameters | Hit point |
|---|---|---|---|
| `kick` | A sine that falls in pitch, a little drive, a short click | `start`, `end` (Hz), `sweep`, `decay` (s), `click`, `drive` | Its start |
| `snare` | A short tone and band-limited noise | `tone`, `decay`, `noise`, `low`, `high` | Its start |
| `clap` | Three bursts of noise and a tail | `centre`, `decay`, `spread` | Its start |
| `hat` | High-passed noise. A longer `decay` opens it | `decay`, `tone` | Its start |
| `bass` | A band-limited saw or square, a low-pass that closes after each note, a sine an octave down | `shape`, `cutoff`, `env`, `fdecay`, `q`, `sub`, `attack`, `release`, `glide` | Its start |
| `pad` | Three detuned saws a note, spread left and right, a gentle low-pass, slow attack | `shape`, `detune` (cents), `cutoff`, `q`, `attack`, `release`, `width` | Its start |
| `pluck` | `model: synth`, a square through a closing filter; or `model: string`, a plucked string (Karplus-Strong) | `model`, `shape`, `cutoff`, `env`, `fdecay`, `decay`, `damp`, `ring`, `glide` | Its start |
| `riser` | Noise through a band that climbs, with a faint tone, growing louder | `from`, `to` (Hz), `q`, `tone` | **Its end**: it climbs into the event |
| `impact` | A low boom that falls in pitch, with dark noise | `start`, `end`, `decay`, `noise`, `cutoff` | Its start |
| `whoosh` | Noise through a band that sweeps up and back, loudest in the middle | `from`, `peak`, `q` | **Its middle**: it passes the event |
| `click` | A short sine blip with a tick of noise. A note gives its pitch; a longer `decay` makes a ding | `pitch`, `decay`, `noise` | Its start |

### 4.2 Instruments for "in the manner of" requests

All are pitched, take chords where the family plays them, glide (`A1>C2`), and have their hit point at their start.

| Type | What it is | Parameters | Notes |
|---|---|---|---|
| `strings` | A section: five detuned saws a note, each with its own slow vibrato, spread in stereo, a soft low-pass and a high-pass | `detune`, `cutoff`, `attack`, `release`, `depth` (vibrato, semitones), `glide` | Long `attack` for swells, short for marcato |
| `brass` | Two saws whose filter opens as the note speaks, with a small scoop up into the pitch | `bright` (Hz), `attack`, `release`, `depth`, `glide` | Stabs, swells, fanfares |
| `piano` | Twelve slightly stretched partials, the high ones dying first, two stages of decay, a hammer, a damper on release | `decay`, `release`, `inharmonic` | Arpeggios, sparse chords |
| `epiano` | Two-operator FM: a bark on the attack that mellows, a short tine | `bark`, `decay`, `release` | Soft chords |
| `flute` | A physical model: a jet and a bore, after Perry Cook's waveguide flute, with breath noise and vibrato | `breath`, `jet`, `noise`, `attack`, `release`, `depth`, `glide` | In tune from about C4 to C7: within 6 cents up to C6, about 25 cents flat at E6 and G6. `breath` works between 0.86 and 0.92; below that the model does not speak, which is why the strength of a note sets its loudness and not the breath |
| `bell` | `model: bar`, a tuned metal bar (glockenspiel, celesta) with overtones at 2.76, 5.40 and 8.93; `model: church`, a cast bell (hum, prime, tierce, quint, nominal on the note) | `model`, `ring` | Notifications, reveals, the end |
| `zither` | A plucked string whose length follows the pitch, so a note can be pressed up after the pluck, with the slow vibrato of a guzheng, the pluck point, and a small wooden body | `ring`, `bright`, `position`, `depth`, `glide` | Pentatonic tunes with slides (`E5>G5`) |
| `wobble` | A saw and a square an octave down through a resonant low-pass swept by a slow wave that follows the tempo | `beats` (length of one sweep), `low`, `high` (Hz), `q`, `release`, `glide` | Dubstep and bass music; `beats: 0.5` wobbles in eighths |
| `chip` | An 8-bit pulse voice: a pulse of chosen width, a volume in sixteen steps, chords as fast arpeggios | `duty` (0.125, 0.25, 0.5), `arp` (seconds a note of a chord), `decay`, `sustain`, `release`, `glide` | Retro games, pixel art |

The pitch of each was measured on the render with an autocorrelation: strings, brass, piano, electric piano, bell, zither and chip land within about 6 cents of the note across three octaves; the flute as above.

### 4.3 Beds of ambience

A bed lasts as long as its event: a cue with `beats`, or a step held with `-` in a pattern. It is stereo, quiet, and faded in and out over `fade` seconds. Its bus is `bed` unless the instrument names another.

| Type | What it is | Parameters |
|---|---|---|
| `wind` | Soft noise through a band whose centre wanders, with slow gusts | `speed`, `low`, `high` (Hz), `q`, `fade` |
| `rain` | A hiss and many small drops, each a short ping | `density` (drops a second), `hiss`, `fade` |
| `room` | Room tone: dark rumble and a little air, with an optional mains hum | `hum` (Hz, 0 for none), `fade` |
| `river` | Four bands of noise that bubble at their own speeds | `fade` |
| `crickets` | Up to three insects, chirping in groups of three pulses | `count`, `fade` |

### 4.4 Effect presets

For games, reward reveals, cartoons and interfaces. A cue's `note` moves a pitched preset to that root. Every preset has its hit point where the event belongs.

| Type | What it is | Hit point | Parameters |
|---|---|---|---|
| `coin` | Two quick square notes a fourth apart | The first note | `root` |
| `fanfare` | Three brass pick-up notes, then a chord | **The chord** | `root`, `step`, `hold` |
| `levelup` | A rising arpeggio, then a held chord with a shimmer | **The chord** | `root`, `step` |
| `siren` | A wail, or two tones (`mode: hilo`); lasts `beats` | Its start | `low`, `high`, `period`, `mode` |
| `engine` | Firing pulses at the rate the revs give, through two exhaust resonances, revs rising from `from` to `to` over `beats` | Its start | `from`, `to` (rpm), `cylinders` |
| `crunch` | Metal: a dozen ringing modes struck by a burst of crackles, and a thud | Its start | `decay` |
| `pop` | A bubble: a sine sweeping up in 25 ms | Its start | `from`, `to` |
| `boing` | A cartoon spring: a pitch that wobbles and settles | Its start | `root`, `decay` |
| `toggle` | Two tiny clicks, down and up | Its start | |
| `success` | Two soft notes up a fifth | Its start | `root` |
| `error` | Two low buzzing notes down | Its start | `root` |
| `notify` | Three bright notes, a little bell in each | Its start | `root` |
| `key` | One key of a keyboard; each is a little different | Its start | |

The first set adds `click`, `whoosh`, `impact` and `riser` to these. For a story told in sound, pops, boings, whooshes and dings cover most cartoon actions; foley of real materials (steps, cloth, glass) is better recorded (section 5.1).

### 4.5 Writing "in the manner of" a named work

A request may name a work ("use the Oppenheimer theme as inspiration, but compose it yourself", "a song that would fit on Peter Gabriel's So"). Take its style, never its substance.

| Take | Do not take |
|---|---|
| Tempo, metre, feel (straight, swung, driving) | The melody, or any phrase a listener would name |
| Mode and harmonic colour (minor, modal, slow-moving chords, pedal notes) | The chord sequence in its order and rhythm |
| Instrument families and their roles (an ostinato in the strings, brass swells, a low drone) | Riffs, hooks, a recognisable bass line |
| Texture and density, how it builds, where it breaks | Samples of the recording, its sounds lifted |
| Production traits (big reverb, dry close drums, gated snare) | Lyrics, titles, the artist's name on screen |

Write the style as a short sheet first, one line per row of the left column, and build the score from the sheet, not from memory of the piece. Then check: sing the new melody against what you know of the original; if its first two bars could be taken for the original, rewrite them. Say to the owner that the result is in the manner of the work, and that whether even that is acceptable for their use is their question.

What keeps a score clean:

| Do | Why |
|---|---|
| One part per band: kick and bass low, pad and pluck in the middle, hats high | Parts that share a band blur each other |
| A pad or a pluck, rarely both at full level | Two harmonic parts in the middle make the track dense |
| Drums out where words must be read, back in on the drop | `music-and-beat.md`, section 7. The score can do what a found track only sometimes does |
| Change something at every section: a part in, a part out | The film's sections are heard |
| Fewer effects than events | An effect on every event of a busy shot is noise. Mark the events that carry the idea |
| A bed of ambience very low, or not at all under music | It is felt, not heard |

## 5. Sound effects: the cue sheet

A cue is one sound tied to one event of the picture.

```json
{"at": {"shot": "steep-timer-rings", "beat": 4}, "sound": "ding", "note": "E6", "why": "The sand timer runs out and rings."}
```

| Field | Meaning |
|---|---|
| `at` | Where the hit point lands: `{bar, beat}` counted from zero as in `shots.json`, or `{shot, beat}` with the beat counted from the shot's start, or `{t}` in seconds for a cue that comes from a simulation (section 5.3). Fractions are allowed |
| `sound` | An instrument of the score, or a bare type (`impact`, `coin`, ...) with its defaults on the `sfx` bus |
| `gain` | dB |
| `vel` | Strength, 0 to 1 |
| `beats` | Length of a riser (measured back from the event), or of a whoosh, a siren, an engine or a bed (measured on from it) |
| `note` | Pitch of a pitched sound, or the root of a preset |
| `pan` | -1 to 1 |
| `why` | The event of the picture it marks. Not read by the renderer; it is for the lead and the builder |

`{shot, beat}` is the clock the builder uses in the shot (`sceneClock`, `kit-frame.ts`): a stamp that lands at `hit(k.beats, 4)` in the shot and a cue at `{shot, beat: 4}` are the same moment. Write the event into the builder's brief and the cue into the score from one table of the storyboard, so that neither is guessed from the other.

A score on its own writes every event into the grid file as an onset under the instrument's name, and the drums also under `kick`, `snare` and `hat` as a measured track would. A shot may therefore read `audio.hit('impact', t)` or `audio.events('ding', t0, t1)` to react to a cue. The cue is still the source; the shot places its picture on the position, not on the onset.

### 5.1 Recorded files, placed by their peak

An instrument of type `sample` plays a WAV file the owner named: from a sound library, a folder of their own, or a recording.

```json
"crunch": {"type": "sample", "file": "audio/sfx/crunch.wav", "bus": "sfx"}
```

| Parameter | Meaning |
|---|---|
| `file` | The WAV, relative to the film folder. 16 or 24-bit integer or 32-bit float, mono or stereo, any rate. Another format is converted to WAV first, which needs a tool such as ffmpeg: a light job, but still the owner's word if it must be installed |
| `hit` | `peak` (the default): the loudest moment of the file, measured over 5 ms windows (`measuredPeak` in `src/sound/effects.ts`), so that a click lands on its attack and a whoosh on its crest; `start`: the first sample; or a number of seconds into the file |
| `root` | The note the file sounds at. With a `root`, a cue's `note` plays the file higher or lower by resampling |

A mono file is panned like any mono instrument; a stereo file keeps its own image. The file is read once and every cue places it again. Tested with a file whose peak sits 124 ms in: its peak landed on the cue's beat to the sample; a noise whoosh with a broad crest landed within 4 ms.

The rights of every file are the owner's question. Keep the source and the licence the owner gives next to the files, for example in a line of the score's `comment`, and never download effects from the web on your own initiative.

### 5.2 Over a finished track

When the music is a track the owner supplied or bought, measure its grid first (`music-and-beat.md`, sections 4 and 5). Then a score with `track` lays the effects, a voice or a bed over it:

```json
{"track": {"file": "audio/track.wav", "gain": -3}, "out": "audio/mix.wav",
 "master": {"lufs": -14, "ceiling": -1},
 "buses": {"track": {"duck": 5}, "sfx": {"key": true}},
 "instruments": {"crunch": {"type": "sample", "file": "audio/sfx/crunch.wav", "bus": "sfx"}},
 "patterns": {}, "sections": [],
 "cues": [{"at": {"bar": 8}, "sound": "crunch", "why": "The car hits the wall."}]}
```

| What happens | How |
|---|---|
| The grid | Read from `data/audio.json`, the grid the analysis measured, beats before the first downbeat counted as a pickup. The script refuses a grid that a score composed itself. Positions in bars and beats follow the measured beats, drift included (`measuredGrid` in `src/sound/score.ts`) |
| The track | Mixed on its own bus, `track` unless `track.bus` names another, so that it can be ducked: under the voice, or under effects on a bus marked `key` |
| The loudness | The whole mix, track included, is set to `master.lufs` and limited |
| The grid file | Left as it is. The captions of a voice are still written |

Set `audioFile` in `src/project-config.ts` to the mix when it is what the film plays. Tested on a grid that drifted from 120 to 126 BPM with a pickup of two beats: kicks placed by the score on that grid started within 0.01 ms of the measured beats at bars 0, 5, 11, 17 and 23.

### 5.3 Sound from the picture

Some films make sound from what the picture does: "every note comes from a visible collision", the crackle of a fire from its brightness. Then the picture is the source and the sound follows it. The events come from a simulation, and the simulation must be one pure function that the shot and the score both run.

| Part | Rule |
|---|---|
| The simulation | A module without DOM or Node imports, with no clock and no unseeded random, integrated at a fixed step, returning its events with their times. It lives where both can import it: `src/sound/` or `src/scenes/parts/` |
| The shot | Runs it once in `init()` and draws from its result at `f.t` |
| The score | Names the module in `cueModules`. The module exports `cues(ctx)`, which receives the shot list and the grid (`CueContext` in `src/sound/score.ts`) and returns cues, usually with `at: {t}` |
| An event between two steps | Found by interpolation inside the step, so the sound lands where the contact happens, not on the next step |
| A continuous quantity (brightness, speed) | Turned into events: many small cues whose density or strength follows it, or a bed whose `gain` changes by section |

`src/sound/cues-from-sim.ts` is a worked example: a ball dropped at the downbeat of bar 2 bounces, and each contact becomes a bell that climbs a scale, louder when the ball is faster. Its `simulateBall` and `ballAt` are what a shot would call. Only sounds that come from the picture use `{t}`; music stays on the grid.

### 5.4 The picture from the score

The other direction: the music is composed first, and the picture makes every note visible, as in "a machine that plays a piece of music, every note a visible collision". Then the score is the source and the picture follows it.

| Part | How |
|---|---|
| The events | A scene reads the score's own events, never a retyped list: `scoreEvents(score, shots, grid)` in `src/sound/score.ts` is pure, and with `evenGrid(tempo, bars)` it gives every note's instrument, time in seconds, pitch and strength. The scene imports `data/score.json` (`import score from '../../data/score.json'`, which works in the studio and in the single file), or fetches it in `init()` |
| The motion | Planned backwards from each event: a ball's flight, a hammer's swing, a weight's fall is an analytic function that reaches its target exactly at the note's time. Launch times and speeds follow from the target and the arrival |
| The check | Stills at each instrument's event and one frame either side: the contact lands on the event's frame. And every event is on screen at its time: project each strike through the camera at its frame (`screenPoint(cam, p)` and `inFrame(cam, p, margin, within)` in `src/scenes/parts/kit-camera.ts`, for a flat camera, a 3D one or a three.js camera). From practice: on the first run of that check, 22 of 332 strikes on a trial film were out of frame, and the camera moves were changed |

Who writes the score: the lead, as it writes the storyboard, because the owner judges the music by ear and approves it before anything is built. A builder may propose changes to it in its report, like any change outside its files. From practice: on the collision machine the lead wrote a score of struck and plucked instruments only (every note needs a visible strike, so no held pad), the owner approved it by ear, and one builder built the machine from its events in one round.

## 6. The mix

| Stage | What it does | Where it is set |
|---|---|---|
| Instrument | Gain and pan of each sound | `instruments.<name>.gain`, `pan` |
| Bus | Gain of a group: by default `drums` (kick, snare, clap, hat), `bass` (bass, wobble), `music` (every other pitched instrument), `bed` (ambience), `sfx` (effects, samples), `voice`, and `track` | `buses.<name>.gain` |
| Sends | Part of a bus goes to the shared reverb and the shared delay | `buses.<name>.reverb`, `delay` (0 to 1) |
| Ducking | Buses with `duck` go down by that many dB while a bus with `key` sounds. The voice bus is a key by default; mark `sfx` as a key to dip a track under hits. The dip starts `attack` seconds before the key, because the whole file is known in advance, and gaps shorter than `hold` do not let the bed back up between words | `buses.<name>.duck`, `key`; `duck` |
| Master | Gain, then a loudness target, then a look-ahead limiter at the ceiling, then a fade over the tail | `master` |

The script prints the integrated loudness of the result (BS.1770, gated), its sample peak, and the largest reduction of the limiter with its time. A limiter that takes more than about 6 dB off one moment is flattening it: lower the bus that is loud there, or the target. The loudness is measured before the limiter and set to the target, and the limiter then takes a little off, so the result lands slightly under the target. The peak is a sample peak, not a true peak.

Common targets: about -14 LUFS for most streaming and social platforms. Ask where the film will be shown. Keep effects under the music unless an effect is the event itself.

## 7. Where the sound goes

| File | For |
|---|---|
| `audio/score.wav` | The studio plays it: `src/project-config.ts` lists it in `studioAudio` under the label `score`, so the music switch offers it once it exists. When the score is the film's music, also set `audioFile` to it, so that an export carries it |
| `data/audio.json` | Written by a score on its own: `beats`, `downbeats`, the shot times (from `shots.json`, then written again by the build script), `features` (`rms` of the mix; `low`, `mid`, `high` and, with a voice, `vocal`, which are sums of the score's own instruments by band), `onsets`, and `notes` with `grid_source: composed`, the loudness and the limiter figures. A score over a track leaves it alone |
| `data/lyrics.json` | The caption groups of the voice-over, section 11 |

A WAV of 48 kHz stereo is about 11 MB a minute. The studio plays it as it is. A compressed copy for the studio is optional; it must keep the timing.

## 8. Running and checking

```sh
bun run score -- --check     # the faults, or what would be made
bun run score                # the WAV, the grid, the captions
bun run shots
bun run score -- --score <file> --no-grid   # another score file, the WAV only
```

| Check | How | Passes when |
|---|---|---|
| Deterministic | Run `bun run score` twice and compare checksums of the WAV, `data/audio.json` and `data/lyrics.json` (`sha256sum` in Git Bash or on macOS and Linux, `Get-FileHash` in PowerShell) | They are equal |
| In time | Play the studio with the music switch on `score`, then on `click`, at the same moment | The click and the kick are one |
| The picture's events | Watch each cue's moment in the studio | The sound lands on the event, not near it |
| The mix | The printed loudness, peak and limiter figures | Within the target; the limiter under about 6 dB |
| Taste | The owner listens | The owner says so |

Measured on a Windows 11 machine on 2026-09-28, bun 1.4.2: the example score (48 kHz stereo, 49.5 seconds, 280 sounds and four voice phrases) rendered in 2.5 to 2.9 seconds on one core, and three runs gave byte-identical files. The pads take most of that time; the other demos rendered in 0.4 to 2.8 seconds. `Math.sin`, `Math.exp` and `Math.tan` are not specified to the last bit across JavaScript engines, so a file made on another system or another version of bun may differ in its lowest bits; the grid and the event times do not.

`--no-grid` writes the WAV only and leaves `data/audio.json` and `data/lyrics.json` as they are: for a test, a demo, or a second version of the sound to compare by ear.

## 9. A voice: where it comes from

| Source | Leaves the machine | Costs | Word times | Languages | State here |
|---|---|---|---|---|---|
| Windows voices through SAPI (`System.Speech`), `scripts/voice-sapi.ps1` | No | Nothing | Word starts, from the engine | Those installed. A stock English Windows 11 had Microsoft David and Zira, English only | Run on Windows 11 on 2026-09-28 |
| macOS `say` | No | Nothing | None known; estimated (section 10) | Those installed | Not run. The command is `say -v <voice> -o <file>.wav --data-format=LEI16@22050 "<text>"` |
| Piper, a local neural voice | No | Nothing, but it is an install | None confirmed; estimated | Per downloaded voice model | Not run. Installing it needs the owner's yes |
| edge-tts, a Python package | **Yes**: the text goes to Microsoft's online read-aloud service | Nothing | Word boundaries when asked for (`boundary="WordBoundary"`; its default is sentence boundaries) | Many, Vietnamese included | Not run. It sends the script out and uses a service without a contract; ask |
| Paid voices (ElevenLabs, Azure, Google, OpenAI and others) | Yes | Yes | Some return timings, some do not; read their documentation | Many | Not run. Ask, with the cost |
| A human voice the owner records | No | Nothing | Needs a transcription or forced alignment tool, which is an install | Any | Not built (section 10) |

Say to the owner which of these sends the text away and which costs money, and let the owner choose. A voice for a film in Vietnamese needs a Vietnamese voice: none of the local Windows voices tried speak it, so ask the owner, film by film, which voice to use.

What was found with SAPI: the engine reports the start of every word, in seconds of the file it writes, through its progress events. It reports no end. With the desktop voices tried, those times were counted as if the file were written at 16 kHz: written at 24 kHz, every time came out 1.5 times too late. The script therefore writes 16 kHz files. Checked against the sound of the file, word starts after a pause fell within about 10 ms. Two runs gave identical files.

## 10. A voice: the data and the clock

### Which clock rules

The beat grid still rules. Each phrase of the voice is placed on a position of the grid: its first word lands on the bar and beat the lead writes. Inside a phrase, the words keep the times the voice gave them. So cuts stay on downbeats, the builder's clock stays in beats, and the voice is laid on the music the way a shot is. Over a measured track the same holds, on the measured beats.

| Matter | Rule |
|---|---|
| A phrase | One sentence, or one breath group of a long sentence. Its own file, its own position |
| Where it starts | On a beat, usually the first or second beat after the cut of the shot it speaks over. `{shot, beat}` says it directly |
| How long it may be | Until the next phrase. The script warns when one runs into the next. A phrase of ten words takes about four seconds, two bars at 120 BPM |
| Cuts | On downbeats as before. A phrase may run over a cut; a phrase that begins just before a cut is heard as late |
| The music | A bed, ducked under the voice (section 6). Drop drums out under the longest sentences |
| Pace | The gaps between phrases come from the grid, a beat or two. Too many gaps make the voice sound stepped: then write longer phrases, or place a phrase on an off-beat (`beat: 1.5`) |

The other way round, a grid bent to a voice that was recorded whole, is not built: it needs the times of the words of the recording, which only a transcription or alignment tool gives, and cutting the recording into phrases. With such times, the phrases could be cut out and placed the same way.

### The files

`data/voice.json`, written by the lead:

```json
{
  "voice": {"engine": "sapi", "name": "Microsoft Zira Desktop", "rate": 0},
  "captions": {"maxWords": 5, "maxChars": 26, "gap": 0.3, "lead": 0.05, "hold": 0.5, "min": 0.7},
  "phrases": [
    {"id": "v01", "text": "Boiling water on green leaves | turns the cup bitter.", "at": {"bar": 2, "beat": 1}},
    {"id": "v03", "text": "Three minutes, | then lift them out.", "at": {"shot": "steep-colour-spreads", "beat": 0}}
  ]
}
```

| Field | Meaning |
|---|---|
| `phrases[].id` | Names the file `audio/voice/<id>.wav` |
| `phrases[].text` | What is said. `\|` ends a caption group, `/` breaks a line inside one; neither is spoken |
| `phrases[].at` | Where the first word lands |
| `phrases[].gain` | dB, for one phrase that came out quieter |
| `voice` | For the voice step: the engine, the voice name, the rate (SAPI: -10 to 10) |
| `captions` | Rules for grouping, section 11 |

`data/voice-words.json` is written by the voice step, never by hand: for each phrase its file, its length, `timing` (`engine` or `estimated`) and its words with start and end in seconds of that file. Any voice step that writes this file and the WAV files works with the rest, whatever engine it drives.

`bun run score` then takes each word time from the voice engine when the engine gave one time for each word of the text, and pulls each word's end back to where its sound stops. When there are no times, or they do not match the words of the text, it estimates them: the speech between the first and the last sound is shared out by the syllables of each word, with a little more after punctuation. Estimated times are marked `estimated` in the output. Against the SAPI times of the example they were off by up to a quarter of a second: good enough for groups of a few words, not for lighting up one word at a time.

Writing for a voice: about two and a half words a second; sixty seconds is about a hundred and fifty words. Read every phrase aloud at that pace before placing it. The sentences of the voice are also the sentences on screen, so the rules of `type-and-captions.md`, section 3, hold for them.

## 11. Captions from the voice

`bun run score` writes the caption groups to `data/lyrics.json`, in the shape `src/engine/lyrics.ts` reads, so every scene has them as `this.ctx.lyrics`. Each group is a line of that file, with `text`, `start` and `end` (when it is on screen, in song time), `rows` (its lines on screen), `phrase` (its phrase id) and `words` (every word with its spoken start and end). A copy of this file written by the script is removed when the score no longer has a voice.

How words are grouped:

| Rule | Default |
|---|---|
| Where the lead wrote `\|` in a phrase, those marks alone decide that phrase's groups | Break by sense, as `type-and-captions.md`, section 4 asks |
| Elsewhere, a group ends after punctuation, before a silence of `gap` seconds, and before it would pass `maxWords` words or `maxChars` characters | 0.3 s, 5 words, 26 characters |
| A group appears `lead` seconds before its first word | 0.05 s |
| It stays `hold` seconds after its last word, at least `min` seconds in all, but never past the start of the next group | 0.5 s, 0.7 s |

Groups of two to six words suit speech: two or three for energetic cutting, up to six for calm explanation.

### How the overlay draws them

Burned-in captions at the foot of the frame are the normal choice for a film led by a voice: most viewers watch with the sound off, and the words must follow the voice. The starter's overlay (`src/scenes/overlay.ts`) draws every caption group of the voice over every shot, title and end card included:

| Matter | How |
|---|---|
| Which lines | Lines of `data/lyrics.json` that carry a `phrase` id. Sung lyrics have none and are left to the shots of a lyric film |
| Where | A pill centred on the caption zone (`CAPTION` in `kit-frame.ts`), standing on its bottom edge, inside the safe area |
| Look | An opaque ink pill with the rows in the sentence voice, no label and no accent bar, so it is never taken for a plate of the storyboard. Size fitted to the widest row, from 58 px down to 40 px at 1080 wide |
| Timing | On from the group's `start` to its `end`, read at the frame's own time, with a fade of 0.06 seconds |
| Words | The words not yet spoken are drawn at half strength and each word comes up as it is spoken, from the word times. `VOICE.dim` at the top of the overlay sets this; 1 shows all words alike |
| Over a dark ground | The pill has a faint edge, so that it keeps its shape |

A plate of the storyboard placed at the bottom while a voice caption is on would sit on it. The overlay raises such a plate to the top for as long as the voice speaks, and `bun run score` warns with the plate's section and bar and the caption's words, so that the storyboard is put right: move the plate to the top or the middle, or let the voice carry the sentence. A card's stand-in plate is raised the same way.

Checked in four stills of the example film on Windows 11 on 2026-09-28, with the example voice spoken by SAPI. At 5.3 seconds the pill read "Boiling water on" bright and "green leaves" dim, and at 41.9 seconds, on the end card, "mind" bright and "the time." dim, both matching the word times. At 9.6 and 25.6 seconds a bottom plate and a stand-in plate had first overlapped the pill; with the rule above they stand at the top.

What `type-and-captions.md` says still holds: the safe area, the minimum sizes, an opaque plate, type under the bloom threshold. What changes with a voice is the timing: a group is on for as long as it is spoken, not for as long as it takes to read, so a sentence that must be read in full belongs on a plate of its own, held in a pause of the voice.

## 12. What was run and what was not

| Item | State |
|---|---|
| `bun run score` on the example score, with and without the voice, `--check`, a score with faults, `--no-grid` | Run on Windows 11, 2026-09-28. Byte-identical over three runs; kick onsets in the file within one sample of the grid. The additions of the second round left the example's output byte for byte the same |
| Recorded files placed by their measured peak, over a track on a drifting measured grid, the track ducked under the effects, the mix at -14 LUFS | Run on Windows 11, 2026-09-28, with test files made in code, not with a real library or a real track. Two runs identical |
| The instruments of section 4.2, the beds, the presets, glides | Rendered on Windows 11, 2026-09-28; pitch measured as in section 4.2; levels measured. **Not listened to** |
| Cues from a simulation (`src/sound/cues-from-sim.ts`) | Run: five contacts, the first at the time the free fall gives |
| `bun run voice:sapi` with Microsoft Zira | Run on Windows 11, 2026-09-28. Word starts checked against the sound of the file. Identical over two runs |
| Voice captions drawn by the overlay | Four stills looked at, on Windows 11, 2026-09-28 |
| Listening | **Not done.** The lead could not hear the result. Every instrument, default and demo is untested by ear |
| The score in the studio, in the owner's browser | Not run |
| macOS `say`, Piper, edge-tts, paid voices, transcription, forced alignment | Not run |
| Live synthesis in a page (Web Audio), MP3 or other formats read directly | Not built |
| Export of a video carrying the score | Not run (no video export without the owner's word) |

## 13. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The music switch has no `score` | The WAV was not made, or `studioAudio` does not list it | Run `bun run score`; keep the `score` entry in `src/project-config.ts` |
| The shots start at the wrong times after a new score | The score changed its tempo or bars, and the shot times were not written again | Run `bun run shots` after every score |
| The script warns that the score and the shot list differ in bars | The sections of the score do not add up to the film | Make them equal |
| A riser is heard before the place where it was written | Its hit point is its end, in a pattern as in a cue: it arrives at its step | Write risers and whooshes as cues `at` the event, with `beats` for their length |
| A recorded effect lands late | Its hit point was set to `start`, and the file has silence or a slow attack before its peak | Leave `hit` at `peak`, or give the seconds of the moment that belongs on the event |
| The script refuses the grid of a track | `data/audio.json` holds the grid a score composed, not the track's | Measure the track (`music-and-beat.md`, section 4) |
| Effects drift off a track towards its end | They were placed on an even grid at the track's tempo | Use `track`, which reads the measured grid |
| A sample file is refused | It is not a WAV | Convert it to WAV first, with the owner's word if a tool must be installed |
| The flute does not speak, or squeals | `breath` outside 0.86 to 0.92, or a note below about C4 | Keep `breath` in that range; give low notes to strings or a pluck |
| A score "in the manner of" sounds like the original | Its melody or its chords were taken | Rewrite from the style sheet (section 4.5) |
| Every word time is 1.5 times too late | A SAPI file written at 24 kHz | Use `scripts/voice-sapi.ps1`, which writes 16 kHz |
| The words are marked `estimated` with a SAPI voice | The engine reported a different number of words than the text holds (numbers, abbreviations) | Spell numbers and abbreviations out in the text |
| A voice phrase is not in the mix | Its WAV does not exist; the script says so | Run the voice step |
| A plate jumps to the top while the voice speaks | It was placed at the bottom, where the voice captions stand; the script warns | Place it at the top or the middle in `shots.json` |
| The music pumps between words | `hold` is shorter than the pauses in the speech | Raise `duck.hold` |
| The drop sounds flat | The limiter takes several dB off it | Lower the impact or the bus that peaks there; read the time the script prints |
| The mix is dense | Too many parts in the middle band | Take a part out (section 4.5) |
| The file differs on another machine in its last bits | Math functions differ between engines | Expected. Compare on one machine |
| The owner hears the text of the script in a company's service | A cloud voice was used without asking | Ask before any voice that leaves the machine |
