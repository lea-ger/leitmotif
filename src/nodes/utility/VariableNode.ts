import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { useVariableStore } from '../../stores/variableStore'
import * as Tone from 'tone'

/**
 * Variable Node
 * Read and write global variables that persist across the session.
 * Can be used for state management in workflows.
 */
export class VariableNode extends BaseNode {
  private variableStore = useVariableStore()

  constructor(id?: string) {
    super('variable', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'variable',
      category: NodeCategory.UTILITY,
      displayName: 'Variable',
      description: 'Read/write global variables for state management',
      color: '#10b981',
      icon: 'ph:database'
    }
  }

  initialize(): void {
    // Input: value to write (when connected, writes to variable)
    this.addInput('set', DataType.ANY, 'Value to store in the variable')
    
    // Output: current variable value
    this.addOutput('value', DataType.ANY, 'Current value of the variable')
    this.addOutput('exists', DataType.NUMERIC, '1 if variable exists, 0 otherwise')

    // Parameter: variable name
    this.addParameter({
      id: 'name',
      name: 'Variable Name',
      type: 'string',
      defaultValue: 'myVariable'
    })

    // Parameter: initial/default value
    this.addParameter({
      id: 'defaultValue',
      name: 'Default Value',
      type: 'string',
      defaultValue: ''
    })

    // Parameter: auto-initialize
    this.addParameter({
      id: 'autoInit',
      name: 'Auto Initialize',
      type: 'boolean',
      defaultValue: true
    })

    // Parameter: persistence behavior for writes from this node
    this.addParameter({
      id: 'persist',
      name: 'Persist Variable',
      type: 'boolean',
      defaultValue: true
    })
  }

  process(): void {
    const varName = String(this.getParameter('name') || 'myVariable')
    const autoInit = Boolean(this.getParameter('autoInit'))
    const persistParam = Boolean(this.getParameter('persist'))
    const defaultValue = this.getParameter('defaultValue')

    // Check if we should write (set input is connected and has a value)
    const setValue = this.getInputValue('set')
    if (setValue !== undefined && setValue !== null) {
      this.variableStore.setVariable(varName, setValue, {
        persist: persistParam && this.shouldPersistValue(setValue)
      })
    }

    // Auto-initialize if variable doesn't exist
    if (autoInit && !this.variableStore.hasVariable(varName)) {
      const parsedDefault = this.parseDefaultValue(defaultValue)
      this.variableStore.setVariable(varName, parsedDefault, {
        persist: persistParam && this.shouldPersistValue(parsedDefault)
      })
    }

    // Read current value
    const currentValue = this.variableStore.getVariable(varName)
    this.setOutputValue('value', currentValue)
    
    // Output existence flag
    const exists = this.variableStore.hasVariable(varName) ? 1 : 0
    this.setOutputValue('exists', exists)
  }

  /**
   * Parse default value string to appropriate type
   */
  private parseDefaultValue(value: string): any {
    if (!value || value === '') return undefined
    
    // Try to parse as JSON first (handles numbers, booleans, objects, arrays)
    try {
      return JSON.parse(value)
    } catch {
      // If parsing fails, return as string
      return value
    }
  }

  private shouldPersistValue(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return true
    if (value instanceof OffscreenCanvas) return false
    if (value instanceof Tone.ToneAudioNode) return false
    if (typeof value === 'object') {
      try {
        structuredClone(value)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  toJSON() {
    return {
      ...super.toJSON(),
    }
  }
}
