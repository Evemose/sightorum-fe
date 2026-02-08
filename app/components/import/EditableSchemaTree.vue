<template>
  <div class="editable-schema-tree">
    <BaseSchemaTree :detected-schema="detectedSchema">
      <template #root-content="{ rootName, root }">
        <EditableAttributeNode
          v-for="(attr, attrName) in root.attributes"
          :key="attrName"
          :attribute="attr"
          :attribute-name="String(attrName)"
          :root-name="String(rootName)"
          :path="String(attrName)"
          :current-id-attribute="root.idColumn.attributeName"
          :available-roots="Object.keys(detectedSchema.roots)"
          :current-overrides="overrides[String(rootName)] || []"
          :hierarchical="hierarchical"
          :depth="0"
          @update:override="handleOverrideUpdate"
          @promote-to-id="handlePromoteToId"
        />
      </template>

      <template #root-footer="{ rootName }">
        <!-- Flat mode: Add Composite Button -->
        <div v-if="!hierarchical" class="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
          <Button
            label="Add Composite Attribute"
            icon="pi pi-plus"
            size="small"
            text
            @click="showAddCompositeDialog(String(rootName))"
          />
        </div>

        <!-- Hierarchical mode: Force Separate Root Button -->
        <div v-if="hierarchical" class="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
          <Button
            label="Force Separate Root"
            icon="pi pi-external-link"
            size="small"
            text
            @click="showForceSeparateRootDialog(String(rootName))"
          />
        </div>
      </template>
    </BaseSchemaTree>

    <!-- Add Composite Dialog (flat mode) -->
    <Dialog
      v-model:visible="addCompositeDialogVisible"
      modal
      header="Add Composite Attribute"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Attribute Name</label>
          <InputText
            v-model="newCompositeName"
            class="w-full"
            placeholder="Enter attribute name"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Select Attributes to Group</label>
          <div class="border border-surface-300 dark:border-surface-600 rounded p-3 max-h-64 overflow-y-auto">
            <div
              v-for="attr in availableAttributesForComposite"
              :key="attr.path"
              class="flex items-center gap-2 p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
            >
              <Checkbox
                v-model="selectedAttributesForComposite"
                :value="attr.path"
                :input-id="`attr-${attr.path}`"
              />
              <label :for="`attr-${attr.path}`" class="cursor-pointer flex-1">
                {{ attr.name }}
              </label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="addCompositeDialogVisible = false" />
        <Button
          label="Create"
          :disabled="!newCompositeName || selectedAttributesForComposite.length === 0"
          @click="createComposite"
        />
      </template>
    </Dialog>

    <!-- Force Separate Root Dialog (hierarchical mode) -->
    <Dialog
      v-model:visible="forceSeparateRootDialogVisible"
      modal
      header="Force Separate Root"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Field Path</label>
          <InputText
            v-model="separateRootFieldPath"
            class="w-full"
            placeholder="e.g. items or address.details"
          />
          <small class="text-surface-500">Dot-notation path to the nested object to extract as a separate root</small>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">ID Strategy</label>
          <div class="flex gap-4 mb-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <RadioButton v-model="separateRootIdStrategy" value="UseField" />
              <span class="text-sm">Use Existing Field</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <RadioButton v-model="separateRootIdStrategy" value="AutoGenerate" />
              <span class="text-sm">Auto-Generate</span>
            </label>
          </div>
          <div v-if="separateRootIdStrategy === 'UseField'" class="space-y-2 pl-6">
            <div>
              <label class="block text-xs font-medium mb-1">Field Name</label>
              <InputText v-model="separateRootIdFieldName" placeholder="e.g. id" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Data Type (optional)</label>
              <Select
                v-model="separateRootIdFieldDataType"
                :options="dataTypeOptionsWithEmpty"
                placeholder="Auto-detect"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="forceSeparateRootDialogVisible = false" />
        <Button
          label="Apply"
          :disabled="!separateRootFieldPath || (separateRootIdStrategy === 'UseField' && !separateRootIdFieldName)"
          @click="applyForceSeparateRoot"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { DetectedSchemaResponse, DetectionOverride, SchemaOverride, HierarchicalOverride, SimpleDataType } from '~/types/schemas'
import EditableAttributeNode from './EditableAttributeNode.vue'
import BaseSchemaTree from './BaseSchemaTree.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import RadioButton from 'primevue/radiobutton'

const props = defineProps<{
  detectedSchema: DetectedSchemaResponse
  overrides: Record<string, DetectionOverride[]>
  hierarchical: boolean
}>()

const emit = defineEmits<{
  'update:overrides': [overrides: Record<string, DetectionOverride[]>]
}>()

// --- Flat mode: Add Composite ---
const addCompositeDialogVisible = ref(false)
const newCompositeName = ref('')
const selectedAttributesForComposite = ref<string[]>([])
const currentRootForComposite = ref('')
const availableAttributesForComposite = ref<Array<{ name: string; path: string }>>([])

// --- Hierarchical mode: Force Separate Root ---
const forceSeparateRootDialogVisible = ref(false)
const currentRootForSeparate = ref('')
const separateRootFieldPath = ref('')
const separateRootIdStrategy = ref<'UseField' | 'AutoGenerate'>('AutoGenerate')
const separateRootIdFieldName = ref('')
const separateRootIdFieldDataType = ref<string | null>(null)

const dataTypeOptionsWithEmpty = [null, 'TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIME', 'TIMESTAMP']

function handleOverrideUpdate(payload: { rootName: string; path: string; override: DetectionOverride | null }) {
  const newOverrides = { ...props.overrides }

  if (!newOverrides[payload.rootName]) {
    newOverrides[payload.rootName] = []
  }

  if (payload.override === null) {
    // Remove override
    const rootOverrides = newOverrides[payload.rootName]
    if (rootOverrides) {
      newOverrides[payload.rootName] = rootOverrides.filter(o => {
        if ('attributeName' in o) return o.attributeName !== payload.path
        if ('fieldPath' in o) return o.fieldPath !== payload.path
        return true
      })
    }
  } else {
    // Add or update override
    const rootOverrides = newOverrides[payload.rootName]
    if (rootOverrides) {
      const existingIndex = rootOverrides.findIndex(o => {
        if ('attributeName' in o) return o.attributeName === payload.path
        if ('fieldPath' in o) return o.fieldPath === payload.path
        return false
      })

      if (existingIndex >= 0) {
        rootOverrides[existingIndex] = payload.override
      } else {
        rootOverrides.push(payload.override)
      }
    }
  }

  emit('update:overrides', newOverrides)
}

function handlePromoteToId(payload: { rootName: string; attributeName: string; columnName: string; dataType: SimpleDataType }) {
  const newOverrides = { ...props.overrides }

  if (!newOverrides[payload.rootName]) {
    newOverrides[payload.rootName] = []
  }

  const rootOverrides = newOverrides[payload.rootName]
  if (rootOverrides) {
    rootOverrides.push({
      type: 'Id',
      attributeName: payload.attributeName,
      columnName: payload.columnName,
      dataType: payload.dataType
    })
  }

  emit('update:overrides', newOverrides)
}

// --- Flat mode dialogs ---

function showAddCompositeDialog(rootName: string) {
  currentRootForComposite.value = rootName
  newCompositeName.value = ''
  selectedAttributesForComposite.value = []

  const root = props.detectedSchema.roots[rootName]
  if (root) {
    availableAttributesForComposite.value = Object.entries(root.attributes)
      .filter(([_, attr]) => attr.type === 'Basic')
      .map(([name, _]) => ({ name, path: name }))
  }

  addCompositeDialogVisible.value = true
}

function createComposite() {
  if (!newCompositeName.value || selectedAttributesForComposite.value.length === 0) {
    return
  }

  const newOverrides = { ...props.overrides }

  if (!newOverrides[currentRootForComposite.value]) {
    newOverrides[currentRootForComposite.value] = []
  }

  const rootOverrides = newOverrides[currentRootForComposite.value]
  if (rootOverrides) {
    rootOverrides.push({
      type: 'Composite',
      attributeName: newCompositeName.value,
      subAttributeColumns: selectedAttributesForComposite.value,
      nestedOverrides: []
    })
  }

  emit('update:overrides', newOverrides)
  addCompositeDialogVisible.value = false
}

// --- Hierarchical mode dialogs ---

function showForceSeparateRootDialog(rootName: string) {
  currentRootForSeparate.value = rootName
  separateRootFieldPath.value = ''
  separateRootIdStrategy.value = 'AutoGenerate'
  separateRootIdFieldName.value = ''
  separateRootIdFieldDataType.value = null
  forceSeparateRootDialogVisible.value = true
}

function applyForceSeparateRoot() {
  if (!separateRootFieldPath.value) return
  if (separateRootIdStrategy.value === 'UseField' && !separateRootIdFieldName.value) return

  const newOverrides = { ...props.overrides }
  const rootName = currentRootForSeparate.value

  if (!newOverrides[rootName]) {
    newOverrides[rootName] = []
  }

  const override: HierarchicalOverride = {
    type: 'ForceSeparateRoot',
    fieldPath: separateRootFieldPath.value,
    idStrategy: separateRootIdStrategy.value === 'UseField'
      ? {
          type: 'UseField' as const,
          fieldName: separateRootIdFieldName.value,
          ...(separateRootIdFieldDataType.value ? { dataType: separateRootIdFieldDataType.value as SimpleDataType } : {})
        }
      : { type: 'AutoGenerate' as const }
  }

  const rootOverrides = newOverrides[rootName]
  if (rootOverrides) {
    // Replace existing ForceSeparateRoot for the same field path, or add new
    const existingIndex = rootOverrides.findIndex(
      o => 'fieldPath' in o && o.fieldPath === separateRootFieldPath.value
    )
    if (existingIndex >= 0) {
      rootOverrides[existingIndex] = override
    } else {
      rootOverrides.push(override)
    }
  }

  emit('update:overrides', newOverrides)
  forceSeparateRootDialogVisible.value = false
}
</script>

<style scoped>
.editable-schema-tree {
  @apply space-y-4;
}
</style>
