import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import type { PeerCapability, CapabilityType } from '../../stores/types/peer'
import { usePeerStore } from '../../stores/peerStore'

/**
 * Generic Peer Node
 * Represents a single peer with dynamically configured capabilities
 */
export class PeerNode extends BaseNode {
  private peerId: string | null = null
  private enabledCapabilities: Set<CapabilityType> = new Set()
  private peerStore = usePeerStore()

  constructor(id?: string) {
    super('peer', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'peer',
      category: NodeCategory.INPUT,
      displayName: 'Peer',
      description: 'Represents a connected peer with configurable data streams',
      color: '#3b82f6',
      icon: 'ph:user'
    }
  }

  initialize(): void {
    // Ports are dynamically created when peer is assigned
  }

  /**
   * Bind this node to a specific peer
   */
  setPeer(peerId: string): void {
    this.peerId = peerId
    const peer = this.peerStore.getPeer(peerId)
    
    if (peer) {
      this.name = `Peer: ${peer.name}`
      this.updatePorts()
    }
  }

  /**
   * Get the bound peer ID
   */
  getPeerId(): string | null {
    return this.peerId
  }

  /**
   * Configure which capabilities should be exposed as ports
   */
  configureCapabilities(capabilities: CapabilityType[]): void {
    this.enabledCapabilities = new Set(capabilities)
    this.updatePorts()
  }

  /**
   * Get enabled capabilities (for serialization)
   */
  getEnabledCapabilities(): CapabilityType[] {
    return Array.from(this.enabledCapabilities)
  }

  /**
   * Enable a specific capability
   */
  enableCapability(capabilityType: CapabilityType): void {
    this.enabledCapabilities.add(capabilityType)
    this.updatePorts()
    
    // Update peer store
    if (this.peerId) {
      this.peerStore.setCapabilityEnabled(this.peerId, capabilityType, true)
    }
  }

  /**
   * Disable a specific capability
   */
  disableCapability(capabilityType: CapabilityType): void {
    this.enabledCapabilities.delete(capabilityType)
    this.updatePorts()
    
    // Update peer store
    if (this.peerId) {
      this.peerStore.setCapabilityEnabled(this.peerId, capabilityType, false)
    }
  }

  /**
   * Update ports based on peer capabilities
   */
  private updatePorts(): void {
    if (!this.peerId) return

    const peer = this.peerStore.getPeer(this.peerId)
    if (!peer) return

    // Clear existing outputs only (keep inputs if any)
    this.outputs.clear()

    // Create output ports for each enabled capability
    for (const capability of peer.capabilities) {
      if (this.enabledCapabilities.has(capability.type)) {
        this.addCapabilityPorts(capability)
      }
    }
  }

  /**
   * Add ports for a specific capability
   */
  private addCapabilityPorts(capability: PeerCapability): void {
    for (const port of capability.ports) {
      const portName = `${capability.type}.${port.name}`
      const dataType = this.mapDataType(port.dataType)
      this.addOutput(portName, dataType)
    }
  }

  /**
   * Map capability data type to node DataType
   */
  private mapDataType(dataType: string): DataType {
    switch (dataType) {
      case 'numeric':
        return DataType.NUMERIC
      case 'audio':
        return DataType.AUDIO
      case 'video':
        return DataType.VIDEO
      case 'canvas':
        return DataType.CANVAS
      case 'event':
        return DataType.EVENT
      case 'object':
        return DataType.OBJECT
      default:
        return DataType.ANY
    }
  }

  /**
   * Process node - pull latest data from peer store
   */
  process(): void {
    if (!this.peerId) return

    const peer = this.peerStore.getPeer(this.peerId)
    if (!peer || !peer.connected) return

    // Update output values from peer data
    for (const capability of peer.capabilities) {
      if (capability.enabled && this.enabledCapabilities.has(capability.type)) {
        const data = this.peerStore.getPeerData(this.peerId, capability.type)
        
        if (data) {
          // Set values for each port
          for (const port of capability.ports) {
            const portName = `${capability.type}.${port.name}`
            const value = data.data?.[port.name]
            this.setOutputValue(portName, value)
          }
        }
      }
    }
  }

  /**
   * Serialize with peer binding
   */
  toJSON() {
    return {
      ...super.toJSON(),
      peerId: this.peerId,
      enabledCapabilities: Array.from(this.enabledCapabilities)
    }
  }

  /**
   * Restore from JSON
   */
  fromJSON(data: any): void {
    if (data.peerId) {
      this.setPeer(data.peerId)
    }
    if (data.enabledCapabilities) {
      this.configureCapabilities(data.enabledCapabilities)
    }
  }
}
