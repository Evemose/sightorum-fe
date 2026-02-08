<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-surface-0 dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-surface-200 dark:border-surface-700">
        <span class="text-2xl font-bold text-primary-600">RORM</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="[
            isActive(item.to)
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
          ]"
        >
          <i :class="item.icon" class="text-lg" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-surface-200 dark:border-surface-700">
        <Button
          icon="pi pi-moon"
          severity="secondary"
          text
          class="w-full justify-center"
          @click="toggleDarkMode"
        />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-surface-0 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center px-6">
        <h1 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {{ pageTitle }}
        </h1>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6">
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
  { to: '/chat', label: 'Chat', icon: 'pi pi-comments' },
  { to: '/datasets', label: 'Datasets', icon: 'pi pi-database' },
  { to: '/import', label: 'Import', icon: 'pi pi-upload' },
  { to: '/metamodels', label: 'Metamodels', icon: 'pi pi-sitemap' }
]

const pageTitle = computed(() => {
  const item = navItems.find(n => n.to === route.path || route.path.startsWith(n.to + '/'))
  return item?.label || 'RORM'
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
