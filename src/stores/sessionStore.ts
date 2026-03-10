import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Peer, { type DataConnection } from 'peerjs'
import { usePeerStore } from './peerStore'
import type { PeerMetadata } from './types/peer'
import { DEFAULT_CAPABILITIES } from './types/peer'
import { PEER_OPTIONS } from '../utils/peerConfig'

/**
 * Session store for managing room keys and WebRTC connections
 */
export const useSessionStore = defineStore('session', () => {
  const roomKey = ref<string>('')
  const peerId = ref<string>('')
  const isHost = ref(false)
  const hostStatus = ref<'idle' | 'connecting' | 'listening' | 'error'>('idle')

  // Active PeerJS host instance
  let hostPeer: Peer | null = null

  /**
   * Generate an 8-digit room key and immediately start the host peer
   */
  const generateRoomKey = (): string => {
    const key = Math.floor(10000000 + Math.random() * 90000000).toString()
    roomKey.value = key
    saveToLocalStorage()
    startHost(key)
    return key
  }

  /**
   * Set room key (for joining)
   */
  const setRoomKey = (key: string) => {
    roomKey.value = key
    saveToLocalStorage()
  }

  /**
   * Set peer ID from PeerJS
   */
  const setPeerId = (id: string) => {
    peerId.value = id
    saveToLocalStorage()
  }

  /**
   * Set host status
   */
  const setIsHost = (value: boolean) => {
    isHost.value = value
    saveToLocalStorage()
  }

  /**
   * Get join URL for the room
   */
  const joinUrl = computed(() => {
    if (!roomKey.value && !peerId.value) return ''
    const baseUrl = window.location.origin
    const key = roomKey.value || peerId.value
    return `${baseUrl}/client/${encodeURIComponent(key)}`
  })

  /**
   * Format room key with dashes (1234-5678)
   */
  const formattedRoomKey = computed(() => {
    const key = roomKey.value || peerId.value
    if (!key) return ''
    if (key.length === 8) {
      return `${key.slice(0, 4)}-${key.slice(4)}`
    }
    return key
  })

  /**
   * Save session to localStorage
   */
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('leitmotif-session', JSON.stringify({
        roomKey: roomKey.value,
        peerId: peerId.value,
        isHost: isHost.value
      }))
    } catch (e) {
      console.warn('Failed to save session to localStorage', e)
    }
  }

  /**
   * Load session from localStorage
   */
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('leitmotif-session')
      if (saved) {
        const data = JSON.parse(saved)
        roomKey.value = data.roomKey || ''
        peerId.value = data.peerId || ''
        isHost.value = data.isHost || false
        if (roomKey.value && isHost.value) {
          startHost(roomKey.value)
        }
      }
    } catch (e) {
      console.warn('Failed to load session from localStorage', e)
    }
  }

  /**
   * Close the room: disconnect all peers, stop the host peer, and clear session state.
   */
  const closeRoom = () => {
    const peerStore = usePeerStore()
    peerStore.clearAll()
    stopHost()
    roomKey.value = ''
    peerId.value = ''
    isHost.value = false
    try {
      localStorage.removeItem('leitmotif-session')
    } catch (e) {
      console.warn('Failed to clear session from localStorage', e)
    }
  }

  /**
   * Clear session
   */
  const clearSession = () => {
    stopHost()
    roomKey.value = ''
    peerId.value = ''
    isHost.value = false
    try {
      localStorage.removeItem('leitmotif-session')
    } catch (e) {
      console.warn('Failed to clear session from localStorage', e)
    }
  }

  /**
   * Start the PeerJS host peer, listening for incoming client connections.
   * Called automatically by generateRoomKey().
   */
  function startHost(key: string) {
    stopHost() // clean up any previous instance

    hostStatus.value = 'connecting'

    const peer = new Peer(key, PEER_OPTIONS)
    hostPeer = peer

    peer.on('open', (id) => {
      console.log('[Host] PeerJS ready, listening on', id)
      hostStatus.value = 'listening'
      peerId.value = id
      saveToLocalStorage()
    })

    peer.on('connection', (conn: DataConnection) => {
      console.log('[Host] Incoming connection from', conn.peer)
      handleClientConnection(conn)
    })

    peer.on('error', (err) => {
      console.error('[Host] PeerJS error:', err)
      hostStatus.value = 'error'
    })

    peer.on('disconnected', () => {
      console.warn('[Host] PeerJS disconnected, reconnecting…')
      peer.reconnect()
    })
  }

  function stopHost() {
    if (hostPeer) {
      hostPeer.destroy()
      hostPeer = null
    }
    hostStatus.value = 'idle'
  }

  function handleClientConnection(conn: DataConnection) {
    // Lazily get peerStore here to avoid circular dependency at module load time
    const peerStore = usePeerStore()

    const clientPeerId = conn.peer

    conn.on('open', () => {
      // Register the peer
      const meta: PeerMetadata = {
        id: clientPeerId,
        name: `Peer ${clientPeerId.slice(-4)}`,
        connected: true,
        lastSeen: new Date(),
        isMock: false,
        capabilities: Object.values(DEFAULT_CAPABILITIES).map(c => ({ ...c, enabled: true })),
        connection: conn,
      }
      peerStore.addPeer(meta)
      peerStore.setPeerConnected(clientPeerId, true)
      console.log('[Host] Peer registered:', clientPeerId)
    })

    conn.on('data', (payload: unknown) => {
      const data = payload as Record<string, any>

      if (!data || data.type === 'hello') return

      // Legacy & new typed message dispatch
      switch (data.type) {
        case 'sensors':
          peerStore.updatePeerData(clientPeerId, 'accelerometer', {
            x: data.ax, y: data.ay, z: data.az
          })
          peerStore.updatePeerData(clientPeerId, 'gyro', {
            alpha: data.alpha, beta: data.beta, gamma: data.gamma
          })
          break

        case 'keydown':
          peerStore.updatePeerData(clientPeerId, 'keyboard', {
            note: data.note, frequency: data.frequency, velocity: data.velocity, state: 'down'
          })
          break

        case 'keyup':
          peerStore.updatePeerData(clientPeerId, 'keyboard', {
            note: data.note, frequency: data.frequency ?? 0, velocity: 0, state: 'up'
          })
          break

        case 'draw':
          peerStore.updatePeerData(clientPeerId, 'draw', {
            x: data.x, y: data.y, pressure: data.pressure, phase: data.phase
          })
          break

        case 'touchpad':
          peerStore.updatePeerData(clientPeerId, 'touchpad', {
            x: data.x, y: data.y, force: data.force, active: data.active
          })
          break

        default:
          // Legacy flat sensor packet: { ax, ay, az, alpha, beta, gamma }
          if ('ax' in data) {
            peerStore.updatePeerData(clientPeerId, 'accelerometer', {
              x: data.ax, y: data.ay, z: data.az
            })
          }
          if ('alpha' in data) {
            peerStore.updatePeerData(clientPeerId, 'gyro', {
              alpha: data.alpha, beta: data.beta, gamma: data.gamma
            })
          }
      }
    })

    conn.on('close', () => {
      console.log('[Host] Peer disconnected:', clientPeerId)
      peerStore.setPeerConnected(clientPeerId, false)
    })

    conn.on('error', (err) => {
      console.error('[Host] Connection error for', clientPeerId, err)
      peerStore.setPeerConnected(clientPeerId, false)
    })
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  return {
    // State
    roomKey,
    peerId,
    isHost,
    hostStatus,
    joinUrl,
    formattedRoomKey,
    
    // Actions
    generateRoomKey,
    setRoomKey,
    setPeerId,
    setIsHost,
    startHost,
    stopHost,
    closeRoom,
    clearSession
  }
})
