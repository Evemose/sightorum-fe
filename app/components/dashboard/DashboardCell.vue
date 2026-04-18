<template>
  <GridCell :span="span">
    <div
      class="h-full rounded-lg overflow-hidden"
      :class="cellClasses"
      :style="cellStyle"
      @click="onClick"
    >
      <slot />
    </div>
  </GridCell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GridCell, { type CellSpan } from '~/components/layout/GridCell.vue'

const props = withDefaults(defineProps<{
  span: CellSpan
  padding?: number
  background?: string
  border?: boolean
  minHeight?: number
  onClick?: () => void
}>(), {
  padding: 16,
  border: true,
})

const cellClasses = computed(() => [
  props.border ? 'border border-gray-200 dark:border-gray-700' : '',
  props.background ? '' : 'bg-white dark:bg-gray-900',
  props.onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : '',
])

const cellStyle = computed(() => {
  const s: Record<string, string> = { padding: `${props.padding}px` }
  if (props.background) s.background = props.background
  if (props.minHeight) s.minHeight = `${props.minHeight}px`
  return s
})
</script>
