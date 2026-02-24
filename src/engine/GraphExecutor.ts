import { BaseNode } from '../nodes/BaseNode'
import { type Connection } from '../nodes/types'

/**
 * Executes the node graph
 */
export class GraphExecutor {
  private nodes: Map<string, BaseNode> = new Map()
  private connections: Connection[] = []
  private executionOrder: BaseNode[] = []
  private isRunning: boolean = false
  private animationFrameId: number | null = null
  private targetFPS: number = 60
  
  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS
  }

  /**
   * Set nodes and connections
   */
  setGraph(nodes: readonly BaseNode[], connections: readonly Connection[]): void {
    this.nodes.clear()
    nodes.forEach(node => this.nodes.set(node.id, node))
    this.connections = [...connections]
    
    // Calculate execution order (topological sort)
    this.calculateExecutionOrder()
  }

  /**
   * Topological sort to determine execution order
   */
  private calculateExecutionOrder(): void {
    const sorted: BaseNode[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return
      if (visiting.has(nodeId)) {
        console.warn('Circular dependency detected in graph')
        return
      }
      
      visiting.add(nodeId)
      
      // Visit all nodes that this node depends on (input connections)
      const inputConnections = this.connections.filter(c => c.targetNodeId === nodeId)
      inputConnections.forEach(conn => {
        visit(conn.sourceNodeId)
      })
      
      visiting.delete(nodeId)
      visited.add(nodeId)
      
      const node = this.nodes.get(nodeId)
      if (node && node.enabled) {
        sorted.push(node)
      }
    }
    
    // Visit all nodes
    this.nodes.forEach((_, nodeId) => visit(nodeId))
    
    this.executionOrder = sorted
  }

  /**
   * Execute one frame of the graph
   */
  private executeFrame(): void {
    try {
      // Propagate data through connections
      this.connections.forEach(conn => {
        const sourceNode = this.nodes.get(conn.sourceNodeId)
        const targetNode = this.nodes.get(conn.targetNodeId)
        
        if (!sourceNode || !targetNode) return
        
        const sourcePort = sourceNode.getPortByName(conn.sourcePortName)
        const targetPort = targetNode.getPortByName(conn.targetPortName)
        
        if (sourcePort && targetPort) {
          // Copy value from source output to target input
          targetPort.value = sourcePort.value
        }
      })
      
      // Execute nodes in order
      this.executionOrder.forEach(node => {
        if (node.enabled) {
          try {
            node.process()
          } catch (error) {
            console.error(`Error processing node ${node.id} (${node.type}):`, error)
          }
        }
      })
    } catch (error) {
      console.error('Error executing graph frame:', error)
    }
  }

  /**
   * Start execution loop
   */
  async start(): Promise<void> {
    if (this.isRunning) return
    
    // Re-initialize synth nodes that may have been cleaned up
    this.nodes.forEach(node => {
      if (node.type === 'tone-synth' && (node as any).synth === null) {
        try {
          (node as any).setupSynth()
        } catch (e) {
          console.warn('Failed to reinitialize synth:', e)
        }
      }
    })
    
    this.isRunning = true
    const frameInterval = 1000 / this.targetFPS
    let lastFrameTime = performance.now()
    
    const loop = (currentTime: number): void => {
      if (!this.isRunning) return
      
      const elapsed = currentTime - lastFrameTime
      
      // Throttle to target FPS
      if (elapsed >= frameInterval) {
        this.executeFrame()
        lastFrameTime = currentTime - (elapsed % frameInterval)
      }
      
      this.animationFrameId = requestAnimationFrame(loop)
    }
    
    this.animationFrameId = requestAnimationFrame(loop)
  }

  /**
   * Stop execution loop
   */
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Stop all audio by calling cleanup on audio-related nodes
    this.nodes.forEach(node => {
      // Cleanup audio output and synth nodes to stop sound
      if (node.type === 'audio-output' || node.type === 'tone-synth') {
        try {
          node.cleanup()
        } catch (e) {
          console.warn('Failed to cleanup node on stop:', e)
        }
      }
    })
  }

  /**
   * Execute a single frame (for testing/debugging)
   */
  step(): void {
    this.executeFrame()
  }

  /**
   * Check if executor is running
   */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(120, fps))
  }

  /**
   * Get current execution order
   */
  getExecutionOrder(): BaseNode[] {
    return [...this.executionOrder]
  }
}
