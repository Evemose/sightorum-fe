<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, WrappedYoYData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: WrappedYoYData
  /** Explicit per-series colors; when provided, suppresses the time gradient. */
  seriesColors?: ColorRole[]
  /** Earliest year end of the gradient. */
  gradientFrom?: ColorRole
  /** Latest year end of the gradient. */
  gradientTo?: ColorRole
}>(), {
  height: 300,
  colorRole: 'base',
  gradientFrom: 'base-muted',
  gradientTo: 'focal',
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, roleGradient } = useVizTheme()

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const option = computed(() => {
  // Sort by year so the gradient maps earliest → gradientFrom, latest → gradientTo.
  const sortedSeries = [...props.data.series].sort((a, b) => a.year - b.year)

  // Time gradient is the default — it's the whole point of wrapping YoY
  // (earliest → gradientFrom, latest → gradientTo, so the temporal shift
  // reads at a glance). Only an explicit `seriesColors` prop suppresses it;
  // per-series `color` on the data is treated as a fallback rather than an
  // override so callers don't have to strip them to see the gradient.
  const useGradient = !props.seriesColors?.length
  const gradient = useGradient
    ? roleGradient(props.gradientFrom, props.gradientTo, sortedSeries.length)
    : []

  return {
    ...baseOption.value,
    legend: {
      data: sortedSeries.map(s => String(s.year)),
      textStyle: chromeStyle.value,
    },
    xAxis: {
      type: 'category' as const,
      data: monthLabels,
      axisLabel: chromeStyle.value,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: sortedSeries.map((s, i) => {
      const color = props.seriesColors?.[i]
        ? resolve(props.seriesColors[i] as ColorRole)
        : gradient[i] ?? (s.color ? resolve(s.color) : resolve('base'))
      // Highlight the most recent year slightly so it still reads as the
      // "now" reference line within the gradient.
      const isLatest = i === sortedSeries.length - 1
      return {
        name: String(s.year),
        type: 'line',
        data: monthLabels.map((_, mi) => {
          const pt = s.points.find(p => p.month === mi + 1)
          return pt?.value ?? null
        }),
        lineStyle: { color, width: isLatest ? 2.5 : 1.5 },
        itemStyle: { color },
        showSymbol: false,
        z: isLatest ? 10 : 2,
      }
    }),
  }
})

function onClick(params: unknown) {
  props.onClick?.(params)
}
</script>
