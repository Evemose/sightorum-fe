<template>
  <span class="inline-flex items-baseline gap-1 text-xs text-viz-chrome">
    <span class="font-medium">{{ label }}:</span>
    <span>{{ value }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>
