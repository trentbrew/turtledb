import type { Node, Edge } from '../types/index.ts';

export const sampleNodes: Node[] = [
  {
    id: '1',
    type: 'person',
    data: { name: 'Alice' },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: 'person',
    data: { name: 'Bob' },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

export const sampleEdges: Edge[] = [
  {
    id: 'e1',
    type: 'friend',
    sourceNodeId: '1',
    targetNodeId: '2',
    data: { since: 2023 },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];
