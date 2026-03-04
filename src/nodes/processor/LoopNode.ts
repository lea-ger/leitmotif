import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Loop Node
 * Iterates through a list input, emitting one item per frame (step mode)
 * or the item at a given index (index mode).
 */
export class LoopNode extends BaseNode {
  private currentIndex: number = 0

  constructor(id?: string) {
    super('loop', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'loop',
      category: NodeCategory.PROCESSOR,
      displayName: 'Loop',
      description: 'Iterates over a list, emitting one item per frame or at a given index',
      color: '#8b5cf6',
      icon: 'ph:arrows-clockwise'
    }
  }

  initialize(): void {
    this.addInput('list', DataType.OBJECT)
    this.addInput('index', DataType.NUMERIC)
    this.addInput('reset', DataType.EVENT)

    this.addOutput('item', DataType.ANY)
    this.addOutput('index', DataType.NUMERIC)
    this.addOutput('length', DataType.NUMERIC)
    this.addOutput('done', DataType.EVENT)

    this.addParameter({
      id: 'mode',
      name: 'Mode',
      type: 'select',
      defaultValue: 'step',
      options: [
        { label: 'Step (auto-advance)', value: 'step' },
        { label: 'Index (external index)', value: 'index' }
      ]
    })

    this.addParameter({
      id: 'loop',
      name: 'Loop',
      type: 'boolean',
      defaultValue: true
    })
  }

  process(): void {
    const list: unknown[] | null = this.getInputValue('list')
    if (!Array.isArray(list) || list.length === 0) {
      this.setOutputValue('item', undefined)
      this.setOutputValue('index', 0)
      this.setOutputValue('length', 0)
      this.setOutputValue('done', null)
      return
    }

    const len = list.length
    const mode: string = this.getParameter('mode')
    const shouldLoop: boolean = this.getParameter('loop')

    // Reset signal
    const resetSignal = this.getInputValue('reset')
    if (resetSignal !== null && resetSignal !== undefined) {
      this.currentIndex = 0
    }

    let idx: number

    if (mode === 'index') {
      const extIndex = this.getInputValue('index')
      idx = typeof extIndex === 'number' ? Math.floor(extIndex) : 0
      idx = Math.max(0, Math.min(len - 1, idx))
    } else {
      // step mode: use internal counter
      idx = this.currentIndex
      if (idx >= len) {
        idx = shouldLoop ? idx % len : len - 1
        this.currentIndex = idx
      }
    }

    const item = list[idx]
    this.setOutputValue('item', item)
    this.setOutputValue('index', idx)
    this.setOutputValue('length', len)

    // Advance counter in step mode
    let done: boolean = false
    if (mode === 'step') {
      const next = this.currentIndex + 1
      if (next >= len) {
        done = true
        this.currentIndex = shouldLoop ? 0 : len - 1
      } else {
        this.currentIndex = next
      }
    }
    this.setOutputValue('done', done ? true : null)
  }

  cleanup(): void {
    this.currentIndex = 0
  }
}
