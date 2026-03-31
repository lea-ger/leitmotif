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
      defaultValue: '',
      description: 'Name of the variable to read'
    })

    this.addParameter({
      id: 'default',
      name: 'Default Value (CEL)',
      type: 'string',
      defaultValue: '',
      description: 'CEL expression to initialize variable if it doesn\'t exist (creates variable on first access). Learn more: https://github.com/google/cel-spec'
    })
    
    this.addParameter({
      id: 'typeHint',
      name: 'Type Cast',
      type: 'string',
      defaultValue: 'none',
      options: ['none', 'int', 'double', 'string', 'bool'],
      description: 'Automatically cast the output value to this CEL type for strict type compatibility'
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
      let value = variable && typeof variable === 'object' ? toRaw(variable) : variable
      
      // Convert BigInt to regular number for CEL compatibility
      if (typeof value === 'bigint') {
        value = Number(value)
      }
      
      // Apply type cast if specified
      const typeHint: string = this.getParameter('typeHint') || 'none'
      if (typeHint !== 'none') {
        value = this.applyCast(value, typeHint)
      }
      
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
      
      // Auto-initialize: store the default value in the variable store
      this.variableStore.setVariable(name, result, { persist: true })
      
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
  
  private applyCast(value: any, typeHint: string): any {
    switch (typeHint) {
      case 'int':
        return Math.floor(Number(value))
      case 'double':
        return Number(value)
      case 'string':
        return String(value)
      case 'bool':
        return Boolean(value)
      default:
        return value
    }
  }
}
