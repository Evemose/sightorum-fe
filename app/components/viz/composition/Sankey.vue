<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import type { SharedChartProps, FlowData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: FlowData }>(), {
  height: 400,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { itemColor } = useVizTheme()

const option = computed(() => ({
  ...baseOption.value,
  series: [{
    type: 'sankey',
    layout: 'none',
    emphasis: { focus: 'adjacency' as const },
    data: props.data.nodes.map((n, i) => ({
      name: n.name,
      itemStyle: { color: itemColor(i) },
    })),
    links: props.data.links.map(l => ({
      source: props.data.nodes.find(n => n.id === l.source)?.name ?? l.source,
      target: props.data.nodes.find(n => n.id === l.target)?.name ?? l.target,
      value: l.value,
    })),
    lineStyle: { color: 'source' as const, opacity: 0.4, curveness: 0.5 },
    label: { fontSize: 11, color: chromeStyle.value.color },
    nodeGap: 10,
    nodeWidth: 14,
  }],
}))
</script>
