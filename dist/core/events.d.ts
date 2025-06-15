import type { Node, Edge } from '../types/index.ts';
export type GraphEvent = 'node:add' | 'node:update' | 'node:delete' | 'edge:add' | 'edge:update' | 'edge:delete' | 'graph:clear';
export interface GraphEventMap {
    'node:add': (node: Node) => void;
    'node:update': (payload: {
        node: Node;
        changes: Partial<Omit<Node, 'id' | 'type'>>;
    }) => void;
    'node:delete': (nodeId: string) => void;
    'edge:add': (edge: Edge) => void;
    'edge:update': (payload: {
        edge: Edge;
        changes: Partial<Omit<Edge, 'id' | 'type'>>;
    }) => void;
    'edge:delete': (edgeId: string) => void;
    'graph:clear': () => void;
}
export declare class EventEmitter {
    private listeners;
    on<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]): void;
    off<K extends keyof GraphEventMap>(event: K, fn: GraphEventMap[K]): void;
    emit<K extends keyof GraphEventMap>(event: K, ...args: Parameters<GraphEventMap[K]>): void;
}
//# sourceMappingURL=events.d.ts.map