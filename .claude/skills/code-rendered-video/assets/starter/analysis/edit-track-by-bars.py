"""Cut a track down to a list of bar ranges, and carry its beat grid across.

Every join sits a few milliseconds before a downbeat, so the click of the
kick that follows is never cut, and is crossfaded with equal power. The beat
grid of the result is not re-detected: each source beat is moved by the same
offset as the audio it belongs to, so the grid stays exact through the edit.

Usage:
  python edit-track-by-bars.py IN.wav ANALYSIS.json EDIT.json OUT.wav OUT_GRID.json

EDIT.json:
  {"lead_ms": 15, "crossfade_ms": 10, "fade_in_ms": 400, "fade_out_s": 3.0,
   "segments": [{"src_bar": 3, "bars": 60}, {"src_bar": 117, "bars": null}]}
  bars = null means "to the end of the file".
"""
import json
import sys

import numpy as np
import soundfile as sf

wav, analysis, edit, out_wav, out_grid = sys.argv[1:6]
A = json.load(open(analysis))
E = json.load(open(edit))
y, sr = sf.read(wav, always_2d=True)
beats = np.array(A["beats"])
off = A["notes"]["bar_offset"]
downs = beats[off::4]
lead = E["lead_ms"] / 1000.0
xf = int(sr * E["crossfade_ms"] / 1000.0)
half = xf // 2

parts, grid, joins, cursor = [], [], [], 0.0
for k, seg in enumerate(E["segments"]):
    t0 = max(downs[seg["src_bar"]] - lead, 0.0)
    t1 = len(y) / sr if seg["bars"] is None else downs[seg["src_bar"] + seg["bars"]] - lead
    a, b = int(round(t0 * sr)), int(round(t1 * sr))
    # take half a crossfade extra on each inner edge, so the join is centred
    a_x = a - half if k > 0 else a
    b_x = min(b + half, len(y)) if k < len(E["segments"]) - 1 else b
    parts.append(y[a_x:b_x].copy())
    # beats that belong to this segment, moved to film time
    first_beat = seg["src_bar"] * 4 + off
    last_beat = len(beats) if seg["bars"] is None else (seg["src_bar"] + seg["bars"]) * 4 + off
    grid += [float(beats[i] - t0 + cursor) for i in range(first_beat, min(last_beat, len(beats)))]
    if k > 0:
        joins.append(round(cursor, 4))
    cursor += (b - a) / sr

# equal-power crossfades
out = parts[0]
ramp = np.linspace(0.0, np.pi / 2, xf)[:, None]
for p in parts[1:]:
    tail, head = out[-xf:], p[:xf]
    mixed = tail * np.cos(ramp) + head * np.sin(ramp)
    out = np.concatenate([out[:-xf], mixed, p[xf:]])

n_in = int(sr * E["fade_in_ms"] / 1000.0)
out[:n_in] *= np.linspace(0.0, 1.0, n_in)[:, None] ** 2
n_out = int(sr * E["fade_out_s"])
out[-n_out:] *= np.cos(np.linspace(0.0, np.pi / 2, n_out))[:, None]

sf.write(out_wav, out, sr, subtype="PCM_16")
dur = len(out) / sr
grid = [g for g in grid if 0.0 <= g < dur]
json.dump({"duration": round(dur, 4), "beats": [round(g, 4) for g in grid],
           "downbeats": [round(g, 4) for g in grid[0::4]], "joins": joins,
           "source": wav, "edit": E}, open(out_grid, "w"), indent=1)

print(f"wrote {out_wav}: {dur:.2f}s, {len(grid)} beats, {len(grid) // 4} full bars")
print(f"joins at (film time, s): {joins}")
print(f"first downbeat at {grid[0] * 1000:.1f}ms")
