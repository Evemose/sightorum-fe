<template>
  <BaseAttributeNode
    :attribute="attribute"
    :attribute-name="attributeName"
    :root-name="rootName"
    :path="path"
    :depth="depth"
  >
    <template #actions>
      <Button
        v-if="canPromoteToId && !hierarchical"
        v-tooltip.top="'Promote to ID'"
        icon="pi pi-key"
        size="small"
        text
        rounded
        @click="promoteToId"
      />
      <Button
        v-tooltip.top="'Edit'"
        icon="pi pi-pencil"
        size="small"
        text
        rounded
        @click="startEdit"
      />
    </template>

    <template #detail>
      <FlatOverrideEditor
        v-if="isEditing && !hierarchical"
        :attribute-name="attributeName"
        :attribute="attribute"
        :available-roots="availableRoots"
        :current-override="currentFlatOverride"
        @apply="applyFlatOverride"
        @cancel="cancelEdit"
      />

      <HierarchicalOverrideEditor
        v-if="isEditing && hierarchical"
        :field-path="path"
        :attribute="attribute"
        :available-roots="availableRoots"
        :current-override="currentHierarchicalOverride"
        @apply="applyHierarchicalOverride"
        @cancel="cancelEdit"
      />
    </template>

    <template #children>
      <EditableAttributeNode
        v-for="(subAttr, subName) in (attribute as any).subAttributes"
        :key="subName"
        :attribute="subAttr"
        :attribute-name="String(subName)"
        :root-name="rootName"
        :path="`${path}.${subName}`"
        :current-id-attribute="currentIdAttribute"
        :available-roots="availableRoots"
        :current-overrides="currentOverrides"
        :hierarchical="hierarchical"
        :depth="depth + 1"
        @update:override="$emit('update:override', $event)"
        @promote-to-id="$emit('promote-to-id', $event)"
      />
    </template>
  </BaseAttributeNode>
</template>

<script setup lang="ts">
import type {
  DetectedAttribute,
  DetectionOverride,
  HierarchicalOverride,
  SchemaOverride,
  SimpleDataType
} from '~/types/schemas'
import Button from 'primevue/button'
import BaseAttributeNode from './BaseAttributeNode.vue'
import FlatOverrideEditor from './FlatOverrideEditor.vue'
import HierarchicalOverrideEditor from './HierarchicalOverrideEditor.vue'

const props = defineProps<{
  attribute: DetectedAttribute
  attributeName: string
  rootName: string
  path: string
  currentIdAttribute: string
  availableRoots: string[]
  currentOverrides: DetectionOverride[]
  hierarchical: boolean
  depth: number
}>()

const emit = defineEmits<{
  'update:override': [payload: { rootName: string; path: string; override: DetectionOverride | null }]
  'promote-to-id': [payload: { rootName: string; attributeName: string; columnName: string; dataType: SimpleDataType }]
}>()

const isEditing = ref(false)

// Find current flat override for this attribute path
const currentFlatOverride = computed((): SchemaOverride | null => {
  if (props.hierarchical) return null
  const found = props.currentOverrides.find(o => 'attributeName' in o && o.attributeName === props.path)
  return (found && 'attributeName' in found) ? found as SchemaOverride : null
})

// Find current hierarchical override for this field path
const currentHierarchicalOverride = computed((): HierarchicalOverride | null => {
  if (!props.hierarchical) return null
  const found = props.currentOverrides.find(o => 'fieldPath' in o && o.fieldPath === props.path)
  return (found && 'fieldPath' in found) ? found as HierarchicalOverride : null
})

const canPromoteToId = computed(() => props.attribute.type === 'Basic' && props.attributeName !== props.currentIdAttribute)

function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function applyFlatOverride(override: SchemaOverride) {
  emit('update:override', { rootName: props.rootName, path: props.path, override })
  isEditing.value = false
}

function applyHierarchicalOverride(override: HierarchicalOverride) {
  emit('update:override', { rootName: props.rootName, path: props.path, override })
  isEditing.value = false
}

function promoteToId() {
  if (props.attribute.type === 'Basic' && props.attribute.sourceColumn && props.attribute.dataType) {
    emit('promote-to-id', {
      rootName: props.rootName,
      attributeName: props.attributeName,
      columnName: props.attribute.sourceColumn,
      dataType: props.attribute.dataType
    })
  }
}
</script>
