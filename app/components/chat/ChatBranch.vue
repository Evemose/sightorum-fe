<template>
  <div class="chat-branch flex items-center">
    <!-- Branch status indicator -->
    <div
      v-if="!isMain"
      class="flex items-center gap-2 mr-4 px-2 py-1 rounded text-xs font-medium"
      :class="branchStatusClass"
    >
      <i :class="branchStatusIcon" />
      <span>{{ branch.forkPoint?.reason || 'Fork' }}</span>
    </div>

    <!-- Nodes -->
    <div class="flex items-center">
      <template v-for="(node, index) in branch.nodes" :key="node.id">
        <div
          v-if="index > 0"
          class="w-8 h-0.5 bg-surface-300 dark:bg-surface-600"
        />

        <ChatNodeBubble :node="node" />
      </template>

      <!-- Active indicator for running sessions -->
      <template v-if="branch.status === 'ACTIVE'">
        <div class="w-8 h-0.5 bg-primary-400" />
        <div class="relative">
          <div class="w-4 h-4 rounded-full bg-primary-500 animate-pulse" />
          <div class="absolute inset-0 w-4 h-4 rounded-full bg-primary-400 animate-ping" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatBranch } from '~/types/schemas'
import ChatNodeBubble from "~/components/chat/ChatNodeBubble.vue";

const props = defineProps<{
  branch: ChatBranch
  isMain: boolean
}>()

const branchStatusClass = computed(() => {
  switch (props.branch.status) {
    case 'ACTIVE':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'FAILED':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
  }
})

const branchStatusIcon = computed(() => {
  switch (props.branch.status) {
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
