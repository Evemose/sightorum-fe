import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--p-primary-50))',
          100: 'rgb(var(--p-primary-100))',
          200: 'rgb(var(--p-primary-200))',
          300: 'rgb(var(--p-primary-300))',
          400: 'rgb(var(--p-primary-400))',
          500: 'rgb(var(--p-primary-500))',
          600: 'rgb(var(--p-primary-600))',
          700: 'rgb(var(--p-primary-700))',
          800: 'rgb(var(--p-primary-800))',
          900: 'rgb(var(--p-primary-900))',
          950: 'rgb(var(--p-primary-950))'
        },
        /* Viz roles read from CSS custom properties so `.dark` class flips them. */
        viz: {
          base: {
            DEFAULT: 'rgb(var(--viz-base) / <alpha-value>)',
            muted: 'rgb(var(--viz-base-muted) / <alpha-value>)'
          },
          chrome: 'rgb(var(--viz-chrome) / <alpha-value>)',
          severity: {
            amber: 'rgb(var(--viz-severity-amber) / <alpha-value>)',
            muted: 'rgb(var(--viz-severity-muted) / <alpha-value>)',
            low: 'rgb(var(--viz-severity-low) / <alpha-value>)'
          },
          focal: 'rgb(var(--viz-focal) / <alpha-value>)',
          divergent: 'rgb(var(--viz-divergent) / <alpha-value>)',
          delta: {
            positive: 'rgb(var(--viz-delta-positive) / <alpha-value>)',
            negative: 'rgb(var(--viz-delta-negative) / <alpha-value>)'
          },
          error: 'rgb(var(--viz-error) / <alpha-value>)'
        }
      }
    }
  },
  plugins: []
} satisfies Config
