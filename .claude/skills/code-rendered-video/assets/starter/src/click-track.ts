// A click track made from the beat grid, for the studio when the film has no music file yet (or
// the owner wants to hear the grid itself). Built in the page as a WAV file in memory and played by
// the same audio element as a real track, so the studio's clock, seeking and looping do not change.
//
// Every sample is worked out from the beat times alone: the same grid always gives the same sound.
import type { AudioData } from './engine/audio';

const RATE = 22050;
/** Length of one click in seconds, and the pitch of a downbeat and of the other beats. */
const CLICK = 0.035, HIGH = 1760, LOW = 1175;

/** The object URL of a mono 16-bit WAV as long as the film, with a click on every beat of the grid. */
export function clickTrackUrl(au: AudioData): string {
  const n = Math.ceil(au.duration * RATE);
  const pcm = new Int16Array(n);
  const down = au.downbeats;
  const isDown = (t: number) => down.some((d) => Math.abs(d - t) < 1e-3);
  for (const t of au.beats) {
    const accent = isDown(t);
    const f = accent ? HIGH : LOW, amp = accent ? 0.55 : 0.32;
    const i0 = Math.round(t * RATE), len = Math.round(CLICK * RATE);
    for (let i = 0; i < len && i0 + i < n; i++) {
      if (i0 + i < 0) continue;
      const s = i / RATE;
      const v = amp * Math.sin(2 * Math.PI * f * s) * Math.exp(-s / (CLICK / 5));
      pcm[i0 + i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i0 + i]! + v * 32767)));
    }
  }
  const head = new DataView(new ArrayBuffer(44));
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) head.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); head.setUint32(4, 36 + pcm.byteLength, true); str(8, 'WAVE');
  str(12, 'fmt '); head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true);
  head.setUint32(24, RATE, true); head.setUint32(28, RATE * 2, true); head.setUint16(32, 2, true); head.setUint16(34, 16, true);
  str(36, 'data'); head.setUint32(40, pcm.byteLength, true);
  return URL.createObjectURL(new Blob([head.buffer, pcm.buffer], { type: 'audio/wav' }));
}
