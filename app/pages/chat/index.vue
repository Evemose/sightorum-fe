<template>
  <section class="space-y-5">
    <header class="rounded-2xl bg-[radial-gradient(120%_140%_at_0%_0%,rgb(251_191_36_/_0.2),transparent_55%),radial-gradient(100%_120%_at_100%_100%,rgb(14_116_144_/_0.18),transparent_58%),linear-gradient(140deg,rgb(15_23_42_/_0.92),rgb(30_41_59_/_0.9))] p-6 text-slate-50 md:p-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-1 text-[0.72rem] uppercase tracking-[0.16em] text-amber-300">Research Hub</p>
          <h2 class="text-[clamp(1.6rem,2vw,2.2rem)] font-bold leading-[1.1]">Map your next inquiry.</h2>
          <p class="mt-2 text-slate-200">Launch runs, track progress, and open the full DAG workspace.</p>
        </div>
        <Button label="New Research" icon="pi pi-plus" size="small" @click="showResearchDialog = true" />
      </div>
    </header>

    <Card>
      <template #content>
        <div v-if="loading" class="flex justify-center py-10">
          <ProgressSpinner style="width: 44px; height: 44px" />
        </div>

        <div v-else-if="researches.length === 0" class="text-center py-12 text-surface-500">
          No research runs yet.
        </div>

        <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="research in researches"
            :key="research.id"
            class="rounded-xl border border-surface-200 bg-white/90 dark:bg-primary-500/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-700 dark:bg-surface-800/70"
          >
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="line-clamp-1 text-sm font-semibold">{{ research.schemaName }}</h3>
              <Tag :value="research.status" :severity="getStatusSeverity(research.status)" />
            </div>
            <p class="mb-1 text-xs text-surface-500">{{ formatDate(research.createdAt) }}</p>
            <p class="mb-4 break-all text-xs text-surface-500">{{ research.id }}</p>
            <Button
              label="Open Workspace"
              icon="pi pi-arrow-right"
              size="small"
              class="w-full"
              @click="openResearch(research.id)"
            />
          </article>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="showResearchDialog"
      header="Start Research"
      :style="{ width: '560px' }"
      modal
    >
      <div class="space-y-4">
        <div>
          <label class="mb-2 block font-medium">Schema Name</label>
          <InputText v-model="newSchemaName" class="w-full" placeholder="e.g. sales_analytics" />
        </div>
        <div>
          <label class="mb-2 block font-medium">Research Query</label>
          <Textarea
            v-model="newQuery"
            rows="6"
            class="w-full"
            placeholder="What would you like to research?"
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" @click="showResearchDialog = false" />
          <Button label="Start Mock" severity="info" icon="pi pi-bolt" @click="handleCreateResearch(true)" />
          <Button
            label="Start Research"
            severity="success"
            icon="pi pi-play"
            :disabled="!canStartResearch"
            @click="handleCreateResearch(false)"
          />
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const router = useRouter()

const {
  researches,
  loading,
  error,
  fetchResearches,
  startResearch,
} = useResearch()

const showResearchDialog = ref(false)
const newSchemaName = ref('')
const newQuery = ref('')

const canStartResearch = computed(() => newSchemaName.value.trim().length > 0 && newQuery.value.trim().length > 0)

function getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return 'secondary'
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

async function openResearch(id: string) {
  await router.push(`/chat/${id}`)
}

async function handleCreateResearch(mock: boolean) {
  if (!canStartResearch.value) return
  const created = await startResearch({
    schemaName: newSchemaName.value.trim(),
    query: newQuery.value.trim(),
    mock,
  })
  if (!created) return

  showResearchDialog.value = false
  newSchemaName.value = ''
  newQuery.value = ''
  toast.add({
    severity: 'success',
    summary: 'Research Started',
    detail: `${created.schemaName} research created`,
    life: 3000,
  })

  await openResearch(created.id)
}

onMounted(fetchResearches)

watch(error, (value) => {
  if (!value) return
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: value,
    life: 5000,
  })
})
</script>
