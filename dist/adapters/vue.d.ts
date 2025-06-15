import type { Node, Edge } from '../types/index.ts';
export declare function useGraph(): {
    nodes: any;
    edges: any;
    nodesOfType: (type: string) => any;
    edgesOfType: (type: string) => any;
    addNode: (node: Node) => void;
    updateNode: (id: string, update: Partial<Node>) => void;
    deleteNode: (id: string) => void;
    addEdge: (edge: Edge) => void;
    updateEdge: (id: string, update: Partial<Edge>) => void;
    deleteEdge: (id: string) => void;
    clear: () => void;
};
//# sourceMappingURL=vue.d.ts.map