<template>
  <div class="col-span-full">
    <!-- Section header -->
    <button
      v-if="collapsible"
      class="w-full flex items-center gap-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-viz-chrome border-b border-gray-200 dark:border-gray-700 mb-3"
      @click="collapsed = !collapsed"
    >
      <span
        class="inline-block transition-transform duration-200"
        :class="collapsed ? '' : 'rotate-90'"
      >&#9654;</span>
      {{ title }}
    </button>
    <div
      v-else
      class="text-xs font-bold uppercase tracking-wider text-viz-chrome border-b border-gray-200 dark:border-gray-700 pb-2 mb-3"
    >
      {{ title }}
    </div>

    <!-- Content grid — matches parent grid structure -->
    <div v-show="!collapsed" class="contents">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}>(), {
  collapsible: false,
  defaultCollapsed: false,
})

const collapsed = ref(props.defaultCollapsed)
</script>
