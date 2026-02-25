import { markRaw } from 'vue'
import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

export type ScaleMode = 'none' | 'fit' | 'fill' | 'stretch'

/**
 * ImageNode
 * Receives an OffscreenCanvas from upstream, draws a loaded image onto it,
 * and passes the same canvas downstream.
 */
export class ImageNode extends BaseNode {
  private image: HTMLImageElement | null = null
  private lastSrc = ''

  constructor(id?: string) {
    super('image', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'image',
      category: NodeCategory.INPUT,
      displayName: 'Image',
      description: 'Draws an image onto an incoming canvas and passes it through',
      color: '#00BFE5',
      icon: 'ph:image'
    }
  }

  initialize(): void {
    this.addInput('canvas', DataType.CANVAS)
    this.addOutput('canvas', DataType.CANVAS)

    this.addParameter({
      id: 'src',
      name: 'Image',
      type: 'image',
      defaultValue: ''
    })

    this.addParameter({
      id: 'x',
      name: 'X',
      type: 'number',
      defaultValue: 0,
      min: -9999,
      max: 9999,
      step: 1,
      exposedAsInput: true,
      dataType: DataType.NUMERIC
    })

    this.addParameter({
      id: 'y',
      name: 'Y',
      type: 'number',
      defaultValue: 0,
      min: -9999,
      max: 9999,
      step: 1,
      exposedAsInput: true,
      dataType: DataType.NUMERIC
    })

    this.addParameter({
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 9999,
      step: 1,
      exposedAsInput: true,
      dataType: DataType.NUMERIC
    })

    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 9999,
      step: 1,
      exposedAsInput: true,
      dataType: DataType.NUMERIC
    })

    this.addParameter({
      id: 'opacity',
      name: 'Opacity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.01,
      exposedAsInput: true,
      dataType: DataType.NUMERIC
    })

    this.addParameter({
      id: 'scaleMode',
      name: 'Scale Mode',
      type: 'select',
      defaultValue: 'none' as ScaleMode,
      options: [
        { label: 'None',    value: 'none' },
        { label: 'Fit',     value: 'fit' },
        { label: 'Fill',    value: 'fill' },
        { label: 'Stretch', value: 'stretch' }
      ]
    })

    this.addParameter({
      id: 'zIndex',
      name: 'Z-Index',
      type: 'number',
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1
    })
  }

  process(): void {
    const canvas: OffscreenCanvas | null = this.getInputValue('canvas')
    // Always pass through even without a canvas (so chain can continue)
    if (!canvas) {
      this.setOutputValue('canvas', null)
      return
    }

    const src: string = this.getParameter('src')

    // Load / reload image when src changes
    if (src !== this.lastSrc) {
      this.lastSrc = src
      if (src) {
        const img = markRaw(new Image())
        img.onload = () => { this.image = img }
        img.onerror = () => { this.image = null }
        img.src = src
      } else {
        this.image = null
      }
    }

    // Draw onto the canvas if the image is ready
    if (this.image?.complete && this.image.naturalWidth > 0) {
      const ctx = canvas.getContext('2d')!
      const x: number       = this.getParameter('x')
      const y: number       = this.getParameter('y')
      const paramW: number  = this.getParameter('width')
      const paramH: number  = this.getParameter('height')
      const opacity: number = this.getParameter('opacity')
      const mode: ScaleMode = this.getParameter('scaleMode')

      const natW = this.image.naturalWidth
      const natH = this.image.naturalHeight
      const canvasW = canvas.width
      const canvasH = canvas.height

      let destW = paramW || natW
      let destH = paramH || natH

      if (mode === 'fit') {
        const scale = Math.min(canvasW / natW, canvasH / natH)
        destW = natW * scale
        destH = natH * scale
      } else if (mode === 'fill') {
        const scale = Math.max(canvasW / natW, canvasH / natH)
        destW = natW * scale
        destH = natH * scale
      } else if (mode === 'stretch') {
        destW = paramW || canvasW
        destH = paramH || canvasH
      }

      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
      ctx.drawImage(this.image, x, y, destW, destH)
      ctx.restore()
    }

    this.setOutputValue('canvas', canvas)
  }

  cleanup(): void {
    this.image = null
    this.lastSrc = ''
  }
}
