<template>
  <div class="coercion-config-editor">
    <BaseSchemaTree :detected-schema="detectedSchema">
      <template #root-content="{ rootName, root }">
        <CoercionAttributeNode
          v-for="(attr, attrName) in root.attributes"
          :key="attrName"
          :attribute="attr"
          :attribute-name="String(attrName)"
          :root-name="String(rootName)"
          :path="String(attrName)"
          :coercion-configs="coercionConfigs"
          :depth="0"
          @update:config="handleConfigUpdate"
        />
      </template>

      <template #root-footer="{ rootName }">
        <div class="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
          <div class="text-xs text-surface-500">
            {{ getRootConfigCount(String(rootName)) }} coercion {{ getRootConfigCount(String(rootName)) === 1 ? 'strategy' : 'strategies' }} configured
          </div>
        </div>
      </template>
    </BaseSchemaTree>
  </div>
</template>

<script setup lang="ts">
import type { DetectedSchemaResponse, CoercionConfig } from '~/types/schemas'
import BaseSchemaTree from './BaseSchemaTree.vue'
import CoercionAttributeNode from './CoercionAttributeNode.vue'

const props = defineProps<{
  detectedSchema: DetectedSchemaResponse
  coercionConfigs: CoercionConfig[]
}>()

const emit = defineEmits<{
  'update:configs': [configs: CoercionConfig[]]
}>()

function handleConfigUpdate(payload: { rootName: string; path: string; config: CoercionConfig | null }) {
  let newConfigs = [...props.coercionConfigs]

  if (payload.config === null) {
    // Remove config
    newConfigs = newConfigs.filter(
      c => !(c.rootName === payload.rootName && c.attributePath === payload.path)
    )
  } else {
    // Add or update config
    const existingIndex = newConfigs.findIndex(
      c => c.rootName === payload.rootName && c.attributePath === payload.path
    )

    if (existingIndex >= 0) {
      newConfigs[existingIndex] = payload.config
    } else {
      newConfigs.push(payload.config)
    }
  }

  emit('update:configs', newConfigs)
}

function getRootConfigCount(rootName: string): number {
  return props.coercionConfigs.filter(c => c.rootName === rootName).length
}
</script>

<style scoped>
.coercion-config-editor {
  @apply space-y-4;
}
</style>
