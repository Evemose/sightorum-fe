<template>
  <div
    class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
    :class="onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''"
    :style="{ minHeight: `${height}px` }"
    @click="onClick?.(data)"
  >
    <p v-if="title" class="text-xs font-medium text-viz-chrome mb-1 uppercase tracking-wide">
      {{ title }}
    </p>
    <p v-if="subtitle" class="text-xs text-viz-chrome mb-2">{{ subtitle }}</p>

    <p class="text-3xl font-bold" :class="valueColorClass">
      {{ formattedValue }}
    </p>

    <div v-if="data.delta != null" class="mt-2 flex items-center gap-1.5">
      <span
        class="text-sm font-semibold"
        :class="data.delta >= 0 ? 'text-viz-delta-positive' : 'text-viz-delta-negative'"
      >
        {{ data.delta >= 0 ? '+' : '' }}{{ data.delta.toLocaleString() }}
      </span>
      <span v-if="data.deltaLabel" class="text-xs text-viz-chrome">{{ data.deltaLabel }}</span>
    </div>

    <p v-if="data.n != null" class="mt-2 text-xs text-viz-chrome">
      N = {{ data.n.toLocaleString() }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { SharedChartProps, ScalarData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: ScalarData }>(), {
  height: 120,
  colorRole: 'base',
})

const { data, colorRole, onClick, title, subtitle, height } = props

const valueColorClass = computed(() => {
  const map: Record<string, string> = {
    'base': 'text-viz-base',
    'focal': 'text-viz-focal',
    'severity-amber': 'text-viz-severity-amber',
    'severity-muted': 'text-viz-severity-muted',
    'divergent': 'text-viz-divergent',
    'error': 'text-viz-error',
  }
  return map[colorRole ?? 'base'] ?? 'text-viz-base'
})

const formattedValue = computed(() =>
  typeof data.value === 'number' ? data.value.toLocaleString() : data.value
)
</script>
