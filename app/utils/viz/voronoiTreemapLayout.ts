import { Delaunay } from 'd3-delaunay'

/**
 * Weighted Voronoi treemap layout with support for:
 * - Circular clipping boundaries
 * - Arbitrary-depth nested hierarchies
 *
 * Based on Nocaj & Brandes (EuroVis 2012):
 * "Computing Voronoi Treemaps — Faster, Simpler, and Resolution-independent"
 */

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface VoronoiInput {
  id: string
  weight: number
}

export interface VoronoiCell {
  id: string
  weight: number
  polygon: [number, number][]
  centroid: [number, number]
}

/** A node in the hierarchy (mirrors the viz types contract) */
export interface HierarchicalNode {
  id: string
  weight?: number
  children?: HierarchicalNode[]
}

/** Flat cell emitted by the hierarchical layout */
export interface HierarchicalCell {
  id: string
  weight: number
  polygon: [number, number][]
  centroid: [number, number]
  depth: number
  isLeaf: boolean
  /** Index of the top-level ancestor (root's direct child). Used for coloring. */
  groupIndex: number
  /** Percentage share of total weight */
  share: number
}

/** Angular segment for the decorative ring */
export interface RingSegment {
  id: string
  startAngle: number
  endAngle: number
  groupIndex: number
}

export interface HierarchicalLayoutResult {
  cells: HierarchicalCell[]
  ring: RingSegment[]
  /** Total weight of all leaf nodes */
  totalWeight: number
}

// ---------------------------------------------------------------------------
// Circle polygon generator
// ---------------------------------------------------------------------------

export function generateCirclePolygon(
  cx: number,
  cy: number,
  r: number,
  segments = 96,
): [number, number][] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number]
  })
}

// ---------------------------------------------------------------------------
// Flat Voronoi treemap (core algorithm)
// ---------------------------------------------------------------------------

export interface VoronoiTreemapOptions {
  clip?: [number, number][]
  width?: number
  height?: number
  convergenceRatio?: number
  maxIterations?: number
}

/**
 * Compute a weighted Voronoi tessellation for flat items.
 * Each cell's area converges to be proportional to its weight.
 */
export function computeVoronoiTreemap(
  items: VoronoiInput[],
  options: VoronoiTreemapOptions = {},
): VoronoiCell[] {
  const {
    width = 500,
    height = 500,
    convergenceRatio = 0.01,
    maxIterations = 100,
  } = options

  const clip: [number, number][] = options.clip ?? [
    [0, 0], [width, 0], [width, height], [0, height],
  ]

  const n = items.length
  if (n === 0) return []
  if (n === 1) {
    const item = items[0]!
    return [{ id: item.id, weight: item.weight, polygon: [...clip], centroid: polygonCentroid(clip) }]
  }

  const totalWeight = items.reduce((s, d) => s + d.weight, 0)
  const totalArea = polygonArea(clip)
  const targetAreas = items.map(d => (d.weight / totalWeight) * totalArea)

  // Initialize sites: distribute within polygon centroid region
  const cc = polygonCentroid(clip)
  const [minX, minY, maxX, maxY] = polygonBounds(clip)
  const span = Math.max(maxX - minX, maxY - minY)
  const sites: [number, number][] = items.map((_, i) => {
    // Sunflower / golden-angle spiral for better initial placement in circular clips
    const golden = Math.PI * (3 - Math.sqrt(5))
    const r = (span * 0.4) * Math.sqrt((i + 0.5) / n)
    const theta = i * golden
    return [
      cc[0] + r * Math.cos(theta),
      cc[1] + r * Math.sin(theta),
    ]
  })

  // Iterative Lloyd relaxation with weighted centroids
  for (let iter = 0; iter < maxIterations; iter++) {
    const delaunay = Delaunay.from(sites)
    const voronoi = delaunay.voronoi([minX - 1, minY - 1, maxX + 1, maxY + 1])

    let maxError = 0

    for (let i = 0; i < n; i++) {
      const cellPoly = voronoiCellPolygon(voronoi, i)
      if (!cellPoly || cellPoly.length < 3) continue

      const clipped = clipPolygon(cellPoly, clip)
      if (!clipped || clipped.length < 3) continue

      const area = polygonArea(clipped)
      const target = targetAreas[i] ?? 1
      const error = Math.abs(area - target) / target
      if (error > maxError) maxError = error

      // Move site toward weighted centroid, scaled by area error
      const c = polygonCentroid(clipped)
      const ratio = target / Math.max(area, 1e-10)
      const damping = 0.5
      const site = sites[i]!
      sites[i] = [
        site[0] + (c[0] - site[0]) * damping * Math.min(ratio, 2),
        site[1] + (c[1] - site[1]) * damping * Math.min(ratio, 2),
      ]

      // Clamp to bounding box
      sites[i]![0] = Math.max(minX + 1, Math.min(maxX - 1, sites[i]![0]))
      sites[i]![1] = Math.max(minY + 1, Math.min(maxY - 1, sites[i]![1]))
    }

    if (maxError < convergenceRatio) break
  }

  // Final pass: compute clipped polygons
  const delaunay = Delaunay.from(sites)
  const voronoi = delaunay.voronoi([minX - 1, minY - 1, maxX + 1, maxY + 1])

  return items.map((item, i) => {
    const cellPoly = voronoiCellPolygon(voronoi, i)
    const clipped = cellPoly ? clipPolygon(cellPoly, clip) : [...clip]
    const polygon = clipped && clipped.length >= 3 ? clipped : [...clip]
    return {
      id: item.id,
      weight: item.weight,
      polygon,
      centroid: polygonCentroid(polygon),
    }
  })
}

// ---------------------------------------------------------------------------
// Hierarchical Voronoi treemap
// ---------------------------------------------------------------------------

/** Sum all leaf weights in a subtree */
export function subtreeWeight(node: HierarchicalNode): number {
  if (!node.children || node.children.length === 0) return node.weight ?? 0
  return node.children.reduce((s, c) => s + subtreeWeight(c), 0)
}

/**
 * Compute a hierarchical circular Voronoi treemap.
 *
 * Returns flat cells for rendering (with depth/group metadata)
 * and ring segments for the decorative outer ring.
 */
export function computeHierarchicalVoronoiTreemap(
  root: HierarchicalNode,
  options: {
    radius?: number
    /** Ring width as fraction of radius (default 0.06) */
    ringRatio?: number
    maxIterations?: number
    convergenceRatio?: number
  } = {},
): HierarchicalLayoutResult {
  const {
    radius = 250,
    ringRatio = 0.06,
    maxIterations = 80,
    convergenceRatio = 0.015,
  } = options

  const cx = radius
  const cy = radius
  const innerRadius = radius * (1 - ringRatio)
  const topLevel = root.children ?? [root]
  const totalWeight = topLevel.reduce((s, n) => s + subtreeWeight(n), 0)
  if (totalWeight === 0) return { cells: [], ring: [], totalWeight: 0 }

  // Ring segments — angular span proportional to weight
  let angle = -Math.PI / 2
  const ring: RingSegment[] = topLevel.map((n, i) => {
    const sweep = (subtreeWeight(n) / totalWeight) * Math.PI * 2
    const seg: RingSegment = { id: n.id, startAngle: angle, endAngle: angle + sweep, groupIndex: i }
    angle += sweep
    return seg
  })

  // Inner Voronoi cells
  const clip = generateCirclePolygon(cx, cy, innerRadius)
  const cells = layoutLevel(topLevel, clip, 0, totalWeight, maxIterations, convergenceRatio)

  return { cells, ring, totalWeight }
}

function layoutLevel(
  nodes: HierarchicalNode[],
  clip: [number, number][],
  depth: number,
  totalWeight: number,
  maxIter: number,
  convergence: number,
  groupIndex?: number,
): HierarchicalCell[] {
  const items: VoronoiInput[] = nodes.map(n => ({
    id: n.id,
    weight: Math.max(subtreeWeight(n), 0.001),
  }))
  const computed = computeVoronoiTreemap(items, { clip, maxIterations: maxIter, convergenceRatio: convergence })

  const result: HierarchicalCell[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const cell = computed[i]!
    const gi = groupIndex ?? i
    const sw = subtreeWeight(node)

    if (node.children && node.children.length > 0) {
      // Group cell — record for border rendering
      result.push({
        id: node.id,
        weight: sw,
        polygon: cell.polygon,
        centroid: cell.centroid,
        depth,
        isLeaf: false,
        groupIndex: gi,
        share: totalWeight > 0 ? (sw / totalWeight) * 100 : 0,
      })
      // Recurse into children within this cell's polygon
      result.push(
        ...layoutLevel(node.children, cell.polygon, depth + 1, totalWeight, maxIter, convergence, gi),
      )
    } else {
      result.push({
        id: node.id,
        weight: node.weight ?? 0,
        polygon: cell.polygon,
        centroid: cell.centroid,
        depth,
        isLeaf: true,
        groupIndex: gi,
        share: totalWeight > 0 ? (sw / totalWeight) * 100 : 0,
      })
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function voronoiCellPolygon(
  voronoi: ReturnType<typeof Delaunay.prototype.voronoi>,
  i: number,
): [number, number][] | null {
  const cell = voronoi.cellPolygon(i)
  if (!cell) return null
  return cell.slice(0, -1) as [number, number][]
}

/** Unsigned area of a simple polygon */
export function polygonArea(poly: [number, number][]): number {
  let area = 0
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pj = poly[j]!
    const pi = poly[i]!
    area += (pj[0] + pi[0]) * (pj[1] - pi[1])
  }
  return Math.abs(area / 2)
}

export function polygonCentroid(poly: [number, number][]): [number, number] {
  let cx = 0, cy = 0, area = 0
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pj = poly[j]!
    const pi = poly[i]!
    const cross = pj[0] * pi[1] - pi[0] * pj[1]
    cx += (pj[0] + pi[0]) * cross
    cy += (pj[1] + pi[1]) * cross
    area += cross
  }
  area /= 2
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon — return average of vertices
    const sx = poly.reduce((s, p) => s + p[0], 0) / n
    const sy = poly.reduce((s, p) => s + p[1], 0) / n
    return [sx, sy]
  }
  const factor = 1 / (6 * area)
  return [cx * factor, cy * factor]
}

function polygonBounds(poly: [number, number][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

/**
 * Sutherland–Hodgman polygon clipping.
 * Clips `subject` to the convex polygon `clip`.
 */
function clipPolygon(
  subject: [number, number][],
  clip: [number, number][],
): [number, number][] {
  let output = [...subject]

  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return []
    const input = output
    output = []

    const edgeStart = clip[i]!
    const edgeEnd = clip[(i + 1) % clip.length]!

    for (let j = 0; j < input.length; j++) {
      const current = input[j]!
      const previous = input[(j + input.length - 1) % input.length]!

      const currInside = isInside(current, edgeStart, edgeEnd)
      const prevInside = isInside(previous, edgeStart, edgeEnd)

      if (currInside) {
        if (!prevInside) {
          const inter = intersection(previous, current, edgeStart, edgeEnd)
          if (inter) output.push(inter)
        }
        output.push(current)
      } else if (prevInside) {
        const inter = intersection(previous, current, edgeStart, edgeEnd)
        if (inter) output.push(inter)
      }
    }
  }

  return output
}

function isInside(p: [number, number], a: [number, number], b: [number, number]): boolean {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0
}

function intersection(
  a: [number, number], b: [number, number],
  c: [number, number], d: [number, number],
): [number, number] | null {
  const denom = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
  if (Math.abs(denom) < 1e-10) return null
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / denom
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
}
