<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, CategoricalSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: CategoricalSeriesData; sorted?: boolean }>(), {
  height: 300,
  colorRole: 'base',
  sorted: false,
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)

const sortedItems = computed(() => {
  const items = [...props.data.items]
  if (props.sorted) items.sort((a, b) => b.value - a.value)
  return items
})

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
  series: [
    // Stems — thin bar
    {
      type: 'bar',
      data: sortedItems.value.map(d => d.value),
      barWidth: 2,
      itemStyle: { color: primaryColor.value },
      silent: true,
      z: 1,
    },
    // Dots — scatter at the end
    {
      type: 'scatter',
      data: sortedItems.value.map((d, i) => [d.value, i]),
      symbolSize: 10,
      itemStyle: { color: primaryColor.value },
      z: 2,
    },
  ],
}))
</script>
