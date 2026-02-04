import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import type { CapabilityType } from '../../stores/types/peer'
import { usePeerStore } from '../../stores/peerStore'

/**
 * All Peers Node
 * Aggregates data from all connected peers for a specific capability
 * Outputs arrays/collections with peer metadata
 */
export class AllPeersNode extends BaseNode {
  private peerStore = usePeerStore()
  private capabilityType: CapabilityType | null = null

  constructor(id?: string) {
    super('all-peers', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'all-peers',
      category: NodeCategory.INPUT,
      displayName: 'All Peers',
      description: 'Aggregates data from all connected peers',
      color: '#8b5cf6',
      icon: '👥'
    }
  }

  initialize(): void {
    // Create output ports for common aggregate types
    this.addOutput('allGyro', DataType.OBJECT)
    this.addOutput('allAccelerometer', DataType.OBJECT)
    this.addOutput('allTouch', DataType.OBJECT)
    this.addOutput('allAudio', DataType.OBJECT)
    this.addOutput('allVideo', DataType.OBJECT)
    this.addOutput('allCanvas', DataType.OBJECT)
    this.addOutput('allCustom', DataType.OBJECT)
  }

  /**
   * Set which capability type to aggregate (optional)
   * If not set, all capabilities are aggregated to their respective ports
   */
  setCapabilityType(capabilityType: CapabilityType | null): void {
    this.capabilityType = capabilityType
    
    if (capabilityType) {
      this.name = `All Peers (${capabilityType})`
    } else {
      this.name = 'All Peers'
    }
  }

  /**
   * Process node - aggregate data from all peers
   */
  process(): void {
    // Map capability types to output ports
    const capabilityPortMap: Record<string, string> = {
      'gyro': 'allGyro',
      'accelerometer': 'allAccelerometer',
      'touch': 'allTouch',
      'audio': 'allAudio',
      'video': 'allVideo',
      'canvas': 'allCanvas',
      'custom': 'allCustom'
    }

    // If a specific capability is set, only aggregate that one
    if (this.capabilityType) {
      const portName = capabilityPortMap[this.capabilityType]
      if (portName) {
        const data = this.peerStore.getAllPeerData(this.capabilityType)
        this.setOutputValue(portName, data)
      }
      return
    }

    // Otherwise, aggregate all capabilities
    for (const [capType, portName] of Object.entries(capabilityPortMap)) {
      const data = this.peerStore.getAllPeerData(capType)
      this.setOutputValue(portName, data)
    }
  }

  /**
   * Serialize with capability type
   */
  toJSON() {
    return {
      ...super.toJSON(),
      capabilityType: this.capabilityType
    }
  }

  /**
   * Restore from JSON
   */
  fromJSON(data: any): void {
    if (data.capabilityType) {
      this.setCapabilityType(data.capabilityType)
    }
  }
}
