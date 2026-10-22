# Effects

A catalogue of what can happen inside a shot: how things move, how they arrive and leave, how they answer the music, and how the finished frame is treated. Each entry says what it is for, because an effect that is for nothing is noise.

Load this when: writing the `move` field of shots in the storyboard, briefing a builder, reviewing a shot that feels dead or crowded, or extending the shared kit or the post chain.

## 1. What an effect is for

An effect earns its place by doing one of four jobs.

| Job | Question it answers | Examples |
|---|---|---|
| It shows an event | What just happened? | A stamp slams, a link lands, a card is cut |
| It guides the eye | Where do I look? | A ring round the step in hand, a marker that moves, a pool of light |
| It gives material | What is this made of? | Grain on paper, hatching on a solid, glow on a lamp |
| It keeps time | Where is the beat? | A push on the kick, a jolt on the snare |

If it does none of these, cut it.

## 2. What the method demands of every effect

| Demand | Meaning |
|---|---|
| It is a function of time | Given the time of the frame it yields the same picture, whatever was drawn before |
| Its randomness is seeded | From a hash of fixed numbers: an index, a frame number, a seed. Never the system's random source |
| Its simulation is run once | Anything that needs history (pearls that pile up, a swarm, cloth) is simulated when the shot loads and looked up by time afterwards |
| Its particles are indexes | A particle is its number in a burst or a stream: where it is born, how fast it flies and how long it lives are drawn from a hash of that number, and where it is now is a closed form of its age. No list of particles is carried from frame to frame (section 8) |
| What steps is taken from the frame | A counter, a word that changes, the state of a switch: worked out from the time of the output frame, so that it is never printed as two values at once |
| What travels is taken from the moment | Objects, the camera, a line being drawn |
| Its smear is drawn | Played live there is no motion blur. A thing that moves fast is drawn as a streak by the shot itself, if it should streak (`withMotion`, section 7) |

## 3. How things move

### Principles

| Principle | In a film cut to music |
|---|---|
| Timing | Things arrive, hit and change on a beat or a division of one |
| Leave at once, settle slowly | The default ease. It reads as decided |
| Anticipation | A small move backwards before the move. A move that winds up hits harder |
| Overshoot and settle | A thing with weight passes its place and comes back. A spring, with its frequency and damping chosen per thing |
| Squash and stretch | A soft thing flattens when it lands and lengthens when it flies. Hard things do not |
| Follow-through | Parts that hang (a cable, a strap, a sheet) arrive after the body |
| Stagger | Many things arrive one after another, a fraction of a beat apart, never together unless "together" is the point |
| Arcs | Thrown things travel on curves |
| Secondary action | The small thing that answers the large one: dust at a landing, a shadow that gathers before a fall |
| Hold | Nothing moves. After a run of events, a hold is an event |
| Exaggeration | The swapped pair is the largest, brightest thing in the frame at the moment it swaps |
| Steps | Animating in steps of two or three frames gives a hand-made feel. The steps are taken from the frame number |

### Eases

| Ease | Feels like | Use |
|---|---|---|
| Linear | A machine, a drift | Belts, scrolls, slow camera drifts |
| Out, strong (exponential, quintic) | Decided | Almost every arrival and every camera move |
| In, strong | Falling, gathering speed | Things that leave; the build before a hit |
| In and out | Polite | Repositioning that should not be noticed |
| Back, out | A little overshoot | Small things that pop in |
| Elastic | Rubber | Rarely; toys |
| Spring | Weight | Landings, steps, things caught after a jump |
| Spring let go | A thing that was held and is released, keeping its speed | A drag let go, a loop seam, a hand-over between two shots |

In the starter, the eases are in `src/engine/util.ts` (`ease`, `springStep`, `settle`, `prog`, `keys`). `ease` holds the usual families, each with in, out and in-out: quad, cubic, quart, quint, sine, circ, expo and back, plus `outElastic` and `outBounce`. `settle(t, duration, from, to, v0, sharpness)` is a move with no overshoot that lands exactly on `to` at `duration` and stays there, every derivative zero; it can start with a speed `v0` taken over from a move before it (`settleVel` gives its speed). The springs below approach rest without ever reaching it, so a hold that must be truly still uses `settle`.

### Springs

| Function (`src/engine/util.ts`) | What it gives | Use |
|---|---|---|
| `springStep(t, freq, damping)` | 0 before 0, then 0 to 1 with an overshoot. It already moves at its start. The damping must stay below 1, or it returns NaN | Pops, landings, a value that changes target many times (the sum of one step per change, `short-pieces.md`, section 7) |
| `springRelease(t, x0, v0, freq, damping)` | The displacement from rest of a real damped spring let go at time 0 from `x0` with velocity `v0` (units per second); `x0` before 0. Any damping from 0 up: below 1 it overshoots, 1 settles fastest without overshoot, above 1 creeps back | A card dragged and let go springs back from where the finger left it, at the speed it had. A cursor or camera that must arrive at a loop seam with the speed it started with. The true step from rest is `1 + springRelease(t, -1, 0)` |
| `springReleaseVel(t, x0, v0, freq, damping)` | The velocity of the same spring, per second | The smear of the thing, the release speed of the next spring in a chain, a check that a seam matches |

A drag, as a function of time: while the drag is held, the thing follows the cursor; at the release time `tr`, read the position and the velocity of the cursor's own path (`springPath` of `src/scenes/parts/kit-devices.ts` returns both), and from then on the thing is `rest + springRelease(t - tr, x - rest, vx)`, per axis (`released` in the same file does both axes). Nothing is carried from frame to frame: every value at every time is worked out from the path and the release time.

For a character, the same principles are applied to the parts of a rig, with keyed poses, lag for follow-through, squash and stretch, and idle life: `characters-and-story.md` and `src/scenes/parts/kit-rig.ts`.

## 4. Keeping time

### Helpers

All take the beat of the shot's own clock, which starts at zero on the first frame of the shot. In the starter they are in `src/scenes/parts/kit-frame.ts`, except `punch` and `pushOnBeat`, which are in `kit-camera.ts`.

| Helper | Returns | Use |
|---|---|---|
| `hit(beats, at, halfLife)` | 0 before the beat, then 1 that halves every `halfLife` beats | The accent of one event: a flare, a swell |
| `over(beats, at, dur, ease)` | 0 to 1 over a number of beats | A move that begins on a beat |
| `during(beats, at, until)` | True between two beats | Showing a thing for a span |
| `steps(beats, at, every)` | How many whole steps have passed | Counters, lists that grow, cuts inside a shot |
| `groove(beats, every, offset, halfLife)` | An accent that repeats | The kick (`every` 1), the off-beat (`offset` 0.5), the back-beat (`every` 2, `offset` 1) |
| `since(audio, frame, beats)` | Seconds since a beat | The input of a spring, of a particle burst, of moving type |
| `punch`, `pushOnBeat` | A factor for the zoom | The camera's answer to a hit or to every kick |

### What the music does, and what the picture answers

| In the music | In the picture |
|---|---|
| Kick | A push of the frame, a pulse of a ring, a thing lands |
| Snare, clap | A flash, a jolt, a change of state |
| Hi-hat, sixteenth notes | Small repeating things: ticks, dots, ice cubes, teeth of a gear |
| Off-beat | The answer to what the beat did: the dish comes out after the ticket went in |
| Bass that swells under the kick | Things that breathe: scale, brightness |
| Build, drum roll | Acceleration: events at halves, then quarters, then eighths of a beat; tilt, crowding, a count that runs away |
| The last beat before a drop | Everything stops |
| Drop | The largest event of the section, on the first beat |
| Break, drums out | Stillness. Words |
| Silence | Waiting. A still frame, one small thing that repeats |
| Phrase of eight bars | One thought |

Events are placed by beats read from the measured grid. Never by seconds, never from a tempo number.

## 5. Arrivals and departures

| Arrival | Looks like | Suits |
|---|---|---|
| Land | Drops in from above, overshoots, settles; dust or a jolt | Objects with weight |
| Slam | Arrives at full size in one frame, with a flash and a shake | Names, stamps, verdicts |
| Pop | Scales up from nothing with a little overshoot | Small things, badges, tags |
| Slide | Comes in from an edge and eases to rest | Panels, cards, the next item |
| Rise from a line | Comes up from under a line it cannot be seen below, without fading | Headlines, the words of a launch film (`riseFromLine`, section 7) |
| Tilt in | Arrives in perspective, tipped back, and settles flat on | Cards, screenshots, posters (`tiltIn`, section 14) |
| Draw on | Its outline draws itself, then it fills | Diagrams, routes, plans |
| Type on | Letters appear one by one behind a cursor | Titles, prompts, the last sentence |
| Print | Comes out of a slot line by line | Receipts, tickets, labels |
| Flip | Turns over to show its face | Cards, tiles, split-flap letters |
| Assemble | Parts fly in and join | Logos, a figure made of things |
| Unfold | Opens from a fold | Paper |
| Grow | Rises from the ground, or fills from below | Bars, liquid, towers |
| Light up | Was there, dark; now it is lit | Devices when their link lands, lamps |
| Be uncovered | Something in front moves away | Reveals |
| Melt in | A drop swells, stretches and becomes the shape | Glass toolbars, pills, buttons (`Liquid`, section 15) |

| Departure | Looks like | Suits |
|---|---|---|
| Cut | Gone with the shot | Most things |
| Fall | Drops out of the frame | Failures, things refused |
| Be thrown | Flies out, tumbling | A header cut off, a parcel bounced |
| Be torn off | Pulled away at a tear | Receipts, notes |
| Be struck out | Crossed by two strokes; stays, refused | Bad options |
| Shrink away | Scales to nothing | Small things |
| Be covered | The next thing lands on it | Piles |
| Go dark | The light leaves it | Those who left; a link that was cut |
| Shatter | Breaks where it was hit; the pieces fly, turn and fall, still showing its picture | A poster, a pane, a verdict overturned (`shatter`, section 8) |
| Break out of the frame | Leaves the rectangle that held it and enters the world in front | A feature leaves the phone, a poster steps out of its frame (`transitions.md`, section 5.8) |

Things leaving at the end of a shot are rarely worth drawing: the cut removes them.

## 6. Drawing

| Effect | Looks like | Use |
|---|---|---|
| Line drawn on | A stroke grows along its path | Routes, connectors, outlines |
| Handwriting | Letters written stroke by stroke by a pen | Notes squeezed into a margin, signatures |
| Hatching | Shade made of lines that follow the light | Solids in a print look |
| Section shading | The cut face of a thing filled with even diagonal lines | Cut-aways |
| Flood | Colour fills a shape from one side or from a point | Wires that carry current, a bar of progress |
| Highlighter | A broad translucent stroke behind a word or along a route | The chosen one among several |
| Strike-through | Two hard strokes across | Refusal |
| Ring, bracket | A ring or corner marks round a thing | "This one, now" |
| Leader and label | A fine line from a part to a small label | Naming parts |
| Dashed outline | The shape of a thing that is not there yet, or has left its place | "Not made yet"; an empty slot |
| Cut | A line of light runs through paper, a dark gap opens behind it, the pieces part | One thing becoming several |
| Punch | A tool closes; a hole appears; a chip flies | Tickets |
| Stamp | A shadow closes in from above, then the impression, pressed in hard | Approval, a name |
| Crumple, tear, fold | Paper behaves as paper | Drafts thrown away |
| Morph | One outline changes into another | The same idea in two forms |
| Boil | Lines redrawn with a slight change every two or three frames | Hand-drawn warmth |

## 7. Type in motion

Craft and rules are in `type-and-captions.md`. The effects:

| Effect | Looks like | Use | In the starter (`src/scenes/parts/kit-type.ts`) |
|---|---|---|---|
| Typewriter with a cursor | Letters one by one; the cursor blinks on the beat | Titles, prompts, closing sentences | Drawn by the shot; `terminal` of `kit-devices.ts` types its lines |
| Slam | The word at full size on the beat | Names | Drawn by the shot |
| Stamp | The word as an impression | Names on paper | Drawn by the shot |
| Split-flap | Letters clatter round to the word | Boards, menus | Drawn by the shot |
| Rise from a line | Each letter comes up from under the baseline, a spring per letter, a fraction apart; nothing shows below the line | Launch headlines, the premium keynote look | `riseFromLine` |
| Letters on springs | Each letter flies in from an offset, overshoots and settles, with a smear along its motion and a split of two fringe colours while it is fast | Kinetic identity, showreels, a word that must feel physical | `springLetters`, built on `withMotion` |
| Smear | A fast thing drawn as copies back along its path, fading, with an optional colour fringe | Any type or shape that moves faster than the eye can follow | `withMotion` (a trailing smear), `blurY` (a vertical blur centred on the thing) |
| Counter | Digits roll like an odometer: each digit a wheel, the higher wheels turning only while every lower one rolls over, the fast ones blurred | Quantities that grow, big stats | `odometer`, in a face with digits of equal width (the machine voice) |
| Slot reel | Items spin past a window, blurred while fast, fading and squeezing towards the edges of the drum, and land on one with a small clunk | Picking one of many, a roulette of features | `reel` and its run `reelSpin` |
| Marquee | Rows of words that run sideways for ever, tilted, filling the frame, rows in turn filled and outlined, running in opposite directions | Showreels, posters, a list of skills | `marquee`; its outlines by `setWord` |
| Ticker | One row of items running through a band, fading at both ends, on a plate | News, launch films, "three words" | `ticker` |
| Mixed voices in one line | A sans headline with one word in a serif, in the accent colour, slanted | The launch look: "Every *platform*." | `runs` (see below on the slant) |
| Crush | Lines pressed narrower and tighter until they collide | Too much, said at once | Drawn by the shot |
| Scramble | Random letters settle into the word | Machines, decoding | Drawn by the shot, the letters from a hash of the frame number |
| Layers | The word gains outline after outline | A name that wraps itself | Drawn by the shot |
| On a curve | The word follows the ring it names; the letters bend with it | Labels of rings and arcs | `bentText` with `onArc` |
| On a wave | The baseline is a wave that travels | Water, sound, a playful title | `bentText` with `onWave` |
| Fit to width | Each row set as large as the width allows | Closing cards | `fitLines` |
| Word by word | One word per beat | Sentences that are spoken by the rhythm | Drawn by the shot, the word from `frameClock` |

Every function above takes seconds since its start (`since` of `kit-frame.ts`) or an offset that grows with time, so the shot can be sought anywhere. What steps (which word, which item a reel has landed on) is read from the frame's own clock; what moves (a letter on its spring, a wheel turning) from the moment.

### The smear

`withMotion(c, vx, vy, motion, draw)` draws a moving thing: two fringe copies split along the motion (cyan and magenta by default, `fringe` px of split per 1000 px/s), then copies back along its path over `shutter` seconds, each faint enough that together they fade from `density` behind the thing to nothing, then the thing itself. The number of copies follows the length of the smear (one every `spacing` px, at most `maxCopies`), so a slow thing costs nothing and a fast one looks continuous. A shutter of 0.03 s blurs; 0.08 s and more is a drawn smear, as animators draw it. Give it `extent`, the size of the thing along its motion, so that the opacity comes out right.

When the kit was built, stills showed that with a few widely spaced copies the smear reads as a stack of separate letters; with a copy every three pixels it reads as motion. A colour fringe of about 3 px per 1000 px/s is visible and not garish on a light or a dark ground.

### Letter outlines: to bend them, to mask with them

The faces are loaded twice: by the browser for `fillText`, and by opentype.js for their outlines (`src/engine/type.ts`). The outlines are what a shot bends or masks with.

| Need | How, with the starter alone |
|---|---|
| The outline of a word as a path | `textPath2D(text, family, size, x, y)`, or its commands with `textPathCommands` |
| Letters on an arc, a wave, squeezed into a point, pulled by a noise | `bentText(text, family, size, warp)`: the outline is cut into short straight pieces and every point moved by `warp(x, y)`. `onArc` and `onWave` are two warps; any function of a point is one |
| A mask of letters | `c.clip(textPath2D(...))`, then draw what shows through; or draw the letters white on a layer and use it as the mask of `Liquid` (section 15) |
| A mask derived from the outgoing word, for a wipe through letterforms | The transition `through` finds the largest hole of a word; a wipe through the whole outline is drawn by the shot, clipping the next picture to the outline as it grows |
| Outlined letters without the lines where contours overlap | `setWord(..., outline: true)`: the stroke is drawn twice as wide and the inside cut away. The starter's display face has overlapping contours, and a plain `strokeText` shows them as lines across the letters |
| Letters drawn stroke by stroke | The single-stroke font of `src/engine/stroke.ts` |
| Letters in 3D, extruded | Not in the kit: three.js has text geometry, and the outline commands can be extruded. Untried in the starter |

A variable font (an axis of width or weight that moves) is not available in the starter: it ships static files, opentype.js reads only static outlines, and Canvas2D cannot set a variable axis. `type-and-captions.md`, section 5, says what a film that needs one must add.

## 8. Many small things

| Effect | Looks like | Use | Cost |
|---|---|---|---|
| Sparks | Short bright streaks from a point, cooling and falling | Metal on metal, a hit | Low |
| Dust | Soft puffs at a landing | Weight | Low |
| Dust in light | Specks that drift, lit only inside a beam | A quiet room, a spotlight, a reveal | Low |
| Paper in the air | Sheets that tumble | Chaos, a crowd with documents | Medium |
| Confetti | Coloured flakes that burst up, brake, flutter and fall | Celebration, once | Low |
| Coins, gems into a counter | They burst out, hang, then fly on curves into a counter one after another; the counter bumps and rolls | Rewards, sales, a score | Low |
| Fire | Tongues of flame that rise, narrow, cool and die | Heat, danger, a burner | Medium |
| Smoke | Billows that rise, swell and drift | After fire, after an explosion, a chimney | Medium |
| Explosion | A flash, a fireball that turns to smoke, a ring of pressure, debris on arcs, sparks | An impact that can be followed, a turning point | Medium |
| Shatter | A picture breaks where it was hit and its pieces fly | Glass, a poster, a verdict | Medium: the picture is drawn once per piece |
| Rings | Circles that run out from a point | A broadcast, a shock | Low |
| Links | Arcs from many things to one, or from one to many | Connections. The direction is the meaning | Low |
| Flow lines | Thousands of lines along a field | Currents, traffic | High |
| Swarm | Many agents | Crowds | Simulated once |
| Pile | Things that fall and heap | Pearls, coins, parcels | Simulated once |
| Field of devices | Hundreds of small screens that light as a wave passes | Subscribers, an audience | Instanced |
| Trails | The path a thing has taken | Routes, orbits | Drawn from the path, not from old frames |

### The particle kit

`src/scenes/parts/kit-particles.ts` makes bursts and streams in which every particle is a pure function of the time. A particle is an index; its birth, place, direction, speed, life, size, spin and two spare random numbers come from `hash(seed, index, k)`; its place at an age is the closed form of a flight under constant gravity with drag in proportion to speed. Time is in seconds since the burst or the start of the stream, because the physics is in pixels and seconds: put a burst on a beat with `since(audio, f, beat)`.

| Function | Gives |
|---|---|
| `burst(spec, since)` | The particles of a burst that are alive: `count` of them (its capacity), released at once or over `spread` seconds |
| `stream(spec, since)` | The particles of a stream that are alive: `rate` a second, particle i born at i / rate, stopping at `until`. Its capacity is `streamCapacity(spec)`, the rate times the longest life |
| `particleAt(emit, i, born, t)` | One particle, for a shot that lays out its own births |
| `flightAt(x, y, vx, vy, gx, gy, drag, age)` | The closed-form flight, with the velocity |
| The emitter fields | `at`, `radius` (born in a disc), `angle` and `cone` (the direction of launch), `speed`, `life`, `size`, `spin`, `gravity`, `drag`, `turbulence` and `turbScale` (a drift by value noise that grows with age). A field that is a pair `[min, max]` is drawn per particle |
| `pullTo(p, x, y, from)` | Pull-in: from a share of its life on, the particle is drawn to a point and reaches it when it dies; its velocity follows, so streaks point the right way. A charge gathering, sparks sucked into a logo |
| `curveFlight(a, b, k, bend)` | A curved flight from one point to another, with its direction: coins into a counter, a thing thrown into a slot |
| `orbitAt(cx, cy, r, a0, w, age, tilt)` | A place on an orbit seen at a tilt, with its depth for size and drawing order |

The recipes draw on a Canvas2D layer, or into a line batch for sparks:

| Recipe | Draws | Notes |
|---|---|---|
| `drawSparks(lines, particles, style)`, `drawSparks2D(c, ...)` | Streaks from where each particle was a moment ago to where it is, hot to cool, thinning | A `LineBatch` in `add` blend with room for every particle; colours above 1 bloom |
| `confetti(c, spec, since)` | Flakes fired once from a point, braked hard, fluttering as they fall, turning over (a flake shows thin and wide by turns) | `colours` are palette keys or hex |
| `coinsToCounter(c, spec, since)` and `drawCoin` | Coins or gems that scatter, then fly on curves into a counter, one after another | Returns `landed` and `sinceLast`: the counter's value steps with `landed`, and its bump is a decay of `sinceLast` |
| `fire(c, spec, since)` | Tongues born along a base that race up, narrow, stretch along their flight and cool | Drawn with `lighter`; start it half a second before it is seen, so that the flame has built up |
| `smoke(c, spec, since)` | Billows that rise, swell and drift, lit on the side towards the light | Drawn normally |
| `explosion(hot, spec, since, cool, lines)` | Flash, fireball of billows that turns to smoke from its edge, ring of pressure, debris, sparks | Hot light adds and smoke covers, so it takes two surfaces: a layer composited with mode `add` for the hot part, and a layer composited normally, drawn first, for smoke and debris |
| `shatter(c, spec, since, source)` and `shardsOf` | A rectangle broken along rays and jagged rings round the point of impact; the pieces fly from it (the nearer, the faster), turn, fall and keep their piece of the picture | `source` is a canvas (a `Layer2D`'s canvas) or a function that draws the picture; the break runs outwards over a few hundredths of a second |
| `lightBeam(c, beam)` and `dustInBeam(c, beam, t)` | A soft cone of light, and a fixed set of specks drifting on noise, lit only inside it | The beam uses a conic gradient, which Safari has since version 16.1 |
| `puff(c, x, y, r, rgb, alpha, hard, stretch, angle)` | One soft disc with a firm middle | The brick of fire and smoke; firm middles overlap into billows, puffs that are all edge melt into one blob |

A layer that should glow (fire, the hot part of an explosion) is composited with mode `add` and a tint a little above 1, for example `{ mode: 'add', tint: [1.3, 1.3, 1.3] }`: a canvas holds values up to 1 only, and the tint lets the brightest part cross the bloom threshold. Type is never on that layer.

A batch of lines or points has a capacity. It is sized for the heaviest frame of the shot, and that frame is looked at. Past the capacity, part of the picture is silently missing.

When the kit was built, stills showed that fire made of large round puffs reads as a glowing egg, not a flame; small tongues stretched along their flight and drawn in towards the axis read as a flame. Smoke made of puffs with soft edges only reads as fog; firm middles and a lighter side read as billows. An explosion at its first tenth of a second is a ball of light, and that is right; its character comes in the half second after, when the billows darken from the edge.

## 9. Light

| Effect | Looks like | Use |
|---|---|---|
| Glow | Bright things bleed light | Lamps, signals, routes. Never type |
| Flare on a hit | A short swell of brightness | The landing of an event |
| Sweep | A band of light crosses a surface | Glass, metal, "new" |
| Flicker | A lamp that catches | Power returning |
| Pool of light | A soft bright area on a dark ground, in halftone | Presenting one thing |
| Beam with dust | A cone of light from a high window, specks drifting in it | Quiet, time passing, a spotlight (`lightBeam`, `dustInBeam`) |
| Gathering shadow | A shadow that grows before a thing falls | Foreshadowing, in the literal sense |
| Hard shadow | A black shape, offset | Paper, a hero object on a stage |
| Soft shadow | A card lifted off the page: a tight contact shadow and a wide soft one | Interface cards, windows, the launch look (`softShadow`, section 12) |
| Current | Light that travels along a cable | Power, data |
| Burners, embers | Light that shifts from warm to hot | Stress rising |
| Raster bars | Shiny horizontal bars that swing up and down, stepping round the colour wheel | The demo scene, a retro title (`rasterBars` in `src/engine/glsl/common.ts`, called from a full-screen pass) |

## 10. The finished frame

The post chain works on the whole frame after the shots are laid together. A shot changes only what its moment needs.

| Effect | Does | Parameter in the starter (`src/engine/post.ts`) | Dark ground (`POST_DARK`) | Light ground (`POST_LIGHT`) |
|---|---|---|---|---|
| Exposure | Overall brightness | `exposure` | 1 | 1 |
| Bloom | Light bleeds from what is brighter than a threshold | `bloom`, `bloomThreshold`, `bloomKnee`, `bloomRadius` | 0.7, threshold 1.0 | off |
| Halation | A warm halo round highlights | `halation` | 0.25 | off |
| Colour fringe | The colours part towards the edge | `ca`, in pixels at the edge | 0.4 | 0.25 |
| Grain | Fine noise | `grain` | 0.045 | 0.05 |
| Vignette | The corners darken | `vignette` | 0.4 | 0.18 |
| Fade | To black | `fade` | | |
| Flash | Added light in the paper colour | `flash` | on hits | on hits |
| Shake | The frame is displaced | `shake`, in pixels | on hits | on hits |
| Zoom | The frame is magnified | `zoom` | punches | punches |
| Invert | Dark and light change places | `invert` | one or two frames on an impact | the same |

Bloom begins a little under its threshold, by the width of the knee. Paper-coloured type on a dark ground is therefore tinted down slightly, so that it stays clear of it.

### Looks a shot asks for

These are off by default; a shot returns the parameter only in the frames that need it, for example `return { ...POST_DARK, crt: 1 }`. Each is a few instructions in the pass that finishes every frame anyway, so none costs a pass of its own; while it is off it costs a test of one number. The ones that move where a pixel looks (kaleidoscope, lenses, mosaic, glass, tearing) move the bloom with the picture.

| Look | Parameters | Does | Serves |
|---|---|---|---|
| Hue rotation | `hue` (radians) | Turns every colour round the colour wheel; grey stays grey | A chorus that flows through colours, a palette flipped for a second verse |
| Kaleidoscope | `kaleido` (sectors, 0 off; 6 to 12 reads as a kaleidoscope), `kaleidoTurn` | The frame is cut into mirrored sectors round its middle | Psychedelic passages; turn it slowly with `kaleidoTurn` |
| Fisheye | `fisheye` (-1 to 0.9) | The middle swells (1 / (1 - fisheye) times at the centre), the edges stay; below 0 it pinches | A lens, a dream, a push without moving the camera |
| Bulge | `bulge` (-1 to 0.9), `bulgeAt` (px), `bulgeRadius` (px) | The same law inside a circle: a loupe over one spot | A magnifier over a chart, tiles swelling as a lens passes |
| Mosaic | `mosaic` (cell size in px, 0 off) | The frame in large pixels | Games, a picture resolving, a censored face |
| Glitch | `glitch` (0 to 1) | Bands torn sideways with their colours split, a few blocks jumping, changing every other frame | An error, a hit on the beat that recovers by the next one |
| CRT | `crt` (0 to 1) | Curved glass, scanlines every 3 px, a phosphor mask of three colour stripes, dark rounded corners | A television, a terminal, a retro-futurist launch, the demo scene |

Two more finishes are passes of the kit rather than of the chain, because they need a second picture (`src/scenes/parts/kit-post.ts`, section 15):

| Finish | How | Serves |
|---|---|---|
| Difference | `Difference.render(renderer, layer, base, out)`: a layer blended by difference over the shot's picture, worked out on the values the screen shows | A giant word that inverts whatever it crosses |
| Blur by depth on flat layers | `Blur` on each layer that is out of focus, its radius from `dofRadius(depth, focus)` | Floating chips and cards in front of and behind the subject |

Not in the starter, and worth adding when a look asks for them:

| Effect | Look it serves |
|---|---|
| Halftone screen over the frame | Print |
| Ordered dither, few colours | Early computers |
| Outline from edges | Toon, technical drawing |
| Colour grade by table | Film stock |
| Letterbox | Cinema |
| Light leaks | Film |

## 11. Diagrams and figures

| Effect | Looks like | Use |
|---|---|---|
| Counter that becomes the subject | A price tag that grows until it fills the frame | A quantity out of hand |
| Bar that grows | From the base line, to its value | Comparing |
| Progress | A bar from one step to the last | A process |
| Step marker | One marker that hops from step to step, sometimes half a beat ahead of what it marks | Where we are |
| Pulse on a wire | A point of light that travels a connection | A message. One to many means notification |
| Same tag on every wire | Each connection carries the same label | They all reach the same one thing |
| Request refused | A dashed newcomer is stamped and led to the one that exists | There may be only one |
| Parts re-form | Pins or sockets change shape to fit | Adapting |
| Swap in a slot | One card out, another in; everything round it still | Interchangeable |
| Tags "unchanged" | Small labels on what did not move | What stays is the point |

## 12. Interfaces

| Effect | Looks like | Use |
|---|---|---|
| Finger press | A hand with joints: the finger bends, the pad spreads on the glass | Touch screens |
| Cursor click | Travel, press, ripple | Desktop |
| Cursor trail | Fading copies of the pointer where it was a moment ago | Speed, the multi-cursor look of launch films |
| Drag and let go | The thing follows the cursor, and when released springs back from where it was, at the speed it had | Sliders, cards, sheets (section 3, "Springs") |
| Pull to refresh | The page is dragged down and springs back | Waiting |
| Switch, tick | A control changes and its target changes in the same beat | Cause and effect |
| Typing | Text appears behind a cursor | Forms, prompts |
| Badge | A number on an icon rolls over | A count changed |
| Things out of a button | A request goes in, a made thing comes out of the same place | Creation |
| Screen in a device | The interface on a drawn phone, a browser window, a terminal | Context |
| A window out of focus behind | A second window, blurred and a little faded, behind the one in focus | Depth in a product film |

One hand, drawn once, serves every shot that needs one.

### The devices kit

`src/scenes/parts/kit-devices.ts` draws the frames a product film shows its screens in. Each draws on a Canvas2D context and returns the rectangle of the screen inside it; the shot draws its interface there after `clipTo(c, screen)`. A real screenshot goes in with `loadBitmap` and `drawImageFit` of `src/engine/media.ts`.

| Function | Draws |
|---|---|
| `browserWindow(c, box, style)` | Its soft shadow, the chrome with the three lights, the address bar with `url`, tabs, a light or dark `tone`; returns the page |
| `phone(c, cx, cy, h, style)` and `phoneGlass(c, screen, island)` | A phone of height `h`: metal frame lit from the top left, side buttons, black bezel; then, over the app, the island (0 to 1 widens it into a live activity) and a sheen on the glass |
| `terminal(c, box, lines, style)` | A dark window with a title; lines starting `$ ` or `> ` get their sign in the accent colour, lines starting `! ` are errors; `typed` characters across the lines, a block caret that the shot blinks on the beat |
| `softShadow(c, box, r, elevation, darkness, fill)` | A card lifted off the page: a wide soft shadow and a tight contact one, with the card's fill. Uses the context's shadow, which every browser has |
| `cursor(c, x, y, size, press)` | A pointer with its tip at the point; `press` squeezes it |
| `clickRipple(c, x, y, since, colour)` | The ring that runs out from a click for half a second |
| `springPath(t, keys, freq, damping)` | Where a cursor is that springs from target to target, and its velocity. A damping near 0.8 gives the small overshoot of a hand that knows where it is going |
| `released(since, x, y, vx, vy, rest)` | A thing let go at (x, y) moving at (vx, vy), springing back to `rest` |
| `cursorTrail(c, at, t, count, every, size)` | The pointer drawn where it was 1, 2, ... steps ago, fainter each time |

A window out of focus behind: draw it on a layer of its own, blur that with `Blur` of `kit-post.ts` (a radius of about 8 to 12 px), and composite the result with `premult: false` and an opacity a little under 1 before the window in focus. The canvas `filter` property is never used for this: Safari lacks it.

## 13. Time inside a shot

| Effect | Looks like | Use |
|---|---|---|
| Freeze | Everything stops for a beat | The moment before the break |
| Rewind | Things travel back along their paths | "Without it" |
| Repeat | The same action again and again, a little harder each time | Trying, failing |
| Hold before the end | Stillness from a beat on | Leaving the end of the shot to the next transition |
| Step cuts | The shot shows a different arrangement on each beat | Seven cards in seven beats |

## 14. Solids

| Effect | Looks like | Use | Watch out |
|---|---|---|---|
| Turntable | The object turns once and stops | Presenting | |
| Exploded view | Layers separate along an axis, each with its label | What a thing is made of | |
| Cut in half | A plane slices the object, the inside is shaded by section lines | How it works inside | |
| Filling | Liquid rises in steps, with a surge and a settle | Making, in one run | A cup that gains a layer per beat reads as additions, not as making |
| See-through | The inside is visible through the wall | Vessels | Solid things inside are drawn before see-through ones and vanish: mark them see-through and order them |
| Outline | A steady line round the solid | Print looks | |
| Engraving | Hatch that follows the light | Patent look | Fixed pitch on screen |
| Wrapping | A layer closes round the object and takes its form | Adding without changing | The object itself keeps its neutral colour |

### Cards in space

Cards, screenshots and posters standing in perspective are three.js: Canvas2D can turn and skew a picture but cannot give it perspective. `CardStage` of `src/scenes/parts/kit-devices.ts` holds them.

| Part | What it does |
|---|---|
| `new CardStage({ width, height, floor, reflect, fade, back, shade })` | Cards of one size. With a `floor` level every card is drawn a second time, mirrored in the floor and fading downwards over `fade`, as a glossy floor reflects |
| `setFace(i, texture)` | Card i shows a texture: its face drawn once on a `Layer2D` of the card's size (rounded corners are its transparent corners), or a picture from `src/engine/media.ts` |
| `place(i, pose)` | Where card i stands this frame: position, turns about the upright and level axes, scale, opacity. Every card is placed every frame |
| `render(renderer, cam)` | Renders into the stage's own target, anti-aliased; composite it with `premult: false`. The default camera sees one unit as one pixel at depth 0; a `Cam3` of `kit-camera.ts` moves it |
| `carouselPose(i, n, turn, r)` | Card i of n on a ring, the front one flat on at depth 0 |
| `wallPose(col, row, cols, rows, gap, ry, rx)` | A wall of cards turned as one |
| `tiltIn(since, from, to)` | A card arriving from a tilted, lower, further pose, carried by a spring from rest |

The reflection is a mirrored copy of each card, not a rendered mirror: exact for cards that stand on the floor, cheap, and it never shows anything but the cards. The backs of the cards are plain (`back`, a linear colour); with `back: null` a card seen from behind shows its face mirrored. The faces are multiplied by `shade`, 0.86 by default, which keeps a white card under the bloom threshold of the dark preset: without it white cards glow on a dark ground.

## 15. Materials in motion

Passes of the kit (`src/scenes/parts/kit-post.ts`) that a shot runs on its own layers before the frame is finished. They work on the GPU in linear light and are the same in every browser.

| Pass | What it does | Cost |
|---|---|---|
| `Blur` | A soft copy of a texture: a Gaussian in two passes on a target `down` times smaller. `render(renderer, texture, radius, premultiply)` returns it premultiplied; composite with `premult: false`. Pass `premultiply: true` for a `Layer2D`, whose alpha is straight | Two passes over a quarter of the frame at `down` 2 |
| `dofRadius(depth, focus, aperture, max)` | The blur radius of a flat layer at a depth, for depth of field on 2D layers: each layer out of focus goes through `Blur` | One `Blur` per layer out of focus |
| `Liquid.goo(renderer, mask, out, style)` | Goo: the shapes drawn white on a mask layer melt together where they come within `radius` of each other, and a drop pulled away stretches and pinches off. Flat colour with a highlight on the side facing the light, drawn over `out` | One blur and one full-screen pass |
| `Liquid.glass(renderer, mask, behind, out, style)` | Liquid glass: the picture behind (the shot's world, rendered into a target of its own first) seen through the shapes of the mask, bent at the rim (`refraction`), split into colours there (`chroma`), frosted (`frost`), with a bright line where the rim meets the light (`rim`) and a soft shadow outside. With `goo` above 0 the glass shapes melt together too: a glass drop that stretches into a toolbar. It writes the whole of `out`, which must not be `behind` | One blur and one full-screen pass, and a second blur when frosted |
| `Difference.render(renderer, layer, base, out)` | A layer blended by difference over a picture | One full-screen pass |

The mask of goo and glass is any drawing: circles, rounded rectangles, a word, the icons of a toolbar. The field the shapes are read from is the mask blurred, which is the blur-and-threshold method of the web, done on the GPU. Glass letters are a word drawn on the mask.

When the kit was built, stills showed that glass reads as glass when what is behind it has detail near the rim (type, stripes); over a flat colour the refraction cannot be seen. The rim line carries most of the effect.

## 16. In the HyperFrames route

Its animation skill holds the same ground as rules, grouped this way:

| Group | Rules |
|---|---|
| Text | `hacker-flip-3d`, `vertical-spring-ticker`, `counting-dynamic-scale`, `kinetic-beat-slam`, `gradient-text-sweep`, `chromatic-glitch`, and others |
| Data | `stat-bars-and-fills`, `chart-scrub-readout` |
| Layout | `center-outward-expansion`, `depth-scatter-assemble`, `orbit-3d-entry`, and others |
| Drawing | `svg-path-draw`, `svg-icon-enrichment`, marker patterns (highlight, circle, burst, scribble) |
| Ambient | `sine-wave-loop`, `ambient-glow-bloom` |
| Interface | `cursor-click-ripple`, `cursor-drag`, `press-release-spring`, `control-target-sync` |
| Arrivals | `spring-pop-entrance`, `waterfall-entry`, `particle-burst` |

Two limits stated there bear on the choice of route: particles drawn as page elements are capped at about forty, and effects that need the frames before are discouraged.

## 17. What costs

| Costly | Why | What to do |
|---|---|---|
| Drawing large type or a large canvas afresh every frame | The whole layer is uploaded each time | Draw what does not change once, and only the moving part per frame |
| Formatting numbers every frame | Locale-aware formatting is slow | A plain formatter |
| Building text shapes on first use | A stall in the middle of a shot | Build them when the shot loads |
| A full-screen shader with many octaves of noise | Every pixel pays | Half resolution for soft fields |
| Ray marching | Every pixel, many steps | Keep for one shot |
| Refraction, blur by depth | Extra passes | Keep for the hero |
| A second drawing layer the size of the frame | Another upload | Half resolution for glows |
| Hundreds of soft puffs (fire, smoke, explosions) | Each is a radial gradient filled on the canvas | Fewer, larger puffs with firm middles; one layer for all the hot things |
| A smear on many letters at once | One draw per copy | Only the letters that move fast smear; a still letter costs one draw |
| Shatter | The picture is drawn once per piece, through a clip | A few dozen pieces; the picture drawn once on its own canvas and passed as `source` |
| Cards in three.js | A render of their own, anti-aliased, plus a composite | One stage per shot, cards drawn once at load |

The target is a frame drawn in about eight milliseconds, so that sixty frames a second play on a laptop. Measure, and know what the figure includes: a measurement made through the capture tool includes reading the pixels back, which the studio does not do. None of the kit of sections 7, 8, 12, 14 and 15 has been measured for frame time yet.

## 18. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| A shot is busy and says nothing | Effects without a job | One event per beat; cut the rest |
| A digit shows two values at once | A stepped value taken from the moment, under sampling | Take it from the time of the frame |
| Glow where many lines cross, on things that should not glow | Added light summed past the threshold | Draw such lines with a maximum blend; keep alpha within one |
| Part of the picture is missing in the fullest frame | The batch was too small | Size it for the heaviest frame; look at that frame |
| A shot stalls once, early | Something built on first use | Build at load |
| The picture differs between two runs | An unseeded random number, or the clock | Seed everything |
| Things inside a glass vanish | Drawing order of see-through and solid things | Mark the inside see-through as well, and order it |
| Layers added one per beat are read as "extras" when "steps of making" was meant | The picture of adding | Show choices on a plan; make the thing in one run at the end |
| One request fans out to several receivers where "create one thing" was meant | The picture of notification | One in, one out |
| A shot shows nothing in the owner's browser | A canvas feature that browser lacks | Avoid the canvas `filter` property; read the browser's errors |
| A fast thing looks like a slide show | No smear | Draw the streak (`withMotion`) |
| A smear looks like a stack of copies | Too few copies, too far apart | A copy every few pixels; `withMotion` does this by `spacing` |
| Outlined letters show lines across them | The face's contours overlap inside a letter | `setWord` with `outline`, which cuts the inside away |
| Fire looks like a glowing egg, smoke like fog | Large puffs with soft edges only | Small stretched tongues for fire; firm middles and a lit side for smoke |
| The smoke of an explosion disappears or brightens the ground | It was drawn on the layer that is added | Smoke on a layer composited normally (`explosion` takes two surfaces) |
| White cards in space glow | White is above the bloom threshold of the dark preset | Keep `shade` of `CardStage` at about 0.86 |
| A card seen from behind shows mirrored text | Its back shows the face | A `back` colour (the default) |
| A blurred layer has dark fringes | Straight alpha blurred as it is | `Blur` with `premultiply: true`, composited with `premult: false` |
| The glass shows nothing or a black frame | `behind` and `out` are the same target, or nothing behind has detail | Render the world into its own target first; put detail near the rim |
| A ticker's plate fades at its ends | The fade erased it | Pass the plate to `ticker`, which lays it in behind the text afterwards |
| A beam of light shows steps | Many faint layers in 8-bit | `lightBeam`, one layer with a conic gradient |
