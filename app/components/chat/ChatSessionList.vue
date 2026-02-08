<template>
  <div class="chat-session-list">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-100">Sessions</h2>
      <Button
        icon="pi pi-plus"
        label="New Session"
        size="small"
        @click="showNewSessionDialog = true"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="sessions.length === 0" class="text-center text-surface-500 py-8">
      No sessions yet. Create one to get started.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="p-3 rounded-lg border cursor-pointer transition-colors"
        :class="[
          selectedId === session.id
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
        ]"
        @click="emit('select', session)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Tag :value="session.status" :severity="getStatusSeverity(session.status)" />
            <span class="font-medium text-surface-800 dark:text-surface-100">
              {{ session.schemaName }}
            </span>
          </div>
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click.stop="handleDelete(session)"
          />
        </div>
        <div class="text-xs text-surface-500 mt-1">
          {{ formatDate(session.createdAt) }}
        </div>
      </div>
    </div>

    <!-- New Session Dialog -->
    <Dialog
      v-model:visible="showNewSessionDialog"
      header="Create New Chat Session"
      :style="{ width: '400px' }"
      modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Schema Name
          </label>
          <InputText
            v-model="newSessionSchema"
            class="w-full"
            placeholder="Enter schema name"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          @click="showNewSessionDialog = false"
        />
        <Button
          label="Create"
          :loading="creating"
          @click="handleCreate"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from '~/types/schemas'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'

defineProps<{
  sessions: ChatSession[]
  selectedId?: string
  loading: boolean
}>()

const emit = defineEmits<{
  select: [session: ChatSession]
  create: [schemaName: string]
  delete: [session: ChatSession]
}>()

const showNewSessionDialog = ref(false)
const newSessionSchema = ref('')
const creating = ref(false)

function getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (status) {
    case 'ACTIVE': return 'info'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return 'secondary'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

async function handleCreate() {
  if (!newSessionSchema.value.trim()) return
  creating.value = true
  emit('create', newSessionSchema.value.trim())
  creating.value = false
  showNewSessionDialog.value = false
  newSessionSchema.value = ''
}

function handleDelete(session: ChatSession) {
  emit('delete', session)
}
</script>
