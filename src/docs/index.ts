import { DOC_CATEGORIES, type DocEntry } from './types'
import { GETTING_STARTED_DOCS, TUTORIAL_DOCS, CONCEPT_DOCS } from './content'

/**
 * All documentation entries
 */
export const DOCS: DocEntry[] = [
  ...GETTING_STARTED_DOCS,
  {
    id: 'node-reference',
    title: 'Node Reference',
    category: DOC_CATEGORIES.NODES,
    content: '', // Will be generated dynamically from node metadata
    tags: ['nodes', 'reference']
  },
  ...CONCEPT_DOCS,
  ...TUTORIAL_DOCS,
]

/**
 * Get documentation entry by ID
 */
export function getDocById(id: string): DocEntry | undefined {
  return DOCS.find(doc => doc.id === id)
}

/**
 * Get all documentation entries for a category
 */
export function getDocsByCategory(category: string): DocEntry[] {
  return DOCS.filter(doc => doc.category === category)
}

// Re-export types and constants
export { DOC_CATEGORIES, type DocEntry } from './types'
