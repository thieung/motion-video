# Quality gates and known pitfalls

This file lists the gates at which the lead stops and waits for the owner, the checks that belong to each phase, and what "done" means for a shot, a section and the film. Its pitfalls were all met on two films, or are named in the method that came out of them, and each stands with its cause and its fix.

Load this when: you are about to cross from one phase to the next, show something to the owner, accept a shot, a section or the film, or meet a symptom that you cannot place.

## The gates in order

| No. | Gate | What is shown to the owner | What the owner decides | What may not start before it |
|---|---|---|---|---|
| 1 | Brief | The questions that belong to the owner, each with a proposal where one helps | Topic, audience and message. Maximum length, frame, where the film plays. Words to sing or speak, or music only. The language of the words. The form of delivery: a file, or a film that plays in the studio. The browser and the machine it is watched on | Anything except reading and research |
| 2 | Route | The routes that were considered, with the strength and the weakness of each, and one recommendation with reasons. The licence of everything that would be reused | Limits on tools, on money and on the machine. Whether the recommendation stands | Setting up the engine and the tools. Any purchase |
| 3 | Concept | The treatment: the premise, what is locked, what is free, what is never done. The content table: the idea of each section, its example, its sentences. The factual claims | The list of sections and its order. The examples. Every sentence. Whether the look is locked or free | The storyboard. This gate does not open the building |
| 4 | Music | The candidate tracks as files of full quality. The cost of one more generation | Which track, by ear. Whether money is spent on more | The final beat grid. The timing of shots in bars. Every paid generation, each of which needs its own yes |
| 5 | Storyboard with animatic | The storyboard document, generated from the shot data. The studio playing the whole film with the music: a placeholder card for every shot, and every sentence shown | What is on screen, shot by shot. The rhythm of the cuts. The length of each section. Whether the words can be read in time. An explicit go to build | Any code that encodes content or look: palette, fonts, the parts of the kit that carry the look, every shot. Starting builders |
| 6 | Look on a sample section | One whole section, built by one builder, playing in the studio in the owner's browser | Whether the look and the direction are right | The other builders |
| 7 | Finished film | The whole film in the studio, in its final order. What changed since the last viewing and what was dropped. The sentences that changed. The open items | Acceptance, or corrections. Every changed sentence | The hand-over. Deleting captures. Any export |
| 8 | Hand-over | The README, the setup tried on a clean copy, how the film is changed, the open items, the lessons, the licences, and the statement that no process is left | Where the film goes next. Whether intermediate output is deleted. Whether a video file is wanted | Deleting or moving anything |

Rules that hold at every gate:

1. Stop, and ask one clear question.
2. Approval of one thing is not approval of the next. An approved table of content is not a go to build.
3. When an answer hints that the owner is still thinking, ask before building.
4. Show the thing itself: a file to listen to, a picture to look at, a film to play. A description or a measurement does not stand in for it.
5. An approval given for one occasion does not carry over to the next. This holds for video export and for every paid generation.
6. Work that encodes neither content nor look may run ahead of gates 3 and 5: reading, the beat grid of a chosen track, the engine, the studio, the capture tool.
7. When the owner uses a word that you cannot place, ask for an example, restate it in your own words, and wait for a yes. When the owner asks for something new, ask whether it is added or replaces what exists.
8. A rule that the owner states during the work is written into the project's rules file at once.

From practice: the owner approved a table of sections and examples, and the lead went on to the palette, the fonts and the kit. The owner stopped it: "Hold on, do not build yet. I have not settled the content or how the scenes look." The owner then added a requirement that changed the structure of every section. At the route gate of the first film the owner said: "Do not lock the work into that tool. I was not sure, so I only listed what I have."

## Checks per phase

### Before drawing

- [ ] The brief settles everything that belongs to the owner, the form of delivery among it, and names the browser and the machine the film is watched on.
- [ ] The route is chosen with reasons, and the licence of everything reused is read.
- [ ] The treatment says what is locked, what is free and what is never done.
- [ ] Factual content and every sentence were checked by someone who knows the field.
- [ ] For a film about a real product, brand or figures: every figure, logo, screen and line of copy on screen has a row in the record of sources, with its rights (`thinking-and-brainstorm.md`, section 2). Nothing of the owner's was uploaded anywhere.
- [ ] The owner chose the music by ear, from a file of full quality. Every paid generation was asked for.
- [ ] The beat grid was looked at over the waveform in several places. The beats were counted through every passage without drums. A pickup bar was found, if there is one.
- [ ] The storyboard is data. Every shot has its bars, its camera move, its transition, and the way each sentence reaches the viewer with the reason.
- [ ] The generator's checks pass: no gap, no overlap, every sentence inside its section, every warning about a repeated camera move or transition either fixed or marked `"repeat": true` because the repeat is meant, no transition lead that runs into the tail of the one before.
- [ ] The sections do not follow one mould of telling.
- [ ] Every shot, example, prop and sentence was held against the other concepts of the film.
- [ ] The foundation test passes.
- [ ] The capture tool holds its lock. It refuses video export if the owner chose a film that plays in the studio.
- [ ] The repository is under version control.
- [ ] The owner watched the animatic and gave an explicit go.

| Foundation test | How |
|---|---|
| Determinism | Capture the same frame in two separate runs and compare the hashes |
| Sync | One shape that blinks: on at the beat, off between two beats |
| Type | One sentence with every mark of the language, in every type voice |
| Settings in one place | Change the size and the frame rate in one place only |
| Delivery | The studio plays the whole film. For a file: a short clip comes out with the right number of frames |

### While building

- [ ] The owner saw the sample section and settled the look.
- [ ] The authoring guide holds the content table and the list of examples that are taken.
- [ ] Every shot went through the loop of write, capture, look and fix.
- [ ] In a film with characters, every still was held against the line-up still and the faults of `characters-and-story.md`, section 11.
- [ ] Of every shot the lead saw a contact sheet across the shot, the first frame, the densest frame, and the last frame before the next transition lead.
- [ ] No shot reads a real clock, a random number without a seed, or state from the frame before.
- [ ] The content round came before the layout round and the polish round.
- [ ] A rework brief names the pictures that must survive.
- [ ] Every change in the shared kit was told to every builder.
- [ ] One capture runs at a time. No server is left running after a round.
- [ ] Every rule the owner stated is in the project's rules file.

### Before hand-over

- [ ] Every shot has a module. The studio counts no placeholder card.
- [ ] One frame of every shot was captured, and all of them render.
- [ ] The cut sheet and the overview sheet of the whole film were looked at.
- [ ] The type check passes for the whole app.
- [ ] An event falls on the kick at the start, in the middle and at the end of the film.
- [ ] The frame rate in playback was read at the heaviest shot.
- [ ] The film was watched in the owner's browser.
- [ ] The mute test: the film, or the piece, was watched once with the sound off, and its story still reads. Many viewers watch without sound; a film that needs the voice to be understood carries its words on screen.
- [ ] The owner watched the film in its final order and approved every changed sentence.
- [ ] No process is left.
- [ ] The README says how to set up, how to watch, how to change the film, and what is open.
- [ ] The setup was tried on a clean copy.
- [ ] The lessons and the record of decisions are inside the repository.
- [ ] The licences of music, fonts and reused code are stated. Rights that are not settled are listed as open.
- [ ] The motion check: consecutive frames across every fast move and every cut, and `--exact` stills either side of every boundary of each shot's timing, show nothing that was not meant (section "The motion check").
- [ ] For a loop: the stills of the last frame and of frame 0 look like neighbouring frames (`short-pieces.md`, section 9).
- [ ] For several formats: a still of every key beat in every format, words inside the safe zone of each.
- [ ] For a piece that plays on a click: stills of the scripted run at the charge, the burst, the reveal, the claim, and after it, where nothing moves.
- [ ] In the autonomous mode: the list of decisions and of what waits for the owner is written and shown.
- [ ] Only if the owner asked for a video file: frame count, length and frame rate were read from the file, every measured cut lies within one frame of the nearest kick in the file's own audio, and the main colours were read back after encoding. The duration is exact and the timestamps of the frames are evenly spaced. No single frame pops: the difference between neighbouring frames has no spike several times larger than the frames around it, except at a planned cut or flash. For a loop, the file holds the frames 0 to N−1, not frame N. Check the exported file with the commands of `engine-architecture.md`, section 8: frame count, duration, even timestamps, single-frame pops.

## The content check

When a film explains several concepts that are neighbours, a good picture can teach the wrong one: it shows another concept of the same film. The fault lies in the storyboard. A review of the look does not find it, because the picture is good.

| Step | What to do |
|---|---|
| 1. Write the boundaries | For each concept, one line "must show" and one line "must never show". The second line is taken from the neighbouring concepts |
| 2. Hold every shot against the table | Ask of each shot: could a viewer who cannot see the name call this shot by the name of another concept? If yes, the shot is wrong |
| 3. Keep the examples apart | No two concepts share an example, a prop or a kind of screen. Keep a list of what is taken |
| 4. Check the words | A key word of one concept does not appear in the sentence or on a label of another |
| 5. Check every example of a fault | In a shot about what goes wrong, every example shows the fault in its largest pieces, and the mark sits on the fault |
| 6. Do it twice | Once on the storyboard, before anything is built. Once on the built section, before any polish |

A generic example, for a film that explains four kinds of bridge:

| Concept | Must show | Must never show | Example, taken |
|---|---|---|---|
| Beam | A straight deck that rests on supports and presses down on them | A curve that carries the load (arch). Cables (suspension) | A plank laid over a stream |
| Arch | A curve under the deck that pushes outward on its two feet | A deck that hangs from above (suspension) | A stone doorway |
| Suspension | A deck that hangs from cables, which run over towers to anchors in the ground | Anything that holds the deck from below (beam, arch) | A hammock between two trees |
| Cantilever | An arm held at one end only, which carries its load at the free end | A support under the free end (beam) | A diving board |

Used on a shot: the storyboard for the cantilever asks for a board whose free end rests on a rock. Cover the name, and a viewer calls it a beam. The shot is wrong, however well it is drawn. Used on a sentence: a sentence for the arch which says that the deck "hangs" borrows the key word of the suspension bridge.

From practice: the owner watched the second film and found shots that taught another concept of the same film. A shot for a concept about making one thing showed one press that sent three messages, which is the picture of a concept about reporting one change to many. A shot for a concept about choosing step by step and making only at the end showed an object that gained one layer at each station, which is the picture of a concept about wrapping a finished thing. The lead's own check then found two more cases, one of them a pair of examples that were the subject of another section. All of them were written that way in the lead's storyboard. The builders had built what was asked, and had built it well. Shots in four sections were rewritten and three sentences were changed. In another shot a cross lay over three of four examples that did not read as faulty.

## The look check

Compare every shot of a section with the best shot of that section.

| Step | What to do |
|---|---|
| 1 | Put one frame of every shot of the section into one sheet |
| 2 | Name the best shot: the one whose visual language is the richest and the most its own |
| 3 | Hold every other shot against it: the line, the ground, the way figures and objects are drawn |
| 4 | A shot made of bare primitives beside drawn shots is out of design. Send it back to be rebuilt in the visual language of the best shot, and name that shot in the review message |
| 5 | Do the same across the film on the overview sheet, to find a section that is out of design |

Questions for every capture:

| Question | Fails when |
|---|---|
| Is the point readable from the picture alone? | The picture needs its caption to be understood |
| Is the subject large enough? | The thing that stands for the concept is small in a wide frame |
| Is the whole frame used? | Part of the frame is empty because the picture was kept inside the safe area of the words |
| Is the accent colour on the concept only? | Something else carries it, and no exception is recorded |
| Does only the right thing glow? | Type glows, or lines glow where many of them overlap |
| Does it look designed? | Things are cut off, overlap, or have no room |
| Does it look made by a template or a machine? | Labels, frames and counters with no job, captions that describe the picture, the stock kit of "AI video", dead time: see `short-pieces.md`, section 8 |

From practice: two shots of one section were built in space, one as a wire frame and one as a model with paper walls, while the best shot of that section was an architect's drawing made with a pen tool. The owner said: "These two shots seem out of design. They are not as beautiful as the others." Both were rebuilt with the pen of the best shot and with its figures. The first title of the same film, a numeral as a slab in space with the title set across it, was called very ugly by the owner and was rebuilt.

## The reading check

| Check | Rule | How to check |
|---|---|---|
| Size | Set a floor for the size of type on the frame, and hold every label to it. A vertical frame for phones needs larger type than a horizontal one | On a capture at full size. A floor that is enforced in the units of the drawing does not hold on screen when the camera zooms out |
| Time | A sentence stays long enough to be read. What must be read stands in a quiet bar or on a locked frame | The owner judges it on the animatic. On the built shot, count the beats during which the words are whole and still |
| Place | Everything to be read lies inside the safe area: apps cover the top, the bottom and one side of a vertical frame. Nothing to be read lies under a plate, under a counter, or in beats that a transition covers | A capture with the overlay on. The edges of every plate in pixels |
| Marks | Every accent and diacritic is whole, in every type voice and at the smallest size. No glyph falls back to another font | The test sentence of the foundation test. A capture at full size of the smallest type |
| Wording | A sentence that appears uses the approved words exactly. It may be wrapped again. A line break follows the sense | Compare with the words file. Put the breaks that matter into the words file |
| Numbers | A number is read as the number it is | Look at a capture of every counter at a moment when it changes |
| Collisions | No word crosses another shape. No label touches a line or another label | A capture of the densest frame |

From practice: on a vertical frame of 1080 by 1920 the floor for type was 28 pixels, the sentences on plates were set at 54 pixels, and the words stayed between x 72 and 1008 and between y 200 and 1560 while the picture ran to every edge. In the first film a statement entered on a downbeat and stayed for at least two bars. The fonts held every mark of the language and held no arrows, ticks or crosses, so builders drew those as shapes. Small type in a pattern of dots broke the marks of the language, and the names were set in the caption face instead. A counter with leading zeros showed `0,134`, which read as a decimal. A comma of one line touched a letter of the line above and read as a mark on that letter. A sentence that was broken by width ended a line in the middle of a phrase.

## The sync check

| Check | Rule | How to check |
|---|---|---|
| The grid | The beat grid follows the audio itself and is never computed from one tempo figure | Plot it over the waveform in several places. Compare the spacing of the kicks at the start and at the end of the track |
| Events on beats | Arrivals, impacts and changes fall on a beat or on a division of one | A contact sheet, and stills asked for at beats |
| The first frame | A shot starts on a beat, often a loud one. Its first frame is already a picture | The cut sheet |
| Room for transitions | What matters in a shot is over before the next transition lead. No word to be read stands under a transition tail | The sheet across the cut, with the shots of both sides loaded |
| The drop transition | It has three parts | A sheet round the cut: several frames of the build, one of the breath, several of the impact |
| Picture against sound | An event falls on the kick at the start, in the middle and at the end of the film | Watch and listen in the studio |
| A video file, only when asked for | Every measured cut lies within one frame of the nearest kick in the audio of the file itself | Measure in the file |

| Part of the drop transition | When | What happens |
|---|---|---|
| Build | About two beats before the drop | The tension rises on a curve that speeds up, with a punch on every half beat, each stronger than the one before |
| Breath | The last quarter beat | Almost everything is taken away: a dot, a line, or one colour |
| Impact | The first beats of the drop | The new shot arrives with a flash, a shock wave or a jolt of the frame. Its first frames may be printed in negative |

Without the breath the drop is a cut with an effect.

From practice: the grid agreed with the kicks with a median of 1.5 milliseconds in the first film and of 0.0 in the second. A grid of constant tempo was wrong by up to 65 milliseconds on a generated track whose tempo rose by more than one beat a minute from its start to its end. In the video file of the first film five cuts lay between 0.9 milliseconds early and 10.4 late, all within one frame of 16.7. The owner said of the first transitions: "They are too gentle and not tight. They do not make a visual effect yet." The build was shortened from four beats to two, the light transitions to about a quarter beat on each side of the cut, and the first two frames after a drop were printed in negative.

## The motion check

A still shows one moment at one frame. Two faults hide from every still and show at once in playback, and neither is a matter of taste: a flicker that nobody planned, and a picture that is wrong only between two frames. This check finds them. It does not limit what may move or how fast; a planned flash, a hard cut or a whip is a choice, and it passes.

| Check | Why | How |
|---|---|---|
| Consecutive frames across every fast move | A bright shape that moves very far in one frame, or appears or vanishes between two frames, reads as a flash, even when every still looks right | A sheet of every frame across the move: `sheet --frames` or `--times` at n/60. Look for a shape that jumps, a large bright area that comes and goes in a frame or two, a colour that steps. Keep it if it was meant; soften it if it was not |
| Times between frames at every boundary | Captures are moved to the nearest output frame unless `--exact` is passed, but the studio draws at whatever times the display asks for. A gap in a scene's timing that falls between two frames shows only in playback | For every boundary in a shot's timing (a reveal, a switch of state, a hand-over, the end of the shot), `stills --exact --t` just before and after it, for example ±0.001 s and ±0.005 s, compared with the frames either side |
| What selects the picture | A branch chosen from the time rounded to the frame (`frameTime`, `frameClock`) while the picture is drawn at `f.t` draws the wrong branch between frames | Read the code: only values that must step (a counter, a label) are read at the frame; every decision about what is drawn uses the time the drawing uses (`engine-architecture.md`, section 1) |

From practice: the owner twice saw a flash in a 20-second piece of type that every still had missed. The first was a letter whose counter was scaled with its stroke, so for a quarter second a bright stroke swept half the frame; a sheet of consecutive frames showed it. The second was a sunk line of words drawn again for one instant at 9.995 seconds, just before a cut at 10.0: the shot chose its branch from the rounded frame time. Captures at the frames on either side were identical and clean; one capture at `--exact` 9.995 showed it. After the fix, the builder checked all 64 boundaries of the piece at off-grid times and found no other gap.

## The cross-browser check

| Rule | Reason |
|---|---|
| Ask at the brief which browser the owner watches in | The capture browser proves the picture in the capture browser only |
| When the owner reports a shot as blank or broken and the captures are fine, read the errors that the owner's browser reported before you answer | The development server relays the console of the browser: the shot id and a stack. An answer without it is a guess |
| Keep out of every shot the drawing features that only one family of browsers has | A missing feature can throw in every frame, or fail without a word |
| Fix a fault of this kind once, in the engine | A fix in each shot is a fix in many places |
| Check the film in the engine of the owner's browser before the hand-over. If the capture tool cannot drive that engine, list it as open and ask before installing anything | A fault that was found once does not prove that there is no other |

| Symptom | Likely cause | First step |
|---|---|---|
| A shot is blank for the owner and fine in captures | A feature that the owner's browser lacks throws in every frame | Read the relayed errors of the browser |
| Type stands tighter or wider than in captures | A text feature of the canvas is missing and fails without an error | Do not let a layout depend on it |
| The stack of an error names frames of native code | The error comes from the owner's browser, not from the capture browser | Look for the feature that the shot uses there |

From practice: the owner said twice that one shot showed nothing. The captures, made in Chrome, were fine. The first answer, that the shot had probably been seen while it was being built, was a guess and was wrong. The owner watched in Safari, which has no `filter` on the 2D canvas context. The engine patched that property without checking that it existed, so every drawing layer with a scale other than 1 threw in every frame. One section used such a layer. The cause stood in the output of the development server all the time.

## The performance check

| Item | Rule |
|---|---|
| Target | Set it in the guide, from the frame rate and the form of delivery. For a film that plays in real time at 60 frames a second a frame has 16.7 milliseconds. The guide of the second film asked for 8 or less |
| How it is measured | The frame time mode of the capture tool, over a span of two seconds or less at the densest part of the shot, with only that shot loaded. Report the average and the 95th percentile |
| What the number includes | The capture's own read-back of the pixels. Measure an almost empty shot once to know that fixed cost, and read every other number against it |
| The first frame | A spike on the first frame comes from things that are built at first use. Build them when the shot starts up |
| Real playback | The studio shows the frame rate while it plays. Read it at the heaviest shot, on the owner's machine |
| Another machine | A slow frame on one machine is not evidence about another. Measure there |

| Cost found in practice | Fix |
|---|---|
| Shadow blur and blur of the canvas | Remove it, or draw it once into a canvas off screen |
| Still parts that are drawn again in every frame | Draw them once off screen and reuse them |
| Number formatting by locale, called several times a frame | A plain formatter with the same output |
| A shader at full resolution that looks the same at half | Half resolution |
| Things built at first use | Build them at start-up of the shot |

From practice: an almost empty shot measured about 7.3 milliseconds in the capture tool, and built shots measured between 7.5 and 12 on average, with that fixed cost included. The lead accepted small overruns of the target of 8. The frame rate of real playback on the owner's machines was not measured, and the hand-over lists it as open.

## Pitfalls

### Brief and approval

| Symptom | Cause | Fix |
|---|---|---|
| The owner has to say stop | The approval of a content table was taken for a go to build | Stop at the gate and ask one clear question. A storyboard and an animatic come before any code that encodes content or look |
| The owner asked for one more thing, and everything was changed to that thing | An addition was read as a replacement | Ask: add, or replace? |
| The plan is built round a tool that the owner only mentioned | The tools on the machine were read as requirements | Treat them as candidates. Recommend one route, with reasons |
| Work starts on a part that the film does not need | The kind of film was taken from the reference work | Settle at the brief whether there are words to sing or speak. Do only the audio analysis that the brief needs |
| The owner names a style, and the lead cannot place the word | The word has no standard meaning | Ask for an example and restate it before anything is changed |
| The owner asks why a heavy job or a paid job is running | It was started without asking | Ask each time. Say how long the job runs and how to stop it |
| A rule is unknown in the next session | It was said in the conversation and written nowhere | Write it into the project's rules file when it is stated |

### Music

| Symptom | Cause | Fix |
|---|---|---|
| The picture agrees with the sound at the start and drifts later | The grid was computed from one tempo figure, and the track does not hold its tempo | Build the grid from the audio, beat by beat |
| The analysis finds an absurd number of events | Nobody looked at the result. A short window on the low band follows the wave itself and invents attacks | Plot the result over the waveform and look |
| The measured tempo jumps in one passage and comes back | The detector counted a beat too many or too few where no clear drum plays, or where the bass hides the kick | Follow every sharp onset through that passage, and count the beats again |
| Phrases fall one bar off the music | The first bar of the track is a pickup | Find where the drums come back after each break. The phrases start there |
| The time scale of the analysis is off by a fraction of a percent | An envelope was sampled at a whole number of samples for each step | Sample at the exact times |
| The version that measures better is the one the owner likes less | Measurements were used to argue about taste | Give the files in full quality. The owner chooses by ear |
| The track is much longer than was asked for | A generation service need not keep the requested length | Check the file that came back. Use the track whole if it fits. Otherwise cut on bar lines, and carry the grid through the cut instead of analysing again |
| A result can no longer be downloaded | The link was temporary | Download at once. Keep the request and the answer |
| Picture and sound part after the audio was processed | The processing moved the timing | Measure the delay between the file before and the file after |
| A key could be printed into a log | One answer of a paid service echoes the key | Never show an answer of such a service raw |

### Storyboard

| Symptom | Cause | Fix |
|---|---|---|
| By the third section the viewer knows how the rest will go | One mould of telling for every section | Vary the length, the order of telling and the place of the key point. Let the shape of the music decide |
| Every shot looks straight on and stands still | The storyboard has no column for the camera | Record a camera move for every shot |
| Shots overlap or leave a gap, or a sentence runs outside its section | Nothing checks the storyboard | Write it as data, and check it every time the documents are generated |
| A choice in the storyboard cannot be reviewed | It has no reason | Record the reason for the way each sentence reaches the viewer |
| A file that is named for the last section holds the first | The order changed late, and the ids had been positions | Treat ids as names. Take the number on screen from the data. Rebuild only the sections that change their place in the music. Record the mapping in the README |

### Content

| Symptom | Cause | Fix |
|---|---|---|
| A good picture teaches another concept of the same film | The storyboard was not held against the neighbouring concepts | The content table and the test of the covered name, before anything is built |
| Two sections use the same example, prop or kind of screen | Examples were chosen section by section | Keep one list of what is taken |
| A mark of "wrong" lies on something that is right | The examples of a fault were not checked one by one | Every example shows the fault in its largest pieces, and the mark sits on the fault |
| A picture shows something that is false or unsafe in the real thing | A detail was drawn for the look | Have the claims checked before drawing. Builders list every figure and statement they add. What is not certain is left out |
| A figure differs between two sections | It was typed in more than one place | One source for every figure on screen |
| Craft is lost when a shot has to change | Polish came before content | The content round comes first |
| Builders build the fault, and build it well | The fault stood in the storyboard | The guide tells builders to flag a shot that reads as another concept |

### Look

| Symptom | Cause | Fix |
|---|---|---|
| Some shots are bare primitives beside drawn shots | The builder changed its means inside the section | Rebuild them in the visual language of the best shot of the section |
| A shot opens on an empty frame, even on the loudest beat | The shot begins by drawing itself in | The first frame has weight |
| A contact sheet shows the same picture in every cell | The shot does not develop | Give it a development: a move of the camera, a reveal, a change of state |
| The whole film has one flat style | Too much is locked | Lock little and free much: the palette, the type voices, the post-processing, one convention of colour |
| Something glows that should not | Additive blending sums overlapping lines past the threshold of the glow | Separate the layers, change the blend mode, set the threshold on purpose. Type never glows |
| A dark plate turns grey over a light ground | A layer that is nearly opaque lets a few percent of light through when it is blended in linear light | Make the layer fully opaque |
| The accent colour no longer means one thing | It was used for something that is not the concept | Hold the rule. When the owner asks for an exception, record it as deliberate |

### Words

| Symptom | Cause | Fix |
|---|---|---|
| Every shot has the same band of words at the bottom | The caption is nailed to one place | Each sentence is set on a plate, set by the shot, or left out, with a reason |
| Something to be read lies under a plate | The builder guessed the depth of the plate | Give the edges of the plates in pixels in the brief |
| A symbol is missing or comes from another font | The fonts hold no arrows, ticks or crosses | Draw symbols as shapes |
| The marks of the language break up | Small type in a stylised face | Set such words in the caption face |
| A line ends in the middle of a phrase | The sentence was broken by width | Put the line breaks into the words file |
| Type is smaller on screen than the floor | The floor is enforced in the units of the drawing, and the camera zoomed out | Check the size on a capture |
| A label cannot be read | It rides on a fast object | Fix the label beside the path |
| A counter prints two values over each other | A value that steps was computed for each sample of the motion blur | Read what steps from the time of the frame |

### Camera

| Symptom | Cause | Fix |
|---|---|---|
| The moves feel undecided | Even drifting | A move leaves at once and settles hard |
| The camera jerks at the start or the end of a zoom | The zoom was blended by difference | Blend the zoom by ratio |
| Every shot moves in its own way, and one fault is fixed in many places | The moves were written again in each shot | The moves live in the shared kit |
| Two shots in a row move alike | Nothing records the moves | The generator refuses it |
| The picture shakes with the music | The breathing with the kick is too strong | Keep it to a few percent |
| A shot stands in the wrong place on screen | The builder took a pose for an offset from the corner, and it was the point at the centre of the screen | The guide says what a pose is |
| The subject is drawn off screen | The move of the camera lags behind what is being drawn | Time the move so that the subject comes into view as it is drawn |

### Transitions

| Symptom | Cause | Fix |
|---|---|---|
| The music drops and nothing happens in the picture | The drop is only a cut | Build, breath, impact |
| The transitions look like the stock effects of an editing program | Every transition is a filter over two finished pictures | A few in-world transitions at the moments that matter |
| The transitions are gentle | They are too long, and smooth where they should step | A light cut is over in half a beat. A build has a punch on every half beat |
| The transitions crowd out the content | Every cut was made large or in-world | Most cuts are light. Large ones belong to the drops and to the boundaries of sections |
| The point of a shot is distorted or covered | It falls in beats that a transition takes | The brief names those beats |
| A frame breaks without a cause | Nothing is seen to hit the lens | The object is large in the last frames and reaches the turning point on the cut |
| An element shrinks or jumps when it is handed to the engine | The element of the engine starts at a size and a place that the shot cannot know | The engine takes size and place from the shot data and tells the shot where its element stands. A shot keeps no copy of values of the engine |
| Two large drops feel alike | They use the same build | Each large drop has its own build |

### Engine

| Symptom | Cause | Fix |
|---|---|---|
| Part of the picture vanishes on the densest frame | A draw buffer is over its capacity and drops what does not fit, without a word | Size it for the densest frame, and check that frame |
| An object inside a see-through object is hidden | The 3D library draws solid objects first | Mark the inner object see-through as well, and set the order |
| Lines come out dim and beaded, with a dark ring where they overlap | A line batch in additive mode added the alpha as well | Fixed once in the engine. Every builder captures again |
| A still shows a stepped value twice although the code is right | The time of the still lies between two frames | The tool moves a still to the nearest frame |
| A still at the first beat of a shot shows the shot before | The nearest frame lies before the start of the shot | The tool takes the first frame of the shot that was asked for |
| A capture logs an error of another shot, and a second run is clean | A file was saved during the capture | The capture server runs without live reload. Load only the shots under review |
| An edit by script did not happen, and nobody noticed | The shell read the command in another way | After every edit by script, check that the file changed. Run single commands in place of a loop |
| Only for a video file: the export of the whole film never ends | The script waited for an end signal behind a backlog. A short clip had worked | The receiver counts the frames itself. Test once at the real length |
| Only for a video file: the colours differ in the player | The encoder converted with one colour matrix and wrote no tag | Name the matrix and tag the file |

### Machine

| Symptom | Cause | Fix |
|---|---|---|
| The machine is overloaded | Several captures ran at the same time | One lock inside the capture tool |
| The machine is loaded while the owner works on it | Video export | The tool refuses it unless the owner asked |
| Processes pile up | A server, a browser or a watcher was left running | Track what you start. Stop it by its exact id. Never stop a process that is not your own |
| The owner's browser loads the machine while the film is paused | The studio drew while paused | The studio draws nothing while paused |
| The shell refuses a command | A hook on the machine refuses commands that hold certain words or paths | Use the run scripts of the project, give the folder of the environment another name (the starter's is `analysis/python-env`), use absolute paths |
| A fix is made and the fault returns unchanged | The diagnosis was a guess | Find evidence first: what each process is doing, whether a file grows |

### Hand-over

| Symptom | Cause | Fix |
|---|---|---|
| A lost picture cannot be looked up | The repository is not under version control | Put it under version control before the first rework round |
| A new session knows none of the lessons | The lessons live outside the repository | Copy them into it, and put an opening prompt into the README |
| A new builder cannot go on with a section | The builders of the session are gone | The guide, the storyboard and the report of the section are its start |
| Paths fail on the other machine | The guide and the data held paths of the machine | Paths relative to the repository. Try the setup on a clean copy |
| The film plays with a click, or silent, on the other machine | The music was not copied with the film folder. The studio skips a listed music file that is missing, and a missing file in `audio/` or `data/` answers 404 | Copy `audio/` and `data/` with the film. The starter serves both from the film folder itself, with no links between folders, so a plain copy carries them. Run `sh scripts/clean.sh` first to leave out what each machine makes again |
| Reports name captures that do not exist | The captures were deleted | Captures are intermediate and can be made again. Keep what cannot be made again, such as the music |
| The engine differs between two machines | A fix was made on one of them | Keep a fix in one form. Name the newer copy. Never copy older engine files over it |
| A change is gone after the generator ran | A generated file was edited by hand | Change the data and run the generator |
| Nobody can say whether the film may be used commercially | The rights of generated music were not made clear | State the licence of music, fonts and reused code. List rights that are not settled as open |

## What "done" means

| Level | Done when |
|---|---|
| Shot | 1. Its module exists and plays in place of the placeholder card. |
| | 2. With the name covered, it cannot be called by the name of another concept. |
| | 3. The first frame is a picture, the events fall on beats, and what matters is over before the next transition lead. |
| | 4. Every word uses the approved wording, stands at or above the floor, inside the safe area and clear of plates, with every mark whole. |
| | 5. The accent colour marks the concept only, or the exception is recorded. |
| | 6. It holds against the best shot of its section. |
| | 7. It reads no real clock, no random number without a seed and no state, and uses no feature that the owner's browser lacks. |
| | 8. Its frame time is measured and is at or under the target, or the lead accepted the overrun. |
| | 9. The lead looked at its captures and accepted it in plain words. |
| Section | 1. Every shot of it is done. |
| | 2. The cuts inside it were captured with both shots loaded, and no two shots in a row look or move alike. |
| | 3. The cuts into both neighbours were captured once the neighbours existed. |
| | 4. Every sentence has its way, its place and its reason in the shot data. |
| | 5. Its in-world transitions are built, or the lead accepted the stand-in of the engine. |
| | 6. Every departure and every proposal has a decision of the lead. |
| | 7. Its report is complete, and says what is left open. |
| Film | 1. Every section is done, and the studio counts no placeholder card. |
| | 2. The cut sheet and the overview sheet were looked at, and the type check passes for the whole app. |
| | 3. The owner watched the whole film in the studio, in the owner's own browser, in the final order, and accepted it with every sentence. |
| | 4. The owner was told what changed and what was dropped since the last viewing. |
| | 5. The checks before hand-over are met, or what is not met is listed as open. |
| | 6. No process is left, and everything a later session needs is inside the repository. |

A shot that was accepted is not closed for ever. When the owner corrects it after a viewing, it goes back to its builder through the same loop, in the order of content, layout, polish.
