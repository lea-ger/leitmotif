/**
 * Documentation categories
 */
export const DOC_CATEGORIES = {
  GETTING_STARTED: 'Getting Started',
  NODES: 'Node Reference',
  CONCEPTS: 'Concepts',
  TUTORIALS: 'Tutorials',
} as const

/**
 * Documentation entry
 */
export interface DocEntry {
  id: string
  title: string
  category: string
  content: string
  tags?: string[]
}
