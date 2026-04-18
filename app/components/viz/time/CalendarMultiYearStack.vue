<template>
  <div class="flex flex-col gap-2" :style="{ minHeight: `${height}px` }">
    <p v-if="title" class="text-xs font-medium text-viz-chrome uppercase tracking-wide px-2">
      {{ title }}
    </p>
    <CalendarHeatmap
      v-for="year in data.years"
      :key="year.year"
      :data="year"
      :color-role="colorRole"
      :height="yearHeight"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CalendarHeatmap from './CalendarHeatmap.vue'
import type { SharedChartProps, CalendarMultiYearData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & { data: CalendarMultiYearData }>(), {
  height: 500,
  colorRole: 'base',
})

const { data, title, colorRole, height } = props

const yearHeight = computed(() => Math.max(140, Math.floor((props.height ?? 500) / props.data.years.length)))
</script>
