<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, GaugeData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: GaugeData }>(), {
  height: 260,
  colorRole: 'base',
})

const { primaryColor, baseOption } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  series: [
    {
      type: 'gauge',
      min: props.data.min,
      max: props.data.max,
      progress: { show: true, width: 14, itemStyle: { color: primaryColor.value } },
      axisLine: { lineStyle: { width: 14, color: buildBandColors() } },
      axisTick: { show: false },
      splitLine: { length: 8, lineStyle: { width: 2, color: resolve('chrome') } },
      axisLabel: { distance: 20, fontSize: 11, color: resolve('chrome') },
      pointer: { itemStyle: { color: primaryColor.value } },
      anchor: { show: true, size: 16, itemStyle: { color: primaryColor.value } },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontWeight: 'bold',
        offsetCenter: [0, '70%'],
        color: primaryColor.value,
        formatter: (value: number) =>
          props.data.target != null
            ? `${Math.round(value)}\nT ${Math.round(props.data.target)}`
            : `${Math.round(value)}`,
      },
      data: [{ value: props.data.value }],
    },
  ],
}))

function buildBandColors(): [number, string][] {
  if (!props.data.bands?.length) {
    return [[1, resolve('base-muted')]]
  }
  const range = props.data.max - props.data.min
  return props.data.bands.map(b => [
    (b.to - props.data.min) / range,
    resolve(b.color ?? 'base-muted'),
  ])
}
</script>
