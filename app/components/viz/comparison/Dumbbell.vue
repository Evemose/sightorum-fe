<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, PairedComparisonData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: PairedComparisonData }>(), {
  height: 350,
  colorRole: 'base',
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, deltaColor } = useVizTheme()

type RenderParams = { dataIndex: number }
type RenderApi = { coord: (v: [number, number]) => [number, number] }

const option = computed(() => {
  const maxDelta = Math.max(...props.data.rows.map(r => Math.abs(r.right - r.left)), 1)
  return {
  ...baseOption.value,
  xAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'category' as const,
    data: props.data.rows.map(r => r.key),
    inverse: true,
    axisLabel: chromeStyle.value,
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [
    // Connecting lines via custom series
    {
      type: 'custom',
      renderItem: (params: RenderParams, api: RenderApi) => {
        const row = props.data.rows[params.dataIndex]
        if (!row) return { type: 'group', children: [] }
        const yPx = api.coord([0, params.dataIndex])[1]
        const x1 = api.coord([row.left, 0])[0]
        const x2 = api.coord([row.right, 0])[0]
        return {
          type: 'line',
          shape: { x1, y1: yPx, x2, y2: yPx },
          style: { stroke: resolve('chrome'), lineWidth: 2 },
        }
      },
      data: props.data.rows.map((_, i) => [i]),
      z: 1,
    },
    // Left endpoints (reference — hollow ring)
    {
      type: 'scatter',
      data: props.data.rows.map((r, i) => [r.left, i]),
      symbolSize: 10,
      itemStyle: { color: '#ffffff', borderColor: resolve('chrome'), borderWidth: 2 },
      z: 2,
    },
    // Right endpoints — gradient-coded by sign and magnitude of delta
    {
      type: 'scatter',
      data: props.data.rows.map((r, i) => [r.right, i]),
      symbolSize: 13,
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const row = props.data.rows[params.dataIndex]
          if (!row) return resolve('chrome')
          const d = row.right - row.left
          return deltaColor(d, maxDelta)
        },
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      z: 2,
    },
  ],
  }
})
</script>
