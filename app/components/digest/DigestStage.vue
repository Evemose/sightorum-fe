<template>
  <section ref="pageEl" class="digest-page">
    <div class="digest-page__inner">
      <RevealBoundary :group-id="`${stageId}-headline`">
        <p class="text-base font-semibold text-gray-800 dark:text-gray-200 leading-snug max-w-xl">
          {{ headline }}
        </p>
      </RevealBoundary>

      <div class="mt-6">
        <RevealBoundary :group-id="`${stageId}-proof`">
          <slot />
        </RevealBoundary>
      </div>

      <div v-if="transition" class="mt-5">
        <RevealBoundary :group-id="`${stageId}-transition`">
          <p class="text-xs text-viz-chrome italic">{{ transition }}</p>
        </RevealBoundary>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import RevealBoundary from './RevealBoundary.vue'

const props = defineProps<{
  stageId: string
  headline: string
  transition?: string
}>()

const registerStage = inject<(id: string, hasTransition: boolean) => void>('registerStage')
const registerPage = inject<(id: string, lastGroup: string, el: HTMLElement) => void>('registerPage')

// Registered in setup so the schedule includes this stage's groups before any
// descendant RevealBoundary's onMounted runs (scroll-trigger observers depend on it).
registerStage?.(props.stageId, !!props.transition)

const pageEl = ref<HTMLElement>()

onMounted(() => {
  if (pageEl.value) {
    const lastGroup = props.transition ? `${props.stageId}-transition` : `${props.stageId}-proof`
    registerPage?.(props.stageId, lastGroup, pageEl.value)
  }
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
  max-width: 720px;
}
</style>
