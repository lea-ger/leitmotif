/**
 * Types for peer capability system
 */

export const CapabilityType = {
  GYRO: 'gyro',
  ACCELEROMETER: 'accelerometer',
  TOUCH: 'touch',
  AUDIO: 'audio',
  VIDEO: 'video',
  CANVAS: 'canvas',
  CUSTOM: 'custom',
  // Client-originated input layout types
  KEYBOARD: 'keyboard',
  DRAW: 'draw',
  TOUCHPAD: 'touchpad'
} as const

export type CapabilityType = typeof CapabilityType[keyof typeof CapabilityType]

export interface PeerCapability {
  type: CapabilityType
  enabled: boolean
  ports: CapabilityPort[]
  config?: Record<string, any>
}

export interface CapabilityPort {
  name: string
  dataType: string
  description?: string
}

export interface PeerMetadata {
  id: string
  name: string
  capabilities: PeerCapability[]
  connected: boolean
  lastSeen: Date
  connection?: any
  isMock?: boolean
}

export interface PeerDataPayload<T = any> {
  peerId: string
  peerName: string
  timestamp: number
  data: T
}

// ---------------------------------------------------------------------------
// Host → Client messages
// ---------------------------------------------------------------------------

export type LayoutName = 'empty' | 'keyboard' | 'canvas' | 'touchpad'

export type HostToClientMessage =
  | { type: 'canvas';       buffer: ArrayBuffer; width: number; height: number }
  | { type: 'haptic';       pattern: number[] }
  | { type: 'audioTrigger'; frequency: number; duration: number; volume: number; waveform: OscillatorType }
  | { type: 'layout';       layout: LayoutName }
  | { type: 'data';         key: string; value: unknown }

// ---------------------------------------------------------------------------
// Client → Host messages
// ---------------------------------------------------------------------------

export type ClientToHostMessage =
  | { type: 'hello' }
  | { type: 'sensors'; ax: number; ay: number; az: number; alpha: number; beta: number; gamma: number }
  | { type: 'keydown'; note: string; frequency: number; velocity: number }
  | { type: 'keyup';   note: string }
  | { type: 'draw';    x: number; y: number; pressure: number; phase: 'start' | 'move' | 'end' }
  | { type: 'touchpad'; x: number; y: number; force: number; active: boolean }

// ---------------------------------------------------------------------------
// Default capability definitions
// ---------------------------------------------------------------------------

export const DEFAULT_CAPABILITIES: Record<CapabilityType, Omit<PeerCapability, 'enabled'>> = {
  [CapabilityType.GYRO]: {
    type: CapabilityType.GYRO,
    ports: [
      { name: 'alpha', dataType: 'numeric', description: 'Rotation around Z axis' },
      { name: 'beta',  dataType: 'numeric', description: 'Rotation around X axis' },
      { name: 'gamma', dataType: 'numeric', description: 'Rotation around Y axis' }
    ]
  },
  [CapabilityType.ACCELEROMETER]: {
    type: CapabilityType.ACCELEROMETER,
    ports: [
      { name: 'x',         dataType: 'numeric', description: 'Acceleration along X axis' },
      { name: 'y',         dataType: 'numeric', description: 'Acceleration along Y axis' },
      { name: 'z',         dataType: 'numeric', description: 'Acceleration along Z axis' },
      { name: 'magnitude', dataType: 'numeric', description: 'Total acceleration magnitude' }
    ]
  },
  [CapabilityType.TOUCH]: {
    type: CapabilityType.TOUCH,
    ports: [
      { name: 'touches',  dataType: 'object', description: 'Touch event data' },
      { name: 'tapEvent', dataType: 'event',  description: 'Tap events' }
    ]
  },
  [CapabilityType.AUDIO]: {
    type: CapabilityType.AUDIO,
    ports: [{ name: 'stream', dataType: 'audio', description: 'Audio MediaStream' }]
  },
  [CapabilityType.VIDEO]: {
    type: CapabilityType.VIDEO,
    ports: [{ name: 'stream', dataType: 'video', description: 'Video MediaStream' }]
  },
  [CapabilityType.CANVAS]: {
    type: CapabilityType.CANVAS,
    ports: [{ name: 'frame', dataType: 'canvas', description: 'Canvas frame data' }]
  },
  [CapabilityType.CUSTOM]: {
    type: CapabilityType.CUSTOM,
    ports: [{ name: 'data', dataType: 'object', description: 'Custom data stream' }]
  },
  [CapabilityType.KEYBOARD]: {
    type: CapabilityType.KEYBOARD,
    ports: [
      { name: 'note',      dataType: 'object',  description: 'Most recent note object' },
      { name: 'frequency', dataType: 'numeric', description: 'Frequency of pressed key (Hz)' },
      { name: 'velocity',  dataType: 'numeric', description: 'Key velocity 0-1' },
      { name: 'keyEvent',  dataType: 'event',   description: 'keydown/keyup event' }
    ]
  },
  [CapabilityType.DRAW]: {
    type: CapabilityType.DRAW,
    ports: [
      { name: 'x',         dataType: 'numeric', description: 'Draw X position (px)' },
      { name: 'y',         dataType: 'numeric', description: 'Draw Y position (px)' },
      { name: 'pressure',  dataType: 'numeric', description: 'Touch pressure 0-1' },
      { name: 'phase',     dataType: 'object',  description: 'Phase: start/move/end' },
      { name: 'drawEvent', dataType: 'event',   description: 'Full draw event object' }
    ]
  },
  [CapabilityType.TOUCHPAD]: {
    type: CapabilityType.TOUCHPAD,
    ports: [
      { name: 'x',      dataType: 'numeric', description: 'Normalized X position 0-1' },
      { name: 'y',      dataType: 'numeric', description: 'Normalized Y position 0-1' },
      { name: 'force',  dataType: 'numeric', description: 'Touch force 0-1' },
      { name: 'active', dataType: 'event',   description: 'True while touching' }
    ]
  }
}
