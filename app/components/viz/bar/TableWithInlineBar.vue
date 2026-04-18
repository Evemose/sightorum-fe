<template>
  <div :style="{ minHeight: `${height}px` }" class="overflow-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="text-left py-1.5 px-2 text-viz-chrome font-medium">{{ keyLabel }}</th>
          <th
            v-for="col in extraColumns"
            :key="col"
            class="text-left py-1.5 px-2 text-viz-chrome font-medium"
          >
            {{ col }}
          </th>
          <th class="text-left py-1.5 px-2 text-viz-chrome font-medium w-1/2">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in data.rows"
          :key="row.key"
          class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          :class="onClick ? 'cursor-pointer' : ''"
          @click="onClick?.(row)"
        >
          <td class="py-1.5 px-2 font-medium text-gray-900 dark:text-gray-100">{{ row.key }}</td>
          <td
            v-for="col in extraColumns"
            :key="col"
            class="py-1.5 px-2 text-viz-chrome"
          >
            {{ row.columns?.[col] ?? '' }}
          </td>
          <td class="py-1.5 px-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                <div
                  class="h-full rounded bg-viz-base"
                  :style="{ width: `${(row.value / maxVal) * 100}%` }"
                />
              </div>
              <span class="text-xs text-viz-chrome w-12 text-right">{{ row.value.toLocaleString() }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SharedChartProps, TableInlineBarData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: TableInlineBarData
  keyLabel?: string
}>(), {
  height: 300,
  keyLabel: 'Name',
})

const { data, onClick } = props

const maxVal = computed(() => props.data.maxValue ?? Math.max(...props.data.rows.map(r => r.value), 1))

const extraColumns = computed(() => {
  const first = props.data.rows[0]
  return first?.columns ? Object.keys(first.columns) : []
})
</script>
