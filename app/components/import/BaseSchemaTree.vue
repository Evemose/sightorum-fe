<template>
  <div class="base-schema-tree">
    <div v-for="(root, rootName) in detectedSchema.roots" :key="rootName" class="root-section mb-6">
      <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
        <h3 class="text-lg font-bold mb-3 text-primary-600 dark:text-primary-400">
          {{ rootName }}
        </h3>

        <!-- ID Column -->
        <div class="mb-4 pb-3 border-b border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-2 text-sm">
            <i class="pi pi-key text-amber-500" />
            <span class="font-medium">ID Column:</span>
            <code class="bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
              {{ root.idColumn.attributeName }}
            </code>
            <Tag :value="formatSimpleDataType(root.idColumn.dataType)" severity="secondary" class="text-xs" />
          </div>
        </div>

        <!-- Attributes Tree (slot content) -->
        <div class="space-y-1">
          <slot name="root-content" :root-name="rootName" :root="root" />
        </div>

        <!-- Footer actions (slot content) -->
        <slot name="root-footer" :root-name="rootName" :root="root" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DetectedSchemaResponse } from '~/types/schemas'
import { formatSimpleDataType } from '~/types/schemas'
import Tag from 'primevue/tag'

defineProps<{
  detectedSchema: DetectedSchemaResponse
}>()
</script>

<style scoped>
.base-schema-tree {
  @apply space-y-4;
}

.root-section {
  @apply transition-all;
}
</style>
