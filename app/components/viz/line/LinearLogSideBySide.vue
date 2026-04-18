<template>
  <div class="grid grid-cols-2 gap-4" :style="{ minHeight: `${height}px` }">
    <VChart :option="linearOption" :style="{ height: `${height}px` }" autoresize @click="onClick" />
    <VChart :option="logOption" :style="{ height: `${height}px` }" autoresize @click="onClick" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, TimeSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: TimeSeriesData }>(), {
  height: 280,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)

const times = computed(() => props.data.points.map(p => String(p.t)))
const values = computed(() => props.data.points.map(p => p.value))

const sharedX = computed(() => ({
  type: 'category' as const,
  data: times.value,
  axisLabel: chromeStyle.value,
  boundaryGap: false,
}))

const seriesBase = computed(() => ({
  type: 'line' as const,
  data: values.value,
  itemStyle: { color: primaryColor.value },
  lineStyle: { color: primaryColor.value, width: 2 },
  showSymbol: false,
}))

const linearOption = computed(() => ({
  ...baseOption.value,
  title: { text: 'Linear scale', textStyle: { fontSize: 12 }, left: 'center' },
  xAxis: sharedX.value,
  yAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [seriesBase.value],
}))

const logOption = computed(() => ({
  ...baseOption.value,
  title: { text: 'Log scale', textStyle: { fontSize: 12 }, left: 'center' },
  xAxis: sharedX.value,
  yAxis: {
    type: 'log' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [seriesBase.value],
}))
</script>
