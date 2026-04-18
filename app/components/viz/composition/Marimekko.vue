<template>
  <VChart :option="option" :style="{ height: `${height}px` }" autoresize @click="onClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useChartDefaults } from '../useChartDefaults'
import { useVizTheme } from '~/composables/useVizTheme'
import type { SharedChartProps, MarimekkoData, ColorRole } from '../types'

/**
 * Marimekko / Mosaic chart.
 * Uses ECharts custom series to draw variable-width stacked rectangles.
 * Column width encodes one dimension, segment height encodes another.
 */
const props = withDefaults(defineProps<SharedChartProps & { data: MarimekkoData }>(), {
  height: 350,
  colorRole: 'base',
})

const { baseOption, chromeStyle } = useChartDefaults(props)
const { resolve } = useVizTheme()

const palette: ColorRole[] = ['base', 'base-muted', 'chrome', 'divergent']

// Pre-compute layout: x offsets, widths, segment y positions (all as fractions 0–1)
const layout = computed(() => {
  const totalWidth = props.data.columns.reduce((s, c) => s + c.width, 0)
  let xOffset = 0
  return props.data.columns.map(col => {
    const colWidth = col.width / totalWidth
    const totalSegVal = col.segments.reduce((s, seg) => s + seg.value, 0)
    let yOffset = 0
    const segs = col.segments.map((seg, si) => {
      const segHeight = totalSegVal > 0 ? seg.value / totalSegVal : 0
      const result = {
        name: seg.name,
        key: col.key,
        x: xOffset,
        width: colWidth,
        y: yOffset,
        height: segHeight,
        color: resolve((seg.color ?? palette[si % palette.length]) as ColorRole),
        value: seg.value,
      }
      yOffset += segHeight
      return result
    })
    const result = { key: col.key, x: xOffset, width: colWidth, segments: segs }
    xOffset += colWidth
    return result
  })
})

// Flatten all segments into a single data array for renderItem
const flatSegments = computed(() => layout.value.flatMap(col => col.segments))

const option = computed(() => ({
  ...baseOption.value,
  tooltip: {
    trigger: 'item' as const,
    formatter: (params: any) => {
      const seg = flatSegments.value[params.dataIndex]
      return seg ? `${seg.key}<br/>${seg.name}: ${seg.value}` : ''
    },
  },
  xAxis: { show: false, min: 0, max: 1 },
  yAxis: { show: false, min: 0, max: 1 },
  series: [{
    type: 'custom',
    renderItem: (params: any, api: any) => {
      const seg = flatSegments.value[params.dataIndex]
      if (!seg) return { type: 'group', children: [] }

      const [x0, y0] = api.coord([seg.x, seg.y])
      const [x1, y1] = api.coord([seg.x + seg.width, seg.y + seg.height])

      const width = x1 - x0
      const height = Math.abs(y1 - y0)

      return {
        type: 'rect',
        shape: { x: x0, y: Math.min(y0, y1), width, height },
        style: {
          fill: seg.color,
          stroke: '#fff',
          lineWidth: 1.5,
        },
        textContent: width > 40 && height > 16
          ? { type: 'text', style: { text: seg.name, fontSize: 9, fill: '#fff' } }
          : undefined,
        textConfig: { position: 'inside' },
      }
    },
    data: flatSegments.value.map((_, i) => [i]),
    z: 2,
  }],
  // Column labels at bottom
  graphic: layout.value.map(col => ({
    type: 'text' as const,
    left: `${(col.x + col.width / 2) * 100}%`,
    bottom: 4,
    style: {
      text: col.key,
      fill: chromeStyle.value.color,
      fontSize: 10,
      textAlign: 'center' as const,
    },
  })),
}))
</script>
