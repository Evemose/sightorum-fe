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

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)

const option = computed(() => ({
  ...baseOption.value,
  series: [{
    type: 'treemap',
    data: [props.data.root],
    roam: false,
    breadcrumb: { show: true, itemStyle: { textStyle: chromeStyle.value } },
    label: {
      show: true,
      formatter: '{b}',
      fontSize: 11,
    },
    itemStyle: {
      borderColor: '#fff',
      borderWidth: 2,
      gapWidth: 2,
    },
    levels: [
      { itemStyle: { borderWidth: 3, gapWidth: 3 } },
      { colorSaturation: [0.3, 0.7], itemStyle: { borderWidth: 1 } },
      { colorSaturation: [0.2, 0.5], itemStyle: { borderWidth: 1 } },
    ],
  }],
}))
</script>
