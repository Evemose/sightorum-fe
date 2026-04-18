<template>
  <div
    ref="root"
    class="reveal-boundary"
    :class="animationClass"
    :style="animationStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import type { RevealGroup, AnimationType, Easing } from '~/composables/useRevealState'

const props = defineProps<{
  groupId: string
  /** Element index within group — used for stagger delay */
  index?: number
}>()

const root = ref<HTMLElement | null>(null)

// Injected from Digest
const revealState = inject<{
  isVisible: (id: string) => boolean
  isRevealed: (id: string) => boolean
  observeElement: (groupId: string, el: HTMLElement) => void
}>('revealState')

const schedule = inject<Ref<RevealGroup[]>>('revealSchedule', ref([]))

const group = computed(() => schedule.value.find(g => g.id === props.groupId))

const visible = computed(() => revealState?.isVisible(props.groupId) ?? true)
const done = computed(() => revealState?.isRevealed(props.groupId) ?? true)

const staggerDelay = computed(() => {
  if (!group.value || !props.index) return 0
  return (group.value.animation.staggerMs ?? 0) * props.index
})

const easingMap: Record<Easing, string> = {
  'linear': 'linear',
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

const animationClass = computed(() => {
  if (done.value) return 'reveal--done'
  if (!visible.value) return 'reveal--hidden'
  return 'reveal--animating'
})

const animationStyle = computed(() => {
  const g = group.value
  if (!g || done.value) return {}
  if (!visible.value) return hiddenStyle(g.animation.type)

  const dur = g.animation.durationMs
  const easing = easingMap[g.animation.easing ?? 'ease-out']
  const delay = staggerDelay.value

  return {
    transition: `opacity ${dur}ms ${easing} ${delay}ms, transform ${dur}ms ${easing} ${delay}ms`,
    opacity: '1',
    transform: 'none',
  }
})

function hiddenStyle(type: AnimationType): Record<string, string> {
  switch (type) {
    case 'slideUp':
      return { opacity: '0', transform: 'translateY(24px)' }
    case 'scaleIn':
      return { opacity: '0', transform: 'scale(0.92)' }
    case 'fadeIn':
      return { opacity: '0' }
    case 'strokeDraw':
      return { opacity: '0' }
    case 'none':
    default:
      return {}
  }
}

onMounted(() => {
  if (root.value && group.value?.trigger.kind === 'onScrollIntoView') {
    revealState?.observeElement(props.groupId, root.value)
  }
})
</script>

<style scoped>
.reveal--hidden {
  pointer-events: none;
}
.reveal--done {
  opacity: 1;
  transform: none;
}
</style>
