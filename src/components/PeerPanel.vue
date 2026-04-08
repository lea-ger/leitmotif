<template>
  <!--
    Peek panel: always fixed on the left edge.
    When collapsed, only the 40px right-edge tab strip is visible.
    When expanded, the full panel slides in.
  -->
  <div class="peer-panel" :class="{ 'is-open': isOpen }">
    <!-- Tab strip (always visible) -->
    <div class="tab-strip" @click="isOpen = !isOpen" :title="isOpen ? 'Close Peers Panel' : 'Open Peers Panel'">
      <div class="flex flex-col items-center gap-2 py-3">
        <Icon icon="ph:users-three" class="text-xl text-primary" />
        <span
          class="badge badge-primary badge-sm"
          v-if="connectedPeers.length > 0"
        >{{ connectedPeers.length }}</span>
        <Icon
          :icon="isOpen ? 'ph:caret-left' : 'ph:caret-right'"
          class="text-sm text-base-content/50 mt-auto"
        />
      </div>
    </div>

    <!-- Panel content -->
    <div class="panel-content bg-base-200">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
        <h3 class="font-bold flex items-center gap-2">
          <Icon icon="ph:globe" />
          <span>Connected Peers</span>
          <span class="badge badge-primary badge-sm">{{ connectedPeers.length }}</span>
        </h3>
      </div>

      <!-- Default Layout Setting -->
      <div class="px-4 py-3 bg-base-300/50 border-b border-base-content/10">
        <div class="text-xs text-base-content/50 mb-2 flex items-center gap-1">
          <Icon icon="ph:star" class="text-sm" />
          Default Layout for New Peers
        </div>
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="layout in LAYOUTS"
            :key="layout.value"
            class="btn btn-xs flex-col gap-0.5 h-auto py-1.5"
            :class="graphStore.defaultPeerLayout === layout.value ? 'btn-primary' : 'btn-ghost'"
            @click.stop="setDefaultLayout(layout.value)"
            :title="layout.label + ' (Default)'"
          >
            <Icon :icon="layout.icon" class="text-sm" />
            <span class="text-[9px] leading-none">{{ layout.label }}</span>
          </button>
        </div>
      </div>

      <!-- Scrollable body -->
      <div class="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
        <!-- All Peers drag node -->
        <div v-if="connectedPeers.length > 0">
          <div class="text-xs font-semibold text-base-content/50 mb-2 uppercase tracking-wide">Mass Operations</div>
          <div
            class="alert alert-info cursor-grab hover:shadow-lg transition-all text-sm"
            draggable="true"
            @dragstart="startDragAllPeers"
          >
            <Icon icon="ph:users-three" class="text-lg" />
            <span>All Peers Node</span>
          </div>
        </div>

        <!-- Mock Peer Button -->
        <button
          @click="addMockPeer"
          class="btn btn-sm btn-outline btn-secondary w-full gap-2"
        >
          <Icon icon="ph:robot" />
          Add Mock Peer
        </button>

        <div class="divider my-0">Peers</div>

        <!-- Empty state -->
        <div v-if="connectedPeers.length === 0" class="card bg-base-100 shadow">
          <div class="card-body items-center text-center py-8">
            <Icon icon="ph:device-mobile" class="text-5xl text-base-content/30 mb-2" />
            <h4 class="card-title text-base">No peers connected</h4>
            <p class="text-xs text-base-content/60">Scan QR code to join</p>
          </div>
        </div>

        <!-- Peer list -->
        <div
          v-for="peer in connectedPeers"
          :key="peer.id"
          class="card bg-base-100 shadow hover:shadow-xl transition-shadow cursor-grab"
          :class="{ 'border border-dashed border-base-content/20': peer.isMock }"
          draggable="true"
          @dragstart="startDragPeer($event, peer.id)"
        >
          <div class="card-body p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon v-if="peer.isMock" icon="ph:robot" class="text-secondary" />
                <div
                  v-else
                  class="badge badge-sm"
                  :class="peer.connected ? 'badge-success' : 'badge-error'"
                >{{ peer.connected ? 'Online' : 'Offline' }}</div>
                <span class="font-semibold text-sm">{{ peer.name }}</span>
              </div>

              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-xs btn-ghost btn-circle">
                  <Icon icon="ph:dots-three-vertical" />
                </div>
                <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-[50] w-40 p-2 shadow">
                  <li><a @click="addPeerToGraph(peer.id)"><Icon icon="ph:plus-circle" /> Add Node</a></li>
                  <li v-if="peer.isMock">
                    <a @click="removeMockPeer(peer.id)" class="text-error"><Icon icon="ph:trash" /> Remove</a>
                  </li>
                </ul>
              </div>
            </div>

            <div class="collapse collapse-arrow bg-base-200 rounded-box mt-2">
              <input type="checkbox" />
              <div class="collapse-title text-xs font-medium py-2">
                Capabilities ({{ peer.capabilities.filter(c => c.enabled).length }})
              </div>
              <div class="collapse-content text-xs">
                <div class="space-y-1">
                  <label
                    v-for="cap in peer.capabilities"
                    :key="cap.type"
                    class="flex items-center gap-2 cursor-pointer p-1 hover:bg-base-300 rounded"
                  >
                    <input
                      type="checkbox"
                      v-model="cap.enabled"
                      @change="updateCapability(peer.id, cap.type, cap.enabled)"
                      class="checkbox checkbox-xs checkbox-primary"
                    />
                    <span>{{ formatCapabilityName(cap.type) }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Layout picker (only for live peers) -->
            <div v-if="!peer.isMock && peer.connected" class="mt-2">
              <div class="text-xs text-base-content/50 mb-1 flex items-center gap-1">
                <Icon icon="ph:layout" class="text-sm" />
                Client Layout
              </div>
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="layout in LAYOUTS"
                  :key="layout.value"
                  class="btn btn-xs flex-col gap-0.5 h-auto py-1.5"
                  :class="peer.currentLayout === layout.value ? 'btn-primary' : 'btn-ghost'"
                  @click.stop="setLayout(peer.id, layout.value)"
                  :title="layout.label"
                >
                  <Icon :icon="layout.icon" class="text-sm" />
                  <span class="text-[9px] leading-none">{{ layout.label }}</span>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-1 mt-2 text-xs text-base-content/50">
              <Icon icon="ph:clock" />
              {{ formatLastSeen(peer.lastSeen) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePeerStore } from '../stores/peerStore'
import { useGraphStore } from '../stores/graphStore'
import type { CapabilityType, LayoutName } from '../stores/types/peer'
import { Icon } from '@iconify/vue'

const emit = defineEmits<{
  addPeerNode: [peerId: string]
  addAllPeersNode: []
}>()

const peerStore = usePeerStore()
const graphStore = useGraphStore()
const isOpen = ref(false)

const connectedPeers = computed(() => peerStore.connectedPeers)

function addPeerToGraph(peerId: string) {
  emit('addPeerNode', peerId)
}

function addMockPeer() {
  peerStore.addMockPeer()
}

function removeMockPeer(peerId: string) {
  peerStore.removeMockPeer(peerId)
}

function startDragPeer(event: DragEvent, peerId: string) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/peer-node', JSON.stringify({ type: 'peer', peerId }))
}

function startDragAllPeers(event: DragEvent) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/peer-node', JSON.stringify({ type: 'all-peers' }))
}

function updateCapability(peerId: string, capabilityType: CapabilityType, enabled: boolean) {
  peerStore.setCapabilityEnabled(peerId, capabilityType, enabled)
  graphStore.syncPeerNodePorts(peerId)
}

function setLayout(peerId: string, layout: LayoutName) {
  peerStore.setPeerLayout(peerId, layout)
  graphStore.syncPeerNodePorts(peerId)
}

function setDefaultLayout(layout: LayoutName) {
  console.log('[PeerPanel] Setting default layout to:', layout)
  graphStore.defaultPeerLayout = layout
  console.log('[PeerPanel] After setting, value is:', graphStore.defaultPeerLayout)
  graphStore.saveToStorage().then(() => {
    console.log('[PeerPanel] Save complete')
  })
}

const LAYOUTS: { value: LayoutName; label: string; icon: string }[] = [
  { value: 'empty',    label: 'Default',  icon: 'ph:house' },
  { value: 'keyboard', label: 'Keyboard', icon: 'ph:piano-keys' },
  { value: 'canvas',   label: 'Canvas',   icon: 'ph:paint-brush' },
  { value: 'touchpad', label: 'Touchpad', icon: 'ph:hand-tap' },
]

function formatCapabilityName(type: string): string {
  const names: Record<string, string> = {
    gyro: 'Gyroscope', accelerometer: 'Accelerometer', touch: 'Touch Events',
    audio: 'Audio', video: 'Video', canvas: 'Canvas', custom: 'Custom Data'
  }
  return names[type] || type
}

function formatLastSeen(date: Date): string {
  const diff = Date.now() - date.getTime()
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
</script>

<style scoped>
/* Total width = tab(40px) + content(280px) = 320px
   When collapsed, translate left by content width (280px) so only the tab shows. */
.peer-panel {
  position: fixed;
  left: 0;
  top: 56px;                    /* below the 56px toolbar */
  height: calc(100vh - 56px);
  width: 320px;
  display: flex;
  flex-direction: row;
  transform: translateX(-280px);
  transition: transform 0.25s ease;
  z-index: 30;
  pointer-events: auto;
}

.peer-panel.is-open {
  transform: translateX(0);
}

/* The 40px strip that is always visible */
.tab-strip {
  width: 40px;
  flex-shrink: 0;
  background: oklch(var(--b3));
  border-right: 1px solid oklch(var(--bc) / 0.1);
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: background 0.15s;
}

.tab-strip:hover {
  background: oklch(var(--b2));
}

/* The actual panel content (280px) */
.panel-content {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  order: -1;  /* content is to the LEFT of the tab strip */
  border-right: 1px solid oklch(var(--bc) / 0.1);
}

.card:active {
  cursor: grabbing;
}

.alert:active {
  cursor: grabbing;
}
</style>

