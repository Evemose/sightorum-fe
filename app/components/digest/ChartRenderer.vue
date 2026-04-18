<template>
  <component
    :is="component"
    v-if="component"
    v-bind="boundProps"
  />
  <div
    v-else
    class="text-xs text-viz-error border border-viz-error/40 rounded p-2 bg-red-50 dark:bg-red-950/20"
  >
    Unknown chart kind: <code>{{ block.kind }}</code>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import type { ChartBlock, ChartKind } from './jsonDigestSchema'

const props = defineProps<{ block: ChartBlock }>()

// ---------------------------------------------------------------------------
// Registry — chart kind → async component import.
// ---------------------------------------------------------------------------
const registry: Record<ChartKind, () => Promise<Component>> = {
  // bar
  'column-over-time': () => import('~/components/viz/bar/ColumnOverTime.vue'),
  'diverging-bar': () => import('~/components/viz/bar/DivergingBar.vue'),
  'diverging-lollipop': () => import('~/components/viz/bar/DivergingLollipop.vue'),
  'horizontal-bar': () => import('~/components/viz/bar/HorizontalBar.vue'),
  'horizontal-bar-with-cutoff': () => import('~/components/viz/bar/HorizontalBarWithCutoff.vue'),
  'lollipop': () => import('~/components/viz/bar/Lollipop.vue'),
  'pictorial-bar': () => import('~/components/viz/bar/PictorialBar.vue'),
  'stacked-bar': () => import('~/components/viz/bar/StackedBar.vue'),
  'stacked-bar-100': () => import('~/components/viz/bar/StackedBar100.vue'),
  'table-lens': () => import('~/components/viz/bar/TableLens.vue'),
  'table-with-inline-bar': () => import('~/components/viz/bar/TableWithInlineBar.vue'),
  'tornado-bar': () => import('~/components/viz/bar/TornadoBar.vue'),
  'vertical-bar': () => import('~/components/viz/bar/VerticalBar.vue'),

  // comparison
  'bump-chart': () => import('~/components/viz/comparison/BumpChart.vue'),
  'dumbbell': () => import('~/components/viz/comparison/Dumbbell.vue'),
  'slope-chart': () => import('~/components/viz/comparison/SlopeChart.vue'),
  'small-multiples-bullet': () => import('~/components/viz/comparison/SmallMultiplesBullet.vue'),
  'small-multiples-line': () => import('~/components/viz/comparison/SmallMultiplesLine.vue'),

  // composition
  'circular-dendrogram': () => import('~/components/viz/composition/CircularDendrogram.vue'),
  'donut': () => import('~/components/viz/composition/Donut.vue'),
  'influence-curtain': () => import('~/components/viz/composition/InfluenceCurtain.vue'),
  'marimekko': () => import('~/components/viz/composition/Marimekko.vue'),
  'pie': () => import('~/components/viz/composition/Pie.vue'),
  'sankey': () => import('~/components/viz/composition/Sankey.vue'),
  'sunburst': () => import('~/components/viz/composition/Sunburst.vue'),
  'treemap': () => import('~/components/viz/composition/Treemap.vue'),
  'voronoi-treemap': () => import('~/components/viz/composition/VoronoiTreemap.vue'),

  // kpi
  'bullet': () => import('~/components/viz/kpi/Bullet.vue'),
  'dual-mean-callout': () => import('~/components/viz/kpi/DualMeanCallout.vue'),
  'gauge': () => import('~/components/viz/kpi/Gauge.vue'),
  'kpi-card': () => import('~/components/viz/kpi/KpiCard.vue'),
  'kpi-card-pair': () => import('~/components/viz/kpi/KpiCardPair.vue'),
  'progress-ring': () => import('~/components/viz/kpi/ProgressRing.vue'),

  // line
  'area-chart': () => import('~/components/viz/line/AreaChart.vue'),
  'band-line': () => import('~/components/viz/line/BandLine.vue'),
  'base-vs-shifted-slope-overlay': () => import('~/components/viz/line/BaseVsShiftedSlopeOverlay.vue'),
  'joinpoint-regression': () => import('~/components/viz/line/JoinpointRegression.vue'),
  'line-chart': () => import('~/components/viz/line/LineChart.vue'),
  'linear-log-side-by-side': () => import('~/components/viz/line/LinearLogSideBySide.vue'),
  'regime-shaded-line': () => import('~/components/viz/line/RegimeShadedLine.vue'),
  'step-line': () => import('~/components/viz/line/StepLine.vue'),

  // multi
  'parallel-coordinates': () => import('~/components/viz/multi/ParallelCoordinates.vue'),
  'radar': () => import('~/components/viz/multi/Radar.vue'),

  // scatter / distribution
  'beeswarm': () => import('~/components/viz/scatter/Beeswarm.vue'),
  'box-plot': () => import('~/components/viz/scatter/BoxPlot.vue'),
  'histogram': () => import('~/components/viz/scatter/Histogram.vue'),
  'per-bucket-rate-histogram': () => import('~/components/viz/scatter/PerBucketRateHistogram.vue'),
  'qq-plot': () => import('~/components/viz/scatter/QQPlot.vue'),
  'scatter-plot': () => import('~/components/viz/scatter/ScatterPlot.vue'),
  'split-violin': () => import('~/components/viz/scatter/SplitViolin.vue'),
  'strip-plot': () => import('~/components/viz/scatter/StripPlot.vue'),
  'violin': () => import('~/components/viz/scatter/Violin.vue'),

  // time
  'calendar-heatmap': () => import('~/components/viz/time/CalendarHeatmap.vue'),
  'calendar-multi-year-stack': () => import('~/components/viz/time/CalendarMultiYearStack.vue'),
  'stl-decomposition-stack': () => import('~/components/viz/time/StlDecompositionStack.vue'),
  'wrapped-year-over-year': () => import('~/components/viz/time/WrappedYearOverYear.vue'),
}

const component = computed<Component | null>(() => {
  const loader = registry[props.block.kind as ChartKind]
  return loader ? defineAsyncComponent(loader) : null
})

// ---------------------------------------------------------------------------
// Scaffold flattening + token normalization.
// Backend may emit tokens uppercase (BASE, SEVERITY_AMBER, Y, DASHED) and
// nest scaffold under `scaffold: {...}`. The viz components want lowercase
// kebab-case tokens (base, severity-amber, y, dashed) at the top level.
// ---------------------------------------------------------------------------

/** Field names whose string values are tokens that need lowercase + '_' → '-'. */
const TOKEN_FIELDS = new Set(['color', 'colorRole', 'axis', 'style', 'sign'])

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/_/g, '-')
}

function normalize(input: unknown): unknown {
  if (input == null) return input
  if (Array.isArray(input)) return input.map(normalize)
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (TOKEN_FIELDS.has(k) && typeof v === 'string') {
        out[k] = normalizeToken(v)
      } else if (k === 'seriesColors' && Array.isArray(v)) {
        out[k] = v.map(c => typeof c === 'string' ? normalizeToken(c) : c)
      } else {
        out[k] = normalize(v)
      }
    }
    return out
  }
  return input
}

const boundProps = computed<Record<string, unknown>>(() => {
  const { kind: _kind, scaffold, ...rest } = props.block as Record<string, unknown>
  const merged: Record<string, unknown> = { ...rest }
  if (scaffold && typeof scaffold === 'object') {
    Object.assign(merged, scaffold as Record<string, unknown>)
  }
  return normalize(merged) as Record<string, unknown>
})
</script>
