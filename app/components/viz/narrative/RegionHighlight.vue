<template>
  <div
    class="absolute rounded-sm pointer-events-none"
    :class="bgClass"
    :style="regionStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColorRole } from '../types'

const props = withDefaults(defineProps<{
  x: number | string
  y: number | string
  width: number | string
  height: number | string
  colorRole?: ColorRole
}>(), {
  colorRole: 'base-muted',
})

const bgClass = computed(() => {
  const map: Record<string, string> = {
    'base': 'bg-viz-base/15',
    'base-muted': 'bg-viz-base-muted/15',
    'severity-amber': 'bg-viz-severity-amber/15',
    'severity-muted': 'bg-viz-severity-muted/15',
    'focal': 'bg-viz-focal/15',
    'divergent': 'bg-viz-divergent/15',
  }
  return map[props.colorRole ?? 'base-muted'] ?? 'bg-viz-base-muted/15'
})

const px = (v: number | string) => typeof v === 'number' ? `${v}px` : v

const regionStyle = computed(() => ({
  left: px(props.x),
  top: px(props.y),
  width: px(props.width),
  height: px(props.height),
}))
</script>
