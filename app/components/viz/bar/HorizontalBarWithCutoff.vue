<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CategoricalSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: CategoricalSeriesData
  cutoffRank: number
}>(), {
  height: 350,
  colorRole: 'base',
  cutoffRank: 5,
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const sortedItems = computed(() => [...props.data.items].sort((a, b) => b.value - a.value))

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'category' as const,
    data: sortedItems.value.map(d => d.key),
    inverse: true,
    axisLabel: chromeStyle.value,
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    data: sortedItems.value.map((d, i) => ({
      value: d.value,
      itemStyle: {
        color: i < props.cutoffRank ? primaryColor.value : resolve('base-muted'),
      },
    })),
    barMaxWidth: 28,
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { type: 'dashed' as const, color: resolve('severity-amber') },
      data: [{ yAxis: props.cutoffRank - 0.5 }],
      label: { formatter: `Top ${props.cutoffRank}`, position: 'end' as const },
    },
  }],
}))
</script>
