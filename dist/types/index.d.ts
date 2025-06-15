export interface BaseEntity {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Node<T = any> extends BaseEntity {
    type: string;
    data: T;
}
export interface Edge<T = any> extends BaseEntity {
    sourceNodeId: string;
    targetNodeId: string;
    type: string;
    data: T;
}
export interface Graph {
    nodes: Node[];
    edges: Edge[];
}
//# sourceMappingURL=index.d.ts.map