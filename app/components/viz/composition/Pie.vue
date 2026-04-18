<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CompositionData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: CompositionData }>(), {
  height: 320,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  legend: {
    orient: 'vertical' as const,
    right: 16,
    top: 'center',
    textStyle: { ...chromeStyle.value },
  },
  series: [{
    type: 'pie',
    radius: '65%',
    label: {
      show: true,
      formatter: '{b}: {d}%',
      fontSize: 10,
      color: chromeStyle.value.color,
    },
    labelLine: { lineStyle: { color: chromeStyle.value.color, opacity: 0.5 } },
    data: props.data.parts.map((p, i) => ({
      name: p.key,
      value: p.value,
      itemStyle: { color: p.color ? resolve(p.color) : itemColor(i) },
    })),
  }],
}))
</script>
