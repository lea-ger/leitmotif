import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Canvas Merge Node
 * Combines canvases onto a single output canvas.
 * Supports two direct layer inputs and (legacy) array input:
 * - layerA/layerB + x/y offsets
 * - optional legacy `canvases` array of {canvas, x, y}
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
      description: 'Combine two canvases into one',
      color: '#ec4899',
      icon: 'ph:stack'
    }
  }

  initialize(): void {
    // Preferred direct layers (simple workflow)
    this.addInput('layerA', DataType.CANVAS, 'First layer canvas')
    this.addInput('xA', DataType.NUMERIC, 'X offset for layer A')
    this.addInput('yA', DataType.NUMERIC, 'Y offset for layer A')
    this.addInput('layerB', DataType.CANVAS, 'Second layer canvas')
    this.addInput('xB', DataType.NUMERIC, 'X offset for layer B')
    this.addInput('yB', DataType.NUMERIC, 'Y offset for layer B')

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
      defaultValue: 0,
      exposedAsInput: true
    })

    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 0,
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
    const layerA = this.resolveCanvasSource(this.getInputValue('layerA'))
    const layerB = this.resolveCanvasSource(this.getInputValue('layerB'))
    const background = this.resolveCanvasSource(this.getInputValue('background'))

    // Auto-size from first available source when width/height are 0.
    const widthInput = Number(this.getInputValue('width') ?? this.getParameter('width') ?? 0)
    const heightInput = Number(this.getInputValue('height') ?? this.getParameter('height') ?? 0)
    const refCanvas = layerA ?? layerB ?? background
    const width = widthInput > 0 ? widthInput : (refCanvas?.width ?? 1920)
    const height = heightInput > 0 ? heightInput : (refCanvas?.height ?? 1080)
    const clearBackground = Boolean(this.getParameter('clearBackground'))
    const backgroundColor = String(this.getParameter('backgroundColor') || '#000000')

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

    const drawLayer = (source: any, x: number, y: number) => {
      if (!source) return
      try {
        ctx.drawImage(source, x, y)
      } catch (error) {
        console.warn('[CanvasMergeNode] Failed to draw layer:', error)
      }
    }

    const xA = Number(this.getInputValue('xA') ?? 0)
    const yA = Number(this.getInputValue('yA') ?? 0)
    drawLayer(layerA, xA, yA)

    const xB = Number(this.getInputValue('xB') ?? 0)
    const yB = Number(this.getInputValue('yB') ?? 0)
    drawLayer(layerB, xB, yB)

    this.setOutputValue('canvas', outputCanvas)
  }

  private resolveCanvasSource(input: any): OffscreenCanvas | HTMLCanvasElement | ImageBitmap | null {
    if (!input) return null
    if (this.isCanvasLike(input)) return input

    const candidates = [
      input?.frame,
      input?.canvas,
      input?.data?.frame,
      input?.data?.canvas
    ]

    for (const c of candidates) {
      if (this.isCanvasLike(c)) return c
    }
    return null
  }

  private isCanvasLike(value: any): value is OffscreenCanvas | HTMLCanvasElement | ImageBitmap {
    return Boolean(value)
      && typeof value === 'object'
      && typeof value.width === 'number'
      && typeof value.height === 'number'
  }
}
