<template>
  <div 
    v-if="selectedNode" 
    class="node-settings-panel bg-base-200 shadow-xl border-l border-base-content/10"
    :style="{ '--node-color': nodeColor }"
  >
    <div class="panel-header p-4 border-b border-base-content/10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="icon-wrapper">
            <Icon :icon="metadata?.icon || 'ph:gear'" class="text-xl" />
          </div>
          <h3 class="font-semibold">{{ selectedNode.name }}</h3>
        </div>
        <button 
          @click="$emit('close')" 
          class="btn btn-sm btn-ghost btn-square"
        >
          <Icon icon="ph:x" />
        </button>
      </div>
      <p class="text-xs text-base-content/60 mt-1">{{ metadata?.description }}</p>
    </div>

    <div class="panel-content p-4 overflow-y-auto">
      <div v-if="parameters.length === 0" class="text-sm text-base-content/60 text-center py-8">
        No parameters available
      </div>

      <div v-for="param in parameters" :key="param.id" class="parameter-item">
        <div class="flex gap-2 mb-2 items-center">
          <input 
            type="checkbox" 
            :checked="param.exposedAsInput"
            @change="toggleParameterExposure(param.id)"
            class="checkbox checkbox-xs checkbox-primary mt-1"
            :title="param.exposedAsInput ? 'Hide input port' : 'Expose as input port'"
          />
          <div class="flex-1">
            <label class="text-xs font-medium block mb-1">
              {{ param.name }}
              <span v-if="param.exposedAsInput" class="badge badge-xs badge-primary ml-1">
                input
              </span>
            </label>
            
            <!-- Number Input -->
            <input 
              v-if="param.type === 'number'"
              type="number"
              :value="getParameterValue(param.id)"
              @input="updateParameter(param.id, parseFloat(($event.target as HTMLInputElement).value))"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              class="input input-xs input-bordered w-full"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- String Input -->
            <input 
              v-else-if="param.type === 'string'"
              type="text"
              :value="getParameterValue(param.id)"
              @input="updateParameter(param.id, ($event.target as HTMLInputElement).value)"
              class="input input-xs input-bordered w-full"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- Boolean Input -->
            <input 
              v-else-if="param.type === 'boolean'"
              type="checkbox"
              :checked="getParameterValue(param.id)"
              @change="updateParameter(param.id, ($event.target as HTMLInputElement).checked)"
              class="toggle toggle-xs toggle-primary"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- Select Input -->
            <select 
              v-else-if="param.type === 'select'"
              :value="getParameterValue(param.id)"
              @change="updateParameter(param.id, ($event.target as HTMLSelectElement).value)"
              class="select select-xs select-bordered w-full"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            >
              <option 
                v-for="option in param.options" 
                :key="option.value" 
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <!-- Show connected indicator -->
            <div 
              v-if="param.exposedAsInput && isParameterConnected(param.id)" 
              class="text-xs text-success mt-1 flex items-center gap-1"
            >
              <Icon icon="ph:plug" />
              Connected (using input value)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {Icon} from '@iconify/vue'
import type {BaseNode} from '../nodes/BaseNode'
import type {NodeMetadata} from '../nodes/types'
import {useGraphStore} from '../stores/graphStore'

interface Props {
  selectedNode: BaseNode | null
  metadata?: NodeMetadata
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const graphStore = useGraphStore()

const parameters = computed(() => {
  if (!props.selectedNode) return []
  console.dir(props.selectedNode)
  return props.selectedNode.getParameterDefinitions()
})

const nodeColor = computed(() => props.metadata?.color || '#6b7280')

function getParameterValue(parameterId: string): any {
  if (!props.selectedNode) return undefined
  // Get the raw parameter value (not from input)
  return (props.selectedNode as any).parameters.get(parameterId)
}

function updateParameter(parameterId: string, value: any): void {
  if (!props.selectedNode) return
  props.selectedNode.setParameter(parameterId, value)
}

function toggleParameterExposure(parameterId: string): void {
  if (!props.selectedNode) return
  props.selectedNode.toggleParameterExposure(parameterId)
  // Force update the graph to reflect port changes
  graphStore.updateNodePorts(props.selectedNode.id)
}

function isParameterConnected(parameterId: string): boolean {
  if (!props.selectedNode) return false
  
  const portName = `param_${parameterId}`
  const port = props.selectedNode.getInputPorts().find(p => p.name === portName)
  
  return port?.connected || false
}
</script>

<style scoped>
.node-settings-panel {
  position: fixed;
  top: 56px;
  right: 0;
  width: 320px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  flex-shrink: 0;
  background: color-mix(in srgb, var(--node-color) 15%, oklch(var(--b3)));
  border-left: 4px solid var(--node-color);
  position: relative;
}

.panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--node-color),
    transparent
  );
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--node-color) 20%, transparent);
  color: var(--node-color);
  border: 1px solid color-mix(in srgb, var(--node-color) 30%, transparent);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.parameter-item {
  background: oklch(var(--b1));
  border: 1px solid oklch(var(--bc) / 0.1);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.15s ease;
}

.parameter-item:hover {
  background: oklch(var(--b2));
  border-color: color-mix(in srgb, var(--node-color) 30%, oklch(var(--bc) / 0.1));
}

.checkbox:checked {
  background-color: var(--node-color);
  border-color: var(--node-color);
}

.badge-primary {
  background-color: color-mix(in srgb, var(--node-color) 80%, transparent);
  color: var(--node-color);
  border: 1px solid color-mix(in srgb, var(--node-color) 40%, transparent);
}

input[type="number"]:focus,
input[type="text"]:focus,
select:focus {
  outline: 2px solid color-mix(in srgb, var(--node-color) 40%, transparent);
  outline-offset: 2px;
}

input[type="number"]:disabled,
input[type="text"]:disabled,
select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-success {
  color: var(--node-color);
}
</style>
