import { toRaw } from 'vue'
import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { useVariableStore } from '../../stores/variableStore'

/**
 * GetVariableNode
 * Reads a variable from the global variable store and outputs its value
 */
export class GetVariableNode extends BaseNode {
  private variableStore: ReturnType<typeof useVariableStore> | null = null

  constructor(id?: string) {
    super('get-variable', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'get-variable',
      category: NodeCategory.UTILITY,
      displayName: 'Get Variable',
      description: 'Reads a variable from the global store',
      color: '#9333EA',
      icon: 'ph:database'
    }
  }

  initialize(): void {
    this.addOutput('value', DataType.ANY)

    this.addParameter({
      id: 'name',
      name: 'Variable Name',
      type: 'string',
      defaultValue: ''
    })
  }

  process(): void {
    if (!this.variableStore) {
      this.variableStore = useVariableStore()
    }

    const name: string = this.getParameter('name')
    if (!name) {
      this.setOutputValue('value', null)
      return
    }

    const variable = this.variableStore.getVariable(name)
    
    // Use toRaw for objects to unwrap any reactivity wrappers
    const value = variable && typeof variable === 'object' ? toRaw(variable) : variable
    
    this.setOutputValue('value', value)
  }

  cleanup(): void {
    this.variableStore = null
  }
}
