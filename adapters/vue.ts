// Vue adapter for the framework-agnostic graph core
// This file will provide a useGraph composable or Pinia store that wraps the core logic
// and exposes reactive state for Vue components.

import { ref, computed, onUnmounted } from 'vue';
import { GraphCore } from '../core/graph.ts';
import type { Node, Edge } from '../types/index.ts';

// Singleton instance of the core graph
const graphCore = new GraphCore();

const nodesRef = ref<Node[]>(graphCore.getNodes());
const edgesRef = ref<Edge[]>(graphCore.getEdges());

// Event handlers to keep refs in sync with core
defaultEventHandlers();

function defaultEventHandlers() {
  graphCore.on('node:add', updateNodes);
  graphCore.on('node:update', updateNodes);
  graphCore.on('node:delete', updateNodes);
  graphCore.on('edge:add', updateEdges);
  graphCore.on('edge:update', updateEdges);
  graphCore.on('edge:delete', updateEdges);
  graphCore.on('graph:clear', () => {
    updateNodes();
    updateEdges();
  });
}

function updateNodes(_?: Node) {
  nodesRef.value = graphCore.getNodes();
}
function updateEdges(_?: Edge) {
  edgesRef.value = graphCore.getEdges();
}

export function useGraph() {
  // Clean up listeners if needed (for SSR or multiple mounts)
  // (In this singleton pattern, listeners persist for app lifetime)

  // Optionally, expose computed selectors for node/edge types
  function nodesOfType(type: string) {
    return computed(() => nodesRef.value.filter((n: Node) => n.type === type));
  }
  function edgesOfType(type: string) {
    return computed(() => edgesRef.value.filter((e: Edge) => e.type === type));
  }

  // CRUD methods
  return {
    nodes: nodesRef,
    edges: edgesRef,
    nodesOfType,
    edgesOfType,
    addNode: (node: Node) => graphCore.addNode(node),
    updateNode: (id: string, update: Partial<Node>) =>
      graphCore.updateNode(id, update),
    deleteNode: (id: string) => graphCore.deleteNode(id),
    addEdge: (edge: Edge) => graphCore.addEdge(edge),
    updateEdge: (id: string, update: Partial<Edge>) =>
      graphCore.updateEdge(id, update),
    deleteEdge: (id: string) => graphCore.deleteEdge(id),
    clear: () => graphCore.clear(),
  };
}
