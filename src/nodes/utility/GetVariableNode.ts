import { toRaw } from 'vue'
import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { useVariableStore } from '../../stores/variableStore'
import { parse } from '@marcbachmann/cel-js'

/**
 * GetVariableNode
 * Reads a variable from the global variable store and outputs its value.
 * If the variable doesn't exist, evaluates the default value as a CEL expression.
 */
export class GetVariableNode extends BaseNode {
  private variableStore: ReturnType<typeof useVariableStore> | null = null
  private cachedDefault: string = ''
  private cachedEvaluator: ((context: any) => any) | null = null

  constructor(id?: string) {
    super('get-variable', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'get-variable',
      category: NodeCategory.UTILITY,
      displayName: 'Get Variable',
      description: 'Reads a variable from the global store with optional CEL default value',
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

    this.addParameter({
      id: 'default',
      name: 'Default Value (CEL)',
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
    
    // If variable exists, return it
    if (variable !== undefined) {
      const value = variable && typeof variable === 'object' ? toRaw(variable) : variable
      this.setOutputValue('value', value)
      return
    }

    // Variable doesn't exist - evaluate default CEL expression
    const defaultExpr: string = this.getParameter('default')
    if (!defaultExpr.trim()) {
      this.setOutputValue('value', null)
      return
    }

    // Re-parse only when default expression changes
    if (defaultExpr !== this.cachedDefault) {
      this.cachedDefault = defaultExpr
      try {
        this.cachedEvaluator = parse(defaultExpr)
      } catch (error) {
        console.error('[GetVariableNode] Parse error in default:', error, 'Expression:', defaultExpr)
        this.cachedEvaluator = null
      }
    }

    if (!this.cachedEvaluator) {
      this.setOutputValue('value', null)
      return
    }

    try {
      const context: Record<string, unknown> = {}
      
      // Add all existing variables to context for default expression
      for (const v of this.variableStore.allVariables) {
        context[v.name] = v.value
      }

      const result = this.cachedEvaluator(context)
      this.setOutputValue('value', result)
    } catch (error) {
      console.error('[GetVariableNode] Evaluation error in default:', error, 'Expression:', defaultExpr)
      this.setOutputValue('value', null)
    }
  }

  cleanup(): void {
    this.variableStore = null
    this.cachedEvaluator = null
    this.cachedDefault = ''
  }
}
