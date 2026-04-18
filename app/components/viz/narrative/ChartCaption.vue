<template>
  <p class="text-xs text-viz-chrome mt-1.5 leading-relaxed">{{ text }}</p>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>
