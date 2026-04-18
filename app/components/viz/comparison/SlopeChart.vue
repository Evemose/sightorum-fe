<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, PairedComparisonData, DivergenceMap } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: PairedComparisonData
  leftLabel?: string
  rightLabel?: string
  divergenceMap?: DivergenceMap
  showAggregate?: boolean
  aggregateLeft?: number
  aggregateRight?: number
}>(), {
  height: 350,
  colorRole: 'base',
  leftLabel: 'Before',
  rightLabel: 'After',
  showAggregate: false,
})

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => {
  const xData = [props.leftLabel, props.rightLabel]

  const lineSeries = props.data.rows.map(row => {
    const div = props.divergenceMap?.[row.key]
    const color = div === 'high' || div === 'low'
      ? resolve('divergent')
      : primaryColor.value
    return {
      type: 'line' as const,
      name: row.key,
      data: [row.left, row.right],
      lineStyle: { color, width: 1.5 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 8,
      label: {
        show: true,
        position: 'right' as const,
        formatter: row.key,
        fontSize: 10,
        color: resolve('chrome'),
      },
    }
  })

  // Optional aggregate overlay
  if (props.showAggregate && props.aggregateLeft != null && props.aggregateRight != null) {
    lineSeries.push({
      type: 'line',
      name: 'Aggregate',
      data: [props.aggregateLeft, props.aggregateRight],
      lineStyle: { color: resolve('base'), width: 3 },
      itemStyle: { color: resolve('base') },
      symbol: 'diamond',
      symbolSize: 12,
      label: { show: true, position: 'right', formatter: 'Agg', fontSize: 10, color: resolve('chrome') },
    })
  }

  return {
    ...baseOption.value,
    xAxis: {
      type: 'category' as const,
      data: xData,
      axisLabel: chromeStyle.value,
      boundaryGap: true,
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: chromeStyle.value,
      splitLine: { show: false },
    },
    series: lineSeries,
    legend: { show: false },
  }
})
</script>
