<template>
  <div class="rounded-lg bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <!-- Header -->
    <div v-if="title || $slots.filterBar" class="px-5 pt-5 pb-2 flex items-end justify-between gap-4">
      <div v-if="title">
        <h2 class="text-base font-bold leading-tight">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-viz-chrome mt-0.5">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.filterBar" class="shrink-0">
        <slot name="filterBar" />
      </div>
    </div>

    <!-- Grid -->
    <div class="p-5" :style="gridStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  columns?: number
  gap?: number
  breakpoints?: Record<string, number>
  title?: string
  subtitle?: string
}>(), {
  columns: 12,
  gap: 16,
})

// --- Responsive breakpoint detection ---
const BREAKPOINT_WIDTHS: Record<string, number> = { sm: 640, md: 1024 }

const activeBreakpoint = ref<string | null>(null)

function updateBreakpoint() {
  if (import.meta.server) return
  const w = window.innerWidth
  const sorted = Object.keys(props.breakpoints ?? {}).sort(
    (a, b) => (BREAKPOINT_WIDTHS[a] ?? 0) - (BREAKPOINT_WIDTHS[b] ?? 0),
  )
  activeBreakpoint.value = null
  for (const key of sorted) {
    if (w <= (BREAKPOINT_WIDTHS[key] ?? 0)) {
      activeBreakpoint.value = key
      break
    }
  }
}

onMounted(() => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})
onUnmounted(() => {
  if (!import.meta.server) window.removeEventListener('resize', updateBreakpoint)
})

provide('activeBreakpoint', activeBreakpoint)

const activeColumns = computed(() => {
  const bp = activeBreakpoint.value
  if (bp && props.breakpoints?.[bp]) return props.breakpoints[bp]!
  return props.columns
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${activeColumns.value}, 1fr)`,
  gap: `${props.gap}px`,
}))
</script>
