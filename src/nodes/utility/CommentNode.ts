import { BaseNode } from '../BaseNode'
import { NodeCategory, type NodeMetadata } from '../types'

export class CommentNode extends BaseNode {
  constructor(id?: string) {
    super('comment', id)
  }

  public override initialize(): void {
    this.addParameter({
      id: 'text',
      name: 'Comment',
      type: 'string',
      defaultValue: 'Double click to edit comment...'
    })
    this.addParameter({
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 200,
      min: 100
    })
    this.addParameter({
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 150,
      min: 50
    })
  }

  public override getMetadata(): NodeMetadata {
    return {
      type: 'comment',
      category: NodeCategory.UTILITY,
      displayName: 'Comment',
      description: 'Add a comment to document your graph',
      icon: 'ph:chat-text',
      color: '#6b7280'
    }
  }

  public override process(): Promise<void> {
    return Promise.resolve()
  }
}
