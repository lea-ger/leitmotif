import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Math Mapping Node
 * Maps a numeric value from one range to another
 */
export class MathMapNode extends BaseNode {
  constructor(id?: string) {
    super('math-map', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'math-map',
      category: NodeCategory.PROCESSOR,
      displayName: 'Map Range',
      description: 'Maps a number from one range to another',
      color: '#f59e0b',
      icon: '🔢'
    }
  }

  initialize(): void {
    // Input/Output
    this.addInput('value', DataType.NUMERIC)
    this.addOutput('result', DataType.NUMERIC)
    
    // Parameters
    this.addParameter({
      id: 'inMin',
      name: 'Input Min',
      type: 'number',
      defaultValue: 0
    })
    
    this.addParameter({
      id: 'inMax',
      name: 'Input Max',
      type: 'number',
      defaultValue: 1
    })
    
    this.addParameter({
      id: 'outMin',
      name: 'Output Min',
      type: 'number',
      defaultValue: 0
    })
    
    this.addParameter({
      id: 'outMax',
      name: 'Output Max',
      type: 'number',
      defaultValue: 100
    })
    
    this.addParameter({
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: false
    })
  }

  process(): void {
    const value = this.getInputValue('value')
    if (value === undefined) return
    
    const inMin = this.getParameter('inMin')
    const inMax = this.getParameter('inMax')
    const outMin = this.getParameter('outMin')
    const outMax = this.getParameter('outMax')
    const clamp = this.getParameter('clamp')
    
    // Map value
    let mapped = outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin)
    
    // Clamp if enabled
    if (clamp) {
      const min = Math.min(outMin, outMax)
      const max = Math.max(outMin, outMax)
      mapped = Math.max(min, Math.min(max, mapped))
    }
    
    this.setOutputValue('result', mapped)
  }
}
