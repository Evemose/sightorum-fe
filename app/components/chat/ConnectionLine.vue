<template>
  <line
      :x1="x1"
      :y1="y1"
      :x2="x2"
      :y2="y2"
      class="connection-line"
      :class="lineClass"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      :stroke-dasharray="dashArray"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  x1: number
  y1: number
  x2: number
  y2: number
  isFork?: boolean
  isPulsing?: boolean
  strokeWidth?: number
  dashArray?: string
}>()

const lineClass = computed(() => {
  const classes = []
  if (props.isFork) classes.push('fork-line')
  if (props.isPulsing) classes.push('pulsing-pipe')
  return classes
})
</script>

<style scoped>
.connection-line {
  color: rgb(203 213 225); /* surface-300 */
}

.dark .connection-line {
  color: rgb(71 85 105); /* surface-600 */
}

.connection-line.fork-line {
  color: rgb(148 163 184); /* surface-400 */
}

.dark .connection-line.fork-line {
  color: rgb(100 116 139); /* surface-500 */
}

.connection-line.pulsing-pipe {
  color: rgb(59 130 246); /* blue-500 */
  stroke-width: 3;
  animation: pulse-pipe 1.5s ease-in-out infinite;
}

.dark .connection-line.pulsing-pipe {
  color: rgb(96 165 250); /* blue-400 */
}

@keyframes pulse-pipe {
  0%, 100% {
    opacity: 0.6;
    stroke-width: 2;
  }
  50% {
    opacity: 1;
    stroke-width: 3;
  }
}
</style>
