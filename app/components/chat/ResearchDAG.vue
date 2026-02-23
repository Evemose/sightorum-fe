<template>
  <div v-if="!dagLayout" class="flex items-center gap-2 p-5 text-sm text-slate-600 dark:text-slate-300">
    <i class="pi pi-spinner pi-spin"/>
    <span>Waiting for research data...</span>
  </div>

  <div v-else class="relative p-6" :style="gridStyle">

    <!-- Node-to-node edges -->
    <svg
        v-for="edge in edges"
        :key="edge.key"
        :style="edge.style"
        class="pointer-events-none z-0 overflow-visible"
        :viewBox="edge.viewBox"
    >
      <path
          :d="edge.d" fill="none" :stroke="edge.color" :stroke-width="edge.strokeWidth"
          :stroke-dasharray="edge.dashArray ?? 'none'"
          :opacity="edge.opacity ?? 1"
          vector-effect="non-scaling-stroke"/>
    </svg>

    <!-- Nodes -->
    <div
        v-for="entry in nodeEntries"
        :key="entry.key"
        :style="entry.style"
        class="z-[2] flex items-center justify-center"
    >
      <ChatNodeBubble :node="entry.node" :live-text="entry.liveText" :snapshot="entry.snapshot" />
    </div>

    <!-- Branch badges -->
    <div
        v-for="badge in branchBadges"
        :key="badge.key"
        :style="badge.style"
        class="z-[2] flex h-fit items-center gap-[0.3rem] self-center whitespace-nowrap rounded-full px-2 py-1 text-[0.68rem] font-bold tracking-[0.02em]"
        :class="badge.className"
    >
      <i :class="badge.icon"/>
      <span>{{ badge.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, type CSSProperties, toRef} from 'vue'
import type {ResearchResponse} from '~/types/schemas'
import type {ResearchTreeNode} from '~/types/research-tree'
import {useResearchDAG} from '~/composables/useResearchDAG'

const props = withDefaults(defineProps<{
  research: ResearchResponse | null
  liveNodeText?: Record<string, string>
  nodeSnapshots?: Record<string, string>
  columnWidth?: string
  rowHeight?: string
  gap?: number
}>(), {
  columnWidth: '64px',
  rowHeight: '72px',
  gap: 6,
})

const researchRef = toRef(props, 'research')
const dagLayout = useResearchDAG(researchRef)
const spinePos = computed(() => dagLayout.value?.layout.value.branches.__spine__)

// Parse CSS dimensions to numbers
const colW = computed(() => parseFloat(props.columnWidth))
const rowH = computed(() => parseFloat(props.rowHeight))

const BRANCH_COLORS = [
  '#0f766e', '#ea580c', '#2563eb', '#7c3aed',
  '#059669', '#dc2626', '#0891b2', '#9333ea',
] as const

function branchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length] ?? BRANCH_COLORS[0]
}

type StyleValue = CSSProperties
type NodeEntry = { key: string; node: ResearchTreeNode; style: StyleValue; liveText?: string; snapshot?: string }
type BadgeEntry = { key: string; label: string; icon: string; className: string; style: StyleValue }

type EdgeEntry = {
  key: string
  d: string
  viewBox: string
  color: string
  strokeWidth: number
  dashArray?: string
  opacity?: number
  style: StyleValue
}

const gridStyle = computed<StyleValue>(() => {
  if (!dagLayout.value) return {}
  const {rows, columns} = dagLayout.value.layout.value.grid
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${props.columnWidth})`,
    gridTemplateRows: `repeat(${rows}, ${props.rowHeight})`,
    gap: `${props.gap}px`,
    width: 'fit-content',
  }
})

// --- Grid position lookup for all nodes ---

type GridPos = { row: number; col: number }

const nodeGridPos = computed<Map<string, GridPos>>(() => {
  const layout = dagLayout.value
  const spine = spinePos.value
  if (!layout || !spine) return new Map()

  const posMap = new Map<string, GridPos>()
  const branches = layout.layout.value.branches

  for (let i = 0; i < layout.spine.nodes.length; i++) {
    const node = layout.spine.nodes[i]
    if (node) posMap.set(node.id, {row: spine.row, col: spine.startColumn + i})
  }
  if (layout.spine.analysisNode) {
    posMap.set(layout.spine.analysisNode.id, {row: spine.row, col: spine.startColumn + spine.length - 1})
  }

  for (const rb of layout.researchBranches) {
    const pos = branches[rb.branchId]
    if (!pos) continue
    for (let i = 0; i < rb.nodes.length; i++) {
      const node = rb.nodes[i]
      if (node) posMap.set(node.id, {row: pos.row, col: pos.startColumn + i})
    }
  }

  return posMap
})

// --- Edge builder using physical pixel coordinates ---

function makeEdge(
    key: string,
    from: GridPos, to: GridPos,
    color: string,
    opts?: { strokeWidth?: number; dashArray?: string; opacity?: number }
): EdgeEntry {
  const cw = colW.value
  const rh = rowH.value
  const g = props.gap

  const minRow = Math.min(from.row, to.row)
  const maxRow = Math.max(from.row, to.row)
  const minCol = Math.min(from.col, to.col)
  const maxCol = Math.max(from.col, to.col)

  const spanCols = maxCol - minCol + 1
  const spanRows = maxRow - minRow + 1

  // Physical dimensions of the spanned area (cells + gaps between them)
  const totalW = spanCols * cw + (spanCols - 1) * g
  const totalH = spanRows * rh + (spanRows - 1) * g

  // Physical position within the span: cell's left edge + offset into cell
  // Start: 75% into source cell horizontally, vertically centered
  const sx = (from.col - minCol) * (cw + g) + cw * 0.75
  const sy = (from.row - minRow) * (rh + g) + rh * 0.5

  // End: 25% into target cell horizontally, vertically centered
  const ex = (to.col - minCol) * (cw + g) + cw * 0.25
  const ey = (to.row - minRow) * (rh + g) + rh * 0.5

  let d: string
  if (from.row === to.row) {
    d = `M ${sx} ${sy} L ${ex} ${ey}`
  } else {
    // S-curve with control points at horizontal midpoint
    const midX = (sx + ex) / 2
    d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`
  }

  return {
    key, d, color,
    strokeWidth: opts?.strokeWidth ?? 2,
    dashArray: opts?.dashArray,
    opacity: opts?.opacity,
    // viewBox matches physical pixels — no distortion
    viewBox: `0 0 ${totalW} ${totalH}`,
    style: {
      gridRow: `${minRow} / ${maxRow + 1}`,
      gridColumn: `${minCol} / ${maxCol + 1}`,
      position: 'relative',
    },
  }
}

// --- All edges ---

const edges = computed<EdgeEntry[]>(() => {
  const layout = dagLayout.value
  const spine = spinePos.value
  const positions = nodeGridPos.value
  if (!layout || !spine || positions.size === 0) return []

  const result: EdgeEntry[] = []
  const branches = layout.layout.value.branches
  const spineColor = 'var(--dag-spine-color, #64748b)'

  // Spine sequential
  const spineNodes = layout.spine.nodes
  for (let i = 0; i < spineNodes.length - 1; i++) {
    const from = positions.get(spineNodes[i]!.id)
    const to = positions.get(spineNodes[i + 1]!.id)
    if (from && to) result.push(makeEdge(`spine-${i}`, from, to, spineColor))
  }

  // Last spine → analysis
  if (layout.spine.analysisNode && spineNodes.length > 0) {
    const from = positions.get(spineNodes[spineNodes.length - 1]!.id)
    const to = positions.get(layout.spine.analysisNode.id)
    if (from && to) result.push(makeEdge('spine-to-analysis', from, to, spineColor))
  }

  // Plan node = fork origin
  const planPos = spineNodes.length >= 2 ? positions.get(spineNodes[1]!.id) : null

  // Fork: plan → first branch node + sequential within branch
  layout.researchBranches.forEach((rb, idx) => {
    const branchPos = branches[rb.branchId]
    if (!branchPos || rb.nodes.length === 0) return

    const color = branchColor(idx)

    const firstNodePos = positions.get(rb.nodes[0]!.id)
    if (planPos && firstNodePos) {
      result.push(makeEdge(`fork-${rb.branchId}`, planPos, firstNodePos, color))
    }

    for (let i = 0; i < rb.nodes.length - 1; i++) {
      const from = positions.get(rb.nodes[i]!.id)
      const to = positions.get(rb.nodes[i + 1]!.id)
      if (from && to) result.push(makeEdge(`branch-${rb.branchId}-${i}`, from, to, color))
    }
  })

  // Dependency edges (cross-branch)
  for (const dep of layout.dependencyEdges) {
    const from = positions.get(dep.fromNodeId)
    const to = positions.get(dep.toNodeId)
    if (from && to) {
      result.push(makeEdge(
          `dep-${dep.fromNodeId}-${dep.toNodeId}`,
          from, to, '#94a3b8',
          {strokeWidth: 1.5, dashArray: '6 3', opacity: 0.6},
      ))
    }
  }

  // Branch ends → analysis
  if (layout.spine.analysisNode) {
    const analysisPos = positions.get(layout.spine.analysisNode.id)
    if (analysisPos) {
      layout.researchBranches.forEach((rb, idx) => {
        if (rb.nodes.length === 0) return
        const lastNodePos = positions.get(rb.nodes[rb.nodes.length - 1]!.id)
        if (lastNodePos) {
          result.push(makeEdge(
              `branch-to-analysis-${rb.branchId}`,
              lastNodePos, analysisPos,
              branchColor(idx),
              {strokeWidth: 1.5, dashArray: '6 3', opacity: 0.6},
          ))
        }
      })
    }
  }

  return result
})

// --- Nodes ---

const nodeEntries = computed<NodeEntry[]>(() => {
  const positions = nodeGridPos.value
  const layout = dagLayout.value
  if (!layout) return []

  const entries: NodeEntry[] = []
  const liveMap = props.liveNodeText ?? {}
  const snapshotMap = props.nodeSnapshots ?? {}

  const resolveText = (node: ResearchTreeNode) => {
    const baseKey = node.rawNode.structural.nodeId
    const branchKey = node.rawNode.structural.type === 'STEP'
        ? `${node.rawNode.structural.nodeId}::${node.rawNode.structural.branchId}`
        : node.id

    return {
      liveText: liveMap[node.id] ?? liveMap[baseKey] ?? liveMap[branchKey],
      snapshot: snapshotMap[node.id] ?? snapshotMap[baseKey] ?? snapshotMap[branchKey],
    }
  }

  for (const node of layout.spine.nodes) {
    const pos = positions.get(node.id)
    if (pos) {
      entries.push({key: `spine-${node.id}`, node, style: {gridRow: pos.row, gridColumn: pos.col}, ...resolveText(node)})
    }
  }
  if (layout.spine.analysisNode) {
    const pos = positions.get(layout.spine.analysisNode.id)
    if (pos) {
      entries.push({
        key: `spine-analysis-${layout.spine.analysisNode.id}`,
        node: layout.spine.analysisNode,
        style: {gridRow: pos.row, gridColumn: pos.col},
        ...resolveText(layout.spine.analysisNode),
      })
    }
  }

  for (const rb of layout.researchBranches) {
    for (const node of rb.nodes) {
      const pos = positions.get(node.id)
      if (pos) {
        entries.push({key: `branch-${rb.branchId}-${node.id}`, node, style: {gridRow: pos.row, gridColumn: pos.col}, ...resolveText(node)})
      }
    }
  }

  return entries
})

// --- Badges ---

const branchBadges = computed<BadgeEntry[]>(() => {
  const layout = dagLayout.value
  if (!layout) return []

  const branches = layout.layout.value.branches
  return layout.researchBranches.map(rb => {
    const pos = branches[rb.branchId]
    if (!pos) return null

    let icon = 'pi pi-clock'
    let className = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    if (rb.status === 'IN_PROGRESS') { icon = 'pi pi-spin pi-spinner'; className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-200' }
    if (rb.status === 'COMPLETED') { icon = 'pi pi-check'; className = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200' }
    if (rb.status === 'FAILED') { icon = 'pi pi-times'; className = 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200' }

    return {
      key: `badge-${rb.branchId}`, label: rb.label, icon, className,
      style: {gridRow: pos.row, gridColumn: pos.startColumn + rb.nodes.length} as StyleValue,
    }
  }).filter((b): b is BadgeEntry => b !== null)
})
</script>
