<template>
  <div class="dashboard">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Stats Cards -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <i class="pi pi-comments text-2xl text-primary-600 dark:text-primary-300" />
            </div>
            <div>
              <div class="text-2xl font-bold text-surface-800 dark:text-surface-100">
                {{ stats.chatSessions }}
              </div>
              <div class="text-sm text-surface-500">Chat Sessions</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <i class="pi pi-database text-2xl text-green-600 dark:text-green-300" />
            </div>
            <div>
              <div class="text-2xl font-bold text-surface-800 dark:text-surface-100">
                {{ stats.datasets }}
              </div>
              <div class="text-sm text-surface-500">Datasets</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <i class="pi pi-upload text-2xl text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <div class="text-2xl font-bold text-surface-800 dark:text-surface-100">
                {{ stats.imports }}
              </div>
              <div class="text-sm text-surface-500">Import Jobs</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <i class="pi pi-sitemap text-2xl text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <div class="text-2xl font-bold text-surface-800 dark:text-surface-100">
                {{ stats.metamodels }}
              </div>
              <div class="text-sm text-surface-500">Metamodels</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="shadow-sm mb-8">
      <template #title>Quick Actions</template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/chat">
            <Button label="New Chat" icon="pi pi-plus" class="w-full" />
          </NuxtLink>
          <NuxtLink to="/import">
            <Button label="Import Data" icon="pi pi-upload" severity="secondary" class="w-full" />
          </NuxtLink>
          <NuxtLink to="/datasets">
            <Button label="Browse Datasets" icon="pi pi-search" severity="secondary" class="w-full" />
          </NuxtLink>
          <NuxtLink to="/metamodels">
            <Button label="View Models" icon="pi pi-sitemap" severity="secondary" class="w-full" />
          </NuxtLink>
        </div>
      </template>
    </Card>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card class="shadow-sm">
        <template #title>Recent Chat Sessions</template>
        <template #content>
          <div v-if="recentSessions.length === 0" class="text-center text-surface-500 py-4">
            No recent sessions
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="session in recentSessions"
              :key="session.id"
              class="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-700"
            >
              <div class="flex items-center gap-3">
                <Tag :value="session.status" :severity="getSessionStatusSeverity(session.status)" />
                <span class="font-medium">{{ session.schemaName }}</span>
              </div>
              <NuxtLink :to="`/chat/${session.id}`">
                <Button icon="pi pi-arrow-right" text rounded size="small" />
              </NuxtLink>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #title>Recent Imports</template>
        <template #content>
          <div v-if="recentJobs.length === 0" class="text-center text-surface-500 py-4">
            No recent imports
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="job in recentJobs"
              :key="job.id"
              class="p-3 rounded-lg bg-surface-50 dark:bg-surface-700"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ job.targetSchema }}</span>
                <Tag :value="job.status" :severity="getJobStatusSeverity(job.status)" />
              </div>
              <ProgressBar
                v-if="job.status === 'RUNNING' && job.totalRows"
                :value="(job.processedRows || 0) / job.totalRows * 100"
                :show-value="false"
                style="height: 6px"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'

const { sessions, fetchSessions } = useChat()
const { jobs, fetchJobs } = useImport()
const { datasets, fetchDatasets } = useDatasets()
const { metamodels, fetchMetamodels } = useMetamodels()

const stats = computed(() => ({
  chatSessions: sessions.value.length,
  datasets: datasets.value.length,
  imports: jobs.value.length,
  metamodels: metamodels.value.length
}))

const recentSessions = computed(() =>
  [...sessions.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
)

const recentJobs = computed(() =>
  [...jobs.value]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5)
)

function getSessionStatusSeverity(status: string) {
  switch (status) {
    case 'ACTIVE': return 'info'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return 'secondary'
  }
}

function getJobStatusSeverity(status: string) {
  switch (status) {
    case 'PENDING': return 'secondary'
    case 'RUNNING': return 'info'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return 'secondary'
  }
}

onMounted(async () => {
  await Promise.all([
    fetchSessions(),
    fetchJobs(),
    fetchDatasets(),
    fetchMetamodels()
  ])
})
</script>
