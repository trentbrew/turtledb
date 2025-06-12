import type { Node, Edge } from './types'
import { EventEmitter } from './events'

export class GraphCore {
  private nodes: Node[] = []
  private edges: Edge[] = []
  private events = new EventEmitter()

  // Event API
  on(event: string, fn: (...args: any[]) => void) {
    this.events.on(event, fn)
  }
  off(event: string, fn: (...args: any[]) => void) {
    this.events.off(event, fn)
  }

  // Node CRUD
  addNode(node: Node) {
    this.nodes.push(node)
    this.events.emit('node:add', node)
  }
  updateNode(id: string, update: Partial<Node>) {
    const node = this.nodes.find((n) => n.id === id)
    if (node) {
      Object.assign(node, update)
      this.events.emit('node:update', node)
    }
  }
  deleteNode(id: string) {
    this.nodes = this.nodes.filter((n) => n.id !== id)
    this.edges = this.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id)
    this.events.emit('node:delete', id)
  }
  getNodes() {
    return [...this.nodes]
  }

  // Edge CRUD
  addEdge(edge: Edge) {
    this.edges.push(edge)
    this.events.emit('edge:add', edge)
  }
  updateEdge(id: string, update: Partial<Edge>) {
    const edge = this.edges.find((e) => e.id === id)
    if (edge) {
      Object.assign(edge, update)
      this.events.emit('edge:update', edge)
    }
  }
  deleteEdge(id: string) {
    this.edges = this.edges.filter((e) => e.id !== id)
    this.events.emit('edge:delete', id)
  }
  getEdges() {
    return [...this.edges]
  }

  // Utility
  clear() {
    this.nodes = []
    this.edges = []
    this.events.emit('graph:clear')
  }
}
