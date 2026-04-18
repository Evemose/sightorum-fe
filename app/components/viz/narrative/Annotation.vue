<template>
  <div
    class="absolute text-xs text-viz-chrome bg-white/90 dark:bg-gray-900/90 rounded px-1.5 py-0.5 shadow-sm pointer-events-none"
    :style="positionStyle"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  x?: number | string
  y?: number | string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}>()

const positionStyle = computed(() => {
  if (props.x != null && props.y != null) {
    return { left: typeof props.x === 'number' ? `${props.x}px` : props.x, top: typeof props.y === 'number' ? `${props.y}px` : props.y }
  }
  const map: Record<string, Record<string, string>> = {
    'top-left': { top: '4px', left: '4px' },
    'top-right': { top: '4px', right: '4px' },
    'bottom-left': { bottom: '4px', left: '4px' },
    'bottom-right': { bottom: '4px', right: '4px' },
  }
  return map[props.position ?? 'top-right'] ?? map['top-right']
})
</script>
