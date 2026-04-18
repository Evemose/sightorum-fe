<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, RadarData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: RadarData }>(), {
  height: 380,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  legend: props.data.series.length > 1
    ? { data: props.data.series.map(s => s.name), textStyle: chromeStyle.value }
    : undefined,
  radar: {
    indicator: props.data.indicators.map(ind => ({ name: ind.name, max: ind.max })),
    axisName: { ...chromeStyle.value },
    splitLine: { lineStyle: { color: resolve('chrome'), opacity: 0.2 } },
    splitArea: { show: false },
  },
  series: [{
    type: 'radar',
    data: props.data.series.map((s, i) => {
      const color = s.color ? resolve(s.color) : itemColor(i)
      return {
        name: s.name,
        value: s.values,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: { color, opacity: 0.15 },
      }
    }),
  }],
}))
</script>
