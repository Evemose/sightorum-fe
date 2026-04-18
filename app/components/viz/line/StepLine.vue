<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, TimeSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: TimeSeriesData
  stepPosition?: 'start' | 'middle' | 'end'
}>(), {
  height: 300,
  colorRole: 'base',
  stepPosition: 'start',
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'category' as const,
    data: props.data.points.map(p => String(p.t)),
    axisLabel: chromeStyle.value,
    boundaryGap: false,
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [{
    type: 'line',
    step: props.stepPosition,
    data: props.data.points.map(p => p.value),
    itemStyle: { color: primaryColor.value },
    lineStyle: { color: primaryColor.value },
    showSymbol: false,
    ...buildMarkLines(props.referenceLines),
  }],
}))
</script>
