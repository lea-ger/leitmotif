import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Canvas Merge Node
 * Combines multiple canvases onto a single output canvas.
 * Accepts an array of canvas objects with position data:
 * [{ canvas: OffscreenCanvas, x: number, y: number }]
 */
export class CanvasMergeNode extends BaseNode {
  constructor(id?: string) {
    super('canvas-merge', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'canvas-merge',
      category: NodeCategory.PROCESSOR,
      displayName: 'Canvas Merge',
      description: 'Combine multiple canvases into one',
      color: '#ec4899',
      icon: 'ph:stack'
    }
  }

  initialize(): void {
    // Array of canvas objects: [{ canvas, x, y }]
    this.addInput('canvases', DataType.OBJECT, 'Array of {canvas, x, y} objects')
    
    // Background canvas (optional base layer)
    this.addInput('background', DataType.CANVAS, 'Optional background canvas')

    // Output dimensions
    this.addInput('width', DataType.NUMERIC, 'Output canvas width')
    this.addInput('height', DataType.NUMERIC, 'Output canvas height')

    // Output
    this.addOutput('canvas', DataType.CANVAS, 'Merged canvas')

    // Parameters
    this.addParameter({
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 1920,
      exposedAsInput: true
    })

    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 1080,
      exposedAsInput: true
    })

    this.addParameter({
      id: 'clearBackground',
      name: 'Clear Background',
      type: 'boolean',
      defaultValue: true
    })

    this.addParameter({
      id: 'backgroundColor',
      name: 'Background Color',
      type: 'string',
      defaultValue: '#000000'
    })
  }

  process(): void {
    // Get dimensions
    const width = this.getInputValue('width') ?? this.getParameter('width') ?? 1920
    const height = this.getInputValue('height') ?? this.getParameter('height') ?? 1080
    const clearBackground = Boolean(this.getParameter('clearBackground'))
    const backgroundColor = String(this.getParameter('backgroundColor') || '#000000')

    // Get canvas array
    const canvasArray = this.getInputValue('canvases')
    const background = this.getInputValue('background') as OffscreenCanvas | null

    // Create output canvas
    const outputCanvas = new OffscreenCanvas(width, height)
    const ctx = outputCanvas.getContext('2d')

    if (!ctx) {
      this.setOutputValue('canvas', null)
      return
    }

    // Clear or fill background
    if (clearBackground) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    // Draw background canvas if provided
    if (background) {
      try {
        ctx.drawImage(background, 0, 0, width, height)
      } catch (error) {
        console.warn('[CanvasMergeNode] Failed to draw background:', error)
      }
    }

    // Draw all canvases from array
    if (Array.isArray(canvasArray)) {
      for (const item of canvasArray) {
        if (!item || typeof item !== 'object') continue
        
        const canvas = item.canvas
        const x = item.x ?? 0
        const y = item.y ?? 0
        const w = item.width ?? canvas?.width
        const h = item.height ?? canvas?.height

        if (canvas && canvas instanceof OffscreenCanvas) {
          try {
            if (w !== undefined && h !== undefined) {
              // Draw with specific dimensions
              ctx.drawImage(canvas, x, y, w, h)
            } else {
              // Draw at original size
              ctx.drawImage(canvas, x, y)
            }
          } catch (error) {
            console.warn('[CanvasMergeNode] Failed to draw canvas:', error)
          }
        }
      }
    }

    this.setOutputValue('canvas', outputCanvas)
  }
}
