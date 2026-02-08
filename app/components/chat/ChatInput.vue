<template>
  <div class="chat-input bg-surface-0 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4">
    <div class="flex gap-2">
      <Textarea
        v-model="message"
        :disabled="disabled"
        placeholder="Type your message..."
        rows="2"
        class="flex-1"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="flex flex-col gap-2">
        <Button
          icon="pi pi-send"
          :disabled="disabled || !message.trim()"
          @click="handleSend"
        />
        <Button
          v-if="showCorrection"
          v-tooltip.left="'Interrupt'"
          icon="pi pi-stop"
          severity="danger"
          @click="handleInterrupt"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

const props = defineProps<{
  disabled?: boolean
  showCorrection?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
  interrupt: [message: string]
}>()

const message = ref('')

function handleSend() {
  if (!message.value.trim() || props.disabled) return
  emit('send', message.value.trim())
  message.value = ''
}

function handleInterrupt() {
  emit('interrupt', message.value.trim())
  message.value = ''
}
</script>
