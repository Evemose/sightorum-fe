/**
 * Compute QQ-plot coordinates: observed quantiles vs theoretical (normal) quantiles.
 * Returns scatter points + the diagonal reference line endpoints.
 */
export function qqLayout(
  observed: number[],
  expected?: number[]
): {
  points: [number, number][]
  referenceLine: { from: [number, number]; to: [number, number] }
} {
  const sorted = [...observed].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) {
    return { points: [], referenceLine: { from: [0, 0], to: [1, 1] } }
  }

  let theoretical: number[]
  if (expected) {
    theoretical = [...expected].sort((a, b) => a - b)
  } else {
    // Standard normal quantiles
    theoretical = sorted.map((_, i) => {
      const p = (i + 0.5) / n
      return normalQuantile(p)
    })
  }

  const points: [number, number][] = theoretical.map((t, i) => [t, sorted[i] ?? 0])

  const minT = theoretical[0] ?? 0
  const maxT = theoretical[theoretical.length - 1] ?? 1

  // Reference line: if normal QQ, line through Q1/Q3
  const q1Idx = Math.floor(n * 0.25)
  const q3Idx = Math.floor(n * 0.75)
  const sortedQ1 = sorted[q1Idx] ?? 0
  const sortedQ3 = sorted[q3Idx] ?? 0
  const theoQ1 = theoretical[q1Idx] ?? 0
  const theoQ3 = theoretical[q3Idx] ?? 0
  const denom = theoQ3 - theoQ1
  const slope = denom !== 0 ? (sortedQ3 - sortedQ1) / denom : 1
  const intercept = sortedQ1 - slope * theoQ1

  return {
    points,
    referenceLine: {
      from: [minT, slope * minT + intercept],
      to: [maxT, slope * maxT + intercept],
    },
  }
}

/**
 * Rational approximation of the inverse normal CDF (probit function).
 * Abramowitz & Stegun formula 26.2.23, accurate to ~4.5e-4.
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p === 0.5) return 0

  const sign = p < 0.5 ? -1 : 1
  const pp = p < 0.5 ? p : 1 - p

  const t = Math.sqrt(-2 * Math.log(pp))
  const c0 = 2.515517
  const c1 = 0.802853
  const c2 = 0.010328
  const d1 = 1.432788
  const d2 = 0.189269
  const d3 = 0.001308

  return sign * (t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t))
}
