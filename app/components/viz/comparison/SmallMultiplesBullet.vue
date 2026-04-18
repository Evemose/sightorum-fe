<template>
  <div>
    <p v-if="title" class="text-xs font-medium text-viz-chrome mb-2 uppercase tracking-wide px-2">
      {{ title }}
    </p>
    <div class="grid gap-3" :style="gridStyle">
      <div v-for="panel in data.panels" :key="panel.name">
        <p class="text-[10px] text-viz-chrome mb-0.5 px-1 truncate">{{ panel.name }}</p>
        <Bullet
          :data="{ value: panel.value, min: 0, max: maxVal, target: panel.target, bands: panel.bands }"
          :color-role="colorRole"
          :height="panelHeight"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Bullet from '../kpi/Bullet.vue'
import type { SharedChartProps, SmallMultiplesBulletData } from '../types'

const props = withDefaults(defineProps<SharedChartProps & {
  data: SmallMultiplesBulletData
  columns?: number
  panelHeight?: number
}>(), {
  height: 400,
  colorRole: 'base',
  columns: 2,
  panelHeight: 60,
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
}))

const maxVal = computed(() =>
  Math.max(...props.data.panels.map(p => Math.max(p.value, p.target)), 1)
)
</script>
