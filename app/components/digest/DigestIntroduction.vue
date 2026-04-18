<template>
  <section ref="pageEl" class="digest-page">
    <div class="digest-page__inner">
      <RevealBoundary group-id="intro" :index="0">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug max-w-2xl">
          {{ frame }}
        </h2>
      </RevealBoundary>
      <RevealBoundary group-id="intro" :index="1">
        <p class="mt-4 text-sm text-viz-chrome leading-relaxed max-w-xl">
          {{ scope }}
        </p>
      </RevealBoundary>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import RevealBoundary from './RevealBoundary.vue'

defineProps<{
  frame: string
  scope: string
}>()

const pageEl = ref<HTMLElement>()
const registerPage = inject<(id: string, lastGroup: string, el: HTMLElement) => void>('registerPage')

onMounted(() => {
  if (pageEl.value) registerPage?.('intro', 'intro', pageEl.value)
})
</script>

<style scoped>
.digest-page {
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
.digest-page__inner {
  width: 100%;
  max-width: 640px;
}
</style>
