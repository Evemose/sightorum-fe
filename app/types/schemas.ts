import { z } from 'zod'

// ============================================================================
// Chat Schemas
// ============================================================================

export const ChatSessionSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  schemaName: z.string(),
  parentSessionId: z.uuid().nullable(),
  createdAt: z.iso.datetime()
})

export const ForkPointSchema = z.object({
  afterNodeId: z.uuid(),
  reason: z.string()
})

// ChatNodeDTO is a sealed interface without @JsonTypeInfo
// We detect type based on field presence
export const ChatMessageNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  text: z.string(),
  sender: z.enum(['USER', 'ASSISTANT', 'SYSTEM'])
})

export const ChatToolCallNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  description: z.string(),
  response: z.record(z.string(), z.unknown())
})

export const ChatTrainingQueuedNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  trainingId: z.uuid(),
  modelName: z.string()
})

export const ChatTrainingStartedNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  trainingId: z.uuid()
})

export const ChatTrainingProgressNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  trainingId: z.uuid(),
  progressPercentage: z.number()
})

export const ChatTrainingFinishedNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  trainingId: z.uuid(),
  metrics: z.record(z.string(), z.unknown())
})

export const ChatFailureNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  reason: z.string(),
  errorMessage: z.string()
})

// ResearchStep for AgentSubconclusion
export const ResearchStepSchema = z.object({
  reasoning: z.string(),
  action: z.string(),
  observation: z.string()
})

export const ChatAgentSubconclusionNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  summary: z.string(),
  keyInsight: z.string(),
  details: z.string(),
  researchSteps: z.array(ResearchStepSchema),
  conversationId: z.string()
})

export const ChatForkedNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  forkPointId: z.uuid(),
  reason: z.string(),
  furtherInstructions: z.string()
})

export const ChatTemporaryNodeSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  inProgressContent: z.string()
})

// ChatNodeDTO union - detect type based on unique fields
// Message: text, sender
// ToolCall: description, response
// TrainingQueued: trainingId, modelName (no progressPercentage, no metrics)
// TrainingStarted: trainingId only (no modelName, no progressPercentage, no metrics)
// TrainingProgress: trainingId, progressPercentage (no metrics, no modelName)
// TrainingFinished: trainingId, metrics (no progressPercentage, no modelName)
// Failure: reason, errorMessage
// AgentSubconclusion: summary, details, researchSteps, conversationId
// Forked: forkPointId, reason, furtherInstructions
// Temporary: inProgressContent
export const ChatNodeSchema = z.union([
  ChatMessageNodeSchema,
  ChatToolCallNodeSchema,
  ChatTrainingQueuedNodeSchema,
  ChatTrainingStartedNodeSchema,
  ChatTrainingProgressNodeSchema,
  ChatTrainingFinishedNodeSchema,
  ChatFailureNodeSchema,
  ChatAgentSubconclusionNodeSchema,
  ChatForkedNodeSchema,
  ChatTemporaryNodeSchema
])

// ChatBranchDTO is recursive (children contains ChatBranchDTO[])
type ChatBranchDTO = {
  sessionId: string
  status: string
  forkPoint: { afterNodeId: string; reason: string } | null
  nodes: z.infer<typeof ChatNodeSchema>[]
  children: ChatBranchDTO[]
}

export const ChatBranchSchema: z.ZodType<ChatBranchDTO> = z.lazy(() =>
  z.object({
    sessionId: z.uuid(),
    status: z.string(),
    forkPoint: ForkPointSchema.nullable(),
    nodes: z.array(ChatNodeSchema),
    children: z.array(ChatBranchSchema)
  })
)
// ============================================================================
// Dataset Schemas
// ============================================================================

export const TableInfoSchema = z.object({
  tableName: z.string(),
  rowCount: z.number(),
  columns: z.array(z.string())
})

export const DatasetInfoSchema = z.object({
  schemaName: z.string(),
  tables: z.array(TableInfoSchema),
  totalRows: z.number()
})

export const SampleResponseSchema = z.object({
  schemaName: z.string(),
  tableName: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
  totalRows: z.number()
})

export const QueryResponseSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
  totalRows: z.number(),
  executionTimeMs: z.number()
})

// ============================================================================
// Import Schemas
// ============================================================================

export const FileInfoSchema = z.object({
  originalName: z.string(),
  size: z.number()
})

export const UploadResponseSchema = z.object({
  uploadId: z.string(),
  files: z.array(FileInfoSchema)
})

// SimpleDataType - sealed interface on BE, serialized as string for simple types
// or as object for ENUM (with values) and LIST (with elementType)
export const SIMPLE_TYPE_NAMES = ['TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIME', 'TIMESTAMP'] as const

type SimpleDataTypeDTO =
  | typeof SIMPLE_TYPE_NAMES[number] | 'ENUM' | 'LIST'
  | { type: 'ENUM'; values: string[] }
  | { type: 'LIST'; elementType: SimpleDataTypeDTO }

const EnumDataTypeObjectSchema = z.object({
  type: z.literal('ENUM'),
  values: z.array(z.string())
})

export const SimpleDataTypeSchema: z.ZodType<SimpleDataTypeDTO> = z.lazy(() =>
  z.union([
    z.enum([...SIMPLE_TYPE_NAMES, 'ENUM', 'LIST']),
    EnumDataTypeObjectSchema,
    z.object({
      type: z.literal('LIST'),
      elementType: SimpleDataTypeSchema
    })
  ])
)

export const DetectedIdColumnSchema = z.object({
  attributeName: z.string(),
  columnName: z.string(),
  dataType: SimpleDataTypeSchema
})

// DetectedAttributeDTO uses @JsonTypeInfo(use = SIMPLE_NAME, property = "type")
// Type names are: Basic, Collection, SingularReference, PluralReference, Composite, OneToOne
const DetectedBasicAttributeSchema = z.object({
  type: z.literal('Basic'),
  name: z.string(),
  sourceColumn: z.string(),
  dataType: SimpleDataTypeSchema
})

const DetectedCollectionAttributeSchema = z.object({
  type: z.literal('Collection'),
  name: z.string(),
  sourceColumn: z.string(),
  elementType: SimpleDataTypeSchema,
  separator: z.string()
})

const DetectedSingularReferenceAttributeSchema = z.object({
  type: z.literal('SingularReference'),
  name: z.string(),
  sourceColumn: z.string(),
  targetRootName: z.string(),
  dataType: SimpleDataTypeSchema
})

const DetectedPluralReferenceAttributeSchema = z.object({
  type: z.literal('PluralReference'),
  name: z.string(),
  sourceColumn: z.string(),
  targetRootName: z.string(),
  dataType: SimpleDataTypeSchema
})

// Forward declare for recursive types
type DetectedAttributeDTO =
  | z.infer<typeof DetectedBasicAttributeSchema>
  | z.infer<typeof DetectedCollectionAttributeSchema>
  | z.infer<typeof DetectedSingularReferenceAttributeSchema>
  | z.infer<typeof DetectedPluralReferenceAttributeSchema>
  | { type: 'Composite'; name: string; subAttributes: Record<string, DetectedAttributeDTO> }
  | { type: 'OneToOne'; name: string; targetRootName: string; subAttributes: Record<string, DetectedAttributeDTO> }

export const DetectedAttributeSchema: z.ZodType<DetectedAttributeDTO> = z.lazy(() =>
  z.discriminatedUnion('type', [
    DetectedBasicAttributeSchema,
    DetectedCollectionAttributeSchema,
    DetectedSingularReferenceAttributeSchema,
    DetectedPluralReferenceAttributeSchema,
    z.object({
      type: z.literal('Composite'),
      name: z.string(),
      subAttributes: z.record(z.string(), DetectedAttributeSchema)
    }),
    z.object({
      type: z.literal('OneToOne'),
      name: z.string(),
      targetRootName: z.string(),
      subAttributes: z.record(z.string(), DetectedAttributeSchema)
    })
  ])
)

export const DetectedRootSchema = z.object({
  name: z.string(),
  sourceDataSource: z.string(),
  attributes: z.record(z.string(), DetectedAttributeSchema),
  idColumn: DetectedIdColumnSchema
})

export const DetectedSchemaResponseSchema = z.object({
  roots: z.record(z.string(), DetectedRootSchema)
})

// SchemaOverrideDTO - discriminated union for different override types
export const BasicOverrideSchema = z.object({
  type: z.literal('Basic'),
  attributeName: z.string(),
  dataType: SimpleDataTypeSchema
})

export const CollectionOverrideSchema = z.object({
  type: z.literal('Collection'),
  attributeName: z.string(),
  separator: z.string(),
  elementType: SimpleDataTypeSchema
})

export const IdOverrideSchema = z.object({
  type: z.literal('Id'),
  attributeName: z.string(),
  columnName: z.string(),
  dataType: SimpleDataTypeSchema
})

// Forward declare for recursive nested overrides
type SchemaOverrideDTO =
  | z.infer<typeof BasicOverrideSchema>
  | z.infer<typeof CollectionOverrideSchema>
  | z.infer<typeof IdOverrideSchema>
  | z.infer<typeof SingularReferenceOverrideSchema>
  | z.infer<typeof PluralReferenceOverrideSchema>
  | { type: 'Composite'; attributeName: string; subAttributeColumns: string[]; nestedOverrides: SchemaOverrideDTO[] }
  | { type: 'OneToOneRoot'; attributeName: string; targetRootName: string; subAttributeColumns: string[]; idColumn: string; nestedOverrides: SchemaOverrideDTO[] }

export const SingularReferenceOverrideSchema = z.object({
  type: z.literal('SingularReference'),
  attributeName: z.string(),
  targetRootName: z.string()
})

export const PluralReferenceOverrideSchema = z.object({
  type: z.literal('PluralReference'),
  attributeName: z.string(),
  targetRootName: z.string()
})

export const SchemaOverrideSchema: z.ZodType<SchemaOverrideDTO> = z.lazy(() =>
  z.discriminatedUnion('type', [
    BasicOverrideSchema,
    CollectionOverrideSchema,
    IdOverrideSchema,
    SingularReferenceOverrideSchema,
    PluralReferenceOverrideSchema,
    z.object({
      type: z.literal('Composite'),
      attributeName: z.string(),
      subAttributeColumns: z.array(z.string()),
      nestedOverrides: z.array(SchemaOverrideSchema)
    }),
    z.object({
      type: z.literal('OneToOneRoot'),
      attributeName: z.string(),
      targetRootName: z.string(),
      subAttributeColumns: z.array(z.string()),
      idColumn: z.string(),
      nestedOverrides: z.array(SchemaOverrideSchema)
    })
  ])
)

// ============================================================================
// Hierarchical Override Schemas (JSON/YAML imports)
// ============================================================================

// IdStrategy for hierarchical ForceSeparateRoot
const UseFieldIdStrategySchema = z.object({
  type: z.literal('UseField'),
  fieldName: z.string(),
  dataType: SimpleDataTypeSchema.optional()
})
const AutoGenerateIdStrategySchema = z.object({
  type: z.literal('AutoGenerate')
})
export const IdStrategySchema = z.discriminatedUnion('type', [
  UseFieldIdStrategySchema,
  AutoGenerateIdStrategySchema
])

// Hierarchical overrides
const DataTypeOverrideSchema = z.object({
  type: z.literal('DataTypeOverride'),
  fieldPath: z.string(),
  dataType: SimpleDataTypeSchema
})
const ForceCompositeSchema = z.object({
  type: z.literal('ForceComposite'),
  fieldPath: z.string()
})
const ForceSeparateRootSchema = z.object({
  type: z.literal('ForceSeparateRoot'),
  fieldPath: z.string(),
  idStrategy: IdStrategySchema
})
const ForceBasicSchema = z.object({
  type: z.literal('ForceBasic'),
  fieldPath: z.string(),
  dataType: SimpleDataTypeSchema
})
const ForceReferenceSchema = z.object({
  type: z.literal('ForceReference'),
  fieldPath: z.string(),
  targetRootName: z.string()
})
const HierarchicalIdOverrideSchema = z.object({
  type: z.literal('HierarchicalIdOverride'),
  rootName: z.string(),
  fieldName: z.string().nullable(),
  dataType: SimpleDataTypeSchema.nullable()
})
export const HierarchicalOverrideSchema = z.discriminatedUnion('type', [
  DataTypeOverrideSchema,
  ForceCompositeSchema,
  ForceSeparateRootSchema,
  ForceBasicSchema,
  ForceReferenceSchema,
  HierarchicalIdOverrideSchema
])

// Unified detection override (covers both flat and hierarchical)
export const DetectionOverrideSchema = z.union([
  SchemaOverrideSchema,
  HierarchicalOverrideSchema
])

// ImportJobResponse - status is a string, not enum
export const ImportJobResponseSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  targetSchema: z.string(),
  totalRows: z.number().nullable(),
  processedRows: z.number().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable()
})

// ImportProgressEvent - SSE uses different event names (progress, job_complete, error)
// Each record type is sent as a separate event with its own name

// LatestEvent discriminated union
// Backend uses snake_case: chunk_processed, chunk_failed
export const ChunkProcessedEventSchema = z.object({
  type: z.literal('chunk_processed'),
  chunkNumber: z.number(),
  rowsWritten: z.number(),
  warnings: z.array(z.string()),
  timestamp: z.string()
})

export const ChunkFailedEventSchema = z.object({
  type: z.literal('chunk_failed'),
  chunkNumber: z.number(),
  errorMessage: z.string(),
  timestamp: z.string()
})

export const LatestEventSchema = z.discriminatedUnion('type', [
  ChunkProcessedEventSchema,
  ChunkFailedEventSchema
])

// Progress event (was chunk)
export const ImportProgressEventSchema = z.object({
  jobId: z.uuid(),
  totalRows: z.number(),
  rowsProcessed: z.number(),
  rowsFailed: z.number(),
  progressPercent: z.number(),
  latestEvent: LatestEventSchema
})

export const ImportJobCompleteEventSchema = z.object({
  jobId: z.uuid(),
  totalRows: z.number()
})

export const ImportErrorEventSchema = z.object({
  jobId: z.uuid(),
  errorMessage: z.string()
})

// Union type for all import progress events
export type ImportProgressEvent =
  | { type: 'progress', data: z.infer<typeof ImportProgressEventSchema> }
  | { type: 'job_complete', data: z.infer<typeof ImportJobCompleteEventSchema> }
  | { type: 'error', data: z.infer<typeof ImportErrorEventSchema> }

// PreviewResponse - correct structure from BE
export const PreviewAttributeSchema = z.object({
  name: z.string(),
  type: z.string(),
  columnName: z.string().nullable(),
  dataType: SimpleDataTypeSchema.nullable()
})

export const PreviewRootSchema = z.object({
  name: z.string(),
  tableName: z.string(),
  attributes: z.array(PreviewAttributeSchema)
})

export const PreviewResponseSchema = z.object({
  targetSchema: z.string(),
  roots: z.array(PreviewRootSchema)
})

// ============================================================================
// Metamodel Schemas
// ============================================================================

// MetamodelDTO uses @JsonTypeInfo(use = NAME, property = "@type")
// DataTypeDTO subtypes
export const NumericTypeSchema = z.object({
  '@type': z.literal('numeric'),
  precision: z.number(),
  scale: z.number()
})

export const StringTypeSchema = z.object({
  '@type': z.literal('string')
})

export const BooleanTypeSchema = z.object({
  '@type': z.literal('boolean')
})

export const DateTypeSchema = z.object({
  '@type': z.literal('date')
})

export const TimeTypeSchema = z.object({
  '@type': z.literal('time')
})

export const TimezoneTypeSchema = z.object({
  '@type': z.literal('timezone')
})

export const DateTimeTypeSchema = z.object({
  '@type': z.literal('datetime')
})

export const DayOfWeekTypeSchema = z.object({
  '@type': z.literal('dayOfWeek')
})

export const EnumTypeSchema = z.object({
  '@type': z.literal('enum'),
  values: z.array(z.string())
})

// Forward declaration for recursive ListType
type DataTypeDTO =
  | z.infer<typeof NumericTypeSchema>
  | z.infer<typeof StringTypeSchema>
  | z.infer<typeof BooleanTypeSchema>
  | z.infer<typeof DateTypeSchema>
  | z.infer<typeof TimeTypeSchema>
  | z.infer<typeof TimezoneTypeSchema>
  | z.infer<typeof DateTimeTypeSchema>
  | z.infer<typeof DayOfWeekTypeSchema>
  | z.infer<typeof EnumTypeSchema>
  | { '@type': 'list'; elementType: DataTypeDTO }

export const DataTypeSchema: z.ZodType<DataTypeDTO> = z.lazy(() =>
  z.discriminatedUnion('@type', [
    NumericTypeSchema,
    StringTypeSchema,
    BooleanTypeSchema,
    DateTypeSchema,
    TimeTypeSchema,
    TimezoneTypeSchema,
    DateTimeTypeSchema,
    DayOfWeekTypeSchema,
    EnumTypeSchema,
    z.object({
      '@type': z.literal('list'),
      elementType: DataTypeSchema
    })
  ])
)

// AttributeDTO subtypes - use @type discriminator
export const BasicAttributeSchema = z.object({
  '@type': z.literal('basic'),
  name: z.string(),
  dataType: DataTypeSchema
})

// Forward declarations for recursive types
type AttributeDTO =
  | z.infer<typeof BasicAttributeSchema>
  | { '@type': 'composite'; name: string; attributes: Set<AttributeDTO> }
  | { '@type': 'singularRef'; name: string; targetRootName: string }
  | { '@type': 'pluralRef'; name: string; targetRootName: string }
  | { '@type': 'collection'; name: string; elementType: CollectionElementDTO }

type CollectionElementDTO =
  | { '@type': 'basic'; dataType: DataTypeDTO }
  | { '@type': 'composite'; attributes: Set<AttributeDTO> }

export const BasicElementSchema = z.object({
  '@type': z.literal('basic'),
  dataType: DataTypeSchema
})

export const CompositeElementSchema = z.lazy(() =>
  z.object({
    '@type': z.literal('composite'),
    attributes: z.array(AttributeSchema).transform(arr => new Set(arr))
  })
)

export const CollectionElementSchema = z.lazy(() =>
  z.union([
    BasicElementSchema,
    CompositeElementSchema
  ])
)

export const AttributeSchema: z.ZodType<AttributeDTO> = z.lazy(() =>
  z.discriminatedUnion('@type', [
    BasicAttributeSchema,
    z.object({
      '@type': z.literal('composite'),
      name: z.string(),
      attributes: z.array(AttributeSchema).transform(arr => new Set(arr))
    }),
    z.object({
      '@type': z.literal('singularRef'),
      name: z.string(),
      targetRootName: z.string()
    }),
    z.object({
      '@type': z.literal('pluralRef'),
      name: z.string(),
      targetRootName: z.string()
    }),
    z.object({
      '@type': z.literal('collection'),
      name: z.string(),
      elementType: CollectionElementSchema
    })
  ])
)

export const IdDescriptorSchema = z.object({
  idAttribute: BasicAttributeSchema
})

export const RootSchema = z.object({
  name: z.string(),
  attributes: z.array(AttributeSchema),
  idDescriptor: IdDescriptorSchema
})

export const ModelSpaceSchema = z.object({
  roots: z.array(RootSchema).transform(arr => {
    const record: Record<string, z.infer<typeof RootSchema>> = {}
    for (const root of arr) {
      record[root.name] = root
    }
    return record
  })
})

export const ModelSpaceResponseSchema = z.object({
  id: z.uuid(),
  schemaName: z.string(),
  modelSpace: ModelSpaceSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

// ============================================================================
// Type exports from schemas
// ============================================================================

export type ChatSession = z.infer<typeof ChatSessionSchema>
export type ChatNode = z.infer<typeof ChatNodeSchema>
export type ChatMessageNode = z.infer<typeof ChatMessageNodeSchema>
export type ChatToolCallNode = z.infer<typeof ChatToolCallNodeSchema>
export type ChatTrainingQueuedNode = z.infer<typeof ChatTrainingQueuedNodeSchema>
export type ChatTrainingStartedNode = z.infer<typeof ChatTrainingStartedNodeSchema>
export type ChatTrainingProgressNode = z.infer<typeof ChatTrainingProgressNodeSchema>
export type ChatTrainingFinishedNode = z.infer<typeof ChatTrainingFinishedNodeSchema>
export type ChatFailureNode = z.infer<typeof ChatFailureNodeSchema>
export type ChatAgentSubconclusionNode = z.infer<typeof ChatAgentSubconclusionNodeSchema>
export type ChatForkedNode = z.infer<typeof ChatForkedNodeSchema>
export type ChatTemporaryNode = z.infer<typeof ChatTemporaryNodeSchema>

export type ChatBranch = z.infer<typeof ChatBranchSchema>

export type TableInfo = z.infer<typeof TableInfoSchema>
export type DatasetInfo = z.infer<typeof DatasetInfoSchema>
export type SampleResponse = z.infer<typeof SampleResponseSchema>
export type QueryResponse = z.infer<typeof QueryResponseSchema>

export type UploadResponse = z.infer<typeof UploadResponseSchema>
export type SimpleDataType = z.infer<typeof SimpleDataTypeSchema>
export type DetectedAttribute = z.infer<typeof DetectedAttributeSchema>
export type DetectedSchemaResponse = z.infer<typeof DetectedSchemaResponseSchema>
export type SchemaOverride = z.infer<typeof SchemaOverrideSchema>
export type HierarchicalOverride = z.infer<typeof HierarchicalOverrideSchema>
export type IdStrategy = z.infer<typeof IdStrategySchema>
export type DetectionOverride = z.infer<typeof DetectionOverrideSchema>
export type ImportJobResponse = z.infer<typeof ImportJobResponseSchema>
export type ChunkProcessedEvent = z.infer<typeof ChunkProcessedEventSchema>
export type ChunkFailedEvent = z.infer<typeof ChunkFailedEventSchema>
export type LatestEvent = z.infer<typeof LatestEventSchema>
export type ImportProgressEventData = z.infer<typeof ImportProgressEventSchema>
export type ImportJobCompleteEvent = z.infer<typeof ImportJobCompleteEventSchema>
export type ImportErrorEvent = z.infer<typeof ImportErrorEventSchema>
export type PreviewResponse = z.infer<typeof PreviewResponseSchema>
export type PreviewRoot = z.infer<typeof PreviewRootSchema>
export type PreviewAttribute = z.infer<typeof PreviewAttributeSchema>

export type ModelSpaceResponse = z.infer<typeof ModelSpaceResponseSchema>
export type RootDTO = z.infer<typeof RootSchema>
export type DataType = z.infer<typeof DataTypeSchema>

// ============================================================================
// Coercion Strategy Schemas
// ============================================================================

export const ROUNDING_MODES = ['UP', 'DOWN', 'CEILING', 'FLOOR', 'HALF_UP', 'HALF_DOWN', 'HALF_EVEN', 'UNNECESSARY'] as const

export const CoercionStrategySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('SKIP') }),
  z.object({ type: z.literal('USE_DEFAULT'), defaultValue: z.unknown().optional() }),
  z.object({ type: z.literal('NULL_ON_INVALID') }),
  z.object({ type: z.literal('THROW_ON_INVALID') }),
  z.object({ type: z.literal('ROUND'), roundingMode: z.enum(ROUNDING_MODES) }),
  z.object({ type: z.literal('CLAMP'), minBound: z.number().nullable().optional(), maxBound: z.number().nullable().optional() }),
  z.object({ type: z.literal('TRUNCATE') }),
  z.object({ type: z.literal('FORWARD_FILL') }),
  z.object({ type: z.literal('BACKWARD_FILL') }),
  z.object({ type: z.literal('USE_MEAN') }),
  z.object({ type: z.literal('USE_MEDIAN') }),
  z.object({ type: z.literal('USE_MODE') }),
])

export const CoercionConfigSchema = z.object({
  rootName: z.string(),
  attributePath: z.string(),
  strategy: CoercionStrategySchema,
})

// Type exports + helpers
export type CoercionStrategy = z.infer<typeof CoercionStrategySchema>
export type CoercionConfig = z.infer<typeof CoercionConfigSchema>

export const NUMERIC_TYPE_NAMES = ['INTEGER', 'BIGINT', 'DECIMAL'] as const
export function isNumericDataType(dt: SimpleDataType): boolean {
  const base = typeof dt === 'string' ? dt : dt.type
  return (NUMERIC_TYPE_NAMES as readonly string[]).includes(base)
}

// ============================================================================
// Helpers
// ============================================================================

/** Format a SimpleDataType value for display (e.g. "TEXT", "ENUM(A, B)", "LIST<INTEGER>") */
export function formatSimpleDataType(dt: SimpleDataType): string {
  if (typeof dt === 'string') return dt
  if (dt.type === 'ENUM') return dt.values.length ? `ENUM(${dt.values.join(', ')})` : 'ENUM'
  if (dt.type === 'LIST') return `LIST<${formatSimpleDataType(dt.elementType)}>`
  return String(dt)
}

/** Extract the base type name string from a SimpleDataType */
export function getSimpleDataTypeBaseName(dt: SimpleDataType): string {
  if (typeof dt === 'string') return dt
  return dt.type
}
