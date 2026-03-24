import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as storage from '../utils/storage'

export interface Variable {
  name: string
  value: any
  type: 'number' | 'string' | 'boolean' | 'object' | 'array' | 'unknown'
  lastUpdated: Date
}

export const useVariableStore = defineStore('variable', () => {
  const variables = ref<Map<string, Variable>>(new Map())

  /**
   * Get all variables as array
   */
  const allVariables = computed(() => {
    return Array.from(variables.value.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  })

  /**
   * Get variable value by name
   */
  const getVariable = (name: string): any => {
    return variables.value.get(name)?.value
  }

  /**
   * Get variable metadata
   */
  const getVariableInfo = (name: string): Variable | undefined => {
    return variables.value.get(name)
  }

  /**
   * Set variable value
   */
  const setVariable = (name: string, value: any): void => {
    const type = inferType(value)
    
    variables.value.set(name, {
      name,
      value,
      type,
      lastUpdated: new Date()
    })

    saveToStorage().catch(e => console.error('Failed to save variables:', e))
  }

  /**
   * Delete variable
   */
  const deleteVariable = (name: string): void => {
    variables.value.delete(name)
    saveToStorage().catch(e => console.error('Failed to save variables:', e))
  }

  /**
   * Check if variable exists
   */
  const hasVariable = (name: string): boolean => {
    return variables.value.has(name)
  }

  /**
   * Clear all variables
   */
  const clearAll = (): void => {
    variables.value.clear()
    saveToStorage().catch(e => console.error('Failed to clear variables:', e))
  }

  /**
   * Infer type from value
   */
  const inferType = (value: any): Variable['type'] => {
    if (value === null || value === undefined) return 'unknown'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    return 'unknown'
  }

  /**
   * Save to IndexedDB
   */
  const saveToStorage = async (): Promise<void> => {
    try {
      const data = Array.from(variables.value.values()).map(v => ({
        name: v.name,
        value: v.value,
        type: v.type,
        lastUpdated: v.lastUpdated.toISOString()
      }))
      await storage.setItem('leitmotif-variables', data)
    } catch (error) {
      console.error('Failed to save variables:', error)
    }
  }

  /**
   * Load from IndexedDB
   */
  const loadFromStorage = async (): Promise<void> => {
    try {
      const data = await storage.getItem<any[]>('leitmotif-variables')
      if (!data) return

      data.forEach((item: any) => {
        variables.value.set(item.name, {
          name: item.name,
          value: item.value,
          type: item.type,
          lastUpdated: new Date(item.lastUpdated)
        })
      })

      console.log(`Loaded ${data.length} variable(s) from storage`)
    } catch (error) {
      console.error('Failed to load variables:', error)
    }
  }

  return {
    variables,
    allVariables,
    getVariable,
    getVariableInfo,
    setVariable,
    deleteVariable,
    hasVariable,
    clearAll,
    saveToStorage,
    loadFromStorage
  }
})
