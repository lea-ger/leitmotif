<template>
  <div class="editor-view">
    <!-- Toolbar -->
    <div class="toolbar bg-base-300 px-4 py-2 flex items-center gap-4 border-b border-base-content/10">
      <ul class="menu menu-horizontal rounded-box">
        <li>
          <details>
            <summary>Menu</summary>
            <ul>
              <li><a>Submenu 1</a></li>
              <li><a>Submenu 2</a></li>
            </ul>
          </details>
        </li>
        <li>
          <a>Tutorial</a>
        </li>
        <li><a>Wiki</a></li>
      </ul>

      <div class="flex-1"/>
      <!-- Controls -->
      <button
          @click="toggleExecution"
          :class="isPlaying ? 'btn-success animate-pulse' : 'btn-error'"
          class="btn btn-square"
      >
        <Icon v-if="isPlaying" icon="ph:pause-bold"/>
        <Icon v-else icon="ph:play-bold"/>
      </button>
      
      <!-- Audio Enable Button -->
      <button
          v-if="!audioEnabled"
          @click="enableAudio"
          class="btn btn-sm btn-warning gap-2"
          title="Click to enable audio"
      >
        <Icon icon="ph:speaker-slash"/>
        <span>Enable Audio</span>
      </button>
      <div v-else class="badge badge-success gap-2">
        <Icon icon="ph:speaker-high"/>
        <span>Audio Ready</span>
      </div>

      <button
          @click="clearGraph"
          class="btn btn-sm btn-ghost"
      >
        <Icon icon="ph:trash"/>
      </button>
      <div class="flex-1"/>

      <!-- Room Key Display -->
      <div v-if="sessionStore.formattedRoomKey" class="flex items-center gap-2">
        <span class="text-xs opacity-70">Room:</span>
        <code class="px-3 py-1 bg-base-100 rounded font-mono text-sm font-bold">
          {{ sessionStore.formattedRoomKey }}
        </code>
        <button
            @click="showQRCode"
            class="btn btn-square btn-ghost gap-2"
            title="Show QR Code"
        >
          <Icon icon="ph:qr-code"/>
        </button>
      </div>
      <button
          v-else
          @click="initializeRoom"
          class="btn btn-sm btn-primary"
      >
        Create Room
      </button>
    </div>

    <div class="editor-content relative">
      <!-- Toggle button when panel is closed -->
      <button 
        v-if="!isPeerPanelOpen"
        @click="isPeerPanelOpen = true"
        class="btn btn-circle btn-primary absolute left-4 top-4 z-30"
        title="Open Peers Panel"
      >
        <Icon icon="ph:users-three" />
      </button>
      
      <!-- Peer Panel on Left Side -->
      <PeerPanel
          v-model:is-open="isPeerPanelOpen"
          @add-peer-node="addPeerNodeToGraph"
          @add-all-peers-node="addAllPeersNodeToGraph"
      />
      
      <!-- Main Canvas Area -->
      <div class="flex flex-col absolute w-full h-full">
        <div class="absolute top-4 left-4 font-mono text-xs text-base-content/60 z-10">
          FPS: {{ currentFPS }}
        </div>
        
        <!-- Node Library -->
        <NodeLibraryModal ref="nodeLibraryModalRef"/>

        <!-- Vue Flow Canvas -->
        <div class="flow-container" @drop="onDrop" @dragover.prevent>
          <VueFlow
              v-model:nodes="flowNodes"
              v-model:edges="flowEdges"
              @connect="onConnect"
              @nodes-change="onNodesChange"
              @edges-change="onEdgesChange"
              @node-click="onNodeClick"
              :connection-line-style="{ stroke: '#6366f1', strokeWidth: 2 }"
              :default-zoom="0.8"
              :min-zoom="0.1"
              :max-zoom="2"
          >
            <template #node-custom="nodeProps">
              <NodeComponent :data="nodeProps.data"/>
            </template>
          </VueFlow>
        </div>

        <div class="fab">
          <div
              class="btn btn-lg btn-circle btn-primary"
              @click="showNodeLibrary"
          >
            <Icon icon="ph:plus-bold"/>
          </div>
        </div>
      </div>
    </div>

    <!-- Node Settings Panel -->
    <NodeSettingsPanel 
      :selected-node="graphStore.selectedNode"
      :metadata="selectedNodeMetadata"
      @close="graphStore.selectNode(null)"
    />

    <!-- QR Code Modal -->
    <QRCodeModal ref="qrModalRef"/>

    <dialog class="modal"
            :class="confirmDeleteChange ? 'modal-open' : ''"
    >
      <div class="modal-box">
        <form method="dialog">
          <button
              class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              @click="confirmDeleteChange = null"
          >✕
          </button>
        </form>
        <h3 class="text-lg font-bold">Are you sure?</h3>
        <button class="btn" @click="deleteNodeConfirmed">Confirm</button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, watch, computed} from 'vue'
import {VueFlow, useVueFlow, type NodeRemoveChange} from '@vue-flow/core'
import type {Connection as FlowConnection, NodeChange, EdgeChange} from '@vue-flow/core'
import {useGraphStore} from '../stores/graphStore'
import {usePeerStore} from '../stores/peerStore'
import {useSessionStore} from '../stores/sessionStore'
import {GraphExecutor} from '../engine/GraphExecutor'
import {registerAllNodes} from '../nodes'
import type {BaseNode} from '../nodes/BaseNode'
import {PeerNode} from '../nodes/input/PeerNode'
import NodeComponent from '../components/NodeComponent.vue'
import PeerPanel from '../components/PeerPanel.vue'
import QRCodeModal from '../components/QRCodeModal.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import {Icon} from "@iconify/vue";
import NodeLibraryModal from "../components/NodeLibraryModal.vue";
import NodeSettingsPanel from "../components/NodeSettingsPanel.vue";
import { NodeRegistry } from '../nodes/NodeRegistry';

// Register all node types
registerAllNodes()

const graphStore = useGraphStore()
const peerStore = usePeerStore()
const sessionStore = useSessionStore()
const flowNodes = computed({
  get: () => graphStore.flowNodes,
  set: (value) => {
    graphStore.flowNodes = value
  }
})
const flowEdges = computed({
  get: () => graphStore.flowEdges,
  set: (value) => {
    graphStore.flowEdges = value
  }
})
const executor = new GraphExecutor(60)

const isPlaying = ref(false)
const currentFPS = ref(0)
const isPeerPanelOpen = ref(true)
const audioEnabled = ref(false)
const qrModalRef = ref<InstanceType<typeof QRCodeModal> | null>(null)
const nodeLibraryModalRef = ref<InstanceType<typeof NodeLibraryModal> | null>(null)
const confirmDeleteChange = ref<NodeRemoveChange | null>(null)
const selectedNodeMetadata = computed(() => {
  if (!graphStore.selectedNode) return undefined
  return NodeRegistry.getMetadata(graphStore.selectedNode.type)
})
let fpsInterval: number | null = null

// Vue Flow instance
const {project, applyNodeChanges} = useVueFlow()

onMounted(() => {
  // Start FPS counter
  startFPSCounter()
  
  // Load saved graph from localStorage
  graphStore.loadFromLocalStorage()
})

onBeforeUnmount(() => {
  executor.stop()
  if (fpsInterval) {
    clearInterval(fpsInterval)
  }
  // Save graph before unmounting
  graphStore.saveToLocalStorage()
})

// Watch graph changes and update executor
watch([() => graphStore.nodeInstances, () => graphStore.allConnections], () => {
  const nodes = Array.from(graphStore.nodeInstances.values()) as BaseNode[]
  executor.setGraph(nodes, graphStore.allConnections)
  console.log('Graph updated. Nodes:', nodes.length, 'Connections:', graphStore.allConnections.length)
  // Auto-save to localStorage on changes
  graphStore.saveToLocalStorage()
}, {deep: true})

async function enableAudio() {
  try {
    const Tone = await import('tone')
    await Tone.start()
    audioEnabled.value = true
    console.log('Audio context enabled')
  } catch (error) {
    console.error('Failed to enable audio:', error)
  }
}

async function toggleExecution() {
  if (isPlaying.value) {
    executor.stop()
    isPlaying.value = false
  } else {
    // Ensure audio is enabled before starting
    if (!audioEnabled.value) {
      await enableAudio()
    }
    await executor.start()
    isPlaying.value = true
  }
}

function clearGraph() {
  if (confirm('Clear entire graph?')) {
    graphStore.clear()
  }
}

function initializeRoom() {
  sessionStore.generateRoomKey()
  sessionStore.setIsHost(true)
}

function showQRCode() {
  qrModalRef.value?.open()
}

function showNodeLibrary() {
  nodeLibraryModalRef.value?.open()
}

function onDrop(event: DragEvent) {
  event.preventDefault()

  // Handle peer node drops
  const peerNodeData = event.dataTransfer?.getData('application/peer-node')
  if (peerNodeData) {
    const data = JSON.parse(peerNodeData)
    const position = project({
      x: event.clientX,
      y: event.clientY
    })

    if (data.type === 'peer') {
      addPeerNodeToGraph(data.peerId, position)
    } else if (data.type === 'all-peers') {
      addAllPeersNodeToGraph(position)
    }
    return
  }

  // Handle regular node library drops
  const nodeType = event.dataTransfer?.getData('application/vueflow-nodetype')
  if (!nodeType) return

  const position = project({
    x: event.clientX,
    y: event.clientY
  })
  graphStore.addNode(nodeType, position)
}

function onConnect(connection: FlowConnection) {
  graphStore.addConnection(connection)
}

function onNodesChange(changes: NodeChange[]) {
  const nextChanges = []

  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      graphStore.updateNodePosition(change.id, change.position)
      nextChanges.push(change)
    } else if (change.type === 'remove') {
      confirmDeleteChange.value = change
    }
  }

  applyNodeChanges(nextChanges)
}

function onNodeClick(event: any) {
  // Select the clicked node
  graphStore.selectNode(event.node.id)
}

function deleteNodeConfirmed() {
  if (!confirmDeleteChange.value) return
  graphStore.removeNode(confirmDeleteChange.value.id)
  applyNodeChanges([confirmDeleteChange.value])
  confirmDeleteChange.value = null
}

function onEdgesChange(changes: EdgeChange[]) {
  changes.forEach(change => {
    if (change.type === 'remove') {
      graphStore.removeConnection(change.id)
    }
  })
}

// Peer management
function addPeerNodeToGraph(peerId: string, position?: { x: number; y: number }) {
  const peer = peerStore.getPeer(peerId)
  if (!peer) return

  const pos = position || {x: 100, y: 100}
  const node = graphStore.addNode('peer', pos)

  if (node instanceof PeerNode) {
    node.setPeer(peerId)
    // Enable all capabilities by default
    const capabilities = peer.capabilities.map(c => c.type)
    node.configureCapabilities(capabilities)
  }
}

function addAllPeersNodeToGraph(position?: { x: number; y: number }) {
  const pos = position || {x: 100, y: 100}
  graphStore.addNode('all-peers', pos)
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
</style>
