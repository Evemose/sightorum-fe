import { bin as d3Bin, extent, deviation } from 'd3-array'

/**
 * Kernel Density Estimation using Gaussian kernel.
 * Used by Violin, SplitViolin, and Histogram+KDE overlay.
 *
 * Returns an array of [x, density] points suitable for ECharts line series.
 */
export function kde(
  values: number[],
  options: {
    /** Number of evaluation points across the range (default 80) */
    resolution?: number
    /** Bandwidth multiplier — 1.0 = Silverman's rule of thumb (default 1.0) */
    bandwidthScale?: number
    /** Explicit range [min, max]; defaults to data extent with 10% padding */
    range?: [number, number]
  } = {}
): [number, number][] {
  const n = values.length
  if (n === 0) return []

  const { resolution = 80, bandwidthScale = 1.0 } = options
  const sd = deviation(values) ?? 1
  const iqr = quantile(values, 0.75) - quantile(values, 0.25)
  // Silverman's rule of thumb
  const h = 0.9 * Math.min(sd, iqr / 1.34) * Math.pow(n, -0.2) * bandwidthScale

  const [dMin, dMax] = options.range ?? (() => {
    const ext = extent(values)
    const lo = ext[0] ?? 0
    const hi = ext[1] ?? 0
    const pad = (hi - lo) * 0.1
    return [lo - pad, hi + pad] as [number, number]
  })()

  const step = (dMax - dMin) / (resolution - 1)
  const result: [number, number][] = []

  for (let i = 0; i < resolution; i++) {
    const x = dMin + i * step
    let sum = 0
    for (let j = 0; j < n; j++) {
      sum += gaussian((x - (values[j] ?? 0)) / h)
    }
    result.push([x, sum / (n * h)])
  }

  return result
}

/**
 * Compute histogram bins from raw values.
 * Returns bin edges and counts for ECharts bar series.
 */
export function histogram(
  values: number[],
  binCount?: number
): { bins: { x0: number; x1: number; count: number }[] } {
  const thresholds = binCount ?? Math.ceil(Math.sqrt(values.length))
  const binner = d3Bin().thresholds(thresholds)
  const bins = binner(values)
  return {
    bins: bins.map(b => ({
      x0: b.x0 ?? 0,
      x1: b.x1 ?? 0,
      count: b.length,
    })),
  }
}

// -- helpers --

function gaussian(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

function quantile(sorted: number[], p: number): number {
  const arr = [...sorted].sort((a, b) => a - b)
  const idx = (arr.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const loVal = arr[lo] ?? 0
  const hiVal = arr[hi] ?? 0
  if (lo === hi) return loVal
  return loVal * (hi - idx) + hiVal * (idx - lo)
}
