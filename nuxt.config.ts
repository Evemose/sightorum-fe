// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    modules: [
        '@nuxtjs/tailwindcss',
        '@primevue/nuxt-module',
        '@nuxt/eslint'
    ],

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
