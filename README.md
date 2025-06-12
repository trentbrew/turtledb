# module-sandbox

A playground for developing a **framework-agnostic graph data layer** and adapters for various UI frameworks.

## Purpose

- Isolate and develop a pure TypeScript graph core (nodes, edges, CRUD, events) with no UI framework dependencies.
- Provide adapters for Vue, React, and Angular to demonstrate integration.
- Enable CLI/demo usage to prove the core works standalone.

## Structure

```
module-sandbox/
  core/
    graph.ts         # Pure graph logic (nodes, edges, CRUD, events)
    factories.ts     # Node/edge factory functions
    types.ts         # Type definitions (Node, Edge, etc.)
    events.ts        # Simple event emitter/observable
    localbase.ts     # (Optional) Localbase wrapper, framework-agnostic
  adapters/
    vue.ts           # Vue composable or Pinia store adapter
    react.ts         # React hook adapter (optional)
    angular.ts       # Angular service adapter (optional)
  demo/
    cli.ts           # Node.js CLI demo to prove core works standalone
    test-data.ts     # Example data for testing
  README.md
```

## Usage

- Develop and test the core logic in `core/`.
- Build adapters in `adapters/` for your target frameworks.
- Use `demo/cli.ts` to run and test the core without any UI framework.

## Getting Started

1. Explore `core/graph.ts` for the main graph logic.
2. Use or extend `core/events.ts` for event-driven updates.
3. Write or adapt framework-specific adapters in `adapters/`.
4. Run the CLI demo to validate the core.

---

This is a sandbox—iterate, experiment, and refactor freely!
