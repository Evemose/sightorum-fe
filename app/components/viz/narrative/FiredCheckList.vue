<template>
  <ul class="space-y-1.5">
    <li
      v-for="check in sortedChecks"
      :key="check.code"
      class="flex items-start gap-2 text-sm"
    >
      <SeverityChip :severity="check.severity" />
      <span class="text-gray-800 dark:text-gray-200">
        <span class="font-mono text-xs text-viz-chrome mr-1">{{ check.code }}</span>
        {{ check.text }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SeverityChip from './SeverityChip.vue'
import type { FiredCheck } from '../types'

const props = defineProps<{ checks: FiredCheck[] }>()

const severityOrder = { HIGH: 0, MED: 1, LOW: 2 }

const sortedChecks = computed(() =>
  [...props.checks].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
)
</script>
