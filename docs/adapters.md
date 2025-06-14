# TurtleDB Adapters

TurtleDB is designed to be framework-agnostic at its core, with thin adapters that provide seamless, idiomatic integration for any UI framework.

---

## Philosophy

- **Separation of Concerns:** Core logic is pure TypeScript/JavaScript—no framework dependencies.
- **Adapters:** Provide reactivity, state management, and ergonomic APIs for each framework (Vue, React, Angular, etc.).
- **Extensible:** Easy to build custom adapters for new frameworks or state systems.

---

## Supported Adapters (Vision)

| Framework | Adapter Import            | Usage Example                               |
| --------- | ------------------------- | ------------------------------------------- |
| Vue       | turtledb/adapters/vue     | `const { nodesOfType } = useGraph()`        |
| React     | turtledb/adapters/react   | `const { nodes, addNode } = useGraphData()` |
| Angular   | turtledb/adapters/angular | `graphService.nodes$` (Observable)          |

---

## Vue Example

```ts
import { useGraph } from 'turtledb/adapters/vue';
const { nodes, addNode, nodesOfType } = useGraph();
```

## React Example

```ts
import { useGraphData } from 'turtledb/adapters/react';
const { nodes, addNode } = useGraphData();
```

## Angular Example

```ts
import { GraphService } from 'turtledb/adapters/angular';
// Inject GraphService and subscribe to nodes$
```

---

## Building a Custom Adapter

1. **Subscribe to core graph events** (add, update, delete, clear).
2. **Expose state** in your framework's idioms (refs, observables, signals, etc.).
3. **Wrap core CRUD methods** for ergonomic use.

### Example: Svelte Adapter (Concept)

```ts
import { writable } from 'svelte/store';
import { GraphCore } from 'turtledb/core/graph';
const graph = new GraphCore();
export const nodes = writable(graph.getNodes());
graph.on('node:add', () => nodes.set(graph.getNodes()));
// ...repeat for other events
```

---

## Adapter Best Practices

- Keep adapters thin—no business logic, just reactivity and API mapping.
- Always use the core factories/types for node/edge creation.
- Encourage use of selectors/composables for feature logic.

---

For more, see [Usage](usage.md) and [Architecture](architecture.md).
