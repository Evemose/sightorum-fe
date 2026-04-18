<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="ax in axes"
      :key="ax.name"
      class="inline-flex items-center gap-1 text-xs rounded px-2 py-0.5"
      :class="ax.fired
        ? 'bg-viz-severity-amber/15 text-viz-severity-amber font-semibold'
        : 'bg-gray-100 dark:bg-gray-800 text-viz-chrome'"
    >
      <span v-if="ax.fired" class="w-1.5 h-1.5 rounded-full bg-viz-severity-amber" />
      {{ ax.name }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { AxisConsidered } from '../types'

defineProps<{ axes: AxisConsidered[] }>()
</script>
