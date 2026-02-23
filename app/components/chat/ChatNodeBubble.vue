<template>
  <div class="chat-node-bubble relative">
    <div
      ref="nodeRef"
      class="h-12 w-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
      :class="nodeClass"
      @click="showDialog = true"
      @mouseenter="showOverlay"
      @mouseleave="hideOverlay"
    >
      <i :class="nodeIcon" class="text-xl" />
    </div>

    <Popover ref="overlayRef" class="w-[28rem]">
      <div class="flex gap-3">
        <div class="flex flex-col items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="nodeClass">
            <i :class="nodeIcon" class="text-sm" />
          </div>
          <div class="w-0.5 flex-1 bg-surface-200 dark:bg-surface-600 mt-1" />
        </div>

        <div class="min-w-0 flex-1 pb-2">
          <div class="mb-1 flex items-center gap-2">
            <span class="font-semibold text-sm">{{ node.nodeType }} &middot; {{ displayStatus }}</span>
            <span class="text-xs text-surface-400">{{ formattedTime }}</span>
          </div>

          <div class="text-sm leading-relaxed text-surface-600 dark:text-surface-300 break-words">
            {{ node.summary || node.structuralNodeId }}
          </div>

          <div v-if="isInProgress && hasLiveOutput" class="mt-2 rounded-md bg-slate-950/90 p-2">
            <div class="mb-1 text-[11px] uppercase tracking-wide text-slate-300">
              Live output
            </div>
            <pre class="max-h-44 overflow-auto whitespace-pre-wrap text-xs text-slate-100">{{ streamedText }}</pre>
          </div>

          <div class="mt-3 flex items-center gap-1 text-xs text-primary-500 dark:text-primary-400">
            <i class="pi pi-external-link text-xs" />
            <span>Click to view details</span>
          </div>
        </div>
      </div>
    </Popover>

    <Dialog v-model:visible="showDialog" :header="`${node.nodeType} Node`" :style="{ width: '680px' }" modal>
      <ChatNodeDetail :node="node" :live-text="liveTextRaw" :snapshot="snapshotText" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Popover from 'primevue/popover'
import type { ResearchTreeNode } from '~/types/research-tree'

const props = defineProps<{
  node: ResearchTreeNode
  liveText?: string
  snapshot?: string
}>()

const showDialog = ref(false)
const nodeRef = ref<HTMLElement>()
const overlayRef = ref<InstanceType<typeof Popover>>()

function showOverlay(event: MouseEvent) {
  overlayRef.value?.show(event, nodeRef.value)
}

function hideOverlay() {
  overlayRef.value?.hide()
}

const formattedTime = computed(() =>
  new Date(props.node.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
)

const isInProgress = computed(() => props.node.status === 'PENDING')

const displayStatus = computed(() => (isInProgress.value ? 'IN_PROGRESS' : props.node.status))

const liveTextRaw = computed(() => props.liveText ?? '')
const hasLiveOutput = computed(() => /\S/.test(liveTextRaw.value))
const streamedText = computed(() => liveTextRaw.value.substring(liveTextRaw.value.length - 100))

const snapshotText = computed(() => {
  const explicit = props.snapshot?.trim()
  if (explicit) return explicit

  const summary = props.node.summary?.trim()
  return summary ?? ''
})

const nodeIcon = computed(() => {
  switch (props.node.nodeType) {
    case 'SCOUT':
      return 'pi pi-search'
    case 'PLAN':
      return 'pi pi-list'
    case 'BRANCH':
      return 'pi pi-code-branch'
    case 'STEP':
      return 'pi pi-angle-right'
    case 'ANALYSIS':
      return 'pi pi-chart-line'
    default:
      return 'pi pi-circle'
  }
})

const nodeClass = computed(() => {
  if (props.node.status === 'FAILED') return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
  if (props.node.status === 'COMPLETED') return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
  switch (props.node.nodeType) {
    case 'SCOUT':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/55 dark:text-cyan-200 animate-pulse'
    case 'PLAN':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/55 dark:text-indigo-200 animate-pulse'
    case 'BRANCH':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/55 dark:text-amber-200 animate-pulse'
    case 'STEP':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/55 dark:text-sky-200 animate-pulse'
    case 'ANALYSIS':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/55 dark:text-violet-200 animate-pulse'
    default:
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 animate-pulse'
  }
})
</script>
