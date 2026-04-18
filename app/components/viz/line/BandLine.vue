<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, BandLineData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: BandLineData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)

const option = computed(() => {
  const times = props.data.points.map(p => String(p.t))

  return withSharedOverlays({
    ...baseOption.value,
    xAxis: {
      type: 'category' as const,
      data: times,
      axisLabel: chromeStyle.value,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: [
      // Band (min-max envelope) using stacked area
      {
        name: 'min',
        type: 'line',
        data: props.data.points.map(p => p.min),
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        stack: 'band',
        showSymbol: false,
        silent: true,
      },
      {
        name: 'band',
        type: 'line',
        data: props.data.points.map(p => p.max - p.min),
        lineStyle: { opacity: 0 },
        areaStyle: { color: primaryColor.value, opacity: 0.15 },
        stack: 'band',
        showSymbol: false,
        silent: true,
      },
      // Main line
      {
        name: 'value',
        type: 'line',
        data: props.data.points.map(p => p.value),
        itemStyle: { color: primaryColor.value },
        lineStyle: { color: primaryColor.value, width: 2 },
        showSymbol: false,
        z: 3,
      },
    ],
  })
})
</script>
