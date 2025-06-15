/**
 * TurtleDB Svelte Adapter
 * Reactive stores for TurtleDB integration
 *
 * This module exports factory functions that create Svelte stores.
 * The consuming application provides Svelte store functions.
 *
 * Usage:
 * import { writable, derived, readable } from 'svelte/store'
 * import { createTurtleDBStores } from 'turtledb/adapters/svelte'
 *
 * const { createGraphStore, createSearchStore } = createTurtleDBStores({ writable, derived, readable })
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
 * Create TurtleDB Svelte stores with provided Svelte store functions
 * @param {Object} Svelte - Svelte store functions
 * @returns {Object} TurtleDB Svelte store creators
 */
export function createTurtleDBStores(Svelte) {
  const { writable, derived, readable, get } = Svelte

  /**
   * Create a reactive graph store
   */
  function createGraphStore(options = {}) {
    const { instanceId = 'default', schema: graphSchema = null, graphOptions = {}, autoLoad = true } = options

    const graph = getGraphInstance(instanceId, graphSchema, graphOptions)

    // Core reactive stores
    const nodes = writable(graph.getNodes())
    const edges = writable(graph.getEdges())
    const softLinks = writable([...graph.softLinks])
    const isLoading = writable(false)
    const error = writable(null)

    // Track if we've loaded data
    let hasLoaded = false

    // Update stores when graph changes
    const updateNodes = () => {
      nodes.set(graph.getNodes())
    }

    const updateEdges = () => {
      edges.set(graph.getEdges())
    }

    const updateSoftLinks = () => {
      softLinks.set([...graph.softLinks])
    }

    const handleError = (err) => {
      error.set(err)
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

    // Auto-load on creation
    if (autoLoad && !hasLoaded) {
      hasLoaded = true
      loadGraph()
    }

    // CRUD operations with error handling
    const createNode = async (type, data) => {
      try {
        error.set(null)
        isLoading.set(true)
        const node = await graph.createNode(type, data)
        return node
      } catch (err) {
        error.set(err)
        throw err
      } finally {
        isLoading.set(false)
      }
    }

    const updateNode = (id, update) => {
      try {
        error.set(null)
        graph.updateNode(id, update)
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const deleteNode = (id) => {
      try {
        error.set(null)
        graph.deleteNode(id)
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const createEdge = (type, sourceId, targetId, data = {}) => {
      try {
        error.set(null)
        const edge = graph.createEdge(type, sourceId, targetId, data)
        return edge
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const updateEdge = (id, update) => {
      try {
        error.set(null)
        graph.updateEdge(id, update)
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const deleteEdge = (id) => {
      try {
        error.set(null)
        graph.deleteEdge(id)
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const clearGraph = () => {
      try {
        error.set(null)
        graph.clear()
      } catch (err) {
        error.set(err)
        throw err
      }
    }

    const saveGraph = async () => {
      try {
        error.set(null)
        isLoading.set(true)
        await graph.save()
      } catch (err) {
        error.set(err)
        throw err
      } finally {
        isLoading.set(false)
      }
    }

    const loadGraph = async () => {
      try {
        error.set(null)
        isLoading.set(true)
        await graph.load()
      } catch (err) {
        error.set(err)
        throw err
      } finally {
        isLoading.set(false)
      }
    }

    const generateSoftLinks = async () => {
      try {
        error.set(null)
        isLoading.set(true)
        await graph.generateSoftLinks()
      } catch (err) {
        error.set(err)
        throw err
      } finally {
        isLoading.set(false)
      }
    }

    // Derived stores for computed values
    const stats = derived([nodes, edges], () => graph.getStats())

    const schema = readable(graph.getSchema())

    const nodesByType = derived(nodes, ($nodes) => {
      const counts = {}
      $nodes.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1
      })
      return counts
    })

    const edgesByType = derived(edges, ($edges) => {
      const counts = {}
      $edges.forEach((edge) => {
        counts[edge.type] = (counts[edge.type] || 0) + 1
      })
      return counts
    })

    const connectivity = derived(edges, ($edges) => {
      const nodeConnections = {}
      $edges.forEach((edge) => {
        nodeConnections[edge.sourceNodeId] = (nodeConnections[edge.sourceNodeId] || 0) + 1
        nodeConnections[edge.targetNodeId] = (nodeConnections[edge.targetNodeId] || 0) + 1
      })
      return nodeConnections
    })

    // Cleanup function
    const destroy = () => {
      graph.off('node:add', updateNodes)
      graph.off('node:update', updateNodes)
      graph.off('node:delete', updateNodes)
      graph.off('edge:add', updateEdges)
      graph.off('edge:update', updateEdges)
      graph.off('edge:delete', updateEdges)
      graph.off('graph:clear', updateNodes)
      graph.off('softlinks:generated', updateSoftLinks)
      graph.off('error', handleError)
    }

    return {
      // Core stores
      nodes,
      edges,
      softLinks,
      isLoading,
      error,

      // Derived stores
      stats,
      schema,
      nodesByType,
      edgesByType,
      connectivity,

      // Actions
      createNode,
      updateNode,
      deleteNode,
      createEdge,
      updateEdge,
      deleteEdge,
      clearGraph,
      saveGraph,
      loadGraph,
      generateSoftLinks,

      // Utilities
      destroy,
      graph,
    }
  }

  /**
   * Create a reactive search store
   */
  function createSearchStore(options = {}) {
    const { instanceId = 'default', debounce = true, debounceMs = 300 } = options

    const graph = getGraphInstance(instanceId)
    const results = writable([])
    const isSearching = writable(false)
    const searchError = writable(null)
    let debounceTimer = null

    const search = async (query, limit = 10) => {
      if (!query?.trim()) {
        results.set([])
        return []
      }

      const performSearch = async () => {
        try {
          searchError.set(null)
          isSearching.set(true)
          const searchResults = await graph.searchNodes(query, limit)
          results.set(searchResults)
          return searchResults
        } catch (err) {
          searchError.set(err)
          results.set([])
          throw err
        } finally {
          isSearching.set(false)
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
      results.set([])
      searchError.set(null)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }

    const destroy = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }

    return {
      results,
      isSearching,
      searchError,
      search,
      clearResults,
      destroy,
    }
  }

  /**
   * Create stores for filtering and querying nodes
   */
  function createNodeStores(options = {}) {
    const { instanceId = 'default' } = options
    const graphStore = createGraphStore({ instanceId, autoLoad: false })

    const byType = (type) => {
      return derived(graphStore.nodes, ($nodes) => $nodes.filter((node) => node.type === type))
    }

    const byId = (id) => {
      return derived(graphStore.nodes, ($nodes) => $nodes.find((node) => node.id === id))
    }

    const byProperty = (property, value) => {
      return derived(graphStore.nodes, ($nodes) => $nodes.filter((node) => node.data?.[property] === value))
    }

    const search = (predicate) => {
      return derived(graphStore.nodes, ($nodes) => $nodes.filter(predicate))
    }

    return {
      all: graphStore.nodes,
      byType,
      byId,
      byProperty,
      search,
      destroy: graphStore.destroy,
    }
  }

  /**
   * Create stores for filtering and querying edges
   */
  function createEdgeStores(options = {}) {
    const { instanceId = 'default' } = options
    const graphStore = createGraphStore({ instanceId, autoLoad: false })

    const byType = (type) => {
      return derived(graphStore.edges, ($edges) => $edges.filter((edge) => edge.type === type))
    }

    const bySource = (sourceId) => {
      return derived(graphStore.edges, ($edges) => $edges.filter((edge) => edge.sourceNodeId === sourceId))
    }

    const byTarget = (targetId) => {
      return derived(graphStore.edges, ($edges) => $edges.filter((edge) => edge.targetNodeId === targetId))
    }

    const byNodes = (sourceId, targetId) => {
      return derived(graphStore.edges, ($edges) =>
        $edges.filter((edge) => edge.sourceNodeId === sourceId && edge.targetNodeId === targetId),
      )
    }

    const search = (predicate) => {
      return derived(graphStore.edges, ($edges) => $edges.filter(predicate))
    }

    return {
      all: graphStore.edges,
      byType,
      bySource,
      byTarget,
      byNodes,
      search,
      destroy: graphStore.destroy,
    }
  }

  /**
   * Create a comprehensive graph analytics store
   */
  function createAnalyticsStore(options = {}) {
    const { instanceId = 'default' } = options
    const graphStore = createGraphStore({ instanceId, autoLoad: false })

    const analytics = derived([graphStore.nodes, graphStore.edges, graphStore.stats], ([$nodes, $edges, $stats]) => {
      // Node analytics
      const nodesByType = {}
      const nodesByProperty = {}
      $nodes.forEach((node) => {
        nodesByType[node.type] = (nodesByType[node.type] || 0) + 1

        // Analyze properties
        Object.keys(node.data || {}).forEach((prop) => {
          if (!nodesByProperty[prop]) nodesByProperty[prop] = {}
          const value = node.data[prop]
          nodesByProperty[prop][value] = (nodesByProperty[prop][value] || 0) + 1
        })
      })

      // Edge analytics
      const edgesByType = {}
      const connectivity = {}
      const hubNodes = {}

      $edges.forEach((edge) => {
        edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1

        // Track connectivity
        connectivity[edge.sourceNodeId] = (connectivity[edge.sourceNodeId] || 0) + 1
        connectivity[edge.targetNodeId] = (connectivity[edge.targetNodeId] || 0) + 1
      })

      // Find hub nodes (highly connected)
      Object.entries(connectivity).forEach(([nodeId, connections]) => {
        if (connections > 3) {
          // Threshold for hub nodes
          hubNodes[nodeId] = connections
        }
      })

      // Graph metrics
      const density = $nodes.length > 1 ? $edges.length / ($nodes.length * ($nodes.length - 1)) : 0
      const avgConnectivity = Object.values(connectivity).reduce((sum, c) => sum + c, 0) / $nodes.length || 0

      return {
        ...$stats,
        nodesByType,
        edgesByType,
        nodesByProperty,
        connectivity,
        hubNodes,
        density,
        avgConnectivity,
        totalNodes: $nodes.length,
        totalEdges: $edges.length,
      }
    })

    return {
      analytics,
      destroy: graphStore.destroy,
    }
  }

  /**
   * Create a real-time event store for graph changes
   */
  function createEventStore(options = {}) {
    const { instanceId = 'default', maxEvents = 100 } = options
    const graph = getGraphInstance(instanceId)

    const events = writable([])
    const latestEvent = writable(null)

    const addEvent = (type, data) => {
      const event = {
        id: Date.now() + Math.random(),
        type,
        data,
        timestamp: new Date().toISOString(),
      }

      events.update((eventList) => {
        const newList = [event, ...eventList]
        return newList.slice(0, maxEvents) // Keep only recent events
      })

      latestEvent.set(event)
    }

    // Listen to all graph events
    const eventHandlers = {
      'node:add': (node) => addEvent('node:add', node),
      'node:update': (update) => addEvent('node:update', update),
      'node:delete': (id) => addEvent('node:delete', { id }),
      'edge:add': (edge) => addEvent('edge:add', edge),
      'edge:update': (update) => addEvent('edge:update', update),
      'edge:delete': (id) => addEvent('edge:delete', { id }),
      'graph:clear': () => addEvent('graph:clear', {}),
      'softlinks:generated': (links) => addEvent('softlinks:generated', { count: links.length }),
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      graph.on(event, handler)
    })

    const clearEvents = () => {
      events.set([])
      latestEvent.set(null)
    }

    const destroy = () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        graph.off(event, handler)
      })
    }

    return {
      events,
      latestEvent,
      clearEvents,
      destroy,
    }
  }

  return {
    createGraphStore,
    createSearchStore,
    createNodeStores,
    createEdgeStores,
    createAnalyticsStore,
    createEventStore,
  }
}

// Export the graph instance manager for advanced use cases
export { getGraphInstance }
