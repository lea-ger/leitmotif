import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import type { CapabilityType, HostToClientMessage, LayoutName } from '../../stores/types/peer'
import { usePeerStore } from '../../stores/peerStore'
import { createThrottledCanvasSender } from '../../utils/canvasSerial'

/**
 * Generic Peer Node
 * Represents a single peer with dynamically configured capabilities
 */
export class PeerNode extends BaseNode {
  private peerId: string | null = null
  private peerStore = usePeerStore()

  // Output channels: which input ports (host→peer) are enabled
  private enabledOutputChannels: Set<string> = new Set()
  private canvasSender = createThrottledCanvasSender(15)
  // Track last sent values to avoid redundant sends
  private lastSentHaptic: string = ''
  private lastSentLayout: string = ''
  private lastSentAudio: string = ''

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
      icon: 'ph:user',
      showInLibrary: false
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
   * Configure capabilities — kept for backward compat, just refreshes ports
   */
  configureCapabilities(_capabilities: CapabilityType[]): void {
    this.refreshPorts()
  }

  /**
   * Get enabled capabilities from peerStore (for serialization compat)
   */
  getEnabledCapabilities(): CapabilityType[] {
    if (!this.peerId) return []
    const peer = this.peerStore.getPeer(this.peerId)
    return peer ? peer.capabilities.filter(c => c.enabled).map(c => c.type) : []
  }

  /**
   * Enable a capability via peerStore
   */
  enableCapability(capabilityType: CapabilityType): void {
    if (this.peerId) this.peerStore.setCapabilityEnabled(this.peerId, capabilityType, true)
    this.refreshPorts()
  }

  /**
   * Disable a capability via peerStore
   */
  disableCapability(capabilityType: CapabilityType): void {
    if (this.peerId) this.peerStore.setCapabilityEnabled(this.peerId, capabilityType, false)
    this.refreshPorts()
  }

  /**
   * Refresh ports to match peerStore capability enabled states (public, called from graphStore)
   */
  refreshPorts(): void {
    this.updatePorts()
  }

  /**
   * Incrementally sync output ports with peerStore capability enabled states.
   * Preserves existing port IDs to avoid breaking Vue Flow edges.
   */
  private updatePorts(): void {
    if (!this.peerId) return
    const peer = this.peerStore.getPeer(this.peerId)
    if (!peer) return

    // Remove ports whose capability is now disabled
    for (const [id, port] of this.outputs.entries()) {
      const capType = port.name.split('.')[0]
      const cap = peer.capabilities.find(c => c.type === capType)
      if (!cap || !cap.enabled) {
        this.outputs.delete(id)
      }
    }

    // Add ports for enabled capabilities that aren't represented yet
    for (const capability of peer.capabilities) {
      if (!capability.enabled) continue
      for (const portDef of capability.ports) {
        const portName = `${capability.type}.${portDef.name}`
        const exists = Array.from(this.outputs.values()).some(p => p.name === portName)
        if (!exists) {
          this.addOutput(portName, this.mapDataType(portDef.dataType))
        }
      }
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
   * Process node - pull latest data from peer store AND send output channel values
   */
  process(): void {
    if (!this.peerId) return

    const peer = this.peerStore.getPeer(this.peerId)
    if (!peer || !peer.connected) return

    // --- Read from peer (output ports) ---
    for (const capability of peer.capabilities) {
      if (capability.enabled) {
        const data = this.peerStore.getPeerData(this.peerId, capability.type)
        if (data) {
          for (const port of capability.ports) {
            const portName = `${capability.type}.${port.name}`
            const value = data.data?.[port.name]
            this.setOutputValue(portName, value)
          }
        }
      }
    }

    // --- Send to peer (input ports / output channels) ---
    this.processOutputChannels()
  }

  private processOutputChannels(): void {
    if (!this.peerId) return

    // Canvas channel
    if (this.enabledOutputChannels.has('out.canvas')) {
      const canvas = this.getInputValue('out.canvas') as OffscreenCanvas | null
      if (canvas) {
        this.canvasSender(canvas, ({ buffer, width, height }) => {
          const msg: HostToClientMessage = { type: 'canvas', buffer, width, height }
          this.peerStore.sendToPeer(this.peerId!, msg)
        })
      }
    }

    // Haptic channel — only send when value changes
    if (this.enabledOutputChannels.has('out.haptic')) {
      const pattern = this.getInputValue('out.haptic')
      if (pattern !== null && pattern !== undefined) {
        const serialized = JSON.stringify(pattern)
        if (serialized !== this.lastSentHaptic) {
          this.lastSentHaptic = serialized
          const p = Array.isArray(pattern) ? pattern : [100]
          this.peerStore.sendToPeer(this.peerId!, { type: 'haptic', pattern: p })
        }
      }
    }

    // Audio trigger channel
    if (this.enabledOutputChannels.has('out.audioTrigger')) {
      const trig = this.getInputValue('out.audioTrigger') as Record<string, any> | null
      if (trig !== null && trig !== undefined) {
        const serialized = JSON.stringify(trig)
        if (serialized !== this.lastSentAudio) {
          this.lastSentAudio = serialized
          this.peerStore.sendToPeer(this.peerId!, {
            type: 'audioTrigger',
            frequency: trig.frequency ?? 440,
            duration: trig.duration ?? 0.5,
            volume: trig.volume ?? 0.5,
            waveform: trig.waveform ?? 'sine'
          })
        }
      }
    }

    // Layout channel
    if (this.enabledOutputChannels.has('out.layout')) {
      const layout = this.getInputValue('out.layout') as LayoutName | null
      if (layout && layout !== this.lastSentLayout) {
        this.lastSentLayout = layout
        this.peerStore.sendToPeer(this.peerId!, { type: 'layout', layout })
      }
    }
  }

  /**
   * Enable an output channel (creates an input port)
   */
  enableOutputChannel(channel: string): void {
    if (this.enabledOutputChannels.has(channel)) return
    this.enabledOutputChannels.add(channel)
    this.addOutputChannelPort(channel)
  }

  /**
   * Disable an output channel (removes its input port)
   */
  disableOutputChannel(channel: string): void {
    this.enabledOutputChannels.delete(channel)
    const portToRemove = Array.from(this.inputs.entries()).find(([, p]) => p.name === channel)
    if (portToRemove) this.inputs.delete(portToRemove[0])
  }

  /**
   * Toggle an output channel
   */
  toggleOutputChannel(channel: string): void {
    if (this.enabledOutputChannels.has(channel)) {
      this.disableOutputChannel(channel)
    } else {
      this.enableOutputChannel(channel)
    }
  }

  getEnabledOutputChannels(): string[] {
    return Array.from(this.enabledOutputChannels)
  }

  private addOutputChannelPort(channel: string): void {
    const typeMap: Record<string, DataType> = {
      'out.canvas':       DataType.CANVAS,
      'out.haptic':       DataType.OBJECT,
      'out.audioTrigger': DataType.OBJECT,
      'out.layout':       DataType.OBJECT
    }
    const dataType = typeMap[channel] ?? DataType.ANY
    this.addInput(channel, dataType)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      peerId: this.peerId,
      enabledOutputChannels: Array.from(this.enabledOutputChannels)
    }
  }

  fromJSON(data: any): void {
    if (data.peerId) this.setPeer(data.peerId)
    if (data.enabledOutputChannels) {
      for (const ch of data.enabledOutputChannels) this.enableOutputChannel(ch)
    }
  }
}
