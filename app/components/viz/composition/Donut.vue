<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, CompositionData, ColorRole } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: CompositionData
  centerKpi?: string
}>(), {
  height: 320,
  colorRole: 'base',
})

const { primaryColor, baseOption, chromeStyle } = useChartDefaults(props)
const { resolve, itemColor } = useVizTheme()

const option = computed(() => {
  const parts = [...props.data.parts]
  if (props.data.other) {
    parts.push({ key: 'Other', value: props.data.other.value, share: props.data.other.share })
  }

  return {
    ...baseOption.value,
    legend: {
      orient: 'vertical' as const,
      right: 16,
      top: 'center',
      textStyle: { ...chromeStyle.value },
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        formatter: '{b}: {d}%',
        fontSize: 10,
        color: chromeStyle.value.color,
      },
      labelLine: { lineStyle: { color: chromeStyle.value.color, opacity: 0.5 } },
      emphasis: {
        label: { show: true, fontWeight: 'bold' },
      },
      data: parts.map((p, i) => ({
        name: p.key,
        value: p.value,
        itemStyle: {
          color: p.color
            ? resolve(p.color)
            : p.key === 'Other'
              ? resolve('chrome')
              : itemColor(i),
        },
      })),
      ...(props.centerKpi
        ? {
            label: {
              show: true,
              position: 'center',
              formatter: props.centerKpi,
              fontSize: 20,
              fontWeight: 'bold',
              color: primaryColor.value,
            },
          }
        : {}),
    }],
  }
})
</script>
