<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, VoronoiTreemapData } from '../types'
import {
  computeHierarchicalVoronoiTreemap,
  polygonArea,
} from '~/utils/viz/voronoiTreemapLayout'

const props = withDefaults(defineProps<SharedChartProps & { data: VoronoiTreemapData }>(), {
  height: 450,
  colorRole: 'base',
})

const { baseOption } = useChartDefaults(props)
const { itemColor } = useVizTheme()

const layout = computed(() => {
  const radius = Math.floor(props.height / 2) - 4
  return computeHierarchicalVoronoiTreemap(props.data.root, {
    radius,
    ringRatio: 0.055,
    maxIterations: 80,
    convergenceRatio: 0.015,
  })
})

const option = computed(() => {
  const { cells, ring } = layout.value
  const radius = Math.floor(props.height / 2) - 4
  const cx = radius
  const cy = radius
  const outerR = radius
  const innerR = radius * (1 - 0.055)

  const elements: Record<string, unknown>[] = []

  // 1. Background circle (subtle fill)
  elements.push({
    type: 'circle',
    shape: { cx, cy, r: outerR },
    style: { fill: '#f5f3ef', stroke: 'none' },
    z: 0,
    silent: true,
  })

  // 2. Ring sectors — one per top-level group
  for (const seg of ring) {
    elements.push({
      type: 'sector',
      shape: {
        cx, cy,
        r: outerR,
        r0: innerR,
        startAngle: seg.startAngle,
        endAngle: seg.endAngle,
      },
      style: {
        fill: itemColor(seg.groupIndex),
        stroke: '#fff',
        lineWidth: 1.5,
      },
      z: 1,
      silent: true,
    })
  }

  // 3. Leaf cell polygons — filled with group color
  const leafCells = cells.filter(c => c.isLeaf)
  for (const cell of leafCells) {
    elements.push({
      type: 'polygon',
      shape: { points: cell.polygon },
      style: {
        fill: itemColor(cell.groupIndex),
        stroke: '#fff',
        lineWidth: 1.5,
        opacity: 0.82,
      },
      z: 2,
      silent: true,
    })
  }

  // 4. Group cell outlines — thicker borders to show hierarchy
  const groupCells = cells.filter(c => !c.isLeaf)
  for (const cell of groupCells) {
    elements.push({
      type: 'polygon',
      shape: { points: cell.polygon },
      style: {
        fill: 'none',
        stroke: '#fff',
        lineWidth: cell.depth === 0 ? 3.5 : 2.5,
      },
      z: 3,
      silent: true,
    })
  }

  // 5. Labels — text in each leaf cell, sized by area
  for (const cell of leafCells) {
    const area = polygonArea(cell.polygon)
    const fontSize = Math.max(7, Math.min(15, Math.sqrt(area) / 5))
    const showPct = fontSize >= 9
    const label = showPct ? `${cell.id}\n${cell.share.toFixed(1)}%` : cell.id

    elements.push({
      type: 'text',
      style: {
        text: label,
        x: cell.centroid[0],
        y: cell.centroid[1],
        fill: '#fff',
        fontSize,
        fontWeight: 600,
        textAlign: 'center',
        textVerticalAlign: 'middle',
        lineHeight: fontSize * 1.3,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowBlur: 2,
      },
      z: 10,
      silent: true,
    })
  }

  return {
    ...baseOption.value,
    xAxis: { show: false },
    yAxis: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    graphic: { elements },
    tooltip: { show: false },
  }
})
</script>
