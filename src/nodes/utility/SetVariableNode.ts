import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { useVariableStore } from '../../stores/variableStore'
import * as Tone from 'tone'

/**
 * SetVariableNode
 * Writes a value to the global variable store
 */
export class SetVariableNode extends BaseNode {
  private variableStore: ReturnType<typeof useVariableStore> | null = null

  constructor(id?: string) {
    super('set-variable', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'set-variable',
      category: NodeCategory.UTILITY,
      displayName: 'Set Variable',
      description: 'Writes a value to the global store',
      color: '#9333EA',
      icon: 'ph:database-bold'
    }
  }

  initialize(): void {
    this.addInput('value', DataType.ANY)
    this.addOutput('value', DataType.ANY) // Pass through for chaining

    this.addParameter({
      id: 'name',
      name: 'Variable Name',
      type: 'string',
      defaultValue: ''
    })

    this.addParameter({
      id: 'persist',
      name: 'Persist',
      type: 'boolean',
      defaultValue: true
    })
  }

  process(): void {
    if (!this.variableStore) {
      this.variableStore = useVariableStore()
    }

    const name: string = this.getParameter('name')
    const value: any = this.getInputValue('value')
    
    if (!name) {
      this.setOutputValue('value', value)
      return
    }

    // Determine persist flag
    let persist: boolean = this.getParameter('persist')
    
    // Auto-detect non-persistable values if persist is true
    if (persist && value != null) {
      persist = this.shouldPersistValue(value)
    }

    this.variableStore.setVariable(name, value, { persist })
    
    // Pass through the value for chaining
    this.setOutputValue('value', value)
  }

  /**
   * Check if a value can/should be persisted to IndexedDB
   */
  private shouldPersistValue(value: any): boolean {
    // OffscreenCanvas cannot be persisted
    if (value instanceof OffscreenCanvas) {
      return false
    }
    
    // Tone.js audio nodes cannot be persisted
    if (value instanceof Tone.ToneAudioNode) {
      return false
    }
    
    // Check nested objects for non-persistable types
    if (value && typeof value === 'object') {
      // Check for common wrapper patterns
      const candidates = [value.frame, value.canvas, value.data]
      for (const candidate of candidates) {
        if (candidate instanceof OffscreenCanvas || candidate instanceof Tone.ToneAudioNode) {
          return false
        }
      }
    }
    
    return true
  }

  cleanup(): void {
    this.variableStore = null
  }
}
