// Minimal event emitter for framework-agnostic core

type Listener = (...args: any[]) => void

export class EventEmitter {
  private listeners: Record<string, Listener[]> = {}

  on(event: string, fn: Listener) {
    ;(this.listeners[event] ||= []).push(fn)
  }

  off(event: string, fn: Listener) {
    this.listeners[event] = (this.listeners[event] || []).filter((l) => l !== fn)
  }

  emit(event: string, ...args: any[]) {
    ;(this.listeners[event] || []).forEach((fn) => fn(...args))
  }
}
