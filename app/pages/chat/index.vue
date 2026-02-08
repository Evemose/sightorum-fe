<template>
  <div class="chat-page h-full flex gap-6">
    <!-- Session List Sidebar -->
    <div class="w-80 flex-shrink-0">
      <Card class="h-full">
        <template #content>
          <ChatSessionList
              :sessions="sessions"
              :selected-id="selectedSession?.id"
              :loading="loading"
              @select="handleSelectSession"
              @create="handleCreateSession"
              @delete="handleDeleteSession"
          />
        </template>
      </Card>
    </div>
    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <template v-if="selectedSession">
        <!-- Chat Tree -->
        <Card class="flex-1 mb-4 overflow-hidden">
          <template #title>
            <div class="flex items-center gap-3">
              <span>{{ selectedSession.schemaName }}</span>
              <Tag :value="selectedSession.status" :severity="getStatusSeverity(selectedSession.status)"/>
            </div>
          </template>
          <template #content>
            <ChatTree :tree="chatTree" />
          </template>
        </Card>
        <!-- Message Input -->
        <ChatInput
            :disabled="selectedSession.status !== 'ACTIVE'"
            :show-correction="selectedSession.status === 'ACTIVE'"
            @send="handleSendMessage"
            @interrupt="handleInterrupt"
        />
      </template>
      <template v-else>
        <Card class="flex-1 flex items-center justify-center">
          <template #content>
            <div class="text-center text-surface-500">
              <i class="pi pi-comments text-6xl mb-4"/>
              <p class="text-lg">Select a session or create a new one</p>
            </div>
          </template>
        </Card>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import type {ChatSession} from '~/types/schemas'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import {useToast} from 'primevue/usetoast'
const toast = useToast()
const {
  sessions,
  chatTree,
  loading,
  error,
  fetchSessions,
  createSession,
  deleteSession,
  fetchChatTree,
  sendMessage,
  sendCorrection,
  subscribeToTreeUpdates
} = useChat()
const selectedSession = ref<ChatSession | null>(null)
let unsubscribe: (() => void) | null = null
function getStatusSeverity(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return 'secondary'
  }
}
async function handleSelectSession(session: ChatSession) {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  selectedSession.value = session
  await fetchChatTree(session.id)
  if (session.status === 'ACTIVE') {
    unsubscribe = subscribeToTreeUpdates(session.id, (event) => {
      if (event.type === 'node' && chatTree.value) {
        // Add new node to the root branch and trigger reactivity
        const updatedNodes = [...chatTree.value.nodes, event.node]
        chatTree.value = {
          ...chatTree.value,
          nodes: updatedNodes
        }
      } else if (event.type === 'node-update' && chatTree.value) {
        // Update existing node in the root branch
        const nodeIndex = chatTree.value.nodes.findIndex(n => n.id === event.node.id)
        if (nodeIndex !== -1) {
          const updatedNodes = [...chatTree.value.nodes]
          updatedNodes[nodeIndex] = event.node
          chatTree.value = {
            ...chatTree.value,
            nodes: updatedNodes
          }
        }
      } else if (event.type === 'node-deleted' && chatTree.value) {
        // Remove deleted node from the root branch
        const updatedNodes = chatTree.value.nodes.filter(n => n.id !== event.nodeId)
        chatTree.value = {
          ...chatTree.value,
          nodes: updatedNodes
        }
      } else if (event.type === 'status') {
        // Update session status
        if (selectedSession.value && selectedSession.value.id === event.sessionId) {
          selectedSession.value.status = event.status
        }
        // Also update in sessions list
        const idx = sessions.value.findIndex(s => s.id === event.sessionId)
        if (idx !== -1) {
          sessions.value[idx]!.status = event.status
        }
      } else if (event.type === 'complete') {
        console.log('Stream completed for session:', session.id)
      } else if (event.type === 'error') {
        toast.add({
          severity: 'error',
          summary: 'Stream Error',
          detail: event.message,
          life: 5000
        })
      }
    })
  }
}
async function handleCreateSession(schemaName: string) {
  const session = await createSession({schemaName})
  if (session) {
    toast.add({
      severity: 'success',
      summary: 'Session Created',
      detail: `Chat session for ${schemaName} created`,
      life: 3000
    })
    await handleSelectSession(session)
  }
}
async function handleDeleteSession(session: ChatSession) {
  await deleteSession(session.id)
  if (selectedSession.value?.id === session.id) {
    selectedSession.value = null
  }
  toast.add({
    severity: 'info',
    summary: 'Session Deleted',
    life: 3000
  })
}
async function handleSendMessage(message: string) {
  if (!selectedSession.value) return
  await sendMessage(selectedSession.value.id, {message})
}
async function handleInterrupt(message: string) {
  if (!selectedSession.value || !chatTree.value) return
  // TODO: Implement proper node selection UI for corrections
  // For now, we'll insert before the last node in the root branch
  const lastNode = chatTree.value.nodes[chatTree.value.nodes.length - 1]
  if (!lastNode) {
    console.warn('No nodes in chat tree to correct')
    return
  }
  await sendCorrection(selectedSession.value.id, {
    beforeNodeId: lastNode.id,
    message: message || 'Stop current operation'
  })
}
onMounted(() => {
  fetchSessions()
})
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
watch(error, (newError) => {
  if (newError) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: newError,
      life: 5000
    })
  }
})
</script>
