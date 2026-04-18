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
  sorted?: boolean
  sections?: { start: number; end: number; color: ColorRole }[]
}>(), {
  height: 300,
  colorRole: 'base',
  sorted: false,
  sections: () => [],
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

type SectionDef = { start: number; end: number; color: ColorRole }
const sections = computed<SectionDef[]>(() => props.sections ?? [])

const sortedItems = computed(() => {
  const items = [...props.data.items]
  if (props.sorted) items.sort((a, b) => b.value - a.value)
  return items
})

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'category' as const,
    data: sortedItems.value.map(d => d.key),
    inverse: true,
    axisLabel: chromeStyle.value,
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    data: sortedItems.value.map(d => d.value),
    itemStyle: {
      color: (params: { dataIndex: number }) => {
        const s = sections.value.find(x => params.dataIndex >= x.start && params.dataIndex <= x.end)
        return s ? resolve(s.color) : primaryColor.value
      },
    },
    barMaxWidth: 28,
    ...buildMarkLines(props.referenceLines),
  }],
}))
</script>
