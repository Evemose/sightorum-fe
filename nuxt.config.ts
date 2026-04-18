// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    modules: [
        '@nuxtjs/tailwindcss',
        '@primevue/nuxt-module',
        '@nuxt/eslint',
        'nuxt-echarts',
    ],

    echarts: {
        renderer: 'canvas',
        charts: [
            'BarChart', 'LineChart', 'PieChart', 'ScatterChart', 'RadarChart',
            'TreeChart', 'TreemapChart', 'SunburstChart', 'SankeyChart',
            'BoxplotChart', 'GaugeChart', 'CustomChart', 'ParallelChart',
            'PictorialBarChart', 'HeatmapChart',
        ],
        components: [
            'TitleComponent', 'TooltipComponent', 'LegendComponent',
            'GridComponent', 'DataZoomComponent', 'MarkLineComponent',
            'MarkAreaComponent', 'MarkPointComponent', 'ToolboxComponent',
            'GraphicComponent', 'CalendarComponent', 'ParallelComponent',
            'VisualMapComponent', 'DatasetComponent', 'TransformComponent',
        ],
    },

    css: [
        'primeicons/primeicons.css',
        '~/assets/theme.css'
    ],

    primevue: {
        options: {
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.dark'
                }
            },
            ripple: true
        }
    },

    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
        }
    },

    app: {
        head: {
            title: 'RORM - Relational ORM Platform',
            meta: [
                {name: 'description', content: 'RORM Platform Frontend'}
            ]
        }
    }
})