import {useQueryClient} from '@tanstack/vue-query'
import {useToast} from 'primevue/usetoast'
import type {ChunkProcessedEvent, ImportJobResponse, ImportProgressEventData} from '~/types/schemas'
import {ImportErrorEventSchema, ImportJobCompleteEventSchema, ImportProgressEventSchema} from '~/types/schemas'

type WarningsWindowEntry = {
    event: ChunkProcessedEvent;
    ts: Date;
}

type MergedEvent = {
    firstChunkNumber: number;
    lastChunkNumber: number;
    warnings: string[];
}

const IMPORT_WARNINGS_TIME_WINDOW_MS = 10 * 1000 // 10 seconds

/**
 * Composable for handling SSE import progress updates.
 * Connects to /import/jobs/{id}/stream and updates TanStack Query cache.
 */
export function useImportSSE() {
    const queryClient = useQueryClient()
    const toast = useToast()
    const {baseUrl} = useApi()

    const warningsWindowByJobs = shallowRef(new Map<string, WarningsWindowEntry[]>());
    const activeConnections = ref<Map<string, EventSource>>(new Map())
    const progressHistory = reactive(new Map<string, ImportProgressEventData[]>())

    function getMergedEvent(progress: ImportProgressEventData): MergedEvent {
        const jobIdStr = progress.jobId
        const existing = warningsWindowByJobs.value.get(jobIdStr) || []
        const newEntry: WarningsWindowEntry = {
            event: progress.latestEvent as ChunkProcessedEvent,
            ts: new Date()
        }
        const merged = [...existing, newEntry]
            .filter(e => (new Date().getTime() - e.ts.getTime()) <= IMPORT_WARNINGS_TIME_WINDOW_MS)
        warningsWindowByJobs.value.set(jobIdStr, merged)
        return {
            firstChunkNumber: merged[0]!.event.chunkNumber,
            lastChunkNumber: progress.latestEvent.chunkNumber,
            warnings: merged.flatMap(e => e.event.warnings)
        }
    }

    /**
     * Connect to SSE stream for a specific job
     */
    function connectToJob(jobId: string) {
        if (activeConnections.value.has(jobId)) {
            return
        }

        const url = `${baseUrl}/import/jobs/${jobId}/stream`

        try {
            const eventSource = new EventSource(url)
            activeConnections.value.set(jobId, eventSource)

            eventSource.addEventListener('progress', (event) => {
                const parsed = ImportProgressEventSchema.safeParse(JSON.parse(event.data))
                if (parsed.success) {
                    handleProgressEvent(parsed.data)
                }
            })

            eventSource.addEventListener('job_complete', (event) => {
                const parsed = ImportJobCompleteEventSchema.safeParse(JSON.parse(event.data))
                if (parsed.success) {
                    handleJobCompleteEvent(parsed.data)
                    disconnectFromJob(jobId)
                }
            })

            eventSource.addEventListener('error', (event) => {
                if ('data' in event) {
                    const parsed = ImportErrorEventSchema.safeParse(JSON.parse((event as MessageEvent).data))
                    if (parsed.success) {
                        handleErrorEvent(parsed.data)
                        disconnectFromJob(jobId)
                    }
                }
            })

            eventSource.onerror = () => {
                disconnectFromJob(jobId)
                toast.add({
                    severity: 'warn',
                    summary: 'Connection Lost',
                    detail: 'Reconnecting to import progress updates...',
                    life: 3000
                })
                queryClient.invalidateQueries({queryKey: ['importJobs']})
                queryClient.invalidateQueries({queryKey: ['importJob', jobId]})
            }
        } catch (error) {
            console.error('Failed to establish SSE connection:', error)
            throw error
        }
    }

    function disconnectFromJob(jobId: string) {
        const connection = activeConnections.value.get(jobId)
        if (connection) {
            connection.close()
            activeConnections.value.delete(jobId)
        }
    }

    function disconnectAll() {
        activeConnections.value.forEach((connection) => {
            connection.close()
        })
        activeConnections.value.clear()
    }

    function handleProgressEvent(event: ImportProgressEventData) {
        const jobIdStr = event.jobId
        if (!progressHistory.has(jobIdStr)) {
            progressHistory.set(jobIdStr, [])
        }
        progressHistory.get(jobIdStr)!.push(event)

        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'RUNNING',
            processedRows: event.rowsProcessed,
            totalRows: event.totalRows
        }))

        queryClient.setQueryData(['importJob', event.jobId], (old: ImportJobResponse | undefined) => {
            if (!old) return old
            return {
                ...old,
                status: 'RUNNING',
                processedRows: event.rowsProcessed,
                totalRows: event.totalRows
            }
        })

        if (event.latestEvent.type === 'chunk_processed' && event.latestEvent.warnings.length > 0) {
            const mergedEvent = getMergedEvent(event)
            toast.removeGroup(`import-warnings-${event.jobId}`)
            toast.add({
                severity: 'warn',
                summary: 'Import Warnings',
                detail: `Chunk ${mergedEvent.firstChunkNumber} - ${mergedEvent.lastChunkNumber}: ${
                    mergedEvent.warnings.length
                } warning(s)`,
                life: 4000,
                group: `import-warnings-${event.jobId}`
            })
        }

        if (event.latestEvent.type === 'chunk_failed') {
            toast.add({
                severity: 'error',
                summary: 'Chunk Failed',
                detail: `Chunk ${event.latestEvent.chunkNumber}: ${event.latestEvent.errorMessage}`,
                life: 5000
            })
        }
    }

    function handleJobCompleteEvent(event: { jobId: string; totalRows: number }) {
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'COMPLETED',
            processedRows: event.totalRows,
            totalRows: event.totalRows,
            completedAt: new Date().toISOString()
        }))

        toast.add({
            severity: 'success',
            summary: 'Import Complete',
            detail: `Successfully imported ${event.totalRows.toLocaleString()} rows`,
            life: 5000
        })
    }

    function handleErrorEvent(event: { jobId: string; errorMessage: string }) {
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'FAILED',
            errorMessage: event.errorMessage,
            completedAt: new Date().toISOString()
        }))

        toast.add({
            severity: 'error',
            summary: 'Import Failed',
            detail: event.errorMessage,
            life: 7000
        })
    }

    function updateJobInCache(jobId: string, updater: (job: ImportJobResponse) => ImportJobResponse) {
        queryClient.setQueryData(['importJobs'], (old: ImportJobResponse[] | undefined) => {
            if (!old) return old

            const index = old.findIndex(j => j.id === jobId)
            if (index === -1) {
                queryClient.invalidateQueries({queryKey: ['importJobs']})
                return old
            }

            const updated = [...old]
            updated[index] = updater(updated[index]!)
            return updated
        })
    }

    function connectToActiveJobs() {
        const jobs = queryClient.getQueryData<ImportJobResponse[]>(['importJobs'])
        if (jobs) {
            jobs.forEach(job => {
                if (job.status === 'PENDING' || job.status === 'RUNNING') {
                    connectToJob(job.id)
                }
            })
        }
    }

    onUnmounted(() => {
        disconnectAll()
    })

    function getProgressHistory(jobId: string): ImportProgressEventData[] {
        return progressHistory.get(jobId) || []
    }

    function getLatestProgress(jobId: string): ImportProgressEventData | null {
        const history = progressHistory.get(jobId)
        return history && history.length > 0 ? history[history.length - 1] ?? null : null
    }

    function clearProgressHistory(jobId: string) {
        progressHistory.delete(jobId)
    }

    return {
        connectToJob,
        disconnectFromJob,
        disconnectAll,
        connectToActiveJobs,
        getProgressHistory,
        getLatestProgress,
        clearProgressHistory,
        activeConnections: computed(() => Array.from(activeConnections.value.keys())),
        progressHistory
    }
}
