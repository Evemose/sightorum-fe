// ---------------------------------------------------------------------------
// Viz component library — shared TypeScript types & data contracts
// ---------------------------------------------------------------------------

/** Color role tokens that map to tailwind viz-* classes and resolved hex values */
export type ColorRole =
  | 'base'
  | 'base-muted'
  | 'chrome'
  | 'severity-amber'
  | 'severity-muted'
  | 'severity-low'
  | 'focal'
  | 'divergent'
  | 'delta-positive'
  | 'delta-negative'
  | 'error'

export type AxisAnchor = 'x' | 'y'

export interface AnnotationDef {
  text: string
  /** Data-coordinate anchor or corner keyword */
  anchor: { x: number; y: number } | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface ReferenceLineDef {
  value: number
  label?: string
  axis: AxisAnchor
  style?: 'solid' | 'dashed' | 'dotted'
}

/** Every chart component extends these props */
export interface SharedChartProps {
  title?: string
  subtitle?: string
  colorRole?: ColorRole
  annotations?: AnnotationDef[]
  referenceLines?: ReferenceLineDef[]
  height?: number
  onClick?: (params: unknown) => void
}

// ---------------------------------------------------------------------------
// Data contracts
// ---------------------------------------------------------------------------

/** KPI / scalar display */
export interface ScalarData {
  value: number
  label?: string
  n?: number
  delta?: number
  deltaLabel?: string
}

/** Gauge / Bullet / ProgressRing */
export interface GaugeData {
  value: number
  min: number
  max: number
  target?: number
  bands?: { label?: string; from: number; to: number; color?: ColorRole }[]
}

export interface ProgressRingData {
  value: number
  target: number
  centerLabel?: string
}

export interface DualMeanData {
  labelA: string
  valueA: number
  labelB: string
  valueB: number
  delta: number
}

/** Categorical series (bars, lollipops, etc.) */
export interface CategoricalItem {
  key: string
  value: number
  color?: ColorRole
  label?: string
}

export interface CategoricalSeriesData {
  items: CategoricalItem[]
}

/** Stacked / grouped categorical */
export interface StackedItem {
  key: string
  segments: { name: string; value: number; color?: ColorRole }[]
}

export interface StackedSeriesData {
  categories: string[]
  series: { name: string; color?: ColorRole; values: number[] }[]
}

/** Tornado / paired diverging */
export interface TornadoRow {
  key: string
  left: number
  right: number
  leftLabel?: string
  rightLabel?: string
}

export interface TornadoData {
  rows: TornadoRow[]
  leftName: string
  rightName: string
}

/** Time series */
export interface TimePoint {
  t: string | number | Date
  value: number
  series?: string
}

export interface TimeSeriesData {
  points: TimePoint[]
}

export interface GroupedTimeSeriesData {
  series: {
    name: string
    color?: ColorRole
    points: { t: string | number | Date; value: number }[]
  }[]
}

/** Paired comparison (Dumbbell, Slope) */
export interface PairedRow {
  key: string
  left: number
  right: number
  sign?: 'positive' | 'negative' | 'neutral'
}

export interface PairedComparisonData {
  rows: PairedRow[]
}

/** Composition (Donut, Pie, Treemap) */
export interface CompositionPart {
  key: string
  value: number
  share: number
  color?: ColorRole
}

export interface CompositionData {
  total: number
  parts: CompositionPart[]
  other?: { value: number; share: number }
}

/** Hierarchy (Treemap, Sunburst, Dendrogram) */
export interface HierarchyNode {
  name: string
  value?: number
  color?: ColorRole
  children?: HierarchyNode[]
}

export interface HierarchyData {
  root: HierarchyNode
}

/** Flow (Sankey) */
export interface FlowNode {
  id: string
  name: string
}

export interface FlowLink {
  source: string
  target: string
  value: number
}

export interface FlowData {
  nodes: FlowNode[]
  links: FlowLink[]
}

/** Scatter */
export interface ScatterPoint {
  x: number
  y: number
  size?: number
  color?: ColorRole
  label?: string
  category?: string
}

export interface ScatterData {
  points: ScatterPoint[]
}

/** Distribution (Histogram, Violin, Box) */
export interface HistogramData {
  bins: { x0: number; x1: number; count: number; label?: string; color?: ColorRole }[]
  /** Optional pre-scaled density overlay points (x, y in chart units). */
  densityPoints?: [number, number][]
}

export interface ViolinGroupData {
  groups: {
    name: string
    values: number[]
    color?: ColorRole
  }[]
}

export interface DistributionPoint {
  value: number
  /** Horizontal offset within category in category-axis units (e.g. -0.2..0.2). */
  offset?: number
  size?: number
  color?: ColorRole
}

export interface DistributionPointGroupData {
  groups: {
    name: string
    color?: ColorRole
    points: DistributionPoint[]
  }[]
}

export interface SplitViolinGroup {
  name: string
  densityByCategory: [number, number][][]
  color?: ColorRole
}

export interface SplitViolinData {
  categories: string[]
  series: [SplitViolinGroup, SplitViolinGroup]
}

export interface BoxPlotGroup {
  name: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers?: number[]
}

export interface BoxPlotData {
  groups: BoxPlotGroup[]
}

/** QQ Plot */
export interface QQPlotData {
  points: [number, number][]
  referenceLine: { from: [number, number]; to: [number, number] }
}

/** Per-bucket rate histogram */
export interface PerBucketRateData {
  bins: { key: string; count: number; color?: ColorRole }[]
}

/** Band line */
export interface BandLineData {
  points: { t: string | number | Date; value: number; min: number; max: number }[]
}

/** Bump chart */
export interface BumpChartData {
  partitions: string[]
  series: {
    name: string
    color?: ColorRole
    ranks: number[]
  }[]
}

/** Small multiples */
export interface SmallMultiplesLineData {
  panels: {
    name: string
    color?: ColorRole
    points: { t: string | number | Date; value: number }[]
  }[]
}

export interface SmallMultiplesBulletData {
  panels: {
    name: string
    value: number
    target: number
    bands?: { from: number; to: number; color?: ColorRole }[]
  }[]
}

/** Radar */
export interface RadarData {
  indicators: { name: string; max: number }[]
  series: {
    name: string
    color?: ColorRole
    values: number[]
  }[]
}

/** Parallel coordinates */
export interface ParallelData {
  axes: { name: string; min?: number; max?: number }[]
  lines: {
    name?: string
    color?: ColorRole
    values: number[]
  }[]
}

/** Calendar heatmap */
export interface CalendarHeatmapData {
  year: number
  points: { date: string; value: number }[]
}

export interface CalendarMultiYearData {
  years: CalendarHeatmapData[]
}

/** Regime-shaded line */
export interface RegimeDef {
  from: string | number | Date
  to: string | number | Date
  color?: ColorRole
  label?: string
}

/** Joinpoint regression */
export interface JoinpointSegment {
  from: { t: string | number | Date; value: number }
  to: { t: string | number | Date; value: number }
}

export interface JoinpointData {
  segments: JoinpointSegment[]
  joinpoints: { t: string | number | Date; value: number }[]
}

/** STL decomposition */
export interface StlDecompositionData {
  points: { t: string | number | Date; trend: number; seasonal: number; remainder: number }[]
}

/** Wrapped year-over-year */
export interface WrappedYoYData {
  series: {
    year: number
    color?: ColorRole
    points: { month: number; value: number }[]
  }[]
}

/** Divergence mapping for slope charts */
export type DivergenceLevel = 'high' | 'low' | 'near'
export type DivergenceMap = Record<string, DivergenceLevel>

/** Marimekko */
export interface MarimekkoColumn {
  key: string
  width: number
  segments: { name: string; value: number; color?: ColorRole }[]
}

export interface MarimekkoData {
  columns: MarimekkoColumn[]
}

/** Influence curtain */
export interface InfluenceCurtainData {
  items: { key: string; contribution: number; cumulative: number; color?: ColorRole }[]
}

/** Table with inline bar */
export interface TableInlineBarRow {
  key: string
  value: number
  columns?: Record<string, string | number>
}

export interface TableInlineBarData {
  rows: TableInlineBarRow[]
  maxValue?: number
}

/** Voronoi treemap — hierarchical input with arbitrary nesting depth */
export interface VoronoiTreemapNode {
  id: string
  /** Leaf weight. For group nodes this is ignored — effective weight is derived from children. */
  weight?: number
  color?: ColorRole
  children?: VoronoiTreemapNode[]
}

export interface VoronoiTreemapData {
  root: VoronoiTreemapNode
}

// ---------------------------------------------------------------------------
// Narrative component types
// ---------------------------------------------------------------------------

export type Severity = 'HIGH' | 'MED' | 'LOW'

export interface FiredCheck {
  code: string
  severity: Severity
  text: string
}

export interface ReceiptItem {
  label: string
  value: string | number
}

export interface AxisConsidered {
  name: string
  fired: boolean
}
