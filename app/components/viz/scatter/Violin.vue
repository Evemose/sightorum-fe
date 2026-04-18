<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, ViolinGroupData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: ViolinGroupData }>(), {
  height: 350,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const groups = props.data.groups
  const allValues = groups.flatMap(g => g.values)
  const minV = Math.min(...allValues, 0)
  const maxV = Math.max(...allValues, 1)
  const range = Math.max(1e-9, maxV - minV)
  const toNorm = (v: number) => ((v - minV) / range) * 10
  const fromNorm = (v: number) => minV + (v / 10) * range

  const points = groups.flatMap((g, gi) => g.values.map(v => [gi, toNorm(v)] as [number, number]))
  const pieces = groups.map((g, gi) => ({ value: gi, color: g.color ? resolve(g.color) : primaryColor.value }))

  return withSharedOverlays({
    ...baseOption.value,
    xAxis: {
      type: 'category' as const,
      data: groups.map(g => g.name),
      axisLabel: chromeStyle.value,
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 10,
      axisLabel: {
        ...chromeStyle.value,
        formatter: (v: number) => `${Math.round(fromNorm(v))}`,
      },
      splitLine: { lineStyle: gridLineStyle.value },
    },
    visualMap: {
      show: false,
      dimension: 0,
      pieces,
    },
    series: [{
      type: 'custom',
      renderItem: 'violin',
      data: points,
      itemPayload: {
        symbolSize: 4,
        areaOpacity: 0.58,
        bandWidthScale: 0.8,
        binCount: 60,
      },
      z: 2,
    }],
  })
})
</script>
