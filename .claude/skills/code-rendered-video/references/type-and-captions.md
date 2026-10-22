# Type and captions

How words reach the viewer of a film drawn by code: which words a film needs, how they are written, set, placed and timed, and when a picture is better left without them.

Load this when: writing the sentences of a film, deciding in the storyboard how each sentence is shown, choosing typefaces, briefing a builder on words inside a shot, judging whether a caption can be read, or setting a film in a language the starter's faces do not cover. How type moves (rising from a line, springs per letter, marquees, reels, odometers, bent outlines) is in `effects.md`, section 7.

## 1. Three ways for a sentence to reach the viewer

Every sentence of the film is given one of three ways, per sentence, and the storyboard records which and why.

| Way | What it is | Choose it when |
|---|---|---|
| Plate | The overlay sets the sentence on an opaque plate at the top, the middle or the bottom of the safe area | The picture needs a comment. The plate stands where the picture leaves room |
| Set by the shot | The sentence is a thing in the picture: printed on a receipt, hung as a sign, typed into a screen, written on the page that is being dragged | The shot has a surface that carries words by its nature |
| None | The picture says it | A viewer who does not know the subject would still get the idea, in the time the shot has, with the words covered |

The test for "none" is strict. Cover the words and show the shot to someone who does not know the subject. If they cannot say what it means, the sentence stays.

In a film without a voice, do not fix one place for all captions. A band of text at the foot of every shot is the first thing that makes a film look like a template. From practice: the owner asked for exactly this freedom, knowing that it asks the builders to reason, "to make the film richer in invention". A film of eight sections, with 24 sentences, ended with 17 plates (8 at the top, 8 at the bottom, 1 across the middle), 5 sentences set by their shots and 2 ideas without words.

A film led by a voice is different. Burned-in captions at the foot of the frame, following the words as they are spoken, are the normal choice for a voice-led explainer: most viewers watch with the sound off, and the words must be where the eye expects them, in the same place in every shot, so that the eye can leave them for the picture and come back. They are a fourth way, beside the three above, and they belong to the voice, not to the sentences of the storyboard: the plates, the words set by the shots and the pictures without words keep their places and their reasons, and keep off the foot while the voice speaks. The starter's overlay draws the voice's caption groups there (section 10).

While a shot is still a storyboard card, the studio shows every sentence as a plate, whatever its final way, so that the words can be read and timed in the animatic.

## 2. The words a film needs

| Words | Job | Voice | Where |
|---|---|---|---|
| Title | Says what the film is, in the first seconds | Display | The title shot |
| Counter | Says where we are: "03/08" | Machine | A corner of the safe area, the same in every shot |
| Name of the section | The thing the viewer should take home | Display | Lands once, large, at the moment of the idea; then sits small beside the counter |
| The problem | What goes wrong without the idea | Sentence | Early in the section |
| The idea in everyday terms | The comparison that explains | Sentence | With the idea at work |
| Where it is used | The viewer's own world | Sentence | The last shot of the section, where the music rests |
| Labels | Names of parts | Machine or sentence, small | Inside the picture, on leader lines or tags |
| Text of the world | What is printed or shown on the things in the picture | Whatever the thing would carry | Inside the picture |
| Recap | All names again | Display | Before the end |
| Closing sentence | What to do with all this | Display | The end card |

A name that is kept in its original language stays in that language everywhere. Everything else is in the language of the viewer.

### The name can wait

The name of a section need not come first. Before it is revealed, the counter shows a placeholder ("03/08 ???") and the viewer guesses. The name may land at the start, in the middle with the idea, or as the last word. Moving it is one of the ways to keep sections from feeling alike.

## 3. Writing the sentences

| Rule | Reason |
|---|---|
| One idea per sentence | It is read once, at speed |
| Things, not terms | "Order at the counter: say the name of the dish, the kitchen does the rest" is understood by anyone |
| Short enough for two or three lines | A plate deeper than three lines takes the frame from the picture |
| A colon can carry a sentence | First the situation, then the point: "One change must reach many places: add to the cart and the badge, the total and the stock all change" |
| The list of uses names what the viewer has seen | Things they build, not categories |
| No keyword of one section in the sentence of another | A word that belongs to a neighbour sends the viewer to the neighbour |
| No example shared by two sections | The same: see the content check in `quality-gates.md` |
| The owner approves every sentence | Approved wording is shown exactly as approved. A sentence changed later is reported to the owner as a change |

Every sentence lives in one file, already broken into lines. Nothing in the film carries a sentence of its own.

## 4. Breaking lines

| Rule | Example |
|---|---|
| Break by sense, not by width | "AI understands / what you mean", not "AI understands what / you mean" |
| Break after the colon | The situation on the first line, the point on the next |
| No single word alone on the last line | |
| Lines of similar length where sense allows | |
| The breaks are written into the copy file | A break chosen by a fitting routine follows the width and ignores the sense |

On a closing card, each row may be set as large as the width allows. The rows then differ in size, and the shortest row is the loudest. Put the word that matters on the shortest row.

## 5. Voices

Two or three typefaces, each with a job. More than three and the film has no voice.

| Voice | Job | Character |
|---|---|---|
| Display | Titles, names, numbers that are the subject | A face with character, in heavy weights |
| Sentence | Captions and labels | Plain, open, made for reading small |
| Machine | Counters, tags, read-outs, text of machines | Monospaced |

### Choosing faces

| Check | Why |
|---|---|
| Every character of the language, in every weight used | A missing accent falls back to another face, in the middle of a word. Test the longest, most accented sentence of the film |
| Accents stacked above capitals do not collide with the line above | Languages with stacked marks need more line height |
| Arrows, ticks, crosses, boxes | Most faces have none. Draw symbols as shapes |
| Figures of equal width | Counters that roll must not jitter |
| The licence allows the use | Open licences are the easy case |
| Static files of the weights used | A variable font may not render alike in every browser, and the starter cannot move its axes (below); static weights can be made from it |
| Loaded before the first frame | A shot drawn before its face has loaded is drawn in a fallback |

From practice: a film in Vietnamese with names in English used a display serif in two weights, a sans made for Vietnamese in four weights, and a monospaced face in two. A coarse dot-matrix face, drawn by the shot for tickets, broke the accents at small sizes; the names on those tickets were set in the sentence face instead.

The starter ships that set in `public/fonts/`, loaded by `src/engine/type.ts` and named by voice through `F.display`, `F.caption` and `F.machine`: Fraunces (display, 600 and 900), Be Vietnam Pro (sentence, 400, 500, 700 and 800) and JetBrains Mono (machine, 400 and 700). Check them against the language of a new film before keeping them.

### An accent in another voice

The launch look sets one word of a sans headline in a serif, often in the accent colour and in italic: "Every *platform*." `runs` of `src/scenes/parts/kit-type.ts` sets a line of several runs on one baseline, each with its own face, size and colour. The starter's faces have no italic: a run's `slant` leans it by drawing, which is an oblique, not an italic (an italic has letters of other shapes, a single-storey a, a flowing f). When the owner wants a true italic, add the italic files of the display face and a line for them in `src/engine/type.ts`, as its header says.

### Variable fonts

The starter ships static font files only, one per weight, and that is on purpose: opentype.js, which gives the outlines that shots bend and mask with, reads static outlines, and Canvas2D, which sets the type, has no way to set a variable axis (there is no `font-variation-settings` for a canvas). A variable font loaded as it is shows its default instance.

A request to animate an axis (a wordmark squeezed on its width axis like an accordion, a weight that swells on the beat, a read-out "WGHT 879") can be met in three ways, none of them tried in the starter:

| Way | What it takes | What it gives |
|---|---|---|
| Static instances cut from the variable font | A tool that cuts instances, such as the instancer of fonttools, a Python package: install only with the owner's word. Five to nine instances along the axis, each loaded as a weight | Steps along the axis; a cross-fade between two neighbouring instances hides them in motion. Outlines for every step |
| The width faked by the drawing | Nothing new: each letter scaled sideways about its own centre while the letters close up by the same factor (`layout` gives each glyph's place) | A squeeze that reads in motion. The strokes thin with the letters, which a true width axis does not do; it shows in a still |
| The browser's own choice of instance | The variable file registered with a range of weights (and widths) in its `FontFace` descriptors; the canvas `font` given a numeric weight, and `fontStretch` a width keyword | Weight in fine steps in Chromium; width in nine keyword steps only. Safari's support of `fontStretch` on a canvas is not known. No outlines from opentype.js for the instance |

Say to the owner which of these the film will use before promising "a variable font".

## 6. Size and place

### The safe area

A film for phones is watched inside an app that lays its own buttons and text over the picture: at the top, at the bottom, and down one side. The picture may run to every edge. Whatever must be read stays inside the safe area.

| Frame | Safe area used in practice | Note |
|---|---|---|
| Vertical 1080 by 1920 | x from 72 to 1008, y from 200 to 1560 | The block for captions is narrower on the right, to x 944, where apps put their buttons. These are the starter's zones (`SAFE`, `CAPTION` in `src/scenes/parts/kit-frame.ts`) |
| Horizontal 1920 by 1080 | The inner 90 per cent for action, the inner 80 per cent for titles | The common broadcast boxes, also used by HyperFrames |

The areas that apps cover differ from app to app and change over time. Treat the numbers above as a start and ask the owner where the film will be shown.

### Minimum sizes

| Frame | Smallest type that must be read | Captions | Names |
|---|---|---|---|
| Vertical, short side 1080 | 28 px | 40 px and more | As large as the width allows |
| Horizontal 1920 by 1080, on a large screen | 20 px | 32 px and more | 60 px and more |
| Horizontal, watched in a feed on a phone | 32 px | 40 px and more | 90 px and more |

The minimum holds at the smallest zoom of the shot. A label of 28 px in a pose that shows the world at half size is a label of 14 px.

### Placing a plate

| Place | When |
|---|---|
| Top | The subject is in the lower two thirds: a belt, a row of screens, a form |
| Bottom | The subject is in the upper two thirds: a map, an object on a stage |
| Middle | The picture is chaos and the sentence cuts through it like a band |

| Rule | Reason |
|---|---|
| A plate is opaque | Blended in linear light, a nearly opaque dark plate over a bright ground turns grey |
| Nothing that matters lies under a plate | The builder is told the plate's place and its lower or upper edge, in pixels |
| The layout of the shot is the same before the plate arrives | Nothing jumps when it does |
| A plate of three lines is deeper | Tell the builder how deep |
| The plate does not move with the camera | It belongs to the overlay |

## 7. Time to read

| Rule of thumb | |
|---|---|
| Reading speed | About three words a second for a viewer who reads the language well. Fewer for beginners in the subject, who stop at new words |
| Landing | The first half beat after a plate arrives is lost: the eye is still on the picture |
| Rest | The sentence should stand for a beat after it could have been read |
| A sentence of ten words | Three and a half seconds at least: two bars at 130 beats a minute |

The animatic decides. Play the storyboard cards with the music and read every sentence at speed. If the owner cannot read it, it is too long or too short-lived.

### Against the cut

| Rule | Reason |
|---|---|
| A caption starts after the tail of the transition into its shot | Under a flash or a shock wave nothing is read |
| A caption ends before the lead of the next transition, where that one distorts | The same |
| A caption may start on a fraction of a bar | The plate waits a beat while the hand-over from the shot before is still on screen |
| The words that must be read belong where the drums stop | A break in the music is a break for the eye |

From practice: a name that landed at the foot of one shot was still on screen during the first beat of the next, under an in-world transition, exactly where the next caption's plate appeared. The caption was moved a quarter of a bar later.

## 8. Words inside the picture

| Rule | Reason |
|---|---|
| The text of the world is true to the world | A receipt carries an order number, a quantity, a price. A plan carries a scale and a sheet number. These small texts make the idiom |
| Small texts may be too small to read | They are texture. Whatever must be read keeps the minimum size |
| Labels stay flat | Text on a tilted plane is hard to read |
| A label takes the colour of what it names, or sits on a tab of that colour | The eye joins them |
| Text on a coloured tab is ink or paper, whichever is further from the colour | Contrast is a matter of lightness |
| Type never glows | Glow eats the counters of letters. Type is kept under the threshold of the bloom |
| A sentence set by the shot comes from the copy file like any other | One source |

## 9. Languages

| Matter | Rule |
|---|---|
| Accents and marks | Intact at every size and in every face. Words with broken accents read as mistakes |
| Mixed languages | Names in the original language, the rest in the viewer's. Both faces must sit together |
| Figures | Grouping and decimal marks as the viewer writes them |
| Length | The same sentence is longer in some languages. Plates are sized for the language of the film, not for the language of the draft |
| Quotes of the owner in documents | In the owner's language, with a translation |

### Chinese, Japanese and Korean

The starter's three faces hold Latin with the full Vietnamese set of accents, and no Chinese, Japanese or Korean characters. Set in them, such text does not fail loudly: the browser draws each missing character in a face of the system, which differs between Windows and macOS (a still on one machine is not the picture on the other), and every part of the kit that works from outlines (`textPath2D`, `bentText`, the letters of the transition `through`) finds no glyph at all. A film in one of these languages needs:

| Need | What to do |
|---|---|
| A face that holds the language | A CJK family under an open licence, such as Noto Sans CJK or Noto Serif CJK (or Source Han Sans, the same design), in the regional version of the film's language: Japanese, Simplified Chinese, Traditional Chinese and Korean draw some of the same characters differently. Static files per weight in `public/fonts/`, with the licence, and their lines in `src/engine/type.ts` |
| A file that loads | A full weight is several megabytes, and a few weights make the page slow to open and slow to parse for outlines. Subsetting the face to the characters the film uses makes it small; the usual tool is fonttools, a Python package, installed only with the owner's word. Without it, keep to one or two weights |
| Lines broken by hand | The language has no spaces, so `wrap` of the kit, which breaks at spaces, cannot break it. The lines are written into the copy file, as every line is (section 4), and they follow the rules of the language: in Japanese no line starts with 、。」』）ー or a small kana, and none ends with 「『（ |
| Larger sizes | The characters are dense; the smallest type that must be read is larger than for Latin. Start from 32 px for labels and 44 px for captions on a 1080-pixel short side, and check them on a phone |
| Latin inside the line | Latin words and figures in the film's Latin face, set with `runs` on the same baseline |
| Checked characters | Every character of every sentence in every weight, as for accents (section 5). A character missing from the subset falls back silently |

### Setting vertically

Japanese and Chinese are also set in columns, read top to bottom and right to left; a single vertical column is also a decorative element in films in other languages. Canvas2D has no vertical writing mode, so a vertical line is set character by character, one per square cell, down the column:

| Character | In a column |
|---|---|
| Han characters and kana | Upright, centred in the cell |
| 、 and 。 | In the upper right of the cell |
| Small kana (ゃ ゅ ょ っ) | Upright, a little up and to the right |
| The long vowel mark ー, dashes, the wave dash | Turned a quarter turn |
| Brackets 「 」 『 』 （ ） | Turned a quarter turn, or replaced by their vertical forms (﹁ ﹂ ﹃ ﹄ ︵ ︶) when the face has them |
| Latin words and figures | Turned a quarter turn clockwise as a run; two figures may stand side by side in one cell |

Faces carry vertical forms of their own for many of these, reached through a feature of the font that neither Canvas2D nor the starter switches on. None of this has been tried in the starter: take a still of every column and compare it with a printed example of the language.

## 10. When a voice speaks

This method's first film and second film had no voice. When a film is led by a voice, the rules change:

| Matter | With a voice |
|---|---|
| What leads | Each phrase of the voice is placed on a beat, and the words inside it keep the times the voice gave them. Cuts stay on downbeats. The music is a bed and is turned down under the voice |
| Captions | Follow the words as they are spoken, in groups of two to six words depending on the energy. A group is on while it is spoken |
| Breaks | Written by sense in the text of the voice: `\|` ends a caption group, `/` breaks a line inside one. Without marks, groups end at punctuation, at pauses and at a length |
| Length of a script | About two and a half words a second: sixty seconds is about a hundred and fifty words |
| A sentence that must be read whole | A plate of its own, held in a pause of the voice |
| Tooling on the engine route | `sound-and-voice.md`: the voice as data in `data/voice.json`, a local voice step, word times, the mix, and the caption groups written to `data/lyrics.json`, which every scene reads as `ctx.lyrics` (`lineAt`, `wordProgress`). The starter's overlay (`src/scenes/overlay.ts`) draws them at the foot of the frame, over every shot, as `sound-and-voice.md`, section 11, describes |
| Where the captions stand | At the foot, the same place in every shot (section 1). A plate of the storyboard keeps off the foot while the voice speaks |
| Tooling on the HyperFrames route | Speech with word timings, transcription, caption components, the carving of the music under the voice. None of it was run on this machine |

Everything else in this chapter holds for voice captions: the safe area, the sizes, opaque plates, the place chosen per shot, type under the bloom threshold, and accents intact. A voice in the film's language is needed before its captions can be timed: none of the local Windows voices tried speak Vietnamese (`sound-and-voice.md`, section 9).

Caption styles the HyperFrames route brings, by name: `caption-highlight`, `caption-pill-karaoke`, `caption-editorial-emphasis`, `caption-glitch-rgb`, `caption-kinetic-slam`, `caption-neon-glow`, `caption-neon-accent`, `caption-clip-wipe`, `caption-gradient-fill`, `caption-matrix-decode`, `caption-emoji-pop`, `caption-parallax-layers`, `caption-particle-burst`, `caption-texture`, `caption-weight-shift`.

Its files do not state whether its bundled typefaces cover Vietnamese. Test before relying on them.

## 11. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Every shot has the same band of text at the foot, in a film without a voice | One place for all captions | Choose the way and the place per sentence |
| A voice-led film's captions jump about the frame | The captions of the voice were placed per shot | Burned-in at the foot, in the same place throughout (section 1) |
| Japanese, Chinese or Korean text looks different on another machine, or a bent word shows boxes | The starter's faces do not hold those characters; the system filled them in | A CJK face in the film's fonts (section 9) |
| A slanted word is taken for an italic and looks wrong beside a real one | `runs` slants by drawing | Add the italic files when a true italic is wanted (section 5) |
| A plate looks grey | It is nearly opaque over a bright ground | Opaque plates |
| The plate covers the subject | The builder did not know where the plate stands | Give place and edge in the brief; lay the shot out for it from its first frame |
| A sentence cannot be read in time | Too long for its bars, or it begins under a transition | Shorten, lengthen its stay, or start it after the tail |
| Accents are broken | A coarse or incomplete face | Another face for those words |
| A word falls back to another face | A character is missing in that weight | Test every weight with the most accented sentence |
| The closing sentence breaks in the wrong place | Broken by width | Break by sense, in the copy file |
| A name glows and loses its shape | It crossed the bloom threshold | Keep type under it |
| Small labels vanish in a wide pose | The minimum was checked at the close pose | Check at the smallest zoom |
| Two sections are confused | A keyword or an example of one appears in the other's sentence | Rewrite one; tell the owner |
| The owner finds a sentence changed | Approved wording was altered without saying so | Report every change of wording as a change |
| The title's second line is too small to read | It was set as a subtitle | In a vertical film, the second line is a line of the title |
