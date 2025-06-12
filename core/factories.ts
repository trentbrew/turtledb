import type { Node, Edge } from './types'

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function createNode<T = any>(type: string, data: T): Node<T> {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    type,
    data,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEdge<T = any>(type: string, sourceNodeId: string, targetNodeId: string, data: T): Edge<T> {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    type,
    sourceNodeId,
    targetNodeId,
    data,
    createdAt: now,
    updatedAt: now,
  }
}
