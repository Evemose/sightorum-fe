<template>
  <div
    class="fork-connector"
    :style="{
      gridRow: `${parentRow} / ${childRow + 1}`,
      gridColumn: column
    }"
  >
    <svg class="w-full h-full" preserveAspectRatio="none">
      <!-- Vertical dashed line -->
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="100%"
        class="connector-line"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray="4 2"
      />

      <!-- Junction point at parent -->
      <circle
        cx="50%"
        cy="0"
        r="4"
        class="junction-point"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  parentRow: number
  childRow: number
  column: number
}>()
</script>

<style scoped>
.fork-connector {
  position: relative;
  pointer-events: none;
  z-index: 1;
}

.connector-line {
  color: rgb(148 163 184); /* surface-400 */
}

.dark .connector-line {
  color: rgb(100 116 139); /* surface-500 */
}

.junction-point {
  color: rgb(148 163 184); /* surface-400 */
}

.dark .junction-point {
  color: rgb(100 116 139); /* surface-500 */
}
</style>
