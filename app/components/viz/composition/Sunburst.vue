<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, HierarchyData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: HierarchyData }>(), {
  height: 400,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)

const option = computed(() => ({
  ...baseOption.value,
  series: [{
    type: 'sunburst',
    data: props.data.root.children ?? [],
    radius: ['15%', '85%'],
    label: { fontSize: 10, rotate: 'tangential' as const },
    itemStyle: { borderWidth: 1.5, borderColor: '#fff' },
    emphasis: {
      focus: 'ancestor' as const,
    },
    levels: [
      {},
      { r0: '15%', r: '40%', label: { fontSize: 11 } },
      { r0: '40%', r: '65%', label: { fontSize: 10 } },
      { r0: '65%', r: '85%', label: { show: false } },
    ],
  }],
}))
</script>
