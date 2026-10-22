# Studio viewer

The studio is the page on which the owner watches the film, from the first day, when every shot is still a storyboard card, to the day the film is finished. This file specifies what the page must do, how the starter does it, and how the film is handed over: as this page, built into one HTML file that plays from disk. A video file is made only when the owner asks for one.

Load this when: you set up the studio for a new film, prepare a review with the owner, hand the film over, change the player, the storyboard card or the overlay, or the owner reports that a shot is blank, late or out of sync.

## 1. Scope and reference implementation

The reference implementation of this file is the starter the skill ships, `assets/starter/`. A film folder is a copy of it, and every path in this file is relative to that folder, the one that holds `package.json`. The shot list and the words are `shots.json` and `copy.json` in that folder. The beat grid and the cut times are `data/audio.json`. The studio server serves the folders `audio/` and `data/` itself (the plugin `filmFolders` in `vite.config.ts`), so there are no links to keep.

The starter was made from the app of the reference film. Where this file says "the reference app", it means that earlier app, which the starter replaced.

The starter uses two names that differ from the terms of this skill.

| Term of this skill | Name in the starter |
|---|---|
| section (a group of shots) | a `group` in `shots.json`, typed in `src/film.ts`. A numbered section is a group of kind `section`; the others are `title`, `recap` and `end` |
| shot | one entry of the list `sections` in `data/audio.json`, and one entry of `shots` in `shots.json` |

Everything in sections 2 to 11 and in section 14 exists in the starter's code, unless a sentence says otherwise. Section 12 lists extensions, most of which have not been built.

## 2. What the studio is for, stage by stage

A storyboard document gives the order of the shots and their length in bars. It cannot show time. The studio plays the same storyboard at the tempo of the music, so the owner judges the film by watching it and not by reading about it.

| Stage | What plays | What the owner can judge | What waits for a later stage |
|---|---|---|---|
| Animatic | Every shot is a storyboard card. The music plays. Transitions play between the cards. The overlay shows the counter and every caption. | Cutting rhythm: whether each cut falls where the music asks for one. The length of each section and of each shot. The order of the shots. Whether each caption can be read in the time it has. Whether a name is revealed at the right bar. Which version of the music serves the film. | The pictures, the camera, the frame rate. |
| Mixed | Built shots and cards in one run. The shot list marks each shot as built or card and counts the built ones. | A built shot between its neighbours and under its transitions. Whether a built shot holds for its whole length. Whether a caption plate covers something the picture needs. The frame rate of each built shot. | The film as one piece. |
| Finished film | Every shot is built. The count in the header of the list shows that no card is left. | The whole film in one run. The frame rate on the heaviest shot. Picture against sound at the start, in the middle and at the end. | Nothing. This page is the deliverable. |

Rules for the lead:

- Show the animatic to the owner and wait for the owner to confirm the storyboard before any builder starts. Approval of a content table is not approval to build.
- Ask the owner to name a shot by its title in the shot list, and a moment by the time, bar and beat on the information line. Both can be turned into a capture.
- Do not describe in a document what the studio can play. Give the address and say what to look at.

## 3. Requirements

Tick every row when you set up a studio for a new film. MUST rows are needed for the owner to judge the film. SHOULD rows may be left out when the reason does not apply to the film.

| ID | Level | Requirement | Reason | In the starter |
|---|---|---|---|---|
| S1 | MUST | The picture is shown at the aspect ratio of the film, taken from the one project configuration, and fits the window without cropping or stretching. A vertical film and a horizontal film use the same page. | The owner judges composition and the size of type. A stretched picture gives wrong judgements. | `src/project-config.ts` (`width`, `height`, and the other `formats`; `OUTPUT` is the format of the page). `src/main.ts` sets `--out-w`, `--out-h` and `--out-aspect`. `index.html` sizes `#c` from them. |
| S2 | MUST | Every shot of the shot list plays, in order, with the music. A shot that has no module is played by the storyboard card. | The whole film can be played from the first day. | `src/timeline.ts` (`has`, `CARD`). |
| S3 | MUST | The shot list is grouped by section. Each row shows the start time, the title and whether the shot is built or a card. The header counts the built shots. | The owner names a shot by its title in this list. The count is the state of production. | `src/main.ts` (`setupPlayer`), `index.html` (`#shots`, `#count`). The group headings come from `groupHeading` in `src/film.ts`, and the heading above the list is `title` from `src/project-config.ts`. |
| S4 | SHOULD | The row of the shot that is playing is marked and scrolled into view. Its title stands beside the controls. | The owner always knows which shot is on screen. | `src/main.ts` (`tick`), `index.html` (`.shot.on`, `#now`). |
| S5 | MUST | Play and pause, by button, by key and by a click on the picture. | It is the first thing the owner does. | `src/main.ts` (`setPlaying`, `toggle`). |
| S6 | MUST | Scrubbing: one bar over the whole length of the film. The picture follows at once, also while paused. | Any moment can be reached and checked. | `index.html` (`#scrub`), `src/main.ts` (`seek`). The step is 0.001 second. After a seek the scrub bar gives the focus back (`scrub.onchange`), so the arrow keys keep their own step. |
| S7 | MUST | Keyboard controls for play, seek and the jump between shots. A step of one frame is SHOULD. | Rhythm is judged with the eyes on the picture, not on the pointer. | `src/main.ts` (the `keydown` listener). Letter keys are compared without regard to case, so Caps Lock and Shift do not stop them. |
| S8 | MUST | Jump to a shot by a click on its row and by key. | Reviews go shot by shot. | `src/main.ts` (`r.onclick`, keys `[` and `]`). |
| S9 | SHOULD | Loop a shot. | A shot is judged by watching it several times with its music. | `src/main.ts` (key `l`, `loop`). |
| S10 | SHOULD | Switch between audio sources that share one timing. Position and play state are kept. | Versions of the music are judged by ear, against the picture. | `src/project-config.ts` (`studioAudio`), `src/main.ts` (`setMusic`, `hasAudio`). A listed file that the server does not have is skipped. After the film's files the switch always offers `click`, a click on every beat made from the beat grid (`src/click-track.ts`), and `silent`, so a film without music can still be played. |
| S11 | MUST | An information line shows the time in seconds, the bar, the beat within the bar, and the frames per second while playing or a word for paused. It also shows when a loop is on. | A remark of the owner can be turned into a capture of that moment. The frame rate on the page is the only measurement of playback on the owner's machine. | `src/main.ts` (`info.textContent`). The bar is counted from zero, the beat from one to four. The frame rate is averaged over half a second. |
| S12 | MUST | While the player is paused and nothing has changed, the page draws nothing. | The owner leaves the page open while working. A paused page that redraws loads the machine for no new picture. | `src/main.ts` (`drawn`, and the test `playing \|\| t !== drawn`). |
| S13 | MUST | A saved scene module replaces the running scene without a reload of the page. The player keeps its position and goes on playing. | Builders save files while the owner watches. A reload of the page returns the player to the start. | `vite.config.ts` (`sceneHotSwap`), `src/main.ts` (the `scene-module-updated` listener), `src/engine/engine.ts` (`reload`). |
| S14 | MUST | A scene that fails to load is reported on the page, with the shot id and the stack. | The failure is shown where the owner and the lead look. | `src/engine/engine.ts` (`loadEntry`, `errors`), `index.html` (`#errs`). |
| S15 | MUST | A scene that fails does not stop the film. Its shot shows a dark red frame and every other shot plays. | One broken shot must not hide the rest of the film. | `src/engine/engine.ts` (`drawEntry`). |
| S16 | MUST | Errors of the owner's browser reach the log of the development server. | The lead cannot see the owner's screen, and the capture browser may not fail where the owner's browser fails. | `console.error` in `src/engine/engine.ts`, forwarded to the terminal of the studio because `vite.config.ts` sets `server.forwardConsole: true`. The reference app left the option unset; the starter meets this row whoever starts the server (section 10). |
| S17 | MUST | The studio runs on one fixed port and refuses to start when that port is taken. | The address never changes. A taken port exposes a server that was left running, instead of adding a second one. | `package.json`, script `studio` (`vite`). `vite.config.ts` sets `server.port` to `studioPort` from `src/project-config.ts` (5180 in the starter) and `strictPort: true`. |
| S18 | MUST | The page the owner watches and the page the capture tool drives are the same app. | A capture then shows what the studio shows at that time. | `src/main.ts` (`setupExport`, `setupPlayer`), chosen by the URL parameter `export`. |
| S19 | SHOULD | The page carries a marker by which a tool can tell this app from anything else that answers on a port. | The capture tool must not attach to a page of another project. | The plugin `pageIdentity` in `vite.config.ts` adds `<meta name="render-app">` with the value of `appMarker()` (`src/project-config.ts`), which names the film. `scripts/render.ts` (`reachable`) accepts a page only when the value is this film's. The reference app tested only that a marker was there. |
| S20 | SHOULD | The studio plays compressed copies of the audio, with the same timing as the master file. | The page loads quickly, and one beat grid serves every copy. | `src/project-config.ts` (`audioFile`, `studioAudio`). |
| S21 | SHOULD | The labels of the page are in the owner's language, and the page lists its keys. | The owner uses the page alone. | `index.html` (`#keys`) and the button labels in `src/main.ts`. The starter's labels are in English; translate them when the owner reads another language. |
| S22 | SHOULD | A film made in several formats can be watched in each of them on the same page, and the information line names the format shown. | The owner approves each format by watching it, not by reading about it. | `src/main.ts` (`nextFormat`, the button `#format`, the key `f`), the page parameter `format`. The page is loaded again in the next format at the same time, because every target takes its size at load. The button is hidden when the film has one format. |
| S23 | SHOULD | The page publishes `window.seek(t)`, which draws the frame of song time `t` and resolves when every picture of it has loaded. | Many prompts ask for such a function by name, and a person or a tool outside the studio can then show any moment. | `src/main.ts`. In the studio it also pauses the player at `t`. `window.duration` is the length of the film. |

### How the hot swap works

1. The plugin `scene-hot-swap` in `vite.config.ts` runs only in the development server. It looks at every file directly in `src/scenes/` that contains `export default class`, and appends a block that accepts the module's own updates.
2. When such a file is saved, the block sends the window event `scene-module-updated` with the name of the file and the new module.
3. `src/main.ts` calls `engine.reload(id, module)` for every timeline entry that plays that file. The engine disposes the old scene, removes its old errors and makes the new scene.
4. The player sets `drawn` to `-1`, so that a paused page draws the new scene once, and refreshes the error panel.

Files that scenes share live in `src/scenes/parts/`. They get no such block, so a change in one of them travels to the scenes that import it, and each of those scenes is swapped. A change to a file that the player, the timeline or the engine also imports reloads the whole page. After a reload the player starts at zero, or at the time given by the URL parameter `t`.

Whether a shot is built or a card is decided when the timeline is made, at page load (`has` in `src/timeline.ts`). A shot whose module was written for the first time is shown as built after the page has loaded again.

## 4. Controls

| Key or click | Action |
|---|---|
| Space | Play or pause. |
| Click on the picture | Play or pause. |
| Play button | Play or pause. The label names the action that is available. |
| Music button, or `m` | The next audio source. The label names the source that is playing. |
| Scrub bar | Seek to any time. |
| Right arrow, left arrow | One second forward, one second back. |
| Shift with an arrow | Five seconds forward or back. |
| `.` and `,` | One frame forward, one frame back. A frame is one divided by the configured frame rate. |
| `]` | The start of the next shot. |
| `[` | The start of the shot that is playing. Pressed within 0.3 second of that start, the start of the shot before. |
| `l` | Loop the shot under the playhead, or end the loop. |
| Format button, or `f` | Load the page again in the next format of the film, at the same time. |
| Click on a row of the shot list | The start of that shot. |

A jump lands one millisecond after the start of the shot, so that the time falls inside the shot and not on the cut. The loop stays on the shot it was set on: while it is on and the film is playing, a seek past the end of that shot is taken back to its start. The line of keys printed on the page lists every key of this table. Letter keys work with Caps Lock on, and after a click on the scrub bar the arrow keys still move by a second, because the bar gives the focus back after the seek.

## 5. URL parameters

| Parameter | Works in | Effect |
|---|---|---|
| `export` (any value, written `export=1`) | Chooses the mode | Export mode. No player and no audio element are made. The controls, the shot list and the error panel are hidden. The canvas stands at the top left at exactly the output size. The page publishes `window.__render` (section 9). |
| `only=id1,id2` | Studio and export | Only the named shots are loaded, which makes the page load faster. The overlay is always loaded. A shot that was not loaded shows a dark red frame. A transition plays only when the shots on both sides of the cut are loaded. |
| `t=53.5` | Studio | The time in seconds at which the player stands when the page has loaded. The player is paused. |
| `scale=2` | Studio and export | A whole number from 1 to 4. The picture is drawn at that many times the configured size. Scenes keep laying out in the configured size. It exists for captures at a higher resolution. |
| `format=16:9` | Studio and export | One of the formats of `src/project-config.ts`. The page is drawn at that format's size, with that format's zones. Without it, the master format. An unknown name is reported in the console and the master is shown. |

There is no parameter that names a shot, and the page does not write its position into the address.

## 6. The storyboard card

One module, `src/scenes/storyboard-card.ts`, plays every shot that has no module of its own. It finds its shot from the id of the timeline entry (`shotOf` in `src/film.ts`), so all of its text comes from `shots.json`. Nothing about a shot is written in the app.

| On the card | Field in `shots.json` |
|---|---|
| A dashed border and no picture. The card says that it is a placeholder. | |
| The shot id and the bars it covers | `id`, `bar`, `bars` |
| The title, large | `title` |
| What is on screen | `see` |
| What happens with the music | `move` |
| What the camera does | `camera` |
| The transition that leads into the shot, by its label | `in.kind`, looked up in `transitions` |
| The kind of picture | `look` |
| Light or dark ground | `tone` |

The describing blocks are laid out once, when the card is made: in one column in a tall frame, in two when the frame is wide or one column does not fit, at the largest size that fits between the title and the beat squares, measured at the size it is drawn at. The card goes below the kit's smallest type size, down to 22 units, before it cuts a block short with an ellipsis; it is a working card read in the studio, not a picture of the film.

The card marks the beat in two ways. The title grows by a few percent on every beat and falls back. At the foot of the card stands one square for every beat of the shot, sixteen to a row and set in groups of four, so that a group is a bar. Beats that have passed are bright, the beat that is playing has the signal colour, and beats to come are dim. The number of squares shows the length of the shot at a glance.

Transitions play between cards as they will between built shots, because the engine works on the finished picture of each side. A transition that a shot should take part in gets a stand-in while either side is still a card (`standIn` in `src/timeline.ts`, `played` in `src/engine/transition.ts`).

| Kind of transition | Both shots built | Either shot still a card |
|---|---|---|
| `travel` | The engine does nothing at the cut. The two shots carry the camera. | A whip stands in. |
| `match` | A plain cut that the shots have lined up. | A cut with a small punch, so that the cut can be felt. |
| `zoom-in`, `pull-out` | The shot plays its own part when its scene sets `handlesPortal`. | The engine plays a plain zoom between the two pictures. |
| Every other kind | Played by the engine. | Played by the engine in the same way. |

## 7. The overlay

`src/scenes/overlay.ts` draws the counter and the captions. It is one timeline entry that runs the whole length of the film and is marked `overlay`. The engine draws it after the shot, on the finished picture, and it takes no part in transitions. What is shown when is data: timing and placement come from `shots.json`, the words from `copy.json`.

| Part | What it shows | Source |
|---|---|---|
| Counter | The number of the section out of the total, at the top left on its own dark plate. A caret beside it is lit for the first half of every beat. | `n` of the section's group. The total is the number of groups of kind `section` (`SECTION_COUNT` in `src/film.ts`) |
| Name reveal | Before the bar `reveal` the counter shows `???` in place of the name. From that bar on it shows the name, and the plate gives a little when the name lands. | `reveal` and `name` of the section's group. Without `reveal` the name shows from the section's first bar |
| Caption | One sentence, a line at a time: the first line with the plate, then one line every half beat. The type is set smaller when a line would not fit. | `captions` in `shots.json` (`group`, `kind`, `bar`, `bars`, `how`, `place`). The lines are `lines[kind]` of the section's entry in `copy.json`, joined on `group`. The small label over the plate and the colour of its bar are `labels[kind]` and `accents[kind]` of `copy.json` |

Each caption has a mode, the field `how`.

| `how` | Over a built shot | Over a card |
|---|---|---|
| `plate` | The overlay sets the sentence on a dark plate at `place`. | The same. |
| `shot` | The overlay draws nothing. The shot sets the words as part of its own picture. | A plate drawn faint with a dashed edge, labelled as words that the shot will set itself. |
| `none` | Nothing. The picture says it without words. | A plate drawn faint with a dashed edge, labelled as a moment without words. |

| `place` | Where the plate stands |
|---|---|
| `top` | Under the counter. It grows downwards. |
| `middle` | Centred on the frame. |
| `bottom` | On the bottom edge of the caption zone. It grows upwards. This is the default. |

The rule behind the second table: while a shot is still a card, every caption is shown as a plate, so that the owner can read all the words of the film in the animatic and judge whether each can be read in its time. `src/timeline.ts` hands the overlay the list of shots that are cards (`params.cards`).

Only numbered sections, groups of kind `section`, carry a counter and captions. The title, the recap and the end card set their own words.

From practice: in the reference app the total of the counter and the heading of the shot list were written by hand in the code, and both had to be changed for each new film. In the starter both follow the data: the total is `SECTION_COUNT`, and the heading is `title` in `src/project-config.ts`.

## 8. Clock

The player keeps one number, the song time `t` in seconds. The picture, the scrub bar, the marked row, the bar and the beat are all derived from it. While the film plays, `t` follows the audio element:

```ts
const nowT = performance.now();
if (audio.currentTime !== lastAudioT) { lastAudioT = audio.currentTime; lastPerf = nowT; }
t = lastAudioT + (audio.paused ? 0 : (nowT - lastPerf) / 1000);
```

The browser reports `audio.currentTime` in steps that are longer than a frame. Drawn from that value alone, the picture would hold and then jump. The player therefore remembers the last value reported and the moment it changed, and adds the time that has passed since. Wall time only fills the gap between two reports. It is never summed over the run.

A seek limits the time to the length of the film, then sets both `t` and `audio.currentTime`. When a loop is on and `t` passes its end, the player seeks to its start. When the audio has ended, the player pauses. The engine takes a time that goes backwards, or forwards by more than a quarter of a second (or four frames, where that is longer), as a seek, and brings scenes that keep state to the new time before it draws.

Bar and beat come from the measured beat grid (`barAt` and `beatAt` in `src/engine/audio.ts`), which holds the time of every beat. They stay right when the tempo of the track drifts.

The picture must be derived from audio time and not from elapsed wall time, for four reasons.

| Reason | What goes wrong with wall time |
|---|---|
| The owner hears the audio. | The clock of the audio device and the wall clock do not run at the same rate, and audio can stall while it loads. The picture drifts away from the sound. |
| Seek, loop and the change of audio source all move the audio position. | Each would need its own correction of the picture clock. |
| A frame is a function of the song time. | Scrubbing, the frame step, a capture at the time the owner named and the studio would not show the same picture for the same time. |
| The browser stops drawing a page in the background. | On return the picture would be behind the sound. |

## 9. The export hook

With the URL parameter `export` the page publishes `window.__render`. The capture tool `scripts/render.ts` is its only user.

| Member | What it returns |
|---|---|
| `ready` | `true` once every other member is in place. |
| `error` | The stack as text. It is present only when the page failed to start, and the hook then has no other member. |
| `errors` | A list of texts, one for each scene that failed to load, each starting with the shot id in square brackets. |
| `duration` | The length of the film in seconds. |
| `fps` | The configured frame rate. |
| `logicalWidth`, `logicalHeight` | The size of the format shown, in pixels. |
| `format` | The name of that format. |
| `scale` | The value of the URL parameter `scale`. |
| `width`, `height` | The output size in pixels: the configured size times `scale`. |
| `timeline` | A list with `id`, `start` and `end` of every shot. The overlay is left out. |
| `timeOfBeat(i)` | The song time in seconds of beat `i` of the beat grid. Fractions are allowed. |
| `still(t, samples, shutter)` | Draws the frame of song time `t` on the canvas, waits for any photo or clip frame of it that is still loading and draws it again (`renderSettled` in `src/engine/engine.ts`). Resolves to the number of sub-frames used, which is 1 unless `samples` asks for more. |
| `png()` | A promise of the last drawn frame as a PNG at the full output size, in base64. |
| `engine` | The engine itself. The `perf` mode of the capture tool uses it to time frames. |
| `stream(options)` | Draws a range of frames and sends them over a WebSocket to an encoder. It serves video export only. |

Beside `window.__render`, every page publishes `window.seek(t)` and `window.duration` (S23). On the export page `window.seek(t)` is `still(t)` without a return value. A prompt that asks for "a deterministic `seek(t)`" is answered by the engine's contract (`engine-architecture.md`, section 1) and by this function; the capture tool keeps using `window.__render`, which also reports errors, sizes and the timeline.

How the capture tool uses the page:

1. It takes the lock folder `.render.lock`, so that one capture runs at a time. A second run waits. The folder that holds the lock is found by `lockHome` in `scripts/render.ts`: the folder named by the environment variable `RENDER_LOCK_DIR`, or else the nearest folder above the film folder that holds `.git`, or else the nearest that holds `CLAUDE.md` or `AGENTS.md`, or else the temporary folder of the system. Every film under one repository therefore shares one lock.
2. It starts a private development server on a port between 5300 and 5799 with live reload switched off (`RENDER_NO_HMR=1`), and stops that server when it has finished. With `--url`, for example `http://localhost:<studioPort>` (the port of `src/project-config.ts`), it uses the server at that address instead and accepts the page only if its marker (S19) names this film. When this film does not answer there, it stops with an error that names the film that does.
3. It opens Chrome without a window, at the size of the format asked for (`--format`, the master by default), with the graphics backend of the system or the one named by `--angle`, loads the page with `export=1` and with `only`, `scale` and `format` as asked, and waits for `ready` or `error`. With `--page` it opens a single-file build from disk instead, and starts no server.
4. It checks the size, prints `errors`, and calls `still` for each time asked. At scale 1 it saves a screenshot of the page. At a higher scale it saves what `png()` returns.
5. It prints the log of the browser: console errors and warnings, page errors, and every response with a status of 400 or above.

The capture tool refuses its mode `video` unless the environment variable `OWNER_ASKED_FOR_VIDEO` has the value `yes`.

## 10. Browser support

The owner's browser may differ from the capture browser. The capture tool drives Chrome (`channel: 'chrome'` in `scripts/render.ts`). A shot can be right in every capture and broken on the owner's screen.

| Kind of failure | Where it is shown |
|---|---|
| The page fails to start | The stack in red at the top left of the page. |
| A scene fails to load or to set itself up | The error panel of the page, the console, and a dark red frame for that shot. |
| A scene throws while it draws | A dark red frame for that shot and the console line `scene <id> render error`. The error panel does not show it. |
| The overlay throws while it draws | The console line `overlay <id> render error`. The shot plays without counter and captions. |

Rules for the lead:

- When the owner reports a shot as blank or broken and the captures are fine, read the log of the development server first. Do not answer with a guess.
- In a stack, lines of the form `name@http://...` and `@[native code]` come from WebKit, the engine of Safari.
- Scenes must not use `filter` of the 2D canvas context, which Safari does not have. Canvas `letterSpacing` may be missing as well. It fails without an error and sets the type tighter, so no layout may depend on it.
- To capture in another browser engine, that engine must be installed for the capture tool. Ask the owner before installing it.

The stream to the server log is the option `server.forwardConsole` of the development server. By the Vite documentation (read on 2026-09-28) its default is on only when the server detects that an AI coding agent started it, so a server that the owner started by hand logged nothing from the browser in the reference app. The starter sets the option to `true` in `vite.config.ts`, so the owner's errors reach the terminal of the studio whoever started it. Keep that line when you change the configuration.

What only the owner can test:

| Test | How |
|---|---|
| Every shot shows a picture in the owner's browser | Play the film once from start to end and look for dark red frames. |
| The frame rate of playback | Read the information line on the heaviest shot. |
| Picture against sound | Watch one event that falls on a drum hit at the start, in the middle and at the end of the film. |
| The music itself | By ear, with the switch between audio sources. |

From practice: the owner watched in Safari and twice reported one shot as blank, while every capture of it was fine. The first answer, that the page had been seen in the middle of a build, was a guess and it was wrong. The engine patched the `filter` property of the 2D canvas context without checking that it existed, so the shot threw on every frame in Safari. The server log showed the error at once, with the shot id and a WebKit stack.

## 11. Delivery

The film is handed over as a page that plays in a browser. There are two forms of it, the same code:

| Form | What it is | For |
|---|---|---|
| The studio | The development server and the page it serves (`bun run studio`) | Every review while the film is made: hot swap, the server log of the owner's browser, the music switch |
| The single file | One HTML file with the script (three.js and every scene inside it), the fonts, the data, the pictures and the music packed in (`bun run single`) | The hand-over: it opens by double click, with no server, no network and no install |

### The single file

```sh
bun run single                               # out/single/<title>.html, with the first music file of studioAudio that exists
bun run single -- --audio all                # every music file of studioAudio that exists; the music switch keeps them
bun run single -- --audio none               # no music file: the click track and silence
bun run single -- --audio audio/track.m4a    # this file only
bun run single -- --format 1:1               # opens in that format; the Format button still switches
bun scripts/render.ts stills --page out/single/<title>.html --t 5   # a still taken from the file itself
```

How it is made: `scripts/build-single.ts` runs Vite's build with the environment variable `SINGLE_FILE` set, which `vite.config.ts` turns into one script with no chunks and relative paths. The script then packs, as base64, every file of `public/` (the fonts and their licences), the JSON files of `data/`, every file of `media/`, and the music asked for, and writes the page with two inline scripts: a small one that answers `fetch()` for the packed files and makes a blob URL for the music (`window.__filmFileUrl`), then the app. A path under the page's folder that was not packed answers 404, so the page never reads the disk and plays the same wherever it is opened. A comment at the top of the file lists what was packed and the licences of the engine, of the libraries in the script and of the fonts. No package was added for this.

What differs from the studio: there is no hot swap and no server log; everything else is the same page, with the same keys, the shot list, the music switch, the format switch, `window.seek` and `?export=1`. A still taken from the file with `--page` is the same picture as a still taken from the studio.

Size, measured on the starter's example film: the script is 0.87 MB and the fonts 0.98 MB, and the page is 2.2 MB without music. Packed files grow by a third. With the 50-second WAV that `bun run score` makes (9.5 MB) the page was 15 MB. A WAV master of three minutes (about 30 MB) would make a page of about 42 MB, which is slow to open and awkward to send; a compressed copy with the same timing (an m4a or an mp3 of 4 to 6 MB for three minutes) keeps the page under 10 MB. The build says so when it packs a WAV, and warns above 50 MB. Clips as image sequences are the other large item (`engine-architecture.md`, section 4).

When a prompt asks for "one HTML file, no libraries, vanilla WebGL": the single file is one HTML file that needs nothing else, but three.js and opentype.js are inside its script, and the page is built by a tool, not written by hand. Say so to the owner. Whether the method fits such a request at all is decided in the route chapter.

What has been tried: the build, stills taken from the file through the capture tool (equal byte for byte to the studio's), and the page opened from disk in headless Chrome on Windows, playing its packed music and answering `window.seek`. Not tried: opening it in Safari or Firefox, on a phone, and a page of more than 15 MB.

### Handing over

| Step | What to do |
|---|---|
| Build | `bun run single`, with the music the owner should hear. Take one still from the file with `--page` and compare it with the studio's still of the same moment |
| Hand over | The path of the file, the controls of section 4, the formats it can show, and what it does not contain (a video file) |
| The studio, when the owner reviews | Check the port (`studioPort` in `src/project-config.ts`, 5180 in the starter). If a server already answers there and it is this studio, use it. If it is a server you started earlier, stop it. Do not move to another port. Two films on one machine need two ports. Run the script `studio` from the film folder, give the address `http://localhost:<studioPort>`, and stop the server with Ctrl+C when the owner has finished |
| What the studio needs | bun, Node.js 20 or later, and the packages (`bun install`). One process, the development server, which compiles the modules when the page asks for them and serves `audio/`, `data/` and `media/` itself, with byte ranges so that the audio can seek. A missing file answers 404 |

```sh
lsof -i :5180                    # on Windows: netstat -ano | findstr :5180
bun run studio
```

Rules:

- One studio serves the whole project. Builders do not start servers or browsers of their own.
- Whoever starts the server stops it. No server, browser or watcher is left running after the work that needed it.
- A capture does not need the studio. The capture tool starts and stops its own server, without live reload, even while the studio runs. It uses the studio only when `--url` names it, and then runs with live reload on (section 14).

Check before the hand-over of the finished film:

| Item | How to check |
|---|---|
| No card is left | The count in the header of the shot list. |
| No scene failed to load | The error panel is empty, and the capture tool prints no scene errors, also with `--page` on the single file. |
| Frame rate | The owner reads the information line on the heaviest shot. |
| Picture against sound | The owner's test of section 10. |
| Every format that was promised | A still of each key moment in each format (`--format`). |
| Processes | Nothing that the lead or a builder started is still running. |

## 12. Optional extensions

None of these is in the starter. Specify one only when the film needs it. Every guide or mark of the studio must stay out of the picture in export mode.

| Extension | Level | State | What it would do |
|---|---|---|---|
| Safe-area guides for the target platform | OPTIONAL | not built | An outline over the picture, switched by a key, that shows where the interface of the platform covers the frame. The kit has a zone `SAFE` in `src/scenes/parts/kit-frame.ts` that scenes lay out in. The studio does not draw it. |
| Toggle for the caption layer | OPTIONAL | not built | A key that hides the overlay, so that the owner can test whether the picture makes its point without the words. |
| Beat flash | OPTIONAL | not built | A mark outside the picture that flashes on every beat, stronger on the first beat of a bar, for judging sync on built shots. Today only the card's squares and the counter's caret mark the beat. |
| Notes per shot saved to a file | OPTIONAL | not built | The owner writes a remark on the shot that is playing. It is saved with the shot id, the time, the bar and the beat to a file that the lead reads. It needs a part on the server that writes the file. |
| Contact sheet of the whole film | OPTIONAL | not built | One page with a still of every shot. The capture tool can write a contact sheet as an image file (mode `sheet`). A sheet inside the studio does not exist. |
| Marker for shots changed since the last review | OPTIONAL | not built | A mark in the shot list on every shot whose module changed after the time of the last review. |
| Loop of the whole film | OPTIONAL | not built | A key that loops from the end back to 0, for a seamless loop of several shots. Today `l` loops the shot under the playhead, which covers a piece of one shot. The seam of the sound when the audio element seeks back has not been checked |
| A format switch | OPTIONAL | built | Named formats in `src/project-config.ts`, chosen by `?format=`, the Format button, `--format` of the capture tool and of the single-file build (S22; `engine-architecture.md`, section 4, "Formats") |
| A single file that opens by double click | OPTIONAL | built | `bun run single` (section 11) |
| A live page for a piece that plays on a click | OPTIONAL | not built | A small page of its own that records the viewer's clicks and calls the same drawing function with the time and the list of clicks. The studio plays the scripted run of such a piece (`short-pieces.md`, section 11) |

## 13. Comparison with HyperFrames Studio

The right column is taken from `hyperframes-facts.md`, section 8, which read the skill files of HyperFrames. Nothing in that column was run for this file.

| Question | Studio of this skill | HyperFrames Studio |
|---|---|---|
| What it is | A viewer: it plays the shots in order with the music and shows a card for every shot that is not built. | A timeline editor in the browser, described by its files as a review surface on which the user plays the video and edits by hand before rendering. |
| Unit of the timeline | The shot, grouped by section, placed on a measured beat grid. | One row for each top-level element. The kinds of track are video, graphics, captions and audio. |
| What it edits | Nothing. Changes are made in the shot list, the copy file and the scene modules, and the page takes them up. | The HTML of the composition. An eye icon writes `data-hidden`, a fader writes `data-volume`. There are an effect rack and automation lanes. |
| What it needs to run | The development server, started from the film folder, on the fixed port set in `src/project-config.ts` (5180 in the starter). | `npx hyperframes preview`, a local server on port 3002 by default. The address must carry `#project/<project-name>`, or no project is loaded. |
| Changes while open | One scene module is swapped and the player keeps its position. | It hot-reloads on file changes. The files that were read do not say whether the position is kept. |
| How it stops | Ctrl+C. Nothing stays behind. | With `preview --background` it keeps running by design. It is stopped with `npx hyperframes preview --stop`. |
| Safe areas | None drawn (section 12). | A toggle for safe margins: action-safe at 90 percent, title-safe at 80 percent. Neither is the interface area of a platform. |
| What an agent reads from it | The export hook, for captures. | The element the user selected, through `preview --context --json`. |
| The better surface when | The picture is a canvas drawn by the film's own engine. The cut follows a measured beat grid, also on a track whose tempo drifts. The film must play as cards from the first day. | The composition is made of page elements. The owner wants to change timing, visibility or volume by hand. The film is a narrated piece with one caption track. |

## 14. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The owner sees a blank or dark red shot, and the captures are fine. | The owner's browser lacks something the scene or the engine uses, and the scene throws on every frame. | Read the server log for `scene <id> render error`. Repair the cause in the scene or the engine. |
| A shot is dark red and the error panel is empty. | Errors thrown while drawing go to the console only. The panel lists errors of loading. | Read the server log or the console of the browser. |
| The server log shows nothing from the browser. | `server.forwardConsole` is missing from `vite.config.ts`. The starter sets it; a changed configuration may have lost it. | Set the option to `true` again, or ask the owner to open the console of the browser. |
| Every shot but one is dark red. | The address carries `only`. | Remove the parameter. |
| The server does not start and reports that the port is in use. | A studio from an earlier session is still running, or another film on the machine uses the same `studioPort`. The server is strict about the port. | Find the process that holds the port. Use it, or stop it if you started it. Give each film its own port in `src/project-config.ts`. |
| The capture tool stops and says that this film does not answer at the address. | `--url` names a server of another film, or no server. The tool accepts only a page whose marker names this film. | Leave `--url` out, so the tool starts its own server, or give the address of this film's studio. |
| A capture fails part way, or its stills mix the old and the new picture of a shot. | The capture was given `--url` and ran on the studio, and a file was saved during the run. The studio has live reload on; only the tool's private server has it off. | Leave `--url` out, or do not save files while a capture runs on the studio. |
| A saved scene reloads the whole page. | The file has no `export default class`, or it lies outside `src/scenes/`, or the timeline or the player imports it. | Keep scene modules directly in `src/scenes/` and shared files in `src/scenes/parts/`. |
| After a reload the player is back at the start. | The position is not kept over a reload of the page. | Open the page with the parameter `t`. |
| A shot that was just built still plays as a card. | Built or card is decided at page load. | Load the page again. |
| The player jumps back by itself. | A loop is still on. The information line shows it. | Press `l`. |
| The frame rate is low, and a smaller window does not help. | The canvas is always drawn at the output size. The window only scales it. | Make the shot lighter. Do not pass `scale` in the studio. |
| The cards show new text, and the cuts are at the old times. | The cards read the shot list. The timeline reads the cut times from `data/audio.json`, which `scripts/build-shot-files.py` writes from the shot list. | Run that script (`bun run shots`) after every change of the shot list, and again after every new analysis of the music, which rewrites the file. |
| The page stops with `data/audio.json has no sections`. | The beat grid was made or measured again, and the shot times have not been written into it. | Run `bun run shots`. |
| The page stops with `no audio analysis data found`. | `data/audio.json` does not exist yet. | Make a grid (`bun run make-grid -- --bpm 120 --bars 24`) or measure one from the music, then run the build script. |
| The music switch offers only `click` and `silent`. | No file listed in `studioAudio` is in `audio/`. | Put the compressed copies in `audio/` under the names the configuration gives. |
| The owner takes the faint plates for final captions. | Over a card every caption is shown as a plate. | Say in the hand-over that a plate with a dashed edge disappears when its shot is built. |
| The picture drifts away from the sound in a new player. | The picture is driven by elapsed wall time. | Derive the song time from the audio element (section 8). |
| The single file shows the old film. | It was built before the last change; it is a copy, not a view of the folder. | Build it again after every change that the owner should see in it. |
| The single file plays no music. | No file of `studioAudio` existed when it was built, or `--audio none` was given. The music switch then offers only `click` and `silent`. | Put the compressed copy in `audio/` and build again. |
| The single file is tens of megabytes. | A WAV was packed, or long clips. | Pack a compressed copy of the music (`--audio audio/track.m4a`); keep clips short and small. |
| The Format button is missing. | The film has one format. | Add formats to `formats` in `src/project-config.ts`. |

From practice: the reference project held two apps that carried the same marker value, and the older one served on the port that the capture tool of the newer one looked at first, so captures of the newer film were taken from the wrong app. The starter avoids it: its marker names the film, the capture tool accepts only that value, and its default address is the film's own studio port.
