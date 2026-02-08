import {useQueryClient} from '@tanstack/vue-query'
import {useToast} from 'primevue/usetoast'
import type {ImportJobResponse} from '~/types/schemas'
import {
    ImportErrorEventSchema,
    ImportJobCompleteEventSchema,
    ImportStepCompleteEventSchema
} from '~/types/schemas'

/**
 * Composable for handling SSE import progress updates.
 * Connects to /import/jobs/{id}/stream and updates TanStack Query cache.
 */
export function useImportSSE() {
    const queryClient = useQueryClient()
    const toast = useToast()
    const {baseUrl} = useApi()

    const activeConnections = ref<Map<string, EventSource>>(new Map())

    /**
     * Connect to SSE stream for a specific job
     */
    function connectToJob(jobId: string) {
        // Don't create duplicate connections
        if (activeConnections.value.has(jobId)) {
            return
        }

        const url = `${baseUrl}/import/jobs/${jobId}/stream`
        const eventSource = new EventSource(url)

        activeConnections.value.set(jobId, eventSource)

        // Handle step_complete events
        eventSource.addEventListener('step_complete', (event) => {
            const parsed = ImportStepCompleteEventSchema.safeParse(JSON.parse(event.data))
            if (parsed.success) {
                handleStepCompleteEvent(parsed.data)
            } else {
                console.error('Failed to parse step_complete event:', parsed.error)
            }
        })

        // Handle job_complete events
        eventSource.addEventListener('job_complete', (event) => {
            const parsed = ImportJobCompleteEventSchema.safeParse(JSON.parse(event.data))
            if (parsed.success) {
                handleJobCompleteEvent(parsed.data)
                disconnectFromJob(jobId)
            } else {
                console.error('Failed to parse job_complete event:', parsed.error)
            }
        })

        // Handle error events
        eventSource.addEventListener('error_event', (event) => {
            const parsed = ImportErrorEventSchema.safeParse(JSON.parse(event.data))
            if (parsed.success) {
                handleErrorEvent(parsed.data)
                disconnectFromJob(jobId)
            } else {
                console.error('Failed to parse error event:', parsed.error)
            }
        })

        // Handle connection errors
        eventSource.onerror = (error) => {
            console.error('SSE connection error for job', jobId, error)
            disconnectFromJob(jobId)

            // Show toast notification
            toast.add({
                severity: 'warn',
                summary: 'Connection Lost',
                detail: 'Reconnecting to import progress updates...',
                life: 3000
            })

            // Fallback: invalidate queries to trigger polling
            queryClient.invalidateQueries({queryKey: ['importJobs']})
            queryClient.invalidateQueries({queryKey: ['importJob', jobId]})
        }

        console.log('SSE connection established for job:', jobId)
    }

    /**
     * Disconnect from a job's SSE stream
     */
    function disconnectFromJob(jobId: string) {
        const connection = activeConnections.value.get(jobId)
        if (connection) {
            connection.close()
            activeConnections.value.delete(jobId)
            console.log('SSE connection closed for job:', jobId)
        }
    }

    /**
     * Disconnect all active SSE connections
     */
    function disconnectAll() {
        activeConnections.value.forEach((connection, jobId) => {
            connection.close()
            console.log('SSE connection closed for job:', jobId)
        })
        activeConnections.value.clear()
    }

    /**
     * Handle chunk progress event
     */
    function handleChunkEvent(event: {
        jobId: string;
        rootName: string;
        processedRows: number;
        totalRows: number;
        progressPercent: number
    }) {
        // Update the job in the jobs list cache
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'RUNNING',
            processedRows: event.processedRows,
            totalRows: event.totalRows
        }))

        // Also update single job query cache if it exists
        queryClient.setQueryData(['importJob', event.jobId], (old: ImportJobResponse | undefined) => {
            if (!old) return old
            return {
                ...old,
                status: 'RUNNING',
                processedRows: event.processedRows,
                totalRows: event.totalRows
            }
        })
    }

    /**
     * Handle step complete event
     */
    function handleStepCompleteEvent(event: { jobId: string; rootName: string; totalRows: number }) {
        // Update job cache
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'RUNNING'
        }))

        // Show a subtle notification
        toast.add({
            severity: 'info',
            summary: 'Step Complete',
            detail: `Completed importing ${event.rootName} (${event.totalRows.toLocaleString()} rows)`,
            life: 3000
        })
    }

    /**
     * Handle job complete event
     */
    function handleJobCompleteEvent(event: { jobId: string; totalRows: number }) {
        // Update job cache
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'COMPLETED',
            processedRows: event.totalRows,
            totalRows: event.totalRows,
            completedAt: new Date().toISOString()
        }))

        // Show success notification
        toast.add({
            severity: 'success',
            summary: 'Import Complete',
            detail: `Successfully imported ${event.totalRows.toLocaleString()} rows`,
            life: 5000
        })
    }

    /**
     * Handle error event
     */
    function handleErrorEvent(event: { jobId: string; errorMessage: string }) {
        // Update job cache
        updateJobInCache(event.jobId, (job) => ({
            ...job,
            status: 'FAILED',
            errorMessage: event.errorMessage,
            completedAt: new Date().toISOString()
        }))

        // Show error notification
        toast.add({
            severity: 'error',
            summary: 'Import Failed',
            detail: event.errorMessage,
            life: 7000
        })
    }

    /**
     * Update a job in the jobs list cache
     */
    function updateJobInCache(jobId: string, updater: (job: ImportJobResponse) => ImportJobResponse) {
        queryClient.setQueryData(['importJobs'], (old: ImportJobResponse[] | undefined) => {
            if (!old) return old

            const index = old.findIndex(j => j.id === jobId)
            if (index === -1) {
                // Job not in list, invalidate to refetch
                queryClient.invalidateQueries({queryKey: ['importJobs']})
                return old
            }

            const updated = [...old]
            updated[index] = updater(updated[index])
            return updated
        })
    }

    /**
     * Auto-connect to all running jobs
     */
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

    // Cleanup on unmount
    onUnmounted(() => {
        disconnectAll()
    })

    return {
        connectToJob,
        disconnectFromJob,
        disconnectAll,
        connectToActiveJobs,
        activeConnections: computed(() => Array.from(activeConnections.value.keys()))
    }
}
