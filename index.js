/**
 * TurtleDB - Node.js Entry Point
 * Main module exports for the graph database
 */

export { GraphCore } from './graph-node.js'
export { getEmbedding, cosineSimilarity } from './embeddings-node.js'
export { validateSchema } from './schema-validator-node.js'
export { EventEmitter } from './events-node.js'
export { createInstance as createStorage } from './storage-node.js'

// Framework adapters
export { createTurtleDBHooks } from './adapters/react.js'
export { createTurtleDBComposables } from './adapters/vue.js'
export { createTurtleDBStores } from './adapters/svelte.js'

// Re-export Prolog integration (when available)
// export { initProlog, queryProlog, assertFact, retractFact } from './core/prolog.js'
