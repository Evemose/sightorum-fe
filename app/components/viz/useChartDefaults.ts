import {computed} from 'vue'
import {useVizTheme} from '~/composables/useVizTheme'
import type {AnnotationDef, ReferenceLineDef, SharedChartProps} from './types'

/**
 * Merges shared chart props (title, subtitle, annotations, referenceLines, colorRole)
 * into a base ECharts option object. Components layer their series-specific config on top.
 */
export function useChartDefaults(props: SharedChartProps) {
    const {resolve, chromeStyle, gridLineStyle} = useVizTheme()

    const primaryColor = computed(() =>
        resolve(props.colorRole ?? 'base')
    )

    const titleOption = computed(() => {
        if (!props.title && !props.subtitle) return {}
        return {
            title: {
                text: props.title ?? '',
                subtext: props.subtitle ?? '',
                left: 'left',
                textStyle: {fontSize: 14, fontWeight: 600, color: props.title ? undefined : 'transparent'},
                subtextStyle: {fontSize: 12, color: chromeStyle.value.color},
            },
        }
    })

    /**
     * Fixed vertical layout zones stacked top-to-bottom. Each zone is
     * either empty (collapsed) or reserves a dedicated band that nothing
     * else renders into — title, annotation, and plot area each own their
     * space so long subtitles can't bleed into top-anchored annotations
     * and axis names can't collide with annotations. Axis names that used
     * to sit at nameLocation:'end' must be moved to the side
     * (nameLocation:'middle' + nameRotate) to stay out of this layout.
     */
    const TITLE_LINE_PX = 22
    const SUBTITLE_LINE_PX = 16
    const TITLE_PAD_PX = 8
    const ANNOTATION_LINE_PX = 14
    const ANNOTATION_PAD_PX = 10

    const titleBlockHeight = computed(() =>
        (props.title ? TITLE_LINE_PX : 0) + (props.subtitle ? SUBTITLE_LINE_PX : 0),
    )

    const hasTopAnchoredAnnotation = computed(() =>
        props.annotations?.some(a =>
            typeof a.anchor === 'string' && a.anchor.startsWith('top'),
        ) ?? false,
    )

    /** Top-corner annotation y (absolute px from chart top). Sits in its
     *  own reserved band below the title block. */
    const topAnnotationY = computed(() =>
        titleBlockHeight.value + (titleBlockHeight.value > 0 ? TITLE_PAD_PX : TITLE_PAD_PX),
    )

    const annotationBandBottom = computed(() =>
        hasTopAnchoredAnnotation.value
            ? topAnnotationY.value + ANNOTATION_LINE_PX
            : titleBlockHeight.value,
    )

    const gridOption = computed(() => {
        const contentBottom = annotationBandBottom.value
        const minTop = props.title || props.subtitle ? 48 : 24
        return {
            grid: {
                top: Math.max(minTop, contentBottom + ANNOTATION_PAD_PX),
                right: 24,
                bottom: 32,
                left: 48,
                containLabel: true,
            },
        }
    })

    const tooltipOption = computed(() => ({
        tooltip: {
            trigger: 'item' as const,
            confine: true,
        },
    }))

    /** Convert ReferenceLineDef[] into ECharts markLine data */
    function buildMarkLines(lines?: ReferenceLineDef[]) {
        if (!lines?.length) return undefined
        return {
            markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: {type: 'dashed' as const, color: chromeStyle.value.color},
                data: lines.map((l) => {
                    const entry: Record<string, unknown> = {
                        label: {formatter: l.label ?? '', position: 'end'},
                    }
                    if (l.axis === 'y') entry.yAxis = l.value
                    else entry.xAxis = l.value
                    if (l.style) entry.lineStyle = {type: l.style}
                    return entry
                }),
            },
        }
    }

    /** Convert AnnotationDef[] into ECharts graphic elements */
    function buildAnnotations(annotations?: AnnotationDef[]) {
        if (!annotations?.length) return undefined
        const topY = topAnnotationY.value
        return annotations.map((a) => {
            const pos = typeof a.anchor === 'string'
                ? cornerToPosition(a.anchor, topY)
                : {left: a.anchor.x, top: a.anchor.y}
            return {
                type: 'text' as const,
                ...pos,
                style: {
                    text: a.text,
                    fill: chromeStyle.value.color,
                    fontSize: 11,
                },
            }
        })
    }

    /** Base ECharts option combining all shared props */
    const baseOption = computed(() => ({
        ...titleOption.value,
        ...gridOption.value,
        ...tooltipOption.value,
        xAxis: {
            axisLabel: chromeStyle.value,
            axisLine: {lineStyle: gridLineStyle.value},
            splitLine: {lineStyle: gridLineStyle.value},
        },
        yAxis: {
            axisLabel: chromeStyle.value,
            axisLine: {lineStyle: gridLineStyle.value},
            splitLine: {lineStyle: gridLineStyle.value},
        },
        graphic: {elements: buildAnnotations(props.annotations) ?? []},
    }))

    /**
     * Inject shared overlays into a component-built option.
     * - Adds chart-level annotations to existing graphics
     * - Adds shared reference lines as a silent overlay series
     */
    function withSharedOverlays(option: Record<string, unknown>) {
        const annotationEls = buildAnnotations(props.annotations)
        const markLine = buildMarkLines(props.referenceLines)

        const next: Record<string, unknown> = {...option}

        if (annotationEls?.length) {
            const existingGraphic = next.graphic
            const existingElements =
                existingGraphic && typeof existingGraphic === 'object'
                    ? (existingGraphic as Record<string, unknown>).elements
                    : undefined
            const existingEls = Array.isArray(existingElements)
                ? existingElements
                : Array.isArray(existingGraphic)
                    ? existingGraphic
                    : []
            next.graphic = {elements: [...existingEls, ...annotationEls]}
        }

        if (markLine?.markLine) {
            const hasCartesianAxes = next.xAxis != null || next.yAxis != null
            const existingSeries = Array.isArray(next.series)
                ? [...next.series]
                : next.series
                    ? [next.series]
                    : []

            // Attach markLine to the first existing series in cartesian charts.
            // Avoid creating a synthetic series, which can break marker rendering.
            if (hasCartesianAxes && existingSeries.length > 0) {
                const first = existingSeries[0]
                if (first && typeof first === 'object') {
                    existingSeries[0] = {
                        ...(first as Record<string, unknown>),
                        ...markLine,
                    }
                    next.series = existingSeries
                }
            }
        }

        return next
    }

    return {
        primaryColor,
        chromeStyle,
        gridLineStyle,
        baseOption,
        buildMarkLines,
        withSharedOverlays,
    }
}

function cornerToPosition(corner: string, topY: number) {
    const map: Record<string, Record<string, string | number>> = {
        'top-left': {left: 8, top: topY},
        'top-right': {right: 8, top: topY},
        'bottom-left': {left: 8, bottom: 8},
        'bottom-right': {right: 8, bottom: 8},
    }
    return map[corner] ?? {left: 8, top: topY}
}
