import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import type {Connection as FlowConnection} from '@vue-flow/core'
import {BaseNode} from '../nodes/BaseNode'
import {NodeRegistry} from '../nodes/NodeRegistry'
import {canConnect, type Connection, generateId} from '../nodes/types'
import type { LayoutName } from './types/peer'
import * as storage from '../utils/storage'

interface GraphFlowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data: {
        node: BaseNode
        metadata: ReturnType<typeof NodeRegistry.getMetadata>
    }
    label: string
}

interface GraphFlowEdge {
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
    animated?: boolean
}

/**
 * Graph store for managing nodes and connections
 */
export const useGraphStore = defineStore('graph', () => {
    // Node instances (our custom BaseNode objects)
    const nodeInstances = ref<Map<string, BaseNode>>(new Map())

    // Vue Flow nodes (for rendering)
    const flowNodes = ref<GraphFlowNode[]>([])

    // Vue Flow edges (connections)
    const flowEdges = ref<GraphFlowEdge[]>([])

    // Internal connections map
    const connections = ref<Map<string, Connection>>(new Map())

    // Selected node
    const selectedNodeId = ref<string | null>(null)

    // Nodes with preview enabled
    const nodePreviewEnabled = ref<Set<string>>(new Set())

    // Graph settings
    const defaultPeerLayout = ref<LayoutName>('empty')

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
        const flowType = type === 'comment' ? 'comment' : 'custom'

        const newFlowNode: GraphFlowNode = {
            id: node.id,
            type: flowType,
            position,
            data: {
                node,
                metadata
            },
            label: metadata?.displayName || type
        }

        flowNodes.value.push(newFlowNode)

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

        // Get ports by ID (from Vue Flow handles)
        const sourcePort = sourceNode.getPort(flowConnection.sourceHandle || '')
        const targetPort = targetNode.getPort(flowConnection.targetHandle || '')

        if (!sourcePort || !targetPort) return false

        // Validate connection
        if (!canConnect(sourcePort, targetPort)) {
            console.warn('Invalid connection: type mismatch')
            return false
        }

        // Create connection using port names (stable identifiers)
        const connection: Connection = {
            id: generateId(),
            sourceNodeId: sourceNode.id,
            sourcePortName: sourcePort.name,  // Use name instead of ID
            targetNodeId: targetNode.id,
            targetPortName: targetPort.name,  // Use name instead of ID
            dataType: sourcePort.dataType
        }

        connections.value.set(connection.id, connection)

        // Mark ports as connected
        sourcePort.connected = true
        targetPort.connected = true

        // Add to Vue Flow
        const newFlowEdge: GraphFlowEdge = {
            id: connection.id,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle: sourcePort.id,
            targetHandle: targetPort.id,
            animated: true
        }
        flowEdges.value.push(newFlowEdge)

        return true
    }

    /**
     * Remove a connection
     */
    function removeConnection(connectionId: string): void {
        const connection = connections.value.get(connectionId)
        if (!connection) return

        // Unmark ports using names
        const sourceNode = nodeInstances.value.get(connection.sourceNodeId)
        const targetNode = nodeInstances.value.get(connection.targetNodeId)

        if (sourceNode) {
            const port = sourceNode.getPortByName(connection.sourcePortName)
            if (port) port.connected = false
        }

        if (targetNode) {
            const port = targetNode.getPortByName(connection.targetPortName)
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
     * Toggle preview visibility for a node
     */
    function toggleNodePreview(nodeId: string): void {
        const s = nodePreviewEnabled.value
        if (s.has(nodeId)) {
            s.delete(nodeId)
        } else {
            s.add(nodeId)
        }
        // trigger reactivity
        nodePreviewEnabled.value = new Set(s)
    }

    /**
     * Check if a node has preview enabled
     */
    function isPreviewEnabled(nodeId: string): boolean {
        return nodePreviewEnabled.value.has(nodeId)
    }

    /**
     * Select a node
     */
    function selectNode(nodeId: string | null): void {
        selectedNodeId.value = nodeId
    }

    /**
     * Get selected node instance
     */
    const selectedNode = computed((): BaseNode | null => {
        if (!selectedNodeId.value) return null
        return (nodeInstances.value.get(selectedNodeId.value) as BaseNode) ?? null
    })

    /**
     * Update node ports (force Vue Flow to re-render)
     */
    function updateNodePorts(nodeId: string): void {
        const flowNode = flowNodes.value.find(n => n.id === nodeId)
        if (flowNode) {
            // Trigger reactivity by creating new array
            flowNodes.value = [...flowNodes.value]
        }
    }

    function syncPeerNodePorts(peerId: string): void {
        for (const [nodeId, node] of nodeInstances.value.entries()) {
            if (node.type === 'peer' && typeof (node as any).getPeerId === 'function') {
                if ((node as any).getPeerId() === peerId) {
                    ;(node as any).refreshPorts?.()
                    updateNodePorts(nodeId)
                }
            }
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
        saveToStorage().catch(e => console.error('Failed to clear graph storage:', e))
    }

    /**
     * Save graph to IndexedDB
     */
    async function saveToStorage(): Promise<void> {
        try {
            const graphData = {
                nodes: Array.from(nodeInstances.value.entries()).map(([, node]) => {
                    const params: Record<string, any> = {}
                    if ((node as any).parameters instanceof Map) {
                        ;(node as any).parameters.forEach((value: any, key: string) => {
                            if (isCloneableForStorage(value)) {
                                params[key] = value
                            }
                        })
                    }

                    const exposedParams: string[] = []
                    if ((node as any).parameterDefinitions instanceof Map) {
                        ;(node as any).parameterDefinitions.forEach((def: any, key: string) => {
                            if (def.exposedAsInput) exposedParams.push(key)
                        })
                    }

                    let peerConfig: any = undefined
                    if (node.type === 'peer' && typeof (node as any).getPeerId === 'function') {
                        peerConfig = {
                            peerId: (node as any).getPeerId(),
                            enabledCapabilities: (node as any).getEnabledCapabilities?.() || [],
                            enabledOutputChannels: (node as any).getEnabledOutputChannels?.() || []
                        }
                    }

                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position,
                        enabled: node.enabled,
                        parameters: params,
                        exposedParameters: exposedParams,
                        peerConfig
                    }
                }),
                connections: Array.from(connections.value.values()),
                previewEnabled: Array.from(nodePreviewEnabled.value),
                settings: {
                    defaultPeerLayout: defaultPeerLayout.value
                }
            }

            await storage.setItem('leitmotif-graph', graphData)
        } catch (error) {
            console.error('Failed to save graph:', error)
        }
    }

    /**
     * Export graph as JSON string
     */
    function exportGraphJSON(): string {
        console.log('[GraphStore] Exporting graph, defaultPeerLayout:', defaultPeerLayout.value)
        const graphData = {
            nodes: Array.from(nodeInstances.value.entries()).map(([, node]) => {
                const params: Record<string, any> = {}
                if ((node as any).parameters instanceof Map) {
                    ;(node as any).parameters.forEach((value: any, key: string) => {
                        if (isCloneableForStorage(value)) {
                            params[key] = value
                        }
                    })
                }

                const exposedParams: string[] = []
                if ((node as any).parameterDefinitions instanceof Map) {
                    ;(node as any).parameterDefinitions.forEach((def: any, key: string) => {
                        if (def.exposedAsInput) exposedParams.push(key)
                    })
                }

                let peerConfig: any = undefined
                if (node.type === 'peer' && typeof (node as any).getPeerId === 'function') {
                    peerConfig = {
                        peerId: (node as any).getPeerId(),
                        enabledCapabilities: (node as any).getEnabledCapabilities?.() || [],
                        enabledOutputChannels: (node as any).getEnabledOutputChannels?.() || []
                    }
                }

                return {
                    id: node.id,
                    type: node.type,
                    position: node.position,
                    enabled: node.enabled,
                    parameters: params,
                    exposedParameters: exposedParams,
                    peerConfig
                }
            }),
            connections: Array.from(connections.value.values()),
            previewEnabled: Array.from(nodePreviewEnabled.value),
            settings: {
                defaultPeerLayout: defaultPeerLayout.value
            },
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                nodeCount: nodeInstances.value.size,
                connectionCount: connections.value.size
            }
        }

        console.log('[GraphStore] Export data settings:', graphData.settings)
        return JSON.stringify(graphData, null, 2)
    }

    /**
     * Download graph as JSON file
     */
    function downloadGraph(filename?: string): void {
        const json = exportGraphJSON()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || `leitmotif-graph-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    /**
     * Import graph from JSON string
     */
    async function importGraphJSON(json: string, merge: boolean = false): Promise<void> {
        try {
            const graphData = JSON.parse(json)
            
            if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
                throw new Error('Invalid graph format: missing nodes array')
            }

            if (merge) {
                // TODO: Implement merge mode (add to existing graph)
                console.warn('Merge mode not yet implemented, replacing graph')
            }

            await loadGraphData(graphData)
        } catch (error) {
            console.error('Failed to import graph:', error)
            throw error
        }
    }

    /**
     * Load graph from uploaded file
     */
    async function uploadGraph(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = async (e) => {
                try {
                    const json = e.target?.result as string
                    await importGraphJSON(json)
                    resolve()
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }

    /**
     * Load graph from a data object
     */
    async function loadGraphData(graphData: any): Promise<void> {
        try {
            if (!graphData) return

            nodeInstances.value.forEach(node => node.cleanup())
            nodeInstances.value.clear()
            connections.value.clear()
            flowNodes.value = []
            flowEdges.value = []

            graphData.nodes.forEach((nodeData: any) => {
                const node = NodeRegistry.create(nodeData.type, nodeData.id)
                if (!node) return

                node.position = nodeData.position
                node.enabled = nodeData.enabled

                if (nodeData.parameters) {
                    Object.keys(nodeData.parameters).forEach(key => {
                        node.setParameter(key, nodeData.parameters[key])
                    })
                }

                if (nodeData.exposedParameters && Array.isArray(nodeData.exposedParameters)) {
                    nodeData.exposedParameters.forEach((paramId: string) => {
                        node.exposeParameterAsInput(paramId)
                    })
                }

                if (nodeData.peerConfig && node.type === 'peer') {
                    const peerNode = node as any
                    if (nodeData.peerConfig.peerId && typeof peerNode.setPeer === 'function') {
                        peerNode.setPeer(nodeData.peerConfig.peerId)
                    }
                    if (nodeData.peerConfig.enabledCapabilities && typeof peerNode.configureCapabilities === 'function') {
                        peerNode.configureCapabilities(nodeData.peerConfig.enabledCapabilities)
                    }
                    if (nodeData.peerConfig.enabledOutputChannels && typeof peerNode.enableOutputChannel === 'function') {
                        for (const ch of nodeData.peerConfig.enabledOutputChannels) {
                            peerNode.enableOutputChannel(ch)
                        }
                    }
                }

                nodeInstances.value.set(node.id, node)

                const metadata = NodeRegistry.getMetadata(nodeData.type)
                const flowType = nodeData.type === 'comment' ? 'comment' : 'custom'

                const restoredFlowNode: GraphFlowNode = {
                    id: node.id,
                    type: flowType,
                    position: nodeData.position,
                    data: {node, metadata},
                    label: metadata?.displayName || nodeData.type
                }

                flowNodes.value.push(restoredFlowNode)
            })

            graphData.connections.forEach((conn: Connection) => {
                const sourceNode = nodeInstances.value.get(conn.sourceNodeId)
                const targetNode = nodeInstances.value.get(conn.targetNodeId)
                if (!sourceNode || !targetNode) return

                const sourcePort = sourceNode.getOutputPortByName(conn.sourcePortName)
                const targetPort = targetNode.getInputPortByName(conn.targetPortName)
                if (!sourcePort || !targetPort) {
                    console.warn(`Failed to restore connection: ${conn.sourcePortName} -> ${conn.targetPortName}`)
                    return
                }

                connections.value.set(conn.id, conn)
                sourcePort.connected = true
                targetPort.connected = true

                const restoredFlowEdge: GraphFlowEdge = {
                    id: conn.id,
                    source: sourceNode.id,
                    target: targetNode.id,
                    sourceHandle: sourcePort.id,
                    targetHandle: targetPort.id,
                    animated: true
                }
                flowEdges.value.push(restoredFlowEdge)
            })

            if (Array.isArray(graphData.previewEnabled)) {
                nodePreviewEnabled.value = new Set(graphData.previewEnabled)
            }

            // Load graph settings
            if (graphData.settings) {
                console.log('[GraphStore] Loading settings:', graphData.settings)
                if (graphData.settings.defaultPeerLayout) {
                    defaultPeerLayout.value = graphData.settings.defaultPeerLayout
                    console.log('[GraphStore] Set defaultPeerLayout to:', defaultPeerLayout.value)
                }
            }

            // Save the loaded demo/data to storage so it persists on reload
            await saveToStorage()

            console.log('Graph loaded from data')
        } catch (error) {
            console.error('Failed to load graph data:', error)
        }
    }

    /**
     * Load graph from IndexedDB (falls back to localStorage for one-time migration)
     */
    async function loadFromStorage(): Promise<void> {
        try {
            let graphData = await storage.getItem<any>('leitmotif-graph')

            // One-time migration from localStorage
            if (!graphData) {
                const legacy = localStorage.getItem('leitmotif-graph')
                if (legacy) {
                    graphData = JSON.parse(legacy)
                    await storage.setItem('leitmotif-graph', graphData)
                    localStorage.removeItem('leitmotif-graph')
                    console.log('Migrated graph from localStorage to IndexedDB')
                }
            }

            await loadGraphData(graphData)
        } catch (error) {
            console.error('Failed to load graph:', error)
        }
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
        selectedNodeId,
        selectedNode,
        nodePreviewEnabled,
        defaultPeerLayout,

        // Actions
        addNode,
        removeNode,
        addConnection,
        removeConnection,
        updateNodePosition,
        selectNode,
        updateNodePorts,
        syncPeerNodePorts,
        toggleNodePreview,
        isPreviewEnabled,
        clear,
        saveToStorage,
        loadFromStorage,
        loadGraphData,
        exportGraphJSON,
        downloadGraph,
        importGraphJSON,
        uploadGraph
    }
})
    function isCloneableForStorage(value: any): boolean {
        if (value === undefined) return false
        if (
            value === null ||
            typeof value === 'number' ||
            typeof value === 'string' ||
            typeof value === 'boolean'
        ) return true
        try {
            structuredClone(value)
            return true
        } catch {
            return false
        }
    }
