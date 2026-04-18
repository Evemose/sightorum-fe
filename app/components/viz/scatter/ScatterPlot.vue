<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, ScatterData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: ScatterData
  xLabel?: string
  yLabel?: string
}>(), {
  height: 350,
  colorRole: 'base',
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  // Group by category if present
  const categories = [...new Set(props.data.points.map(p => p.category).filter(Boolean))]
  const hasCategories = categories.length > 1

  const series = hasCategories
    ? categories.map((cat, i) => ({
        name: cat,
        type: 'scatter' as const,
        data: props.data.points
          .filter(p => p.category === cat)
          .map(p => [p.x, p.y, p.size ?? 8]),
        symbolSize: (val: number[]) => val[2] ?? 8,
        itemStyle: {
          color: [primaryColor.value, resolve('divergent'), resolve('severity-amber'), resolve('focal')][i % 4],
        },
      }))
    : [{
        type: 'scatter' as const,
        data: props.data.points.map(p => [p.x, p.y, p.size ?? 8]),
        symbolSize: (val: number[]) => val[2] ?? 8,
        itemStyle: { color: primaryColor.value },
        ...buildMarkLines(props.referenceLines),
      }]

  return {
    ...baseOption.value,
    legend: hasCategories ? { data: categories, textStyle: chromeStyle.value } : undefined,
    xAxis: {
      type: 'value' as const,
      name: props.xLabel,
      nameLocation: 'center' as const,
      nameGap: 28,
      nameTextStyle: chromeStyle.value,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    yAxis: {
      type: 'value' as const,
      name: props.yLabel,
      nameLocation: 'center' as const,
      nameGap: 40,
      nameTextStyle: chromeStyle.value,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series,
  }
})
</script>
