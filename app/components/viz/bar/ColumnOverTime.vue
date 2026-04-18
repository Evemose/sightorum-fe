<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, TimeSeriesData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: TimeSeriesData
  sections?: { start: number; end: number; color: ColorRole }[]
  highlightedKeys?: Array<string | number>
  highlightColor?: ColorRole
}>(), {
  height: 300,
  colorRole: 'base',
  sections: () => [],
  highlightedKeys: () => [],
  highlightColor: 'severity-amber',
})

const { primaryColor, baseOption, buildMarkLines, chromeStyle, gridLineStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  xAxis: {
    type: 'category' as const,
    data: props.data.points.map(d => String(d.t)),
    axisLabel: { ...chromeStyle.value, rotate: 30 },
    axisLine: { lineStyle: gridLineStyle.value },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: chromeStyle.value,
    splitLine: { lineStyle: gridLineStyle.value },
  },
  series: [{
    type: 'bar',
    data: props.data.points.map(d => d.value),
    itemStyle: {
      color: (params: { dataIndex: number }) => {
        const pt = props.data.points[params.dataIndex]
        const inSection = props.sections?.find(x => params.dataIndex >= x.start && params.dataIndex <= x.end)
        if (inSection) return resolve(inSection.color)
        const key = pt ? String(pt.t) : ''
        if (props.highlightedKeys?.map(String).includes(key)) {
          return resolve(props.highlightColor ?? 'severity-amber')
        }
        return primaryColor.value
      },
    },
    barMaxWidth: 32,
    ...buildMarkLines(props.referenceLines),
  }],
}))
</script>
