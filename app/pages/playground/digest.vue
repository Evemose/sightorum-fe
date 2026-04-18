<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Top bar -->
    <header class="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/playground"
          class="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          &larr;
        </NuxtLink>
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Digest Demo</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="m in modes"
          :key="m"
          class="text-xs px-3 py-1 rounded border transition-colors"
          :class="mode === m
            ? 'border-viz-focal bg-viz-focal/10 text-viz-focal font-semibold'
            : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
          @click="mode = m; refreshKey++"
        >
          {{ m }}
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

    <ClientOnly>
      <Digest :key="refreshKey" :mode="mode">

        <DigestIntroduction
          frame="Excursion rate analysis — Q1 2026"
          scope="6,842 shipments across all hubs. Monthly grain. Window: 2024-01 to 2026-03."
        />

        <DigestStage
          stage-id="s1"
          headline="The headline rate is 3.87%, down 0.42pp from Q4 2025."
          transition="But how uniform is this across regions?"
        >
          <KpiCardPair
            :left="{ value: 3.87, label: 'Q1 2026' }"
            :right="{ value: 4.29, label: 'Q4 2025' }"
            :delta="-0.42"
            delta-label="quarter-over-quarter"
            left-title="Current"
            right-title="Prior"
          />
        </DigestStage>

        <DigestStage
          stage-id="s2"
          headline="The aggregate masks a 7x spread. Phoenix runs at 14.2% while Northeast hubs are below 3%."
          transition="If the aggregate is improving but Southwest is worsening, what changed?"
        >
          <HorizontalBar
            :data="{ items: hubRates }"
            :sections="[{ start: 0, end: 1, color: 'focal' }, { start: 2, end: 3, color: 'severity-amber' }, { start: 4, end: 6, color: 'chrome' }]"
            title="Excursion Rate by Hub (%)"
            :height="280"
          />
        </DigestStage>

        <DigestStage
          stage-id="s3"
          headline="Southwest rose 2.3pp while every other region improved. The aggregate improvement is a composition effect, not a real gain."
          transition="What in Southwest's operations explains the rise?"
        >
          <DivergingBar
            :data="{ items: regionDeltas }"
            title="QoQ Change by Region (pp)"
            :height="220"
          />
        </DigestStage>

        <DigestMultiStage
          stage-id="diag"
          title="Drilling into the Southwest"
          :beats="[
            { id: 'age', headline: 'Container age — 52% of Southwest rolling stock is over 30 months old, vs 18% elsewhere.', note: 'Beat 1: headline + chart fade in together.' },
            { id: 'gen', headline: 'Fleet generation — Gen-2 units account for 3x the excursions of Gen-3, and Southwest is 71% Gen-2.', note: 'Beat 2: auto-chains in scroll/autoplay, waits for click in presentation.' },
            { id: 'ops', headline: 'Dock delay compounds it — Southwest averages 38min vs 14min elsewhere, extending ambient-heat exposure.', note: 'Beat 3: closes the per-page reveal sequence before the punchline.' },
          ]"
        >
          <template #age>
            <HorizontalBar
              :data="{ items: ageMix }"
              title="Share of fleet over 30 months old (%)"
              :height="160"
            />
          </template>
          <template #gen>
            <DivergingBar
              :data="{ items: fleetGenDeltas }"
              title="Excursion rate delta by fleet gen (pp vs mean)"
              :height="160"
            />
          </template>
          <template #ops>
            <HorizontalBar
              :data="{ items: dockDelays }"
              title="Avg dock delay by region (minutes)"
              :height="160"
            />
          </template>
        </DigestMultiStage>

        <DigestPunchline
          statement="Container age >30 months is the root cause: excursion rate jumps 3x at the 30-month threshold. Southwest's fleet skews old."
        >
          <PerBucketRateHistogram
            :data="containerAgeBins"
            title="Excursion Rate by Container Age"
            :height="300"
            color-role="focal"
          />
        </DigestPunchline>

        <DigestCoda
          reading-across="The headline improvement is a composition shift — more volume moved through low-rate regions, masking Southwest's deterioration. The actionable lever is container rotation in the Southwest fleet."
          :receipts="[
            { label: 'Metric', value: 'excursion rate' },
            { label: 'Grain', value: 'monthly' },
            { label: 'N', value: 6842 },
            { label: 'Period', value: '2024-01 to 2026-03' },
            { label: 'Axes considered', value: 'region, container age, fleet gen' },
          ]"
        />

      </Digest>

      <template #fallback>
        <div class="flex items-center justify-center p-20">
          <p class="text-gray-400 text-sm">Loading digest...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import Digest from '~/components/digest/Digest.vue'
import DigestIntroduction from '~/components/digest/DigestIntroduction.vue'
import DigestStage from '~/components/digest/DigestStage.vue'
import DigestMultiStage from '~/components/digest/DigestMultiStage.vue'
import DigestPunchline from '~/components/digest/DigestPunchline.vue'
import DigestCoda from '~/components/digest/DigestCoda.vue'
import KpiCardPair from '~/components/viz/kpi/KpiCardPair.vue'
import HorizontalBar from '~/components/viz/bar/HorizontalBar.vue'
import DivergingBar from '~/components/viz/bar/DivergingBar.vue'
import PerBucketRateHistogram from '~/components/viz/scatter/PerBucketRateHistogram.vue'
import type { DigestMode } from '~/composables/useRevealState'

definePageMeta({ layout: false })

const modes: DigestMode[] = ['autoplay', 'scroll', 'presentation']
const mode = ref<DigestMode>('autoplay')
const refreshKey = ref(0)

// -- Dark mode toggle (demo-local) --
const isDark = ref(false)
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

const hubRates = [
  { key: 'Phoenix, AZ', value: 14.2 },
  { key: 'Tucson, AZ', value: 11.8 },
  { key: 'Dallas, TX', value: 9.1 },
  { key: 'Houston, TX', value: 7.6 },
  { key: 'Atlanta, GA', value: 5.4 },
  { key: 'Miami, FL', value: 4.9 },
  { key: 'Denver, CO', value: 3.2 },
]

const regionDeltas = [
  { key: 'Southwest', value: 2.3 },
  { key: 'Southeast', value: 0.6 },
  { key: 'Pacific', value: -0.2 },
  { key: 'Midwest', value: -0.2 },
  { key: 'Northeast', value: -0.4 },
]

const ageMix = [
  { key: 'Southwest', value: 52 },
  { key: 'Southeast', value: 27 },
  { key: 'Pacific', value: 19 },
  { key: 'Midwest', value: 16 },
  { key: 'Northeast', value: 14 },
]

const fleetGenDeltas = [
  { key: 'Gen-1 (legacy)', value: 3.2 },
  { key: 'Gen-2', value: 1.4 },
  { key: 'Gen-3', value: -0.6 },
  { key: 'Gen-4 (new)', value: -1.1 },
]

const dockDelays = [
  { key: 'Southwest', value: 38 },
  { key: 'Southeast', value: 22 },
  { key: 'Pacific', value: 16 },
  { key: 'Midwest', value: 15 },
  { key: 'Northeast', value: 14 },
]

const containerAgeBins = {
  bins: [
    { key: '0-6mo', count: 11 },
    { key: '6-12mo', count: 14 },
    { key: '12-18mo', count: 19 },
    { key: '18-24mo', count: 22 },
    { key: '24-30mo', count: 25, color: 'severity-amber' as const },
    { key: '30-36mo', count: 68, color: 'focal' as const },
    { key: '36-42mo', count: 79, color: 'focal' as const },
    { key: '42mo+', count: 92, color: 'focal' as const },
  ],
}
</script>
