<template>
  <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
    <div class="flex flex-wrap gap-x-6 gap-y-1">
      <ReceiptChip v-for="item in items" :key="item.label" :label="item.label" :value="item.value" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReceiptChip from './ReceiptChip.vue'
import type { ReceiptItem } from '../types'

defineProps<{ items: ReceiptItem[] }>()
</script>
