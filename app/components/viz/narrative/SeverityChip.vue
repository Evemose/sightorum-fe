<template>
  <span
    class="inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 leading-none"
    :class="chipClass"
  >
    {{ severity }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Severity } from '../types'

const props = defineProps<{ severity: Severity }>()

const chipClass = computed(() => {
  const map: Record<Severity, string> = {
    HIGH: 'bg-viz-severity-amber/20 text-viz-severity-amber',
    MED: 'bg-viz-severity-muted/20 text-viz-severity-muted',
    LOW: 'bg-gray-100 dark:bg-gray-800 text-viz-severity-low',
  }
  return map[props.severity]
})
</script>
