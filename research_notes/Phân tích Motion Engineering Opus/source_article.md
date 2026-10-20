# Motion Engineering: Build a Video Studio Around Opus 5.5

Post: Opus 5.5 can make a video

The hard part is making the next one better

That takes a studio, not a prompt

I broke down how to build it ↓ https://x.com/i/article/2105626165704572928
Stats: views 900508 likes 1460 bookmarks 5246 RT 138, created Thu Oct 01 13:00:05 +0000 2026
Author: @0xwhrrari (rari) - solo setups | ai researcher  building @kollectivexyz  444, followers 20014

Everybody is sharing videos made with Claude Opus 5.5
Some are excellent
Most look like the same demo
Large text in the center
A gradient behind it
Everything fades in
The logo appears at the end
The difference is not a secret prompt
It is the system around the model
Anthropic released Opus 5.5 on September 22
Its coding and visual judgment make this workflow practical, but the model is only one part of it
[media/embed]
The model writes the program
The program draws the frames
The renderer turns those frames into a film
The review loop decides whether anyone should see it
> A prompt can produce a clip. A studio can produce the next clip without rebuilding itself
This is how I would engineer that studio
> I publish practical breakdowns of AI agents, workflows, and production systems on Substack Join the newsletter here
[media/embed]

## What Opus is actually making
You ask for a video
Opus does not need to imagine every frame as a separate image
It can write code that answers a more useful question
[media/embed]
That code becomes a frame function
[media/embed]
A renderer calls it across the timeline, captures frames, and encodes them into a video file
This changes the economics of revision
If a title enters too early, you change one time value
If a shape overshoots too far, you change one motion curve
If a product screen is wrong, you replace the asset and render again
You do not ask a video model to regenerate the whole shot and hope it remembers the previous version
Code-made motion is not the answer to every visual problem. Photoreal scenes, complex characters, and organic movement may still need footage or generated video
But for product films, UI motion, data stories, typography, diagrams, and launch explainers, a controllable frame function is a serious advantage
[media/embed]

## The studio has five layers
Most people give Opus a description and judge the MP4
That skips almost every layer that determines the result
[media/embed]
[media/embed]
The model can help with all five
It should not be allowed to collapse them into one uninspected step
That is where the generic output comes from
The model fills missing decisions with the safest visual defaults it knows
Your job is to remove the missing decisions before it starts rendering
[media/embed]

### 1. Write a director's brief, not a vibe prompt
"Make an insane product video" leaves the important choices undefined
Thariq from the Claude Code team put the "one-shot" myth in perspective
[media/embed]
- What is the product?
- What is the one thing the viewer should remember?
- Which visual reference is allowed to influence the work?
- Which elements must come from the real product?
- What would make the result unacceptable?
Give Opus a small production document before giving it a render task
[media/embed]
Notice what this does
It separates facts about the product from choices about the film
The model can invent camera movement
It cannot invent your dashboard
It can propose a stronger opening
It cannot quietly replace your logo
That boundary matters more than a longer adjective list
[media/embed]

### 2. Give it a reference it can inspect
If you do not supply a visual grammar, the model supplies its own
That is why unrelated one-prompt reels often look related
Give it a frame, a short film, or a folder of previous work
Then make it write down what it learned
[media/embed]
The output should be a style guide, not a collage of borrowed shots
For a product film, also give Opus access to the real site and ask it to collect the exact screens it intends to animate
Review that asset list before production
If an asset is missing, the agent should stop and ask rather than draw a convincing fake
[media/embed]

### 3. Turn the story into states and beats
A list of effects is not a storyboard
"Zoom in, then morph, then add particles" describes activity, not meaning
A stronger plan says what the viewer knows at each moment
[media/embed]
Each beat needs an entry state, an exit state, and a reason to exist
For UI motion, write a state list before drawing transitions
[media/embed]
Now the model can design continuity between known states
One component may change size, color, content, and position across the film while remaining recognizably the same object
That is a better brief than "make the interface dynamic"
[media/embed]
The shot list is also a contract
If the agent cannot explain why shot four exists, shot four does not belong in the render
[media/embed]

### 4. Choose the renderer on purpose
Opus can write a lightweight Canvas or SVG film in one project
That is useful for a small, self-contained piece
For a repeatable series, a video framework can make scene structure, media placement, and export easier to maintain
Remotion - treats video as React components rendered at known frame numbers
HyperFrames - uses an editable HTML composition with explicit timing and seekable animation runtimes
Neither is automatically "better"
Use the smallest system that supports the film you intend to make again
The non-negotiable requirement is seekability
[media/embed]
That means no hidden clock, no unseeded randomness, and no animation that only works after a browser has been running for eight seconds
Think of every frame as a deterministic query
[media/embed]
Once the film works this way, revisions become local and testable
[media/embed]

### 5. Make motion have weight
Basic motion moves from A to B on a fixed curve
Good motion communicates mass, hierarchy, and intent
- Small control can snap
- Large panel can settle
- Camera can move slowly enough to preserve orientation
- Headline can arrive fast, then hold long enough to be read
Springs are useful because they describe that behavior more naturally than a generic ease-in-out
But do not turn every object into a spring
If everything overshoots, nothing feels precise
Write a motion rule for each class of object
[media/embed]
The most important check is still visual
Does the viewer know where to look after each move?
If not, the animation is decoration competing with the message
[media/embed]

### 6. Put sound on the same timeline
Many AI-made films look finished with the audio muted
Then you turn the sound on and realize nothing is connected
The click lands after the button
The cut misses the beat
The final logo arrives before the music resolves
Treat sound as a timeline input, not a last-minute file dropped under the video
[media/embed]
Use a licensed or original track when you have one. Measure its beats and cut against them
If the sound is synthesized, place every cue against the same timestamps that drive the picture
The test is simple
Close your eyes and listen to the film
If it has no shape without the picture, the sound design is probably not finished
[media/embed]

### 7. Inspect the frames before exporting the film
This is the step people skip because the first render feels like progress
Do not start by watching a full 60-second export ten times
Ask the renderer for a contact sheet
Take one frame at every major beat, then a short strip around the fastest transitions
Look for the things a text-only agent misses
[media/embed]
Then give Opus the contact sheet and a specific critique task
[media/embed]
[media/embed]
This is the difference between "the agent made a video" and "the agent directed a video"
The first one stops when the file exists
The second stops when the evidence says the film works
[media/embed]

### 8. Export variants from the source, not from a crop
A 16:9 launch film and a 9:16 social cut are different compositions
The vertical version may need larger type, fewer simultaneous elements, a different camera path, and a tighter story
Do not make one beautiful wide video and ask software to crop its center
Keep the same assets, timeline, and narrative states
Then define layout behavior for each format
[media/embed]
Render a contact sheet for every variant
An export is not correct because the encoder finished
It is correct because the composition survived the format change
[media/embed]

### 9. Package the studio, not the chat
If the only record of the film is a conversation, you do not have a production system
You have a lucky session
Keep the important decisions in files that another run can read
[media/embed]
Then the next video starts with a real base
Swap the product brief and assets
Keep the render contract, review checklist, and delivery structure
This is also how you stop a long agent run from drifting
The agent can inspect its own files, resume from a completed gate, and tell you which artifact is missing
It should not claim the film is done because the last command exited successfully
[media/embed]

### 10. Give long runs gates, not freedom
The appeal of Opus is that you can hand it a large creative task and leave it working
That only helps if the run knows when to stop, when to ask, and when to repair
[media/embed]
The agent can work for hours between those gates
It should not make irreversible brand decisions on your behalf
If the brief says "use the real interface" a missing interface screenshot is a blocker, not an invitation to hallucinate one
If the reference is unclear, the right output is a question or a small test frame, not 900 polished wrong frames
Autonomy becomes useful when every stage leaves evidence for the next one
That is the same lesson behind reliable agents in any domain
The loop needs a target, an observation, a bounded repair, and a way to stop
[media/embed]

## The prompt I would actually give Opus
The useful prompt is not "make a viral video"
It is a production contract with review gates
[media/embed]
That prompt is longer than the viral one-liner
The important part is not its length
It gives the model a sequence of decisions, artifacts, and stop conditions
You can reuse that system for the next launch instead of asking for a miracle from scratch
[media/embed]

## The real shift
One-prompt video is impressive because the first result arrives fast
Motion engineering is valuable because the tenth result can be better than the first
The model gives you speed
The brief gives it direction
The renderer gives you control
The contact sheet gives you evidence
The loop turns that evidence into improvement
[media/embed]
That is the difference between generating a demo and operating a studio
[media/embed]
-> Subscribe to my Substack
-> Join my Telegram
-> Bookmark this this before you ask an AI to "make a video" with no brief, no references, and no way to inspect the result
-> Follow @0xwhrrari


## Code blocks, links and embeds (in entity-key order, roughly document order)

--- link 0 https://www.anthropic.com/claude-opus-5-5

---  1 TWEET {"tweetId": "2102435511222890900"}

--- link 2 https://whrrari.substack.com/subscribe?next=https%3A%2F%2Fsubstack.com%2F%40whrrari%2Fnotes&utm_source=profile-page&utm_medium=web&utm_campaign=substack_profile&just_signed_up=true

--- block 4
```
What should the screen look like at time t?
```

--- block 5
```
function renderFrame(t, spec, assets) {
  // Draw the exact state of the film at time t
}

```

--- block 7
```
DIRECTOR       What is the film trying to say?
REFERENCE      What should it feel and look like?
TIMELINE       What changes at each beat?
RENDERER       How is every frame produced?
CRITIC         What failed, exactly where, and why?
```

---  10 TWEET {"tweetId": "2102870353781641416"}

--- block 11
```
FILM
One sentence: [the idea the viewer should remember]
Audience: [who this is for]
Duration: [seconds]
Formats: [16:9 / 9:16 / 1:1]

ASSETS
Real logo: [path]
Real UI screenshots: [paths]
Brand type and colors: [tokens]
Music or audio reference: [path]

VISUAL RULES
Keep: [specific traits from the reference]
Avoid: [specific visual clichés]
Never invent product screens or metrics

DELIVERABLES
Storyboard, contact sheet, final video, poster frame, source files
```

--- block 13
```
REFERENCE ANALYSIS
Palette: [actual colors, not “premium”]
Typography: [family, width, weight, scale]
Composition: [where the eye goes first]
Pacing: [average time between meaningful changes]
Motion: [snap, glide, overshoot, cut, hold]
Texture: [grain, paper, glass, none]

DO NOT COPY
Subjects, logos, copy, or product-specific imagery
```

--- block 15
```
00-02s   HOOK       One image that earns attention
02-05s   PROBLEM    Show the friction, not a paragraph about it
05-09s   REVEAL     The product enters through a real interaction
09-13s   PROOF      One screen or number demonstrates the claim
13-16s   CLOSE      A clean final state and a readable CTA
```

--- block 16
```
SEARCH -> RESULT -> DETAIL -> ACTION -> CONFIRMATION
```

--- link 19 https://www.remotion.dev/docs/the-fundamentals

--- link 20 https://github.com/heygen-com/hyperframes/blob/main/docs/developers/overview.mdx

--- block 21
```
frame 240 must be renderable directly
without replaying frames 0 through 239
```

--- block 22
```
frame = render(time, shot_list, assets, style_tokens, seed)
```

--- block 24
```
MICRO UI      quick, minimal overshoot
PANELS        controlled settle
CAMERA        smooth, almost invisible
HEADLINES     strong entrance, stable hold
MASCOT        playful, clearly intentional
```

--- block 26
```
BEAT GRID
0.00s   opening hit
0.50s   first state change
1.00s   product reveal
1.50s   interaction click
2.00s   visual payoff
```

--- block 28
```
[ ] Text readable at phone size
[ ] No element crossing the safe area
[ ] Real product assets, not invented replacements
[ ] Consistent type and color across scenes
[ ] No awkward mid-transition frames
[ ] Cuts and sound cues land together
[ ] First two seconds contain a real hook
[ ] Last frame is strong enough to be a poster
```

--- block 29
```
Do not describe what you intended to make
Judge only the rendered frames

Identify the three largest defects
Give each defect a timestamp, evidence, and a local fix
Patch only those sections, then render the affected frames again
```

--- block 32
```
ONE STORY
  -> 16:9: more spatial context
  -> 9:16: fewer elements, stronger vertical hierarchy
  -> 1:1: tighter typography and shorter holds
```

--- block 34
```
motion-studio/
  brief.md             the one-sentence goal and product facts
  style-guide.md       palette, type, motion, and banned defaults
  shotlist.md          beats, states, timestamps, and purpose
  assets/              approved logos, screens, footage, and sound
  src/                 seekable composition and motion code
  reviews/             contact sheets and defect notes
  out/                 exports for each format
```

--- block 36
```
GATE 1  Approve references and product assets
GATE 2  Approve style guide and shot list
GATE 3  Inspect representative stills
GATE 4  Render rough cut and contact sheet
GATE 5  Repair the three highest-impact defects
GATE 6  Check audio, formats, and final deliverables
```

--- block 38
```
You are directing and engineering a code-rendered motion film

Goal:
Make a [duration]-second film for [product/audience]
The viewer should remember: [one sentence]

Inputs:
- Use only the supplied product assets and approved copy
- Inspect the reference files and write a style-guide.md
- Write shotlist.md with timestamps, entry states, exit states, and purpose

Build:
- Choose a renderer and explain why it fits this project
- Make every frame seekable and deterministic
- Keep motion, audio cues, and transitions on one timeline
- Preserve editable source and a repeatable render command

Review gates:
1. Show the style guide and shot list before building
2. Show a contact sheet before the full render
3. Score hook, readability, continuity, motion, and sound sync
4. Fix the three worst defects and re-render those sections
5. Export 16:9 and 9:16 as separate compositions

Deliver:
final videos, poster frames, contact sheets, source, assets list,
and a short note on what still needs human review
```

--- block 40
```
PROMPT -> CLIP

BRIEF -> SYSTEM -> FILM -> REVIEW -> BETTER SYSTEM
```

--- link 42 https://whrrari.substack.com/subscribe?next=https%3A%2F%2Fsubstack.com%2F%40whrrari%2Fnotes&utm_source=profile-page&utm_medium=web&utm_campaign=substack_profile&just_signed_up=true

--- link 43 https://t.me/+qqS3Qn-x1305ZmUy

--- link 44 https://x.com/@0xwhrrari
