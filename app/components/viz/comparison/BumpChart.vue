<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, BumpChartData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: BumpChartData
  seriesColors?: ColorRole[]
}>(), {
  height: 350,
  colorRole: 'base',
  seriesColors: () => [],
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  legend: {
    data: props.data.series.map(s => s.name),
    textStyle: chromeStyle.value,
    type: 'scroll' as const,
  },
  xAxis: {
    type: 'category' as const,
    data: props.data.partitions,
    axisLabel: chromeStyle.value,
    boundaryGap: true,
  },
  yAxis: {
    type: 'value' as const,
    inverse: true,
    min: 1,
    axisLabel: chromeStyle.value,
    splitLine: { show: false },
    name: 'Rank',
    nameLocation: 'middle' as const,
    nameRotate: 90,
    nameGap: 32,
    nameTextStyle: chromeStyle.value,
  },
  series: props.data.series.map((s, i) => {
    const color = props.seriesColors?.[i]
      ? resolve(props.seriesColors[i])
      : s.color
        ? resolve(s.color)
        : itemColor(i)
    return {
      name: s.name,
      type: 'line',
      data: s.ranks,
      smooth: 0.3,
      lineStyle: { color, width: 2.5 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 8,
    }
  }),
}))
</script>
