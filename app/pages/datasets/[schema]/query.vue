<template>
  <div class="query-page">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <NuxtLink :to="`/datasets/${schema}`" class="text-primary-600 hover:text-primary-700">
        <i class="pi pi-arrow-left mr-2" />
        Back to {{ schema }}
      </NuxtLink>
    </div>

    <!-- Query Editor -->
    <Card class="shadow-sm mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-code text-primary-600" />
          <span>Query Editor</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <Textarea
            v-model="query"
            placeholder="Enter your query... (e.g., SELECT * FROM users WHERE age > 25)"
            rows="5"
            class="w-full font-mono text-sm"
          />
          <div class="flex items-center justify-between">
            <div class="text-sm text-surface-500">
              Press Ctrl+Enter to execute
            </div>
            <Button
              label="Execute"
              icon="pi pi-play"
              :loading="loading"
              @click="handleExecute"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Query Results -->
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Results</span>
          <div v-if="queryResult" class="flex items-center gap-4 text-sm text-surface-500">
            <span>
              <i class="pi pi-table mr-1" />
              {{ formatNumber(queryResult.totalRows) }} rows
            </span>
            <span>
              <i class="pi pi-clock mr-1" />
              {{ queryResult.executionTimeMs }}ms
            </span>
          </div>
        </div>
      </template>
      <template #content>
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-times-circle" />
            <span class="font-medium">Query Error</span>
          </div>
          <pre class="text-sm whitespace-pre-wrap">{{ error }}</pre>
        </div>

        <DataTable
          v-else-if="queryResult"
          :value="queryResult.rows"
          scrollable
          scroll-height="500px"
          show-gridlines
          paginator
          :rows="20"
          :rows-per-page-options="[10, 20, 50, 100]"
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center text-surface-500 py-8">
              No results returned
            </div>
          </template>

          <Column
            v-for="col in queryResult.columns"
            :key="col"
            :field="col"
            :header="col"
            sortable
            style="min-width: 150px"
          >
            <template #body="{ data }">
              <span class="text-sm">{{ formatCellValue(data[col]) }}</span>
            </template>
          </Column>
        </DataTable>

        <div v-else class="text-center text-surface-500 py-12">
          <i class="pi pi-search text-4xl mb-3" />
          <p>Execute a query to see results</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const schema = route.params.schema as string

const { queryResult, loading, error, executeQuery } = useDatasets()

const query = ref('')

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

async function handleExecute() {
  if (!query.value.trim()) return
  await executeQuery(schema, query.value.trim())
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'Enter') {
    handleExecute()
  }
}
</script>
