import { z } from 'zod'
import { ResearchResponseSchema, type ResearchResponse } from '~/types/schemas'

export interface StartResearchRequest {
  schemaName: string
  query: string
  mock: boolean
}

export type ResearchStreamEvent =
  | { type: 'node_start'; researchId: string; nodeId: string; nodeType: string }
  | { type: 'tokens'; researchId: string; nodeId: string; text: string }
  | { type: 'node_end'; researchId: string; nodeId: string; nodeType: string; findings: unknown }
  | { type: 'research_complete'; researchId: string }
  | { type: 'research_failed'; researchId: string; error: string }

const NodeStartedSchema = z.object({
  researchId: z.uuid(),
  nodeId: z.string(),
  nodeType: z.string()
})

const TokensSchema = z.object({
  researchId: z.uuid(),
  nodeId: z.string(),
  text: z.string()
})

const NodeFinishedSchema = z.object({
  researchId: z.uuid(),
  nodeId: z.string(),
  nodeType: z.string(),
  findings: z.unknown()
})

const ResearchCompleteSchema = z.object({
  researchId: z.uuid()
})

const ResearchFailedSchema = z.object({
  researchId: z.uuid(),
  error: z.string()
})

export function useResearch() {
  const { get, post, baseUrl } = useApi()
  const researches = ref<ResearchResponse[]>([])
  const currentResearch = ref<ResearchResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchResearches() {
    loading.value = true
    error.value = null
    try {
      researches.value = await get('/research', z.array(ResearchResponseSchema))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch researches'
    } finally {
      loading.value = false
    }
  }

  async function fetchResearch(id: string): Promise<ResearchResponse | null> {
    loading.value = true
    error.value = null
    try {
      const research = await get(`/research/${id}`, ResearchResponseSchema)
      currentResearch.value = research
      const index = researches.value.findIndex(r => r.id === id)
      if (index === -1) {
        researches.value = [research, ...researches.value]
      } else {
        const next = [...researches.value]
        next[index] = research
        researches.value = next
      }
      return research
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch research'
      return null
    } finally {
      loading.value = false
    }
  }

  async function startResearch(request: StartResearchRequest): Promise<ResearchResponse | null> {
    loading.value = true
    error.value = null
    try {
      const created = await post('/research', request, ResearchResponseSchema)
      researches.value = [created, ...researches.value]
      currentResearch.value = created
      return created
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start research'
      return null
    } finally {
      loading.value = false
    }
  }

  function subscribeToResearchUpdates(
    researchId: string,
    onEvent: (event: ResearchStreamEvent) => void
  ): () => void {
    const eventSource = new EventSource(`${baseUrl}/research/${researchId}/stream`)

    eventSource.addEventListener('node_start', (e) => {
      try {
        const parsed = NodeStartedSchema.safeParse(JSON.parse((e as MessageEvent).data))
        if (parsed.success) {
          onEvent({ type: 'node_start', ...parsed.data })
        }
      } catch {
        // Ignore malformed event payload.
      }
    })

    eventSource.addEventListener('tokens', (e) => {
      try {
        const parsed = TokensSchema.safeParse(JSON.parse((e as MessageEvent).data))
        if (parsed.success) {
          onEvent({ type: 'tokens', ...parsed.data })
        }
      } catch {
        // Ignore malformed event payload.
      }
    })

    eventSource.addEventListener('node_end', (e) => {
      try {
        const parsed = NodeFinishedSchema.safeParse(JSON.parse((e as MessageEvent).data))
        if (parsed.success) {
          onEvent({ type: 'node_end', ...parsed.data })
        }
      } catch {
        // Ignore malformed event payload.
      }
    })

    eventSource.addEventListener('research_complete', (e) => {
      try {
        const parsed = ResearchCompleteSchema.safeParse(JSON.parse((e as MessageEvent).data))
        if (parsed.success) {
          onEvent({ type: 'research_complete', ...parsed.data })
        }
      } catch {
        // Ignore malformed event payload.
      }
    })

    eventSource.addEventListener('research_failed', (e) => {
      try {
        const parsed = ResearchFailedSchema.safeParse(JSON.parse((e as MessageEvent).data))
        if (parsed.success) {
          onEvent({ type: 'research_failed', ...parsed.data })
        }
      } catch {
        // Ignore malformed event payload.
      }
    })

    return () => {
      eventSource.close()
    }
  }

  return {
    researches,
    currentResearch,
    loading,
    error,
    fetchResearches,
    fetchResearch,
    startResearch,
    subscribeToResearchUpdates
  }
}
