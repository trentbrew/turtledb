# TurtleDB Roadmap

This roadmap outlines the major milestones and future directions for TurtleDB, based on the vision in context.md.

---

## Milestones

| Milestone                       | Description                                                    | Status      |
| ------------------------------- | -------------------------------------------------------------- | ----------- |
| Core Graph API                  | Unified, type-safe, event-driven graph CRUD                    | In Progress |
| Framework Adapters              | Vue, React, Angular, Svelte, and custom adapter support        | In Progress |
| Offline Persistence             | IndexedDB/Localbase integration for offline-first UX           | Planned     |
| Cloud Sync                      | Pluggable backend adapters (Pocketbase, Supabase, custom APIs) | Planned     |
| NLQ Pipeline (MVP)              | Semantic parsing, schema mapping, Prolog-inspired logic engine | Planned     |
| NLQ + LLM/Embedding Integration | Optional external LLM/embedding service for advanced NLQ       | Planned     |
| Schema & Rule Tooling           | Authoring, testing, and sharing schema/rules for NLQ           | Planned     |
| Performance Optimization        | Caching, large-graph support, async queries                    | Planned     |
| Community & Contribution        | Docs, examples, contribution guidelines, governance            | Planned     |

---

## Open Questions & Future Directions

- **Schema Evolution:** How to support live schema changes and migrations?
- **Rule Authoring UX:** How to make logic rule creation accessible to non-experts?
- **NLQ Disambiguation:** How to handle ambiguous or incomplete queries in the UI?
- **Graph Algorithms:** Should TurtleDB include built-in algorithms (shortest path, etc.)?
- **Multi-User/Realtime:** How to support collaborative, multi-user graph editing?
- **Security & Access Control:** How to model permissions in the graph?
- **Plugin Ecosystem:** How to enable third-party plugins for new backends, adapters, or NLQ features?

---

## How to Contribute

- See [FAQ](faq.md) and [Architecture](architecture.md) for design context.
- Open issues or PRs for features, bugfixes, or documentation.
- Propose new adapters, backends, or NLQ modules.

---

TurtleDB is an ambitious, community-driven project. Your feedback and contributions will help shape the future of intelligent, reactive data layers.
