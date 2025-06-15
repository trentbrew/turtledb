# 🐢 TurtleDB

**Framework-agnostic graph database with real semantic embeddings**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

TurtleDB is a modern graph database that combines the power of **real semantic
embeddings** with **schema validation**, **event-driven architecture**, and
**framework-agnostic design**. Built for Node.js with genuine AI-powered
semantic understanding.

## ✨ Features

- 🧠 **Real Semantic Embeddings** - 384-dimensional vectors using
  `all-MiniLM-L6-v2`
- 🔍 **Semantic Search** - Find content by meaning, not just keywords
- 📋 **Schema Validation** - Type-safe nodes and edges with constraints
- ⚡ **Event-Driven** - React to graph changes in real-time
- 🔗 **Soft Links** - Automatic relationship discovery via embeddings
- 💾 **Persistent Storage** - Save and load your graphs
- 🎯 **Framework Agnostic** - Works with React, Vue, Svelte, or vanilla JS
- 🚀 **Performance** - 3-7ms embedding generation, 23MB memory usage
- 📱 **Offline Ready** - No server dependencies after model download

## 🚀 Quick Start

### Installation

```bash
npm install turtle-db
```

### Basic Usage

```javascript
import { GraphCore } from "turtle-db";

// Define your schema
const schema = {
  node_types: {
    person: {
      name: "person",
      description: "A person in the system",
      data: {
        name: { type: "string", required: true },
        email: { type: "string", required: false },
        role: { type: "string", enum: ["student", "teacher", "admin"] },
      },
    },
    post: {
      name: "post",
      description: "A blog post or article",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
      },
    },
  },
  edge_types: {
    authored: {
      name: "authored",
      description: "Person authored a post",
      source: { node_type: "person", multiple: true, required: false },
      target: { node_type: "post", multiple: false, required: false },
      data: {
        publishedAt: { type: "string", required: false },
      },
    },
  },
};

// Initialize the graph
const graph = new GraphCore(schema);

// Create nodes with automatic embeddings
const author = await graph.createNode("person", {
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "teacher",
});

const article = await graph.createNode("post", {
  title: "Introduction to Machine Learning",
  content:
    "Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models...",
});

// Create relationships
graph.createEdge("authored", author.id, article.id, {
  publishedAt: "2024-03-15",
});

// Semantic search - finds content by meaning!
const results = await graph.searchNodes("artificial intelligence", 5);
console.log("AI-related content:", results);

// Save your graph
await graph.save();
```

## 🧠 Semantic Search in Action

TurtleDB's semantic search understands **meaning**, not just keywords:

```javascript
// Create diverse content
await graph.createNode("post", {
  title: "Deep Learning for Medical Diagnosis",
  content: "Neural networks can analyze medical images to detect diseases...",
});

await graph.createNode("post", {
  title: "Cooking with Pasta",
  content: "Traditional Italian recipes for delicious pasta dishes...",
});

// Search by meaning
const aiResults = await graph.searchNodes("artificial intelligence", 3);
// Returns: Deep Learning post (high similarity)

const medicalResults = await graph.searchNodes("healthcare research", 3);
// Returns: Medical Diagnosis post (high similarity)

const foodResults = await graph.searchNodes("Italian cuisine", 3);
// Returns: Pasta post (high similarity)
```

**Real Results:**

- AI content clusters together (48.6% similarity)
- Medical content groups naturally (34.7% similarity)
- Cross-domain discrimination (0.01-0.06% similarity)

## 📊 Event-Driven Architecture

React to graph changes in real-time:

```javascript
// Listen to graph events
graph.on("node:add", (node) => {
  console.log(`New ${node.type} added:`, node.data.name || node.data.title);
});

graph.on("edge:add", (edge) => {
  console.log(`New relationship: ${edge.type}`);
});

graph.on("node:update", ({ node, changes }) => {
  console.log(`Node ${node.id} updated:`, changes);
});

// Events fire automatically
await graph.createNode("person", { name: "Bob Smith" });
// → "New person added: Bob Smith"
```

## 🔗 Automatic Soft Links

TurtleDB discovers relationships automatically using embeddings:

```javascript
// Generate soft links based on semantic similarity
await graph.generateSoftLinks();

// Access discovered relationships
graph.softLinks.forEach((link) => {
  console.log(`${link.sourceId} ↔ ${link.targetId} (${link.score}% similar)`);
});

// Example output:
// "AI Research" ↔ "Machine Learning Guide" (87% similar)
// "Medical AI" ↔ "Healthcare Analytics" (76% similar)
```

## 📋 Schema Validation

Type-safe schemas with automatic validation:

```javascript
// This works ✅
const validNode = await graph.createNode("person", {
  name: "John Doe", // required string ✅
  role: "teacher", // valid enum value ✅
});

// This throws an error ❌
try {
  await graph.createNode("person", {
    // Missing required 'name' field
    role: "invalid_role", // Invalid enum value
  });
} catch (error) {
  console.log("Schema validation caught the error!");
}
```

## 🎯 Framework Integration

### React

```javascript
import { GraphCore } from "turtle-db";
import { useEffect, useState } from "react";

function useGraph(schema) {
  const [graph] = useState(() => new GraphCore(schema));
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    graph.on("node:add", () => setNodes(graph.getNodes()));
    graph.on("node:update", () => setNodes(graph.getNodes()));
    graph.on("node:delete", () => setNodes(graph.getNodes()));

    return () => {
      graph.off("node:add");
      graph.off("node:update");
      graph.off("node:delete");
    };
  }, [graph]);

  return { graph, nodes };
}
```

### Vue 3

```javascript
import { GraphCore } from "turtle-db";
import { onMounted, onUnmounted, ref } from "vue";

export function useGraph(schema) {
  const graph = new GraphCore(schema);
  const nodes = ref([]);

  const updateNodes = () => {
    nodes.value = graph.getNodes();
  };

  onMounted(() => {
    graph.on("node:add", updateNodes);
    graph.on("node:update", updateNodes);
    graph.on("node:delete", updateNodes);
  });

  onUnmounted(() => {
    graph.off("node:add", updateNodes);
    graph.off("node:update", updateNodes);
    graph.off("node:delete", updateNodes);
  });

  return { graph, nodes };
}
```

### Svelte

```javascript
import { GraphCore } from "turtle-db";
import { writable } from "svelte/store";

export function createGraphStore(schema) {
  const graph = new GraphCore(schema);
  const nodes = writable([]);

  const updateNodes = () => {
    nodes.set(graph.getNodes());
  };

  graph.on("node:add", updateNodes);
  graph.on("node:update", updateNodes);
  graph.on("node:delete", updateNodes);

  return {
    graph,
    nodes,
    destroy: () => {
      graph.off("node:add", updateNodes);
      graph.off("node:update", updateNodes);
      graph.off("node:delete", updateNodes);
    },
  };
}
```

## 📈 Performance

TurtleDB is built for production use:

- **Embedding Generation**: 3-7ms per text
- **Memory Usage**: 23MB total (including model)
- **Model Size**: 23MB (quantized for efficiency)
- **Dimensions**: 384 (production-ready)
- **Offline**: No server dependencies after initial download

## 🛠️ API Reference

### GraphCore

```javascript
import { GraphCore } from "turtle-db";

const graph = new GraphCore(schema, options);
```

**Options:**

- `scanOnLoad: boolean` - Auto-enrich nodes on load (default: false)
- `embeddingFn: function` - Custom embedding function

**Methods:**

- `createNode(type, data)` - Create node with embedding
- `createEdge(type, sourceId, targetId, data)` - Create relationship
- `searchNodes(query, limit)` - Semantic search
- `generateSoftLinks()` - Discover relationships
- `save()` / `load()` - Persistence
- `getStats()` - Graph analytics

### Events

- `node:add` - Node created
- `node:update` - Node modified
- `node:delete` - Node removed
- `edge:add` - Edge created
- `edge:update` - Edge modified
- `edge:delete` - Edge removed
- `graph:clear` - Graph cleared

## 🧪 Testing

```bash
# Run the comprehensive demo
npm run demo-graph

# Test the core functionality
npm run test-graph

# Test embeddings specifically
npm run demo-node
```

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [Schema Design Guide](./docs/schema-guide.md)
- [Embedding & Search Guide](./docs/embeddings.md)
- [API Reference](./docs/api.md)
- [Framework Integration](./docs/frameworks.md)
- [Migration from Deno](./docs/migration.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md)
for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- [Xenova/transformers](https://github.com/xenova/transformers.js) - Bringing
  Hugging Face transformers to JavaScript
- [tau-prolog](https://github.com/tau-prolog/tau-prolog) - Prolog interpreter
  for JavaScript
- The amazing open-source AI community

---

**Built with ❤️ for the future of semantic data**
