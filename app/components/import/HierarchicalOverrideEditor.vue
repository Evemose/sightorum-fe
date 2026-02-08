<template>
  <div class="ml-9 mt-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
    <div class="space-y-3">
      <div class="flex gap-2 flex-wrap">
        <Button label="Data Type" size="small" :outlined="editMode !== 'dataType'" @click="editMode = 'dataType'" />
        <Button label="Force Composite" size="small" :outlined="editMode !== 'forceComposite'" @click="editMode = 'forceComposite'" />
        <Button label="Force Separate Root" size="small" :outlined="editMode !== 'forceSeparateRoot'" @click="editMode = 'forceSeparateRoot'" />
        <Button label="Force Reference" size="small" :outlined="editMode !== 'forceReference'" @click="editMode = 'forceReference'" />
        <Button label="Force Basic" size="small" :outlined="editMode !== 'forceBasic'" @click="editMode = 'forceBasic'" />
      </div>

      <!-- DataType tab -->
      <div v-if="editMode === 'dataType'">
        <label class="block text-sm font-medium mb-1">Data Type</label>
        <DataTypePicker v-model="editDataType" />
      </div>

      <!-- ForceComposite tab -->
      <div v-else-if="editMode === 'forceComposite'">
        <p class="text-sm text-surface-600 dark:text-surface-400">
          This will force the field <code class="bg-surface-200 dark:bg-surface-700 px-1.5 py-0.5 rounded text-xs">{{ fieldPath }}</code>
          to be treated as a composite (embedded) attribute instead of a separate root.
        </p>
      </div>

      <!-- ForceSeparateRoot tab -->
      <div v-else-if="editMode === 'forceSeparateRoot'" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">ID Strategy</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <RadioButton v-model="idStrategyType" value="UseField" />
              <span class="text-sm">Use Existing Field</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <RadioButton v-model="idStrategyType" value="AutoGenerate" />
              <span class="text-sm">Auto-Generate</span>
            </label>
          </div>
        </div>

        <div v-if="idStrategyType === 'UseField'" class="space-y-2">
          <div>
            <label class="block text-xs font-medium mb-1">Field Name</label>
            <InputText v-model="idFieldName" placeholder="e.g. id" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Data Type (optional)</label>
            <DataTypePicker v-model="idFieldDataType" :nullable="true" placeholder="Auto-detect" />
          </div>
        </div>
      </div>

      <!-- ForceReference tab -->
      <div v-else-if="editMode === 'forceReference'">
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
          Convert this field to a reference to another root entity.
        </p>
        <div>
          <label class="block text-sm font-medium mb-1">Target Root</label>
          <Select v-model="targetRootName" :options="availableRoots" placeholder="Select target root" class="w-full" />
        </div>
      </div>

      <!-- ForceBasic tab -->
      <div v-else-if="editMode === 'forceBasic'">
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
          Force this field to be treated as a basic (scalar) attribute.
        </p>
        <div>
          <label class="block text-sm font-medium mb-1">Data Type</label>
          <DataTypePicker v-model="forceBasicDataType" />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button label="Cancel" size="small" text @click="emit('cancel')" />
        <Button label="Apply" size="small" @click="applyEdit" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HierarchicalOverride, SimpleDataType, DetectedAttribute } from '~/types/schemas'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import DataTypePicker from './DataTypePicker.vue'

const props = defineProps<{
  fieldPath: string
  attribute: DetectedAttribute
  availableRoots: string[]
  currentOverride: HierarchicalOverride | null
}>()

const emit = defineEmits<{
  apply: [override: HierarchicalOverride]
  cancel: []
}>()

const editMode = ref<'dataType' | 'forceComposite' | 'forceSeparateRoot' | 'forceReference' | 'forceBasic'>('dataType')
const editDataType = ref<SimpleDataType>('TEXT')
const idStrategyType = ref<'UseField' | 'AutoGenerate'>('AutoGenerate')
const idFieldName = ref('')
const idFieldDataType = ref<SimpleDataType | null>(null)
const targetRootName = ref(props.availableRoots[0] || '')
const forceBasicDataType = ref<SimpleDataType>('TEXT')

// Initialize from attribute or existing override
watchEffect(() => {
  if (props.currentOverride) {
    if (props.currentOverride.type === 'DataTypeOverride') {
      editMode.value = 'dataType'
      editDataType.value = props.currentOverride.dataType
    } else if (props.currentOverride.type === 'ForceComposite') {
      editMode.value = 'forceComposite'
    } else if (props.currentOverride.type === 'ForceSeparateRoot') {
      editMode.value = 'forceSeparateRoot'
      if (props.currentOverride.idStrategy.type === 'UseField') {
        idStrategyType.value = 'UseField'
        idFieldName.value = props.currentOverride.idStrategy.fieldName
        idFieldDataType.value = props.currentOverride.idStrategy.dataType ?? null
      } else {
        idStrategyType.value = 'AutoGenerate'
      }
    } else if (props.currentOverride.type === 'ForceReference') {
      editMode.value = 'forceReference'
      targetRootName.value = props.currentOverride.targetRootName
    } else if (props.currentOverride.type === 'ForceBasic') {
      editMode.value = 'forceBasic'
      forceBasicDataType.value = props.currentOverride.dataType
    }
  } else if (props.attribute.type === 'Basic') {
    editMode.value = 'dataType'
    editDataType.value = props.attribute.dataType || 'TEXT'
  } else if (props.attribute.type === 'Composite') {
    editMode.value = 'forceComposite'
  } else if (props.attribute.type === 'Collection') {
    editMode.value = 'forceBasic'
    forceBasicDataType.value = props.attribute.elementType || 'TEXT'
  }
})

function applyEdit() {
  let override: HierarchicalOverride

  if (editMode.value === 'dataType') {
    override = {
      type: 'DataTypeOverride',
      fieldPath: props.fieldPath,
      dataType: editDataType.value
    }
  } else if (editMode.value === 'forceComposite') {
    override = {
      type: 'ForceComposite',
      fieldPath: props.fieldPath
    }
  } else if (editMode.value === 'forceSeparateRoot') {
    override = {
      type: 'ForceSeparateRoot',
      fieldPath: props.fieldPath,
      idStrategy: idStrategyType.value === 'UseField'
        ? {
            type: 'UseField' as const,
            fieldName: idFieldName.value,
            ...(idFieldDataType.value ? { dataType: idFieldDataType.value } : {})
          }
        : { type: 'AutoGenerate' as const }
    }
  } else if (editMode.value === 'forceReference') {
    override = {
      type: 'ForceReference',
      fieldPath: props.fieldPath,
      targetRootName: targetRootName.value
    }
  } else {
    // forceBasic
    override = {
      type: 'ForceBasic',
      fieldPath: props.fieldPath,
      dataType: forceBasicDataType.value
    }
  }

  emit('apply', override)
}
</script>
