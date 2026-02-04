import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Session store for managing room keys and WebRTC connections
 */
export const useSessionStore = defineStore('session', () => {
  const roomKey = ref<string>('')
  const peerId = ref<string>('')
  const isHost = ref(false)

  /**
   * Generate an 8-digit room key
   */
  const generateRoomKey = (): string => {
    const key = Math.floor(10000000 + Math.random() * 90000000).toString()
    roomKey.value = key
    saveToLocalStorage()
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
      }
    } catch (e) {
      console.warn('Failed to load session from localStorage', e)
    }
  }

  /**
   * Clear session
   */
  const clearSession = () => {
    roomKey.value = ''
    peerId.value = ''
    isHost.value = false
    try {
      localStorage.removeItem('leitmotif-session')
    } catch (e) {
      console.warn('Failed to clear session from localStorage', e)
    }
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  return {
    // State
    roomKey,
    peerId,
    isHost,
    joinUrl,
    formattedRoomKey,
    
    // Actions
    generateRoomKey,
    setRoomKey,
    setPeerId,
    setIsHost,
    clearSession
  }
})
