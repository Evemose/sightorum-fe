<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, HistogramData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: HistogramData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const bins = props.data.bins
  const labels = bins.map(b => b.label ?? `${b.x0.toFixed(1)}-${b.x1.toFixed(1)}`)

  const series: Array<Record<string, unknown>> = [
    {
      type: 'bar',
      data: bins.map(b => b.count),
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const bin = bins[params.dataIndex]
          return bin?.color ? resolve(bin.color) : primaryColor.value
        },
      },
      barCategoryGap: '5%',
    },
  ]

  if (props.data.densityPoints?.length) {
    series.push({
      type: 'line',
      data: props.data.densityPoints,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: resolve('base-muted'), width: 2 },
      itemStyle: { color: resolve('base-muted') },
      xAxisIndex: 1,
      yAxisIndex: 0,
    })
  }

  return withSharedOverlays({
    ...baseOption.value,
    xAxis: [
      {
        type: 'category' as const,
        data: labels,
        axisLabel: { ...chromeStyle.value, rotate: 30 },
        axisLine: { lineStyle: gridLineStyle.value },
      },
      ...(props.data.densityPoints?.length
        ? [{
            type: 'value' as const,
            show: false,
            min: props.data.densityPoints[0]?.[0],
            max: props.data.densityPoints[props.data.densityPoints.length - 1]?.[0],
          }]
        : []),
    ],
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series,
  })
})
</script>
