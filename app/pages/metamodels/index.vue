<template>
  <div class="metamodels-page">
    <Card class="shadow-sm">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Metamodels</span>
          <Button
            icon="pi pi-refresh"
            text
            rounded
            :loading="loading"
            @click="fetchMetamodels"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="metamodels"
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
              <i class="pi pi-sitemap text-4xl mb-3" />
              <p>No metamodels found</p>
              <NuxtLink to="/import">
                <Button label="Import Data" icon="pi pi-upload" class="mt-3" />
              </NuxtLink>
            </div>
          </template>

          <Column field="schemaName" header="Schema" sortable>
            <template #body="{ data }">
              <NuxtLink
                :to="`/metamodels/${data.schemaName}`"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                {{ data.schemaName }}
              </NuxtLink>
            </template>
          </Column>

          <Column header="Entities" sortable>
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="(_, name) in Object.entries(data.modelSpace?.roots || {}).slice(0, 4)"
                  :key="name"
                  :value="name"
                  severity="info"
                />
                <Tag
                  v-if="Object.keys(data.modelSpace?.roots || {}).length > 4"
                  :value="`+${Object.keys(data.modelSpace?.roots || {}).length - 4} more`"
                  severity="secondary"
                />
              </div>
            </template>
          </Column>

          <Column field="createdAt" header="Created" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column field="updatedAt" header="Updated" sortable>
            <template #body="{ data }">
              {{ formatDate(data.updatedAt) }}
            </template>
          </Column>

          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <NuxtLink :to="`/metamodels/${data.schemaName}`">
                <Button
                  v-tooltip.top="'View'"
                  icon="pi pi-eye"
                  text
                  rounded
                  size="small"
                />
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
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const { metamodels, loading, fetchMetamodels } = useMetamodels()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

onMounted(() => {
  fetchMetamodels()
})
</script>
