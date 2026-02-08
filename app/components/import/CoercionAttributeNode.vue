<template>
  <BaseAttributeNode
    :attribute="attribute"
    :attribute-name="attributeName"
    :root-name="rootName"
    :path="path"
    :depth="depth"
  >
    <template #actions>
      <Tag
        v-if="currentConfig"
        :value="currentConfig.strategy.type"
        severity="info"
        class="text-xs"
      />
      <Button
        v-if="canConfigureCoercion"
        v-tooltip.top="currentConfig ? 'Edit Strategy' : 'Configure Strategy'"
        :icon="currentConfig ? 'pi pi-pencil' : 'pi pi-cog'"
        size="small"
        text
        rounded
        @click="startEdit"
      />
      <Button
        v-if="currentConfig"
        v-tooltip.top="'Remove Strategy'"
        icon="pi pi-times"
        size="small"
        text
        rounded
        severity="danger"
        @click="removeConfig"
      />
    </template>

    <template #detail>
      <div v-if="isEditing" class="px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded border border-surface-200 dark:border-surface-700">
        <CoercionStrategyPicker
          v-model="editingStrategy"
          :data-type="attributeDataType"
        />
        <div class="flex gap-2 mt-3 justify-end">
          <Button label="Cancel" size="small" text @click="cancelEdit" />
          <Button label="Apply" size="small" :disabled="!editingStrategy" @click="applyStrategy" />
        </div>
      </div>
    </template>

    <template #children>
      <CoercionAttributeNode
        v-for="(subAttr, subName) in (attribute as any).subAttributes"
        :key="subName"
        :attribute="subAttr"
        :attribute-name="String(subName)"
        :root-name="rootName"
        :path="`${path}.${subName}`"
        :coercion-configs="coercionConfigs"
        :depth="depth + 1"
        @update:config="$emit('update:config', $event)"
      />
    </template>
  </BaseAttributeNode>
</template>

<script setup lang="ts">
import type { DetectedAttribute, CoercionConfig, CoercionStrategy, SimpleDataType } from '~/types/schemas'
import BaseAttributeNode from './BaseAttributeNode.vue'
import CoercionStrategyPicker from './CoercionStrategyPicker.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const props = defineProps<{
  attribute: DetectedAttribute
  attributeName: string
  rootName: string
  path: string
  depth: number
  coercionConfigs: CoercionConfig[]
}>()

const emit = defineEmits<{
  'update:config': [payload: { rootName: string; path: string; config: CoercionConfig | null }]
}>()

const isEditing = ref(false)
const editingStrategy = ref<CoercionStrategy | null>(null)

// Only Basic and Collection attributes can have coercion configs
const canConfigureCoercion = computed(() => {
  return props.attribute.type === 'Basic' || props.attribute.type === 'Collection'
})

// Get the data type for this attribute (for the strategy picker)
const attributeDataType = computed((): SimpleDataType => {
  if (props.attribute.type === 'Basic' && props.attribute.dataType) {
    return props.attribute.dataType
  }
  if (props.attribute.type === 'Collection' && props.attribute.elementType) {
    return props.attribute.elementType
  }
  return 'TEXT' // fallback
})

// Find current config for this attribute path
const currentConfig = computed((): CoercionConfig | null => {
  return props.coercionConfigs.find(
    c => c.rootName === props.rootName && c.attributePath === props.path
  ) || null
})

function startEdit() {
  editingStrategy.value = currentConfig.value?.strategy || null
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editingStrategy.value = null
}

function applyStrategy() {
  if (!editingStrategy.value) return

  const config: CoercionConfig = {
    rootName: props.rootName,
    attributePath: props.path,
    strategy: editingStrategy.value
  }

  emit('update:config', { rootName: props.rootName, path: props.path, config })
  isEditing.value = false
  editingStrategy.value = null
}

function removeConfig() {
  emit('update:config', { rootName: props.rootName, path: props.path, config: null })
}
</script>
