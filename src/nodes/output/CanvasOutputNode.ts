import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { useCanvasStore } from '../../stores/canvasStore'

/**
 * CanvasOutputNode
 * Receives the final OffscreenCanvas from upstream and forwards it to the canvas store
 * so the CanvasOutputWindow can display it.
 */
export class CanvasOutputNode extends BaseNode {
  private canvasStore: ReturnType<typeof useCanvasStore> | null = null

  constructor(id?: string) {
    super('canvas-output', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'canvas-output',
      category: NodeCategory.OUTPUT,
      displayName: 'Canvas Output',
      description: 'Sends the canvas to the output window for display',
      color: '#8b5cf6',
      icon: 'ph:monitor-play'
    }
  }

  initialize(): void {
    this.addInput('canvas', DataType.CANVAS)
  }

  process(): void {
    if (!this.canvasStore) {
      this.canvasStore = useCanvasStore()
    }

    const canvas: OffscreenCanvas | null = this.getInputValue('canvas')
    if (canvas) {
      this.canvasStore.setOutputCanvas(canvas)
    }
  }

  cleanup(): void {
    this.canvasStore = null
  }
}

