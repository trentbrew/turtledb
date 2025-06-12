import { GraphCore } from '../core/graph'
import { createNode, createEdge } from '../core/factories'

// Create a new graph instance
const graph = new GraphCore()

// Listen for events
graph.on('node:add', (node) => console.log('Node added:', node))
graph.on('edge:add', (edge) => console.log('Edge added:', edge))
graph.on('node:update', (node) => console.log('Node updated:', node))
graph.on('edge:update', (edge) => console.log('Edge updated:', edge))
graph.on('node:delete', (id) => console.log('Node deleted:', id))
graph.on('edge:delete', (id) => console.log('Edge deleted:', id))
graph.on('graph:clear', () => console.log('Graph cleared'))

// Add nodes
const nodeA = createNode('person', { name: 'Alice' })
const nodeB = createNode('person', { name: 'Bob' })
graph.addNode(nodeA)
graph.addNode(nodeB)

// Add edge
const edge = createEdge('friend', nodeA.id, nodeB.id, { since: 2023 })
graph.addEdge(edge)

// Update node
graph.updateNode(nodeA.id, { data: { name: 'Alice Smith' } })

// Delete edge
graph.deleteEdge(edge.id)

// Delete node
graph.deleteNode(nodeB.id)

// Print final state
console.log('Final nodes:', graph.getNodes())
console.log('Final edges:', graph.getEdges())
