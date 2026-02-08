import {z} from 'zod'
import {type ModelSpaceResponse, ModelSpaceResponseSchema, type RootDTO, RootSchema} from '~/types/schemas'

export function useMetamodels() {
    const {get} = useApi()
    const metamodels = ref<ModelSpaceResponse[]>([])
    const currentMetamodel = ref<ModelSpaceResponse | null>(null)
    const currentRoot = ref<RootDTO | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchMetamodels() {
        loading.value = true
        error.value = null
        try {
            metamodels.value = await get('/metamodels', z.array(ModelSpaceResponseSchema))
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch metamodels'
        } finally {
            loading.value = false
        }
    }

    async function fetchMetamodel(schema: string) {
        loading.value = true
        error.value = null
        try {
            currentMetamodel.value = await get(`/metamodels/${schema}`, ModelSpaceResponseSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch metamodel'
        } finally {
            loading.value = false
        }
    }

    async function fetchRoot(schema: string, name: string) {
        loading.value = true
        error.value = null
        try {
            currentRoot.value = await get(`/metamodels/${schema}/roots/${name}`, RootSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch root'
        } finally {
            loading.value = false
        }
    }

    return {
        metamodels,
        currentMetamodel,
        currentRoot,
        loading,
        error,
        fetchMetamodels,
        fetchMetamodel,
        fetchRoot
    }
}
