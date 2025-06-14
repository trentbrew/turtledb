import type { Edge, Node } from "../types/index.ts";
import { EventEmitter, type GraphEventMap } from "./events.ts";
import type { TurtleDBSchema } from "../types/schema.ts";
import { validateSchema } from "./schema-validator.ts";
import localforage from "localforage";
import { getEmbedding } from "./embeddings.ts";

const turtledb = localforage.createInstance({ name: "turtledb" });

// Type for a soft (generative) link
export type SoftLink = {
  sourceId: string;
  targetId: string;
  type: "soft";
  reason: "embedding_similarity" | "property_reference";
  score?: number;
  property?: string;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export class GraphCore {
  private _nodes: Map<string, Node> = new Map();
  private _edges: Map<string, Edge> = new Map();
  private _events = new EventEmitter();
  private _schema?: TurtleDBSchema; // Store the validated schema
  private _scanOnLoad: boolean;
  private _getEmbedding: (value: string) => Promise<number[]>;
  public softLinks: SoftLink[] = [];

  /**
   * @param schema - The TurtleDB schema
   * @param opts.scanOnLoad - If true, automatically scan/enrich nodes/edges after load (default: false)
   * @param opts.embeddingFn - A function to generate embeddings. Defaults to the built-in getEmbedding.
   */
  constructor(
    schema?: TurtleDBSchema,
    opts?: {
      scanOnLoad?: boolean;
      embeddingFn?: (value: string) => Promise<number[]>;
    },
  ) {
    if (schema) {
      validateSchema(schema);
      this._schema = schema;
      console.log("Schema loaded and validated successfully.");
    }
    this._scanOnLoad = opts?.scanOnLoad ?? false;
    this._getEmbedding = opts?.embeddingFn || getEmbedding;
  }

  // Event API
  on<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]) {
    this._events.on(event, fn);
  }
  off<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]) {
    this._events.off(event, fn);
  }

  // Node CRUD
  addNode(node: Node & { embedding?: number[] }) {
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
      this._validateData(node.type, "node", node.data, nodeTypeConfig.data);
    }

    this._nodes.set(node.id, node);
    this._events.emit("node:add", node);
  }

  updateNode(id: string, update: Partial<Omit<Node, "id" | "type">>) {
    const node = this._nodes.get(id);
    if (node) {
      const oldNode = { ...node, data: { ...node.data } };
      // Prevent changing id or type
      const { data, ...rest } = update;
      Object.assign(node, rest);

      if (data && typeof data === "object") {
        node.data = { ...node.data, ...data };
      }
      this._events.emit("node:update", { node, changes: update });
    }
  }
  deleteNode(id: string) {
    const node = this._nodes.get(id);
    if (node && this._nodes.delete(id)) {
      // Cascade delete edges connected to this node
      for (const [edgeId, edge] of this._edges.entries()) {
        if (edge.sourceNodeId === id || edge.targetNodeId === id) {
          this._edges.delete(edgeId);
          this._events.emit("edge:delete", edgeId);
        }
      }
      this._events.emit("node:delete", id);
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
      throw new Error("Source or target node not found for edge.");
    }

    if (this._schema) {
      const edgeTypeConfig = this._schema.edge_types[edge.type];
      if (!edgeTypeConfig) {
        throw new Error(
          `Edge type "${edge.type}" is not defined in the schema.`,
        );
      }

      this._validateData(edge.type, "edge", edge.data, edgeTypeConfig.data);

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
    this._events.emit("edge:add", edge);
  }
  updateEdge(id: string, update: Partial<Omit<Edge, "id" | "type">>) {
    const edge = this._edges.get(id);
    if (edge) {
      // Prevent changing id or type
      const { data, ...rest } = update;
      Object.assign(edge, rest);

      if (data && typeof data === "object") {
        edge.data = { ...edge.data, ...data };
      }
      this._events.emit("edge:update", { edge, changes: update });
    }
  }
  deleteEdge(id: string) {
    if (this._edges.delete(id)) {
      this._events.emit("edge:delete", id);
    }
  }
  getEdges() {
    return Array.from(this._edges.values());
  }

  // Utility
  clear() {
    this._nodes.clear();
    this._edges.clear();
    this._events.emit("graph:clear");
  }

  // Schema Access
  getSchema(): TurtleDBSchema | undefined {
    return this._schema;
  }

  private _validateData(
    entityType: string,
    entityClass: "node" | "edge",
    data: any,
    schemaData: any,
  ) {
    if (typeof schemaData !== "object" || schemaData === null) return; // No properties to validate

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
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  public async createNode<T = any>(
    type: string,
    data: T,
  ): Promise<Node<T> & { embedding: number[] }> {
    const now = new Date().toISOString();
    const node: Node<T> = {
      id: this._generateId(),
      type,
      data,
      createdAt: now,
      updatedAt: now,
    };
    // Generate embedding from stringified data
    const embedding = await this._getEmbedding(JSON.stringify(data));
    (node as any).embedding = embedding;
    this.addNode(node as Node<T> & { embedding: number[] });
    return node as Node<T> & { embedding: number[] };
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

  /**
   * Persist all nodes and edges to IndexedDB via localforage (turtledb instance)
   */
  async save() {
    await turtledb.setItem("nodes", this.getNodes());
    await turtledb.setItem("edges", this.getEdges());
  }

  /**
   * Load nodes and edges from IndexedDB via localforage (turtledb instance)
   * If scanOnLoad is true, also scan/enrich after loading.
   */
  async load() {
    let nodes: Node[] | null = await turtledb.getItem("nodes");
    let edges: Edge[] | null = await turtledb.getItem("edges");
    if (!Array.isArray(nodes)) nodes = [];
    if (!Array.isArray(edges)) edges = [];
    this.clear();
    for (const node of nodes) {
      this._nodes.set(node.id, node);
    }
    for (const edge of edges) {
      this._edges.set(edge.id, edge);
    }
    if (this._scanOnLoad) {
      await this.scan();
    }
  }

  /**
   * Scan all nodes and edges, add embeddings to nodes missing them,
   * and enrich nodes/edges with tags and description if missing.
   */
  async scan() {
    // Enrich nodes
    for (const node of this.getNodes()) {
      let changed = false;
      if (!("embedding" in node)) {
        (node as any).embedding = await this._getEmbedding(
          JSON.stringify(node.data),
        );
        changed = true;
      }
      if (!("tags" in node)) {
        (node as any).tags = this._autoTags(node.data);
        changed = true;
      }
      if (!("description" in node)) {
        (node as any).description = this._autoDescription(node.data);
        changed = true;
      }
      if (changed) {
        this._nodes.set(node.id, node);
      }
    }
    // Enrich edges
    for (const edge of this.getEdges()) {
      let changed = false;
      if (!("tags" in edge)) {
        (edge as any).tags = this._autoTags(edge.data);
        changed = true;
      }
      if (!("description" in edge)) {
        (edge as any).description = this._autoDescription(edge.data);
        changed = true;
      }
      if (changed) {
        this._edges.set(edge.id, edge);
      }
    }
    // Generate soft links after enrichment
    await this.generateSoftLinks();
  }

  /**
   * Simple tag generator: returns array of string keys from data
   */
  private _autoTags(data: unknown): string[] {
    return Object.keys(data || {});
  }

  /**
   * Simple description generator: returns a stringified summary of data
   */
  private _autoDescription(data: unknown): string {
    return typeof data === "object" ? JSON.stringify(data) : String(data);
  }

  /**
   * Generate soft (generative) links between nodes based on embeddings and property references.
   * Soft links are not persisted and are kept in-memory only.
   */
  async generateSoftLinks() {
    this.softLinks = [];
    const nodes = this.getNodes();
    // 1. Embedding similarity (cosine > 0.9)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (!("embedding" in a)) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (!("embedding" in b)) continue;
        const sim = cosineSimilarity(
          (a as any).embedding,
          (b as any).embedding,
        );
        if (sim > 0.9) {
          this.softLinks.push({
            sourceId: a.id,
            targetId: b.id,
            type: "soft",
            reason: "embedding_similarity",
            score: sim,
          });
        }
      }
    }
    // 2. Property reference (if a property matches another node's id)
    for (const node of nodes) {
      for (const [key, value] of Object.entries(node.data || {})) {
        if (typeof value === "string") {
          const target = nodes.find((n) => n.id === value);
          if (target) {
            this.softLinks.push({
              sourceId: node.id,
              targetId: target.id,
              type: "soft",
              reason: "property_reference",
              property: key,
            });
          }
        }
      }
    }
  }
}
