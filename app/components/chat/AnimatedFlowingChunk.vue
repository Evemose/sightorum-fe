<template>
  <g class="flow-chunk">
    <defs>
      <filter :id="glowId">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Main circle body -->
    <circle
      :cx="startX"
      :cy="y"
      :r="bodyRadius"
      class="chunk-body"
      fill="currentColor"
      :filter="`url(#${glowId})`"
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
        attributeName="opacity"
        values="0;1;1;0"
        :dur="duration"
        repeatCount="indefinite"
        :begin="delay"
      />
    </circle>

    <!-- Trailing hyperbola (tail) - follows circle -->
    <path
      :d="generateTailPath(startX)"
      class="chunk-tail"
      fill="currentColor"
      opacity="0.6"
    >
      <animate
        attributeName="d"
        :values="tailPathValues"
        :dur="duration"
        repeatCount="indefinite"
        :begin="delay"
      />
      <animate
        attributeName="opacity"
        values="0;0.6;0.6;0"
        :dur="duration"
        repeatCount="indefinite"
        :begin="delay"
      />
    </path>

    <!-- Leading hyperbola (head) - follows circle -->
    <path
      :d="generateHeadPath(startX)"
      class="chunk-head"
      fill="currentColor"
      opacity="0.4"
    >
      <animate
        attributeName="d"
        :values="headPathValues"
        :dur="duration"
        repeatCount="indefinite"
        :begin="delay"
      />
      <animate
        attributeName="opacity"
        values="0;0.4;0.4;0"
        :dur="duration"
        repeatCount="indefinite"
        :begin="delay"
      />
    </path>
  </g>
</template>

<script setup lang="ts">
const props = defineProps<{
  startX: number
  endX: number
  y: number
  index: number
  uniqueId: string
  bodyRadius?: number
  tailLength?: number
  tailWidth?: number
  headLength?: number
  headWidth?: number
}>()

// Animation timing
const duration = computed(() => `${2.5 + props.index * 0.4}s`)
const delay = computed(() => `${props.index * 0.8}s`)

// Unique filter ID
const glowId = computed(() => `glow-${props.uniqueId}-${props.index}`)

// Default sizes
const bodyRadius = computed(() => props.bodyRadius ?? 8)
const tailLength = computed(() => props.tailLength ?? 30)
const tailWidth = computed(() => props.tailWidth ?? 8)
const headLength = computed(() => props.headLength ?? 22)
const headWidth = computed(() => props.headWidth ?? 6)

// SVG path generation functions
const generateTailPath = (centerX: number) => {
  const y = props.y
  const len = tailLength.value
  const width = tailWidth.value
  return `M ${centerX},${y} Q ${centerX - len * 0.67},${y - width} ${centerX - len},${y} Q ${centerX - len * 0.67},${y + width} ${centerX},${y}`
}

const generateHeadPath = (centerX: number) => {
  const y = props.y
  const len = headLength.value
  const width = headWidth.value
  return `M ${centerX},${y} Q ${centerX + len * 0.68},${y - width} ${centerX + len},${y} Q ${centerX + len * 0.68},${y + width} ${centerX},${y}`
}

// Generate keyframe values for smooth animation
const tailPathValues = computed(() => {
  const steps = 10 // Number of interpolation steps
  const paths = []
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const x = props.startX + (props.endX - props.startX) * progress
    paths.push(generateTailPath(x))
  }
  return paths.join(';')
})

const headPathValues = computed(() => {
  const steps = 10 // Number of interpolation steps
  const paths = []
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    const x = props.startX + (props.endX - props.startX) * progress
    paths.push(generateHeadPath(x))
  }
  return paths.join(';')
})
</script>

<style scoped>
.chunk-body {
  color: rgb(59 130 246); /* blue-500 */
}

.dark .chunk-body {
  color: rgb(96 165 250); /* blue-400 */
}

.chunk-tail {
  color: rgb(37 99 235); /* blue-600 - darker for tail */
}

.dark .chunk-tail {
  color: rgb(59 130 246); /* blue-500 */
}

.chunk-head {
  color: rgb(96 165 250); /* blue-400 - lighter for head */
}

.dark .chunk-head {
  color: rgb(147 197 253); /* blue-300 */
}
</style>
