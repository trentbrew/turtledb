/**
 * Simple in-memory storage for Node.js - replaces localforage
 * In a real application, you might want to use a file-based or database storage
 */

class MemoryStorage {
  constructor(name) {
    this.name = name
    this.data = new Map()
  }

  async setItem(key, value) {
    this.data.set(key, value)
    return value
  }

  async getItem(key) {
    return this.data.get(key) || null
  }

  async removeItem(key) {
    this.data.delete(key)
  }

  async clear() {
    this.data.clear()
  }

  async keys() {
    return Array.from(this.data.keys())
  }

  async length() {
    return this.data.size
  }
}

// Factory function to mimic localforage.createInstance
export function createInstance(options = {}) {
  return new MemoryStorage(options.name || 'default')
}

// Default instance
export default createInstance()
