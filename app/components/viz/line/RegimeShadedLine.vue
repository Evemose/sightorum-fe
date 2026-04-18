<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, TimeSeriesData, RegimeDef } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: TimeSeriesData
  regimes: RegimeDef[]
}>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

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
    data: props.data.points.map(p => p.value),
    itemStyle: { color: primaryColor.value },
    lineStyle: { color: primaryColor.value, width: 2 },
    showSymbol: false,
    markArea: {
      silent: true,
      data: props.regimes.map(r => [
        {
          xAxis: String(r.from),
          itemStyle: { color: resolve(r.color ?? 'base-muted'), opacity: 0.15 },
          label: r.label ? { show: true, position: 'insideTop', color: resolve('chrome'), fontSize: 10 } : { show: false },
          name: r.label ?? '',
        },
        { xAxis: String(r.to) },
      ]),
    },
  }],
}))
</script>
