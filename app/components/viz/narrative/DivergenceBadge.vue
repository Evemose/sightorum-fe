<template>
  <span
    class="inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5"
    :class="badgeClass"
  >
    <span>{{ arrow }}</span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DivergenceLevel } from '../types'

const props = defineProps<{
  direction: DivergenceLevel
  label?: string
}>()

const badgeClass = computed(() => {
  const map: Record<DivergenceLevel, string> = {
    high: 'bg-viz-delta-positive/15 text-viz-delta-positive',
    low: 'bg-viz-delta-negative/15 text-viz-delta-negative',
    near: 'bg-gray-100 dark:bg-gray-800 text-viz-chrome',
  }
  return map[props.direction]
})

const arrow = computed(() => {
  const map: Record<DivergenceLevel, string> = { high: '^', low: 'v', near: '~' }
  return map[props.direction]
})
</script>
