<template>
  <div class="flex items-stretch gap-4" :style="{ minHeight: `${height}px` }">
    <KpiCard :data="left" :color-role="colorRole" :title="leftTitle" class="flex-1" />
    <div class="flex flex-col items-center justify-center px-3">
      <span
        class="text-lg font-bold"
        :class="delta >= 0 ? 'text-viz-delta-positive' : 'text-viz-delta-negative'"
      >
        {{ delta >= 0 ? '+' : '' }}{{ delta.toLocaleString() }}
      </span>
      <span v-if="deltaLabel" class="text-xs text-viz-chrome mt-0.5">{{ deltaLabel }}</span>
    </div>
    <KpiCard :data="right" :color-role="colorRole" :title="rightTitle" class="flex-1" />
  </div>
</template>

<script setup lang="ts">
import type { SharedChartProps, ScalarData } from '../types'
import KpiCard from './KpiCard.vue'

const props = withDefaults(defineProps<SharedChartProps & {
  left: ScalarData
  right: ScalarData
  leftTitle?: string
  rightTitle?: string
  delta: number
  deltaLabel?: string
}>(), {
  height: 120,
  colorRole: 'base',
})

const { left, right, leftTitle, rightTitle, delta, deltaLabel, colorRole, height } = props
</script>
