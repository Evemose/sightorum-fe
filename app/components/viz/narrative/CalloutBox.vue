<template>
  <div
    class="rounded-md border-l-4 px-4 py-3 text-sm"
    :class="borderClass"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Severity } from '../types'

const props = defineProps<{ severity: Severity; text: string }>()

const borderClass = computed(() => {
  const map: Record<Severity, string> = {
    HIGH: 'border-viz-severity-amber bg-amber-50 dark:bg-amber-950/20 text-gray-800 dark:text-gray-200',
    MED: 'border-viz-severity-muted bg-orange-50 dark:bg-orange-950/10 text-gray-800 dark:text-gray-200',
    LOW: 'border-viz-severity-low bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400',
  }
  return map[props.severity]
})
</script>
