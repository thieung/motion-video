"""Beat-grid and energy analysis for an instrumental track.

Writes the JSON the render engine loads (see src/engine/audio.ts):
duration, bpm, fps, beats, downbeats, sections, features, onsets.

Method
1. Kicks are located on the low band (<150 Hz) and aligned to their click.
2. The beat list is built by following the kicks one after another, so it
   tracks the tempo wherever it goes. Generated music does not hold one tempo:
   a track can sit at 138 BPM in one passage and 140 in another, and no
   regular grid fits that. The engine accepts uneven beat times.
3. Where there is no kick (intro, breakdown), beats are spaced evenly between
   the kicks on either side.
4. Bar phase is voted by kick re-entries: after a passage with no kick, the
   kick comes back on beat one. Energy novelty is the tie-breaker.

Usage:
  python analyze-beat-grid.py IN.wav OUT.json [--sections sections.json]
                              [--bpm-min 125 --bpm-max 180] [--bar-offset N]
"""
import argparse
import json
import sys

import librosa
import numpy as np
import scipy.ndimage as ndi
import scipy.signal as sg

SR = 44100
ENV_SR = 1000             # rate of the time-domain band envelopes
ENV_FPS = 100             # envelope rate stored in the JSON
ON_BEAT_TOL = 0.12        # a kick within this fraction of a beat of the prediction is on the beat
LONG_GAP_BEATS = 8        # after a gap this long, the grid re-locks to the returning kicks


def band_envelope(y, lo, hi, smooth_ms=4.0):
    """Amplitude envelope of a band at ENV_SR, from a zero-phase filtered signal.

    The envelope is the magnitude of the analytic signal. A short RMS window
    must not be used on the low band: one cycle at 50 Hz lasts 20 ms, so the
    window follows the waveform itself and every cycle reads as an attack.
    """
    if lo <= 0:
        sos = sg.butter(4, hi, "low", fs=SR, output="sos")
    elif hi >= SR / 2:
        sos = sg.butter(4, lo, "high", fs=SR, output="sos")
    else:
        sos = sg.butter(4, [lo, hi], "band", fs=SR, output="sos")
    e = np.abs(sg.hilbert(sg.sosfiltfilt(sos, y), N=int(2 ** np.ceil(np.log2(len(y)))))[: len(y)])
    n = max(1, int(SR * smooth_ms / 1000))
    e = np.convolve(e, np.ones(n) / n, mode="same")
    # Sample at exact times. Striding by SR // ENV_SR would run at 1002.27 Hz
    # for 44.1 kHz audio, a 0.227% time-scale error that reaches 0.4 s by 3 minutes.
    idx = np.round(np.arange(int(len(y) / SR * ENV_SR)) * (SR / ENV_SR)).astype(int)
    return e[np.minimum(idx, len(e) - 1)]


def attacks(env, min_gap_s, rel_thresh):
    """Attack times of a percussive band as [time, strength 0..1].

    Used for snare and hat, where relative change on a log scale is the right
    measure. Not used for the kick; see kick_attacks.
    """
    le = np.log(env / (np.percentile(env, 20) + 1e-9) + 1.0)
    d = ndi.uniform_filter1d(np.maximum(np.diff(le, prepend=le[0]), 0.0), 5)
    peaks, props = sg.find_peaks(d, height=rel_thresh * np.percentile(d, 99.9), distance=int(min_gap_s * ENV_SR))
    if len(peaks) == 0:
        return []
    top = np.percentile(props["peak_heights"], 95) + 1e-9
    return [[round(p / ENV_SR, 4), round(float(min(h / top, 1.0)), 3)] for p, h in zip(peaks, props["peak_heights"])]


def kick_attacks(y, low_env):
    """Kick times as [time, strength 0..1], aligned to the kick's click.

    Between kicks a bass line makes the low envelope ripple, and each ripple
    looks like a small attack. A kick is different in kind: the envelope steps
    up to a plateau. So the envelope is smoothed until the ripple is gone, and
    a kick is a peak in the slope of what remains. For a step smoothed by a
    symmetric kernel, the steepest point is the step itself.

    That point trails the audible start of the kick, because the low band
    takes a few milliseconds to build. The click in the high band marks the
    start, so the median lag between the two is measured and removed.
    """
    sm = ndi.gaussian_filter1d(low_env, 12.0)          # sigma in samples = ms at ENV_SR
    d = np.maximum(np.gradient(sm), 0.0)
    rough, props = sg.find_peaks(d, height=0.0, distance=int(0.18 * ENV_SR))
    if len(rough) < 8:
        raise SystemExit("no kicks found; this method needs a kick drum to build the grid from")
    typical = np.percentile(props["peak_heights"], 90)
    keep = (props["peak_heights"] >= 0.35 * typical) & (rough > 0) & (rough < len(d) - 1)
    peaks, heights = rough[keep], props["peak_heights"][keep]
    # parabolic interpolation of the slope peak for sub-millisecond position
    a, b, c = d[peaks - 1], d[peaks], d[peaks + 1]
    t = (peaks + 0.5 * (a - c) / (a - 2 * b + c + 1e-12)) / ENV_SR

    hi = band_envelope(y, 2000, 16000, 1.0)
    dh = np.maximum(np.diff(hi, prepend=hi[0]), 0.0)
    floor = np.percentile(dh, 99)
    lags = []
    for p in peaks:
        lo_i = max(p - 35, 0)
        w = dh[lo_i: p + 10]
        if len(w) and w.max() > 3 * floor:
            lags.append((p - (lo_i + int(np.argmax(w)))) / ENV_SR)
    lag = float(np.median(lags)) if len(lags) >= 8 else 0.0
    kicks = [[round(float(x - lag), 4), round(float(min(h / typical, 1.0)), 3)] for x, h in zip(t, heights)]
    return kicks, lag, len(lags)


def starting_period(kt, bpm_min, bpm_max):
    """Median interval between neighbouring kicks that lies in the tempo range."""
    ioi = np.diff(kt)
    cand = ioi[(ioi > 60.0 / bpm_max) & (ioi < 60.0 / bpm_min)]
    if len(cand) < 8:
        raise SystemExit("too few regular kicks in the tempo range; widen --bpm-min/--bpm-max")
    return float(np.median(cand))


def starts_regular_run(kt, i, p, need=3):
    """True if kick i is followed by `need` kicks each about one beat apart."""
    if i + need >= len(kt):
        return False
    return bool(np.all(np.abs(np.diff(kt[i: i + need + 1]) / p - 1.0) < ON_BEAT_TOL))


def track_beats(kt, p0, dur):
    """Follow the kicks into a beat list. Returns beats and a measured-flag per beat."""
    start = next(i for i in range(len(kt)) if starts_regular_run(kt, i, p0))
    beats, measured, p = [kt[start]], [True], p0
    for i in range(start + 1, len(kt)):
        m = (kt[i] - beats[-1]) / p
        mr = int(round(m))
        if mr < 1:
            continue                                   # an extra kick inside the beat
        if mr >= LONG_GAP_BEATS:
            if not starts_regular_run(kt, i, p):
                continue                               # a stray hit during a breakdown
        elif abs(m - mr) > ON_BEAT_TOL:
            continue                                   # an off-beat kick
        step = (kt[i] - beats[-1]) / mr
        last = beats[-1]
        for j in range(1, mr):
            beats.append(last + j * step)
            measured.append(False)
        beats.append(kt[i])
        measured.append(True)
        if mr <= 2:
            p = 0.8 * p + 0.2 * step                   # follow the tempo, slowly
    # extend to the start and the end of the file at the local tempo
    head = np.mean(np.diff(beats[:8]))
    tail = np.mean(np.diff(beats[-8:]))
    while beats[0] - head >= 0:
        beats.insert(0, beats[0] - head)
        measured.insert(0, False)
    while beats[-1] + tail < dur:
        beats.append(beats[-1] + tail)
        measured.append(False)
    return np.array(beats), np.array(measured)


def bar_phase(measured, beat_energy, forced):
    """Which beat index (mod 4) is beat one."""
    votes = np.zeros(4)
    for b in range(8, len(measured)):
        if measured[b] and not measured[b - 8: b].any():   # kick returns after two silent bars
            votes[b % 4] += 1
    nov = np.abs(np.diff(beat_energy, prepend=beat_energy[0]))
    nov_by = np.array([nov[k::4].sum() for k in range(4)])
    if forced is not None:
        off = forced
    elif votes.max() > 0 and (votes == votes.max()).sum() == 1:
        off = int(np.argmax(votes))
    else:
        off = int(np.argmax(nov_by))
    return off, votes.tolist(), np.round(nov_by, 2).tolist()


def stored_envelope(env, n_out):
    """Attack/release smoothed envelope at ENV_FPS, normalised to 0..1."""
    att, rel = np.exp(-1 / (0.010 * ENV_SR)), np.exp(-1 / (0.090 * ENV_SR))
    y = np.empty_like(env)
    v = 0.0
    for i, s in enumerate(env):
        c = att if s > v else rel
        v = c * v + (1 - c) * s
        y[i] = v
    y = np.interp(np.arange(n_out) / ENV_FPS, np.arange(len(y)) / ENV_SR, y)
    return np.round(y / (np.percentile(y, 99.5) + 1e-9), 4).clip(0, 1).tolist()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("out")
    ap.add_argument("--sections", help="JSON list of {name, bar, bars}; bars are counted from the first downbeat")
    ap.add_argument("--bpm-min", type=float, default=125.0)
    ap.add_argument("--bpm-max", type=float, default=180.0)
    ap.add_argument("--bar-offset", type=int, help="beat index mod 4 that is beat one; voted if omitted")
    ap.add_argument("--beats-from", help="grid JSON from edit-track-by-bars.py; its beats are used as they are, "
                                         "with the first beat as beat one, and kicks are only checked against them")
    a = ap.parse_args()

    y, _ = librosa.load(a.wav, sr=SR, mono=True)
    dur = len(y) / SR
    env = {
        "rms": band_envelope(y, 0, 16000), "low": band_envelope(y, 0, 150),
        "mid": band_envelope(y, 150, 2000), "high": band_envelope(y, 4000, 16000),
    }

    kicks, click_lag, click_n = kick_attacks(y, env["low"])
    kt = np.array([k[0] for k in kicks])
    kick_err_ms = None
    if a.beats_from:
        beats = np.array(json.load(open(a.beats_from))["beats"])
        nearest = np.array([np.min(np.abs(kt - b)) for b in beats])
        measured = nearest < 0.030
        a.bar_offset = 0
        # signed distance from each beat to its kick: checks the carried grid against the edited audio
        signed = np.array([kt[np.argmin(np.abs(kt - b))] - b for b in beats[measured]]) * 1000.0
        kick_err_ms = {"median": round(float(np.median(signed)), 2),
                       "p95_abs": round(float(np.percentile(np.abs(signed), 95)), 2)}
    else:
        beats, measured = track_beats(kt, starting_period(kt, a.bpm_min, a.bpm_max), dur)
    periods = np.diff(beats)
    local_bpm = [round(60.0 / float(np.mean(periods[i: i + 16])), 2) for i in range(0, len(periods) - 15, 16)]

    step = int(np.median(periods) * ENV_SR)
    idx = np.clip((beats * ENV_SR).astype(int), 0, len(env["rms"]) - step - 1)
    beat_e = np.array([np.log1p(env["rms"][i: i + step].mean() * 50) for i in idx])
    off, votes, nov_by = bar_phase(measured, beat_e, a.bar_offset)
    downbeats = beats[off::4]

    sections = [{"name": "all", "start": 0.0, "end": round(dur, 3)}]
    if a.sections:
        bar_t = lambda b: float(np.interp(b * 4 + off, np.arange(len(beats)), beats))
        sections = [{"name": s["name"], "start": round(bar_t(s["bar"]), 4),
                     "end": round(bar_t(s["bar"] + s["bars"]), 4)} for s in json.load(open(a.sections))]

    n_env = int(dur * ENV_FPS)
    out = {
        "source": a.wav, "duration": round(dur, 4),
        "bpm": round(60.0 / float(np.median(periods)), 3), "fps": ENV_FPS,
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(b), 4) for b in downbeats],
        "sections": sections,
        "features": {k: stored_envelope(v, n_env) for k, v in env.items()},
        "onsets": {
            "kick": kicks,
            "snare": attacks(band_envelope(y, 180, 2500, 4.0), 0.12, 0.30),
            "hat": attacks(band_envelope(y, 7000, 16000, 3.0), 0.05, 0.30),
        },
        "notes": {
            "method": "beats follow the detected kicks one by one; beats with no kick are spaced evenly "
                      "between measured neighbours; bpm is the median, the tempo is not constant",
            "beats_measured": int(measured.sum()), "beats_interpolated": int((~measured).sum()),
            "kicks_total": len(kicks),
            "grid_source": a.beats_from or "tracked from kicks",
            "kick_minus_beat_ms": kick_err_ms,
            "click_lag_ms": round(click_lag * 1000, 2), "click_lag_measured_on": click_n,
            "local_bpm_every_16_beats": local_bpm,
            "bar_offset": off, "reentry_votes": votes, "novelty_by_offset": nov_by,
            "measured_flags": "".join("1" if m else "0" for m in measured),
            "stems": "none: vocal, drums, bass and other envelopes are absent",
        },
    }
    json.dump(out, open(a.out, "w"))

    N = out["notes"]
    print(f"duration {dur:.2f}s  median bpm {out['bpm']}  beats {len(beats)}  bars {len(downbeats)}  first downbeat {downbeats[0]:.3f}s")
    print(f"kicks {N['kicks_total']}; beats measured {N['beats_measured']}, interpolated {N['beats_interpolated']}; "
          f"click lag {N['click_lag_ms']}ms on {N['click_lag_measured_on']} kicks")
    if kick_err_ms:
        print(f"carried grid against kicks in the edited audio: median {kick_err_ms['median']}ms, p95 |err| {kick_err_ms['p95_abs']}ms")
    print(f"local bpm every 16 beats: {local_bpm}")
    print(f"bar offset {off}  re-entry votes {votes}  novelty {nov_by}")


if __name__ == "__main__":
    sys.exit(main())
