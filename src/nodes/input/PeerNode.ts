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
    // Host -> peer controls
    this.addInput('out.canvas', DataType.CANVAS)
    this.addInput('out.haptic', DataType.EVENT)
    this.addInput('out.audioTrigger', DataType.OBJECT)

    // Node-level settings for simpler UX
    this.addParameter({
      id: 'layout',
      name: 'Client Layout',
      type: 'select',
      defaultValue: 'empty',
      options: [
        { label: 'Default', value: 'empty' },
        { label: 'Keyboard', value: 'keyboard' },
        { label: 'Canvas', value: 'canvas' },
        { label: 'Touchpad', value: 'touchpad' }
      ]
    })
    this.addParameter({
      id: 'hapticPattern',
      name: 'Haptic Pattern',
      type: 'select',
      defaultValue: 'short',
      options: [
        { label: 'Short', value: 'short' },
        { label: 'Medium', value: 'medium' },
        { label: 'Long', value: 'long' },
        { label: 'Double', value: 'double' },
        { label: 'Pulse', value: 'pulse' }
      ]
    })
  }

  /**
   * Bind this node to a specific peer
   */
  setPeer(peerId: string): void {
    this.peerId = peerId
    const peer = this.peerStore.getPeer(peerId)
    
    if (peer) {
      this.name = `Peer: ${peer.name}`
      if (peer.currentLayout) {
        this.setParameter('layout', peer.currentLayout)
      }
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

    // Host -> client control/data channels are explicit input ports on every PeerNode.
    this.addOutputChannelPort('out.canvas')
    this.addOutputChannelPort('out.haptic')
    this.addOutputChannelPort('out.audioTrigger')
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
    const canvas = this.getInputValue('out.canvas') as OffscreenCanvas | null
    if (canvas) {
      this.canvasSender(canvas, ({ buffer, width, height }) => {
        const msg: HostToClientMessage = { type: 'canvas', buffer, width, height }
        this.peerStore.sendToPeer(this.peerId!, msg)
      })
    }

    // Haptic channel (event trigger): emits selected pattern on trigger edges.
    const hapticEvent = this.getInputValue('out.haptic')
    if (hapticEvent !== null && hapticEvent !== undefined) {
      const serialized = JSON.stringify(hapticEvent)
      if (serialized !== this.lastSentHaptic) {
        this.lastSentHaptic = serialized
        const patternKey = String(this.getParameter('hapticPattern') ?? 'short')
        const pattern = this.resolveHapticPattern(patternKey)
        this.peerStore.sendToPeer(this.peerId!, { type: 'haptic', pattern })
      }
    } else {
      // Reset edge detector when signal is inactive
      this.lastSentHaptic = ''
    }

    // Audio trigger channel
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

    // Layout comes from node setting (simpler for non-coders)
    const layout = this.getParameter('layout') as LayoutName
    if (layout && layout !== this.lastSentLayout) {
      this.lastSentLayout = layout
      this.peerStore.sendToPeer(this.peerId!, { type: 'layout', layout })
    }
  }

  private resolveHapticPattern(key: string): number[] {
    switch (key) {
      case 'medium':
        return [120]
      case 'long':
        return [220]
      case 'double':
        return [80, 60, 80]
      case 'pulse':
        return [30, 40, 30, 40, 30]
      case 'short':
      default:
        return [60]
    }
  }

  private getInputPortIdByName(name: string): string | null {
    const pair = Array.from(this.inputs.entries()).find(([, p]) => p.name === name)
    return pair ? pair[0] : null
  }

  /**
   * Backward-compatible API: keep methods used by graph restore, but ports are explicit now.
   */
  enableOutputChannel(channel: string): void {
    this.addOutputChannelPort(channel)
  }

  /**
   * Backward-compatible API.
   */
  disableOutputChannel(channel: string): void {
    const id = this.getInputPortIdByName(channel)
    if (id) this.inputs.delete(id)
  }

  /**
   * Backward-compatible API.
   */
  toggleOutputChannel(channel: string): void {
    const id = this.getInputPortIdByName(channel)
    if (id) this.inputs.delete(id)
    else this.addOutputChannelPort(channel)
  }

  getEnabledOutputChannels(): string[] {
    return Array.from(this.inputs.values())
      .map(p => p.name)
      .filter(n => n.startsWith('out.'))
  }

  private addOutputChannelPort(channel: string): void {
    const typeMap: Record<string, DataType> = {
      'out.canvas':       DataType.CANVAS,
      'out.haptic':       DataType.EVENT,
      'out.audioTrigger': DataType.OBJECT
    }
    const dataType = typeMap[channel]
    if (!dataType) return
    if (!this.getInputPortIdByName(channel)) {
      this.addInput(channel, dataType)
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      peerId: this.peerId,
      enabledOutputChannels: this.getEnabledOutputChannels()
    }
  }

  fromJSON(data: any): void {
    if (data.peerId) this.setPeer(data.peerId)
    if (data.enabledOutputChannels) {
      for (const ch of data.enabledOutputChannels) this.enableOutputChannel(ch)
    }
  }
}
