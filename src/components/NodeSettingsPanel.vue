<template>
  <div 
    v-if="selectedNode" 
    class="fixed top-14 right-0 w-80 z-40 flex flex-col bg-base-200 shadow-xl border-l border-base-content/10 panel-slide"
    :style="{ '--node-color': nodeColor }"
  >
    <!-- Header -->
    <div
      class="shrink-0 p-4 border-b border-base-content/10 border-l-4 panel-header-bar"
      :style="{
        background: 'color-mix(in srgb, var(--node-color) 15%, oklch(var(--b3)))',
        borderLeftColor: nodeColor
      }"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded flex items-center justify-center shrink-0"
            :style="{
              background: 'color-mix(in srgb, var(--node-color) 20%, transparent)',
              color: nodeColor,
              border: '1px solid color-mix(in srgb, var(--node-color) 30%, transparent)'
            }"
          >
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

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-if="parameters.length === 0" class="text-sm text-base-content/60 text-center py-8">
        No parameters available
      </div>

      <div
        v-for="param in parameters"
        :key="param.id"
        class="bg-base-100 border border-base-content/10 rounded-lg p-3 transition-all duration-150 hover:bg-base-200 hover:border-base-content/20"
      >
        <div class="flex gap-2 items-start">
          <input 
            type="checkbox" 
            :checked="param.exposedAsInput"
            @change="toggleParameterExposure(param.id)"
            class="checkbox checkbox-xs mt-1"
            :style="param.exposedAsInput ? { '--chkbg': nodeColor, '--chkfg': '#fff', accentColor: nodeColor } : {}"
            :title="param.exposedAsInput ? 'Hide input port' : 'Expose as input port'"
          />
          <div class="flex-1 min-w-0">
            <label class="text-xs font-medium block mb-1">
              {{ param.name }}
              <span
                v-if="param.exposedAsInput"
                class="ml-1 inline-flex items-center rounded px-1 py-0 text-[10px] font-semibold"
                :style="{
                  background: 'color-mix(in srgb, var(--node-color) 20%, transparent)',
                  color: nodeColor,
                  border: '1px solid color-mix(in srgb, var(--node-color) 40%, transparent)'
                }"
              >
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
              class="input input-xs input-bordered w-full disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- String Input -->
            <input 
              v-else-if="param.type === 'string'"
              type="text"
              :value="getParameterValue(param.id)"
              @input="updateParameter(param.id, ($event.target as HTMLInputElement).value)"
              class="input input-xs input-bordered w-full disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- Boolean Input -->
            <input 
              v-else-if="param.type === 'boolean'"
              type="checkbox"
              :checked="getParameterValue(param.id)"
              @change="updateParameter(param.id, ($event.target as HTMLInputElement).checked)"
              class="toggle toggle-xs toggle-primary disabled:opacity-50"
              :disabled="param.exposedAsInput && isParameterConnected(param.id)"
            />

            <!-- Select Input -->
            <select 
              v-else-if="param.type === 'select'"
              :value="getParameterValue(param.id)"
              @change="updateParameter(param.id, ($event.target as HTMLSelectElement).value)"
              class="select select-xs select-bordered w-full disabled:opacity-50 disabled:cursor-not-allowed"
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

            <!-- Image Upload -->
            <div v-else-if="param.type === 'image'" class="flex flex-col gap-2">
              <div
                v-if="getParameterValue(param.id)"
                class="rounded overflow-hidden border border-base-content/10 max-h-32 flex items-center justify-center bg-base-300"
              >
                <img
                  :src="getParameterValue(param.id)"
                  class="max-w-full max-h-32 object-contain"
                  alt="preview"
                />
              </div>
              <label class="btn btn-xs btn-outline w-full cursor-pointer">
                <Icon icon="ph:upload-simple" />
                {{ getParameterValue(param.id) ? 'Replace Image' : 'Upload Image' }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onImageUpload(param.id, $event)"
                />
              </label>
              <button
                v-if="getParameterValue(param.id)"
                class="btn btn-xs btn-ghost btn-error w-full"
                @click="updateParameter(param.id, '')"
              >
                <Icon icon="ph:trash" /> Remove
              </button>
            </div>

            <!-- Connected indicator -->
            <div 
              v-if="param.exposedAsInput && isParameterConnected(param.id)" 
              class="text-xs mt-1 flex items-center gap-1"
              :style="{ color: nodeColor }"
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
  return props.selectedNode.getParameterDefinitions()
})

const nodeColor = computed(() => props.metadata?.color || '#6b7280')

function getParameterValue(parameterId: string): any {
  if (!props.selectedNode) return undefined
  return (props.selectedNode as any).parameters.get(parameterId)
}

function updateParameter(parameterId: string, value: any): void {
  if (!props.selectedNode) return
  props.selectedNode.setParameter(parameterId, value)
}

function toggleParameterExposure(parameterId: string): void {
  if (!props.selectedNode) return
  props.selectedNode.toggleParameterExposure(parameterId)
  graphStore.updateNodePorts(props.selectedNode.id)
}

function isParameterConnected(parameterId: string): boolean {
  if (!props.selectedNode) return false
  const portName = `param_${parameterId}`
  const port = props.selectedNode.getInputPorts().find(p => p.name === portName)
  return port?.connected || false
}

function onImageUpload(parameterId: string, event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !props.selectedNode) return
  const reader = new FileReader()
  reader.onload = () => {
    props.selectedNode!.setParameter(parameterId, reader.result as string)
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.panel-slide {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* Top accent bar — pseudo-element can't be done inline */
.panel-header-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--node-color), transparent);
}

.panel-header-bar {
  position: relative;
}
</style>
