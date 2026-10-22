# Thinking and brainstorm

How to get from a subject to a film that can be drawn: what to think through before any idea is had, how to find comparisons and looks, how to give the film a shape in time, and how to put real alternatives before the owner.

Load this when: a brief has been agreed and no concept exists yet, the owner asks for ideas, a section's idea does not work, a shot is weak and the reason is not craft, or the film shows a real product, a real brand or real figures.

## 1. Think before having ideas

Answer five questions in writing. Ideas that come before the answers are usually about the wrong film.

| Question | A good answer | A bad answer |
|---|---|---|
| Who watches? | "People who build apps with an AI assistant and have never studied programming" | "Developers" |
| What do they take home? | "Eight names, and for each one what it is for, so that they can ask the assistant for it by name" | "An understanding of the subject" |
| Why should they care? | "Without the name they describe the thing in ten sentences and get something else" | "It is important" |
| What can be shown and need not be said? | A list of things that have a shape and can move | "The concepts" |
| What is its shape in time? | "Eight parts of unequal length on one track, the name of each landing where the music lands" | "About three minutes" |

Then write the film in one sentence. If the sentence needs "and" twice, it is two films.

## 2. Research the real thing

A film about a real product, a real brand or real figures starts from the real material, not from memory. A launch film with an invented dashboard, or an explainer with a figure nobody can trace, fails however well it moves. Do this research before any idea, and before the storyboard writes a single claim.

Skip this section for a film about an idea that needs no facts beyond common knowledge.

### What to gather

| Material | From a website | From a repository or the owner's files |
|---|---|---|
| What it is and does, in its own words | The home page, the features and pricing pages, the documentation, the changelog | The README, the package description, the documentation folder, the changelog, the release notes |
| The screens | Pages read as text for their structure; screens captured one at a time, as stills, by the lead | The owner's screenshots and recordings; the interface's own source for sizes, radii and spacing |
| The logo | The logo file the site serves (an SVG where there is one), the icon of the site | The asset folders; ask the owner for the master file |
| Colours | The custom properties and the theme colour in the page's styles | The theme or style configuration, the design tokens |
| Typefaces | The font families the styles name and the fonts the page loads | The font files and their licences |
| Copy | Headlines, the one-line promise, button labels, exactly as written | The strings of the interface and its translations |
| Figures | Numbers the owner publishes (users, providers, speed), with the page they stand on | Fixtures, benchmarks, public statistics the owner points to. Never personal data |
| Figures for a data explainer | Official and primary sources: statistics offices, agencies, the paper that measured it | A dataset the owner gives |

Rebuild the interface as shapes from what was captured, so that it can move and morph; use a screenshot as a picture only where the real picture itself is the proof. A captured screen is a reference for measurements and colours, not a texture to paste.

### The record of sources

Keep one table in the project's state file, and keep the figures that scenes draw in a JSON file of the film's data folder, which scenes import, so that a figure is written once. Every figure, logo, screen, typeface and line of copy on screen has a row:

| Column | Holds |
|---|---|
| What | The figure, the asset or the line, exactly as it appears on screen |
| Value | For a figure: the number, its unit, and what it counts |
| Source | The page address or the file path, and the words around the figure there |
| Read on | The date it was read. Pages change |
| Uncertainty | For an estimate: the range the source gives. Say it on screen where it matters ("about", "between") |
| Rights | Whose it is, and under what it may be used |
| Used as | Shown as is, rebuilt as shapes, or only measured |

A figure on screen that has no row is removed or given one before the storyboard is approved. A claim about a release (stable or not, shipped or planned) is checked against the source on the day, not against what the lead remembers.

### Rights

| Material | Rule |
|---|---|
| The owner's own product: screens, logo, copy, figures | Theirs to use. Ask once that it may appear in the film |
| Another company's brand, logo or interface | A film shown as that company's own needs that company's permission. As a private study it may be made; say so, and never present it as the company's |
| Typefaces | Use the brand's font only if its licence allows it to be embedded; otherwise name a close free substitute and say so |
| Photographs, footage, music, sound effects | The owner's own, or under a licence that allows the use. Record the licence |
| People | No real person's likeness or name used as if they endorsed something |

### Nothing leaves the machine

Research reads public pages and the owner's files. It sends nothing: no screen, file, logo or piece of code of the owner's is uploaded to any service (image tools, background removers, font identifiers, converters), no sign-in is made on the owner's behalf, and no account is created. Screens behind a sign-in come from the owner as files. The captures of screens are stills, one at a time, made by the lead, like every capture.

The interview has a round for this: `interview.md`, section 4, round 6.

## 3. From a subject to pictures

Work part by part. Fill one row per part before drawing anything.

| Column | Holds | Test |
|---|---|---|
| The idea, in one plain sentence | What the part teaches, with no term of the field | A person outside the field can repeat it |
| The problem | What goes wrong without the idea | It hurts, and it can be shown |
| The comparison | Something from the viewer's own life that works the same way | See section 4 |
| The thing | The one object in the comparison that IS the idea | It can be pointed at. It will carry the signal colour |
| Where they meet it | The idea in the viewer's own work | They have seen this screen |
| Must show | What the picture has to make plain | One line |
| Must never show | What would make it the picture of a neighbouring idea | One line per neighbour |

The last two columns are the ones most often skipped, and the ones that cost most when skipped. A picture can be beautiful and teach the neighbour's idea. See the content check in `quality-gates.md`.

## 4. Finding the comparison

A comparison is good when it passes all of these.

| Test | Why |
|---|---|
| It comes from the viewer's daily life | Nothing has to be explained first |
| It has the same structure as the idea, not only the same surface | "Layers round a phone that leave the phone as it was" has the structure of wrapping. "Toppings added to a drink" has the structure of adding, which is another idea |
| It can be drawn, and it can move | A comparison that is only a sentence is a caption |
| It has a state without the idea and a state with it | The problem and the answer are both pictures |
| One object in it is the idea | The adapter, the lever, the hatch. If nothing can be pointed at, the comparison is a mood |
| No other part uses its world | Two parts that both order food at a counter will be confused |
| It is true | A drawing is taken at its word. A wire joined wrongly for the sake of the picture teaches the wrong thing |
| The owner recognises it | The owner knows how they explain the subject. Ask for their own comparisons first |

How to look for one:

1. Ask the owner how they explain it when they teach. Their comparison is tested.
2. State the structure in bare words: "one thing, many users", "one request in, one made thing out", "a change told to everyone who signed up".
3. List ten places in daily life with that structure. The first three are what everyone thinks of. Look at the rest.
4. For each, name the thing, the problem state and the solved state. Drop those where one of the three is missing.
5. Hold the survivors against the comparisons of the other parts.

## 5. Finding the look

The look follows from the comparison. Each comparison lives in a world that has its own printed things, screens and materials: see `art-styles.md`. The world of a kitchen has order tickets and a menu board. The world of a tailor has paper patterns. Take the idiom from there, one per part.

### A style taken from a reference image

Owners often attach an image and say "use this only as style". Read it into rules the builders can follow, and show those rules to the owner before building, since a reading is an interpretation.

| Read from the image | Write as |
|---|---|
| Colours | A palette of five to seven colours, each with its role (ground, ink, accent, light, shadow), taken from the image, not guessed |
| Light and finish | Where the light comes from, how hard it is, grain, glow, halation, fringe: settings of the post chain |
| Line and surface | Line weight and whether it wobbles; flat, shaded or textured fills |
| Type | Its family and weight class, its case, its tracking; the nearest free face if the image's face is not free |
| Composition | Symmetry or not, how much empty space, where the horizon sits |
| Motion, if the reference is a film | Cutting speed, kind of easing, how things arrive |

Take the manner, not the content: the image's subject, characters and text are not copied into the film. A reference that is someone's artwork is a source of manner only; say so in the record of the look.

## 6. Shape in time

The music gives the film its skeleton. Read `music-and-beat.md` for the map of a track. Then:

| Decision | Guided by |
|---|---|
| How long each part is | The phrases of the music. Parts are of unequal length, the shortest about half the longest |
| Where a part's problem goes | Where the music builds or has no drums |
| Where the idea lands | On a drop, or on the first bar of a phrase |
| Where words are read | Where the drums stop |
| Which part goes where | The owner decides the order. Propose the order in which the parts are easiest to follow, and say what the music offers each place |

### Do not tell every part the same way

A viewer knows a template by the third part. Ways to break it:

| Way | Example |
|---|---|
| Unequal length | Eight bars for one part, fourteen for another |
| Another order of telling | Open with the idea at work, then rewind to life without it |
| Open with a joke | A machine that deals out the wrong combination |
| Another point of view | First person: the viewer's own finger on the screen |
| Move the name | At the start, with the idea, or as the last word |
| Let the music decide | Two bars of silence become two bars of waiting |
| Another tempo of cutting | One part in long shots, one part with a shot a bar |
| Words here, none there | One idea shown without a sentence |

What every part contains stays the same. How and in which order changes.

## 7. Brainstorm

### Diverge

Make at least three directions for the whole film. They must differ along an axis, not in detail.

| Axis | One end | Other end |
|---|---|---|
| What holds the film together | One world throughout | A world per part, held by palette, type and rhythm |
| What carries the meaning | Objects and comparisons | Type alone; diagrams; a character |
| Relation to the music | Every event on the grid | The music as a bed |
| Tone | Dry and exact | Playful, comic |
| Point of view | Looking at things from outside | First person |
| Form | Essay | A borrowed form: a recipe, a manual, a heist, a nature film |

Make one of the directions unlikely on purpose. It is rarely chosen and often lends its best idea to the one that is.

Ways to push an idea further:

| Way | Question |
|---|---|
| Take it away | What does life look like without it? |
| Push it until it breaks | What if there were a thousand of them? |
| Change the scale | What if it were the size of a city, or of a pin? |
| Take the comparison literally | What if the layers really wrapped the word? |
| Start from the music | What happens on the drop? Work backwards |
| Start from the poster | If the film were one still, which? |
| Borrow a form | How would a cookery programme explain this? |
| Add a rule | One shape only. No words. Everything on paper |

### Describe

Each direction gets the same short description, so that they can be compared.

```
DIRECTION <letter>: <name>
In one sentence   <what the film is>
The first ten seconds   <what is seen and heard>
One part, told    <the part that shows the direction best, in four lines>
Held together by  <what stays the same>
Music             <kind, tempo, relation>
Strong at         <what it does best>
Risk              <where it may fail>
Cost              <what is dear to build>
```

### Converge

Rate the directions against what the brief asks. Add a line of reason to every rating; a number alone persuades nobody.

| Criterion | Asks |
|---|---|
| Clear to this audience | Would the viewer of the brief follow it? |
| Parts stay apart | Could any two parts be confused? |
| Fits the music | Does it use builds, drops and breaks? |
| Can be drawn in code | Without footage, without drawing by hand |
| Fresh | Has the viewer seen this film before? |
| Cost | Builder rounds, shaders, simulations |

Put the directions before the owner as options, the recommended one first with the reason. The owner's choice is a gate: nothing is built before it.

After the choice, the comparisons go before the owner as a table, part by part. An approved table is leave to write the storyboard. It is not leave to build.

## 8. The sample

Before the film is built, one part is built as a sample, and the owner sees it.

| Choose the part that | Because |
|---|---|
| The owner knows best | They can judge it at a glance. Their own comparison is the natural choice |
| Has the widest range of pictures | It tests most of the kit |
| Is not the first of the film | The first part carries the title's hand-over, which is a task of its own |

The sample settles the look, the density of events, the size of type, and the strength of the transitions. It also shows what the builders can do, which changes what may be asked of them.

## 9. When a shot is weak

Before sending a shot back for craft, ask whether the fault is in the idea.

| Question | If the answer is no |
|---|---|
| Is there one event per beat, and not more? | Remove events |
| Does the eye know where to go? | One thing carries the signal colour; the rest recedes |
| Has the first frame weight? | Open on the subject |
| Could it be called by a neighbour's name? | The content is wrong. Craft will not help |
| Does it answer what the music does here? | Move the event to the beat that asks for it |
| Is the frame used? | Lay it out for this frame, not for another |
| Would the owner recognise what they approved? | Something was lost in a rework. Bring it back |
| Is there something that could be removed? | Remove it |

## 10. In the HyperFrames route

Its entry skill runs a pitch round for requests that are not yet formed: five concepts on five different paths, at least two of them deliberately unlikely. Its creative skill has guidance on the spine of a story, on narration and on the direction of beats. When a film goes that way, use its pitch round in place of section 7, and keep sections 1 to 4 of this file: they are about the subject, not about the tool.

## 11. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Three directions that are one direction in three colours | They differ in detail | Make them differ along an axis |
| The comparison explains the surface and not the idea | It was chosen for how it looks | State the structure in bare words first |
| Two parts are confused | They share a world, a prop or an example | One world per part; check the table of boundaries |
| Every part feels the same | One template | Change length, order, point of view, place of the name |
| The owner stops the work | Building began after the table, before the storyboard | Table, storyboard, animatic, sample, then the rest |
| A shot is polished twice and still wrong | The fault was in the content | Content is checked before craft |
| The film is about the subject and not for the viewer | The first two questions were skipped | Answer them in writing |
| The idea is the first one anybody would have | The list stopped at three | Ten, then choose |
| A launch film shows a dashboard the product does not have | The interface was imagined, not captured | Section 2: gather the real screens first |
| A figure on screen cannot be traced | It came from memory or from a summary | The record of sources, section 2 |
| The film copies the reference image instead of its manner | Its subject and layout were taken, not its rules | Section 5: read the image into palette, light, line, type and composition |
