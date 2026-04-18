<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, PerBucketRateData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: PerBucketRateData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const bins = props.data.bins
  return withSharedOverlays({
    ...baseOption.value,
    xAxis: {
      type: 'category' as const,
      data: bins.map(b => b.key),
      axisLabel: { ...chromeStyle.value, rotate: 30 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: [{
      type: 'bar',
      data: bins.map(b => b.count),
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const bin = bins[params.dataIndex]
          return bin?.color ? resolve(bin.color) : primaryColor.value
        },
      },
    }],
  })
})
</script>
