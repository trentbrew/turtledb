// Vue adapter for the framework-agnostic graph core
// This file will provide a useGraph composable or Pinia store that wraps the core logic
// and exposes reactive state for Vue components.
import { ref, computed } from 'vue';
import { GraphCore } from '../core/graph.ts';
// Singleton instance of the core graph
const graphCore = new GraphCore();
const nodesRef = ref(graphCore.getNodes());
const edgesRef = ref(graphCore.getEdges());
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
function updateNodes(_) {
    nodesRef.value = graphCore.getNodes();
}
function updateEdges(_) {
    edgesRef.value = graphCore.getEdges();
}
export function useGraph() {
    // Clean up listeners if needed (for SSR or multiple mounts)
    // (In this singleton pattern, listeners persist for app lifetime)
    // Optionally, expose computed selectors for node/edge types
    function nodesOfType(type) {
        return computed(() => nodesRef.value.filter((n) => n.type === type));
    }
    function edgesOfType(type) {
        return computed(() => edgesRef.value.filter((e) => e.type === type));
    }
    // CRUD methods
    return {
        nodes: nodesRef,
        edges: edgesRef,
        nodesOfType,
        edgesOfType,
        addNode: (node) => graphCore.addNode(node),
        updateNode: (id, update) => graphCore.updateNode(id, update),
        deleteNode: (id) => graphCore.deleteNode(id),
        addEdge: (edge) => graphCore.addEdge(edge),
        updateEdge: (id, update) => graphCore.updateEdge(id, update),
        deleteEdge: (id) => graphCore.deleteEdge(id),
        clear: () => graphCore.clear(),
    };
}
//# sourceMappingURL=vue.js.map