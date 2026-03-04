import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { evaluate, parse, type ParseResult } from 'cel-js'

/**
 * If Node
 * Routes the `value` input to either `onTrue` or `onFalse` based on a
 * CEL condition expression. `value`, `a`, and `b` are available as
 * variables inside the condition.
 *
 * Example conditions:
 *   value > 0.5
 *   a == b
 *   value != null
 */
export class IfNode extends BaseNode {
  private cachedCondition: string = ''
  private cachedCst: ParseResult | null = null

  constructor(id?: string) {
    super('if', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'if',
      category: NodeCategory.PROCESSOR,
      displayName: 'If',
      description: 'Routes value to onTrue or onFalse output based on a CEL condition',
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
      this.cachedCst = parse(conditionExpr)
    }

    if (!this.cachedCst || !this.cachedCst.isSuccess) {
      this.setOutputValue('onTrue', null)
      this.setOutputValue('onFalse', value)
      return
    }

    const a = this.getInputValue('a')
    const b = this.getInputValue('b')

    let result: boolean = false
    try {
      const context: Record<string, unknown> = { value }
      if (a !== undefined) context.a = a
      if (b !== undefined) context.b = b

      result = Boolean(evaluate(this.cachedCst.cst, context))
    } catch {
      result = false
    }

    this.setOutputValue('onTrue', result ? value : null)
    this.setOutputValue('onFalse', result ? null : value)
  }

  cleanup(): void {
    this.cachedCst = null
    this.cachedCondition = ''
  }
}
