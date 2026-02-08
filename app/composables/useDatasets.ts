import {z} from 'zod'
import {
    type DatasetInfo,
    DatasetInfoSchema,
    type QueryResponse,
    QueryResponseSchema,
    type SampleResponse,
    SampleResponseSchema
} from '~/types/schemas'

export function useDatasets() {
    const {get, post} = useApi()
    const datasets = ref<DatasetInfo[]>([])
    const currentDataset = ref<DatasetInfo | null>(null)
    const samples = ref<SampleResponse | null>(null)
    const queryResult = ref<QueryResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchDatasets() {
        loading.value = true
        error.value = null
        try {
            datasets.value = await get('/datasets', z.array(DatasetInfoSchema))
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch datasets'
        } finally {
            loading.value = false
        }
    }

    async function fetchDataset(schema: string) {
        loading.value = true
        error.value = null
        try {
            currentDataset.value = await get(`/datasets/${schema}`, DatasetInfoSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch dataset'
        } finally {
            loading.value = false
        }
    }

    async function fetchSamples(schema: string, options?: { limit?: number; table?: string }) {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (options?.limit) params.set('limit', options.limit.toString())
            if (options?.table) params.set('table', options.table)
            const query = params.toString() ? `?${params.toString()}` : ''
            samples.value = await get(`/datasets/${schema}/samples${query}`, SampleResponseSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch samples'
        } finally {
            loading.value = false
        }
    }

    async function executeQuery(schema: string, query: string) {
        loading.value = true
        error.value = null
        try {
            queryResult.value = await post(
                `/datasets/${schema}/query`,
                {query},
                QueryResponseSchema
            )
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to execute query'
        } finally {
            loading.value = false
        }
    }

    return {
        datasets,
        currentDataset,
        samples,
        queryResult,
        loading,
        error,
        fetchDatasets,
        fetchDataset,
        fetchSamples,
        executeQuery
    }
}
