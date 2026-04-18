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
  series: [{
    type: 'scatter',
    data: props.data.groups.flatMap((g, gi) =>
      g.points.map(v => [gi + (Math.random() - 0.5) * 0.3, v])
    ),
    symbolSize: 5,
    itemStyle: { color: primaryColor.value, opacity: 0.6 },
  }],
}))
</script>
