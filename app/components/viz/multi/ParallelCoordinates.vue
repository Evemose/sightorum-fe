<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, ParallelData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: ParallelData
  highlightedKeys?: string[]
}>(), {
  height: 350,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  parallelAxis: props.data.axes.map((ax, i) => ({
    dim: i,
    name: ax.name,
    min: ax.min,
    max: ax.max,
    nameTextStyle: chromeStyle.value,
    axisLabel: chromeStyle.value,
  })),
  parallel: {
    left: 60,
    right: 60,
    top: props.title ? 48 : 24,
    bottom: 32,
    parallelAxisDefault: {
      nameLocation: 'end' as const,
      nameGap: 20,
    },
  },
  series: [{
    type: 'parallel',
    lineStyle: {
      width: 1.5,
      opacity: 0.4,
      color: primaryColor.value,
    },
    emphasis: {
      lineStyle: { width: 3, opacity: 1 },
    },
    data: props.data.lines.map((line, i) => {
      const isHighlighted = props.highlightedKeys?.includes(line.name ?? '')
      return {
        value: line.values,
        lineStyle: isHighlighted
          ? { color: resolve('severity-amber'), width: 2.5, opacity: 0.9 }
          : line.color
            ? { color: resolve(line.color) }
            : undefined,
      }
    }),
  }],
}))
</script>
