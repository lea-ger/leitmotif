<template>
  <div class="editor-view">
    <!-- Toolbar -->
    <div class="toolbar bg-base-300 px-4 py-2 flex items-center gap-4 border-b border-base-content/10">
      <h2 class="text-xl font-bold">Node Editor</h2>
      
      <div class="flex-1" />
      
      <!-- Controls -->
      <button 
        @click="toggleExecution"
        :class="isPlaying ? 'btn-error' : 'btn-success'"
        class="btn btn-sm"
      >
        {{ isPlaying ? '⏸ Stop' : '▶ Play' }}
      </button>
      
      <button 
        @click="clearGraph"
        class="btn btn-sm btn-ghost"
      >
        🗑️ Clear
      </button>
      
      <div class="text-xs text-base-content/60">
        FPS: {{ currentFPS }}
      </div>
    </div>
    
    <div class="editor-content">
      <!-- Node Library -->
      <NodeLibrary />
      
      <!-- Vue Flow Canvas -->
      <div class="flow-container" @drop="onDrop" @dragover.prevent>
        <VueFlow
          v-model:nodes="flowNodes"
          v-model:edges="flowEdges"
          @connect="onConnect"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
          :connection-line-style="{ stroke: '#6366f1', strokeWidth: 2 }"
          :default-zoom="0.8"
          :min-zoom="0.1"
          :max-zoom="2"
        >
          <template #node-custom="nodeProps">
            <NodeComponent :data="nodeProps.data" />
          </template>
        </VueFlow>
      </div>
      
      <!-- Peer Panel -->
      <PeerPanel 
        :peers="connectedPeers"
        @add-peer="addPeerNode"
        @remove-peer="removePeerNode"
        @add-all-peers="addAllPeerNodes"
        @remove-all-peers="removeAllPeerNodes"
        @update-sensors="updatePeerSensors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Connection as FlowConnection, NodeChange, EdgeChange } from '@vue-flow/core'
import { useGraphStore } from '../stores/graphStore'
import { GraphExecutor } from '../engine/GraphExecutor'
import { registerAllNodes } from '../nodes'
import type { BaseNode } from '../nodes/BaseNode'
import NodeLibrary from '../components/NodeLibrary.vue'
import NodeComponent from '../components/NodeComponent.vue'
import PeerPanel from '../components/PeerPanel.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// Register all node types
registerAllNodes()

const graphStore = useGraphStore()
const { flowNodes, flowEdges } = graphStore
const executor = new GraphExecutor(60)

const isPlaying = ref(false)
const currentFPS = ref(0)
let fpsInterval: number | null = null

// Connected peers (placeholder - will be integrated with PeerJS)
const connectedPeers = ref<any[]>([])

// Vue Flow instance
const { project } = useVueFlow()

onMounted(() => {
  // Start FPS counter
  startFPSCounter()
})

onBeforeUnmount(() => {
  executor.stop()
  if (fpsInterval) {
    clearInterval(fpsInterval)
  }
})

// Watch graph changes and update executor
watch([() => graphStore.nodeInstances, () => graphStore.allConnections], () => {
  const nodes = Array.from(graphStore.nodeInstances.values()) as BaseNode[]
  executor.setGraph(nodes, graphStore.allConnections)
}, { deep: true })

function toggleExecution() {
  if (isPlaying.value) {
    executor.stop()
    isPlaying.value = false
  } else {
    executor.start()
    isPlaying.value = true
  }
}

function clearGraph() {
  if (confirm('Clear entire graph?')) {
    graphStore.clear()
  }
}

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/vueflow-nodetype')
  if (!nodeType) return
  
  // Get drop position relative to flow
  const position = project({
    x: event.clientX,
    y: event.clientY
  })
  
  // Add node to graph
  graphStore.addNode(nodeType, position)
}

function onConnect(connection: FlowConnection) {
  graphStore.addConnection(connection)
}

function onNodesChange(changes: NodeChange[]) {
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      graphStore.updateNodePosition(change.id, change.position)
    } else if (change.type === 'remove') {
      graphStore.removeNode(change.id)
    }
  })
}

function onEdgesChange(changes: EdgeChange[]) {
  changes.forEach(change => {
    if (change.type === 'remove') {
      graphStore.removeConnection(change.id)
    }
  })
}

// Peer management
function addPeerNode(peerId: string) {
  const peer = connectedPeers.value.find(p => p.id === peerId)
  if (!peer) return
  
  const position = { x: 100, y: 100 + connectedPeers.value.indexOf(peer) * 150 }
  const node = graphStore.addNode('gyro-input', position)
  
  if (node) {
    peer.addedToGraph = true
    // Will be implemented: node.setPeerId(peerId)
  }
}

function removePeerNode(peerId: string) {
  // Find and remove peer nodes
  const peer = connectedPeers.value.find(p => p.id === peerId)
  if (peer) {
    peer.addedToGraph = false
  }
}

function addAllPeerNodes() {
  connectedPeers.value.forEach(peer => {
    if (!peer.addedToGraph) {
      addPeerNode(peer.id)
    }
  })
}

function removeAllPeerNodes() {
  connectedPeers.value.forEach(peer => {
    if (peer.addedToGraph) {
      removePeerNode(peer.id)
    }
  })
}

function updatePeerSensors(peerId: string, sensors: any) {
  // Will be implemented: Send message to peer to enable/disable sensors
  console.log('Update sensors for peer', peerId, sensors)
}

function startFPSCounter() {
  let frames = 0
  let lastTime = performance.now()
  
  const countFrame = () => {
    frames++
    const now = performance.now()
    
    if (now - lastTime >= 1000) {
      currentFPS.value = Math.round(frames * 1000 / (now - lastTime))
      frames = 0
      lastTime = now
    }
    
    requestAnimationFrame(countFrame)
  }
  
  requestAnimationFrame(countFrame)
}
</script>

<style scoped>
.editor-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: oklch(var(--b1));
}

.toolbar {
  height: 56px;
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.flow-container {
  flex: 1;
  position: relative;
}

:deep(.vue-flow__background) {
  background-color: oklch(var(--b1));
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: oklch(var(--p));
}
</style>
