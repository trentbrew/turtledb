/**
 * TurtleDB GraphCore - Node.js version
 * Framework-agnostic graph data layer with real embeddings
 */

import { EventEmitter } from './events-node.js'
import { validateSchema } from './schema-validator-node.js'
import { createInstance } from './storage-node.js'
import { getEmbedding, cosineSimilarity } from './embeddings-node.js'

const turtledb = createInstance({ name: 'turtledb' })

export class GraphCore {
  constructor(schema, opts = {}) {
    this._nodes = new Map()
    this._edges = new Map()
    this._events = new EventEmitter()
    this._schema = undefined
    this.softLinks = []

    if (schema) {
      validateSchema(schema)
      this._schema = schema
      console.log('Schema loaded and validated successfully')
    }

    this._scanOnLoad = opts.scanOnLoad ?? false
    this._getEmbedding = opts.embeddingFn || getEmbedding
  }

  // Event API
  on(event, fn) {
    this._events.on(event, fn)
  }

  off(event, fn) {
    this._events.off(event, fn)
  }

  // Node CRUD
  addNode(node) {
    if (this._nodes.has(node.id)) {
      throw new Error(`Node with ID "${node.id}" already exists.`)
    }

    if (this._schema) {
      const nodeTypeConfig = this._schema.node_types[node.type]
      if (!nodeTypeConfig) {
        throw new Error(`Node type "${node.type}" is not defined in the schema.`)
      }
      this._validateData(node.type, 'node', node.data, nodeTypeConfig.data)
    }

    this._nodes.set(node.id, node)
    this._events.emit('node:add', node)
  }

  updateNode(id, update) {
    const node = this._nodes.get(id)
    if (node) {
      const oldNode = { ...node, data: { ...node.data } }
      // Prevent changing id or type
      const { data, ...rest } = update
      Object.assign(node, rest)

      if (data && typeof data === 'object') {
        node.data = { ...node.data, ...data }
      }
      this._events.emit('node:update', { node, changes: update })
    }
  }

  deleteNode(id) {
    const node = this._nodes.get(id)
    if (node && this._nodes.delete(id)) {
      // Cascade delete edges connected to this node
      for (const [edgeId, edge] of this._edges.entries()) {
        if (edge.sourceNodeId === id || edge.targetNodeId === id) {
          this._edges.delete(edgeId)
          this._events.emit('edge:delete', edgeId)
        }
      }
      this._events.emit('node:delete', id)
    }
  }

  getNodes() {
    return Array.from(this._nodes.values())
  }

  // Edge CRUD
  addEdge(edge) {
    if (this._edges.has(edge.id)) {
      throw new Error(`Edge with ID "${edge.id}" already exists.`)
    }

    const sourceNode = this._nodes.get(edge.sourceNodeId)
    const targetNode = this._nodes.get(edge.targetNodeId)

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found for edge.')
    }

    if (this._schema) {
      const edgeTypeConfig = this._schema.edge_types[edge.type]
      if (!edgeTypeConfig) {
        throw new Error(`Edge type "${edge.type}" is not defined in the schema.`)
      }

      this._validateData(edge.type, 'edge', edge.data, edgeTypeConfig.data)

      // Validate source and target node types
      if (edgeTypeConfig.source.node_type !== sourceNode.type) {
        throw new Error(
          `Edge type "${edge.type}" requires source node of type "${edgeTypeConfig.source.node_type}", but got "${sourceNode.type}".`,
        )
      }
      if (edgeTypeConfig.target.node_type !== targetNode.type) {
        throw new Error(
          `Edge type "${edge.type}" requires target node of type "${edgeTypeConfig.target.node_type}", but got "${targetNode.type}".`,
        )
      }

      // Cardinality check: source -> target
      if (!edgeTypeConfig.source.multiple) {
        for (const existingEdge of this._edges.values()) {
          if (existingEdge.type === edge.type && existingEdge.sourceNodeId === edge.sourceNodeId) {
            throw new Error(
              `Cardinality error: Source node ${edge.sourceNodeId} can only have one outgoing edge of type "${edge.type}".`,
            )
          }
        }
      }
      // Cardinality check: target <- source
      if (!edgeTypeConfig.target.multiple) {
        for (const existingEdge of this._edges.values()) {
          if (existingEdge.type === edge.type && existingEdge.targetNodeId === edge.targetNodeId) {
            throw new Error(
              `Cardinality error: Target node ${edge.targetNodeId} can only have one incoming edge of type "${edge.type}".`,
            )
          }
        }
      }
    }

    this._edges.set(edge.id, edge)
    this._events.emit('edge:add', edge)
  }

  updateEdge(id, update) {
    const edge = this._edges.get(id)
    if (edge) {
      // Prevent changing id or type
      const { data, ...rest } = update
      Object.assign(edge, rest)

      if (data && typeof data === 'object') {
        edge.data = { ...edge.data, ...data }
      }
      this._events.emit('edge:update', { edge, changes: update })
    }
  }

  deleteEdge(id) {
    const edge = this._edges.get(id)
    if (edge && this._edges.delete(id)) {
      this._events.emit('edge:delete', id)
    }
  }

  getEdges() {
    return Array.from(this._edges.values())
  }

  clear() {
    this._nodes.clear()
    this._edges.clear()
    this.softLinks = []
    this._events.emit('graph:clear')
  }

  getSchema() {
    return this._schema
  }

  _validateData(entityType, entityClass, data, schemaData) {
    if (!schemaData) return // No schema data to validate against

    for (const [propName, propConfig] of Object.entries(schemaData)) {
      const value = data?.[propName]

      // Check required properties
      if (propConfig.required && (value === undefined || value === null)) {
        throw new Error(`${entityClass} type "${entityType}" requires property "${propName}".`)
      }

      // Skip validation if value is undefined/null and not required
      if (value === undefined || value === null) continue

      // Type validation
      const expectedType = propConfig.type
      const actualType = typeof value

      if (expectedType === 'array' && !Array.isArray(value)) {
        throw new Error(`${entityClass} type "${entityType}" property "${propName}" must be an array.`)
      } else if (expectedType !== 'array' && actualType !== expectedType) {
        throw new Error(
          `${entityClass} type "${entityType}" property "${propName}" must be of type "${expectedType}", got "${actualType}".`,
        )
      }

      // Enum validation
      if (propConfig.enum && !propConfig.enum.includes(value)) {
        throw new Error(
          `${entityClass} type "${entityType}" property "${propName}" must be one of: ${propConfig.enum.join(', ')}.`,
        )
      }
    }
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  async createNode(type, data) {
    const id = this._generateId()

    // Generate embedding for the node
    const embeddingText = this._autoDescription(data)
    const embedding = await this._getEmbedding(embeddingText)

    const node = {
      id,
      type,
      data: {
        ...data,
        _autoTags: this._autoTags(data),
        _autoDescription: embeddingText,
      },
      embedding,
    }

    this.addNode(node)
    return node
  }

  createEdge(type, sourceNodeId, targetNodeId, data) {
    const id = this._generateId()
    const edge = {
      id,
      type,
      sourceNodeId,
      targetNodeId,
      data: {
        ...data,
        _autoTags: this._autoTags(data),
        _autoDescription: this._autoDescription(data),
      },
    }

    this.addEdge(edge)
    return edge
  }

  async save() {
    const graphData = {
      nodes: Array.from(this._nodes.values()),
      edges: Array.from(this._edges.values()),
      softLinks: this.softLinks,
    }
    await turtledb.setItem('graph', graphData)
  }

  async load() {
    const graphData = await turtledb.getItem('graph')
    if (graphData) {
      this.clear()

      // Load nodes
      for (const node of graphData.nodes || []) {
        this._nodes.set(node.id, node)
      }

      // Load edges
      for (const edge of graphData.edges || []) {
        this._edges.set(edge.id, edge)
      }

      // Load soft links
      this.softLinks = graphData.softLinks || []

      if (this._scanOnLoad) {
        await this.scan()
      }
    }
  }

  async scan() {
    console.log('🔍 Scanning graph for enrichment opportunities...')

    const nodes = this.getNodes()
    let enriched = 0

    for (const node of nodes) {
      let updated = false

      // Auto-generate tags if missing
      if (!node.data._autoTags) {
        node.data._autoTags = this._autoTags(node.data)
        updated = true
      }

      // Auto-generate description if missing
      if (!node.data._autoDescription) {
        node.data._autoDescription = this._autoDescription(node.data)
        updated = true
      }

      // Generate embedding if missing
      if (!node.embedding && node.data._autoDescription) {
        try {
          node.embedding = await this._getEmbedding(node.data._autoDescription)
          updated = true
        } catch (error) {
          console.warn(`Failed to generate embedding for node ${node.id}:`, error)
        }
      }

      if (updated) {
        enriched++
        this._events.emit('node:update', { node, changes: {} })
      }
    }

    console.log(`✅ Enriched ${enriched} nodes`)

    // Generate soft links based on embeddings
    await this.generateSoftLinks()
  }

  _autoTags(data) {
    if (!data || typeof data !== 'object') return []

    const tags = []
    const text = JSON.stringify(data).toLowerCase()

    // Simple keyword-based tagging
    const keywords = {
      tech: ['software', 'programming', 'code', 'algorithm', 'computer'],
      medical: ['doctor', 'patient', 'medicine', 'health', 'treatment'],
      business: ['company', 'revenue', 'profit', 'customer', 'market'],
      education: ['student', 'teacher', 'school', 'university', 'learn'],
    }

    for (const [tag, words] of Object.entries(keywords)) {
      if (words.some((word) => text.includes(word))) {
        tags.push(tag)
      }
    }

    return tags
  }

  _autoDescription(data) {
    if (!data || typeof data !== 'object') return ''

    // Create a meaningful description from the data
    const values = Object.values(data)
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v))
      .join(' ')

    return values.substring(0, 500) // Limit length
  }

  async generateSoftLinks() {
    console.log('🔗 Generating soft links based on embeddings...')

    const nodes = this.getNodes().filter((node) => node.embedding)
    const threshold = 0.7 // Similarity threshold for soft links
    let linksGenerated = 0

    // Clear existing soft links
    this.softLinks = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]

        try {
          const similarity = cosineSimilarity(nodeA.embedding, nodeB.embedding)

          if (similarity > threshold) {
            this.softLinks.push({
              sourceId: nodeA.id,
              targetId: nodeB.id,
              type: 'soft',
              reason: 'embedding_similarity',
              score: similarity,
            })
            linksGenerated++
          }
        } catch (error) {
          console.warn(`Failed to calculate similarity between ${nodeA.id} and ${nodeB.id}:`, error)
        }
      }
    }

    console.log(`✅ Generated ${linksGenerated} soft links`)
  }

  // Search functionality
  async searchNodes(query, limit = 10) {
    if (!query) return []

    try {
      const queryEmbedding = await this._getEmbedding(query)
      const nodes = this.getNodes().filter((node) => node.embedding)

      const results = nodes
        .map((node) => ({
          node,
          similarity: cosineSimilarity(queryEmbedding, node.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      return results
    } catch (error) {
      console.warn('Search failed:', error)
      return []
    }
  }

  // Get statistics
  getStats() {
    return {
      nodes: this._nodes.size,
      edges: this._edges.size,
      softLinks: this.softLinks.length,
      nodeTypes: new Set(this.getNodes().map((n) => n.type)).size,
      edgeTypes: new Set(this.getEdges().map((e) => e.type)).size,
    }
  }
}
