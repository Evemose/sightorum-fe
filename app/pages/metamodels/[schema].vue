<template>
  <div class="metamodel-detail-page">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <NuxtLink to="/metamodels" class="text-primary-600 hover:text-primary-700">
        <i class="pi pi-arrow-left mr-2" />
        Back to Metamodels
      </NuxtLink>
    </div>

    <!-- Header -->
    <Card class="shadow-sm mb-6">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-sitemap text-2xl text-primary-600" />
          <span>{{ schema }}</span>
        </div>
      </template>
      <template #content>
        <div v-if="currentMetamodel" class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ entityCount }}
            </div>
            <div class="text-sm text-surface-500">Entities</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ totalAttributes }}
            </div>
            <div class="text-sm text-surface-500">Attributes</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ relationshipCount }}
            </div>
            <div class="text-sm text-surface-500">Relationships</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-sm text-surface-500 mb-1">Last Updated</div>
            <div class="font-medium text-surface-800 dark:text-surface-100">
              {{ formatDate(currentMetamodel.updatedAt) }}
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Entity Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        v-for="(root, name) in currentMetamodel?.modelSpace?.roots || {}"
        :key="name"
        class="shadow-sm"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-table text-primary-500" />
              <span>{{ name }}</span>
            </div>
            <Tag :value="`${root.attributes?.length || 0} attrs`" severity="secondary" />
          </div>
        </template>
        <template #subtitle>
          <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
            {{ root.name }}
          </code>
        </template>
        <template #content>
          <!-- ID Attribute -->
          <div v-if="root.idDescriptor?.idAttribute" class="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-key text-primary-500" />
              <span class="font-medium text-primary-700 dark:text-primary-300">
                {{ root.idDescriptor.idAttribute.name }}
              </span>
              <Tag value="ID" severity="warn" class="ml-auto" />
            </div>
            <div class="text-sm text-surface-500">
              {{ root.idDescriptor.idAttribute.dataType['@type'] }}
            </div>
          </div>

          <!-- Attributes -->
          <div class="space-y-2">
            <div
              v-for="attr in root.attributes || []"
              :key="attr.name"
              class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-surface-800 dark:text-surface-100">
                  {{ attr.name }}
                </span>
                <Tag :value="attr['@type']" :severity="getTypeSeverity(attr)" />
              </div>
              <div v-if="'targetRootName' in attr" class="text-xs text-surface-500">
                References: <span class="text-primary-600">{{ attr.targetRootName }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Entity Relationship Diagram (simplified) -->
    <Card v-if="relationships.length > 0" class="shadow-sm mt-6">
      <template #title>Relationships</template>
      <template #content>
        <DataTable :value="relationships" class="p-datatable-sm">
          <Column field="from" header="From Entity" />
          <Column field="attribute" header="Attribute" />
          <Column header="Type">
            <template #body="{ data }">
              <Tag :value="data.type" :severity="data.type === 'Reference' ? 'info' : 'warn'" />
            </template>
          </Column>
          <Column field="to" header="To Entity">
            <template #body="{ data }">
              <NuxtLink
                :to="`#${data.to}`"
                class="text-primary-600 hover:text-primary-700"
              >
                {{ data.to }}
              </NuxtLink>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const schema = route.params.schema as string

const { currentMetamodel, fetchMetamodel } = useMetamodels()

const entityCount = computed(() =>
  Object.keys(currentMetamodel.value?.modelSpace?.roots || {}).length
)

const totalAttributes = computed(() => {
  if (!currentMetamodel.value?.modelSpace?.roots) return 0
  return Object.values(currentMetamodel.value.modelSpace.roots).reduce((acc, root) => {
    return acc + (root.attributes?.length || 0)
  }, 0)
})

interface Relationship {
  from: string
  attribute: string
  type: string
  to: string
}

const relationships = computed<Relationship[]>(() => {
  if (!currentMetamodel.value?.modelSpace?.roots) return []
  const rels: Relationship[] = []

  for (const [rootName, root] of Object.entries(currentMetamodel.value.modelSpace.roots)) {
    for (const attr of root.attributes || []) {
      if ('targetRootName' in attr) {
        rels.push({
          from: rootName,
          attribute: attr.name,
          type: attr['@type'] === 'pluralRef' ? 'Collection' : 'Reference',
          to: attr.targetRootName
        })
      }
    }
  }

  return rels
})

const relationshipCount = computed(() => relationships.value.length)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function getTypeSeverity(attr: { '@type': string }): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (attr['@type'] === 'singularRef' || attr['@type'] === 'pluralRef') return 'info'
  if (attr['@type'] === 'composite') return 'warn'
  if (attr['@type'] === 'collection') return 'success'
  return 'secondary'
}

onMounted(() => {
  fetchMetamodel(schema)
})
</script>
