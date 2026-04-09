<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box w-11/12 max-w-5xl">
      <button
          @click="close"
          class="absolute right-2 top-2 btn btn-sm btn-ghost btn-square"
      >
        <Icon icon="ph:x" />
      </button>

      <div class="node-library bg-base-200 p-4 overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">Node Library</h3>
        <h4 class="text-md mb-4">Drag a Node to place it in the Editor</h4>

        <!-- Search -->
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Search nodes..."
            class="input input-bordered input-sm w-full mb-4"
        />

        <!-- Categories -->
        <div v-for="category in categories" :key="category" class="mb-4">
          <template v-if="getNodesByCategory(category).length > 0">
            <h4 class="text-sm font-semibold mb-2 text-base-content/70">
              {{ categoryLabels[category] }}
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="node in getNodesByCategory(category)"
                :key="node.metadata.type"
                :draggable="true"
                @dragstart="onDragStart($event, node.metadata.type)"
                class="node-item p-3 bg-base-100 rounded-b-lg rounded-t-sm cursor-move hover:bg-base-300 transition-colors h-full flex flex-col justify-between"
                :style="{ borderTop: `4px solid ${getNodeBorderColor(node)}` }"
              >
                <div class="flex items-center gap-2">
                  <Icon :icon="node.metadata.icon || 'ph:package'" class="text-xl"/>
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
          </template>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {Icon} from '@iconify/vue'
import {NodeRegistry} from '../nodes/NodeRegistry'
import {getNodeColor, NodeCategory, NodeVisualCategory} from '../nodes/types'

const dialogRef = ref<HTMLDialogElement | null>(null)
const searchQuery = ref('')

const categories = [
  NodeVisualCategory.VIDEO,
  NodeVisualCategory.AUDIO,
  NodeVisualCategory.PROCESSING,
  NodeVisualCategory.CONTROL_FLOW,
  NodeVisualCategory.OUTPUT,
  NodeVisualCategory.UTILITY
]

const categoryLabels: Record<NodeVisualCategory, string> = {
  [NodeVisualCategory.VIDEO]: 'Video',
  [NodeVisualCategory.AUDIO]: 'Audio',
  [NodeVisualCategory.PROCESSING]: 'Processing',
  [NodeVisualCategory.CONTROL_FLOW]: 'Control Flow',
  [NodeVisualCategory.OUTPUT]: 'Output',
  [NodeVisualCategory.UTILITY]: 'Utility'
}

function open() {
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
}

function getNodesByCategory(category: NodeVisualCategory) {
  const all = [
    ...NodeRegistry.getByCategory(NodeCategory.INPUT),
    ...NodeRegistry.getByCategory(NodeCategory.PROCESSOR),
    ...NodeRegistry.getByCategory(NodeCategory.OUTPUT),
    ...NodeRegistry.getByCategory(NodeCategory.UTILITY)
  ]

  let nodes = all
      .filter(node => node.metadata.showInLibrary !== false)
      .filter(node => {
        const type = node.metadata.type
        if (category === NodeVisualCategory.VIDEO) {
          return ['generate-canvas', 'image', 'canvas-transform', 'canvas-merge'].includes(type)
        }
        if (category === NodeVisualCategory.AUDIO) {
          return ['tone-synth'].includes(type)
        }
        if (category === NodeVisualCategory.CONTROL_FLOW) {
          return ['if', 'loop'].includes(type)
        }
        if (category === NodeVisualCategory.OUTPUT) {
          return ['audio-output', 'canvas-output', 'all-peers-output'].includes(type)
        }
        if (category === NodeVisualCategory.UTILITY) {
          return ['comment', 'debug'].includes(type)
        }
        // Processing
        return ![
          'generate-canvas', 'image', 'canvas-transform', 'canvas-merge',
          'tone-synth',
          'if', 'loop',
          'audio-output', 'canvas-output', 'all-peers-output',
          'comment', 'debug'
        ].includes(type)
      })

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

function getNodeBorderColor(node: { metadata: any }): string {
  return getNodeColor(node.metadata)
}

function onDragStart(event: DragEvent, nodeType: string) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/vueflow-nodetype', nodeType)
    setTimeout(() => close(), 1)
  }
}

defineExpose({open, close})
</script>

<style scoped>
.node-item {
  user-select: none;
  /* Optional: gleiche Höhe für Grid-Items */
  min-height: 64px;
}

.node-item:active {
  cursor: grabbing;
}
</style>
