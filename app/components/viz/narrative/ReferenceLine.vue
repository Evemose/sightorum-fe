<template>
  <div class="relative w-full" :style="{ height: axis === 'x' ? '2px' : '100%', width: axis === 'y' ? '2px' : '100%' }">
    <div
      class="absolute bg-viz-chrome"
      :class="lineClass"
      :style="lineStyle"
    />
    <span
      v-if="label"
      class="absolute text-[10px] text-viz-chrome whitespace-nowrap"
      :style="labelStyle"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  axis: 'x' | 'y'
  label?: string
  style?: 'solid' | 'dashed' | 'dotted'
}>(), {
  axis: 'x',
  style: 'dashed',
})

const lineClass = computed(() => {
  if (props.axis === 'x') return 'w-full h-px'
  return 'h-full w-px'
})

const lineStyle = computed(() => {
  const borderStyle = props.style === 'dashed' ? 'dashed' : props.style === 'dotted' ? 'dotted' : 'solid'
  if (props.axis === 'x') return { borderTop: `1px ${borderStyle} currentColor`, width: '100%' }
  return { borderLeft: `1px ${borderStyle} currentColor`, height: '100%' }
})

const labelStyle = computed(() => {
  if (props.axis === 'x') return { right: '4px', top: '-14px' }
  return { top: '4px', left: '6px' }
})
</script>
