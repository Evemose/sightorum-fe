<template>
  <div class="ml-9 mt-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
    <div class="space-y-3">
      <div class="flex gap-2 flex-wrap">
        <Button label="Basic" size="small" :outlined="editMode !== 'basic'" @click="editMode = 'basic'" />
        <Button label="Collection" size="small" :outlined="editMode !== 'collection'" @click="editMode = 'collection'" />
        <Button label="Singular Ref" size="small" :outlined="editMode !== 'singularRef'" @click="editMode = 'singularRef'" />
        <Button label="Plural Ref" size="small" :outlined="editMode !== 'pluralRef'" @click="editMode = 'pluralRef'" />
      </div>

      <div v-if="editMode === 'basic'">
        <label class="block text-sm font-medium mb-1">Data Type</label>
        <DataTypePicker v-model="editDataType" />
      </div>
      <div v-else-if="editMode === 'collection'" class="space-y-2">
        <div>
          <label class="block text-sm font-medium mb-1">Element Type</label>
          <DataTypePicker v-model="editElementType" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Separator</label>
          <InputText v-model="editSeparator" placeholder="Separator" class="w-full" />
        </div>
      </div>
      <div v-else-if="editMode === 'singularRef' || editMode === 'pluralRef'">
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
          Convert this attribute to a {{ editMode === 'singularRef' ? 'singular' : 'plural' }} reference to another root entity.
        </p>
        <div>
          <label class="block text-sm font-medium mb-1">Target Root</label>
          <Select v-model="editTargetRoot" :options="availableRoots" placeholder="Select target root" class="w-full" />
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
import type { SchemaOverride, SimpleDataType, DetectedAttribute } from '~/types/schemas'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DataTypePicker from './DataTypePicker.vue'

const props = defineProps<{
  attributeName: string
  attribute: DetectedAttribute
  availableRoots: string[]
  currentOverride: SchemaOverride | null
}>()

const emit = defineEmits<{
  apply: [override: SchemaOverride]
  cancel: []
}>()

const editMode = ref<'basic' | 'collection' | 'singularRef' | 'pluralRef'>('basic')
const editDataType = ref<SimpleDataType>('TEXT')
const editElementType = ref<SimpleDataType>('TEXT')
const editSeparator = ref(',')
const editTargetRoot = ref('')

// Initialize edit state from attribute
watchEffect(() => {
  if (props.attribute.type === 'Basic') {
    editMode.value = 'basic'
    editDataType.value = props.attribute.dataType || 'TEXT'
  } else if (props.attribute.type === 'Collection') {
    editMode.value = 'collection'
    editElementType.value = props.attribute.elementType || 'TEXT'
    editSeparator.value = props.attribute.separator || ','
  } else if (props.attribute.type === 'SingularReference') {
    editMode.value = 'singularRef'
    editTargetRoot.value = props.attribute.targetRootName || ''
  } else if (props.attribute.type === 'PluralReference') {
    editMode.value = 'pluralRef'
    editTargetRoot.value = props.attribute.targetRootName || ''
  } else if (props.attribute.type === 'Composite' || props.attribute.type === 'OneToOne') {
    editMode.value = 'pluralRef'
    editTargetRoot.value = props.availableRoots[0] || ''
  }
})

function applyEdit() {
  let override: SchemaOverride | null = null

  if (editMode.value === 'basic') {
    override = { type: 'Basic', attributeName: props.attributeName, dataType: editDataType.value }
  } else if (editMode.value === 'collection') {
    override = {
      type: 'Collection',
      attributeName: props.attributeName,
      separator: editSeparator.value,
      elementType: editElementType.value
    }
  } else if (editMode.value === 'singularRef') {
    override = { type: 'SingularReference', attributeName: props.attributeName, targetRootName: editTargetRoot.value }
  } else if (editMode.value === 'pluralRef') {
    override = { type: 'PluralReference', attributeName: props.attributeName, targetRootName: editTargetRoot.value }
  }

  if (override) {
    emit('apply', override)
  }
}
</script>
