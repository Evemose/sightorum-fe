<template>
  <div class="import-page">
    <!-- Stepper -->
    <Card class="shadow-sm mb-6">
      <template #content>
        <Stepper v-model:value="activeStep" linear>
          <StepList>
            <Step :value="1">Upload File</Step>
            <Step :value="2">Detect Schema</Step>
            <Step :value="3">Data Handling</Step>
            <Step :value="4">Review & Import</Step>
          </StepList>
        </Stepper>
      </template>
    </Card>

    <!-- Step Content -->
    <Card class="shadow-sm">
      <template #content>
        <!-- Step 1: Upload -->
        <div v-if="activeStep === 1" class="upload-step">
          <div
              class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-12 text-center transition-colors"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/20': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
          >
            <div v-if="uploading" class="flex flex-col items-center">
              <ProgressSpinner style="width: 60px; height: 60px"/>
              <p class="mt-4 text-surface-600">Uploading...</p>
            </div>
            <div v-else-if="uploadedFile" class="flex flex-col items-center">
              <i class="pi pi-check-circle text-5xl text-green-500 mb-4"/>
              <div class="space-y-2 mb-4">
                <div v-for="file in uploadedFile.files" :key="file.originalName" class="text-center">
                  <p class="text-lg font-medium text-surface-800 dark:text-surface-100">
                    {{ file.originalName }}
                  </p>
                  <p class="text-sm text-surface-500">
                    {{ formatFileSize(file.size) }}
                  </p>
                </div>
              </div>
              <Button
                  label="Change Files"
                  icon="pi pi-refresh"
                  text
                  class="mt-4"
                  @click="resetUpload"
              />
            </div>
            <div v-else class="flex flex-col items-center">
              <i class="pi pi-cloud-upload text-5xl text-surface-400 mb-4"/>
              <p class="text-lg text-surface-600 dark:text-surface-300 mb-2">
                Drag and drop your files here
              </p>
              <p class="text-sm text-surface-500 mb-4">or</p>
              <FileUpload
                  mode="basic"
                  accept=".csv,.xlsx,.xls,.json,.yaml,.yml"
                  choose-label="Choose Files"
                  multiple
                  @select="handleFileSelect"
              />
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <Button
                label="Next"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :disabled="!uploadedFile"
                @click="goToStep(2)"
            />
          </div>
        </div>

        <!-- Step 2: Detect Schema -->
        <div v-if="activeStep === 2" class="detect-step">
          <div v-if="isDetecting && !detectedSchema" class="text-center py-12">
            <ProgressSpinner style="width: 60px; height: 60px"/>
            <p class="mt-4 text-surface-600">Detecting schema...</p>
          </div>

          <div v-else-if="detectedSchema" class="space-y-6 relative">
            <!-- Non-blocking loading overlay for re-detection -->
            <div
                v-if="isDetecting"
                class="absolute top-0 right-0 z-10 bg-primary-500/10 backdrop-blur-[1px] rounded px-3 py-1.5 flex items-center gap-2 animate-pulse"
            >
              <i class="pi pi-spin pi-spinner text-primary-600 text-sm"/>
              <span class="text-xs text-primary-700 dark:text-primary-300 font-medium">Updating...</span>
            </div>

            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
                Detected Schema - Edit & Configure
              </h3>
              <div class="flex items-center gap-4">
                <Tag :value="`${Object.keys(detectedSchema.roots).length} entities`" severity="info"/>
              </div>
            </div>

            <EditableSchemaTree
                :detected-schema="detectedSchema"
                :overrides="schemaOverrides"
                :hierarchical="isHierarchical"
                @update:overrides="schemaOverrides = $event"
                @redetect="handleRedetect"
            />
          </div>

          <div class="flex justify-between mt-6">
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="goToStep(1)"
            />
            <Button
                label="Next"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :disabled="!detectedSchema"
                @click="goToStep(3)"
            />
          </div>
        </div>

        <!-- Step 3: Data Handling (Coercion Config) -->
        <div v-if="activeStep === 3" class="coercion-step">
          <div class="space-y-4 mb-6">
            <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
              Configure Data Coercion Strategies
            </h3>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Define how to handle invalid or missing data during import. You can skip this step if default behavior is
              acceptable.
            </p>
          </div>

          <CoercionConfigEditor
              v-if="detectedSchema"
              :detected-schema="detectedSchema"
              :coercion-configs="coercionConfigs"
              @update:configs="coercionConfigs = $event"
          />

          <div class="flex justify-between mt-6">
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="goToStep(2)"
            />
            <div class="flex gap-2">
              <Button
                  label="Skip"
                  severity="secondary"
                  text
                  @click="goToStep(4)"
              />
              <Button
                  label="Next"
                  icon="pi pi-arrow-right"
                  icon-pos="right"
                  @click="goToStep(4)"
              />
            </div>
          </div>
        </div>

        <!-- Step 4: Review & Import -->
        <div v-if="activeStep === 4" class="import-step">
          <div class="space-y-6">
            <!-- Target Schema -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Target Schema Name
              </label>
              <InputText
                  v-model="targetSchema"
                  class="w-full"
                  placeholder="Enter schema name (e.g., my_dataset)"
              />
            </div>

            <!-- Chunk Size -->
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Import Chunk Size
              </label>
              <div class="flex items-center gap-4">
                <Slider v-model="chunkSize" :min="100" :max="10000" :step="100" class="flex-1"/>
                <span class="w-20 text-right text-surface-600">{{ chunkSize }}</span>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <h4 class="font-medium mb-3">Import Summary</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-surface-500">Files:</span>
                  <span class="ml-2 font-medium">{{ uploadedFile?.files.length || 0 }} file(s)</span>
                </div>
                <div>
                  <span class="text-surface-500">Total Size:</span>
                  <span class="ml-2 font-medium">{{
                      formatFileSize(uploadedFile?.files.reduce((sum, f) => sum + f.size, 0) || 0)
                    }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Entities:</span>
                  <span class="ml-2 font-medium">{{ Object.keys(detectedSchema?.roots || {}).length }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Target:</span>
                  <span class="ml-2 font-medium">{{ targetSchema || '—' }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Coercion Strategies:</span>
                  <span class="ml-2 font-medium">{{ coercionConfigs.length }} configured</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="goToStep(3)"
            />
            <Button
                label="Start Import"
                icon="pi pi-upload"
                :loading="loading"
                :disabled="!targetSchema"
                @click="handleStartImport"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Active Import Jobs -->
    <Card v-if="jobs && jobs.length > 0" class="shadow-sm mt-6">
      <template #title>Import Jobs</template>
      <template #content>
        <DataTable :value="jobs" class="p-datatable-sm">
          <Column field="targetSchema" header="Schema" style="width: 20%"/>
          <Column header="Status" style="width: 12%">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getJobStatusSeverity(data.status)"/>
            </template>
          </Column>
          <Column header="Progress" style="width: 35%">
            <template #body="{ data }">
              <div v-if="data.status === 'RUNNING'" class="space-y-2">
                <div class="flex justify-between text-xs text-surface-600 mb-1">
                  <span>{{ formatNumber(data.processedRows || 0) }} / {{
                      formatNumber(data.totalRows || 0)
                    }} rows</span>
                  <span>{{ getLatestProgressPercent(data.id) }}%</span>
                </div>
                <ProgressBar :value="getLatestProgressPercent(data.id)" class="h-2"/>
                <div v-if="getLatestEvent(data.id)" class="text-xs text-surface-500">
                  <span v-if="getLatestEvent(data.id)?.type === 'chunk_processed'">
                    Chunk {{ getLatestEvent(data.id)?.chunkNumber }}:
                    {{ (getLatestEvent(data.id) as ChunkProcessedEvent)?.rowsWritten }} rows written
                    <span
                        v-if="getLatestEvent(data.id)?.warnings && getLatestEvent(data.id)!.warnings.length > 0"
                        class="text-amber-600">
                      ({{ getLatestEvent(data.id)?.warnings.length }} warnings)
                    </span>
                  </span>
                  <span v-else-if="getLatestEvent(data.id)?.type === 'chunk_failed'" class="text-red-600">
                    Chunk {{ getLatestEvent(data.id)?.chunkNumber }} failed:
                    {{ (getLatestEvent(data.id) as ChunkFailedEvent)?.errorMessage }}
                  </span>
                </div>
              </div>
              <span v-else-if="data.status === 'COMPLETED'" class="text-green-600 font-medium">
                {{ formatNumber(data.processedRows || 0) }} rows imported
              </span>
              <span v-else-if="data.status === 'FAILED'" class="text-red-600">
                {{ data.errorMessage }}
              </span>
              <span v-else class="text-surface-500">Pending...</span>
            </template>
          </Column>
          <Column header="Failed" style="width: 10%">
            <template #body="{ data }">
              <span v-if="data.status === 'RUNNING' && getRowsFailed(data.id) > 0" class="text-red-600 font-medium">
                {{ getRowsFailed(data.id) }}
              </span>
              <span v-else class="text-surface-400">—</span>
            </template>
          </Column>
          <Column header="Started" style="width: 15%">
            <template #body="{ data }">
              <span class="text-xs">{{ formatDate(data.startedAt) }}</span>
            </template>
          </Column>
          <Column header="Actions" style="width: 8%">
            <template #body="{ data }">
              <Button
                  v-tooltip.top="'View Details'"
                  icon="pi pi-list"
                  text
                  rounded
                  size="small"
                  @click="showJobDetails(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Job Details Dialog -->
    <Dialog
        v-model:visible="detailsDialogVisible" modal header="Import Job Details" :style="{ width: '900px' }"
        :closable="true">
      <div v-if="selectedJobId" class="space-y-4">
        <div class="bg-surface-50 dark:bg-surface-800 rounded p-4">
          <h4 class="font-semibold mb-2">Job Summary</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-surface-500">Job ID:</span>
              <span class="ml-2 font-mono text-xs">{{ selectedJobId }}</span>
            </div>
            <div>
              <span class="text-surface-500">Total Events:</span>
              <span class="ml-2 font-medium">{{ sseComposable.getProgressHistory(selectedJobId).length }}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold mb-2">Progress Events</h4>
          <VirtualScroller
              :items="sseComposable.getProgressHistory(selectedJobId)"
              :item-size="150"
              class="border border-surface-200 dark:border-surface-700 rounded"
              style="height: 500px">
            <template #item="{ item: event, options: { index } }">
              <div class="p-3 border-b border-surface-200 dark:border-surface-700">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <Tag :value="`Event ${index + 1}`" severity="info" class="text-xs"/>
                    <span class="text-xs text-surface-500">{{ formatTimestamp(event.latestEvent.timestamp) }}</span>
                  </div>
                  <Tag :value="`${event.progressPercent.toFixed(1)}%`"/>
                </div>

                <div class="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span class="text-surface-500">Processed:</span>
                    <span class="ml-1 font-medium">{{ formatNumber(event.rowsProcessed) }}</span>
                  </div>
                  <div>
                    <span class="text-surface-500">Failed:</span>
                    <span
                        class="ml-1 font-medium"
                        :class="event.rowsFailed > 0 ? 'text-red-600' : ''">{{ event.rowsFailed }}</span>
                  </div>
                  <div>
                    <span class="text-surface-500">Total:</span>
                    <span class="ml-1 font-medium">{{ formatNumber(event.totalRows) }}</span>
                  </div>
                </div>

                <div
                    v-if="event.latestEvent.type === 'chunk_processed'"
                    class="bg-green-50 dark:bg-green-900/20 rounded p-2 text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <i class="pi pi-check-circle text-green-600"/>
                    <span class="font-medium">Chunk {{ event.latestEvent.chunkNumber }} Processed</span>
                  </div>
                  <div class="text-surface-600 dark:text-surface-300">
                    {{ event.latestEvent.rowsWritten }} rows written
                  </div>
                  <div v-if="event.latestEvent.warnings.length > 0" class="mt-2 space-y-1">
                    <div class="font-medium text-amber-700">Warnings:</div>
                    <div v-for="(warning, wIdx) in event.latestEvent.warnings" :key="wIdx" class="text-amber-600 pl-4">
                      • {{ warning }}
                    </div>
                  </div>
                </div>

                <div
                    v-else-if="event.latestEvent.type === 'chunk_failed'"
                    class="bg-red-50 dark:bg-red-900/20 rounded p-2 text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <i class="pi pi-times-circle text-red-600"/>
                    <span class="font-medium text-red-600">Chunk {{ event.latestEvent.chunkNumber }} Failed</span>
                  </div>
                  <div class="text-red-700 dark:text-red-400">
                    {{ event.latestEvent.errorMessage }}
                  </div>
                </div>
              </div>
            </template>
          </VirtualScroller>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import FileUpload from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import InputText from 'primevue/inputtext'
import Slider from 'primevue/slider'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import VirtualScroller from 'primevue/virtualscroller'
import {useToast} from 'primevue/usetoast'
import type {
  ChunkFailedEvent,
  ChunkProcessedEvent,
  CoercionConfig,
  DetectionOverride,
  UploadResponse
} from '~/types/schemas'
import EditableSchemaTree from "~/components/import/EditableSchemaTree.vue"
import CoercionConfigEditor from "~/components/import/CoercionConfigEditor.vue"

const toast = useToast()

const {
  uploadFiles,
  uploadFilesMutation,
  detectSchemaMutation,
  startImport,
  startImportMutation,
  useDetectSchemaQuery,
  useImportJobsQuery
} = useImportQuery()

const sseComposable = useImportSSE()
const {connectToJob, connectToActiveJobs} = sseComposable

const activeStep = ref(1)
const isDragging = ref(false)
const targetSchema = ref('')
const chunkSize = ref(1000)
const schemaOverrides = ref<Record<string, DetectionOverride[]>>({})
const coercionConfigs = ref<CoercionConfig[]>([])
const uploadedFile = ref<UploadResponse | null>(null)
const detailsDialogVisible = ref(false)
const selectedJobId = ref<string | null>(null)

// Determine if uploaded files are hierarchical (JSON/YAML)
const isHierarchical = computed(() => {
  if (!uploadedFile.value) return false
  const hierarchicalExts = ['.json', '.yaml', '.yml']
  return uploadedFile.value.files.some(f => {
    const ext = f.originalName.substring(f.originalName.lastIndexOf('.')).toLowerCase()
    return hierarchicalExts.includes(ext)
  })
})

// Clear overrides when format type changes (flat <-> hierarchical)
watch(isHierarchical, () => {
  schemaOverrides.value = {}
})

// Reactive detect schema request
const detectSchemaRequest = computed(() => {
  if (!uploadedFile.value) return null
  return {
    uploadId: uploadedFile.value.uploadId,
    overridesByRoot: Object.keys(schemaOverrides.value).length > 0 ? schemaOverrides.value : undefined
  }
})

// Use query for detected schema - automatically refetches when request changes
const {
  data: detectedSchema,
  isLoading: isDetecting,
} = useDetectSchemaQuery(detectSchemaRequest)

// Use query for jobs list
const {
  data: jobs,
} = useImportJobsQuery()

// Computed for backwards compatibility
const uploading = computed(() => uploadFilesMutation.isPending.value)
const loading = computed(() => detectSchemaMutation.isPending.value || startImportMutation.isPending.value)
const error = computed(() => {
  if (uploadFilesMutation.error.value) return uploadFilesMutation.error.value.message
  if (detectSchemaMutation.error.value) return detectSchemaMutation.error.value.message
  if (startImportMutation.error.value) return startImportMutation.error.value.message
  return null
})

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString()
}

function getJobStatusSeverity(status: string) {
  switch (status) {
    case 'PENDING':
      return 'secondary'
    case 'RUNNING':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return 'secondary'
  }
}

// Access the reactive Map directly - reactive() makes it fully reactive
function getLatestProgressPercent(jobId: string): number {
  const history = sseComposable.progressHistory.get(jobId)
  const latest = history && history.length > 0 ? history[history.length - 1] : null
  return latest ? Math.round(latest.progressPercent) : 0
}

function getRowsFailed(jobId: string): number {
  const history = sseComposable.progressHistory.get(jobId)
  const latest = history && history.length > 0 ? history[history.length - 1] : null
  return latest ? latest.rowsFailed : 0
}

function getLatestEvent(jobId: string) {
  const history = sseComposable.progressHistory.get(jobId)
  const latest = history && history.length > 0 ? history[history.length - 1] : null
  return latest?.latestEvent || null
}

function showJobDetails(jobId: string) {
  selectedJobId.value = jobId
  detailsDialogVisible.value = true
}

async function handleFileSelect(event: { files: File[] }) {
  if (event.files) {
    const result = await uploadFiles(event.files)
    if (result) {
      uploadedFile.value = result
    }
  }
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    const result = await uploadFiles(Array.from(event.dataTransfer.files))
    if (result) {
      uploadedFile.value = result
    }
  }
}

function resetUpload() {
  uploadedFile.value = null
  schemaOverrides.value = {}
  coercionConfigs.value = []
  activeStep.value = 1
}

async function goToStep(step: number) {
  // The query will automatically fetch when uploadedFile is set
  activeStep.value = step
}

async function handleRedetect(newOverrides: Record<string, DetectionOverride[]>) {
  if (!uploadedFile.value) return

  // Update overrides - the query will automatically refetch due to reactive dependency
  schemaOverrides.value = newOverrides

  // Show a subtle toast
  toast.add({
    severity: 'info',
    summary: 'Updating Schema',
    detail: 'Re-detecting schema with your changes...',
    life: 2000
  })
}

async function handleStartImport() {

  if (!uploadedFile.value || !targetSchema.value) {
    return
  }


  let job
  try {
    job = await startImport({
      uploadId: uploadedFile.value.uploadId,
      targetSchema: targetSchema.value,
      chunkSize: chunkSize.value,
      overridesByRoot: Object.keys(schemaOverrides.value).length > 0 ? schemaOverrides.value : undefined,
      coercionConfigs: coercionConfigs.value.length > 0 ? coercionConfigs.value : undefined
    })
  } catch {
    return
  }


  if (job) {
    connectToJob(job.id)

    toast.add({
      severity: 'success',
      summary: 'Import Started',
      detail: `Import job ${job.id} has been started`,
      life: 5000
    })
    // Reset the form
    uploadedFile.value = null
    schemaOverrides.value = {}
    coercionConfigs.value = []
    activeStep.value = 1
    targetSchema.value = ''
  }
}

onMounted(() => {
  setTimeout(() => {
    connectToActiveJobs()
  }, 500)
})

watch(error, (newError) => {
  if (newError) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: newError,
      life: 5000
    })
  }
})
</script>
