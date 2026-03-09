<template>
  <div
      class="bg-base-100 border-2 rounded-lg min-w-[180px] shadow-md transition-all duration-200 flex flex-col"
      :class="{
      'shadow-[0_0_0_2px_var(--node-color),0_0_20px_rgba(0,0,0,0.3),0_0_40px_color-mix(in_srgb,var(--node-color)_40%,transparent)] border-[3px] scale-[1.02]': isSelected 
    }"
      :style="{
      borderColor: nodeColor,
      '--node-color': nodeColor 
    }"
  >
    <div
        class="flex items-center gap-2 px-3 py-2 border-b border-base-content/10 bg-base-200 rounded-t-md"
        :style="isSelected ? { background: `color-mix(in srgb, var(--node-color) 15%, oklch(var(--b2)))` } : {}"
    >
      <Icon :icon="metadata?.icon || ''" class="text-base"/>
      <span class="font-semibold text-[13px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {{ node.name }}
      </span>
      <button
          v-if="supportsPreview"
          class="btn btn-square btn-xs btn-ghost"
          :class="previewEnabled ? 'text-base-content' : 'text-base-content/30'"
          @click.stop="graphStore.toggleNodePreview(node.id)"
          title="Toggle preview"
      >
        <Icon :icon="previewEnabled ? 'ph:eye' : 'ph:eye-slash'"/>
      </button>
      <button
          class="btn btn-square btn-xs btn-ghost btn-error"
          @click.stop="$emit('delete')"
      >
        <Icon icon="ph:trash"/>
      </button>
    </div>

    <div class="flex">
      <!-- Input Ports -->
      <div v-if="inputPorts.length > 0" class="py-2 px-1 flex-1">
        <div
            v-for="port in inputPorts"
            :key="port.id"
            class="flex items-center gap-2 px-2 py-1 relative"
        >
          <Handle
              :id="port.id"
              type="target"
              :position="Position.Left"
              :style="{ background: getPortColor(port.dataType) }"
          />
          <span class="text-[11px] text-base-content/70">{{ port.name }}</span>
        </div>
      </div>

      <!-- Output Ports -->
      <div v-if="outputPorts.length > 0" class="py-2 px-1 flex-1">
        <div
            v-for="port in outputPorts"
            :key="port.id"
            class="flex items-center gap-2 px-2 py-1 relative justify-end"
        >
          <span class="text-[11px] text-base-content/70">{{ port.name }}</span>
          <Handle
              :id="port.id"
              type="source"
              :position="Position.Right"
              :style="{ background: getPortColor(port.dataType) }"
          />
        </div>
      </div>
    </div>

    <!-- Node Preview -->
    <NodePreview
        v-if="previewEnabled && supportsPreview"
        :node="node"
        :node-color="nodeColor"
    />
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {Handle, Position} from '@vue-flow/core'
import {BaseNode} from '../nodes/BaseNode'
import {DATA_TYPE_COLORS, DataType, type NodeMetadata} from '../nodes/types'
import {Icon} from "@iconify/vue";
import {useGraphStore} from '../stores/graphStore'
import NodePreview from './NodePreview.vue'

interface Props {
  data: {
    node: BaseNode
    metadata?: NodeMetadata
  }
}

const emits = defineEmits<{
  delete: []
}>()

const props = defineProps<Props>()
const graphStore = useGraphStore()

const node = computed(() => props.data.node)
const metadata = computed(() => props.data.metadata)

const inputPorts = computed(() => node.value.getInputPorts())
const outputPorts = computed(() => node.value.getOutputPorts())

const nodeColor = computed(() => metadata.value?.color || '#6b7280')
const isSelected = computed(() => graphStore.selectedNodeId === node.value.id)

const supportsPreview = computed(() => {
  if (node.value.type === 'tone-synth') return true
  return node.value.getOutputPorts().some(p => p.dataType === DataType.CANVAS)
})
const previewEnabled = computed(() => graphStore.isPreviewEnabled(node.value.id))

function getPortColor(dataType: DataType): string {
  return DATA_TYPE_COLORS[dataType]
}
</script>

<style scoped>
:deep(.vue-flow__handle) {
  width: 12px;
  height: 12px;
  border: 2px solid oklch(var(--b1));
}

:deep(.vue-flow__handle-left) {
  left: -6px;
}

:deep(.vue-flow__handle-right) {
  right: -6px;
}
</style>
