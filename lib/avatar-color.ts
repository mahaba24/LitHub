// Deep, saturated tones that all keep white initials legible, in both themes.
const AVATAR_PALETTE = [
  '#C92A2A', // red
  '#D9480F', // orange
  '#C2255C', // pink
  '#9C36B5', // grape
  '#6741D9', // violet
  '#3B5BDB', // indigo
  '#1971C2', // blue
  '#0C8599', // cyan
  '#087F5B', // teal
  '#2B8A3E', // green
  '#5C940D', // lime
  '#B35C00', // amber
];

/** Same uid → same color on every device (FNV-1a hash; no stored state). */
export function avatarColorFor(uid: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < uid.length; i++) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return AVATAR_PALETTE[(hash >>> 0) % AVATAR_PALETTE.length];
}
