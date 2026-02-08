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
      <!-- Nodes with connections -->
      <div
        v-for="(node, index) in nodes"
        :key="node.id"
        class="node-slot"
      >
        <!-- Connection line to previous node -->
        <svg
          v-if="index > 0"
          class="connection-svg"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            :class="[
              'connection-line',
              { 'pulsing': isTemporaryNode(node) }
            ]"
            stroke="currentColor"
            stroke-width="2"
          />

          <!-- Animated particles for streaming nodes -->
          <template v-if="isTemporaryNode(node)">
            <circle
              v-for="j in 3"
              :key="`particle-${j}`"
              cy="50%"
              r="4"
              class="flow-particle"
              fill="currentColor"
            >
              <animate
                attributeName="cx"
                from="0%"
                to="100%"
                :dur="`${1.5 + j * 0.3}s`"
                repeatCount="indefinite"
                :begin="`${j * 0.5}s`"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                :dur="`${1.5 + j * 0.3}s`"
                repeatCount="indefinite"
                :begin="`${j * 0.5}s`"
              />
            </circle>
          </template>
        </svg>

        <!-- Node bubble -->
        <ChatNodeBubble :node="node" />
      </div>

      <!-- Status badge -->
      <div
        v-if="showStatus && nodes.length > 0"
        class="status-badge"
        :class="statusClass"
      >
        <i :class="statusIcon" />
        <span>{{ statusLabel || 'Branch' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatNode } from '~/types/schemas'

const props = defineProps<{
  branchId: string
  nodes: ChatNode[]
  status: string
  row: number
  startColumn: number
  showStatus?: boolean
  statusLabel?: string
}>()

// Check if a node is temporary (streaming)
function isTemporaryNode(node: unknown): boolean {
  return node !== null && typeof node === 'object' && 'inProgressContent' in node
}

// Status styling
const statusClass = computed(() => {
  switch (props.status) {
    case 'ACTIVE':
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
    case 'ACTIVE':
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
  color: rgb(203 213 225); /* surface-300 */
}

.dark .connection-line {
  color: rgb(71 85 105); /* surface-600 */
}

.connection-line.pulsing {
  color: rgb(59 130 246); /* blue-500 */
  animation: pulse-line 1.5s ease-in-out infinite;
}

.dark .connection-line.pulsing {
  color: rgb(96 165 250); /* blue-400 */
}

@keyframes pulse-line {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.flow-particle {
  color: rgb(59 130 246); /* blue-500 */
}

.dark .flow-particle {
  color: rgb(96 165 250); /* blue-400 */
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

.dark .status-active {
  background-color: rgb(30 58 138);
  color: rgb(147 197 253);
}

.status-completed {
  background-color: rgb(220 252 231);
  color: rgb(21 128 61);
}

.dark .status-completed {
  background-color: rgb(20 83 45);
  color: rgb(134 239 172);
}

.status-failed {
  background-color: rgb(254 226 226);
  color: rgb(185 28 28);
}

.dark .status-failed {
  background-color: rgb(127 29 29);
  color: rgb(252 165 165);
}

.status-default {
  background-color: rgb(241 245 249);
  color: rgb(71 85 105);
}

.dark .status-default {
  background-color: rgb(51 65 85);
  color: rgb(203 213 225);
}
</style>
