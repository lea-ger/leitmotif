<template>
  <div class="node-library bg-base-200 p-4 overflow-y-auto">
    <h3 class="text-lg font-bold mb-4">Node Library</h3>
    
    <!-- Search -->
    <input 
      v-model="searchQuery"
      type="text" 
      placeholder="Search nodes..."
      class="input input-bordered input-sm w-full mb-4"
    />
    
    <!-- Categories -->
    <div v-for="category in categories" :key="category" class="mb-4">
      <h4 class="text-sm font-semibold mb-2 text-base-content/70">
        {{ categoryLabels[category] }}
      </h4>
      
      <div class="space-y-2">
        <div
          v-for="node in getNodesByCategory(category)"
          :key="node.metadata.type"
          :draggable="true"
          @dragstart="onDragStart($event, node.metadata.type)"
          class="node-item p-3 bg-base-100 rounded-lg cursor-move hover:bg-base-300 transition-colors"
          :style="{ borderLeft: `4px solid ${node.metadata.color || '#666'}` }"
        >
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ node.metadata.icon || '📦' }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">
                {{ node.metadata.displayName }}
              </div>
              <div class="text-xs text-base-content/60 truncate">
                {{ node.metadata.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NodeRegistry } from '../nodes/NodeRegistry'
import { NodeCategory } from '../nodes/types'

const searchQuery = ref('')

const categories = [
  NodeCategory.INPUT,
  NodeCategory.PROCESSOR,
  NodeCategory.OUTPUT,
  NodeCategory.UTILITY
]

const categoryLabels: Record<NodeCategory, string> = {
  [NodeCategory.INPUT]: 'Input',
  [NodeCategory.PROCESSOR]: 'Processors',
  [NodeCategory.OUTPUT]: 'Output',
  [NodeCategory.UTILITY]: 'Utilities'
}

function getNodesByCategory(category: NodeCategory) {
  let nodes = NodeRegistry.getByCategory(category)
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    nodes = nodes.filter(node => 
      node.metadata.displayName.toLowerCase().includes(query) ||
      node.metadata.description.toLowerCase().includes(query) ||
      node.metadata.type.toLowerCase().includes(query)
    )
  }
  
  return nodes
}

function onDragStart(event: DragEvent, nodeType: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/vueflow-nodetype', nodeType)
  }
}
</script>

<style scoped>
.node-library {
  width: 280px;
  height: 100%;
  border-right: 1px solid oklch(var(--bc) / 0.1);
}

.node-item {
  user-select: none;
}

.node-item:active {
  cursor: grabbing;
}
</style>
