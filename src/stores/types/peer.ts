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
  currentLayout?: LayoutName
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
  | { type: 'heartbeat' }
  | { type: 'sensors'; ax: number; ay: number; az: number; alpha: number; beta: number; gamma: number }
  | { type: 'keydown'; note: string; frequency: number; velocity: number }
  | { type: 'keyup';   note: string }
  | { type: 'draw';    x: number; y: number; pressure: number; phase: 'start' | 'move' | 'end' }
  | { type: 'touchpad'; x: number; y: number; force: number; active: boolean }

// ---------------------------------------------------------------------------
// Default capability definitions
// ---------------------------------------------------------------------------

export const DEFAULT_CAPABILITIES: Record<string, Omit<PeerCapability, 'enabled'>> = {
  [CapabilityType.GYRO]: {
    type: CapabilityType.GYRO,
    ports: [
      { name: 'alpha', dataType: 'numeric', description: 'Rotation around Z axis (0-360)' },
      { name: 'beta',  dataType: 'numeric', description: 'Rotation around X axis (-180 to 180)' },
      { name: 'gamma', dataType: 'numeric', description: 'Rotation around Y axis (-90 to 90)' }
    ]
  },
  [CapabilityType.ACCELEROMETER]: {
    type: CapabilityType.ACCELEROMETER,
    ports: [
      { name: 'x',         dataType: 'numeric', description: 'Acceleration X (m/s²)' },
      { name: 'y',         dataType: 'numeric', description: 'Acceleration Y (m/s²)' },
      { name: 'z',         dataType: 'numeric', description: 'Acceleration Z (m/s²)' },
      { name: 'magnitude', dataType: 'numeric', description: 'Total acceleration (m/s²)' }
    ]
  },
  [CapabilityType.TOUCH]: {
    type: CapabilityType.TOUCH,
    ports: [
      { name: 'touches',  dataType: 'object', description: 'List of active touch points' },
      { name: 'tapEvent', dataType: 'event',  description: 'Triggers on finger tap' }
    ]
  },
  [CapabilityType.AUDIO]: {
    type: CapabilityType.AUDIO,
    ports: [{ name: 'stream', dataType: 'audio', description: 'Raw audio stream from microphone' }]
  },
  [CapabilityType.VIDEO]: {
    type: CapabilityType.VIDEO,
    ports: [{ name: 'stream', dataType: 'video', description: 'Raw video stream from camera' }]
  },
  [CapabilityType.CANVAS]: {
    type: CapabilityType.CANVAS,
    ports: [{ name: 'frame', dataType: 'canvas', description: 'Received canvas frame' }]
  },
  [CapabilityType.CUSTOM]: {
    type: CapabilityType.CUSTOM,
    ports: [{ name: 'data', dataType: 'object', description: 'Custom JSON data payload' }]
  },
  [CapabilityType.KEYBOARD]: {
    type: CapabilityType.KEYBOARD,
    ports: [
      { name: 'note',      dataType: 'object',  description: 'Note object { name, midi, vel }' },
      { name: 'frequency', dataType: 'numeric', description: 'Frequency in Hz' },
      { name: 'velocity',  dataType: 'numeric', description: 'Velocity (0.0-1.0)' },
      { name: 'keyEvent',  dataType: 'event',   description: 'Triggers on key press' }
    ]
  },
  [CapabilityType.DRAW]: {
    type: CapabilityType.DRAW,
    ports: [
      { name: 'x',         dataType: 'numeric', description: 'X position' },
      { name: 'y',         dataType: 'numeric', description: 'Y position' },
      { name: 'pressure',  dataType: 'numeric', description: 'Pressure (0.0-1.0)' },
      { name: 'phase',     dataType: 'object',  description: 'Phase: start/move/end' },
      { name: 'drawEvent', dataType: 'event',   description: 'Full pointer event object' }
    ]
  },
  [CapabilityType.TOUCHPAD]: {
    type: CapabilityType.TOUCHPAD,
    ports: [
      { name: 'x',      dataType: 'numeric', description: 'Normalized X (0.0-1.0)' },
      { name: 'y',      dataType: 'numeric', description: 'Normalized Y (0.0-1.0)' },
      { name: 'force',  dataType: 'numeric', description: 'Pressure force' },
      { name: 'active', dataType: 'event',   description: 'Triggers while touching' }
    ]
  }
}
