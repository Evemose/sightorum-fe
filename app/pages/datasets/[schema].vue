<template>
  <div class="dataset-detail-page">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <NuxtLink to="/datasets" class="text-primary-600 hover:text-primary-700">
        <i class="pi pi-arrow-left mr-2" />
        Back to Datasets
      </NuxtLink>
    </div>

    <!-- Dataset Info -->
    <Card class="shadow-sm mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-database text-2xl text-primary-600" />
            <span>{{ schema }}</span>
          </div>
          <NuxtLink :to="`/datasets/${schema}/query`">
            <Button label="Query" icon="pi pi-search" />
          </NuxtLink>
        </div>
      </template>
      <template #content>
        <div v-if="currentDataset" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ currentDataset.tables.length }}
            </div>
            <div class="text-sm text-surface-500">Tables</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ formatNumber(currentDataset.totalRows) }}
            </div>
            <div class="text-sm text-surface-500">Total Rows</div>
          </div>
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
            <div class="text-3xl font-bold text-surface-800 dark:text-surface-100">
              {{ totalColumns }}
            </div>
            <div class="text-sm text-surface-500">Total Columns</div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tables List -->
    <Card class="shadow-sm mb-6">
      <template #title>Tables</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="table in currentDataset?.tables || []"
            :key="table.tableName"
            class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
            :class="{ 'ring-2 ring-primary-500': selectedTable === table.tableName }"
            @click="selectTable(table.tableName)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-surface-800 dark:text-surface-100">
                {{ table.tableName }}
              </span>
              <Tag :value="`${formatNumber(table.rowCount)} rows`" severity="secondary" />
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="col in table.columns.slice(0, 5)"
                :key="col"
                class="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded"
              >
                {{ col }}
              </span>
              <span
                v-if="table.columns.length > 5"
                class="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded"
              >
                +{{ table.columns.length - 5 }} more
              </span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Samples Table -->
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Sample Data - {{ selectedTable }}</span>
          <div class="flex items-center gap-2">
            <Select
              v-model="sampleLimit"
              :options="limitOptions"
              option-label="label"
              option-value="value"
              class="w-32"
            />
            <Button
              icon="pi pi-refresh"
              text
              rounded
              :loading="loading"
              @click="loadSamples"
            />
          </div>
        </div>
      </template>
      <template #content>
        <DataTable
          v-if="samples"
          :value="samples.rows"
          :loading="loading"
          scrollable
          scroll-height="400px"
          show-gridlines
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center text-surface-500 py-8">
              No data available
            </div>
          </template>

          <Column
            v-for="col in samples.columns"
            :key="col"
            :field="col"
            :header="col"
            style="min-width: 150px"
          >
            <template #body="{ data }">
              <span class="text-sm">{{ formatCellValue(data[col]) }}</span>
            </template>
          </Column>
        </DataTable>

        <div v-else class="text-center text-surface-500 py-8">
          Select a table to view sample data
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const route = useRoute()
const schema = route.params.schema as string

const { currentDataset, samples, loading, fetchDataset, fetchSamples } = useDatasets()

const selectedTable = ref<string>('')
const sampleLimit = ref(100)

const limitOptions = [
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '500 rows', value: 500 },
  { label: '1000 rows', value: 1000 }
]

const totalColumns = computed(() => {
  if (!currentDataset.value) return 0
  return currentDataset.value.tables.reduce((acc, t) => acc + t.columns.length, 0)
})

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

async function selectTable(tableName: string) {
  selectedTable.value = tableName
  await loadSamples()
}

async function loadSamples() {
  if (!selectedTable.value) return
  await fetchSamples(schema, {
    table: selectedTable.value,
    limit: sampleLimit.value
  })
}

watch(sampleLimit, () => {
  if (selectedTable.value) {
    loadSamples()
  }
})

onMounted(async () => {
  await fetchDataset(schema)
  if (currentDataset.value?.tables?.length) {
    selectTable(currentDataset.value.tables[0]!.tableName)
  }
})
</script>
