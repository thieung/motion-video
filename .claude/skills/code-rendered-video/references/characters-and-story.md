# Characters and story

How to make a film in which someone does something: designing a character that code can draw, rigging it as a function of time, posing and acting it on the music, walking it, putting several of them in one shot, keeping each one the same across shots and builders, and telling a story of 20 seconds to 4 minutes without words. It ends with the faults to look for in stills.

Load this when: a request names a character, a mascot, a hero, two fighters, stickmen, an animal, or "a short film", "a story", "a trailer"; when writing the storyboard of a film in which a figure acts; when briefing a builder whose shots hold a character; or when reviewing such shots.

Nothing in this chapter has been tried on a film yet. The two reference films had figures only as props. It was written from the method, from the starter's rig kit, and from a collection of prompts that asked for characters and stories. The rig has been seen in stills of a test figure of ten parts: its outline, its drawing order, feet planted by `reach` in a crouch and in a walk, a wave with a spring, and a hop with squash and stretch. Read the rest as a plan to be corrected by the first real character film.

## 1. What is asked, and what it really needs

| The request says | What it needs from this chapter | Watch out |
|---|---|---|
| "Make a 90-second short film about a bug that doesn't want to be fixed", "invent the story" | A story shape (section 10), one or two characters, a cast file, acting | The story is the work. Write it and have it approved before any character is drawn |
| "A silent short film where sound tells half the story" | Section 10, and sound written to the picture | Sound is planned in the storyboard, shot by shot, not added at the end |
| "Use the attached bear as the main character; keep it recognisable" | A cast file drawn from the owner's reference, turnaround and expressions approved first | The owner's character is not redesigned. Its marks (ears, eye rings, chest mark) are the checklist of every still |
| "A fight between A and B, with a clear winner" | Two characters that cannot be confused, staging on one line, hits on the beat | Two characters with the same face. A fight that is only flashes |
| "Stickmen in a naval battle" | Stick figures on the rig: few parts, heavy line, action poses | A stick figure still needs a silhouette per pose |
| "A samurai doing a routine of impressive poses in one spot" | A pose library, holds, anticipation, effects on the strikes | Poses that pass through each other with no hold read as noise |
| "A pig sending love notes; use the pig assets on my branch" | The owner's drawings cut into parts and rigged | Asset parts must be cut at the joints with overlap, or the joints open when they turn |
| "Anime-like trailer", "90s cartoon", "Pixar-level quality" in three.js | A look (`art-styles.md`), perhaps a character in 3D (section 8) | "Pixar-level" is a promise code cannot keep with rigid parts. Say so in the brief, and offer the toy or clay look that code does well |
| "A story-led music video with a girl and a boy, a character sheet, backup dancers" | A cast of several, a character sheet, dance on the beat | Lip-sync to a sung vocal: see section 7 |
| "A playable game with characters" | Not a film. See `route-selection.md` | |

## 2. Designing a character that code can draw

A character in this method is a small number of shapes that turn about pivots. It is drawn by code in every frame, so it must be simple enough to be drawn the same way thousands of times and strong enough to be read in a third of a second on a phone.

| Step | Rule | Why |
|---|---|---|
| Silhouette first | Fill the character black on white. It must still say who it is and what it does | The silhouette is what is read at a glance, in motion, small |
| Few shapes | Five to twelve parts: body, head, two arms, two legs, and one or two things that belong only to this character (ears, a hat, a tail, a tuft) | Every part is a pivot to key. More parts are more work in every shot, for every builder |
| One thing only this character has | A shape the eye can find at any size: round ears with grey insides, a bent hat, a single antenna | It tells the characters apart and it survives a small frame |
| Proportions for a phone | A large head (a third to a half of the height for a cute character), large eyes, short limbs | Faces are read only if they are large. A realistic head on a phone is a dot |
| One face system | Eyes, brows and mouth are channels of the pose (`blink`, `look`, `brow`, `mouth`), drawn by one function per character | Every builder then gets the same expressions from the same numbers |
| Line weights | One outline weight for the outside, a thinner one inside, the same in every shot at the same size | Weights that change from shot to shot are the first sign of a character redrawn |
| Colour | Two or three flat colours per character, plus one shadow tone of each. Each character owns a hue from the palette's key hues | The viewer tells characters apart by colour before shape |
| A turnaround | Front, three-quarter, side and back, drawn from the same parts | Shots will need several views. Decide which ones the film needs; many films need only side and three-quarter |
| An expression sheet | Six to eight faces the story needs: neutral, happy, sad, angry, afraid, surprised, and the one the story turns on | Faces are designed once, not invented in a shot |
| Change over a life | When a character ages in the film, its proportions are a function of one channel, `age`: head to body, limb length, height, a hat or a beard that appears. The cast file writes the stages as keys of that channel | The viewer must see one being at every age. What stays (the one thing only this character has, the colours) carries the identity |

Test a design before it is rigged: capture one still with the turnaround and the expression sheet side by side, at the size the character will have in a medium shot of the film's frame. If the faces cannot be told apart at that size, make the face larger or the expressions bolder.

Line weights and scale: the rig draws a part in its own space and the context scales it, so a line width scales with the character. That is right when a character is drawn at the sizes of the film's few shot sizes. For a character that zooms a long way in one shot, give the drawing functions the scale and divide the widths by it, or the outline will swell in the close shot and vanish in the wide one.

Rubber-hose limbs, as in cartoons of the 1930s, have no elbows or knees: each limb is one curve from the shoulder to the hand. Build it with `reach` for the joint's place and draw a single smooth curve through the three points, with the same width all the way and a white glove at the end. A period finish (film grain, a gate that weaves a pixel or two, flicker, dust) belongs to the post chain: see `effects.md`.

## 3. The cast file, shared by every builder

A character is designed once, by the lead, and lives in one file that every builder imports: the cast file, one per character or one for the whole cast, in the kit folder (for a bear, `parts/cast-bear.ts` under `src/scenes/`).

| The cast file holds | Builders may |
|---|---|
| The parts, their pivots, proportions, colours and line weights | Use them. Never copy them into a shot |
| The face: the drawing of eyes, brows and mouth from the channels | Set the channels |
| Named poses: `stand`, `crouch`, `reach`, `cheer`, `slump`, ... | Key them, mix them, add layers |
| Named cycles: walk, run, idle, each with its period in beats | Play them with `loopAt` |
| The size of the character in each shot size of the film | Place the character at those sizes |
| Its seed, for blinks and idle life | Nothing: the seed makes the character itself |

The lead owns the file. A builder who needs a pose or an expression the sheet does not have asks the lead, who adds it to the sheet so the next builder gets it too. A builder never edits the cast file, and never draws the character by hand in a shot, not even "just this once in the background". The rule is the same as for the rest of the kit (`orchestration.md`, file ownership), and it is the only thing that keeps a character the same across ten builders.

A character sheet shot is worth making before the first real shot: one still with the line-up of the cast at one scale, each in the turnaround and a few expressions. The owner approves the characters on it, and every later still is compared with it.

## 4. The rig: a character as a function of time

The starter's kit has a small 2D rig: `src/scenes/parts/kit-rig.ts`. It follows the camera's model (`camera.md`, section 1): a pose is a small record, keys say when to move to which pose and how, and everything is a pure function of time.

### Parts and poses

| Name | What it is |
|---|---|
| `Part` | One piece: its `id`, its `parent`, its pivot `at` in the parent's space, its drawing order `z`, an optional `lag` in beats with a `tip` and a `drag` for follow-through, and a `draw(c, s)` that draws it in its own space with the pivot at the origin |
| `PartPose` | How a part sits: a turn `r` about its pivot, an offset `x`, `y`, a scale `sx`, `sy`. A field left out is at rest |
| `Pose` | `parts` by id, and `ch`, free channels as numbers: `blink`, `look`, `mouth`, `brow`, a costume switch |
| `Rig` | Made from the list of parts, parents first. `pose(t, src)` works out the pose from keys or from a function of time (a walk worked out by hand), `draw(c, pose, place, t)` draws it on a 2D context, `point(pose, id, x, y)` says where a point of a part is, `plant(pose, soles, groundY)` says how far to move the character so the lowest sole touches the ground |
| `Place` | Where the character stands on the layer, its scale, and `flip` to face the other way |

Conventions: y down, angles in radians, a positive turn is clockwise on screen, and a limb at rest hangs straight down from its pivot. The context's own transform is kept, so a character drawn after `applyCam` stands in the camera's world.

### Keys and in-betweens

| Name | Does |
|---|---|
| `rigAt(t, keys)` | The pose at `t` from keys, like `camAt`. Each key is a move from wherever the body is to the key's pose, starting at beat `at` and taking `over` beats with its `ease`. `over: 0` snaps. A part or channel a key leaves out is held, so a key names only what changes |
| `springEase(over, freq, damping)` | An ease that overshoots and settles: a body with weight arriving. `over` must be the key's own |
| `mixPose(a, b, k)` | Between two poses; `k` may pass 1 |
| `addPose(base, ...layers)` | Layers on top: turns, offsets and channels add, scales multiply. Breathing, sway, a look, a blink |
| `loopAt(t, period, keys)` | A cycle: the keys cover one loop and are played round and round. The last pose must equal the first |

A hold is not a key: it is the gap before the next key. Write the pose, then leave it alone for a beat or two.

The keys of a shot are written in beats of the scene clock (`sceneClock` in `kit-frame.ts`), so that poses land on the music. A pose is data: write the keys of a performance as a table near the top of the shot, not as code spread through `render()`.

```ts
const ACT: PoseKey[] = [
  { at: 0,    pose: BEAR.stand },
  { at: 3.5,  pose: { parts: { armR: { r: 0.4 } } }, over: 0.5, ease: ease.inOutQuad },           // anticipation
  { at: 4,    pose: { parts: { armR: { r: -2.6 } }, ch: { mouth: 1 } }, over: 1, ease: springEase(1) }, // the wave
  { at: 7.25, pose: BEAR.crouch, over: 0.75 },
  { at: 8,    pose: BEAR.leap, over: 0.5, ease: ease.outQuad },                                      // on the drop
];
const pose = addPose(BEAR_RIG.pose(k.beats, ACT), { ch: { blink: blink(f.t, BEAR_SEED) } });
BEAR_RIG.draw(c, pose, { x: 540, y: 1300, scale: 3 }, k.beats);
```

### Life on top of the keys

| Principle | In the kit | How to use it |
|---|---|---|
| Overlap and follow-through | `lag`, `tip` and `drag` on a part | Hair, ears, a tail, a scarf, a cape: the part takes its own keyed pose from `lag` beats earlier, so it arrives after the body and keeps moving when the body stops (0.1 to 0.3 beats). Give it a `tip`, the point of its free end, and it also swings back against the way its pivot moved over that time, so a tuft trails when the head turns even though the tuft itself has no keys; `drag` sets how far. A chain of parts each with a little more lag makes a tail wave |
| Squash and stretch | `squash(amount)` | A body squashes before a jump and on landing, stretches in flight. Keep the area: the helper does. Hard things (a helmet, a sword) do not squash |
| Secondary motion | `lag`, `wander`, or a simulation | A small thing answers the large one: the belly after a landing, the hat after a turn. Cloth and long hair that must collide are simulated once in `init()` and looked up by time (`effects.md`, section 2) |
| Idle life | `wander(t, amount, rate, seed)` | Seeded drift for a sway, a head that tilts, eyes that look about. A character that stands perfectly still between keys looks switched off |
| Breathing | a scale on the body from the beat | One breath a bar, 1 to 2 percent. Under any hold |
| Blinks | `blink(t, seed, every, dur)` | Pass seconds (`f.t`) so eyes blink off the beat, as eyes do. Each character its own seed. Blink on a change of thought: a key of the performance may add a blink of its own |
| Reaching and planting | `reach(ax, ay, tx, ty, l1, l2, bend)` | Two bones to a point: legs to feet planted on the ground, a hand to a door handle. It gives the upper and lower turns. The knees of a character facing right take `bend` -1 |
| Grounding | `Rig.plant` | For legs keyed by turns rather than by `reach`: moves the character so the lowest sole touches the ground |

A character's feet are on the ground only if the code says so. Key the hips, and let `reach` put the legs between the hips and feet that stay where they were put. The same goes for a hand on a railing, a paw on a mooncake, two hands on one sword.

### What a part may draw

A part's `draw` gets `s.pose` (its own pose), `s.ch` (the channels) and `s.t` (the time). The face reads the channels; a mouth may bend with `s.ch.mouth`; a costume may switch with a channel. Anything a part draws must come from these and from constants of the cast file, never from the wall clock or from an unseeded random source.

## 5. Acting

### A pose per beat of the story

Acting is a string of poses, each one a readable statement, with moves between them. Find the poses first, then the timing.

| The character feels | Body | Head and face |
|---|---|---|
| Joy | Up and open: arms up or out, weight on the toes, a hop | Head up, eyes wide or squeezed in a smile, mouth open |
| Sadness | Down and closed: shoulders forward, arms hanging, weight low | Head down, lids half closed, brows up in the middle, mouth down |
| Anger | Forward: leaning in, fists, feet apart | Chin down, brows down and in, mouth square |
| Fear | Back and small: leaning away, arms in, one foot back | Eyes wide with small pupils, brows up, mouth open and tight |
| Surprise | A take: a squash down, then a stretch up, and a hold | Eyes as wide as the design allows, brows high, mouth round |
| Pride | Chest out, chin up, weight back | Eyes half closed, a small smile |
| Wanting | Leaning towards the thing, a hand reaching | Eyes on the thing, never on the camera |
| Deciding | Still. Then one small move | A look away and back; a blink on the change of mind |

### Timing on the music

| Principle | Rule |
|---|---|
| Key poses on beats | The pose that says the thing lands on a beat. The drop is the pose that matters most in the section |
| Anticipation | A small move the other way, half a beat before the move. The larger the action, the larger the wind-up |
| Holds | After an important pose, hold it a beat or two, with only idle life moving. The viewer needs the hold to read the pose |
| One action at a time | The main action leads; the others wait or follow. A character whose every part moves at once is read as noise |
| Arcs | Hands, heads and thrown things travel on curves. A turn about a pivot gives an arc by itself; a move by `x`, `y` does not |
| Faster than life | Moves take fewer frames than life, holds more. On a fast track, a move of half a beat is already slow |
| Reaction after action | The one who is hit reacts a fraction of a beat after the hit, on the off-beat |

### Reading the face at the frame size

| The face in the frame | What can act |
|---|---|
| The head is a tenth of the frame's short side or less | The body only. Face details are not seen; a blink is not seen |
| A fifth | Eyes, eye direction, a large mouth |
| A third or more (a close shot) | Brows, lids, a small smile, a tear |

A story beat that lives in the face needs a close shot. Plan it in the storyboard's camera column. A face that must be read in a wide shot is not read.

Where a character looks is where the viewer looks. Every character that is not the centre of attention looks at the one that is, or at the thing that matters. Eyes aimed at nothing make a character seem dead.

## 6. Cycles

| Cycle | Poses | On the grid | Faults |
|---|---|---|---|
| Walk | Contact, down, passing, up, for each foot: eight poses a stride | One step per beat at about 100 to 130 beats a minute; on a faster track, one step per two beats | Feet that slide: the ground (or the camera) must move exactly as fast as the planted foot moves back |
| Run | As the walk, with a moment in the air and a forward lean | One step per half beat or per beat | No moment in the air reads as a fast walk |
| Sneak | High knees, long holds on each step | Steps on the off-beat | |
| Idle | A breath, a shift of weight, a look | A breath a bar; a shift every two or four bars | A loop that is visible because it is too short |
| Dance | The poses of the choreography | Poses on beats, moves between them | Every dancer in unison with no offset reads as copied |

Make a cycle's period a whole number of beats, so it lands on the grid wherever it starts. A walk across the frame moves the character's place by the ground speed times the time; a walk in place moves the ground or the camera by the same amount. Write the ground speed in the cast file with the cycle, as the stride length divided by the time a foot is planted.

In the air, legs hang towards the ground; on the ground, the planted foot does not move against the ground. Both come for free when the legs are put in place by `reach`.

## 7. Several characters in one shot

| Rule | Why |
|---|---|
| Each character its own seed | Otherwise they blink together and sway together, which reads as one machine |
| Offsets between them | Two characters who do the same thing do it a fraction of a beat apart, unless "together" is the point |
| One is the centre of attention | The others look at them, hold, or react. Two characters acting at once split the eye |
| Screen direction holds | If A stands left of B in one shot, A stands left of B in the next. The storyboard writes where each character stands and which way they face, per section, and a crossing of that line is shown on screen |
| Contact is computed | A hand on another's shoulder takes the point from `point` of the other rig, then `reach` |
| Order in depth | Characters are drawn back to front; a character that crosses in front of another changes order at a moment written in the keys |
| Crowds are made, not drawn | Backup dancers and crowds come from the cast file with a seeded generator of small variations: size, a colour from a short list, a phase offset. Never copies that move in unison |

A fight is a conversation: action, reaction, a hold, again. Put each blow on a beat and each reaction on the next half beat, stage the two fighters on one line across the frame, and give the hits their accents from `effects.md` (impact frames, shake, flash) and a smear drawn by the shot for the fast limbs. Choose the winner in the storyboard and let every exchange before the end point towards it.

### Lip-sync, honestly

The starter has no lip-sync. A mouth that opens and closes on the words of a voice is possible and is not built. What it would need:

| Needed | From where |
|---|---|
| The times of the sounds of speech (phonemes), or at least of the words | Word times exist when a lyrics file is loaded: `ctx.lyrics` (`src/engine/lyrics.ts`) holds words with start and end times, and syllables when the data has them. Phoneme times need a forced-alignment tool that is not part of the starter |
| A small set of mouth shapes | Six to nine per character: closed (m, b, p), open (a), wide (e, i), round (o, u), teeth on lip (f, v), and rest, drawn in the cast file as values of the `mouth` channel |
| A mapping and smoothing | Each sound to a shape, each shape held at least two frames, the shape a frame early, small shapes dropped |

Without phoneme times, a mouth that opens on each word and closes between words is the most that can be done, and on a close shot it looks cheap. Prefer stories without dialogue, a voice over a character whose mouth is not seen, or sung lines shown as words (`type-and-captions.md`). A voice track and its timings are the subject of `references/sound-and-voice.md`.

## 8. A character in 3D

When the request asks for three.js, a toy or clay look, a character seen from every side, or an orbit round a hero.

| Part | How, in this engine |
|---|---|
| Where it draws | A three.js scene rendered into a target of the shot's own, `makeRT(W, H, { samples: 4 })`, cleared to alpha 0, then composited onto the frame with `premult: false` (`engine-architecture.md`, section 4) |
| The body | Rigid parts from primitives (spheres, capsules, rounded boxes), each in an `Object3D` group whose origin is its pivot. The groups are the parts of the rig; a pose sets their rotations. The keys work as in 2D: write a mix for the pose record of the 3D parts and use `poseAt` of `kit-camera.ts` with it |
| Toon shading | `MeshToonMaterial` with a `gradientMap` of three or four steps: a small `DataTexture` with `NearestFilter` on both filters, so the steps stay hard. Colours in linear light from `LIN` of the palette |
| Light | A key light, a sky light (a hemisphere light) and a rim light in the character's hue from behind. The rim is what separates a dark character from a dark ground |
| The outline | Two ways. The cheap one draws each mesh a second time with its back faces, pushed out along the normals, in flat ink; its width is uneven and it breaks at sharp corners. The better one renders normals and depth into a second target and finds edges in a full-screen pass: thick where depth jumps (the silhouette), thin where the normal turns (creases). Keep the depth test loose and rely on the normals, or slanted surfaces fill with thin stripes. three.js also ships an outline effect of the first kind among its add-ons |
| The face | Eyes as flattened spheres or discs with pupils that turn to look; lids as half spheres that close; a mouth drawn on a `Layer2D` and used as the texture of a small plane in front of the head. The face channels of section 2 drive them |
| The shadow | A soft ellipse on the ground that shrinks and fades as the character rises. It is what makes the character stand |
| Toy and clay | A physically based material with high roughness and no metal; a light that wraps a little round the form (a warm fill from below and behind fakes light passing through clay); a soft dark contact shadow wherever two parts or a part and the ground meet; a very small noise on the normals for fingerprints. Round every edge: nothing made of clay is sharp |
| Post | Toon looks want little bloom. Keep the outline under the bloom threshold, or it glows |

Skinned meshes, where one surface bends over bones, are possible in three.js, but a skinned model is made in an outside tool and brought in as a file. That is outside the code-only route and needs the owner's assets or approval. Rigid parts with round joints are the honest code-only look: a toy, a figure of clay, a wooden doll.

## 9. Keeping a character the same across shots

| Risk | Guard |
|---|---|
| A builder redraws the character "a little better" | The cast file is the only drawing. The builder brief says so |
| Its size drifts from shot to shot | The cast file lists the character's height in each shot size. The storyboard's camera column names the shot size |
| Colours or line weights change | Both live in the cast file. A shot that tints the character for a light change says so in the storyboard |
| It faces the wrong way after a cut | The storyboard's screen direction per section |
| Details come and go (a chest mark, a scarf) | The checklist of marks at the top of the cast file, read at every review |
| Its manner changes (quick in one shot, slow in another) | The cast file holds the character's own timing: how fast it moves, how long it holds |

In review, put a still of each shot beside the line-up still of the cast. Look at height, marks, colours and line weight before anything else.

## 10. Telling a story without words

### Shapes by length

| Length | Shape | Example structure |
|---|---|---|
| 15 to 30 seconds | One gag, or one wish granted. Setup, twist, reaction | The want in the first two seconds; one try; the surprise on the drop; a reaction held to the end |
| 45 to 90 seconds | Want, tries that fail and grow (three of them), the turn, the pay-off, a button | Each try a phrase of the music; the turn on the biggest drop; the button in the last bar |
| 2 to 4 minutes | A small arc: the character is changed at the end. A second character or a subplot, a callback | Acts on the sections of the track: setup in the intro, trouble through the verses, the low point in the break, the turn on the last drop, the new normal in the outro |

A button is one small beat after the end: the gag's echo, the character's last look at the camera, the thing that was lost turning up. It is what viewers remember.

### Making a story read without words

| Tool | Use |
|---|---|
| Show the want at once | The character looks at the thing, then reaches for it. In the first three seconds of a short, the first shot of a longer film |
| Eyelines and point of view | A shot of the character looking, then a shot of what they see. The viewer understands by joining the two |
| Cause and effect in one frame | The action and its result in the same shot, or in two shots cut on the action |
| Reaction shots | Another character's face tells the viewer how to feel about what just happened |
| Objects as words | A letter, a heart, a photo, a clock, a sign on a door. Choose objects that the viewer's life already knows |
| Pictograms | A thought bubble with a picture in it, an arrow, an icon over a head. Sparingly |
| The rule of three | The first time sets up, the second confirms, the third breaks the pattern |
| Plant and callback | Show a thing early for no clear reason (a pomelo rind hat, a stuck drawer); bring it back at the turn, changed. The callback is the most satisfying moment a short can offer |
| Contrast in scale and colour | The small against the large, the lit against the dark: the viewer reads power and loneliness without a word |
| Screen direction | Moving right reads as going forward; moving left as going back or home. Keep a journey going one way |

### Sound tells half the story

In a film without words, sound carries what the picture cannot: what happens off screen, what something weighs, what a character feels before the face shows it. Plan it shot by shot in the storyboard, not at the end.

| Sound | Tells |
|---|---|
| An effect from off screen | Something is coming: a knock, a crash, a meteor, a bell |
| Silence before the reveal | "Look now." The breath of `transitions.md` in sound |
| A motif per character | Who this is, even when unseen. It changes key or instrument when the character changes |
| Foley on every contact | Weight: a footstep, a landing, a slap, paper |
| The music dropping out | The low point. The music's return is the turn |

In a film cut to one finished track, the music carries the feeling and the pictures carry the plot; effects can still be added over it where the owner wants them. Sound written in code, effects and a voice are the subject of `references/sound-and-voice.md`.

### In the storyboard

Every shot's `see` names the story beat and the feeling, not only the picture: "The pig finds the mailbox empty. Disappointment: ears drop, a long hold." The `move` puts the key poses on beats. The `camera` column names the shot size the acting needs (section 5). A story film is approved on the animatic like any other film, and it is worth reading the story aloud to the owner shot by shot before that: if it does not work as a list of sentences, it will not work as pictures.

## 11. Faults to look for in stills

Look at stills taken at the beats of the key poses, pairs of stills a beat apart for cycles, and the line-up still beside each shot. Look at one still reduced to the size of a phone screen for faces.

| Fault | How it shows in a still | Cause | Fix |
|---|---|---|---|
| Floating feet | A gap between sole and ground, or no contact shadow | The hips were keyed and the legs were not put to the ground | Put the legs in place with `reach`, or move the character with `Rig.plant`; draw the contact shadow |
| Sinking feet | A foot below the ground line | Same | Same |
| Sliding feet | In two stills a beat apart, the planted foot has moved against the ground | Ground speed and stride do not agree | Take the ground speed from the cast file's cycle |
| Limbs that stretch | A forearm longer in one still than in another | A hand was moved by `x`, `y` instead of turning its bones | Turn the bones; use `reach` for a hand that must reach a point |
| Joints that open | A gap or a sharp corner at an elbow or a knee | The parts were cut with no overlap at the pivot | Round ends that overlap the pivot, or a joint drawn as a circle |
| The same face on everyone | Two characters told apart only by colour | One face drawing shared | Each character its own eye shape, spacing, brows and mouth in the cast file |
| The character changes between shots | Height, marks, line weight or colour differ from the line-up | A builder drew it, or scaled it freely | Draw only from the cast file; sizes from its table |
| Twinning | Both arms or both legs in the same pose, mirrored | Keys copied from one side to the other | Offset one side in time, or change its pose |
| A silhouette that does not read | The pose filled black says nothing | Arms in front of the body, a pose seen straight on | Turn the character three-quarter; move the arms out of the body's outline |
| Dead eyes | The character looks at nothing, or at the camera without reason | No eyeline | Aim the `look` channel at what matters |
| Switched off | No part moved between two stills of a hold | No idle life | Add `wander`, breathing and blinks under the hold |
| Popping | A pose changes completely between two frames | A key with no `over` where none was meant | Give the key a move, or put the snap on a cut |
| Everything at once | Every part in motion in every still | No holds, no leading action | One action at a time, holds after key poses |
| Weightless landing | The body lands with no squash, no dust, no dip | No squash on contact, no anticipation | `squash` on landing, a dip of the hips, dust from `effects.md` |
| The face cannot be read | The head is a small dot in a vertical frame | A face beat staged in a wide shot | A close shot for that beat |
| Crossed screen direction | A character stands on the other side after a cut | No direction per section | Write sides and facing in the storyboard |
| A mouth that flaps without a voice | The mouth moves with nothing heard | A channel left running | Mouth moves only on sounds that are heard |
| Mixed pixel sizes (pixel art) | Some pixels larger or softer than others | A part drawn at full resolution, or a rotated sprite | Draw everything on the small canvas of `kit-pixel.ts`; see `art-styles.md` |

The owner judges the acting on the animatic and on a sample section with the characters built. A character the owner does not like is changed in the cast file, once, and every shot changes with it. That is the reason for the file.
