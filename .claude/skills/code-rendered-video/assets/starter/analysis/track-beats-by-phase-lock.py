"""Beat grid for a track whose kick cannot be followed all the way through.

analyze-beat-grid.py follows the kicks one by one and spaces the beats evenly
wherever there is no kick. Over a long stretch without a clean kick (a
breakdown, or a drop where a side-chained bass hides it) that spacing can hold
one beat too many or too few. This script walks the track beat by beat
instead, like a phase-locked loop: it predicts the next beat from the current
period, looks for a kick or any sharp onset close to the prediction, and
corrects itself by part of the difference. It starts from the longest run of
beats the kick analysis measured, where the grid is known to be right.

Usage:
  python track-beats-by-phase-lock.py IN.wav KICK_ANALYSIS.json OUT_GRID.json [--bar-offset N]

KICK_ANALYSIS.json is the output of analyze-beat-grid.py for the same file.
OUT_GRID.json has the form analyze-beat-grid.py takes with --beats-from: its
first beat is beat one of a bar. --bar-offset says which tracked beat
(index mod 4, counted from the first beat at or after time zero) is beat one.
"""
import argparse
import json

import librosa
import numpy as np

SR = 44100
HOP = 64              # 1.45 ms per frame of the onset envelope
WINDOW = 0.032        # evidence is looked for this far either side of the prediction
PHASE_GAIN = 0.5      # share of the error taken up by the beat itself
PERIOD_GAIN = 0.04    # share of the error taken up by the period
PERIOD_SLACK = 0.02   # the period stays within 2% of where it started


def longest_run(flags):
    best, start = (0, 0), None
    for i, f in enumerate(list(flags) + ["0"]):
        if f == "1" and start is None:
            start = i
        if f != "1" and start is not None:
            if i - start > best[1] - best[0]:
                best = (start, i)
            start = None
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("kick_analysis")
    ap.add_argument("out")
    ap.add_argument("--bar-offset", type=int, default=0)
    a = ap.parse_args()

    A = json.load(open(a.kick_analysis))
    y, _ = librosa.load(a.wav, sr=SR, mono=True)
    dur = len(y) / SR
    env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP, aggregate=np.median)
    frame = lambda t: int(round(t * SR / HOP))

    kicks = np.array([k[0] for k in A["onsets"]["kick"]])
    seed_a, seed_b = longest_run(A["notes"]["measured_flags"])
    # the ends of a run border on beats that were not measured, and are the least sure: leave them out
    seed_a, seed_b = seed_a + 2, seed_b - 2
    seed = np.array(A["beats"][seed_a:seed_b])
    if len(seed) < 16:
        raise SystemExit("the kick analysis has no run of 16 measured beats to start from")
    slope, _ = np.polyfit(np.arange(len(seed)), seed, 1)
    p0 = float(slope)

    # the onset envelope peaks a little after the attack: measure by how much, on the seed beats
    lags = []
    for t in seed:
        f0 = frame(t)
        w = env[max(0, f0 - 10): f0 + 40]
        lags.append((np.argmax(w) - min(10, f0)) * HOP / SR)
    lag = float(np.median(lags))
    floor = float(np.median(env)) * 2.0

    def evidence(pred):
        """Time of the beat as the audio shows it near `pred`, or None."""
        if len(kicks):
            k = kicks[np.argmin(np.abs(kicks - pred))]
            if abs(k - pred) <= WINDOW:
                return float(k), "kick"
        f0, r = frame(pred + lag), frame(WINDOW)
        lo, hi = max(0, f0 - r), min(len(env), f0 + r + 1)
        if hi - lo < 3:
            return None, None
        i = int(np.argmax(env[lo:hi]))
        if env[lo + i] < floor or i in (0, hi - lo - 1):
            return None, None
        return (lo + i) * HOP / SR - lag, "onset"

    def walk(t, p, direction, until):
        out, kinds = [], []
        while True:
            pred = t + direction * p
            if (direction > 0 and pred >= until) or (direction < 0 and pred < until):
                return out, kinds
            seen, kind = evidence(pred)
            err = 0.0 if seen is None else seen - pred
            t = pred + PHASE_GAIN * err
            p = float(np.clip(p + direction * PERIOD_GAIN * err, p0 * (1 - PERIOD_SLACK), p0 * (1 + PERIOD_SLACK)))
            out.append(t)
            kinds.append(kind or "none")

    fwd, fk = walk(seed[-1], p0, +1, dur)
    back, bk = walk(seed[0], p0, -1, 0.0)
    beats = np.array(back[::-1] + list(seed) + fwd)
    kinds = bk[::-1] + ["kick"] * len(seed) + fk

    first = a.bar_offset % 4
    grid = beats[first:]
    json.dump({
        "duration": round(dur, 4),
        "beats": [round(float(b), 4) for b in grid],
        "downbeats": [round(float(b), 4) for b in grid[0::4]],
        "joins": [],
        "source": a.wav,
        "notes": {
            "method": "phase-locked walk from the longest run of kick-measured beats; each beat is "
                      "pulled towards a kick, or failing that a sharp onset, within 32 ms of its prediction",
            "seed_beats": [int(seed_a), int(seed_b)], "seed_period_s": round(p0, 5),
            "onset_lag_ms": round(lag * 1000, 2),
            "locked_on": {k: kinds[first:].count(k) for k in ("kick", "onset", "none")},
            "bar_offset_applied": first,
        },
    }, open(a.out, "w"), indent=1)

    per = np.diff(grid)
    local = [round(60.0 / float(np.mean(per[i: i + 16])), 2) for i in range(0, len(per) - 15, 16)]
    print(f"{len(grid)} beats, {len(grid) // 4} full bars, first beat {grid[0]:.3f}s, last {grid[-1]:.3f}s of {dur:.2f}s")
    print(f"seed: kick beats {seed_a}..{seed_b}, period {p0:.5f}s = {60 / p0:.3f} bpm; onset lag {lag * 1000:.1f}ms")
    print(f"locked on: {json.dumps({k: kinds.count(k) for k in ('kick', 'onset', 'none')})}")
    print(f"local bpm every 16 beats: {local}")
    print(f"period min {per.min():.4f}s max {per.max():.4f}s")


if __name__ == "__main__":
    main()
