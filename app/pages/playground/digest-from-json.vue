<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-950">
    <!-- Top bar -->
    <header class="flex-shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/playground"
          class="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          &larr;
        </NuxtLink>
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Digest from JSON</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          edit JSON, press Regenerate to (re)render
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="resetToSample"
        >
          Reset
        </button>
        <button
          class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="prettify"
        >
          Format
        </button>
        <button
          class="text-xs px-3 py-1 rounded border border-viz-focal bg-viz-focal/10 text-viz-focal font-semibold hover:bg-viz-focal/20"
          title="Re-render the digest from the current JSON"
          @click="apply"
        >
          Regenerate
        </button>
        <span class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button
          class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="toggleDark"
        >
          {{ isDark ? 'Light' : 'Dark' }}
        </button>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-2 gap-0 min-h-0">
      <!-- Editor pane -->
      <section class="flex flex-col border-r border-gray-200 dark:border-gray-800 min-h-0">
        <div class="flex-shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-viz-chrome border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <span>JSON payload</span>
          <span
            v-if="parseStatus?.ok"
            class="inline-flex items-center gap-1 text-viz-delta-positive normal-case tracking-normal font-semibold"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-viz-delta-positive" />
            valid · {{ pageCount }} page{{ pageCount === 1 ? '' : 's' }}
          </span>
          <span
            v-else-if="parseStatus && !parseStatus.ok"
            class="inline-flex items-center gap-1 text-viz-error normal-case tracking-normal font-semibold"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-viz-error" />
            {{ parseStatus.kind === 'json' ? 'JSON syntax error' : `${parseStatus.issues.length} schema issue${parseStatus.issues.length === 1 ? '' : 's'}` }}
          </span>
        </div>
        <textarea
          v-model="jsonText"
          spellcheck="false"
          class="flex-1 w-full p-3 font-mono text-xs bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 outline-none resize-none border-0 focus:ring-0"
          @keydown.tab.prevent="onTab"
        />
        <div
          v-if="parseStatus && !parseStatus.ok"
          class="flex-shrink-0 border-t border-viz-error/30 bg-red-50 dark:bg-red-950/20 max-h-56 overflow-y-auto"
        >
          <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-viz-error border-b border-viz-error/20 bg-red-100/60 dark:bg-red-950/30">
            {{ parseStatus.kind === 'json' ? 'Could not parse JSON' : 'Schema validation failed' }}
          </div>
          <ul class="divide-y divide-viz-error/15">
            <li
              v-for="(issue, i) in parseStatus.issues"
              :key="i"
              class="px-3 py-2 text-xs flex items-start gap-2"
            >
              <span class="flex-shrink-0 inline-block min-w-[1.4rem] text-center text-[10px] font-bold text-viz-error/70 mt-0.5">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <code class="font-mono text-[11px] text-gray-900 dark:text-gray-100 bg-white/60 dark:bg-gray-900/60 rounded px-1 py-px">{{ issue.path }}</code>
                  <span
                    v-if="issue.code"
                    class="inline-block text-[9px] font-bold uppercase tracking-wider text-viz-error/80 bg-viz-error/10 rounded px-1 py-px"
                  >{{ issue.code }}</span>
                </div>
                <p class="mt-0.5 text-gray-800 dark:text-gray-200 leading-snug">{{ issue.message }}</p>
                <p v-if="issue.received" class="mt-0.5 font-mono text-[10px] text-viz-chrome">
                  received: <span class="text-gray-700 dark:text-gray-300">{{ issue.received }}</span>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Preview pane -->
      <section class="flex flex-col min-h-0">
        <div class="flex-shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-viz-chrome border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          Preview
        </div>
        <div class="flex-1 min-h-0 relative">
          <ClientOnly>
            <JsonDigest
              v-if="appliedPayload"
              :payload="appliedPayload"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center h-full text-sm text-gray-400 gap-2"
            >
              <p>Edit JSON on the left, then press</p>
              <button
                class="text-xs px-4 py-1.5 rounded border border-viz-focal bg-viz-focal/10 text-viz-focal font-semibold hover:bg-viz-focal/20"
                @click="apply"
              >
                Regenerate
              </button>
            </div>
            <template #fallback>
              <div class="flex items-center justify-center h-full text-sm text-gray-400">
                Loading…
              </div>
            </template>
          </ClientOnly>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import JsonDigest from '~/components/digest/JsonDigest.vue'
import { parseDigestPayload, type DigestPayload, type ParseResult } from '~/components/digest/jsonDigestSchema'
import { sampleDigestJson } from '~/components/digest/sampleDigest'

definePageMeta({ layout: false })

const jsonText = ref(sampleDigestJson)
const appliedPayload = ref<DigestPayload | null>(null)
const parseStatus = ref<ParseResult | null>(null)

const pageCount = computed(() =>
  parseStatus.value?.ok ? parseStatus.value.data.pages.length : 0,
)

function apply() {
  const result = parseDigestPayload(jsonText.value)
  parseStatus.value = result
  if (result.ok) appliedPayload.value = result.data
}

function prettify() {
  try {
    const obj = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(obj, null, 2)
  } catch {
    // leave as-is; the editor will still show the parse error after Apply
  }
}

function resetToSample() {
  jsonText.value = sampleDigestJson
  apply()
}

function onTab(e: KeyboardEvent) {
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const value = target.value
  target.value = value.slice(0, start) + '  ' + value.slice(end)
  target.selectionStart = target.selectionEnd = start + 2
  jsonText.value = target.value
}

// No auto-render on mount — user explicitly clicks Regenerate to render the
// digest. This keeps iterative editing predictable and avoids surprise
// autoplay on page load.

// -- Dark mode toggle --
const isDark = ref(false)
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>
