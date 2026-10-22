# Camera

A catalogue of what a camera can do in a film drawn by code: where it stands, how it moves, and what each choice makes the viewer feel. It also gives the rules that keep camera work varied, on the beat and readable.

Load this when: writing the `camera` field of shots in the storyboard, briefing a builder, judging why a run of shots feels flat, or adding a move to the shared kit.

## 1. The model

| Rule | Meaning |
|---|---|
| A camera is data | A pose is a small record. It is worked out from the time and from nothing else: the same beat always gives the same pose |
| A shot writes its poses down | The builder names a few poses (wide, on the detail, from above) and says at which beat the camera leaves for each and how long the move takes |
| Moves are timed in beats | They start on a beat and take a number of beats, read from the clock of the shot |
| Moves add up | A shot's camera is its pose at this beat, times a punch, plus a shake, plus a drift. Each is a small pure function |
| There is no camera engine | The engine knows nothing of cameras. The kit offers the pieces, and each shot assembles its own. This is what lets every shot move differently |

Two kinds of camera:

| Camera | Pose | For |
|---|---|---|
| Flat | The point of the world at the centre of the screen, a zoom, a roll | Drawings, type, interfaces, maps: anything drawn on a plane |
| In space | A position, the point looked at, a field of view, a roll | Models, line drawings in perspective, shaders that march rays |

From practice: the reference film that the owner admired for its varied camera work had no camera system at all. Each scene wrote its own poses. The variety came from that freedom, and from a rule that no two scenes in a row move alike.

## 2. Where the camera stands

### Size of shot

| Size | Shows | Use |
|---|---|---|
| Extreme wide | The whole world, the subject small in it | Scale, loneliness, "all of this" |
| Wide | The subject and its place | The first look at a new place; the last look that sums up |
| Medium | The subject, filling half the frame | Action between two things |
| Close | The subject fills the frame | The thing that matters now |
| Extreme close | One detail: a pin, a button, a letter | The moment of contact; the start of a pull back |
| Insert | A detail shown for a beat or two, then back | "Look at this" |

### Angle

| Angle | The viewer feels | Use |
|---|---|---|
| Level, straight on | Neutral, like a page | Interfaces, forms, diagrams, words |
| From above, straight down (plan) | In control, an overview | Maps, floor plans, tables, crowds, routes |
| High, looking down | The subject is small, or seen whole | Models on a table, a city |
| Low, looking up | The subject is large, strong | A wall coming down, a hero object, a crowd of silhouettes |
| First person | "This is me" | A finger on a screen, waiting, trying |
| Through something | Looking in from outside | Through the wall of a glass, a window, a gap between two sheets |
| Section | The thing cut open, seen from the side | Houses, machines, the inside of a connector |
| Tilted (roll) | Unrest, energy | Problems, tension, the build before a drop |
| Three-quarter | Depth without drama | Objects, cards on a table |
| Isometric | A small, tidy world | Systems seen whole |
| Over the shoulder | With one person, looking at what they look at | Two characters facing each other; a character before a screen. The shoulder is large, soft and dark in a corner of the frame |

### Lens

| Lens | Looks like | Use |
|---|---|---|
| Wide field of view, near | Strong perspective, large foreground | Impact, a thing coming at the viewer |
| Narrow field of view, far | Flat, stacked, calm | Products, comparisons side by side |
| Orthographic | No perspective at all | Plans, isometric worlds, technical drawings |
| Shallow depth of field | One plane sharp | A miniature; guiding the eye. Costly: use blur by depth sparingly |

A change of field of view is mixed by focal length, which is what the eye follows. Mixing the angle itself looks uneven.

When a prompt names a lens in millimetres, it means the field of view of that lens on a full-frame camera, whose picture is 36 by 24 mm. `Cam3` takes the vertical field of view in degrees: two times the arc tangent of half the frame's height in millimetres over the focal length. In a horizontal frame the height is 24 mm; in a vertical frame the camera stands on its side and the height is 36 mm.

| Lens | Vertical field of view, 16:9 | Vertical field of view, 9:16 | Feels like |
|---|---|---|---|
| 24 mm | 53 degrees | 74 degrees | Wide: space, a room, strong perspective near the lens |
| 35 mm | 38 degrees | 54 degrees | A documentary eye, a person in their place |
| 50 mm | 27 degrees | 40 degrees | Natural, close to the eye |
| 85 mm | 16 degrees | 24 degrees | A portrait: the face, the background soft and flat |

### Depth of field without the cost

A true blur by depth in a 3D scene is costly and is not in the starter. In a picture drawn on 2D layers at chosen depths, the cheap way is the one a film camera gives by itself: each layer is blurred by its distance from the plane in focus. Draw a far layer into a `Layer2D` made with a low backing scale (the third argument of its constructor, for example 0.25): it is drawn at a quarter of the resolution and comes out soft when laid on the frame. A rack focus is the plane in focus keyed in beats, with two versions of the layers (sharp and soft) mixed by it. This has not yet been tried in a still. Canvas filters (`filter = 'blur(...)'`) also blur, but Safari has none, so do not rely on them for a film the owner watches in Safari.

## 3. The moves

Columns: **Kit** names the helper of the starter (`src/scenes/parts/kit-camera.ts`, `kit-frame.ts`), or says that the shot writes it with poses.

### 3.1 Still and nearly still

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Locked off | Rest; attention on what moves in the frame | After a run of movement; whenever words must be read; when the point is that something does NOT move | one pose |
| Drift | The frame is alive | Under a long shot that would otherwise freeze | a key with a long `over` and a linear ease |
| Breathing with the kick | The picture has a pulse | Drop phrases | `pushOnBeat`, amount under 0.03 |
| Hand-held | Someone is holding the camera | First person, documents | seeded noise on the pose, small |

### 3.2 Towards and away

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Push in | Attention tightens | Towards the thing that is about to matter | poses with `camAt` or `cam3At` |
| Pull out | The whole appears; relief, or dread at the size of it | Reveals; endless growth | poses |
| Punch | A nod on the beat | A hit, a landing, a name arriving | `punch` |
| Step in | The camera takes a new place at once and settles, like something with weight | One step closer per beat or per item | `stepIn` |
| Wind-up | The camera leans back, then goes | Before any move that should hit hard | `windUp` |
| Crash zoom | Alarm | On to a detail, once in a film | poses, a short `over`, smear drawn by the shot |
| Yank back | Thrown out | A failure; the step from a detail to a mess | poses, a very short `over` |
| Dolly zoom | The ground gives way | Once, for a realisation | position and field of view moved against each other |
| Dive | Falling into a thing | The lead of a zoom into a detail | poses, blended evenly in scale with `camMix` |

### 3.3 Across

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Pan, truck | Reading along | Along a line, a belt, a column, a row of stations | poses |
| Tilt, rise | Looking up or down a thing | Down a long sheet, up a tower | poses |
| Fall | Dropping with the subject | Down a scroll that never ends | poses |
| Whip | A snatch to somewhere else | Between two stations in one shot | `whip`, which also gives the amount of smear |
| Follow | Staying with the subject | A thing that travels: a cup on a belt, a current in a cable | `follow`: the camera is where the subject was a moment ago, so the subject leads |
| Lead | Arriving before the subject | A marker that moves to the next station half a beat before the thing it marks | poses ahead of the subject |
| Snap between framings | A cut without a cut | Two views of one world in one shot, on a strong beat | a key with `over: 0` |

### 3.4 Around

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Orbit | The thing is real; it has a back | Presenting an object | `orbit` |
| One turn that stops dead | "Here it is" | The arrival of the hero object | `orbit` with an ease that ends hard |
| Arc | Moving round while closing in | From the side of a thing to its face | poses |
| Roll in steps | Unrest that grows | A build; a problem that gets worse per beat | `rollSteps` |
| Spin about a point | Dizzy | Comedy, a change of view | roll about the focus |
| Crane | Leaving the ground | From inside a scene up to its plan | poses; the drawing tilts flat |
| Tilt flat | A view turns into a diagram | From a picture to the plan that explains it | poses |

### 3.5 Through

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Fly-through | Travel | Through a warehouse, a tunnel, a city | poses in space; for shaders `rayUniforms` and `setRayUniforms` |
| Through an opening | Entering | Through a letter, a door, a gap: see the in-world transitions | poses, with the engine's transition |
| Through a cut | Going inside | Into the cut face of a thing that has been sliced | poses |
| Scale journey | Worlds within worlds | From a detail to the thing that contains it, and on | `scaleCam`; see section 3.7 |
| Aerial chase | Flying with the subject | A plane, a bird, a dragon, a dogfight over the sea | `follow` with a lag, a roll that leans into each turn (the roll follows the sideways acceleration of the path, a beat late), the horizon tilting with it, the camera a little above and behind |
| Parallax slide | Depth in a flat world | A drawn landscape in layers, a paper diorama | poses of a flat camera; each layer moved by the camera times its own depth factor (far layers move less) |

### 3.6 Hits

| Move | The viewer feels | Use | Kit |
|---|---|---|---|
| Shake | A blow | When something in the shot hits something | `shake`, `shakes` |
| Jolt | One sharp displacement | Each cut of a blade, each stamp | a short shake |
| Freeze | Time stops | The moment of contact, before the break | hold the beat |

A shake is the same for every sample of a frame, so the frame is displaced and not smeared.

### 3.7 Across scales in one take

The "powers of ten" shot: from a desk down to one atom of the chip inside the computer, from a hillside out to the observable universe, in one unbroken zoom. It is asked for often and it fails in three ways: the zoom rushes or crawls, the worlds do not join, and the numbers run out of precision at the far end. Nothing here has been built on a film yet.

| Part | Rule |
|---|---|
| Nested worlds | The journey is a chain of worlds (desk, case, chip, die, core, wiring, transistor, lattice, atom), each drawn in units of its own so that its numbers stay near 1. It is not one huge model: each world is its own drawing, entered at the scale at which it is needed |
| The view as one number | Where the journey is, is one number `m`: log10 of the metres the frame's height covers. A desk is about 0, a chip -2, a transistor -7, an atom -10; the Earth 7, the solar system 13, the galaxy 21, the observable universe about 27 |
| Travel in decades | Key `m` in beats with `keys` of `src/engine/util.ts` and a linear ease: the same number of decades on every beat reads as constant speed. Blending the zoom itself, not its logarithm, rushes at one end. To stop at a world, key the same `m` twice: the travel holds while something happens there, then goes on |
| On the beat | A decade per beat or per bar, by the tempo and the number of worlds. Arrivals at worlds on downbeats; the last world, or the reveal, on the drop |
| Each world at its own scale | `scaleCam(m, world)` (`src/scenes/parts/kit-camera.ts`) gives the flat camera of one world at the view `m`, and its opacity; `null` while the world is not drawn. A `ScaleWorld` holds `size`, the log10 of the metres one of its units is, the range `from` and `to` of views in which it is drawn, and a `fade` in decades. Draw each world with the point the journey travels towards at its origin |
| The hand-over | Neighbouring worlds overlap by a decade or so. In the overlap, the outer world shows the inner one as a detail, drawn well enough to be read at that size, and the inner one begins to draw itself when that detail fills a good part of the frame. At the moment of the hand-over the two must agree on place, shape and colour. Where they cannot (a photograph into a drawing, a solid into a lattice), fade across the overlap, or hide the change: through a lens, glass, a gap, a flash of light, fog, a moment of dark |
| Precision | The graphics card computes with single floats, about seven digits. A world modelled in metres, seen by a camera a nanometre from a point a metre from the origin, shakes and tears. Keep each world in its own units near 1, put the origin on the point of travel, give each world in 3D its own near and far planes (near about a thousandth of far), and in a shader compute positions relative to the camera |
| In 3D | Each world is its own three.js scene or group, scaled so that it spans about 1 to 100 units while on screen. The camera's distance to the point of travel is a fixed number of that world's units times 10 to the power of `m` minus the world's `size`. Draw only the worlds of the current hand-over |
| A ruler | A read-out of the scale (1 m, 10 cm, 1 mm, ...) that follows `m` tells the viewer what is happening, and is the one thing that stays still. Step its value with the frame clock |
| Split into shots | One take, several builders: cut it into shots of a few bars, each owning one world or a pair. Every shot reads one curve of `m` from a file of the lead's, keyed in beats of the track (`f.beat`), not of the shot. The hand-over between two worlds happens inside one shot, drawn by its builder; the cut between two shots falls where a single world is on screen, with the `travel` kind in the shot list, so that the engine does nothing at the cut and the frames on both sides must match. Check with one still on each side of every cut |
| A loop | An infinite zoom that loops ends in a world that is the first one again, at the scale at which the film began |
| The inner world covers the detail | At the moment the inner world starts to draw, it must cover at least the area of the detail that stood for it in the outer world, in the same colour. In a test, a lattice of atoms drawn only a few nanometres wide inside a transistor drawn a hundred nanometres wide showed as a small patch in a square of flat colour until it was made to fill the whole square |
| Level of detail | A world draws only what is on screen and only what is larger than a few pixels. A lattice seen from far away is its average colour; its atoms appear, fading in, once each is larger than about eight pixels. Otherwise one world draws hundreds of thousands of marks nobody sees |

Checked in stills of a test scene: four worlds (a desk in centimetres, a chip in tenths of a millimetre, a core in micrometres, a lattice in ångströms) travelled from about 2 m to about 6 Å across the frame in thirteen beats. The sizes met at every hand-over and the frames at the hand-overs showed no seam once the rule above was kept. It has not been tried in 3D.

## 4. Inside a shot

A shot of two or three bars has room for a small sequence. Patterns that work:

| Pattern | Beats | Use |
|---|---|---|
| Open close, pull back | Close on beat 0, the pull back runs through the shot | The first shot of a section: the frame is full from the first frame |
| Land, then settle | The subject lands large, then steps back to make room | A name or an object that arrives on a drop and must then share the frame |
| Follow, then stand back | With the subject while it travels, then wide when it arrives | Cause and effect |
| Step per item | One step closer, or one roll, on each item of a list | Things that pile up |
| Two framings | A hard change of framing on a strong beat | Before and after, in one world |
| Hold still from a beat on | Everything stops a few beats before the end | When the next transition has a lead: the end of the shot belongs to it |
| End where the next begins | The last pose of this shot is the first pose of the next | Travel between two shots of one world; a zoom into a detail |
| Low and slow in a big world | The camera near the ground, the horizon low, a slow drift sideways or forwards while the sky turns | Stylised landscapes, the hour changing inside one shot (`art-styles.md`, section 3.8) |
| Tilt to frontal | A card, a screen or a poster arrives turned in perspective and settles square to the camera | Launch pieces, cards of a list. Draw the card on a `Layer2D` and show it as a plane in a three.js scene with `setThreeCamera`; key its turn to zero with a strong ease out. Canvas transforms cannot draw true perspective; a small turn faked by a squeeze and a skew is enough only under about 15 degrees |

## 5. Rules

| Rule | Reason |
|---|---|
| Two shots in a row do not make the same move by habit | The viewer stops seeing a move that repeats without a reason. The storyboard has a camera column and the generator warns about two equal entries in a row. When the repeat is the idea, mark the later shot `"repeat": true` (`storyboard.md`) |
| A move has a cause | The camera goes because something is there to see. A move for its own sake is noise |
| Moves begin on a beat | The cut and the camera are both instruments of the music |
| Leave at once, settle slowly | The default ease goes out hard and eases in. It reads as decided. A spring ease on a camera feels wrong except on a step |
| A large change of zoom is blended in scale | Halfway through the move the zoom is the geometric mean, and the position follows the zoom. A straight blend rushes at one end |
| The first frame has weight | A shot that opens on an empty frame wastes the hit of the cut. Open on the subject |
| The frame is used | In a vertical frame, the subject runs the height of the safe area. An empty lower third in shot after shot is a layout made for another format |
| The camera does not defeat the words | A caption is set by the overlay and does not move. Words inside the picture must keep the minimum size at the smallest zoom of the shot |
| Still is a move | After three shots that fly, a locked frame is the strongest thing available |
| One showpiece per section | A dolly zoom, a full orbit, a crash zoom: each once |

## 6. Planning the camera of a section

Give every shot a size, an angle and a move, and look at the column as a whole.

| Shot | Size | Angle | Move |
|---|---|---|---|
| 1, the problem begins | Close | Level | Falls along the subject |
| 2, it gets worse | Extreme close | Level | Slides sideways, right on the surface |
| 3, it is out of hand | Wide | High | Steps back, one step per bar |
| 4, the idea arrives | Medium | From above | Locked, a jolt per event |
| 5, the idea at work | Wide | From above | Flies, changes direction with each change |
| 6, the pay-off | Close, then wide | Three-quarter, then plan | Follows, then rises |
| 7, where you meet it | Medium | Level | Locked |

No size, no angle and no move stands twice in a row. The locked shots are where words are read.

## 7. The frame's shape

| Frame | Subjects that fit | Layout | Camera |
|---|---|---|---|
| Vertical 9:16 | Tall things: phones, figures, towers, lists, scrolls, a cup, a slip | Stacked; one subject above another; words in the upper or the lower band of the safe area | Moves up and down are natural; a wide pan has little room |
| Horizontal 16:9 | Wide things: landscapes, timelines, rows, two things side by side | Side by side; words beside the picture | Pans and trucks are natural |
| Square | One centred subject | Centred | Pushes and orbits |

In a vertical film, apps cover the top, the bottom and one side. The picture may run to every edge. Anything that must be read stays inside the safe area: see `type-and-captions.md`.

When a horizontal film will also be cut down to a vertical one by cropping, keep what matters inside the centre 9:16 of the 16:9 frame (the middle 32 percent of its width), and move the camera so that the subject stays there. When the film is made for both frames, lay each frame out on its own instead: see `short-pieces.md`.

## 8. In the HyperFrames route

There the camera moves a wrapper inside a clip, never the timed clip itself.

| Move | Its rule or pattern |
|---|---|
| Punch in, punch out | Keyframes on scale and position of an inner wrapper |
| Slow push on a still | A linear tween of scale and position over seconds |
| Zoom to a target off centre | `coordinate-target-zoom` |
| One virtual camera over a world | `viewport-change` |
| Phases with drift | `multi-phase-camera` |
| Flight through cards in depth | `3d-camera-flight`: poses tuned by eye |
| Rack focus | `depth-of-field-blur` |
| Whip | The `whip-pan` block, or `nudge-curve` with `motion-blur-streak` |
| Following a typing cursor | `camera-cursor-tracking` |

Its ease law for cameras matches rule 4 above: a hard ease out on dives and landings, an ease in and out when repositioning.

## 9. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Every shot looks straight on and stands still | The storyboard has no camera column | Add one; check each pair of neighbours |
| A run of shots feels the same although each moves | They all push in | Vary size, angle and move, not only speed |
| A shot opens on nothing | The subject enters after the cut | Open on the subject, large |
| A zoom rushes at the end | Zoom blended in a straight line | Blend in scale |
| A deep zoom shakes or tears at its smallest scale | One set of units across many decades; floats run out of digits | Each world in its own units with the origin on the point of travel (section 3.7) |
| A journey across scales shows a seam between two worlds | The outer world's detail and the inner world disagree at the hand-over | Draw the detail in the outer world as the inner world looks at that size, or hide the hand-over behind glass, light or dark |
| A small patch of detail sits inside a flat square at a hand-over | The inner world is drawn smaller than the detail that stood for it | The inner world covers the whole detail from its first frame (section 3.7) |
| A lens named in millimetres looks wrong | The focal length was used as a field of view | Convert with the table in section 2, for the frame's orientation |
| Small type cannot be read in a wide pose | The minimum size was checked at the close pose | Check at the smallest zoom of the shot |
| The picture swims on every beat | The push on the beat is too large | Keep it under three per cent |
| A shaken frame looks smeared | The shake differed between samples of one frame | Seed it from the frame number |
| The subject of a follow sits dead centre | No lag | Let the camera trail, so the subject leads |
| Things show through each other in a line drawing seen in space | No hidden lines are removed | Accept it as the manner of a drawing, or draw solids behind the lines |
| The close object and the wide object are not the same drawing | Two models of one thing | One model, or a hand-over covered by a cut or a flash |
| A three-dimensional shot has jagged edges | The target it draws into has no anti-aliasing | Draw into a target with several samples and lay it on the frame |
