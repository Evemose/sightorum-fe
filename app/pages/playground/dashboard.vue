<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-950 p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">Dashboard Demo</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Excursion Rate Overview &mdash; Q1 2026</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
            @click="toggleDark"
          >
            {{ isDark ? 'Light' : 'Dark' }}
          </button>
          <NuxtLink
            to="/playground"
            class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            &larr; Playground
          </NuxtLink>
        </div>
      </div>

      <ClientOnly>
        <Dashboard :columns="12" :gap="16" :breakpoints="{ md: 8, sm: 4 }" title="Key Metrics">
          <!-- KPI row -->
          <DashboardCell :span="{ colSpan: 4, rowSpan: 1, sm: { colSpan: 4, rowSpan: 1 } }">
            <KpiCard
              :data="{ value: 3.87, label: 'Excursion rate', delta: -0.42, deltaLabel: 'vs Q4', n: 6842 }"
              color-role="base"
              title="Headline Rate"
            />
          </DashboardCell>
          <DashboardCell :span="{ colSpan: 4, rowSpan: 1 }">
            <KpiCard
              :data="{ value: 14.2, label: 'Southwest rate', delta: 2.3, deltaLabel: 'vs Q4' }"
              color-role="divergent"
              title="Worst Region"
            />
          </DashboardCell>
          <DashboardCell :span="{ colSpan: 4, rowSpan: 1 }">
            <KpiCard
              :data="{ value: 2.1, label: 'Northeast rate', delta: -0.4, deltaLabel: 'vs Q4' }"
              color-role="base"
              title="Best Region"
            />
          </DashboardCell>

          <!-- Charts row -->
          <DashboardSection title="Regional Breakdown">
            <DashboardCell :span="{ colSpan: 7, rowSpan: 2 }">
              <HorizontalBar
                :data="{ items: hubRates }"
                title="Excursion Rate by Hub"
                :height="320"
              />
            </DashboardCell>
            <DashboardCell :span="{ colSpan: 5, rowSpan: 2 }">
              <Donut
                :data="compositionData"
                center-kpi="5.9pp"
                title="Lift by Factor"
                :height="320"
              />
            </DashboardCell>
          </DashboardSection>

          <!-- Trend row -->
          <DashboardSection title="Trends" :collapsible="true">
            <DashboardCell :span="{ colSpan: 8, rowSpan: 2 }">
              <LineChart
                :data="trendData"
                title="Monthly Rate by Region"
                :smooth="true"
                :height="280"
              />
            </DashboardCell>
            <DashboardCell :span="{ colSpan: 4, rowSpan: 2 }">
              <DivergingBar
                :data="{ items: factorDeltas }"
                title="YoY Factor Change"
                :height="280"
              />
            </DashboardCell>
          </DashboardSection>

          <!-- Distribution row -->
          <DashboardSection title="Distribution" :collapsible="true">
            <DashboardCell :span="{ colSpan: 6, rowSpan: 2 }">
              <PerBucketRateHistogram
                :data="containerAgeBins"
                title="Rate by Container Age"
                :height="260"
              />
            </DashboardCell>
            <DashboardCell :span="{ colSpan: 6, rowSpan: 2 }">
              <Dumbbell
                :data="pairedData"
                title="Prior vs Current by Region"
                :height="260"
              />
            </DashboardCell>
          </DashboardSection>
        </Dashboard>

        <template #fallback>
          <div class="flex items-center justify-center p-12">
            <p class="text-gray-400 text-sm">Loading dashboard...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import Dashboard from '~/components/dashboard/Dashboard.vue'
import DashboardCell from '~/components/dashboard/DashboardCell.vue'
import DashboardSection from '~/components/dashboard/DashboardSection.vue'
import KpiCard from '~/components/viz/kpi/KpiCard.vue'
import HorizontalBar from '~/components/viz/bar/HorizontalBar.vue'
import Donut from '~/components/viz/composition/Donut.vue'
import LineChart from '~/components/viz/line/LineChart.vue'
import DivergingBar from '~/components/viz/bar/DivergingBar.vue'
import PerBucketRateHistogram from '~/components/viz/scatter/PerBucketRateHistogram.vue'
import Dumbbell from '~/components/viz/comparison/Dumbbell.vue'

definePageMeta({ layout: false })

// -- Dark mode toggle (demo-local; the global toggle lives in AppLayout) --
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

const compositionData = {
  total: 59,
  parts: [
    { key: 'Ambient heat', value: 24, share: 41 },
    { key: 'Route duration', value: 11, share: 19 },
    { key: 'Container age', value: 9, share: 15 },
    { key: 'Dock delay', value: 6, share: 10 },
    { key: 'Fleet gen', value: 4, share: 7 },
  ],
  other: { value: 5, share: 8 },
}

function mulberry32(seed: number) {
  let s = seed | 0
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rand = mulberry32(99)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const trendData = {
  series: [
    { name: 'Southwest', points: months.map((m, i) => ({ t: m, value: +(4 + 8 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + rand() * 0.6).toFixed(2) })) },
    { name: 'Northeast', points: months.map((m, i) => ({ t: m, value: +(1 + 2 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + rand() * 0.3).toFixed(2) })) },
    { name: 'Midwest', points: months.map((m, i) => ({ t: m, value: +(1.5 + 3 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + rand() * 0.4).toFixed(2) })) },
  ],
}

const factorDeltas = [
  { key: 'Ambient heat', value: 2.4 },
  { key: 'Dock delay', value: -1.8 },
  { key: 'Route duration', value: 1.1 },
  { key: 'Container age', value: -0.7 },
  { key: 'Fleet gen', value: 0.4 },
  { key: 'Driver break', value: -2.9 },
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

const pairedData = {
  rows: [
    { key: 'Southwest', left: 11.9, right: 14.2, sign: 'negative' as const },
    { key: 'Southeast', left: 4.8, right: 5.4, sign: 'negative' as const },
    { key: 'Pacific', left: 3.3, right: 3.1, sign: 'positive' as const },
    { key: 'Midwest', left: 3.0, right: 2.8, sign: 'positive' as const },
    { key: 'Northeast', left: 2.5, right: 2.1, sign: 'positive' as const },
  ],
}
</script>
