<template>
  <div
    class="fork-connector"
    :style="{
      gridRowStart: Math.min(parentRow, childRow),
      gridRowEnd: Math.max(parentRow, childRow) + 1,
      gridColumn: column
    }"
  >
    <div class="vertical-line" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  parentRow: number
  childRow: number
  column: number
}>()
</script>

<style scoped>
.fork-connector {
  position: relative;
  pointer-events: none;
  z-index: 0;
  display: flex;
  justify-content: center;
}

.vertical-line {
  width: 2px;
  height: 100%;
  background: rgb(148 163 184);
  opacity: 0.45;
}

.dark .vertical-line {
  background: rgb(100 116 139);
}
</style>
