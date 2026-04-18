<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CalendarHeatmapData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: CalendarHeatmapData }>(), {
  height: 180,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const valueRange = computed(() => {
  const vals = props.data.points.map(p => p.value)
  return [Math.min(...vals), Math.max(...vals)]
})

const option = computed(() => ({
  ...baseOption.value,
  visualMap: {
    min: valueRange.value[0],
    max: valueRange.value[1],
    calculable: true,
    orient: 'horizontal' as const,
    left: 'center',
    bottom: 0,
    inRange: {
      color: [resolve('base-muted'), resolve(props.colorRole ?? 'base')],
    },
    textStyle: chromeStyle.value,
  },
  calendar: {
    top: props.title ? 48 : 24,
    left: 48,
    right: 24,
    cellSize: ['auto', 14],
    range: String(props.data.year),
    itemStyle: { borderWidth: 2, borderColor: '#fff' },
    yearLabel: { show: !!props.title, formatter: String(props.data.year), ...chromeStyle.value },
    dayLabel: { ...chromeStyle.value, nameMap: 'en' },
    monthLabel: { ...chromeStyle.value },
  },
  series: [{
    type: 'heatmap',
    coordinateSystem: 'calendar',
    data: props.data.points.map(p => [p.date, p.value]),
  }],
}))
</script>
