// Core
export * from './types'
export * from './BaseNode'
export * from './NodeRegistry'

// Input nodes
export * from './input/GyroInputNode'

// Processor nodes
export * from './processor/MathMapNode'
export * from './processor/ToneSynthNode'

// Output nodes
export * from './output/AudioOutputNode'
export * from './output/CanvasOutputNode'

// Utility nodes
export * from './utility/DebugNode'

// Auto-register all nodes
import { NodeRegistry } from './NodeRegistry'
import { GyroInputNode } from './input/GyroInputNode'
import { MathMapNode } from './processor/MathMapNode'
import { ToneSynthNode } from './processor/ToneSynthNode'
import { AudioOutputNode } from './output/AudioOutputNode'
import { CanvasOutputNode } from './output/CanvasOutputNode'
import { DebugNode } from './utility/DebugNode'

// Register all nodes
export function registerAllNodes(): void {
  NodeRegistry.register(GyroInputNode)
  NodeRegistry.register(MathMapNode)
  NodeRegistry.register(ToneSynthNode)
  NodeRegistry.register(AudioOutputNode)
  NodeRegistry.register(CanvasOutputNode)
  NodeRegistry.register(DebugNode)
}
