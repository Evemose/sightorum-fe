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
        }
      }
    }
  },
  plugins: []
} satisfies Config
