<template>
  <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-viz-error bg-red-50 dark:bg-red-950/20 rounded px-2 py-0.5">
    <span class="w-1.5 h-1.5 rounded-full bg-viz-error" />
    {{ label ?? 'Unavailable' }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
