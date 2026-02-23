import {z} from 'zod'
import {
    type DetectedSchemaResponse,
    DetectedSchemaResponseSchema,
    type ImportJobResponse,
    ImportJobResponseSchema,
    ImportProgressEventSchema,
    ImportJobCompleteEventSchema,
    ImportErrorEventSchema,
    type PreviewResponse,
    PreviewResponseSchema,
    type UploadResponse,
    UploadResponseSchema,
    type DetectionOverride,
    type CoercionConfig,
    type ImportProgressEvent
} from '~/types/schemas'

interface DetectSchemaRequest {
    uploadId: string
    listSeparator?: string
}

interface PreviewRequest {
    uploadId: string
    targetSchema: string
    overridesByRoot?: Record<string, DetectionOverride[]>
}

interface StartImportRequest {
    uploadId: string
    targetSchema: string
    chunkSize?: number
    overridesByRoot?: Record<string, DetectionOverride[]>
    coercionConfigs?: CoercionConfig[]
}

export function useImport() {
    const {get, post, baseUrl} = useApi()
    const uploadedFile = ref<UploadResponse | null>(null)
    const detectedSchema = ref<DetectedSchemaResponse | null>(null)
    const preview = ref<PreviewResponse | null>(null)
    const jobs = ref<ImportJobResponse[]>([])
    const currentJob = ref<ImportJobResponse | null>(null)
    const loading = ref(false)
    const uploading = ref(false)
    const error = ref<string | null>(null)

    async function uploadFiles(files: File[]) {
        uploading.value = true
        error.value = null
        try {
            const formData = new FormData()
            files.forEach(file => {
                formData.append('files', file)
            })

            const response = await fetch(`${baseUrl}/import/upload-multiple`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(await response.text() || `Upload failed: ${response.status}`)
            }

            const json = await response.json()
            const parsed = UploadResponseSchema.safeParse(json)
            if (!parsed.success) {
                console.error('Upload response validation failed:', parsed.error.issues)
                throw new Error('Invalid upload response format')
            }
            uploadedFile.value = parsed.data
            return uploadedFile.value
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to upload files'
            return null
        } finally {
            uploading.value = false
        }
    }

    async function detectSchema(request: DetectSchemaRequest) {
        loading.value = true
        error.value = null
        try {
            detectedSchema.value = await post('/import/detect', request, DetectedSchemaResponseSchema)
            return detectedSchema.value
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to detect schema'
            return null
        } finally {
            loading.value = false
        }
    }

    async function previewMetamodel(request: PreviewRequest) {
        loading.value = true
        error.value = null
        try {
            preview.value = await post('/import/preview', request, PreviewResponseSchema)
            return preview.value
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to preview metamodel'
            return null
        } finally {
            loading.value = false
        }
    }

    async function startImport(request: StartImportRequest) {
        loading.value = true
        error.value = null
        try {
            const job = await post('/import/jobs', request, ImportJobResponseSchema)
            jobs.value.push(job)
            currentJob.value = job
            return job
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to start import'
            return null
        } finally {
            loading.value = false
        }
    }

    async function fetchJob(id: string) {
        loading.value = true
        error.value = null
        try {
            currentJob.value = await get(`/import/jobs/${id}`, ImportJobResponseSchema)
            return currentJob.value
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch job'
            return null
        } finally {
            loading.value = false
        }
    }

    async function fetchJobs() {
        loading.value = true
        error.value = null
        try {
            jobs.value = await get('/import/jobs', z.array(ImportJobResponseSchema))
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch jobs'
        } finally {
            loading.value = false
        }
    }

    function subscribeToProgress(jobId: string, onEvent: (event: ImportProgressEvent) => void): () => void {
        const eventSource = new EventSource(`${baseUrl}/import/jobs/${jobId}/stream`)

        // Handle 'progress' events (was chunk)
        eventSource.addEventListener('progress', (e) => {
            try {
                const parsed = ImportProgressEventSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'progress', data: parsed.data })
                } else {
                    console.error('Invalid progress event:', parsed.error.issues)
                }
            } catch {
                console.error('Failed to parse progress event', e.data)
            }
        })

        // Handle 'job_complete' events
        eventSource.addEventListener('job_complete', (e) => {
            try {
                const parsed = ImportJobCompleteEventSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'job_complete', data: parsed.data })
                } else {
                    console.error('Invalid job_complete event:', parsed.error.issues)
                }
            } catch {
                console.error('Failed to parse job_complete event', e.data)
            }
        })

        // Handle 'error' events
        eventSource.addEventListener('error', (e) => {
            // Check if this is a MessageEvent (SSE error event) or a connection error
            if (e instanceof MessageEvent && e.data) {
                try {
                    const parsed = ImportErrorEventSchema.safeParse(JSON.parse(e.data))
                    if (parsed.success) {
                        onEvent({ type: 'error', data: parsed.data })
                    } else {
                        console.error('Invalid error event:', parsed.error.issues)
                    }
                } catch {
                    console.error('Failed to parse error event', e.data)
                }
            } else {
                console.error('SSE connection error')
            }
        })

        return () => eventSource.close()
    }

    function reset() {
        uploadedFile.value = null
        detectedSchema.value = null
        preview.value = null
        currentJob.value = null
        error.value = null
    }

    return {
        uploadedFile,
        detectedSchema,
        preview,
        jobs,
        currentJob,
        loading,
        uploading,
        error,
        uploadFiles,
        detectSchema,
        previewMetamodel,
        startImport,
        fetchJob,
        fetchJobs,
        subscribeToProgress,
        reset
    }
}
