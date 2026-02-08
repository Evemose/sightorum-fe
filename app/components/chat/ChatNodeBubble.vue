<template>
  <div class="chat-node-bubble relative">
    <div
        ref="nodeRef"
        class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
        :class="nodeClass"
        @click="showDialog = true"
        @mouseenter="showOverlay"
        @mouseleave="hideOverlay"
    >
      <i :class="nodeIcon" class="text-lg"/>
    </div>

    <!-- Hover Summary Overlay -->
    <OverlayPanel ref="overlayRef" class="w-96">
      <div class="flex gap-3">
        <!-- Left side: Icon with connector line -->
        <div class="flex flex-col items-center">
          <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              :class="nodeClass"
          >
            <i :class="nodeIcon" class="text-sm"/>
          </div>
          <div class="w-0.5 flex-1 bg-surface-200 dark:bg-surface-600 mt-1"/>
        </div>

        <!-- Right side: Content -->
        <div class="flex-1 pb-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-sm">{{ dialogTitle }}</span>
            <span class="text-xs text-surface-400">{{ formattedTime }}</span>
          </div>
          <div class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
            {{ summaryText }}
          </div>
          <div class="flex items-center gap-1 mt-3 text-xs text-primary-500 dark:text-primary-400">
            <i class="pi pi-external-link text-xs"/>
            <span>Click to view details</span>
          </div>
        </div>
      </div>
    </OverlayPanel>

    <!-- Full Detail Dialog -->
    <Dialog
        v-model:visible="showDialog"
        :header="dialogTitle"
        :style="{ width: '600px' }"
        modal
    >
      <ChatNodeDetail :node="node"/>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type {ChatNode} from '~/types/schemas'
import Dialog from 'primevue/dialog'
import OverlayPanel from 'primevue/overlaypanel'

const props = defineProps<{
  node: ChatNode
}>()

const showDialog = ref(false)
const nodeRef = ref<HTMLElement>()
const overlayRef = ref<InstanceType<typeof OverlayPanel>>()

function showOverlay(event: MouseEvent) {
  overlayRef.value?.show(event, nodeRef.value)
}

function hideOverlay() {
  overlayRef.value?.hide()
}

// Determine node type based on field presence
const nodeType = computed(() => {
  if ('sender' in props.node) return 'Message'
  if ('description' in props.node && 'response' in props.node) return 'ToolCall'
  if ('modelName' in props.node) return 'TrainingQueued'
  if ('progressPercentage' in props.node) return 'TrainingProgress'
  if ('metrics' in props.node) return 'TrainingFinished'
  if ('trainingId' in props.node && !('modelName' in props.node) && !('progressPercentage' in props.node) && !('metrics' in props.node)) return 'TrainingStarted'
  if ('errorMessage' in props.node) return 'Failure'
  if ('researchSteps' in props.node) return 'AgentSubconclusion'
  if ('forkPointId' in props.node) return 'Forked'
  if ('inProgressContent' in props.node) return 'Temporary'
  return 'Unknown'
})

// Formatted time for display
const formattedTime = computed(() => {
  if (!props.node.createdAt) return ''
  return new Date(props.node.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// Concise summary text for hover overlay
const summaryText = computed(() => {
  const time = props.node.createdAt ? new Date(props.node.createdAt).toLocaleTimeString() : ''
  switch (nodeType.value) {
    case 'Message': {
      const msgNode = props.node as { sender: string; text: string }
      const preview = msgNode.text?.substring(0, 200) || ''
      return `${preview}${msgNode.text?.length > 200 ? '...' : ''}`
    }
    case 'ToolCall': {
      const toolNode = props.node as { description: string }
      return toolNode.description
    }
    case 'TrainingQueued': {
      const queuedNode = props.node as { modelName: string }
      return `Model: ${queuedNode.modelName}`
    }
    case 'TrainingStarted':
      return `Started at ${time}`
    case 'TrainingProgress': {
      const progressNode = props.node as { progressPercentage: number }
      return `Progress: ${progressNode.progressPercentage.toFixed(1)}%`
    }
    case 'TrainingFinished':
      return `Completed at ${time}`
    case 'Failure': {
      const failNode = props.node as { reason: string }
      return failNode.reason
    }
    case 'AgentSubconclusion': {
      const subconcNode = props.node as { keyInsight: string }
      const preview = subconcNode.keyInsight?.substring(0, 100) || ''
      return `${preview}${subconcNode.keyInsight?.length > 100 ? '...' : ''}`
    }
    case 'Forked': {
      const forkedNode = props.node as { reason: string }
      return forkedNode.reason
    }
    case 'Temporary': {
      const tempNode = props.node as { inProgressContent: string }
      const preview = tempNode.inProgressContent?.substring(0, 150) || 'Generating...'
      return `${preview}${tempNode.inProgressContent?.length > 150 ? '...' : ''}`
    }
    default:
      return `Event at ${time}`
  }
})

// Dialog title
const dialogTitle = computed(() => {
  switch (nodeType.value) {
    case 'Message': {
      const msgNode = props.node as { sender: string }
      return `${msgNode.sender} Message`
    }
    case 'ToolCall':
      return 'Tool Call'
    case 'TrainingQueued':
      return 'Training Queued'
    case 'TrainingStarted':
      return 'Training Started'
    case 'TrainingProgress':
      return 'Training Progress'
    case 'TrainingFinished':
      return 'Training Finished'
    case 'Failure':
      return 'Error'
    case 'AgentSubconclusion':
      return 'Agent Conclusion'
    case 'Forked':
      return 'Conversation Forked'
    case 'Temporary':
      return 'Generating Response...'
    default:
      return 'Event Details'
  }
})

const nodeIcon = computed(() => {
  switch (nodeType.value) {
    case 'Message': {
      const msgNode = props.node as { sender: string }
      switch (msgNode.sender) {
        case 'USER':
          return 'pi pi-user'
        case 'ASSISTANT':
          return 'pi pi-android'
        case 'SYSTEM':
          return 'pi pi-cog'
        default:
          return 'pi pi-comment'
      }
    }
    case 'ToolCall':
      return 'pi pi-wrench'
    case 'TrainingQueued':
      return 'pi pi-clock'
    case 'TrainingStarted':
      return 'pi pi-play'
    case 'TrainingProgress':
      return 'pi pi-spin pi-spinner'
    case 'TrainingFinished':
      return 'pi pi-check-circle'
    case 'Failure':
      return 'pi pi-times-circle'
    case 'AgentSubconclusion':
      return 'pi pi-lightbulb'
    case 'Forked':
      return 'pi pi-share-alt'
    case 'Temporary':
      return 'pi pi-spin pi-spinner'
    default:
      return 'pi pi-circle'
  }
})

const nodeClass = computed(() => {
  switch (nodeType.value) {
    case 'Message': {
      const msgNode = props.node as { sender: string }
      switch (msgNode.sender) {
        case 'USER':
          return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
        case 'ASSISTANT':
          return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
        case 'SYSTEM':
          return 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
        default:
          return 'bg-surface-100 text-surface-600'
      }
    }
    case 'ToolCall':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
    case 'TrainingQueued':
      return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'
    case 'TrainingStarted':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
    case 'TrainingProgress':
      return 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
    case 'TrainingFinished':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
    case 'Failure':
      return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
    case 'AgentSubconclusion':
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Forked':
      return 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300'
    case 'Temporary':
      return 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 animate-pulse'
    default:
      return 'bg-surface-100 text-surface-600'
  }
})
</script>
