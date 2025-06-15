// Minimal event emitter for framework-agnostic core
export class EventEmitter {
    listeners = {};
    on(event, fn) {
        (this.listeners[event] ||= []).push(fn);
    }
    off(event, fn) {
        this.listeners[event] = (this.listeners[event] || []).filter((l) => l !== fn);
    }
    emit(event, ...args) {
        (this.listeners[event] || []).forEach((fn) => {
            fn(...args);
        });
    }
}
//# sourceMappingURL=events.js.map