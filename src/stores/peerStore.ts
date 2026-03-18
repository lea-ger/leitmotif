import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { PeerMetadata, PeerDataPayload, PeerCapability, CapabilityType, LayoutName } from './types/peer'
import { DEFAULT_CAPABILITIES, CapabilityType as CT } from './types/peer'
import * as storage from '../utils/storage'
import Peer, { type MediaConnection } from 'peerjs'
import * as Tone from 'tone'

export const usePeerStore = defineStore('peer', () => {
  const peers = ref<Map<string, PeerMetadata>>(new Map())
  const dataStreams = ref<Map<string, Map<string, any>>>(new Map()) // peerId -> capabilityType -> latest data
  let hostPeer: Peer | null = null

  type PeerAudioState = {
    source: Tone.ToneAudioNode | null
    destination: MediaStreamAudioDestinationNode | null
    call: MediaConnection | null
  }
  const peerAudioStates = new Map<string, PeerAudioState>()

  /**
   * Get all connected peers
   */
  const connectedPeers = computed(() => {
    return Array.from(peers.value.values()).filter(p => p.connected)
  })

  /**
   * Get all peers (connected and disconnected)
   */
  const allPeers = computed(() => {
    return Array.from(peers.value.values())
  })

  /**
   * Get peer by ID
   */
  const getPeer = (peerId: string): PeerMetadata | undefined => {
    return peers.value.get(peerId)
  }

  /**
   * Add or update a peer
   */
  const addPeer = (peer: PeerMetadata) => {
    peers.value.set(peer.id, peer)
    if (!dataStreams.value.has(peer.id)) {
      dataStreams.value.set(peer.id, new Map())
    }
    ensurePeerAudioCall(peer.id)
    saveToStorage().catch(e => console.error('Failed to save after addPeer:', e))
  }

  /**
   * Remove a peer
   */
  const removePeer = (peerId: string) => {
    stopPeerAudio(peerId)
    peers.value.delete(peerId)
    dataStreams.value.delete(peerId)
    saveToStorage().catch(e => console.error('Failed to save after removePeer:', e))
  }

  const updatePeerLastSeen = (peerId: string) => {
    const peer = peers.value.get(peerId)
    if (peer) {
      peer.lastSeen = new Date()
    }
  }

  /**
   * Check for peers that haven't been seen in a while and mark them as disconnected
   */
  const checkPeerHealth = () => {
    const now = Date.now()
    const TIMEOUT_MS = 10000 // 10 seconds

    for (const [id, peer] of peers.value.entries()) {
      if (peer.connected && !peer.isMock) {
        const lastSeen = peer.lastSeen.getTime()
        if (now - lastSeen > TIMEOUT_MS) {
          console.log(`[peerStore] Peer ${id} timed out (last seen ${Math.round((now - lastSeen)/1000)}s ago)`)
          setPeerConnected(id, false)
        }
      }
    }
  }

  /**
   * Update peer connection status
   */
  const setPeerConnected = (peerId: string, connected: boolean) => {
    const peer = peers.value.get(peerId)
    if (peer) {
      peer.connected = connected
      peer.lastSeen = new Date()
      if (!connected) stopPeerAudio(peerId)
      else ensurePeerAudioCall(peerId)
    }
  }

  const setHostPeer = (peer: Peer | null): void => {
    hostPeer = peer
    if (!hostPeer) {
      for (const peerId of peerAudioStates.keys()) stopPeerAudio(peerId)
      return
    }
    for (const peerId of peers.value.keys()) ensurePeerAudioCall(peerId)
  }

  const setPeerAudioSource = (peerId: string, source: Tone.ToneAudioNode | null): void => {
    const state = peerAudioStates.get(peerId) ?? { source: null, destination: null, call: null }
    if (state.source === source) return

    // Disconnect prior source from destination
    if (state.source && state.destination) {
      try { state.source.disconnect(state.destination) } catch {}
    }

    state.source = source
    if (!source) {
      if (state.call) {
        try { state.call.close() } catch {}
        state.call = null
      }
      peerAudioStates.set(peerId, state)
      return
    }

    ensurePeerAudioCall(peerId)
  }

  const ensurePeerAudioCall = (peerId: string): void => {
    const peerMeta = toRaw(peers.value.get(peerId))
    if (!peerMeta || !peerMeta.connected || peerMeta.isMock || !hostPeer) return

    const state = peerAudioStates.get(peerId) ?? { source: null, destination: null, call: null }
    if (!state.source) return

    if (!state.destination) {
      const raw = Tone.getContext().rawContext as AudioContext
      state.destination = raw.createMediaStreamDestination()
    }

    try {
      state.source.disconnect(state.destination)
    } catch {}
    try {
      state.source.connect(state.destination)
    } catch (e) {
      console.warn(`[peerStore] Failed to connect audio source for ${peerId}:`, e)
      peerAudioStates.set(peerId, state)
      return
    }

    if (state.call) {
      const open = (state.call as any).open
      if (open !== false) {
        peerAudioStates.set(peerId, state)
        return
      }
      try { state.call.close() } catch {}
      state.call = null
    }

    try {
      state.call = hostPeer.call(peerId, state.destination.stream, {
        metadata: { type: 'host-audio' }
      })
      state.call.on('close', () => {
        const latest = peerAudioStates.get(peerId)
        if (latest) latest.call = null
      })
      state.call.on('error', (err) => {
        console.warn(`[peerStore] Audio call error for ${peerId}:`, err)
      })
    } catch (e) {
      console.warn(`[peerStore] Failed to start audio call for ${peerId}:`, e)
    }

    peerAudioStates.set(peerId, state)
  }

  const stopPeerAudio = (peerId: string): void => {
    const state = peerAudioStates.get(peerId)
    if (!state) return

    if (state.call) {
      try { state.call.close() } catch {}
      state.call = null
    }
    if (state.source && state.destination) {
      try { state.source.disconnect(state.destination) } catch {}
    }
    state.source = null
    peerAudioStates.delete(peerId)
  }

  /**
   * Update peer capabilities
   */
  const updatePeerCapabilities = (peerId: string, capabilities: PeerCapability[]) => {
    const peer = peers.value.get(peerId)
    if (peer) {
      peer.capabilities = capabilities
    }
  }

  /**
   * Enable/disable a specific capability for a peer
   */
  const setCapabilityEnabled = (peerId: string, capabilityType: CapabilityType, enabled: boolean) => {
    const peer = peers.value.get(peerId)
    if (peer) {
      const capability = peer.capabilities.find(c => c.type === capabilityType)
      if (capability) {
        capability.enabled = enabled
      } else if (enabled) {
        // Add capability if it doesn't exist
        const defaultCap = DEFAULT_CAPABILITIES[capabilityType]
        peer.capabilities.push({
          ...defaultCap,
          enabled: true
        })
      }
    }
  }

  /**
   * Send a message to a specific peer (host → client)
   */
  const sendToPeer = (peerId: string, message: import('./types/peer').HostToClientMessage): void => {
    const peer = toRaw(peers.value.get(peerId))
    if (!peer || peer.isMock) return
    try {
      peer.connection?.send(message)
    } catch (e) {
      console.warn(`[peerStore] Failed to send to ${peerId}:`, e)
    }
  }

  /**
   * Broadcast a message to all connected (non-mock) peers
   */
  const sendToAllPeers = (message: import('./types/peer').HostToClientMessage): void => {
    for (const peer of connectedPeers.value) {
      if (!peer.isMock) {
        try {
          toRaw(peer).connection?.send(message)
        } catch (e) {
          console.warn(`[peerStore] Failed to broadcast to ${peer.id}:`, e)
        }
      }
    }
  }

  // Capabilities that are automatically driven by layout selection
  const LAYOUT_CAPS: Record<LayoutName, CapabilityType | null> = {
    empty:    null,
    keyboard: CT.KEYBOARD,
    canvas:   CT.DRAW,
    touchpad: CT.TOUCHPAD
  }
  const LAYOUT_ONLY_CAPS = new Set<CapabilityType>([CT.KEYBOARD, CT.DRAW, CT.TOUCHPAD])

  const setPeerLayout = (peerId: string, layout: LayoutName): void => {
    const peer = peers.value.get(peerId)
    if (!peer) return

    // Reactively replace the peer object so Vue triggers re-render
    peers.value.set(peerId, { ...toRaw(peer), currentLayout: layout })

    // Auto-enable the layout-specific capability, disable the others
    const targetCap = LAYOUT_CAPS[layout]
    for (const cap of LAYOUT_ONLY_CAPS) {
      setCapabilityEnabled(peerId, cap, cap === targetCap)
    }

    sendToPeer(peerId, { type: 'layout', layout })
  }

  /**
   * Update data from a peer for a specific capability
   */
  const updatePeerData = (peerId: string, capabilityType: string, data: any) => {
    const peerStreams = dataStreams.value.get(peerId)
    if (peerStreams) {
      peerStreams.set(capabilityType, {
        timestamp: Date.now(),
        data
      })
    }

    // Update last seen
    const peer = peers.value.get(peerId)
    if (peer) {
      peer.lastSeen = new Date()
    }
  }

  /**
   * Get latest data from a peer for a specific capability
   */
  const getPeerData = (peerId: string, capabilityType: string): any => {
    return dataStreams.value.get(peerId)?.get(capabilityType)
  }

  /**
   * Get all data from a specific capability across all connected peers
   */
  const getAllPeerData = (capabilityType: string): PeerDataPayload[] => {
    const results: PeerDataPayload[] = []
    
    for (const peer of connectedPeers.value) {
      const capability = peer.capabilities.find(c => c.type === capabilityType && c.enabled)
      if (capability) {
        const streamData = dataStreams.value.get(peer.id)?.get(capabilityType)
        if (streamData) {
          results.push({
            peerId: peer.id,
            peerName: peer.name,
            timestamp: streamData.timestamp,
            data: streamData.data
          })
        }
      }
    }
    
    return results
  }

  /**
   * Clear all peers and data
   */
  const clearAll = () => {
    for (const peerId of peerAudioStates.keys()) stopPeerAudio(peerId)
    peers.value.clear()
    dataStreams.value.clear()
    saveToStorage().catch(e => console.error('Failed to clear peer storage:', e))
  }

  /**
   * Save peers to IndexedDB
   */
  const saveToStorage = async (): Promise<void> => {
    try {
      const peersData = Array.from(peers.value.values()).map(peer => ({
        id: peer.id,
        name: peer.name,
        connected: false,
        lastSeen: peer.lastSeen.toISOString(),
        isMock: peer.isMock || false,
        capabilities: peer.capabilities
      }))
      await storage.setItem('leitmotif-peers', peersData)
    } catch (error) {
      console.error('Failed to save peers:', error)
    }
  }

  /**
   * Load peers from IndexedDB (falls back to localStorage for one-time migration)
   */
  const loadFromStorage = async (): Promise<void> => {
    try {
      let peersData = await storage.getItem<any[]>('leitmotif-peers')

      // One-time migration from localStorage
      if (!peersData) {
        const legacy = localStorage.getItem('leitmotif-peers')
        if (legacy) {
          peersData = JSON.parse(legacy)
          await storage.setItem('leitmotif-peers', peersData)
          localStorage.removeItem('leitmotif-peers')
          console.log('Migrated peers from localStorage to IndexedDB')
        }
      }

      if (!peersData) return

      peersData.forEach((peerData: any) => {
        const peer: PeerMetadata = {
          id: peerData.id,
          name: peerData.name,
          connected: false,
          lastSeen: new Date(peerData.lastSeen),
          isMock: peerData.isMock || false,
          capabilities: peerData.capabilities
        }
        addPeer(peer)
        if (peer.isMock) {
          peer.connected = true
          startMockDataGeneration(peer.id)
        }
      })

      console.log(`Loaded ${peersData.length} peer(s) from IndexedDB`)
    } catch (error) {
      console.error('Failed to load peers:', error)
    }
  }

  /**
   * Add a mock peer for testing
   */
  const addMockPeer = (name?: string): string => {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const mockName = name || `Mock Peer ${peers.value.size + 1}`
    
    const mockPeer: PeerMetadata = {
      id: mockId,
      name: mockName,
      connected: true,
      lastSeen: new Date(),
      isMock: true,
      capabilities: [
        { ...DEFAULT_CAPABILITIES.gyro, enabled: true },
        { ...DEFAULT_CAPABILITIES.accelerometer, enabled: true },
        { ...DEFAULT_CAPABILITIES.touch, enabled: true }
      ]
    }
    
    addPeer(mockPeer)
    startMockDataGeneration(mockId)
    
    return mockId
  }

  /**
   * Generate mock data for a peer
   */
  const startMockDataGeneration = (peerId: string) => {
    const generateMockData = () => {
      const peer = peers.value.get(peerId)
      if (!peer || !peer.connected) return
      
      // Generate mock gyro data
      const time = Date.now() / 1000
      updatePeerData(peerId, 'gyro', {
        alpha: Math.sin(time * 0.5) * 180,
        beta: Math.cos(time * 0.3) * 90,
        gamma: Math.sin(time * 0.7) * 45
      })
      
      // Generate mock accelerometer data
      const accel = {
        x: Math.sin(time * 2) * 10,
        y: Math.cos(time * 1.5) * 10,
        z: Math.sin(time * 3) * 5
      }
      updatePeerData(peerId, 'accelerometer', {
        ...accel,
        magnitude: Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2)
      })
      
      // Generate mock touch data
      if (Math.random() > 0.7) {
        updatePeerData(peerId, 'touch', {
          touches: [{
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            force: Math.random()
          }]
        })
      }
      
      // Continue generation if peer is still connected
      if (peer.connected) {
        setTimeout(generateMockData, 50) // 20fps
      }
    }
    
    generateMockData()
  }

  /**
   * Remove a mock peer
   */
  const removeMockPeer = (peerId: string) => {
    const peer = peers.value.get(peerId)
    if (peer?.isMock) {
      setPeerConnected(peerId, false)
      removePeer(peerId)
    }
  }

  return {
    // State
    peers,
    connectedPeers,
    allPeers,
    
    // Actions
    getPeer,
    addPeer,
    removePeer,
    setPeerConnected,
    updatePeerLastSeen,
    checkPeerHealth,
    updatePeerCapabilities,
    setCapabilityEnabled,
    updatePeerData,
    getPeerData,
    getAllPeerData,
    clearAll,
    addMockPeer,
    removeMockPeer,
    sendToPeer,
    sendToAllPeers,
    setPeerLayout,
    setHostPeer,
    setPeerAudioSource,
    saveToStorage,
    loadFromStorage
  }
})
