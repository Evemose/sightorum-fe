<template>
  <div :style="cellStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'

export interface CellSpanBase {
  colStart?: number
  colSpan: number
  rowStart?: number
  rowSpan: number
}

export interface CellSpan extends CellSpanBase {
  md?: Partial<CellSpanBase>
  sm?: Partial<CellSpanBase>
}

const props = defineProps<{
  span: CellSpan
}>()

/** Active breakpoint key injected by Dashboard, or undefined outside one */
const activeBreakpoint = inject<Ref<string | null>>('activeBreakpoint', ref(null))

const resolved = computed((): CellSpanBase => {
  const bp = activeBreakpoint.value
  const override = bp ? (props.span as unknown as Record<string, Partial<CellSpanBase> | undefined>)[bp] : undefined
  return {
    colSpan: override?.colSpan ?? props.span.colSpan,
    rowSpan: override?.rowSpan ?? props.span.rowSpan,
    colStart: override?.colStart ?? props.span.colStart,
    rowStart: override?.rowStart ?? props.span.rowStart,
  }
})

const cellStyle = computed(() => {
  const s = resolved.value
  const style: Record<string, string> = {
    gridColumn: s.colStart
      ? `${s.colStart} / span ${s.colSpan}`
      : `span ${s.colSpan}`,
  }
  if (s.rowStart) {
    style.gridRow = `${s.rowStart} / span ${s.rowSpan}`
  } else {
    style.gridRow = `span ${s.rowSpan}`
  }
  return style
})
</script>
