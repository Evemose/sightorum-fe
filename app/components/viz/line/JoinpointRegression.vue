<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, JoinpointData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: JoinpointData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  // Each segment is a separate line series
  const segmentSeries = props.data.segments.map((seg, i) => ({
    type: 'line' as const,
    name: `Segment ${i + 1}`,
    data: [
      [String(seg.from.t), seg.from.value],
      [String(seg.to.t), seg.to.value],
    ],
    lineStyle: { color: primaryColor.value, width: 2 },
    itemStyle: { color: primaryColor.value },
    showSymbol: false,
    z: 2,
  }))

  // Joinpoint markers
  const joinpointSeries = {
    type: 'scatter' as const,
    name: 'Joinpoints',
    data: props.data.joinpoints.map(jp => [String(jp.t), jp.value]),
    symbolSize: 10,
    itemStyle: { color: resolve('severity-amber'), borderColor: '#fff', borderWidth: 2 },
    z: 3,
  }

  // Collect all x-axis values
  const allTimes = [
    ...props.data.segments.flatMap(s => [String(s.from.t), String(s.to.t)]),
    ...props.data.joinpoints.map(jp => String(jp.t)),
  ]
  const uniqueTimes = [...new Set(allTimes)].sort()

  return {
    ...baseOption.value,
    xAxis: {
      type: 'category' as const,
      data: uniqueTimes,
      axisLabel: chromeStyle.value,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: [...segmentSeries, joinpointSeries],
  }
})
</script>
