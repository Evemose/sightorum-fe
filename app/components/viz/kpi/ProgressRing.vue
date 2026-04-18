<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, ProgressRingData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: ProgressRingData }>(), {
  height: 220,
  colorRole: 'base',
})

const { primaryColor, baseOption } = useChartDefaults(props)
const { resolve } = useVizTheme()

const pct = computed(() => Math.min(100, Math.max(0, (props.data.value / props.data.target) * 100)))

const option = computed(() => ({
  ...baseOption.value,
  series: [
    {
      type: 'pie',
      radius: ['65%', '80%'],
      avoidLabelOverlap: false,
      silent: !props.onClick,
      label: {
        show: true,
        position: 'center',
        formatter: props.data.centerLabel ?? `${Math.round(pct.value)}%`,
        fontSize: 22,
        fontWeight: 'bold',
        color: primaryColor.value,
      },
      labelLine: { show: false },
      data: [
        { value: props.data.value, itemStyle: { color: primaryColor.value } },
        {
          value: Math.max(0, props.data.target - props.data.value),
          itemStyle: { color: resolve('base-muted'), opacity: 0.25 },
          emphasis: { disabled: true },
        },
      ],
      animation: true,
    },
  ],
}))
</script>
