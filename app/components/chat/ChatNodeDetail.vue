<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <Tag :value="node.nodeType" />
      <Tag :value="node.status" :severity="statusSeverity" />
      <span class="text-xs text-surface-500">{{ formatTime(node.createdAt) }}</span>
    </div>

    <div class="text-xs text-surface-500 break-all">{{ node.structuralNodeId }}</div>

    <template v-if="node.rawNode.status === 'PENDING'">
      <div class="space-y-3">
        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded p-3">
          Processing in progress.
        </div>
        <div v-if="hasLiveOutput" class="rounded p-3 bg-slate-950/90">
          <div class="text-[11px] uppercase tracking-wide text-slate-300 mb-1">Live output</div>
          <pre class="text-xs whitespace-pre-wrap text-slate-100 max-h-64 overflow-auto">{{ liveOutput }}</pre>
        </div>
      </div>
    </template>

    <template v-else-if="node.rawNode.status === 'FAILED'">
      <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded p-3">
        {{ node.rawNode.errorMessage }}
      </div>
    </template>

    <template v-else>
      <div v-if="snapshotText" class="bg-surface-100 dark:bg-surface-700 rounded p-3">
        <div class="text-xs font-medium text-surface-500 mb-1">Snapshot</div>
        <div class="text-sm whitespace-pre-wrap">{{ snapshotText }}</div>
      </div>

      <template v-if="node.rawNode.nodeType === 'SCOUT'">
        <section class="space-y-3">
          <h4 class="font-semibold">Scout Overview</h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>Complexity</div><div class="font-medium">{{ asString(scoutPayload?.complexity) }}</div>
          </div>
          <div>
            <div class="font-medium mb-1">Patterns</div>
            <ul class="list-disc pl-5 text-sm">
              <li v-for="(item, i) in asStringArray(scoutPayload?.patterns)" :key="i">{{ item }}</li>
            </ul>
          </div>
          <div>
            <div class="font-medium mb-1">Recommendations</div>
            <ul class="list-disc pl-5 text-sm">
              <li v-for="(item, i) in asStringArray(scoutPayload?.recommendations)" :key="i">{{ item }}</li>
            </ul>
          </div>
        </section>
      </template>

      <template v-else-if="node.rawNode.nodeType === 'PLAN'">
        <section class="space-y-3">
          <h4 class="font-semibold">Research Plan</h4>
          <div class="text-sm"><span class="font-medium">Goal:</span> {{ asString(planPayload?.goal) }}</div>
          <div class="text-sm"><span class="font-medium">Total Complexity:</span> {{ asString(planPayload?.totalComplexity) }}</div>
          <div v-if="Array.isArray(planPayload?.branches)">
            <div class="font-medium mb-1">Branches</div>
            <Accordion :multiple="true">
              <AccordionPanel
                v-for="(branch, index) in (planPayload?.branches as Array<Record<string, unknown>>)"
                :key="String(branch.branchId ?? index)"
                :value="index.toString()"
              >
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <Tag :value="asString(branch.priority)" severity="info" />
                    <span class="font-medium">{{ asString(branch.branchId) }}</span>
                    <span class="text-xs text-surface-500">Complexity {{ asString(branch.complexity) }}</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="text-sm mb-2">{{ asString(branch.goal) }}</div>
                  <ul class="list-disc pl-5 text-sm">
                    <li
                      v-for="(step, sIdx) in asArray(branch.steps)"
                      :key="sIdx"
                    >
                      {{ asString((step as Record<string, unknown>).stepId) }}: {{ asString((step as Record<string, unknown>).objective) }}
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </section>
      </template>

      <template v-else-if="node.rawNode.nodeType === 'STEP'">
        <section class="space-y-3">
          <h4 class="font-semibold">Step Result</h4>
          <div class="bg-amber-50 dark:bg-amber-900/20 rounded p-3">
            <div class="font-medium mb-1">Key Insight</div>
            <div class="text-sm">{{ asString(stepPayload?.keyInsight) }}</div>
          </div>
          <div class="text-sm"><span class="font-medium">Summary:</span> {{ asString(stepPayload?.summary) }}</div>
          <div class="text-sm whitespace-pre-wrap"><span class="font-medium">Details:</span> {{ asString(stepPayload?.details) }}</div>
          <div v-if="Array.isArray(stepPayload?.researchActions)">
            <div class="font-medium mb-1">Research Actions</div>
            <Accordion :multiple="true">
              <AccordionPanel
                v-for="(action, index) in (stepPayload?.researchActions as Array<Record<string, unknown>>)"
                :key="index"
                :value="index.toString()"
              >
                <AccordionHeader>#{{ index + 1 }} {{ asString(action.action) }}</AccordionHeader>
                <AccordionContent>
                  <div class="text-sm"><span class="font-medium">Reasoning:</span> {{ asString(action.reasoning) }}</div>
                  <div class="text-sm"><span class="font-medium">Observation:</span> {{ asString(action.observation) }}</div>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </section>
      </template>

      <template v-else-if="node.rawNode.nodeType === 'BRANCH'">
        <section class="space-y-3">
          <h4 class="font-semibold">Branch Result</h4>
          <div class="text-sm"><span class="font-medium">Goal:</span> {{ asString(branchPayload?.goal) }}</div>
          <div class="text-sm whitespace-pre-wrap"><span class="font-medium">Summary:</span> {{ asString(branchPayload?.branchSummary) }}</div>
          <div>
            <div class="font-medium mb-1">Key Insights</div>
            <ul class="list-disc pl-5 text-sm">
              <li v-for="(item, i) in asStringArray(branchPayload?.keyInsights)" :key="i">{{ item }}</li>
            </ul>
          </div>
        </section>
      </template>

      <template v-else-if="node.rawNode.nodeType === 'ANALYSIS'">
        <section class="space-y-3">
          <h4 class="font-semibold">Final Analysis</h4>
          <div class="bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm whitespace-pre-wrap">
            {{ asString(analysisPayload?.mainConclusion) }}
          </div>
          <div class="text-sm"><span class="font-medium">Confidence:</span> {{ asString(analysisPayload?.confidence) }}</div>
          <div>
            <div class="font-medium mb-1">Supporting Evidence</div>
            <ul class="list-disc pl-5 text-sm">
              <li
                v-for="(evidence, i) in asArray(analysisPayload?.supportingEvidence)"
                :key="i"
              >
                {{ asString((evidence as Record<string, unknown>).sourceBranch) }}: {{ asString((evidence as Record<string, unknown>).finding) }}
              </li>
            </ul>
          </div>
          <div>
            <div class="font-medium mb-1">Gaps</div>
            <ul class="list-disc pl-5 text-sm">
              <li
                v-for="(gap, i) in asArray(analysisPayload?.gaps)"
                :key="i"
              >
                {{ asString((gap as Record<string, unknown>).description) }}
              </li>
            </ul>
          </div>
        </section>
      </template>

      <div class="bg-surface-100 dark:bg-surface-700 rounded p-3">
        <div class="text-xs font-medium text-surface-500 mb-1">Raw Response</div>
        <pre class="text-xs whitespace-pre-wrap">{{ node.rawNode.rawResponse }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import Tag from 'primevue/tag'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import type { ResearchTreeNode } from '~/types/research-tree'

const props = defineProps<{
  node: ResearchTreeNode
  liveText?: string
  snapshot?: string
}>()

const statusSeverity = computed(() => {
  switch (props.node.status) {
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return 'info'
  }
})

const scoutPayload = computed(() => getPayloadObject(props.node))
const planPayload = computed(() => getPayloadObject(props.node))
const stepPayload = computed(() => getPayloadObject(props.node))
const branchPayload = computed(() => getPayloadObject(props.node))
const analysisPayload = computed(() => getPayloadObject(props.node))
const liveOutput = computed(() => props.liveText ?? '')
const hasLiveOutput = computed(() => /\S/.test(liveOutput.value))
const snapshotText = computed(() => props.snapshot?.trim() ?? '')

function getPayloadObject(node: ResearchTreeNode): Record<string, unknown> | null {
  if (node.rawNode.status !== 'COMPLETED') return null
  return node.rawNode.payload as Record<string, unknown>
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return String(value)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(asString)
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString()
}
</script>
