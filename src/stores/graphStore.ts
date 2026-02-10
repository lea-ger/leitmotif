import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Node as FlowNode, Edge as FlowEdge, Connection as FlowConnection } from '@vue-flow/core'
import { BaseNode } from '../nodes/BaseNode'
import { NodeRegistry } from '../nodes/NodeRegistry'
import { type Connection, canConnect, generateId } from '../nodes/types'

/**
 * Graph store for managing nodes and connections
 */
export const useGraphStore = defineStore('graph', () => {
  // Node instances (our custom BaseNode objects)
  const nodeInstances = ref<Map<string, BaseNode>>(new Map())

  // Vue Flow nodes (for rendering)
  const flowNodes = ref<FlowNode[]>([])

  // Vue Flow edges (connections)
  const flowEdges = ref<FlowEdge[]>([])

  // Internal connections map
  const connections = ref<Map<string, Connection>>(new Map())

  /**
   * Add a new node to the graph
   */
  function addNode(type: string, position: { x: number; y: number }): BaseNode | null {
    const node = NodeRegistry.create(type)
    if (!node) return null

    node.position = position
    nodeInstances.value.set(node.id, node)

    // Create Vue Flow node
    const metadata = NodeRegistry.getMetadata(type)
    flowNodes.value = [...flowNodes.value, {
      id: node.id,
      type: 'custom',
      position,
      data: {
        node,
        metadata
      },
      label: metadata?.displayName || type
    }]

    return node
  }

  /**
   * Remove a node from the graph
   */
  function removeNode(nodeId: string): void {
    const node = nodeInstances.value.get(nodeId)
    if (node) {
      node.cleanup()
      nodeInstances.value.delete(nodeId)
    }

    // Remove from Vue Flow
    flowNodes.value = flowNodes.value.filter(n => n.id !== nodeId)

    // Remove all connections involving this node
    const toRemove: string[] = []
    connections.value.forEach((conn, id) => {
      if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
        toRemove.push(id)
      }
    })
    toRemove.forEach(id => removeConnection(id))
  }

  /**
   * Create a connection between two ports
   */
  function addConnection(flowConnection: FlowConnection): boolean {
    const sourceNode = nodeInstances.value.get(flowConnection.source)
    const targetNode = nodeInstances.value.get(flowConnection.target)

    if (!sourceNode || !targetNode) return false

    // Get ports
    const sourcePort = sourceNode.getPort(flowConnection.sourceHandle || '')
    const targetPort = targetNode.getPort(flowConnection.targetHandle || '')

    if (!sourcePort || !targetPort) return false

    // Validate connection
    if (!canConnect(sourcePort, targetPort)) {
      console.warn('Invalid connection: type mismatch')
      return false
    }

    // Create connection
    const connection: Connection = {
      id: generateId(),
      sourceNodeId: sourceNode.id,
      sourcePortId: sourcePort.id,
      targetNodeId: targetNode.id,
      targetPortId: targetPort.id,
      dataType: sourcePort.dataType
    }

    connections.value.set(connection.id, connection)

    // Mark ports as connected
    sourcePort.connected = true
    targetPort.connected = true

    // Add to Vue Flow
    flowEdges.value.push({
      id: connection.id,
      source: sourceNode.id,
      target: targetNode.id,
      sourceHandle: sourcePort.id,
      targetHandle: targetPort.id,
      animated: true
    })

    return true
  }

  /**
   * Remove a connection
   */
  function removeConnection(connectionId: string): void {
    const connection = connections.value.get(connectionId)
    if (!connection) return

    // Unmark ports
    const sourceNode = nodeInstances.value.get(connection.sourceNodeId)
    const targetNode = nodeInstances.value.get(connection.targetNodeId)

    if (sourceNode) {
      const port = sourceNode.getPort(connection.sourcePortId)
      if (port) port.connected = false
    }

    if (targetNode) {
      const port = targetNode.getPort(connection.targetPortId)
      if (port) port.connected = false
    }

    connections.value.delete(connectionId)
    flowEdges.value = flowEdges.value.filter(e => e.id !== connectionId)
  }

  /**
   * Update node position
   */
  function updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
    const node = nodeInstances.value.get(nodeId)
    if (node) {
      node.position = position
    }

    const flowNode = flowNodes.value.find(n => n.id === nodeId)
    if (flowNode) {
      flowNode.position = position
    }
  }

  /**
   * Clear entire graph
   */
  function clear(): void {
    nodeInstances.value.forEach(node => node.cleanup())
    nodeInstances.value.clear()
    connections.value.clear()
    flowNodes.value = []
    flowEdges.value = []
  }

  /**
   * Get all node instances as array
   */
  const nodes = computed(() => {
    return Array.from(nodeInstances.value.values())
  })

  /**
   * Get all connections
   */
  const allConnections = computed(() => Array.from(connections.value.values()))

  return {
    // State
    nodeInstances,
    flowNodes,
    flowEdges,
    nodes,
    allConnections,

    // Actions
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    updateNodePosition,
    clear
  }
})
