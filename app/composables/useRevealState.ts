import { ref, readonly, onMounted, onUnmounted, watch, type Ref } from 'vue'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RevealTrigger =
  | { kind: 'onMount'; delay?: number }
  | { kind: 'afterGroup'; groupId: string; delay?: number }
  | { kind: 'onScrollIntoView'; threshold?: number }
  | { kind: 'afterDelay'; ms: number }
  /** Never fires on its own — only `advanceNext()` or an explicit `revealGroup()` reveals it. */
  | { kind: 'manual' }

export type AnimationType = 'fadeIn' | 'slideUp' | 'scaleIn' | 'strokeDraw' | 'none'
export type Easing = 'linear' | 'ease-out' | 'ease-in-out' | 'spring'

export interface RevealAnimation {
  type: AnimationType
  durationMs: number
  easing?: Easing
  staggerMs?: number
}

export interface RevealGroup {
  id: string
  elements: string[]
  trigger: RevealTrigger
  animation: RevealAnimation
}

export type DigestMode = 'autoplay' | 'scroll' | 'presentation'

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export function useRevealState(
  schedule: Ref<RevealGroup[]>,
  mode: Ref<DigestMode>,
) {
  /** Groups whose animation has completed */
  const revealed = ref(new Set<string>())
  /** Groups currently animating */
  const animating = ref(new Set<string>())
  /** Skip all animations — used by fast-forward */
  const skipped = ref(false)

  const timers: number[] = []

  function cleanup() {
    timers.forEach(t => clearTimeout(t))
    timers.length = 0
  }

  function revealGroup(id: string) {
    const group = schedule.value.find(g => g.id === id)
    if (!group || revealed.value.has(id) || animating.value.has(id)) return

    if (skipped.value || group.animation.type === 'none') {
      revealed.value = new Set([...revealed.value, id])
      processAfterGroupTriggers(id)
      return
    }

    animating.value = new Set([...animating.value, id])

    const totalDuration =
      group.animation.durationMs +
      (group.animation.staggerMs ?? 0) * Math.max(0, group.elements.length - 1)

    const t = window.setTimeout(() => {
      animating.value = new Set([...animating.value].filter(x => x !== id))
      revealed.value = new Set([...revealed.value, id])
      processAfterGroupTriggers(id)
    }, totalDuration)
    timers.push(t)
  }

  function processAfterGroupTriggers(completedId: string) {
    for (const group of schedule.value) {
      if (revealed.value.has(group.id) || animating.value.has(group.id)) continue
      if (group.trigger.kind === 'afterGroup' && group.trigger.groupId === completedId) {
        const delay = group.trigger.delay ?? 0
        const t = window.setTimeout(() => revealGroup(group.id), delay)
        timers.push(t)
      }
    }
  }

  function processOnMountTriggers() {
    for (const group of schedule.value) {
      if (revealed.value.has(group.id) || animating.value.has(group.id)) continue
      if (group.trigger.kind === 'onMount') {
        const delay = group.trigger.delay ?? 0
        const t = window.setTimeout(() => revealGroup(group.id), delay)
        timers.push(t)
      }
      if (group.trigger.kind === 'afterDelay') {
        const t = window.setTimeout(() => revealGroup(group.id), group.trigger.ms)
        timers.push(t)
      }
    }
  }

  /** Advance to the next unrevealed group (for presentation mode) */
  function advanceNext() {
    for (const group of schedule.value) {
      if (!revealed.value.has(group.id) && !animating.value.has(group.id)) {
        revealGroup(group.id)
        return
      }
    }
  }

  /** Skip all remaining animations — instant reveal everything */
  function skipToEnd() {
    skipped.value = true
    cleanup()
    const allIds = schedule.value.map(g => g.id)
    revealed.value = new Set(allIds)
    animating.value = new Set()
  }

  // --- Scroll trigger support (lazy) ---
  // Observers are created on the first observeElement call so RevealBoundary's
  // onMounted hook (which runs before the Digest parent's onMounted) always
  // finds a working observer to attach to.
  const observers = new Map<string, IntersectionObserver>()

  function observeElement(groupId: string, el: HTMLElement) {
    if (import.meta.server) return
    const group = schedule.value.find(g => g.id === groupId)
    if (!group || group.trigger.kind !== 'onScrollIntoView') return

    let obs = observers.get(groupId)
    if (!obs) {
      const threshold = group.trigger.threshold ?? 0.3
      obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              revealGroup(groupId)
              obs!.disconnect()
              observers.delete(groupId)
            }
          }
        },
        { threshold },
      )
      observers.set(groupId, obs)
    }
    obs.observe(el)
  }

  // --- Keyboard support for presentation mode ---
  function onKeydown(e: KeyboardEvent) {
    if (mode.value !== 'presentation') return
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      advanceNext()
    }
  }

  // --- Lifecycle ---
  onMounted(() => {
    // onMount / afterDelay triggers fire in all modes so that a schedule can
    // include "always-on-init" groups (e.g. an intro slide). Groups that must
    // stay dormant until the user advances should use `kind: 'manual'`.
    processOnMountTriggers()
    if (mode.value === 'presentation') {
      window.addEventListener('keydown', onKeydown)
    }
    // Scroll mode: observers are created lazily on the first observeElement
    // call from a RevealBoundary.
  })

  onUnmounted(() => {
    cleanup()
    observers.forEach(o => o.disconnect())
    observers.clear()
    if (!import.meta.server) window.removeEventListener('keydown', onKeydown)
  })

  watch(mode, () => {
    processOnMountTriggers()
  })

  return {
    revealed: readonly(revealed),
    animating: readonly(animating),
    revealGroup,
    advanceNext,
    skipToEnd,
    observeElement,
    isRevealed: (id: string) => revealed.value.has(id),
    isAnimating: (id: string) => animating.value.has(id),
    isVisible: (id: string) => revealed.value.has(id) || animating.value.has(id),
    hasAnimating: () => animating.value.size > 0,
  }
}
