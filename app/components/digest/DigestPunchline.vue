<template>
  <section ref="pageEl" class="digest-page">
    <div class="digest-page__inner">
      <!-- Statement with focal accent -->
      <RevealBoundary group-id="punchline-statement">
        <div class="border-l-4 border-viz-focal pl-5 py-1">
          <p class="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug max-w-2xl">
            {{ statement }}
          </p>
        </div>
      </RevealBoundary>

      <!-- Proof chart — full width, the payoff -->
      <div class="mt-8">
        <RevealBoundary group-id="punchline-proof">
          <slot />
        </RevealBoundary>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import RevealBoundary from './RevealBoundary.vue'

defineProps<{
  statement: string
}>()

const pageEl = ref<HTMLElement>()
const registerPage = inject<(id: string, lastGroup: string, el: HTMLElement) => void>('registerPage')

onMounted(() => {
  if (pageEl.value) registerPage?.('punchline', 'punchline-proof', pageEl.value)
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
  max-width: 860px;
}
</style>
