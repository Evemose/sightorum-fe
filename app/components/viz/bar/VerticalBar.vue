<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CategoricalSeriesData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: CategoricalSeriesData
  sections?: { start: number; end: number; color: ColorRole }[]
}>(), {
  height: 300,
  colorRole: 'base',
  sections: () => [],
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'category' as const,
    data: props.data.items.map(d => d.key),
    axisLabel: chromeStyle.value,
    axisLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [{
    type: 'bar',
    data: props.data.items.map(d => d.value),
    itemStyle: {
      color: (params: { dataIndex: number }) => {
        const s = props.sections?.find(x => params.dataIndex >= x.start && params.dataIndex <= x.end)
        return s ? resolve(s.color) : primaryColor.value
      },
    },
    barMaxWidth: 40,
    ...buildMarkLines(props.referenceLines),
  }],
}))
</script>
