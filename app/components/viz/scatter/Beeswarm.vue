<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, DistributionPointGroupData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: DistributionPointGroupData }>(), {
  height: 300,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle, withSharedOverlays } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => withSharedOverlays({
  ...baseOption.value,
  xAxis: {
    type: 'category' as const,
    data: props.data.groups.map(g => g.name),
    axisLabel: chromeStyle.value,
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: props.data.groups.map((g, gi) => ({
    type: 'scatter',
    name: g.name,
    data: g.points.map((p) => ({
      value: [gi + (p.offset ?? 0), p.value],
      symbolSize: p.size ?? 6,
      itemStyle: {
        color: p.color ? resolve(p.color) : g.color ? resolve(g.color) : primaryColor.value,
        opacity: 0.72,
      },
    })),
  })),
}))
</script>
