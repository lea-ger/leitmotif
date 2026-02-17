<template>
  <div class="drawer" :class="{ 'drawer-open': isOpen }">
    <input id="peer-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-side h-fit" v-show="isOpen">
      <label for="peer-drawer" aria-label="close sidebar" class="drawer-overlay" @click="isOpen = false"></label>
      <div class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <Icon icon="ph:globe" class="text-xl" />
            <span>Connected Peers</span>
            <span class="badge badge-primary badge-sm">{{ connectedPeers.length }}</span>
          </h3>
          <button 
            @click="isOpen = false"
            class="btn btn-sm btn-ghost btn-circle"
            title="Close Peers Panel"
          >
            <Icon icon="ph:caret-left" />
          </button>
        </div>

        <!-- Content -->
        <div>
          <!-- Divider -->
          <div class="divider">Actions</div>
        
        <!-- All Peers Aggregate Port -->
        <div v-if="connectedPeers.length > 0" class="mb-3">
          <div class="text-xs font-semibold text-base-content/70 mb-2">Mass Operations</div>
          <div 
            class="alert alert-info cursor-grab hover:shadow-lg transition-all"
            draggable="true"
            @dragstart="startDragAllPeers"
          >
            <Icon icon="ph:users-three" class="text-xl" />
            <span class="text-sm">All Peers Node</span>
          </div>
        </div>

        <!-- Mock Peer Button -->
        <div class="mb-4">
          <button 
            @click="addMockPeer"
            class="btn btn-sm btn-outline btn-secondary w-full gap-2"
          >
            <Icon icon="ph:robot" />
            <span>Add Mock Peer</span>
          </button>
        </div>
        
        <!-- Divider -->
        <div class="divider">Peers</div>

        <!-- Peer List -->
        <div v-if="connectedPeers.length === 0" class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center py-8">
            <Icon icon="ph:device-mobile" class="text-5xl text-base-content/30 mb-2" />
            <h4 class="card-title text-base">No peers connected</h4>
            <p class="text-xs text-base-content/60">Scan QR code to join</p>
          </div>
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="peer in connectedPeers"
            :key="peer.id"
            class="card bg-base-100 shadow-md hover:shadow-xl transition-shadow cursor-grab"
            :class="{ 'border border-dashed border-base-content/20': peer.isMock }"
            draggable="true"
            @dragstart="startDragPeer($event, peer.id)"
          >
            <div class="card-body p-3">
              <!-- Header -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Icon v-if="peer.isMock" icon="ph:robot" class="text-lg text-secondary" />
                  <div 
                    v-else
                    class="badge badge-sm"
                    :class="peer.connected ? 'badge-success' : 'badge-error'"
                  >
                    {{ peer.connected ? 'Online' : 'Offline' }}
                  </div>
                  <span class="font-semibold text-sm">{{ peer.name }}</span>
                </div>
                
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-xs btn-ghost btn-circle">
                    <Icon icon="ph:dots-three-vertical" />
                  </div>
                  <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-[1] w-40 p-2 shadow">
                    <li>
                      <a @click="addPeerToGraph(peer.id)">
                        <Icon icon="ph:plus-circle" />
                        Add Node
                      </a>
                    </li>
                    <li v-if="peer.isMock">
                      <a @click="removeMockPeer(peer.id)" class="text-error">
                        <Icon icon="ph:trash" />
                        Remove
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Capability Controls -->
              <div class="collapse collapse-arrow bg-base-200 rounded-box">
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
              
              <!-- Stats -->
              <div class="flex items-center gap-2 mt-2 text-xs text-base-content/60">
                <Icon icon="ph:clock" />
                <span>{{ formatLastSeen(peer.lastSeen) }}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePeerStore } from '../stores/peerStore'
import type { CapabilityType } from '../stores/types/peer'
import { Icon } from "@iconify/vue";

const props = defineProps<{
  isOpen?: boolean
}>()

const emit = defineEmits<{
  addPeerNode: [peerId: string]
  addAllPeersNode: []
  'update:isOpen': [value: boolean]
}>()

const peerStore = usePeerStore()
const isOpen = computed({
  get: () => props.isOpen ?? true,
  set: (value) => emit('update:isOpen', value)
})

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
.drawer-side {
  z-index: 20;
}

.card:active {
  cursor: grabbing;
}

.alert:active {
  cursor: grabbing;
}
</style>
