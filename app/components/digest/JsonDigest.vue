<template>
  <div class="json-digest h-full overflow-y-auto bg-white dark:bg-gray-950">
    <!-- Masthead -->
    <header
      v-if="payload.title || payload.punchline || payload.generatedAt"
      class="px-8 py-6 border-b border-gray-200 dark:border-gray-800 max-w-4xl mx-auto"
    >
      <h1
        v-if="payload.title"
        class="text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        {{ payload.title }}
      </h1>
      <Punchline
        v-if="payload.punchline"
        :text="payload.punchline.text"
        class="mt-3"
      />
      <p
        v-if="payload.generatedAt"
        class="mt-2 text-[10px] uppercase tracking-wider text-viz-chrome"
      >
        Generated {{ payload.generatedAt }}
      </p>
    </header>

    <!-- Pages -->
    <section
      v-for="(page, idx) in payload.pages"
      :key="page.id ?? idx"
      class="json-digest__page max-w-4xl mx-auto px-8 py-8 border-b border-gray-100 dark:border-gray-900 space-y-5"
    >
      <PageHeader
        v-if="page.header"
        :title="page.header.title"
        :tag="page.header.tag"
      />

      <Headline
        v-if="page.headline"
        :text="page.headline.text"
      />

      <ChartRenderer
        v-if="page.primaryChart"
        :block="page.primaryChart"
      />

      <ChartRenderer
        v-if="page.punchlineChart"
        :block="page.punchlineChart"
      />

      <ChartCaption
        v-if="page.caption"
        :text="page.caption.text"
      />

      <div v-if="page.callouts?.length" class="space-y-2">
        <CalloutBox
          v-for="(c, i) in page.callouts"
          :key="i"
          :severity="c.severity"
          :text="c.text"
        />
      </div>

      <FiredCheckList
        v-if="page.firedChecks?.length"
        :checks="page.firedChecks"
      />

      <ReceiptsBlock
        v-if="page.receipts?.length"
        :items="page.receipts"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import ChartRenderer from './ChartRenderer.vue'
import PageHeader from '~/components/viz/narrative/PageHeader.vue'
import Headline from '~/components/viz/narrative/Headline.vue'
import Punchline from '~/components/viz/narrative/Punchline.vue'
import ChartCaption from '~/components/viz/narrative/ChartCaption.vue'
import CalloutBox from '~/components/viz/narrative/CalloutBox.vue'
import FiredCheckList from '~/components/viz/narrative/FiredCheckList.vue'
import ReceiptsBlock from '~/components/viz/narrative/ReceiptsBlock.vue'
import type { DigestPayload } from './jsonDigestSchema'

defineProps<{
  payload: DigestPayload
}>()
</script>

<style scoped>
.json-digest__page:last-child {
  border-bottom: 0;
}
</style>
