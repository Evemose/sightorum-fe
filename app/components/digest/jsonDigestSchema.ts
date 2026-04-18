import { z } from 'zod'
import type { ReceiptItem } from '~/components/viz/types'

// ---------------------------------------------------------------------------
// JSON-driven digest payload schema.
//
// Mirrors `app/components/viz/BACKEND_SPEC.md`:
//   Digest { id?, title?, punchline?, generatedAt?, pages: Page[] }
//   Page   { id, header?, headline?, primaryChart?, punchlineChart?,
//            firedChecks?, receipts?, caption?, callouts? }
//
// Inner chart payloads are passthrough — components enforce shape at the
// TypeScript layer; the runtime schema validates the envelope and the chart
// `kind` discriminator.
// ---------------------------------------------------------------------------

/** All supported chart kinds (mirrors §6 of viz/BACKEND_SPEC.md) */
export const CHART_KINDS = [
  // bar
  'column-over-time', 'diverging-bar', 'diverging-lollipop', 'horizontal-bar',
  'horizontal-bar-with-cutoff', 'lollipop', 'pictorial-bar', 'stacked-bar',
  'stacked-bar-100', 'table-lens', 'table-with-inline-bar', 'tornado-bar',
  'vertical-bar',
  // comparison
  'bump-chart', 'dumbbell', 'slope-chart',
  'small-multiples-bullet', 'small-multiples-line',
  // composition
  'circular-dendrogram', 'donut', 'influence-curtain', 'marimekko', 'pie',
  'sankey', 'sunburst', 'treemap', 'voronoi-treemap',
  // kpi
  'bullet', 'dual-mean-callout', 'gauge', 'kpi-card', 'kpi-card-pair',
  'progress-ring',
  // line
  'area-chart', 'band-line', 'base-vs-shifted-slope-overlay',
  'joinpoint-regression', 'line-chart', 'linear-log-side-by-side',
  'regime-shaded-line', 'step-line',
  // multi
  'parallel-coordinates', 'radar',
  // scatter / distribution
  'beeswarm', 'box-plot', 'histogram', 'per-bucket-rate-histogram', 'qq-plot',
  'scatter-plot', 'split-violin', 'strip-plot', 'violin',
  // time
  'calendar-heatmap', 'calendar-multi-year-stack', 'stl-decomposition-stack',
  'wrapped-year-over-year',
] as const

export type ChartKind = typeof CHART_KINDS[number]

// ---------------------------------------------------------------------------
// Narrative-block schemas
// ---------------------------------------------------------------------------

const SeveritySchema = z.enum(['HIGH', 'MED', 'LOW'])

const FiredCheckSchema = z.object({
  code: z.string(),
  severity: SeveritySchema,
  text: z.string(),
})

const ReceiptItemSchema: z.ZodType<ReceiptItem> = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
})

const CalloutBoxSchema = z.object({
  severity: SeveritySchema,
  text: z.string(),
})

const PageHeaderSchema = z.object({
  title: z.string(),
  tag: z.string().optional(),
})

const HeadlineSchema = z.object({ text: z.string() })
const PunchlineSchema = z.object({ text: z.string() })
const ChartCaptionSchema = z.object({ text: z.string() })

// ---------------------------------------------------------------------------
// Chart block — `kind` is validated, the rest is passed straight to the
// component as props (after scaffold flattening + token normalization).
// ---------------------------------------------------------------------------

export const ChartBlockSchema = z.looseObject({
  kind: z.enum(CHART_KINDS),
})

export type ChartBlock = z.infer<typeof ChartBlockSchema> & Record<string, unknown>

// ---------------------------------------------------------------------------
// Page + Digest envelope
// ---------------------------------------------------------------------------

export const PageSchema = z.object({
  id: z.string().optional(),
  header: PageHeaderSchema.optional(),
  headline: HeadlineSchema.optional(),
  primaryChart: ChartBlockSchema.nullish(),
  punchlineChart: ChartBlockSchema.nullish(),
  firedChecks: z.array(FiredCheckSchema).optional(),
  receipts: z.array(ReceiptItemSchema).optional(),
  caption: ChartCaptionSchema.optional(),
  callouts: z.array(CalloutBoxSchema).optional(),
})

export type Page = z.infer<typeof PageSchema>

export const DigestPayloadSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  punchline: PunchlineSchema.optional(),
  generatedAt: z.string().optional(),
  pages: z.array(PageSchema).min(1),
})

export type DigestPayload = z.infer<typeof DigestPayloadSchema>

// ---------------------------------------------------------------------------
// Parse helper — returns a discriminated result with structured issues.
// ---------------------------------------------------------------------------

export type ParseIssue = {
  /** Dotted path into the JSON document, e.g. "pages.2.primaryChart.kind". */
  path: string
  message: string
  code?: string
  /** Hint at the rejected value (truncated). */
  received?: string
}

export type ParseResult =
  | { ok: true; data: DigestPayload }
  | { ok: false; kind: 'json'; issues: ParseIssue[] }
  | { ok: false; kind: 'schema'; issues: ParseIssue[] }

function summarize(value: unknown): string | undefined {
  if (value === undefined) return undefined
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    if (str.length > 60) return str.slice(0, 57) + '…'
    return str
  } catch {
    return String(value)
  }
}

export function parseDigestPayload(jsonText: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (e) {
    return {
      ok: false,
      kind: 'json',
      issues: [{ path: '(root)', message: (e as Error).message, code: 'json' }],
    }
  }
  const result = DigestPayloadSchema.safeParse(raw)
  if (!result.success) {
    const issues: ParseIssue[] = result.error.issues.map((i) => {
      const path = i.path.length ? i.path.map(String).join('.') : '(root)'
      const received = 'received' in i ? summarize((i as { received?: unknown }).received) : undefined
      return { path, message: i.message, code: i.code, received }
    })
    return { ok: false, kind: 'schema', issues }
  }
  return { ok: true, data: result.data }
}
