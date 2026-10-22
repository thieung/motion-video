# Short pieces

A light lane through the method for pieces of about 5 to 40 seconds: a showreel that "goes all out", a logo sting, a launch teaser, a UI piece in which one shape is never cut, a social ad, a manifesto, a reward reveal. It says when a request takes this lane instead of the eleven phases, what is kept and what is dropped, how the work runs when the owner says "do not ask me, decide yourself", and gives recipes for the families of short piece that are asked for most. It also covers three things short pieces often need: a seamless loop, one piece in several formats, and a piece that plays on a click.

Load this when: a request asks for a piece under about 40 seconds, names a showreel, a sting, a teaser, an ad, a loop or a "15-second motion graphics video", tells the lead to decide everything itself, or asks for several formats or a piece that plays on a click.

Nothing in this chapter has been tried on a film yet. It was written from the method of the two reference films and from a collection of about four hundred prompts that people gave for such pieces. Treat its recipes as a starting point to be corrected by the first real pieces.

## 1. When a request takes this lane

| Sign in the request | Lane |
|---|---|
| 5 to 40 seconds, one idea, no parts to explain one by one | Short lane |
| "Showreel", "go all out", "sting", "bumper", "teaser", "ad", "hook in the first second" | Short lane |
| One continuous take, one shape, one loop | Short lane |
| Several ideas, each to be understood (patterns, steps, a history) | The eleven phases, even when the film is short |
| More than one section with a name, or well over 40 seconds | The eleven phases |
| A data explainer on real figures | The eleven phases. Its research step is in `thinking-and-brainstorm.md`, section 2 |
| Words to be read in order, a spoken or written argument of more than a few lines | The eleven phases, unless it is a manifesto of a few locked lines (section 7.5) |
| A lyric video of a whole song, a music video | The eleven phases, with the recipe of section 7.7 for its words |

The length is a hint; the number of ideas decides. A piece of 45 seconds that is one idea (a machine that plays one piece of music, one continuous take) takes the short lane; a piece of 30 seconds that must explain three ideas one by one takes the eleven phases. When in doubt, say which lane you take and why in the restatement of section 3 of `interview.md`. The owner can move the piece to the other lane with one word.

From practice: a 45-second machine whose every note is a visible collision went through the short lane with one builder and was accepted after one round.

## 2. What is kept, what is compressed, what is dropped

Kept, without exception:

| Rule | In this lane |
|---|---|
| A frame is a function of time | Unchanged. A 15-second piece seeks, captures and loops only because of it |
| Look at the result | Stills of single moments, one capture at a time. A short piece is judged frame by frame, so look at more moments per second than on a long film: one still per beat of the busiest bar. Stills are not enough for fast moves and hand-overs: see the motion checks of `quality-gates.md` (consecutive frames, and times between frames) |
| No video export unless asked in this conversation | Unchanged. The deliverable is the studio page |
| No paid step without asking, each time, with the price | Unchanged, also in the autonomous mode of section 4 |
| Nothing leaves the machine | Unchanged. Research reads public pages; nothing of the owner's is uploaded |
| A shot must not be the picture of a neighbouring idea | For a piece about a product: a beat must not show a feature the product does not have, or another product's |
| Beats come from the grid | Unchanged. A piece without a track uses the synthetic grid of `bun run make-grid`, which is then exact, not an approximation |

Compressed:

| Phase of the full method | In this lane |
|---|---|
| 1. Brief, in rounds | A few stated assumptions: the takeaway in one line, frame, length, sound, look, deliverable. Ask only what cannot be assumed (see section 3) |
| 2. Route | One line. Most short pieces are drawn pictures on a beat: the engine route |
| 3. Thinking, three directions | One direction, written as the beat table. Offer a second only when the request is open ("show me what you can do") and the owner is present |
| 4. Music | A track the owner gives, a track written in code (`references/sound-and-voice.md`), or none. With none, the synthetic grid is the clock |
| 5. Storyboard, animatic | A short beat table kept in the shot data (section 5). The animatic is the studio playing its cards |
| 6. Foundation | The starter as it is, with the frame, palette and fonts set |
| 7 to 9. Sample, sections, whole film | One builder builds the whole piece. Review by stills at every beat of the busiest bar and at every change of state |
| 10. Hand-over | The studio for the owner, the decisions taken, what was not done |

Dropped: the sample section (the piece is its own sample), the recap, the counter and the name plates of sections, story writers, and more than one builder.

The gates shrink to two: the beat table on the animatic (the studio playing its cards, with two to four stills of the cards at key beats), and the finished piece. Nothing is built before the first gate, so its stills show the plan, not the picture; the look is judged at the second gate, or on a first pass of the key beats if the owner asks to see one before the rest. In the autonomous mode both become written decisions.

## 3. The assumptions that replace the brief

Write them in one message and ask the owner to correct what is wrong. Each carries its default.

| Assumption | Default |
|---|---|
| What the viewer should feel or know at the end, in one line | From the request |
| Frame | Square 1:1 for a feed, vertical 9:16 for phone apps, horizontal 16:9 for a page or a talk. The request often names it |
| Length and tempo | The length asked for. With no track: 120 beats a minute, a whole number of bars (7 bars at 120 is 14 seconds, 8 bars is 16) |
| Sound | What the request says. "Compose it yourself" goes to `references/sound-and-voice.md`; no word about sound means silent, with the click track in the studio |
| Look | One design system: one palette with one accent, one or two typefaces, one kind of motion |
| Real material | Named site, repository or files, read as in `thinking-and-brainstorm.md`, section 2 |
| Loop | Only when asked |
| Deliverable | The studio page. A single self-contained HTML file of the finished piece when the owner wants something to send or open without a server (`bun run single`, which writes one HTML file with the script, fonts, data, pictures and music inside it: `studio-viewer.md`). A video file only when asked in this conversation |
| Who builds | One builder on the latest Opus model (section 6) |

Ask only the questions whose answers cannot be guessed and would change the piece: which product, which formats, whether the owner's assets may be used. The rounds of `interview.md` give the wording, in English and Vietnamese, including a round for short pieces and for real material.

## 4. The autonomous mode

Some requests say: "do not ask me", "make every decision yourself", "I am stepping away, tell me at the end". Then the gates of the owner become decisions of the lead, written down as they are taken and shown at the end.

| What changes | How |
|---|---|
| Every gate | Becomes a written decision in the project's state file: what was decided, the options that were considered, the reason, and what it would cost to change it afterwards |
| The owner's review of the beat table and of the stills | The lead looks at the same stills with the same checks, and writes what it saw |
| Questions of taste | The lead chooses and says so. It does not pretend that a measurement decided them |
| The end | The piece in the studio, then the list of decisions, then what was not done because it needs the owner |

What does not change. These hold in the autonomous mode exactly as with the owner present:

| Hard rule | In practice |
|---|---|
| No money | Take the free path. A paid voice, music or image service is listed at the end as an option, with its price. A key found in a folder is not leave to spend |
| No export | A request that itself asks for a video file in this conversation is the owner's ask for that one piece; then the file is made once, last, after the stills pass, through the starter's `video` mode. "Go all out" or "decide yourself" is not such a request. Without one, no file. The owner confirmed this reading on 2026-09-28 |
| Machine load | Stills one at a time; no parallel renders; nothing left running |
| Nothing sent out | No upload, no message, no post, no link sent, even when the request asks to "send it to my Dropbox" or "message me". Say at the end that this step waits for the owner |
| No installs | Anything that needs installing is listed at the end with its command |
| The roles | The lead still does not build (section 6). It cannot lift that rule for itself |

A decision entry, kept short:

```
DECISION  frame
Chosen    square 1440 x 1440
Options   square (feed); 9:16 (phone apps); 16:9 (page)
Why       the request says it is posted to a feed, which shows a square larger than a wide frame
To change set width and height in src/project-config.ts and the zones in kit-frame.ts; every beat framed again (about an hour)
```

## 5. The beat table in the shot data

The storyboard of a short piece is a beat table, and it lives in `shots.json` and `copy.json` like any storyboard, so that the generator checks it and the studio plays it from the first day.

| Choice | How |
|---|---|
| Groups | One group of kind `title` for the piece, or a `title` group and an `end` group for the lockup. No `section` groups, so the overlay draws no counter and no plate: short pieces do not want one |
| Captions | None. `captions` is an empty list and `sections` in `copy.json` is an empty list. The words of the piece go under `title` and `closing` in `copy.json`, with keys of the film's own; the generator prints them into the storyboard document, and scenes read them from `COPY` in `src/film.ts` |
| Shots | One shot per state or per move: a bar, half a bar or a beat each (fractions of a bar are allowed). The `move` field lists what lands on each beat of that shot |
| Transitions | `cut` between states of one continuous take: the cut is invisible when both shots draw the same picture at the same time (below). The other kinds where the piece really cuts |
| Grid | `bun run make-grid -- --bpm 120 --bars 7` when there is no track, then `bun run shots` |

This was checked with the generator in a copy of the starter: one `title` group, seven shots of one bar each, every shot but the first coming in by `cut`, empty captions and sections. It writes the storyboard, the shot times and the cards.

A continuous take, such as the "one shape, never cut" piece, is still cut into shots in the data, so that each state has a card, a title and a line of the storyboard. In code it is one drawing function of the absolute time, placed in `src/scenes/parts/`, and each shot's module is a thin file that calls it with `f.t`. Where two shots meet, both draw the same picture of the same moment, so the cut cannot be seen. Keep the absolute beat (`f.beat`, or `beatAt` of the audio data) as the clock of that function, not the scene clock, which restarts at every shot.

## 6. Who builds

**The lead does not build in this lane either.** One builder on the latest Opus model builds the whole piece and owns all of its scene files and part files. The lead sets the frame, the palette, the fonts and the grid, writes the beat table and the builder's brief (`orchestration.md`, shortened: one section, all of it), reviews by stills and sends points back.

The owner confirmed this on 2026-09-28. The alternatives, for the record:

| Option | For | Against |
|---|---|---|
| One builder, the lead reviews (recommended) | Keeps rule 4 and the owner's wish to see what the builders' model can do. The lead keeps its attention on the beat table, the look and the review, which decide a short piece | One brief and one round trip more than if the lead built |
| The lead builds, only when the owner lifts rule 4 for this piece in words | Fastest for a piece of a few seconds | A shot by the lead hides what the builders can do; nobody reviews the builder's work from outside |
| The lead builds when no sub-agents are available | On an assistant without sub-agents there is no other way | Say so at the start; the review is then the lead reviewing itself, which is weaker |

In the autonomous mode the lead may not choose the second option on its own: "decide yourself" is leave to take the owner's decisions of taste and scope, not to change the roles.

## 7. Recipes

Each recipe gives the structure in beats, what makes the piece good, how such pieces usually fail, and which chapters to load. The failures in section 8 hold for all of them.

### 7.1 The 15-second showreel ("show what an incredible motion designer you are, go all out")

The most frequent request of all, with a topic or without one. It is judged in the first second and in the last two.

| Beats at 120 to 140 a minute | What happens |
|---|---|
| Beat 1 | The hook: the strongest image of the piece, already moving on frame 0. No fade from black, no empty first frame |
| Bars 1 to 2 | First movement: one technique, one idea (type as architecture, a field of lines, a shape that becomes another) |
| Bars 3 to 4 | Second movement: a different technique in the same design system |
| Half a bar | A breath: near stillness, or one element alone, before the biggest hit |
| Bars 5 to 6 | The drop: the densest, fastest moment, the largest move of the camera |
| Last 1.5 to 2 seconds | The lockup: the name, the product or the one line, held still long enough to read twice |

What makes it good:

- One formal idea carried through, shown in three or four different techniques. Range is shown by technique; unity by palette, type and one kind of motion.
- Something lands on every beat, but not the same size of thing: small events on beats, large ones on downbeats, one very large one on the drop.
- Every transition is made of the pictures (a shape becomes the next scene, a letter's counter opens into the next world), not laid over them. See `transitions.md`, the in-world kinds.
- A topic, if given, is the content of every movement, not a title stuck on the end. A showreel "about a product" is also a launch piece: read section 7.3.
- A showreel may wear a HUD: a timecode, a frame counter, a read-out of the tempo or the frame rate, crop marks, a "04/07" chapter label, a thin progress bar. It is allowed as a designed system whose values are true and move with the film: the timecode is the film's time, the counter counts the real movements, the tempo is the grid's. It is a fault when it is decoration, when its values are false, or when it sits in the corners as filler; drop it when the owner or the request bans it.
- "Motion design about motion design" is a look of its own for a showreel: an easing-curve editor whose handle drags and whose curve then drives the next move, a keyframe timeline with diamonds that the playhead crosses as the keys fire, handwritten annotations with arrows ("stagger: 45 ms", "overshoot") pointing at the thing they name. The annotations are the content here, so they are true: the number written is the number used.

Usual failures: a sampler of unrelated effects; a fade-in from black that wastes the first second; the same scale-in of centred text on every beat; a lockup that leaves before it can be read; "AI video" clichés (section 8).

Load: `effects.md`, `transitions.md`, `camera.md`, `art-styles.md`, `type-and-captions.md`, and `references/sound-and-voice.md` when the score is written in code.

### 7.2 The UI piece: one shape, never cut

A template that circulates widely: 8 to 12 UI states, one element morphing through all of them, a cursor driving every change, a camera framing each state, 7 bars at 120, the last frame equal to the first. It fits the method exactly, because its own rules are the method's: every style is computed from time, no transitions of the browser, no timers, no state carried between frames.

| Beats | What happens |
|---|---|
| 28 beats, one event each | Button, loader, check, a pill, a player, a scrubbed bar that becomes a slider stretched past its end, a toggle, a tab indicator, a chart drawing itself with a tooltip, a command palette, typing, enter, a toast, the button again. With a product: the product's own states, with its real data |
| Beat 28 to beat 1 | The toast folds back into the button; cursor and camera return to where they started, at the speed they started with |

How to build it in the starter:

| Part | How |
|---|---|
| Frame | Square: `width` and `height` 1440 in `src/project-config.ts`. Tune the zones in `src/scenes/parts/kit-frame.ts` for a square (section 10) |
| Springs | `springStep(t, freq, damping)` in `src/engine/util.ts` is a closed-form step response: 0 before the step, then 0 to 1. A value that changes target many times is the start value plus one spring per change: `v0 + Σ (v_i − v_(i−1)) · springStep(t − t_i, …)`. It stays a pure function of time. For a tiny overshoot use a damping of about 0.7 to 0.9; the default 0.35 overshoots by about a third. The damping must not exceed 1, or the function returns NaN |
| Stretching edges | The two edges of a tab indicator or a toggle knob ride springs of different frequency, so the leading edge runs ahead and the trailing edge catches up |
| The cursor | Its position is a sum of springs like any value, with its targets at the controls it clicks. A click is a press (scale down) and a release on beats. A drag is direct: while pressed, the dragged value is computed from the cursor's position; on release it springs back from where it was, with the speed it had at release: `springRelease(t, x0, v0, freq, damping)` in `src/engine/util.ts` (its speed is `springReleaseVel`), or `released` in `src/scenes/parts/kit-devices.ts` for a point in two dimensions. Take the speed at release from the drag's own path. The drawn cursor, its press and a click ripple are `cursor` and `clickRipple` in `kit-devices.ts`; a path through key points is `springPath` |
| The camera | The world rectangle of each state framed by `camForRect`; between states `camMix` driven by a spring's progress. Its zoom follows the state, so every state fills the frame |
| Content swap | The outgoing content leaves before the container finishes its morph; the incoming content enters after the container has started. Never both at once in one place. A "short blur" cannot use the canvas `filter`, which Safari lacks: draw the content two or three times with small offsets and low opacity, or scale and fade it |
| One take | One drawing function of the absolute time in `src/scenes/parts/`, called by a thin module for each state's shot (section 5) |
| Loop | Section 9 |

What makes it good: one silhouette that visibly connects every state; one accent colour that moves from state to state instead of fading in and out; readable text at every beat; real data.

The craft rules these requests write out hold for every interface in a short piece:

| Rule | Why |
|---|---|
| One icon set, one stroke weight, one cap and join | Icons of mixed weights are the first sign of a template |
| No gradients on UI chrome (buttons, fields, bars, panels) | Flat fills read as a real interface; gradients read as a mock-up |
| Artwork inside a morphing container is cropped or masked, never stretched | A stretched photo or cover shows at once |
| No full stop at the end of a display line | A headline is not a sentence of body text |
| Text that swaps inside a morph has its own mask and timing | Otherwise the words of two states overlap |
| One family of easing, a tiny overshoot at most | Bounce reads as a toy |

Usual failures: bouncy easing; text of two states overlapping inside the morphing shape; dead beats where nothing changes; a cursor that teleports; a loop that stutters because the cursor's speed differs at the seam; a generic dashboard with invented numbers.

Load: `camera.md`, `effects.md` (motion), `type-and-captions.md`, and `thinking-and-brainstorm.md`, section 2, when it shows a real product.

### 7.3 The product or SaaS launch from a real site

"Make a launch video for my product", often with a link, sometimes "go and find a SaaS people know". About a fifth of all such requests. The research of section 2 of `thinking-and-brainstorm.md` comes first; the recipe assumes it is done.

| Beats | What happens |
|---|---|
| Second 1 | The hook: the pain or the promise in at most five words, or the product's most striking screen already in motion |
| Seconds 1 to 3 | The product appears: its real interface, rebuilt as shapes from captured screens, not a screenshot pasted flat |
| Three movements of 2 to 4 seconds | Three features, one move each. Each transition demonstrates a feature (a stream that branches is "agents", a stream that freezes and resumes is "resumable") rather than replacing one card by another |
| One beat | Proof: one real figure with its source, set large |
| Last 2 seconds | Lockup: logo, name, one line, the address. Held still |

The look most such requests mean is a system, and it is worth building as one, in the brand's colours:

| Element | How it is made |
|---|---|
| Ground | Light off-white, or the brand's dark, with one soft gradient field at most |
| Eyebrow labels | Small monospaced capitals with a dot or a section number ("02 —") above each headline |
| Headline | A sans in two colours, ink and accent; one word set in a serif italic as the accent |
| Frames | The product inside a browser window with its three dots, a terminal, or a phone: `src/scenes/parts/kit-devices.ts` draws them, and a cursor |
| Cards | Real screens on cards with large soft shadows; bento grids of features; small floating chips (a status, a number, an avatar) |
| Depth | Cards tilted in space, with depth of field behind the one in focus |

Screens, logos and photos are drawn as pictures where the real picture is the proof: `ImageTexture` and `drawPicture`, or `drawImageFit` on a canvas layer, and a screen recording as an `ImageSequence` (`src/engine/media.ts`; files in `media/`; `engine-architecture.md`, section 4); the interface that moves is rebuilt as shapes.

What makes it good: the viewer recognises the real product; every claim is true on the day (a release candidate is not called stable, planned features are not shown as shipped); one accent from the brand; type from the brand or a named close substitute.

Usual failures: fake dashboards and invented metrics; a slideshow of screenshots; code too small to read; a spinning logo; the brand of another company used as if the film were theirs (see the rights in `thinking-and-brainstorm.md`, section 2); every feature told the same way.

Load: `thinking-and-brainstorm.md` (research), `interview.md` (round on real material), `type-and-captions.md`, `transitions.md`, `art-styles.md`, `references/sound-and-voice.md` when there is a voice or sound written in code.

### 7.4 The reward reveal of a mobile game

A chest opens, a rank goes up, a rare item drops. Asked for as a page that plays on a click; see section 11 for how that stays a function of time. Original art only: no character, logo or item of an existing game.

| Phase | Beats | What happens |
|---|---|---|
| Ready | Idle, looping | The object floats and turns slowly so its thickness shows; every few seconds it twitches to invite the click; a hint at the bottom |
| Upgrade | One per click | The object jumps, turns once in the air, lands squashed and springs back; the tier changes: main colour, light colour and background all move up one step (green, blue, purple, gold) |
| Charge | About 1 second | The shaking grows, light leaks from the seams, particles are drawn inward, the pitch rises; a hard squash on the last frame |
| Burst | A few beats | Bloom from the point of the burst (never a white-out over the whole frame), a push of the camera, layered shock rings, streaks, coins and gems turning as they fly. Higher tiers burst harder. Confetti once, at the top tier only |
| Reveal and claim | Settles, then holds | The reward card flies out on an arc and lands with a small overshoot; numbers count up; the rare item gets its border and "NEW"; on claim, coins fly on curves into the balance, which bumps as each arrives |

What makes it good: the hero alone on a clean backdrop at the reveal, its glow behind it and never over it; tiers that differ in every colour, not only in a label; everything still after the claim.

Usual failures, from the requests' own checklists: the hero covered by glow, particles or text; the frame burnt to white; a cluttered backdrop; small unreadable numbers; something still jiggling after the claim; outlines of hidden 3D objects showing on the backdrop.

Load: `effects.md` (particles, light, post), `camera.md` (punch, shake), `art-styles.md` (toon shading), `references/characters-and-story.md` for a mascot, `references/sound-and-voice.md` for sound written in code.

### 7.5 Kinetic spoken word and the manifesto

A few exact lines, staged in type: "we were told to wait ... now the floor belongs to us"; a 20-second manifesto; a locked message of six hits. The words are fixed and must be read in order.

| Beats | What happens |
|---|---|
| One line per phrase | Each line changes the architecture of the frame; words take roles (a lintel, a load, a support, an opening, a floor) made from their own letterforms |
| One held moment | At least 400 milliseconds of complete stillness, where it is earned. The kit's springs approach rest without reaching it, so a hold that must be truly still uses a move that ends exactly (`settle` in `src/engine/util.ts`), and post settings that do not change by themselves: `grain: 0`, `dither: 0` (`engine-architecture.md`, section 7) |
| The last line | Stands on what the earlier lines built |
| Loop, if asked | The camera passes under or through the last composition, and under full cover everything returns to the opening |

Timing follows phrases, pauses and emphasis, not a dance beat. Without a track, choose the synthetic grid's tempo so that the phrase cues fall on beats or half beats (at 120, every half second), and write the cues in beats. With a voice, the word timings rule: `references/sound-and-voice.md`.

What makes it good: each line readable before it becomes structure; the words carry the design, not illustrations behind them; nothing moves that has no reason to.

Usual failures: a line destroyed before it can be read; decoration that keeps moving during the hold; words added that were not in the locked text; protest-poster clichés (megaphones, fists, crowds) when the request forbids them.

Load: `type-and-captions.md` (reading time, voices), `effects.md` (type in motion), `transitions.md` (match cuts).

### 7.6 The logo sting

3 to 8 seconds. The logo is built from its own geometry (drawn as a wireframe, assembled from shards, written by its own strokes), hits once, settles and holds for at least a second. Use the owner's logo file; never redraw a brand's mark differently from the original. Load `effects.md` (drawing, arrivals) and `art-styles.md`.

### 7.7 The lyric video

The words of a sung track set as kinetic type. A whole song is longer than this lane, so it takes the eleven phases, with this recipe for its look.

| Part | How |
|---|---|
| Timing | Word times in a file `lyrics.json` in the film's data folder, which the film makes and the engine reads as `ctx.lyrics` (`src/engine/lyrics.ts`). Timing a sung vocal automatically is not built: the owner gives a timed lyrics file, or the lines are placed on the grid by bar and beat (`src/engine/beat-cues.ts`) and checked by ear |
| Layout that varies | Big and central at the hook, where the picture behind stays calm; small, like subtitles, in the verses; the words on one side and the subject on the other |
| Syllables | A word sung long is held long; a stressed syllable takes the accent |
| Reading | Every line on screen for at least its reading time (`type-and-captions.md`) |

Usual failures: every line in the same place and size; words that arrive before they are sung; a busy picture behind the biggest words. Load `type-and-captions.md`, `effects.md` (type in motion), `music-and-beat.md`.

### 7.8 The game trailer

A film about a game, not the game (`route-selection.md`, section 5). The play is scripted: the moves, hits and scores are data written as beats, and the picture is a function of the time and that script.

| Beats | What happens |
|---|---|
| Seconds 0 to 2 | The hook: the most spectacular moment of play, mid-action |
| The moments of play | Three or four best moments, a shot each: the move, the near miss, the chain, the score popping |
| The rise | Cuts get shorter on the build; the HUD counts up |
| The title | The game's name on the drop, then one more moment of play |
| End | The name, the platform or the link, held |

The HUD (timer, score, hotbar, minimap, health) is part of the look, drawn in one style, its values true to the script. Usual failures: play that the game's own rules would not allow; a HUD whose numbers never change; every moment the same size. Load `camera.md`, `effects.md`, `transitions.md`, and `references/characters-and-story.md` for characters.

### 7.9 The fast edit ("an edit that goes hard")

The fan edit of social video: a subject (a character, a product, a brand) cut hard to a track. Here it is made of drawn pictures, never of footage the owner does not own.

| Device | Where |
|---|---|
| A speed ramp: a move that slows to near stillness and snaps back | Into a hit |
| Flash frames, one or two inverted frames | On the kick of a drop |
| Impact zooms and shakes | On snares, sparingly |
| Text slams: one word, full frame | On downbeats |
| Hard cuts every beat or half beat | In the densest bars only |

Usual failures: the same hit on every beat; shake and flash everywhere until nothing hits. Load `transitions.md` (cuts with a punch, stutters), `camera.md` (punch, shake), `effects.md`.

### 7.10 The brainrot and meme piece

Maximal on purpose: fast collage, captions with emoji, stacked sound effects, a vertical frame. It still carries one joke or one line of thought, and its captions can be read. Internet brutalism (screenshots, raw type, system fonts) is a style here, drawn in code or taken from material the owner owns; someone else's meme images need their rights. Usual failures: noise without a joke; captions too fast to read; material the owner may not use. Load `art-styles.md` (collage, brutalist), `type-and-captions.md`, and `references/sound-and-voice.md` for the sound effects.

## 8. How short pieces fail

A short piece is watched several times, so every frame is seen. These faults make a piece look made by a machine or from a template. Each is a fault when it is there by habit, as filler; any of them is right when the idea of the piece calls for it or the owner asks for it (a neon piece, a HUD, a particle burst that is the point). The list is for review, not a list of banned looks.

| Fault | Examples | Fix |
|---|---|---|
| Labels and frames that mean nothing | "SCENE 01", a timecode that does not run, "REC", corner brackets as filler, a watermark, a footer, a progress counter nobody asked for | Remove. Every mark on screen has a job (`effects.md`, section 1). A HUD designed as a system with true values is allowed (section 7.1). A stage framed inside a coloured ground is a design choice when the request asks for it |
| Captions that describe the picture | "A NEW ERA", "THE FUTURE OF X" over a picture that already says it | Cut the words, or make them the content |
| The stock kit of "AI video" | Brains, robots, glowing neural nets, sparkles, purple and blue neon, glass cards, lens flares, grid floors, flashing backgrounds, particle bursts on every cut, rings orbiting a logo, text inside generated images | One design system taken from the subject's own world (`thinking-and-brainstorm.md`, section 5) |
| Dead time | Fade from black, empty first frame, holds with nothing moving and no reason, a beat with no event | Something on frame 0; one event per beat; stillness only where it is meant |
| Template rhythm | Every beat the same size of event, every entrance a scale-in from the centre | Vary the size of events; small on beats, large on downbeats |
| Invented material | Placeholder data, lorem text, a fake logo, a dashboard nobody uses | Real material, or honest abstraction |
| Unreadable at speed | Words on screen shorter than their reading time, code in small type | `type-and-captions.md`, section 7 |
| Overdriven finish | Camera shake on every hit, colour fringe on every frame, bloom that whitens the frame | Spend the finish on the few moments that matter |

## 9. A seamless loop

A loop means the frame after the last frame is the first frame: the piece may play forever and nobody sees the seam.

| Part | What it means |
|---|---|
| The timeline | The piece is a whole number of bars. Everything that moves is a function of the phase of the loop, `t` modulo its length, or of values whose history ends where it began. Settled springs are periodic; a spring still moving at the seam is not |
| Springs across the seam | Evaluate each value's spring sum over the changes of this cycle and of the one before, shifted back by the length of the piece. Then a change just before the end carries on into frame 0 exactly as it would have. This is exact when every spring has settled within one length of the piece |
| The cursor and the camera | Return to their first position with their first speed. A position that matches with a different speed stutters. A value let go near the end springs with `springRelease`; its speed at the seam, read with `springReleaseVel`, must equal the speed at frame 0 |
| Noise and seeds | Periodic noise: sample along a circle (`cos` and `sin` of the phase times `TAU`) instead of along a line; seeds taken from the index within the cycle |
| Transitions | The first shot of the data has no `in`, so the seam is a plain cut. Either the last shot ends on exactly the picture the first begins with (a match), or the last shot plays the transition inside its own time and ends on frame 0 of the first |
| The music | Whole bars, no fade-out, no tail of reverb cut off; the last bar leads into the first. A track can be cut to whole bars with `analysis/edit-track-by-bars.py`. Sound written in code is computed from the phase like the picture |
| Export, if asked | The frames 0 to N−1, never the frame N, which would show the first frame twice |

Check it with two stills. With `N` the number of frames (length times `fps`):

```sh
bun scripts/render.ts stills --frames 0,<N-1>
```

The two stills must look like two neighbouring frames: nothing appears, vanishes or jumps between them, and the difference is one frame of motion. If they differ more than a still of frame 0 differs from frame 1, find what does not return. In the studio, a piece that is one shot loops with `L`, which loops the shot under the playhead; a piece of several shots has no loop key today, and the lead adds one to the studio if the owner wants to watch the loop.

## 10. One piece in several formats

Requests often ask for 1:1, 16:9 and 9:16 of one piece.

What the starter supports:

| Part | State |
|---|---|
| Formats | Named sizes in `src/project-config.ts`: the master is `format` with `width` and `height`, the others are in `formats`. The studio shows another one through the page parameter `?format=<name>` or the key `f`, the capture tool captures in it with the flag `--format <name>`, and `bun run single -- --format <name>` builds a single file that opens in it. One film folder serves every format |
| Zones | `SAFE`, `PLATE`, `STAGE` and `CAPTION` in `src/scenes/parts/kit-frame.ts` come from `ZONE_TABLES`, one table per format (9:16, 4:5, 1:1 and 16:9 in the starter); a format without a table takes the one closest in shape. Check them in every format before any builder starts |
| Sizes of things | `UNIT` is one px of a 1080 px short side and follows the short side of any format. Sizes written as `n * UNIT` stay in proportion |
| Framing | `camForRect` shows a world rectangle inside a screen rectangle, whatever the format. A scene laid out in a world of its own and framed by it adapts to a new format by itself |
| Layout per format | The builder's work. The switch changes the size; where things stand in each format is decided per beat |

How to plan it:

1. Choose the master format: the one where the piece is mostly seen. Build and approve that one first.
2. Per beat, write where the subject sits in each format: centred for all, or moved (in 9:16 the text goes below the subject, in 16:9 beside it). Words stay inside `SAFE` of each format.
3. Scenes position everything from the zones, from `W` and `H`, from `UNIT`, and through `camForRect`. A fixed pixel number in a scene is a fault for a piece in several formats.
4. When one master will later be cropped by someone else (a 16:9 film cut to 9:16 for phones), keep everything that matters inside the centre area of the narrower frame, and check that area on stills.
5. A still of every key beat in every format, one capture at a time.

Formats are not rendered in parallel. Exports, when the owner asks for them, run one after the other, like every capture.

## 11. Pieces that play on a click

A reward reveal, an unboxing, a "tap to open" piece plays when the viewer clicks, and may take several clicks. It stays a function of time.

| Principle | How |
|---|---|
| The clicks are data | The picture is a function of the time and of the list of click times: `picture(t, clicks)`. Given the same clicks, the same frame. No state is carried between frames |
| Idle is a loop | Before the first click the piece plays its idle loop, a function of `t` modulo the loop's length (section 9) |
| A click starts a phase | Each click's time is the zero of the phase it starts; everything in that phase counts beats from it. A click during a phase that must finish is queued as data, not dropped and not allowed to break the phase |
| Sound | Starts on the first click, because browsers do not play sound before one. Sound written in code is computed from the same times |
| Reduced motion | When the viewer's system asks for reduced motion, no shake and fewer particles |
| Mute and replay | A mute switch in a corner of the page, outside the picture; a way to play the finale again without reloading |

How it fits the studio: the studio plays a film on a clock. For review, the piece is written into the shot data as a scripted run: idle for a bar or two, then the clicks at fixed beats, each phase a shot. That run plays in the studio, has cards in the animatic, and is captured by stills like any film. The live page, where real clicks feed the same drawing function, is a small shell of its own: it holds the list of clicks and calls the drawing with the time and the list. It is not in the starter. The lead builds it, like the studio, after the scripted run is accepted, and says that it is untried. The single-file build (`bun run single`) and its `window.seek(t)` show how such a page can carry the whole film in one file.

Check it by stills of the scripted run at the moments the requests themselves name: the charge, the burst, the reveal, the claim, and one still well after the claim, where nothing may still move.

## 12. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The owner waits a day for a 15-second piece | The eleven phases were run in full | This lane: assumptions, beat table, one builder, two gates |
| A short piece of three ideas feels like a list | It was not one idea | One formal idea, three techniques |
| A cut shows in a one-take piece | The two shots draw different moments or use their own scene clocks | One drawing function of the absolute time |
| The loop stutters | The cursor, the camera or a spring has another speed at the seam | Section 9: return with the first speed; springs over two cycles |
| The 9:16 version cuts words off | Zones of another format, or fixed pixel numbers in scenes | Zones per format; layout from zones and `UNIT` |
| A claim in the launch piece is wrong | It came from memory, not from the source | The sources table of `thinking-and-brainstorm.md`, section 2 |
| "Decide yourself" was read as leave to spend or to send | The hard rules were taken for gates | Section 4: hard rules hold in the autonomous mode |
| The lead built the piece because it was short | Rule 4 was read as applying to long films only | Section 6 |
| With the sound off the piece means nothing | The story was carried by the voice or the music | Watch it once muted; words on screen where the story needs them |
