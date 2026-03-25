<template>
  <div class="editor-view">
    <!-- Toolbar -->
    <div class="toolbar bg-base-300 px-4 py-2 flex items-center gap-4 border-b border-base-content/10">
      <!-- Left side - File menu -->
      <ul class="menu menu-horizontal rounded-box">
        <li>
          <details>
            <summary>
              <Icon icon="ph:folder-open" class="text-base"/>
              File
            </summary>
            <ul class="min-w-3xs z-40 bg-base-200 shadow-xl">
              <li><a @click="handleExportGraph">
                <Icon icon="ph:download-simple"/>
                Export Graph
              </a></li>
              <li><a @click="handleImportGraph">
                <Icon icon="ph:upload-simple"/>
                Import Graph
              </a></li>
              <li class="divider h-px"></li>
              <li><a @click="clearGraph" class="text-error">
                <Icon icon="ph:trash"/>
                Clear Graph
              </a></li>
            </ul>
          </details>
        </li>
        <li>
          <details>
            <summary>Examples</summary>
            <ul class="z-40 bg-base-200 shadow-xl">
              <li v-for="demo in DEMO_WORKFLOWS" :key="demo.id">
                <a @click="loadDemo(demo)">{{ demo.name }}</a>
              </li>
            </ul>
          </details>
        </li>
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

      <div class="flex-1"/>

      <!-- Room Key Display -->
      <div v-if="sessionStore.formattedRoomKey" class="flex items-center gap-2">
        <span class="text-xs opacity-70">Room:</span>
        <code class="px-3 py-1 bg-base-100 rounded font-mono text-sm font-bold">
          {{ sessionStore.formattedRoomKey }}
        </code>
        <!-- Host status indicator -->
        <span
            v-if="sessionStore.hostStatus === 'connecting'"
            class="badge badge-warning badge-sm gap-1"
        >
          <span class="loading loading-spinner loading-xs"/>Connecting…
        </span>
        <span
            v-else-if="sessionStore.hostStatus === 'listening'"
            class="badge badge-success badge-sm"
        >Ready</span>
        <span
            v-else-if="sessionStore.hostStatus === 'error'"
            class="badge badge-error badge-sm"
        >Error</span>
        <button
            @click="showQRCode"
            class="btn btn-xs btn-square btn-ghost gap-2"
            title="Show QR Code"
        >
          <Icon icon="ph:qr-code"/>
        </button>
        <button
            @click="sessionStore.closeRoom()"
            class="btn btn-xs btn-square btn-ghost text-error gap-2"
            title="Close Room"
        >
          <Icon icon="ph:x-circle"/>
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
      <!-- Peer Panel (left side) -->
      <PeerPanel
          @add-peer-node="addPeerNodeToGraph"
          @add-all-peers-node="addAllPeersNodeToGraph"
      />

      <!-- Variable Panel (right side) -->
      <!-- <VariablePanel />-->

      <!-- Main Canvas Area -->
      <div class="flex flex-col absolute w-full h-full">
        <div class="absolute top-4 right-4 font-mono text-xs text-base-content/60 z-10">
          FPS: {{ currentFPS }}
        </div>

        <!-- Node Library -->
        <NodeLibraryModal ref="nodeLibraryModalRef"/>

        <!-- Vue Flow Canvas -->
        <div class="flow-container" @drop="onDrop" @dragover.prevent>
          <VueFlow
              :nodes="flowNodes"
              :edges="flowEdges"
              @connect="onConnect"
              @nodes-change="onNodesChange"
              @edges-change="onEdgesChange"
              @node-click="onNodeClick"
              :delete-key-code="null"
              :connection-line-style="{ stroke: '#6366f1', strokeWidth: 2 }"
              :default-zoom="0.8"
              :min-zoom="0.1"
              :max-zoom="2"
          >
            <template #node-custom="nodeProps">
              <NodeComponent
                  :data="nodeProps.data"
                  @delete="confirmDeleteById(nodeProps.id)"
              />
            </template>
            <template #node-comment="nodeProps">
              <CommentNodeComponent
                  :data="nodeProps.data"
                  @delete="confirmDeleteById(nodeProps.id)"
              />
            </template>
            <template #edge-default="edgeProps">
              <CustomEdge v-bind="edgeProps"/>
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

    <!-- Canvas Output Window (always mounted, peeks from bottom-left) -->
    <CanvasOutputWindow/>

    <!-- QR Code Modal -->
    <QRCodeModal ref="qrModalRef"/>

    <!-- Hidden file input for graph import -->
    <input
        ref="fileInputRef"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="onFileSelected"
    />

    <dialog class="modal"
            :class="confirmDeleteChange ? 'modal-open' : ''"
    >
      <div class="modal-box">
        <form method="dialog">
          <button
              class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              @click="confirmDeleteChange = null"
          >
            <Icon icon="ph:x"/>
          </button>
        </form>
        <h3 class="text-lg font-bold">Are you sure?</h3>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn" @click="deleteNodeConfirmed">Confirm</button>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {
  type Connection as FlowConnection,
  type EdgeChange,
  type NodeChange,
  type NodeRemoveChange,
  useVueFlow,
  VueFlow
} from '@vue-flow/core'
import {useGraphStore} from '../stores/graphStore'
import {usePeerStore} from '../stores/peerStore'
import {useSessionStore} from '../stores/sessionStore'
import {useVariableStore} from '../stores/variableStore'
import {GraphExecutor} from '../engine/GraphExecutor'
import {registerAllNodes} from '../nodes'
import type {BaseNode} from '../nodes/BaseNode'
import {PeerNode} from '../nodes/input/PeerNode'
import NodeComponent from '../components/NodeComponent.vue'
import CommentNodeComponent from '../components/CommentNodeComponent.vue'
import CustomEdge from '../components/CustomEdge.vue'
import PeerPanel from '../components/PeerPanel.vue'
import QRCodeModal from '../components/QRCodeModal.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import {Icon} from "@iconify/vue";
import NodeLibraryModal from "../components/NodeLibraryModal.vue";
import NodeSettingsPanel from "../components/NodeSettingsPanel.vue";
import CanvasOutputWindow from "../components/CanvasOutputWindow.vue";
import {NodeRegistry} from '../nodes/NodeRegistry';
import {DEMO_WORKFLOWS} from '../data/demoWorkflows'

// Register all node types
registerAllNodes()

const graphStore = useGraphStore()
const peerStore = usePeerStore()
const sessionStore = useSessionStore()
const variableStore = useVariableStore()

const flowNodes = computed(() => graphStore.flowNodes)
const flowEdges = computed(() => graphStore.flowEdges)

const executor = new GraphExecutor(60)

const isPlaying = ref(false)
const currentFPS = ref(0)
const audioEnabled = ref(false)
const qrModalRef = ref<InstanceType<typeof QRCodeModal> | null>(null)
const nodeLibraryModalRef = ref<InstanceType<typeof NodeLibraryModal> | null>(null)
const confirmDeleteChange = ref<NodeRemoveChange | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedNodeMetadata = computed(() => {
  if (!graphStore.selectedNode) return undefined
  return NodeRegistry.getMetadata(graphStore.selectedNode.type) ?? undefined
})
let fpsInterval: number | null = null

// Vue Flow instance
const {project, applyNodeChanges} = useVueFlow()

// Debounced auto-save: waits 600ms after last change before writing to IndexedDB
let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    graphStore.saveToStorage()
  }, 600)
}

onMounted(async () => {
  startFPSCounter()
  await peerStore.loadFromStorage()
  await graphStore.loadFromStorage()
  await variableStore.loadFromStorage()
})

onBeforeUnmount(() => {
  executor.stop()
  if (fpsInterval) clearInterval(fpsInterval)
  if (saveTimer) clearTimeout(saveTimer)
  graphStore.saveToStorage()
  peerStore.saveToStorage()
  variableStore.saveToStorage()
})

// Watch graph changes and update executor
watch([() => graphStore.nodeInstances, () => graphStore.allConnections], () => {
  const nodes = Array.from(graphStore.nodeInstances.values()) as BaseNode[]
  executor.setGraph(nodes, graphStore.allConnections)
  // console.log('Graph updated. Nodes:', nodes.length, 'Connections:', graphStore.allConnections.length)
  scheduleSave()
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

/**
 * Export current graph as JSON file
 */
function handleExportGraph() {
  try {
    graphStore.downloadGraph()
    console.log('Graph exported successfully')
  } catch (error) {
    console.error('Failed to export graph:', error)
    alert('Failed to export graph. Check console for details.')
  }
}

/**
 * Import graph from JSON file
 */
function handleImportGraph() {
  fileInputRef.value?.click()
}

/**
 * Handle file input change
 */
async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    await graphStore.uploadGraph(file)
    console.log('Graph imported successfully')
  } catch (error) {
    console.error('Failed to import graph:', error)
    alert('Failed to import graph. Please check the file format.')
  } finally {
    // Reset file input
    target.value = ''
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
      // Store the remove change and show confirmation modal
      confirmDeleteChange.value = change
      // Don't push to nextChanges - we'll apply it after confirmation
    } else if (change.type === 'select') {
      // Handle node selection
      nextChanges.push(change)
    } else {
      // Pass through other changes
      nextChanges.push(change)
    }
  }

  // Only apply non-remove changes immediately
  if (nextChanges.length > 0) {
    applyNodeChanges(nextChanges)
  }
}

function onNodeClick(event: any) {
  // Select the clicked node
  graphStore.selectNode(event.node.id)
}

function confirmDeleteById(id: string) {
  confirmDeleteChange.value = {
    type: "remove",
    id,
  }
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

function loadDemo(demo: typeof DEMO_WORKFLOWS[0]) {
  if (confirm(`Load "${demo.name}"? Current graph will be cleared.`)) {
    graphStore.loadGraphData(demo.data)
  }
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
