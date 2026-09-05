/**
 * Deterministic pseudo-random in [0, 1). Same (a, b) always yields the same
 * value, so the mock dashboard renders identically across reloads.
 */
export function seeded(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}
