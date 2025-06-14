import type { Node, Edge } from '../types/index.ts';
import { EventEmitter, type GraphEventMap } from './events.ts';
import type { TurtleDBSchema } from '../types/schema.ts';
import { validateSchema } from './schema-validator.ts';

export class GraphCore {
  private _nodes: Map<string, Node> = new Map();
  private _edges: Map<string, Edge> = new Map();
  private _events = new EventEmitter();
  private _schema?: TurtleDBSchema; // Store the validated schema

  constructor(schema?: TurtleDBSchema) {
    if (schema) {
      validateSchema(schema);
      this._schema = schema;
      console.log('Schema loaded and validated successfully.');
    }
  }

  // Event API
  on<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]) {
    this._events.on(event, fn);
  }
  off<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]) {
    this._events.off(event, fn);
  }

  // Node CRUD
  addNode(node: Node) {
    if (this._nodes.has(node.id)) {
      throw new Error(`Node with ID "${node.id}" already exists.`);
    }

    if (this._schema) {
      const nodeTypeConfig = this._schema.node_types[node.type];
      if (!nodeTypeConfig) {
        throw new Error(
          `Node type "${node.type}" is not defined in the schema.`,
        );
      }
      this._validateData(node.type, 'node', node.data, nodeTypeConfig.data);
    }

    this._nodes.set(node.id, node);
    this._events.emit('node:add', node);
  }

  updateNode(id: string, update: Partial<Omit<Node, 'id' | 'type'>>) {
    const node = this._nodes.get(id);
    if (node) {
      const oldNode = { ...node, data: { ...node.data } };
      // Prevent changing id or type
      const { data, ...rest } = update;
      Object.assign(node, rest);

      if (data && typeof data === 'object') {
        node.data = { ...node.data, ...data };
      }
      this._events.emit('node:update', { node, changes: update });
    }
  }
  deleteNode(id: string) {
    const node = this._nodes.get(id);
    if (node && this._nodes.delete(id)) {
      // Cascade delete edges connected to this node
      for (const [edgeId, edge] of this._edges.entries()) {
        if (edge.sourceNodeId === id || edge.targetNodeId === id) {
          this._edges.delete(edgeId);
          this._events.emit('edge:delete', edgeId);
        }
      }
      this._events.emit('node:delete', id);
    }
  }
  getNodes() {
    return Array.from(this._nodes.values());
  }

  // Edge CRUD
  addEdge(edge: Edge) {
    if (this._edges.has(edge.id)) {
      throw new Error(`Edge with ID "${edge.id}" already exists.`);
    }

    const sourceNode = this._nodes.get(edge.sourceNodeId);
    const targetNode = this._nodes.get(edge.targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found for edge.');
    }

    if (this._schema) {
      const edgeTypeConfig = this._schema.edge_types[edge.type];
      if (!edgeTypeConfig) {
        throw new Error(
          `Edge type "${edge.type}" is not defined in the schema.`,
        );
      }

      this._validateData(edge.type, 'edge', edge.data, edgeTypeConfig.data);

      // Validate source and target node types
      if (edgeTypeConfig.source.node_type !== sourceNode.type) {
        throw new Error(
          `Edge type "${edge.type}" requires source node of type "${edgeTypeConfig.source.node_type}", but got "${sourceNode.type}".`,
        );
      }
      if (edgeTypeConfig.target.node_type !== targetNode.type) {
        throw new Error(
          `Edge type "${edge.type}" requires target node of type "${edgeTypeConfig.target.node_type}", but got "${targetNode.type}".`,
        );
      }

      // Cardinality check: source -> target
      if (!edgeTypeConfig.source.multiple) {
        for (const existingEdge of this._edges.values()) {
          if (
            existingEdge.type === edge.type &&
            existingEdge.sourceNodeId === edge.sourceNodeId
          ) {
            throw new Error(
              `Cardinality error: Source node ${edge.sourceNodeId} can only have one outgoing edge of type "${edge.type}".`,
            );
          }
        }
      }
      // Cardinality check: target <- source
      if (!edgeTypeConfig.target.multiple) {
        for (const existingEdge of this._edges.values()) {
          if (
            existingEdge.type === edge.type &&
            existingEdge.targetNodeId === edge.targetNodeId
          ) {
            throw new Error(
              `Cardinality error: Target node ${edge.targetNodeId} can only have one incoming edge of type "${edge.type}".`,
            );
          }
        }
      }
    }

    this._edges.set(edge.id, edge);
    this._events.emit('edge:add', edge);
  }
  updateEdge(id: string, update: Partial<Omit<Edge, 'id' | 'type'>>) {
    const edge = this._edges.get(id);
    if (edge) {
      // Prevent changing id or type
      const { data, ...rest } = update;
      Object.assign(edge, rest);

      if (data && typeof data === 'object') {
        edge.data = { ...edge.data, ...data };
      }
      this._events.emit('edge:update', { edge, changes: update });
    }
  }
  deleteEdge(id: string) {
    if (this._edges.delete(id)) {
      this._events.emit('edge:delete', id);
    }
  }
  getEdges() {
    return Array.from(this._edges.values());
  }

  // Utility
  clear() {
    this._nodes.clear();
    this._edges.clear();
    this._events.emit('graph:clear');
  }

  // Schema Access
  getSchema(): TurtleDBSchema | undefined {
    return this._schema;
  }

  private _validateData(
    entityType: string,
    entityClass: 'node' | 'edge',
    data: any,
    schemaData: any,
  ) {
    if (typeof schemaData !== 'object' || schemaData === null) return; // No properties to validate

    const schemaKeys = Object.keys(schemaData);
    const dataKeys = Object.keys(data);

    // Check for missing properties
    for (const key of schemaKeys) {
      if (!data.hasOwnProperty(key)) {
        throw new Error(
          `Missing required property '${key}' for ${entityClass} type '${entityType}'.`,
        );
      }
      // Check for type mismatch
      if (typeof data[key] !== schemaData[key]) {
        throw new Error(
          `Invalid type for property '${key}' on ${entityClass} type '${entityType}'. Expected ${
            schemaData[key]
          }, got ${typeof data[key]}.`,
        );
      }
    }

    // Check for extra properties
    for (const key of dataKeys) {
      if (!schemaData.hasOwnProperty(key)) {
        throw new Error(
          `Unknown property '${key}' found on ${entityClass} type '${entityType}'.`,
        );
      }
    }
  }

  // --- Factories ---

  private _generateId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  public createNode<T = any>(type: string, data: T): Node<T> {
    const now = new Date().toISOString();
    const node: Node<T> = {
      id: this._generateId(),
      type,
      data,
      createdAt: now,
      updatedAt: now,
    };
    this.addNode(node);
    return node;
  }

  public createEdge<T = any>(
    type: string,
    sourceNodeId: string,
    targetNodeId: string,
    data: T,
  ): Edge<T> {
    const now = new Date().toISOString();
    const edge: Edge<T> = {
      id: this._generateId(),
      type,
      sourceNodeId,
      targetNodeId,
      data,
      createdAt: now,
      updatedAt: now,
    };
    this.addEdge(edge);
    return edge;
  }
}
