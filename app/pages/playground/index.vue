<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Top bar -->
    <header
        class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">Viz Component Playground</h1>
      <div class="flex items-center gap-2">
        <NuxtLink
            to="/playground/dashboard"
            class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Dashboard demo
        </NuxtLink>
        <NuxtLink
            to="/playground/digest"
            class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Digest demo
        </NuxtLink>
        <NuxtLink
            to="/playground/digest-from-json"
            class="text-xs px-3 py-1 rounded border border-viz-focal bg-viz-focal/10 text-viz-focal font-semibold hover:bg-viz-focal/20"
        >
          Digest from JSON
        </NuxtLink>
        <span class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button
            class="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="toggleDark"
        >
          {{ isDark ? 'Light' : 'Dark' }}
        </button>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar nav -->
      <nav
          class="w-56 shrink-0 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-4 px-3">
        <div v-for="section in sections" :key="section.label" class="mb-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-viz-chrome mb-1">{{ section.label }}</p>
          <a
              v-for="item in section.items"
              :key="item"
              :href="`#${item}`"
              class="block text-xs text-gray-600 dark:text-gray-400 hover:text-viz-base py-0.5 truncate"
          >
            {{ item }}
          </a>
        </div>
      </nav>

      <!-- Main content — ClientOnly because ECharts needs DOM/canvas -->
      <ClientOnly>
        <main class="flex-1 p-6 space-y-12 max-w-5xl">

          <!-- KPI -->
          <Section id-prefix="kpi" title="KPI & Scalar">
            <DemoCard id="KpiCard" title="KpiCard">
              <KpiCard
                  :data="{ value: 3.87, label: 'Excursion rate', delta: -0.42, deltaLabel: 'vs prior quarter', n: 6842 }"
                  color-role="base" title="Q1 2026 Excursion Rate"/>
            </DemoCard>
            <DemoCard id="KpiCardPair" title="KpiCardPair">
              <KpiCardPair
                  :left="{ value: 3.87, label: 'Q1 2026' }"
                  :right="{ value: 4.29, label: 'Q4 2025' }"
                  :delta="-0.42"
                  delta-label="quarter-over-quarter"
                  left-title="Current"
                  right-title="Prior"
              />
            </DemoCard>
            <DemoCard id="Gauge" title="Gauge">
              <Gauge
                  :data="{ value: 3.87, min: 0, max: 10, target: 5.0, bands: [{ from: 0, to: 3, color: 'base' }, { from: 3, to: 5, color: 'severity-muted' }, { from: 5, to: 10, color: 'severity-amber' }] }"
                  title="Excursion Rate Gauge"/>
            </DemoCard>
            <DemoCard id="ProgressRing" title="ProgressRing">
              <ProgressRing :data="{ value: 77, target: 100, centerLabel: '77%' }" title="Target Compliance"/>
            </DemoCard>
            <DemoCard id="Bullet" title="Bullet">
              <Bullet
                  :data="{ value: 3.87, min: 0, max: 10, target: 5.0, bands: [{ from: 0, to: 3 }, { from: 3, to: 5 }, { from: 5, to: 10 }] }"
                  title="Rate vs Target"/>
            </DemoCard>
            <DemoCard id="DualMeanCallout" title="DualMeanCallout">
              <DualMeanCallout
                  :data="{ labelA: 'Full mean', valueA: 4.1, labelB: 'Trimmed mean (5/5)', valueB: 2.7, delta: -1.4 }"
                  title="Outlier-driven Mean"/>
            </DemoCard>
          </Section>

          <!-- Bar -->
          <Section id-prefix="bar" title="Bar Family">
            <DemoCard id="HorizontalBar" title="HorizontalBar">
              <HorizontalBar :data="{ items: barData }" :sections="barSections" title="Excursion Rate by Hub"/>
            </DemoCard>
            <DemoCard id="HorizontalBarWithCutoff" title="HorizontalBarWithCutoff">
              <HorizontalBarWithCutoff :data="{ items: barData }" :cutoff-rank="3" title="Top-3 Hubs (with cutoff)"/>
            </DemoCard>
            <DemoCard id="VerticalBar" title="VerticalBar">
              <VerticalBar :data="{ items: barData.slice(0, 5) }" :sections="verticalSections" title="Hub Rates"/>
            </DemoCard>
            <DemoCard id="ColumnOverTime" title="ColumnOverTime">
              <ColumnOverTime
                  :data="{ points: timePoints }" :sections="columnSections"
                  :highlighted-keys="['Jul', 'Aug']" highlight-color="severity-amber"
                  title="Monthly Excursion Rate"/>
            </DemoCard>
            <DemoCard id="DivergingBar" title="DivergingBar">
              <DivergingBar :data="{ items: divergingData }" title="YoY Change by Factor"/>
            </DemoCard>
            <DemoCard id="TornadoBar" title="TornadoBar">
              <TornadoBar
                  :data="{ rows: tornadoRows, leftName: 'Male', rightName: 'Female' }"
                  title="Population by Age Band"/>
            </DemoCard>
            <DemoCard id="Lollipop" title="Lollipop">
              <Lollipop :data="{ items: barData }" title="Hub Rankings"/>
            </DemoCard>
            <DemoCard id="DivergingLollipop" title="DivergingLollipop">
              <DivergingLollipop :data="{ items: divergingData }" title="Factor Deltas"/>
            </DemoCard>
            <DemoCard id="StackedBar" title="StackedBar">
              <StackedBar :data="stackedData" title="Channel Mix by Quarter"/>
            </DemoCard>
            <DemoCard id="StackedBar100" title="StackedBar100">
              <StackedBar100 :data="stackedData" title="Channel Share (%)"/>
            </DemoCard>
            <DemoCard id="PictorialBar" title="PictorialBar">
              <PictorialBar :data="{ items: barData.slice(0, 4) }" shape="roundRect" title="Top-4 Hubs"/>
            </DemoCard>
            <DemoCard id="TableWithInlineBar" title="TableWithInlineBar">
              <TableWithInlineBar
                  :data="{ rows: barData.map(d => ({ key: d.key, value: d.value, columns: { region: d.key.split(',')[1]?.trim() ?? '' } })) }"
                  title="Hub Rate Table"/>
            </DemoCard>
            <DemoCard id="TableLens" title="TableLens">
              <TableLens :data="{ rows: barData.map(d => ({ key: d.key, value: d.value })) }"/>
            </DemoCard>
          </Section>

          <!-- Line -->
          <Section id-prefix="line" title="Line & Area">
            <DemoCard id="LineChart" title="LineChart">
              <LineChart
                  :data="groupedTimeSeries" :series-colors="lineSeriesColors" title="Regional Rate Trends"
                  :smooth="true"/>
            </DemoCard>
            <DemoCard id="AreaChart" title="AreaChart">
              <AreaChart
                  :data="groupedTimeSeries" :series-colors="lineSeriesColors" title="Stacked Regional Volume"
                  :stacked="true"/>
            </DemoCard>
            <DemoCard id="StepLine" title="StepLine">
              <StepLine :data="{ points: timePoints }" title="Rate Step Function"/>
            </DemoCard>
            <DemoCard id="BandLine" title="BandLine">
              <BandLine
                  :data="{ points: timePoints.map(p => ({ t: p.t, value: p.value, min: +(p.value * 0.7).toFixed(2), max: +(p.value * 1.3).toFixed(2) })) }"
                  title="Rate with 95% CI"/>
            </DemoCard>
            <DemoCard id="RegimeShadedLine" title="RegimeShadedLine">
              <RegimeShadedLine
                  :data="{ points: timePoints }"
                  :regimes="[{ from: 'May', to: 'Aug', color: 'severity-amber', label: 'Summer peak' }, { from: 'Nov', to: 'Dec', color: 'base-muted', label: 'Winter lull' }]"
                  title="Seasonal Regimes"
              />
            </DemoCard>
            <DemoCard id="JoinpointRegression" title="JoinpointRegression">
              <JoinpointRegression :data="joinpointData" title="Structural Break Detection"/>
            </DemoCard>
            <DemoCard id="BaseVsShiftedSlopeOverlay" title="BaseVsShiftedSlopeOverlay">
              <BaseVsShiftedSlopeOverlay
                  :data="groupedTimeSeries" :magnitude-labels="slopeLabels"
                  title="Slope Sensitivity"/>
            </DemoCard>
            <DemoCard id="LinearLogSideBySide" title="LinearLogSideBySide">
              <LinearLogSideBySide
                  :data="{ points: timePoints.map(p => ({ ...p, value: Math.max(0.1, p.value) })) }"
                  title="Linear vs Log Scale"/>
            </DemoCard>
          </Section>

          <!-- Time -->
          <Section id-prefix="time" title="Time Decomposition">
            <DemoCard id="StlDecompositionStack" title="StlDecompositionStack">
              <StlDecompositionStack :data="stlData" title="Rate Decomposition"/>
            </DemoCard>
            <DemoCard id="WrappedYearOverYear" title="WrappedYearOverYear">
              <WrappedYearOverYear :data="wrappedYoY" :series-colors="yoySeriesColors" title="Seasonal Overlay"/>
            </DemoCard>
            <DemoCard id="CalendarHeatmap" title="CalendarHeatmap">
              <CalendarHeatmap :data="calendarData" title="Daily Incident Count"/>
            </DemoCard>
            <DemoCard id="CalendarMultiYearStack" title="CalendarMultiYearStack">
              <CalendarMultiYearStack :data="calendarMultiYearData" title="Multi-year Incident Calendar"/>
            </DemoCard>
          </Section>

          <!-- Scatter -->
          <Section id-prefix="scatter" title="Scatter & Distribution">
            <DemoCard id="Beeswarm" title="Beeswarm">
              <Beeswarm :data="distributionPointData" title="Drive Hours by Route Type"/>
            </DemoCard>
            <DemoCard id="ScatterPlot" title="ScatterPlot">
              <ScatterPlot :data="scatterData" x-label="Route duration (hrs)" y-label="Excursion rate (%)" title="Duration vs Rate"/>
            </DemoCard>
            <DemoCard id="StripPlot" title="StripPlot">
              <StripPlot :data="distributionPointData" title="Drive Hours (jittered)"/>
            </DemoCard>
            <DemoCard id="Histogram" title="Histogram">
              <Histogram :data="histogramData" title="Drive Hour Distribution + KDE"/>
            </DemoCard>
            <DemoCard id="Violin" title="Violin">
              <Violin :data="violinData" title="Route Duration by Type"/>
            </DemoCard>
            <DemoCard id="SplitViolin" title="SplitViolin">
              <SplitViolin :data="splitViolinData" title="Pre vs Post Intervention"/>
            </DemoCard>
            <DemoCard id="BoxPlot" title="BoxPlot">
              <BoxPlot :data="boxData" title="Rate by Hub"/>
            </DemoCard>
            <DemoCard id="QQPlot" title="QQPlot">
              <QQPlot :data="qqData" title="Normality Check"/>
            </DemoCard>
            <DemoCard id="PerBucketRateHistogram" title="PerBucketRateHistogram">
              <PerBucketRateHistogram :data="perBucketRateData" title="Rate by Container Age"/>
            </DemoCard>
          </Section>

          <!-- Comparison -->
          <Section id-prefix="comp" title="Comparison & Change">
            <DemoCard id="Dumbbell" title="Dumbbell">
              <Dumbbell :data="pairedData" title="Prior vs Current by Region"/>
            </DemoCard>
            <DemoCard id="SlopeChart" title="SlopeChart">
              <SlopeChart
                  :data="pairedData" :divergence-map="slopeDivergenceMap" left-label="Q4 2025" right-label="Q1 2026"
                  title="Regional Rate Shift"/>
            </DemoCard>
            <DemoCard id="BumpChart" title="BumpChart">
              <BumpChart :data="bumpData" :series-colors="bumpSeriesColors" title="Insulation Rank by Climate"/>
            </DemoCard>
            <DemoCard id="SmallMultiplesLine" title="SmallMultiplesLine">
              <SmallMultiplesLine :data="smallMultiplesLineData" title="Per-Hub Seasonal Profiles"/>
            </DemoCard>
            <DemoCard id="SmallMultiplesBullet" title="SmallMultiplesBullet">
              <SmallMultiplesBullet :data="smallMultiplesBulletData" title="Regional Rate vs Target"/>
            </DemoCard>
          </Section>

          <!-- Composition -->
          <Section id-prefix="composition" title="Composition">
            <DemoCard id="Donut" title="Donut">
              <Donut :data="compositionData" center-kpi="5.9pp" title="Excursion Lift by Factor"/>
            </DemoCard>
            <DemoCard id="Pie" title="Pie">
              <Pie :data="compositionData" title="Factor Share"/>
            </DemoCard>
            <DemoCard id="Treemap" title="Treemap">
              <Treemap :data="hierarchyData" title="Cause Hierarchy"/>
            </DemoCard>
            <DemoCard id="Sunburst" title="Sunburst">
              <Sunburst :data="hierarchyData" title="Cause Breakdown (radial)"/>
            </DemoCard>
            <DemoCard id="CircularDendrogram" title="CircularDendrogram">
              <CircularDendrogram :data="hierarchyData" title="Cause Taxonomy"/>
            </DemoCard>
            <DemoCard id="Sankey" title="Sankey">
              <Sankey :data="flowData" title="Zone / Fleet / Outcome Flow"/>
            </DemoCard>
            <DemoCard id="VoronoiTreemap" title="VoronoiTreemap">
              <VoronoiTreemap :data="voronoiData" title="Factor Contribution (Voronoi)"/>
            </DemoCard>
            <DemoCard id="Marimekko" title="Marimekko">
              <Marimekko :data="marimekkoData" title="Cause Mix by Region"/>
            </DemoCard>
            <DemoCard id="InfluenceCurtain" title="InfluenceCurtain">
              <InfluenceCurtain :data="influenceCurtainData" title="Pareto (Concentration)"/>
            </DemoCard>
          </Section>

          <!-- Multi-metric -->
          <Section id-prefix="multi" title="Multi-metric">
            <DemoCard id="Radar" title="Radar">
              <Radar :data="radarData" title="Fleet Generation Profile"/>
            </DemoCard>
            <DemoCard id="ParallelCoordinates" title="ParallelCoordinates">
              <ParallelCoordinates :data="parallelData" title="Shipment Dimensions"/>
            </DemoCard>
          </Section>

          <!-- Narrative -->
          <Section id-prefix="narrative" title="Narrative Components">
            <DemoCard id="Headline" title="Headline">
              <Headline text="Excursion rate fell **0.42pp** to **3.87%** in Q1, driven by **container age** controls."/>
            </DemoCard>
            <DemoCard id="Punchline" title="Punchline">
              <Punchline text="Aggregate 3.87% masks a reversal: Southwest rose 2.3pp while all other regions improved."/>
            </DemoCard>
            <DemoCard id="FiredCheckList" title="FiredCheckList">
              <FiredCheckList
                  :checks="[
              { code: 'C1', severity: 'HIGH', text: 'Aggregate trend masks divergent segment behavior (Simpson reversal)' },
              { code: 'T1', severity: 'MED', text: 'Seasonal amplitude increased 40% YoY — summer peaks intensifying' },
              { code: 'R2', severity: 'LOW', text: 'Top-3 cutoff is arbitrary: ranks 3 and 4 differ by <0.2pp' },
            ]"/>
            </DemoCard>
            <DemoCard id="CalloutBox" title="CalloutBox">
              <div class="space-y-2">
                <CalloutBox
                    severity="HIGH"
                    text="Outlier-driven mean: 3 heat-dome shipments lift the headline rate by 1.4pp. Trimmed mean is 2.7%."/>
                <CalloutBox severity="MED" text="Container age threshold at 30mo drives a step-change in excursion rate."/>
                <CalloutBox severity="LOW" text="Fleet Gen A data covers only 12 shipments — interpret with caution."/>
              </div>
            </DemoCard>
            <DemoCard id="SeverityChip" title="SeverityChip">
              <div class="flex gap-2">
                <SeverityChip severity="HIGH"/>
                <SeverityChip severity="MED"/>
                <SeverityChip severity="LOW"/>
              </div>
            </DemoCard>
            <DemoCard id="UnavailableCheckBadge" title="UnavailableCheckBadge">
              <UnavailableCheckBadge label="Signal unavailable"/>
            </DemoCard>
            <DemoCard id="ReceiptsBlock" title="ReceiptsBlock">
              <ReceiptsBlock
                  :items="[
              { label: 'Metric', value: 'excursion rate' },
              { label: 'Grain', value: 'monthly' },
              { label: 'N', value: 6842 },
              { label: 'Period', value: '2024-01 to 2026-03' },
            ]"/>
            </DemoCard>
            <DemoCard id="PageHeader" title="PageHeader">
              <PageHeader title="Summary Statistic" tag="ARCHETYPE-SS"/>
            </DemoCard>
            <DemoCard id="AxisConsideredList" title="AxisConsideredList">
              <AxisConsideredList
                  :axes="[
              { name: 'region', fired: true },
              { name: 'insulation type', fired: true },
              { name: 'fleet gen', fired: false },
              { name: 'container age', fired: false },
            ]"/>
            </DemoCard>
            <DemoCard id="DivergenceBadge" title="DivergenceBadge">
              <div class="flex gap-2">
                <DivergenceBadge direction="high" label="Above"/>
                <DivergenceBadge direction="low" label="Below"/>
                <DivergenceBadge direction="near" label="Near"/>
              </div>
            </DemoCard>
          </Section>

        </main>
        <template #fallback>
          <div class="flex-1 flex items-center justify-center p-12">
            <p class="text-gray-400 text-sm">Loading visualizations...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import Section from './Section.vue'
import DemoCard from './DemoCard.vue'

// KPI
import KpiCard from '~/components/viz/kpi/KpiCard.vue'
import KpiCardPair from '~/components/viz/kpi/KpiCardPair.vue'
import Gauge from '~/components/viz/kpi/Gauge.vue'
import ProgressRing from '~/components/viz/kpi/ProgressRing.vue'
import Bullet from '~/components/viz/kpi/Bullet.vue'
import DualMeanCallout from '~/components/viz/kpi/DualMeanCallout.vue'

// Bar
import HorizontalBar from '~/components/viz/bar/HorizontalBar.vue'
import HorizontalBarWithCutoff from '~/components/viz/bar/HorizontalBarWithCutoff.vue'
import VerticalBar from '~/components/viz/bar/VerticalBar.vue'
import ColumnOverTime from '~/components/viz/bar/ColumnOverTime.vue'
import DivergingBar from '~/components/viz/bar/DivergingBar.vue'
import TornadoBar from '~/components/viz/bar/TornadoBar.vue'
import Lollipop from '~/components/viz/bar/Lollipop.vue'
import DivergingLollipop from '~/components/viz/bar/DivergingLollipop.vue'
import StackedBar from '~/components/viz/bar/StackedBar.vue'
import StackedBar100 from '~/components/viz/bar/StackedBar100.vue'
import PictorialBar from '~/components/viz/bar/PictorialBar.vue'
import TableWithInlineBar from '~/components/viz/bar/TableWithInlineBar.vue'
import TableLens from '~/components/viz/bar/TableLens.vue'

// Line
import LineChart from '~/components/viz/line/LineChart.vue'
import AreaChart from '~/components/viz/line/AreaChart.vue'
import StepLine from '~/components/viz/line/StepLine.vue'
import BandLine from '~/components/viz/line/BandLine.vue'
import RegimeShadedLine from '~/components/viz/line/RegimeShadedLine.vue'
import JoinpointRegression from '~/components/viz/line/JoinpointRegression.vue'
import BaseVsShiftedSlopeOverlay from '~/components/viz/line/BaseVsShiftedSlopeOverlay.vue'
import LinearLogSideBySide from '~/components/viz/line/LinearLogSideBySide.vue'

// Time
import StlDecompositionStack from '~/components/viz/time/StlDecompositionStack.vue'
import WrappedYearOverYear from '~/components/viz/time/WrappedYearOverYear.vue'
import CalendarHeatmap from '~/components/viz/time/CalendarHeatmap.vue'
import CalendarMultiYearStack from '~/components/viz/time/CalendarMultiYearStack.vue'

// Scatter & Distribution
import Beeswarm from '~/components/viz/scatter/Beeswarm.vue'
import ScatterPlot from '~/components/viz/scatter/ScatterPlot.vue'
import StripPlot from '~/components/viz/scatter/StripPlot.vue'
import Histogram from '~/components/viz/scatter/Histogram.vue'
import Violin from '~/components/viz/scatter/Violin.vue'
import SplitViolin, {type SplitViolinProps} from '~/components/viz/scatter/SplitViolin.vue'
import BoxPlot from '~/components/viz/scatter/BoxPlot.vue'
import QQPlot from '~/components/viz/scatter/QQPlot.vue'
import PerBucketRateHistogram from '~/components/viz/scatter/PerBucketRateHistogram.vue'

// Comparison
import Dumbbell from '~/components/viz/comparison/Dumbbell.vue'
import SlopeChart from '~/components/viz/comparison/SlopeChart.vue'
import BumpChart from '~/components/viz/comparison/BumpChart.vue'
import SmallMultiplesLine from '~/components/viz/comparison/SmallMultiplesLine.vue'
import SmallMultiplesBullet from '~/components/viz/comparison/SmallMultiplesBullet.vue'

// Composition
import Donut from '~/components/viz/composition/Donut.vue'
import Pie from '~/components/viz/composition/Pie.vue'
import Treemap from '~/components/viz/composition/Treemap.vue'
import Sunburst from '~/components/viz/composition/Sunburst.vue'
import CircularDendrogram from '~/components/viz/composition/CircularDendrogram.vue'
import Sankey from '~/components/viz/composition/Sankey.vue'
import VoronoiTreemap from '~/components/viz/composition/VoronoiTreemap.vue'
import Marimekko from '~/components/viz/composition/Marimekko.vue'
import InfluenceCurtain from '~/components/viz/composition/InfluenceCurtain.vue'

// Multi-metric
import Radar from '~/components/viz/multi/Radar.vue'
import ParallelCoordinates from '~/components/viz/multi/ParallelCoordinates.vue'

// Narrative
import Headline from '~/components/viz/narrative/Headline.vue'
import Punchline from '~/components/viz/narrative/Punchline.vue'
import FiredCheckList from '~/components/viz/narrative/FiredCheckList.vue'
import CalloutBox from '~/components/viz/narrative/CalloutBox.vue'
import SeverityChip from '~/components/viz/narrative/SeverityChip.vue'
import UnavailableCheckBadge from '~/components/viz/narrative/UnavailableCheckBadge.vue'
import ReceiptsBlock from '~/components/viz/narrative/ReceiptsBlock.vue'
import PageHeader from '~/components/viz/narrative/PageHeader.vue'
import AxisConsideredList from '~/components/viz/narrative/AxisConsideredList.vue'
import DivergenceBadge from '~/components/viz/narrative/DivergenceBadge.vue'

import {histogram, kde} from '~/utils/viz/kdeLayout'
import {qqLayout} from '~/utils/viz/qqLayout'
import type {
  ColorRole,
  GroupedTimeSeriesData,
  HierarchyData,
  HistogramData,
  VoronoiTreemapData
} from "~/components/viz/types";

definePageMeta({layout: false})

// -- Dark mode toggle --
const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

// -- Sidebar sections --
const sections = [
  {label: 'KPI', items: ['KpiCard', 'KpiCardPair', 'Gauge', 'ProgressRing', 'Bullet', 'DualMeanCallout']},
  {
    label: 'Bar',
    items: ['HorizontalBar', 'HorizontalBarWithCutoff', 'VerticalBar', 'ColumnOverTime', 'DivergingBar', 'TornadoBar', 'Lollipop', 'DivergingLollipop', 'StackedBar', 'StackedBar100', 'PictorialBar', 'TableWithInlineBar', 'TableLens']
  },
  {
    label: 'Line',
    items: ['LineChart', 'AreaChart', 'StepLine', 'BandLine', 'RegimeShadedLine', 'JoinpointRegression', 'BaseVsShiftedSlopeOverlay', 'LinearLogSideBySide']
  },
  {label: 'Time', items: ['StlDecompositionStack', 'WrappedYearOverYear', 'CalendarHeatmap', 'CalendarMultiYearStack']},
  {
    label: 'Scatter',
    items: ['Beeswarm', 'ScatterPlot', 'StripPlot', 'Histogram', 'Violin', 'SplitViolin', 'BoxPlot', 'QQPlot', 'PerBucketRateHistogram']
  },
  {label: 'Comparison', items: ['Dumbbell', 'SlopeChart', 'BumpChart', 'SmallMultiplesLine', 'SmallMultiplesBullet']},
  {
    label: 'Composition',
    items: ['Donut', 'Pie', 'Treemap', 'Sunburst', 'CircularDendrogram', 'Sankey', 'VoronoiTreemap', 'Marimekko', 'InfluenceCurtain']
  },
  {label: 'Multi-metric', items: ['Radar', 'ParallelCoordinates']},
  {
    label: 'Narrative',
    items: ['Headline', 'Punchline', 'FiredCheckList', 'CalloutBox', 'SeverityChip', 'UnavailableCheckBadge', 'ReceiptsBlock', 'PageHeader', 'AxisConsideredList', 'DivergenceBadge']
  },
]

// ========================================================================
// Seeded PRNG for deterministic sample data (avoids SSR/client mismatch)
// ========================================================================
function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)

// ========================================================================
// Sample data — domain-realistic scenarios for expressive demos
// ========================================================================

// --- Bar family data: city-level incident rates ---
const barData = [
  {key: 'Phoenix, AZ', value: 14.2},
  {key: 'Tucson, AZ', value: 11.8},
  {key: 'Dallas, TX', value: 9.1},
  {key: 'Houston, TX', value: 7.6},
  {key: 'Atlanta, GA', value: 5.4},
  {key: 'Miami, FL', value: 4.9},
  {key: 'Denver, CO', value: 3.2},
]

// YoY change per operational category — mixed positive/negative
const divergingData = [
  {key: 'Ambient heat', value: 2.4},
  {key: 'Dock delay', value: -1.8},
  {key: 'Route duration', value: 1.1},
  {key: 'Container age', value: -0.7},
  {key: 'Fleet gen', value: 0.4},
  {key: 'Driver break', value: -2.9},
]

// Population pyramid by age band
const tornadoRows = [
  {key: '0-17', left: 42, right: 38},
  {key: '18-24', left: 55, right: 51},
  {key: '25-34', left: 68, right: 72},
  {key: '35-44', left: 74, right: 79},
  {key: '45-54', left: 62, right: 58},
  {key: '55+', left: 45, right: 48},
]

// Channel mix by quarter
const stackedData = {
  categories: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'],
  series: [
    {name: 'Direct', values: [120, 150, 180, 210]},
    {name: 'Partner', values: [80, 70, 65, 90]},
    {name: 'Marketplace', values: [40, 55, 60, 45]},
  ],
}

// Section coloring for bars — top hubs vs trailing
const barSections = [
  {start: 0, end: 2, color: 'focal' as const},
  {start: 3, end: 4, color: 'base' as const},
  {start: 5, end: 6, color: 'chrome' as const},
]

const verticalSections = [
  {start: 0, end: 1, color: 'focal' as const},
  {start: 2, end: 3, color: 'severity-amber' as const},
  {start: 4, end: 4, color: 'chrome' as const},
]

const columnSections = [
  {start: 0, end: 2, color: 'base-muted' as const},
  {start: 3, end: 7, color: 'base' as const},
  {start: 8, end: 11, color: 'focal' as const},
]

// --- Time series: monthly excursion rate with seasonality ---
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const timePoints = months.map((m, i) => ({
  t: m,
  value: +(2.5 + 5 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + (rand() - 0.5) * 0.8).toFixed(2),
}))

const groupedTimeSeries: GroupedTimeSeriesData = {
  series: [
    {name: 'Southwest', points: timePoints.map(p => ({t: p.t, value: +(p.value * 1.6 + rand() * 0.5).toFixed(2)}))},
    {name: 'Northeast', points: timePoints.map(p => ({t: p.t, value: +(p.value * 0.4 + rand() * 0.3).toFixed(2)}))},
    {name: 'Midwest', points: timePoints.map(p => ({t: p.t, value: +(p.value * 0.7 + rand() * 0.4).toFixed(2)}))},
  ],
}

const lineSeriesColors: ColorRole[] = []

// Joinpoint: rate with structural breaks
const joinpointData = {
  segments: [
    {from: {t: 'Jan', value: 3.2}, to: {t: 'Apr', value: 5.8}},
    {from: {t: 'Apr', value: 5.8}, to: {t: 'Aug', value: 4.1}},
    {from: {t: 'Aug', value: 4.1}, to: {t: 'Dec', value: 7.4}},
  ],
  joinpoints: [
    {t: 'Apr', value: 5.8},
    {t: 'Aug', value: 4.1},
  ],
}

const slopeLabels = [
  {t: 'Mar', label: '+1.2pp'},
  {t: 'Jul', label: '-0.9pp'},
  {t: 'Nov', label: '+1.5pp'},
]

// STL decomposition: trend + seasonal + remainder
const stlData = {
  points: timePoints.map((p, i) => ({
    t: p.t,
    trend: +(3.0 + i * 0.15).toFixed(2),
    seasonal: +(Math.sin((i - 2) * Math.PI / 6) * 2.5).toFixed(2),
    remainder: +((rand() - 0.5) * 0.8).toFixed(2),
  })),
}

// Year-over-year seasonal comparison
const wrappedYoY = {
  series: [
    {
      year: 2024,
      points: months.map((_, i) => ({
        month: i + 1,
        value: +(2.8 + 4.5 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + rand() * 0.6).toFixed(2),
      })),
    },
    {
      year: 2025,
      points: months.map((_, i) => ({
        month: i + 1,
        value: +(3.4 + 5.2 * Math.max(0, Math.sin((i - 2) * Math.PI / 6)) + rand() * 0.7).toFixed(2),
      })),
    },
  ],
}

const yoySeriesColors: ColorRole[] = [] as const

// Calendar: daily incident counts
const calendarData = {
  year: 2025,
  points: Array.from({length: 365}, (_, i) => {
    const d = new Date(2025, 0, 1 + i)
    const dayOfYear = i
    const seasonal = Math.max(0, Math.sin((dayOfYear - 60) * Math.PI / 180)) * 8
    return {date: d.toISOString().slice(0, 10), value: Math.round(2 + seasonal + rand() * 4)}
  }).filter(p => p.date.startsWith('2025')),
}

const calendarMultiYearData = {
  years: [calendarData, {
    year: 2024,
    points: Array.from({length: 366}, (_, i) => {
      const d = new Date(2024, 0, 1 + i)
      const dayOfYear = i
      const seasonal = Math.max(0, Math.sin((dayOfYear - 60) * Math.PI / 180)) * 6
      return {date: d.toISOString().slice(0, 10), value: Math.round(1.5 + seasonal + rand() * 3)}
    }).filter(p => p.date.startsWith('2024')),
  }],
}

// Scatter: route duration vs excursion rate, sized by shipment volume
const scatterData = {
  points: Array.from({length: 60}, () => {
    const duration = +(4 + rand() * 18).toFixed(1)
    const rate = +(1 + duration * 0.3 + (rand() - 0.5) * 3).toFixed(2)
    const category = rand() < 0.45 ? 'Urban' : 'Rural'
    return {
      x: duration,
      y: Math.max(0, rate),
      size: 4 + Math.round(rand() * 12),
      category,
    }
  }),
}

// Histogram: bimodal route drive hours (urban cluster + rural cluster)
const histValues = Array.from({length: 200}, () => {
  const u1 = rand() || 0.001, u2 = rand()
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return rand() < 0.55 ? 8 + normal * 1.5 : 18 + normal * 2.5
})

const histBins = histogram(histValues, 14).bins
const kdeRaw = kde(histValues)
const maxCount = Math.max(...histBins.map(b => b.count), 1)
const maxKde = Math.max(...kdeRaw.map(p => p[1]), 1)
const histogramData : HistogramData= {
  bins: histBins.map((b, i) => ({
    ...b,
    label: `${b.x0.toFixed(0)}-${b.x1.toFixed(0)}`,
    color: i >= Math.floor(histBins.length * 0.7) ? 'severity-muted' : undefined,
  })),
  densityPoints: kdeRaw.map(([x, y]) => [x, y * (maxCount / maxKde)] as [number, number]),
}

const qqData = qqLayout(histValues)

// Drive hours per group: urban vs rural distributions
const violinSamplesA = Array.from({length: 80}, () => 6 + rand() * 8)
const violinSamplesB = Array.from({length: 80}, () => 12 + rand() * 14)

function makeSwarmPoints(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const range = (sorted[sorted.length - 1] ?? 0) - (sorted[0] ?? 0)
  const binSize = range / 30 || 1
  const bins = new Map<number, number>()
  return sorted.map((v) => {
    const binKey = Math.round(v / binSize)
    const count = bins.get(binKey) ?? 0
    bins.set(binKey, count + 1)
    const offset = ((count % 2 === 0 ? 1 : -1) * Math.ceil(count / 2)) * 0.04
    return {value: v, offset}
  })
}

const violinData = {
  groups: [
    {name: 'Urban routes', values: violinSamplesA},
    {name: 'Rural routes', values: violinSamplesB},
  ],
}

const distributionPointData = {
  groups: [
    {name: 'Urban', points: makeSwarmPoints(violinSamplesA)},
    {name: 'Rural', points: makeSwarmPoints(violinSamplesB)},
  ],
}

const splitViolinData: SplitViolinProps["data"] = {
  categories: ['All routes'],
  series: [
    {
      name: 'Pre-intervention',
      densityByCategory: [kde(Array.from({length: 70}, () => 10 + rand() * 8), {resolution: 50})],
      color: 'base',
    },
    {
      name: 'Post-intervention',
      densityByCategory: [kde(Array.from({length: 70}, () => 7 + rand() * 6), {resolution: 50})],
      color: 'divergent',
    },
  ],
}

// Excursion rate by container age bucket — threshold effect at 30mo
const perBucketRateData = {
  bins: [
    {key: '0-6mo', count: 11},
    {key: '6-12mo', count: 14},
    {key: '12-18mo', count: 19},
    {key: '18-24mo', count: 22},
    {key: '24-30mo', count: 25, color: 'severity-amber' as const},
    {key: '30-36mo', count: 68, color: 'focal' as const},
    {key: '36-42mo', count: 79, color: 'focal' as const},
    {key: '42mo+', count: 92, color: 'focal' as const},
  ],
}

const boxData = {
  groups: [
    {name: 'Phoenix', min: 1.2, q1: 8.5, median: 12.1, q3: 16.8, max: 22.4, outliers: [0.3, 28.1]},
    {name: 'Atlanta', min: 1.8, q1: 3.2, median: 5.4, q3: 7.1, max: 10.5, outliers: [14.2]},
    {name: 'Chicago', min: 0.8, q1: 1.5, median: 2.8, q3: 4.2, max: 6.8},
  ],
}

// Comparison: prior period vs current, by region
const pairedData = {
  rows: [
    {key: 'Southwest', left: 11.9, right: 14.2, sign: 'negative' as const},
    {key: 'Southeast', left: 4.8, right: 5.4, sign: 'negative' as const},
    {key: 'Pacific', left: 3.3, right: 3.1, sign: 'positive' as const},
    {key: 'Midwest', left: 3.0, right: 2.8, sign: 'positive' as const},
    {key: 'Northeast', left: 2.5, right: 2.1, sign: 'positive' as const},
  ],
}

const slopeDivergenceMap = {
  'Southwest': 'high',
  'Southeast': 'high',
  'Pacific': 'near',
  'Midwest': 'low',
  'Northeast': 'low',
} as const

// Rank evolution across climate zones
const bumpData = {
  partitions: ['Cool (<20C)', 'Mild (20-25C)', 'Warm (25-30C)', 'Hot (>30C)'],
  series: [
    {name: 'PUR foam', ranks: [4, 3, 2, 1]},
    {name: 'PIR foam', ranks: [3, 2, 1, 2]},
    {name: 'XPS foam', ranks: [2, 1, 3, 3]},
    {name: 'VIP panel', ranks: [1, 4, 4, 4]},
  ],
}

const bumpSeriesColors: ColorRole[] = []

// Per-hub monthly trends
const hubNames = ['Phoenix', 'Houston', 'Atlanta', 'Chicago', 'Portland', 'Denver']
const smallMultiplesLineData = {
  panels: hubNames.map((name, i) => ({
    name,
    points: months.map((m, mi) => ({
      t: m,
      value: +((2 + i * 1.5) + (6 - i) * Math.max(0, Math.sin((mi - 2) * Math.PI / 6)) + rand() * 0.5).toFixed(2),
    })),
  })),
}

const smallMultiplesBulletData = {
  panels: [
    {name: 'Southwest', value: 14.2, target: 5.0, bands: [{from: 0, to: 3}, {from: 3, to: 5}, {from: 5, to: 20}]},
    {name: 'Southeast', value: 5.4, target: 5.0, bands: [{from: 0, to: 3}, {from: 3, to: 5}, {from: 5, to: 20}]},
    {name: 'Midwest', value: 2.8, target: 5.0, bands: [{from: 0, to: 3}, {from: 3, to: 5}, {from: 5, to: 20}]},
    {name: 'Northeast', value: 2.1, target: 5.0, bands: [{from: 0, to: 3}, {from: 3, to: 5}, {from: 5, to: 20}]},
  ],
}

// Excursion lift by contributing factor
const compositionData = {
  total: 59,
  parts: [
    {key: 'Ambient heat', value: 24, share: 41},
    {key: 'Route duration', value: 11, share: 19},
    {key: 'Container age', value: 9, share: 15},
    {key: 'Dock delay', value: 6, share: 10},
    {key: 'Fleet gen', value: 4, share: 7},
  ],
  other: {value: 5, share: 8},
}

// Cause hierarchy for treemap / sunburst
const hierarchyData: HierarchyData = {
  root: {
    name: 'Excursion causes',
    children: [
      {
        name: 'Ambient heat',
        value: 24,
        children: [
          {name: 'Hot region', value: 18},
          {name: 'Heat dome', value: 6},
        ],
      },
      {
        name: 'Route factors',
        value: 16,
        children: [
          {name: 'Duration', value: 11},
          {name: 'Stop count', value: 5},
        ],
      },
      {
        name: 'Container',
        value: 9,
        children: [
          {name: '>30mo age', value: 7},
          {name: 'VIP type', value: 2},
        ],
      },
      {name: 'Dock delay', value: 6},
      {name: 'Fleet gen', value: 4},
      {name: 'Driver break', value: 3},
      {name: 'Other', value: 2},
    ],
  },
}

// Sankey: region → fleet generation → outcome
const flowData = {
  nodes: [
    {id: 'cool', name: 'Cool zone'},
    {id: 'warm', name: 'Warm zone'},
    {id: 'hot', name: 'Hot zone'},
    {id: 'genA', name: 'Gen A'},
    {id: 'genB', name: 'Gen B'},
    {id: 'genC', name: 'Gen C'},
    {id: 'ok', name: 'OK'},
    {id: 'warn', name: 'Warning'},
    {id: 'exc', name: 'Excursion'},
  ],
  links: [
    {source: 'cool', target: 'genA', value: 40},
    {source: 'cool', target: 'genB', value: 30},
    {source: 'cool', target: 'genC', value: 10},
    {source: 'warm', target: 'genA', value: 25},
    {source: 'warm', target: 'genB', value: 35},
    {source: 'warm', target: 'genC', value: 20},
    {source: 'hot', target: 'genA', value: 10},
    {source: 'hot', target: 'genB', value: 25},
    {source: 'hot', target: 'genC', value: 35},
    {source: 'genA', target: 'ok', value: 55},
    {source: 'genA', target: 'warn', value: 15},
    {source: 'genA', target: 'exc', value: 5},
    {source: 'genB', target: 'ok', value: 60},
    {source: 'genB', target: 'warn', value: 20},
    {source: 'genB', target: 'exc', value: 10},
    {source: 'genC', target: 'ok', value: 30},
    {source: 'genC', target: 'warn', value: 20},
    {source: 'genC', target: 'exc', value: 15},
  ],
}

const voronoiData: VoronoiTreemapData = {
  root: {
    id: 'All causes',
    children: [
      {
        id: 'Ambient heat', children: [
          {id: 'Hot region', weight: 18},
          {id: 'Heat dome', weight: 6},
        ],
      },
      {
        id: 'Route factors', children: [
          {id: 'Duration', weight: 11},
          {id: 'Stop count', weight: 5},
        ],
      },
      {
        id: 'Container', children: [
          {id: '>30mo age', weight: 7},
          {id: 'VIP type', weight: 2},
        ],
      },
      {id: 'Dock delay', weight: 6},
      {id: 'Fleet gen', weight: 4},
      {id: 'Driver break', weight: 3},
      {id: 'Other', weight: 2},
    ],
  },
}

// Marimekko: cause share by region (column width = region volume)
const marimekkoData = {
  columns: [
    {
      key: 'Southwest',
      width: 38,
      segments: [
        {name: 'Ambient heat', value: 50},
        {name: 'Route duration', value: 17},
        {name: 'Container age', value: 12},
        {name: 'Other', value: 21},
      ],
    },
    {
      key: 'Southeast',
      width: 26,
      segments: [
        {name: 'Ambient heat', value: 42},
        {name: 'Route duration', value: 18},
        {name: 'Container age', value: 14},
        {name: 'Other', value: 26},
      ],
    },
    {
      key: 'Midwest',
      width: 20,
      segments: [
        {name: 'Ambient heat', value: 25},
        {name: 'Route duration', value: 22},
        {name: 'Container age', value: 20},
        {name: 'Other', value: 33},
      ],
    },
    {
      key: 'Northeast',
      width: 16,
      segments: [
        {name: 'Ambient heat', value: 18},
        {name: 'Route duration', value: 25},
        {name: 'Container age', value: 22},
        {name: 'Other', value: 35},
      ],
    },
  ],
}

// Pareto-style sorted influence
const influenceCurtainData = {
  items: [
    {key: 'Ambient heat', contribution: 41, cumulative: 41},
    {key: 'Route duration', contribution: 19, cumulative: 60},
    {key: 'Container age', contribution: 15, cumulative: 75},
    {key: 'Dock delay', contribution: 10, cumulative: 85},
    {key: 'Fleet gen', contribution: 7, cumulative: 92},
    {key: 'Other', contribution: 8, cumulative: 100},
  ],
}

// Radar: operational dimensions per fleet generation
const radarData = {
  indicators: [
    {name: 'Insulation', max: 10},
    {name: 'Fuel efficiency', max: 10},
    {name: 'Capacity', max: 10},
    {name: 'Maintenance cost', max: 10},
    {name: 'Reliability', max: 10},
  ],
  series: [
    {name: 'Gen A (legacy)', values: [4, 5, 8, 7, 6]},
    {name: 'Gen B (current)', values: [7, 7, 7, 5, 8]},
    {name: 'Gen C (new)', values: [9, 9, 6, 3, 9]},
  ],
}

// Parallel: shipment-level dimensions
const parallelData = {
  axes: [
    {name: 'Drive hours', min: 0, max: 24},
    {name: 'Ambient temp (C)', min: -5, max: 45},
    {name: 'Container age (mo)', min: 0, max: 48},
    {name: 'Excursion rate (%)', min: 0, max: 20},
  ],
  lines: Array.from({length: 20}, (_, i) => ({
    name: `Shipment ${i + 1}`,
    values: [
      +(4 + rand() * 18).toFixed(1),
      +(5 + rand() * 35).toFixed(1),
      Math.round(rand() * 42),
      +(1 + rand() * 15).toFixed(1),
    ],
  })),
}
</script>
