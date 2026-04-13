/**
 * FNV-1a 32-bit hash.
 * Fast, deterministic, no external dependencies.
 * Returns a hex string.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    // Multiply by FNV prime (16777619), wrapped to 32-bit unsigned
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
}
