// Derived from pdoom-video by Giacomo Magnanini (https://github.com/mexicat/pdoom-video), MIT License.
// Licence text: ./LICENSE-pdoom-video.txt
// Changed for this project: the colour list is the starter's placeholder palette. A film replaces
// the colours with those of its treatment and keeps the keys the engine and the kit read.
import { hexToLinear } from './util';

// The whole film lives in this palette. A scene may stand on a dark ground (ink) or a light one
// (paper); that choice belongs to the scene. A suggested rule set, to be settled by the treatment:
//   signal = the reserved colour: the one thing in each shot that carries the idea of its section
//            is drawn in signal, and nothing else is. The storyboard card and the caret use it too.
//   blush  = the hot core of signal, for glow.
//   sun, tangerine, teal, violet = key hues. A scene picks ONE of them and stays with it.
//   Only signal, blush and the scene's key hue may glow (exceed 1.0 in linear light). Type never glows.
//
// Every key is also available in GLSL as a linear-RGB constant named C_<KEY IN UPPER_SNAKE_CASE>
// (ink2 -> C_INK2); see glsl/common.ts, which generates them from this table.
// `bg` and `fg` are used by the engine itself (clear colour, flash colour) and must keep existing;
// they are the same colours as `ink` and `paper`.
export const HEX = {
  bg: '#100E14', // = ink
  fg: '#F3EBDD', // = paper
  ink: '#100E14', // dark ground; type and outlines on light grounds
  ink2: '#1D1924', // raised panels on a dark ground
  graphite: '#4A4553', // dim lines, inactive things
  ash: '#9A93A3', // secondary text
  paper: '#F3EBDD', // light ground; type and outlines on dark grounds
  paper2: '#E0D3BC', // shaded paper
  signal: '#FF2E74', // the reserved colour, and the caret
  blush: '#FF86B0', // hot core of signal
  sun: '#FFC42E', // key hue
  tangerine: '#FF7A2B', // key hue
  teal: '#19C2B0', // key hue
  violet: '#7A5CFF', // key hue
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
