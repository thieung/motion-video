# Music and beat

This file covers the music of a code-rendered film: where it comes from, how the owner chooses it, how its beats, bars and parts are measured and checked, and how its shape decides the shape of the film. It also lists the clock helpers a shot uses, so that every event on screen sits on a beat that was read from the data.

Load this when: the film has music and no final audio file exists yet; a beat grid must be built, checked or repaired; the storyboard needs the lengths of sections and shots in bars; a builder asks how to place an event on a beat; or the picture drifts away from the sound. For music composed in code, sound effects and a voice-over, load `sound-and-voice.md` as well.

## Rules in short

| Rule | Reason |
|---|---|
| A paid generation is never started without asking the owner first. A yes covers one request, not the next one. | The money is the owner's. |
| Rights for commercial use are a question for the owner. The lead reports what is known and what is not known. | The lead cannot verify a licence. |
| Taste is judged by the owner's ear. Measurement is used for timing only. | A track that measures better is not a track the owner likes better. |
| A grid is looked at before it is trusted. | A tracker can be wrong by one beat and still print a plausible tempo. |
| Events are placed by beats read from the data, never by seconds and never from a tempo number. | Tracks do not hold one tempo. |

## 1. Where the music comes from

| Source | What it needs | What it risks |
|---|---|---|
| A track the owner brings | The file at full quality, and the owner's word on who holds the rights. | Its length and its parts are fixed. The film follows them, or the track is cut by bars (section 7). |
| A track from a licensed library | A licence that fits the place where the film will be shown. | The licence may not cover that place. |
| A track made by a generation service | The owner's yes before each paid request, and a written request (section 2). | The tempo may drift, the length may differ from the request, and the rights must be checked. |
| A score composed in code | A score written as data and rendered by `bun run score` (`sound-and-voice.md`). Nothing to buy, nothing to download. | It sounds clean and synthetic, or like a clean sketch of an acoustic family, not like a band. Nobody has listened to the starter's instruments yet. |
| A tracker module the owner brings (MOD, S3M, XM, IT) | A player that renders it to WAV, which is an install (for example the command-line player of libopenmpt); or a parser of its patterns, which is not built. | Its timing is exact in its data, but only the data says so: see below. |
| No music: a voice-over, or silence | With a voice, the time of every word (section 10). With silence, a length in seconds. | There is no measured beat grid. A grid is still needed for cutting: make one (`bun run make-grid`) or compose a quiet bed, and place the voice on it (section 10). |

A composed score needs no analysis: its grid is written with it, exactly, and sections 4 to 6 of this file do not apply to it. Sections 7 and 8 do. Sound effects, a voice or a bed laid over a track the owner brings follow the track's measured grid (`sound-and-voice.md`, section 5.2).

### Tracker music

A tracker module (the music of 1990s demos and games: MOD, S3M, XM, IT) is not a recording but a score: patterns of rows, each row a step on which every channel may start a note, and a timing written into the file. A row lasts `2.5 / tempo × speed` seconds, where tempo and speed are the module's own settings (tempo 125 and speed 6 give 0.12 seconds a row), and effects inside the patterns may change both at any row. So the grid of a module is known exactly, uneven where its effects change speed, and every note of every channel is an onset that could be written straight into `onsets`, with no measuring at all.

What playing it needs:

| Way | What it gives | State |
|---|---|---|
| Render it to WAV with a module player (libopenmpt's command-line player, or another) | A track like any other; then measure it (section 4), or read its grid from the module | An install: the owner's word. Not tried |
| Read its patterns in code, as data | The exact grid and every note as onsets, and the order of its patterns as the music map | Not built. MOD is a simple format; S3M and the others take more. The samples inside the module are still needed to hear it |
| Play it live in the page with a JavaScript or WebAssembly player | Sound in the browser | A package: not added. Its clock is not the studio's clock |

Until one of these is chosen with the owner, treat a module like a track: render it once, with the owner's word, and measure it. The rights of a module are the owner's question, as for any track; many modules of the demo scene carry the author's own terms.

Ask the owner which source to use. Do not pick a generation service because a key for it exists on the machine. Tools that are installed are options, not requirements.

Two rules hold for every source. A paid generation is never started without asking the owner first, and a yes given once does not cover the next request. Rights for commercial use are a question for the owner: the lead writes down what is known and what is not, and does not decide.

From practice: both reference films used tracks generated by Suno through key4u. One request returned two clips. The requested length was ignored: 145 seconds were asked for and about 207 seconds came back. The links to the results were temporary, so the files were downloaded at once. Billing showed up late, about 1.20 USD for one request and the conversion of its two clips. The rights for commercial use of these tracks were never verified, and this is recorded as open.

## 2. Writing a request for generated music

| What to specify | How | Words used in real requests |
|---|---|---|
| Genre | Two genre names, then the instruments that carry it. | "electro house, bass house", "punchy four-on-the-floor kick", "growling syncopated bassline" |
| Tempo | A number inside the style text. | "130 bpm" |
| Instrumental | The instrumental switch of the service, the word in the style text, and a list of things to keep out. | "instrumental"; kept out: "vocals, singing, rap, choir, spoken word, vocal chops" |
| Structure | Part labels in order, one per line, as the text of the request. | `[Intro]`, `[Build]`, `[Drop]`, `[Drop 2]`, `[Breakdown]`, `[Build]`, `[Final Drop]`, `[Outro]` |
| Builds and drops | Words that ask for contrast between parts. | "big build-ups, hard drops", "tense risers" |
| A steady kick | Ask for it by name. The beat tracker follows the kick drum. | "four-on-the-floor kick", "clear eight-bar phrases" |
| Length | A number of seconds. Do not rely on it. | 145, 180 |

What services tend to ignore:

| Asked for | Received |
|---|---|
| A length of 145 seconds | Two clips of about 207 seconds |
| A length of 180 seconds | Clips of 213, 233, 162 and 172 seconds |
| 140 BPM | A track that drifts from about 138.2 to 139.6 BPM |
| A named model version | The response does not say which model ran, so this cannot be confirmed |

Ask for more than one candidate. Requests in two or three different directions, followed by a choice, reach a good track faster than one request that tries to describe the right track at the first attempt. State the number of requests and the expected cost when asking the owner for a yes.

## 3. Choosing the track

| Step | What the lead does |
|---|---|
| 1 | Puts every candidate in one folder as a full-quality file. A compressed copy is not handed over for judging. |
| 2 | Tells the owner the path, and the length and tempo of each candidate. |
| 3 | Waits. The owner listens and picks. |
| 4 | Answers a remark about feeling in a few lines, with at most one simple choice: keep this track, or ask for a new candidate in a named direction. |
| 5 | Asks before any new paid request. |
| 6 | Records the choice: which file, and whether it is processed or not. |
| 7 | Uses the track whole if it fits the length the film needs. Each join is a risk to the music. |

Rule: do not use measurements to argue about taste. Spectrum, bass level, stereo width and onset counts do not explain why a track feels right, and they are not run in answer to a remark about feeling. Measurement belongs to timing, where it is reliable.

From practice: the owner said a chosen track lacked detail and that its bass was not deep. The lead measured the spectrum, made a processed copy, and sent a fourth paid request to Suno without asking. The owner stopped the analysis and settled the matter in one line: the chosen track was fine, and the newer clips were more detailed but cluttered. The clips that measured better on bass level and stereo width were the ones the owner liked less. The film kept the first choice, unprocessed. The owner may also have listened to the compressed copy that the studio plays, which is why step 1 exists.

## 4. The analysis pipeline

The scripts ship in the starter (`assets/starter/analysis/`, the generator in `assets/starter/scripts/`). Paths in this chapter are relative to a film folder made from the starter. Its README says how to make the Python environment on each system.

| Script | Reads | Writes |
|---|---|---|
| `analysis/analyze-beat-grid.py` | The track | The analysis file the engine loads |
| `analysis/plot-beat-grid-qa.py` | The track and the analysis file | `structure.png` and four `zoom-bar-NNN.png` images |
| `analysis/track-beats-by-phase-lock.py` | The track and the analysis file | A grid file, used to repair a miscount (section 5) |
| `analysis/edit-track-by-bars.py` | The track, the analysis file and an edit file | A cut track and its grid file (section 7) |
| `scripts/build-shot-files.py` | The shot list and the grid | The shot boundaries in seconds, inside the analysis file |

```sh
P=analysis/python-env/bin/python
$P analysis/analyze-beat-grid.py IN.wav OUT.json [--sections sections.json] [--bpm-min 125 --bpm-max 180] [--bar-offset N]
$P analysis/plot-beat-grid-qa.py IN.wav ANALYSIS.json OUT_DIR
```

Run one analysis at a time on a machine the owner is working on. The libraries are pinned in `analysis/requirements.txt`, as they were resolved on macOS; on another system, install the unpinned set if a pin fails.

| Step | What `analysis/analyze-beat-grid.py` does |
|---|---|
| Envelopes | It filters the track into bands and takes the amplitude envelope of each band from the analytic signal. A short loudness window is not used on the low band, because it follows the waveform and reports every cycle as an attack. |
| Kick onsets | It smooths the envelope below 150 Hz until the ripple of the bass line is gone, and takes each peak of the slope as a kick. Kicks are at least 0.18 seconds apart. Each time is moved back to the click of the kick, which is found in the band from 2000 to 16000 Hz. |
| Beat tracking | The starting period is the median gap between kicks inside the tempo range. The beat list then follows the kicks one by one. A kick within 0.12 of a beat of the predicted place is on the beat. The period follows the tempo slowly. |
| Beats without a kick | They are spaced evenly between the measured beats on either side. After a gap of 8 beats or more, the grid locks again only on a kick that starts a regular run. |
| Downbeats and bar phase | Every kick that returns after 8 beats without a kick votes for its place in the bar as beat one. If the vote is not clear, the change of energy from beat to beat decides. `--bar-offset` overrides both. |
| Sections | `--sections` takes a list of `{name, bar, bars}`. Bars are counted from the first downbeat, from zero. The script turns them into seconds. |

Features kept for every frame, 100 values per second, each scaled from 0 to 1:

| Name | Band | Meaning |
|---|---|---|
| `rms` | Everything up to 16000 Hz | Loudness |
| `low` | Below 150 Hz | Kick and bass |
| `mid` | 150 to 2000 Hz | Body of the track |
| `high` | 4000 to 16000 Hz | Hats and air |

Onsets are lists of `[time, strength]`, with strength from 0 to 1. `kick` is measured as described above. `snare` holds the attacks in the band from 180 to 2500 Hz, and `hat` holds the attacks in the band from 7000 to 16000 Hz. These two are attacks in a band, not recognised instruments. Read them as "something sharp happened in this band".

Shape of the analysis file (`data/audio.json` of a film):

| Key | Type | Content |
|---|---|---|
| `source` | text | Path of the analysed track |
| `duration` | number | Length in seconds |
| `bpm` | number | Median tempo. For display only, never for timing |
| `fps` | number | Rate of the envelopes, 100 |
| `beats` | list of numbers | Time of every beat in seconds. The gaps are uneven |
| `downbeats` | list of numbers | Time of the first beat of every bar |
| `sections` | list of `{name, start, end}` | One entry for each shot, in seconds, although the key is called sections |
| `features` | lists under `rms`, `low`, `mid`, `high` | The envelopes |
| `onsets` | lists under `kick`, `snare`, `hat` | `[time, strength]` pairs |
| `notes` | object | Evidence for checking the grid: `beats_measured`, `beats_interpolated`, `kicks_total`, `grid_source`, `kick_minus_beat_ms`, `click_lag_ms`, `local_bpm_every_16_beats`, `bar_offset`, `reentry_votes`, `novelty_by_offset`, `measured_flags`, `stems` |

A grid file, written by the phase-lock script and by the edit script, is smaller: `duration`, `beats`, `downbeats`, `joins`, `source`, and `notes` or `edit`. Its first beat is beat one of a bar. It has no envelopes, so the plot script cannot read it. Pass it to `analysis/analyze-beat-grid.py` with `--beats-from` to get a full analysis file.

## 5. Checking the grid

| Check | How | It passes when | What it cannot see |
|---|---|---|---|
| By eye | Run the plot script and open the images. Each zoom image shows two bars of the low band with the grid on top: red lines are downbeats, blue lines are beats. | A kick starts on each line, in all four images. | A miscount. The beats still sit on kicks on both sides of it. |
| By count | Compare the number of beats with the length of the track divided by the median beat period. Read `local_bpm_every_16_beats` and `reentry_votes`. | The count agrees, the local tempo has no jump, and the votes fall on one place in the bar. | A grid that is early or late by a constant few milliseconds. |
| By ear | Mix a click on every beat over the track and let the owner listen at the start, in the middle and at the end. | The click and the kick sound as one. | It depends on the listener. It is a last check, not a measurement. |

No script mixes a click over the track. The analysis environment holds a function for it (`librosa.clicks`), but nothing calls it yet. The starter's studio has a `click` source on its music switch, which plays the grid alone; switching between it and the track (`M`) at the same moment is a rough check. The check by ear is otherwise done in the studio: a shot that is not built yet is shown as a card that pulses on every beat, and the owner watches it against the kick.

| Failure | Sign | How to detect | How to repair |
|---|---|---|---|
| Tempo drift in a generated track | The picture is in time at the start and late further on. | Compare the gaps between kicks at the start and at the end. Read `local_bpm_every_16_beats`. | Follow the kicks. `analysis/analyze-beat-grid.py` does this, and the engine accepts uneven beat times. Never rebuild beat times from `bpm`. |
| A miscount in a long stretch without a clean kick: a breakdown, or a drop where a side-chained bass hides the kick | The local tempo jumps in one stretch and then returns. `reentry_votes` is split. Everything after the stretch is one beat off. | Read `measured_flags` for a long run of `0`. Count the beats in that run against its length and the beat period on either side. | Run `analysis/track-beats-by-phase-lock.py`. It starts from the longest run of beats the kick analysis measured, and walks outwards beat by beat. |
| A pickup bar | In `structure.png` every step of energy falls one bar to the right of a phrase line. Every phrase of the film starts one bar early. | Find where the kick returns after a stretch without it. Divide that bar number by 8 and read the remainder. | Leave the grid as it is. Count phrases from bar 1, and write the bars of the shot list to match. |

The phase-lock script predicts the next beat from the current period. It looks within 32 milliseconds of the prediction for a kick, and failing that for any sharp onset. It moves the beat by half of the difference, and it keeps the period within 2 percent of the starting period. It starts from a run of measured beats that still holds 16 beats after two are dropped at each end.

```sh
$P analysis/track-beats-by-phase-lock.py IN.wav KICK_ANALYSIS.json OUT_GRID.json [--bar-offset N]
$P analysis/analyze-beat-grid.py IN.wav OUT.json --beats-from OUT_GRID.json --sections sections.json
```

After the second command, read `kick_minus_beat_ms`. It is the distance from each beat to its kick in the audio, as a median and as the 95th percentile. The same command checks a processed copy of a track against the grid of the original: processing must not move the timing.

How to read where phrases start from `measured_flags`: the text holds one character for each beat, `1` for a beat with a kick. A `1` after eight or more `0` is a kick that returns. Its index divided by 4 is its bar, if `bar_offset` is 0. Phrases are 8 bars long, so the remainder of that bar divided by 8 is the same for every true phrase start. Two separate questions must not be mixed: which beat is beat one of a bar (`bar_offset`), and which bar is bar one of a phrase (the pickup).

From practice: the first film's track drifted from about 138.2 to 139.6 BPM, and a grid with one constant tempo was off by up to 65 milliseconds. Six rounds of fitting a grid were spent before the raw gaps between kicks showed that the tempo itself was moving. After the repair the grid sat on the kicks with a median distance of 1.5 milliseconds. On the second film's track the kick tracker returned 376 beats, a local tempo of 132.3 BPM in four windows in a row against about 130 elsewhere, and votes of 1, 2, 0 and 1. The phase-locked grid returned 375 beats, a local tempo between 129.9 and 130.5 BPM, and votes of 5, 0, 0 and 0. It locked on a kick for 238 beats, on another onset for 135, and on nothing for 2, and its median distance to the kicks was 0.0 milliseconds. In that track the kick returned at bars 9, 41, 65 and 81. All four leave a remainder of 1, so bar 0 is a pickup and phrases start at bars 1, 9, 17 and so on. A fifth return at bar 75 followed a stop of only two bars: a break inside a phrase, not a phrase start.

## 6. The music map

The music map names the parts of the track in bars. It is a table in the storyboard, and it is made before any shot gets a length.

| Part | What it is | How to find it |
|---|---|---|
| Intro | The opening, before the first kick | `measured_flags` starts with a run of `0`. The low band is weak in `structure.png`. |
| Build | The last bars before a drop, where tension rises | The bars before a kick returns. The low band is still weak. |
| Drop | The kick returns on beat one and the track is at full weight | A `1` after a long run of `0` in `measured_flags`. All three bands are strong in `structure.png`. |
| Break | A short stop of the drums inside a phrase | A run of `0` that lasts one or two bars. |
| Breakdown | A long passage without the kick, a phrase or close to it | A run of `0` that lasts many bars, in the middle of the track. |
| Outro | The end, where the track thins out | The bands fall in the last bars of `structure.png`. |

| Step | What the lead does |
|---|---|
| 1 | Checks the grid first (section 5). A map on a wrong grid is wrong everywhere. |
| 2 | Opens `structure.png` and reads the energy of each bar in the three bands. |
| 3 | Reads the runs of `0` and `1` in `measured_flags` and turns their ends into bar numbers. |
| 4 | Marks the phrase starts and confirms that they are 8 bars apart. |
| 5 | Names each part and writes the map: part, first bar, number of bars, drums in or out. |
| 6 | Shows the map to the owner together with the storyboard. The lead cannot hear the track, so the owner confirms the places of the drops. |

Bars in the map are counted from zero, from the first downbeat. The shot list and `--sections` count the same way.

## 7. Giving the story to the music

| Part of the music | Content that suits it | Reason |
|---|---|---|
| Intro without drums, or a build | A problem that grows | Tension in the sound carries tension in the story. |
| Drop | A reveal: the answer, or the name of the thing | The heaviest moment of the music meets the most important moment of the section. |
| Break, where the drums are out | Words that must be read | Nothing competes with the text. The camera may stand still. |
| Drop phrase | The fastest cutting of the film | The phrase carries a cut on nearly every bar. |
| Breakdown | Waiting, a quiet point of view, a slow move of the camera | The music itself has stepped back. |
| Outro | The recap and the closing line | The film ends with the track. |

How the lengths of the film follow the phrases:

| Unit | Rule |
|---|---|
| Section | It starts where a phrase starts, and it lasts a whole number of bars. Sections may differ in length. |
| Shot | It starts on a downbeat. Its length is written in bars in the shot list. |
| Transition into a drop | It takes the last beats of the shot before the drop. What matters in that shot must be over before them. |
| Text | It lies inside its own section, and it stays long enough to be read. |

After every change to the shot list, run `scripts/build-shot-files.py`. It stops if two shots leave a gap or overlap, or if a caption runs outside its section. Then it writes the boundaries of the shots into the analysis file in seconds.

When the story and the music disagree:

| Option | Use it when | Cost |
|---|---|---|
| Change the lengths of the story | The track fits the length the film needs. | None to the music. The story bends. |
| Move sections to other parts of the track | The order of the story is free. | Only the sections that move are rebuilt. |
| Cut and join the track by bars | The track is too long, or a part must go. | Each join is a risk to the music. |
| Ask for a new track | Nothing above works. | It is paid. Ask the owner first. |

Cutting by bars is done with `analysis/edit-track-by-bars.py`. Every join sits a few milliseconds before a downbeat, so the click of the next kick is never cut. The grid is carried through the cut and is not detected again. The edit file names the bars to keep:

```json
{"lead_ms": 15, "crossfade_ms": 10, "fade_in_ms": 400, "fade_out_s": 3.0,
 "segments": [{"src_bar": 3, "bars": 60}, {"src_bar": 117, "bars": null}]}
```

```sh
$P analysis/edit-track-by-bars.py IN.wav ANALYSIS.json EDIT.json OUT.wav OUT_GRID.json
$P analysis/analyze-beat-grid.py OUT.wav OUT.json --beats-from OUT_GRID.json --sections sections.json
```

From practice: the first film cut its track from 207 to 134.9 seconds in four segments. Material was only removed and nothing was put in a new order. The second film used its track whole, 172.4 seconds. Its sections last from 8 to 14 bars and its shots last 1, 2 or 3 bars. Its five transitions into a drop sit at bars 9, 41, 65, 75 and 81, which are the bars where the data shows the kick returning. Each takes 2 beats from the shot before. When the owner moved one section to the front and another to the end, the two changed places in the music, and the six sections between them kept their bars and needed no rebuilding.

## 8. The clock a shot uses

Three files of the starter hold the clock. They do not count from the same number. In the code a shot is called a scene.

| File | What it counts | Counts from |
|---|---|---|
| `src/engine/audio.ts` | Beats and bars of the whole track | Zero, at the first beat |
| `src/engine/beat-cues.ts` | Bar and beat as a musician counts | One |
| `src/scenes/parts/kit-frame.ts` | Beats since the shot began | Zero, at the first frame of the shot |

| Helper | What it returns | Typical use |
|---|---|---|
| `audio.timeOfBeat(i)` | The time in seconds of beat `i`. A fraction is allowed. | Time of a beat |
| `audio.beatAt(t)` | The beat index at time `t`, with its fraction | Beat at a time |
| `audio.barAt(t)` | The bar index at time `t`, from the downbeats | Bar at a time |
| `audio.nearestBeat(t)` | The time of the beat nearest to `t` | Moving a time onto the grid |
| `audio.section(t)` | The entry of `sections` that holds `t` | Which shot is playing |
| `f.beat`, `f.bar`, `f.beatPhase`, `f.barPhase` | The beat and bar index of the whole track at this frame, and their fractions | A readout, or a pulse that ignores where the shot began |
| `audio.env(name, t)`, `audio.envPeak(name, t)` | An envelope value from 0 to 1, or its peak over the last moments | A small, continuous reaction to the sound |
| `audio.hit(kind, t)` | A pulse that decays after each onset of that kind | A reaction to the real drum hits |
| `timeOfPosition(grid, pos)` | The time of a bar, beat and fraction | A cue written as bar 3, beat 2 |
| `positionAt(grid, t)` | Bar, beat and fraction at time `t` | A readout in the studio |
| `cueStateAt(grid, cue, t)` | `active`, `progress`, `tStart`, `tEnd`, `elapsed`, `remaining` | Text that is on from one position to another |
| `sceneClock(au, f)` | `beats`, `bars`, `bar`, `beat`, `phase`, `length` for this call | Everything that moves |
| `frameClock(au, f)` | The same, at the time of the output frame | Everything that steps: a counter, which word is showing |
| `sceneTime(au, f, beats)` | The time in seconds of a beat of the shot | Handing a beat to code that needs seconds |
| `since(au, f, beats)` | Seconds since a beat of the shot, negative before it | Since a beat: springs and pulses |
| `hit(beats, at, halfLife)` | 0 before `at`, then 1, halved every `halfLife` beats | On the beat: an accent |
| `over(beats, at, dur, fn)` | An eased value from 0 to 1 over `dur` beats | A move that begins on a beat |
| `during(beats, at, until)` | True from `at` until `until` | During beats: something shown for a span |
| `steps(beats, at, every)` | The number of whole steps since `at` | Counters, and cuts that step on the beat |
| `groove(beats, every, offset, halfLife)` | An accent that repeats | A pulse on every beat. Offset 0.5 is the off-beat. Every 2 with offset 1 is the backbeat. |

```ts
const k = sceneClock(audio, f);    // for everything that moves
const kf = frameClock(audio, f);   // for everything that steps
```

Two lines from real shots of the reference film, a stamp landing and a slot machine:

```ts
return { ...POST_LIGHT, zoom: 1 + 0.012 * hit(k.beats, STAMP, 0.25) };
return { ...POST_DARK, bloom: 0.6, vignette: 0.5, zoom: 1 + 0.008 * groove(k.beats, 1, 0, 0.2) };
```

Rule: events are placed by beats read from the data, never by seconds and never from a tempo number. A builder writes `at` as a beat of the shot. The helpers turn it into time through the measured grid, so a tempo that drifts is followed beat by beat. Motion is scheduled on beats and is not driven by loudness. A pulse with the beat is seasoning: the two lines above move the zoom by about one percent. It is not the main movement.

## 9. Tempo and genre as a starting point for an interview

This table is a guide, not a rule. It holds what was tried on the two reference films and how their owner reacted. Another owner may hear it differently.

| Tempo | Genre asked for | Feeling asked for | What the owner said |
|---|---|---|---|
| Below 120 BPM | Nu-disco funk | Playful, upbeat | Too gentle. Rejected. |
| About 130 BPM | Electro house, bass house | Energetic, aggressive | Chosen. The owner likes this genre. |
| 138 to 140 BPM | Techno | Tense builds, hard drops, dark, powerful | A track asked for at 140 was approved. Candidates asked for at 138 were not chosen. |

Use it to open the conversation: ask for a track the owner already likes, for gentle or driving, and for a genre by name. Then propose two or three directions. For a film that explains a topic over an instrumental bed, this owner asked for a beat that is usually above 130 BPM.

## 10. Voice-over and captions timed to speech

| Matter | Music only | With a voice |
|---|---|---|
| What leads the timing | The beat grid | The time of each word |
| Role of the music | It decides the cuts | It is a bed, and it is ducked under the voice |
| Data needed | Beats, downbeats, onsets | Word timings. This is the most laborious data to get |
| Captions | Placed on bars and beats | Placed on the words, in small groups of words |

The engine route handles a voice through `sound-and-voice.md`: the voice is written as phrases in `data/voice.json`, spoken by a voice step into one file a phrase with its word times, placed by `bun run score` so that each phrase's first word lands on a beat, and mixed with the bed ducked under it. The grid keeps ruling the cuts. The caption groups go to `data/lyrics.json`, and a grid made by the score carries a `vocal` envelope and `vocal` onsets, so `f.a.vocal` and `f.a.vonset` work.

What exists and what does not:

| Part | State |
|---|---|
| A local Windows voice with word start times (`bun run voice:sapi`) | Built and run on Windows 11. English voices only on a stock English system |
| Word times estimated from the sound when a voice gives none | Built. Off by up to a quarter of a second on the example |
| Ducking with look-ahead, a limiter, a loudness target | Built |
| Caption groups from word times, drawn by the overlay at the foot of the frame | Built; checked in stills on Windows 11 |
| A voice recorded by a person, with times from transcription or forced alignment | Not built. Needs a tool the owner must allow to install |
| A voice, effects and a bed over a measured track, the track ducked, the mix at a loudness target | Built (`track` in the score, `sound-and-voice.md`, section 5.2). Tested with test files, not with a real track |

A measured track has no voice envelope unless the analysis made one: `notes.stems` says so, and a shot that reads `vocal` then gets 0. The HyperFrames route states that it has speech with word timings, transcription and a carve of the music under the voice; none of these were run on this machine. If the film has no voice, skip all of this.

## 11. This route against HyperFrames

Source: sections 6.9 and 9 of `hyperframes-facts.md`, and `sound-and-voice.md` for this route. "Stated" means written in a HyperFrames skill file or printed by its tool. None of its audio commands were run on this machine, so their behaviour is unknown. "Not yet heard" means the code ran and its output was measured, but nobody has listened to it.

| Matter | This route | HyperFrames | Marking |
|---|---|---|---|
| Beat times | Measured from the kicks, uneven, checked against the audio | A `beats` command writes `beats/<audio>.json` | The command is stated. The format and the method of the file are unknown. |
| Tempo drift | Followed beat by beat | "HyperFrames does not provide automatic waveform sync or drift correction." One of its rules uses an even grid. | Stated |
| Map of a whole track | `structure.png`, `notes`, the music map | A `music-to-video` workflow with an `audiomap.json` | It is named but not installed. Its content is unknown. |
| Envelopes | Four bands, 100 values per second | Bands extracted before rendering, with `--fps 30 --bands 16`. No analysis while playing. | Stated |
| Cutting a track by bars | `analysis/edit-track-by-bars.py`, with the grid carried | Nothing found | Unknown |
| Word timings | From a local Windows voice (SAPI), or estimated from the sound (`sound-and-voice.md`, sections 9 and 10). No transcription | Speech and transcription with word timestamps | This route: run on Windows 11. HyperFrames: stated |
| Music under a voice | Ducking with look-ahead, per bus, in `bun run score`, on a composed bed or on a measured track | A carve, "required whenever music plays under a voice", default strength 0.8 | This route: run, not yet heard. HyperFrames: stated |
| Loudness | Integrated loudness measured and set to a target, a look-ahead limiter, in `bun run score`, for a composed score or a track with effects | A command matches the loudness of one clip to another | This route: run. HyperFrames: stated |
| Music written in code | A score as data rendered to a WAV with its exact grid (`bun run score`) | Nothing found | This route: run, not yet heard |
| Sound effects | Synthesised effects and presets, and recorded WAV files placed by their measured peak, on cues in bars and beats of a composed or a measured grid | Bundled effects | This route: run, not yet heard. HyperFrames: stated |
| Tracker modules | Not read; render and measure (section 1) | Nothing found | Unknown |
| Finding music | The owner's choice, from any source | A catalogue with generation as a fallback. Its prompt table has base tempos from 92 to 115 BPM. | Stated |

## 12. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The picture is in time at the start and late further on. | Beat times were computed from one tempo number. | Read beat times from `beats`. Build the grid from the kicks. |
| The kick detector returns hundreds of kicks that are not there. | A short loudness window on the low band follows the waveform. | Use the envelope of the analytic signal, smooth it, and take the peaks of the slope. |
| The time scale is off by 0.227 percent and the error grows to 0.4 seconds by 3 minutes. | The envelope was sampled every `44100 // 1000` samples, which is 1002.27 Hz. | Sample at exact times. |
| The local tempo jumps in one stretch and returns. | The tracker counted one beat too many or too few where there is no clean kick. | Track by phase lock, then count again. |
| Every section starts one bar before the music changes. | The first bar is a pickup. | Count phrases from bar 1. |
| The zoom images look right and the film is still one beat off after the breakdown. | The images show four places only, and beats sit on kicks on both sides of a miscount. | Check by count as well as by eye. |
| The plot script fails on a grid file. | A grid file has no envelopes, no `bpm` and no `fps`. | Make a full analysis file with `--beats-from` first. |
| A cue lands one bar or one beat away from where it was written. | Positions in `beat-cues.ts` count from one. The shot list and the shot clock count from zero. | Check which file the number is for. Bar 29, beat 0 of the track is beat 116. |
| A counter shows two values at once. | A value that steps was read from the clock of the sample, not of the frame. | Read values that step from `frameClock`. |
| A shot reads `drums`, `bass` or `vocal` and nothing moves. | The analysis has no stems. `notes.stems` says so. | Use `low`, `mid`, `high`, or the onsets. |
| The grid is off after the track was mastered or converted. | The processing moved the timing. | Analyse the new file with `--beats-from` and read `kick_minus_beat_ms`. |
| The owner rejects the track that measured better. | Measurement was used to argue about taste. | Hand over the files. The owner listens and picks. |
| The owner learns of a charge after it was made. | A paid request was sent without asking. | Ask before every request, and name the cost. |
| The track is much longer than the film. | The service ignored the requested length. | Cut by bars, or let the story use the whole track. |
| The music hits and nothing happens in the picture. | The drop is treated as a plain cut, or the shot opens on an empty frame. | Give the drop a build, a breath and an impact. Give the first frame weight. |
| A join in the track can be heard. | The cut fell inside a bar, or on the click of a kick. | Cut a few milliseconds before a downbeat and crossfade. |
