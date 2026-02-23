import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import type {
  DetectionOverride,
  CoercionConfig
} from '~/types/schemas'
import {
  DetectedSchemaResponseSchema,
  UploadResponseSchema,
  ImportJobResponseSchema,
  PreviewResponseSchema
} from '~/types/schemas'

export interface DetectSchemaRequest {
  uploadId: string
  listSeparator?: string
  overridesByRoot?: Record<string, DetectionOverride[]>
}

export interface PreviewRequest {
  uploadId: string
  targetSchema: string
  overridesByRoot?: Record<string, DetectionOverride[]>
}

export interface StartImportRequest {
  uploadId: string
  targetSchema: string
  chunkSize?: number
  overridesByRoot?: Record<string, DetectionOverride[]>
  coercionConfigs?: CoercionConfig[]
}

export function useImportQuery() {
  const { post, get, baseUrl } = useApi()
  const queryClient = useQueryClient()

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
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
      return parsed.data
    },
    onSuccess: (data) => {
      // Cache the upload result
      queryClient.setQueryData(['upload', data.uploadId], data)
    }
  })

  // Detect schema query (uses uploadId as key)
  const useDetectSchemaQuery = (request: MaybeRef<DetectSchemaRequest | null>) => {
    return useQuery({
      queryKey: ['detectedSchema', computed(() => {
        const req = toValue(request)
        return req ? {
          uploadId: req.uploadId,
          overrides: req.overridesByRoot || {}
        } : null
      })],
      queryFn: async () => {
        const req = toValue(request)
        if (!req) throw new Error('No request provided')
        return await post('/import/detect', req, DetectedSchemaResponseSchema)
      },
      enabled: computed(() => {
        const req = toValue(request)
        return !!req?.uploadId
      }),
      staleTime: 0, // Always refetch on mount to get latest with overrides
      refetchOnMount: false, // Don't auto-refetch on mount
      refetchOnWindowFocus: false,
    })
  }

  // Detect schema mutation (for manual triggers)
  const detectSchemaMutation = useMutation({
    mutationFn: async (request: DetectSchemaRequest) => {
      return await post('/import/detect', request, DetectedSchemaResponseSchema)
    },
    onSuccess: (data, variables) => {
      // Update the query cache with the new detected schema
      queryClient.setQueryData(['detectedSchema', {
        uploadId: variables.uploadId,
        overrides: variables.overridesByRoot || {}
      }], data)
    }
  })

  // Preview metamodel mutation
  const previewMetamodelMutation = useMutation({
    mutationFn: async (request: PreviewRequest) => {
      return await post('/import/preview', request, PreviewResponseSchema)
    }
  })

  // Start import mutation
  const startImportMutation = useMutation({
    mutationFn: async (request: StartImportRequest) => {
      return await post('/import/jobs', request, ImportJobResponseSchema)
    },
    onSuccess: () => {
      // Invalidate jobs list to refetch
      queryClient.invalidateQueries({ queryKey: ['importJobs'] })
    }
  })

  // Fetch import jobs
  const useImportJobsQuery = () => {
    return useQuery({
      queryKey: ['importJobs'],
      queryFn: async () => {
        return await get('/import/jobs', z.array(ImportJobResponseSchema))
      },
      // No polling - SSE handles real-time updates
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Data stays fresh, SSE updates it
    })
  }

  // Fetch single job
  const useImportJobQuery = (jobId: MaybeRef<string | null>) => {
    return useQuery({
      queryKey: ['importJob', jobId],
      queryFn: async () => {
        const id = toValue(jobId)
        if (!id) throw new Error('No job ID provided')
        return await get(`/import/jobs/${id}`, ImportJobResponseSchema)
      },
      enabled: computed(() => !!toValue(jobId)),
      refetchInterval: (query) => {
        // Poll every 2 seconds if job is running
        const job = query.state.data
        return job && (job.status === 'PENDING' || job.status === 'RUNNING') ? 2000 : false
      }
    })
  }

  return {
    // Mutations
    uploadFiles: uploadFilesMutation.mutateAsync,
    uploadFilesMutation,
    detectSchema: detectSchemaMutation.mutateAsync,
    detectSchemaMutation,
    previewMetamodel: previewMetamodelMutation.mutateAsync,
    previewMetamodelMutation,
    startImport: startImportMutation.mutateAsync,
    startImportMutation,

    // Query hooks
    useDetectSchemaQuery,
    useImportJobsQuery,
    useImportJobQuery,
  }
}
