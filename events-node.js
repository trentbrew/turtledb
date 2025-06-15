/**
 * Minimal event emitter for framework-agnostic core - Node.js version
 */

export class EventEmitter {
  constructor() {
    this.listeners = {}
  }

  on(event, fn) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(fn)
  }

  off(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== fn)
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((fn) => fn(...args))
    }
  }
}
