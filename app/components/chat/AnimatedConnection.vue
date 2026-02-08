<template>
  <g>
    <!-- Connection line -->
    <ConnectionLine
      :x1="x1"
      :y1="y1"
      :x2="x2"
      :y2="y2"
      :is-fork="isFork"
      :is-pulsing="hasAnimation"
      :stroke-width="2"
      :dash-array="isFork ? '4 2' : undefined"
    />

    <!-- Animated flowing effects for temporary nodes -->
    <g v-if="hasAnimation">
      <!-- Hyperbolic-shaped particles (3 chunks) -->
      <AnimatedFlowingChunk
        v-for="j in 3"
        :key="`chunk-${j}`"
        :start-x="x1"
        :end-x="x2"
        :y="y1"
        :index="j - 1"
        :unique-id="uniqueId"
      />

      <!-- Ghostly plume effects (3 plumes) -->
      <GhostlyPlume
        v-for="k in 3"
        :key="`plume-${k}`"
        :start-x="x1"
        :end-x="x2"
        :y="y1"
        :index="k - 1"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import GhostlyPlume from "~/components/chat/GhostlyPlume.vue";
import AnimatedFlowingChunk from "~/components/chat/AnimatedFlowingChunk.vue";
import ConnectionLine from "~/components/chat/ConnectionLine.vue";

defineProps<{
  x1: number
  y1: number
  x2: number
  y2: number
  isFork?: boolean
  hasAnimation?: boolean
  uniqueId: string
}>()
</script>
