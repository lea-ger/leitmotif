<template>
  <div class="variable-panel" :class="{ 'is-open': isOpen }">
    <!-- Tab strip (always visible) -->
    <div class="tab-strip" @click="isOpen = !isOpen" :title="isOpen ? 'Close Variables Panel' : 'Open Variables Panel'">
      <div class="flex flex-col items-center gap-2 py-3">
        <Icon icon="ph:database" class="text-xl text-success" />
        <span
          class="badge badge-success badge-sm"
          v-if="allVariables.length > 0"
        >{{ allVariables.length }}</span>
        <Icon
          :icon="isOpen ? 'ph:caret-right' : 'ph:caret-left'"
          class="text-sm text-base-content/50 mt-auto"
        />
      </div>
    </div>

    <!-- Panel content -->
    <div class="panel-content bg-base-200">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
        <h3 class="font-bold flex items-center gap-2">
          <Icon icon="ph:database" />
          <span>Variables</span>
          <span class="badge badge-success badge-sm">{{ allVariables.length }}</span>
        </h3>
        <button 
          class="btn btn-ghost btn-xs btn-square"
          @click="variableStore.clearAll"
          title="Clear all variables"
          v-if="allVariables.length > 0"
        >
          <Icon icon="ph:trash" />
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
        <!-- Add Variable Node button -->
        <div>
          <div class="text-xs font-semibold text-base-content/50 mb-2 uppercase tracking-wide">Add Node</div>
          <div
            class="alert alert-success cursor-grab hover:shadow-lg transition-all text-sm"
            draggable="true"
            @dragstart="startDragVariableNode"
          >
            <Icon icon="ph:database" class="text-lg" />
            <span>Variable Node</span>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="allVariables.length === 0" class="text-center text-base-content/50 py-8">
          <Icon icon="ph:database" class="text-4xl mb-2 opacity-30" />
          <p class="text-sm">No variables yet</p>
          <p class="text-xs mt-1">Create a Variable node to get started</p>
        </div>

        <!-- Variables list -->
        <div v-else class="flex flex-col gap-2">
          <div class="text-xs font-semibold text-base-content/50 mb-1 uppercase tracking-wide">Active Variables</div>
          
          <div
            v-for="variable in allVariables"
            :key="variable.name"
            class="bg-base-100 p-3 rounded-lg border border-base-content/10 hover:border-success transition-all"
          >
            <!-- Variable name and type -->
            <div class="flex items-center justify-between mb-1">
              <div class="font-mono text-sm font-semibold text-success">
                {{ variable.name }}
              </div>
              <div class="flex items-center gap-1">
                <span class="badge badge-xs" :class="getTypeBadgeClass(variable.type)">
                  {{ variable.type }}
                </span>
                <button
                  class="btn btn-ghost btn-xs btn-square"
                  @click="variableStore.deleteVariable(variable.name)"
                  title="Delete variable"
                >
                  <Icon icon="ph:x" class="text-xs" />
                </button>
                <button
                  class="btn btn-ghost btn-xs btn-square"
                  @click="togglePersist(variable.name, variable.persist)"
                  :title="variable.persist ? 'Disable persistence' : 'Enable persistence'"
                >
                  <Icon :icon="variable.persist ? 'ph:floppy-disk' : 'ph:clock-counter-clockwise'" class="text-xs" />
                </button>
              </div>
            </div>

            <!-- Variable value -->
            <div class="text-xs text-base-content/70 font-mono break-all">
              {{ formatValue(variable.value) }}
            </div>

            <!-- Last updated -->
            <div class="text-[10px] text-base-content/40 mt-1">
              Updated {{ formatTime(variable.lastUpdated) }}
            </div>
            <div class="text-[10px] mt-1" :class="variable.persist ? 'text-success/70' : 'text-warning/70'">
              {{ variable.persist ? 'persistent' : 'runtime-only' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useVariableStore } from '../stores/variableStore'

const variableStore = useVariableStore()
const isOpen = ref(false)

const allVariables = computed(() => variableStore.allVariables)

/**
 * Start drag for Variable node
 */
function startDragVariableNode(event: DragEvent) {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/leitmotif-node', JSON.stringify({
    type: 'variable'
  }))
}

/**
 * Get badge class for variable type
 */
function getTypeBadgeClass(type: string): string {
  const typeClasses: Record<string, string> = {
    number: 'badge-info',
    string: 'badge-warning',
    boolean: 'badge-accent',
    object: 'badge-secondary',
    array: 'badge-primary',
    unknown: 'badge-ghost'
  }
  return typeClasses[type] || 'badge-ghost'
}

/**
 * Format variable value for display
 */
function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value)
      return str.length > 100 ? str.substring(0, 100) + '...' : str
    } catch {
      return '[Object]'
    }
  }
  
  const str = String(value)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

/**
 * Format time relative to now
 */
function formatTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function togglePersist(name: string, persist: boolean): void {
  const info = variableStore.getVariableInfo(name)
  if (!info) return
  variableStore.setVariable(name, info.value, { persist: !persist })
}
</script>

<style scoped>
.variable-panel {
  position: fixed;
  top: 60px; /* Below navbar */
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  pointer-events: none;
  transition: transform 0.3s ease;
}

.variable-panel.is-open {
  transform: translateX(0);
}

.variable-panel:not(.is-open) {
  transform: translateX(320px); /* Width of panel content */
}

.tab-strip {
  width: 40px;
  background: oklch(var(--b2));
  border-left: 2px solid oklch(var(--bc) / 0.1);
  cursor: pointer;
  pointer-events: all;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.tab-strip:hover {
  background: oklch(var(--b3));
}

.panel-content {
  width: 320px;
  border-left: 2px solid oklch(var(--bc) / 0.1);
  display: flex;
  flex-direction: column;
  pointer-events: all;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
}
</style>
