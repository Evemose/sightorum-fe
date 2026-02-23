<template>
  <section class="h-full">
    <Card class="h-full overflow-hidden">
      <template #title>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <Button text size="small" icon="pi pi-arrow-left" label="Back" @click="router.push('/chat')" />
              <Tag :value="research?.status || 'PENDING'" :severity="getStatusSeverity(research?.status || 'PENDING')" />
            </div>
            <h2 class="text-[clamp(1.3rem,2vw,1.8rem)] leading-[1.1]">{{ research?.schemaName || 'Research Workspace' }}</h2>
            <p class="break-all text-xs text-surface-500">{{ research?.id || routeId }}</p>
          </div>

          <div class="flex items-center gap-2">
            <Button icon="pi pi-refresh" severity="secondary" text @click="refreshResearch" />
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="loading && !research" class="flex justify-center py-16">
          <ProgressSpinner style="width: 50px; height: 50px" />
        </div>

        <div v-else-if="research" class="grid h-full grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside class="order-2 rounded-xl border border-surface-200 bg-[linear-gradient(165deg,rgb(255_255_255_/_0.95),rgb(248_250_252_/_0.95))] p-4 dark:border-surface-700 dark:bg-[linear-gradient(160deg,rgb(15_23_42_/_0.8),rgb(30_41_59_/_0.82))] xl:order-1">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500">Run Summary</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex items-start justify-between gap-2">
                <dt class="text-surface-500">Created</dt>
                <dd class="text-right">{{ formatDate(research.createdAt) }}</dd>
              </div>
              <div class="flex items-start justify-between gap-2">
                <dt class="text-surface-500">Updated</dt>
                <dd class="text-right">{{ formatDate(research.updatedAt) }}</dd>
              </div>
              <div class="flex items-start justify-between gap-2">
                <dt class="text-surface-500">Nodes</dt>
                <dd>{{ research.nodes.length }}</dd>
              </div>
            </dl>

            <div class="mt-6 rounded-lg bg-surface-100 p-3 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300">
              Click a node bubble in the graph to inspect full payload details.
            </div>
          </aside>

          <main class="order-1 min-h-[58vh] rounded-xl border border-surface-200 bg-[radial-gradient(circle_at_15%_15%,rgb(14_116_144_/_0.08),transparent_38%),radial-gradient(circle_at_80%_80%,rgb(217_119_6_/_0.07),transparent_42%),linear-gradient(160deg,rgb(248_250_252),rgb(241_245_249))] dark:border-surface-700 dark:bg-[radial-gradient(circle_at_15%_15%,rgb(6_182_212_/_0.12),transparent_38%),radial-gradient(circle_at_80%_80%,rgb(249_115_22_/_0.1),transparent_44%),linear-gradient(170deg,rgb(15_23_42),rgb(30_41_59))] xl:order-2 xl:min-h-[68vh] 2xl:min-h-[820px]">
            <div class="h-full overflow-auto">
              <ResearchDAG
                :research="research"
                :live-node-text="liveNodeText"
                :node-snapshots="nodeSnapshots"
              />
            </div>
          </main>
        </div>

        <div v-else class="rounded-xl border border-dashed border-surface-300 p-12 text-center text-surface-500 dark:border-surface-700">
          Research not found.
        </div>
      </template>
    </Card>
  </section>
</template>

<script setup lang="ts">
import type { ResearchResponse } from '~/types/schemas'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import ResearchDAG from "~/components/chat/ResearchDAG.vue";

const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  currentResearch,
  loading,
  error,
  fetchResearch,
  fetchResearches,
  subscribeToResearchUpdates,
} = useResearch()

const research = computed(() => currentResearch.value)
const routeId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? (id[0] ?? '') : String(id ?? '')
})

let unsubscribe: (() => void) | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
const liveNodeText = ref<Record<string, string>>({})
const nodeSnapshots = ref<Record<string, string>>({})
const nodeTypeByProgressId = ref<Record<string, string>>({})
const nodeAliasesByProgressId = ref<Record<string, string[]>>({})
const MAX_STREAM_CHARS_PER_NODE = 2400
const SNAPSHOT_MAX_CHARS = 320

function getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return 'secondary'
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

function normalizeProgressNodeId(nodeId: string): string {
  const trimmed = nodeId.trim()
  if (!trimmed) return trimmed
  return trimmed.replace(/:v\d+:(create|critique)$/i, '')
}

function structuralRenderKey(node: ResearchResponse['nodes'][number]): string {
  const s = node.structural
  switch (s.type) {
    case 'SCOUT':
    case 'PLAN':
    case 'ANALYSIS':
      return s.nodeId
    case 'BRANCH':
      return `${s.nodeId}::${s.branchId}`
    case 'STEP':
      return `${s.nodeId}::${s.branchId}::${s.stepId}`
  }
}

function aliasesFromProgressNode(nodeId: string, nodeType: string): string[] {
  const normalized = normalizeProgressNodeId(nodeId)
  const aliases = new Set<string>([nodeId, normalized])

  if (nodeType === 'BRANCH') {
    aliases.add(`${normalized}::${normalized}`)
  }
  if (nodeType === 'STEP') {
    const i = normalized.lastIndexOf(':')
    if (i > 0 && i < normalized.length - 1) {
      const branchId = normalized.slice(0, i)
      const stepId = normalized.slice(i + 1)
      aliases.add(`${normalized}::${branchId}::${stepId}`)
    }
  }

  return [...aliases].filter(Boolean)
}

function resolveNodeAliases(nodeId: string, nodeType?: string): string[] {
  const normalized = normalizeProgressNodeId(nodeId)
  const aliases = new Set<string>([nodeId, normalized])
  const cached = nodeAliasesByProgressId.value[nodeId] ?? nodeAliasesByProgressId.value[normalized]
  for (const alias of cached ?? []) aliases.add(alias)
  if (nodeType) {
    for (const alias of aliasesFromProgressNode(nodeId, nodeType)) aliases.add(alias)
  }
  const nodes = currentResearch.value?.nodes ?? []

  for (const node of nodes) {
    if (nodeType && node.nodeType !== nodeType) continue
    const structuralId = node.structural.nodeId
    if (structuralId === normalized || structuralId === nodeId) {
      aliases.add(structuralId)
      aliases.add(structuralRenderKey(node))
    }
  }

  return [...aliases].filter(Boolean)
}

function inferNodeType(nodeId: string): string | undefined {
  const normalized = normalizeProgressNodeId(nodeId)
  const direct = nodeTypeByProgressId.value[nodeId] ?? nodeTypeByProgressId.value[normalized]
  if (direct) return direct
  const matched = (currentResearch.value?.nodes ?? []).find(node => node.structural.nodeId === normalized)
  return matched?.nodeType
}

function rememberProgressNode(nodeId: string, nodeType: string) {
  const normalized = normalizeProgressNodeId(nodeId)
  const aliases = resolveNodeAliases(nodeId, nodeType)
  nodeTypeByProgressId.value = {
    ...nodeTypeByProgressId.value,
    [nodeId]: nodeType,
    [normalized]: nodeType,
  }
  nodeAliasesByProgressId.value = {
    ...nodeAliasesByProgressId.value,
    [nodeId]: aliases,
    [normalized]: aliases,
  }
}

function writeLiveNodeText(nodeId: string, nodeType: string | undefined, text: string) {
  if (text.length === 0) return
  const next = { ...liveNodeText.value }
  const aliases = resolveNodeAliases(nodeId, nodeType)
  const canonicalKey = normalizeProgressNodeId(nodeId)
  const current = next[canonicalKey] ?? next[nodeId] ?? ''
  const merged = appendWithoutOverlap(current, text).slice(-MAX_STREAM_CHARS_PER_NODE)

  for (const alias of aliases) {
    next[alias] = merged
  }
  liveNodeText.value = next
}

function appendWithoutOverlap(current: string, incoming: string): string {
  if (!current) return incoming
  if (!incoming) return current
  if (current.endsWith(incoming)) return current

  const maxOverlap = Math.min(current.length, incoming.length, 500)
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    if (current.slice(-overlap) === incoming.slice(0, overlap)) {
      return current + incoming.slice(overlap)
    }
  }
  return current + incoming
}

function writeNodeSnapshot(nodeId: string, nodeType: string | undefined, snapshot: string) {
  const clean = snapshot.trim()
  if (!clean) return
  const clipped = clean.length > SNAPSHOT_MAX_CHARS
    ? `${clean.slice(0, SNAPSHOT_MAX_CHARS).trimEnd()}...`
    : clean

  const next = { ...nodeSnapshots.value }
  for (const alias of resolveNodeAliases(nodeId, nodeType)) {
    next[alias] = clipped
  }
  nodeSnapshots.value = next
}

function clearLiveNodeText(nodeId: string, nodeType: string | undefined) {
  const aliases = resolveNodeAliases(nodeId, nodeType)
  if (aliases.length === 0) return
  const next = { ...liveNodeText.value }
  for (const alias of aliases) {
    delete next[alias]
  }
  liveNodeText.value = next
}

function snapshotFromFindings(findings: unknown): string | null {
  if (!findings) return null
  if (typeof findings === 'string') return findings
  if (typeof findings !== 'object') return String(findings)

  const record = findings as Record<string, unknown>
  const priorityKeys = [
    'summary',
    'keyInsight',
    'mainConclusion',
    'branchSummary',
    'goal',
    'content',
    'text',
  ] as const

  for (const key of priorityKeys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  const visit = (value: unknown, depth = 0): string | null => {
    if (depth > 2 || !value) return null
    if (typeof value === 'string') return value.trim() || null
    if (typeof value !== 'object') return null

    const candidate = value as Record<string, unknown>
    for (const key of priorityKeys) {
      const nested = candidate[key]
      if (typeof nested === 'string' && nested.trim()) return nested
    }
    for (const nested of Object.values(candidate)) {
      const text = visit(nested, depth + 1)
      if (text) return text
    }
    return null
  }

  return visit(findings)
}

function scheduleRefresh(researchId: string) {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    fetchResearch(researchId)
  }, 200)
}

function attachStreamIfNeeded(nextResearch: ResearchResponse | null) {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  if (!nextResearch || nextResearch.status !== 'IN_PROGRESS') return

  unsubscribe = subscribeToResearchUpdates(nextResearch.id, (event) => {
    if (event.type === 'node_start') {
      rememberProgressNode(event.nodeId, event.nodeType)
      const nextLive = { ...liveNodeText.value }
      const nextSnapshots = { ...nodeSnapshots.value }
      const normalized = normalizeProgressNodeId(event.nodeId)
      const isSubpart = normalized !== event.nodeId
      for (const alias of resolveNodeAliases(event.nodeId, event.nodeType)) {
        if (!isSubpart) {
          nextLive[alias] = ''
          delete nextSnapshots[alias]
        } else if (!(alias in nextLive)) {
          nextLive[alias] = ''
        }
      }
      liveNodeText.value = nextLive
      nodeSnapshots.value = nextSnapshots
      scheduleRefresh(nextResearch.id)
      return
    }

    if (event.type === 'tokens') {
      const nodeType = inferNodeType(event.nodeId)
      writeLiveNodeText(event.nodeId, nodeType, event.text)
      scheduleRefresh(nextResearch.id)
      return
    }

    if (event.type === 'node_end') {
      rememberProgressNode(event.nodeId, event.nodeType)
      const derived = snapshotFromFindings(event.findings)
      if (derived) {
        writeNodeSnapshot(event.nodeId, event.nodeType, derived)
      } else {
        const aliases = resolveNodeAliases(event.nodeId, event.nodeType)
        const fallback = aliases.map(key => liveNodeText.value[key]).find(value => value?.trim())
        if (fallback?.trim()) {
          writeNodeSnapshot(event.nodeId, event.nodeType, fallback)
        }
      }
      clearLiveNodeText(event.nodeId, event.nodeType)
      scheduleRefresh(nextResearch.id)
      return
    }

    if (event.type === 'research_complete' || event.type === 'research_failed') {
      fetchResearch(nextResearch.id)
      fetchResearches()
    }
  })
}

async function loadResearch() {
  if (!routeId.value) return
  const next = await fetchResearch(routeId.value)
  liveNodeText.value = {}
  nodeSnapshots.value = {}
  nodeTypeByProgressId.value = {}
  nodeAliasesByProgressId.value = {}
  attachStreamIfNeeded(next)
}

async function refreshResearch() {
  await loadResearch()
}

onMounted(loadResearch)

watch(routeId, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  await loadResearch()
})

watch(error, (value) => {
  if (!value) return
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: value,
    life: 5000,
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (refreshTimer) clearTimeout(refreshTimer)
})
</script>
