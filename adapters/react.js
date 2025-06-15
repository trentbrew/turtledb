/**
 * TurtleDB React Adapter
 * Reactive hooks and components for TurtleDB integration
 *
 * This module exports factory functions that create React hooks.
 * The consuming application provides React hooks as parameters.
 *
 * Usage:
 * import React from 'react'
 * import { createTurtleDBHooks } from 'turtledb/adapters/react'
 *
 * const { useGraph, useSearch, useNodes } = createTurtleDBHooks(React)
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
 * Create TurtleDB React hooks with provided React hooks
 * @param {Object} React - React object with hooks
 * @returns {Object} TurtleDB React hooks
 */
export function createTurtleDBHooks(React) {
  const { useState, useEffect, useCallback, useMemo, useRef } = React

  /**
   * Main hook for TurtleDB integration
   */
  function useGraph(options = {}) {
    const { instanceId = 'default', schema: graphSchema = null, graphOptions = {}, autoLoad = true } = options

    const graph = useMemo(
      () => getGraphInstance(instanceId, graphSchema, graphOptions),
      [instanceId, graphSchema, graphOptions],
    )

    const [nodes, setNodes] = useState(() => graph.getNodes())
    const [edges, setEdges] = useState(() => graph.getEdges())
    const [softLinks, setSoftLinks] = useState(() => graph.softLinks)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    // Track if we've loaded data
    const hasLoaded = useRef(false)

    // Update state when graph changes
    useEffect(() => {
      const updateNodes = () => setNodes(graph.getNodes())
      const updateEdges = () => setEdges(graph.getEdges())
      const updateSoftLinks = () => setSoftLinks([...graph.softLinks])
      const handleError = (err) => setError(err)

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

      return () => {
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
    }, [graph])

    // Auto-load on mount
    useEffect(() => {
      if (autoLoad && !hasLoaded.current) {
        hasLoaded.current = true
        loadGraph()
      }
    }, [autoLoad])

    // CRUD operations with error handling
    const createNode = useCallback(
      async (type, data) => {
        try {
          setError(null)
          setIsLoading(true)
          const node = await graph.createNode(type, data)
          return node
        } catch (err) {
          setError(err)
          throw err
        } finally {
          setIsLoading(false)
        }
      },
      [graph],
    )

    const updateNode = useCallback(
      (id, update) => {
        try {
          setError(null)
          graph.updateNode(id, update)
        } catch (err) {
          setError(err)
          throw err
        }
      },
      [graph],
    )

    const deleteNode = useCallback(
      (id) => {
        try {
          setError(null)
          graph.deleteNode(id)
        } catch (err) {
          setError(err)
          throw err
        }
      },
      [graph],
    )

    const createEdge = useCallback(
      (type, sourceId, targetId, data = {}) => {
        try {
          setError(null)
          const edge = graph.createEdge(type, sourceId, targetId, data)
          return edge
        } catch (err) {
          setError(err)
          throw err
        }
      },
      [graph],
    )

    const updateEdge = useCallback(
      (id, update) => {
        try {
          setError(null)
          graph.updateEdge(id, update)
        } catch (err) {
          setError(err)
          throw err
        }
      },
      [graph],
    )

    const deleteEdge = useCallback(
      (id) => {
        try {
          setError(null)
          graph.deleteEdge(id)
        } catch (err) {
          setError(err)
          throw err
        }
      },
      [graph],
    )

    const clearGraph = useCallback(() => {
      try {
        setError(null)
        graph.clear()
      } catch (err) {
        setError(err)
        throw err
      }
    }, [graph])

    const saveGraph = useCallback(async () => {
      try {
        setError(null)
        setIsLoading(true)
        await graph.save()
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    }, [graph])

    const loadGraph = useCallback(async () => {
      try {
        setError(null)
        setIsLoading(true)
        await graph.load()
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    }, [graph])

    const generateSoftLinks = useCallback(async () => {
      try {
        setError(null)
        setIsLoading(true)
        await graph.generateSoftLinks()
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    }, [graph])

    // Computed values
    const stats = useMemo(() => graph.getStats(), [nodes, edges])
    const currentSchema = useMemo(() => graph.getSchema(), [graph])

    return {
      // State
      nodes,
      edges,
      softLinks,
      isLoading,
      error,
      stats,
      schema: currentSchema,

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
   * Hook for semantic search functionality
   */
  function useSearch(options = {}) {
    const { instanceId = 'default', debounce = true, debounceMs = 300 } = options

    const graph = useMemo(() => getGraphInstance(instanceId), [instanceId])
    const [results, setResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState(null)
    const debounceTimer = useRef(null)

    const search = useCallback(
      async (query, limit = 10) => {
        if (!query?.trim()) {
          setResults([])
          return []
        }

        const performSearch = async () => {
          try {
            setSearchError(null)
            setIsSearching(true)
            const searchResults = await graph.searchNodes(query, limit)
            setResults(searchResults)
            return searchResults
          } catch (err) {
            setSearchError(err)
            setResults([])
            throw err
          } finally {
            setIsSearching(false)
          }
        }

        if (debounce) {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
          }
          debounceTimer.current = setTimeout(performSearch, debounceMs)
        } else {
          return performSearch()
        }
      },
      [graph, debounce, debounceMs],
    )

    const clearResults = useCallback(() => {
      setResults([])
      setSearchError(null)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }, [])

    useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
      }
    }, [])

    return {
      search,
      results,
      isSearching,
      searchError,
      clearResults,
    }
  }

  /**
   * Hook for filtering and querying nodes
   */
  function useNodes(options = {}) {
    const { instanceId = 'default' } = options
    const { nodes } = useGraph({ instanceId, autoLoad: false })

    const byType = useCallback(
      (type) => {
        return nodes.filter((node) => node.type === type)
      },
      [nodes],
    )

    const byId = useCallback(
      (id) => {
        return nodes.find((node) => node.id === id)
      },
      [nodes],
    )

    const byProperty = useCallback(
      (property, value) => {
        return nodes.filter((node) => node.data?.[property] === value)
      },
      [nodes],
    )

    const search = useCallback(
      (predicate) => {
        return nodes.filter(predicate)
      },
      [nodes],
    )

    return {
      all: nodes,
      byType,
      byId,
      byProperty,
      search,
    }
  }

  /**
   * Hook for filtering and querying edges
   */
  function useEdges(options = {}) {
    const { instanceId = 'default' } = options
    const { edges } = useGraph({ instanceId, autoLoad: false })

    const byType = useCallback(
      (type) => {
        return edges.filter((edge) => edge.type === type)
      },
      [edges],
    )

    const bySource = useCallback(
      (sourceId) => {
        return edges.filter((edge) => edge.sourceNodeId === sourceId)
      },
      [edges],
    )

    const byTarget = useCallback(
      (targetId) => {
        return edges.filter((edge) => edge.targetNodeId === targetId)
      },
      [edges],
    )

    const byNodes = useCallback(
      (sourceId, targetId) => {
        return edges.filter((edge) => edge.sourceNodeId === sourceId && edge.targetNodeId === targetId)
      },
      [edges],
    )

    const search = useCallback(
      (predicate) => {
        return edges.filter(predicate)
      },
      [edges],
    )

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
   * Hook for graph statistics and analytics
   */
  function useGraphStats(options = {}) {
    const { instanceId = 'default' } = options
    const { stats, nodes, edges } = useGraph({ instanceId, autoLoad: false })

    const nodesByType = useMemo(() => {
      const counts = {}
      nodes.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1
      })
      return counts
    }, [nodes])

    const edgesByType = useMemo(() => {
      const counts = {}
      edges.forEach((edge) => {
        counts[edge.type] = (counts[edge.type] || 0) + 1
      })
      return counts
    }, [edges])

    const connectivity = useMemo(() => {
      const nodeConnections = {}
      edges.forEach((edge) => {
        nodeConnections[edge.sourceNodeId] = (nodeConnections[edge.sourceNodeId] || 0) + 1
        nodeConnections[edge.targetNodeId] = (nodeConnections[edge.targetNodeId] || 0) + 1
      })
      return nodeConnections
    }, [edges])

    return {
      ...stats,
      nodesByType,
      edgesByType,
      connectivity,
    }
  }

  return {
    useGraph,
    useSearch,
    useNodes,
    useEdges,
    useGraphStats,
  }
}

// Export the graph instance manager for advanced use cases
export { getGraphInstance }
