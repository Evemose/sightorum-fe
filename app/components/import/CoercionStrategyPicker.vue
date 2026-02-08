<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs font-medium mb-1">Strategy</label>
      <Select
        v-model="strategyType"
        :options="strategyOptions"
        option-group-label="label"
        option-group-children="items"
        placeholder="Select coercion strategy"
        class="w-full"
      />
    </div>

    <!-- USE_DEFAULT: defaultValue input -->
    <div v-if="strategyType === 'USE_DEFAULT'" class="pl-3 border-l-2 border-primary-300 dark:border-primary-700">
      <label class="block text-xs font-medium mb-1">Default Value (optional)</label>
      <InputText v-model="defaultValueStr" placeholder="Enter default value" class="w-full" />
    </div>

    <!-- ROUND: roundingMode select -->
    <div v-if="strategyType === 'ROUND'" class="pl-3 border-l-2 border-primary-300 dark:border-primary-700">
      <label class="block text-xs font-medium mb-1">Rounding Mode</label>
      <Select v-model="roundingMode" :options="[...ROUNDING_MODES]" placeholder="Select rounding mode" class="w-full" />
    </div>

    <!-- CLAMP: minBound and maxBound -->
    <div v-if="strategyType === 'CLAMP'" class="pl-3 border-l-2 border-primary-300 dark:border-primary-700 space-y-2">
      <div>
        <label class="block text-xs font-medium mb-1">Min Bound (optional)</label>
        <InputNumber v-model="minBound" placeholder="No minimum" class="w-full" mode="decimal" :use-grouping="false" />
      </div>
      <div>
        <label class="block text-xs font-medium mb-1">Max Bound (optional)</label>
        <InputNumber v-model="maxBound" placeholder="No maximum" class="w-full" mode="decimal" :use-grouping="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CoercionStrategy, SimpleDataType } from '~/types/schemas'
import { ROUNDING_MODES, isNumericDataType } from '~/types/schemas'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'

const props = defineProps<{
  modelValue: CoercionStrategy | null
  dataType: SimpleDataType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CoercionStrategy | null]
}>()

// Internal state
const strategyType = ref<string | null>(null)
const defaultValueStr = ref('')
const roundingMode = ref<typeof ROUNDING_MODES[number]>('HALF_UP')
const minBound = ref<number | null>(null)
const maxBound = ref<number | null>(null)

// Strategy options grouped by category
const strategyOptions = computed(() => {
  const isNumeric = isNumericDataType(props.dataType)

  const groups = [
    {
      label: 'Generic',
      items: ['SKIP', 'USE_DEFAULT', 'NULL_ON_INVALID', 'THROW_ON_INVALID']
    },
    {
      label: 'Database-Level',
      items: [
        'FORWARD_FILL',
        'BACKWARD_FILL',
        ...(isNumeric ? ['USE_MEAN', 'USE_MEDIAN'] : []),
        'USE_MODE'
      ]
    }
  ]

  if (isNumeric) {
    groups.splice(1, 0, {
      label: 'Numeric',
      items: ['ROUND', 'CLAMP', 'TRUNCATE']
    })
  }

  return groups
})

// Sync from model value to internal state
let syncing = false

function syncFromModel(val: CoercionStrategy | null) {
  if (val === null) {
    strategyType.value = null
    defaultValueStr.value = ''
    roundingMode.value = 'HALF_UP'
    minBound.value = null
    maxBound.value = null
    return
  }

  strategyType.value = val.type

  switch (val.type) {
    case 'USE_DEFAULT':
      defaultValueStr.value = val.defaultValue !== undefined ? String(val.defaultValue) : ''
      break
    case 'ROUND':
      roundingMode.value = val.roundingMode
      break
    case 'CLAMP':
      minBound.value = val.minBound ?? null
      maxBound.value = val.maxBound ?? null
      break
    default:
      // Reset conditional fields for other types
      defaultValueStr.value = ''
      roundingMode.value = 'HALF_UP'
      minBound.value = null
      maxBound.value = null
  }
}

// Build CoercionStrategy from internal state
function buildValue(): CoercionStrategy | null {
  if (strategyType.value === null) return null

  switch (strategyType.value) {
    case 'SKIP':
      return { type: 'SKIP' }
    case 'USE_DEFAULT':
      return {
        type: 'USE_DEFAULT',
        ...(defaultValueStr.value ? { defaultValue: defaultValueStr.value } : {})
      }
    case 'NULL_ON_INVALID':
      return { type: 'NULL_ON_INVALID' }
    case 'THROW_ON_INVALID':
      return { type: 'THROW_ON_INVALID' }
    case 'ROUND':
      return { type: 'ROUND', roundingMode: roundingMode.value }
    case 'CLAMP':
      return {
        type: 'CLAMP',
        ...(minBound.value !== null ? { minBound: minBound.value } : {}),
        ...(maxBound.value !== null ? { maxBound: maxBound.value } : {})
      }
    case 'TRUNCATE':
      return { type: 'TRUNCATE' }
    case 'FORWARD_FILL':
      return { type: 'FORWARD_FILL' }
    case 'BACKWARD_FILL':
      return { type: 'BACKWARD_FILL' }
    case 'USE_MEAN':
      return { type: 'USE_MEAN' }
    case 'USE_MEDIAN':
      return { type: 'USE_MEDIAN' }
    case 'USE_MODE':
      return { type: 'USE_MODE' }
    default:
      return null
  }
}

// Watch external prop changes
watch(() => props.modelValue, (val) => {
  syncing = true
  syncFromModel(val)
  nextTick(() => { syncing = false })
}, { immediate: true })

// Watch internal state changes and emit
watch([strategyType, defaultValueStr, roundingMode, minBound, maxBound], () => {
  if (!syncing) {
    emit('update:modelValue', buildValue())
  }
})
</script>
