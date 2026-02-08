<template>
  <div class="import-page">
    <!-- Stepper -->
    <Card class="shadow-sm mb-6">
      <template #content>
        <Stepper v-model:value="activeStep" linear>
          <StepList>
            <Step :value="1">Upload File</Step>
            <Step :value="2">Detect Schema</Step>
            <Step :value="3">Review & Import</Step>
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
              <ProgressSpinner style="width: 60px; height: 60px" />
              <p class="mt-4 text-surface-600">Uploading...</p>
            </div>
            <div v-else-if="uploadedFile" class="flex flex-col items-center">
              <i class="pi pi-check-circle text-5xl text-green-500 mb-4" />
              <p class="text-lg font-medium text-surface-800 dark:text-surface-100">
                {{ uploadedFile.fileName }}
              </p>
              <p class="text-sm text-surface-500">
                {{ formatFileSize(uploadedFile.size) }}
              </p>
              <Button
                label="Change File"
                icon="pi pi-refresh"
                text
                class="mt-4"
                @click="resetUpload"
              />
            </div>
            <div v-else class="flex flex-col items-center">
              <i class="pi pi-cloud-upload text-5xl text-surface-400 mb-4" />
              <p class="text-lg text-surface-600 dark:text-surface-300 mb-2">
                Drag and drop your file here
              </p>
              <p class="text-sm text-surface-500 mb-4">or</p>
              <FileUpload
                mode="basic"
                accept=".csv,.json,.xlsx,.xls"
                :maxFileSize="100000000"
                chooseLabel="Choose File"
                @select="handleFileSelect"
              />
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <Button
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              :disabled="!uploadedFile"
              @click="goToStep(2)"
            />
          </div>
        </div>

        <!-- Step 2: Detect Schema -->
        <div v-if="activeStep === 2" class="detect-step">
          <div v-if="loading" class="text-center py-12">
            <ProgressSpinner style="width: 60px; height: 60px" />
            <p class="mt-4 text-surface-600">Detecting schema...</p>
          </div>

          <div v-else-if="detectedSchema" class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
                Detected Entities
              </h3>
              <Tag :value="`${Object.keys(detectedSchema.roots).length} entities`" severity="info" />
            </div>

            <Accordion :multiple="true">
              <AccordionPanel
                v-for="(root, name) in detectedSchema.roots"
                :key="name"
                :value="name"
              >
                <AccordionHeader>
                  <div class="flex items-center gap-3">
                    <i class="pi pi-table text-primary-500" />
                    <span class="font-medium">{{ name }}</span>
                    <Tag
                      :value="`${Object.keys(root.attributes).length} attributes`"
                      severity="secondary"
                      class="ml-auto"
                    />
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <DataTable
                    :value="Object.values(root.attributes)"
                    class="p-datatable-sm"
                  >
                    <Column field="name" header="Attribute" />
                    <Column header="Type">
                      <template #body="{ data }">
                        <Tag :value="getAttributeType(data)" :severity="getTypeSeverity(data)" />
                      </template>
                    </Column>
                    <Column header="Source">
                      <template #body="{ data }">
                        <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
                          {{ data.sourceColumn || '—' }}
                        </code>
                      </template>
                    </Column>
                  </DataTable>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
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
              iconPos="right"
              :disabled="!detectedSchema"
              @click="goToStep(3)"
            />
          </div>
        </div>

        <!-- Step 3: Review & Import -->
        <div v-if="activeStep === 3" class="import-step">
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
                <Slider v-model="chunkSize" :min="100" :max="10000" :step="100" class="flex-1" />
                <span class="w-20 text-right text-surface-600">{{ chunkSize }}</span>
              </div>
            </div>

            <!-- Summary -->
            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <h4 class="font-medium mb-3">Import Summary</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-surface-500">File:</span>
                  <span class="ml-2 font-medium">{{ uploadedFile?.fileName }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Size:</span>
                  <span class="ml-2 font-medium">{{ formatFileSize(uploadedFile?.size || 0) }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Entities:</span>
                  <span class="ml-2 font-medium">{{ Object.keys(detectedSchema?.roots || {}).length }}</span>
                </div>
                <div>
                  <span class="text-surface-500">Target:</span>
                  <span class="ml-2 font-medium">{{ targetSchema || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              severity="secondary"
              @click="goToStep(2)"
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
    <Card v-if="jobs.length > 0" class="shadow-sm mt-6">
      <template #title>Import Jobs</template>
      <template #content>
        <DataTable :value="jobs" class="p-datatable-sm">
          <Column field="targetSchema" header="Schema" />
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getJobStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="Progress">
            <template #body="{ data }">
              <div v-if="data.status === 'RUNNING' && data.totalRows" class="w-full">
                <ProgressBar
                  :value="(data.processedRows || 0) / data.totalRows * 100"
                  :showValue="true"
                />
              </div>
              <span v-else-if="data.status === 'COMPLETED'" class="text-green-600">
                {{ formatNumber(data.processedRows || 0) }} rows
              </span>
              <span v-else-if="data.status === 'FAILED'" class="text-red-600">
                {{ data.errorMessage }}
              </span>
              <span v-else class="text-surface-500">—</span>
            </template>
          </Column>
          <Column header="Started">
            <template #body="{ data }">
              {{ formatDate(data.startedAt) }}
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
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const router = useRouter()

const {
  uploadedFile,
  detectedSchema,
  jobs,
  loading,
  uploading,
  error,
  uploadFile,
  detectSchema,
  startImport,
  fetchJobs,
  reset
} = useImport()

const activeStep = ref(1)
const isDragging = ref(false)
const targetSchema = ref('')
const chunkSize = ref(1000)

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

function getAttributeType(attr: any): string {
  if (attr.dataType) return attr.dataType
  if (attr.elementType) return `${attr.elementType}[]`
  if (attr.targetRootName) return `Ref<${attr.targetRootName}>`
  if (attr.subAttributes) return 'Composite'
  return 'Unknown'
}

function getTypeSeverity(attr: any): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (attr.targetRootName) return 'info'
  if (attr.subAttributes) return 'warn'
  if (attr.elementType) return 'success'
  return 'secondary'
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

async function handleFileSelect(event: any) {
  const file = event.files[0]
  if (file) {
    await uploadFile(file)
  }
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await uploadFile(file)
  }
}

function resetUpload() {
  reset()
  activeStep.value = 1
}

async function goToStep(step: number) {
  if (step === 2 && uploadedFile.value) {
    await detectSchema({
      tempFileId: uploadedFile.value.tempFileId
    })
  }
  activeStep.value = step
}

async function handleStartImport() {
  if (!uploadedFile.value || !targetSchema.value) return

  const job = await startImport({
    tempFileId: uploadedFile.value.tempFileId,
    targetSchema: targetSchema.value,
    chunkSize: chunkSize.value
  })

  if (job) {
    toast.add({
      severity: 'success',
      summary: 'Import Started',
      detail: `Import job ${job.id} has been started`,
      life: 5000
    })
    reset()
    activeStep.value = 1
    targetSchema.value = ''
  }
}

onMounted(() => {
  fetchJobs()
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
