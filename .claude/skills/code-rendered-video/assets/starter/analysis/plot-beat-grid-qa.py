"""QA images for a beat-grid analysis, meant to be looked at, not just generated.

1. structure.png: energy per bar in three bands across the whole track, with
   8-bar phrase lines, so intro, build, drop and breakdown can be read off.
2. zoom-*.png: the low-band waveform for a few bars at several points in the
   track with the beat grid drawn on top, so grid alignment can be checked.

Usage:
  python plot-beat-grid-qa.py IN.wav ANALYSIS.json OUT_DIR
"""
import json
import os
import sys

import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import scipy.signal as sg

wav, js, out_dir = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
A = json.load(open(js))
fps = A["fps"]
db = np.array(A["downbeats"])
beats = np.array(A["beats"])
period = 60.0 / A["bpm"]

# ---- 1. structure: mean envelope per bar --------------------------------
fig, ax = plt.subplots(figsize=(19.2, 6.4), dpi=100)
bars = np.arange(len(db))
width = 0.28
for k, (name, col) in enumerate([("low", "#d62728"), ("mid", "#7f7f7f"), ("high", "#1f77b4")]):
    env = np.array(A["features"][name])
    vals = [env[int(t * fps): int((t + 4 * period) * fps)].mean() if int(t * fps) < len(env) else 0 for t in db]
    ax.bar(bars + (k - 1) * width, vals, width, label=name, color=col)
for b in range(0, len(db), 8):
    ax.axvline(b - 0.5, color="k", lw=0.8, alpha=0.5)
    ax.text(b - 0.4, ax.get_ylim()[1] * 0.96, f"bar {b}\n{db[b]:.1f}s", fontsize=8, va="top")
ax.set_xlabel("bar (0 = first downbeat)")
ax.set_ylabel("mean envelope, 0..1")
ax.set_title(f"{os.path.basename(wav)}  {A['bpm']} BPM  {A['duration']:.1f}s  bar offset {A['notes']['bar_offset']}")
ax.legend(loc="lower right")
ax.set_xlim(-1, len(db))
fig.tight_layout()
fig.savefig(os.path.join(out_dir, "structure.png"))
plt.close(fig)

# ---- 2. zooms: low band vs grid ------------------------------------------
y, sr = librosa.load(wav, sr=22050, mono=True)
sos = sg.butter(4, 150, "low", fs=sr, output="sos")
low = sg.sosfiltfilt(sos, y)
for frac in (0.1, 0.35, 0.6, 0.85):
    b0 = int(len(db) * frac)
    t0, t1 = db[b0] - 0.1, db[min(b0 + 2, len(db) - 1)] + 0.1
    seg = low[int(t0 * sr): int(t1 * sr)]
    t = np.arange(len(seg)) / sr + t0
    fig, ax = plt.subplots(figsize=(19.2, 4.2), dpi=100)
    ax.plot(t, seg, lw=0.6, color="#333")
    for b in beats[(beats >= t0) & (beats <= t1)]:
        is_down = np.any(np.abs(db - b) < 1e-3)
        ax.axvline(b, color="#d62728" if is_down else "#1f77b4", lw=1.6 if is_down else 1.0)
    ax.set_title(f"low band (<150 Hz) from bar {b0}: red = downbeat, blue = beat. A kick should start on each line")
    ax.set_xlim(t0, t1)
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, f"zoom-bar-{b0:03d}.png"))
    plt.close(fig)

print("wrote", sorted(os.listdir(out_dir)))
