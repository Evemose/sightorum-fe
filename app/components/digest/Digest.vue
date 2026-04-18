<template>
  <div
    ref="digestRoot"
    class="digest bg-white dark:bg-gray-950"
    :class="{ 'digest--fullscreen': isFullscreen }"
    @click="onDigestClick"
  >
    <slot />

    <!-- Controls -->
    <div class="digest__controls">
      <div class="flex gap-1.5">
        <button
          v-for="(_, i) in pageCount"
          :key="i"
          class="w-2 h-2 rounded-full transition-colors"
          :class="i === currentPageIndex ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-300 dark:bg-gray-600'"
          @click.stop="scrollToPage(i)"
        />
      </div>
      <button
        class="text-xs px-3 py-1.5 rounded-full bg-gray-800/70 text-gray-200 hover:bg-gray-800/90 backdrop-blur transition-colors"
        :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        @click.stop="toggleFullscreen"
      >
        {{ isFullscreen ? 'Exit' : 'Full' }}
      </button>
      <button
        v-if="mode === 'autoplay' && !allRevealed"
        class="text-xs px-3 py-1.5 rounded-full bg-gray-800/70 text-gray-200 hover:bg-gray-800/90 backdrop-blur transition-colors"
        @click.stop="reveal.skipToEnd(); scrollToPage(pageCount - 1)"
      >
        Skip &rarr;
      </button>
      <span
        v-if="mode === 'presentation' && !allRevealed"
        class="text-[10px] text-gray-500 dark:text-gray-400"
      >
        Click / Space / &rarr;
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, toRef, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRevealState, type RevealGroup, type RevealTrigger, type DigestMode } from '~/composables/useRevealState'

const props = withDefaults(defineProps<{
  schedule?: RevealGroup[]
  mode?: DigestMode
  gap?: number
}>(), {
  mode: 'autoplay',
  gap: 24,
})

const digestRoot = ref<HTMLElement | null>(null)

// --- Page registration ---
const pages = ref<{ id: string; lastGroup: string; el: HTMLElement }[]>([])
const pageCount = computed(() => pages.value.length)
const currentPageIndex = ref(0)

function registerPage(id: string, lastGroup: string, el: HTMLElement) {
  if (!pages.value.find(p => p.id === id)) {
    pages.value = [...pages.value, { id, lastGroup, el }]
  }
}

function scrollToPage(index: number) {
  const page = pages.value[index]
  if (!page) return
  currentPageIndex.value = index
  page.el.scrollIntoView({ behavior: 'smooth' })
}

provide('registerPage', registerPage)

function onScroll() {
  if (!digestRoot.value) return
  const scrollTop = digestRoot.value.scrollTop
  const viewportH = digestRoot.value.clientHeight
  for (let i = pages.value.length - 1; i >= 0; i--) {
    const page = pages.value[i]!
    if (page.el.offsetTop <= scrollTop + viewportH * 0.4) {
      currentPageIndex.value = i
      break
    }
  }
}

// --- Stage / MultiStage registration (unified, order-preserving) ---
type PageSpec =
  | { kind: 'stage'; id: string; hasTransition: boolean }
  | { kind: 'multiStage'; id: string; beatIds: string[] }

const pageSpecs = ref<PageSpec[]>([])

function registerStage(id: string, hasTransition: boolean) {
  if (!pageSpecs.value.find(s => s.id === id)) {
    pageSpecs.value = [...pageSpecs.value, { kind: 'stage', id, hasTransition }]
  }
}
function registerMultiStage(id: string, beatIds: string[]) {
  if (!pageSpecs.value.find(s => s.id === id)) {
    pageSpecs.value = [...pageSpecs.value, { kind: 'multiStage', id, beatIds }]
  }
}

provide('registerStage', registerStage)
provide('registerMultiStage', registerMultiStage)

// --- Mode-aware auto-generated schedule ---
const autoSchedule = computed((): RevealGroup[] => {
  const groups: RevealGroup[] = []
  const isScroll = props.mode === 'scroll'
  const isPres = props.mode === 'presentation'

  // Trigger for the first group of a page.
  //  - The intro (prevPageLast === null) always auto-reveals on mount so the
  //    user sees a starting state; in scroll mode the IntersectionObserver
  //    fires immediately because the intro page is in view at load.
  //  - Subsequent pages chain in autoplay, scroll-in in scroll mode, or wait
  //    for the user to advance in presentation (manual).
  function firstGroupTrigger(prevPageLast: string | null): RevealTrigger {
    if (prevPageLast === null) {
      if (isScroll) return { kind: 'onScrollIntoView', threshold: 0.2 }
      return { kind: 'onMount', delay: 300 }
    }
    if (isScroll) return { kind: 'onScrollIntoView', threshold: 0.3 }
    if (isPres) return { kind: 'manual' }
    return { kind: 'afterGroup', groupId: prevPageLast, delay: 1000 }
  }

  // Trigger for subsequent beats in a multi-stage. In presentation the user
  // clicks between beats; otherwise beats auto-chain within the page.
  function withinPageBeatTrigger(prevBeatId: string, delay: number): RevealTrigger {
    if (isPres) return { kind: 'manual' }
    return { kind: 'afterGroup', groupId: prevBeatId, delay }
  }

  // Intro
  groups.push({
    id: 'intro',
    elements: ['digest.frame', 'digest.scope'],
    trigger: firstGroupTrigger(null),
    animation: { type: 'slideUp', durationMs: 600, staggerMs: 120 },
  })
  let prevPageLast: string | null = 'intro'

  for (const spec of pageSpecs.value) {
    if (spec.kind === 'stage') {
      const headlineId = `${spec.id}-headline`
      const proofId = `${spec.id}-proof`
      const transitionId = `${spec.id}-transition`

      groups.push({
        id: headlineId,
        elements: [`${spec.id}.headline`],
        trigger: firstGroupTrigger(prevPageLast),
        animation: { type: 'slideUp', durationMs: 450 },
      })
      groups.push({
        id: proofId,
        elements: [`${spec.id}.proof`],
        trigger: { kind: 'afterGroup', groupId: headlineId, delay: 600 },
        animation: { type: 'fadeIn', durationMs: 700 },
      })
      prevPageLast = proofId

      if (spec.hasTransition) {
        groups.push({
          id: transitionId,
          elements: [`${spec.id}.transition`],
          trigger: { kind: 'afterGroup', groupId: proofId, delay: 500 },
          animation: { type: 'fadeIn', durationMs: 400 },
        })
        prevPageLast = transitionId
      }
    } else {
      for (let i = 0; i < spec.beatIds.length; i++) {
        const beatId = spec.beatIds[i]!
        const groupId = `${spec.id}-${beatId}`
        if (i === 0) {
          groups.push({
            id: groupId,
            elements: [`${spec.id}.${beatId}`],
            trigger: firstGroupTrigger(prevPageLast),
            animation: { type: 'slideUp', durationMs: 500, easing: 'ease-out' },
          })
        } else {
          const prevBeatGroupId = `${spec.id}-${spec.beatIds[i - 1]}`
          groups.push({
            id: groupId,
            elements: [`${spec.id}.${beatId}`],
            trigger: withinPageBeatTrigger(prevBeatGroupId, 700),
            animation: { type: 'slideUp', durationMs: 500, easing: 'ease-out' },
          })
        }
        prevPageLast = groupId
      }
    }
  }

  // Punchline
  groups.push({
    id: 'punchline-statement',
    elements: ['punchline.statement'],
    trigger: firstGroupTrigger(prevPageLast),
    animation: { type: 'slideUp', durationMs: 700 },
  })
  groups.push({
    id: 'punchline-proof',
    elements: ['punchline.proof'],
    trigger: { kind: 'afterGroup', groupId: 'punchline-statement', delay: 900 },
    animation: { type: 'scaleIn', durationMs: 900, easing: 'ease-out' },
  })
  prevPageLast = 'punchline-proof'

  // Coda
  groups.push({
    id: 'coda',
    elements: ['coda.readingAcross', 'coda.receipts'],
    trigger: firstGroupTrigger(prevPageLast),
    animation: { type: 'fadeIn', durationMs: 500, staggerMs: 150 },
  })

  return groups
})

const activeSchedule = computed(() => props.schedule ?? autoSchedule.value)

const reveal = useRevealState(activeSchedule, toRef(props, 'mode'))

const allRevealed = computed(() =>
  activeSchedule.value.every(g => reveal.isRevealed(g.id)),
)

provide('revealState', {
  isVisible: reveal.isVisible,
  isRevealed: reveal.isRevealed,
  isAnimating: reveal.isAnimating,
  observeElement: reveal.observeElement,
})
provide('revealSchedule', activeSchedule)

// --- Auto-scroll: when the current page's last reveal group finishes, scroll
// to the next page. Applies in both autoplay and presentation modes; scroll
// mode leaves navigation entirely to the user.
watch(
  () => [...reveal.revealed.value],
  () => {
    if (props.mode === 'scroll') return
    nextTick(() => {
      for (let i = 0; i < pages.value.length - 1; i++) {
        const page = pages.value[i]!
        if (reveal.isRevealed(page.lastGroup) && currentPageIndex.value <= i) {
          const delay = props.mode === 'autoplay' ? 800 : 400
          setTimeout(() => scrollToPage(i + 1), delay)
          break
        }
      }
    })
  },
)

// --- Click-to-advance for presentation mode ---
function onDigestClick(e: MouseEvent) {
  if (props.mode !== 'presentation') return
  // Leave clicks on interactive elements alone
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, [role="button"]')) return
  if (reveal.hasAnimating()) return
  reveal.advanceNext()
}

// --- Fullscreen API ---
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (import.meta.server) return
  if (document.fullscreenElement) {
    document.exitFullscreen?.()
  } else {
    digestRoot.value?.requestFullscreen?.()
  }
}

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement != null
}

// --- Lifecycle ---
onMounted(() => {
  digestRoot.value?.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  digestRoot.value?.removeEventListener('scroll', onScroll)
  if (!import.meta.server) document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.digest {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  position: relative;
}
.digest--fullscreen {
  width: 100vw;
  height: 100vh;
}
.digest__controls {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 12px;
}
/* In fullscreen the element IS the viewport; switch controls to absolute so
   they anchor to the digest instead of the page. */
.digest:fullscreen .digest__controls,
.digest--fullscreen .digest__controls {
  position: absolute;
}
</style>
