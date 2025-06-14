# TurtleDB Usage Guide

This guide describes the _intended_ developer experience for TurtleDB, focusing on the vision of a unified, reactive, type-safe graph data layer that works in any framework.

---

## 1. Getting Started

### Installation

```sh
npm install turtledb
# or
yarn add turtledb
# or
deno install turtledb
```

### Basic Setup

```ts
import { createGraph } from 'turtledb';

// Create a new graph instance (singleton pattern recommended)
const graph = createGraph();
```

---

## 2. Core API: Graph CRUD

### Adding Nodes and Edges

```ts
import { createNode, createEdge } from 'turtledb';

const alice = createNode('member', { name: 'Alice', age: 30 });
const bob = createNode('member', { name: 'Bob', age: 32 });

graph.addNode(alice);
graph.addNode(bob);

const friendship = createEdge('knows', alice.id, bob.id, { since: 2020 });
graph.addEdge(friendship);
```

### Updating and Deleting

```ts
graph.updateNode(alice.id, { data: { age: 31 } });
graph.deleteEdge(friendship.id);
graph.deleteNode(bob.id);
```

---

## 3. Factories: Type-Safe Creation

```ts
// Define your domain types
interface Member {
  name: string;
  age: number;
}

// Use factories for type safety
const alice = createNode<Member>('member', { name: 'Alice', age: 30 });
```

---

## 4. Selectors & Composables

### Framework-Agnostic (Core)

```ts
// Get all nodes of a type
graph.getNodes().filter((n) => n.type === 'member');
```

### Vue Example (via Adapter)

```ts
import { useGraph } from 'turtledb/adapters/vue';
const { nodesOfType } = useGraph();
const members = nodesOfType('member');
```

### React Example (via Adapter)

```ts
import { useGraphData } from 'turtledb/adapters/react';
const { nodes, addNode } = useGraphData();
```

---

## 5. Persistence & Sync (Vision)

- **Offline-first:** TurtleDB will persist the graph to IndexedDB (Localbase) automatically.
- **Cloud sync:** Pluggable adapters for Pocketbase, Supabase, or custom APIs.
- **No manual sync required:** The graph store will handle hydration and syncing transparently.

---

## 6. Natural Language Queries (Preview)

```ts
// Vision: Query the graph using natural language
const results = await graph.queryNL(
  'Find all members older than 30 who know Sarah',
);
```

---

## 7. Best Practices

- Use factories for all node/edge creation.
- Keep your schema/types up to date for best NLQ and type safety.
- Use selectors/composables for feature-specific logic—never duplicate state.
- Let TurtleDB handle persistence and sync.

---

For advanced topics, see [Natural Language Queries](natural-language-queries.md) and [Adapters](adapters.md).
