<template>
  <div :id="id" class="scroll-mt-16">
    <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono">
      &lt;{{ title }} /&gt;
    </h3>
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ id: string; title: string }>()
</script>
