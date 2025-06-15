import type { Edge, Node } from "../types/index.ts";
import { type GraphEventMap } from "./events.ts";
import type { TurtleDBSchema } from "../types/schema.ts";
export type SoftLink = {
    sourceId: string;
    targetId: string;
    type: "soft";
    reason: "embedding_similarity" | "property_reference";
    score?: number;
    property?: string;
};
export declare class GraphCore {
    private _nodes;
    private _edges;
    private _events;
    private _schema?;
    private _scanOnLoad;
    private _getEmbedding;
    softLinks: SoftLink[];
    /**
     * @param schema - The TurtleDB schema
     * @param opts.scanOnLoad - If true, automatically scan/enrich nodes/edges after load (default: false)
     * @param opts.embeddingFn - A function to generate embeddings. Defaults to the built-in getEmbedding.
     */
    constructor(schema?: TurtleDBSchema, opts?: {
        scanOnLoad?: boolean;
        embeddingFn?: (value: string) => Promise<number[]>;
    });
    on<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]): void;
    off<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]): void;
    addNode(node: Node & {
        embedding?: number[];
    }): void;
    updateNode(id: string, update: Partial<Omit<Node, "id" | "type">>): void;
    deleteNode(id: string): void;
    getNodes(): Node<any>[];
    addEdge(edge: Edge): void;
    updateEdge(id: string, update: Partial<Omit<Edge, "id" | "type">>): void;
    deleteEdge(id: string): void;
    getEdges(): Edge<any>[];
    clear(): void;
    getSchema(): TurtleDBSchema | undefined;
    private _validateData;
    private _generateId;
    createNode<T = any>(type: string, data: T): Promise<Node<T> & {
        embedding: number[];
    }>;
    createEdge<T = any>(type: string, sourceNodeId: string, targetNodeId: string, data: T): Edge<T>;
    /**
     * Persist all nodes and edges to IndexedDB via localforage (turtledb instance)
     */
    save(): Promise<void>;
    /**
     * Load nodes and edges from IndexedDB via localforage (turtledb instance)
     * If scanOnLoad is true, also scan/enrich after loading.
     */
    load(): Promise<void>;
    /**
     * Scan all nodes and edges, add embeddings to nodes missing them,
     * and enrich nodes/edges with tags and description if missing.
     */
    scan(): Promise<void>;
    /**
     * Simple tag generator: returns array of string keys from data
     */
    private _autoTags;
    /**
     * Simple description generator: returns a stringified summary of data
     */
    private _autoDescription;
    /**
     * Generate soft (generative) links between nodes based on embeddings and property references.
     * Soft links are not persisted and are kept in-memory only.
     */
    generateSoftLinks(): Promise<void>;
}
//# sourceMappingURL=graph.d.ts.map