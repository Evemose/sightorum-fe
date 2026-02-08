import {z} from 'zod'
import {
    type ChatSession,
    ChatSessionSchema,
    type ChatBranch,
    ChatBranchSchema,
    type ChatNode,
    ChatNodeSchema
} from '~/types/schemas'

export interface CreateSessionRequest {
    schemaName: string
}

export interface SendMessageRequest {
    message: string
}

export interface CorrectionRequest {
    beforeNodeId: string  // UUID of the node to insert the correction before
    message: string
}

// Chat tree SSE event types
export type ChatTreeEvent =
    | { type: 'node'; node: ChatNode }
    | { type: 'node-update'; node: ChatNode }
    | { type: 'node-deleted'; nodeId: string }
    | { type: 'status'; sessionId: string; status: string }
    | { type: 'complete' }
    | { type: 'error'; message: string }

// Schema for status update events
const StatusUpdateSchema = z.object({
    sessionId: z.string().uuid(),
    status: z.string()
})

// Schema for node deleted events
const NodeDeletedSchema = z.object({
    nodeId: z.string().uuid()
})

// Schema for stream error events
const StreamErrorSchema = z.object({
    message: z.string()
})

export function useChat() {
    const {get, post, del, baseUrl} = useApi()
    const sessions = ref<ChatSession[]>([])
    const currentSession = ref<ChatSession | null>(null)
    const chatTree = ref<ChatBranch | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchSessions() {
        loading.value = true
        error.value = null
        try {
            sessions.value = await get('/chat/sessions', z.array(ChatSessionSchema))
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch sessions'
        } finally {
            loading.value = false
        }
    }

    async function fetchSession(id: string) {
        loading.value = true
        error.value = null
        try {
            currentSession.value = await get(`/chat/sessions/${id}`, ChatSessionSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch session'
        } finally {
            loading.value = false
        }
    }

    async function createSession(request: CreateSessionRequest): Promise<ChatSession | null> {
        loading.value = true
        error.value = null
        try {
            const session = await post('/chat/sessions', request, ChatSessionSchema)
            sessions.value.push(session)
            return session
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to create session'
            return null
        } finally {
            loading.value = false
        }
    }

    async function deleteSession(id: string) {
        loading.value = true
        error.value = null
        try {
            await del(`/chat/sessions/${id}`)
            sessions.value = sessions.value.filter(s => s.id !== id)
            if (currentSession.value?.id === id) {
                currentSession.value = null
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to delete session'
        } finally {
            loading.value = false
        }
    }

    async function fetchChatTree(sessionId: string) {
        loading.value = true
        error.value = null
        try {
            chatTree.value = await get(`/chat/sessions/${sessionId}/tree`, ChatBranchSchema)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch chat tree'
        } finally {
            loading.value = false
        }
    }

    async function sendMessage(sessionId: string, request: SendMessageRequest) {
        error.value = null
        try {
            await post(`/chat/sessions/${sessionId}/messages`, request)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to send message'
        }
    }

    async function sendCorrection(sessionId: string, request: CorrectionRequest) {
        error.value = null
        try {
            await post(`/chat/sessions/${sessionId}/corrections`, request)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to send correction'
        }
    }

    function subscribeToTreeUpdates(sessionId: string, onEvent: (event: ChatTreeEvent) => void): () => void {
        const eventSource = new EventSource(`${baseUrl}/chat/sessions/${sessionId}/stream`)

        // Handle 'node' events
        eventSource.addEventListener('node', (e) => {
            console.log('SSE node event received:', e.data)
            try {
                const parsed = ChatNodeSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'node', node: parsed.data })
                } else {
                    console.error('Invalid node event schema:', parsed.error.issues)
                    console.error('Raw data:', e.data)
                }
            } catch (err) {
                console.error('Failed to parse node event:', err)
                console.error('Raw data:', e.data)
            }
        })

        // Handle 'node-update' events
        eventSource.addEventListener('node-update', (e) => {
            console.log('SSE node-update event received:', e.data)
            try {
                const parsed = ChatNodeSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'node-update', node: parsed.data })
                } else {
                    console.error('Invalid node-update event schema:', parsed.error.issues)
                    console.error('Raw data:', e.data)
                }
            } catch (err) {
                console.error('Failed to parse node-update event:', err)
                console.error('Raw data:', e.data)
            }
        })

        // Handle 'node-deleted' events
        eventSource.addEventListener('node-deleted', (e) => {
            console.log('SSE node-deleted event received:', e.data)
            try {
                const parsed = NodeDeletedSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'node-deleted', nodeId: parsed.data.nodeId })
                } else {
                    console.error('Invalid node-deleted event schema:', parsed.error.issues)
                    console.error('Raw data:', e.data)
                }
            } catch (err) {
                console.error('Failed to parse node-deleted event:', err)
                console.error('Raw data:', e.data)
            }
        })

        // Handle 'status' events
        eventSource.addEventListener('status', (e) => {
            console.log('SSE status event received:', e.data)
            try {
                const parsed = StatusUpdateSchema.safeParse(JSON.parse(e.data))
                if (parsed.success) {
                    onEvent({ type: 'status', sessionId: parsed.data.sessionId, status: parsed.data.status })
                } else {
                    console.error('Invalid status event schema:', parsed.error.issues)
                    console.error('Raw data:', e.data)
                }
            } catch (err) {
                console.error('Failed to parse status event:', err)
                console.error('Raw data:', e.data)
            }
        })

        // Handle 'complete' events
        eventSource.addEventListener('complete', () => {
            console.log('SSE complete event received')
            onEvent({ type: 'complete' })
        })

        // Handle 'error' events
        eventSource.addEventListener('error', (e) => {
            const event = e as MessageEvent
            console.log('SSE error event received:', event.data)
            try {
                const parsed = StreamErrorSchema.safeParse(JSON.parse(event.data))
                if (parsed.success) {
                    onEvent({ type: 'error', message: parsed.data.message })
                } else {
                    console.error('Invalid error event schema:', parsed.error.issues)
                    console.error('Raw data:', event.data)
                }
            } catch (err) {
                console.error('Failed to parse error event:', err)
                console.error('Raw data:', event.data)
            }
        })

        eventSource.onopen = () => {
            console.log('SSE connection opened for session:', sessionId)
        }

        eventSource.onerror = (err) => {
            console.error('SSE connection error for session:', sessionId, err)
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log('SSE connection closed for session:', sessionId)
            }
        }

        return () => {
            console.log('Closing SSE connection for session:', sessionId)
            eventSource.close()
        }
    }

    function subscribeToCurrentMessage(sessionId: string, onToken: (token: string) => void): () => void {
        const eventSource = new EventSource(`${baseUrl}/chat/sessions/${sessionId}/stream/current`)

        // Handle 'token' events
        eventSource.addEventListener('token', (e) => {
            onToken(e.data)
        })

        eventSource.onerror = () => {
            console.error('SSE connection error')
        }

        return () => eventSource.close()
    }

    return {
        sessions,
        currentSession,
        chatTree,
        loading,
        error,
        fetchSessions,
        fetchSession,
        createSession,
        deleteSession,
        fetchChatTree,
        sendMessage,
        sendCorrection,
        subscribeToTreeUpdates,
        subscribeToCurrentMessage
    }
}
