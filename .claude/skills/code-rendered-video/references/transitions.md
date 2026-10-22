# Transitions

A catalogue of the ways one shot can lead into the next, with the feeling each gives, the moment it suits and what it costs to build. It also gives the rules for spending transitions across a film, so that the few strong ones land where the music is strongest.

Load this when: writing the `in` of shots in the storyboard, planning the cut into a drop, briefing a builder whose shot takes part in a transition, or adding a new kind to the engine.

## 1. The model

| Rule | Meaning |
|---|---|
| A transition belongs to the shot it leads INTO | The shot list records it on the incoming shot. The first shot of a film has none |
| It has a lead and a tail, measured in beats | The lead is taken from the end of the outgoing shot, the tail from the start of the incoming one. A plain cut has neither |
| The cut itself stays on the beat | Lead and tail grow outwards from the cut. They never move it |
| Two families | **Screen-space**: the engine works on the two finished pictures and the shots know nothing of it. **In-world**: the change happens inside the world of the shots, and their builder takes part |
| Time can be bent | Because every shot is a pure function of time, the engine may ask a shot for any time it likes: hold a frame, replay a slice, run backwards |
| Most cuts are plain | Fast cutting is already the rhythm of the film. A transition is an accent, and an accent on every cut is no accent |

What the builder of a shot must know about its neighbours:

| If | Then |
|---|---|
| The next shot has a transition with a lead | The last `lead` beats of this shot are played under it and may be distorted. What matters must be over before |
| This shot has a transition with a tail | Its first `tail` beats arrive under a flash, a wave or a wipe. The first frame still needs weight, and no word that must be read belongs there |
| The transition bends time | The outgoing shot's last beats are not shown as they were made |

## 2. A cut into a drop has three parts

A drop is where the music hits hardest after a build. A plain cut there wastes it: the music lands and the picture does nothing.

| Part | When | What happens |
|---|---|---|
| Build | The last 2 beats before the drop | Tension rises along an accelerating curve. The frame is pushed in at every half beat |
| Breath | The last quarter of a beat | Almost everything is taken away: one dot, one line, or white. The time of the outgoing shot is held |
| Impact | The first 1.5 beats of the drop | Two frames in negative, then a flash, a shock wave and a hard jolt that dies away |

The breath is what makes the impact. Silence before the hit is louder than the hit.

## 3. Choosing

Work through these in order.

1. **Is this cut on a strong moment of the music?** A drop, the burst after a silence, the first bar of a new phrase, the end of the film. If not, use a plain or accented cut.
2. **Are the two pictures related in space?** One holds the other (a screen, a card, a window), or they are two places of one world, or they share a shape. If so, an in-world transition is possible. Spend it only if the moment deserves it.
3. **What does the cut mean?** Next item of a list, going back in time, going deeper, stepping back for the whole, failure, waking up. Pick the kind whose picture says that.
4. **What did the last cut do?** Never the same kind twice in a row, except a plain cut. Never the same kind on two section boundaries in a row.
5. **Can the words survive it?** If a caption is on screen during the lead or the tail, pick a kind that leaves the frame readable, or move the caption.

### By moment

| Moment | First choice | Also good | Avoid |
|---|---|---|---|
| Inside a section, on a drop phrase | Hard cut, punch, flash, invert, whip | Slices, spin | Long wipes and dissolves |
| Inside a section, calm passage | Hard cut, push, match | Crossfade | Glitch, shake |
| Boundary between two sections | The film's own motif wipe, tiles, push, screen off and on | Iris, cover | The kind used at the previous boundary |
| Into a drop | One of the drop kinds (section 5.7) | Shatter on the drop | A plain cut |
| The burst after a silence | Breath | Blackout then lights on | Anything with a long build: there is no music to carry it |
| Into a break, where the drums stop | Flash, push, plain cut | Dip to colour | Distortion: the break is where words are read |
| Title into the first shot | Through, zoom into a detail, match | Iris | A plain cut: the title deserves a hand-over |
| Into the recap | Step zoom, a run of punch cuts | Tiles | Slow blends |
| Into the end card | Plain cut, flash, dip to black | | Anything that bends the last words |
| Telling it again without the idea | Rewind, reverse | Invert | |
| From the metaphor to the real use | Match, zoom into a detail | Push | |
| A failure, an error | Glitch, shake cut, gravity drop | Invert | Elegant blends |

### By energy and mood

| Energy of the music | Length of a transition | Kinds |
|---|---|---|
| Calm (pads, no drums) | 1 to 2 beats, or 1 to 2 seconds | Crossfade, blur dissolve, dip, slow push, iris |
| Medium (steady groove) | Half a beat to 1 beat | Push, tiles, slices, wipe, whip |
| High (drop, fast cutting) | A quarter to three quarters of a beat | Hard cut, punch, flash, invert, whip, spin, step zoom |

| Mood wanted | Kinds |
|---|---|
| Playful | Spin, squeeze, gravity drop, tiles, object wipe |
| Technical, precise | Slices, push, linear wipe, match, zoom into a detail |
| Nostalgic, analogue | Film burn, screen off and on, rewind, iris, page turn |
| Tense | Strobe cut, stutter, glitch, freeze cut |
| Premium, quiet | Blur dissolve, dip, match, slow pull back |
| Hand-made | Ink bleed, fold, page turn, cover with cut paper |

### When there is no music grid

A film led by a voice has no beats. Give lengths in seconds, put cuts at the ends of sentences or on the stressed word, and prefer cuts that are not noticed (match, cut on action, push). The drop kinds have no place there.

## 4. Spending them

| Rule | Reason |
|---|---|
| Plain and accented cuts are the majority | They keep the pace and cost nothing |
| One drop kind per drop, and a different one each time | A drop is a rare event; repeating its picture makes it common |
| In-world transitions: a few per film, at the moments that matter | They are the strongest pictures and the most expensive. On every cut they would press the life out of the shots |
| No kind twice in a row, except the plain cut | The viewer must not learn the pattern |
| The lead of a transition must not run into the tail of the one before | A shot needs some beats that are its own |
| The tail must be shorter than the shot | Or the shot never appears undisturbed |

From practice: a film of 172 seconds with 53 cuts used 22 kinds. The counts were: whip 7, push 7, punch 6, invert 4, plain cut 4, motif wipe 3, flash 3, zoom into a detail 2, pull out of a detail 2, tiles 2, slices 2, and one each of through, shatter, spin, screen off, rewind, step zoom and the five drop kinds. Six cuts were in-world. The owner's first reaction to a gentler first draft was that the cuts were "too gentle and not tight"; the second reaction, after every cut had been turned into a showpiece on paper, was that in-world transitions should be "an addition, a few at the important moments, not every cut".

## 5. The catalogue

Columns: **Beats** is lead plus tail. **Engine** names the kind in the starter (`src/engine/transition.ts`, list `TRANSITION_KINDS`) or says "not built". **HyperFrames** names the nearest item of that framework, from its animation skill and its registry.

### 5.1 Plain and accented cuts

These need nothing from the shots. The accent is a moment of post effect on the incoming shot.

| Kind | The viewer sees | Feel and use | Beats | Engine | HyperFrames |
|---|---|---|---|---|---|
| Hard cut | One picture replaced by the next, on the beat | Neutral and fast. The default inside a section | 0 | `cut` | default |
| Punch cut | The new shot arrives one step closer and settles back | A nod on the kick. Inside a drop phrase | 0 + 0.75 | `punch` | none |
| Flash cut | A burst of light that dies in under half a beat | A camera flash, a reveal. On a snare, on the arrival of a name | 0 + 0.75 | `flash` | `flash-through-white`, Color Dip |
| Invert cut | The first two frames in negative, with a jolt | A shock, an X-ray. From a dark ground to a light one; the same thing in a new state | 0 + 0.75 | `invert` | none |
| Shake cut | The frame jolts and comes to rest | A blow. When something in the shot hits something | 0 + 0.5 | part of other kinds | none |
| Smash cut | From loud and crowded to silent and still, or the reverse | Contrast, a joke. Into a break | 0 | a plain cut placed on the music | none |
| Jump cut | The same framing, time has skipped | Impatience, repetition, comedy. Waiting, trying again | 0 | inside one shot | none |
| Match cut | The last picture and the first share a shape in the same place | Wit: two things are one idea. Metaphor to real use | 0 | `match` | named, "no automatic matching-frame discovery" |
| Cut on action | A movement begun in one shot ends in the next | Flow. Throw and catch, press and result | 0 | inside the shots | none |
| Strobe cut | The two pictures alternate for a beat or two before the new one holds | Tension, a club. The last beats of a build | 1 to 2 + 0 | not built | none |
| Freeze cut | The outgoing shot stops on its last frame for a moment, then the cut | A held breath before a punchline | 0.25 to 0.5 + 0 | the breath of the drop kinds | not supported mid-source |

### 5.2 Wipes, masks and covers

Screen-space. The engine needs both pictures at once.

| Kind | The viewer sees | Feel and use | Beats | Engine | HyperFrames |
|---|---|---|---|---|---|
| Push | The new shot pushes the old one out, a dark seam between them | A page turned, the next item. Between peers of a list | 0.25 + 0.25 | `push`, with a direction | Push Slide, Vertical Push |
| Linear wipe | A straight edge sweeps across in the direction of travel, the new shot behind it, a hairline on the edge | Tidy, editorial. A result revealed | 0.5 | `wipe`, with a direction | clip-path reveal |
| Motif wipe | A shape that belongs to the film (its cursor, its mark) sweeps across with the new shot behind it | The film's signature. Section boundaries | 0.5 to 1 | `caret` | none |
| Iris | A circle opens from a point until it clears the frame, the new shot inside it | A spotlight, a circle out of a button into the next scene. The start or the end, a reveal from one point | 0.5 to 1 | `iris`, at the focus | Circle Iris, Diamond Iris, `sdf-iris` |
| Aperture | Six metal blades turn in and close over the shot to a point; they open again on the new one | A camera, a shutter, a hard stop and start. A click that changes the scene | 0.5 + 0.5 | `aperture`, at the focus | none |
| Clock wipe | A hand sweeps round the frame | Time passing | 1 | not built | Clock Wipe |
| Slices | The frame is cut into strips that slide apart, alternating | Mechanical, a shutter. Energy inside a technical section | 0.25 + 0.25 | `slices`, seven strips | Horizontal Blinds, Vertical Blinds, Shutter |
| Tiles | The frame is a wall of tiles that flip, starting from one corner | A board, a mosaic. Section boundaries, data | 0.25 + 0.5 | `tiles` | Grid Dissolve |
| Split | The frame parts in two halves | An opening, a comparison | 0.5 | not built | Diagonal Split |
| Shape mask | The new shot is seen through a growing shape: a letter, a logo | Branding | 1 | `through` does this with letters | Morph Circle |
| Cover | Three flat panels of colour sweep in one behind the other and cover the frame at the cut, then sweep on out, the last in the first out, leaving the new shot | Bold, graphic. Poster looks, section titles, big stats | 0.5 + 0.5 to 1 + 1 | `cover`, with a direction and a colour | Staggered Color Blocks |
| Ink bleed | The new shot spreads like ink through paper | Organic, hand-made. Paper and paint looks | 1 to 2 | not built | `domain-warp-dissolve`, `ridged-burn`, Page Burn |
| Mosaic | The picture breaks into large pixels and resolves into the new shot | Digital, a retro game | 0.5 to 1 | not built as a kind; the shots on both sides can ramp `mosaic` of the post chain up to the cut and down after it | `grid-pixelate-wipe` |
| Fold | The frame is a paper map of 3 by 3 panels: the corners fold onto the sides, the sides onto the middle, the packet turns over at the cut, and the new shot unfolds, the middle first, then the sides, then the corners | Paper, maps, plans, a layout that reflows | 1.5 + 1.5 | `fold` | none |
| Page turn | The old shot folds away like a sheet | Print, a book | 1 | not built | 3D Card Flip |

A wipe that is too tidy reads as a row of piano keys or a slide show. From practice: tiles needed gaps between them and alternating axes of rotation before they read as a wall.

### 5.3 Blends and light

| Kind | The viewer sees | Feel and use | Length | Engine | HyperFrames |
|---|---|---|---|---|---|
| Crossfade | One picture fades into the other | Calm, time passing. Slow films, voice-led films | 1 to 2 beats | the engine's default where two timeline entries overlap | Crossfade |
| Dip | Fade to black, white or a colour, then up again; mixed as the screen shows it, so the fade does not hang and then drop | A pause, a new chapter, the end | 0.5 + 0.5 | `dip`, with a colour (ink by default); a flash is a very fast dip to white | Color Dip |
| Blur dissolve | The old shot goes out of focus, the new one comes in | Soft, premium | 1 | not built | Blur Crossfade, Focus Pull, Blur Through |
| Film burn | Warm light floods the frame | Nostalgia, film stock | 1 | not built | Light Leak, Film Burn, Overexposure Burn |
| White-out | The picture brightens until nothing is left | Arrival, the final reveal | 1 | the breath of `tunnel` | none |
| Double exposure | Both pictures lie over each other for a while | Memory, two states compared | 2 or more | not built | none |

### 5.4 Moves

The frame behaves as if a camera had moved. Screen-space, but it reads as camera work.

| Kind | The viewer sees | Feel and use | Beats | Engine | HyperFrames |
|---|---|---|---|---|---|
| Whip pan | The old shot smears in one direction and the new one forms out of the smear | Speed, "meanwhile". Inside a drop phrase | 0.25 + 0.25 | `whip`, with a direction | `whip-pan`, Directional Blur |
| Spin | The frame turns about a point; the new shot arrives still turning | Dizzy, playful. A change of point of view | 0.5 | `spin`, with a focus | `swirl-vortex` |
| Crash zoom | A radial blur into a point; the new shot comes out of it | Urgency. On to a detail | 0.5 | partly in `stepzoom` and `tunnel` | `cinematic-zoom`, Zoom Through |
| Step zoom | Three hard steps in, on sixteenth notes, each splitting the colours and tilting; the new shot steps back out twice | Swagger, hip-hop. Into a recap or a list | 0.75 + 0.5 | `stepzoom` | none |
| Zoom through | The old shot grows until the new one is there | Direct | 0.5 | the stand-in for zoom into a detail | Zoom Through |
| Pull back | The old shot shrinks into the new one | Context, the whole | 0.5 to 1 | the stand-in for pull out | Zoom Out |
| Gravity drop | The old shot falls out of the frame | Weight, failure, comedy | 0.5 | not built | Gravity Drop |
| Squeeze | The new shot squeezes the old one flat | Cartoon | 0.5 | not built | Squeeze, Elastic Push |

### 5.5 Distortion and signal faults

| Kind | The viewer sees | Feel and use | Beats | Engine | HyperFrames |
|---|---|---|---|---|---|
| Screen off and on | The picture collapses to a line, then to a dot; the new shot switches on from that line | A television, the end of a thought. End of a section, screen looks | 0.5 + 0.5 | `crt` | none |
| Tape rewind | The picture is torn into bands, the colours part, the frame rolls | Going back. Telling it again without the idea | 1 + 0.5 | `rewind` | VHS Tape |
| Glitch | Bands tear sideways and split their colours, blocks jump, a few bands lose their picture to the signal colour; more and more of the bands show the new shot, changing every other frame | An error, stress | 0.25 + 0.25 to 0.5 + 0.5 | `glitch`; inside a shot, `glitch` of the post chain tears one picture | Glitch, `glitch`, Chromatic Aberration |
| Colour split hit | The three colours fly apart and snap back | A blow on the kick | 0.25 | in the post accents of several kinds | `chromatic-radial-split` |
| Ripple | Rings run out from a point and bend the picture | Water, a shock | 0.5 to 1 | the shock wave of the drop kinds | Ripple, `ripple-waves` |
| Column stretch | Columns of pixels are pulled into streaks | Data coming apart | 1 to 2 | `stretch` | Pixel Sort |
| Heat, lens | The picture swims or bends round a point | A dream, gravity | 1 | not built as a kind; a shot can ramp `bulge` or `fisheye` of the post chain | `thermal-distortion`, `gravitational-lens` |

### 5.6 Time

Possible only because a shot can be asked for any time.

| Kind | The viewer sees | Feel and use | Beats | Engine | HyperFrames |
|---|---|---|---|---|---|
| Stutter | The outgoing shot repeats its own first moments in shorter and shorter slices | A record chopped by a DJ. Into a drop | 2 + 0 | `stutter` | none |
| Hold | The last frame stands still | A breath | 0.25 | the breath | limited |
| Speed ramp | The old shot speeds up into the cut, the new one slows down out of it | Momentum | 1 + 1 | not built as a kind; a shot can do it with its own clock | the `rate` lane |
| Reverse | The old shot runs backwards | Undo | 1 | not built | none |
| Loop | The old shot repeats one bar until the cue | Waiting | bars | not built | none |

Trails and echoes need the frames that came before. A shot that is a pure function of time has none, so an echo is drawn by rendering the earlier times again, which multiplies the cost. Use it for a moment, not for a passage.

### 5.7 Into a drop

All follow the three parts of section 2, with a lead of 2 beats and a tail of 1.5.

| Kind | Build | Breath | Impact | Suits | Engine |
|---|---|---|---|---|---|
| Implode | The picture swirls and is sucked to a point | One dot in the film's signal colour | A ring of that colour runs out from the dot | The first drop; the arrival of the one thing | `implode` |
| Stutter squeeze | The shot repeats in shorter slices while the frame closes to a slit | One bright line | The slit snaps open | A drop after a text-heavy build | `stutter` |
| Tunnel | The frame holds smaller copies of itself, nested, and the camera rushes in | White | A shock wave | A drop after endless growth or repetition | `tunnel` |
| Breath | The picture loses its colour, darkens, closes round a point | Dark | Three rings, one after another | The burst after bars of silence | `breath` |
| Stretch | Columns are pulled up into streaks, the frame inverts with the drum roll | Streaks held | The streaks fall, two waves | The last drop | `stretch` |
| Collapse to a line | The frame is pressed flat from above and below | One line | The line opens as the new shot | Not built | |
| Countdown | Numbers on the last beats, larger each time | The last number held | A flash | Not built. Playful films | |
| Blackout | Lights go out one by one | Dark, silent | All lights at once | Not built | |

### 5.8 In-world

The strongest and the dearest. The builder of at least one of the two shots takes part, and the storyboard carries a note that says what is asked.

| Kind | The viewer sees | What the builders do | Engine |
|---|---|---|---|
| Through | A large letter, a door, a window or a keyhole stands before the camera. The camera goes through its opening, and beyond it is the next shot | The outgoing shot may show the same letter and hand it over at the size and place at which the engine takes it up. The letter must not shrink before it is thrown | `through` (letters; the largest hole is found by flood fill) |
| Zoom into a detail | The next shot lies inside a detail of this one: a screen, a card, a box on a form. The camera dives in until the detail is the whole frame | The OUTGOING shot shows the first frame of the next shot on that detail and drives its camera into it, so that at the end the detail fills the frame exactly | `zoom-in` |
| Pull out of a detail | The shot before turns out to be one detail of this one. The camera comes back and the larger world appears | The INCOMING shot starts with the last frame of the shot before filling the frame, pinned to the detail, and pulls back | `pull-out` |
| Travel | Two shots are two places of one world. The camera goes from one to the other without a cut | One world is drawn, and the camera of the first shot ends exactly where the camera of the second begins | `travel` (the engine does nothing at the cut) |
| Match | The last picture and the first share a shape in the same place | The two are lined up to the pixel | `match` |
| Shatter | Something in the shot comes straight at the viewer. Where it hits, the frame breaks into pieces that fall, and behind them is the next shot | The object must be large in the last frames and reach the lens on the cut, at the focus point. If nothing is seen to hit the glass, the break has no cause | `shatter` |
| Object wipe | Something crosses close to the lens and carries the next shot in behind it | The object is timed to cover the frame on the cut | not built |
| Hand-off | A thing thrown out of one shot lands in the next | The two builders agree on the point, the speed and the beat | not built |
| Flood | The liquid, the ink or the colour of the scene fills the frame, and the ground of the next shot is that colour | The outgoing shot floods; the incoming shot starts on that flat colour. The engine's `flood` does it without the shots: a colour swells from the focus past every corner and, after the cut, shrinks back into the focus and leaves the next shot | `flood`, at the focus, with a colour; in-world by the shots |
| Fold | The world folds up like paper, and unfolds as the next | Both shots are drawn on sheets. The engine's `fold` folds the finished pictures as a map of 3 by 3 panels | `fold` for the screen-space version; in-world by the shots |
| Break out of the frame | A thing held in a rectangle (a poster in its frame, a feature on a phone's screen) leaves it: it crosses the edge and comes into the world in front, and the frame it left is now part of the next picture | The shot draws the frame, the content clipped to it, and the thing that escapes after the clip, unclipped, in front (see below) | not an engine kind: the shot does it, and a plain cut, a `push` or a `zoom-in` follows |
| Lights | The lights go out in one place and come on in another | The outgoing shot darkens from its own lamps; the incoming one lights from its own | not built |
| Scale journey | One unbroken zoom across scales: the pixel becomes a city | Every stage is drawn to be read both as a whole and as a part. The shots share one curve of the zoom and meet with `travel`: see `camera.md`, section 3.7 | `travel`, with `scaleCam` in the shots |
| Turning solid | The frame is one face of a cube or a prism that turns to show the next face | Each shot is drawn flat on its face | not built |
| Morph | The subject of one shot changes shape into the subject of the next | Both shapes are built from the same number of points | not built |
| Hidden cut | Something passes close to the lens and blacks the frame for a moment | The cut is made in the dark | not built |

While either of the two shots is still a storyboard card, the engine plays a stand-in: a plain zoom for the two that use a detail, a whip for travel, a punch for match. It works and it is dull beside the real thing. Do not judge an in-world transition on its stand-in.

An in-world transition follows from the pictures. If the storyboard has two shots where one plainly contains the other, offer it. If it has not, do not bend the shots until it has.

#### Breaking out of the frame

A picture of a frame with its content, where one thing refuses to stay inside. It is drawn in three layers, in this order, each a function of the time:

| Layer | Drawn | Note |
|---|---|---|
| The frame and what stays in it | The frame (a poster's mat, a phone from `phone`, a window from `browserWindow`), then its content after `clipTo(c, screen)` | The content may keep moving inside |
| The shadow of the escaping thing | On the frame and on the ground behind it, offset away from the light, softer the further the thing has come out | Without a shadow the thing seems pasted on; the shadow says it has left the plane |
| The escaping thing, unclipped | In front of everything, growing a little as it comes towards the camera, crossing the edge of the frame on a beat | The part still inside the frame is drawn clipped until it crosses, then the whole |

Two faults: the thing crosses the edge in one frame (it must be seen to cross, over a beat or two), and nothing in the frame reacts (the content behind can dim, or the frame can flex, as the thing leaves). After the break the shot can pull back, or cut with a `push` to the world the thing entered.

### 5.9 Sound that goes with a cut

In a film cut to one finished track, the sound is already there and the cut is placed on it. Where sound effects can be added, these pair with the pictures above.

| Sound | Goes with |
|---|---|
| Riser, reverse cymbal | The build of a drop kind, a crash zoom |
| Impact, low boom | The impact of a drop kind, shatter, gravity drop |
| Whoosh | Whip, push, object wipe |
| Click, tick | Hard cuts in a list, tiles |
| Silence | The breath. The most useful sound of all |

## 6. Parameters

| Field | Unit | Meaning |
|---|---|---|
| `kind` | name | One of the kinds the film declares |
| `lead` | beats | Taken from the end of the outgoing shot |
| `tail` | beats | Taken from the start of the incoming shot |
| `focus` | pixels of the master frame, y down; carried over to another format in proportion | The point the transition turns on: the centre of an iris, the point of impact, the hole of a letter. Default: the middle of the stage |
| `dir` | unit vector in the frame | The direction of travel for push, whip, slices, spin, wipe, cover |
| `colour` | palette key | For `dip`, `cover` and `flood`: the colour that fills the frame. Default: `ink` for a dip, `signal` for the others. `cover` draws three panels: a light tint of the colour, the colour, and the colour set against the ground (light before a dark shot, dark before a light one) |
| `text` | string | For `through`: the letters that stand in the way |
| `size` | pixels | For `through`: the size of the letters when they first stand in the way |
| `note` | sentence | For in-world kinds: what is asked of the builders |

The colour of whatever the engine draws itself (letters, slabs, seams) is set against the ground of the shot it stands before: light before a dark shot, dark before a light one.

### The kinds added after the reference films

`iris`, `aperture`, `dip`, `wipe`, `cover`, `flood`, `fold` and `glitch` were built after the two reference films and have been seen only in stills of a test film, never in a finished one. A film uses a kind once its `shots.json` names it in the `transitions` dictionary (the generator refuses an `in` whose kind is missing there). The entries, to copy into that dictionary:

```json
"iris": {"label": "Iris", "what": "The new shot is seen through a circle that opens from the focus until it clears the frame."},
"aperture": {"label": "Aperture", "what": "Six blades close over the old shot to a point, and open again on the new one."},
"dip": {"label": "Dip to a colour", "what": "The old shot fades to a flat colour and the new one rises out of it."},
"wipe": {"label": "Linear wipe", "what": "A straight edge sweeps across in the direction of travel; behind it is the new shot."},
"cover": {"label": "Colour panels", "what": "Three flat panels of colour sweep in and cover the frame, then sweep on out and leave the new shot."},
"flood": {"label": "Flood", "what": "A colour swells from a point past every corner; after the cut it shrinks back into the point and leaves the new shot."},
"fold": {"label": "Folded map", "what": "The old shot folds up like a paper map, the packet turns over, and the new shot unfolds: the middle, the sides, the corners."},
"glitch": {"label": "Glitch", "what": "The frame breaks into bands that tear sideways and split their colours, showing more of the new shot as it goes."}
```

| Kind | Lead and tail that worked in the stills | Note |
|---|---|---|
| `iris` | 0.5 + 1 | Needs both pictures. A thin line in the colour set against the ground rides the edge |
| `aperture` | 1 + 1 | Shows one picture at a time; the blades are closed at the cut. A small jolt when they open |
| `dip` | 1 + 1 | The frame is the flat colour at the cut |
| `wipe` | 0.5 + 0.5 | `dir` [1, 0] sweeps from the left; any direction works |
| `cover` | 1 + 1 | The frame is fully covered at the cut |
| `flood` | 0.625 + 1 at 120 beats a minute | The lead is about 0.3 seconds: slower reads as a slow fade, faster changes half the screen in one frame. The circle overscales past the farthest corner by an eighth, so no corner is left uncovered at the cut |
| `fold` | 1.5 + 1.5 | The corners fold in the first two fifths of the lead, the sides in the next two fifths, the packet turns in the last fifth; after the cut the same in reverse. Needs a tail long enough for three steps |
| `glitch` | 0.5 + 0.5 | Strongest at the cut; adds colour fringing and a small shake to the post settings |

## 7. Adding a kind to the engine

1. Write down what the viewer sees in the build, at the cut and after it, in one sentence each.
2. Decide what it needs: one picture or both, a focus, a direction, a mask.
3. Add it to the list of kinds and to the dictionary in the shot list, with a label and a description the owner can read.
4. Write the shader branch or the mask drawing. Keep the state a pure function of the position within the lead and the tail.
5. Add its moment of post effect: push, flash, shake, colour split, negative frames.
6. Decide the stand-in that plays while a shot is still a card.
7. Look at it between two storyboard cards first, then between two real shots. A transition tuned on cards is usually too weak or too strong on real pictures.
8. Look at it frame by frame across the cut. The frame before the cut and the frame after it are where faults hide.

## 8. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The music drops and the picture only changes | The drop has a plain cut | Give it a drop kind with build, breath and impact |
| Every cut looks like a preset of an editing program | Only screen-space kinds were used | Add a few in-world transitions at the moments that matter |
| The transitions crowd the shots | In-world kinds on most cuts | Keep them to a handful; most cuts plain |
| Cuts feel soft and loose | Long blends on a fast track | Shorten to half a beat or less; use accented cuts |
| A caption cannot be read at the start of a shot | It begins under the tail of a transition | Start the caption after the tail |
| The end of a shot is lost | The builder did not know about the lead of the next transition | Put lead and tail into the brief of every builder |
| The letter of a `through` shrinks before it flies | The outgoing shot's letter was larger than the size the engine starts from | Set `size` and `focus` in the shot list and let the shot read where the engine's letter first stands |
| A hole of a letter is not found | The face builds the letter from contours that overlap | Find the hole on a small drawing by flood fill, not from the contours |
| The break of a shatter has no cause | Nothing was seen to reach the lens | Make the object large in the last frames and let it arrive on the cut |
| Two pictures do not join in a zoom into a detail | The outgoing camera does not end on the rectangle of the detail | Frame the rectangle exactly at the end of the lead; blend the camera evenly in scale |
| A still made at the cut shows a red frame | The neighbour was not loaded for the capture | Load both shots when checking a cut |
| A flood reads as a slow fade, or half the frame changes at once | Its lead is far from 0.3 seconds | Set the lead so that it lasts about 0.3 seconds at the film's tempo |
| An in-world "flood" and the engine's `flood` fight | Both were asked for | One or the other: the shot floods and the cut is plain, or the engine floods over shots that know nothing of it |
| A thing breaking out of its frame looks pasted on | No shadow, no reaction in the frame | Give it a shadow on the frame and let the frame answer |
