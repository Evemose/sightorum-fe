<template>
  <section ref="pageEl" class="digest-page">
    <div class="digest-page__inner">
      <RevealBoundary group-id="coda" :index="0">
        <p
          v-if="readingAcross"
          class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 max-w-xl"
        >
          {{ readingAcross }}
        </p>
      </RevealBoundary>
      <RevealBoundary group-id="coda" :index="1">
        <ReceiptsBlock v-if="receipts?.length" :items="receipts" />
      </RevealBoundary>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import RevealBoundary from './RevealBoundary.vue'
import ReceiptsBlock from '~/components/viz/narrative/ReceiptsBlock.vue'
import type { ReceiptItem } from '~/components/viz/types'

defineProps<{
  readingAcross?: string
  receipts?: ReceiptItem[]
}>()

const pageEl = ref<HTMLElement>()
const registerPage = inject<(id: string, lastGroup: string, el: HTMLElement) => void>('registerPage')

onMounted(() => {
  if (pageEl.value) registerPage?.('coda', 'coda', pageEl.value)
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
