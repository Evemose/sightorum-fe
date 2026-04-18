<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, BoxPlotData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: BoxPlotData }>(), {
  height: 350,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle, gridLineStyle } = useChartDefaults(props)

const option = computed(() => ({
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
  series: [
    {
      type: 'boxplot',
      data: props.data.groups.map(g => [g.min, g.q1, g.median, g.q3, g.max]),
      itemStyle: { color: 'transparent', borderColor: primaryColor.value, borderWidth: 2 },
    },
    // Outliers
    {
      type: 'scatter',
      data: props.data.groups.flatMap((g, i) =>
        (g.outliers ?? []).map(o => [i, o])
      ),
      symbolSize: 5,
      itemStyle: { color: primaryColor.value, opacity: 0.6 },
    },
  ],
}))
</script>
