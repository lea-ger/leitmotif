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
        <span class="badge badge-sm">{{ peers.length }}</span>
      </h3>
      
      <!-- Mass Actions -->
      <div v-if="peers.length > 0" class="mb-4 flex gap-2">
        <button 
          @click="addAllPeers"
          class="btn btn-xs btn-primary flex-1"
        >
          Add All
        </button>
        <button 
          @click="removeAllPeers"
          class="btn btn-xs btn-ghost flex-1"
        >
          Remove All
        </button>
      </div>
      
      <!-- Peer List -->
      <div v-if="peers.length === 0" class="text-center py-8 text-base-content/50">
        <div class="text-4xl mb-2">📱</div>
        <div class="text-sm">No peers connected</div>
        <div class="text-xs mt-1">Scan QR code to join</div>
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="peer in peers"
          :key="peer.id"
          class="peer-item bg-base-100 p-3 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div 
                class="w-2 h-2 rounded-full"
                :class="peer.active ? 'bg-success' : 'bg-error'"
              />
              <span class="font-medium text-sm">{{ peer.name }}</span>
            </div>
            
            <button
              v-if="!peer.addedToGraph"
              @click="emit('addPeer', peer.id)"
              class="btn btn-xs btn-primary"
            >
              Add Node
            </button>
            <span v-else class="badge badge-sm badge-success">In Graph</span>
          </div>
          
          <!-- Sensor Controls -->
          <div class="text-xs space-y-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="peer.sensors.gyro"
                @change="updatePeerSensors(peer.id)"
                class="checkbox checkbox-xs"
              />
              <span>Gyro/Accel</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="peer.sensors.video"
                @change="updatePeerSensors(peer.id)"
                class="checkbox checkbox-xs"
              />
              <span>Video</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="peer.sensors.audio"
                @change="updatePeerSensors(peer.id)"
                class="checkbox checkbox-xs"
              />
              <span>Audio</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="peer.sensors.touch"
                @change="updatePeerSensors(peer.id)"
                class="checkbox checkbox-xs"
              />
              <span>Touch Events</span>
            </label>
          </div>
          
          <!-- Stats -->
          <div class="mt-2 pt-2 border-t border-base-300 text-xs text-base-content/60">
            <div>Latency: {{ peer.latency }}ms</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface PeerData {
  id: string
  name: string
  active: boolean
  addedToGraph: boolean
  latency: number
  sensors: {
    gyro: boolean
    video: boolean
    audio: boolean
    touch: boolean
  }
}

interface Props {
  peers?: PeerData[]
}

const props = withDefaults(defineProps<Props>(), {
  peers: () => []
})

const emit = defineEmits<{
  addPeer: [peerId: string]
  removePeer: [peerId: string]
  addAllPeers: []
  removeAllPeers: []
  updateSensors: [peerId: string, sensors: PeerData['sensors']]
}>()

const isCollapsed = ref(false)

function addAllPeers() {
  emit('addAllPeers')
}

function removeAllPeers() {
  emit('removeAllPeers')
}

function updatePeerSensors(peerId: string) {
  const peer = props.peers.find(p => p.id === peerId)
  if (peer) {
    emit('updateSensors', peerId, peer.sensors)
  }
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
}

.peer-item:hover {
  transform: translateX(-2px);
}
</style>
