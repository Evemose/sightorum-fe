<template>
  <p class="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
    <template v-for="(segment, i) in segments" :key="i">
      <span v-if="segment.highlight" class="text-viz-base font-extrabold">{{ segment.text }}</span>
      <template v-else>{{ segment.text }}</template>
    </template>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Text with numeric highlights wrapped in **bold** markers */
  text: string
}>()

/** Parse **highlighted** segments */
const segments = computed(() => {
  const parts: { text: string; highlight: boolean }[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(props.text)) !== null) {
    if (match.index > last) {
      parts.push({ text: props.text.slice(last, match.index), highlight: false })
    }
    parts.push({ text: match[1] ?? '', highlight: true })
    last = match.index + match[0].length
  }
  if (last < props.text.length) {
    parts.push({ text: props.text.slice(last), highlight: false })
  }
  return parts
})
</script>
