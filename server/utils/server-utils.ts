/**
 * Shared server-side utilities used across API endpoints.
 * Extracted to avoid duplication across rank, crags, areas, region, etc.
 */

export function avg(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0
}

export function max(a: number[]): number {
  return a.length ? Math.max(...a) : 0
}

export function sum(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) : 0
}

/** Circular mean of angles in degrees (handles wrap-around at 0/360) */
export function circularMeanDeg(angles: number[]): number {
  if (!angles.length) return 0
  const sinSum = angles.reduce((s, a) => s + Math.sin(a * Math.PI / 180), 0)
  const cosSum = angles.reduce((s, a) => s + Math.cos(a * Math.PI / 180), 0)
  return ((Math.atan2(sinSum, cosSum) * 180 / Math.PI) + 360) % 360
}

/** Convert degrees (0-360) to 8-point compass direction */
export function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

/**
 * Concurrency-limited parallel execution.
 * Runs up to `concurrency` items simultaneously, maintaining order in results.
 */
export async function parallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 6
): Promise<R[]> {
  const results: R[] = []
  const pending: Promise<void>[] = []
  let index = 0

  async function runNext(): Promise<void> {
    const i = index++
    if (i >= items.length) return
    results[i] = await fn(items[i])
    await runNext()
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    pending.push(runNext())
  }
  await Promise.all(pending)
  return results
}
