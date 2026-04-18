<template>
  <div>
    <p v-if="title" class="text-xs font-medium text-viz-chrome mb-2 uppercase tracking-wide px-2">
      {{ title }}
    </p>
    <div class="grid gap-3" :style="gridStyle">
      <div v-for="(panel, idx) in data.panels" :key="panel.name">
        <p class="text-[10px] text-viz-chrome mb-0.5 px-1 truncate">{{ panel.name }}</p>
        <VChart :option="panelOption(panel, idx)" :style="{ height: `${panelHeight}px` }" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, SmallMultiplesLineData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: SmallMultiplesLineData
  columns?: number
  panelHeight?: number
}>(), {
  height: 500,
  colorRole: 'base',
  columns: 3,
  panelHeight: 140,
})

const { chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
}))

// Consistent Y scale across all panels
const yExtent = computed(() => {
  const allValues = props.data.panels.flatMap(p => p.points.map(pt => pt.value))
  return [Math.min(...allValues), Math.max(...allValues)]
})

function panelOption(panel: SmallMultiplesLineData['panels'][number], index: number) {
  const color = panel.color ? resolve(panel.color) : itemColor(index)
  return {
    grid: { top: 8, right: 8, bottom: 20, left: 36 },
    xAxis: {
      type: 'category' as const,
      data: panel.points.map(p => String(p.t)),
      axisLabel: { show: false },
      axisLine: { lineStyle: gridLineStyle.value },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: yExtent.value[0],
      max: yExtent.value[1],
      axisLabel: { ...chromeStyle.value, fontSize: 9 },
      splitLine: { lineStyle: { ...gridLineStyle.value, opacity: 0.15 } },
    },
    series: [{
      type: 'line',
      data: panel.points.map(p => p.value),
      lineStyle: { color, width: 1.5 },
      itemStyle: { color },
      showSymbol: false,
    }],
    tooltip: { trigger: 'axis' as const },
  }
}
</script>
