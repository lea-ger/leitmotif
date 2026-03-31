import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import { parse } from '@marcbachmann/cel-js'
import { useVariableStore } from '../../stores/variableStore'

/**
 * Expression Node
 * Evaluates a Common Expression Language (CEL) expression.
 * Variables a, b, c are bound to the corresponding input ports.
 * Global variables from the Variable Store are also available.
 * Use has(ctx, 'variableName') to check if a variable exists.
 *
 * Example expressions:
 *   a + b
 *   a * 2.0
 *   a > b ? a : b
 *   has(ctx, 'myVar') ? myVar : 'default'
 *   outputWidth / 4
 */
export class ExpressionNode extends BaseNode {
  private variableStore = useVariableStore()
  private cachedExpression: string = ''
  private cachedEvaluator: ((context: any) => any) | null = null

  constructor(id?: string) {
    super('expression', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'expression',
      category: NodeCategory.PROCESSOR,
      displayName: 'Expression',
      description: 'Evaluates a CEL expression with inputs a, b, c and global variables',
      color: '#f59e0b',
      icon: 'ph:math-operations'
    }
  }

  initialize(): void {
    this.addInput('a', DataType.ANY)
    this.addInput('b', DataType.ANY)
    this.addInput('c', DataType.ANY)

    this.addOutput('result', DataType.ANY)

    this.addParameter({
      id: 'expression',
      name: 'Expression',
      type: 'string',
      defaultValue: 'a',
      description: 'CEL expression using inputs a, b, c and global variables. Learn more: https://github.com/google/cel-spec'
    })
  }

  process(): void {
    const expr: string = this.getParameter('expression')
    if (!expr.trim()) {
      this.setOutputValue('result', undefined)
      return
    }

    // Re-parse only when expression changes
    if (expr !== this.cachedExpression) {
      this.cachedExpression = expr
      try {
        this.cachedEvaluator = parse(expr)
      } catch (error) {
        console.error('[ExpressionNode] Parse error:', error, 'Expression:', expr)
        this.cachedEvaluator = null
      }
    }

    if (!this.cachedEvaluator) {
      this.setOutputValue('result', undefined)
      return
    }

    const a = this.getInputValue('a')
    const b = this.getInputValue('b')
    const c = this.getInputValue('c')

    try {
      const context: Record<string, unknown> = {}

      // Add input ports
      if (a !== undefined) context.a = a
      if (b !== undefined) context.b = b
      if (c !== undefined) context.c = c

      // Add global variables
      for (const variable of this.variableStore.allVariables) {
        // Only add if not already defined by an input (inputs take precedence)
        if (!(variable.name in context)) {
          context[variable.name] = variable.value
        }
      }

      // Add context reference for has() function
      context.ctx = context

      const result = this.cachedEvaluator(context)
      this.setOutputValue('result', result)
    } catch (error) {
      console.error('[ExpressionNode] Evaluation error:', error, 'Expression:', expr)
      this.setOutputValue('result', undefined)
    }
  }

  cleanup(): void {
    this.cachedEvaluator = null
    this.cachedExpression = ''
  }
}
