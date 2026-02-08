<template>
  <circle
    :cx="startX"
    :cy="y"
    :r="initialRadius"
    class="plume-particle"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    opacity="0"
  >
    <animate
      attributeName="cx"
      :from="startX"
      :to="endX"
      :dur="duration"
      repeatCount="indefinite"
      :begin="delay"
    />
    <animate
      attributeName="r"
      :from="initialRadius"
      :to="finalRadius"
      :dur="duration"
      repeatCount="indefinite"
      :begin="delay"
    />
    <animate
      attributeName="opacity"
      values="0;0.6;0"
      :dur="duration"
      repeatCount="indefinite"
      :begin="delay"
    />
  </circle>
</template>

<script setup lang="ts">
const props = defineProps<{
  startX: number
  endX: number
  y: number
  index: number
  initialRadius?: number
  finalRadius?: number
  strokeWidth?: number
}>()

// Animation timing
const duration = computed(() => `${2 + props.index * 0.3}s`)
const delay = computed(() => `${props.index * 0.4}s`)

// Default sizes
const initialRadius = computed(() => props.initialRadius ?? 2)
const finalRadius = computed(() => props.finalRadius ?? 8)
const strokeWidth = computed(() => props.strokeWidth ?? 1.5)
</script>

<style scoped>
.plume-particle {
  color: rgb(59 130 246); /* blue-500 */
  stroke-opacity: 0.4;
}

.dark .plume-particle {
  color: rgb(96 165 250); /* blue-400 */
}
</style>
