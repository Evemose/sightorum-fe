<template>
  <div
    class="flex h-screen bg-[radial-gradient(120%_90%_at_90%_0%,rgb(8_145_178_/_0.08),transparent_55%),radial-gradient(100%_120%_at_15%_100%,rgb(245_158_11_/_0.08),transparent_55%),linear-gradient(180deg,rgb(248_250_252),rgb(241_245_249))] dark:bg-[radial-gradient(120%_100%_at_85%_0%,rgb(8_145_178_/_0.2),transparent_55%),radial-gradient(100%_120%_at_15%_100%,rgb(249_115_22_/_0.12),transparent_55%),linear-gradient(180deg,rgb(2_6_23),rgb(15_23_42))]"
  >
    <aside class="flex w-72 flex-col border-r border-surface-200/70 dark:border-surface-700/80">
      <div class="flex h-20 items-center border-b border-surface-200/70 px-6 dark:border-surface-700/80">
        <span class="text-[1.55rem] font-bold tracking-[0.08em] text-slate-900 dark:text-slate-200">RORM</span>
      </div>

      <nav class="flex-1 space-y-1 p-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-4 py-3 transition"
          :class="[
            isActive(item.to)
              ? 'bg-[linear-gradient(120deg,rgb(15_118_110_/_0.18),rgb(14_116_144_/_0.2))] text-slate-900 dark:bg-[linear-gradient(120deg,rgb(14_116_144_/_0.28),rgb(22_163_74_/_0.2))] dark:text-slate-200'
              : 'text-surface-700 hover:bg-surface-100/70 dark:text-surface-200 dark:hover:bg-surface-700/60'
          ]"
        >
          <i :class="item.icon" class="text-lg" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-surface-200/70 p-4 dark:border-surface-700/80">
        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          severity="secondary"
          text
          class="w-full justify-center"
          @click="toggleDarkMode"
        />
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col overflow-hidden backdrop-blur-[4px]">
      <header class="flex h-16 items-center border-b border-surface-200/70 bg-white/75 px-6 dark:border-surface-700/80 dark:bg-slate-900/70">
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ pageTitle }}</h1>
      </header>

      <div class="flex-1 overflow-auto" :class="contentClass">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/chat', label: 'Research', icon: 'pi pi-sitemap' },
  { to: '/datasets', label: 'Datasets', icon: 'pi pi-database' },
  { to: '/import', label: 'Import', icon: 'pi pi-upload' },
  { to: '/metamodels', label: 'Metamodels', icon: 'pi pi-cog' },
]

const pageTitle = computed(() => {
  const item = navItems.find(n => n.to === route.path || route.path.startsWith(n.to + '/'))
  return item?.label || 'RORM'
})

const isResearchWorkspace = computed(() => route.path.startsWith('/chat/') && route.path !== '/chat')

const contentClass = computed(() => {
  return isResearchWorkspace.value ? 'p-3 md:p-4 lg:p-5' : 'p-6'
})

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const isDark = ref(false)

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

onMounted(() => {
  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark.value)
})
</script>
