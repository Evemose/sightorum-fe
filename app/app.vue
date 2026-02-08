<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
    <NuxtRouteAnnouncer />
    <AppLayout>
      <NuxtPage />
    </AppLayout>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
</script>
