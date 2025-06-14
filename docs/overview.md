# TurtleDB Overview

TurtleDB is a next-generation, client-side, reactive graph data layer designed to be the single source of truth for complex, interconnected application data. It is:

- **Graph-centric:** All entities and relationships are modeled as nodes and edges in a canonical graph.
- **Framework-agnostic:** The core is pure TypeScript/JavaScript, with adapters for Vue, React, Angular, and more.
- **Reactive:** Changes to the graph are instantly reflected in the UI via event-driven or observable patterns.
- **Persistence-agnostic:** Supports offline-first (IndexedDB/Localbase) and pluggable cloud backends (Pocketbase, Supabase, custom APIs).
- **Type-safe:** Strong typing for all node/edge data, with factories for safe creation and normalization.
- **Natural Language Query (NLQ) Ready:** Designed for advanced, schema-aware, semantic querying using natural language.

## Why TurtleDB?

- **Unified Data Model:** No more juggling multiple feature stores. All app data lives in a single, traversable graph.
- **Powerful Queries:** Easily express complex relationships ("show all items related to X", "find shortest path between A and B").
- **Offline-First:** Fast, resilient local access with seamless cloud sync.
- **Extensible:** Adapters and plugins for any framework or backend.
- **Future-Proof:** Built for the next wave of UI/AI—semantic search, NLQ, and intelligent data exploration.

## What TurtleDB Is (and Isn't)

- **Is:**
  - A client-side, in-memory, reactive graph state manager.
  - An orchestrator for persistence and sync (not a database itself).
  - A foundation for advanced, domain-aware natural language queries.
- **Is Not:**
  - A backend database (but can sync to one).
  - A replacement for your API or server-side logic.
  - Tied to any one UI framework or backend.

## Core Principles

- **Single Source of Truth:** All CRUD goes through the graph.
- **No Feature Stores:** Feature logic = selectors/composables over the graph.
- **Factories for Safety:** All node/edge creation is type-safe and normalized.
- **Schema-Driven:** The schema is explicit, discoverable, and powers both code and NLQ.
- **NLQ-First Mindset:** The architecture is designed from the ground up to support natural language understanding and semantic search.

---

For a deep dive into the architecture, dataflow, and NLQ pipeline, see the following docs:

- [Architecture](architecture.md)
- [Natural Language Queries](natural-language-queries.md)
- [Usage](usage.md)
- [Adapters](adapters.md)
- [FAQ](faq.md)
- [Roadmap](roadmap.md)
