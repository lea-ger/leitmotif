import { markRaw } from 'vue'
import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * GenerateCanvasNode
 * Creates a blank OffscreenCanvas each frame and outputs it for downstream canvas nodes to draw onto.
 */
export class GenerateCanvasNode extends BaseNode {
  private offscreen: OffscreenCanvas | null = null

  constructor(id?: string) {
    super('generate-canvas', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'generate-canvas',
      category: NodeCategory.INPUT,
      displayName: 'Generate Canvas',
      description: 'Creates a blank canvas frame for other canvas nodes to draw onto',
      color: '#00BFE5',
      icon: 'ph:frame-corners'
    }
  }

  initialize(): void {
    this.addOutput('canvas', DataType.CANVAS)

    this.addParameter({
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 800,
      min: 1,
      max: 3840,
      step: 1
    })

    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 600,
      min: 1,
      max: 2160,
      step: 1
    })

    this.addParameter({
      id: 'backgroundColor',
      name: 'Background',
      type: 'string',
      defaultValue: '#000000'
    })
  }

  process(): void {
    const w: number = this.getParameter('width')
    const h: number = this.getParameter('height')

    // Reuse existing OffscreenCanvas if dimensions match
    if (!this.offscreen || this.offscreen.width !== w || this.offscreen.height !== h) {
      this.offscreen = markRaw(new OffscreenCanvas(w, h))
    }

    const ctx = this.offscreen.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = this.getParameter('backgroundColor')
    ctx.fillRect(0, 0, w, h)

    this.setOutputValue('canvas', this.offscreen)
  }

  cleanup(): void {
    this.offscreen = null
  }
}
