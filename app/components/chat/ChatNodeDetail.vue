<template>
  <div class="chat-node-detail">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center"
        :class="headerClass"
      >
        <i :class="headerIcon" />
      </div>
      <div>
        <div class="font-semibold text-surface-800 dark:text-surface-100">
          {{ headerTitle }}
        </div>
        <div class="text-xs text-surface-500">
          {{ formatTime(node.createdAt) }}
        </div>
      </div>
    </div>

    <!-- Content based on type -->
    <div class="text-sm text-surface-600 dark:text-surface-300">
      <!-- Message -->
      <template v-if="'sender' in node && 'text' in node">
        <div class="bg-surface-100 dark:bg-surface-700 rounded-lg p-3 max-h-48 overflow-y-auto">
          <pre class="whitespace-pre-wrap font-sans">{{ node.text }}</pre>
        </div>
      </template>

      <!-- Tool Call -->
      <template v-else-if="'description' in node && 'response' in node">
        <div class="space-y-2">
          <div class="font-medium">{{ node.description }}</div>
          <div class="bg-surface-100 dark:bg-surface-700 rounded-lg p-3 max-h-48 overflow-y-auto">
            <pre class="text-xs font-mono">{{ JSON.stringify(node.response, null, 2) }}</pre>
          </div>
        </div>
      </template>

      <!-- Training Queued -->
      <template v-else-if="'modelName' in node">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-surface-500">Model:</span>
            <Tag :value="node.modelName" severity="info" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-surface-500">Training ID:</span>
            <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
              {{ node.trainingId }}
            </code>
          </div>
        </div>
      </template>

      <!-- Training Progress -->
      <template v-else-if="'progressPercentage' in node">
        <div class="space-y-3">
          <ProgressBar :value="node.progressPercentage" :show-value="true" />
          <div class="flex items-center gap-2">
            <span class="text-surface-500">Training ID:</span>
            <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
              {{ node.trainingId }}
            </code>
          </div>
        </div>
      </template>

      <!-- Training Finished -->
      <template v-else-if="'metrics' in node">
        <div class="space-y-2">
          <div class="font-medium text-green-600 dark:text-green-400">Training Completed</div>
          <div class="bg-surface-100 dark:bg-surface-700 rounded-lg p-3">
            <div class="text-xs font-medium mb-2">Metrics:</div>
            <div class="grid grid-cols-2 gap-2">
              <template v-for="(value, key) in node.metrics" :key="key">
                <div class="text-surface-500">{{ key }}:</div>
                <div class="font-medium">{{ formatMetricValue(value) }}</div>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- Training Started -->
      <template v-else-if="'trainingId' in node">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <i class="pi pi-spin pi-spinner text-primary-500" />
            <span>Training in progress...</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-surface-500">Training ID:</span>
            <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
              {{ node.trainingId }}
            </code>
          </div>
        </div>
      </template>

      <!-- Failure -->
      <template v-else-if="'errorMessage' in node">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Tag :value="node.reason" severity="danger" />
          </div>
          <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3">
            {{ node.errorMessage }}
          </div>
        </div>
      </template>

      <!-- Agent Subconclusion -->
      <template v-else-if="'researchSteps' in node">
        <div class="space-y-4">
          <!-- Key Insight - Most prominent -->
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-star-fill text-amber-500" />
              <span class="font-semibold text-amber-700 dark:text-amber-300">Key Insight</span>
            </div>
            <p class="text-amber-900 dark:text-amber-100 font-medium">{{ node.keyInsight }}</p>
          </div>

          <!-- Summary -->
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded-r-lg">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-lightbulb text-yellow-500" />
              <span class="font-semibold text-yellow-700 dark:text-yellow-300">Summary</span>
            </div>
            <p class="text-sm text-yellow-800 dark:text-yellow-200">{{ node.summary }}</p>
          </div>

          <!-- Details -->
          <div v-if="node.details" class="bg-surface-100 dark:bg-surface-700 rounded-lg p-3">
            <div class="text-xs font-medium text-surface-500 mb-2">Details</div>
            <pre class="whitespace-pre-wrap font-sans text-sm text-surface-700 dark:text-surface-300">{{ node.details }}</pre>
          </div>

          <!-- Research Steps Timeline -->
          <div v-if="node.researchSteps.length > 0">
            <div class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
              <i class="pi pi-list text-primary-500" />
              Research Steps ({{ node.researchSteps.length }})
            </div>

            <Accordion :multiple="true" class="research-steps-accordion">
              <AccordionPanel
                  v-for="(step, index) in node.researchSteps"
                  :key="index"
                  :value="index.toString()"
              >
                <AccordionHeader>
                  <div class="flex items-center gap-3 w-full">
                    <!-- Step number -->
                    <div class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {{ index + 1 }}
                    </div>
                    <!-- Observation as header -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <i class="pi pi-eye text-green-500 text-xs" />
                        <span class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Observation</span>
                      </div>
                      <p class="text-sm text-surface-700 dark:text-surface-300 truncate">{{ step.observation }}</p>
                    </div>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-3 pt-2">
                    <!-- Reasoning -->
                    <div class="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-3">
                      <div class="flex items-center gap-2 mb-1">
                        <i class="pi pi-brain text-purple-500 text-sm" />
                        <span class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Reasoning</span>
                      </div>
                      <p class="text-sm text-surface-700 dark:text-surface-300">{{ step.reasoning }}</p>
                    </div>

                    <!-- Action -->
                    <div class="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3">
                      <div class="flex items-center gap-2 mb-1">
                        <i class="pi pi-bolt text-blue-500 text-sm" />
                        <span class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Action</span>
                      </div>
                      <p class="text-sm text-surface-700 dark:text-surface-300 font-mono">{{ step.action }}</p>
                    </div>

                    <!-- Full Observation -->
                    <div class="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-3">
                      <div class="flex items-center gap-2 mb-1">
                        <i class="pi pi-eye text-green-500 text-sm" />
                        <span class="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Full Observation</span>
                      </div>
                      <p class="text-sm text-surface-700 dark:text-surface-300">{{ step.observation }}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>

          <!-- Conversation ID -->
          <div class="flex items-center gap-2 text-xs pt-2 border-t border-surface-200 dark:border-surface-600">
            <i class="pi pi-tag text-surface-400" />
            <span class="text-surface-500">Conversation ID:</span>
            <code class="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded font-mono">
              {{ node.conversationId }}
            </code>
          </div>
        </div>
      </template>

      <!-- Forked -->
      <template v-else-if="'forkPointId' in node">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <i class="pi pi-share-alt text-teal-500" />
            <span class="font-medium text-teal-600 dark:text-teal-400">Conversation Forked</span>
          </div>
          <div class="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 space-y-2">
            <div><span class="text-surface-500">Reason:</span> {{ node.reason }}</div>
            <div v-if="node.furtherInstructions">
              <span class="text-surface-500">Instructions:</span>
              <p class="mt-1 text-sm">{{ node.furtherInstructions }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-surface-500">Fork Point ID:</span>
            <code class="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
              {{ node.forkPointId }}
            </code>
          </div>
        </div>
      </template>

      <!-- Temporary (In Progress) -->
      <template v-else-if="'inProgressContent' in node">
        <div class="space-y-2">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-spin pi-spinner text-primary-500" />
            <span class="font-medium text-primary-600 dark:text-primary-400">Generating Response...</span>
          </div>
          <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
            <div class="max-h-96 overflow-y-auto">
              <pre class="whitespace-pre-wrap font-sans text-sm text-primary-900 dark:text-primary-100">{{ node.inProgressContent }}</pre>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-primary-500 dark:text-primary-400 mt-2">
            <i class="pi pi-info-circle" />
            <span>This content is being streamed in real-time</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatNode } from '~/types/schemas'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

const props = defineProps<{
  node: ChatNode
}>()

const headerClass = computed(() => {
  if ('sender' in props.node) {
    switch (props.node.sender) {
      case 'USER': return 'bg-blue-100 text-blue-600'
      case 'ASSISTANT': return 'bg-purple-100 text-purple-600'
      case 'SYSTEM': return 'bg-surface-200 text-surface-600'
    }
  }
  if ('description' in props.node && 'response' in props.node) return 'bg-amber-100 text-amber-600'
  if ('modelName' in props.node) return 'bg-cyan-100 text-cyan-600'
  if ('progressPercentage' in props.node) return 'bg-primary-100 text-primary-600'
  if ('metrics' in props.node) return 'bg-green-100 text-green-600'
  if ('trainingId' in props.node) return 'bg-indigo-100 text-indigo-600'
  if ('errorMessage' in props.node) return 'bg-red-100 text-red-600'
  if ('researchSteps' in props.node) return 'bg-yellow-100 text-yellow-600'
  if ('forkPointId' in props.node) return 'bg-teal-100 text-teal-600'
  if ('inProgressContent' in props.node) return 'bg-primary-100 text-primary-600'
  return 'bg-surface-100 text-surface-600'
})

const headerIcon = computed(() => {
  if ('sender' in props.node) {
    switch (props.node.sender) {
      case 'USER': return 'pi pi-user'
      case 'ASSISTANT': return 'pi pi-android'
      case 'SYSTEM': return 'pi pi-cog'
    }
  }
  if ('description' in props.node && 'response' in props.node) return 'pi pi-wrench'
  if ('modelName' in props.node) return 'pi pi-clock'
  if ('progressPercentage' in props.node) return 'pi pi-chart-line'
  if ('metrics' in props.node) return 'pi pi-check-circle'
  if ('trainingId' in props.node) return 'pi pi-play'
  if ('errorMessage' in props.node) return 'pi pi-times-circle'
  if ('researchSteps' in props.node) return 'pi pi-lightbulb'
  if ('forkPointId' in props.node) return 'pi pi-share-alt'
  if ('inProgressContent' in props.node) return 'pi pi-spin pi-spinner'
  return 'pi pi-circle'
})

const headerTitle = computed(() => {
  if ('sender' in props.node) {
    switch (props.node.sender) {
      case 'USER': return 'User Message'
      case 'ASSISTANT': return 'Assistant Message'
      case 'SYSTEM': return 'System Message'
    }
  }
  if ('description' in props.node && 'response' in props.node) return 'Tool Call'
  if ('modelName' in props.node) return 'Training Queued'
  if ('progressPercentage' in props.node) return 'Training Progress'
  if ('metrics' in props.node) return 'Training Finished'
  if ('trainingId' in props.node) return 'Training Started'
  if ('errorMessage' in props.node) return 'Failure'
  if ('researchSteps' in props.node) return 'Agent Conclusion'
  if ('forkPointId' in props.node) return 'Conversation Forked'
  if ('inProgressContent' in props.node) return 'Generating Response...'
  return 'Event'
})

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(4)
  }
  return String(value)
}
</script>
