# Storyboard

The storyboard is the film written down as data before any picture is drawn: every shot with its place in the music, and every sentence the viewer will read. This file gives the schema of that data, the checks it must pass, what is generated from it, and how the lead writes, shapes and changes it.

Load this when: you write or change a shot list or a copy file, run the generator, prepare the animatic for the owner, choose shot ids, or change the order or the content of a film whose shots already exist.

Paths in this file are relative to a film folder made from `assets/starter/`.

## 1. Why the storyboard is data

A storyboard written as prose must be copied by hand into every place that needs it, and the copies drift apart. Written as data, it is the one source for three things.

| Product | Who uses it | What it takes from the data |
|---|---|---|
| The storyboard document | The owner reads and corrects it. Builders read it before they build | Every field of every shot, the sentences, the reasons |
| The boundaries of the shots in time | The app, to know which shot plays when | `id`, `bar`, `bars`, and the beat grid |
| The cards of the animatic | The owner, who watches them in the studio with the music | The describing fields of each shot, read by the app at run time |

- The lead edits the two data files. Everything else is generated from them or reads them directly.
- The app holds no copy of what a shot is or of what a caption says.
- The generator runs after every change to either file, and its checks must pass before anyone builds.

## 2. The two files and their schema

| File | Holds |
|---|---|
| `shots.json` | Transition kinds, groups (the sections of the film), shots, captions |
| `copy.json` | Every sentence of the film, already broken into lines, and the small labels over plates |

Names used in the "Read by" columns: the generator is `scripts/build-shot-files.py`; the app is `src/film.ts` and `src/timeline.ts`; the card is `src/scenes/storyboard-card.ts`; the overlay is `src/scenes/overlay.ts`; the studio is the page made by `src/main.ts`. The app reads both files through `src/film.ts`, which also gives their types. A bar has four beats everywhere in the starter. Bars are bars of the music, counted from zero, and may be fractions.

"Required" means the generator refuses the data without it. Every field is general: the starter has no field that belongs to one film only.

### Shot list, top level

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `comment` | string | The conventions of the file, in prose | People only |
| `transitions` | object, kind to `{label, what}`, required | The dictionary of transition kinds: a name and a description for the document. Every kind must be a kind the engine can play | Generator, card |
| `groups` | array, in film order, required | The sections of the film | Generator, overlay, studio |
| `shots` | array, in the order of play, required | The shots. The checks compare neighbours in this order | Generator, app, card, overlay, studio |
| `captions` | array, required (may be empty) | When and how each sentence reaches the viewer | Generator, overlay, builders through `captionFor` in `src/film.ts` |

### Group (a section)

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `id` | string, required, unique | Key that shots, captions and the copy file refer to | Generator, app, overlay, studio |
| `kind` | `title`, `section`, `recap` or `end`, required | What the group is. Only a `section` carries the counter, captions and copy | Generator, overlay, studio |
| `label` | string, required for every kind but `section` | Heading of the group in the document and the studio | Generator, studio |
| `n` | whole number, required for a `section`, unique | Number of the section as the viewer sees it | Generator, overlay, studio |
| `name` | string, required for a `section` | Name of the section as the viewer sees it | Generator, overlay, studio |
| `shape` | string | How the group is told: its arc and what the music decides | Generator, builders |
| `reveal` | number, bar of the music, `section` only | Bar at which the name is first shown. Before it the counter shows `???`. Without it the name shows from the first bar of the section. It must lie inside the bars of the section | Generator, overlay |

A film may add fields of its own for its builders. The reference film gave each section an `idiom`, the kind of old print it borrows its look from, and gave each copy entry a `signalThing`, the thing in the picture that carries the reserved colour. The generator neither checks nor prints fields it does not know, so they do not appear in the document: tell the builders to read them in the data file.

### Shot

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `id` | string, required, unique, lower case | Key of the timeline and name of the scene file. See section 6 | Generator, app, card, overlay, studio |
| `group` | string, required | Id of the group the shot belongs to | Generator, overlay, studio |
| `bar` | number, bars, required | Where the shot starts | Generator, overlay, card |
| `bars` | number, bars, required, more than 0 | How long the shot lasts | Generator, overlay, card |
| `tone` | `dark` or `light`, required | The ground the shot stands on | Generator, card, app (colour of the letters of a `through` transition) |
| `title` | string, required | Short name of the shot for people | Generator, card, studio |
| `in` | object | The transition that leads into the shot. The first shot has none, every other shot has one | Generator, app, card |
| `see` | string, required | What is on screen | Generator, card |
| `move` | string, required | How the picture moves with the music | Generator, card |
| `camera` | string, required | What the camera does | Generator (check and document), card |
| `look` | string, required | What kind of image it is | Generator, card |
| `repeat` | `true`, optional | The shot repeats the camera move or the transition of the shot before on purpose; silences the two warnings for this pair | Generator |

### Transition (`in` of a shot)

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `kind` | string, required | A key of `transitions` | Generator, app, card |
| `lead` | number, beats, 0 or more, required | Beats taken from the end of the shot before | Generator, app |
| `tail` | number, beats, 0 or more, required | Beats taken from the start of this shot | Generator, app |
| `focus` | `[x, y]`, pixels of the master frame, y down; carried over to another format in proportion | The point the transition turns on. Default: the middle of the stage | App |
| `dir` | `[x, y]`, unit vector, y down | Direction of travel. Default: `[1, 0]` | App |
| `text` | string | For `through`: the letters that stand before the camera | App |
| `size` | number, px | For `through`: the size of those letters when they first stand there | App |
| `note` | string | What an in-world transition asks of the builders | Generator, builders |

### Caption

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `group` | string, required | Id of a group of kind `section` | Generator, overlay |
| `kind` | string, required | Which sentence of the section: a key of `lines` in its copy entry. The kinds are the film's own; the starter's example film uses `hook`, `idea` and `use`, the reference film used `problem`, `metaphor` and `when` | Generator, overlay, builders |
| `bar` | number, bars, required | When the sentence starts | Generator, overlay, builders |
| `bars` | number, bars, required | How long it stays | Generator, overlay, builders |
| `how` | `plate`, `shot` or `none`, required | The way the sentence reaches the viewer. See section 10 | Generator, overlay |
| `place` | `top`, `middle` or `bottom` | Where a plate stands. Required for a plate | Generator, overlay |
| `why` | string | The reason for `how` and `place` | Generator, owner, builders |

### Copy file

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `comment` | string | What the file is, and when the owner approved it | People only |
| `labels` | object, caption kind to string | Small label over a plate of that kind. A kind without an entry has no label | Overlay |
| `accents` | object, caption kind to palette key | Colour of the bar beside a plate of that kind. Default: `signal` | Overlay |
| `title` | object, key to array of lines (or one string) | Words of the title card. The keys are the film's own | Generator (printed in the document), builders of the title shot through `COPY` in `src/film.ts` |
| `closing` | object, key to array of lines (or one string) | Words of the end card. The keys are the film's own | Generator (printed in the document), builders of the end shot through `COPY` |
| `sections` | array, required | One entry for each group of kind `section` that has captions | Generator, overlay, builders |
| `sections[].group` | string, required | Id of the group. The generator and the app both join on it | Generator, overlay, builders |
| `sections[].n`, `.name` | whole number, string, required | Must equal `n` and `name` of the group | Generator |
| `sections[].lines` | object, caption kind to array of strings, required | One sentence for each caption kind, one string for each line on screen | Generator, overlay, builders through `captionFor` and `sectionOf` |

## 3. A minimal example

Three shots of an invented film about keeping a houseplant alive. Both files pass the starter's generator unchanged: put them in place of `shots.json` and `copy.json` of a fresh copy of the starter and run it.

```json
{
  "comment": "Shot list of a film about keeping a houseplant alive. Bars are bars of the music, counted from zero. `in` is the transition that leads into a shot; lead and tail are in beats.",
  "transitions": {
    "cut": {"label": "Straight cut", "what": "Nothing is added."},
    "whip": {"label": "Whip", "what": "The old shot smears in one direction and the new one comes out of the smear."},
    "zoom-in": {"label": "Into a detail", "what": "IN-WORLD. The next shot is held in a detail of this one. The camera goes into it."}
  },
  "groups": [
    {"id": "open", "kind": "title", "label": "Title"},
    {"id": "water", "kind": "section", "n": 1, "name": "Watering", "reveal": 4,
      "shape": "Problem first, in the bars without drums. The name arrives with the answer, on the first kick."}
  ],
  "shots": [
    {"id": "open-windowsill", "group": "open", "bar": 0, "bars": 2, "tone": "dark", "title": "A plant on the sill",
      "see": "A windowsill at night, one pot, one drooping plant. The name of the film stands behind the pot in type as tall as the frame, so the leaves overlap the letters.",
      "move": "First bar: the pot alone. Second bar: one word of the name on each beat.",
      "camera": "Locked off, the frame gives a little on each word",
      "look": "Full-frame type behind a drawn object"},
    {"id": "water-drowned-roots", "group": "water", "bar": 2, "bars": 2, "tone": "light", "title": "Too much water",
      "in": {"kind": "zoom-in", "lead": 1, "tail": 0, "focus": [540, 1300], "note": "The camera goes into the soil of the pot on the sill. The next shot is inside that soil."},
      "see": "The pot cut in half, seen from the side. Water is poured in four times and stands at the bottom. The roots turn from white to brown, from the tips up.",
      "move": "One pour on each beat of the first bar. The roots darken through the second bar.",
      "camera": "Sinks from the rim of the pot to its bottom",
      "look": "Cross-section in flat colour"},
    {"id": "water-finger-test", "group": "water", "bar": 4, "bars": 4, "tone": "light", "title": "Two knuckles deep",
      "in": {"kind": "whip", "lead": 0.25, "tail": 0.25, "dir": [0, -1]},
      "see": "A finger goes into the soil up to the second knuckle and comes out dry. Only then the watering can tips. A paper label stuck in the pot carries the sentence.",
      "move": "Finger in on beat one, out on beat three. The can tips on the first beat of the third bar.",
      "camera": "Pushes in slowly, then punches in once when the can tips",
      "look": "Close view, paper label with printed type"}
  ],
  "captions": [
    {"group": "water", "kind": "problem", "bar": 2, "bars": 2, "how": "plate", "place": "top", "why": "The roots fill the lower half of the frame."},
    {"group": "water", "kind": "metaphor", "bar": 4.25, "bars": 1.75, "how": "shot", "why": "The sentence is printed on the label in the pot. It starts one beat late, after the whip has settled."},
    {"group": "water", "kind": "when", "bar": 6, "bars": 2, "how": "none", "why": "The can tips only after the finger comes out dry: the picture says it."}
  ]
}
```

```json
{
  "comment": "Every sentence the film shows, already broken into lines. Approved by the owner.",
  "labels": {"problem": "WITHOUT IT", "when": "DO THIS WHEN"},
  "title": {"name": ["Keep it", "alive"], "line": ["three habits", "for one plant"]},
  "closing": {"line": ["Look first,", "then water."]},
  "sections": [
    {"n": 1, "group": "water", "name": "Watering",
      "lines": {
        "problem": ["Water by the calendar", "and the roots drown."],
        "metaphor": ["Soil is a sponge:", "feel it before you fill it."],
        "when": ["Water when two knuckles", "of soil are dry."]
      }}
  ]
}
```

With the starter's beat grid (120 BPM) the run prints `3 shots, bars 0..8, 16.00s`. The transition kinds are three of the kinds in `src/engine/transition.ts`; the dictionary lists only the kinds the film uses or may use. A recap and an end card are written like the title: a group of kind `recap` or `end` with a `label`, and its shots. The caption kinds `problem`, `metaphor` and `when` are this film's choice: any names work, as long as each caption's `kind` is a key of `lines` in its section's copy entry.

## 4. The checks

The generator reads both files and the beat grid, checks everything, and writes only when every check has passed. A failed run prints one line for each fault, in the form `error: <message>`, then `<n> fault(s); nothing was written.`, and exits with code 1. No generated file is touched, so the files never disagree after a failed run.

The checks run in two rounds. The first checks that every field is present and of the right type; if any fails, the run stops there and lists those faults. The second round checks how the fields fit together, and lists all its faults at once. Correct the data and run again.

### First round: files and fields

| Check | Message on failure |
|---|---|
| A data file exists and is valid JSON | `the shot list not found: <path>`, `<path> is not valid JSON: line <l>, column <c>: <why>` (the same for the copy file, the beat grid and `data/audio.json`) |
| The shot list has `transitions` (an object), `groups`, `shots` and `captions` (lists) | ``shots.json: `<key>` is missing or is not a list`` (or `an object`) |
| The copy file has a list `sections` | ``copy.json: `sections` is missing or is not a list`` |
| The beat grid has at least two beats, all numbers | ``<grid file>: `beats` must be a list of at least two times in seconds`` |
| `data/audio.json` has a `duration` | ``data/audio.json: `duration` is missing`` |
| A group has a string `id` and a known `kind` | ``group <id>: needs a string `id` ``, ``group <id>: `kind` must be one of title, section, recap, end`` |
| A `section` has `n` and `name`, and `reveal` is a number | ``group <id>: a section needs a whole number `n` and a `name` ``, ``group <id>: `reveal` must be a bar number`` |
| Any other group has a `label` | ``group <id>: a <kind> group needs a `label` `` |
| A shot has every describing field, not empty | ``shot <id>: `<field>` is missing or empty`` for `id`, `group`, `title`, `see`, `move`, `camera`, `look` |
| A shot has `bar` and `bars`, and `bars` is more than 0 | ``shot <id>: `<bar or bars>` must be a number of bars``, ``shot <id>: `bars` must be more than 0`` |
| `tone` is `dark` or `light` | ``shot <id>: `tone` must be dark or light`` |
| The id is lower case | `shot <id>: ids are lower case (the id is the name of the scene file)` |
| `in` is an object with `lead` and `tail` of 0 or more | ``shot <id>: `in` must be an object``, ``shot <id>: `in.<lead or tail>` must be a number of beats, 0 or more`` |
| A caption has `group`, `kind`, `bar`, `bars` | ``caption <group>/<kind>: `<field>` is missing``, ``caption <group>/<kind>: `<bar or bars>` must be a number of bars`` |
| `how` is `plate`, `shot` or `none` | ``caption <group>/<kind>: `how` must be one of plate, shot, none`` |
| A plate has a `place` | `caption <group>/<kind>: a plate needs a place: top, middle, bottom` |
| A copy entry has `group`, `n`, `name` and `lines` of the right shape | ``copy.json sections #<i>: needs a `group` ``, ``copy.json section <group>: needs `n` and `name`, equal to those of its group``, ``copy.json section <group>: `lines` must map each caption kind to a list of lines`` |

### Second round: how the data fits together

| Check | Why it exists | Message on failure |
|---|---|---|
| No two groups share an id, no two shots share an id | The id is a key, and a shot id is a file name | `two groups share an id`, `two shots share the id <id>` |
| There is at least one shot | Nothing to play | `shots.json has no shots` |
| Every kind of the dictionary is a kind the engine can play | A kind the engine does not know fails in the app, not in the generator | ``transition kind `<kind>` is in shots.json but the engine cannot play it (src/engine/transition.ts)`` |
| Two shots in a row do not have the same `camera` text, unless the later shot says `"repeat": true` | A move repeated by habit goes unseen, and a column that nobody checks decays. A warning, not an error: a repeat that is the idea (a loop, a rhythm of equal zooms, one move carried through several shots) is marked and kept | Warning: `shots <a> and <b> make the same camera move` |
| The first shot has no `in` | There is no shot before it to take beats from | `the first shot has nothing to lead in from` |
| Every other shot has an `in` whose `kind` is a key of `transitions` | Every cut is a decision. A plain cut is written down as one | ``shot <id>: `in` must name one of <kinds>`` |
| Two shots in a row do not come in by the same kind, except `cut`, `travel` and `match`, and unless the later shot says `"repeat": true` | A repeated effect by habit reads as a habit. The three exceptions are plain cuts to the engine. A warning, not an error: a film built on one device repeated (a zoom into each nested thing) marks the repeats | Warning: `shots <a> and <b> come in by the same transition` |
| The lead of a transition and the tail of the one before fit into the shot between them | Otherwise that shot is never seen as its builder made it | `shot <id>: the lead of its transition runs into the tail of the one before` |
| The tail of a transition is not longer than its shot | The same | `shot <id>: the tail of its transition is longer than the shot` |
| Each shot starts at the bar where the one before ends | No gap and no overlap: the shots cover the music | `shot <id> starts at bar <bar>, the one before ends at bar <bar>` |
| The `group` of a shot exists | The document and the overlay look the group up | `shot <id> belongs to unknown group <group>` |
| The shots of a group follow each other | The bars of a group are taken from its first and last shot | `the shots of group <group> are not together: shot <id> comes after shots of another group` |
| Every group has a shot | A group without bars cannot be placed | `group <id> has no shot` |
| `reveal` lies inside the bars of its section | A name shown before or after its section is never seen | ``group <id>: `reveal` <bar> lies outside its bars <a>..<b>`` |
| A copy entry belongs to a `section` group, once | The join on `group` must be one to one | `copy.json has two entries for group <group>`, `copy.json has an entry for <group>, which is not a section group in shots.json` |
| `n` and `name` of a copy entry equal those of its group | The document, the counter and the copy must show the same number and name | ``copy.json section <group>: `n` and `name` (<n>, <name>) differ from its group (<n>, <name>)`` |
| No two sections share a number | The counter would show one number twice | `two sections have the number <n>` |
| A section with captions has a copy entry | Its captions have no words | `section <id> has captions but no entry in copy.json` |
| A caption names a known group of kind `section` | Only sections carry captions | `caption <group>/<kind>: unknown group <group>`, `caption <group>/<kind>: captions belong to numbered sections; <group> is a <kind> group` |
| A caption lies inside the bars of its section | A sentence must not run over a neighbouring section | `caption <group>/<kind> runs outside bars <a>..<b>` |
| The copy entry has a sentence of the caption's kind | A caption without words shows nothing | ``caption <group>/<kind>: copy.json has no sentence `<kind>` for <group>`` |
| Captions of one section do not overlap | The overlay shows one caption at a time: the first that matches | `captions <group>/<a> and <group>/<b> overlap: the overlay shows one caption at a time` |

The check of kinds against the engine reads the list `export const TRANSITION_KINDS = [...]` in `src/engine/transition.ts`. If the file is missing or the list is not found there, that check is skipped without a word.

Two conditions give a warning and do not stop the run: the shots run past the end of the audio (`the shot list runs to <t> s, past the end of the audio at <d> s; the last shot is cut there`), and the shots run past the last beat of the grid (`the shot list runs past the last beat of the grid (bar <b>); times after it are extrapolated`).

### Checks worth adding

**None of these is in the starter's generator.** Each one is a rule that was kept by hand.

| Check to add | Why |
|---|---|
| Reading time: the length of a sentence in words or characters against its time on screen in seconds | A sentence that cannot be read in its time is not delivered. Agree the limit with the owner in the animatic |
| No caption starts inside the tail of a transition into a drop | The first beats after a drop lie under a flash and a shock wave |
| Budget for in-world transitions: their number stays under a number agreed with the owner | They are the strongest pictures and the most expensive, and they lose force when they are frequent |
| Every in-world transition has a `note` | The document lists in-world transitions by the presence of `note`. |
| Each drop is entered by a different kind | The build before a drop is the main accent, and a repeated one is predicted. The generator only compares neighbours |
| A `through` transition has `text` | Without letters the transition has nothing to go through |
| The keys of `labels` and `accents` are caption kinds, and each accent is a palette key | A misspelt kind loses its label without a word |

From practice: the densest approved plate of the reference film carries about five syllables a second (19 Vietnamese syllables in two bars, 3.7 seconds). One caption starts two beats after a drop, and its `why` says so. Another caption of the same film still starts on the cut of a drop. A rule kept by hand is kept most of the time.

## 5. What is generated

| Output | Path | Content | Read by |
|---|---|---|---|
| Storyboard document | `STORYBOARD.md` | See the table below | Owner, builders |
| Shot boundaries in bars | `data/film-sections.json` | One `{name, bar, bars}` for each shot | The analysis of the music (`analysis/analyze-beat-grid.py --sections data/film-sections.json`), so that a new analysis writes the same boundaries. The app does not read it |
| Shot times in the audio data | key `sections` of `data/audio.json` | One `{name, start, end}` for each shot, in seconds | The app: one timeline entry for each section |

Bars become seconds through the beat grid of the audio data, never through a tempo number: the beat is the bar times four, counted from bar 0 as below, and a time between two beats is interpolated. The last shot keeps the end it had when its name and start are unchanged; otherwise it ends at its last bar, or where the audio ends if that comes first. The timeline stretches the first and the last entry to cover the whole track. The rest of the audio data is left as it is. Each file is written to a temporary file and then renamed into place.

Bar 0 starts on the first downbeat of the grid (`downbeats[0]`), the same bar 0 that `analysis/analyze-beat-grid.py --sections`, `barAt` in `src/engine/audio.ts` and `beat-cues.ts` count from. Beats before it are a pickup. A grid without `downbeats` starts bar 0 on its first beat. The first shot still plays from time 0, and its scene clock holds the pickup at beat 0 (`kit-frame.ts`).

The document has four parts. Its headings, table heads and the few sentences that explain them are fixed in the generator; everything else comes from the data.

| Section of the document | Comes from |
|---|---|
| Title line: `Storyboard: <film>` | `title` in `src/project-config.ts` |
| 1. Overview: bars, length, start time, number of shots and way of telling of each group; total shots, bars and seconds | `groups`, `shots`, the beat grid |
| 2. Transitions: every kind of the dictionary with the number of its uses; the transitions with a `note`, with bar and time; the cuts into a drop, with lead and tail | `transitions`, `in`, and the list `DROP_KINDS` in `src/engine/transition.ts` |
| 3. Words on screen: the three ways and how often each is used; every sentence of every section, one column for each caption kind; the words of the title card and the end card | `captions`, copy file |
| 4. Shot by shot: one heading for each group with its `shape` and its `reveal`, a table of its shots, and a table of its captions with their words | `groups`, `shots`, `captions`, copy file |

The document holds no brief, no list of camera moves and no plan of delivery. The brief is its own page (see `interview.md`). A film that wants more in the document adds it to its copy of the generator.

```sh
bun run shots
# with another beat grid: any JSON file with a "beats" list, and "downbeats" if bar 0 is not its first beat
bun run shots -- path/to/grid.json
```

`bun run shots` starts the generator with the first Python 3 it finds (`scripts/python.ts` tries `python3`, then `python`, then `py -3`, and skips the Windows Store stub); the environment variable `PYTHON` names another. Without bun, run it directly: `python3 scripts/build-shot-files.py`, or `python` or `py -3` on Windows. The generator is plain Python 3 with no packages, and finds its files from its own place, so it can be run from any folder. With another beat grid, `duration` and the old shot times still come from `data/audio.json`, and that is the file it writes. A passing run prints any warnings, then the number of shots, the bars they cover and the length in seconds, then one line for each file. The audio data is reported as `unchanged` when no shot time changed. When `data/audio.json` is missing, the message names the command that makes a click grid: `bun run make-grid -- --bpm 120 --bars 24`.

**Never edit a generated file.** The next run overwrites it. To change a shot or a caption, edit the data. To change a fixed text of the document, edit the generator.

## 6. Shot ids

| Fact | Consequence |
|---|---|
| The id is the name of the section in the audio data and the key of the timeline entry | Changing an id changes the edit |
| The id is the name of the scene file: shot `a-b` is played by `src/scenes/a-b.ts` | A shot whose id has no file is played by the storyboard card |
| The timeline puts the name in lower case before it looks for the file, and the generator refuses an id that is not lower case | Write ids in lower case |
| Capture commands and reports carry the id of the shot. The part files of a builder carry the id of the section | A renamed id leaves a trail of old names |

- When an id changes in the shot list and the file keeps its name, the built shot turns back into a card without an error. The count of built shots in the studio (`<n> of <m> shots built`) shows it.
- When the order of the sections changes, an id that contains the order number of its section names the wrong place. Renaming means files, part files, imports and reports.
- Choose ids from the subject of the section and the picture of the shot, such as `water-finger-test`. Put no order number of the section into an id. A number of the shot inside its section goes stale in the same way when a shot is dropped or added.
- The number that the viewer sees comes from the field `n`, never from an id.

From practice: the owner of the reference film moved the first section to the end and the last to the front after every shot was built. Ids and file names were kept, so the files named `p8-*` now play section 01 and the files named `p1-*` play section 08. A dropped shot left a gap: `p1-1` is followed by `p1-3`. The film needed a warning paragraph for the next reader.

## 7. Writing a shot

Four fields describe the picture. A builder must be able to build from them, and the owner must be able to imagine the shot from them.

| Field | Says | Weak | Strong |
|---|---|---|---|
| `see` | The things on screen, their state at the start and at the end, and every word that appears, letter for letter | "An animation that shows the problem of too much water." | "The pot cut in half, seen from the side. Water is poured in four times and stands at the bottom. The roots turn from white to brown, from the tips up." |
| `move` | Which event lands on which beat or bar of the shot, and the state of the music | "Synchronised with the beat." | "One pour on each beat of the first bar. The roots darken through the second bar." |
| `camera` | One move from the set of moves of the film, with where it starts and ends | "Dynamic camera." | "Sinks from the rim of the pot to its bottom" |
| `look` | The kind of image | "Modern and clean." | "Cross-section in flat colour" |

- Name things, not qualities. "Beautiful", "dynamic" and "engaging" give a builder nothing to draw.
- Count in the units of the music. A shot of two bars has eight beats, and `move` says what each of them is for.
- Where a neighbouring concept is close, write into `see` what the shot must not show.
- The description is the intent. A builder who finds a better way to show the same thing takes it and reports it.
- The camera check compares text. Two wordings of the same move pass it, so the lead reads the column as well.

From practice: after the owner found shots of the reference film that taught the wrong concept, two descriptions gained a closing sentence of the form "Not one press that reports to many places". The builders had built what the storyboard asked, and built it well. The fault was in the storyboard.

## 8. Shaping a section

One possible arc for a section that explains an idea: the problem first, then the idea, then where it is used. The pain of the problem is what makes the idea worth remembering. Use the arc as the content of every section and not as its form: when every section runs through the same steps, the viewer predicts the rest after the second section.

| Way of breaking the template | What it means | Where it shows in the data |
|---|---|---|
| Uneven lengths | The shortest section may be half as long as the longest | The sum of `bars` of each section |
| Changed order of telling | Open with the answer and rewind to the problem. Open with a joke | The order of the shots, `shape` |
| Moving the key moment | The name of the section arrives at the start, in the middle, or as the last line | `reveal` of the group |
| Letting the music decide | A build carries tension, a drop carries the answer, a bar without drums carries what must be read | The `bar` of the key shot equals the bar of the drop |
| Changing the point of view | First person, from above, close | `camera`, `look` |

Every section still delivers all its ideas. Keep very few things fixed for the whole film, and name them in the document.

From practice: the first draft of the reference film told every section in the same seven steps of twelve bars each. The owner asked for a telling that is not stiff. In the second draft the sections run from 8 to 14 bars, and the name arrives between 0 and 7 bars after the section begins.

### Characters in a section

In a film with characters, write in the `shape` of each group where each character stands and which way it faces, and in `see` of each shot the story beat, what the character feels, and the shot size its face needs to be read. Keep the sides: a character who stands on the left looking right stays there across the cuts of a section, unless a shot shows it cross. The rest is in `characters-and-story.md`.

### Keeping neighbouring concepts apart

A film that explains several related concepts can show a beautiful picture that teaches the wrong one. A review of the pictures does not find this. Check it in the storyboard, before building.

| Task | How |
|---|---|
| Write a boundary for each concept | One line of what it must show, one line of what it must never show. The second line comes from its neighbours |
| Hold each shot against the boundaries | Cover the name: could a viewer call the shot by the name of another concept? |
| Share no example | Two concepts do not use the same example, the same prop or the same kind of screen |
| Check the sentences as well | A key word of one concept does not appear in the sentence of another |
| Check content before polish | Craft spent on a shot whose content must change is lost |

## 9. Shaping the film

| Part | Kind | Job | How long |
|---|---|---|---|
| Title | `title` | Names the film and its promise | A few bars, up to the first boundary the music offers |
| Sections | `section` | One idea each | Set by the phrases of the music, and uneven on purpose |
| Recap | `recap` | Every name once more | One beat for each name is enough |
| End card | `end` | The one sentence to take away | To the end of the track. It may end on a fraction of a bar |

- The shots cover the music from bar 0 to the end of the track. The total length is a limit of the brief.
- The order of the sections is the owner's decision. Propose an order with a reason, and ask.
- A change of order costs: the `bar` of every shot that moves, the bars of its captions, `reveal`, and `n` in both files. A section that moves into a place with another musical shape must be written again and built again.
- Keep it cheap by swapping places that have the same musical shape: the same length, and the drop and the rest at the same distance from the start. A built shot counts beats from its own start and plays unchanged in the new place. Look again at a shot that reads the kick or the energy of the music.
- Build the title and the recap from `n` of the copy file, so that they follow a new order by themselves.

From practice: in the reference film, title 3 bars, sections of 8, 10, 12 and 14 bars, recap 2 bars, end card 2.75 bars, at about 1.85 seconds a bar. When two sections swapped places, the six between them kept their bars and needed no rebuilding. The two that moved went into places of different shape: one grew from four shots to seven, the other lost a shot.

### A short piece

A piece of the short lane keeps its storyboard in the same two files, as a beat table (`short-pieces.md`, section 5). It has a group of kind `title` and perhaps one of kind `end`, no `section` groups, an empty `captions` list and an empty `sections` list in the copy file. Its words stand under `title` and `closing` in the copy file. Its shots are the states or moves of the piece, a beat to a bar each; a continuous take comes in by `cut`. The generator checks and writes it like any storyboard: this shape was run through it in a copy of the starter.

## 10. Captions

Each sentence reaches the viewer in one of three ways. The craft of plates and type is in `type-and-captions.md`.

| `how` | Who sets the words | Choose it when |
|---|---|---|
| `plate` | The overlay, on a plate at `place` | The picture needs a comment. The plate stands where the picture leaves room |
| `shot` | The builder, as a thing in the picture | The shot has a surface that carries words: a ticket, a sign, a screen |
| `none` | Nobody | With the words covered, a viewer who knows nothing still gets the point in the time the shot lasts |

- `place` follows the picture. A caption that stands in the same place in every shot is the dull choice.
- `bar` and `bars` take fractions. A quarter of a bar is one beat. Use them to start a sentence after a tail, or after the thing that holds its place has gone.
- `why` records the reason: where the picture is, and why the sentence starts when it does. A choice without a reason cannot be reviewed.
- The shot list holds the first proposal. A builder may change `how` and `place` for a section and reports it, and the lead updates the shot list.
- The words are the approved words, letter for letter. They live in the copy file only. A builder whose shot sets the words gets them from `captionFor` in `src/film.ts`.
- The overlay draws captions over groups of kind `section` only, and one at a time.

## 11. Transitions in the shot list

The catalogue of kinds and the way they are built are in `transitions.md`. The shot list records which kind leads into which shot.

- A transition belongs to the shot it leads into. The first shot has none, and every other shot has one. A plain cut is `{"kind": "cut", "lead": 0, "tail": 0}`.
- `lead` and `tail` are in beats. The lead is played over the end of the shot before, and what matters in that shot must be over by then. The tail is played over the start of this shot, and no word that must be read stands under it.
- `focus`, `dir`, `text` and `size` are given only where the kind uses them.
- `note` is written for a transition that a shot takes part in. It says what is asked of the builders of both shots. The document lists these transitions in a table of their own, with bar and time.
- The kinds the engine can play are the list `TRANSITION_KINDS` in `src/engine/transition.ts`. Every key of the dictionary `transitions` must be in it, and the generator checks this. The kinds that lead into a drop are `DROP_KINDS` in the same file, and the document lists the cuts into a drop from it.
- While either shot is still a card, the engine plays a stand-in for an in-world kind, so the animatic shows the intent.

From practice: the reference film has 53 cuts. Six are in-world transitions and five lead into a drop. After the owner asked for in-world transitions, the lead began to turn many cuts into them, and the owner corrected it: a few, at the moments that matter.

## 12. The animatic and the gate

The studio plays every shot of the shot list in order, with the music. A shot without a scene file is played by the storyboard card.

| The card shows | From |
|---|---|
| Id and bars | `id`, `bar`, `bars` |
| The title, which gives on every beat | `title` |
| What is on screen, how it moves, the camera, the look | `see`, `move`, `camera`, `look` |
| The name of the transition into the shot | `in.kind`, through the dictionary |
| One square for each beat of the shot, the playing one lit | `bars` and the beat grid |

Over a card the overlay shows every caption, also those of `how` `shot` and `none`, marked as such. The owner can read every sentence before any picture exists.

The owner judges three things in the animatic that the document cannot show: the rhythm of the cut, the length of each section, and whether the sentences can be read in their time.

The gate: the owner watches the animatic, reads the document, and says that content and look are settled. No shot is built before that. Approving a table of contents is not leave to build. Work that holds no content and no look may go ahead: the music, the beat grid, the engine, the studio. Stop the server of the studio when the viewing is over.

From practice: the owner approved a table of the ideas of the reference film, and the lead went on to palette, fonts and shared code. The owner stopped the work, and then added a requirement that changed the structure of every section.

## 13. Changing the storyboard after shots exist

| Step | What to do |
|---|---|
| 1 | Look at each shot that will change, as it is now. Write down the pictures it has |
| 2 | Mark "keep" next to what the owner has praised and next to what carries the idea. What is dropped from a shortened shot is the lead's decision |
| 3 | Edit the shot list or the copy file. Run the generator |
| 4 | Tell each builder: the ids that changed, the new bars, the new job of the shot, the pictures to keep, the transitions that now touch the shot |
| 5 | Tell the owner what is dropped |
| 6 | Watch the changed part in the studio, across its cuts |

- Put the film folder under version control before the first round of rework. A lost picture can then be looked up.
- The shot list and the copy file have one writer, the lead. A builder who finds the storyboard wrong says so in the report.
- The audio data has two writers. The analysis of the music writes the whole file, and the generator replaces the shot times in it. Run them one after the other, never at the same time, and run the generator last.

From practice: a shot of the reference film was moved on to a drop and given the name of its section to carry. The brief to the builder described the new job and did not name the picture the shot already had. The builder replaced it, the owner missed it at first viewing, and two more rounds were needed. The film had no version control, so the old picture could not be looked up.

## 14. Comparison with the state files of HyperFrames

| Role | This route | HyperFrames |
|---|---|---|
| Confirmed intent | The brief page the owner confirmed (`interview.md`). The storyboard document does not repeat it | `BRIEF.md` |
| Plan of the film | Shot list as data, document generated from it | `STORYBOARD.md`, written directly: frontmatter and one `## Frame N` section for each frame |
| State of each shot | Not stored. A shot is built when a scene file with its id exists | Status in `STORYBOARD.md`: `outline`, then `built`, then `animated` |
| Words | Copy file | `SCRIPT.md` for locked narration, `caption_groups.json` |
| Rules of the look | Treatment and authoring guide | `frame.md` |
| What the owner reviews before building | The animatic, with the music, and the document | `storyboard.html`, a static sheet of sketches |
| Timing | Beat grid and shot times in the audio data | `audio_meta.json`, `beats/` |
| The film | One scene module for each shot id | `index.html` and `compositions/frames/NN-*.html` |
| Brief to a builder | Authoring guide and the brief of the lead | `.hyperframes/frame-packets/` |

HyperFrames reviews a storyboard before building when the brief says `storyboard: yes`. In this route the gate is not a choice. HyperFrames names its frame files by order number, which is the habit section 6 advises against. Both routes happen to name their storyboard document `STORYBOARD.md`; here it is generated and never edited. The right column comes from `hyperframes-facts.md`.

## 15. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| A built shot is a card again | Its id changed in the shot list and the file kept its name | Rename both together, or keep the id |
| File names show the wrong number of the section | Ids contain order numbers, and the order changed | Ids without order numbers. The number on screen comes from `n` |
| The run ends with `nothing was written` | A check failed | Read every `error:` line. After the field round passes, a second round may list more faults |
| A correction to the document is gone | The document is generated | Edit the data, or the fixed text in the generator |
| A field added for builders is not in the document | The generator prints only the fields it knows | Point builders to the data file, or print the field from the generator |
| The viewer predicts the next section | One template for every section | Section 8 |
| A beautiful shot teaches a neighbouring concept | The storyboard asked for it | Boundaries for each concept, checked before building |
| A sentence cannot be read | It starts under the impact of a drop, or is too long for its bars | Start it after the tail. Judge the time in the animatic |
| A plate has no label, or the wrong colour | Its kind is missing or misspelt in `labels` or `accents` | Use the caption kinds of `lines` as keys |
| Two shots in a row move alike and the check passes | The check compares text | The lead reads the camera column |
| A kind passes the generator and fails in the app | The generator could not read `TRANSITION_KINDS` in `src/engine/transition.ts` and skipped the check | Keep the list in that form: `export const TRANSITION_KINDS = [...]` with quoted names |
| The owner stops the work | Building began after a table of contents was approved | Wait at the gate for an explicit go |
| A picture the owner liked is gone | The rework brief did not name it | List the pictures of the shot, mark what to keep |
| Every cut becomes an in-world transition | The lead replaced where the owner asked to add | Ask: add, or replace? Keep a budget |
| Shot times are wrong after a new analysis of the music | The analysis wrote the audio data again after the generator ran | Run the generator last |
