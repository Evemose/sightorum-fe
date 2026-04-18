<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, CategoricalSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: CategoricalSeriesData
  /** SVG path or 'circle'/'rect'/'roundRect'/'triangle'/'diamond'/'pin'/'arrow' or 'path://...' */
  shape?: string
}>(), {
  height: 300,
  colorRole: 'base',
  shape: 'circle',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'category' as const,
    data: props.data.items.map(d => d.key),
    inverse: true,
    axisLabel: chromeStyle.value,
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'pictorialBar',
    symbol: props.shape,
    symbolRepeat: true,
    symbolSize: [16, 16],
    symbolMargin: 2,
    data: props.data.items.map(d => d.value),
    itemStyle: { color: primaryColor.value },
  }],
}))
</script>
