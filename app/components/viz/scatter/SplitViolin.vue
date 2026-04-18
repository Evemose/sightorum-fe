<template>
  <ClientOnly>
    <VChart :option="option" :style="{ height: `${height}px` }" @click="onClick"/>
  </ClientOnly>
</template>

<script setup lang="ts">
import {computed} from 'vue'

import {useChartDefaults} from '../useChartDefaults'
import {useVizTheme} from '~/composables/useVizTheme'
import type {SharedChartProps, SplitViolinData} from '../types'

export type SplitViolinProps = SharedChartProps & { data: SplitViolinData }

const props = withDefaults(defineProps<SplitViolinProps>(), {
  height: 350,
  colorRole: 'base',
})

const {baseOption, chromeStyle, gridLineStyle, withSharedOverlays} = useChartDefaults(props)
const {resolve} = useVizTheme()

type RenderParams = { dataIndex: number }
type RenderApi = {
  coord: (v: [number, number]) => [number, number]
}

function isDensityPoint(v: unknown): v is [number, number] {
  return Array.isArray(v)
      && v.length >= 2
      && Number.isFinite(v[0])
      && Number.isFinite(v[1])
}

function normalizeDensityGroups(raw: unknown, categoryCount: number): [number, number][][] {
  const groups = Array.isArray(raw) ? raw : []
  return Array.from({length: categoryCount}, (_, i) => {
    const pts = Array.isArray(groups[i]) ? groups[i] : []
    return pts.filter(isDensityPoint)
  })
}

const option = computed(() => {
  const categories = Array.isArray(props.data?.categories) ? props.data.categories : []
  const series = Array.isArray(props.data?.series) ? props.data.series : []

  const emptyOption = () => withSharedOverlays({
    ...baseOption.value,
    xAxis: {type: 'value' as const, min: -0.6, max: 0.4, splitLine: {show: false}},
    yAxis: {type: 'value' as const, splitLine: {lineStyle: gridLineStyle.value}},
    series: [],
  })

  if (series.length !== 2 || !series[0] || !series[1]) return emptyOption()

  const [groupA, groupB] = series
  const densA = normalizeDensityGroups(groupA?.densityByCategory, categories.length)
  const densB = normalizeDensityGroups(groupB?.densityByCategory, categories.length)

  const maxDensity = Math.max(
      ...densA.flatMap(pts => pts.map(p => p[1])),
      ...densB.flatMap(pts => pts.map(p => p[1])),
      0.001,
  )

  if ((!densA.length && !densB.length) || !categories.length) {
    return emptyOption()
  }

  const halfWidth = 0.42

  const buildHalf = (
      densityGroups: [number, number][][],
      side: 'left' | 'right',
      color: string,
      name: string,
  ) => ({
    type: 'custom' as const,
    name,
    renderItem: (params: RenderParams, api: RenderApi) => {
      const gi = params.dataIndex
      const pts = densityGroups[gi]
      if (!pts?.length) return {type: 'group', children: []}

      const center = gi
      const sign = side === 'right' ? 1 : -1
      const sidePts = pts.map(([val, density]) => {
        const dx = (density / maxDensity) * halfWidth
        return api.coord([center + sign * dx, val])
      })
      const ys = pts.map(p => p[0]).filter(Number.isFinite)
      if (!ys.length) return {type: 'group', children: []}
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const closePts = [api.coord([center, maxY]), api.coord([center, minY])]
      const polygon: [number, number][] = [...sidePts, ...closePts]

      const points = polygon.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      if (points.length < 3) return {type: 'group', children: []}

      return {
        type: 'polygon',
        shape: {points},
        style: {fill: color, opacity: 0.55, stroke: color, lineWidth: 1},
      }
    },
    data: categories.map((_, i) => {
      const pts = [...(densA[i] ?? []), ...(densB[i] ?? [])]
      const ys = pts.map(p => p[0])
      const yMid = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0
      return [i, yMid]
    }),
    encode: {x: 0, y: 1},
    z: 2,
  })

  const colorA = resolve(groupA.color ?? 'base')
  const colorB = resolve(groupB.color ?? 'base-muted')

  return withSharedOverlays({
    ...baseOption.value,
    legend: {
      data: [groupA.name, groupB.name],
      textStyle: chromeStyle.value,
    },
    xAxis: {
      type: 'value',
      min: -0.6,
      max: categories.length - 0.4,
      interval: 1,
      axisLabel: {
        ...chromeStyle.value,
        formatter: (v: number) => {
          const i = Math.round(v)
          return Math.abs(v - i) < 0.01 ? (categories[i] ?? '') : ''
        },
      },
      splitLine: {show: false},
    },
    yAxis: {
      type: 'value',
      axisLabel: chromeStyle.value,
      splitLine: {lineStyle: gridLineStyle.value},
    },
    series: [
      {
        ...buildHalf(densA, 'left', colorA, groupA.name),
      },
      {
        ...buildHalf(densB, 'right', colorB, groupB.name),
      },
    ],
  })
})
</script>
