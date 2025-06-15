/**
 * TurtleDB Vue 3 Adapter
 * Reactive composables for TurtleDB integration
 *
 * This module exports factory functions that create Vue composables.
 * The consuming application provides Vue 3 composition API functions.
 *
 * Usage:
 * import { ref, computed, onUnmounted } from 'vue'
 * import { createTurtleDBComposables } from 'turtledb/adapters/vue'
 *
 * const { useGraph, useSearch, useNodes } = createTurtleDBComposables({ ref, computed, onUnmounted })
 */

import { GraphCore } from '../index.js'

// Global graph instance management
const graphInstances = new Map()

/**
 * Get or create a graph instance
 */
function getGraphInstance(instanceId = 'default', schema = null, options = {}) {
  if (!graphInstances.has(instanceId)) {
    const graph = new GraphCore(schema, options)
    graphInstances.set(instanceId, graph)
  }
  return graphInstances.get(instanceId)
}

/**
 * Create TurtleDB Vue composables with provided Vue composition API
 * @param {Object} Vue - Vue composition API functions
 * @returns {Object} TurtleDB Vue composables
 */
export function createTurtleDBComposables(Vue) {
  const { ref, computed, onUnmounted, watch, nextTick } = Vue

  /**
   * Main composable for TurtleDB integration
   */
  function useGraph(options = {}) {
    const { instanceId = 'default', schema: graphSchema = null, graphOptions = {}, autoLoad = true } = options

    const graph = getGraphInstance(instanceId, graphSchema, graphOptions)

    // Reactive state
    const nodes = ref(graph.getNodes())
    const edges = ref(graph.getEdges())
    const softLinks = ref([...graph.softLinks])
    const isLoading = ref(false)
    const error = ref(null)

    // Track if we've loaded data
    let hasLoaded = false

    // Update reactive state when graph changes
    const updateNodes = () => {
      nodes.value = graph.getNodes()
    }

    const updateEdges = () => {
      edges.value = graph.getEdges()
    }

    const updateSoftLinks = () => {
      softLinks.value = [...graph.softLinks]
    }

    const handleError = (err) => {
      error.value = err
    }

    // Subscribe to graph events
    graph.on('node:add', updateNodes)
    graph.on('node:update', updateNodes)
    graph.on('node:delete', updateNodes)
    graph.on('edge:add', updateEdges)
    graph.on('edge:update', updateEdges)
    graph.on('edge:delete', updateEdges)
    graph.on('graph:clear', () => {
      updateNodes()
      updateEdges()
      updateSoftLinks()
    })
    graph.on('softlinks:generated', updateSoftLinks)
    graph.on('error', handleError)

    // Cleanup on unmount
    onUnmounted(() => {
      graph.off('node:add', updateNodes)
      graph.off('node:update', updateNodes)
      graph.off('node:delete', updateNodes)
      graph.off('edge:add', updateEdges)
      graph.off('edge:update', updateEdges)
      graph.off('edge:delete', updateEdges)
      graph.off('graph:clear', updateNodes)
      graph.off('softlinks:generated', updateSoftLinks)
      graph.off('error', handleError)
    })

    // Auto-load on creation
    if (autoLoad && !hasLoaded) {
      hasLoaded = true
      loadGraph()
    }

    // CRUD operations with error handling
    const createNode = async (type, data) => {
      try {
        error.value = null
        isLoading.value = true
        const node = await graph.createNode(type, data)
        return node
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    const updateNode = (id, update) => {
      try {
        error.value = null
        graph.updateNode(id, update)
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const deleteNode = (id) => {
      try {
        error.value = null
        graph.deleteNode(id)
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const createEdge = (type, sourceId, targetId, data = {}) => {
      try {
        error.value = null
        const edge = graph.createEdge(type, sourceId, targetId, data)
        return edge
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const updateEdge = (id, update) => {
      try {
        error.value = null
        graph.updateEdge(id, update)
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const deleteEdge = (id) => {
      try {
        error.value = null
        graph.deleteEdge(id)
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const clearGraph = () => {
      try {
        error.value = null
        graph.clear()
      } catch (err) {
        error.value = err
        throw err
      }
    }

    const saveGraph = async () => {
      try {
        error.value = null
        isLoading.value = true
        await graph.save()
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    const loadGraph = async () => {
      try {
        error.value = null
        isLoading.value = true
        await graph.load()
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    const generateSoftLinks = async () => {
      try {
        error.value = null
        isLoading.value = true
        await graph.generateSoftLinks()
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    // Computed values
    const stats = computed(() => graph.getStats())
    const currentSchema = computed(() => graph.getSchema())

    // Computed selectors
    const nodesByType = computed(() => {
      const counts = {}
      nodes.value.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1
      })
      return counts
    })

    const edgesByType = computed(() => {
      const counts = {}
      edges.value.forEach((edge) => {
        counts[edge.type] = (counts[edge.type] || 0) + 1
      })
      return counts
    })

    return {
      // Reactive state
      nodes,
      edges,
      softLinks,
      isLoading,
      error,
      stats,
      schema: currentSchema,
      nodesByType,
      edgesByType,

      // CRUD operations
      createNode,
      updateNode,
      deleteNode,
      createEdge,
      updateEdge,
      deleteEdge,
      clearGraph,

      // Persistence
      saveGraph,
      loadGraph,

      // Advanced features
      generateSoftLinks,

      // Direct graph access for advanced use cases
      graph,
    }
  }

  /**
   * Composable for semantic search functionality
   */
  function useSearch(options = {}) {
    const { instanceId = 'default', debounce = true, debounceMs = 300 } = options

    const graph = getGraphInstance(instanceId)
    const results = ref([])
    const isSearching = ref(false)
    const searchError = ref(null)
    let debounceTimer = null

    const search = async (query, limit = 10) => {
      if (!query?.trim()) {
        results.value = []
        return []
      }

      const performSearch = async () => {
        try {
          searchError.value = null
          isSearching.value = true
          const searchResults = await graph.searchNodes(query, limit)
          results.value = searchResults
          return searchResults
        } catch (err) {
          searchError.value = err
          results.value = []
          throw err
        } finally {
          isSearching.value = false
        }
      }

      if (debounce) {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }
        debounceTimer = setTimeout(performSearch, debounceMs)
      } else {
        return performSearch()
      }
    }

    const clearResults = () => {
      results.value = []
      searchError.value = null
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }

    onUnmounted(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    })

    return {
      search,
      results,
      isSearching,
      searchError,
      clearResults,
    }
  }

  /**
   * Composable for filtering and querying nodes
   */
  function useNodes(options = {}) {
    const { instanceId = 'default' } = options
    const { nodes } = useGraph({ instanceId, autoLoad: false })

    const byType = (type) => {
      return computed(() => nodes.value.filter((node) => node.type === type))
    }

    const byId = (id) => {
      return computed(() => nodes.value.find((node) => node.id === id))
    }

    const byProperty = (property, value) => {
      return computed(() => nodes.value.filter((node) => node.data?.[property] === value))
    }

    const search = (predicate) => {
      return computed(() => nodes.value.filter(predicate))
    }

    return {
      all: nodes,
      byType,
      byId,
      byProperty,
      search,
    }
  }

  /**
   * Composable for filtering and querying edges
   */
  function useEdges(options = {}) {
    const { instanceId = 'default' } = options
    const { edges } = useGraph({ instanceId, autoLoad: false })

    const byType = (type) => {
      return computed(() => edges.value.filter((edge) => edge.type === type))
    }

    const bySource = (sourceId) => {
      return computed(() => edges.value.filter((edge) => edge.sourceNodeId === sourceId))
    }

    const byTarget = (targetId) => {
      return computed(() => edges.value.filter((edge) => edge.targetNodeId === targetId))
    }

    const byNodes = (sourceId, targetId) => {
      return computed(() =>
        edges.value.filter((edge) => edge.sourceNodeId === sourceId && edge.targetNodeId === targetId),
      )
    }

    const search = (predicate) => {
      return computed(() => edges.value.filter(predicate))
    }

    return {
      all: edges,
      byType,
      bySource,
      byTarget,
      byNodes,
      search,
    }
  }

  /**
   * Composable for graph statistics and analytics
   */
  function useGraphStats(options = {}) {
    const { instanceId = 'default' } = options
    const { stats, nodes, edges } = useGraph({ instanceId, autoLoad: false })

    const nodesByType = computed(() => {
      const counts = {}
      nodes.value.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1
      })
      return counts
    })

    const edgesByType = computed(() => {
      const counts = {}
      edges.value.forEach((edge) => {
        counts[edge.type] = (counts[edge.type] || 0) + 1
      })
      return counts
    })

    const connectivity = computed(() => {
      const nodeConnections = {}
      edges.value.forEach((edge) => {
        nodeConnections[edge.sourceNodeId] = (nodeConnections[edge.sourceNodeId] || 0) + 1
        nodeConnections[edge.targetNodeId] = (nodeConnections[edge.targetNodeId] || 0) + 1
      })
      return nodeConnections
    })

    return {
      ...stats.value,
      nodesByType,
      edgesByType,
      connectivity,
    }
  }

  /**
   * Composable for creating a Pinia-like store
   */
  function useGraphStore(options = {}) {
    const { instanceId = 'default', schema: graphSchema = null, graphOptions = {}, autoLoad = true } = options

    const graphState = useGraph({ instanceId, schema: graphSchema, graphOptions, autoLoad })

    // Store-like interface
    const store = {
      // State
      state: computed(() => ({
        nodes: graphState.nodes.value,
        edges: graphState.edges.value,
        softLinks: graphState.softLinks.value,
        isLoading: graphState.isLoading.value,
        error: graphState.error.value,
        stats: graphState.stats.value,
        schema: graphState.schema.value,
      })),

      // Getters
      getters: {
        nodesByType: graphState.nodesByType,
        edgesByType: graphState.edgesByType,
        getNodeById: (id) => computed(() => graphState.nodes.value.find((node) => node.id === id)),
        getEdgesBySource: (sourceId) =>
          computed(() => graphState.edges.value.filter((edge) => edge.sourceNodeId === sourceId)),
        getEdgesByTarget: (targetId) =>
          computed(() => graphState.edges.value.filter((edge) => edge.targetNodeId === targetId)),
      },

      // Actions
      actions: {
        createNode: graphState.createNode,
        updateNode: graphState.updateNode,
        deleteNode: graphState.deleteNode,
        createEdge: graphState.createEdge,
        updateEdge: graphState.updateEdge,
        deleteEdge: graphState.deleteEdge,
        clearGraph: graphState.clearGraph,
        saveGraph: graphState.saveGraph,
        loadGraph: graphState.loadGraph,
        generateSoftLinks: graphState.generateSoftLinks,
      },

      // Direct graph access
      graph: graphState.graph,
    }

    return store
  }

  return {
    useGraph,
    useSearch,
    useNodes,
    useEdges,
    useGraphStats,
    useGraphStore,
  }
}

// Export the graph instance manager for advanced use cases
export { getGraphInstance }
