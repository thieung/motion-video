# Orchestration: the lead, the builders and the review loop

This file describes how a lead directs a film whose shots are built by other agents: who decides, who builds, which files each may change, and how work is briefed, reviewed and sent back. It generalises what two films taught, each made by one lead with nine builders.

Load this when: you are the lead and you are about to write the authoring guide, brief a builder, review what a builder made, rework a shot that the owner has seen, or decide how many builders to start.

## Terms used in this file

| Term | Meaning |
|---|---|
| Contact sheet | One capture that holds several moments of a span in a grid, each labelled with its time |
| Cut sheet | A contact sheet that holds a few frames before and after every cut |
| Placeholder card | What the studio plays for a shot that has no module yet: a card that says what the shot will be and beats with the music |
| Plate | A solid ground, set by the shared overlay, on which a sentence stands over any picture |
| Shot data | The files that list the shots, their bars, camera moves, transitions and words. The storyboard document, the shot times and the placeholder cards are generated from them |
| Transition lead, transition tail | The beats a transition takes from the end of the outgoing shot, and from the start of the incoming shot. "The lead" without the word "transition" always means the role |
| In-world transition | A transition that happens inside the world of the two shots, so that their builder takes part in it |

## Roles

| Role | Decides | Builds | Never does |
|---|---|---|---|
| Owner | The topic, the audience, the message, the length, the frame, where the film plays, the language, the form of delivery. The music, by ear. The content and every sentence. The look, on a built sample. Whether the film is accepted. The rules of the machine | Nothing | Is never asked to approve from a description what can be shown or played. Is never asked to settle what the lead can look up or try |
| Lead | The route, the treatment, the storyboard, the shot data, the rules in the authoring guide, what goes back to a builder, what is accepted, which pictures survive a rework | The engine, the shared kit, the transitions, the overlay, the studio, the capture tool, the shot data and its generator, the authoring guide, the briefs | Builds a shot, not even a sample. Starts work that encodes content or look before the owner's go. Spends money or starts a heavy job without asking. Answers a fault report with a guess |
| Builder | How its shots are made: the means, the composition, the details of the camera. It may propose changes to the storyboard, to the way a sentence reaches the viewer and to a transition | The shots of its section, the part files of that section, its captures, its report | Changes the engine, the shared kit, the shot data or another builder's files. Copies kit code into its own files to change it. Changes an approved sentence. Starts a browser, a server or a renderer. Stops a process it did not start. Exports video |
| Story writer | Nothing on its own. It thinks a section or the film through and drafts: comparisons, boundaries, the shots of the storyboard | A draft of the shot data and of the sentences, with its reasons and with what it is unsure of | Writes into the shot data itself. Treats its draft as approved. Builds shots |
| Researcher | Nothing. It establishes facts | A report with sources: what a reference work does, what a tool or a service does, what is installed on the machine | Changes project files. States as fact what it only read in a document. Decides in place of the lead |

Three rules hold the roles apart.

1. The lead asks the owner about what belongs to the owner, and settles by itself what can be looked up or tried.
2. A direction to a builder states the intent and leaves the means free. A builder that finds a better way to show the same thing takes it and says so in its report. What it wants changed outside its own files, it proposes.
3. A researcher's report separates what a document says from what the code or the service does. The lead checks the figures that matter with a direct command before it relies on them.

From practice: a researcher reported 2,424 lines for the engine of a reference work, and the lead's own count gave 2,260. The documents of a music service left open what its answers look like and whether the requested length is kept. One real request settled both.

## Why the lead does not build shots

| Reason | What goes wrong when the lead builds |
|---|---|
| Somebody has to look at the whole film | A lead that is inside one shot is not looking at the cuts, the order, the kit or the content, and nobody else can |
| Builders judge their own shots well and cannot see the film | The lead's attention is spent where a builder would do as well, and is missing where no builder can work |
| The owner may have chosen the builders' model on purpose | A shot by the lead hides what the builders can do |
| A picture made by the lead carries the weight of a rule | Builders take it for the standard, and its faults travel into their work |

The rule has no exception for a sample. If sketches by the lead exist, hand them to the builder of that section, name their weaknesses, and say in the guide that they show how the kit is used and are not a standard. The builder may keep, improve or replace them.

From practice: the lead began to write the shots of the sample section. The owner stopped it: "Are you building the scenes? Decide only the important things, and let Opus build." The three sketches went to the builder of that section with their weaknesses named. One sketch held four examples of a fault, and three of them did not read as faulty. The builder kept the examples, and the owner found the error later.

## What only the lead can check

| What | How | What it finds |
|---|---|---|
| The cuts between sections | A cut sheet of the whole film, and a sheet across each section boundary with the shots of both sides loaded | A shot that opens on an empty frame, a transition that breaks, a cut that a builder could not check because the neighbour did not exist yet |
| The film as a whole | An overview sheet: a few dozen frames spread evenly over the film | The arc of colour and pace, a section that is out of design |
| The shared kit | Looking at captures from several sections. Reading the code does not find these faults | A fault that shows in every section: type that glows, a counter that prints two values at once |
| Values that appear in more than one section | Comparing them across sections and against the single source | Figures that disagree |
| Camera moves and transitions in order | The generator's check, then the list read by eye | Two shots in a row that move alike or come in alike |
| Examples and props across sections | The content table (see `quality-gates.md`) | Two sections that share an example, a prop or a kind of screen. A shot that reads as the idea of another section |
| Continuity between neighbours | Answering a builder's question from the storyboard and from the neighbour's report | Two sections that label one thing differently, or disagree on what is already drawn at the cut |

From practice: on the first film every builder had judged its own section well. The cut sheet of the whole film showed that most sections opened on an almost empty frame, the first kick of the film among them. Builders of both films wrote in their reports that a cut into a neighbour was not checked, because the neighbour's file did not exist when they captured.

## File ownership

| Files | Owner | What a builder may do |
|---|---|---|
| The shot files of a section (`src/scenes/<shot id>.ts`), its part files (`src/scenes/parts/<section id>-*`), its capture folder (`out/<section id>/`) | The builder of that section | Write |
| Engine (`src/engine/`), shared kit (`src/scenes/parts/kit-*.ts`), overlay (`src/scenes/overlay.ts`), placeholder card (`src/scenes/storyboard-card.ts`), studio (`src/main.ts`, `vite.config.ts`), capture tool (`scripts/render.ts`) | Lead | Read |
| Cast files of a film with characters (named `cast-<name>.ts` in `src/scenes/parts/`, see `characters-and-story.md`, section 3) | Lead | Read. Ask the lead for a missing pose or expression |
| Shot data and words (`shots.json`, `copy.json`) | Lead | Read. Write one named field, by leave only |
| Generated files: the storyboard document (`STORYBOARD.md`), the shot boundaries (`data/film-sections.json`), the shot times in the audio data (`sections` of `data/audio.json`) | The generator (`scripts/build-shot-files.py`) | Nobody edits them by hand |
| Treatment, authoring guide, project rules | Lead | Read |
| Another builder's files | That builder | Read |
| Reports | Each builder writes its own | Read the report of its own section from earlier rounds |

Rules of ownership:

1. One builder owns one section. The shots of a section share parts, a look and often one world, and the cuts inside it are its builder's to match.
2. A builder that needs a change in the kit or the engine, or finds a fault there, says so in its report and works round it. It does not copy kit code into its own files to change it.
3. A builder that thinks the storyboard is wrong about its section says so in its report. The lead changes the shot data.
4. A builder that uses a part of another section depends on that section's builder. It reports the dependency, and the lead decides whether the part moves into the shared kit.
5. When the shared kit changes while builders are at work, the lead tells every builder. Each captures again what the change touches and reports the result. A film folder is a copy of the starter, so a fix the lead makes in the starter's engine or kit does not reach a film already copied: the lead copies the changed file into every film that is live, then tells its builders. From practice: a guide named two post settings that the lead had just added to the starter, and the film's own engine, copied earlier, did not have them.
6. A thing that several sections draw (a character, an object that opens, a device) lives in the kit with the hooks every section will need, not only its outline: where it opens, where things attach, its size at a given height. The lead asks the first builder what it had to add, and moves that into the kit before the next builders start.
7. Leave to write shot data is rare and narrow. It names one shot and one field, and it is given only when the value can be found by the builder alone, for example the place and size at which an element of its shot is handed to a transition of the engine.
8. Whoever writes a shared data file reads it again immediately before writing, changes only the field it means to change, runs the generator, and checks the generated files. A copy read at the start of a round may be old.

From practice: a builder whose title hands a large letter over to a transition of the engine was given leave to set the size and the turning point of that one transition in the shot data. It ran the generator and reported both values. In the same hours the lead changed the same file for other sections. No loss was recorded. Rule 8 is a precaution against the loss which that arrangement makes possible. Other builders found that a field no longer matched their shot, left the file alone and reported the value, and the lead wrote it.

## The authoring guide

Every builder receives one guide. It is written by the lead before any builder starts, together with the treatment and the shared kit. It holds what is true for all sections, so that a brief can be short.

The starter ships no guide. The lead writes one for the film and keeps it in the film folder, beside `README.md`, under a name the lead chooses. Its sections 4, 5 and 9 start from the starter README: "Adding a scene module" (the skeleton of a module and the rules for scenes), the file map (the kit files in `src/scenes/parts/`), and "Commands".

| No. | Section of the guide | What belongs in it |
|---|---|---|
| 1 | The film | One paragraph: the topic, the audience, what the viewer should leave with, the frame, the frame rate, the length, the music. The form of delivery and what follows from it for a shot, for example a frame time target and no motion blur when the film plays in real time |
| 2 | What is fixed, and what is yours | The few fixed rules of the film, each with its reason. The freedoms. The content table of "must show, must never show", with the examples and props that are taken. The colours by name and their use. The look each section borrows |
| 3 | Your files | The ownership table, and what to do when a change is needed in a file that is not the builder's |
| 4 | A shot | The contract of a shot: the skeleton of a module and the rules that cannot be broken |
| 5 | The kit | A table of the kit files and what each gives. Known traps of the libraries. Features that the owner's browser lacks. The floor for type size. Glyphs that the fonts lack |
| 6 | The camera | Poses are data. How a move leaves and settles. How much the picture may breathe with the kick. When a locked frame is the right choice |
| 7 | Transitions | The room a shot leaves: what happens to its last beats and to its first beats. The in-world transitions a builder takes part in, one row for each kind, and the stand-in the engine plays until then |
| 8 | Words | The ways a sentence reaches the viewer, who sets it in each case, the test for leaving the words out. The wording is approved and exact. The builder may change the way and must report it |
| 9 | Commands | Type check, stills, contact sheet, frame time. Captures queue behind one lock. What is forbidden |
| 10 | The loop | Write, capture, look, ask, fix, measure. Then the shots in a row across their cuts |
| 11 | Your report | Where to write it, its parts, the status block |

The contract of a shot has four rules that cannot be broken.

| Rule | Meaning |
|---|---|
| A frame is a function of the time | No real clock, no random number without a seed, no state carried from one frame to the next. A simulation is run once at the start into a table and looked up |
| Time is counted in beats | Every event reads the beat data of the analysis. Nothing is computed from seconds or from a tempo figure |
| The first frame has weight | A shot starts on a beat, often a loud one. Its first frame is already a picture |
| What steps is read from the frame, what moves from the sample | A counter, a label that changes, which word is showing: the time of the frame. A position, the camera, a line being drawn: the time of the sample |

Rules for the guide itself:

1. The fixed rules are few. Everything else is the builder's, and the guide says so.
2. The guide tells the builder to flag a shot that reads as another concept, even when the storyboard asked for that shot.
3. The guide is a living file. When a report names a trap, the lead adds a line.
4. Paths in the guide are relative to the film folder, so that the guide survives a move to another machine.

From practice: three lines of the second film's guide came from the work itself. The draw order of see-through objects in the 3D library and the need to release a line batch came from builders' reports. The ban on a canvas feature that the owner's browser lacks came from a fault the owner found.

## The brief for a builder

The brief holds what is true of this section only. Replace every placeholder in angle brackets.

```text
# Brief: section <section id>, <section name>

## Task
Build the <number> shots of section <section id>, bars <first bar> to <last bar>
of the music. When you finish, no placeholder card is left in these bars.
Idea of the section in one sentence: <what the viewer must understand>.
Look the section borrows: <look>. Key hue: <hue>.

## Read first, in this order
1. <path of the authoring guide, in the film folder>, the whole file
2. STORYBOARD.md: your section, and the shots on both sides of it
3. shots.json and copy.json, read only
4. <kit files in src/scenes/parts/ that matter most for this section>
5. <report of this section from an earlier round, if one exists>

## Files you may change
- src/scenes/<shot id>.ts, one for each of your shots; the file name is
  exactly the shot id
- src/scenes/parts/<section id>-*
- out/<section id>/ (pass --out to the capture tool)
Everything else is read only, the cast files (src/scenes/parts/cast-*.ts)
among them: ask the lead for a pose or an expression they lack.
<Only if leave is given:> You may change the field <field> of shot <shot id> in
shots.json. Read the file again immediately before you write. Change
nothing else in it. Run bun run shots. Report the old
and the new value.

## The music in your bars
| Bars | What the music does | What it carries |
|---|---|---|
| <bars> | <no drums, build, drop, break> | <problem, answer, what must be read> |

## The shots
| Shot id | Bars | Intent | Camera move | Comes in by |
|---|---|---|---|---|
| <shot id> | <bars> | <what the viewer must see, not how to draw it> | <move> | <transition> |

## Transitions
Leave room for:
- <shot id>: the last <n> beats lie under the transition lead of the next
  shot. What matters is over before that.
- <shot id>: the first <n> beats arrive under a transition tail. The first
  frame has weight, and no word to be read stands there.
Take part in:
- <kind> from <shot id> into <shot id>: <what is asked of the shot>.

## Words
| Sentence | Bars | How it reaches the viewer | Place | Reason |
|---|---|---|---|---|
| <kind> | <bars> | <plate, shot, none> | <top, middle, bottom> | <reason> |
The lower edge of a plate of <n> lines at the top is y <pixels>. The upper
edge of a plate at the bottom is y <pixels>.
The wording is approved. Use it exactly. You may wrap it again.

## Content boundaries
Must show: <one line>.
Must never show: <one line, taken from the neighbouring concepts>.
Examples and props that belong to other sections: <list>.
Test for every shot: could a viewer who cannot see the name call this shot by
the name of another concept? If yes, the shot is wrong. Say so in your report,
even when this brief asked for the shot.

## Practical rules
- Run commands from the film folder <path>. Use absolute paths.
- Captures run one at a time for the whole machine. The tool waits its turn.
- Do not start a browser, a server or a renderer. Do not stop a process that
  you did not start. Do not export video.
- The owner watches in <browser>. Do not use <features that browser lacks>.
- If the type check fails in a file that is not yours, say so and go on.
- <words that the shell of this machine refuses in a command, if any>

## Only for a rework
The shot as it is now shows: <list of its pictures>.
Must survive: <pictures the owner praised, pictures that carry the idea>.
May be dropped: <list, chosen by the lead>.
New job: <what changes and why>.

## Accepted when
- <criterion that can be checked on a capture>
- Frame time of every shot is measured and is at or under <target>.

## Report
Write to <reports folder>/<file name>. A later round is added to the same file
under a new heading. Parts:
- what each shot shows, in one or two sentences, and its files
- where you departed from the storyboard, and why
- what you decided for each sentence, and why
- frame time of each shot
- problems in the kit or the engine, and how you worked round them
- every figure or statement on screen that is not in <single source>
- proposals you did not build
- what you are not satisfied with
- unresolved questions

End your reply with:
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

Notes on the brief:

1. The column "Intent" says what the viewer must see. It does not say how to draw it.
2. Give the edges of the plates in pixels. A builder that guesses the depth of a plate lays its shot out under it.
3. Do not pass the whole conversation. Give the decisions that the section needs.
4. When a builder answers `BLOCKED` or `NEEDS_CONTEXT`, change the context, the scope or the approach. Do not send the same brief again.

From practice: one builder assumed that a plate at the top was about 250 pixels deep, and found that with three lines it reached about y 615. In another section two shots went through an extra round of layout, so that nothing to read ran under a plate of three lines.

## The review loop

| Step | Who | What happens |
|---|---|---|
| 1 | Builder | Builds, captures, looks, fixes, measures. Runs the motion check of `quality-gates.md` on its fast moves and on the boundaries of its timing. Writes its report and the status block |
| 2 | Lead | Reads the report first: the departures, the proposals, the list "not satisfied with" |
| 3 | Lead | Opens the builder's contact sheets. Captures its own where the builder's do not cover a moment, a cut with its neighbour loaded, or a remark of the owner |
| 4 | Lead | Looks at every image, and judges it against the content table, the look of the section's best shot, the reading check, the sync check and the frame time |
| 5 | Lead | Sends the points back to the same builder, with reasons, or accepts in plain words |
| 6 | Builder | Works the round and adds it to its report under a new heading |
| 7 | Lead | Captures again and looks again. A point is closed by a capture, never by the builder's word alone |

The work goes back to the same builder because it holds the context of its section. A builder does not outlive the session: its report is what a later builder starts from.

| Part of a review message | What it holds |
|---|---|
| What was seen, and when | The shot id, the time in seconds or the beat, and what is in the frame at that time |
| What is wrong | The reason, held against a rule of the guide, the content table or the best shot of the section |
| What to do | The result that is wanted. The means stay with the builder |
| What may stay | The parts that work, by name, so that the round leaves them alone |
| Decisions on the builder's proposals | Each departure approved or not. Each proposal taken or declined, with the reason. Each overrun of the frame time accepted or not |
| What the lead changed itself | Changes in the kit, the engine or the shot data that the builder must capture again |

Keep the list short enough to be worked in one round, and keep one kind of question to a round (see the order of rounds below).

From practice: a review message held three to five points for a section. The review of the sample section held three points: the last shot was the weakest, the object that stands for the concept was too small in two shots, and the figure was stiff. One review message for another section closed four matters in one line each: a change of the steps approved, a change of timing approved, a proposed in-world transition declined, small overruns of the frame time accepted. A proposal for one more in-world transition was declined with its reason: that cut lies in a quiet passage, and such transitions are meant to be few.

## The order of rounds

| Round | Question | Points that belong to it |
|---|---|---|
| 1. Content | Does each shot show its own idea, and not a neighbouring one? Is every example true? | A shot that reads as another concept. An example or a prop that belongs to another section. A mark that sits on something that is not wrong |
| 2. Layout and craft | Is the picture built well? | The subject is too small. Part of the frame is empty. Something to read lies under a plate. The first frame is empty. An event misses its beat. A shot is made of bare primitives beside drawn shots |
| 3. Polish | What small things are left? | Labels that touch, numbering, a highlight, a shadow |

Content comes first because a shot whose content changes loses the craft that was spent on it. A review of how good a picture looks does not find a content fault: the picture is good.

From practice: in one section the polish round came first. The content round that followed rewrote two shots, and a part file that had just been polished was deleted. A third round then laid the two new shots out again.

Reworking a shot that the owner has seen:

1. Look at the shot as it is, and write down what happens in it.
2. Mark what must survive: what the owner praised, and what carries the idea.
3. When the shot gets shorter, choose what is dropped. That choice is the lead's.
4. Put both lists into the brief. Tell the owner what is dropped.

From practice: a shot was moved on to the first drop and given the name of the section to carry. The brief described the new job and said nothing about the three cuts through one sheet that the shot had shown. The builder replaced them. The owner saw it on the first viewing: "Before you changed it, the shot cut one sheet into three cards. That is gone now, and it was good." It cost two more rounds.

## Machine load

| Rule | How it is enforced |
|---|---|
| One capture at a time for the whole machine | A lock inside the capture tool. The second run waits for the first, whoever started it |
| Builders start no browser, server or renderer | The guide and the brief say so. The capture tool starts its own private server and stops it when it ends |
| No server, browser or watcher is left running | The lead tracks every process it starts: command, process id, port. It stops a process by its exact id after confirming what it is, and checks afterwards |
| Nobody stops a process that is not its own | The guide and the brief say so |
| No video export unless the owner asked in this conversation | The capture tool refuses its video mode. Approval given once does not carry over |
| The studio does not load the machine while the owner is not watching | The studio draws nothing while it is paused |
| A heavy job is announced | The lead says how long it will run and how to stop it, before it starts |

How the lock works, as built in practice:

| Property | Behaviour |
|---|---|
| Form | A folder, `.render.lock`, that holds the process id of its owner. Making a folder either succeeds or fails, so two runs cannot both hold it. The starter's tool puts it in the nearest folder above the film that holds `.git`, else the nearest that holds `CLAUDE.md` or `AGENTS.md`, else the system's temporary folder; `RENDER_LOCK_DIR` overrides this. Every film under one root shares it |
| Waiting | A run that finds the lock waits and tries again every half second |
| A lock whose owner is gone | It is cleared after a second look, which covers the moment between making the folder and writing the id |
| Limit | A run gives up after fifteen minutes of waiting |
| Release | On exit and on interruption, and only by the owner of the lock |
| Server | The tool starts a private server without live reload, so that a file saved during a capture does not reload the page. It uses the studio only when `--url` names it, and only if the page's marker names this film (`title` in `src/project-config.ts`). Builders leave `--url` out |

From practice: on the first film nine builders captured at the same time and the machine was overloaded. The owner asked: "Run the renders slowly, and do not open so many in parallel. My machine cannot take it." On the second film the rule became: "Do not export video any more, it costs my machine too much CPU. Make HTML only, then build a page that joins the scenes so that I can press play."

## Scaling

What was done in practice:

| Film | Sections and shots | Builders | How they were started | Other agents |
|---|---|---|---|---|
| First | 12 sections, each built as one module of 3 to 8 bars | 9, one section each. The lead built 3 sections itself, before the rule that the lead does not build | All at once | 4 researchers read the reference work, 1 researched the music service, 1 agent set up the engine |
| Second | 8 sections of 4 to 8 shots and one group of 3 (title, recap, end card): 54 shots | 9, one section or group each | One builder first, for the sample section. After the review and the owner's look, the other eight at once | None |

### A short piece

A piece of the short lane (`short-pieces.md`) has one builder for the whole piece, on the latest Opus model, and no story writer. It owns every scene file and every part file of the piece. Its brief is the template above with one section: the beat table in place of the shots, the frame and formats, the loop or the click if asked, the real material and its record of sources, and the recipe it follows. The lead does not build in this lane either; only the owner can lift that rule for a piece. The review is by stills: one per beat of the busiest bar, every change of state, the seam of a loop, the key beats of every format.

### Which model does what

The owner's rule, given for this skill: when the agent is Claude, the sub-agents that think a storyboard through and the sub-agents that build shots run on the latest Opus model. The lead keeps its own model.

| Role | Model | How |
|---|---|---|
| Lead | The model of the lead session | It decides and reviews |
| Story writer | The latest Opus | Start the agent with the model named, for example `model: "opus"`. Give it the brief, the boundaries and the music map; ask for a draft and its reasons |
| Builder | The latest Opus | The same. One builder per section |
| Researcher | The model of the lead session, or a smaller one | It reads and reports |
| On another assistant than Claude | The strongest model that assistant offers for long, careful work | Say in the report which was used |

| Rule | Reason |
|---|---|
| Name the model when the agent is started | An agent started without a model takes the model of the session, which is not what the owner asked for |
| "Latest" is looked up, not remembered | Model names change. Use the alias the tool offers for the newest Opus, and say which model that was |
| The lead still owns the storyboard | A story writer drafts. The lead checks the draft against the boundaries, writes the shot data, and takes it to the owner |
| Say plainly which model each agent ran on | In the hand-over, and whenever the owner asks |

From practice: on the second film the lead ran on Fable 5.1 and wrote the storyboard itself; the nine builders ran on Opus, because the owner wanted to see what that model can make. Every fault of content that the owner found later came from the lead's storyboard, not from a builder. A second mind on the storyboard, with the table of boundaries in hand, is the remedy the owner chose.

Guidance drawn from that practice:

| Situation | Builders |
|---|---|
| A clip under 30 seconds with one shot | One agent. No shared kit, no shot data, no builders |
| A short film with few shots | One builder takes the shots in turn |
| The sample section is not accepted yet | One builder |
| Many sections that do not depend on each other, and a stable shared kit | One builder for each section |
| Two shots that are one world | The same builder |
| An in-world transition across the boundary of two sections | The two builders of those sections. The lead names in both briefs what each side hands over, and checks the cut with both shots loaded |

Add builders when the sample section is accepted, the kit is stable and the sections are independent. The lock makes captures wait in a row, so more builders mean a longer wait for each capture and not more browsers at the same time.

From practice: the owner looked at the sample section while it was being built, found it "beautiful and in the right direction", and said that more builders may be added for shots that do not depend on each other.

## What builders report

| Part of the report | What the lead does with it |
|---|---|
| What each shot shows, and its files | Holds it against the storyboard and the content table before opening a capture |
| Departures from the storyboard, with reasons | Approves or declines each one in the review message. Writes the approved ones into the shot data |
| What was decided for each sentence | Updates the shot data, so that the overlay stops drawing a plate which the shot now carries itself |
| Frame time of each shot | Accepts an overrun or sends it back |
| Problems in the kit or the engine, and the way round | Fixes the kit itself, tells every builder, adds a line to the guide |
| Figures and statements on screen that are not in the single source | Has them checked by the owner or by someone who knows the field |
| Proposals that were not built | Decides with the whole film in view |
| Not satisfied with | See below |
| Unresolved questions | Answers each one. A question about a neighbour is answered from the neighbour's report |
| Status block | `DONE` and `DONE_WITH_CONCERNS` go to review. `BLOCKED` and `NEEDS_CONTEXT` get a changed brief |

How the lead uses the list "not satisfied with":

1. Read it before looking at a capture. It is the builder's own review.
2. Check each item on a capture. The list says where to look. It does not replace looking.
3. Sort each item: fix now, accept and record, or a matter of the kit.
4. Look for items that return in several reports. They point at the kit, the tool or the guide, and not at one builder.
5. Carry what stays open into the open items of the hand-over.

From practice: all three points that the lead sent back on the sample section had been named by the builder in its own list. Four builders listed an empty lower part of the frame, and the lead's points asked for the whole frame to be used. Builders of several sections reported the same trap of the capture tool: a still asked for at a beat fell between two frames and showed a stepped value twice. The lead changed the tool, which now moves a still to the nearest frame. One item stayed open to the hand-over: a model and a drawing of the same object that differ in a detail.

## Failure modes of orchestration

| Symptom | Cause | Fix |
|---|---|---|
| The owner has to say stop | The lead took the approval of a content table for a go to build, and went on to the palette, the fonts and the kit | Stop at the gate. Show the storyboard and the animatic, and wait for an explicit go. Work that encodes neither content nor look may go on |
| The lead is writing shot code | The lead wanted a sample, or wanted to move faster | Stop. Hand what exists to the builder of that section with its weaknesses named. Write briefs and review |
| The owner asked for one more thing, and everything was changed to that thing | The lead read an addition as a replacement | Ask: add, or replace? Restate the request in your own words before you change the shot data |
| A picture that the owner liked is gone after a rework | The brief described the new job of the shot and did not name what the shot already showed | List the pictures of the shot before the brief. Mark what must survive. Choose yourself what is dropped, and tell the owner |
| A lost picture cannot be looked up | The repository is not under version control, so the builder rebuilds the picture from its own context | Put the repository under version control before the first rework round |
| A builder's type check fails in a file that is not its own | Another builder is half way through a change: a file imports a part that is not written yet or was just deleted | The builder names the file in its report and goes on. It does not touch the file. The lead runs the type check for the whole app when all builders have reported |
| A capture logs an error from a shot that was not under review, and a second run is clean | Another builder saved a file during the capture | Load only the shots under review. Run the capture again before you treat the error as a fault |
| A change to the shot data is lost, or the generated files do not match the data | Two writers of one data file: the lead, and a builder with leave | Keep one owner. Give leave for one named field only. Every writer reads the file again immediately before writing and runs the generator |
| Builders build a fault faithfully and well | The fault is in the lead's storyboard or sketch | Run the content check at storyboard time. Tell builders in the guide to flag a shot that reads as another concept |
| Several builders lose a round to the same trap | Each met it alone, and nothing carried it to the others | When a report names a trap, fix the tool or add a line to the guide, and tell the builders that are still at work |
| The machine is overloaded, and the owner asks whether a process was orphaned | Every builder started its own browser to capture | One lock inside the capture tool. Builders start nothing |
| The owner asks why something is rendering | The lead started a heavy job without asking | Ask first. Say how long the job runs and how to stop it |
| A fix is made and the fault returns unchanged | The diagnosis was a guess | Find evidence first: what each process is doing, what the browser reports |
| A later session cannot go on with a section | The builders of the earlier session no longer exist | A new builder starts from the guide, the storyboard and the report of its section. Keep every report complete for that reason |
| A builder answers `BLOCKED` a second time | The same brief was sent again | Change the context, the scope or the approach |
