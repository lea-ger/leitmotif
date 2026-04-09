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
  [DataType.AUDIO]: '#10b981',   // green
  [DataType.VIDEO]: '#3b82f6',   // blue
  [DataType.CANVAS]: '#00BFE5',  // cyan
  [DataType.NUMERIC]: '#f59e0b', // amber
  [DataType.EVENT]: '#ef4444',   // red
  [DataType.OBJECT]: '#8b5cf6',  // violet
  [DataType.ANY]: '#6b7280'      // gray
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
  description?: string
}

/**
 * Connection between two ports
 * Uses port names instead of IDs for stability across saves/loads
 */
export interface Connection {
  id: string
  sourceNodeId: string
  sourcePortName: string  // Stable identifier (e.g., "frequency", "audio")
  targetNodeId: string
  targetPortName: string  // Stable identifier (e.g., "param_volume", "input")
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
  icon: string
  color?: string
  showInLibrary?: boolean  // false = only addable via special UI (e.g. peer panel)
}

export const NodeVisualCategory = {
  VIDEO: 'video',
  AUDIO: 'audio',
  PROCESSING: 'processing',
  CONTROL_FLOW: 'control-flow',
  OUTPUT: 'output',
  UTILITY: 'utility'
} as const

export type NodeVisualCategory = typeof NodeVisualCategory[keyof typeof NodeVisualCategory]

const NODE_VISUAL_COLORS: Record<NodeVisualCategory, string> = {
  [NodeVisualCategory.VIDEO]: '#00BFE5',       // light blue / canvas
  [NodeVisualCategory.AUDIO]: '#10b981',       // green
  [NodeVisualCategory.PROCESSING]: '#f59e0b',  // amber
  [NodeVisualCategory.CONTROL_FLOW]: '#0ea5e9',// sky
  [NodeVisualCategory.OUTPUT]: '#2563eb',      // blue
  [NodeVisualCategory.UTILITY]: '#6b7280'      // gray
}

export function getNodeVisualCategory(metadata: NodeMetadata | null | undefined): NodeVisualCategory {
  if (!metadata) return NodeVisualCategory.PROCESSING

  switch (metadata.type) {
    case 'generate-canvas':
    case 'image':
    case 'canvas-transform':
    case 'canvas-merge':
    case 'peer':
    case 'all-peers':
      return NodeVisualCategory.VIDEO

    case 'tone-synth':
      return NodeVisualCategory.AUDIO

    case 'if':
    case 'loop':
      return NodeVisualCategory.CONTROL_FLOW

    case 'all-peers-output':
      return NodeVisualCategory.OUTPUT

    case 'comment':
    case 'debug':
      return NodeVisualCategory.UTILITY

    default:
      return NodeVisualCategory.PROCESSING
  }
}

export function getNodeColor(metadata: NodeMetadata | null | undefined): string {
  if (metadata?.type === 'audio-output') return DATA_TYPE_COLORS[DataType.AUDIO]
  if (metadata?.type === 'canvas-output') return DATA_TYPE_COLORS[DataType.CANVAS]
  return NODE_VISUAL_COLORS[getNodeVisualCategory(metadata)]
}

/**
 * Node parameter definition
 */
export interface NodeParameter {
  id: string
  name: string
  type: 'number' | 'string' | 'boolean' | 'select' | 'image'
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
  exposedAsInput?: boolean  // Whether this parameter is exposed as an input port
  dataType?: DataType       // Data type when exposed as input (defaults to NUMERIC)
  description?: string      // Help text shown in tooltip
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
