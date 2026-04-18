<template>
  <div
    class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5"
    :style="{ minHeight: `${height}px` }"
  >
    <p v-if="title" class="text-xs font-medium text-viz-chrome mb-3 uppercase tracking-wide">
      {{ title }}
    </p>

    <div class="flex items-end justify-between gap-6">
      <div>
        <p class="text-xs text-viz-chrome mb-0.5">{{ data.labelA }}</p>
        <p class="text-2xl font-bold text-viz-base">{{ data.valueA.toLocaleString() }}</p>
      </div>

      <div class="flex flex-col items-center pb-1">
        <span
          class="text-sm font-bold"
          :class="data.delta >= 0 ? 'text-viz-delta-positive' : 'text-viz-delta-negative'"
        >
          {{ data.delta >= 0 ? '+' : '' }}{{ data.delta.toLocaleString() }}
        </span>
        <span class="text-[10px] text-viz-chrome">delta</span>
      </div>

      <div class="text-right">
        <p class="text-xs text-viz-chrome mb-0.5">{{ data.labelB }}</p>
        <p class="text-2xl font-bold text-viz-base">{{ data.valueB.toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SharedChartProps, DualMeanData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: DualMeanData }>(), {
  height: 100,
  colorRole: 'base',
})

const { data, title, height } = toRefs(props)
</script>
