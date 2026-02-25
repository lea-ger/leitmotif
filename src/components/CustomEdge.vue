<template>
  <BezierEdge v-bind="$props" />

  <EdgeLabelRenderer>
    <button
      class="nodrag nopan absolute btn btn-circle btn-xs btn-ghost bg-base-content/10
             transition-all hover:bg-error hover:text-error-content"
      :class="selected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      :style="{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }"
      title="Remove connection"
      @click.stop="onDelete"
    >
      <Icon icon="ph:x-bold" />
    </button>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BezierEdge, EdgeLabelRenderer, getBezierPath, useVueFlow } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'
import { Icon } from '@iconify/vue'
import { useGraphStore } from '../stores/graphStore'

const props = defineProps<EdgeProps>()

const graphStore = useGraphStore()
const { removeEdges } = useVueFlow()

const labelX = computed(() => getBezierPath({
  sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: props.sourcePosition,
  targetX: props.targetX, targetY: props.targetY, targetPosition: props.targetPosition,
})[1])

const labelY = computed(() => getBezierPath({
  sourceX: props.sourceX, sourceY: props.sourceY, sourcePosition: props.sourcePosition,
  targetX: props.targetX, targetY: props.targetY, targetPosition: props.targetPosition,
})[2])

function onDelete() {
  graphStore.removeConnection(props.id)
  removeEdges([props.id])
}
</script>
