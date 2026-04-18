<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CategoricalSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: CategoricalSeriesData }>(), {
  height: 300,
  colorRole: 'base',
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { deltaColor } = useVizTheme()

const option = computed(() => {
  const maxAbs = Math.max(...props.data.items.map(d => Math.abs(d.value)), 1)
  return {
    ...baseOption.value,
    xAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    yAxis: {
      type: 'category' as const,
      data: props.data.items.map(d => d.key),
      axisLabel: chromeStyle.value,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: props.data.items.map(d => ({
        value: d.value,
        itemStyle: { color: deltaColor(d.value, maxAbs) },
      })),
      barMaxWidth: 24,
    }],
  }
})
</script>
