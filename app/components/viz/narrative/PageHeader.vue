<template>
  <div class="mb-3">
    <span
      v-if="tag"
      class="inline-block text-[10px] font-bold uppercase tracking-wider text-viz-chrome bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 mr-2"
    >
      {{ tag }}
    </span>
    <h2 class="text-base font-bold text-gray-900 dark:text-gray-100 inline">{{ title }}</h2>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; tag?: string }>()
</script>
