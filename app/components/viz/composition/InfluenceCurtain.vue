<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, InfluenceCurtainData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: InfluenceCurtainData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const palette: ColorRole[] = ['base', 'base-muted', 'chrome', 'divergent']

const option = computed(() => {
  const items = props.data.items
  const keys = items.map(d => d.key)

  const base = baseOption.value as Record<string, unknown>
  const baseGrid = (base.grid as Record<string, unknown>) ?? {}

  return {
    ...base,
    // Rotated y-axis names need extra side padding — otherwise they collide
    // with the y-axis tick labels.
    grid: { ...baseGrid, left: 72, right: 72 },
    legend: { show: false },
    xAxis: {
      type: 'category' as const,
      data: keys,
      axisLabel: { ...chromeStyle.value, rotate: 30 },
    },
    yAxis: [
      {
        type: 'value' as const,
        name: 'Contribution',
        nameLocation: 'middle' as const,
        nameRotate: 90,
        nameGap: 44,
        nameTextStyle: chromeStyle.value,
        axisLabel: chromeStyle.value,
        splitLine: { lineStyle: gridLineStyle.value },
      },
      {
        type: 'value' as const,
        name: 'Cumulative',
        nameLocation: 'middle' as const,
        nameRotate: -90,
        nameGap: 44,
        nameTextStyle: chromeStyle.value,
        axisLabel: chromeStyle.value,
        splitLine: { show: false },
        max: 100,
      },
    ],
    series: [
      // Stacked bars for individual contributions
      {
        type: 'bar',
        data: items.map((d, i) => ({
          value: d.contribution,
          itemStyle: { color: resolve((d.color ?? palette[i % palette.length]) as ColorRole) },
        })),
        barMaxWidth: 36,
      },
      // Cumulative line
      {
        type: 'line',
        yAxisIndex: 1,
        data: items.map(d => d.cumulative),
        lineStyle: { color: resolve('chrome'), width: 2 },
        itemStyle: { color: resolve('chrome') },
        showSymbol: true,
        symbolSize: 5,
      },
    ],
  }
})
</script>
