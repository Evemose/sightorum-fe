<template>
  <div class="flex flex-col" :style="{ minHeight: `${height}px` }">
    <p v-if="title" class="text-xs font-medium text-viz-chrome mb-1 uppercase tracking-wide px-2">
      {{ title }}
    </p>
    <VChart
      v-for="(panel, i) in panels"
      :key="panel.label"
      :option="panel.option"
      :style="{ height: `${panelHeight}px` }"
      autoresize
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useVizTheme } from '~/composables/useVizTheme'
import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, StlDecompositionData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: StlDecompositionData
  panelColors?: [ColorRole, ColorRole, ColorRole]
}>(), {
  height: 500,
  colorRole: 'base',
})

const { chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const panelHeight = computed(() => Math.floor((props.height ?? 500) / 3))

const times = computed(() => props.data.points.map(p => String(p.t)))

const panels = computed(() => {
  const colors = props.panelColors ?? (['base', 'base-muted', 'chrome'] as [ColorRole, ColorRole, ColorRole])
  const defs = [
    { label: 'Trend', key: 'trend' as const, color: colors[0] },
    { label: 'Seasonal', key: 'seasonal' as const, color: colors[1] },
    { label: 'Remainder', key: 'remainder' as const, color: colors[2] },
  ]

  return defs.map((d, i) => ({
    label: d.label,
    option: {
      grid: { top: 24, right: 24, bottom: i === 2 ? 28 : 8, left: 48, containLabel: true },
      title: { text: d.label, textStyle: { fontSize: 11, color: resolve('chrome') }, left: 4, top: 4 },
      xAxis: {
        type: 'category' as const,
        data: times.value,
        axisLabel: { show: i === 2, ...chromeStyle.value },
        axisLine: { lineStyle: gridLineStyle.value },
        axisTick: { show: i === 2 },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: chromeStyle.value,
        splitLine: { lineStyle: gridLineStyle.value },
      },
      series: [{
        type: 'line',
        data: props.data.points.map(p => p[d.key]),
        lineStyle: { color: resolve(d.color), width: 1.5 },
        itemStyle: { color: resolve(d.color) },
        showSymbol: false,
        areaStyle: d.key === 'remainder' ? { color: resolve(d.color), opacity: 0.15 } : undefined,
      }],
      tooltip: { trigger: 'axis' as const },
    },
  }))
})
</script>
