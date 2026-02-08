import type {ZodType} from 'zod'

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public body?: unknown
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public issues: unknown[]
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export function useApi() {
    const config = useRuntimeConfig()
    const baseUrl = config.public.apiBaseUrl as string

    async function request<T>(
        path: string,
        options?: RequestInit,
        schema?: ZodType<T>
    ): Promise<T> {
        const url = `${baseUrl}${path}`
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        })

        if (!response.ok) {
            const body = await response.text().catch(() => null)
            throw new ApiError(
                body || `HTTP error ${response.status}`,
                response.status,
                body
            )
        }

        // 204 No Content - definitely no body
        if (response.status === 204) {
            return undefined as T
        }

        const contentLength = response.headers.get('Content-Length')
        const contentType = response.headers.get('Content-Type')

        // Check if there's actually no content
        if (contentLength === '0' || !contentType?.includes('application/json')) {
            return undefined as T
        }

        const json = await response.json()

        if (schema) {
            const result = schema.safeParse(json)
            if (!result.success) {
                console.error('API response validation failed:', result.error.issues)
                throw new ValidationError(
                    'Invalid API response format',
                    result.error.issues
                )
            }
            return result.data
        }

        return json as T
    }

    async function get<T>(path: string, schema?: ZodType<T>): Promise<T> {
        return request(path, {method: 'GET'}, schema)
    }

    async function post<T>(
        path: string,
        body?: unknown,
        schema?: ZodType<T>
    ): Promise<T> {
        return request(
            path,
            {
                method: 'POST',
                body: body ? JSON.stringify(body) : undefined
            },
            schema
        )
    }

    async function del<T>(path: string, schema?: ZodType<T>): Promise<T> {
        return request(path, {method: 'DELETE'}, schema)
    }

    function createEventSource(path: string): EventSource {
        const url = `${baseUrl}${path}`
        return new EventSource(url)
    }

    return {
        get,
        post,
        del,
        request,
        createEventSource,
        baseUrl
    }
}
