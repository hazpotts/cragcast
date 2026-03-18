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
