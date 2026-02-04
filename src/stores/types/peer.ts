/**
const pinia = createPinia()
 * Types for peer capability system
 */

export const CapabilityType = {
  GYRO: 'gyro',
  ACCELEROMETER: 'accelerometer',
  TOUCH: 'touch',
  AUDIO: 'audio',
  VIDEO: 'video',
  CANVAS: 'canvas',
  CUSTOM: 'custom'
} as const

export type CapabilityType = typeof CapabilityType[keyof typeof CapabilityType]

/**
 * Configuration for a specific peer capability
 */
export interface PeerCapability {
  type: CapabilityType
  enabled: boolean
  ports: CapabilityPort[]
  config?: Record<string, any>
}

/**
 * Port definition for a capability
 */
export interface CapabilityPort {
  name: string
  dataType: string
  description?: string
}

/**
 * Metadata about a connected peer
 */
export interface PeerMetadata {
  id: string
  name: string
  capabilities: PeerCapability[]
  connected: boolean
  lastSeen: Date
  connection?: any // PeerJS DataConnection
  isMock?: boolean // Flag for mock/test peers
}

/**
 * Data payload from a peer with metadata
 */
export interface PeerDataPayload<T = any> {
  peerId: string
  peerName: string
  timestamp: number
  data: T
}

/**
 * Default capability definitions
 */
export const DEFAULT_CAPABILITIES: Record<CapabilityType, Omit<PeerCapability, 'enabled'>> = {
  [CapabilityType.GYRO]: {
    type: CapabilityType.GYRO,
    ports: [
      { name: 'alpha', dataType: 'numeric', description: 'Rotation around Z axis' },
      { name: 'beta', dataType: 'numeric', description: 'Rotation around X axis' },
      { name: 'gamma', dataType: 'numeric', description: 'Rotation around Y axis' }
    ]
  },
  [CapabilityType.ACCELEROMETER]: {
    type: CapabilityType.ACCELEROMETER,
    ports: [
      { name: 'x', dataType: 'numeric', description: 'Acceleration along X axis' },
      { name: 'y', dataType: 'numeric', description: 'Acceleration along Y axis' },
      { name: 'z', dataType: 'numeric', description: 'Acceleration along Z axis' },
      { name: 'magnitude', dataType: 'numeric', description: 'Total acceleration magnitude' }
    ]
  },
  [CapabilityType.TOUCH]: {
    type: CapabilityType.TOUCH,
    ports: [
      { name: 'touches', dataType: 'object', description: 'Touch event data' },
      { name: 'tapEvent', dataType: 'event', description: 'Tap events' }
    ]
  },
  [CapabilityType.AUDIO]: {
    type: CapabilityType.AUDIO,
    ports: [
      { name: 'stream', dataType: 'audio', description: 'Audio MediaStream' }
    ]
  },
  [CapabilityType.VIDEO]: {
    type: CapabilityType.VIDEO,
    ports: [
      { name: 'stream', dataType: 'video', description: 'Video MediaStream' }
    ]
  },
  [CapabilityType.CANVAS]: {
    type: CapabilityType.CANVAS,
    ports: [
      { name: 'frame', dataType: 'canvas', description: 'Canvas frame data' }
    ]
  },
  [CapabilityType.CUSTOM]: {
    type: CapabilityType.CUSTOM,
    ports: [
      { name: 'data', dataType: 'object', description: 'Custom data stream' }
    ]
  }
}
