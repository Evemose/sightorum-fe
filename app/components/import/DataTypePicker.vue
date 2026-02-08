<template>
  <div class="space-y-2">
    <Select
      v-model="baseType"
      :options="typeNameOptions"
      :placeholder="placeholder"
      class="w-full"
    />

    <!-- ENUM values input -->
    <div v-if="baseType === 'ENUM'" class="pl-3 border-l-2 border-primary-300 dark:border-primary-700">
      <label class="block text-xs font-medium mb-1">Enum Values (comma-separated)</label>
      <InputText v-model="enumValuesStr" placeholder="e.g. RED, GREEN, BLUE" class="w-full" />
    </div>

    <!-- LIST element type -->
    <div v-if="baseType === 'LIST'" class="pl-3 border-l-2 border-primary-300 dark:border-primary-700 space-y-2">
      <div>
        <label class="block text-xs font-medium mb-1">Element Type</label>
        <Select v-model="listElementBaseType" :options="elementTypeOptions" placeholder="Select element type" class="w-full" />
      </div>
      <div v-if="listElementBaseType === 'ENUM'">
        <label class="block text-xs font-medium mb-1">Element Enum Values (comma-separated)</label>
        <InputText v-model="listEnumValuesStr" placeholder="e.g. RED, GREEN, BLUE" class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SimpleDataType, SIMPLE_TYPE_NAMES } from '~/types/schemas'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'

const ALL_TYPE_NAMES = [...SIMPLE_TYPE_NAMES, 'ENUM', 'LIST'] as const

const props = withDefaults(defineProps<{
  modelValue: SimpleDataType | null
  nullable?: boolean
  placeholder?: string
}>(), {
  nullable: false,
  placeholder: 'Select data type'
})

const emit = defineEmits<{
  'update:modelValue': [value: SimpleDataType | null]
}>()

// Internal state
const baseType = ref<string | null>(null)
const enumValuesStr = ref('')
const listElementBaseType = ref<string>('TEXT')
const listEnumValuesStr = ref('')

// Options
const typeNameOptions = computed(() =>
  props.nullable ? [null, ...ALL_TYPE_NAMES] : [...ALL_TYPE_NAMES]
)
const elementTypeOptions = [...SIMPLE_TYPE_NAMES, 'ENUM']

// Sync from model value to internal state
let syncing = false

function syncFromModel(val: SimpleDataType | null) {
  if (val === null) {
    baseType.value = null
    enumValuesStr.value = ''
    listElementBaseType.value = 'TEXT'
    listEnumValuesStr.value = ''
    return
  }
  if (typeof val === 'string') {
    baseType.value = val
    if (val !== 'ENUM') enumValuesStr.value = ''
    if (val !== 'LIST') {
      listElementBaseType.value = 'TEXT'
      listEnumValuesStr.value = ''
    }
  } else if (val.type === 'ENUM') {
    baseType.value = 'ENUM'
    enumValuesStr.value = val.values.join(', ')
    listElementBaseType.value = 'TEXT'
    listEnumValuesStr.value = ''
  } else if (val.type === 'LIST') {
    baseType.value = 'LIST'
    enumValuesStr.value = ''
    if (typeof val.elementType === 'string') {
      listElementBaseType.value = val.elementType
      listEnumValuesStr.value = ''
    } else if (val.elementType.type === 'ENUM') {
      listElementBaseType.value = 'ENUM'
      listEnumValuesStr.value = val.elementType.values.join(', ')
    } else {
      listElementBaseType.value = 'TEXT'
      listEnumValuesStr.value = ''
    }
  }
}

// Build SimpleDataType from internal state
function buildValue(): SimpleDataType | null {
  if (baseType.value === null) return null

  if (baseType.value === 'ENUM') {
    const values = enumValuesStr.value.split(',').map(s => s.trim()).filter(Boolean)
    return values.length > 0 ? { type: 'ENUM', values } : 'ENUM'
  }

  if (baseType.value === 'LIST') {
    let elementType: SimpleDataType
    if (listElementBaseType.value === 'ENUM') {
      const values = listEnumValuesStr.value.split(',').map(s => s.trim()).filter(Boolean)
      elementType = values.length > 0 ? { type: 'ENUM', values } : 'ENUM'
    } else {
      elementType = listElementBaseType.value as SimpleDataType
    }
    return { type: 'LIST', elementType }
  }

  return baseType.value as SimpleDataType
}

// Watch external prop changes
watch(() => props.modelValue, (val) => {
  syncing = true
  syncFromModel(val)
  nextTick(() => { syncing = false })
}, { immediate: true })

// Watch internal state changes and emit
watch([baseType, enumValuesStr, listElementBaseType, listEnumValuesStr], () => {
  if (!syncing) {
    emit('update:modelValue', buildValue())
  }
})
</script>
