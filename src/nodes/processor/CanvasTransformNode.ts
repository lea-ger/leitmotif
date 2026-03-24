import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Canvas Transform Node
 * Transforms a canvas by scaling, cropping, and positioning it
 * Outputs a new canvas with the transformed content
 */
export class CanvasTransformNode extends BaseNode {
  constructor(id?: string) {
    super('canvas-transform', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'canvas-transform',
      category: NodeCategory.PROCESSOR,
      displayName: 'Canvas Transform',
      description: 'Scale, crop, and position a canvas',
      color: '#ec4899',
      icon: 'ph:crop'
    }
  }

  initialize(): void {
    // Input canvas to transform
    this.addInput('canvas', DataType.CANVAS, 'Source canvas to transform')
    
    // Transform parameters
    this.addInput('x', DataType.NUMERIC, 'X position offset')
    this.addInput('y', DataType.NUMERIC, 'Y position offset')
    this.addInput('width', DataType.NUMERIC, 'Output width (crops if smaller)')
    this.addInput('height', DataType.NUMERIC, 'Output height (crops if smaller)')
    this.addInput('scale', DataType.NUMERIC, 'Scale factor (1.0 = original size)')

    // Output
    this.addOutput('canvas', DataType.CANVAS, 'Transformed canvas')

    // Parameters with defaults
    this.addParameter({
      id: 'x',
      name: 'X Offset',
      type: 'number',
      defaultValue: 0,
      exposedAsInput: true
    })

    this.addParameter({
      id: 'y',
      name: 'Y Offset',
      type: 'number',
      defaultValue: 0,
      exposedAsInput: true
    })

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
      id: 'scale',
      name: 'Scale',
      type: 'number',
      defaultValue: 1.0,
      exposedAsInput: true
    })

    this.addParameter({
      id: 'maintainAspect',
      name: 'Maintain Aspect Ratio',
      type: 'boolean',
      defaultValue: true
    })
  }

  process(): void {
    const sourceCanvas = this.getInputValue('canvas') as OffscreenCanvas | null
    
    if (!sourceCanvas) {
      this.setOutputValue('canvas', null)
      return
    }

    // Get transform parameters (prefer input over parameter)
    const x = this.getInputValue('x') ?? this.getParameter('x') ?? 0
    const y = this.getInputValue('y') ?? this.getParameter('y') ?? 0
    let width = this.getInputValue('width') ?? this.getParameter('width') ?? sourceCanvas.width
    let height = this.getInputValue('height') ?? this.getParameter('height') ?? sourceCanvas.height
    const scale = this.getInputValue('scale') ?? this.getParameter('scale') ?? 1.0
    const maintainAspect = Boolean(this.getParameter('maintainAspect'))

    // If width or height is 0, use source dimensions
    if (width <= 0) width = sourceCanvas.width
    if (height <= 0) height = sourceCanvas.height

    // Calculate scaled dimensions
    let scaledWidth = width * scale
    let scaledHeight = height * scale

    // Maintain aspect ratio if enabled
    if (maintainAspect && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      const aspectRatio = sourceCanvas.width / sourceCanvas.height
      const targetAspect = width / height

      if (aspectRatio > targetAspect) {
        // Source is wider - fit to width
        scaledHeight = scaledWidth / aspectRatio
      } else {
        // Source is taller - fit to height
        scaledWidth = scaledHeight * aspectRatio
      }
    }

    // Create output canvas
    const outputCanvas = new OffscreenCanvas(width, height)
    const ctx = outputCanvas.getContext('2d')

    if (!ctx) {
      this.setOutputValue('canvas', null)
      return
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Apply transform and draw
    try {
      ctx.save()
      
      // Translate to position
      ctx.translate(x, y)

      // Draw source canvas scaled
      ctx.drawImage(
        sourceCanvas,
        0, 0, sourceCanvas.width, sourceCanvas.height,
        0, 0, scaledWidth, scaledHeight
      )

      ctx.restore()
    } catch (error) {
      console.warn('[CanvasTransformNode] Failed to transform canvas:', error)
      this.setOutputValue('canvas', null)
      return
    }

    this.setOutputValue('canvas', outputCanvas)
  }
}
