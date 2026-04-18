<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, StackedSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: StackedSeriesData; horizontal?: boolean }>(), {
  height: 300,
  colorRole: 'base',
  horizontal: false,
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => {
  const catAxis = {
    type: 'category' as const,
    data: props.data.categories,
    axisLabel: chromeStyle.value,
    axisLine: { lineStyle: gridLineStyle.value },
  }
  const valAxis = {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  }

  return {
    ...baseOption.value,
    legend: { data: props.data.series.map(s => s.name), textStyle: chromeStyle.value },
    xAxis: props.horizontal ? valAxis : catAxis,
    yAxis: props.horizontal ? catAxis : valAxis,
    series: props.data.series.map((s, i) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      data: s.values,
      itemStyle: { color: s.color ? resolve(s.color) : itemColor(i) },
      barMaxWidth: 40,
    })),
  }
})
</script>
