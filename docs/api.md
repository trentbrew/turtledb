# 🛠️ API Reference

Complete reference for all TurtleDB methods, events, and configuration options.

## 📚 Table of Contents

- [GraphCore Class](#graphcore-class)
- [Node Operations](#node-operations)
- [Edge Operations](#edge-operations)
- [Search & Query](#search--query)
- [Persistence](#persistence)
- [Events](#events)
- [Utilities](#utilities)
- [Configuration](#configuration)
- [Types & Interfaces](#types--interfaces)

## GraphCore Class

### Constructor

```javascript
import { GraphCore } from "turtle-db";

const graph = new GraphCore(schema, options);
```

**Parameters:**

- `schema` (Object): The graph schema defining node and edge types
- `options` (Object, optional): Configuration options

**Options:**

- `scanOnLoad: boolean` - Auto-enrich nodes on load (default: `false`)
- `embeddingFn: function` - Custom embedding function (default: built-in)

**Example:**

```javascript
const graph = new GraphCore(mySchema, {
  scanOnLoad: true,
  embeddingFn: customEmbeddingFunction,
});
```

## Node Operations

### createNode()

Creates a new node with automatic embedding generation.

```javascript
const node = await graph.createNode(type, data);
```

**Parameters:**

- `type` (string): Node type as defined in schema
- `data` (Object): Node data matching schema requirements

**Returns:** Promise<Node>

**Example:**

```javascript
const user = await graph.createNode("person", {
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "developer",
});

console.log(user.id); // Auto-generated UUID
console.log(user.embedding); // 384-dimensional vector
```

**Throws:**

- `ValidationError` - If data doesn't match schema
- `EmbeddingError` - If embedding generation fails

### getNode()

Retrieves a node by ID.

```javascript
const node = graph.getNode(nodeId);
```

**Parameters:**

- `nodeId` (string): The node's unique identifier

**Returns:** Node | null

**Example:**

```javascript
const node = graph.getNode("123e4567-e89b-12d3-a456-426614174000");
if (node) {
  console.log(node.data.name);
}
```

### getNodes()

Retrieves all nodes, optionally filtered by type.

```javascript
const nodes = graph.getNodes(type);
```

**Parameters:**

- `type` (string, optional): Filter by node type

**Returns:** Array<Node>

**Example:**

```javascript
// Get all nodes
const allNodes = graph.getNodes();

// Get only person nodes
const people = graph.getNodes("person");
```

### updateNode()

Updates an existing node's data.

```javascript
const updatedNode = await graph.updateNode(nodeId, updates);
```

**Parameters:**

- `nodeId` (string): The node's unique identifier
- `updates` (Object): Partial data to update

**Returns:** Promise<Node>

**Example:**

```javascript
const updated = await graph.updateNode(user.id, {
  role: "senior developer",
  skills: ["JavaScript", "Python", "React"],
});

// Embedding is automatically regenerated
console.log("Updated:", updated.data.role);
```

**Events Emitted:**

- `node:update` - When node is successfully updated

### deleteNode()

Deletes a node and all its connected edges.

```javascript
const success = graph.deleteNode(nodeId);
```

**Parameters:**

- `nodeId` (string): The node's unique identifier

**Returns:** boolean

**Example:**

```javascript
const deleted = graph.deleteNode(user.id);
if (deleted) {
  console.log("Node deleted successfully");
}
```

**Events Emitted:**

- `node:delete` - When node is successfully deleted
- `edge:delete` - For each connected edge that's removed

## Edge Operations

### createEdge()

Creates a relationship between two nodes.

```javascript
const edge = graph.createEdge(type, sourceNodeId, targetNodeId, data);
```

**Parameters:**

- `type` (string): Edge type as defined in schema
- `sourceNodeId` (string): Source node ID
- `targetNodeId` (string): Target node ID
- `data` (Object, optional): Additional edge data

**Returns:** Edge

**Example:**

```javascript
const edge = graph.createEdge("authored", author.id, article.id, {
  role: "primary author",
  publishedAt: "2024-03-15",
});

console.log(edge.id); // Auto-generated UUID
```

**Throws:**

- `ValidationError` - If edge type or data is invalid
- `NodeNotFoundError` - If source or target node doesn't exist

### getEdge()

Retrieves an edge by ID.

```javascript
const edge = graph.getEdge(edgeId);
```

**Parameters:**

- `edgeId` (string): The edge's unique identifier

**Returns:** Edge | null

### getEdges()

Retrieves all edges, optionally filtered.

```javascript
const edges = graph.getEdges(filters);
```

**Parameters:**

- `filters` (Object, optional): Filter criteria
  - `type` (string): Filter by edge type
  - `sourceNodeId` (string): Filter by source node
  - `targetNodeId` (string): Filter by target node

**Returns:** Array<Edge>

**Example:**

```javascript
// Get all edges
const allEdges = graph.getEdges();

// Get edges of specific type
const authorships = graph.getEdges({ type: "authored" });

// Get edges from specific node
const userEdges = graph.getEdges({ sourceNodeId: user.id });
```

### updateEdge()

Updates an existing edge's data.

```javascript
const updatedEdge = graph.updateEdge(edgeId, updates);
```

**Parameters:**

- `edgeId` (string): The edge's unique identifier
- `updates` (Object): Partial data to update

**Returns:** Edge

**Example:**

```javascript
const updated = graph.updateEdge(edge.id, {
  role: "co-author",
  lastModified: new Date().toISOString(),
});
```

### deleteEdge()

Deletes an edge.

```javascript
const success = graph.deleteEdge(edgeId);
```

**Parameters:**

- `edgeId` (string): The edge's unique identifier

**Returns:** boolean

## Search & Query

### searchNodes()

Performs semantic search across all nodes.

```javascript
const results = await graph.searchNodes(query, limit);
```

**Parameters:**

- `query` (string): Search query text
- `limit` (number, optional): Maximum results to return (default: 10)

**Returns:** Promise<Array<SearchResult>>

**SearchResult Structure:**

```javascript
{
  node: Node,           // The matching node
  similarity: number,   // Similarity score (0-1)
  score: number        // Alias for similarity
}
```

**Example:**

```javascript
const results = await graph.searchNodes("machine learning", 5);

results.forEach((result, i) => {
  const similarity = (result.similarity * 100).toFixed(1);
  console.log(`${i + 1}. ${result.node.data.title} (${similarity}% match)`);
});
```

### searchNodesByType()

Performs semantic search within a specific node type.

```javascript
const results = await graph.searchNodesByType(type, query, limit);
```

**Parameters:**

- `type` (string): Node type to search within
- `query` (string): Search query text
- `limit` (number, optional): Maximum results to return

**Returns:** Promise<Array<SearchResult>>

**Example:**

```javascript
// Search only within articles
const articles = await graph.searchNodesByType(
  "article",
  "artificial intelligence",
  10,
);
```

### findNodesByField()

Finds nodes by exact field matches.

```javascript
const nodes = graph.findNodesByField(field, value, type);
```

**Parameters:**

- `field` (string): Field name to search
- `value` (any): Value to match
- `type` (string, optional): Node type to search within

**Returns:** Array<Node>

**Example:**

```javascript
// Find users by email
const users = graph.findNodesByField("email", "alice@example.com", "person");

// Find articles by category
const techArticles = graph.findNodesByField(
  "category",
  "technology",
  "article",
);
```

### getConnectedNodes()

Gets nodes connected to a specific node.

```javascript
const connected = graph.getConnectedNodes(nodeId, options);
```

**Parameters:**

- `nodeId` (string): The node's unique identifier
- `options` (Object, optional): Connection options
  - `direction` (string): 'incoming', 'outgoing', or 'both' (default: 'both')
  - `edgeType` (string): Filter by edge type
  - `nodeType` (string): Filter by connected node type

**Returns:** Array<{node: Node, edge: Edge, direction: string}>

**Example:**

```javascript
// Get all connected nodes
const allConnected = graph.getConnectedNodes(user.id);

// Get only outgoing connections
const authored = graph.getConnectedNodes(user.id, {
  direction: "outgoing",
  edgeType: "authored",
});
```

## Persistence

### save()

Saves the entire graph to persistent storage.

```javascript
await graph.save();
```

**Returns:** Promise<void>

**Example:**

```javascript
// Save after making changes
await graph.createNode("person", { name: "Bob" });
await graph.save();
console.log("Graph saved successfully");
```

### load()

Loads the graph from persistent storage.

```javascript
await graph.load();
```

**Returns:** Promise<void>

**Example:**

```javascript
const newGraph = new GraphCore(schema);
await newGraph.load();
console.log(`Loaded ${newGraph.getNodes().length} nodes`);
```

### clear()

Clears all nodes and edges from the graph.

```javascript
graph.clear();
```

**Returns:** void

**Events Emitted:**

- `graph:clear` - When graph is cleared

**Example:**

```javascript
graph.clear();
console.log("Graph cleared");
```

## Soft Links

### generateSoftLinks()

Generates automatic relationships based on semantic similarity.

```javascript
await graph.generateSoftLinks(threshold);
```

**Parameters:**

- `threshold` (number, optional): Minimum similarity threshold (default: 0.3)

**Returns:** Promise<void>

**Example:**

```javascript
// Generate soft links with default threshold
await graph.generateSoftLinks();

// Use custom threshold
await graph.generateSoftLinks(0.5); // 50% minimum similarity

// Access generated soft links
graph.softLinks.forEach((link) => {
  console.log(`${link.sourceId} ↔ ${link.targetId} (${link.score})`);
});
```

### getSoftLinks()

Retrieves all generated soft links.

```javascript
const softLinks = graph.getSoftLinks();
```

**Returns:** Array<SoftLink>

**SoftLink Structure:**

```javascript
{
  sourceId: string,     // Source node ID
  targetId: string,     // Target node ID
  score: number,        // Similarity score
  type: string         // Link type (e.g., 'semantic_similarity')
}
```

## Events

TurtleDB uses an event-driven architecture. Listen to events to react to graph
changes.

### on()

Registers an event listener.

```javascript
graph.on(eventName, callback);
```

**Parameters:**

- `eventName` (string): Event name to listen for
- `callback` (function): Function to call when event occurs

### off()

Removes an event listener.

```javascript
graph.off(eventName, callback);
```

**Parameters:**

- `eventName` (string): Event name
- `callback` (function): Specific callback to remove (optional)

### Available Events

#### Node Events

```javascript
// Node created
graph.on("node:add", (node) => {
  console.log(`Added ${node.type}: ${node.data.name}`);
});

// Node updated
graph.on("node:update", ({ node, changes }) => {
  console.log(`Updated ${node.id}:`, changes);
});

// Node deleted
graph.on("node:delete", (nodeId) => {
  console.log(`Deleted node: ${nodeId}`);
});
```

#### Edge Events

```javascript
// Edge created
graph.on("edge:add", (edge) => {
  console.log(`Created ${edge.type} relationship`);
});

// Edge updated
graph.on("edge:update", ({ edge, changes }) => {
  console.log(`Updated edge ${edge.id}:`, changes);
});

// Edge deleted
graph.on("edge:delete", (edgeId) => {
  console.log(`Deleted edge: ${edgeId}`);
});
```

#### Graph Events

```javascript
// Graph cleared
graph.on("graph:clear", () => {
  console.log("Graph was cleared");
});

// Graph loaded
graph.on("graph:load", (stats) => {
  console.log(`Loaded ${stats.nodes} nodes, ${stats.edges} edges`);
});
```

## Utilities

### getStats()

Returns statistics about the graph.

```javascript
const stats = graph.getStats();
```

**Returns:** Object with statistics

**Stats Structure:**

```javascript
{
  nodes: number,        // Total number of nodes
  edges: number,        // Total number of edges
  nodeTypes: number,    // Number of different node types
  edgeTypes: number,    // Number of different edge types
  softLinks: number,    // Number of soft links
  byType: {            // Breakdown by type
    nodes: { [type]: count },
    edges: { [type]: count }
  }
}
```

**Example:**

```javascript
const stats = graph.getStats();
console.log(`Graph contains ${stats.nodes} nodes and ${stats.edges} edges`);
console.log("Node types:", Object.keys(stats.byType.nodes));
```

### validateSchema()

Validates a schema definition.

```javascript
import { validateSchema } from "turtle-db";

const isValid = validateSchema(schema);
```

**Parameters:**

- `schema` (Object): Schema to validate

**Returns:** boolean

**Throws:** ValidationError with details if schema is invalid

**Example:**

```javascript
try {
  validateSchema(mySchema);
  console.log("✅ Schema is valid");
} catch (error) {
  console.error("❌ Schema validation failed:", error.message);
}
```

### generateId()

Generates a unique identifier.

```javascript
import { generateId } from "turtle-db";

const id = generateId();
```

**Returns:** string (UUID v4)

## Configuration

### Environment Variables

TurtleDB respects these environment variables:

- `TURTLE_DB_STORAGE_PATH` - Custom storage path for persistence
- `TURTLE_DB_EMBEDDING_MODEL` - Custom embedding model name
- `TURTLE_DB_LOG_LEVEL` - Logging level (debug, info, warn, error)

### Storage Configuration

```javascript
// Custom storage path
const graph = new GraphCore(schema, {
  storagePath: "./custom-data-path",
});
```

### Embedding Configuration

```javascript
// Custom embedding function
const graph = new GraphCore(schema, {
  embeddingFn: async (text) => {
    // Your custom embedding logic
    return await customEmbeddingService(text);
  },
});

// Disable embeddings (uses deterministic fallback)
const graph = new GraphCore(schema, {
  embeddingFn: null,
});
```

## Types & Interfaces

### Node

```typescript
interface Node {
  id: string; // Unique identifier
  type: string; // Node type from schema
  data: Record<string, any>; // Node data
  embedding?: number[]; // 384-dimensional vector
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Edge

```typescript
interface Edge {
  id: string; // Unique identifier
  type: string; // Edge type from schema
  sourceNodeId: string; // Source node ID
  targetNodeId: string; // Target node ID
  data: Record<string, any>; // Edge data
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### SearchResult

```typescript
interface SearchResult {
  node: Node; // The matching node
  similarity: number; // Similarity score (0-1)
  score: number; // Alias for similarity
}
```

### Schema

```typescript
interface Schema {
  node_types: {
    [typeName: string]: {
      name: string;
      description: string;
      data: {
        [fieldName: string]: FieldDefinition;
      };
    };
  };
  edge_types: {
    [typeName: string]: {
      name: string;
      description: string;
      source: ConnectionDefinition;
      target: ConnectionDefinition;
      data: {
        [fieldName: string]: FieldDefinition;
      };
    };
  };
}
```

### FieldDefinition

```typescript
interface FieldDefinition {
  type: "string" | "number" | "boolean" | "array";
  required: boolean;
  enum?: string[]; // For string fields
  default?: any; // Default value
}
```

### ConnectionDefinition

```typescript
interface ConnectionDefinition {
  node_type: string; // Target node type
  multiple: boolean; // Allow multiple connections
  required: boolean; // Connection is required
}
```

## Error Handling

TurtleDB throws specific error types for different scenarios:

### ValidationError

Thrown when data doesn't match schema requirements.

```javascript
try {
  await graph.createNode("person", {
    // Missing required 'name' field
    email: "test@example.com",
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Validation failed:", error.message);
    console.error("Field errors:", error.fieldErrors);
  }
}
```

### NodeNotFoundError

Thrown when referencing a non-existent node.

```javascript
try {
  graph.createEdge("follows", "invalid-id", user.id);
} catch (error) {
  if (error instanceof NodeNotFoundError) {
    console.error("Node not found:", error.nodeId);
  }
}
```

### EmbeddingError

Thrown when embedding generation fails.

```javascript
try {
  await graph.createNode("article", { title: "Test" });
} catch (error) {
  if (error instanceof EmbeddingError) {
    console.error("Embedding failed:", error.message);
    // Graph will use deterministic fallback
  }
}
```

## Performance Tips

### Batch Operations

```javascript
// Efficient: Batch create nodes
const nodes = await Promise.all([
  graph.createNode("person", person1Data),
  graph.createNode("person", person2Data),
  graph.createNode("person", person3Data),
]);

// Less efficient: Sequential creation
for (const personData of people) {
  await graph.createNode("person", personData); // Slow
}
```

### Search Optimization

```javascript
// Cache search results for repeated queries
const searchCache = new Map();

async function cachedSearch(query, limit) {
  const key = `${query}:${limit}`;
  if (searchCache.has(key)) {
    return searchCache.get(key);
  }

  const results = await graph.searchNodes(query, limit);
  searchCache.set(key, results);
  return results;
}
```

### Memory Management

```javascript
// Clear event listeners when done
const handler = (node) => console.log("Node added:", node.id);
graph.on("node:add", handler);

// Later...
graph.off("node:add", handler);

// Or clear all listeners for an event
graph.off("node:add");
```

## Migration & Compatibility

### Schema Versioning

```javascript
// Include version in your schema
const schema = {
  version: "2.0.0",
  node_types: {
    // Updated types
  },
  edge_types: {
    // Updated relationships
  },
};

// Handle version differences
if (loadedSchema.version !== currentSchema.version) {
  await migrateSchema(loadedSchema, currentSchema);
}
```

### Data Migration

```javascript
// Migrate existing data to new schema
async function migrateToV2() {
  const nodes = graph.getNodes();

  for (const node of nodes) {
    if (node.type === "user" && !node.data.role) {
      // Add default role for existing users
      await graph.updateNode(node.id, {
        role: "user",
      });
    }
  }

  await graph.save();
}
```

---

## 🚀 Next Steps

- **[Getting Started Guide](./getting-started.md)** - Build your first graph
- **[Schema Design Guide](./schema-guide.md)** - Design effective schemas
- **[Embeddings Guide](./embeddings.md)** - Master semantic search
- **[Framework Integration](./frameworks.md)** - Connect to your frontend

Ready to build something amazing with TurtleDB? 🐢✨
