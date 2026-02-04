<template>
  <div class="peer-panel" :class="{ collapsed: isCollapsed }">
    <!-- Toggle Button -->
    <button 
      @click="isCollapsed = !isCollapsed"
      class="toggle-btn btn btn-sm btn-ghost"
    >
      {{ isCollapsed ? '◀' : '▶' }}
    </button>
    
    <!-- Panel Content -->
    <div v-if="!isCollapsed" class="panel-content bg-base-200 p-4">
      <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🌐</span>
        <span>Connected Peers</span>
        <span class="badge badge-sm">{{ connectedPeers.length }}</span>
      </h3>
      
      <!-- All Peers Aggregate Port -->
      <div v-if="connectedPeers.length > 0" class="mb-4 p-3 bg-base-100 rounded-lg">
        <div class="text-xs font-semibold mb-2">Mass Operations</div>
        <div 
          class="aggregate-port"
          draggable="true"
          @dragstart="startDragAllPeers"
        >
          <span class="icon">👥</span>
          <span class="text-xs">All Peers Node</span>
        </div>
      </div>

      <!-- Mock Peer Button -->
      <div class="mb-4">
        <button 
          @click="addMockPeer"
          class="btn btn-sm btn-outline w-full gap-2"
        >
          <span><Icon icon="ph:robot" /></span>
          <span>Add Mock Peer</span>
        </button>
      </div>
      
      <!-- Peer List -->
      <div v-if="connectedPeers.length === 0" class="text-center py-8 text-base-content/50">
        <div class="text-4xl mb-2"><Icon icon="ph:device-mobile" /></div>
        <div class="text-sm">No peers connected</div>
        <div class="text-xs mt-1">Scan QR code to join</div>
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="peer in connectedPeers"
          :key="peer.id"
          class="peer-item bg-base-100 p-3 rounded-lg"
          :class="{ 'mock-peer': peer.isMock }"
          draggable="true"
          @dragstart="startDragPeer($event, peer.id)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span v-if="peer.isMock" class="text-sm">🤖</span>
              <div 
                v-else
                class="w-2 h-2 rounded-full"
                :class="peer.connected ? 'bg-success' : 'bg-error'"
              />
              <span class="font-medium text-sm">{{ peer.name }}</span>
            </div>
            
            <div class="flex gap-1">
              <button
                @click="addPeerToGraph(peer.id)"
                class="btn btn-xs btn-primary"
              >
                Add Node
              </button>
              <button
                v-if="peer.isMock"
                @click="removeMockPeer(peer.id)"
                class="btn btn-xs btn-ghost"
                title="Remove mock peer"
              >
                ✕
              </button>
            </div>
          </div>
          
          <!-- Capability Controls -->
          <div class="text-xs space-y-1">
            <label 
              v-for="cap in peer.capabilities"
              :key="cap.type"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input 
                type="checkbox" 
                v-model="cap.enabled"
                @change="updateCapability(peer.id, cap.type, cap.enabled)"
                class="checkbox checkbox-xs"
              />
              <span>{{ formatCapabilityName(cap.type) }}</span>
            </label>
          </div>
          
          <!-- Stats -->
          <div class="mt-2 pt-2 border-t border-base-300 text-xs text-base-content/60">
            <div>Last seen: {{ formatLastSeen(peer.lastSeen) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePeerStore } from '../stores/peerStore'
import type { CapabilityType } from '../stores/types/peer'
import { Icon } from "@iconify/vue";

const emit = defineEmits<{
  addPeerNode: [peerId: string]
  addAllPeersNode: []
}>()

const peerStore = usePeerStore()
const isCollapsed = ref(false)

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
  event.dataTransfer.setData('application/peer-node', JSON.stringify({
    type: 'peer',
    peerId
  }))
}

function startDragAllPeers(event: DragEvent) {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/peer-node', JSON.stringify({
    type: 'all-peers'
  }))
}

function updateCapability(peerId: string, capabilityType: CapabilityType, enabled: boolean) {
  peerStore.setCapabilityEnabled(peerId, capabilityType, enabled)
}

function formatCapabilityName(type: string): string {
  const names: Record<string, string> = {
    'gyro': 'Gyroscope',
    'accelerometer': 'Accelerometer',
    'touch': 'Touch Events',
    'audio': 'Audio',
    'video': 'Video',
    'canvas': 'Canvas',
    'custom': 'Custom Data'
  }
  return names[type] || type
}

function formatLastSeen(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
</script>

<style scoped>
.peer-panel {
  position: relative;
  width: 320px;
  height: 100%;
  border-left: 1px solid oklch(var(--bc) / 0.1);
  transition: width 0.3s;
}

.peer-panel.collapsed {
  width: 40px;
}

.toggle-btn {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 10;
}

.panel-content {
  height: 100%;
  overflow-y: auto;
  padding-left: 48px;
}

.peer-panel.collapsed .panel-content {
  display: none;
}

.peer-item {
  transition: transform 0.2s;
  cursor: grab;
}

.peer-item:active {
  cursor: grabbing;
}

.peer-item:hover {
  transform: translateX(-2px);
}

.aggregate-port {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px dashed oklch(var(--bc) / 0.2);
  border-radius: 0.5rem;
  cursor: grab;
  transition: all 0.2s;
}

.aggregate-port:hover {
  border-color: oklch(var(--p));
  background: oklch(var(--p) / 0.1);
}

.aggregate-port:active {
  cursor: grabbing;
}

.mock-peer {
  border: 1px dashed oklch(var(--bc) / 0.2);
  background: oklch(var(--b1) / 0.5);
}
</style>
