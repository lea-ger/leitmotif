<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <div class="navbar bg-base-300 border-b border-base-content/10">
      <div class="flex-1">
        <!-- Mobile menu toggle -->
        <label for="sidebar-drawer" class="btn btn-ghost drawer-button lg:hidden">
          <Icon icon="ph:list" class="text-xl" />
        </label>
        <a :href="withBase('/editor')" class="btn btn-ghost text-xl">
          <Icon icon="ph:arrow-left" />
          <span class="hidden sm:inline">Back to Editor</span>
        </a>
      </div>
      <div class="flex-none">
        <a :href="withBase('/')" class="btn btn-ghost">Home</a>
      </div>
    </div>

    <div class="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" class="drawer-toggle" />
      
      <div class="drawer-content flex">
        <!-- Content -->
        <main class="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <div v-if="currentDoc">
            <h1 class="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">{{ currentDoc.title }}</h1>

          <!-- Node Reference (special handling) -->
          <div v-if="currentDoc.id === 'node-reference'">
            <p class="text-base-content/70 mb-8">
              Complete reference of all available nodes in Leitmotif. Each node type has specific functionality
              for processing audio, video, canvas, sensor data, and control flow.
            </p>

            <div v-for="category in nodeCategories" :key="category" class="mb-12">
              <h3 class="text-2xl font-semibold mb-6">{{ getCategoryLabel(category) }} Nodes</h3>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  v-for="node in getNodesByCategory(category)" 
                  :key="node.type"
                  :id="'node-' + node.type"
                  class="card bg-base-200 shadow-sm"
                >
                  <div class="card-body p-4 sm:p-6">
                    <div class="flex items-start gap-3 sm:gap-4">
                      <div
                        class="w-10 h-10 sm:w-12 sm:h-12 rounded flex items-center justify-center shrink-0"
                        :style="{ 
                          backgroundColor: node.color + '20', 
                          color: node.color,
                          textShadow: '0 0 8px rgba(0,0,0,0.5)'
                        }"
                      >
                        <Icon :icon="node.icon" class="text-xl sm:text-2xl" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="card-title text-lg sm:text-xl flex-wrap gap-2">
                          {{ node.displayName }}
                          <span 
                            class="badge badge-sm font-normal" 
                            :style="{ 
                              backgroundColor: node.color + '20', 
                              color: node.color,
                              textShadow: '0 0 4px rgba(0,0,0,0.4)'
                            }"
                          >
                            {{ node.type }}
                          </span>
                        </h4>
                        <p class="text-sm text-base-content/70 mt-2">{{ node.description }}</p>

                        <!-- Ports -->
                        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div v-if="node.inputs.length > 0">
                            <h5 class="text-xs font-semibold uppercase opacity-60 mb-2">Inputs</h5>
                            <ul class="space-y-1">
                              <li v-for="input in node.inputs" :key="input.name" class="text-sm">
                                <span class="font-mono text-xs opacity-70">{{ input.name }}</span>
                                <span class="badge badge-xs text-white text-shadow-xs ml-2" :style="{ backgroundColor: getDataTypeColor(input.dataType) }">
                                  {{ input.dataType }}
                                </span>
                                <div v-if="input.description" class="text-xs opacity-60 ml-4">{{ input.description }}</div>
                              </li>
                            </ul>
                          </div>
                          <div v-if="node.outputs.length > 0">
                            <h5 class="text-xs font-semibold uppercase opacity-60 mb-2">Outputs</h5>
                            <ul class="space-y-1">
                              <li v-for="output in node.outputs" :key="output.name" class="text-sm">
                                <span class="font-mono text-xs opacity-70">{{ output.name }}</span>
                                <span class="badge badge-xs text-white text-shadow-xs ml-2" :style="{ backgroundColor: getDataTypeColor(output.dataType) }">
                                  {{ output.dataType }}
                                </span>
                                <div v-if="output.description" class="text-xs opacity-60 ml-4">{{ output.description }}</div>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <!-- Parameters -->
                        <div v-if="node.parameters.length > 0" class="mt-4">
                          <h5 class="text-xs font-semibold uppercase opacity-60 mb-2">Parameters</h5>
                          <ul clasfs="space-y-1">
                            <li v-for="param in node.parameters" :key="param.id" class="text-sm">
                              <span class="font-semibold">{{ param.name }}</span>
                              <span class="badge badge-xs badge-ghost text-shadow-xs ml-2">{{ param.type }}</span>
                              <div v-if="param.description" class="text-xs opacity-60 ml-4 mt-1" v-html="formatDescription(param.description)"></div>
                              <div v-else class="text-xs opacity-60 ml-4 mt-1">
                                Default: <code class="text-xs">{{ param.defaultValue }}</code>
                              </div>
                            </li>
                          </ul>
                        </div>

                        <!-- Implementation Details -->
                        <div v-if="getNodeDetails(node.type)" class="mt-4">
                          <details class="collapse collapse-arrow bg-base-300">
                            <summary class="collapse-title text-sm font-medium">Implementation Details</summary>
                            <div class="collapse-content text-sm opacity-70" v-html="getNodeDetails(node.type)"></div>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Regular documentation page -->
          <div v-else class="prose prose-lg max-w-none" v-html="currentDoc.content"></div>

          <!-- Navigation -->
          <div class="flex justify-between mt-12 pt-8 border-t border-base-content/10">
            <router-link 
              v-if="previousDoc" 
              :to="'/learn/' + previousDoc.id"
              class="btn btn-ghost"
            >
              <Icon icon="ph:arrow-left" />
              {{ previousDoc.title }}
            </router-link>
            <div v-else></div>
            <router-link 
              v-if="nextDoc" 
              :to="'/learn/' + nextDoc.id"
              class="btn btn-ghost"
            >
              {{ nextDoc.title }}
              <Icon icon="ph:arrow-right" />
            </router-link>
          </div>
        </div>

        <!-- Not found -->
        <div v-else class="text-center py-16">
          <Icon icon="ph:file-search" class="text-6xl opacity-20 mb-4" />
          <h2 class="text-2xl font-bold mb-4">Documentation Not Found</h2>
          <p class="text-base-content/60 mb-6">The page you're looking for doesn't exist.</p>
          <router-link to="/learn/introduction" class="btn btn-primary">
            Go to Introduction
          </router-link>
        </div>
      </main>
    </div>
    
    <!-- Drawer Sidebar -->
    <div class="drawer-side">
      <label for="sidebar-drawer" class="drawer-overlay"></label>
      <aside class="w-64 bg-base-200 min-h-full p-4">
        <div class="space-y-4">
          <div v-for="(entries, category) in docsByCategory" :key="category">
            <h3 class="text-xs font-semibold uppercase opacity-60 mb-2">{{ category }}</h3>
            <ul class="menu menu-sm space-y-1">
              <li v-for="entry in entries" :key="entry.id">
                <router-link 
                  :to="'/learn/' + entry.id"
                  :class="{ 'active': currentDocId === entry.id }"
                >
                  {{ entry.title }}
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {Icon} from '@iconify/vue'
import {NodeRegistry} from '../nodes/NodeRegistry'
import {registerAllNodes} from '../nodes'
import {getNodeColor, getNodeVisualCategory, type DataType, type NodeMetadata, type NodeParameter} from '../nodes/types'
import {DOC_CATEGORIES, DOCS, getDocById, getDocsByCategory} from '../docs'
import {getDataTypeColor} from "../utils/utils.ts";

// Register all node types so they're available for the reference
registerAllNodes()

interface Props {
  docId?: string
}

const props = defineProps<Props>()
const route = useRoute()

const currentDocId = computed(() => props.docId || route.params.docId as string || 'introduction')
const currentDoc = computed(() => getDocById(currentDocId.value))

const docsByCategory = computed(() => {
  const categories: Record<string, any[]> = {}
  for (const category of Object.values(DOC_CATEGORIES)) {
    categories[category] = getDocsByCategory(category)
  }
  return categories
})

const allDocs = computed(() => DOCS)
const currentDocIndex = computed(() => allDocs.value.findIndex(doc => doc.id === currentDocId.value))
const previousDoc = computed(() => currentDocIndex.value > 0 ? allDocs.value[currentDocIndex.value - 1] : null)
const nextDoc = computed(() => currentDocIndex.value < allDocs.value.length - 1 ? allDocs.value[currentDocIndex.value + 1] : null)

const nodeCategories = ['video', 'audio', 'processing', 'control-flow', 'output', 'utility']

function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

interface NodeDocInfo extends NodeMetadata {
  inputs: Array<{ name: string; dataType: DataType; description?: string }>
  outputs: Array<{ name: string; dataType: DataType; description?: string }>
  parameters: NodeParameter[]
}

function getNodesByCategory(category: string): NodeDocInfo[] {
  const allNodes = NodeRegistry.getAllMetadata()
  
  return allNodes
    .filter(node => getNodeVisualCategory(node) === category)
    .map(metadata => {
      // Create instance to get detailed info
      const instance = NodeRegistry.create(metadata.type)
      if (!instance) {
        console.warn('[LearnView] Failed to create instance for', metadata.type)
        return null
      }

      const inputs = instance.getInputPorts().map(port => ({
        name: port.name,
        dataType: port.dataType,
        description: port.description
      }))

      const outputs = instance.getOutputPorts().map(port => ({
        name: port.name,
        dataType: port.dataType,
        description: port.description
      }))

      const parameters = instance.getParameterDefinitions()

      instance.cleanup()

      return {
        ...metadata,
        color: getNodeColor(metadata),
        inputs,
        outputs,
        parameters
      }
    })
    .filter(Boolean) as NodeDocInfo[]
}

function formatDescription(description: string): string {
  return description.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="link">$1</a>'
  )
}

function getCategoryLabel(category: string): string {
  if (category === 'control-flow') return 'Control Flow'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function getNodeDetails(nodeType: string): string | null {
  const details: Record<string, string> = {
    'expression': `
      <p class="mb-2">Uses the Common Expression Language (CEL) to evaluate mathematical and logical expressions.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>Variables <code>a</code>, <code>b</code>, <code>c</code> are bound to input ports</li>
        <li>All global variables from the Variable Store are accessible</li>
        <li>Supports standard math operators: +, -, *, /, %</li>
        <li>Supports comparisons: ==, !=, <, <=, >, >=</li>
        <li>Supports logical operators: &&, ||, !</li>
        <li>Supports ternary operator: condition ? trueValue : falseValue</li>
        <li>Caches parsed expressions for performance</li>
      </ul>
    `,
    'if': `
      <p class="mb-2">Routes input values based on a CEL condition expression.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>The <code>value</code> input is routed to either <code>onTrue</code> or <code>onFalse</code></li>
        <li>Condition can access <code>value</code>, <code>a</code>, <code>b</code> and global variables</li>
        <li>Non-matching output receives null</li>
        <li>Useful for conditional processing pipelines</li>
      </ul>
    `,
    'get-variable': `
      <p class="mb-2">Reads values from the global Variable Store.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>Variables persist across graph executions</li>
        <li>Can use CEL expressions as default values if variable doesn't exist</li>
        <li>Returns unwrapped values (removes Vue reactivity)</li>
        <li>Useful for state management and inter-node communication</li>
      </ul>
    `,
    'set-variable': `
      <p class="mb-2">Writes values to the global Variable Store.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>Persist flag controls whether variable is saved to disk</li>
        <li>Runtime objects (OffscreenCanvas, AudioNodes) are automatically cloned</li>
        <li>Auto-detects non-persistable values and disables persistence</li>
        <li>Passes input value through to output for chaining</li>
      </ul>
    `,
    'canvas-merge': `
      <p class="mb-2">Combines multiple canvas layers into a single output canvas.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>Supports two foreground layers (A, B) and one background</li>
        <li>Auto-sizes output based on input canvases when width/height are 0</li>
        <li>Position control via xA, yA, xB, yB inputs</li>
        <li>Duck-typing for canvas detection (handles wrapped objects)</li>
        <li>Creates new OffscreenCanvas each frame to avoid mutations</li>
      </ul>
    `,
    'generate-canvas': `
      <p class="mb-2">Creates a blank canvas for drawing operations.</p>
      <ul class="list-disc list-inside space-y-1">
        <li>Reuses canvas instance when dimensions don't change</li>
        <li>Clears and fills with background color each frame</li>
        <li>Marked as raw to prevent Vue reactivity overhead</li>
        <li>Downstream nodes can draw onto the same canvas reference</li>
      </ul>
    `,
  }
  return details[nodeType] || null
}
</script>

<style scoped>
/* Custom styles for documentation content */
:deep(.prose) {
  color: oklch(var(--bc));
  max-width: none;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
}

:deep(.prose h4) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
}

:deep(.prose p) {
  margin-bottom: 1rem;
  line-height: 1.625;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
}

:deep(.prose li) {
  margin-bottom: 0.5rem;
}

:deep(.prose ul) {
  list-style-type: disc;
}

:deep(.prose ol) {
  list-style-type: decimal;
}

:deep(.prose a) {
  color: oklch(var(--p));
  text-decoration: underline;
}

:deep(.prose a:hover) {
  opacity: 0.8;
}

:deep(.prose pre) {
  background: var(--color-accent);
  color: var(--color-accent-content);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

:deep(.prose code) {
  background: var(--color-accent);
  color: var(--color-accent-content);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

:deep(.prose pre code) {
  background: transparent;
  padding: 0;
}

:deep(.prose strong) {
  font-weight: 600;
  color: oklch(var(--p));
}

/* Card code elements */
code {
  background: oklch(var(--b3));
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}
</style>
