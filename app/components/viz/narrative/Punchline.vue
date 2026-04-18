<template>
  <div class="border-l-4 border-viz-focal pl-4 py-2">
    <p class="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-snug">
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>
