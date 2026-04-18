<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, StackedSeriesData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: StackedSeriesData; horizontal?: boolean }>(), {
  height: 300,
  colorRole: 'base',
  horizontal: false,
})

const { baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

// Normalize each category to 100%
const normalizedSeries = computed(() => {
  const nCats = props.data.categories.length
  const totals = Array.from({ length: nCats }, (_, ci) =>
    props.data.series.reduce((sum, s) => sum + (s.values[ci] ?? 0), 0)
  )
  return props.data.series.map(s => ({
    ...s,
    values: s.values.map((v, ci) => (totals[ci] ? (v / totals[ci]) * 100 : 0)),
  }))
})

const option = computed(() => {
  const catAxis = {
    type: 'category' as const,
    data: props.data.categories,
    axisLabel: chromeStyle.value,
  }
  const valAxis = {
    type: 'value' as const,
    max: 100,
    axisLabel: { ...chromeStyle.value, formatter: '{value}%' },
    splitLine: { lineStyle: gridLineStyle.value },
  }

  return {
    ...baseOption.value,
    legend: { data: props.data.series.map(s => s.name), textStyle: chromeStyle.value },
    xAxis: props.horizontal ? valAxis : catAxis,
    yAxis: props.horizontal ? catAxis : valAxis,
    series: normalizedSeries.value.map((s, i) => ({
      name: s.name,
      type: 'bar',
      stack: 'pct',
      data: s.values,
      itemStyle: { color: s.color ? resolve(s.color) : itemColor(i) },
      barMaxWidth: 40,
    })),
  }
})
</script>
