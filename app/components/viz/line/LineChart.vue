<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, GroupedTimeSeriesData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: GroupedTimeSeriesData
  seriesColors?: ColorRole[]
  smooth?: boolean
}>(), {
  height: 300,
  colorRole: 'base',
  smooth: false,
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => {
  const allTimes = [...new Set(props.data.series.flatMap(s => s.points.map(p => String(p.t))))]

  return {
    ...baseOption.value,
    legend: props.data.series.length > 1
      ? { data: props.data.series.map(s => s.name), textStyle: chromeStyle.value }
      : undefined,
    xAxis: {
      type: 'category' as const,
      data: allTimes,
      axisLabel: chromeStyle.value,
      axisLine: { lineStyle: gridLineStyle.value },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: props.data.series.map((s, i) => {
      const color = props.seriesColors?.[i]
        ? resolve(props.seriesColors[i])
        : s.color
          ? resolve(s.color)
          : itemColor(i)
      return {
        name: s.name,
        type: 'line',
        data: s.points.map(p => p.value),
        smooth: props.smooth,
        itemStyle: { color },
        lineStyle: { color },
        showSymbol: false,
        ...buildMarkLines(props.referenceLines),
      }
    }),
  }
})
</script>
