<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, GroupedTimeSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: GroupedTimeSeriesData
  magnitudeLabels?: { t: string; label: string }[]
}>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const base = props.data.series[0]
  const shifted = props.data.series[1]
  if (!base || !shifted) return baseOption.value

  const allTimes = [...new Set([
    ...base.points.map(p => String(p.t)),
    ...shifted.points.map(p => String(p.t)),
  ])]

  return {
    ...baseOption.value,
    legend: {
      data: [base.name, shifted.name],
      textStyle: chromeStyle.value,
    },
    xAxis: {
      type: 'category' as const,
      data: allTimes,
      axisLabel: chromeStyle.value,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { lineStyle: gridLineStyle.value },
    },
    series: [
      {
        name: base.name,
        type: 'line',
        data: base.points.map(p => p.value),
        lineStyle: { color: primaryColor.value, width: 2 },
        itemStyle: { color: primaryColor.value },
        showSymbol: false,
      },
      {
        name: shifted.name,
        type: 'line',
        data: shifted.points.map(p => p.value),
        lineStyle: { color: resolve('divergent'), width: 2, type: 'dashed' as const },
        itemStyle: { color: resolve('divergent') },
        showSymbol: false,
      },
      // Magnitude labels as scatter points with labels
      ...(props.magnitudeLabels?.length
        ? [{
            type: 'scatter' as const,
            data: props.magnitudeLabels.map(ml => {
              const baseVal = base.points.find(p => String(p.t) === ml.t)?.value ?? 0
              const shiftVal = shifted.points.find(p => String(p.t) === ml.t)?.value ?? 0
              return [ml.t, (baseVal + shiftVal) / 2]
            }),
            symbolSize: 0,
            label: {
              show: true,
              formatter: (params: { dataIndex: number }) =>
                props.magnitudeLabels![params.dataIndex]?.label ?? '',
              fontSize: 10,
              color: resolve('chrome'),
            },
          }]
        : []),
    ],
  }
})
</script>
