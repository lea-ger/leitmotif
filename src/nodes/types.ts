/**
 * Data types that can flow through node connections
 */
export const DataType = {
  AUDIO: 'audio',       // Audio streams/buffers (Tone.js)
  VIDEO: 'video',       // Video MediaStream
  CANVAS: 'canvas',     // Canvas/WebGL texture data
  NUMERIC: 'numeric',   // Numbers/Arrays (sensor data)
  EVENT: 'event',       // Discrete events (touch, tap)
  OBJECT: 'object',     // Generic structured data
  ANY: 'any'            // Wildcard for utility nodes
} as const

export type DataType = typeof DataType[keyof typeof DataType]

/**
 * Color coding for each data type (for UI visualization)
 */
export const DATA_TYPE_COLORS: Record<DataType, string> = {
  [DataType.AUDIO]: '#8A38F5',
  [DataType.VIDEO]: '#3b82f6',
  [DataType.CANVAS]: '#00BFE5',
  [DataType.NUMERIC]: '#E57E00',
  [DataType.EVENT]: '#ef4444',
  [DataType.OBJECT]: '#E50000',
  [DataType.ANY]: '#6b7280'
}

/**
 * Port direction
 */
export const PortDirection = {
  INPUT: 'input',
  OUTPUT: 'output'
} as const

export type PortDirection = typeof PortDirection[keyof typeof PortDirection]

/**
 * Port definition
 */
export interface Port {
  id: string
  nodeId: string
  name: string
  dataType: DataType
  direction: PortDirection
  connected: boolean
  value?: any
}

/**
 * Connection between two ports
 */
export interface Connection {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  dataType: DataType
}

/**
 * Node category for organization
 */
export const NodeCategory = {
  INPUT: 'input',
  PROCESSOR: 'processor',
  OUTPUT: 'output',
  UTILITY: 'utility'
} as const

export type NodeCategory = typeof NodeCategory[keyof typeof NodeCategory]

/**
 * Node metadata for registry
 */
export interface NodeMetadata {
  type: string
  category: NodeCategory
  displayName: string
  description: string
  color?: string
  icon?: string
}

/**
 * Node parameter definition
 */
export interface NodeParameter {
  id: string
  name: string
  type: 'number' | 'string' | 'boolean' | 'select'
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
}

/**
 * Validates if two ports can be connected
 */
export function canConnect(sourcePort: Port, targetPort: Port): boolean {
  // Must be different directions
  if (sourcePort.direction === targetPort.direction) {
    return false
  }

  // Source must be output, target must be input
  if (sourcePort.direction !== PortDirection.OUTPUT || targetPort.direction !== PortDirection.INPUT) {
    return false
  }

  // Cannot connect to self
  if (sourcePort.nodeId === targetPort.nodeId) {
    return false
  }

  // ANY type can connect to anything
  if (sourcePort.dataType === DataType.ANY || targetPort.dataType === DataType.ANY) {
    return true
  }

  // Types must match
  return sourcePort.dataType === targetPort.dataType
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
