<template>
  <div class="chat-tree-container overflow-auto p-4">
    <div
        v-if="tree && gridLayout"
        class="chat-tree-grid"
        :style="gridStyle"
    >
      <!-- Fork connectors (rendered first, lower z-index) -->
      <ForkConnector
          v-for="connector in forkConnectors"
          :key="`connector-${connector.childBranchId}`"
          :parent-row="connector.parentRow"
          :child-row="connector.childRow"
          :column="connector.column"
      />

      <!-- Branch lines -->
      <ChatBranchLine
          v-for="branch in branchesWithLayout"
          :key="branch.branchId"
          :branch-id="branch.branchId"
          :nodes="branch.nodes"
          :status="branch.status"
          :row="branch.row"
          :start-column="branch.startColumn"
          :show-status="true"
          :status-label="branch.isMain ? 'Main' : branch.forkReason"
      />
    </div>

    <div v-else class="text-center text-surface-500 py-8">
      No chat history yet
    </div>
  </div>
</template>

<script setup lang="ts">
import type {ChatBranch} from '~/types/schemas'
import type {BranchInput} from '~/composables/useBranchLayout'
import ForkConnector from "~/components/chat/ForkConnector.vue";

const props = defineProps<{
  tree: ChatBranch | null
}>()

// Use the layout composable
const {gridLayout, buildLayout} = useBranchLayout({maxSearchDistance: 2})

// Flatten tree into branch inputs for layout calculation
const branchInputs = computed<BranchInput[]>(() => {
  if (!props.tree) return []

  const inputs: BranchInput[] = []

  function processBranch(branch: ChatBranch, parentId: string | null): void {
    // Calculate start node index based on fork point
    let startNodeIndex = 0
    if (branch.forkPoint && parentId) {
      // Find parent branch to get fork point index
      const parentBranch = findBranchById(props.tree!, parentId)
      if (parentBranch) {
        const forkIndex = parentBranch.nodes.findIndex(n => n.id === branch.forkPoint!.afterNodeId)
        startNodeIndex = forkIndex >= 0 ? forkIndex + 1 : 0
      }
    }

    inputs.push({
      branchId: branch.sessionId,
      parentBranchId: parentId,
      startNodeIndex
    })

    // Process children recursively
    for (const child of branch.children) {
      processBranch(child, branch.sessionId)
    }
  }

  processBranch(props.tree, null)
  return inputs
})

// Helper to find a branch by ID
function findBranchById(root: ChatBranch, id: string): ChatBranch | null {
  if (root.sessionId === id) return root
  for (const child of root.children) {
    const found = findBranchById(child, id)
    if (found) return found
  }
  return null
}

// Build layout when inputs change
watch(branchInputs, (inputs) => {
  if (inputs.length > 0) {
    buildLayout(inputs)
  }
}, {immediate: true})

// Calculate max columns needed
const maxColumns = computed(() => {
  if (!props.tree) return 1

  function getMaxDepth(branch: ChatBranch, startCol: number): number {
    const endCol = startCol + branch.nodes.length
    let max = endCol
    for (const child of branch.children) {
      const childStart = branch.nodes.findIndex(n => n.id === child.forkPoint?.afterNodeId) + 1
      max = Math.max(max, getMaxDepth(child, childStart))
    }
    return max
  }

  return getMaxDepth(props.tree, 0)
})

// CSS Grid style
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateRows: `repeat(${gridLayout.value.totalRows}, auto)`,
  gridTemplateColumns: `repeat(${maxColumns.value}, minmax(100px, auto))`,
  gap: '0.5rem 0'
}))

// Combine branch data with layout positions
const branchesWithLayout = computed(() => {
  if (!props.tree) return []

  const result: Array<{
    branchId: string
    nodes: ChatBranch['nodes']
    status: string
    row: number
    startColumn: number
    isMain: boolean
    forkReason: string | null
  }> = []

  function processBranch(branch: ChatBranch, isMain: boolean): void {
    const position = gridLayout.value.branches.find(b => b.branchId === branch.sessionId)
    if (position) {
      result.push({
        branchId: branch.sessionId,
        nodes: branch.nodes,
        status: branch.status,
        row: position.row,
        startColumn: position.startColumn,
        isMain,
        forkReason: branch.forkPoint?.reason ?? null
      })
    }

    for (const child of branch.children) {
      processBranch(child, false)
    }
  }

  processBranch(props.tree, true)
  return result
})

// Calculate fork connectors
const forkConnectors = computed(() => {
  const connectors: Array<{
    childBranchId: string
    parentRow: number
    childRow: number
    column: number
  }> = []

  for (const branch of gridLayout.value.branches) {
    if (branch.parentBranchId) {
      const parentPosition = gridLayout.value.branches.find(b => b.branchId === branch.parentBranchId)
      if (parentPosition) {
        connectors.push({
          childBranchId: branch.branchId,
          parentRow: parentPosition.row,
          childRow: branch.row,
          column: branch.startColumn
        })
      }
    }
  }

  return connectors
})
</script>

<style scoped>
.chat-tree-container {
  background-color: var(--p-surface-50);
  border-radius: 0.5rem;
  min-height: 200px;
}

.dark .chat-tree-container {
  background-color: var(--p-surface-800);
}

.chat-tree-grid {
  position: relative;
  min-width: max-content;
}
</style>
