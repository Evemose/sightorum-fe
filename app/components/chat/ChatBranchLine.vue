<template>
  <div
    class="chat-branch-line"
    :style="{
      gridRow: row,
      gridColumnStart: startColumn,
      gridColumnEnd: -1
    }"
  >
    <div class="branch-content">
      <div
        v-for="(node, index) in nodes"
        :key="node.id"
        class="node-slot"
      >
        <svg v-if="index > 0" class="connection-svg" preserveAspectRatio="none">
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            class="connection-line"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
        <ChatNodeBubble :node="node" />
      </div>

      <div v-if="showStatus && nodes.length > 0" class="status-badge" :class="statusClass">
        <i :class="statusIcon" />
        <span>{{ statusLabel || 'Branch' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResearchTreeNode } from '~/types/research-tree'

const props = defineProps<{
  branchId: string
  nodes: ResearchTreeNode[]
  status: string
  row: number
  startColumn: number
  showStatus?: boolean
  statusLabel?: string
}>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'IN_PROGRESS':
      return 'status-active'
    case 'COMPLETED':
      return 'status-completed'
    case 'FAILED':
      return 'status-failed'
    default:
      return 'status-default'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'IN_PROGRESS':
      return 'pi pi-spin pi-spinner'
    case 'COMPLETED':
      return 'pi pi-check'
    case 'FAILED':
      return 'pi pi-times'
    default:
      return 'pi pi-code-branch'
  }
})
</script>

<style scoped>
.chat-branch-line {
  display: contents;
}

.branch-content {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.5rem 0;
}

.node-slot {
  display: flex;
  align-items: center;
  position: relative;
}

.connection-svg {
  width: 80px;
  height: 40px;
  flex-shrink: 0;
}

.connection-line {
  color: rgb(203 213 225);
}

.dark .connection-line {
  color: rgb(71 85 105);
}

.status-badge {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.status-active {
  background-color: rgb(219 234 254);
  color: rgb(29 78 216);
}

.status-completed {
  background-color: rgb(220 252 231);
  color: rgb(21 128 61);
}

.status-failed {
  background-color: rgb(254 226 226);
  color: rgb(185 28 28);
}

.status-default {
  background-color: rgb(241 245 249);
  color: rgb(71 85 105);
}
</style>
