<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, GaugeData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: GaugeData }>(), {
  height: 80,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const maxVal = props.data.max
  const bands = props.data.bands ?? []

  // Background band series (stacked bars for qualitative ranges)
  const bandSeries = bands.map((b, i) => ({
    type: 'bar' as const,
    stack: 'bands',
    barWidth: '60%',
    data: [b.to - b.from],
    itemStyle: {
      color: resolve(b.color ?? 'base-muted'),
      opacity: 0.25 + i * 0.15,
    },
    silent: true,
    z: 1,
  }))

  // Actual value bar (narrow, on top)
  const valueSeries = {
    type: 'bar' as const,
    barWidth: '30%',
    data: [props.data.value],
    itemStyle: { color: primaryColor.value },
    z: 3,
  }

  return {
    ...baseOption.value,
    xAxis: {
      type: 'value' as const,
      max: maxVal,
      axisLabel: chromeStyle.value,
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: [props.title ?? ''],
      axisLabel: { ...chromeStyle.value, show: !!props.title },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      ...bandSeries,
      valueSeries,
      // Target marker
      ...(props.data.target != null
        ? [{
            type: 'scatter' as const,
            symbol: 'rect',
            symbolSize: [3, 24],
            data: [[props.data.target, 0]],
            itemStyle: { color: resolve('chrome') },
            z: 5,
            silent: true,
          }]
        : []),
    ],
  }
})
</script>
