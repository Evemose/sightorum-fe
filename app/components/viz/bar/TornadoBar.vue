<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, TornadoData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: TornadoData }>(), {
  height: 300,
  colorRole: 'base',
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  legend: {
    data: [props.data.leftName, props.data.rightName],
    textStyle: chromeStyle.value,
  },
  xAxis: {
    type: 'value' as const,
    axisLabel: { ...chromeStyle.value, formatter: (v: number) => Math.abs(v).toString() },
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'category' as const,
    data: props.data.rows.map(d => d.key),
    axisTick: { show: false },
    axisLabel: chromeStyle.value,
  },
  series: [
    {
      name: props.data.leftName,
      type: 'bar',
      stack: 'tornado',
      data: props.data.rows.map(d => -Math.abs(d.left)),
      itemStyle: { color: resolve('base') },
      barMaxWidth: 24,
    },
    {
      name: props.data.rightName,
      type: 'bar',
      stack: 'tornado',
      data: props.data.rows.map(d => Math.abs(d.right)),
      itemStyle: { color: resolve('divergent') },
      barMaxWidth: 24,
    },
  ],
}))
</script>
