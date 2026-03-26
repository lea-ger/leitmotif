import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { parse } from '@marcbachmann/cel-js'
import { useVariableStore } from '../../stores/variableStore'

/**
 * If Node
 * Routes the `value` input to either `onTrue` or `onFalse` based on a
 * CEL condition expression. `value`, `a`, and `b` are available as
 * variables inside the condition, along with global variables.
 *
 * Example conditions:
 *   value > 0.5
 *   a == b
 *   value > threshold
 *   value != null
 */
export class IfNode extends BaseNode {
  private variableStore = useVariableStore()
  private cachedCondition: string = ''
  private cachedEvaluator: ((context: any) => any) | null = null

  constructor(id?: string) {
    super('if', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'if',
      category: NodeCategory.PROCESSOR,
      displayName: 'If',
      description: 'Routes value based on a CEL condition with global variables',
      color: '#0ea5e9',
      icon: 'ph:git-branch'
    }
  }

  initialize(): void {
    this.addInput('value', DataType.ANY)
    this.addInput('a', DataType.ANY)
    this.addInput('b', DataType.ANY)

    this.addOutput('onTrue', DataType.ANY)
    this.addOutput('onFalse', DataType.ANY)

    this.addParameter({
      id: 'condition',
      name: 'Condition',
      type: 'string',
      defaultValue: 'value > 0'
    })
  }

  process(): void {
    const conditionExpr: string = this.getParameter('condition')
    const value = this.getInputValue('value')

    if (!conditionExpr.trim()) {
      this.setOutputValue('onTrue', null)
      this.setOutputValue('onFalse', value)
      return
    }

    // Re-parse only when condition expression changes
    if (conditionExpr !== this.cachedCondition) {
      this.cachedCondition = conditionExpr
      try {
        this.cachedEvaluator = parse(conditionExpr)
      } catch (error) {
        console.error('[IfNode] Parse error:', error, 'Condition:', conditionExpr)
        this.cachedEvaluator = null
      }
    }

    if (!this.cachedEvaluator) {
      this.setOutputValue('onTrue', null)
      this.setOutputValue('onFalse', value)
      return
    }

    const a = this.getInputValue('a')
    const b = this.getInputValue('b')

    let result: boolean = false
    try {
      const context: Record<string, unknown> = { value }
      
      // Add input ports
      if (a !== undefined) context.a = a
      if (b !== undefined) context.b = b

      // Add global variables
      for (const variable of this.variableStore.allVariables) {
        // Only add if not already defined by an input (inputs take precedence)
        if (!(variable.name in context)) {
          context[variable.name] = variable.value
        }
      }

      result = Boolean(this.cachedEvaluator(context))
    } catch (error) {
      console.error('[IfNode] Condition evaluation error:', error, 'Condition:', conditionExpr)
      result = false
    }

    this.setOutputValue('onTrue', result ? value : null)
    this.setOutputValue('onFalse', result ? null : value)
  }

  cleanup(): void {
    this.cachedEvaluator = null
    this.cachedCondition = ''
  }
}
