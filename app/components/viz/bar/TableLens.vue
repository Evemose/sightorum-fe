<template>
  <div :style="{ minHeight: `${height}px` }" class="overflow-auto">
    <div
      v-for="row in data.rows"
      :key="row.key"
      class="flex items-center gap-2 py-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      :class="onClick ? 'cursor-pointer' : ''"
      @click="onClick?.(row)"
    >
      <span class="text-[10px] text-viz-chrome w-24 truncate flex-shrink-0 text-right">
        {{ row.key }}
      </span>
      <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
        <div
          class="h-full rounded-sm bg-viz-base"
          :style="{ width: `${(row.value / maxVal) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SharedChartProps, TableInlineBarData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: TableInlineBarData }>(), {
  height: 400,
})

const { data, onClick } = props

const maxVal = computed(() => props.data.maxValue ?? Math.max(...props.data.rows.map(r => r.value), 1))
</script>
