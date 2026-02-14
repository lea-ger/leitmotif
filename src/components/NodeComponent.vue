<template>
  <div class="custom-node" :style="{ borderColor: nodeColor }">
    <div class="node-header">
      <Icon :icon="metadata?.icon || ''" class="node-icon"></Icon>
      <span class="node-title">{{ node.name }}</span>
    </div>
    
    <!-- Input Ports -->
    <div v-if="inputPorts.length > 0" class="ports inputs">
      <div 
        v-for="port in inputPorts" 
        :key="port.id"
        class="port"
      >
        <Handle
          :id="port.id"
          type="target"
          :position="Position.Left"
          :style="{ background: getPortColor(port.dataType) }"
        />
        <span class="port-label">{{ port.name }}</span>
      </div>
    </div>
    
    <!-- Output Ports -->
    <div v-if="outputPorts.length > 0" class="ports outputs">
      <div 
        v-for="port in outputPorts" 
        :key="port.id"
        class="port"
      >
        <span class="port-label">{{ port.name }}</span>
        <Handle
          :id="port.id"
          type="source"
          :position="Position.Right"
          :style="{ background: getPortColor(port.dataType) }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { BaseNode } from '../nodes/BaseNode'
import { type NodeMetadata, DataType, DATA_TYPE_COLORS } from '../nodes/types'
import { Icon } from "@iconify/vue";

interface Props {
  data: {
    node: BaseNode
    metadata?: NodeMetadata
  }
}

const props = defineProps<Props>()

const node = computed(() => props.data.node)
const metadata = computed(() => props.data.metadata)

const inputPorts = computed(() => node.value.getInputPorts())
const outputPorts = computed(() => node.value.getOutputPorts())

const nodeColor = computed(() => metadata.value?.color || '#6b7280')

function getPortColor(dataType: DataType): string {
  return DATA_TYPE_COLORS[dataType]
}
</script>

<style scoped>
.custom-node {
  background: oklch(var(--b1));
  border: 2px solid;
  border-radius: 8px;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid oklch(var(--bc) / 0.1);
  background: oklch(var(--b2));
  border-radius: 6px 6px 0 0;
}

.node-icon {
  font-size: 16px;
}

.node-title {
  font-weight: 600;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ports {
  padding: 8px 4px;
}

.port {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  position: relative;
}

.inputs .port {
  justify-content: flex-start;
}

.outputs .port {
  justify-content: flex-end;
}

.port-label {
  font-size: 11px;
  color: oklch(var(--bc) / 0.7);
}

.node-parameters {
  padding: 8px 12px;
  border-top: 1px solid oklch(var(--bc) / 0.1);
  background: oklch(var(--b2) / 0.5);
}

:deep(.vue-flow__handle) {
  width: 12px;
  height: 12px;
  border: 2px solid oklch(var(--b1));
}

:deep(.vue-flow__handle-left) {
  left: -7px;
}

:deep(.vue-flow__handle-right) {
  right: -7px;
}
</style>
