# TurtleDB Task List

This is a living checklist for TurtleDB development. Update as you go!

---

## Core Graph Engine

| ID      | Task                                    | Priority | Difficulty | Status |
| ------- | --------------------------------------- | -------- | ---------- | ------ |
| TDB-001 | Implement unified, type-safe graph CRUD | High     | MD         | Done   |
| TDB-002 | Event system for graph changes          | High     | S          | Done   |
| TDB-003 | Core factories for node/edge creation   | High     | S          | Done   |
| TDB-037 | Scan utility: Convert JSON to nodes     | Med      | MD         | To Do  |

## Framework Adapters

| ID      | Task                                   | Priority | Difficulty | Status |
| ------- | -------------------------------------- | -------- | ---------- | ------ |
| TDB-004 | Vue adapter (Pinia/composables)        | High     | MD         | To Do  |
| TDB-005 | React adapter (hooks/state)            | High     | MD         | To Do  |
| TDB-006 | Angular adapter (services/observables) | Med      | MD         | To Do  |
| TDB-007 | Svelte adapter (stores)                | Low      | MD         | To Do  |
| TDB-008 | Custom adapter template                | Med      | S          | To Do  |

## Persistence & Sync

| ID      | Task                                      | Priority | Difficulty | Status |
| ------- | ----------------------------------------- | -------- | ---------- | ------ |
| TDB-009 | Offline persistence (Localbase/IndexedDB) | High     | MD         | To Do  |
| TDB-010 | Cloud sync (Pocketbase, Supabase, etc.)   | High     | LG         | To Do  |
| TDB-011 | Sync strategy: hydrate/refresh            | High     | MD         | To Do  |

## NLQ Pipeline

| ID      | Task                                     | Priority | Difficulty | Status |
| ------- | ---------------------------------------- | -------- | ---------- | ------ |
| TDB-012 | Semantic parsing (NLP pre-processor)     | High     | LG         | To Do  |
| TDB-013 | Schema mapping (type/edge/prop matching) | High     | LG         | To Do  |
| TDB-014 | Prolog-inspired logic engine             | High     | XL         | To Do  |
| TDB-015 | NLQ API: `graph.queryNL()`               | High     | MD         | To Do  |
| TDB-016 | Optional LLM/embedding integration       | Med      | LG         | To Do  |
| TDB-017 | Advanced rule patterns (recursion, etc.) | Med      | LG         | To Do  |
| TDB-018 | Rule testing workflow/CLI                | High     | MD         | To Do  |

## Schema & Rule Authoring

| ID      | Task                                  | Priority | Difficulty | Status |
| ------- | ------------------------------------- | -------- | ---------- | ------ |
| TDB-019 | Schema config format                  | High     | S          | Done   |
| TDB-020 | Rule authoring toolkit                | High     | MD         | To Do  |
| TDB-021 | Rule documentation and examples       | High     | S          | To Do  |
| TDB-022 | Schema/rule file template             | Med      | S          | To Do  |
| TDB-023 | Deep dive: schema evolution/migration | Med      | MD         | To Do  |

## Performance & Optimization

| ID      | Task                                     | Priority | Difficulty | Status |
| ------- | ---------------------------------------- | -------- | ---------- | ------ |
| TDB-024 | Caching for queries and rules            | Med      | MD         | To Do  |
| TDB-025 | Large-graph support (async, chunked ops) | High     | LG         | To Do  |
| TDB-026 | Adapter performance tuning               | Med      | MD         | To Do  |

## Documentation

| ID      | Task                                  | Priority | Difficulty | Status |
| ------- | ------------------------------------- | -------- | ---------- | ------ |
| TDB-027 | Vision-driven docs in `/docs`         | High     | MD         | Done   |
| TDB-028 | Keep docs in sync with implementation | High     | S          | To Do  |
| TDB-029 | Add more deep dives and examples      | Med      | S          | To Do  |

## Testing

| ID      | Task                                        | Priority | Difficulty | Status      |
| ------- | ------------------------------------------- | -------- | ---------- | ----------- |
| TDB-030 | Unit tests for core, adapters, persistence  | High     | MD         | In Progress |
| TDB-031 | Integration tests (end-to-end flows)        | High     | LG         | To Do       |
| TDB-032 | NLQ rule tests (sample queries/results)     | High     | MD         | To Do       |
| TDB-033 | Interactive REPL CLI for graph/rule testing | High     | MD         | Done        |

## Community & Contribution

| ID      | Task                                | Priority | Difficulty | Status |
| ------- | ----------------------------------- | -------- | ---------- | ------ |
| TDB-034 | CONTRIBUTING.md and code of conduct | High     | S          | To Do  |
| TDB-035 | Example projects and demos          | Med      | MD         | To Do  |
| TDB-036 | Issue/PR templates                  | Med      | S          | To Do  |

---

Add new tasks below as the project evolves!
