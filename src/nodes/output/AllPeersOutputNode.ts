import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import type { HostToClientMessage, LayoutName } from '../../stores/types/peer'
import { usePeerStore } from '../../stores/peerStore'
import { createThrottledCanvasSender } from '../../utils/canvasSerial'

/**
 * All Peers Output Node
 * Broadcasts data from the host to ALL connected peers simultaneously.
 * Ports: canvas (display on all peers), haptic, audioTrigger, layout.
 */
export class AllPeersOutputNode extends BaseNode {
  private peerStore = usePeerStore()
  private canvasSender = createThrottledCanvasSender(15)
  private lastSentHaptic = ''
  private lastSentLayout = ''
  private lastSentAudio = ''

  constructor(id?: string) {
    super('all-peers-output', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'all-peers-output',
      category: NodeCategory.OUTPUT,
      displayName: 'All Peers Output',
      description: 'Broadcasts canvas, haptic, audio or layout commands to all connected peers',
      color: '#3b82f6',
      icon: 'ph:broadcast'
    }
  }

  initialize(): void {
    this.addInput('canvas',       DataType.CANVAS)
    this.addInput('haptic',       DataType.OBJECT)
    this.addInput('audioTrigger', DataType.OBJECT)
    this.addInput('layout',       DataType.OBJECT)
  }

  process(): void {
    // Canvas — throttled
    const canvas = this.getInputValue('canvas') as OffscreenCanvas | null
    if (canvas) {
      this.canvasSender(canvas, ({ buffer, width, height }) => {
        const msg: HostToClientMessage = { type: 'canvas', buffer, width, height }
        this.peerStore.sendToAllPeers(msg)
      })
    }

    // Haptic — send only on change
    const pattern = this.getInputValue('haptic')
    if (pattern !== null && pattern !== undefined) {
      const serialized = JSON.stringify(pattern)
      if (serialized !== this.lastSentHaptic) {
        this.lastSentHaptic = serialized
        const p = Array.isArray(pattern) ? pattern : [100]
        this.peerStore.sendToAllPeers({ type: 'haptic', pattern: p })
      }
    }

    // Audio trigger — send only on change
    const trig = this.getInputValue('audioTrigger') as Record<string, any> | null
    if (trig !== null && trig !== undefined) {
      const serialized = JSON.stringify(trig)
      if (serialized !== this.lastSentAudio) {
        this.lastSentAudio = serialized
        this.peerStore.sendToAllPeers({
          type: 'audioTrigger',
          frequency: trig.frequency ?? 440,
          duration: trig.duration ?? 0.5,
          volume: trig.volume ?? 0.5,
          waveform: trig.waveform ?? 'sine'
        })
      }
    }

    // Layout — send only on change
    const layout = this.getInputValue('layout') as LayoutName | null
    if (layout && layout !== this.lastSentLayout) {
      this.lastSentLayout = layout
      this.peerStore.sendToAllPeers({ type: 'layout', layout })
    }
  }

  cleanup(): void {
    this.lastSentHaptic = ''
    this.lastSentLayout = ''
    this.lastSentAudio = ''
  }
}
