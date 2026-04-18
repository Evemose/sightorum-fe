<template>
  <section>
    <h2 class="text-sm font-bold uppercase tracking-wider text-viz-chrome mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
      {{ title }}
    </h2>
    <div class="space-y-8">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ idPrefix?: string; title: string }>()
</script>
