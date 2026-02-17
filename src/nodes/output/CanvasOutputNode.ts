import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Canvas Output Node
 * Renders to a canvas element
 */
export class CanvasOutputNode extends BaseNode {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  
  constructor(id?: string) {
    super('canvas-output', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'canvas-output',
      category: NodeCategory.OUTPUT,
      displayName: 'Canvas Output',
      description: 'Renders visual output to canvas',
      color: '#8b5cf6',
      icon: 'ph:paint-brush'
    }
  }

  initialize(): void {
    // Inputs
    this.addInput('canvas', DataType.CANVAS)
    this.addInput('color', DataType.NUMERIC) // Hue value 0-360
    this.addInput('brightness', DataType.NUMERIC) // 0-1
    
    // Parameters
    this.addParameter({
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 800,
      min: 100,
      max: 3840
    })
    
    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 600,
      min: 100,
      max: 2160
    })
    
    this.addParameter({
      id: 'backgroundColor',
      name: 'Background',
      type: 'string',
      defaultValue: '#000000'
    })
  }

  /**
   * Set the canvas element to render to
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // Set size from parameters
    const width = this.getParameter('width')
    const height = this.getParameter('height')
    canvas.width = width
    canvas.height = height
  }

  process(): void {
    if (!this.canvas || !this.ctx) return
    
    const canvasData = this.getInputValue('canvas')
    const color = this.getInputValue('color')
    const brightness = this.getInputValue('brightness')
    const bgColor = this.getParameter('backgroundColor')
    
    // Clear canvas
    this.ctx.fillStyle = bgColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // If canvas data is provided, draw it
    if (canvasData && canvasData instanceof ImageData) {
      this.ctx.putImageData(canvasData, 0, 0)
    }
    
    // Simple visualization based on numeric inputs
    if (color !== undefined && brightness !== undefined) {
      const hue = color % 360
      const light = Math.max(0, Math.min(100, brightness * 100))
      this.ctx.fillStyle = `hsl(${hue}, 80%, ${light}%)`
      
      const centerX = this.canvas.width / 2
      const centerY = this.canvas.height / 2
      const radius = brightness * 200
      
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  cleanup(): void {
    this.canvas = null
    this.ctx = null
  }
}
