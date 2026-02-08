<template>
  <div class="attribute-node" :style="{ paddingLeft: `${depth * 16}px` }">
    <div
        class="flex items-center gap-2 py-2 px-3 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors group">
      <button v-if="hasChildren" class="w-5 h-5" @click="expanded = !expanded">
        <i :class="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"/>
      </button>
      <div v-else class="w-5"/>

      <i :class="getAttributeIcon()" class="text-sm" :style="{ color: getAttributeColor() }"/>
      <span class="font-medium text-sm">{{ attributeName }}</span>
      <Tag :value="getTypeLabel()" :severity="getSeverity()" class="text-xs"/>

      <div class="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
        <slot name="actions"/>
      </div>
    </div>

    <slot name="detail"/>

    <div v-if="expanded && hasChildren" class="ml-4">
      <slot name="children"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {DetectedAttribute} from '~/types/schemas'
import {formatSimpleDataType} from '~/types/schemas'
import Tag from 'primevue/tag'

const props = defineProps<{
  attribute: DetectedAttribute
  attributeName: string
  rootName: string
  path: string
  depth: number
}>()

const expanded = ref(props.depth < 2)

const hasChildren = computed(() => {
  const attr = props.attribute
  return 'subAttributes' in attr && attr.subAttributes && Object.keys(attr.subAttributes).length > 0
})

function getAttributeIcon() {
  const icons = {
    Basic: 'pi pi-circle-fill',
    Collection: 'pi pi-list',
    SingularReference: 'pi pi-arrow-right',
    PluralReference: 'pi pi-arrows-h',
    Composite: 'pi pi-box',
    OneToOne: 'pi pi-link'
  }
  return icons[props.attribute.type as keyof typeof icons] || 'pi pi-circle'
}

function getAttributeColor() {
  const colors = {
    Basic: '#6366f1',
    Collection: '#8b5cf6',
    SingularReference: '#10b981',
    PluralReference: '#06b6d4',
    Composite: '#f59e0b',
    OneToOne: '#ec4899'
  } as const
  return colors[props.attribute.type] || '#6b7280'
}

function getTypeLabel() {
  if (props.attribute.type === 'Basic' && props.attribute.dataType) {
    return formatSimpleDataType(props.attribute.dataType)
  }
  if (props.attribute.type === 'Collection' && props.attribute.elementType) {
    return `List<${formatSimpleDataType(props.attribute.elementType)}>`
  }
  return props.attribute.type
}

function getSeverity() {
  const severities = {
    Basic: 'info',
    Collection: 'secondary',
    SingularReference: 'success',
    PluralReference: 'success',
    Composite: 'warn',
    OneToOne: 'danger'
  }
  return severities[props.attribute.type as keyof typeof severities]
}
</script>
