<template>
  <div class="datasets-page">
    <!-- Datasets Table -->
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Datasets</span>
          <Button
            icon="pi pi-refresh"
            text
            rounded
            :loading="loading"
            @click="fetchDatasets"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="datasets"
          :loading="loading"
          paginator
          :rows="10"
          :rows-per-page-options="[5, 10, 20, 50]"
          striped-rows
          show-gridlines
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center text-surface-500 py-8">
              <i class="pi pi-database text-4xl mb-3" />
              <p>No datasets found</p>
              <NuxtLink to="/import">
                <Button label="Import Data" icon="pi pi-upload" class="mt-3" />
              </NuxtLink>
            </div>
          </template>

          <Column field="schemaName" header="Schema" sortable>
            <template #body="{ data }">
              <NuxtLink
                :to="`/datasets/${data.schemaName}`"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                {{ data.schemaName }}
              </NuxtLink>
            </template>
          </Column>

          <Column header="Tables" sortable>
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="table in data.tables.slice(0, 3)"
                  :key="table.tableName"
                  :value="table.tableName"
                  severity="secondary"
                />
                <Tag
                  v-if="data.tables.length > 3"
                  :value="`+${data.tables.length - 3} more`"
                  severity="info"
                />
              </div>
            </template>
          </Column>

          <Column field="totalRows" header="Total Rows" sortable>
            <template #body="{ data }">
              {{ formatNumber(data.totalRows) }}
            </template>
          </Column>

          <Column header="Actions" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <NuxtLink :to="`/datasets/${data.schemaName}`">
                  <Button
                    v-tooltip.top="'View'"
                    icon="pi pi-eye"
                    text
                    rounded
                    size="small"
                  />
                </NuxtLink>
                <NuxtLink :to="`/datasets/${data.schemaName}/query`">
                  <Button
                    v-tooltip.top="'Query'"
                    icon="pi pi-search"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                  />
                </NuxtLink>
              </div>
            </template>
          </Column>
        </DataTable>
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

const { datasets, loading, fetchDatasets } = useDatasets()

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

onMounted(() => {
  fetchDatasets()
})
</script>
