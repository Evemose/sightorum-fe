<template>
  <div :style="{ height: `${size}px` }" aria-hidden="true" />
</template>

<script setup lang="ts">
defineProps<{ size: number }>()
</script>
