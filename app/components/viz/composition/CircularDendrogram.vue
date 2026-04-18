<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, HierarchyData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: HierarchyData
  initialDepth?: number
}>(), {
  height: 450,
  colorRole: 'base',
  initialDepth: 3,
})

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)

const option = computed(() => ({
  ...baseOption.value,
  series: [{
    type: 'tree',
    layout: 'radial',
    data: [props.data.root],
    symbol: 'emptyCircle',
    symbolSize: 8,
    initialTreeDepth: props.initialDepth,
    roam: true,
    label: {
      fontSize: 10,
      color: chromeStyle.value.color,
    },
    lineStyle: {
      color: primaryColor.value,
      width: 1.5,
      curveness: 0.5,
    },
    emphasis: {
      focus: 'descendant' as const,
    },
    animationDurationUpdate: 750,
  }],
}))
</script>
