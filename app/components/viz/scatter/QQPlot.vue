<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, QQPlotData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: QQPlotData }>(), {
  height: 350,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => withSharedOverlays({
  ...baseOption.value,
  xAxis: {
    type: 'value' as const,
    name: 'Theoretical quantiles',
    nameLocation: 'center' as const,
    nameGap: 28,
    nameTextStyle: chromeStyle.value,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'value' as const,
    name: 'Observed quantiles',
    nameLocation: 'center' as const,
    nameGap: 40,
    nameTextStyle: chromeStyle.value,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [
    {
      type: 'scatter',
      data: props.data.points,
      symbolSize: 5,
      itemStyle: { color: primaryColor.value },
    },
    {
      type: 'line',
      data: [props.data.referenceLine.from, props.data.referenceLine.to],
      lineStyle: { color: resolve('chrome'), type: 'dashed' as const, width: 1.5 },
      showSymbol: false,
      silent: true,
      z: 1,
    },
  ],
}))
</script>
