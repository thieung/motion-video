# Repo Gap Analysis: "Motion Studio" practices vs. thieung/motion-video

Scope note: read-only analysis performed 2026-10-20. Sources are local file paths, live `git`/`gh api` output, and the source article. No repository files were modified.

## Q1. What is this repo (stack, renderer, structure, compositions, docs, CLAUDE.md/skills, scripts)?

### Takeaway
The repository contains no code yet. It is an empty GitHub repo created on 2026-10-20 with no commits. The only local content is the research folder: `research_notes/` (the article plus these notes) and an empty `reports/`. There is no stack, no renderer, no compositions, no CLAUDE.md, no package.json and no scripts. The only video tooling in reach is two user-level (global) skills, `ak:remotion` and `ak:hyperframes`, and the machine has Node 22 and FFmpeg installed.

### Cited Findings
- GitHub reports the repo as created `2026-10-20T04:36:29Z`, with `size: 0`, `language: null`, no description, default branch `main` and public visibility — [gh api repos/thieung/motion-video](https://api.github.com/repos/thieung/motion-video)
- `GET /repos/thieung/motion-video/commits` returns HTTP 409 "Git Repository is empty." and `/branches` returns `[]` — [GitHub REST commits endpoint](https://api.github.com/repos/thieung/motion-video/commits)
- The local clone is on branch `claude/project-thread-gjcfoq`, which "does not have any commits yet". The only files in the working tree are `/home/user/motion-video/research_notes/Phân tích Motion Engineering Opus/source_article.md` and the empty directory `/home/user/motion-video/reports/` — local `git log` / `find` output
- None of these exist: package.json, `remotion.config.ts`, `index.html` compositions, `CLAUDE.md`, `AGENTS.md`, `.claude/`, `docs/` or `plans/` — local `find` over `/home/user/motion-video`
- The installed skill `ak:remotion` (`/root/.claude/skills/ak-remotion/SKILL.md`) covers React/Remotion compositions, audio, stills, transitions and timing, with 29 rule files under `/root/.claude/skills/ak-remotion/rules/` — [local file](file:///root/.claude/skills/ak-remotion/SKILL.md)
- The installed skill `ak:hyperframes` (`/root/.claude/skills/ak-hyperframes/SKILL.md`) wraps the HeyGen HyperFrames CLI, pinned at `hyperframes@0.8.77`, for HTML-first compositions — [local file](file:///root/.claude/skills/ak-hyperframes/references/render-workflow.md)
- `ak:hyperframes` "See also" points to an `ak-motion-graphics` skill that is not installed: `ls /root/.claude/skills/ak-motion-graphics` fails — [local file](file:///root/.claude/skills/ak-hyperframes/SKILL.md)
- Toolchain on this machine: `/opt/node22/bin/node` v22.22.0, `/usr/bin/ffmpeg`, `/usr/bin/ffprobe` and `npx`. No system Chrome was found on PATH, but Remotion and HyperFrames each download their own headless browser — local `which` output

### Inferences
- A gap analysis of existing code is not possible because none exists. The useful framing is greenfield: lay down the article's studio layout as the very first commit, so the repo never goes through a phase where it is a "lucky session" in chat.
- Either renderer is viable on this machine (Node 22 + FFmpeg present). The user-level skills already encode most of the seekability rules, so the repo mainly needs project-level contracts (brief, style guide, shot list, review checklist, gates) on top of them.

### Gaps
- The intended product or film for this repo is unknown. There is no brief or README, so recommendations cannot be product-specific.
- I could not check whether the user has motion code in other repos: the session's GitHub access is limited to this repo (`users/thieung/repos` returned HTTP 403).
- The reason `ak:hyperframes` references the missing `ak-motion-graphics` skill is unknown. It is possibly part of a kit that is not installed.

## Q2. Status of each of the article's 10 practices

### Takeaway
In the repo itself, all 10 practices are **missing** because there are no files. At the environment (skill) level, some support exists:
- Partial support: renderer guidance (practice 4), motion rules and springs (practice 5), audio placement (practice 6), stills and snapshots for contact sheets (practice 7), and aspect-ratio handling (practice 8).
- No support at all: director's brief (1), reference analysis (2), shot list (3), studio packaging (9) and gated long runs (10).

### Cited Findings
| # | Practice (article) | Repo status | Environment support (evidence) |
|---|---|---|---|
| 1 | Director's brief: FILM / ASSETS / VISUAL RULES / DELIVERABLES template — [source_article.md block 11](file:///home/user/motion-video/research_notes/Phân%20tích%20Motion%20Engineering%20Opus/source_article.md) | Missing (no `brief.md`) | None. Neither video skill defines a brief template. |
| 2 | Inspectable reference → `style-guide.md` (palette, typography, composition, pacing, motion, texture, DO NOT COPY) — block 13 | Missing (no `style-guide.md`, no `assets/`) | None. `ak-remotion/rules/fonts.md` covers font loading only. |
| 3 | States & beats shot list with entry state, exit state and purpose (blocks 15–16) | Missing (no `shotlist.md`) | `ak-remotion/rules/sequencing.md` covers mechanics (`<Sequence>`), not story contracts. |
| 4 | Deliberate renderer choice plus seekability ("frame 240 must be renderable directly", block 21; `frame = render(time, shot_list, assets, style_tokens, seed)`, block 22) | Missing (no renderer chosen) | Partial. `ak-remotion/rules/animations.md:28-29` says "CSS transitions or animations are FORBIDDEN… Tailwind animation class names are FORBIDDEN". `ak-hyperframes/references/composition-basics.md:91-94` requires "a paused, seekable timeline registered under the composition ID in `window.__timelines`". |
| 5 | Motion rules per object class (MICRO UI / PANELS / CAMERA / HEADLINES / MASCOT, block 24) | Missing | Partial. `ak-remotion/rules/timing.md` covers linear, easing and spring interpolation. There is no per-class motion-rule template. |
| 6 | Sound on the timeline (BEAT GRID, block 26) | Missing (no audio assets, no cue map) | Partial. `ak-remotion/rules/audio.md` covers `<Audio>` from `@remotion/media`, plus `trimBefore`/`trimAfter` and `<Sequence>` delays (lines 22–79). `ak:hyperframes` mentions `data-has-audio` and a `hyperframes-audio` HeyGen skill (`references/heygen-skills.md:32`). Neither covers beat measurement or a shared cue table. |
| 7 | Contact-sheet review plus critique prompt (blocks 28–29) | Missing (no `reviews/`, no checklist) | Partial. Remotion `<Still>` (`ak-remotion/rules/compositions.md:85-97`). HyperFrames `snapshot my-composition --at 1,3.5,6` (`ak-hyperframes/references/render-workflow.md:59-62`). HyperFrames `check` audits "runtime errors, failed requests, layout overlap, and contrast" (render-workflow.md:55-58). Nothing assembles the stills into a grid or applies the article's 8-item checklist. |
| 8 | Per-format compositions (16:9 / 9:16 / 1:1 as separate layouts, block 32) | Missing | Partial. Remotion `calculateMetadata` for dynamic dimensions (`compositions.md:107-140`). HyperFrames `--aspect-ratio 16:9\|9:16\|1:1` (render-workflow.md:104) and `--resolution portrait`. Neither enforces separate layout rules per format. |
| 9 | Package the studio as files: `brief.md`, `style-guide.md`, `shotlist.md`, `assets/`, `src/`, `reviews/`, `out/` (block 34) | Missing. The repo holds only `research_notes/` and `reports/`. | None |
| 10 | Gated long runs (GATE 1–6, block 36) plus the production-contract prompt (block 38) | Missing (no CLAUDE.md, no gate file) | None specific to video. The `ak:remotion` "Completion" section asks the agent to verify "composition ID/props, dimensions, fps, duration and frame range… audio synchronization" and says "a preview alone is not render proof", which works as a single end gate ([SKILL.md](file:///root/.claude/skills/ak-remotion/SKILL.md)). |

### Inferences
- The skills cover the "how" (renderer mechanics). The article's main value is the "what and when": brief, style guide, shot list, checklist and gates. That is exactly the layer that is missing, and it is cheap to add because it is just markdown files and a CLAUDE.md.
- The article's own claim that "the model fills missing decisions with the safest visual defaults" ([source_article.md](file:///home/user/motion-video/research_notes/Phân%20tích%20Motion%20Engineering%20Opus/source_article.md)) applies directly here. With no brief or style guide in the repo, any first render would fall back to the "large centered text, gradient, fade-in" default the article criticizes.

### Gaps
- The exact contents of the article's embedded images and tweets (marked `[media/embed]`) are not in the extracted text, so any guidance shown only in those images is not reflected here.

## Q3. Seekability and determinism: Math.random, Date.now, CSS animations, setTimeout

### Takeaway
There is no composition code to violate determinism. A grep would return zero hits by definition. The risk is in the future, and the installed skills already forbid CSS animations (Remotion) and require paused, seekable timelines (HyperFrames). However, nothing in the repo will enforce a ban on `Math.random()`, `Date.now()`, `setTimeout` or `requestAnimationFrame`.

### Cited Findings
- The working tree contains only `source_article.md`, so there are no `.ts`, `.tsx`, `.js` or `.html` files to grep — local `find` output
- Remotion rule: "CSS transitions or animations are FORBIDDEN - they will not render correctly. Tailwind animation class names are FORBIDDEN" — [ak-remotion/rules/animations.md:28-29](file:///root/.claude/skills/ak-remotion/rules/animations.md)
- HyperFrames rule: animation inside a clip "comes from a paused, seekable timeline registered under the composition ID in `window.__timelines`; a composition with no timeline must declare `data-no-timeline`" — [ak-hyperframes/references/composition-basics.md:91-94](file:///root/.claude/skills/ak-hyperframes/references/composition-basics.md)
- The only `setTimeout` uses in the Remotion skill are in `extract-frames.md` lines 168 and 197. Those are abort timeouts for Mediabunny frame extraction, which is not code that runs inside a composition — [ak-remotion/rules/extract-frames.md](file:///root/.claude/skills/ak-remotion/rules/extract-frames.md)
- Article requirement: "no hidden clock, no unseeded randomness, and no animation that only works after a browser has been running for eight seconds" — [source_article.md §4](file:///home/user/motion-video/research_notes/Phân%20tích%20Motion%20Engineering%20Opus/source_article.md)

### Inferences
- The grep did not find an explicit `Math.random` / `Date.now` ban in the installed skill rules I inspected. Remotion provides a seeded `random()` helper in its library. Its absence from the inspected rules is an inference from the grep, not a claim about Remotion's docs.
- A lint guard should be added before compositions are written (see Recommendation 3). It would be a small script or ESLint `no-restricted-syntax` rule over `src/` that fails on `Math.random`, `Date.now`, `new Date()`, `performance.now`, `setTimeout`, `setInterval`, `requestAnimationFrame` and CSS `animation:` / `transition:`.

### Gaps
- Determinism cannot be verified empirically, for example by rendering frame N directly and comparing it to a sequential render, because no composition exists.

## Q4. Contact-sheet / still rendering, multi-format, audio sync, review checklist?

### Takeaway
None of these exist in the repo. Both renderers offer the building blocks: Remotion `<Still>` / still rendering and HyperFrames `snapshot --at`, `--aspect-ratio` and `check`. FFmpeg is installed and can tile stills into a contact sheet. What is missing is the repo-level glue: a script that renders beat-timed stills per format and tiles them, a `reviews/` folder, and the article's checklist.

### Cited Findings
- HyperFrames still capture: `npx -y hyperframes@0.8.77 snapshot my-composition --at 1,3.5,6` — [render-workflow.md:59-62](file:///root/.claude/skills/ak-hyperframes/references/render-workflow.md)
- HyperFrames `check` audits layout overlap and contrast (`--strict` fails on warnings), which partly automates the "safe area / readability" checklist items — [render-workflow.md:55-58](file:///root/.claude/skills/ak-hyperframes/references/render-workflow.md)
- Remotion `<Still>` for single-frame images, plus `calculateMetadata` for dynamic dimensions — [compositions.md:85-140](file:///root/.claude/skills/ak-remotion/rules/compositions.md)
- `/usr/bin/ffmpeg` is present, so a `tile` filter contact sheet is feasible locally — local `which` output
- The article's checklist has 8 items (phone-size readability, safe area, real assets, type/color consistency, mid-transition frames, cut/sound sync, 2-second hook, poster-worthy last frame), and its critique prompt asks for "three largest defects… timestamp, evidence, and a local fix" — [source_article.md blocks 28–29](file:///home/user/motion-video/research_notes/Phân%20tích%20Motion%20Engineering%20Opus/source_article.md)

### Inferences
- The highest-leverage automation is a single `render:contact-sheet` script. It should read beat timestamps from `shotlist.md` or a JSON sidecar, render one still per beat plus a short strip around each fast transition, for every format, and tile them into `reviews/<date>-<format>.png`. That turns practice 7 (the "skipped" step) into one command, and it also covers practice 8 ("render a contact sheet for every variant").

### Gaps
- Whether the user wants audio synthesized or licensed is unknown. That choice decides whether a beat-measurement step (for example, an onset-detection script) is needed.

## Q5. Top 5 recommended changes, ranked by value/effort (repo-specific)

### Takeaway
Since the repo is empty, the ranking favors changes that set the studio's shape before any code is written. Start with CLAUDE.md plus the studio skeleton, then the brief, style guide and shot-list templates, then a determinism guard, then the contact-sheet script, and finally a per-format composition setup.

### Cited Findings (basis for each recommendation)
1. **Add a root `CLAUDE.md` that encodes the six gates and the production contract (high value, very low effort).** Copy GATE 1–6 (block 36) and the production-contract prompt (block 38) in as the agent's standing rules. Include the stop conditions: "missing interface screenshot is a blocker, not an invitation to hallucinate one", and do not claim done "because the last command exited successfully". Also point it at `ak:remotion` or `ak:hyperframes`, depending on which renderer is chosen. Basis: the repo has no CLAUDE.md (Q1), and the article's §9–10 — [source_article.md](file:///home/user/motion-video/research_notes/Phân%20tích%20Motion%20Engineering%20Opus/source_article.md)
2. **Commit the studio skeleton with templates: `brief.md`, `style-guide.md`, `shotlist.md`, `assets/` (with an `assets/README.md` approved-asset manifest), `src/`, `reviews/`, `out/` (gitignored) (high value, low effort).** Pre-fill the templates from blocks 11, 13, 15/16, 24 and 26. Add a `motion-rules` section in `style-guide.md` and a `BEAT GRID` / cue table in `shotlist.md`, so that motion and sound share one timeline. Basis: block 34 layout; practices 1, 2, 3, 5, 6 and 9 are all missing (Q2).
3. **Pick one renderer explicitly and record why, then add a determinism guard (high value, low effort).** Record the choice in a short `docs/renderer-decision.md` or a section in CLAUDE.md:
   - Remotion if the films will be React/data-driven and need audio, captions or springs (`ak-remotion/rules/timing.md`, `audio.md`).
   - HyperFrames if they will be short HTML-authored social clips. It has built-in `snapshot`, `check` and `--aspect-ratio`, but it is pinned at 0.8.77.
   Then add a lint step over `src/` banning `Math.random`, `Date.now`, `new Date`, `performance.now`, `setTimeout`, `setInterval`, `requestAnimationFrame` and CSS `animation`/`transition`, with a seeded RNG helper as the only source of randomness. Basis: article §4 ("Choose the smallest system… non-negotiable requirement is seekability"); skill rules cited in Q3.
4. **Add a contact-sheet script plus a `reviews/CHECKLIST.md` (high value, medium effort).** The script would render stills at every beat timestamp (Remotion `<Still>` / still render, or `hyperframes snapshot --at`) for each format and tile them with FFmpeg into `reviews/`. The checklist file holds the 8-item checklist and the "three largest defects, timestamp, evidence, local fix" critique prompt. Basis: practice 7 / GATE 3–5; tooling present (Q4).
5. **Structure compositions per format from day one (medium value, medium effort).** Use one shared timeline and state module, plus separate `Landscape16x9` / `Vertical9x16` (and optionally `Square1x1`) compositions with format-specific layout rules: larger type and fewer elements in 9:16. Render each format to `out/<format>/` and get a contact sheet for each. Basis: article §8 ("Do not make one beautiful wide video and ask software to crop its center"); Remotion `calculateMetadata`, HyperFrames `--aspect-ratio`.

### Inferences
- Recommendations 1–2 are pure markdown and could land in one commit. Together they would move practices 1, 2, 3, 9 and 10 from "missing" to "present as a template".
- Recommendations 3–5 depend on the renderer decision. That is the one material choice that needs the user's input, together with what the first film is about.
- Optional follow-up, not top 5: an `out/` deliverables manifest (final videos, poster frames, contact sheets, assets list, "what still needs human review" note), taken from block 38's "Deliver" section.

### Gaps
- The intended product, audience and first film are unknown, so templates can only be generic until a real brief exists.
- Remotion licensing (company-size terms) versus HyperFrames (Apache-2.0 per the skill's frontmatter) was not researched. It may affect the renderer choice for commercial use.
- Unresolved questions for the user: (a) Which renderer, Remotion or HyperFrames? (b) What is the first film or product? (c) Audio: licensed track or synthesized? (d) Which formats are required (16:9 + 9:16, or also 1:1)?
