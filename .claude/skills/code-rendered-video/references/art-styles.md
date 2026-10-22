# Art styles

A catalogue of looks that code can draw, grouped by where they come from, with what each suits and what it costs. It also gives the few things a film must hold constant so that it may vary everything else, and recipes by kind of film.

Load this when: writing the treatment, choosing the idiom of each section in the storyboard, briefing a builder on the look of a section, or judging whether a shot is "out of design".

## 1. How style works in this method

| Principle | Meaning |
|---|---|
| Lock little, free the rest | A film is held together by a few fixed rules, not by one style. Three are enough: the role of one colour, where words may stand, and that events land on the beat |
| Borrow an idiom | Each section borrows the look of something that exists: a printed thing, a machine, a material. It then builds that look with means the original never had (depth, light, a flying camera, shaders) |
| The idiom belongs to the subject | A subject has its own paper. A kitchen has order tickets, a building has blueprints, a journey has maps and tickets. An idiom taken from the world of the subject explains before a word is read |
| One colour means one thing | The signal colour marks the thing that IS the idea of the section, and nothing else. A shot about the problem has no signal colour in it |
| Drawn beats bare | A plain box, a featureless figure, a flat slab is a placeholder, not a picture. Every surface the viewer sees is drawn: line weights, hatching, texture, lettering |
| Light and dark take turns | Grounds alternate between light and dark from shot to shot, so the eye is woken at the cut |
| The owner may forbid a single style | If the owner says "do not lock a style", take it literally: each section gets its own idiom, and the constants above carry the unity |

From practice: the look of the reference film the owner admired was described by the owner as "retro mixed with modern". That is the second principle. It had no style guide beyond a palette and two typefaces; every scene borrowed the look of a different old printed thing.

## 2. Choosing

1. **Write down the world of the subject.** What objects, papers, screens and places belong to it? List ten. These are the candidates.
2. **Fix the tone.** Serious or playful, warm or cool, loud or quiet, for whom. The tone removes half the candidates.
3. **Give each section one idiom** from what is left, and no idiom to two sections.
4. **Hold the idioms against each other.** Two sections that use the same prop (tickets, a shop screen, a phone) will be taken for one another. Change one.
5. **Check the cost.** A look that needs a refraction shader or a simulation is worth it for the hero of the film, not for a passing shot.
6. **Check the frame.** A vertical frame wants tall subjects and stacked layouts. A look made of wide panoramas fights it.
7. **Build one section as a sample** and let the owner see it before the rest is built.

## 3. The catalogue

Columns: **Build with** names the drawing surface: a 2D canvas layer, GPU line batches, a full-screen shader, a 3D scene, or the page itself (HTML, CSS, SVG: the HyperFrames route). **Moves like** is the motion the look asks for.

### 3.1 Paper and print

| Style | Looks like | Build with | Moves like | Suits | Watch out |
|---|---|---|---|---|---|
| Blueprint | Pale lines on deep blue or dark teal, grid, dimension lines, a title block, room names in capitals | 2D layer or line batches; hatching where a wall is cut | Lines draw themselves; rooms light up one by one; the camera travels over the sheet | Buildings, systems, infrastructure, anything "as built" | Hairlines vanish on a phone. Use line weights: heavy for cut walls, fine for furniture |
| Patent engraving | Shading by hatch lines that follow the light, leader lines to small numbered labels, "FIG. 3" | Shader that engraves a 3D object, or hatched 2D | Turntable, cut-away, parts pulled apart | Mechanisms, devices, connectors, hardware | Hatch that scales with the object makes moiré. Keep its pitch fixed on screen |
| Risograph | Two or three spot colours, slightly out of register, coarse dot screens | Halftone shader, multiply blending | Layers of colour slide into register | Culture, fashion, playful explainers | Dot pitch against resolution; multiply in linear light darkens more than expected |
| Wood type poster | Huge slab letters, uneven ink, two colours | 2D layer with an ink texture | Words stamped, one per beat | Statements, titles, recaps | Letters larger than the frame must still be read |
| Newspaper, editorial | Columns, a headline, a pull quote, a halftone picture | 2D layer or the page | The camera moves down a column; headlines replace each other | News, history, data journalism | Too much small text |
| Thermal receipt | Dot-matrix type on a paper strip with a torn edge | 2D layer, a dot face | The strip prints line by line and is torn off | Shops, orders, logs, anything counted | Accents break in a coarse dot face. Use a larger dot or another face for words with diacritics |
| Ticket, punch card | Perforations, punched holes, a stub, a stamp | 2D layer | Punched on the beat; slid into a slot | Choices, options, access, travel | Small labels |
| Order form, slip | Printed steps, boxes to tick, a field per choice | 2D layer | A marker moves from step to step; boxes are filled on the beat | Processes, configuration, anything built from choices | The form must stay readable when the camera moves |
| Tailor's pattern | Dashed cutting lines, notches, grain arrows on tissue | 2D layer, woven ground | Pieces are cut out and assembled | Sets, fitting, templates, fashion | |
| Assembly manual | Exploded views, steps numbered in circles, arrows that show the direction of fitting | 3D scene with outlines, or 2D | Parts separate along an axis and come together | Layers, how a thing is put together | Arrows and numbers are not in most typefaces: draw them |
| Folded map | Roads, a park, pins A and B, a legend, fold lines | 2D layer; routes as glowing lines | Routes draw from A to B; the camera flies over | Journeys, a choice among ways, networks | A map is wide. In a vertical frame turn it or crop it |
| Ledger, graph paper | Ruled lines, handwritten figures, a margin | 2D layer | Figures are written, struck out, totalled | Money, experiments, arithmetic | |
| Stamp, seal | A round or boxed stamp, ink uneven at the edge | 2D layer | Slams down on the beat, with a jolt | An accent: approved, done, refused | One per shot at most |
| Cut paper, collage | Layers of paper with hard shadows | 2D layers with drop shadows, or 3D planes | Pieces slide and drop; a little bounce | Children, stories, friendly explainers | Shadows must all fall one way |
| Pop-up book | Folded planes that stand up from a page | 3D planes | Pages open and the scene rises | Stories, small worlds | |
| Zine, photocopy | Hard contrast, toner noise, torn edges, tape | 2D layer with threshold and noise | Jump cuts, shaking frame | Music, protest, counter-culture | |
| Woodcut | Bold black shapes cut by white lines | 2D layer | Slow reveals, heavy stamps | Folklore, history, strong statements | |
| Blackboard | Chalk lines on dark green, smudges, eraser marks | 2D layer with a rough stroke | Written by hand; wiped | Teaching, recipes, mathematics | |
| Whiteboard | Marker strokes, arrows, a highlighter | 2D layer | Drawn fast, circled, underlined | Planning, start-up explainers | Reads as a stock explainer if nothing else is done |
| Notes on a board | Sticky notes, pins, string | 2D layer | Notes are moved between columns | Planning, ideas, sorting | |
| Cards | Playing cards, flash cards, index cards | 2D layer or 3D planes | Dealt, flipped, fanned | Options, comparison, a quiz | |

### 3.2 Drawing and illustration

| Style | Looks like | Build with | Moves like | Suits | Watch out |
|---|---|---|---|---|---|
| Monoline | One even line weight, flat fills | 2D layer, SVG | Lines draw on; shapes pop | Friendly business explainers | Generic without an idea of its own |
| Flat shapes | Filled shapes without outlines | 2D layer, SVG | Shapes slide and scale | Products, services | The look of a thousand template videos |
| Isometric | A 30 degree grid, small worlds seen from above | 2D layer on an isometric grid, or 3D with an orthographic camera | Things travel along the grid; blocks rise | Systems, logistics, cities, infrastructure | Text on isometric planes is hard to read: keep labels flat |
| Architect's axonometric, section | Walls with thickness, floor patterns, door swings, furniture, figures | 2D layer with a projection, or line batches | Turns slowly; tilts flat into a plan | Households, offices, who is where | Without hidden-line removal things show through each other |
| Boiling line | Hand-drawn lines that are redrawn every two or three frames | 2D layer with seeded jitter, stepped in time | Alive even when still | Warm, personal films | The jitter must be seeded from the frame number, never random |
| Ink and wash | Soft edges that bleed, paper grain | Shader or layered 2D | Colour spreads from a point | Nature, feeling, stories | Costly to make convincing |
| Silhouette | Black shapes against a bright ground | 2D layer | Figures rise, raise arms, walk | Crowds, drama, people without faces | A silhouette as the only figure in a drawn scene reads as unfinished |
| Filled figures | Simple bodies in a posture each, a family of them | 2D layer | Small gestures on the beat | Any shot with people | Draw them once, in one file, and use them everywhere |
| Pictogram | One icon repeated to show a quantity | 2D layer | Icons fill in row by row | Statistics | |
| Comic | Panels, speed lines, halftone, impact frames, speech balloons | 2D layer, halftone shader | Panels slam in; impact frames in negative | Action, humour, conflict | |
| Cartoon | Round, heavy shapes with a dark outline of one colour, flat fills with one shadow step, big eyes | 2D layer with the rig (`characters-and-story.md`), or a 3D scene in toon shading | Squash and stretch, anticipation, overshoot, holds | Stories, mascots, reward reveals, children | Every character its own face. A dark ground under a dark outline loses the outline: give the character a rim |
| Anime, cel | Clean line of varying weight, two-tone cel shadows with hard edges, large eyes with highlights, speed lines, dramatic skies | 2D layer with the rig; backgrounds painted in gradients; or a 3D scene in toon shading with an edge pass | Held poses, sudden fast moves with smears, impact frames, a camera that pans over a still | Trailers, fights, drama | Faces drawn in code look stiff next to hand-drawn anime. Keep faces few and large; let poses, effects and camera carry the action |
| Stick figures | One heavy line per limb, a round head | 2D layer with the rig | Big, clear action poses; smears; impact frames | Fights, battles, comedy, quick explainers | A stick figure has no silhouette of its own: every pose must read by its limbs alone |
| Stop-motion, drawn | A drawing that changes on twos or threes, paper grain, a hand-made wobble | 2D layer, poses stepped by the frame clock, boiling line | Stepped: 8 to 12 poses a second | Personal stories, first-person explainers | The steps must be taken from the frame clock, never from the song time |
| Sand animation | Pale sand on a lit glass table, or dark sand on light; pictures that wipe and grow into the next | Full-screen shader for the grain and the light through it; the pictures as masks drawn on a 2D layer and blurred | One picture becomes the next by wiping, pouring and scratching lines, never by cutting | Histories, legends, a life told in one flow | Slow by nature. A long film needs a story that flows from picture to picture. See section 3.8 |
| Painterly brush strokes | Short thick strokes of paint that follow the form and the flow of the scene, as in Van Gogh's skies | Thousands of short strokes in a line batch (`src/engine/lines.ts`), each placed on a seeded grid, turned along a flow field and coloured from the picture beneath; or a full-screen pass that smears the picture along the flow. See section 3.8 | The strokes flow slowly along the field; boiled on twos | Dreams, art history, nature, feeling | Strokes of one size look like a filter. Large strokes in the sky, small ones on the subject |
| Pencil, graphite | Grey strokes with the grain of the paper showing through, hatching in the shadows, construction lines | 2D layer on the paper ground; strokes jittered and broken by paper grain; hatch in shadows (the `hatch` function of the shader library in `src/engine/glsl/common.ts`) | Drawn on, then shaded; lines boil a little | Sketches, ideas, plans, an artist's notebook | Pure grey on white looks like a wireframe. Vary the pressure along every stroke |
| Ballpoint | Blue lines in dense cross-hatching, pressure visible, a lined page | 2D layer; many thin strokes with a slight wobble; darker where they cross | Hatched in on the beat, layer after layer | School, notes, doodles in a margin | Dense hatching is many strokes: use a line batch when they number in thousands |
| Crayon and felt pen | Waxy colour with the tooth of the paper breaking it; felt pen flat and bright, darker where two strokes overlap; a child's drawing | 2D layer; crayon as a fill masked by paper noise with rough edges, felt as flat strokes composited with `multiply` so overlaps darken | Scribbled in; stepped on twos | Children, kids' television, humour, "made by hand" | Keep the drawing naive but the composition designed |
| Wobbly line, chunky type | A hand-drawn line that wobbles, big rounded letters with a hard offset shadow in a second colour | Boiling line for the drawing; type set in the display voice, with a copy of it shifted by a few px behind in the shadow colour | Everything boils on twos; words pop with a bounce | Friendly explainers, social pieces, a brand with a playful voice | The offset shadow must fall one way for the whole film |
| Cut-out puppets | Figures cut from paper or photographs, pinned at the joints, moving on twos, over printed backdrops | The rig (`src/scenes/parts/kit-rig.ts`) with pictures or paper shapes as parts; poses stepped with the frame clock | Jerky hinged moves, sudden big things from off screen | Satire, history, surreal humour | Smooth motion kills the look: step it |
| Shadow theatre | Black puppets on rods behind a lit screen, warm light through the screen, soft edges where a puppet leaves the screen | Rig parts drawn black; blur growing with distance from the screen (draw far puppets on a layer with a lower backing scale) | Puppets glide and turn; the light flickers | Folk tales, legends, a quiet story | Keep the rods: they make it a theatre |
| Manga treatment | Black and white, screen tones, speed lines, ink splatter, sound effects lettered in katakana (ドドド), a speech bubble | 2D layer; a threshold of the picture to black and white, dot tones from the ground's halftone, lettering drawn as big shapes | Freeze on impact, speed lines behind the subject, a sound effect that slams in | Action, drama, parody | Katakana needs a face that has them. Check that the film's fonts carry the glyphs before designing on them |
| Symmetric pastel tableau | A centred composition in a flat frontal view, pastel colours, everything placed as on a stage | 2D layer or an orthographic 3D camera, laid out on a centre line | Straight moves along the axes, whip pans between tableaux, deadpan holds | Stories, quirky brands, chapters of a list | Symmetry must be exact; a small error looks like a mistake |
| Paper cut with light | Layers of cut paper at depths, light shafts through gaps (god rays), out-of-focus specks of light in front (bokeh) | Stacked 2D layers with drop shadows; the rays as soft wedges added in light; bokeh as soft discs on a layer with a low backing scale | Slow parallax as the camera slides; dust in the rays | Storybook, festivals, premium explainers | The paper must stay paper: rays and bokeh are added light, never over the paper's edges |
| Sticker | A thick pale outline and a drop shadow round each thing | 2D layer | Things land with a bounce | Titles, social films, icons of a recap | |
| Cut-away | A thing cut in half, its inside shaded by section lines | 2D layer | The cut opens; the inside fills with colour part by part | The inside of a machine | The viewer takes a drawing at its word: do not draw what would be wrong in life |
| Diagram | Boxes, connectors, labels, given depth and weight | 2D layer or a light 3D | Parts slide in and out; connectors re-form | The "in your app" shot of an explainer | Small and flat, it reads as a slide. Make it fill the frame and let one thing happen |

### 3.3 Screens and machines

| Style | Looks like | Build with | Moves like | Suits | Watch out |
|---|---|---|---|---|---|
| Terminal | Green or amber monospaced text on black, a cursor, scanlines | 2D layer, post scanlines | Typed, scrolled | Developers, logs | Code on screen loses viewers who do not read code |
| Television, tape | Curved glass, scanlines, tracking errors, colour bleed | Post chain | Rolls, tears, switches off to a dot | Nostalgia, replays | |
| Radar, oscilloscope | A sweeping line on a round grid, blips, phosphor that fades | Shader or line batches | The sweep turns with the bar; blips light as it passes | Broadcasting, subscribers, detection, monitoring | |
| Flip board, dot display | Split-flap letters, flip dots, seven-segment digits | 2D layer | Letters clatter round to the word | Menus, timetables, counters, names | |
| Early computer screen | One-bit graphics, bevelled windows | 2D layer | Windows open with a zoom of outlines | History of computing, humour | |
| Pixel art | Large pixels on one grid, a palette of 16 to 32 colours, no soft edge anywhere | A small canvas at the art's own resolution, laid on the frame at a whole-number scale: `PixelLayer` in `src/scenes/parts/kit-pixel.ts` | Stepped: 8 to 12 poses a second while the film plays at its own frame rate | Games, retro, small characters, a wizard casting a spell | Any soft edge, free rotation, bloom or grain breaks the grid. See section 3.8 |
| Vector arcade | Thin glowing lines on black | Line batches with bloom | Fast, rotating | Music, space, minimal films | |
| Instrument display | Thin lines, brackets, read-outs | Line batches, 2D layer | Brackets lock on; numbers tick | Analysis, machines that see; the showreel HUD (below) | Decoration without meaning. Every read-out should say something true |
| Showreel HUD | A timecode that runs, a frame counter, "120 BPM · 60 FPS", crop marks at the corners, a chapter label "04 / 07", a thin progress bar | 2D layer, usually in the overlay (`src/scenes/overlay.ts`), in the machine voice; every value worked out from the frame clock and the film's data | The values run with the film; the chapter changes on the cut | Showreels, motion pieces that talk about their own making, technical launches | Allowed as a designed system whose values are true and move with the film. It is a fault when it is decorative, false, or put in the corners as filler, and it is dropped when the owner or the prompt bans it |
| CRT and demoscene | Curved glass, scanlines, glowing phosphor; raster bars of colour, a twisting ribbon of text, a bitmap font, a star field, a scrolling greeting | Full-screen shaders for the bars, the twister and the stars; a 2D layer for the bitmap font (or `kit-pixel.ts` at a low resolution); the curvature and scanlines as a post pass (see `effects.md`) | Everything in sine waves on the beat; the scroller never stops | Retro computing, music, a nod to the 1990s | The screen's curvature bends the safe area: keep words away from the corners |
| Launch type system | An off-white ground, a sans headline with one word in a serif italic in the accent colour, a small mono eyebrow with a dot, numbered sections ("02 —"), cards with large soft shadows, a browser window with three dots | 2D layer; the three type voices of `src/scenes/parts/kit-type.ts` given the brand's faces; shadows as blurred dark shapes under the cards | Words rise from a mask, cards stagger in, one accent moves | SaaS and developer-tool launches. The structure of such a piece is in `short-pieces.md`, section 7.3 | The most common look of the genre: it reads as a template unless the product's own screens and words fill it |
| Motion design about motion design | An easing curve editor with its handles, a keyframe timeline with diamonds and a playhead, handwritten annotations with arrows ("stagger: 45 ms"), before and after sliders | 2D layer; curves drawn from the eases of `src/engine/util.ts` themselves, so the curve shown is the motion seen | The playhead runs with the film; the annotated thing moves as its curve says | Showreels of a motion designer, explainers of animation | The annotations are the content here: they must be true to what moves |
| Game HUD | A health bar, a minimap, a hotbar, a timer, a score, a results screen | 2D layer over the scene | Numbers tick, bars drain, a banner slams in | Game trailers, parodies, reward reveals | A game itself is not a film of this method (`route-selection.md`); its trailer is |
| VHS over anime | An anime still or a cel scene with scanlines, colour bleeding sideways, a band of tracking noise, a timestamp | The picture on a layer; tape faults as a post pass (see `effects.md`) | The picture holds; the tape wobbles and tears on the snare | Nostalgia, lo-fi music, memes | The picture underneath must be good: the tape is seasoning |
| App screen | Cards, buttons, switches, a status bar, a device frame | 2D layer or the page | A finger or a cursor presses; the screen answers | The "in your app" shot; product demos | Two sections that both use a shop screen will be confused |
| Dashboard | Charts, large figures, small multiples | 2D layer or the page | Bars grow, figures count up | Business, results | |
| Code editor | Coloured syntax, line numbers | 2D layer or the page | Typed; lines highlighted | Developers only | |
| Node graph, circuit | Boxes and wires, pulses along the wires | Line batches | Pulses travel on the beat | Data flow, pipelines | A pulse that leaves one node for many is the picture of notification: use it only where that is meant |
| Neon grid | A glowing grid to the horizon, a sun, chrome | Shader | Endless forward travel | Music of the 1980s kind | A cliché; use with a twist |
| Text mode | Characters as pixels | 2D layer | Characters change to form pictures | Developers, retro | |

### 3.4 Light and material

| Style | Looks like | Build with | Moves like | Suits | Watch out |
|---|---|---|---|---|---|
| Glowing line | Lines that carry light on a dark ground | Line batches, bloom | Drawn on; pulsing with the kick | Networks, signals, energy, routes | Type must never glow. Added light must not push alpha above one |
| Low-poly | Faceted solids, flat shading | 3D scene | Slow orbits | Landscapes, simple objects | |
| Clay | Rounded solids, soft shadows | 3D scene | Squash and stretch | Friendly products, playful films | |
| Clay diorama on a plinth | A small isometric world of rounded clay objects standing on a round or square plinth, soft light, a price tag or a label card beside it | 3D scene with an orthographic camera at the isometric angle; rough materials with a warm key and a cool fill; a soft contact shadow under every object; labels on a 2D layer | Objects pop up from the plinth with squash; the plinth turns a little | Products, services, "how it works" in one picture, vertical ads | A plinth must stand on something: give it a shadow on the ground |
| Glass | Refraction, blur of what lies behind | Shader | Slow turns that show the bending | Premium products, modern screens | Costly. Keep it for the hero |
| Liquid glass and goo | Glass panels that bend what lies behind with coloured edges; blobs that merge and pull apart like a liquid; a drop that becomes a toolbar | A post or layer pass that refracts from a shape's distance field, and a blur-and-threshold pass for the goo: see `effects.md` | Blobs merge on the beat; a panel slides and the world bends under it | Modern interfaces, launch pieces, playful transitions | Refraction of a busy background is noise; put something simple and bright behind the glass |
| See-through vessel | A cup or a bottle with its contents visible | 3D scene with transparent materials | Filling, pouring | Food, drink, containers | Solid things inside a see-through thing are hidden unless they are also marked see-through and ordered |
| Toon | Flat colours in three or four steps, a dark outline, a rim light | 3D scene, toon materials, outline pass (section 3.8) | Snappy; squash and stretch; overshoot | Objects and characters with a comic feel, reward reveals, mascots | An outline drawn from back faces is uneven and breaks at corners |
| Matcap | One sphere of light wrapped over every surface | 3D scene | Any | A quick premium look | |
| Blocks | Cubes | 3D scene, instancing | Stacking, building | Building, data as blocks | |
| Point cloud | Thousands of points that form a shape | Instanced points | Assemble, scatter | Data, memory, machine learning | |
| Wireframe | Edges only | Line batches | Turning; wire to solid | Engineering, before and after | |
| Studio product | A turntable, soft reflections | 3D scene | One full orbit that stops dead | The hero of a product film | |
| Miniature | A small world with a shallow depth of field | 3D scene, blur by depth | Slow travel | Cities, logistics | |
| Ray-marched world | Endless shapes from distance functions | Shader | Flight | Abstract journeys, tunnels, scale | The heaviest of all on the graphics card |
| Light and fog | Beams, haze | Shader | Slow | Reveals, drama | |
| Stylised 3D world | A painterly or cel-shaded landscape: a big sky with clouds, hills fading into haze, water that mirrors the sky, grass that moves in the wind, the light of one hour | `Sky` of `src/scenes/parts/kit-ground.ts` for sky, sun, clouds and water in 2D; hills and trees on layers coloured with `hazed`; or a three.js scene with fog and a sky dome. See section 3.8 | Slow drift of the camera, clouds that drift, the hour that turns | Stories, games' trailers, calm pieces, seasons | A world without haze looks flat and small. Every layer further away is nearer the horizon's colour |
| Photoreal and physically based | Metal, glass, water and skin lit as in life, soft shadows, depth of field, light shafts | three.js with physically based materials, an environment light, fog, a blur by depth, light shafts as a post pass | Slow and heavy, like a real camera | Architecture, products, nature | The engine approaches it and does not reach it. It costs the most time and the most graphics power of any look, and one wrong material gives it away. True photoreal belongs to a 3D suite (`route-selection.md`). Say so to the owner, and offer a stylised version that code does well |

### 3.5 Generative and abstract

| Style | Looks like | Build with | Suits |
|---|---|---|---|
| Flow field | Thousands of lines that follow an unseen current | Line batches | Traffic, wind, streams of data |
| Interference | Waves from several sources that overlap into moiré | Shader | Signals that disturb each other, noise, conflict |
| Growth | Branches that grow by rule | 2D layer, line batches | Scaling, spreading, organic change |
| Swarm | Many small agents that move together | Instancing, simulated once and looked up | Crowds, users, markets |
| Cells | A plane divided into cells | Shader | Territories, partitions, clusters |
| Spread | Patterns that spread and eat each other | Shader | Biology, contagion, adoption |
| Tiling | Tiles of a few kinds that make endless patterns | 2D layer | Rules, combinations |
| Truchet tiles that flip | A grid of tiles each holding two quarter arcs, turned at random so the arcs join into endless paths; tiles flip in a wave and the paths re-form | 2D layer, or a full-screen pass that decides each tile's turn from a hash of its cell; the flip as a turn of the tile at a time that grows with distance from a point | Paths, choices, networks, a showreel's middle |
| Grid through a fisheye | A grid of tiles or dots that bulges as if seen through a lens, the bulge moving or forming a shape or a word | A full-screen pass that moves each pixel away from a centre by a curve of its distance before it looks up the grid; the shape of the bulge from a mask | Emphasis, a number revealed, a lens on data |
| Kaleidoscope | A picture mirrored in wedges round a centre, turning | A full-screen pass that folds the angle into one wedge before it looks up the picture | Music, trance, hypnotic loops |
| Tunnel, star field | Travel into depth | Shader | Transitions, time passing |
| Gradient field | Soft fields of colour that drift | Shader | Quiet backgrounds, premium films |
| Spectrum, waveform | Bars or a line that follow the sound | 2D layer from the audio data | Rarely. It is the first idea of everyone |

Generative looks are strong as ground and weak as subject. An explainer still needs a thing to look at.

### 3.6 Schools of graphic design

| Style | Looks like | Suits | Watch out |
|---|---|---|---|
| Swiss | A strict grid, a grotesque face, asymmetry, black, white and one red | Information, institutions | Cold if nothing moves |
| Constructivist | Primary colours, circles and triangles, strong diagonals | Manifestos, education | |
| Brutalist | Raw, huge type, harsh contrast | Bold statements | |
| Art Deco | Symmetry, gold lines, fans | Luxury, the 1920s | |
| Mid-century | Flat textured shapes, playful geometry | Friendly explainers | |
| Psychedelic | Wavy letters, clashing colours | Music | Hard to read |
| Memphis | Squiggles, confetti shapes, pastel with black | Youth, play | |
| Magazine | A large serif, generous space | Premium stories | |
| Kinetic type | Type and nothing else | Quotes, lyrics, manifestos | The film stands or falls with the words |
| Monochrome | One hue with black and white | Serious subjects | |

### 3.7 With photographs or footage

When pictures of the real thing exist, or may be generated. Generation that costs money is never started without asking the owner.

| Style | Looks like | Suits |
|---|---|---|
| Duotone | A photograph in two colours | Portraits, places |
| Halftone photograph | A photograph as dots | Print looks |
| Cut-out | Photographed things cut out and placed on a drawn ground | Collage, humour |
| Collage from photographs | Cut-out photographs with a white paper border, halftone or newspaper print, torn edges, tape, soft drop shadows, over photographed landscapes | Stories, "about us" films, travel, dreamlike journeys, infinite zooms. See section 3.8 |
| Halftone cutout with stamps and a ticker | Photographs as coarse halftone cut-outs, rubber stamps and labels slammed over them, a news ticker running at the foot, screenshots and captions in a brutal grid | Music videos, "internet brutalism", news parodies, memes. The pictures must be the owner's or of known licence (section 3.8) |
| Slow push on a still | A still that is slowly entered | History, quiet passages |
| Screen recording | The real screen in a device frame | Product demos |
| Layers in depth | A still split into layers that move apart | Depth from a flat picture |

On the engine route a photograph, logo or screenshot is drawn with `ImageTexture` and `drawPicture`, or on a canvas layer with `drawImageFit`, and a clip as an `ImageSequence` (`src/engine/media.ts`; `engine-architecture.md`, section 4). Files live in `media/`.

Films built mainly from footage, a website or a voice are better served by the HyperFrames route: see `hyperframes-route.md`.

### 3.8 Looks in detail

These are asked for often and have rules that are easy to break.

#### Pixel art at an integer scale

| Rule | How |
|---|---|
| One logical resolution | Choose the size of the art first: 128 by 96, 160 by 90, or for a vertical film 90 by 160 or 135 by 240. Everything is drawn on that small canvas, in its pixels |
| A whole-number scale | `PixelLayer` (`src/scenes/parts/kit-pixel.ts`) lays the art on the frame with each pixel exactly `factor` by `factor` output pixels, nearest neighbour, centred. By default the factor is the largest whole number that fits; the frame round the art keeps whatever the shot drew first. 135 by 240 fills a 1080 by 1920 frame at 8 |
| Everything on the grid | Positions are whole pixels. Draw with rectangles, `dot`, `pixelLine` and `sprite` (a sprite written as rows of characters looked up in a palette). A shape drawn with arcs, text or a turn gets soft edges; run `toPalette` after it, which puts every pixel back on the palette and makes alpha 0 or 1. Give it the shape's rectangle and only the shape's own colours and those behind it: snapped against the whole palette, the soft edge of a white moon on a night sky picked up green pixels in a test |
| A fixed palette | 16 to 32 colours, written once for the film. Every pixel comes from it. Lighting is done by choosing a darker or brighter entry, never by blending |
| Stepped motion | Work poses out from `stepTime(frameTime(f.t), 10)`: 8 to 12 poses a second, while the studio plays at the film's frame rate. Poses may be keyed and eased as usual and then quantised: first the pose, then the grid |
| Parts do not turn freely | A pixel sprite turned by an angle is resampled and loses its pixels. Draw the few angles a part needs as sprites, or build the character from rectangles whose corners are snapped after the pose is worked out |
| The finish off | Return `POST_PIXEL` from `render()`: no bloom, no halation, no grain, no colour fringing, no vignette. A glow is drawn in the art as a ring of a brighter palette colour |
| Shakes on the grid | A shake of one or two art pixels moves the art's drawing by whole pixels. The post chain's shake and zoom move the frame by fractions of an art pixel and blur the grid |
| Transitions | Plain cuts, and wipes that move by whole art pixels. The engine's punch and step zoom change the zoom of the finished frame and resample the pixels; a mosaic that grows by whole pixels is the native transition of the look |

Checked in stills of a test scene: a 128 by 96 night scene on a 1080 by 1920 frame came out at a scale of 8, centred, with the ground of the shot round it, every pixel square and sharp, and the corners the right way up. Reading the canvas back for `toPalette` makes the browser warn that repeated reads would be faster with a canvas made for it; at this size the cost is small.

#### Collage from photographs

| Rule | How |
|---|---|
| Where the photographs come from | The owner's own photographs; public-domain or openly licensed pictures, with the source and the licence recorded in the film's folder beside each file; or an image generator, which costs money and is started only with the owner's word, each time, with the cost named. Never a picture found on the web whose licence is unknown |
| Cut-outs | A cut-out is a picture with a transparent ground, prepared before the film is built and kept as a file. The white paper border is drawn by the shot: grow the cut-out's shape by a few pixels in white, then lay the picture on it |
| Print | Halftone for the newspaper look: a dot screen in a full-screen pass over the cut-out, or the paper-and-dots ground of `src/scenes/parts/kit-ground.ts` beneath. Black and white cut-outs over colour landscapes are a classic contrast |
| Paper | Torn edges drawn as a jagged outline from seeded noise, fixed per piece; tape as a pale translucent strip; one light direction for every drop shadow |
| Motion | Pieces slide, drop and bounce like paper; stepped on twos (12 or 15 poses a second) for the feel of cut-out animation; depth from layers that move at different speeds |
| Depth from one picture | A landscape split into three or four layers (sky, far, middle, near) moves apart as the camera pushes in. The holes behind the near layers must be filled when the layers are cut, not in the shot |

#### Toon and cartoon with an outline

| Part | 2D | 3D |
|---|---|---|
| Fill | Flat colour, one shadow tone as a shape, one highlight | `MeshToonMaterial` with a gradient map of three or four steps, filtered with `NearestFilter` |
| Outline | Outside heavy, inside thin, one dark colour for the whole cast | An edge pass from normals and depth: heavy on the silhouette, thin on creases. See `characters-and-story.md`, section 8 |
| Light | A rim of a lighter tone on the side away from the ground | Key, sky and a rim light in the section's hue |
| Shadow on the ground | A soft ellipse that shrinks as the thing rises | The same, drawn as a plane or on a 2D layer below |
| Post | Bloom low, and the outline kept under its threshold | The same |

#### Sand animation

Sand animation tells a story as one flowing picture: each picture is made out of the one before by wiping, pouring and scratching, never by a cut. In code, the look is a lit table of grains: a full-screen pass draws the grain of the sand and the light that comes through where it is thin; the pictures are masks drawn on a 2D layer, blurred, and turned into the thickness of the sand. A wipe is a mask that moves along the path of a hand; a pour is a mask that grows from a point with a noisy edge. The story is planned as a chain of pictures in which each one holds the start of the next. It has not been built on a film.

#### Painterly and drawing media

None of these has been built on a film. Each is a way of laying marks, and each has one rule that makes it read.

| Medium | How to build it | The rule that makes it read |
|---|---|---|
| Brush strokes (Van Gogh) | Draw the scene plainly first (a layer or a target). Then place strokes on a seeded, slightly jittered grid; turn each along a flow field (the curl of noise, or the direction of the edges of the picture); colour each from the picture beneath, pushed a little in hue and value; draw them as short wide lines with round ends in a line batch. Sky and ground get their own flow | The strokes follow the form. A stroke that crosses a form at random reads as noise |
| Pencil | Strokes broken by the paper's tooth (multiply by a noise of the paper's grain), pressure that varies along the stroke, hatching in the shadows at one angle, cross-hatching in the darkest | The paper shows through everywhere, even in the darkest part |
| Ballpoint | Thin blue lines of nearly even width, dense hatching that darkens where lines cross, a blot at the start of a stroke | Many lines, never a fill |
| Crayon | A fill masked by the paper's grain with a threshold, so the colour catches only on the tops of the tooth; edges that do not quite meet the outline | Gaps: white specks inside the colour |
| Felt pen | Flat saturated strokes of one width, composited with `multiply` so overlaps are darker | The overlaps show |
| Stop-motion drawn | Any of the above, redrawn on twos or threes with a new seed each step | The steps come from the frame clock (`frameTime` in `src/scenes/parts/kit-frame.ts`) |

A full-screen pass that makes any picture look painted (a Kuwahara filter, which flattens colour into patches while it keeps the edges) is a known technique and is not in the starter.

#### Stylised worlds, skies and the hour

`Sky` in `src/scenes/parts/kit-ground.ts` draws a whole outdoor ground in one pass and overwrites the target, like `Ground`: a gradient from the zenith to the horizon, haze that thickens towards the horizon, a sun or a moon with its glow, clouds from noise (soft, or in two to four hard cel steps, lit on the side towards the sun), and below the horizon water that mirrors the sky with ripples and a glitter path under the sun, or land that fades into the haze. Colours are hex strings of the scene's own sky, not palette keys.

| Helper | Does |
|---|---|
| `Sky`, `SkyStyle` | The pass and its settings: `zenith`, `horizon`, `horizonY`, `haze`, `sun`, `clouds`, `below`, and `t` for the ripples |
| `skyAt(at, keys)` | The colours of the sky, the sun and the light at one moment, mixed between `SkyKey`s. `at` may be an hour, a beat or a season: this is how the hour turns inside one shot |
| `hazed(colour, horizon, depth, haze)` | A colour seen through the air, `depth` of the way to the horizon: atmospheric perspective for the hills, trees and buildings drawn on layers |
| `mixHex(a, b, k)` | Two hex colours mixed in linear light: the light of the hour on a thing's own colour |

Checked in stills of a test scene: a sea from late afternoon to dusk over twelve beats, with three ridges of hills hazed towards the horizon and cel clouds. The clouds and the glitter needed two rounds: noise of five octaves made blotchy clouds, and a wide glitter path covered the water in speckle. The defaults now use three octaves with a little edge detail and a narrow path.

| Rule | Why |
|---|---|
| Everything takes the light of the hour | Tint every layer with the key's `light`, and haze it with the key's `horizon`. A sky that turns orange over green hills that stay green looks pasted |
| Seasons are keys too | Spring, summer, autumn and winter are `SkyKey`s plus the colours of leaves and ground; snow is the ground turning to paper colour with blue shadows |
| Big sky, low horizon | Stylised worlds live in their skies. Put the horizon low for wonder, high for a journey over land |
| Wind moves everything the same way | Grass, clouds, flags and hair lean one way, with seeded delays |
| In 3D | three.js fog in the horizon's colour, a sky dome drawn with the same gradient, a sun as a directional light of the key's `sun` colour, and toon or soft materials. The same keys drive both |

#### CRT and the demoscene

The demoscene idiom is a small set of effects, each a few lines of shader, on a black ground: raster (copper) bars that roll in sine waves, a twister (a column of text or stripes that twists round its axis), a scroller of greetings in a bitmap font, a star field in three speeds, and a logo that bounces. Everything moves on sine waves locked to the beat. Draw it at a low resolution with `kit-pixel.ts` for the bitmap look, or at full resolution for the vector look, and finish with the CRT treatment of the post chain when it is present (`effects.md`). Keep text readable through the curvature, and keep the palette to the era's: few colours, bright on black.

## 4. Recipes by kind of film

A starting point for the treatment. The owner's taste and the subject decide.

| Kind of film | Tone | Looks that work | Type | Motion | Music |
|---|---|---|---|---|---|
| Concept explained to beginners | Warm, clear | Idioms from everyday life, one per concept; cut paper; filled figures; app screens for "where you meet it" | A display face with character, a plain caption face | One event per beat, nothing decorative | Instrumental with clear drops |
| Technical deep dive | Precise | Blueprint, patent, node graph, terminal, axonometric | Monospaced for labels | Slow travel, exact steps | Steady, not loud |
| Product launch | Confident | App screen, glass, studio product, flat shapes, kinetic type | The brand's own | Snappy entrances, one hero move | Upbeat |
| Walk through a feature | Practical | App screen with a cursor or a finger, device frame | The product's own | Press and answer, together in one beat | A quiet bed |
| Data story | Sober | Newspaper, dashboard, pictogram, ledger | A serif for headlines, figures in a tabular face | Bars grow, figures count, one chart at a time | Calm |
| How-to in steps | Helpful | Assembly manual, order form, checklist | Numbers in circles | A marker that moves from step to step | Light |
| Music visual | The music's own | Generative grounds, glowing lines, vector arcade, comic impact frames | Little or none | Everything on the grid of the music | The subject itself |
| Lyrics | The song's own | Kinetic type, wood type, one idiom from the song's world | Large, one voice | Words on their syllables | The song |
| Logo sting | Short and sure | Shape mask, studio product, flat shapes | The mark | One build, one hold | Three to five seconds |
| Title sequence | Sets the world | One idiom held throughout, silhouettes, magazine type | Names as part of the picture | Slow, continuous | The theme |
| Short for social feeds | Loud in the first second | Sticker, comic, brutalist, app screen | Huge | A hook in the first beat, fast cuts | Fast |
| Timeline, recap of an event | Proud | Tickets, stamps, magazine, photographs in duotone | A serif | A line that travels through the dates | Warm |
| Money, markets | Trustworthy | Ledger, newspaper, dot display, monochrome | Tabular figures | Figures roll like a counter | Restrained |
| For children | Happy | Cut paper, clay, storybook, sticker | Rounded | Bounce, squash and stretch | Playful |
| Science, nature | Curious | Ink and wash, cut-away, growth, cells | A quiet serif | Slow reveals | Airy |
| History | Respectful | Woodcut, newspaper, map, stamps | Faces of the period | Slow pushes | Of the period |
| Comparison | Fair | Split frame, cards, two racks | One face, two colours | Mirrored moves | Even |
| List of N | Brisk | One card per item in its own arrangement, then the whole list | A counter | One item per bar | Driving |
| Release notes | Matter-of-fact | App screen, diff marks, stamps | The product's own | Before and after | Light |
| Short film with characters | The story's own | One cast in one look held for the whole film: cartoon, cut paper, toon in 3D, pixel art, stick figures. A cast file shared by every builder (`characters-and-story.md`) | Little; a title and an end card in a face of the film's world | Key poses on beats, holds, anticipation, squash and stretch; close shots where the face must be read | Chosen for the story's shape: its drops are the turn and the pay-off |
| Story told without words | Clear, then moving | Strong silhouettes, one colour per character, objects the viewer knows standing in for words | None, or signs inside the world | Eyelines, reactions, plant and callback, a button at the end | Sound effects and silences planned shot by shot; a motif per character |
| Journey across scales | Wonder | One unbroken zoom through nested worlds, each drawn at its own scale (`camera.md`, section 3.7); a ruler of scale as the one constant | A small label per world, a read-out of the scale | Constant travel in decades per beat, pauses at the worlds that matter | Steady, building |

## 5. Colour

### Roles

Give colours jobs, not names.

| Role | Job | Rule |
|---|---|---|
| Ink | The dark neutral: dark grounds, type on light grounds | Never pure black; a little hue keeps it alive |
| Paper | The light neutral: light grounds, type on dark grounds | Never pure white |
| Second ink, second paper | Plates, panels, a step of depth | One step from their neutral |
| Greys | Things that recede | Two are enough |
| Signal | The thing that IS the idea | Nothing else may use it. It has one hotter companion for its core |
| Trouble | The problem, the error, the warning | Never used for decoration |
| Key hues | One per section, for its world | Three or four in all, far apart from each other and from signal and trouble |

From practice: a palette of twelve colours served a film of eight sections: two neutrals with a second step each, two greys, a pink signal with its paler core, an orange for trouble, and four key hues.

The starter's `src/engine/palette.ts` holds twelve colours in these roles: `ink` and `ink2`, `paper` and `paper2`, the greys `graphite` and `ash`, `signal` with its core `blush`, and the key hues `sun`, `tangerine`, `teal` and `violet`. It has no colour for trouble; give one of the film's hues that job, or add a key. `bg` and `fg` repeat `ink` and `paper` and must stay, because the engine uses them.

### Exceptions are made on purpose

A rule about colour serves reading. When it stops doing so, break it and write down why. From practice: layers that wrapped a core were all drawn in the signal colour, since each was "the idea". The owner could not tell them apart. Each layer then got its own hue and the core stayed neutral.

### Blending

Colours are blended in linear light. Two consequences surprise:

| Effect | Cause | Rule |
|---|---|---|
| A dark plate over a light ground turns grey | A few per cent of a bright ground showing through is a lot of light | Plates are opaque |
| Multiply darkens more than in a design program | The program blends in a gamma space | Judge on the rendered frame, never on the numbers |

### Contrast

Type against its ground needs a clear difference in lightness. A saturated hue against another saturated hue of the same lightness cannot be read, whatever the hues. On a coloured ring or tab, set the name in ink or in paper, whichever is further from the hue.

### Time of day and season

A scene whose light changes (afternoon to dusk, summer to winter) changes all its colours together, from one set of keys: `skyAt` of `src/scenes/parts/kit-ground.ts` gives the sky, the sun and a `light` colour for each moment, and every drawn thing is its own colour mixed towards that light (`mixHex`) and hazed with distance (`hazed`). The film's palette still gives the roles: the signal colour stays the signal colour at dusk, and type stays ink or paper.

## 6. Texture and finish

| Finish | Does | Use |
|---|---|---|
| Grain | Breaks the smoothness of digital colour | Always a little, less on light grounds |
| Halftone dots | Give a ground something to hold | Grounds, shadows, pools of light |
| Paper fibres | Make a light ground into paper | Light grounds |
| Hatching | Shades without grey | Print looks |
| Glow | Makes light out of colour | Only on what is a light source in the picture. Type stays under the threshold |
| Halation | A warm halo round bright things | Dark grounds |
| Hard shadow | Says "paper on paper" | Cut paper, cards, stickers |
| Soft shadow | Says "object on a surface" | 3D objects, a single hero |
| Vignette | Draws the eye inwards | Dark grounds, lightly |
| Colour fringe | Says "lens" | Impacts, never on type that must be read |

## 7. One film, several looks

When each section has its own idiom, these carry the unity:

| Constant | Carried by |
|---|---|
| The palette and its roles | Every shot |
| Two or three typefaces, each with a job | Every word |
| A counter or a mark in one corner | The overlay |
| The signal colour arriving with the idea | Every section |
| The way captions are set | The overlay |
| The grain and the finish | The post chain |
| A recap in which every section's thing appears in one look | The end of the film |

Judge a shot against the best shot of its own section. If it looks like a different, cheaper film beside it, it is out of design and is rebuilt in the idiom of that best shot.

## 8. What the HyperFrames route brings

Its creative skill carries ready-made looks. They are for the page, not for a shader, and every one of them leaves motion out of scope.

| Catalogue | Names |
|---|---|
| Frame presets (13) | `biennale-yellow`, `blockframe`, `blue-professional`, `bold-poster`, `broadside`, `capsule`, `cartesian`, `cobalt-grid`, `code-editorial`, `coral`, `creative-mode`, `daisy-days`, `editorial-forest` |
| Visual styles (8) | Swiss Pulse, Velvet Standard, Deconstructed, Maximalist Type, Data Drift, Soft Signal, Folk Frequency, Shadow Cut |
| Palettes (9) | `bold-energetic`, `clean-corporate`, `dark-premium`, `jewel-rich`, `monochrome`, `nature-earth`, `neon-electric`, `pastel-soft`, `warm-editorial` |
| Examples to start from | `warm-grain`, `swiss-grid`, `vignelli`, `kinetic-type`, `product-promo`, `nyt-graph`, `decision-tree` |

## 9. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| A shot looks cheaper than its neighbours | Bare primitives, featureless figures | Rebuild it in the idiom of the best shot of the section |
| Two sections are taken for one another | They share a prop or a screen | Change the idiom or the example of one |
| The viewer does not know where to look | The signal colour is on several things | One thing per shot carries it |
| Things that should be told apart look like one band | One colour for all of them | A hue each; the unchanged core stays neutral |
| A plate looks grey and dirty | It is nearly opaque, over a bright ground | Make it opaque |
| Type shimmers or blooms | It crossed the glow threshold | Keep type under it; tint type slightly down |
| Labels cannot be read | A coarse face with diacritics, or text on a tilted plane | A larger dot, another face, or flat labels |
| The look reads as a stock explainer | Flat shapes and a whiteboard with no idiom | Take an idiom from the world of the subject |
| The lower third of a vertical frame is empty in every shot | Layouts made for a wide frame | Stack; let the subject run the height of the safe area |
| The first title is called ugly | A solid shape and a line of type, nothing of the film in it | Build the title out of the things of the film |
| Pixel art looks soft, or has pixels of two sizes | Drawn at full resolution, turned freely, or finished with bloom and grain | Draw on the small canvas of `PixelLayer`, snap after posing, return `POST_PIXEL` |
| A collage looks pasted rather than cut | No paper border, shadows in several directions, pictures of different grain | A border on every cut-out, one light for every shadow, one print treatment over all pictures |
| A character looks different in every shot | Each builder drew it | One cast file, owned by the lead (`characters-and-story.md`) |
| A painterly look reads as a filter | Strokes of one size, in random directions, over everything | Strokes follow the form; large in the ground, small on the subject |
| A drawn landscape looks flat and small | No haze, far things as dark and saturated as near ones | `hazed` towards the horizon's colour, more with distance |
| The HUD looks like filler | Values that do not change or are not true, marks in every corner | Make every read-out true and moving, or remove the HUD |
