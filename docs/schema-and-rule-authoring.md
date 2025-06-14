# Schema & Rule Authoring Guide for TurtleDB

This guide explains how to define your domain schema and author logic rules for TurtleDB's Prolog-inspired NLQ engine. The goal: make your data model discoverable, semantic, and ready for powerful natural language queries.

---

## 1. Defining Your Schema

### Node Types

- **What:** Each entity in your app (user, comment, collection, etc.) is a node type.
- **How:**
  - Give each type a unique name (e.g., 'member', 'post').
  - Provide a semantic description (for NLQ mapping).
  - Define the data shape (TypeScript interface).

```ts
// Example: Member node type
type NodeType = {
  name: 'member';
  description: 'A person who is part of the application';
  data: Member; // interface Member { name: string; age: number }
};
```

### Edge Types

- **What:** Relationships between nodes (e.g., 'knows', 'comments_on').
- **How:**
  - Unique name and semantic description.
  - Source/target node types.
  - Data shape (if any).

```ts
// Example: Knows edge type
type EdgeType = {
  name: 'knows';
  description: 'Represents a friendship or acquaintance';
  source: 'member';
  target: 'member';
  data: { since: number };
};
```

### Schema Config

- **Centralize** your node/edge type definitions in a schema config object.
- **Include** synonyms and natural language hints for better NLQ.

```ts
const schema = {
  nodes: [
    {
      name: 'member',
      description: 'A user/member of the app',
      synonyms: ['user', 'person'],
    },
    {
      name: 'post',
      description: 'A post or message',
      synonyms: ['message', 'article'],
    },
    // ...
  ],
  edges: [
    {
      name: 'knows',
      description: 'Friendship',
      source: 'member',
      target: 'member',
      synonyms: ['friend', 'acquaintance'],
    },
    // ...
  ],
};
```

---

## 2. Writing Logic Rules

TurtleDB's NLQ engine uses Prolog-style rules to express relationships and constraints.

### Rule Basics

- **Format:** `head :- body.` ("head is true if body is true")
- **Variables:** Start with uppercase (e.g., `Member`, `Post`).
- **Predicates:** Refer to node/edge types or custom relationships.

### Example Rules

**Direct relationship:**

```ts (prolog)
// Rule: Defines a direct relationship between two members
// Usage: knows(Member, Friend) will find all friend pairs

knows(Member, Friend) :- edge('knows', Member, Friend).
```

**Property filter:**

```ts (prolog)
// Rule: Filters members by age property
// Usage: member_over_30(Member) finds all members older than 30

member_over_30(Member) :- node('member', Member), Member.age > 30.
```

**Multi-hop relationship:**

```ts (prolog)
// Rule: Finds indirect friendships through a common friend
// Usage: friend_of_friend(A, C) finds all pairs connected through one intermediate friend

friend_of_friend(A, C) :- knows(A, B), knows(B, C).
```

**Combining filters and relationships:**

```ts (prolog)
// Rule: Finds members who know Sarah and are over 30
// Usage: member_knows_sarah_over_30(Member) finds all members who know Sarah and are older than 30

member_knows_sarah_over_30(Member) :-
  node('member', Member),
  Member.age > 30,
  knows(Member, Sarah),
  node('member', Sarah),
  Sarah.name = 'Sarah'.
```

---

## 3. Best Practices for NLQ

- **Write clear descriptions and synonyms** for all types and properties.
- **Favor composable, small rules** over giant, monolithic ones.
- **Use property constraints** to enable queries like "members over 30".
- **Test rules** with sample queries and data.
- **Iterate:** Refine rules as your schema or NLQ needs evolve.

---

## 4. Example: Schema + Rules for a Social App

```ts
// Schema
const schema = {
  nodes: [
    { name: 'member', description: 'A user', synonyms: ['user', 'person'] },
    { name: 'post', description: 'A post', synonyms: ['message'] },
  ],
  edges: [
    {
      name: 'knows',
      description: 'Friendship',
      source: 'member',
      target: 'member',
      synonyms: ['friend'],
    },
    {
      name: 'wrote',
      description: 'Authorship',
      source: 'member',
      target: 'post',
      synonyms: ['authored'],
    },
  ],
};
```

```prolog
// Rules
knows(Member, Friend) :- edge('knows', Member, Friend).
member_over_30(Member) :- node('member', Member), Member.age > 30.
member_wrote_post(Member, Post) :- edge('wrote', Member, Post).
```

---

## 5. Tips for Maintainability & Evolution

- **Centralize schema and rules** in version-controlled files.
- **Document** each type and rule with intent and usage examples.
- **Review and refactor** as your app grows or NLQ needs change.
- **Encourage contributions** from both devs and domain experts.

---

For more, see [Natural Language Queries](natural-language-queries.md) and [Roadmap](roadmap.md).
