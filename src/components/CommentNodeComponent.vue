<template>
  <div
    class="relative group rounded-lg shadow-sm overflow-hidden bg-yellow-100 border border-yellow-300 transition-shadow duration-200"
    :class="{ 'ring-2 ring-yellow-400': isSelected }"
    :style="{
      width: width + 'px',
      height: height + 'px'
    }"
  >
    <!-- Header/Handle -->
    <div 
      class="h-6 bg-yellow-200/50 flex items-center justify-between px-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <span class="text-[10px] text-yellow-800 font-medium uppercase tracking-wider">Comment</span>
      <button 
        class="btn btn-ghost btn-xs btn-square text-yellow-800 hover:bg-yellow-300/50 h-5 w-5 min-h-0"
        @click.stop="$emit('delete')"
      >
        <Icon icon="ph:trash" class="text-xs" />
      </button>
    </div>

    <!-- Text Area -->
    <textarea
      class="w-full h-[calc(100%-1.5rem)] bg-transparent resize-none p-3 text-sm text-yellow-900 placeholder-yellow-800/40 focus:outline-none font-medium leading-relaxed"
      :value="text"
      @input="updateText"
      @mousedown.stop
      placeholder="Type a comment..."
    ></textarea>

    <!-- Custom Resize Handle -->
    <div
      class="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center text-yellow-500 hover:text-yellow-700 z-50 bg-yellow-100 rounded-tl"
      @mousedown.stop="startResize"
    >
      <Icon icon="ph:corners-out-bold" class="text-xs transform rotate-90" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { CommentNode } from '../nodes/utility/CommentNode'
import { useGraphStore } from '../stores/graphStore'

interface Props {
  data: {
    node: CommentNode
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  delete: []
}>()

const graphStore = useGraphStore()
const node = computed(() => props.data.node)
const isSelected = computed(() => graphStore.selectedNodeId === node.value.id)

const text = computed(() => node.value.getParameter('text') as string)
const width = computed(() => node.value.getParameter('width') as number)
const height = computed(() => node.value.getParameter('height') as number)

function updateText(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value
  node.value.setParameter('text', value)
}

// Resizing logic
function startResize(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  
  const startX = e.clientX
  const startY = e.clientY
  const startWidth = width.value
  const startHeight = height.value

  function onMouseMove(e: MouseEvent) {
    const newWidth = Math.max(150, startWidth + (e.clientX - startX))
    const newHeight = Math.max(100, startHeight + (e.clientY - startY))
    
    node.value.setParameter('width', newWidth)
    node.value.setParameter('height', newHeight)
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
/* Allow textarea to take full height minus header */
textarea {
  font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif; /* Just kidding, use inherit or sans */
  font-family: inherit;
}
</style>
