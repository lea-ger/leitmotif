import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Debug Node
 * Logs input values to console
 */
export class DebugNode extends BaseNode {
  private logCount: number = 0
  private lastLogTime: number = 0
  private logThrottle: number = 500 // ms
  
  constructor(id?: string) {
    super('debug', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'debug',
      category: NodeCategory.UTILITY,
      displayName: 'Debug Logger',
      description: 'Logs input data to the browser console for debugging (press F12 to open).',
      color: '#6b7280',
      icon: 'ph:bug'
    }
  }

  initialize(): void {
    // Accept any type of input
    this.addInput('value', DataType.ANY)
    
    // Pass through output
    this.addOutput('value', DataType.ANY)
    
    // Parameters
    this.addParameter({
      id: 'label',
      name: 'Label',
      type: 'string',
      defaultValue: 'Debug'
    })
    
    this.addParameter({
      id: 'enabled',
      name: 'Enabled',
      type: 'boolean',
      defaultValue: true
    })
  }

  process(): void {
    const value = this.getInputValue('value')
    const label = this.getParameter('label')
    const enabled = this.getParameter('enabled')
    
    // Pass through
    this.setOutputValue('value', value)
    
    // Log if enabled and throttle time has passed
    if (enabled) {
      const now = Date.now()
      if (now - this.lastLogTime > this.logThrottle) {
        console.log(`[${label}] #${this.logCount}:`, value)
        this.logCount++
        this.lastLogTime = now
      }
    }
  }
}
