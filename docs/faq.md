# TurtleDB FAQ

## What is TurtleDB?

TurtleDB is a client-side, reactive, graph-based data layer for complex applications. It unifies all app data as nodes and edges in a single, canonical graph, with adapters for any UI framework and pluggable persistence (offline and cloud).

---

## Why a graph model instead of feature stores?

- **Unified relationships:** Graphs naturally model complex, interconnected data.
- **No state drift:** All data is in one place—no risk of out-of-sync feature stores.
- **Powerful queries:** Easily traverse, filter, and relate entities ("show all items related to X").

---

## Do I still need types?

Yes! Types are essential for:

- Defining the shape of node/edge data.
- Ensuring type safety in factories, selectors, and NLQ.
- Preventing runtime errors in a generic graph structure.

---

## How do I access feature-specific data?

Use selectors or composables (not feature stores):

```ts
// Get all members
graph.getNodes().filter((n) => n.type === 'member');
```

Or, via adapters:

```ts
const members = nodesOfType('member'); // Vue/React
```

---

## How does persistence work?

- **Offline-first:** Localbase/IndexedDB for fast, offline access.
- **Cloud sync:** Pluggable adapters for Pocketbase, Supabase, or custom APIs.
- **Sync strategy:** Hydrate from local cache, then refresh from backend.

---

## Is TurtleDB a database?

No. TurtleDB is an in-memory, client-side state manager. It can sync to databases, but is not a backend DB itself.

---

## How is TurtleDB different from a backend graph DB (like Neo4j or graph-db for Deno)?

- **Location:** TurtleDB lives in your frontend, powering the UI. Backend DBs are for persistent storage.
- **Reactivity:** TurtleDB is designed for instant, reactive updates in the UI.
- **Purpose:** TurtleDB orchestrates state, sync, and NLQ for the client; backend DBs focus on storage, indexing, and server-side queries.

---

## How does Natural Language Query (NLQ) work?

- NLQ translates user language into structured, schema-aware graph queries.
- Uses semantic embeddings, schema mapping, and a Prolog-inspired logic engine.
- See [Natural Language Queries](natural-language-queries.md) for details.

---

## What about performance?

- **In-memory graph:** Fast for most UI workloads.
- **Persistence:** Localbase/IndexedDB for offline, cloud for sync.
- **NLQ:** Designed to be efficient, but complex queries may require optimization (e.g., rule caching, schema tuning).

---

## Can I use TurtleDB in any framework?

Yes! The core is framework-agnostic. Use adapters for Vue, React, Angular, or build your own.

---

## What are the tradeoffs?

- **Boilerplate:** Some up-front work to define types, factories, and schema.
- **Learning curve:** New mental model (graph, selectors, NLQ, logic rules).
- **Power:** In return, you get a unified, powerful, and future-proof data layer.

---

For more, see [Architecture](architecture.md), [Usage](usage.md), and [Roadmap](roadmap.md).
