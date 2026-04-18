<template>
  <section ref="pageEl" class="digest-page">
    <div class="digest-page__inner">
      <div v-if="title" class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-wider text-viz-chrome">{{ title }}</p>
      </div>
      <div class="space-y-10">
        <RevealBoundary
          v-for="beat in beats"
          :key="beat.id"
          :group-id="`${stageId}-${beat.id}`"
        >
          <div v-if="beat.headline" class="mb-4">
            <p class="text-base font-semibold text-gray-800 dark:text-gray-200 leading-snug">
              {{ beat.headline }}
            </p>
            <p
              v-if="beat.note"
              class="mt-1 text-xs text-viz-chrome italic"
            >{{ beat.note }}</p>
          </div>
          <slot :name="beat.id" />
        </RevealBoundary>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import RevealBoundary from './RevealBoundary.vue'

export interface DigestBeat {
  id: string
  headline?: string
  note?: string
}

const props = defineProps<{
  stageId: string
  beats: DigestBeat[]
  title?: string
}>()

const registerMultiStage = inject<(id: string, beatIds: string[]) => void>('registerMultiStage')
const registerPage = inject<(id: string, lastGroup: string, el: HTMLElement) => void>('registerPage')

registerMultiStage?.(props.stageId, props.beats.map(b => b.id))

const pageEl = ref<HTMLElement>()

onMounted(() => {
  if (pageEl.value && props.beats.length > 0) {
    const lastBeat = props.beats[props.beats.length - 1]!
    registerPage?.(props.stageId, `${props.stageId}-${lastBeat.id}`, pageEl.value)
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
  max-width: 860px;
}
</style>
