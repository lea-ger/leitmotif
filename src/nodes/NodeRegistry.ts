import { BaseNode } from './BaseNode'
import { NodeCategory, type NodeMetadata } from './types'

/**
 * Node constructor type
 */
type NodeConstructor = new (id?: string) => BaseNode

/**
 * Registered node type information
 */
interface RegisteredNode {
  constructor: NodeConstructor
  metadata: NodeMetadata
}

/**
 * Registry for all available node types
 */
export class NodeRegistry {
  private static nodes: Map<string, RegisteredNode> = new Map()

  /**
   * Register a node type
   */
  static register(nodeConstructor: NodeConstructor): void {
    // Create temporary instance to get metadata
    const instance = new nodeConstructor()
    const metadata = instance.getMetadata()
    
    this.nodes.set(metadata.type, {
      constructor: nodeConstructor,
      metadata
    })
    
    // Clean up temporary instance
    instance.cleanup()
  }

  /**
   * Create node instance by type
   */
  static create(type: string, id?: string): BaseNode | null {
    const registered = this.nodes.get(type)
    if (!registered) {
      console.error(`Node type "${type}" not registered`)
      return null
    }
    
    const node = new registered.constructor(id)
    node.initialize()
    return node
  }

  /**
   * Get all registered node types
   */
  static getAll(): RegisteredNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * Get nodes by category
   */
  static getByCategory(category: NodeCategory): RegisteredNode[] {
    return Array.from(this.nodes.values()).filter(
      node => node.metadata.category === category
    )
  }

  /**
   * Get node metadata
   */
  static getMetadata(type: string): NodeMetadata | null {
    const registered = this.nodes.get(type)
    return registered ? registered.metadata : null
  }

  /**
   * Check if node type exists
   */
  static has(type: string): boolean {
    return this.nodes.has(type)
  }

  /**
   * Clear all registered nodes (useful for testing)
   */
  static clear(): void {
    this.nodes.clear()
  }
}
