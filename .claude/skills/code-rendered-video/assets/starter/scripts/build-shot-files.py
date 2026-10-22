"""Check the shot list and the copy file, then write the files that depend on them.

  shots.json + copy.json  ->  data/film-sections.json   shot boundaries in bars (for a new analysis
                                                         of the music: analyze-beat-grid.py --sections)
                          ->  data/audio.json            key "sections": the same boundaries in
                                                         seconds, which the app reads; the rest of
                                                         the file is left as it is
                          ->  STORYBOARD.md              the storyboard, for people

Usage (from the app folder, or from anywhere):
  bun run shots [-- GRID.json]                   (finds python3, python or py -3: scripts/python.ts)
  python3 scripts/build-shot-files.py [GRID.json]   (Windows: python or py -3 in place of python3)

The beat grid is read from data/audio.json: its "beats" list, and its "downbeats" list if it has one.
Bar 0 starts on the first downbeat, as in the analysis and in the engine; a grid without downbeats
starts bar 0 on its first beat. Another grid can be named on the command line: any JSON file with
such lists. Bars become seconds through the beat grid, never through a tempo number.

Every check runs before anything is written: a run either writes all three files or none. A failed
run prints one line per fault and exits with code 1. Some findings are warnings, printed but not
fatal: two shots in a row that come in by the same transition or make the same camera move (a shot
with `"repeat": true` declares that repetition intended), and a shot list longer than the audio.
Run this after every change to shots.json or copy.json, and after every new analysis of the music
(the analysis rewrites data/audio.json).

Plain python3, no packages.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
SHOTS_FILE = os.path.join(APP, "shots.json")
COPY_FILE = os.path.join(APP, "copy.json")
AUDIO = os.path.join(APP, "data", "audio.json")
SECTIONS_OUT = os.path.join(APP, "data", "film-sections.json")
DOC = os.path.join(APP, "STORYBOARD.md")
CONFIG = os.path.join(APP, "src", "project-config.ts")
ENGINE_TRANSITIONS = os.path.join(APP, "src", "engine", "transition.ts")

GROUP_KINDS = ("title", "section", "recap", "end")
HOW = {"plate": "Plate", "shot": "The shot sets the words", "none": "No words"}
PLACES = ("top", "middle", "bottom")
# kinds the checks let repeat: to the engine they are plain cuts
REPEATABLE = ("cut", "travel", "match")


def rel(p):
    return os.path.relpath(p, os.getcwd())


def fail(lines):
    for line in lines:
        print(f"error: {line}", file=sys.stderr)
    print(f"{len(lines)} fault(s); nothing was written.", file=sys.stderr)
    sys.exit(1)


def load(path, what):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        fail([f"{what} not found: {rel(path)}"])
    except json.JSONDecodeError as e:
        fail([f"{rel(path)} is not valid JSON: line {e.lineno}, column {e.colno}: {e.msg}"])


def engine_list(name):
    """A list of strings from src/engine/transition.ts (`export const NAME ... = [...]`), or None."""
    try:
        src = open(ENGINE_TRANSITIONS, encoding="utf-8").read()
    except OSError:
        return None
    m = re.search(r"export const " + name + r"\b[^=]*=\s*\[(.*?)\]", src, re.S)
    return re.findall(r"'([^']+)'", m.group(1)) if m else None


def film_title():
    try:
        m = re.search(r"title:\s*'((?:[^'\\]|\\.)*)'", open(CONFIG, encoding="utf-8").read())
        return m.group(1).replace("\\'", "'") if m else None
    except OSError:
        return None


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


# ---------------------------------------------------------------- read
S = load(SHOTS_FILE, "the shot list")
C = load(COPY_FILE, "the copy file")
grid_file = sys.argv[1] if len(sys.argv) > 1 else AUDIO
G = load(grid_file, "the beat grid" if len(sys.argv) > 1 else "data/audio.json (make one with `bun run make-grid -- --bpm 120 --bars 24`, or by an analysis of the music)")
A = G if grid_file == AUDIO else load(AUDIO, "data/audio.json")

errors = []
err = errors.append
# warnings are printed, never fatal: the run still writes its files
warnings = []

# ---------------------------------------------------------------- fields
for key, typ in (("transitions", dict), ("groups", list), ("shots", list), ("captions", list)):
    if not isinstance(S.get(key), typ):
        err(f"shots.json: `{key}` is missing or is not a{'n object' if typ is dict else ' list'}")
if not isinstance(C.get("sections"), list):
    err("copy.json: `sections` is missing or is not a list")
beats = G.get("beats")
if not isinstance(beats, list) or len(beats) < 2 or not all(is_num(b) for b in beats):
    err(f"{rel(grid_file)}: `beats` must be a list of at least two times in seconds")
if not is_num(A.get("duration")):
    err("data/audio.json: `duration` is missing")
if errors:
    fail(errors)

KINDS = S["transitions"]
groups_list, shots, captions, copies = S["groups"], S["shots"], S["captions"], C["sections"]

for i, g in enumerate(groups_list):
    where = f"group {g.get('id', f'#{i + 1}')}" if isinstance(g, dict) else f"group #{i + 1}"
    if not isinstance(g, dict) or not isinstance(g.get("id"), str):
        err(f"{where}: needs a string `id`")
        continue
    if g.get("kind") not in GROUP_KINDS:
        err(f"{where}: `kind` must be one of {', '.join(GROUP_KINDS)}")
    if g.get("kind") == "section":
        if not isinstance(g.get("n"), int) or not isinstance(g.get("name"), str):
            err(f"{where}: a section needs a whole number `n` and a `name`")
        if "reveal" in g and not is_num(g["reveal"]):
            err(f"{where}: `reveal` must be a bar number")
    elif not isinstance(g.get("label"), str):
        err(f"{where}: a {g.get('kind')} group needs a `label`")

for i, s in enumerate(shots):
    where = f"shot {s.get('id', f'#{i + 1}')}" if isinstance(s, dict) else f"shot #{i + 1}"
    if not isinstance(s, dict):
        err(f"{where}: must be an object")
        continue
    for k in ("id", "group", "title", "see", "move", "camera", "look"):
        if not isinstance(s.get(k), str) or not s[k].strip():
            err(f"{where}: `{k}` is missing or empty")
    for k in ("bar", "bars"):
        if not is_num(s.get(k)):
            err(f"{where}: `{k}` must be a number of bars")
    if is_num(s.get("bars")) and s["bars"] <= 0:
        err(f"{where}: `bars` must be more than 0")
    if s.get("tone") not in ("dark", "light"):
        err(f"{where}: `tone` must be dark or light")
    if isinstance(s.get("id"), str) and s["id"] != s["id"].lower():
        err(f"{where}: ids are lower case (the id is the name of the scene file)")
    t = s.get("in")
    if t is not None:
        if not isinstance(t, dict):
            err(f"{where}: `in` must be an object")
        else:
            for k in ("lead", "tail"):
                if not is_num(t.get(k)) or t[k] < 0:
                    err(f"{where}: `in.{k}` must be a number of beats, 0 or more")
    if "repeat" in s and not isinstance(s["repeat"], bool):
        err(f"{where}: `repeat` must be true or false")

for i, c in enumerate(captions):
    where = f"caption #{i + 1}"
    if not isinstance(c, dict):
        err(f"{where}: must be an object")
        continue
    where = f"caption {c.get('group')}/{c.get('kind')}"
    for k in ("group", "kind"):
        if not isinstance(c.get(k), str):
            err(f"{where}: `{k}` is missing")
    for k in ("bar", "bars"):
        if not is_num(c.get(k)):
            err(f"{where}: `{k}` must be a number of bars")
    if c.get("how") not in HOW:
        err(f"{where}: `how` must be one of {', '.join(HOW)}")
    elif c["how"] == "plate" and c.get("place") not in PLACES:
        err(f"{where}: a plate needs a place: {', '.join(PLACES)}")

for i, p in enumerate(copies):
    where = f"copy.json sections #{i + 1}"
    if not isinstance(p, dict) or not isinstance(p.get("group"), str):
        err(f"{where}: needs a `group`")
        continue
    where = f"copy.json section {p['group']}"
    if not isinstance(p.get("n"), int) or not isinstance(p.get("name"), str):
        err(f"{where}: needs `n` and `name`, equal to those of its group")
    lines = p.get("lines")
    if not isinstance(lines, dict) or not all(isinstance(v, list) and all(isinstance(x, str) for x in v) for v in lines.values()):
        err(f"{where}: `lines` must map each caption kind to a list of lines")
if errors:
    fail(errors)

# ---------------------------------------------------------------- the shot list
groups = {g["id"]: g for g in groups_list}
if len(groups) != len(groups_list):
    err("two groups share an id")
ids = [s["id"] for s in shots]
for x in sorted({x for x in ids if ids.count(x) > 1}):
    err(f"two shots share the id {x}")
if not shots:
    err("shots.json has no shots")
engine_kinds = engine_list("TRANSITION_KINDS")
if engine_kinds is not None:
    for kind in KINDS:
        if kind not in engine_kinds:
            err(f"transition kind `{kind}` is in shots.json but the engine cannot play it (src/engine/transition.ts)")
# Two shots in a row that repeat each other are usually a slip, so they are warned about. A film
# whose form is repetition says so with `"repeat": true` on the later shot, which silences the
# warnings about it and the shot before it.
for a, b in zip(shots, shots[1:]):
    if a["camera"] == b["camera"] and not b.get("repeat"):
        warnings.append(f"shots {a['id']} and {b['id']} make the same camera move (set \"repeat\": true on {b['id']} if the repetition is meant)")
for i, s in enumerate(shots):
    t = s.get("in")
    if i == 0:
        if t:
            err("the first shot has nothing to lead in from")
        continue
    if not t or t.get("kind") not in KINDS:
        err(f"shot {s['id']}: `in` must name one of {', '.join(KINDS)}")
        continue
    before = shots[i - 1]
    b_in = before.get("in") or {"tail": 0}
    if t["kind"] == b_in.get("kind") and t["kind"] not in REPEATABLE and not s.get("repeat"):
        warnings.append(f"shots {before['id']} and {s['id']} come in by the same transition (set \"repeat\": true on {s['id']} if the repetition is meant)")
    if t["lead"] + b_in.get("tail", 0) > before["bars"] * 4:
        err(f"shot {s['id']}: the lead of its transition runs into the tail of the one before")
    if t["tail"] > s["bars"] * 4:
        err(f"shot {s['id']}: the tail of its transition is longer than the shot")
at = shots[0]["bar"] if shots else 0
for s in shots:
    if abs(s["bar"] - at) > 1e-9:
        err(f"shot {s['id']} starts at bar {s['bar']:g}, the one before ends at bar {at:g}")
    if s["group"] not in groups:
        err(f"shot {s['id']} belongs to unknown group {s['group']}")
    at = s["bar"] + s["bars"]
# the shots of a group follow each other: its bars are taken from its first and last shot
seen, prev = set(), None
for s in shots:
    if s["group"] != prev and s["group"] in seen:
        err(f"the shots of group {s['group']} are not together: shot {s['id']} comes after shots of another group")
    seen.add(s["group"])
    prev = s["group"]
span = {}
for s in shots:
    a, b = span.get(s["group"], (s["bar"], s["bar"]))
    span[s["group"]] = (min(a, s["bar"]), max(b, s["bar"] + s["bars"]))
for g in groups_list:
    if g["id"] not in span:
        err(f"group {g['id']} has no shot")
    elif g.get("kind") == "section" and "reveal" in g and not span[g["id"]][0] <= g["reveal"] < span[g["id"]][1]:
        err(f"group {g['id']}: `reveal` {g['reveal']:g} lies outside its bars {span[g['id']][0]:g}..{span[g['id']][1]:g}")

# ---------------------------------------------------------------- copy, joined to the groups by `group`
copy_of = {}
for p in copies:
    g = groups.get(p["group"])
    if p["group"] in copy_of:
        err(f"copy.json has two entries for group {p['group']}")
    elif not g or g.get("kind") != "section":
        err(f"copy.json has an entry for {p['group']}, which is not a section group in shots.json")
    else:
        copy_of[p["group"]] = p
        if p["n"] != g["n"] or p["name"] != g["name"]:
            err(f"copy.json section {p['group']}: `n` and `name` ({p['n']}, {p['name']}) differ from its group ({g['n']}, {g['name']})")
ns = [g["n"] for g in groups_list if g.get("kind") == "section"]
for n in sorted({n for n in ns if ns.count(n) > 1}):
    err(f"two sections have the number {n}")
for g in groups_list:
    if g.get("kind") == "section" and g["id"] not in copy_of and any(c["group"] == g["id"] for c in captions):
        err(f"section {g['id']} has captions but no entry in copy.json")

# ---------------------------------------------------------------- captions
for c in captions:
    where = f"caption {c['group']}/{c['kind']}"
    g = groups.get(c["group"])
    if not g:
        err(f"{where}: unknown group {c['group']}")
        continue
    if g.get("kind") != "section":
        err(f"{where}: captions belong to numbered sections; {c['group']} is a {g.get('kind')} group")
        continue
    if c["group"] in span:
        a, b = span[c["group"]]
        if c["bar"] < a - 1e-9 or c["bar"] + c["bars"] > b + 1e-9:
            err(f"{where} runs outside bars {a:g}..{b:g}")
    p = copy_of.get(c["group"])
    if p and c["kind"] not in p["lines"]:
        err(f"{where}: copy.json has no sentence `{c['kind']}` for {c['group']}")
by_group = {}
for c in captions:
    by_group.setdefault(c["group"], []).append(c)
for g, cs in by_group.items():
    cs = sorted(cs, key=lambda c: c["bar"])
    for a, b in zip(cs, cs[1:]):
        if b["bar"] < a["bar"] + a["bars"] - 1e-9:
            err(f"captions {g}/{a['kind']} and {g}/{b['kind']} overlap: the overlay shows one caption at a time")
if errors:
    fail(errors)

# ---------------------------------------------------------------- times


def first_downbeat_index():
    # the beats before the first downbeat are a pickup: bar 0 starts after them
    downs = G.get("downbeats")
    if not isinstance(downs, list) or not downs or not is_num(downs[0]):
        return 0
    return min(range(len(beats)), key=lambda i: abs(beats[i] - downs[0]))


OFF = first_downbeat_index()


def t_of(bar):
    x = bar * 4 + OFF
    i = max(0, min(int(x), len(beats) - 2))
    return beats[i] + (beats[i + 1] - beats[i]) * (x - i)


def clock(bar):
    t = t_of(bar)
    return f"{int(t // 60)}:{t % 60:04.1f}"


def bars_label(a, n):
    b = a + n
    last = b - 1 if float(b).is_integer() else b
    return f"{a:g}" if n <= 1 else f"{a:g} to {last:g}"


def heading(g):
    return f"{g['n']:02d} {g['name']}" if g["kind"] == "section" else g["label"]


duration = A["duration"]
new_sections = [{"name": s["id"], "start": round(t_of(s["bar"]), 4), "end": round(t_of(s["bar"] + s["bars"]), 4)} for s in shots]
# the film ends with the track: the last shot keeps the end it had, or stops where the audio does
old_sections = A.get("sections") or []
last = new_sections[-1]
same = old_sections and old_sections[-1].get("name") == last["name"] and abs(old_sections[-1].get("start", -1) - last["start"]) < 1e-3
last["end"] = old_sections[-1]["end"] if same else min(last["end"], round(duration, 4))
end_bar = shots[-1]["bar"] + shots[-1]["bars"]
if t_of(end_bar) > duration + 1e-3:
    warnings.append(f"the shot list runs to {t_of(end_bar):.2f} s, past the end of the audio at {duration:.2f} s; the last shot is cut there")
if end_bar * 4 + OFF > len(beats):
    warnings.append(f"the shot list runs past the last beat of the grid (bar {(len(beats) - OFF) / 4:g}); times after it are extrapolated")

# ---------------------------------------------------------------- the document
drop_kinds = engine_list("DROP_KINDS") or []
title = film_title()
out = []
w = out.append
w(f"# Storyboard{': ' + title if title else ''}")
w("")
w("Generated from `shots.json` and `copy.json` by `scripts/build-shot-files.py`. Do not edit this file: "
  "change the data and run the script again.")
w("")
w("## 1. Overview")
w("")
w("| Part | Bars | Length in bars | Starts | Shots | How it is told |")
w("|---|---|---|---|---|---|")
for g in groups_list:
    a, b = span[g["id"]]
    n = sum(1 for s in shots if s["group"] == g["id"])
    w(f"| {heading(g)} | {bars_label(a, b - a)} | {b - a:g} | {clock(a)} | {n} | {g.get('shape', '')} |")
total = min(t_of(end_bar), duration)
w("")
w(f"{len(shots)} shots, bars {shots[0]['bar']:g} to {end_bar:g}, {total:.1f} seconds.")
w("")
w("## 2. Transitions")
w("")
w("A transition belongs to the shot it leads into. Its lead is played over the end of the shot before, its tail over the start of the shot it leads into.")
w("")
w("| Kind | Uses | What it does |")
w("|---|---|---|")
for kind, v in KINDS.items():
    n = sum(1 for x in shots if (x.get("in") or {}).get("kind") == kind)
    w(f"| {v.get('label', kind)} (`{kind}`) | {n} | {v.get('what', '')} |")
notes = [x for x in shots if (x.get("in") or {}).get("note")]
if notes:
    w("")
    w("Transitions the shots take part in, and what they ask of the builders:")
    w("")
    w("| Bar | Time | Into shot | Transition | What to do |")
    w("|---|---|---|---|---|")
    for x in notes:
        w(f"| {x['bar']:g} | {clock(x['bar'])} | {x['title']} | {KINDS[x['in']['kind']].get('label', x['in']['kind'])} | {x['in']['note']} |")
drops = [x for x in shots if (x.get("in") or {}).get("kind") in drop_kinds]
if drops:
    w("")
    w("Cuts into a drop. The last beats of the shot before belong to the transition: what matters in that shot must be over before its lead begins.")
    w("")
    w("| Bar | Time | Into shot | Transition | Lead, tail (beats) |")
    w("|---|---|---|---|---|")
    for x in drops:
        w(f"| {x['bar']:g} | {clock(x['bar'])} | {x['title']} | {KINDS[x['in']['kind']].get('label', x['in']['kind'])} | {x['in']['lead']:g}, {x['in']['tail']:g} |")
w("")
w("## 3. Words on screen")
w("")
w("| Way | Who sets the words | Captions |")
w("|---|---|---|")
w(f"| Plate | The overlay, on a plate at the top, the middle or the bottom | {sum(1 for c in captions if c['how'] == 'plate')} |")
w(f"| The shot sets the words | The builder, as a thing in the picture | {sum(1 for c in captions if c['how'] == 'shot')} |")
w(f"| No words | Nobody: the picture says it | {sum(1 for c in captions if c['how'] == 'none')} |")
w("")
w("While a shot is still a storyboard card, the studio shows every caption of it as a plate, so all the words can be read in the animatic. "
  "A plate with a dashed edge disappears when its shot is built.")
kinds_order = []
for p in copies:
    for k in p["lines"]:
        if k not in kinds_order:
            kinds_order.append(k)
if copies:
    w("")
    w("| # | Section | " + " | ".join(f"`{k}`" for k in kinds_order) + " |")
    w("|---|---|" + "---|" * len(kinds_order))
    for p in sorted(copies, key=lambda p: p["n"]):
        w(f"| {p['n']} | {p['name']} | " + " | ".join(" / ".join(p["lines"].get(k, [])) for k in kinds_order) + " |")
for key, label in (("title", "Title card"), ("closing", "End card")):
    words = C.get(key)
    if isinstance(words, dict) and words:
        w("")
        w(f"{label}: " + "; ".join(f"`{k}` {' / '.join(v) if isinstance(v, list) else v}" for k, v in words.items()))
w("")
w("## 4. Shot by shot")
for g in groups_list:
    w("")
    w(f"### {heading(g)}")
    w("")
    if g.get("shape"):
        w(g["shape"])
        w("")
    if g["kind"] == "section" and "reveal" in g:
        w(f"The name is shown from bar {g['reveal']:g} ({clock(g['reveal'])}). Before it the counter shows `???`.")
        w("")
    w("| Bars | Time | Ground | Comes in by | Shot | On screen | With the music | Camera | Look |")
    w("|---|---|---|---|---|---|---|---|---|")
    for s in shots:
        if s["group"] != g["id"]:
            continue
        into = KINDS[s["in"]["kind"]].get("label", s["in"]["kind"]) if s.get("in") else ""
        w(f"| {bars_label(s['bar'], s['bars'])} | {clock(s['bar'])} | {s['tone']} | {into} | {s['title']} (`{s['id']}`) | {s['see']} | {s['move']} | {s['camera']} | {s['look']} |")
    cs = by_group.get(g["id"], [])
    if cs:
        p = copy_of[g["id"]]
        w("")
        w("| Caption | Bars | Words | Way | Why |")
        w("|---|---|---|---|---|")
        for c in cs:
            how = HOW[c["how"]] + (f", {c['place']}" if c["how"] == "plate" else "")
            w(f"| `{c['kind']}` | {bars_label(c['bar'], c['bars'])} | {' / '.join(p['lines'][c['kind']])} | {how} | {c.get('why', '')} |")
w("")

# ---------------------------------------------------------------- write, only now that every check has passed


def write(path, text):
    tmp = path + ".tmp"
    # LF on every system, so the generated files match the shipped ones on Windows too
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    os.replace(tmp, path)


audio_changed = new_sections != old_sections
os.makedirs(os.path.dirname(SECTIONS_OUT), exist_ok=True)
write(SECTIONS_OUT, json.dumps([{"name": s["id"], "bar": s["bar"], "bars": s["bars"]} for s in shots], indent=1) + "\n")
if audio_changed:
    A["sections"] = new_sections
    write(AUDIO, json.dumps(A, ensure_ascii=False))
write(DOC, "\n".join(out))
for line in warnings:
    print(f"warning: {line}")
print(f"{len(shots)} shots, bars {shots[0]['bar']:g}..{end_bar:g}, {total:.2f}s")
print("wrote", rel(SECTIONS_OUT))
print("wrote" if audio_changed else "unchanged", rel(AUDIO))
print("wrote", rel(DOC))
