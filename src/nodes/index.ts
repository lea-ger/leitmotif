// Core
export * from './types'
export * from './BaseNode'
export * from './NodeRegistry'

// Input nodes
export * from './input/PeerNode'
export * from './input/AllPeersNode'
export * from './input/ImageNode'
export * from './input/GenerateCanvasNode'

// Processor nodes
export * from './processor/MathMapNode'
export * from './processor/ToneSynthNode'
export * from './processor/LoopNode'
export * from './processor/ExpressionNode'
export * from './processor/IfNode'

// Output nodes
export * from './output/AudioOutputNode'
export * from './output/CanvasOutputNode'
export * from './output/AllPeersOutputNode'

// Utility nodes
export * from './utility/DebugNode'
export * from './utility/CommentNode'

// Auto-register all nodes
import { NodeRegistry } from './NodeRegistry'
import { PeerNode } from './input/PeerNode'
import { AllPeersNode } from './input/AllPeersNode'
import { GenerateCanvasNode } from './input/GenerateCanvasNode'
import { ImageNode } from './input/ImageNode'
import { MathMapNode } from './processor/MathMapNode'
import { ToneSynthNode } from './processor/ToneSynthNode'
import { LoopNode } from './processor/LoopNode'
import { ExpressionNode } from './processor/ExpressionNode'
import { IfNode } from './processor/IfNode'
import { AudioOutputNode } from './output/AudioOutputNode'
import { CanvasOutputNode } from './output/CanvasOutputNode'
import { AllPeersOutputNode } from './output/AllPeersOutputNode'
import { DebugNode } from './utility/DebugNode'
import { CommentNode } from './utility/CommentNode'

// Register all nodes
export function registerAllNodes(): void {
  NodeRegistry.register(PeerNode)
  NodeRegistry.register(AllPeersNode)
  NodeRegistry.register(GenerateCanvasNode)
  NodeRegistry.register(ImageNode)
  NodeRegistry.register(MathMapNode)
  NodeRegistry.register(ToneSynthNode)
  NodeRegistry.register(LoopNode)
  NodeRegistry.register(ExpressionNode)
  NodeRegistry.register(IfNode)
  NodeRegistry.register(AudioOutputNode)
  NodeRegistry.register(CanvasOutputNode)
  NodeRegistry.register(AllPeersOutputNode)
  NodeRegistry.register(DebugNode)
  NodeRegistry.register(CommentNode)
}
